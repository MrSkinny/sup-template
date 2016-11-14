const express = require('express');
const usersRouter = express.Router();

const validateUser = function(body) {
  if (!body.username) {
    return {
      error: true,
      status: 422,
      body: { message: 'Missing field: username' }
    };
  }

  if (typeof body.username !== 'string') {
    return {
      error: true,
      status: 422,
      body: { message: 'Incorrect field type: username' }
    };
  }

  return { error: false };
};

const User = require('../models/user');
usersRouter
  .route('/')

  .get((req, res) => {
    User.find()
      .then(users => res.json(users))
      .catch(err => res.sendStatus(500));
  })

  .post((req, res) => {
    const validatorResponse = validateUser(req.body);
    if (validatorResponse.error) return res.status(validatorResponse.status).json(validatorResponse.body);

    User.create({ username: req.body.username })
      .then(user => {
        res.set('Location', `/api/v1/users/${user._id}`);
        return res.status(201).json({});
      })
      .catch(err => res.sendStatus(500));
  });

usersRouter
  .route('/:userId')

  .get((req, res) => {
    User.findOne({ _id: req.params.userId })
      .then(user => {
        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.json(user);
      })
      .catch(err => res.sendStatus(500));

  })

  .put((req, res) => {
    const validatorResponse = validateUser(req.body);
    if (validatorResponse.error) return res.status(validatorResponse.status).json(validatorResponse.body);

    User.findOne({ _id: req.params.userId })
      .then(user => {
        if (!user) {
          return User.create({ _id: req.params.userId, username: req.body.username })
            .then(() => res.json({}))
            .catch(() => res.sendStatus(500));
        }

        user.username = req.body.username;
        return user.save()
          .then(() => res.json({}))
          .catch(() => res.sendStatus(500));
      })
      .catch(() => res.sendStatus(500));
  })

  .delete((req, res) => {
    User.findOneAndRemove({ _id: req.params.userId })
      .then(user => {
        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.json({});
      })
      .catch(() => res.sendStatus(500));
  });

module.exports = usersRouter;
