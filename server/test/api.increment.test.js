'use strict';

/**
 * A/B/C 三大增量回归测试（黑盒 HTTP）
 * 前置：后端已启动（默认 http://localhost:3000）
 * 运行：node test/api.increment.test.js
 * 覆盖：Phase A（习惯/徽章/待办/周历/方案进度）、Phase B（成分/产品匹配/方案绑定/产品柜/开封/使用记录）、
 *       Phase C（UV/季节/复测/提醒/照片日记/报告时间轴/随访）+ 边界异常
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000';

const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const TINY_PNG_BUF = Buffer.from(TINY_PNG_B64, 'base64');

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
  if (body !== undefined) h['Content-Type'] = 'application/json';
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

async function reqForm(method, path, formData, wxToken) {
  const h = {};
  if (wxToken) h['Wx-Authorization'] = `Bearer ${wxToken}`;
  const res = await fetch(`${BASE}${path}`, { method, headers: h, body: formData });
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
  console.log('  A/B/C 三大增量回归测试  base=' + BASE);
  console.log('==============================================\n');

  // ===== 登录 =====
  console.log('【0. 登录】');
  let r = await req('POST', '/api/admin/auth/login', { body: { username: 'admin', password: 'admin123' } });
  const adminToken = r.json && r.json.data && r.json.data.token;
  assert(!!adminToken, 'admin 登录', fmt(r));
  r = await req('POST', '/api/admin/auth/login', { body: { username: 'doctor', password: 'doctor123' } });
  const doctorToken = r.json && r.json.data && r.json.data.token;
  assert(!!doctorToken, 'doctor 登录', fmt(r));
  r = await req('POST', '/api/wx/auth/login', { body: { code: 'qa_inc_' + Date.now() } });
  const wxToken = r.json && r.json.data && r.json.data.token;
  assert(!!wxToken, 'wx 登录（开发兜底）', fmt(r));
  const wxUserId = r.json.data.userInfo && r.json.data.userInfo.id;

  // ===== RBAC =====
  console.log('\n【1. RBAC 权限（Phase B/C 新权限码）】');
  r = await req('GET', '/api/admin/ingredients', { token: adminToken });
  assert(r.status === 200 && r.json && r.json.code === 0, 'admin 访问 /admin/ingredients 成功', fmt(r));
  r = await req('GET', '/api/admin/ingredients', { token: doctorToken });
  assert(r.status === 403 && r.json && r.json.code === 403, 'doctor 访问 /admin/ingredients 返回 403', fmt(r));
  r = await req('GET', '/api/admin/followup', { token: doctorToken });
  assert(r.status === 200 && r.json && r.json.code === 0, 'doctor 访问 /admin/followup 成功（doctor:followup:handle）', fmt(r));
  r = await req('GET', '/api/admin/followup');
  assert(r.status === 401 && r.json && r.json.code === 401, '无 token 访问 /admin/followup 返回 401', fmt(r));

  // ===== 肌肤档案（供匹配度测试） =====
  console.log('\n【2. 肌肤档案】');
  r = await req('POST', '/api/wx/skin-profile/survey', { wxToken, body: { skinType: '油性', sensitivity: 2, concerns: ['痘痘'] } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.skinType === '油性', '提交问卷 skinType=油性', fmt(r));

  // ===== Phase A：打卡 / 统计 / 周历 / 徽章 / 首页 =====
  console.log('\n【3. Phase A：打卡统计 / 周历 / 徽章 / 首页】');
  r = await req('GET', '/api/wx/checkin/stats', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && typeof r.json.data.streak === 'number', 'GET /checkin/stats 成功', fmt(r));

  r = await req('POST', '/api/wx/checkin', { wxToken, body: { type: 'cleanse' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.cleanse === true, '打卡 cleanse 成功', fmt(r));
  assert(Array.isArray(r.json.data.newBadges) && r.json.data.newBadges.includes('first_day'), '首次打卡发放 first_day 徽章', JSON.stringify(r.json.data.newBadges));

  r = await req('POST', '/api/wx/checkin', { wxToken, body: { type: 'moisturize' } });
  assert(r.status === 200 && r.json && r.json.code === 0, '再次打卡 moisturize 成功', fmt(r));
  assert(!(r.json.data.newBadges || []).includes('first_day'), '重复打卡不重复发放 first_day', JSON.stringify(r.json.data.newBadges));
  r = await req('POST', '/api/wx/checkin', { wxToken, body: { type: 'sunscreen' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.sunscreen === true, '打卡 sunscreen 成功', fmt(r));

  r = await req('GET', '/api/wx/checkin/stats', { wxToken });
  const st = r.json.data;
  assert(st && st.totalDays >= 1 && st.streak >= 1, 'stats 累计/streak ≥1', JSON.stringify({ totalDays: st.totalDays, streak: st.streak }));
  assert(st && st.todayDone === 3 && st.todayTotal === 3, 'stats 今日完成 3/3', JSON.stringify({ todayDone: st.todayDone, todayTotal: st.todayTotal }));
  assert(st && typeof st.weekRate === 'number' && st.weekRate >= 0 && st.weekRate <= 1, 'stats weekRate ∈[0,1]', JSON.stringify({ weekRate: st.weekRate }));

  r = await req('GET', '/api/wx/checkin/calendar?days=7', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data) && r.json.data.length === 7, 'GET /checkin/calendar?days=7 返回 7 天', fmt(r));
  const todayCal = r.json.data[r.json.data.length - 1];
  assert(todayCal && todayCal.isToday === true, '日历最后一项 isToday=true', JSON.stringify(todayCal));
  assert(todayCal && todayCal.cleanse === 1 && todayCal.moisturize === 1 && todayCal.sunscreen === 1, '今日日历三项全完成', JSON.stringify(todayCal));

  r = await req('GET', '/api/wx/badges', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data), 'GET /badges 成功', fmt(r));
  const firstBadge = r.json.data.find((b) => b.code === 'first_day');
  assert(firstBadge && firstBadge.earned === true, 'first_day 徽章 earned=true', JSON.stringify(firstBadge));
  const streak7 = r.json.data.find((b) => b.code === 'streak_7');
  assert(streak7 && streak7.earned === false && typeof streak7.progress === 'string', 'streak_7 未解锁且含进度', JSON.stringify(streak7));

  r = await req('GET', '/api/wx/home/summary', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0, 'GET /home/summary 成功', fmt(r));
  assert(r.json.data && typeof r.json.data.streak === 'number' && Array.isArray(r.json.data.todayTodo), 'home/summary 含 streak + todayTodo', JSON.stringify({ streak: r.json.data.streak, todoCount: r.json.data.todayTodo.length }));

  // ===== Phase B：成分 / 产品匹配 =====
  console.log('\n【4. Phase B：成分库 / 产品匹配】');
  r = await req('GET', '/api/wx/ingredients?keyword=烟酰胺', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.list.some((i) => i.name === '烟酰胺'), '成分检索 keyword=烟酰胺 命中', fmt(r));
  const ing = r.json.data.list.find((i) => i.name === '烟酰胺');
  r = await req('GET', `/api/wx/ingredients/${ing.id}`, { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.name === '烟酰胺' && Array.isArray(r.json.data.suitableSkin), '成分详情含 suitableSkin', fmt(r));
  r = await req('GET', '/api/wx/ingredients/999999999', { wxToken });
  assert(r.status === 404 && r.json && r.json.code === 404, '不存在成分返回 404', fmt(r));

  r = await req('GET', '/api/wx/products', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data) && r.json.data.length >= 2, 'GET /wx/products 成功', fmt(r));
  const plist = r.json.data;
  const sorted = plist.every((p, i) => i === 0 || plist[i - 1].matchScore >= p.matchScore);
  assert(sorted, '产品按匹配度降序', JSON.stringify(plist.map((p) => [p.name, p.matchScore])));
  assert(plist.every((p) => typeof p.matchScore === 'number' && p.matchScore >= 0 && p.matchScore <= 100), 'matchScore ∈[0,100]', '');

  const prod0 = plist[0];
  r = await req('GET', `/api/wx/products/${prod0.id}`, { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && typeof r.json.data.matchScore === 'number', '产品详情含 matchScore', fmt(r));
  assert(Array.isArray(r.json.data.matchReasons) && Array.isArray(r.json.data.ingredients), '产品详情含 matchReasons + ingredients', JSON.stringify({ reasons: r.json.data.matchReasons.length, ings: r.json.data.ingredients.length }));
  r = await req('GET', '/api/wx/products/999999999', { wxToken });
  assert(r.status === 404 && r.json && r.json.code === 404, '不存在产品返回 404', fmt(r));

  // ===== 触发检测生成方案（供 plan 步骤测试） =====
  console.log('\n【5. 触发检测生成方案（供 plan 步骤）】');
  r = await req('POST', '/api/wx/detect/analyze', { wxToken, body: { imageBase64: TINY_PNG_B64 } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.detectId, 'detect/analyze 成功', fmt(r));
  const detectId = r.json.data.detectId;
  const engine = r.json.data.engine;
  console.log(`    （detect engine=${engine}）`);

  r = await req('GET', '/api/wx/plan', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data && r.json.data.planId, 'GET /wx/plan 返回方案', fmt(r));
  assert(r.json.data.stepProgress && typeof r.json.data.stepProgress.done === 'number' && typeof r.json.data.stepProgress.total === 'number', '/wx/plan 含 stepProgress', JSON.stringify(r.json.data.stepProgress));
  assert(Array.isArray(r.json.data.routineMorning) && r.json.data.routineMorning.every((s) => typeof s.done === 'boolean' && s.stepKey), '/wx/plan 步骤含 done + stepKey', '');

  // ===== Phase B：方案绑定 / 产品柜 / 开封 / 使用记录 =====
  console.log('\n【6. Phase B：方案绑定 / 产品柜 / 开封 / 使用记录】');
  r = await req('GET', '/api/wx/plan/steps', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.planId && Array.isArray(r.json.data.steps), 'GET /plan/steps 成功', fmt(r));
  assert(r.json.data.steps.some((s) => s.stepKey === 'cleanse' && s.period === 'morning'), 'steps 含 morning/cleanse', '');

  r = await req('PUT', '/api/wx/plan/steps/morning/cleanse/product', { wxToken, body: { productId: prod0.id } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.productId === prod0.id, '绑定产品到 morning/cleanse', fmt(r));
  r = await req('GET', '/api/wx/plan/steps', { wxToken });
  const boundStep = r.json.data.steps.find((s) => s.period === 'morning' && s.stepKey === 'cleanse');
  assert(boundStep && boundStep.productId === prod0.id && boundStep.product && boundStep.product.name, '绑定后 steps 回显产品', JSON.stringify(boundStep && boundStep.product));
  r = await req('PUT', '/api/wx/plan/steps/morning/cleanse/product', { wxToken, body: {} });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.productId === null, '解绑产品（空 body）', fmt(r));
  r = await req('PUT', '/api/wx/plan/steps/badperiod/cleanse/product', { wxToken, body: { productId: prod0.id } });
  assert(r.status === 400 && r.json && r.json.code === 400, '非法 period 返回 400', fmt(r));

  r = await req('POST', '/api/wx/my-products', { wxToken, body: { productId: prod0.id, status: 'using' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.productId === prod0.id, '添加产品柜', fmt(r));
  const myProductId = r.json.data.id;
  r = await req('POST', '/api/wx/my-products', { wxToken, body: { productId: prod0.id, status: 'stopped' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.status === 'stopped' && r.json.data.id === myProductId, '产品柜状态切换（幂等 upsert 不重复）', fmt(r));
  r = await req('GET', '/api/wx/my-products', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.some((p) => p.id === myProductId && p.status === 'stopped'), '产品柜列表含该产品', fmt(r));
  r = await req('DELETE', `/api/wx/my-products/${myProductId}`, { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0, '移除产品柜产品', fmt(r));
  r = await req('POST', '/api/wx/my-products', { wxToken, body: {} });
  assert(r.status === 400 && r.json && r.json.code === 400, '添加产品柜缺 productId 返回 400', fmt(r));

  r = await req('POST', '/api/wx/product-usages', { wxToken, body: { productId: prod0.id, openedAt: '2026-09-01', expireMonths: 12 } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.expireAt === '2027-09-01' && typeof r.json.data.daysLeft === 'number', '设置开封有效期 12 月', fmt(r));
  r = await req('POST', '/api/wx/product-usages', { wxToken, body: { productId: prod0.id, openedAt: '2026-09-01', expireMonths: 12 } });
  assert(r.status === 200 && r.json && r.json.code === 0, '重复设置开封（幂等 upsert）', fmt(r));
  r = await req('GET', '/api/wx/product-usages', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data) && r.json.data.some((u) => u.productId === prod0.id), '开封列表含该产品', fmt(r));
  r = await req('GET', '/api/wx/product-usages/expiring', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data), '到期列表成功', fmt(r));
  r = await req('POST', '/api/wx/product-usages', { wxToken, body: { productId: 999999999, openedAt: '2026-09-01' } });
  assert(r.status === 404 && r.json && r.json.code === 404, '开封设置不存在产品返回 404', fmt(r));

  r = await req('POST', '/api/wx/usage-logs', { wxToken, body: { productId: prod0.id, action: 'start' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.action === 'start', '写使用记录 start', fmt(r));
  r = await req('GET', '/api/wx/usage-logs', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.some((l) => l.productId === prod0.id && l.action === 'start'), '使用记录时间轴含 start', fmt(r));
  r = await req('POST', '/api/wx/usage-logs', { wxToken, body: { productId: prod0.id, action: 'bad' } });
  assert(r.status === 400 && r.json && r.json.code === 400, '非法 action 返回 400', fmt(r));

  // ===== Phase C：UV / 季节 / 复测 / 提醒 / 日记 / 报告 / 随访 =====
  console.log('\n【7. Phase C：UV / 季节 / 复测】');
  r = await req('GET', '/api/wx/env/uv?city=北京', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0, 'GET /env/uv 成功', fmt(r));
  assert(r.json.data.source === 'rule' && typeof r.json.data.uvIndex === 'number' && r.json.data.uvLevelLabel, 'UV 走 rule 降级且含档位', JSON.stringify({ source: r.json.data.source, uvIndex: r.json.data.uvIndex, level: r.json.data.uvLevelLabel }));
  assert(typeof r.json.data.sunscreenAdvice === 'string' && Array.isArray(r.json.data.afterSunAdvice), 'UV 含防晒建议 + 晒后建议', '');

  r = await req('GET', '/api/wx/env/season-tip', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.season === '秋', '10月季节提示=秋', fmt(r));

  r = await req('GET', '/api/wx/recheck', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && typeof r.json.data.daysSince === 'number', 'GET /recheck 成功', fmt(r));

  console.log('\n【8. Phase C：提醒 / 照片日记 / 报告 / 随访】');
  r = await req('POST', '/api/wx/reminders', { wxToken, body: { type: 'morning', scheduleTime: '08:00' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.type === 'morning', '创建 morning 提醒', fmt(r));
  const reminderId = r.json.data.id;
  r = await req('POST', '/api/wx/reminders', { wxToken, body: { type: 'morning', scheduleTime: '08:30' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.id === reminderId && r.json.data.scheduleTime === '08:30', '同 type upsert 不重复', fmt(r));
  r = await req('GET', '/api/wx/reminders', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.filter((x) => x.type === 'morning').length === 1, '提醒列表 morning 仅 1 条', fmt(r));
  r = await req('PUT', `/api/wx/reminders/${reminderId}`, { wxToken, body: { enabled: false } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.enabled === false, '更新提醒 enabled=false', fmt(r));
  r = await req('DELETE', `/api/wx/reminders/${reminderId}`, { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0, '删除提醒', fmt(r));
  r = await req('POST', '/api/wx/reminders', { wxToken, body: { type: 'badtype' } });
  assert(r.status === 400 && r.json && r.json.code === 400, '非法提醒 type 返回 400', fmt(r));

  // 照片日记：multipart 上传 → 列表 → 删除
  const form = new FormData();
  form.append('file', new Blob([TINY_PNG_BUF], { type: 'image/png' }), 'diary.png');
  form.append('note', '晨起状态');
  r = await reqForm('POST', '/api/wx/photo-diary', form, wxToken);
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.id && r.json.data.imageUrl, '照片日记上传成功', fmt(r));
  const diaryId = r.json.data.id;
  r = await req('GET', '/api/wx/photo-diary', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.some((d) => d.id === diaryId), '照片日记列表含上传项', fmt(r));
  r = await req('DELETE', `/api/wx/photo-diary/${diaryId}`, { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0, '删除照片日记', fmt(r));
  r = await req('DELETE', `/api/wx/photo-diary/999999999`, { wxToken });
  assert(r.status === 404 && r.json && r.json.code === 404, '删除不存在日记返回 404', fmt(r));

  // 报告时间轴（含检测 + 建议）
  r = await req('POST', `/api/admin/patients/${wxUserId}/advice`, { token: doctorToken, body: { content: '增量测试建议：坚持保湿防晒。' } });
  assert(r.status === 200 && r.json && r.json.code === 0, '医生写建议（供报告时间轴）', fmt(r));
  r = await req('GET', '/api/wx/reports', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && Array.isArray(r.json.data), 'GET /reports 时间轴成功', fmt(r));
  const flatItems = r.json.data.flatMap((g) => g.items);
  assert(flatItems.some((i) => i.type === 'detect') && flatItems.some((i) => i.type === 'advice'), '时间轴聚合 detect + advice', JSON.stringify(flatItems.map((i) => i.type)));

  // 随访：用户发 → 医生列表（unread）→ 医生回复 → 用户可见
  r = await req('POST', '/api/wx/followup', { wxToken, body: { content: '最近脸颊泛红，需要调整方案吗？' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.sender === 'user', '用户发随访消息', fmt(r));
  r = await req('GET', '/api/admin/followup', { token: doctorToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && typeof r.json.data.unread === 'number', '医生随访列表含 unread 计数', fmt(r));
  assert(r.json.data.list.some((m) => m.userId === wxUserId && m.sender === 'user'), '医生列表含用户消息', '');
  r = await req('POST', `/api/admin/followup/${wxUserId}/reply`, { token: doctorToken, body: { content: '建议暂停使用视黄醇，加强保湿修护。' } });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.sender === 'doctor', '医生回复随访', fmt(r));
  r = await req('POST', `/api/admin/followup/${wxUserId}/reply`, { token: doctorToken, body: { content: '' } });
  assert(r.status === 400 && r.json && r.json.code === 400, '医生回复空内容返回 400', fmt(r));
  r = await req('GET', '/api/wx/followup', { wxToken });
  assert(r.status === 200 && r.json && r.json.code === 0 && r.json.data.some((m) => m.sender === 'doctor'), '用户侧可见医生回复', fmt(r));

  // ===== 边界与异常 =====
  console.log('\n【9. 边界与异常】');
  r = await req('GET', '/api/wx/badges', { wxToken: 'forged.invalid.token' });
  assert(r.status === 401 && r.json && r.json.code === 401, '伪造 token 访问 /badges 返回 401', fmt(r));
  r = await req('POST', '/api/admin/auth/login', { rawBody: '{bad json', headers: { 'Content-Type': 'application/json' } });
  assert(r.status === 400 && r.json && r.json.code === 400, '非法 JSON 返回 400（不再 HTML 500）', fmt(r));

  // 开封日期非法（13月 / 未来日期）——记录实际行为
  r = await req('POST', '/api/wx/product-usages', { wxToken, body: { productId: prod0.id, openedAt: '2026-13-01', expireMonths: 12 } });
  console.log(`    [观察] openedAt=2026-13-01 -> ${fmt(r)}  data=${JSON.stringify(r.json && r.json.data)}`);

  // 照片日记超大图（>10MB）
  const bigBuf = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(11 * 1024 * 1024, 7)]);
  const bigForm = new FormData();
  bigForm.append('file', new Blob([bigBuf], { type: 'image/jpeg' }), 'big.jpg');
  r = await reqForm('POST', '/api/wx/photo-diary', bigForm, wxToken);
  assert(r.status === 200 && r.json && r.json.code === 20001, '照片日记超大图返回 20001', fmt(r));

  // 非图片文件
  const txtForm = new FormData();
  txtForm.append('file', new Blob([Buffer.from('not an image')], { type: 'text/plain' }), 'a.txt');
  r = await reqForm('POST', '/api/wx/photo-diary', txtForm, wxToken);
  assert(r.json && r.json.code === 20001, '照片日记非图片返回 20001', fmt(r));

  // ===== 汇总 =====
  console.log('\n==============================================');
  console.log(`  汇总：通过 ${passed} / 失败 ${failed}（共 ${passed + failed} 项）`);
  if (failures.length) {
    console.log('\n  失败项明细：');
    failures.forEach((f) => console.log('    - ' + f));
  }
  console.log('==============================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('测试脚本异常：', e);
  process.exit(2);
});
