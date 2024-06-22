const express = require('express');
const path = require('path');
require('dotenv').config(); 
const cors = require('cors');
const pool = require('./db.cjs');
const app = express();

app.use(cors({
  origin: '*'
}));

app.use(express.json());

const port = process.env.PORT || 3000;

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


app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) =>{
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});