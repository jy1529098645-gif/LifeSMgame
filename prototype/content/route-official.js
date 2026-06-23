"use strict";
/* route-official.js —— 路线【步步高升 official】：一条「考公上岸→官至正处级以上」的体制内引导线。
 * 体验主轴：埋头备考→上岸进编→站稳脚跟攒第一次提拔→沿科级往处级爬→官至正处以上。
 * 上岸前靠「学习充电」备考、「找工作」投体制岗；上岸后「钻研业务·跑关系」(civilwork)是核心，
 * 「社交应酬」攒人脉、「健身养生」扛住酒桌与压力。行动随任务一步步解锁。
 * 依赖 civil.js 的体制系统：s.civilRank 0→6（5=正处级）、has(s,"civil_servant")=已上岸。*/
(function () {
  // 防 undefined 的安全取值
  const rank = (s) => (s && s.civilRank) || 0;
  const onShore = (s) => has(s, "civil_servant");                 // 是否已上岸
  const kn = (s) => (s && s.stats && s.stats.knowledge) || 0;     // 学识(备考)

  registerRoute("official", {
    intro: "你认准一条路：宇宙的尽头是编制。从一摞行测资料开始，一步一个台阶，把「官」字往上写。",
    // 这条线能做的事（超集）——创业/留学/炒股投机不在体制人的日常里
    actions: ["jobhunt", "work", "study", "civilwork", "socialize", "browse", "exercise", "relocate", "rest", "date"],
    // 渐进解锁：以任务进度为主、年龄为辅
    unlock: {
      // study 早开——上岸前是备考的命根子；上岸后还能再战或进修，但意义淡了
      study: (s) => !onShore(s) || rank(s) < 2,
      // civilwork 由 core.js 的 require(has civil_servant) 天然控制，这里上岸后明确放行
      civilwork: (s) => onShore(s),
      // 社交应酬：上岸后才真正重要（攒人脉好提拔）
      socialize: (s) => onShore(s) || s.age >= 24,
      // 健身养生：上岸后扛酒桌接待，正科级起更要紧
      exercise: (s) => onShore(s) || s.age >= 22,
      relocate: (s) => s.age >= 22,
      // 找工作：上岸进编后就不再海投了，专心仕途
      jobhunt: (s) => !onShore(s)
    },
    lockHint: {
      civilwork: "🔒 考公上岸（进编制）后解锁「钻研业务·跑关系」——仕途进步的核心",
      socialize: "🔒 上岸后解锁「社交应酬」（攒人脉好提拔）"
    },
    quests: [
      { id: "q_prep", title: "埋头备考公务员", hint: "多去「📖 学习充电」攒学识（行测申论都得啃），把底子打到 50 以上；同时盯着「📨 找工作」里的体制岗，或等「📕 要不要考公上岸」的机会专门考公。",
        done: (s) => kn(s) >= 50 || onShore(s),
        onDone: (s) => { add(s, "mood", 5); add(s, "insight", 1); } },
      { id: "q_onshore", title: "考公上岸，端起铁饭碗", hint: "千军万马过独木桥——遇到「📕 考公上岸」的机会就报名，脱产苦读上岸率更高。上岸即成「科员」，正式进编。",
        done: (s) => onShore(s),
        onDone: (s) => { add(s, "mood", 12); add(s, "reputation", 4); } },
      { id: "q_firstup", title: "站稳脚跟，争取第一次提拔", hint: "进编只是起点。坚持「🗂️ 钻研业务·跑关系」攒声誉人脉，遇到「📈 一个空出来的位子」时正面争取，先升到副科级。",
        done: (s) => rank(s) >= 2,
        onDone: (s) => { add(s, "reputation", 5); add(s, "mood", 6); } },
      { id: "q_chuji", title: "更上层楼，跻身处级", hint: "科级到处级是道坎。一边「🗂️ 跑业务」做政绩，一边「🤝 社交应酬」经营关系、站对队，一级级把级别抬到副处级。",
        done: (s) => rank(s) >= 4,
        onDone: (s) => { add(s, "reputation", 6); add(s, "network", 4); } },
      { id: "q_zhengchu", title: "步步高升：官至正处以上", hint: "最后一关——从副处冲上正处级。靠多年攒下的政绩、人脉与资历，把仕途这盘棋下到正处以上，功成名就。",
        done: (s) => (typeof goalDone === "function" ? goalDone(s) : rank(s) >= 5) || rank(s) >= 5 }
    ]
  });
})();
