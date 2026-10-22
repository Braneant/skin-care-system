<template>
  <view class="page">
    <view class="card">
      <view class="step-indicator">
        <text v-for="i in 4" :key="i" class="dot" :class="{ active: step >= i }"></text>
      </view>

      <!-- 第 1 步：肤质类型 -->
      <view v-if="step === 1">
        <view class="q-title">你的肤质类型是？</view>
        <view v-for="opt in skinTypes" :key="opt" class="option" :class="{ selected: form.skinType === opt }" @click="form.skinType = opt">{{ opt }}</view>
      </view>

      <!-- 第 2 步：敏感度 -->
      <view v-else-if="step === 2">
        <view class="q-title">你的皮肤敏感程度？</view>
        <view v-for="(label, idx) in sensitivityLabels" :key="idx" class="option" :class="{ selected: form.sensitivity === idx }" @click="form.sensitivity = idx">{{ label }}</view>
      </view>

      <!-- 第 3 步：问题自评 -->
      <view v-else-if="step === 3">
        <view class="q-title">你存在哪些肌肤问题？（可多选）</view>
        <view v-for="opt in concernsOptions" :key="opt" class="option" :class="{ selected: form.concerns.includes(opt) }" @click="toggleConcern(opt)">{{ opt }}</view>
      </view>

      <!-- 第 4 步：生活习惯 -->
      <view v-else>
        <view class="q-title">你的生活习惯（可多选）</view>
        <view v-for="h in habitOptions" :key="h.key" class="option" :class="{ selected: form.habits[h.key] }" @click="form.habits[h.key] = !form.habits[h.key]">{{ h.label }}</view>
      </view>

      <view class="nav">
        <button v-if="step > 1" class="btn-ghost" @click="step--">上一步</button>
        <button v-if="step < 4" class="btn-primary" @click="next">下一步</button>
        <button v-else class="btn-primary" :loading="saving" @click="submit">提交问卷</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { submitSurvey } from '@/api/skin';

const step = ref(1);
const saving = ref(false);
const skinTypes = ['干性', '油性', '混合性', '中性', '敏感性'];
const sensitivityLabels = ['不敏感', '轻度敏感', '中度敏感', '高度敏感'];
const concernsOptions = ['痘痘', '黑头', '皱纹', '色斑', '毛孔', '暗沉', '敏感'];
const habitOptions = [
  { key: 'sleepLate', label: '经常熬夜' },
  { key: 'spicy', label: '偏好辛辣/高糖饮食' },
  { key: 'sunscreen', label: '坚持防晒' },
  { key: 'smoke', label: '吸烟' },
];

const form = reactive<any>({
  skinType: '',
  sensitivity: 0,
  concerns: [] as string[],
  habits: {} as Record<string, boolean>,
});

function next() {
  if (step.value === 1 && !form.skinType) return uni.showToast({ title: '请选择肤质', icon: 'none' });
  step.value++;
}

function toggleConcern(opt: string) {
  const i = form.concerns.indexOf(opt);
  if (i >= 0) form.concerns.splice(i, 1);
  else form.concerns.push(opt);
}

async function submit() {
  saving.value = true;
  try {
    await submitSurvey({
      skinType: form.skinType,
      sensitivity: form.sensitivity,
      concerns: form.concerns,
      habits: form.habits,
    });
    uni.showToast({ title: '建档成功', icon: 'success' });
    setTimeout(() => uni.navigateTo({ url: '/pages/profile/skin' }), 600);
  } catch (e) {
    /* ignore */
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.step-indicator {
  display: flex;
  gap: 12rpx;
  justify-content: center;
  margin-bottom: 32rpx;
}
.dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #eee;
}
.dot.active {
  background: #f56c6c;
}
.q-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}
.option {
  padding: 24rpx;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  font-size: 28rpx;
}
.option.selected {
  border-color: #f56c6c;
  color: #f56c6c;
  background: #fef0f0;
}
.nav {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}
.nav button {
  flex: 1;
}
.btn-ghost {
  background: #fff;
  color: #666;
  border: 2rpx solid #eee;
  border-radius: 44rpx;
}
</style>
