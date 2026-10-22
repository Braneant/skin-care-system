import { request } from './request';

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: { id: number; username: string; realName: string };
  roles: string[];
  perms: string[];
}

export interface AdminMe {
  user: { id: number; username: string; realName: string; status: number };
  roles: { code: string; name: string }[];
  perms: string[];
  menus: MenuItem[];
}

export interface MenuItem {
  id: number;
  code: string;
  name: string;
  type: string;
  parentId: number;
  routePath: string;
  component: string;
  icon: string;
  sort: number;
  children?: MenuItem[];
}

export const login = (data: { username: string; password: string }) =>
  request<LoginResult>({ url: '/admin/auth/login', method: 'post', data });

export const refresh = (refreshToken: string) =>
  request<{ token: string; refreshToken: string }>({
    url: '/admin/auth/refresh',
    method: 'post',
    data: { refreshToken },
  });

export const getMe = () => request<AdminMe>({ url: '/admin/users/me', method: 'get' });
