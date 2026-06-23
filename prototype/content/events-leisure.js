"use strict";
/* =====================================================================
 * content/events-leisure.js —— 小游戏「主动找上门」的邀约事件（v1.0）
 * 让下棋/打球/酒吧等小游戏不只靠玩家主动点「找乐子」，也会有人来约你。
 * 接受 → 设 s._bg=<真棋盘id> 或 s._mg=<对话小游戏id>，引擎在事件结算后拉起对局。
 * 婉拒 → 轻微心情/属性变化。ambient + 冷却，避免刷屏。
 * 只用全局 helper（add/flag/has/pick/rnd）。
 * ===================================================================== */
EVENTS.push(
  // —— 真棋盘：楼下大爷象棋约战 ——
  { id: "ev_inv_xiangqi", module: "relation", ambient: true,
    cond: (s) => s.age >= 18,
    title: "♟️ 棋摊老爷子叫住了你",
    text: () => "路过公园棋摊，赵老爷子眼睛一亮，啪地拍了下棋盘：「小伙子，看你这眉眼就是块下棋的料！来一盘？输了可不许耍赖。」围观的大爷们都笑着起哄。",
    choices: [
      { label: "好嘞，杀一盘！（真·中国象棋）", effect: (s) => { s._bg = "xiangqi"; return "你卷起袖子坐下，红方先行。"; } },
      { label: "改天吧，今天有事", effect: (s) => { add(s, "mood", 1); return "你笑着摆手婉拒。老爷子「啧」了一声：「年轻人就是忙。」"; } }
    ] },
  // —— 真棋盘：茶馆围棋 ——
  { id: "ev_inv_weiqi", module: "relation", ambient: true,
    cond: (s) => s.age >= 18 && (s.stats.mind >= 35 || s.stats.insight >= 35),
    title: "⚪ 茶馆里的一局",
    text: () => "老茶馆飘着茶香，李教授守着云子棋盘，朝你招招手：「来，对一盘？围棋见心性，正好看看你沉不沉得住气。」",
    choices: [
      { label: "请教一局（真·9 路围棋）", effect: (s) => { s._bg = "weiqi"; return "你执黑落子，茶香袅袅。"; } },
      { label: "我不太会，先看看", effect: (s) => { add(s, "insight", 1); return "你在旁观了一会儿，看高手对弈，竟也品出几分门道。"; } }
    ] },
  // —— 真棋盘：棋摊五子棋 ——
  { id: "ev_inv_gomoku", module: "relation", ambient: true,
    cond: (s) => s.age >= 16,
    title: "⚫ 五子棋摊的挑战",
    text: () => "小区花园的石桌前，张大爷把黑子往你手里一塞：「五子连珠，简单！来两盘，赢了请你喝茶。」",
    choices: [
      { label: "来！（真·五子棋）", effect: (s) => { s._bg = "gomoku"; return "你接过黑子，落下第一手。"; } },
      { label: "下次一定", effect: (s) => { add(s, "mood", 1); return "你打了个招呼就走了，留下大爷自己摆棋研究。"; } }
    ] },
  // —— 对话小游戏：老友约球 ——
  { id: "ev_inv_ball", module: "relation", ambient: true,
    cond: (s) => s.age >= 16 && s.age <= 45 && s.health >= 35,
    title: "🏀 老友喊你打球",
    text: () => "手机震了震，发小发来消息：「球场老地方，三缺一，就等你了！」",
    choices: [
      { label: "走，活动活动筋骨", effect: (s) => { s._mg = "ball"; return "你换上球鞋冲下了楼。"; } },
      { label: "今天太累，下次", effect: (s) => { add(s, "stress", 2); add(s, "mood", -1); return "你瘫在沙发上回了句「改天」。挂了电话，又有点后悔。"; } }
    ] },
  // —— 对话小游戏：朋友拉你去酒吧 ——
  { id: "ev_inv_bar", module: "relation", ambient: true,
    cond: (s) => s.age >= 20 && s.age <= 55 && !has(s, "married"),
    title: "🍸 周五晚的邀约",
    text: () => "周五傍晚，朋友在群里吆喝：「下班别走！新开的酒吧，去放松放松，说不定有艳遇？」",
    choices: [
      { label: "去！松弛一下", effect: (s) => { s._mg = "bar"; return "你拎起外套，奔向霓虹。"; } },
      { label: "算了，回家躺着", effect: (s) => { add(s, "health", 2); return "你选择了回家。热闹是他们的，被窝是你的。"; } }
    ] },
  // —— 对话小游戏：周末野钓 / 带娃游乐园 ——
  { id: "ev_inv_fish", module: "relation", ambient: true,
    cond: (s) => s.age >= 28 && s.stress >= 35,
    title: "🎣 钓友的吆喝",
    text: () => "钓友一大早发来定位：「水库走起！鱼口正好，带上你那套家伙。」你看了眼这阵子绷紧的自己，心动了。",
    choices: [
      { label: "去，钓一天清静", effect: (s) => { s._mg = "fish"; return "你拎起鱼竿，奔向晨雾里的水库。"; } },
      { label: "再睡会儿吧", effect: (s) => { add(s, "stress", -2); return "你关掉消息，蒙头又睡。睡眠也是一种解压。"; } }
    ] },
  { id: "ev_inv_park", module: "family", ambient: true,
    cond: (s) => has(s, "has_kid") && s.age >= 28 && s.age <= 55,
    title: "🎡 孩子拽着你去游乐园",
    text: () => "周末，孩子拽着你的衣角不撒手：「说好了带我去游乐园的！你上次就答应了！」那双眼睛，你实在拒绝不了。",
    choices: [
      { label: "走！陪娃疯一天", effect: (s) => { s._mg = "park"; return "你被孩子拖出了家门。"; } },
      { label: "爸/妈这周真没空", effect: (s) => { add(s, "mood", -3); s.neglect = s.neglect || { fam: 0, self: 0 }; s.neglect.fam += 20; return "你食言了。孩子失落地「哦」了一声，回了房间。你心里堵得慌。"; } }
    ] },
  // —— 对话小游戏：同好喊你去漫展拍片 ——
  { id: "ev_inv_comiccon", module: "relation", ambient: true,
    cond: (s) => s.age >= 14 && s.age <= 50,
    title: "📸 同好甩来一张漫展门票",
    text: () => "二次元群里炸了锅：「这周末超大漫展！场刊嘉宾全到齐，就缺个会拍照的——你那台机子带上，咱去横扫返图！」",
    choices: [
      { label: "冲！去扫一天好片", effect: (s) => { s._mg = "comiccon"; return "你擦亮镜头，背起相机包就出发了。"; } },
      { label: "人太多了，改天吧", effect: (s) => { add(s, "mood", 1); return "你想了想那人潮，还是怂了。在家刷了一下午别人的返图，有点小馋。"; } }
    ] },
  // —— 对话小游戏：朋友拉你拼一场剧本杀 ——
  { id: "ev_inv_jubensha", module: "relation", ambient: true,
    cond: (s) => s.age >= 16 && s.age <= 42,
    title: "🔪 三缺一的剧本杀局",
    text: () => "朋友半夜发来消息：「订好店了，一个硬核推理本，就差你这个脑子！来不来，凶手等你抓。」",
    choices: [
      { label: "来，今晚我破案", effect: (s) => { s._mg = "jubensha"; return "你搓了搓手，奔赴一场谎言与真相的对局。"; } },
      { label: "明早还有事，下次", effect: (s) => { add(s, "insight", 1); return "你婉拒了，躺床上却忍不住把上回那个没解开的本又想了一遍。"; } }
    ] },
  // —— 对话小游戏：跑团喊你报名马拉松 ——
  { id: "ev_inv_marathon", module: "relation", ambient: true,
    cond: (s) => s.age >= 18 && s.age <= 58 && s.health >= 40,
    title: "🏅 跑友拉你组队报名",
    text: () => "跑友在群里吆喝：「城市马拉松开报了！名额拼手速，咱组个队，完赛奖牌人手一块——敢不敢跟自己死磕一回？」",
    choices: [
      { label: "报！练起来", effect: (s) => { s._mg = "marathon"; return "你系紧鞋带，把名额抢了下来。"; } },
      { label: "我这身板悬，算了", effect: (s) => { add(s, "stress", 1); return "你瞅了眼自己的肚子，默默退出了群接龙。"; } }
    ] },
  // —— 对话小游戏：朋友约周末露营 ——
  { id: "ev_inv_camping", module: "relation", ambient: true,
    cond: (s) => s.age >= 20 && s.age <= 62 && s.stress >= 30,
    title: "🏕️ 周末逃进山里",
    text: () => "朋友发来一张草甸照片：「装备都备好了，就等你。城里太闷了，进山扎营，看星星烤火，啥也不想——走不走？」",
    choices: [
      { label: "走，进山放空", effect: (s) => { s._mg = "camping"; return "你把帐篷往后备箱一塞，逃离了钢筋水泥。"; } },
      { label: "周末想在家躺平", effect: (s) => { add(s, "stress", -3); return "你选择宅家回血。窝在沙发里，也是一种露营——露在自家阳台。"; } }
    ] }
);
