"use strict";
/* =====================================================================
 * content/events-commute.js —— 迟到-通勤-租房链（大框架改造·批次3，doc §5.2）
 * 住得远 → 通勤长 → 偶发迟到 → 主管提醒 → 再迟到记录 → 绩效受影响 →
 * 提示搬家 → 搬家押金月租 → 迟到风险↓但生活费↑。
 * 一条可串联、逐步升级的事件链，而非反复刷同一句（doc §5.3）。
 *
 * 状态：s.commute = { far, late, warned, perfHit }；s._housing = "near_office" 时通勤≈消失。
 * ===================================================================== */

function _cmt(s) { if (!s.commute) s.commute = { far: false, late: 0, warned: false, perfHit: false }; return s.commute; }
function _moveNearCost(s) { return Math.round(18000 * ((s.world && s.world.priceIndex) || 1)); }
// 搬到公司附近：押一付三、通勤骤减、月房租上涨（被动作与事件复用）
function doMoveNear(s) {
  const cost = _moveNearCost(s);
  add(s, "cash", -cost);
  s._housing = "near_office";
  const c = _cmt(s); c.far = false; c.late = 0; c.warned = false;
  flag(s, "moved_near_office");
  add(s, "mood", 4); add(s, "stress", -3);
  if (typeof notifyCost === "function") notifyCost(s, cost, "押一付三搬到公司附近：通勤骤减、迟到风险大降，但月房租上涨约六成");
  if (typeof rememberFact === "function") rememberFact(s, { id: "moved_near", once: true, type: "work_event", text: "为了不再迟到，你搬到了公司附近——通勤短了，房租贵了。这点痛，后来成了你做「租房/效率工具」的最初由头。", tags: ["housing", "commute"], intensity: 2 });
  if (typeof addFounderPrep === "function") addFounderPrep(s, "productSense", 3);   // 通勤之痛 → 痛点意识（回流创业，doc §13.2）
  return cost;
}

const _moveChoice = {
  label: "💸 押一付三，搬到公司附近（约 ¥18000，月房租↑）",
  effect: s => { const cost = doMoveNear(s); return `你咬牙交了押一付三、共 ¥${cost.toLocaleString()}，搬进了公司步行可达的小屋。窗外就是写字楼的灯，通勤从一个多小时缩到十分钟——再不必为那班永远挤不上的地铁心惊肉跳。代价是每月房租肉眼可见地涨了一截。`; }
};

