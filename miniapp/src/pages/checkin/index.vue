<template>
  <view class="page">
    <view class="card">
      <view class="section-title">今日打卡（{{ todayText }}）</view>
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
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { getToday, submitCheckin } from '@/api/checkin';

const today = reactive<any>({ cleanse: false, moisturize: false, sunscreen: false });
const todayText = ref('');
const items = [
  { key: 'cleanse', label: '清洁', icon: '🧼' },
  { key: 'moisturize', label: '保湿', icon: '💧' },
  { key: 'sunscreen', label: '防晒', icon: '🌞' },
];

const doneCount = computed(() => items.filter((i) => today[i.key]).length);

async function load() {
  try {
    const data = await getToday();
    today.cleanse = !!data.cleanse;
    today.moisturize = !!data.moisturize;
    today.sunscreen = !!data.sunscreen;
    todayText.value = data.date || '';
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
  } catch (e) {
    today[key] = !next;
  }
}

onMounted(load);
</script>

<style scoped>
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
</style>
