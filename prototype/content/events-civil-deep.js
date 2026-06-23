"use strict";
/* =====================================================================
 * content/events-civil-deep.js —— 体制内（商政/考公）板块深度事件
 * 主题：在 civil.js 的「科员→副科→正科→副处→正处→副厅」阶梯之上，
 *   补充更细腻的体制内政治生态——遴选借调、年度考核评优、巡视审计、
 *   提拔公示前夜的匿名信、信访维稳、招商硬指标、站队旋转门、年轻干部
 *   被穿小鞋与老同志传帮带。晋升类成功推进 s.civilRank（封顶 6），失败有代价。
 * 仅追加 EVENTS.push({...})，不修改任何其它文件。
 * 复用 civil.js 字段：s.civilRank / rankName(s) / flag has_backer/wrong_side/
 *   dirty_hands/jailed/drink_health；全局 helper add/flag/has/pick/rnd/byClass/
 *   classTier/shuf/socialShift/socialBoostRole。
 * ===================================================================== */

/* 模块内部辅助：晋升一级（封顶副厅级 6）。带前缀 civilx_。 */
function civilx_rankUp(s) { s.civilRank = Math.min(6, (s.civilRank || 0) + 1); }

/* —— 1. 遴选/借调进上级机关：跨越式机会 —— */
EVENTS.push({
  id: "ev_civilx_xuandiao", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 1 && (s.civilRank || 0) <= 3 && s.age >= 26,
  title: "🏛️ 上级机关的遴选公告",
  text: (s) => "省直机关发来遴选公告，要从你们这些基层「" + rankName(s) + "」里选调几个进大机关。一旦选上，平台、视野、提拔的速度，都不是基层能比的。办公室老周凑过来压低声音：「这是鲤鱼跳龙门，可笔试面试加考察，关关淘汰人。你敢报吗？」",
  choices: [
    { label: "脱产备考，搏一把前程", next: (s) => ({
        text: (s) => "你白天上班、夜里刷题，案例分析、机关公文写作练到手抽筋。面试考场上，七名考官一字排开，主考官推了推眼镜：「谈谈你对『基层减负』的理解。」",
        choices: [
          { label: "结合基层实情，讲真问题", effect: (s) => { add(s, "stress", 8); add(s, "knowledge", 2);
              const p = 0.32 + (s.stats.knowledge + s.stats.strategy) / 320;
              if (rnd(p)) { civilx_rankUp(s); add(s, "reputation", 6); add(s, "network", 5); flag(s, "secondment"); return "你把表格痕迹主义、属地兜底的苦水讲得入木三分，考官频频点头。半月后调令下来——你进了省直机关，顺势提了【" + rankName(s) + "】。同批的人都红了眼。"; }
              add(s, "mood", -6); return "你讲得实在，可惜笔试分被一个名校选调生压了半筹，遴选差额淘汰，止步面试。回到原单位，位子还在，心气却散了几分。"; } },
          { label: "捡领导爱听的虚词套话讲", effect: (s) => { add(s, "stress", 4);
              if (rnd(0.25 + s.stats.charm / 280)) { civilx_rankUp(s); add(s, "reputation", -2); flag(s, "secondment"); return "你一通正确的废话，倒也四平八稳，竟踩着线过了，调进了省直，提了【" + rankName(s) + "】。只是你自己清楚，这一关是蒙过去的。"; }
              add(s, "reputation", -3); return "考官里有个老笔杆子，最烦空话，你那套排比句被他当场追问到哑火。遴选落榜，名声还跌了。"; } }
        ]
      }) },
    { label: "先借调过去试试水", effect: (s) => { add(s, "stress", 6); add(s, "network", 4); flag(s, "secondment");
        if (rnd(0.45 + s.stats.strategy / 300)) { add(s, "knowledge", 2); add(s, "reputation", 4); return "你被借调到上级机关帮忙写材料。活又多又杂，连轴转了大半年，可处长记住了你这支笔。借调期满，他一句话把你正式商调了过去——人脉攒下了，门也敲开了。"; }
        add(s, "mood", -5); add(s, "health", -3); return "借调一年，你成了「免费劳力」，最苦最累的活都压给你，可编制始终留在原单位，期满一脚踢回。「白干一场」，你苦笑。"; } },
    { label: "基层也挺好，不去掺和", effect: (s) => { add(s, "stress", -3); add(s, "mood", 2); return "你掂量再三，留了下来。大机关庙高水深，未必容得下你这条小鱼。守着熟悉的一亩三分地，也算一种清醒。"; } }
  ]
});

