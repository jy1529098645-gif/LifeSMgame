"use strict";
/* =====================================================================
 * content/world-model.js —— 行业周期层（叙事动态世界升级·第一阶段）
 * 在 dynamic.js 的 priceIndex/jobMarket/windHeat/momentum/pace 之上，新增
 * 「行业状态」这一长期变量层：8 个行业各有 heat/funding/margin/regulation/
 * talentCost/scamDensity/supplyRisk，随季度 + 时代风口 + 玩家影响力浮动。
 *
 *   触发链： WorldState/eraWind/influence → tickWorldQuarter → tickIndustries
 *            → 行业数值改变 → 求职/创业/事件读取 industryState()
 *
 * 不推倒 dynamic.js：本文件只【扩展】s.world，新增 s.world.industries / quarter /
 * appliedSignals。引擎每周调用 tickNarrativeSystems(s)（runtime-state.js）时，
 * 内部按 13 周节奏调用 tickWorldQuarter(s)。file:// 可直接运行，无构建。
 * ===================================================================== */

/* —— 8 个行业的基线画像（0-100；scamDensity=骗局密度，supplyRisk=供应链风险） —— */
const INDUSTRIES = {
  ai:            { name: "AI",        heat: 50, funding: 45, margin: 35, regulation: 25, talentCost: 65, scamDensity: 45, supplyRisk: 20 },
  cross_border:  { name: "跨境电商",  heat: 45, funding: 35, margin: 38, regulation: 35, talentCost: 42, scamDensity: 35, supplyRisk: 45 },
  anti_fraud:    { name: "反诈/安全", heat: 35, funding: 30, margin: 32, regulation: 55, talentCost: 50, scamDensity: 20, supplyRisk: 15 },
  education:     { name: "教育培训",  heat: 30, funding: 20, margin: 28, regulation: 70, talentCost: 40, scamDensity: 30, supplyRisk: 10 },
  food:          { name: "餐饮",      heat: 38, funding: 20, margin: 25, regulation: 35, talentCost: 35, scamDensity: 25, supplyRisk: 30 },
  silver:        { name: "养老服务",  heat: 45, funding: 35, margin: 30, regulation: 45, talentCost: 40, scamDensity: 35, supplyRisk: 15 },
  manufacturing: { name: "制造业",    heat: 40, funding: 30, margin: 32, regulation: 30, talentCost: 45, scamDensity: 20, supplyRisk: 50 },
  content:       { name: "短视频/内容", heat: 50, funding: 35, margin: 40, regulation: 45, talentCost: 40, scamDensity: 55, supplyRisk: 10 }
};
const INDUSTRY_FIELDS = ["heat", "funding", "margin", "regulation", "talentCost", "scamDensity", "supplyRisk"];

/* —— 时代风口 → 行业映射：让既有 windTimeline 自然驱动行业热度 —— */
const WIND_INDUSTRY = {
  "电商": "cross_border", "移动互联网": "ai", "短视频直播": "content",
  "新能源": "manufacturing", "AI大模型": "ai", "具身智能": "manufacturing",
  "聚变能源": "manufacturing", "银发经济": "silver", "脑机接口": "ai",
  "太空经济": "manufacturing"
};

/* —— 世界信号：可由新闻/事件投放，持续 N 周内每季度对行业施加增量 —— */
const WORLD_SIGNALS = [
  { id: "ai_boom",          title: "AI 投融资继续升温",   tags: ["tech", "ai", "capital"], duration: 16,
    effects: { ai: { heat: 12, funding: 10, talentCost: 8, scamDensity: 8 } } },
  { id: "shipping_crisis",  title: "国际航运紧张",         tags: ["global", "supply"], duration: 12,
    effects: { cross_border: { supplyRisk: 14, margin: -6 }, manufacturing: { supplyRisk: 12 } } },
  { id: "fraud_surge",      title: "电诈高发",             tags: ["fraud", "society"], duration: 14,
    effects: { anti_fraud: { heat: 10, funding: 8, regulation: 6 }, content: { scamDensity: 8 } } },
  { id: "edu_crackdown",    title: "教培监管收紧",         tags: ["policy", "education"], duration: 20,
    effects: { education: { regulation: 16, heat: -12, funding: -10 } } },
  { id: "consume_downgrade", title: "消费降级",            tags: ["macro", "consume"], duration: 16,
    effects: { food: { margin: -6, heat: 6 }, silver: { heat: 4 }, content: { margin: -4 } } },
  { id: "silver_wave",      title: "老龄化加深",           tags: ["macro", "silver"], duration: 24,
    effects: { silver: { heat: 10, funding: 8, margin: 5 } } },
  { id: "platform_margin",  title: "跨境平台提高保证金",   tags: ["policy", "cross_border"], duration: 14,
    effects: { cross_border: { margin: -10, regulation: 8 } } }
];
function worldSignalById(id) { return WORLD_SIGNALS.find(x => x.id === id); }

