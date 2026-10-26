<template>
  <view class="page">
    <view class="header card">
      <view class="header-title">我的徽章</view>
      <view class="header-sub">已解锁 {{ earnedCount }} / {{ badges.length }} 枚</view>
    </view>

    <view class="badge-grid">
      <view v-for="b in badges" :key="b.code" class="badge card" :class="{ earned: b.earned }">
        <text class="badge-icon">{{ b.icon }}</text>
        <text class="badge-name">{{ b.name }}</text>
        <text class="badge-desc">{{ b.desc }}</text>
        <text class="badge-progress">{{ b.progress }}</text>
      </view>
    </view>

    <view v-if="!badges.length" class="empty">暂无徽章</view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getBadges, type Badge } from '@/api/badge';

const badges = ref<Badge[]>([]);

const earnedCount = computed(() => badges.value.filter((b) => b.earned).length);

onMounted(async () => {
  try {
    badges.value = await getBadges();
  } catch (e) {
    /* ignore */
  }
});
</script>

<style scoped>
.header {
  text-align: center;
}
.header-title {
  font-size: 34rpx;
  font-weight: 700;
}
.header-sub {
  color: #999;
  font-size: 24rpx;
  margin-top: 8rpx;
}
.badge-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 8rpx;
}
.badge {
  width: 44%;
  margin: 12rpx 3%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  opacity: 0.45;
}
.badge.earned {
  opacity: 1;
}
.badge-icon {
  font-size: 72rpx;
}
.badge-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}
.badge-desc {
  font-size: 22rpx;
  color: #999;
  text-align: center;
}
.badge-progress {
  font-size: 22rpx;
  color: #f56c6c;
  font-weight: 600;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
}
</style>
