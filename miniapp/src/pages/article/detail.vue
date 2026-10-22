<template>
  <view class="page">
    <view class="card" v-if="article">
      <view class="article-title">{{ article.title }}</view>
      <view class="article-meta">
        <text>{{ article.author || '平台小编' }}</text>
        <text>· 阅读 {{ article.viewCount }}</text>
      </view>
      <view class="content">
        <rich-text :nodes="article.content || ''"></rich-text>
      </view>
      <button
        class="favorite-btn"
        :class="{ favorited: article.favorited }"
        @click="onFavorite"
      >
        {{ article.favorited ? '❤️ 已收藏' : '🤍 收藏' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getArticle, toggleFavorite } from '@/api/content';

const article = ref<any>(null);
let articleId = 0;

onLoad((query: any) => {
  articleId = Number(query.id);
});

async function load() {
  try {
    article.value = await getArticle(articleId);
  } catch (e) {
    /* ignore */
  }
}

async function onFavorite() {
  if (!article.value) return;
  try {
    const res = await toggleFavorite(article.value.id);
    article.value.favorited = res.favorited;
    uni.showToast({ title: res.favorited ? '已收藏' : '已取消收藏', icon: 'none' });
  } catch (e) {
    /* ignore */
  }
}

onMounted(load);
</script>

<style scoped>
.article-title {
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}
.article-meta {
  color: #999;
  font-size: 22rpx;
  margin-bottom: 24rpx;
  display: flex;
  gap: 12rpx;
}
.content {
  font-size: 28rpx;
  color: #444;
  line-height: 1.8;
}
.favorite-btn {
  margin-top: 32rpx;
  background: #fff;
  border: 2rpx solid #eee;
  border-radius: 44rpx;
}
.favorite-btn.favorited {
  color: #f56c6c;
  border-color: #f56c6c;
}
</style>
