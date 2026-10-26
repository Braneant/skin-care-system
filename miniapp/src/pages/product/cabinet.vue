<template>
  <view class="page">
    <view class="toolbar card">
      <text class="tip">管理你在用的护肤产品</text>
      <button class="btn-primary" size="mini" @click="goAdd">添加产品</button>
    </view>

    <view v-for="item in list" :key="item.id" class="card cabinet-item">
      <view class="item-head">
        <view class="item-meta">
          <text class="item-name">{{ item.product.name }}</text>
          <text class="item-brand">{{ item.product.brand }} · {{ item.product.category }}</text>
          <text class="item-score" v-if="item.matchedScore != null">匹配度 {{ item.matchedScore }}</text>
        </view>
        <view class="status" :class="'s-' + item.status">{{ statusText(item.status) }}</view>
      </view>
      <view class="item-actions">
        <text
          v-for="s in ['using', 'stopped', 'wish']"
          :key="s"
          class="status-btn"
          :class="{ active: item.status === s }"
          @click="changeStatus(item, s)"
        >{{ statusText(s) }}</text>
        <text class="remove-btn" @click="remove(item)">移除</text>
      </view>
    </view>

    <view v-if="!list.length" class="empty">产品柜还是空的，去添加吧</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listMyProducts, updateMyProduct, removeMyProduct } from '@/api/product';

const list = ref<any[]>([]);

function statusText(s: string) {
  return { using: '在用', stopped: '停用', wish: '想用' }[s] || s;
}

function goAdd() {
  uni.navigateTo({ url: '/pages/product/list' });
}

async function load() {
  try {
    list.value = await listMyProducts();
  } catch (e) {
    /* ignore */
  }
}

async function changeStatus(item: any, status: string) {
  if (item.status === status) return;
  try {
    await updateMyProduct(item.productId, status);
    load();
  } catch (e) {
    /* ignore */
  }
}

async function remove(item: any) {
  const res = await new Promise((resolve) =>
    uni.showModal({ title: '移除产品', content: `确认移除「${item.product.name}」？`, success: resolve })
  );
  if (!(res as any).confirm) return;
  try {
    await removeMyProduct(item.id);
    uni.showToast({ title: '已移除', icon: 'none' });
    load();
  } catch (e) {
    /* ignore */
  }
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tip {
  color: #999;
  font-size: 24rpx;
}
.cabinet-item {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.item-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.item-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.item-name {
  font-size: 30rpx;
  font-weight: 600;
}
.item-brand {
  color: #999;
  font-size: 22rpx;
}
.item-score {
  color: #f56c6c;
  font-size: 22rpx;
}
.status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
.s-using { background: #e8f8ef; color: #3bb877; }
.s-stopped { background: #f0f0f0; color: #999; }
.s-wish { background: #fff7e6; color: #e6a23c; }
.item-actions {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.status-btn {
  font-size: 24rpx;
  color: #999;
  padding: 8rpx 20rpx;
  border: 2rpx solid #eee;
  border-radius: 28rpx;
}
.status-btn.active {
  color: #f56c6c;
  border-color: #f56c6c;
  background: #fef0f0;
}
.remove-btn {
  margin-left: auto;
  font-size: 24rpx;
  color: #f56c6c;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
}
</style>
