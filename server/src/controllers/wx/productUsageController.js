'use strict';

const productUsageRepo = require('../../repositories/productUsageRepo');
const productRepo = require('../../repositories/productRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

/** openedAt(YYYY-MM-DD) + N 个月 → 到期日(YYYY-MM-DD) */
function addMonths(dateStr, months) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const dt = new Date(y, m - 1 + (Number(months) || 12), d);
  return helper.dateToStr(dt);
}

function calcDaysLeft(expireAt) {
  const today = helper.today();
  const diff = new Date(`${expireAt}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime();
  return Math.floor(diff / 86400000);
}

function serialize(usage) {
  const expireAt = usage.opened_at ? addMonths(usage.opened_at, usage.expire_months) : null;
  const daysLeft = expireAt ? calcDaysLeft(expireAt) : null;
  return {
    id: usage.id,
    productId: usage.product_id,
    product: { name: usage.name, brand: usage.brand, category: usage.category },
    openedAt: usage.opened_at,
    expireMonths: usage.expire_months,
    note: usage.note,
    expireAt,
    daysLeft,
    expired: daysLeft !== null && daysLeft < 0,
  };
}

/** 开封/有效期列表 */
function list(req, res, next) {
  try {
    return res.ok(productUsageRepo.listByUser(req.user.id).map(serialize));
  } catch (e) {
    return next(e);
  }
}

/** 设置/更新开封有效期 */
function set(req, res, next) {
  try {
    const { productId, openedAt, expireMonths, note } = req.body || {};
    if (!productId || !openedAt) throw new BusinessError(400, '请提供 productId 与 openedAt');
    if (!helper.isValidDateStr(openedAt)) throw new BusinessError(400, 'openedAt 日期格式无效');
    if (openedAt > helper.today()) throw new BusinessError(400, '开封日期不能晚于今天');
    if (!productRepo.getById(Number(productId))) throw new BusinessError(404, '产品不存在');
    const months = [6, 12, 24].includes(Number(expireMonths)) ? Number(expireMonths) : 12;

    productUsageRepo.upsert(req.user.id, Number(productId), openedAt, months, note || '');
    // findByUserProduct 已 JOIN products，回显 name/brand/category
    const row = productUsageRepo.findByUserProduct(req.user.id, Number(productId));
    return res.ok(serialize(row));
  } catch (e) {
    return next(e);
  }
}

/** 即将到期/已到期（剩余 ≤30 天） */
function expiring(req, res, next) {
  try {
    const all = productUsageRepo.listByUser(req.user.id).map(serialize);
    const listData = all.filter((u) => u.daysLeft !== null && u.daysLeft <= 30);
    listData.sort((a, b) => a.daysLeft - b.daysLeft);
    return res.ok(listData);
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, set, expiring };
