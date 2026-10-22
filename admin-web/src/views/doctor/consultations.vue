<template>
  <div class="page-container">
    <el-card>
      <div class="toolbar">
        <el-select v-model="status" placeholder="全部状态" clearable style="width: 160px" @change="load">
          <el-option label="待处理" value="pending" />
          <el-option label="已接受" value="accepted" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
      </div>

      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="nickname" label="用户" width="120" />
        <el-table-column prop="subject" label="主题" min-width="160" />
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reply" label="回复" min-width="160" show-overflow-tooltip />
        <el-table-column prop="created_at" label="提交时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openHandle(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          layout="total, sizes, prev, pager, next" @current-change="load" @size-change="load" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="处理预约" width="520px">
      <el-form label-position="top">
        <el-form-item label="主题">{{ current?.subject }}</el-form-item>
        <el-form-item label="描述"><div class="desc">{{ current?.description }}</div></el-form-item>
        <el-form-item label="设置状态">
          <el-radio-group v-model="handleForm.status">
            <el-radio value="accepted">接受</el-radio>
            <el-radio value="completed">完成</el-radio>
            <el-radio value="cancelled">取消</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="handleForm.reply" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { listConsultations, patchConsultation } from '@/api/consult';

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const status = ref('');
const loading = ref(false);
const dialogVisible = ref(false);
const current = ref<any>(null);
const handleForm = reactive({ status: 'accepted', reply: '' });

function statusText(s: string) {
  return { pending: '待处理', accepted: '已接受', completed: '已完成', cancelled: '已取消' }[s] || s;
}
function statusType(s: string) {
  return { pending: 'warning', accepted: 'primary', completed: 'success', cancelled: 'info' }[s] || 'info';
}

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: page.value, pageSize: pageSize.value };
    if (status.value) params.status = status.value;
    const data = await listConsultations(params);
    list.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

function openHandle(row: any) {
  current.value = row;
  handleForm.status = row.status === 'pending' ? 'accepted' : row.status;
  handleForm.reply = row.reply || '';
  dialogVisible.value = true;
}

async function save() {
  await patchConsultation(current.value.id, { ...handleForm });
  ElMessage.success('已处理');
  dialogVisible.value = false;
  load();
}

onMounted(load);
</script>

<style scoped>
.desc {
  padding: 10px 12px;
  background: #f5f6f8;
  border-radius: 4px;
  line-height: 1.6;
}
</style>
