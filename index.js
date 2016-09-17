var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var bcrypt = require('./bcrypt-promise');
var User = require('./models/user');
var Message = require('./models/message');

var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;

var strategy = new BasicStrategy(function(username, password, callback){
    User.findOne({ username }, function(err, user){
        if (err) return callback(err);
        if (!user) return callback(null, false, { message: 'Incorrect username' });
        
        user.validatePassword(password)
            .then(isValid => {
                if (!isValid) return callback(null, false, { message: 'Incorrect password' });
                return callback(null, user);
            })
            .catch(err => callback(err));
    })    
});

passport.use(strategy);

var app = express();
app.use(passport.initialize());

var jsonParser = bodyParser.json();

// Add your API endpoints here
app.route('/users')
    .get(function(req, res){
        User.find({}, function(err, users){
            if (err) return res.status(500).json(err);
    
            res.json(users);        
        });
    })

    .post(jsonParser, function(req, res){
        if (!req.body.username) return res.status(422).json({ message: "Missing field: username" });
        if (!req.body.password) return res.status(422).json({ message: "Missing field: password" });
        if (typeof req.body.username !== 'string') return res.status(422).json({ message: "Incorrect field type: username" });
        if (typeof req.body.password !== 'string') return res.status(422).json({ message: "Incorrect field type: password" });
        
        bcrypt.genSalt(10)
            .then(function(salt) { return bcrypt.hash(req.body.password, salt); })
            .then(function(hash) {
                console.log('creating user with', hash);
                User.create({ username: req.body.username, password: hash }, function(err, user){
                    if (err) return res.status(500).json(err);
                    
                    res.status(201).location('/users/' + user._id).json({});
                });
            })
            .catch(function(err) {
                return res.status(500).json({ message: "Error with bcrypt", errors: err });
            });
    });

app.route('/users/:userId')
    .get(passport.authenticate('basic', { session: false }), function(req, res){
        User.findOne({ _id: req.params.userId })
            .exec(function(err, user){
                if (!user) return res.status(404).json({ message: "User not found" });
                
                return res.json(user);
            });
    })

    .put(jsonParser, function(req, res){
        if (!req.body.username) return res.status(422).json({ message: "Missing field: username" });
        if (!req.body.password) return res.status(422).json({ message: "Missing field: password" });
        if (typeof req.body.username !== 'string') return res.status(422).json({ message: "Incorrect field type: username" });
        if (typeof req.body.password !== 'string') return res.status(422).json({ message: "Incorrect field type: password" });
        
        User.findOneAndUpdate({ _id: req.params.userId }, { username: req.body.username })
            .then(function(user){
                if (!user) {
                    User.create({ _id: req.params.userId, username: req.body.username, password: req.body.password })
                        .then(function(){
                            return res.json({});
                        });
                }

                return res.json({});
            });
    })
    
    .delete(function(req, res){
        User.findOneAndRemove({ _id: req.params.userId })
            .then(function(user){
                if (!user) return res.status(404).json({ message: "User not found" });
                
                return res.json({});
            });
    });
    
app.route('/messages')    
    .get(function(req, res){
        Message.find(req.query)
            .populate('from to')
            .then(function(messages){
                return res.json(messages);
            });
    })
    
    .post(jsonParser, function(req, res){
        if (!req.body.text) return res.status(422).json({ message: "Missing field: text" });
        if (typeof req.body.text !== 'string') return res.status(422).json({ message: "Incorrect field type: text" });
        if (typeof req.body.to !== 'string') return res.status(422).json({ message: "Incorrect field type: to" });
        if (typeof req.body.from !== 'string') return res.status(422).json({ message: "Incorrect field type: from" });

        User.findOne({ _id: req.body.to })
            .then(function(user){
                console.log('after find req to:', user);
                if (!user) return res.status(422).json({ message: "Incorrect field value: to" });

                return User.findOne({ _id: req.body.from });
            })
            .then(function(user){
                if (!user) return res.status(422).json({ message: "Incorrect field value: from" });

                return Message.create({ text: req.body.text, to: req.body.to, from: req.body.from });
            })
            .then(function(message){
                return res.status(201).location(`/messages/${message._id}`).json({});
            });
    });
    
app.route('/messages/:messageId')
    .get(function(req, res){
        Message.findOne({ _id: req.params.messageId })
            .populate('from to')
            .then(function(message){
                if (!message) return res.status(404).json({ message: "Message not found" });
                
                return res.json(message);
            });
    });
    

var runServer = function(callback) {
    var databaseUri = process.env.DATABASE_URI || global.databaseUri || 'mongodb://localhost/sup';
    mongoose.connect(databaseUri).then(function() {
        var port = process.env.PORT || 8080;
        var server = app.listen(port, function() {
            console.log('Listening on localhost:' + port);
            if (callback) {
                callback(server);
            }
        });
    });
};

if (require.main === module) {
    runServer();
};

exports.app = app;
exports.runServer = runServer;

