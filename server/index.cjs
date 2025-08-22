const express = require('express');
const path = require('path');
require('dotenv').config(); 
const cors = require('cors');
const pool = require('./db.cjs');
const app = express();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const { awsAccess } = require('./aws.cjs');
const { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand} = require("@aws-sdk/client-s3");
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const uuid = require('uuid');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const generateToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

app.use(cors({
  origin: '*'
}));

app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 3000;

app.use(session({
  store: new pgSession({
    pool: pool,             
    tableName: 'session',
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

awsAccess();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.AWS_BUCKET_NAME;

app.get('/api/images/event/:eventId', async (req, res) => {
  const { eventId } = req.params;

  try {
    // Fetch images associated with the given eventId
    const query = `
      SELECT 
        i.*,
        e.title AS event_title,
        u.name AS user_name
      FROM images i
      LEFT JOIN event e ON i.associated_event_id = e.id
      LEFT JOIN users u ON i.user_id = u.user_id
      WHERE i.associated_event_id = $1
    `;
    const imagesData = await pool.query(query, [eventId]);

    // Format response
    const images = imagesData.rows.map(img => ({
      url: img.url,
      title: img.title,
      id: img.image_id,
      description: img.description,
      name: img.name,
      tags: img.tags,
      author: img.user_id,
      author_name: img.user_name,
      upload_date: img.upload_date,
      associated_event_id: img.associated_event_id,
      event_name: img.event_title || null,
    }));

    res.json(images);
  } catch (err) {
    console.error('Error fetching event images:', err);
    res.status(500).json({ error: 'Failed to fetch event images' });
  }
});


app.get('/api/images', async (req, res) => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'images/'
  });

  try {
    const { Contents } = await s3Client.send(command);
    if (!Contents || Contents.length === 0) { return res.status(200).json([])}

    const imageUrls = Contents.map(file => `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`);

    const query = `
    SELECT 
      i.*,
      e.title AS event_title -- Fetch event title if associated_event_id is not null
    FROM images i
    LEFT JOIN event e ON i.associated_event_id = e.id
    WHERE i.url = ANY($1)
    `;

    const imagesData = await pool.query(query, [imageUrls]);

    // Combined
    const images = imagesData.rows.map(img => ({
      url: img.url,
      title: img.title,
      id: img.image_id,
      description: img.description,
      name: img.name,
      tags: img.tags,
      author: img.user_id,
      upload_date: img.upload_date,
      associated_event_id: img.associated_event_id ,
      event_name: img.event_title || null,
  }));

    return res.json(images);
  } catch (err) {
    console.error("Failed to retrieve images:", err);
    return res.status(500).send("Failed to retrieve images");
  }
});

app.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.session.user) {
    return res.status(403).send('Not authenticated');
  }

  const user_id = req.session.user.user_id; 
  const imageId = uuid.v4();
  const key = `images/${imageId}.jpg`;
  const {
    eventId = null, // Optional: Associate directly with an event
    associated_event_id = null, // Optional: Separate event association
    name = "Untitled",
    description = "An Image.",
    title = "New Image",
  } = req.body;
  const tags = []
  const imageFile = req.file.buffer;


  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: imageFile,
      ContentType: req.file.mimetype
    });

    await s3Client.send(command);

    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    const insertQuery = `INSERT INTO images (image_id, user_id, event_id, name, tags, title, description, url, associated_event_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;`;

    const result = await pool.query(insertQuery, [imageId, user_id, eventId, name, tags, title, description, imageUrl, associated_event_id]);
    const newImage = result.rows[0];

    return res.json({
      url: newImage.url,
      title: newImage.title,
      description: newImage.description,
      eventId: eventId || null,
      associated_event_id: associated_event_id|| null,
      name: newImage.name,
      tags: newImage.tags,
      author: newImage.user_id,
      upload_date: newImage.upload_date,
    }); 
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/api/delete-images', async (req, res) => {
  const { images } = req.body; // These are image IDs now

  try {
    // Log the received image IDs
    console.log('Received image IDs for deletion:', images);

    // Fetch URLs for the given IDs from the database
    const result = await pool.query('SELECT url FROM images WHERE image_id = ANY($1)', [images]);
    const urls = result.rows.map((row) => row.url);

    console.log('Fetched URLs for deletion:', urls);

    // Extract the S3 keys from the URLs
    const keys = urls.map((url) => {
      if (!url) {
        console.error('Invalid URL:', url);
        throw new Error('Invalid URL');
      }
      return new URL(url).pathname.substring(1);
    });

    console.log('S3 keys to delete:', keys);

    // Delete images from the S3 bucket
    await Promise.all(
      keys.map((key) => {
        const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        });
        return s3Client.send(command);
      })
    );

    // Delete the corresponding database entries
    await pool.query('DELETE FROM images WHERE image_id = ANY($1)', [images]);

    res.send({ status: 'success' });
  } catch (error) {
    console.error('Error deleting images:', error);
    res.status(500).send({ status: 'error', message: error.message });
  }
});


