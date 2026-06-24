"use strict";
/* =====================================================================
 * content/stage-manager.js —— 主线阶段管理（大框架改造·批次1）
 * 把「随机人生」收束为一条可推进的创业主线：大三探索 → 求职 → 初入职场 →
 * 职场沉浮 → 创业契机 → 离职决断 → 创业生存。
 *
 * 设计原则（兼容层，不推翻旧代码）：
 *   ① 阶段「条件成熟度」驱动，而非纯按年龄（doc §2.1）。
 *   ② 本批只做骨架：从现有状态【派生】当前主线阶段并显示，转场记忆/提醒，
 *      不硬卡死旧流程；硬性入场门槛、beats 卡关留待后续批次。
 *   ③ 全部 ensureXxx / mainStageTick 幂等，兼容旧存档。
 *
 * 暴露：MAIN_STAGES, mainStageDef, ensureMainStage, mainStageTick,
 *       mainStageOf, mainStageId, mainStageTitle, recordBeat, hasBeat, mainStageSummary
 * ===================================================================== */

const MAIN_STAGES = [
  { id: "college_junior", title: "大三探索期", emoji: "🎓",
    desc: "还在校园，但社会的门已经推开一条缝。攒学历、专业能力、兴趣和最早的人脉。",
    beats: ["pick_major", "first_intern", "first_network"],
    quest: "想清楚毕业后要走的第一步。" },
  { id: "job_search", title: "求职准备期", emoji: "📨",
    desc: "学历、专业、城市、履历都成了硬门槛。投简历、跑面试，拿到第一份 offer 或尝到求职的挫折。",
    beats: ["first_resume", "first_interview", "first_offer"],
    quest: "拿到人生第一份正式工作。" },
  { id: "first_job", title: "初入职场期", emoji: "💼",
    desc: "上班自动吃掉大把时间。通勤、迟到、房租、同事、主管——你第一次尝到被工作支配的滋味。",
    beats: ["onboard", "first_commute", "first_paycheck"],
    quest: "在第一份工作里站稳脚跟。" },
  { id: "work_grind", title: "职场沉浮期", emoji: "🌪️",
    desc: "背锅、抢功、加班、画饼、裁员、仲裁……职场的荒诞开始把工作经历熬成创业的认知与伤痕。",
    beats: ["first_conflict", "first_raise_or_cut", "industry_insight"],
    quest: "把打工的经历，攒成自己创业的底牌。" },
  { id: "opportunity_build", title: "创业契机期", emoji: "💡",
    desc: "经历开始长出机会卡。关系网主动推机会、邀请、风险局；新闻、行业、股市、政策与你强绑定。",
    beats: ["first_opportunity", "mentor_push", "co_founder_lead"],
    quest: "等一张你看得懂、也吃得下的创业机会卡。" },
  { id: "resign_or_stay", title: "离职决断期", emoji: "🚪",
    desc: "要不要离职创业？现金、赔偿、社保、家庭压力、合伙人、机会窗口——每个选项都标着代价。",
    beats: ["resign_choice"],
    quest: "做出离不离职的决断。" },
  { id: "startup_survival", title: "创业生存期", emoji: "🚀",
    desc: "下海了。现金流、产品、客户、合伙人、融资、监管、家庭压力，成了每周的主旋律。",
    beats: ["mvp", "first_customer", "first_funding"],
    quest: "让公司活过下一个冬天。" }
];
const _STAGE_INDEX = {}; MAIN_STAGES.forEach((st, i) => { _STAGE_INDEX[st.id] = i; });

// 阶段目标（beat）→ 玩家可读标签（doc §5.1，banner 展示 2-3 个目标）
const BEAT_LABELS = {
  pick_major: "想清楚专业方向", first_intern: "尝试一次实习/兼职", first_network: "认识一个早期人物",
  first_resume: "投出第一份简历", first_interview: "参加一次面试", first_offer: "拿到第一个 offer",
  onboard: "正式入职", first_commute: "体会通勤压力", first_paycheck: "拿到第一份工资",
  first_conflict: "经历一次职场不公", first_raise_or_cut: "经历升迁或被裁", industry_insight: "攒下行业认知",
  first_opportunity: "发现一个创业机会", mentor_push: "得到贵人点拨", co_founder_lead: "遇到潜在合伙人",
  resign_choice: "做出离职的决断", mvp: "做出第一版 MVP", first_customer: "拿下第一个客户", first_funding: "拿到第一笔融资"
};

