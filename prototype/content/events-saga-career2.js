"use strict";
/* =====================================================================
 * content/events-saga-career2.js —— 内容模块：多幕连续剧式戏剧事件（saga）
 * ---------------------------------------------------------------------
 * 经典 <script>，运行在全局作用域。直接向核心层已定义的全局 EVENTS 数组
 * 追加事件（EVENTS.push({...})）。复用全局 helper：
 *   add / flag / has / pick / rnd / byClass / classTier /
 *   socialShift / socialBoostRole / bumpMomentum / genName。
 *
 * saga = 跨越多年、层层升级、最后大结局的剧情线，flag 串联，
 *   引擎会优先推进 module:"saga"。本文件写两条 saga（聚焦做事/政绩/
 *   人情/清廉vs诱惑、职场上位修罗场，规避政治敏感题材）：
 *     1) official —— 官场二十年沉浮线
 *     2) corpking —— 打工皇帝线
 * 内部辅助函数前缀 car2_；事件 id 前缀 ev_sagacar2_。
 * ===================================================================== */

// —— 内部辅助：金额本地化 ——
function car2_money(n) {
  const v = Math.round(n);
  if (Math.abs(v) >= 100000000) return (v / 100000000).toFixed(2).replace(/\.00$/, "") + "亿";
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  return "¥" + v.toLocaleString();
}
// —— 内部辅助：拿/存关键人物名 ——
function car2_name(s, key) {
  if (!s["sg_" + key]) s["sg_" + key] = genName("cn", "男");   // 本线以「他」称呼，固定男性名免错位
  return s["sg_" + key];
}
// —— 内部辅助：升一级（封顶副厅 6）——
function car2_rankUp(s) { s.civilRank = Math.min(6, (s.civilRank || 0) + 1); }
// —— 内部辅助：官场级别中文名 ——
function car2_rankName(s) {
  const names = ["科员", "副科", "正科", "副处", "正处", "副厅", "正厅"];
  return names[Math.max(0, Math.min(6, s.civilRank || 0))];
}

/* =====================================================================
 * SAGA 一、official —— 官场二十年沉浮线（4 幕）
 *   施展抱负的机会 → 棘手大事考验政绩/人情/清廉 → 站队与诱惑 →
 *   结局：封疆大吏问心无愧 / 同流合污最终落马 / 激流勇退提前退休
 * ===================================================================== */

// —— 第1幕：一纸任命，机会还是火坑 ——
EVENTS.push({
  id: "ev_sagacar2_official_s1",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "civil_servant") && s.age >= 30 && s.age <= 56 && !has(s, "saga_official_s1") && !has(s, "saga_official_done"),
  title: "🏛️ 一纸调令，把你推到了风口",
  text: (s) => {
    const boss = car2_name(s, "of_boss");
    return `组织部的谈话来得突然。${boss}部长把茶杯往桌上一搁：「年轻人，给你压副担子——清水镇，全市垫底的烂摊子。班子涣散、债台高筑、信访不断。你去，是组织看重你。干好了，前途无量；干砸了……」他没把话说完。你捏着那纸任命，心跳得厉害：这是施展抱负的天梯，还是一口深不见底的火坑？`;
  },
  choices: [
    { label: "迎难而上，主政一方真刀真枪干一番", effect: (s) => {
        car2_rankUp(s);
        add(s, "mood", 14); add(s, "stress", 16); add(s, "reputation", 8); add(s, "strategy", 4);
        socialBoostRole(s, "leader", 6);
        flag(s, "saga_official_s1");
        flag(s, "saga_official_ambition");
        car2_name(s, "of_boss");
        return `你接了。第一天到任，你没坐进办公室，直接下村蹲点，三个月跑遍了每个自然村。你顶着压力砍掉吃空饷的关系户，盘活了烂尾的工业园。镇上人开始念叨「来了个肯干事的」。你升任 ${car2_rankName(s)}，名声起来了——但你也踩了不少人的脚，有些账，他们记着。`;
      } },
    { label: "稳妥求安，先把人情都打点圆满", effect: (s) => {
        add(s, "mood", 6); add(s, "stress", 4); add(s, "network", 12); add(s, "charm", 3);
        socialBoostRole(s, "leader", 3);
        flag(s, "saga_official_s1");
        flag(s, "saga_official_safe");
        car2_name(s, "of_boss");
        return `你深谙官场之道，先不烧那三把火。逐个拜码头、认山头，把镇里盘根错节的人情先理顺。会开得四平八稳，谁的面子都不驳。「这后生会做人。」老同志这么评价你。你没出什么政绩，但也没得罪谁——在这浑水里，先学会活下来。`;
      } },
    { label: "婉拒这趟浑水，宁可被边缘化坐冷板凳", effect: (s) => {
        add(s, "mood", -8); add(s, "stress", -10); add(s, "reputation", -6); add(s, "insight", 4);
        flag(s, "saga_official_s1");
        flag(s, "saga_official_idle");
        car2_name(s, "of_boss");
        const boss = car2_name(s, "of_boss");
        return `你找了个由头，把这副担子推了。${boss}部长意味深长地看了你一眼，没再说话。任命落到了别人头上。你被调去清闲的二线部门，喝茶看报，再没人提你的名字。安稳是安稳了，可那扇通往上层的门，似乎也悄悄对你关上了。`;
      } }
  ]
});

