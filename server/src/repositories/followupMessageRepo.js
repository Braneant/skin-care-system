'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class FollowupMessageRepo extends BaseRepo {
  constructor() {
    super('followup_message', { softDelete: false });
  }

  /** 用户会话（升序） */
  listByUser(userId) {
    return this.prepare(
      'SELECT * FROM followup_message WHERE user_id = ? ORDER BY created_at ASC, id ASC'
    ).all(userId);
  }

  /** 医生侧：全部消息（联昵称，降序分页；排除机器人消息） */
  listAllPaginated(page = 1, pageSize = 20) {
    const rows = this.prepare(
      `SELECT fm.*, u.nickname FROM followup_message fm
       LEFT JOIN wx_users u ON u.id = fm.user_id
       WHERE fm.sender != 'bot'
       ORDER BY fm.created_at DESC, fm.id DESC LIMIT ? OFFSET ?`
    ).all(pageSize, (page - 1) * pageSize);
    const total = this.prepare(
      "SELECT COUNT(*) AS c FROM followup_message WHERE sender != 'bot'"
    ).get().c;
    return { list: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 0 };
  }

  /** 用户已收到的机器人回复条数（用于循环取话术） */
  countBotReplies(userId) {
    return this.prepare(
      "SELECT COUNT(*) AS c FROM followup_message WHERE user_id = ? AND sender = 'bot'"
    ).get(userId).c;
  }

  insert(userId, doctorId, sender, content) {
    // 注意：调用基类 insert（this.insert 会遮蔽导致递归）
    return super.insert({
      user_id: userId,
      doctor_id: doctorId,
      sender,
      content,
      is_read: 0,
      created_at: helper.now(),
    });
  }

  /** 医生已读用户消息 */
  markUserMessagesRead(userId) {
    return this.prepare(
      "UPDATE followup_message SET is_read = 1 WHERE user_id = ? AND sender = 'user'"
    ).run(userId);
  }

  /** 用户已读医生消息 */
  markDoctorMessagesRead(userId) {
    return this.prepare(
      "UPDATE followup_message SET is_read = 1 WHERE user_id = ? AND sender = 'doctor'"
    ).run(userId);
  }

  /** 医生侧未读用户消息数 */
  unreadCount() {
    return this.prepare(
      "SELECT COUNT(*) AS c FROM followup_message WHERE sender = 'user' AND is_read = 0"
    ).get().c;
  }
}

module.exports = new FollowupMessageRepo();
