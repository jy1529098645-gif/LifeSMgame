"use strict";
/* =====================================================================
 * content/minigames.js —— 小游戏框架（v1.0）
 * 通用「回合斗智」小游戏：每局若干回合，每回合玩家从【稳健/标准/激进】里选一手，
 * 胜负由【对应属性 + 这一手的风险偏好 + 运势 + 运气】决定；多数回合获胜即赢。
 * 激进手赢面更小、但赢了算「漂亮一手」，全程靠它取胜有额外彩头。
 *
 * 引擎读 MINIGAMES：renderMgMenu 列出当前可玩的；renderMinigame 跑一局；
 * 入口：①「找乐子」行动 → 小游戏菜单；② 部分 ambient 事件直接 s._mg=id 拉起某局。
 * 每局可设 stake(入场/赌注现金)、cond(出现条件)、statKey(吃哪个属性)、rounds(回合数)。
 * onWin/onLose/onDraw(s, info) 返回结果文案（info={wins,total,flashy}）。
 * ===================================================================== */
var MG_MOVES_DUEL = [
  { key: "steady", label: "🛡️ 稳扎稳打", desc: "求稳，赢面大但平淡", edge: 0.12, flashy: false },
  { key: "normal", label: "⚔️ 正常应对", desc: "中规中矩", edge: 0.0, flashy: false },
  { key: "bold", label: "🔥 出奇制胜", desc: "弄险，赢面小但赢了漂亮", edge: -0.14, flashy: true }
];
var MG_MOVES_LUCK = [
  { key: "small", label: "🪙 小注怡情", desc: "稳一点", edge: 0.1, flashy: false },
  { key: "mid", label: "🎲 跟一把", desc: "正常", edge: 0.0, flashy: false },
  { key: "big", label: "💥 梭哈搏一把", desc: "刺激，赢了翻倍", edge: -0.16, flashy: true }
];

/* —— 核心主题接入：把一次「玩乐」按几率引向主线 ——
 * 休闲活动不只是回血。每次（多在赢的时候）有 p 的几率，从乐子里冒出一条
 * 接入游戏核心的线索：商机(got_lead)、副业苗头(side_hot)、风口直觉(wind_hint)、
 * 名气/人脉、或一笔意外之财。返回一句追加到结算文案后的话；没触发则空串。
 * 这些 flag 正是创业/副业/风口/危机等主线事件的入场券，让「钓鱼」也可能改写人生。 */
function mgThemeHook(s, p) {
  if (typeof p !== "number") p = 0.28;
  if (!rnd(p)) return "";
  var roll = Math.random();
  if (roll < 0.30 && !has(s, "got_lead")) {
    flag(s, "got_lead"); add(s, "network", 2); add(s, "insight", 1);
    return "玩着玩着，有人凑过来递了张名片：「哥们儿/姐们儿，有个事儿想找你聊聊。」一条说不清的机会，悄悄埋下了。";
  }
  if (roll < 0.55) {
    flag(s, "side_hot"); add(s, "insight", 1);
    return "你忽然意识到——这点小爱好要是认真做，没准能折腾成一门自己的小生意。心里那颗种子，发了芽。";
  }
  if (roll < 0.75) {
    flag(s, "wind_hint"); add(s, "insight", 1);
    return "人群与热闹的缝隙里，你竟隐约嗅到了风往哪个方向吹——有些东西，正在悄悄起势。";
  }
  if (roll < 0.90) {
    add(s, "reputation", 3); add(s, "network", 2);
    return "你随手发出去的内容意外火了一阵，评论区涌进一批陌生人，圈子里多了些认得你名字的人。";
  }
  var w = Math.round(1500 + Math.random() * 4000);
  add(s, "cash", w);
  return "没承想这点玩乐还能变现：有人当场看中，掏 ¥" + w.toLocaleString() + " 跟你买了下来。无心插柳。";
}

