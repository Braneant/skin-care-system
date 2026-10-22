<template>
  <div class="navbar">
    <div class="navbar-title">{{ currentTitle }}</div>
    <div class="navbar-right">
      <el-dropdown @command="onCommand">
        <span class="user-info">
          <el-icon><UserFilled /></el-icon>
          {{ displayName }}
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { usePermissionStore } from '@/store/permission';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const permissionStore = usePermissionStore();

const currentTitle = computed(() => (route.meta?.title as string) || '');
const displayName = computed(
  () => userStore.user?.realName || userStore.user?.username || '未登录'
);

function onCommand(command: string) {
  if (command === 'logout') {
    userStore.logout();
    permissionStore.reset();
    router.replace('/login');
  }
}
</script>

<style scoped>
.navbar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.navbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #303133;
  outline: none;
}
</style>
