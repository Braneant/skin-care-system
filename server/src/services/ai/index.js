'use strict';

/**
 * AI Provider 工厂
 * type: auto | deepseek | local
 * auto = 有 DEEPSEEK_API_KEY 用 DeepSeek，否则本地
 */
const { config } = require('../../config');
const DeepSeekProvider = require('./deepseekProvider');
const LocalHeuristicProvider = require('./localHeuristicProvider');
const logger = require('../../utils/logger');

let deepseekInstance = null;
let localInstance = null;

class AIProviderFactory {
  /**
   * @param {'auto'|'deepseek'|'local'} type
   */
  static getProvider(type = config.aiProvider) {
    if (type === 'local') {
      return AIProviderFactory.getLocal();
    }
    if (type === 'deepseek') {
      if (!config.deepseekApiKey) {
        logger.warn('[AIProviderFactory] 指定 deepseek 但未配置 DEEPSEEK_API_KEY，降级本地');
        return AIProviderFactory.getLocal();
      }
      return AIProviderFactory.getDeepSeek();
    }
    // auto
    if (config.deepseekApiKey) {
      return AIProviderFactory.getDeepSeek();
    }
    return AIProviderFactory.getLocal();
  }

  static getDeepSeek() {
    if (!deepseekInstance) deepseekInstance = new DeepSeekProvider();
    return deepseekInstance;
  }

  static getLocal() {
    if (!localInstance) localInstance = new LocalHeuristicProvider();
    return localInstance;
  }

  /** 是否配置了 DeepSeek（用于判断降级原因） */
  static hasDeepSeek() {
    return !!config.deepseekApiKey;
  }
}

module.exports = AIProviderFactory;
