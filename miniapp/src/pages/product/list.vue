<template>
  <view class="page">
    <view class="search-bar card">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索产品名称/品牌"
        confirm-type="search"
        @confirm="load"
      />
      <button class="btn-primary search-btn" size="mini" @click="load">搜索</button>
    </view>

    <view v-for="p in list" :key="p.id" class="card product-card" @click="go(p.id)">
      <view class="prod-head">
        <view class="prod-meta">
          <text class="prod-name">{{ p.name }}</text>
          <text class="prod-brand">{{ p.brand }} · {{ p.category }}</text>
        </view>
        <view class="match">
          <text class="match-num">{{ p.matchScore }}</text>
          <text class="match-label">匹配度</text>
        </view>
      </view>
      <text class="prod-desc">{{ p.description }}</text>
    </view>

    <view v-if="!list.length" class="empty">暂无产品</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listProducts } from '@/api/product';

const list = ref<any[]>([]);
const keyword = ref('');

function go(id: number) {
  uni.navigateTo({ url: '/pages/product/detail?id=' + id });
}

async function load() {
  try {
    list.value = await listProducts(keyword.value, '');
  } catch (e) {
    /* ignore */
  }
}

onMounted(load);
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.search-input {
  flex: 1;
  border: 2rpx solid #eee;
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
  font-size: 26rpx;
}
.search-btn {
  margin: 0;
}
.product-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.prod-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.prod-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.prod-name {
  font-size: 30rpx;
  font-weight: 600;
}
.prod-brand {
  color: #999;
  font-size: 22rpx;
}
.match {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90rpx;
}
.match-num {
  font-size: 44rpx;
  font-weight: 700;
  color: #f56c6c;
  line-height: 1;
}
.match-label {
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
}
.prod-desc {
  color: #777;
  font-size: 24rpx;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
}
</style>
