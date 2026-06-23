"use strict";
/* =====================================================================
 * content/action-resolver.js —— 行动调度器（中国式家长化·第二轮 §3/§4/§12）
 * 让「阶段 + 场景」真正驱动每周可做什么，而不是从全局行动池铺一堆按钮。
 *   getWeekActions(s)      按当前主线阶段 + 场景，产出 3-6 个相关行动
 *   getActionPreview(s,id) 行动的成本/收益预览（高成本行动必显）
 *   canRunAction(s,id)     是否可做（require + 时间/格子）
 * 行动对象沿用 C.actions（含 .resolve），引擎点击流程不变（非破坏式）。
 * 旧 routeFilterActions 退为兜底（pool 不足时补齐）。
 * ===================================================================== */

// 阶段 → 优先行动 id（中国式家长式精选，doc §3.3）
const STAGE_ACTIONS = {
  college_junior:   ["study", "parttime", "jobhunt", "prep_interview", "socialize", "leisure", "browse", "abroad"],
  job_search:       ["jobhunt", "prep_interview", "socialize", "parttime", "browse", "rest"],
  first_job:        ["work", "coworker_lunch", "move_near_office", "exercise", "leisure", "rest", "quit"],
  work_grind:       ["work", "collect_evidence", "coworker_lunch", "socialize", "sidehustle", "leisure", "invest", "browse", "quit"],
  opportunity_build:["work", "validate_need", "socialize", "sidehustle", "browse", "leisure", "invest", "quit"],
  resign_or_stay:   ["work", "quit", "validate_need", "socialize", "browse", "rest"],
  startup_survival: ["venture", "startup", "invest", "socialize", "rest", "exercise"]
};
// 场景 → 追加行动 id（在某地才会冒出来的事，doc §6.1）
const SCENE_ACTIONS = {
  office:        ["work", "coworker_lunch", "collect_evidence"],
  startup_office:["venture", "startup"],
  park:          ["leisure"],
  rental:        ["rest", "move_near_office"],
  home:          ["rest", "date"],
  netgroup:      ["invest", "browse"],
  school:        ["study", "parttime", "leisure"],
  daily:         ["browse", "rest", "leisure"]
};
const ESSENTIAL_ACTIONS = ["rest", "browse"];   // 永远兜底，保证本周排得满

function _legalAction(s, a) {
  if (!a) return false;
  if (a.require) { try { return !!a.require(s); } catch (e) { return false; } }
  return true;
}
function _actionById(id) { return (typeof actions !== "undefined") ? actions.find(a => a.id === id) : null; }

// 当前主线阶段 + 场景 → 精选 3-6 个行动（核心驱动）
function getWeekActions(s, stage) {
  const all = (typeof actions !== "undefined") ? actions : [];
  const stageId = (typeof mainStageId === "function") ? mainStageId(s) : null;
  const sceneKey = (typeof sceneMeta === "function") ? (sceneMeta(s) || {}).key : null;
  const order = (STAGE_ACTIONS[stageId] || []).concat(SCENE_ACTIONS[sceneKey] || [], ESSENTIAL_ACTIONS);
  const out = []; const seen = {};
  for (const id of order) {
    if (seen[id]) continue;
    const a = _actionById(id);
    if (a && _legalAction(s, a)) { out.push(a); seen[id] = 1; }
  }
  // 兜底补齐：精选不足 3 个时，从旧路线池里补（保证可玩、可结束本周）
  if (out.length < 3) {
    const pool = (typeof routeFilterActions === "function" && stage) ? routeFilterActions(s, all, stage)
      : all.filter(a => _legalAction(s, a));
    for (const a of pool) { if (out.length >= 5) break; if (!seen[a.id]) { out.push(a); seen[a.id] = 1; } }
  }
  return out.slice(0, 7);
}

// 行动预览（成本/收益一句话；引擎可用 a.hint 兜底）
function getActionPreview(s, id) {
  const a = _actionById(id); if (!a) return "";
  return a.preview || a.hint || a.desc || "";
}
function canRunAction(s, id) {
  const a = _actionById(id); if (!a) return false;
  if (!_legalAction(s, a)) return false;
  return a.hours <= Math.max(0, s.hours || 0);
}

