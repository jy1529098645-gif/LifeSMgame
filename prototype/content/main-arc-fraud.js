"use strict";
/* =====================================================================
 * content/main-arc-fraud.js —— 电诈阴影线
 * 主题：骗局时代里，信任还能不能存在。
 * 社会摩擦：被骗经历让你失去信任，也给你行业洞察。
 * 关键变量：电诈泛滥、AI 换脸/拟声、跨境黑产、反诈监管。
 * ===================================================================== */
registerMainArc("fraud_shadow", {
  name: "电诈阴影线",
  theme: "骗局时代里，信任还能不能存在。",
  friction: "被骗经历让你失去信任，也给你行业洞察。",
  weight: 2,
  worldKeys: ["fraud", "ai", "global"],
  industries: ["anti_fraud", "content"],
  startCond: s => (typeof ensureProfile === "function" && ensureProfile(s).familyClass === "poor"),   // 贫寒出身更易被卷入
  initCast: s => {
    addCastMember(s, "buddy", { name: "阿龙", role: "发小", industry: "fraud", trust: 65, pressure: 50 });
    addCastMember(s, "mother", { name: "母亲", role: "母亲", industry: "family", trust: 80, pressure: 40 });
    addCastMember(s, "cop", { name: "周警官", role: "反诈警官", industry: "anti_fraud", trust: 45, pressure: 30 });
    addCastMember(s, "boss", { name: "老板", role: "上线金主", industry: "fraud", trust: 25, pressure: 70, ambition: 85 });
  },
  acts: [
    { evid: "marc_fraud_1", minAge: 16, title: "一笔来路不明的钱" },
    { evid: "marc_fraud_2", minAge: 20, title: "高薪出国的邀约" },
    { evid: "marc_fraud_3", minAge: 24, title: "火坑边上的选择" },
    { evid: "marc_fraud_4", minAge: 30, title: "金盆洗手，还是越陷越深" },
    { evid: "marc_fraud_5", minAge: 40, title: "信任的代价" }
  ],
  reckon: s => {
    const reform = arcChose(s, "fraud_reform");
    const reshape = arcChose(s, "fraud_reshape");
    const deepIn = arcChose(s, "fraud_join");
    const scammed = arcChose(s, "fraud_scammed");
    if (reshape) return "你把那段火坑里的日子，熬成了一套真能拦住骗局的东西。无数陌生人因你少被骗了一次——可灰产记住了你的名字，深夜的陌生来电再没停过。你赎回了世界的一点信任，唯独家人看你的眼神，再也没回到从前。";
    if (reform) return "你从泥里爬了出来，把知道的全交了出去。法律给了你一条活路，社会却没那么快忘记你的旧账。你学会了在被怀疑中做事——干净地活着，比赚黑钱难多了。";
    if (deepIn) return "黑钱让你风光过一阵，账户的数字曾经很好看。可东窗事发那天，发小不认你、母亲哭着别过脸、你赢了钱却输光了所有能信你的人。看透了人心，也再没人愿意被你看透。";
    if (scammed) return "你被骗了一辈子，钱、人、心，一样样被掏空。但也正因为被掏得太彻底，你比谁都看得清骗局的骨架——只是这份洞察，是用一生的信任换来的，太贵了。";
    return "时代的骗局从你身边呼啸而过，你没沾、也没栽。普通地、警惕地活到了今天——在一个谁都可能是骗子的年代，这本身就不容易。";
  }
});

