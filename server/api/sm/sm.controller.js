/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/sms              ->  index
 * POST    /api/sms              ->  create
 * GET     /api/sms/:id          ->  show
 * PUT     /api/sms/:id          ->  update
 * DELETE  /api/sms/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
var sqldb = require('../../sqldb');
var Sm = sqldb.Sm;
var client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  
    console.log(res);
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function saveUpdates(updates) {
  return function(entity) {
    return entity.updateAttributes(updates)
      .then(updated => {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of Sms
export function index(req, res) {
  Sm.findAll({
    order:[['sent','DESC']],
    limit:200
  })
    .then(responseWithResult(res))
    .catch(handleError(res));
}

// Gets a single Sm from the DB
export function show(req, res) {
  Sm.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
}

// Creates a new Sm in the DB
export function create(req, res) {
  req.body.from = process.env.TWILIO_PHONE_NUMBER;
  client.messages.create({
    from: req.body.from,
    to: req.body.to,
    body: req.body.body
  }, function(err, message) {
      if(err) {
          console.log('Failed');
          console.error(err.message);
      }
  });
  return Sm.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
}

// Creates a new Sm in the DB
export function incoming(req, res) {
  var sms = {to:req.body.To,
            from:req.body.From,
            body:req.body.Body,
            mediaUrl:req.body.MediaUrl0,
            sent: new Date()
  };
  console.log('incoming sms');
  console.log(req.body);
  return Sm.create(sms)
    .then(function(){res.send("<Response/>")})
    .catch(handleError(res));
}

// Creates a new Sm in the DB
export function nexmo(req, res) {
  if (Object.keys(req.query).length === 0) {
    res.status(200).end();
  }
  else {
    var sms = {to:'+' + req.query.to,
              from:'+' + req.query.msisdn,
              body:req.query.text,
              mediaUrl:req.query.MediaUrl0,
              sent: new Date()
    };
    return Sm.create(sms)
      .then(responseWithResult(res, 201))
      .catch(handleError(res));
  }
  
}

// Updates an existing Sm in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Sm.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
}

// Deletes a Sm from the DB
export function destroy(req, res) {
  Sm.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}