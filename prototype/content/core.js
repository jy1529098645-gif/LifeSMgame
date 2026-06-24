/* =====================================================================
 * 《荒诞人生模拟器》原型 —— 内容数据层 content.js  (v0.3 周推进 / 行动驱动 / VN事件)
 * ---------------------------------------------------------------------
 * 核心循环（v0.3 重做）：
 *   开局 = 骑砍式「成长经历」抉择（净零重分配，保证所有开局总属性相等）。
 *   游戏 = 从 18 岁起【按周】推进；每周固定行动点(AP)，玩家选「做什么事」(行动)。
 *   行动 → 触发详细 VN 事件 / 后果（奖励·惩罚·剧情），内容随【阶段+阶级】变化。
 *   风口隐藏：只能从【每周新闻】里推断；创业/投资要自己押赛道，押中隐藏风口才爆发。
 *   结局：每周概率判定（死亡/上市/破产/移民/善终…），非必然。
 *
 * ★模块化（v0.5）★：本文件是【核心层】，运行在全局作用域。它定义的
 *   helper（add/flag/has/pick/rnd/byClass/classTier/shuf/betNode/makeCrush/startupNode…）
 *   与数据（cohorts/origins/lifeStages/actions/windTimeline/EVENTS/CONSUMPTION/SOCIAL…）
 *   被 content/ 下其它模块直接引用（经典 <script> 共享全局词法作用域）。
 *   各模块只需 EVENTS.push(...) / CONSUMPTION.push(...) / SOCIAL_DEFS.push(...) 注册内容，
 *   互不干扰 → 可多 agent 并行填充。最终由 content/_assemble.js 组装出 window.CONTENT。
 * ===================================================================== */
