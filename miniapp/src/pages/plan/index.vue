<template>
  <view class="page">
    <template v-if="plan">
      <view class="card hero">
        <view class="plan-title">{{ plan.title }}</view>
        <view class="progress-row" v-if="plan.stepProgress && plan.stepProgress.total > 0">
          <text class="progress-text">今日方案完成 {{ plan.stepProgress.done }}/{{ plan.stepProgress.total }} 步</text>
        </view>
        <view class="progress-bar" v-if="plan.stepProgress && plan.stepProgress.total > 0">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
      </view>

      <!-- 早晚差异提示 -->
      <view class="card time-hint">
        <text class="time-hint-text">{{ isMorning ? '☀️ 现在是白天，重点执行「晨间护理」' : '🌙 现在是晚间，重点执行「晚间护理」' }}</text>
      </view>

      <view class="card">
        <view class="section-title">☀️ 晨间护理</view>
        <view v-for="(s, i) in plan.routineMorning" :key="'m' + i" class="step">
          <text class="step-index">{{ i + 1 }}</text>
          <view class="step-body">
            <text class="step-name">{{ s.step }}</text>
            <text class="step-desc">{{ s.desc }}</text>
            <view class="step-product" @click="openPicker('morning', s.stepKey)">
              <text v-if="productOf('morning', s.stepKey)" class="bound">🛍️ {{ productOf('morning', s.stepKey).name }}</text>
              <text v-else class="unbound">＋ 绑定产品</text>
            </view>
          </view>
          <text class="step-done" :class="{ checked: s.done }" @click="toggleStep(s)">{{ s.done ? '✅' : '○' }}</text>
        </view>
      </view>

      <view class="card">
        <view class="section-title">🌙 晚间护理</view>
        <view v-for="(s, i) in plan.routineEvening" :key="'e' + i" class="step">
          <text class="step-index">{{ i + 1 }}</text>
          <view class="step-body">
            <text class="step-name">{{ s.step }}</text>
            <text class="step-desc">{{ s.desc }}</text>
            <view class="step-product" @click="openPicker('evening', s.stepKey)">
              <text v-if="productOf('evening', s.stepKey)" class="bound">🛍️ {{ productOf('evening', s.stepKey).name }}</text>
              <text v-else class="unbound">＋ 绑定产品</text>
            </view>
          </view>
          <text class="step-done" :class="{ checked: s.done }" @click="toggleStep(s)">{{ s.done ? '✅' : '○' }}</text>
        </view>
      </view>

      <view class="card">
        <view class="section-title">🧪 成分建议（点击查看详情）</view>
        <view v-for="(it, i) in plan.ingredients" :key="i" class="ingredient" @click="goIngredient(it.name)">
          <text class="ing-name">{{ it.name }}</text>
          <text class="ing-note">{{ it.note }}</text>
        </view>
      </view>

      <view class="card">
        <view class="section-title">⚠️ 禁忌事项</view>
        <view v-for="(t, i) in plan.taboos" :key="i" class="taboo">· {{ t }}</view>
      </view>

      <!-- UV 高时晒后建议 -->
      <view v-if="uv && (uv.uvLevel === 'high' || uv.uvLevel === 'veryHigh')" class="card">
        <view class="section-title">🌞 今日 UV 较高，晒后建议</view>
        <view v-for="(a, i) in uv.afterSunAdvice" :key="i" class="taboo">· {{ a }}</view>
      </view>
    </template>

    <view v-else class="empty card">
      <text>暂无护肤方案</text>
      <text class="text-muted">完成一次 AI 测肤后自动生成个性化方案</text>
      <button class="btn-primary" style="margin-top: 24rpx" @click="goDetect">去测肤</button>
    </view>

    <!-- 产品选择弹层 -->
    <view v-if="pickerVisible" class="mask" @click="pickerVisible = false">
      <view class="sheet" @click.stop>
        <view class="sheet-title">选择产品</view>
        <view v-for="p in products" :key="p.id" class="pick-item" @click="pickProduct(p.id)">
          <text class="pick-name">{{ p.name }}</text>
          <text class="pick-score">{{ p.matchScore }} 匹配</text>
        </view>
        <view v-if="!products.length" class="empty-tip">暂无产品</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getPlan } from '@/api/plan';
