'use strict';

const consultationRepo = require('../../repositories/consultationRepo');

/** 提交咨询预约 */
function create(req, res, next) {
  try {
    const subject = String((req.body && req.body.subject) || '').trim();
    const description = String((req.body && req.body.description) || '').trim();
    if (!subject || !description) {
      return res.fail(400, '请填写咨询主题与描述');
    }
    const id = consultationRepo.insert({
      user_id: req.user.id,
      subject,
      description,
      status: 'pending',
    });
    return res.ok({ consultationId: id, status: 'pending' });
  } catch (e) {
    return next(e);
  }
}

/** 我的预约列表 */
function listMy(req, res, next) {
  try {
    return res.ok(
      consultationRepo.listByUser(req.user.id).map((c) => ({
        id: c.id,
        subject: c.subject,
        description: c.description,
        status: c.status,
        reply: c.reply,
        createdAt: c.created_at,
      }))
    );
  } catch (e) {
    return next(e);
  }
}

module.exports = { create, listMy };
