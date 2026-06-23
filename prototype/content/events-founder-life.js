"use strict";
/* =====================================================================
 * content/events-founder-life.js —— 留学 / 家庭 / 社交 → 创业 的桥接事件
 * 让人生的三条支线（出国回来的视野、家庭的支持或牵绊、人脉带来的资源）
 * 全都汇流到「创业」这件事上：每个事件都至少滴入一项创业准备度(addFounderPrep)，
 * 并通过 entrepreneurialRole 标注它在创业链路里扮演的角色：
 *   resource(攒底牌) / trigger(推你下场) / cost(代价/牵绊) / world(外部变量)
 * 约定：label 普通字符串(不插值)；金额 Math.round(数*priceIndex)；effect 返回中文。
 * ===================================================================== */

EVENTS.push(
  /* ============ 留学线：海归带回的视野、跨境机会、海外人脉 ============ */
  {
    id: "ev_fl_returnee_startup", module: "career", ambient: true, importance: "scene",
    entrepreneurialRole: "trigger",
    cond: s => (has(s, "haigui_back") || has(s, "emigrated") || has(s, "abroad_done") || has(s, "study_done")) && s.age >= 24 && !(s.startup && s.startup.fulltime),
    title: "🌏 海归的入局邀约",
    text: s => `你刚从海外回来，履历上那段经历像一张通行证：饭局上，一位国内的老板看着你的名片，半开玩笑半认真地说，「你这视野，留在公司里可惜了。我这边有个项目，缺个能挑大梁的人——出来一起做？」桌上几双眼睛都在看你。你忽然意识到，别人请你出来，凭的正是你这几年在外头攒下的东西。`,
    choices: [
      { label: "接住这份背书，认真盘一盘", effect: s => { if (typeof addFounderPrep === "function") { addFounderPrep(s, "industryInsight", 12); addFounderPrep(s, "teamTrust", 10); } flag(s, "founder_pushed"); add(s, "mood", 4); if (typeof bumpThread === "function") bumpThread(s, "returnee_offer", 12, { status: "open" }); return `你没有当场答应，但也没有推开。回去的路上你反复想：海外这几年最值钱的不是文凭，是别人看你的眼神变了。这次邀约，把"自己干"这个念头，第一次推到了台面上。`; } },
      { label: "先谢过，时机还没到", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 5); add(s, "insight", 1); return `你客气地推了。背书是好东西，但你清楚自己手里还缺底牌——光有视野，撑不起一个公司。你把这份人情记下了，留给更有把握的那天。`; } }
    ]
  },
  {
    id: "ev_fl_crossborder_insight", module: "study", ambient: true, importance: "scene",
    entrepreneurialRole: "resource",
    cond: s => (has(s, "haigui_back") || has(s, "emigrated") || has(s, "abroad_done") || has(s, "study_done")) && s.age >= 23,
    title: "📦 海外看见的那道缝",
    text: s => `在国外的日子里，你逛超市、刷本地的购物 App、跟同学聊起家乡的东西，越想越觉得不对劲：这边卖得火的某类商品，国内还几乎没人做；而国内便宜又好的东西，这边的人愿意花三倍价钱买。一来一回之间，是一条肉眼可见的缝。出海、跨境——这些词第一次从新闻里变成了你自己的机会。`,
    choices: [
      { label: "把这条缝记进创业本子里", effect: s => { if (typeof addFounderPrep === "function") { addFounderPrep(s, "industryInsight", 12); addFounderPrep(s, "salesChannel", 8); } add(s, "insight", 2); if (typeof addExperience === "function") addExperience(s, "cross_border"); return `你开了个备忘录，把价差、品类、能想到的渠道一条条记下来。这不是空想——你亲眼见过两边的货架。懂行，从你能说清"钱从哪儿赚"开始。`; } },
      { label: "有意思，但只当见闻", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 4); add(s, "mood", 2); return `你把它当成了一段有趣的观察，饭桌上的谈资。机会从你眼前飘过，但至少，你的脑子里多了一根"哪里有钱赚"的弦。`; } }
    ]
  },
  {
    id: "ev_fl_oversea_network", module: "study", ambient: true, importance: "scene",
    entrepreneurialRole: "resource",
    cond: s => (has(s, "haigui_back") || has(s, "emigrated") || has(s, "abroad_done") || has(s, "study_done")) && s.age >= 23,
    title: "🤝 海外华人圈的牌局",
    text: s => `一场校友聚会，把你拉进了一个意想不到的圈子：有人在做仓储物流，有人手里攥着工厂资源，有人专门帮人对接海外的买家。几杯酒下肚，大家半真半假地说，「咱们这些人凑一块儿，缺的就是一个肯牵头的。」你这才发现，留学最大的红利，是这一桌随时能调动的人。`,
    choices: [
      { label: "用心维护这桌人脉", effect: s => { if (typeof addFounderPrep === "function") { addFounderPrep(s, "teamTrust", 10); addFounderPrep(s, "salesChannel", 9); } add(s, "network", 6); if (typeof bumpThread === "function") bumpThread(s, "oversea_circle", 10, { status: "open" }); return `你成了群里最热心的那个——谁有需求你第一个转发，谁回国你接机请饭。资源不会自己长腿找你，但你把这桌人焐热了，将来真要起盘，这就是你的第一批战友和渠道。`; } },
      { label: "点头之交就够了", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "teamTrust", 3); add(s, "network", 2); return `你存了几个微信，礼貌地点了几个赞，然后各回各家。人脉这东西，不维护就是一串躺在通讯录里的名字——你心里清楚，但暂时没那个力气。`; } }
    ]
  },

  /* ============ 家庭线：配偶的支持或反对、卖房、父母的钱 ============ */
  {
    id: "ev_fl_spouse_support", module: "family", ambient: true, importance: "scene",
    entrepreneurialRole: "trigger",
    cond: s => (has(s, "married") || has(s, "has_kid")) && s.age >= 25 && !(s.startup && s.startup.fulltime),
    title: "🕯️ 枕边的那句话",
    text: s => `深夜，你又一次对着天花板发呆。身边的人忽然开口：「我知道你心里一直憋着件事。钱的事别太担心，家里还撑得住一阵——你要真想试，就去试吧，别等到老了才后悔。」黑暗里，这句话比任何投资人的钱都让你心头一热。`,
    choices: [
      { label: "接受这份支持，放手一搏", effect: s => { if (typeof addFounderPrep === "function") { addFounderPrep(s, "riskTolerance", 14); addFounderPrep(s, "teamTrust", 10); } flag(s, "spouse_backing"); add(s, "mood", 8); if (typeof bumpThread === "function") bumpThread(s, "spouse_backing", 14, { status: "open" }); return `你握住了那只手。后路有人替你守着，前路的胆气就足了一大截。从今往后，这场仗不只是你一个人在打——这是最硬的底气。`; } },
      { label: "不想拖累家人，再缓缓", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 3); add(s, "mood", 2); add(s, "stress", 2); return `你轻声说「再等等，等我更有把握」。你舍不得拿一家人的安稳去赌。这份克制很温柔，但夜深人静时，那个念头还是会回来挠你。`; } }
    ]
  },
  {
    id: "ev_fl_spouse_against", module: "family", ambient: true, importance: "scene",
    entrepreneurialRole: "cost",
    cond: s => (has(s, "married") || has(s, "has_kid")) && s.age >= 25 && !(s.startup && s.startup.fulltime),
    title: "⚖️ 餐桌上的争执",
    text: s => `你刚把"想出来创业"几个字说出口，餐桌上的气氛就凝住了。「房贷、孩子、老人，哪一样不要钱？你拿什么去赌？」对方的声音里有怒，更多的是怕。「我要的不多，就要个稳定。」一句话，把你满腔的热血浇了个透心凉。`,
    choices: [
      { label: "听家人的，先把日子稳住", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", -8); add(s, "mood", -3); add(s, "stress", -2); return `你叹了口气，把那份计划书又塞回了抽屉。家和万事兴，你说服自己。心是凉了半截，但至少，家里的灯还是暖的。`; } },
      { label: "坚持己见，这次我说了算", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 6); if (typeof bumpThread === "function") bumpThread(s, "marriage_crack", 10, { status: "open" }); add(s, "stress", 6); add(s, "mood", -4); return `你拍了板：「这事我想清楚了。」饭没吃完，对方摔门进了卧室。你赢了这场争论，却在婚姻里凿开了一道裂缝——你只能赌，将来用成绩把它补回来。`; } }
    ]
  },
  {
    id: "ev_fl_sell_house", module: "family", ambient: true, importance: "turning",
    entrepreneurialRole: "trigger",
    cond: s => (has(s, "married") || has(s, "has_kid")) && has(s, "has_house") && s.age >= 26 && !(s.startup && s.startup.fulltime),
    title: "🏠 卖房 all-in",
    text: s => { const got = Math.round(900000 * (s.world ? s.world.priceIndex : 1)); return `项目缺一笔启动资金，你算来算去，唯一能凑出大钱的，只剩那套房。中介估了价，到手大约 ¥${got.toLocaleString()}。卖了，你和家人就成了租房客，输了连个窝都没有；不卖，这个机会大概率就这么过去了。手里的房产证，从没像今晚这样烫手。`; },
    choices: [
      { label: "卖房 all-in，把后路全断了", effect: s => { const got = Math.round(900000 * (s.world ? s.world.priceIndex : 1)); if (s.flags) delete s.flags.has_house; add(s, "cash", got); if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 20); flag(s, "founder_pushed"); flag(s, "all_in"); add(s, "stress", 12); if (s.timeline) s.timeline.push({ age: s.age, text: `你卖掉了房子，把 ¥${got.toLocaleString()} 全砸进了创业。退无可退，只能往前。` }); return `签字那一刻，手在抖。房没了，但 ¥${got.toLocaleString()} 进了账，你也彻底没了退路。背水一战——从今天起，你不是在追梦，是在为一家人的安身立命搏命。`; } },
      { label: "不卖，房子是全家最后的底", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", -4); add(s, "mood", 2); add(s, "insight", 1); return `你最终没舍得。这套房是一家人遮风挡雨的最后一道墙，不能拿它去赌。机会或许就这么溜了，但你守住了让全家睡安稳的底线。`; } }
    ]
  },
  {
    id: "ev_fl_parent_fund", module: "family", ambient: true, importance: "turning",
    entrepreneurialRole: "resource",
    cond: s => (has(s, "married") || has(s, "has_kid")) && s.age >= 24 && !(s.startup && s.startup.fulltime),
    title: "💴 父母递来的存折",
    text: s => { const give = Math.round(400000 * (s.world ? s.world.priceIndex : 1)); return `父母把你叫回家，桌上放着一个旧存折。「这是我俩攒了一辈子的，养老够用了，剩下的你拿去。」那一刻你鼻子一酸——这哪是养老金，这是他们大半辈子的省吃俭用。¥${give.toLocaleString()}，沉得你几乎不敢伸手。`; },
    choices: [
      { label: "含泪收下，绝不能辜负", effect: s => { const give = Math.round(400000 * (s.world ? s.world.priceIndex : 1)); add(s, "cash", give); if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 10); add(s, "stress", 8); add(s, "mood", -2); if (typeof bumpThread === "function") bumpThread(s, "parent_fund_debt", 12, { status: "open" }); if (s.timeline) s.timeline.push({ age: s.age, text: `父母拿出 ¥${give.toLocaleString()} 养老钱支持你创业，这份债你一辈子都想还清。` }); return `你接过存折，重重点了点头。¥${give.toLocaleString()} 进了账，可这笔钱比任何贷款都压得你喘不过气——它没有利息，却背着两位老人的余生。你只能赢，输不起。`; } },
      { label: "推回去，不能动他们的养老钱", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 3); add(s, "mood", 3); return `你把存折塞回母亲手里：「钱我自己想办法，你俩好好养老。」她红着眼眶没再坚持。你少了一笔启动资金，但你睡得着觉——有些钱，宁可不要。`; } }
    ]
  },

  /* ============ 社交线：投资人引荐、供应链牵线、灰色门路 ============ */
  {
    id: "ev_fl_meet_investor", module: "relation", ambient: true, importance: "scene",
    entrepreneurialRole: "resource",
    cond: s => (s.network || 0) >= 25 && s.age >= 24 && !(s.startup && s.startup.fulltime),
    title: "🍷 被引荐的那个人",
    text: s => `一个老朋友把你拉到饭局的角落，低声说：「介绍你认识个人——他手里有钱，专投早期项目，最近正缺看得顺眼的人和方向。」对面那位递来名片，笑得客气而精明：「听说你有点想法？哪天约个咖啡，聊聊。」你心跳快了半拍——这可能是离"真金白银"最近的一次。`,
    choices: [
      { label: "认真对接，准备一份说法", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "teamTrust", 9); flag(s, "investor_lead"); add(s, "network", 4); if (typeof bumpThread === "function") bumpThread(s, "investor_lead", 10, { status: "open" }); add(s, "mood", 4); return `你存好名片，回去就开始打磨自己的"故事"。投资人不会投一个含糊的念头，但你已经握住了一条真实的线——能不能拉到钱，看你接下来拿不拿得出东西。`; } },
      { label: "客套两句，没当回事", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "teamTrust", 2); return `你寒暄几句，名片随手揣进了口袋，回家就忘在了某件外套里。一条可能改变命运的线，被你的犹豫轻轻松开了。`; } }
    ]
  },
  {
    id: "ev_fl_find_supplier", module: "relation", ambient: true, importance: "scene",
    entrepreneurialRole: "resource",
    cond: s => (s.network || 0) >= 25 && s.age >= 23 && !(s.startup && s.startup.fulltime),
    title: "🔗 朋友牵的那条线",
    text: s => `一个在行业里摸爬滚打多年的朋友拍着你肩膀：「你要是真打算做，供货和渠道别自己瞎撞——我手里有几家靠谱的，价格实在、交期稳，我带你去见见。」对做生意的人来说，这话的分量，不亚于天上掉下一块拼图。`,
    choices: [
      { label: "登门拜访，把关系处实", effect: s => { if (typeof addFounderPrep === "function") { addFounderPrep(s, "salesChannel", 11); addFounderPrep(s, "industryInsight", 7); } add(s, "network", 3); if (typeof bumpThread === "function") bumpThread(s, "supplier_line", 10, { status: "open" }); return `你跟着朋友跑了几趟，喝了几顿茶，把人和货都摸了个底。供应链这道坎，多少创业者栽在上面，而你靠一个朋友，提前把它趟平了大半。`; } },
      { label: "记下联系方式，以后再说", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "salesChannel", 4); return `你把几个联系方式存进了手机，谢过朋友。线是接上了，但没去维护——等真要用的时候，还得重新热一遍场子。`; } }
    ]
  },
  {
    id: "ev_fl_gray_broker", module: "relation", ambient: true, importance: "scene",
    entrepreneurialRole: "cost",
    cond: s => (s.network || 0) >= 25 && s.age >= 24 && !(s.startup && s.startup.fulltime),
    title: "🚬 灰色中间人的耳语",
    text: s => { const quick = Math.round(150000 * (s.world ? s.world.priceIndex : 1)); return `饭局散后，一个面熟却说不清底细的人把你拉到一边，压低嗓子：「正经路子赚钱太慢。我手里有条门道，来钱快，半年就能见 ¥${quick.toLocaleString()}——就是不太上得了台面，你敢不敢碰？」烟雾里，他的笑意味深长。`; },
    choices: [
      { label: "碰一把，先把启动资金弄到手", effect: s => { const quick = Math.round(150000 * (s.world ? s.world.priceIndex : 1)); add(s, "cash", quick); if (typeof addFounderPrep === "function") addFounderPrep(s, "moralDebt", 15); if (typeof addStigma === "function") addStigma(s, "gray_suspect"); add(s, "stress", 6); add(s, "mood", -2); if (typeof bumpThread === "function") bumpThread(s, "gray_money", 14, { status: "open" }); return `你揣着不安点了头。¥${quick.toLocaleString()} 很快到账，启动资金有了着落。但从这一刻起，你的手上沾了洗不掉的灰——快钱的代价，往往要在你最风光时来讨。`; } },
      { label: "拒了，钱要赚得干净", effect: s => { if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", -3); add(s, "insight", 2); add(s, "mood", 2); return `你摆摆手走开了。少了一条来钱的捷径，往后的路会更难走、更慢，但你心里清楚：创业这事，赢了要睡得着，输了要对得起良心。`; } }
    ]
  }
);
