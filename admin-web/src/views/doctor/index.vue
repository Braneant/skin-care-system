<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card>
          <div class="stat">
            <div class="stat-value">{{ pendingCount }}</div>
            <div class="stat-label">待处理咨询</div>
            <el-button type="primary" text @click="$router.push('/doctor/consultations')">去处理</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div class="stat">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">患者总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div class="stat">
            <div class="stat-value">{{ adviceCount }}</div>
            <div class="stat-label">我的建议模板</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 16px">
      <template #header>最近患者</template>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="skinType" label="肤质" width="120" />
        <el-table-column prop="latestScore" label="最新得分" width="100" />
        <el-table-column prop="latestRisk" label="风险" width="100" />
        <el-table-column prop="detectCount" label="检测次数" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/doctor/patient/${row.id}`)">查看档案</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listPatients } from '@/api/patient';
import { listConsultations } from '@/api/consult';
import { listTemplates } from '@/api/advice';

const list = ref<any[]>([]);
const total = ref(0);
const pendingCount = ref(0);
const adviceCount = ref(0);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const [patients, consults, templates] = await Promise.all([
      listPatients({ page: 1, pageSize: 8 }),
      listConsultations({ page: 1, pageSize: 1, status: 'pending' }),
      listTemplates(),
    ]);
    list.value = patients.list || [];
    total.value = patients.total || 0;
    pendingCount.value = consults.total || 0;
    adviceCount.value = templates.length || 0;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.stat {
  text-align: center;
  padding: 8px 0;
}
.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: #409eff;
}
.stat-label {
  margin: 6px 0;
  color: #909399;
}
</style>
