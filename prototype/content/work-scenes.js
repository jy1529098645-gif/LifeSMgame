"use strict";
/* =====================================================================
 * content/work-scenes.js —— 职位/公司场景化（升级·第一阶段）
 * companies.js/jobs.js 已把「找工作」做成公司→岗位→面试→offer。本文件让
 * 「入职后生活不一样」：按 jobType 映射工作场景，入职生成 s.workScene，
 * 不同公司/职位有不同工时/压力/假期 + 专属职场事件（cond 限定本场景触发）。
 * 同时把职业经历写回社会画像 profile.workHistory，供 socialAccess 读取。
 * ===================================================================== */

const WORK_SCENES = {
  bigtech:      { name: "大厂", weeklyHoursMod: 8,  pressure: 12, holidayDays: 8,  duties: ["需求评审", "上线", "代码评审"], eventTags: ["okr", "layoff", "manager", "pua", "stock"], vacationRule: "project_gap" },
  sales_channel:{ name: "销售/渠道", weeklyHoursMod: 5, pressure: 10, holidayDays: 6, duties: ["跑客户", "陪饭局", "催回款"], eventTags: ["client", "drinking", "commission", "bad_debt"], vacationRule: "quota_done" },
  civil:        { name: "体制内", weeklyHoursMod: -4, pressure: 6, holidayDays: 12, duties: ["材料", "接待", "迎检"], eventTags: ["inspection", "rank", "favor", "stability"], vacationRule: "official" },
  cross_border: { name: "外贸/跨境", weeklyHoursMod: 4, pressure: 9, holidayDays: 7, duties: ["接单", "对账", "盯柜"], eventTags: ["order", "fx", "shipping", "client_delay"], vacationRule: "off_season" },
  factory:      { name: "工厂/制造", weeklyHoursMod: 3, pressure: 8, holidayDays: 5, duties: ["盯线", "质检", "排产"], eventTags: ["shift", "quota", "safety", "automation"], vacationRule: "shift_swap" },
  service:      { name: "服务业", weeklyHoursMod: 2, pressure: 7, holidayDays: 4, duties: ["接客", "理货", "排班"], eventTags: ["customer", "shift", "tip", "blacklist"], vacationRule: "off_peak" },
  office:       { name: "公司白领", weeklyHoursMod: 2, pressure: 7, holidayDays: 7, duties: ["开会", "汇报", "对接"], eventTags: ["meeting", "manager", "raise"], vacationRule: "annual" }
};
// jobType（jobs.js 的 id）→ 场景 kind
const JOB_SCENE_MAP = {
  bigtech: "bigtech", product_ops: "bigtech", founder_staff: "bigtech",
  sales_channel: "sales_channel",
  civil: "civil", state_owned: "civil", hospital_admin: "civil",
  factory_qc: "factory",
  service: "service", blackwork: "service", streamer: "service",
  smallco: "office", teacher: "office", media_editor: "office",
  consultant: "office", finance: "office", exec: "office"
};
function sceneKindForJob(job) {
  if (!job) return "office";
  return JOB_SCENE_MAP[job.jobType || job.id] || (job.industry === "互联网" ? "bigtech" : "office");
}
function makeWorkScene(job) {
  const kind = sceneKindForJob(job);
  const def = WORK_SCENES[kind] || WORK_SCENES.office;
  return { kind: kind, name: def.name, pressure: def.pressure, holidayDays: def.holidayDays,
    duties: def.duties.slice(), eventTags: def.eventTags.slice(), vacationRule: def.vacationRule,
    weeklyHoursMod: def.weeklyHoursMod, week: 0 };
}
function workSceneOf(s) { return s.workScene || null; }
// 入职后调用：装配场景 + 写回社会画像经历
function applyWorkScene(s, job) {
  s.workScene = makeWorkScene(job);
  if (typeof addExperience === "function") {
    const kind = s.workScene.kind;
    if (kind === "bigtech") addExperience(s, "bigtech");
    else if (kind === "civil") addExperience(s, "civil");
    else if (kind === "factory") addExperience(s, "factory_grit");
    else if (kind === "service") addExperience(s, "service");
    else if (kind === "cross_border") addExperience(s, "cross_border");
  }
  return s.workScene;
}
function curSceneIs(s, kind) { return !!(s.workScene && s.workScene.kind === kind && has(s, "employed") && s.job); }

