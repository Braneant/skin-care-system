'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class UsageLogRepo extends BaseRepo {
  constructor() {
    super('usage_log', { softDelete: false });
  }

  listByUser(userId, productId = null) {
    if (productId) {
      return this.prepare(
        'SELECT * FROM usage_log WHERE user_id = ? AND product_id = ? ORDER BY created_at DESC LIMIT 200'
      ).all(userId, productId);
    }
    return this.prepare(
      'SELECT * FROM usage_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 200'
    ).all(userId);
  }

  create(userId, { productId, action, note = '', skinSnapshot = null }) {
    return this.insert({
      user_id: userId,
      product_id: productId,
      action,
      note,
      skin_snapshot: skinSnapshot ? JSON.stringify(skinSnapshot) : null,
      created_at: helper.now(),
    });
  }
}

module.exports = new UsageLogRepo();
