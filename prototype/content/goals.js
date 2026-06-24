"use strict";
/* =====================================================================
 * content/goals.js —— 人生目标 + 里程碑 + 母题结算 + 风口下注（v0.9 循环升级）
 * ① 每局开局选一个【人生目标】，给整局一个被追逐的方向（仪表盘常驻进度条）。
 * ② 里程碑即时反馈（首份工作/第一套房/上岸/上市…），小步快跑的爽点。
 * ③ 目标对应 4 条互相竞争的主线（打工/体制/创业/躺平/家庭），呼应母题
 *    「打工是不可能打工的」——死时结算你印证了它，还是打了它的脸。
 * ④ ev_wind_bet：每隔几年逼你读新闻、押身家赌一把方向 → 循环级的高潮起伏。
 * ===================================================================== */
function _nw(s) { return (s.cash || 0) + (s.assets || 0) + (typeof stockValue === "function" ? stockValue(s) : 0); }
// 通胀缩放：把名义身价/薪资折算成「开局年购买力」口径，避免通胀让目标/里程碑自动达成
function _infl(s) { return (s.world && s.world.priceIndex) ? s.world.priceIndex : 1; }
function _realNW(s) { return _nw(s) / _infl(s); }
function _realSalary(s) { return (typeof jobSalary === "function" ? jobSalary(s) : 0) / _infl(s); }

const GOALS = [
  { id: "corp", name: "打工封顶", emoji: "🏆", path: "打工", target: "做到企业高管 / 月薪 10 万",
    desc: "偏要用一身本事把『工』字写出花来，打老祖宗的脸——打工也能出头。",
    progress: (s) => Math.min(100, Math.round(Math.max((s.job ? (s.job.level || 0) / 3 : 0), Math.sqrt(_realSalary(s) / 100000)) * 100)),
    done: (s) => !!(s.job && (s.job.id === "exec" || _realSalary(s) >= 100000)) },
  { id: "freedom", name: "财务自由", emoji: "💰", path: "自己干", target: "身价 ≥ 1000 万",
    desc: "挣够花不完的钱，从此不为五斗米折腰。",
    progress: (s) => Math.min(100, Math.round(Math.sqrt(Math.max(0, _realNW(s)) / 10000000) * 100)),
    done: (s) => _realNW(s) >= 10000000 },
  { id: "ipo", name: "创业封神", emoji: "🔔", path: "自己干", target: "把公司做上市",
    desc: "印证老祖宗那句话——自己当老板，才有出头日。",
    progress: (s) => (has(s, "startup_done") && !has(s, "startup_failed")) ? 100 : (s.startup && !has(s, "startup_failed") ? Math.min(95, Math.round(s.startup.valuation / 100000000 * 95)) : 0),
    done: (s) => has(s, "startup_done") && has(s, "chase_ipo") && !has(s, "startup_failed") },
  { id: "official", name: "步步高升", emoji: "🏛️", path: "体制", target: "官至正处级以上",
    desc: "宇宙的尽头是编制，编制的尽头是更高的编制。",
    progress: (s) => Math.min(100, Math.round((s.civilRank || 0) / 5 * 100)),
    done: (s) => (s.civilRank || 0) >= 5 },
  { id: "peace", name: "岁月静好", emoji: "🧘", path: "躺平", target: "活过 70 岁，且健康心情俱佳",
    desc: "不争不抢，把日子过舒坦，就是赢——这是老祖宗没说过的第三种答案。",
    progress: (s) => Math.min(100, Math.round((Math.min(100, s.age / 70 * 100) * 0.5 + (s.mood + s.health) / 2 * 0.5))),
    done: (s) => s.age >= 70 && s.mood > 60 && s.health > 50 },
  { id: "tycoon", name: "金融大鳄", emoji: "💹", path: "自己干", target: "靠炒股身价 ≥ 500 万", locked: "goal_tycoon",
    desc: "不上班不创业，纯靠一双慧眼在股海里翻云覆雨，让钱替你打工。",
    progress: (s) => Math.min(100, Math.round(Math.sqrt(Math.max(0, (typeof stockValue === "function" ? stockValue(s) : 0)) / 5000000) * 100)),
    done: (s) => (typeof stockValue === "function" ? stockValue(s) : 0) >= 5000000 },
  { id: "globe", name: "环游世界", emoji: "🌏", path: "躺平", target: "走遍 ≥ 6 座城市 / 国家", locked: "goal_globe",
    desc: "钱多钱少无所谓，趁活着把脚印留在尽可能多的地方。",
    progress: (s) => Math.min(100, Math.round((s.placesSeen || 0) / 6 * 100)),
    done: (s) => (s.placesSeen || 0) >= 6 },
  { id: "family", name: "儿孙满堂", emoji: "👨‍👩‍👧", path: "家庭", target: "成家、有娃、晚年幸福",
    desc: "事业是一时的，热腾腾的一家人才是一辈子的。",
    // 「成家」可能因晚年离婚/丧偶而失去 married 标记，但「有娃」是组过家庭的铁证；
    // 故晚年幸福只需：有娃 + 活到 60 + 心情或健康尚可（曾经成家则进度更快）。
    progress: (s) => (has(s, "married") || has(s, "has_kid") ? 34 : 0) + (has(s, "has_kid") ? 33 : 0) + (s.age >= 60 && (s.mood >= 50 || s.health >= 60) ? 33 : 0),
    done: (s) => has(s, "has_kid") && s.age >= 60 && (s.mood >= 50 || s.health >= 60) }
];
function goalById(id) { return GOALS.find(g => g.id === id); }
function goalProgress(s) { const g = goalById(s.goal); if (!g) return 0; try { return Math.max(0, Math.min(100, g.progress(s))); } catch (e) { return 0; } }
function goalDone(s) { const g = goalById(s.goal); if (!g) return false; try { return !!g.done(s); } catch (e) { return false; } }

