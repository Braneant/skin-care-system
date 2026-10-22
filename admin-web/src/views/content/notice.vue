<template>
  <div class="page-container">
    <el-card>
      <div class="toolbar">
        <el-button type="success" @click="openCreate">新增公告</el-button>
      </div>

      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '发布' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publish_at" label="发布时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="toggle(row)">{{ row.status === 1 ? '下架' : '发布' }}</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          layout="total, sizes, prev, pager, next" @current-change="load" @size-change="load" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑公告' : '新增公告'" width="560px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="5" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="发布" inactive-text="下架" />
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { listNotices, createNotice, updateNotice, deleteNotice } from '@/api/content';

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const dialogVisible = ref(false);
const editId = ref<number | null>(null);
const form = reactive({ title: '', content: '', status: 1 });

async function load() {
  loading.value = true;
  try {
    const data = await listNotices({ page: page.value, pageSize: pageSize.value });
    list.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editId.value = null;
  Object.assign(form, { title: '', content: '', status: 1 });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editId.value = row.id;
  Object.assign(form, { title: row.title, content: row.content || '', status: row.status });
  dialogVisible.value = true;
}

async function save() {
  if (!form.title) return ElMessage.warning('请输入标题');
  if (editId.value) await updateNotice(editId.value, { ...form });
  else await createNotice({ ...form });
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  load();
}

async function toggle(row: any) {
  await updateNotice(row.id, { status: row.status === 1 ? 0 : 1 });
  load();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除公告「${row.title}」？`, '提示', { type: 'warning' });
  await deleteNotice(row.id);
  ElMessage.success('删除成功');
  load();
}

onMounted(load);
</script>
