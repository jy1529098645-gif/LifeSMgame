"use strict";
/* =====================================================================
 * content/social-profile.js —— 社会画像与社会摩擦层（升级·第一阶段）
 * 核心句：能力决定你能不能把事做成；学历和背景决定别人愿不愿意让你上桌；
 *        经历决定你摔过以后会变成什么样的人。
 *
 * 同一件事，不同社会画像的人进入时，门槛/眼神/价格/机会完全不同。
 * socialAccess(s, field) 综合【学历 + 家庭阶层 + 履历 + 六维能力 + 城市 +
 * 动态世界 + 名声 - 污点】算出场域通行度(0-100)；accessTone 归为 high/mid/low；
 * byAccess(s, field, map) 据此给出不同叙事文本。
 * ===================================================================== */

function ensureProfile(s) {
  if (s.profile && s.profile._init) return s.profile;
  const p = s.profile || {};
  p.education = p.education || deriveEducation(s);
  p.schoolTier = p.schoolTier != null ? p.schoolTier : deriveSchoolTier(s);
  p.familyClass = p.familyClass || deriveFamilyClass(s);
  p.birthplaceTier = p.birthplaceTier != null ? p.birthplaceTier : deriveBirthTier(s);
  p.household = p.household || (has(s, "emigrated") ? "overseas" : "local");
  p.workHistory = p.workHistory || [];
  p.scars = p.scars || [];
  p.credentials = p.credentials || [];
  p.stigma = p.stigma || [];
  p.privilege = p.privilege || [];
  // 从既有 flag 回填（兼容旧存档/旧事件）
  if (has(s, "haigui_back") && p.credentials.indexOf("overseas_degree") < 0) p.credentials.push("overseas_degree");
  if (has(s, "civil_servant") && p.credentials.indexOf("civil_stable") < 0) p.credentials.push("civil_stable");
  if (has(s, "bigtech") && p.workHistory.indexOf("bigtech") < 0) p.workHistory.push("bigtech");
  if (has(s, "startup_exp") && p.workHistory.indexOf("founder") < 0) p.workHistory.push("founder");
  if (has(s, "been_bankrupt") && p.scars.indexOf("bankrupt") < 0) p.scars.push("bankrupt");
  if (has(s, "got_scammed") && p.scars.indexOf("scam_survivor") < 0) p.scars.push("scam_survivor");
  if (has(s, "has_house") && p.privilege.indexOf("house_local") < 0) p.privilege.push("house_local");
  p._init = true;
  s.profile = p;
  return p;
}
function deriveEducation(s) {
  if (has(s, "phd") || has(s, "edu_phd")) return "phd";
  if (has(s, "master") || has(s, "edu_master")) return "master";
  if (has(s, "haigui_back")) return "overseas";
  if (has(s, "dropped_out") || has(s, "edu_dropout")) return "dropout";
  if (has(s, "edu_top") || has(s, "edu_bachelor")) return "bachelor";
  if (has(s, "edu_none")) return "none";
  return "bachelor";
}
function deriveSchoolTier(s) {
  if (has(s, "edu_top")) return 3;
  if (has(s, "haigui_back")) return 2;
  if (has(s, "edu_bachelor")) return 1;
  return 0;
}
function deriveFamilyClass(s) {
  const t = (typeof classTier === "function") ? classTier(s) : 1;
  return ["poor", "worker", "mid", "upper", "rich"][Math.max(0, Math.min(4, t))];
}
function deriveBirthTier(s) {
  // 1=一线 … 4=县城/海外；与 city.tier 方向相反，数字越大越偏远
  const bp = s.birthplace;
  if (bp && bp.tier) return Math.max(1, Math.min(4, 5 - bp.tier));
  return 3;
}

