"use strict";
/* =====================================================================
 * content/events-backlash.js —— 世界反噬事件（升级·三期）
 * 设计原则：玩家达到行业/城市/时代级影响力、并真的改写过世界(world.impacts)后，
 * 必然招来反噬——灰产反扑、同行维权、监管约谈、舆论翻车。成功不能只有爽。
 * 这些是 ambient + once，cond 严格(influenceTier>=3 且 改过世界)，不会刷屏。
 * ===================================================================== */
function _hasImpact(s) { return !!(s.world && s.world.impacts && s.world.impacts.length); }
function _bigShot(s) { return (typeof influenceTier === "function" && influenceTier(s) >= 3) && _hasImpact(s); }
function _piCost(s, base) { return Math.round(base * (s.world ? s.world.priceIndex : 1)); }

EVENTS.push(
  {
    id: "ev_backlash_gray", module: "world", ambient: true, once: true, importance: "turning",
    cond: s => _bigShot(s) && (s.world.impacts.some(im => im.industry === "anti_fraud") || (typeof profileHas === "function" && profileHas(s, "workHistory", "founder"))),
    title: "🕳️ 灰产的反扑",
    text: s => `你把行业搅得天翻地覆，断了一些人的财路。这天，一条匿名信息发到你手机：你的家庭住址、孩子的学校，一字不差。「适可而止」，落款只有一个骷髅符号。`,
    choices: [
      { label: "报警 + 公开曝光，硬刚到底", effect: s => { add(s, "stress", 12); if (typeof addInfluence === "function") { addInfluence(s, "media", 8); addInfluence(s, "policy", 6); } if (typeof bumpThread === "function") bumpThread(s, "underworld_feud", 30, { status: "war" }); add(s, "reputation", 6); return "你把威胁信甩到了公众面前，警方介入。你赢了舆论，也把自己彻底架在了火上——从此出门得看两眼身后。"; } },
      { label: "花钱消灾，私下摆平", effect: s => { const c = _piCost(s, 300000); add(s, "cash", -c); add(s, "mood", -8); if (typeof addStigma === "function") addStigma(s, "gray_suspect"); return `你托人递了 ¥${c.toLocaleString()} 过去，事情暂时压下了。可你清楚，喂过一次的狼，还会再来。`; } },
      { label: "举家迁走，惹不起躲得起", cond: s => (s.cash || 0) > 0, effect: s => { add(s, "cash", -_piCost(s, 150000)); add(s, "network", -12); add(s, "mood", -4); flag(s, "fled_threat"); return "你连夜安排家人换了城市。事业的版图缩了一块，但至少，孩子上学的路上不再有人盯梢。"; } }
    ]
  },
  {
    id: "ev_backlash_peers", module: "world", ambient: true, once: true, importance: "arc",
    cond: s => _bigShot(s) && s.world.impacts.some(im => ["food", "manufacturing", "cross_border", "content"].includes(im.industry)),
    title: "⚔️ 同行的围剿",
    text: s => `你的打法把价格打穿了地板，活儿是你的了，可整条街的同行被你逼到墙角。一纸联名举报递到了监管那里，行业群里全是你的"黑料"。`,
    choices: [
      { label: "召集同行,牵头定个行业规矩", cond: s => (typeof influenceTier === "function" && influenceTier(s) >= 3), effect: s => { if (typeof addInfluence === "function") { addInfluence(s, "industry", 10); addInfluence(s, "city", 6); } if (typeof addWorldImpact === "function") addWorldImpact(s, { industry: (s.world.impacts[0] || {}).industry || "food", field: "margin", delta: 6, note: "你牵头的行业自律稳住了利润" }); add(s, "reputation", 8); return "你没有赶尽杀绝，反而把对手拉到一张桌上，定了个大家都能活的规矩。从「价格屠夫」到「行业话事人」，你完成了转身。"; } },
      { label: "继续碾压,把对手全熬死", effect: s => { add(s, "cash", _piCost(s, 200000)); add(s, "reputation", -10); if (typeof bumpThread === "function") bumpThread(s, "peer_war", 25, { status: "war" }); add(s, "stress", 10); return "你寸步不让，又熬死了几家。市场的份额更大了，可「心狠」的名声也钉死了——往后没人敢跟你合作，只敢防着你。"; } }
    ]
  },
  {
    id: "ev_backlash_regulator", module: "world", ambient: true, once: true, importance: "turning",
    cond: s => _bigShot(s) && s.world.impacts.some(im => im.field === "regulation" || im.industry === "ai"),
    title: "📑 监管的约谈",
    text: s => `你把行业的规则改了，惊动了上面。一纸函件请你"喝茶"——既是肯定你的影响力，也是提醒你别忘了头顶有天。会议室里，几位面孔很严肃。`,
    choices: [
      { label: "主动配合，把自己变成自己人", effect: s => { if (typeof addInfluence === "function") { addInfluence(s, "policy", 12); } add(s, "reputation", 4); add(s, "stress", 5); flag(s, "policy_insider"); return "你递上了详尽的合规方案，姿态放得很低。约谈变成了合作——你拿到了别人拿不到的牌照与话语权，代价是从此戴着镣铐跳舞。"; } },
      { label: "据理力争,守住自己的盘子", effect: s => { const win = rnd(0.4 + (typeof statEdge === "function" ? statEdge(s, "strategy") : 0)); add(s, "stress", 10); if (win) { if (typeof addInfluence === "function") addInfluence(s, "industry", 6); add(s, "reputation", 5); return "你引经据典、有理有据，对面竟被你说动了几分。这一关你扛了过来——但名字已经被记在了某个本子上。"; } add(s, "cash", -_piCost(s, 400000)); if (typeof addWorldImpact === "function") addWorldImpact(s, { industry: "ai", field: "regulation", delta: 10, note: "针对你的监管收紧了" }); return `你顶了回去，换来一纸罚单 ¥${_piCost(s, 400000).toLocaleString()} 和更严的盯防。出头的椽子，先烂。`; } }
    ]
  },
  {
    id: "ev_era_figure", module: "world", ambient: true, once: true, importance: "turning",
    cond: s => (typeof influenceTier === "function" && influenceTier(s) >= 4),
    title: "🌟 时代人物的分量",
    text: s => `你已经不只是某个行业、某座城市的人物——你的一句话，能上热搜；你的一个决定，能拨动一个产业的方向。极少数人能走到这一步。站在这个高度，你要拿这份分量做什么？`,
    choices: [
      { label: "推动一件利在长远的大事", effect: s => { if (typeof addInfluence === "function") { addInfluence(s, "policy", 10); addInfluence(s, "media", 8); } if (typeof addWorldImpact === "function") { addWorldImpact(s, { industry: "education", field: "scamDensity", delta: -12, note: "你推动的行业净化" }); addWorldImpact(s, { industry: "anti_fraud", field: "heat", delta: 10, note: "你倡导的社会议题" }); } add(s, "reputation", 12); if (typeof addMemory === "function") addMemory(s, { id: "era_legacy", intensity: 90, text: "你用一生攒下的分量，推动了一件超出自己的事。", tags: ["world", "legacy"] }); s.timeline.push({ age: s.age, text: "你动用全部影响力，推动了一项影响深远的改变。历史会记得这一笔——无论后人如何评说。" }); return "你把这份分量押在了一件超出个人得失的事上。有人称你为时代的良心，也有人说你在沽名钓誉。但那件事，确实因你而不同了。"; } },
      { label: "树大招风，急流勇退", effect: s => { if (typeof addInfluence === "function") { addInfluence(s, "media", -15); } add(s, "mood", 8); add(s, "stress", -10); flag(s, "stepped_back"); return "你主动淡出了聚光灯，把舞台让了出去。盛极必衰的道理，你比谁都懂。守得住的人，才走得远——你选择了体面地谢幕。"; } }
    ]
  },
  {
    id: "ev_backlash_media", module: "world", ambient: true, once: true, importance: "turning",
    cond: s => (typeof influenceTier === "function" && influenceTier(s) >= 3) && (s.influence && (s.influence.media || 0) >= 40),
    title: "📺 舆论的反噬",
    text: s => `你成了公众人物，一举一动都被放大。一句多年前的旧话被翻出来断章取义，词条冲上热搜，曾经捧你的人，此刻骂得最凶。`,
    choices: [
      { label: "真诚道歉 + 拿出行动", effect: s => { const ok = rnd(0.5 + (typeof socialAccess === "function" ? (socialAccess(s, "elite_circle") - 50) / 300 : 0)); add(s, "stress", 8); if (ok) { add(s, "reputation", 4); if (typeof addInfluence === "function") addInfluence(s, "media", 4); return "你没有狡辩，认了、改了、做了。风波慢慢平息——大众健忘，但记得住「还算体面」的那几个。"; } add(s, "reputation", -8); if (typeof addInfluence === "function") addInfluence(s, "media", -10); return "道歉被解读成「心虚」，越描越黑。你第一次尝到了被自己捧起来的浪头，反手拍下去的滋味。"; } },
      { label: "冷处理,任它自己平息", effect: s => { add(s, "mood", -6); if (typeof bumpThread === "function") bumpThread(s, "public_scandal", 20); if (typeof addStigma === "function") addStigma(s, "lawsuit"); return "你选择沉默。热度过了，但「那个出事的人」成了你甩不掉的标签，留在了每一次被搜索的结果里。"; } }
    ]
  }
);
