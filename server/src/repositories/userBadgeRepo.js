'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class UserBadgeRepo extends BaseRepo {
  constructor() {
    super('user_badge', { softDelete: false });
  }

  listByUser(userId) {
    return this.prepare(
      'SELECT * FROM user_badge WHERE user_id = ? ORDER BY earned_at DESC, id DESC'
    ).all(userId);
  }

  /** 幂等发放：UNIQUE(user_id,badge_code) + INSERT OR IGNORE */
  grant(userId, badgeCode) {
    const t = helper.now();
    return this.prepare(
      'INSERT OR IGNORE INTO user_badge (user_id, badge_code, earned_at, created_at) VALUES (?, ?, ?, ?)'
    ).run(userId, badgeCode, t, t);
  }

  hasBadge(userId, badgeCode) {
    return !!this.prepare(
      'SELECT id FROM user_badge WHERE user_id = ? AND badge_code = ?'
    ).get(userId, badgeCode);
  }

  countByUser(userId) {
    return this.prepare('SELECT COUNT(*) AS c FROM user_badge WHERE user_id = ?').get(userId).c;
  }
}

module.exports = new UserBadgeRepo();
