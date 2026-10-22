'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class AdminUserRepo extends BaseRepo {
  constructor() {
    super('admin_users', { softDelete: true });
  }

  findByUsername(username) {
    return this.prepare(
      'SELECT * FROM admin_users WHERE username = ? AND deleted_at IS NULL'
    ).get(username);
  }

  touchLogin(id) {
    return this.prepare(
      'UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?'
    ).run(helper.now(), helper.now(), id);
  }
}

module.exports = new AdminUserRepo();
