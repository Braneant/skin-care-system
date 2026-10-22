<template>
  <div class="login-page">
    <el-card class="login-card">
      <div class="login-title">
        <h2>智能护肤管理系统</h2>
        <p>基于 AI 大模型 + 微信小程序 · 管理端</p>
      </div>
      <el-form :model="form" label-position="top" @keyup.enter="onSubmit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="loading" @click="onSubmit">
          登 录
        </el-button>
      </el-form>
      <p class="hint">默认账号：admin / admin123（管理员），doctor / doctor123（医生）</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const form = reactive({ username: '', password: '' });
const loading = ref(false);

async function onSubmit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }
  loading.value = true;
  try {
    await userStore.login(form.username, form.password);
    ElMessage.success('登录成功');
    const redirect = (route.query.redirect as string) || '/dashboard';
    router.replace(redirect);
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fce8ee 0%, #e8f4fd 100%);
}
.login-card {
  width: 400px;
  padding: 8px 12px;
}
.login-title {
  text-align: center;
  margin-bottom: 20px;
}
.login-title h2 {
  margin: 0 0 6px;
  color: #303133;
}
.login-title p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}
.submit-btn {
  width: 100%;
  margin-top: 4px;
}
.hint {
  margin-top: 16px;
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
}
</style>
