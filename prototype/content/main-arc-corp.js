"use strict";
/* =====================================================================
 * content/main-arc-corp.js —— 大厂燃尽转创业线
 * 主题：从系统零件变成老板，是否真的自由。
 * 社会摩擦：履历能打开门，但不能替你活下去。
 * 关键变量：互联网裁员、AI 热潮、资本寒冬、平台监管。
 * ===================================================================== */
registerMainArc("corp_burnout", {
  name: "大厂燃尽转创业线",
  theme: "从系统的零件，到自己的老板——自由是真的，还是另一种枷锁？",
  friction: "履历能打开门，但不能替你活下去。",
  weight: 1,   // 兜底主线：野心向目标默认走这条
  worldKeys: ["ai", "layoff", "capital", "platform_policy"],
  industries: ["ai", "content"],
  startCond: s => !["peace", "family", "married", "kid"].includes(s.goal),   // 兜底主线：非「安稳/家庭」向的人生默认走职场→创业这条脊柱
  initCast: s => {
    addCastMember(s, "manager", { name: "周磊", role: "直属领导", industry: "ai", trust: 50, pressure: 60 });
    addCastMember(s, "rival", { name: "苏蔓", role: "同期对手", industry: "ai", trust: 40, ambition: 80 });
    addCastMember(s, "cofounder", { name: "老钱", role: "未来合伙人", industry: "ai", trust: 55, ambition: 70 });
    addCastMember(s, "vc", { name: "陈总", role: "投资人", industry: "capital", trust: 35 });
  },
  acts: [
    { evid: "marc_corp_1", minAge: 18, title: "工牌还没焐热" },
    { evid: "marc_corp_2", minAge: 25, title: "螺丝钉的觉醒" },
    { evid: "marc_corp_3", minAge: 31, title: "递交辞呈" },
    { evid: "marc_corp_4", minAge: 38, title: "账本与底线" },
    { evid: "marc_corp_5", minAge: 46, title: "你重新定义了这条赛道" }
  ],
  reckon: s => {
    const founded = arcChose(s, "corp_leave");
    const sold = arcChose(s, "corp_sold_out");
    if (sold) return "你最终把公司卖了个好价钱，财务自由地退场。只是深夜偶尔会想起，当初递辞呈那天，自己究竟想做的是什么。成功了，却空了一块。";
    if (founded && has(s, "startup_done")) return "你从大厂的格子间走出来，亲手搭起又亲手送走一家公司。赢也好、输也罢，你终于不再是别人 KR 里的一个数字。";
    return "你没能挣脱那张工牌，35 岁的坎像预言一样应验。但你养活了家、守住了底线——平凡地燃尽，也是一种活法。";
  }
});

