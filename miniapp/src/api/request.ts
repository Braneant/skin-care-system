import { getToken, clearToken } from '@/utils/auth';

// H5 走 vite 代理；小程序走完整地址
// #ifdef H5
const BASE_URL = '/api';
// #endif
// #ifndef H5
const BASE_URL = 'http://localhost:3000/api';
// #endif

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  header?: Record<string, string>;
}

/**
 * 统一请求封装：注入 Wx-Authorization，统一处理 {code,msg,data}
 */
export function request<T = any>(options: RequestOptions): Promise<T> {
  const token = getToken();
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Wx-Authorization': token ? `Bearer ${token}` : '',
        ...(options.header || {}),
      },
      success: (res) => {
        const body = res.data as any;
        if (body && body.code === 0) {
          return resolve(body.data as T);
        }
        if (body && body.code === 401) {
          clearToken();
          uni.showToast({ title: '登录已过期', icon: 'none' });
          setTimeout(() => uni.reLaunch({ url: '/pages/login/index' }), 600);
          return reject(new Error(body.msg || '未登录'));
        }
        uni.showToast({ title: (body && body.msg) || '请求失败', icon: 'none' });
        reject(new Error((body && body.msg) || '请求失败'));
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误，请检查后端服务', icon: 'none' });
        reject(err);
      },
    });
  });
}
