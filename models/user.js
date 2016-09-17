var mongoose = require('mongoose');
var bcrypt = require('../bcrypt-promise');

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    
    password: {
        type: String,
        required: true
    }
});

UserSchema.methods.validatePassword = function(password) {
    var user = this;
    return new Promise(function(resolve, reject){
        return bcrypt.compare(password, user.password)
            .then(function(isValid){
                return resolve(isValid);
            })
            .catch(function(err){
                return reject(err);
            });
    });
};

var User = mongoose.model('User', UserSchema);

module.exports = User;
