import { request } from './request';

export const listTemplates = () =>
  request<any[]>({ url: '/admin/advice-templates', method: 'get' });
export const createTemplate = (data: Record<string, any>) =>
  request({ url: '/admin/advice-templates', method: 'post', data });
export const updateTemplate = (id: number, data: Record<string, any>) =>
  request({ url: `/admin/advice-templates/${id}`, method: 'put', data });
export const deleteTemplate = (id: number) =>
  request({ url: `/admin/advice-templates/${id}`, method: 'delete' });
