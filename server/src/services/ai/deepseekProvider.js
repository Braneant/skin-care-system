'use strict';

/**
 * DeepSeek Provider（OpenAI 兼容 SDK）
 * - 视觉模型名从配置读取（DEEPSEEK_VISION_MODEL），严禁硬编码
 * - prompt 强制「仅返回 JSON」
 * - parseResponse 剥离 Markdown 代码块后 JSON.parse
 */
const OpenAI = require('openai');
const BaseProvider = require('./baseProvider');
const { config } = require('../../config');
const logger = require('../../utils/logger');

class DeepSeekProvider extends BaseProvider {
  constructor() {
    super('deepseek');
    this.client = new OpenAI({
      apiKey: config.deepseekApiKey,
      baseURL: config.deepseekBaseUrl,
    });
    this.model = config.deepseekVisionModel;
    this.timeout = config.aiTimeoutMs;
  }

  buildPrompt(context = {}) {
    const skinType = context.skinType || '未知';
    const concerns = Array.isArray(context.concerns) ? context.concerns.join('、') : '无';
    return [
      '你是一名专业的皮肤科医生与肌肤检测专家。请仔细观察用户上传的面部照片，进行肤质检测分析。',
      `用户自评肤质：${skinType}；自评问题：${concerns}。`,
      '',
      '请**仅返回一个 JSON 对象**，不要输出任何 Markdown 代码块、解释或多余文字。JSON 结构必须严格符合以下字段：',
      '{',
      '  "skinType": "干性|油性|混合性|中性|敏感性（五选一）",',
      '  "score": 0-100 的整数（综合肌肤得分）',
      '  "riskLevel": "良好|一般|需关注|高风险（四选一）",',
      '  "dimensions": { "color": 0-100, "oilDry": 0-100, "acne": 0-100, "smoothness": 0-100 },',
      '  "issues": [ { "type": "痘痘|黑头|皱纹|色斑|毛孔|暗沉|敏感", "level": "轻度|中度|重度", "location": "具体部位", "description": "简要描述" } ],',
      '  "analysis": "整体肤质分析文本（100-200字）",',
      '  "suggestions": ["3-5条可执行的护肤建议"]',
      '}',
      '',
      '要求：分数 0-100 为整数；dimensions 四项均为 0-100 整数；issues 至少 1 条；riskLevel 与 score 对应（≥80良好、60-79一般、40-59需关注、<40高风险）。',
    ].join('\n');
  }

  /**
   * 解析模型返回文本 → SkinAnalysis
   */
  parseResponse(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('DeepSeek 返回内容为空');
    }
    let content = text.trim();
    // 剥离 Markdown 代码块
    const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) content = fence[1].trim();
    // 兜底：截取首个 { 到最后一个 }
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start >= 0 && end > start) {
      content = content.slice(start, end + 1);
    }
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('DeepSeek 返回非对象 JSON');
    }
    return parsed;
  }

  async analyze(imageBase64, context = {}) {
    logger.info(`[DeepSeekProvider] 调用视觉模型 ${this.model}`);
    const prompt = this.buildPrompt(context);
    const response = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      },
      { timeout: this.timeout }
    );

    const text = response.choices && response.choices[0] && response.choices[0].message
      ? response.choices[0].message.content
      : '';
    const result = this.parseResponse(text);
    // 归一化：由 skinAnalysis 做最终校验，这里仅补 riskLevel
    result.riskLevel = result.riskLevel || BaseProvider.mapRisk(Number(result.score));
    return result;
  }
}

module.exports = DeepSeekProvider;
