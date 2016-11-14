const express = require('express');
const messagesRouter = express.Router();

const Message = require('../models/message');

messagesRouter
  .route('/')
  .get((req, res) => {
    Message.find()
      .then(messages => {
        console.log('msgs:', messages);
        res.json(messages)
      })
      .catch(err => res.sendStatus(500));
  });

module.exports = messagesRouter;
