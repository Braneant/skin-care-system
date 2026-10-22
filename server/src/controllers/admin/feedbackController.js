'use strict';

const feedbackRepo = require('../../repositories/feedbackRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

/** 反馈列表 */
function list(req, res, next) {
  try {
    const { page, pageSize } = helper.pageParams(req.query);
    const status = req.query.status;
    const result = feedbackRepo.paginateWithUser(page, pageSize, status);
    return res.ok(result);
  } catch (e) {
    return next(e);
  }
}

/** 回复反馈 */
function reply(req, res, next) {
  try {
    const id = Number(req.params.id);
    const feedback = feedbackRepo.getById(id);
    if (!feedback) throw new BusinessError(404, '反馈不存在');
    const content = String((req.body && req.body.reply) || '').trim();
    if (!content) throw new BusinessError(400, '回复内容不能为空');
    feedbackRepo.updateById(id, { reply: content, status: 1 });
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, reply };
