<template>
  <view class="ring" :style="ringStyle">
    <view class="ring-inner">
      <text class="ring-value">{{ percent }}%</text>
      <text class="ring-label">{{ label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  rate: number; // 0~1
  size?: number; // rpx
  label?: string;
  color?: string;
}>();

const size = computed(() => props.size || 140);
const color = computed(() => props.color || '#f56c6c');
const percent = computed(() => Math.round(Math.max(0, Math.min(1, props.rate || 0)) * 100));
const deg = computed(() => Math.round((percent.value / 100) * 360));

const ringStyle = computed(() => ({
  width: `${size.value}rpx`,
  height: `${size.value}rpx`,
  background: `conic-gradient(${color.value} ${deg.value}deg, #f0f0f0 ${deg.value}deg)`,
}));
</script>

<style scoped>
.ring {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ring-inner {
  width: 78%;
  height: 78%;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ring-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #f56c6c;
}
.ring-label {
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
}
</style>
