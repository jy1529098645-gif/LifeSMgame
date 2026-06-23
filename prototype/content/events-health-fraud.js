"use strict";
/* =====================================================================
 * content/events-health-fraud.js —— 健康暗伤链 + 电诈链（大框架改造·批次7，doc §5.2/§7/§12）
 * ① 健康暗伤链：长期加班 → 胸闷/失眠/胃痛提示 → 是否去医院检查 → 花钱检查 →
 *    小病治疗 or 硬扛恶化 → 严重时住院（强制占用时间和钱）。健康不靠一次休息满血。
 * ② 电诈链（≥4 节点）：投资群/交友认识对方 → 小利益/情绪价值 → 引导加大投入 →
 *    怀疑/调查/报警/继续投钱 → 损失 / 识破 / 牵出反诈创业机会。
 * 电诈概率与「读新闻/投资群/洞察/世界诈骗密度」联动（doc §7.1）。
 * ===================================================================== */

function _hc(s) { if (!s.healthChain) s.healthChain = { stage: 0, symptom: null }; return s.healthChain; }
function _fr(s) { if (!s.fraud) s.fraud = { stage: 0, sunk: 0, kind: null }; return s.fraud; }
function _pi2(s) { return (s.world && s.world.priceIndex) || 1; }
function _scamDensity(s) { try { return (typeof industryState === "function" && industryState(s, "anti_fraud")) ? 50 : 50; } catch (e) { return 50; } }

