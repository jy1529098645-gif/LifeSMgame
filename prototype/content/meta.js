"use strict";
/* =====================================================================
 * content/meta.js —— 跨局元进度（成就墙 / 图鉴 / 持久化）
 * 用 localStorage 把多局的成果累积下来：解锁的成就、见过的死法/结局/称号、
 * 走过的人生路线、玩过的局数、历史最高身价 —— 给「再来一局」一个累积的理由。
 * 引擎在死亡时调用 recordLife(summary)，标题页用 loadMeta() 展示图鉴。
 * ===================================================================== */
const META_KEY = "ALS_META_v1";
function loadMeta() {
  try { const raw = localStorage.getItem(META_KEY); if (raw) return JSON.parse(raw); } catch (e) { }
  return { achievements: {}, deaths: {}, endings: {}, titles: {}, paths: {}, goalsDone: {}, lives: 0, bestNW: 0, totalAge: 0 };
}
function saveMeta(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) { } }

// 跨局成就：check(L, M) —— L=本局总结, M=历史累计档案
const ACHIEVEMENTS = [
  { id: "first_life", name: "第一次投胎", emoji: "👶", desc: "踏入这个荒诞的世界。", check: () => true },
  { id: "goal_done", name: "得偿所愿", emoji: "🎯", desc: "达成你立下的人生目标。", check: (L) => L.goalDone },
  { id: "shore", name: "上岸", emoji: "🏛️", desc: "考公成功，端起铁饭碗。", check: (L) => L.civilRank >= 1 },
  { id: "tingji", name: "位列厅堂", emoji: "🎖️", desc: "官至副厅级。", check: (L) => L.civilRank >= 6 },
  { id: "ipo", name: "敲钟时刻", emoji: "🔔", desc: "把公司送上市。", check: (L) => L.ipo },
  { id: "freedom", name: "财务自由", emoji: "💰", desc: "身价突破一千万。", check: (L) => L.netWorth >= 10000000 },
  { id: "tianlong", name: "天龙人", emoji: "🐉", desc: "身价突破两千万。", check: (L) => L.netWorth >= 20000000 },
  { id: "longevity", name: "寿比南山", emoji: "🍵", desc: "活过八十岁。", check: (L) => L.age >= 80 },
  { id: "overwork", name: "热爱工作", emoji: "💀", desc: "用过劳猝死的方式离场。", check: (L) => /过劳|猝死/.test(L.deathCause || "") },
  { id: "jailed", name: "高墙之内", emoji: "🚨", desc: "贪腐落马，锒铛入狱。", check: (L) => L.jailed },
  { id: "emigrate", name: "润了", emoji: "🛫", desc: "移民海外，换一种活法。", check: (L) => L.emigrated },
  { id: "family", name: "儿孙满堂", emoji: "👨‍👩‍👧", desc: "成家、有娃、晚年圆满。", check: (L) => L.married && L.hasKid && L.age >= 65 },
  { id: "broke", name: "一贫如洗", emoji: "🥶", desc: "走到人生终点，身无分文。", check: (L) => L.netWorth < 0 },
  { id: "lottery", name: "天降横财", emoji: "🎰", desc: "中过一次大奖。", check: (L) => L.lottery },
  { id: "polymath", name: "六边形战士", emoji: "🛡️", desc: "临终时六维属性全部 ≥ 60。", check: (L) => L.minStat >= 60 },
  { id: "abroad", name: "见过世面", emoji: "✈️", desc: "出过国（留学或旅游）。", check: (L) => L.abroad },
  // —— 跨局累计成就（看历史档案 M）——
  { id: "five_paths", name: "五道轮回", emoji: "🔄", desc: "在不同的人生里走遍 打工/创业/体制/躺平/家庭 五条路线。", check: (L, M) => Object.keys(M.paths || {}).length >= 5 },
  { id: "veteran", name: "轮回老手", emoji: "♻️", desc: "累计投胎 10 次以上。", check: (L, M) => (M.lives || 0) >= 10 },
  { id: "collector", name: "阅尽千帆", emoji: "📖", desc: "图鉴中收集到 8 种以上死法/结局。", check: (L, M) => (Object.keys(M.deaths || {}).length + Object.keys(M.endings || {}).length) >= 8 }
];

// 引擎在死亡结算时调用：写入档案，返回本局【新解锁】的成就数组
function recordLife(L) {
  const M = loadMeta();
  M.lives = (M.lives || 0) + 1;
  M.bestNW = Math.max(M.bestNW || 0, L.netWorth || 0);
  M.totalAge = (M.totalAge || 0) + (L.age || 0);
  if (L.deathCause) M.deaths[L.deathCause] = true;
  if (L.endingTitle) M.endings[L.endingTitle] = true;
  if (L.titleName) M.titles[L.titleName] = true;
  if (L.path) M.paths[L.path] = true;
  if (L.goalDone && L.goal) M.goalsDone[L.goal] = (M.goalsDone[L.goal] || 0) + 1;
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (M.achievements[a.id]) continue;
    let ok = false; try { ok = a.check(L, M); } catch (e) { ok = false; }
    if (ok) { M.achievements[a.id] = true; fresh.push(a); }
  }
  M.legacy = computeLegacy(L);   // 传承：这一生留给下一世的遗产
  saveMeta(M);
  return fresh;
}
function achById(id) { return ACHIEVEMENTS.find(a => a.id === id); }

