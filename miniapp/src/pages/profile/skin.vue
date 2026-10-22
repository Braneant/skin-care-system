<template>
  <view class="page">
    <view class="card">
      <view class="section-title">我的肌肤档案</view>
      <view v-if="profile">
        <view class="row"><text class="label">肤质类型</text><text class="value">{{ profile.skinType || '-' }}</text></view>
        <view class="row"><text class="label">敏感度</text><text class="value">{{ profile.sensitivity }} / 3</text></view>
        <view class="row"><text class="label">自评问题</text><text class="value">{{ (profile.concerns || []).join('、') || '-' }}</text></view>
        <view class="row"><text class="label">生活习惯</text><text class="value">{{ habitText }}</text></view>
        <view class="row"><text class="label">更新时间</text><text class="value">{{ profile.updatedAt || '-' }}</text></view>
        <button class="btn-primary" style="margin-top: 24rpx" @click="goSurvey">重新填写问卷</button>
      </view>
      <view v-else class="empty">
        <text>还没有档案，请先完成肤质问卷</text>
        <button class="btn-primary" style="margin-top: 24rpx" @click="goSurvey">去填写问卷</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getProfile } from '@/api/skin';

const profile = ref<any>(null);

const habitText = computed(() => {
  const h = profile.value?.habits;
  if (!h) return '-';
  const labels: Record<string, string> = {
    sleepLate: '熬夜',
    spicy: '辛辣高糖',
    sunscreen: '防晒',
    smoke: '吸烟',
  };
  const arr = Object.keys(h).filter((k) => h[k]).map((k) => labels[k] || k);
  return arr.length ? arr.join('、') : '-';
});

function goSurvey() {
  uni.navigateTo({ url: '/pages/survey/index' });
}

onMounted(async () => {
  try {
    profile.value = await getProfile();
  } catch (e) {
    /* ignore */
  }
});
</script>

<style scoped>
.section-title {
  font-weight: 600;
  font-size: 30rpx;
  margin-bottom: 20rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  font-size: 26rpx;
}
.label {
  color: #999;
}
.value {
  color: #333;
  max-width: 60%;
  text-align: right;
}
.empty {
  text-align: center;
  color: #999;
  padding: 40rpx 0;
}
</style>
