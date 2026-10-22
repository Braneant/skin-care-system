import { request } from './request';
import type { PageResult } from './user';

// 文章
export const listArticles = (params: Record<string, any>) =>
  request<PageResult>({ url: '/admin/articles', method: 'get', params });
export const createArticle = (data: Record<string, any>) =>
  request({ url: '/admin/articles', method: 'post', data });
export const updateArticle = (id: number, data: Record<string, any>) =>
  request({ url: `/admin/articles/${id}`, method: 'put', data });
export const deleteArticle = (id: number) =>
  request({ url: `/admin/articles/${id}`, method: 'delete' });

// 产品
export const listProducts = (params: Record<string, any>) =>
  request<PageResult>({ url: '/admin/products', method: 'get', params });
export const createProduct = (data: Record<string, any>) =>
  request({ url: '/admin/products', method: 'post', data });
export const updateProduct = (id: number, data: Record<string, any>) =>
  request({ url: `/admin/products/${id}`, method: 'put', data });
export const deleteProduct = (id: number) =>
  request({ url: `/admin/products/${id}`, method: 'delete' });

// 公告
export const listNotices = (params: Record<string, any>) =>
  request<PageResult>({ url: '/admin/notices', method: 'get', params });
export const createNotice = (data: Record<string, any>) =>
  request({ url: '/admin/notices', method: 'post', data });
export const updateNotice = (id: number, data: Record<string, any>) =>
  request({ url: `/admin/notices/${id}`, method: 'put', data });
export const deleteNotice = (id: number) =>
  request({ url: `/admin/notices/${id}`, method: 'delete' });
