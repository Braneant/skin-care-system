/**
 * 统一页面跳转：tabBar 页面用 switchTab，普通页面用 navigateTo
 * tabBar 页面不支持 navigateTo，也不支持携带查询参数
 */
const TAB_PAGES = [
  '/pages/home/index',
  '/pages/checkin/index',
  '/pages/plan/index',
  '/pages/mine/index',
];

export function goPage(url: string) {
  const path = url.split('?')[0];
  if (TAB_PAGES.includes(path)) {
    uni.switchTab({ url: path });
  } else {
    uni.navigateTo({ url });
  }
}
