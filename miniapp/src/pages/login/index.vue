<template>
  <view class="page">
    <view class="login-box">
      <view class="logo">🧴</view>
      <view class="title">智能护肤</view>
      <view class="subtitle">AI 测肤 · 个性化方案 · 每日打卡</view>

      <button class="btn-primary login-btn" :loading="loading" @click="onLogin">
        微信一键登录
      </button>
      <view class="tip">登录即代表同意《用户协议》与《隐私政策》</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const loading = ref(false);

function onLogin() {
  loading.value = true;
  uni.login({
    provider: 'weixin',
    success: async (res: any) => {
      try {
        const data = await userStore.login(res.code || 'dev_code_' + Date.now());
        uni.showToast({ title: data.isNew ? '欢迎新用户' : '登录成功', icon: 'none' });
        setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 600);
      } catch (e) {
        /* 拦截器已提示 */
      } finally {
        loading.value = false;
      }
    },
    fail: () => {
      loading.value = false;
      uni.showToast({ title: '微信登录失败', icon: 'none' });
    },
  });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #fce8ee, #e8f4fd);
}
.login-box {
  text-align: center;
  padding: 60rpx;
}
.logo {
  font-size: 120rpx;
}
.title {
  font-size: 44rpx;
  font-weight: 700;
  margin-top: 20rpx;
}
.subtitle {
  color: #999;
  font-size: 26rpx;
  margin: 12rpx 0 60rpx;
}
.login-btn {
  width: 80%;
}
.tip {
  margin-top: 24rpx;
  color: #bbb;
  font-size: 22rpx;
}
</style>
