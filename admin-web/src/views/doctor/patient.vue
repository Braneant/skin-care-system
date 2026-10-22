<template>
  <div class="page-container">
    <el-page-header content="患者档案" @back="$router.back()" style="margin-bottom: 16px" />

    <template v-if="data">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-card>
            <template #header>基本信息</template>
            <div class="patient-info">
              <el-avatar :size="64" :src="data.user.avatarUrl || undefined">
                {{ (data.user.nickname || '患')[0] }}
              </el-avatar>
              <div>
                <div class="name">{{ data.user.nickname || '未命名' }}</div>
                <div class="meta">性别：{{ data.user.gender }} · 手机：{{ data.user.phone || '-' }}</div>
              </div>
            </div>
            <el-descriptions :column="1" border style="margin-top: 12px">
              <el-descriptions-item label="肤质">{{ data.profile?.skinType || '未建档' }}</el-descriptions-item>
              <el-descriptions-item label="敏感度">{{ data.profile?.sensitivity ?? '-' }} / 3</el-descriptions-item>
              <el-descriptions-item label="自评问题">
                {{ (data.profile?.concerns || []).join('、') || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="生活习惯">
                <div v-if="data.profile?.habits">{{ JSON.stringify(data.profile.habits) }}</div>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>
            <el-image
              v-if="data.profile?.photoUrl"
              :src="data.profile.photoUrl"
              fit="cover"
              style="width: 100%; margin-top: 12px; border-radius: 6px"
              :preview-src-list="[data.profile.photoUrl]"
              preview-teleported
            />
          </el-card>
        </el-col>

        <el-col :span="16">
          <el-card>
            <template #header>肌肤趋势</template>
            <div ref="trendRef" class="trend-chart"></div>
          </el-card>

          <el-card style="margin-top: 16px">
            <template #header>历次检测报告</template>
            <el-timeline v-if="data.detectRecords.length">
              <el-timeline-item
                v-for="r in data.detectRecords"
                :key="r.id"
                :timestamp="r.createdAt"
                placement="top"
              >
                <el-card shadow="never">
                  <div class="report-head">
                    <el-tag :type="r.engine === 'deepseek' ? 'primary' : 'info'">{{ r.engine }}</el-tag>
                    <el-tag style="margin-left: 8px">{{ r.skinType }}</el-tag>
                    <el-tag style="margin-left: 8px" :type="riskType(r.riskLevel)">{{ r.riskLevel }}</el-tag>
                    <b style="margin-left: 8px">{{ r.score }} 分</b>
                  </div>
                  <div class="report-text">{{ r.reportText }}</div>
                  <div v-if="r.issues.length" class="issues">
                    <el-tag v-for="i in r.issues" :key="i.type + i.location" size="small" style="margin: 0 4px 2px 0">
                      {{ i.type }}·{{ i.level }}（{{ i.location }}）
                    </el-tag>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无检测记录" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="12">
          <el-card>
            <template #header>专业建议历史</template>
            <el-timeline v-if="data.advice.length">
              <el-timeline-item v-for="a in data.advice" :key="a.id" :timestamp="a.createdAt">
                <div>{{ a.content }}</div>
                <div class="doctor-name">— {{ a.doctorName || '医生' }}</div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无建议" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>撰写建议</template>
            <el-form label-position="top">
              <el-form-item label="建议内容">
                <el-input v-model="adviceForm.content" type="textarea" :rows="5" placeholder="请输入专业建议" />
              </el-form-item>
              <el-form-item label="关联检测记录（可选）">
                <el-select v-model="adviceForm.detectRecordId" clearable placeholder="选择检测记录" style="width: 100%">
                  <el-option
                    v-for="r in data.detectRecords"
                    :key="r.id"
                    :label="`#${r.id} ${r.createdAt} ${r.score}分`"
                    :value="r.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="adviceForm.saveAsTemplate">同时保存为我的模板</el-checkbox>
              </el-form-item>
              <el-form-item v-if="adviceForm.saveAsTemplate" label="模板标题">
                <el-input v-model="adviceForm.templateTitle" placeholder="模板标题" />
              </el-form-item>
              <el-button type="primary" :loading="saving" @click="submitAdvice">提交建议</el-button>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { getPatient, getPatientTrend, writeAdvice } from '@/api/patient';

const route = useRoute();
const userId = Number(route.params.id);
const data = ref<any>(null);
const trendRef = ref<HTMLElement>();
const saving = ref(false);
let chart: echarts.ECharts | null = null;

const adviceForm = reactive({
  content: '',
  detectRecordId: null as number | null,
  saveAsTemplate: false,
  templateTitle: '',
});

function riskType(level: string) {
  if (level === '良好') return 'success';
  if (level === '一般') return 'primary';
  if (level === '需关注') return 'warning';
  return 'danger';
}

function renderTrend(trend: any[]) {
  if (!trendRef.value) return;
  chart = echarts.init(trendRef.value);
  const dates = trend.map((t) => t.date);
  const scores = trend.map((t) => t.score);
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['得分'] },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', max: 100 },
    series: [{ name: '得分', type: 'line', smooth: true, data: scores, areaStyle: { opacity: 0.15 } }],
  });
}

async function load() {
  const [info, trend] = await Promise.all([getPatient(userId), getPatientTrend(userId, 30)]);
  data.value = info;
  await nextTick();
  renderTrend(trend);
}

async function submitAdvice() {
  if (!adviceForm.content.trim()) return ElMessage.warning('请输入建议内容');
  saving.value = true;
  try {
    await writeAdvice(userId, { ...adviceForm });
    ElMessage.success('建议已提交');
    adviceForm.content = '';
    adviceForm.detectRecordId = null;
    adviceForm.saveAsTemplate = false;
    adviceForm.templateTitle = '';
    load();
  } finally {
    saving.value = false;
  }
}

onMounted(load);
onBeforeUnmount(() => chart?.dispose());
</script>

<style scoped>
.patient-info {
  display: flex;
  gap: 12px;
  align-items: center;
}
.patient-info .name {
  font-size: 18px;
  font-weight: 600;
}
.patient-info .meta {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}
.trend-chart {
  height: 260px;
}
.report-head {
  display: flex;
  align-items: center;
}
.report-text {
  margin: 8px 0;
  color: #606266;
  line-height: 1.6;
}
.doctor-name {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
</style>
