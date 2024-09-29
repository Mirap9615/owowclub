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

  const userId = req.session.user.user_id; 
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

    const result = await pool.query(insertQuery, [imageId, userId, eventId, name, tags, title, description, imageUrl]);
    const newImage = result.rows[0];

    console.log("File uploaded; Session User Data:", req.session.user);
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

// update application status
app.patch('/api/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { accepted } = req.body; 

  try {
    if (typeof accepted !== 'boolean') {
      return res.status(400).json({ error: 'Invalid status. "accepted" must be true or false.' });
    }

    const query = `
      UPDATE membership_applications 
      SET accepted = $1
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [accepted, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating application status:', err);
    res.status(500).json({ error: 'Error updating application status.' });
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

app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, title, description, note, color } = req.body;
  try {
    await pool.query(
      'SELECT update_event($1, $2, $3, $4, $5, $6, $7)',
      [id, start_time, end_time, title, description, note, color]
    );
    res.json({ message: 'Event updated successfully' + id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

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

// events loader
app.post('/api/events', async (req, res) => {
  const { start_time, end_time, title, description, note, color } = req.body;
  try {
      const result = await pool.query(
          'SELECT create_event($1, $2, $3, $4, $5, $6)',
          [start_time, end_time, title, description, note, color]
        );
      const newId = result.rows[0].create_event; 
      res.status(201).json({ id: newId });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Error creating event');
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

const sendResetEmail = (email, token) => {
  const resetLink = `/reset-password?token=${token}`;
  const mailOptions = {
    from: 'meanleanm@gmail.com',
    to: email,
    subject: 'Password Reset',
    html: `<p>[OWOW Club] \nYou requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 5 minutes.</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const token = generateToken();
  const expiration = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  const query = 'INSERT INTO password_resets (email, token, expiration) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET token = $2, expiration = $3';
  const values = [email, token, expiration];

  try {
    await pool.query(query, values);
    sendResetEmail(email, token);
    res.status(200).send('If this email exists, a reset link has been sent.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing request');
  }
});

app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  const query = 'SELECT * FROM password_resets WHERE token = $1';
  const result = await pool.query(query, [token]);

  if (result.rows.length === 0) {
    return res.status(400).send('Invalid or expired token');
  }

  const resetRequest = result.rows[0];

  if (resetRequest.expiration < new Date()) {
    return res.status(400).send('Token has expired');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updateQuery = 'UPDATE users SET password = $1 WHERE email = $2';
  const deleteQuery = 'DELETE FROM password_resets WHERE token = $1';

  try {
    await pool.query(updateQuery, [hashedPassword, resetRequest.email]);
    await pool.query(deleteQuery, [token]);
    res.status(200).send('Password has been reset successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error resetting password');
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
  const tempPassword = 'OWL^2';
  
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
  console.log('Session data:', req.session);
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
  console.log('Session data:', req.session);
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

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) =>{
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});