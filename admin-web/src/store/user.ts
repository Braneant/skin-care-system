import { defineStore } from 'pinia';
import { login as loginApi, getMe, type AdminMe, type MenuItem } from '@/api/auth';
import { getToken, setToken, clearToken } from '@/api/request';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    user: null as AdminMe['user'] | null,
    roles: [] as string[],
    perms: [] as string[],
    menus: [] as MenuItem[],
  }),
  getters: {
    hasPermission: (state) => (code: string) => state.perms.includes(code),
  },
  actions: {
    async login(username: string, password: string) {
      const data = await loginApi({ username, password });
      this.token = data.token;
      setToken(data.token);
      localStorage.setItem('admin_refresh_token', data.refreshToken);
      return data;
    },
    async fetchInfo() {
      const data: AdminMe = await getMe();
      this.user = data.user;
      this.roles = data.roles.map((r) => r.code);
      this.perms = data.perms;
      this.menus = data.menus;
      return data;
    },
    logout() {
      this.token = '';
      this.user = null;
      this.roles = [];
      this.perms = [];
      this.menus = [];
      clearToken();
      localStorage.removeItem('admin_refresh_token');
    },
  },
});
