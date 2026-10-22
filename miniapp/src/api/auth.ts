import { request } from './request';

export interface LoginData {
  token: string;
  userInfo: { id: number; nickname?: string; avatarUrl?: string; gender?: string };
  isNew: boolean;
}

export const login = (code: string) =>
  request<LoginData>({ url: '/wx/auth/login', method: 'POST', data: { code } });

export const getMe = () => request<any>({ url: '/wx/users/me' });

export const updateMe = (data: Record<string, any>) =>
  request<any>({ url: '/wx/users/me', method: 'PUT', data });
