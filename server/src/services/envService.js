'use strict';

/**
 * 环境/季节规则服务（Phase C）
 * - getUv(city, date) → UV 档 + 防晒/晒后建议（真实源失败降级内置规则）
 * - getSeasonTip(date) → 季节护理重点
 * - afterSunAdvice(uvLevel) → 晒后建议
 */
const weather = require('../utils/weather');
const {
  UV_LEVELS,
  SEASON_TIPS,
  AFTER_SUN_ADVICE,
  CITY_LATITUDES,
} = require('../config/skincareRules');

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function uvLevelOf(index) {
  for (const lv of UV_LEVELS) {
    if (index >= lv.min && index <= lv.max) return lv;
  }
  return UV_LEVELS[0];
}

/** 内置 UV 规则降级：按城市纬度 + 月份 */
function ruleUvIndex(city, date) {
  const lat = CITY_LATITUDES[city] || 35;
  const month = date.getMonth() + 1;

  let base;
  if (month >= 6 && month <= 8) base = 8;
  else if (month >= 3 && month <= 5) base = 6;
  else if (month >= 9 && month <= 11) base = 5;
  else base = 3;

  let adjust = 0;
  if (lat < 23.5) adjust = 1;
  else if (lat < 35) adjust = 0;
  else if (lat < 45) adjust = -1;
  else adjust = -2;

  return clamp(base + adjust, 0, 12);
}

async function getUv(city = '北京', date = new Date()) {
  const realIndex = await weather.fetchUv(city);
  let uvIndex;
  let source;
  if (realIndex !== null && realIndex !== undefined) {
    uvIndex = clamp(Math.round(realIndex), 0, 12);
    source = 'qweather';
  } else {
    uvIndex = ruleUvIndex(city, date);
    source = 'rule';
  }
  const level = uvLevelOf(uvIndex);
  return {
    city,
    uvIndex,
    uvLevel: level.level,
    uvLevelLabel: level.label,
    source,
    sunscreenAdvice: level.advice,
    afterSunAdvice: afterSunAdvice(level.level),
    seasonTip: getSeasonTip(date).tip,
  };
}

function getSeasonTip(date = new Date()) {
  const month = date.getMonth() + 1;
  for (const s of SEASON_TIPS) {
    if (s.months.includes(month)) {
      return { month, season: s.season, tip: s.tip };
    }
  }
  return { month, season: '—', tip: '按季节做好基础护理' };
}

function afterSunAdvice(uvLevel) {
  if (uvLevel === 'high' || uvLevel === 'veryHigh') return AFTER_SUN_ADVICE;
  return [];
}

module.exports = { getUv, getSeasonTip, afterSunAdvice };
