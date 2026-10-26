<template>
  <view class="page">
    <!-- streak 火焰 + 激励文案 -->
    <view class="card streak-card">
      <view class="streak-num">{{ stats.streak }}</view>
      <view class="streak-meta">
        <view class="streak-title">🔥 已连续打卡</view>
        <view class="streak-text">{{ motivateText }}</view>
      </view>
    </view>

    <!-- 今日打卡 -->
    <view class="card">
      <view class="section-title">今日打卡（{{ todayText || '今天' }}）</view>
      <view class="checkin-grid">
        <view
          v-for="item in items"
          :key="item.key"
          class="checkin-item"
          :class="{ done: today[item.key] }"
          @click="toggle(item.key)"
        >
          <text class="checkin-icon">{{ today[item.key] ? '✅' : item.icon }}</text>
          <text class="checkin-text">{{ item.label }}</text>
        </view>
      </view>
      <view class="progress-tip">今日已完成 {{ doneCount }} / 3 项</view>
    </view>

    <!-- 7 日周历 -->
    <view class="card">
      <view class="section-title">近 7 日周历</view>
      <view class="calendar">
        <view v-for="(d, i) in calendar" :key="i" class="cal-col" :class="{ today: d.isToday }">
          <text class="cal-week">{{ weekLabel(d.date) }}</text>
          <view class="cal-dot-wrap">
            <text class="cal-dot" :class="dotClass(d)">{{ dotText(d) }}</text>
          </view>
          <text class="cal-date">{{ dayOfMonth(d.date) }}</text>
        </view>
      </view>
    </view>
    <!-- 防晒补涂提醒设置入口 -->
    <view class="card reminder-entry" @click="showReminder = true">
      <text>⏰ 防晒补涂提醒</text>
      <text class="arrow">›</text>
    </view>

    <ReminderSheet
      :visible="showReminder"
      type="uv_reapply"
      title="防晒补涂提醒"
      @close="showReminder = false"
      @saved="showReminder = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { getToday, submitCheckin, getStats, getCalendar } from '@/api/checkin';
import ReminderSheet from '@/components/ReminderSheet.vue';

const today = reactive<any>({ cleanse: false, moisturize: false, sunscreen: false });
const todayText = ref('');
const stats = reactive<any>({ streak: 0 });
const calendar = ref<any[]>([]);
const showReminder = ref(false);
const items = [
  { key: 'cleanse', label: '清洁', icon: '🧼' },
  { key: 'moisturize', label: '保湿', icon: '💧' },
  { key: 'sunscreen', label: '防晒', icon: '🌞' },
];

const doneCount = computed(() => items.filter((i) => today[i.key]).length);

const motivateText = computed(() => {
  const s = stats.streak || 0;
  if (s === 0) return '从今天开始，迈出第一步 🌱';
  if (s < 3) return '好习惯正在养成，继续加油 💪';
  if (s < 7) return `坚持就是胜利，你已连续 ${s} 天 🔥`;
  return '太棒了！护肤达人就是你 🏆';
});

function weekLabel(date: string) {
  const d = new Date(date);
  return '日一二三四五六'[d.getDay()];
}
function dayOfMonth(date: string) {
  return String(Number(date.slice(8, 10)));
}
function doneCountOf(d: any) {
  return (d.cleanse ? 1 : 0) + (d.moisturize ? 1 : 0) + (d.sunscreen ? 1 : 0);
}
function dotText(d: any) {
  const n = doneCountOf(d);
  return n === 3 ? '✓' : n > 0 ? '•' : '○';
}
function dotClass(d: any) {
  const n = doneCountOf(d);
  return n === 3 ? 'full' : n > 0 ? 'partial' : 'missed';
}

async function load() {
  try {
    const [todayData, statsData, calendarData] = await Promise.all([
      getToday(),
      getStats(),
      getCalendar(7),
    ]);
    today.cleanse = !!todayData.cleanse;
    today.moisturize = !!todayData.moisturize;
    today.sunscreen = !!todayData.sunscreen;
    todayText.value = todayData.date || '';
    stats.streak = statsData.streak || 0;
    calendar.value = calendarData || [];
  } catch (e) {
    /* ignore */
  }
}

async function toggle(key: string) {
  const next = !today[key];
  today[key] = next; // 乐观更新
  try {
    await submitCheckin({ type: key });
    uni.showToast({ title: next ? '打卡成功' : '已取消', icon: 'none' });
    load(); // 刷新周历/火焰
  } catch (e) {
    today[key] = !next;
  }
}

onMounted(load);
</script>

<style scoped>
.streak-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.streak-num {
  font-size: 80rpx;
  font-weight: 700;
  color: #f56c6c;
  line-height: 1;
}
.streak-title {
  font-size: 30rpx;
  font-weight: 600;
}
.streak-text {
  color: #999;
  font-size: 24rpx;
  margin-top: 8rpx;
}
.section-title {
  font-weight: 600;
  font-size: 30rpx;
  margin-bottom: 24rpx;
}
.checkin-grid {
  display: flex;
  gap: 20rpx;
}
.checkin-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 0;
  border: 2rpx solid #eee;
  border-radius: 16rpx;
}
.checkin-item.done {
  border-color: #f56c6c;
  background: #fef0f0;
}
.checkin-icon {
  font-size: 60rpx;
}
.checkin-text {
  font-size: 26rpx;
  color: #333;
}
.progress-tip {
  margin-top: 24rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
.calendar {
  display: flex;
  justify-content: space-between;
}
.cal-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.cal-col.today .cal-date {
  color: #f56c6c;
  font-weight: 700;
}
.cal-week {
  font-size: 22rpx;
  color: #999;
}
.cal-dot-wrap {
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cal-dot {
  font-size: 34rpx;
}
.cal-dot.full {
  color: #3bb877;
}
.cal-dot.partial {
  color: #e6a23c;
}
.cal-dot.missed {
  color: #ddd;
}
.cal-date {
  font-size: 24rpx;
  color: #666;
}
.reminder-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}
.reminder-entry .arrow {
  color: #ccc;
  font-size: 30rpx;
}
</style>