app.put('/api/images/:id', async (req, res) => {
  const { id } = req.params; 
  const { name, description, tags, associatedEventId } = req.body; 

  try {
    const query = `
      UPDATE images 
      SET name = $1, description = $2, tags = $3, associated_event_id = $4
      WHERE image_id = $5
      RETURNING *;
    `;

    const eventId = associatedEventId === '' ? null : associatedEventId;

    const result = await pool.query(query, [name, description, tags, eventId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating image:', err);
    res.status(500).json({ error: 'Error updating image.' });
  }
})

// Endpoint to update application status and send invitation if accepted
app.patch('/api/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { accepted } = req.body;

  try {
    const updateQuery = 'UPDATE membership_applications SET accepted = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(updateQuery, [accepted, id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Application not found');
    }

    const application = result.rows[0];

    if (accepted) {
      // Unique registration token + new user entry in table
      const registrationToken = crypto.randomBytes(32).toString('hex');

      const insertUserQuery = `
        INSERT INTO users (email, registration_token, name, type, admin)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
        RETURNING user_id
      `;
      const insertResult = await pool.query(insertUserQuery, [application.email, registrationToken, application.full_name, application.membership_type, false,]);

      if (insertResult.rows.length === 0) {
        return res.status(400).send('User already exists.');
      }

      const registrationLink = `https://owl2club.com/register/${registrationToken}`;

      const emailParams = {
        Source: 'no-reply@owl2club.com',
        Destination: {
          ToAddresses: [application.email],
        },
        Message: {
          Subject: {
            Data: 'OWL^2 Club: Invitation to Create Your Account',
          },
          Body: {
            Html: {
              Data: `
                <p>Congratulations! Your application to join OWL^2 Club has been approved.</p>
                <p>Please click the link below to create your account:</p>
                <a href="${registrationLink}">Create Your Account</a>
              `,
            },
          },
        },
      };

      const command = new SendEmailCommand(emailParams);
      await sesClient.send(command);

      res.send('Application status updated and invitation email sent.');
    } else {

      const emailParams = {
        Source: 'no-reply@owl2club.com',
        Destination: {
          ToAddresses: [application.email],
        },
        Message: {
          Subject: {
            Data: 'OWL^2 Club: Application Update',
          },
          Body: {
            Html: {
              Data: `
                <p>We regret to inform you that your application to join OWL^2 Club has been denied.</p>
                <p>If you have any questions, please contact support.</p>
              `,
            },
          },
        },
      };
    
      const command = new SendEmailCommand(emailParams);
      await sesClient.send(command);

      const deletePropertiesQuery = `
        DELETE FROM pending_user_properties WHERE application_id = $1
      `;
      await pool.query(deletePropertiesQuery, [id]);

      res.send('Application status updated.');
    }
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).send('Error updating application status.');
  }
});

// check if the register attempt is valid 
app.get('/api/register/validate-token/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const query = 'SELECT email FROM users WHERE registration_token = $1';
    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(400).send({ message: 'Invalid token' });
    }

    const { email } = result.rows[0];

    res.send({ email });
  } catch (error) {
    console.error('Error validating registration token:', error);
    res.status(500).send({ message: 'Error validating token' });
  }
});

