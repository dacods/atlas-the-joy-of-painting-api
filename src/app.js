const express = require('express');
const episodesRouter = require('./routes/routes');

const app = express();

app.use(express.json());

app.use('/api/episodes', episodesRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ err });
});

module.exports = app;