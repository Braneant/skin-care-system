<template>
  <view class="page">
    <view class="card">
      <view class="section-title">肌肤趋势（近 30 天）</view>
      <view v-if="trend.length" class="chart">
        <view v-for="(t, i) in trend" :key="i" class="bar-col">
          <view class="bar-wrap">
            <view class="bar" :style="{ height: (t.score || 0) + '%' }"></view>
          </view>
          <text class="bar-value">{{ t.score }}</text>
          <text class="bar-date">{{ t.date.slice(5) }}</text>
        </view>
      </view>
      <view v-else class="empty">暂无趋势数据，请先完成检测</view>
    </view>

    <view class="card" v-if="trend.length">
      <view class="section-title">最新指标</view>
      <view class="metric-row">
        <view class="metric"><text class="metric-value">{{ latest.score ?? '-' }}</text><text class="metric-label">得分</text></view>
        <view class="metric"><text class="metric-value">{{ latest.oil ?? '-' }}</text><text class="metric-label">油脂</text></view>
        <view class="metric"><text class="metric-value">{{ latest.water ?? '-' }}</text><text class="metric-label">水分</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getTrend } from '@/api/detect';

const trend = ref<any[]>([]);
const latest = computed(() => (trend.value.length ? trend.value[trend.value.length - 1] : {}));

onMounted(async () => {
  try {
    trend.value = await getTrend(30);
  } catch (e) {
    /* ignore */
  }
});
</script>

<style scoped>
.section-title {
  font-weight: 600;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 6rpx;
  height: 320rpx;
  overflow-x: auto;
}
.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 40rpx;
}
.bar-wrap {
  height: 240rpx;
  width: 28rpx;
  display: flex;
  align-items: flex-end;
  background: #f7f7f7;
  border-radius: 8rpx;
  overflow: hidden;
}
.bar {
  width: 100%;
  background: linear-gradient(180deg, #f9a8a8, #f56c6c);
  border-radius: 8rpx;
}
.bar-value {
  font-size: 20rpx;
  color: #666;
  margin-top: 4rpx;
}
.bar-date {
  font-size: 18rpx;
  color: #bbb;
  margin-top: 2rpx;
}
.empty {
  text-align: center;
  color: #999;
  padding: 40rpx 0;
}
.metric-row {
  display: flex;
  gap: 20rpx;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  background: #fafafa;
  border-radius: 12rpx;
}
.metric-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #f56c6c;
}
.metric-label {
  color: #999;
  font-size: 24rpx;
  margin-top: 6rpx;
}
</style>
