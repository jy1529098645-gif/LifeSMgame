"use strict";
/* =====================================================================
 * content/events-love-deep.js —— 恋爱·婚姻·家庭 深度剧情事件
 * - 全游戏最出剧情的板块：对白多、有来有回、有潜台词、有戏剧张力。
 * - 覆盖人生全周期：相亲初约 → 暧昧表白 → 异地考验 → 见家长 →
 *   催婚催生 → 婚后冷战 → 育儿冲突 → 姻亲夹缝 → 中年倦怠诱惑 →
 *   叛逆空巢 → 复合/离婚抉择。
 * - 尊重 s.orientation（同性情节自然书写），性别处境平衡、无歧视、
 *   批判的是观念偏见而非具体的人。
 * - 只用全局 helper：add / flag / has / pick / rnd / byClass /
 *   classTier / shuf / socialShift / socialBoostRole。
 * - 模块辅助函数前缀 lovex_；事件 id 前缀 ev_lovex_。
 * ===================================================================== */

// 读伴侣称谓（中立）。无名字时用「ta」。
function lovex_ta(s) { return s.partnerName || "ta"; }

// 随机生成一个相亲/约会对象的名字（中性，不预设性别角色）。
function lovex_dateName(s) {
  return pick(["林溪", "夏野", "陈屿", "苏晚", "周屿", "顾岸", "唐宁", "白杉"]);
}

// 称呼对方家长（中立，不强行套丈母娘/婆婆刻板印象）。
function lovex_elders(s) { return "ta 父母"; }

