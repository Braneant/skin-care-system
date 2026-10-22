'use strict';

/**
 * 密码哈希工具（bcryptjs 纯 JS 实现）
 */
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

function hash(plain) {
  return bcrypt.hashSync(String(plain), SALT_ROUNDS);
}

function compare(plain, hashValue) {
  if (!plain || !hashValue) return false;
  return bcrypt.compareSync(String(plain), String(hashValue));
}

module.exports = { hash, compare };
