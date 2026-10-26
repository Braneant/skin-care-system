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
        <!-- 方案依据条 -->
        <view class="basis-row">
          <text class="basis-text">🎯 个性化方案 · 建议每 7 天复测调整</text>
          <text class="basis-link" @click="goRetest">去复测 ›</text>
        </view>
      </view>

      <!-- 今日执行总览 -->
      <view v-if="plan.stepProgress" class="card">
        <view class="section-title">今日执行总览</view>
        <view class="overview-cols">
          <view class="ov-col">
            <text class="ov-num">{{ morningStat.done }}/{{ morningStat.total }}</text>
            <text class="ov-label">晨间</text>
          </view>
          <view class="ov-col">
            <text class="ov-num">{{ eveningStat.done }}/{{ eveningStat.total }}</text>
            <text class="ov-label">晚间</text>
          </view>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <view class="overview-text">已完成 {{ plan.stepProgress.done }}/{{ plan.stepProgress.total }} 步 · 完成率 {{ progressPercent }}%</view>
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
        <view class="section-title">💡 护肤小贴士</view>
        <view class="tip-item">· {{ seasonTipText }}</view>
        <view class="tip-item">· 晚间 22:00–2:00 是皮肤修护黄金期，尽量 23 点前完成护肤</view>
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

      <!-- 快捷操作 -->
      <view class="card">
        <view class="section-title">快捷操作</view>
        <view class="quick-grid">
          <view class="quick-item" v-for="q in quickActions" :key="q.text" @click="onQuick(q)">
            <text class="quick-icon">{{ q.icon }}</text>
            <text class="quick-text">{{ q.text }}</text>
          </view>
        </view>
      </view>
    </template>

    <view v-else>
      <!-- A 数据展示条 -->
      <view class="card empty-hero">
        <view class="empty-hero-title">还没有护肤方案</view>
        <view class="empty-stat">
          <text v-if="detectCount > 0">已测肤 {{ detectCount }} 次 · 最近得分 {{ latestScore }} 分</text>
          <text v-else>还没有测肤记录</text>
        </view>
      </view>

      <!-- B 三步引导 -->
      <view class="card">
        <view class="section-title">如何获得专属方案</view>
        <view class="steps-row">
          <view class="guide-step">
            <view class="guide-num">1</view>
            <text class="guide-label">填写肤质问卷</text>
          </view>
          <view class="guide-arrow">›</view>
          <view class="guide-step active">
            <view class="guide-num">2</view>
            <text class="guide-label">上传照片测肤</text>
          </view>
          <view class="guide-arrow">›</view>
          <view class="guide-step">
            <view class="guide-num">3</view>
            <text class="guide-label">生成方案</text>
          </view>
        </view>
      </view>

      <!-- C 双行动按钮 -->
      <view class="card action-card">
        <button class="btn-primary action-main" @click="goDetect">开始 AI 测肤</button>
        <button class="action-sub" @click="goSurvey">先填肤质问卷</button>
      </view>

      <!-- D 示例方案预览 -->
      <view class="card">
        <view class="preview-head">
          <text class="section-title">示例方案预览</text>
          <text class="preview-tag">测肤后为你定制</text>
        </view>
        <view class="preview-sub">☀️ 晨间</view>
        <view v-for="(s, i) in sampleMorning" :key="'sm' + i" class="preview-step">
          <text class="preview-idx">{{ i + 1 }}</text>
          <text class="preview-name">{{ s.step }}</text>
          <text class="preview-desc">{{ s.desc }}</text>
        </view>
        <view class="preview-sub">🌙 晚间</view>
        <view v-for="(s, i) in sampleEvening" :key="'se' + i" class="preview-step">
          <text class="preview-idx">{{ i + 1 }}</text>
          <text class="preview-name">{{ s.step }}</text>
          <text class="preview-desc">{{ s.desc }}</text>
        </view>
      </view>

      <!-- E 测肤须知 -->
      <view class="card">
        <view class="section-title">💡 测肤须知</view>
        <view class="notice-line">· 正脸清晰照，露出额头与脸颊</view>
        <view class="notice-line">· 自然光下拍摄，避免浓妆与滤镜</view>
        <view class="notice-line">· 素颜状态测量更准确</view>
      </view>
    </view>

    <!-- 晨间提醒设置弹层 -->
    <ReminderSheet
      :visible="showReminder"
      type="morning"
      title="晨间提醒"
      @close="showReminder = false"
      @saved="showReminder = false"
    />

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
import { listDetect } from '@/api/detect';
import { goPage } from '@/utils/nav';
import { resolveCity } from '@/utils/location';
import ReminderSheet from '@/components/ReminderSheet.vue';

const plan = ref<any>(null);
const bindings = ref<any[]>([]);
const products = ref<any[]>([]);
const pickerVisible = ref(false);
const pickerTarget = ref<any>({ period: 'morning', stepKey: '' });
const uv = ref<any>(null);
const showReminder = ref(false);
const detectCount = ref(0);
const latestScore = ref<number | null>(null);

const sampleMorning = [
  { step: '清洁', desc: '温和氨基酸洁面' },
  { step: '精华', desc: '保湿 / 功效精华' },
  { step: '防晒', desc: 'SPF30+ 防晒霜' },
];
const sampleEvening = [
  { step: '清洁', desc: '卸妆 + 洁面' },
  { step: '保湿', desc: '修护面霜锁水' },
  { step: '修护', desc: '屏障修护精华' },
];