// 每阶段「必做」目标（required）：全部完成才能自然推进（doc §5.2）。其余 beats 为可选。
// 这些 required beat 都能通过当前阶段的精选行动可靠拿到，避免软锁；身份硬变化(入职/创业)另有兜底放行。
const REQUIRED_BEATS = {
  college_junior: ["first_intern"],
  job_search: ["first_resume"],
  first_job: ["first_paycheck"],
  work_grind: ["industry_insight"],
  opportunity_build: ["first_opportunity"],
  resign_or_stay: ["resign_choice"],
  startup_survival: []
};

function mainStageDef(id) { return MAIN_STAGES[_STAGE_INDEX[id]] || null; }

function ensureMainStage(s) {
  if (!s.mainStage || typeof s.mainStage !== "object") {
    s.mainStage = { id: null, sinceWk: s.week || 0, beats: {}, log: [] };
  }
  if (!s.mainStage.beats) s.mainStage.beats = {};
  if (!s.mainStage.log) s.mainStage.log = [];
  // —— 语义层（§1）：当前人生剧本（第一条主线=职场沉浮）。创业只是后期分岔之一。
  if (!s.lifeRoute) s.lifeRoute = "career_absurd";
  return s.mainStage;
}
const LIFE_ROUTE_NAME = { career_absurd: "职场沉浮" };

function _readinessSafe(s) { return (typeof founderReadiness === "function") ? founderReadiness(s) : 0; }
function _hasFlag(s, f) { return (typeof has === "function") ? has(s, f) : !!(s.flags && s.flags[f]); }

// 从现有状态【派生】最匹配的主线阶段（兼容层：不改旧流程，只读不写）
function mainStageOf(s) {
  ensureMainStage(s);
  // ① 创业生存：已全职创业 / 进入经营模式 / 创业收束
  if ((s.startup && s.startup.fulltime) || _hasFlag(s, "startup_done") ||
      (s.startup && !_hasFlag(s, "startup_failed"))) return "startup_survival";
  const readiness = _readinessSafe(s);
  const employed = !!s.job || _hasFlag(s, "employed") || _hasFlag(s, "civil_servant");
  // ② 离职决断：准备度到门口 + 还在职（被推到了「走不走」的临界）
  if (employed && (readiness >= 70 || s._pendingResign)) return "resign_or_stay";
  // ③ 创业契机：经历开始长出机会（准备度中段）
  if (readiness >= 38 || _hasFlag(s, "got_lead") || (s.opportunities && s.opportunities.length)) {
    return employed ? "opportunity_build" : (readiness >= 50 ? "opportunity_build" : (employed ? "work_grind" : "job_search"));
  }
  // ④ 在职：用「入职周数」区分初入职场 / 职场沉浮
  if (employed) {
    const since = s._jobSinceWk == null ? (s.week || 0) : s._jobSinceWk;
    const tenure = (s.week || 0) - since;
    return tenure < 26 ? "first_job" : "work_grind";   // ≈ 半年内算「初入职场」
  }
  // ⑤ 无业：在校 vs 求职。读书中或很年轻且没投过简历 → 大三探索；否则求职期
  if ((s.study && s.study.active) || (s.campus && s.campus.active !== false)) return "college_junior";
  if (_hasFlag(s, "graduated_unemployed") || _hasFlag(s, "campus_done") || _hasFlag(s, "campus_skipped")) return "job_search";
  const everLooked = _hasFlag(s, "ever_jobhunt") || hasBeat(s, "first_resume") || (s.age || 18) >= 23;
  if (everLooked) return "job_search";
  return "college_junior";
}