/* —— 2. 年度考核评优名额之争 —— */
EVENTS.push({
  id: "ev_civilx_kaohe", module: "civil", ambient: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 1,
  title: "📋 年度考核「优秀」名额之争",
  text: (s) => "年终考核开始民主测评。科室就一个「优秀」指标，攥着它的不止你——隔壁工位的小李背景硬，资格老的张姐又熬了好几年没轮上。「优秀」直接挂钩明年的提拔排队，谁都想要。",
  choices: [
    { label: "私下给同事们做做工作", effect: (s) => { add(s, "network", 2); add(s, "stress", 3);
        const p = 0.4 + s.network / 220;
        if (rnd(p)) { add(s, "reputation", 3); add(s, "mood", 4); flag(s, "got_excellent"); return "你提前一个个把话递到，又请大伙吃了顿饭。测评票投下来，「优秀」稳稳落到你头上。提拔的排队名单里，你往前挪了一格。"; }
        add(s, "reputation", -3); return "你私底下的小动作被人捅了出去，传成「拉票」。领导皱眉，名额反倒给了不声不响的张姐。机关里，吃相比结果更要紧。"; } },
    { label: "靠平时实绩，等领导定夺", next: (s) => ({
        text: (s) => "你没去活动，只把一年的工作总结认真写满了三页。定考核那天，分管领导把名单压了又压，最后把你和小李叫进办公室：「你俩都不错，可名额就一个。」",
        choices: [
          { label: "如实陈情，列摆自己的硬活", effect: (s) => { add(s, "stress", 4);
              const p = 0.42 + (s.stats.knowledge + s.stats.strategy) / 320;
              if (rnd(p)) { add(s, "reputation", 5); flag(s, "got_excellent"); return "你把牵头的两个项目、加的几十个夜班一桩桩摆出来，领导听完拍板：「优秀给你，实至名归。」小李输得没话说。"; }
              add(s, "mood", -4); return "你讲得在理，可小李的爹是隔壁单位的副局。领导沉默良久，还是把名额给了小李。「明年优先考虑你」——又是这句话。"; } },
          { label: "主动让给资格老的张姐", effect: (s) => { add(s, "reputation", 6); add(s, "network", 4); socialBoostRole(s, "同事", 8); add(s, "mood", 3); return "你说张姐熬得久，今年该她。话传出去，全科室都念你的好，连领导都高看你一眼。名利让了一回，人情攒了一笔——这账，长远看不亏。"; } }
        ]
      }) }
  ]
});

