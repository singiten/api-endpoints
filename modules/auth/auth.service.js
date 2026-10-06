// modules/auth/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const env = require('../../config/env');

/**
 * Build a signed JWT for a user.
 * Payload: { sub: userId, email }
 */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

/**
 * Register a new user.
 * Returns { user, token } — user never includes password_hash.
 */
async function register({ name, email, password }) {
  // 1. Check for existing email (unique constraint also protects us)
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (existing.rows.length > 0) {
    const err = new Error('An account with this email already exists.');
    err.status = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  // 2. Hash the password
  const password_hash = await bcrypt.hash(password, env.bcryptRounds);

  // 3. Insert
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, password_hash]
  );

  const user = rows[0];
  const token = signToken(user);
  return { user, token };
}

/**
 * Log in with email + password.
 * Returns { user, token } or throws 401 with generic message.
 */
async function login({ email, password }) {
  const { rows } = await db.query(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );

  // Generic message — never reveal whether the email exists (Lecture 14)
  const genericErr = () => {
    const err = new Error('Invalid credentials.');
    err.status = 401;
    err.code = 'AUTHENTICATION_ERROR';
    return err;
  };

  if (rows.length === 0) throw genericErr();

  const row = rows[0];
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw genericErr();

  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: row.created_at,
  };
  const token = signToken(user);
  return { user, token };
}

/**
 * Fetch the current user's profile by id (from req.user.id).
 */
async function getMe(userId) {
  const { rows } = await db.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (rows.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return rows[0];
}

module.exports = { register, login, getMe };