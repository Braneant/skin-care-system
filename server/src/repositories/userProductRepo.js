'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class UserProductRepo extends BaseRepo {
  constructor() {
    super('user_product', { softDelete: false });
  }

  listByUser(userId) {
    return this.prepare(
      `SELECT up.*, p.name, p.brand, p.category, p.image_url, p.description, p.ingredients
       FROM user_product up JOIN products p ON p.id = up.product_id
       WHERE up.user_id = ? AND p.deleted_at IS NULL
       ORDER BY up.created_at DESC`
    ).all(userId);
  }

  findByUserProduct(userId, productId) {
    return this.prepare(
      'SELECT * FROM user_product WHERE user_id = ? AND product_id = ?'
    ).get(userId, productId);
  }

  /** 添加/更新产品柜（UNIQUE(user_id, product_id) 冲突则更新状态与匹配度） */
  upsert(userId, productId, status = 'using', matchedScore = null) {
    const t = helper.now();
    return this.prepare(
      `INSERT INTO user_product (user_id, product_id, status, matched_score, added_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, product_id) DO UPDATE SET
         status = excluded.status, matched_score = excluded.matched_score, updated_at = excluded.updated_at`
    ).run(userId, productId, status, matchedScore, t, t, t);
  }

  updateStatus(id, status) {
    return this.updateById(id, { status });
  }

  remove(id) {
    return this.hardDelete(id);
  }
}

module.exports = new UserProductRepo();
