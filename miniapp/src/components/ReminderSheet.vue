<template>
  <view v-if="visible" class="mask" @click="close">
    <view class="sheet" @click.stop>
      <view class="title">{{ title }}</view>
      <picker mode="time" :value="time" @change="onTime">
        <view class="picker">提醒时间：{{ time || '请选择时间' }}</view>
      </picker>
      <view class="row">
        <text class="row-label">启用提醒</text>
        <switch :checked="enabled" @change="onSwitch" />
      </view>
      <view class="btns">
        <button class="btn-ghost" @click="close">取消</button>
        <button class="btn-primary" @click="save">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { upsertReminder } from '@/api/reminder';

const props = defineProps<{
  visible: boolean;
  type: string;
  title?: string;
}>();

const emit = defineEmits(['close', 'saved']);

const time = ref('08:00');
const enabled = ref(true);

watch(
  () => props.visible,
  (v) => {
    if (v) {
      time.value = '08:00';
      enabled.value = true;
    }
  }
);

function onTime(e: any) {
  time.value = e.detail.value;
}

function onSwitch(e: any) {
  enabled.value = e.detail.value;
}

function close() {
  emit('close');
}

async function save() {
  try {
    await upsertReminder({ type: props.type, scheduleTime: time.value, enabled: enabled.value });
    uni.showToast({ title: '已保存', icon: 'success' });
    emit('saved');
    close();
  } catch (e) {
    /* ignore */
  }
}
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
}
.title {
  font-weight: 600;
  font-size: 30rpx;
  margin-bottom: 20rpx;
  text-align: center;
}
.picker {
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  padding: 20rpx;
  text-align: center;
  font-size: 26rpx;
  margin-bottom: 20rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.row-label {
  font-size: 26rpx;
  color: #333;
}
.btns {
  display: flex;
  gap: 16rpx;
}
.btns button {
  flex: 1;
}
.btn-ghost {
  background: #fff;
  color: #666;
  border: 2rpx solid #eee;
  border-radius: 44rpx;
}
</style>