// —— 第2幕：招商引资，政绩与诱惑的钢丝 ——
EVENTS.push({
  id: "ev_sagacar2_official_s2",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_official_s1") && !has(s, "saga_official_s2") && !has(s, "saga_official_done") && s.age >= 32,
  title: "💼 一笔大招商，背后藏着一只信封",
  text: (s) => {
    const boss = has(s, "saga_official_idle") ? "" : "";
    const tycoon = car2_name(s, "of_tycoon");
    if (has(s, "saga_official_idle")) {
      return `坐了几年冷板凳，机会却又找上门。老领导退二线前点名要你回去收拾一桩历史遗留——某安置房项目烂尾八年，几百户居民常年上访。这是块烫手山芋，啃下来你就翻身。可第一天你就发现，背后牵着一个叫${tycoon}的开发商，账目里全是看不见的窟窿。`;
    }
    return `你引来一个大项目：${tycoon}的集团要投资几十亿建产业新城，政绩、税收、就业，样样耀眼。签约前夜，${tycoon}约你「喝茶」，临走时把一个鼓囊囊的信封推到你手边，笑得意味深长：「领导多担待，规划上……稍微通融一点点。一点小意思。」窗外华灯璀璨，那信封烫得你指尖发麻。`;
  },
  choices: [
    { label: "信封原封退回，规划一寸都不让", effect: (s) => {
        add(s, "mood", 4); add(s, "stress", 14); add(s, "reputation", 12); add(s, "strategy", 4); add(s, "cash", -0);
        socialBoostRole(s, "leader", 4);
        flag(s, "saga_official_s2");
        flag(s, "saga_official_clean");
        const tycoon = car2_name(s, "of_tycoon");
        return `你把信封推了回去，话说得客气却不容商量：「${tycoon}总，项目我们欢迎，但规划是红线，谁来都一样。」${tycoon}脸上的笑僵了。项目最终落地，没让一分违规。有人说你「不识抬举」断了财路，可纪委暗访那阵，你是全市少数几个屁股干净、连夜睡得着觉的人。`;
      } },
    { label: "信封收下，规划上「灵活处理」一下", effect: (s) => {
        const bribe = byClass(s, { poor: 800000, mid: 2000000, rich: 5000000 });
        add(s, "assets", bribe);
        add(s, "mood", 10); add(s, "stress", 18); add(s, "reputation", -4);
        flag(s, "saga_official_s2");
        flag(s, "saga_official_dirty");
        car2_rankUp(s);
        const tycoon = car2_name(s, "of_tycoon");
        return `你收下了。规划悄悄调了容积率，多批了两块地，${tycoon}的项目顺风顺水，GDP 数字漂亮得能上简报。你也因「招商有功」升了 ${car2_rankName(s)}，私下多了 ${car2_money(bribe)} 见不得光的进账。台面上风光，可每次手机半夜响，你的心都要漏跳一拍——你知道，从今往后，把柄攥在了别人手里。`;
      } },
    { label: "既要政绩也要干净，逼对方走合规通道", effect: (s) => {
        add(s, "mood", 8); add(s, "stress", 12); add(s, "reputation", 10); add(s, "strategy", 6); add(s, "charm", 3);
        car2_rankUp(s);
        socialBoostRole(s, "leader", 5);
        flag(s, "saga_official_s2");
        flag(s, "saga_official_balance");
        const tycoon = car2_name(s, "of_tycoon");
        return `你既不撕破脸，也不松红线。你把信封笑着退回，转头帮${tycoon}走绿色通道、开协调会、解决真问题，让他合规也能赚到钱。「跟你打交道，累，但踏实。」${tycoon}最后心服口服。项目落地，政绩漂亮，你的手干净，还升了 ${car2_rankName(s)}。这条钢丝，你走得又稳又漂亮。`;
      } }
  ]
});