EVENTS.push(
  {
    id: "marc_fraud_1", module: "mainarc", importance: "arc", arc: "fraud_shadow",
    title: "📖 第一幕 · 一笔来路不明的钱",
    text: s => `家里穷，${castName(s, "mother", "母亲")}起早贪黑也只够糊口。这天发小${castName(s, "buddy", "阿龙")}神神秘秘塞给你一沓现金：「帮我把这张银行卡借我用两天，事成给你分一千。」你不知道钱从哪来，但那叠票子很厚，厚得让你心跳。`,
    choices: [
      { label: "把卡借出去，先拿这笔快钱", effect: s => { const got = Math.round(1000 * (s.world ? s.world.priceIndex : 1)); add(s, "cash", got); arcChoose(s, "fraud_lendcard", { tension: 10, memory: { id: "fraud_firstmoney", intensity: 55, text: "你第一次为了快钱，把自己的名字借给了看不见的东西。", tags: ["arc", "gray"] } }); if (typeof addStigma === "function") addStigma(s, "gray_suspect"); add(s, "stress", 4); return `卡借出去了，到手 ¥${got.toLocaleString()}。${castName(s, "mother", "母亲")}问你哪来的钱，你低头没敢看她的眼睛。`; } },
      { label: "拒绝，但悄悄记下这门生意怎么运作", effect: s => { arcChoose(s, "fraud_observe", { tension: 3, memory: { id: "fraud_scout", intensity: 35, text: "你没下水，却开始留意这水有多深。" } }); add(s, "insight", 2); if (typeof addExperience === "function") addExperience(s, "street"); return `你把卡还了回去，但${castName(s, "buddy", "阿龙")}那句「这钱来得太容易」一直在你脑子里转。你开始琢磨：这套东西到底是怎么转起来的。`; } },
      { label: "报警，宁可得罪发小", cond: s => true, effect: s => { arcChoose(s, "fraud_clean_start", { tension: 6, memory: { id: "fraud_report1", intensity: 50, text: "你第一次站在了骗局的对面。" } }); bumpThread(s, "cop_trust", 12, { actors: ["cop"] }); if (typeof addInfluence === "function") addInfluence(s, "circle", 2); add(s, "reputation", 3); return `${castName(s, "cop", "周警官")}收下了线索，看了你一眼：「你这孩子，明白事。」发小从此不再理你——干净，是有代价的。`; } }
    ]
  },
  {
    id: "marc_fraud_2", module: "mainarc", importance: "arc", arc: "fraud_shadow",
    title: "📖 第二幕 · 高薪出国的邀约",
    text: s => `一条招聘信息找上门：东南亚，「客服」月薪三万，包吃包住机票全报。${castName(s, "buddy", "阿龙")}发来语音，背景音很吵：「兄弟过来吧，这边挣得多。」你查了查机票，又看了看家里漏雨的屋顶。`,
    choices: [
      { label: "心动了，订机票出国「打工」", cond: s => true, effect: s => { arcChoose(s, "fraud_goabroad", { tension: 14, memory: { id: "fraud_flyout", intensity: 70, text: "你拖着行李箱走进了登机口，以为是去赚钱。", tags: ["arc", "turning"] } }); flag(s, "fraud_overseas"); add(s, "stress", 8); add(s, "mood", -2); if (typeof addExperience === "function") addExperience(s, "overseas"); s.timeline.push({ age: s.age, text: "你飞往东南亚「高薪打工」，落地后护照就被收走了。" }); return `飞机落地，接机的人很客气，可一进园区，护照就被「统一保管」。铁门关上的那一声，你这辈子忘不掉。`; } },
      { label: "差点上当，被反诈劝阻", cond: s => arcChose(s, "fraud_clean_start") || arcChose(s, "fraud_observe"), effect: s => { arcChoose(s, "fraud_almost", { tension: 5, memory: { id: "fraud_warned", intensity: 45, text: "你在登机口前被拦了下来。" } }); bumpThread(s, "cop_trust", 8, { actors: ["cop"] }); add(s, "insight", 2); if (typeof addScar === "function") addScar(s, "scam_survivor"); return `${castName(s, "cop", "周警官")}在机场拦下你：「这岗位，去了就回不来了。」你后背发凉。那张机票，成了你这辈子最庆幸没用上的东西。`; } },
      { label: "看穿是骗局，转头去做反诈科普", effect: s => { arcChoose(s, "fraud_warn_others", { tension: 4, memory: { id: "fraud_science", intensity: 40, text: "你把自己差点被卷走的经历，讲给了更多人听。" } }); add(s, "insight", 3); add(s, "reputation", 4); if (typeof addInfluence === "function") addInfluence(s, "media", 3); if (typeof addExperience === "function") addExperience(s, "anti_fraud"); return `你把这条「高薪招聘」截图发到网上，配上一行字：别去。底下有人骂你管闲事，也有人留言：谢谢，我哥差点就走了。`; } }
    ]
  },
  {
    id: "marc_fraud_3", module: "mainarc", importance: "turning", arc: "fraud_shadow",
    title: "📖 第三幕 · 火坑边上的选择",
    text: s => { const abroad = arcChose(s, "fraud_goabroad"); return abroad ? `园区里，${castName(s, "boss", "老板")}把话挑明：「业绩做不上去，电棍伺候；做上去，提成翻倍。剧本都给你了，照着念，骗的是大洋彼岸的有钱人，跟你无冤无仇。」隔壁工位的人昨天「跳楼」了。${castName(s, "buddy", "阿龙")}低声说：「想活着回家，就先把自己骗成另一个人。」` : `${castName(s, "boss", "老板")}通过${castName(s, "buddy", "阿龙")}找到你，开出诱人的条件：「在国内远程也能干，话术我教你，钱来得比谁都快。就看你敢不敢。」你站在了那条线的边上。`; },
    choices: [
      { label: "下水：照剧本骗，背上黑钱", cond: s => true, effect: s => { const got = (typeof bigWindfall === "function") ? bigWindfall(s, 200000) : 500000; add(s, "cash", got); arcChoose(s, "fraud_join", { tension: 18, memory: { id: "fraud_become", intensity: 85, text: "你拿起了剧本，把别人的信任变成了自己账户的数字。", tags: ["arc", "stigma"] } }); if (typeof addStigma === "function") addStigma(s, "gray_suspect"); bumpThread(s, "boss_pact", 20, { actors: ["boss"], status: "open" }); add(s, "stress", 12); if (typeof addInfluence === "function") addInfluence(s, "circle", 4); s.timeline.push({ age: s.age, text: `你正式入了局，第一个月分成 ¥${got.toLocaleString()}。` }); return `第一笔提成到账 ¥${got.toLocaleString()}。屏幕那头的人哭着求你别再骗了，你按下挂断键，告诉自己：这是工作。可那天起，你再没法直视镜子里的人。`; } },
      { label: "硬扛着不开单，找机会逃出去", cond: s => arcChose(s, "fraud_goabroad"), effect: s => { arcChoose(s, "fraud_resist", { tension: 12, memory: { id: "fraud_survive", intensity: 75, text: "你宁可挨打，也没把电话拨向第一个受害者。" } }); add(s, "health", -8); add(s, "stress", 10); if (typeof addScar === "function") addScar(s, "scam_survivor"); bumpThread(s, "cop_trust", 6, { actors: ["cop"] }); s.timeline.push({ age: s.age, text: "你在园区里硬扛着不开单，挨了打，也攒下了逃跑的胆。" }); return `你装病、装笨、偷偷记下地址，把消息塞进了一次外卖订单。代价是几顿毒打。但你没拿起那个话筒——这是你在那个鬼地方，唯一守住的东西。`; } },
      { label: "反水：当卧底，把窝点端了", cond: s => arcChose(s, "fraud_clean_start") || arcChose(s, "fraud_almost") || arcChose(s, "fraud_warn_others"), effect: s => { arcChoose(s, "fraud_mole", { tension: 16, memory: { id: "fraud_undercover", intensity: 80, text: "你假装入局，其实在给警方递坐标。", tags: ["arc", "turning"] } }); bumpThread(s, "cop_trust", 25, { actors: ["cop"], status: "open" }); add(s, "stress", 14); if (typeof addInfluence === "function") addInfluence(s, "policy", 4); if (typeof addExperience === "function") addExperience(s, "anti_fraud"); s.timeline.push({ age: s.age, text: "你做了卧底，把一个电诈窝点的位置交给了周警官。" }); return `你陪着笑脸坐进窝点，把楼层、人数、资金链一点点喂给${castName(s, "cop", "周警官")}。收网那夜，你蹲在角落发抖——既怕被认出来，又怕自己其实早就习惯了这里。`; } }
    ]
  },
  {
    id: "marc_fraud_4", module: "mainarc", importance: "turning", arc: "fraud_shadow",
    title: "📖 第四幕 · 金盆洗手，还是越陷越深",
    cond: s => arcChose(s, "fraud_join") || arcChose(s, "fraud_resist") || arcChose(s, "fraud_mole") || arcChose(s, "fraud_goabroad"),
    text: s => { const joined = arcChose(s, "fraud_join"); return joined ? `钱越赚越多，${castName(s, "boss", "老板")}要提拔你做「主管」，带新人、管资金盘。可${castName(s, "mother", "母亲")}病倒了，反诈预警短信也一条接一条——你名下的卡，已经被标记。${castName(s, "cop", "周警官")}托人带话：「现在回头，还来得及。」` : `你死里逃生回到家乡，旧伤未愈。有人劝你「就当没发生过」，也有人说你掌握的东西能救很多人。${castName(s, "mother", "母亲")}只想你平平安安，可你夜里总梦见那扇铁门。`; },
    choices: [
      { label: "金盆洗手，把自己知道的全交出去", cond: s => true, effect: s => { arcChoose(s, "fraud_reform", { tension: 10, memory: { id: "fraud_washhands", intensity: 80, text: "你选择把脏手洗干净，哪怕要先承担旧账。", tags: ["arc", "turning"] } }); if (arcChose(s, "fraud_join")) { if (typeof addStigma === "function") addStigma(s, "lawsuit"); add(s, "cash", -Math.max(0, Math.round((s.cash || 0) * 0.4))); s.timeline.push({ age: s.age, text: "你自首并退赃，背上了案底，但换来了重新做人的机会。" }); } bumpThread(s, "cop_trust", 20, { actors: ["cop"] }); if (typeof addExperience === "function") addExperience(s, "anti_fraud"); if (typeof addInfluence === "function") addInfluence(s, "policy", 5); add(s, "reputation", 4); add(s, "mood", 5); return `你坐到${castName(s, "cop", "周警官")}对面，把名字、地址、资金路径一条条说清。说完那一刻，肩上像卸下一座山——尽管山下，是该来的代价。`; } },
      { label: "越陷越深：自己拉队伍，做上线", cond: s => arcChose(s, "fraud_join"), effect: s => { const got = (typeof bigWindfall === "function") ? bigWindfall(s, 1200000) : 3000000; add(s, "cash", got); arcChoose(s, "fraud_deeper", { tension: 16, memory: { id: "fraud_kingpin", intensity: 90, text: "你从棋子变成了下棋的人，再也下不来了。", tags: ["arc", "stigma"] } }); if (typeof addStigma === "function") { addStigma(s, "gray_suspect"); addStigma(s, "lawsuit"); } if (typeof addInfluence === "function") addInfluence(s, "circle", 6); bumpThread(s, "founder_guilt", 22); add(s, "stress", 12); s.timeline.push({ age: s.age, text: `你自立门户做了上线，账上多了 ¥${got.toLocaleString()}，也彻底踏上了不归路。` }); return `你不再是替人念剧本的人，你成了写剧本、发工资的人。账户里 ¥${got.toLocaleString()}，可${castName(s, "mother", "母亲")}的电话，你已经三个月不敢接了。`; } },
      { label: "把伤痛做成产品：搞反诈预警", cond: s => arcChose(s, "fraud_resist") || arcChose(s, "fraud_mole"), effect: s => { arcChoose(s, "fraud_build", { tension: 8, memory: { id: "fraud_product", intensity: 70, text: "你把火坑里看清的套路，变成了拦截骗局的工具。" } }); if (typeof addExperience === "function") addExperience(s, "anti_fraud"); if (typeof addInfluence === "function") { addInfluence(s, "industry", 6); addInfluence(s, "media", 5); } add(s, "knowledge", 3); add(s, "reputation", 6); s.timeline.push({ age: s.age, text: "你开始做反诈预警产品，把亲历的套路写成识别规则。" }); return `你把那些话术、那些资金路径，全做成了识别模型。第一次有人靠你的提示挂断了诈骗电话时，你哭了——原来被掏空过的人，也能反过来护住别人。`; } }
    ]
  },
  {
    id: "marc_fraud_5", module: "mainarc", importance: "turning", arc: "fraud_shadow",
    title: "📖 第五幕 · 信任的代价",
    cond: s => arcChose(s, "fraud_reform") || arcChose(s, "fraud_deeper") || arcChose(s, "fraud_build") || arcChose(s, "fraud_join"),
    text: s => { const deep = arcChose(s, "fraud_deeper"); const built = arcChose(s, "fraud_build") || arcChose(s, "fraud_reform"); if (deep) return `多年盘下来，你成了这条灰色链上一个绕不开的名字。可AI换脸、拟声把骗局推到新高度，新人比你更狠。${castName(s, "cop", "周警官")}的卷宗里，你的页码越来越靠前。夜里你常想：钱够花几辈子了，那然后呢？`; return built ? `这些年，你的反诈产品拦下了无数次骗局。AI 让骗子的脸和声音都能造假，世界比从前更不敢相信彼此。有人请你把这套东西做大，做成一道真正的防线——你掂量着手里的分量。` : `时代翻篇了，AI 让真假难辨，连${castName(s, "mother", "母亲")}都接到过「你」的求救语音。你站在自己人生的岔路口，得为这一生的账，做个了结。`; },
    choices: [
      { label: "（影响力够）做大反诈产品，推动行业反诈", cond: s => (typeof influenceTier === "function" && influenceTier(s) >= 3), effect: s => { const got = (typeof bigWindfall === "function") ? bigWindfall(s, 1500000) : 4000000; add(s, "cash", got); arcChoose(s, "fraud_reshape", { tension: 14, memory: { id: "fraud_defense_line", intensity: 95, text: "你把一个人的赎罪，变成了一代人的防线。", tags: ["arc", "world"] } }); if (typeof addInfluence === "function") { addInfluence(s, "policy", 12); addInfluence(s, "media", 10); addInfluence(s, "industry", 8); } if (typeof addWorldImpact === "function") addWorldImpact(s, { industry: "anti_fraud", field: "scamDensity", delta: -15, note: "你做大的反诈产品压低了骗局得手率" }); if (typeof addExperience === "function") addExperience(s, "listed_company"); add(s, "reputation", 10); s.timeline.push({ age: s.age, text: `你的反诈产品成了国民级防线，骗局得手率应声下降，你也因此身价 ¥${got.toLocaleString()}。` }); return `你的预警接进了运营商、银行、社交平台。诈骗得手率一年里掉了一大截，无数陌生人在不知情中躲过一劫。代价是，灰产把你列上了名单——你护住了世界的信任，却把自己活成了靶子。`; } },
      { label: "收手退场，用赚到的钱给家人一个交代", cond: s => arcChose(s, "fraud_deeper") || arcChose(s, "fraud_join"), effect: s => { arcChoose(s, "fraud_quit_rich", { tension: -8 }); if (typeof addStigma === "function") addStigma(s, "lawsuit"); add(s, "cash", -Math.max(0, Math.round((s.cash || 0) * 0.3))); bumpThread(s, "family_rift", 18, { actors: ["mother", "buddy"] }); add(s, "mood", -4); s.timeline.push({ age: s.age, text: "你想金盆洗手退场，钱还在，但家人看你的眼神再也回不去了。" }); return `你退了，把钱换成房子、存款，想给${castName(s, "mother", "母亲")}一个晚年。可她接过卡时,手是抖的：「这钱，干净吗？」你答不上来。赢了钱，输了她那句「我儿子最实在」。`; } },
      { label: "守着这条小小的防线，平静地老去", cond: s => true, effect: s => { arcChoose(s, "fraud_keep_watch", { tension: -6, memory: { id: "fraud_quiet_end", intensity: 60, text: "你没做成什么大事，只是日复一日地拦着骗局。" } }); add(s, "mood", 6); add(s, "reputation", 3); if (typeof addInfluence === "function") addInfluence(s, "circle", 3); if (typeof addExperience === "function") addExperience(s, "anti_fraud"); return `你没把它做成什么帝国，只是守着一个小小的反诈号，一条条回着陌生人的私信：这是骗局、那个别信。被骗过的人,最懂怎么拉住下一个要掉进去的人。这样，也挺好。`; } }
    ]
  }
);
