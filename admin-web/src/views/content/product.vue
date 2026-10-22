<template>
  <div class="page-container">
    <el-card>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索名称/品牌" clearable style="width: 240px" @keyup.enter="load" />
        <el-button type="primary" @click="load">查询</el-button>
        <el-button type="success" @click="openCreate">新增产品</el-button>
      </div>

      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="产品名称" min-width="160" />
        <el-table-column prop="brand" label="品牌" width="120" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="toggle(row)">{{ row.status === 1 ? '下架' : '上架' }}</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          layout="total, sizes, prev, pager, next" @current-change="load" @size-change="load" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑产品' : '新增产品'" width="640px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="品牌"><el-input v-model="form.brand" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" /></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="form.imageUrl" placeholder="可选" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="成分（逗号分隔）">
          <el-input v-model="ingredientsText" type="textarea" :rows="2" placeholder="如：神经酰胺,透明质酸" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
import { listProducts, createProduct, updateProduct, deleteProduct } from '@/api/content';

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const loading = ref(false);
const dialogVisible = ref(false);
const editId = ref<number | null>(null);
const ingredientsText = ref('');
const form = reactive({ name: '', brand: '', category: '', imageUrl: '', description: '', status: 1 });

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: page.value, pageSize: pageSize.value };
    if (keyword.value) params.keyword = keyword.value;
    const data = await listProducts(params);
    list.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editId.value = null;
  ingredientsText.value = '';
  Object.assign(form, { name: '', brand: '', category: '', imageUrl: '', description: '', status: 1 });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editId.value = row.id;
  Object.assign(form, {
    name: row.name,
    brand: row.brand || '',
    category: row.category || '',
    imageUrl: row.image_url || '',
    description: row.description || '',
    status: row.status,
  });
  ingredientsText.value = (row.ingredients || []).join(',');
  dialogVisible.value = true;
}

async function save() {
  if (!form.name) return ElMessage.warning('请输入产品名称');
  const ingredients = ingredientsText.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  const payload = { ...form, ingredients };
  if (editId.value) await updateProduct(editId.value, payload);
  else await createProduct(payload);
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  load();
}

async function toggle(row: any) {
  await updateProduct(row.id, { status: row.status === 1 ? 0 : 1 });
  load();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除产品「${row.name}」？`, '提示', { type: 'warning' });
  await deleteProduct(row.id);
  ElMessage.success('删除成功');
  load();
}

onMounted(load);
</script>
