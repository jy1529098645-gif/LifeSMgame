/* =====================================================================
 * 《荒诞人生模拟器》原型 —— 引擎 engine.js  (v0.3)
 * ---------------------------------------------------------------------
 * 周推进 / 行动驱动 / VN 事件 / 隐藏风口靠新闻推断 / 概率结局。
 * 设计核心：多维属性(6维+人脉+声誉+阶级)决定【叙事走向】(哪些事件出现、NPC态度、成败概率)；
 *          健康【只】进入死亡概率判定，不是用来换钱的资源。
 * ===================================================================== */
(function () {
  "use strict";
  const C = window.CONTENT;
  const { add, flag, has, pick, rnd, classTier } = C._util;

  let s = null;
  let screen = "title";   // title | cohort | create | play | event | dead
  let draft = null;       // 创建中暂存 {cohort, birthYear, stepIndex, stats, picks[], assetTier, flags[]}
  let pendingEvent = null;
  let eventNode = null;   // 当前事件节点（支持多级分支）
  let _vnTimer = null;    // VN 逐句浮现动画计时器（切场景前清掉，防泄漏）
  let mapPurpose = null, mapCountry = null;   // 全球地图：用途(relocate/travel) + 当前展开的国家
  let bpSel = null;                            // 出生地选择：{provinceId, city, county, village}
  let mgId = null, mg = null;                  // 小游戏：当前游戏 id + 对局状态 {round,wins,flashy,done,result}
  let gameHost = "play";                        // 小游戏/棋牌从哪儿打开：play=独立屏 / pc=内置在电脑游戏厅里
  let bgId = null, bgGame = null, bgBoard = null, bgOver = false, bgResult = "", bgLast = null, bgSel = null, bgTargets = [], bgKo = null, bgPasses = 0;  // 真·棋盘游戏
  let bgHistory = [], bgUndos = 0;  // ★批次5：悔棋——每局最多悔 2 次，每次悔一步（含对方应招）
  const BG_UNDO_MAX = 2;
  function bgSnapshot() { bgHistory.push({ board: bgBoard.slice(), ko: bgKo, last: bgLast ? Object.assign({}, bgLast) : null, passes: bgPasses }); if (bgHistory.length > 8) bgHistory.shift(); }
  function bgUndo() {
    if (bgOver || bgUndos >= BG_UNDO_MAX || !bgHistory.length) return;
    const h = bgHistory.pop();
    bgBoard = h.board; bgKo = h.ko; bgLast = h.last; bgPasses = h.passes;
    bgSel = null; bgTargets = []; bgUndos++;
    render();
  }
  let mktRange = 52;                            // 理财页 K 线显示窗口（周）：26/52/156/0=全部
  let mktChartType = "candle";                  // 理财页图表类型：candle=蜡烛图 / line=折线图
  // 📱 手机：把它做成一台真手机——主屏 + 多个能真用的 app（信息/通讯录/钱包/自选股/日历/相册/短视频/计算器/天气/设置）
  let phoneApp = "home";                        // 当前打开的 app：home=主屏
  let phoneCalc = { cur: "0", acc: null, op: null, fresh: true };  // 计算器状态
  let phoneReels = { n: 0, txt: "" };           // 短视频「摸鱼」状态：刷过几个
  let phoneWx = { tab: "chats", peer: null };   // 微信（绿泡泡）：当前子页 chats/moments/me + 正在聊的对象 pid
  let phoneBoss = { job: null };                // 老大直聘：当前正在沟通的岗位 id（null=岗位列表）
  let phoneSms = { open: null };                // 短信：当前打开的会话 id（null=短信列表）
  let pcBrz = { tabs: [{ site: "home" }], active: 0 };   // 电脑浏览器：标签页 + 当前页
  let pcApp = "home";                           // 电脑（笔记本/台式）当前打开的 app
  let activeDev = "phone";                       // 当前正在操作的设备：phone / pc（决定 app 内跳转改哪个状态）
  // 开局随身物品：手机人人都有；电脑等设备「勾选+少量花钱」带上，贵的从开局家底里扣
  const GEAR_ITEMS = [
    { id: "phone", icon: "📱", name: "智能手机", price: 0, locked: true, desc: "人手一台。新闻、微信、理财、钱包……口袋里的整个世界。" },
    { id: "laptop", icon: "💻", name: "笔记本电脑", price: 6000, desc: "随身带着走、随时能用。大屏交易、搞钱工作台、数据看板、上网课——比手机顺手得多。" },
    { id: "desktop", icon: "🖥️", name: "台式电脑", price: 8000, desc: "性能最强、用着最爽，但只能在家（定居城市）用。炒股、搞钱、学习，效率拉满。" },
    { id: "headphone", icon: "🎧", name: "降噪耳机", price: 1500, desc: "戴上世界清净了。电脑上「学习」「搞钱」效率额外 +15%。" },
    { id: "book", icon: "📚", name: "《财经入门》", price: 800, desc: "随身啃两页。开局见识 +2，看 K 线时多一分直觉。" }
  ];
  function gearById(id) { return GEAR_ITEMS.find(g => g.id === id); }
  function hasGear(id) { return s && s.gear && s.gear.indexOf(id) >= 0; }
  function hasComputer() { return hasGear("laptop") || hasGear("desktop"); }
  // 台式只能在家(未出门)用；笔记本随时随地。返回当前能用的机型，否则 null
  function activeComputerKind() {
    const home = !s.away;
    if (hasGear("desktop") && home) return "desktop";   // 在家优先用最强的台式
    if (hasGear("laptop")) return "laptop";              // 笔记本随身
    return null;                                          // 只有台式却出门在外 → 用不了
  }
  // 难度档：影响开局家底、生活成本、死亡率（收入侧靠生活成本反向体现）
  const DIFFS = {
    "休闲": { cashMul: 2.0, costMul: 0.65, deathMul: 0.7, emoji: "🛋️", label: "家底厚、花销省、命更硬——专心看剧情" },
    "标准": { cashMul: 1.0, costMul: 1.0, deathMul: 1.0, emoji: "⚖️", label: "原汁原味的平衡体验" },
    "硬核": { cashMul: 0.55, costMul: 1.35, deathMul: 1.35, emoji: "🔥", label: "白手起家、花销高、阎王催得紧——老手的挑战" }
  };
  // 新手保护「家里兜底」：开局现金少（见 assetTierCash），但保护期内一旦断炊，
  // 父母会按月打来生活费托住你——这就是「前半年没钱家里会打过来」。
  // 兜多久(weeks)/给多宽(factor) 由出身决定，贴合中国家庭「供到毕业、啃老有度」的现实；
  // 打钱额度按当月实际账单 total 计，自动随年代/通胀缩放（符合年份水平）。
  // ★所有兜底一律 ≤ 半年(26 周)★。越普通的工薪家庭兜得越足(满半年)；
  // 越殷实越讲「分寸」，而暴发户/金汤匙家底虽厚，却早早要孩子独立(见独立剧情)。
  const FAMILY_NET = {
    poor:   { weeks: 18, factor: 1.0 },   // 寒门：父母东拼西凑，能兜小半年
    worker: { weeks: 26, factor: 1.2 },   // 工薪：最典型的「供到上岸」，满半年(封顶)
    upper:  { weeks: 22, factor: 1.5 },   // 殷实家境：给得宽裕，但也讲分寸
    rich:   { weeks: 13, factor: 1.8 }    // 暴发户：家底厚，却早早要你独立(约 3 个月)
  };
  function familyNetFor(assetTier, st, difficulty) {
    const base = FAMILY_NET[assetTier] || FAMILY_NET.worker;
    let weeks = base.weeks, factor = base.factor;
    // 「讲独立」的富裕背景：给得阔绰却只兜一阵，期满父母正式「断奶」(独立剧情)
    const independent = has(st, "silver_spoon") || has(st, "nouveau_riche") || assetTier === "rich";
    if (has(st, "silver_spoon")) { weeks = 13; factor = 2.0; }               // 金汤匙：出手阔绰，但只兜约 3 个月
    else if (has(st, "born_poor")) { weeks = 10; factor = 0.9; }             // 苦命人：家里几乎指望不上
    if (has(st, "fallen")) weeks = Math.round(weeks * 0.7);                  // 家道中落：兜底也短了
    const dm = difficulty === "休闲" ? 1.25 : difficulty === "硬核" ? 0.5 : 1; // 硬核老手早早断奶
    weeks = Math.round(weeks * dm);
    weeks = Math.max(0, Math.min(26, weeks));                               // 封顶半年：任何出身/难度都不超过 26 周
    return { until: weeks, factor: factor, weeks: weeks, independent: independent };
  }
  let gameDiff = "标准";                        // 当前选定难度（标题页可改）
  const _cl = (v) => Math.max(0, Math.min(100, v));
  // 创业「全职经营」模式的周行动表（产品/用户/团队/融资/降本/顾自己）
  const VENTURE_ACTIONS = [
    { id: "vproduct", name: "打磨产品 · 写代码", emoji: "💻", hours: 18, hint: "🛠️产品++ 😣压力+", desc: "迭代功能、修 bug、抠体验。产品是 1，其它都是后面的 0。",
      run: (su, s) => { su.product = _cl(su.product + 4 + s.stats.knowledge / 40); add(s, "stress", 4); add(s, "health", -1); add(s, "knowledge", 1); return "你和团队闷头死磕了一周需求和 bug，产品又顺手了一截。"; } },
    { id: "vgrowth", name: "跑市场 · 拉新获客", emoji: "📣", hours: 16, hint: "👥用户++ 📢口碑+ 💸投放", desc: "地推、投放、找渠道、蹭热点。没用户，再好的产品也是孤芳自赏。",
      run: (su, s) => { const spend = Math.round(3000 + Math.random() * 6000); add(s, "cash", -spend); su.users = _cl(su.users + 4 + s.stats.charm / 30); su.buzz = _cl(su.buzz + 2); su.runway = Math.max(0, su.runway - 0.5); return `你砸了 ¥${spend.toLocaleString()} 做投放和地推，用户曲线往上拐了一下。`; } },
    { id: "vteam", name: "招人 · 团队建设", emoji: "🧑‍💼", hours: 12, hint: "🤝团队++ 💸发薪", desc: "招大牛、稳军心、画饼也得画得真心。团队散了，公司就散了。",
      run: (su, s) => { su.team = _cl(su.team + 5); add(s, "network", 1); su.runway = Math.max(0, su.runway - 0.5); return "你面了几个候选人、和核心成员促膝长谈。队伍的心气，被你一点点拢住。"; } },
    { id: "vfund", name: "见投资人 · 融资", emoji: "🤝", hours: 14, hint: "💰拿钱续命 估值↑但稀释", desc: "做 BP、跑路演、和 VC 斗智斗勇。融到钱续命，融不到只能勒紧裤腰带。",
      run: (su, s) => { add(s, "stress", 5); const stages = ["种子", "天使轮", "A轮", "B轮", "Pre-IPO"]; const score = su.product * 0.3 + su.users * 0.5 + su.buzz * 0.4 + s.stats.charm * 0.6 + (su.track === s.eraWind ? 30 : 0); if (rnd(Math.min(0.85, 0.2 + score / 300))) { const idx = Math.min(stages.length - 1, stages.indexOf(su.stage) + 1); su.stage = stages[idx]; su.runway += 30 + idx * 8; su.buzz = _cl(su.buzz + 8); return `路演打动了投资人！${su.stage}融资到账，账上一下子宽裕了，跑道续上 30+ 周——代价是又稀释了一些股份。`; } add(s, "mood", -4); return "你跑断了腿、讲到口干，投资人却一个个『再看看』。这年头的钱，越来越难拿了。"; } },
    { id: "vcut", name: "降本增效 · 过冬", emoji: "✂️", hours: 8, hint: "🛣️跑道+ 🤝团队-", desc: "砍开支、关业务线、能省则省。寒冬里，活下去比什么都重要。",
      run: (su, s) => { su.runway += 6; su.team = _cl(su.team - 3); return "你砍掉几项烧钱的业务、搬去更便宜的办公室。团队有点人心惶惶，但跑道续上了。"; } },
    { id: "vself", name: "喘口气 · 顾自己", emoji: "🛋️", hours: 8, hint: "❤️健康+ 😣压力-", desc: "创始人也是人。给自己放半天假，别把命搭进去。",
      run: (su, s) => { add(s, "health", 4); add(s, "stress", -10); add(s, "mood", 3); return "你难得关掉电脑睡了个好觉。公司垮了还能再来，人垮了就什么都没了。"; } }
  ];
  let weekLog = [];       // 本周行动产生的日志

  /* ---------- 阶段 ---------- */
  function stageOf(age) { for (const st of C.lifeStages) if (age >= st.min && age <= st.max) return st; return C.lifeStages[C.lifeStages.length - 1]; }

  /* ---------- 创建：骑砍式成长经历，净零重分配 + 归一保证总属性恒等 ---------- */
  function startDraft(cohort) {
    const stats = {}; C.STAT_KEYS.forEach(k => stats[k] = C.BASE_STAT);
    draft = { cohort, birthYear: cohort.year, gender: "男", orientation: "异", playerName: "", stepIndex: 0, stats, picks: [], assetTier: "worker", flags: [], difficulty: gameDiff, startMode: "campus" };
  }
  function defaultPlayerName(gender) {
    const a = gender === "女" ? ["林小满", "许知夏", "周南乔", "陈念念"] : ["林一舟", "许星河", "周嘉树", "陈远山"];
    return pick(a);
  }
  function cohortForBirthYear(y) {
    let best = C.cohorts[0], dist = 9999;
    C.cohorts.forEach(c => { const d = Math.abs((c.year || y) - y); if (d < dist) { dist = d; best = c; } });
    return best;
  }
  function defaultCohort() {
    return (C.cohorts || []).find(c => c && c.id === "00") || (C.cohorts || [])[0];
  }
  function startLegacyChildDraft(child) {
    const M = C._util.loadMeta ? C._util.loadMeta() : {};
    const lg = M.legacy || {};
    const by = child.birthYear || ((lg.fromBirthYear || 1980) + 28);
    const cohort = cohortForBirthYear(by);
    const stats = {}; C.STAT_KEYS.forEach(k => stats[k] = C.BASE_STAT);
    const edu = child.education || 0;
    stats.knowledge += Math.min(12, edu * 2);
    stats.mind += child.trait === "supported" ? 6 : child.trait === "arranged" ? -3 : 3;
    stats.strategy += child.trait === "independent" ? 6 : lg.trait === "founder" ? 4 : 0;
    stats.insight += lg.trait === "fallen" ? 4 : 0;
    draft = {
      cohort, birthYear: by, gender: child.gender || "男", orientation: "异", playerName: child.name || "",
      stepIndex: C.creationSteps.length - 1, stats, picks: ["上一代的孩子", child.note || "在上一代人生的阴影和余温里成年"],
      assetTier: (lg.cash || 0) > 150000 ? "upper" : (lg.cash || 0) > 20000 ? "worker" : "poor",
      flags: ["lineage_second_life", "lineage_child_" + (child.trait || "ordinary")],
      difficulty: gameDiff, birthplace: lg.birthplace || null, legacyChild: child
    };
  }
  // 选项实际生效的属性变化：捏人改为「加点制」——多数选项【只加不减】(忽略负值)；
  // 只有少数标了 tradeoff:true 的「取舍/冒险」选项，才保留减项，构成真正的代价。
  const TRADEOFF_BONUS = 6;   // 取舍项的风险溢价：补偿减项之外，再额外多给的净加点
  function optDeltas(opt) {
    const rl = (opt && opt.realloc) || {}; const out = {};
    if (opt && opt.tradeoff) {
      // 取舍项：减项是真实代价，保留；但正向加点要放大到「净收益高于普通项」作为冒险奖励——
      // 把减项的绝对值全额补偿回正项，再额外加一份风险溢价(TRADEOFF_BONUS)，按正项比例分配。
      let pos = 0, neg = 0;
      for (const k in rl) { if (rl[k] > 0) pos += rl[k]; else neg -= rl[k]; }
      const lift = neg + TRADEOFF_BONUS;
      for (const k in rl) { out[k] = rl[k] > 0 ? rl[k] + (pos > 0 ? Math.round(lift * rl[k] / pos) : 0) : rl[k]; }
    } else {
      for (const k in rl) { if (rl[k] > 0) out[k] = rl[k]; }
    }
    return out;
  }
  function applyOption(opt) {
    const step = C.creationSteps[draft.stepIndex];
    const d = optDeltas(opt);
    for (const k in d) draft.stats[k] = (draft.stats[k] || 0) + d[k];
    // 越选越强：每一步都给全维度一点基础成长，让 4 步后总和≈170-185(配合 BASE_STAT=22)，
    // 与游戏其余按 ~30-35 基准的数值校准(statEdge/岗位门槛/薪资)对齐——否则角色腰斩、处处吃瘪、慢慢穷死。
    // 取舍项同样吃这份普涨（其代价已体现在 realloc 的减项里），避免「选了取舍反而总属性更低」。
    const grow = 1;
    C.STAT_KEYS.forEach(k => draft.stats[k] = (draft.stats[k] || 0) + grow);
    if (opt.assetTier) draft.assetTier = opt.assetTier;
    if (opt.flags) draft.flags.push(...opt.flags);
    if (step && step.id && opt.id) draft.flags.push("bg_" + step.id + "_" + opt.id);
    draft.picks.push(opt.name);
  }
  function normalizeStats(stats) {
    // 只钳制到 [5,95]，不再强行把总和拉回固定值——捏人是「越选越强」的加点制，总和随选择增长。
    C.STAT_KEYS.forEach(k => stats[k] = Math.max(5, Math.min(95, Math.round(stats[k]))));
    return stats;
  }
  function birthGeo() {
    const bp = (draft && draft.birthplace) || {};
    const origin = bp.origin || {};
    return {
      provinceId: bp.provinceId || "",
      provinceName: bp.provinceName || "",
      cityName: bp.cityName || "",
      countyName: bp.countyName || "",
      villageName: bp.villageName || "",
      region: bp.region || "",
      econ: bp.econ || "",
      tags: origin.tags || [],
      note: origin.note || ""
    };
  }
  function hasAnyGeo(g, words) {
    const hay = [g.provinceId, g.provinceName, g.cityName, g.countyName, g.villageName, g.region, g.econ].concat(g.tags || []).join(" ");
    return words.some(w => hay.indexOf(w) >= 0);
  }
  function geoIsCoastal(g) {
    const coastalIds = ["tianjin", "liaoning", "hebei", "shandong", "jiangsu", "shanghai", "zhejiang", "fujian", "guangdong", "guangxi", "hainan", "hongkong", "macau", "taiwan"];
    if (hasAnyGeo(g, ["海港", "码头", "渔村", "渔港", "海滨", "海岛", "港城", "盐场", "滩涂", "商埠", "侨乡", "洋楼"])) return true;
    if (hasAnyGeo(g, ["山村", "旱塬", "黄土", "煤城", "矿区", "油田", "汽车", "重工", "黑土", "牧区", "古都", "古城", "江河源", "灌区", "县城", "高原", "戈壁"])) return false;
    return coastalIds.indexOf(g.provinceId) >= 0;
  }
  function geoIsInland(g) {
    if (hasAnyGeo(g, ["山村", "旱塬", "黄土", "煤城", "矿区", "油田", "汽车", "重工", "黑土", "牧区", "古都", "古城", "江河源", "灌区", "县城", "高原", "戈壁"])) return true;
    if (geoIsCoastal(g)) return false;
    return hasAnyGeo(g, ["中原", "华北", "关东", "塞北", "西北", "西域", "高原", "陇右", "三线", "欠发达"]);
  }
  function regionalCreationOptions(step) {
    const g = birthGeo();
    const localName = g.cityName || g.countyName || g.provinceName || "本地";
    const ruralName = g.villageName || g.countyName || "老家";
    const defs = {
      childhood: [
        { id: "region_core_city", name: "大城夹缝", desc: `${localName}的写字楼很亮，你家的窗户很小。你从小就知道，体面和窘迫只隔一条马路。`, realloc: { insight: 9, strategy: 6, charm: 3, body: -6, mind: -6, knowledge: -6 }, flags: ["regional_core_city"], match: ["一线", "核心", "权贵", "新贵"] },
        { id: "region_hard_village", name: "山塬留守", desc: `${ruralName}的路不好走，水也不总够用。大人外出谋生，你很早就学会自己扛事。`, realloc: { body: 9, mind: 6, strategy: 3, knowledge: -9, charm: -6, insight: -3 }, flags: ["regional_hard_village"], match: ["寒门", "山村", "旱塬", "缺水", "断水", "高寒", "边陲", "苦瘠"] },
        { id: "region_port_child", name: "码头口岸孩子", desc: `${localName}的货车、船哨和外地口音混在一起。你小时候就知道，东西换个地方能卖出另一个价。`, realloc: { strategy: 9, charm: 6, insight: 3, knowledge: -6, mind: -6, body: -6 }, flags: ["regional_port_child"], match: ["海港", "码头", "口岸", "边贸", "丝路", "巴扎"] },
        { id: "region_coast_typhoon_shop", name: "台风天的小店", desc: `你家在${localName}守着一间临街小店。台风来前抢胶带、搬货、囤水，台风走后第一时间开门做生意。`, realloc: { strategy: 9, mind: 6, body: 3, knowledge: -6, charm: -6, insight: -6 }, flags: ["regional_coast_typhoon_shop"], pred: geoIsCoastal },
        { id: "region_coast_export_uncle", name: "外贸亲戚", desc: `家里总有亲戚在港口、货代、工厂或外贸公司跑单。饭桌上聊的是汇率、尾款、柜子和客户临时改需求。`, realloc: { strategy: 9, charm: 6, knowledge: 3, body: -6, mind: -6, insight: -6 }, flags: ["regional_coast_export_uncle"], pred: geoIsCoastal },
        { id: "region_coast_fishmarket", name: "渔港早市", desc: `${ruralName}天不亮就有鱼腥味和摩托声。你跟着大人看秤、讲价、抢摊位，很早知道现金流比面子实在。`, realloc: { body: 6, strategy: 9, charm: 3, knowledge: -6, mind: -6, insight: -6 }, flags: ["regional_coast_fishmarket"], pred: geoIsCoastal },
        { id: "region_inland_transfer_station", name: "内陆转运站", desc: `${localName}不靠海，但车站、货场、县道把四面八方的人和货拧在一起。你从小看懂了谁在中间赚差价。`, realloc: { strategy: 9, insight: 6, body: 3, knowledge: -6, charm: -6, mind: -6 }, flags: ["regional_inland_transfer_station"], pred: geoIsInland },
        { id: "region_inland_harvest_home", name: "农忙假期", desc: `暑假不是补课，是收麦、掰玉米、晒枸杞、搬葡萄筐。你知道一年的收入，有时就压在几天晴天里。`, realloc: { body: 12, mind: 3, insight: 3, knowledge: -9, charm: -6, strategy: -3 }, flags: ["regional_inland_harvest_home"], pred: geoIsInland },
        { id: "region_inland_resource_yard", name: "矿厂边长大", desc: `你家的窗台常年落灰，远处是矿车、井架、烟囱或厂房。资源能养活一城人，也能把一城人的退路绑住。`, realloc: { body: 9, strategy: 6, mind: 3, knowledge: -6, charm: -6, insight: -6 }, flags: ["regional_inland_resource_yard"], match: ["煤城", "矿区", "油田", "重工", "钢城", "汽车", "稀土"] },
        { id: "region_factory_child", name: "厂矿子弟", desc: `你在汽笛、班车和家属院里长大。谁家下岗、谁家分房，都是饭桌上的大事。`, realloc: { body: 9, mind: 3, insight: 3, knowledge: -6, charm: -6, strategy: -3 }, flags: ["regional_factory_child"], match: ["重工", "煤城", "矿区", "油田", "汽车", "钢城", "老工业"] },
        { id: "region_oldtown_child", name: "古城老街", desc: `${localName}的城墙、寺庙、老宅和传说太多，你从小听故事长大，也学会了看人看事的来龙去脉。`, realloc: { insight: 9, knowledge: 6, mind: 3, body: -6, strategy: -6, charm: -6 }, flags: ["regional_oldtown_child"], match: ["古都", "古城", "寺庙", "帝陵", "石窟", "壁画", "晋商"] },
        { id: "region_tour_child", name: "景区院落", desc: `游客一到旺季就挤满街巷。你见过太多人把故乡当滤镜，也学会了怎样把故事讲得值钱。`, realloc: { charm: 9, insight: 6, strategy: 3, knowledge: -6, mind: -6, body: -6 }, flags: ["regional_tour_child"], match: ["旅游", "古城", "雪山大湖", "热带", "扎染", "葡萄酒"] }
      ],
      teen: [
        { id: "region_keyschool", name: "重点校卷王", desc: `${localName}的好学校像筛子，筛掉睡眠、爱好和闲聊。你在排名表上认识自己。`, realloc: { knowledge: 12, mind: 6, body: -6, charm: -6, strategy: -6 }, flags: ["regional_keyschool"], match: ["一线", "核心", "富庶", "省会", "通衢"] },
        { id: "region_county_boarding", name: "县中寄宿", desc: `宿舍灯熄了，走廊还有人在背书。你知道县城孩子想出去，只能把青春押在一张卷子上。`, realloc: { knowledge: 9, mind: 6, strategy: 3, body: -6, charm: -6, insight: -6 }, flags: ["regional_county_boarding"], match: ["县城", "三线", "寒门", "欠发达", "旱塬", "山村"] },
        { id: "region_local_sport", name: "地方绝活", desc: `别人上兴趣班，你练的是骑马、滑冰、下水、跑山或扛货。文化课一般，但身体先长成了。`, realloc: { body: 12, insight: 6, knowledge: -9, mind: -6, charm: -3 }, flags: ["regional_local_sport"], match: ["牧区", "草原", "冰雪", "海港", "高原", "渔村", "赛马"] },
        { id: "region_coast_trade_english", name: "外贸英语班", desc: `你被送去学英语，不是为了诗和远方，是为了将来能回客户邮件、接展会电话、听懂老外砍价。`, realloc: { knowledge: 9, charm: 6, strategy: 3, body: -6, mind: -6, insight: -6 }, flags: ["regional_coast_trade_english"], pred: geoIsCoastal },
        { id: "region_coast_workshop_teen", name: "暑假进厂看单", desc: `暑假你在亲戚的加工厂帮忙贴标签、点库存、赶货期。机器一开，订单、工价和加班费都变得具体。`, realloc: { strategy: 9, body: 6, mind: 3, knowledge: -6, charm: -6, insight: -6 }, flags: ["regional_coast_workshop_teen"], pred: geoIsCoastal },
        { id: "region_coast_ferry_school", name: "渡船上学", desc: `你每天看潮水和班船脸色。迟到不是因为赖床，而是风浪太大、码头停航。你很早就学会给人生留备选路线。`, realloc: { mind: 9, body: 6, insight: 3, knowledge: -6, charm: -6, strategy: -6 }, flags: ["regional_coast_ferry_school"], pred: geoIsCoastal },
        { id: "region_inland_province_exam", name: "省会借读", desc: `家里咬牙把你送到省会借读，租房、转学、饭卡都贵。你知道这不是享福，是全家把筹码压到你身上。`, realloc: { knowledge: 12, mind: 6, charm: -6, body: -6, strategy: -6 }, flags: ["regional_inland_province_exam"], pred: geoIsInland },
        { id: "region_inland_fair_skill", name: "庙会练摊", desc: `逢集、庙会、县城大集，你帮家里卖吃食、农货或小百货。你不一定成绩最好，但很会看人下菜碟。`, realloc: { charm: 9, strategy: 9, knowledge: -9, mind: -6, body: -3 }, flags: ["regional_inland_fair_skill"], pred: geoIsInland },
        { id: "region_inland_commute_school", name: "通村车求学", desc: `去学校要等通村车，雨雪一来路就断。你背着书包走过泥路，也走过很多“差一点就放弃”的早晨。`, realloc: { mind: 9, body: 6, knowledge: 3, charm: -6, strategy: -6, insight: -6 }, flags: ["regional_inland_commute_school"], pred: geoIsInland },
        { id: "region_market_teen", name: "市场里学外语", desc: `你在巴扎、口岸或批发市场里混熟了几句外语和行话，知道笑脸也能当本钱。`, realloc: { strategy: 9, charm: 6, insight: 6, knowledge: -6, mind: -6, body: -9 }, flags: ["regional_market_teen"], match: ["口岸", "边贸", "巴扎", "丝路", "码头", "商埠"] },
        { id: "region_vocational", name: "技校实训", desc: `普通高中不是唯一出路。你摸过机床、焊枪、汽修台，早早知道手艺也能吃饭。`, realloc: { body: 6, knowledge: 6, strategy: 6, charm: -6, insight: -3, mind: -9 }, flags: ["regional_vocational"], match: ["重工", "汽车", "矿区", "钢城", "老工业", "机床"] }
      ],
      youth: [
        { id: "region_cafe_startup", name: "咖啡馆创业沙龙", desc: `${localName}的咖啡馆里人人都在聊融资、风口和 BP。你还没成年，已经听会了几句黑话。`, realloc: { strategy: 9, charm: 6, insight: 3, knowledge: -6, mind: -6, body: -6 }, flags: ["regional_cafe_startup"], match: ["一线", "新贵", "核心", "富庶", "孵化器"] },
        { id: "region_early_migrant", name: "早早外出打工", desc: `同龄人还在纠结社团，你已经背着包去了远方。车站那晚，你第一次觉得自己真的离开了家。`, realloc: { strategy: 9, body: 6, mind: 3, knowledge: -9, charm: -6, insight: -3 }, flags: ["regional_early_migrant"], match: ["寒门", "山村", "旱塬", "缺水", "欠发达", "空心村"] },
        { id: "region_tour_hustle", name: "导游民宿摊", desc: `旺季一来，你帮人带路、拍照、卖特产，也见识了游客的钱包和脾气。`, realloc: { charm: 9, insight: 6, strategy: 3, knowledge: -6, mind: -6, body: -6 }, flags: ["regional_tour_hustle"], match: ["旅游", "古城", "古都", "雪山大湖", "扎染", "石窟"] },
        { id: "region_coast_crossborder_first", name: "跨境电商第一单", desc: `你用蹩脚英语上架小商品，第一单利润不多，却让你突然明白：故乡的工厂和世界之间，只差一张网页。`, realloc: { strategy: 12, knowledge: 3, charm: 3, body: -6, mind: -6, insight: -6 }, flags: ["regional_coast_crossborder_first", "startup_seed_trade"], pred: geoIsCoastal },
        { id: "region_coast_factory_lead", name: "进厂当小组长", desc: `你没有立刻读远方的诗，而是进了沿海工厂。流水线很累，但你学会了排班、控损耗、和老板谈加班费。`, realloc: { strategy: 9, body: 9, mind: 3, knowledge: -9, charm: -6, insight: -6 }, flags: ["regional_coast_factory_lead"], pred: geoIsCoastal },
        { id: "region_coast_bay_party", name: "湾区饭局", desc: `你跟着亲戚去过几次商务饭局：货代、主播、厂二代、投资人坐一桌，话题从清关跳到短视频。你听得头晕，也听见了机会。`, realloc: { charm: 9, strategy: 9, insight: 3, knowledge: -6, mind: -6, body: -9 }, flags: ["regional_coast_bay_party"], pred: geoIsCoastal },
        { id: "region_inland_province_hustle", name: "省城第一份工", desc: `你从县里挤进省城，住隔断间，跑招聘会，白天上班晚上摆摊。城市不温柔，但它至少给人一点缝隙。`, realloc: { strategy: 9, body: 6, mind: 6, knowledge: -9, charm: -6, insight: -6 }, flags: ["regional_inland_province_hustle"], pred: geoIsInland },
        { id: "region_inland_agri_live", name: "把土货卖出去", desc: `你盯上了家乡的苹果、枸杞、茶叶、菌子或牛羊肉。别人嫌土，你觉得这也许是第一门真正属于你的生意。`, realloc: { strategy: 12, charm: 3, insight: 3, knowledge: -6, mind: -6, body: -6 }, flags: ["regional_inland_agri_live", "startup_seed_agri"], pred: geoIsInland },
        { id: "region_inland_resource_window", name: "资源窗口期", desc: `煤、油、矿、风电、文旅或算力园区突然成了本地热词。你看见一波人围着政策和资源转，心里也开始盘算入口。`, realloc: { insight: 9, strategy: 9, mind: 3, charm: -6, body: -6, knowledge: -6 }, flags: ["regional_inland_resource_window"], pred: geoIsInland },
        { id: "region_crossborder_hustle", name: "跨境倒货", desc: `你跟着熟人跑过口岸和批发市场，知道一箱货从这头到那头，价格能翻出荒诞的花。`, realloc: { strategy: 12, charm: 3, insight: 3, knowledge: -6, mind: -6, body: -6 }, flags: ["regional_crossborder_hustle"], match: ["口岸", "边贸", "丝路", "巴扎", "瓜果", "商埠"] },
        { id: "region_mountain_vow", name: "转山与寺院义工", desc: `高处的风把人吹得很安静。你在转山、寺院或长路上想过很多事，也暂时没那么想赢。`, realloc: { mind: 9, insight: 9, strategy: -6, charm: -3, body: -3, knowledge: -6 }, flags: ["regional_mountain_vow"], match: ["高原", "雪域", "寺庙", "虔诚", "经幡", "荒原"] }
      ],
      adult: [
        { id: "region_coast_trade_family", name: "沿海外贸家庭", desc: `家里不算豪门，但有人做过货代、工厂、档口或跨境小生意。你成年时拿到的不只是钱，还有一串真假难辨的客户名片。`, assetTier: "upper", realloc: { strategy: 9, charm: 6, knowledge: -6, mind: -6 }, flags: ["regional_coast_trade_family", "startup_seed_trade"], pred: geoIsCoastal },
        { id: "region_coast_factory_debt", name: "订单砸手里", desc: `家里曾接过一笔大单，结果尾款拖欠、库存压仓。你成年时背着一点债，也背着对生意风险的早熟。`, assetTier: "worker", realloc: { strategy: 9, mind: 6, charm: -6, body: -6 }, flags: ["regional_coast_factory_debt", "fallen"], pred: geoIsCoastal },
        { id: "region_coast_returnee_path", name: "侨乡闯荡路", desc: `亲戚朋友散在各地经商办厂，家里咬牙也要给你铺一条出去闯的路。饭桌上常说：出去看看，别只守着这一片海。`, assetTier: "upper", realloc: { knowledge: 6, charm: 6, strategy: -6, body: -6 }, flags: ["regional_coast_returnee_path"], match: ["侨乡", "海港", "商埠", "富庶"] },
        { id: "region_inland_county_bet", name: "全家供你进城", desc: `成年那年，家里把积蓄、亲戚借款和期待都塞进你的行李箱。你不是一个人进城，是带着一整个家的赌注。`, assetTier: "poor", realloc: { mind: 9, knowledge: 6, charm: -6, body: -6 }, flags: ["regional_inland_county_bet"], pred: geoIsInland },
        { id: "region_inland_relocation_comp", name: "搬迁补偿款", desc: `老村搬迁、棚改或采空区安置，让家里突然多了一笔钱。它不够让你躺平，却足够让你第一次敢想创业。`, assetTier: "upper", realloc: { strategy: 6, mind: 6, insight: -6, knowledge: -6 }, flags: ["nouveau_riche", "regional_inland_relocation_comp"], pred: geoIsInland },
        { id: "region_inland_old_unit", name: "老单位余荫", desc: `父母在厂矿、林场、油田或事业单位耗了半辈子。资源不大，但熟人多、规矩多，你成年时已经懂得求人办事的重量。`, assetTier: "worker", realloc: { insight: 9, strategy: 6, charm: 3, knowledge: -6, body: -6, mind: -6 }, flags: ["regional_inland_old_unit"], pred: geoIsInland }
      ]
    };
    const base = step.options || [];
    // 本省专属选项（content/creation-regional.js）——每个省独一份，排在最前
    const provDefs = (typeof window !== "undefined" && window.REGION_CREATION && window.REGION_CREATION[g.provinceId]) || {};
    const provExtra = (provDefs[step.id] || []).map(o => Object.assign({ regional: true }, o));
    // 通用池：一旦有本省专属项，就不再叠「沿海/内陆」一刀切项（各地雷同的根源）；只留按地标/经济(match)命中的“同类共有”项
    let pool = defs[step.id] || [];
    if (provExtra.length) pool = pool.filter(o => !o.pred);
    const tagExtra = pool.filter(o => o.pred ? o.pred(g) : hasAnyGeo(g, o.match || [])).map(o => Object.assign({ regional: true }, o));
    const seen = {};
    const maxExtra = step.id === "childhood" ? 6 : step.id === "adult" ? 4 : 5;
    const merged = provExtra.concat(tagExtra).filter(o => {
      if (seen[o.id]) return false;
      seen[o.id] = true;
      return true;
    }).slice(0, maxExtra);
    return base.concat(merged);
  }
  function creationOptions(step) {
    if (!draft || !draft.birthplace) return step.options || [];
    return regionalCreationOptions(step);
  }

  /* ---------- 每周「按天排程」+ 每日天气 ---------- */
  const DAY_CAP = 16;                                   // 每天物理上限 16h（含挤占吃饭/休息）
  const DAY_SOFT = 12;                                  // 每天「正常」可安排上限；12~16h 是吃饭/休息区，只有硬撑模式才填得进（进度条变红）
  const WEEKDAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  function _fallbackWx() { return pick([{ id: "clear", name: "晴", emoji: "☀️", effect: { mood: 1 } }, { id: "cloudy", name: "多云", emoji: "⛅", effect: {} }, { id: "rain", name: "小雨", emoji: "🌧️", effect: { mood: -1 } }]); }
  // 生成下一周的天气与空排程（每天一个天气；总精力仍受本阶段 weeklyHours 限制）
  function rollWeekPlan(st) {
    const gen = C._util.genDayWeather;
    st.weekPlan = { cap: DAY_CAP, used: [0, 0, 0, 0, 0, 0, 0], days: WEEKDAY_NAMES.map(n => ({ name: n, wx: (gen ? gen(st) : _fallbackWx()), acts: [] })) };
    st.weekWx = st.weekPlan.days.map(d => d.wx ? d.wx.id : "clear");
  }
  // 把一个行动按小时自动填入各天：当天填不下就顺延到下一天（每天上限 16h）
  function placeAction(a) {
    if (!s.weekPlan) rollWeekPlan(s);
    let need = a.hours; const wp = s.weekPlan;
    // 正常只填到每天软上限(12h)，留出吃饭/休息区；开了硬撑才允许塞进 12~16h 那段
    const dayCap = s._overtimeMode ? wp.cap : DAY_SOFT;
    for (let d = 0; d < 7 && need > 0; d++) { const free = dayCap - wp.used[d]; if (free <= 0) continue; const put = Math.min(free, need); wp.used[d] += put; need -= put; wp.days[d].acts.push({ emoji: a.emoji, h: put }); }
  }
  // —— 行动结算：扣时间 + 排进日历 + 标记本周已做（真正「做了」才调用）——
  function commitAction(a) {
    s.hours -= a.hours;                       // hours 退为次级成本（体力/过劳），不再决定能否结束本周
    if (C._util.spendSlots) C._util.spendSlots(s, a);   // ★行动格：真正的周回合currency（doc §2）
    placeAction(a);
    s._actCount = s._actCount || {}; s._actCount[a.id] = (s._actCount[a.id] || 0) + 1;   // 本周做了几次（可多次行动用）
    if (!a.repeatWeek) { s._weekActs = s._weekActs || {}; s._weekActs[a.id] = true; }     // 可多次的不上「本周已做」锁
  }
  // 打开「可取消子界面」(地图/找乐子)的行动：先挂起，等真正在子界面落地了再结算，半途退出不计时间
  function deferAction(a) { s._pendingAct = { id: a.id, hours: a.hours, emoji: a.emoji }; }
  function commitPendingAct() { const pa = s._pendingAct; if (!pa) return false; s._pendingAct = null; commitAction(pa); return true; }
  function clearPendingAct() { s._pendingAct = null; }
  // 结算本周天气对身心的累积影响（温和封顶 ±6）
  function applyWeekWeather(st) {
    if (!st.weekPlan) return;
    let m = 0, h = 0, sx = 0;
    for (const d of st.weekPlan.days) { const e = d.wx && d.wx.effect; if (e) { m += e.mood || 0; h += e.health || 0; sx += e.stress || 0; } }
    const cap = v => Math.max(-6, Math.min(6, Math.round(v)));
    const ch = cap(h), cm = cap(m), cs = cap(sx);
    if (cm) add(st, "mood", cm); if (ch) add(st, "health", ch); if (cs) add(st, "stress", cs);
    // 天气不再是「隐形扣血」：明显伤身/添堵时给一句提示，让玩家看懂自己为啥莫名其妙就虚了。
    if (ch <= -2 || cm <= -3 || cs >= 3) {
      const sev = st.weekPlan.days.find(d => d.wx && d.wx.severe);
      const nm = sev ? sev.wx.name : "连日坏天气";
      weekLog.push(`🌧️ ${nm}这一周不太好过——${ch <= -2 ? "身子被折腾得有点虚，" : ""}${cm <= -3 ? "心情也跟着低沉，" : ""}${cs >= 3 ? "莫名烦躁，" : ""}注意保养。`);
    }
  }

  function newState(d) {
    const stats = normalizeStats(Object.assign({}, d.stats));
    const startMode = d.startMode || "campus";
    const st = {
      cohort: d.cohort.id, cohortName: d.cohort.name, birthYear: d.birthYear, bg: d.picks.join(" · "),
      playerName: (d.playerName && d.playerName.trim()) || defaultPlayerName(d.gender),
      gender: d.gender || "男", orientation: d.orientation || "异", civilRank: 0, partnerGender: null,
      week: startMode === "society" ? 52 : 0, startAge: startMode === "society" ? 22 : 21, age: startMode === "society" ? 22 : 21, year: d.birthYear + (startMode === "society" ? 22 : 21), stageId: "youth",
      startMode,
      stats: stats, network: 10, reputation: 0,
      cash: C.assetTierCash[d.assetTier] || 20000, assets: 0,
      health: 70 + Math.round((stats.body - 30) * 0.4), mood: 60, stress: 10, overdraft: 0,
      ailmentIds: [], flags: {}, startup: null, news: [],
      crush: null, commitment: null, _pendingDecision: C.stageDecisions.youth,
      goal: null, milestones: [], _goalDone: false,
      alive: true, ending: null, endingTitle: null, timeline: []
    };
    st.health = Math.max(30, Math.min(100, st.health));
    // 出生地：影响起手家底/人脉/风土（不动六维，保持平衡）
    if (d.birthplace) {
      const o = d.birthplace.origin || {};
      if (o.cashMul) st.cash = Math.round(st.cash * o.cashMul);
      if (o.network) add(st, "network", o.network);
      (o.tags || []).forEach(t => flag(st, "origin_" + t));
      st.birthplace = d.birthplace;
    }
    // 跨局解锁：把已解锁的新内容以 flag 注入本局，供目标/职业/事件线 gate
    st.unlocks = C._util.metaUnlocked ? C._util.metaUnlocked() : {};
    for (const uid in st.unlocks) flag(st, "unlock_" + uid);
    st.drift = Math.floor(Math.random() * 100);   // 多周目平行世界漂移种子（历史事件用）
    st.difficulty = draft.difficulty || "标准";   // 难度档（默认标准）
    if (DIFFS[st.difficulty]) st.cash = Math.round(st.cash * DIFFS[st.difficulty].cashMul);
    if (d.cohort.cashMul) st.cash = Math.round(st.cash * d.cohort.cashMul);   // 解锁出身的家底差异
    if (d.cohort.originFlag) flag(st, d.cohort.originFlag);
    // 随身物品：手机必带；电脑等设备的花费从开局家底里扣（不够则归零，不倒欠）
    st.gear = (d.gear && d.gear.slice()) || ["phone"];
    if (st.gear.indexOf("phone") < 0) st.gear.unshift("phone");
    let gearCost = 0; st.gear.forEach(gid => { const g = GEAR_ITEMS.find(x => x.id === gid); if (g && g.price) gearCost += g.price; });
    if (gearCost > 0) st.cash = Math.max(0, st.cash - gearCost);
    if (st.gear.indexOf("book") >= 0) add(st, "insight", 2);
    // 性别带来的轻微差异（总量相等、无优劣，仅起手风格不同）：男+体魄/谋略，女+魅力/心智
    if (st.gender === "男") { add(st, "body", 2); add(st, "strategy", 2); }
    else { add(st, "charm", 2); add(st, "mind", 2); }
    d.flags.forEach(f => flag(st, f));
    st.assetTier = d.assetTier || "worker";                          // 出身家底档（绿泡泡亲情剧本/家里兜底用）
    st._familyNet = familyNetFor(d.assetTier, st, st.difficulty);   // 新手保护期：家里能兜多久/给多宽，由出身+难度定
    // ★批次2：从捏人 flag 解析大学专业 → s.major（求职门槛用）+ 框定「大三在校」起点
    const mf = d.flags.find(f => f.indexOf("bg_major_major_") === 0);
    if (mf) st.major = mf.replace("bg_major_major_", "");
    st.education = { degree: startMode === "society" ? "本科" : "本科在读", major: st.major || null, school: (d.birthplace && d.birthplace.school) || null };
    if (startMode === "society") { flag(st, "edu_bachelor"); flag(st, "campus_skipped"); flag(st, "graduated_unemployed"); }
    if (st.major && C._util.majorById) { const mj = C._util.majorById(st.major); if (mj && C._util.rememberFact) { /* 记忆延迟到 ensureRuntime 之后写 */ st._openMajor = mj; } }
    if (d.legacyChild) { st.legacyParentName = (d.legacyChild.parentName || (C._util.loadMeta().legacy || {}).fromName || "上一代"); st.legacyChild = d.legacyChild; }
    C._util.initSocial(st);           // 生成社交圈
    C._util.initWorld(st);            // 初始化动态世界（物价/景气/风口/势头）+ 城市/工作
    C._util.initStocks(st);           // 初始化股市/理财组合
    if (C._util.ensureRuntime) C._util.ensureRuntime(st);   // 行业/影响力/社会画像/记忆/cast 等新结构
    // ★批次2：写入出身/专业记忆（人生回响地基，doc §9.2）
    if (C._util.rememberFact) {
      C._util.rememberFact(st, { id: "origin", once: true, type: "origin", text: `出身：${d.cohort.name}，${d.picks.slice(0, 2).join("、")}。`, tags: ["origin"], intensity: 2 });
      if (st._openMajor) { C._util.rememberFact(st, { id: "major", once: true, type: "major", text: `大学读「${st._openMajor.name}」——它将决定哪些门为你敞开。`, tags: ["major", st.major], intensity: 2 }); if (C._util.recordBeat) C._util.recordBeat(st, "pick_major"); delete st._openMajor; }
    }
    if (!window.MVP_00_CAREER && C._util.pickMainArc) C._util.pickMainArc(st);       // 依出身/地区/求学/目标，挑一条人生核心剧本
    // 传承：上一世留下的家底 + 血脉特质（封顶，不滚雪球）。在出身/难度倍率之后注入。
    let lg = null; if (C._util.applyLegacy) { try { lg = C._util.applyLegacy(st); } catch (e) { } }
    st._intro = startMode !== "society";                 // 开场「老祖宗的话」；毕业未就业入口直接进城市图，便于测试社会线
    st._cityDistrict = null;
    st._cityStartHint = startMode === "society" ? "talent_market" : "campus";
    st._cityFacility = null;
    st.eraWind = C.windAt(st.year);
    st.hours = stageOf(st.age).weeklyHours;
    rollWeekPlan(st);                 // 初始化第一周的天气与排程
    refreshNews(st);
    const bpTxt = d.birthplace ? `生于${d.birthplace.path}。${(d.birthplace.origin && d.birthplace.origin.note) || ""} ` : "";
    const lgTxt = lg ? `家族传承：${lg.note}${lg.cash ? `（继承家底 ¥${lg.cash.toLocaleString()}）` : ""} ` : "";
    const lineTxt = d.legacyChild ? `你是上一代的孩子「${d.legacyChild.name}」，在${st.legacyParentName || "上一代"}的人生余波里成年。` : "";
    if (startMode === "society") {
      st.timeline.push({ age: 22, text: `${st.year} 年，${st.playerName}本科毕业，却还没有找到工作（${d.cohort.name}·${st.gender}·${st.major && C._util.majorName ? C._util.majorName(st) : "应届生"}）。${bpTxt}${lgTxt}${lineTxt}成长轨迹：${d.picks.join("、")}。你拖着箱子来到成都，第一站是人才服务中心——故事从社会入口开始。` });
    } else {
      st.timeline.push({ age: 21, text: `${st.year} 年，${st.playerName}读到了大三（${d.cohort.name}·${st.gender}·${st.major && C._util.majorName ? C._util.majorName(st) : "在校生"}）。${bpTxt}${lgTxt}${lineTxt}成长轨迹：${d.picks.join("、")}。21 岁，毕业的影子已经压上来——故事从这里开始。` });
    }
    return st;
  }

  /* ---------- 本地大三：城市地图里的校园期 ---------- */
  function startCampus() {
    if (!s) return;
    const majorName = s.major && C._util.majorName ? C._util.majorName(s) : "本专业";
    s._intro = false;
    s.campus = {
      active: true, totalWeeks: 16, weeksDone: 0, gpa: 60, readiness: 18, social: 18,
      absences: 0, internship: 0, burnout: 0, _weekActs: {}
    };
    s.education = s.education || {};
    s.education.degree = "本科在读";
    s._cityDistrict = null;
    s._cityFacility = null;
    weekLog = [`🎓 大三下学期开始了。${majorName}的课表、校招宣讲、实习群和宿舍里的泡面味，一起压了过来。`];
    if (C._util.recordBeat) C._util.recordBeat(s, "pick_major");
    s.timeline.push({ age: s.age, text: `大三下学期开始，你决定先在校园里把毕业前的几个月过明白。` });
    screen = "play"; render();
  }
  function campusDash() {
    if (!s || !s.campus) return "";
    const cp = s.campus;
    const pct = Math.min(100, Math.round(cp.weeksDone / cp.totalWeeks * 100));
    return `<div class="campus-dash">
      <div class="cdh">🎓 大三下学期 <span>${cp.weeksDone}/${cp.totalWeeks} 周</span></div>
      <div class="cdbar"><i style="width:${pct}%"></i></div>
      <div class="cdgrid"><span>绩点 <b>${Math.round(cp.gpa)}</b></span><span>求职准备 <b>${Math.round(cp.readiness)}</b></span><span>校园人脉 <b>${Math.round(cp.social)}</b></span><span>旷课 <b>${cp.absences || 0}</b></span></div>
      <div class="cdtip">每周至少做一件和课业/实习相关的事。只躺平会换来学术警告，认真准备会让毕业后的求职少挨打。</div>
    </div>`;
  }
  function campusTick() {
    const cp = s && s.campus;
    if (!cp) { endWeek(); return true; }
    const did = cp._weekActs || {};
    if (!did.lecture && !did.cram && !did.intern) {
      cp.absences = (cp.absences || 0) + 1;
      cp.gpa = _cl(cp.gpa - 5);
      add(s, "stress", 4); add(s, "mood", -4);
      weekLog.push(`🚷 这一周你没碰课业也没推进实习。辅导员在群里点名，绩点往下掉了一截（累计旷课/摆烂 ${cp.absences} 次）。`);
      if (cp.absences === 3) weekLog.push("⚠️ 学院发来学业预警：再这么混，毕业季会先被教务处按住。");
    } else {
      cp.gpa = _cl(cp.gpa + 0.5);
    }
    cp.weeksDone++;
    s.week++;
    const na = s.startAge + Math.floor(s.week / 52);
    s.age = na; s.year = s.birthYear + s.age; s.eraWind = C.windAt(s.year);
    applyWeekWeather(s);
    if (s.week % 4 === 0) {
      const cost = Math.round(1400 * ((s.world && s.world.priceIndex) || 1) * ((DIFFS[s.difficulty] || DIFFS["标准"]).costMul));
      add(s, "cash", -cost);
      weekLog.push(`💸 生活费、餐费、打印费和杂七杂八的开销走掉 ¥${cost.toLocaleString()}。学校里时间便宜，但生活从不免费。`);
    }
    const campusLastActions = s._weekActs ? Object.keys(s._weekActs) : [];
    if (campusLastActions.length) s._lastPlan = campusLastActions;
    cp._weekActs = {};
    s._weekActs = {};
    s._actCount = {};
    s.hours = stageOf(s.age).weeklyHours;
    rollWeekPlan(s);
    refreshNews(s);
    if (cp.weeksDone >= cp.totalWeeks || cp.readiness >= 72 || has(s, "campus_ready_to_graduate")) {
      campusGraduate();
      return false;
    }
    const ctx = { lastActions: campusLastActions };
    const routed = C._util.pickWeeklyEvent ? C._util.pickWeeklyEvent(s, ctx) : null;
    const amb = routed || drawAmbient();
    if (amb) { enterEvent(amb); screen = "event"; return false; }
    if (C._util.buildWeeklyReflection) { const refl = C._util.buildWeeklyReflection(s, ctx); if (refl) weekLog.push(refl); }
    return true;
  }
  function campusGraduate() {
    const cp = s.campus || {};
    s.campus = null;
    flag(s, "edu_bachelor"); flag(s, "campus_done"); flag(s, "graduated_unemployed");
    s.education = s.education || {};
    s.education.degree = "本科";
    s.age = Math.max(s.age || 22, 22);
    s.year = s.birthYear + s.age;
    if (cp.internship >= 2 && C._util.recordBeat) C._util.recordBeat(s, "first_intern");
    if (cp.social >= 35 && C._util.recordBeat) C._util.recordBeat(s, "first_network");
    add(s, "knowledge", Math.max(1, Math.round((cp.gpa || 60) / 25)));
    add(s, "network", Math.max(0, Math.round((cp.social || 0) / 18)));
    s._cityDistrict = null;
    s._cityFacility = null;
    const txt = `本科毕业了。绩点 ${Math.round(cp.gpa || 60)}，求职准备 ${Math.round(cp.readiness || 0)}，校园人脉 ${Math.round(cp.social || 0)}。校园的门在身后合上，成都人才服务中心在前面等你。`;
    s.timeline.push({ age: s.age, text: txt });
    weekLog = [`🎓 ${txt}`];
  }

  /* ---------- 手机新闻流：风口藏在多条同向新闻里，玩家自己嗅 ---------- */
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
  // 下一轮风口及其登场年份（用于"更早期的征兆"——风口正式确立前先冒苗头）
  function upcomingWind(year) {
    const tl = C.windTimeline; if (!tl) return null;
    for (let i = 0; i < tl.length; i++) {
      const w = tl[i];
      const inRange = (w.from === undefined || year >= w.from) && (w.to === undefined || year <= w.to);
      if (inRange) { const nx = tl[i + 1]; return nx ? { wind: nx.wind, from: nx.from } : null; }
    }
    return null;
  }
  function newsFits(n, st) {
    const y = st.year || 0;
    return (n.from == null || y >= n.from) && (n.to == null || y <= n.to);
  }
  function buildFeed(st, full) {
    const allNews = C.newsArticles.filter(n => newsFits(n, st));
    const signals = allNews.filter(n => n.signal && n.wind === st.eraWind);
    const decoys = allNews.filter(n => n.signal && n.wind !== st.eraWind); // 别的风口的"信号"，是诱饵
    const noise = allNews.filter(n => !n.signal);
    const macro = allNews.filter(n => n.kind === "policy" || n.kind === "international" || n.kind === "regulation" || n.kind === "crisis");
    const feed = [];
    const addNews = (a, extra) => {
      const row = extra ? Object.assign({}, a, extra) : a;
      if (!feed.some(x => x.headline === row.headline)) feed.push(row);
    };
    // 真信号：平时露 1-2 条，深扒(full)露全部 → 越读越能看出趋势
    const sigCount = full ? signals.length : (rnd(0.85) ? Math.min(2, signals.length) : 1);
    shuffle(signals).slice(0, sigCount).forEach(a => addNews(a));
    // 诱饵 + 噪音
    shuffle(decoys).slice(0, full ? 2 : 1).forEach(a => addNews(a));
    shuffle(noise).slice(0, full ? 4 : 3).forEach(a => addNews(a));
    // 宏观/政策/国际：创业者必须看，平时至少冒出一条，深扒时更多。
    shuffle(macro).slice(0, full ? 3 : 1).forEach(a => addNews(a));
    // 更早期的征兆：临近换风口时（≤2 年），按概率冒出下一赛道的"苗头"新闻——
    // 深扒(full)更容易挖到。读懂的人能在风口正式起来前埋伏对应板块。
    const up = upcomingWind(st.year);
    if (up && up.from != null) {
      const yearsTo = up.from - st.year;
      if (yearsTo >= 0 && yearsTo <= 2) {
        const prox = yearsTo === 0 ? 1 : yearsTo === 1 ? 0.7 : 0.4;
        if (rnd((full ? 0.85 : 0.32) * prox)) {
          const pool = allNews.filter(n => n.signal && n.wind === up.wind);
          if (pool.length) addNews(pick(pool), { early: true });
        }
      }
    }
    return shuffle(feed);
  }
  function refreshNews(st) {
    st.news = buildFeed(st, false);
    // 新闻 → 盘面：这一屏新闻形成下一周的板块催化（一周后开盘兑现）
    if (C._util.applyNewsToMarket) C._util.applyNewsToMarket(st, st.news);
    if (C._util.applyNewsSignals) C._util.applyNewsSignals(st);   // 新闻 → 行业信号（读新闻能预判风向）
  }

  function netWorth(st) { return Math.round(st.cash + st.assets + (C._util.stockValue ? C._util.stockValue(st) : 0) + (st.startup && !has(st, "startup_done") ? st.startup.valuation * 0.3 : 0)); }

  /* ---------- 周推进结算 ---------- */
  function endWeek() {
    if (C._util.ensureRuntime) C._util.ensureRuntime(s);   // 幂等兜底：保证新结构齐全
    s.week += 1;
    // 疏忽计数（在清空本周行动前结算）：长期不顾家/不养生 → 后果事件读取（强制取舍）
    const _acts = s._weekActs || {};
    s.neglect = s.neglect || { fam: 0, self: 0 };
    s.neglect.fam = (_acts.family || _acts.date || _acts.socialize || _acts.parenting || _acts.grandkids) ? 0 : s.neglect.fam + 1;
    s.neglect.self = (_acts.rest || _acts.exercise || _acts.hobby) ? 0 : s.neglect.self + 1;
    // 被动收入：有正式工作但这周没主动「上班」时，仍发约四成基础周薪（你照常去上了班，只是没主动操作）。
    // 目的只是「快进/遇事即停」时不饿死、不被生活成本拖破产——而非躺着致富（故远低于主动上班）。
    if (has(s, "employed") && s.job && !_acts.work && !_acts.startup && typeof jobSalary === "function") {
      const baseWk = Math.round(jobSalary(s) * 12 / 52 * 0.4);
      if (baseWk > 0) add(s, "cash", baseWk);
    }
    if (Object.keys(_acts).length) s._lastPlan = Object.keys(_acts);  // 记下上周做了什么 → 「快进」自动延续这套routine
    s._weekActs = {};                 // 新的一周：清空「本周已做」记录，行动重新可用
    s._cityVisited = {};              // 新的一周：清空「本周去过的区域」标记
    s._actCount = {};                 // 清空本周行动次数（可多次行动用）
    s._pendingAct = null;             // 跨周清掉未落地的挂起行动，避免脏数据
    s.away = null;                    // 旅行结束，回到定居城市
    const newAge = s.startAge + Math.floor(s.week / 52);
    const aged = newAge !== s.age;
    s.age = newAge; s.year = s.birthYear + s.age;
    if (typeof familyNudge === "function") {
      const hasBond = has(s, "married") || has(s, "partner");
      if (hasBond) {
        if (_acts.family || _acts.date || _acts.companion) familyNudge(s, { bond: 1, conflict: -1 });
        else if (s.week % 4 === 0) familyNudge(s, { bond: -1, conflict: 1 });
      }
      if (has(s, "has_kid")) {
        if (_acts.parenting || _acts.family || _acts.grandkids) familyNudge(s, { coParent: 1 });
        else if (s.week % 6 === 0) familyNudge(s, { coParent: -1, conflict: 1 });
      }
      if (aged && has(s, "married") && typeof familyEnsure === "function") familyEnsure(s).yearsMarried += 1;
    }
    s.eraWind = C.windAt(s.year);
    C._util.tickWorld(s);             // 推进动态世界（物价/景气/风口/势头/卷度）
    if (C._util.tickNarrativeSystems) C._util.tickNarrativeSystems(s);   // 季度推进行业/影响力写回/cast
    if (s._weekNotes && s._weekNotes.length) { for (const n of s._weekNotes) weekLog.push(n); s._weekNotes = []; }  // 延迟兑现等内容层周记 → 本周日志
    // 泡沫破裂播报：让玩家看见「风口崩了、接盘者被埋」
    if (s.world && s.world.crash && s.world.crash.fresh) {
      s.world.crash.fresh = false;
      const sec = s.world.crash.sector;
      weekLog.push(`📉 泡沫破了！「${sec}」赛道一夜退潮，股价雪崩、估值打骨折——追高的接盘者被深深埋住。`);
      s.timeline.push({ age: s.age, text: `「${sec}」泡沫破裂，市场一片狼藉。` });
    }
    C._util.tickStocks(s);            // 股市每周开盘，价格随世界波动

    // 每周轻度恢复/衰减：避免「压力一旦升高就回不来」的二元悬崖（过劳惩罚平滑化）
    add(s, "stress", -2);                                   // 自然喘息
    if (s.stress < 42 && s.health < 92 && !has(s, "starving")) add(s, "health", 1); // 不太高压时身体慢慢回血；但断炊挨饿时养不回来
    if (s.stress < 30 && s.overdraft > 0) add(s, "overdraft", -1); // 低压可慢慢养回透支额度（防新暗伤）
    // 心情自然回弹：人有韧性，再难也会慢慢爬起来 → 避免「一跌到谷底就永远出不来」的死亡螺旋
    // 抬高回弹地板（38→46），让「认真打拼」时心情稳在 40+ 而非长期钉在抑郁线（15-20）。
    if (s.mood < 46) add(s, "mood", 1);
    if (s.mood < 30) add(s, "mood", 1);                     // 谷底额外托一把，给足恢复窗口
    if (s.stress < 25) add(s, "mood", 1);                   // 难得清闲的一周，心也松快一点
    // 持续心境低谷计数（供「心力枯竭」结局判定：必须长期深陷才致命）
    s._moodLowWeeks = (s.mood < 18) ? (s._moodLowWeeks || 0) + 1 : 0;

    // ★健康危急强制干预★：健康跌破临界(≤8)必定住院/强制休养——杜绝「健康0还正常推进十几年」。
    // 半年冷却防刷屏；花钱(或欠债)换命、工作中断、压力释放，把健康抬回安全线上。健康从此是
    // 真实的硬约束：你可以透支，但透支到极限会被一次次拽进医院、掏空钱包，而不是当数字摆设。
    if (s.health <= 8 && (s.week - (s._lastHospital || -9999)) >= 26) {
      s._lastHospital = s.week;
      const piH = s.world ? s.world.priceIndex : 1;
      const cost = Math.round((2200 + 480 * Math.max(0, (s.age || 30) - 30)) * piH);
      add(s, "cash", -cost);                         // 没钱就先欠着，月度结算时变卖/挨饿处理
      add(s, "health", 24); add(s, "stress", -12); add(s, "mood", -3);
      if (s.job) s._monthWork = 0;                   // 工作中断：本月出勤清零，月薪大打折扣
      s.timeline.push({ age: s.age, text: `身体彻底垮了——你被送进医院。一通检查、输液、卧床，花了 ¥${cost.toLocaleString()}（${s.cash < 0 ? "钱不够，先欠着" : "积蓄又少一截"}）。${s.job ? "工作也被迫中断了大半个月。" : ""}医生撂下一句：「再这么糟蹋身子，下次未必抢得回来。」` });
      weekLog.push(`🏥 健康亮红灯，你被强制送医休养——医药费 ¥${cost.toLocaleString()}，元气勉强续回来一点。`);
    }

    // 每 4 周 ≈ 一个月：月度收支结算（先发工资收入，再扣账单），生成「月度结算单」弹窗
    if (s.week % 4 === 0) {
      const income = [];   // 本月收入项（月底发薪 + 年终奖 + 已即时到账的零工）
      // 💸 爸/妈月初生活费：以「微信转账」发到绿泡泡，待你收款；上月没领的自动到账计入本月收入。断奶后停发
      if (!has(s, "family_net_ended")) {
        const collected = famMonthlyAllowance();
        if (collected > 0) income.push({ emoji: "🧧", label: "家里·生活费", amount: collected });
        if (s._famAllowNotice) weekLog.push(`💸 ${FAM_NAME[s._famAllowNotice.who]}给你转了这个月生活费 ¥${s._famAllowNotice.amt.toLocaleString()}，去绿泡泡点「收款」领。`);
      }
      // 💼 月薪：在职就月底发（按本月出勤比例，满 4 周拿满，保底 60%）
      if (s.job) {
        const ratio = Math.max(0.6, Math.min(1, (s._monthWork || 0) / 4));
        const salary = Math.round(C._util.jobSalary(s) * ratio);
        if (salary > 0) { add(s, "cash", salary); income.push({ emoji: "💼", label: `${s.job.name}·月薪${ratio < 1 ? `(出勤${Math.round(ratio * 100)}%)` : ""}`, amount: salary }); if (C._util.recordBeat) C._util.recordBeat(s, "first_paycheck"); }
      }
      s._monthWork = 0;
      // 🧹 零工等已当周即时到账的零散收入（只汇总展示，不重复发）
      const gigPay = s._monthPay || 0; s._monthPay = 0;
      if (gigPay > 0) income.push({ emoji: "🧹", label: "打零工 / 零散收入", amount: gigPay });
      // 🎉 年终奖：跨年的那个月，高薪岗(tier≥2)按级别发 N 个月年终（年度高收入，当场到账）
      if (aged && s.job && (s.job.tier || 0) >= 2) {
        const mult = (s.job.tier - 1) * (0.6 + Math.random() * 0.9) * (1 + (s.job._raise || 0));
        const bonus = Math.round(C._util.jobSalary(s) * mult);
        if (bonus > 0) { add(s, "cash", bonus); income.push({ emoji: "🎉", label: `年终奖(${mult.toFixed(1)} 个月)`, amount: bonus }); s.timeline.push({ age: s.age, text: `年底了，「${s.job.name}」发了 ¥${bonus.toLocaleString()} 年终奖。` }); }
      }
      const totalIncome = income.reduce((a, b) => a + b.amount, 0);

      // —— 月度账单（支出）：逐项 → 扣现金 → 资产填窟窿 → 耗光断炊 ——
      const bill = C._util.monthlyBill(s);
      const total = Math.round(bill.total * ((DIFFS[s.difficulty] || DIFFS["标准"]).costMul));
      add(s, "cash", -total);
      if (has(s, "has_loan") && !has(s, "startup_done")) add(s, "stress", 2);

      // 创始人手握有估值的公司 = 有底气撑着（押公司借钱、吃泡面也饿不死），不被判断炊、公司也不强卖
      const founderCushion = s.startup && !has(s, "startup_done") && (s.startup.valuation || 0) > 500000;
      let soldAsset = 0;
      if (s.cash < 0 && (s.assets || 0) > 0) { soldAsset = Math.min(s.assets, -s.cash); s.assets -= soldAsset; s.cash += soldAsset; }
      // 资金链断裂：没资产兜底、公司也不值钱 → 公司清零破产
      if (s.cash < 0 && (s.assets || 0) <= 0 && s.startup && !has(s, "startup_done") && !founderCushion) {
        s.startup = null; delete s.flags.startup; delete s.flags.chase_ipo; flag(s, "startup_failed"); flag(s, "been_bankrupt");
      }
      const broke = s.cash < 0 && (s.assets || 0) <= 0 && !founderCushion;
      if (founderCushion && s.cash < -80000) s.cash = -80000;   // 创始人押公司能多借点，封底 -8万
      let familyWire = 0, familyFirstWire = false;
      if (broke) {
        s._brokeMonths = (s._brokeMonths || 0) + 1;
        const fn = s._familyNet;
        const inWindow = fn && fn.until > 0 && s.week <= fn.until;
        if (inWindow) {
          // ★新手保护期·家里打钱★：开局现金少，断炊由父母按月打生活费托住——
          // 「前半年没钱家里会打过来」。额度按当月账单算，随年代/通胀自动缩放。
          familyWire = Math.max(total, Math.round(total * fn.factor - s.cash));   // 补到约能再撑一个月+缓冲
          add(s, "cash", familyWire);
          s._familyAid = (s._familyAid || 0) + familyWire;
          s._familyWires = (s._familyWires || 0) + 1;
          familyFirstWire = (s._familyWires === 1);
          s._brokeMonths = 0; delete s.flags.starving;
          add(s, "mood", -2); add(s, "stress", 2);
          income.push({ emoji: "📲", label: familyFirstWire ? "家里打来生活费" : "家里又贴补的生活费", amount: familyWire });
          if (familyFirstWire) {
            flag(s, "got_family_net");
            s.timeline.push({ age: s.age, text: `卡里见了底，你硬着头皮跟家里开了口。没两天，父母往账上打了 ¥${familyWire.toLocaleString()}——「先顾好自己，钱不够再说，家里还撑得住」。隔着电话的那点踏实，和说不出口的亏欠，一起压上心头。` });
          } else {
            weekLog.push(`📲 又揭不开锅，家里打来 ¥${familyWire.toLocaleString()} 生活费应急（还在保护期内）。`);
          }
        } else {
          // 保护期已过 / 出身兜不住 —— 真正的断炊，得自己扛
          flag(s, "starving");
          const m = s._brokeMonths;
          const youthNet = (s.age || 18) < 28 && s.difficulty !== "硬核";
          add(s, "health", -(youthNet ? Math.min(8, 1 + m) : Math.min(15, 2 + m * 2)));
          add(s, "mood", -Math.min(12, 3 + m)); add(s, "stress", 7);
          if (s.cash < -50000) s.cash = -50000;
          // 断奶时刻：保护期一过、头一回真饿肚子，给一记明确的人生节点（半年后家里不再兜底）
          if (fn && fn.until > 0 && !has(s, "family_net_ended")) {
            flag(s, "family_net_ended");
            s.timeline.push({ age: s.age, text: `这回再难，你也没好意思再向家里伸手——爸妈年纪大了，能贴补的早都贴补过了。打这儿起，日子得自己撑起来。` });
          }
          // 注：半年保护期一过，家里不再有任何兜底——撑不撑得住，全看自己。
        }
      } else if (has(s, "starving")) {
        delete s.flags.starving; s._brokeMonths = 0;
        s.timeline.push({ age: s.age, text: "缓过一口气：账上终于有了钱，不用再挨饿。" });
      } else if (s.cash < 0) {
        add(s, "mood", s.cash < -30000 ? -2 : -1);
      }
      // 暴发户/金汤匙：保护期一过，父母主动把你「断奶」并叮嘱独立——单独剧情，杜绝长期/无限兜底
      {
        const fnX = s._familyNet;
        if (fnX && fnX.independent && fnX.until > 0 && s.week > fnX.until && !has(s, "family_net_ended")) {
          flag(s, "family_net_ended");
          s.timeline.push({ age: s.age, text: `家里把你叫回去吃了顿饭。席间，父亲放下筷子：「孩子，你也长大了，该自己立起来了。家里不是养不起你，是不能再这么养着你——钱给多了，人就废了。」母亲往你包里塞了点吃的，没再多说。从这顿饭起，家里不再按月贴补你。退路没了，路反倒清楚了。` });
        }
      }
      const scene = monthlyScene(s, { total, soldAsset, broke, brokeMonths: s._brokeMonths });
      if (broke) { const m = s._brokeMonths; if (m === 1 || m === 3 || m >= 5) s.timeline.push({ age: s.age, text: scene }); }
      else if (soldAsset > 0) s.timeline.push({ age: s.age, text: `月底入不敷出，变卖了 ¥${soldAsset.toLocaleString()} 的家当填账。资产又缩水了一截。` });

      // ★月度结算单★：只在「值得一看」的月份弹全屏（断炊/变卖资产/人生头一次），
      // 普通月份只在本周日志记一行、不阻断 —— 否则每月一弹、一辈子几百次确认，且快进也被反复打断，极伤流畅。
      const repeatWire = familyWire > 0 && !familyFirstWire;
      const billNotable = (broke && !repeatWire) || soldAsset > 0 || !has(s, "saw_bill");
      if (billNotable) {
        flag(s, "saw_bill");
        s._pendingBill = {
          age: s.age, year: s.year, income, totalIncome: totalIncome + familyWire,
          expenses: bill.items, totalExpense: total, soldAsset,
          net: (totalIncome + familyWire) - total, balance: Math.round(s.cash),
          broke, brokeMonths: s._brokeMonths || 0, scene
        };
      } else {
        const net = (totalIncome + familyWire) - total;
        weekLog.push(`🧾 ${s.year}年月度结算：进 ¥${Math.round(totalIncome + familyWire).toLocaleString()} / 出 ¥${total.toLocaleString()}，${net >= 0 ? "结余" : "透支"} ¥${Math.abs(Math.round(net)).toLocaleString()}（余 ¥${Math.round(s.cash).toLocaleString()}）`);
      }

      if (s.stress > 45) add(s, "overdraft", Math.max(0, Math.round((s.stress - 45) / 9) - Math.round((s.stats.mind - 30) / 30)));
      add(s, "stress", -5);
      if (C._util.socialDecay) C._util.socialDecay(s);
    }
    // 过劳预警：在重度暗伤/猝死前给出明确信号（解决「突然死、没预警」）
    if (s.overdraft >= 90 && !has(s, "warn_overwork")) {
      flag(s, "warn_overwork");
      s.timeline.push({ age: s.age, text: "⚠️ 身体频频报警：失眠、心悸、情绪低落。再这样透支下去，会出大事。" });
      weekLog.push("⚠️ 身体亮红灯了——失眠、心悸、提不起劲。再不停下来歇歇，怕是要垮。");
    }
    if (s.overdraft < 60 && has(s, "warn_overwork")) delete s.flags.warn_overwork;
    // 心力枯竭预警：长期心境低谷时给出明确信号 + 指一条恢复的路（休息/陪家人/培养爱好都能回血）
    if (s.ailmentIds.includes("burnout") && (s._moodLowWeeks || 0) >= 8 && !has(s, "warn_burnout")) {
      flag(s, "warn_burnout");
      s.timeline.push({ age: s.age, text: "🕳️ 你陷进了一种说不清的疲惫与空，做什么都提不起劲。是时候停下来，歇歇、陪陪人、找回点热乎气了。" });
      weekLog.push("🕳️ 心被掏空了一样——别硬撑。「躺平休息」「陪伴家人」「培养爱好」都能慢慢把你捞回来。");
    }
    if (s.mood >= 30 && has(s, "warn_burnout")) delete s.flags.warn_burnout;
    // 年龄增长的自然健康衰减；★体魄(body)高 = 底子好，老得慢★
    if (aged && s.age > 40) add(s, "health", -Math.max(0, Math.round((s.age - 40) * 0.10) - Math.round((s.stats.body - 30) / 25)));

    // 年度财富再分配：闲置的巨额身家会被税收/通胀/人情往来/挥霍一点点磨平，
    // 给「非创业的攒钱暴富」一个软上限——让创业(一次性大额变现)仍是更亮眼的致富路。
    // 注：只磨「超出门槛」的部分、且每年仅 2%，不伤普通人，也不至于抹平正经身家。
    if (aged && !(s.startup && s.startup.fulltime)) {
      const pi = s.world ? s.world.priceIndex : 1;
      const cap = 5000000 * pi;                 // 约「实际购买力 500 万」以上才开始被磨
      const wealth = (s.cash || 0) + (s.assets || 0);
      if (wealth > cap) {
        let drag = Math.round((wealth - cap) * 0.02);
        const fromAssets = Math.min(s.assets || 0, drag);
        s.assets = (s.assets || 0) - fromAssets; drag -= fromAssets;
        if (drag > 0) s.cash -= drag;
      }
    }

    // 暗伤判定
    for (const a of C.ailments) if (s.overdraft >= a.threshold && !s.ailmentIds.includes(a.id)) {
      s.ailmentIds.push(a.id); s.timeline.push({ age: s.age, text: `🩸 落下暗伤「${a.name}」，难以痊愈。` });
      weekLog.push(`🩸 暗伤：${a.name}（${a.desc}）`);
    }

    // 阶段切换
    const ns = stageOf(s.age);
    if (ns.id !== s.stageId) { s.stageId = ns.id; s.timeline.push({ age: s.age, text: `步入【${ns.name}】：${ns.climate}` }); weekLog.push(`—— 你进入了【${ns.name}】阶段 ——`); if (C.stageDecisions[ns.id] && !has(s, "dec_" + ns.id)) s._pendingDecision = C.stageDecisions[ns.id]; }

    // 「硬撑」挤占吃饭睡觉 → 周末结算多维代价（健康/心情↓、压力↑、透支累积→暗伤）
    const overtime = Math.max(0, -(s.hours || 0));
    if (overtime > 0) {
      add(s, "stress", Math.min(22, Math.round(overtime * 0.55)));
      add(s, "health", -Math.min(14, Math.round(overtime * 0.35)));
      add(s, "mood", -Math.min(12, Math.round(overtime * 0.3)));
      s.overdraft = (s.overdraft || 0) + Math.round(overtime / 5);
      s._overtimeStreak = (s._overtimeStreak || 0) + 1;
      weekLog.push(overtime >= 24 ? "😵 这一周你几乎连轴转，饭顾不上吃、觉睡不安稳——把自己榨干了。" : "⏰ 你挤占了吃饭睡觉的时间硬塞了不少事，身体悄悄记了一笔账。");
    } else { s._overtimeStreak = 0; }
    s._overtimeMode = false;          // 硬撑是逐周的主动选择，每周重置
    applyWeekWeather(s);              // 结算刚过去这一周的天气影响
    s.hours = stageOf(s.age).weeklyHours;
    // ★批次3：通勤固定占用本周时间 → 在职者自由行动明显减少（doc §3.1/§3.2）
    if (s.job && typeof commuteHoursOf === "function") {
      const occ = commuteHoursOf(s);
      if (occ > 0) { s.hours = Math.max(8, s.hours - occ); s._commuteReserved = occ; }
      else s._commuteReserved = 0;
    } else s._commuteReserved = 0;
    if (C._util.initWeekSlots) C._util.initWeekSlots(s);   // ★新一周：重置行动格（doc §2.2）
    rollWeekPlan(s);                  // 生成新一周的天气与空排程
    refreshNews(s);
    tickMs();

    // 结局判定（每周一次，概率性）
    if (checkEndings()) return false;
    // 环境/随机事件：先按「本周做了什么」走因果路由（pickWeeklyEvent），无命中再回退旧 drawAmbient（doc §7.2）
    const _ctx = { lastActions: s._lastPlan || (s._weekActs ? Object.keys(s._weekActs) : []) };
    const routed = C._util.pickWeeklyEvent ? C._util.pickWeeklyEvent(s, _ctx) : null;
    const amb = routed || drawAmbient();
    if (amb) { enterEvent(amb); screen = "event"; return true; }
    // 没有事件 → 本周小结，避免空过（doc §4.4）。只进周日志，不弹事件页。
    if (C._util.buildWeeklyReflection) { const refl = C._util.buildWeeklyReflection(s, _ctx); if (refl) weekLog.push(refl); }
    return true;
  }

  /* ---------- 结局：每周概率判定 + 普通死亡兜底 ---------- */
  function checkEndings() {
    for (const e of C.endings) {
      let ok = false; try { ok = e.cond(s); } catch (x) { ok = false; }
      if (!ok) continue;
      let p = 0; try { p = e.prob(s); } catch (x) { p = 0; }
      if (rnd(p)) { triggerEnding(e); return true; }
    }
    if (s.age >= 16 && rollDeath()) { s.ending = s._deathRecap || "你走完了这一生。"; s.endingTitle = null; finishGame(); return true; }
    return false;
  }
  function triggerEnding(e) { let t = ""; try { t = e.text(s) || ""; } catch (x) { } s.ending = t; s.endingTitle = e.title; if (t) s.timeline.push({ age: s.age, text: t }); finishGame(); }
  function finishGame() {
    s.alive = false; screen = "dead";
    if (!s._recorded) {                         // 每局只入档一次
      s._recorded = true;
      const g = C._util.goalById(s.goal);
      const minStat = Math.min(...C.STAT_KEYS.map(k => (s.stats && s.stats[k]) || 0));
      const endName = s.endingTitle || (C._util.pickEnding ? C._util.pickEnding(s) : (C.titles.find(t => { try { return t.cond(s); } catch (e) { return false; } }) || C.titles[C.titles.length - 1]).name);
      if (has(s, "has_kid") && C._util.childEnsureList) C._util.childEnsureList(s);
      if (C._util.childUpdateAges) C._util.childUpdateAges(s);
      const L = {
        name: s.playerName || "无名之人", birthYear: s.birthYear, age: s.age, netWorth: netWorth(s),
        birthplace: s.birthplace || null,
        goal: s.goal, goalDone: !!s._goalDone, path: g ? g.path : null,
        civilRank: s.civilRank || 0,
        ipo: has(s, "startup_done") && has(s, "chase_ipo"),
        married: has(s, "married"), hasKid: has(s, "has_kid"),
        abroad: has(s, "abroad_done") || has(s, "traveled"),
        emigrated: has(s, "emigrated"), jailed: has(s, "jailed"),
        lottery: has(s, "lottery") || has(s, "absurd_lottery_big_win"),
        minStat: minStat,
        deathCause: s.causeOfDeath || "寿终正寝",
        endingTitle: endName, titleName: endName,
        reputation: s.reputation || 0,
        profile: s.profile || null,                                   // 社会画像：传给下一代的特权/污点/伤痕
        threads: s.threads || null,                                   // 持续矛盾：高位未了的心结 → 下一代的家族创伤
        memories: s.memories || null,
        worldImpacts: (s.world && s.world.impacts) ? s.world.impacts.slice(0, 6) : [],   // 你改变过的行业，下一代出生即承其余波
        companyLegacy: s.startup ? { status: (has(s, "chase_ipo") && has(s, "startup_done")) ? "listed" : has(s, "startup_failed") ? "failed" : has(s, "startup_done") ? "acquired" : "running", industry: s.startup.track || null, name: s.startup.name || null } : null,
        children: (s.children || []).map(c => Object.assign({}, c, { age: Math.max(0, s.year - (c.birthYear || s.year)), parentName: s.playerName || "上一代" }))
      };
      try { s._freshAch = C._util.recordLife(L); } catch (e) { s._freshAch = []; }
    }
  }

  function rollDeath() {
    const a = s.age;
    let yr = a < 30 ? 0.002 : a < 40 ? 0.004 : a < 50 ? 0.01 : a < 60 ? 0.025 : a < 70 ? 0.06 : a < 80 ? 0.14 : 0.32;
    const hf = Math.max(0.3, Math.min(3, (100 - s.health) / 50 + 0.3)); // 健康是唯一直接影响死亡的维度
    let af = 1; for (const id of s.ailmentIds) { const am = C.ailments.find(x => x.id === id); if (am) af *= (1 + am.deathMod); }
    const med = netWorth(s) > 5000000 ? 0.6 : netWorth(s) > 1000000 ? 0.8 : 1;
    const dm = (DIFFS[s.difficulty] || DIFFS["标准"]).deathMul;
    let pWeek = Math.min(0.6, (yr * hf * af * med * dm) / 52);
    // 健康危急（<12）：与年龄无关的额外周死亡风险——长期油尽灯枯，年轻也扛不住，逼你别把健康当耗材。
    // 温和叠加（健康 0 约「十余年累计五成」），是慢性威胁而非几年暴毙，不误伤偶尔透支的认真玩家。
    if (s.health < 12) pWeek = Math.min(0.6, pWeek + (12 - s.health) / 100 * 0.008 * dm);
    if (rnd(pWeek)) {
      if (C._util.pickDeathCause) { const d = C._util.pickDeathCause(s); s.causeOfDeath = d.cause; s._deathRecap = d.recap; }
      else { s.causeOfDeath = pick(["心梗", "意外", "重病", "衰老"]); }
      return true;
    }
    return false;
  }

  /* ---------- 环境事件抽取 ----------
   * 修复事件刷屏：① once 事件一辈子只触发一次；② 其余事件 5 年冷却，不会反复弹同一个；
   * ③ 整体降低出现频率（约每年 ~6 次大事，而非满屏）。
   */
  const AMBIENT_COOLDOWN = 260; // 周（=5年）
  const ANNUAL_EVENT_CAP = 5;   // 每年「闲杂事件」上限（创业主线/已开连续剧不计入），做节奏管理
  const UNIVERSAL_MODULES = { era: 1, health: 1, family: 1, life: 1, absurd: 1, relation: 1, world: 1, history: 1, choice: 1, domestic: 1, love: 1, weather: 1, degree: 1 };
  const ROUTE_RULES = {
    peace:  { allow: ["family", "relation", "love", "health", "absurd", "life", "domestic", "choice", "weather", "era", "world", "history"], soft: ["work", "career", "money"], block: ["startup", "venture", "civil", "sudden"], cap: 3, sagaStartP: 0.12 },
    family: { allow: ["family", "relation", "love", "health", "domestic", "life", "choice", "weather", "era", "world", "history"], soft: ["work", "career", "money", "absurd"], block: ["startup", "venture", "civil", "sudden"], cap: 4, sagaStartP: 0.16 },
    corp:   { allow: ["work", "career", "relation", "money", "health", "choice", "era", "world", "history", "weather", "family", "love", "absurd"], soft: ["startup", "civil"], block: ["venture"], cap: 5, sagaStartP: 0.22 },
    official:{ allow: ["civil", "relation", "family", "health", "choice", "era", "world", "history", "weather", "love", "absurd"], soft: ["work", "career", "money"], block: ["startup", "venture"], cap: 5, sagaStartP: 0.2 },
    freedom:{ allow: ["money", "startup", "venture", "work", "career", "relation", "health", "choice", "era", "world", "history", "weather", "absurd", "family"], soft: ["civil"], block: [], cap: 5, sagaStartP: 0.24 },
    ipo:    { allow: ["startup", "venture", "money", "work", "career", "relation", "health", "choice", "era", "world", "history", "weather", "absurd", "family"], soft: ["civil"], block: [], cap: 5, sagaStartP: 0.24 }
  };
  function routeRule() { return (s.goal && ROUTE_RULES[s.goal]) || null; }
  // 洞察影响事件出现：看得准的人，风口/机会类事件更常找上门，危机/被坑类则少踩一些
  const OPP_MODULES = { money: 1, venture: 1, era: 1, world: 1, goal: 1, history: 1 };
  const HAZARD_MODULES = { crisis: 1, sudden: 1 };
  function eventWeight(e, gm) {
    const r = routeRule(); if (!r) return 1;
    if (r.block && r.block.includes(e.module)) return 0;
    let w;
    if (e.module === "saga") w = 1;
    else if (gm && gm.bias && gm.bias.includes(e.module)) w = 2.2;
    else if (r.allow && r.allow.includes(e.module)) w = 1;
    else if (r.soft && r.soft.includes(e.module)) w = 0.25;
    else if (UNIVERSAL_MODULES[e.module]) w = 0.7;
    else w = 0.12;
    const ins = (C._util.statEdge ? C._util.statEdge(s, "insight") : 0);
    if (OPP_MODULES[e.module] || (e.opportunity)) w *= (1 + ins * 0.9);        // 洞察高 → 风口/机会更频
    else if (HAZARD_MODULES[e.module]) w *= Math.max(0.4, 1 - ins * 0.5);      // 洞察高 → 危机/突发略少
    return w;
  }
  // ★事件分层★：在路线权重之上，叠加「当前场景 / 当前主线 / 重要性 / 是否挂条件」的语境系数，
  // 让事件优先服务「你此刻在经历什么」，把无归属的纯填充事件压下去——根治「事件乱跳」。
  const IMPORTANCE_MULT = { turning: 1.7, arc: 1.35, scene: 1.15, daily: 0.7, minor: 0.6 };
  // ★创业回归★：按「创业阶段」给事件的创业角色加权——未创业时优先「为什么/如何创业」，
  // 创业中优先公司经营/危机，创业后优先遗产。让一局人生始终回到创业这根主线上。
  const ROLE_BOOST = {
    pre: { origin: 1.6, resource: 1.7, trigger: 2.0, company: 0.8, crisis: 0.85, cost: 1.0, world: 1.15, legacy: 0.4, flavor: 0.5 },
    in: { origin: 0.7, resource: 1.05, trigger: 0.6, company: 2.0, crisis: 1.8, cost: 1.3, world: 1.4, legacy: 0.5, flavor: 0.4 },
    post: { origin: 0.6, resource: 0.85, trigger: 0.6, company: 0.95, crisis: 0.95, cost: 1.05, world: 1.15, legacy: 1.9, flavor: 0.5 }
  };
  function founderPhase() { if (has(s, "startup_done")) return "post"; if (s.startup) return "in"; return "pre"; }
  function contextBoost(e) {
    let m = 1;
    const sc = C._util.currentScene ? C._util.currentScene(s) : null;
    if (e.scene && sc && e.scene === sc.type) m *= 2.4;                       // 命中当前场景
    if (e.arc && s.mainArc && e.arc === s.mainArc.id) m *= 2.2;               // 服务当前核心剧本
    if (e.importance && IMPORTANCE_MULT[e.importance]) m *= IMPORTANCE_MULT[e.importance];
    if (C._util.entrepreneurialRoleOf) { const rb = ROLE_BOOST[founderPhase()]; const role = C._util.entrepreneurialRoleOf(e); if (rb && rb[role]) m *= rb[role]; }
    if (!e.cond && !e.scene && !e.arc) m *= 0.38;                            // 既无条件、又不归属任何场景/主线 → 纯噪音，降权
    const hits = (s._evHits && s._evHits[e.id]) || 0;                        // 新鲜度：本局已看过的事件逐次降权，逼出更多样的人生
    if (hits) m *= 1 / (1 + 0.7 * hits);
    return m;
  }
  // 「强戏剧」事件：连续剧开场 / 重大转折 —— 受年度戏剧强度预算约束，避免人生变苦情短剧流
  function isStrongEvent(e) { return (e.importance === "turning" || e.importance === "crisis" || e.importance === "arc") || isSagaStarter(e); }
  function weightedPick(list, gm) {
    let total = 0;
    const rows = list.map(e => { const w = Math.max(0, eventWeight(e, gm) * contextBoost(e)); total += w; return { e, w }; }).filter(x => x.w > 0);
    if (!rows.length) return null;
    let r = Math.random() * total;
    for (const row of rows) { r -= row.w; if (r <= 0) return row.e; }
    return rows[rows.length - 1].e;
  }
  function isSagaStarter(e) { return e && e.module === "saga" && /_s1$/.test(e.id || ""); }
  function activeSagaCount() {
    let n = 0, f = s.flags || {};
    Object.keys(f).forEach(k => { if (/^saga_.*_s1$/.test(k) && !f[k.replace(/_s1$/, "_done")] && !f[k.replace(/_s1$/, "_s3")]) n++; });
    return n;
  }
  function sagaAllowed(e) {
    const r = routeRule();
    if (!isSagaStarter(e)) return true;
    if (activeSagaCount() >= 1) return false;
    if (s._lastSagaStart && s.week - s._lastSagaStart < 208) return false; // 至少 4 年再开一条大连续剧
    if (!r) return rnd(0.22);
    return rnd(r.sagaStartP == null ? 0.2 : r.sagaStartP);
  }
  function drawAmbient() {
    // 节奏留白（v VN 节奏）：降低平时触发率，让每周更透气、人生像「一段段场景」而非满屏刷事；
    // 仍保留 pity timer——久不出事才逐步抬高触发率，消除「连续几十周零事件」的死区。
    s._evDry = (s._evDry || 0) + 1;
    const baseP = Math.min(0.14, 0.05 + Math.max(0, s._evDry - 10) * 0.006);  // 平时 5%，~10周后加码，封顶 14%
    if (!rnd(baseP)) return null;
    s._cd = s._cd || {};
    const gm = C._util.goalMods ? C._util.goalMods(s) : null;
    const pool = C.events.filter(e => {
      if (!e.ambient) return false;
      if (e.once && has(s, "ev_" + e.id)) return false;              // 一次性事件已发生
      if (!e.once && s._cd[e.id] && s.week - s._cd[e.id] < AMBIENT_COOLDOWN) return false; // 冷却中
      if (eventWeight(e, gm) <= 0) return false;
      if (e.module === "saga" && !sagaAllowed(e)) return false;
      try { return !e.cond || e.cond(s); } catch (x) { return false; }
    });
    if (!pool.length) return null;
    // —— 分层调度：脊柱 > 当前场景 > 连续剧/联动 > 路线 > 通用，叠加【年度强戏剧预算】，根治乱跳 ——
    if (!s._yrBud || s._yrBud.year !== s.year) s._yrBud = { year: s.year, used: 0, strong: 0, flavor: 0 };
    const STRONG_CAP = (routeRule() && routeRule().strongCap) || 3;   // 每年「强戏剧」上限：背叛/暴雷/连续剧开场等
    const strongOK = s._yrBud.strong < STRONG_CAP;
    const roleOf = (e) => C._util.entrepreneurialRoleOf ? C._util.entrepreneurialRoleOf(e) : "flavor";
    const bump = (ev) => { if (ev) { if (isStrongEvent(ev)) s._yrBud.strong++; if (roleOf(ev) === "flavor") s._yrBud.flavor++; } s._yrBud.used++; return ev; };
    // 1) 脊柱（人生主轴，免预算、优先）：创业 / 学术 / 工作场景 / 家庭
    if (s.startup && !has(s, "startup_done")) {
      const main = pool.filter(e => e.module === "startup");
      if (main.length && rnd(0.72)) return weightedPick(main, gm) || pick(main);
    }
    if (has(s, "academia_track") && !has(s, "left_academia")) {
      const acad = pool.filter(e => e.module === "degree");
      if (acad.length && rnd(0.5)) return weightedPick(acad, gm) || pick(acad);
    }
    if (s.workScene && s.job) {
      const scn = pool.filter(e => e.scene === "work");
      if (scn.length && rnd(0.4)) return weightedPick(scn, gm) || pick(scn);
    }
    if (has(s, "married") || has(s, "has_kid")) {   // 家庭场景：成家后适度把镜头给婚姻/育儿
      const fam = pool.filter(e => e.scene === "family" || e.module === "family");
      if (fam.length && rnd(0.22)) return weightedPick(fam, gm) || pick(fam);
    }
    // 2) 连续剧：续推不受强预算限制（别烂尾）；开新一条仅在强预算内
    const sagaCont = pool.filter(e => e.module === "saga" && !isSagaStarter(e));
    if (sagaCont.length && rnd(0.36)) return weightedPick(sagaCont, gm) || pick(sagaCont);
    if (strongOK) {
      const sagaStart = pool.filter(e => e.module === "saga" && isSagaStarter(e));
      if (sagaStart.length && rnd(0.14)) return bump(weightedPick(sagaStart, gm) || pick(sagaStart));
    }
    // 3) 世界联动：股灾 / 极端天气
    if (s.world && s.world.crash) { const crPool = pool.filter(e => e.module === "crash"); if (crPool.length && rnd(0.6)) return pick(crPool); }
    if (s.weekPlan && s.weekPlan.days.some(d => d.wx && d.wx.severe)) { const wxPool = pool.filter(e => e.module === "weather"); if (wxPool.length && rnd(0.55)) return pick(wxPool); }
    // 4) 年度预算 + 路线 gating。强预算耗尽 → 本年余下只放「非强戏剧」事件；调味事件也有年度上限
    let basePool = strongOK ? pool : pool.filter(e => !isStrongEvent(e));
    if (s._yrBud.flavor >= 3) { const nf = basePool.filter(e => roleOf(e) !== "flavor"); if (nf.length) basePool = nf; }   // 与创业无关的调味事件每年最多 3 个（留一点人生底色）
    if (!basePool.length) basePool = pool;
    const onroute = (gm && gm.bias) ? basePool.filter(e => gm.bias.includes(e.module)) : [];
    const cap = (routeRule() && routeRule().cap) || ANNUAL_EVENT_CAP;
    if (s._yrBud.used >= cap) {
      if (onroute.length && rnd(0.35)) return bump(weightedPick(onroute, gm) || pick(onroute));
      return null;
    }
    if (onroute.length && gm && rnd(gm.biasP)) return bump(weightedPick(onroute, gm) || pick(onroute));
    let cand = basePool;
    if (gm && gm.bias) {
      const offroute = basePool.filter(e => gm.bias.indexOf(e.module) < 0 && !UNIVERSAL_MODULES[e.module]);
      if (offroute.length && rnd(0.6)) { const trimmed = basePool.filter(e => offroute.indexOf(e) < 0); if (trimmed.length) cand = trimmed; }
    }
    return bump(weightedPick(cand, gm) || pick(cand));
  }
  // —— 多级分支事件 ——：当前节点 eventNode = {title?, text(s), choices[]}
  function nodeChoices(node) { return node.dynamicChoices ? node.dynamicChoices(s) : (node.choices || []); }
  function enterEvent(ev) {
    pendingEvent = ev; eventNode = { title: ev.title, text: ev.text, choices: nodeChoices(ev) };
    s._evDry = 0;                                                     // 触发了事件 → 重置「久旱」计数（pity timer）
    if (ev.once) flag(s, "ev_" + ev.id);                              // 标记一次性事件（修复 once 失效）
    if (isSagaStarter(ev)) s._lastSagaStart = s.week;
    s._cd = s._cd || {}; s._cd[ev.id] = s.week;                       // 记录冷却时间戳
    s._evHits = s._evHits || {}; s._evHits[ev.id] = (s._evHits[ev.id] || 0) + 1;   // 本局触发次数（供新鲜度降权，治「同一事件一辈子看十遍」）
    // 时代印记：记下你亲历过的时代大事件，死时回看「你活过的那个时代」
    if (ev.module === "world" || ev.module === "era" || ev.module === "history") {
      s.eraLog = s.eraLog || [];
      if (!s.eraLog.some(x => x.id === ev.id)) s.eraLog.push({ id: ev.id, age: s.age, title: (ev.title || "").replace(/^[^一-龥A-Za-z]+/, "") });
    }
  }
  function gotoNode(nx) {
    const node = typeof nx === "function" ? nx(s) : nx;
    eventNode = { title: pendingEvent.title, text: node.text, choices: nodeChoices(node) };
  }

  /* ============================ 渲染 ============================ */
  // 月末账单小说化卡片（进 weekLog 展示）
  function billCardHTML(bill, total, soldAsset, brokeMonths) {
    const rows = bill.items.map(it =>
      `<div class="bill-row"><span class="bill-l">${it.emoji} ${it.label}${it.note ? `<i class="bill-note">${it.note}</i>` : ""}</span><b class="bill-a">-¥${it.amount.toLocaleString()}</b></div>`
    ).join("");
    const cashNow = Math.round(s.cash || 0);
    const cls = brokeMonths ? " bill-broke" : (cashNow < 0 ? " bill-warn" : "");
    return `<div class="billcard${cls}">
      <div class="bill-h">🧾 ${s.age} 岁 · 月末账单</div>
      ${rows}
      ${soldAsset > 0 ? `<div class="bill-row bill-sold"><span class="bill-l">🏚️ 变卖资产抵账</span><b class="bill-a">+¥${soldAsset.toLocaleString()}</b></div>` : ""}
      <div class="bill-row bill-total"><span class="bill-l">合计支出</span><b class="bill-a">-¥${total.toLocaleString()}</b></div>
      <div class="bill-row bill-cash"><span class="bill-l">账上余额</span><b class="bill-a">${cashNow < 0 ? "欠 ¥" + (-cashNow).toLocaleString() : "¥" + cashNow.toLocaleString()}</b></div>
      ${brokeMonths ? `<div class="bill-starve">⚠️ 已断炊 ${brokeMonths} 个月——再不搞到钱，会饿出大病</div>` : ""}
    </div>`;
  }
  // 月末小记：把「又扣了一笔钱」写成一段有季节、有处境的人生场景（账单卡之前登场，做月度锚点）
  function monthlyScene(s, ctx) {
    const wk = ((s.week % 52) + 52) % 52;
    const season = wk < 13 ? "春寒料峭，街角的玉兰开了又谢" : wk < 26 ? "入夏了，空调外机彻夜嗡嗡作响" : wk < 39 ? "秋意渐浓，傍晚的风里有了凉意" : "又是一年最冷的时候，暖气片烫得发响";
    if (ctx.broke) {
      const m = ctx.brokeMonths || 1;
      const lines = [
        `${season}。月底了，钱包空空，你盯着这张账单，第一次认真琢磨：下一顿，在哪儿。`,
        `${season}。又是揭不开锅的一个月，你把一个馒头掰成两顿，省下的每一块钱都在发烫。`,
        `${season}。连着几个月断炊，身体一天天垮下去——再不搞到钱，真要饿出人命了。`
      ];
      return lines[Math.min(m - 1, lines.length - 1)];
    }
    if (ctx.soldAsset > 0) return `${season}。这个月入不敷出，你忍痛变卖了点家当才把窟窿填上。看着资产又缩水一截，心里不是滋味。`;
    const runway = ctx.total > 0 ? ((s.cash || 0) + (s.assets || 0)) / ctx.total : 99;
    if (runway > 14) return `${season}。月底结账，数字看着踏实——钱不是问题，至少现在还不是。`;
    if (runway > 5) return `${season}。又一个月翻篇了。账单照例来敲门，你照例付清，日子就在这一进一出之间，稳稳地往前走。`;
    return `${season}。月底了，你捏着账单算了又算，离月光只差那么一点。这种紧巴巴的滋味，你太熟悉了。`;
  }
  // ★月度结算单弹窗★：每月把一整张收支账单可视化地拍到玩家面前
  function renderBill() {
    const b = s._pendingBill;
    const yuan = n => "¥" + Math.round(n).toLocaleString();
    const incRows = (b.income && b.income.length)
      ? b.income.map(it => `<div class="bl-row bl-inc"><span class="bl-l">${it.emoji} ${it.label}</span><b class="bl-a">+${yuan(it.amount)}</b></div>`).join("")
      : `<div class="bl-row bl-none"><span class="bl-l">🪹 本月没有工资进账</span><b class="bl-a">¥0</b></div>`;
    const expRows = b.expenses.map(it => `<div class="bl-row"><span class="bl-l">${it.emoji} ${it.label}${it.note ? `<i class="bl-note">${it.note}</i>` : ""}</span><b class="bl-a bl-exp">-${yuan(it.amount)}</b></div>`).join("");
    const cls = b.broke ? " bl-broke" : (b.net < 0 ? " bl-warn" : " bl-good");
    app().innerHTML = `<div class="screen billscreen">
      <div class="bill-modal${cls}">
        <div class="bl-head">🧾 月度结算单</div>
        <div class="bl-sub">${b.age} 岁 · ${b.year} 年 · 第 ${Math.ceil((((s.week - 1) % 52) + 1) / 4)} 个结算月</div>
        <div class="bl-scene">📖 ${b.scene}</div>
        <div class="bl-sec"><div class="bl-sec-h">📥 本月收入</div>${incRows}
          <div class="bl-row bl-sum"><span class="bl-l">收入合计</span><b class="bl-a bl-inc">+${yuan(b.totalIncome)}</b></div></div>
        <div class="bl-sec"><div class="bl-sec-h">📤 本月支出</div>${expRows}
          ${b.soldAsset > 0 ? `<div class="bl-row bl-sold"><span class="bl-l">🏚️ 变卖资产抵账</span><b class="bl-a bl-inc">+${yuan(b.soldAsset)}</b></div>` : ""}
          <div class="bl-row bl-sum"><span class="bl-l">支出合计</span><b class="bl-a bl-exp">-${yuan(b.totalExpense)}</b></div></div>
        <div class="bl-net"><span>本月结余</span><b class="${b.net >= 0 ? "pos" : "neg"}">${b.net >= 0 ? "+" : "-"}${yuan(Math.abs(b.net))}</b></div>
        <div class="bl-bal"><span>账上余额</span><b class="${b.balance < 0 ? "neg" : ""}">${b.balance < 0 ? "欠 " + yuan(-b.balance) : yuan(b.balance)}</b></div>
        ${b.broke ? `<div class="bl-starve">⚠️ 已断炊 ${b.brokeMonths} 个月——再不搞到钱，会饿出大病。快去「上班/找工作/搞副业」弄点进账！</div>` : (b.net < 0 ? `<div class="bl-tip">💡 这个月入不敷出，老本在缩水。多上班、搞副业，或省点开销吧。</div>` : "")}
        <button class="btn primary" id="billok">${b.broke ? "唉……继续撑 →" : "知道了，继续生活 →"}</button>
      </div></div>`;
    const ok = document.getElementById("billok");
    if (ok) ok.onclick = () => { s._pendingBill = null; if (!s.alive) { screen = "dead"; } else { screen = "play"; } render(); };
  }
  const app = () => document.getElementById("app");
  const SN = C.STAT_NAMES;
  function statBar(k) { const v = s.stats[k]; return `<div class="stat"><span class="stat-l">${SN[k]}</span><span class="stat-bar"><i class="b-${k}" style="width:${v}%"></i></span><span class="stat-v">${v}</span></div>`; }
  function relationStatus() {
    if (has(s, "married")) return has(s, "has_kid") ? "💍 已婚 · 有孩子" : "💍 已婚";
    if (has(s, "divorced")) return "💔 离异";
    if (has(s, "partner")) return `💕 恋爱中${s.partnerName ? " · " + s.partnerName : ""}`;
    if (s.crush || has(s, "crush")) return "🌙 暧昧中";
    return "🧍 单身";
  }
  function careerStatus() {
    if (s.startup && s.startup.fulltime && !has(s, "startup_done")) return `🚀 全职创业 · ${s.startup.name || s.startup.track || "项目"}`;
    if (s.startup && !has(s, "startup_done")) return `🚀 创业中 · ${s.startup.name || s.startup.track || "项目"}`;
    if (has(s, "civil_servant")) return `🏛️ 体制内${s.civilRank ? " · " + (["", "科员", "副科", "正科", "副处", "正处"][s.civilRank] || "干部") : ""}`;
    if (s.job) return `💼 ${s.job.name}${s.job.level ? " · Lv." + s.job.level : ""}${s.workScene ? " · " + s.workScene.name : ""}`;
    if (has(s, "lie_flat")) return "🛋️ 躺平生活";
    return "💼 无正式工作";
  }
  function healthStatus() {
    const h = Math.round(s.health), p = Math.round(s.stress || 0);
    if (h >= 82 && p < 35) return `💚 状态良好 · 健康${h}`;
    if (h >= 65 && p < 55) return `❤️ 基本健康 · 健康${h}`;
    if (h >= 45) return `🟠 亚健康 · 健康${h}`;
    if (h >= 25) return `🔴 身体报警 · 健康${h}`;
    return `☠️ 濒危状态 · 健康${h}`;
  }
  function ailmentText() {
    if (!s.ailmentIds || !s.ailmentIds.length) return "🩺 暂无明确疾病/暗伤";
    return s.ailmentIds.map(id => { const a = C.ailments.find(x => x.id === id); return `🩸${a ? a.name : id}`; }).join(" ");
  }
  function homeStatus() {
    const tags = [];
    if (has(s, "has_house")) tags.push("有房");
    if (has(s, "has_car")) tags.push("有车");
    if (has(s, "overseas")) tags.push("海外生活");
    if (has(s, "has_pet")) tags.push("有宠物");
    return tags.length ? tags.join(" · ") : "漂着";
  }

  function familyStatus() {
    if (!(has(s, "married") || has(s, "partner") || has(s, "has_kid") || has(s, "co_parenting"))) return "";
    const f = typeof familyEnsure === "function" ? familyEnsure(s) : (s.family || {});
    const bits = [];
    if (has(s, "married") || has(s, "partner")) bits.push(`💞亲密 ${Math.round(f.bond || 0)}`, `🌡️矛盾 ${Math.round(f.conflict || 0)}`);
    if (has(s, "has_kid") || has(s, "co_parenting")) bits.push(`👪育儿 ${Math.round(f.coParent || 0)}`);
    if (has(s, "separated")) bits.push("分居中");
    if (has(s, "co_parenting")) bits.push("共同育儿");
    return bits.length ? `<div class="res family-line">${bits.join("　")}</div>` : "";
  }

  function dashboard() {
    const st = stageOf(s.age);
    const cls = C.CLASS_NAMES[classTier(s)];
    const cof = s.startup && s.startup.cofounder ? `　🤝${s.startup.cofounder.emoji}${s.startup.cofounder.name}` : "";
    const su = s.startup && !has(s, "startup_done") ? `<span class="su-mini">🚀创业估值 ¥${s.startup.valuation.toLocaleString()}${cof}</span>` : "";
    const w = s.world || {};
    const mo = Math.round(w.momentum || 0);
    const moTxt = mo > 25 ? `<b style="color:var(--green)">顺风顺水 +${mo}</b>` : mo < -25 ? `<b style="color:var(--red)">霉运缠身 ${mo}</b>` : `平稳 ${mo > 0 ? "+" + mo : mo}`;
    const settledTxt = s.city ? C._util.cityFull(s.city) : "—";   // 定居城市（长期落脚的家，搬家才变）
    const away = s.away;                                            // 当前不在定居地（出门旅行/在外）时记录
    const curTxt = away ? away.name : settledTxt;                   // 当前所在城市
    const birthTxt = s.birthplace ? s.birthplace.path : "—";
    const jobTxt = careerStatus();
    const relTxt = relationStatus();
    const locChips = away
      ? `<span class="loc-away" title="你这阵子出门在外，人不在定居城市">📍当前 ${curTxt} 🧳</span><span title="你长期落脚的家">🏠定居 ${settledTxt}</span>`
      : `<span title="你此刻所在的城市">📍当前 ${curTxt}</span><span title="你长期落脚的家">🏠定居 ${settledTxt}</span>`;
    return `<div class="dash">
      <div class="dash-top">
        <div><div class="age">${s.age}<small>岁</small> <span class="wk">第${s.week % 52 + 1}周</span></div><div class="cls">${s.playerName || "无名之人"} · ${st.name} · ${cls}</div>
          <div class="profile-grid">
            ${locChips}<span>${jobTxt}</span>
            ${s.major && C._util.majorName ? `<span title="你大学读的专业">🎓 ${(s.education && s.education.degree) || "本科"}·${C._util.majorName(s)}</span>` : ""}
            <span>${relTxt}</span><span>${healthStatus()}</span><span>🧠 压力 ${Math.round(s.stress)}</span><span>🏠 ${homeStatus()}</span>
          </div>
          <div class="res">籍贯：${birthTxt}</div>${familyStatus()}</div>
        <div class="worth"><small title="现金+资产+持仓市值的总身价（导航栏右上角是可用现金，不重复显示）">${s.year} 年 · 身价</small><b>¥${Math.round(netWorth(s)).toLocaleString()}</b>
          ${(() => { const mb = C._util.monthlyBill ? C._util.monthlyBill(s) : null; if (!mb) return ""; const runway = mb.total > 0 ? ((s.cash || 0) + (s.assets || 0)) / mb.total : 99; const warn = runway < 6; const wToBill = (4 - (s.week % 4)) % 4 || 4; const dayTxt = s.job ? `　💰发薪/账单：还有 ${wToBill} 周` : `　🧾房租/账单：还有 ${wToBill} 周`; return `<div class="res ${warn ? "runway-warn" : ""}" title="每月账单合计；坐吃山空能撑的月数（现金+资产÷月账单）；距下次月度结算（发薪+扣账单）的周数">🧾 月账单 ≈¥${mb.total.toLocaleString()}${has(s, "starving") ? "　🆘已断炊" : runway < 99 ? `　⏳可撑 ${runway < 0 ? 0 : Math.floor(runway)} 个月` : ""}${dayTxt}</div>`; })()}
          ${(w.priceIndex || 1) >= 1.25 ? `<div class="res" style="color:var(--dim)" title="按开局物价折算的实际购买力——通胀让名义数字虚胖，这才是真金白银">≈ 开局购买力 ¥${Math.round(netWorth(s) / w.priceIndex).toLocaleString()}（物价×${(w.priceIndex).toFixed(2)}）</div>` : ""}
          <div class="res">❤️健康 ${Math.round(s.health)}　🙂心情 ${Math.round(s.mood)}　😣压力 ${Math.round(s.stress)}</div>
          <div class="res">🤝人脉 ${Math.round(s.network)}　⭐声誉 ${Math.round(s.reputation)}　${su}</div></div>
      </div>
      <div class="bars">${C.STAT_KEYS.map(statBar).join("")}</div>
      <div class="world-row">🌍 物价 ×${(w.priceIndex || 1).toFixed(2)}　📊 就业景气 ${Math.round(w.jobMarket || 0)}　🌪️ 风口热度 ${Math.round(w.windHeat || 0)}　🎲 运势 ${moTxt}</div>
      ${(() => { const ps = C._util.profileSummary ? C._util.profileSummary(s) : ""; return ps ? `<div class="profile-line" title="社会画像：解释你为什么在某些场合顺、某些场合难">🪪 ${ps}</div>` : ""; })()}
      ${(() => { if (window.MVP_00_CAREER) return ""; const inf = C._util.influenceSummary ? C._util.influenceSummary(s) : ""; const arc = (C._util.mainArcOf && C._util.mainArcOf(s)); const arcTxt = arc ? `📖 ${arc.name}${s.mainArc ? `·第${(s.mainArc.act || 0) + 1}幕` : ""}` : ""; return (inf || arcTxt) ? `<div class="arc-line">${arcTxt}${inf ? `${arcTxt ? "　" : ""}🏛️ 影响力：${inf}` : ""}</div>` : ""; })()}
      ${(() => { if (!s.cast) return ""; const crisis = Object.keys(s.cast).map(k => s.cast[k]).filter(c => c.crisis); if (!crisis.length) return ""; const labels = { debt: "陷入债务", illness: "家中有人病了", startup_invite: "想拉你合伙", layoff: "被裁了", reunite: "想和你复合" }; return `<div class="cast-line">👥 ${crisis.slice(0, 2).map(c => `${c.name}(${c.role})${labels[c.crisis] || "有事找你"}`).join("　")}</div>`; })()}
      ${(() => { if (window.MVP_00_CAREER) return ""; if (!C._util.founderReadiness) return ""; if (has(s, "startup_done") || (s.startup && s.startup.fulltime)) return ""; const r = C._util.founderReadiness(s); const v = C._util.readinessVerdict ? C._util.readinessVerdict(s) : ""; const col = r >= 70 ? "var(--green)" : r >= 40 ? "var(--amber)" : "var(--dim)"; return `<div class="founder-line"><div class="fl-bar-row"><span class="fl-lbl" title="离职创业/跳槽/单干/仲裁……翻身的本钱">💪 翻身底牌</span><span class="fl-bar"><i style="width:${r}%;background:${col}"></i></span><span class="fl-v">${r}</span></div>${v ? `<div class="fl-verdict">${v}</div>` : ""}</div>`; })()}
      ${goalBarHTML()}
      <div class="ail-row">${ailmentText()}</div></div>`;
  }
  // 手机时间显示（伪）：用周数推个 hh:mm，纯装饰
  function phoneClock() { const m = (s.week * 17) % (24 * 60); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }
  // 渲染一条新闻卡片
  function newsCard(n) {
    const tag = n.early ? '<span class="nc-omen">🌱 苗头</span>'
      : n.kind === "policy" ? '<span class="nc-policy">政策</span>'
      : n.kind === "international" ? '<span class="nc-intl">国际</span>'
      : n.kind === "regulation" ? '<span class="nc-policy">监管</span>'
      : n.kind === "crisis" ? '<span class="nc-hot">风险</span>'
      : n.signal ? "" : (Math.random() < 0.3 ? '<span class="nc-hot">🔥热</span>' : "");
    return `<div class="nc ${n.early ? "nc-early" : ""}"><div class="nc-top"><span class="nc-src">${n.source}</span>${tag}</div>
      <div class="nc-title">${n.headline}</div><div class="nc-body">${n.body}</div></div>`;
  }
  // 手机外壳 + 可下滑新闻流。full=沉浸大屏（深扒）
  // 趋势嗅探：玩家多次读到同向新闻 → 看出趋势（knownSignals），在新闻流顶部给出可读提示
  const SIGNAL_LABEL = { ai_boom: "AI 风口正热", shipping_crisis: "航运/供应链紧张", fraud_surge: "电诈高发期", edu_crackdown: "教培监管收紧", consume_downgrade: "消费降级", silver_wave: "老龄化加深", platform_margin: "跨境平台收紧" };
  function trendStrip() {
    if (!s.knownSignals) return "";
    const hot = Object.keys(s.knownSignals).filter(id => (s.knownSignals[id].confidence || 0) >= 50 && SIGNAL_LABEL[id]);
    if (!hot.length) return "";
    const chips = hot.slice(0, 4).map(id => `<span class="trend-chip">${SIGNAL_LABEL[id]}</span>`).join("");
    return `<div class="trend-strip"><span class="trend-h">📡 你嗅到的趋势</span>${chips}<div class="trend-tip">读懂了，就能比别人早一步押对赛道、躲开坑。</div></div>`;
  }
  function phoneFeed(items, full) {
    const cls = full ? "phone phone-full" : "phone";
    return `<div class="${cls}">
      <div class="phone-notch"></div>
      <div class="phone-status"><span>${phoneClock()}</span><span>${s.year}年</span><span>📶 🔋</span></div>
      <div class="phone-app"><span class="pa-title">📰 今日头条</span><span class="pa-sub">下拉刷新 · 风口藏在字缝里</span></div>
      ${trendStrip()}
      <div class="phone-feed">${items.map(newsCard).join("")}</div>
    </div>`;
  }

  function renderTitle() {
    const M = C._util.loadMeta();
    const total = C._util.ACHIEVEMENTS.length;
    const got = Object.keys(M.achievements || {}).length;
    const heirs = ((M.legacy || {}).children || []).filter(c => !c.age || c.age >= 18);
    const diffBtns = Object.keys(DIFFS).map(k => `<button class="diffbtn ${gameDiff === k ? "on" : ""}" data-diff="${k}">${DIFFS[k].emoji} ${k}</button>`).join("");
    app().innerHTML = `<div class="screen title">
      <div class="logo">荒诞 · 人生<br><span>ABSURD LIFE SIM</span></div>
      <p class="tag">你的属性决定你能走的路、遇见的人、和别人对你的态度。<br>健康只决定你哪天离场。剩下的故事，你自己写。</p>
      <div class="diffpick"><span class="diff-lbl">难度</span>${diffBtns}<div class="diff-note">${DIFFS[gameDiff].label}</div></div>
      <button class="btn primary" id="start">投胎 →</button>
      ${heirs.length ? `<button class="btn" id="legacykids">从上一代孩子成年开始 · ${heirs.length} 人</button>` : ""}
      <button class="btn" id="gallery">🏅 图鉴 · 成就 ${got}/${total}${M.lives ? ` · 已轮回 ${M.lives} 世` : ""}</button>
      <p class="ver">原型 v0.4 · 周推进 · 行动驱动 · 多维叙事 · 概率结局</p></div>`;
    document.querySelectorAll(".diffbtn").forEach(b => b.onclick = () => { gameDiff = b.dataset.diff; renderTitle(); });
    document.getElementById("start").onclick = () => { screen = "cohort"; render(); };
    const lk = document.getElementById("legacykids"); if (lk) lk.onclick = () => { screen = "legacykids"; render(); };
    document.getElementById("gallery").onclick = () => { screen = "gallery"; render(); };
  }

  function renderLegacyKids() {
    const M = C._util.loadMeta();
    const lg = M.legacy || {};
    const kids = (lg.children || []).filter(c => !c.age || c.age >= 18);
    if (!kids.length) { screen = "title"; render(); return; }
    const cards = kids.map((c, i) => {
      const trait = c.trait === "supported" ? "被支持过" : c.trait === "arranged" ? "被安排过" : c.trait === "independent" ? "早早独立" : "普通成年";
      return `<div class="bgcard" data-kid="${i}"><div class="bg-emoji">🧬</div><div class="bg-name">${c.name} <small>${c.gender || ""}</small></div><div class="bg-desc">${c.relation || "子女"} · ${c.age || 18}岁 · ${trait}<br>${c.note || "上一代人生留下的孩子，终于站到自己的起跑线前。"}</div></div>`;
    }).join("");
    const PRIV_L = { family_business: "家族企业", overseas_status: "海外身份", house_local: "本地房产", parent_safety_net: "父母托底" };
    const STIG_L = { family_debt: "家族债务", bad_credit: "征信瑕疵", gray_suspect: "灰色嫌疑", lawsuit: "官司缠身" };
    const ltags = [];
    if (lg.companyLegacy) ltags.push(lg.companyLegacy.status === "listed" ? "🏛️ 前代公司已上市（资源+公众压力）" : lg.companyLegacy.status === "failed" ? "📉 前代公司暴雷（债务+污点）" : "🏢 前代留有公司");
    ((lg.profileLegacy && lg.profileLegacy.privilege) || []).forEach(p => ltags.push("✨ " + (PRIV_L[p] || p)));
    ((lg.profileLegacy && lg.profileLegacy.stigma) || []).forEach(p => ltags.push("⚠️ " + (STIG_L[p] || p)));
    (lg.familyWounds || []).forEach(w => ltags.push("🩹 " + w.label));
    if ((lg.worldImpacts || []).length) ltags.push("🌍 前代改变过的行业余波");
    const legacyTags = ltags.length ? `<div class="legacy-tags"><div class="lt-h">🧬 你将从上一代继承</div>${ltags.map(t => `<span class="ltag">${t}</span>`).join("")}</div>` : "";
    app().innerHTML = `<div class="screen"><h2>选择继承者</h2><p class="sub">从上一代「${lg.fromName || "主角"}」的孩子成年开始。你会继承少量家底、家族痕迹，以及上一代的余波。</p>
      ${legacyTags}
      <div class="bggrid">${cards}</div>
      <div class="dead-btns"><button class="btn" id="legacyback">← 返回</button><button class="btn" id="freshlife">不继承，重新投胎</button></div></div>`;
    document.querySelectorAll("[data-kid]").forEach(el => el.onclick = () => { startLegacyChildDraft(kids[+el.dataset.kid]); screen = "namepick"; render(); });
    document.getElementById("legacyback").onclick = () => { screen = "title"; render(); };
    document.getElementById("freshlife").onclick = () => { screen = "cohort"; render(); };
  }

  function renderNamePick() {
    if (!draft) startDraft(defaultCohort());
    const suggested = draft.playerName || defaultPlayerName(draft.gender);
    app().innerHTML = `<div class="screen"><h2>给自己起个名字</h2><p class="sub">名字不会改变数值，但会进入时间线、结局和家族传承。</p>
      <div class="namebox"><label>角色姓名</label><input id="playerNameInput" maxlength="12" value="${suggested}"><small>${draft.legacyChild ? "这是上一代的孩子。你可以沿用原名，也可以改名。" : "不填会自动生成一个名字。"}</small></div>
      <div class="dead-btns"><button class="btn" id="nameback">← 返回</button><button class="btn primary" id="nameto">继续 →</button></div></div>`;
    document.getElementById("nameback").onclick = () => { screen = draft.legacyChild ? "legacykids" : "birthplace"; render(); };
    document.getElementById("nameto").onclick = () => {
      const v = document.getElementById("playerNameInput").value.trim();
      draft.playerName = (v || suggested).slice(0, 12);
      if (draft.legacyChild) { screen = "gear"; }
      else { draft.stepIndex = 0; screen = "create"; }
      render();
    };
  }

  // 🏅 图鉴：跨局累计的成就墙 + 死法/结局收藏 + 统计
  function renderGallery() {
    const M = C._util.loadMeta();
    const unl = C._util.metaUnlocked ? C._util.metaUnlocked(M) : {};
    const achHTML = C._util.ACHIEVEMENTS.map(a => {
      const got = !!(M.achievements || {})[a.id];
      return `<div class="gal-ach ${got ? "got" : "locked"}"><div class="ga-emoji">${got ? a.emoji : "🔒"}</div><div class="ga-txt"><b>${got ? a.name : "？？？"}</b><small>${got ? a.desc : "尚未解锁"}</small></div></div>`;
    }).join("");
    const deaths = Object.keys(M.deaths || {});
    const endings = Object.keys(M.endings || {});
    const got = Object.keys(M.achievements || {}).length;
    const total = C._util.ACHIEVEMENTS.length;
    const avgAge = M.lives ? Math.round((M.totalAge || 0) / M.lives) : 0;
    const collHTML = (arr, empty) => arr.length ? arr.map(x => `<span class="coll-chip">${x}</span>`).join("") : `<span class="coll-empty">${empty}</span>`;
    app().innerHTML = `<div class="screen gallery">
      <h2>🏅 人生图鉴</h2>
      <div class="gal-stats">
        <div class="gs"><small>解锁成就</small><b>${got}/${total}</b></div>
        <div class="gs"><small>累计轮回</small><b>${M.lives || 0} 世</b></div>
        <div class="gs"><small>历史最高身价</small><b>¥${(M.bestNW || 0).toLocaleString()}</b></div>
        <div class="gs"><small>平均寿命</small><b>${avgAge} 岁</b></div>
      </div>
      <div class="gal-sec-h">成就墙</div>
      <div class="gal-achs">${achHTML}</div>
      <div class="gal-sec-h">见过的离场方式</div>
      <div class="gal-coll">${collHTML(deaths, "还没有任何记录——去活过一生吧。")}</div>
      <div class="gal-sec-h">收集到的结局称号</div>
      <div class="gal-coll">${collHTML(endings, "暂无。每一种结局都值得被记住。")}</div>
      <div class="gal-sec-h">跨局解锁 · 集齐条件喂出新内容</div>
      <div class="gal-unlocks">${(C._util.UNLOCKS || []).map(u => { const on = unl[u.id]; return `<div class="gal-unlock ${on ? "on" : "off"}"><div class="gu-ico">${on ? u.name.split(" ")[0] : "🔒"}</div><div class="gu-txt"><b>${u.name} <span class="gu-state ${on ? "on" : "off"}">${on ? "已解锁" : "未解锁"}</span></b><small>${u.kind}｜${u.desc}</small><div class="gu-req">条件：${u.reqText}</div></div></div>`; }).join("")}</div>
      <button class="btn primary" id="galback">← 返回</button></div>`;
    document.getElementById("galback").onclick = () => { screen = s && s.alive === false ? "dead" : "title"; render(); };
  }

  function renderCohort() {
    if (!draft) startDraft(defaultCohort());
    const cunl = C._util.metaUnlocked ? C._util.metaUnlocked() : {};
    const cards = C.cohorts.map(c => {
      const locked = c.locked && !cunl[c.locked];
      const reqTxt = locked ? `<span class="lock-req">🔒 ${(C._util.unlockById(c.locked) || {}).reqText || "尚未解锁"}</span>` : "";
      return `<div class="bgcard ${draft.cohort.id === c.id ? "sel" : ""} ${locked ? "locked" : ""}" ${locked ? "" : `data-id="${c.id}"`}><div class="bg-photo" style="${C.images.styleBg("era_" + c.id, 500, "card")}"></div><div class="bg-emoji">${locked ? "🔒" : c.emoji}</div><div class="bg-name">${c.name}</div><div class="bg-desc">${c.vibe}</div>${reqTxt}</div>`;
    }).join("");
    app().innerHTML = `<div class="screen"><h2>选择出生年代</h2><p class="sub">不同世代，在不同年龄撞上不同的大环境与风口。</p>
      <div class="bggrid">${cards}</div>
      <div class="yearpick">性别：
        <button class="gbtn ${draft.gender === "男" ? "sel" : ""}" data-g="男">♂ 男</button>
        <button class="gbtn ${draft.gender === "女" ? "sel" : ""}" data-g="女">♀ 女</button>
        <span style="margin-left:14px">取向：</span>
        <button class="gbtn ${draft.orientation === "异" ? "sel" : ""}" data-o="异">异性</button>
        <button class="gbtn ${draft.orientation === "同" ? "sel" : ""}" data-o="同">同性</button>
        <button class="gbtn ${draft.orientation === "双" ? "sel" : ""}" data-o="双">双性</button>
        <span style="margin-left:14px">出生年份：</span><button class="step" id="ym">−</button><b id="yv">${draft.birthYear}</b><button class="step" id="yp">+</button>
        <span class="year-hint">（18 岁时是 ${draft.birthYear + 18} 年）</span></div>
      <button class="btn primary" id="next">开始塑造你的成长 →</button></div>`;
    document.querySelectorAll(".bgcard[data-id]").forEach(el => el.onclick = () => { const g = draft.gender, o = draft.orientation; startDraft(C.cohorts.find(c => c.id === el.dataset.id)); draft.gender = g; draft.orientation = o; renderCohort(); });
    document.querySelectorAll(".gbtn").forEach(el => el.onclick = () => { if (el.dataset.g) draft.gender = el.dataset.g; if (el.dataset.o) draft.orientation = el.dataset.o; renderCohort(); });
    document.getElementById("ym").onclick = () => { draft.birthYear = Math.max(1960, draft.birthYear - 1); document.getElementById("yv").textContent = draft.birthYear; document.querySelector(".year-hint").textContent = `（18 岁时是 ${draft.birthYear + 18} 年）`; };
    document.getElementById("yp").onclick = () => { draft.birthYear = Math.min(2020, draft.birthYear + 1); document.getElementById("yv").textContent = draft.birthYear; document.querySelector(".year-hint").textContent = `（18 岁时是 ${draft.birthYear + 18} 年）`; };
    document.getElementById("next").onclick = () => { bpSel = bpSel || {}; screen = "birthplace"; render(); };
  }

  /* ============================ 出生地：可点击的「中国」省份图 → 下钻到村 ============================ */
  // 经济档 → 颜色（深色海面上的协调色板：暖金→玉绿→雾蓝→陶土）
  const GEO_ECON_COLOR = { "富庶": "#eab64e", "小康": "#57bf97", "普通": "#7396d4", "欠发达": "#cb8a63" };
  function geoEconColor(econ) { return GEO_ECON_COLOR[econ] || "#7396d4"; }
  // 13 省在画布上的地理化坐标（仿中国轮廓的相对位置）
  const GEO_POS = {
    saibei: [470, 92], liaodong: [726, 120], longyou: [250, 178], jingji: [560, 196],
    xichui: [120, 300], zhongzhou: [468, 262], bashu: [300, 360], chuxiang: [486, 384],
    jiangnan: [676, 322], huhai: [806, 330], donghai: [858, 426], miaoling: [300, 484], lingnan: [602, 500]
  };
  // 合并 origin：村 → 县 → 市 → 省，取第一个非空字段
  function geoMergedOrigin(prov, city, county, village) {
    const out = { cashMul: 1, network: 0, tags: [], note: "" };
    const layers = [village, county, city, prov].filter(Boolean);
    // cashMul / network / note 取最具体一层的值；tags 累积
    let gotMul = false, gotNet = false, gotNote = false;
    for (const L of layers) {
      const o = L.origin; if (!o) continue;
      if (!gotMul && o.cashMul != null) { out.cashMul = o.cashMul; gotMul = true; }
      if (!gotNet && o.network != null) { out.network = o.network; gotNet = true; }
      if (!gotNote && o.note) { out.note = o.note; gotNote = true; }
      if (o.tags) out.tags.push(...o.tags);
    }
    out.tags = [...new Set(out.tags)];
    return out;
  }
  function geoProv(id) { return C.geo.provinces.find(p => p.id === id); }
  const BP_PROV = "sichuan";   // 目前只开放蜀中省（成都2026地图）；其余省份地图未做
  function bpRandom() {
    const prov = geoProv(BP_PROV) || C.geo.provinces[0];
    const city = pick(prov.cities || []);
    const county = city ? pick(city.counties || []) : null;
    const village = county ? pick(county.villages || []) : null;
    bpSel = { provinceId: prov.id, city, county, village };
  }
  function renderBirthplace() {
    const provs = C.geo.provinces;
    bpSel = bpSel || {};
    // 锁定蜀中省：清掉任何非蜀中省的旧选择，直接进入选市
    if (bpSel.provinceId !== BP_PROV) bpSel = { provinceId: BP_PROV };
    const prov = geoProv(BP_PROV);
    // —— 真实中国省界 SVG（geo-svg.js）：仅蜀中省可选，其余地图灰锁 ——
    const gs = C.geoSvg;
    const selId = prov ? prov.id : null;
    const pathEls = gs.paths.map(pp => {
      const open = pp.fid === BP_PROV;
      const pv = geoProv(pp.fid); const color = open ? geoEconColor(pv ? pv.econ : "普通") : "#33404f";
      return `<path class="bp-rp ${selId === pp.fid ? "sel" : ""}${open ? " bp-open" : " bp-locked"}" data-prov="${pp.fid}" d="${pp.d}" fill="${color}" ${open ? "" : 'opacity="0.4"'}></path>`;
    }).join("");
    const labelEls = gs.labels.map(l => `<text class="bp-rlabel ${selId === l.fid ? "sel" : ""}${l.fid === BP_PROV ? "" : " bp-locked"}" data-prov="${l.fid}" x="${l.x}" y="${l.y}" ${l.fid === BP_PROV ? "" : 'opacity="0.35"'}>${l.fid === BP_PROV ? l.name : "🔒"}</text>`).join("");
    const svg = `<svg class="bp-map" viewBox="${gs.viewBox}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bpOcean" cx="50%" cy="36%" r="78%">
          <stop offset="0%" stop-color="#13283e"></stop><stop offset="100%" stop-color="#0a121c"></stop>
        </radialGradient>
        <filter id="bpShadow" x="-6%" y="-6%" width="112%" height="112%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#02060c" flood-opacity="0.55"></feDropShadow>
        </filter>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#bpOcean)"></rect>
      <g filter="url(#bpShadow)">${pathEls}</g>${labelEls}</svg>`;
    const legend = `<div class="bp-legend">${["富庶", "小康", "普通", "欠发达"].map(e => `<span><i style="background:${geoEconColor(e)}"></i>${e}</span>`).join("")}</div>`;
    // —— 右侧下钻面板 ——
    let panel;
    if (!prov) {
      panel = `<div class="bp-hint">点击地图上的省份，一级级往下选到你的出生村落。<br>不同的出身，给你不同的起手家底、人脉与风土。</div>`;
    } else {
      const econTag = `<span class="bp-tag">${prov.econ}</span>`;
      const cityList = (prov.cities || []).map((c, i) => `<button class="bp-item ${bpSel.city === c ? "on" : ""}" data-city="${i}">🏙️ ${c.name} <small>${c.tier || ""}</small></button>`).join("");
      let sub = "";
      if (bpSel.city) {
        const counties = (bpSel.city.counties || []).map((co, i) => `<button class="bp-item ${bpSel.county === co ? "on" : ""}" data-county="${i}">🏘️ ${co.name}</button>`).join("");
        sub += `<div class="bp-sub-h">${bpSel.city.name} · 区县</div><div class="bp-items">${counties}</div>`;
        if (bpSel.county) {
          const villages = (bpSel.county.villages || []).map((v, i) => `<button class="bp-item ${bpSel.village === v ? "on" : ""}" data-village="${i}">🌾 ${v.name}</button>`).join("");
          sub += `<div class="bp-sub-h">${bpSel.county.name} · 村落</div><div class="bp-items">${villages}</div>`;
        }
      }
      const merged = geoMergedOrigin(prov, bpSel.city, bpSel.county, bpSel.village);
      const deepest = bpSel.village || bpSel.county || bpSel.city || prov;
      const path = [prov.name, bpSel.city && bpSel.city.name, bpSel.county && bpSel.county.name, bpSel.village && bpSel.village.name].filter(Boolean).join(" · ");
      panel = `<div class="bp-panel-h">${prov.name} ${econTag}</div>
        <div class="bp-desc">${prov.desc || ""}</div>
        <div class="bp-sub-h">${prov.name} · 城市</div><div class="bp-items">${cityList}</div>${sub}
        <div class="bp-pick-card">
          <div class="bp-pick-path">📍 ${path}</div>
          <div class="bp-pick-note">${deepest.desc || ""}</div>
          <div class="bp-pick-mods">起手家底 ×${merged.cashMul} ｜ 人脉 ${merged.network >= 0 ? "+" : ""}${merged.network} ${merged.tags.length ? "｜ " + merged.tags.map(t => "#" + t).join(" ") : ""}</div>
          <div class="bp-pick-flavor">${merged.note || ""}</div>
          <button class="btn primary" id="bpconfirm">就生在这儿 →</button>
        </div>`;
    }
    app().innerHTML = `<div class="screen bp-screen">
      <h2>选择出生地</h2><p class="sub">投胎是门玄学。<b style="color:var(--amber)">目前只开放「蜀中省」（成都 2026）</b>——其余地区的地图还在路上，先在天府之国安个家。市 → 县 → 村，看看命运把你丢在了哪里。</p>
      <div class="bp-layout"><div class="bp-mapwrap">${svg}${legend}</div><div class="bp-panel">${panel}</div></div>
      <div class="bp-foot"><button class="btn" id="bprand">🎲 随机投胎（蜀中省）</button><button class="btn" id="bpback">← 返回</button></div></div>`;
    // 事件绑定：只有蜀中省可点，其余地区灰锁
    document.querySelectorAll("[data-prov]").forEach(g => g.onclick = () => { if (g.dataset.prov !== BP_PROV) return; bpSel = { provinceId: BP_PROV }; render(); });
    document.querySelectorAll("[data-city]").forEach(b => b.onclick = () => { bpSel.city = prov.cities[+b.dataset.city]; bpSel.county = null; bpSel.village = null; render(); });
    document.querySelectorAll("[data-county]").forEach(b => b.onclick = () => { bpSel.county = bpSel.city.counties[+b.dataset.county]; bpSel.village = null; render(); });
    document.querySelectorAll("[data-village]").forEach(b => b.onclick = () => { bpSel.village = bpSel.county.villages[+b.dataset.village]; render(); });
    document.getElementById("bprand").onclick = () => { bpRandom(); render(); };
    document.getElementById("bpback").onclick = () => { screen = "cohort"; render(); };
    const cf = document.getElementById("bpconfirm");
    if (cf) cf.onclick = () => {
      const pv = geoProv(bpSel.provinceId);
      const merged = geoMergedOrigin(pv, bpSel.city, bpSel.county, bpSel.village);
      draft.birthplace = {
        provinceId: pv.id, provinceName: pv.name, region: pv.region, econ: pv.econ, cityName: bpSel.city && bpSel.city.name,
        countyName: bpSel.county && bpSel.county.name, villageName: bpSel.village && bpSel.village.name,
        path: [pv.name, bpSel.city && bpSel.city.name, bpSel.county && bpSel.county.name, bpSel.village && bpSel.village.name].filter(Boolean).join(" · "),
        origin: merged
      };
      draft.stepIndex = 0; screen = "namepick"; render();
    };
  }

  function renderCreate() {
    const step = C.creationSteps[draft.stepIndex];
    const options = creationOptions(step);
    const preview = normalizeStats(Object.assign({}, draft.stats));
    const projOf = (o) => { const cp = Object.assign({}, draft.stats); const d = optDeltas(o); for (const k in d) cp[k] = (cp[k] || 0) + d[k]; return normalizeStats(cp); };
    const selI = (draft._previewSel != null && options[draft._previewSel]) ? draft._previewSel : null;   // 已「点一次预览」的选项
    const shown = selI != null ? projOf(options[selI]) : preview;        // 属性条默认显示：预览中的项 / 否则当前
    // —— 属性条形图：当前六维（或预览结果）分布，总和恒为 BASE_TOTAL ——
    const statBars = C.STAT_KEYS.map(k => { const d = shown[k] - preview[k]; return `<div class="stat"><span class="stat-l">${SN[k]}</span><span class="stat-bar"><i class="b-${k}" data-bar="${k}" style="width:${Math.round(shown[k] / 95 * 100)}%;transition:width .16s ease"></i></span><span class="stat-v" data-val="${k}" style="transition:color .12s;color:${d > 0 ? "var(--green)" : d < 0 ? "var(--red)" : ""};font-weight:${d ? 800 : 400}">${shown[k]}</span></div>`; }).join("");
    const bp = draft.birthplace || {}; const org = bp.origin || {};
    const bpLine = bp.path ? `<div style="font-size:12px;color:var(--dim);margin-top:10px;border-top:1px solid var(--line);padding-top:8px">📍 ${bp.path}｜起手现金 ×<b style="color:var(--amber2)">${org.cashMul || 1}</b>　人脉 <b style="color:var(--amber2)">${(org.network >= 0 ? "+" : "")}${org.network || 0}</b>${(org.tags && org.tags.length) ? "　" + org.tags.map(t => "#" + t).join(" ") : ""}</div>` : "";
    const flagLabels = { nouveau_riche: "💰 暴发户", fallen: "📉 家道中落", startup_seed_trade: "🌱 生意苗子", startup_seed_agri: "🌱 土货生意" };
    const tierName = { poor: "清贫", worker: "工薪", upper: "殷实", rich: "豪富" };
    const chip = (k, v) => `<span style="display:inline-block;font-size:12px;font-weight:700;padding:1px 7px;border-radius:6px;margin:3px 4px 0 0;color:#10100a;background:${v > 0 ? "var(--green)" : "var(--red)"}">${SN[k]}${v > 0 ? "+" : ""}${v}</span>`;
    const tag = (txt, col) => `<span style="display:inline-block;font-size:11px;font-weight:700;padding:1px 8px;border-radius:999px;margin:5px 4px 0 0;color:${col};border:1px solid ${col}66;background:${col}1f">${txt}</span>`;
    const cards = options.map((o, i) => {
      const rl = optDeltas(o);   // 只加不减；取舍项才显示减项
      const chips = C.STAT_KEYS.filter(k => rl[k]).map(k => chip(k, rl[k])).join("") + (o.tradeoff ? ` <span style="display:inline-block;font-size:11px;font-weight:700;padding:1px 7px;border-radius:6px;margin:3px 0 0;color:var(--red);border:1px solid var(--red)">⚠ 有取舍</span>` : "") || `<span style="font-size:12px;color:var(--dim)">均衡 · 不偏科</span>`;
      const badges = (o.assetTier ? tag(`💼 ${tierName[o.assetTier] || o.assetTier} · ¥${(C.assetTierCash[o.assetTier] || 0).toLocaleString()}`, "var(--green)") : "")
        + (o.flags || []).filter(f => flagLabels[f]).map(f => tag(flagLabels[f], "var(--amber2)")).join("");
      const isSel = i === selI;
      const foot = isSel ? `<div style="margin-top:8px;font-size:12px;font-weight:800;color:var(--amber2)">👆 再点一次 = 确认 →</div>` : "";
      return `<div class="bgcard ${o.regional ? "regional" : ""}${isSel ? " sel" : ""}" data-i="${i}"><div class="bg-name">${o.name}${o.regional ? ' <span class="region-badge">地区专属</span>' : ""}</div><div class="bg-desc">${o.desc}</div>
        <div class="bg-start" style="color:inherit">${chips}</div>${badges ? `<div>${badges}</div>` : ""}${foot}</div>`;
    }).join("");
    app().innerHTML = `<div class="screen"><div class="scene-hero" style="${C.images.styleBg("create", 1200)}"><span class="scene-cap">捏人 · 你这一生的底牌</span></div>
      <h2>${step.title}　<small class="step-n">${draft.stepIndex + 1}/${C.creationSteps.length}</small></h2>
      <p class="sub">${step.note || "每一步都在为你加点——多数选项纯长属性，越选底子越厚；个别「有取舍」的才需权衡。"}</p>
      <div style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:14px">
        <div style="font-size:12px;color:var(--dim);margin-bottom:8px">当前属性 · <b style="color:var(--amber2)">加点制：越选越强</b>，多数选项只加不减，仅「<span style="color:var(--red)">⚠ 有取舍</span>」的少数项会扣点（封顶 95）　👇 <b style="color:var(--amber2)">鼠标悬浮预览、点选即确认</b></div>
        <div class="bars">${statBars}</div>${bpLine}
        <div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px;font-size:11px;color:var(--dim);line-height:1.85">
          <b style="color:var(--amber2)">六维决定人生走向</b>（点高哪一维，那条路就明显更顺）：
          <span style="color:var(--green)">体魄</span>=耐操健康长寿·体力销售更挣钱
          <span style="color:var(--pink)">心智</span>=抗压回血·学得快少崩溃
          <span style="color:var(--blue)">学识</span>=好工作·升职快·产品强
          <span style="color:var(--purple)">谋略</span>=副业投资创业回报高·少被裁
          <span style="color:var(--amber)">魅力</span>=朋友多人缘热·谈薪拉客恋爱顺
          <span style="color:#9ccc65">洞察</span>=看准风口·运气好·少踩坑
        </div>
      </div>
      <div class="bggrid">${cards}</div></div>`;
    // —— 悬浮预览(电脑) + 两段点击(触屏/通用)：第一次点=预览选中，再点同一项=确认 ——
    const baseStats = preview;   // 当前(已归一)六维 = 基准
    const paintBars = (stats) => C.STAT_KEYS.forEach(k => {
      const bar = document.querySelector(`[data-bar="${k}"]`); const val = document.querySelector(`[data-val="${k}"]`);
      if (bar) bar.style.width = Math.round(stats[k] / 95 * 100) + "%";
      if (val) { const d = stats[k] - baseStats[k]; val.textContent = stats[k]; val.style.color = d > 0 ? "var(--green)" : d < 0 ? "var(--red)" : ""; val.style.fontWeight = d ? "800" : "400"; }
    });
    const confirmPick = (i) => {
      draft._previewSel = null;
      applyOption(options[i]);
      if (draft.stepIndex < C.creationSteps.length - 1) { draft.stepIndex++; renderCreate(); }
      else { screen = "gear"; render(); }
    };
    document.querySelectorAll(".bgcard").forEach(el => {
      const i = parseInt(el.dataset.i, 10);
      el.onmouseenter = () => paintBars(projOf(options[i]));      // 悬浮即预览
      el.onmouseleave = () => paintBars(shown);                  // 移开复位
      el.onclick = () => confirmPick(i);                         // 点一下直接确认（悬浮已能预览，无需二次确认）
    });
  }

  // 估算开局家底（与 newState 的现金算法一致，便于行囊页显示预算；忽略随机的家族传承）
  function estimateStartCash(d) {
    let c = (C.assetTierCash[d.assetTier] || 20000);
    if (d.birthplace && d.birthplace.origin && d.birthplace.origin.cashMul) c *= d.birthplace.origin.cashMul;
    const diff = d.difficulty || "标准";
    if (DIFFS[diff]) c *= DIFFS[diff].cashMul;
    if (d.cohort && d.cohort.cashMul) c *= d.cohort.cashMul;
    return Math.round(c);
  }
  // —— 行囊：开局选随身物品（手机必带，电脑等勾选+扣钱）——
  function renderGear() {
    if (!draft) { screen = "title"; return render(); }
    draft.gear = draft.gear || ["phone"];
    if (draft.gear.indexOf("phone") < 0) draft.gear.unshift("phone");
    const budget = estimateStartCash(draft);
    const spent = draft.gear.reduce((a, id) => { const g = gearById(id); return a + (g && g.price ? g.price : 0); }, 0);
    const left = budget - spent;
    draft.startMode = draft.startMode || "campus";
    const modeCards = [
      { id: "campus", icon: "🎓", name: "从大三开始", tag: "校园期", desc: "先在川大望江校园过一段大三生活：上课、实习、社交、躺平都会影响毕业后的求职底牌。" },
      { id: "society", icon: "🧳", name: "毕业未就业", tag: "快速测试", desc: "跳过校园期，22 岁本科毕业但还没找到工作，直接从成都人才服务中心进入社会线。" }
    ].map(m => `<div class="gear-card ${draft.startMode === m.id ? "on" : ""}" data-start-mode="${m.id}">
        <div class="gear-ic">${m.icon}</div>
        <div class="gear-mid"><div class="gear-name">${m.name} <span class="gear-tag${draft.startMode === m.id ? " on" : ""}">${m.tag}</span></div>
          <div class="gear-desc">${m.desc}</div></div>
        <div class="gear-buy"><div class="gear-check">${draft.startMode === m.id ? "✓" : "＋"}</div></div>
      </div>`).join("");
    const cards = GEAR_ITEMS.map(g => {
      const on = draft.gear.indexOf(g.id) >= 0;
      const afford = on || g.price <= left;
      const cls = g.locked ? "on locked" : on ? "on" : afford ? "" : "poor";
      return `<div class="gear-card ${cls}" ${g.locked ? "" : `data-gear="${g.id}"`}>
        <div class="gear-ic">${g.icon}</div>
        <div class="gear-mid"><div class="gear-name">${g.name} ${g.locked ? '<span class="gear-tag">必带</span>' : on ? '<span class="gear-tag on">已带</span>' : ""}</div>
          <div class="gear-desc">${g.desc}</div></div>
        <div class="gear-buy"><div class="gear-price">${g.price ? "¥" + g.price.toLocaleString() : "免费"}</div>
          ${g.locked ? "" : `<div class="gear-check">${on ? "✓" : (afford ? "＋" : "钱不够")}</div>`}</div>
      </div>`;
    }).join("");
    app().innerHTML = `<div class="screen"><div class="scene-hero" style="${C.images.styleBg("create", 1200)}"><span class="scene-cap">🎒 行囊 · 带什么上路</span></div>
      <h2 style="margin-top:0">🎒 收拾行囊</h2>
      <p class="sub">出门闯荡前，挑挑随身要带的家伙。手机人人都有；<b style="color:var(--amber)">电脑等设备勾上就带走，花费从开局家底里扣</b>。带了笔记本/台式，就能在游戏里真的用一台电脑——大屏炒股、搞钱、上网课，比手机顺手。</p>
      <div class="gear-budget">开局家底约 <b>¥${budget.toLocaleString()}</b>　·　行囊花费 <b style="color:var(--amber)">¥${spent.toLocaleString()}</b>　·　带走后剩 <b style="color:${left >= 0 ? "var(--green)" : "var(--red)"}">¥${left.toLocaleString()}</b></div>
      <div class="gear-budget"><b>测试入口</b>　选择故事从哪里开始；两条入口后续都会接回成都城市地图和职场沉浮主线。</div>
      <div class="gear-list">${modeCards}</div>
      <div class="gear-list">${cards}</div>
      <div class="dead-btns"><button class="btn" id="gearback">← 返回</button><button class="btn primary" id="gearto">收拾妥当，出发 →</button></div></div>`;
    document.querySelectorAll(".gear-card[data-gear]").forEach(el => el.onclick = () => {
      const id = el.dataset.gear; const g = gearById(id); const i = draft.gear.indexOf(id);
      if (i >= 0) { draft.gear.splice(i, 1); }
      else { if (g.price > left) return; draft.gear.push(id); }
      render();
    });
    document.querySelectorAll(".gear-card[data-start-mode]").forEach(el => el.onclick = () => { draft.startMode = el.dataset.startMode || "campus"; render(); });
    document.getElementById("gearback").onclick = () => { if (draft.legacyChild) { screen = "namepick"; } else { draft.stepIndex = C.creationSteps.length - 1; screen = "create"; } render(); };
    document.getElementById("gearto").onclick = () => {
      s = newState(draft); weekLog = [];
      screen = draft.legacyChild ? "goalpick" : "play";
      render();
    };
  }

  function renderIntro() {
    if (window.MVP_00_CAREER) {
      const majorTxt0 = s.major && C._util.majorName ? C._util.majorName(s) : "某个专业";
      app().innerHTML = `<div class="screen"><div class="ev-card" style="max-width:640px;margin:6vh auto 0">
        <div class="ev-tag">${s.birthYear + 21} 年 · 21 岁 · 大三下学期</div>
        <div class="ev-title">🛏️ 早八的闹钟，又响了</div>
        <div class="ev-text">六平米的宿舍，泡面味还没散。上铺的室友翻了个身继续打呼，桌上堆着外卖盒和一台嗡嗡转的旧笔记本。你是一个 00 后，读到了大三，专业是<b style="color:var(--amber2)">${majorTxt0}</b>。<br><br>
        手机锁屏跳出一连串消息：同学群里有人晒大厂实习offer，有人把考研倒计时贴成了头像，家里又问「毕业后想好没有」。窗外是熟悉的校园，可所有人都在悄悄换赛道——这一年怎么过，会决定你毕业季站在什么样的起跑线上。<br><br>
        <i style="color:var(--dim)">没有老祖宗的鸡汤，没有逆天改命的剧本。先把大三这几周认真过一遍：上课、实习、社团、还是躺平，时间和精力，都攥在你自己手里。</i></div>
        <div class="ev-choices"><button class="btn primary choice" id="introgo">掀被子起床，开始大三这一学期 →</button></div>
      </div></div>`;
      document.getElementById("introgo").onclick = () => {
        s.age = Math.max(s.age || 18, 21);
        s.year = s.birthYear + s.age;
        if (typeof startCampus === "function") { startCampus(); return; }   // 校园周循环（开发中）就绪后自动走它
        // 兜底：startCampus 尚未实现时，别让开局卡死——直接进入职场主线
        s._intro = false;
        s.timeline.push({ age: 21, text: "大三这年，你认真过完了校园时光，准备迎接毕业季。" });
        screen = "goalpick"; render();
      };
      return;
    }
    const majorTxt = s.major && C._util.majorName ? C._util.majorName(s) : "某个专业";
    app().innerHTML = `<div class="screen"><div class="ev-card" style="max-width:600px;margin:6vh auto 0">
      <div class="ev-tag">${s.year} 年 · 21 岁 · 大三下学期</div>
      <div class="ev-title">🪪 00 后的第一张工牌（还没拿到）</div>
      <div class="ev-text">你是一个 00 后，读到了大三，专业是<b style="color:var(--amber2)">${majorTxt}</b>。<br><br>
      课还在上，但所有人都在悄悄换赛道：朋友圈里同学开始晒实习、晒 offer；家族群里七大姑八大姨问「工作找好没」；爸妈嘴上说「别有压力」，转头就发来一篇《考公上岸的人生有多稳》。<br><br>
      你打开招聘软件，第一次认真地刷起了岗位。屏幕上密密麻麻的「<b style="color:var(--amber2)">3 年经验</b>」「<b style="color:var(--amber2)">985 优先</b>」「<b style="color:var(--amber2)">薪资面议</b>」，让你心里咯噔一下。<br><br>
      <i style="color:var(--dim)">没有老祖宗的鸡汤，没有逆天改命的剧本。只有一个普通的 00 后，要去亲历一遍——从学校到职场，那段没人替你扛的难受日子。</i></div>
      <div class="ev-choices"><button class="btn primary choice" id="introgo">投出第一份简历 →</button></div>
    </div></div>`;
    document.getElementById("introgo").onclick = () => { s._intro = false; s.timeline.push({ age: 21, text: "大三这年，你打开招聘软件，投出了人生第一份简历。" }); screen = "goalpick"; render(); };
  }
  // 本周 7 天日历：每天显示天气 + 已排满程度 + 行动小图标
  function weekCalendar() {
    if (!s.weekPlan) return "";
    const wp = s.weekPlan;
    const cap = wp.cap, soft = DAY_SOFT, softPct = soft / cap * 100;
    return `<div class="weekcal">${wp.days.map((d, i) => {
      const u = wp.used[i];
      const normW = Math.min(u, soft) / cap * 100;          // 正常时段(琥珀)
      const otW = Math.max(0, u - soft) / cap * 100;        // 挤占时段(红)
      const acts = d.acts || [];
      const chips = acts.slice(0, 4).map(x => `<span class="wc-chip">${x.emoji}</span>`).join("") + (acts.length > 4 ? "<span class='wc-more'>…</span>" : "");
      const wx = d.wx || {};
      // 进度条恒含一段「正常填不满」的吃饭/休息区(虚线右侧斜纹)，只有硬撑才会用红色填进去
      const fill = `<div class="wc-fill" style="position:relative;overflow:hidden">
          <span style="position:absolute;left:${softPct}%;right:0;top:0;bottom:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.06) 0 4px,transparent 4px 8px)"></span>
          <i style="position:absolute;left:0;top:0;height:100%;width:${normW}%;background:var(--amber)"></i>
          ${otW > 0 ? `<i style="position:absolute;left:${softPct}%;top:0;height:100%;width:${otW}%;background:var(--red)"></i>` : ""}
          <span style="position:absolute;left:${softPct}%;top:0;bottom:0;border-left:1px dashed rgba(255,255,255,.45)"></span>
        </div>`;
      return `<div class="wc-day${wx.severe ? " wc-severe" : ""}" title="${(wx.name || "")}：${(wx.note || "")}　正常 ${soft}h 内，再多就要挤占吃饭/休息">
        <div class="wc-name">${d.name}</div>
        <div class="wc-wx">${wx.emoji || ""}</div>
        ${fill}
        <div class="wc-acts">${chips}</div>
        <div class="wc-h"${u > soft ? ' style="color:var(--red)"' : ""}>${u}h</div></div>`;
    }).join("")}</div>`;
  }
  function renderPlay() {
    if (s._intro) return renderIntro();
    // ★月度结算单弹窗★：每月结算后优先弹出可视化收支账单（先于一切）
    if (s._pendingBill) return renderBill();
    if (s.startup && s.startup.fulltime) return renderVenture();   // 全职创业经营模式接管界面
    // 进入大阶段时的「明确选择」优先弹出
    if (window.MVP_00_CAREER && s._pendingDecision) {
      s._pendingDecision = null;
      if (s.stageId) flag(s, "dec_" + s.stageId);
    }
    if (s._pendingDecision) { const ev = C.events.find(x => x.id === s._pendingDecision); s._pendingDecision = null; if (ev) { flag(s, "dec_" + s.stageId); enterEvent(ev); screen = "event"; return renderEvent(); } }
    // 跨多年的承诺（如留学）：接管界面，按年推进
    if (s.commitment) return renderCommitment();
    // ★脊柱节奏★：核心剧本/命运幕不再「一到年龄就立刻强弹」，而是与上一幕脊柱事件至少隔几周，
    // 给生活留白、避免主线接连霸屏（治「主线过度强制」）。两条线也不会同一周连珠炮。
    const spineReady = (s.week - (s._lastSpineWk || -999)) >= 8;
    // 核心剧本（main-arc）优先于目标命运线（destiny）
    if (!window.MVP_00_CAREER && spineReady && C._util.nextMainArcChapter) {
      const ach = C._util.nextMainArcChapter(s);
      if (ach) { const ev = C.events.find(x => x.id === ach); if (ev) { flag(s, "arcdone_" + ach); s._lastSpineWk = s.week; enterEvent(ev); screen = "event"; return renderEvent(); } }
    }
    if (!window.MVP_00_CAREER && spineReady && C._util.nextDestinyChapter) {
      const dch = C._util.nextDestinyChapter(s);
      if (dch) { const ev = C.events.find(x => x.id === dch); if (ev) { flag(s, "dstdone_" + dch); s._lastSpineWk = s.week; enterEvent(ev); screen = "event"; return renderEvent(); } }
    }
    const st = stageOf(s.age);
    // 可做的事 = (本阶段基础行动 ∪ 任意阶段的上下文行动) ∩ 满足处境门槛(require)
    // → 菜单随人生阶段 + 当前处境(婚育/宠物/体制/阶级/海外/房产…)动态增减，而非单一固定
    // 有人生路线(routes.js)时：行动 = 路线行动池(已解锁) ∪ 上下文行动 ∩ require（按路线渐进解锁）；
    // 无路线时回退旧逻辑(本阶段行动 ∪ anyStage) ∩ require。
    // ★中国式家长化驱动：行动来自「阶段+场景」精选（getWeekActions），旧 routeFilterActions 退为兜底
    const _weekActs = C._util.getWeekActions
      ? C._util.getWeekActions(s, st)
      : (C._util.routeFilterActions
        ? C._util.routeFilterActions(s, C.actions, st)
        : C.actions.filter(a => (st.actions.includes(a.id) || a.anyStage) && (() => { try { return !a.require || a.require(s); } catch (e) { return false; } })()));
    // ★城市俯瞰图：当前选中的区域决定本周能做的行动（区域是行动入口，doc §3-§5）
    let cityMapHtml = "", curDistName = "", curDistDesc = "", districtPanelHtml = "";
    let curDist = null;
    let avail = _weekActs;
    if (C._util.CITY_DISTRICTS && C._util.districtActions) {
      curDist = (s._cityDistrict && C._util.districtById(s._cityDistrict)) ? s._cityDistrict : null;
      const recDist = C._util.recommendedDistrict ? C._util.recommendedDistrict(s) : null;
      const dActs = curDist ? C._util.districtActions(s, curDist) : [];
      avail = curDist ? (dActs.length ? dActs : _weekActs) : [];
      const curD = curDist ? C._util.districtById(curDist) : null; curDistName = curD ? `${curD.icon} ${curD.name}` : ""; curDistDesc = curD ? curD.desc : "";
      const dots = curD ? "" : C._util.CITY_DISTRICTS.map(d => {
        const sel = d.id === curDist, rec = d.id === recDist;
        const n = C._util.districtActions(s, d.id).length;
        const sig = C._util.districtSignal ? C._util.districtSignal(s, d.id) : {};
        const badges = `${rec && !sel ? '<span class="cm-star">⭐</span>' : ""}${sig.hot ? '<span class="cm-hot"></span>' : ""}`;
        return `<button type="button" class="cm-dist-label${sel ? " sel" : ""}${rec ? " rec" : ""}${sig.visited ? " visited" : ""}" data-dist="${d.id}" style="left:${d.x}%;top:${d.y}%" title="${d.desc}"><span class="cm-name">${d.name}</span>${badges}</button>`;
      }).join("");
      const svg = C._util.cityMapSVG ? C._util.cityMapSVG(s) : "";
      districtPanelHtml = "";
      cityMapHtml = `<div class="citymap"><div class="citymap-h">${curD ? `${curD.icon} ${curD.name}` : `🗺️ 城市大地图${recDist ? "（⭐ 主线建议 · 🔴 有故事）" : ""}`}</div><div class="citymap-grid${curD ? " detail" : ""}">${svg}${dots}</div></div>`;
    }
    const done = s._weekActs || {};
    // ★行动格（slots）真正接管周回合（doc §2）：用完格子即可结束本周；hours 退为体力/过劳的次级成本。
    if (C._util.ensureWeekSlots) C._util.ensureWeekSlots(s);
    const slotsTotal = (s.weekSlots && s.weekSlots.total) || 0;
    const slotsUsed = (s.weekSlots && s.weekSlots.used) || 0;
    const slotsLeft = Math.max(0, slotsTotal - slotsUsed);
    const slotCostOf = (a) => C._util.actionSlotCost ? C._util.actionSlotCost(a) : 1;
    const weekFull = window.MVP_00_CAREER ? true : (C._util.weekSlotsFull ? C._util.weekSlotsFull(s) : (slotsLeft <= 0));
    const rows = avail.map(a => {
      const didThis = !a.repeatWeek && done[a.id];                                  // 可多次的行动(repeatWeek)不被「本周已做」锁住
      const sc = slotCostOf(a);
      const noSlot = !window.MVP_00_CAREER && sc > 0 && slotsLeft < sc;               // 格子不够 → 禁用
      const dis = noSlot || didThis;
      const prev = a.preview || a.hint || "";
      const cost = didThis ? `<span class="ap-cost">✓ 本周已做</span>`
        : `<span class="ap-cost ap-slot">${a.hours ? `${a.hours}h` : "行动"}${a.repeatWeek && (s._actCount && s._actCount[a.id]) ? ` · 已 ${s._actCount[a.id]} 次` : a.repeatWeek ? " · 可多次" : ""}</span>`;
      return `<div class="track ${dis ? "dis" : ""}" data-id="${a.id}">
      <div class="tk-head"><span class="tk-name">${a.emoji} ${a.name}</span>${cost}</div>
      <div class="tk-desc">${a.desc}</div>${prev ? `<div class="tk-hint">${prev}</div>` : ""}</div>`; }).join("");
    const logHtml = weekLog.length ? `<div class="logbox"><div class="logbox-h">📓 本周纪事</div>${weekLog.map(l => `<div class="log">${l}</div>`).join("")}</div>` : "";
    const tipHtml = (s.age <= 23 && !has(s, "employed") && !has(s, "startup")) ? `<div class="tip map-tip">💡 直接点击城市图上的片区进入：找工作去人才市场，想回血去公园或商圈，身体报警就去医院。</div>` : "";
    // ★场景图随当前场景变化（学校/公司/通勤/公园/出租屋…），缺图回退到阶段氛围图（doc §6.4/§12.1）
    const _sm = C._util.sceneMeta ? C._util.sceneMeta(s) : null;
    const _sKey = (_sm && C.images.sceneKey) ? C.images.sceneKey(_sm.artKey) : null;
    const _heroKey = _sKey || C.images.stageKey(st.id);
    const _heroCap = _sm ? `${_sm.name} · ${s.city ? s.city.name : ""} · ${s.year}年` : `${st.name} · ${s.city ? s.city.name : ""} · ${s.year}年`;
    const sceneHero = `<div class="scene-hero" style="${C.images.styleBg(_heroKey, 1200)}"><span class="scene-cap">${_heroCap}</span></div>`;
    // ★任务引导横幅★：常驻「当前任务 + 下一步提示」，治「不知道干嘛」
    let questHtml = "";
    if (C._util.currentQuest) {
      const cq = C._util.currentQuest(s);
      if (cq) questHtml = `<div class="quest-banner"><div class="qb-top"><span class="qb-tag">📌 当前任务 ${cq.index + 1}/${cq.total}</span><b class="qb-title">${cq.quest.title}</b></div><div class="qb-hint">${cq.quest.hint || ""}</div></div>`;
      else if (C._util.routeOf && C._util.routeOf(s)) questHtml = `<div class="quest-banner qb-done"><div class="qb-top"><span class="qb-tag">🏁 引导完成</span><b class="qb-title">这条路的关都闯过了——剩下的人生，由你自己续写。</b></div></div>`;
    }
    // 未解锁行动的提示（让玩家知道还有东西没开，靠完成任务/到年龄解锁）
    const lockedHints = (C._util.routeLockedHints ? C._util.routeLockedHints(s) : []);
    const lockedHtml = lockedHints.length ? `<div class="locked-hints">${lockedHints.map(h => `<span class="lh">${h.why}</span>`).join("")}</div>` : "";
    // ★大框架改造·批次1：主线阶段 / 周时间预算 / 场景 / 人生记忆 的状态可视化
    let mainStageHtml = "", sceneAmbHtml = "", memHtml = "";
    if (C._util.mainStageSummary) {
      const mss = C._util.mainStageSummary(s);
      if (mss) {
        const dots = mss.beats.map(b => `<span class="msb-dot${b.done ? " on" : ""}"></span>`).join("");
        const goalsHtml = (mss.goals && mss.goals.length) ? `<div class="msb-goals">${mss.goals.map(g => `<div class="msb-goal${g.done ? " done" : ""}${g.required ? " req" : ""}"><span class="gck">${g.done ? "✅" : g.required ? "🔲" : "⬜"}</span>${g.label}${g.required && !g.done ? ' <span class="goal-req">必做</span>' : ""}</div>`).join("")}</div>` : "";
        mainStageHtml = `<div class="mainstage-banner"><div class="msb-top"><span class="msb-tag">📖 职场沉浮 · 人生剧本 ${mss.index + 1}/${mss.total}</span><b class="msb-title">${mss.emoji} ${mss.title}</b></div><div class="msb-quest">${mss.quest}</div>${goalsHtml}<div class="msb-beats">${dots}<span class="msb-cnt">目标 ${mss.beatsDone}/${mss.beatsTotal}</span></div></div>`;
      }
    }
    if (C._util.sceneMeta) { const sc = C._util.sceneMeta(s); if (sc) sceneAmbHtml = `<div class="scene-amb">📍 <b>${sc.name}</b>：${sc.ambient}</div>`; }
    if (C._util.memoryDigest) { const md = C._util.memoryDigest(s, 5); if (md.length) memHtml = `<div class="membox"><div class="membox-h">🧠 人生记忆</div>${md.map(m => `<div class="mem">· ${m.text}</div>`).join("")}</div>`; }
    app().innerHTML = `<div class="screen play">${navBar("play")}
      <div class="play-cols">
        <section class="play-main">
          <div class="play-main-h"><span>🗺️ ${s.city ? s.city.name : "成都"} · ${s.year}</span><small>点击城市片区，进入场景安排这一周</small></div>
          ${cityMapHtml}
          ${questHtml}
          ${mainStageHtml}
          ${tipHtml}
          ${districtPanelHtml}
          ${cityMapHtml && curDistName ? `<div class="tracks-h district-actions-h compact">📍 ${curDistName}<span class="td-desc">${curDistDesc || "点击地图里的设施安排这一周。"}</span></div>` : ""}
          ${rows && !curDist ? `<div class="tracks district-actions">${rows}</div>` : ""}
          ${lockedHtml}
          <div class="weekbtns"><button class="btn" id="skip">⏭ 快进（遇事即停）</button><button class="btn primary" id="endweek">结束本周 →</button></div>
        </section>
        <aside class="play-side">
          ${dashboard()}
          ${campusDash()}
          ${sceneAmbHtml}
          ${memHtml}${logHtml}
        </aside>
      </div></div>`;
    bindNav();
    // ★城市俯瞰图：点区域 → 切换到该区域（行动随之变化）
    const cityMapGrid = document.querySelector(".citymap-grid");
    if (cityMapGrid) cityMapGrid.onclick = (e) => {
      const el = e.target.closest(".cm-dist-label[data-dist],.cm-facility[data-fac]");
      if (!el || !cityMapGrid.contains(el)) return;
      e.preventDefault(); e.stopPropagation();
      if (el.dataset.dist) { s._cityDistrict = el.dataset.dist; s._cityFacility = null; render(); return; }
      if (el.dataset.fac) { s._cityFacility = el.dataset.fac; render(); }
    };
    document.querySelectorAll(".cm-dist-label[data-dist]").forEach(el => el.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      s._cityDistrict = el.dataset.dist; s._cityFacility = null; render();
    });
    document.querySelectorAll(".cm-facility[data-fac]").forEach(el => el.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      s._cityFacility = el.dataset.fac; render();
    });
    const cityRegionBackBtn = document.getElementById("cityRegionBack"); if (cityRegionBackBtn) cityRegionBackBtn.onclick = () => { s._cityFacility = null; render(); };
    const cityOverviewBtn = document.getElementById("cityOverview"); if (cityOverviewBtn) cityOverviewBtn.onclick = () => { s._cityDistrict = null; s._cityFacility = null; render(); };
    document.querySelectorAll(".track,.cm-scene-action[data-id]").forEach(el => el.onclick = () => {
      const a = C.actions.find(x => x.id === el.dataset.id);
      if (!a) return;
      // ★行动格门槛：格子不够就不能点（决策类 slotCost=0 不受限）
      const _sc = C._util.actionSlotCost ? C._util.actionSlotCost(a) : 1;
      const _left = C._util.weekSlotsLeft ? C._util.weekSlotsLeft(s) : 99;
      if (!window.MVP_00_CAREER && _sc > 0 && _left < _sc) return;
      if (!a.repeatWeek && s._weekActs && s._weekActs[a.id]) return;   // 默认每周一次；repeatWeek 行动(如投简历)可反复做
      if (s._cityDistrict) { s._cityVisited = s._cityVisited || {}; s._cityVisited[s._cityDistrict] = true; }   // 标记本周去过该区域
      // 先看这件事会通向哪——这些「打开子界面」的行动 resolve 本身无副作用，可先试探再决定是否计时
      let r; try { r = a.resolve(s) || {}; } catch (e) { r = {}; }
      // —— 会打开「可取消子界面」的行动（换城市/旅行/找乐子）：先挂起不计时间，等真在里面落地了再结算；
      //     点「再想想/算了，继续生活」半途退出 → 不扣时间、不占用本周名额（修复「先不做也被计入」）——
      if (r.map) { deferAction(a); mapPurpose = r.map; mapCountry = null; screen = "map"; render(); return; }
      if (r.leisure) { deferAction(a); screen = "mgmenu"; render(); return; }   // 找乐子 → 小游戏菜单
      // —— 触发事件的行动（找工作/辞职/投资…）：先挂起不计时间，进事件；事件里选「先不做」会退还，
      //     选了实质动作才在事件结算时落账（修复「点了等等先不投仍扣时间」）——
      if (r.event) { const ev = C.events.find(x => x.id === r.event); if (ev) { deferAction(a); enterEvent(ev); screen = "event"; render(); return; } }
      // —— 其余行动：当场就算「做了」，扣时间、排进日历、标记本周已做 ——
      commitAction(a);
      // 不再清空 weekLog —— 一周内多个行动的日志会累积，直到结束本周
      if (r.phone) { screen = "phone"; render(); return; }
      if (r.commit) { startCommitment(r.commit); render(); return; }
      if (r.venture) { enterVenture(); return; }
      if (r.minigame) { startMinigame(r.minigame); return; }
      // 常规行动日志只进「本周日志」，不进永久时间线 —— 人生回顾留给高光（事件/里程碑/转折），
      // 不再被「又是朝九晚十」「出了几身汗」这类流水账淹没（也根治结局渲染上万条的性能问题）。
      // 行动若想留痕到时间线，自行在 resolve 里返回 r.mark（少见但重要的瞬间：加薪/被裁等）。
      if (r.log) { weekLog.push(`${a.emoji} ${r.log}`); if (r.mark) s.timeline.push({ age: s.age, text: r.log }); }
      render();
    });
    const _ot = document.getElementById("overtime"); if (_ot) _ot.onclick = () => { s._overtimeMode = !s._overtimeMode; render(); };
    document.getElementById("endweek").onclick = () => { if (!weekFull) return; weekLog = []; if (s.campus) campusTick(); else endWeek(); render(); };
    // 快进：自动延续「上周那套日常」连续推进，直到触发事件/结局，或最多一年——
    // 不再是空耗：上班/副业/养生这类常规行动会被自动重做，让平淡的日子一笔带过却仍有进展。
    // 仅自动重做「不打开子界面、不弹事件」的安全行动；遇到要做决策的就停下交还给玩家。
    const SKIP_SAFE = { work: 1, sidehustle: 1, parttime: 1, exercise: 1, rest: 1, study: 1, socialize: 1, hobby: 1, startup: 1, campus_lecture: 1, campus_cram: 1, campus_intern: 1, campus_club: 1 };
    document.getElementById("skip").onclick = () => {
      weekLog = []; let n = 0;
      while (n++ < 52) {
        if (s.campus) { const cont = campusTick(); if (!cont) break; continue; }
        // 自动重做上周的安全日常（按时间预算，能塞几件塞几件）
        const plan = (s._lastPlan || []).filter(id => SKIP_SAFE[id]);
        for (const id of plan) {
          const a = C.actions.find(x => x.id === id); if (!a) continue;
          if (C._util.weekSlotsFull && C._util.weekSlotsFull(s)) break;             // ★行动格用完即停（doc §2）
          const _sc = C._util.actionSlotCost ? C._util.actionSlotCost(a) : 1;
          if (_sc > 0 && C._util.weekSlotsLeft && C._util.weekSlotsLeft(s) < _sc) continue;
          if (!a.repeatWeek && s._weekActs && s._weekActs[id]) continue;
          if (a.require && !(() => { try { return a.require(s); } catch (e) { return false; } })()) continue;
          let r; try { r = a.resolve(s) || {}; } catch (e) { r = {}; }
          // 若这件事会打开子界面/弹事件：快进时不做它（保持安静推进），不强行打断
          if (r.event || r.map || r.leisure || r.minigame || r.commit || r.venture || r.phone) continue;
          commitAction(a);
        }
        const cont = endWeek(); if (!cont) break; if (pendingEvent) break; if (s._pendingBill) break;   // 月结算到了，停下弹账单
      }
      if (screen !== "event" && screen !== "dead") screen = "play";
      render();
    };
  }

  /* ============================ 创业：全职「经营模式」周推进子系统 ============================ */
  function recalcValuation() {
    const su = s.startup; if (!su) return;
    const align = su.track === s.eraWind;
    const stageMul = { "种子": 1, "天使轮": 2.2, "A轮": 5, "B轮": 12, "Pre-IPO": 30 }[su.stage] || 1;
    const base = su.product * 0.5 + su.users * 1.3 + su.buzz * 0.6;
    su.valuation = Math.round(base * 13000 * stageMul * (align ? 1.7 : 0.9) * (1 + s.reputation / 120) * (1 + C._util.statEdge(s, "strategy") * 0.6));
  }
  function enterVenture() {
    const su = s.startup; if (!su || has(s, "startup_done")) return;
    su.fulltime = true;
    if (s.job) { s.job = null; delete s.flags.employed; }   // 全职 all-in：辞掉原工作，不再保留（退出经营模式后不会莫名其妙又有工作）
    if (su.product == null) su.product = Math.max(10, Math.round(su.progress || 5));
    if (su.users == null) su.users = 8;
    if (su.team == null) su.team = 35;
    if (su.buzz == null) su.buzz = 12;
    if (su.runway == null) su.runway = 40;
    if (su.stage == null) su.stage = "种子";
    su.weeksRun = su.weeksRun || 0; su.hours = 50; su._weekActs = {};
    flag(s, "risk_hustle"); recalcValuation();
    if (C._util.ensureCompanyFields) C._util.ensureCompanyFields(s);
    const _why = C._util.startupTriggerReason ? C._util.startupTriggerReason(s) : "";
    s.timeline.push({ age: s.age, text: `你把后路一断，全职扑进了「${su.track}」这摊事。${_why ? _why + " " : ""}从今往后，公司就是你的命。` });
    weekLog = ["🚀 你正式 all-in。账上的钱是倒计时，窗外的天，得自己捅破。"];
    screen = "play"; render();
  }
  function drawVentureEvent() {
    if (!rnd(0.22)) return null;
    s._cd = s._cd || {};
    const pool = C.events.filter(e => e.module === "venture" && (!e.once || !has(s, "ev_" + e.id)) && (!s._cd[e.id] || s.week - s._cd[e.id] >= 52) && (() => { try { return !e.cond || e.cond(s); } catch (x) { return false; } })());
    return pool.length ? pick(pool) : null;
  }
  function ventureTick() {
    const su = s.startup; if (!su) return false;
    su.weeksRun++; s.week++;
    const na = s.startAge + Math.floor(s.week / 52); const aged = na !== s.age;
    s.age = na; s.year = s.birthYear + s.age; s.eraWind = C.windAt(s.year);
    su.runway -= 1;
    su.users = _cl(su.users - 0.6); su.buzz = _cl(su.buzz - 0.5); su.team = _cl(su.team - 0.3);
    add(s, "stress", 2); if (su.weeksRun % 2 === 0) add(s, "health", -1);   // 健康隔周才掉，长期创业也不至于直接耗死
    if (s.mood < 36) add(s, "mood", 1);                                     // 心情韧性回弹（同主循环）
    s._moodLowWeeks = (s.mood < 18) ? (s._moodLowWeeks || 0) + 1 : 0;
    recalcValuation();
    if (s.week % 4 === 0) { add(s, "cash", -Math.round(3000 * (s.world ? s.world.priceIndex : 1) * ((DIFFS[s.difficulty] || DIFFS["标准"]).costMul))); if (has(s, "has_loan")) add(s, "cash", -Math.round(10000 * (s.world ? s.world.priceIndex : 1))); }
    if (aged && s.age > 35) add(s, "health", -1);
    if (s.age >= 16 && rollDeath()) { s.ending = s._deathRecap || "你走完了这一生。"; finishGame(); return false; }
    su._weekActs = {}; su.hours = 50;
    if (su.runway <= 0) { ventureExit("bust"); return false; }
    // 时间闸：经营够久才谈得上敲钟/被收购，杜绝「2 年爽文上市」（IPO≥6年，收购≥3年）
    if (su.weeksRun >= 312 && su.valuation >= 800000000 && su.stage === "Pre-IPO" && rnd(0.18)) { ventureExit("ipo"); return false; }
    if (su.weeksRun >= 156 && su.valuation >= 150000000 && rnd(0.05)) { ventureExit("acquire"); return false; }
    const ev = drawVentureEvent();
    if (ev) { enterEvent(ev); screen = "event"; return false; }
    return true;
  }
  function ventureExit(type) {
    const su = s.startup; flag(s, "startup_done"); let txt;
    if (type === "ipo") { flag(s, "chase_ipo"); const cashout = Math.round(su.valuation * 0.25); add(s, "cash", cashout); add(s, "reputation", 20); add(s, "assets", Math.round(su.valuation * 0.2)); txt = `敲钟那天，大屏幕上跳动的市值让你眼眶发热。从车库到交易所，你把「${su.track}」做成了——套现 ¥${cashout.toLocaleString()}，财务自由近在眼前。`; }
    else if (type === "acquire") { const price = Math.round(su.valuation * 0.5); add(s, "cash", price); add(s, "reputation", 10); txt = `大厂递来收购要约，你权衡再三签了字。卖了 ¥${price.toLocaleString()}，没敲钟，但也是体面的退出——下一个故事，从此开始。`; }
    else { add(s, "mood", -14); add(s, "stress", 8); flag(s, "startup_failed"); delete s.flags.chase_ipo; txt = `账上最后一笔钱也烧光了。你遣散团队、关掉服务器、清算注销。九死一生，这次你是那个『九』——但创业者的故事，从来不是只有一次。`; }
    s.startup = null;
    s.timeline.push({ age: s.age, text: txt }); weekLog = ["📌 " + txt];
    screen = "play"; render();
  }
  function ventureDash() {
    const su = s.startup;
    const bar = (label, v, cls, warn) => `<div class="sd-bar"><span class="sd-l">${label}</span><span class="sd-track"><i class="${cls}" style="width:${Math.round(v)}%"></i></span><span class="sd-v ${warn ? "sd-warn" : ""}">${Math.round(v)}</span></div>`;
    const val = su.valuation >= 1e8 ? (su.valuation / 1e8).toFixed(1) + "亿" : (su.valuation / 1e4).toFixed(0) + "万";
    return `<div class="dash">
      <div class="dash-top">
        <div><div class="age" style="font-size:26px">¥${val}<small> 估值</small></div><div class="cls">🚀「${su.track}」· ${su.stage} · 已经营 ${su.weeksRun} 周</div></div>
        <div class="worth"><small>资金跑道（还能撑）</small><b class="${su.runway < 8 ? "sd-warn" : ""}" style="color:${su.runway < 8 ? "var(--red)" : "var(--green)"}">${Math.max(0, Math.round(su.runway))} 周</b><div class="res">💰个人现金 ¥${Math.round(s.cash).toLocaleString()}　❤️${Math.round(s.health)}　😣${Math.round(s.stress)}</div></div>
      </div>
      <div class="sd-bars">${bar("产品", su.product, "b-tech")}${bar("用户", su.users, "b-net")}${bar("团队", su.team, "b-biz", su.team < 25)}${bar("口碑", su.buzz, "b-happy")}</div></div>`;
  }
  function renderVenture() {
    const su = s.startup; const done = su._weekActs || {};
    const rows = VENTURE_ACTIONS.map(a => { const dis = a.hours > su.hours || done[a.id];
      return `<div class="track ${dis ? "dis" : ""}" data-vid="${a.id}"><div class="tk-head"><span class="tk-name">${a.emoji} ${a.name}</span><span class="ap-cost">${done[a.id] ? "✓ 本周已做" : a.hours + "h"}</span></div><div class="tk-desc">${a.desc}</div>${a.hint ? `<div class="tk-hint">${a.hint}</div>` : ""}</div>`; }).join("");
    const logHtml = weekLog.length ? `<div class="logbox"><div class="logbox-h">📓 本周纪事</div>${weekLog.map(l => `<div class="log">${l}</div>`).join("")}</div>` : "";
    app().innerHTML = `<div class="screen play">${ventureDash()}
      <div class="stagebar">🚀 全职创业经营中 · 第 ${su.weeksRun + 1} 周。跑道烧光就出局，估值够高就敲钟/被收购。产品、用户、团队、口碑，一个都不能塌。</div>${logHtml}
      <div class="alloc-h">本周可支配时间：剩余 <b>${su.hours}</b> / 50 小时</div>
      <div class="tracks">${rows}</div>
      <div class="weekbtns"><button class="btn" id="vskip">⏭ 快进（遇事即停）</button><button class="btn primary" id="vweek">过完这周 →</button></div>
      <button class="btn" id="vquit" style="margin-top:10px">🚪 暂别经营，回去过普通日子（公司转后台慢跑）</button></div>`;
    document.querySelectorAll(".track[data-vid]").forEach(el => el.onclick = () => {
      const a = VENTURE_ACTIONS.find(x => x.id === el.dataset.vid);
      if (a.hours > su.hours || (su._weekActs && su._weekActs[a.id])) return;
      su.hours -= a.hours; su._weekActs = su._weekActs || {}; su._weekActs[a.id] = true;
      const log = a.run(su, s); recalcValuation(); if (log) weekLog.push(`${a.emoji} ${log}`);
      render();
    });
    document.getElementById("vweek").onclick = () => { weekLog = []; ventureTick(); render(); };
    document.getElementById("vskip").onclick = () => { weekLog = []; let n = 0; while (n++ < 52) { if (!ventureTick()) break; } render(); };
    document.getElementById("vquit").onclick = () => { su.fulltime = false; weekLog = ["🚪 你从一线退了下来，公司交给团队慢慢跑，自己回去过日子。想全力以赴时，随时能再扑回去。"]; screen = "play"; render(); };
  }

  /* ---------- 跨多年承诺（如留学）：一次抉择占去好几年，逐年叙事 ---------- */
  function startCommitment(id) {
    const ref = C.commitments[id]; if (!ref) return;
    s.commitment = { id, ref, yearIdx: 0 };
    s.timeline.push({ age: s.age, text: `你踏上了「${ref.label}」之路，未来几年都将身在其中。` });
  }
  function lightAdvanceYear() { // 在承诺期间安静地度过一年（含基本开销与死亡判定，无随机事件）
    for (let i = 0; i < 52; i++) {
      s.week++;
      const na = s.startAge + Math.floor(s.week / 52); const aged = na !== s.age;
      s.age = na; s.year = s.birthYear + s.age; s.eraWind = C.windAt(s.year);
      if (s.week % 4 === 0) { add(s, "cash", -Math.round(2000 + s.age * 60)); }
      if (aged && s.age > 35) add(s, "health", -1);
      if (s.age >= 16 && rollDeath()) { s.ending = s._deathRecap || "你走完了这一生。"; finishGame(); return false; }
    }
    return true;
  }
  function renderCommitment() {
    const c = s.commitment, ref = c.ref;
    const blurb = ref.blurbs[Math.min(c.yearIdx, ref.blurbs.length - 1)] || "";
    app().innerHTML = `<div class="screen play">${dashboard()}
      <div class="stagebar">🛫 ${ref.label}中 · 第 ${c.yearIdx + 1} / ${ref.years} 年</div>
      <div class="ev-card" style="border-color:var(--line)"><div class="ev-text">${blurb}</div></div>
      <button class="btn primary" id="goyear">度过这一年 →</button></div>`;
    document.getElementById("goyear").onclick = () => {
      ref.perYear(s);
      if (!lightAdvanceYear()) { render(); return; }   // 期间可能离世
      c.yearIdx++;
      if (c.yearIdx >= ref.years) {
        const t = ref.end(s); if (t) { s.timeline.push({ age: s.age, text: t }); weekLog = ["📌 " + t]; }
        s.commitment = null;
        if (ref.endEvent) { const ev = C.events.find(x => x.id === ref.endEvent); if (ev) { enterEvent(ev); screen = "event"; render(); return; } }
        screen = "play"; render(); return;
      }
      render();
    };
  }

  /* ============================ 📱 手机：一台真能用的手机 ============================ */
  // 「绿泡泡」图标：仿微信的两枚白色对话气泡（绿底由 .ph-ic-wx 提供）
  const WX_ICON = '<svg class="appsvg" viewBox="0 0 100 100" aria-hidden="true">'
    + '<ellipse cx="41" cy="44" rx="28" ry="23" fill="#fff"/>'
    + '<path d="M26 61 L17 73 L34 65 Z" fill="#fff"/>'
    + '<circle cx="33" cy="41" r="3.4" fill="#07a84e"/><circle cx="50" cy="41" r="3.4" fill="#07a84e"/>'
    + '<ellipse cx="69" cy="64" rx="22" ry="18" fill="#fff"/>'
    + '<path d="M82 77 L90 87 L76 79 Z" fill="#fff"/>'
    + '<circle cx="63" cy="62" r="2.7" fill="#07a84e"/><circle cx="76" cy="62" r="2.7" fill="#07a84e"/>'
    + '</svg>';
  // 「老大直聘」图标：青色对话气泡里一位打领带的"老大"（青底由 .ph-ic-boss 提供）
  const BOSS_ICON = '<svg class="appsvg" viewBox="0 0 100 100" aria-hidden="true">'
    + '<path d="M20 22 h60 a11 11 0 0 1 11 11 v30 a11 11 0 0 1 -11 11 h-33 l-16 13 v-13 h-11 a11 11 0 0 1 -11 -11 v-30 a11 11 0 0 1 11 -11 z" fill="#fff"/>'
    + '<circle cx="50" cy="40" r="9" fill="#0bb3b0"/>'
    + '<path d="M34 64 a16 13 0 0 1 32 0 z" fill="#0bb3b0"/>'
    + '<path d="M50 49 l-4.5 6 4.5 9 4.5 -9 z" fill="#fff"/>'
    + '</svg>';
  // 「穷途熊熊」股市软件图标：一只白熊脸（深色底由 .ph-ic-bear 提供）
  const BEAR_ICON = '<svg class="appsvg" viewBox="0 0 100 100" aria-hidden="true">'
    + '<circle cx="29" cy="31" r="12" fill="#fff"/><circle cx="71" cy="31" r="12" fill="#fff"/>'
    + '<circle cx="50" cy="55" r="30" fill="#fff"/>'
    + '<circle cx="40" cy="49" r="3.6" fill="#1a1a1a"/><circle cx="60" cy="49" r="3.6" fill="#1a1a1a"/>'
    + '<ellipse cx="50" cy="66" rx="13" ry="9.5" fill="#e9d7c3"/>'
    + '<ellipse cx="50" cy="61" rx="4.2" ry="3.2" fill="#1a1a1a"/>'
    + '</svg>';
  // 「淘粑」购物图标：白色购物袋（橙底由 .ph-ic-taoba 提供）
  const TAOBA_ICON = '<svg class="appsvg" viewBox="0 0 100 100" aria-hidden="true">'
    + '<path d="M28 38 h44 l-4 40 a6 6 0 0 1 -6 5 h-24 a6 6 0 0 1 -6 -5 z" fill="#fff"/>'
    + '<path d="M38 40 v-6 a12 12 0 0 1 24 0 v6" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
    + '<text x="50" y="68" font-size="20" fill="#ff6a00" text-anchor="middle" font-weight="900" font-family="sans-serif">淘</text>'
    + '</svg>';
  // 「抖声」短视频图标：白色音符（黑底由 .ph-ic-dou 提供）
  const DOUSHENG_ICON = '<svg class="appsvg" viewBox="0 0 100 100" aria-hidden="true">'
    + '<path d="M58 22 q10 4 18 4 v14 q-10 0 -18 -4 v26 a18 18 0 1 1 -12 -17 v-23 z" fill="#fff"/>'
    + '<path d="M58 22 q10 4 18 4 v14 q-10 0 -18 -4 v26 a18 18 0 1 1 -12 -17 v-23 z" fill="none" stroke="#25f4ee" stroke-width="1.5" opacity="0.6"/>'
    + '</svg>';
  // app 注册表：主屏图标网格按此顺序排列（电话/浏览器/短信/音乐放进底部 Dock，不进网格）
  const PHONE_APPS = [
    { id: "wechat", icon: "💬", svg: WX_ICON, name: "绿泡泡", green: true },
    { id: "boss", icon: "💼", svg: BOSS_ICON, name: "老大直聘", teal: true },
    { id: "news", icon: "📰", name: "头条" },
    { id: "msg", icon: "🔔", name: "通知" },
    { id: "contacts", icon: "📇", name: "通讯录" },
    { id: "wallet", icon: "💰", name: "钱包" },
    { id: "market", icon: "🐻", svg: BEAR_ICON, name: "穷途熊熊", bear: true },
    { id: "taoba", icon: "🛍️", svg: TAOBA_ICON, name: "淘粑", taoba: true },
    { id: "calendar", icon: "📅", name: "日历" },
    { id: "album", icon: "🖼️", name: "相册" },
    { id: "reels", icon: "🎵", svg: DOUSHENG_ICON, name: "抖声", dou: true },
    { id: "notes", icon: "📝", name: "备忘录" },
    { id: "calc", icon: "🧮", name: "计算器" },
    { id: "weather", icon: "⛅", name: "天气" },
    { id: "settings", icon: "⚙️", name: "设置" }
  ];
  // 底部 Dock（仿真手机）：电话 / 浏览器 / 短信 / 音乐
  const DOCK_APPS = [
    { id: "call", icon: "📞", name: "电话", tile: "call" },
    { id: "browser", icon: "🧭", name: "浏览器", tile: "browser" },
    { id: "sms", icon: "✉️", name: "短信", tile: "sms" },
    { id: "music", icon: "🎵", name: "音乐", tile: "music" }
  ];
  function seasonName() { const w = s.week % 52; return w < 13 ? "春" : w < 26 ? "夏" : w < 39 ? "秋" : "冬"; }
  // 壁纸：手机主屏 / 电脑桌面共用一套（在手机「设置」里换）
  const WALLPAPERS = [
    { id: "deep", name: "深空", css: "radial-gradient(120% 90% at 50% 0%,#1c2030 0%,#0b0c12 60%)" },
    { id: "aurora", name: "极光", css: "linear-gradient(160deg,#0b3d3a,#0a2540 55%,#231047)" },
    { id: "dusk", name: "晚霞", css: "linear-gradient(160deg,#2a1840,#7a2e5d 55%,#c25e3a)" },
    { id: "forest", name: "森野", css: "linear-gradient(160deg,#0e2a1e,#13361f 60%,#241f10)" },
    { id: "sakura", name: "樱粉", css: "linear-gradient(160deg,#2e1c2a,#5a2b3e 55%,#8a4a63)" },
    { id: "mono", name: "极简", css: "linear-gradient(160deg,#1c1c22,#0b0b0f)" }
  ];
  function wallCss() { const w = WALLPAPERS.find(x => x.id === (s._wall || "deep")) || WALLPAPERS[0]; return w.css; }
  // 各 app 的红点角标（微信=关键角色危机；通知=系统提醒）
  function phoneBadges() {
    const b = {};
    let wx = 0;
    if (s.cast) wx += Object.keys(s.cast).filter(k => s.cast[k] && s.cast[k].crisis).length;
    if (wx) b.wechat = wx;
    if (has(s, "starving")) b.msg = 1;
    const su = smsUnread(); if (su) b.sms = su;
    const missed = Math.min(9, Math.floor((wxContacts().filter(c => !c.group && !c.fam).length) / 4)); if (missed) b.call = missed;
    return b;
  }
  // 顶部 app 标题栏 + 返回主屏
  function phoneHeader(title, sub) {
    return `<div class="ap-head"><button class="ap-back" id="phBack">‹ 主屏</button>
      <div class="ap-title">${title}${sub ? `<small>${sub}</small>` : ""}</div></div>`;
  }
  // —— 主屏：时钟挂件 + 身价挂件 + 图标网格 ——
  function phoneHome() {
    const badges = phoneBadges();
    const nw = Math.round(netWorth(s));
    const icons = PHONE_APPS.map(a => {
      const bd = badges[a.id] || 0;
      const tile = a.green ? " ph-ic-wx" : a.teal ? " ph-ic-boss" : a.bear ? " ph-ic-bear" : a.taoba ? " ph-ic-taoba" : a.dou ? " ph-ic-dou" : "";
      return `<button class="ph-app" data-app="${a.id}"><span class="ph-ic${tile}">${a.svg || a.icon}${bd ? `<i class="ph-badge">${bd > 9 ? "9+" : bd}</i>` : ""}</span><span class="ph-nm">${a.name}</span></button>`;
    }).join("");
    const dock = DOCK_APPS.map(a => {
      const bd = badges[a.id] || 0;
      return `<button class="ph-dock-app" data-app="${a.id}" title="${a.name}"><span class="ph-ic ph-ic-${a.tile}">${a.icon}${bd ? `<i class="ph-badge">${bd > 99 ? "99+" : bd}</i>` : ""}</span></button>`;
    }).join("");
    return `<div class="ph-home" style="background:${wallCss()}">
      <div class="ph-widgets">
        <div class="ph-w ph-w-clock"><div class="ph-clock">${phoneClock()}</div><div class="ph-date">${s.year}年${seasonName()} · 周${["日","一","二","三","四","五","六"][s.week % 7]}</div></div>
        <div class="ph-w ph-w-worth"><small>当前身价</small><b>¥${nw.toLocaleString()}</b><span>${s.age}岁 · ${C.CLASS_NAMES[classTier(s)]}</span></div>
      </div>
      <div class="ph-grid">${icons}</div>
      <div class="ph-dock">${dock}</div>
    </div>`;
  }
  // —— 头条（保留原新闻流 + 深扒机制）——
  function appNews() {
    if (!s.news || !s.news.length) s.news = buildFeed(s, true);
    const cards = s.news.map(newsCard).join("");
    return phoneHeader("📰 今日头条", "风口藏在字缝里")
      + trendStrip()
      + `<div class="phone-feed">${cards}</div>`
      + `<div class="ap-foot"><button class="btn primary" id="dig">🌙 熬夜深扒，多翻几页</button></div>`
      + `<p class="ap-note">没人会直接告诉你答案。但翻得够多，好几条看似无关的新闻，其实都在反复念叨同一件事。</p>`;
  }
  // —— 通知：系统类消息（账单 / 行情 / 风口 / 生存警报）。人际全部交给微信 ——
  function phoneThreads() {
    const out = [];
    if (has(s, "starving")) out.push({ id: "warn", av: "🆘", who: "生存警报", role: "系统", time: "现在", text: "你已资不抵债、坐吃山空，再不想办法就要断炊了。", to: "wallet", urgent: true });
    const mb = C._util.monthlyBill ? C._util.monthlyBill(s) : null;
    if (mb) out.push({ id: "bank", av: "🏦", who: "招银通知", role: "账单", time: "本月", text: `本月各项账单合计约 ¥${mb.total.toLocaleString()}，记得留足余额。`, to: "wallet" });
    if (s.market && s.market.hold) {
      const held = Object.keys(s.market.hold).filter(id => s.market.hold[id] > 0);
      if (held.length) out.push({ id: "stk", av: "📈", who: "自选股助手", role: "行情", time: "今日", text: `你持有 ${held.length} 只股票，最新市值约 ¥${Math.round(C._util.stockValue(s)).toLocaleString()}。点开看今日涨跌。`, to: "stocks" });
    }
    if (s.knownSignals) {
      const hot = Object.keys(s.knownSignals).filter(id => (s.knownSignals[id].confidence || 0) >= 50 && SIGNAL_LABEL[id]);
      if (hot.length) out.push({ id: "sig", av: "📡", who: "风口雷达", role: "情报", time: "近期", text: `你嗅到的方向：${hot.slice(0, 3).map(id => SIGNAL_LABEL[id]).join("、")}。读懂趋势，押对赛道。`, to: "news" });
    }
    return out;
  }
  function appMessages() {
    const th = phoneThreads();
    const rows = th.length ? th.map(t => `<button class="msg-row${t.urgent ? " urgent" : ""}" ${t.to ? (["social"].includes(t.to) ? `data-screen="${t.to}"` : `data-app="${t.to}"`) : ""}>
        <span class="msg-av">${t.av}</span>
        <span class="msg-mid"><span class="msg-top"><b>${t.who}</b><small>${t.time}</small></span><span class="msg-prev">${t.text}</span></span>
        <span class="msg-go">查看›</span>
      </button>`).join("") : `<div class="ph-empty">📭 暂无新通知，岁月静好。</div>`;
    return phoneHeader("🔔 通知", `${th.length} 条系统消息`) + `<div class="msg-list">${rows}</div>`;
  }

  /* ============================ 💬 微信（绿泡泡）============================ */
  // 联系人定位：pid = "cast:KEY"（关键角色，用 trust）或 "soc:IDX"（社交圈，用 attitude）
  function wxPeer(pid) {
    if (!pid) return null;
    if (pid.indexOf("fam:") === 0) { const k = pid.slice(4); if (!FAM_NAME[k]) return null; return { id: pid, fam: true, famKey: k, group: (k === "home" || k === "clan"), name: FAM_NAME[k], role: FAM_ROLE[k], av: FAM_AV[k] }; }
    if (pid.indexOf("cast:") === 0) { const k = pid.slice(5); const c = s.cast && s.cast[k]; return c ? { id: pid, obj: c, isCast: true, name: c.name, role: c.role } : null; }
    const i = +pid.slice(4); const n = (s.social || [])[i]; return n ? { id: pid, obj: n, isCast: false, idx: i, name: n.name, role: n.role } : null;
  }
  function wxFavVal(p) { if (p.fam) return Math.round(famTrust(p.group ? "avg" : p.famKey)); return Math.round(p.isCast ? (p.obj.trust || 50) : (p.obj.attitude || 50)); }
  function wxFav(p, d) { if (p.fam) { if (!p.group) famAdjust(p.famKey, d); return; } if (p.isCast) p.obj.trust = Math.max(0, Math.min(100, (p.obj.trust || 50) + d)); else p.obj.attitude = Math.max(0, Math.min(100, (p.obj.attitude || 50) + d)); }
  function wxFace(fav, cast) { return cast ? "🎭" : fav >= 70 ? "😊" : fav >= 40 ? "🙂" : "😒"; }
  function wxSeed(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000; return h; }
  /* ===== 亲情：爸 / 妈 + 一家人小群 + 大家族大群（绿泡泡专属虚拟联系人，不进 cast）===== */
  const FAM_AV = { dad: "👨", mom: "👩", home: "💗", clan: "🏮" };
  const FAM_NAME = { dad: "爸", mom: "妈", home: "💗 一家人", clan: "👨‍👩‍👧‍👦 大家族群" };
  const FAM_ROLE = { dad: "父亲", mom: "母亲", home: "家庭群 · 就咱仨", clan: "亲戚群 · 七大姑八大姨" };
  // 三套家庭剧本，随出身/籍贯不同：humble 寒门苦出身 / worker 工薪 / wealthy 优渥
  const FAM_DATA = {
    humble: {
      blurb: "家在小地方，爸妈起早贪黑供你读出来，省吃俭用、话不多，把最好的都留给了你。",
      dad: { open: ["在外头还顺利不？吃饭莫省，钱不够说一声。", "你妈念叨你好几回了，得空回个话。", "家里都好，你莫挂心，照顾好自己。", "活路再忙也要按时吃饭，身体是本钱。"], reply: ["嗯，晓得了，你也是。", "行，那爸不打扰你忙。", "乖，听话。"] },
      mom: { open: ["崽啊，天凉了记得加衣裳。", "钱够用不？妈这有，莫亏着自己。", "昨天炖了汤，可惜你不在屋头。", "想你了，过年早点回来嘛。"], reply: ["哎哟知道你忙，妈不多说。", "记得吃饭，啊。", "在外头注意身体。"] },
      home: [{ w: "妈", t: "崽今天吃饭没得哦？" }, { w: "爸", t: "你妈又开始了，娃儿忙得很。" }, { w: "妈", t: "我问一哈都不行啊！@崽 周末回来不？给你炖排骨。" }, { w: "爸", t: "钱不够给屋头说，莫硬扛。" }, { w: "妈", t: "对头，天要降温了，记到加衣裳。" }],
      clan: [{ w: "大伯", t: "都看哈这个：早起一杯水，养生又长寿🌿" }, { w: "三舅", t: "大伯天天转发这些，哈哈哈" }, { w: "二姨", t: "@崽 在大城市出息咯，几时带对象回来嘛~" }, { w: "幺姑", t: "就是噻，该相看相看了。" }, { w: "三舅", t: "周末杀年猪，都回来吃刨汤！我先发个红包热闹下👇" }, { w: "三舅", hb: 6.66 }, { w: "大伯", t: "手快有手慢无！" }],
      allow: [1500, 1600, 1700], allowNote: { low: ["这个月就这些，省着点用，莫乱花。", "家里也紧，紧着吃饭要紧。"], high: ["不够再跟妈说，莫饿着自己。", "拿去，在外头别亏待自己。"] }
    },
    worker: {
      blurb: "普通工薪家庭，爸妈是厂里/单位的老实人，最盼你稳定、别折腾，唠叨里全是操心。",
      dad: { open: ["最近工作咋样？别太拼，身体要紧。", "你妈让我问你周末回不回来吃饭。", "要不考虑考个编制？稳当。", "房租交了没？手头紧就说话。"], reply: ["嗯，知道就好。", "行，你忙吧。", "注意身体。"] },
      mom: { open: ["按时吃饭啊，别老点外卖。", "对象处得咋样了？妈不催，就问问。", "降温了，多穿点。", "钱够花不？妈给你打点过去。"], reply: ["哎，妈就唠叨这几句。", "记得早点睡。", "在外注意安全。"] },
      home: [{ w: "妈", t: "今天加班不？别太晚。" }, { w: "爸", t: "你妈一天到晚就知道催。" }, { w: "妈", t: "我这不是关心嘛！@儿子 周末回来吃饭不？买了你爱吃的。" }, { w: "妈", t: "给你寄了点特产，查收 [图片]" }, { w: "爸", t: "工作稳当最重要，钱不够说话。" }],
      clan: [{ w: "大姨", t: "@大家 转发个：这5种食物千万别一起吃！" }, { w: "二叔", t: "大姨这养生文我看了八百遍咯哈哈" }, { w: "表姐", t: "二叔你上回说的工作给问没？" }, { w: "二叔", t: "在问着呢急啥。话说咱家娃在大公司，了不起！" }, { w: "姑妈", t: "说起来娃儿对象有着落没？我这有个合适的。" }, { w: "小舅", t: "过年都回来啊，我先包个红包图个吉利🧧" }, { w: "小舅", hb: 8.88 }, { w: "大姨", t: "谢谢小舅，新年发财！" }],
      allow: [1600, 1800, 1900], allowNote: { low: ["这个月先这些，下月发了再补你。", "省着点，别月底吃土。"], high: ["够不够？不够言语一声。", "拿着，该花花，别太省。"] }
    },
    wealthy: {
      blurb: "家境优渥，爸妈见过世面，给得起也舍得给，话里带着分寸，盼你有出息、别躺平。",
      dad: { open: ["最近在忙什么项目？需要资源跟我说。", "别光顾着玩，正事上点心。", "你妈又给你安排了个饭局，去不去？", "账上钱够吗？不够我让财务转。"], reply: ["嗯，有想法是好事。", "行，自己拿主意。", "注意分寸。"] },
      mom: { open: ["宝贝，最近气色怎么样？别熬夜。", "周末陪妈去看个展？", "新出的那款表我让人给你留了。", "缺什么直接刷卡，别替我们省。"], reply: ["妈就是想你了。", "照顾好自己。", "早点休息。"] },
      home: [{ w: "妈", t: "今晚家宴，张姨掌勺，回来吗？" }, { w: "爸", t: "忙就别勉强，正事要紧。" }, { w: "妈", t: "偶尔也得陪陪家里嘛。@宝贝 给你订了体检，记得去 [图片]" }, { w: "爸", t: "那个项目我看了，靠谱再投，缺钱跟我说。" }, { w: "妈", t: "李伯伯家闺女回国了，改天聚聚？" }],
      clan: [{ w: "大伯", t: "@各位 家族基金这季度分红已到账📈" }, { w: "二姑", t: "大伯辛苦！咱家娃这么优秀，考虑接班不？" }, { w: "堂哥", t: "接啥班，先来周末游艇趴🛥️" }, { w: "姨妈", t: "那块地的事，回头家里碰个头。" }, { w: "舅舅", t: "先给孩子们包个红包，沾沾喜气🧧" }, { w: "舅舅", hb: 88 }, { w: "堂哥", t: "谢谢舅舅！" }],
      allow: [1800, 1900, 2000], allowNote: { low: ["先打这些，不够随时说。", "别替我们省，该花花。"], high: ["拿着零花，不够再要。", "别亏待自己，钱不是问题。"] }
    }
  };
  function famArch() {
    if (s._famArch) return s._famArch;
    const t = s.assetTier || "worker";
    const tags = (s.birthplace && s.birthplace.origin && s.birthplace.origin.tags) || [];
    const humble = ["寒门", "苦瘠", "山村", "旱塬", "缺水", "高寒", "边陲", "农", "矿", "留守", "下岗"];
    let a = "worker";
    if (t === "rich" || t === "upper") a = "wealthy";
    else if (t === "poor" || tags.some(x => humble.some(h => String(x).indexOf(h) >= 0))) a = "humble";
    s._famArch = a; return a;
  }
  function famEnsure() {
    if (!s._fam) {
      const base = { humble: 76, worker: 70, wealthy: 64 }[famArch()] || 70;
      const seed = wxSeed((s.playerName || "") + (s.cohortName || ""));
      s._fam = { dad: Math.min(92, base - 3 + seed % 7), mom: Math.min(94, base + 2 + (seed * 7) % 7) };
    }
    return s._fam;
  }
  function famTrust(k) { const f = famEnsure(); return k === "dad" ? f.dad : k === "mom" ? f.mom : Math.round((f.dad + f.mom) / 2); }
  function famAdjust(k, d) { const f = famEnsure(); if (k === "dad" || k === "mom") f[k] = Math.max(0, Math.min(100, f[k] + d)); }
  function famBetter() { const f = famEnsure(); return f.dad >= f.mom ? "dad" : "mom"; }
  function famOpener(p) {
    const D = FAM_DATA[famArch()];
    if (p.famKey === "home") return "💗 一家人 · 爸妈和你的小群";
    if (p.famKey === "clan") return "👨‍👩‍👧‍👦 一大家子，七大姑八大姨都在这。";
    const pool = (D[p.famKey] || D.mom).open;
    return pool[(wxSeed(s.playerName || "") + Math.floor(s.week / 4)) % pool.length];
  }
  // 群成员头像（按称呼粗判性别/辈分）
  function famMemberAv(who) {
    if (/妈|姨|姑|姐|奶|婶|嫂/.test(who || "")) return "👩";
    if (/爸|伯|叔|舅|哥|爷|公/.test(who || "")) return "👨";
    return "🧑";
  }
  // 群聊：首次打开时把"对话式"模板灌进 _wxlog（含可领的红包），之后就是真实聊天记录
  function famGroupLog(key) {
    const pid = "fam:" + key;
    s._wxlog = s._wxlog || {}; s._famSeed = s._famSeed || {};
    if (!s._famSeed[pid]) {
      const tpl = FAM_DATA[famArch()][key] || [];
      s._wxlog[pid] = tpl.map(x => x.hb != null
        ? { me: false, who: x.w, type: "hb", amount: x.hb, note: "恭喜发财，大吉大利", claimed: false }
        : { me: false, who: x.w, text: x.t });
      s._famSeed[pid] = true;
    }
    return s._wxlog[pid];
  }
  // 爸/妈的聊天历史：用现成的开场/回话拼一段过去的对话，首次打开灌进 _wxlog（保留已有的转账/聊天）
  function famParentHist(key) {
    const D = FAM_DATA[famArch()][key] || FAM_DATA.worker.mom;
    const me1 = key === "mom" ? "妈我挺好的，你别担心。" : "爸我这边还行，就是有点忙。";
    return [
      { me: false, text: D.open[0] },
      { me: true, text: me1 },
      { me: false, text: D.reply[0] },
      { me: true, text: "嗯，你们也照顾好自己，别太累。" },
      { me: false, text: D.open[1 % D.open.length] },
      { me: true, text: "知道啦，得空我回去看你们。" },
      { me: false, text: D.reply[1 % D.reply.length] }
    ];
  }
  function famParentSeed(pid, key) {
    s._wxlog = s._wxlog || {}; s._famSeed = s._famSeed || {};
    if (!s._famSeed[pid]) { const existing = s._wxlog[pid] || []; s._wxlog[pid] = famParentHist(key).concat(existing); s._famSeed[pid] = true; }
    return s._wxlog[pid];
  }
  // 社交圈：按性格(kind)+关系塑造的开场白，不再千篇一律「在吗」
  function wxSocialOpen(p, fav, crisis) {
    if (crisis) return (CAST_CRISIS_LABEL[crisis] || "有急事找你") + "……在吗？";
    const o = p.obj || {}; const kind = o.kind || "普通";
    const byKind = {
      "势利": fav >= 65 ? ["哟，最近混得风生水起啊，带带兄弟呗～", "听说你最近不错？改天一起搓一顿。"] : ["嗯……你最近混得咋样？", "有事？没事我先忙了哈。"],
      "清高": fav >= 65 ? ["最近在读什么书？想听听你的看法。", "难得有人聊得来，最近可好？"] : ["嗯。", "你最近……在忙些有意义的事吗？"],
      "仗义": fav >= 55 ? ["兄弟！好久不见，有事尽管开口！", "想你了！啥时候喝一杯？"] : ["在呢，咋啦？说！", "有困难言语一声，别跟我客气。"],
      "亲情": ["最近吃好睡好没？别太累着。", "想你了，啥时候回来看看。"],
      "普通": fav >= 60 ? ["好久没联系了，最近还好吧？", "哈，想起你了，最近忙啥呢？"] : fav >= 40 ? ["在吗？最近怎么样？", "有阵子没聊了。"] : ["嗯。", "……"]
    };
    const pool = byKind[kind] || byKind["普通"];
    return pool[wxSeed(p.name + (p.role || "")) % pool.length];
  }
  // 没领的家里转账/红包自动到账（生活费不白丢），返回到账总额
  function famAutoCollect() {
    let total = 0;
    ["fam:dad", "fam:mom"].forEach(pid => { const log = s._wxlog && s._wxlog[pid]; if (!log) return; log.forEach(m => { if (!m.me && !m.claimed && (m.type === "transfer" || m.type === "hb")) { m.claimed = true; total += Number(m.amount) || 0; } }); });
    if (total) add(s, "cash", total);
    return total;
  }
  // 月初生活费：关系更好的一方以「微信转账」发来（1500-2000整百，待你收款）；上月没领的自动到账
  function famMonthlyAllowance() {
    const month = Math.floor(s.week / 4);
    if (s._famAllowMonth === month) return 0;
    s._famAllowMonth = month;
    const collected = famAutoCollect();   // 上个月忘收的，先自动到账
    const D = FAM_DATA[famArch()];
    const who = famBetter();
    const t = famTrust(who);
    let amt = D.allow[t >= 82 ? 2 : t >= 66 ? 1 : 0];
    amt = Math.max(1500, Math.min(2000, Math.round(amt / 100) * 100));
    const high = amt >= 1800;
    const note = pick(D.allowNote[high ? "high" : "low"]);
    const pid = "fam:" + who;
    s._wxlog = s._wxlog || {}; const log = s._wxlog[pid] = s._wxlog[pid] || [];
    log.push({ me: false, type: "transfer", amount: amt, note: "这个月的生活费", claimed: false });
    log.push({ me: false, text: note });
    if (log.length > 60) s._wxlog[pid] = log.slice(-60);
    s._famAllowNotice = { who, amt };
    return collected;
  }
  // 微信好友 = 亲情(爸/妈/小群/大群) + 关键角色 + 关系靠前的社交圈
  function wxContacts() {
    const arr = [];
    arr.push({ pid: "fam:dad", name: "爸", role: "父亲", fav: famTrust("dad"), fam: true, famKey: "dad", av: FAM_AV.dad, star: true });
    arr.push({ pid: "fam:mom", name: "妈", role: "母亲", fav: famTrust("mom"), fam: true, famKey: "mom", av: FAM_AV.mom, star: true });
    arr.push({ pid: "fam:home", name: FAM_NAME.home, role: FAM_ROLE.home, fav: famTrust("avg"), fam: true, famKey: "home", group: true, av: FAM_AV.home, star: true });
    arr.push({ pid: "fam:clan", name: FAM_NAME.clan, role: FAM_ROLE.clan, fav: famTrust("avg"), fam: true, famKey: "clan", group: true, av: FAM_AV.clan, star: true });
    if (s.cast) Object.keys(s.cast).forEach(k => { const c = s.cast[k]; if (!c || !c.name) return; if (/爸妈|父母|爹娘/.test(c.name + (c.role || ""))) return; /* 父母已拆成独立的爸/妈 */ arr.push({ pid: "cast:" + k, name: c.name, role: c.role, fav: Math.round(c.trust || 50), crisis: c.crisis, star: true }); });
    (s.social || []).map((n, i) => ({ n, i })).filter(({ n }) => !/爸妈|父母|爹娘|爸爸|妈妈/.test((n.name || "") + (n.role || ""))).sort((a, b) => (b.n.attitude || 0) - (a.n.attitude || 0)).slice(0, 12).forEach(({ n, i }) => arr.push({ pid: "soc:" + i, name: n.name, role: n.role, fav: Math.round(n.attitude || 0) }));
    return arr;
  }
  function wxAvatarOf(c) { return c.av || wxFace(c.fav, c.star); }
  function wxOpenLine(name, fav, crisis) {
    if (crisis) return (CAST_CRISIS_LABEL[crisis] || "有急事找你") + "……在吗？";
    const pool = fav >= 70 ? ["哈哈最近忙啥呢？", "上次那事多谢你！", "啥时候出来聚聚～"] : fav >= 45 ? ["在吗？", "最近怎么样？", "好久不见。"] : ["嗯。", "有事？", "……"];
    return pool[wxSeed(name) % pool.length];
  }
  function wxLastLine(c) {
    if (c.crisis) return (CAST_CRISIS_LABEL[c.crisis] || "有急事找你") + "……";
    const log = s._wxlog && s._wxlog[c.pid];
    if (log && log.length) { const last = log[log.length - 1]; const body = last.text || (last.type === "hb" ? "[微信红包]" : last.type === "transfer" ? "[微信转账]" : ""); return (last.me ? "我: " : (last.who ? last.who + ": " : "")) + body; }
    if (c.fam) {
      if (c.famKey === "home") { const h = FAM_DATA[famArch()].home; return "妈: " + h[wxSeed("home") % h.length].t; }
      if (c.famKey === "clan") { const cl = FAM_DATA[famArch()].clan; const m = cl[wxSeed("clan") % cl.length]; return m.w + ": " + m.t; }
      const pool = FAM_DATA[famArch()][c.famKey].open; return pool[wxSeed(c.name) % pool.length];
    }
    return wxOpenLine(c.name, c.fav, null);
  }
  // 熟悉度标签
  function wxFamLabel(fav) { return fav >= 85 ? "❤️ 至交" : fav >= 70 ? "💚 熟络" : fav >= 50 ? "🙂 相识" : fav >= 30 ? "😐 点头之交" : "👋 陌生人"; }
  // 生日/年龄的确定性合成（社交圈 NPC 一般没存生日，按名字派生，看着真实即可）
  const ZODIAC = ["摩羯", "水瓶", "双鱼", "白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手"];
  function wxSynthAge(p) { const o = p.obj || {}; if (o.age) return o.age; return 22 + (wxSeed(p.name + "a") % 20); }
  function wxSynthBday(p) { const o = p.obj || {}; if (o.birthday) return o.birthday; const sd = wxSeed(p.name + "b"); const mo = (sd % 12) + 1; const day = (Math.floor(sd / 12) % 28) + 1; return `${mo}月${day}日 · ${ZODIAC[mo - 1]}座`; }
  // 备注资料：越熟越详细——一层层解锁对方的信息
  function wxNote(p) {
    const fav = wxFavVal(p), lines = [];
    if (p.fam) {                                  // ★爸妈/家人：不堆资料，血浓于水
      lines.push(`身份 · ${p.role}`);
      if (p.group) lines.push(p.famKey === "home" ? "成员 · 爸、妈，还有你" : "成员 · 七大姑八大姨，一大家子");
      else lines.push(`关系 · ${fav >= 80 ? "无话不说，你的事他都记挂" : fav >= 60 ? "关心你，只是不太会表达" : "有点距离，但终归是家人"}`);
      lines.push(FAM_DATA[famArch()].blurb);
      return lines;
    }
    const o = p.obj || {};
    lines.push(`身份 · ${p.role}`);
    if (fav >= 30 && !p.isCast && o.kind) lines.push(`性格 · ${o.kind}`);
    if (fav >= 45) {
      if (!p.isCast && o.persona) lines.push(`印象 · ${o.persona.emoji || ""}${o.persona.name || ""}${o.persona.desc ? "，" + o.persona.desc : ""}`);
      if (p.isCast && o.industry && C._util.INDUSTRIES && C._util.INDUSTRIES[o.industry]) lines.push(`行当 · ${C._util.INDUSTRIES[o.industry].name}`);
    }
    const job = o.job || o.title || o.profession || o.occupation;
    if (fav >= 50 && (job || o.company)) lines.push(`职位 · ${job || "在职"}${o.company ? " @" + o.company : ""}`);   // 有职位才写职位
    if (fav >= 55) lines.push(`年龄 · 约 ${wxSynthAge(p)} 岁`);
    if (fav >= 65) lines.push(`生日 · ${wxSynthBday(p)}`);
    if (fav >= 60 && !p.isCast && o.homeCity) lines.push(`常驻 · ${o.homeCity}${o.residence ? " · " + o.residence : ""}${o.meetable ? " · 可约见" : " · 多远程联系"}`);
    if (fav >= 70 && !p.isCast && o.persona && o.persona.quirk) lines.push(`小癖好 · ${o.persona.quirk}`);
    if (fav >= 75 && p.isCast && o.pressure != null) lines.push(`近况 · ${o.pressure >= 60 ? "压力很大，最近不好过" : o.pressure >= 35 ? "日子还算稳当" : "状态轻松"}${o.crisis ? "，眼下正遇着难处" : ""}`);
    if (fav >= 85) lines.push(p.isCast ? "至交 · 他的事就是你的事，关键时刻能托付。" : "至交 · 知根知底，落难时也愿拉你一把。");
    return lines;
  }
  function wxNoteCard(p) {
    const fav = wxFavVal(p);
    const lines = wxNote(p);
    const more = fav < 85 ? `<div class="wx-note-tip">再熟一点，你会知道更多关于 ta 的事。</div>` : "";
    return `<div class="wx-note"><div class="wx-note-h"><span>📒 备注资料</span><span class="wx-fam">${wxFamLabel(fav)} · ${fav}</span></div>
      ${lines.map(l => `<div class="wx-note-l">${l}</div>`).join("")}${more}</div>`;
  }
  // 快捷回复表：真改好感 / 心情 / 现金
  const WX_REPLIES = [
    { id: "hi", label: "👋 打招呼", my: "在的，挺好的，你呢？", fav: 1, mood: 1, reply: p => wxFavVal(p) >= 50 ? "那就好，有空多聊！" : "哦，知道了。" },
    { id: "care", label: "❤️ 关心近况", my: "最近还顺吗？有需要尽管开口。", fav: 2, mood: 1, reply: "谢谢你还记挂着我，挺好的。" },
    { id: "meal", label: "🍚 约饭(¥200)", cost: 200, my: "周末出来吃个饭呗，我请！", fav: 3, mood: 2, reply: "哈哈好啊，那说定了～" },
    { id: "hb", label: "🧧 发红包(¥888)", cost: 888, hb: 888, fav: 6, mood: 1 },
    { id: "tf1", label: "💸 转账¥200", cost: 200, tf: 200, fav: 2 },
    { id: "tf2", label: "💸 转账¥1000", cost: 1000, tf: 1000, fav: 4 },
    { id: "borrow", label: "💰 开口借钱", special: true }
  ];
  // 仿真：伪时间戳 + 未读数
  function wxTime(c) { if (c.crisis) return "刚刚"; const log = s._wxlog && s._wxlog[c.pid]; if (log && log.length) return "刚刚"; return ["昨天", "星期一", "10:24", "周三", "上午 9:07", "13:52", "前天"][wxSeed(c.name) % 7]; }
  function wxUnread(c) { return c.crisis ? 1 : 0; }
  // —— 顶部栏（微信风：返回主屏 + 居中标题 + ＋）——
  function wxTopBar(tab, unread) {
    const titles = { chats: "绿泡泡" + (unread ? `(${unread})` : ""), contacts: "通讯录", discover: "发现", me: "我" };
    return `<div class="wxw-top"><button class="wxw-back" id="phBack">‹</button><span class="wxw-title">${titles[tab] || "绿泡泡"}</span><button class="wxw-add" id="wxAdd">＋</button></div>`;
  }
  // —— 底部导航（微信四大 tab）——
  function wxBottomNav(tab, unread) {
    const items = [["chats", "💬", "微信", unread], ["contacts", "👥", "通讯录", 0], ["discover", "🧭", "发现", wxDiscoverDot()], ["me", "🙂", "我", 0]];
    return `<div class="wxw-nav">${items.map(([k, ic, nm, bd]) => `<button class="wxw-navbtn ${tab === k ? "on" : ""}" data-wxtab="${k}"><span class="wxw-ic">${ic}${bd ? `<i class="wxw-dot">${bd > 99 ? "99+" : bd}</i>` : ""}</span><span class="wxw-nm">${nm}</span></button>`).join("")}</div>`;
  }
  function wxDiscoverDot() { return (s._wxLiked && Object.keys(s._wxLiked).some(k => k.endsWith(":" + s.week))) ? 0 : (wxContacts().length ? 1 : 0); }
  // —— 微信首页：搜索条 + 会话列表（头像/名字/末条/时间/未读）——
  function wxChatsPage() {
    const cs = wxContacts();
    const search = `<div class="wxw-search">🔍 搜索</div>`;
    if (!cs.length) return search + `<div class="ph-empty">还没有绿泡泡好友。多出去走动、认识些人吧。</div>`;
    const rows = cs.map(c => {
      const ur = wxUnread(c);
      return `<div class="wxw-chat${c.fam ? " fam" : ""}" data-wxopen="${c.pid}">
        <span class="wxw-av${c.group ? " grp" : ""}">${wxAvatarOf(c)}${ur ? `<i class="wxw-badge">${ur}</i>` : ""}</span>
        <span class="wxw-cmid"><span class="wxw-crow"><b>${c.name}</b><small>${wxTime(c)}</small></span><span class="wxw-cprev">${wxLastLine(c)}</span></span>
      </div>`;
    }).join("");
    return search + `<div class="wxw-list">${rows}</div>`;
  }
  // —— 通讯录：功能入口 + 联系人列表 ——
  function wxContactsPage() {
    const cs = wxContacts();
    const ents = [["🆕", "新的朋友", "screen", "social"], ["👨‍👩‍👧", "群聊", "", ""], ["🏷️", "标签", "", ""], ["📣", "公众号", "app", "news"]];
    const head = `<div class="wxw-search">🔍 搜索</div>` + ents.map(([ic, nm, kind, to]) => `<div class="wxw-ce" ${kind ? `data-${kind === "screen" ? "screen" : "app"}="${to}"` : ""}><span class="wxw-ce-ic">${ic}</span><span>${nm}</span><span class="wxw-ce-go">›</span></div>`).join("");
    const fam = cs.filter(c => c.fam), star = cs.filter(c => c.star && !c.fam), norm = cs.filter(c => !c.star);
    const sec = (title, arr) => arr.length ? `<div class="wxw-sec">${title}</div>` + arr.map(c => `<div class="wxw-ce contact" data-wxopen="${c.pid}"><span class="wxw-ce-av">${wxAvatarOf(c)}</span><span class="wxw-ce-nm">${c.name}<small>${c.role}</small></span></div>`).join("") : "";
    return head + sec("💗 家人", fam) + sec("★ 关键角色", star) + sec("联系人", norm) + `<div class="wxw-count">${cs.length} 位联系人</div>`;
  }
  // —— 发现：朋友圈 + 各功能入口（部分可跳转，部分仅展示）——
  function wxDiscover() {
    const moHint = s._wxMyMoment ? `<small class="wxw-de-sub">你刚发了条朋友圈</small>` : "";
    const groups = [
      [["📸", "朋友圈", "wxsub", "moments", moHint]],
      [["📷", "扫一扫", "", ""], ["👀", "看一看", "app", "news"]],
      [["🎬", "视频号", "app", "reels"], ["🛒", "购物", "screen", "shop"], ["🎮", "游戏", "screen", "mgmenu"]],
      [["📲", "小程序", "", ""]]
    ];
    return groups.map(g => `<div class="wxw-dgroup">${g.map(([ic, nm, kind, to, sub]) => `<div class="wxw-de" ${kind === "wxsub" ? `data-wxsub="${to}"` : kind ? `data-${kind === "screen" ? "screen" : "app"}="${to}"` : ""}><span class="wxw-de-ic">${ic}</span><span class="wxw-de-nm">${nm}</span>${sub || ""}<span class="wxw-ce-go">›</span></div>`).join("")}</div>`).join("");
  }
  // 朋友圈动态文案
  function wxMomentText(c) {
    const pool = c.fav >= 70 ? ["今天和老友吃饭，聊到深夜，真好。", "生活再难，身边有这些人就值了。", "又是元气满满的一天💪", "周末爬了个山，风景绝了。", "终于把拖了半年的事做完了，舒坦。"]
      : c.fav < 40 ? ["呵呵。", "有些人，认清了就好。", "不想说话。", "成年人的崩溃都是静音的。"]
        : ["周末愉快～", "打工人打工魂😪", "今天天气不错。", "新的一周，加油。", "求推荐好吃的店！", "通勤路上拍到的晚霞📷", "又是被甲方折磨的一天。", "下班吃顿好的犒劳自己。"];
    return pool[wxSeed(c.name + c.role) % pool.length];
  }
  // 朋友圈配图：渐变色块当"照片"，按种子决定数量(0/1/3/4)
  const MO_PIC = [["🌅", "linear-gradient(135deg,#ff9a6b,#ff5e8a)"], ["🏞️", "linear-gradient(135deg,#43c6ac,#191654)"], ["🍜", "linear-gradient(135deg,#f7971e,#ffd200)"], ["🐱", "linear-gradient(135deg,#a18cd1,#fbc2eb)"], ["🎂", "linear-gradient(135deg,#ff6a88,#ff99ac)"], ["☕", "linear-gradient(135deg,#c79081,#dfa579)"], ["🌃", "linear-gradient(135deg,#232526,#414345)"], ["🏖️", "linear-gradient(135deg,#2af598,#009efd)"], ["💼", "linear-gradient(135deg,#485563,#29323c)"], ["🍰", "linear-gradient(135deg,#ffecd2,#fcb69f)"]];
  function wxMoPics(seed) {
    const cnt = [0, 1, 0, 3, 1, 4, 0, 3, 1][seed % 9];
    if (!cnt) return "";
    let html = "";
    for (let i = 0; i < cnt; i++) { const pi = MO_PIC[(seed + i * 7) % MO_PIC.length]; html += `<div class="mo-pic" style="background:${pi[1]}">${pi[0]}</div>`; }
    return `<div class="mo-pics n${cnt}">${html}</div>`;
  }
  function wxCoverCss() { const w = (typeof WALLPAPERS !== "undefined" ? WALLPAPERS : []).find(x => x.id === (s._wxCover || "dusk")); return w ? w.css : "linear-gradient(160deg,#2a1840,#7a2e5d 55%,#c25e3a)"; }
  // —— 朋友圈整页（封面 + 动态流 + 配图，微信风）——
  function wxMomentsPage() {
    const cs = wxContacts().filter(c => !c.fam).slice(0, 9);
    const posted = s._wxPosted === s.week;
    const cover = `<div class="mo-cover" style="background:${wxCoverCss()}">
      <button class="mo-cover-btn" id="wxCover">📷 换封面</button>
      <div class="mo-cover-me"><span class="mo-cover-name">${s.playerName || "我"}</span><span class="mo-cover-av">🙂</span></div></div>`;
    const pub = `<div class="mo-pub"><span class="mo-pub-h">发条朋友圈</span><div class="mo-pub-btns">
      <button class="mo-pubbtn" data-wxpost="flex" ${posted ? "disabled" : ""}>✨ 晒一晒</button>
      <button class="mo-pubbtn" data-wxpost="soul" ${posted ? "disabled" : ""}>🌱 发鸡汤</button>
      <button class="mo-pubbtn" data-wxpost="emo" ${posted ? "disabled" : ""}>🌧️ 吐个槽</button></div>${posted ? '<small class="mo-pub-tip">今天已经发过了。</small>' : ""}</div>`;
    const msg = s._phoneMsg ? `<div class="wl-msg">${s._phoneMsg}</div>` : "";
    const mine = s._wxMyMoment ? `<div class="mo-post mine"><span class="mo-av">🙂</span><div class="mo-body"><b class="mo-name">${s.playerName || "我"}</b><div class="mo-txt">${s._wxMyMoment}</div>${wxMoPics(wxSeed("me" + s.week))}<div class="mo-foot"><span class="mo-time">刚刚</span></div></div></div>` : "";
    const posts = cs.length ? cs.map(c => {
      const sd = wxSeed(c.name + c.role);
      const liked = s._wxLiked && s._wxLiked[c.pid + ":" + s.week];
      const likes = (sd % 28) + 2 + (liked ? 1 : 0);
      return `<div class="mo-post"><span class="mo-av">${wxFace(c.fav, c.star)}</span><div class="mo-body"><b class="mo-name">${c.name}</b><div class="mo-txt">${wxMomentText(c)}</div>${wxMoPics(sd)}
        <div class="mo-foot"><span class="mo-time">${wxTime(c)}</span><button class="mo-like ${liked ? "on" : ""}" data-wxlike="${c.pid}">${liked ? "❤️" : "🤍"} ${likes}</button></div></div></div>`;
    }).join("") : `<div class="ph-empty">朋友圈静悄悄的。</div>`;
    return `<div class="wxw-subtop"><button class="wxw-back" id="wxSubBack">‹ 发现</button><span class="wxw-title">朋友圈</span><span style="width:40px"></span></div>
      <div class="wx-moments">${cover}${pub}${msg}${mine ? `<div class="wxw-sec">我的</div>${mine}<div class="wxw-sec">好友动态</div>` : ""}${posts}</div>`;
  }
  function wxMe() {
    const nw = Math.round(netWorth(s));
    const rows = [["💰", "服务 · 泡泡钱包", "¥" + Math.round(s.cash || 0).toLocaleString(), "app", "wallet"], ["⭐", "收藏", "", "", ""], ["📸", "朋友圈", "", "wxsub", "moments"], ["🎴", "卡包", "", "", ""], ["😀", "表情", "", "", ""], ["⚙️", "设置", "", "app", "settings"]];
    return `<div class="wxw-me-card">
        <span class="wxw-me-av">🙂</span>
        <div class="wxw-me-id"><b>${s.playerName || "无名之人"}</b><small>泡泡号：bubble_${s.age}${(s.playerName || "me").length}</small><small>📍 ${s.city ? C._util.cityFull(s.city) : "地球某处"}</small></div>
        <span class="wxw-me-qr">▦</span>
      </div>
      <div class="wxw-me-net">身价 ¥${nw.toLocaleString()} · ${s.age}岁 · ${C.CLASS_NAMES[classTier(s)]}</div>
      <div class="wxw-me-list">${rows.map(([ic, nm, val, kind, to]) => `<div class="wxw-ce" ${kind === "wxsub" ? `data-wxsub="${to}"` : kind ? `data-${kind === "screen" ? "screen" : "app"}="${to}"` : ""}><span class="wxw-ce-ic">${ic}</span><span>${nm}</span>${val ? `<span class="wxw-me-val">${val}</span>` : ""}<span class="wxw-ce-go">›</span></div>`).join("")}</div>`;
  }
  // —— 聊天详情：顶栏 + 气泡（头像+尾巴）+ 备注(可展开) + 输入栏 + ＋面板 ——
  // 一条「对方」气泡（群里带发言人名字与头像）
  // 红包/转账卡片
  function wxRedCard(m, claimKey) {
    const isHb = m.type === "hb"; const claimable = !m.me && !m.claimed;
    const amt = (typeof m.amount === "number" && m.amount % 1) ? m.amount.toFixed(2) : m.amount;
    const statusSub = m.claimed ? (isHb ? "已领取" : "已收款") : (m.note || (isHb ? "微信红包" : "微信转账"));
    const foot = isHb ? "微信红包" : "微信转账";
    const hint = claimable ? ` · 点击${isHb ? "领取" : "收款"}` : (m.me && !m.claimed ? " · 待对方收款" : "");
    return `<div class="wx-rc ${isHb ? "hb" : "tf"}${m.claimed ? " got" : ""}" ${claimable ? `data-wxclaim="${claimKey}"` : ""}>
      <div class="rc-row"><span class="rc-ic">${isHb ? "🧧" : "💸"}</span><div class="rc-mid"><b>¥${amt}</b><small>${statusSub}</small></div></div>
      <div class="rc-foot">${foot}${hint}</div></div>`;
  }
  // 统一渲染一条消息（文字气泡 / 红包卡 / 转账卡），群里带发言人名字与头像
  function wxRenderMsg(m, themAv, claimKey) {
    const av = m.who ? famMemberAv(m.who) : themAv;
    if (m.type === "hb" || m.type === "transfer") {
      const card = wxRedCard(m, claimKey || "");
      return m.me ? `<div class="wxb me rc-wrap"><div class="wxb-rc">${card}</div><span class="wxb-av">🙂</span></div>`
        : `<div class="wxb them rc-wrap"><span class="wxb-av">${av}</span>${m.who ? `<div class="wxb-col"><span class="wxb-who">${m.who}</span><div class="wxb-rc">${card}</div></div>` : `<div class="wxb-rc">${card}</div>`}</div>`;
    }
    return m.me ? `<div class="wxb me"><div class="wxb-txt">${m.text}</div><span class="wxb-av">🙂</span></div>`
      : `<div class="wxb them"><span class="wxb-av">${av}</span>${m.who ? `<div class="wxb-col"><span class="wxb-who">${m.who}</span><div class="wxb-txt">${m.text}</div></div>` : `<div class="wxb-txt">${m.text}</div>`}</div>`;
  }
  // 一段会话的所有气泡（手机/电脑共用）
  function wxBuildBubbles(p, fav, meta) {
    const av = p.fam ? p.av : wxFace(fav, p.isCast);
    if (p.fam && p.group) { const log = famGroupLog(p.famKey); return log.map((m, i) => wxRenderMsg(m, "🧑", p.id + "|" + i)).join(""); }
    if (p.fam) { const log = famParentSeed(p.id, p.famKey); return log.map((m, i) => wxRenderMsg(m, av, p.id + "|" + i)).join(""); }
    const log = (s._wxlog && s._wxlog[p.id]) || [];
    return wxRenderMsg({ me: false, text: wxSocialOpen(p, fav, (meta || {}).crisis) }, av, "") + log.map((m, i) => wxRenderMsg(m, av, p.id + "|" + i)).join("");
  }
  function wxChatView() {
    const p = wxPeer(phoneWx.peer);
    if (!p) { phoneWx.peer = null; return wxChatsPage(); }
    const meta = wxContacts().find(c => c.pid === p.id) || {};
    const fav = wxFavVal(p);
    const bubbles = wxBuildBubbles(p, fav, meta);
    // 群聊不出现金钱面板，只能发言；爸妈/好友有快捷回复
    const plusGrid = (phoneWx.plus && !p.group) ? `<div class="wxc-panel">${WX_REPLIES.map(r => {
      const dis = r.cost && s.cash < r.cost;
      const parts = r.label.split(" "); const ic = parts[0]; const nm = parts.slice(1).join(" ") || r.label;
      return `<button class="wxc-pa" data-wxrep="${r.id}" ${dis ? "disabled" : ""}><span class="wxc-pa-ic">${ic}</span><small>${nm}</small></button>`;
    }).join("")}</div>` : "";
    return `<div class="wxc">
      <div class="wxc-top"><button class="wxw-back" id="wxBack">‹</button><b class="wxc-name" id="wxInfo">${p.name}</b><button class="wxc-more" id="wxInfo2">⋯</button></div>
      ${phoneWx.info ? wxNoteCard(p) : ""}
      ${meta.crisis ? `<div class="wx-crisis">⚠️ ${p.name} 正遇上难处，点开 ＋ 里的「关心近况」当面回应。</div>` : ""}
      <div class="wxc-thread">${bubbles}</div>
      <div class="wxc-input">
        <button class="wxc-ibtn">🎙️</button>
        <input id="wxInput" class="wxc-field" placeholder="${p.group ? "在群里说点什么…" : "说点什么…"}" autocomplete="off">
        <button class="wxc-ibtn">😊</button>
        ${p.group ? "" : `<button class="wxc-ibtn" id="wxPlus">＋</button>`}
        <button class="wxc-send" id="wxSend">发送</button>
      </div>
      ${plusGrid}</div>`;
  }
  function appWechat() {
    if (phoneWx.peer) return wxChatView();
    if (phoneWx.sub === "moments") return wxMomentsPage();
    const tab = phoneWx.tab || "chats";
    const unread = wxContacts().reduce((a, c) => a + wxUnread(c), 0);
    const body = tab === "contacts" ? wxContactsPage() : tab === "discover" ? wxDiscover() : tab === "me" ? wxMe() : wxChatsPage();
    const msg = (s._phoneMsg && tab !== "discover") ? `<div class="wl-msg">${s._phoneMsg}</div>` : "";
    return `<div class="wxw">${wxTopBar(tab, unread)}<div class="wxw-body">${msg}${body}</div>${wxBottomNav(tab, unread)}</div>`;
  }
  // 自由打字闲聊（纯沉浸，不改数值）：发一句 → 对方按关系热度随口回一句
  function wxSendText(txt) {
    txt = (txt || "").trim(); if (!txt) return;
    const p = wxPeer(phoneWx.peer); if (!p) return;
    const fav = wxFavVal(p);
    s._wxlog = s._wxlog || {}; const log = s._wxlog[p.id] = s._wxlog[p.id] || [];
    log.push({ me: true, text: txt.slice(0, 60) });
    let reply, who = null;
    if (p.fam && p.group) {                        // 群里：随机一位家人接话
      const arr = FAM_DATA[famArch()][p.famKey] || [];
      const pickMember = arr[wxSeed(txt) % arr.length] || { w: "家人", t: "嗯嗯。" };
      who = pickMember.w; reply = pick(["收到～", "好嘞👌", "知道啦。", "哈哈哈", "@" + (s.playerName || "你") + " 说得对！", "回来吃饭啊。"]);
    } else if (p.fam) {                             // 爸妈：暖心回一句 + 关系微涨
      reply = pick(FAM_DATA[famArch()][p.famKey].reply); famAdjust(p.famKey, 1); add(s, "mood", 1);
    } else {
      reply = fav >= 70 ? pick(["哈哈哈是的！", "我也这么觉得～", "懂你懂你😄", "下次一起啊！"])
        : fav >= 45 ? pick(["嗯嗯。", "哦哦，知道了。", "好的～", "在忙，回头聊。"])
          : pick(["……", "嗯。", "哦。", "有事说事。"]);
    }
    log.push({ me: false, text: reply, who: who });
    if (log.length > 40) s._wxlog[p.id] = log.slice(-40);
    render();
  }
  // 微信交互：回复 / 借钱 / 点赞 / 发朋友圈（都真改状态）
  function wxTriggerCrisis(crisis) {
    const id = crisis === "startup_invite" ? "ev_cast_invite" : crisis === "reunite" ? "ev_cast_reunite" : "ev_cast_help";
    const e = C.events.find(x => x.id === id);
    if (e) { try { if (!e.cond || e.cond(s)) { enterEvent(e); screen = "event"; render(); return; } } catch (x) { } }
    render();
  }
  function wxBorrow(p) {
    const f = wxFavVal(p); s._wxlog = s._wxlog || {}; const log = s._wxlog[p.id] = s._wxlog[p.id] || [];
    log.push({ me: true, text: "在吗？最近手头有点紧，能不能周转一下…" });
    if (p.fam) {                                   // 跟爸妈开口：基本都给，但心里有数
      const amt = Math.max(1000, Math.min(5000, Math.round((1500 + f * 30) / 100) * 100));
      add(s, "cash", amt); famAdjust(p.famKey, -1);
      log.push({ me: false, text: pick([`[红包] 先给你打 ¥${amt.toLocaleString()}，别省着。`, `钱给你转了 ¥${amt.toLocaleString()}，不够再说。`, `[红包] 拿去用，缺钱跟家里讲，别在外头硬扛。`]) });
      s._phoneMsg = `🧧 ${FAM_NAME[p.famKey] || "家里"}给你转了 ¥${amt.toLocaleString()}——可这是爸妈的钱，省着点。`;
      s.timeline.push({ age: s.age, text: `跟${FAM_NAME[p.famKey] || "家里"}要了 ¥${amt.toLocaleString()}。` });
      if (log.length > 40) s._wxlog[p.id] = log.slice(-40);
      return;
    }
    if (f >= 58) {
      const amt = 2000 + Math.round(f * 80); add(s, "cash", amt); wxFav(p, -3); add(s, "network", 1);
      log.push({ me: false, text: `没问题，给你转 ¥${amt.toLocaleString()} 了，先应急。` });
      s._phoneMsg = `💸 ${p.name} 二话不说借了你 ¥${amt.toLocaleString()}——人情债也是债，记得还。（对方好感 -3）`;
      s.timeline.push({ age: s.age, text: `用绿泡泡向 ${p.name} 借到 ¥${amt.toLocaleString()}。` });
    } else {
      wxFav(p, -4);
      log.push({ me: false, text: pick(["不好意思啊，我最近也紧……", "哎我这阵子也周转不开诶。", "下次吧下次，见谅。"]) });
      s._phoneMsg = `😅 ${p.name} 委婉地拒绝了。开口借钱最伤交情——好感 -4。`;
    }
    if (log.length > 12) s._wxlog[p.id] = log.slice(-12);
  }
  function wxReply(id) {
    const p = wxPeer(phoneWx.peer); if (!p) return;
    const r = WX_REPLIES.find(x => x.id === id); if (!r) return;
    if (p.isCast && p.obj.crisis && id === "care") { wxTriggerCrisis(p.obj.crisis); return; }   // 危机当面回应 → 触发事件
    if (id === "borrow") { wxBorrow(p); render(); return; }
    if (r.cost && s.cash < r.cost) { s._phoneMsg = "💸 余额不足，发不出。"; render(); return; }
    if (r.cost) add(s, "cash", -r.cost);
    wxFav(p, r.fav || 0); if (r.mood) add(s, "mood", r.mood);
    if (id === "hb" && p.isCast) p.obj.pressure = Math.max(0, (p.obj.pressure || 30) - 6);
    s._wxlog = s._wxlog || {}; const log = s._wxlog[p.id] = s._wxlog[p.id] || [];
    if (r.hb) {                                   // 发红包：对方秒抢
      log.push({ me: true, type: "hb", amount: r.hb, note: "一点心意，收下", claimed: true });
      log.push({ me: false, text: p.fam ? "你这孩子，还给我发红包，乖。" : "哎哟太客气了，谢谢谢谢！" });
    } else if (r.tf) {                            // 转账：对方收款
      log.push({ me: true, type: "transfer", amount: r.tf, note: "转账给你", claimed: true });
      log.push({ me: false, text: p.fam ? "你自己留着花，别老想着我们。" : "收到啦，谢谢～" });
    } else {
      log.push({ me: true, text: r.my });
      const replyText = p.fam ? pick(FAM_DATA[famArch()][p.famKey].reply) : (typeof r.reply === "function" ? r.reply(p) : r.reply);
      log.push({ me: false, text: replyText });
    }
    if (log.length > 40) s._wxlog[p.id] = log.slice(-40);
    if (r.cost) s.timeline.push({ age: s.age, text: `用绿泡泡给 ${p.name} ${r.hb ? "发了红包" : r.tf ? "转了账" : "花了钱"}（¥${r.cost}）。` });
    render();
  }
  // 领红包 / 收转账：真到账（key = "pid|idx"）
  function wxClaim(key) {
    const sep = key.lastIndexOf("|"); if (sep < 0) return;
    const pid = key.slice(0, sep), idx = parseInt(key.slice(sep + 1), 10);
    const log = s._wxlog && s._wxlog[pid]; if (!log || !log[idx]) return;
    const m = log[idx]; if (m.me || m.claimed) return;
    m.claimed = true;
    const amt = Number(m.amount) || 0; add(s, "cash", amt);
    const isHb = m.type === "hb";
    s._phoneMsg = `${isHb ? "🧧 领到红包" : "💰 收款"} ¥${amt}，已存入零钱。`;
    s.timeline.push({ age: s.age, text: `在绿泡泡${isHb ? "抢到红包" : "收到转账"} ¥${amt}。` });
    render();
  }
  function wxLike(pid) {
    s._wxLiked = s._wxLiked || {}; const key = pid + ":" + s.week; if (s._wxLiked[key]) return;
    s._wxLiked[key] = true; const p = wxPeer(pid); if (p) wxFav(p, 1);
    // 局部更新点赞按钮，不整页重渲染 → 朋友圈不再跳回顶部
    const btn = document.querySelector(`[data-wxlike="${pid}"]`);
    if (btn) { const n = parseInt((btn.textContent.match(/\d+/) || [0])[0], 10) + 1; btn.classList.add("on"); btn.innerHTML = "❤️ " + n; }
    else render();
  }
  function wxPost(kind) {
    if (s._wxPosted === s.week) return;
    s._wxPosted = s.week;
    if (kind === "flex") { s._wxMyMoment = pick(["刚换了新车，提车现场📸", "年度目标又近了一步，继续冲！", "晒晒最近的小成绩，感谢一路有你们。"]); add(s, "reputation", 2); add(s, "mood", 3); if (C._util.socialShift) C._util.socialShift(s, 1); s._phoneMsg = "✨ 你晒了条朋友圈。点赞如潮——多数人捧场，也有人默默把你屏蔽了。声誉+2，心情+3。"; }
    else if (kind === "soul") { s._wxMyMoment = pick(["越努力越幸运，共勉🌱", "平凡的日子也要好好过。", "愿你我都被生活温柔以待。"]); add(s, "mood", 2); s._phoneMsg = "🌱 一碗温吞的鸡汤，发完自己心里也暖了点。心情+2。"; }
    else { s._wxMyMoment = pick(["累了，真的累了。", "成年人的世界没有容易二字。", "算了，不说了。"]); add(s, "mood", -1); if (C._util.socialShift) C._util.socialShift(s, -1); s._phoneMsg = "🌧️ 你发了条 emo 动态。情绪是真了，但有人觉得你负能量。心情-1。"; }
    render();
  }
  /* ============================ 💼 老大直聘（仿 BOSS 直聘的招聘 app）============================ */
  const BOSS_COMPANIES = ["蓉城网络", "天府数科", "锦江智能", "西岭云创", "蜀汉传媒", "巴适生活", "青羊智造", "高新未来", "九眼桥科技", "麓湖资本", "环球商贸", "星海互娱", "锦官供应链", "川流教育", "都江堰医疗"];
  const BOSS_SURNAME = ["王", "李", "张", "陈", "刘", "杨", "周", "黄", "吴", "赵"];
  function bossInfo(job) {
    const sd = wxSeed(job.id + "boss");
    const co = BOSS_COMPANIES[sd % BOSS_COMPANIES.length];
    const sn = BOSS_SURNAME[(sd >> 3) % BOSS_SURNAME.length];
    const hr = (sd % 2) ? `${sn}经理` : `HR · ${sn}${(sd % 2) ? "总" : "姐"}`;
    return { co, hr, av: (sd % 3 === 0) ? "👔" : (sd % 3 === 1) ? "🧑‍💼" : "👩‍💼" };
  }
  function bossPay(job) { const lo = Math.round(job.pay * 0.85 / 100) * 100; const hi = Math.round(job.pay * 1.25 / 100) * 100; const k = v => v >= 10000 ? (v / 1000) + "K" : v; return `${k(lo)}-${k(hi)}`; }
  function bossReqTags(job) {
    const tags = [job.industry, "tier" + (job.tier || 0) >= 0 ? ["不限经验", "1-3年", "3-5年", "5年+", "资深", "专家"][Math.min(5, job.tier || 0)] : ""];
    for (const k in (job.req || {})) tags.push(`${STAT_CN[k] || k}≥${job.req[k]}`);
    return tags.filter(Boolean).slice(0, 4);
  }
  function bossFitP(job) {
    let p = job.base || 0.4;
    for (const k in (job.req || {})) if (k !== "network") p *= Math.min(1.3, (s.stats[k] || 0) / job.req[k]);
    return Math.max(0.08, Math.min(0.92, p));
  }
  function bossFitLabel(job) { const p = bossFitP(job); return p >= 0.6 ? '<span class="boss-fit hi">匹配度高</span>' : p >= 0.35 ? '<span class="boss-fit mid">匹配度中</span>' : '<span class="boss-fit lo">有点难</span>'; }
  // 岗位池：MVP 模式职位在 NEW_GRAD_JOBS，合并完整 JOBS（去重）
  function bossPool() {
    const ng = (typeof window !== "undefined" && window.NEW_GRAD_JOBS) || [];
    const full = (C._util.JOBS || []);
    const map = {}; ng.concat(full).forEach(j => { if (j && j.id && !map[j.id]) map[j.id] = j; });
    return Object.keys(map).map(k => map[k]);
  }
  function bossJobById(id) { return bossPool().find(j => j.id === id); }
  function bossJobs() {
    const all = bossPool().filter(j => !j.locked || has(s, j.locked));
    const reach = C._util.jobReachable ? all.filter(j => { try { return C._util.jobReachable(s, j); } catch (e) { return true; } }) : all;
    const list = (reach.length >= 4 ? reach : all);
    return list.slice().sort((a, b) => (a.tier || 0) - (b.tier || 0));
  }
  function appBoss() {
    if (phoneBoss.job) return bossChat(phoneBoss.job);
    const jobs = bossJobs();
    const msg = s._phoneMsg ? `<div class="wl-msg">${s._phoneMsg}</div>` : "";
    const cards = jobs.map(j => {
      const bi = bossInfo(j); const st = (s._boss && s._boss[j.id]) || {};
      const badge = st.stage === "hired" ? '<span class="boss-st hired">已入职</span>' : st.stage === "meeting" ? '<span class="boss-st meet">待面试</span>' : st.stage === "wxadded" ? '<span class="boss-st">已加好友</span>' : st.stage === "applied" || st.stage === "rejected" ? '<span class="boss-st">已沟通</span>' : "";
      return `<div class="boss-card" data-bossjob="${j.id}">
        <div class="boss-r1"><b>${j.name}</b><span class="boss-pay">${bossPay(j)}</span></div>
        <div class="boss-tags">${bossReqTags(j).map(t => `<span class="boss-tag">${t}</span>`).join("")} ${bossFitLabel(j)}</div>
        <div class="boss-r2"><span class="boss-co">🏢 ${bi.co}</span><span class="boss-hr">${bi.av} ${bi.hr} · 在线</span>${badge}</div>
        <button class="boss-go" data-bossjob="${j.id}">💬 立即沟通</button>
      </div>`;
    }).join("");
    return phoneHeader("💼 老大直聘", "找工作，跟老板谈") + msg
      + `<div class="boss-jm">📊 今年就业景气 ${Math.round((s.world && s.world.jobMarket) || 50)}/100 · ${s.city ? (C._util.cityFull ? C._util.cityFull(s.city) : s.city.name) : "本地"}在招</div>`
      + `<div class="boss-list">${cards || '<div class="ph-empty">暂时没有合适的岗位。</div>'}</div>`;
  }
  function bossEnsure(jid) { s._boss = s._boss || {}; s._boss[jid] = s._boss[jid] || { stage: "new", log: [] }; return s._boss[jid]; }
  function bossChat(jid) {
    const job = bossJobById(jid);
    if (!job) { phoneBoss.job = null; return appBoss(); }
    const bi = bossInfo(job); const st = bossEnsure(jid);
    const fp = bossFitP(job);
    const greet = fp >= 0.5 ? `你好！看你背景挺对口，我们在招「${job.name}」，${bossPay(job)}，方便的话投份简历，咱详聊。`
      : fp >= 0.3 ? `你好，看到你在找工作。「${job.name}」还在招，${bossPay(job)}，你条件够得着，合适就投。`
        : `你好。我们「${job.name}」要求偏高一些（${bossPay(job)}），你先了解下，觉得有把握再投简历。`;
    let bubbles = `<div class="wxb them"><span class="wxb-av">${bi.av}</span><div class="wxb-col"><span class="wxb-who">${bi.hr} · ${bi.co}</span><div class="wxb-txt">${greet}</div></div></div>`;
    bubbles += (st.log || []).map(m => m.me
      ? `<div class="wxb me"><div class="wxb-txt">${m.text}</div><span class="wxb-av">🙂</span></div>`
      : `<div class="wxb them"><span class="wxb-av">${bi.av}</span><div class="wxb-txt">${m.text}</div></div>`).join("");
    let actions = "";
    if (st.stage === "hired") actions = `<div class="boss-act"><button class="boss-abtn done" disabled>🎉 已入职</button></div>`;
    else if (st.stage === "meeting") actions = `<div class="boss-act"><button class="boss-abtn primary" data-bossitv="${jid}">🎥 参加线上面试</button></div>`;
    else if (st.stage === "wxoffer") actions = `<div class="boss-act"><button class="boss-abtn primary" data-bossitv="${jid}">🟢 加好友 + 申请面试</button></div>`;
    else actions = `<div class="boss-act"><button class="boss-abtn primary" data-bossapply="${jid}">📨 投简历</button>${st.stage === "rejected" ? '<span class="boss-tip">被婉拒了，过阵子可以再投。</span>' : ""}</div>`;
    return `<div class="wxc boss-chat">
      <div class="wxc-top"><button class="wxw-back" id="bossBack">‹</button><b class="wxc-name">${bi.hr}</b><span style="width:34px"></span></div>
      <div class="boss-job-bar">${job.name} · <b>${bossPay(job)}</b> · 🏢 ${bi.co}</div>
      <div class="wxc-thread">${bubbles}</div>
      ${actions}</div>`;
  }
  // 投简历：HR 态度严格按「匹配度」走，不会前后不一致
  function bossApply(jid) {
    const job = bossJobById(jid); if (!job) return;
    const st = bossEnsure(jid);
    st.log.push({ me: true, text: `[简历] 投了《${job.name}》，请您过目。` });
    if (s.job && s.job.id === job.id) { st.log.push({ me: false, text: "你已经在我们这儿了呀，哈哈。" }); render(); return; }
    const p = bossFitP(job);
    if (p >= 0.5) {                                  // 匹配度高 → 积极，直接约面试
      st.stage = "meeting";
      st.log.push({ me: false, text: pick(["你的背景挺对口，硬条件够，约个线上面试吧——方便现在视频聊不？", "简历看着不错，咱直接走个线上面试流程，时间你定。", "条件挺合适，安排个视频面，准备一下。"]) });
    } else if (p >= 0.3) {                           // 匹配度中 → 谨慎，给机会 或 先加微信
      if (wxSeed(job.id + s.playerName) % 2 === 0) {
        st.stage = "meeting";
        st.log.push({ me: false, text: pick(["有几项还差点，不过我看好你这个人，给你个线上面试的机会，好好准备。", "条件不算特别突出，面一面看你临场，约个视频面？"]) });
      } else {
        st.stage = "wxoffer";
        st.log.push({ me: false, text: "条件有点够呛，不过聊得来。加个绿泡泡，有更合适的我第一个想到你。" });
        st.log.push({ me: false, text: "[名片] " + bossInfo(job).hr + " 想加你为好友。" });
      }
    } else {                                         // 匹配度低 → 一致地婉拒（不会先夸后拒）
      st.stage = "rejected";
      st.log.push({ me: false, text: pick(["说实话，你的硬条件离这个岗位差得有点多，建议再积累积累。", "匹配度不太够，这岗位要求挺高的，先这样吧。", "你的背景和我们要的方向有差距，这次不太合适，抱歉。"]) });
      st.log.push({ me: false, text: "门槛低一些的岗位可以先看看，别气馁。" });
    }
    if (st.log.length > 40) st.log = st.log.slice(-40);
    render();
  }
  // 线上面试题（自我介绍 / 专业题 / 薪资），视频面框架；选项按数值打分
  const BOSS_IV = [
    { q: "先做个简短的自我介绍吧。", opts: [{ label: "踏实摆经历，讲做过的事", stat: "knowledge", base: 4 }, { label: "自信开麦，主动秀亮点", stat: "charm", base: 2, hi: 8 }, { label: "讲个打动人的真实故事", stat: "insight", base: 5 }] },
    { q: "针对这个岗位，问你一道专业/情景题。", opts: [{ label: "凭真本事正面硬刚", stat: "knowledge", base: 3, hi: 10 }, { label: "坦诚不会，但当场拆解思路给方案", stat: "strategy", base: 6 }, { label: "扯点行业见解，四两拨千斤", stat: "charm", base: 1, hi: 7 }] },
    { q: "薪资和发展你怎么看？还有什么想问我们的？", opts: [{ label: "表诚意，薪资好商量，先求上车", stat: "charm", base: 5 }, { label: "自信要价，亮明你的价值", stat: "strategy", base: 2, hi: 8 }, { label: "反问团队与方向，显出思考深度", stat: "insight", base: 6 }] }
  ];
  function bossIvScore(opt) {
    let pts = opt.base || 0;
    const e = C._util.statEdge ? C._util.statEdge(s, opt.stat) : (((s.stats[opt.stat] || 35) - 35) / 110);
    if (opt.hi != null) pts += e > 0.12 ? opt.hi : (e < -0.05 ? -4 : Math.round(opt.hi / 2));
    else pts += Math.round(e * 14);
    return pts;
  }
  function bossIvNode(jid, n, score) {
    const job = bossJobById(jid); const bi = bossInfo(job); const R = BOSS_IV[n];
    return {
      text: () => `${n === 0 ? `你戴上耳机点开会议链接，摄像头亮起。另一头「${bi.co}」的 ${bi.hr} 出现在画面里：「能听到吧？网络还行就开始啦。」` : "「嗯，我们继续。」"}\n\n${R.q}`,
      choices: R.opts.map(opt => ({
        label: opt.label, next: (s) => {
          const g = bossIvScore(opt); const ns = score + g;
          const react = g >= 8 ? "对面眼睛一亮，飞快记了一笔。" : g >= 3 ? "屏幕那头微微点头，气氛还行。" : g <= -3 ? "那边卡了一两秒，低头翻了下你的简历。" : "面无表情，看不出深浅。";
          if (n + 1 < BOSS_IV.length) { const nx = bossIvNode(jid, n + 1, ns); return { text: () => `${react}\n\n${BOSS_IV[n + 1].q}`, choices: nx.choices }; }
          return bossIvResult(jid, ns, react);
        }
      }))
    };
  }
  function bossIvResult(jid, score, react) {
    const job = bossJobById(jid); const bi = bossInfo(job);
    const passP = Math.max(0.05, Math.min(0.95, bossFitP(job) * 0.6 + score / 100 + 0.12));
    const hired = Math.random() < passP;
    if (hired) {
      return {
        text: () => `${react}\n\n面试官互相看了一眼，${bi.hr} 笑着说：「欢迎加入，offer 我让 HR 发你邮箱。」`,
        choices: [{ label: "太好了，入职！", effect: (s) => { const st = bossEnsure(jid); st.stage = "hired"; st.log.push({ me: false, text: `面试通过，欢迎加入${bi.co}！🎉` }); let ok = false; try { if (C._util.hireJob && !(s.job && s.job.id === job.id)) { C._util.hireJob(s, job); ok = true; } } catch (e) { } add(s, "mood", 12); s.timeline.push({ age: s.age, text: `通过老大直聘的线上面试，入职「${bi.co}·${job.name}」。` }); return ok ? `🎉 你拿下了「${bi.co}·${job.name}」，正式入职！` : `🎉 「${job.name}」线上面试通过！（你已有工作，先记下这机会。）`; } }]
      };
    }
    return {
      text: () => `${react}\n\n短暂沉默后，${bi.hr}：「今天先聊到这，后续有结果会通知你。」`,
      choices: [{ label: "好的，谢谢。", effect: (s) => { const st = bossEnsure(jid); st.stage = "rejected"; st.log.push({ me: false, text: "综合考虑后，这次不太合适，感谢你的时间。" }); add(s, "mood", -2); return `「${job.name}」这场线上面试没过——临场没扛住，或硬条件确实还差点。再练练。`; } }]
    };
  }
  function bossInterview(jid) {
    const job = bossJobById(jid); if (!job) return;
    const st = bossEnsure(jid);
    if (st.stage === "wxoffer") {                         // 先加绿泡泡，再约面试
      s.social = s.social || [];
      if (!s.social.some(n => n._boss === jid)) { s.social.push({ name: bossInfo(job).hr, role: bossInfo(job).co + " · 招聘", attitude: 62, kind: "普通", _boss: jid, homeCity: s.city ? (C._util.cityFull ? C._util.cityFull(s.city) : s.city.name) : "" }); add(s, "network", 3); }
      st.log.push({ me: true, text: "好的，已加上啦，那面试就拜托您安排～" });
      st.log.push({ me: false, text: "👌 已通过好友，面试给你约上了，准备一下。" });
      st.stage = "meeting"; render(); return;
    }
    // meeting → 拉起「线上面试」事件（接上游戏的面试问答流程，视频面版本）
    pendingEvent = { id: "boss_iv", module: "work", title: "🎥 线上面试" };
    try { gotoNode(() => bossIvNode(jid, 0, 0)); screen = "event"; render(); } catch (e) { render(); }
  }
  /* ============================ ✉️ 短信（运营商 / 猎头 / 诈骗，仿真）============================ */
  function smsEnsure() {
    s._sms = s._sms || [];
    if (!s._smsSeeded) { s._sms.push({ id: "op0", from: "10001 电信", av: "📶", week: 0, body: "欢迎使用本机服务。如需退订营销短信请回复 TD。", kind: "op", read: true }); s._smsSeeded = true; }
    const slots = Math.floor(s.week / 4);   // 每月一个猎头时段
    for (let k = 1; k <= slots; k++) {
      const id = "hh" + k;
      if (s._sms.some(m => m.id === id)) continue;
      if (wxSeed("hh" + k) % 5 === 0) continue;   // 偶尔没人来撩，别太密
      const pool = bossPool(); if (!pool.length) continue;
      const job = pool[wxSeed("hh" + k + (s.playerName || "")) % pool.length];
      const bi = bossInfo(job);
      const name = bi.hr.replace("HR · ", "");
      s._sms.push({ id, from: "猎头·" + name, av: "🎯", week: k * 4, body: `您好，我是「${bi.co}」合作猎头。有个「${job.name}」(${bossPay(job)})的机会挺适合您，方便聊两句吗？也可上「老大直聘」直接沟通。`, kind: "headhunter", jobId: job.id, read: false });
    }
    const fk = Math.floor(s.week / 12);
    if (fk >= 1 && !s._sms.some(m => m.id === "fk" + fk)) s._sms.push({ id: "fk" + fk, from: "955XX", av: "🎣", week: fk * 12, body: "【中奖通知】恭喜您被抽中一等奖¥88888，点击 t.cn/xxx 填写银行卡领取……（疑似诈骗）", kind: "spam", read: false });
    if (s._sms.length > 30) s._sms = s._sms.slice(-30);
  }
  function smsUnread() { smsEnsure(); return (s._sms || []).filter(m => !m.read).length; }
  function smsTimeOf(week) { const d = s.week - week; return d <= 0 ? "刚刚" : d < 4 ? d + "周前" : Math.floor(d / 4) + "个月前"; }
  function appSms() {
    smsEnsure();
    if (phoneSms.open) {
      const m = (s._sms || []).find(x => x.id === phoneSms.open);
      if (!m) { phoneSms.open = null; return appSms(); }
      m.read = true;
      const action = m.kind === "headhunter" ? `<div class="ap-foot"><button class="btn primary" data-app="boss">去老大直聘看看 →</button></div>`
        : m.kind === "spam" ? `<div class="ap-foot"><button class="btn" disabled>⚠️ 疑似诈骗，链接已自动拦截</button></div>` : "";
      return `<div class="ap-head"><button class="ap-back" id="smsBack">‹ 短信</button><div class="ap-title">✉️ ${m.from}<small>${smsTimeOf(m.week)}</small></div></div>`
        + `<div class="sms-thread"><div class="sms-bubble">${m.body}</div></div>${action}`;
    }
    const rows = (s._sms || []).slice().reverse().map(m => `<button class="sms-row${m.read ? "" : " unread"}" data-smsopen="${m.id}">
        <span class="sms-av">${m.av}</span>
        <span class="sms-mid"><span class="sms-top"><b>${m.from}</b><small>${smsTimeOf(m.week)}</small></span><span class="sms-prev">${m.body}</span></span>
        ${m.read ? "" : '<i class="sms-dot"></i>'}
      </button>`).join("");
    return phoneHeader("✉️ 短信", `${(s._sms || []).length} 条 · ${smsUnread()} 未读`) + `<div class="sms-list">${rows || '<div class="ph-empty">还没有短信。</div>'}</div>`;
  }
  /* ============================ 📞 电话 / 🧭 浏览器 / 🎵 音乐（Dock）============================ */
  // 电话：最近通话（家人/关键角色/社交圈），可拨打
  function appCall() {
    const cs = wxContacts().filter(c => !c.group).slice(0, 9);
    const msg = s._phoneMsg ? `<div class="wl-msg">${s._phoneMsg}</div>` : "";
    const tlabel = c => ["昨天", "刚刚", "周一", "上午 10:24", "前天", "周三"][wxSeed(c.name) % 6];
    const rows = cs.map((c, i) => {
      const missed = !c.fam && i % 4 === 1;
      return `<div class="call-row" data-callto="${c.pid}"><span class="call-av">${c.av || wxFace(c.fav, c.star)}</span>
        <span class="call-mid"><b class="${missed ? "miss" : ""}">${c.name}</b><small>${missed ? "📵 未接来电" : "📱 手机"} · ${tlabel(c)}</small></span>
        <span class="call-go">📞</span></div>`;
    }).join("");
    return phoneHeader("📞 电话", "最近通话") + msg + `<div class="call-list">${rows || '<div class="ph-empty">还没有通话记录。</div>'}</div>`
      + `<p class="ap-note">给家人朋友打个电话，聊聊近况——比打字更暖，关系也更近一点。</p>`;
  }
  function phoneCallDo(pid) {
    const p = wxPeer(pid); if (!p) return;
    add(s, "mood", 1);
    if (p.fam) famAdjust(p.famKey, 1); else if (!p.group) wxFav(p, 1);
    s._phoneMsg = `📞 你和 ${p.name} 通了会儿电话，聊了几句近况，心里暖了点。`;
    s.timeline.push({ age: s.age, text: `给 ${p.name} 打了个电话。` });
    render();
  }
  // 浏览器：搜索条 + 书签（跳各 app）+ 今日热搜（复用新闻标题）
  function appBrowser() {
    const marks = [["💼", "招聘", "app", "boss"], ["🛒", "购物", "screen", "shop"], ["📈", "财经", "app", "market"], ["🎬", "视频", "app", "reels"], ["📰", "头条", "app", "news"], ["🎮", "游戏", "screen", "mgmenu"]];
    const grid = marks.map(([ic, nm, kind, to]) => `<button class="br-mark" ${kind === "screen" ? `data-screen="${to}"` : `data-app="${to}"`}><span class="br-ic">${ic}</span><span>${nm}</span></button>`).join("");
    if (!s.news || !s.news.length) s.news = buildFeed(s, true);
    const hot = (s.news || []).slice(0, 6).map((n, i) => `<button class="br-hot" data-app="news"><span class="br-rank ${i < 3 ? "top" : ""}">${i + 1}</span><span class="br-hot-t">${n.headline}</span></button>`).join("");
    return phoneHeader("🧭 浏览器", "上网冲浪")
      + `<div class="br-search">🔍 搜索或输入网址</div>`
      + `<div class="br-marks">${grid}</div>`
      + `<div class="stk-sec">🔥 今日热搜</div><div class="br-hots">${hot || '<div class="ph-empty">暂无热搜。</div>'}</div>`;
  }
  // 音乐：原创虚构歌单，点歌播放放松（每首仅标题，无歌词）
  const MUSIC_LISTS = [
    { pl: "打工人 BGM", songs: ["《加班到天明》", "《周一恐惧症》", "《摸鱼小确幸》", "《通勤进行曲》"] },
    { pl: "深夜 emo", songs: ["《一个人的城市》", "《晚风与你》", "《失眠交响曲》", "《凌晨三点》"] },
    { pl: "元气满满", songs: ["《冲鸭打工人》", "《阳光普照》", "《再来亿遍》", "《元气循环》"] }
  ];
  function appMusic() {
    const cur = s._musicNow;
    const lists = MUSIC_LISTS.map(g => `<div class="stk-sec">🎧 ${g.pl}</div>` + g.songs.map(sg => {
      const playing = cur === sg;
      return `<button class="mu-song${playing ? " on" : ""}" data-music="${sg}"><span class="mu-pi">${playing ? "⏸️" : "▶️"}</span><span class="mu-nm">${sg}</span></button>`;
    }).join("")).join("");
    const np = cur ? `<div class="mu-now"><div class="mu-disc">💿</div><div class="mu-now-t"><b>${cur}</b><small>正在播放 · 荒诞音乐</small></div></div>` : `<div class="mu-now off">🎵 选一首，放松一下</div>`;
    return phoneHeader("🎵 音乐", "随便听听") + np + `<div class="mu-list">${lists}</div>`;
  }
  function phoneMusicDo(song) {
    if (s._musicNow === song) { s._musicNow = null; render(); return; }
    s._musicNow = song; s._musicN = (s._musicN || 0) + 1;
    add(s, "mood", s._musicN <= 4 ? 2 : 1); add(s, "stress", -1);
    render();
  }
  // —— 通讯录：聚合家人/关键角色/社交圈，点联系人直接进绿泡泡聊天（仿真手机通讯录）——
  function appContacts() {
    const cs = wxContacts();
    const search = `<div class="wxw-search">🔍 搜索联系人</div>`;
    const ent = `<div class="wxw-ce" data-screen="social"><span class="wxw-ce-ic">🆕</span><span>新的朋友 / 社交圈</span><span class="wxw-ce-go">›</span></div>`;
    const fam = cs.filter(c => c.fam), star = cs.filter(c => c.star && !c.fam), norm = cs.filter(c => !c.star);
    const row = c => `<div class="wxw-ce contact" data-ctopen="${c.pid}"><span class="wxw-ce-av">${c.av || wxFace(c.fav, c.star)}</span><span class="wxw-ce-nm">${c.name}<small>${c.role}</small></span><span class="ct-v">${c.fam ? "💗" : Math.round(c.fav)}</span></div>`;
    const sec = (t, arr) => arr.length ? `<div class="wxw-sec">${t}</div>` + arr.map(row).join("") : "";
    return phoneHeader("📇 通讯录", `共 ${cs.length} 位`) + search + ent
      + sec("💗 家人", fam) + sec("★ 关键角色", star) + sec("联系人", norm)
      + `<div class="wxw-count">${cs.length} 位联系人 · 点击进绿泡泡聊天</div>`;
  }
  // —— 钱包：身价拆解 + 月账单 + 给联系人转账（真扣钱、真涨信任）——
  function appWallet() {
    const cash = Math.round(s.cash || 0), assets = Math.round(s.assets || 0);
    const pv = Math.round(C._util.stockValue ? C._util.stockValue(s) : 0);
    const nw = Math.round(netWorth(s));
    const mb = C._util.monthlyBill ? C._util.monthlyBill(s) : null;
    const runway = mb && mb.total > 0 ? Math.floor((cash + assets) / mb.total) : null;
    const give = (s.cast ? Object.keys(s.cast).map(k => s.cast[k]).filter(c => c && c.name) : []).slice(0, 4).map(c => {
      const can = s.cash >= 2000;
      return `<button class="wl-give ${can ? "" : "off"}" data-give="${c.id}" ${can ? "" : "disabled"}>🧧 给 ${c.name} 转 ¥2,000</button>`;
    }).join("");
    const msg = s._phoneMsg ? `<div class="wl-msg">${s._phoneMsg}</div>` : "";
    return phoneHeader("💰 钱包", `余额 ¥${cash.toLocaleString()}`)
      + `<div class="wl-card"><small>总身价</small><b>¥${nw.toLocaleString()}</b></div>
      <div class="wl-rows">
        <div class="wl-r"><span>💵 现金</span><b>¥${cash.toLocaleString()}</b></div>
        <div class="wl-r"><span>🏠 资产</span><b>¥${assets.toLocaleString()}</b></div>
        <div class="wl-r"><span>📈 持仓市值</span><b>¥${pv.toLocaleString()}</b></div>
        ${mb ? `<div class="wl-r"><span>🧾 每月账单</span><b style="color:var(--red)">¥${mb.total.toLocaleString()}</b></div>` : ""}
        ${runway != null ? `<div class="wl-r"><span>⏳ 坐吃山空可撑</span><b>${runway >= 99 ? "无忧" : runway + " 个月"}</b></div>` : ""}
      </div>
      ${msg}
      ${give ? `<div class="wl-sec">🧧 给重要的人转账（攒交情）</div><div class="wl-gives">${give}</div>` : ""}
      <div class="ap-foot"><button class="btn" data-screen="shop">🛒 去消费</button><button class="btn" data-app="market">📈 去理财</button></div>`;
  }
  // —— 自选股：持仓 + 大盘速览，一键去交易 ——
  // —— 淘粑（仿淘宝）：搜索条 + 分类 + 商品瀑布卡（复用消费品库，真能买）——
  const TB_GRADS = ["linear-gradient(135deg,#ffecd2,#fcb69f)", "linear-gradient(135deg,#a1c4fd,#c2e9fb)", "linear-gradient(135deg,#d4fc79,#96e6a1)", "linear-gradient(135deg,#fbc2eb,#a6c1ee)", "linear-gradient(135deg,#fdcbf1,#e6dee9)", "linear-gradient(135deg,#f6d365,#fda085)", "linear-gradient(135deg,#84fab0,#8fd3f4)", "linear-gradient(135deg,#fccb90,#d57eeb)"];
  function taobaPanelHTML() {
    const owned = id => has(s, "bought_" + id);
    const kinds = [...new Set(C.consumption.map(i => i.kind))];
    const cat = s._taobaCat && (cat0 => kinds.indexOf(cat0) >= 0 ? cat0 : "全部")(s._taobaCat) || "全部";
    const items = C.consumption.filter(i => cat === "全部" || i.kind === cat);
    const chips = ["全部", ...kinds].map(c => `<button class="tb-chip${cat === c ? " on" : ""}" data-taobacat="${c}">${c}</button>`).join("");
    const cards = items.map(it => {
      const can = s.cash >= it.price, got = owned(it.id);
      const salesN = (wxSeed(it.name) % 9000) + 200; const sales = salesN >= 10000 ? (salesN / 10000).toFixed(1) + "万" : salesN >= 1000 ? (salesN / 1000).toFixed(1) + "千" : salesN;
      const rate = (4 + (wxSeed(it.name + "r") % 10) / 10).toFixed(1);
      return `<div class="tb-card">
        <div class="tb-img" style="background:${TB_GRADS[wxSeed(it.name) % TB_GRADS.length]}">${it.emoji}</div>
        <div class="tb-info"><div class="tb-name">${it.name}</div>
          <div class="tb-meta">⭐${rate} · 月销 ${sales}</div>
          <div class="tb-bot"><span class="tb-price"><small>¥</small>${it.price.toLocaleString()}</span>
            <button class="btn buybtn tb-buy${got ? " got" : can ? "" : " poor"}" data-buy="${it.id}" ${got || !can ? "disabled" : ""}>${got ? "已买" : can ? "购买" : "钱不够"}</button></div></div>
      </div>`;
    }).join("");
    const msg = s._buyMsg ? `<div class="wl-msg">${s._buyMsg}</div>` : "";
    return `<div class="tb-search"><span class="tb-logo">淘粑</span><span class="tb-sbar">🔍 搜你想买的</span></div>`
      + `<div class="tb-chips">${chips}</div>${msg}<div class="tb-grid">${cards}</div>`;
  }
  function appTaoba() { return phoneHeader("🛍️ 淘粑", "啥都能淘到") + taobaPanelHTML(); }
  // —— 理财：完整交易（手机版）。大屏更顺手的版本在「电脑」里 ——
  function appMarket() {
    return phoneHeader("🐻 穷途熊熊", "炒股软件 · K线随人生生长 · 新闻→下周盘面")
      + marketPanelHTML(false);
  }
  // —— 日历：当下时点 + 目标 + 最近大事 ——
  function appCalendar() {
    const g = s.goal ? C._util.goalById(s.goal) : null;
    const wToBill = (4 - (s.week % 4)) % 4 || 4;
    const recent = (s.timeline || []).slice(-6).reverse().map(t => `<div class="cal-ev"><span class="cal-age">${t.age}岁</span><span>${t.text}</span></div>`).join("");
    return phoneHeader("📅 日历", `${s.year}年 · 第${s.week % 52 + 1}周`)
      + `<div class="cal-today"><div class="cal-big">${s.age}<small>岁</small></div><div class="cal-sub">${s.year}年${seasonName()}天 · 人生第 ${s.week + 1} 周</div></div>`
      + (g ? `<div class="cal-goal">🎯 人生目标：<b>${g.name}</b>${s._goalDone ? " ✅ 已达成" : ""}</div>` : "")
      + `<div class="cal-bill">🧾 距下次月度结算（发薪 / 扣账单）：还有 <b>${wToBill}</b> 周</div>`
      + `<div class="stk-sec">最近发生</div>${recent || '<div class="ph-empty">人生刚刚开始。</div>'}`;
  }
  // —— 相册：把人生片段做成"真照片"（原创矢量场景图，非网图）——
  const ALBUM_SCENES = [
    '<svg class="al-svg" viewBox="0 0 120 120"><defs><linearGradient id="alA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a6b"/><stop offset="1" stop-color="#ffd089"/></linearGradient></defs><rect width="120" height="120" fill="url(#alA)"/><circle cx="60" cy="74" r="20" fill="#fff6e0"/><path d="M0 90 L30 70 L55 88 L80 64 L120 92 V120 H0Z" fill="#7a4a3a"/></svg>',
    '<svg class="al-svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#10162b"/><circle cx="92" cy="26" r="11" fill="#f7f3d0"/><g fill="#1f2a4a"><rect x="10" y="60" width="18" height="60"/><rect x="34" y="44" width="20" height="76"/><rect x="60" y="70" width="16" height="50"/><rect x="82" y="52" width="22" height="68"/></g><g fill="#ffd86b"><rect x="14" y="66" width="4" height="4"/><rect x="38" y="50" width="4" height="4"/><rect x="44" y="62" width="4" height="4"/><rect x="88" y="58" width="4" height="4"/><rect x="96" y="72" width="4" height="4"/></g></svg>',
    '<svg class="al-svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#f3e1c7"/><ellipse cx="60" cy="74" rx="40" ry="30" fill="#e85d4e"/><ellipse cx="60" cy="70" rx="34" ry="24" fill="#f7c873"/><path d="M48 40 q4 -10 0 -18 M60 38 q4 -10 0 -18 M72 40 q4 -10 0 -18" stroke="#cfcfcf" stroke-width="2" fill="none" opacity="0.7"/></svg>',
    '<svg class="al-svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#d9c3a5"/><rect x="38" y="48" width="44" height="38" rx="6" fill="#fff"/><rect x="44" y="54" width="32" height="26" rx="3" fill="#5a3a22"/><path d="M82 56 q14 4 0 18" stroke="#fff" stroke-width="5" fill="none"/></svg>',
    '<svg class="al-svg" viewBox="0 0 120 120"><rect width="120" height="60" fill="#7ec8e3"/><circle cx="96" cy="22" r="10" fill="#fff3b0"/><rect y="60" width="120" height="34" fill="#2aa3c9"/><rect y="94" width="120" height="26" fill="#f3e0a8"/></svg>',
    '<svg class="al-svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#2c2c5a"/><rect x="34" y="40" width="52" height="10" fill="#111"/><path d="M30 40 L60 26 L90 40 L60 54Z" fill="#1a1a1a"/><rect x="56" y="40" width="8" height="22" fill="#f5d020"/><circle cx="60" cy="64" r="4" fill="#f5d020"/></svg>',
    '<svg class="al-svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#0e0e22"/><g stroke-width="2" fill="none"><g stroke="#ff5d8f"><path d="M60 56 V32 M60 56 L44 40 M60 56 L76 40 M60 56 L40 56 M60 56 L80 56"/></g><g stroke="#5bd1ff"><path d="M34 84 V66 M34 84 L24 72 M34 84 L44 72"/></g><g stroke="#ffd86b"><path d="M90 86 V70 M90 86 L80 76 M90 86 L100 76"/></g></g></svg>',
    '<svg class="al-svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e9eef3"/><rect x="20" y="86" width="80" height="8" fill="#b98a5a"/><rect x="40" y="50" width="40" height="28" rx="3" fill="#2b2b33"/><rect x="44" y="54" width="32" height="20" fill="#4fa3ff"/><rect x="54" y="78" width="12" height="10" fill="#888"/></svg>',
    '<svg class="al-svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#3a4a5a"/><g stroke="#9fbcd6" stroke-width="2"><path d="M20 20 L8 60 M40 16 L28 62 M64 22 L52 64 M88 18 L76 60 M108 22 L96 60"/></g><ellipse cx="40" cy="22" rx="22" ry="10" fill="#56697d"/><ellipse cx="84" cy="18" rx="20" ry="9" fill="#56697d"/></svg>',
    '<svg class="al-svg" viewBox="0 0 120 120"><rect width="120" height="78" fill="#9fd8f0"/><path d="M0 90 Q40 60 70 88 T120 84 V120 H0Z" fill="#6fc36f"/><rect x="78" y="58" width="6" height="30" fill="#7a4a2a"/><circle cx="81" cy="52" r="16" fill="#3f9f4f"/></svg>'
  ];
  function appAlbum() {
    let pics = (s.memories || []).filter(m => m && m.text).sort((a, b) => (b.intensity || 0) - (a.intensity || 0)).slice(0, 12).map(m => m.text);
    if (!pics.length) pics = (s.timeline || []).slice(-12).reverse().map(t => `${t.age}岁 · ${t.text}`);
    const grid = pics.length ? pics.map((p, i) => `<div class="al-pic">${ALBUM_SCENES[wxSeed(p) % ALBUM_SCENES.length]}<span class="al-cap">${p}</span></div>`).join("") : '<div class="ph-empty">相册还空着。去经历点什么吧。</div>';
    return phoneHeader("🖼️ 相册", `${pics.length} 张照片`) + `<div class="al-grid">${grid}</div>`;
  }
  // —— 抖声（仿抖音）：竖屏视频流，每个视频是原创动效画面 + 点赞/评论/分享侧栏 ——
  const DS_VIDEOS = [
    { emoji: "🐱", cap: "橘猫偷火腿现场，叼着就跑😂 #萌宠日常", author: "猫奴の日常", music: "原声 · 喵星人之歌", bg: "linear-gradient(180deg,#43c6ac,#191654)", anim: "ds-bounce" },
    { emoji: "🍜", cap: "凌晨三点的一碗面，治愈所有打工人 🍜", author: "深夜食堂", music: "原声 · 烟火气", bg: "linear-gradient(180deg,#f7971e,#3a1c12)", anim: "ds-pulse" },
    { emoji: "💃", cap: "全网都在跳的新舞，学到第三个动作我放弃了", author: "舞痴小美", music: "热歌 · 节奏循环", bg: "linear-gradient(180deg,#ff5d8f,#3a0d2a)", anim: "ds-shake" },
    { emoji: "🐶", cap: "狗子第一次见到雪，原地懵了五秒❄️", author: "二哈日记", music: "原声 · 冬天的故事", bg: "linear-gradient(180deg,#a1c4fd,#1a2540)", anim: "ds-float" },
    { emoji: "🏞️", cap: "辞职去看世界，第一站在这里发呆了一下午", author: "旅行的意义", music: "纯音乐 · 远方", bg: "linear-gradient(180deg,#2af598,#0a3a2a)", anim: "ds-zoom" },
    { emoji: "🎮", cap: "高手十连绝杀，弹幕刷满「？？？」", author: "电竞菜鸡", music: "燃曲 · 超神时刻", bg: "linear-gradient(180deg,#7367f0,#16093a)", anim: "ds-shake" },
    { emoji: "🍳", cap: "30秒教你把蛋炒饭做出米其林摆盘", author: "干饭研究所", music: "原声 · 滋滋作响", bg: "linear-gradient(180deg,#f6d365,#5a3a12)", anim: "ds-pulse" },
    { emoji: "🌃", cap: "下班路上随手一拍，城市的夜也挺温柔", author: "通勤碎片", music: "氛围 · 晚风", bg: "linear-gradient(180deg,#232526,#0a0a18)", anim: "ds-float" }
  ];
  function appReels() {
    const idx = (s._dsIdx || 0) % DS_VIDEOS.length;
    const v = DS_VIDEOS[idx];
    const liked = s._dsLiked && s._dsLiked[idx];
    const baseL = (wxSeed(v.cap) % 90000) + 8000; const likes = baseL + (liked ? 1 : 0);
    const fmt = n => n >= 10000 ? (n / 10000).toFixed(1) + "w" : n;
    const prog = ((s._dsN || 0) % 5 + 1) * 20;
    return phoneHeader("🎵 抖声", `第 ${idx + 1} / ${DS_VIDEOS.length} 个`)
      + `<div class="ds-feed" style="background:${v.bg}">
        <div class="ds-prog"><i style="width:${prog}%"></i></div>
        <div class="ds-anim ${v.anim}">${v.emoji}</div>
        <div class="ds-rail">
          <button class="ds-rb" data-dslike="${idx}"><span class="ds-ic${liked ? " on" : ""}">❤️</span><small>${fmt(likes)}</small></button>
          <button class="ds-rb"><span class="ds-ic">💬</span><small>${fmt((wxSeed(v.cap + "c") % 4000) + 200)}</small></button>
          <button class="ds-rb"><span class="ds-ic">↗</span><small>分享</small></button>
          <div class="ds-music">🎵</div>
        </div>
        <div class="ds-cap"><b>@${v.author}</b><div class="ds-cap-t">${v.cap}</div><div class="ds-bgm">🎵 ${v.music}</div></div>
      </div>`
      + `<div class="ap-foot"><button class="btn primary" id="dsNext">👆 上滑看下一个</button></div>`
      + `<p class="ap-note">刷视频确实能放松，可时间就这么没了——刷太多，快乐越来越淡，人也越来越累。</p>`;
  }
  function phoneDsNext() {
    s._dsIdx = ((s._dsIdx || 0) + 1) % DS_VIDEOS.length; s._dsN = (s._dsN || 0) + 1;
    const g = s._dsN <= 3 ? 2 : s._dsN <= 7 ? 1 : 0; add(s, "mood", g); if (s._dsN >= 6) add(s, "stress", 1);
    render();
  }
  function phoneDsLike(i) {
    s._dsLiked = s._dsLiked || {}; if (s._dsLiked[i]) return; s._dsLiked[i] = true;
    const ic = document.querySelector(`[data-dslike="${i}"] .ds-ic`); const cnt = document.querySelector(`[data-dslike="${i}"] small`);
    if (ic) { ic.classList.add("on"); if (cnt) { const m = (cnt.textContent.match(/[\d.]+/) || [0])[0]; if (/w/.test(cnt.textContent)) cnt.textContent = (parseFloat(m) + 0.0001).toFixed(1) + "w"; else cnt.textContent = (parseInt(m, 10) + 1); } }
    else render();
  }
  // —— 天气：随年代/季节/世界运势调味 ——
  function appWeather() {
    const w = s.world || {};
    const mo = Math.round(w.momentum || 0);
    const sea = seasonName();
    const ic = sea === "春" ? "🌦️" : sea === "夏" ? "☀️" : sea === "秋" ? "🍂" : "❄️";
    const temp = sea === "春" ? 18 : sea === "夏" ? 32 : sea === "秋" ? 16 : 3;
    const air = (w.priceIndex || 1) >= 1.5 ? "重度（物价爆表）" : (w.priceIndex || 1) >= 1.2 ? "中度" : "优";
    const luck = mo > 25 ? "☀️ 运势：顺风顺水，宜出手" : mo < -25 ? "⛈️ 运势：霉运缠身，宜蛰伏" : "⛅ 运势：平稳";
    return phoneHeader("⛅ 天气", `${s.city ? C._util.cityFull(s.city) : "本地"}`)
      + `<div class="wt-main"><div class="wt-ic">${ic}</div><div class="wt-t">${temp}°</div><div class="wt-d">${s.year}年${sea}季</div></div>
      <div class="wl-rows">
        <div class="wl-r"><span>🌫️ 空气</span><b>${air}</b></div>
        <div class="wl-r"><span>📊 就业景气</span><b>${Math.round(w.jobMarket || 0)}</b></div>
        <div class="wl-r"><span>🌪️ 风口热度</span><b>${Math.round(w.windHeat || 0)}</b></div>
        <div class="wl-r"><span>🎲 时代运势</span><b>${luck}</b></div>
      </div>`;
  }
  // —— 设置：本人档案 + 关于本机 ——
  function appSettings() {
    const bp = s.birthplace ? s.birthplace.path : "—";
    return phoneHeader("⚙️ 设置", "本人档案")
      + `<div class="wl-rows">
        <div class="wl-r"><span>📛 机主</span><b>${s.playerName || "无名之人"}</b></div>
        <div class="wl-r"><span>🎂 年龄</span><b>${s.age} 岁（${s.year}年）</b></div>
        <div class="wl-r"><span>🏷️ 出身</span><b>${s.cohortName || "—"}</b></div>
        <div class="wl-r"><span>🧭 阶级</span><b>${C.CLASS_NAMES[classTier(s)]}</b></div>
        <div class="wl-r"><span>📍 籍贯</span><b>${bp}</b></div>
        <div class="wl-r"><span>🏠 定居</span><b>${s.city ? C._util.cityFull(s.city) : "—"}</b></div>
        <div class="wl-r"><span>⚙️ 难度</span><b>${DIFFS[gameDiff] ? DIFFS[gameDiff].emoji + " " + gameDiff : gameDiff}</b></div>
      </div>
      <div class="wl-sec">🖼️ 壁纸（手机 / 电脑通用）</div>
      <div class="wall-grid">${WALLPAPERS.map(w => `<button class="wall-sw ${(s._wall || "deep") === w.id ? "on" : ""}" data-wall="${w.id}" style="background:${w.css}"><span>${w.name}</span></button>`).join("")}</div>
      <div class="wl-sec">关于本机</div>
      <div class="ph-about">荒诞人生 OS · 一台陪你过完这辈子的手机。<br>电量 87%，但你的人生电量还剩 ${Math.max(0, 100 - s.age)}%。</div>`;
  }
  // —— 备忘录：随手记，真存进存档 ——
  function appNotes() {
    const v = (s._notes || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const msg = s._phoneMsg ? `<div class="wl-msg">${s._phoneMsg}</div>` : "";
    return phoneHeader("📝 备忘录", "随手记下来") + msg
      + `<textarea id="noteArea" class="note-area" placeholder="待办、灵感、想对自己说的话……写下来就不会忘。">${v}</textarea>`
      + `<div class="ap-foot"><button class="btn primary" id="noteSave">💾 保存</button></div>`;
  }
  // —— 计算器：真能算 ——
  function calcDisp() { return phoneCalc.cur.length > 12 ? Number(phoneCalc.cur).toPrecision(8) : phoneCalc.cur; }
  function calcInput(k) {
    const c = phoneCalc;
    if (/[0-9]/.test(k)) { c.cur = (c.fresh || c.cur === "0") ? k : c.cur + k; c.fresh = false; return; }
    if (k === ".") { if (c.fresh) { c.cur = "0."; c.fresh = false; } else if (c.cur.indexOf(".") < 0) c.cur += "."; return; }
    if (k === "C") { phoneCalc = { cur: "0", acc: null, op: null, fresh: true }; return; }
    if (k === "±") { c.cur = String(-parseFloat(c.cur)); return; }
    if (k === "%") { c.cur = String(parseFloat(c.cur) / 100); return; }
    if (k === "=") { if (c.op != null && c.acc != null) { c.cur = String(calcEval(c.acc, parseFloat(c.cur), c.op)); c.op = null; c.acc = null; c.fresh = true; } return; }
    // 运算符
    if (c.op != null && !c.fresh) { c.acc = calcEval(c.acc, parseFloat(c.cur), c.op); c.cur = String(c.acc); }
    else c.acc = parseFloat(c.cur);
    c.op = k; c.fresh = true;
  }
  function calcEval(a, b, op) { const r = op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : op === "÷" ? (b === 0 ? 0 : a / b) : b; return Math.round(r * 1e8) / 1e8; }
  function appCalc() {
    const keys = ["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "="];
    const btns = keys.map(k => { const op = "÷×-+=".indexOf(k) >= 0; const fn = "C±%".indexOf(k) >= 0; const wide = k === "0"; return `<button class="cl-k${op ? " op" : ""}${fn ? " fn" : ""}${wide ? " wide" : ""}" data-k="${k}">${k}</button>`; }).join("");
    return phoneHeader("🧮 计算器", phoneCalc.op ? "计算中" : "")
      + `<div class="cl-disp">${calcDisp()}</div><div class="cl-pad">${btns}</div>`;
  }
  // app 路由：把当前 app 渲染成手机屏幕里的内容
  function phoneScreenBody() {
    if (phoneApp === "home") return phoneHome();
    const m = { wechat: appWechat, boss: appBoss, sms: appSms, call: appCall, browser: appBrowser, music: appMusic, news: appNews, msg: appMessages, contacts: appContacts, wallet: appWallet, market: appMarket, taoba: appTaoba, calendar: appCalendar, album: appAlbum, reels: appReels, notes: appNotes, calc: appCalc, weather: appWeather, settings: appSettings };
    return (m[phoneApp] || phoneHome)();
  }
  function renderPhone() {
    const onHome = phoneApp === "home";
    app().innerHTML = `<div class="screen">${navBar("phone")}
      <div class="play-cols">
        <section class="play-main">
          <div class="phonepage">
            <div class="dev ${onHome ? "dev-home-bg" : ""}">
              <div class="dev-notch"></div>
              <div class="dev-status"><span>${phoneClock()}</span><span class="ds-mid">📱 荒诞人生 OS</span><span>📶 🔋87</span></div>
              <div class="dev-screen ${onHome ? "is-home" : ""}">${phoneScreenBody()}</div>
              <div class="dev-bar"><button class="dev-homebtn" id="phHomeBtn" title="回到主屏"></button></div>
            </div>
            <div class="phone-actions"><button class="btn" id="closep">放下手机 →</button></div>
          </div>
        </section>
        <aside class="play-side">${dashboard()}
          <div class="scene-hero" style="${C.images.styleBg("phone", 1200)}"><span class="scene-cap">手机 · 你口袋里的整个世界</span></div>
        </aside>
      </div></div>`;
    bindNav();
    activeDev = "phone";
    document.getElementById("closep").onclick = () => { screen = "play"; render(); };
    document.querySelectorAll(".ph-app[data-app]").forEach(b => b.onclick = () => { openDeviceApp(b.dataset.app); render(); });
    bindDeviceApps();
  }
  // 设备通用：当前在哪台设备就改哪个 app 状态
  function openDeviceApp(id) { if (activeDev === "pc") pcApp = id; else phoneApp = id; s._phoneMsg = null; }
  function goDeviceHome() { if (activeDev === "pc") pcApp = "home"; else phoneApp = "home"; phoneWx.peer = null; s._phoneMsg = null; }
  // 手机 / 电脑 app 内的所有交互（共用一套绑定，谁在前台就作用于谁）
  function bindDeviceApps() {
    ["phHomeBtn", "pcHomeBtn"].forEach(id => { const el = document.getElementById(id); if (el) el.onclick = () => { goDeviceHome(); render(); }; });
    const back = document.getElementById("phBack"); if (back) back.onclick = () => { goDeviceHome(); render(); };
    document.querySelectorAll(".pc-app[data-app]").forEach(b => b.onclick = () => { openDeviceApp(b.dataset.app); render(); });
    document.querySelectorAll("[data-app]:not(.ph-app):not(.pc-app)").forEach(b => b.onclick = () => { openDeviceApp(b.dataset.app); render(); });
    document.querySelectorAll("[data-screen]").forEach(b => b.onclick = () => { screen = b.dataset.screen; weekLog = []; render(); });
    // 头条：深扒
    const dig = document.getElementById("dig"); if (dig) dig.onclick = () => {
      add(s, "insight", 2); add(s, "mood", -2); flag(s, "wind_hint");
      s.news = buildFeed(s, true);
      if (C._util.applyNewsToMarket) C._util.applyNewsToMarket(s, s.news);
      if (C._util.applyNewsSignals) C._util.applyNewsSignals(s);
      weekLog = ["📱 你又翻了几十页。零碎的消息在脑子里慢慢拼成一张模糊的图——风往哪吹，你心里隐隐有了数，但谁也不敢打包票。"];
      render();
    };
    // 钱包：转账给联系人（真扣钱、真涨信任）
    document.querySelectorAll(".wl-give[data-give]").forEach(b => b.onclick = () => {
      const c = s.cast && s.cast[b.dataset.give]; if (!c || s.cash < 2000) return;
      add(s, "cash", -2000); add(s, "mood", 2); add(s, "reputation", 1);
      c.trust = Math.min(100, (c.trust || 50) + 6); c.pressure = Math.max(0, (c.pressure || 30) - 8);
      s._phoneMsg = `🧧 你给 ${c.name} 转了 ¥2,000。对方很领情——信任 +6，ta 肩上的担子也轻了些。钱花在人情上，关键时刻才有人接得住你。`;
      s.timeline.push({ age: s.age, text: `用手机给 ${c.name} 转了 ¥2,000。` });
      render();
    });
    // 短视频
    const rl = document.getElementById("rlNext"); if (rl) rl.onclick = () => {
      phoneReels.n++;
      phoneReels.txt = REELS_POOL[(phoneReels.n - 1) % REELS_POOL.length];
      const gain = phoneReels.n <= 3 ? 2 : phoneReels.n <= 7 ? 1 : 0;
      add(s, "mood", gain); if (phoneReels.n >= 6) add(s, "stress", 1);
      render();
    };
    // 计算器
    document.querySelectorAll(".cl-k[data-k]").forEach(b => b.onclick = () => { calcInput(b.dataset.k); render(); });
    // 壁纸切换（手机/电脑通用）
    document.querySelectorAll("[data-wall]").forEach(b => b.onclick = () => { s._wall = b.dataset.wall; render(); });
    // 备忘录：保存
    const ns = document.getElementById("noteSave"); if (ns) ns.onclick = () => { const a = document.getElementById("noteArea"); s._notes = a ? a.value : ""; s._phoneMsg = "📝 已保存。"; render(); };
    // 绿泡泡（仿微信）
    document.querySelectorAll("[data-wxtab]").forEach(b => b.onclick = () => { phoneWx.tab = b.dataset.wxtab; phoneWx.peer = null; phoneWx.sub = null; phoneWx.plus = false; phoneWx.info = false; s._phoneMsg = null; render(); });
    document.querySelectorAll("[data-wxopen]").forEach(b => b.onclick = () => { phoneWx.peer = b.dataset.wxopen; phoneWx.plus = false; phoneWx.info = false; s._phoneMsg = null; render(); });
    document.querySelectorAll("[data-wxsub]").forEach(b => b.onclick = () => { phoneWx.sub = b.dataset.wxsub; s._phoneMsg = null; render(); });
    const wxb = document.getElementById("wxBack"); if (wxb) wxb.onclick = () => { phoneWx.peer = null; phoneWx.plus = false; phoneWx.info = false; s._phoneMsg = null; render(); };
    const wxsb = document.getElementById("wxSubBack"); if (wxsb) wxsb.onclick = () => { phoneWx.sub = null; phoneWx.tab = "discover"; s._phoneMsg = null; render(); };
    const wxAdd = document.getElementById("wxAdd"); if (wxAdd) wxAdd.onclick = () => { phoneWx.tab = "contacts"; s._phoneMsg = null; render(); };
    const wxPlus = document.getElementById("wxPlus"); if (wxPlus) wxPlus.onclick = () => { phoneWx.plus = !phoneWx.plus; render(); };
    ["wxInfo", "wxInfo2"].forEach(id => { const el = document.getElementById(id); if (el) el.onclick = () => { phoneWx.info = !phoneWx.info; render(); }; });
    const wxSend = document.getElementById("wxSend"); if (wxSend) wxSend.onclick = () => { const inp = document.getElementById("wxInput"); wxSendText(inp ? inp.value : ""); };
    const wxInput = document.getElementById("wxInput"); if (wxInput) wxInput.onkeydown = (e) => { if (e.key === "Enter") { wxSendText(wxInput.value); } };
    document.querySelectorAll("[data-wxrep]").forEach(b => b.onclick = () => { phoneWx.plus = false; wxReply(b.dataset.wxrep); });
    document.querySelectorAll("[data-wxlike]").forEach(b => b.onclick = () => { wxLike(b.dataset.wxlike); });
    document.querySelectorAll("[data-wxclaim]").forEach(b => b.onclick = () => { wxClaim(b.dataset.wxclaim); });
    document.querySelectorAll("[data-wxpost]").forEach(b => b.onclick = () => { wxPost(b.dataset.wxpost); });
    const wxCover = document.getElementById("wxCover"); if (wxCover) wxCover.onclick = () => { const ids = (typeof WALLPAPERS !== "undefined" ? WALLPAPERS : []).map(w => w.id); if (!ids.length) return; const i = ids.indexOf(s._wxCover || "dusk"); s._wxCover = ids[(i + 1) % ids.length]; render(); };
    // 老大直聘：打开岗位沟通 / 返回 / 投简历 / 面试
    document.querySelectorAll("[data-bossjob]").forEach(b => b.onclick = () => { phoneBoss.job = b.dataset.bossjob; s._phoneMsg = null; render(); });
    const bossBack = document.getElementById("bossBack"); if (bossBack) bossBack.onclick = () => { phoneBoss.job = null; s._phoneMsg = null; render(); };
    document.querySelectorAll("[data-bossapply]").forEach(b => b.onclick = () => { bossApply(b.dataset.bossapply); });
    document.querySelectorAll("[data-bossitv]").forEach(b => b.onclick = () => { bossInterview(b.dataset.bossitv); });
    // 短信：打开会话 / 返回
    document.querySelectorAll("[data-smsopen]").forEach(b => b.onclick = () => { phoneSms.open = b.dataset.smsopen; s._phoneMsg = null; render(); });
    const smsBack = document.getElementById("smsBack"); if (smsBack) smsBack.onclick = () => { phoneSms.open = null; render(); };
    // 通讯录：点联系人直接进绿泡泡聊天
    document.querySelectorAll("[data-ctopen]").forEach(b => b.onclick = () => { openDeviceApp("wechat"); phoneWx.peer = b.dataset.ctopen; render(); });
    // 电话：拨打 / 音乐：播放
    document.querySelectorAll("[data-callto]").forEach(b => b.onclick = () => { phoneCallDo(b.dataset.callto); });
    document.querySelectorAll("[data-music]").forEach(b => b.onclick = () => { phoneMusicDo(b.dataset.music); });
    // 淘粑：切分类 / 抖声：下一个、点赞
    document.querySelectorAll("[data-taobacat]").forEach(b => b.onclick = () => { s._taobaCat = b.dataset.taobacat; render(); });
    const dsN = document.getElementById("dsNext"); if (dsN) dsN.onclick = () => phoneDsNext();
    document.querySelectorAll("[data-dslike]").forEach(b => b.onclick = () => phoneDsLike(parseInt(b.dataset.dslike, 10)));
    // 电脑浏览器：标签页 + 书签
    document.querySelectorAll("[data-bropen]").forEach(b => b.onclick = (e) => { e.stopPropagation(); brOpen(b.dataset.bropen); });
    document.querySelectorAll(".brz-tab[data-brtab]").forEach(b => b.onclick = () => { pcBrz.active = parseInt(b.dataset.brtab, 10); render(); });
    document.querySelectorAll("[data-brclose]").forEach(b => b.onclick = (e) => { e.stopPropagation(); brCloseTab(parseInt(b.dataset.brclose, 10)); });
    const brNew = document.getElementById("brNew"); if (brNew) brNew.onclick = () => brNewTab();
    const brHomeBtn = document.getElementById("brHomeBtn"); if (brHomeBtn) brHomeBtn.onclick = () => { pcBrz.tabs[pcBrz.active] = { site: "home" }; render(); };
    const brReload = document.getElementById("brReload"); if (brReload) brReload.onclick = () => render();
    // 理财买卖/区间/图表
    bindMarket();
    // 电脑：搞钱工作台 / 学习充电站 / 网购 / 游戏厅
    document.querySelectorAll("[data-gig]").forEach(b => b.onclick = () => { pcWorkDo(b.dataset.gig); });
    document.querySelectorAll("[data-course]").forEach(b => b.onclick = () => { pcStudyDo(b.dataset.course); });
    document.querySelectorAll(".buybtn[data-buy]").forEach(b => b.onclick = () => { const it = C.consumption.find(x => x.id === b.dataset.buy); if (it) { buy(it); render(); } });
    // 电脑棋牌室：启动内置棋类 + 对局内交互（共用棋盘面板绑定）
    document.querySelectorAll(".pc-gcard[data-bg]").forEach(b => b.onclick = () => startBoardGame(b.dataset.bg, "pc"));
    if (activeDev === "pc" && pcApp === "games") { bindBoardPanel(); }
  }

  /* ============================ 💻 电脑（笔记本 / 台式）============================ */
  const STAT_CN = { body: "体魄", mind: "心智", knowledge: "学识", strategy: "谋略", charm: "魅力", insight: "见识" };
  const PC_APPS = [
    { id: "trade", icon: "📈", name: "交易台" },
    { id: "work", icon: "💼", name: "搞钱工作台" },
    { id: "study", icon: "📚", name: "学习充电站" },
    { id: "shop", icon: "🛍️", name: "淘粑" },
    { id: "mail", icon: "📧", name: "邮箱" },
    { id: "data", icon: "📊", name: "数据看板" },
    { id: "games", icon: "♟️", name: "棋牌室" },
    { id: "assistant", icon: "🤖", name: "智能助手" },
    { id: "browser", icon: "🌐", name: "浏览器" },
    { id: "wechat", icon: "💬", svg: WX_ICON, name: "绿泡泡", green: true }
  ];
  const PC_GIGS = [
    { id: "freelance", icon: "💻", label: "接私活 · 写代码", stat: "knowledge", base: 1200, mood: -1, stress: 2, txt: "熬夜赶完需求，钱到账，人也熬虚了。" },
    { id: "media", icon: "🎬", label: "做自媒体 · 剪视频", stat: "charm", base: 700, mood: 1, stress: 1, txt: "涨了点粉，一笔广告费打了过来。" },
    { id: "design", icon: "🎨", label: "接设计单 · 做海报", stat: "insight", base: 1000, mood: 0, stress: 1, txt: "甲方改了八版，总算过稿结款。" },
    { id: "anal", icon: "📈", label: "写行情复盘 · 投稿", stat: "strategy", base: 900, mood: 0, stress: 1, txt: "一篇复盘投出去，平台给了稿酬。" },
    { id: "label", icon: "🧩", label: "数据标注 · 外包", stat: "mind", base: 450, mood: -1, stress: 1, txt: "机械又枯燥，但稳稳一笔进账。" }
  ];
  const PC_COURSES = [
    { id: "code", icon: "💻", label: "编程进阶", stat: "knowledge" },
    { id: "biz", icon: "📈", label: "商业财经", stat: "strategy" },
    { id: "comm", icon: "🗣️", label: "沟通表达", stat: "charm" },
    { id: "think", icon: "🧠", label: "思维训练", stat: "mind" },
    { id: "insight", icon: "🔭", label: "洞察趋势", stat: "insight" },
    { id: "fit", icon: "💪", label: "健身计划", stat: "body" }
  ];
  function pcGigEarn(g) { return Math.round((g.base + (s.stats[g.stat] || 30) * 7) * (hasGear("headphone") ? 1.15 : 1) * (activeComputerKind() === "desktop" ? 1.1 : 1)); }
  function pcStudyAmt() { return 2 + (hasGear("headphone") ? 1 : 0) + (activeComputerKind() === "desktop" ? 1 : 0); }
  function pcWorkDo(id) {
    if (s._pcWorkWk === s.week) return;
    const g = PC_GIGS.find(x => x.id === id); if (!g) return;
    const earn = pcGigEarn(g); s._pcWorkWk = s.week;
    add(s, "cash", earn); add(s, g.stat, 1); if (g.mood) add(s, "mood", g.mood); if (g.stress) add(s, "stress", g.stress);
    s._phoneMsg = `💰 ${g.txt} 到手 ¥${earn.toLocaleString()}（${STAT_CN[g.stat]} +1）。`;
    s.timeline.push({ age: s.age, text: `用电脑${g.label}，赚了 ¥${earn.toLocaleString()}。` });
    render();
  }
  function pcStudyDo(id) {
    if (s._pcStudyWk === s.week) return;
    const c = PC_COURSES.find(x => x.id === id); if (!c) return;
    const amt = pcStudyAmt(); s._pcStudyWk = s.week;
    add(s, c.stat, amt); add(s, "mood", -1);
    s._phoneMsg = `📚 你专心上了一门「${c.label}」，${STAT_CN[c.stat]} +${amt}。`;
    s.timeline.push({ age: s.age, text: `用电脑上网课「${c.label}」，${STAT_CN[c.stat]}有所提升。` });
    render();
  }
  function pcHome() {
    const nw = Math.round(netWorth(s));
    const icons = PC_APPS.map(a => `<button class="pc-app" data-app="${a.id}"><span class="pc-ic${a.green ? " ph-ic-wx" : ""}">${a.svg || a.icon}</span><span class="pc-nm">${a.name}</span></button>`).join("");
    return `<div class="pc-home" style="background:${wallCss()}">
      <div class="pc-widgets">
        <div class="pc-w pc-w-clock"><div class="pc-clock">${phoneClock()}</div><div class="pc-date">${s.year}年${seasonName()} · ${s.age}岁</div></div>
        <div class="pc-w"><small>身价</small><b>¥${nw.toLocaleString()}</b></div>
        <div class="pc-w"><small>现金</small><b>¥${Math.round(s.cash || 0).toLocaleString()}</b></div>
      </div>
      <div class="pc-grid">${icons}</div>
      <div class="pc-tip">💡 笔记本随身可用；台式只能在家用，但效率更高。</div>
    </div>`;
  }
  function pcTrade() { return phoneHeader("📈 交易台", "大屏 K 线 · 批量买卖 · 比手机顺手") + marketPanelHTML(true); }
  function pcWork() {
    const worked = s._pcWorkWk === s.week;
    const msg = s._phoneMsg ? `<div class="wl-msg">${s._phoneMsg}</div>` : "";
    const rows = PC_GIGS.map(g => `<button class="pc-gig" data-gig="${g.id}" ${worked ? "disabled" : ""}><span class="pc-gig-ic">${g.icon}</span><span class="pc-gig-mid"><b>${g.label}</b><small>预计 ¥${pcGigEarn(g).toLocaleString()} · 看「${STAT_CN[g.stat]}」</small></span><span class="pc-gig-go">${worked ? "本周已干" : "开工 →"}</span></button>`).join("");
    return phoneHeader("💼 搞钱工作台", worked ? "本周已经搞过一笔了" : "挑个活，开工赚钱") + msg
      + `<div class="pc-gigs">${rows}</div>`
      + `<p class="ap-note">电脑能接的活儿，一周能干一笔。收入随对应能力越高越多；戴降噪耳机或用台式还有加成。干活也耗心力。</p>`;
  }
  function pcStudy() {
    const studied = s._pcStudyWk === s.week;
    const msg = s._phoneMsg ? `<div class="wl-msg">${s._phoneMsg}</div>` : "";
    const amt = pcStudyAmt();
    const rows = PC_COURSES.map(c => `<button class="pc-gig" data-course="${c.id}" ${studied ? "disabled" : ""}><span class="pc-gig-ic">${c.icon}</span><span class="pc-gig-mid"><b>${c.label}</b><small>${STAT_CN[c.stat]} +${amt}</small></span><span class="pc-gig-go">${studied ? "本周已学" : "上课 →"}</span></button>`).join("");
    return phoneHeader("📚 学习充电站", studied ? "今天学过了，脑子得歇歇" : "上网课，给自己充电") + msg
      + `<div class="pc-gigs">${rows}</div>`
      + `<p class="ap-note">一周能专心上一门课。比起线下，电脑上学更高效；戴降噪耳机或用台式效率更高。学习略耗心情。</p>`;
  }
  function pcData() {
    const nw = netWorth(s); const pv = C._util.stockValue ? C._util.stockValue(s) : 0;
    const bars = C.STAT_KEYS.map(statBar).join("");
    const prof = C._util.profileSummary ? C._util.profileSummary(s) : "";
    const infl = C._util.influenceSummary ? C._util.influenceSummary(s) : "";
    const reach = C._util.socialReach ? C._util.socialReach(s) : (s.social || []).length;
    const mb = C._util.monthlyBill ? C._util.monthlyBill(s) : null;
    return phoneHeader("📊 数据看板", "把人生摊开看")
      + `<div class="wl-rows">
        <div class="wl-r"><span>总身价</span><b style="color:var(--green)">¥${Math.round(nw).toLocaleString()}</b></div>
        <div class="wl-r"><span>现金 / 持仓</span><b>¥${Math.round(s.cash || 0).toLocaleString()} / ¥${Math.round(pv).toLocaleString()}</b></div>
        ${mb ? `<div class="wl-r"><span>每月账单</span><b style="color:var(--red)">¥${mb.total.toLocaleString()}</b></div>` : ""}
        <div class="wl-r"><span>人脉触达</span><b>约 ${reach} 人</b></div>
        <div class="wl-r"><span>声誉 / 人脉值</span><b>${Math.round(s.reputation || 0)} / ${Math.round(s.network || 0)}</b></div>
      </div>
      <div class="stk-sec">六维能力</div><div class="bars">${bars}</div>
      ${prof ? `<div class="pc-data-line">🪪 ${prof}</div>` : ""}
      ${infl ? `<div class="pc-data-line">🏛️ 影响力：${infl}</div>` : ""}
      <div class="stk-sec">行业风向</div>${industryBoardHTML() || '<div class="ph-empty">暂无行业数据。</div>'}`;
  }
  // —— 网购：复用消费品库，电脑大屏一站买齐 ——
  function pcShop() {
    return phoneHeader("🛍️ 淘粑 · 网页版", "啥都能淘到，下单更方便") + `<div class="tb-pc">${taobaPanelHTML()}</div>`;
  }
  // —— 邮箱：正式来信（offer / 对账单 / 证书 / 钓鱼），随状态生成 ——
  function pcMail() {
    const list = [];
    const mb = C._util.monthlyBill ? C._util.monthlyBill(s) : null;
    if (s._pcWorkWk === s.week) list.push({ av: "💼", who: "接单平台", sub: "稿酬已结算", text: "您本周的任务报酬已打款至绑定账户，请注意查收。期待下次合作。", to: "wallet" });
    if (s._pcStudyWk === s.week) list.push({ av: "🎓", who: "在线学堂", sub: "结课证书", text: "恭喜完成本周课程！证书已发放到账户，继续保持学习节奏。" });
    if (!s.job && !has(s, "startup_done")) list.push({ av: "🧑‍💼", who: "猎头 · Linda", sub: "一个机会", text: "看到你的背景，手上有几个岗位很匹配。方便的话回个话，详聊。（去「人生」页投简历/面试）", to: "play" });
    if (s.job) list.push({ av: "🏢", who: "公司 HR", sub: "工资条", text: `本月薪酬明细已生成。税后到手已发放，相关社保公积金照常缴纳。` });
    if (mb) list.push({ av: "🏦", who: "银行对账", sub: "月度账单", text: `本月各项支出合计约 ¥${mb.total.toLocaleString()}。可在「钱包」查看坐吃山空可撑月数。`, to: "wallet" });
    list.push({ av: "🎣", who: "中奖通知（可疑）", sub: "您已被抽中", text: "尊敬的用户：您荣获一等奖 ¥888,888，请点击链接填写银行卡领取……（一眼诈骗，已自动归类垃圾邮件）", spam: true });
    const rows = list.map(m => `<button class="mail-row${m.spam ? " spam" : ""}" ${m.to ? `data-${["play", "social", "shop", "market"].includes(m.to) ? "screen" : "app"}="${m.to}"` : ""}>
      <span class="mail-av">${m.av}</span>
      <span class="mail-mid"><span class="mail-top"><b>${m.who}</b><small>${m.sub}</small></span><span class="mail-prev">${m.text}</span></span>
    </button>`).join("");
    return phoneHeader("📧 邮箱", `${list.length} 封邮件`) + `<div class="mail-list">${rows}</div>`;
  }
  // —— 游戏厅：把真·小游戏/棋牌内置进电脑，直接在这儿玩 ——
  // —— 游戏厅：电脑上只装三款真·棋类（五子棋 / 中国象棋 / 围棋），联机对弈 ——
  const PC_BOARD_IDS = ["gomoku", "xiangqi", "weiqi"];
  function pcGames() {
    if (gameHost === "pc" && bgId && bgGame && bgBoard) return phoneHeader("🎮 棋牌室", "对弈中") + `<div class="pc-gamewrap">${boardPanelHTML()}</div>`;
    const boards = PC_BOARD_IDS.map(id => (C._util.bgById ? C._util.bgById(id) : null)).filter(Boolean);
    const cards = boards.map(g => `<div class="pc-gcard" data-bg="${g.id}">
      <span class="pc-gc-emoji">${g.emoji}</span>
      <div class="pc-gc-mid"><b>${g.name}</b><small>🌐 联机对弈 · AI 对手「${g.opponent}」</small></div>
      <span class="pc-gc-go">对弈 →</span></div>`).join("");
    return phoneHeader("🎮 棋牌室", "三款经典棋，落子见真章")
      + `<div class="pc-glist">${cards || '<div class="ph-empty">棋盘还没装好。</div>'}</div>`
      + `<p class="ap-note">点击棋盘交叉点/棋子落子，与 AI 对弈。赢了长心气、添名声，输了也是磨练。</p>`;
  }
  // —— 智能助手：根据当前处境给出可操作建议（只读参谋）——
  function pcAssistant() {
    const tips = [];
    const mb = C._util.monthlyBill ? C._util.monthlyBill(s) : null;
    const runway = mb && mb.total > 0 ? ((s.cash || 0) + (s.assets || 0)) / mb.total : 99;
    if (runway < 6) tips.push("⚠️ 你的现金流告急（可撑不到半年）。优先开「搞钱工作台」接活，或减少大额消费。");
    if (s.health < 35) tips.push("❤️ 健康偏低，是唯一直接影响寿命的维度。少熬夜、去「游戏厅/旅行」降压，必要时就医。");
    if (s.mood < 35) tips.push("🙂 心情低迷会拖累状态。刷会短视频、打两局游戏、给好友发个红包都能回血。");
    if (s.stress > 70) tips.push("😣 压力爆表，容易出事。安排放松，别硬扛。");
    if (s.knownSignals) { const hot = Object.keys(s.knownSignals).filter(id => (s.knownSignals[id].confidence || 0) >= 50 && SIGNAL_LABEL[id]); if (hot.length) tips.push(`📡 你已嗅到风向：${hot.slice(0, 3).map(id => SIGNAL_LABEL[id]).join("、")}。在「交易台」顺着趋势埋伏。`); }
    if (s.eraWind) tips.push(`🌪️ 当下风口大致在「${s.eraWind}」一带。多读「浏览器」新闻、在交易台对应板块找机会。`);
    const minK = C.STAT_KEYS.reduce((a, k) => (s.stats[k] < s.stats[a] ? k : a), C.STAT_KEYS[0]);
    tips.push(`📚 你最弱的一项是「${STAT_CN[minK] || minK}」（${Math.round(s.stats[minK])}）。去「学习充电站」针对性补一补。`);
    if ((s.network || 0) < 25) tips.push("🤝 人脉偏薄。多在「绿泡泡」走动、发红包，关键时刻才有人接得住你。");
    tips.push("💡 一周能接一次私活、上一门课，记得每周都用上——复利在时间这边。");
    return phoneHeader("🤖 智能助手", "看了你的处境，给几条建议")
      + `<div class="pc-tips">${tips.map(t => `<div class="pc-tip-row">${t}</div>`).join("")}</div>`;
  }
  /* —— 💬 绿泡泡·电脑端：仿真桌面客户端（左侧栏 + 会话列表 + 大对话区）—— */
  function pcWxRail(tab, unread) {
    return `<div class="wd-rail">
      <div class="wd-rail-av">🙂</div>
      <button class="wd-rb${tab === "chats" ? " on" : ""}" data-wxtab="chats" title="聊天">💬${unread ? `<i class="wd-dot">${unread > 99 ? "99+" : unread}</i>` : ""}</button>
      <button class="wd-rb${tab === "contacts" ? " on" : ""}" data-wxtab="contacts" title="通讯录">👥</button>
      <button class="wd-rb${phoneWx.sub === "moments" ? " on" : ""}" data-wxsub="moments" title="朋友圈">🧭</button>
      <div class="wd-rail-sp"></div>
      <button class="wd-rb${tab === "me" ? " on" : ""}" data-wxtab="me" title="我">⚙️</button>
    </div>`;
  }
  function pcWxRow(c) {
    const active = phoneWx.peer === c.pid ? " on" : ""; const ur = wxUnread(c);
    return `<div class="wd-li${active}" data-wxopen="${c.pid}">
      <span class="wd-av">${wxAvatarOf(c)}${ur ? `<i class="wd-libadge">${ur}</i>` : ""}</span>
      <span class="wd-li-mid"><span class="wd-li-top"><b>${c.name}</b><small>${wxTime(c)}</small></span><span class="wd-li-prev">${wxLastLine(c)}</span></span>
    </div>`;
  }
  function pcWxConvo() {
    const p = wxPeer(phoneWx.peer); if (!p) return "";
    const meta = wxContacts().find(c => c.pid === p.id) || {};
    const fav = wxFavVal(p);
    const bubbles = wxBuildBubbles(p, fav, meta);
    const tools = !p.group ? `<div class="wd-tools">${WX_REPLIES.map(r => { const dis = r.cost && s.cash < r.cost; const parts = r.label.split(" "); return `<button class="wd-tool" data-wxrep="${r.id}" ${dis ? "disabled" : ""}>${parts[0]}<small>${parts.slice(1).join("")}</small></button>`; }).join("")}</div>` : `<div class="wd-tools dim">群里发个言吧～</div>`;
    return `<div class="wd-convo">
      <div class="wd-convo-top"><b id="wxInfo">${p.name}</b><span class="wd-convo-sub">${p.role || ""}${p.fam ? "" : " · " + wxFamLabel(fav)}</span><button class="wd-more" id="wxInfo2">资料 ⌄</button></div>
      ${phoneWx.info ? wxNoteCard(p) : ""}
      <div class="wd-thread wxc-thread">${bubbles}</div>
      <div class="wd-inputwrap">${tools}
        <textarea id="wxInput" class="wd-field" placeholder="输入消息，Enter 发送…"></textarea>
        <div class="wd-sendbar"><button class="wxc-send" id="wxSend">发送(Enter)</button></div>
      </div></div>`;
  }
  function pcWechat() {
    const tab = phoneWx.tab || "chats";
    const cs = wxContacts();
    const unread = cs.reduce((a, c) => a + wxUnread(c), 0);
    if (phoneWx.sub === "moments") return `<div class="wd-wx">${pcWxRail(tab, unread)}<div class="wd-moments">${wxMomentsPage()}</div></div>`;
    let list;
    if (tab === "contacts") { const fam = cs.filter(c => c.fam), star = cs.filter(c => c.star && !c.fam), norm = cs.filter(c => !c.star); const sec = (t, arr) => arr.length ? `<div class="wd-sec">${t}</div>` + arr.map(pcWxRow).join("") : ""; list = sec("💗 家人", fam) + sec("★ 关键角色", star) + sec("联系人", norm); }
    else { list = cs.map(pcWxRow).join(""); }
    const mid = `<div class="wd-mid"><div class="wd-search">🔍 搜索</div><div class="wd-list">${list}</div></div>`;
    const right = tab === "me" ? `<div class="wd-mepane">${wxMe()}</div>`
      : phoneWx.peer ? pcWxConvo()
        : `<div class="wd-empty"><div class="wd-empty-ic">💬</div><div>选择一个会话开始聊天</div><small>绿泡泡 电脑版</small></div>`;
    return `<div class="wd-wx">${pcWxRail(tab, unread)}${mid}<div class="wd-right">${right}</div></div>`;
  }
  /* —— 🧭 浏览器·电脑端：真·多标签页浏览器（站点=既是手机 app、也是网页的那些）—— */
  const BR_SITES = {
    home: { title: "新标签页", url: "qpd://start", icon: "🏠" },
    stocks: { title: "穷途熊熊", url: "qiongtu.com", icon: "🐻", render: () => marketPanelHTML(true) },
    boss: { title: "老大直聘", url: "laoda-zhipin.com", icon: "💼", render: appBoss },
    news: { title: "今日头条", url: "toutiao-news.com", icon: "📰", render: appNews },
    shop: { title: "淘粑", url: "taoba.com", icon: "🛍️", render: () => `<div class="tb-pc">${taobaPanelHTML()}</div>` },
    reels: { title: "短视频", url: "duanshipin.tv", icon: "🎬", render: appReels },
    mail: { title: "邮箱", url: "mail.qpd.com", icon: "📧", render: pcMail }
  };
  const BR_NAV = ["stocks", "boss", "news", "shop", "reels", "mail"];   // 起始页书签
  function brHome() {
    const grid = BR_NAV.map(id => { const st = BR_SITES[id]; return `<button class="brz-site" data-bropen="${id}"><span class="brz-site-ic">${st.icon}</span><span>${st.title}</span></button>`; }).join("");
    if (!s.news || !s.news.length) s.news = buildFeed(s, true);
    const hot = (s.news || []).slice(0, 5).map((n, i) => `<button class="br-hot" data-bropen="news"><span class="br-rank ${i < 3 ? "top" : ""}">${i + 1}</span><span class="br-hot-t">${n.headline}</span></button>`).join("");
    return `<div class="brz-home">
      <div class="brz-logo">🧭 穷途浏览器</div>
      <div class="brz-bigsearch">🔍 搜索网页 或 输入网址</div>
      <div class="brz-sites">${grid}</div>
      <div class="stk-sec">🔥 今日热搜</div><div class="br-hots">${hot}</div></div>`;
  }
  function pcBrowserDesktop() {
    if (!pcBrz.tabs || !pcBrz.tabs.length) pcBrz = { tabs: [{ site: "home" }], active: 0 };
    if (pcBrz.active >= pcBrz.tabs.length) pcBrz.active = pcBrz.tabs.length - 1;
    const cur = pcBrz.tabs[pcBrz.active]; const site = BR_SITES[cur.site] || BR_SITES.home;
    const strip = pcBrz.tabs.map((t, i) => { const st = BR_SITES[t.site] || BR_SITES.home; return `<div class="brz-tab${i === pcBrz.active ? " on" : ""}" data-brtab="${i}"><span class="brz-fav">${st.icon}</span><span class="brz-tt">${st.title}</span>${pcBrz.tabs.length > 1 ? `<button class="brz-x" data-brclose="${i}">×</button>` : ""}</div>`; }).join("");
    const addr = `<div class="brz-addr"><button class="brz-nav" id="brHomeBtn" title="主页">🏠</button><button class="brz-nav" id="brReload" title="刷新">⟳</button><div class="brz-url">🔒 ${site.url}</div></div>`;
    const content = cur.site === "home" ? brHome() : (site.render ? site.render() : `<div class="ph-empty">页面空白。</div>`);
    return `<div class="brz"><div class="brz-tabs">${strip}<button class="brz-new" id="brNew" title="新标签页">＋</button></div>${addr}<div class="brz-body">${content}</div></div>`;
  }
  // 浏览器交互：开/切/关标签页
  function brOpen(siteId) { const cur = pcBrz.tabs[pcBrz.active]; if (cur && cur.site === "home") cur.site = siteId; else { pcBrz.tabs.push({ site: siteId }); pcBrz.active = pcBrz.tabs.length - 1; } render(); }
  function brNewTab() { pcBrz.tabs.push({ site: "home" }); pcBrz.active = pcBrz.tabs.length - 1; render(); }
  function brCloseTab(i) { pcBrz.tabs.splice(i, 1); if (!pcBrz.tabs.length) pcBrz.tabs = [{ site: "home" }]; if (pcBrz.active >= pcBrz.tabs.length) pcBrz.active = pcBrz.tabs.length - 1; render(); }
  function pcScreenBody() {
    if (pcApp === "home") return pcHome();
    const m = { trade: pcTrade, work: pcWork, data: pcData, study: pcStudy, shop: pcShop, mail: pcMail, games: pcGames, assistant: pcAssistant, browser: pcBrowserDesktop, wechat: pcWechat };
    return (m[pcApp] || pcHome)();
  }
  function renderPc() {
    activeDev = "pc";
    const kind = activeComputerKind();
    const onHome = pcApp === "home";
    const curApp = PC_APPS.find(a => a.id === pcApp);
    const appName = onHome ? "访达" : (curApp ? curApp.name : "桌面");
    const nw = Math.round(netWorth(s));
    if (!kind) {
      app().innerHTML = `<div class="screen">${navBar("pc")}
        <div class="pc-stage laptop">
          <div class="pcdev laptop"><div class="pc-lid"><div class="pc-cam"></div>
            <div class="pc-screen-area"><div class="pc-unavail">🚪 你正出门在外，家里的台式机够不着。<br><br>想随时随地办公，得带上一台 <b>笔记本电脑</b>。</div></div></div></div>
          <div class="pc-deck"><div class="pc-keys"></div><div class="pc-pad"></div></div>
        </div></div>`;
      bindNav(); return;
    }
    // 顶栏（仿 macOS 菜单栏）+ 程序坞
    const menubar = `<div class="pc-menubar">
        <span class="pc-mb-l"> <b>荒诞人生 OS</b>　<span class="pc-mb-app">${appName}</span></span>
        <span class="pc-mb-r"><span class="pc-mb-stat">💰¥${Math.round(s.cash || 0).toLocaleString()}　❤️${Math.round(s.health)}</span>📶 <span class="pc-batt"><i style="width:${Math.max(10, 100 - s.age)}%"></i></span> ${phoneClock()}　<button class="pc-power" id="pcClose" title="关机回到生活">⏻</button></span>
      </div>`;
    const dock = `<div class="pc-dock">${PC_APPS.map(a => `<button class="pc-dockapp ${pcApp === a.id ? "on" : ""}" data-app="${a.id}" title="${a.name}"><span class="pc-dock-ic${a.green ? " ph-ic-wx" : ""}">${a.svg || a.icon}</span><i class="pc-dock-dot" style="${pcApp === a.id ? "" : "opacity:0"}"></i></button>`).join("")}</div>`;
    const screenArea = `<div class="pc-screen-area">${menubar}<div class="pc-body ${onHome ? "is-home" : ""}${(pcApp === "wechat" || pcApp === "browser") ? " pc-flush" : ""}">${pcScreenBody()}</div>${dock}</div>`;
    const lidOrMon = kind === "desktop"
      ? `<div class="pcdev desktop"><div class="pc-bezel"><div class="pc-cam"></div>${screenArea}</div></div><div class="pc-neck"></div><div class="pc-base"></div>`
      : `<div class="pcdev laptop"><div class="pc-lid"><div class="pc-cam"></div>${screenArea}</div></div><div class="pc-deck"><div class="pc-keys"></div><div class="pc-pad"></div></div>`;
    app().innerHTML = `<div class="screen">${navBar("pc")}
      <div class="pc-stage ${kind}">
        ${lidOrMon}
        <div class="pc-statusline">${kind === "desktop" ? "🖥️ 台式电脑" : "💻 笔记本电脑"} · ${s.year}年${seasonName()} · ${s.age}岁　📊 身价 ¥${nw.toLocaleString()}</div>
      </div></div>`;
    bindNav();
    const close = document.getElementById("pcClose"); if (close) close.onclick = () => { screen = "play"; render(); };
    bindDeviceApps();
  }

  // —— 把一段叙事文本切成「逐句浮现」的片段（按句末标点/换行断句，保留句内 HTML）——
  function vnSegments(raw) {
    let html = String(raw == null ? "" : raw);
    html = html.split("<br>").join("\n").split("<br/>").join("\n").split("<br />").join("\n");
    const enders = "。！？…」”";
    const out = []; let cur = "";
    for (const ch of html) {
      if (ch === "\n") { if (cur.trim()) out.push(cur.trim()); cur = ""; continue; }
      cur += ch;
      if (enders.indexOf(ch) >= 0) { out.push(cur.trim()); cur = ""; }
    }
    if (cur.trim()) out.push(cur.trim());
    return out.length ? out : [html.trim()];
  }
  function renderEvent() {
    if (_vnTimer) { clearInterval(_vnTimer); _vnTimer = null; }
    const node = eventNode; const choices = node.choices || [];
    const btns = choices.map((c, i) => `<button class="btn choice" data-i="${i}"><span class="ch-dot">◆</span><span class="ch-txt">${c.label}</span></button>`).join("");
    const mod = pendingEvent && pendingEvent.module;
    const evImg = C.images.styleBg(C.images.eventKey(mod), 1400, "event");
    // 章节眉头：命运幕显示「命运·第N幕·幕名」，否则年份/年龄/阶级
    let chapter = `${s.year} 年 · ${s.age} 岁 · ${C.CLASS_NAMES[classTier(s)]}`;
    let eraSummary = "";
    if (mod === "mainarc" && C._util.chapterTitle) {
      chapter = C._util.chapterTitle(s);
      eraSummary = C._util.chapterWorldSummary ? C._util.chapterWorldSummary(s) : "";
    } else if (mod === "destiny" && C._util.destinyStatus) {
      const ds = C._util.destinyStatus(s);
      if (ds && ds.act) chapter = `📖 命运 · ${ds.name} · ${ds.act}`;
    } else if (mod === "saga") { chapter = `📖 连续剧 · ${s.year} 年 · ${s.age} 岁`; }
    const rawText = typeof node.text === "function" ? node.text(s) : (node.text || "");
    const segs = vnSegments(rawText);
    const body = segs.map((x, i) => `<span class="vn-seg" data-i="${i}">${x}</span>`).join("");
    app().innerHTML = `<div class="screen event vn">
      ${evImg ? `<div class="vn-bg" style="${evImg}"></div><div class="vn-scrim"></div>` : ""}
      <div class="ev-card vn-page">
        <div class="vn-chapter">${chapter}</div>
        ${eraSummary ? `<div class="vn-era">${eraSummary}</div>` : ""}
        <div class="ev-title vn-title">${(t => { try { return typeof t === "function" ? t(s) : t; } catch (e) { return ""; } })(node.title || pendingEvent.title)}</div>
        <div class="ev-text vn-text">${body}</div>
        <div class="vn-more" id="vnMore">▾ 轻触继续</div>
        <div class="ev-choices vn-choices">${btns}</div>
      </div></div>`;
    // 逐句浮现：依次点亮 .vn-seg；全部点亮后浮现选项。轻触可瞬间展开。
    const segEls = Array.from(document.querySelectorAll(".vn-seg"));
    const choicesBox = document.querySelector(".vn-choices");
    const moreHint = document.getElementById("vnMore");
    let shown = 0;
    const finish = () => {
      if (_vnTimer) { clearInterval(_vnTimer); _vnTimer = null; }
      segEls.forEach(el => el.classList.add("show"));
      shown = segEls.length;
      if (moreHint) moreHint.style.display = "none";
      if (choicesBox) choicesBox.classList.add("ready");
    };
    const step = () => {
      if (shown >= segEls.length) { finish(); return; }
      segEls[shown].classList.add("show"); shown++;
      if (shown >= segEls.length) finish();
    };
    if (segEls.length <= 1) { finish(); }
    else { step(); _vnTimer = setInterval(step, 460); }
    // 轻触页面任意处（非选项）→ 立即展开全文
    const card = document.querySelector(".vn-page");
    if (card) card.addEventListener("click", (e) => { if (e.target.closest(".choice")) return; if (shown < segEls.length) { e.stopPropagation(); finish(); } });
    document.querySelectorAll(".choice").forEach(btn => btn.onclick = () => {
      if (_vnTimer) { clearInterval(_vnTimer); _vnTimer = null; }
      const c = choices[parseInt(btn.dataset.i, 10)];
      if (c.enter) { try { c.enter(s); } catch (x) { } }
      if (c.next) {            // 分支：进入下一层，展开更多选项
        try { gotoNode(c.next); } catch (x) { screen = "play"; }
        render(); return;
      }
      // 终止：应用结果，回到游戏
      let res = ""; try { res = c.effect(s) || ""; } catch (x) { res = ""; }
      if (res) { s.timeline.push({ age: s.age, text: res }); weekLog = ["📌 " + res]; }
      // 由行动触发的事件：选了「先不做」(cancel) → 退还时间不计；否则落账这次行动的耗时
      if (c.cancel) clearPendingAct(); else commitPendingAct();
      pendingEvent = null; eventNode = null;
      if (s._enterVenture) { delete s._enterVenture; if (s.startup && !has(s, "startup_done")) { enterVenture(); return; } }  // 下海经商/成果转化 → 进创业经营子循环
      if (s._mg) { const id = s._mg; delete s._mg; tickMs(); if (s.alive) { startMinigame(id); return; } }  // 事件里拉起的对话小游戏
      if (s._bg) { const id = s._bg; delete s._bg; tickMs(); if (s.alive) { startBoardGame(id); return; } }  // 事件里拉起的真棋盘游戏
      tickMs(); screen = s.alive ? "play" : "dead"; render();
    });
  }

  // 人生回响：把这一生留下的高强度记忆(memories)与未了的心结(threads)在结局回看
  function lifeEchoesHTML() {
    const mems = (s.memories || []).filter(m => (m.intensity || 0) >= 45).sort((a, b) => (b.intensity || 0) - (a.intensity || 0)).slice(0, 5);
    const openThreads = s.threads ? Object.keys(s.threads).filter(k => s.threads[k] && s.threads[k].status !== "closed" && (s.threads[k].level || 0) >= 40) : [];
    if (!mems.length && !openThreads.length) return "";
    const memHtml = mems.map(m => `<div class="echo-item">· ${m.text}</div>`).join("");
    const tHtml = openThreads.length ? `<div class="echo-thread">未了的心结：${openThreads.length} 桩，随你一同长眠。</div>` : "";
    return `<div class="dead-verdict echoes"><div class="echo-h">🕯️ 人生回响</div>${memHtml}${tHtml}</div>`;
  }
  // 创业人生回顾：每局结局都回到「创业」这根主线上
  function founderRecapHTML() {
    if (!C._util.founderReadiness) return "";
    let body = "";
    if (has(s, "startup_done")) {
      const won = has(s, "chase_ipo") && !has(s, "startup_failed");
      const fail = has(s, "startup_failed") || has(s, "been_bankrupt");
      body = won ? "你把公司带上了台前——从一个念头到一家真正的公司，你做到了极少数人敢想的事。"
        : fail ? "你创过业，也尝过公司清盘的滋味。九死一生里，你是那个『九』——但你真的下过场。"
          : "你创过一次业，有过自己的公司。它没惊天动地，却是你亲手搭起来的。";
    } else if (s.startup) {
      body = "你的公司还在半路上，你也走到了人生的终点。未竟，但你毕竟是个下过场的人。";
    } else {
      const r = C._util.founderReadiness(s);
      body = r >= 60 ? "你一直被推到创业门口，却终究没迈出那一步。准备好了，却没敢赌——这成了你心里一根没拔的刺。"
        : r >= 30 ? "你想过自己干，念头冒过很多次，最后都被生活按了回去。也许是怂，也许是清醒。"
          : "创业这件事，你这辈子只在饭桌上聊过。人生有很多种活法，你选了不下场的那种。";
    }
    const sum = C._util.founderSummary ? C._util.founderSummary(s) : "";
    return `<div class="dead-verdict founder-verdict">🚀 创业人生：${body}${sum ? `<br><span style="color:var(--dim)">你这一生攒下的底牌：${sum}</span>` : ""}</div>`;
  }
  function renderDead() {
    const title = s.endingTitle || (C._util.pickEnding ? C._util.pickEnding(s) : (C.titles.find(t => { try { return t.cond(s); } catch (e) { return false; } }) || C.titles[C.titles.length - 1]).name);
    const w = netWorth(s);
    let _lastTlAge = null;
    const tl = s.timeline.map(t => {
      const head = t.age !== _lastTlAge; _lastTlAge = t.age;
      const yr = s.birthYear + t.age;
      return `<div class="tl${head ? " tl-head" : ""}"><span class="tl-age">${head ? `${t.age}岁 · ${yr}年` : ""}</span> ${t.text}</div>`;
    }).join("");
    app().innerHTML = `<div class="screen dead">
      <div class="dead-head">— ${s.birthYear} — ${s.year} —</div>
      <div class="dead-hero" style="${C.images.styleBg("dead", 900)}"><span class="scene-cap">${s.playerName || "无名之人"} · ${s.cohortName} · 享年 ${s.age} 岁</span></div>
      <div class="dead-title">${title}</div>
      <div class="dead-cause">${s.ending || "走完了这一生。"}</div>
      ${s.goal ? `<div class="dead-verdict">🎯 人生目标【${(C._util.goalById(s.goal)||{}).name||""}】：${s._goalDone ? "已达成 ✅" : "未竟"}<br>${C._util.ancestorVerdict(s)}${(C._util.destinyReckon && C._util.destinyReckon(s)) ? `<br><br>📖 ${C._util.destinyReckon(s)}` : ""}</div>` : ""}
      ${(C._util.mainArcOf && C._util.mainArcOf(s) && C._util.mainArcReckon) ? `<div class="dead-verdict arc-verdict">📖 核心剧本【${C._util.mainArcOf(s).name}】：${C._util.mainArcReckon(s)}</div>` : ""}
      ${founderRecapHTML()}
      ${lifeEchoesHTML()}
      <div class="scorecard">
        <div class="sc"><small>终身身价</small><b>¥${w.toLocaleString()}</b></div>
        <div class="sc"><small>享年</small><b>${s.age} 岁</b></div>
        <div class="sc"><small>心情</small><b>${Math.round(s.mood)}/100</b></div>
        <div class="sc"><small>出身</small><b>${s.cohortName}</b></div>
        <div class="sc"><small>阶级</small><b>${C.CLASS_NAMES[classTier(s)]}</b></div>
        <div class="sc"><small>籍贯</small><b>${s.birthplace ? s.birthplace.provinceName : "—"}</b></div>
      </div>
      ${(s.eraLog && s.eraLog.length) ? `<div class="eralog"><div class="eralog-h">🌍 你活过的时代 · 亲历 ${s.eraLog.length} 件大事</div>${s.eraLog.map(e => `<span class="era-chip">${e.age}岁 · ${e.title}</span>`).join("")}</div>` : ""}
      ${(s._freshAch && s._freshAch.length) ? `<div class="ach-unlock"><div class="ach-unlock-h">🏅 本局解锁 ${s._freshAch.length} 个新成就</div>${s._freshAch.map(a => `<span class="ach-chip">${a.emoji} ${a.name}</span>`).join("")}</div>` : ""}
      <div class="tl-h">人生回顾</div><div class="timeline">${tl}</div>
      <div class="dead-btns"><button class="btn primary" id="again">再投一次胎 ↻</button>${(s.children || []).some(c => (s.year - (c.birthYear || s.year)) >= 18) ? `<button class="btn" id="heirplay">从孩子成年开始</button>` : ""}<button class="btn" id="togallery">🏅 图鉴</button></div></div>`;
    document.getElementById("again").onclick = () => { s = null; draft = null; screen = "title"; weekLog = []; render(); };
    const hp = document.getElementById("heirplay"); if (hp) hp.onclick = () => { screen = "legacykids"; render(); };
    document.getElementById("togallery").onclick = () => { screen = "gallery"; render(); };
  }

  /* ============================ 顶部导航 + 商城 + 社交圈 ============================ */
  function navBar(cur) {
    // 理财→已并入手机/电脑；社交圈→已并入绿泡泡/通讯录，故不再单列导航
    const tabs = [["play", "🎮 人生"], ["shop", "🛒 消费"], ["phone", "📱 手机"]];
    if (hasComputer()) tabs.push(["pc", "💻 电脑"]);
    return `<div class="nav">${tabs.map(([k, t]) => `<button class="navbtn ${cur === k ? "on" : ""}" data-nav="${k}">${t}</button>`).join("")}<button class="navbtn" id="reincarnate" title="放弃这一生，回到投胎页重开" style="margin-left:auto;border-color:rgba(255,107,107,.5);color:var(--red)">🔄 重开</button></div>`;
  }
  // 放弃当前这一生，回到标题页重新投胎（已解锁成就/图鉴在 localStorage，不受影响）
  function restartLife() {
    s = null; draft = null; weekLog = [];
    pendingEvent = null; eventNode = null;
    screen = "title"; render();
  }
  function bindNav() {
    document.querySelectorAll(".navbtn").forEach(b => b.onclick = () => {
      if (b.id === "reincarnate") return;   // 重开按钮单独处理（带确认）
      const k = b.dataset.nav; weekLog = []; s._buyMsg = null; s._mktMsg = null; s._castMsg = null;
      s._pendingAct = null;             // 切换到别的页 = 放弃当前挂起的换城市/找乐子，不计时间
      if (k === "phone") { phoneApp = "home"; phoneWx = { tab: "chats", peer: null }; phoneBoss = { job: null }; phoneSms = { open: null }; s._phoneMsg = null; }   // 每次点开手机都回到主屏
      if (k === "pc") { pcApp = "home"; phoneWx = { tab: "chats", peer: null }; s._phoneMsg = null; }          // 每次打开电脑都回到桌面
      screen = k;
      render();
    });
    const rb = document.getElementById("reincarnate");
    if (rb) rb.onclick = () => { if (window.confirm("确定放弃这一生、重新投胎吗？\n当前这局进度会清空（已解锁的成就/图鉴会保留）。")) restartLife(); };
  }

  // 购买消费品：扣钱、转资产、改心情/健康/声誉、社交圈联动
  function buy(item) {
    if (s.cash < item.price) return;
    // 🏦 银行授信：分期/贷款类消费(买房买车)要过征信关——背景差/征信污点 → 拒贷
    if (item.kind === "分期负债" && C._util.socialAccess) {
      const credit = C._util.socialAccess(s, "bank_credit");
      const badCredit = C._util.profileHas && C._util.profileHas(s, "stigma", "bad_credit");
      if (badCredit || credit < 28) {
        s._buyMsg = `🏦 银行查了你的征信和流水，婉拒了「${item.name}」的贷款申请——${badCredit ? "征信有污点" : "资质暂时不够"}，这道门眼下对你关着。`;
        return;
      }
    }
    add(s, "cash", -item.price);
    if (item.assetRate) add(s, "assets", Math.round(item.price * item.assetRate));
    if (item.mood) add(s, "mood", item.mood);
    if (item.health) add(s, "health", item.health);
    if (item.reputation) add(s, "reputation", item.reputation);
    if (item.network) add(s, "network", item.network);                 // 消费带来的人脉增益（独立于六维 stats）
    if (item.stats) for (const k in item.stats) add(s, k, item.stats[k]);
    if (item.flag) flag(s, item.flag);
    C._util.socialShift(s, item.social || 0);             // 大多数人高看你，清高者反感
    if (item.custom) try { item.custom(s); } catch (e) { }
    if (!item.repeatable) flag(s, "bought_" + item.id); tickMs(); // buy 后检测里程碑
    s.timeline.push({ age: s.age, text: `买了「${item.name}」（¥${item.price.toLocaleString()}）。` });
    s._buyMsg = `🛒 你拿下了「${item.name}」。${(item.social || 0) >= 6 ? "消息很快传开，圈子里看你的眼神都不一样了——大多数人热络了几分，也有人撇了撇嘴。" : "钱花出去，心情好了不少。"}`;
  }
  // 消费品分组（可复用：消费大屏 / 电脑网购）
  function shopGroupsHTML() {
    const owned = id => has(s, "bought_" + id);
    const kinds = [...new Set(C.consumption.map(i => i.kind))];
    return kinds.map(kd => {
      const items = C.consumption.filter(i => i.kind === kd).map(it => {
        const can = s.cash >= it.price; const got = owned(it.id);
        return `<div class="shopcard ${got ? "got" : (can ? "" : "poor")}">
          <div class="shop-emoji">${it.emoji}</div>
          <div class="shop-mid"><div class="shop-name">${it.name} ${"⭐".repeat(Math.min(5, Math.round((it.social || 0) / 3)))}</div>
            <div class="shop-desc">${it.desc}</div></div>
          <div class="shop-buy"><div class="shop-price">¥${it.price.toLocaleString()}</div>
            <button class="btn buybtn" data-buy="${it.id}" ${got || !can ? "disabled" : ""}>${got ? "已拥有" : (can ? "购买" : "钱不够")}</button></div>
        </div>`;
      }).join("");
      return `<div class="shop-kind">「${kd}」</div>${items}`;
    }).join("");
  }
  function renderShop() {
    const groups = shopGroupsHTML();
    const msg = s._buyMsg ? `<div class="logbox"><div class="log">${s._buyMsg}</div></div>` : "";
    app().innerHTML = `<div class="screen">${navBar("shop")}
      <div class="play-cols">
        <section class="play-main">
          <h2 style="margin-top:0">🛒 消费 · 花钱买生活</h2>
          <p class="sub">钱花出去也有意义：多数物件能<b style="color:var(--amber)">永久提升某些维度</b>，还会改变社交圈对你的态度——多数人锦上添花，极少数人嗤之以鼻。</p>${msg}
          <div class="shop">${groups}</div>
        </section>
        <aside class="play-side">${dashboard()}
          <div class="scene-hero" style="${C.images.styleBg("shop_default", 1200)}"><span class="scene-cap">消费 · 花钱买生活</span></div>
        </aside>
      </div></div>`;
    bindNav();
    document.querySelectorAll(".buybtn").forEach(b => b.onclick = () => { const it = C.consumption.find(x => x.id === b.dataset.buy); if (it) { buy(it); render(); } });
  }
  // 股票交易（买/卖 n 股），刷新提示
  function tradeStock(id, shares) {
    const st = C._util.stockById(id); if (!st) return;
    const price = s.market.prices[id];
    if (shares > 0) {
      const ok = C._util.buyStock(s, id, shares);
      s._mktMsg = ok ? `📈 买入 ${st.name} ${shares} 股，花费 ¥${Math.round(price * shares).toLocaleString()}。` : `💸 现金不够，买不了这么多 ${st.name}。`;
    } else {
      const have = s.market.hold[id] || 0; const n = Math.min(-shares, have);
      if (n <= 0) { s._mktMsg = `你手里没有 ${st.name}。`; return; }
      C._util.sellStock(s, id, n);
      s._mktMsg = `📉 卖出 ${st.name} ${n} 股，到手 ¥${Math.round(price * n).toLocaleString()}。`;
    }
    tickMs();
  }
  // 把一组 OHLC 行情渲染成内嵌 SVG：mode="candle" 蜡烛图 / "line" 折线图，均叠加 MA 均线。
  // range=显示窗口周数(0=全部)；周线，长期累积随游戏生长。
  function klineSVG(candles, range, mode) {
    if (!candles || candles.length < 2) return `<div class="kline-empty">暂无行情数据</div>`;
    const line = mode === "line";
    const data = (range && range > 0) ? candles.slice(-range) : candles.slice();
    const W = 560, H = 132, padX = 4, padT = 6, padB = 6;
    let lo = Infinity, hi = -Infinity;
    for (const k of data) {
      // 折线图只看收盘价，量程更贴合走势；蜡烛图取最高/最低含影线
      if (line) { if (k.c < lo) lo = k.c; if (k.c > hi) hi = k.c; }
      else { if (k.l < lo) lo = k.l; if (k.h > hi) hi = k.h; }
    }
    if (!(hi > lo)) { hi = lo + 1; }
    const span = hi - lo || 1;
    const n = data.length, slot = (W - padX * 2) / n;
    const bw = Math.max(0.8, Math.min(10, slot * 0.64));
    const sw = slot < 3 ? 0.6 : 1;                            // 影线宽度随密度收细
    const Y = v => padT + (H - padT - padB) * (1 - (v - lo) / span);
    const cx = i => padX + slot * (i + 0.5);
    // 网格线（4 档水平参考）
    let grid = "";
    for (let g = 0; g <= 4; g++) { const y = padT + (H - padT - padB) * g / 4; grid += `<line x1="0" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="0.5" opacity="0.5"/>`; }
    let series;
    if (line) {
      // 折线图：逐段着色——这一段比上一段高就绿、低就红；面积填充保持淡中性灰
      const pts = data.map((k, i) => `${cx(i).toFixed(1)},${Y(k.c).toFixed(1)}`);
      const base = (H - padB).toFixed(1);
      const area = `<polygon points="${cx(0).toFixed(1)},${base} ${pts.join(" ")} ${cx(n - 1).toFixed(1)},${base}" fill="var(--dim)" opacity="0.06"/>`;
      let segLines = "";
      for (let i = 1; i < n; i++) {
        const up = data[i].c >= data[i - 1].c;
        const col = up ? "var(--green)" : "var(--red)";
        segLines += `<line x1="${cx(i - 1).toFixed(1)}" y1="${Y(data[i - 1].c).toFixed(1)}" x2="${cx(i).toFixed(1)}" y2="${Y(data[i].c).toFixed(1)}" stroke="${col}" stroke-width="1.4" stroke-linecap="round"/>`;
      }
      series = `${area}${segLines}`;
    } else {
      series = data.map((k, i) => {
        const x = cx(i);
        const rise = k.c >= k.o;
        const col = rise ? "var(--green)" : "var(--red)";
        const yo = Y(k.o), yc = Y(k.c);
        const top = Math.min(yo, yc), bh = Math.max(0.8, Math.abs(yc - yo));
        return `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${Y(k.h).toFixed(1)}" y2="${Y(k.l).toFixed(1)}" stroke="${col}" stroke-width="${sw}"/>`
          + `<rect x="${(x - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${col}"/>`;
      }).join("");
    }
    // MA 均线只在蜡烛图叠加；折线图保持「纯收盘价」单线（折点硬连、不平滑），
    // 避免折线和均线两条平滑曲线同时出现而被误解。
    let ma = "";
    if (!line) {
      const maWin = Math.max(3, Math.min(12, Math.round(n / 8)));
      const pts = [];
      for (let i = maWin - 1; i < n; i++) {
        let sum = 0; for (let j = i - maWin + 1; j <= i; j++) sum += data[j].c;
        pts.push(`${cx(i).toFixed(1)},${Y(sum / maWin).toFixed(1)}`);
      }
      ma = pts.length > 1 ? `<polyline points="${pts.join(" ")}" fill="none" stroke="var(--amber)" stroke-width="1.1" opacity="0.85"/>` : "";
    }
    return `<svg class="kline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${line ? "折线走势" : "K线走势"}">${grid}${series}${ma}</svg>`;
  }
  // 板块催化 → 标的徽标（新闻联动的可视化）
  function catalystBadge(sector) {
    const cat = C._util.sectorCatalyst ? C._util.sectorCatalyst(s, sector) : null;
    if (!cat) return "";
    if (cat.early) return '<span class="mkt-cat early">🌱 苗头</span>';
    if (cat.dir < 0) return '<span class="mkt-cat bear">⚠️ 降温</span>';
    return '<span class="mkt-cat bull">📈 消息</span>';
  }
  // 行情面板（可复用：理财大屏 / 手机理财 app / 电脑交易台）。big=大屏布局（更宽 K 线）
  function marketPanelHTML(big) {
    const m = s.market;
    const portVal = C._util.stockValue(s);
    const longest = Math.max.apply(null, C.stocks.map(st => (C._util.stockCandles(s, st.id) || []).length).concat([0]));
    const cards = C.stocks.map(st => {
      const price = m.prices[st.id]; const chg = C._util.stockChange(s, st.id);
      const hold = m.hold[st.id] || 0; const hv = Math.round(hold * price);
      const cls = chg > 0.05 ? "up" : chg < -0.05 ? "down" : "flat";
      const arrow = chg > 0.05 ? "▲" : chg < -0.05 ? "▼" : "■";
      const canBuy1 = s.cash >= price; const canBuy10 = s.cash >= price * 10;
      const canBuy100 = s.cash >= price * 100;
      const tag = st.kind === "safe" ? "避险" : st.kind === "index" ? "指数" : st.kind === "crypto" ? "加密" : st.sector;
      const candles = C._util.stockCandles(s, st.id);
      const shown = mktRange > 0 ? Math.min(mktRange, candles.length) : candles.length;
      const hot = st.sector && st.sector === s.eraWind;
      const badge = catalystBadge(st.sector);
      return `<div class="mkt-card ${hold > 0 ? "held" : ""}">
        <div class="mkt-head">
          <div class="mkt-id"><span class="mkt-emoji">${st.emoji}</span><div><b>${st.name}${hot ? ' <span class="mkt-hot">🔥风口</span>' : ""}${badge}</b><small>${tag}</small></div></div>
          <div class="mkt-px"><b>¥${price.toFixed(2)}</b><span class="mkt-chg ${cls}">${arrow} ${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%</span></div>
          <div class="mkt-hold">${hold > 0 ? `持 ${hold} 股<small>¥${hv.toLocaleString()}</small>` : `<span class="mkt-none">未持有</span>`}</div>
          <div class="mkt-act">
            <button class="btn mbtn" data-buy="${st.id}" data-n="1" ${canBuy1 ? "" : "disabled"}>买1</button>
            <button class="btn mbtn" data-buy="${st.id}" data-n="10" ${canBuy10 ? "" : "disabled"}>买10</button>
            ${big ? `<button class="btn mbtn" data-buy="${st.id}" data-n="100" ${canBuy100 ? "" : "disabled"}>买100</button>` : ""}
            <button class="btn mbtn sell" data-buy="${st.id}" data-n="-1" ${hold > 0 ? "" : "disabled"}>卖1</button>
            <button class="btn mbtn sell" data-buy="${st.id}" data-n="-9999" ${hold > 0 ? "" : "disabled"}>清仓</button>
          </div>
        </div>
        <div class="mkt-chart">${klineSVG(candles, mktRange, mktChartType)}<span class="kline-meta">周线 · 近 ${shown} 周${badge ? " · 📰 有催化" : ""}</span></div>
      </div>`;
    }).join("");
    const nlog = (m.newsLog || []).filter(x => C._util.stocksBySector(x.sector).length);
    const digest = nlog.length ? nlog.map(x => {
      const stk = C._util.stocksBySector(x.sector)[0];
      const dirTxt = x.early ? '<i class="nd-omen">🌱 苗头·下一轮风向</i>' : x.dir < 0 ? '<i class="nd-bear">⚠️ 利空降温</i>' : '<i class="nd-bull">📈 利好</i>';
      return `<div class="nd-row"><span class="nd-sec">${stk ? stk.emoji : "📰"} ${x.sector}</span>${dirTxt}<span class="nd-line">「${x.headline}」<small> · ${x.source}</small></span></div>`;
    }).join("") : `<div class="nd-empty">最近没什么值得盘的消息。多读读新闻——读懂正在发酵的赛道，下周开盘往往就有反应。</div>`;
    const ranges = [[26, "近半年"], [52, "近1年"], [156, "近3年"], [0, "全部"]];
    const rangeBtns = ranges.map(r => `<button class="rgbtn ${mktRange === r[0] ? "on" : ""}" data-rg="${r[0]}">${r[1]}</button>`).join("");
    const typeBtn = `<button class="rgbtn typebtn" id="charttype">${mktChartType === "candle" ? "📉 切折线图" : "🕯️ 切蜡烛图"}</button>`;
    const msg = s._mktMsg ? `<div class="logbox"><div class="log">${s._mktMsg}</div></div>` : "";
    return `<div class="mkt-sum">
        <div class="ms"><small>持仓市值</small><b>¥${portVal.toLocaleString()}</b></div>
        <div class="ms"><small>累计投入</small><b>¥${Math.round(m.invested || 0).toLocaleString()}</b></div>
        <div class="ms"><small>浮动盈亏</small><b style="color:${portVal - (m.invested || 0) >= 0 ? "var(--green)" : "var(--red)"}">${portVal - (m.invested || 0) >= 0 ? "+" : ""}¥${Math.round(portVal - (m.invested || 0)).toLocaleString()}</b></div>
      </div>
      <div class="mkt-news"><div class="mkt-news-h">📰 基本面风向 · 新闻 → 下周盘面</div>${digest}</div>${msg}
      <div class="mkt-toolbar"><span class="mkt-range-l">区间</span>${rangeBtns}${typeBtn}<span class="mkt-range-r">已积累 ${longest} 周行情</span></div>
      <div class="mkt-list ${big ? "mkt-list-big" : ""}">${cards}</div>`;
  }
  // 行情交互绑定（买卖/区间/图表切换）——理财大屏 / 手机 / 电脑共用
  function bindMarket() {
    document.querySelectorAll(".mbtn[data-buy]").forEach(b => b.onclick = () => { tradeStock(b.dataset.buy, parseInt(b.dataset.n, 10)); render(); });
    document.querySelectorAll(".rgbtn[data-rg]").forEach(b => b.onclick = () => { mktRange = parseInt(b.dataset.rg, 10); render(); });
    const ct = document.getElementById("charttype"); if (ct) ct.onclick = () => { mktChartType = mktChartType === "candle" ? "line" : "candle"; render(); };
  }
  function renderMarket() {
    app().innerHTML = `<div class="screen">${navBar("market")}
      <div class="play-cols">
        <section class="play-main">
          <h2 style="margin-top:0">📈 理财 · 股票账户</h2>
          <p class="sub">周线 K 线随人生<b style="color:var(--amber)">逐周生长</b>。价格随时代景气与风口波动，<b style="color:var(--amber)">更跟着基本面新闻走</b>：新闻里反复念叨的赛道，一般<b style="color:var(--amber)">到下一周开盘就兑现对应涨跌</b>。读懂正在发酵、甚至刚冒苗头的赛道，先人一步埋伏——但热度见顶时别当最后接盘的人。持仓市值并入你的身价。</p>
          ${marketPanelHTML(false)}
        </section>
        <aside class="play-side">${dashboard()}
          ${industryBoardHTML()}
          <div class="scene-hero" style="${C.images.styleBg("market", 1200)}"><span class="scene-cap">理财 · 在 K 线里押注时代</span></div>
        </aside>
      </div></div>`;
    bindNav();
    bindMarket();
  }
  // 关键角色(cast)区：把主线里的固定角色摆进社交圈，带信任/压力/危机，危机可一键回应
  const CAST_CRISIS_LABEL = { debt: "陷入债务，向你求助", illness: "家中有人病了", startup_invite: "想拉你合伙创业", layoff: "刚被裁，正失落", reunite: "想和你复合" };
  function castSectionHTML() {
    const arr = s.cast ? Object.keys(s.cast).map(k => s.cast[k]).filter(c => c && c.name && c.role) : [];
    if (!arr.length) return "";
    const cards = arr.map(c => {
      const trust = Math.round(c.trust || 50);
      const col = trust >= 65 ? "good" : trust >= 40 ? "mid" : "bad";
      const crisis = c.crisis ? `<div class="cast-crisis">⚠️ ${CAST_CRISIS_LABEL[c.crisis] || "有事找你"}<button class="cast-respond" data-castev="${c.crisis}">回应 →</button></div>` : "";
      const visited = s._castVisit && s._castVisit[c.id] === s.week;
      const visitBtn = `<button class="cast-visit ${visited ? "off" : ""}" data-castvisit="${c.id}" ${visited ? "disabled" : ""}>${visited ? "本周已走动" : "🤝 走动联络"}</button>`;
      return `<div class="npc cast-npc"><div class="npc-top"><span class="npc-name">🎭 ${c.name}</span><span class="npc-role">${c.role}${c.industry && C._util.INDUSTRIES && C._util.INDUSTRIES[c.industry] ? " · " + C._util.INDUSTRIES[c.industry].name : ""}</span></div>
        <div class="npc-bar"><i class="att-${col}" style="width:${trust}%"></i></div>
        <div class="npc-att">信任 ${trust}/100${c.pressure ? ` · 压力 ${Math.round(c.pressure)}` : ""}</div>${crisis}<div class="cast-acts">${visitBtn}</div></div>`;
    }).join("");
    const msg = s._castMsg ? `<div class="npc-result">${s._castMsg}</div>` : "";
    return `<div class="social-tier cast-tier"><div class="st-head">🎭 关键角色 · 你人生剧本里的人 <span class="st-cnt">${arr.length}人</span></div>
      <div class="st-hint">他们不只是人脉，更是这段人生的固定角色——会随这个世界的起落，有自己的际遇，也会反过来找上你。平时多走动，关键时才靠得住。</div>
      ${msg}<div class="npclist">${cards}</div></div>`;
  }
  // 行业风向板：把后台的 8 行业冷热/监管摆给玩家看，动态世界从此可见
  function industryBoardHTML() {
    if (!s.world || !s.world.industries) return "";
    const inds = s.world.industries; const base = C._util.INDUSTRIES || {};
    const rows = Object.keys(inds).map(id => {
      const ind = inds[id]; const b = base[id] || ind; const heat = Math.round(ind.heat);
      const trend = ind.heat > (b.heat || 40) + 8 ? "↑热" : ind.heat < (b.heat || 40) - 8 ? "↓冷" : "—";
      const tcol = trend.indexOf("热") >= 0 ? "var(--green)" : trend.indexOf("冷") >= 0 ? "var(--red)" : "var(--dim)";
      const hcol = heat >= 60 ? "good" : heat >= 35 ? "mid" : "bad";
      return `<div class="ind-row"><span class="ind-name">${ind.name}</span><span class="ind-bar"><i class="att-${hcol}" style="width:${heat}%"></i></span><span class="ind-trend" style="color:${tcol}">${trend}</span><span class="ind-reg">${ind.regulation >= 60 ? "🛡" : ""}</span></div>`;
    }).join("");
    return `<div class="ind-board"><div class="ind-board-h">🌐 行业风向</div>${rows}<div class="ind-tip">热度高=机会多但人才贵；🛡=监管重、阻力大。求职/创业/投资都受它牵动。</div></div>`;
  }
  function renderSocial() {
    const KIND = { 势利: "见钱眼开，你风光时最热络、落魄时跑最快", 清高: "看不起炫耀，你越显摆 ta 越疏远你", 仗义: "重情义不重钱，雪中送炭型", 亲情: "血浓于水，基本无条件", 普通: "随大流，轻度受你境况影响" };
    const budgetLeft = C._util.socialWeekLeft ? C._util.socialWeekLeft(s) : 3;
    const budgetCap = C._util.socialWeekCap ? C._util.socialWeekCap(s) : 3;
    const relTagOf = (n) => (C._util.relTag ? C._util.relTag(s, n) : null);
    const npcCard = (n) => {
      const idx = s.social.indexOf(n);
      const rt = relTagOf(n);
      const sel = s._npcSel === idx;
      const col = n.attitude >= 70 ? "good" : n.attitude >= 40 ? "mid" : "bad";
      const face = n.attitude >= 70 ? "😊" : n.attitude >= 40 ? "🙂" : "😒";
      const p = n.persona;
      const personaRow = p ? `<div class="npc-persona">${p.emoji || "🎭"} <b>${p.name}</b> · ${p.desc} <span class="npc-quirk">${p.quirk || ""}</span></div>` : "";
      const locRow = n.homeCity ? `<div class="npc-loc">📍 ${n.homeCity} · ${n.residence || "未知"} · ${n.meetable ? "可约见" : "远程联系"}</div>` : "";
      let panel = "";
      if (sel) {
        const acts = (C._util.npcActions ? C._util.npcActions(s, n) : []);
        const noBudget = budgetLeft <= 0;
        const btns = acts.map(a => {
          const disabled = a.dis || noBudget;
          const tip = a.dis ? a.why : (noBudget ? "本周走动次数用完了" : a.hint);
          return `<button class="npc-act-btn ${disabled ? "off" : ""}" data-npcact="${a.id}" data-npc="${idx}" ${disabled ? "disabled" : ""} title="${tip}">${a.emoji} ${a.label}${a.cost ? ` <small>¥${a.cost.toLocaleString()}</small>` : ""}<span class="na-hint">${tip}</span></button>`;
        }).join("");
        const msg = s._npcMsg && s._npcMsgFor === idx ? `<div class="npc-result ${s._npcMsgBad ? "bad" : ""}">${s._npcMsg}</div>` : "";
        panel = `<div class="npc-panel" data-keep="1">
          <div class="npc-panel-h">和 ${n.name} 走动一番 · 本周还能走动 <b>${budgetLeft}/${budgetCap}</b> 次</div>
          ${msg}<div class="npc-actbtns">${btns}</div></div>`;
      }
      return `<div class="npc ${sel ? "sel" : ""}" data-npc="${idx}">
        <div class="npc-top"><span class="npc-name">${face} ${n.name}</span>${rt ? `<span class="rel-tag ${rt.cls}">${rt.emoji} ${rt.label}</span>` : ""}<span class="npc-role">${n.role} · <i class="k-${n.kind}">${n.kind}</i></span></div>
        ${personaRow}
        ${locRow}
        <div class="npc-bar"><i class="att-${col}" style="width:${n.attitude}%"></i></div>
        <div class="npc-att">态度 ${n.attitude}/100 —— ${KIND[n.kind] || ""}</div>
        ${sel ? "" : `<div class="npc-tap">👆 点击主动走动（聊天 / 送礼 / 求助 / 合伙…）</div>`}
        ${panel}</div>`;
    };
    const tierMeta = [
      { t: 1, name: "💗 核心圈 · 至亲挚友", hint: "不离不弃、雪中送炭。无论你飞黄腾达还是跌落谷底，他们的态度几乎不变。" },
      { t: 2, name: "🤝 中间圈 · 好友同侪", hint: "好友、同事、同学、近亲。会因你的境况起落，但不会立刻翻脸。" },
      { t: 3, name: "🌐 外围圈 · 熟人之交", hint: "点头之交、网友、客户。最势利也最现实——你风光时蜂拥而上，你落魄时一哄而散。" }
    ];
    const tierFn = C._util.socialTier || ((st, t) => (st.social || []).filter(n => (n.tier || 3) === t));
    const avgT = C._util.socialAvgTier || (() => null);
    const sections = tierMeta.map(tm => {
      const arr = tierFn(s, tm.t); if (!arr.length) return "";
      const av = avgT(s, tm.t);
      // 圈内按【关系重要性】排序：合伙人/至亲/挚友/贵人……靠前，同级再看态度
      const sorted = arr.slice().sort((a, b) => {
        const ra = relTagOf(a), rb = relTagOf(b);
        return ((rb ? rb.rank : 0) - (ra ? ra.rank : 0)) || ((b.attitude || 0) - (a.attitude || 0));
      });
      return `<div class="social-tier"><div class="st-head">${tm.name} <span class="st-cnt">${arr.length}人${av != null ? " · 均态度 " + av : ""}</span></div>
        <div class="st-hint">${tm.hint}</div>
        <div class="npclist">${sorted.map(npcCard).join("")}</div></div>`;
    }).join("");
    const outer = s.socialOuter;
    const outerCol = outer ? (outer.attitude >= 60 ? "good" : outer.attitude >= 40 ? "mid" : "bad") : "mid";
    const outerHtml = outer ? `<div class="social-tier"><div class="st-head">🌫️ 弱连接 · 泛泛之交 <span class="st-cnt">约 ${outer.count} 人</span></div>
        <div class="st-hint">叫得出名字都难的一大片人——同行、群友、加过没聊过的好友。你得意时朋友圈点赞如潮，你失意时无人问津。</div>
        <div class="npc"><div class="npc-bar"><i class="att-${outerCol}" style="width:${Math.round(outer.attitude)}%"></i></div>
        <div class="npc-att">整体风评 ${Math.round(outer.attitude)}/100 —— 人情最薄，也最随行就市。</div></div></div>` : "";
    const reach = C._util.socialReach ? C._util.socialReach(s) : (s.social || []).length;
    app().innerHTML = `<div class="screen">${navBar("social")}
      <div class="play-cols">
        <section class="play-main">
          <h2 style="margin-top:0">👥 社交圈 · 人情冷暖</h2>
          <p class="sub">认识的人越往里越少、越往外越多。<b style="color:var(--amber)">总人脉约 ${reach} 人</b>。越亲密的越不在乎你混得好不好；越外围的，越只认你的风光。<br>👆 <b style="color:var(--amber)">点开任何一个人，主动走动</b>——聊天、送礼、请教、求人办事、借钱、拉合伙。平时多攒交情，关键时才换得来真东西。本周还能走动 <b style="color:var(--amber)">${budgetLeft}/${budgetCap}</b> 次。</p>
          ${castSectionHTML()}${sections}${outerHtml}
        </section>
        <aside class="play-side">${dashboard()}
          <div class="scene-hero" style="${C.images.styleBg("social", 1200)}"><span class="scene-cap">社交圈 · 人情冷暖</span></div>
        </aside>
      </div></div>`;
    bindNav();
    document.querySelectorAll(".npc[data-npc]").forEach(card => card.onclick = (e) => {
      if (e.target.closest(".npc-panel")) return;            // 面板内的点击不切换选中
      const idx = +card.dataset.npc;
      s._npcSel = (s._npcSel === idx) ? null : idx;
      s._npcMsg = null; render();
    });
    document.querySelectorAll(".npc-act-btn").forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const idx = +b.dataset.npc; const n = s.social[idx]; if (!n) return;
      const r = C._util.doNpcAction(s, n, b.dataset.npcact);
      s._npcMsg = r.msg; s._npcMsgFor = idx; s._npcMsgBad = !!r.bad;
      render();
    });
    document.querySelectorAll(".cast-respond").forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const id = b.dataset.castev === "startup_invite" ? "ev_cast_invite" : b.dataset.castev === "reunite" ? "ev_cast_reunite" : "ev_cast_help";
      const ev = C.events.find(x => x.id === id);
      if (ev) { try { if (!ev.cond || ev.cond(s)) { enterEvent(ev); screen = "event"; render(); return; } } catch (x) {} }
    });
    document.querySelectorAll(".cast-visit").forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const id = b.dataset.castvisit; const c = s.cast && s.cast[id]; if (!c) return;
      s._castVisit = s._castVisit || {}; if (s._castVisit[id] === s.week) return;
      s._castVisit[id] = s.week; c.trust = Math.min(100, (c.trust || 50) + 4); c.pressure = Math.max(0, (c.pressure || 30) - 3);
      s._castMsg = `你和${c.name}聊了聊近况，关系热乎了些（信任+4）。平时的走动，攒的是关键时刻的底气。`;
      render();
    });
  }

  /* ============================ 全球地图选择器 ============================ */
  function tierTag(t) { return ["", "🥇一线", "🥈二线", "🥉三线"][t] || ""; }
  function costTag(c) { return c >= 1.8 ? "极高" : c >= 1.3 ? "高" : c >= 0.9 ? "中" : c >= 0.6 ? "偏低" : "低"; }
  function oppTag(o) { return o >= 1.6 ? "极多" : o >= 1.2 ? "多" : o >= 0.9 ? "中" : "少"; }
  function markPlaceSeen(city) {   // 环游世界目标：记下去过的不同地方
    s.seenPlaces = s.seenPlaces || {}; const k = city.name || city.id;
    if (!s.seenPlaces[k]) { s.seenPlaces[k] = 1; s.placesSeen = (s.placesSeen || 0) + 1; }
  }
  function applyMapPick(city) {
    if (mapPurpose === "relocate") {
      const moveCost = Math.round(30000 * city.cost * (s.world ? s.world.priceIndex : 1));
      if (s.cash < moveCost) { s._mapMsg = "搬到 " + C._util.cityFull(city) + " 估算要 ¥" + moveCost.toLocaleString() + "（含安顿），你现在掏不出。先攒攒吧。"; render(); return; }
      add(s, "cash", -moveCost); add(s, "mood", 5); add(s, "network", -8);
      if (s.world && city.paceMod !== undefined) s.world.pace = Math.max(0, Math.min(100, s.world.pace + city.paceMod * 0.3));
      s.city = city; s.away = null; C._util.initSocial(s); markPlaceSeen(city);   // 搬家=定居地更新，且人就在新家
      if (city.country !== "cn") flag(s, "overseas"); else delete s.flags.overseas;
      s.timeline.push({ age: s.age, text: "搬去了 " + C._util.cityFull(city) + " 生活。" });
      weekLog = ["🧳 你拖着行李落脚 " + C._util.cityFull(city) + "。陌生的一切，旧人脉一夜清零，但也一切归零、皆有可能。"];
      commitPendingAct();                                  // 真的搬了，才结算「换个城市」这周的时间
      screen = "play"; render(); return;
    }
    // 旅游 → 进入「旅途」专属界面：先选天数，再一天天玩（见闻/机遇/小插曲，心情爆棚）
    s.trip = { city: city, cityName: C._util.cityFull(city), abroad: (city.country !== "cn" && city.country !== "hk"), started: false, days: 0, dayN: 0, _seen: {}, _beat: null, log: [] };
    screen = "travel"; render();   // 费用与计时在「确认天数」时才结算；planner 里退出则不计
  }
  /* ============================ 旅游：选天数 → 逐日旅途子系统 ============================ */
  function startTrip(days) {
    const t = s.trip; const TR = window.TRAVEL; if (!t || !TR) { screen = "play"; return render(); }
    const plan = TR.TRIP_PLANS.find(p => p.days === days); if (!plan) return;
    const cost = TR.tripTotalCost(s, t.city, plan);
    if (s.cash < cost) { s._tripMsg = "这趟 " + days + " 天大约要 ¥" + cost.toLocaleString() + "，钱包不答应。换短一点的吧。"; render(); return; }
    add(s, "cash", -cost); t.cost = cost; t.days = days; t.dayN = 1; t.started = true; t._beat = null;
    s.away = { name: t.cityName, id: t.city.id };
    commitPendingAct();   // 真出门了，结算「出国旅游」这周的时间
    render();
  }
  function doTripDay(actId) {
    const t = s.trip; const TR = window.TRAVEL; if (!t || t._beat) return;
    const b = TR.drawTravelBeat(s, t, actId);
    t._seen = t._seen || {}; t._seen[b.id] = true;
    add(s, "mood", b.mood || 0);
    if (b.fx) { try { b.fx(s, t); } catch (e) { } }
    const act = TR.TRAVEL_ACTS.find(a => a.id === actId);
    t._beat = { txt: b.txt || b.text, mood: b.mood || 0, chance: !!b.chance };
    t.log.push(`第${t.dayN}天 ${act ? act.emoji : ""} ${(b.text || "").slice(0, 20)}…`);
    render();
  }
  function tripAdvance() {
    const t = s.trip; if (!t) return;
    t._beat = null; t.dayN++;
    if (t.dayN > t.days) return finishTrip();
    render();
  }
  function finishTrip() {
    const t = s.trip; if (!t) { screen = "play"; return render(); }
    const bonus = Math.min(38, Math.round(8 + t.days * 1.6));
    add(s, "mood", bonus); add(s, "stress", -Math.min(45, 12 + t.days)); add(s, "insight", 1); add(s, "health", 1);
    C._util.socialShift(s, 1); flag(s, "traveled"); markPlaceSeen(t.city);
    s.timeline.push({ age: s.age, text: `去 ${t.cityName} 旅居了 ${t.days} 天，整个人被治愈了一遍。` });
    weekLog = [`🧳 ${t.days} 天的「${t.cityName}」之旅结束，你心满意足地回了家——心情拉满、压力清零，相册里多了一堆故事。`];
    s.trip = null; screen = "play"; render();
  }
  function renderTravel() {
    const t = s.trip; const TR = window.TRAVEL;
    if (!t || !TR) { screen = "play"; return renderPlay(); }
    const hero = `<div class="scene-hero" style="${C.images.styleBg("map", 1200)}"><span class="scene-cap">🧳 旅途 · ${t.cityName}</span></div>`;
    if (!t.started) {
      const msg = s._tripMsg ? `<div class="logbox"><div class="log">⚠️ ${s._tripMsg}</div></div>` : ""; s._tripMsg = null;
      const plans = TR.TRIP_PLANS.map(p => {
        const cost = TR.tripTotalCost(s, t.city, p); const can = s.cash >= cost;
        return `<button class="btn" data-days="${p.days}" ${can ? "" : "disabled"} style="display:block;width:100%;text-align:left;margin:0 0 10px;${can ? "" : "opacity:.45;cursor:not-allowed"}"><b>${p.name} · ${p.days} 天</b>　<span style="font-size:12px;color:var(--dim)">${p.blurb}</span><br><span style="font-size:12px;color:var(--amber2)">预算 ≈ ¥${cost.toLocaleString()}</span>${can ? "" : ` <span style="font-size:12px;color:var(--red)">· 钱不够</span>`}</button>`;
      }).join("");
      app().innerHTML = `<div class="screen">${hero}
        <h2 style="margin-top:8px">🧳 去「${t.cityName}」玩几天？</h2>
        <p class="sub">旅行最大的好处是让<b style="color:var(--amber)">心情爆棚</b>——天数越多，见闻越多、机遇越多，花销也越大。选了几天，就玩几天。</p>${msg}
        <div>${plans}</div>
        <button class="btn" id="tripcancel" style="margin-top:6px">← 不去了，回去生活</button></div>`;
      document.querySelectorAll("[data-days]").forEach(b => b.onclick = () => { if (!b.disabled) startTrip(+b.dataset.days); });
      document.getElementById("tripcancel").onclick = () => { clearPendingAct(); s.trip = null; screen = "play"; render(); };
      return;
    }
    const beat = t._beat;
    const logHtml = t.log.length ? `<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:10px 0;font-size:12px;color:var(--dim);line-height:1.7;max-height:130px;overflow:auto">${t.log.slice(-6).map(l => `<div>${l}</div>`).join("")}</div>` : "";
    let body;
    if (!beat) {
      const acts = TR.TRAVEL_ACTS.map(a => `<button class="btn" data-act="${a.id}" style="display:block;width:100%;text-align:left;margin:0 0 8px">${a.emoji} ${a.label}</button>`).join("");
      body = `<div style="font-size:15px;font-weight:700;margin:8px 0 10px">📅 第 ${t.dayN} / ${t.days} 天 —— 今天想怎么过？</div>${acts}`;
    } else {
      body = `<div style="font-size:15px;line-height:1.85;background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:12px;padding:14px 16px;margin:8px 0 12px">${beat.txt}</div>
        <div style="font-size:13px;color:var(--green);margin-bottom:12px">🙂 心情 +${beat.mood}${beat.chance ? `　<span style="color:var(--amber2);font-weight:700">✨ 旅途机遇！</span>` : ""}</div>
        <button class="btn primary" id="tripnext">${t.dayN >= t.days ? "🏡 结束旅程，心满意足回家 →" : `继续旅程 · 第 ${t.dayN + 1} 天 →`}</button>`;
    }
    app().innerHTML = `<div class="screen">${hero}
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--dim);margin:6px 0">📅 第 <b style="color:var(--amber2)">${t.dayN}</b> / ${t.days} 天 · ${t.cityName}<span>🙂 心情 <b style="color:var(--amber)">${Math.round(s.mood)}</b>　😣 压力 ${Math.round(s.stress)}</span></div>
      ${logHtml}<div>${body}</div></div>`;
    document.querySelectorAll("[data-act]").forEach(b => b.onclick = () => doTripDay(b.dataset.act));
    const nx = document.getElementById("tripnext"); if (nx) nx.onclick = () => tripAdvance();
  }
  function renderMap() {
    const title = mapPurpose === "relocate" ? "🧳 搬到哪座城市？" : "🗺️ 去哪里旅行？";
    const regions = [...new Set(C.countries.map(c => c.region))];
    let body;
    if (!mapCountry) {
      body = regions.map(rg => '<div class="map-region">' + rg + '</div><div class="map-countries">' + C.countries.filter(c => c.region === rg).map(c => '<button class="mapc" data-co="' + c.id + '">' + c.flag + ' ' + c.name + '</button>').join("") + '</div>').join("");
    } else {
      const co = C._util.countryById(mapCountry);
      const cs = C._util.citiesOf(mapCountry).slice().sort((a, b) => a.tier - b.tier);
      body = '<button class="btn" id="mapback" style="margin:0 0 12px">← 返回选国家</button><div class="map-cohead">' + co.flag + ' ' + co.name + ' 的城市</div><div class="citylist">' + cs.map(c => '<div class="citycard ' + (s.city && s.city.id === c.id ? "here" : "") + '"><div class="city-mid"><div class="city-name">' + tierTag(c.tier) + ' ' + c.name + '</div><div class="city-meta">花销 <b>' + costTag(c.cost) + '</b>　机会 <b>' + oppTag(c.opp) + '</b>　房价 ' + costTag(c.house) + '</div></div><button class="btn buybtn city-pick" data-city="' + c.id + '" ' + (s.city && s.city.id === c.id ? "disabled" : "") + '>' + (s.city && s.city.id === c.id ? "在这" : "选择") + '</button></div>').join("") + '</div>';
    }
    const msg = s._mapMsg ? '<div class="logbox"><div class="log">⚠️ ' + s._mapMsg + '</div></div>' : "";
    app().innerHTML = '<div class="screen">' + navBar("play") + '<div class="scene-hero" style="' + C.images.styleBg("map", 1200) + '"><span class="scene-cap">' + (mapPurpose === "relocate" ? "搬迁 · 换座城市重新开局" : "旅行 · 去看不一样的风景") + '</span></div><h2 style="margin-top:8px">' + title + '</h2><p class="sub">当前在 <b style="color:var(--amber)">' + (s.city ? C._util.cityFull(s.city) : "—") + '</b>。城市分一/二/三线，花销与机会各不相同。</p>' + msg + '<div class="worldmap">' + body + '</div><button class="btn" id="mapclose" style="margin-top:16px">' + (mapPurpose === "relocate" ? "再想想，先不搬" : "不去了，继续生活") + ' →</button></div>';
    bindNav(); s._mapMsg = null;
    document.querySelectorAll(".mapc").forEach(b => b.onclick = () => { mapCountry = b.dataset.co; render(); });
    const back = document.getElementById("mapback"); if (back) back.onclick = () => { mapCountry = null; render(); };
    document.querySelectorAll(".city-pick").forEach(b => b.onclick = () => { const c = C._util.cityById(b.dataset.city); if (c) applyMapPick(c); });
    document.getElementById("mapclose").onclick = () => { clearPendingAct(); screen = "play"; render(); };
  }

  // —— 人生目标 / 里程碑 ——
  function goalBarHTML() {
    if (!s.goal) return "";
    const g = C._util.goalById(s.goal); if (!g) return "";
    const pct = C._util.goalProgress(s);
    if (window.MVP_00_CAREER) return `<div class="goal-row mvp-goal-row"><span class="goal-lbl">00后职场沉浮</span><span class="goal-bar"><i style="width:${pct}%"></i></span><span class="goal-pct">${pct}%</span><span class="ms-cnt">第${Math.floor(s.week / 4) + 1}月</span></div>`;
    const ds = C._util.destinyStatus ? C._util.destinyStatus(s) : null;
    const dstChip = (ds && !ds.finished && ds.act) ? `<span class="dst-chip" title="${ds.motif}">📖 命运·${ds.act} ${ds.idx}/${ds.total}</span>`
                  : (ds && ds.finished) ? `<span class="dst-chip dst-done">📖 命运已写就 ${ds.total}/${ds.total}</span>` : "";
    return `<div class="goal-row"><span class="goal-lbl">🎯 ${g.emoji}${g.name}${s._goalDone ? " ✅" : ""}</span><span class="goal-bar"><i style="width:${pct}%"></i></span><span class="goal-pct">${pct}%</span><span class="ms-cnt">🏆 ${(s.milestones || []).length}</span>${dstChip}</div>`;
  }
  function tickMs() {
    const fresh = C._util.checkMilestones(s);
    fresh.forEach(m => { weekLog.push("🏆 解锁里程碑：" + m.emoji + " " + m.name); s.timeline.push({ age: s.age, text: "🏆 " + m.name }); });
    // ★路线任务推进★：完成当前引导任务 → 播报 + 推进到下一个（解锁新行动）
    if (C._util.tickQuests) {
      const fq = C._util.tickQuests(s);
      fq.forEach(q => { weekLog.push("✅ 任务完成：" + q.title + "！"); s.timeline.push({ age: s.age, text: "✅ " + q.title }); add(s, "mood", 4); });
      if (fq.length && C._util.currentQuest) { const nx = C._util.currentQuest(s); if (nx) weekLog.push("📌 新任务：" + nx.quest.title + "——" + (nx.quest.hint || "")); }
    }
    if (!s._goalDone && C._util.goalDone(s)) { s._goalDone = true; const g = C._util.goalById(s.goal); weekLog.push("🎯 人生目标【" + (g ? g.name : "") + "】达成！这一生，你没白活。"); s.timeline.push({ age: s.age, text: "🎯 达成人生目标：" + (g ? g.name : "") }); add(s, "mood", 12); }
  }
  function renderGoalPick() {
    if (window.MVP_00_CAREER) {
      const cards = C.goals.map(g => `<div class="bgcard goalcard" data-goal="${g.id}"><div class="bg-emoji">${g.emoji}</div><div class="bg-name">${g.name} <span class="goal-path">${g.path}</span></div><div class="bg-desc">${g.desc}</div><div class="bg-start">🎯 ${g.target}</div></div>`).join("");
      app().innerHTML = `<div class="screen"><div class="scene-hero" style="${C.images.styleBg("goalpick", 1200)}"><span class="scene-cap">00 后职场沉浮</span></div><h2>先活过第一段职场</h2><p class="sub">这一版只聚焦一条主线：大三迷茫、毕业求职、第一份工作、通勤房租、试用期、职场荒诞和第一次人生分流。其它人生路线先暂时收起。</p><div class="bggrid">${cards}</div></div>`;
      document.querySelectorAll(".goalcard[data-goal]").forEach(el => el.onclick = () => {
        s.goal = el.dataset.goal;
        const g = C._util.goalById(s.goal);
        const note = C._util.applyGoalMods ? C._util.applyGoalMods(s) : "";
        s.timeline.push({ age: s.age, text: "进入主线：" + (g ? g.name : "00 后职场沉浮") });
        if (note) weekLog.push("🎯 " + note);
        screen = "play";
        render();
      });
      return;
    }
    const unl = (s && s.unlocks) || {};
    const cards = C.goals.map(g => {
      const locked = g.locked && !unl[g.locked];
      const reqTxt = locked ? `<span class="lock-req">🔒 ${(C._util.unlockById(g.locked) || {}).reqText || "尚未解锁"}</span>` : "";
      return `<div class="bgcard goalcard ${locked ? "locked" : ""}" ${locked ? "" : `data-goal="${g.id}"`}><div class="bg-emoji">${locked ? "🔒" : g.emoji}</div><div class="bg-name">${g.name} <span class="goal-path">${g.path}</span></div><div class="bg-desc">${g.desc}</div><div class="bg-start">🎯 ${g.target}</div>${reqTxt}</div>`;
    }).join("");
    app().innerHTML = `<div class="screen"><div class="scene-hero" style="${C.images.styleBg("goalpick", 1200)}"><span class="scene-cap">立志 · 你这一生图个什么</span></div><h2>你这一生，图个什么？</h2><p class="sub">选一个人生目标——它会成为你这局追逐的方向（仪表盘常驻进度条）；也决定你死时，是印证了老祖宗那句「打工是不可能打工的」，还是打了它的脸。<br>🔒 灰色目标需在图鉴里达成对应条件后跨局解锁。</p><div class="bggrid">${cards}</div></div>`;
    document.querySelectorAll(".goalcard[data-goal]").forEach(el => el.onclick = () => {
      s.goal = el.dataset.goal; const g = C._util.goalById(s.goal);
      const note = C._util.applyGoalMods ? C._util.applyGoalMods(s) : "";   // 施加针对性难度旋钮
      s.timeline.push({ age: 18, text: "立下人生目标：" + (g ? g.name : "") + "。" });
      if (note) { weekLog.push("🎯 " + note); s.timeline.push({ age: 18, text: note }); }
      screen = "play"; render();
    });
  }

  /* ============================ 小游戏 ============================ */
  // 小游戏/棋牌结束或退出时，回到它被打开的地方（独立屏 or 电脑游戏厅）
  function exitGameHost() {
    mgId = null; mg = null; bgId = null; bgGame = null; bgBoard = null;
    if (gameHost === "pc") { screen = "pc"; pcApp = "games"; } else { screen = "play"; }
  }
  function startMinigame(id, host) {
    gameHost = host || "play";
    const g = (C._util.mgById ? C._util.mgById(id) : null); if (!g) { exitGameHost(); render(); return; }
    if (g.stake && s.cash < g.stake) {
      const tip = `玩「${g.name}」大约要花 ¥${g.stake.toLocaleString()}，你兜里不够。`;
      if (gameHost === "pc") { s._phoneMsg = "🎮 " + tip; mgId = null; mg = null; } else { s._mgMsg = tip; screen = "mgmenu"; }
      render(); return;
    }
    if (g.stake) add(s, "cash", -g.stake);
    commitPendingAct();                                    // 真的开玩了，才结算「找点乐子」这周的时间
    mgId = id; mg = { round: 0, wins: 0, losses: 0, flashy: false, done: false, result: "", log: [] };
    if (gameHost !== "pc") screen = "minigame";            // 电脑内置：留在 pc 游戏厅里渲染
    render();
  }
  function mgPlayRound(moveIdx) {
    const g = C._util.mgById(mgId); if (!g || mg.done) return;
    const move = g.moves[moveIdx];
    const stat = (s.stats[g.statKey] || 30);
    const luck = (s.world ? s.world.momentum : 0) / 600;
    let p = 0.5 + (stat - 50) / 180 + (move.edge || 0) + luck;
    p = Math.max(0.12, Math.min(0.9, p));
    mg.round++;
    // 每回合约一成「势均力敌·平手」：谁也没占便宜 → 整局可能打平（让 onDraw 文案真正用得上）
    if (rnd(0.1)) { mg.draws = (mg.draws || 0) + 1; mg.log.push(`第${mg.round}回合：${move.label} → 势均力敌，打了个平手 ➖`); }
    else if (rnd(p)) { mg.wins++; if (move.flashy) mg.flashy = true; mg.log.push(`第${mg.round}回合：${move.label} → 你赢了这手 ✅`); }
    else { mg.losses++; mg.log.push(`第${mg.round}回合：${move.label} → 这手输了 ❌`); }
    const need = Math.ceil(g.rounds / 2);
    if (mg.wins >= need || mg.losses >= need || mg.round >= g.rounds) {
      mg.done = true;
      mg.outcome = mg.wins > mg.losses ? "win" : mg.wins < mg.losses ? "lose" : "draw";
      const info = { wins: mg.wins, total: g.rounds, flashy: mg.flashy && mg.outcome === "win" };
      let res = "";
      try { res = mg.outcome === "win" ? g.onWin(s, info) : mg.outcome === "lose" ? g.onLose(s, info) : g.onDraw(s, info); } catch (x) { res = ""; }
      if (info.flashy) { add(s, "mood", 5); add(s, "reputation", 2); res += "（这一局赢得太漂亮，传开了——心气和名声都涨了一截。）"; }
      mg.result = res;
      if (res) { s.timeline.push({ age: s.age, text: "🎮 " + res }); }
      try { tickMs(); } catch (x) {}
    }
    render();
  }
  function renderMgMenu() {
    const list = (C._util.mgAvailable ? C._util.mgAvailable(s) : []);
    const boards = (C._util.bgAvailable ? C._util.bgAvailable(s) : []);
    const msg = s._mgMsg ? `<div class="logbox"><div class="log">⚠️ ${s._mgMsg}</div></div>` : ""; s._mgMsg = null;
    const bgCards = boards.map(g => `<div class="bgcard mgcard bg-real" data-bg="${g.id}">
      <div class="bg-emoji">${g.emoji}</div><div class="bg-name">${g.name} <span class="real-tag">真·对弈</span></div>
      <div class="bg-desc">${g.where}</div>
      <div class="bg-start">♟️ 真棋盘 · 点击落子 · 与${g.opponent}对弈</div></div>`).join("");
    const cards = list.map(g => `<div class="bgcard mgcard" data-mg="${g.id}">
      <div class="bg-emoji">${g.emoji}</div><div class="bg-name">${g.name}</div>
      <div class="bg-desc">${g.where}</div>
      <div class="bg-start">🎯 拼${SN[g.statKey] || g.statKey}　${g.stake ? "💸 约 ¥" + g.stake.toLocaleString() : "免费"}</div></div>`).join("");
    app().innerHTML = `<div class="screen">${navBar("play")}<h2 style="margin-top:8px">🎮 找点乐子</h2>
      <p class="sub">忙里偷闲，去会会这些有意思的人和地方。标「真·对弈」的是真棋盘，自己动手下；其余赢了有彩头、输了也解压。</p>${msg}
      <div class="bggrid">${bgCards}${cards || (bgCards ? "" : '<p class="sub">这个年纪、这个地方，暂时没什么好玩的去处。</p>')}</div>
      <button class="btn" id="mgback" style="margin-top:16px">← 算了，继续生活</button></div>`;
    bindNav();
    document.querySelectorAll(".mgcard[data-mg]").forEach(el => el.onclick = () => startMinigame(el.dataset.mg));
    document.querySelectorAll(".mgcard[data-bg]").forEach(el => el.onclick = () => startBoardGame(el.dataset.bg));
    document.getElementById("mgback").onclick = () => { clearPendingAct(); screen = "play"; render(); };
  }
  /* ---------- 真·棋盘游戏（五子棋等）：点击落子 + AI 对弈 ---------- */
  function startBoardGame(id, host) {
    gameHost = host || "play";
    const g = (C._util.bgById ? C._util.bgById(id) : null); if (!g) { exitGameHost(); render(); return; }
    commitPendingAct();                                    // 真的坐下对弈了，才结算「找点乐子」这周的时间
    bgId = id; bgGame = g; bgBoard = g.newBoard(); bgOver = false; bgResult = ""; bgLast = null; bgSel = null; bgTargets = []; bgKo = null; bgPasses = 0;
    bgHistory = []; bgUndos = 0;   // ★批次5：新一局重置悔棋
    if (gameHost !== "pc") screen = "boardgame";           // 电脑内置：留在 pc 游戏厅里渲染
    render();
  }
  // —— 围棋：落子(提子/打劫) + 停手 + 数子终局 ——
  function bgGoEnd() {
    const g = bgGame; const sc = g.score(bgBoard);
    const out = sc.b > sc.w ? "win" : sc.b < sc.w ? "lose" : "draw";
    bgFinish(out);
    bgResult = `终局数子：你(黑) ${Math.round(sc.b)} 目 vs 对手(白) ${sc.w.toFixed(1)} 目。${bgResult}`;
    render();
  }
  function bgGoAITurn() {
    const g = bgGame; let m = null; try { m = g.aiPlace(bgBoard, bgKo); } catch (e) { m = { pass: true }; }
    if (!m || m.pass) { bgPasses++; if (bgPasses >= 2) { bgGoEnd(); return; } render(); return; }
    const r = g.tryPlace(bgBoard, m.x, m.y, 2, bgKo);
    if (r && r.ok) { bgBoard = r.nb; bgKo = r.ko; bgLast = { x: m.x, y: m.y }; bgPasses = 0; }
    render();
  }
  function bgGoMove(x, y) {
    const g = bgGame; if (!g || bgOver) return;
    const r = g.tryPlace(bgBoard, x, y, 1, bgKo); if (!r || !r.ok) return;
    bgSnapshot();   // ★批次5：落子前留底，供悔棋
    bgBoard = r.nb; bgKo = r.ko; bgLast = { x: x, y: y }; bgPasses = 0;
    bgGoAITurn();
  }
  function bgGoPass() {
    if (bgOver) return; bgPasses++;
    if (bgPasses >= 2) { bgGoEnd(); return; }
    bgGoAITurn();
  }
  function bgFinish(outcome) {
    bgOver = true;
    const g = bgGame; let res = "";
    try { res = outcome === "win" ? g.onWin(s, {}) : outcome === "lose" ? g.onLose(s, {}) : g.onDraw(s, {}); } catch (x) { res = ""; }
    bgResult = res; bgOutcome = outcome;
    if (res) s.timeline.push({ age: s.age, text: "🎮 " + res });
    try { tickMs(); } catch (x) {}
  }
  let bgOutcome = "";
  // —— 落子型（五子棋）——
  function bgPlayerMove(x, y) {
    const g = bgGame; if (!g || bgOver || !bgBoard) return;
    if (!g.legal(bgBoard, x, y)) return;
    bgSnapshot();   // ★批次5：落子前留底，供悔棋
    g.place(bgBoard, x, y, 1); bgLast = { x: x, y: y };
    if (g.winFrom && g.winFrom(bgBoard, x, y, 1)) { bgFinish("win"); render(); return; }
    if (g.full(bgBoard)) { bgFinish("draw"); render(); return; }
    let m = null; try { m = g.aiMove(bgBoard); } catch (x2) { m = null; }
    if (m && g.legal(bgBoard, m.x, m.y)) {
      g.place(bgBoard, m.x, m.y, 2); bgLast = { x: m.x, y: m.y };
      if (g.winFrom && g.winFrom(bgBoard, m.x, m.y, 2)) { bgFinish("lose"); render(); return; }
      if (g.full(bgBoard)) { bgFinish("draw"); render(); return; }
    }
    render();
  }
  // —— 走子型（象棋）：选子 → 走子 → AI 应招 ——
  function bgMoveClick(x, y) {
    const g = bgGame; if (!g || bgOver || !bgBoard) return;
    const owner = g.ownerAt(bgBoard, x, y);
    if (bgSel) {
      if (bgTargets.some(t => t[0] === x && t[1] === y)) { bgApplyMove(bgSel[0], bgSel[1], x, y); return; }
      if (owner === 1) { bgSel = [x, y]; bgTargets = g.legalMoves(bgBoard, x, y); render(); return; }
      bgSel = null; bgTargets = []; render(); return;
    }
    if (owner === 1) { bgSel = [x, y]; bgTargets = g.legalMoves(bgBoard, x, y); render(); }
  }
  function bgApplyMove(fx, fy, tx, ty) {
    const g = bgGame;
    bgSnapshot();   // ★批次5：走子前留底，供悔棋
    g.move(bgBoard, fx, fy, tx, ty); bgLast = { fx: fx, fy: fy, tx: tx, ty: ty }; bgSel = null; bgTargets = [];
    let w = g.winner(bgBoard);
    if (w === 1) { bgFinish("win"); render(); return; }
    if (w === 2) { bgFinish("lose"); render(); return; }
    let m = null; try { m = g.aiMove(bgBoard); } catch (e) { m = null; }
    if (m) { g.move(bgBoard, m.fx, m.fy, m.tx, m.ty); bgLast = m; }
    else { bgFinish("win"); render(); return; }   // AI 无着 = 你赢
    w = g.winner(bgBoard);
    if (w === 1) { bgFinish("win"); render(); return; }
    if (w === 2) { bgFinish("lose"); render(); return; }
    render();
  }
  // 中国象棋盘线：交叉点 (i,j) 落在 svg 坐标 (i+0.5, j+0.5)，棋子居中于格 → 正好压在线交叉处。
  // 含：10 横线、9 竖线（内侧竖线在楚河处断开）、上下九宫斜线、楚河汉界。
  function xiangqiBoardSVG(W, Ht) {
    const ln = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    let s = "";
    for (let j = 0; j < Ht; j++) s += ln(0.5, j + 0.5, W - 0.5, j + 0.5);          // 横线
    for (let i = 0; i < W; i++) {
      const x = i + 0.5;
      if (i === 0 || i === W - 1) s += ln(x, 0.5, x, Ht - 0.5);                    // 边竖线贯通
      else { s += ln(x, 0.5, x, 4.5); s += ln(x, 5.5, x, Ht - 0.5); }             // 内竖线在楚河断开
    }
    // 九宫斜线（上 y=0..2 / 下 y=7..9，文件 x=3..5）
    s += ln(3.5, 0.5, 5.5, 2.5) + ln(5.5, 0.5, 3.5, 2.5);
    s += ln(3.5, 7.5, 5.5, 9.5) + ln(5.5, 7.5, 3.5, 9.5);
    const txt = `<text x="2.4" y="5.32" font-size="0.62" fill="#7a4a1a" text-anchor="middle" font-family="serif">楚 河</text><text x="6.6" y="5.32" font-size="0.62" fill="#7a4a1a" text-anchor="middle" font-family="serif">漢 界</text>`;
    return `<svg class="xq-svg" viewBox="0 0 ${W} ${Ht}" preserveAspectRatio="none"><g stroke="#6b4423" stroke-width="0.045" stroke-linecap="round">${s}</g>${txt}</svg>`;
  }
  // 围棋/五子棋盘线：N×N 交点棋盘，线穿格心 → 棋子落在交叉点上（而非格子里）。含星位。
  function gridBoardSVG(N) {
    const ln = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    let s = "";
    for (let i = 0; i < N; i++) { s += ln(0.5, i + 0.5, N - 0.5, i + 0.5); s += ln(i + 0.5, 0.5, i + 0.5, N - 0.5); }
    const mid = Math.floor(N / 2), o = N >= 13 ? 3 : 2;
    const pts = [[o, o], [o, N - 1 - o], [N - 1 - o, o], [N - 1 - o, N - 1 - o], [mid, mid]];
    if (N >= 13) { pts.push([o, mid], [mid, o], [mid, N - 1 - o], [N - 1 - o, mid]); }
    const stars = pts.map(p => `<circle cx="${p[0] + 0.5}" cy="${p[1] + 0.5}" r="0.11" fill="#6b4423"/>`).join("");
    return `<svg class="xq-svg" viewBox="0 0 ${N} ${N}" preserveAspectRatio="none"><g stroke="#6b4423" stroke-width="0.05" stroke-linecap="round">${s}</g>${stars}</svg>`;
  }
  // 棋牌面板（可内嵌：独立屏 / 电脑游戏厅）
  function boardPanelHTML() {
    const g = bgGame; if (!g || !bgBoard) return "";
    const isMove = g.mode === "move";
    const isGo = g.mode === "go";
    const W = g.width || g.size, Ht = g.height || g.size;
    let cells = "";
    for (let y = 0; y < Ht; y++) for (let x = 0; x < W; x++) {
      if (isMove) {
        const code = bgBoard[y * W + x]; const ch = g.pieceChar(code); const owner = g.ownerAt(bgBoard, x, y);
        const sel = bgSel && bgSel[0] === x && bgSel[1] === y ? " bg-sel" : "";
        const tgt = bgTargets.some(t => t[0] === x && t[1] === y) ? " bg-tgt" : "";
        const last = bgLast && ((bgLast.tx === x && bgLast.ty === y) || (bgLast.fx === x && bgLast.fy === y)) ? " bg-last" : "";
        const piece = ch ? `<i class="xq-piece ${owner === 1 ? "xq-r" : "xq-b"}">${ch}</i>` : (tgt ? '<i class="xq-dot"></i>' : "");
        cells += `<div class="bg-cell xq-cell${sel}${tgt}${last}" data-x="${x}" data-y="${y}">${piece}</div>`;
      } else {
        const v = bgBoard[y * W + x];
        const stone = v === 1 ? '<i class="bg-stone bg-black"></i>' : v === 2 ? '<i class="bg-stone bg-white"></i>' : "";
        const last = bgLast && bgLast.x === x && bgLast.y === y ? " bg-last" : "";
        cells += `<div class="bg-cell${last}" data-x="${x}" data-y="${y}">${stone}</div>`;
      }
    }
    const hint = isMove ? "你执<b style=\"color:var(--red)\">红</b>先行。点选自己的棋子，再点目标格落子。"
      : isGo ? "你执黑●先行。点交叉点落子，包住对方即可提子。无处可下/想终局就「停手」，双方连续停手即数子。"
      : "你执黑●，先手。点击棋盘交叉点落子。";
    const statusTop = bgOver
      ? `<div class="ev-title">${bgOutcome === "win" ? "🏆 你赢了！" : bgOutcome === "lose" ? "🤝 你输了" : "🤝 和棋"}</div><div class="ev-text">${bgResult || ""}</div>`
      : `<div class="ev-title">${g.emoji} ${g.name} · 对弈中</div><div class="ev-text">${g.intro}　<b style="color:var(--amber2)">${hint}</b>${isGo && bgPasses === 1 ? '　<b style="color:var(--red)">对方已停手，你再停手即终局。</b>' : ""}</div>`;
    const canUndo = !bgOver && bgUndos < BG_UNDO_MAX && bgHistory.length > 0;
    const undoBtn = bgOver ? "" : `<button class="btn${canUndo ? "" : " dis"}" id="bgundo" ${canUndo ? "" : "disabled"} title="每局最多悔 2 步">↩ 悔棋（剩 ${Math.max(0, BG_UNDO_MAX - bgUndos)}）</button>`;
    const btns = bgOver
      ? `<button class="btn choice" id="bgagain">再来一局 🔄</button><button class="btn primary choice" id="bgdone">结束 →</button>`
      : (isGo ? `${undoBtn}<button class="btn" id="bgpass">停手 / 终局</button><button class="btn" id="bgresign">认输离桌</button>` : `${undoBtn}<button class="btn" id="bgresign">认输离桌</button>`);
    return `<div class="ev-card" style="max-width:${isMove ? 460 : 560}px;margin:0 auto">
      <div class="ev-tag">${g.emoji} ${g.name} · 对手：${g.opponent}</div>
      ${statusTop}
      <div class="bg-board${isMove ? " xq-board xq-lined" : " go-board xq-lined"}" style="grid-template-columns:repeat(${W},1fr)">${isMove ? xiangqiBoardSVG(W, Ht) : gridBoardSVG(W)}${cells}</div>
      <div class="ev-choices" style="margin-top:14px">${btns}</div></div>`;
  }
  function bindBoardPanel() {
    const g = bgGame; if (!g) return;
    const isMove = g.mode === "move", isGo = g.mode === "go";
    if (!bgOver) {
      const canUndo = bgUndos < BG_UNDO_MAX && bgHistory.length > 0;
      const handler = isMove ? bgMoveClick : isGo ? bgGoMove : bgPlayerMove;
      document.querySelectorAll(".bg-cell").forEach(el => el.onclick = () => handler(parseInt(el.dataset.x, 10), parseInt(el.dataset.y, 10)));
      const rs = document.getElementById("bgresign"); if (rs) rs.onclick = () => { bgFinish("lose"); render(); };
      const ps = document.getElementById("bgpass"); if (ps) ps.onclick = () => bgGoPass();
      const ub = document.getElementById("bgundo"); if (ub && canUndo) ub.onclick = () => bgUndo();
    } else {
      const ag = document.getElementById("bgagain"); if (ag) ag.onclick = () => startBoardGame(bgId, gameHost);
      const dn = document.getElementById("bgdone"); if (dn) dn.onclick = () => { exitGameHost(); render(); };
    }
  }
  function renderBoardGame() {
    if (!bgGame || !bgBoard) { screen = "play"; render(); return; }
    app().innerHTML = `<div class="screen">${boardPanelHTML()}</div>`;
    bindBoardPanel();
  }
  // 回合制小游戏面板（可内嵌：独立屏 / 电脑游戏厅）
  function minigamePanelHTML() {
    const g = C._util.mgById(mgId); if (!g) return "";
    const need = Math.ceil(g.rounds / 2);
    const scoreLine = `<div class="mg-score">本局 ${g.rounds} 回合制 · 先到 ${need} 胜 —— 你 <b style="color:var(--green)">${mg.wins}</b> : <b style="color:var(--red)">${mg.losses}</b> ${g.opponent}</div>`;
    const logHtml = mg.log.length ? `<div class="mg-log">${mg.log.map(l => `<div class="log">${l}</div>`).join("")}</div>` : "";
    if (!mg.done) {
      const btns = g.moves.map((m, i) => `<button class="btn choice mg-move" data-i="${i}"><b>${m.label}</b><br><small style="color:var(--dim)">${m.desc}</small></button>`).join("");
      return `<div class="ev-card">
        <div class="ev-tag">${g.emoji} ${g.name} · 对手：${g.opponent}</div>
        <div class="ev-title">${g.emoji} 第 ${mg.round + 1} 回合</div>
        <div class="ev-text">${mg.round === 0 ? g.intro : "该你了——这一手，怎么走？"}　<span style="color:var(--amber2)">（拼的是你的「${SN[g.statKey] || g.statKey}」）</span></div>
        ${scoreLine}${logHtml}
        <div class="ev-choices">${btns}</div></div>`;
    }
    const head = mg.outcome === "win" ? "🏆 你赢了！" : mg.outcome === "lose" ? "🤝 你输了" : "🤝 平局";
    return `<div class="ev-card">
      <div class="ev-tag">${g.emoji} ${g.name} · 终局 ${mg.wins}:${mg.losses}</div>
      <div class="ev-title">${head}</div>
      <div class="ev-text">${mg.result || "玩了一局，尽兴而归。"}</div>
      ${logHtml}
      <div class="ev-choices"><button class="btn choice" id="mgagain">再来一局 🔄</button><button class="btn primary choice" id="mgdone">结束 →</button></div></div>`;
  }
  function bindMinigamePanel() {
    if (!mgId || !mg) return;
    if (!mg.done) {
      document.querySelectorAll(".mg-move").forEach(b => b.onclick = () => mgPlayRound(parseInt(b.dataset.i, 10)));
    } else {
      const ag = document.getElementById("mgagain"); if (ag) ag.onclick = () => startMinigame(mgId, gameHost);
      const dn = document.getElementById("mgdone"); if (dn) dn.onclick = () => { exitGameHost(); render(); };
    }
  }
  function renderMinigame() {
    if (!mgId || !C._util.mgById(mgId)) { screen = "play"; render(); return; }
    app().innerHTML = `<div class="screen event">${minigamePanelHTML()}</div>`;
    bindMinigamePanel();
  }

  let _lastScreen = null;
  function render() {
    const changed = screen !== _lastScreen; _lastScreen = screen;
    ({ title: renderTitle, cohort: renderCohort, birthplace: renderBirthplace, namepick: renderNamePick, legacykids: renderLegacyKids, create: renderCreate, gear: renderGear, goalpick: renderGoalPick, play: renderPlay, event: renderEvent, phone: renderPhone, pc: renderPc, shop: renderShop, market: renderMarket, social: renderSocial, map: renderMap, travel: renderTravel, dead: renderDead, gallery: renderGallery, mgmenu: renderMgMenu, minigame: renderMinigame, boardgame: renderBoardGame }[screen] || renderTitle)();
    // 只有真正切换页面时才放入场动画；同一页内（点行动/导航刷新）不再整页闪一下
    if (changed) { const sc = app().querySelector(".screen"); if (sc) sc.classList.add("screen-enter"); }
  }
  window.GAME = { boot: () => { screen = "title"; render(); } };
})();
