<template>
  <view class="page">
    <view class="card">
      <view class="section-title">提交咨询预约</view>
      <view class="form-item">
        <text class="label">咨询主题</text>
        <input v-model="form.subject" class="input" placeholder="如：痘痘问题咨询" />
      </view>
      <view class="form-item">
        <text class="label">问题描述</text>
        <textarea v-model="form.description" class="textarea" placeholder="请描述您的肌肤问题、持续时间等" />
      </view>
      <button class="btn-primary" :loading="loading" @click="submit">提交预约</button>
    </view>

    <view class="card" v-if="list.length">
      <view class="section-title">我的预约</view>
      <view v-for="c in list" :key="c.id" class="consult">
        <view class="consult-head">
          <text class="consult-subject">{{ c.subject }}</text>
          <text class="status" :class="'s-' + c.status">{{ statusText(c.status) }}</text>
        </view>
        <view class="consult-reply" v-if="c.reply">回复：{{ c.reply }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { createConsultation, listConsultations } from '@/api/content';

const loading = ref(false);
const list = ref<any[]>([]);
const form = reactive({ subject: '', description: '' });

function statusText(s: string) {
  return { pending: '待处理', accepted: '已接受', completed: '已完成', cancelled: '已取消' }[s] || s;
}

async function submit() {
  if (!form.subject || !form.description) {
    return uni.showToast({ title: '请填写完整信息', icon: 'none' });
  }
  loading.value = true;
  try {
    await createConsultation({ ...form });
    uni.showToast({ title: '提交成功', icon: 'success' });
    form.subject = '';
    form.description = '';
    loadList();
  } catch (e) {
    /* ignore */
  } finally {
    loading.value = false;
  }
}

async function loadList() {
  try {
    list.value = await listConsultations();
  } catch (e) {
    /* ignore */
  }
}

onMounted(loadList);
</script>

<style scoped>
.section-title {
  font-weight: 600;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}
.form-item {
  margin-bottom: 24rpx;
}
.label {
  display: block;
  color: #666;
  font-size: 26rpx;
  margin-bottom: 10rpx;
}
.input,
.textarea {
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 26rpx;
  width: 100%;
  box-sizing: border-box;
}
.textarea {
  height: 200rpx;
}
.consult {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.consult-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.consult-subject {
  font-size: 28rpx;
  font-weight: 600;
}
.status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}
.s-pending { background: #fff7e6; color: #e6a23c; }
.s-accepted { background: #eef4ff; color: #4a7fe0; }
.s-completed { background: #e8f8ef; color: #3bb877; }
.s-cancelled { background: #f0f0f0; color: #999; }
.consult-reply {
  margin-top: 10rpx;
  color: #666;
  font-size: 24rpx;
}
</style>
