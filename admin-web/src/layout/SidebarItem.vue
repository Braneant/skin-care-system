<template>
  <template v-if="isLeaf">
    <el-menu-item v-if="item.routePath" :index="item.routePath">
      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
      <template #title>{{ item.name }}</template>
    </el-menu-item>
  </template>
  <el-sub-menu v-else :index="item.routePath || String(item.id)">
    <template #title>
      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
      <span>{{ item.name }}</span>
    </template>
    <SidebarItem v-for="child in item.children" :key="child.id" :item="child" />
  </el-sub-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'SidebarItem' });

const props = defineProps<{ item: any }>();

const isLeaf = computed(
  () => !props.item.children || props.item.children.length === 0
);
</script>