// —— 第3幕：站队风波，关键一票 ——
EVENTS.push({
  id: "ev_sagacar2_official_s3",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_official_s2") && !has(s, "saga_official_s3") && !has(s, "saga_official_done") && s.age >= 35,
  title: "♟️ 一场风波，逼你必须站队",
  text: (s) => {
    const boss = car2_name(s, "of_boss");
    const tycoon = car2_name(s, "of_tycoon");
    return `多年提携你的${boss}，被人举报、接受调查，全单位风声鹤唳。墙倒众人推，昨天还围着他转的人，今天忙着划清界限。专案组找你谈话，话里有话：「你和他走得近，有些事，是不是该交代交代？」与此同时，曾被你卡过的对手放出风：只要你「配合」补一刀，往上挪一格的位子就是你的。良心和前程，第一次硬碰硬。`;
  },
  choices: [
    { label: "实事求是，不落井下石也不攀咬", effect: (s) => {
        add(s, "mood", 6); add(s, "stress", 18); add(s, "reputation", 14); add(s, "insight", 5);
        flag(s, "saga_official_s3");
        flag(s, "saga_official_loyal");
        const boss = car2_name(s, "of_boss");
        return `你坐在询问室里，腰板挺直：「${boss}同志在工作上提携过我，这我认。但要我编排不存在的事换乌纱帽，做不到。」专案组的人盯了你许久，最终在笔录上写下「态度坦诚」。你没换来升迁，反被有些人记恨「不识时务」。可午夜梦回，你对得起自己的良心——这点，比什么都贵。`;
      } },
    { label: "顺势补刀，递上「材料」换上位", effect: (s) => {
        car2_rankUp(s);
        add(s, "mood", -6); add(s, "stress", 22); add(s, "reputation", -10); add(s, "network", 8);
        flag(s, "saga_official_s3");
        flag(s, "saga_official_betray");
        const boss = car2_name(s, "of_boss");
        return `你权衡再三，把整理好的「情况说明」递了上去——有些是事实，有些是添油加醋。${boss}应声落马，你踩着旧恩人的肩膀，升任 ${car2_rankName(s)}。庆功宴上人人敬你酒，你却觉得那酒苦得发涩。从此你看谁都像看一面镜子，照出自己背叛的样子。这条路，回不了头了。`;
      } },
    { label: "称病避战，谁也不帮谁也不害", effect: (s) => {
        add(s, "mood", -4); add(s, "stress", -8); add(s, "reputation", -4); add(s, "insight", 6);
        flag(s, "saga_official_s3");
        flag(s, "saga_official_dodge");
        return `你递了张病假条，住进医院「疗养」，把自己从这场风暴里彻底摘了出去。不站队、不表态、不沾血。风波过后，你毫发无伤地回到岗位。聪明吗？聪明。可也有人看清了你的滑头，往后但凡要紧的事，再没人敢把后背交给你。明哲保身的代价，是从此被排除在核心圈外。`;
      } }
  ]
});