/* =====================================================================
 * 传承 / Roguelite 元层（v1.0）：上一世怎么活、怎么死，决定下一世继承到什么。
 *  computeLegacy(L)：死亡结算时算出「遗产」存档（只留最近一世，避免滚雪球）。
 *  applyLegacy(st) ：开局把遗产注入新人生 —— 一笔（封顶的）家底 + 一个血脉特质。
 * 设计：现金继承封顶且只取一小成，特质只给 +2 单维/心情等轻微起手，
 *       让「家族三代」成为跨局追逐的方向，而非把后代直接喂成富二代。
 * ===================================================================== */
function computeLegacy(L) {
  L = L || {};
  var trait = "common", note = "祖上是寻常人家，没给你留下什么，也没给你拖什么后腿。";
  if (L.jailed || (L.netWorth || 0) < 0) { trait = "fallen"; note = "祖辈栽过大跟头、家道中落。你打小听着那些教训长大，比谁都懂世态炎凉。"; }
  else if (L.ipo || L.path === "自己干") { trait = "founder"; note = "祖上是闯出来、自己当过老板的。你骨子里，天生有股不安分。"; }
  else if ((L.civilRank || 0) >= 5) { trait = "official"; note = "书香门第、官宦人家。耳濡目染间，你比同龄人更懂人情世故与分寸。"; }
  else if (L.married && L.hasKid && (L.age || 0) >= 70) { trait = "warm"; note = "祖上是和睦顾家的人家。这份温度，成了你心底最稳的底气。"; }
  else if ((L.netWorth || 0) >= 20000000) { trait = "rich"; note = "祖上阔过，留下的不只是钱，还有那份见过世面的从容。"; }
  // 现金继承：只取净资产一小成，且封顶（防止跨局滚雪球）
  var cash = Math.max(0, Math.min(200000, Math.round((L.netWorth || 0) * 0.06)));
  var children = (L.children || []).filter(function (c) { return c && (c.age == null || c.age >= 18); }).map(function (c, i) {
    return {
      id: c.id || ("child_" + i),
      name: c.name || ("孩子" + (i + 1)),
      gender: c.gender || (i % 2 ? "女" : "男"),
      age: c.age == null ? 18 : c.age,
      birthYear: c.birthYear || ((L.birthYear || 1980) + 28 + i * 3),
      relation: c.relation || "子女",
      adopted: !!c.adopted,
      trait: c.trait || null,
      education: c.education || 0,
      bond: c.bond == null ? 50 : c.bond,
      note: c.note || ""
    };
  });
  // —— 社会位置继承（升级·三期）：上一代的特权/污点/伤痕，会变成下一代出生时的处境 ——
  var prof = L.profile || {};
  var keep = function (arr, white) { return (arr || []).filter(function (x) { return white.indexOf(x) >= 0; }); };
  var profileLegacy = {
    privilege: keep(prof.privilege, ["family_business", "overseas_status", "house_local"]),
    stigma: keep(prof.stigma, ["family_debt", "bad_credit", "gray_suspect", "lawsuit"]),
    scars: keep(prof.scars, ["bankrupt", "scam_survivor", "divorced"]),
    inheritedReputation: Math.max(-30, Math.min(40, Math.round((L.reputation || 0) * 0.3)))
  };
  // —— 家族创伤继承：上一代未了的高位心结(threads) → 下一代背在身上的家族阴影 ——
  var WOUND_WHITE = { marriage_crack: "父母婚姻的裂痕", family_debt: "家族债务的阴影", identity_crisis: "漂泊无根的身世", founder_guilt: "上一代的良心债", uncle_rift: "亲戚反目的旧怨", feud: "上一代结下的仇", public_scandal: "家族曾经的丑闻" };
  var familyWounds = [];
  if (L.threads) { for (var tk in L.threads) { var th = L.threads[tk]; var base = tk.replace(/_[a-z0-9]+$/, ""); var label = WOUND_WHITE[tk] || WOUND_WHITE[base]; if (th && (th.level || 0) >= 50 && th.status !== "closed" && label) familyWounds.push({ id: tk, label: label, level: Math.round((th.level || 0) * 0.5) }); } }
  familyWounds = familyWounds.slice(0, 3);
  // —— 世界影响继承：前代改过的行业，下一代世界初始就带着（减半、衰减后的余波）——
  var worldImpacts = (L.worldImpacts || []).slice(0, 4).map(function (im) {
    return { industry: im.industry, field: im.field, fields: im.fields, delta: Math.round((im.delta || 0) * 0.5), note: (im.note || "前代的影响") + "·余波", duration: 104 };
  });
  return { trait: trait, note: note, cash: cash, fromTitle: L.titleName || null, fromAge: L.age || 0, fromName: L.name || null, fromBirthYear: L.birthYear || 0, birthplace: L.birthplace || null, children: children,
    profileLegacy: profileLegacy, worldImpacts: worldImpacts, companyLegacy: L.companyLegacy || null, familyWounds: familyWounds };
}
// 开局注入遗产（引擎 newState 调用一次）。helper 用全局 add/flag（本模块作用域可见）。
function applyLegacy(st) {
  var M = loadMeta(); var lg = M && M.legacy; if (!lg) return null;
  if (lg.cash) add(st, "cash", lg.cash);
  flag(st, "has_legacy"); flag(st, "legacy_" + lg.trait);
  if (lg.trait === "founder") { add(st, "strategy", 2); }
  else if (lg.trait === "official") { add(st, "knowledge", 2); }
  else if (lg.trait === "warm") { add(st, "mood", 8); add(st, "network", 4); }
  else if (lg.trait === "rich") { add(st, "insight", 2); }
  else if (lg.trait === "fallen") { add(st, "mind", 2); }
  // —— 社会位置继承落地（三期）——
  if (lg.profileLegacy && typeof ensureProfile === "function") {
    ensureProfile(st);
    (lg.profileLegacy.privilege || []).forEach(function (p) { if (typeof addPrivilege === "function") addPrivilege(st, p); });
    (lg.profileLegacy.stigma || []).forEach(function (p) { if (typeof addStigma === "function") addStigma(st, p); });
    (lg.profileLegacy.scars || []).forEach(function (p) { if (typeof addScar === "function") addScar(st, p); });
    if (lg.profileLegacy.inheritedReputation) add(st, "reputation", lg.profileLegacy.inheritedReputation);
  }
  if (lg.worldImpacts && lg.worldImpacts.length && typeof addWorldImpact === "function") {
    lg.worldImpacts.forEach(function (im) { try { addWorldImpact(st, im); } catch (e) {} });
  }
  if (lg.familyWounds && lg.familyWounds.length) {
    st._familyWounds = lg.familyWounds;
    if (typeof bumpThread === "function") lg.familyWounds.forEach(function (w) { bumpThread(st, "inherited_" + w.id, w.level, { status: "open", inherited: true }); });
    if (typeof addMemory === "function") addMemory(st, { id: "family_wound", intensity: 55, text: "你打小就活在" + lg.familyWounds.map(function (w) { return w.label; }).join("、") + "的阴影里。", tags: ["legacy", "wound"] });
    flag(st, "has_family_wound");
  }
  if (lg.companyLegacy) {
    st._companyLegacy = lg.companyLegacy;
    if (lg.companyLegacy.status === "listed") { flag(st, "legacy_company_listed"); add(st, "reputation", 6); }
    else if (lg.companyLegacy.status === "failed") { flag(st, "legacy_company_failed"); }
  }
  st._legacy = lg;
  return lg;
}

