<template>
  <div class="page-container">
    <el-card>
      <div class="toolbar">
        <el-select v-model="status" placeholder="状态" clearable style="width: 160px" @change="load">
          <el-option label="待处理" :value="0" />
          <el-option label="已回复" :value="1" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
      </div>

      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="nickname" label="用户" width="140" />
        <el-table-column prop="content" label="反馈内容" min-width="240" />
        <el-table-column prop="reply" label="回复" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? '已回复' : '待处理' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openReply(row)">回复</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          layout="total, sizes, prev, pager, next" @current-change="load" @size-change="load" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="回复反馈" width="520px">
      <p class="feedback-content">{{ current?.content }}</p>
      <el-input v-model="replyText" type="textarea" :rows="4" placeholder="请输入回复内容" />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { listFeedback, replyFeedback } from '@/api/feedback';

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const status = ref<number | ''>('');
const loading = ref(false);
const dialogVisible = ref(false);
const current = ref<any>(null);
const replyText = ref('');

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: page.value, pageSize: pageSize.value };
    if (status.value !== '') params.status = status.value;
    const data = await listFeedback(params);
    list.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

function openReply(row: any) {
  current.value = row;
  replyText.value = row.reply || '';
  dialogVisible.value = true;
}

async function save() {
  if (!replyText.value.trim()) return ElMessage.warning('请输入回复内容');
  await replyFeedback(current.value.id, replyText.value.trim());
  ElMessage.success('回复成功');
  dialogVisible.value = false;
  load();
}

onMounted(load);
</script>

<style scoped>
.feedback-content {
  padding: 10px 12px;
  background: #f5f6f8;
  border-radius: 4px;
  margin-bottom: 12px;
}
</style>
