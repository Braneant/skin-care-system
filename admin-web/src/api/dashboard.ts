import { request } from './request';

export const getSummary = () => request<any>({ url: '/admin/dashboard/summary', method: 'get' });