import { submitCheckin } from '@/api/checkin';
import { getPlanSteps, bindPlanStepProduct, listProducts } from '@/api/product';
import { listIngredients } from '@/api/ingredient';
import { getUv } from '@/api/env';

const plan = ref<any>(null);
const bindings = ref<any[]>([]);
const products = ref<any[]>([]);
const pickerVisible = ref(false);
const pickerTarget = ref<any>({ period: 'morning', stepKey: '' });
const uv = ref<any>(null);

const isMorning = computed(() => new Date().getHours() < 18);

const progressPercent = computed(() => {
  const p = plan.value?.stepProgress;
  if (!p || p.total === 0) return 0;
  return Math.round((p.done / p.total) * 100);
});

function productOf(period: string, stepKey: string) {
  const s = bindings.value.find((x) => x.period === period && x.stepKey === stepKey);
  return s ? s.product : null;
}

function goDetect() {
  uni.navigateTo({ url: '/pages/detect/upload' });
}

async function load() {
  try {
    const [p, steps] = await Promise.all([getPlan(), getPlanSteps()]);
    plan.value = p;
    bindings.value = (steps && steps.steps) || [];
  } catch (e) {
    /* ignore */
  }
}

async function toggleStep(s: any) {
  if (!s.key) return;
  try {
    await submitCheckin({ type: s.key });
    uni.showToast({ title: s.done ? '已取消' : '已完成', icon: 'none' });
    load();
  } catch (e) {
    /* ignore */
  }
}

async function goIngredient(name: string) {
  try {
    const data = await listIngredients(name, 1, 5);
    const found = (data.list || []).find((i: any) => i.name === name) || (data.list || [])[0];
    if (found) {
      uni.navigateTo({ url: '/pages/ingredient/detail?id=' + found.id });
    } else {
      uni.navigateTo({ url: '/pages/ingredient/list' });
    }
  } catch (e) {
    uni.navigateTo({ url: '/pages/ingredient/list' });
  }
}

async function openPicker(period: string, stepKey: string) {
  pickerTarget.value = { period, stepKey };
  try {
    products.value = await listProducts('', '');
  } catch (e) {
    products.value = [];
  }
  pickerVisible.value = true;
}

async function pickProduct(productId: number) {
  try {
    await bindPlanStepProduct(pickerTarget.value.period, pickerTarget.value.stepKey, productId);
    uni.showToast({ title: '已绑定', icon: 'success' });
    pickerVisible.value = false;
    load();
  } catch (e) {
    /* ignore */
  }
}

onMounted(() => {
  load();
  getUv('北京').then((u) => { uv.value = u; }).catch(() => {});
});
</script>

<style scoped>
.plan-title {
  font-size: 32rpx;
  font-weight: 700;
}
.time-hint {
  background: #fff7e6;
}
.time-hint-text {
  font-size: 26rpx;
  color: #b88230;
}
.progress-row {
  margin-top: 16rpx;
}
.progress-text {
  font-size: 26rpx;
  color: #666;
}
.progress-bar {
  margin-top: 12rpx;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f9a8a8, #f56c6c);
  border-radius: 8rpx;
  transition: width 0.3s;
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
  align-items: flex-start;
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
  flex-shrink: 0;
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
.step-product {
  margin-top: 10rpx;
  align-self: flex-start;
}
.bound {
  font-size: 24rpx;
  color: #4a7fe0;
  background: #eef4ff;
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
}
.unbound {
  font-size: 24rpx;
  color: #bbb;
  border: 2rpx dashed #ddd;
  padding: 4rpx 16rpx;
  border-radius: 24rpx;
}
.step-done {
  font-size: 34rpx;
  color: #ddd;
  flex-shrink: 0;
  padding-top: 4rpx;
}
.step-done.checked {
  color: #3bb877;
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
  color: #4a7fe0;
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
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
}
.sheet-title {
  font-weight: 600;
  font-size: 30rpx;
  margin-bottom: 16rpx;
  text-align: center;
}
.pick-item {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  font-size: 26rpx;
}
.pick-score {
  color: #f56c6c;
  font-size: 24rpx;
}
.empty-tip {
  text-align: center;
  color: #bbb;
  padding: 30rpx 0;
}
</style>
