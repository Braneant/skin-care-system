<template>
  <view class="page">
    <view class="toolbar card">
      <text class="tip">{{ compareMode ? '选择两张照片进行对比' : '记录你的肤质变化' }}</text>
      <view class="toolbar-btns">
        <button v-if="!compareMode" class="btn-ghost" size="mini" @click="compareMode = true">对比</button>
        <button v-else class="btn-ghost" size="mini" @click="cancelCompare">取消</button>
        <button class="btn-primary" size="mini" @click="upload">上传照片</button>
      </view>
    </view>

    <view class="grid">
      <view
        v-for="d in list"
        :key="d.id"
        class="diary-card card"
        :class="{ selected: selected.includes(d.id) }"
        @click="onTap(d)"
      >
        <image :src="d.imageUrl" mode="aspectFill" class="diary-img" />
        <view class="diary-meta">
          <text class="diary-note">{{ d.note || '无备注' }}</text>
          <text class="diary-date">{{ d.takenAt }}</text>
        </view>
        <text v-if="!compareMode" class="delete-btn" @click.stop="remove(d)">删除</text>
        <text v-if="compareMode && selected.includes(d.id)" class="sel-mark">✓</text>
      </view>
    </view>

    <view v-if="!list.length" class="empty">暂无照片日记</view>

    <view v-if="compareMode && selected.length === 2" class="compare-bar">
      <button class="btn-primary" @click="goCompare">开始对比</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listDiary, uploadDiary, removeDiary } from '@/api/diary';

const list = ref<any[]>([]);
const compareMode = ref(false);
const selected = ref<number[]>([]);

async function load() {
  try {
    list.value = await listDiary();
  } catch (e) {
    /* ignore */
  }
}

function upload() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res: any) => {
      const src = res.tempFilePaths[0];
      uni.compressImage({
        src,
        quality: 80,
        success: (r: any) => doUpload(r.tempFilePath),
        fail: () => doUpload(src),
      });
    },
  });
}

async function doUpload(filePath: string) {
  const note = await new Promise<string>((resolve) => {
    uni.showModal({
      title: '添加备注',
      editable: true,
      placeholderText: '如：晨起状态',
      success: (res: any) => resolve(res.confirm && res.content ? res.content : ''),
      fail: () => resolve(''),
    });
  });
  try {
    await uploadDiary(filePath, note);
    uni.showToast({ title: '已上传', icon: 'success' });
    load();
  } catch (e) {
    /* ignore */
  }
}

function onTap(d: any) {
  if (!compareMode) {
    uni.previewImage({ urls: list.value.map((x) => x.imageUrl), current: d.imageUrl });
    return;
  }
  const i = selected.value.indexOf(d.id);
  if (i >= 0) {
    selected.value.splice(i, 1);
  } else if (selected.value.length < 2) {
    selected.value.push(d.id);
  } else {
    uni.showToast({ title: '最多选两张', icon: 'none' });
  }
}

function cancelCompare() {
  compareMode.value = false;
  selected.value = [];
}

function goCompare() {
  const urls = list.value.filter((x) => selected.value.includes(x.id)).map((x) => x.imageUrl);
  uni.setStorageSync('diary_compare', urls);
  uni.navigateTo({ url: '/pages/diary/compare' });
}

async function remove(d: any) {
  const res = await new Promise((resolve) => uni.showModal({ title: '删除照片', content: '确认删除这张照片日记？', success: resolve }));
  if (!(res as any).confirm) return;
  try {
    await removeDiary(d.id);
    load();
  } catch (e) {
    /* ignore */
  }
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tip {
  color: #999;
  font-size: 24rpx;
}
.toolbar-btns {
  display: flex;
  gap: 12rpx;
}
.btn-ghost {
  background: #fff;
  color: #666;
  border: 2rpx solid #eee;
  border-radius: 40rpx;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 8rpx;
}
.diary-card {
  width: 44%;
  margin: 12rpx 3%;
  position: relative;
  padding: 0;
  overflow: hidden;
}
.diary-card.selected {
  outline: 4rpx solid #f56c6c;
}
.diary-img {
  width: 100%;
  height: 300rpx;
  display: block;
}
.diary-meta {
  padding: 12rpx 16rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.diary-note {
  font-size: 26rpx;
  color: #333;
}
.diary-date {
  font-size: 22rpx;
  color: #bbb;
}
.delete-btn {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
}
.sel-mark {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  background: #f56c6c;
  color: #fff;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  text-align: center;
  line-height: 36rpx;
}
.compare-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
}
</style>
