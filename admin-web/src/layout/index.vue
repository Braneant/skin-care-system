<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <Sidebar />
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <Navbar />
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue';
import Navbar from './Navbar.vue';
</script>

<style scoped>
.layout-container {
  height: 100%;
}
.layout-aside {
  background: #001529;
  overflow-x: hidden;
}
.layout-header {
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  padding: 0;
}
.layout-main {
  background: #f5f6f8;
}
</style>
