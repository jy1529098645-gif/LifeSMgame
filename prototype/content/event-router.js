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
  validate_need:    ["ev_life_crossroads", "ev_cn_invite_opportunity", "ev_fraud_antiscam_seed", "ev_resign_decision"],
  calculate_runway: ["ev_life_crossroads", "ev_opp_preview"],
  talk_to_mentor:   ["ev_life_crossroads", "ev_cn_invite_opportunity"],
  socialize:        ["ev_cn_invite_dinner", "ev_cn_reveal", "ev_cn_invite_opportunity"],
  work:             ["ev_commute_", "ev_wc_blame", "ev_wc_credit", "ev_wc_probation", "ev_wc_nopay"],
  browse:           ["ev_fraud_contact"],
  invest:           ["ev_fraud_contact", "ev_fraud_pushin"],
  jobhunt:          ["ev_jh_"],   // 00后求职荒诞：已读不回/AI筛/免费方案/群面/同学晒offer/假HR
  prep_interview:   ["ev_jh_weird_question", "ev_jh_group_interview"],
  ask_senior:       ["ev_jh_classmate_offer", "ev_cn_invite_chess"],
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
function _roll(p) { return (typeof rnd === "function") ? rnd(p) : Math.random() < p; }

function pickWeeklyEvent(s, ctx) {
  ctx = ctx || {};
  // 不再用「低概率总闸」压制——改为【分层强响应】：你做了什么，就更可能演绎什么（doc §4.2/§4.3）。
  // 没命中也不空过：引擎会用 buildWeeklyReflection 给一段本周小结。drawAmbient 退到最后兜底。
  const did = ctx.lastActions || (s._weekActs ? Object.keys(s._weekActs) : []) || [];

  // ① 未完成事件链续推：手头有进行中的链（通勤/职场/电诈/健康）→ 高优先（70%）
  const chainPool = _byPrefix(s, ["ev_commute_", "ev_wc_", "ev_fraud_", "ev_hc_"]).filter(e => _chainActive(s, e));
  if (chainPool.length && _roll(0.65)) return _pickOne(chainPool);

  // ② 行动 hook：你这周做了什么，就更容易遇到对应的事（45%）
  const hookPool = [];
  for (const id of did) { const pre = ACTION_EVENT_BIAS[id]; if (pre) hookPool.push(..._byPrefix(s, pre)); }
  if (hookPool.length && _roll(0.45)) return _pickOne(hookPool);

  // ③ 人物主动邀请：关系网会主动找上你（35%）
  const invitePool = _byPrefix(s, ["ev_cn_invite", "ev_cn_chess_meet", "ev_cn_reveal"]);
  if (invitePool.length && _roll(0.35)) return _pickOne(invitePool);

  // ④ 当前场景 flavor 事件（25%）
  const tags = (typeof sceneEventTags === "function") ? sceneEventTags(s) : [];
  if (tags.length) {
    const scenePool = (typeof EVENTS !== "undefined" ? EVENTS : []).filter(e =>
      _routerEligible(s, e) && (e.sceneTags ? e.sceneTags.some(t => tags.includes(t)) : (e.module && tags.includes(_moduleTag(e.module)))));
    if (scenePool.length && _roll(0.25)) return _pickOne(scenePool);
  }

  return null;   // 无因果事件 → 引擎做「本周小结」，仅在更稀有时回退 drawAmbient
}

/* —— 本周小结：没触发事件时也给一段有数值的短反馈，避免空过（doc §4.4）。返回字符串或 null。 —— */
function buildWeeklyReflection(s, ctx) {
  ctx = ctx || {};
  const did = ctx.lastActions || (s._weekActs ? Object.keys(s._weekActs) : []) || [];
  const had = (arr) => arr.some(id => did.indexOf(id) >= 0);
  // 只在「确实安排了事」的周给小结；完全空过的周不强行加戏
  if (!did.length) return null;
  let line = null;
  if (had(["work", "overtime_perf"])) { if (typeof add === "function") { add(s, "stress", 1); } line = "📋 这一周在公司和地铁之间来回。没什么大事，但绩效记录稳了一点，疲惫也攒了一点。"; }
  else if (had(["study", "prep_interview", "learn_industry", "ask_senior"])) { line = "📖 平静的一周，你把时间花在了让自己更值钱的事上——回报看不见，却在悄悄累积。"; }
  else if (had(["jobhunt"])) { line = "📨 又投了一圈简历。没有回音的日子有点磨人，但海投本就是个概率游戏，再等等。"; }
  else if (had(["leisure", "exercise", "rest"])) { if (typeof add === "function") { add(s, "stress", -1); } line = "🍵 难得松快的一周，把自己交还给生活。压力卸了一点，明天才有力气继续。"; }
  else if (had(["socialize", "coworker_lunch", "talk_to_mentor"])) { line = "🤝 一周在饭桌与寒暄里过去。人情这东西看不见摸不着，关键时刻却能值千金。"; }
  else if (had(["validate_need", "calculate_runway", "side_project"])) { line = "🔎 你在为那个念头默默铺路。没人看见，但属于你自己的东西，正在一点点成形。"; }
  else line = "🌧️ 平平无奇的一周，日子在指缝里又溜走了一点。";
  return line;
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
