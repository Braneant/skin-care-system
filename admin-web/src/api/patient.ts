import { request } from './request';
import type { PageResult } from './user';

export const listPatients = (params: Record<string, any>) =>
  request<PageResult>({ url: '/admin/patients', method: 'get', params });

export const getPatient = (id: number) =>
  request<any>({ url: `/admin/patients/${id}`, method: 'get' });

export const getPatientTrend = (id: number, days = 30) =>
  request<any[]>({ url: `/admin/patients/${id}/trend`, method: 'get', params: { days } });

export const writeAdvice = (id: number, data: Record<string, any>) =>
  request({ url: `/admin/patients/${id}/advice`, method: 'post', data });
