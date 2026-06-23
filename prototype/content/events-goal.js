"use strict";
/* =====================================================================
 * content/events-goal.js —— 目标感知事件（把"追目标"的张力外显）
 * 读 goalProgress(s)/goalDone(s)/goalById(s)（来自 goals.js，全局）：
 *   - 快达成时：贵人相助 / 临门一脚（按路线给不同助力）
 *   - 受挫时：屋漏偏逢连夜雨（按路线给不同打击）
 *   - 中段心情低谷：目标动摇（坚持 vs 喘口气）
 * 必须在 index.html 里于 goals.js【之后】、_assemble.js 之前加载。
 * ===================================================================== */
function _goalPath(s) { const g = (typeof goalById === "function") ? goalById(s.goal) : null; return g ? g.path : ""; }
function _gp(s) { return (typeof goalProgress === "function") ? goalProgress(s) : 0; }
function _gdone(s) { return (typeof goalDone === "function") ? goalDone(s) : false; }

/* —— 贵人相助（快达成时，≥62%）—— */
EVENTS.push({
  id: "ev_goal_help", module: "goal", ambient: true,
  cond: (s) => s.goal && _gp(s) >= 62 && !_gdone(s) && s.age >= 22,
  title: "🤝 关键时刻，有人拉了你一把",
  text: (s) => {
    const m = {
      "打工": "你的本事终于被看见——一位老领导（或猎头）主动找上门，要给你一个更高的台子。",
      "自己干": "一位投资人（或大客户）被你打动，递来了关键的一笔资源。再撑一把，也许就成了。",
      "体制": "一位赏识你的上级，话里话外透着提携之意。机会，就在眼前。",
      "躺平": "日子正顺，一笔意外的清闲进项找上你，连身体都跟着舒坦起来。",
      "家庭": "热心的亲友张罗着帮你，家里的事一下子顺了大半。"
    };
    return (m[_goalPath(s)] || "命运在你最需要的时候，递来了一只手。") + "接住这份善意吗？";
  },
  choices: [
    { label: "抓住机会，全力一搏", effect: (s) => {
        const p = _goalPath(s); bumpMomentum(s, 8);
        if (p === "打工") { if (s.job) s.job._raise = (s.job._raise || 0) + 0.2; add(s, "network", 6); return "你接住了这个台子。一纸调令/offer，把你往「出头」又推近了一大步。"; }
        if (p === "自己干") { if (s.startup) { s.startup.progress += 40; s.startup.valuation = Math.round((s.startup.valuation || 0) * 1.3 + 200000); } add(s, "cash", 150000); add(s, "network", 6); return "贵人这一推，关键资源到位，你的事业肉眼可见地上了一个台阶。"; }
        if (p === "体制") { if (typeof rankUp === "function" && has(s, "civil_servant")) rankUp(s); add(s, "network", 6); return "领导一句话，胜过你熬十年。任命下来，你离目标又近了一级。"; }
        if (p === "躺平") { add(s, "cash", 80000); add(s, "mood", 10); add(s, "health", 6); return "钱来得轻松，人也松快。这就是你想要的——不费力的好命。"; }
        if (p === "家庭") { add(s, "mood", 12); flag(s, "matchmade"); return "亲友的热心没白费，家里暖意融融，你离「儿孙满堂」的图景更近了。"; }
        add(s, "mood", 8); return "你紧紧抓住了这份善意，朝目标又迈进一步。";
      } },
    { label: "婉拒，靠自己更踏实", effect: (s) => { add(s, "insight", 2); add(s, "reputation", 2); return "你笑着谢绝了。靠人不如靠己——这份倔强，也是你的一部分。"; } }
  ]
});

