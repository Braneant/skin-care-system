'use strict';

const skinProfileRepo = require('../../repositories/skinProfileRepo');
const helper = require('../../utils/helper');

const VALID_SKIN_TYPES = ['干性', '油性', '混合性', '中性', '敏感性'];

function toCamel(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    skinType: profile.skin_type,
    sensitivity: profile.sensitivity,
    concerns: helper.parseJson(profile.concerns, []),
    habits: helper.parseJson(profile.habits, {}),
    photoUrl: profile.photo_url,
    updatedAt: profile.updated_at,
  };
}

/**
 * 提交/保存四步问卷（幂等 upsert）
 */
function submitSurvey(req, res, next) {
  try {
    const { skinType, sensitivity, concerns, habits, photoUrl } = req.body || {};
    const data = {
      skin_type: VALID_SKIN_TYPES.includes(skinType) ? skinType : '混合性',
      sensitivity: Math.max(0, Math.min(3, Number(sensitivity) || 0)),
      concerns: JSON.stringify(Array.isArray(concerns) ? concerns : []),
      habits: JSON.stringify(habits && typeof habits === 'object' ? habits : {}),
    };
    if (photoUrl) data.photo_url = photoUrl;
    skinProfileRepo.upsert(req.user.id, data);
    return res.ok(toCamel(skinProfileRepo.findByUserId(req.user.id)));
  } catch (e) {
    return next(e);
  }
}

/** 获取我的肌肤档案 */
function getProfile(req, res, next) {
  try {
    const profile = skinProfileRepo.findByUserId(req.user.id);
    if (!profile) return res.ok(null);
    return res.ok(toCamel(profile));
  } catch (e) {
    return next(e);
  }
}

/** 编辑档案 */
function updateProfile(req, res, next) {
  try {
    const { skinType, sensitivity, concerns, habits, photoUrl } = req.body || {};
    const data = {};
    if (skinType !== undefined) data.skin_type = VALID_SKIN_TYPES.includes(skinType) ? skinType : undefined;
    if (sensitivity !== undefined) data.sensitivity = Math.max(0, Math.min(3, Number(sensitivity) || 0));
    if (concerns !== undefined) data.concerns = JSON.stringify(Array.isArray(concerns) ? concerns : []);
    if (habits !== undefined) data.habits = JSON.stringify(habits && typeof habits === 'object' ? habits : {});
    if (photoUrl !== undefined) data.photo_url = photoUrl;
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    skinProfileRepo.upsert(req.user.id, data);
    return res.ok(toCamel(skinProfileRepo.findByUserId(req.user.id)));
  } catch (e) {
    return next(e);
  }
}

module.exports = { submitSurvey, getProfile, updateProfile };
