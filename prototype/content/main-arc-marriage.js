"use strict";
/* =====================================================================
 * content/main-arc-marriage.js —— 婚姻资产战争线
 * 主题：爱情进入资产负债表以后，还剩什么。
 * 社会摩擦：学历、房产、家庭背景，最终都进了谈判桌。
 * 关键变量：房价、托育成本、离婚分割。
 * ===================================================================== */
registerMainArc("marriage_war", {
  name: "婚姻资产战争线",
  theme: "爱情进入资产负债表以后，还剩什么。",
  friction: "学历、房产、家庭背景，最终都进了谈判桌。",
  weight: 2,   // 家庭向人生优先走这条
  worldKeys: ["house", "childcare", "divorce"],
  industries: ["education", "silver"],
  startCond: s => ["family", "married", "kid"].includes(s.goal),
  initCast: s => {
    addCastMember(s, "partner", { name: "林夏", role: "伴侣", trust: 60, pressure: 40, affection: 65 });
    addCastMember(s, "inlaw", { name: "岳母", role: "丈母娘", trust: 35, pressure: 70 });
    addCastMember(s, "kid", { name: "孩子", role: "孩子", trust: 80, pressure: 20 });
    addCastMember(s, "lawyer", { name: "李律师", role: "离婚律师", trust: 30, pressure: 50 });
  },
  acts: [
    { evid: "marc_marriage_1", minAge: 22, title: "相亲市场上的明码标价" },
    { evid: "marc_marriage_2", minAge: 26, title: "买房、彩礼与那张谈判桌" },
    { evid: "marc_marriage_3", minAge: 32, title: "柴米油盐里的裂痕" },
    { evid: "marc_marriage_4", minAge: 40, title: "资产与孩子的拉锯" },
    { evid: "marc_marriage_5", minAge: 48, title: "谁也没有真正赢" }
  ],
  reckon: s => {
    const divorced = arcChose(s, "mar_divorce");
    const courtWon = arcChose(s, "mar_court_war");
    const repaired = arcChose(s, "mar_repair");
    const partnership = arcChose(s, "mar_partnership");
    if (divorced && courtWon) return "你赢了那场官司，资产分割表上你拿了大头。可签完字走出法院，孩子不再叫你，曾经爱过的人成了陌生人。你赢了财产，输了所有别的。";
    if (divorced) return "你们最终还是散了，房子卖了对半分，各自搬进更小的屋子。奇怪的是，签完离婚协议那天，两个人都松了口气——有些婚姻，结束才是体面。";
    if (repaired && partnership) return "你守住了这个家，却也把爱过成了合伙。你们像两个尽职的股东，一起经营着房子、孩子和年节的酒席。稳，但你偶尔会想：当初心动的那个人，去哪了。";
    if (repaired) return "你为这个家熬过了所有难关，账面上一家人整整齐齐。代价是，你把自己也熬进了这本家庭的资产负债表里——成全了家，也弄丢了一部分自己。";
    return "婚姻就这么不咸不淡地过下去了，没有撕破脸，也没有再心动。爱情进了资产负债表之后，剩下的是一份谁也不愿先违约的长期合同。";
  }
});

