import { defineStore } from 'pinia';
import { getToken, setToken, clearToken } from '@/utils/auth';
import { login, getMe } from '@/api/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    userInfo: null as any,
    profile: null as any,
  }),
  getters: {
    isLogin: (state) => !!state.token,
  },
  actions: {
    async login(code: string) {
      const data = await login(code);
      this.token = data.token;
      setToken(data.token);
      this.userInfo = data.userInfo;
      return data;
    },
    async fetchMe() {
      const info = await getMe();
      this.userInfo = info;
      return info;
    },
    logout() {
      this.token = '';
      this.userInfo = null;
      clearToken();
    },
  },
});
