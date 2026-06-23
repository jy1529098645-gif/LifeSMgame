"use strict";
/* route-corp.js —— 路线【打工封顶 corp】：一条「从海投简历到打工封顶」的打工人引导线。
 * 体验主轴：找工作→站稳→攒钱→升职→跳槽往上→叩关高管。行动随任务一步步解锁。*/
(function () {
  const nw = (s) => (s.cash || 0) + (s.assets || 0);
  const sal = (s) => (typeof jobSalary === "function" ? jobSalary(s) : 0);

  registerRoute("corp", {
    intro: "你信一句话：打工也能打出头。这一路，从海投简历开始，一级一级往上爬。",
    // 这条线能做的事（超集）——其余行动(创业/体制/留学等)不在打工人的日常里
    actions: ["jobhunt", "work", "quit", "study", "parttime", "sidehustle", "socialize", "invest", "exercise", "browse", "relocate", "rest", "date"],
    // 渐进解锁：以任务进度为主、年龄为辅
    unlock: {
      sidehustle: (s) => isQuestDone(s, "corp", "q_firstjob") || s.age >= 24,
      socialize: (s) => isQuestDone(s, "corp", "q_firstjob") || s.age >= 23,
      invest: (s) => isQuestDone(s, "corp", "q_save10w") || s.age >= 30,
      relocate: (s) => s.age >= 22,
      study: (s) => s.age < 33,             // 学习充电主要在职业早期有意义
      quit: (s) => has(s, "employed")
    },
    lockHint: {
      sidehustle: "🔒 入职第一份工作后解锁「搞副业」",
      socialize: "🔒 入职后解锁「社交应酬」（攒人脉）",
      invest: "🔒 攒下第一个十万后解锁「投资理财」"
    },
    quests: [
      { id: "q_firstjob", title: "找到第一份正经工作", hint: "打开「📨 找工作」海投简历，去面试拿下第一份 offer（一周能投好几家）。没钱时也可先「💼 打零工」糊口。",
        done: (s) => has(s, "employed"),
        onDone: (s) => { add(s, "mood", 6); } },
      { id: "q_save10w", title: "攒下第一个十万", hint: "靠「💼 上班」按月领薪、再加点「📦 副业」，把第一桶金攒出来。攒够后解锁「📈 投资理财」。",
        done: (s) => nw(s) >= 100000,
        onDone: (s) => { add(s, "mood", 8); add(s, "insight", 1); } },
      { id: "q_promote", title: "升职加薪，进入中层", hint: "在岗位上做出成绩——坚持「💼 上班」遇到「绩效面谈/晋升窗口」时正面争取，把职级或薪资抬上去。",
        done: (s) => s.job && ((s.job.level || 0) >= 1 || (s.job._raise || 0) >= 0.12),
        onDone: (s) => { add(s, "reputation", 4); add(s, "mood", 6); } },
      { id: "q_jump", title: "跳槽 / 晋升，登上更高的台子", hint: "别在一棵树上吊死。用「📨 找工作」跳到更好的平台，或继续在「💼 上班」里往管理岗爬——目标月薪 2.5 万以上。",
        done: (s) => s.job && (sal(s) >= 25000 || (s.job.level || 0) >= 2),
        onDone: (s) => { add(s, "reputation", 6); add(s, "network", 4); } },
      { id: "q_cap", title: "打工封顶：坐上高管 / 月薪 10 万", hint: "最后一关——冲刺企业高管(C 级)或月薪十万。用一身本事，把『工』字写出花来。",
        done: (s) => (typeof goalDone === "function" ? goalDone(s) : (s.job && s.job.id === "exec")) }
    ]
  });
})();
