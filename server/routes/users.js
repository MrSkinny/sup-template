const express = require('express');
const usersRouter = express.Router();
const passport = require('../config/passport');

const validateUser = require('./validators').validateUser;

const User = require('../models/user');

usersRouter
  .route('/')

  .get(passport.authenticate('basic', { session: false }), (req, res) => {
    User.find()
      .select('username')
      .then(users => res.json(users))
      .catch(err => res.sendStatus(500));
  })

  .post((req, res) => {
    const validatorResponse = validateUser(req.body);
    if (validatorResponse.error) return res.status(validatorResponse.status).json(validatorResponse.body);

    User.createUser(req.body.username, req.body.password)
      .then(user => {
        res.set('Location', `/api/v1/users/${user._id}`);
        return res.status(201).json({});
      })
      .catch(err => {
        console.error(err);
        if (err.status === 400) return res.status(400).json({ message: err.message });

        return res.sendStatus(500);
      });
  });

usersRouter
  .route('/:userId')

  .get(passport.authenticate('basic', { session: false }), (req, res) => {
    User.findOne({ _id: req.params.userId })
      .select('username')
      .then(user => {
        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.json(user);
      })
      .catch(err => res.sendStatus(500));

  })

  .put(passport.authenticate('basic', { session: false }), (req, res) => {
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

  .delete(passport.authenticate('basic', { session: false }), (req, res) => {
    User.findOneAndRemove({ _id: req.params.userId })
      .then(user => {
        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.json({});
      })
      .catch(() => res.sendStatus(500));
  });

module.exports = usersRouter;
