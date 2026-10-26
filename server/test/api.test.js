'use strict';

/**
 * 后端核心接口回归测试（黑盒 HTTP 测试）
 * 前置：后端已启动（默认 http://localhost:3000）
 * 运行：node test/api.test.js
 * 说明：仅使用 Node 内置 fetch，不引入额外测试框架；对正在运行的 dev 服务发起真实请求。
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// 1x1 透明 PNG（合法图片，用于 AI 检测/上传）
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, name, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`  ✅ PASS  ${name}`);
  } else {
    failed += 1;
    const msg = `${name}${detail ? ' | ' + detail : ''}`;
    failures.push(msg);
    console.log(`  ❌ FAIL  ${msg}`);
  }
}

async function req(method, path, { token, wxToken, body, rawBody, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  if (wxToken) h['Wx-Authorization'] = `Bearer ${wxToken}`;
  if (body !== undefined) {
    h['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : rawBody,
  });
  let json = null;
  let text = '';
  try {
    text = await res.text();
    json = JSON.parse(text);
  } catch (e) {
    json = null;
  }
  return { status: res.status, json, text };
}

function fmt(res) {
  if (res.json) return `HTTP ${res.status} code=${res.json.code} msg=${JSON.stringify(res.json.msg)}`;
  return `HTTP ${res.status} body=${res.text.slice(0, 120)}`;
}

async function main() {
  console.log('==============================================');
  console.log('  后端核心接口回归测试  base=' + BASE);
  console.log('==============================================\n');

  // ---------- 1. 健康检查 ----------
  console.log('【1. 健康检查】');
  let r = await req('GET', '/api/health');
  assert(r.status === 200 && r.json && r.json.code === 0, 'GET /api/health 返回 code=0', fmt(r));

  // ---------- 2. 后台登录 ----------
  console.log('\n【2. 后台登录】');
  r = await req('POST', '/api/admin/auth/login', { body: { username: 'admin', password: 'admin123' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.token, 'admin/admin123 登录成功', fmt(r));
  const adminToken = r.json && r.json.data && r.json.data.token;
  assert(Array.isArray(r.json.data.roles) && r.json.data.roles.includes('admin'), 'admin 角色为 admin', JSON.stringify(r.json && r.json.data && r.json.data.roles));

  r = await req('POST', '/api/admin/auth/login', { body: { username: 'doctor', password: 'doctor123' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.token, 'doctor/doctor123 登录成功', fmt(r));
  const doctorToken = r.json && r.json.data && r.json.data.token;
  assert(Array.isArray(r.json.data.roles) && r.json.data.roles.includes('doctor'), 'doctor 角色为 doctor', JSON.stringify(r.json && r.json.data && r.json.data.roles));

  // 登录异常
  r = await req('POST', '/api/admin/auth/login', { body: { username: 'admin', password: 'wrong' } });
  assert(r.status === 401 && r.json && r.json.code === 401, '错误密码返回 401', fmt(r));
  r = await req('POST', '/api/admin/auth/login', { body: {} });
  assert(r.status === 400 && r.json && r.json.code === 400, '空登录体返回 400', fmt(r));

  // ---------- 3. /users/me 菜单树 ----------
  console.log('\n【3. /users/me 菜单树】');
  r = await req('GET', '/api/admin/users/me', { token: adminToken });
  assert(r.status === 200 && r.json && r.json.code === 0, 'admin /users/me 返回成功', fmt(r));
  const adminMenus = (r.json && r.json.data && r.json.data.menus) || [];
  const adminMenuCodes = collectMenuCodes(adminMenus);
  const expectAdminMenus = ['dashboard:view', 'system:user:list', 'system:role:list', 'content:article:list', 'content:product:list', 'content:notice:list', 'skin:dict:list', 'feedback:list', 'detect:record:list', 'doctor:patient:view', 'doctor:consult:handle'];
  for (const c of expectAdminMenus) {
    assert(adminMenuCodes.includes(c), `admin 菜单含 ${c}`, JSON.stringify(adminMenuCodes));
  }

  r = await req('GET', '/api/admin/users/me', { token: doctorToken });
  assert(r.status === 200 && r.json && r.json.code === 0, 'doctor /users/me 返回成功', fmt(r));
  const doctorMenus = (r.json && r.json.data && r.json.data.menus) || [];
  const doctorMenuCodes = collectMenuCodes(doctorMenus);
  assert(doctorMenuCodes.includes('doctor:patient:view'), 'doctor 菜单含医生工作台首页', JSON.stringify(doctorMenuCodes));
  assert(doctorMenuCodes.includes('doctor:consult:handle'), 'doctor 菜单含咨询预约', JSON.stringify(doctorMenuCodes));
  // 按架构 §9.6：doctor 无 RBAC/内容/字典/反馈
  for (const forbidden of ['system:role:list', 'content:article:list', 'content:product:list', 'content:notice:list', 'skin:dict:list', 'feedback:list']) {
    assert(!doctorMenuCodes.includes(forbidden), `doctor 菜单不含 ${forbidden}（越权隔离）`, JSON.stringify(doctorMenuCodes));
  }

  // ---------- 4. RBAC 越权 ----------
  console.log('\n【4. RBAC 越权】');
  r = await req('GET', '/api/admin/roles', { token: adminToken });
  assert(r.status === 200 && r.json && r.json.code === 0, 'admin 可访问 /roles', fmt(r));
  r = await req('GET', '/api/admin/roles', { token: doctorToken });
  assert(r.status === 403 && r.json && r.json.code === 403, 'doctor 访问 /roles 返回 403', fmt(r));
  r = await req('GET', '/api/admin/roles');
  assert(r.status === 401 && r.json && r.json.code === 401, '未带 token 访问 /roles 返回 401', fmt(r));
  r = await req('GET', '/api/admin/roles', { token: 'forged.invalid.token' });
  assert(r.status === 401 && r.json && r.json.code === 401, '伪造 token 访问 /roles 返回 401', fmt(r));

  // ---------- 5. 微信登录 ----------
  console.log('\n【5. 微信登录】');
  r = await req('POST', '/api/wx/auth/login', { body: { code: 'qa_test_code_001' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.token, 'wx 登录（开发兜底）成功', fmt(r));
  const wxToken = r.json && r.json.data && r.json.data.token;
  assert(typeof r.json.data.userInfo === 'object', 'wx 登录返回 userInfo', fmt(r));

  // 双鉴权隔离：wx token 访问 admin、admin token 访问 wx
  r = await req('GET', '/api/admin/users/me', { token: wxToken });
  assert(r.status === 401 && r.json && r.json.code === 401, 'wx token 访问 admin 接口返回 401（隔离）', fmt(r));
  r = await req('GET', '/api/wx/users/me', { wxToken: adminToken });
  assert(r.status === 401 && r.json && r.json.code === 401, 'admin token 访问 wx 接口返回 401（隔离）', fmt(r));
  r = await req('GET', '/api/wx/users/me');
  assert(r.status === 401 && r.json && r.json.code === 401, '未带 token 访问 wx 接口返回 401', fmt(r));

  r = await req('POST', '/api/wx/auth/login', { body: {} });
  assert(r.status === 400 && r.json && r.json.code === 400, 'wx 登录缺少 code 返回 400', fmt(r));

  // ---------- 6. AI 检测 ----------
  console.log('\n【6. AI 检测 /detect/analyze】');
  r = await req('POST', '/api/wx/detect/analyze', { wxToken, body: { imageBase64: TINY_PNG_BASE64 } });
  assert(r.status === 200 && r.json && r.json.code === 0, 'analyze 返回成功', fmt(r));
  const report = r.json && r.json.data;
  // engine 取决于环境配置：无 DEEPSEEK_API_KEY→local，有→deepseek（两者均合法）
  assert(report && ['local', 'deepseek'].includes(report.engine), 'engine 为 local/deepseek（按配置）', report && `engine=${report.engine}`);
  assert(report && typeof report.score === 'number' && report.score >= 0 && report.score <= 100, 'score 为 0-100 数字', report && `score=${report.score}`);
  assert(report && typeof report.skinType === 'string', '返回 skinType', report && `skinType=${report.skinType}`);
  assert(report && Array.isArray(report.issues), '返回 issues 数组', report && `issues=${report.issues.length}条`);
  assert(report && typeof report.riskLevel === 'string' && ['良好', '一般', '需关注', '高风险'].includes(report.riskLevel), 'riskLevel 合法', report && `riskLevel=${report.riskLevel}`);
  assert(report && report.plan && report.plan.planId, '自动生成方案 plan', report && JSON.stringify(report.plan && report.plan.title));
  assert(report && Array.isArray(report.plan.routineMorning) && report.plan.routineMorning.length > 0, '方案含晨间步骤', '');
  const detectId = report && report.detectId;

  // analyze 异常
  r = await req('POST', '/api/wx/detect/analyze', { wxToken, body: {} });
  assert(r.status === 400 && r.json && r.json.code === 400, 'analyze 缺少图片返回 400', fmt(r));
  r = await req('POST', '/api/wx/detect/analyze', { wxToken, body: { imageBase64: 'AA==' } });
  assert(r.status === 200 && r.json && r.json.code === 20001, '非法图片格式返回 20001', fmt(r));

  // 检测记录列表/详情
  r = await req('GET', '/api/wx/detect', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data), 'GET /wx/detect 列表成功', fmt(r));
  r = await req('GET', `/api/wx/detect/${detectId}`, { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.id === detectId, 'GET /wx/detect/:id 详情成功', fmt(r));
  r = await req('GET', '/api/wx/detect/999999999', { wxToken });
  assert(r.status === 404 && r.json && r.json.code === 404, '不存在的检测记录返回 404', fmt(r));

  // ---------- 7. 打卡 + 趋势 ----------
  console.log('\n【7. 打卡与趋势】');
  r = await req('POST', '/api/wx/checkin', { wxToken, body: { type: 'cleanse' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.cleanse === true, '打卡 cleanse 成功', fmt(r));
  // 幂等：再次打卡保湿，不应产生重复记录，且补卡覆盖
  r = await req('POST', '/api/wx/checkin', { wxToken, body: { type: 'moisturize' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.moisturize === true && r.json.data.cleanse === true, '二次打卡保湿（幂等补卡，保留已打项）', fmt(r));
  r = await req('GET', '/api/wx/checkin/today', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.cleanse === true && r.json.data.moisturize === true, 'GET /checkin/today 返回今日打卡', fmt(r));
  r = await req('GET', '/api/wx/trend', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data), 'GET /wx/trend 返回趋势数组', fmt(r));

  // ---------- 8. 看板 ----------
  console.log('\n【8. 看板汇总】');
  r = await req('GET', '/api/admin/dashboard/summary', { token: adminToken });
  assert(r.status === 200 && r.json && r.json.code === 0, 'admin 看板 summary 成功', fmt(r));
  const dash = r.json && r.json.data;
  assert(dash && typeof dash.totalUsers === 'number' && typeof dash.totalDetect === 'number' && typeof dash.activeUsers7d === 'number', '看板含 totalUsers/totalDetect/activeUsers7d', JSON.stringify(dash && { totalUsers: dash.totalUsers, totalDetect: dash.totalDetect, activeUsers7d: dash.activeUsers7d }));
  assert(Array.isArray(dash.userTrend) && Array.isArray(dash.activeTrend) && Array.isArray(dash.issueDist), '看板含三组趋势/分布数据', '');

  // ---------- 9. 医生工作台：患者 ----------
  console.log('\n【9. 医生工作台：患者】');
  r = await req('GET', '/api/admin/patients', { token: doctorToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data.list), 'GET /patients 列表成功', fmt(r));
  const patientId = r.json.data.list && r.json.data.list.length ? r.json.data.list[0].id : null;
  assert(Number.isInteger(patientId) && patientId > 0, '患者列表存在记录', `patientId=${patientId}`);

  if (patientId) {
    r = await req('GET', `/api/admin/patients/${patientId}`, { token: doctorToken });
    assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.user, 'GET /patients/:id 完整档案成功', fmt(r));
    r = await req('POST', `/api/admin/patients/${patientId}/advice`, { token: doctorToken, body: { content: 'QA 测试建议：请保持每日保湿与防晒。', saveAsTemplate: true, templateTitle: 'QA测试模板' } });
    assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.adviceId, 'POST /patients/:id/advice 撰写建议成功', fmt(r));
    r = await req('POST', `/api/admin/patients/${patientId}/advice`, { token: doctorToken, body: { content: '' } });
    assert(r.status === 400 && r.json && r.json.code === 400, '建议内容为空返回 400', fmt(r));
  }
  r = await req('GET', '/api/admin/patients/999999999', { token: doctorToken });
  assert(r.status === 404 && r.json && r.json.code === 404, '不存在的患者返回 404', fmt(r));
  r = await req('POST', '/api/admin/patients/999999999/advice', { token: doctorToken, body: { content: 'x' } });
  assert(r.status === 404 && r.json && r.json.code === 404, '给不存在患者写建议返回 404', fmt(r));

  // ---------- 10. 内容 / 反馈 / 字典 ----------
  console.log('\n【10. 内容 / 反馈 / 字典】');
  r = await req('GET', '/api/wx/articles', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data.list), 'GET /wx/articles 列表成功', fmt(r));
  r = await req('POST', '/api/wx/feedback', { wxToken, body: { content: 'QA 测试反馈内容' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.feedbackId, 'POST /wx/feedback 提交成功', fmt(r));
  r = await req('POST', '/api/wx/feedback', { wxToken, body: { content: '' } });
  assert(r.status === 400 && r.json && r.json.code === 400, '反馈内容为空返回 400', fmt(r));
  r = await req('GET', '/api/admin/skin-dict', { token: adminToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data), 'GET /admin/skin-dict 成功', fmt(r));

  // ---------- 11. 超长参数 & 非法 JSON & 软删除 ----------
  console.log('\n【11. 边界与异常】');
  // 超长昵称（应截断到 64）
  r = await req('PUT', '/api/wx/users/me', { wxToken, body: { nickname: 'N'.repeat(200) } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.nickname && r.json.data.nickname.length <= 64, '超长昵称截断为 64', r.json && r.json.data && `len=${r.json.data.nickname.length}`);

  // 非法 JSON
  r = await req('POST', '/api/admin/auth/login', { rawBody: '{invalid json', headers: { 'Content-Type': 'application/json' } });
  assert(r.json !== null && r.json.code !== undefined, '非法 JSON 返回结构化错误（不崩溃）', fmt(r));

  // 软删除：创建→删除→不可见
  r = await req('POST', '/api/admin/articles', { token: adminToken, body: { title: 'QA 软删除测试文章', content: 'test' } });
  const artId = r.json && r.json.data && r.json.data.id;
  assert(r.status === 200 && r.json && r.json.code === 0 && Number.isInteger(artId), '创建文章成功（用于软删除）', fmt(r));
  if (artId) {
    r = await req('DELETE', `/api/admin/articles/${artId}`, { token: adminToken });
    assert(r.status === 200 && r.json && r.json.code === 0, '删除文章成功', fmt(r));
    r = await req('GET', '/api/wx/articles', { wxToken });
    const titles = (r.json && r.json.data && r.json.data.list || []).map((a) => a.id);
    assert(!titles.includes(artId), '软删除文章不再返回（wx 列表）', `id=${artId}`);
    r = await req('GET', `/api/wx/articles/${artId}`, { wxToken });
    assert(r.status === 404 && r.json && r.json.code === 404, '软删除文章详情返回 404', fmt(r));
  }

  // 不存在的资源
  r = await req('GET', '/api/admin/roles/999999999', { token: adminToken });
  assert(r.status === 404 && r.json && r.json.code === 404, '不存在的角色返回 404', fmt(r));

  // ---------- 汇总 ----------
  console.log('\n==============================================');
  console.log(`  汇总：通过 ${passed} / 失败 ${failed}（共 ${passed + failed} 项）`);
  if (failures.length) {
    console.log('\n  失败项明细：');
    failures.forEach((f) => console.log('    - ' + f));
  }
  console.log('==============================================');
  process.exit(failed > 0 ? 1 : 0);
}

/** 收集菜单树中所有节点的 code（含容器） */
function collectMenuCodes(menus, acc = []) {
  for (const m of menus || []) {
    if (m && m.code) acc.push(m.code);
    if (m && Array.isArray(m.children)) collectMenuCodes(m.children, acc);
  }
  return acc;
}

main().catch((e) => {
  console.error('测试脚本异常：', e);
  process.exit(2);
});
