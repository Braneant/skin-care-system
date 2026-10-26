'use strict';

const followupMessageRepo = require('../../repositories/followupMessageRepo');
const { BOT_PHRASES } = require('../../config/botPhrases');
const { BusinessError } = require('../../middlewares/errorHandler');

function serialize(m) {
  return {
    id: m.id,
    sender: m.sender,
    content: m.content,
    isRead: !!m.is_read,
    createdAt: m.created_at,
  };
}

/** 我的随访消息（拉取时标记医生消息已读） */
function list(req, res, next) {
  try {
    followupMessageRepo.markDoctorMessagesRead(req.user.id);
    return res.ok(followupMessageRepo.listByUser(req.user.id).map(serialize));
  } catch (e) {
    return next(e);
  }
}

/** 用户发随访消息（插入用户消息后立即按预设话术循环回一条智能助手消息） */
function send(req, res, next) {
  try {
    const content = String((req.body && req.body.content) || '').trim();
    if (!content) throw new BusinessError(400, '消息内容不能为空');
    const id = followupMessageRepo.insert(req.user.id, null, 'user', content);
    // 无论用户输入什么，按预设话术循环回一句，保证必有回复
    const n = followupMessageRepo.countBotReplies(req.user.id);
    const phrase = BOT_PHRASES[n % BOT_PHRASES.length];
    followupMessageRepo.insert(req.user.id, null, 'bot', phrase);
    return res.ok({ id, sender: 'user', content, createdAt: new Date().toISOString() });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, send };
