'use strict';

const wxUserRepo = require('../../repositories/wxUserRepo');
const skinProfileRepo = require('../../repositories/skinProfileRepo');
const detectRecordRepo = require('../../repositories/detectRecordRepo');
const checkinRepo = require('../../repositories/checkinRepo');
const planRepo = require('../../repositories/planRepo');
const adviceRepo = require('../../repositories/adviceRepo');
const adviceTemplateRepo = require('../../repositories/adviceTemplateRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

function serializeDetect(r) {
  return {
    id: r.id,
    imageUrl: r.image_url,
    engine: r.engine,
    degraded: !!r.degraded,
    skinType: r.skin_type,
    issues: helper.parseJson(r.issues, []),
    riskLevel: r.risk_level,
    score: r.score,
    dimensions: helper.parseJson(r.dimensions, {}),
    reportText: r.report_text,
    createdAt: r.created_at,
  };
}

/** 患者列表（含档案摘要） */
function listPatients(req, res, next) {
  try {
    const { page, pageSize } = helper.pageParams(req.query);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const where = keyword ? 'nickname LIKE ? OR phone LIKE ?' : '1=1';
    const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : [];
    const result = wxUserRepo.paginate({ page, pageSize, where, params, orderBy: 'id DESC' });

    const list = result.list.map((u) => {
      const profile = skinProfileRepo.findByUserId(u.id);
      const latest = detectRecordRepo.latestByUser(u.id);
      return {
        id: u.id,
        nickname: u.nickname,
        avatarUrl: u.avatar_url,
        gender: u.gender,
        phone: u.phone,
        skinType: profile ? profile.skin_type : null,
        sensitivity: profile ? profile.sensitivity : null,
        latestScore: latest ? latest.score : null,
        latestRisk: latest ? latest.risk_level : null,
        detectCount: detectRecordRepo.prepare('SELECT COUNT(*) AS c FROM detect_records WHERE user_id = ?').get(u.id).c,
        createdAt: u.created_at,
      };
    });
    return res.ok({ list, total: result.total, page, pageSize, totalPages: result.totalPages });
  } catch (e) {
    return next(e);
  }
}

/** 患者完整档案 */
function getPatient(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const user = wxUserRepo.getById(userId);
    if (!user) throw new BusinessError(404, '用户不存在');

    const profile = skinProfileRepo.findByUserId(userId);
    const detectRecords = detectRecordRepo.listByUser(userId, 50).map(serializeDetect);
    const checkins = checkinRepo.listByUser(userId, 90);
    const plans = planRepo.listByUser(userId).map((p) => ({
      id: p.id,
      title: p.title,
      routineMorning: helper.parseJson(p.routine_morning, []),
      routineEvening: helper.parseJson(p.routine_evening, []),
      ingredients: helper.parseJson(p.ingredients, []),
      taboos: helper.parseJson(p.taboos, []),
      createdAt: p.created_at,
    }));
    const advice = adviceRepo.listByUser(userId).map((a) => ({
      id: a.id,
      content: a.content,
      doctorName: a.doctor_name,
      detectRecordId: a.detect_record_id,
      createdAt: a.created_at,
    }));

    return res.ok({
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        gender: user.gender,
        birthday: user.birthday,
        phone: user.phone,
        createdAt: user.created_at,
      },
      profile: profile
        ? {
            skinType: profile.skin_type,
            sensitivity: profile.sensitivity,
            concerns: helper.parseJson(profile.concerns, []),
            habits: helper.parseJson(profile.habits, {}),
            photoUrl: profile.photo_url,
            updatedAt: profile.updated_at,
          }
        : null,
      detectRecords,
      checkins,
      plans,
      advice,
    });
  } catch (e) {
    return next(e);
  }
}

/** 患者趋势 */
function getPatientTrend(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const days = Math.min(90, Number(req.query.days) || 30);
    const records = detectRecordRepo.trendByUser(userId, days);
    const byDate = new Map();
    for (const r of records) byDate.set(helper.isoToDate(r.created_at), r);
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

/** 撰写专业建议（可存模板） */
function writeAdvice(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (!wxUserRepo.getById(userId)) throw new BusinessError(404, '用户不存在');
    const { content, detectRecordId, saveAsTemplate, templateTitle, templateCategory } = req.body || {};
    const text = String(content || '').trim();
    if (!text) throw new BusinessError(400, '建议内容不能为空');

    const adviceId = adviceRepo.insert({
      user_id: userId,
      doctor_id: req.admin.id,
      detect_record_id: detectRecordId || null,
      content: text,
    });

    let templateId = null;
    if (saveAsTemplate) {
      templateId = adviceTemplateRepo.insert({
        doctor_id: req.admin.id,
        title: templateTitle || '常用建议',
        content: text,
        category: templateCategory || '通用',
      });
    }
    return res.ok({ adviceId, templateId });
  } catch (e) {
    return next(e);
  }
}

module.exports = { listPatients, getPatient, getPatientTrend, writeAdvice };