EVENTS.push(
  {
    id: "marc_marriage_1", module: "mainarc", importance: "arc", arc: "marriage_war",
    title: "📖 第一幕 · 相亲市场上的明码标价",
    text: s => {
      const tone = (typeof byAccess === "function") ? byAccess(s, "marriage_market", {
        high: "媒人翻着资料夸你：「这条件，挑得很。」对面的人和家长都客客气气，生怕怠慢了你。",
        mid: "媒人公事公办地报着双方的「硬件」：学历、工作、有没有房有没有车，像在对一张表。",
        low: "对方家长一上来就盘问：「房子全款还是贷款？父母退休金多少？」你被从头到脚估了个价。"
      }) : "媒人公事公办地报着双方的「硬件」：学历、工作、有没有房有没有车，像在对一张表。";
      return `家里催得紧，你被推上了相亲的台子。${tone}你看着对面的${castName(s, "partner", "林夏")}，第一次意识到：在这张桌子上，爱情排在条件后面。`;
    },
    choices: [
      { label: "认下这套规则，按条件挑个最优解", effect: s => { arcChoose(s, "mar_pragmatic", { tension: 6, memory: { id: "mar_market_in", intensity: 45, text: "你接受了把婚姻当成一场资源匹配。" } }); bumpThread(s, "marriage_bond", 8, { actors: ["partner"] }); add(s, "mood", 2); return `你和${castName(s, "partner", "林夏")}的「条件」很对得上。没什么轰轰烈烈，但双方家长都满意——在这个市场里，门当户对就是最大的浪漫。`; } },
      { label: "偏要为心动的人，不看条件", cond: s => true, effect: s => { arcChoose(s, "mar_love_first", { tension: 4, memory: { id: "mar_love_in", intensity: 55, text: "你赌了一把，把心动放在了条件前面。" } }); bumpThread(s, "marriage_bond", 14, { actors: ["partner"] }); add(s, "mood", 6); add(s, "stress", 3); return `你跳过了那张表，认准了${castName(s, "partner", "林夏")}这个人。家里人皱眉：「光有感情，将来日子怎么过？」你嘴上不服，心里也有点慌。`; } },
      { label: "先观望，把自己的「身价」抬一抬再说", effect: s => { arcChoose(s, "mar_delay", { tension: 2, memory: { id: "mar_self_invest", intensity: 35, text: "你决定先增值自己，再回到这张桌子。" } }); add(s, "knowledge", 2); add(s, "stress", 2); return "你暂时退出了这场博弈，把劲使在事业和存款上。你想明白了：在相亲市场，最硬的彩礼是你自己。"; } }
    ]
  },
  {
    id: "marc_marriage_2", module: "mainarc", importance: "turning", arc: "marriage_war",
    title: "📖 第二幕 · 买房、彩礼与那张谈判桌",
    text: s => {
      const il = castName(s, "inlaw", "岳母");
      const backed = (typeof socialAccess === "function" && socialAccess(s, "marriage_market") >= 58) || (s.bg && s.bg.familyRich);
      const houseHot = s.world && s.world.priceIndex > 1.2;
      return `谈婚论嫁到了最实的一步。${il}把条件摆上桌：「婚房得有，首付不能少，彩礼也得讲究。」${houseHot ? "房价这两年涨疯了，那串数字压得人喘不过气。" : ""}${backed ? "好在你家底子厚，父母愿意托一把。" : "可你这点积蓄，离那个数字差得远。"}这张谈判桌上，坐着两个家庭的钱包。`;
    },
    choices: [
      { label: "倾两家之力凑齐，风风光光把婚结了", effect: s => { const cost = Math.round(800000 * (s.world ? s.world.priceIndex : 1)); add(s, "cash", -Math.min(s.cash || 0, cost)); arcChoose(s, "mar_all_in_house", { tension: 10, memory: { id: "mar_house_in", intensity: 65, text: "你掏空两代人的积蓄，换来了一套婚房和一场体面。", tags: ["arc", "turning"] } }); flag(s, "married"); bumpThread(s, "marriage_bond", 12, { actors: ["partner"] }); if (typeof addInfluence === "function") addInfluence(s, "family", 5); s.timeline.push({ age: s.age, text: `你结婚了。婚房首付掏空了两个家庭的钱包，房本上的名字是这场婚姻第一份、也是最贵的一份资产。` }); return `婚礼办得风光，宾客都说般配。只有你知道，这套房背后是两代人的积蓄，和一句没人说破的话：从此谁都不能轻易认输。`; } },
      { label: "拒绝天价彩礼，谈个双方都体面的方案", effect: s => { const il = castName(s, "inlaw", "岳母"); arcChoose(s, "mar_negotiate", { tension: 6, memory: { id: "mar_deal", intensity: 50, text: "你在谈判桌上守住了底线，也守住了体面。" } }); flag(s, "married"); bumpThread(s, "marriage_bond", 8, { actors: ["partner"] }); bumpThread(s, "marriage_crack", 6, { actors: ["inlaw"] }); add(s, "stress", 4); return `你和${il}在桌上拉锯了几个回合，最后各退一步。婚是结了，可那点没谈拢的火气，被埋进了往后柴米油盐的底下。`; } },
      { label: "不买房不办酒，裸婚，先把日子过起来", cond: s => true, effect: s => { arcChoose(s, "mar_naked", { tension: 8, memory: { id: "mar_naked_in", intensity: 60, text: "你们顶着两家的压力，选择了裸婚。", tags: ["arc", "turning"] } }); flag(s, "married"); bumpThread(s, "marriage_bond", 16, { actors: ["partner"] }); bumpThread(s, "marriage_crack", 10, { actors: ["inlaw"] }); add(s, "cash", Math.round(200000 * (s.world ? s.world.priceIndex : 1))); add(s, "mood", 5); add(s, "stress", 6); s.timeline.push({ age: s.age, text: "你们裸婚了。没有房、没有酒席，两个人挤在出租屋里，赌的是将来一起挣出一套房。" }); return `${castName(s, "inlaw", "岳母")}气得当场摔了筷子。但你和${castName(s, "partner", "林夏")}手牵手走出门，觉得只要两个人在一起，再难的日子也熬得过——这话你们当时是真信的。`; } }
    ]
  },
  {
    id: "marc_marriage_3", module: "mainarc", importance: "arc", arc: "marriage_war",
    title: "📖 第三幕 · 柴米油盐里的裂痕",
    text: s => {
      const p = castName(s, "partner", "林夏");
      const childCare = s.world && s.world.childcareCost > 1;
      const crack = (typeof threadLevel === "function") ? threadLevel(s, "marriage_crack") : 0;
      return `结婚几年，新鲜劲早过了。房贷、${childCare ? "高得离谱的托育费、" : ""}双方父母的赡养，把日子压成了一本永远算不平的账。你和${p}为了钱、为了谁付出更多，开始没完没了地吵。${crack > 12 ? "上一次冷战，已经持续了快一个月。" : "枕边人，越来越像合租的室友。"}`;
    },
    choices: [
      { label: "坐下来认真沟通，一起重修这段关系", effect: s => { const p = castName(s, "partner", "林夏"); arcChoose(s, "mar_talk", { tension: -6, memory: { id: "mar_mend1", intensity: 45, text: "你选择在裂痕变深前，主动去修补。" } }); if (typeof bumpThread === "function") bumpThread(s, "marriage_crack", -10, { actors: ["partner"] }); bumpThread(s, "marriage_bond", 10, { actors: ["partner"] }); add(s, "mood", 5); add(s, "stress", -3); return `你们关了手机，认真聊了一夜。${p}红着眼说：「我只是太累了。」那一刻你想起了当初为什么选了对方。裂痕还在，但你们决定一起补。`; } },
      { label: "懒得吵了，各过各的，凑合着维持", effect: s => { arcChoose(s, "mar_coldwar", { tension: 8, memory: { id: "mar_cold", intensity: 50, text: "你们用冷战代替了沟通，把问题往后拖。", tags: ["arc", "crack"] } }); if (typeof bumpThread === "function") bumpThread(s, "marriage_crack", 14, { actors: ["partner"] }); add(s, "mood", -4); add(s, "stress", 5); return "你们达成了一种心照不宣的休战：不吵了，也不爱了。一个屋檐下，两条平行线，谁也不再为谁多走一步。"; } },
      { label: "在外面找了个能说话的人", cond: s => true, effect: s => { arcChoose(s, "mar_affair", { tension: 16, memory: { id: "mar_affair_in", intensity: 75, text: "你在婚姻之外，找了个透气的出口。", tags: ["arc", "crack", "stigma"] } }); if (typeof bumpThread === "function") bumpThread(s, "marriage_crack", 22, { actors: ["partner"] }); if (typeof addStigma === "function") addStigma(s, "affair_suspect"); add(s, "mood", 3); add(s, "stress", 8); return `有个人愿意听你说话，那种久违的心动让你贪恋。可每次回到家，看见${castName(s, "partner", "林夏")}的那扇门，你都清楚：你正在亲手往这段婚姻的裂缝里，再凿一刀。`; } }
    ]
  },
  {
    id: "marc_marriage_4", module: "mainarc", importance: "turning", arc: "marriage_war",
    title: "📖 第四幕 · 资产与孩子的拉锯",
    text: s => {
      const p = castName(s, "partner", "林夏");
      const k = castName(s, "kid", "孩子");
      const broke = arcChose(s, "mar_affair") || (typeof threadLevel === "function" && threadLevel(s, "marriage_crack") >= 30);
      const lw = castName(s, "lawyer", "李律师");
      return broke
        ? `裂痕终于绷断了。${p}把一份打印好的离婚协议拍在桌上，旁边坐着${lw}：「房子、存款、还有${k}的抚养权，我们一项项谈。」当年那张谈婚论嫁的桌子，如今变成了离婚的谈判桌。`
        : `日子虽然平淡，但一个绕不开的难题摆上了台面：要不要为了${k}的教育，再添一套学区房／要不要让一方放弃事业回家？围绕这套资产和这个孩子，你和${p}各有各的算盘。`;
    },
    choices: [
      { label: "为了孩子，谈一份和平分手的协议", cond: s => arcChose(s, "mar_affair") || (typeof threadLevel === "function" && threadLevel(s, "marriage_crack") >= 24), effect: s => { const k = castName(s, "kid", "孩子"); arcChoose(s, "mar_divorce", { tension: -8, memory: { id: "mar_split_peace", intensity: 70, text: "你们好聚好散，把对孩子的伤害降到最低。", tags: ["arc", "turning"] } }); if (typeof addScar === "function") addScar(s, "divorced"); add(s, "cash", -Math.max(0, Math.round((s.cash || 0) * 0.45))); flag(s, "divorced"); s.timeline.push({ age: s.age, text: `你们离婚了。共同财产对半分，约好轮流陪${k}。没有撕破脸，只是从此各走各路。` }); return `你们没请律师对簿公堂，自己把财产对半分了。签字那天，${k}在隔壁房间睡着，你们都没忍心吵醒——这是你们最后一次，为同一个人轻手轻脚。`; } },
      { label: "撕破脸，请律师把资产和抚养权全争过来", cond: s => arcChose(s, "mar_affair") || (typeof threadLevel === "function" && threadLevel(s, "marriage_crack") >= 24), effect: s => { const lw = castName(s, "lawyer", "李律师"); arcChoose(s, "mar_court_war", { tension: 18, memory: { id: "mar_court", intensity: 85, text: "你请了律师，把婚姻彻底打成了一场资产战争。", tags: ["arc", "turning", "stigma"] } }); arcChoose(s, "mar_divorce", {}); if (typeof addScar === "function") addScar(s, "divorced"); if (typeof bumpThread === "function") bumpThread(s, "marriage_crack", 20, { actors: ["partner", "lawyer"] }); add(s, "stress", 12); flag(s, "divorced"); s.timeline.push({ age: s.age, text: "离婚战打到了法庭。你和律师把每一笔账都算到底，赢了财产，也赢回了满身的疲惫与冷。" }); return `${lw}很专业，帮你算清了每一分钱、争到了房子。可法庭上你们互揭老底的样子，连旁听席都摇头。你拿回了资产，也彻底拿掉了「爱过」这两个字。`; } },
      { label: "退一步，一方为家庭做出牺牲，把这个家保住", effect: s => { const p = castName(s, "partner", "林夏"); const k = castName(s, "kid", "孩子"); arcChoose(s, "mar_repair", { tension: -4, memory: { id: "mar_sacrifice", intensity: 60, text: "你们为了家和孩子，各自让渡了一部分自己。", tags: ["arc", "turning"] } }); if (typeof bumpThread === "function") bumpThread(s, "marriage_crack", -16, { actors: ["partner"] }); if (typeof addInfluence === "function") addInfluence(s, "family", 8); add(s, "mood", -2); add(s, "stress", 4); add(s, "cash", -Math.round(500000 * (s.world ? s.world.priceIndex : 1))); s.timeline.push({ age: s.age, text: `为了${k}，你们咬牙添置了学区房，一方退守家庭。这个家保住了，代价是各自都收起了一部分野心。` }); return `你们各退一步，把那套学区房买了，也把那场快要爆发的战争按了下去。这个家整整齐齐，只是${p}和你都明白：从此你们更像并肩持家的合伙人，而不是恋人。`; } }
    ]
  },
  {
    id: "marc_marriage_5", module: "mainarc", importance: "turning", arc: "marriage_war",
    title: "📖 第五幕 · 谁也没有真正赢",
    text: s => {
      const divorced = arcChose(s, "mar_divorce");
      const courtWon = arcChose(s, "mar_court_war");
      const k = castName(s, "kid", "孩子");
      const p = castName(s, "partner", "林夏");
      return divorced
        ? (courtWon
          ? `多年后，你住进了那套争来的房子。${k}长大了，却和你生分得像客人。同学聚会上有人问起，你只笑笑——赢了官司的人，往往最不愿提起那场胜利。`
          : `离婚多年，你们偶尔在${k}的家长会上碰面，能平静地寒暄几句。日子各自过着，那段婚姻像一笔早已结清的账，只是偶尔翻起，还有余温。`)
        : `头发都白了些。你和${p}坐在当年掏空积蓄买下的房子里，看着${k}成了家。你们很少再说「爱」这个字，但谁也离不开谁。这一生的婚姻，到底是经营还是相守，连你自己也分不清了。`;
    },
    choices: [
      { label: "接受这一切，把它当成人生该交的学费", effect: s => { arcChoose(s, "mar_accept", { tension: -10, memory: { id: "mar_settle", intensity: 55, text: "你接纳了婚姻的真相：它从来不是童话。" } }); add(s, "mood", 4); if (typeof addScar === "function") {} return "你不再纠结谁对谁错。爱情、房子、孩子、那张谈判桌——它们一起构成了你这半生。算不清盈亏，那就不算了。"; } },
      { label: "趁还来得及，去修补和孩子、和那个人的关系", cond: s => true, effect: s => { const k = castName(s, "kid", "孩子"); arcChoose(s, "mar_partnership", { tension: -6, memory: { id: "mar_late_mend", intensity: 60, text: "你在最后的篇章里，试着把关系一点点补回来。" } }); if (typeof addInfluence === "function") addInfluence(s, "family", 6); add(s, "mood", 6); add(s, "stress", -4); s.timeline.push({ age: s.age, text: `晚年里，你放下身段，主动去靠近${k}、靠近那段旧时光。有些裂缝补不回原样，但补了，心里就暖一块。` }); return `你不再算计输赢，只想趁还来得及，多陪陪${k}，多说几句早该说的软话。婚姻这场仗，没有赢家——能讲和的，已经是赢了。`; } },
      { label: "一个人也挺好，把后半生过成自己的", cond: s => arcChose(s, "mar_divorce"), effect: s => { arcChoose(s, "mar_solo", { tension: -8, memory: { id: "mar_free", intensity: 65, text: "你从那场婚姻里彻底走了出来，重新成为自己。" } }); add(s, "mood", 7); add(s, "stress", -5); if (typeof addInfluence === "function") addInfluence(s, "circle", 4); s.timeline.push({ age: s.age, text: "你最终学会了一个人也过得很好。那场资产战争里失去的，你在自己身上一点点找了回来。" }); return "你不再等谁、不再为谁妥协。后半生你只对自己负责——原来从那本资产负债表里抽身出来，人可以这么轻。"; } }
    ]
  }
);
