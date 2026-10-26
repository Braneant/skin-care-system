'use strict';

const reminderRepo = require('../../repositories/reminderRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

const VALID_TYPES = ['morning', 'evening', 'uv_reapply', 'recheck', 'season'];

function serialize(r) {
  return {
    id: r.id,
    type: r.type,
    scheduleTime: r.schedule_time,
    enabled: !!r.enabled,
    extra: helper.parseJson(r.extra, null),
  };
}

/** 我的提醒列表 */
function list(req, res, next) {
  try {
    return res.ok(reminderRepo.listByUser(req.user.id).map(serialize));
  } catch (e) {
    return next(e);
  }
}

/** 创建/更新提醒（按 type upsert） */
function upsert(req, res, next) {
  try {
    const { type, scheduleTime, enabled, extra } = req.body || {};
    if (!type || !VALID_TYPES.includes(type)) throw new BusinessError(400, 'type 取值非法');
    const row = reminderRepo.upsert(req.user.id, {
      type,
      scheduleTime: scheduleTime || null,
      enabled: enabled === undefined ? 1 : (enabled ? 1 : 0),
      extra,
    });
    return res.ok(serialize(row));
  } catch (e) {
    return next(e);
  }
}

/** 更新提醒 */
function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const row = reminderRepo.getById(id);
    if (!row || row.user_id !== req.user.id) throw new BusinessError(404, '提醒不存在');
    const { scheduleTime, enabled, extra } = req.body || {};
    const data = {};
    if (scheduleTime !== undefined) data.schedule_time = scheduleTime;
    if (enabled !== undefined) data.enabled = enabled ? 1 : 0;
    if (extra !== undefined) data.extra = extra ? JSON.stringify(extra) : null;
    reminderRepo.updateById(id, data);
    return res.ok(serialize(reminderRepo.getById(id)));
  } catch (e) {
    return next(e);
  }
}

/** 删除提醒 */
function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const row = reminderRepo.getById(id);
    if (!row || row.user_id !== req.user.id) throw new BusinessError(404, '提醒不存在');
    reminderRepo.remove(id);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, upsert, update, remove };
