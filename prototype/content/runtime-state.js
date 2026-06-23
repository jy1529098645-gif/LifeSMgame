"use strict";
/* =====================================================================
 * content/runtime-state.js —— 运行时状态接口层（升级·第一阶段地基）
 * 给所有新系统一个统一、幂等、兼容旧存档的入口：
 *   ensureRuntime(s)         一次性补齐所有新结构（newState/读档后调用）
 *   currentScene(s)          统一场景读取（work/study/venture/travel/family/life）
 *   addMemory / bumpThread / threadLevel   结构化记忆与持续矛盾
 *   tickNarrativeSystems(s)  每周由引擎调用：季度世界/行业/影响/cast 推进
 * 所有 ensureXxx 必须幂等：重复调用不破坏既有数据。
 * ===================================================================== */

function ensureWorldModel(s) {
  if (!s.world) return;                               // initWorld 尚未跑则跳过
  if (typeof initIndustryState === "function") initIndustryState(s);
}
function ensureThreads(s) { if (!s.threads) s.threads = {}; return s.threads; }
function ensureMemories(s) { if (!s.memories) s.memories = []; return s.memories; }
function ensureCast(s) { if (!s.cast) s.cast = {}; return s.cast; }
function ensureArcState(s) { if (!s.mainArc) s.mainArc = null; if (!s.arcLog) s.arcLog = []; return s.mainArc; }

function ensureRuntime(s) {
  if (typeof ensureInfluence === "function") ensureInfluence(s);
  ensureWorldModel(s);
  if (typeof ensureProfile === "function") ensureProfile(s);
  if (typeof ensureFounderState === "function") ensureFounderState(s);
  if (typeof ensureCompanyFields === "function" && s.startup) ensureCompanyFields(s);
  ensureThreads(s);
  ensureMemories(s);
  ensureCast(s);
  ensureArcState(s);
  // —— 大框架改造·批次1：主线阶段 / 提醒队列地基（幂等，兼容旧档）——
  if (typeof ensureMainStage === "function") ensureMainStage(s);
  if (typeof ensureNotices === "function") ensureNotices(s);
}

/* —— 结构化记忆：人生回响 / 结局回顾 / 二周目遗产 —— */
function addMemory(s, memory) {
  ensureMemories(s);
  s.memories.push(Object.assign({ age: s.age, year: s.year, week: s.week }, memory));
  // 上限保护，避免一生堆几千条
  if (s.memories.length > 200) s.memories.splice(0, s.memories.length - 200);
}
/* —— 持续矛盾：父母债务 / 婚姻裂痕 / 合伙人背叛 / 身份危机 —— */
function bumpThread(s, id, delta, data) {
  ensureThreads(s);
  const t = s.threads[id] || (s.threads[id] = { level: 0, status: "open", lastAge: s.age });
  t.level = Math.max(0, Math.min(100, (t.level || 0) + (delta || 0)));
  t.lastAge = s.age;
  if (data) Object.assign(t, data);
  return t;
}
function threadLevel(s, id) { return (s.threads && s.threads[id] && s.threads[id].level) || 0; }

/* —— 统一场景读取：事件调度据此优先抽当前场景事件 —— */
function currentScene(s) {
  if (s.study && s.study.active) return { type: "study", id: s.study.country || "abroad", weight: 100 };
  if (s.startup && s.startup.fulltime) return { type: "venture", id: (s.startup.track || "venture"), weight: 100 };
  if (s.trip) return { type: "travel", id: (s.trip.city && s.trip.city.id) || "trip", weight: 100 };
  if (s.job) return { type: "work", id: (s.workScene && s.workScene.kind) || s.job.jobType || s.job.id || "work", weight: 70 };
  if (has(s, "married") || has(s, "has_kid")) return { type: "family", id: "home", weight: 50 };
  return { type: "life", id: "daily", weight: 30 };
}

