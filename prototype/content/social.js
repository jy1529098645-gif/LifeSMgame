"use strict";
/* =====================================================================
 * content/social.js —— 社交圈系统（v1.1 邓巴圈层重构）
 * 旧版只有扁平的 ~6 人，亲疏不分。新版按【亲密度】分三层金字塔：
 *   ① 核心圈 tier1（至亲挚友）：2~4 人，基础态度高，几乎不受你境况影响——
 *      不离不弃、雪中送炭。socialShift 对他们作用极小。
 *   ② 中间圈 tier2（好友/同事/同学/亲戚）：6~9 人，中度受你境况影响。
 *   ③ 外围圈 tier3（熟人/网友/点头之交）：10~15 人具名 + 一片「弱连接海洋」
 *      (s.socialOuter，几十上百人只记总数与平均态度)。势利眼为主，
 *      你风光时蜂拥而上、你落魄时一哄而散——波动最剧烈。
 *
 * 每个 NPC：{ name, role, kind, attitude(0-100), tier(1/2/3), persona }。
 *   kind=性格轴（势利/清高/仗义/亲情/普通，决定方向）；tier=亲密轴（决定波动幅度）。
 * s.social 仍是【扁平数组】(核心+中间+外围具名)，relationList / socialBoostRole /
 *   persona 等既有逻辑无需改动即可兼容。
 * ===================================================================== */

// —— 分层角色池：越核心越少、越外围越多 ——
const SOCIAL_CORE = [
  { role: "爸妈", kind: "亲情", base: 85, tier: 1, unique: true },
  { role: "发小", kind: "仗义", base: 70, tier: 1 },
  { role: "挚友", kind: "仗义", base: 68, tier: 1 },
  { role: "亲兄弟姐妹", kind: "亲情", base: 72, tier: 1 }
];
const SOCIAL_MID = [
  { role: "大学室友", kind: "普通", base: 56, tier: 2 },
  { role: "现同事", kind: "普通", base: 52, tier: 2 },
  { role: "老同学", kind: "清高", base: 53, tier: 2 },
  { role: "健身搭子", kind: "仗义", base: 55, tier: 2 },
  { role: "直属领导", kind: "势利", base: 47, tier: 2 },
  { role: "近亲戚", kind: "势利", base: 50, tier: 2 },
  { role: "邻居", kind: "普通", base: 51, tier: 2 },
  { role: "球友牌友", kind: "普通", base: 53, tier: 2 }
];
const SOCIAL_OUTER = [
  { role: "前同事", kind: "势利", base: 46, tier: 3 },
  { role: "网友", kind: "普通", base: 48, tier: 3 },
  { role: "微信好友", kind: "势利", base: 44, tier: 3 },
  { role: "点头之交", kind: "普通", base: 46, tier: 3 },
  { role: "客户", kind: "势利", base: 44, tier: 3 },
  { role: "同行", kind: "势利", base: 45, tier: 3 },
  { role: "楼下店主", kind: "普通", base: 50, tier: 3 },
  { role: "老家亲戚", kind: "势利", base: 47, tier: 3 },
  { role: "群友", kind: "普通", base: 47, tier: 3 },
  { role: "校友", kind: "清高", base: 48, tier: 3 },
  { role: "旧相识", kind: "普通", base: 46, tier: 3 },
  { role: "饭局熟人", kind: "势利", base: 43, tier: 3 }
];
// 兼容旧引用：保留扁平的 SOCIAL_ROLES（=三层合并）
const SOCIAL_ROLES = [].concat(SOCIAL_CORE, SOCIAL_MID, SOCIAL_OUTER);
const SOCIAL_NAMES = ["老王", "阿强", "莉莉", "胖虎", "张姐", "老陈", "二狗", "婷婷", "老周", "Kevin", "丹丹", "强子", "小美", "老李"];

// tier → socialShift 作用幅度（核心圈几乎不波动，外围圈最势利）
const TIER_SHIFT = { 1: 0.15, 2: 0.55, 3: 1.0 };
// kind → 态度变化方向系数
function kindDir(kind) {
  if (kind === "势利") return 1.0;       // 锦上添花，也最容易树倒猢狲散
  if (kind === "清高") return -0.7;      // 你炫耀 ta 反而远离
  if (kind === "亲情") return 0.2;
  if (kind === "仗义") return 0.2;       // 重情不重钱，钝感
  return 0.6;                            // 普通：随大流
}

