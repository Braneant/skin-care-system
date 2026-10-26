'use strict';

/**
 * 天气/UV 数据源封装（Phase C）
 * - WEATHER_PROVIDER=qweather 且配置 Key 时走真实接口
 * - 否则走 mock 规则降级（不阻塞）
 */
const axios = require('axios');
const { config } = require('../config');
const logger = require('./logger');

/**
 * 获取城市 UV 指数（真实源）
 * 返回整数；失败返回 null
 */
async function fetchUv(city) {
  if (config.weatherProvider !== 'qweather' || !config.weatherApiKey) {
    return null;
  }
  try {
    // 简化示例：和风天气需先城市查询再天气查询，这里仅演示封装边界
    const { data } = await axios.get('https://devapi.qweather.com/v7/weather/now', {
      params: { key: config.weatherApiKey, location: city },
      timeout: 8000,
    });
    if (data && data.code === '200' && data.now && data.now.uvIndex !== undefined) {
      return Number(data.now.uvIndex);
    }
    return null;
  } catch (e) {
    logger.warn(`[weather] 天气源请求失败，降级 mock：${e.message}`);
    return null;
  }
}

module.exports = { fetchUv };
