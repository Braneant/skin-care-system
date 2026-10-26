'use strict';

/**
 * 肤质匹配度服务（Phase B，规则引擎，§8#5）
 * - calcMatchScore(product, skinType) → 0–100
 * - matchReasons(product, skinType) → 文案数组
 * - enrichIngredients(product) → 成分详情（关联 ingredients 表）
 */
const ingredientRepo = require('../repositories/ingredientRepo');
const helper = require('../utils/helper');
const { MATCH_CONFIG } = require('../config/skincareRules');

/** 提取产品成分名数组 */
function extractNames(product) {
  if (!product) return [];
  const raw = Array.isArray(product.ingredients) ? product.ingredients : helper.parseJson(product.ingredients, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => typeof x === 'string' && x).map((x) => x.trim());
}

/** 匹配分析：{hits, conflicts, matched, reasons} */
function analyze(product, skinType) {
  const names = extractNames(product);
  const ingredients = names.length ? ingredientRepo.findByNames(names) : [];
  const hits = [];
  const conflicts = [];
  const reasons = [];

  for (const ing of ingredients) {
    const suitable = helper.parseJson(ing.suitable_skin, []);
    if (!Array.isArray(suitable) || suitable.length === 0) continue; // 中性成分
    if (suitable.includes(skinType)) {
      hits.push(ing);
      reasons.push(`含${ing.name}，适配${skinType}肤质`);
    } else {
      conflicts.push(ing);
      reasons.push(`含${ing.name}，与${skinType}肤质匹配度较低`);
    }
  }

  // 追加功能向理由
  for (const ing of ingredients) {
    if (reasons.length >= 6) break;
    const funcs = helper.parseJson(ing.functions, []);
    if (Array.isArray(funcs) && funcs.includes('保湿')) {
      reasons.push(`含${ing.name}，补水保湿`);
    } else if (ing.efficacy && reasons.length < 6 && !reasons.some((r) => r.includes(ing.name))) {
      reasons.push(`含${ing.name}，${ing.efficacy.slice(0, 12)}`);
    }
  }

  return { hits, conflicts, reasons: Array.from(new Set(reasons)).slice(0, 8) };
}

/** 匹配度 0–100 */
function calcMatchScore(product, skinType) {
  const { hits, conflicts } = analyze(product, skinType);
  let score = MATCH_CONFIG.baseScore;
  score += hits.length * MATCH_CONFIG.perHit;
  score += conflicts.length * MATCH_CONFIG.perConflict;
  return Math.max(MATCH_CONFIG.min, Math.min(MATCH_CONFIG.max, Math.round(score)));
}

/** 匹配理由文案 */
function matchReasons(product, skinType) {
  return analyze(product, skinType).reasons;
}

/** 产品成分详情（关联成分库） */
function enrichIngredients(product) {
  const names = extractNames(product);
  if (!names.length) return [];
  const ingredients = ingredientRepo.findByNames(names);
  const byName = new Map(ingredients.map((i) => [i.name, i]));
  return names
    .map((n) => {
      const ing = byName.get(n);
      return ing
        ? { ingredientId: ing.id, name: ing.name, riskLevel: ing.risk_level, efficacy: ing.efficacy }
        : { ingredientId: null, name: n, riskLevel: null, efficacy: null };
    })
    .filter(Boolean);
}

module.exports = { calcMatchScore, matchReasons, enrichIngredients };