// —— 第4幕（结局）：封疆大吏 / 落马 / 激流勇退 ——
EVENTS.push({
  id: "ev_sagacar2_official_s4",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_official_s3") && !has(s, "saga_official_done") && s.age >= 40,
  title: "🎬 大结局：二十年宦海，你修成了什么",
  text: (s) => "弹指二十年，宦海沉浮一场。当年那个捏着任命书手心冒汗的年轻人，如今站在了命运的分水岭上。组织的眼睛、群众的口碑、纪委的卷宗，此刻一起摊在你面前——这一生的官，你做成了什么模样？",
  choices: [
    { label: "面对盖棺论定，走完最后一程", effect: (s) => {
        flag(s, "saga_official_done");
        const clean = has(s, "saga_official_clean") || has(s, "saga_official_balance");
        const loyal = has(s, "saga_official_loyal");
        const dirty = has(s, "saga_official_dirty");
        const betray = has(s, "saga_official_betray");
        const dodge = has(s, "saga_official_dodge") || has(s, "saga_official_idle");
        const ambition = has(s, "saga_official_ambition") || has(s, "saga_official_balance");

        // 结局一：清廉+忠义+有政绩 → 封疆大吏，问心无愧
        if (clean && loyal && ambition && rnd(0.8)) {
          car2_rankUp(s);
          const reward = byClass(s, { poor: 200000, mid: 400000, rich: 600000 });
          add(s, "cash", reward);
          add(s, "mood", 30); add(s, "reputation", 30); add(s, "network", 20); add(s, "stress", -18);
          add(s, "strategy", 8); add(s, "insight", 8); add(s, "health", 4);
          socialBoostRole(s, "leader", 16); bumpMomentum(s, 14);
          return `组织的考察结论沉甸甸地落了下来：实绩突出、清正廉洁、群众公认。你升任 ${car2_rankName(s)}，独当一面，封疆一方。走在曾经主政过的土地上，老百姓还认得你、喊得出你的名字。没有万贯家财，可你这一身，干干净净——二十年宦海，你既施展了抱负，又守住了底线。这一程，问心无愧。`;
        }

        // 结局二：贪腐/背叛 → 东窗事发，最终落马
        if ((dirty || betray) && rnd(0.78)) {
          const wipe = Math.round((s.assets || 0) * (0.9 + Math.random() * 0.1));
          add(s, "assets", -wipe);
          add(s, "cash", -Math.round((s.cash || 0) * 0.7));
          s.civilRank = 0;
          if (s.flags) delete s.flags.civil_servant;
          s.job = null;
          add(s, "mood", -36); add(s, "reputation", -40); add(s, "network", -30); add(s, "stress", 30); add(s, "health", -16);
          socialShift(s, -24); bumpMomentum(s, -16);
          flag(s, "saga_official_fall");
          flag(s, "jailed");
          const tycoon = car2_name(s, "of_tycoon");
          return `纸终究包不住火。${tycoon}出事被查，顺藤摸瓜，当年那些信封、那些「灵活处理」、那份补刀的材料，全成了铁证。专案组上门那天，你正在主席台上讲话，被请下来时腿都软了。「双开」、退赃、移送司法——半生攀爬，连本带利，一夜清零。${car2_money(wipe)} 的赃款换来一副冰冷的手铐。爬得多高，摔得多重。`;
        }

        // 结局三：滑头/避战/守成 → 看透名利，激流勇退
        const pension = byClass(s, { poor: 300000, mid: 700000, rich: 1500000 });
        add(s, "cash", Math.round(pension * 0.5));
        add(s, "mood", 22); add(s, "stress", -26); add(s, "health", 12); add(s, "insight", 10); add(s, "mind", 6);
        bumpMomentum(s, 4);
        flag(s, "saga_official_retire");
        return `你看透了。再往上一格，是更深的水、更密的网、更难洗的手。某个无眠的深夜，你提笔写了报告，主动申请提前退居二线。没有惊天政绩，也没有牢狱之灾，你带着一份还算体面的待遇，回到老房子，养花、读书、含饴弄孙。 ${car2_money(pension)} 不算丰厚，可你睡得安稳。名利场厮杀一场，你最大的赢，是全身而退。`;
      } }
  ]
});

/* =====================================================================
 * SAGA 二、corpking —— 打工皇帝线（4 幕）
 *   关键项目证明自己 → 职场修罗场（跟对老板/扛业绩/被架空/挖角与忠诚）
 *   → 结局：CXO职业经理人天花板 / 中年被优化 / 看透职场出来单干
 * ===================================================================== */

