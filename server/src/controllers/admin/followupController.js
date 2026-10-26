'use strict';

const followupMessageRepo = require('../../repositories/followupMessageRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

/** 医生侧：随访消息列表（分页，联用户昵称；支持 ?userId= 查看某用户会话并置已读） */
function list(req, res, next) {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;

    // 查看单个用户会话：标记该用户消息已读（排除机器人消息）
    if (userId) {
      followupMessageRepo.markUserMessagesRead(userId);
      const msgs = followupMessageRepo
        .listByUser(userId)
        .filter((m) => m.sender !== 'bot')
        .map((m) => ({
          id: m.id,
          userId: m.user_id,
          sender: m.sender,
          content: m.content,
          isRead: !!m.is_read,
          createdAt: m.created_at,
        }));
      return res.ok({
        list: msgs,
        total: msgs.length,
        page: 1,
        pageSize: msgs.length,
        totalPages: 1,
        unread: followupMessageRepo.unreadCount(),
      });
    }

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = followupMessageRepo.listAllPaginated(page, pageSize);
    result.list = result.list.map((m) => ({
      id: m.id,
      userId: m.user_id,
      nickname: m.nickname,
      sender: m.sender,
      content: m.content,
      isRead: !!m.is_read,
      createdAt: m.created_at,
    }));
    result.unread = followupMessageRepo.unreadCount();
    return res.ok(result);
  } catch (e) {
    return next(e);
  }
}

/** 医生回复随访（回复即视为已读该用户消息） */
function reply(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const content = String((req.body && req.body.content) || '').trim();
    if (!content) throw new BusinessError(400, '回复内容不能为空');
    const id = followupMessageRepo.insert(userId, req.admin.id, 'doctor', content);
    followupMessageRepo.markUserMessagesRead(userId);
    return res.ok({ id, sender: 'doctor', createdAt: helper.now() });
  } catch (e) {
    return next(e);
  }
}

/** 医生查看某用户会话：标记该用户消息已读 */
function markRead(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    followupMessageRepo.markUserMessagesRead(userId);
    return res.ok({ userId });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, reply, markRead };
