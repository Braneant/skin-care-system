<template>
  <view class="page">
    <view v-for="a in list" :key="a.id" class="card article" @click="go(a.id)">
      <image v-if="a.coverUrl" :src="a.coverUrl" mode="aspectFill" class="cover" />
      <view v-else class="cover cover-placeholder">🌿</view>
      <view class="article-body">
        <view class="article-title">{{ a.title }}</view>
        <view class="article-summary">{{ a.summary || '暂无摘要' }}</view>
        <view class="article-meta">
          <text>{{ a.author || '平台小编' }}</text>
          <text>· 阅读 {{ a.viewCount }}</text>
          <text>· {{ (a.publishAt || '').slice(0, 10) }}</text>
        </view>
      </view>
    </view>
    <view v-if="!list.length" class="empty">暂无文章</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listArticles } from '@/api/content';

const list = ref<any[]>([]);

function go(id: number) {
  uni.navigateTo({ url: '/pages/article/detail?id=' + id });
}

onMounted(async () => {
  try {
    const data = await listArticles(1, 20);
    list.value = data.list || [];
  } catch (e) {
    /* ignore */
  }
});
</script>

<style scoped>
.article {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.cover {
  width: 100%;
  height: 320rpx;
  display: block;
}
.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fce8ee, #e8f4fd);
  font-size: 72rpx;
}
.article-body {
  padding: 20rpx 24rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.article-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.article-summary {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.article-meta {
  color: #bbb;
  font-size: 22rpx;
  display: flex;
  gap: 12rpx;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
}
</style>