/* —— 初始化与读写 —— */
function cloneIndustries() {
  const out = {};
  for (const id in INDUSTRIES) out[id] = Object.assign({}, INDUSTRIES[id]);
  return out;
}
function initIndustryState(s) {
  if (!s.world) return;
  if (!s.world.industries) s.world.industries = cloneIndustries();
  if (s.world.quarter == null) s.world.quarter = Math.floor((s.week || 0) / 13);
  if (!s.world.appliedSignals) s.world.appliedSignals = {};   // id -> 到期周
  if (!s.world.impacts) s.world.impacts = [];                 // 玩家写回世界的影响
}
function industryState(s, id) {
  if (!s.world || !s.world.industries) return null;
  return s.world.industries[id] || null;
}
function clampInd(v) { return Math.max(0, Math.min(100, v)); }
function bumpIndustry(s, id, field, delta) {
  const ind = industryState(s, id); if (!ind || ind[field] == null) return;
  ind[field] = clampInd(ind[field] + delta);
}

/* —— 应用一条世界信号（去重 + 持续时间）—— */
function applyWorldSignal(s, sig) {
  if (!s.world) return;
  initIndustryState(s);
  if (typeof sig === "string") sig = worldSignalById(sig);
  if (!sig) return;
  // 已在持续期内则只续期，不重复叠满
  s.world.appliedSignals[sig.id] = (s.week || 0) + (sig.duration || 12);
  s.world._signalQueue = s.world._signalQueue || {};
  s.world._signalQueue[sig.id] = sig;
}

/* —— 季度推进：行业向基线缓慢回归 + 风口拉动 + 活跃信号 + 玩家影响 —— */
function tickIndustries(s) {
  if (!s.world || !s.world.industries) return;
  const inds = s.world.industries;
  for (const id in inds) {
    const ind = inds[id], base = INDUSTRIES[id];
    for (const f of INDUSTRY_FIELDS) {
      // 缓慢均值回归（每季度 ~12% 拉回基线）+ 轻微随机
      ind[f] = clampInd(ind[f] + (base[f] - ind[f]) * 0.12 + (Math.random() * 4 - 2));
    }
  }
  // 时代风口拉动对应行业的热度/融资（呼应 dynamic.js 的 windHeat）
  const wid = WIND_INDUSTRY[s.eraWind];
  if (wid && inds[wid]) {
    const hot = (s.world.windHeat || 40) / 100;
    bumpIndustry(s, wid, "heat", 6 * hot);
    bumpIndustry(s, wid, "funding", 4 * hot);
    bumpIndustry(s, wid, "talentCost", 3 * hot);
  }
  // 泡沫破裂：dynamic.js 标记的 crash 板块，对应行业热度/融资骤降
  if (s.world.crash) {
    const cid = WIND_INDUSTRY[s.world.crash.sector];
    if (cid) { bumpIndustry(s, cid, "heat", -16); bumpIndustry(s, cid, "funding", -12); }
  }
}

/* —— 活跃信号按季度施加效果，过期自动清除 —— */
function applyActiveSignals(s) {
  if (!s.world || !s.world.appliedSignals) return;
  const now = s.week || 0;
  const q = s.world._signalQueue || {};
  for (const id in s.world.appliedSignals) {
    if (s.world.appliedSignals[id] <= now) { delete s.world.appliedSignals[id]; continue; }
    const sig = q[id] || worldSignalById(id); if (!sig) continue;
    for (const indId in (sig.effects || {})) {
      const eff = sig.effects[indId];
      for (const f in eff) bumpIndustry(s, indId, f, eff[f]);
    }
  }
}

/* —— 季度时钟：每 13 周推进一次（由 tickNarrativeSystems 调用）—— */
function tickWorldQuarter(s) {
  if (!s.world) return;
  initIndustryState(s);
  const q = Math.floor((s.week || 0) / 13);
  if (s.world.quarter === q) return false;
  s.world.quarter = q;
  // 概率性投放与当前时代相关的世界信号（让世界自己冒出趋势）
  maybeSeedSignal(s);
  tickIndustries(s);
  applyActiveSignals(s);
  return true;
}
// 依据时代/风口，季度概率性地点燃一条对应信号
function maybeSeedSignal(s) {
  const wid = WIND_INDUSTRY[s.eraWind];
  if (wid === "ai" && Math.random() < 0.5) applyWorldSignal(s, "ai_boom");
  if (s.world.crash && Math.random() < 0.6) applyWorldSignal(s, "consume_downgrade");
  if (Math.random() < 0.18) applyWorldSignal(s, "fraud_surge");
  if ((s.year || 0) >= 2040 && Math.random() < 0.4) applyWorldSignal(s, "silver_wave");
}

