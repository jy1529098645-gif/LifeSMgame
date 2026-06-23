"use strict";
/* content/family-system.js
 * Lightweight family state for existing life events:
 * bond / conflict / co-parenting. No separate management screen.
 */

function familyEnsure(s) {
  s.family = s.family || {};
  if (s.family.bond == null) s.family.bond = has(s, "married") || has(s, "partner") ? 58 : 45;
  if (s.family.conflict == null) s.family.conflict = 18;
  if (s.family.coParent == null) s.family.coParent = has(s, "has_kid") ? 50 : 0;
  if (s.family.yearsMarried == null) s.family.yearsMarried = 0;
  return s.family;
}

function familyClamp(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function familyNudge(s, d) {
  var f = familyEnsure(s);
  if (d.bond) f.bond = familyClamp(f.bond + d.bond);
  if (d.conflict) f.conflict = familyClamp(f.conflict + d.conflict);
  if (d.coParent) f.coParent = familyClamp(f.coParent + d.coParent);
  return f;
}

function familyMarry(s) {
  familyEnsure(s);
  flag(s, "married");
  s.flags.partner = false;
  s.flags.divorced = false;
  familyNudge(s, { bond: 18, conflict: -8 });
}

function familyDivorce(s, opts) {
  opts = opts || {};
  var f = familyEnsure(s);
  flag(s, "divorced");
  s.flags.married = false;
  s.flags.partner = false;
  s.flags.affair = false;
  s.partnerName = null;
  f.bond = Math.min(f.bond, opts.civil ? 38 : 24);
  f.conflict = Math.max(f.conflict, opts.civil ? 45 : 68);
  if (has(s, "has_kid")) {
    flag(s, "co_parenting");
    f.coParent = Math.max(f.coParent || 0, opts.civil ? 48 : 28);
  }
  var base = Math.max(0, s.cash || 0);
  var lossRate = opts.lossRate == null ? (opts.civil ? 0.22 : 0.35) : opts.lossRate;
  if (lossRate > 0 && base > 0) add(s, "cash", -Math.round(base * lossRate));
  add(s, "stress", opts.stress == null ? 10 : opts.stress);
  add(s, "mood", opts.mood == null ? -10 : opts.mood);
  socialShift(s, opts.social == null ? -2 : opts.social);
  s.timeline.push({ age: s.age, text: opts.text || "你们办理了离婚，生活从此分成两条线。" });
  return f;
}

function familyTone(f) {
  if (!f) return "平静";
  if (f.conflict >= 72) return "高压";
  if (f.bond >= 72 && f.conflict <= 28) return "亲密";
  if (f.bond <= 28) return "疏离";
  if (f.conflict >= 48) return "摩擦";
  return "平稳";
}

function childDefaultName(s) {
  var n = (s.children && s.children.length) || 0;
  var base = ["小满", "安安", "一舟", "念念", "星河", "知夏", "嘉树", "南乔"];
  return base[n % base.length];
}
function childEnsureList(s) {
  s.children = s.children || [];
  if (has(s, "has_kid") && !s.children.length) recordChildBirth(s, { silent: true });
  return s.children;
}
function recordChildBirth(s, opts) {
  opts = opts || {};
  s.children = s.children || [];
  var idx = s.children.length;
  var fallback = childDefaultName(s);
  var nm = opts.name || fallback;
  if (!opts.silent && typeof prompt === "function") {
    var ask = prompt("给这个孩子起个名字：", fallback);
    if (ask && ask.trim()) nm = ask.trim().slice(0, 12);
  }
  var child = {
    id: "kid_" + s.year + "_" + idx,
    name: nm,
    gender: opts.gender || (rnd(0.5) ? "男" : "女"),
    birthYear: s.year,
    age: 0,
    relation: opts.adopted ? "养子女" : "子女",
    adopted: !!opts.adopted,
    education: s.kidEdu || 0,
    bond: 62,
    trait: opts.trait || null,
    note: opts.note || ""
  };
  s.children.push(child);
  flag(s, "has_kid");
  s.timeline.push({ age: s.age, text: nm + "来到这个家。你第一次真切意识到，人生从此多了一条会反过来牵动你的命运。" });
  return child;
}
function childUpdateAges(s) {
  (s.children || []).forEach(function (c) {
    c.age = Math.max(0, s.year - (c.birthYear || s.year));
    c.education = Math.max(c.education || 0, s.kidEdu || 0);
  });
  return s.children || [];
}

EVENTS.push(
  {
    id: "ev_family_finance_talk",
    module: "family",
    ambient: true,
    once: false,
    cond: (s) => (has(s, "married") || has(s, "partner")) && s.age >= 25 && familyEnsure(s).conflict >= 38,
    prob: (s) => 0.10 + Math.min(0.12, familyEnsure(s).conflict / 700),
    title: "💳 家里的账本",
    text: (s) => {
      var f = familyEnsure(s);
      return "月底，账单和创业开销摊在桌上。房租、人情、父母体检、孩子兴趣班、公司服务器，全都挤进一张表里。对方问你：「以后家里的钱，到底怎么管？」现在的家庭状态是：" + familyTone(f) + "。";
    },
    choices: [
      { label: "做共同账户，大额支出提前商量", effect: (s) => {
          add(s, "insight", 2); add(s, "stress", -2); familyNudge(s, { bond: 8, conflict: -10, coParent: 3 });
          return "你们把生活费、赡养、育儿和个人消费拆成几栏。表格不浪漫，但它让很多争吵失去了火药味。";
        } },
      { label: "AA 到底，谁也别管谁", effect: (s) => {
          add(s, "strategy", 2); add(s, "mood", -3); familyNudge(s, { bond: -7, conflict: 8 });
          return "账是清楚了，人也远了一点。你们像两个合租的成年人，礼貌、精确，但越来越少谈心。";
        } },
      { label: "先糊弄过去，等公司赚钱再说", effect: (s) => {
          add(s, "stress", 6); familyNudge(s, { bond: -5, conflict: 12 });
          return "你把话题绕回了未来的估值。对方没有反驳，只是把账单收起来。沉默比争吵更难哄。";
        } }
    ]
  },
  {
    id: "ev_family_coparent_calendar",
    module: "family",
    ambient: true,
    once: false,
    cond: (s) => has(s, "has_kid") && s.age >= 30 && (familyEnsure(s).coParent <= 45 || familyEnsure(s).conflict >= 48),
    prob: (s) => 0.12,
    title: "🧸 谁去接孩子",
    text: (s) => "学校群里又在接龙：家长会、体检、手工作业、运动会志愿者。你正在开会，对方也在赶 deadline。孩子发来一句：「今天到底谁来接我？」",
    choices: [
      { label: "把日历排清楚，工作也要给家让位", effect: (s) => {
          add(s, "stress", 2); add(s, "mood", 5); familyNudge(s, { bond: 5, conflict: -8, coParent: 12 });
          return "你们把接送、陪作业、老人帮忙的边界都写进共享日历。人生还是忙，但孩子不再像临时任务。";
        } },
      { label: "花钱外包：托管、保姆、司机都安排上", effect: (s) => {
          add(s, "cash", -6000); add(s, "stress", -4); familyNudge(s, { coParent: 5, conflict: -2, bond: -2 });
          return "钱解决了一部分混乱，也留下了一点空心。孩子被照顾得不错，只是偶尔问：「你们什么时候有空陪我？」";
        } },
      { label: "谁有空谁去，别这么矫情", effect: (s) => {
          add(s, "stress", 5); add(s, "mood", -6); familyNudge(s, { bond: -6, conflict: 12, coParent: -10 });
          return "这句话出口后，群里安静了。晚上孩子坐在传达室门口等你，手里攥着已经凉掉的面包。";
        } }
    ]
  },
  {
    id: "ev_family_divorce_talk",
    module: "love",
    ambient: true,
    once: false,
    cond: (s) => has(s, "married") && s.age >= 28 && (familyEnsure(s).conflict >= 76 || familyEnsure(s).bond <= 24),
    prob: (s) => 0.18,
    title: "📄 离婚冷静期",
    text: (s) => {
      var f = familyEnsure(s);
      return "争吵累积到某个晚上，谁都不想再解释。对方把证件袋放到桌上：「我们是不是该认真谈谈了？」亲密 " + f.bond + "，矛盾 " + f.conflict + (has(s, "has_kid") ? "，共同育儿 " + f.coParent : "") + "。";
    },
    choices: [
      { label: "先不离，约定三个月认真修复", effect: (s) => {
          add(s, "cash", -8000); add(s, "stress", -4); add(s, "insight", 3); familyNudge(s, { bond: 12, conflict: -18, coParent: 5 });
          return "你们没有立刻翻篇，而是把咨询、陪伴、家务和财务都写成具体安排。修复不保证成功，但至少不是空话。";
        } },
      { label: "试分居，给彼此一点空气", effect: (s) => {
          add(s, "cash", -12000); add(s, "mood", -4); add(s, "stress", 4); familyNudge(s, { bond: -4, conflict: -10, coParent: has(s, "has_kid") ? -3 : 0 });
          flag(s, "separated");
          return "你临时搬了出去。距离让争吵少了，也让很多习惯突然空出来。你们还没离，但已经开始练习没有彼此的生活。";
        } },
      { label: "签字离婚，把损失和责任讲清楚", effect: (s) => {
          familyDivorce(s, { civil: true, lossRate: 0.25, mood: -9, stress: 8, social: -2, text: "你们通过一场艰难但体面的谈判结束婚姻。" });
          add(s, "insight", 4);
          return "协议签完后，生活没有立刻崩塌，只是变得安静。财产、探视、老人、孩子都被写进条款里，爱没有了，责任还在。";
        } }
    ]
  },
  {
    id: "ev_family_co_parenting_after_divorce",
    module: "family",
    ambient: true,
    once: false,
    cond: (s) => has(s, "co_parenting") && has(s, "has_kid") && s.age >= 32,
    prob: (s) => 0.10,
    title: "🎒 离婚以后，孩子的周末",
    text: (s) => "周五晚上，孩子背着书包站在门口，问这个周末去哪边。离婚把大人的关系切开了，但孩子的时间表还连着两个人。",
    choices: [
      { label: "稳定轮换，重要日子两边都到场", effect: (s) => {
          add(s, "mood", 4); add(s, "stress", -2); familyNudge(s, { coParent: 10, conflict: -6, bond: 1 });
          return "你们不再是伴侣，但学会了像成年人一样交接。孩子慢慢明白：家变成了两个地址，不等于没人爱。";
        } },
      { label: "借孩子继续赌气，让对方难受", effect: (s) => {
          add(s, "mood", -6); add(s, "stress", 8); socialShift(s, -2); familyNudge(s, { coParent: -12, conflict: 12 });
          return "你赢了一次口舌，却让孩子夹在中间。那天之后，孩子开始把学校的事藏起来，不再告诉任何一边。";
        } },
      { label: "忙事业，探视能推就推", effect: (s) => {
          add(s, "cash", 3000); add(s, "stress", -1); add(s, "mood", -8); familyNudge(s, { coParent: -14, conflict: 5, bond: -3 });
          return "你多谈成了一个客户，却错过了孩子的汇演。视频里孩子一直往观众席看，后来再也没问你来不来。";
        } }
    ]
  },
  {
    id: "ev_family_second_child",
    module: "family",
    ambient: true,
    once: true,
    cond: (s) => has(s, "has_kid") && !has(s, "dink") && childEnsureList(s).length < 2 && has(s, "married") && s.age >= 31 && s.age <= 46,
    prob: (s) => 0.08,
    title: "🍼 第二个孩子？",
    text: (s) => {
      childUpdateAges(s);
      var first = (s.children && s.children[0] && s.children[0].name) || "孩子";
      return first + "已经会满屋子跑了。老人说一个孩子太孤单，政策也在鼓励多生。可账本、精力、事业窗口期都摆在眼前，你们要不要再添一个？";
    },
    choices: [
      { label: "再要一个，家里热闹点", effect: (s) => {
          recordChildBirth(s, {});
          add(s, "cash", -80000); add(s, "mood", 8); add(s, "stress", 8); familyNudge(s, { bond: 4, conflict: 4, coParent: 8 });
          return "家里又多了一个哭声，也多了一份让人心软的重量。你知道这不是简单的幸福，是更漫长的责任。";
        } },
      { label: "先把现在这个养好", effect: (s) => {
          flag(s, "one_child_focus"); add(s, "mood", 3); add(s, "stress", -2); familyNudge(s, { coParent: 4, conflict: -3 });
          return "你们决定不被口号和亲戚推着走。少一点热闹，多一点专注，也是一种负责。";
        } }
    ]
  },
  {
    id: "ev_child_first_school",
    module: "family",
    ambient: true,
    once: true,
    cond: (s) => has(s, "has_kid") && childUpdateAges(s).some(c => c.age >= 6),
    prob: (s) => 0.16,
    title: "🎒 第一天上学",
    text: (s) => {
      var c = childUpdateAges(s).find(x => x.age >= 6) || {};
      return c.name + "背着新书包站在校门口，一只手攥着你，一只手攥着自己的勇气。你忽然想起很多年前，自己也是这样被推向一个陌生世界。";
    },
    choices: [
      { label: "请假送到教室门口", effect: (s) => { add(s, "mood", 6); add(s, "cash", -1000); add(s, "stress", -2); familyNudge(s, { bond: 3, coParent: 5 }); return "你蹲下来整理好孩子的衣领，说：「害怕也没事，放学我来接你。」那一刻，孩子点了点头。"; } },
      { label: "交给老人，自己赶项目", effect: (s) => { add(s, "cash", 3000); add(s, "stress", 2); add(s, "mood", -3); familyNudge(s, { coParent: -4, conflict: 3 }); return "项目推进了一点，孩子也顺利入学。只是晚上看见书包上的姓名贴，你心里空了一下。"; } }
    ]
  },
  {
    id: "ev_child_adult_crossroad",
    module: "family",
    ambient: true,
    once: true,
    cond: (s) => has(s, "has_kid") && childUpdateAges(s).some(c => c.age >= 18),
    prob: (s) => 0.22,
    title: "🧭 孩子成年那年",
    text: (s) => {
      var c = childUpdateAges(s).find(x => x.age >= 18) || {};
      return c.name + "拿着自己的录取通知、offer 或创业计划坐在你对面。十八岁的人生岔路口，终于轮到你坐在父母的位置上，看另一个年轻人往前走。";
    },
    choices: [
      { label: "给启动资金，也给选择权", effect: (s) => {
          var c = childUpdateAges(s).find(x => x.age >= 18); if (c) { c.trait = "supported"; c.bond = Math.min(100, (c.bond || 50) + 15); }
          add(s, "cash", -120000); add(s, "mood", 8); familyNudge(s, { bond: 4, coParent: 6 });
          return "你没有把自己未完成的梦想塞给孩子，只是递过去一笔钱和一句话：「别怕试错，家还在。」";
        } },
      { label: "强行安排最稳的路", effect: (s) => {
          var c = childUpdateAges(s).find(x => x.age >= 18); if (c) { c.trait = "arranged"; c.bond = Math.max(0, (c.bond || 50) - 12); }
          add(s, "stress", 5); add(s, "mood", -4); familyNudge(s, { conflict: 8, coParent: -4 });
          return "你把自己的经验说成了唯一正确答案。孩子没有顶嘴，只是眼神慢慢暗下去。";
        } },
      { label: "让 ta 自己摔，别总靠家里", effect: (s) => {
          var c = childUpdateAges(s).find(x => x.age >= 18); if (c) { c.trait = "independent"; c.bond = Math.max(0, (c.bond || 50) - 4); }
          add(s, "mood", 1); add(s, "insight", 2); familyNudge(s, { coParent: -2 });
          return "你退后一步，看孩子自己去撞世界。你说这是自由，也知道这自由里带着一点狠心。";
        } }
    ]
  }
);
