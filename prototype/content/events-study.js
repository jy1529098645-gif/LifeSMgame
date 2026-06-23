"use strict";
/* =====================================================================
 * content/events-study.js —— 「海外留学」专属事件（module:"study"）
 * ---------------------------------------------------------------------
 * 仅在「海外留学」周推进承诺期触发（引擎维护 s.study 对象）。题材参考
 * 《留学模拟器》，贴近真实留学生的酸甜苦辣：文化冲击、due 周、挂科、
 * 兼职、思乡、恋爱、签证、学术诚信、校招、回国 vs 留下……
 *
 * 可读写状态：s.study.{gpa,lang,homesick,social,credits,weeksDone,totalWeeks}
 *   均 0~100（weeksDone/totalWeeks 为进度计数）。改 s.study 直接赋值并钳制：
 *     s.study.gpa = study_clamp(s.study.gpa - 8);
 *   钱/心情/压力/属性用全局 add(s,key,delta)。
 * 全局 helper：add/flag/has/pick/rnd/byClass/classTier/socialShift/
 *   bumpMomentum。辅助函数前缀 study_；事件 id 前缀 ev_study_。
 * 文案第二人称、有画面感；尊重 orientation、称谓中立；只输出中文。
 * ===================================================================== */

// 0~100 钳制：留学状态字段统一走这里，避免越界。
function study_clamp(v) { return Math.max(0, Math.min(100, v)); }
// 安全读：s.study 还没建好时兜底为 0，cond 里已 gate，这里只防御。
function study_g(s, k) { return (s.study && typeof s.study[k] === "number") ? s.study[k] : 0; }
// 进度比例 0~1（weeksDone / totalWeeks）。
function study_prog(s) {
  var t = study_g(s, "totalWeeks"); if (t <= 0) t = 1;
  return study_g(s, "weeksDone") / t;
}
// 改某个留学字段（带钳制），返回新值，方便 effect 内连写。
function study_set(s, k, v) { if (s.study) s.study[k] = study_clamp(v); return s.study ? s.study[k] : 0; }
function study_add(s, k, d) { return study_set(s, k, study_g(s, k) + d); }
// 中立第三人称兜底称谓（恋爱/暧昧文案用）。
function study_ta(s) { return "ta"; }
// —— 成败由「实力 + 运气」判定，而非玩家自选 ——
// 玩家只选「怎么搏」(attempt)，成与败交给一次 roll：prob 由相关属性算出，再叠加运势。
// narr=搏之前的画面叙述；pass/fail=沿用原有的成功/失败 effect（照常改状态并返回文案）。
function study_roll(s, prob, narr, pass, fail) {
  var p = Math.max(0.1, Math.min(0.92, prob + (typeof luckBias === "function" ? luckBias(s) : 0)));
  var body = rnd(p) ? pass(s) : fail(s);
  return (narr ? narr + "\n\n" : "") + body;
}

