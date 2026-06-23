"use strict";
/* =====================================================================
 * content/cofounders.js —— 创业合伙人 + 角色分级（v1.0）
 *
 * 【角色分级】游戏里出现的人按「重要度」分三层，背景详略不同：
 *   ◆ 核心角色（合伙人 / 伴侣 / 子女 / 父母）——有名字、来历、专长、性格、忠诚度与一条剧情线，
 *     背景写得最细，会贯穿多年、产生连续剧情（如合伙人共苦/背叛/并肩敲钟）。
 *   ◆ 重要角色（社交圈核心/中间圈、贵人、对手）——有名字 + 角色 + 性格(persona) + 态度，
 *     会反复出现、受关系经营影响。
 *   ◆ 路人（外围圈、弱连接、一次性事件里的人）——通常只有一个称呼或角色名，露个脸就走。
 *
 * 【合伙人】立项后可招合伙人：①社交圈里找（知根知底、忠诚高，但要你平时把关系经营好）；
 *   ②网上找（能力可能更强，但忠诚成谜、有背叛风险）；③坚持单干。
 *   合伙人 s.startup.cofounder = {name,from,specialty,skill,loyalty,equity,persona,bio}
 *   每周「搞创业」时按其 skill 加速推进、分担压力；高估值时触发忠诚度大考（共苦/分赃/背叛）。
 * ===================================================================== */

var COF_SPECIALTIES = [
  { key: "tech", name: "技术大牛", emoji: "👨‍💻", boost: "knowledge", blurb: "代码如诗，能把你画的饼真正做出来" },
  { key: "product", name: "产品鬼才", emoji: "🎨", boost: "insight", blurb: "懂用户要什么，总能戳中痛点" },
  { key: "sales", name: "销售之王", emoji: "🤵", boost: "charm", blurb: "能把梳子卖给和尚，资源人脉一抓一大把" },
  { key: "ops", name: "运营老炮", emoji: "📊", boost: "strategy", blurb: "增长、留存、精打细算，把每一分钱花出响" },
  { key: "capital", name: "资本玩家", emoji: "💰", boost: "network", blurb: "和投资人称兄道弟，融资路演如鱼得水" }
];
var COF_ONLINE_BIOS = [
  "GitHub 上万星项目的作者，头像是只猫，没人见过真容，深夜在线、回复极快。",
  "前大厂核心员工，因「理念不合」裸辞，眼里有光也有怨气，履历漂亮得过分。",
  "连续创业者，上一个项目刚黄，嘴上全是行业黑话，你分不清是高手还是骗子。",
  "海归硕士，PPT 做得比产品还精致，开口闭口「赛道」「壁垒」「飞轮效应」。",
  "论坛里认识的技术宅，沉默寡言，发来的 demo 却让你眼前一亮——可你连他全名都不知道。"
];
var COF_NAMES_ON = ["阿K", "老猫", "Leo", "陈工", "大鹏", "Mr.Z", "阿哲", "Vivian", "老枪", "小马哥"];

function cof_rand(a, b) { return a + Math.random() * (b - a); }
// 从社交圈里挑一个「靠得住又有点本事」的人当合伙人候选（吃关系经营：态度越高越可能拉到强援）
function cof_circleCandidate(s) {
  var pool = (s.social || []).filter(function (n) { return n.role !== "爸妈" && (n.tier || 3) <= 2 && n.attitude >= 55; });
  if (!pool.length) pool = (s.social || []).filter(function (n) { return n.role !== "爸妈" && n.attitude >= 50; });
  if (!pool.length) return null;
  pool.sort(function (a, b) { return b.attitude - a.attitude; });
  return pool[0];
}
function makeCofounder(s, source) {
  var sp = pick(COF_SPECIALTIES);
  if (source === "circle") {
    var n = cof_circleCandidate(s); if (!n) return null;
    var skill = Math.round(cof_rand(45, 72) + (n.attitude - 55) * 0.3);
    return {
      name: n.name, from: n.role, source: "circle", specialty: sp.key, specName: sp.name, emoji: sp.emoji, boost: sp.boost,
      skill: Math.max(35, Math.min(90, skill)),
      loyalty: Math.max(55, Math.min(98, Math.round(n.attitude + cof_rand(0, 12)))),  // 知根知底 → 忠诚高
      equity: pick([20, 25, 30, 35]),
      persona: n.persona || null,
      bio: "你的「" + n.role + "」" + n.name + "，相识多年、知根知底。" + (n.persona ? (n.persona.desc + "，") : "") + "ta 是个" + sp.name + "（" + sp.blurb + "）。你信得过 ta，这比什么都重要。"
    };
  }
  // 网络：能力方差大、忠诚成谜
  var nm = pick(COF_NAMES_ON);
  return {
    name: nm, from: "网友", source: "online", specialty: sp.key, specName: sp.name, emoji: sp.emoji, boost: sp.boost,
    skill: Math.round(cof_rand(50, 92)),
    loyalty: Math.round(cof_rand(28, 65)),   // 不知底细 → 忠诚成谜
    equity: pick([30, 35, 40, 45]),
    persona: null,
    bio: "网上结识的「" + nm + "」，一个" + sp.name + "（" + sp.blurb + "）。" + pick(COF_ONLINE_BIOS) + " 能力或许够，可你对 ta 的底细，几乎一无所知。"
  };
}

