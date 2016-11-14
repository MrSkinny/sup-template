const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const messagesRouter = require('./routes/messages');

var app = express();
app.use('/api/v1/messages', messagesRouter);

var jsonParser = bodyParser.json();

var runServer = function(callback) {
    var databaseUri = process.env.DATABASE_URI || global.databaseUri || 'mongodb://localhost/sup';
    mongoose.connect(databaseUri).then(function() {
        var port = process.env.PORT || 8080;
        var server = app.listen(port, function() {
            console.log('Listening on port ' + port);
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

