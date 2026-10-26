'use strict';

const photoDiaryRepo = require('../../repositories/photoDiaryRepo');
const { saveImageBuffer } = require('../../middlewares/upload');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

function serialize(d) {
  return {
    id: d.id,
    imageUrl: d.image_url,
    note: d.note,
    detectRecordId: d.detect_record_id,
    takenAt: d.taken_at,
    createdAt: d.created_at,
  };
}

/** 照片日记列表 */
function list(req, res, next) {
  try {
    return res.ok(photoDiaryRepo.listByUser(req.user.id).map(serialize));
  } catch (e) {
    return next(e);
  }
}

/** 上传照片日记（multipart: file + note + detectRecordId） */
function upload(req, res, next) {
  (async () => {
    try {
      if (!req.file) throw new BusinessError(400, '请选择图片');
      const saved = await saveImageBuffer(req.file.buffer, 'diary');
      const note = String(req.body.note || '').trim();
      const detectRecordId = req.body.detectRecordId ? Number(req.body.detectRecordId) : null;
      const id = photoDiaryRepo.create(req.user.id, {
        imageUrl: saved.url,
        note,
        detectRecordId,
        takenAt: helper.today(),
      });
      return res.ok({ id, imageUrl: saved.url, note, takenAt: helper.today() });
    } catch (e) {
      return next(e);
    }
  })();
}

/** 删除照片日记 */
function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const row = photoDiaryRepo.getById(id);
    if (!row || row.user_id !== req.user.id) throw new BusinessError(404, '日记不存在');
    photoDiaryRepo.remove(id);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, upload, remove };
