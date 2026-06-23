"use strict";
/* route-globe.js —— 路线【环游世界 globe】：一条「打工攒路费→出走→走遍世界」的旅人引导线。
 * 体验主轴：先打工副业攒第一笔旅费→第一次出走→换城市/出国→融入异乡→走遍六地环游世界。
 * 行动随任务一步步解锁，攒钱是旅途的燃料。*/
(function () {
  const places = (s) => (s.placesSeen || 0);   // 走过的地方数，防 undefined
  const cash = (s) => (s.cash || 0);            // 现金（路费），防 undefined

  registerRoute("globe", {
    intro: "你只信脚下的路：人这一生，总得亲眼看看世界。攒够路费就出发，一座城接一座城地走下去。",
    // 这条线能做的事（超集）——travel/relocate/localize 是核心，打工副业攒路费
    actions: ["jobhunt", "work", "parttime", "sidehustle", "travel", "relocate", "localize", "browse", "exercise", "rest", "date", "socialize"],
    // 渐进解锁：以任务进度为主、年龄为辅
    unlock: {
      // 早开攒钱：上班/打零工/副业一上来就能做
      sidehustle: (s) => isQuestDone(s, "globe", "q_firstjob") || s.age >= 22,
      socialize: (s) => isQuestDone(s, "globe", "q_savetrip") || s.age >= 24,
      // 攒够第一笔旅费后才放出走：出国旅游 / 换城市
      travel: (s) => isQuestDone(s, "globe", "q_savetrip") || s.age >= 22,
      relocate: (s) => isQuestDone(s, "globe", "q_savetrip") || s.age >= 22,
      // localize 还需身处异乡（core.js 里 require has(s,"overseas")），这里再叠一道进度门
      localize: (s) => isQuestDone(s, "globe", "q_firsttrip") || s.age >= 25
    },
    lockHint: {
      sidehustle: "🔒 找到第一份工作后解锁「搞副业」（多攒点路费）",
      travel: "🔒 攒够第一笔旅费后解锁「✈️ 出国旅游」",
      relocate: "🔒 攒够第一笔旅费后解锁「🏙️ 换个城市」",
      localize: "🔒 先出走见过世面后，身处异乡时解锁「融入异乡」",
      socialize: "🔒 攒够第一笔旅费后解锁「社交应酬」（认识各地朋友）"
    },
    quests: [
      { id: "q_savetrip", title: "攒够第一笔旅费", hint: "先有盘缠才能上路——靠「💼 上班」按月领薪，再加点「📦 副业」「💼 打零工」，把第一笔路费攒出来（攒够后解锁「✈️ 出国旅游」「🏙️ 换个城市」）。",
        done: (s) => cash(s) >= 30000,
        onDone: (s) => { add(s, "mood", 6); } },
      { id: "q_firsttrip", title: "第一次出走，离开熟悉的地方", hint: "盘缠到手，出发吧！去「✈️ 出国旅游」或「🏙️ 换个城市」，亲眼看看外面的世界——走过 1 个地方就算迈出第一步。",
        done: (s) => places(s) >= 1,
        onDone: (s) => { add(s, "mood", 8); add(s, "insight", 1); } },
      { id: "q_three", title: "走遍三地，路越走越宽", hint: "别在一处停太久——继续「✈️ 出国旅游」「🏙️ 换个城市」，攒不够路费就回头「💼 上班」「📦 副业」补给。目标：走遍 3 个地方。",
        done: (s) => places(s) >= 3,
        onDone: (s) => { add(s, "insight", 1); add(s, "mood", 6); } },
      { id: "q_five", title: "走遍五地，你已是半个世界公民", hint: "脚步不停，再添两座城。「✈️ 出国旅游」开新国，「🏙️ 换个城市」扎新根，到了异乡别忘「融入异乡」。目标：走遍 5 个地方。",
        done: (s) => places(s) >= 5,
        onDone: (s) => { add(s, "insight", 2); add(s, "reputation", 3); add(s, "mood", 6); } },
      { id: "q_globe", title: "环游世界：走遍第六座城", hint: "最后一程——再走一个地方，凑满 6 座城市/国家，把『环游世界』写进你的人生。",
        done: (s) => (typeof goalDone === "function" ? goalDone(s) : places(s) >= 6) || places(s) >= 6 }
    ]
  });
})();