EVENTS.push(
  /* ===================== 健康暗伤链 ===================== */
  {
    id: "ev_hc_symptom", module: "health", ambient: true, importance: "turning",
    cond: s => _hc(s).stage === 0 && (s.health < 55 || (s._overtimeStreak || 0) >= 3 || s.stress > 70) && (s.age >= 24) && (s.week - (s._hcCd || -99)) >= 12 && rnd(0.3),
    title: "🫀 身体发出的第一封警告信",
    text: s => { const syms = ["胸口时常发闷，半夜会突然憋醒", "连着失眠，躺下脑子却停不下来", "胃总在隐隐作痛，吃什么都不香", "一蹲下站起来就眼前发黑"]; const sym = pick(syms); _hc(s).symptom = sym; return `长期的连轴转，终于在身体上落了痕：${sym}。你安慰自己「年轻，扛得住」，可那种隐隐的不对劲，越来越频繁。要去医院查查吗？`; },
    choices: [
      { label: "去医院做个检查（花钱，但求个安心）", effect: s => { const c = _hc(s); c.stage = 2; s._hcCd = s.week; const cost = Math.round((800 + Math.max(0, s.age - 25) * 30) * _pi2(s)); add(s, "cash", -cost); if (typeof notifyCost === "function") notifyCost(s, cost, "做了全套体检"); if (rnd(0.45)) { c.stage = 3; c.found = true; if (typeof addMemory === "function") addMemory(s, { type: "health_scar", text: `体检查出${c.symptom}背后的小毛病，早发现早治。`, tags: ["health"], intensity: 2 }); return `检查花了 ¥${cost.toLocaleString()}。报告出来，医生指着几项指标皱眉：「有点早期的小毛病，还好来得及，按时吃药、别再熬，能控制住。」你后背一阵发凉——原来身体早就在抗议了。`; } add(s, "mood", 4); return `检查花了 ¥${cost.toLocaleString()}。万幸，大问题没有，医生只叮嘱：「亚健康，作息得改，再这么熬迟早出事。」你松了口气，却也第一次正视：命，是有限的。`; } },
      { label: "硬扛，忍忍就过去了", effect: s => { const c = _hc(s); c.stage = 1; s._hcCd = s.week; add(s, "health", -4); if (typeof bumpThread === "function") bumpThread(s, "health_debt", 18, { status: "open" }); if (typeof addMemory === "function") addMemory(s, { type: "health_scar", text: `身体报警却硬扛，把${c.symptom}拖成了暗伤。`, tags: ["health", "scar"], intensity: 2 }); return "你吞了片止痛药，继续埋头干。症状被暂时压下去了，可那笔健康的账，正在悄悄滚利息——你以为省下了看病钱，其实是赊了未来的命。"; } }
    ]
  },
  {
    id: "ev_hc_worsen", module: "health", ambient: true, importance: "turning",
    cond: s => _hc(s).stage === 1 && (s.week - (s._hcCd || -99)) >= 10 && rnd(0.4),
    title: "🩺 拖出来的大问题",
    text: s => `当初那点「忍忍就好」的小毛病，被你硬生生拖成了大麻烦。一次开会到一半，你眼前一黑，差点栽倒。同事把你架去了医院——这一次，由不得你再扛。`,
    choices: [
      { label: "认了，老实住院治疗", effect: s => { const c = _hc(s); c.stage = 9; s._hcCd = s.week; const cost = Math.round((9000 + Math.max(0, s.age - 25) * 200) * _pi2(s)); add(s, "cash", -cost); add(s, "health", 16); add(s, "stress", -8); if (s.job) s._monthWork = 0; s._hospitalized = true; if (typeof notify === "function") notify(s, { kind: "health", title: `住院花了 ¥${cost.toLocaleString()}`, body: "工作中断大半个月，元气伤了一截。" }); if (typeof rememberFact === "function") rememberFact(s, { id: "hc_hospital", once: true, type: "health_scar", text: `硬扛拖成大病，住院花了 ¥${cost.toLocaleString()}。这一课让你后来对「陪诊/慢病管理」这类生意格外有感觉。`, tags: ["health", "scar", "founder_seed"], intensity: 3 }); if (typeof addFounderPrep === "function") addFounderPrep(s, "productSense", 3); return `住院半个月，花了 ¥${cost.toLocaleString()}，工作也停了。躺在病床上盯着天花板，你第一次认真想：健康没了，挣再多钱给谁花？那些排队三小时、问诊三分钟的荒诞，你也都记下了。`; } }
    ]
  },
  {
    id: "ev_hc_chronic", module: "health", ambient: true, once: true, importance: "normal",
    cond: s => (_hc(s).stage === 3 || (typeof threadLevel === "function" && threadLevel(s, "health_debt") >= 30)) && s.age >= 30 && rnd(0.25),
    title: "💊 它成了甩不掉的慢性病",
    text: s => `那个被查出来的小毛病，终究没能根治，变成了要常年吃药、定期复查的慢性病。它不致命，却像一根细细的针，时时提醒你：你的身体，已经不是可以随便挥霍的本钱了。`,
    choices: [
      { label: "学着和它共处，规律作息", effect: s => { add(s, "health", 3); add(s, "mind", 2); if (s.ailmentIds && !s.ailmentIds.includes("chronic")) s.ailmentIds.push("chronic"); if (typeof rememberFact === "function") rememberFact(s, { type: "health_scar", text: "落下慢性病，学会了与身体讲和。", tags: ["health"], intensity: 2 }); return "你开始按时吃药、戒掉熬夜、随身带着体检报告。日子是麻烦了些，但你也因此活得更清醒——有些代价交过一次，就再也不敢赌第二回。"; } }
    ]
  },

  /* ===================== 电诈链（≥4 节点） ===================== */
  // 节点①：投资群/交友认识「老师」，尝到甜头
  {
    id: "ev_fraud_contact", module: "world", ambient: true, importance: "turning",
    cond: s => _fr(s).stage === 0 && (has(s, "read_news") || s.network >= 20) && (s.week - (s._frCd || -99)) >= 14 && rnd(0.16 + (s.stats && s.stats.insight ? Math.max(0, (40 - s.stats.insight)) * 0.004 : 0)),
    title: "📲 投资群里那位热心的「老师」",
    text: s => `一个不知怎么就被拉进去的「财富自由交流群」里，有位「陈老师」格外热心。他每天发盈利截图、讲宏观大势，还总耐心解答你的问题。这天他私聊你：「看你是个明白人，送你一支内部消息的票，小试一下，别声张。」`,
    choices: [
      { label: "小试一笔，反正钱不多", effect: s => { const c = _fr(s); c.stage = 1; c.kind = "invest"; s._frCd = s.week; if (typeof meetPerson === "function") meetPerson(s, "net_guru", 1, 10); const win = Math.round((3000 + Math.random() * 4000)); add(s, "cash", win); c.sunk = -win; if (typeof notifyMoney === "function") notifyMoney(s, win, "「陈老师」的内部票，居然真赚了"); if (typeof addMemory === "function") addMemory(s, { type: "scammed", text: "在投资群被「陈老师」用一笔小赚钓住了。", tags: ["fraud"], intensity: 2 }); return `你将信将疑地跟了一把，几天后居然真赚了 ¥${win.toLocaleString()}！陈老师笑呵呵：「我说什么来着？跟着老师有肉吃。」尝到甜头的你，对他的话信了七八分——你不知道，这正是钩子上的那块饵。`; } },
      { label: "天上不会掉馅饼，退群", effect: s => { const c = _fr(s); c.stage = 9; s._frCd = s.week; add(s, "insight", 2); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2); if (typeof rememberFact === "function") rememberFact(s, { type: "anti_scam", text: "一眼识破投资群的杀猪盘，果断退群。", tags: ["anti_scam"], intensity: 2 }); return "你太清楚「免费的最贵」。直接退群拉黑。那些盈利截图和热心，你见得多了——韭菜的镰刀，往往裹着最甜的糖衣。"; } }
    ]
  },
  // 节点②：引导加大投入
  {
    id: "ev_fraud_pushin", module: "world", ambient: true, importance: "turning",
    cond: s => _fr(s).stage === 1 && (s.week - (s._frCd || -99)) >= 4 && rnd(0.6),
    title: "💸 「这次机会大，要不要重仓？」",
    text: s => `陈老师又来了，这次口气更热切：「下周有个大行情，平台内部通道，年化翻倍，名额不多。你上次赚的那点是毛毛雨——这波，敢不敢上车？」他甚至「贴心」地教你如何把钱转进那个陌生的「交易平台」。你的心，被那串收益数字撩得发烫。`,
    choices: [
      { label: "重仓押上！富贵险中求", effect: s => { const c = _fr(s); c.stage = 2; s._frCd = s.week; const put = Math.round(Math.min(s.cash > 0 ? s.cash * 0.6 : 0, 80000 * _pi2(s))); add(s, "cash", -put); c.sunk = (c.sunk || 0) + put; if (typeof notifyCost === "function") notifyCost(s, put, "把钱转进了那个「平台」"); if (typeof addMemory === "function") addMemory(s, { type: "scammed", text: `被「大行情」诱惑，把 ¥${put.toLocaleString()} 转进了陌生平台。`, tags: ["fraud"], intensity: 3 }); return `你咬牙把 ¥${put.toLocaleString()} 转了进去。平台后台的数字蹭蹭上涨，浮盈喜人。你盯着那串美丽的数字，幻想着翻倍提现的那天——浑然不觉，提现键已经在悄悄变灰。`; } },
      { label: "等等，先把上次的本提出来再说", effect: s => { const c = _fr(s); c.stage = 3; s._frCd = s.week; add(s, "insight", 1); return "你留了个心眼，提出要先提现。陈老师的回复开始打太极：「系统维护」「手续费」「需要再充值激活」……一连串说辞下，你后背的汗毛竖了起来——不对劲，太不对劲了。"; } }
    ]
  },
  // 节点③：真相逼近——怀疑/调查/报警/继续投钱
  {
    id: "ev_fraud_climax", module: "world", ambient: true, importance: "turning",
    cond: s => (_fr(s).stage === 2 || _fr(s).stage === 3) && (s.week - (s._frCd || -99)) >= 3 && rnd(0.7),
    title: "🚨 提现键，变灰了",
    text: s => { const c = _fr(s); return `当你想把钱拿出来时，灾难降临了：提现失败，客服要你「先缴 20% 保证金解冻」，陈老师的头像也变成了灰色。你账上那 ¥${(c.sunk > 0 ? c.sunk : 50000).toLocaleString()}，连同那个「平台」，正在你眼前蒸发。最后的关头，你怎么选？`; },
    choices: [
      { label: "果断止损 + 报警，保留所有证据", effect: s => { const c = _fr(s); c.stage = 9; s._frCd = s.week; const lost = Math.max(0, c.sunk || 50000); const recover = rnd(0.3) ? Math.round(lost * 0.3) : 0; if (recover) add(s, "cash", recover); flag(s, "fraud_survivor"); add(s, "insight", 4); add(s, "stress", 6); if (typeof addFounderPrep === "function") { addFounderPrep(s, "industryInsight", 6); addFounderPrep(s, "riskTolerance", 5); } if (typeof rememberFact === "function") rememberFact(s, { id: "scammed_big", once: true, type: "scammed", text: `被杀猪盘骗走 ¥${lost.toLocaleString()}${recover ? `（追回 ¥${recover.toLocaleString()}）` : "（血本无归）"}。这个坑让你日后对「反诈/资金安全」的生意，有了别人没有的切肤理解。`, tags: ["scammed", "anti_scam", "founder_seed"], intensity: 4 }); if (typeof notify === "function") notify(s, { kind: "warn", title: "你被电诈了", body: recover ? `损失 ¥${(lost - recover).toLocaleString()}，追回一部分。` : `损失 ¥${lost.toLocaleString()}，报了警。` }); return `你立刻截图、报警、冻结账户。钱大概率是回不来了——${recover ? `警方协助追回了一小部分 ¥${recover.toLocaleString()}，` : "血本无归，"}但你止住了更大的窟窿。被骗的耻辱和愤怒，在你心里烧成了另一种东西：这世上还有多少人正在被这样收割？你盯着那些聊天记录，眼神变了。`; } },
      { label: "再信一次，缴「保证金」搏一把", effect: s => { const c = _fr(s); c.stage = 9; s._frCd = s.week; const more = Math.round(Math.min(s.cash > 0 ? s.cash : 0, 30000 * _pi2(s))); add(s, "cash", -more); const lost = (c.sunk || 50000) + more; add(s, "mood", -16); add(s, "stress", 10); if (typeof bumpThread === "function") bumpThread(s, "family_debt", 14); if (typeof rememberFact === "function") rememberFact(s, { id: "scammed_deep", once: true, type: "scammed", text: `深陷杀猪盘，越陷越深，共损失 ¥${lost.toLocaleString()}。`, tags: ["scammed", "wound"], intensity: 4 }); if (typeof notify === "function") notify(s, { kind: "warn", title: "越陷越深", body: `又投进 ¥${more.toLocaleString()}，全部打了水漂。` }); return `不甘心的你又缴了 ¥${more.toLocaleString()}「保证金」，幻想着解冻提现。然后——所有人都把你拉黑了。共 ¥${lost.toLocaleString()} 灰飞烟灭。你瘫坐在地，这才彻底清醒：贪婪和侥幸，才是骗子真正的帮凶。`; } }
    ]
  },
  // 节点④（回响）：被骗的经历，长成反诈创业机会（doc §5.2/§9.3）
  {
    id: "ev_fraud_antiscam_seed", module: "world", ambient: true, once: true, importance: "turning",
    cond: s => has(s, "fraud_survivor") && !has(s, "startup") && (s.week - (s._frCd || -99)) >= 8 && rnd(0.3),
    title: "🛡️ 从受害者，到想做点什么的人",
    text: s => `被骗之后，你泡进了各种反诈维权群，帮其他受害者出主意、整理证据、对接警方。你越来越熟练，也越来越愤怒——这条黑色产业链养肥了一群人，而普通人几乎赤手空拳。一个念头冒了出来：要不，做个真正能保护普通人的东西？`,
    choices: [
      { label: "记下这个念头：反诈，是门正经事", effect: s => { s._frCd = s.week; flag(s, "got_lead"); flag(s, "opp_antifraud"); if (typeof addFounderPrep === "function") { addFounderPrep(s, "industryInsight", 8); addFounderPrep(s, "productSense", 5); } if (typeof rememberFact === "function") rememberFact(s, { id: "antiscam_calling", once: true, type: "opportunity", text: "被电诈的伤痛，化成了「做反诈/资金安全工具」的创业念头——你比谁都懂受害者要什么。", tags: ["opportunity", "anti_scam", "founder_seed"], intensity: 4 }); return "你把这些天的所见所感记进了备忘录：反诈工具、法律咨询、资金安全……每一个痛点你都亲身淌过。被收割的耻辱，正在发酵成一种少见的东西——一个有血有肉的创业理由。"; } },
      { label: "算了，自己的日子还顾不过来", effect: s => { s._frCd = s.week; add(s, "insight", 2); return "你帮了几个人，便退了出来。生活的重担压着，你没有余力去扛更大的东西。但那段经历，你不会忘——它让你看人、看钱、看风险的眼光，都比从前毒辣了。"; } }
    ]
  }
);