/* ===== 新增「场景行动」：补足中国式家长式的安排（doc §3.3）。沿用 resolve 协议。 ===== */
function _pi3(s) { return (s.world && s.world.priceIndex) || 1; }
if (typeof actions !== "undefined") {
  actions.push(
    // 求职：准备面试 → 提升下一次面试发挥（写 _interview_ready）
    { id: "prep_interview", name: "准备面试", emoji: "📝", hours: 10, anyStage: true,
      desc: "刷面经、改简历、对着镜子练自我介绍。把短板补一补，临场少慌一点。", hint: "🧠面试发挥↑　🙂略累",
      require: s => !s.job && !(s.startup && s.startup.fulltime),
      resolve: s => { add(s, "knowledge", 0.6); add(s, "charm", 0.5); s._interviewPrep = (s._interviewPrep || 0) + 1; flag(s, "interview_ready"); if (typeof recordBeat === "function") recordBeat(s, "first_interview"); return "你把常见面试题过了一遍，简历又改到第八版。心里那点没底的慌张，被准备一点点压了下去——至少下次坐进面试间，你知道自己要说什么。"; } },
    // 在职：和同事吃饭 → 拉近同事关系，小概率引出同事事件
    { id: "coworker_lunch", name: "和同事吃饭", emoji: "🍱", hours: 6, anyStage: true,
      desc: "工作日的午饭，约相熟的同事一起。情报、八卦、人情，都在饭桌上流动。", hint: "🤝同事关系↑　偶有职场情报",
      require: s => !!s.job,
      resolve: s => { add(s, "network", 1.5); add(s, "cash", -Math.round(60 * _pi3(s))); if (typeof meetPerson === "function" && rnd(0.3)) { /* 同事关系在 cast 里慢慢长 */ } if (rnd(0.22)) return { event: "ev_wc_credit" }; return "几个人挤在公司楼下的小馆子，边吃边吐槽老板和甲方。你听来了些有用的风声，也在这顿饭里，和谁更近了一点、和谁还是客客气气。"; } },
    // 职场沉浮：收集职场证据 → 合规/证据意识（背锅、仲裁的底牌）
    { id: "collect_evidence", name: "留个心眼·存证据", emoji: "🗂️", hours: 4, anyStage: true,
      desc: "把关键决策的邮件、聊天记录、考勤一一归档。职场如战场，留痕是护身符。", hint: "🛡️背锅/仲裁有底牌　🧠行业认知↑",
      require: s => !!s.job,
      resolve: s => { flag(s, "has_work_evidence"); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2); add(s, "insight", 0.5); if (typeof recordBeat === "function") recordBeat(s, "industry_insight"); return "你默默养成了一个习惯：重要的事，必留书面记录。同事笑你多心，可你太清楚——真出了事，能保住你的，从来不是同事的口头担保，是那一份份带时间戳的证据。"; } },
    // 创业契机：验证需求 → 攒产品/客户底牌，推进机会成熟
    { id: "validate_need", name: "验证需求·磨机会", emoji: "🔎", hours: 8, anyStage: true,
      desc: "拿着你那个念头去找真实用户聊、做小样、算账。机会不是想出来的，是验出来的。", hint: "💡产品/渠道认知↑　推进创业机会成熟",
      require: s => !s.startup && (typeof founderReadiness === "function" ? founderReadiness(s) >= 30 : false),
      resolve: s => { if (typeof addFounderPrep === "function") { addFounderPrep(s, "productSense", 3); addFounderPrep(s, "salesChannel", 2); } add(s, "insight", 0.6); flag(s, "validated_need"); if (typeof recordBeat === "function") recordBeat(s, "first_opportunity"); if (typeof rememberFact === "function" && rnd(0.3)) rememberFact(s, { type: "opportunity", text: "拿着创业的念头去验证了一轮真实需求。", tags: ["opportunity", "validate"], intensity: 2 }); return "你厚着脸皮去找了十几个潜在用户聊，做了个粗糙的小样让他们试。有人泼冷水，有人眼睛一亮。一圈下来，那个模糊的念头，轮廓清晰了不少——哪些是真痛点，哪些是你的一厢情愿，你心里有数了。"; } }
  );
}

if (typeof window !== "undefined") { window.STAGE_ACTIONS = STAGE_ACTIONS; window.SCENE_ACTIONS = SCENE_ACTIONS; }
