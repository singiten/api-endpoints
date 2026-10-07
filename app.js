
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Global middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use(rateLimiter);

// --- Health check (no DB call yet — will add later) ---
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

// --- API v1 routes ---
// We'll uncomment these as we build each module:
// const authRoutes = require('./modules/auth/auth.routes');
// app.use('/api/v1/auth', authRoutes);
// const orgRoutes = require('./modules/organizations/organizations.routes');
// app.use('/api/v1/organizations', orgRoutes);
 const productRoutes = require('./modules/products/products.routes');
 app.use('/api/v1/products', productRoutes);
// const warehouseRoutes = require('./modules/warehouses/warehouses.routes');
// app.use('/api/v1/warehouses', warehouseRoutes);
// const inventoryRoutes = require('./modules/inventory/inventory.routes');
// app.use('/api/v1/inventory', inventoryRoutes);
// const customerRoutes = require('./modules/customers/customers.routes');
// app.use('/api/v1/customers', customerRoutes);
// const orderRoutes = require('./modules/orders/orders.routes');
// app.use('/api/v1/orders', orderRoutes);
// const auditRoutes = require('./modules/audit/audit.routes');
// app.use('/api/v1/audit-logs', auditRoutes);

// --- 404 handler (unknown route) ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
      requestId: req.id || null,
    },
  });
});

// --- Central error handler (must be LAST) ---
app.use(errorHandler);

module.exports = app;