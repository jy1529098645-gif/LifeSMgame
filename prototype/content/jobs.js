"use strict";
/* =====================================================================
 * content/jobs.js —— 求职 / 工作系统（v0.6）
 * 找工作不再是点一下就有钱：投简历 → 已读不回/拒信(带原因)/进面试 → 面试 → 录用或挂。
 * 成败动态取决于：能力(学识/谋略/魅力) × 学历 × 就业景气(world.jobMarket) × 个人势头 × 运气。
 * 录用后 s.job 决定「上班」收入；没工作时「上班」只能打零工糊口（权宜之计）。
 * ===================================================================== */
const JOBS = [
  { id: "blackwork", name: "日结黑工", industry: "灵活用工", tier: 0, pay: 2600, stress: 7, req: {}, base: 0.95, ladder: ["临时工", "熟手", "包工头"], desc: "工地/后厨/搬运，今天干今天结，没合同没保障。" },
  { id: "service", name: "服务业", industry: "本地生活", tier: 1, pay: 4200, stress: 5, req: { charm: 22 }, base: 0.82, ladder: ["店员", "值班主管", "店长"], desc: "店员/客服/外卖骑手，门槛低，辛苦钱。" },
  { id: "factory_qc", name: "制造业质检", industry: "先进制造", tier: 1, pay: 5600, stress: 6, req: { body: 26, knowledge: 24 }, base: 0.74, ladder: ["质检员", "班组长", "工艺主管"], desc: "流水线旁盯细节，眼力和耐心都得在线。" },
  { id: "sales_channel", name: "渠道销售", industry: "销售商务", tier: 2, pay: 6800, stress: 8, req: { charm: 38, strategy: 28 }, base: 0.58, ladder: ["销售代表", "大区经理", "渠道总监"], desc: "跑客户、陪饭局、催回款，业绩是最硬的普通话。" },
  { id: "smallco", name: "小公司白领", industry: "综合职能", tier: 2, pay: 7500, stress: 7, req: { knowledge: 38 }, base: 0.5, ladder: ["专员", "主管", "部门负责人"], desc: "麻雀虽小五脏俱全，一个人当三个用。" },
  { id: "teacher", name: "学校教师", industry: "教育", tier: 2, pay: 7600, stress: 7, req: { knowledge: 48, mind: 36 }, base: 0.42, ladder: ["任课老师", "年级组长", "教研主任"], desc: "备课、批改、家长群轮番上阵，假期不总是假期。" },
  { id: "hospital_admin", name: "医院行政", industry: "医疗健康", tier: 2, pay: 8200, stress: 7, req: { knowledge: 42, mind: 36 }, base: 0.38, ladder: ["科室干事", "院办主管", "运营主任"], desc: "不拿手术刀，也得在流程、医保和投诉里穿针引线。" },
  { id: "media_editor", name: "内容编辑", industry: "传媒内容", tier: 2, pay: 8800, stress: 8, req: { knowledge: 44, insight: 36, charm: 30 }, base: 0.4, ladder: ["编辑", "主编", "内容负责人"], desc: "标题要准，热点要快，错别字会在凌晨三点追杀你。" },
  { id: "product_ops", name: "产品运营", industry: "互联网", tier: 3, pay: 16000, stress: 10, req: { knowledge: 54, strategy: 44, insight: 36 }, base: 0.28, ladder: ["运营", "产品经理", "业务负责人"], desc: "用户、数据、老板需求三头拉扯，会议纪要写到怀疑人生。" },
  { id: "bigtech", name: "互联网大厂", industry: "互联网", tier: 3, pay: 19000, stress: 12, req: { knowledge: 58, strategy: 42 }, base: 0.24, flag: "bigtech", ladder: ["工程师", "高级工程师", "技术专家", "部门负责人"], desc: "高薪高压，工牌闪亮，35 岁危机预订。" },
  { id: "civil", name: "体制内", industry: "公共部门", tier: 3, pay: 8200, stress: 4, req: { knowledge: 52 }, base: 0.18, flag: "civil_servant", ladder: ["科员", "副科", "正科", "处级"], desc: "稳定，一眼望到退休，逢年过节有福利。" },
  { id: "state_owned", name: "国企管培", industry: "国企央企", tier: 3, pay: 12000, stress: 6, req: { knowledge: 52, strategy: 36 }, base: 0.25, ladder: ["管培生", "业务骨干", "部门副职", "分公司负责人"], desc: "流程慢，牌子硬，饭碗稳不稳取决于你会不会等。" },
  { id: "consultant", name: "管理咨询", industry: "专业服务", tier: 4, pay: 28000, stress: 13, req: { knowledge: 62, strategy: 60, charm: 44 }, base: 0.12, ladder: ["分析师", "顾问", "项目经理", "合伙人"], desc: "PPT 是刀，Excel 是盾，机场贵宾厅像第二个家。" },
  { id: "finance", name: "投行/金融", industry: "金融", tier: 4, pay: 32000, stress: 14, req: { knowledge: 62, strategy: 58, charm: 46 }, base: 0.1, ladder: ["分析师", "经理", "副总裁", "董事总经理"], desc: "金字塔尖，神仙打架，钱多事多命少。" },
  { id: "founder_staff", name: "创业公司核心员工", industry: "创业", tier: 3, pay: 14000, stress: 12, req: { knowledge: 50, strategy: 48, insight: 40 }, base: 0.22, flag: "startup_exp", ladder: ["早期员工", "业务负责人", "联合创始人"], desc: "现金少一点，期权画大饼；真做成了，履历能发光。" },
  { id: "exec", name: "企业高管", industry: "经营管理", tier: 5, pay: 60000, stress: 11, req: { strategy: 72, charm: 60, network: 55 }, base: 0.05, ladder: ["总监", "副总", "总经理", "董事"], desc: "预算、人事、战略一把抓，风光背后全是责任书。" },
  { id: "streamer", name: "网红主播", industry: "内容直播", tier: 2, pay: 9000, stress: 8, req: { charm: 40, insight: 28 }, base: 0.5, ladder: ["素人主播", "签约达人", "头部网红", "MCN 老板"], desc: "对着镜头又唱又跳又带货，红了月入百万，糊了血本无归。", locked: "job_streamer" },
];
function jobById(id) { return JOBS.find(j => j.id === id); }

