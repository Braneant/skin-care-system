<template>
  <view class="page">
    <view v-for="g in groups" :key="g.date" class="group">
      <view class="date-badge">{{ g.date }}</view>
      <view v-for="it in g.items" :key="it.type + it.id" class="card item">
        <template v-if="it.type === 'detect'">
          <view class="item-head">
            <text class="tag tag-detect">检测报告</text>
            <text class="score">得分 {{ it.score }} · {{ it.riskLevel }}</text>
          </view>
          <text class="skin">肤质：{{ it.skinType }}</text>
          <view v-if="it.issues && it.issues.length" class="issues">
            <text v-for="(x, i) in it.issues" :key="i" class="issue-tag">{{ x.type }}</text>
          </view>
        </template>
        <template v-else>
          <view class="item-head">
            <text class="tag tag-advice">医生建议</text>
            <text class="doctor">{{ it.doctorName || '医生' }}</text>
          </view>
          <text class="advice-content">{{ it.content }}</text>
        </template>
      </view>
    </view>
    <view v-if="!groups.length" class="empty">暂无报告记录</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listReports } from '@/api/followup';

const groups = ref<any[]>([]);

onMounted(async () => {
  try {
    groups.value = await listReports();
  } catch (e) {
    /* ignore */
  }
});
</script>

<style scoped>
.group {
  margin: 20rpx 0;
}
.date-badge {
  text-align: center;
  color: #999;
  font-size: 22rpx;
  margin-bottom: 12rpx;
}
.item {
  margin-bottom: 16rpx;
}
.item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}
.tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
.tag-detect {
  background: #eef4ff;
  color: #4a7fe0;
}
.tag-advice {
  background: #e8f8ef;
  color: #3bb877;
}
.score {
  font-size: 26rpx;
  color: #f56c6c;
  font-weight: 600;
}
.skin {
  font-size: 26rpx;
  color: #333;
}
.issues {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 10rpx;
}
.issue-tag {
  font-size: 22rpx;
  color: #666;
  background: #f5f5f5;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}
.doctor {
  font-size: 24rpx;
  color: #999;
}
.advice-content {
  font-size: 26rpx;
  color: #444;
  line-height: 1.7;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
}
</style>
