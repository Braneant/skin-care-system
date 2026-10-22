import { request } from './request';
import type { PageResult } from './user';

export const listDetectRecords = (params: Record<string, any>) =>
  request<PageResult>({ url: '/admin/detect-records', method: 'get', params });
