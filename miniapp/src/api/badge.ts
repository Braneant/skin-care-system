import { request } from './request';

export interface Badge {
  code: string;
  name: string;
  desc: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
  progress: string;
}

export const getBadges = () => request<Badge[]>({ url: '/wx/badges' });
