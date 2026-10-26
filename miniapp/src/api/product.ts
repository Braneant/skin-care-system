import { request } from './request';

export interface ProductItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  description: string;
  matchScore: number;
}

export interface ProductDetail extends ProductItem {
  matchReasons: string[];
  ingredients: Array<{ ingredientId: number | null; name: string; riskLevel: string | null; efficacy: string | null }>;
}

export const listProducts = (keyword = '', category = '') =>
  request<ProductItem[]>({
    url: `/wx/products?keyword=${encodeURIComponent(keyword)}&category=${encodeURIComponent(category)}`,
  });

export const getProduct = (id: number) =>
  request<ProductDetail>({ url: `/wx/products/${id}` });

// 方案步骤（含绑定产品）
export const getPlanSteps = () => request<any>({ url: '/wx/plan/steps' });

export const bindPlanStepProduct = (period: string, stepKey: string, productId: number | null) =>
  request<any>({
    url: `/wx/plan/steps/${period}/${stepKey}/product`,
    method: 'PUT',
    data: productId ? { productId } : {},
  });

// 我的产品柜
export const listMyProducts = () => request<any[]>({ url: '/wx/my-products' });

export const addMyProduct = (productId: number, status = 'using') =>
  request<any>({ url: '/wx/my-products', method: 'POST', data: { productId, status } });

export const updateMyProduct = (productId: number, status: string) =>
  request<any>({ url: '/wx/my-products', method: 'POST', data: { productId, status } });

export const removeMyProduct = (id: number) =>
  request<any>({ url: `/wx/my-products/${id}`, method: 'DELETE' });

// 开封有效期
export const listProductUsages = () => request<any[]>({ url: '/wx/product-usages' });

export const setProductUsage = (data: Record<string, any>) =>
  request<any>({ url: '/wx/product-usages', method: 'POST', data });

export const listExpiringUsages = () => request<any[]>({ url: '/wx/product-usages/expiring' });

// 使用记录
export const listUsageLogs = (productId?: number) =>
  request<any[]>({ url: `/wx/usage-logs${productId ? `?productId=${productId}` : ''}` });

export const createUsageLog = (data: Record<string, any>) =>
  request<any>({ url: '/wx/usage-logs', method: 'POST', data });
