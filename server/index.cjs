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
    const { rows } = await pool.query('SELECT * FROM event');
    res.json(rows);
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
  console.log(req.body);
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
  const query = 'INSERT INTO users (name, email, type, password) VALUES ($1, $2, $3, $4)';
  const values = [name, email, type, hashedPassword];
  
  try {
    await pool.query(query, values);
    res.status(201).send('User registered');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
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
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
    };

    res.status(200).send('Login successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
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

  const query = 'UPDATE users SET name = $1, type = $2 WHERE id = $3 RETURNING *';
  const values = [name, type, req.session.user.id];

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
  const result = await pool.query(query, [req.session.user.id]);

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(oldPassword, user.password);

  if (!isValidPassword) {
    return res.status(400).send('Old password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updateQuery = 'UPDATE users SET password = $1 WHERE id = $2';
  await pool.query(updateQuery, [hashedPassword, req.session.user.id]);

  res.status(200).send('Password updated successfully');
});


app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) =>{
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});