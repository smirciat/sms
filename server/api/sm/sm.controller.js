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
var fs = require('fs');
var Sm = sqldb.Sm;
var client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
var fetch = require('node-fetch');
var base64 = require('base-64');
//var AWS = require('aws-sdk');
//AWS.config.update({
//        accessKeyId:  process.env.AWS_ACCESS_KEY_ID,
//        secretAccessKey:  process.env.AWS_SECRET_ACCESS_KEY,
//        region: 'us-west-2'
//    });

//var s3Bucket = new AWS.S3( { params: {Bucket: 'bering-reservations'} } );

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

// Gets a list of Sms
export function index(req, res) {
  Sm.findAll({
    order:[['_id','DESC']],
    limit:2000
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

// Uploads an image to ./server/png/
export function image(req, res) {
  var buf=req.body.blob;
  buf = new Buffer(buf.replace(/^data:image\/\w+;base64,/, ""),'base64');
  fs.writeFile("./server/png/"+req.body.filename, buf, 'base64', (err)=> {
    if (err) {
        throw err;
      }
      else {
        console.log(`File uploaded successfully.`);
        res.sendStatus(200);
      }
  });
    var params = {
      Bucket: 'bering-reservations',
      ACL: 'public-read',
      Key: 'images/' + req.body.filename,
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'image/png'
    };
    //s3Bucket.upload(params, function(err, data) {
      
    //});
}

// Creates a new Sm in the DB
export function create(req, res) {
  req.body.from = process.env.TWILIO_PHONE_NUMBER;
  var params = {
    from: req.body.from ,
    to: req.body.to,
    //mediaUrl:req.body.mediaUrl,
    body: req.body.body
  };
  var timeout=0;
  if (req.body.mediaUrl&&req.body.mediaUrl!==" ") {
    params.mediaUrl=req.body.mediaUrl;
    timeout=2000;
  }
  client.messages.create(params, (err, message)=>{
      if(err) {
          console.log('Failed to create at Twilio');
          console.error(err);
          res.status(err.status).send(err.message);
      }
      else{
        var url='https://api.twilio.com/' + message.subresourceUris.media;
        var stub = url.replace('.json','');
        console.log(url);
        let headers = new fetch.Headers();
        headers.append('Authorization', 'Basic ' + base64.encode(process.env.TWILIO_ACCOUNT_SID + ":" + process.env.TWILIO_AUTH_TOKEN));
        setTimeout(()=>{
          fetch(url, 
            {method: 'GET', headers: headers})
          .then(response => response.json())
          .then(json => {
            if (json.media_list&&json.media_list.length>0) {
              req.body.mediaUrl = stub + '/' + json.media_list[0].sid;
              //console.log(mediaUrl);
            }
            Sm.create(req.body)
              .then(responseWithResult(res, 201))
              .catch(handleError(res));
          })
          .catch(err=>{
            console.log(err);
            Sm.create(req.body)
              .then(responseWithResult(res, 201))
              .catch(handleError(res));
          });
        },timeout);
      }
  });
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
  //console.log(req.body);
  var resp = '<?xml version="1.0" encoding="UTF-8"?><Response>Response Text.</Response>';
  res.writeHead(201, {
    'Content-Type':'text/xml'
  });
  return Sm.create(sms)
    .then(function(){res.end(resp)})
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