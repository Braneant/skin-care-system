import { request } from './request';

export const listReminders = () => request<any[]>({ url: '/wx/reminders' });

export const upsertReminder = (data: Record<string, any>) =>
  request<any>({ url: '/wx/reminders', method: 'POST', data });

export const updateReminder = (id: number, data: Record<string, any>) =>
  request<any>({ url: `/wx/reminders/${id}`, method: 'PUT', data });

export const removeReminder = (id: number) =>
  request<any>({ url: `/wx/reminders/${id}`, method: 'DELETE' });
