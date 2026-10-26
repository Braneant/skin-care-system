import { request } from './request';

export interface Ingredient {
  id: number;
  name: string;
  enName: string;
  aliases: string[];
  functions: string[];
  efficacy: string;
  riskLevel: string;
  suitableSkin: string[];
  taboo: string;
  description: string;
}

export const listIngredients = (keyword = '', page = 1, pageSize = 20) =>
  request<any>({
    url: `/wx/ingredients?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`,
  });

export const getIngredient = (id: number) =>
  request<Ingredient>({ url: `/wx/ingredients/${id}` });
