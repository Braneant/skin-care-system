'use strict';

const BaseRepo = require('./baseRepo');

class DetectRecordRepo extends BaseRepo {
  constructor() {
    super('detect_records', { softDelete: false });
  }

  listByUser(userId, limit = 50) {
    return this.prepare(
      'SELECT * FROM detect_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(userId, limit);
  }

  latestByUser(userId) {
    return this.prepare(
      'SELECT * FROM detect_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(userId);
  }

  /** 趋势采样：每日最新一条 */
  trendByUser(userId, days = 30) {
    return this.prepare(
      `SELECT * FROM detect_records
       WHERE user_id = ? AND created_at >= ?
       ORDER BY created_at ASC`
    ).all(userId, new Date(Date.now() - days * 24 * 3600 * 1000).toISOString());
  }

  /** 看板：问题分布（聚合 issues JSON） */
  issueDistribution() {
    return this.prepare(
      'SELECT issues FROM detect_records WHERE issues IS NOT NULL AND issues != ?'
    ).all('[]');
  }

  countRecent(days) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    return this.prepare(
      'SELECT COUNT(*) AS c FROM detect_records WHERE created_at >= ?'
    ).get(since).c;
  }

  /** 近 N 日有检测行为的去重用户数 */
  activeUsersByDetect(days) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    return this.prepare(
      'SELECT COUNT(DISTINCT user_id) AS c FROM detect_records WHERE created_at >= ?'
    ).get(since).c;
  }
}

module.exports = new DetectRecordRepo();
