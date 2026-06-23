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
  college_junior:   ["study", "parttime", "jobhunt", "prep_interview", "ask_senior", "socialize", "leisure", "browse", "abroad"],
  job_search:       ["jobhunt", "prep_interview", "ask_senior", "socialize", "parttime", "browse", "rest"],
  first_job:        ["work", "overtime_perf", "coworker_lunch", "move_near_office", "exercise", "leisure", "rest", "quit"],
  work_grind:       ["work", "overtime_perf", "collect_evidence", "learn_industry", "coworker_lunch", "side_project", "socialize", "leisure", "invest", "quit"],
  opportunity_build:["work", "validate_need", "talk_to_mentor", "calculate_runway", "side_project", "socialize", "browse", "quit"],
  resign_or_stay:   ["work", "quit", "validate_need", "calculate_runway", "talk_to_mentor", "browse", "rest"],
  startup_survival: ["venture", "startup", "invest", "talk_to_mentor", "rest", "exercise"]
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
  const scene = (typeof sceneMeta === "function") ? sceneMeta(s) : null;
  const sceneKey = scene ? scene.key : null;
  // 场景行动优先读 scene-manager 的 sceneMeta.actions（doc §6.2），回退到本文件 SCENE_ACTIONS
  const sceneActs = (scene && scene.actions) || SCENE_ACTIONS[sceneKey] || [];
  const order = (STAGE_ACTIONS[stageId] || []).concat(sceneActs, ESSENTIAL_ACTIONS);
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
    // 初入职场/沉浮：加班冲绩效 → 绩效↑但透支健康
    { id: "overtime_perf", name: "加班冲绩效", emoji: "🌙", hours: 18, slotCost: 1, anyStage: true,
      desc: "主动留下来加班、抢活、刷存在感，把绩效堆上去。", preview: "💼绩效/涨薪概率↑　❤️健康↓　😣压力↑↑", hint: "💼绩效↑　❤️健康-4　😣压力+8",
      require: s => !!s.job,
      resolve: s => { if (s.job) s.job._raise = (s.job._raise || 0) + 0.03 + statEdge(s, "knowledge") * 0.03; add(s, "health", -4); add(s, "stress", 8); add(s, "strategy", 0.4); if (s.stress > 80 && typeof bumpThread === "function") bumpThread(s, "health_debt", 6); return "你又是办公室最后一个走的。绩效本上多了一笔亮眼的数字，可镜子里的黑眼圈也深了一圈。卷，是有代价的——你心里清楚，只是暂时还扛得住。"; } },
    // 求职：找学长/熟人咨询 → 内推情报 + 面试准备
    { id: "ask_senior", name: "找学长/熟人咨询", emoji: "🧑‍🎓", hours: 6, slotCost: 1, anyStage: true,
      desc: "约师兄师姐、行业里的熟人喝杯咖啡，打听内幕、求个内推。", preview: "🤝人脉↑　📨内推/面试情报", hint: "🤝人脉↑　面试发挥↑",
      require: s => !s.job && !(s.startup && s.startup.fulltime),
      resolve: s => { add(s, "network", 2); s._interviewPrep = (s._interviewPrep || 0) + 1; add(s, "insight", 0.5); if (rnd(0.3)) { flag(s, "got_referral"); return "学长拍着胸脯：「这家我熟，简历给我，帮你递进去。」内推这条捷径，比海投十次都管用。人脉，关键时刻是真能当饭吃。"; } return "一通咨询下来，你对这个行业、这些岗位的水深水浅，心里有谱多了。少走弯路，本身就是一种赚。"; } },
    // 职场沉浮：钻研行业知识 → 学识 + 行业认知（创业底牌）
    { id: "learn_industry", name: "钻研行业知识", emoji: "📚", hours: 10, slotCost: 1, anyStage: true,
      desc: "下班后系统补行业知识、拆解头部玩家、看懂这门生意怎么赚钱。", preview: "🧠学识↑　行业洞察↑（创业底牌）", hint: "🧠学识↑　行业认知↑",
      require: s => !!s.job,
      resolve: s => { add(s, "knowledge", 1); add(s, "insight", 0.5); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 3); if (typeof recordBeat === "function") recordBeat(s, "industry_insight"); return "你不再只做手里那点活，而是开始抬头看整个行业：钱从哪来、利润藏在哪、谁在闷声发财。这些打工时偷学的门道，将来都是你自己创业的本钱。"; } },
    // 创业契机：约关键人物聊聊 → 贵人指点 + 关系加深
    { id: "talk_to_mentor", name: "约关键人物聊聊", emoji: "☕", hours: 6, slotCost: 1, anyStage: true,
      desc: "约上那个有资源、有眼光的人，认真聊聊你的想法，听听过来人的判断。", preview: "🤝关系↑　💡贵人指点/机会", hint: "🤝贵人指点",
      require: s => (s.network || 0) >= 15,
      resolve: s => { add(s, "network", 2); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2); if (typeof recordBeat === "function") recordBeat(s, "mentor_push"); let who = null; if (typeof socialCultivate === "function") who = socialCultivate(s, 6); return `你把心里那个念头，掏出来给${who ? `「${who.role}${who.name}」` : "一位过来人"}听。对方没急着捧场，而是泼了几盆冷水、也点了几句关键。临走那句「想清楚再下水」，比任何鸡汤都金贵。`; } },
    // 创业契机：算算启动成本 → 看清现金/跑道
    { id: "calculate_runway", name: "算算启动成本", emoji: "🧮", hours: 4, slotCost: 1, anyStage: true,
      desc: "认真把启动要烧的钱、能撑的跑道、最坏的情况算一遍。冲动之前，先算账。", preview: "💡看清启动成本与现金跑道", hint: "💡风险心气↑　创业更清醒",
      require: s => (typeof founderReadiness === "function" ? founderReadiness(s) >= 25 : false) && !s.startup,
      resolve: s => { add(s, "insight", 0.6); add(s, "strategy", 0.4); flag(s, "knows_runway"); if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 3); if (typeof recordBeat === "function") recordBeat(s, "first_opportunity"); const need = Math.round(150000 * ((s.world && s.world.priceIndex) || 1)); return `你摊开表格，把房租、人力、获客、囤货、最坏半年没收入……一项项算下来：要稳稳活过冷启动期，手里至少得攥着 ¥${need.toLocaleString()}。账算清了，那股头脑发热也凉了几分——这恰恰是好事。`; } },
    // 职场/契机：搞副业雏形 → 产品感 + 零散回款
    { id: "side_project", name: "搞副业雏形", emoji: "🧪", hours: 12, slotCost: 1, anyStage: true,
      desc: "用下班时间捣鼓一个小项目：摆摊、开店、做号、写工具，先跑起来试试水。", preview: "📦产品感↑　月底零散回款", hint: "📦产品感↑　💰月结小钱",
      require: s => !(s.startup && s.startup.fulltime),
      resolve: s => { const m = Math.round(Math.max(s.stats.knowledge, s.stats.strategy) * 20 + Math.random() * 300); s._monthPay = (s._monthPay || 0) + m; if (typeof addFounderPrep === "function") addFounderPrep(s, "productSense", 3); add(s, "strategy", 0.4); if (rnd(0.12)) flag(s, "side_hot"); return `你利用下班那几个钟头，把副业的雏形搭了起来。这周谈成的零碎单子能结 ¥${m.toLocaleString()}（月底回款）。钱不多，但「自己做成一件事」的手感，比工资更让你上瘾。${has(s, "side_hot") ? "你隐隐觉得，这事儿有戏。" : ""}`; } },
    // 创业契机：验证需求 → 攒产品/客户底牌，推进机会成熟
    { id: "validate_need", name: "验证需求·磨机会", emoji: "🔎", hours: 8, slotCost: 1, anyStage: true,
      desc: "拿着你那个念头去找真实用户聊、做小样、算账。机会不是想出来的，是验出来的。", hint: "💡产品/渠道认知↑　推进创业机会成熟",
      require: s => !s.startup && (typeof founderReadiness === "function" ? founderReadiness(s) >= 30 : false),
      resolve: s => { if (typeof addFounderPrep === "function") { addFounderPrep(s, "productSense", 3); addFounderPrep(s, "salesChannel", 2); } add(s, "insight", 0.6); flag(s, "validated_need"); if (typeof recordBeat === "function") recordBeat(s, "first_opportunity"); if (typeof rememberFact === "function" && rnd(0.3)) rememberFact(s, { type: "opportunity", text: "拿着创业的念头去验证了一轮真实需求。", tags: ["opportunity", "validate"], intensity: 2 }); return "你厚着脸皮去找了十几个潜在用户聊，做了个粗糙的小样让他们试。有人泼冷水，有人眼睛一亮。一圈下来，那个模糊的念头，轮廓清晰了不少——哪些是真痛点，哪些是你的一厢情愿，你心里有数了。"; } }
  );
}

if (typeof window !== "undefined") { window.STAGE_ACTIONS = STAGE_ACTIONS; window.SCENE_ACTIONS = SCENE_ACTIONS; }
