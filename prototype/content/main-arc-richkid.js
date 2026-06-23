"use strict";
/* =====================================================================
 * content/main-arc-richkid.js —— 富二代败家重建线
 * 主题：出生在终点的人，如何证明自己不是个废物。
 * 社会摩擦：资源太多，反而没人相信你的能力。
 * 关键变量：家族企业、房地产、资本、制造业转型、AI。
 * ===================================================================== */
registerMainArc("richkid_rebuild", {
  name: "富二代败家重建线",
  theme: "出生在终点的人，如何证明自己不是个废物。",
  friction: "资源太多，反而没人相信你的能力。",
  weight: 4,   // 高权重：富裕出身时优先覆盖其它主线
  worldKeys: ["realestate", "family_business", "capital"],
  industries: ["manufacturing", "ai"],
  startCond: s => (typeof ensureProfile === "function" && ["rich", "upper"].includes(ensureProfile(s).familyClass)),
  initCast: s => {
    addCastMember(s, "father", { name: "父亲", role: "家族企业家", industry: "manufacturing", trust: 50, pressure: 70 });
    addCastMember(s, "steward", { name: "陈叔", role: "老管家·职业经理人", industry: "family_business", trust: 65, pressure: 40 });
    addCastMember(s, "pal", { name: "阿凯", role: "狐朋狗友", industry: "capital", trust: 30, pressure: 50 });
    addCastMember(s, "love", { name: "苏苏", role: "真心人", industry: "ai", trust: 60, pressure: 20 });
    if (typeof addPrivilege === "function") addPrivilege(s, "family_business");
  },
  acts: [
    { evid: "marc_richkid_1", minAge: 18, title: "含着金汤匙的烦恼" },
    { evid: "marc_richkid_2", minAge: 22, title: "挥霍与第一次跌倒" },
    { evid: "marc_richkid_3", minAge: 30, title: "家族企业的烂摊子" },
    { evid: "marc_richkid_4", minAge: 38, title: "证明自己，还是彻底败光" },
    { evid: "marc_richkid_5", minAge: 46, title: "重建，还是守成" }
  ],
  reckon: s => {
    const broke = arcChose(s, "rk_squander") || arcChose(s, "rk_blew_it") || has(s, "been_bankrupt");
    const transformed = arcChose(s, "rk_transform");
    const proved = arcChose(s, "rk_prove") || arcChose(s, "rk_rebuild");
    if (transformed) return "你没守住父亲那一摊，而是把它彻底掀翻重做了。新的产业立起来了，财报很漂亮，行业里都念你的名字。只是当年劝你别冒险的老人一个个离场，连陈叔最后也没站在你这边——你活成了一个比父亲更陌生的人。证明了自己，却众叛亲离。";
    if (proved) return "你用真本事把家业从泥里拔了出来，没人再说你只是个有钱人家的孩子。可午夜照镜子时，你看见的眉眼、语气、连敲桌子的手势，都和父亲一模一样。你赢了，赢成了你曾经最想逃开的那个人的影子。";
    if (broke) return "金山银山，到底还是从你手里漏光了。债主散去，名字从富人榜上消失，你第一次坐上了拥挤的地铁。没人再围着你转，也没人再对你说「就你也配」。败光了家产，你终于活成了一个普通人——这味道苦，却是头一回真实。";
    return "你没把家业做大，也没把它败光。守成无功，账面平平，父亲生前的产业在你手里不温不火地活着。你没成为传奇，但你守住了底线，没让那些信你的人寒心。平庸地接住了一切，也算一种交代。";
  }
});

