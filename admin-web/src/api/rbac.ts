import { request } from './request';

export const listRoles = () => request<any[]>({ url: '/admin/roles', method: 'get' });

export const getRole = (id: number) =>
  request<{ id: number; code: string; name: string; remark: string; permissionIds: number[] }>({
    url: `/admin/roles/${id}`,
    method: 'get',
  });

export const createRole = (data: Record<string, any>) =>
  request({ url: '/admin/roles', method: 'post', data });

export const updateRole = (id: number, data: Record<string, any>) =>
  request({ url: `/admin/roles/${id}`, method: 'put', data });

export const deleteRole = (id: number) =>
  request({ url: `/admin/roles/${id}`, method: 'delete' });

export const listPermissions = () => request<any[]>({ url: '/admin/permissions', method: 'get' });