// —— 第1幕：一个无人敢接的项目 ——
EVENTS.push({
  id: "ev_sagacar2_corpking_s1",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "employed") && !has(s, "civil_servant") && s.age >= 28 && s.age <= 52 && !has(s, "saga_corpking_s1") && !has(s, "saga_corpking_done"),
  title: "🚀 那个没人敢接的项目，落到了你头上",
  text: (s) => {
    const ceo = car2_name(s, "ck_ceo");
    return `全员大会上，气氛凝固。一个能让公司起死回生、也能让操盘人粉身碎骨的「天字号」项目悬而未决，没人敢举手。${ceo}总的目光扫过全场，最后停在你身上：「这个项目，谁来挑？」你能感觉到周围同事屏住的呼吸——成了，一步登天；砸了，背锅走人。你的手心全是汗。`;
  },
  choices: [
    { label: "豁出去，主动请缨立军令状", effect: (s) => {
        add(s, "mood", 12); add(s, "stress", 20); add(s, "reputation", 10); add(s, "strategy", 4);
        socialBoostRole(s, "mentor", 4);
        flag(s, "saga_corpking_s1");
        flag(s, "saga_corpking_charge");
        car2_name(s, "ck_ceo");
        const ceo = car2_name(s, "ck_ceo");
        return `你站起来，声音不大却很稳：「${ceo}总，我来。」满座哗然。接下来半年你住进了公司，连轴转、啃硬骨头、扛住所有人的质疑。项目临门一脚那夜，你盯着屏幕上跳成绿色的数据，眼泪差点下来。你赌赢了——${ceo}总在大会上点名表扬你，你的名字，第一次进了高层的视野。`;
      } },
    { label: "不出头，但主动给操盘人当军师", effect: (s) => {
        add(s, "mood", 6); add(s, "stress", 8); add(s, "network", 10); add(s, "insight", 4); add(s, "strategy", 3);
        flag(s, "saga_corpking_s1");
        flag(s, "saga_corpking_advisor");
        car2_name(s, "ck_ceo");
        return `你没接这烫手山芋，却也没置身事外。你主动找到接盘的同事，把自己的思路、资源、风险点全盘托出，做他背后那个出主意的人。项目成了，台前是别人，但操盘人逢人就说「多亏了他」。你不显山不露水地攒下了人情和口碑——闷声，也能成大事。`;
      } },
    { label: "明哲保身，低头看手机假装没听见", effect: (s) => {
        add(s, "mood", -4); add(s, "stress", -8); add(s, "reputation", -6);
        flag(s, "saga_corpking_s1");
        flag(s, "saga_corpking_hide");
        car2_name(s, "ck_ceo");
        const ceo = car2_name(s, "ck_ceo");
        return `你死死盯着手机屏幕，把头埋得更低。${ceo}总的目光在你身上停了一秒，划过去了。项目最后给了一个愣头青，居然也磕磕绊绊做成了，那人一战成名、火速提拔。而你，安全地待在原地，泡在格子间里，看着别人坐上了本可能属于你的位子。安稳的另一面，叫做错过。`;
      } }
  ]
});

// —— 第2幕：站队与背刺，办公室政治修罗场 ——
EVENTS.push({
  id: "ev_sagacar2_corpking_s2",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_corpking_s1") && !has(s, "saga_corpking_s2") && !has(s, "saga_corpking_done") && s.age >= 30,
  title: "🔪 高层内斗，你被架在了火上",
  text: (s) => {
    const ceo = car2_name(s, "ck_ceo");
    const rival = car2_name(s, "ck_rival");
    return `公司权力洗牌。赏识你的${ceo}总，和空降的新贵副总裁${rival}斗得你死我活，整个公司被撕成两派。${rival}私下找到你，端着咖啡笑：「跟着我，下季度就给你升 VP；跟着那个老古董，迟早一起出局。」与此同时，${ceo}总也在等你表态。你被架在两座山中间，一步走错，满盘皆输。`;
  },
  choices: [
    { label: "忠诚跟随，铁了心站老板这一边", effect: (s) => {
        add(s, "mood", 4); add(s, "stress", 18); add(s, "reputation", 8); add(s, "network", -6);
        flag(s, "saga_corpking_s2");
        flag(s, "saga_corpking_follow");
        const ceo = car2_name(s, "ck_ceo");
        return `你选择了义气。「${ceo}总一手把我带出来，这个时候掉头，我做不到。」你公开站台，帮他稳住业务盘、堵住对手的攻势。这一战凶险万分，几次你都以为要陪着一起出局。但你赌人品、赌跟对了人——这份忠诚，会在未来某一天，连本带利还给你。`;
      } },
    { label: "跳槽逐利，倒戈投靠新贵副总裁", effect: (s) => {
        add(s, "mood", 8); add(s, "stress", 14); add(s, "reputation", -12); add(s, "network", 14);
        s.job = { id: "vp", name: "事业部副总裁", pay: 80000, stress: 11, _raise: 0 };
        flag(s, "saga_corpking_s2");
        flag(s, "saga_corpking_defect");
        const rival = car2_name(s, "ck_rival");
        const ceo = car2_name(s, "ck_ceo");
        return `你算了笔账，倒向了${rival}。新东家的旗下，你火速升任副总裁，薪水翻倍。${ceo}总在走廊里和你擦肩而过，那个失望的眼神你一辈子忘不了。「白眼狼」的标签贴上了你后背。位子是上去了，可你心里清楚：背叛过一次的人，新主子也未必真敢信你。`;
      } },
    { label: "不站队，用业绩当护身符两边周旋", effect: (s) => {
        add(s, "mood", 2); add(s, "stress", 20); add(s, "strategy", 6); add(s, "charm", 4); add(s, "insight", 4);
        flag(s, "saga_corpking_s2");
        flag(s, "saga_corpking_neutral");
        return `你谁的队都不站，只把一件事做到极致——业绩。两派斗得天昏地暗，你的部门数字却月月飘红，好得让谁都动不了你、谁都想拉拢你。「他那个部门，谁上台都得用他。」你把自己活成了一块谁都搬不动的压舱石。在这修罗场里，实力才是最硬的护身符。`;
      } }
  ]
});

