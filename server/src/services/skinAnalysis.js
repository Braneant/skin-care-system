'use strict';

/**
 * 肌肤检测编排服务
 * 流程：图片校验/压缩 → AI（DeepSeek→重试→本地降级）→ 字段校验 → 落库 → 更新档案 → 生成方案
 */
const AIProviderFactory = require('./ai');
const BaseProvider = require('./ai/baseProvider');
const imageUtils = require('./ai/imageUtils');
const planGenerator = require('./planGenerator');
const { saveImageBuffer } = require('../middlewares/upload');
const { BusinessError } = require('../middlewares/errorHandler');
const detectRecordRepo = require('../repositories/detectRecordRepo');
const skinProfileRepo = require('../repositories/skinProfileRepo');
const planRepo = require('../repositories/planRepo');
const { config } = require('../config');
const helper = require('../utils/helper');
const logger = require('../utils/logger');

const VALID_SKIN_TYPES = ['干性', '油性', '混合性', '中性', '敏感性'];
const VALID_RISK_LEVELS = ['良好', '一般', '需关注', '高风险'];
const VALID_ISSUE_TYPES = ['痘痘', '黑头', '皱纹', '色斑', '毛孔', '暗沉', '敏感'];
const VALID_ISSUE_LEVELS = ['轻度', '中度', '重度'];

class SkinAnalysisService {
  /** 风险档映射（统一口径） */
  mapRisk(score) {
    return BaseProvider.mapRisk(score);
  }

  /**
   * 字段校验与归一化
   * @returns {object} 归一化后的 SkinAnalysis
   */
  validate(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('AI 返回结构非法');
    }

    // skinType
    let skinType = VALID_SKIN_TYPES.includes(raw.skinType) ? raw.skinType : '混合性';

    // score
    let score = Number(raw.score);
    if (!Number.isFinite(score)) score = 60;
    score = Math.max(0, Math.min(100, Math.round(score)));

    // riskLevel（以 score 权威映射）
    const riskLevel = this.mapRisk(score);

    // dimensions
    const dimRaw = raw.dimensions || {};
    const dim = {};
    for (const key of ['color', 'oilDry', 'acne', 'smoothness']) {
      let v = Number(dimRaw[key]);
      if (!Number.isFinite(v)) v = 60;
      dim[key] = Math.max(0, Math.min(100, Math.round(v)));
    }

    // issues
    let issues = Array.isArray(raw.issues) ? raw.issues : [];
    issues = issues
      .map((it) => {
        if (!it || typeof it !== 'object') return null;
        const type = VALID_ISSUE_TYPES.includes(it.type) ? it.type : '暗沉';
        const level = VALID_ISSUE_LEVELS.includes(it.level) ? it.level : '轻度';
        return {
          type,
          level,
          location: String(it.location || '面部'),
          description: String(it.description || ''),
        };
      })
      .filter(Boolean);

    // analysis / suggestions
    const analysis = typeof raw.analysis === 'string' && raw.analysis
      ? raw.analysis
      : `综合评分 ${score} 分，肤质为「${skinType}」。`;
    let suggestions = Array.isArray(raw.suggestions) ? raw.suggestions : [];
    suggestions = suggestions.filter((s) => typeof s === 'string' && s).slice(0, 6);

