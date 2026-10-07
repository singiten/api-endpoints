// modules/products/products.controller.js
const service = require('./products.service');

function parseId(raw, label = 'id') {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`${label} must be a positive integer.`);
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return n;
}

function validateCreate(body) {
  const { sku, name, price } = body || {};
  const errors = [];

  if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
    errors.push('sku is required');
  }
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name must be at least 2 characters');
  }
  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    errors.push('price must be a non-negative number');
  }

  if (errors.length > 0) {
    const err = new Error(`Validation failed: ${errors.join('; ')}`);
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
}

async function create(req, res, next) {
  try {
    validateCreate(req.body);
    const organizationId = parseId(req.params.organizationId, 'organizationId');
    const { sku, name, price, status } = req.body;
    const product = await service.createProduct({
      organizationId,
      sku: sku.trim(),
      name: name.trim(),
      price: Number(price),
      status,
    });
    res.status(201).json({ success: true, data: { product } });
  } catch (e) { next(e); }
}

async function list(req, res, next) {
  try {
    const organizationId = parseId(req.params.organizationId, 'organizationId');
    const result = await service.listProducts({
      organizationId,
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      sortBy: req.query.sortBy,
      sortDir: req.query.sortDir,
    });
    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (e) { next(e); }
}

async function getOne(req, res, next) {
  try {
    const organizationId = parseId(req.params.organizationId, 'organizationId');
    const productId = parseId(req.params.productId, 'productId');
    const product = await service.getProduct({ organizationId, productId });
    res.status(200).json({ success: true, data: { product } });
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const organizationId = parseId(req.params.organizationId, 'organizationId');
    const productId = parseId(req.params.productId, 'productId');
    const product = await service.updateProduct({
      organizationId,
      productId,
      fields: req.body || {},
    });
    res.status(200).json({ success: true, data: { product } });
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const organizationId = parseId(req.params.organizationId, 'organizationId');
    const productId = parseId(req.params.productId, 'productId');
    await service.deleteProduct({ organizationId, productId });
    res.status(204).send();
  } catch (e) { next(e); }
}

module.exports = { create, list, getOne, update, remove };