/* —— 大框架改造·批次2：专业(major) —— 学历之外，专业也成为岗位硬门槛（doc §2.3/§8）。
 * 每个专业 realloc 净零（配合捏人加点制），并标注「对口行业」与「壁垒行业」。*/
const MAJORS = [
  { id: "cs",      name: "计算机/软件", emoji: "💻", desc: "敲代码、刷算法、通宵改 bug，最对口这十年的风口。", realloc: { knowledge: 8, insight: 4, charm: -6, body: -6 }, fit: ["互联网", "创业", "传媒内容"] },
  { id: "mech",    name: "机械/制造",   emoji: "⚙️", desc: "画图纸、下车间、跑产线，硬核工科的底子。", realloc: { knowledge: 6, body: 6, charm: -6, insight: -6 }, fit: ["先进制造", "国企央企", "综合职能"] },
  { id: "biz",     name: "工商管理",   emoji: "📊", desc: "市场、运营、管理样样懂一点，能说会道。", realloc: { charm: 6, strategy: 6, knowledge: -6, body: -6 }, fit: ["销售商务", "专业服务", "经营管理", "综合职能"] },
  { id: "finance", name: "金融/经济",   emoji: "💰", desc: "估值、模型、行情，离钱最近的专业。", realloc: { strategy: 8, insight: 4, body: -6, charm: -6 }, fit: ["金融", "专业服务"] },
  { id: "med",     name: "临床医学",   emoji: "🩺", desc: "五年起步、规培漫长，但医疗这道门只为你开。", realloc: { knowledge: 8, mind: 6, charm: -8, strategy: -6 }, fit: ["医疗健康"] },
  { id: "law",     name: "法学",       emoji: "⚖️", desc: "背法条、跑实务，体制与法务的敲门砖。", realloc: { strategy: 6, mind: 6, body: -6, insight: -6 }, fit: ["公共部门", "专业服务"] },
  { id: "art",     name: "艺术/设计",   emoji: "🎨", desc: "审美与表达是你的武器，也常是「不好就业」的代名词。", realloc: { charm: 6, insight: 6, knowledge: -6, strategy: -6 }, fit: ["传媒内容", "互联网"] },
  { id: "edu",     name: "师范/文科",   emoji: "📚", desc: "文史哲师范类，稳，但起薪不高、跨行难。", realloc: { knowledge: 6, mind: 6, body: -6, strategy: -6 }, fit: ["教育", "公共部门", "传媒内容"] }
];
function majorById(id) { return MAJORS.find(m => m.id === id) || null; }
function majorName(s) { const m = majorById(s && s.major); return m ? m.name : "未定专业"; }
// 壁垒行业：跨专业进入要大打折扣（医疗最硬，金融/教育/体制次之）
const MAJOR_GATED = { "医疗健康": ["med"], "金融": ["finance", "biz"], "教育": ["edu"], "公共部门": ["law", "edu"] };
// 专业-岗位匹配系数：对口加成 / 壁垒行业跨专业重罚 / 一般跨专业轻罚
function majorFit(s, job) {
  const mid = s && s.major; if (!mid) return 1;
  const m = majorById(mid); if (!m) return 1;
  if (m.fit && m.fit.includes(job.industry)) return 1.2;
  const need = MAJOR_GATED[job.industry];
  if (need) return need.includes(mid) ? 1.2 : 0.5;   // 壁垒行业：对口才行，跨专业腰斩
  return 0.92;                                         // 普通行业：跨专业轻微折扣
}
// 专业是否「够不着」某岗位（壁垒行业 + 严重不对口 → 求职界面提示「你看不懂这个机会」）
function majorBlocks(s, job) {
  const need = MAJOR_GATED[job.industry];
  return !!(need && s && s.major && !need.includes(s.major));
}

function industryHeat(s, job) {
  const w = s.world || {};
  let h = w.jobMarket ? (0.7 + w.jobMarket / 200) : 1;
  if (job.industry === "互联网" && ["AI", "新能源", "短视频", "元宇宙"].includes(s.eraWind)) h += 0.16;
  if (job.industry === "金融" && w.jobMarket < 45) h -= 0.12;
  if (job.industry === "教育" && s.year >= 2021 && s.year <= 2026) h -= 0.08;
  if (job.industry === "先进制造" && ["新能源", "机器人", "芯片"].includes(s.eraWind)) h += 0.18;
  if (job.industry === "创业" && s.eraWind && (job.desc || "").includes("期权")) h += 0.1;
  return Math.max(0.55, Math.min(1.45, h));
}