EVENTS.push(

  /* 1. 文化冲击 / 水土不服（初期，weeksDone 小） ------------------------- */
  {
    id: "ev_study_culture_shock", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") <= 6,
    title: "🌍 初来乍到，处处不对劲",
    text: (s) =>
      "落地的兴奋劲儿，撑不过第一个礼拜。\n\n" +
      "超市里你对着一整面墙的奶酪发懵，连买瓶酱油都要绕半座城；插座是另一种形状，水龙头拧反了方向，连红绿灯的「滴滴」声都和家里不一样。" +
      "室友半夜开派对，你裹着被子背单词；想点份外卖，菜单上一个词都看不太懂。\n\n" +
      "肠胃先抗议了——连着三天，你蹲在合租屋冰凉的卫生间里，怀疑自己当初是不是脑子进了水才要出来。",
    choices: [
      { label: "硬扛，逼自己尽快适应", effect: (s) => {
          study_add(s, "lang", 3); study_add(s, "homesick", 6);
          add(s, "stress", 8); add(s, "health", -5); add(s, "mind", 1);
          return "你咬牙把自己塞进陌生的节奏：迷路就多走两遍，听不懂就厚脸皮再问一遍。\n\n" +
            "进步是有的，可身体和心里都绷得发紧。深夜躺下，天花板陌生得让你眼眶发酸——但你告诉自己：扛过去，就是你的了。";
        } },
      { label: "给自己放两天假，慢慢缓", effect: (s) => {
          study_add(s, "homesick", -4); study_set(s, "credits", study_g(s, "credits") - 2);
          add(s, "health", 4); add(s, "mood", 5); add(s, "stress", -4);
          return "你决定不跟自己较劲。煮了一锅家乡味的面，关掉手机里所有焦虑的群，睡到自然醒。\n\n" +
            "水土不服的劲儿慢慢过去了，人也松快了些。只是落下的两节课，得找时间补回来——出门在外，先把自己照顾好，才谈得上别的。";
        } }
    ]
  },

  /* 2. 房东涨租 / 押金陷阱 / 室友矛盾 ----------------------------------- */
  {
    id: "ev_study_landlord", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 3,
    title: "🏠 房子的事，没一件省心",
    text: (s) =>
      "在外租房，钱包和耐心一起遭罪。\n\n" +
      (rnd(0.5)
        ? "房东突然发来消息：从下个月起，房租上涨一截，「市场价就这样，不租有的是人租」。一句话，把你本就紧巴的预算逼到了墙角。"
        : "合租的室友又把公共厨房用成了灾难现场，垃圾堆到发臭，水电费却总想让你多摊。几次旁敲侧击都被装傻挡了回去，你心里那口气越来越堵。"),
    choices: [
      { label: "据理力争，该维权就维权", effect: (s) => {
          study_add(s, "lang", 4); study_add(s, "social", 2);
          add(s, "stress", 6); add(s, "charm", 1); add(s, "insight", 2);
          var win = rnd(0.55);
          if (win) { add(s, "cash", 1200); socialShift(s, 1);
            return "你查了当地租房法规，把条款一条条摆出来，连带押金该怎么退也问得清清楚楚。\n\n" +
              "对方没料到你这个「外国学生」这么较真，理亏地退了一步。你不光保住了钱，磕磕绊绊的口语，竟在这场硬仗里练利索了。"; }
          add(s, "cash", -600); add(s, "mood", -5);
          return "你鼓起勇气理论了一番，可人在屋檐下，对方油盐不进，最后还是吃了点暗亏。\n\n" +
            "维权这堂课很贵，但你记住了：下次签合同前，一定先把每一行小字看明白。";
        } },
      { label: "忍了，赶紧另找住处搬走", effect: (s) => {
          study_add(s, "homesick", 5); study_set(s, "credits", study_g(s, "credits") - 3);
          add(s, "cash", -2500); add(s, "stress", 9); add(s, "health", -4);
          return "你不想耗着糟心，连夜在群里找房、扛箱子搬家。押金被七扣八扣，搬家又是一笔钱，几节课也泡了汤。\n\n" +
            "拖着行李走在异国深夜的街上，你忽然特别想家——那里至少有个不用看人脸色的屋檐。";
        } }
    ]
  },

  /* 3. due 周 / 考试周通宵赶 paper（gpa 波动，含两层） ------------------ */
  {
    id: "ev_study_due_week", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 4,
    title: "📑 due 周降临，通宵赶 paper",
    text: (s) =>
      "日历上那个红圈，像催命符一样逼近了。\n\n" +
      "三门课的 due 撞在了同一周，还压着一场期中考。图书馆 24 小时灯火通明，每张桌子后面都是一张顶着黑眼圈、靠咖啡续命的脸。" +
      "你的 paper 还差一半，文献读不完，引用格式一团乱——窗外天都快亮了。\n\n" +
      "你揉了揉发酸的眼睛：这一周，是拼，还是认？",
    choices: [
      { label: "连肝三个通宵，全力死磕", effect: (s) => study_roll(s,
          0.5 + (study_g(s, "gpa") - 55) / 200 + s.stats.mind / 320 + s.stats.body / 400 - s.stress / 400,
          "你把命押了上去：泡面当饭，咖啡当水，靠在椅背上眯二十分钟又爬起来敲键盘。\n\n交稿那一刻，你瘫在桌上，分不清是哭还是笑——成绩还没出，身体已经先垮了一截。",
          (s) => {
            study_add(s, "gpa", 9); study_add(s, "credits", 8); study_add(s, "lang", 3);
            add(s, "health", -8); add(s, "stress", 6); add(s, "knowledge", 2); bumpMomentum(s, 4);
            return "成绩单弹出来的瞬间，你猛地坐直——几个漂亮的高分！教授还在你的 paper 边批了一句「论证扎实」。\n\n" +
              "熬秃的几根头发、垮掉的作息，此刻都值了。你第一次真切地觉得：自己扛得住这边的强度。";
          },
          (s) => {
            study_add(s, "gpa", -3); study_add(s, "credits", 6);
            add(s, "health", -12); add(s, "stress", 10); add(s, "insight", 1);
            return "通宵熬出来的脑子是浆糊。交上去的几篇里，有一篇明显逻辑散了架，分数比预期低了一截。\n\n" +
              "你这才明白，硬熬不等于高效——人垮了，再多的时间也填不满一篇好 paper。";
          }) },
      { label: "保住睡眠，挑重点做、舍掉一门", effect: (s) => study_roll(s,
          0.62 + (study_g(s, "gpa") - 55) / 240 + s.stats.strategy / 260,
          "你做了个理智的取舍：抓住分值最高的两门死磕，那门最难啃的，干脆交个及格水准的草稿。\n\n保证每天睡够，状态稳住——但「放弃满分」这件事，多少让要强的你有点不甘。",
          (s) => {
            study_add(s, "gpa", 4); study_add(s, "credits", 5);
            add(s, "health", 2); add(s, "stress", -3); add(s, "strategy", 2);
            return "两门重点课拿了稳稳的好成绩，舍掉的那门也压线过了。算总账，比硬熬三天的同学还体面。\n\n" +
              "你学会了留学最实用的一课：分清轻重缓急，比一味苦熬重要得多。";
          },
          (s) => {
            study_add(s, "gpa", -2); study_add(s, "credits", 3); study_add(s, "homesick", 3);
            add(s, "stress", 5);
            return "重点课成绩不错，可那门「战略性放弃」的，分数低得有点危险，差一点就拉响警报。\n\n" +
              "你后怕地擦了把汗：取舍是门学问，下手轻了重了，都要付代价。";
          }) }
    ]
  },

  /* 4. 挂科预警与补考（gate gpa<40，处理不好影响毕业，含两层） --------- */
  {
    id: "ev_study_fail_warning", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "gpa") < 40,
    title: "⚠️ 挂科预警：辅导员找你谈话",
    text: (s) =>
      "邮箱里那封措辞冷静的邮件，让你心里咯噔一下——学业预警。\n\n" +
      "辅导员把你叫到办公室，推过来一张成绩单：好几门挂红，GPA 已经压到警戒线以下。「再这样下去，可能会触发学术留校察看，甚至影响你按时毕业，」ta 顿了顿，「补考是你最后的机会。」\n\n" +
      "走廊的灯白得刺眼。这条路，你还走不走得下去？",
    choices: [
      { label: "破釜沉舟，闭关备战补考", effect: (s) => study_roll(s,
          0.46 + s.stats.mind / 240 + s.stats.knowledge / 260 + study_g(s, "lang") / 400 - s.stress / 350,
          "你把社交、兼职、娱乐全部砍掉，整个人钉在自习室里。错题一遍遍重做，听不懂的录下来反复啃，硬着头皮去敲教授的 office hour。\n\n补考那天，你手心全是汗，把会的每一分都死死攥住。",
          (s) => {
            study_set(s, "gpa", 46); study_add(s, "credits", 7); study_add(s, "lang", 2);
            add(s, "stress", -4); add(s, "mind", 2); add(s, "knowledge", 2); bumpMomentum(s, 5);
            flag(s, "study_clutch_pass");
            return "成绩公布——全过了！虽然分数不漂亮，但你把自己从悬崖边拽了回来。\n\n" +
              "辅导员难得露出笑：「我就知道你行。」走出办公室，你长长舒了口气：差一点，就把家里的钱和自己的脸一起摔了。";
          },
          (s) => {
            study_set(s, "gpa", 38); study_add(s, "credits", 3); study_add(s, "homesick", 6);
            add(s, "stress", 8); add(s, "insight", 2); flag(s, "study_on_probation");
            return "你拼尽了全力，大部分救了回来，可最难的那门还是没过，要重修。毕业要往后拖，学费又多一笔。\n\n" +
              "你不是不努力，只是有些坎，真的要付出比别人多得多的代价。夜里你给家里报喜不报忧，挂了电话才红了眼。";
          }) },
      { label: "求人「划重点」走捷径，赌一把", effect: (s) => {
          if (rnd(0.45)) {
            study_set(s, "gpa", 42); study_add(s, "credits", 5); add(s, "stress", -2); add(s, "insight", -1);
            return "你托关系搞到了往年「真题」和划好的重点，临时抱佛脚也算抱住了，补考压线过了。\n\n" +
              "侥幸归侥幸，可你心里清楚：这点底子是虚的，下一道坎，捷径未必还在。";
          }
          study_set(s, "gpa", 32); study_add(s, "credits", 1); study_add(s, "homesick", 5);
          add(s, "cash", -800); add(s, "stress", 10); flag(s, "study_on_probation");
          return "你把希望全押在了「捷径」上，结果重点压根没押中，钱花了，时间也耽误了，补考照样挂。\n\n" +
            "留校察看的通知压到了头顶。你蹲在楼梯间，第一次认真想：自己是不是真的不适合走这条路。";
        } }
    ]
  },

  /* 5. 教授赏识 → 推荐信 / 助研机会（gate gpa 高） --------------------- */
  {
    id: "ev_study_prof_favor", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "gpa") >= 70 && study_g(s, "weeksDone") >= 6,
    title: "🎓 教授发来一封意味深长的邮件",
    text: (s) =>
      "你那篇课程论文，似乎被人认真读进去了。\n\n" +
      "系里那位以严苛出名的教授，课后特意留下你：「你的思路很有意思。我手上有个研究项目，缺个肯下功夫的助手——有没有兴趣？做得好，推荐信我亲自给你写。」\n\n" +
      "推荐信、助研经历，这是多少留学生求之不得的敲门砖。可它也意味着，本就满档的日程要再挤出一大块。",
    choices: [
      { label: "抓住机会，跟着教授做助研", effect: (s) => study_roll(s,
          0.5 + (study_g(s, "gpa") - 70) / 200 + s.stats.knowledge / 280 + s.stats.strategy / 320 - s.stress / 360,
          "你几乎没犹豫就答应了。从此实验室和图书馆两头跑，读不完的文献、改不完的数据，连周末都搭了进去。\n\n累，但每次和教授讨论，你都觉得自己又往上够了一截。",
          (s) => {
            study_add(s, "gpa", 5); study_add(s, "social", 8); study_add(s, "lang", 4);
            add(s, "knowledge", 3); add(s, "network", 6); add(s, "reputation", 5);
            add(s, "stress", 7); bumpMomentum(s, 5);
            flag(s, "study_has_recommendation"); socialShift(s, 2);
            return "项目结题，你的名字出现在了致谢里，甚至挂上了一篇小论文。教授那封措辞极高的推荐信，已经躺进你的文件夹。\n\n" +
              "你忽然明白，所谓机会，从来都是给那些扛得住、又肯多走一步的人准备的。";
          },
          (s) => {
            study_add(s, "gpa", -3); study_add(s, "social", 4); study_add(s, "homesick", 4);
            add(s, "network", 3); add(s, "stress", 11); add(s, "health", -6); add(s, "insight", 2);
            return "助研的活儿远比想象中重，你顾此失彼，自己几门课的成绩反倒滑了坡。\n\n" +
              "教授看出你的吃力，劝你「先顾好学业」。推荐信的事没了下文。你学到一课：机会再好，也得掂量自己接不接得住。";
          }) },
      { label: "婉拒，先稳住自己的课业和生活", effect: (s) => {
          study_add(s, "gpa", 2); add(s, "stress", -3); add(s, "insight", 1); add(s, "mood", 2);
          return "你斟酌再三，还是诚恳地谢绝了：眼下连自己的节奏都没完全踩稳，再揽重活，怕两头都做不好。\n\n" +
            "教授点点头表示理解。错过有点可惜，但你守住了自己的步调——留学这条长路，活下来比冲刺更要紧。";
        } }
    ]
  },

  /* 6. 打黑工被查 / 签证身份焦虑（叙述触发，含两层） ------------------- */
  {
    id: "ev_study_visa_worry", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 5,
    title: "🛂 签证身份，悬在头顶的那把剑",
    text: (s) =>
      "学生签证写得清楚：每周打工不能超过规定时长。可生活费、房租像两座山，逼得你偷偷多接了几个钟头的黑工。\n\n" +
      "这天后厨突然一阵骚动——有人喊「查工卡的来了」。你的心一下提到了嗓子眼：身份这根弦，从来没敢松过。一旦被查实超时打工，轻则警告，重则……你不敢往下想。",
    choices: [
      { label: "镇定配合，赌自己手续没问题", effect: (s) => study_roll(s,
          0.58 + s.stats.insight / 280 + study_g(s, "lang") / 360 - (has(s, "study_worked_hard") ? 0.12 : 0),
          "你强压住心跳，掏出证件，努力让自己的英文/外语听起来不那么慌。每一秒都像被拉长了。",
          (s) => {
            study_add(s, "lang", 3); add(s, "stress", -2); add(s, "insight", 2);
            flag(s, "study_visa_scare");
            return "对方核了核证件，例行问了几句，竟没深究就走了。你后背全是冷汗。\n\n" +
              "从那天起，你再不敢碰超时的黑工——再缺钱，也不能拿身份去赌。这堂课，惊出你一身白毛汗。";
          },
          (s) => {
            study_add(s, "homesick", 8); study_set(s, "credits", study_g(s, "credits") - 2);
            add(s, "cash", -3000); add(s, "stress", 14); add(s, "health", -5);
            add(s, "reputation", -4); flag(s, "study_visa_flagged");
            return "你的超时打工还是被记了下来。接下来是没完没了的问询、说明、罚款，甚至惊动了学校的国际生办公室。\n\n" +
              "签证状态一度悬在半空。那些夜里，你攥着手机不敢睡，生怕一封邮件就把你这几年的努力清零。";
          }) },
      { label: "趁乱先溜，从此金盆洗手", effect: (s) => {
          study_add(s, "homesick", 4); add(s, "cash", -500); add(s, "stress", 6); add(s, "insight", 2);
          flag(s, "study_visa_scare");
          return "你借口去倒垃圾，从后门溜了，连这周工钱都没敢去要。\n\n" +
            "回到出租屋，你把藏起来的黑工排班表撕了个粉碎。钱可以再省，身份不能赌——这道理，你是被吓懂的。";
        } }
    ]
  },

  /* 7. 语言尴尬 / 被歧视 / 鼓起勇气开口（lang 相关，含两层） ----------- */
  {
    id: "ev_study_language_pride", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "lang") < 65,
    title: "🗣️ 一句话卡在喉咙里",
    text: (s) =>
      "课堂讨论，教授点到了你。\n\n" +
      "答案明明在脑子里转了一圈，可一开口，舌头就打了结。后排有人没忍住笑出了声，还有人小声学你的口音。你的脸「腾」地烧了起来，恨不得钻进地缝。\n\n" +
      (rnd(0.5)
        ? "更让你难受的是，平时小组里也总有人默契地越过你，仿佛你的意见不值一听。"
        : "下了课，你想起兼职时那个故意把你听不懂的俚语说得飞快、看你出糗的顾客，胸口又闷又堵。"),
    choices: [
      { label: "深吸一口气，硬着头皮把话说完", effect: (s) => study_roll(s,
          0.45 + (study_g(s, "lang") - 50) / 180 + s.stats.charm / 280 + s.stats.mind / 360,
          "你攥紧笔，强迫自己把那口气咽下去，一个词一个词、磕磕绊绊地把观点讲完。声音在抖，但你没停。",
          (s) => {
            study_add(s, "lang", 6); study_add(s, "social", 5);
            add(s, "charm", 2); add(s, "mind", 1); add(s, "stress", -3); bumpMomentum(s, 3);
            socialShift(s, 1);
            return "你讲完，教室竟静了一下，随即教授带头点头：「这个角度很好。」刚才笑你的人，反倒认真记起了笔记。\n\n" +
              "原来口音不是罪，闭嘴才是。从这天起，你发言越来越敢——语言这关，是靠一次次硬开口磨出来的。";
          },
          (s) => {
            study_add(s, "lang", 3); study_add(s, "homesick", 3);
            add(s, "stress", 4); add(s, "insight", 2); add(s, "mind", 1);
            return "话没说完就被人抢了白，你心里堵得慌。可这一次，你没有像从前那样低头认怂，而是把没说完的硬补了回去。\n\n" +
              "进步不会一蹴而就，但你守住了一件事：再难，也不把自己的声音让出去。";
          }) },
      { label: "笑笑带过，回去偷偷练到深夜", effect: (s) => {
          study_add(s, "lang", 4); study_add(s, "homesick", 4);
          add(s, "stress", 5); add(s, "knowledge", 1); add(s, "mood", -3);
          return "当场你没争，只是僵硬地笑了笑。可回到屋里，你对着镜子一遍遍练发音，跟读到舌头发麻、眼眶发热。\n\n" +
            "委屈是真的，要强也是真的。你把所有不甘都压进了深夜的练习里——总有一天，让他们听不出你是「外人」。";
        } }
    ]
  },

  /* 8. 校园恋爱 / 异国心动（尊重 orientation，称谓中立，含两层） ------- */
  {
    id: "ev_study_campus_crush", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "social") >= 35 && study_g(s, "weeksDone") >= 6,
    title: "💞 异国他乡，一点心动",
    text: (s) => {
      var t = study_ta(s);
      return "孤身在外的日子里，有人成了你灰扑扑生活里的一点亮。\n\n" +
        "可能是图书馆固定坐你对面、会替你占座的那个人；可能是小组作业里和你一拍即合、聊到深夜还不困的搭档。" +
        "ta 听得懂你蹩脚的玩笑，记得你想家时随口提过的家乡小吃。\n\n" +
        "某个散场的夜里，路灯把两个影子拉得很长。" + t + "忽然停下脚步看你，眼神里有话——你的心跳，没出息地漏了一拍。";
    },
    choices: [
      { label: "鼓起勇气，把心动说出口", effect: (s) => study_roll(s,
          0.42 + s.stats.charm / 180 + (study_g(s, "social") - 40) / 220 + s.stats.insight / 400,
          "你深吸一口气，把那句憋了很久的话，连同发烫的脸一起递了出去。空气安静得能听见自己的心跳。",
          (s) => {
            study_add(s, "social", 8); study_add(s, "homesick", -10); study_add(s, "lang", 3);
            add(s, "mood", 12); add(s, "charm", 2); add(s, "stress", -5); bumpMomentum(s, 4);
            flag(s, "study_in_love");
            return "ta 笑了，耳根也红：「我还以为，要一直等你先开口呢。」\n\n" +
              "异国的夜风都变得温柔起来。从此再晚的图书馆，也有人陪你走回家；再深的思乡，也有个肩膀可以靠。这一程，不再是一个人。";
          },
          (s) => {
            study_add(s, "social", 3); study_add(s, "homesick", 6);
            add(s, "mood", -6); add(s, "insight", 2); add(s, "charm", 1);
            return "ta 怔了一下，眼神里有歉意：「对不起……我很珍惜你这个朋友。」\n\n" +
              "你笑着说没关系，转身时却把酸涩咽了回去。心动没有结果，但你不后悔——至少在异乡，你还敢去喜欢一个人。";
          }) },
      { label: "把心思藏好，珍惜这份陪伴", effect: (s) => {
          study_add(s, "social", 4); study_add(s, "homesick", -4);
          add(s, "mood", 3); add(s, "insight", 1);
          return "你想了想，没把那层窗户纸捅破。眼下学业、身份、未来都还悬着，你不想让一段感情多一层负担。\n\n" +
            "你把心动悄悄收好，只是更珍惜这份难得的陪伴。有些喜欢，安静地放在心里，也是一种圆满。";
        } }
    ]
  },

  /* 9. 思乡崩溃 / 节日一个人（gate homesick>70，给宣泄或调节） --------- */
  {
    id: "ev_study_homesick_break", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "homesick") > 70,
    title: "🌙 节日的夜里，只剩你一个人",
    text: (s) =>
      "又是一个家里阖家团圆的节日。\n\n" +
      "视频那头，桌上摆满了你最爱吃的菜，亲人挤在小小的屏幕里冲你笑、让你「好好的」。你也笑，笑着笑着，眼泪就不受控制地往下掉。\n\n" +
      "挂了电话，出租屋安静得吓人，窗外是听不懂的喧闹和别人家的灯火。这半年攒下的委屈、孤独、撑着的那口气，在这一刻，全垮了。",
    choices: [
      { label: "痛痛快快哭一场，把情绪倒出来", effect: (s) => {
          study_set(s, "homesick", 48); add(s, "mood", 6); add(s, "stress", -10);
          add(s, "health", 2); add(s, "insight", 2);
          return "你抱着膝盖，在黑暗里哭得稀里哗啦，把所有不敢跟家里说的苦，统统哭了出来。\n\n" +
            "哭够了，反倒轻松了。你洗了把脸，给自己煮了碗热汤面。崩溃不丢人——倒空了，明天才有力气接着撑。";
        } },
      { label: "约上同样独自在外的朋友凑一桌", effect: (s) => {
          study_set(s, "homesick", 42); study_add(s, "social", 6);
          add(s, "mood", 9); add(s, "stress", -6); add(s, "network", 3); add(s, "charm", 1);
          socialShift(s, 1);
          return "你抹掉眼泪，在群里吼了一嗓子：「都别一个人扛着，来我这凑顿饭！」\n\n" +
            "几个同样没回家的留学生七手八脚地包起了饺子，把小出租屋挤得热气腾腾。原来思乡这件事，是可以一群人一起扛的。这一晚，你们成了彼此的「家人」。";
        } },
      { label: "把思念压回心底，逼自己去自习", effect: (s) => {
          study_set(s, "homesick", 64); study_add(s, "gpa", 3); study_add(s, "credits", 3);
          add(s, "stress", 6); add(s, "knowledge", 1); add(s, "mood", -4);
          return "你狠狠心，关掉视频，拎起书包又钻进了空荡荡的自习室。把眼泪逼回去，把所有思念都换成笔尖的沙沙声。\n\n" +
            "成绩是涨了，可那口堵在胸口的气始终没散。有些苦你扛得住，只是别一直一个人硬扛——身体会替你记着账。";
        } }
    ]
  },

  /* 10. 兼职升职 / 攒下第一笔钱的成就感 -------------------------------- */
  {
    id: "ev_study_parttime_raise", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 7,
    title: "💪 兼职被「看上了」",
    text: (s) =>
      "那份起初让你手忙脚乱的兼职——端盘子、做收银、当助教——你不知不觉做出了门道。\n\n" +
      "这天店长/主管把你叫到一边：「你做事靠谱，客人也喜欢你。要不要带新人、多排点班，时薪给你加一档？」\n\n" +
      "你愣了一下，随即心里涌上一股久违的踏实——在异国，靠自己的双手挣的认可，分量格外重。",
    choices: [
      { label: "接下来，多排班多挣钱", effect: (s) => {
          study_add(s, "social", 5); study_add(s, "lang", 4); study_add(s, "homesick", -3);
          study_set(s, "credits", study_g(s, "credits") - 2);
          add(s, "cash", 4500); add(s, "charm", 1); add(s, "stress", 5); add(s, "network", 2);
          bumpMomentum(s, 2);
          return "你扛起了更多的班，也学会了用外语指挥、和形形色色的人打交道。月底数着卡里多出来的钱，你给家里转了一笔，附言「不用担心我」。\n\n" +
            "腰板挺直了，口语也练精了。只是课业的时间被挤掉一些——挣钱和读书，永远是留学生的一道平衡题。";
        } },
      { label: "稳住课时，只小幅加班", effect: (s) => {
          study_add(s, "social", 3); study_add(s, "lang", 2);
          add(s, "cash", 1800); add(s, "mood", 5); add(s, "insight", 2); add(s, "strategy", 1);
          return "你谢过这份赏识，但只小小地加了点班——你很清楚，自己飞这么远，主线是那纸文凭。\n\n" +
            "卡里第一次有了点像样的积蓄，那是靠自己挣来的底气。你拎得清主次，这份清醒，比多挣的那点钱更值钱。";
        } }
    ]
  },

  /* 11. 学术诚信危机：抄袭/代写诱惑（道德抉择，作弊被抓后果重，含两层） */
  {
    id: "ev_study_integrity", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 5,
    title: "🚨 deadline 前，有人递来「捷径」",
    text: (s) =>
      "凌晨三点，paper 还差一大半，你的脑子已经转不动了。\n\n" +
      "就在这时，留学生群里弹出一条广告：「专业代写，原创包过，导师查不出。」紧接着，私信也亮了——有「学长」热心地把往届答案打包发来，「直接抄一抄，神不知鬼不觉」。\n\n" +
      "诱惑就摊在屏幕上：省下几个不眠夜，换一个稳稳的分数。可这边对学术诚信的红线，向来狠辣——抄袭、代写一旦坐实，轻则零分，重则开除遣返。指尖悬在键盘上，你迟迟没敢落下。",
    choices: [
      { label: "顶住诱惑，自己一个字一个字啃", effect: (s) => study_roll(s,
          0.48 + (study_g(s, "gpa") - 55) / 220 + s.stats.knowledge / 280 + s.stats.mind / 360,
          "你把那些消息一条条删掉，灌下今晚第四杯咖啡，回到空白的文档前。慢就慢吧，至少每个字都是自己的。",
          (s) => {
            study_add(s, "gpa", 5); study_add(s, "credits", 6); study_add(s, "knowledge", 0);
            add(s, "knowledge", 2); add(s, "mind", 2); add(s, "stress", 6); add(s, "reputation", 3);
            bumpMomentum(s, 3); flag(s, "study_clean_record");
            return "天亮时，你交上了一篇磕磕绊绊、却完完全全属于自己的 paper。分数不是最高，但每一分你都问心无愧。\n\n" +
              "你忽然懂了：文凭的含金量，不在那张纸，而在你能不能在没人看见的深夜，守住自己的底线。";
          },
          (s) => {
            study_add(s, "gpa", 1); study_add(s, "credits", 4); study_add(s, "homesick", 3);
            add(s, "health", -6); add(s, "stress", 8); add(s, "insight", 3);
            return "你没投机，硬扛下来了。成绩平平，人也熬得够呛，但你睡得着觉。\n\n" +
              "身边有人靠代写拿了高分，你心里也曾不平衡。可你告诉自己：那点分数，不值得拿前途去赌。";
          }) },
      { label: "鬼迷心窍，抄了 / 找了代写", effect: (s) => study_roll(s,
          0.45 - study_g(s, "weeksDone") / 1500,
          "你说服自己「就这一次」，把答案改头换面抄了上去，或是付钱买了一篇。点下提交键的那一刻，竟有种偷来的轻松。",
          (s) => {
            study_add(s, "gpa", 4); study_add(s, "credits", 5); add(s, "stress", 4); add(s, "insight", -2);
            flag(s, "study_cheated");
            return "查重报告飘绿，分数到手。可那点轻松没撑多久——你开始怕邮件、怕约谈，怕哪天东窗事发。\n\n" +
              "侥幸过了关，心却虚了。这根弦一旦松了，往后每一次 due，你都会想再走一次捷径。";
          },
          (s) => {
            study_set(s, "gpa", Math.min(study_g(s, "gpa"), 25));
            study_set(s, "credits", Math.max(0, study_g(s, "credits") - 12));
            study_add(s, "homesick", 12);
            add(s, "stress", 18); add(s, "reputation", -12); add(s, "health", -6);
            add(s, "cash", -2000); flag(s, "study_integrity_caught");
            return "系统比你想的灵得多。一封邮件把你叫到了学术诚信委员会，证据摆了一桌。\n\n" +
              "这门课直接零分记入档案，留校察看，差一点被开除遣返。家里的钱、几年的努力、你的脸面，全因这一念之差摔得粉碎。那一夜你才彻骨地懂：有些便宜，碰都不能碰。";
          }) }
    ]
  },

  /* 12. 实习 / 校招 offer（gate 后期 + gpa/lang，含两层） -------------- */
  {
    id: "ev_study_internship", module: "study", ambient: true,
    cond: (s) => s.study && study_prog(s) >= 0.5 && study_g(s, "gpa") >= 55 && study_g(s, "lang") >= 50,
    title: "💼 海外校招：一封面试邀请",
    text: (s) =>
      "投出去几十份石沉大海的简历后，邮箱里终于跳出一封不一样的。\n\n" +
      "一家本地公司向你发来了面试邀请——这是难得的实习/留用机会，对将来想留下的留学生来说，几乎是命门所在。可你也清楚，跟你竞争的本地学生，主场作战、语言无碍，你这个「外来者」想突围，得拿出真东西。",
    choices: [
      { label: "认真准备，硬碰硬去面", effect: (s) => study_roll(s,
          0.32 + (study_g(s, "gpa") - 55) / 220 + (study_g(s, "lang") - 50) / 180 + s.stats.charm / 320 + s.stats.strategy / 320,
          "你把公司研究了个底朝天，对着镜子反复演练面试问答，连可能被刁难的英文/外语问题都准备了应答。面试那天，你深吸一口气，推开了门。",
          (s) => {
            study_add(s, "social", 8); study_add(s, "lang", 5); study_add(s, "homesick", -6);
            add(s, "cash", 6000); add(s, "network", 8); add(s, "reputation", 6);
            add(s, "charm", 2); add(s, "strategy", 2); bumpMomentum(s, 6);
            flag(s, "study_got_offer"); socialShift(s, 2);
            return "几轮面下来，你的专业和那股拼劲打动了对方。一周后，offer 邮件到了——你盯着屏幕，半天没回过神。\n\n" +
              "在异国靠自己拿下一份正经工作，这一刻的踏实，足以抵掉过去所有的孤独和心酸。留下来的路，第一次清晰了起来。";
          },
          (s) => {
            study_add(s, "lang", 4); study_add(s, "social", 3); study_add(s, "homesick", 4);
            add(s, "insight", 3); add(s, "stress", 6); add(s, "strategy", 1);
            return "终面还是没过，对方礼貌地回了句「再考虑考虑」。失落是难免的，可你把每个被问住的问题都记了下来。\n\n" +
              "第一次正面交手就有收获——你知道自己差在哪了，下一次，你会更有底气地走进那扇门。";
          }) },
      { label: "心里没底，找了借口推掉", effect: (s) => {
          study_add(s, "homesick", 5); add(s, "stress", -2); add(s, "mood", -4); add(s, "insight", 1);
          return "你越想越怵，担心语言、担心被刷，最后还是找了个理由婉拒了面试。\n\n" +
            "那天你松了口气，可夜里又有点懊悔：machine 都没上场，怎么知道赢不赢？错过的，未必是这家公司，而是一次逼自己长大的机会。";
        } }
    ]
  },

  /* 13. 社团 / 派对 / 交到知心朋友（social） ---------------------------- */
  {
    id: "ev_study_club_friend", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 4,
    title: "🎈 社团招新，要不要凑个热闹",
    text: (s) =>
      "校园广场上摆满了社团摊位：登山的、做饭的、跳舞的、辩论的……还有中国学生学者联谊会的横幅，老乡的乡音一下子把你拽住了。\n\n" +
      "招新的同学热情地往你手里塞传单：「来玩呀！别一个人闷着！」你站在熙熙攘攘的人群里，犹豫要不要迈出这一步。",
    choices: [
      { label: "豁出去，报名最感兴趣的社团", effect: (s) => {
          study_add(s, "social", 9); study_add(s, "homesick", -7); study_add(s, "lang", 3);
          add(s, "mood", 8); add(s, "network", 5); add(s, "charm", 2); add(s, "stress", -4);
          socialShift(s, 2); flag(s, "study_in_club");
          return "你一咬牙报了名。第一次活动你紧张得手心冒汗，可大家比想象中友善。一来二去，你竟交到了几个能掏心窝子的朋友——有老乡，也有本地人。\n\n" +
            "留学不只是读书。当你在异乡有了「自己人」，那种漂泊无依的感觉，悄悄被填上了一块。";
        } },
      { label: "社恐发作，接了传单就走", effect: (s) => {
          study_add(s, "social", -2); study_add(s, "homesick", 4);
          add(s, "mood", -3); add(s, "knowledge", 1); add(s, "insight", 1);
          return "你含糊地笑笑，接过传单就快步离开了。回到屋里，传单被你随手压在了书堆下。\n\n" +
            "省下的时间多读了点书，可窗外别人成群结队的笑声，还是让你心里空落落的。圈子是逼自己迈出去才有的——这一步，你又往后退了退。";
        } }
    ]
  },

  /* 14. 回国 vs 留下的纠结（gate 临近毕业，含两层） -------------------- */
  {
    id: "ev_study_stay_or_go", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") > study_g(s, "totalWeeks") * 0.8,
    title: "✈️ 毕业在即：回国，还是留下？",
    text: (s) =>
      "学业接近尾声，那个一直被你往后拖的问题，再也躲不掉了——毕业之后，留下，还是回家？\n\n" +
      "留下，意味着继续在这片土地上闯，机会或许更多，可身份、孤独、想家的苦还得接着熬；回去，意味着回到熟悉的乡音和亲人身边，可又怕这几年的海外文凭，回国后变成「水土不服」的尴尬。\n\n" +
      "深夜的出租屋里，你翻来覆去——这道选择题，没有标准答案，只关乎你想要怎样的人生。",
    choices: [
      { label: "留下闯一闯，把根扎在这里", effect: (s) => study_roll(s,
          0.45 + (study_g(s, "social") - 40) / 200 + s.network / 220 + (study_g(s, "gpa") - 55) / 240 + (has(s, "study_got_offer") ? 0.18 : 0),
          "你决定再赌一把青春。投简历、办身份、咬牙续上这份漂泊——你想看看，自己究竟能在异乡走多远。",
          (s) => {
            study_add(s, "social", 6); study_add(s, "homesick", -4);
            add(s, "network", 6); add(s, "strategy", 2); add(s, "reputation", 4);
            add(s, "stress", 6); bumpMomentum(s, 4);
            flag(s, "study_choose_stay"); flag(s, "abroad_stay");
            return "凭着这几年攒下的成绩、人脉和那股不服输的劲儿，你在这边的下一程有了着落。\n\n" +
              "前路依旧有风浪，可你已经不是当初那个连买酱油都犯怵的新人了。这片曾经陌生的土地，被你一寸寸踩成了「家」。";
          },
          (s) => {
            study_add(s, "homesick", 8); add(s, "stress", 10); add(s, "insight", 3); add(s, "mind", 1);
            flag(s, "study_choose_stay"); flag(s, "abroad_stay");
            return "留下的路比想象中难走，身份、工作、孤独，一关接一关。有无数个想家的夜晚，你问自己值不值。\n\n" +
              "但你认了这个选择。人这一辈子，总得有那么一次，为了「想要」而不是「安稳」，远远地拼一回。";
          }) },
      { label: "收拾行囊回国，回到亲人身边", effect: (s) => study_roll(s,
          0.5 + (study_g(s, "gpa") - 55) / 220 + s.reputation / 220 + (has(s, "abroad_honors") ? 0.15 : 0),
          "你订下了回程的机票。看着窗外住了几年的街道，五味杂陈——这里有过你的眼泪和成长，但家的方向，终究在海的那头。",
          (s) => {
            study_set(s, "homesick", 10);
            add(s, "knowledge", 2); add(s, "charm", 2); add(s, "network", 3);
            add(s, "reputation", 5); add(s, "mood", 8); bumpMomentum(s, 4);
            flag(s, "study_choose_return"); flag(s, "abroad_return");
            return "你带着海外的视野和那纸文凭回来了。落地的瞬间，熟悉的乡音、亲人的拥抱，让你眼眶一热。\n\n" +
              "这几年的苦没有白吃——它们成了你身上别人拿不走的东西。新的起点就在脚下，而这一次，你不再是孤身一人。";
          },
          (s) => {
            study_set(s, "homesick", 5); add(s, "mood", 5); add(s, "insight", 2); add(s, "stress", 3);
            flag(s, "study_choose_return"); flag(s, "abroad_return");
            return "回国后才发现，离开太久，连家乡都有了些陌生：节奏、人情、机会，都要重新摸。短暂的「逆向水土不服」让你有点恍惚。\n\n" +
              "可每晚能和家人围坐一桌吃饭，那份踏实，是漂泊几年都换不来的。慢慢来，总会重新长进这片土地里。";
          }) }
    ]
  },

  /* 15. 现实压力：家里出事 / 汇率波动 / 学费上涨 ----------------------- */
  {
    id: "ev_study_money_shock", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 6,
    title: "💱 一通电话，或一封涨费通知",
    text: (s) =>
      "留学的账，从来不只是自己的事。\n\n" +
      (rnd(0.34)
        ? "家里打来电话，语气小心翼翼：长辈身体出了点状况，家里一时周转不开，原本按月汇的生活费，怕是要紧一紧。你听着电话那头的为难，心一下子揪紧了。"
        : (rnd(0.5)
          ? "汇率毫无预兆地剧烈波动，同样一笔家里寄来的钱，换成当地货币竟缩水了一大截。看着卡里的余额，你倒吸一口凉气。"
          : "学校一纸通知：下学年学费上调。本就咬牙撑着的预算，被这一下打得措手不及。")),
    choices: [
      { label: "多接兼职、省吃俭用，自己扛", effect: (s) => {
          study_add(s, "social", 3); study_add(s, "lang", 3); study_add(s, "homesick", 6);
          study_set(s, "credits", study_g(s, "credits") - 3);
          add(s, "cash", 3000); add(s, "health", -7); add(s, "stress", 12); add(s, "strategy", 1);
          add(s, "mind", 1);
          return "你不想让家里再为你操心，默默把兼职排满，把伙食砍到最省，连暖气都舍不得多开。\n\n" +
            "钱是省出来、挣出来了，可身体熬瘦了一圈，学习的时间也被啃掉不少。你在电话里依旧报喜不报忧——长大，就是把苦自己咽下去。";
        } },
      { label: "申请助学金 / 奖学金，正经求助", effect: (s) => {
          var win = study_g(s, "gpa") >= 60 ? rnd(0.7) : rnd(0.35);
          study_add(s, "lang", 2);
          if (win) {
            add(s, "cash", 5000); add(s, "reputation", 4); add(s, "stress", -3);
            add(s, "insight", 2); flag(s, "study_got_aid");
            return "你硬着头皮去了国际生办公室，填表、写情况说明、磕磕绊绊地陈述困难。功夫没白费——一笔助学金/紧急补助批了下来。\n\n" +
              "原来求助不丢人。这边给留学生留的这条路，被你认真走通了，肩上的担子一下轻了大半。";
          }
          add(s, "stress", 7); add(s, "homesick", 4); add(s, "insight", 2);
          study_add(s, "homesick", 3);
          return "你鼓起勇气申请了，可名额有限、条件没完全够上，这次没能批下来。\n\n" +
            "失望是有的，但跑这一趟，你摸清了流程，也认识了肯帮你的老师。钱的难题暂时还压着，可你知道，这条路下次还能再试。";
      } }
    ]
  },

  /* 16. 假房东 / 远程看房骗局：素材来自留学生租房诈骗高发问题，改写为原创事件 */
  {
    id: "ev_study_fake_landlord", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "weeksDone") <= 14,
    title: "🏚️ 完美房源，完美得像骗局",
    text: (s) =>
      "你在租房群里刷到一套神仙房源：离学校十分钟、独立卫浴、家具全包、价格还比市场低三成。\n\n" +
      "「房东」热情得不像真人，发来一堆阳光明媚的照片，还催你今天就打押金：「很多人在看，先付先得。」最妙的是，对方说自己正在外地，不能带看，但钥匙可以快递给你。\n\n" +
      "你盯着那几张漂亮到像样板间的照片，心里一半狂喜，一半发毛。",
    choices: [
      { label: "先打押金，机会不等人", effect: (s) => {
          add(s, "cash", -3200); add(s, "stress", 12); add(s, "mood", -10);
          study_add(s, "homesick", 8); study_add(s, "social", -2);
          flag(s, "study_rental_scammed");
          return "你转了押金，对方秒回一个握手表情。第二天，头像灰了，账号注销了，所谓钥匙也从未出现。\n\n" +
            "你拖着行李在临时旅馆里坐到半夜，才明白「先付先得」的意思：先付的人，先得到一堂社会课。";
        } },
      { label: "要求视频看房和合同，查清再说", effect: (s) => {
          study_add(s, "lang", 3); study_add(s, "social", 2);
          add(s, "insight", 3); add(s, "stress", -2);
          return "你坚持要视频看房、正规合同和房东身份证明。对方先是装忙，后来干脆消失。\n\n" +
            "你没租到梦中情房，但保住了钱包。留学第一课：太便宜的房子，往往贵在后面。";
        } },
      { label: "发群里问问，有没有人认识", effect: (s) => {
          study_add(s, "social", 6); study_add(s, "homesick", -2);
          add(s, "network", 3); add(s, "mood", 4); add(s, "insight", 2);
          return "你把截图发到学生群里，立刻有人跳出来：「别转！这个图我上个月见过，城市名都没改。」\n\n" +
            "大家顺手扒出一串同款骗局，你也因此认识了几个靠谱学长学姐。世界很坑，但好在坑边常有人拉你一把。";
        } }
    ]
  },

  /* 17. 假移民局 / 税务电话：身份焦虑 + 礼品卡诈骗，荒诞但现实 */
  {
    id: "ev_study_fake_official_call", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 5,
    title: "📞 「移民局」来电：请用礼品卡证明清白",
    text: (s) =>
      "一个陌生号码打来，对方用极其正式的语气念出你的名字、学校和签证类型，说你的身份记录出了问题。\n\n" +
      "「如果不立刻处理，你会被遣返。」电话那头甚至放起了排队转接的音乐，像真有一个部门正在为你忙碌。最后，对方要求你去便利店买礼品卡，把卡号念给他们，用来「冻结违规记录」。\n\n" +
      "荒诞到像笑话，可「遣返」两个字，还是把你的手心吓出汗。",
    choices: [
      { label: "慌了，照做买卡", effect: (s) => {
          add(s, "cash", -5000); add(s, "stress", 18); add(s, "mood", -14); add(s, "health", -4);
          study_add(s, "homesick", 10); flag(s, "study_scammed_official");
          return "你跑去便利店买了一摞礼品卡，照着电话一张张念。店员看你的眼神越来越复杂，可你已经听不进劝。\n\n" +
            "直到国际生办公室告诉你这是诈骗，你才瘫坐在椅子上。钱没了，更难受的是那种被身份恐惧拿捏的羞耻感。";
        } },
      { label: "挂断，联系学校国际生办公室", effect: (s) => {
          study_add(s, "lang", 3); study_add(s, "social", 3);
          add(s, "stress", -6); add(s, "insight", 4); add(s, "mood", 3);
          flag(s, "study_scam_aware");
          return "你强迫自己挂断电话，转头联系学校国际生办公室。老师一听「礼品卡」三个字就笑不出来了：「诈骗，别回拨，别转钱。」\n\n" +
            "你把号码举报了，还在学生群里发了提醒。那一刻你发现，留学生最需要的技能之一，是在害怕时先别付款。";
        } },
      { label: "反问：哪个部门收礼品卡？", effect: (s) => {
          add(s, "stress", -3); add(s, "mood", 5); add(s, "insight", 3); add(s, "charm", 1);
          return "你冷静反问：「请问哪个政府部门用礼品卡办公？」电话那头沉默两秒，骂了一句，挂了。\n\n" +
            "你端着手机愣了半天，突然笑出声。原来识破骗局的关键，不是英语多好，是常识还在线。";
        } }
    ]
  },

  /* 18. 银行开户闭环：没地址不能开户，没银行卡租不到房 */
  {
    id: "ev_study_bank_loop", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "weeksDone") <= 10,
    title: "🏦 银行开户的闭环地狱",
    text: (s) =>
      "你去银行开户，柜员礼貌地问：「请提供住址证明。」\n\n" +
      "可你租房需要银行卡付押金，办银行卡又需要住址证明；学校宿舍说证明要等系统更新，系统说请先上传本地银行卡扣费。你站在柜台前，感觉自己被一条行政蛇咬住了尾巴。\n\n" +
      "这不是难，是逻辑学考试。",
    choices: [
      { label: "一趟趟跑，把材料补齐", effect: (s) => {
          study_add(s, "lang", 4); study_add(s, "social", 2);
          add(s, "stress", 7); add(s, "strategy", 2); add(s, "insight", 2);
          return "你跑银行、学校、宿舍办公室，三处来回盖章，终于凑出一份谁也说不清为什么有效的证明。\n\n" +
            "卡开下来的那一刻，你没有喜悦，只有一种通关低配副本的疲惫。留学不是从上课开始的，是从学会和系统绕圈开始的。";
        } },
      { label: "找学长学姐问偏方", effect: (s) => {
          study_add(s, "social", 7); study_add(s, "homesick", -3);
          add(s, "network", 4); add(s, "stress", -2); add(s, "cash", -200);
          return "学姐听完你的遭遇，只回了三个字：「懂，来。」她带你去了另一家支行，找了一个熟悉国际生材料的柜员。\n\n" +
            "二十分钟后，账户开好了。世界并没有变合理，只是你终于找到了攻略。";
        } }
    ]
  },

  /* 19. 课堂文化冲击：讨论课没人救场，教授偏要你发言 */
  {
    id: "ev_study_seminar_silence", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 4,
    title: "🗣️ 讨论课上，教授看向了你",
    text: (s) =>
      "这门课没有标准答案，只有一圈桌子和一个热爱沉默的教授。\n\n" +
      "本地同学已经开始互相打断、质疑、补充，你还在脑内把一句话翻译成三种语序。就在你准备继续当空气时，教授温柔地看向你：「What do you think?」\n\n" +
      "全班安静下来。你的心跳开始替你做 presentation。",
    choices: [
      { label: "硬着头皮开口，哪怕说得磕巴", effect: (s) => {
          study_add(s, "lang", 6); study_add(s, "social", 4); study_add(s, "gpa", 2);
          add(s, "stress", 5); add(s, "charm", 1); add(s, "mood", 3);
          return "你磕磕绊绊地说完了自己的观点，中间还忘了一个关键单词，只好用手比划。可教授点了点头，顺着你的意思继续讨论。\n\n" +
            "没人笑你。原来课堂参与不是演讲比赛，是把脑子拿出来和别人碰一下。";
        } },
      { label: "说一句「我同意前面同学」", effect: (s) => {
          study_add(s, "lang", 1); study_add(s, "gpa", -1); study_add(s, "homesick", 3);
          add(s, "stress", -1); add(s, "mood", -3);
          return "你憋了半天，只挤出一句「I agree with him」。教授礼貌微笑，空气重新流动。\n\n" +
            "你逃过一劫，却在课后越想越懊恼。沉默很安全，但安全久了，语言和自信都会退化。";
        } },
      { label: "提前写小抄，下次主动举手", effect: (s) => {
          study_add(s, "lang", 4); study_add(s, "gpa", 3); study_add(s, "social", 2);
          add(s, "stress", 3); add(s, "strategy", 2);
          return "这次你没发挥好，但回去后把下节课可能讨论的问题提前写成小卡片。下一次，你主动举了手。\n\n" +
            "那句话依旧不完美，却是你自己伸出去的一只脚。融入有时不是变外向，而是准备好再勇敢一点。";
        } }
    ]
  },

  /* 20. 厨房消防警报：中华爆炒与异国烟雾报警器的战争 */
  {
    id: "ev_study_fire_alarm_wok", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 2,
    title: "🚨 一锅爆炒，惊动整栋楼",
    text: (s) =>
      "你只是想炒个青椒肉丝，找回一点家的味道。\n\n" +
      "油刚热，蒜末一下锅，香气还没来得及感动你，烟雾报警器先被感动疯了。尖锐警报响彻整栋楼，室友抱着电脑冲出房间，楼下有人穿着睡衣往外跑。\n\n" +
      "三分钟后，消防车来了。你端着锅铲，站在寒风里，像一个因葱姜蒜被捕的异乡人。",
    choices: [
      { label: "诚恳道歉，研究厨房规则", effect: (s) => {
          study_add(s, "social", 4); study_add(s, "lang", 2); study_add(s, "homesick", -2);
          add(s, "cash", -300); add(s, "stress", 4); add(s, "insight", 2);
          return "你给室友和管理员道了歉，认真研究了油烟、排风和报警器的触发逻辑。后来你学会了先开窗、后下锅、少放油。\n\n" +
            "家乡味没有放弃你，只是要求你和当地消防系统达成停火协议。";
        } },
      { label: "从此改吃沙拉和微波炉饭", effect: (s) => {
          study_add(s, "homesick", 5); add(s, "health", 2); add(s, "mood", -5); add(s, "stress", -2);
          return "你被这场警报吓得从此不敢开火，冰箱里塞满沙拉、酸奶和微波炉饭。\n\n" +
            "身体轻了，灵魂淡了。某天夜里你梦见热油里滋啦一声的葱花，醒来差点哭出来。";
        } },
      { label: "邀请室友吃饭，把事故变聚餐", effect: (s) => {
          study_add(s, "social", 8); study_add(s, "homesick", -6); study_add(s, "lang", 3);
          add(s, "cash", -500); add(s, "mood", 8); add(s, "charm", 2); socialShift(s, 2);
          return "你干脆请室友们来尝一顿「低烟版家常菜」。他们一边被辣得吸气，一边竖起大拇指。\n\n" +
            "那天以后，厨房门口多了几张便利贴：今天谁做饭、谁开窗、谁负责盯报警器。事故变成了饭局，饭局变成了关系。";
        } }
    ]
  },

  /* 21. 包裹与海关：家里寄来的温暖，卡在边检逻辑里 */
  {
    id: "ev_study_customs_parcel", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "homesick") >= 35 && study_g(s, "weeksDone") >= 8,
    title: "📦 家里寄来的包裹，被海关研究了",
    text: (s) =>
      "家里给你寄了一个巨大的包裹：秋衣、药膏、火锅底料、你最爱吃的零食，还有一张写着「别太省」的小纸条。\n\n" +
      "包裹在海关卡了十天。查询页面冷冰冰地显示：需要补充说明。你点开清单，发现工作人员似乎对「老干妈」「板蓝根」「真空腊肠」产生了宇宙级困惑。\n\n" +
      "亲情跨过半个地球，暂时败给了申报表。",
    choices: [
      { label: "老实补材料，逐项解释", effect: (s) => {
          study_add(s, "lang", 3); study_add(s, "homesick", -5);
          add(s, "stress", 3); add(s, "mood", 7); add(s, "insight", 2);
          return "你把每一项都认真翻译解释，甚至给火锅底料写出了近似学术摘要。几天后，包裹终于到了。\n\n" +
            "拆箱那一刻，熟悉的味道冲出来。你抱着那包被漂洋过海审查过的零食，觉得自己暂时又被家接住了。";
        } },
      { label: "嫌麻烦，放弃认领", effect: (s) => {
          study_add(s, "homesick", 8); add(s, "mood", -8); add(s, "stress", -1); add(s, "insight", 1);
          return "你被繁琐流程磨到没脾气，最终放弃认领。家里问包裹到了没，你只好说「还在路上」。\n\n" +
            "那一晚你特别想念家里的厨房。原来乡愁有时候不是诗，是一包没能入境的调料。";
        } }
    ]
  },

  /* 22. 群聊代购 / 人肉快递：小生意与大麻烦 */
  {
    id: "ev_study_daigou_boom", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "weeksDone") >= 10,
    title: "🛍️ 留学生群里的代购宇宙",
    text: (s) =>
      "你只是顺手帮朋友带了一瓶保健品，没想到消息在亲戚朋友之间裂变。\n\n" +
      "三天后，你的微信里挤满了订单：奶粉、鞋、包、药妆、限量杯子，还有人问能不能带一台空气炸锅。大家都说「不着急」，但每天都在问发货了吗。\n\n" +
      "你看着宿舍角落堆成山的包裹，突然意识到：自己好像在读书之余，开了一家没有营业执照的跨境仓库。",
    choices: [
      { label: "认真做，赚点生活费", effect: (s) => {
          add(s, "cash", 4200); add(s, "stress", 11); add(s, "health", -4);
          study_add(s, "social", 3); study_set(s, "credits", study_g(s, "credits") - 3);
          flag(s, "study_daigou");
          return "你开始记账、比价、打包、跑邮局。钱确实赚到了一些，可时间被切成碎片，课程作业也开始追着你跑。\n\n" +
            "创业精神在宿舍觉醒，学业警报也在后台闪烁。每一单小利润，都附赠一份大疲惫。";
        } },
      { label: "果断收手，只帮最亲的人", effect: (s) => {
          add(s, "cash", 800); add(s, "stress", -2); add(s, "insight", 2);
          study_add(s, "social", 1); study_add(s, "homesick", -2);
          return "你给大家统一回了消息：只帮家里人和最亲近的朋友，其他真顾不上。\n\n" +
            "有人不太高兴，但你的房间终于不再像小型仓库。边界感，也是留学生独自在外必须学会的生存技能。";
        } },
      { label: "被海关抽查，解释到灵魂出窍", effect: (s) => {
          add(s, "cash", -1500); add(s, "stress", 15); add(s, "mood", -8);
          study_add(s, "lang", 4); study_add(s, "homesick", 5); flag(s, "study_customs_warned");
          return "一次寄件被抽查，工作人员盯着你那堆同款商品，问得极其细致。你解释到舌头打结，才勉强过关。\n\n" +
            "走出邮局时，你把代购群消息全设成免打扰。钱可以少赚，身份和学业不能拿来陪跑。";
        } }
    ]
  },

  /* 23. 神秘同学套资料：学术安全 / 数据泄露，压低但荒诞 */
  {
    id: "ev_study_research_snoop", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_prog(s) >= 0.35 && study_g(s, "gpa") >= 60,
    title: "🧪 热情同学，对你的研究过分好奇",
    text: (s) =>
      "实验室/小组项目里新来了一个同学，热情得像装了社交涡轮。\n\n" +
      "ta 总请你喝咖啡，夸你的项目有前途，然后漫不经心地问：「你们原始数据放哪？导师还没发表的模型能不能看看？我只是学习一下。」\n\n" +
      "问题问得太精准，精准到不像学习，像在摸保险柜。",
    choices: [
      { label: "碍于面子，把资料发过去", effect: (s) => {
          study_add(s, "social", 2); study_add(s, "gpa", -3);
          add(s, "reputation", -6); add(s, "stress", 12); add(s, "mood", -6);
          flag(s, "study_data_leak");
          return "你不好意思拒绝，把部分资料发了过去。几周后，导师发现项目内容在另一个组的报告里出现了相似影子。\n\n" +
            "没人直接指责你，但实验室的空气变冷了。你终于明白，学术圈的边界不是客气，是职业命门。";
        } },
      { label: "礼貌拒绝，只分享公开材料", effect: (s) => {
          study_add(s, "lang", 2); study_add(s, "social", 1);
          add(s, "reputation", 4); add(s, "insight", 3); add(s, "stress", 2);
          flag(s, "study_data_safe");
          return "你笑着说可以分享公开论文和课程笔记，但原始数据和未发表内容不能外传。对方的热情明显降温。\n\n" +
            "导师后来知道这事，点头说你处理得对。留学不只学知识，也学会在哪些地方必须硬起来。";
        } },
      { label: "告诉导师，确认边界", effect: (s) => {
          study_add(s, "gpa", 2); study_add(s, "social", -1);
          add(s, "reputation", 5); add(s, "network", 3); add(s, "stress", 4);
          return "你把情况告诉导师，导师立刻明确了组内数据权限，还专门开了次学术安全小会。\n\n" +
            "气氛有点尴尬，但你保住了项目。成年人的世界里，信任很好，流程更可靠。";
        } }
    ]
  },

  /* 24. 机场行李失踪：开局荒诞，情绪与适应 */
  {
    id: "ev_study_lost_luggage", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "weeksDone") <= 4,
    title: "🧳 人到了，行李还在流浪",
    text: (s) =>
      "落地后，你在传送带前等到人群散尽，自己的两个箱子始终没有出现。\n\n" +
      "柜台工作人员查了半天，说它们可能在另一个城市，也可能在另一个国家。你身上只有一套衣服、一台快没电的手机，以及家里塞进箱子里的全部安全感。\n\n" +
      "留学第一天，命运先把你调成了困难模式。",
    choices: [
      { label: "冷静报失，买最低限度用品", effect: (s) => {
          add(s, "cash", -900); add(s, "stress", 6); add(s, "strategy", 2);
          study_add(s, "lang", 3); study_add(s, "homesick", 4);
          return "你填了报失单，留好地址，只买了最必要的牙刷、换洗衣物和充电器。\n\n" +
            "三天后，箱子终于被送到门口。你抱着箱子像抱住一块从家里漂来的陆地。困难模式没结束，但你已经过了第一关。";
        } },
      { label: "情绪崩了，给家里打电话", effect: (s) => {
          add(s, "stress", -3); add(s, "mood", -4); study_add(s, "homesick", 8);
          return "你站在机场角落给家里打电话，听到熟悉声音的一瞬间，眼泪就下来了。\n\n" +
            "家里隔着时差安慰你，帮不上忙，却一直没挂。后来箱子还是找到了，但你记住了这一天：原来长大，是在没人能替你处理问题时，边哭边处理。";
        } }
    ]
  },

  /* 25. 返乡逆向文化冲击：临近毕业/回国选择后的余震 */
  {
    id: "ev_study_reverse_shock", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_prog(s) >= 0.75 && study_g(s, "homesick") <= 35,
    title: "🪞 回头看家乡，竟有点陌生",
    text: (s) =>
      "你本以为自己只是出来读几年书，根一直在原地。\n\n" +
      "可一次假期回国/和老朋友长聊后，你突然发现，大家的话题、节奏、价值判断，和你记忆里不太一样了。你讲异国经历，别人听两句就问「那边工资高吗」；你想念家，又发现自己已经习惯了另一套生活方式。\n\n" +
      "最荒诞的是：你在异国想家，回到家又想异国。人像被切成了两半。",
    choices: [
      { label: "承认变化，重新定义自己的家", effect: (s) => {
          study_add(s, "homesick", -6); study_add(s, "social", 4);
          add(s, "insight", 5); add(s, "mood", 6); add(s, "mind", 2);
          flag(s, "study_reverse_shock_processed");
          return "你没有逼自己回到从前，而是承认：这几年真的改变了你。\n\n" +
            "家不再只是一个地名，也可能是几种语言、几段关系、几顿饭和你慢慢长出来的世界观。你不必二选一，你可以把自己活成一座桥。";
        } },
      { label: "假装没变，努力融回旧圈子", effect: (s) => {
          study_add(s, "homesick", 4); study_add(s, "social", -2);
          add(s, "mood", -5); add(s, "stress", 5); add(s, "insight", 2);
          return "你努力讲大家爱听的话，避开那些没人感兴趣的经历，可越装越累。\n\n" +
            "后来你明白，回不去不是背叛故乡，而是时间真的走过了你。硬把自己塞回旧模子，只会硌得生疼。";
        } }
    ]
  }

);
