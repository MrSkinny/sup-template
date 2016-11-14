const express = require('express');
const messagesRouter = express.Router();

messagesRouter
  .route('/')
  .get((req, res) => {
    res.send('hello');
  });

module.exports = messagesRouter;
