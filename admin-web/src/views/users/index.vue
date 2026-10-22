<template>
  <div class="page-container">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="load">
        <el-tab-pane label="普通用户" name="wx" />
        <el-tab-pane label="顾问账号" name="admin" />
      </el-tabs>

      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索昵称/手机号/用户名"
          clearable
          style="width: 240px"
          @keyup.enter="load"
        />
        <el-button type="primary" @click="load">查询</el-button>
        <el-button v-if="activeTab === 'admin'" type="success" @click="openCreate">新增顾问</el-button>
      </div>

      <el-table :data="list" border stripe v-loading="loading">
        <template v-if="activeTab === 'wx'">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column prop="gender" label="性别" width="90" />
          <el-table-column prop="phone" label="手机号" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastLoginAt" label="最后登录" width="180" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="warning" @click="toggleStatus(row)">
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </template>
        <template v-else>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="realName" label="姓名" />
          <el-table-column label="角色" width="160">
            <template #default="{ row }">
              <el-tag v-for="r in row.roles" :key="r" style="margin-right: 4px">{{ r }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastLoginAt" label="最后登录" width="180" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="warning" @click="toggleStatus(row)">
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </template>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </el-card>

    <!-- 新增/编辑顾问 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑顾问' : '新增顾问'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" :disabled="!!editId" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password :placeholder="editId ? '留空则不修改' : '请输入初始密码'" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="选择角色" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
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
import { listUsers, createUser, updateUser, updateUserStatus } from '@/api/user';
import { listRoles } from '@/api/rbac';

const activeTab = ref('wx');
const keyword = ref('');
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const dialogVisible = ref(false);
const editId = ref<number | null>(null);
const roleOptions = ref<any[]>([]);
const form = reactive({ username: '', realName: '', password: '', roleIds: [] as number[] });

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = { type: activeTab.value, page: page.value, pageSize: pageSize.value };
    if (keyword.value) params.keyword = keyword.value;
    const data = await listUsers(params);
    list.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

async function loadRoles() {
  roleOptions.value = await listRoles();
}

function openCreate() {
  editId.value = null;
  Object.assign(form, { username: '', realName: '', password: '', roleIds: [] });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editId.value = row.id;
  Object.assign(form, {
    username: row.username,
    realName: row.realName,
    password: '',
    roleIds: roleOptions.value.filter((r) => row.roles?.includes(r.code)).map((r) => r.id),
  });
  dialogVisible.value = true;
}

async function save() {
  const payload = {
    realName: form.realName,
    roleIds: form.roleIds,
  } as Record<string, any>;
  if (editId.value) {
    if (form.password) payload.password = form.password;
    await updateUser(editId.value, { ...payload, type: 'admin' });
  } else {
    if (!form.username || !form.password) {
      ElMessage.warning('请填写用户名和密码');
      return;
    }
    payload.username = form.username;
    payload.password = form.password;
    await createUser(payload);
  }
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  load();
}

async function toggleStatus(row: any) {
  const next = row.status === 1 ? 0 : 1;
  await updateUserStatus(row.id, next, activeTab.value);
  ElMessage.success('操作成功');
  load();
}

onMounted(() => {
  loadRoles();
  load();
});
</script>
