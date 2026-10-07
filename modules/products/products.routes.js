// modules/products/products.routes.js
const express = require('express');
const ctrl = require('./products.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

// Merge :organizationId into params so requireRole can find it
const router = express.Router({ mergeParams: true });

// Read: any member
router.get(
  '/organizations/:organizationId/products',
  authenticate,
  requireRole('org_admin', 'staff', 'viewer'),
  ctrl.list
);

router.get(
  '/organizations/:organizationId/products/:productId',
  authenticate,
  requireRole('org_admin', 'staff', 'viewer'),
  ctrl.getOne
);

// Write: org_admin + staff
router.post(
  '/organizations/:organizationId/products',
  authenticate,
  requireRole('org_admin', 'staff'),
  ctrl.create
);

router.patch(
  '/organizations/:organizationId/products/:productId',
  authenticate,
  requireRole('org_admin', 'staff'),
  ctrl.update
);

// Delete: org_admin only
router.delete(
  '/organizations/:organizationId/products/:productId',
  authenticate,
  requireRole('org_admin'),
  ctrl.remove
);

module.exports = router;