import { request } from './request';
import type { PageResult } from './user';

export const listConsultations = (params: Record<string, any>) =>
  request<PageResult>({ url: '/admin/consultations', method: 'get', params });

export const patchConsultation = (id: number, data: Record<string, any>) =>
  request({ url: `/admin/consultations/${id}`, method: 'patch', data });
