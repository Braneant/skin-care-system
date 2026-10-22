<template>
  <div class="page-container">
    <el-card>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索标题" clearable style="width: 240px" @keyup.enter="load" />
        <el-select v-model="status" placeholder="状态" clearable style="width: 140px" @change="load">
          <el-option label="已发布" :value="1" />
          <el-option label="已下架" :value="0" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button type="success" @click="openCreate">新增文章</el-button>
      </div>

      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="view_count" label="浏览量" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '发布' : '下架' }}</el-tag>
          </template>
        </el-table-column>
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

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑文章' : '新增文章'" width="720px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="作者"><el-input v-model="form.author" /></el-form-item>
        <el-form-item label="封面URL"><el-input v-model="form.coverUrl" placeholder="可选，图片链接" /></el-form-item>
        <el-form-item label="内容（HTML）">
          <el-input v-model="form.content" type="textarea" :rows="10" placeholder="支持富文本 HTML，MVP 可直接粘贴 HTML 或纯文本" />
        </el-form-item>
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
import { listArticles, createArticle, updateArticle, deleteArticle } from '@/api/content';

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const status = ref<number | ''>('');
const loading = ref(false);
const dialogVisible = ref(false);
const editId = ref<number | null>(null);
const form = reactive({ title: '', author: '平台小编', coverUrl: '', content: '', status: 1 });

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: page.value, pageSize: pageSize.value };
    if (keyword.value) params.keyword = keyword.value;
    if (status.value !== '') params.status = status.value;
    const data = await listArticles(params);
    list.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editId.value = null;
  Object.assign(form, { title: '', author: '平台小编', coverUrl: '', content: '', status: 1 });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editId.value = row.id;
  Object.assign(form, {
    title: row.title,
    author: row.author,
    coverUrl: row.cover_url || '',
    content: row.content || '',
    status: row.status,
  });
  dialogVisible.value = true;
}

async function save() {
  if (!form.title) return ElMessage.warning('请输入标题');
  const payload = { ...form };
  if (editId.value) await updateArticle(editId.value, payload);
  else await createArticle(payload);
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  load();
}

async function toggle(row: any) {
  await updateArticle(row.id, { status: row.status === 1 ? 0 : 1 });
  load();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除文章「${row.title}」？`, '提示', { type: 'warning' });
  await deleteArticle(row.id);
  ElMessage.success('删除成功');
  load();
}

onMounted(load);
</script>
