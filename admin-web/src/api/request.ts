import axios, { type AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

const TOKEN_KEY = 'admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

// 请求拦截器：注入 Authorization
service.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理 {code, msg, data}
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res && res.code === 0) {
      return res.data;
    }
    ElMessage.error(res?.msg || '请求失败');
    return Promise.reject(new Error(res?.msg || '请求失败'));
  },
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      clearToken();
      ElMessage.error('登录已过期，请重新登录');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      ElMessage.error('无权限访问该资源');
    } else {
      ElMessage.error(error.response?.data?.msg || error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

/** 统一请求方法（泛型） */
export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config) as unknown as Promise<T>;
}

export default service;
