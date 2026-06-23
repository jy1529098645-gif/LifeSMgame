"use strict";
/* route-peace.js —— 路线【岁月静好 peace】：一条「不争不抢、把日子过舒坦」的躺平治愈线。
 * 体验主轴：找个轻松糊口的营生→把生活过出滋味→守住身心→安稳到老→岁月静好。
 * 没有创业/投资这些高压搞钱项，慢慢来，活过 70 身心俱佳就赢。*/
(function () {
  const nw = (s) => (s.cash || 0) + (s.assets || 0);
  const goalOK = (s) => (typeof goalDone === "function" ? (function () { try { return goalDone(s); } catch (e) { return false; } })() : false);

  registerRoute("peace", {
    intro: "你想通了一件事：日子是用来过的，不是用来拼的。这一路，不争不抢，把生活慢慢过出滋味。",
    // 这条线能做的事（超集）——轻度营生糊口 + 大量休息/爱好/陪伴/找乐子；没有创业/投资等高压搞钱项
    actions: ["parttime", "work", "rest", "exercise", "hobby", "leisure", "family", "socialize", "browse", "date", "companion", "relocate", "travel"],
    // 渐进解锁：休息/锻炼/找乐子/培养爱好一直开；搬去慢节奏小城、出门旅行攒点钱后开
    unlock: {
      rest: (s) => true,
      exercise: (s) => true,
      leisure: (s) => true,
      hobby: (s) => true,                                                   // 培养爱好任何年龄都能做
      family: (s) => true,
      browse: (s) => true,
      relocate: (s) => isQuestDone(s, "peace", "q_living") || nw(s) >= 30000 || s.age >= 28,
      travel: (s) => isQuestDone(s, "peace", "q_living") || nw(s) >= 50000 || s.age >= 30,
      socialize: (s) => s.age >= 22,
      date: (s) => s.age >= 20,
      companion: (s) => s.age >= 20
    },
    lockHint: {
      relocate: "🔒 手头宽裕些（或找到糊口营生）后解锁「换个慢节奏小城住」",
      travel: "🔒 攒点闲钱后解锁「出门走走、看看世界」"
    },
    quests: [
      { id: "q_living", title: "找个糊口的轻松营生", hint: "不求高薪，有点进项就行。「💼 打零工」或随便上点班，能养活自己就好。",
        done: (s) => has(s, "employed") || nw(s) >= 20000,
        onDone: (s) => { add(s, "mood", 6); } },
      { id: "q_savor", title: "把生活过出滋味", hint: "「🎨 培养爱好」、多「👪 陪陪家人」、「🛋️ 找点乐子」——日子是用来享受的，把心情养起来。",
        done: (s) => has(s, "warm_family") || (s.mood || 0) >= 65,
        onDone: (s) => { add(s, "mood", 8); add(s, "stress", -5); } },
      { id: "q_keep", title: "守住身体和心情", hint: "别透支自己。「😴 好好休息」、「🏃 锻炼身体」，把健康和心情都稳在线上。",
        done: (s) => (s.health || 0) >= 60 && (s.mood || 0) >= 60,
        onDone: (s) => { add(s, "mood", 5); add(s, "stress", -5); } },
      { id: "q_sixty", title: "活过六十，安稳度日", hint: "不慌不忙，一年一年地过。守着这份平静，慢慢走到花甲之年。",
        done: (s) => (s.age || 0) >= 60,
        onDone: (s) => { add(s, "mood", 6); } },
      { id: "q_peace", title: "岁月静好：活过七十、身心俱佳", hint: "最后——活过七十岁，身子骨硬朗、心里头敞亮。这一生，过得舒坦，便是赢家。",
        done: (s) => goalOK(s) || ((s.age || 0) >= 70 && (s.mood || 0) > 60 && (s.health || 0) > 50) }
    ]
  });
})();
