'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class WxUserRepo extends BaseRepo {
  constructor() {
    super('wx_users', { softDelete: true });
  }

  findByOpenid(openid) {
    return this.prepare(
      'SELECT * FROM wx_users WHERE openid = ? AND deleted_at IS NULL'
    ).get(openid);
  }

  /** 登录时更新 last_login_at */
  touchLogin(id) {
    return this.prepare(
      'UPDATE wx_users SET last_login_at = ?, updated_at = ? WHERE id = ?'
    ).run(helper.now(), helper.now(), id);
  }

  findByPhone(phone) {
    return this.prepare(
      'SELECT * FROM wx_users WHERE phone = ? AND deleted_at IS NULL'
    ).get(phone);
  }
}

module.exports = new WxUserRepo();
