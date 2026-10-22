<template>
  <div class="page-container">
    <el-card>
      <div class="toolbar">
        <el-button type="success" @click="openCreate">新增角色</el-button>
      </div>

      <el-table :data="roles" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="code" label="角色编码" />
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑/分配权限</el-button>
            <el-button
              link
              type="danger"
              :disabled="['admin', 'doctor'].includes(row.code)"
              @click="onDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑角色' : '新增角色'" width="560px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="角色编码">
          <el-input v-model="form.code" :disabled="!!editId" placeholder="如 nurse" />
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input v-model="form.name" placeholder="如 护士" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <el-form-item label="权限分配">
          <el-tree
            ref="treeRef"
            :data="permTree"
            show-checkbox
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            default-expand-all
          />
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
} from '@/api/rbac';

const roles = ref<any[]>([]);
const permTree = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editId = ref<number | null>(null);
const treeRef = ref<any>();
const form = reactive({ code: '', name: '', remark: '' });

async function load() {
  loading.value = true;
  try {
    roles.value = await listRoles();
  } finally {
    loading.value = false;
  }
}

async function loadPerms() {
  permTree.value = await listPermissions();
}

function openCreate() {
  editId.value = null;
  Object.assign(form, { code: '', name: '', remark: '' });
  dialogVisible.value = true;
  nextTick(() => treeRef.value?.setCheckedKeys([]));
}

async function openEdit(row: any) {
  editId.value = row.id;
  Object.assign(form, { code: row.code, name: row.name, remark: row.remark });
  dialogVisible.value = true;
  const detail = await getRole(row.id);
  await nextTick();
  treeRef.value?.setCheckedKeys(detail.permissionIds || []);
}

async function save() {
  if (!form.code || !form.name) {
    ElMessage.warning('请填写角色编码与名称');
    return;
  }
  const checked = treeRef.value?.getCheckedKeys() || [];
  const halfChecked = treeRef.value?.getHalfCheckedKeys() || [];
  const permissionIds = [...checked, ...halfChecked];

  if (editId.value) {
    await updateRole(editId.value, { name: form.name, remark: form.remark, permissionIds });
  } else {
    await createRole({ code: form.code, name: form.name, remark: form.remark });
    // 新建后如需分配权限，需重新加载角色再编辑；此处简化：仅创建
  }
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  load();
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除角色「${row.name}」？`, '提示', { type: 'warning' });
  await deleteRole(row.id);
  ElMessage.success('删除成功');
  load();
}

onMounted(() => {
  load();
  loadPerms();
});
</script>
