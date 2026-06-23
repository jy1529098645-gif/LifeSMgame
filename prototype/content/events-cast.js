"use strict";
/* =====================================================================
 * content/events-cast.js —— 关键角色(cast)的人生（升级·六期）
 * cast 成员不只是社交资源，他们也活在这个世界里：所在行业遇冷会涨压力，
 * 高压久了会陷入危机(tickCast 写 c.crisis)。这里据此让他们【反过来】找上你：
 * 借钱求助 / 拉你合伙 / 久别复合 / 反目背叛。让 NPC 像有自己人生的人。
 * cond 读 castWithCrisis(s)；resolve 后 clearCrisis 收尾。
 * ===================================================================== */
function _castDebt(s) { return (typeof castWithCrisis === "function") && (castWithCrisis(s, "debt") || castWithCrisis(s, "illness")); }
function _castInvite(s) { return (typeof castWithCrisis === "function") && castWithCrisis(s, "startup_invite"); }
function _castName(s, c) { return (c && c.name) || "一个老熟人"; }
function _castRole(s, c) { return (c && c.role) || "故人"; }

EVENTS.push(
  {
    id: "ev_cast_help", module: "relation", ambient: true, importance: "scene",
    cond: s => !!_castDebt(s) && s.age >= 22,
    title: "📞 深夜的求助电话",
    text: s => { const c = _castDebt(s); const why = c.crisis === "illness" ? "家里人病了，等着钱救命" : "公司黄了、欠了一屁股债，债主堵了门"; return `半夜，${_castName(s, c)}（你的${_castRole(s, c)}）打来电话，声音抖得厉害：「我实在没办法了才找你……${why}。能不能……先借我点？」电话那头，是多年的交情，和一个你给不起也拒不下的数目。`; },
    choices: [
      { label: "倾力相助，借一笔给ta", effect: s => { const c = _castDebt(s); const amt = Math.round((c.crisis === "illness" ? 80000 : 120000) * (s.world ? s.world.priceIndex : 1)); add(s, "cash", -Math.min(s.cash > 0 ? s.cash : 0, amt)); if (c) { c.trust = Math.min(100, (c.trust || 50) + 20); } if (typeof bumpThread === "function") bumpThread(s, "owed_by_" + (c.id || "npc"), 20, { actors: [c.id] }); if (typeof addMemory === "function") addMemory(s, { id: "helped_" + (c.id || "npc"), type: "kindness", intensity: 55, text: `你在${_castName(s, c)}最难的时候，伸了手。`, tags: ["relation"] }); if (typeof clearCrisis === "function") clearCrisis(c); add(s, "mood", 4); return `你把钱打了过去。${_castName(s, c)}在电话那头哭了。钱能不能还回来不好说，但这份情，ta记下了——患难时拉一把，比什么都重。`; } },
      { label: "量力而行，给一点心意", effect: s => { const c = _castDebt(s); add(s, "cash", -Math.round(15000 * (s.world ? s.world.priceIndex : 1))); if (c) c.trust = Math.min(100, (c.trust || 50) + 6); if (typeof clearCrisis === "function") clearCrisis(c); return `你转了笔不大不小的数，附了句「先应应急」。帮是帮了，但你们都心知肚明：这只是杯水车薪。`; } },
      { label: "婉拒——自己也难", effect: s => { const c = _castDebt(s); if (c) c.trust = Math.max(0, (c.trust || 50) - 18); if (typeof bumpThread === "function") bumpThread(s, "rift_" + (c.id || "npc"), 18, { actors: [c.id], status: "open" }); if (typeof clearCrisis === "function") clearCrisis(c); add(s, "mood", -4); return `你斟酌着说了句「最近手头也紧」。电话那头沉默了几秒，「……没事，打扰了。」从此，你们之间多了一道说不清的隔阂。`; } }
    ]
  },
  {
    id: "ev_cast_invite", module: "relation", ambient: true, importance: "scene",
    cond: s => !!_castInvite(s) && s.age >= 24 && !(s.startup && s.startup.fulltime),
    title: "🤝 拉你入伙的邀约",
    text: s => { const c = _castInvite(s); const ind = (c.industry && typeof INDUSTRIES !== "undefined" && INDUSTRIES[c.industry]) ? INDUSTRIES[c.industry].name : "一个正当风口的方向"; return `${_castName(s, c)}约你喝酒，几杯下肚，掏出了酝酿已久的计划：「${ind}这波是真机会，我缺个信得过的合伙人。跟我干吧——成了，咱们都翻身。」ta眼里有光，那是你久违的、属于创业者的光。`; },
    choices: [
      { label: "心动，跟ta搏一把", cond: s => !has(s, "startup_done"), effect: s => { const c = _castInvite(s); flag(s, "startup_exp"); flag(s, "cofounder_pact"); if (typeof addFounderPrep === "function") { addFounderPrep(s, "teamTrust", 18); addFounderPrep(s, "riskTolerance", 10); } if (typeof addExperience === "function") addExperience(s, "founder"); if (c) c.trust = Math.min(100, (c.trust || 50) + 12); if (typeof bumpThread === "function") bumpThread(s, "partner_pact", 18, { actors: [c.id], status: "open" }); if (typeof clearCrisis === "function") clearCrisis(c); add(s, "stress", 6); add(s, "mood", 8); s.timeline.push({ age: s.age, text: `你和${_castName(s, c)}合伙创业了。前路未卜，但身边有个信得过的人，胆气就壮了几分。` }); return `你们碰了杯，把后路喝没了。从今往后，多了一个并肩作战的人，也多了一份要为彼此负责的重量。`; } },
      { label: "看好但不亲自下场，投点钱", cond: s => (s.cash || 0) > 100000, effect: s => { const c = _castInvite(s); const bet = Math.round(80000 * (s.world ? s.world.priceIndex : 1)); add(s, "cash", -bet); s._pendingBets = s._pendingBets || []; s._pendingBets.push({ tk: (c.industry || "ta的项目"), bet: bet, ret: Math.round(bet * (0.4 + Math.random() * 1.8)), due: s.week + 52 }); if (c) c.trust = Math.min(100, (c.trust || 50) + 8); if (typeof clearCrisis === "function") clearCrisis(c); return `你没下场，但押了 ¥${bet.toLocaleString()} 当天使投资。成了你也有份，黄了就当交个朋友——这点分寸，成年人都懂。`; } },
      { label: "婉拒，劝ta也想清楚", effect: s => { const c = _castInvite(s); if (c) c.trust = Math.max(0, (c.trust || 50) - 6); if (typeof clearCrisis === "function") clearCrisis(c); add(s, "insight", 1); return `你诚恳地泼了盆冷水。ta有点失望，但也许哪天会感谢你今天的清醒。风口上的故事，听着都美，活下来的没几个。`; } }
    ]
  },
  {
    id: "ev_cast_reunite", module: "love", ambient: true, importance: "scene",
    cond: s => (typeof castWithCrisis === "function") && !!castWithCrisis(s, "reunite") && !has(s, "married"),
    title: "🌙 旧人重逢",
    text: s => { const c = castWithCrisis(s, "reunite"); return `多年以后，${_castName(s, c)}又出现在你的生活里。一句「最近还好吗」，把那些以为早就翻篇的回忆又翻了出来。ta 眼里的犹豫和期待，你都看得懂。`; },
    choices: [
      { label: "再给彼此一次机会", effect: s => { const c = castWithCrisis(s, "reunite"); if (c) { c.trust = Math.min(100, (c.trust || 50) + 25); c.role = "伴侣"; } flag(s, "partner"); s.partnerName = c ? c.name : s.partnerName; add(s, "mood", 10); if (typeof clearCrisis === "function") clearCrisis(c); if (typeof addMemory === "function") addMemory(s, { id: "reunite", intensity: 60, text: `你和${c ? c.name : "旧人"}破镜重圆。`, tags: ["love"] }); return `你们决定不再错过。兜兜转转，原来最舒服的还是彼此。这一次，你想好好握住。`; } },
      { label: "过去的就让它过去吧", effect: s => { const c = castWithCrisis(s, "reunite"); if (c) c.trust = Math.max(0, (c.trust || 50) - 6); add(s, "insight", 2); if (typeof clearCrisis === "function") clearCrisis(c); return `你笑着摇了摇头。有些人适合怀念，不适合重来。放下，也是一种温柔。`; } }
    ]
  },
  {
    id: "ev_cast_betray", module: "relation", ambient: true, once: true, importance: "turning",
    cond: s => { if (!s.cast) return false; for (const id in s.cast) { const c = s.cast[id]; if ((c.trust || 50) < 28 && (c.pressure || 0) > 60) return true; } return false; },
    title: "🗡️ 背后那一刀",
    text: s => { let m = null; for (const id in s.cast) { const c = s.cast[id]; if ((c.trust || 50) < 28 && (c.pressure || 0) > 60) { m = c; break; } } s._betrayer = m && m.id; return `你低估了人被逼到墙角时会做什么。${_castName(s, m)}——你曾经的${_castRole(s, m)}——在背后捅了你一刀：${m && m.role === "投资人" ? "联合其他股东逼你出局" : m && (m.role === "未来合伙人" || m.role === "合伙人") ? "卷走了核心资料另起炉灶" : "把你的把柄捅了出去"}。你这才明白，关系一旦凉透，最熟的人伤你最深。`; },
    choices: [
      { label: "强硬反击，绝不退让", effect: s => { add(s, "stress", 12); add(s, "strategy", 2); const win = rnd(0.45 + (typeof statEdge === "function" ? statEdge(s, "strategy") : 0)); if (typeof bumpThread === "function") bumpThread(s, "feud_" + (s._betrayer || "npc"), 30, { status: "war" }); if (win) { add(s, "reputation", 4); return "你寸步不让，调动一切资源反将一军。对方没占到便宜，灰头土脸。惨胜，但你守住了自己的东西。"; } add(s, "cash", -Math.round((s.cash || 0) * 0.3)); add(s, "mood", -10); return "你拼尽全力，还是被反咬一口，元气大伤。有些刀防不住，因为它来自你最信的人。"; } },
      { label: "及时止损，断舍离", effect: s => { add(s, "mood", -6); add(s, "insight", 3); if (typeof addMemory === "function") addMemory(s, { id: "betrayed", type: "wound", intensity: 70, text: `你被最信任的人背叛过一次，从此看人多了一层戒备。`, tags: ["relation", "wound"] }); return "你没有纠缠，认了亏、断了联系。痛是痛，但你把精力留给了更值得的人和事。这一课，很贵，但学到了。"; } }
    ]
  }
);
