
const db = require('../../config/db');


async function createProduct({ organizationId, sku, name, price, status }) {
  // Unique-per-org SKU check (constraint also protects us)
  const exists = await db.query(
    'SELECT id FROM products WHERE organization_id = $1 AND sku = $2',
    [organizationId, sku]
  );
  if (exists.rows.length > 0) {
    const err = new Error('A product with this SKU already exists in this organization.');
    err.status = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  const { rows } = await db.query(
    `INSERT INTO products (organization_id, sku, name, price, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, organization_id, sku, name, price, status, created_at`,
    [organizationId, sku, name, price, status || 'ACTIVE']
  );
  return rows[0];
}

/**
 * List products with pagination, search, filtering, sorting.
 * All results are scoped to organizationId.
 */
async function listProducts({
  organizationId,
  page = 1,
  limit = 20,
  search,
  status,
  sortBy = 'created_at',
  sortDir = 'desc',
}) {
  // --- Validate/normalize inputs ---
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const allowedSort = ['created_at', 'name', 'price', 'sku'];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const sortDirection = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const allowedStatus = ['ACTIVE', 'INACTIVE'];

  // --- Build WHERE clauses safely (parameterized) ---
  const where = ['organization_id = $1'];
  const params = [organizationId];

  if (search && typeof search === 'string' && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    where.push(`LOWER(name) LIKE $${params.length}`);
  }

  if (status) {
    if (!allowedStatus.includes(status)) {
      const err = new Error(`status must be one of: ${allowedStatus.join(', ')}`);
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  // --- Count total (for pagination metadata) ---
  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM products ${whereSql}`,
    params
  );
  const total = countResult.rows[0].total;

  // --- Fetch page (sort column is whitelisted, so safe to interpolate) ---
  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const { rows } = await db.query(
    `SELECT id, organization_id, sku, name, price, status, created_at
       FROM products
       ${whereSql}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return {
    items: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Get one product by id (scoped to the caller's organization).
 * If not found or belongs to another org → 404.
 */
async function getProduct({ organizationId, productId }) {
  const { rows } = await db.query(
    `SELECT id, organization_id, sku, name, price, status, created_at
       FROM products
      WHERE id = $1 AND organization_id = $2`,
    [productId, organizationId]
  );
  if (rows.length === 0) {
    const err = new Error('Product not found.');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return rows[0];
}

/**
 * Partial update of a product.
 * Only provided fields get updated.
 */
async function updateProduct({ organizationId, productId, fields }) {
  const allowed = ['sku', 'name', 'price', 'status'];
  const updates = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      params.push(fields[key]);
      updates.push(`${key} = $${params.length}`);
    }
  }

  if (updates.length === 0) {
    const err = new Error('No valid fields to update.');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Scope update to organization_id → cross-tenant update becomes a no-op
  params.push(productId);
  params.push(organizationId);

  const { rows } = await db.query(
    `UPDATE products
        SET ${updates.join(', ')}
      WHERE id = $${params.length - 1}
        AND organization_id = $${params.length}
      RETURNING id, organization_id, sku, name, price, status, created_at`,
    params
  );

  if (rows.length === 0) {
    const err = new Error('Product not found.');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return rows[0];
}

/**
 * Delete a product (scoped to organization).
 */
async function deleteProduct({ organizationId, productId }) {
  const { rowCount } = await db.query(
    'DELETE FROM products WHERE id = $1 AND organization_id = $2',
    [productId, organizationId]
  );
  if (rowCount === 0) {
    const err = new Error('Product not found.');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
}

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};