app.post('/api/register', async (req, res) => {
  const { token, password, name, type } = req.body;

  if (!token || !password || !name || !type) {
    return res.status(400).send({ message: 'All fields are required.' });
  }

  try {
    // 1. Validate the registration token
    const tokenQuery = 'SELECT * FROM users WHERE registration_token = $1';
    const tokenResult = await pool.query(tokenQuery, [token]);

    if (tokenResult.rows.length === 0) {
      return res.status(400).send({ message: 'Invalid or expired registration token.' });
    }

    const user = tokenResult.rows[0];

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Update the user record
    const updateUserQuery = `
      UPDATE users 
      SET 
        name = $1, 
        type = $2, 
        password = $3, 
        registration_token = NULL 
      WHERE user_id = $4
      RETURNING *;
    `;
    const updateResult = await pool.query(updateUserQuery, [name, type, hashedPassword, user.user_id]);

    if (updateResult.rows.length === 0) {
      return res.status(500).send({ message: 'Error updating user account.' });
    }

    // 4. Respond with success
    res.status(200).send({ message: 'Account created successfully.' });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).send({ message: 'Error creating account. Please try again later.' });
  }
});


// redirect
app.get('/member-home', isAuthenticated, (req, res) => {
  res.status(200).send(`Welcome to the member's home page, ${req.session.user.name}`);
});

app.get('/auth-status', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ authenticated: true, user: req.session.user });
  } else {
    res.status(200).json({ authenticated: false });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid');
    res.status(200).send('Logout successful');
  });
});

const slugify = (title) => title
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-') 
  .replace(/^-+|-+$/g, ''); 

const generateUniqueSlug = async (title) => {
  let slug = slugify(title);
  let suffix = 1;
  let isUnique = false;

  while (!isUnique) {
    const result = await pool.query('SELECT 1 FROM event WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      isUnique = true;
    } else {
      slug = `${slugify(title)}-${suffix}`;
      suffix++;
    }
  }

  return slug;
};