/* —— 关键角色 cast：轻量 tick（让 NPC 像活在世界里）—— */
function castMember(s, id) { ensureCast(s); return s.cast[id] || null; }
function addCastMember(s, id, data) {
  ensureCast(s);
  if (!s.cast[id]) s.cast[id] = Object.assign({ id: id, trust: 50, pressure: 30, memories: [] }, data || {});
  return s.cast[id];
}
function _castNote(s, t) { if (!s._weekNotes) s._weekNotes = []; if (s._weekNotes.length < 40) s._weekNotes.push(t); }
function _indName(s, id) { return (typeof INDUSTRIES !== "undefined" && INDUSTRIES[id]) ? INDUSTRIES[id].name : "所在行业"; }
// NPC 也活在世界里：每年按行业冷热/压力，自己的命运起落（升迁/落魄/成家/迁城），并冒出可见的近况
function rollCastFortune(s, c) {
  const ind = (c.industry && typeof industryState === "function") ? industryState(s, c.industry) : null;
  const r = Math.random();
  if (ind && ind.heat > 68 && r < 0.32) {
    c.trust = Math.min(100, (c.trust || 50) + 4); c.pressure = Math.max(0, (c.pressure || 30) - 8); c.status = "rising";
    _castNote(s, `👤 听说${c.name}最近混得风生水起——${_indName(s, c.industry)}正当红。`);
  } else if ((ind && ind.heat < 30 && r < 0.4) || ((c.pressure || 0) > 76 && r < 0.35)) {
    c.pressure = Math.min(100, (c.pressure || 30) + 10); c.status = "falling";
    _castNote(s, `👤 ${c.name}最近不太顺，${ind && ind.heat < 30 ? _indName(s, c.industry) + "整个行业都在过冬" : "压力大得很"}。`);
  } else if (r < 0.12) {
    c.status = "married"; c.trust = Math.min(100, (c.trust || 50) + 2);
    _castNote(s, `👤 ${c.name}成家了，给你发来一张喜帖。`);
  } else if (r < 0.18) {
    c.status = "moved"; c.trust = Math.max(0, (c.trust || 50) - 3);
    _castNote(s, `👤 ${c.name}搬去了别的城市，联系渐渐少了。`);
  }
  // 伴侣类角色：分开多年又起复合的念头
  if (!c.crisis && /伴侣|对象|恋|前任/.test(c.role || "") && (c.trust || 50) < 45 && r > 0.85) { c.crisis = "reunite"; c.crisisWeek = s.week; }
}
function tickCast(s) {
  if (!s.cast) return;
  for (const id in s.cast) {
    const c = s.cast[id];
    // 受行业/城市世界状态影响：所在行业遇冷 → 压力上升（NPC 也活在这个世界里）
    if (c.industry && typeof industryState === "function") {
      const ind = industryState(s, c.industry);
      if (ind && ind.heat < 30) c.pressure = Math.min(100, (c.pressure || 30) + 2);
      else if (ind && ind.heat > 70) c.pressure = Math.max(0, (c.pressure || 30) - 1);
    }
    // 每年一次：NPC 自己的命运演化
    if (c._fyr !== s.year) { c._fyr = s.year; rollCastFortune(s, c); }
    // 高压久了 → 进入一桩有事件兜底的危机（求助/拉创业），反过来找上你
    if (!c.crisis && (c.pressure || 0) > 68 && Math.random() < 0.2) {
      c.crisis = (c.industry && industryState && industryState(s, c.industry) && industryState(s, c.industry).heat > 70) ? "startup_invite" : (Math.random() < 0.5 ? "debt" : "illness");
      c.crisisWeek = s.week;
    }
  }
}
// 取一个当前处于危机中的关键角色（events-cast 用）
function castWithCrisis(s, type) {
  if (!s.cast) return null;
  for (const id in s.cast) { const c = s.cast[id]; if (c.crisis && (!type || c.crisis === type)) return c; }
  return null;
}
function clearCrisis(c) { if (c) { c.crisis = null; c.pressure = Math.max(0, (c.pressure || 40) - 25); } }

/* —— 每周叙事系统推进（引擎在 tickWorld 之后调用）—— */
function tickNarrativeSystems(s) {
  // 主线阶段每周派生推进（不依赖 world，必须先于 world 早退执行）——大框架改造·批次1
  if (typeof mainStageTick === "function") mainStageTick(s);
  if (!s.world) return;
  ensureWorldModel(s);
  const advanced = (typeof tickWorldQuarter === "function") ? tickWorldQuarter(s) : false;
  if (advanced) {
    if (typeof applyWorldImpacts === "function") applyWorldImpacts(s);
    if (typeof accrueInfluence === "function") accrueInfluence(s);   // 影响力随「你成了多大的人物」逐季累积
    if (typeof founderPrepFromScene === "function") founderPrepFromScene(s);   // 打工本身在攒创业底牌
    tickCast(s);
  }
}