/* ---------------------------------------------------------------------
 * 1. 相亲饭桌尬聊 / 初次约会（未恋爱未婚，charm gating，成功可成对象）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_blinddate", module: "love", ambient: true,
  cond: (s) => !has(s, "partner") && !has(s, "married") && s.age >= 22 && s.age <= 42,
  title: "🍽️ 相亲饭桌",
  text: (s) => {
    var n = lovex_dateName(s);
    return "亲戚硬塞来的相亲。餐厅里，对面坐着的" + n + "礼貌地笑了笑：“你好，久仰了……虽然其实我什么也没听说。”空气一下子尴尬又好笑。点完菜，是一段漫长的沉默。你决定——";
  },
  choices: [
    { label: "用一句自嘲打破僵局", next: (s) => ({
        text: (s) => "你举杯：“说实话，我对相亲的恐惧，不亚于对年终总结。”对面噗地笑出声：“天哪，我们终于有共同语言了。”气氛松了下来，ta 身子往前倾了倾。",
        choices: [
          { label: "顺势聊兴趣，真诚交流", effect: (s) => {
              if (rnd(0.35 + s.stats.charm * 0.02)) {
                flag(s, "partner");
                s.partnerName = lovex_dateName(s);
                add(s, "mood", 8); add(s, "charm", 1); socialShift(s, 2);
                return "你们从电影聊到深夜的便利店，从理想聊到怕黑。临走时 ta 在你手机里存下名字：“下次……不用亲戚介绍了吧？”一段关系，就这样悄悄开了头。";
              }
              add(s, "mood", 3); add(s, "charm", 1);
              return "聊得意外投缘，可惜火花差了那么一点。互留了联系方式，算朋友吧。有些缘分，留在了那顿饭里。";
            } },
          { label: "怕冷场，全程拼命找话题", effect: (s) => {
              add(s, "stress", 4); add(s, "mood", -2);
              return "你怕一秒安静，于是天南海北地讲，把自己讲得口干舌燥。ta 礼貌点头，眼神却渐渐飘远。用力过猛，反而没了余地。";
            } }
        ]
      }) },
    { label: "全程低头扒饭，应付了事", effect: (s) => {
        add(s, "mood", -3); add(s, "charm", -1);
        return "你“嗯”“哦”“还行”地把一顿饭吃完。回家路上亲戚来电：“人家说你这人闷。”你也松口气——本来就没想认识谁。";
      } },
    { label: "提前找借口溜走", effect: (s) => {
        add(s, "mood", 2); add(s, "network", -2);
        return "你说临时有事，先撤了。亲戚气得半死，但你给自己省下了一晚假笑。代价是，下次没人敢再给你介绍了。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 2. 确定关系前的暧昧拉扯 / 表白回应
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_confession", module: "love", ambient: true, once: true,
  cond: (s) => !has(s, "partner") && !has(s, "married") && s.age >= 18 && s.age <= 40,
  title: "💗 那句话卡在喉咙",
  text: (s) => {
    var who = s.crush || "那个让你心动的人";
    return "你和" + who + "暧昧很久了。今晚送 ta 到楼下，路灯把影子拉得很长。ta 忽然停下：“我们……到底算什么呀？”心跳擂鼓。你知道，这一刻躲不过去了。";
  },
  choices: [
    { label: "深吸一口气，认真表白", next: (s) => ({
        text: (s) => "你说：“我喜欢你，不想再当‘朋友’了。”ta 愣住，眼睛亮了一下，又咬住嘴唇：“你知道在一起……是会变难的吧？不像现在这么轻松。”",
        choices: [
          { label: "“难也想和你一起难”", effect: (s) => {
              if (rnd(0.55 + s.stats.charm * 0.015)) {
                flag(s, "partner");
                s.partnerName = s.crush || lovex_dateName(s);
                s.crush = null;
                add(s, "mood", 12); add(s, "charm", 1); socialShift(s, 3);
                return "ta 笑着红了眼眶，伸手抱住你：“那……就一起吧。”路灯下，两个影子终于叠成了一个。这一夜，你记了很多年。";
              }
              add(s, "mood", -6); add(s, "insight", 2);
              return "ta 沉默良久，轻声说：“对不起，我可能更想留住现在。”心被轻轻按下去。你点点头，把那份喜欢，悄悄收了起来。";
            } },
          { label: "心虚改口“开玩笑的”", effect: (s) => {
              add(s, "mood", -8); add(s, "stress", 3);
              s.crush = null;
              return "话到嘴边你怂了：“逗你的啦。”ta 的笑僵了一瞬，说“哦，吓我一跳”。那扇本来要开的门，被你自己关上了。回家路上，你后悔得想抽自己。";
            } }
        ]
      }) },
    { label: "继续装糊涂，享受暧昧", effect: (s) => {
        add(s, "mood", 2); add(s, "stress", 2);
        return "你笑笑：“算……很好的朋友？”ta 眼里闪过一丝失落，也跟着笑了。暧昧像糖，甜，但化得快。你们都在等对方先开口。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 3. 异地恋 / 聚少离多的考验
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_longdistance", module: "love", ambient: true,
  cond: (s) => has(s, "partner") && !has(s, "married") && s.age >= 20,
  title: "📱 凌晨两点的视频",
  text: (s) => {
    var ta = lovex_ta(s);
    return "异地大半年了。视频里的" + ta + "顶着黑眼圈：“今天又有人问我是不是单身。”你心里一紧。ta 顿了顿：“我没怪你的意思……就是，有点累。你说，我们还要这样多久？”";
  },
  choices: [
    { label: "认真规划：定个团聚的时间表", next: (s) => ({
        text: (s) => {
          var ta = lovex_ta(s);
          return "你打开备忘录，和 " + ta + " 一条条算：谁的城市机会多、攒钱要多久、明年能不能搬到一起。ta 渐渐不困了：“原来你都想过……我还以为只有我在熬。”";
        },
        choices: [
          { label: "立下约定，一起朝目标攒钱", effect: (s) => {
              add(s, "mood", 7); add(s, "strategy", 1); add(s, "cash", -3000); socialShift(s, 2);
              return "你们约定了一个“倒计时”，把思念变成了共同的项目。隔着屏幕，却像并肩走路。机票钱花得心甘情愿。";
            } },
          { label: "现实点：先各自拼事业再说", effect: (s) => {
              add(s, "mood", -2); add(s, "knowledge", 1);
              return "你说先把事业稳住更重要。ta 沉默了几秒：“也对。”理智没错，但屏幕那头的失落，你也看见了。";
            } }
        ]
      }) },
    { label: "敷衍安慰“快了快了”", effect: (s) => {
        add(s, "mood", -5); socialShift(s, -1);
        return "你含糊地哄了几句。ta 嗯了一声就说要睡了。挂掉视频，房间里只剩你和黑屏。有些“快了”，连自己都骗不过去。";
      } },
    { label: "提议：要不先冷静一下", effect: (s) => {
        add(s, "mood", -7); add(s, "stress", 4); socialShift(s, -2);
        return "你说出了“暂停”两个字。ta 愣了很久：“你是想分手，又不好意思说吧。”空气凝固。这句话，把两个人都推到了悬崖边。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 4. 见家长 / 房车彩礼的现实考验（批判的是观念，不是人）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_meetparents", module: "love", ambient: true, once: true,
  cond: (s) => has(s, "partner") && !has(s, "married") && s.age >= 24,
  title: "🏠 第一次上门",
  text: (s) => {
    var ta = lovex_ta(s);
    return "第一次去见" + ta + "家。茶刚倒上，长辈就直奔主题：“工作稳定吗？有房吗？这边规矩，礼数得讲究。”" + ta + "在旁边急得直拽你袖子。你手心全是汗。";
  },
  choices: [
    { label: "诚恳谈现状与规划，不夸海口", next: (s) => ({
        text: (s) => {
          var ta = lovex_ta(s);
          return "你不卑不亢地把收入、攒钱节奏、对未来的打算讲清楚，也坦白现在还没买房。长辈脸色缓了缓：“至少是个实在人。”" + ta + "悄悄对你比了个大拇指。";
        },
        choices: [
          { label: "顺势表态：会和 ta 一起努力", effect: (s) => {
              add(s, "reputation", 3); add(s, "mood", 6); add(s, "charm", 1); socialShift(s, 2);
              return "你说会和 ta 并肩把日子过好，不靠彩礼撑面子。长辈点了头。把人和未来看清，比把房本拍桌上更打动人。";
            } },
          { label: "被房子卡住，硬着头皮承诺", effect: (s) => {
              add(s, "stress", 7); add(s, "cash", -2000); add(s, "mood", -1);
              return "为了过关，你拍胸脯保证两年内买房。话说出去，肩上立刻压了座山。回去路上你苦笑——爱情，有时候要先过一道很现实的关。";
            } }
        ]
      }) },
    { label: "据理力争：感情不是买卖", effect: (s) => {
        add(s, "insight", 2); add(s, "stress", 5); socialShift(s, -1);
        return "你忍不住说“拿房车彩礼衡量人，不太公平”。长辈脸沉了下来，气氛僵住。你顶撞的是那套观念，但代价，是要花更久去让他们接受你。";
      } },
    { label: "全程赔笑，有求必应", effect: (s) => {
        add(s, "cash", -5000); add(s, "mood", -4); add(s, "stress", 3);
        return "你点头哈腰，要什么应什么，回家钱包瘪了一截，心里也憋屈。一味讨好换来的“满意”，往往后患无穷。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 5. 催婚催生（来自父母，gate 恋爱中或年龄）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_pushmarriage", module: "love", ambient: true,
  cond: (s) => has(s, "partner") && !has(s, "married") && s.age >= 26,
  title: "📞 “什么时候结婚？”",
  text: (s) => {
    var ta = lovex_ta(s);
    return "家庭群里，长辈又转发了一篇《晚婚的危害》。紧接着电话打来：“都谈这么久了，跟" + ta + "到底什么时候结？别人家孩子都……”你扶额。";
  },
  choices: [
    { label: "回家先和 ta 商量好，再统一答复", next: (s) => ({
        text: (s) => {
          var ta = lovex_ta(s);
          return "你没急着回长辈，而是先问 " + ta + "：“你怎么想？我们是为自己结，不是为交差。”" + ta + "靠过来：“谢谢你先问我。”";
        },
        choices: [
          { label: "两人达成共识，按自己节奏推进", effect: (s) => {
              add(s, "mood", 7); add(s, "insight", 1); socialShift(s, 2);
              return "你们商量出一个彼此都舒服的时间表，再温和地告诉长辈。把“我们”放在“别人家孩子”前面，关系一下踏实了。";
            } },
          { label: "其实 ta 还没准备好，你尊重", effect: (s) => {
              add(s, "mood", 3); add(s, "stress", 2);
              return "ta 坦白还没做好准备，你压下催促，说“不急”。长辈那头不太高兴，但你护住了 ta 的节奏。理解，需要扛住外界的声音。";
            } }
        ]
      }) },
    { label: "敷衍长辈“快了快了”", effect: (s) => {
        add(s, "stress", 3); add(s, "mood", -2);
        return "你随口应付，长辈半信半疑。被推着走的婚事，迟早还要还回来。";
      } },
    { label: "顶回去：“我的事我自己定”", effect: (s) => {
        add(s, "insight", 2); add(s, "mood", 2); add(s, "network", -2); add(s, "stress", 3);
        return "你直接表明立场。长辈被噎住，群里安静了好几天。你守住了边界，也凉了点亲情的温度。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 6. 婚后冷战 / 为家务钱吵架（gate married，修复 vs 升级）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_coldwar", module: "love", ambient: true,
  cond: (s) => has(s, "married") && s.age >= 24,
  title: "❄️ 冷战第三天",
  text: (s) => {
    var ta = lovex_ta(s);
    return "为了“谁该洗碗、谁乱花钱”，你和" + ta + "已经三天没好好说话。家里安静得能听见冰箱嗡嗡响。今晚 ta 把饭盛好，多放了一双筷子——但还是不看你。";
  },
  choices: [
    { label: "先低头，主动递台阶", next: (s) => ({
        text: (s) => {
          var ta = lovex_ta(s);
          return "你坐下，轻声说：“饭凉了，我们也别凉了。刚才是我嘴硬，对不起。”" + ta + "鼻子一酸：“我也有错……我就是想你能多搭把手。”";
        },
        choices: [
          { label: "一起把家务和账分清楚", effect: (s) => {
              add(s, "mood", 8); add(s, "stress", -4); add(s, "strategy", 1); socialShift(s, 2);
              if (typeof familyNudge === "function") familyNudge(s, { bond: 8, conflict: -10 });
              return "你们摊开纸笔，把家务排了班、把开销立了规矩。吵架不可怕，可怕的是没人先伸手。这顿饭，吃出了暖意。";
            } },
          { label: "和好了，但根上问题没谈", effect: (s) => {
              add(s, "mood", 4); add(s, "stress", -1);
              if (typeof familyNudge === "function") familyNudge(s, { bond: 3, conflict: -2 });
              return "气氛缓和了，你们却默契地绕开了那个老问题。这次先放下，但你心里清楚——下次它还会回来。";
            } }
        ]
      }) },
    { label: "继续僵着，谁先开口谁输", effect: (s) => {
        add(s, "mood", -6); add(s, "stress", 5); socialShift(s, -2);
        if (typeof familyNudge === "function") familyNudge(s, { bond: -6, conflict: 8 });
        return "你也别过头去。两个人把“面子”看得比“日子”重，冷战又拖了好几天。沉默，是婚姻里最锋利的钝刀。";
      } },
    { label: "翻旧账，把火点大", effect: (s) => {
        add(s, "mood", -9); add(s, "stress", 7); add(s, "reputation", -1); socialShift(s, -3);
        if (typeof familyNudge === "function") familyNudge(s, { bond: -9, conflict: 12 });
        return "你一句“你从来都这样”，把陈年旧事全翻了出来。ta 摔下筷子进了卧室。门“砰”地一声，关上的不只是门。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 7. 育儿理念冲突 / 鸡娃 vs 快乐教育（gate has_kid）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_parenting", module: "love", ambient: true,
  cond: (s) => has(s, "has_kid") && s.age >= 30,
  title: "📚 报不报补习班",
  text: (s) => {
    var ta = lovex_ta(s);
    return "孩子的成绩单摊在桌上。" + ta + "皱眉：“别人家都报了五个班了，咱们不能让娃输在起跑线。”你看着孩子怯生生的眼睛，心里直打鼓。";
  },
  choices: [
    { label: "拉 ta 坐下，先问孩子想要什么", next: (s) => ({
        text: (s) => {
          var ta = lovex_ta(s);
          return "你说：“先别吵，问问 ta 自己呢？”你蹲下身问孩子。孩子小声说：“我……想学画画，不想再做卷子了。”" + ta + "愣住了。";
        },
        choices: [
          { label: "尊重孩子，鸡娃与兴趣折中", effect: (s) => {
              add(s, "mood", 7); add(s, "insight", 2); add(s, "cash", -8000); socialShift(s, 2);
              if (typeof familyNudge === "function") familyNudge(s, { bond: 4, conflict: -5, coParent: 10 });
              return "你们各退一步：保住课业，也留出画画的时间。孩子笑了，搂住你俩的脖子。教育不是军备竞赛，是看见 ta 本来的样子。";
            } },
          { label: "还是稳妥点，主课优先", effect: (s) => {
              add(s, "mood", -2); add(s, "cash", -12000); add(s, "stress", 3);
              if (typeof familyNudge === "function") familyNudge(s, { conflict: 3, coParent: -2 });
              return "权衡再三，你们还是把分数放在了前面。孩子没再说话，默默回了房间。你心里有点不是滋味——大人的“为你好”，孩子未必懂。";
            } }
        ]
      }) },
    { label: "附和 ta：使劲报，绝不能落后", effect: (s) => {
        add(s, "cash", -25000); add(s, "stress", 6); add(s, "mood", -3);
        if (typeof familyNudge === "function") familyNudge(s, { coParent: -6, conflict: 5 });
        return "你们咬牙报满了班，钱包大出血。孩子的周末被排得满满当当，眼里的光，却淡了一些。";
      } },
    { label: "唱反调：童年只有一次，全砍了", effect: (s) => {
        add(s, "mood", 2); add(s, "stress", 4); socialShift(s, -1);
        if (typeof familyNudge === "function") familyNudge(s, { bond: -2, conflict: 8, coParent: 2 });
        return "你强硬地把班全停了。ta 急了：“你这是放养，将来后悔别怪我！”理念之争，演变成了夫妻之争。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 8. 婆媳 / 姻亲关系（中立处理，夹在中间）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_inlaws", module: "love", ambient: true,
  cond: (s) => has(s, "married") && s.age >= 25,
  title: "🤐 夹在中间的人",
  text: (s) => {
    var ta = lovex_ta(s);
    return ta + "的家长来小住，进门就重新摆了你的厨房、改了你的作息。今晚 ta 长辈把你叫到一边：“有些话我直说——你得多让着点。”而 " + ta + " 在另一头小声问你：“我妈是不是又给你脸色了？”两头都在等你的态度。";
  },
  choices: [
    { label: "不站队，做两边的“翻译”", next: (s) => ({
        text: (s) => {
          var ta = lovex_ta(s);
          return "你没急着评理，而是分别去聊：跟长辈说“您的好意我懂，方式咱们慢慢磨”，回头拉着 " + ta + " 说“别夹枪带棒，让我来沟通”。你把火气都接到了自己身上。";
        },
        choices: [
          { label: "立规矩：小事让，原则不让", effect: (s) => {
              add(s, "insight", 2); add(s, "mood", 5); add(s, "stress", 3); socialShift(s, 2);
              if (typeof familyNudge === "function") familyNudge(s, { bond: 5, conflict: -8 });
              return "你温和却清楚地划出边界：生活习惯互相迁就，但你和 ta 的小家说了算。两头都消了点气。当“中间人”，是门累人的学问。";
            } },
          { label: "一味和稀泥，谁都不得罪", effect: (s) => {
              add(s, "stress", 5); add(s, "mood", -2);
              if (typeof familyNudge === "function") familyNudge(s, { bond: -3, conflict: 5 });
              return "你两边都说好话，谁也不开罪。表面太平了，可没解决的矛盾，只是被你一个人默默扛着。";
            } }
        ]
      }) },
    { label: "彻底站伴侣这边，硬刚长辈", effect: (s) => {
        add(s, "mood", -3); add(s, "stress", 6); socialShift(s, -2);
        if (typeof familyNudge === "function") familyNudge(s, { bond: 3, conflict: 5 });
        return "你当面替 ta 出头，把长辈顶了回去。ta 一时感动，长辈却记了仇。护伴侣没错，但方式太硬，伤的是往后几十年的相处。";
      } },
    { label: "怕事，让伴侣自己去扛", effect: (s) => {
        add(s, "mood", -5); socialShift(s, -2);
        if (typeof familyNudge === "function") familyNudge(s, { bond: -8, conflict: 8 });
        return "你装聋作哑，把难题全推给 ta。ta 委屈地看你一眼：“原来这事，从头到尾只有我一个人在。”冷的，是 ta 的心。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 9. 中年关系倦怠 + 出轨诱惑（道德选择题，越界有明确代价）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_temptation", module: "love", ambient: true, once: true,
  cond: (s) => has(s, "married") && s.age >= 35 && s.age <= 55 && !has(s, "affair"),
  title: "🌫️ 加班后的那杯酒",
  text: (s) => {
    var ta = lovex_ta(s);
    return "婚姻像一杯放久的茶，温吞、寡淡。加班到深夜，一个对你格外照顾的同事递来一杯酒，靠得很近：“你最近，是不是不太开心？”那一刻，家里的" + ta + "正发来消息：“饭在锅里，记得吃。”两条线，在你心里拉扯。";
  },
  choices: [
    { label: "礼貌拉开距离，回家", next: (s) => ({
        text: (s) => {
          var ta = lovex_ta(s);
          return "你笑着退后一步：“谢谢，我得回家了，有人等我吃饭。”推门进屋，灯还亮着，" + ta + "趴在桌上睡着了，锅里的饭温着。你忽然鼻子一酸。";
        },
        choices: [
          { label: "叫醒 ta，认真聊聊近来的疏远", effect: (s) => {
              add(s, "mood", 8); add(s, "reputation", 2); add(s, "insight", 2); socialShift(s, 3);
              return "你轻轻叫醒 ta，说“我们好久没好好说话了”。ta 揉揉眼，握住你的手。倦怠不是终点，肯回头修，茶也能重新煮热。";
            } },
          { label: "什么都没说，默默盖好被子", effect: (s) => {
              add(s, "mood", 2); add(s, "stress", 2);
              return "你给 ta 披上外套，没忍心吵醒。守住了底线，可那点没说出口的疏远，还悬在两人之间。";
            } }
        ]
      }) },
    { label: "心动，赴一场暧昧的约", next: (s) => ({
        text: (s) => "你没拒绝那杯酒，也没拒绝之后的暧昧。短暂的心跳过后，是更深的空。手机屏幕亮起——是家里那句“记得吃饭”。你的手，抖了一下。",
        choices: [
          { label: "悬崖勒马，及时收手坦白", effect: (s) => {
              add(s, "mood", -6); add(s, "stress", 8); add(s, "reputation", -2);
              return "你在越界前停住，回家结结巴巴地坦白了那点动摇。ta 沉默了很久，眼里有泪：“谢谢你告诉我。”信任出了道裂缝，但你们决定一起补。";
            } },
          { label: "彻底越界", effect: (s) => {
              flag(s, "affair");
              add(s, "mood", -10); add(s, "reputation", -5); add(s, "stress", 10); socialShift(s, -3);
              return "你跨过了那条线。短暂的刺激，换来无尽的提心吊胆和愧疚。这个秘密像根刺，从此扎在每一个和家人对视的夜里。";
            } }
        ]
      }) },
    { label: "直接告诉对方：我很爱我的家", effect: (s) => {
        add(s, "reputation", 3); add(s, "mood", 4); add(s, "charm", 1);
        return "你认真地说：“你很好，但我有要守护的家。”对方愣了愣，敬你一杯。守得住的人，走到哪儿都体面。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 10. 孩子叛逆期 / 空巢（gate has_kid + 年龄大）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_teenager", module: "love", ambient: true,
  cond: (s) => has(s, "has_kid") && s.age >= 42,
  title: "🚪 “砰”的关门声",
  text: (s) => {
    var ta = lovex_ta(s);
    return "孩子大了，话越来越少。今晚你刚开口问句成绩，ta 就甩门进房，留下一句“你们根本不懂我”。客厅里，你和" + ta + "面面相觑，一时都不知道哪句话说错了。";
  },
  choices: [
    { label: "敲门，蹲下来当朋友听 ta 说", next: (s) => ({
        text: (s) => "你端着切好的水果敲门：“爸/妈不问成绩了，就想听你说说话。”僵持半晌，门开了条缝。孩子背对着你，闷闷地：“你们只在乎分数，从来没问过我累不累。”",
        choices: [
          { label: "放下身段，真诚道歉与倾听", effect: (s) => {
              add(s, "mood", 8); add(s, "insight", 3); socialShift(s, 2);
              return "你坦言“是爸/妈太急了，对不起”。孩子的肩膀松了下来，终于转过身。亲子之间，有时父母先认错，路才走得通。";
            } },
          { label: "想讲道理，又忍不住说教", effect: (s) => {
              add(s, "mood", -4); add(s, "stress", 4);
              return "话说着说着又拐回“我都是为你好”。孩子重新闭上了嘴。你叹口气——长大的不只是 ta，要学会闭嘴的，还有你。";
            } }
        ]
      }) },
    { label: "硬碰硬，端起家长权威", effect: (s) => {
        add(s, "mood", -7); add(s, "stress", 6); socialShift(s, -2);
        return "你拍门吼“这是什么态度”。屋里更安静了。权威压得住一时，压不住一颗想飞的心。隔阂，又厚了一层。";
      } },
    { label: "和伴侣相视苦笑：孩子大了", effect: (s) => {
        add(s, "mood", 1); add(s, "insight", 1);
        return "你和 ta 对望，无奈地笑了。等孩子哪天考去了外地，这屋子会更空。你忽然有点慌——下一程，得学着两个人重新过。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 11. 复合 / 分手 / 离婚的抉择（once，里程碑）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_divorce", module: "love", ambient: true, once: true,
  cond: (s) => has(s, "married") && s.age >= 28,
  title: "📄 摊在桌上的那份决定",
  text: (s) => {
    var ta = lovex_ta(s);
    var extra = has(s, "affair") ? "那道裂缝始终没补好，" : "争吵和沉默轮番上演，";
    return extra + "你和" + ta + "终于坐到了桌前。一份离婚协议摆在中间，谁都没先碰。" + ta + "声音哑了：“走到今天……我们是真的没救了，还是只是太累了？”";
  },
  choices: [
    { label: "先别签，给彼此最后一次努力", next: (s) => ({
        text: (s) => {
          var ta = lovex_ta(s);
          return "你把协议合上：“在写完这页之前，我想试最后一次。”" + ta + "怔住，眼泪掉下来：“……你知道吗，我也一直在等你说这句话。”";
        },
        choices: [
          { label: "约定一起做婚姻咨询，重新经营", effect: (s) => {
              add(s, "mood", 9); add(s, "stress", -3); add(s, "insight", 2); add(s, "cash", -6000); socialShift(s, 3);
              return "你们决定找咨询师，把那些没说出口的委屈一点点摆开。复合不是回到从前，是两个累过的人，选择重新学会相爱。";
            } },
          { label: "试了，但发现回不去了", effect: (s) => {
              add(s, "mood", -4); add(s, "insight", 3);
              return "你们认真试了一段，却发现裂痕太深。但这一次的努力，让你们至少能体面、坦然地面对彼此。有些尽力，是为了好好告别。";
            } }
        ]
      }) },
    { label: "平静地签字，好聚好散", effect: (s) => {
        var ta = lovex_ta(s);
        if (typeof familyDivorce === "function") familyDivorce(s, { civil: true, lossRate: 0.22, mood: -8, stress: 6, social: -2, text: "你们平静地签字离婚，各自收拾生活。" });
        else { flag(s, "divorced"); s.flags.married = false; s.flags.partner = false; s.partnerName = null; add(s, "mood", -8); add(s, "stress", 6); socialShift(s, -2); }
        add(s, "insight", 3);
        return "你们各自签下名字，没有撕扯，只有疲惫的释然。“以后……各自珍重。”关上家门那一刻，一段人生章节，轻轻合上了。";
      } },
    { label: "在愤怒里撕破脸离场", effect: (s) => {
        if (typeof familyDivorce === "function") familyDivorce(s, { civil: false, lossRate: 0.28, mood: -12, stress: 10, social: -3, text: "你们在激烈争执后撕破脸离婚。" });
        else { flag(s, "divorced"); s.flags.married = false; s.flags.partner = false; s.partnerName = null; add(s, "mood", -12); add(s, "stress", 10); add(s, "cash", -10000); socialShift(s, -3); }
        add(s, "reputation", -3);
        return "财产、对错、旧账，全在那张桌上炸开。你们用最难看的样子，结束了曾经最亲密的关系。离开时，你连头都没回。";
      } }
  ]
});

/* ---------------------------------------------------------------------
 * 12. 纪念日 / 平淡里的小确幸（恋爱或婚姻皆可，经营关系的暖向事件）
 * ------------------------------------------------------------------- */
