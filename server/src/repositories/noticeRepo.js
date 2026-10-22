'use strict';

const BaseRepo = require('./baseRepo');

class NoticeRepo extends BaseRepo {
  constructor() {
    super('notices', { softDelete: true });
  }

  listPublished() {
    return this.list({ where: 'status = 1', orderBy: 'publish_at DESC, id DESC' });
  }

  getPublishedById(id) {
    return this.prepare(
      'SELECT * FROM notices WHERE id = ? AND status = 1 AND deleted_at IS NULL'
    ).get(id);
  }
}

module.exports = new NoticeRepo();
