const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

const User = require('../models/user');

passport.use(new BasicStrategy((username, password, cb) => {
  return User.findOne({ username: username })
    .then(user => {
      if (!user) return cb(null, false);
      if (!user.validPassword(password)) return cb(null, false);      

      return cb(null, user);
    })

    .catch(err => cb(err));
}));

module.exports = passport;
