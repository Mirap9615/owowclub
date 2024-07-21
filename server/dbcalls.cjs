module.exports = function(app) {
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
        const { start_time, end_time, title, description, color } = req.body;
        try {
            await pool.query(
            'SELECT update_event($1, $2, $3, $4, $5, $6)',
            [id, start_time, end_time, title, description, color]
            );
            res.json({ message: 'Event updated successfully' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });
  };
  