/* —— 3. 巡视组/审计进驻：清白者过关、手脏者心慌 —— */
EVENTS.push({
  id: "ev_civilx_xunshi", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 3,
  title: "🔍 巡视组进驻",
  text: (s) => "上级巡视组进驻你们单位，专设了举报箱，公布了热线。一时间人心浮动，连走廊里说话都压低了声。" + (has(s, "dirty_hands") ? "你想起办公室那只「沉甸甸的购物袋」，后背窜起一阵凉意。" : "你账目清白、手脚干净，本可坦然，可这架势还是让人绷紧了弦。"),
  dynamicChoices: (s) => has(s, "dirty_hands") ? [
    { label: "连夜退赃、找门路抹平", effect: (s) => { add(s, "cash", -byClass(s, { poor: 100000, mid: 300000, rich: 600000 })); add(s, "stress", 18); add(s, "health", -6);
        if (rnd(0.45)) { return "你赶在巡视组查到之前，把能退的退了、能抹的抹了，又托人打了招呼。这一关，惊出一身冷汗,总算险险糊弄过去。但「沉甸甸的袋子」留下的隐患，没那么容易拔干净。"; }
        flag(s, "jailed"); s.civilRank = 0; delete s.flags.civil_servant; s.job = null; add(s, "reputation", -40); add(s, "mood", -20); return "你的串供和转移正好撞在巡视组的枪口上，反成了「对抗组织审查」的铁证。专案组随即介入，你被「双开」、移送司法。半生攒下的，一夜清零。"; } },
    { label: "硬着头皮配合，赌他们查不到", effect: (s) => { add(s, "stress", 20); add(s, "health", -5);
        if (rnd(0.4)) { return "你强作镇定，把账目流水都摆得齐齐整整。巡视组翻了几天没揪出实锤，撤了。你瘫在椅子上，半晌没缓过来——这次是运气，不是清白。"; }
        flag(s, "jailed"); s.civilRank = 0; delete s.flags.civil_servant; s.job = null; add(s, "reputation", -40); add(s, "mood", -20); return "一封实名举报信送进了巡视组，附着转账截图。专案组当天就上了门，你手里的茶杯啪地碎在地上。退赃、判刑、开除公职，一样没躲过。"; } }
  ] : [
    { label: "坦然配合，把分管工作和盘托出", effect: (s) => { add(s, "reputation", 8); add(s, "mood", 3); add(s, "stress", -2); return "你把台账、流程、签字记录原原本本交了上去，问什么答什么。巡视组组长临走前点了点头：「身正不怕影斜。」清白，是这世道里最硬的底气。"; } },
    { label: "顺手反映几个看不惯的问题", next: (s) => ({
        text: (s) => "你犹豫了一下，还是把单位里那个吃拿卡要的老科长写进了举报材料。巡视组很重视，可消息不知怎么走漏了，老科长在楼道里堵住你，阴着脸：「年轻人，做人留一线。」",
        choices: [
          { label: "顶住压力，配合核查到底", effect: (s) => { add(s, "stress", 8);
              if (rnd(0.55)) { add(s, "reputation", 6); socialBoostRole(s, "领导", 6); return "证据扎实，老科长被立案查处。你顶着「告密者」的非议，却换来了上级的另眼相看——有人怕你，也有人敬你。"; }
              add(s, "reputation", -4); flag(s, "wrong_side"); return "核查中途因证据不足搁置，老科长全身而退，反过来给你穿小鞋。你这才懂：举报，是要拿前程压注的。"; } },
          { label: "见势不妙，赶紧撤回不提了", effect: (s) => { add(s, "reputation", -3); add(s, "insight", 2); return "你借口「情况不实」把材料撤了回来。老科长哼了一声放过你。明哲保身是保住了，可镜子里那个人，你有点不敢看。"; } }
        ]
      }) }
  ]
});

