'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class CheckinRepo extends BaseRepo {
  constructor() {
    super('checkin_records', { softDelete: false });
  }

  findByDate(userId, date) {
    return this.prepare(
      'SELECT * FROM checkin_records WHERE user_id = ? AND checkin_date = ?'
    ).get(userId, date);
  }

  /** 今日状态 */
  todayByUser(userId) {
    return this.findByDate(userId, helper.today());
  }

  /**
   * 打卡：当日存在则更新（补卡覆盖），否则插入
   * @param {number} userId
   * @param {{cleanse?: number, moisturize?: number, sunscreen?: number}} data
   */
  upsert(userId, data) {
    const date = helper.today();
    const existing = this.findByDate(userId, date);
    if (existing) {
      const merged = {
        cleanse: data.cleanse !== undefined ? data.cleanse : existing.cleanse,
        moisturize: data.moisturize !== undefined ? data.moisturize : existing.moisturize,
        sunscreen: data.sunscreen !== undefined ? data.sunscreen : existing.sunscreen,
      };
      this.updateById(existing.id, merged);
      return this.findByDate(userId, date);
    }
    const row = {
      user_id: userId,
      checkin_date: date,
      cleanse: data.cleanse ? 1 : 0,
      moisturize: data.moisturize ? 1 : 0,
      sunscreen: data.sunscreen ? 1 : 0,
    };
    this.insert(row);
    return this.findByDate(userId, date);
  }

  listByUser(userId, limit = 90) {
    return this.prepare(
      'SELECT * FROM checkin_records WHERE user_id = ? ORDER BY checkin_date ASC LIMIT ?'
    ).all(userId, limit);
  }

  /** 近 N 日有打卡行为的去重用户数 */
  activeUsersByCheckin(days) {
    const sinceIso = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    return this.prepare(
      'SELECT COUNT(DISTINCT user_id) AS c FROM checkin_records WHERE created_at >= ?'
    ).get(sinceIso).c;
  }
}

module.exports = new CheckinRepo();
