'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class PlanRepo extends BaseRepo {
  constructor() {
    super('plans', { softDelete: false });
  }

  latestByUser(userId) {
    return this.prepare(
      'SELECT * FROM plans WHERE user_id = ? AND status = 1 ORDER BY created_at DESC LIMIT 1'
    ).get(userId);
  }

  listByUser(userId) {
    return this.prepare(
      'SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(userId);
  }

  /** 使历史方案失效 */
  deactivateByUser(userId) {
    return this.prepare(
      'UPDATE plans SET status = 0, updated_at = ? WHERE user_id = ? AND status = 1'
    ).run(helper.now(), userId);
  }

  /** 生成新方案并置旧方案历史 */
  createNew(userId, data) {
    const tx = this.db.transaction(() => {
      this.deactivateByUser(userId);
      return this.insert({ user_id: userId, status: 1, ...data });
    });
    return tx();
  }
}

module.exports = new PlanRepo();
