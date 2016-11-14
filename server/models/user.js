const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

UserSchema.statics.createUser = function(username, password) {
  return new Promise((res, rej) => {
    this.findOne({ username })
      .then(user => {
        if (user) return rej({ status: 400, message: 'User already exists'});

        return bcrypt.genSalt(10, (err, salt) => {
          if (err) rej(err);

          return bcrypt.hash(password, salt, (err, hash) => {
            if (err) rej(err);

            return this.create({ username, password: hash }, (err, user) => {
              if (err) rej(err);

              return res(user);
            });
          });
        });
      })
      .catch(err => {
        console.error(err);
        rej(err);
      });
  });
};

UserSchema.methods.validPassword = function(password) {
  return new Promise((res) => {
    return res(password === this.password);
  });
};

var User = mongoose.model('User', UserSchema);

module.exports = User;
