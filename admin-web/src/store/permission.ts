import { defineStore } from 'pinia';
import router from '@/router';
import type { MenuItem } from '@/api/auth';

// 视图组件映射（相对 views 目录）
const modules = import.meta.glob('../views/**/*.vue');

function buildRoutes(menus: MenuItem[]): any[] {
  const routes: any[] = [];
  for (const menu of menus) {
    if (menu.component) {
      const loader = modules[`../views/${menu.component}.vue`];
      if (loader) {
        routes.push({
          path: menu.routePath,
          name: menu.code,
          component: loader,
          meta: { title: menu.name, icon: menu.icon, permission: menu.code },
        });
      }
    }
    if (menu.children && menu.children.length) {
      routes.push(...buildRoutes(menu.children));
    }
  }
  return routes;
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [] as any[],
    generated: false,
  }),
  actions: {
    generateRoutes(menus: MenuItem[]) {
      const routes = buildRoutes(menus);
      routes.forEach((r) => {
        if (!router.hasRoute(r.name)) {
          router.addRoute('Layout', r);
        }
      });
      this.routes = routes;
      this.generated = true;
      return routes;
    },
    reset() {
      this.routes = [];
      this.generated = false;
    },
  },
});
