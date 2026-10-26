import { request } from './request';

export interface HomeSummary {
  streak: number;
  weekRate: number;
  latestScore: number | null;
  todayTodo: Array<{ key: string; label: string; done: boolean; url: string }>;
}

export const getSummary = () => request<HomeSummary>({ url: '/wx/home/summary' });
