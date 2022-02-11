/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/smsNames              ->  index
 * POST    /api/smsNames              ->  create
 * GET     /api/smsNames/:id          ->  show
 * PUT     /api/smsNames/:id          ->  update
 * DELETE  /api/smsNames/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
var sqldb = require('../../sqldb');
var SmsName = sqldb.SmsName;

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
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

// Gets a list of SmsNames
export function index(req, res) {
  SmsName.findAll()
    .then(responseWithResult(res))
    .catch(handleError(res));
}

// Gets a single SmsName from the DB
export function show(req, res) {
  SmsName.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
}

// Creates a new SmsName in the DB
export function create(req, res) {
  SmsName.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
}

// Updates an existing SmsName in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  SmsName.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
}

// Deletes a SmsName from the DB
export function destroy(req, res) {
  SmsName.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}