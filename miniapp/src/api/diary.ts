import { request, uploadFile } from './request';

export const listDiary = () => request<any[]>({ url: '/wx/photo-diary' });

export const uploadDiary = (filePath: string, note = '') =>
  uploadFile<any>('/wx/photo-diary', filePath, { note });

export const removeDiary = (id: number) =>
  request<any>({ url: `/wx/photo-diary/${id}`, method: 'DELETE' });