// endpoint that gets hit when event invite gets accepted
app.get('/api/events/invite/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    const inviteQuery = `
      SELECT i.*, e.title as event_title 
      FROM event_invites i 
      JOIN event e ON i.event_id = e.id 
      WHERE i.invite_token = $1 AND i.status = 'pending' AND i.expires_at > NOW()
    `;
    const inviteResult = await pool.query(inviteQuery, [token]);
    
    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Invalid or expired invitation' 
      });
    }
    
    const invite = inviteResult.rows[0];
    
    await pool.query(
      'UPDATE event_invites SET status = $1 WHERE invite_token = $2',
      ['accepted', token]
    );
    
    await pool.query(
      'INSERT INTO event_user (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [invite.event_id, invite.user_id]
    );
    
    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      event: {
        id: invite.event_id,
        title: invite.event_title
      }
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ 
      error: 'Failed to accept invitation',
      details: error.message 
    });
  }
});

// create an event
app.post('/api/events', async (req, res) => {
  const {
      event_date,
      start_time,
      end_time,
      title,
      description,
      note,
      color,
      is_physical,
      location,
      zip_code,
      city,
      state,
      country,
      virtual_link,
      type,
      exclusivity,
  } = req.body;

  const userId = req.session?.user?.user_id;

  if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not logged in' });
  }

  try {
      await pool.query('BEGIN');
      const slug = await generateUniqueSlug(title);

      const result = await pool.query(
          `INSERT INTO event (
              event_date,
              start_time,
              end_time,
              title,
              description,
              note,
              color,
              is_physical,
              location,
              zip_code,
              city,
              state,
              country,
              virtual_link,
              type,
              exclusivity,
              slug
          ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          ) RETURNING id`,
          [
              event_date,
              start_time,
              end_time,
              title,
              description,
              note,
              color,
              is_physical,
              location,
              zip_code,
              city,
              state,
              country,
              virtual_link,
              type,
              exclusivity,
              slug,
          ]
      );

      const newId = result.rows[0].id;

      await pool.query('INSERT INTO event_user (event_id, user_id) VALUES ($1, $2)', [newId, userId]);

      await pool.query('COMMIT');
      res.status(201).json({ id: newId });
  } catch (err) {
      await pool.query('ROLLBACK');
      console.error(err.message);
      res.status(500).send('Error creating event');
  }
});

// update an event 
app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const {
      date,
      start_time,
      end_time,
      title,
      description,
      note,
      color,
      type,
      exclusivity,
      is_physical,
      location,
      zip_code,
      city,
      state,
      country,
      virtual_link,
  } = req.body;

  try {
      let slug;

      // Generate a new slug only if the title has changed
      const existingEvent = await pool.query('SELECT title FROM event WHERE id = $1', [id]);
      if (existingEvent.rows[0].title !== title) {
          slug = await generateUniqueSlug(title);
      }

      await pool.query(
          `UPDATE event
           SET event_date = $1,
               start_time = $2,
               end_time = $3,
               title = $4,
               description = $5,
               note = $6,
               color = $7,
               type = $8,
               exclusivity = $9,
               is_physical = $10,
               location = $11,
               zip_code = $12,
               city = $13,
               state = $14,
               country = $15,
               virtual_link = $16,
               slug = COALESCE($17, slug)
           WHERE id = $18`,
          [
              date,
              start_time,
              end_time,
              title,
              description,
              note,
              color,
              type,
              exclusivity,
              is_physical,
              location,
              zip_code,
              city,
              state,
              country,
              virtual_link,
              slug,
              id,
          ]
      );

      const updatedEvent = await pool.query('SELECT * FROM event WHERE id = $1', [id]);

      console.log(updatedEvent);
      res.json(updatedEvent.rows[0]);
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
  }
});


// delete an event 
app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
      await pool.query('SELECT delete_event($1)', [id]);
      res.json({ message: 'Event deleted successfully' });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
  }
});

// get all events
app.get("/api/events", async (req, res) => {
  try {
    /*const { rows } = await pool.query('SELECT * FROM event'); */
    const result = await pool.query(`
      SELECT e.*, 
             COALESCE(json_agg(json_build_object('user_id', u.user_id, 'name', u.name)) FILTER (WHERE u.user_id IS NOT NULL), '[]') AS participants
      FROM event e
      LEFT JOIN event_user eu ON e.id = eu.event_id
      LEFT JOIN users u ON eu.user_id = u.user_id
      GROUP BY e.id
    `);
    /* res.json(rows); */
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// get one event w/ slug 
app.get("/api/events/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT e.*, 
             COALESCE(json_agg(json_build_object('user_id', u.user_id, 'name', u.name)) FILTER (WHERE u.user_id IS NOT NULL), '[]') AS participants
      FROM event e
      LEFT JOIN event_user eu ON e.id = eu.event_id
      LEFT JOIN users u ON eu.user_id = u.user_id
      WHERE e.slug = $1
      GROUP BY e.id
      `,
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// get event tags 
app.get('/api/images/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const query = 'SELECT * FROM images WHERE $1 = ANY(tags)';
    const result = await pool.query(query, [title]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.json([]);
  }
});


// registeration endpoint
app.post('/register', async (req, res) => {
  const { name, email, type, password } = req.body;

  // Check if email already exists
  const emailCheckQuery = 'SELECT * FROM users WHERE email = $1';
  const emailCheckResult = await pool.query(emailCheckQuery, [email]);

  if (emailCheckResult.rows.length > 0) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const query = 'INSERT INTO users (name, email, type, password, admin) VALUES ($1, $2, $3, $4, FALSE)';
  const values = [name, email, type, hashedPassword];
  
  try {
    await pool.query(query, values);  
    res.status(201).send('User registered');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
  }
});