/* —— 屋漏偏逢连夜雨（有进度 ≥32% 且霉运缠身时）—— */
EVENTS.push({
  id: "ev_goal_setback", module: "goal", ambient: true,
  cond: (s) => s.goal && _gp(s) >= 32 && !_gdone(s) && s.world && s.world.momentum < -18,
  title: "🌧️ 屋漏偏逢连夜雨",
  text: (s) => {
    const m = {
      "打工": "最不该出事的节骨眼，你被一脚踢出局——项目黄了、背了锅，多年的努力像被人按了暂停。",
      "自己干": "资金链骤紧，合伙人撂挑子，竞品还在背后偷家。你眼睁睁看着辛苦攒下的局开始松动。",
      "体制": "你站错了队、触了霉头，一纸调令把你从快车道甩进了清水衙门。前功，差点尽弃。",
      "财务自由": "重仓的资产突然暴跌，账户绿得刺眼。攒了半天的身家，一夜缩水。",
      "家庭": "家里偏在这时出事——人病了、心也凉了，温馨的图景蒙上一层阴影。"
    };
    return (m[_goalPath(s)] || "越是接近，命运越爱开玩笑。一连串的坏消息，把你按在地上摩擦。") + "这一关，怎么过？";
  },
  choices: [
    { label: "咬牙扛住，绝不松手", effect: (s) => { add(s, "stress", 10); add(s, "health", -4); add(s, "mood", -4); bumpMomentum(s, 12); if (rnd(0.5)) return "你死死攥着不肯放。夜最黑的时候，你逼自己又站了起来——霉运，总有过去的一天。"; return "你扛住了，代价是身心俱疲。但只要没倒下，就还有机会。"; } },
    { label: "暂退一步，先稳住自己", effect: (s) => { add(s, "mood", 6); add(s, "health", 5); add(s, "stress", -8); bumpMomentum(s, 4); return "你松了松绷紧的弦，先把自己救上岸。目标可以慢一点，人不能垮。"; } }
  ]
});

/* —— 临门一脚（极接近 ≥86%，一锤定音，一辈子一次）—— */
EVENTS.push({
  id: "ev_goal_finalpush", module: "goal", ambient: true, once: true,
  cond: (s) => s.goal && _gp(s) >= 86 && !_gdone(s),
  title: "🎯 就差临门一脚",
  text: () => "目标近在咫尺，只差最后那一下。可越到这时候，越是手心冒汗——稳着收，还是赌一把把它彻底拿下？",
  choices: [
    { label: "稳扎稳打，水到渠成", effect: (s) => { const p = _goalPath(s); bumpMomentum(s, 6); add(s, "stress", 4); if (p === "自己干" && s.startup) s.startup.progress += 30; if (p === "打工" && s.job) s.job._raise = (s.job._raise || 0) + 0.15; if (p === "财务自由") add(s, "cash", 100000); return "你没冒进，一步一个脚印地把最后一段路走完。稳，但踏实。"; } },
    { label: "孤注一掷，一把拿下", effect: (s) => { if (rnd(0.5 + luckBias(s))) { const p = _goalPath(s); bumpMomentum(s, 15); if (p === "自己干" && s.startup) { s.startup.progress += 80; s.startup.valuation = Math.round((s.startup.valuation || 0) * 1.5); } if (p === "财务自由") add(s, "cash", 300000); if (p === "打工" && s.job) s.job._raise = (s.job._raise || 0) + 0.3; add(s, "mood", 10); return "你押上了一切，命运站在了你这边！目标的大门，被你一脚踹开。"; } add(s, "mood", -12); add(s, "stress", 12); bumpMomentum(s, -10); return "最后关头你太急了，眼看到手的又从指缝溜走。功亏一篑的滋味，钻心地疼。"; } }
  ]
});

/* —— 目标动摇（中段 18-62% 且心情低谷）—— */
EVENTS.push({
  id: "ev_goal_waver", module: "goal", ambient: true,
  cond: (s) => s.goal && _gp(s) >= 18 && _gp(s) <= 62 && !_gdone(s) && s.mood < 34,
  title: "🫥 这一切，值得吗",
  text: (s) => { const g = (typeof goalById === "function") ? goalById(s.goal) : null; return "夜深人静，你盯着天花板，问自己：为了「" + (g ? g.name : "那个目标") + "」拼成这样，到底值不值？"; },
  choices: [
    { label: "既然上路了，就走到底", effect: (s) => { add(s, "insight", 3); add(s, "mood", 4); bumpMomentum(s, 6); return "你把动摇咽了回去。认准的事，就别回头——这股劲，正是你和别人的不同。"; } },
    { label: "先松口气，别跟自己较劲", effect: (s) => { add(s, "mood", 10); add(s, "health", 4); add(s, "stress", -10); return "你给自己放了个假，不再死磕。目标会等你，先把日子过顺了再说。"; } }
  ]
});
