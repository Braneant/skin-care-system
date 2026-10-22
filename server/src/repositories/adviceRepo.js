'use strict';

const BaseRepo = require('./baseRepo');

class AdviceRepo extends BaseRepo {
  constructor() {
    super('advice', { softDelete: true });
  }

  listByUser(userId) {
    return this.prepare(
      `SELECT a.*, d.real_name AS doctor_name FROM advice a
       LEFT JOIN admin_users d ON d.id = a.doctor_id
       WHERE a.user_id = ? AND a.deleted_at IS NULL
       ORDER BY a.created_at DESC`
    ).all(userId);
  }

  listByDetect(detectRecordId) {
    return this.prepare(
      `SELECT a.*, d.real_name AS doctor_name FROM advice a
       LEFT JOIN admin_users d ON d.id = a.doctor_id
       WHERE a.detect_record_id = ? AND a.deleted_at IS NULL
       ORDER BY a.created_at DESC`
    ).all(detectRecordId);
  }
}

module.exports = new AdviceRepo();
