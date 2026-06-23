"use strict";
/* =====================================================================
 * content/founder-core.js —— 创业核心状态层（回归创业·批次A）
 * 把游戏重新收束成「创业人生」：人生的一切（职场/留学/婚恋/人脉/世界）都为创业
 *   ① 前史(为什么会创业) ② 资源(钱/洞察/产品/渠道/伙伴/心气) ③ 代价(道德债/健康/家庭)
 *   ④ 变量(行业/政策/风口) 服务。本文件提供「创业准备度」状态与读数，供 UI 与调度使用。
 *
 *   s.founderPrep = { industryInsight, productSense, salesChannel, teamTrust, riskTolerance, moralDebt }
 *   ensureFounderState / addFounderPrep / founderReadiness / readinessVerdict /
 *   startupTriggerReason / entrepreneurialRoleOf / founderPrepFromScene
 * ===================================================================== */

const FOUNDER_AXES = ["industryInsight", "productSense", "salesChannel", "teamTrust", "riskTolerance", "moralDebt"];
const FOUNDER_AXIS_NAME = { industryInsight: "行业洞察", productSense: "产品能力", salesChannel: "客户/渠道", teamTrust: "合伙人脉", riskTolerance: "风险心气", moralDebt: "道德债" };

function ensureFounderState(s) {
  if (!s.founderPrep) s.founderPrep = {};
  for (const k of FOUNDER_AXES) if (s.founderPrep[k] == null) s.founderPrep[k] = 0;
  return s.founderPrep;
}
function addFounderPrep(s, key, n) {
  const p = ensureFounderState(s);
  if (p[key] == null) p[key] = 0;
  p[key] = Math.max(0, Math.min(100, p[key] + n));
  return p[key];
}

// 创业准备度 0-100：资源轴 + 现金 + 谋略见识 + 创业经历 − 道德债
function founderReadiness(s) {
  const p = ensureFounderState(s);
  const pi = (s.world && s.world.priceIndex) || 1;
  const cashAxis = Math.max(0, Math.min(100, (s.cash || 0) / (150000 * pi) * 100));   // ~15万购买力≈满
  const stat = s.stats || {};
  const ability = (((stat.strategy || 0) + (stat.insight || 0)) / 2);
  const core = (p.industryInsight * 0.95 + p.productSense * 0.95 + p.salesChannel * 0.85 + p.teamTrust * 0.75 + p.riskTolerance * 0.7) / 4.2;
  let r = core * 0.52 + cashAxis * 0.2 + ability * 0.18 + (has(s, "startup_exp") ? 8 : 0);
  r -= (p.moralDebt || 0) * 0.04;
  return Math.max(0, Math.min(100, Math.round(r)));
}
// 最短板：创业前最缺的那一块
function founderGap(s) {
  const p = ensureFounderState(s);
  const axes = [["salesChannel", p.salesChannel], ["industryInsight", p.industryInsight], ["productSense", p.productSense], ["teamTrust", p.teamTrust], ["riskTolerance", p.riskTolerance]];
  axes.sort((a, b) => a[1] - b[1]);
  return FOUNDER_AXIS_NAME[axes[0][0]];
}
// 一句话判断：你离创业有多近
function readinessVerdict(s) {
  if ((s.startup && s.startup.fulltime) || has(s, "startup_done")) return "";
  const r = founderReadiness(s);
  if (r < 18) return "你还只是有个模糊的念头。";
  if (r < 38) return "你开始看见一个行业的缝隙——但你缺「" + founderGap(s) + "」。";
  if (r < 58) return "想法不缺，你缺的是「" + founderGap(s) + "」。";
  if (r < 78) return "你已经被推到了创业的门口，只差一个契机。";
  return "你完全准备好了——再不出手，这身本事就要在打工里耗干。";
}

// 你为什么会创业：从处境里挑出最有戏的「触发理由」（前史）
function startupTriggerReason(s) {
  if (has(s, "been_laid_off")) return "被裁那天你想通了：与其等下一个老板挑你，不如自己当老板。";
  if (has(s, "starving") || (has(s, "has_loan") && (s.cash || 0) < 0)) return "债压在头上——这时候创业不是追梦，是唯一的活路。";
  if (threadLevelSafe(s, "family_debt") >= 40) return "家里那笔债迟早要还，打工那点工资填不平，你只能赌一把大的。";
  if (has(s, "cofounder_pact") || (s.cast && Object.keys(s.cast).some(k => s.cast[k].crisis === "startup_invite"))) return "一个信得过的人拉着你：「跟我干，成了咱们都翻身。」";
  if (has(s, "haigui_back")) return "海归回来，带着别人没有的视野和背书，不创业太可惜。";
  if (profileHasSafe(s, "workHistory", "bigtech")) return "在大厂被当螺丝钉榨干，你看清了门道，想造一台属于自己的机器。";
  if ((s.founderPrep && s.founderPrep.industryInsight >= 50) || (typeof windInsight === "function" && windInsight(s) > 0)) return "你嗅到了风口的味道——错过这一波，可能就没有下一波。";
  if (profileHasSafe(s, "privilege", "family_business")) return "家里那摊生意等着人接，是包袱，也是现成的牌。";
  return "一份饿不死也撑不起梦想的工作，把你慢慢逼向了那个念头：要不，自己干？";
}
function threadLevelSafe(s, id) { return (typeof threadLevel === "function") ? threadLevel(s, id) : ((s.threads && s.threads[id] && s.threads[id].level) || 0); }
function profileHasSafe(s, list, id) { return (typeof profileHas === "function") ? profileHas(s, list, id) : false; }

