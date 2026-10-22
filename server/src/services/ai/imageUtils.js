'use strict';

/**
 * 图片处理工具：格式/大小校验 + 压缩裁剪（最长边 800px、JPEG q80）
 * - 优先 sharp（高性能，原生依赖）
 * - sharp 不可用则降级 jimp（纯 JS）
 * - 两者都不可用则原样返回（兜底）
 */
const { config } = require('../../config');
const logger = require('../../utils/logger');
const { BusinessError } = require('../../middlewares/errorHandler');

let sharp = null;
let jimp = null;

try {
  // eslint-disable-next-line global-require
  sharp = require('sharp');
} catch (e) {
  logger.warn('[imageUtils] sharp 不可用，降级 jimp');
}

try {
  // eslint-disable-next-line global-require
  jimp = require('jimp');
} catch (e) {
  logger.warn('[imageUtils] jimp 不可用，图片将不做压缩');
}

const MAX_BYTES = config.maxImageSizeMb * 1024 * 1024;
const MAX_EDGE = config.imageMaxEdge;

/**
 * 根据魔数判断图片格式
 * @returns {'jpeg'|'png'|'gif'|'webp'|null}
 */
function detectFormat(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'gif';
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

function extFromMime(mimeType) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };
  return map[mimeType] || '.jpg';
}

/**
 * 校验图片（大小 / 格式）
 * @returns {{valid: boolean, reason?: string}}
 */
function validateImage(buffer) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, reason: '图片内容为空' };
  }
  if (buffer.length > MAX_BYTES) {
    return { valid: false, reason: `图片大小超过限制（${config.maxImageSizeMb}MB）` };
  }
  const fmt = detectFormat(buffer);
  if (!fmt) {
    return { valid: false, reason: '不支持的图片格式（仅支持 JPEG/PNG/GIF/WebP）' };
  }
  return { valid: true, format: fmt };
}

/**
 * 压缩图片（最长边 MAX_EDGE、JPEG q80）
 * @param {Buffer} buffer 原始图片
 * @returns {Promise<{buffer: Buffer, mimeType: string, width: number, height: number}>}
 */
async function compressImage(buffer) {
  const v = validateImage(buffer);
  if (!v.valid) {
    throw new BusinessError(20001, v.reason);
  }

  if (sharp) {
    try {
      const result = await sharp(buffer)
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      return {
        buffer: result.data,
        mimeType: 'image/jpeg',
        width: result.info.width,
        height: result.info.height,
      };
    } catch (e) {
      logger.warn('[imageUtils] sharp 压缩失败，降级 jimp：', e.message);
    }
  }

  if (jimp) {
    try {
      const image = await jimp.read(buffer);
      const w = image.getWidth();
      const h = image.getHeight();
      if (w > MAX_EDGE || h > MAX_EDGE) {
        image.scaleToFit(MAX_EDGE, MAX_EDGE);
      }
      const out = await image.quality(80).getBufferAsync(jimp.MIME_JPEG);
      return {
        buffer: out,
        mimeType: 'image/jpeg',
        width: image.getWidth(),
        height: image.getHeight(),
      };
    } catch (e) {
      logger.warn('[imageUtils] jimp 压缩失败，原样返回：', e.message);
    }
  }

  // 兜底：原样返回
  const fmt = v.format;
  const mimeMap = { jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  return {
    buffer,
    mimeType: mimeMap[fmt] || 'image/jpeg',
    width: 0,
    height: 0,
  };
}

/** Buffer → data URL */
function toDataUrl(buffer, mimeType = 'image/jpeg') {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

module.exports = {
  detectFormat,
  extFromMime,
  validateImage,
  compressImage,
  toDataUrl,
};
