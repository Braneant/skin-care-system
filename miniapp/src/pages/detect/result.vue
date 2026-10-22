<template>
  <view class="page">
    <view v-if="report" class="card">
      <view class="score-box">
        <view class="score-number">{{ report.score }}</view>
        <view class="score-label">综合肌肤得分</view>
        <view class="risk" :class="'risk-' + riskClass">{{ report.riskLevel }}</view>
      </view>

      <view v-if="report.degraded" class="degrade-tip">本次检测由本地引擎完成（AI 服务降级），结果仅供参考</view>

      <view class="section">
        <view class="section-title">检测结果</view>
        <view class="row"><text class="label">肤质类型</text><text class="value">{{ report.skinType }}</text></view>
        <view class="row"><text class="label">分析引擎</text><text class="value">{{ report.engine === 'deepseek' ? 'DeepSeek AI' : '本地引擎' }}</text></view>
      </view>

      <view class="section">
        <view class="section-title">四维评分</view>
        <view v-for="d in dimensions" :key="d.key" class="dim-row">
          <text class="dim-name">{{ d.name }}</text>
          <view class="dim-bar"><view class="dim-fill" :style="{ width: d.value + '%' }"></view></view>
          <text class="dim-value">{{ d.value }}</text>
        </view>
      </view>

      <view class="section" v-if="report.issues && report.issues.length">
        <view class="section-title">肌肤问题</view>
        <view v-for="(it, i) in report.issues" :key="i" class="issue">
          <text class="issue-tag">{{ it.type }} · {{ it.level }}</text>
          <text class="issue-desc">{{ it.location }} {{ it.description }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">分析报告</view>
        <text class="analysis">{{ report.analysis }}</text>
      </view>

      <view class="section" v-if="report.suggestions && report.suggestions.length">
        <view class="section-title">护肤建议</view>
        <view v-for="(s, i) in report.suggestions" :key="i" class="suggestion">· {{ s }}</view>
      </view>

      <button class="btn-primary" style="margin-top: 24rpx" @click="goPlan">查看个性化方案</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getDetectDetail } from '@/api/detect';

const report = ref<any>(null);

const dimensions = computed(() => {
  const dim = report.value?.dimensions || {};
  return [
    { key: 'color', name: '肤色', value: dim.color ?? 0 },
    { key: 'oilDry', name: '水油平衡', value: dim.oilDry ?? 0 },
    { key: 'acne', name: '痤疮情况', value: dim.acne ?? 0 },
    { key: 'smoothness', name: '平滑度', value: dim.smoothness ?? 0 },
  ];
});

const riskClass = computed(() => {
  const r = report.value?.riskLevel;
  if (r === '良好') return 'good';
  if (r === '一般') return 'normal';
  if (r === '需关注') return 'attention';
  return 'high';
});

function goPlan() {
  uni.switchTab({ url: '/pages/plan/index' });
}

onMounted(async () => {
  const cached = uni.getStorageSync('detect_result');
  if (cached) {
    report.value = cached;
    return;
  }
  // 从详情接口恢复（若直接进入）
  // 通过 query id 获取
});
</script>

<style scoped>
.score-box {
  text-align: center;
  padding: 20rpx 0;
}
.score-number {
  font-size: 100rpx;
  font-weight: 700;
  color: #f56c6c;
  line-height: 1;
}
.score-label {
  color: #999;
  font-size: 24rpx;
  margin-top: 8rpx;
}
.risk {
  display: inline-block;
  margin-top: 12rpx;
  padding: 6rpx 24rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
}
.risk-good { background: #e8f8ef; color: #3bb877; }
.risk-normal { background: #eef4ff; color: #4a7fe0; }
.risk-attention { background: #fff7e6; color: #e6a23c; }
.risk-high { background: #fdeaea; color: #f56c6c; }
.degrade-tip {
  margin-top: 16rpx;
  padding: 12rpx;
  background: #fff7e6;
  color: #b88230;
  font-size: 24rpx;
  border-radius: 8rpx;
  text-align: center;
}
.section {
  margin-top: 28rpx;
}
.section-title {
  font-weight: 600;
  font-size: 28rpx;
  margin-bottom: 16rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  font-size: 26rpx;
}
.label { color: #999; }
.value { color: #333; }
.dim-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 14rpx;
}
.dim-name { width: 140rpx; font-size: 24rpx; color: #666; }
.dim-bar {
  flex: 1;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}
.dim-fill {
  height: 100%;
  background: linear-gradient(90deg, #f9a8a8, #f56c6c);
  border-radius: 8rpx;
}
.dim-value { width: 60rpx; text-align: right; font-size: 24rpx; color: #333; }
.issue {
  padding: 16rpx;
  background: #fafafa;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}
.issue-tag {
  color: #f56c6c;
  font-size: 26rpx;
  font-weight: 600;
  margin-right: 12rpx;
}
.issue-desc { color: #666; font-size: 24rpx; }
.analysis { color: #444; font-size: 26rpx; line-height: 1.7; }
.suggestion { padding: 8rpx 0; color: #555; font-size: 26rpx; }
</style>
