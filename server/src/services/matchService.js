'use strict';

/**
 * 肤质匹配度服务（Phase B，规则引擎，§8#5）
 *
 * 设计要点：
 * - computeMatch / scoreOf 为纯函数，不访问数据库，便于复用与测试；
 * - analyze / analyzeSingle 各只查库 1 次；batchScores 对整批产品只查库 1 次，
 *   避免列表页「每个产品查一次成分库」的 N+1 问题；
 * - calcMatchScore / matchReasons / enrichIngredients 保留为兼容包装，行为不变。
 */
const ingredientRepo = require('../repositories/ingredientRepo');
const helper = require('../utils/helper');
const { MATCH_CONFIG } = require('../config/skincareRules');

/** 提取产品成分名数组（兼容数组与 JSON 字符串，去空去重） */
function extractNames(product) {
  if (!product) return [];
  const raw = Array.isArray(product.ingredients)
    ? product.ingredients
    : helper.parseJson(product.ingredients, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
}

/**
 * 纯函数：根据已解析的成分列表计算命中/冲突/理由
 * @param {Array<object>} ingredients 成分库记录
 * @param {string} skinType 当前用户肤质
 */
function computeMatch(ingredients, skinType) {
  const hits = [];
  const conflicts = [];
  const reasons = [];

  for (const ing of ingredients) {
    const suitable = helper.parseJson(ing.suitable_skin, []);
    if (!Array.isArray(suitable) || suitable.length === 0) continue; // 中性成分不计
    if (suitable.includes(skinType)) {
      hits.push(ing);
      reasons.push(`含${ing.name}，适配${skinType}肤质`);
    } else {
      conflicts.push(ing);
      reasons.push(`含${ing.name}，与${skinType}肤质匹配度较低`);
    }
  }

  // 追加功能向理由（去重、最多 8 条）
  for (const ing of ingredients) {
    if (reasons.length >= 6) break;
    const funcs = helper.parseJson(ing.functions, []);
    if (Array.isArray(funcs) && funcs.includes('保湿')) {
      reasons.push(`含${ing.name}，补水保湿`);
    } else if (ing.efficacy && !reasons.some((r) => r.includes(ing.name))) {
      reasons.push(`含${ing.name}，${ing.efficacy.slice(0, 12)}`);
    }
  }

  return { hits, conflicts, reasons: Array.from(new Set(reasons)).slice(0, 8) };
}

/** 纯函数：命中加分、冲突减分，限定在 [min, max] */
function scoreOf(hits, conflicts) {
  const raw =
    MATCH_CONFIG.baseScore +
    hits.length * MATCH_CONFIG.perHit +
    conflicts.length * MATCH_CONFIG.perConflict;
  return Math.max(MATCH_CONFIG.min, Math.min(MATCH_CONFIG.max, Math.round(raw)));
}

/** 查询若干成分名对应的成分库记录 */
function fetchIngredients(names) {
  return names.length ? ingredientRepo.findByNames(names) : [];
}

/** 单产品分析（查库 1 次），返回 {hits, conflicts, reasons, score} */
function analyze(product, skinType) {
  const names = extractNames(product);
  const match = computeMatch(fetchIngredients(names), skinType);
  return { ...match, score: scoreOf(match.hits, match.conflicts) };
}

/** 匹配度 0–100（兼容旧签名） */
function calcMatchScore(product, skinType) {
  return analyze(product, skinType).score;
}

/** 匹配理由文案（兼容旧签名） */
function matchReasons(product, skinType) {
  return analyze(product, skinType).reasons;
}

/** 产品成分详情（关联成分库，保留成分原始顺序；兼容旧签名） */
function enrichIngredients(product) {
  const names = extractNames(product);
  if (!names.length) return [];
  const byName = new Map(fetchIngredients(names).map((i) => [i.name, i]));
  return names.map((n) => {
    const ing = byName.get(n);
    return ing
      ? { ingredientId: ing.id, name: ing.name, riskLevel: ing.risk_level, efficacy: ing.efficacy }
      : { ingredientId: null, name: n, riskLevel: null, efficacy: null };
  });
}

/**
 * 详情页一次性计算（查库 1 次）：返回 {score, reasons, ingredients}
 * 替代原先 calcMatchScore + matchReasons + enrichIngredients 的 3 次查库。
 */
function analyzeSingle(product, skinType) {
  const names = extractNames(product);
  const found = fetchIngredients(names);
  const match = computeMatch(found, skinType);
  const byName = new Map(found.map((i) => [i.name, i]));
  const ingredients = names.map((n) => {
    const ing = byName.get(n);
    return ing
      ? { ingredientId: ing.id, name: ing.name, riskLevel: ing.risk_level, efficacy: ing.efficacy }
      : { ingredientId: null, name: n, riskLevel: null, efficacy: null };
  });
  return { score: scoreOf(match.hits, match.conflicts), reasons: match.reasons, ingredients };
}

/**
 * 列表批量算分（整批只查库 1 次）：返回 [{ id, score }]
 * 替代原先对每个产品 calcMatchScore 造成的 N 次查库。
 */
function batchScores(products, skinType) {
  const allNames = Array.from(new Set(products.flatMap((p) => extractNames(p))));
  const byName = new Map(fetchIngredients(allNames).map((i) => [i.name, i]));
  return products.map((p) => {
    const ingredients = extractNames(p)
      .map((n) => byName.get(n))
      .filter(Boolean);
    const match = computeMatch(ingredients, skinType);
    return { id: p.id, score: scoreOf(match.hits, match.conflicts) };
  });
}

module.exports = {
  extractNames,
  computeMatch,
  scoreOf,
  calcMatchScore,
  matchReasons,
  enrichIngredients,
  analyzeSingle,
  batchScores,
};