EVENTS.push(
  {
    id: "marc_corp_1", module: "mainarc", importance: "arc", arc: "corp_burnout",
    title: "📖 第一幕 · 工牌还没焐热",
    text: s => `入职第一天，${castName(s, "manager", "周磊")}把工牌挂到你脖子上：「欢迎上车。」工位崭新，显示器很大，offer 上的数字让你觉得未来一片光明。隔壁同期的${castName(s, "rival", "苏蔓")}已经在加班了。`,
    choices: [
      { label: "把命押在这块工牌上，all in 往上爬", effect: s => { arcChoose(s, "corp_climb", { tension: 8, memory: { id: "corp_allin", intensity: 50, text: "你决定把青春押给这家公司。" } }); add(s, "knowledge", 2); add(s, "stress", 6); if (typeof addExperience === "function") addExperience(s, "bigtech"); return "你给自己定了个目标：三年升两级。从这天起，公司的灯总有一盏为你亮着。"; } },
      { label: "上班是上班，生活是生活", effect: s => { arcChoose(s, "corp_balance", { tension: -2 }); add(s, "mood", 4); return "你把工牌当成一份合同，而不是一种信仰。同事觉得你佛，你觉得自己清醒。"; } },
      { label: "悄悄观察：这地方能学到什么、认识谁", effect: s => { arcChoose(s, "corp_scout", { tension: 2, memory: { id: "corp_scout", intensity: 30, text: "你从第一天起就在为「将来不在这」做准备。" } }); add(s, "insight", 2); return "你一边干活一边记账：谁有真本事、哪条业务赚钱、风往哪吹。这些，迟早用得上。"; } }
    ]
  },
  {
    id: "marc_corp_2", module: "mainarc", importance: "arc", arc: "corp_burnout",
    title: "📖 第二幕 · 螺丝钉的觉醒",
    text: s => { const m = castName(s, "manager", "周磊"); return `这些年你成了能打的人，可天花板也清晰起来。${m}私下提醒你：「上面只有那么几个坑，35 岁是道坎。」AI 来了，组里一半的活开始被工具替代。${castName(s, "rival", "苏蔓")}升了，你还在原地。`; },
    choices: [
      { label: "继续卷，赌自己是留下的那个", effect: s => { arcChoose(s, "corp_grind2", { tension: 6 }); add(s, "stress", 9); add(s, "health", -3); if (s.job) s.job._raise = (s.job._raise || 0) + 0.04; if (typeof addInfluence === "function") addInfluence(s, "circle", 3); return "你把自己拧到极限，绩效漂亮，可那种「随时可被替换」的凉意，再没散去。"; } },
      { label: "用业余时间偷偷练一门真本事", effect: s => { arcChoose(s, "corp_prep", { tension: 3, memory: { id: "corp_moonlight", intensity: 40, text: "你在下班后悄悄攒着离开的底气。" } }); add(s, "knowledge", 3); add(s, "insight", 2); add(s, "stress", 4); if (typeof addFounderPrep === "function") { addFounderPrep(s, "productSense", 14); addFounderPrep(s, "industryInsight", 10); } return "夜里两点，你在学公司不会教你的东西。你心里那个「不在这」的念头，长出了根。"; } },
      { label: "和直属领导交心，看看有没有别的路", effect: s => { const m = castName(s, "manager", "周磊"); bumpThread(s, "mentor_bond", 12, { actors: ["manager"] }); arcChoose(s, "corp_mentor", { tension: -2 }); add(s, "mood", 3); return `${m}没给你画饼，只说了句实话：「想自由，就得自己扛风险。我当年也想过，没敢。」这句话你记了很久。`; } }
    ]
  },
  {
    id: "marc_corp_3", module: "mainarc", importance: "turning", arc: "corp_burnout",
    title: "📖 第三幕 · 递交辞呈",
    text: s => `${castName(s, "cofounder", "老钱")}找上门：「我有个方向，缺个能扛事的合伙人。」窗外是熟悉的园区，你摸了摸胸前那张焐了多年的工牌。走，还是留？`,
    choices: [
      { label: "递辞呈，和合伙人干一票大的", cond: s => true, effect: s => { const cf = castName(s, "cofounder", "老钱"); arcChoose(s, "corp_leave", { tension: 14, memory: { id: "corp_resign", intensity: 70, text: "你交出工牌那天，手心全是汗。", tags: ["arc", "turning"] } }); flag(s, "startup_exp"); if (typeof addExperience === "function") addExperience(s, "founder"); delete s.flags.employed; s.job = null; s.workScene = null; add(s, "mood", 8); add(s, "stress", 10); bumpThread(s, "cofounder_pact", 20, { actors: ["cofounder"], status: "open" }); s.timeline.push({ age: s.age, text: `你辞职了，和${cf}凑钱开了公司。没有了大厂的光环，也没有了它的兜底——从今天起，亏的赚的都是自己的。` }); return `你把工牌轻轻放在桌上，转身走出园区。阳光有点刺眼。和${cf}的公司，今天开张。`; } },
      { label: "留下，稳稳当当熬到退休", effect: s => { arcChoose(s, "corp_stay", { tension: -6 }); add(s, "mood", -2); add(s, "stress", -3); return "你婉拒了。风险太大，房贷太实。你选择继续做那颗拧得很紧的螺丝钉——至少它还在转。"; } }
    ]
  },
  {
    id: "marc_corp_4", module: "mainarc", importance: "turning", arc: "corp_burnout",
    title: "📖 第四幕 · 账本与底线",
    cond: s => arcChose(s, "corp_leave"),
    text: s => { const vc = castName(s, "vc", "陈总"); const cold = s.world && s.world.windHeat < 40; return `公司活到了今天，但账上的钱只够再撑几个月。${vc}愿意追投，条件是：数据要「好看」，灰色地带的增长也得算进去。${cold ? "资本寒冬里，这可能是唯一的钱。" : ""}合伙人${castName(s, "cofounder", "老钱")}在等你拍板。`; },
    choices: [
      { label: "守住底线，宁可慢、不掺水", effect: s => { arcChoose(s, "corp_clean", { tension: 8, memory: { id: "corp_integrity", intensity: 55, text: "你拒绝了灌水的增长，哪怕代价是钱。" } }); if (typeof addInfluence === "function") addInfluence(s, "industry", 6); add(s, "reputation", 5); if (typeof addStigma === "function") {} add(s, "cash", -Math.round(20000 * (s.world ? s.world.priceIndex : 1))); return "你把那份「美化版」数据推了回去。融资黄了一半，但团队知道你是个能信的人。慢就慢吧。"; } },
      { label: "数据做漂亮点，先活下去再说", effect: s => { const got = (typeof bigWindfall === "function") ? bigWindfall(s, 300000) : 800000; add(s, "cash", got); arcChoose(s, "corp_inflate", { tension: 12, memory: { id: "corp_gray", intensity: 60, text: "为了活下去，你在数据上动了手脚。", tags: ["arc", "stigma"] } }); if (typeof addStigma === "function") addStigma(s, "gray_suspect"); if (typeof addFounderPrep === "function") addFounderPrep(s, "moralDebt", 22); bumpThread(s, "founder_guilt", 18); if (typeof addInfluence === "function") addInfluence(s, "capital", 8); return `融资到账 ¥${got.toLocaleString()}。公司活过来了，可那条你曾发誓不碰的线，已经在脚后跟了。`; } },
      { label: "（影响力够）推动行业自律，把规则掀桌重写", cond: s => (typeof influenceTier === "function" && influenceTier(s) >= 3), effect: s => { arcChoose(s, "corp_reshape", { tension: 16, memory: { id: "corp_rule", intensity: 80, text: "你不再只是玩家，你开始改写赛道的规则。", tags: ["arc", "world"] } }); if (typeof addInfluence === "function") { addInfluence(s, "industry", 10); addInfluence(s, "policy", 8); } if (typeof addWorldImpact === "function") addWorldImpact(s, { industry: "ai", field: "regulation", delta: 12, note: "你推动的行业自律抬高了门槛" }); add(s, "reputation", 8); return "你联合几家头部，把「数据造假出局」写进了行业公约。你掀翻了那张牌桌——有人鼓掌，也有人开始恨你。"; } }
    ]
  },
  {
    id: "marc_corp_5", module: "mainarc", importance: "turning", arc: "corp_burnout",
    title: "📖 第五幕 · 你重新定义了这条赛道",
    cond: s => arcChose(s, "corp_leave"),
    text: s => { const reshaped = arcChose(s, "corp_reshape"); return reshaped ? `多年后回头看，这条赛道因你而不同。新入场的人按你定的规矩办事，老对手${castName(s, "rival", "苏蔓")}在饭局上举杯：「你赢了。」可你清楚，规则一旦立起，第一个被它框住的，往往是立规则的人。` : `公司走到了一个该做决断的路口：有人开价收购，有人劝你赌一把上市，也有人只想让它平稳地老去。`; },
    choices: [
      { label: "把公司卖个好价，体面退场", effect: s => { const got = (typeof bigWindfall === "function") ? bigWindfall(s, 2000000) : 6000000; add(s, "cash", got); arcChoose(s, "corp_sold_out", { tension: -10 }); flag(s, "startup_done"); if (typeof addExperience === "function") addExperience(s, "listed_company"); if (typeof addInfluence === "function") addInfluence(s, "capital", 6); s.timeline.push({ age: s.age, text: `你把公司卖了 ¥${got.toLocaleString()}。财务自由了，办公室的灯第一次为别人亮。` }); return `交割完成，到账 ¥${got.toLocaleString()}。你站在空了的办公室里，自由得有点不知所措。`; } },
      { label: "赌一把,带它冲到台前", effect: s => { const win = rnd(0.45 + (typeof luckBias === "function" ? luckBias(s) : 0)); if (win) { const got = (typeof bigWindfall === "function") ? bigWindfall(s, 8000000) : 30000000; add(s, "cash", got); flag(s, "startup_done"); flag(s, "chase_ipo"); if (typeof addInfluence === "function") { addInfluence(s, "industry", 12); addInfluence(s, "media", 10); } if (typeof addExperience === "function") addExperience(s, "listed_company"); arcChoose(s, "corp_triumph", { tension: 6 }); s.timeline.push({ age: s.age, text: `公司站上了台前，你的身价 ¥${got.toLocaleString()}。当年那张工牌，如今挂在你公司的展厅里。` }); return `钟声响起。你从一颗螺丝钉，变成了别人简历上想写的那家公司。代价是,你再也回不去那个能按时下班的人了。`; } add(s, "cash", -Math.max(0, Math.round((s.cash || 0) * 0.6))); flag(s, "startup_done"); flag(s, "been_bankrupt"); if (typeof addScar === "function") addScar(s, "bankrupt"); arcChoose(s, "corp_bust", { tension: 14 }); s.timeline.push({ age: s.age, text: "最后一搏失败了。公司清盘，你回到了起点，只是这次连工牌都没有了。" }); return "你赌输了。市场没给你第二次机会，公司清盘。但你试过——这是大多数人一辈子不敢做的事。"; } }
    ]
  }
);
