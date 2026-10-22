<template>
  <div class="page-container">
    <el-card>
      <div class="toolbar">
        <el-select v-model="dictType" placeholder="全部类型" clearable style="width: 200px" @change="load">
          <el-option label="肤质类型" value="skin_type" />
          <el-option label="肌肤问题" value="issue" />
          <el-option label="风险等级" value="risk" />
          <el-option label="成分" value="ingredient" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button type="success" @click="openCreate">新增字典项</el-button>
      </div>

      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="dict_type" label="类型" width="120" />
        <el-table-column prop="dict_code" label="编码" width="140" />
        <el-table-column prop="dict_name" label="名称" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑字典项' : '新增字典项'" width="520px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="类型">
          <el-select v-model="form.dictType" :disabled="!!editId" style="width: 100%">
            <el-option label="肤质类型" value="skin_type" />
            <el-option label="肌肤问题" value="issue" />
            <el-option label="风险等级" value="risk" />
            <el-option label="成分" value="ingredient" />
          </el-select>
        </el-form-item>
        <el-form-item label="编码"><el-input v-model="form.dictCode" :disabled="!!editId" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="form.dictName" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>
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
import { listSkinDict, createSkinDict, updateSkinDict, deleteSkinDict } from '@/api/skinDict';

const list = ref<any[]>([]);
const dictType = ref('');
const loading = ref(false);
const dialogVisible = ref(false);
const editId = ref<number | null>(null);
const form = reactive({ dictType: '', dictCode: '', dictName: '', sort: 0, remark: '', status: 1 });

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = {};
    if (dictType.value) params.dictType = dictType.value;
    list.value = await listSkinDict(params);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editId.value = null;
  Object.assign(form, { dictType: '', dictCode: '', dictName: '', sort: 0, remark: '', status: 1 });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editId.value = row.id;
  Object.assign(form, {
    dictType: row.dict_type,
    dictCode: row.dict_code,
    dictName: row.dict_name,
    sort: row.sort || 0,
    remark: row.remark || '',
    status: row.status,
  });
  dialogVisible.value = true;
}

async function save() {
  if (!form.dictType || !form.dictCode || !form.dictName) {
    return ElMessage.warning('请填写类型/编码/名称');
  }
  if (editId.value) await updateSkinDict(editId.value, { ...form });
  else await createSkinDict({ ...form });
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  load();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除「${row.dict_name}」？`, '提示', { type: 'warning' });
  await deleteSkinDict(row.id);
  ElMessage.success('删除成功');
  load();
}

onMounted(load);
</script>
