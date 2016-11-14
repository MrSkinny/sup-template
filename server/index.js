const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jsonParser = bodyParser.json();

mongoose.Promise = global.Promise;

const messagesRouter = require('./routes/messages');
const usersRouter = require('./routes/users');

const app = express();
app.post('*', jsonParser);
app.put('*', jsonParser);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/users', usersRouter);

const runServer = function (callback) {
  const databaseUri = process.env.DATABASE_URI || global.databaseUri || 'mongodb://localhost/sup';
  mongoose.connect(databaseUri).then(() => {
    const port = process.env.PORT || 8080;
    const server = app.listen(port, () => {
      console.log(`Listening on port ${port}`);
      if (callback) {
        callback(server);
      }
    });
  });
};

if (require.main === module) {
  runServer();
}

exports.app = app;
exports.runServer = runServer;