/* —— 4. 提拔公示前夜的匿名举报信：临门一脚 —— */
EVENTS.push({
  id: "ev_civilx_gongshi", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 2 && (s.civilRank || 0) < 6 && s.age >= 30,
  title: "📨 公示期的一封匿名信",
  text: (s) => "你的提拔进入公示期，再有三天就能从「" + rankName(s) + "」更进一步。偏在这节骨眼上，组织部收到一封匿名举报信，说你「履历造假、生活作风有问题」。组织部的电话打来：「老规矩，公示期接到反映就得核实，你心里有没有数？」",
  choices: [
    { label: "坦荡澄清，要求当面对质", next: (s) => ({
        text: (s) => "你主动提交了全部档案、体检和征信材料，还反请组织部彻查。核查组找你谈话：「信里说你某年某项目套取了资金，你怎么解释？」",
        choices: [
          { label: "拿出当年的台账逐条对账", effect: (s) => { add(s, "stress", 6);
              if (rnd(0.6 + s.stats.knowledge / 360)) { civilx_rankUp(s); add(s, "reputation", 6); add(s, "mood", 6); return "你把那年的预算批复、报销凭证、验收单据一摞摞摆上桌，条条对得上。核查组当场结论「反映不实」，公示如期通过——你坐上了【" + rankName(s) + "】。清者自清，反倒提了威信。"; }
              add(s, "mood", -8); return "你账目本是清白的，可有两笔旧凭证遗失补不上，核查只得「暂缓提拔、继续了解」。位子悬了起来，你成了别人眼里「有问题」的人。"; } },
          { label: "顺藤摸瓜，揪出写信的人", effect: (s) => { add(s, "stress", 8); add(s, "insight", 2);
              if (rnd(0.45 + s.stats.strategy / 300)) { civilx_rankUp(s); add(s, "reputation", 3); flag(s, "has_backer"); return "你从信的笔迹和细节推断出，是同样盯着这位子的竞争对手干的。证据递到领导桌上，对手「诬告陷害」反被处理，你的提拔顺理成章——【" + rankName(s) + "】到手，还多了个靠山。"; }
              add(s, "reputation", -4); return "你忙着查信的来头，反被人说「不把精力放正事、热衷搞内斗」。提拔被搁置，调查匿名信的事也不了了之。"; } }
        ]
      }) },
    { label: "找关系活动，赶紧把公示压过去", effect: (s) => { const c = byClass(s, { poor: 60000, mid: 150000, rich: 400000 });
        if (s.cash < c) { add(s, "stress", 5); return "你想花钱摆平，可一打听运作的行情就傻了眼——这点积蓄连「敲门」都不够。公示就这么悬在那儿，你夜夜失眠。"; }
        add(s, "cash", -c);
        if (rnd(0.5 + s.network / 240)) { civilx_rankUp(s); add(s, "reputation", -3); flag(s, "has_backer"); return "你连夜找了关系，把核查「高高举起、轻轻放下」，公示有惊无险地过了，提了【" + rankName(s) + "】。只是这一步，你欠下的人情，迟早要还。"; }
        add(s, "reputation", -6); add(s, "mood", -8); return "钱花了、关系托了，可对方收了钱却没办成，反把你「跑关系」的事抖了出去。提拔黄了，名声还臭了——赔了夫人又折兵。"; } }
  ]
});