// —— 第3幕：被架空，还是被天价挖角 ——
EVENTS.push({
  id: "ev_sagacar2_corpking_s3",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_corpking_s2") && !has(s, "saga_corpking_s3") && !has(s, "saga_corpking_done") && s.age >= 33,
  title: "💎 一边是被架空，一边是天价挖角",
  text: (s) => {
    const headhunter = car2_name(s, "ck_hunter");
    return `爬到这个高度，新的危机也跟着来了。一方面，你手里的权和人正被悄悄稀释——下面多了个「联席负责人」，核心项目绕过你直接汇报，你嗅到了被架空的味道。另一方面，猎头${headhunter}带来一家行业头部的 offer：CXO 头衔、千万年薪、巨额期权。去，还是留？这一步，决定你这辈子的天花板。`;
  },
  choices: [
    { label: "接下天价 offer，跳槽搏一个 CXO 大位", effect: (s) => {
        add(s, "assets", 1500000);
        add(s, "cash", 200000);
        s.job = { id: "cxo", name: "集团首席官", pay: 150000, stress: 13, _raise: 0 };
        add(s, "mood", 16); add(s, "stress", 18); add(s, "reputation", 12); add(s, "network", 12);
        flag(s, "saga_corpking_s3");
        flag(s, "saga_corpking_jump");
        return `你接了。新公司给的不只是头衔，是一整套实打实的期权包，光签字奖金就够买套房。你坐进了 CXO 的办公室，落地窗外是整座城市的天际线。压力陡增，眼睛里却是久违的野心。 ${car2_money(1500000)} 的期权进账，只是开始——你赌的是更大的盘子、更高的山。`;
      } },
    { label: "留下来死磕，从被架空中夺回权力", effect: (s) => {
        add(s, "mood", 4); add(s, "stress", 22); add(s, "strategy", 6); add(s, "reputation", 8);
        flag(s, "saga_corpking_s3");
        flag(s, "saga_corpking_stay");
        return `你拒绝了猎头，把 offer 截图存下来当底牌，然后转身和那个「联席负责人」正面硬刚。你重新拿回项目主导权，用一份漂亮的业绩报告，逼老板在你和对方之间做选择。这一仗你赢得险，却赢得彻底——你向所有人证明：想架空我？先问问业绩答不答应。`;
      } },
    { label: "心生退意，开始暗中谋划自立门户", effect: (s) => {
        add(s, "mood", 8); add(s, "stress", 10); add(s, "insight", 6); add(s, "strategy", 5); add(s, "network", 8);
        flag(s, "saga_corpking_s3");
        flag(s, "saga_corpking_plot");
        return `这些年的勾心斗角，让你看透了一件事：再大的打工皇帝，也是给别人抬轿子。你嘴上不动声色，私下却开始攒资源、留客户、备团队。猎头的电话你都婉拒了——你要的不是换个更大的笼子，而是干脆飞出去。一颗单干的种子，在你心里悄悄发了芽。`;
      } }
  ]
});

