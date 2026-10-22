import { request } from './request';

export const listArticles = (page = 1, pageSize = 10) =>
  request<any>({ url: `/wx/articles?page=${page}&pageSize=${pageSize}` });

export const getArticle = (id: number) => request<any>({ url: `/wx/articles/${id}` });

export const toggleFavorite = (articleId: number) =>
  request<any>({ url: '/wx/favorites', method: 'POST', data: { articleId } });

export const listFavorites = () => request<any[]>({ url: '/wx/favorites' });

export const listNotices = () => request<any[]>({ url: '/wx/notices' });

export const submitFeedback = (content: string) =>
  request<any>({ url: '/wx/feedback', method: 'POST', data: { content } });

export const getMyAdvice = () => request<any[]>({ url: '/wx/advice' });

export const createConsultation = (data: Record<string, any>) =>
  request<any>({ url: '/wx/consultations', method: 'POST', data });

export const listConsultations = () => request<any[]>({ url: '/wx/consultations' });