// 事件的「创业角色」：供创业导向调度分层（批次B 用）
function entrepreneurialRoleOf(e) {
  if (!e) return "flavor";
  if (e.entrepreneurialRole) return e.entrepreneurialRole;
  const m = e.module;
  if (m === "venture" || m === "startup") return e.importance === "crisis" ? "crisis" : "company";
  if (m === "degree" || m === "study" || m === "work" || m === "career") return "resource";
  if (m === "world" || m === "era" || m === "history" || m === "crash") return "world";
  if (m === "weather") return "flavor";   // 天气是生活底色，不算创业变量（并受调味年限额约束）
  if (m === "mainarc") return "origin";
  if (m === "relation" && /cofounder|invite|invest/.test(e.id || "")) return "resource";
  if (m === "family" || m === "love") return "cost";
  if (m === "money") return "resource";
  return "flavor";
}

// 当前工作场景每季度滴入对应的创业资源（打工本身就在积累创业底牌）
const SCENE_PREP = {
  bigtech: { productSense: 3, industryInsight: 2 },
  sales_channel: { salesChannel: 4, riskTolerance: 1 },
  civil: { industryInsight: 1, riskTolerance: -1 },
  cross_border: { salesChannel: 2, industryInsight: 2 },
  factory: { industryInsight: 2, productSense: 1 },
  service: { salesChannel: 2 },
  office: { industryInsight: 1, productSense: 1 }
};
function founderPrepFromScene(s) {
  if (!s.workScene || !s.job || (s.startup && s.startup.fulltime)) return;
  const m = SCENE_PREP[s.workScene.kind]; if (!m) return;
  for (const k in m) addFounderPrep(s, k, m[k]);
  addFounderPrep(s, "teamTrust", 1);   // 同事/客户/老板，攒的都是将来的人
}
/* —— 创业公司状态（批次D 地基）：在不动现有 s.startup venture 子系统的前提下，
 * 给它补齐完整公司字段(股权/债务/合规/士气/客户/营收/现金流)，并提供归一化只读视图 companyState。
 * 现有 events-venture / engine.ventureTick 仍读写 s.startup；新内容/UI 可读 companyState。*/
function ensureCompanyFields(s) {
  const su = s.startup; if (!su) return null;
  if (su.equity == null) su.equity = 100;            // 创始人持股%
  if (su.debt == null) su.debt = has(s, "has_loan") ? 300000 : 0;
  if (su.compliance == null) su.compliance = 60;     // 合规度（造假/灰色会拉低）
  if (su.morale == null) su.morale = su.team != null ? su.team : 50;  // 团队士气
  if (su.customers == null) su.customers = su.users || 0;
  if (su.revenue == null) su.revenue = 0;
  if (su.capTable == null) su.capTable = [{ who: "你", pct: su.equity }];
  return su;
}
const COMPANY_STAGE_NAME = { idea: "点子", mvp: "MVP", revenue: "有营收", growth: "扩张", crisis: "危机", exit: "退出", 种子: "种子", 天使轮: "天使轮", "A轮": "A轮", "B轮": "B轮", "Pre-IPO": "Pre-IPO" };
function companyState(s) {
  const su = s.startup; if (!su) return null;
  ensureCompanyFields(s);
  return {
    name: su.name || "未命名公司", track: su.track || (su.tracks && su.tracks[0]) || "",
    stage: su.stage || "种子", stageName: COMPANY_STAGE_NAME[su.stage] || su.stage || "种子",
    product: Math.round(su.product || 0), customers: Math.round(su.customers || 0),
    runway: Math.round(su.runway || 0), valuation: Math.round(su.valuation || 0),
    equity: Math.round(su.equity), debt: Math.round(su.debt), compliance: Math.round(su.compliance),
    morale: Math.round(su.morale), fulltime: !!su.fulltime, done: has(s, "startup_done")
  };
}

// 一句话创业前史摘要（仪表盘/结局用）
function founderSummary(s) {
  const p = ensureFounderState(s);
  const tags = [];
  if (p.industryInsight >= 45) tags.push("懂行");
  if (p.productSense >= 45) tags.push("能做产品");
  if (p.salesChannel >= 45) tags.push("有渠道");
  if (p.teamTrust >= 45) tags.push("有伙伴");
  if (p.riskTolerance >= 50) tags.push("敢赌");
  if (p.moralDebt >= 40) tags.push("手不太干净");
  return tags.join(" · ");
}
