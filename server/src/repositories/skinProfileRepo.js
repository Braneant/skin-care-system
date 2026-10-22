'use strict';

const BaseRepo = require('./baseRepo');

class SkinProfileRepo extends BaseRepo {
  constructor() {
    super('skin_profiles', { softDelete: true });
  }

  findByUserId(userId) {
    return this.prepare(
      'SELECT * FROM skin_profiles WHERE user_id = ? AND deleted_at IS NULL'
    ).get(userId);
  }

  /** 存在则更新，否则插入 */
  upsert(userId, data) {
    const existing = this.findByUserId(userId);
    if (existing) {
      this.updateById(existing.id, data);
      return existing.id;
    }
    return this.insert({ user_id: userId, ...data });
  }
}

module.exports = new SkinProfileRepo();
