'use strict';

/**
 * 上传中间件：multer 内存存储 + 图片校验/压缩（调 imageUtils）
 * - uploadSingle(field) 返回 multer 中间件
 * - saveImageBuffer(buffer) 压缩并落盘，返回相对 URL
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { config } = require('../config');
const imageUtils = require('../services/ai/imageUtils');
const { genId } = require('../utils/helper');
const { BusinessError } = require('./errorHandler');

fs.mkdirSync(config.uploadDirAbs, { recursive: true });

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxImageSizeMb * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file || !file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new BusinessError(20001, '仅支持图片文件（JPEG/PNG/GIF/WebP）'));
    }
    cb(null, true);
  },
});

/** 单图上传中间件 */
function uploadSingle(field = 'file') {
  return uploader.single(field);
}

/**
 * 压缩并保存图片
 * @param {Buffer} buffer
 * @param {string} [prefix]
 * @returns {Promise<{fileId: string, url: string, filename: string, mimeType: string}>}
 */
async function saveImageBuffer(buffer, prefix = 'img') {
  if (!buffer) throw new BusinessError(400, '缺少图片内容');
  const processed = await imageUtils.compressImage(buffer);
  const filename = `${genId(prefix)}${imageUtils.extFromMime(processed.mimeType)}`;
  const abs = path.join(config.uploadDirAbs, filename);
  fs.writeFileSync(abs, processed.buffer);
  return {
    fileId: filename,
    url: `/uploads/${filename}`,
    filename,
    mimeType: processed.mimeType,
  };
}

module.exports = { uploadSingle, saveImageBuffer };
