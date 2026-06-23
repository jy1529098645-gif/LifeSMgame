"use strict";
/* =====================================================================
 * content/events-thread.js —— 持续矛盾的总爆发（升级·八期）
 * threads 不再只是后台数字：当某条矛盾(婚姻裂痕/家族债务/身份焦虑/良心债)
 * 累积到临界，会强制摊牌，逼你做一次有后果的了断。effect 里把该 thread 降下来
 * (status=closed 或 level 减半)，避免反复触发。让"日积月累"真的改写人生走向。
 * ===================================================================== */
function _tl(s, id) { return (typeof threadLevel === "function") ? threadLevel(s, id) : ((s.threads && s.threads[id] && s.threads[id].level) || 0); }
function _closeThread(s, id, leftover) { if (s.threads && s.threads[id]) { s.threads[id].level = leftover || 0; s.threads[id].status = (leftover ? "open" : "closed"); } }

EVENTS.push(
  {
    id: "ev_thread_marriage", module: "love", ambient: true, importance: "turning",
    cond: s => _tl(s, "marriage_crack") >= 64 && (has(s, "married") || has(s, "partner")),
    title: "💔 婚姻的摊牌时刻",
    text: s => `积怨像水位一样涨了很多年，终于漫过了堤。${s.partnerName || "你的另一半"}把话挑明了：「我们……还要不要继续？」那些没说出口的失望、算计和疲惫，此刻全摆上了桌。这一关，绕不过去了。`,
    choices: [
      { label: "好聚好散，签字离婚", effect: s => { _closeThread(s, "marriage_crack"); delete s.flags.married; delete s.flags.partner; if (typeof addScar === "function") addScar(s, "divorced"); const split = Math.round((s.assets || 0) * 0.4 + (s.cash > 0 ? s.cash * 0.3 : 0)); add(s, "assets", -Math.round((s.assets || 0) * 0.4)); if (s.cash > 0) add(s, "cash", -Math.round(s.cash * 0.3)); add(s, "mood", -10); add(s, "stress", -4); if (typeof addMemory === "function") addMemory(s, { id: "divorce", type: "wound", intensity: 75, text: "一段婚姻，最终结在了一张分割财产的纸上。", tags: ["family", "wound"] }); s.timeline.push({ age: s.age, text: `你们离婚了。分掉了 ¥${split.toLocaleString()} 的共同财产，也分掉了那个共同生活过的自己。` }); return `字签下去的那一刻，竟有种解脱。爱情进了资产负债表，剩下的只是清算。各自走吧——至少，往后不必再为难彼此。`; } },
      { label: "拼一把，去做婚姻咨询、重新经营", effect: s => { const ok = rnd(0.45 + (typeof statEdge === "function" ? statEdge(s, "mind") : 0)); add(s, "cash", -Math.round(20000 * (s.world ? s.world.priceIndex : 1))); add(s, "stress", 6); if (ok) { _closeThread(s, "marriage_crack", 20); if (typeof bumpThread === "function") bumpThread(s, "marriage_bond", 16); add(s, "mood", 8); return "你们都拿出了诚意，一次次把话说开。裂痕没法完全抹平，但你们决定带着它继续走——成熟的爱，是修补，不是重来。"; } _closeThread(s, "marriage_crack", 45); add(s, "mood", -6); return "你想救，可有些凉，是焐不热的。咨询做了几次，争吵照旧。这桩婚姻被你勉强续上，却像打了石膏的旧伤，阴雨天就疼。"; } }
    ]
  },
  {
    id: "ev_thread_familydebt", module: "family", ambient: true, importance: "turning",
    cond: s => _tl(s, "family_debt") >= 58,
    title: "🚪 债主堵到了门口",
    text: s => `家族那笔越滚越大的债，终于追到了你头上。一群人堵在门口，言语里带着威胁：「人是你家的，债就得有人还。」你这才痛切地懂了那句话——家族资源是捷径，也是债务。`,
    choices: [
      { label: "扛下来，一笔笔还清", effect: s => { const cost = Math.round(Math.max(50000, (s.cash || 0) * 0.5) * (s.world ? s.world.priceIndex : 1)); add(s, "cash", -Math.min(s.cash > 0 ? s.cash : cost, cost)); _closeThread(s, "family_debt", 15); add(s, "reputation", 5); add(s, "stress", 8); if (typeof addMemory === "function") addMemory(s, { id: "paid_familydebt", intensity: 65, text: "你替家族扛下了那笔不属于你的债。", tags: ["family"] }); return `你咬牙把债扛了下来。钱包瘪了，腰板却直了——这个家，总得有个人站出来收拾烂摊子。`; } },
      { label: "切割：这债，凭什么我来背", effect: s => { _closeThread(s, "family_debt", 25); if (typeof addStigma === "function") addStigma(s, "family_debt"); if (typeof bumpThread === "function") bumpThread(s, "family_rift", 25, { status: "open" }); add(s, "mood", -6); add(s, "network", -8); return "你做了法律切割，把自己摘了出去。债主走了，可饭桌上从此空了几把椅子——亲情和清白，你只能保一个。"; } }
    ]
  },
  {
    id: "ev_thread_identity", module: "life", ambient: true, once: true, importance: "turning",
    cond: s => _tl(s, "identity_crisis") >= 52,
    title: "🌫️ 我到底属于哪里",
    text: s => `又一个失眠的深夜，那个追问你很多年的问题，终于把你逼到了墙角：漂了这么久，你究竟是哪里人？乡音里混着口音，口音里又藏着乡音。两边的世界，好像都不完全要你。`,
    choices: [
      { label: "接纳：我属于我走过的每一段路", effect: s => { _closeThread(s, "identity_crisis"); add(s, "mind", 3); add(s, "insight", 2); add(s, "mood", 8); if (typeof addMemory === "function") addMemory(s, { id: "identity_peace", intensity: 60, text: "你终于和「漂泊」这件事和解了。", tags: ["self"] }); return "你想通了：归属不是一张身份证，是你愿意为之停留的人和事。从此你不再追问，而是把每一处住过的地方，都活成了家。"; } },
      { label: "逃回最初的舒适区，别再折腾", effect: s => { _closeThread(s, "identity_crisis", 20); add(s, "mood", 4); add(s, "insight", 1); return "你收拾行李，回到了最熟悉的地方。也许是退却，也许是清醒。漂够了的人，有权利为自己选一处不必再解释的角落。"; } }
    ]
  },
  {
    id: "ev_thread_guilt", module: "life", ambient: true, once: true, importance: "turning",
    cond: s => _tl(s, "founder_guilt") >= 48 || (typeof profileHas === "function" && profileHas(s, "stigma", "gray_suspect") && _tl(s, "founder_guilt") >= 30),
    title: "🪞 良心账，到了该结的时候",
    text: s => `当年为了活下去掺过的水、动过的手脚，这些年像一根刺，扎在你心里。如今你站稳了，可那笔良心账，利滚利地压着你。夜深人静时，你总会想起那些被你的"漂亮数据"坑过的人。`,
    choices: [
      { label: "补救：站出来纠错、把欠的还回去", effect: s => { _closeThread(s, "founder_guilt"); add(s, "cash", -Math.round((s.cash > 0 ? s.cash * 0.2 : 0))); add(s, "reputation", 8); if (typeof addInfluence === "function") addInfluence(s, "media", 5); add(s, "mood", 6); if (typeof addMemory === "function") addMemory(s, { id: "redemption", intensity: 70, text: "你回头补上了当年的亏欠，给自己一个交代。", tags: ["self"] }); return "你公开纠了错、退了款、认了账。损失了钱，也损失了一部分「成功人士」的体面——但你睡了多年来第一个安稳觉。有些债，还了才轻。"; } },
      { label: "继续装睡，往事不必再提", effect: s => { _closeThread(s, "founder_guilt", 30); add(s, "mood", -4); if (typeof addStigma === "function") addStigma(s, "gray_suspect"); return "你把那根刺又往深处按了按。日子照过，钱照赚，只是某些深夜，良心会准时来敲门。你假装没听见。"; } }
    ]
  }
);