var MINIGAMES = [
  // 注：象棋/围棋/五子棋已做成「真棋盘对弈」（见 boardgames.js），此处不再放对话版，避免重复。
  /* —— 酒吧艳遇：骰子游戏（吃魅力 + 运气）—— */
  {
    id: "bar", name: "去酒吧玩骰子艳遇", emoji: "🍸", opponent: "吧台对面的陌生人", statKey: "charm",
    where: "霓虹闪烁的酒吧，骰盅碰撞声里，藏着一夜的故事。", rounds: 3, moves: MG_MOVES_LUCK,
    cond: (s) => s.age >= 20 && s.age <= 55 && !has(s, "married"),
    intro: "吧台对面那个人朝你晃了晃骰盅，嘴角带笑：「敢不敢赌一杯？输的请客。」气氛微醺。",
    onWin: (s, i) => {
      add(s, "mood", 8); add(s, "charm", 1);
      if (!has(s, "partner") && !s.crush && rnd(0.7)) { s.crush = (typeof makeCrush === "function") ? makeCrush(s) : null; if (s.crush) return "几杯下肚，骰子赢了，人也对上了眼。临走 ta 把号码写在你手背上：「下次……不许耍赖。」心动的感觉，久违了。"; }
      return i.flashy ? "你一把「豹子」直接掀桌，全场起哄。这一晚，你是最靓的仔。" : "你赢了几杯酒和一晚的尽兴，醉醺醺地笑着，烦恼都抛到了脑后。";
    },
    onLose: (s) => { add(s, "mood", 3); add(s, "cash", -Math.round(600 + Math.random() * 800)); return "你输了，乖乖买单。酒不错，气氛也好，钱花得不冤——至少今晚没那么孤单。"; },
    onDraw: (s) => { add(s, "mood", 4); return "几轮下来不分胜负，你俩干脆碰杯言和，有一搭没一搭地聊到打烊。"; }
  },
  /* —— 游乐园：套圈/投篮（吃体魄）—— */
  {
    id: "park", name: "去游乐园套圈投篮", emoji: "🎡", opponent: "摊位老板", statKey: "body",
    where: "周末的游乐园，旋转木马转着，套圈摊老板吆喝着「十环必中大奖」。", rounds: 3, moves: MG_MOVES_DUEL, stake: 200,
    cond: (s) => s.age >= 18,
    intro: "「来嘛来嘛，套中大熊抱回家！」老板把圈往你手里塞。旁边的小孩眼巴巴看着。",
    onWin: (s, i) => { add(s, "mood", 9); add(s, "health", 3); if (has(s, "has_kid")) { add(s, "mood", 4); return "你连套带投，抱回一只比孩子还大的玩偶熊。孩子举着熊一路炫耀，那一刻你比中了奖还得意。"; } return i.flashy ? "你一记半场压哨投篮，全场欢呼，老板肉痛地搬出最大的奖品。" : "你手气不错，抱着奖品逛了一整天，难得这么放松。"; },
    onLose: (s) => { add(s, "mood", 4); add(s, "health", 2); return "圈一个没套中，钱打了水漂，但暴走一天、吃遍小吃，傻乐也是真乐。"; },
    onDraw: (s) => { add(s, "mood", 5); add(s, "health", 2); return "赢了几个小玩意儿，玩得尽兴。游乐园的快乐，简单又奢侈。"; }
  },
  /* —— 钓鱼：与时间博弈（吃心智 + 运气）—— */
  {
    id: "fish", name: "周末去野钓", emoji: "🎣", opponent: "狡猾的大鱼", statKey: "mind",
    where: "城郊的水库，晨雾未散，钓友们一字排开，比的是耐心。", rounds: 3, moves: MG_MOVES_LUCK,
    cond: (s) => s.age >= 25,
    intro: "浮漂在水面轻轻一沉。你屏住呼吸——是遛是提，全凭这一念之间。",
    onWin: (s, i) => { add(s, "mood", 7); add(s, "mind", 1); add(s, "stress", -8); return (i.flashy ? "一条大青鱼被你溜了半小时终于抄上岸，钓友们围过来啧啧称奇。这一竿，值了。" : "渔获颇丰，你眯着眼晒了一天太阳。水边的时光，把一身的紧绷都泡软了。") + mgThemeHook(s, 0.22); },
    onLose: (s) => { add(s, "mood", 4); add(s, "stress", -10); return "一条没钓上，可坐了一天，脑子里那些烦心事，竟也跟着水流飘走了。空军又如何，钓的本就是个清静。"; },
    onDraw: (s) => { add(s, "mood", 5); add(s, "stress", -7); return "钓上来几条小的又放生了。重要的从来不是鱼，是这份躲开喧嚣的安宁。"; }
  },
  /* —— 街头篮球：年轻人的热血（吃体魄）—— */
  {
    id: "ball", name: "球场打野球", emoji: "🏀", opponent: "球场上的对手", statKey: "body",
    where: "黄昏的水泥球场，汗水、口水和垃圾话齐飞。", rounds: 3, moves: MG_MOVES_DUEL,
    cond: (s) => s.age >= 16 && s.age <= 45,
    intro: "「就你？敢单挑不？」对面的小伙拍着球挑衅。围观的人起哄起来。",
    onWin: (s, i) => { add(s, "mood", 7); add(s, "body", 1); add(s, "health", 2); add(s, "network", 2); return i.flashy ? "你一个胯下变向晃飞对手，空中拉杆上篮，球场瞬间炸了！这一球，封神。" : "你打爆了对面，赢下球权也赢得尊重，新认识的球友约你下次再来。"; },
    onLose: (s) => { add(s, "mood", 3); add(s, "health", 3); add(s, "body", 1); return "你输了球，累得瘫在地上，可那种酣畅淋漓的疲惫，是坐办公室一辈子也换不来的。"; },
    onDraw: (s) => { add(s, "mood", 5); add(s, "health", 2); return "打成平手，约定改天再战。球场上没有输家，只有还想再来一局的人。"; }
  },
  /* —— 漫展拍摄：人潮里抓拍决定性瞬间（吃魅力 + 一手取景）—— */
  {
    id: "comiccon", name: "去漫展拍摄", emoji: "📸", opponent: "稍纵即逝的光影", statKey: "charm",
    where: "人山人海的漫展，cos 巡游、应援灯牌、二次元的盛装与尖叫汇成一片热浪。", rounds: 3, moves: MG_MOVES_DUEL, stake: 300,
    cond: (s) => s.age >= 14 && s.age <= 50,
    intro: "你举起相机，在攒动的人头里追那一束光、那一个回眸——快门只给你一瞬犹豫的时间。",
    onWin: (s, i) => {
      add(s, "mood", 8); add(s, "charm", 1); add(s, "insight", 1);
      return (i.flashy ? "你蹲守半天，等到巡游压轴那一刻，一张逆光剪影惊艳全场，被官方转发顶上了热门。" : "你扛着相机挤了一整天，收获满满一卡好片，修到深夜也乐在其中。") + mgThemeHook(s, 0.42);
    },
    onLose: (s) => { add(s, "mood", 4); return "好片没抓到几张，腿先废了。可挤在这片热气腾腾的人群里，你莫名觉得自己也年轻了几岁。" + mgThemeHook(s, 0.18); },
    onDraw: (s) => { add(s, "mood", 5); add(s, "charm", 1); return "废片堆里挑出两三张能看的，发了条九宫格，点赞还不少。值了。"; }
  },
  /* —— 剧本杀：谎言里揪真凶（吃洞察）—— */
  {
    id: "jubensha", name: "组局剧本杀", emoji: "🔪", opponent: "藏在剧本里的真凶", statKey: "insight",
    where: "昏黄灯光的剧本杀店，七八个陌生人围坐，真相被埋进一层层谎言。", rounds: 3, moves: MG_MOVES_DUEL, stake: 200,
    cond: (s) => s.age >= 16 && s.age <= 42,
    intro: "线索摊了一桌，所有人都在演。你盯着对面那张笑脸，盘算着何时摊牌。",
    onWin: (s, i) => {
      add(s, "mood", 7); add(s, "insight", 1); add(s, "network", 2);
      return (i.flashy ? "终局你一段抽丝剥茧的推理，把真凶逼得当场认栽，满桌拍案叫绝。" : "你稳稳锁定真凶，赢下这一本，也和同桌几个陌生人混熟了。") + mgThemeHook(s, 0.34);
    },
    onLose: (s) => { add(s, "mood", 4); add(s, "insight", 1); return "你被剧本绕进了沟里，凶手另有其人。复盘时恍然大悟，倒也长了记性。" + mgThemeHook(s, 0.15); },
    onDraw: (s) => { add(s, "mood", 5); return "几番交锋打成胶着，结局开放。一桌人意犹未尽，加了微信约下一场。"; }
  },
  /* —— 密室逃脱：倒计时里破局（吃谋略）—— */
  {
    id: "escape", name: "组队密室逃脱", emoji: "🔐", opponent: "滴答倒数的机关密室", statKey: "strategy",
    where: "门一锁，倒计时亮起。机关重重，线索藏在每一道暗格里。", rounds: 3, moves: MG_MOVES_DUEL, stake: 200,
    cond: (s) => s.age >= 16 && s.age <= 48,
    intro: "钟在墙上滴答，队友手忙脚乱。你深吸一口气，决定怎么分工破这一关。",
    onWin: (s, i) => {
      add(s, "mood", 7); add(s, "strategy", 1); add(s, "network", 2);
      return (i.flashy ? "最后十秒，你一句「密码是生日倒过来」拍板，门「咔」地开了，全队欢呼着冲出去。" : "你带着队伍按部就班破关而出，配合默契，几个队友直说下次还找你。") + mgThemeHook(s, 0.34);
    },
    onLose: (s) => { add(s, "mood", 3); add(s, "strategy", 1); return "卡在倒数第二关没出来，被 NPC「请」了出去。懊恼归懊恼，脑子转了一晚上也算热闹。" + mgThemeHook(s, 0.15); },
    onDraw: (s) => { add(s, "mood", 5); return "压哨逃出，惊险刺激。一群人瘫在门口大笑，约定挑战下一个主题。"; }
  },
  /* —— 马拉松：和自己的身体死磕（吃体魄）—— */
  {
    id: "marathon", name: "报名跑马拉松", emoji: "🏅", opponent: "三十公里后的极限墙", statKey: "body",
    where: "万人起跑线，补给站、加油声、和三十公里处那堵看不见的「墙」。", rounds: 3, moves: MG_MOVES_DUEL, stake: 400,
    cond: (s) => s.age >= 18 && s.age <= 58 && s.health >= 40,
    intro: "发令枪响，人潮涌动。配速、补给、咬牙——每一步都是和自己的谈判。",
    onWin: (s, i) => {
      add(s, "mood", 8); add(s, "body", 1); add(s, "health", 3); add(s, "reputation", 3);
      return (i.flashy ? "你冲线时还能加速，奖牌挂上脖子，完赛照刷爆了朋友圈，一堆人喊你「大神」。" : "你稳稳跑完全程，奖牌沉甸甸。那种把自己跑穿又拼回来的踏实，钱买不到。") + mgThemeHook(s, 0.30);
    },
    onLose: (s) => { add(s, "mood", 4); add(s, "body", 1); add(s, "health", 2); return "撞墙后你没能坚持，半途收容车把你拉了回去。腿软心不软，下次再战。" + mgThemeHook(s, 0.12); },
    onDraw: (s) => { add(s, "mood", 5); add(s, "health", 2); return "踩着关门时间擦线完赛，狼狈又自豪。完赛的人没有快慢，只有完成和未完成。"; }
  },
  /* —— 露营：星空篝火下的松弛（吃心智 + 天公作美）—— */
  {
    id: "camping", name: "周末去露营", emoji: "🏕️", opponent: "说变就变的山野天气", statKey: "mind",
    where: "山野星空下的营地，天幕、篝火噼啪、远处虫鸣一片。", rounds: 3, moves: MG_MOVES_LUCK, stake: 400,
    cond: (s) => s.age >= 20 && s.age <= 62,
    intro: "帐篷扎好，云却压了过来。今晚是漫天星河，还是连夜收摊，全看老天的脸色。",
    onWin: (s, i) => {
      add(s, "mood", 8); add(s, "mind", 1); add(s, "stress", -10);
      return (i.flashy ? "夜里云开，银河铺满头顶，篝火旁一群陌生人聊到天亮。这一晚，久违地把自己彻底放空。" : "天气作美，山风清爽，你煮茶看云，难得地什么都不想。") + mgThemeHook(s, 0.32);
    },
    onLose: (s) => { add(s, "mood", 3); add(s, "stress", -5); return "半夜一场雨把营地浇透，狼狈收摊。可雨声里钻进睡袋的那点窘迫，多年后想起竟全是笑。" + mgThemeHook(s, 0.12); },
    onDraw: (s) => { add(s, "mood", 5); add(s, "stress", -6); return "天气阴晴不定，你随遇而安。围炉煮茶，听了一耳朵别人的故事。"; }
  }
];
function mgById(id) { for (var i = 0; i < MINIGAMES.length; i++) if (MINIGAMES[i].id === id) return MINIGAMES[i]; return null; }
function mgAvailable(s) { return MINIGAMES.filter(function (g) { try { return !g.cond || g.cond(s); } catch (e) { return false; } }); }
