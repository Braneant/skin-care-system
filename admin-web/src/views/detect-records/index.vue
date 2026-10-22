<template>
  <div class="page-container">
    <el-card>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索用户昵称" clearable style="width: 240px" @keyup.enter="load" />
        <el-select v-model="engine" placeholder="AI 引擎" clearable style="width: 160px" @change="load">
          <el-option label="DeepSeek" value="deepseek" />
          <el-option label="本地引擎" value="local" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
      </div>

      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="nickname" label="用户" width="120" />
        <el-table-column label="检测图" width="90">
          <template #default="{ row }">
            <el-image v-if="row.imageUrl" :src="row.imageUrl" fit="cover" style="width: 48px; height: 48px; border-radius: 4px" :preview-src-list="[row.imageUrl]" preview-teleported />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="skinType" label="肤质" width="100" />
        <el-table-column prop="score" label="得分" width="80" />
        <el-table-column prop="riskLevel" label="风险" width="100" />
        <el-table-column label="引擎" width="110">
          <template #default="{ row }">
            <el-tag :type="row.engine === 'deepseek' ? 'primary' : 'info'">
              {{ row.engine === 'deepseek' ? 'DeepSeek' : '本地' }}
              <span v-if="row.degraded">(降级)</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="问题" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="i in row.issues" :key="i.type" size="small" style="margin: 0 4px 2px 0">{{ i.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="检测时间" width="180" />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          layout="total, sizes, prev, pager, next" @current-change="load" @size-change="load" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listDetectRecords } from '@/api/detectRecord';

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const engine = ref('');
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: page.value, pageSize: pageSize.value };
    if (keyword.value) params.keyword = keyword.value;
    if (engine.value) params.engine = engine.value;
    const data = await listDetectRecords(params);
    list.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