// 当前「上班」实发月薪（动态：随物价、景气、城市机会、势头浮动）
function jobSalary(s) {
  const w = s.world;
  if (!s.job) return Math.round((2000 + s.stats.charm * 30) * (w ? w.priceIndex : 1) * (s.city ? s.city.opp * 0.6 + 0.4 : 1)); // 零工糊口
  const base = s.job.pay * (w ? w.priceIndex : 1) * industryHeat(s, s.job) * (s.city ? (0.6 + s.city.opp * 0.4) : 1);
  return Math.round(base * (1 + luckBias(s)) * (1 + (s.job._raise || 0)));
}

// 投一份简历，返回 {ok, text?}（ok=true 进面试）
function applyJob(s, job) {
  const w = s.world; let p = job.base;
  for (const k in (job.req || {})) if (k !== "network") p *= Math.min(1.25, (s.stats[k] || 0) / job.req[k]);
  if (has(s, "edu_top")) p *= 1.3; else if (has(s, "edu_bachelor")) p *= 1.08; else if (has(s, "edu_none")) p *= 0.7;
  if (has(s, "haigui_back")) p *= 1.2;
  if (has(s, "startup_exp") && ["创业", "互联网", "经营管理"].includes(job.industry)) p *= 1.18;
  if (has(s, "bigtech") && ["互联网", "专业服务", "创业"].includes(job.industry)) p *= 1.12;
  if (job.req && job.req.network) p *= Math.min(1.25, (s.network || 0) / job.req.network);
  const mFit = majorFit(s, job); p *= mFit;            // ★批次2：专业对口/壁垒门槛
  p *= industryHeat(s, job) * (1 + luckBias(s));
  p = Math.max(0.03, Math.min(0.95, p));
  if (typeof recordBeat === "function") recordBeat(s, "first_resume");   // 主线节拍：投出第一份简历
  if (Math.random() > p) {
    bumpMomentum(s, -3);
    s._jobhuntFails = (s._jobhuntFails || 0) + 1;   // 连投不中累计「求职疲劳」，达阈值给保底兜底活
    const hi = ["「我们想要更有经验的候选人」", "「你的背景和岗位匹配度不高」", "简历石沉大海，HR 已读不回", "「您的能力我们小庙容不下」（婉拒）", "「不好意思，这个岗位暂停招聘了」"];
    const lo = ["「最近不招人，再看看吧」", "「先把简历留下，有需要联系你」（不会有了）", "连个自动回复都没有"];
    // ★专业不对口：直接点破短板（doc §2.3 面试暴露短板）
    const reason = (mFit <= 0.55 && majorBlocks(s, job))
      ? `HR 看了眼你的专业：「我们这行是要科班出身的，你「${majorName(s)}」的背景……恐怕不太合适。」`
      : (job.tier >= 3 ? hi : lo)[Math.floor(Math.random() * (job.tier >= 3 ? hi : lo).length)];
    return { ok: false, text: `你投出「${job.name}」的简历，满怀期待地等着。结果——${reason}。` };
  }
  return { ok: true };
}
// 录用
function hireJob(s, job) {
  const firstJob = !has(s, "ever_employed");
  s.job = Object.assign({}, job, { _raise: 0, level: 0 });
  flag(s, "employed"); if (job.flag) flag(s, job.flag);
  bumpMomentum(s, 7);
  s._jobhuntFails = 0;            // 上岸即清零求职疲劳
  // ★批次2：主线节拍 + 第一份工作进记忆（doc §9.2）
  if (typeof recordBeat === "function") { recordBeat(s, "first_offer"); recordBeat(s, "onboard"); recordBeat(s, "first_interview"); }
  if (firstJob) {
    flag(s, "ever_employed");
    if (typeof rememberFact === "function") rememberFact(s, { id: "first_job", once: true, type: "first_job", text: `第一份正式工作：「${job.name}」。`, tags: ["first_job", job.industry], intensity: 3 });
    if (typeof notify === "function") notify(s, { kind: "work", title: "拿到第一份 offer", body: `「${job.name}」——人生第一份正式工作。` });
  }
  if (typeof applyWorkScene === "function") applyWorkScene(s, s.job);   // 装配工作场景 + 写回社会画像
}

function jobLevelName(job) {
  const ladder = job.ladder || ["新人", "骨干", "负责人"];
  return ladder[Math.min(job.level || 0, ladder.length - 1)];
}

