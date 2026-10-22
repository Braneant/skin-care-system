import { request } from './request';

export const analyze = (imageBase64: string) =>
  request<any>({ url: '/wx/detect/analyze', method: 'POST', data: { imageBase64 } });

export const getDetectDetail = (id: number) =>
  request<any>({ url: `/wx/detect/${id}` });

export const listDetect = () => request<any[]>({ url: '/wx/detect' });

export const getTrend = (days = 30) =>
  request<any[]>({ url: `/wx/trend?days=${days}` });