// application endpoint
app.post('/request', async (req, res) => {
  const { full_name, email, phone, reason, interests, availability, referral, comments, 
    membershipType, propertyAddress, propertyType, propertyDescription, propertyAvailability, } = req.body;
  // Check if email already exists
  const emailCheckQuery = 'SELECT * FROM membership_applications WHERE email = $1';
  const emailCheckResult = await pool.query(emailCheckQuery, [email]);

  if (emailCheckResult.rows.length > 0) {
    return res.status(400).json({ error: 'This email already has a pending application.'});
  }

  const query = 'INSERT INTO membership_applications (full_name, email, phone, reason, interests, availability, referral, comments, membership_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id';
  const values = [full_name, email, phone, reason, interests || '{}', availability, referral, comments, membershipType];
  console.log(values);

  try {
    const applicationResult = await pool.query(query, values);
  
    console.log('Application inserted successfully:', applicationResult.rows[0]);
    const applicationId = applicationResult.rows[0].id;

    if (membershipType === 'Travel Host') {
      console.log('Inserting property details into pending_user_properties...');
      const propertyQuery = `
        INSERT INTO pending_user_properties 
        (application_id, address, type, description, availability) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      const propertyValues = [
        applicationId,
        propertyAddress,
        propertyType,
        propertyDescription,
        propertyAvailability,
      ];
      await pool.query(propertyQuery, propertyValues);
      console.log('Property details inserted successfully.');
    }

    const emailParams = {
      Source: 'no-reply@owl2club.com',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Thank You for Your Application to OWL^2 Club',
        },
        Body: {
          Html: {
            Data: `
              <p>Dear ${full_name},</p>
              <p>Thank you for your interest in joining the OWL^2 Club. We are delighted to inform you that we have received your application.</p>
              <p>Our team is currently reviewing your application and will update you regarding the status as soon as possible. If you have any questions or additional information to share, feel free to reply to this email.</p>
              <p>We truly value your enthusiasm and look forward to welcoming you into our community.</p>
              <p>Warm regards,</p>
              <p>The OWL^2 Club Team</p>
            `,
          },
        },
      },
    };

    const command = new SendEmailCommand(emailParams);
    await sesClient.send(command);

    res.status(201).send('Application stored and confirmation email sent');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error storing application');
  }
});

app.get('/api/applications', async (req, res) => {
  try {
    const query = `
      SELECT 
        ma.*, 
        json_agg(pup.*) AS properties
      FROM membership_applications ma
      LEFT JOIN pending_user_properties pup ON ma.id = pup.application_id
      GROUP BY ma.id
      ORDER BY ma.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Error fetching applications' });
  }
});

// login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
  
  try {
    const result = await pool.query(query, [email]);
    if (result.rows.length === 0) {
      return res.status(400).send('User not found');
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(400).send('Invalid credentials');
    }

    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      type: user.type,
      admin: user.admin,
    };

    res.status(200).send('Login successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
});

app.get('/users/:userId', (req, res) => {
  if (req.session.user && req.params.userId === req.session.user.user_id.toString()) {
    res.json({ name: req.session.user.name });
  } else {
    res.status(404).json({ error: "User not found or session mismatch" });
  }
});

// password reset 
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'meanleanm@gmail.com',
    pass: 'meanmeanmeanmmm',
  },
});

// Endpoint to allow the user to reset their password through SES
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const query = 'SELECT user_id FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).send('Email not found');
    }

    const user_id_password_reset = result.rows[0].user_id;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hr

    const updateQuery = 'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3';
    await pool.query(updateQuery, [resetToken, resetTokenExpiry, user_id_password_reset]);

    const resetLink = `https://owl2club.com/reset-password/${resetToken}`;
    const emailParams = {
      Source: 'no-reply@owl2club.com',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'OWL^2 Club: Password Reset Request',
        },
        Body: {
          Html: {
            Data: `
              <p>You requested a password reset.</p>
              <p>Click the link below to reset your password:</p>
              <a href="${resetLink}">Reset Password</a>
            `,
          },
        },
      },
    };

    const command = new SendEmailCommand(emailParams);
    await sesClient.send(command);

    res.send('Password reset link has been sent to your email.');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).send('Error sending reset link.');
  }
});

// Endpoint to allow the user to change their password through the reset flow 
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const query = 'SELECT user_id, reset_token_expiry FROM users WHERE reset_token = $1';
    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(400).send('Invalid reset token.');
    }

    const user = result.rows[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset token and expiry
    const updateQuery = `
      UPDATE users
      SET password = $1, reset_token = NULL, reset_token_expiry = NULL
      WHERE user_id = $2
    `;
    await pool.query(updateQuery, [hashedPassword, user.user_id]);

    res.send('Password has been reset successfully.');
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).send('An error occurred while resetting the password.');
  }
});


// Endpoint to get current user details
app.get('/user-details', (req, res) => {
  if (req.session.user) {
    res.status(200).json(req.session.user);
  } else {
    res.status(401).send('Unauthorized');
  }
});