// 死时的母题结算：你印证了「打工是不可能打工的」，还是打了它的脸？
function ancestorVerdict(s) {
  const g = goalById(s.goal); const done = goalDone(s);
  if (!done) return "老祖宗那句「打工是不可能打工的」，你这辈子既没能反驳，也没能印证——大多数人的一生，本就如此。";
  if (g && g.path === "打工") return "你用一身本事，把『工』字写出了花。老祖宗的话，被你结结实实打了脸：打工，也能出头。";
  if (g && g.path === "自己干") return "你自己当上了老板，做成了一番事业。老祖宗那句话，在你身上应验了。";
  if (g && g.path === "体制") return "你在编制里步步登高。老祖宗没料到——除了打工和创业，还有第三条出头路。";
  if (g && g.path === "学术") return "你这辈子没去争金山银山，却把名字刻进了人类知识的版图。老祖宗那句「打工是不可能打工的」，被你用另一种方式回答了——有的人，是给文明本身打工的。";
  return "你活成了老祖宗没说过的样子。出不出头，从来都是自己说了算。";
}

/* —— 里程碑：达成即即时反馈（小步快跑的爽点）—— */
const MILESTONES = [
  { id: "first_job", name: "第一份正经工作", emoji: "💼", check: (s) => has(s, "employed") },
  { id: "first_100k", name: "攒下第一个十万", emoji: "💵", check: (s) => _realNW(s) >= 100000 },
  { id: "first_car", name: "提了第一辆车", emoji: "🚗", check: (s) => has(s, "has_car") },
  { id: "first_house", name: "有了自己的房", emoji: "🏠", check: (s) => has(s, "has_house") },
  { id: "married", name: "步入婚姻殿堂", emoji: "💍", check: (s) => has(s, "married") },
  { id: "kid", name: "为人父母", emoji: "👶", check: (s) => has(s, "has_kid") },
  { id: "boss", name: "自己当老板", emoji: "🚀", check: (s) => has(s, "startup") },
  { id: "shore", name: "考公上岸", emoji: "🏛️", check: (s) => has(s, "civil_servant") },
  { id: "abroad", name: "走遍四方", emoji: "✈️", check: (s) => has(s, "traveled") },
  { id: "half_million", name: "身价五十万", emoji: "💴", check: (s) => _realNW(s) >= 500000 },
  { id: "million", name: "身价百万", emoji: "💎", check: (s) => _realNW(s) >= 1000000 },
  { id: "five_million", name: "身价五百万", emoji: "💠", check: (s) => _realNW(s) >= 5000000 },
  { id: "promote", name: "跻身官场中层", emoji: "📈", check: (s) => (s.civilRank || 0) >= 3 },
  { id: "exec", name: "坐上高管之位", emoji: "👔", check: (s) => s.job && s.job.id === "exec" },
  { id: "ten_million", name: "身价千万", emoji: "🐉", check: (s) => _realNW(s) >= 10000000 },
  { id: "ipo", name: "公司敲钟上市", emoji: "🔔", check: (s) => has(s, "startup_done") }
];
// 引擎每周/每次行动后调用：返回本次新解锁的里程碑（并给小额即时奖励）
function checkMilestones(s) {
  if (!s.milestones) s.milestones = [];
  const fresh = [];
  for (const m of MILESTONES) {
    if (s.milestones.indexOf(m.id) >= 0) continue;
    let ok = false; try { ok = m.check(s); } catch (e) { ok = false; }
    if (ok) { s.milestones.push(m.id); fresh.push(m); add(s, "mood", 3); bumpMomentum(s, 3); }
  }
  return fresh;
}

