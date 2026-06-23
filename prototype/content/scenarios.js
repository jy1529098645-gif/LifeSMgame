"use strict";
/* =====================================================================
 * content/scenarios.js —— 情景 / 挑战模式（v1.0 精通曲线）
 * 把「挑战剧本」做成【带硬约束的特殊人生目标】，复用现成的目标选择/解锁/难度旋钮，
 * 不新增界面：在目标选择页多出几张【🔒 需解锁】的挑战卡，选中即施加约束 + 胜利条件。
 *   ① GOALS.push 挑战目标（带 locked → 跨局解锁）；
 *   ② GOAL_MODS[id] 定义 onPick（施加约束 flag / 改写开局）+ note；
 *   ③ 约束 flag（ban_invest / ban_startup / ban_side）由 core.js 行动 require 读取，真正限制可选行动；
 *   ④ UNLOCKS / ACHIEVEMENTS 注册解锁条件与达成成就。
 *
 * 经典 <script>：GOALS / GOAL_MODS / UNLOCKS / ACHIEVEMENTS 均已在前序模块定义，直接 push/挂载。
 * ===================================================================== */

// —— 挑战目标（约束体现「精通后还能再难一档」）——
GOALS.push(
  { id: "sc_rags", name: "白手起家", emoji: "🧗", path: "自己干", target: "从近乎一无所有，做到身价千万（实际购买力）",
    desc: "【挑战】开局家底被清到见底，没有任何缓冲。纯靠一双手，在这世道里翻出千万身价。",
    locked: "sc_rags",
    progress: (s) => Math.min(100, Math.round(Math.sqrt(Math.max(0, _realNW(s)) / 10000000) * 100)),
    done: (s) => _realNW(s) >= 10000000 },
  { id: "sc_clean", name: "清白致富", emoji: "🤍", path: "打工", target: "不碰投机、不沾灰色，靠正道攒到 300 万（实际购买力）",
    desc: "【挑战】禁用「投资理财」，且全程不能被割、不沾贪腐。只靠工资、副业与本事，挣出干净的 300 万。",
    locked: "sc_clean",
    progress: (s) => Math.min(100, Math.round(_realNW(s) / 3000000 * 100)),
    done: (s) => _realNW(s) >= 3000000 && !has(s, "got_scammed") && !has(s, "dirty_hands") },
  { id: "sc_ascetic", name: "一心为公", emoji: "🏛️", path: "体制", target: "不经商、不搞副业，在体制内一路爬到正处级以上",
    desc: "【挑战】禁用「搞创业」与「搞副业」，断了所有外财。只凭考核、站队与熬资历，问鼎正处级。",
    locked: "sc_ascetic",
    progress: (s) => Math.min(100, Math.round((s.civilRank || 0) / 5 * 100)),
    done: (s) => (s.civilRank || 0) >= 5 },
  { id: "sc_phoenix", name: "浴火重生", emoji: "🔥", path: "自己干", target: "从负债的谷底，重新爬回 200 万（实际购买力）",
    desc: "【挑战】开局即背债、净身出户、还落了个「破产」的污点。从最深的坑里，重新爬出来。",
    locked: "sc_phoenix",
    progress: (s) => Math.min(100, Math.round(Math.max(0, _realNW(s)) / 2000000 * 100)),
    done: (s) => _realNW(s) >= 2000000 }
);

// —— 各挑战的开局约束 / 难度旋钮（挂到 GOAL_MODS，applyGoalMods 会调 onPick）——
GOAL_MODS.sc_rags = {
  bias: ["money", "career", "startup"], biasP: 0.4, cashMul: 1,
  note: "【白手起家】家底已被清空，没有退路。每一分钱，都得自己从牙缝里抠出来。",
  onPick: (s) => { s.cash = Math.min(s.cash, 1500); s.assets = 0; flag(s, "sc_rags"); flag(s, "born_poor"); add(s, "stress", 4); }
};
GOAL_MODS.sc_clean = {
  bias: ["work", "career", "money"], biasP: 0.42, cashMul: 0.9,
  note: "【清白致富】投资理财已被封禁。这条路没有捷径，只有一步一个脚印的笨功夫。",
  onPick: (s) => { flag(s, "ban_invest"); flag(s, "sc_clean"); }
};
GOAL_MODS.sc_ascetic = {
  bias: ["civil"], biasP: 0.55, cashMul: 0.95,
  note: "【一心为公】创业与副业之路已被堵死。仕途漫漫，只能靠真本事和定力，一级一级往上熬。",
  onPick: (s) => { flag(s, "ban_startup"); flag(s, "ban_side"); flag(s, "sc_ascetic"); flag(s, "force_civil"); }
};
GOAL_MODS.sc_phoenix = {
  bias: ["money", "startup", "career"], biasP: 0.42, cashMul: 1,
  note: "【浴火重生】你从负债累累、声名扫地的谷底重新出发。跌到底了，剩下的每一步都是向上。",
  onPick: (s) => { s.cash = -50000; s.assets = 0; flag(s, "been_bankrupt"); add(s, "mood", -10); add(s, "reputation", -8); add(s, "stress", 6); flag(s, "sc_phoenix"); }
};

// —— 解锁条件（跨局养成 → 喂出挑战内容）——
UNLOCKS.push(
  { id: "sc_rags", kind: "挑战", name: "🧗 白手起家", desc: "从一无所有做到千万的硬核挑战",
    reqText: "累计轮回 ≥ 3 世", req: (M) => (M.lives || 0) >= 3 },
  { id: "sc_clean", kind: "挑战", name: "🤍 清白致富", desc: "禁投机、不沾灰，靠正道致富",
    reqText: "达成过『财务自由』，或累计轮回 ≥ 5 世", req: (M) => (M.achievements && M.achievements.freedom) || (M.lives || 0) >= 5 },
  { id: "sc_ascetic", kind: "挑战", name: "🏛️ 一心为公", desc: "断绝外财、纯体制问鼎正处",
    reqText: "解锁过『上岸』成就（考公成功）", req: (M) => M.achievements && M.achievements.shore },
  { id: "sc_phoenix", kind: "挑战", name: "🔥 浴火重生", desc: "从负债谷底重新爬起",
    reqText: "图鉴累计收集 ≥ 5 种死法", req: (M) => Object.keys((M && M.deaths) || {}).length >= 5 }
);

// —— 挑战达成成就（跨局成就墙）——
ACHIEVEMENTS.push(
  { id: "sc_rags_done", name: "赤手空拳", emoji: "🧗", desc: "完成挑战『白手起家』。", check: (L) => L.goal === "sc_rags" && L.goalDone },
  { id: "sc_clean_done", name: "两袖清风", emoji: "🤍", desc: "完成挑战『清白致富』。", check: (L) => L.goal === "sc_clean" && L.goalDone },
  { id: "sc_ascetic_done", name: "鞠躬尽瘁", emoji: "🏛️", desc: "完成挑战『一心为公』。", check: (L) => L.goal === "sc_ascetic" && L.goalDone },
  { id: "sc_phoenix_done", name: "凤凰涅槃", emoji: "🔥", desc: "完成挑战『浴火重生』。", check: (L) => L.goal === "sc_phoenix" && L.goalDone }
);
