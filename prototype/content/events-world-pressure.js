"use strict";
/* =====================================================================
 * content/events-world-pressure.js —— 世界压力事件（升级·六期）
 * 让 world signals / 行业状态真正"砸"到玩家身上：航运紧张、电诈高发、
 * 消费降级、教培监管……不再只是新闻文本，而是会改变你这一周的处境。
 * cond 读 s.world.appliedSignals / industryState，module="world"(通用，可调度)。
 * ===================================================================== */
function _sigActive(s, id) { return !!(s.world && s.world.appliedSignals && s.world.appliedSignals[id] > (s.week || 0)); }
function _ind(s, id) { return (typeof industryState === "function") ? industryState(s, id) : null; }

EVENTS.push(
  {
    id: "ev_wp_shipping", module: "world", ambient: true, importance: "scene",
    cond: s => _sigActive(s, "shipping_crisis") && s.age >= 20,
    title: "🚢 航运紧张的连锁反应",
    text: s => `新闻里说的航运紧张，真切地砸到了你头上：海淘的东西迟迟不到，公司/老家做外贸的亲戚急得团团转，运费翻着倍涨。世界的风浪，从来不只在新闻里。`,
    choices: [
      { label: "趁乱囤一批紧俏货，赌个差价", effect: s => { const bet = Math.round(40000 * (s.world ? s.world.priceIndex : 1)); if ((s.cash || 0) < bet) return "你想囤货博一把，可手头的钱不够压这一注，只能眼睁睁看着机会过去。"; add(s, "cash", -bet); s._pendingBets = s._pendingBets || []; s._pendingBets.push({ tk: "紧俏货囤积", bet: bet, ret: Math.round(bet * (0.5 + Math.random() * 1.6)), due: s.week + 16 }); add(s, "stress", 4); return `你压了 ¥${bet.toLocaleString()} 囤了批紧俏货。航运一天不通，价就一天往上走——赌的就是这个时间差。`; } },
      { label: "老老实实等，少折腾", effect: s => { add(s, "mood", -2); return "你没去凑这个热闹。该到的货晚点到，该涨的价忍一忍。风浪里，不沉船也是一种本事。"; } }
    ]
  },
  {
    id: "ev_wp_fraud", module: "world", ambient: true, importance: "scene",
    cond: s => _sigActive(s, "fraud_surge") && s.age >= 20,
    title: "📵 电诈高发期",
    text: s => `电诈高发的风声，最终绕到了你身边：${has(s, "has_kid") ? "孩子" : "家里老人"}接到一通「公检法」电话，差点把养老/教育的钱转出去。你赶到时，对方手指悬在确认键上。`,
    choices: [
      { label: "苦口婆心，给全家上一堂反诈课", effect: s => { add(s, "mind", 1); if (typeof bumpThread === "function") bumpThread(s, "family_guard", 8); add(s, "stress", 3); if (typeof addInfluence === "function") addInfluence(s, "family", 3); return "你拦了下来，又翻出一堆真实案例挨个讲。家里人后怕不已。这年头，防骗能力也是一种孝顺。"; } },
      { label: "晚了一步，钱已经转出去", cond: s => true, effect: s => { const loss = Math.round((6000 + Math.random() * 30000) * (s.world ? s.world.priceIndex : 1)); add(s, "cash", -loss); add(s, "mood", -8); add(s, "stress", 6); if (typeof addScar === "function") addScar(s, "scam_survivor"); if (typeof flag === "function") flag(s, "got_scammed"); return `你还是慢了一步，¥${loss.toLocaleString()} 没了。报警立案，追回渺茫。骗子精准得可怕——这一刀，落在了信任上。`; } }
    ]
  },
  {
    id: "ev_wp_downgrade", module: "world", ambient: true, importance: "scene",
    cond: s => _sigActive(s, "consume_downgrade") && s.age >= 22,
    title: "🛒 消费降级的浪潮",
    text: s => `消费降级成了空气里的共识：身边人都开始捂紧钱包，平价店排长队，高端的生意冷清下来。${(s.startup && !has(s, "startup_done")) || s.job ? "你做的事，也被这股冷意扫到了。" : "你的钱包，也想跟着缩一缩。"}`,
    choices: [
      { label: "顺势转向平价/性价比打法", effect: s => { add(s, "insight", 2); if (typeof addInfluence === "function") addInfluence(s, "circle", 2); if (typeof addWorldImpact === "function") addWorldImpact(s, { industry: "food", field: "heat", delta: 4, note: "你押中了平价生意" }); add(s, "cash", Math.round(8000 * (s.world ? s.world.priceIndex : 1))); return "你迅速调头，砍掉花哨、主打实惠。寒冬里，活下来的往往是最懂省钱的人——也包括懂得帮别人省钱的人。"; } },
      { label: "硬扛高端定位，赌寒冬会过去", effect: s => { add(s, "cash", -Math.round(20000 * (s.world ? s.world.priceIndex : 1))); add(s, "stress", 5); if (rnd(0.4)) { add(s, "reputation", 4); return "你咬牙守住了调性，靠老客户撑了过去。寒冬淘汰了对手，你反而显得更稀缺。赌对了。"; } add(s, "mood", -5); return "你不肯降身段，客单却实打实地掉。高端的体面，在消费降级面前，有点撑不住。"; } }
    ]
  },
  {
    id: "ev_wp_edureg", module: "world", ambient: true, once: true, importance: "scene",
    cond: s => _sigActive(s, "edu_crackdown") && (has(s, "has_kid") || (_ind(s, "education") && _ind(s, "education").regulation > 60)) && s.age >= 28,
    title: "📕 教培监管落地",
    text: s => `一纸新规下来，学科类培训几乎一夜消失。${has(s, "has_kid") ? "孩子的补习班关了门，预付的学费还没退。" : "整个教培行业人仰马翻，认识的老师朋友都在转行。"}时代的方向盘一打，无数人的生计跟着甩了出去。`,
    choices: [
      { label: "顺势应对，自己想办法", effect: s => { add(s, "mind", 1); add(s, "stress", 3); if (typeof addInfluence === "function") addInfluence(s, "circle", 2); return has(s, "has_kid") ? "你把补习的钱省下，自己陪着学。累是累，亲子时间倒是多了——监管之下，家长各显神通。" : "你帮几个转行的朋友牵了线、出了主意。锦上添花易，雪中送炭难，这份情他们记下了。"; } },
      { label: "感叹一句，继续自己的日子", effect: s => { add(s, "insight", 1); return "你看着行业的潮起潮落，没多说什么。时代的一粒灰，落到谁头上都是一座山——你只盼那座山，别落到自己头上。"; } }
    ]
  }
);
