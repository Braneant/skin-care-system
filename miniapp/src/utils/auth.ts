const TOKEN_KEY = 'wx_token';

export function getToken(): string {
  return uni.getStorageSync(TOKEN_KEY) || '';
}

export function setToken(token: string): void {
  uni.setStorageSync(TOKEN_KEY, token);
}

export function clearToken(): void {
  uni.removeStorageSync(TOKEN_KEY);
}