/* —— 5. 信访维稳/突发舆情：基层硬骨头 —— */
EVENTS.push({
  id: "ev_civilx_xinfang", module: "civil", ambient: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 1 && (s.civilRank || 0) <= 4,
  title: "📢 大门口的上访人群",
  text: (s) => "一早,几十个征地的老乡堵在单位大门口，横幅都拉了起来，情绪激动。一把手把你推到前头：「你年轻，腿脚利索，下去把人劝住，别闹大上了网。」",
  choices: [
    { label: "亲自下去，挨家挨户拉家常", next: (s) => ({
        text: (s) => "你没带保安，独自走进人群，先给为首的老汉递了根烟。老汉红着眼:「补偿款拖了大半年，你们当官的谁管过我们死活！」周围人越围越紧。",
        choices: [
          { label: "当场承诺时限，蹲下来记诉求", effect: (s) => { add(s, "body", 1); add(s, "stress", 10); add(s, "health", -3);
              if (rnd(0.5 + s.stats.charm / 260)) { add(s, "reputation", 6); add(s, "mind", 1); socialBoostRole(s, "群众", 8); return "你蹲在地上一笔一笔记下每户的诉求，当众立了军令状：「十五天内不解决，你们来找我。」人群慢慢散了。后来你真把款催了下来，老乡们提着鸡蛋来谢你。这事，干得漂亮。"; }
              add(s, "mood", -6); return "你话说得满,可补偿款卡在财政,根本兑现不了。十五天后人群又来了,这回还录了视频发上网。你成了「忽悠群众」的反面典型。"; } },
          { label: "搬出政策条文，按规矩讲道理", effect: (s) => { add(s, "stress", 6);
              if (rnd(0.4 + s.stats.knowledge / 280)) { add(s, "reputation", 3); return "你把征地补偿条例一条条念清楚,又指出他们诉求里不合规的部分。讲了一上午,几个明事理的先松了口,人群渐渐松动。"; }
              add(s, "mood", -5); add(s, "stress", 6); return "老乡们根本不吃这套:「我们不懂你那些文件,我们只要活命钱!」场面一度推搡起来,差点出事。维稳没维住,你也挂了彩。"; } }
        ]
      }) },
    { label: "先报警布控，按预案强行清场", effect: (s) => { add(s, "stress", 8);
        if (rnd(0.5)) { add(s, "reputation", -4); return "警察一来,场面是压住了,人也劝走了。可有人把推搡的画面拍了下来,「暴力维稳」的帖子传开,虽没出大事,你在群众里的名声却塌了。"; }
        add(s, "reputation", -8); add(s, "mood", -6); flag(s, "wrong_side"); return "清场时起了肢体冲突,一个老人被撞倒送了医,视频一夜冲上热搜。上面震怒,要有人担责。你被推出来背了这口锅,记过处分。"; } }
  ]
});

/* —— 6. 招商引资硬指标/政绩工程：超额提拔或被约谈 —— */
EVENTS.push({
  id: "ev_civilx_zhibiao", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 3 && (s.civilRank || 0) < 6,
  title: "🎯 年度招商「军令状」",
  text: (s) => "全市招商动员会上，市长把硬指标拍到每个人头上:你今年要落地一个亿级项目,完不成年底约谈、排名通报;超额完成的,提拔优先。散会时你攥着那张签了字的「军令状」,手心全是汗。",
  choices: [
    { label: "盯死一个龙头项目,死磕到底", next: (s) => ({
        text: (s) => "你瞄准一家想扩产的新能源龙头,前后跑了对方总部七趟。对方老总把茶杯一推:「地、电、税我们都比较过了,你们这儿配套不占优。你拿什么留住我?」",
        choices: [
          { label: "拿出一揽子精准的扶持方案", effect: (s) => { add(s, "stress", 10); add(s, "strategy", 1);
              const p = 0.4 + (s.stats.strategy + s.stats.charm) / 340;
              if (rnd(p)) { civilx_rankUp(s); add(s, "reputation", 8); add(s, "network", 4); return "你连夜做了套含金量十足的方案:标准厂房代建、用电直供、人才公寓配齐。老总当场拍板签约,投产纳税解决三千人就业。这政绩硬得发亮,年底你超额完成,破格提了【" + rankName(s) + "】。"; }
              add(s, "stress", 6); add(s, "mood", -5); return "你方案做得诚恳,可对方最终被邻市更猛的补贴挖走了。指标差了一大截,年底约谈会上,你被市长当众点名:「招商不是请客吃饭。」"; } },
          { label: "私下许下超权限的口头承诺", effect: (s) => { flag(s, "image_project"); add(s, "stress", 8);
              if (rnd(0.5)) { add(s, "reputation", 5); add(s, "mood", -4); return "你拍胸脯许了些后来兑不了的优惠,项目是签下了,完成了指标。可企业落地后天天拿当初的口头承诺逼你兑现,你被夹在中间,焦头烂额。"; }
              add(s, "reputation", -6); return "你越权承诺的事被审计查了出来,定性为「招商乱开口子」。项目没落地,你反吃了个处分。冲指标冲出火来,得不偿失。"; } }
        ]
      }) },
    { label: "搞个签约仪式冲数字,先交差", effect: (s) => { flag(s, "image_project"); add(s, "reputation", 3);
        if (rnd(0.5)) { add(s, "mood", -6); return "签约仪式办得锣鼓喧天,数字漂亮地报了上去。可那家「企业」拿了优惠就玩消失,项目彻底烂尾。一年后被巡查翻出,你这政绩成了「政疾」,挨了通报。"; }
        return "你拉来一家关系户走了个签约过场,数字凑够了,会也开得风光,上面暂时满意。至于项目到底落不落地——那是明年的事了。"; } },
    { label: "如实上报困难,不接这个军令状", effect: (s) => { add(s, "reputation", -4); add(s, "stress", -3); add(s, "insight", 2); return "你跟领导摊牌:本地配套确实没竞争力,一个亿级指标不现实。话是实话,可在「人人立军令状」的会上,你成了那个「不讲政治、畏难退缩」的异类,提拔自然没你的份。"; } }
  ]
});