// —— 第4幕（结局）：打工皇帝 / 中年被优化 / 出来单干 ——
EVENTS.push({
  id: "ev_sagacar2_corpking_s4",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_corpking_s3") && !has(s, "saga_corpking_done") && s.age >= 38,
  title: "🎬 大结局：打工这条路，你走到了哪",
  text: (s) => "又是好几年血雨腥风。当年那个在大会上举手时手心冒汗的人，如今站到了职业生涯的山顶或悬崖边。期权解禁的通知、公司架构调整的红头文件、或是营业执照上自己的名字——命运把答案摊开在你面前。打工这条路，你究竟走成了什么？",
  choices: [
    { label: "面对最终的牌局，做出了断", effect: (s) => {
        flag(s, "saga_corpking_done");
        const jump = has(s, "saga_corpking_jump");
        const stay = has(s, "saga_corpking_stay");
        const plot = has(s, "saga_corpking_plot");
        const follow = has(s, "saga_corpking_follow");
        const neutral = has(s, "saga_corpking_neutral");
        const defect = has(s, "saga_corpking_defect");
        const charge = has(s, "saga_corpking_charge");

        // 结局一：忠诚/实力 + 跳对或守住 → 打工皇帝 CXO，期权自由
        if ((jump || stay) && (follow || neutral || charge) && rnd(0.78)) {
          const equity = byClass(s, { poor: 8000000, mid: 15000000, rich: 30000000 });
          const boom = Math.round(equity * (0.8 + Math.random() * 0.8));
          add(s, "assets", boom);
          add(s, "cash", Math.round(boom * 0.15));
          s.job = { id: "exec_king", name: "集团CEO/职业经理人", pay: 300000, stress: 12, _raise: 0 };
          add(s, "mood", 32); add(s, "reputation", 30); add(s, "network", 26); add(s, "stress", -14);
          add(s, "strategy", 10); add(s, "insight", 8);
          socialBoostRole(s, "mentor", 16); bumpMomentum(s, 16);
          flag(s, "saga_corpking_exec");
          flag(s, "打工皇帝");
          return `公司敲钟上市那天，你站在第一排。期权解禁，账户里冷冰冰的数字第一次让你眼眶发热——净增 ${car2_money(boom)}，外加千万年薪。你做到了打工人的天花板：职业经理人之巅，财务自由，说话有人听，离场有体面。当年那个不敢举手的格子间小职员，成了别人口中传说的「打工皇帝」。`;
        }

        // 结局二：背叛/站错/守不住 → 中年被优化，重新出发
        if ((defect || (!follow && !neutral && !charge)) && rnd(0.7)) {
          const sever = byClass(s, { poor: 100000, mid: 300000, rich: 600000 });
          add(s, "cash", sever);
          add(s, "assets", -Math.round((s.assets || 0) * 0.4));
          s.job = null;
          if (s.flags) delete s.flags.employed;
          add(s, "mood", -24); add(s, "stress", 20); add(s, "reputation", -12); add(s, "network", -16); add(s, "health", -8);
          socialShift(s, -12); bumpMomentum(s, -8);
          flag(s, "saga_corpking_optimized");
          return `一纸「组织架构优化」的邮件，把你的工号划进了名单。曾经叱咤的会议室，如今连门禁都刷不开了。HR 递来 N+1 的补偿金 ${car2_money(sever)}，公式化的笑容里没有半分温度。四十多岁，上有老下有小，简历投出去石沉大海。你才痛彻地懂得：打工皇帝，终究是皇帝赏的——伞一收，淋的还是自己。从头再来吧。`;
        }

        // 结局三：谋划单干 / 看透职场 → 出来创业，海阔天空
        const seed = byClass(s, { poor: 1500000, mid: 4000000, rich: 10000000 });
        const gain = Math.round(seed * (0.6 + Math.random() * 0.8));
        add(s, "assets", gain);
        add(s, "cash", Math.round(gain * 0.2));
        s.job = { id: "founder", name: "创业公司创始人", pay: 50000, stress: 11, _raise: 0 };
        add(s, "mood", 26); add(s, "stress", -6); add(s, "reputation", 16); add(s, "network", 14);
        add(s, "strategy", 8); add(s, "insight", 8); add(s, "health", 4);
        bumpMomentum(s, 12); socialBoostRole(s, "mentor", 10);
        flag(s, "saga_corpking_founder");
        const hunter = car2_name(s, "ck_hunter");
        return `你递了辞呈，带着攒了多年的客户、团队和那口不服输的气，注册了自己的公司。没有了头顶的天花板，也没有了背后的靠山，第一次，输赢全是自己的。公司熬过最难的头两年，竟真做出了名堂，净赚 ${car2_money(gain)}。当年挖你的猎头${hunter}如今反过来求你给个面试机会。给别人打了半辈子工，你终于成了那个发工资的人——海阔凭鱼跃。`;
      } }
  ]
});
