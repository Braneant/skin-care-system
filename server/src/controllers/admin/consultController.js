'use strict';

const consultationRepo = require('../../repositories/consultationRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

/** 预约列表（医生端） */
function list(req, res, next) {
  try {
    const { page, pageSize } = helper.pageParams(req.query);
    const status = req.query.status;
    const result = consultationRepo.paginateWithUser(page, pageSize, status);
    return res.ok(result);
  } catch (e) {
    return next(e);
  }
}

/** 处理预约（接受/完成/取消） */
function patch(req, res, next) {
  try {
    const id = Number(req.params.id);
    const consultation = consultationRepo.getById(id);
    if (!consultation) throw new BusinessError(404, '预约不存在');
    const { status, reply } = req.body || {};
    const valid = ['pending', 'accepted', 'completed', 'cancelled'];
    const data = {};
    if (status && valid.includes(status)) data.status = status;
    if (reply !== undefined) data.reply = String(reply);
    if (status === 'accepted' || status === 'completed') data.doctor_id = req.admin.id;
    consultationRepo.updateById(id, data);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, patch };
