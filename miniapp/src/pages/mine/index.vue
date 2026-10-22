<template>
  <view class="page">
    <view class="card user-card">
      <view class="avatar">{{ (userStore.userInfo?.nickname || '用')[0] }}</view>
      <view class="user-meta">
        <view class="name">{{ userStore.userInfo?.nickname || '未登录' }}</view>
        <view class="text-muted">点击下方登录/切换账号</view>
      </view>
    </view>

    <view class="card menu">
      <view class="menu-item" @click="go('/pages/profile/skin')">
        <text>📋 我的肌肤档案</text><text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="go('/pages/detect/upload')">
        <text>📷 AI 测肤</text><text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="go('/pages/trend/index')">
        <text>📈 趋势记录</text><text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="go('/pages/article/list')">
        <text>📖 科普文章</text><text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="go('/pages/consult/index')">
        <text>💬 咨询预约</text><text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="onFeedback">
        <text>📝 意见反馈</text><text class="arrow">›</text>
      </view>
    </view>

    <view class="card" v-if="advice.length">
      <view class="section-title">医生建议</view>
      <view v-for="a in advice" :key="a.id" class="advice">
        <text class="advice-content">{{ a.content }}</text>
        <text class="advice-doctor">— {{ a.doctorName || '医生' }}</text>
      </view>
    </view>

    <view class="logout-wrap" v-if="userStore.isLogin">
      <button class="logout" @click="onLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { submitFeedback, getMyAdvice } from '@/api/content';
import { goPage } from '@/utils/nav';

const userStore = useUserStore();
const advice = ref<any[]>([]);

function go(url: string) {
  if (!userStore.isLogin && url !== '/pages/login/index') {
    return uni.navigateTo({ url: '/pages/login/index' });
  }
  goPage(url);
}

function onLogout() {
  userStore.logout();
  uni.showToast({ title: '已退出', icon: 'none' });
}

function onFeedback() {
  uni.showModal({
    title: '意见反馈',
    editable: true,
    placeholderText: '请输入您的反馈意见',
    success: async (res: any) => {
      if (res.confirm && res.content) {
        try {
          await submitFeedback(res.content);
          uni.showToast({ title: '感谢您的反馈', icon: 'success' });
        } catch (e) {
          /* ignore */
        }
      }
    },
  });
}

onMounted(async () => {
  if (userStore.isLogin) {
    try {
      advice.value = await getMyAdvice();
    } catch (e) {
      /* ignore */
    }
  }
});
</script>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #fce8ee;
  color: #f56c6c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: 600;
}
.name {
  font-size: 32rpx;
  font-weight: 600;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  padding: 26rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  font-size: 28rpx;
}
.menu-item:last-child {
  border-bottom: none;
}
.arrow {
  color: #ccc;
}
.section-title {
  font-weight: 600;
  font-size: 28rpx;
  margin-bottom: 16rpx;
}
.advice {
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.advice-content {
  font-size: 26rpx;
  color: #444;
}
.advice-doctor {
  display: block;
  color: #999;
  font-size: 22rpx;
  margin-top: 6rpx;
}
.logout-wrap {
  padding: 20rpx;
}
.logout {
  background: #fff;
  color: #f56c6c;
  border: 2rpx solid #fce8ee;
  border-radius: 44rpx;
}
</style>