/* —— 写回重大经历（主线/事件调用）—— */
function addCredential(s, id) { const p = ensureProfile(s); if (p.credentials.indexOf(id) < 0) p.credentials.push(id); }
const EXP_PREP = {
  founder: { riskTolerance: 16, teamTrust: 8, productSense: 5 },
  bigtech: { productSense: 8, industryInsight: 6 },
  cross_border: { salesChannel: 8, industryInsight: 6 },
  factory_grit: { industryInsight: 8, productSense: 4 },
  service: { salesChannel: 6 },
  listed_company: { riskTolerance: 6, teamTrust: 6, industryInsight: 6 }
};
function addExperience(s, id) {
  const p = ensureProfile(s); if (p.workHistory.indexOf(id) < 0) p.workHistory.push(id);
  // 任何被记入履历的「创业相关经历」都同步喂养创业准备度——让所有主线/职场/留学统一回流到创业
  if (typeof addFounderPrep === "function" && EXP_PREP[id]) { const m = EXP_PREP[id]; for (const k in m) addFounderPrep(s, k, m[k]); }
}
function addStigma(s, id)     { const p = ensureProfile(s); if (p.stigma.indexOf(id) < 0) p.stigma.push(id); }
function addPrivilege(s, id)  { const p = ensureProfile(s); if (p.privilege.indexOf(id) < 0) p.privilege.push(id); }
function addScar(s, id)       { const p = ensureProfile(s); if (p.scars.indexOf(id) < 0) p.scars.push(id); }
function profileHas(s, list, id) { const p = ensureProfile(s); return (p[list] || []).indexOf(id) >= 0; }

/* —— 场域通行度 socialAccess(s, field) —— */
const EDU_SCORE = { none: 4, vocational: 8, dropout: 6, bachelor: 16, master: 22, overseas: 24, phd: 26 };
const CLASS_SCORE = { poor: 2, worker: 6, mid: 12, upper: 20, rich: 26 };
// 各场域看重哪些能力（六维），权重之和约 1
const FIELD_ABILITY = {
  job_bigtech:     { knowledge: 0.5, strategy: 0.3, insight: 0.2 },
  job_civil:       { knowledge: 0.6, mind: 0.4 },
  job_sales:       { charm: 0.5, strategy: 0.3, insight: 0.2 },
  job_service:     { charm: 0.5, body: 0.5 },
  job_factory:     { body: 0.6, knowledge: 0.4 },
  startup_funding: { strategy: 0.4, insight: 0.3, charm: 0.3 },
  marriage_market: { charm: 0.5, mind: 0.3, insight: 0.2 },
  elite_circle:    { charm: 0.4, strategy: 0.3, insight: 0.3 },
  bank_credit:     { strategy: 0.4, mind: 0.4, knowledge: 0.2 },   // 银行授信/买房贷款
  study_abroad:    { knowledge: 0.5, mind: 0.3, insight: 0.2 },    // 留学申请与毕业去向
  elite_nightlife: { charm: 0.6, insight: 0.4 },                   // 高端晚宴/夜生活（高通行度也更防仙人跳）
  civil_promotion: { strategy: 0.4, knowledge: 0.3, mind: 0.3 }    // 体制内晋升
};
function abilityScore(s, field) {
  const w = FIELD_ABILITY[field]; if (!w) return 0;
  let v = 0; for (const k in w) v += ((s.stats && s.stats[k]) || 0) * w[k];
  return (v - 35) * 0.5;   // 35 中庸→0；满分约 +32
}
function eduWeight(s, p, field) {
  let base = EDU_SCORE[p.education] || 10;
  base += (p.schoolTier || 0) * 4;
  // 不同场域对学历敏感度不同
  if (field === "job_factory" || field === "job_service") base *= 0.4;   // 蓝领/服务业看学历少
  if (field === "job_civil") base *= 1.15;
  if (field === "elite_circle" || field === "marriage_market") base *= 1.1;
  return base;
}
function familyWeight(s, p, field) {
  let base = CLASS_SCORE[p.familyClass] || 6;
  if (field === "marriage_market" || field === "elite_circle" || field === "startup_funding") base *= 1.3;
  return base;
}
function experienceWeight(s, p, field) {
  const wh = p.workHistory || []; let v = 0;
  if (field === "job_bigtech" && wh.indexOf("bigtech") >= 0) v += 14;
  if (field === "startup_funding" && wh.indexOf("founder") >= 0) v += 12;
  if (field === "startup_funding" && wh.indexOf("bigtech") >= 0) v += 8;
  if ((field === "job_factory" || field === "job_service") && (wh.indexOf("factory_grit") >= 0 || wh.indexOf("service") >= 0)) v += 12;
  if (field === "job_civil" && (p.credentials || []).indexOf("civil_stable") >= 0) v += 14;
  if (field === "civil_promotion") { if ((p.credentials || []).indexOf("civil_stable") >= 0) v += 10; if ((p.privilege || []).indexOf("family_business") >= 0 || p.familyClass === "upper" || p.familyClass === "rich") v += 8; }
  if (wh.indexOf("listed_company") >= 0) v += 10;
  return v;
}
function cityWeight(s, p, field) {
  const c = s.city; if (!c) return 0;
  // 大城市机会多，但对蓝领/服务业摩擦影响小
  let v = (c.opp - 1) * 10;
  if (field === "job_factory" || field === "job_service") v *= 0.4;
  if ((field === "marriage_market" || field === "bank_credit") && (p.privilege || []).indexOf("house_local") >= 0) v += 12;
  return v;
}
function worldWeight(s, p, field) {
  const w = s.world || {}; let v = 0;
  field = field || "";
  // 就业市场对求职类场域整体抬降
  if (field.indexOf("job_") === 0) v += (w.jobMarket - 55) * 0.18;
  // 行业景气：大厂↔AI、创业融资↔风口热度
  if (field === "job_bigtech" && typeof industryEdge === "function") v += industryEdge(s, "ai") * 40;
  if (field === "startup_funding") v += ((w.windHeat || 40) - 40) * 0.2;
  // 老履历/老钱在年轻人下行市场反而稀缺加分
  return v;
}
function reputationWeight(s, p, field) {
  let v = (s.reputation || 0) * 0.15 + (s.network || 0) * 0.08;
  if (field === "startup_funding" || field === "elite_circle") v += (s.network || 0) * 0.06;
  return v;
}
function stigmaPenalty(s, p, field) {
  const st = p.stigma || []; let pen = 0;
  if (st.indexOf("bad_credit") >= 0) pen += (field === "startup_funding" || field === "bank_credit") ? 24 : 8;
  if (st.indexOf("family_debt") >= 0) pen += (field === "marriage_market") ? 14 : 6;
  if (st.indexOf("gray_suspect") >= 0) pen += (field === "startup_funding" || field === "job_civil" || field === "elite_circle") ? 22 : 10;
  if (st.indexOf("dropout") >= 0) pen += (field === "job_bigtech" || field === "job_civil") ? 14 : 5;
  if (st.indexOf("lawsuit") >= 0) pen += 10;
  if ((p.scars || []).indexOf("bankrupt") >= 0) pen += (field === "startup_funding") ? 10 : 4;
  return pen;
}
function socialAccess(s, field) {
  const p = ensureProfile(s);
  let score = 18;   // 基础门：人人有一点点机会
  score += eduWeight(s, p, field);
  score += familyWeight(s, p, field);
  score += experienceWeight(s, p, field);
  score += abilityScore(s, field);
  score += cityWeight(s, p, field);
  score += worldWeight(s, p, field);
  score += reputationWeight(s, p, field);
  score -= stigmaPenalty(s, p, field);
  return Math.max(0, Math.min(100, Math.round(score)));
}
function accessTone(s, field) {
  const v = socialAccess(s, field);
  return v >= 62 ? "high" : v >= 36 ? "mid" : "low";
}
function byAccess(s, field, map) {
  const tone = accessTone(s, field);
  return map[tone] || map.mid || "";
}

