"use strict";
/* =====================================================================
 * content/opportunity.js —— 创业机会生成器（大框架改造·批次8，doc §8）
 * 首次创业的赛道不再凭空选，而是从【玩家经历】里长出来：专业、学历、工作经历、
 * 城市、家庭、爱好、关系网、新闻、痛苦经历、特殊事件链结果 → 机会卡。
 * 每张卡显示：来源、启动成本、风险、潜力、叙事钩子。没有相关经历的赛道不显示。
 *
 * 暴露：generateOpportunities(s) → [card]；oppCardFor(s, trackName)
 *   card = { id, trackName, trackId, emoji, source, initialCost, risk, potential, hook }
 * ===================================================================== */

function _has8(s, f) { return (typeof has === "function") ? has(s, f) : !!(s.flags && s.flags[f]); }
function _trk(name) { return (typeof trackByName === "function") ? trackByName(name) : (typeof trackById === "function" ? trackById(name) : null); }
function _trkById(id) { return (typeof trackById === "function") ? trackById(id) : null; }
function _memTag(s, tag) { return (typeof recallMemories === "function") ? recallMemories(s, { tag }).length > 0 : false; }
function _known(s, id) { return (typeof personKnown === "function") ? personKnown(s, id) : false; }
function _prep(s, k) { return (s.founderPrep && s.founderPrep[k]) || 0; }

// 来源规则：test 通过则产出一张指向某 track 的机会卡（doc §8.2）
const OPP_SOURCES = [
  { id: "bigtech",   trackId: "ai",        test: s => _has8(s, "bigtech") || s.major === "cs" || _prep(s, "productSense") >= 40,
    source: "大厂产品/技术经历", risk: "高", hook: "你在大厂被当螺丝钉榨干，却看清了门道——想造一台属于自己的机器：AI 工具、效率软件、企业服务。" },
  { id: "saas_corp", trackId: "saas",      test: s => s.major === "biz" || _has8(s, "bigtech") || _prep(s, "industryInsight") >= 45 || _memTag(s, "backlash"),
    source: "职场踩坑/行业认知", risk: "中", hook: "那些背过的锅、踩过的坑、骂过的烂流程，正是企业服务 SaaS 要解决的真问题。" },
  { id: "supply",    trackId: "ecom",      test: s => s.major === "mech" || _known(s, "chess_fallen") || (s.city && s.city.tags && s.city.tags.indexOf("manufacturing") >= 0),
    source: "制造/供应链门路", hook: "你摸过供应链的脉络——制造业 SaaS、跨境小商品、库存管理，都是你能看懂的生意。", risk: "中" },
  { id: "rent_pain", trackId: "saas",      test: s => _has8(s, "moved_near_office") || _memTag(s, "commute") || _memTag(s, "housing"),
    source: "被通勤/租房折磨", hook: "被房租和通勤坑过的人最懂痛点：租房服务、合同风控、租客信用工具——你想做个不坑人的。" },
  { id: "exec_old",  trackId: "realty",    test: s => _known(s, "chess_exec"),
    source: "棋友·退休老总的人脉", hook: "棋摊上那位退休老总，给你引了条路：老工业数字化、传统企业转型——有人带,有背书。", risk: "中" },
  { id: "health",    trackId: "silver",    test: s => _memTag(s, "health_scar") || _has8(s, "chronic") || s.major === "med",
    source: "医院/健康的切肤之痛", hook: "排队三小时、问诊三分钟的荒诞你淌过：陪诊、慢病管理、医疗账单工具、银发照护——你比谁都懂患者要什么。" },
  { id: "antifraud", trackId: "saas",      test: s => _has8(s, "fraud_survivor") || _has8(s, "opp_antifraud") || _memTag(s, "anti_scam"),
    source: "被电诈的血泪", hook: "被收割过，才知道普通人多无助：反诈工具、法律咨询、资金安全——这门正经事，你想做。" },
  { id: "abroad",    trackId: "ecom",      test: s => _has8(s, "haigui_back") || _has8(s, "abroad_done"),
    source: "留学/海外视野", hook: "海归的视野是别人没有的牌：海外本地化、留学服务、跨境招聘、跨境电商。" },
  { id: "food_local",trackId: "catering",  test: s => s.major === "art" || s.major === "edu" || (s.network || 0) >= 30,
    source: "人缘/烟火气", hook: "你会做人、有人缘——餐饮小店、本地生活，门槛不高，靠的是把人情做成生意。" },
  { id: "wind_now",  trackId: null,        test: s => (typeof windInsight === "function" ? windInsight(s) > 0 : false) || _prep(s, "industryInsight") >= 55,
    source: "你嗅到的风口", hook: "你从新闻和行业里嗅到了风向——错过这一波，可能就没有下一波。" }
];

