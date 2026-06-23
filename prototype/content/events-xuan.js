"use strict";
/* content/events-xuan.js —— 🔮 玄学奇遇事件线（跨局解锁：达成过任意人生目标后开启）
 * 全部 gate 在 has(s,"unlock_line_xuan")，只有解锁的周目才会撞见这条荒诞支线。 */
function xuan_ok(s) { return has(s, "unlock_line_xuan") && s.age >= 18; }

EVENTS.push({
  id: "ev_xuan_fortune", module: "absurd", ambient: true,
  cond: (s) => xuan_ok(s),
  title: "🔮 巷口的算命摊",
  text: (s) => "深巷尽头支着一方旧幡，瞎眼老者枯坐摊后，你刚走近，他忽然开口：「这位贵人，你印堂发亮，却有一道坎卡了多年——要不要,我替你算上一卦？」",
  choices: [
    { label: "信一回，报上生辰", next: (s) => ({
      text: (s) => "老者掐指良久，缓缓道：「你命里不缺财，缺的是『敢』字。三日内必有一桩横事找上门——接住了是机缘，躲开了是平安。」",
      choices: [
        { label: "记在心上，等那桩横事", effect: (s) => { flag(s, "xuan_blessed"); add(s, "insight", 3); bumpMomentum(s, 8); return "你将信将疑地揣着这句话回了家。说也奇怪，往后些日子，你看什么机会都比从前敢下手几分——是玄学，还是心理暗示，谁说得清。"; } },
        { label: "一笑了之，权当听书", effect: (s) => { add(s, "insight", 1); add(s, "mood", 2); return "你笑着丢下几张零钱走了。江湖术士的话,听个乐呵就好——可那句『缺个敢字』,却莫名在心里住了下来。"; } }
      ]
    }) },
    { label: "嗤之以鼻，转身就走", effect: (s) => { add(s, "strategy", 1); return "你才不信这套。脚步没停，背后却飘来一句：「不信？无妨。命，本就是不信的人在替信的人走。」你脚下一顿，到底没回头。"; } }
  ]
});

EVENTS.push({
  id: "ev_xuan_dream", module: "absurd", ambient: true, once: true,
  cond: (s) => xuan_ok(s) && s.age >= 28,
  title: "🌫️ 一个似曾相识的梦",
  text: (s) => "你梦见自己站在一条岔路口，每条路尽头都站着「另一个你」——有的西装革履，有的一身褴褛，有的儿孙绕膝，有的孑然一身。他们齐齐转头看你，像在问：你确定，要这样走下去吗？",
  choices: [
    { label: "走向那个最风光的「你」", effect: (s) => { add(s, "strategy", 2); add(s, "stress", 4); bumpMomentum(s, 6); return "你朝那个意气风发的身影走去。醒来后，一股莫名的劲头烧在胸口——这辈子，你忽然更想搏一把了。"; } },
    { label: "走向那个最平静的「你」", effect: (s) => { add(s, "insight", 2); add(s, "mood", 6); add(s, "stress", -6); return "你走向那个眉眼舒展的身影。醒来时枕头有点湿，心却前所未有地静——有些答案，你好像早就知道了。"; } },
    { label: "谁也不选，就这么醒来", effect: (s) => { add(s, "insight", 3); return "你在岔路口站到天明，一步也没迈。醒来后你想：也许人生根本没有「对的那条路」，只有走着走着,就成了自己的那条。"; } }
  ]
});

EVENTS.push({
  id: "ev_xuan_relive", module: "absurd", ambient: true,
  cond: (s) => xuan_ok(s) && (s.drift || 0) % 3 === 1,
  title: "♾️ 既视感",
  text: (s) => "某个再普通不过的午后，你忽然被一阵强烈的既视感攫住——这条街、这阵风、这句话，你分明经历过，甚至……不止一次。仿佛你早已活过无数遍，只是每一遍都略有不同。",
  choices: [
    { label: "顺着这股感觉，赌一把直觉", effect: (s) => { add(s, "cash", rnd(0.5) ? 30000 : -8000); bumpMomentum(s, 4); return "你鬼使神差地跟着那股「我知道接下来会发生什么」的直觉走了一步。结果对了一半、错了一半——平行世界的记忆，到底靠不住啊。"; } },
    { label: "甩甩头，告诉自己是错觉", effect: (s) => { add(s, "mind", 2); return "你揉了揉太阳穴，把那点诡异感压了下去。日子还得照常过——管他什么平行世界，能过好这一遍就不错了。"; } }
  ]
});

EVENTS.push({
  id: "ev_xuan_wishwell", module: "absurd", ambient: true, once: true,
  cond: (s) => xuan_ok(s) && s.cash > 30000,
  title: "🪙 古寺的许愿井",
  text: (s) => "山间古寺，一口斑驳的许愿井。香客们说它「极灵」，但有个规矩：投得越多越灵，可若是诚心不够，反会招来反噬。你摸了摸口袋。",
  choices: [
    { label: "豪掷千金，许个大愿", effect: (s) => { add(s, "cash", -10000); if (rnd(0.45)) { add(s, "mood", 10); bumpMomentum(s, 12); flag(s, "xuan_blessed"); return "硬币叮当落底的刹那，你心头一松。说来玄乎，那之后诸事竟真顺了不少——是井灵验，还是你自己把『我会变好』信成了真？"; } add(s, "mood", -4); return "钱是投了，愿也许了，回去却接连碰壁。你苦笑：原来反噬是真的——或者只是,贵了的那一万块让你更输不起了。"; } },
    { label: "投一枚硬币，心意到了就行", effect: (s) => { add(s, "cash", -100); add(s, "mood", 4); add(s, "insight", 1); return "你弹了枚硬币进去，许了个不大不小的愿。求的不是灵不灵，是给自己一个『我还在认真期待』的理由。"; } },
    { label: "不投，对着井许个免费的", effect: (s) => { add(s, "insight", 2); return "你对着井口默念了几句，分文未花。你想：要是愿望真能靠扔钱实现，那这世上早没穷人了。"; } }
  ]
});
