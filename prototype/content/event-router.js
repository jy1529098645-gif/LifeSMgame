"use strict";
/* =====================================================================
 * content/event-router.js —— 事件路由（中国式家长化·第二轮 §7）
 * 让「我本周安排了什么」决定「触发了什么」，而不是每周末从大池纯随机抽。
 * pickWeeklyEvent(s, ctx) 返回一个高优先级的【因果事件】，或 null（→ 引擎回退 drawAmbient）。
 *
 * 优先级（doc §7.1）：① 行动 hook（做了什么就更易遇到什么）② 当前事件链下一节点
 *   ③ 人物主动邀请 ④ 当前场景事件。世界/新闻/通用仍交给旧 drawAmbient 兜底（非破坏式）。
 * ===================================================================== */

const AMBIENT_CD_ROUTER = 12;   // 与引擎 AMBIENT_COOLDOWN 同量级

// 本周行动 → 更易触发的事件 id 前缀（doc §7.3）
const ACTION_EVENT_BIAS = {
  leisure:          ["ev_cn_chess_meet", "ev_cn_invite_chess", "ev_cn_reveal", "ev_cn_invite_opportunity"],
  move_near_office: ["ev_commute_"],
  collect_evidence: ["ev_wc_blame", "ev_wc_credit", "ev_wc_sever", "ev_wc_arb"],
  coworker_lunch:   ["ev_wc_credit", "ev_cn_invite_dinner", "ev_wc_teambuild"],
  validate_need:    ["ev_cn_invite_opportunity", "ev_fraud_antiscam_seed", "ev_resign_decision"],
  socialize:        ["ev_cn_invite_dinner", "ev_cn_reveal", "ev_cn_invite_opportunity"],
  work:             ["ev_commute_", "ev_wc_blame", "ev_wc_credit", "ev_wc_probation", "ev_wc_nopay"],
  browse:           ["ev_fraud_contact"],
  invest:           ["ev_fraud_contact", "ev_fraud_pushin"],
  jobhunt:          ["ev_wc_"],   // 求职相关由 ev_jobhunt 自身处理，这里留空名义
  rest:             ["ev_hc_"]
};

function _routerEligible(s, e) {
  if (!e || !e.ambient) return false;
  if (e.once && (typeof has === "function") && has(s, "ev_" + e.id)) return false;
  if (!e.once && s._cd && s._cd[e.id] && (s.week - s._cd[e.id]) < AMBIENT_CD_ROUTER) return false;
  try { return !e.cond || e.cond(s); } catch (x) { return false; }
}
function _byPrefix(s, prefixes) {
  if (typeof EVENTS === "undefined") return [];
  return EVENTS.filter(e => e.id && prefixes.some(p => e.id.indexOf(p) === 0) && _routerEligible(s, e));
}

// 引擎在 endWeek 里优先调用；返回事件则触发它，返回 null 则回退 drawAmbient()
function pickWeeklyEvent(s, ctx) {
  ctx = ctx || {};
  // 与 drawAmbient 同款 pity-gate：本周是否触发「因果事件」。不触发则交还引擎（drawAmbient 自有 gate）。
  // 保证因果事件总频率与旧版相当，只是把「随机抽」换成「按你做的事抽」，不会刷屏（doc §7.4）。
  const dry = s._evDry || 0;
  const baseP = Math.min(0.16, 0.06 + Math.max(0, dry - 8) * 0.006);
  if (typeof rnd === "function" ? !rnd(baseP) : Math.random() >= baseP) return null;
  const did = ctx.lastActions || (s._weekActs ? Object.keys(s._weekActs) : []) || [];

  // ① 行动 hook：你这周做了什么，就更容易遇到对应的事（中国式家长式因果）
  const hookPool = [];
  for (const id of did) {
    const pre = ACTION_EVENT_BIAS[id];
    if (pre) hookPool.push(..._byPrefix(s, pre));
  }
  if (hookPool.length && (typeof rnd === "function" ? rnd(0.5) : Math.random() < 0.5)) {
    return _pickOne(hookPool);
  }

  // ② 事件链下一节点：手头有未结的链（通勤/职场/电诈/健康），优先续推
  const chainPre = ["ev_commute_", "ev_wc_", "ev_fraud_", "ev_hc_"];
  const chainPool = _byPrefix(s, chainPre).filter(e => _chainActive(s, e));
  if (chainPool.length && (typeof rnd === "function" ? rnd(0.4) : Math.random() < 0.4)) {
    return _pickOne(chainPool);
  }

  // ③ 人物主动邀请：关系网会主动找上你（doc §6.4/§9.3）
  const invitePool = _byPrefix(s, ["ev_cn_invite", "ev_cn_chess_meet", "ev_cn_reveal"]);
  if (invitePool.length && (typeof rnd === "function" ? rnd(0.3) : Math.random() < 0.3)) {
    return _pickOne(invitePool);
  }

  // ④ 当前场景事件：在公司更易遇到职场事，在公园更易遇到棋友
  const tags = (typeof sceneEventTags === "function") ? sceneEventTags(s) : [];
  if (tags.length) {
    const scenePool = (typeof EVENTS !== "undefined" ? EVENTS : []).filter(e =>
      _routerEligible(s, e) && (e.sceneTags ? e.sceneTags.some(t => tags.includes(t)) : (e.module && tags.includes(_moduleTag(e.module)))));
    if (scenePool.length && (typeof rnd === "function" ? rnd(0.22) : Math.random() < 0.22)) {
      return _pickOne(scenePool);
    }
  }

  return null;   // 交还给引擎的 drawAmbient（世界/新闻/通用/脊柱）
}

// 链是否「进行中」：用各链自己的 stage/state 字段判断
function _chainActive(s, e) {
  const id = e.id || "";
  if (id.indexOf("ev_commute_") === 0) return !!(s.commute && s.commute.far) || id === "ev_commute_far";
  if (id.indexOf("ev_wc_arb") === 0) return !!(s.workChains && s.workChains.arb && s.workChains.arb < 9);
  if (id.indexOf("ev_fraud_") === 0) return !!(s.fraud && s.fraud.stage > 0 && s.fraud.stage < 9) || id === "ev_fraud_contact";
  if (id.indexOf("ev_hc_") === 0) return !!(s.healthChain && s.healthChain.stage > 0) || id === "ev_hc_symptom";
  return true;
}
function _moduleTag(m) {
  const map = { career: "work", venture: "venture", startup: "startup", world: "world", relation: "network", health: "health", love: "family", family: "family" };
  return map[m] || m;
}
function _pickOne(arr) {
  if (!arr || !arr.length) return null;
  if (typeof pick === "function") return pick(arr);
  return arr[Math.floor((typeof Math !== "undefined" ? Math.random() : 0) * arr.length)];
}

if (typeof window !== "undefined") window.ACTION_EVENT_BIAS = ACTION_EVENT_BIAS;
