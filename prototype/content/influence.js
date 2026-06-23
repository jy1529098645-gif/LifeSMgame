"use strict";
/* =====================================================================
 * content/influence.js —— 玩家影响世界层（叙事动态世界升级·第一阶段）
 * 玩家在 family/circle/city/industry/media/policy/capital/technology 八个维度
 * 积累影响力。达到城市/行业/时代级后，可把影响【写回】world.industries，
 * 并触发反噬。第一阶段：先把「积累 + 显示 + 写回」打通，不急于全面平衡。
 *
 *   addInfluence(s,key,n)  influenceTier(s)  influenceTierName(s)
 *   addWorldImpact(s,impact)  applyWorldImpacts(s)  influenceSummary(s)
 * ===================================================================== */

const INFLUENCE_KEYS = ["family", "circle", "city", "industry", "media", "policy", "capital", "technology"];
const INFLUENCE_TIER_NAMES = ["普通人", "圈层人物", "城市人物", "行业人物", "时代人物"];

function ensureInfluence(s) {
  if (!s.influence) s.influence = {};
  for (const k of INFLUENCE_KEYS) if (s.influence[k] == null) s.influence[k] = 0;
  return s.influence;
}
function addInfluence(s, key, n) {
  ensureInfluence(s);
  if (s.influence[key] == null) s.influence[key] = 0;
  s.influence[key] = Math.max(0, Math.min(100, s.influence[key] + n));
  return s.influence[key];
}
// 等级取「最具公共性的几维」的峰值（家庭/圈层不算入更高公共层级的门槛）
function influenceTier(s) {
  const inf = s.influence || {};
  const max = Math.max(inf.city || 0, inf.industry || 0, inf.media || 0, inf.policy || 0, inf.capital || 0, inf.technology || 0);
  if (max >= 85) return 4;
  if (max >= 65) return 3;
  if (max >= 45) return 2;
  if (max >= 25) return 1;
  // 仅有家庭/圈层影响力时算「圈层人物」
  if (Math.max(inf.family || 0, inf.circle || 0) >= 30) return 1;
  return 0;
}
function influenceTierName(s) { return INFLUENCE_TIER_NAMES[influenceTier(s)]; }

/* —— 世界改写：把影响力变成对行业的持续增量（带衰减）—— */
function addWorldImpact(s, impact) {
  if (!s.world) return;
  if (typeof initIndustryState === "function") initIndustryState(s);
  s.world.impacts = s.world.impacts || [];
  // impact: { industry, field, delta, note, duration? } 或 { industry, fields:{...} }
  s.world.impacts.push(Object.assign({ week: s.week || 0, duration: 156 }, impact));
}
// 每季度应用一次（由 tickNarrativeSystems 调用）：施加增量并随时间衰减、过期清除
function applyWorldImpacts(s) {
  if (!s.world || !s.world.impacts || !s.world.impacts.length) return;
  const now = s.week || 0;
  s.world.impacts = s.world.impacts.filter(im => (now - im.week) < (im.duration || 156));
  for (const im of s.world.impacts) {
    const age = now - im.week;
    const fade = Math.max(0.2, 1 - age / (im.duration || 156));   // 影响随时间淡出
    if (im.fields) { for (const f in im.fields) bumpImpact(s, im.industry, f, im.fields[f] * 0.25 * fade); }
    else if (im.field) bumpImpact(s, im.industry, im.field, (im.delta || 0) * 0.25 * fade);
  }
}
function bumpImpact(s, indId, field, delta) {
  if (typeof bumpIndustry === "function") { bumpIndustry(s, indId, field, delta); return; }
  const ind = s.world && s.world.industries && s.world.industries[indId];
  if (ind && ind[field] != null) ind[field] = Math.max(0, Math.min(100, ind[field] + delta));
}