EVENTS.push(
  {
    id: "marc_richkid_1", module: "mainarc", importance: "arc", arc: "richkid_rebuild",
    title: "📖 第一幕 · 含着金汤匙的烦恼",
    text: s => `十八岁生日，父亲${castName(s, "father", "父亲")}把一辆车的钥匙拍在你手里，又当着满桌人说：「我儿子嘛，将来公司随便挑个位置坐。」众人笑着鼓掌。${castName(s, "steward", "陈叔")}在一旁低声提醒你少喝点。${castName(s, "pal", "阿凯")}已经在群里招呼夜店的局了。你忽然意识到：所有人都觉得你这辈子已经定了——一个不用奋斗、也奋斗不出名堂的少爷。`,
    choices: [
      { label: "我偏要靠自己证明点什么", effect: s => { arcChoose(s, "rk_ambition", { tension: 8, memory: { id: "rk_vow", intensity: 50, text: "你暗暗发誓，不要做父亲影子里的废物。" } }); add(s, "stress", 5); if (typeof addStigma === "function") addStigma(s, "silver_spoon"); return "你把车钥匙塞回抽屉。没人信你这句话，连陈叔都只是笑笑。可那股不服气，从这天起在心里烧着。"; } },
      { label: "享受人生，钱就是用来花的", effect: s => { arcChoose(s, "rk_enjoy", { tension: 4, memory: { id: "rk_party", intensity: 40, text: "你接受了少爷的身份，及时行乐。" } }); add(s, "mood", 8); add(s, "cash", -Math.round(50000 * (s.world ? s.world.priceIndex : 1))); bumpThread(s, "pal_revelry", 14, { actors: ["pal"] }); return `你拉上${castName(s, "pal", "阿凯")}直奔夜店，一晚上花掉一个普通人半年的工资。爽是真爽，空也是真空。`; } },
      { label: "听陈叔的，先去公司基层熟悉业务", effect: s => { bumpThread(s, "steward_bond", 12, { actors: ["steward"] }); arcChoose(s, "rk_humble", { tension: 2, memory: { id: "rk_grassroots", intensity: 35, text: "你愿意从基层学起，哪怕被人当镀金。" } }); add(s, "knowledge", 3); if (typeof addExperience === "function") addExperience(s, "family_business"); return `${castName(s, "steward", "陈叔")}带你下了车间。工人见你都客气得过分，背后却嘀咕：「少爷来体验生活的。」你第一次尝到，被人看轻是什么滋味。`; } }
    ]
  },
  {
    id: "marc_richkid_2", module: "mainarc", importance: "turning", arc: "richkid_rebuild",
    title: "📖 第二幕 · 挥霍与第一次跌倒",
    text: s => `这几年你声名在外——不是因为本事，是因为能花。${castName(s, "pal", "阿凯")}最近神神秘秘，说有个稳赚不赔的局，缺个能压上大注的「自己人」。${castName(s, "love", "苏苏")}却拉住你：「你确定他是冲着你，还是冲着你的钱？」你站在两个人中间，第一次要为自己的判断负责。`,
    choices: [
      { label: "梭哈跟阿凯赌一把大的", effect: s => { const loss = Math.round((s.cash || 0) * 0.5); add(s, "cash", -loss); arcChoose(s, "rk_squander", { tension: 14, memory: { id: "rk_scam", intensity: 65, text: "你被狐朋狗友坑了一大笔，第一次跌得很痛。", tags: ["arc", "turning"] } }); bumpThread(s, "pal_revelry", 16, { actors: ["pal"] }); if (s.cast && s.cast.pal) s.cast.pal.trust = Math.max(0, (s.cast.pal.trust || 30) - 20); s.timeline.push({ age: s.age, text: `你跟着${castName(s, "pal", "阿凯")}压上重注，结果项目是个局。¥${loss.toLocaleString()}打了水漂，阿凯人间蒸发。` }); add(s, "mood", -10); return `钱没了，阿凯也没了。你站在空荡荡的账户面前，第一次明白：有些人围着你，从来不是因为你。`; } },
      { label: "听苏苏的，把钱投进她看好的小项目", cond: s => true, effect: s => { bumpThread(s, "love_trust", 16, { actors: ["love"] }); arcChoose(s, "rk_sprout", { tension: 6, memory: { id: "rk_first_bet", intensity: 45, text: "你第一次为一个靠谱的人和事下注。" } }); if (s.cast && s.cast.love) s.cast.love.trust = Math.min(100, (s.cast.love.trust || 60) + 10); add(s, "insight", 3); add(s, "cash", -Math.round(80000 * (s.world ? s.world.priceIndex : 1))); return `${castName(s, "love", "苏苏")}带你见了她的团队，几个搞技术的年轻人眼里有光。钱投出去了，回报未知，但你头一回觉得自己是在「做事」，不是在「烧钱」。`; } },
      { label: "谁的局都不进，先收着钱观望", effect: s => { arcChoose(s, "rk_cautious", { tension: -2 }); add(s, "mood", -2); add(s, "insight", 2); return "你婉拒了所有人。阿凯说你怂，苏苏说你稳。你自己也分不清，这是清醒，还是又一次不敢。"; } }
    ]
  },
  {
    id: "marc_richkid_3", module: "mainarc", importance: "turning", arc: "richkid_rebuild",
    title: "📖 第三幕 · 家族企业的烂摊子",
    text: s => `父亲${castName(s, "father", "父亲")}病倒了。一夜之间，家族企业那摊子落到你头上——账上窟窿不小，老厂设备落后，行业还在下行。${castName(s, "steward", "陈叔")}把财报摊开：「老爷子撑着的时候没人敢说，现在……得有人接。」董事会的目光齐刷刷看向你，那眼神写着同一句话：就你？`,
    choices: [
      { label: "亲自接手，把烂摊子一点点啃下来", effect: s => { arcChoose(s, "rk_take_over", { tension: 12, memory: { id: "rk_inherit", intensity: 70, text: "你扛起了家族企业的烂摊子。", tags: ["arc", "turning"] } }); flag(s, "family_helm"); if (typeof addExperience === "function") addExperience(s, "family_business"); if (typeof addInfluence === "function") addInfluence(s, "industry", 4); add(s, "stress", 12); add(s, "health", -3); bumpThread(s, "steward_bond", 14, { actors: ["steward"] }); s.timeline.push({ age: s.age, text: "你正式接手家族企业，背上了父亲留下的债与厂。" }); return `你在董事会上签了字。陈叔留下来帮你，但其他人都在等着看你笑话。从今天起，几百号人的饭碗压在你肩上。`; } },
      { label: "请职业经理人打理，自己当甩手掌柜", effect: s => { arcChoose(s, "rk_delegate", { tension: 4 }); add(s, "mood", 4); add(s, "cash", -Math.round(120000 * (s.world ? s.world.priceIndex : 1))); if (s.cast && s.cast.steward) s.cast.steward.pressure = Math.min(100, (s.cast.steward.pressure || 40) + 20); return `你把担子全甩给陈叔和外聘团队，自己签字盖章了事。公司还在转，可「这家不过是个挂名少爷」的说法，也坐实了。`; } },
      { label: "干脆卖掉公司，落袋为安去躺平", effect: s => { const got = (typeof bigWindfall === "function") ? bigWindfall(s, 1200000) : 3000000; add(s, "cash", got); arcChoose(s, "rk_sell_off", { tension: 8, memory: { id: "rk_cashout", intensity: 60, text: "你卖掉了父亲一手创下的家业。" } }); if (typeof addStigma === "function") addStigma(s, "sold_legacy"); if (s.cast && s.cast.father) s.cast.father.trust = Math.max(0, (s.cast.father.trust || 50) - 25); s.timeline.push({ age: s.age, text: `你把家族企业打包卖掉，到账 ¥${got.toLocaleString()}。父亲那一代人的心血，换成了你账上的数字。` }); return `合同签完，钱进了账。你解脱了，可父亲在病床上没再跟你说过一句话。`; } }
    ]
  },
  {
    id: "marc_richkid_4", module: "mainarc", importance: "turning", arc: "richkid_rebuild",
    title: "📖 第四幕 · 证明自己，还是彻底败光",
    text: s => { const helm = arcChose(s, "rk_take_over"); return helm
      ? `接手几年，公司在你手里勉强续命，但要真活过来，得砸钱赌一次转型——把老厂改成新方向。${castName(s, "love", "苏苏")}劝你赌，${castName(s, "steward", "陈叔")}劝你稳。这一注押下去，是证明自己，还是把最后的家底也填进去？`
      : `你早早把公司脱了手，这些年靠着家底吃利息，过得舒坦。可${castName(s, "love", "苏苏")}问你：「你打算这样啃到什么时候？」镜子里那张脸，越来越像你最看不起的那种人。你忽然想：要不要，趁还没老，亲手做成一件事？`; },
    choices: [
      { label: "压上全部身家，赌一次彻底的转型", effect: s => { const helm = arcChose(s, "rk_take_over"); const stake = Math.round((s.cash || 0) * 0.7); add(s, "cash", -stake); const win = rnd(0.45 + (helm ? 0.1 : 0) + (typeof luckBias === "function" ? luckBias(s) : 0)); if (win) { arcChoose(s, "rk_prove", { tension: 14, memory: { id: "rk_turnaround", intensity: 80, text: "你用真本事赌赢了转型，证明了自己。", tags: ["arc", "turning"] } }); flag(s, "rk_won"); if (typeof addExperience === "function") addExperience(s, "founder"); if (typeof addInfluence === "function") addInfluence(s, "industry", 8); const got = (typeof bigWindfall === "function") ? bigWindfall(s, stake) : stake * 2; add(s, "cash", got); s.timeline.push({ age: s.age, text: `你赌赢了。砸下去的 ¥${stake.toLocaleString()}换来了起死回生，公司转型成功。` }); return `订单回来了，工人重新满负荷，连当初看你笑话的董事都改了口。你第一次，是靠本事赢的。`; } arcChoose(s, "rk_blew_it", { tension: 16, memory: { id: "rk_bust", intensity: 85, text: "你把最后的家底赌进去，彻底败光了。", tags: ["arc", "turning", "scar"] } }); flag(s, "been_bankrupt"); if (typeof addScar === "function") addScar(s, "bankrupt"); add(s, "cash", -Math.max(0, Math.round((s.cash || 0) * 0.8))); add(s, "mood", -14); add(s, "health", -5); s.timeline.push({ age: s.age, text: `转型失败，资金链断裂。你赌上的 ¥${stake.toLocaleString()}和父亲的家业，一起没了。` }); return `项目黄了，债主上门。家产从你手里彻底漏光。你输得干干净净——可至少这一次，是你自己做的决定。`; } },
      { label: "稳住别折腾，守着现有的家底过", effect: s => { arcChoose(s, "rk_hold", { tension: -4 }); add(s, "mood", 2); add(s, "stress", -4); bumpThread(s, "steward_bond", 8, { actors: ["steward"] }); return `你听了陈叔的，没冒险。公司不上不下地活着，你的日子安稳，只是那个「证明自己」的念头，又被你按了回去。`; } },
      { label: "继续躺平啃老，及时行乐", cond: s => !arcChose(s, "rk_take_over"), effect: s => { arcChoose(s, "rk_idle", { tension: 6, memory: { id: "rk_rotten", intensity: 50, text: "你选择了彻底躺平，啃着老本过日子。" } }); add(s, "mood", 5); add(s, "cash", -Math.round((s.cash || 0) * 0.15)); if (s.cast && s.cast.love) s.cast.love.trust = Math.max(0, (s.cast.love.trust || 60) - 20); return `你又回到了纸醉金迷的日子。钱在慢慢变少，苏苏的失望在慢慢变多。你假装看不见这两件事。`; } }
    ]
  },
  {
    id: "marc_richkid_5", module: "mainarc", importance: "turning", arc: "richkid_rebuild",
    title: "📖 第五幕 · 重建，还是守成",
    text: s => { const won = arcChose(s, "rk_prove"); const broke = arcChose(s, "rk_blew_it") || has(s, "been_bankrupt"); return won
      ? `如今没人再质疑你的能力。摆在面前的路口是：守着这份家业稳稳传下去，还是趁势把它推向一个全新的产业，赌一次更大的格局？${castName(s, "steward", "陈叔")}已经老了，他希望你别再冒险。`
      : broke
      ? `败光之后，你从头活了几年。${castName(s, "love", "苏苏")}还在身边。如今攒下一点本钱，你又站在了那个老问题前：是认命做个普通人，还是再赌一次、把当年丢的东西重新做回来？`
      : `半生过去，账面平平。${castName(s, "steward", "陈叔")}临走前问你：「这辈子，你到底想做成点什么？」你这才意识到，自己还有最后一次机会，去决定要被人记成什么样的人。`; },
    choices: [
      { label: "（影响力够）把家族企业转型，做成一个新产业", cond: s => (typeof influenceTier === "function" && influenceTier(s) >= 3), effect: s => { arcChoose(s, "rk_transform", { tension: 16, memory: { id: "rk_new_industry", intensity: 90, text: "你不再守成，而是把家业掀翻重做，立起了一个新产业。", tags: ["arc", "world", "turning"] } }); const target = (s.age % 2 === 0) ? "ai" : "manufacturing"; if (typeof addWorldImpact === "function") addWorldImpact(s, { industry: target, field: "transformation", delta: 14, note: "你把家族老厂彻底转型，抬高了整个赛道" }); if (typeof addInfluence === "function") { addInfluence(s, "capital", 10); addInfluence(s, "industry", 12); } if (typeof addExperience === "function") addExperience(s, "founder"); if (s.cast && s.cast.steward) s.cast.steward.trust = Math.max(0, (s.cast.steward.trust || 65) - 20); const got = (typeof bigWindfall === "function") ? bigWindfall(s, 5000000) : 12000000; add(s, "cash", got); s.timeline.push({ age: s.age, text: `你把家族企业转型成了 ${target === "ai" ? "AI" : "高端制造"} 新产业，行业格局因你而变，身价 ¥${got.toLocaleString()}。` }); return `你掀翻了父亲那张老桌子，立起了一张属于自己的。新产业成了，行业里都念你的名字——只是陈叔摇着头离开了，他说他不认识你了。`; } },
      { label: "守住父亲的产业，稳稳传下去", effect: s => { arcChoose(s, "rk_rebuild", { tension: -6, memory: { id: "rk_steady", intensity: 60, text: "你选择守成，把家业稳稳接住、传下去。" } }); flag(s, "rk_won"); if (typeof addInfluence === "function") addInfluence(s, "industry", 5); if (typeof addExperience === "function") addExperience(s, "family_business"); add(s, "mood", 6); bumpThread(s, "steward_bond", 10, { actors: ["steward"] }); s.timeline.push({ age: s.age, text: "你没去赌更大的，而是把家族企业稳稳守住、传了下去。" }); return `你把厂房、订单、和一帮老员工都稳稳接住了。没有惊天动地，但陈叔拍着你肩膀说：「老爷子要是看见，会放心的。」`; } },
      { label: "不折腾了，做个安稳的普通人", effect: s => { arcChoose(s, "rk_let_go", { tension: -8 }); add(s, "mood", 4); add(s, "stress", -6); bumpThread(s, "love_trust", 10, { actors: ["love"] }); return `你放下了证明自己的执念，过起了寻常日子。${castName(s, "love", "苏苏")}说，这是她认识你以来，你笑得最松弛的一年。`; } }
    ]
  }
);
