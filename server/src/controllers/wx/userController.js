'use strict';

const wxUserRepo = require('../../repositories/wxUserRepo');

/**
 * 获取当前用户信息
 */
function getMe(req, res, next) {
  try {
    const user = wxUserRepo.getById(req.user.id);
    if (!user) return res.fail(404, '用户不存在');
    return res.ok({
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      gender: user.gender,
      birthday: user.birthday,
      phone: user.phone,
      createdAt: user.created_at,
    });
  } catch (e) {
    return next(e);
  }
}

/**
 * 更新个人资料
 */
function updateMe(req, res, next) {
  try {
    const { nickname, avatarUrl, gender, birthday, phone } = req.body || {};
    const data = {};
    if (nickname !== undefined) data.nickname = String(nickname).slice(0, 64);
    if (avatarUrl !== undefined) data.avatar_url = avatarUrl;
    if (gender !== undefined) data.gender = ['male', 'female', 'unknown'].includes(gender) ? gender : 'unknown';
    if (birthday !== undefined) data.birthday = birthday;
    if (phone !== undefined) data.phone = String(phone).slice(0, 32);
    wxUserRepo.updateById(req.user.id, data);
    const user = wxUserRepo.getById(req.user.id);
    return res.ok({
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      gender: user.gender,
      birthday: user.birthday,
      phone: user.phone,
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { getMe, updateMe };