/* —— 影响力自然累积（系统化）：每年结算时调用，按【身家/创业/声誉/体制/人脉】
 * 让影响力随「你成了多大的人物」缓慢逼近对应目标值——不再只靠零散事件零敲碎打。
 * 用 max(当前, min(目标, 当前+步长)) → 单调爬升、有天花板、不暴涨。*/
function _climb(inf, key, target, step) { inf[key] = Math.max(inf[key] || 0, Math.min(target, (inf[key] || 0) + step)); }
function accrueInfluence(s) {
  ensureInfluence(s);
  const inf = s.influence;
  const pi = (s.world && s.world.priceIndex) || 1;
  const real = ((s.cash || 0) + (s.assets || 0)) / pi;                 // 按购买力折算的身家
  // 资本影响力：身家分档
  const capT = real >= 1e9 ? 92 : real >= 1e8 ? 72 : real >= 2e7 ? 54 : real >= 5e6 ? 40 : real >= 1e6 ? 26 : real >= 2e5 ? 13 : 4;
  _climb(inf, "capital", capT, 3);
  // 行业影响力：创业上市 > 创业做成 > 在风口行业打拼
  if (has(s, "chase_ipo") && has(s, "startup_done")) _climb(inf, "industry", 72, 3);
  else if (has(s, "startup_done")) _climb(inf, "industry", 46, 2);
  else if (has(s, "startup")) _climb(inf, "industry", 22, 1);
  // 媒体影响力：声誉/网红
  const repT = s.reputation >= 70 ? 62 : s.reputation >= 45 ? 40 : s.reputation >= 25 ? 22 : 6;
  _climb(inf, "media", repT, 2);
  if (has(s, "streamer") || has(s, "internet_famous")) _climb(inf, "media", 55, 3);
  // 政策影响力：体制级别
  if ((s.civilRank || 0) >= 5) _climb(inf, "policy", 86, 3);
  else if ((s.civilRank || 0) >= 3) _climb(inf, "policy", 56, 2);
  else if (has(s, "civil_servant")) _climb(inf, "policy", 24, 1);
  // 圈层/城市：人脉 + 本地资源
  _climb(inf, "circle", Math.min(80, (s.network || 0) * 0.7), 2);
  if (has(s, "has_house")) _climb(inf, "city", 18, 1);
  // 家庭
  if (has(s, "married")) _climb(inf, "family", 30, 1);
  // 高影响力者「存在即改变行业」：行业级以上，温和地把主营行业越做越热（你定义了它）
  if (typeof influenceTier === "function" && influenceTier(s) >= 3 && typeof addWorldImpact === "function") {
    const indId = (s.startup && s.startup.track && typeof trackByName === "function" && trackByName(s.startup.track) && trackByName(s.startup.track).industry) || null;
    if (indId && !s._infImpactYr) { s._infImpactYr = s.year; addWorldImpact(s, { industry: indId, field: "heat", delta: 4, note: "你这样的行业人物，把它越做越热" }); }
    else if (indId && s._infImpactYr !== s.year) { s._infImpactYr = s.year; addWorldImpact(s, { industry: indId, field: "heat", delta: 3, note: "你的影响力持续拉动这个行业" }); }
  }
}

/* —— 一句话影响力摘要（仪表盘用）—— */
function influenceSummary(s) {
  const tier = influenceTier(s);
  if (tier === 0) return "";
  const inf = s.influence || {};
  // 找出最高的两维做注解
  const ranked = INFLUENCE_KEYS.map(k => ({ k, v: inf[k] || 0 })).filter(x => x.v >= 20).sort((a, b) => b.v - a.v).slice(0, 2);
  const labels = { family: "家庭", circle: "圈层", city: "城市", industry: "行业", media: "舆论", policy: "政策", capital: "资本", technology: "技术" };
  const tail = ranked.length ? "（" + ranked.map(x => labels[x.k]).join("·") + "）" : "";
  return INFLUENCE_TIER_NAMES[tier] + tail;
}
