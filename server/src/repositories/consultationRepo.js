'use strict';

const BaseRepo = require('./baseRepo');

class ConsultationRepo extends BaseRepo {
  constructor() {
    super('consultations', { softDelete: true });
  }

  listByUser(userId) {
    return this.prepare(
      'SELECT * FROM consultations WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC'
    ).all(userId);
  }

  /** 医生端列表（联用户昵称） */
  paginateWithUser(page = 1, pageSize = 10, status) {
    const where = status ? 'c.status = ? AND c.deleted_at IS NULL' : 'c.deleted_at IS NULL';
    const params = status ? [status] : [];
    const rows = this.prepare(
      `SELECT c.*, u.nickname FROM consultations c
       LEFT JOIN wx_users u ON u.id = c.user_id
       WHERE ${where}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, (page - 1) * pageSize);
    const total = this.prepare(
      `SELECT COUNT(*) AS c FROM consultations c WHERE ${where}`
    ).get(...params).c;
    return { list: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 0 };
  }

  countByStatus(status) {
    return this.prepare(
      'SELECT COUNT(*) AS c FROM consultations WHERE status = ? AND deleted_at IS NULL'
    ).get(status).c;
  }
}

module.exports = new ConsultationRepo();
