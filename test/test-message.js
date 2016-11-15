/* global describe, beforeEach, it */

global.databaseUri = 'mongodb://localhost/sup-dev';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const UrlPattern = require('url-pattern');
const app = require('../server').app;

const User = require('../server/models/user');
const Message = require('../server/models/message');

const makeSpy = require('./spy');

const should = chai.should();

chai.use(chaiHttp);

const alice = { username: 'alice', password: 'pw', _id: 'aaaaaaaaaaaaaaaaaaaaaaaa'};
const bob = { username: 'bob', password: 'pw', _id: 'bbbbbbbbbbbbbbbbbbbbbbbb'};
const chuck = { username: 'chuck', password: 'pw', _id: 'cccccccccccccccccccccccc'};
const listPattern = new UrlPattern('/api/v1/messages');
const singlePattern = new UrlPattern('/api/v1/messages/:messageId');

describe('Message endpoints', function () {
  beforeEach((done) => {
    // Clear the database
    mongoose.connection.db.dropDatabase(function (err, res) {
      // Add three example users
      const promiseA = User.createUser(alice.username, alice.password, alice._id);
      const promiseB = User.createUser(bob.username, bob.password, bob._id);
      const promiseC = User.createUser(chuck.username, chuck.password, chuck._id);
      Promise.all([promiseA, promiseB, promiseC]).then(function () {
        done();
      });
    });
  });

  describe('/api/v1/messages', function () {
    describe('GET', function () {
      it('should return an empty list of messages initially', function () {
        // Get the list of messages
        return chai.request(app)
          .get(listPattern.stringify())
          .auth('alice', 'pw')
          .then(function (res) {
            // Check that it's an empty array
            res.should.have.status(200);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.body.should.be.an('array');
            res.body.length.should.equal(0);
          });
      });

      it('should return a list of messages from or to authenticated user', function () {
        var messageA = {
          from: alice._id,
          to: bob._id,
          text: 'Hi Bob'
        };
        var messageB = {
          from: alice._id,
          to: chuck._id,
          text: 'Hi Chuck'
        };
        var messageC = {
          from: bob._id,
          to: chuck._id,
          text: 'Hi Chuck'
        };
        var messageD = {
          from: bob._id,
          to: alice._id,
          text: 'Hi Alice'
        };

        // Create three messages
        Message.create([messageA, messageB, messageC, messageD])
          .then(function (res) {
            // Get the list of messages
            return chai.request(app)
              .get(listPattern.stringify())
              .auth('alice', 'pw');
          })
          .then(function (res) {
            // Check that the messages are in the array
            res.should.have.status(200);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.body.should.be.an('array');
            res.body.length.should.equal(3);

            var message = res.body[0];
            message.should.be.an('object');
            message.should.have.property('text');
            message.text.should.be.a('string');
            message.text.should.equal(messageA.text);
            message.should.have.property('to');
            message.from.should.be.an('object');
            message.from.should.have.property('username');
            message.from.username.should.equal(alice.username);
            message.to.should.be.an('object');
            message.to.should.have.property('username');
            message.to.username.should.equal(bob.username);

          }.bind(this))
          .catch(err => err);
      });

      it('should allow filtering by to', () => {
        let messageA = {
          from: alice._id,
          to: bob._id,
          text: 'Hi Bob'
        };
        let messageB = {
          from: alice._id,
          to: chuck._id,
          text: 'Hi Chuck'
        };
        let messageC = {
          from: bob._id,
          to: chuck._id,
          text: 'Hi Chuck'
        };

        // Create three messages
        messageA = new Message(messageA);
        messageB = new Message(messageB);
        messageC = new Message(messageC);

        // Save them to the database
        Message.create([ messageA, messageB, messageC ])
          .then((res) => {
            // Get the list of messages to Chuck
            const url = listPattern.stringify() + '?to=' + bob._id;
            return chai.request(app)
              .get(url)
              .auth('alice', 'pw');
          })
          .then(function (res) {
            // Check that the correct messages are in the array
            res.should.have.status(200);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.body.should.be.an('array');
            res.body.length.should.equal(1);

            var message = res.body[0];
            message.should.be.an('object');
            message.should.have.property('text');
            message.text.should.be.a('string');
            message.text.should.equal(messageB.text);
            message.should.have.property('to');
            message.from.should.be.an('object');
            message.from.should.have.property('username');
            message.from.username.should.equal(alice.username);
            message.to.should.be.an('object');
            message.to.should.have.property('username');
            message.to.username.should.equal(bob.username);
          });
      });

    });

    describe('POST', function () {
      it('should allow adding a message from authenticated user', () => {
        var message = {
          from: alice._id,
          to: bob._id,
          text: 'Hi Bob'
        };
        // Add a message
        return chai.request(app)
          .post(listPattern.stringify())
          .send(message)
          .auth('alice', 'pw')
          .then((res) => {
            // Check that an empty object was returned
            res.should.have.status(201);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.should.have.header('location');
            res.body.should.be.an('object');
            res.body.should.be.empty;

            var params = singlePattern.match(res.headers.location);
            // Fetch the message from the database, using the ID
            // from the location header
            return Message.findById(params.messageId).exec();
          })
          .then((res) => {
            // Check that the message has been added to the
            // database
            should.exist(res);
            res.should.have.property('text');
            res.text.should.be.a('string');
            res.text.should.equal(message.text);
            res.should.have.property('from');
            res.from.toString().should.equal(alice._id);
            res.should.have.property('to');
            res.to.toString().should.equal(bob._id);
          });
      });

      it('should reject messages without text', function () {
        ;
        var message = {
          from: alice._id,
          to: bob._id
        };
        var spy = makeSpy();
        // Add a message without text
        return chai.request(app)
          .post(listPattern.stringify())
          .send(message)
          .then(spy)
          .catch(function (err) {
            // If the request fails, make sure it contains the
            // error
            var res = err.response;
            res.should.have.status(422);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.body.should.be.an('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('Missing field: text');
          })
          .then(function () {
            // Check that the request didn't succeed
            spy.called.should.be.false;
          });
      });

      it('should reject non-string text', function () {
        ;
        var message = {
          from: alice._id,
          to: bob._id,
          text: 42
        };
        var spy = makeSpy();
        // Add a message with non-string text
        return chai.request(app)
          .post(listPattern.stringify())
          .send(message)
          .then(spy)
          .catch(function (err) {
            // If the request fails, make sure it contains the
            // error
            var res = err.response;
            res.should.have.status(422);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.body.should.be.an('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('Incorrect field type: text');
          })
          .then(function () {
            // Check that the request didn't succeed
            spy.called.should.be.false;
          });
      });

      it('should reject non-string to', function () {
        var message = {
          from: alice._id,
          to: 42,
          text: 'Hi Bob'
        };
        var spy = makeSpy();
        // Add a message with non-string to
        return chai.request(app)
          .post(listPattern.stringify())
          .send(message)
          .then(spy)
          .catch(function (err) {
            // If the request fails, make sure it contains the
            // error
            var res = err.response;
            res.should.have.status(422);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.body.should.be.an('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('Incorrect field type: to');
          })
          .then(function () {
            // Check that the request didn't succeed
            spy.called.should.be.false;
          });
      });

      it('should reject messages to non-existent users', function () {
        var message = {
          from: alice._id,
          to: 'dddddddddddddddddddddddd',
          text: 'Hi Dan'
        };
        var spy = makeSpy();
        // Add a message to a non-existent user
        return chai.request(app)
          .post(listPattern.stringify())
          .send(message)
          .then(spy)
          .catch(function (err) {
            // If the request fails, make sure it contains the
            // error
            var res = err.response;
            res.should.have.status(422);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.body.should.be.an('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('Incorrect field value: to');
          })
          .then(function () {
            // Check that the request didn't succeed
            spy.called.should.be.false;
          });
      });
    });
  });

  describe('/api/v1/messages/:messageId', function () {
    describe('GET', function () {
      it('should 404 on non-existent messages', function () {
        var spy = makeSpy();
        // Get a message which doesn't exist
        return chai.request(app)
          .get(singlePattern.stringify({ messageId: '000000000000000000000000' }))
          .then(spy)
          .catch(function (err) {
            // If the request fails, make sure it contains the
            // error
            var res = err.response;
            res.should.have.status(404);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.body.should.be.an('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('Message not found');
          })
          .then(function () {
            // Check that the request didn't succeed
            spy.called.should.be.false;
          });
      });
      
      it('should return a single message', function () {
        var message = {
          from: alice._id,
          to: bob._id,
          text: 'Hi Bob'
        };
        var messageId;
        // Add a message to the database
        return new Message(message).save()
          .then(function (res) {
            messageId = res._id.toString();
            // Request the message
            return chai.request(app)
              .get(singlePattern.stringify({
                messageId: messageId
              }));
          }.bind(this))
          .then(function (res) {
            // Check that the message is returned
            res.should.have.status(200);
            res.type.should.equal('application/json');
            res.charset.should.equal('utf-8');
            res.body.should.be.an('object');
            res.body.should.be.an('object');
            res.body.should.have.property('text');
            res.body.text.should.be.a('string');
            res.body.text.should.equal(message.text);
            res.body.should.have.property('to');
            res.body.from.should.be.an('object');
            res.body.from.should.have.property('username');
            res.body.from.username.should.equal(alice.username);
            res.body.to.should.be.an('object');
            res.body.to.should.have.property('username');
            res.body.to.username.should.equal(bob.username);
          }.bind(this));
      });
    });
  });
});