const isMorning = computed(() => new Date().getHours() < 18);

const progressPercent = computed(() => {
  const p = plan.value?.stepProgress;
  if (!p || p.total === 0) return 0;
  return Math.round((p.done / p.total) * 100);
});

const morningStat = computed(() => {
  const arr = plan.value?.routineMorning || [];
  return { done: arr.filter((s: any) => s.done).length, total: arr.length };
});

const eveningStat = computed(() => {
  const arr = plan.value?.routineEvening || [];
  return { done: arr.filter((s: any) => s.done).length, total: arr.length };
});

const seasonTipText = computed(() => {
  if (uv.value && (uv.value.uvLevel === 'high' || uv.value.uvLevel === 'veryHigh')) {
    return '今日紫外线较强，记得每 2 小时补涂防晒，晒后加强修护';
  }
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return '春季干燥敏感高发，注意保湿与抗敏，坚持防晒';
  if (m >= 6 && m <= 8) return '夏季出油出汗多，注意控油清洁与防晒，晒后及时修护';
  if (m >= 9 && m <= 11) return '秋季干燥，重点保湿与修护屏障，减少过度清洁';
  return '冬季寒冷干燥，加强保湿与屏障修护，避免过热洗脸';
});

const quickActions = [
  { icon: '📷', text: '记录肤况', url: '/pages/diary/index' },
  { icon: '🛍️', text: '我的产品柜', url: '/pages/product/cabinet' },
  { icon: '⏰', text: '设置提醒', action: 'reminder' },
  { icon: '🔁', text: '重新测肤', url: '/pages/detect/upload' },
];

function onQuick(q: any) {
  if (q.action === 'reminder') {
    showReminder.value = true;
    return;
  }
  goPage(q.url);
}

function goRetest() {
  goPage('/pages/detect/upload');
}

function productOf(period: string, stepKey: string) {
  const s = bindings.value.find((x) => x.period === period && x.stepKey === stepKey);
  return s ? s.product : null;
}

function goDetect() {
  uni.navigateTo({ url: '/pages/detect/upload' });
}

function goSurvey() {
  goPage('/pages/survey/index');
}

async function loadDetectStats() {
  try {
    const list = await listDetect();
    detectCount.value = (list || []).length;
    latestScore.value = list && list[0] ? list[0].score : null;
  } catch (e) {
    /* ignore */
  }
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

onMounted(async () => {
  load();
  loadDetectStats();
  try {
    const resolved = await resolveCity();
    uv.value = await getUv(resolved.city);
  } catch (e) {
    /* ignore */
  }
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
.basis-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}
.basis-text {
  font-size: 22rpx;
  color: #999;
}
.basis-link {
  font-size: 22rpx;
  color: #f56c6c;
}
.overview-cols {
  display: flex;
  gap: 20rpx;
  margin-bottom: 16rpx;
}
.ov-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  background: #fef6f8;
  border-radius: 16rpx;
}
.ov-num {
  font-size: 40rpx;
  font-weight: 700;
  color: #f56c6c;
}
.ov-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}
.overview-text {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #666;
}
.tip-item {
  font-size: 26rpx;
  color: #555;
  line-height: 1.7;
  padding: 4rpx 0;
}
.quick-grid {
  display: flex;
  flex-wrap: wrap;
}
.quick-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 0;
}
.quick-icon {
  font-size: 48rpx;
}
.quick-text {
  font-size: 22rpx;
  color: #333;
}
.empty-hero {
  background: linear-gradient(135deg, #fce8ee, #e8f4fd);
  text-align: center;
}
.empty-hero-title {
  font-size: 34rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}
.empty-stat {
  font-size: 26rpx;
  color: #666;
}
.steps-row {
  display: flex;
  align-items: center;
}
.guide-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}
.guide-num {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f0f0f0;
  color: #999;
  text-align: center;
  line-height: 56rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.guide-step.active .guide-num {
  background: #f56c6c;
  color: #fff;
}
.guide-label {
  font-size: 22rpx;
  color: #666;
}
.guide-step.active .guide-label {
  color: #f56c6c;
  font-weight: 600;
}
.guide-arrow {
  color: #ddd;
  font-size: 32rpx;
  padding: 0 8rpx;
}
.action-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.action-main {
  width: 100%;
}
.action-sub {
  width: 100%;
  background: #fff;
  color: #f56c6c;
  border: 2rpx solid #fce8ee;
  border-radius: 44rpx;
  font-size: 28rpx;
  line-height: 2.4;
}
.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.preview-tag {
  font-size: 20rpx;
  color: #f56c6c;
  background: #fef0f0;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}
.preview-sub {
  font-size: 24rpx;
  color: #999;
  margin: 12rpx 0 8rpx;
}
.preview-step {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 0;
}
.preview-idx {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #fce8ee;
  color: #f56c6c;
  text-align: center;
  line-height: 32rpx;
  font-size: 20rpx;
  flex-shrink: 0;
}
.preview-name {
  font-size: 26rpx;
  font-weight: 600;
  width: 100rpx;
}
.preview-desc {
  font-size: 24rpx;
  color: #888;
}
.notice-line {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
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
