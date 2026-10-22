<template>
  <view class="page">
    <!-- 概览卡片 -->
    <view class="hero card">
      <template v-if="userStore.isLogin">
        <view class="hero-title">{{ userStore.userInfo?.nickname || '你好' }}，今天也要好好护肤呀</view>
        <view class="hero-sub" v-if="latest">
          最新得分 <text class="score">{{ latest.score }}</text> 分 · {{ latest.riskLevel }}
        </view>
        <view class="hero-sub" v-else>还没有检测记录，点击下方「AI 测肤」开始吧</view>
        <view class="hero-actions">
          <button class="btn-primary" size="mini" @click="go('/pages/detect/upload')">AI 测肤</button>
          <button class="btn-ghost" size="mini" @click="go('/pages/survey/index')">肤质问卷</button>
        </view>
      </template>
      <template v-else>
        <view class="hero-title">欢迎使用智能护肤</view>
        <view class="hero-sub">微信一键登录，开启科学护肤之旅</view>
        <view class="hero-actions">
          <button class="btn-primary" size="mini" @click="go('/pages/login/index')">立即登录</button>
        </view>
      </template>
    </view>

    <!-- 快捷入口 -->
    <view class="grid">
      <view class="grid-item card" v-for="entry in entries" :key="entry.url" @click="go(entry.url)">
        <text class="grid-icon">{{ entry.icon }}</text>
        <text class="grid-text">{{ entry.text }}</text>
      </view>
    </view>

    <!-- 公告 -->
    <view class="card" v-if="notices.length">
      <view class="section-title">公告</view>
      <view v-for="n in notices" :key="n.id" class="notice-item">{{ n.title }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { listDetect } from '@/api/detect';
import { listNotices } from '@/api/content';
import { goPage } from '@/utils/nav';

const userStore = useUserStore();
const latest = ref<any>(null);
const notices = ref<any[]>([]);

const entries = [
  { icon: '📷', text: 'AI 测肤', url: '/pages/detect/upload' },
  { icon: '📝', text: '肤质问卷', url: '/pages/survey/index' },
  { icon: '✅', text: '每日打卡', url: '/pages/checkin/index' },
  { icon: '📈', text: '趋势记录', url: '/pages/trend/index' },
  { icon: '📖', text: '科普文章', url: '/pages/article/list' },
  { icon: '💬', text: '咨询预约', url: '/pages/consult/index' },
];

function go(url: string) {
  goPage(url);
}

async function load() {
  if (userStore.isLogin) {
    try {
      const list = await listDetect();
      latest.value = list && list[0] ? list[0] : null;
    } catch (e) {
      /* ignore */
    }
  }
  try {
    notices.value = await listNotices();
  } catch (e) {
    /* ignore */
  }
}

onMounted(load);
</script>

<style scoped>
.page {
  padding-bottom: 40rpx;
}
.hero {
  background: linear-gradient(135deg, #fce8ee, #e8f4fd);
}
.hero-title {
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.hero-sub {
  color: #666;
  font-size: 26rpx;
  margin-bottom: 20rpx;
}
.hero-sub .score {
  color: #f56c6c;
  font-size: 40rpx;
  font-weight: 700;
}
.hero-actions {
  display: flex;
  gap: 16rpx;
}
.btn-ghost {
  background: #fff;
  color: #f56c6c;
  border-radius: 44rpx;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 8rpx;
}
.grid-item {
  width: 29%;
  margin: 12rpx 2%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.grid-icon {
  font-size: 48rpx;
}
.grid-text {
  font-size: 24rpx;
  color: #333;
}
.section-title {
  font-weight: 600;
  margin-bottom: 12rpx;
}
.notice-item {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 26rpx;
  color: #555;
}
</style>
