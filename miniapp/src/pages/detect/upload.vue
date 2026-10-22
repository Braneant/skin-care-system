<template>
  <view class="page">
    <view class="card">
      <view class="section-title">上传面部照片</view>
      <view class="preview" @click="choose">
        <image v-if="preview" :src="preview" mode="aspectFill" class="preview-img" />
        <view v-else class="placeholder">
          <text class="icon">📷</text>
          <text>点击拍照或从相册选择</text>
        </view>
      </view>
      <view class="actions">
        <button class="btn-ghost" size="mini" @click="choose">选择图片</button>
        <button class="btn-primary" size="mini" :loading="loading" :disabled="!preview" @click="analyze">
          开始 AI 检测
        </button>
      </view>
      <view class="tip">请保证光线充足、正面清晰，照片最长边会自动压缩至 800px</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { compressImage } from '@/utils/image';
import { analyze as analyzeApi } from '@/api/detect';

const preview = ref('');
const loading = ref(false);

function choose() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res: any) => {
      preview.value = res.tempFilePaths[0];
    },
  });
}

async function analyze() {
  if (!preview.value) return;
  loading.value = true;
  try {
    uni.showLoading({ title: '压缩中...' });
    const dataUrl = await compressImage(preview.value);
    uni.showLoading({ title: 'AI 分析中...' });
    const result = await analyzeApi(dataUrl);
    uni.hideLoading();
    uni.setStorageSync('detect_result', result);
    uni.navigateTo({ url: '/pages/detect/result?id=' + result.detectId });
  } catch (e) {
    uni.hideLoading();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.section-title {
  font-weight: 600;
  font-size: 30rpx;
  margin-bottom: 20rpx;
}
.preview {
  height: 480rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-img {
  width: 100%;
  height: 100%;
}
.placeholder {
  text-align: center;
  color: #bbb;
}
.placeholder .icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 16rpx;
}
.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.actions button {
  flex: 1;
}
.btn-ghost {
  background: #fff;
  color: #666;
  border: 2rpx solid #eee;
  border-radius: 44rpx;
}
.tip {
  margin-top: 20rpx;
  color: #bbb;
  font-size: 22rpx;
  text-align: center;
}
</style>
