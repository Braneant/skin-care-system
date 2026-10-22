<template>
  <div class="dashboard">
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-value">{{ summary.totalUsers ?? '-' }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-value">{{ summary.newUsers7d ?? '-' }}</div>
            <div class="stat-label">近 7 日新增用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-value">{{ summary.activeUsers7d ?? '-' }}</div>
            <div class="stat-label">近 7 日活跃用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-value">{{ summary.totalDetect ?? '-' }}</div>
            <div class="stat-label">累计检测次数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>近 7 日新增用户趋势</template>
          <div ref="userChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>近 7 日活跃用户趋势</template>
          <div ref="activeChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <el-card>
          <template #header>肌肤问题分布</template>
          <div ref="issueChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as echarts from 'echarts';
import { getSummary } from '@/api/dashboard';

const summary = ref<any>({});
const userChartRef = ref<HTMLElement>();
const activeChartRef = ref<HTMLElement>();
const issueChartRef = ref<HTMLElement>();

let charts: echarts.ECharts[] = [];

function renderLine(el: HTMLElement, title: string, data: any[]) {
  const chart = echarts.init(el);
  const dates = data.map((d: any) => d.d);
  const values = data.map((d: any) => d.c);
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: title,
        type: 'line',
        smooth: true,
        data: values,
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#f56c6c' },
      },
    ],
  });
  charts.push(chart);
}

function renderPie(el: HTMLElement, data: any[]) {
  const chart = echarts.init(el);
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: data.map((d: any) => ({ name: d.type, value: d.count })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
      },
    ],
  });
  charts.push(chart);
}

async function load() {
  summary.value = await getSummary();
  if (userChartRef.value) renderLine(userChartRef.value, '新增用户', summary.value.userTrend || []);
  if (activeChartRef.value) renderLine(activeChartRef.value, '活跃用户', summary.value.activeTrend || []);
  if (issueChartRef.value) renderPie(issueChartRef.value, summary.value.issueDist || []);
}

function resize() {
  charts.forEach((c) => c.resize());
}

onMounted(async () => {
  await load();
  window.addEventListener('resize', resize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  charts.forEach((c) => c.dispose());
  charts = [];
});
</script>

<style scoped>
.stat {
  text-align: center;
  padding: 8px 0;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #f56c6c;
}
.stat-label {
  margin-top: 6px;
  color: #909399;
}
.chart-row {
  margin-top: 16px;
}
.chart {
  height: 320px;
}
</style>