/* —— 求职事件（由「找工作」行动触发） —— */
EVENTS.push({
  id: "ev_jobhunt", module: "work",
  title: "📨 投简历找工作",
  text: (s) => { const jm = Math.round(s.world.jobMarket); const cityN = s.city ? (typeof cityFull === "function" ? cityFull(s.city) : s.city.name) : "本地"; return `你打开招聘软件，刷着 ${cityN} 的岗位。今年就业景气 ${jm}/100，${jm < 40 ? "寒气直往骨头里钻，遍地都是「优化」的消息" : jm < 65 ? "不好不坏，机会得自己抢" : "行情不错，HR 主动来撩"}。这座城市眼下在招的，有这么几家——投哪家？（一周能投好几家，海投才有机会）`; },
  dynamicChoices: (s) => {
    // ★公司库★：列出当前城市在招的【具体公司】，每次随机采样、城市不同清单不同；上市公司带🔅。
    if (typeof sampleCompanies === "function") {
      const list = sampleCompanies(s, 6);
      const opts = list.map(c => {
        const j = companyJob(c);
        const role = (typeof JOBS !== "undefined" && (JOBS.find(x => x.id === c.jobType) || {}).name) || "";
        const np = (typeof companyPositions === "function") ? companyPositions(s, c).length : 1;
        return { label: `「${c.name}」 · ${role} · 在招 ${np} 个岗位${c.stockId ? " 🔅上市" : ""}`, next: (s) => companyNode(s, c) };
      });
      if ((s._jobhuntFails || 0) >= 3 && !s.job) opts.unshift(jobhuntFallbackChoice(s));
      opts.push({ label: "再等等，先不投", cancel: true, effect: (s) => { add(s, "mood", -1); return "你刷了半天，又一次默默关掉了软件。这次的时间没白搭——多看几眼，心里有了谱。"; } });
      return opts;
    }
    // —— 兜底（公司库未加载）：退回岗位原型清单 ——
    const reach = (j) => {
      let lim = 1;
      for (const k in (j.req || {})) { const sv = k === "network" ? (s.network || 0) : (s.stats[k] || 0); lim = Math.min(lim, sv / j.req[k]); }
      let need = 0.45;
      if (j.tier >= 4) { need = 0.65; if (s.age < 26 && !has(s, "startup_exp") && !has(s, "bigtech")) return false; }
      if (j.id === "exec" && s.age < 30 && !has(s, "startup_done")) return false;
      return lim >= need;
    };
    let avail = JOBS.filter(j => (!j.locked || has(s, "unlock_" + j.locked)) && reach(j));
    if (avail.length < 3) { const fb = JOBS.filter(j => (!j.locked || has(s, "unlock_" + j.locked)) && j.tier <= 1); avail = Array.from(new Set(avail.concat(fb))); }
    avail.sort((a, b) => a.pay - b.pay);
    const opts = avail.map(j => ({ label: `投「${j.name}」 · ¥${j.pay.toLocaleString()}/月`, next: (s) => jobApplyNode(s, j) }));
    if ((s._jobhuntFails || 0) >= 3 && !s.job) opts.unshift(jobhuntFallbackChoice(s));
    opts.push({ label: "再等等，先不投", cancel: true, effect: (s) => { add(s, "mood", -2); return "你刷了半天，又一次默默关掉了软件。"; } });
    return opts;
  },
  choices: []
});
// 求职疲劳兜底：连投不中（≥3 次）时给一个「先扛着」的保底临时活——
// 别让玩家半辈子卡在投简历的黑洞里，先有口饭吃，再骑驴找马慢慢往上爬。
function jobhuntFallbackChoice(s) {
  const cityN = s.city ? (typeof cityFull === "function" ? cityFull(s.city) : s.city.name) : "本地";
  return {
    label: `【先扛着】别挑了，接个日结/临时的活糊口（保底）`,
    effect: (s) => {
      const base = jobById("blackwork") || JOBS[0];
      const job = Object.assign({}, base, { name: `日结零工·${cityN}`, _raise: 0, level: 0 });
      hireJob(s, job);                       // 内部清零 _jobhuntFails
      add(s, "mood", -3); add(s, "stress", 2); bumpMomentum(s, 1);
      return `投了一次又一次，简历像石沉大海。你不再挑了——先在${cityN}找了份日结的零工扛着：工地、后厨、跑腿，今天干今天结。钱不多，可终于不用天天对着招聘软件干熬。先活下来，再慢慢往上爬。`;
    }
  };
}
function jobApplyNode(s, job) {
  const r = applyJob(s, job);
  if (!r.ok) return { text: () => r.text, choices: [{ label: "唉，换一个再投", effect: (s) => { add(s, "stress", 3); return "你深吸一口气，把失落咽下去，继续往下刷。"; } }] };
  // 入职上市公司发 RSU（限制性股票）→ 身家与公司股价绑定
  const rsuTxt = () => { if (job.stockId && typeof grantRSU === "function") { const sh = grantRSU(s, job); if (sh) return ` 入职大礼包里还塞着 ${sh} 股「${job.name}」的限制性股票(RSU)——从今往后，你的身家就和这家公司的股价绑在了一起，去「📈 理财」页能看到它的涨跌。`; } return ""; };
  return {
    text: () => `好消息——「${job.name}」通知你去面试！约在后天下午。`,
    choices: [
      { label: "认真准备，全力以赴", effect: (s) => { const p = 0.45 + (s.stats.charm + s.stats.strategy) / 320 + luckBias(s); if (rnd(p)) { hireJob(s, job); add(s, "mood", 12); return `面试官频频点头，临走还跟你握了手。三天后，offer 到了！你入职「${job.name}」，到手约 ¥${jobSalary(s).toLocaleString()}/月。` + rsuTxt(); } bumpMomentum(s, -4); add(s, "mood", -7); s._jobhuntFails = (s._jobhuntFails || 0) + 1; return `面到一半大脑宕机，磕磕巴巴答不上来。一周后收到感谢信：「祝你前程似锦」——翻译过来就是，没戏了。`; } },
      { label: "裸面，临场发挥", effect: (s) => { const p = 0.28 + s.stats.charm / 240 + luckBias(s); if (rnd(p)) { hireJob(s, job); add(s, "mood", 10); return `你靠一张嘴和一身松弛感，居然把面试官唬住了。入职「${job.name}」！` + rsuTxt(); } add(s, "mood", -5); s._jobhuntFails = (s._jobhuntFails || 0) + 1; return `毫无准备，被问得哑口无言。面试官礼貌地送你出门，眼神写满了「下一个」。`; } }
    ]
  };
}