/* —— 7a. 站队与旋转门：跟对人 vs 站错队 —— */
EVENTS.push({
  id: "ev_civilx_zhandui", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 2 && (s.civilRank || 0) < 6 && !has(s, "has_backer"),
  title: "♟️ 两位领导,站谁的队",
  text: (s) => "单位班子里,常务副和分管副明争暗斗,人人都在悄悄选边。两人不约而同向你递了话——常务副许你下一个空缺,分管副说你是他「最看好的苗子」。墙头草做不长,你早晚得选一边。",
  choices: [
    { label: "押注更有实权的常务副", effect: (s) => { add(s, "stress", 6);
        if (rnd(0.5 + s.network / 260)) { civilx_rankUp(s); flag(s, "has_backer"); add(s, "network", 5); return "常务副在换届中更进一步,执掌大权,顺手把你这个「自己人」拔上了【" + rankName(s) + "】。一荣俱荣,你尝到了站对队的甜头。"; }
        flag(s, "wrong_side"); add(s, "reputation", -8); add(s, "mood", -8); return "没想到常务副在一轮巡视中折了,树倒猢狲散。你被打上「某某的人」的标签,调去看大门一样的闲岗,坐了好几年冷板凳。"; } },
    { label: "压宝务实肯干的分管副", effect: (s) => { add(s, "stress", 6); add(s, "strategy", 1);
        if (rnd(0.5 + s.stats.strategy / 280)) { civilx_rankUp(s); flag(s, "has_backer"); add(s, "reputation", 4); return "分管副踏实有政绩,几年后稳稳上位,记着你当年的雪中送炭,提了你【" + rankName(s) + "】。这一注,押在了实力上。"; }
        flag(s, "wrong_side"); add(s, "reputation", -6); add(s, "mood", -6); return "分管副为人是好,可斗不过会来事的对手,黯然出局。你跟着受了冷落。原来在机关里,光有本事,有时还不够。"; } },
    { label: "谁都不站,只埋头干自己的", next: (s) => ({
        text: (s) => "你打定主意当个「技术派」,两边都笑脸相迎、都不真心靠拢。可时间一长,两位领导都觉得你「不够意思、不可靠」,好事轮不到你。年底,常务副把你叫去敲打:「年轻人,体制里没有真正的中间地带。」",
        choices: [
          { label: "继续守中立,认了这份清冷", effect: (s) => { add(s, "reputation", 2); add(s, "stress", -2); add(s, "insight", 2); return "你笑笑没接话,继续做你的孤臣。提拔慢了,圈子也淡了,可没有靠山就没有把柄,真到大风浪来时,你反而是最干净、最稳的那个。"; } },
          { label: "想通了,赶紧靠向一边", effect: (s) => { add(s, "stress", 4);
              if (rnd(0.45)) { flag(s, "has_backer"); add(s, "network", 3); return "你及时调转船头靠了过去,虽晚了半拍,好歹挤进了圈子,捞回个「自己人」的身份。机关无中立,你算是想明白了。"; }
              flag(s, "wrong_side"); add(s, "reputation", -4); return "你转得太急,反落个「投机、墙头草」的话柄,两边都不待见。聪明反被聪明误。"; } }
        ]
      }) }
  ]
});

