"use strict";
/* =====================================================================
 * content/week-scheduler.js —— 每周时间稀缺（大框架改造·批次1 骨架）
 * 把「每周无限行动」收束为「时间是稀缺资源」：上班、通勤、生病、找工作、住院
 * 都要占用时间（doc §3）。
 *
 * 本批只做【读数与展示】，不硬卡死旧的 `s.hours` 流程——硬性占用与自由行动
 * 收缩（上班自动吃 5 个工作日、通勤额外消耗）留到批次3，避免一上来打乱平衡。
 *
 * 暴露：computeWeekBudget(s), freeSlots(s), weekBudgetSummary(s), commuteHoursOf(s)
 * ===================================================================== */

// 一周可支配的「小时」基准：沿用 lifeStages.weeklyHours，但叠加身份占用
const WEEK_BASE_HOURS = 64;

// 通勤：住得远 / 没搬到公司附近 → 每周额外吃掉时间与状态（迟到-通勤-租房链的数值基础）
function commuteHoursOf(s) {
  if (!s.job) return 0;
  if (s._housing === "near_office" || _has(s, "moved_near_office")) return 2;   // 搬到公司附近
  const far = s._housing === "far" || _has(s, "long_commute") || (s.commute && s.commute.far);
  return far ? 12 : 6;   // 远通勤一周 ~12h，普通 ~6h
}

function _has(s, f) { return (typeof has === "function") ? has(s, f) : !!(s.flags && s.flags[f]); }

// 计算本周时间预算（派生，只读）：固定占用 + 自由时间
function computeWeekBudget(s) {
  const stageHours = (s.hoursBudget != null) ? s.hoursBudget : WEEK_BASE_HOURS;
  let fixed = 0;
  const blocks = [];
  // 全职上班：自动占用约 5 个工作日（40h）；高压加班公司额外吃晚上/周末
  const employed = !!s.job;
  const fulltimeVenture = !!(s.startup && s.startup.fulltime);
  if (employed) {
    fixed += 40; blocks.push({ id: "work", label: "上班", hours: 40 });
    const ot = (s.job.stress || 0) >= 7 ? 10 : (s.job.stress || 0) >= 5 ? 5 : 0;
    if (ot) { fixed += ot; blocks.push({ id: "overtime", label: "加班", hours: ot }); }
    const ch = commuteHoursOf(s);
    if (ch) { fixed += ch; blocks.push({ id: "commute", label: "通勤", hours: ch }); }
  } else if (fulltimeVenture) {
    fixed += 50; blocks.push({ id: "venture", label: "全职创业", hours: 50 });
  } else if (s.study && s.study.active) {
    fixed += 30; blocks.push({ id: "class", label: "上课", hours: 30 });
  }
  // 生病 / 住院 / 严重健康问题：强制占用，压缩自由行动（重病几乎占满本周 → 0-1 格，doc §2.5）
  if ((s.health || 100) <= 8 || s._hospitalized) { fixed += 52; blocks.push({ id: "hospital", label: "住院/卧床", hours: 52 }); }
  else if ((s.health || 100) <= 25) { fixed += 22; blocks.push({ id: "sick", label: "抱恙休养", hours: 22 }); }
  // 找工作本身：占用一周主要行动（doc §3.2）——记为可见固定块（实际仍走 jobhunt 行动消耗）
  const free = Math.max(0, stageHours - fixed);
  // 自由行动「格子」数：把自由小时折算成 0-3 个行动位（学生多、加班/住院少）
  let slots;
  if (free >= 48) slots = 3;
  else if (free >= 24) slots = 2;
  else if (free >= 10) slots = 1;
  else slots = 0;
  return { base: stageHours, fixed, free, blocks, slots, employed, fulltimeVenture };
}

function freeSlots(s) { return computeWeekBudget(s).slots; }

// 给 UI 的一句话概览
function weekBudgetSummary(s) {
  const b = computeWeekBudget(s);
  const tag = b.fulltimeVenture ? "全职创业" : b.employed ? "在职" : (s.study && s.study.active) ? "在校" : "自由";
  return {
    base: b.base, fixed: b.fixed, free: b.free, slots: b.slots, status: tag,
    blocks: b.blocks,
    line: `本周可支配约 ${b.free}h（固定占用 ${b.fixed}h｜${b.blocks.map(x => x.label + x.hours + "h").join(" · ") || "无"}）`
  };
}

/* ===== 行动格（slots）：真正的周回合currency（下一轮·第一刀，doc §2）=====
 * 每周 total = computeWeekBudget(s).slots（学生~3、上班~1、重病0）。每个行动消耗
 * slotCost（默认1；辞职/搬城/旅行/投资/全职创业等「决策/转场类」记0，不吃回合）。
 * 用完即可结束本周——不再靠旧 hours 把一周「填满」。hours 退为体力/过劳的次级成本。 */
function initWeekSlots(s) {
  const wb = computeWeekBudget(s);
  s.weekSlots = { total: wb.slots, used: 0, actions: [] };
  return s.weekSlots;
}
function ensureWeekSlots(s) { if (!s.weekSlots || typeof s.weekSlots.total !== "number") initWeekSlots(s); return s.weekSlots; }
// 决策/转场类行动不吃回合（打开子界面或切换状态，不算「安排了一件事」）
const ZERO_SLOT_ACTIONS = { quit: 1, relocate: 1, travel: 1, invest: 1, venture: 1, abroad: 1, startup: 1, move_near_office: 0 };
function actionSlotCost(a) {
  if (!a) return 1;
  if (a.slotCost != null) return a.slotCost;
  if (ZERO_SLOT_ACTIONS[a.id] === 1) return 0;
  return 1;
}
function weekSlotsLeft(s) { const ws = ensureWeekSlots(s); return Math.max(0, ws.total - ws.used); }
function weekSlotsFull(s) { const ws = ensureWeekSlots(s); return ws.total <= 0 || ws.used >= ws.total; }
function spendSlots(s, a) {
  const ws = ensureWeekSlots(s); const cost = actionSlotCost(a);
  if (cost > 0) { ws.used += cost; ws.actions.push(a && a.id); }
  return ws;
}

if (typeof window !== "undefined") window.WEEK_BASE_HOURS = WEEK_BASE_HOURS;