// 生成本局社交圈：核心层 2~3（爸妈必有）+ 中间层 5~8 + 外围层 10~14 具名 + 一片弱连接海洋
function initSocial(s) {
  const cityStyle = (s.city && s.city.country) ? s.city.country : "cn";
  const used = {};
  const localRoleSet = { "邻居": 1, "现同事": 1, "直属领导": 1, "健身搭子": 1, "前同事": 1, "客户": 1, "同行": 1, "楼下店主": 1, "饭局熟人": 1 };
  const sameCityRoles = { "邻居": 1, "现同事": 1, "直属领导": 1, "健身搭子": 1, "客户": 1, "同行": 1, "楼下店主": 1, "饭局熟人": 1 };
  const hometownRoles = { "爸妈": 1, "发小": 1, "亲兄弟姐妹": 1, "近亲戚": 1, "老家亲戚": 1 };
  const onlineRoles = { "网友": 1, "群友": 1, "微信好友": 1 };
  function cityLabel(c) {
    if (!c) return "本地";
    if (typeof cityFull === "function") return cityFull(c);
    return c.name || c.cityName || c.provinceName || "本地";
  }
  function currentCityLabel() { return cityLabel(s.city); }
  function hometownLabel() {
    const b = s.birthplace || {};
    return b.cityName || b.name || b.provinceName || b.path || "老家";
  }
  function otherCityLabel() {
    const all = (typeof CITIES !== "undefined" && CITIES) ? CITIES : [];
    const pool = all.filter(c => !s.city || c.name !== s.city.name || c.province !== s.city.province);
    const c = pool.length ? pick(pool) : null;
    return c ? cityLabel(c) : "外地";
  }
  function residenceFor(r) {
    if (sameCityRoles[r.role]) return { homeCity: currentCityLabel(), residence: "同城", meetable: true };
    if (onlineRoles[r.role]) {
      if (Math.random() < 0.22) return { homeCity: "海外", residence: "线上", meetable: false };
      return { homeCity: otherCityLabel(), residence: "线上", meetable: false };
    }
    if (hometownRoles[r.role]) {
      if (Math.random() < 0.38) return { homeCity: currentCityLabel(), residence: "同城", meetable: true };
      return { homeCity: hometownLabel(), residence: "老家", meetable: false };
    }
    if (r.role === "大学室友" || r.role === "老同学" || r.role === "校友" || r.role === "旧相识" || r.role === "前同事") {
      if (Math.random() < 0.45) return { homeCity: currentCityLabel(), residence: "同城", meetable: true };
      return { homeCity: otherCityLabel(), residence: "外地", meetable: false };
    }
    if (Math.random() < 0.62) return { homeCity: currentCityLabel(), residence: "同城", meetable: true };
    return { homeCity: otherCityLabel(), residence: "外地", meetable: false };
  }
  function nameFor(r) {
    if (r.role === "爸妈") return "爸妈";
    const local = !!localRoleSet[r.role];
    const style = (cityStyle !== "cn" && local && Math.random() < 0.7) ? cityStyle : "cn";
    let nm = (typeof genName === "function") ? genName(style) : (typeof genCNName === "function" ? genCNName() : pick(SOCIAL_NAMES));
    let guard = 0; while (used[nm] && guard++ < 25) nm = (typeof genName === "function") ? genName(style) : pick(SOCIAL_NAMES);
    used[nm] = 1; return nm;
  }
  // —— 魅力决定社交盘子：高魅力的人天生朋友多、人缘热；低魅力的人圈子小、关系也淡 ——
  const ch = (s.stats && s.stats.charm != null) ? s.stats.charm : 35;
  const chBonus = Math.round((ch - 35) / 4);                 // 态度暖度：魅力95→+15、魅力10→-6
  function mk(r) {
    const persona = (typeof makePersona === "function") ? makePersona() : null;
    // 同层内态度略有个体差异 + 魅力暖度（核心圈血缘受影响小）
    const jitter = Math.round((Math.random() - 0.5) * 8);
    const warm = r.tier === 1 ? Math.round(chBonus * 0.4) : chBonus;
    const loc = residenceFor(r);
    return { name: nameFor(r), role: r.role, kind: r.kind, tier: r.tier, attitude: Math.max(0, Math.min(100, r.base + jitter + warm)), persona: persona, homeCity: loc.homeCity, residence: loc.residence, meetable: !!loc.meetable };
  }
  const list = [];
  // 核心：爸妈 + 挚友/发小/手足（魅力高更可能多一个铁哥们）
  list.push(mk(SOCIAL_CORE[0]));
  shuf(SOCIAL_CORE.slice(1)).slice(0, ch >= 58 ? 2 : (Math.random() < 0.55 ? 1 : 1)).forEach(r => list.push(mk(r)));
  // 中间圈：3~12 人，随魅力放大
  const midN = Math.max(3, Math.min(12, 4 + Math.round((ch - 25) / 7)));
  shuf(SOCIAL_MID).slice(0, midN).forEach(r => list.push(mk(r)));
  // 外围圈：5~22 人具名，随魅力放大（可重复角色，名字不同）
  const outerN = Math.max(5, Math.min(22, 8 + Math.round((ch - 25) / 4.5)));
  for (let i = 0; i < outerN; i++) list.push(mk(pick(SOCIAL_OUTER)));
  s.social = list;
  // 弱连接海洋：泛泛之交规模也随魅力涨落（社牛能囤一两百个微信好友，社恐只剩几十）
  s.socialOuter = { count: Math.max(12, Math.round(18 + ch * 1.25)), attitude: Math.max(30, 46 + Math.round(chBonus * 0.5)) };
}

