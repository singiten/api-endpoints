// modules/auth/auth.controller.js
const authService = require('./auth.service');

/**
 * Manual validation — no library (per brief Section 11).
 * Throws a 400 with code VALIDATION_ERROR if anything is off.
 */
function validateRegister(body) {
  const errors = [];
  const { name, email, password } = body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name must be at least 2 characters');
  }
  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('email must be a valid email address');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('password must be at least 8 characters');
  }

  if (errors.length > 0) {
    const err = new Error(`Validation failed: ${errors.join('; ')}`);
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
}

function validateLogin(body) {
  const { email, password } = body || {};
  if (
    !email || typeof email !== 'string' ||
    !password || typeof password !== 'string'
  ) {
    const err = new Error('email and password are required.');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
}

async function register(req, res, next) {
  try {
    validateRegister(req.body);
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    validateLogin(req.body);
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data: { user } });
  } catch (e) {
    next(e);
  }
}

module.exports = { register, login, me };