<template>
  <view class="ring" :style="ringStyle">
    <view class="ring-inner">
      <text class="ring-value" :style="{ fontSize: valueSize }">{{ percent }}%</text>
      <text class="ring-label" :style="{ fontSize: labelSize }">{{ label }}</text>
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

// 字号随圈径等比缩放，保证不同 size 下数字/标签与圆环比例协调、不溢出
const valueSize = computed(() => `${Math.round(size.value * 0.24)}rpx`);
const labelSize = computed(() => `${Math.round(size.value * 0.125)}rpx`);

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
  /* 关键：不允许被 flex 容器压缩，否则尺寸变小而文字不变→溢出 */
  flex-shrink: 0;
  box-sizing: border-box;
  overflow: hidden;
}
.ring-inner {
  width: 80%;
  height: 80%;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ring-value {
  font-weight: 700;
  color: #f56c6c;
  line-height: 1.1;
  white-space: nowrap;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ring-label {
  color: #999;
  line-height: 1.1;
  white-space: nowrap;
  margin-top: 2rpx;
  max-width: 88%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
