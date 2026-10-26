<template>
  <view class="page">
    <!-- 概览卡片 -->
    <view class="hero card">
      <template v-if="userStore.isLogin">
        <view class="streak-line" v-if="summary">
          <text v-if="summary.streak > 0" class="streak-fire">🔥 已连续 {{ summary.streak }} 天</text>
          <text v-else class="streak-fire">🌱 从今天开始，养成护肤好习惯</text>
        </view>
        <view class="hero-title">{{ userStore.userInfo?.nickname || '你好' }}，今天也要好好护肤呀</view>
        <view class="hero-sub" v-if="summary && summary.latestScore != null">
          最新得分 <text class="score">{{ summary.latestScore }}</text> 分
        </view>
        <view class="hero-sub" v-else-if="!summary || summary.latestScore == null">还没有检测记录，点击下方「AI 测肤」开始吧</view>
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

    <!-- 今日待办 + 本周完成率 -->
    <view v-if="userStore.isLogin && summary" class="todo-card card">
      <view class="todo-head">
        <text class="section-title">今日待办</text>
        <ProgressRing :rate="summary.weekRate" :size="110" label="本周完成率" />
      </view>
      <view v-if="summary.todayTodo.length" class="todo-list">
        <view
          v-for="(t, i) in summary.todayTodo"
          :key="i"
          class="todo-item"
          :class="{ done: t.done }"
          @click="go(t.url)"
        >
          <text class="todo-check">{{ t.done ? '✅' : '○' }}</text>
          <text class="todo-label">{{ t.label }}</text>
          <text class="todo-arrow">›</text>
        </view>
      </view>
      <view v-else class="todo-empty">今日已全部完成 🎉</view>
    </view>

    <!-- 肤质匹配推荐 -->
    <view v-if="userStore.isLogin && recommend.length" class="card">
      <view class="section-title">为你推荐（按肤质匹配）</view>
      <view v-for="p in recommend" :key="p.id" class="rec-item" @click="go('/pages/product/detail?id=' + p.id)">
        <view class="rec-meta">
          <text class="rec-name">{{ p.name }}</text>
          <text class="rec-brand">{{ p.brand }} · {{ p.category }}</text>
        </view>
        <text class="rec-score">{{ p.matchScore }} 匹配</text>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="grid">
      <view class="grid-item card" v-for="entry in entries" :key="entry.url" @click="go(entry.url)">
        <text class="grid-icon">{{ entry.icon }}</text>
        <text class="grid-text">{{ entry.text }}</text>
      </view>
    </view>

    <!-- UV/天气提醒卡 -->
    <view v-if="userStore.isLogin && uv" class="card">
      <picker mode="selector" :range="CITY_LIST" :value="cityIndex" @change="onUvCityChange">
        <view class="uv-title-row">
          <text class="section-title">☀️ UV 指数提醒（{{ uv.city }}）</text>
          <text class="uv-title-arrow">▾</text>
        </view>
      </picker>
      <view class="uv-row">
        <text class="uv-num">{{ uv.uvIndex }}</text>
        <text class="uv-level">{{ uv.uvLevelLabel }}</text>
      </view>
      <text class="uv-advice">{{ uv.sunscreenAdvice }}</text>
      <view v-if="uv.afterSunAdvice && uv.afterSunAdvice.length" class="after-sun">
        <text class="after-sun-title">晒后建议：</text>
        <text v-for="(a, i) in uv.afterSunAdvice" :key="i" class="after-sun-item">{{ a }}</text>
      </view>
      <view v-if="uvSource !== 'gps'" class="uv-loc-tip">定位未开启，显示{{ uv.city }}，点击上方可切换城市</view>
    </view>

    <!-- 季节护理 + 复测提醒 -->
    <view v-if="userStore.isLogin && seasonTip" class="card">
      <view class="section-title">🍂 季节护理</view>
      <text class="season-tip">{{ seasonTip.season }}季 · {{ seasonTip.tip }}</text>
    </view>
    <view v-if="userStore.isLogin && recheck" class="card" @click="go('/pages/detect/upload')">
      <view class="section-title">🔁 复测提醒</view>
      <text class="recheck-text">{{ recheck.message }}</text>
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
import { listNotices } from '@/api/content';
import { getSummary, type HomeSummary } from '@/api/home';
import { listProducts } from '@/api/product';
import { getUv, getSeasonTip, getRecheck } from '@/api/env';
import { goPage } from '@/utils/nav';
import { resolveCity, onCityChange, CITY_LIST } from '@/utils/location';
import ProgressRing from '@/components/ProgressRing.vue';

