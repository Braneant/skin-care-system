import { request } from './request';

export const listFollowup = () => request<any[]>({ url: '/wx/followup' });

export const sendFollowup = (content: string) =>
  request<any>({ url: '/wx/followup', method: 'POST', data: { content } });

export const listReports = () => request<any[]>({ url: '/wx/reports' });
