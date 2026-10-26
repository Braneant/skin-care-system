/**
 * 定位与城市解析（UV 卡片按定位显示当地紫外线）
 * - CITY_COORDS：内置主要城市经纬度（约 16 个）
 * - CITY_LIST：仅城市名数组（供 picker 选择器）
 * - resolveCity()：优先 GPS 就近匹配 → 失败回退缓存 → 默认北京
 * - saveCity() / onCityChange()：手动切换并缓存
 */

export interface ResolvedCity {
  city: string;
  source: 'gps' | 'cache' | 'default';
}

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  北京: { lat: 39.9042, lng: 116.4074 },
  上海: { lat: 31.2304, lng: 121.4737 },
  广州: { lat: 23.1291, lng: 113.2644 },
  深圳: { lat: 22.5431, lng: 114.0579 },
  杭州: { lat: 30.2741, lng: 120.1551 },
  成都: { lat: 30.5728, lng: 104.0668 },
  武汉: { lat: 30.5928, lng: 114.3055 },
  西安: { lat: 34.3416, lng: 108.9398 },
  南京: { lat: 32.0603, lng: 118.7969 },
  重庆: { lat: 29.563, lng: 106.5516 },
  天津: { lat: 39.3434, lng: 117.3616 },
  苏州: { lat: 31.2989, lng: 120.5853 },
  长沙: { lat: 28.2282, lng: 112.9388 },
  郑州: { lat: 34.7466, lng: 113.6254 },
  青岛: { lat: 36.0671, lng: 120.3826 },
  厦门: { lat: 24.4798, lng: 118.0894 },
};

export const CITY_LIST: string[] = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安',
  '南京', '重庆', '天津', '苏州', '长沙', '郑州', '青岛', '厦门',
];

const DEFAULT_CITY = '北京';
const CACHE_KEY = 'uv_city';

/** 按经纬度就近匹配城市 */
function nearestCity(lat: number, lng: number): string {
  let best = DEFAULT_CITY;
  let bestDist = Infinity;
  for (const name of CITY_LIST) {
    const c = CITY_COORDS[name];
    const d = (c.lat - lat) * (c.lat - lat) + (c.lng - lng) * (c.lng - lng);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return best;
}

/** 缓存城市 */
export function saveCity(city: string): void {
  uni.setStorageSync(CACHE_KEY, city);
}

/**
 * 解析当前城市：
 * 1) 尝试 GPS 定位（gcj02）→ 就近匹配城市，source='gps'
 * 2) 定位失败/拒绝 → 缓存城市 source='cache'，否则默认北京 source='default'
 */
export function resolveCity(): Promise<ResolvedCity> {
  return new Promise((resolve) => {
    let cached = '';
    try {
      cached = uni.getStorageSync(CACHE_KEY) || '';
    } catch (e) {
      cached = '';
    }

    const fallback = (): ResolvedCity =>
      cached ? { city: cached, source: 'cache' } : { city: DEFAULT_CITY, source: 'default' };

    try {
      uni.getLocation({
        type: 'gcj02',
        success: (res: any) => {
          if (res && typeof res.latitude === 'number' && typeof res.longitude === 'number') {
            const city = nearestCity(res.latitude, res.longitude);
            saveCity(city);
            resolve({ city, source: 'gps' });
          } else {
            resolve(fallback());
          }
        },
        fail: () => resolve(fallback()),
      });
    } catch (e) {
      resolve(fallback());
    }
  });
}

/** 选择器切换城市：从事件取值 → 缓存 → 返回城市名 */
export function onCityChange(e: any): string {
  const idx = Number(e && e.detail ? e.detail.value : 0);
  const city = CITY_LIST[idx] || DEFAULT_CITY;
  saveCity(city);
  return city;
}