/* —— 工作场景专属事件（ambient + cond 限定，仅在对应场景里触发）—— */
EVENTS.push(
  {
    id: "ws_bigtech_okr", module: "work", ambient: true, importance: "scene", scene: "work",
    title: "📊 大厂双月 OKR", cond: s => curSceneIs(s, "bigtech"),
    text: s => `又到双月 OKR 复盘。你的 KR 完成度卡在 70%，组里气压很低。主管在群里 @所有人：「这个 Q 必须有亮点」。`,
    choices: [
      { label: "硬冲指标，连轴加班", effect: s => { add(s, "stress", 10); add(s, "health", -4); add(s, "knowledge", 1); if (rnd(0.5)) { add(s, "reputation", 3); if (s.job) s.job._raise = (s.job._raise || 0) + 0.03; return "你把这两个月熬成了一条直线，KR 翻红。晋升答辩的 PPT 上，终于有了一页能拿得出手的成绩。"; } return "你拼了命，数据却没怎么动——有些事不是加班能解决的。身体先垮了一截。"; } },
      { label: "对齐预期，把目标改小", effect: s => { add(s, "stress", -4); add(s, "reputation", -2); return "你和主管摊牌，把 KR 调成「踮脚够得着」的样子。考评不会太亮眼，但这个 Q 你睡得着觉。"; } }
    ]
  },
  {
    id: "ws_bigtech_layoff", module: "work", ambient: true, importance: "scene", scene: "work",
    title: "📉 优化名单", cond: s => curSceneIs(s, "bigtech") && (s.world && s.world.jobMarket < 50),
    text: s => `公司发了全员信，说要「聚焦核心、提质增效」。HR 开始约人谈话，工位一个接一个空下来。今天，轮到你部门了。`,
    choices: [
      { label: "主动找老板表忠心、要活干", effect: s => { const p = 0.55 + (typeof statEdge === "function" ? statEdge(s, "charm") : 0); if (rnd(p)) { add(s, "stress", 6); return "你赶在名单定稿前刷足了存在感，老板把你划到了「保」的那一栏。这次惊险过关。"; } if (typeof addStigma === "function") {} flag(s, "been_laid_off"); s.job = null; delete s.flags.employed; add(s, "mood", -12); s.timeline.push({ age: s.age, text: "你还是上了优化名单，N+1 赔偿到账，工牌被收走。35 岁的危机，比想象中来得早。" }); return "没保住。N+1 赔偿到账，工牌被收走——你成了「毕业」的那批人之一。"; } },
      { label: "接受赔偿，体面离开", effect: s => { flag(s, "been_laid_off"); const comp = Math.round((typeof jobSalary === "function" ? jobSalary(s) : 15000) * 4); add(s, "cash", comp); s.job = null; delete s.flags.employed; add(s, "mood", -6); return `你签了字，拿了 ¥${comp.toLocaleString()} 的 N+1。与其惶惶不可终日，不如拿钱走人——下一站，重新找。`; } }
    ]
  },
  {
    id: "ws_sales_dinner", module: "work", ambient: true, importance: "scene", scene: "work",
    title: "🍻 又一场酒局", cond: s => curSceneIs(s, "sales_channel"),
    text: s => `大客户晚上点名要你作陪。一桌人、一箱酒，单子就压在杯子底下。喝，伤身；不喝，伤单。`,
    choices: [
      { label: "舍命陪君子，干了", effect: s => { add(s, "health", -5); add(s, "stress", 5); if (rnd(0.6)) { const c = Math.round(8000 + Math.random() * 20000); add(s, "cash", c); if (s.job) s.job._raise = (s.job._raise || 0) + 0.02; return `三杯下肚，单子签了。提成 ¥${c.toLocaleString()} 到账——这行的钱，是用胃换的。`; } add(s, "mood", -4); return "酒喝到吐，单子却黄了——客户第二天说「再考虑考虑」。白遭了一回罪。"; } },
      { label: "以茶代酒，守住底线", effect: s => { add(s, "reputation", 1); if (rnd(0.4)) return "你诚恳解释了身体原因，客户难得通情达理：「实在人，单子给你」。"; add(s, "mood", -2); return "你端起茶杯，客户脸色淡了下来。这单大概率没了——但你保住了肝，也保住了体面。"; } }
    ]
  },
  {
    id: "ws_civil_inspection", module: "work", ambient: true, importance: "scene", scene: "work",
    title: "📋 上级来检查", cond: s => curSceneIs(s, "civil"),
    text: s => `上级要来检查，科里连夜补材料、布置台账、彩排汇报。领导把最关键的一摊交给了你。`,
    choices: [
      { label: "通宵把材料做到滴水不漏", effect: s => { add(s, "stress", 7); add(s, "health", -2); if (typeof addInfluence === "function") addInfluence(s, "policy", 2); if (s.job) s.job._raise = (s.job._raise || 0) + 0.02; add(s, "reputation", 2); return "检查顺利过关，领导在总结会上点了你的名表扬。体制内的进步，就是这样一笔一笔记下的。"; } },
      { label: "按部就班，不求有功", effect: s => { add(s, "stress", -2); return "你把分内的做完，没多揽也没出错。检查平稳过去，你在领导心里仍是「靠谱但不突出」的那一个。"; } }
    ]
  },
  {
    id: "ws_xborder_delay", module: "work", ambient: true, importance: "scene", scene: "work",
    title: "🚢 货柜卡在海上", cond: s => curSceneIs(s, "cross_border"),
    text: s => { const sr = (typeof industryState === "function" && industryState(s, "cross_border")) || {}; return `海外客户的大单本该这周交付，可航运紧张${sr.supplyRisk > 50 ? "（行情正乱）" : ""}，货柜卡在港口出不来。客户在邮件里开始用大写字母。`; },
    choices: [
      { label: "自掏腰包改空运保交期", effect: s => { const cost = Math.round(12000 + Math.random() * 18000); add(s, "cash", -cost); if (rnd(0.7)) { add(s, "reputation", 3); if (s.job) s.job._raise = (s.job._raise || 0) + 0.02; return `你咬牙花 ¥${cost.toLocaleString()} 改了空运，货准时到。客户回了句 rare 的「You saved us」——这层关系，往后好走。`; } return `空运的钱花了 ¥${cost.toLocaleString()}，货还是晚了两天。客户嘴上原谅，心里记了一笔。`; } },
      { label: "据实告知，请客户宽限", effect: s => { if (rnd(0.5)) return "客户难得通情达理，同意顺延。这单保住了，但下次他会多留个心眼、压一压付款。"; add(s, "mood", -5); if (typeof bumpThread === "function") bumpThread(s, "client_trust", 10, { status: "open" }); return "客户取消了部分订单，转头找了别家。外贸的信任，一次就能凉。"; } }
    ]
  },
  {
    id: "ws_factory_auto", module: "work", ambient: true, importance: "scene", scene: "work",
    title: "🤖 产线要上自动化", cond: s => curSceneIs(s, "factory"),
    text: s => `厂里要上一批机械臂，说能省下三分之一的人。班组里人心惶惶，有人已经在偷偷投简历。`,
    choices: [
      { label: "学着去管机器、转岗技术", effect: s => { add(s, "knowledge", 2); add(s, "stress", 4); if (typeof addExperience === "function") addExperience(s, "factory_grit"); if (rnd(0.6)) { if (s.job) s.job._raise = (s.job._raise || 0) + 0.03; return "你主动报名学了设备维护，从「会被替代的人」变成「维护替代品的人」。饭碗暂时稳了。"; } return "你学得吃力，机器比想象中难伺候。但至少，你没坐着等被淘汰。"; } },
      { label: "凭老资历，赌不会轮到自己", effect: s => { if (rnd(0.5)) return "这轮你躲过去了——机器先顶了别的工段。但谁都知道，这只是早晚的事。"; flag(s, "been_laid_off"); s.job = null; delete s.flags.employed; add(s, "mood", -8); return "三个月后，你的工段也换了机器。一纸通知，二十年的手艺没了去处。"; } }
    ]
  }
);
