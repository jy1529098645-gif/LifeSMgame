"use strict";
/* route-tycoon.js —— 路线【金融大鳄 tycoon】：一条「纯靠炒股，把本金滚成大资本」的引导线。
 * 体验主轴：打工副业攒本金→入市建仓→踩准风口吃行情→滚到百万→持仓五百万成大鳄。
 * 核心是「📈 投资理财」入场建仓 +「📱 刷手机」看新闻推风口；不创业、不打工封顶。*/
(function () {
  const sv = (s) => (typeof stockValue === "function" ? stockValue(s) : 0);
  const cash = (s) => (s && s.cash) || 0;

  registerRoute("tycoon", {
    intro: "你信一句话：钱能生钱。这一路，从攒第一笔本金开始，靠盘面把小钱滚成大资本。",
    // 这条线能做的事（超集）——核心是 invest(建仓) + browse(看风口)；创业/上班封顶不在大鳄日常里
    actions: ["jobhunt", "work", "parttime", "sidehustle", "invest", "browse", "socialize", "exercise", "relocate", "rest", "date"],
    // 渐进解锁：早期靠打工/副业攒本金；攒够第一笔就放开入市；browse 一直开着看风口
    unlock: {
      jobhunt: (s) => !isQuestDone(s, "tycoon", "q_seed") || s.age < 30,
      work: (s) => !isQuestDone(s, "tycoon", "q_seed") || s.age < 30,
      parttime: (s) => !isQuestDone(s, "tycoon", "q_seed"),
      sidehustle: (s) => cash(s) >= 5000 || s.age >= 22,
      invest: (s) => isQuestDone(s, "tycoon", "q_seed") || cash(s) >= 30000,
      browse: (s) => true,
      socialize: (s) => isQuestDone(s, "tycoon", "q_firstbuy") || s.age >= 26,
      relocate: (s) => s.age >= 22
    },
    lockHint: {
      invest: "🔒 攒够本金后解锁「投资理财」入市",
      sidehustle: "🔒 手里有点闲钱后解锁「搞副业」加速攒本金",
      socialize: "🔒 入市后解锁「社交应酬」（打听消息）"
    },
    quests: [
      { id: "q_seed", title: "攒够入市本金（现金 3 万）", hint: "本金是入场券。靠「💼 上班」「💼 打零工」按月领薪、再加点「📦 副业」，把现金攒到 3 万。攒够后解锁「📈 投资理财」入市。",
        done: (s) => cash(s) >= 30000,
        onDone: (s) => { add(s, "mood", 6); } },
      { id: "q_firstbuy", title: "第一次入市建仓", hint: "去「📈 投资理财」页把本金买进去——哪怕先小仓试水。让持仓市值跑起来，你才算真正进了场。",
        done: (s) => sv(s) > 0,
        onDone: (s) => { add(s, "mood", 6); add(s, "insight", 1); } },
      { id: "q_firstwave", title: "吃到第一波行情（持仓 20 万）", hint: "别瞎买。多「📱 刷手机」看新闻、推断下一个风口，再去「📈 投资理财」加仓押对方向，把持仓市值做到 20 万。",
        done: (s) => sv(s) >= 200000,
        onDone: (s) => { add(s, "mood", 8); add(s, "insight", 1); } },
      { id: "q_million", title: "滚到百万（持仓 100 万）", hint: "复利开始发力。继续「📱 刷手机」抓风口、在「📈 投资理财」里高抛低吸滚动操作，把持仓市值推过 100 万。",
        done: (s) => sv(s) >= 1000000,
        onDone: (s) => { add(s, "reputation", 6); add(s, "mood", 8); } },
      { id: "q_tycoon", title: "金融大鳄：持仓 500 万", hint: "最后一关——把持仓市值做到 500 万。一身盘感，把『炒』字炒出花来，坐上大鳄的位置。",
        done: (s) => (typeof goalDone === "function" ? goalDone(s) : sv(s) >= 5000000) }
    ]
  });
})();