/* —— 一句话社会画像（仪表盘用）—— */
const EDU_LABEL = { none: "无学历", vocational: "职校", dropout: "肄业", bachelor: "本科", master: "硕士", overseas: "海归", phd: "博士" };
function profileSummary(s) {
  const p = ensureProfile(s);
  const tags = [];
  let edu = EDU_LABEL[p.education] || "本科";
  if (p.schoolTier >= 3) edu = "名校" + edu; else if (p.schoolTier === 2 && p.education !== "overseas") edu = "重点" + edu;
  tags.push(edu);
  if ((p.workHistory || []).indexOf("bigtech") >= 0) tags.push("大厂背景");
  if ((p.workHistory || []).indexOf("founder") >= 0) tags.push("创过业");
  if ((p.workHistory || []).indexOf("factory_grit") >= 0) tags.push("工厂摸爬");
  if ((p.credentials || []).indexOf("civil_stable") >= 0) tags.push("体制上岸");
  if ((p.scars || []).indexOf("bankrupt") >= 0) tags.push("破产过一次");
  if ((p.scars || []).indexOf("scam_survivor") >= 0) tags.push("被骗幸存");
  if ((p.privilege || []).indexOf("house_local") >= 0) tags.push("本地有房");
  else if (s.city) tags.push(s.city.name + "无房");
  if ((p.stigma || []).indexOf("bad_credit") >= 0) tags.push("征信瑕疵");
  // 家庭托底
  if (p.familyClass === "rich" || p.familyClass === "upper") tags.push("家庭托底强");
  else if (p.familyClass === "poor") tags.push("家庭托底弱");
  return tags.join(" · ");
}
