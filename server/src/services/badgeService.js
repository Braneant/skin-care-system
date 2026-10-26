'use strict';

/**
 * 打卡统计 / 徽章服务（Phase A）
 * - calcStreak / calcStats / weeklyCalendar / getBadgeWall / grantBadges
 * - 全部基于 checkin_records 纯计算 + user_badge 幂等写
 */
const checkinRepo = require('../repositories/checkinRepo');
const userBadgeRepo = require('../repositories/userBadgeRepo');
const helper = require('../utils/helper');
const { BADGE_RULES } = require('../config/skincareRules');

/** 某日期所在自然周的周一（YYYY-MM-DD） */
function mondayOf(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const offset = (dt.getDay() + 6) % 7;
  return helper.addDays(dateStr, -offset);
}

/** 收集打卡记录并按日期建索引 */
function collect(userId) {
  const rows = checkinRepo.listAllByUser(userId);
  const dates = new Set();
  const byDate = new Map();
  const sunscreenDates = new Set();
  for (const r of rows) {
    if (r.cleanse || r.moisturize || r.sunscreen) dates.add(r.checkin_date);
    byDate.set(r.checkin_date, r);
    if (r.sunscreen) sunscreenDates.add(r.checkin_date);
  }
  return { rows, dates, byDate, sunscreenDates };
}

/** 当前连续打卡天数（今天未打卡则从昨天起算，不因今天未打卡而断签） */
function calcStreak(dates, today) {
  let streak = 0;
  let cursor = dates.has(today) ? today : helper.addDays(today, -1);
  while (dates.has(cursor)) {
    streak += 1;
    cursor = helper.addDays(cursor, -1);
  }
  return streak;
}

/** 历史最长连续打卡天数 */
function calcLongestStreak(dates) {
  const sorted = Array.from(dates).sort();
  let longest = 0;
  let cur = 0;
  let prev = null;
  for (const d of sorted) {
    cur = prev && helper.addDays(prev, 1) === d ? cur + 1 : 1;
    if (cur > longest) longest = cur;
    prev = d;
  }
  return longest;
}

/** 统计：streak / 累计 / 最长连续 / 本周完成率 / 今日完成 / 防晒天数 / 完美周 */
function calcStats(userId) {
  const { rows, dates, byDate, sunscreenDates } = collect(userId);
  const today = helper.today();

  const streak = calcStreak(dates, today);
  const totalDays = dates.size;
  const longestStreak = calcLongestStreak(dates);
  const sunscreenDays = sunscreenDates.size;

  // 本周（周一为一周起点）
  const weekMonday = mondayOf(today);
  let weekDone = 0;
  for (const d of dates) {
    if (d >= weekMonday && d <= today) weekDone += 1;
  }
  const dayOfWeek = new Date().getDay(); // 0=周日
  const daysElapsed = ((dayOfWeek + 6) % 7) + 1; // 周一=1 … 周日=7
  const weekRate = daysElapsed > 0 ? weekDone / daysElapsed : 0;

  // 今日完成
  const todayRow = byDate.get(today);
  const todayDone = todayRow
    ? (todayRow.cleanse ? 1 : 0) + (todayRow.moisturize ? 1 : 0) + (todayRow.sunscreen ? 1 : 0)
    : 0;

  // 完美周：自然周内三项全满的天数
  const fullDaysPerWeek = new Map();
  for (const r of rows) {
    if (r.cleanse && r.moisturize && r.sunscreen) {
      const key = mondayOf(r.checkin_date);
      fullDaysPerWeek.set(key, (fullDaysPerWeek.get(key) || 0) + 1);
    }
  }
  let perfectWeekEarned = false;
  for (const count of fullDaysPerWeek.values()) {
    if (count >= 7) perfectWeekEarned = true;
  }
  const fullDaysThisWeek = fullDaysPerWeek.get(weekMonday) || 0;

  return {
    streak,
    totalDays,
    longestStreak,
    weekRate,
    weekDone,
    weekTotal: daysElapsed,
    todayDone,
    todayTotal: 3,
    sunscreenDays,
    fullDaysThisWeek,
    perfectWeekEarned,
  };
}

/** 7 日周历视图（含今日，date 升序） */
function weeklyCalendar(userId, days = 7) {
  const today = helper.today();
  const { byDate } = collect(userId);
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = helper.addDays(today, -i);
    const r = byDate.get(date);
    result.push({
      date,
      cleanse: r ? (r.cleanse ? 1 : 0) : 0,
      moisturize: r ? (r.moisturize ? 1 : 0) : 0,
      sunscreen: r ? (r.sunscreen ? 1 : 0) : 0,
      isToday: date === today,
    });
  }
  return result;
}

/** 规则是否达成（streak 类用历史最长连续，确保达成后永久保留） */
function isEarned(rule, stats) {
  switch (rule.type) {
    case 'totalDays':
      return stats.totalDays >= rule.threshold;
    case 'streak':
      return Math.max(stats.streak, stats.longestStreak) >= rule.threshold;
    case 'sunscreenDays':
      return stats.sunscreenDays >= rule.threshold;
    case 'perfectWeek':
      return stats.perfectWeekEarned;
    default:
      return false;
  }
}

/** 规则当前进度值（用于展示） */
function currentValue(rule, stats) {
  switch (rule.type) {
    case 'totalDays':
      return stats.totalDays;
    case 'streak':
      return stats.streak;
    case 'sunscreenDays':
      return stats.sunscreenDays;
    case 'perfectWeek':
      return stats.fullDaysThisWeek;
    default:
      return 0;
  }
}

/** 徽章墙：已获 + 未解锁 + 进度 */
function getBadgeWall(userId) {
  const stats = calcStats(userId);
  const earnedMap = new Map(
    userBadgeRepo.listByUser(userId).map((b) => [b.badge_code, b])
  );
  return BADGE_RULES.map((rule) => {
    const earnedBadge = earnedMap.get(rule.code);
    const earned = !!earnedBadge;
    const threshold = rule.threshold;
    const shown = earned ? threshold : Math.min(currentValue(rule, stats), threshold);
    return {
      code: rule.code,
      name: rule.name,
      desc: rule.desc,
      icon: rule.icon,
      earned,
      earnedAt: earnedBadge ? earnedBadge.earned_at : null,
      progress: `${shown}/${threshold}`,
    };
  });
}

/** 幂等发放徽章，返回本次新发放的 code 列表 */
function grantBadges(userId) {
  const stats = calcStats(userId);
  const newly = [];
  for (const rule of BADGE_RULES) {
    if (isEarned(rule, stats) && !userBadgeRepo.hasBadge(userId, rule.code)) {
      userBadgeRepo.grant(userId, rule.code);
      newly.push(rule.code);
    }
  }
  return newly;
}

module.exports = { calcStreak, calcStats, weeklyCalendar, getBadgeWall, grantBadges };
