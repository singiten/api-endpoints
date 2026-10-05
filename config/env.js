
require('dotenv').config();

const required = [
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BCRYPT_ROUNDS',
  'RESERVATION_EXPIRY_MINUTES',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}`
  );
}

module.exports = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS),
  reservationExpiryMinutes: Number(process.env.RESERVATION_EXPIRY_MINUTES),
};