/* —— 行业读数：给求职/创业/事件做胜率/收益修正（-0.25 .. +0.35） —— */
function industryEdge(s, id) {
  const ind = industryState(s, id); if (!ind) return 0;
  // 热 + 融资好 → 机会多；监管重 + 供应风险 → 阻力大
  const v = (ind.heat - 40) * 0.004 + (ind.funding - 35) * 0.003
    - (ind.regulation - 40) * 0.0025 - (ind.supplyRisk - 30) * 0.0015;
  return Math.max(-0.25, Math.min(0.35, v));
}

/* —— 新闻 → 世界信号：让「读新闻」能预判行业冷热（设计 3.5.6）——
 * 每周刷新新闻时扫描标题/正文，命中关键词就点燃对应 WORLD_SIGNAL（applyWorldSignal 自带去重/续期），
 * 同时把"已知信号"记进 s.knownSignals（confidence 随多次读到而升高），供事件/界面提示。*/
const NEWS_SIGNAL_RULES = [
  { id: "shipping_crisis", re: /航运|海运|港口|供应链|运费|集装箱|货柜|断供/ },
  { id: "fraud_surge", re: /电诈|诈骗|反诈|杀猪盘|换脸|被骗|缅北|资金盘/ },
  { id: "edu_crackdown", re: /教培|双减|补习|培训机构|学科类/ },
  { id: "consume_downgrade", re: /消费降级|降级|平价|临期|捂紧钱包|预制菜/ },
  { id: "silver_wave", re: /老龄|养老|银发|退休|适老/ },
  { id: "platform_margin", re: /跨境|保证金|抽成|关税|平台.*(罚|监管)/ }
];
function _seenSignal(s, id) {
  s.knownSignals = s.knownSignals || {};
  const k = s.knownSignals[id];
  s.knownSignals[id] = { seenWeek: (k && k.seenWeek) || (s.week || 0), confidence: Math.min(100, ((k && k.confidence) || 25) + 18) };
}
function applyNewsSignals(s) {
  if (!s.world || !s.news) return;
  initIndustryState(s);
  for (const n of s.news) {
    const txt = (n.headline || "") + (n.body || "");
    if (n.signal && WIND_INDUSTRY[n.wind] === "ai") { _seenSignal(s, "ai_boom"); applyWorldSignal(s, "ai_boom"); }
    for (const r of NEWS_SIGNAL_RULES) { if (r.re.test(txt)) { _seenSignal(s, r.id); applyWorldSignal(s, r.id); } }
  }
}
function knownSignal(s, id) { return (s.knownSignals && s.knownSignals[id]) || null; }
const SIGNAL_LABEL_WM = { ai_boom: "AI风口正热", shipping_crisis: "航运/供应链紧张", fraud_surge: "电诈高发", edu_crackdown: "教培监管收紧", consume_downgrade: "消费降级", silver_wave: "老龄化加深", platform_margin: "跨境平台收紧" };
// 风口洞察：玩家若已（高置信地）从新闻里读出当前风口对应行业的信号，
// 押对赛道时给真实胜率/收益加成（0..0.18）——让「读新闻」有机械回报，不只是提示。
function windInsight(s) {
  if (!s.knownSignals || !s.eraWind) return 0;
  const wid = WIND_INDUSTRY[s.eraWind]; if (!wid) return 0;
  let best = 0;
  for (const id in s.knownSignals) {
    const conf = s.knownSignals[id].confidence || 0; if (conf < 50) continue;
    const sig = worldSignalById(id);
    if (sig && sig.effects && sig.effects[wid]) best = Math.max(best, Math.min(0.18, conf / 100 * 0.18));
  }
  return best;
}
// 玩家已嗅到的趋势（confidence≥50）一句话——给选赛道/投资做参考
function knownTrendsText(s) {
  if (!s.knownSignals) return "";
  const hot = Object.keys(s.knownSignals).filter(id => (s.knownSignals[id].confidence || 0) >= 50 && SIGNAL_LABEL_WM[id]).map(id => SIGNAL_LABEL_WM[id]);
  return hot.length ? hot.slice(0, 4).join("、") : "";
}

/* —— 一句话行业摘要（章节/仪表盘用）：挑出当前最热与最受压的行业 —— */
function summarizeIndustry(s) {
  if (!s.world || !s.world.industries) return "";
  const inds = s.world.industries;
  let hot = null, cold = null;
  for (const id in inds) {
    if (!hot || inds[id].heat > inds[hot].heat) hot = id;
    if (!cold || inds[id].regulation > inds[cold].regulation) cold = id;
  }
  if (!hot) return "";
  return `「${inds[hot].name}」正当风口，「${inds[cold].name}」却被监管摁着。`;
}