const userStore = useUserStore();
const notices = ref<any[]>([]);
const summary = ref<HomeSummary | null>(null);
const recommend = ref<any[]>([]);
const uv = ref<any>(null);
const seasonTip = ref<any>(null);
const recheck = ref<any>(null);
const uvSource = ref<'gps' | 'cache' | 'default'>('default');
const cityIndex = ref(CITY_LIST.indexOf('北京'));

const entries = [
  { icon: '📷', text: 'AI 测肤', url: '/pages/detect/upload' },
  { icon: '📝', text: '肤质问卷', url: '/pages/survey/index' },
  { icon: '✅', text: '每日打卡', url: '/pages/checkin/index' },
  { icon: '📈', text: '趋势记录', url: '/pages/trend/index' },
  { icon: '🧪', text: '成分速查', url: '/pages/ingredient/list' },
  { icon: '💄', text: '产品库', url: '/pages/product/list' },
  { icon: '📖', text: '科普文章', url: '/pages/article/list' },
  { icon: '💬', text: '咨询预约', url: '/pages/consult/index' },
];

function go(url: string) {
  goPage(url);
}

async function load() {
  if (userStore.isLogin) {
    try {
      summary.value = await getSummary();
    } catch (e) {
      /* ignore */
    }
    try {
      const products = await listProducts('', '');
      recommend.value = (products || []).slice(0, 3);
    } catch (e) {
      /* ignore */
    }
    try {
      const resolved = await resolveCity();
      uvSource.value = resolved.source;
      cityIndex.value = Math.max(0, CITY_LIST.indexOf(resolved.city));
      uv.value = await getUv(resolved.city);
    } catch (e) {
      /* ignore */
    }
    try {
      seasonTip.value = await getSeasonTip();
    } catch (e) {
      /* ignore */
    }
    try {
      recheck.value = await getRecheck();
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

async function onUvCityChange(e: any) {
  const city = onCityChange(e);
  cityIndex.value = Math.max(0, CITY_LIST.indexOf(city));
  try {
    uv.value = await getUv(city);
    uvSource.value = 'cache';
    uni.showToast({ title: `已切换到${city}`, icon: 'none' });
  } catch (err) {
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
.streak-line {
  margin-bottom: 12rpx;
}
.streak-fire {
  font-size: 26rpx;
  color: #f56c6c;
  font-weight: 600;
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
.todo-card {
  margin-top: 20rpx;
}
.todo-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.todo-list {
  display: flex;
  flex-direction: column;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.todo-item:last-child {
  border-bottom: none;
}
.todo-item.done .todo-label {
  color: #bbb;
  text-decoration: line-through;
}
.todo-check {
  font-size: 30rpx;
}
.todo-label {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}
.todo-arrow {
  color: #ccc;
  font-size: 30rpx;
}
.todo-empty {
  text-align: center;
  color: #999;
  padding: 24rpx 0;
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
  font-size: 28rpx;
}
.rec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.rec-item:last-child {
  border-bottom: none;
}
.rec-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.rec-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}
.rec-brand {
  font-size: 22rpx;
  color: #999;
}
.rec-score {
  font-size: 24rpx;
  color: #f56c6c;
  font-weight: 600;
}
.uv-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  margin: 8rpx 0;
}
.uv-num {
  font-size: 64rpx;
  font-weight: 700;
  color: #f56c6c;
  line-height: 1;
}
.uv-level {
  font-size: 26rpx;
  color: #666;
}
.uv-advice {
  display: block;
  font-size: 26rpx;
  color: #555;
}
.uv-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.uv-title-arrow {
  color: #f56c6c;
  font-size: 26rpx;
}
.uv-loc-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #bbb;
}
.after-sun {
  margin-top: 12rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  align-items: center;
}
.after-sun-title {
  font-size: 24rpx;
  color: #999;
}
.after-sun-item {
  font-size: 24rpx;
  color: #666;
  background: #f5f5f5;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}
.season-tip {
  font-size: 26rpx;
  color: #555;
}
.recheck-text {
  font-size: 26rpx;
  color: #555;
}
.notice-item {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 26rpx;
  color: #555;
}
</style>
