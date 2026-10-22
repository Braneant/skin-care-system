<template>
  <div class="sidebar">
    <div class="logo">
      <span>智能护肤管理系统</span>
    </div>
    <el-scrollbar class="menu-scroll">
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#a6adb4"
        active-text-color="#ffffff"
        :unique-opened="false"
      >
        <SidebarItem v-for="m in menus" :key="m.id" :item="m" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import SidebarItem from './SidebarItem.vue';

const route = useRoute();
const userStore = useUserStore();
const menus = computed(() => userStore.menus);
const activeMenu = computed(() => route.path);
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.menu-scroll {
  flex: 1;
}
.sidebar :deep(.el-menu) {
  border-right: none;
}
</style>