// 成本/潜力：按赛道类型 × 物价估算（每卡明确显示成本，doc §8.4）
function _oppCost(s, t) {
  const P = (s.world && s.world.priceIndex) || 1;
  const base = !t ? 200000 : t.id === "catering" ? 80000 : t.id === "ecom" ? 120000 : t.id === "saas" ? 150000 :
    t.id === "silver" ? 180000 : t.id === "realty" ? 400000 : (t.kind === "wind") ? 500000 : (t.kind === "bubble") ? 300000 : 200000;
  return Math.round(base * P);
}
function _oppRisk(s, t, fallback) {
  if (!t) return fallback || "中高";
  if (t.kind === "bubble") return "极高（泡沫）";
  if (t.id === s.eraWind || (t.name && t.name === s.eraWind)) return "高（风口·押中爆发）";
  if (t.kind === "evergreen" || t.kind === "niche") return "中";
  return fallback || "中高";
}
function _oppPotential(s, t) {
  if (!t) return "看运气";
  if (t.kind === "wind") return "★★★★（押中风口可爆发）";
  if (t.kind === "bubble") return "★★★（热得快，崩得也快）";
  if (t.kind === "niche") return "★★★（稳，慢热）";
  return "★★（细水长流）";
}

// 生成机会卡：通过经历测试的来源 → 卡片；去重同赛道；至少给个风口兜底
function generateOpportunities(s) {
  const cards = []; const seen = {};
  for (const src of OPP_SOURCES) {
    let pass = false; try { pass = src.test(s); } catch (e) { pass = false; }
    if (!pass) continue;
    let t = src.trackId ? _trkById(src.trackId) : (s.eraWind ? _trk(s.eraWind) : null);
    if (!t && src.id === "wind_now") t = (typeof STARTUP_TRACKS !== "undefined") ? STARTUP_TRACKS.find(x => x.kind === "wind") : null;
    if (!t) continue;
    if (seen[t.name]) continue; seen[t.name] = 1;
    cards.push({ id: "opp_" + src.id, trackName: t.name, trackId: t.id, emoji: t.emoji || "🚀",
      source: src.source, risk: _oppRisk(s, t, src.risk), potential: _oppPotential(s, t), initialCost: _oppCost(s, t), hook: src.hook });
  }
  // 兜底：经历太少时，至少给当年风口 + 一个常青小生意，避免无路可走
  if (cards.length < 2 && typeof STARTUP_TRACKS !== "undefined") {
    const wind = s.eraWind ? _trk(s.eraWind) : STARTUP_TRACKS.find(x => x.kind === "wind");
    const ever = STARTUP_TRACKS.find(x => x.id === "catering");
    [wind, ever].forEach(t => { if (t && !seen[t.name]) { seen[t.name] = 1; cards.push({ id: "opp_fallback_" + t.id, trackName: t.name, trackId: t.id, emoji: t.emoji || "🚀", source: "没什么特别的积累，只能从最朴素的机会做起", risk: _oppRisk(s, t), potential: _oppPotential(s, t), initialCost: _oppCost(s, t), hook: "你没有耀眼的履历或人脉，但谁规定草根就不能创业？从一门看得见摸得着的小生意做起。" }); } });
  }
  return cards;
}
function oppCardFor(s, trackName) {
  const cards = (s._oppMap && s._oppMap[trackName]) ? s._oppMap[trackName] : null;
  return cards;
}

/* —— 创业契机期：每周检查是否长出机会卡，主动展示给玩家（doc §10.2）。展示≠立项，
 * 只是把「你的经历正在变成机会」摆到台面上，立项仍走离职决断 / startupNode。 —— */
if (typeof EVENTS !== "undefined") EVENTS.push({
  id: "ev_opp_preview", module: "venture", ambient: true, importance: "turning",
  cond: s => (typeof mainStageId === "function" && mainStageId(s) === "opportunity_build") && !s.startup && !has(s, "ever_founded") &&
    (typeof generateOpportunities === "function") && generateOpportunities(s).filter(c => c.id.indexOf("opp_fallback") !== 0).length >= 1 &&
    (s.week - (s._oppPrevWk || -99)) >= 14 && rnd(0.4),
  title: "💡 你的经历，正在长出机会",
  text: s => {
    const cards = generateOpportunities(s).filter(c => c.id.indexOf("opp_fallback") !== 0).slice(0, 3);
    s._oppPrevWk = s.week;
    const lines = cards.map(c => `· ${c.emoji}「${c.trackName}」\n　来源：${c.source}｜启动约 ¥${c.initialCost.toLocaleString()}｜风险：${c.risk}\n　${c.hook}`).join("\n\n");
    const gap = (typeof founderGap === "function") ? founderGap(s) : "";
    return `这些年踩过的坑、攒下的人脉和本事，正在你眼前拧成几条具体的路：\n\n${lines}\n\n${gap ? `你离出手只差补上「${gap}」这块短板。` : "你已经准备得差不多了。"}真正下决心离职创业那天，这些机会就是你的牌。`;
  },
  choices: [
    { label: "记下这些机会，继续攒底牌", effect: s => { if (typeof recordBeat === "function") recordBeat(s, "first_opportunity"); flag(s, "saw_opportunities"); add(s, "insight", 1); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2); return "你把这几条路认真记进了心里，也更清楚自己还缺什么。机会已经在那儿了——剩下的，是攒够离开的勇气和本钱。"; } },
    { label: "现在还不是时候", effect: s => { add(s, "strategy", 1); return "你看了看这些机会，又看了看银行卡余额和家里的责任，把念头先压了下去。时机这东西，急不得。"; } }
  ]
});

if (typeof window !== "undefined") window.OPP_SOURCES = OPP_SOURCES;
