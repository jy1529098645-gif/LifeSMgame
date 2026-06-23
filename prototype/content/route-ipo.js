"use strict";
/* route-ipo.js —— 路线【创业封神 ipo】：一条「从打工攒本金到自己敲钟上市」的创业引导线。
 * 体验主轴：打工/副业攒经验本金→立项创业→做出第一批用户→拿融资抬估值→敲钟上市。行动随任务一步步解锁。
 * 达成判定：has(s,"startup_done") && has(s,"chase_ipo") && !has(s,"startup_failed")（或 goalDone(s)）。*/
(function () {
  const nw = (s) => (s.cash || 0) + (s.assets || 0);
  // 安全读 startup 子字段（s.startup 可能为 null）
  const suVal = (s) => (s.startup && s.startup.valuation) || 0;
  const suProg = (s) => (s.startup && s.startup.progress) || 0;

  registerRoute("ipo", {
    intro: "你信一句话：打工是不可能打工的。这一路，从攒第一笔本金开始，把自己的公司一直做到敲钟上市。",
    // 这条线能做的事（超集）——早期打工/副业攒经验本金，中后期 startup/venture 是核心
    actions: ["jobhunt", "work", "parttime", "sidehustle", "startup", "venture", "invest", "socialize", "browse", "exercise", "relocate", "rest", "date"],
    // 渐进解锁：以任务进度为主、年龄为辅（注意 startup/venture 在 core.js 还有 has(s,"startup") 等 require 门槛，这里是额外引导性解锁）
    unlock: {
      sidehustle: (s) => isQuestDone(s, "ipo", "q_seed") || s.age >= 22,
      socialize: (s) => isQuestDone(s, "ipo", "q_found") || s.age >= 24,
      invest: (s) => isQuestDone(s, "ipo", "q_seed") || s.age >= 28,
      relocate: (s) => s.age >= 22,
      startup: (s) => isQuestDone(s, "ipo", "q_seed") || s.age >= 26,
      venture: (s) => has(s, "startup") && !has(s, "startup_done")
    },
    lockHint: {
      sidehustle: "🔒 攒够第一笔启动资金后解锁「搞副业」",
      socialize: "🔒 立项创业后解锁「社交应酬」（攒人脉拉资源）",
      invest: "🔒 攒够启动资金后解锁「投资理财」",
      startup: "🔒 攒够启动资金（或年满 26）后解锁「搞创业 · 立项」",
      venture: "🔒 立项创业后解锁「全职创业 · 进经营模式」"
    },
    quests: [
      { id: "q_seed", title: "攒够第一笔启动资金", hint: "靠「💼 上班」按月领薪、再加「📦 副业」攒经验和本金。没钱时也可先「🛎️ 兼职」糊口。手上现金+资产攒到 8 万，就有底气下海了。",
        done: (s) => nw(s) >= 80000,
        onDone: (s) => { add(s, "mood", 6); add(s, "insight", 1); } },
      { id: "q_found", title: "下海立项，开自己的公司", hint: "用「🚀 搞创业」立项，把自己的公司开起来。从此你不再是打工人，而是要为一摊事负责的老板。",
        done: (s) => has(s, "startup"),
        onDone: (s) => { add(s, "mood", 8); add(s, "reputation", 3); } },
      { id: "q_mvp", title: "做出第一批用户 / 跑通产品", hint: "持续「🚀 搞创业」推进项目，把进度往上磨。做出能用的版本、攒下第一批用户，让公司像个能活下去的东西。",
        done: (s) => has(s, "su_users") || suProg(s) >= 30,
        onDone: (s) => { add(s, "reputation", 5); add(s, "mood", 6); } },
      { id: "q_funded", title: "拿到融资，估值上台阶", hint: "把数据做扎实，接住天使/机构投资人的橄榄枝，或继续「🚀 搞创业」把估值顶上去——目标估值 200 万以上。",
        done: (s) => has(s, "su_funded") || has(s, "su_series_a") || suVal(s) >= 2000000,
        onDone: (s) => { add(s, "reputation", 6); add(s, "network", 4); } },
      { id: "q_ipo", title: "敲钟封神：把公司带上市", hint: "最后一搏——补齐财务合规、冲刺 IPO，走到交易所那口钟前。把自己的名字刻进钟声里。",
        done: (s) => (typeof goalDone === "function" ? goalDone(s) : (has(s, "startup_done") && has(s, "chase_ipo") && !has(s, "startup_failed"))) }
    ]
  });
})();
