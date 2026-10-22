'use strict';

/**
 * 本地色彩学启发式引擎（无 Key / 离线兜底）
 * - 基于 HSV/Lab 色彩学思路：肤色 / 油干性 / 痤疮 / 平滑度 四维评分
 * - jimp 可用时分析真实像素统计；不可用时基于图片哈希做确定性模拟
 */
const crypto = require('crypto');
const BaseProvider = require('./baseProvider');
const logger = require('../../utils/logger');

let jimp = null;
try {
  // eslint-disable-next-line global-require
  jimp = require('jimp');
} catch (e) {
  logger.warn('[localHeuristic] jimp 不可用，使用确定性模拟评分');
}

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

class LocalHeuristicProvider extends BaseProvider {
  constructor() {
    super('local');
  }

  decodeBase64(imageBase64) {
    if (typeof imageBase64 !== 'string') return imageBase64;
    if (imageBase64.startsWith('data:')) {
      const idx = imageBase64.indexOf('base64,');
      return Buffer.from(imageBase64.slice(idx + 7), 'base64');
    }
    return Buffer.from(imageBase64, 'base64');
  }

  /** 计算图像像素统计 */
  async computeStats(buffer) {
    if (!jimp || !buffer || buffer.length === 0) return null;
    try {
      const image = await jimp.read(buffer);
      image.scaleToFit(64, 64);
      const w = image.getWidth();
      const h = image.getHeight();
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let redCount = 0;
      const brights = [];
      image.scan(0, 0, w, h, function (x, y, idx) {
        const r = this.bitmap.data[idx];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const bright = 0.299 * r + 0.587 * g + 0.114 * b;
        sumR += r;
        sumG += g;
        sumB += b;
        if (r > 110 && r > g * 1.3 && r > b * 1.3) redCount += 1;
        brights.push(bright);
      });
      const total = brights.length || 1;
      const avgBright = brights.reduce((s, v) => s + v, 0) / total;
      const variance =
        brights.reduce((s, v) => s + (v - avgBright) * (v - avgBright), 0) / total;
      return {
        avgR: sumR / total,
        avgG: sumG / total,
        avgB: sumB / total,
        avgBright,
        redRatio: redCount / total,
        variance,
      };
    } catch (e) {
      logger.warn('[localHeuristic] 像素分析失败：', e.message);
      return null;
    }
  }

  /** 确定性模拟统计（jimp 不可用时） */
  simulateStats(buffer) {
    const hash = crypto.createHash('md5').update(buffer || 'empty').digest();
    const n = (i) => hash[i] || 0;
    const avgBright = 90 + (n(0) % 80); // 90-169
    const variance = 200 + (n(1) % 600); // 200-799
    const redRatio = 0.02 + (n(2) % 20) / 100; // 0.02-0.21
    return { avgR: avgBright + 10, avgG: avgBright - 5, avgB: avgBright - 8, avgBright, redRatio, variance };
  }

  calcColor(stats) {
    // 肤色：过暗/过亮均扣分，140 附近最健康
    return clamp(100 - Math.abs(stats.avgBright - 140) * 0.7, 30, 98);
  }

  calcOilDry(stats) {
    // 油干性：高亮度偏油、低亮度偏干，取偏离度
    const shininess = clamp((stats.avgBright - 110) / 1.5, 0, 100);
    const dryness = clamp((110 - stats.avgBright) * 1.2, 0, 100);
    return clamp(100 - Math.max(shininess, dryness) * 0.9, 20, 95);
  }

  calcAcne(stats) {
    // 痤疮：红色区域占比越高得分越低
    return clamp(100 - stats.redRatio * 220, 30, 98);
  }

  calcSmoothness(stats) {
    // 平滑度：纹理方差越小越平滑
    return clamp(100 - stats.variance * 0.12, 40, 98);
  }

  /** 根据油干性/亮度推断肤质 */
  inferSkinType(stats) {
    if (stats.avgBright > 150 && stats.variance > 500) return '油性';
    if (stats.avgBright < 105) return '干性';
    if (stats.variance > 450) return '混合性';
    return '中性';
  }

  /** 根据维度生成问题列表 */
  inferIssues(stats, dimensions) {
    const issues = [];
    if (dimensions.acne < 70) {
      issues.push({
        type: '痘痘',
        level: dimensions.acne < 45 ? '中度' : '轻度',
        location: '面部',
        description: '检测到局部泛红，可能存在痘痘或炎症',
      });
    }
    if (dimensions.smoothness < 70) {
      issues.push({
        type: '毛孔',
        level: dimensions.smoothness < 50 ? '中度' : '轻度',
        location: 'T区',
        description: '皮肤纹理不够细腻，毛孔略显明显',
      });
    }
    if (dimensions.oilDry < 65) {
      issues.push({
        type: stats.avgBright > 150 ? '黑头' : '暗沉',
        level: '轻度',
        location: stats.avgBright > 150 ? '鼻部' : '全脸',
        description: stats.avgBright > 150 ? '油脂分泌偏多，注意清洁' : '肤色偏暗，注意保湿与作息',
      });
    }
    if (dimensions.color < 70) {
      issues.push({
        type: '暗沉',
        level: '轻度',
        location: '全脸',
        description: '肤色不均，建议加强防晒与抗氧化护理',
      });
    }
    return issues;
  }

  async analyze(imageBase64, context = {}) {
    const buffer = this.decodeBase64(imageBase64);
    let stats = await this.computeStats(buffer);
    if (!stats) stats = this.simulateStats(buffer);

    const color = this.calcColor(stats);
    const oilDry = this.calcOilDry(stats);
    const acne = this.calcAcne(stats);
    const smoothness = this.calcSmoothness(stats);
    const dimensions = { color, oilDry, acne, smoothness };

    const score = clamp(
      color * 0.25 + oilDry * 0.25 + acne * 0.3 + smoothness * 0.2
    );
    const skinType = context.skinType || this.inferSkinType(stats);
    const issues = this.inferIssues(stats, dimensions);

    return {
      skinType,
      score,
      riskLevel: BaseProvider.mapRisk(score),
      dimensions,
      issues,
      analysis: `综合评分 ${score} 分，肤质判定为「${skinType}」。肤色${color}分、水油平衡${oilDry}分、痤疮情况${acne}分、平滑度${smoothness}分。${
        issues.length > 0 ? `需要关注：${issues.map((i) => i.type).join('、')}。` : '整体状态较好，请继续保持基础护理。'
      }（本结果由本地启发式引擎生成，仅供参考）`,
      suggestions: [
        '坚持每日温和清洁、保湿与防晒三步基础护理',
        '保证充足睡眠与饮水，减少高糖高油饮食',
        oilDry < 70 ? '加强保湿或控油，维持水油平衡' : '保持当前水油平衡状态',
        acne < 70 ? '避免用手挤压痘痘，可选用含水杨酸的护肤品' : '注意清洁，预防痘痘复发',
        '每周固定时间复测肌肤，追踪变化趋势',
      ],
    };
  }
}

module.exports = LocalHeuristicProvider;
