'use strict';

/**
 * AI Provider 抽象基类
 * 所有 Provider 实现 analyze(imageBase64, context) → Promise<SkinAnalysis>
 * 返回统一结构（§9.4 AI JSON Schema）
 */
class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  /** 风险档映射：≥80 良好 / 60–79 一般 / 40–59 需关注 / <40 高风险 */
  static mapRisk(score) {
    if (score >= 80) return '良好';
    if (score >= 60) return '一般';
    if (score >= 40) return '需关注';
    return '高风险';
  }

  /**
   * @param {string} imageBase64 data URL 或纯 base64
   * @param {object} context 上下文（skinProfile 等）
   * @returns {Promise<object>} SkinAnalysis
   */
  // eslint-disable-next-line no-unused-vars
  async analyze(imageBase64, context = {}) {
    throw new Error('BaseProvider.analyze 必须由子类实现');
  }
}

module.exports = BaseProvider;
