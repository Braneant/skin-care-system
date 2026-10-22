import { request } from './request';

export interface PageResult<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const listUsers = (params: Record<string, any>) =>
  request<PageResult>({ url: '/admin/users', method: 'get', params });

export const createUser = (data: Record<string, any>) =>
  request({ url: '/admin/users', method: 'post', data });

export const updateUser = (id: number, data: Record<string, any>) =>
  request({ url: `/admin/users/${id}`, method: 'put', data });

export const updateUserStatus = (id: number, status: number, type = 'wx') =>
  request({ url: `/admin/users/${id}/status`, method: 'patch', data: { status, type } });
