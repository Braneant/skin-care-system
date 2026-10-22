<script setup>
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  // 启动时检查登录态（无 token 时由首页引导跳转登录）
});
</script>

<style>
page {
  background-color: #f7f7f7;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
.btn-primary {
  background: #f56c6c;
  color: #fff;
  border-radius: 44rpx;
}
.text-muted {
  color: #999;
  font-size: 24rpx;
}
</style>
