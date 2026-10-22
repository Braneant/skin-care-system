import { request } from './request';

export const getPlan = () => request<any>({ url: '/wx/plan' });
