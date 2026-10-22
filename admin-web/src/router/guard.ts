import router from './index';
import { getToken } from '@/api/request';
import { useUserStore } from '@/store/user';
import { usePermissionStore } from '@/store/permission';

const WHITE_LIST = ['/login'];

router.beforeEach(async (to, _from, next) => {
  const token = getToken();

  // 白名单
  if (WHITE_LIST.includes(to.path)) {
    if (token) return next('/dashboard');
    return next();
  }

  // 未登录
  if (!token) return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);

  const userStore = useUserStore();
  const permissionStore = usePermissionStore();

  // 首次加载：拉取用户信息 + 动态路由
  if (!userStore.user) {
    try {
      const data = await userStore.fetchInfo();
      permissionStore.generateRoutes(data.menus);
      next({ ...to, replace: true });
      return;
    } catch (e) {
      userStore.logout();
      next('/login');
      return;
    }
  }

  // 权限校验
  const perm = to.meta?.permission as string | undefined;
  if (perm && !userStore.perms.includes(perm)) {
    return next('/dashboard');
  }

  next();
});