// 招募合伙人的节点（被 startupNode 接力，或由 ev_cofounder 拉起）
function cofounderRecruitNode(s) {
  var cand = cof_circleCandidate(s);
  var choices = [];
  if (cand) {
    choices.push({
      label: "从社交圈里拉「" + cand.role + " " + cand.name + "」入伙（知根知底）",
      effect: function (s) {
        var c = makeCofounder(s, "circle"); if (!c) return "你想拉个熟人入伙，可一圈问下来，眼下没人愿意陪你冒这个险。";
        s.startup.cofounder = c; add(s, "stress", -6); add(s, "network", 3); socialBoostRole(s, c.from, 8);
        return "你把 " + c.name + " 拉上了同一条船。" + c.bio + " 有个信得过的人并肩，再难的夜也没那么慌了。";
      }
    });
  }
  choices.push({
    label: "上网招一个能力强的合伙人（忠诚成谜）",
    effect: function (s) {
      var c = makeCofounder(s, "online");
      s.startup.cofounder = c; add(s, "stress", -3); add(s, "knowledge", 1);
      return "你在网上发了帖，筛了一圈，定下了 " + c.name + "。" + c.bio + " 是强援还是定时炸弹，只有时间知道。";
    }
  });
  choices.push({
    label: "算了，单打独斗",
    effect: function (s) { flag(s, "solo_founder"); add(s, "insight", 2); return "你决定一个人扛。没有合伙人分忧，也没有合伙人分权——船是你的，沉浮也都是你的。"; }
  });
  return { text: function () { return "一个人创业太难了。要不要找个合伙人，搭把手、分担风险？"; }, choices: choices };
}

/* —— 招募合伙人事件（立项后不久自动找上你；也可在 startupNode 里接力）—— */
EVENTS.push({
  id: "ev_cofounder", module: "startup", ambient: true, once: true,
  cond: function (s) { return s.startup && !has(s, "startup_done") && !s.startup.cofounder && !has(s, "solo_founder") && (s.age - (s.startup.foundedAge || s.age)) <= 3; },
  title: "🤝 要不要找个合伙人",
  text: function (s) { return "公司刚起步，千头万绪压在你一个人肩上。夜里你盯着天花板想：是不是该找个合伙人，一起扛？"; },
  choices: [], dynamicChoices: function (s) { return cofounderRecruitNode(s).choices; }
});

/* —— 合伙人忠诚大考：估值起来后，人心要变了（共苦/分赃/背叛）—— */
EVENTS.push({
  id: "ev_cofounder_test", module: "startup", ambient: true, once: true,
  cond: function (s) { return s.startup && !has(s, "startup_done") && s.startup.cofounder && s.startup.valuation > 1500000 && (s.age - (s.startup.foundedAge || s.age)) >= 2; },
  title: "🤝 合伙人的心思",
  text: function (s) { var c = s.startup.cofounder; return "公司估值起来了，" + c.name + "（" + c.specName + "，持股 " + c.equity + "%）最近有点不一样：开会时的眼神、私下接的电话……你嗅到一丝微妙。忠诚，到了要被钱称量的时候。"; },
  dynamicChoices: function (s) {
    var c = s.startup.cofounder;
    return [
      { label: "推心置腹，主动谈期权和未来", effect: function (s) {
          var p = 0.4 + (c.loyalty - 50) / 120 + s.stats.charm / 300;
          if (rnd(p)) { c.loyalty = Math.min(99, c.loyalty + 12); add(s, "mood", 6); flag(s, "cof_bonded"); return "你们彻夜长谈，把丑话说在前头、把蛋糕画在明处。" + c.name + "重重拍了下你的肩：「干！」这条船，更稳了。"; }
          add(s, "stress", 6); return "你掏了心窝子，对方却只是客气地点头。有些裂缝，话语补不上——你心里有了数。"; } },
      { label: "先下手为强，稀释/架空 ta", effect: function (s) {
          add(s, "strategy", 2); add(s, "reputation", -4); c.loyalty = Math.max(0, c.loyalty - 25);
          if (rnd(0.5)) { s.startup.valuation = Math.round(s.startup.valuation * 0.92); flag(s, "cof_purged"); return "你抢先动了手，修改协议、收回权限。" + c.name + "摔门而去，带走了一部分团队和一肚子怨。公司还是你的，只是凉了人心。"; }
          flag(s, "cof_betrayed"); add(s, "cash", -Math.round(s.startup.valuation * 0.1)); return "你的小动作被 " + c.name + "提前察觉。ta 反手一击——带走核心代码/客户，还把你告上了法庭。同室操戈，两败俱伤。"; } },
      { label: "用人不疑，照常并肩干", effect: function (s) {
          if (c.loyalty >= 60 || rnd(0.5)) { add(s, "mood", 4); flag(s, "cof_bonded"); return "你选择信任。" + c.name + "也没让你失望，关键时刻顶了上来。患难见真情，这份默契，比股权协议更牢。"; }
          flag(s, "cof_betrayed"); var loss = Math.round(s.startup.valuation * 0.18); s.startup.valuation -= loss; add(s, "mood", -12); return "你以为的兄弟，转头就被对手挖走，还顺走了商业机密。你愣在原地——原来「网上找的」那点担心，从来不是多余的。"; } }
    ];
  },
  choices: []
});
