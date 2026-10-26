'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class PhotoDiaryRepo extends BaseRepo {
  constructor() {
    super('photo_diary', { softDelete: false });
  }

  listByUser(userId) {
    return this.prepare(
      'SELECT * FROM photo_diary WHERE user_id = ? ORDER BY taken_at DESC, id DESC'
    ).all(userId);
  }

  create(userId, { imageUrl, note = '', detectRecordId = null, takenAt }) {
    return this.insert({
      user_id: userId,
      image_url: imageUrl,
      note,
      detect_record_id: detectRecordId,
      taken_at: takenAt || helper.today(),
      created_at: helper.now(),
    });
  }

  remove(id) {
    return this.hardDelete(id);
  }
}

module.exports = new PhotoDiaryRepo();