// 炫富/成就/风光(mag>0) 或 落魄/塌房(mag<0)：按【亲密度 tier】衰减 + 按【性格 kind】定方向
function socialShift(s, mag) {
  if (!s.social) return;
  for (const n of s.social) {
    const tf = TIER_SHIFT[n.tier || 3] || 0.6;
    const d = Math.round(mag * tf * kindDir(n.kind));
    n.attitude = Math.max(0, Math.min(100, n.attitude + d));
  }
  // 弱连接海洋最势利：你风光时蜂拥、落魄时退散，波动最大
  if (s.socialOuter) s.socialOuter.attitude = Math.max(0, Math.min(100, s.socialOuter.attitude + Math.round(mag * 1.0)));
}
// 单独抬升某个角色的所有人（如给父母买房 → 爸妈态度大涨）
function socialBoostRole(s, role, d) {
  if (!s.social) return;
  for (const n of s.social) if (n.role === role) n.attitude = Math.max(0, Math.min(100, n.attitude + d));
}
// —— 关系有界衰减：疏于联系会慢慢降温，但有「地板」，不会归零（越亲的地板越高）——
// 引擎按月调用。亲密轴(tier)定地板，性格轴(kind)微调；只在「高于地板」时才回落，且每次仅 1 点。
const TIER_FLOOR = { 1: 56, 2: 40, 3: 28 };
function socialFloor(n) {
  let f = TIER_FLOOR[n.tier || 3] || 30;
  if (n.kind === "亲情") f += 14;      // 血缘：地板最高，几乎不离不弃
  else if (n.kind === "仗义") f += 8;  // 重情：地板较高
  else if (n.kind === "势利") f -= 6;  // 势利：地板低，落魄就疏远
  return Math.max(0, Math.min(95, f));
}
function socialDecay(s) {
  if (!s.social) return;
  for (const n of s.social) { const f = socialFloor(n); if (n.attitude > f) n.attitude = Math.max(f, n.attitude - 1); }
  // 弱连接海洋也向中性回落（不经营就泯然众人）
  if (s.socialOuter && s.socialOuter.attitude > 45) s.socialOuter.attitude -= 1;
}
// —— 主动经营关系：花时间「社交应酬/陪伴」时，定向升温某个人（优先回暖正在变冷的人）——
function socialCultivate(s, mag, preferTier) {
  if (!s.social) return null;
  let pool = (s.social || []).filter(n => preferTier ? (n.tier || 3) === preferTier : true);
  if (!pool.length) pool = s.social;
  // 优先经营「离地板近、快冷掉」的关系，也照顾核心圈
  pool = pool.slice().sort((a, b) => (a.attitude - socialFloor(a)) - (b.attitude - socialFloor(b)));
  const n = pool[0]; if (!n) return null;
  n.attitude = Math.max(0, Math.min(100, n.attitude + mag));
  return n;
}
// 取某一亲密层的 NPC
function socialTier(s, t) { return (s.social || []).filter(n => (n.tier || 3) === t); }
// 某层平均态度（无人则返回 null）
function socialAvgTier(s, t) { const a = socialTier(s, t); return a.length ? Math.round(a.reduce((x, n) => x + n.attitude, 0) / a.length) : null; }
// 整体平均态度（具名圈；弱连接海洋单独展示）
function socialAvg(s) { return (!s.social || !s.social.length) ? 50 : Math.round(s.social.reduce((a, n) => a + n.attitude, 0) / s.social.length); }
// 总人脉规模（含弱连接海洋）—— 用于文案/成就
function socialReach(s) { return (s.social ? s.social.length : 0) + (s.socialOuter ? s.socialOuter.count : 0); }
