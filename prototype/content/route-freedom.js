"use strict";
/* route-freedom.js —— 路线【财务自由 freedom】：一条「靠搞钱滚雪球到财务自由」的自己干引导线。
 * 体验主轴：先有第一笔收入→攒第一桶金→副业/投资滚起来→身价百万→身价千万实现财务自由。
 * path=自己干：副业与投资是核心，创业可选；行动随任务一步步解锁。*/
(function () {
  const nw = (s) => (s.cash || 0) + (s.assets || 0);
  const goalOK = (s) => (typeof goalDone === "function" ? goalDone(s) : nw(s) >= 10000000);

  registerRoute("freedom", {
    intro: "你只信一件事：钱要自己挣，雪球要自己滚。从第一笔副业收入开始，一路滚到财务自由。",
    // 这条线能做的事（超集）——搞钱线，副业/投资是核心，创业可选
    actions: ["jobhunt", "work", "parttime", "sidehustle", "invest", "socialize", "browse", "exercise", "relocate", "rest", "date", "startup"],
    // 渐进解锁：以任务进度为主、年龄为辅
    unlock: {
      sidehustle: (s) => s.age >= 18,                                   // 副业早早开
      invest: (s) => isQuestDone(s, "freedom", "q_firstpot") || nw(s) >= 100000,  // 攒到第一桶金后开
      startup: (s) => isQuestDone(s, "freedom", "q_snowball") || nw(s) >= 500000,  // 攒够本金后可创业
      socialize: (s) => isQuestDone(s, "freedom", "q_firstincome") || s.age >= 22,
      relocate: (s) => s.age >= 20
    },
    lockHint: {
      invest: "🔒 攒下第一桶金（10万）后解锁「投资理财」",
      startup: "🔒 副业/投资滚到 50 万、攒够本金后解锁「创业」",
      socialize: "🔒 有了第一笔收入后解锁「社交应酬」（攒人脉资源）"
    },
    quests: [
      { id: "q_firstincome", title: "挣到第一笔收入", hint: "先动起来——「📦 副业」搞点外快，或「📨 找工作」入职拿工资，让现金流转起来。手头紧时也可先「💼 打零工」。",
        done: (s) => has(s, "employed") || has(s, "side_hot") || nw(s) >= 30000,
        onDone: (s) => { add(s, "mood", 6); } },
      { id: "q_firstpot", title: "攒下第一桶金（10万）", hint: "把收入攒下来——持续「📦 副业」加「💼 上班/打零工」，攒到第一个十万。攒够后解锁「📈 投资理财」。",
        done: (s) => nw(s) >= 100000,
        onDone: (s) => { add(s, "mood", 8); add(s, "insight", 1); } },
      { id: "q_snowball", title: "副业/投资滚起来（50万）", hint: "雪球要滚——把第一桶金投进「📈 投资理财」钱生钱，再把「📦 副业」做大做火，身价冲到 50 万。",
        done: (s) => nw(s) >= 500000,
        onDone: (s) => { add(s, "mood", 8); add(s, "reputation", 4); } },
      { id: "q_million", title: "身价百万", hint: "上规模——「📈 投资」复利 +「📦 副业」放量，本金够了也可「🚀 创业」搏一把，把身价做到一百万。",
        done: (s) => nw(s) >= 1000000,
        onDone: (s) => { add(s, "mood", 10); add(s, "reputation", 6); } },
      { id: "q_freedom", title: "财务自由：身价破千万", hint: "最后一程——靠投资复利、副业现金流和创业回报叠加，把身价滚到一千万，从此被动收入养活自己。",
        done: (s) => goalOK(s) || nw(s) >= 10000000 }
    ]
  });
})();
