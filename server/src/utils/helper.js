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
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

/** 从 ISO 时间取 YYYY-MM-DD（本地时区，用于打卡日期） */
function isoToDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
};