/* ============== 公司 → 岗位列表 → 面试 VN ============== */
const _STAT_CN = { knowledge: "学识", strategy: "谋略", charm: "魅力", insight: "见识", body: "体魄", mind: "心智", network: "人脉" };
// 岗位推荐门槛文案：把 req 显示成「推荐 学识58 谋略42」
function posReqHint(pos) {
  const ks = Object.keys(pos.req || {});
  if (!ks.length) return "门槛很低，谁都能投";
  return "推荐 " + ks.map(k => `${_STAT_CN[k] || k}${Math.round(pos.req[k])}`).join(" ");
}
// 你的能力相对岗位门槛达成度（0~1.3+），用于判断「数值是否够」
function posMatch(s, pos) {
  const ks = Object.keys(pos.req || {}); if (!ks.length) return 1.1;
  let lim = 2;
  for (const k of ks) { const sv = k === "network" ? (s.network || 0) : (s.stats[k] || 0); lim = Math.min(lim, sv / pos.req[k]); }
  return lim;
}
// 岗位「硬实力」录用基准概率（纯看数值，不含面试发挥）
// 岗位 → 社会画像场域：让学历/家庭/履历/城市/世界(socialAccess) 影响「别人愿不愿意让你上桌」
const JOB_ACCESS_FIELD = {
  bigtech: "job_bigtech", product_ops: "job_bigtech", founder_staff: "job_bigtech",
  civil: "job_civil", state_owned: "job_civil", hospital_admin: "job_civil",
  sales_channel: "job_sales",
  service: "job_service", blackwork: "job_service", streamer: "job_service",
  factory_qc: "job_factory"
};
function jobAccessField(jobType) { return JOB_ACCESS_FIELD[jobType] || "job_bigtech"; }   // 其余白领岗用大厂口径做近似
function posHardP(s, pos) {
  let p = pos.base || 0.4;
  for (const k in (pos.req || {})) { if (k === "network") continue; p *= Math.min(1.25, (s.stats[k] || 0) / pos.req[k]); }
  if (has(s, "edu_top")) p *= 1.25; else if (has(s, "edu_bachelor")) p *= 1.06; else if (has(s, "edu_none")) p *= 0.75;
  if (pos.req && pos.req.network) p *= Math.min(1.25, (s.network || 0) / pos.req.network);
  // 社会通行度：背景越能「上桌」，简历越不容易被一眼刷掉（约 ×0.82 ~ ×1.18，能力仍是主导）
  if (typeof socialAccess === "function" && pos.jobType) { const acc = socialAccess(s, jobAccessField(pos.jobType)); p *= 0.82 + acc / 280; }
  p *= (1 + luckBias(s));
  return Math.max(0.04, Math.min(0.95, p));
}
// 公司节点：展示公司 + 在招岗位（带推荐门槛、薪资、面试侧重），选一个去面试
function companyNode(s, c) {
  const positions = (typeof companyPositions === "function") ? companyPositions(s, c) : [];
  return {
    text: () => `「${c.name}」${c.stockId ? "（🔅上市公司，入职发 RSU）" : ""}\n${c._blurb || c.blurb || ""}\n\nHR 发来了在招岗位清单。选一个投递——门槛只是「推荐」，数值不够也能投，就看你面试能不能扛住。`,
    dynamicChoices: (s) => {
      const opts = positions.map(pos => {
        const m = posMatch(s, pos);
        const tag = m >= 1 ? "✅够格" : m >= 0.7 ? "🟡有点悬" : "🔴够呛";
        return { label: `${pos.title} · ¥${pos.pay.toLocaleString()}/月\n${posReqHint(pos)}（${tag}）`, next: (s) => ivStart(s, pos) };
      });
      opts.push({ label: "再看看别家", effect: (s) => "你合上这家的页面，回到了茫茫职位海里。" });
      return opts;
    }
  };
}
// 开始面试：初始化面试状态，进入第 1 轮
function ivStart(s, pos) {
  s._iv = { pos: pos, score: 0, hardP: posHardP(s, pos), match: posMatch(s, pos) };
  return {
    text: () => `面试约在「${pos.company}」的会议室。玻璃门后，HR 和用人部门的主管已经坐定，桌上摆着你的简历。${(typeof byAccess === "function") ? "\n" + byAccess(s, jobAccessField(pos.jobType), { high: "HR 扫了一眼你简历上的背景，语气客气了几分：「久仰，我们可以直接聊深一点。」", mid: "你的简历没被刷掉，但也没人特别期待。面试官翻了两页，问得很细。", low: "面试官的目光在你的学历和履历上停了一下，没说什么，但你读得懂那种「再看看」的客套。" }) : ""}\n你应聘的是「${pos.title}」。${s._iv.match < 0.75 ? "说实话，你的硬条件离岗位要求还差着一截——这一场，得靠临场发挥扳回来。" : s._iv.match >= 1 ? "你的条件够得上，稳住别翻车就行。" : "条件不上不下，面试的发挥可能就是分水岭。"}\n\n主管开口：「先简单做个自我介绍吧。」`,
    choices: ivRoundChoices(s, 0)
  };
}
// 三轮面试的题目与选项
const IV_ROUNDS = [
  { q: "「先简单做个自我介绍吧。」", opts: [
    { label: "谦逊务实，摆事实讲经历", stat: "knowledge", base: 4, sec: "mind" },
    { label: "自信开麦，主动秀亮点", stat: "charm", base: 2, hi: 9, lo: -4 },
    { label: "讲一个打动人的真实故事", stat: "insight", base: 6, sec: "charm" }
  ] },
  { q: "主管抛来一道专业／情景难题，直击岗位核心。", keyQ: true, opts: [
    { label: "凭真本事正面硬刚", useKey: true, base: 3, hi: 12, lo: -6 },
    { label: "坦诚不会，但当场拆解思路、给方案", stat: "strategy", base: 7, sec: "insight" },
    { label: "扯点行业见解，四两拨千斤", stat: "charm", base: 1, hi: 8, lo: -7 }
  ] },
  { q: "「关于薪资和发展，你有什么想法？还有什么想问我们的？」", opts: [
    { label: "表诚意，薪资好商量，先求上车", stat: "charm", base: 5 },
    { label: "自信要价，亮出你的价值", stat: "strategy", base: 2, hi: 9, lo: -5 },
    { label: "反问公司战略与团队，显出思考深度", stat: "insight", base: 6, sec: "knowledge" }
  ] }
];
function ivScoreOf(s, opt) {
  let pts = opt.base || 0;
  const keyStat = opt.useKey ? s._iv.pos.key : opt.stat;
  if (keyStat) {
    const e = (typeof statEdge === "function") ? statEdge(s, keyStat) : ((s.stats[keyStat] || 35) - 35) / 110;
    if (opt.hi != null) pts += e > 0.12 ? opt.hi : (e < -0.05 ? (opt.lo || 0) : Math.round((opt.hi + (opt.lo || 0)) / 2));
    else pts += Math.round(e * 16);
  }
  if (opt.sec) { const e2 = (typeof statEdge === "function") ? statEdge(s, opt.sec) : 0; pts += Math.round(e2 * 6); }
  return pts;
}
function ivRoundChoices(s, n) {
  const round = IV_ROUNDS[n];
  return round.opts.map(opt => ({
    label: opt.label,
    next: (s) => {
      const gained = ivScoreOf(s, opt);
      s._iv.score += gained;
      const react = gained >= 8 ? "主管眼睛一亮，飞快记了一笔。" : gained >= 3 ? "对面微微点头，气氛还算融洽。" : gained <= -3 ? "会议室里安静了一秒，主管不动声色地翻了下简历。" : "主管面无表情，看不出深浅。";
      if (n + 1 < IV_ROUNDS.length) {
        return { text: () => `${react}\n\n${IV_ROUNDS[n + 1].q}`, choices: ivRoundChoices(s, n + 1) };
      }
      return ivResult(s, react);
    }
  }));
}
// 面试结算：硬实力 + 面试发挥 → 录用 / 婉拒 / 推荐别的岗位
function ivResult(s, lastReact) {
  const iv = s._iv, pos = iv.pos;
  const ivBonus = iv.score / 100;                       // 面试分折算成概率加成（约 -0.24 ~ +0.54）
  let passP = Math.max(0.03, Math.min(0.97, iv.hardP + ivBonus));
  const hired = rnd(passP);
  const rsuTxt = () => { if (pos.stockId && typeof grantRSU === "function") { const sh = grantRSU(s, pos); if (sh) return ` 还有 ${sh} 股「${pos.company}」的 RSU 入账，你的身家从此和它的股价绑在一起。`; } return ""; };
  const hireThis = (s) => { const job = Object.assign({}, JOBS.find(j => j.id === pos.jobType) || {}, { name: pos.company + "·" + pos.title, companyId: pos.companyId, stockId: pos.stockId, pay: pos.pay, req: pos.req, _raise: 0, level: 0 }); hireJob(s, job); s._iv = null; };
  if (hired) {
    return { text: () => `${lastReact}\n\n面试官交换了一个眼神，主管笑着伸出手：「欢迎加入。」`,
      choices: [{ label: "握手，入职！", effect: (s) => { hireThis(s); add(s, "mood", 12); bumpMomentum(s, 5); const sal = jobSalary(s); return `你拿下了「${pos.company}·${pos.title}」，到手约 ¥${sal.toLocaleString()}/月。${iv.match < 0.8 ? "硬条件本来不够，是这场面试把你抬了进来——临场发挥，有时候真能改命。" : "水到渠成。"}` + rsuTxt(); } }] };
  }
  // 没录用，但面试发挥不错(score≥14) → 推荐同公司一个门槛更低的岗位
  if (iv.score >= 14 && typeof companyPositions === "function") {
    const c = (typeof companyById === "function") ? companyById(pos.companyId) : null;
    const alt = c ? companyPositions(s, c).filter(p => p.title !== pos.title).sort((a, b) => posHardP(s, b) - posHardP(s, a))[0] : null;
    if (alt) {
      return { text: () => `${lastReact}\n\n主管沉吟片刻：「说实话，这个『${pos.title}』的岗位，你某些硬指标还差点意思。」\n他话锋一转：「不过我挺看好你这个人——我们『${alt.title}』那边正好缺人，要求低一些，你要不要考虑一下？」`,
        choices: [
          { label: `好，那就投「${alt.title}」吧`, effect: (s) => { const job = Object.assign({}, JOBS.find(j => j.id === alt.jobType) || {}, { name: alt.company + "·" + alt.title, companyId: alt.companyId, stockId: alt.stockId, pay: alt.pay, req: alt.req, _raise: 0, level: 0 }); hireJob(s, job); s._iv = null; add(s, "mood", 8); const sal = jobSalary(s); return `主管当场拍了板。你入职「${alt.company}·${alt.title}」，到手约 ¥${sal.toLocaleString()}/月。虽然不是最初想要的那个，但门已经进了——先站稳，再往上爬。`; } },
          { label: "不了，我想再找找更对口的", effect: (s) => { s._iv = null; add(s, "insight", 1); return "你礼貌地谢绝了。有些将就一旦开始，就很难停下——你还想再为那个更想要的岗位试一试。"; } }
        ] };
    }
  }
  // 彻底没戏
  return { text: () => `${lastReact}\n\n沉默几秒后，主管合上简历：「今天就先到这儿，有结果我们会通知你。」\n你听得懂这句话的潜台词。`,
    choices: [{ label: "唉，再找下一家", effect: (s) => { s._iv = null; add(s, "stress", 3); bumpMomentum(s, -2); s._jobhuntFails = (s._jobhuntFails || 0) + 1; return iv.match < 0.7 ? "硬条件不够，面试也没能力挽狂澜。看来这个岗位，眼下确实够不着。" : "明明聊得不差，却还是没下文。求职就是这样，你永远不知道是哪句话出了错。"; } }] };
}

