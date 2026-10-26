<template>
  <view class="page">
    <!-- 开封有效期 -->
    <view class="card section-title">开封有效期</view>
    <view v-for="u in usages" :key="u.id" class="card usage-item" @click="openSet(u)">
      <view class="usage-head">
        <text class="usage-name">{{ u.product.name }}</text>
        <text class="days" :class="{ expired: u.expired }">
          {{ u.expired ? `已过期 ${Math.abs(u.daysLeft)} 天` : `剩余 ${u.daysLeft} 天` }}
        </text>
      </view>
      <text class="usage-meta">开封：{{ u.openedAt }} · 到期：{{ u.expireAt }} · {{ u.expireMonths }} 个月</text>
    </view>
    <view v-if="!usages.length" class="empty-tip">尚未设置开封日期，点击下方产品使用记录对应产品设置</view>

    <view class="card" v-if="expiring.length">
      <view class="section-title">即将到期</view>
      <view v-for="u in expiring" :key="u.id" class="expiring-item">
        <text>{{ u.product.name }}</text>
        <text class="days" :class="{ expired: u.expired }">{{ u.daysLeft }} 天</text>
      </view>
    </view>

    <!-- 使用记录时间轴 -->
    <view class="card">
      <view class="section-title">使用记录</view>
      <view class="log-input">
        <input v-model="logForm.note" class="input" placeholder="记录备注（可选）" />
        <view class="log-btns">
          <button class="btn-ghost" size="mini" @click="addLog('start')">开始使用</button>
          <button class="btn-ghost" size="mini" @click="addLog('note')">记录</button>
        </view>
      </view>
      <view v-for="l in logs" :key="l.id" class="log-item">
        <text class="log-action">{{ actionText(l.action) }}</text>
        <text class="log-note">{{ l.note || l.productName }}</text>
        <text class="log-time">{{ (l.createdAt || '').slice(0, 10) }}</text>
      </view>
      <view v-if="!logs.length" class="empty-tip">暂无使用记录</view>
    </view>

    <!-- 设置开封弹层 -->
    <view v-if="showSet" class="mask" @click="showSet = false">
      <view class="sheet" @click.stop>
        <view class="sheet-title">设置开封日期</view>
        <picker mode="date" :value="setForm.openedAt" @change="onDate">
          <view class="picker">{{ setForm.openedAt || '选择开封日期' }}</view>
        </picker>
        <view class="month-row">
          <text v-for="m in [6, 12, 24]" :key="m" class="month" :class="{ active: setForm.expireMonths === m }" @click="setForm.expireMonths = m">{{ m }} 个月</text>
        </view>
        <button class="btn-primary" @click="saveUsage">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { listProductUsages, listExpiringUsages, setProductUsage, listUsageLogs, createUsageLog, listMyProducts } from '@/api/product';

const usages = ref<any[]>([]);
const expiring = ref<any[]>([]);
const logs = ref<any[]>([]);
const showSet = ref(false);
const currentProductId = ref<number | null>(null);
const setForm = reactive<any>({ openedAt: '', expireMonths: 12 });
const logForm = reactive({ note: '' });

function actionText(a: string) {
  return { start: '开始使用', stop: '停用', note: '记录' }[a] || a;
}

function onDate(e: any) {
  setForm.openedAt = e.detail.value;
}

function openSet(u: any) {
  currentProductId.value = u.productId;
  setForm.openedAt = u.openedAt || '';
  setForm.expireMonths = u.expireMonths || 12;
  showSet.value = true;
}

async function saveUsage() {
  if (!currentProductId.value || !setForm.openedAt) {
    return uni.showToast({ title: '请选择开封日期', icon: 'none' });
  }
  try {
    await setProductUsage({ productId: currentProductId.value, openedAt: setForm.openedAt, expireMonths: setForm.expireMonths });
    uni.showToast({ title: '已保存', icon: 'success' });
    showSet.value = false;
    load();
  } catch (e) {
    /* ignore */
  }
}

async function addLog(action: string) {
  // 使用最近一个产品（简化：取第一个产品柜产品）
  const products = await listMyProducts();
  const p = products && products[0];
  if (!p) return uni.showToast({ title: '请先添加产品', icon: 'none' });
  try {
    await createUsageLog({ productId: p.productId, action, note: logForm.note });
    logForm.note = '';
    uni.showToast({ title: '已记录', icon: 'success' });
    load();
  } catch (e) {
    /* ignore */
  }
}

async function load() {
  try {
    usages.value = await listProductUsages();
  } catch (e) {
    /* ignore */
  }
  try {
    expiring.value = await listExpiringUsages();
  } catch (e) {
    /* ignore */
  }
  try {
    logs.value = await listUsageLogs();
  } catch (e) {
    /* ignore */
  }
}

onMounted(load);
</script>

<style scoped>
.section-title {
  font-weight: 600;
  font-size: 28rpx;
  margin-bottom: 16rpx;
}
.usage-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.usage-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.usage-name {
  font-size: 28rpx;
  font-weight: 600;
}
.days {
  font-size: 24rpx;
  color: #3bb877;
}
.days.expired {
  color: #f56c6c;
}
.usage-meta {
  color: #999;
  font-size: 22rpx;
}
.expiring-item {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  font-size: 26rpx;
}
.log-input {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.input {
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
}
.log-btns {
  display: flex;
  gap: 16rpx;
}
.btn-ghost {
  background: #fff;
  color: #f56c6c;
  border: 2rpx solid #fce8ee;
  border-radius: 40rpx;
}
.log-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  font-size: 24rpx;
}
.log-action {
  color: #4a7fe0;
  font-weight: 600;
  flex-shrink: 0;
}
.log-note {
  flex: 1;
  color: #666;
}
.log-time {
  color: #bbb;
  font-size: 20rpx;
}
.empty-tip {
  color: #bbb;
  font-size: 24rpx;
  padding: 20rpx 0;
  text-align: center;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
}
.sheet-title {
  font-weight: 600;
  font-size: 30rpx;
  margin-bottom: 20rpx;
  text-align: center;
}
.picker {
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  padding: 20rpx;
  text-align: center;
  font-size: 26rpx;
  margin-bottom: 20rpx;
}
.month-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.month {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #666;
}
.month.active {
  border-color: #f56c6c;
  color: #f56c6c;
  background: #fef0f0;
}
</style>