/* —— ④ 风口下注：每隔几年，逼你读新闻、押身家赌一把方向（循环级高潮）—— */
EVENTS.push({
  id: "ev_wind_bet", module: "era", ambient: true,
  cond: (s) => s.age >= 24 && s.cash > 80000 && (s._lastBet === undefined || s.year - s._lastBet >= 4),
  title: "🎲 时代的风口又起",
  text: (s) => "几年一遇的机会窗口又开了。满城都在传某个赛道要起飞——可没人敢打包票。你这些天刷的新闻，心里有数了吗？这一次，敢不敢押上身家搏一把？",
  dynamicChoices: (s) => {
    s._lastBet = s.year;
    const others = shuf(INVEST_TRACKS.filter(t => t !== s.eraWind)).slice(0, 2);
    const tracks = shuf([s.eraWind, ...others]);   // 当前真风口一定在内，读新闻者认得出
    const opts = tracks.map(tk => ({ label: `重注押「${tk}」`, next: () => betNode(tk) }));
    opts.push({ label: "这次不赌，稳一手", effect: (s) => { add(s, "insight", 2); return "你按住了蠢蠢欲动的手。错过也好，至少没被时代的浪头拍在沙滩上。"; } });
    return opts;
  },
  choices: []
});

/* =====================================================================
 * 目标 → 整体走向 + 针对性难度（v0.9.4）
 * 你「这一生图什么」不只是进度条：它会①让对应路线的事件更密集地找上你
 *（drawAmbient 按 bias 偏向抽取），②在开局施加一个与该路线呼应的难度旋钮，
 * 让每条路（打工/搞钱/创业/体制/躺平/家庭）玩起来质感与压力都不同。
 * 引擎：renderGoalPick 选定后调 applyGoalMods(s)；drawAmbient 读 goalMods(s).bias。
 * ===================================================================== */
const GOAL_MODS = {
  corp:     { bias: ["work", "career"],        biasP: 0.45, cashMul: 0.92,
              note: "【打工封顶】这条路上，职场内卷会格外针对你——升迁竞争、PUA、裁员的浪一波接一波。",
              onPick: (s) => { flag(s, "goal_grind"); add(s, "stress", 4); } },
  freedom:  { bias: ["money", "startup"],       biasP: 0.45, cashMul: 0.85,
              note: "【财务自由】搞钱的机会会主动凑上来，但通胀与风险也咬得更狠，起步的本金更紧。",
              onPick: (s) => { flag(s, "goal_money"); } },
  ipo:      { bias: ["startup", "money"],       biasP: 0.50, cashMul: 0.78,
              note: "【创业封神】创业的诱惑与劫难都会更频繁地降临，九死一生，开局家底也更薄。",
              onPick: (s) => { flag(s, "goal_founder"); add(s, "stress", 4); } },
  official: { bias: ["civil"],                  biasP: 0.50, cashMul: 0.95,
              note: "【步步高升】体制内的考验会扎堆找你——考公、考核、站队、巡视，一关比一关难。",
              onPick: (s) => { flag(s, "goal_official"); } },
  peace:    { bias: ["family", "relation", "love", "health", "absurd"], biasP: 0.42, cashMul: 1.05,
              note: "【岁月静好】镜头会更多落在关系、健康与日常小荒诞上；财富奇遇和高压事业线会明显退场。",
              onPick: (s) => { flag(s, "goal_peace"); flag(s, "lie_flat"); } },
  family:   { bias: ["love", "relation", "family"], biasP: 0.45, cashMul: 1.0,
              note: "【儿孙满堂】情感与家庭的牵绊会更密集——催婚、育儿、姻亲、聚散，处处是功课。",
              onPick: (s) => { flag(s, "goal_family"); } },

};
function goalMods(s) { return s && s.goal ? GOAL_MODS[s.goal] || null : null; }
// 选定目标后施加难度旋钮（开局本金倍率 + 主题化起手），返回给玩家看的提示文案
function applyGoalMods(s) {
  const gm = goalMods(s); if (!gm) return "";
  if (gm.cashMul && gm.cashMul !== 1) s.cash = Math.round(s.cash * gm.cashMul);
  if (gm.onPick) try { gm.onPick(s); } catch (e) { }
  return gm.note || "";
}
