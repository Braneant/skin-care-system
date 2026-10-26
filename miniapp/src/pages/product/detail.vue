<template>
  <view class="page">
    <view class="card" v-if="product">
      <view class="prod-head">
        <view class="prod-meta">
          <text class="prod-name">{{ product.name }}</text>
          <text class="prod-brand">{{ product.brand }} · {{ product.category }}</text>
        </view>
        <view class="match">
          <text class="match-num">{{ product.matchScore }}</text>
          <text class="match-label">匹配度</text>
        </view>
      </view>

      <text class="prod-desc">{{ product.description }}</text>

      <view class="section" v-if="product.matchReasons && product.matchReasons.length">
        <view class="section-title">匹配分析</view>
        <view v-for="(r, i) in product.matchReasons" :key="i" class="reason">· {{ r }}</view>
      </view>

      <view class="section" v-if="product.ingredients && product.ingredients.length">
        <view class="section-title">成分列表</view>
        <view
          v-for="ing in product.ingredients"
          :key="ing.name"
          class="ing-item"
          @click="goIngredient(ing.ingredientId)"
        >
          <text class="ing-name">{{ ing.name }}</text>
          <text class="ing-eff">{{ ing.efficacy || '' }}</text>
          <text class="ing-risk" :class="{ 'r-low': ing.riskLevel === '低', 'r-mid': ing.riskLevel === '中', 'r-high': ing.riskLevel === '高' }">{{ ing.riskLevel || '' }}</text>
        </view>
      </view>

      <button class="btn-primary add-btn" @click="addToCabinet">加入产品柜</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getProduct, addMyProduct } from '@/api/product';

const product = ref<any>(null);
let id = 0;

onLoad((query: any) => {
  id = Number(query.id);
});

function goIngredient(ingredientId: number | null) {
  if (!ingredientId) return;
  uni.navigateTo({ url: '/pages/ingredient/detail?id=' + ingredientId });
}

async function addToCabinet() {
  try {
    await addMyProduct(id, 'using');
    uni.showToast({ title: '已加入产品柜', icon: 'success' });
  } catch (e) {
    /* ignore */
  }
}

onMounted(async () => {
  try {
    product.value = await getProduct(id);
  } catch (e) {
    /* ignore */
  }
});
</script>

<style scoped>
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
  font-size: 36rpx;
  font-weight: 700;
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
  font-size: 48rpx;
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
  color: #666;
  font-size: 26rpx;
  line-height: 1.7;
  margin-top: 16rpx;
}
.section {
  margin-top: 24rpx;
}
.section-title {
  font-weight: 600;
  font-size: 26rpx;
  margin-bottom: 12rpx;
}
.reason {
  color: #666;
  font-size: 24rpx;
  padding: 4rpx 0;
}
.ing-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.ing-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #4a7fe0;
}
.ing-eff {
  flex: 1;
  font-size: 22rpx;
  color: #999;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ing-risk {
  font-size: 20rpx;
}
.r-low { color: #3bb877; }
.r-mid { color: #e6a23c; }
.r-high { color: #f56c6c; }
.add-btn {
  margin-top: 32rpx;
}
</style>
