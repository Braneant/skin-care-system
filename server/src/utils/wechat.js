'use strict';

/**
 * 微信 code2session 换 openid
 * 无 WX_APPID/WX_SECRET 时走开发兜底：由 code 派生稳定 openid，便于本地联调。
 */
const axios = require('axios');
const crypto = require('crypto');
const { config } = require('../config');
const logger = require('./logger');

/**
 * 用登录 code 换取 openid
 * @param {string} code
 * @returns {Promise<{openid: string, session_key?: string}>}
 */
async function code2session(code) {
  if (!config.wxAppid || !config.wxSecret) {
    logger.warn('[wechat] 未配置 WX_APPID/WX_SECRET，使用开发兜底 openid');
    return { openid: devOpenid(code), session_key: 'dev_session_key' };
  }

  const url = 'https://api.weixin.qq.com/sns/jscode2session';
  const { data } = await axios.get(url, {
    params: {
      appid: config.wxAppid,
      secret: config.wxSecret,
      js_code: code,
      grant_type: 'authorization_code',
    },
    timeout: 10000,
  });

  if (data.errcode) {
    const err = new Error(`微信登录失败：${data.errcode} ${data.errmsg}`);
    err.code = data.errcode;
    throw err;
  }
  return { openid: data.openid, session_key: data.session_key };
}

/** 由 code 派生稳定 openid（仅开发环境） */
function devOpenid(code) {
  const h = crypto.createHash('sha256').update(String(code)).digest('hex');
  return `dev_openid_${h.slice(0, 24)}`;
}

module.exports = { code2session };