/* —— 7b. 政商旋转门：要不要下海经商 —— */
EVENTS.push({
  id: "ev_civilx_xiahai", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 3 && s.age >= 38 && s.age <= 52 && !has(s, "dirty_hands") && !has(s, "revolving_door") && !has(s, "emigrated"),
  title: "🌊 老同学的下海邀约",
  text: (s) => "做企业的老同学约你喝茶,开门见山:「别熬了!来我公司当总经理,年薪是你现在的十倍,股份另算。你这身份、这门路,在外面值大钱。」他把一份合同推到你面前。体制内一眼望到头的安稳,和体制外不确定的暴富,你选哪个?",
  choices: [
    { label: "辞职下海,拿后半生搏一把", next: (s) => ({
        text: (s) => "你递了辞呈,科里炸开了锅:有人说你疯,有人偷偷羡慕。办完离职手续那天,你站在单位门口,看了最后一眼那块挂了多年的牌子,转身上了老同学的车。",
        choices: [
          { label: "凭真本事经营,不碰原单位业务", effect: (s) => { delete s.flags.civil_servant; s.civilRank = 0; s.job = { id: "exec", name: "企业总经理", pay: 55000, stress: 9, _raise: 0 }; flag(s, "revolving_door"); add(s, "cash", 300000); add(s, "stress", 6);
              if (rnd(0.5 + s.stats.strategy / 260)) { add(s, "cash", 800000); add(s, "network", 5); add(s, "mood", 6); return "你守着规矩,只用市场化的本事做事,公司在你手里蒸蒸日上。几年下来,身家翻了番,你庆幸自己跳出了那口温水锅。"; }
              add(s, "cash", -200000); add(s, "mood", -6); add(s, "stress", 8); return "市场比官场更残酷,没了体制的庇护,你才发现自己的「门路」一旦离了那个位子,就没人买账。公司经营惨淡,你头一回为生计发愁。"; } },
          { label: "靠老关系吃回扣,打擦边球", effect: (s) => { delete s.flags.civil_servant; s.civilRank = 0; s.job = { id: "exec", name: "企业总经理", pay: 55000, stress: 11, _raise: 0 }; flag(s, "revolving_door"); flag(s, "dirty_hands"); add(s, "cash", 1200000); add(s, "stress", 12); return "你利用还热乎的人脉,专接原系统的工程、吃回扣、搞利益输送,钱来得又快又猛。可「政商旋转门」「围猎」这些词,正被盯得越来越紧——你赚的每一分,都埋着雷。"; } }
        ]
      }) },
    { label: "守住编制,稳稳熬到退休", effect: (s) => { add(s, "mood", 3); add(s, "stress", -4); add(s, "health", 2); return "你婉拒了。十几年的资历、副处的级别、说一不二的体面,哪是十倍年薪能换的?外面再热闹,也不如这碗饭端得安稳。你目送老同学的车走远,转身回了办公室。"; } }
  ]
});