EVENTS.push(
  // 节点①：住得远，通勤开始折磨人
  {
    id: "ev_commute_far", module: "career", ambient: true, once: true, importance: "normal",
    cond: s => !!s.job && !has(s, "moved_near_office") && (!s.commute || !s.commute.far) && (s.week - (s._jobSinceWk || 0)) >= 3 && rnd(0.5),
    title: "🚇 通勤一个多小时",
    text: s => `入职没多久你就尝到了苦头：为了省房租，你住在城市的另一头。每天天没亮就出门，挤两趟地铁换一趟公交，到工位时衬衫已经湿透。一来一回三个钟头，像被生活提前榨干。`,
    choices: [
      { label: "忍着，年轻人挤挤地铁怕什么", effect: s => { const c = _cmt(s); c.far = true; if (typeof recordBeat === "function") recordBeat(s, "first_commute"); if (typeof addMemory === "function") addMemory(s, { type: "work_event", text: "为省房租住得远，每天通勤三小时。", tags: ["commute"], intensity: 1 }); return "你说服自己：忍忍就过去了，省下的房租是实打实的钱。只是每天醒来第一件事就是看时间，那种被通勤追着跑的紧绷，悄悄爬上了你的眉头。"; } },
      _moveChoice
    ]
  },
  // 节点②：偶发迟到，主管当面提醒
  {
    id: "ev_commute_late1", module: "career", ambient: true, importance: "normal",
    cond: s => !!s.job && s.commute && s.commute.far && !s.commute.warned && (s.week - (s._lastCommuteEv || -99)) >= 6 && rnd(0.4),
    title: "⏰ 又迟到了",
    text: s => `地铁故障，你被堵在隧道里动弹不得。赶到公司时晨会已经开了一半，所有人的目光齐刷刷扫过来。主管没当场发火，只是淡淡一句：「下次早点出门。」——可你听得懂那句话背后的分量。`,
    choices: [
      { label: "诚恳道歉，明天起提前一小时出门", effect: s => { const c = _cmt(s); c.late = (c.late || 0) + 1; c.warned = true; s._lastCommuteEv = s.week; add(s, "stress", 4); add(s, "mood", -3); if (typeof notify === "function") notify(s, { kind: "work", title: "出勤记录 +1 条「迟到」", body: "主管嘴上没说什么，绩效本上却记了一笔。" }); if (typeof addMemory === "function") addMemory(s, { type: "work_event", text: "因通勤迟到被主管当众提醒。", tags: ["commute", "late"], intensity: 2 }); return "你连声道歉，第二天起把闹钟拨早了一小时。睡眠又被通勤偷走一块，但你不敢再赌地铁的脸色。"; } },
      _moveChoice
    ]
  },
  // 节点③：再迟到被记录，绩效受影响 → 系统强力提示搬家
  {
    id: "ev_commute_late2", module: "career", ambient: true, importance: "turning",
    cond: s => !!s.job && s.commute && s.commute.far && s.commute.warned && !s.commute.perfHit && (s.week - (s._lastCommuteEv || -99)) >= 6 && rnd(0.45),
    title: "📉 迟到进了绩效记录",
    text: s => `这个月你又迟到了两回。这次主管没再找你谈，而是直接在季度绩效里写下「出勤不稳定」。同组那个住得近的同事最近风头正盛，你却因为每天那三小时的通勤，一点点被消耗、被边缘化。要不要……搬到公司附近？`,
    choices: [
      _moveChoice,
      { label: "硬扛：房租太贵，绩效差就差点", effect: s => { const c = _cmt(s); c.perfHit = true; s._lastCommuteEv = s.week; if (s.job) s.job._raise = Math.max(-0.3, (s.job._raise || 0) - 0.08); add(s, "mood", -6); add(s, "stress", 6); if (typeof bumpThread === "function") bumpThread(s, "career_margin", 20, { status: "open" }); if (typeof notify === "function") notify(s, { kind: "warn", title: "绩效受损：出勤不稳定", body: "涨薪无望，还被排到了边缘。" }); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "为省房租死扛远通勤，绩效被记「出勤不稳定」，眼睁睁被边缘化。", tags: ["commute", "grudge"], intensity: 2 }); if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 2); return "你算了笔账：搬家一年多花的钱，够你心疼好久。于是你选择硬扛——代价是涨薪没了指望，那个住得近的同事踩着你的迟到记录，先一步升了职。这口气，你记下了。"; } }
    ]
  }
);

// —— 主动搬家行动：不必等事件，玩家随时可选（成本前置展示，doc §3.4）——
actions.push({
  id: "move_near_office", name: "搬到公司附近", emoji: "🏠", hours: 16, anyStage: true,
  desc: "押一付三搬到公司步行可达的地方。通勤骤减、迟到风险大降，但月房租明显上涨。",
  hint: "💸押一付三约¥18000　🚇通勤↓迟到↓　🏠月房租↑约六成",
  require: s => !!s.job && s._housing !== "near_office",
  resolve: s => ({ event: "ev_move_near_office" })
});
EVENTS.push({
  id: "ev_move_near_office", module: "career", title: "🏠 搬到公司附近？",
  text: s => `你打开租房软件，筛出公司步行可达的房子。押一付三大约 ¥${_moveNearCost(s).toLocaleString()}，月租比现在贵不少。但想到每天能多睡一个多小时、再不必和地铁赛跑……值不值，你得自己定。`,
  choices: [
    _moveChoice,
    { label: "再忍忍，钱要花在刀刃上", effect: s => "你关掉软件。省下的是钱，搭进去的是每天三个钟头和一身疲惫——这笔账，你暂时还算得过来。" }
  ]
});