// Endpoint to update user details
app.post('/update-user', async (req, res) => {
  const { name, type } = req.body;
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  const query = 'UPDATE users SET name = $1, type = $2 WHERE user_id = $3 RETURNING *';
  const values = [name, type, req.session.user.user_id];

  try {
    const result = await pool.query(query, values);
    req.session.user = result.rows[0];
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating user details');
  }
});

// Endpoint to update user password
app.post('/update-password', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  const query = 'SELECT password FROM users WHERE id = $1';
  const result = await pool.query(query, [req.session.user.user_id]);

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(oldPassword, user.password);

  if (!isValidPassword) {
    return res.status(400).send('Old password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updateQuery = 'UPDATE users SET password = $1 WHERE id = $2';
  await pool.query(updateQuery, [hashedPassword, req.session.user.user_id]);

  res.status(200).send('Password updated successfully');
});

// endpoint to get ALL users' email, name, and type 
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, email, name, type FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Server error');
  }
});

// update a user's privilege 'remotely'
app.put('/api/users/:id/privilege', async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  try {
    await pool.query('UPDATE users SET type = $1 WHERE user_id = $2', [type, id]);
    res.send('User privilege updated');
  } catch (error) {
    console.error('Error updating privilege:', error);
    res.status(500).send('Server error');
  }
});

// forcably change a user's password to a temp password
app.put('/api/users/:id/reset-password-to-temp', async (req, res) => {
  const { id } = req.params;
  const tempPassword = 'owlsquared';
  
  try {
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashedPassword, id]);
    res.send('Password reset successful');
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).send('Server error');
  }
});

// endpoint to allow a user to join an event
app.post('/api/events/:eventId/join', async (req, res) => {
  const userId = req.session.user.user_id; 
  const { eventId } = req.params;

  try {
    await pool.query(
      'INSERT INTO event_user (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [eventId, userId]
    );
    res.status(200).send('Successfully joined the event');
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).send('Server error');
  }
});

// endpoint to allow a user to leave an event
app.delete('/api/events/:eventId/leave', async (req, res) => {
  const userId = req.session.user.user_id; 
  const { eventId } = req.params;

  try {
    await pool.query(
      'DELETE FROM event_user WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    res.status(200).send('Successfully left the event');
  } catch (error) {
    console.error('Error leaving event:', error);
    res.status(500).send('Server error');
  }
});

// endpoint to invite user to event
app.post('/api/events/invite', async (req, res) => {
  const { eventId, eventTitle, userIds } = req.body;
  
  try {
    // First fetch all users' details
    const userQuery = 'SELECT user_id, email, name FROM users WHERE user_id = ANY($1)';
    const usersResult = await pool.query(userQuery, [userIds]);
    
    // For each user, create an invite record and send email
    for (const user of usersResult.rows) {
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 48); // Set expiry to 48 hours from now
      
      // Create invite record
      await pool.query(
        `INSERT INTO event_invites 
         (event_id, user_id, invite_token, expires_at) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id, user_id) 
         DO UPDATE SET 
           invite_token = EXCLUDED.invite_token,
           expires_at = EXCLUDED.expires_at,
           status = 'pending'`,
        [eventId, user.user_id, inviteToken, expiryDate]
      );
      
      // Send email invitation
      const inviteLink = `https://owl2club.com/events/invite/${inviteToken}`;
      const emailParams = {
        Source: 'no-reply@owl2club.com',
        Destination: { 
          ToAddresses: [user.email] 
        },
        Message: {
          Subject: { 
            Data: `Invitation to ${eventTitle}` 
          },
          Body: {
            Html: {
              Data: `
                <p>Hello ${user.name},</p>
                <p>You've been invited to join "${eventTitle}".</p>
                <p>Click the link below to accept the invitation:</p>
                <a href="${inviteLink}">Accept Invitation</a>
                <p>This invitation will expire in 48 hours.</p>
              `
            }
          }
        }
      };
      
      const command = new SendEmailCommand(emailParams);
      await sesClient.send(command);
    }
    
    res.json({ 
      success: true,
      message: `Invitations sent to ${usersResult.rows.length} users`
    });
  } catch (error) {
    console.error('Error sending invites:', error);
    res.status(500).json({ 
      error: 'Failed to send invites',
      details: error.message 
    });
  }
});

