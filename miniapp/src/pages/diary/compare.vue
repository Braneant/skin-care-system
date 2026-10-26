<template>
  <view class="page">
    <view class="stage">
      <image :src="after" class="img" mode="aspectFill" />
      <view class="clip" :style="{ width: percent + '%' }">
        <image :src="before" class="img clip-img" mode="aspectFill" />
      </view>
      <view class="divider" :style="{ left: percent + '%' }">
        <text class="divider-dot">⇔</text>
      </view>
    </view>
    <view class="ctrl card">
      <slider :value="percent" activeColor="#f56c6c" block-size="24" @change="onChange" @changing="onChange" />
      <view class="labels">
        <text>之前</text>
        <text>之后</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const before = ref('');
const after = ref('');
const percent = ref(50);

function onChange(e: any) {
  percent.value = e.detail.value;
}

onMounted(() => {
  const urls = uni.getStorageSync('diary_compare') || [];
  if (urls.length >= 2) {
    before.value = urls[0];
    after.value = urls[1];
  }
});
</script>

<style scoped>
.page {
  background: #000;
  min-height: 100vh;
}
.stage {
  position: relative;
  width: 750rpx;
  height: 750rpx;
  overflow: hidden;
  background: #222;
}
.img {
  width: 750rpx;
  height: 750rpx;
  display: block;
}
.clip {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  overflow: hidden;
}
.clip-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 750rpx;
  height: 750rpx;
}
.divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4rpx;
  background: #fff;
  transform: translateX(-2rpx);
  display: flex;
  align-items: center;
  justify-content: center;
}
.divider-dot {
  background: #fff;
  color: #f56c6c;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  text-align: center;
  line-height: 56rpx;
  font-size: 28rpx;
}
.ctrl {
  margin: 20rpx;
}
.labels {
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 26rpx;
  padding: 0 8rpx;
}
</style>
