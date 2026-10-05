
const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl,
  
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});


async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.nodeEnv === 'development') {
    console.log('query', { text, duration, rows: res.rowCount });
  }
  return res;
}


async function getClient() {
  const client = await pool.connect();
  return client;
}

module.exports = { pool, query, getClient };