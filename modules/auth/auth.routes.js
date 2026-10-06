// modules/auth/auth.routes.js
const express = require('express');
const ctrl = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');

const router = express.Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;