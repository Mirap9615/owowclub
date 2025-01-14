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

app.get('/api/images', async (req, res) => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'images/'
  });

  try {
    const { Contents } = await s3Client.send(command);
    if (!Contents || Contents.length === 0) { return res.status(200).json([])}

    const imageUrls = Contents.map(file => `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`);

    const imagesData = await pool.query(`SELECT * FROM images WHERE url = ANY($1)`, [imageUrls]);

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
  const name = "no name"
  const tags = ["unspecified event"]
  const eventId = null
  const title = "new image"
  const description = "default description"
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
    const insertQuery = `INSERT INTO images (image_id, user_id, event_id, name, tags, title, description, url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;`;

    const result = await pool.query(insertQuery, [imageId, user_id, eventId, name, tags, title, description, imageUrl]);
    const newImage = result.rows[0];

    return res.json({
      url: newImage.url,
      title: newImage.title,
      description: newImage.description,
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
  const { images } = req.body;
  try {
    await Promise.all(images.map(imageUrl => {
      const key = new URL(imageUrl).pathname.substring(1);

      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      });

      return s3Client.send(command);
    }));

    res.send({ status: 'success' });
  } catch (error) {
    console.error("Error deleting images:", error);
    res.status(500).send({ status: 'error', message: error.message });
  }
});

app.put('/api/images/:id', async (req, res) => {
  const { id } = req.params; 
  const { name, description, tags } = req.body; 

  try {
    const query = `
      UPDATE images 
      SET name = $1, description = $2, tags = $3
      WHERE image_id = $4
      RETURNING *;
    `;

    const result = await pool.query(query, [name, description, tags, id]);

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
        VALUES ($1, $2, NULL, 'member', FALSE)
        ON CONFLICT (email) DO NOTHING
        RETURNING user_id
      `;
      const insertResult = await pool.query(insertUserQuery, [application.email, registrationToken]);

      if (insertResult.rows.length === 0) {
        return res.status(400).send('User already exists.');
      }

      const registrationLink = `https://jessicatspace.com/register/${registrationToken}`;

      const emailParams = {
        Source: 'no-reply@jessicatspace.com',
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
  const { event_date, start_time, end_time, title, description, note, color, location, type, exclusivity } = req.body;
  try {
      const slug = await generateUniqueSlug(title);

      const result = await pool.query(
        'INSERT INTO event (event_date, start_time, end_time, title, description, note, color, location, type, exclusivity, slug) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
        [event_date, start_time, end_time, title, description, note, color, location, type, exclusivity, slug]
      );    
      const newId = result.rows[0].id; 
      res.status(201).json({ id: newId });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Error creating event');
  }
});

// update an event 
app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { date, start_time, end_time, title, description, note, color, location, type, exclusivity } = req.body;

  try {
    let slug; 

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
           location = $8,
           type = $9,
           exclusivity = $10,
           slug = COALESCE($11, slug),
       WHERE id = $12`,
      [date, start_time, end_time, title, description, note, color, location, type, exclusivity, slug, id]
    );

    res.json({ message: `Event with ID ${id} updated successfully` });
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
  const { full_name, email, phone, reason, interests, availability, referral, comments } = req.body;

  // Check if email already exists
  const emailCheckQuery = 'SELECT * FROM membership_applications WHERE email = $1';
  const emailCheckResult = await pool.query(emailCheckQuery, [email]);

  if (emailCheckResult.rows.length > 0) {
    return res.status(400).json({ error: 'This email already has a pending application.'});
  }

  const query = 'INSERT INTO membership_applications (full_name, email, phone, reason, interests, availability, referral, comments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
  const values = [full_name, email, phone, reason, interests, availability, referral, comments];
  
  try {
    await pool.query(query, values);  
    res.status(201).send('Application stored');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error storing application');
  }
});

// get applications endpoint
app.get('/api/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM membership_applications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Error fetching applications' });
  }
});

// login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = $1';
  
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

    const resetLink = `https://jessicatspace.com/reset-password/${resetToken}`;
    const emailParams = {
      Source: 'no-reply@jessicatspace.com',
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
      const inviteLink = `https://jessicatspace.com/events/invite/${inviteToken}`;
      const emailParams = {
        Source: 'no-reply@jessicatspace.com',
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
                <p>Hello ${user.name || 'there'},</p>
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

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) =>{
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});