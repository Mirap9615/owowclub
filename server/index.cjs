const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) =>{
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const port = process.env.PORT || 3000;

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});