'use strict';

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {
  DOMAIN:           'http://localhost:9000',
  SESSION_SECRET:   'newsimple-secret',
  SEQUELIZE_URI: '',
  // Control debug level for modules using visionmedia/debug
  DEBUG: '',
  
  TWILIO_AUTH_TOKEN: '',
  TWILIO_ACCOUNT_SID: '',
  TWILIO_PHONE_NUMBER: '',
  TWILIO_PHONE_NUMBER_SID: '',
  
  AWS_ACCESS_KEY_ID: '',
  AWS_SECRET_ACCESS_KEY: ''
};
