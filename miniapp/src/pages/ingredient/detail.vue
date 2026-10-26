<template>
  <view class="page">
    <view class="card" v-if="ing">
      <view class="head">
        <text class="name">{{ ing.name }}</text>
        <text class="en-name">{{ ing.enName }}</text>
      </view>

      <view class="tags">
        <text class="risk" :class="{ 'r-low': ing.riskLevel === '低', 'r-mid': ing.riskLevel === '中', 'r-high': ing.riskLevel === '高' }">{{ ing.riskLevel }}风险</text>
        <text v-for="f in ing.functions" :key="f" class="func-tag">{{ f }}</text>
      </view>

      <view class="section" v-if="ing.aliases && ing.aliases.length">
        <view class="section-title">别名</view>
        <text class="text">{{ ing.aliases.join('、') }}</text>
      </view>

      <view class="section">
        <view class="section-title">功效说明</view>
        <text class="text">{{ ing.efficacy }}</text>
      </view>

      <view class="section">
        <view class="section-title">适用肤质</view>
        <view class="tags">
          <text v-for="s in ing.suitableSkin" :key="s" class="skin-tag">{{ s }}</text>
        </view>
      </view>

      <view class="section" v-if="ing.taboo">
        <view class="section-title">禁忌/注意</view>
        <text class="text warn">{{ ing.taboo }}</text>
      </view>

      <view class="section" v-if="ing.description">
        <view class="section-title">白话解读</view>
        <text class="text">{{ ing.description }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getIngredient } from '@/api/ingredient';

const ing = ref<any>(null);
let id = 0;

onLoad((query: any) => {
  id = Number(query.id);
});

onMounted(async () => {
  try {
    ing.value = await getIngredient(id);
  } catch (e) {
    /* ignore */
  }
});
</script>

<style scoped>
.head {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}
.name {
  font-size: 40rpx;
  font-weight: 700;
}
.en-name {
  color: #999;
  font-size: 24rpx;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin: 16rpx 0;
}
.risk {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
.r-low { background: #e8f8ef; color: #3bb877; }
.r-mid { background: #fff7e6; color: #e6a23c; }
.r-high { background: #fdeaea; color: #f56c6c; }
.func-tag {
  font-size: 22rpx;
  color: #4a7fe0;
  background: #eef4ff;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}
.skin-tag {
  font-size: 22rpx;
  color: #f56c6c;
  background: #fef0f0;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}
.section {
  margin-top: 24rpx;
}
.section-title {
  font-weight: 600;
  font-size: 26rpx;
  margin-bottom: 10rpx;
  color: #333;
}
.text {
  color: #666;
  font-size: 26rpx;
  line-height: 1.7;
}
.warn {
  color: #b88230;
}
</style>