/* —— 8a. 年轻干部被穿小鞋 —— */
EVENTS.push({
  id: "ev_civilx_xiaoxie", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 1 && (s.civilRank || 0) <= 3 && s.age <= 35,
  title: "👞 老科长给你穿的小鞋",
  text: (s) => "你年轻、能干、还不太会来事,挡了某些人的道。分管的老科长开始有意给你穿小鞋:脏活累活全派给你,出了成绩算集体的,出了纰漏单算你的。这个月,他又把一桩明显是坑的差事甩给了你。",
  choices: [
    { label: "忍气吞声,把坑活也干漂亮", effect: (s) => { add(s, "stress", 8); add(s, "health", -3); add(s, "strategy", 1);
        if (rnd(0.45 + s.stats.strategy / 300)) { add(s, "reputation", 5); socialBoostRole(s, "领导", 6); return "你憋着一口气,硬是把那桩没人接的烂事办得滴水不漏。大领导看在眼里,私下点了你的名:「这小伙子,扛得住事。」老科长的小鞋,反成了你的垫脚石。"; }
        add(s, "mood", -6); return "你忍着干完了,功劳却被老科长不动声色地揽了去。这样的窝囊,你已经记不清是第几回。「多干多错,少干少错」,你开始懂这话的分量。"; } },
    { label: "越级找大领导反映情况", next: (s) => ({
        text: (s) => "你鼓起勇气敲开了大领导的门。大领导听完,不置可否地端起茶杯:「年轻人受点委屈是好事。老同志带新人,方式糙了点,你要多体谅。」话里的意思,你品出几分凉意。",
        choices: [
          { label: "见好就收,递个台阶给老科长", effect: (s) => { add(s, "insight", 2); socialBoostRole(s, "同事", 4); return "你顺着大领导的话往回收,事后还主动给老科长台阶下。老科长见你识趣,刁难松了不少。机关里斗气没用,把火候拿捏好,才是真本事。"; } },
          { label: "梗着脖子,非要争个对错", effect: (s) => { add(s, "stress", 8); add(s, "reputation", -4); flag(s, "wrong_side"); return "你不依不饶地要说法,大领导脸沉了下来,觉得你「沉不住气、不懂规矩」。老科长更是恨上了你,从此明里暗里下绊子。年轻气盛,你结结实实碰了回壁。"; } }
        ]
      }) },
    { label: "递交辞呈,这编制不要也罢", effect: (s) => { add(s, "stress", -2); add(s, "mood", -4); add(s, "insight", 3); return "你把辞职信摆上了桌——可笔悬在签名处,又想起当初千军万马挤上岸的不易、想起爸妈逢人就夸的骄傲,终究没舍得递。你叹口气收了起来,这口气,还得忍下去。"; } }
  ]
});

/* —— 8b. 老同志传帮带 —— */
EVENTS.push({
  id: "ev_civilx_chuanbangdai", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 1 && (s.civilRank || 0) <= 4 && s.age >= 28,
  title: "🍵 老处长的一席话",
  text: (s) => "快退二线的老处长把你叫到办公室,泡了壶好茶:「我在这单位干了三十年,看人不会走眼。你是块料,可棱角太硬,容易折。今天我跟你交个底。」他放下茶杯,神色郑重。",
  choices: [
    { label: "虚心求教,认真把话听进去", next: (s) => ({
        text: (s) => "老处长掰着指头说:「第一,功劳要让,黑锅有时要背;第二,领导面前别抢话,事后再补位;第三,清白这两个字,任什么时候都不能丢。」他盯着你:「这三条,你能记住几条?」",
        choices: [
          { label: "三条都记下,奉为圭臬", effect: (s) => { add(s, "strategy", 2); add(s, "insight", 2); add(s, "reputation", 3); socialBoostRole(s, "领导", 5); return "你把老处长的话一字一句记进了心里。往后的日子,你做事多了几分圆融、少了几分莽撞,路也走得顺了。有些经验,是用三十年换来的,听一句少踩十个坑。"; } },
          { label: "前两条有保留,只认「清白」那条", effect: (s) => { add(s, "insight", 1); add(s, "reputation", 4); return "你点头记下「清白」二字,对让功背锅那套,心里却存了保留:「该争还得争。」老处长笑了笑:「也好,人各有志。守住底线,比什么都强。」这一条,够你受用一生。"; } }
        ]
      }) },
    { label: "嘴上应着,心里不以为然", effect: (s) => { add(s, "mood", 1); return "你客气地谢过,心里却想:老一套了,时代变了。老处长看穿你的敷衍,只摇头叹了口气,没再多说。有些弯路,非得自己亲身走一遭才肯回头。"; } }
  ]
});
