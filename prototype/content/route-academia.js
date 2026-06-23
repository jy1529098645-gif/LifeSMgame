"use strict";
/* route-academia.js —— 路线【学术封神 acad】：一条「从寒窗苦读到学界封顶」的治学引导线。
 * 体验主轴：攒学识打基础 → 读研读博 → 做出成果发论文 → 戴上博士帽 → 评职称问鼎院士/诺奖。
 * 行动以治学为主（学习充电 + 出国留学/读博是核心），随任务一步步解锁。
 * 真实目标 id：acad；done 条件：has(s,"laureate") || has(s,"academician")。
 * 引用的 flag 均取自代码实际写入：engine.js 毕业写 edu_bachelor/edu_phd/phd_done，
 *   events-degree.js 的 acad_set 写 academia_track，冲顶链写 acad_breakthrough。*/
(function () {
  // 学术职级是否达到某档（博后/讲师/副教授/教授）
  const rankAtLeast = (s, set) => !!(s && s.acadRank && set[s.acadRank]);
  const kn = (s) => (s && s.stats && typeof s.stats.knowledge === "number") ? s.stats.knowledge : 0;

  registerRoute("acad", {
    intro: "板凳要坐十年冷。这一路，从啃书攒学识开始，一寸一寸，把人类的认知往前推。",
    // 这条线能做的事（超集）——以治学为主，其余行动(创业/体制/炒股等)不在治学者的日常里
    actions: ["study", "abroad", "jobhunt", "work", "socialize", "browse", "exercise", "rest", "relocate", "parttime"],
    // 渐进解锁：以任务进度为主、年龄为辅。study 一直开。
    unlock: {
      // 出国留学/读博：开局即给 can_abroad，攒够学术底子(或年龄到)再放出来，避免一上来就跑路
      abroad: (s) => has(s, "can_abroad") && (isQuestDone(s, "acad", "q_base") || kn(s) >= 30 || s.age >= 20),
      // 求职/上班：博士出炉或上了学术轨道、或年纪到了才考虑变现谋生
      jobhunt: (s) => isQuestDone(s, "acad", "q_grad") || has(s, "academia_track") || s.age >= 28,
      work: (s) => has(s, "employed") || has(s, "academia_track"),
      // 社交应酬(攒人脉/校友圈)：读研读博后才有意义
      socialize: (s) => isQuestDone(s, "acad", "q_enroll") || s.age >= 24,
      relocate: (s) => s.age >= 22,
      // 兼职打工：早年补贴清贫读书的生活，后期不再需要
      parttime: (s) => !isQuestDone(s, "acad", "q_grad")
    },
    lockHint: {
      abroad: "🔒 先把学术底子打牢（攒学识/或考研读研）再考虑「出国留学/读博」",
      jobhunt: "🔒 拿到学位 / 上了学术轨道后，再考虑「找工作」变现",
      socialize: "🔒 读研读博后解锁「社交应酬」（攒导师/校友人脉）"
    },
    quests: [
      { id: "q_base", title: "打牢学术基础，攒下做学问的底气", hint: "多用「📖 学习充电」啃书攒学识。把『学识』攒到一定厚度，才扛得起往后十年的冷板凳。",
        done: (s) => kn(s) >= 30 || has(s, "edu_bachelor") || has(s, "academia_track"),
        onDone: (s) => { add(s, "mood", 6); add(s, "insight", 1); } },
      { id: "q_enroll", title: "读研读博，往学术深处再走一程", hint: "继续「📖 学习充电」推进学业，或「🛫 出国留学」远赴海外读研读博。毕业关键节点会让你选『读硕/读博』——走学术这条窄路。",
        done: (s) => has(s, "academia_track") || has(s, "phd_done") || has(s, "edu_phd") || rankAtLeast(s, { "博后": 1, "讲师": 1, "副教授": 1, "教授": 1 }) || has(s, "abroad_done"),
        onDone: (s) => { add(s, "mood", 6); add(s, "knowledge", 2); } },
      { id: "q_grad", title: "戴上博士帽，拿下学位", hint: "顶住清贫与延毕的煎熬，把博士读出来。博士毕业那天，你成了家里的第一个博士。",
        done: (s) => has(s, "phd_done") || has(s, "edu_phd") || rankAtLeast(s, { "博后": 1, "讲师": 1, "副教授": 1, "教授": 1 }),
        onDone: (s) => { add(s, "reputation", 6); add(s, "mood", 8); } },
      { id: "q_breakthrough", title: "做出成果，奠定学界地位", hint: "在学术职业阶梯上往上爬（博后→讲师→副教授→教授），把学识攒厚，啃下那个困扰领域多年的难题——发出一篇能写进教科书的论文。",
        done: (s) => has(s, "acad_breakthrough") || has(s, "acad_nominated") || rankAtLeast(s, { "副教授": 1, "教授": 1 }) || has(s, "full_professor"),
        onDone: (s) => { add(s, "reputation", 8); add(s, "insight", 2); } },
      { id: "q_apex", title: "学术封顶：问鼎诺奖 / 图灵 / 菲尔兹 / 院士", hint: "最后一关——把成果推向世界之巅。深耕到底，等那通来自评审委员会的电话，或那张院士增选的名单。",
        done: (s) => (typeof goalDone === "function" ? goalDone(s) : (has(s, "laureate") || has(s, "academician"))) }
    ]
  });
})();