    return { skinType, score, riskLevel, dimensions: dim, issues, analysis, suggestions };
  }

  decodeBuffer(imageBase64) {
    if (Buffer.isBuffer(imageBase64)) return imageBase64;
    if (typeof imageBase64 !== 'string') throw new Error('缺少图片数据');
    if (imageBase64.startsWith('data:')) {
      const idx = imageBase64.indexOf('base64,');
      if (idx < 0) throw new Error('图片 base64 格式非法');
      return Buffer.from(imageBase64.slice(idx + 7), 'base64');
    }
    return Buffer.from(imageBase64, 'base64');
  }

  /**
   * DeepSeek 调用（含重试）
   */
  async runDeepSeek(provider, dataUrl, context) {
    let lastErr = null;
    const attempts = 1 + Math.max(0, config.aiMaxRetry);
    for (let i = 0; i < attempts; i += 1) {
      try {
        const raw = await provider.analyze(dataUrl, context);
        return this.validate(raw);
      } catch (e) {
        lastErr = e;
        logger.warn(`[skinAnalysis] DeepSeek 第 ${i + 1} 次调用失败：${e.message}`);
      }
    }
    throw lastErr || new Error('DeepSeek 调用失败');
  }

  /**
   * 核心：分析并保存
   * @param {number} userId
   * @param {string|Buffer} imageBase64
   * @returns {Promise<object>} 检测报告 + 方案
   */
  async analyzeAndSave(userId, imageBase64) {
    // 1. 解码 + 校验 + 压缩
    const rawBuffer = this.decodeBuffer(imageBase64);
    const v = imageUtils.validateImage(rawBuffer);
    if (!v.valid) {
      throw new BusinessError(20001, v.reason);
    }
    const compressed = await imageUtils.compressImage(rawBuffer);
    const saved = await saveImageBuffer(compressed.buffer, 'detect');
    const dataUrl = imageUtils.toDataUrl(compressed.buffer, compressed.mimeType);

    // 2. 上下文（用户档案）
    const profile = skinProfileRepo.findByUserId(userId);
    const context = {
      skinType: profile ? profile.skin_type : undefined,
      concerns: profile ? helper.parseJson(profile.concerns, []) : [],
    };

    // 3. 降级链
    const providerType = config.aiProvider;
    let result = null;
    let engine = 'local';
    let degraded = false;
    let rawReport = null;

    const provider = AIProviderFactory.getProvider(providerType);
    if (provider.name === 'deepseek') {
      try {
        result = await this.runDeepSeek(provider, dataUrl, context);
        engine = 'deepseek';
        degraded = false;
      } catch (e) {
        logger.warn(`[skinAnalysis] DeepSeek 降级到本地引擎：${e.message}`);
        const local = AIProviderFactory.getLocal();
        result = this.validate(await local.analyze(dataUrl, context));
        engine = 'local';
        degraded = true;
      }
    } else {
      result = this.validate(await provider.analyze(dataUrl, context));
      engine = 'local';
      degraded = false;
    }

    rawReport = result;

    // 4. 落库 detect_records
    const detectId = detectRecordRepo.insert({
      user_id: userId,
      image_url: saved.url,
      engine,
      degraded: degraded ? 1 : 0,
      skin_type: result.skinType,
      issues: JSON.stringify(result.issues),
      risk_level: result.riskLevel,
      score: result.score,
      dimensions: JSON.stringify(result.dimensions),
      raw_report: JSON.stringify(rawReport),
      report_text: result.analysis,
      created_at: helper.now(),
    });

    // 5. 更新肌肤档案（最新肤质 + 档案照片）
    if (profile) {
      skinProfileRepo.updateById(profile.id, {
        skin_type: result.skinType,
        photo_url: saved.url,
      });
    } else {
      skinProfileRepo.insert({
        user_id: userId,
        skin_type: result.skinType,
        photo_url: saved.url,
      });
    }

    // 6. 生成方案
    const planData = planGenerator.generate(result);
    const planId = planRepo.createNew(userId, {
      detect_record_id: detectId,
      title: planData.title,
      routine_morning: JSON.stringify(planData.routineMorning),
      routine_evening: JSON.stringify(planData.routineEvening),
      ingredients: JSON.stringify(planData.ingredients),
      taboos: JSON.stringify(planData.taboos),
      status: 1,
    });

    return {
      detectId,
      engine,
      degraded,
      score: result.score,
      riskLevel: result.riskLevel,
      skinType: result.skinType,
      dimensions: result.dimensions,
      issues: result.issues,
      analysis: result.analysis,
      suggestions: result.suggestions,
      imageUrl: saved.url,
      plan: { planId, ...planData },
      createdAt: helper.now(),
    };
  }
}

module.exports = new SkinAnalysisService();
module.exports.SkinAnalysisService = SkinAnalysisService;
