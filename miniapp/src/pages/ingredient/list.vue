<template>
  <view class="page">
    <view class="search-bar card">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索成分，如 烟酰胺 / 透明质酸"
        confirm-type="search"
        @confirm="search"
      />
      <button class="btn-primary search-btn" size="mini" @click="search">搜索</button>
    </view>

    <view v-for="ing in list" :key="ing.id" class="card ing-card" @click="go(ing.id)">
      <view class="ing-head">
        <text class="ing-name">{{ ing.name }}</text>
        <text class="risk" :class="'r-' + ing.riskLevel">{{ ing.riskLevel }}风险</text>
      </view>
      <view class="ing-funcs">
        <text v-for="f in ing.functions" :key="f" class="func-tag">{{ f }}</text>
      </view>
      <text class="ing-efficacy">{{ ing.efficacy }}</text>
    </view>

    <view v-if="!list.length" class="empty">暂无匹配成分</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listIngredients } from '@/api/ingredient';

const list = ref<any[]>([]);
const keyword = ref('');

function go(id: number) {
  uni.navigateTo({ url: '/pages/ingredient/detail?id=' + id });
}

async function search() {
  try {
    const data = await listIngredients(keyword.value, 1, 30);
    list.value = data.list || [];
  } catch (e) {
    /* ignore */
  }
}

onMounted(search);
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
.ing-card {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.ing-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ing-name {
  font-size: 30rpx;
  font-weight: 600;
}
.risk {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
.r-低 { background: #e8f8ef; color: #3bb877; }
.r-中 { background: #fff7e6; color: #e6a23c; }
.r-高 { background: #fdeaea; color: #f56c6c; }
.ing-funcs {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}
.func-tag {
  font-size: 22rpx;
  color: #4a7fe0;
  background: #eef4ff;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}
.ing-efficacy {
  color: #777;
  font-size: 24rpx;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
}
</style>
