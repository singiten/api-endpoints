
const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  console.log(`🚀 StockFlow Lite running on http://localhost:${env.port}`);
  console.log(`   Environment: ${env.nodeEnv}`);
});

// Graceful shutdown basics (not required by brief, but nice)
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});