'use strict';

/**
 * 肌肤养护规则常量（Phase A：徽章规则 + 方案步骤→打卡映射；Phase B：匹配度规则 + 步骤键映射）
 */

/** 徽章规则常量（§6.3） */
const BADGE_RULES = [
  { code: 'first_day', name: '初来乍到', desc: '完成第一次打卡', icon: '🌱', type: 'totalDays', threshold: 1 },
  { code: 'streak_3', name: '三日之约', desc: '连续打卡 3 天', icon: '🌿', type: 'streak', threshold: 3 },
  { code: 'streak_7', name: '七日坚持', desc: '连续打卡 7 天', icon: '🔥', type: 'streak', threshold: 7 },
  { code: 'streak_30', name: '月度达人', desc: '连续打卡 30 天', icon: '👑', type: 'streak', threshold: 30 },
  { code: 'perfect_week', name: '完美一周', desc: '自然周 7 天全勤且三项全满', icon: '💯', type: 'perfectWeek', threshold: 7 },
  { code: 'sunscreen_master', name: '防晒达人', desc: '累计防晒打卡 21 天', icon: '🌞', type: 'sunscreenDays', threshold: 21 },
];

/** 匹配度规则（Phase B，§8#5：规则引擎，0–100） */
const MATCH_CONFIG = {
  baseScore: 50,
  perHit: 12,
  perConflict: -15,
  max: 100,
  min: 0,
};

/** UV 档与防晒建议（Phase C，§6.1） */
const UV_LEVELS = [
  { level: 'low', min: 0, max: 2, label: '低', advice: '无需特殊防晒' },
  { level: 'moderate', min: 3, max: 5, label: '中', advice: 'SPF30+，正午避免暴晒' },
  { level: 'high', min: 6, max: 7, label: '高', advice: 'SPF50+ PA+++，每 2 小时补涂' },
  { level: 'veryHigh', min: 8, max: 99, label: '极高', advice: 'SPF50+，减少外出，物理遮蔽' },
];

/** 季节护理重点（北半球，§6.2） */
const SEASON_TIPS = [
  { season: '春', months: [3, 4, 5], tip: '保湿 + 抗敏 + 防晒' },
  { season: '夏', months: [6, 7, 8], tip: '控油 + 防晒 + 晒后修护' },
  { season: '秋', months: [9, 10, 11], tip: '保湿 + 修护屏障' },
  { season: '冬', months: [12, 1, 2], tip: '强保湿 + 修护 + 防干燥' },
];

/** 晒后建议（高/极高 UV 时返回） */
const AFTER_SUN_ADVICE = ['冷敷舒缓', '涂抹含积雪草/泛醇的修护产品', '多补水'];

/** 内置城市纬度表（mock UV 规则降级用，可扩展） */
const CITY_LATITUDES = {
  北京: 39.9,
  上海: 31.2,
  广州: 23.1,
  深圳: 22.5,
  成都: 30.6,
  杭州: 30.3,
  武汉: 30.6,
  西安: 34.3,
  重庆: 29.6,
  南京: 32.0,
  天津: 39.1,
  哈尔滨: 45.8,
  乌鲁木齐: 43.8,
  昆明: 25.0,
  三亚: 18.2,
};

/**
 * 方案步骤名 → 打卡三项映射（§8#1）
 * 清洁类 → cleanse；爽肤/精华/保湿/修护 → moisturize；防晒 → sunscreen
 * @param {string} stepName
 * @returns {'cleanse'|'moisturize'|'sunscreen'}
 */
function mapStepToCheckinKey(stepName) {
  const name = String(stepName || '');
  if (name.includes('防晒')) return 'sunscreen';
  if (name.includes('清洁') || name.includes('洁面') || name.includes('卸妆')) return 'cleanse';
  // 爽肤 / 精华 / 保湿 / 修护 等其余步骤归入保湿
  return 'moisturize';
}

/**
 * 方案步骤名 → 步骤键（与 planGenerator.STEP_TEMPLATES 一致）
 * 清洁/爽肤/精华/保湿/防晒/修护 → cleanse/toner/serum/moisturize/sunscreen/repair
 * @param {string} stepName
 * @returns {string}
 */
function mapStepNameToKey(stepName) {
  const name = String(stepName || '');
  if (name.includes('清洁') || name.includes('洁面') || name.includes('卸妆')) return 'cleanse';
  if (name.includes('爽肤') || name.includes('水')) return 'toner';
  if (name.includes('精华')) return 'serum';
  if (name.includes('防晒')) return 'sunscreen';
  if (name.includes('修护') || name.includes('修复')) return 'repair';
  // 保湿及其余默认 moisturize
  return 'moisturize';
}

module.exports = {
  BADGE_RULES,
  MATCH_CONFIG,
  UV_LEVELS,
  SEASON_TIPS,
  AFTER_SUN_ADVICE,
  CITY_LATITUDES,
  mapStepToCheckinKey,
  mapStepNameToKey,
};

