// Instantiate all models
var mongoose = require('mongoose');
require('../../../server/db/models');
var Loop = mongoose.model('Loop');
var User = mongoose.model('User');
var Mix = mongoose.model('Mix');

// imported libraries 
var Promise = require('bluebird');
var expect = require('chai').expect;
var supertest = require('supertest');
var app = require('../../../server/app');

var headers = {'Referer': 'test'};

var dbURI = 'mongodb://localhost:27017/testMusicDB';
var clearDB = require('mocha-mongoose')(dbURI);

var loop, createdLoop;
var user, userInfo, loggedInAgent;
var otherUser, otherUserInfo, otherLoggedInAgent;
var guestAgent;

describe('/api/loops', function () {

  beforeEach('Establish DB connection', function (done) {
    if (mongoose.connection.db) return done();
    mongoose.connect(dbURI, done);
  });

  beforeEach('Create user', function (done) {

    guestAgent = supertest.agent(app);

    userInfo = {
      username: 'bob',
      email: 'bob@email.com',
      password: 'password'
    };

    User.create(userInfo)
    .then(function(u) {
      user = u;
      done();
    })
    .then(null, done)

  });

  beforeEach('Create loggedIn user agent and authenticate', function (done) {
    loggedInAgent = supertest.agent(app);
    loggedInAgent.post('/login').set(headers).send(userInfo).end(done);
  });

  beforeEach('Create loop', function(done) {

    loop = new Loop({
      creator: user._id,
      tags: ['cool'],
      name: 'Cool Loop',
      category: 'melody',
      notes: [ { duration: '2n', pitch: 'c5', startTime: '0:1:0'} ]
    });

    loop.save()
    .then(function(l) {
      loop = l;
      done();
    });

  });

  beforeEach('Create second user for access tests', function(done) {
    otherUserInfo = {
      username: 'ABC',
      email: 'abc@gmail.com',
      password: 'blah'
    }
    
    User.create(otherUserInfo)
    .then(function(u) {
      otherUser = u;
      done();
    });

  });

  beforeEach('Create other logged in agent and authenticate', function(done) {
    otherLoggedInAgent = supertest.agent(app);
    otherLoggedInAgent.post('/login').set(headers).send(otherUserInfo).end(done);
  });

  afterEach('Clear test database', function (done) {
    clearDB(done);
  });

  it('GET / retrieves all loops', function (done) {
    guestAgent
    .get('/api/loops')
    .set(headers)
    .expect(200)
    .end(function (err, res) {
      if (err) return done(err);
      expect(res.body).to.be.instanceof(Array);
      expect(res.body).to.have.length(1);
      done();
    });
  });

  it('POST creates a new loop for logged in user', function (done) {
    loggedInAgent
    .post('/api/loops')
    .set(headers)
    .send({
      creator: user._id,
      tags: ['cool'],
      name: 'Brand New Loop',
      category: 'melody',
      notes: [ { duration: '1n', pitch: 'c5', startTime: '0:1:0'} ]
    })
    .expect(201)
    .end(function (err, res) {
      if (err) return done(err);
      expect(res.body.name).to.equal('Brand New Loop');
      createdLoop = res.body;
      done();
    });
  });

  it('POST sends 401 - not authenticated for guests', function(done) {
    guestAgent
    .post('/api/loops')
    .set(headers)
    .send({
      creator: user._id,
      tags: ['cool'],
      name: 'Brand New Loop',
      category: 'melody',
      notes: [ { duration: '1n', pitch: 'c5', startTime: '0:1:0'} ]
    })
    .expect(401)
    .end(function (err, res) {
      if (err) return done(err);
      done();
    });
  });

  describe('/:loopId', function() {

    it('GET retrieves a single loop for guest', function (done) {
      guestAgent      
      .get('/api/loops/' + loop._id)
      .set(headers)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body.name).to.equal('Cool Loop');
        done();
      });
    });

    it('GET retrieves a single loop for logged in user', function(done) {
      loggedInAgent
      .get('/api/loops/' + loop._id)
      .set(headers)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body.name).to.equal('Cool Loop');
        done();
      });
    })

    it('GET one that doesn\'t exist returns status code 404', function (done) {
      guestAgent
      .get('/api/loops/notvalidid')
      .set(headers)
      .expect(404)
      .end(done);
    });

    it('PUT allows logged in user to update their loop', function (done) {
      loggedInAgent
      .put('/api/loops/' + loop._id)
      .set(headers)
      .send({
        notes: [
          {duration: '2n', pitch: 'c5', startTime: '0:1:0'},
          {duration: '1n', pitch: 'd5', startTime: '0:2:0'}
        ]
      })
      .expect(201)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body.notes.length).to.equal(2);
        done();
      });
    });

    it('PUT is not allowed for guest', function(done) {
      guestAgent
      .put('/api/loops/' + loop._id)
      .set(headers)
      .send({
        notes: [
          {duration: '2n', pitch: 'c5', startTime: '0:1:0'},
          {duration: '1n', pitch: 'd5', startTime: '0:2:0'}
        ]
      })
      .expect(401)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
    });

    it('PUT is not allowed for user other than loop creator', function(done) {
      otherLoggedInAgent
      .put('/api/loops/' + loop._id)
      .set(headers)
      .send({
        notes: [
          {duration: '2n', pitch: 'c5', startTime: '0:1:0'},
          {duration: '1n', pitch: 'd5', startTime: '0:2:0'}
        ]
      })
      .expect(403)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
    });

    it('PUT one that doesn\'t exist returns 404 status code', function (done) {
      loggedInAgent
      .put('/api/loops/notvalidid')
      .set(headers)
      .send({
        notes: [
          {duration: '2n', pitch: 'c5', startTime: '0:1:0'},
          {duration: '1n', pitch: 'd5', startTime: '0:2:0'}
        ]
      })
      .expect(404)
      .end(done);
    });

    it('DELETE allows creator to remove loop', function (done) {
      loggedInAgent
      .delete('/api/loops/' + loop._id)
      .set(headers)
      .expect(204)
      .end(function (err, res) {
        if (err) return done(err);
        Loop.findById(loop._id, function (err, loop) {
          if (err) return done(err);
          expect(loop).to.be.null;
          done();
        });
      });
    });

    it('DELETE returns 404 status code if loop doesn\'t exist', function (done) {
      loggedInAgent
      .delete('/api/loops/notvalidid')
      .set(headers)
      .expect(404)
      .end(done);
    });

    it('DELETE sends 403, forbidden, for user other than loop creator', function(done) {
      otherLoggedInAgent
      .delete('/api/loops/' + loop._id)
      .set(headers)
      .send()
      .expect(403)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
    });

  });

  describe('/mixes', function(done) {

    var mix;

    beforeEach('create a mix containing the loop', function (done) {
      Mix.create({
        creator: user._id,
        title: "Mix1",
        description: "Just something for fun",
        tracks: [
          {
            measures: [{}, {loop: loop._id}, {}]
          }
        ]
      })
      .then(function(m){
        console.log('created mix');
        mix = m;
        done();
      });

    });

    it('GET retrieves all mixes containing the loop', function (done) {
      loggedInAgent
      .get('/api/loops/' + loop._id + '/mixes')
      .set(headers)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.be.instanceof(Array);
        expect(res.body).to.have.length(1);
        done();
      });
    });

    it('GET works for guests', function(done) {
      guestAgent
      .get('/api/loops/' + loop._id + '/mixes')
      .set(headers)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.be.instanceof(Array);
        expect(res.body).to.have.length(1);
        done();
      });
    });

  });

});
