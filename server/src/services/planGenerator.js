'use strict';

/**
 * 个性化护肤方案生成器（规则引擎）
 * 依据肤质/问题/四维得分生成：早晚 Routine、成分建议、禁忌
 */
const logger = require('../utils/logger');

const STEP_TEMPLATES = {
  cleanse: (t) => ({ step: '清洁', desc: t || '使用温和氨基酸洁面，早晚各一次' }),
  toner: (t) => ({ step: '爽肤', desc: t || '轻拍保湿爽肤水，帮助后续吸收' }),
  serum: (t) => ({ step: '精华', desc: t || '针对性功效精华，重点涂抹问题区域' }),
  moisturize: (t) => ({ step: '保湿', desc: t || '涂抹保湿乳/霜，锁住水分' }),
  sunscreen: (t) => ({ step: '防晒', desc: t || '白天出门前涂抹 SPF30+ 防晒霜' }),
  repair: (t) => ({ step: '修护', desc: t || '使用修护类产品，帮助皮肤屏障恢复' }),
};

/**
 * 生成方案
 * @param {object} analysis {skinType, issues, dimensions, score}
 */
function generate(analysis = {}) {
  const skinType = analysis.skinType || '中性';
  const issues = (analysis.issues || []).map((i) => i.type || i);
  const dimensions = analysis.dimensions || {};

  const routineMorning = buildMorning(skinType, issues, dimensions);
  const routineEvening = buildEvening(skinType, issues, dimensions);
  const ingredients = buildIngredients(skinType, issues);
  const taboos = buildTaboos(skinType, issues);

  return {
    title: `${skinType}肌肤养护方案`,
    routineMorning,
    routineEvening,
    ingredients,
    taboos,
  };
}

function buildMorning(skinType, issues, dim) {
  const steps = [];
  if (skinType === '油性' || issues.includes('痘痘') || issues.includes('黑头')) {
    steps.push(STEP_TEMPLATES.cleanse('使用控油洁面，重点清洁 T 区'));
  } else if (skinType === '干性' || skinType === '敏感性') {
    steps.push(STEP_TEMPLATES.cleanse('使用温和氨基酸洁面，水温不宜过高'));
  } else {
    steps.push(STEP_TEMPLATES.cleanse());
  }
  steps.push(STEP_TEMPLATES.toner());
  if (issues.includes('色斑') || issues.includes('暗沉')) {
    steps.push(STEP_TEMPLATES.serum('使用含维生素C 的抗氧化精华'));
  } else if (issues.includes('皱纹')) {
    steps.push(STEP_TEMPLATES.serum('使用含视黄醇/胜肽的抗老精华'));
  } else if (issues.includes('痘痘') || issues.includes('黑头')) {
    steps.push(STEP_TEMPLATES.serum('局部点涂含水杨酸的控油精华'));
  } else {
    steps.push(STEP_TEMPLATES.serum('使用基础保湿精华'));
  }
  steps.push(STEP_TEMPLATES.moisturize(skinType === '油性' ? '使用清爽型乳液' : '使用滋润型保湿乳/霜'));
  steps.push(STEP_TEMPLATES.sunscreen());
  return steps;
}

function buildEvening(skinType, issues, dim) {
  const steps = [];
  steps.push(STEP_TEMPLATES.cleanse('先卸妆再用洁面，彻底清洁'));
  steps.push(STEP_TEMPLATES.toner());
  if (issues.includes('痘痘') || issues.includes('黑头') || issues.includes('毛孔')) {
    steps.push(STEP_TEMPLATES.serum('晚间使用含水杨酸/壬二酸的精华，帮助疏通毛孔'));
  } else if (issues.includes('皱纹')) {
    steps.push(STEP_TEMPLATES.serum('晚间使用视黄醇精华（需建立耐受）'));
  } else {
    steps.push(STEP_TEMPLATES.serum('使用修护类精华'));
  }
  if (skinType === '敏感性' || dim.smoothness < 60) {
    steps.push(STEP_TEMPLATES.repair('涂抹含神经酰胺的修护霜，强化皮肤屏障'));
  } else {
    steps.push(STEP_TEMPLATES.moisturize('晚间使用滋润型面霜'));
  }
  return steps;
}

function buildIngredients(skinType, issues) {
  const set = new Set();
  const add = (arr) => arr.forEach((i) => set.add(i));

  if (skinType === '干性') add(['神经酰胺', '透明质酸', '角鲨烷']);
  if (skinType === '油性') add(['水杨酸', '烟酰胺', '锌']);
  if (skinType === '混合性') add(['烟酰胺', '透明质酸']);
  if (skinType === '敏感性') add(['神经酰胺', '积雪草', '泛醇']);
  if (skinType === '中性') add(['透明质酸', '甘油']);

  if (issues.includes('痘痘') || issues.includes('黑头')) add(['水杨酸', '壬二酸']);
  if (issues.includes('色斑') || issues.includes('暗沉')) add(['维生素C', '烟酰胺']);
  if (issues.includes('皱纹')) add(['视黄醇', '胜肽']);
  if (issues.includes('毛孔')) add(['烟酰胺', '水杨酸']);

  return Array.from(set).map((name) => ({ name, note: ingredientNote(name) }));
}

function ingredientNote(name) {
  const map = {
    神经酰胺: '修护皮肤屏障，缓解干燥',
    透明质酸: '强效保湿，提升肌肤水润度',
    角鲨烷: '亲肤保湿，改善干燥',
    水杨酸: '疏通毛孔，改善痘痘黑头',
    烟酰胺: '控油提亮，改善毛孔与暗沉',
    锌: '控油收敛，抑制炎症',
    积雪草: '舒缓修复，减轻敏感泛红',
    泛醇: '保湿修复，温和不刺激',
    甘油: '基础保湿剂',
    壬二酸: '抗炎祛痘，淡化痘印',
    维生素C: '抗氧化提亮，淡化色斑',
    视黄醇: '抗老淡纹，促进角质更新',
    胜肽: '抗老紧致，减少细纹',
  };
  return map[name] || '辅助改善肌肤状态';
}

function buildTaboos(skinType, issues) {
  const list = ['避免频繁去角质（每周不超过 1-2 次）', '避免高糖、高油、辛辣饮食', '避免熬夜与长期压力'];
  if (skinType === '敏感性') list.push('避免使用含酒精、香精的刺激性产品');
  if (issues.includes('痘痘')) list.push('避免用手挤压痘痘，防止留疤');
  if (issues.includes('色斑') || issues.includes('暗沉')) list.push('严格防晒，避免紫外线加重色沉');
  if (issues.includes('皱纹')) list.push('避免过度日晒与吸烟');
  return list;
}

module.exports = { generate, STEP_TEMPLATES };
