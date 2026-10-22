<template>
  <view class="page">
    <template v-if="plan">
      <view class="card hero">
        <view class="plan-title">{{ plan.title }}</view>
      </view>

      <view class="card">
        <view class="section-title">☀️ 晨间护理</view>
        <view v-for="(s, i) in plan.routineMorning" :key="'m' + i" class="step">
          <text class="step-index">{{ i + 1 }}</text>
          <view class="step-body">
            <text class="step-name">{{ s.step }}</text>
            <text class="step-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="section-title">🌙 晚间护理</view>
        <view v-for="(s, i) in plan.routineEvening" :key="'e' + i" class="step">
          <text class="step-index">{{ i + 1 }}</text>
          <view class="step-body">
            <text class="step-name">{{ s.step }}</text>
            <text class="step-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="section-title">🧪 成分建议</view>
        <view v-for="(it, i) in plan.ingredients" :key="i" class="ingredient">
          <text class="ing-name">{{ it.name }}</text>
          <text class="ing-note">{{ it.note }}</text>
        </view>
      </view>

      <view class="card">
        <view class="section-title">⚠️ 禁忌事项</view>
        <view v-for="(t, i) in plan.taboos" :key="i" class="taboo">· {{ t }}</view>
      </view>
    </template>

    <view v-else class="empty card">
      <text>暂无护肤方案</text>
      <text class="text-muted">完成一次 AI 测肤后自动生成个性化方案</text>
      <button class="btn-primary" style="margin-top: 24rpx" @click="goDetect">去测肤</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getPlan } from '@/api/plan';

const plan = ref<any>(null);

function goDetect() {
  uni.navigateTo({ url: '/pages/detect/upload' });
}

onMounted(async () => {
  try {
    plan.value = await getPlan();
  } catch (e) {
    /* ignore */
  }
});
</script>

<style scoped>
.plan-title {
  font-size: 32rpx;
  font-weight: 700;
}
.section-title {
  font-weight: 600;
  font-size: 28rpx;
  margin-bottom: 16rpx;
}
.step {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.step-index {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #fce8ee;
  color: #f56c6c;
  text-align: center;
  line-height: 40rpx;
  font-size: 24rpx;
}
.step-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.step-name {
  font-weight: 600;
  font-size: 26rpx;
}
.step-desc {
  color: #777;
  font-size: 24rpx;
  margin-top: 4rpx;
}
.ingredient {
  display: flex;
  flex-direction: column;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.ing-name {
  font-weight: 600;
  font-size: 26rpx;
  color: #333;
}
.ing-note {
  color: #888;
  font-size: 24rpx;
  margin-top: 4rpx;
}
.taboo {
  padding: 8rpx 0;
  color: #666;
  font-size: 26rpx;
}
.empty {
  text-align: center;
  color: #999;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
</style>
