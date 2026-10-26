<template>
  <view class="page">
    <view class="msg-list">
      <view v-for="m in list" :key="m.id" class="msg-row" :class="m.sender">
        <view class="bubble">
          <text class="bubble-text">{{ m.content }}</text>
          <text class="bubble-time">{{ (m.createdAt || '').slice(11, 16) }}</text>
        </view>
      </view>
      <view v-if="!list.length" class="empty">暂无消息，向医生发起咨询吧</view>
    </view>

    <view class="input-bar">
      <input v-model="content" class="input" placeholder="输入消息…" confirm-type="send" @confirm="send" />
      <button class="btn-primary" size="mini" @click="send">发送</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listFollowup, sendFollowup } from '@/api/followup';

const list = ref<any[]>([]);
const content = ref('');

async function load() {
  try {
    list.value = await listFollowup();
  } catch (e) {
    /* ignore */
  }
}

async function send() {
  const text = content.value.trim();
  if (!text) return;
  try {
    await sendFollowup(text);
    content.value = '';
    load();
  } catch (e) {
    /* ignore */
  }
}

onMounted(load);
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f7f7f7;
}
.msg-list {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx;
}
.msg-row {
  display: flex;
  margin-bottom: 20rpx;
}
.msg-row.user {
  justify-content: flex-end;
}
.msg-row.doctor {
  justify-content: flex-start;
}
.bubble {
  max-width: 70%;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.msg-row.user .bubble {
  background: #f56c6c;
  color: #fff;
}
.msg-row.doctor .bubble {
  background: #fff;
  color: #333;
}
.bubble-text {
  font-size: 28rpx;
  line-height: 1.5;
}
.msg-row.user .bubble-time {
  color: rgba(255, 255, 255, 0.8);
}
.msg-row.doctor .bubble-time {
  color: #bbb;
}
.bubble-time {
  font-size: 20rpx;
  align-self: flex-end;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
}
.input-bar {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 16rpx 20rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
}
.input {
  flex: 1;
  border: 2rpx solid #eee;
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  background: #f7f7f7;
}
</style>
