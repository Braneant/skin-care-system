import { request } from './request';

export const submitSurvey = (data: Record<string, any>) =>
  request<any>({ url: '/wx/skin-profile/survey', method: 'POST', data });

export const getProfile = () => request<any>({ url: '/wx/skin-profile' });

export const updateProfile = (data: Record<string, any>) =>
  request<any>({ url: '/wx/skin-profile', method: 'PUT', data });
