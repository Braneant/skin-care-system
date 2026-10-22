import { request } from './request';

export const getToday = () => request<any>({ url: '/wx/checkin/today' });

export const submitCheckin = (data: Record<string, any>) =>
  request<any>({ url: '/wx/checkin', method: 'POST', data });
