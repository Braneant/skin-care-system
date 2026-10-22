import { request } from './request';
import type { PageResult } from './user';

export const listFeedback = (params: Record<string, any>) =>
  request<PageResult>({ url: '/admin/feedback', method: 'get', params });
export const replyFeedback = (id: number, reply: string) =>
  request({ url: `/admin/feedback/${id}/reply`, method: 'post', data: { reply } });