// post a comment 
app.post('/api/comments', async (req, res) => {
  const { content, commentableId } = req.body;

  if (!content || !commentableId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const insertQuery = `
      INSERT INTO comments (content, user_id, commentable_id)
      VALUES ($1, $2, $3) RETURNING *
    `;
    const result = await pool.query(insertQuery, [content, req.session.user.user_id, commentableId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// Edit a comment
app.put('/api/comments/:id', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Missing content' });
  }

  try {
    // Check if the comment exists and belongs to the user
    const commentQuery = `
      SELECT * FROM comments WHERE id = $1 AND user_id = $2
    `;
    const comment = await pool.query(commentQuery, [id, req.session.user.user_id]);

    if (comment.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or comment not found' });
    }

    // Update the comment
    const updateQuery = `
      UPDATE comments
      SET content = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const updatedComment = await pool.query(updateQuery, [content, id]);

    res.json(updatedComment.rows[0]);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
app.delete('/api/comments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the current user details (from session)
    const { user_id, admin } = req.session.user;

    // Check if the comment exists and verify permission
    const commentQuery = `
      SELECT * FROM comments WHERE id = $1
    `;
    const comment = await pool.query(commentQuery, [id]);

    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Ensure the user is either the owner of the comment or an admin
    const isOwner = comment.rows[0].user_id === user_id;
    if (!isOwner && !admin) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    // Perform the deletion
    const deleteQuery = `
      DELETE FROM comments WHERE id = $1
    `;
    await pool.query(deleteQuery, [id]);

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// add a like
app.post('/api/comments/:id/like', async (req, res) => {
  const { id } = req.params;
  const userId = req.session.user.user_id; 

  try {
    const insertQuery = `
      INSERT INTO comment_likes (comment_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (comment_id, user_id) DO NOTHING
    `;
    await pool.query(insertQuery, [id, userId]);
    res.status(200).json({ message: 'Comment liked successfully' });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// remove a like (delete)
app.delete('/api/comments/:id/unlike', async (req, res) => {
  const { id } = req.params; 
  const userId = req.session.user.user_id;

  try {
    const deleteQuery = `
      DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2
    `;
    await pool.query(deleteQuery, [id, userId]);
    res.status(200).json({ message: 'Comment unliked successfully' });
  } catch (error) {
    console.error('Error unliking comment:', error);
    res.status(500).json({ error: 'Failed to unlike comment' });
  }
});

app.get('/api/comments', async (req, res) => {
  const { commentableId } = req.query;
  const userId = req.session.user?.user_id;

  if (!commentableId) {
    return res.status(400).json({ error: 'Missing commentableId' });
  }

  try {
    // Fetch comments with like counts and user-like status
    const query = `
      SELECT 
        c.*,
        u.name AS username,
        COALESCE(cl.like_count, 0) AS like_count,
        EXISTS (
          SELECT 1 
          FROM comment_likes 
          WHERE comment_id = c.id AND user_id = $1
        ) AS user_liked
      FROM comments c
      LEFT JOIN (
        SELECT comment_id, COUNT(*) AS like_count 
        FROM comment_likes 
        GROUP BY comment_id
      ) cl ON c.id = cl.comment_id
      JOIN users u ON c.user_id = u.user_id
      WHERE c.commentable_id = $2
      ORDER BY c.created_at ASC;
    `;
    const comments = await pool.query(query, [userId, commentableId]);
    console.log(comments);
    res.json(comments.rows);
  } catch (error) {
    console.error('Error fetching comments with likes:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/events/send-confirmation', async (req, res) => {
  const { eventId, userId } = req.body;

  try {
    // Fetch event details
    const eventQuery = `
      SELECT 
        title, 
        event_date, 
        start_time, 
        end_time, 
        location 
      FROM event 
      WHERE id = $1
    `;
    const eventResult = await pool.query(eventQuery, [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    // Fetch user details
    const userQuery = `
      SELECT name, email 
      FROM users 
      WHERE user_id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Format event date and time
    const formattedDate = new Date(event.event_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = `${event.start_time} - ${event.end_time}`;

    // Send confirmation email
    const emailParams = {
      Source: 'no-reply@owl2club.com',
      Destination: { 
        ToAddresses: [user.email] 
      },
      Message: {
        Subject: { 
          Data: `You’ve joined "${event.title}"!` 
        },
        Body: {
          Html: {
            Data: `
              <p>Hello ${user.name},</p>
              <p>You’ve successfully joined the event <strong>${event.title}</strong>.</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              <p><strong>Location:</strong> ${event.location || 'TBD'}</p>
              <p>We’re excited to have you with us! Feel free to reach out if you have any questions.</p>
              <p>Best regards,</p>
              <p>The OWL<sup>2</sup> Team</p>
            `,
          },
        },
      },
    };

    const command = new SendEmailCommand(emailParams);
    await sesClient.send(command);

    res.json({ 
      success: true, 
      message: `Confirmation email sent to ${user.email}` 
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    res.status(500).json({ 
      error: 'Failed to send confirmation email',
      details: error.message 
    });
  }
});

app.post('/api/validate-code', async (req, res) => {
  const { code } = req.body;

  if (!code) {
      return res.status(400).json({ error: 'Invitation code is required.' });
  }

  try {
      const result = await pool.query(
          'SELECT * FROM invitation_codes WHERE code = $1',
          [code]
      );

      if (result.rows.length > 0) {
          return res.status(200).json({ valid: true });
      } else {
          return res.status(404).json({ valid: false, error: 'Invalid Invitation Code' });
      }
  } catch (err) {
      console.error('Error validating code:', err.message);
      res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

app.post('/api/admin/send-email', async (req, res) => {
  const { subject, body, recipientGroup, selectedMemberIds } = req.body; 

  console.log('Email sent:', { subject, recipientGroup, body });

  if (!subject || !body || !recipientGroup) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let recipients = [];

    switch (recipientGroup) {
      case 'founding':
        recipients = (await pool.query(
          'SELECT email, name FROM users WHERE type = $1 AND email IS NOT NULL',
          ['Founding']
        )).rows;
        break;

      case 'standard':
        recipients = (await pool.query(
          'SELECT email, name FROM users WHERE LOWER(type) = $1 AND email IS NOT NULL',
          ['standard']
        )).rows;
        break;

      case 'travel':
        recipients = (await pool.query(
          'SELECT email, name FROM users WHERE type = $1 AND email IS NOT NULL',
          ['Travel Host']
        )).rows;
        break;

      case 'admins':
        recipients = (await pool.query(
          'SELECT email, name FROM users WHERE admin = true AND email IS NOT NULL'
        )).rows;
        break;

      case 'all':
        recipients = (await pool.query(
          'SELECT email, name FROM users WHERE email IS NOT NULL'
        )).rows;
        break;

      case 'testing':
        recipients = [
          { email: 'wc6972z2@gmail.com', name: 'Testing Team (You)' },
          { email: 'jessicatangtang@gmail.com', name: 'Testing Team (Jessica)' }
        ];
        break;   
        
      case 'selected':
        if (!Array.isArray(selectedMemberIds) || selectedMemberIds.length === 0) {
          return res.status(400).json({ message: 'No members selected.' });
        }
        const { rows } = await pool.query(
          'SELECT email, name FROM users WHERE user_id = ANY($1) AND email IS NOT NULL',
          [selectedMemberIds]
        );
        recipients = rows;
        break;

      default:
        return res.status(400).json({ message: 'Invalid recipient group' });
    }

    console.log(recipients);

    for (const { email, name } of recipients) {
      console.log("Email sending to... " + email)
      
      const emailParams = {
        Source: 'no-reply@owl2club.com',
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: subject,
          },
          Body: {
            Html: {
              Data: `
                <p>Dear ${name || 'OWL^2 Member'},</p>
                ${body}
              `,
            },
          },
        },
      };

      try {
        const command = new SendEmailCommand(emailParams);
        await sesClient.send(command);
      } catch (err) {
        console.error(`Error sending to ${email}:`, err);
      }
    }

    res.status(200).json({ message: 'Emails sent.' });
  } catch (err) {
    console.error('Error processing email send:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/get-members', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT user_id, name, email FROM users WHERE email IS NOT NULL ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ message: 'Failed to retrieve members' });
  }
});


app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) =>{
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});