/* =====================================================================
 * 解锁型元进度（v0.9.6）：集齐成就/死法/轮回数 → 解锁新出身/职业/目标/事件线，
 * 让"重复投胎"真正喂出新内容。解锁状态由历史档案 M 实时推导（无需额外存储）。
 * ===================================================================== */
var UNLOCKS = [
  { id: "goal_tycoon", kind: "目标", name: "💹 金融大鳄", desc: "专攻股市、以钱生钱的人生目标",
    reqText: "达成过『财务自由』，或累计轮回≥5世", req: (M) => (M.achievements && M.achievements.freedom) || (M.lives || 0) >= 5 },
  { id: "goal_globe", kind: "目标", name: "🌏 环游世界", desc: "走遍天涯、看尽人间的人生目标",
    reqText: "解锁过『见过世面』成就（出过国）", req: (M) => M.achievements && M.achievements.abroad },
  { id: "job_streamer", kind: "职业", name: "🎥 网红主播", desc: "求职时多出的一条新职业线",
    reqText: "图鉴累计收集≥8种死法/结局", req: (M) => (Object.keys(M.deaths || {}).length + Object.keys(M.endings || {}).length) >= 8 },
  { id: "cohort_silver", kind: "出身", name: "🥄 含着金汤匙", desc: "开局家底丰厚的稀有出身",
    reqText: "累计轮回≥8世", req: (M) => (M.lives || 0) >= 8 },
  { id: "cohort_hard", kind: "出身", name: "🧱 苦命人", desc: "一无所有起步、为硬核玩家准备的出身",
    reqText: "图鉴集齐≥8种死法", req: (M) => Object.keys(M.deaths || {}).length >= 8 },
  { id: "line_xuan", kind: "事件线", name: "🔮 玄学奇遇", desc: "解锁一条荒诞玄学事件线",
    reqText: "达成过任意一次『人生目标』", req: (M) => M.achievements && M.achievements.goal_done }
];
function metaUnlocked(M) { M = M || loadMeta(); var o = {}; for (var i = 0; i < UNLOCKS.length; i++) { try { if (UNLOCKS[i].req(M)) o[UNLOCKS[i].id] = true; } catch (e) { } } return o; }
function unlockById(id) { return UNLOCKS.find(function (u) { return u.id === id; }); }
