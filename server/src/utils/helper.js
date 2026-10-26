'use strict';

/**
 * 通用工具函数
 */
const crypto = require('crypto');

/** 当前 UTC ISO 时间戳 */
function now() {
  return new Date().toISOString();
}

/** 生成今日日期 YYYY-MM-DD（本地时区） */
function today() {
  return dateToStr(new Date());
}

/** 生成随机 ID（文件名等） */
function genId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${crypto
    .randomBytes(6)
    .toString('hex')}`;
}

/** 深拷贝（仅 JSON 安全对象） */
function deepClone(obj) {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(JSON.stringify(obj));
}

/** 安全 JSON.parse */
function parseJson(str, fallback = null) {
  if (str === null || str === undefined || str === '') return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

/**
 * 计算分页参数
 * @param {{page?: number|string, pageSize?: number|string}} query
 * @param {number} defaultSize
 */
function pageParams(query = {}, defaultSize = 10) {
  let page = parseInt(query.page, 10);
  let pageSize = parseInt(query.pageSize, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > 100) {
    pageSize = defaultSize;
  }
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/** 组装分页响应数据 */
function pageResult(rows, total, page, pageSize) {
  return {
    list: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 0,
  };
}

/** 从 ISO 时间取 YYYY-MM-DD（本地时区，用于打卡日期）；非法输入返回 null */
function isoToDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return dateToStr(d);
}

/** Date → YYYY-MM-DD（本地时区） */
function dateToStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 在 YYYY-MM-DD 上偏移 n 天（可正可负），返回 YYYY-MM-DD */
function addDays(dateStr, n) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dateToStr(dt);
}

/** 校验 YYYY-MM-DD 为合法真实日历日（正则 + UTC 回读一致，排除 2-30/13 月/0 月等） */
function isValidDateStr(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

module.exports = {
  now,
  today,
  genId,
  deepClone,
  parseJson,
  pageParams,
  pageResult,
  isoToDate,
  dateToStr,
  addDays,
  isValidDateStr,
};
