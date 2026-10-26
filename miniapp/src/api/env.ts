import { request } from './request';

export const getUv = (city = '北京') =>
  request<any>({ url: `/wx/env/uv?city=${encodeURIComponent(city)}` });

export const getSeasonTip = () => request<any>({ url: '/wx/env/season-tip' });

export const getRecheck = () => request<any>({ url: '/wx/recheck' });