"use strict";

  /* —— 属性体系：6 维个人属性。捏人是「加点制」：低起点起步，4 步选择越选越强（个别取舍项才会扣） —— */
  const STAT_KEYS = ["body", "mind", "knowledge", "strategy", "charm", "insight"];
  const STAT_NAMES = { body: "体魄", mind: "心智", knowledge: "学识", strategy: "谋略", charm: "魅力", insight: "见识" };
  const BASE_STAT = 22;                 // 每维起步值（低起点加点制：起步略低，4步正向加点后终值≈170-185，匹配岗位/行动门槛）
  const BASE_TOTAL = BASE_STAT * STAT_KEYS.length; // 96 起步总和；最终随选择增长到 ~180

  function clampStat(v) { return Math.max(0, Math.min(100, v)); }
  function add(s, key, d) {
    if (STAT_KEYS.includes(key)) { s.stats[key] = clampStat((s.stats[key] || 0) + d); return s.stats[key]; }
    s[key] = (s[key] || 0) + d;
    if (["health", "mood"].includes(key)) s[key] = Math.max(0, Math.min(100, s[key]));
    if (key === "reputation") s[key] = Math.max(-100, Math.min(100, s[key]));
    if (key === "network") s[key] = Math.max(0, Math.min(120, s[key]));
    if (key === "stress") s[key] = Math.max(0, Math.min(100, s[key]));
    if (key === "overdraft") s[key] = Math.max(0, Math.min(180, s[key])); // 透支是身体/精神负荷条，不承载金钱债务；封顶避免一次事件直接引爆全病。
    return s[key];
  }
  function flag(s, n) { s.flags[n] = true; }
  function has(s, n) { return !!s.flags[n]; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rnd(p) { return Math.random() < p; }
  // 阶级分层：由身价决定，驱动事件内容偏差（穷/普通/小康/富裕/顶级）
  function classTier(s) {
    // 用「开局年购买力」口径分层，避免通胀让晚年人人都被当成顶级富豪（事件语气失真）
    const pi = (s.world && s.world.priceIndex) ? s.world.priceIndex : 1;
    const w = ((s.cash || 0) + (s.assets || 0)) / pi;
    if (w < 30000) return 0; if (w < 300000) return 1; if (w < 2000000) return 2; if (w < 20000000) return 3; return 4;
  }
  const CLASS_NAMES = ["挣扎温饱", "普通打工人", "小有积蓄", "新贵", "顶级富豪"];
  // 内容偏差助手：按阶级取不同文案/数值。variants = [t0,t1,t2,t3,t4] 或 {poor,mid,rich}
  function byClass(s, variants) {
    const t = classTier(s);
    if (Array.isArray(variants)) return variants[Math.min(t, variants.length - 1)];
    if (t <= 0) return variants.poor; if (t >= 3) return variants.rich; return variants.mid;
  }

  /* ============================ 一、出生年代 (Cohort) ============================ */
  const cohorts = [
    { id: "70", name: "70后", year: 1975, emoji: "📻", vibe: "赶上下海、下岗、买房上车，时代红利与阵痛并存。" },
    { id: "80", name: "80后", year: 1985, emoji: "📼", vibe: "独生子女第一代，撞上互联网与房价起飞。" },
    { id: "90", name: "90后", year: 1995, emoji: "💿", vibe: "移动互联网原住民，赶上双创也赶上内卷裁员。" },
    { id: "00", name: "00后", year: 2005, emoji: "📱", vibe: "出生即联网，整顿职场，却撞上最卷高考就业。" },
    { id: "10", name: "10后", year: 2015, emoji: "🤖", vibe: "AI 原住民，双减下长大，未来属于机器人。" },
    { id: "silver", name: "含着金汤匙", year: 1990, emoji: "🥄", vibe: "投胎即赢家——家底丰厚、人脉现成，起跑线甩开旁人几条街。", locked: "cohort_silver", cashMul: 3.2, originFlag: "silver_spoon" },
    { id: "hard", name: "苦命人", year: 1980, emoji: "🧱", vibe: "一无所有起步，命比纸薄，专给想硬核虐一把的老手。", locked: "cohort_hard", cashMul: 0.3, originFlag: "born_poor" }
  ];

  /* ============================ 二、成长经历（骑砍式开局，净零重分配） ============================
   * 玩家依次选 童年→少年→青春期→成年定型。每个 option 的 realloc 各维之和=0，
   * 因此无论怎么选，开局 6 维总和恒=180（引擎再兜底归一）。这就是「总数值一样」。
   * 成年定型(adult) 额外决定 assetTier（资产/阶级起点）与 flags。
   */
  const creationSteps = [
    { id: "childhood", title: "童年（你的家庭）", options: [
      { id: "poor", name: "农村寒门", desc: "土灶、放牛、走几里山路上学。穷，但身子骨硬、心气足。", realloc: { body: 12, strategy: 6, charm: -9, insight: -9 } },
      { id: "worker", name: "城市工薪", desc: "筒子楼、双职工父母，最普通的起跑线。", realloc: {} },
      { id: "intellectual", name: "书香门第", desc: "满墙的书，父母都是知识分子，从小被熏陶。", realloc: { knowledge: 12, insight: 6, body: -9, strategy: -9 } },
      { id: "cadre", name: "干部家庭", desc: "大院长大，饭桌上都是人情世故，见过场面。", realloc: { charm: 9, insight: 9, knowledge: -9, body: -9 } }
    ] },
    { id: "teen", title: "少年（你的求学）", options: [
      { id: "topper", name: "做题家", desc: "刷题机器，年级前几，但生活自理能力堪忧。", realloc: { knowledge: 12, mind: 3, charm: -9, body: -6 } },
      { id: "jock", name: "体育特长", desc: "校队主力，荷尔蒙旺盛，文化课一塌糊涂。", realloc: { body: 12, charm: 6, knowledge: -12, insight: -6 } },
      { id: "social", name: "孩子王", desc: "全校都认识你，混得开，但成绩中游。", realloc: { charm: 12, strategy: 6, knowledge: -9, mind: -9 } },
      { id: "loner", name: "孤僻天才", desc: "沉迷自己的世界——编程/画画/小说，天赋拉满，但代价是社交能力荒废。", tradeoff: true, realloc: { knowledge: 9, insight: 9, charm: -12, body: -6 } }
    ] },
    { id: "youth", title: "青春期（一个选择）", options: [
      { id: "love", name: "轰轰烈烈早恋", desc: "懂得了心动与心碎，情商飙升，学业受了点影响。", realloc: { charm: 9, mind: 6, knowledge: -9, body: -6 } },
      { id: "grind", name: "竞赛保送路", desc: "把青春献给了奥赛，拿了奖，也错过了很多。", realloc: { knowledge: 9, insight: 6, charm: -9, mind: -6 } },
      { id: "rebel", name: "叛逆混社会", desc: "翘课、网吧、打架，练出一身江湖野性——代价是荒废了学业和心性。", tradeoff: true, realloc: { strategy: 9, body: 6, knowledge: -9, mind: -6 } },
      { id: "hustle_teen", name: "倒卖小生意", desc: "校园里卖手机卡/代购，初尝赚钱的快感。", realloc: { strategy: 12, charm: 3, knowledge: -9, insight: -6 } }
    ] },
    { id: "adult", title: "成年定型（17 岁那年）", note: "决定你的资产与阶级起点（叠加在成长属性之上）", options: [
      { id: "ordinary", name: "普通人家", desc: "没什么背景，一切靠自己。", assetTier: "worker", realloc: {} },
      { id: "nouveau", name: "突然暴发户", desc: "17 岁那年家里拆迁/中标，一夜暴富。钱多了底气足了，但根基浅、易飘。", tradeoff: true, assetTier: "rich", realloc: { charm: 6, mind: 6, strategy: -6, insight: -6 }, flags: ["nouveau_riche"] },
      { id: "well_off", name: "殷实人家", desc: "家境优渥，父母或是体面的生意人，或是高知，从没让你为钱发过愁。", assetTier: "upper", realloc: { insight: 6, charm: 6, body: -6, strategy: -6 } },
      { id: "fallen", name: "家道中落", desc: "曾经的小康，因变故一夜返贫。看透了世态炎凉，却也丢了底气与体面。", tradeoff: true, assetTier: "poor", realloc: { mind: 9, strategy: 6, charm: -9, body: -6 }, flags: ["fallen"] }
    ] },
    /* —— 大框架改造·批次2：大学专业 —— 你在读大三，选的专业将决定哪些岗位向你敞开（doc §2.3）。
     * id 形如 major_cs，会写入 flag「bg_major_major_cs」，newState 据此设 s.major。realloc 净零。 */
    { id: "major", title: "大学专业（你读到大三的方向）", note: "专业是求职的硬门槛：对口行业更容易上岸，壁垒行业（医疗/金融/体制）跨专业会被刷。", options: [
      { id: "major_cs",      name: "💻 计算机/软件", desc: "敲代码、刷算法、通宵改 bug——最对口这十年的风口（互联网/创业）。", realloc: { knowledge: 8, insight: 4, charm: -6, body: -6 } },
      { id: "major_mech",    name: "⚙️ 机械/制造",   desc: "画图纸、下车间、跑产线，硬核工科底子（先进制造/国企）。", realloc: { knowledge: 6, body: 6, charm: -6, insight: -6 } },
      { id: "major_biz",     name: "📊 工商管理",   desc: "市场运营管理样样懂点，能说会道（销售/咨询/管理）。", realloc: { charm: 6, strategy: 6, knowledge: -6, body: -6 } },
      { id: "major_finance", name: "💰 金融/经济",   desc: "估值模型行情，离钱最近（金融/专业服务，壁垒高）。", realloc: { strategy: 8, insight: 4, body: -6, charm: -6 } },
      { id: "major_med",     name: "🩺 临床医学",   desc: "五年起步、规培漫长，但医疗这道门只为你开。", tradeoff: true, realloc: { knowledge: 8, mind: 6, charm: -8, strategy: -6 } },
      { id: "major_law",     name: "⚖️ 法学",       desc: "背法条跑实务，体制与法务的敲门砖。", realloc: { strategy: 6, mind: 6, body: -6, insight: -6 } },
      { id: "major_art",     name: "🎨 艺术/设计",   desc: "审美与表达是武器，也常是「不好就业」的代名词（传媒/互联网）。", tradeoff: true, realloc: { charm: 6, insight: 6, knowledge: -6, strategy: -6 } },
      { id: "major_edu",     name: "📚 师范/文科",   desc: "文史哲师范类，稳但起薪不高、跨行难（教育/体制/传媒）。", realloc: { knowledge: 6, mind: 6, body: -6, strategy: -6 } }
    ] }
  ];
  const assetTierCash = { poor: 2000, worker: 8000, upper: 18000, rich: 45000 };

  /* ============================ 三、人生阶段（成年后按周玩） ============================
   * 每阶段：固定每周 AP、专属行动、氛围与"周围人反馈"基调、可触发的环境事件池。
   * climate = 该阶段的环境/风险基调（展示给玩家，营造代入）。
   */
  // weeklyHours = 每周「可自由支配的小时数」（睡觉/吃饭/通勤之外）。各行动按真实大致耗时扣。
  const lifeStages = [
    { id: "youth", name: "青年", min: 18, max: 24, weeklyHours: 64,
      climate: "刚踏入社会，一切都是新的。试错成本低，但谁都能对你指手画脚。",
      actions: ["jobhunt", "work", "quit", "study", "parttime", "date", "socialize", "exercise", "browse", "sidehustle", "relocate", "travel", "rest"] },
    { id: "hustle", name: "打拼", min: 25, max: 34, weeklyHours: 64,
      climate: "同龄人开始分化。房贷、婚恋、35 岁的影子都在远处招手。",
      actions: ["work", "quit", "jobhunt", "sidehustle", "startup", "socialize", "date", "invest", "exercise", "browse", "relocate", "travel", "rest"] },
    { id: "midlife", name: "中年", min: 35, max: 49, weeklyHours: 56,
      climate: "上有老下有小，你是顶梁柱，也是最先被优化的人。",
      actions: ["work", "quit", "jobhunt", "startup", "invest", "parenting", "socialize", "exercise", "browse", "relocate", "travel", "rest"] },
    { id: "senior", name: "中老年", min: 50, max: 64, weeklyHours: 50,
      climate: "退休的影子越来越近，身体开始报警，你盘点这一生。",
      actions: ["work", "quit", "jobhunt", "invest", "exercise", "hobby", "family", "browse", "rest"] },
    { id: "elder", name: "晚年", min: 65, max: 999, weeklyHours: 44,
      climate: "夕阳无限好。剩下的日子，怎么过都是赚的。",
      actions: ["rest", "hobby", "grandkids", "family", "browse"] }
  ];

  /* ============================ 四、行动 (Actions) ============================
   * 玩家每周从当前阶段的行动里选择，消耗 ap。resolve(s) 返回 {log} 或 {event:eventId}。
   * 行动是"做某件事"，结果尽量有随机/后果感，而非确定加点。
   */
  const actions = [
    { id: "study", name: "学习充电", emoji: "📖", hours: 18, desc: "啃书、上网课、考证。投资自己，回报在看不见的远方。", hint: "🧠学识+　🙂心情-2",
      resolve: (s) => { add(s, "knowledge", 1.5 + statEdge(s, "mind") * 4 + rnd(0.3) * 2); add(s, "insight", 1); add(s, "mood", -2); return { log: "你把自己钉在书桌前。窗外的天色暗了又亮，外卖盒堆成小山，脑子里的知识却实打实地厚了一层——只是太久没开口说话，舌头都有些发涩。" }; } },
    { id: "parttime", name: "兼职打工", emoji: "🛎️", hours: 16, desc: "发传单、做家教、端盘子，赚点零花，提前尝尝社会的滋味。",
      resolve: (s) => { const m = Math.round(300 + s.stats.charm * 28 + s.stats.body * 6 + Math.random() * 400); add(s, "cash", m); add(s, "strategy", 1); add(s, "health", -2); if (typeof recordBeat === "function") recordBeat(s, "first_intern"); return { log: `你跑了一周的腿，陪了一周的笑脸。攥着到手的 ¥${m.toLocaleString()}，你第一次懂了每一分钱背后的腰酸背痛。` }; } },
    { id: "work", name: "上班搬砖", emoji: "💼", hours: 40, desc: "去单位上班攒月薪——工资月底一次性发（高薪岗另有年终奖）；薪资随物价/景气/势头浮动。需先有正式工作（没工作请先「找工作」或「兼职打工」糊口）。", hint: "💼工资月底发　❤️健康-3　😣压力+",
      require: (s) => !!s.job,   // ★没有正式工作就不能「上班」——零工糊口走「兼职打工」/「找工作」
      resolve: (s) => {
        const m = jobSalary(s);                 // 月薪
        add(s, "strategy", 0.4); add(s, "health", -3);
        const stress = (s.job ? s.job.stress : 4) + Math.round((s.world ? s.world.pace : 30) / 25);
        add(s, "stress", stress);
        bumpMomentum(s, 1);
        if (s.job) {
          s._monthWork = (s._monthWork || 0) + 1;   // 本月出勤周数（月底按出勤发薪）
          // 升职加薪：魅力(会做人)+学识(有本事)+谋略(会站队)越高，爬得越快——能力强的人薪资一路碾压
          if (rnd(0.035 + statEdge(s, "charm") * 0.1 + statEdge(s, "knowledge") * 0.08 + statEdge(s, "strategy") * 0.05)) { s.job._raise = (s.job._raise || 0) + 0.08 + statEdge(s, "knowledge") * 0.05; add(s, "mood", 6); bumpMomentum(s, 4); if (typeof recordBeat === "function") recordBeat(s, "first_raise_or_cut"); return { log: `这周老板找你谈话——居然是涨薪！「年轻人好好干。」你嘴上谦虚，心里乐开了花。月薪涨了一截。`, mark: true }; }
          // 裁员：洞察(早有准备)+谋略(站对位置)高的人更不容易被优化
          if (s.world && s.world.jobMarket < 30 && rnd(Math.max(0.015, 0.07 - statEdge(s, "insight") * 0.08 - statEdge(s, "strategy") * 0.04))) { s.job = null; delete s.flags.employed; flag(s, "been_laid_off"); add(s, "mood", -10); bumpMomentum(s, -8); if (typeof recordBeat === "function") recordBeat(s, "first_raise_or_cut"); return { log: `寒气还是传到了你这。一纸「优化」通知，你被裁了。抱着纸箱走出写字楼，阳光刺眼。`, mark: true }; }
          // 「老板画饼」等职场糟心事：套长冷却(≈2年)，让位给工作场景/创业前史事件，避免它一辈子刷屏
          s._cdAct = s._cdAct || {};
          if (rnd(0.14) && (s.week - (s._cdAct.work_pua || -999)) >= 100) { s._cdAct.work_pua = s.week; return { event: "ev_work_pua" }; }
          if (s.stress < 70) add(s, "mood", 1);
          return { log: `又是朝九晚十的一周。「${s.job.name}」的工牌挂在胸前，也挂在心上——这个月的工资(约 ¥${m.toLocaleString()})，月底会一起打到卡上。` };
        }
        // 没正经工作：打零工当周即结（今天干今天结）
        const gig = Math.round(m * 12 / 52);
        if (rnd(0.5)) { add(s, "cash", gig); s._monthPay = (s._monthPay || 0) + gig; return { log: `没有正经工作的日子，你接了点零活：发传单、跑腿、打零工，这周当场结了 ¥${gig.toLocaleString()}。糊口而已，心里发慌。` }; }
        return { event: "ev_jobhunt" }; // 没工作时，有一半概率干脆去投简历
      } },
    { id: "jobhunt", name: "找工作", emoji: "📨", hours: 12, repeatWeek: true, desc: "刷招聘软件、投简历、跑面试。一周能投好几家——海投才有机会。岗位随你所在城市、随时机不断变化。",
      resolve: (s) => ({ event: "ev_jobhunt" }) },
    { id: "quit", name: "辞职 / 脱离", emoji: "🚪", hours: 2, desc: "受够了眼下的营生？主动抽身——裸辞歇口气、骑驴找马跳槽、辞职创业，或在编下海。脱离从来不轻松，但路是自己选的。", hint: "🚪脱离当前工作/编制　视选择而定",
      require: (s) => has(s, "employed") || has(s, "civil_servant") || has(s, "startup"),
      resolve: (s) => ({ event: "ev_quitx_menu" }) },
    { id: "relocate", name: "换个城市", emoji: "🧳", hours: 20, desc: "去一座新的城市生活。成本、机会、房价、节奏全然不同，社交圈也要重建。",
      resolve: (s) => ({ map: "relocate" }) },
    { id: "travel", name: "出国旅游", emoji: "🗺️", hours: 8, desc: "翻开世界地图，挑个目的地去走走。花钱换见识与好心情，回来还能发九宫格。",
      resolve: (s) => ({ map: "travel" }) },
    { id: "sidehustle", name: "搞副业", emoji: "📦", hours: 14, desc: "电商、自媒体、摆地摊。收益随你的本事放大，运气好能滚成大生意——但回款要等到月底结账，不是当天就进兜。",
      require: (s) => !has(s, "ban_side") && !(s.startup && s.startup.fulltime),
      resolve: (s) => { const skill = Math.max(s.stats.knowledge, s.stats.strategy); const m = Math.round(skill * 38 * (1 + luckBias(s) * 0.6) + s.stats.charm * 8 + Math.random() * 500); s._monthPay = (s._monthPay || 0) + m; add(s, "strategy", 1); add(s, "health", -2); if (s.stress < 75) add(s, "mood", 1); if (rnd(0.12 + statEdge(s, "strategy") * 0.4 + statEdge(s, "insight") * 0.2)) flag(s, "side_hot"); return { log: `下班后你点起一盏小灯，捣鼓自己的小买卖。这周谈成的单子能结 ¥${m.toLocaleString()}——钱不是当场到手，得等月底一并回款。${has(s, "side_hot") ? "你隐隐觉得，这事儿好像能做大。" : ""}` }; } },
    { id: "startup", name: "搞创业", emoji: "🚀", hours: 48, desc: "推进你的公司。押中那只看不见的风口才会爆发，押错就是举步维艰。需先立项。", hint: "🚀估值缓涨　❤️健康-4　😣压力+9　💸-1500（有营收可回血）",
      require: (s) => has(s, "startup") && !has(s, "startup_done") && !has(s, "ban_startup"), resolve: (s) => {
        const su = s.startup;
        // ★多赛道组合下注★：押的可能不止一个。押中当年隐藏风口(eraWind)的那个 → 起飞；
        // 押得越多越容易蒙中风口，但精力被摊薄(单个上限更低)。含「泡沫」赛道则额外暴雷风险。
        const tks = (su.tracks && su.tracks.length) ? su.tracks : (su.track ? [su.track] : []);
        const nT = Math.max(1, tks.length);
        const align = tks.indexOf(s.eraWind) >= 0;
        const bubbleN = tks.filter(n => { const t = (typeof trackByName === "function") ? trackByName(n) : null; return t && t.kind === "bubble"; }).length;
        const wp = windPayoff(s, align);
        const baseAbility = s.stats.knowledge * 0.45 + s.stats.strategy * 0.45 + s.network * 0.25;
        // 每周「黄掉」概率：押对风口+本事 → 低；押错/本事不济 → 高；押了泡沫赛道 → 额外加风险(注定要崩)。
        let collapseP = (align ? 0.0018 : 0.009) - statEdge(s, "strategy") * 0.006 - statEdge(s, "knowledge") * 0.004 - statEdge(s, "insight") * 0.003;
        collapseP += bubbleN * 0.004;                                            // 押中泡沫：每个 +0.4%/周
        if (su.cofounder) collapseP -= 0.0015;
        if (align && typeof windInsight === "function") collapseP -= windInsight(s) * 0.01;   // 读懂风口 → 押对时翻车风险更低
        if (has(s, "su_revenue") || has(s, "su_series_a")) collapseP *= 0.55;
        collapseP = Math.max(0.0008, collapseP);
        if (rnd(collapseP)) {
          const burstName = (bubbleN > 0) ? (tks.find(n => { const t = (typeof trackByName === "function") ? trackByName(n) : null; return t && t.kind === "bubble"; }) || tks[0]) : tks[0];
          s.startup = null; delete s.flags.startup; delete s.flags.chase_ipo;
          ["su_mvp", "su_users", "su_revenue", "su_series_a", "su_scale_ready", "su_funded"].forEach(f => delete s.flags[f]);
          flag(s, "startup_failed"); add(s, "mood", -15); add(s, "stress", 8); bumpMomentum(s, -10);
          return { log: bubbleN > 0
            ? `「${burstName}」的泡沫，到底还是破了。看着最火的风口，挤进去的人最多，崩起来也最惨——你的公司一夜归零。`
            : (align
              ? "这一周，公司说没就没了——核心团队一夜散伙/技术路线被巨头一脚踢翻。账上还有钱，可有些窟窿，钱填不平。创业，九死一生。"
              : "你押的赛道，凉了。市场不认这个故事，竞品后发先至把你拍在沙滩上。公司就这么黄了——风口押错，再多钱也是打水漂。"), mark: true };
        }
        // 押中风口才真长；押错则停滞甚至缩水。多押则摊薄(÷√n)：更易蒙中，但单个跑不快。
        let g = align ? Math.min(12, baseAbility * 0.26 + 1) : (baseAbility * 0.06 - 0.8);
        if (nT > 1) g = g / Math.sqrt(nT);
        if (su.cofounder) { g *= (1 + su.cofounder.skill / 220); add(s, "stress", -2); }
        su.progress = Math.max(0, su.progress + g);
        su.valuation = Math.round(su.progress * 1000 * wp * (1 + s.reputation / 100) * (1 + statEdge(s, "strategy") * 0.6));
        const burn = 1500 + (nT - 1) * 700, rev = has(s, "su_revenue") ? Math.round(900 + su.progress * 6) : 0;   // 多线烧钱更快
        add(s, "cash", rev - burn); add(s, "health", -4); add(s, "stress", 9); bumpMomentum(s, align ? 2 : -1);
        const hitTrack = align ? s.eraWind : tks[0];
        return { log: `又是连轴转的一周，白板写满又擦掉。项目${g >= 0 ? "往前挪了 +" + Math.round(g) : "不进反退 " + Math.round(g)}，估值来到 ¥${su.valuation.toLocaleString()}。你押的是「${tks.join("+")}」——${align ? `其中「${hitTrack}」正撞在风口上，市场认这个故事` : "可惜没一个撞上风口，市场不买账"}。${rev ? `（这周营收回血 ¥${rev.toLocaleString()}）` : ""}${align ? "" : "（押错了方向，该读读新闻、想想转型了）"}` };
      } },
    { id: "venture", name: "全职创业 · 进经营模式", emoji: "🚀", hours: 2, anyStage: true, hint: "进入周推进经营模式：产品/用户/团队/融资/跑道，赌一把上市或被收购",
      desc: "把后路一断，全身心扑进公司。进入经营模式：每周打磨产品、拉新、招人、融资、过冬，烧光跑道就出局，做大了就敲钟或被收购。",
      require: (s) => has(s, "startup") && !has(s, "startup_done") && !has(s, "ban_startup") && !(s.startup && s.startup.fulltime),
      resolve: (s) => ({ venture: true }) },
    { id: "invest", name: "投资理财", emoji: "📈", hours: 3, desc: "让钱生钱。看懂行情是稳健增值，看不懂就是给市场交一笔学费。要自己选赛道。", hint: "📈押中风口且趁早才赚；追高/押错会亏。一次下注后需歇几周",
      require: (s) => (!s._investCd || s.week - s._investCd >= 5) && !has(s, "ban_invest"),
      resolve: (s) => ({ event: "ev_invest_choose" }) },
    { id: "socialize", name: "社交应酬", emoji: "🤝", hours: 10, desc: "饭局、酒桌、混圈子。人脉是机会的入场券，代价是钱包和肝。", hint: "🤝人脉+　❤️健康-3　😣压力+4　💸-",
      resolve: (s) => { add(s, "network", 2 + Math.round(statEdge(s, "charm") * 12) + rnd(0.4) * 3); add(s, "cash", -Math.round(400 + Math.random() * 600)); add(s, "health", -3); add(s, "stress", 4); if (rnd(0.18 + statEdge(s, "charm") * 0.45)) flag(s, "got_lead"); let who = null; if (typeof socialCultivate === "function") who = socialCultivate(s, 5 + Math.round(statEdge(s, "charm") * 8)); return { log: `推杯换盏，烟雾缭绕。你记不清敬了多少酒、加了多少微信${who ? `，和「${who.role}${who.name}」走得更近了` : ""}。第二天头疼欲裂，但通讯录又厚了一截。${has(s, "got_lead") ? "席间，有人压低声音透露了一个机会……" : ""}` }; } },
    { id: "leisure", name: "找点乐子", emoji: "🎮", hours: 6, anyStage: true, desc: "忙里偷闲：和楼下大爷下棋、去酒吧玩骰子、逛游乐园、野钓、打球……解压又能遇见人和故事。", hint: "🙂心情+　😣压力-　偶有奇遇",
      resolve: (s) => ({ leisure: true }) },
    { id: "date", name: "谈恋爱", emoji: "❤️", hours: 10, anyStage: true, require: (s) => !has(s, "married") && s.age < 70, desc: "认识新的人、追求心动对象、经营感情。一切，得先从遇见开始。",
      resolve: (s) => {
        if (has(s, "partner")) { add(s, "mood", 5); add(s, "cash", -Math.round(300 + Math.random() * 500)); return { log: "你们窝在一起看了场电影，分享同一桶爆米花，为同一个烂梗笑出声。平凡的一周，却是这段日子里最暖的底色。" }; }
        if (s.crush) return { event: "ev_pursue" };       // 已有看对眼的对象 → 追求
        return { event: "ev_meet" };                       // 还没遇到 → 先遇见一个心动的人
      } },
    { id: "exercise", name: "健身养生", emoji: "🏃", hours: 6, desc: "恢复健康、给压力泄洪。年轻人嫌浪费时间，中年人才懂它的金贵。", hint: "❤️健康+5　😣压力-12　（可抵消加班/创业的压力）",
      resolve: (s) => { add(s, "health", has(s, "starving") ? 0 : 5); add(s, "stress", -12); add(s, "body", 1); return { log: has(s, "starving") ? "你逼自己出了身汗，可饿着肚子，怎么练也补不回亏空的身体——汗水带走了点烦躁，却带不来力气。" : "你逼着自己出了几身透汗。肌肉酸胀，脑子却前所未有地清醒，那点积压的烦躁，被汗水冲走了大半。" }; } },
    { id: "browse", name: "刷手机看新闻", emoji: "📱", hours: 4, desc: "翻完一整屏新闻和热搜，泡论坛。想看清时代的风往哪吹，就得自己读、自己悟。",
      resolve: (s) => { add(s, "insight", 1); flag(s, "read_news"); return { phone: true }; } },
    { id: "rest", name: "躺平休息", emoji: "🛋️", hours: 12, desc: "什么都不干，把自己交还给沙发。回血，回心情。", hint: "❤️健康+3　🙂心情+4　😣压力-10",
      resolve: (s) => { add(s, "health", has(s, "starving") ? 0 : 3); add(s, "mood", 4); add(s, "stress", -10); return { log: has(s, "starving") ? "你瘫在沙发上，可空荡荡的肚子和见底的银行卡，让这份「躺平」一点也不踏实——歇得了心，养不回身子。" : "你把一切都推开，窗帘一拉睡到自然醒，外卖配着剧，手机刷到没电。世界照样转，但这一周，只属于你自己。" }; } },
    { id: "parenting", name: "鸡娃育儿", emoji: "🍼", hours: 16, anyStage: true, desc: "陪伴、辅导孩子。烧钱烧精力，却也亲手决定着下一代的起点。",
      require: (s) => has(s, "has_kid"), resolve: (s) => { add(s, "mood", 3); add(s, "cash", -Math.round(2000 + Math.random() * 3000)); s.kidEdu = (s.kidEdu || 0) + 1; if (typeof familyNudge === "function") familyNudge(s, { coParent: 5, conflict: 2, bond: 1 }); return { log: "你盯着孩子写作业，从「这么简单都不会」一路飙到血压拉满。补习班的账单又厚了一沓，可看着 ta 把那道题终于解出来，你心里那点火，又莫名其妙地灭了。" }; } },
    { id: "hobby", name: "培养爱好", emoji: "🎣", hours: 8, desc: "钓鱼、书法、广场舞……老有所乐，给晚年添一抹颜色。",
      resolve: (s) => { add(s, "mood", 5); add(s, "health", has(s, "starving") ? 0 : 2); return { log: "你一头扎进自己的爱好里，时间快得像被谁偷走。那种不为名不为利的纯粹快乐，奔波了大半辈子，如今才有空细细品。" }; } },
    { id: "grandkids", name: "含饴弄孙", emoji: "👶", hours: 8, require: (s) => has(s, "has_kid"), desc: "天伦之乐，幸福与健康双收。",
      resolve: (s) => { add(s, "mood", 6); add(s, "health", 2); if (typeof familyNudge === "function") familyNudge(s, { bond: 3, conflict: -2, coParent: 2 }); return { log: "小家伙在你腿上爬上爬下，奶声奶气地喊你。阳光斜斜地照进来，那一刻，你大半生的奔波好像都有了去处。" }; } },
    { id: "family", name: "陪伴家人", emoji: "🏡", hours: 6, desc: "亲情是心力的底色，长期忽视，老了只剩孤独。",
      resolve: (s) => { add(s, "mood", 4); flag(s, "warm_family"); if (typeof familyNudge === "function") familyNudge(s, { bond: 4, conflict: -3, coParent: has(s, "has_kid") ? 2 : 0 }); if (typeof socialBoostRole === "function") socialBoostRole(s, "爸妈", 5); if (typeof socialCultivate === "function") socialCultivate(s, 5, 1); return { log: "一家人围着饭桌，聊些不咸不淡的家常，电视里放着没人认真看的节目。没有惊喜，但这份踏实，是再多钱也买不来的。" }; } },
    { id: "companion", name: "陪伴爱人", emoji: "💑", hours: 6, anyStage: true, require: (s) => has(s, "married") || has(s, "partner"),
      desc: "推掉应酬，把时间留给枕边人。感情是焐出来的，不是放着就有的。", hint: "🙂心情+　😣压力-",
      resolve: (s) => { add(s, "mood", 6); add(s, "stress", -5); const ta = s.partnerName || "ta"; if (typeof familyNudge === "function") familyNudge(s, { bond: 6, conflict: -5 }); if (typeof socialShift === "function") socialShift(s, 1); return { log: "你陪" + ta + "买菜做饭、散步唠嗑，过了个寻常又安心的周末。柴米油盐里，藏着最长情的告白。" }; } },
    { id: "petcare", name: "陪伴宠物", emoji: "🐾", hours: 5, anyStage: true, require: (s) => has(s, "has_pet"),
      desc: "铲屎、遛弯、撸到它咕噜咕噜。毛孩子治愈起人来比谁都管用。", hint: "🙂心情+　❤️健康+　😣压力-",
      resolve: (s) => { add(s, "mood", 5); add(s, "health", 2); add(s, "stress", -6); return { log: "你给毛孩子铲了屎、遛了弯，被它蹭得满身毛。一天的疲惫，被那点温热的依赖治愈了大半。" }; } },
    { id: "civilwork", name: "钻研业务 · 跑关系", emoji: "🗂️", hours: 14, anyStage: true, require: (s) => has(s, "civil_servant"),
      desc: "材料堆里熬、酒桌上陪、领导面前露脸。体制内的进步靠的就是这些看不见的功夫。", hint: "⭐声誉+　🤝人脉+　😣压力+",
      resolve: (s) => { add(s, "reputation", 2); add(s, "network", 2); add(s, "stress", 3); add(s, "strategy", 1); if (rnd(0.1)) add(s, "insight", 2); return { log: "你把材料改到第八版，又赶了三场饭局。仕途这盘棋，落子无声，却步步是功夫。" }; } },
    { id: "charity", name: "慈善 · 回馈社会", emoji: "🎗️", hours: 6, anyStage: true, require: (s) => classTier(s) >= 3,
      desc: "捐资助学、做公益、回馈乡梓。钱到了一定份上，名声和心安比数字更要紧。", hint: "⭐声誉++　🙂心情+　💸捐款",
      resolve: (s) => { const amt = Math.max(3000, Math.round((s.cash > 0 ? s.cash : 0) * 0.008)); add(s, "cash", -amt); add(s, "reputation", 4); add(s, "mood", 5); if (typeof socialShift === "function") socialShift(s, 3); return { log: "你捐了 ¥" + amt.toLocaleString() + " 做公益，还上了本地新闻的豆腐块。钱花得值，夜里也睡得踏实。" }; } },
    { id: "eliteclub", name: "高端圈层 · 人脉局", emoji: "🥂", hours: 10, anyStage: true, require: (s) => classTier(s) >= 3,
      desc: "高尔夫、私人会所、慈善晚宴。富人的圈子门票很贵，但里面全是机会。", hint: "🤝人脉++　⭐声誉+　💸不菲",
      resolve: (s) => { const cost = Math.round(8000 + Math.random() * 22000); add(s, "cash", -cost); add(s, "network", 5); add(s, "reputation", 3); add(s, "stress", 2); return { log: "一场私人会所的局，你又混了个脸熟，递出去十几张名片。这桌人脉，花 ¥" + cost.toLocaleString() + " 不算贵。" }; } },
    { id: "localize", name: "融入异乡", emoji: "🌐", hours: 8, anyStage: true, require: (s) => has(s, "overseas"),
      desc: "逛社区市集、和邻居寒暄、过当地的节日。漂在异国，得自己挣一份归属感。", hint: "✨魅力+　🤝人脉+　🙂心情+",
      resolve: (s) => { add(s, "charm", 1); add(s, "network", 3); add(s, "insight", 1); add(s, "mood", 3); return { log: "你学着像当地人一样生活——赶集、寒暄、过他们的节。异乡的疏离，被这些琐碎一点点焐热。" }; } },
    { id: "homecare", name: "操持家业", emoji: "🏠", hours: 6, anyStage: true, require: (s) => has(s, "has_house"),
      desc: "侍弄花草、收拾屋子、打理(或出租)名下的房产。有恒产者，方有恒心。", hint: "🙂心情+　可能有租金进账",
      resolve: (s) => { const rent = rnd(0.5) ? Math.round(2500 + Math.random() * 4500) : 0; if (rent) add(s, "cash", rent); add(s, "mood", 4); add(s, "stress", -3); return { log: rent ? "你打理着名下的房子，这月收了 ¥" + rent.toLocaleString() + " 房租。睡后收入的滋味，谁尝谁知道。" : "你侍弄花草、擦窗扫地，给家添了点暖意。有套自己的窝，心里就有底。" }; } }
  ];

  /* ============================ 五、风口（隐藏）& 新闻 ============================
   * eraWind 由真实年份决定，但【不直接显示】。玩家只能从新闻里推断。
   * 创业/投资选赛道(track) 与隐藏 eraWind 一致才爆发。
   */
  // 历史 + 2026 后的未来基本面（AI→机器人→聚变→老龄化→脑机→太空）。纯属对趋势的推演设定。
  const windTimeline = [
    { to: 1999, wind: "下海经商" }, { from: 2000, to: 2007, wind: "房地产" },
    { from: 2008, to: 2012, wind: "电商" }, { from: 2013, to: 2017, wind: "移动互联网" },
    { from: 2018, to: 2020, wind: "短视频直播" }, { from: 2021, to: 2023, wind: "新能源" },
    { from: 2024, to: 2028, wind: "AI大模型" }, { from: 2029, to: 2033, wind: "具身智能" },
    { from: 2034, to: 2039, wind: "聚变能源" }, { from: 2040, to: 2046, wind: "银发经济" },
    { from: 2047, to: 2054, wind: "脑机接口" }, { from: 2055, wind: "太空经济" }
  ];
  function windAt(year) { for (const w of windTimeline) if ((w.from === undefined || year >= w.from) && (w.to === undefined || year <= w.to)) return w.wind; return windTimeline[windTimeline.length - 1].wind; }
  const INVEST_TRACKS = ["房地产", "电商", "移动互联网", "短视频直播", "新能源", "AI大模型", "具身智能", "聚变能源", "银发经济", "脑机接口", "太空经济", "比特币", "下海经商"];

  /* 新闻文章（手机新闻流）：每条 {source 来源, headline 标题, body 正文(2-3句沉浸文案), signal, wind?, hot?}。
   * signal:true 且 wind===当年风口 = 真信号（同一风口有多条，攒在一起才看得出趋势）；
   * signal:false = 噪音/反指标/误导（含 wind 的是「诱饵赛道」，专门骗人押错）。
   * 风口不直接告诉玩家，要你在一屏新闻里自己嗅出"大家都在聊什么"。
   * ★Codex 可大量扩充，每个 wind 多写几条不同角度的，噪音也多写★ */
  const newsArticles = [
    // —— 下海经商 ——
    { wind: "下海经商", signal: true, source: "时代周刊", headline: "停薪留职潮起：他们辞掉铁饭碗，南下了", body: "越来越多体制内的人选择「下海」，沿海遍地是机会。有人摆摊三个月赚出别人三年的工资，也有人血本无归。「撑死胆大的，饿死胆小的」成了街头巷尾的口头禅。" },
    { wind: "下海经商", signal: true, source: "街边见闻", headline: "「万元户」越来越多了", body: "隔壁王叔承包了厂里的小卖部，一个月流水顶你爸半年工资。亲戚饭桌上聊的，全是谁谁谁又「下海」发了财。" },
    // —— 房地产 ——
    { wind: "房地产", signal: true, source: "楼市观察", headline: "新盘开盘即售罄，售楼处彻夜排队", body: "黄牛号炒到五位数，「早买早赚、晚买站岗」的说法疯传。丈母娘们默契地把「有房」列进了相亲硬指标。" },
    { wind: "房地产", signal: true, source: "财经早班车", headline: "专家：过去十年，房子跑赢了一切理财", body: "一线城市房价翻了好几倍，有人靠几套房实现财富自由，租金躺着收。年轻人挤破头也要上车。" },
    // —— 电商 ——
    { wind: "电商", signal: true, source: "商业纵横", headline: "网购节单日成交破纪录，快递员累瘫", body: "零点一过，下单声此起彼伏，仓库爆仓、包裹堆成山。越来越多人辞职开网店，「在家就能创业」成了新风潮。" },
    { wind: "电商", signal: true, source: "创业邦", headline: "大学生开网店月入十万的故事又火了", body: "一台电脑、一根网线，似乎人人都能分一杯羹。当然，故事里没说的是，更多的店三个月就关了。" },
    // —— 移动互联网 ——
    { wind: "移动互联网", signal: true, source: "科技前哨", headline: "又一款 App 估值过亿，资本疯狂涌入", body: "几个年轻人凑在车库里写了个 App，就拿到了天使轮。「只要用户涨得够快，亏钱也能融资」成了行业共识。" },
    { wind: "移动互联网", signal: true, source: "极客公园", headline: "地铁里没人看报纸了，全在戳屏幕", body: "智能机人手一部，应用商店遍地黄金。开发者说，这是个「做什么都有人用」的黄金时代。" },
    // —— 短视频直播 ——
    { wind: "短视频直播", signal: true, source: "热搜榜", headline: "全民直播带货，「家人们」喊麦声此起彼伏", body: "素人一夜涨粉百万的神话每天上演。手机一架、补光灯一开，仓库管理员都能转型当主播。" },
    { wind: "短视频直播", signal: true, source: "新榜", headline: "短视频日活再创新高，注意力都在小屏幕上", body: "十五秒一个视频，刷起来根本停不下来。品牌方把预算大把砸向头部主播，一场直播抵半年广告。" },
    // —— 新能源 ——
    { wind: "新能源", signal: true, source: "产业前线", headline: "新能源车销量翻倍，充电桩一桩难求", body: "路上的绿牌越来越多，加油站生意却冷清了。资本扎堆涌入电池与智驾，相关岗位薪资水涨船高。" },
    { wind: "新能源", signal: true, source: "汽车之声", headline: "传统油车 4S 店关了一片", body: "曾经排队提车的合资品牌，如今门可罗雀。销售们纷纷跳槽去卖电车，说那边「钱景」明朗。" },
    // —— AI大模型 ——
    { wind: "AI大模型", signal: true, source: "硅基观察", headline: "大模型混战白热化，码农忙着 All in AGI", body: "一夜之间所有公司都说自己在做 AI。会写两句 Prompt 的人身价翻倍，不会用 AI 的人开始焦虑。" },
    { wind: "AI大模型", signal: true, source: "知乎热榜", headline: "「你的工作会被 AI 取代吗」冲上热搜", body: "有人用 AI 一天干完一周的活，也有人因此被优化。讨论区吵成一锅粥，但没人否认：风，确实往这边吹。" },
    // —— 具身智能 ——
    { wind: "具身智能", signal: true, source: "未来日报", headline: "人形机器人进厂打工，蓝领瑟瑟发抖", body: "流水线上机器人灵巧地拧着螺丝，不吃饭不抱怨。厂长笑得合不拢嘴，工人们却开始盘算退路。" },
    { wind: "具身智能", signal: true, source: "智造前沿", headline: "家政机器人开始进入普通家庭", body: "扫地、做饭、带娃，一台顶仨保姆。中产家庭争相尝鲜，相关公司估值一飞冲天。" },

    // —— 噪音 / 反指标 / 诱饵（任何年份都可能出现，专门干扰判断）——
    { signal: false, source: "反诈中心", headline: "警惕「稳赚不赔」：又一批人血本无归", body: "近期多起投资骗局曝光，受害者动辄倾家荡产。但凡承诺「保本高息」的，十有八九是陷阱。" },
    { signal: false, source: "娱乐头条", headline: "某顶流塌房，热搜服务器再次瘫痪", body: "吃瓜群众连夜赶到，评论区已盖到几十万层。与你的人生……大概毫无关系。" },
    { signal: false, source: "民生观察", headline: "专家建议年轻人「少买房多消费」", body: "专家的话又一次引爆评论区。有人怒怼「站着说话不腰疼」，有人默默关掉了手机。" },
    { signal: false, source: "韭菜互助会", headline: "神秘「老师」群内喊单：这只票闭眼买", body: "群里红包雨不断，老师信誓旦旦保证翻倍。先上车的人在晒收益截图——至于真假，只有天知道。" },
    { signal: false, source: "天气台", headline: "今夏格外炎热，雪糕和空调卖断货", body: "连续高温橙色预警，街上行人寥寥。便利店老板说，今年的冰柜从没这么空过。" },
    { signal: false, source: "鸡汤日报", headline: "「躺平」还是「内卷」？这届年轻人选择了……", body: "一篇刷屏长文又在贩卖焦虑。看完你点了个赞，然后继续该干嘛干嘛。" },
    { signal: false, source: "财经夜读", headline: "某热门赛道惊现泡沫，投资人开始撤退", body: "曾被疯抢的项目如今无人问津，估值腰斩再腰斩。「风口上的猪，风停了摔得最惨」。" },
    { signal: false, wind: "比特币", source: "币圈快讯", headline: "比特币又双叒暴涨，有人一夜暴富", body: "K 线绿得发光，群里全是「梭哈」的吆喝。也有人冷笑：上一波抄底的，坟头草都三米高了。" },
    { signal: false, source: "本地新闻", headline: "市中心新开一家网红奶茶店，排队两小时", body: "据说一杯难求，代购加价到三位数。等你挤进去，店员说：今日已售罄。" },

    // —— 未来风口信号（2026+）：聚变 / 银发 / 脑机 / 太空 ——
    { wind: "聚变能源", signal: true, source: "能源观察", headline: "可控核聚变首次并网，电价应声跳水", body: "「人造太阳」点亮了一座城市，电费便宜到能随便开空调。重工业、数据中心争相往聚变电站旁边搬。" },
    { wind: "聚变能源", signal: true, source: "产业前线", headline: "聚变概念股集体涨停，资本跑步进场", body: "曾经被嘲笑「永远还差五十年」的聚变，突然成了最性感的赛道。懂行的人说，这次是真的。" },
    { wind: "银发经济", signal: true, source: "人口纵览", headline: "老龄化加深，养老产业成新蓝海", body: "适老化改造、智慧养老院、银发旅游团一床难求。有人感叹：年轻人越来越少，老年人的生意越来越好做。" },
    { wind: "银发经济", signal: true, source: "财经早班车", headline: "「60 岁网红」走红，银发消费力被低估", body: "退休大爷大妈不仅有钱有闲，还很舍得花。盯上他们钱包的公司，估值一个比一个高。" },
    { wind: "脑机接口", signal: true, source: "硅基观察", headline: "脑机接口进入临床，意念打字成真", body: "瘫痪患者靠「想」就能操控屏幕。科技圈沸腾了，有人已经在畅想「记忆上传」的那一天。" },
    { wind: "脑机接口", signal: true, source: "未来日报", headline: "「意念游戏」体验店一座难求", body: "戴上设备，闭眼即入虚拟世界。年轻人排队尝鲜，伦理学家却忧心忡忡。" },
    { wind: "太空经济", signal: true, source: "星际财经", headline: "近地轨道工厂量产，太空旅游开始平民化", body: "火箭发射像公交一样密集，太空采矿不再是科幻。新的淘金热，这次在头顶上。" },
    { wind: "太空经济", signal: true, source: "产业前线", headline: "卫星互联网覆盖全球，偏远山区也能高速上网", body: "抬头是漫天的卫星，低头是飞速的网。相关供应链上的小公司，订单接到手软。" },

    // —— 未来噪音 / 反指标 ——
    { signal: false, source: "情感观察", headline: "「不婚不育」成主流，相亲角冷清了", body: "公园角落里，举着征婚牌的父母越来越少。年轻人说：一个人也挺好。" },
    { signal: false, source: "民生热线", headline: "延迟退休再引热议，「干到几岁」上热搜", body: "有人调侃：等我退休，怕是得让机器人推着轮椅去打卡。评论区一片哀嚎。" },
    { signal: false, source: "国际频道", headline: "地区局势再度紧张，油价剧烈波动", body: "远方的冲突牵动着每个人的钱包。专家说影响有限，可超市里的食用油又悄悄涨了价。" }
  ];

  /* ============================ 六、事件 (Events / 视觉小说) ============================
   * VN 风格：title + 详细 text(s)（可按 阶段/阶级 返回不同文案）+ choices。
   * 由行动 resolve 返回 {event:id} 触发，或引擎每周从 ambient 池随机触发。
   * choice.effect(s) 返回结果文案（进人生回顾）。改数值用 add()，标记 flag()。
   * ★同种事件按 classTier(s) 给出不同 NPC 态度/结果 → byClass()★
   *
   * ★v0.3.2 多级分支★：choice 可以是
   *   - 终止项：{ label, effect:(s)=>"结果文案" }  → 应用并结束事件
   *   - 分支项：{ label, enter?:(s)=>{副作用}, next:(s)=> 节点 }  → 进入下一层，展开更多选项
   *   节点 = { text:(s)=>"...", choices:[ ...更多 choice ] }，可无限嵌套。
   */
  function shuf(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // 投资下注：选完赛道后再选下注比例，押中隐藏风口才爆发
  function resolveBet(s, tk, frac) {
    // 单注绝对上限（实际约 300 万/注，随物价名义上浮）：押对风口仍是正期望，但富翁无法把整笔身家
    // 一把把滚雪球——杜绝「上市拿大本金后反复押中风口→指数级溢出到天文数字」的复利漏洞。
    const betCap = 3000000 * (s.world ? s.world.priceIndex : 1);
    const bet = Math.round(Math.min(s.cash * frac, betCap));
    if (bet <= 0) return "你翻了翻钱包，比脸还干净，这注最终没下成。";
    add(s, "cash", -bet);   // 本金当场投出（被锁仓）
    const align = tk === s.eraWind; const wp = windPayoff(s, align);
    // 押中风口也有真实下行波动（不再「数学上稳赚」）：只有趁早(热度低、wp高)才是正期望，
    // 追高/押错都会亏。配合冷却，杜绝「读新闻=无限复利暴富」。
    // 谋略加成：会算账、懂博弈的人，同样一注的回报明显更高、被割概率更低。
    const sEdge = (typeof statEdge === "function" ? statEdge(s, "strategy") : 0);
    const insight = (align && typeof windInsight === "function") ? windInsight(s) : 0;   // 读懂新闻押对风口 → 真实收益加成
    const luck = (align ? (0.5 + Math.random() * wp * 0.72) : (0.3 + Math.random() * 0.95)) + sEdge * 0.55 + insight;
    s._investCd = s.week;   // 投资冷却：杜绝每周重仓无脑复利
    const ret = Math.round(bet * luck);
    add(s, "insight", 1);
    // ★赚钱需要时间出结果★：盈亏不当场兑现，挂进待结队列，3~8 周后由 tickWorld 揭晓并回款。
    const delay = 3 + Math.floor(Math.random() * 6);
    s._pendingBets = s._pendingBets || [];
    s._pendingBets.push({ tk: tk, bet: bet, ret: ret, due: s.week + delay, align: align });
    return `你把 ¥${bet.toLocaleString()} 押进了「${tk}」。钱已投出、本金锁住——盈亏不会当场见分晓，市场要过些日子才给你答案。接下来，只能等。`;
  }
  function betNode(tk) {
    return { text: (s) => `你决定押「${tk}」。手里还有 ¥${Math.round(s.cash).toLocaleString()}，这一把，下多重的注？`, choices: [
      { label: "小赌怡情（约一成身家）", effect: (s) => resolveBet(s, tk, 0.1) },
      { label: "重仓出击（约四成身家）", effect: (s) => resolveBet(s, tk, 0.4) },
      { label: "梭哈！（八成身家压上）", effect: (s) => resolveBet(s, tk, 0.8) }
    ] };
  }
  // —— 恋爱：先遇见心动对象（前因），再追求（后果）——
  const NAMES = { 男: ["Alex", "陈屿", "林深", "周晏", "顾远", "江野"], 女: ["Anna", "苏念", "林小满", "周遭", "夏微", "白鹭"] };
  const MET_SCENE = ["朋友的聚会上", "加班的深夜便利店", "图书馆同一排书架前", "通勤的地铁里", "一场暴雨的同一个屋檐下", "公司团建的角落"];
  const CRUSH_TRAIT = ["笑起来有梨涡", "话不多但很会听", "永远风风火火", "温柔得像三月的风", "毒舌但心软", "聊起热爱的事会发光"];
  // 心动对象的性别：默认异性（开局可选性别）；引擎在创建时写入 s.gender
  function crushGender(s) {
    const o = s.orientation || "异";
    if (o === "双") return Math.random() < 0.5 ? "男" : "女";   // 双性恋：男女皆可
    if (o === "同") return s.gender;                            // 同性恋：同性
    return s.gender === "女" ? "男" : "女";                     // 异性恋：异性
  }
  function makeCrush(s) { const g = crushGender(s); return { name: pick(NAMES[g]), gender: g, trait: pick(CRUSH_TRAIT), favor: 8 + Math.floor(Math.random() * 6) }; }
  // 创业选赛道：候选里混着「当年真风口 + 著名泡沫 + 长青小众」，kind 隐藏，要玩家自己甄别；
  // 可只押一个，也可【组合下注】押多个分散风险(更易押中风口，但精力被摊薄、上限更低)。→ 再选启动资金。
  function startupCandidates(s) {
    // ★批次8：首次创业的赛道从【经历】里长出来——生成机会卡，按来源/成本/风险呈现（doc §8）。
    // 二次及以后创业（已有创业经历）回退到自由选赛道。
    if (typeof generateOpportunities === "function" && !has(s, "ever_founded")) {
      const cards = generateOpportunities(s);
      if (cards && cards.length >= 2) {
        s._oppMap = {}; cards.forEach(c => { s._oppMap[c.trackName] = c; });
        return cards.map(c => { const t = (typeof trackByName === "function") ? trackByName(c.trackName) : null; return t || { name: c.trackName, emoji: c.emoji, vibe: "" }; });
      }
    }
    if (typeof STARTUP_TRACKS === "undefined") return shuf([s.eraWind, ...shuf(INVEST_TRACKS.filter(t => t !== s.eraWind)).slice(0, 4)]).map(n => ({ name: n, emoji: "🚀", vibe: "" }));
    const windT = (typeof trackByName === "function" && s.eraWind) ? trackByName(s.eraWind) : null;
    const bubbles = shuf(STARTUP_TRACKS.filter(t => t.kind === "bubble")).slice(0, 3);
    const stable = shuf(STARTUP_TRACKS.filter(t => t.kind === "evergreen" || t.kind === "niche")).slice(0, 2);
    return shuf([windT].concat(bubbles, stable).filter(Boolean));
  }
  function startupNode(s) {
    s._suPick = []; s._suPool = startupCandidates(s).map(t => t.name);
    return suPickNode(s);
  }
  function suPickNode(s) {
    const picked = s._suPick || [];
    const cands = (s._suPool || []).map(n => (typeof trackByName === "function" ? trackByName(n) : null) || { name: n, emoji: "🚀", vibe: "" }).filter(t => picked.indexOf(t.name) < 0);
    const txt = picked.length
      ? `下海创业。已押：${picked.join(" + ")}。\n可以就押这些，也可以再加一个组合下注分散风险——但押得越多，精力越分散，单个的上限也越低。`
      : "你决定下海创业——可赛道选错，再拼命也是白搭，看着火的未必真火，看着冷的也许正憋着大招。你打算押哪个方向？（可只押一个，也可组合押多个）";
    const _tr = (typeof knownTrendsText === "function") ? knownTrendsText(s) : "";
    const _oppIntro = (s._oppMap && !picked.length) ? "\n💡 这些机会，是从你这一路的经历里长出来的——不是菜单上凭空的选项。" : "";
    const txt2 = txt + _oppIntro + (_tr ? `\n📡 你从新闻里嗅到的趋势：${_tr}——押赛道前，不妨对照着想想。` : "");
    const choices = cands.map(t => {
      const opp = s._oppMap && s._oppMap[t.name];   // ★批次8：机会卡 → 标注来源/启动成本/风险
      const label = opp
        ? `${t.emoji} ${t.name}　<span style="opacity:.8">（来源：${opp.source}）</span>\n　💸启动约 ¥${opp.initialCost.toLocaleString()}　⚠️风险：${opp.risk}　潜力：${opp.potential}`
        : `${t.emoji} ${t.name}${t.vibe ? "　—　" + t.vibe : ""}`;
      return { label, enter: (s) => { (s._suPick = s._suPick || []).push(t.name); }, next: (s) => suPickNode(s) };
    });
    if (picked.length >= 1) choices.unshift({ label: `✅ 就押这些（${picked.length} 个赛道），开干 →`, next: (s) => startupFundNode(s) });
    if (picked.length >= 3) return { text: () => `下海创业。已押：${picked.join(" + ")}。三路齐下，野心不小——但摊子铺得越大，越考验你的本事。`, choices: [{ label: `✅ 三路齐下，开干 →`, next: (s) => startupFundNode(s) }] };
    if (!picked.length) choices.push({ label: "想想还是算了", effect: (s) => { add(s, "insight", 2); s._suPick = null; s._suPool = null; return "你最终没敢迈出那一步。也许是怂，也许是清醒。"; } });
    return { text: () => txt2, choices };
  }
  function startupFundNode(s) {
    const tracks = (s._suPick || []).slice(); if (!tracks.length) tracks.push(s.eraWind || INVEST_TRACKS[0]);
    s._suPick = null; s._suPool = null;
    const label = tracks.join(" + ");
    const setup = (loan) => { flag(s, "startup"); flag(s, "ever_founded"); s.startup = { progress: loan ? 9 : 5, valuation: 0, tracks: tracks.slice(), track: tracks[0], foundedAge: s.age, foundedWeek: s.week, fromOpp: (s._oppMap && s._oppMap[tracks[0]]) ? s._oppMap[tracks[0]].source : null }; s._oppMap = null; flag(s, "risk_hustle"); if (loan) { flag(s, "has_loan"); add(s, "cash", 300000); add(s, "stress", 10); } if (typeof rememberFact === "function") rememberFact(s, { id: "first_venture", once: true, type: "opportunity", text: `创业立项：押「${tracks.join("+")}」。`, tags: ["opportunity", "venture"], intensity: 3 }); };
    return { text: () => `押定「${label}」。启动资金，怎么来？`, choices: [
      { label: "花自己的积蓄，稳一点", effect: (s) => { setup(false); return `你押的是「${label}」。掏出多年积蓄起步，谨慎而踏实——船小，但好调头。`; } },
      { label: "找银行贷款，借鸡生蛋（+¥30万，但每月要还）", effect: (s) => { setup(true); return `你押的是「${label}」，还背上一笔贷款。账上一下宽裕，项目跑得更快——可每月的还款，从此像悬在头顶的剑。`; } }
    ] };
  }

  const events = [];

  const commitments = {};   // 留学/跨年承诺子系统已移除

  /* 每个大阶段进入时触发的「明确选择」事件 */
  const stageDecisions = { youth: "ev_dec_youth", hustle: "ev_dec_hustle", midlife: "ev_dec_midlife", senior: "ev_dec_senior" };

  /* ============================ 七、暗伤 / 慢性病（压力+透支累积） ============================ */
  const ailments = [
    { id: "insomnia", name: "慢性失眠", threshold: 35, deathMod: 0.15, desc: "长期高压熬夜。" },
    { id: "stomach", name: "老胃病", threshold: 65, deathMod: 0.2, desc: "外卖与应酬喂出来的。" },
    { id: "hypertension", name: "三高", threshold: 100, deathMod: 0.45, desc: "中年标配，随时引爆。" },
    { id: "burnout", name: "重度抑郁", threshold: 135, deathMod: 0.6, desc: "心力彻底透支，最危险。" },
    { id: "sti_mild", name: "亲密接触感染", threshold: 9999, deathMod: 0.08, desc: "高风险亲密关系留下的麻烦，及时治疗通常可控。" },
    { id: "sti_chronic", name: "慢性病毒感染", threshold: 9999, deathMod: 0.25, desc: "需要长期复查和治疗，情绪与亲密关系都会受影响。" },
    { id: "immuno_severe", name: "免疫系统重症", threshold: 9999, deathMod: 1.2, desc: "严重感染风险显著上升，长期拖延可能危及生命。" }
  ];

  /* ============================ 八、结局 (Endings)：每周概率判定 ============================
   * 引擎每周遍历 endings：cond(s) 满足时，以 prob(s) 概率触发。优先级从上到下。
   * 「死亡」是其中一类（受健康/年龄/暗伤影响）。title 用于结算称号。
   */
  // ★结局只能是「死亡」★（每周概率判定，prob 必须很小）。
  // IPO/移民/破产不是死亡 → 改为「人生大事件」(ambient events)，发生后人生继续，享年才名副其实。
  const endings = [
    { id: "suddendeath", title: "💀 过劳猝死", cond: (s) => has(s, "risk_hustle") && s.age >= 38 && s.health < 26 && s.ailmentIds.length >= 2, prob: (s) => 0.0022,
      text: () => "又一个加班的深夜，你趴在桌上再没醒来。讣告里写着「热爱工作」。" },
    { id: "depression_end", title: "🕳️ 心力枯竭", cond: (s) => s.ailmentIds.includes("burnout") && s.mood < 14 && (s._moodLowWeeks || 0) >= 16, prob: (s) => 0.004,
      text: () => "你赢了很多，却在一个再普通不过的雨夜，悄悄熄灭了。" },
    { id: "natural", title: "🍵 寿终正寝", cond: (s) => s.age >= 80, prob: (s) => 0.04 + (s.age - 80) * 0.02,
      text: (s) => s.mood > 55 ? "在儿孙绕膝的午后，你在藤椅上安详睡去。圆满的一生。" : "你走完了这一生，身边有些冷清。" }
    // 其余普通死亡由引擎 rollDeath() 兜底（受健康/年龄/暗伤）
  ];

  /* ============================ 九、结算称号（多轴） ============================ */
  const titles = [
    { name: "🐉 天龙人", cond: (s) => (s.cash + s.assets) > 20000000 && s.mood > 50 },
    { name: "🔔 上市传奇", cond: (s) => has(s, "chase_ipo") && has(s, "startup_done") },
    { name: "🛫 移民他乡", cond: (s) => has(s, "emigrated") },
    { name: "🐦 浴火重生", cond: (s) => has(s, "been_bankrupt") && (s.cash + s.assets) > 800000 },
    { name: "💀 英年早逝的赌徒", cond: (s) => s.age < 45 && (s.cash + s.assets) > 2000000 },
    { name: "🏚️ 孤独的富豪", cond: (s) => (s.cash + s.assets) > 5000000 && s.mood < 30 },
    { name: "🧘 大彻大悟的隐者", cond: (s) => s.mood > 75 && (s.cash + s.assets) < 1000000 },
    { name: "🛵 草根逆袭", cond: (s) => has(s, "fallen") && (s.cash + s.assets) > 2000000 },
    { name: "📉 时代的接盘侠", cond: (s) => has(s, "got_scammed") && (s.cash + s.assets) < 300000 },
    { name: "😶 平凡的一生", cond: () => true }
  ];

  /* ============================ 十、内容板块登记表（给 Codex） ============================ */
  const EVENT_MODULES = [
    { id: "career", name: "职场/打工/创业内卷", stages: ["youth", "hustle", "midlife"], note: "PUA、996、画饼、裁员、升职、跳槽。NPC态度随阶级强烈偏差。", target: 40 },
    { id: "love", name: "恋爱/婚姻/情感", stages: ["youth", "hustle", "midlife"], note: "表白、相亲、彩礼、婚变、暧昧。穷富两种世界。", target: 35 },
    { id: "money", name: "理财/暴富暴亏/赛道", stages: ["hustle", "midlife", "senior"], note: "押风口、买房、炒股、币圈、被割。需玩家凭新闻判断。", target: 30 },
    { id: "startup", name: "创业里程碑", stages: ["hustle", "midlife"], note: "立项、融资、竞品、收购、IPO、倒闭。结局分支。", target: 30 },
    { id: "era", name: "时代大事件/新闻线索", stages: ["*"], note: "按年份触发；并产出隐藏风口的新闻线索（真信号+噪音）。", target: 40 },
    { id: "absurd", name: "纯抽象荒诞/玄学", stages: ["*"], note: "中彩票、算命、UFO、穿越、一夜爆红。越离谱越好。", target: 40 },
    { id: "family", name: "家庭/育儿/养老", stages: ["midlife", "senior", "elder"], note: "鸡娃、婆媳、赡养、传承、晚年。", target: 25 },
    { id: "health", name: "健康/暗伤/医疗", stages: ["hustle", "midlife", "senior", "elder"], note: "体检、猝死预警、心理崩溃、养生。", target: 15 }
  ];

  /* —— 模块注册表（其它 content/*.js 往这里 push） —— */
  const EVENTS = events;       // 事件别名：模块用 EVENTS.push({...}) 追加
  const CONSUMPTION = [];      // 消费/商城物品：consumption.js 填充
  const SOCIAL_DEFS = [];      // 社交圈 NPC 模板：social.js 填充
  // helper 导出给引擎与模块共用
  const CORE_UTIL = { add, flag, has, pick, rnd, clampStat, classTier, byClass, shuf, betNode, startupNode, makeCrush, windAt };