EVENTS.push(
  {
    id: "ev_job_raise_talk", module: "work", ambient: true,
    cond: (s) => !!s.job && s.age >= 22,
    title: "💬 绩效面谈",
    text: (s) => `年中绩效来了，你现在是「${s.job.name}」里的${jobLevelName(s.job)}。老板把表格推到你面前，暗示今年预算紧，但你的活大家都看见了。`,
    choices: [
      { label: "拿数据谈涨薪", effect: (s) => { const p = 0.28 + s.stats.strategy / 180 + (s.reputation || 0) / 260 + luckBias(s); if (rnd(p)) { s.job._raise = (s.job._raise || 0) + 0.1; add(s, "mood", 8); bumpMomentum(s, 4); return `你把项目结果、节省成本和同岗薪资摊开讲，老板沉默片刻，批了调薪。下月工资会更好看。`; } add(s, "stress", 5); add(s, "mood", -4); return "你讲得很认真，老板也点头很认真，最后只给了一句「公司不会亏待努力的人」。这句话最便宜。"; } },
      { label: "先求稳，换资源不换钱", effect: (s) => { add(s, "network", 3); add(s, "stress", -3); add(s, "strategy", 1); return "你没有硬要现金，而是换到更核心的项目和一个更靠谱的导师。钱没马上来，路却宽了一点。"; } },
      { label: "委婉表达想跳槽", effect: (s) => { const p = 0.18 + s.stats.charm / 220 + luckBias(s); if (rnd(p)) { s.job._raise = (s.job._raise || 0) + 0.07; add(s, "network", 2); return "老板听懂了你的意思，临时挤出一点预算留人。办公室里的空气，一下子微妙起来。"; } add(s, "stress", 7); bumpMomentum(s, -3); return "话说出口后，老板笑得很客气。你忽然意识到，牌桌上没筹码时，威胁离场也不太响。"; } }
    ]
  },
  {
    id: "ev_job_promotion_ladder", module: "work", ambient: true,
    cond: (s) => !!s.job && (s.job.ladder || []).length > 1 && (s.job.level || 0) < (s.job.ladder.length - 1),
    title: "📈 晋升窗口",
    text: (s) => `部门空出一个位置，从「${jobLevelName(s.job)}」往上走一步，就能进入「${s.job.ladder[(s.job.level || 0) + 1]}」梯队。机会摆在桌上，但桌边坐满了人。`,
    choices: [
      { label: "正面争取，接硬项目", effect: (s) => { const p = 0.22 + (s.stats.knowledge + s.stats.strategy) / 360 + industryHeat(s, s.job) / 6 + luckBias(s); if (rnd(p)) { s.job.level = (s.job.level || 0) + 1; s.job._raise = (s.job._raise || 0) + 0.12; add(s, "reputation", 4); add(s, "stress", 5); return `你把最难的项目扛下来，熬过几轮评审，终于升到「${jobLevelName(s.job)}」。名片变厚，压力也变厚了。`; } add(s, "health", -3); add(s, "stress", 9); return "硬项目啃到最后变成硬骨头，你累得眼睛发直，晋升名单上却没有你。职场有时很会教人沉默。"; } },
      { label: "经营关系，争取支持", effect: (s) => { const p = 0.2 + (s.network || 0) / 220 + s.stats.charm / 260 + luckBias(s); if (rnd(p)) { s.job.level = (s.job.level || 0) + 1; s.job._raise = (s.job._raise || 0) + 0.08; add(s, "network", 5); return `你提前把关键同事和上级沟通到位，评审会上有人替你说话。你升到了「${jobLevelName(s.job)}」。`; } add(s, "reputation", -3); add(s, "stress", 6); return "你跑了不少关系，但风声传得太快，反倒被贴上「心思不在业务上」的标签。"; } },
      { label: "不卷了，保住生活", effect: (s) => { add(s, "stress", -8); add(s, "mind", 1); return "你关掉晋升材料，准点下班吃了一顿热饭。没有新的头衔，但今晚睡得像个人。"; } }
    ]
  },
  {
    id: "ev_job_referral", module: "work", ambient: true,
    cond: (s) => s.age >= 23 && (s.network || 0) >= 18,
    title: "🤝 熟人内推",
    text: (s) => { const list = shuf(JOBS.filter(j => (!s.job || j.id !== s.job.id) && (!j.locked || has(s, "unlock_" + j.locked)))).slice(0, 3); s._jobReferralIds = list.map(j => j.id); return `一个熟人说手里有内推名额，愿意帮你把简历递进去。${s.job ? "你现在有工作，跳不跳都要想清楚。" : "你正缺一个正式机会。"}可以试试哪条路？`; },
    dynamicChoices: (s) => {
      const ids = s._jobReferralIds || ["product_ops", "state_owned", "founder_staff"];
      const opts = ids.map(id => jobById(id)).filter(Boolean).map(j => ({
        label: `请他内推「${j.name}」`,
        next: (s) => jobApplyNode(s, Object.assign({}, j, { base: Math.min(0.9, j.base * 1.45) }))
      }));
      opts.push({ label: "欠人情太麻烦，婉拒", effect: (s) => { add(s, "mind", 1); return "你谢过对方，没有立刻动用这层关系。有些人情债，比面试题更难答。"; } });
      return opts;
    },
    choices: []
  },
  {
    id: "ev_job_side_to_full", module: "work", ambient: true,
    once: true,
    cond: (s) => !has(s, "startup") && (has(s, "risk_hustle") || (s.stats.insight + s.stats.strategy >= 95)) && s.age >= 24,
    title: "🧩 副业转正的念头",
    text: () => "你做过的一点副业开始有人付钱，客户催着交付，朋友劝你干脆出来单干。它还不算公司，但已经不像玩票。",
    choices: [
      { label: "注册个体户，认真接单", effect: (s) => { s.job = { id: "solo_studio", name: "个人工作室", industry: "创业", tier: 3, pay: 18000, stress: 10, req: { strategy: 45, charm: 35 }, base: 0.3, _raise: 0, level: 0, ladder: ["自由职业者", "小团队负责人", "工作室主理人"] }; flag(s, "employed"); flag(s, "startup_exp"); add(s, "network", 5); add(s, "stress", 5); return "你没有立刻融资造梦，而是先靠订单活下来。个人工作室开张，客户就是你的老板们。"; } },
      { label: "继续当副业，别断工资", effect: (s) => { add(s, "cash", 20000); add(s, "strategy", 1); add(s, "stress", 3); return "你把它留在晚上和周末，现金流多了一点，睡眠少了一点。稳，是成年人最常见的勇敢。"; } },
      { label: "直接创业，赌一把大的", next: (s) => startupNode(s) }
    ]
  },
  {
    id: "ev_job_startup_resume", module: "work", ambient: true,
    once: true,
    cond: (s) => !s.job && (has(s, "startup_done") || has(s, "been_bankrupt") || has(s, "cashed_out")),
    title: "🧾 创业履历再就业",
    text: () => "创业告一段落后，你重新打开简历。那些熬夜、融资、裁员、交付和失败，终于可以被写成几行看起来体面的经历。",
    choices: [
      { label: "去大公司做业务负责人", effect: (s) => { const j = Object.assign({}, jobById("exec"), { pay: 52000, _raise: 0, level: 0 }); hireJob(s, j); add(s, "reputation", 4); return "公司看中你的实战经验，给了一个业务负责人位置。你又回到组织里，只是这次更懂现金流的重量。"; } },
      { label: "去创业公司当联合创始人", effect: (s) => { const j = Object.assign({}, jobById("founder_staff"), { pay: 22000, _raise: 0, level: 1 }); hireJob(s, j); add(s, "network", 6); flag(s, "startup_exp"); return "另一支早期团队把你请去做联合创始人。你知道坑在哪里，也知道人为什么还会往里跳。"; } },
      { label: "先休整，不急着上岸", effect: (s) => { add(s, "health", 6); add(s, "stress", -12); add(s, "mind", 2); return "你没有急着把自己卖回职场，而是给身体和心里都放了个假。暂停不是失败，是重新校准。"; } }
    ]
  }
);