EVENTS.push({
  id: "ev_lovex_anniversary", module: "love", ambient: true,
  cond: (s) => (has(s, "partner") || has(s, "married")) && s.age >= 20,
  title: "🎂 ta 记得的那个日子",
  text: (s) => {
    var ta = lovex_ta(s);
    return "忙到昏天黑地，你差点忘了今天是你们的纪念日。可一进门，" + ta + "已经点上一支蜡烛，桌上是你最爱吃的那道菜：“我猜你又忘了吧？没关系，我替你记着。”";
  },
  choices: [
    { label: "愧疚又感动，临时也要补上心意", next: (s) => ({
        text: (s) => {
          var ta = lovex_ta(s);
          return "你冲下楼，在快打烊的花店抢回最后一束花，又手写了张卡片。回来时 " + ta + " 笑你：“傻不傻，我又没要这些。”眼睛却亮晶晶的。";
        },
        choices: [
          { label: "认真说一句藏了很久的“谢谢你”", effect: (s) => {
              add(s, "mood", 9); add(s, "charm", 1); socialShift(s, 3);
              return "你握住 ta 的手，说出那句平时说不出口的话。烛光里，平淡的日子忽然闪闪发亮。爱，是记得，也是被记得。";
            } },
          { label: "玩笑带过，不好意思煽情", effect: (s) => {
              add(s, "mood", 5); socialShift(s, 1);
              return "你嘴上贫着“明年我一定提前三天记好”，把感动藏进了那束花里。ta 拍你一下，笑骂“油嘴滑舌”。温吞的幸福，也是幸福。";
            } }
        ]
      }) },
    { label: "敷衍一句“哦对，纪念日啊”", effect: (s) => {
        add(s, "mood", -4); socialShift(s, -2);
        return "你随口应了声，坐下扒饭。ta 脸上的笑慢慢淡了，吹灭蜡烛：“……没事，吃饭吧。”被忽略的用心，最伤人。";
      } }
  ]
});
