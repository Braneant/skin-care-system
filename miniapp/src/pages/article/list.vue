<template>
  <view class="page">
    <view v-for="a in list" :key="a.id" class="card article" @click="go(a.id)">
      <view class="article-title">{{ a.title }}</view>
      <view class="article-meta">
        <text>{{ a.author || '平台小编' }}</text>
        <text>· 阅读 {{ a.viewCount }}</text>
        <text>· {{ (a.publishAt || '').slice(0, 10) }}</text>
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
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.article-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}
.article-meta {
  color: #999;
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
