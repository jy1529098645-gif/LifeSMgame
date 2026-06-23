"use strict";
/* =====================================================================
 * content/events-family.js —— 生育/领养 + 性别处境（平衡、无歧视）
 * - 生不了孩子（如同性家庭）可走「领养」或「辅助生育」。
 * - 性别事件：男女各面对一种【分量相当】的社会压力，选项都给力量，批判的是偏见而非性别。
 * ===================================================================== */

// 要不要孩子：异性可亲生；同性走试管/领养；任何人都可领养或丁克
EVENTS.push({
  id: "ev_family_kids", module: "domestic", ambient: true,
  cond: (s) => has(s, "married") && !has(s, "has_kid") && !has(s, "dink") && s.age >= 28 && s.age <= 46,
  title: "👶 要不要孩子",
  text: (s) => (s.orientation === "同")
    ? "你和伴侣感情稳定。可生养孩子这件事，对你们这样的家庭，要多绕几道弯。怎么走？"
    : "成家几年了，双方父母旁敲侧击：是不是该要个孩子了？",
  dynamicChoices: (s) => {
    const opts = [];
    if (s.orientation !== "同") {
      opts.push({ label: "要个亲生孩子", effect: (s) => { if (typeof recordChildBirth === "function") recordChildBirth(s, {}); else flag(s, "has_kid"); add(s, "mood", 8); add(s, "cash", -60000); add(s, "stress", 4); return "一个小生命降临，你的人生从此多了一根牵挂的线，也多了一份甜蜜的重担。"; } });
    } else {
      opts.push({ label: "做试管 / 辅助生育", effect: (s) => { const c = 200000; if (s.cash < c) { add(s, "mood", -4); return "你查了查辅助生育的花费，倒吸一口凉气——这条路，眼下还走不起。"; } add(s, "cash", -c); add(s, "stress", 6); if (rnd(0.55)) { if (typeof recordChildBirth === "function") recordChildBirth(s, {}); else flag(s, "has_kid"); add(s, "mood", 10); return "几番奔波、几次失望之后，你们终于迎来了自己的宝宝。来之不易，倍加珍惜。"; } add(s, "mood", -8); return "试了几轮都没成功，身心俱疲。你们抱头痛哭，又彼此打气，决定再想想。"; } });
    }
    opts.push({ label: "领养一个孩子", effect: (s) => { if (typeof recordChildBirth === "function") recordChildBirth(s, { adopted: true }); else flag(s, "has_kid"); flag(s, "adopted"); add(s, "mood", 10); add(s, "cash", -30000); add(s, "reputation", 4); return "你们走完繁琐的手续，把一个需要家的孩子接回了家。血缘之外，爱一样滚烫。"; } });
    opts.push({ label: "丁克，过好二人世界", effect: (s) => { flag(s, "dink"); add(s, "mood", 6); add(s, "cash", 20000); return "你们决定不要孩子，把日子过成诗。潇洒，但也要面对晚年的另一种孤独。"; } });
    return opts;
  },
  choices: []
});

// 性别处境（男）：经济/成家压力。批判的是「以房车彩礼论英雄」的偏见。
EVENTS.push({
  id: "ev_gen_pressure_m", module: "life", ambient: true, once: true,
  cond: (s) => s.gender === "男" && s.age >= 27 && s.age <= 40 && !has(s, "married"),
  title: "🏠 「没房没车谈什么对象」",
  text: (s) => byClass(s, {
    poor: "相亲对象的妈妈一句话把你问住：「在大城市买房了吗？彩礼准备多少？」你陪着笑，后背发凉。",
    mid: "七大姑八大姨轮番上阵：男人嘛，先有房有车有存款，才好说媳妇。你被压得喘不过气。",
    rich: "你条件不错，可越是这样，越有人盯着你的房本和存款看，真心假意难分辨。"
  }),
  choices: [
    { label: "咬牙攒钱拼事业", effect: (s) => { add(s, "strategy", 2); add(s, "stress", 6); add(s, "mood", -3); return "你把压力化成动力，一头扎进工作。出头之前，先扛住别人的嘴。"; } },
    { label: "不将就，按自己节奏来", effect: (s) => { add(s, "mood", 4); add(s, "insight", 2); add(s, "network", -3); return "你懒得迎合那套「成功标准」，被念叨「不上进」，但你睡得踏实。"; } }
  ]
});

// 性别处境（女）：催婚/职场年龄偏见。批判的是偏见本身。
EVENTS.push({
  id: "ev_gen_pressure_f", module: "life", ambient: true, once: true,
  cond: (s) => s.gender === "女" && s.age >= 27 && s.age <= 38 && !has(s, "married"),
  title: "⏳ 「年纪大了不好嫁」？",
  text: (s) => byClass(s, {
    poor: "亲戚的「关心」像针：「都这岁数了还挑什么。」面试时还被旁敲侧击「有没有结婚生育打算」。",
    mid: "催婚电话一个接一个，职场里「育龄」二字也成了隐形的坎。你被两头夹击。",
    rich: "你事业有成，却总有人嘀咕「女强人不好相处」。偏见，无处不在。"
  }),
  choices: [
    { label: "我的人生我做主", effect: (s) => { add(s, "insight", 2); add(s, "mood", 4); add(s, "network", -3); return "你顶住了所有「为你好」，活成自己想要的样子。少了点旁人的认可，多了份清醒。"; } },
    { label: "用实力回击偏见", effect: (s) => { add(s, "strategy", 2); add(s, "knowledge", 2); add(s, "stress", 4); return "你把精力收回到自己身上，把活干得漂亮。路更难走，但每一步都算数。"; } }
  ]
});
