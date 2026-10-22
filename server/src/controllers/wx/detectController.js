'use strict';

const skinAnalysis = require('../../services/skinAnalysis');
const detectRecordRepo = require('../../repositories/detectRecordRepo');
const planRepo = require('../../repositories/planRepo');
const adviceRepo = require('../../repositories/adviceRepo');
const { saveImageBuffer } = require('../../middlewares/upload');
const helper = require('../../utils/helper');

function serialize(record) {
  if (!record) return null;
  return {
    id: record.id,
    imageUrl: record.image_url,
    engine: record.engine,
    degraded: !!record.degraded,
    skinType: record.skin_type,
    issues: helper.parseJson(record.issues, []),
    riskLevel: record.risk_level,
    score: record.score,
    dimensions: helper.parseJson(record.dimensions, {}),
    reportText: record.report_text,
    createdAt: record.created_at,
  };
}

/**
 * 上传检测照片（multipart）
 */
function upload(req, res, next) {
  (async () => {
    try {
      if (!req.file) return res.fail(400, '请选择要上传的图片');
      const saved = await saveImageBuffer(req.file.buffer, 'detect');
      return res.ok({ fileId: saved.fileId, url: saved.url });
    } catch (e) {
      return next(e);
    }
  })();
}

/**
 * 发起 AI 检测
 */
function analyze(req, res, next) {
  (async () => {
    try {
      const { imageBase64 } = req.body || {};
      if (!imageBase64) return res.fail(400, '缺少图片数据（imageBase64）');
      const report = await skinAnalysis.analyzeAndSave(req.user.id, imageBase64);
      return res.ok(report);
    } catch (e) {
      return next(e);
    }
  })();
}

/** 检测报告详情（含方案与医生建议） */
function getDetail(req, res, next) {
  try {
    const record = detectRecordRepo.getById(Number(req.params.id));
    if (!record || record.user_id !== req.user.id) {
      return res.fail(404, '检测记录不存在');
    }
    const detail = serialize(record);
    const plan = planRepo.latestByUser(req.user.id);
    detail.plan = plan
      ? {
          planId: plan.id,
          title: plan.title,
          routineMorning: helper.parseJson(plan.routine_morning, []),
          routineEvening: helper.parseJson(plan.routine_evening, []),
          ingredients: helper.parseJson(plan.ingredients, []),
          taboos: helper.parseJson(plan.taboos, []),
        }
      : null;
    detail.advice = adviceRepo.listByDetect(record.id).map((a) => ({
      id: a.id,
      content: a.content,
      doctorName: a.doctor_name,
      createdAt: a.created_at,
    }));
    return res.ok(detail);
  } catch (e) {
    return next(e);
  }
}

/** 我的检测记录列表 */
function list(req, res, next) {
  try {
    const records = detectRecordRepo.listByUser(req.user.id, 50);
    return res.ok(records.map(serialize));
  } catch (e) {
    return next(e);
  }
}

/** 趋势数据：得分/水分/油脂，按「每日最新一条」采样 */
function getTrend(req, res, next) {
  try {
    const days = Math.min(90, Number(req.query.days) || 30);
    const records = detectRecordRepo.trendByUser(req.user.id, days);
    const byDate = new Map();
    for (const r of records) {
      const date = helper.isoToDate(r.created_at);
      byDate.set(date, r); // 后者覆盖前者 → 每日最新
    }
    const list = Array.from(byDate.values()).map((r) => {
      const dim = helper.parseJson(r.dimensions, {});
      return {
        date: helper.isoToDate(r.created_at),
        score: r.score,
        oil: dim.oilDry ?? null,
        water: dim.color ?? null,
        smoothness: dim.smoothness ?? null,
      };
    });
    return res.ok(list);
  } catch (e) {
    return next(e);
  }
}

module.exports = { upload, analyze, getDetail, list, getTrend };
