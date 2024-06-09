
'use strict';

var express = require('express');
var controller = require('./sm.controller');
import * as auth from '../../auth/auth.service';

var router = express.Router();

router.get('/', controller.nexmo);
router.post('/', controller.nexmo);
router.post('/all', auth.hasRole('admin'), controller.index);
router.get('/:id', auth.hasRole('admin'), controller.show);
router.post('/image', auth.hasRole('admin'), controller.image);
router.post('/twilio', auth.hasRole('admin'), controller.create);
router.post('/incoming', controller.incoming);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.post('/local', auth.hasRole('admin'), controller.localCreate);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;