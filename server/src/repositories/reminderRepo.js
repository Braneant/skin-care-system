'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class ReminderRepo extends BaseRepo {
  constructor() {
    super('reminders', { softDelete: false });
  }

  listByUser(userId) {
    return this.prepare(
      'SELECT * FROM reminders WHERE user_id = ? ORDER BY id ASC'
    ).all(userId);
  }

  findByType(userId, type) {
    return this.prepare(
      'SELECT * FROM reminders WHERE user_id = ? AND type = ?'
    ).get(userId, type);
  }

  /** 按 type upsert（无唯一约束，手动查重后插/改） */
  upsert(userId, { type, scheduleTime = null, enabled = 1, extra = null }) {
    const t = helper.now();
    const existing = this.findByType(userId, type);
    if (existing) {
      this.updateById(existing.id, {
        schedule_time: scheduleTime,
        enabled: enabled ? 1 : 0,
        extra: extra ? JSON.stringify(extra) : null,
      });
      return this.findByType(userId, type);
    }
    const id = this.insert({
      user_id: userId,
      type,
      schedule_time: scheduleTime,
      enabled: enabled ? 1 : 0,
      extra: extra ? JSON.stringify(extra) : null,
      created_at: t,
      updated_at: t,
    });
    return this.getById(id);
  }

  remove(id) {
    return this.hardDelete(id);
  }
}

module.exports = new ReminderRepo();
