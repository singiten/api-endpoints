
const jwt = require('jsonwebtoken');
const env = require('../config/env');


function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    const err = new Error('Authentication required.');
    err.status = 401;
    err.code = 'AUTHENTICATION_ERROR';
    return next(err);
  }

  const token = header.slice(7).trim();

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    // Expected payload shape: { sub: userId, email }
    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    return next();
  } catch (e) {
    const err = new Error('Invalid or expired token.');
    err.status = 401;
    err.code = 'AUTHENTICATION_ERROR';
    return next(err);
  }
}

module.exports = authenticate;