// 当前阶段的【必做目标】是否全部完成（硬门槛：完成关键目标才推进，doc §5.2/§5.3）
function _stageGoalsMet(s, stageId) {
  const req = REQUIRED_BEATS[stageId] || [];
  return req.every(b => hasBeat(s, b));
}
function canAdvanceStage(s) { return _stageGoalsMet(s, mainStageId(s)); }
// 身份硬变化（拿到/失去工作、公司成立/收束）→ 强制推进，不受目标门槛限制
function _hardStateChanged(s) {
  const emp = !!s.job; const su = !!(s.startup && !_hasFlag(s, "startup_failed"));
  const changed = (s._lastEmpState !== emp) || (s._lastSuState !== su);
  s._lastEmpState = emp; s._lastSuState = su;
  return changed;
}

// 每周由引擎调用：检测主线阶段转场，写记忆/提醒/时间线
function mainStageTick(s) {
  const ms = ensureMainStage(s);
  // 记录首次拿到工作的周（用于 first_job/work_grind 分界）
  if (s.job && s._jobSinceWk == null) s._jobSinceWk = s.week || 0;
  if (!s.job && s._jobSinceWk != null && !(s.startup && s.startup.fulltime)) s._jobSinceWk = null;
  const hardChange = _hardStateChanged(s);
  const target = mainStageOf(s);
  s.lifeStage = target;   // 语义层：当前人生阶段（§1）
  if (target && target !== ms.id) {
    const prev = ms.id;
    const def = mainStageDef(target);
    const forward = prev == null || (_STAGE_INDEX[target] > (_STAGE_INDEX[prev] != null ? _STAGE_INDEX[prev] : -1));
    // ★硬门槛：向前推进（且非身份硬变化）时，要求当前阶段【必做目标】全部完成——「完成关键目标才推进」
    if (forward && prev != null && !hardChange && !_stageGoalsMet(s, prev)) return ms.id;
    ms.id = target;
    ms.sinceWk = s.week || 0;
    ms.log.push({ id: target, age: s.age, week: s.week, from: prev });
    if (def) {
      // 结构化记忆 + 时间线 + 周日志提醒（NotificationCenter 之前的兜底）
      if (typeof addMemory === "function") addMemory(s, { type: "stage", text: `进入【${def.title}】：${def.quest}`, tags: ["stage", target], intensity: forward ? 3 : 2 });
      if (s.timeline) s.timeline.push({ age: s.age, text: `${def.emoji} 人生进入【${def.title}】——${def.quest}` });
      if (typeof notify === "function") notify(s, { kind: forward ? "stage" : "warn", title: `${def.emoji} ${def.title}`, body: def.quest });
      else if (s._weekNotes) s._weekNotes.push(`${def.emoji} 人生进入【${def.title}】——${def.quest}`);
    }
  }
  return ms.id;
}

function mainStageId(s) { return (s.mainStage && s.mainStage.id) || mainStageOf(s); }
function mainStageTitle(s) { const d = mainStageDef(mainStageId(s)); return d ? d.title : "人生"; }

// beats：阶段内关键节拍（供事件标记「我做到了」）——幂等
function recordBeat(s, name) {
  const ms = ensureMainStage(s);
  if (!ms.beats[name]) {
    ms.beats[name] = { age: s.age, week: s.week };
    if (typeof addMemory === "function") addMemory(s, { type: "beat", text: name, tags: ["beat", name], intensity: 1 });
  }
  return ms.beats[name];
}
function hasBeat(s, name) { return !!(s.mainStage && s.mainStage.beats && s.mainStage.beats[name]); }

// 给 UI 的主线概览
function mainStageSummary(s) {
  const id = mainStageId(s);
  const def = mainStageDef(id);
  if (!def) return null;
  const beatsDone = def.beats.filter(b => hasBeat(s, b)).length;
  return {
    id, title: def.title, emoji: def.emoji, desc: def.desc, quest: def.quest,
    index: _STAGE_INDEX[id], total: MAIN_STAGES.length,
    beats: def.beats.map(b => ({ name: b, done: hasBeat(s, b) })),
    goals: def.beats.map(b => ({ label: BEAT_LABELS[b] || b, done: hasBeat(s, b), required: (REQUIRED_BEATS[id] || []).indexOf(b) >= 0 })),   // ★带标签+必做标记的阶段目标
    canAdvance: _stageGoalsMet(s, id),
    beatsDone, beatsTotal: def.beats.length
  };
}

if (typeof window !== "undefined") {
  window.MAIN_STAGES = MAIN_STAGES;
}
