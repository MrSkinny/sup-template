var bcrypt = require('bcryptjs');

module.exports = {
    genSalt(x){
        return new Promise(function(resolve, reject){
            bcrypt.genSalt(x, function(err, salt){
                if (err) return reject(err);
                
                return resolve(salt);
            });
        });
    },

    hash(pw, salt){
        return new Promise(function(resolve, reject){
            bcrypt.hash(pw, salt, function(err, hash){
                if (err) return reject(err);
                
                return resolve(hash);
            });
        });
    },
    
    compare(inputtedPw, hashedPw) {
        return new Promise(function(resolve, reject){
            return bcrypt.compare(inputtedPw, hashedPw, function(err, isValid){
                if (err) return reject(err);
                
                return resolve(isValid);
            });          
        });
    }
};

