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
let sqldb = require('../../sqldb');
let fs = require('fs');
let Sm = sqldb.Sm;
let client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
let fetch = require('node-fetch');
let base64 = require('base-64');
//let AWS = require('aws-sdk');
//AWS.config.update({
//        accessKeyId:  process.env.AWS_ACCESS_KEY_ID,
//        secretAccessKey:  process.env.AWS_SECRET_ACCESS_KEY,
//        region: 'us-west-2'
//    });

//let s3Bucket = new AWS.S3( { params: {Bucket: 'bering-reservations'} } );

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    console.log(res.boolean);
    if (entity&&!res.boolean) {
      res.boolean=true;
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
  let phone = req.body.phone;
  Sm.findAll({
    where: {$or: [{from: phone}, {to: phone}]},
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
  let buf=req.body.blob;
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
    let params = {
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

export function localCreate(req, res) {
  return Sm.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
}

// Creates a new Sm in the DB
export function createOld(req, res) {
  let sid,token;
  if (req.body.from===process.env.TWILIO_PHONE_NUMBER){
    console.log('reg TWILIO!');
    sid=process.env.TWILIO_ACCOUNT_SID;
    token=process.env.TWILIO_AUTH_TOKEN;
    client = require('twilio')(
      sid,token
    );
  }
  if (req.body.from===process.env.TWILIO_PHONE_NUMBER_ALT){
    console.log('ALT TWILIO!');
    sid=process.env.TWILIO_ACCOUNT_SID_ALT;
    token=process.env.TWILIO_AUTH_TOKEN_ALT;
    client = require('twilio')(
      sid,token
    );
  }
  if (req.body.from===process.env.TWILIO_PHONE_NUMBER_COUNTER){
    console.log('COUNTER TWILIO!');
    sid=process.env.TWILIO_ACCOUNT_SID_COUNTER;
    token=process.env.TWILIO_AUTH_TOKEN_COUNTER;
    client = require('twilio')(
      sid,token
    );
  }
  //req.body.from = process.env.TWILIO_PHONE_NUMBER;
  let params = {
    from: req.body.from ,
    to: req.body.to,
    //mediaUrl:req.body.mediaUrl,
    body: req.body.body
  };
  let timeout=0;
  if (req.body.mediaUrl && req.body.mediaUrl!==" " && !req.body.autoSMS) {
    params.mediaUrl=req.body.mediaUrl;
    timeout=2000;
  }
  let message=JSON.parse(JSON.stringify(req.body));
  let pair={};
  pair.message=message;
  pair.params=params;
  let array=[pair];
  if (message.autoSMS) {
    array=[];
    req.body.multiple.forEach((name)=>{
      params.to=name.phone;
      message.to=name.phone;
      pair={};
      pair.message=JSON.parse(JSON.stringify(message));
      pair.params=JSON.parse(JSON.stringify(params));
      array.push(pair);
    });
  }
  
  array.forEach((p,index)=>{
    setTimeout(()=>{
      client.messages.create(p.params, (err, message)=>{//then/catch?
        //err={status:400,message:"error"};
        if(err) {
            console.log('Failed to create at Twilio');
            console.log(client);
            console.error(err);
            res.status(err.status).send(err.message);
        }
        else{
          console.log('message ' + index + ' sent.');
          let url='https://api.twilio.com' + message.subresourceUris.media;
          let stub = url.replace('.json','');
          console.log(url);
          let headers = new fetch.Headers();
          headers.append('Authorization', 'Basic ' + base64.encode(sid + ":" + token));
          setTimeout(()=>{
            fetch(url, 
              {method: 'GET', headers: headers})
            .then(response => response.json())
            .then(json => {
              if (json.media_list&&json.media_list.length>0) {
                p.message.mediaUrl = stub + '/' + json.media_list[0].sid;
                //console.log(mediaUrl);
              }
              Sm.create(p.message)
                .then(responseWithResult(res, 201))
                .catch(handleError(res));
            })
            .catch(err=>{
              console.log(err);
              Sm.create(p.message)
                .then(responseWithResult(res, 201))
                .catch(handleError(res));
            });
          },timeout);
        }
      });
    },index*2000);
  });
}

// Creates a new Sm in the DB
export function create(req, res) {
  let sid,token;
  if (req.body.from===process.env.TWILIO_PHONE_NUMBER){
    console.log('reg TWILIO!');
    sid=process.env.TWILIO_ACCOUNT_SID;
    token=process.env.TWILIO_AUTH_TOKEN;
    client = require('twilio')(
      sid,token
    );
  }
  if (req.body.from===process.env.TWILIO_PHONE_NUMBER_ALT){
    console.log('ALT TWILIO!');
    sid=process.env.TWILIO_ACCOUNT_SID_ALT;
    token=process.env.TWILIO_AUTH_TOKEN_ALT;
    client = require('twilio')(
      sid,token
    );
  }
  if (req.body.from===process.env.TWILIO_PHONE_NUMBER_COUNTER){
    console.log('COUNTER TWILIO!');
    sid=process.env.TWILIO_ACCOUNT_SID_COUNTER;
    token=process.env.TWILIO_AUTH_TOKEN_COUNTER;
    client = require('twilio')(
      sid,token
    );
  }
  //req.body.from = process.env.TWILIO_PHONE_NUMBER;
  let params = {
    from: req.body.from ,
    to: req.body.to,
    //mediaUrl:req.body.mediaUrl,
    body: req.body.body
  };
  let timeout=0;
  if (req.body.mediaUrl && req.body.mediaUrl!==" " && !req.body.autoSMS) {
    params.mediaUrl=req.body.mediaUrl;
    timeout=2000;
  }
  let message=JSON.parse(JSON.stringify(req.body));
  let pair={};
  pair.message=message;
  pair.params=params;
  let array=[pair];
  if (message.autoSMS) {
    array=[];
    req.body.multiple.forEach((name)=>{
      params.to=name.phone;
      message.to=name.phone;
      pair={};
      pair.message=JSON.parse(JSON.stringify(message));
      pair.params=JSON.parse(JSON.stringify(params));
      array.push(pair);
    });
  }
  
  array.forEach((p,index)=>{
    setTimeout(()=>{
      client.messages.create(p.params).then(message=>{//, (err, message)=>{//then/catch?
        console.log('message ' + index + ' sent.');
        let url='https://api.twilio.com' + message.subresourceUris.media;
        let stub = url.replace('.json','');
        console.log(url);
        let headers = new fetch.Headers();
        headers.append('Authorization', 'Basic ' + base64.encode(sid + ":" + token));
        setTimeout(()=>{
          fetch(url, 
            {method: 'GET', headers: headers})
          .then(response => response.json())
          .then(json => {
            if (json.media_list&&json.media_list.length>0) {
              p.message.mediaUrl = stub + '/' + json.media_list[0].sid;
              //console.log(mediaUrl);
            }
            Sm.create(p.message)
              .then(responseWithResult(res, 201))
              .catch(handleError(res));
          })
          .catch(err=>{
            console.log(err);
            Sm.create(p.message)
              .then(responseWithResult(res, 201))
              .catch(handleError(res));
          });
        },timeout);
      })
      .catch(err=>{
        console.log('Failed to create at Twilio');
        console.log(client);
        console.error(err);
        if (!res.boolean) {
          res.boolean=true;
          res.status(err.status).send(err.message);
        }
      });
    },index*2000);
  });
}

// Creates a new Sm in the DB
export function incoming(req, res) {
  let sms = {to:req.body.To,
            from:req.body.From,
            body:req.body.Body,
            mediaUrl:req.body.MediaUrl0,
            sent: new Date()
  };
  console.log('incoming sms');
  //console.log(req.body);
  let resp = '<?xml version="1.0" encoding="UTF-8"?><Response>Response Text.</Response>';
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
    let sms = {to:'+' + req.query.to,
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
