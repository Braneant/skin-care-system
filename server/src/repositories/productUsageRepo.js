'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class ProductUsageRepo extends BaseRepo {
  constructor() {
    super('product_usage', { softDelete: false });
  }

  listByUser(userId) {
    return this.prepare(
      `SELECT pu.*, p.name, p.brand, p.category
       FROM product_usage pu JOIN products p ON p.id = pu.product_id
       WHERE pu.user_id = ? AND p.deleted_at IS NULL
       ORDER BY pu.opened_at ASC`
    ).all(userId);
  }

  findByUserProduct(userId, productId) {
    return this.prepare(
      `SELECT pu.*, p.name, p.brand, p.category
       FROM product_usage pu JOIN products p ON p.id = pu.product_id
       WHERE pu.user_id = ? AND pu.product_id = ?`
    ).get(userId, productId);
  }

  /** 设置/更新开封有效期（UNIQUE(user_id, product_id) 冲突则更新） */
  upsert(userId, productId, openedAt, expireMonths = 12, note = '') {
    const t = helper.now();
    return this.prepare(
      `INSERT INTO product_usage (user_id, product_id, opened_at, expire_months, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, product_id) DO UPDATE SET
         opened_at = excluded.opened_at, expire_months = excluded.expire_months,
         note = excluded.note, updated_at = excluded.updated_at`
    ).run(userId, productId, openedAt, expireMonths, note, t, t);
  }
}

module.exports = new ProductUsageRepo();
