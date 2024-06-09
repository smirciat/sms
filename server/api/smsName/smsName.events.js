/**
 * SmsName model events
 */

'use strict';

import {EventEmitter} from 'events';
var SmsName = require('../../sqldb').SmsName;
var SmsNameEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
SmsNameEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  SmsName.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    SmsNameEvents.emit(event + ':' + doc._id, doc);
    SmsNameEvents.emit(event, doc);
    done(null);
  }
}

export default SmsNameEvents;
