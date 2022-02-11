'use strict';

var app = require('../..');
import request from 'supertest';

var newSmsName;

describe('SmsName API:', function() {

  describe('GET /api/smsNames', function() {
    var smsNames;

    beforeEach(function(done) {
      request(app)
        .get('/api/smsNames')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          smsNames = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(smsNames).to.be.instanceOf(Array);
    });

  });

  describe('POST /api/smsNames', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/smsNames')
        .send({
          name: 'New SmsName',
          info: 'This is the brand new smsName!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newSmsName = res.body;
          done();
        });
    });

    it('should respond with the newly created smsName', function() {
      expect(newSmsName.name).to.equal('New SmsName');
      expect(newSmsName.info).to.equal('This is the brand new smsName!!!');
    });

  });

  describe('GET /api/smsNames/:id', function() {
    var smsName;

    beforeEach(function(done) {
      request(app)
        .get('/api/smsNames/' + newSmsName._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          smsName = res.body;
          done();
        });
    });

    afterEach(function() {
      smsName = {};
    });

    it('should respond with the requested smsName', function() {
      expect(smsName.name).to.equal('New SmsName');
      expect(smsName.info).to.equal('This is the brand new smsName!!!');
    });

  });

  describe('PUT /api/smsNames/:id', function() {
    var updatedSmsName;

    beforeEach(function(done) {
      request(app)
        .put('/api/smsNames/' + newSmsName._id)
        .send({
          name: 'Updated SmsName',
          info: 'This is the updated smsName!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedSmsName = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedSmsName = {};
    });

    it('should respond with the updated smsName', function() {
      expect(updatedSmsName.name).to.equal('Updated SmsName');
      expect(updatedSmsName.info).to.equal('This is the updated smsName!!!');
    });

  });

  describe('DELETE /api/smsNames/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/smsNames/' + newSmsName._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when smsName does not exist', function(done) {
      request(app)
        .delete('/api/smsNames/' + newSmsName._id)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
