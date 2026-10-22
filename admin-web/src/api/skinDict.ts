import { request } from './request';

export const listSkinDict = (params: Record<string, any>) =>
  request<any[]>({ url: '/admin/skin-dict', method: 'get', params });
export const createSkinDict = (data: Record<string, any>) =>
  request({ url: '/admin/skin-dict', method: 'post', data });
export const updateSkinDict = (id: number, data: Record<string, any>) =>
  request({ url: `/admin/skin-dict/${id}`, method: 'put', data });
export const deleteSkinDict = (id: number) =>
  request({ url: `/admin/skin-dict/${id}`, method: 'delete' });
