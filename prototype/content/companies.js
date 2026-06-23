"use strict";
/* =====================================================================
 * content/companies.js —— 公司/单位库（v0.11 求职细化 + 股市关联）
 * ---------------------------------------------------------------------
 * 投简历不再只投一个「岗位类型」，而是投一家家**具体的公司/单位**（名字仿现实改编）。
 *   - 每家公司 jobType 指向 jobs.js 的岗位原型(JOBS)，复用其 req/base/ladder/industry/薪资逻辑；
 *   - tierMax：出现在【城市 tier ≤ tierMax】的城市——大厂只在一线(tier1)，本地小店遍地；
 *   - 不同城市可投的公司不同，且每次投简历随机采样几家 → 每次看到的清单都不太一样；
 *   - stockId：上市巨头复用 stocks.js 的标的（神州地产/鹅厂控股…）。入职上市公司会发一笔
 *     RSU(限制性股票)进你的持仓，从此你的身家和这家公司的股价绑在一起——公司涨你赚，公司崩你套。
 *
 * 全局：COMPANIES / companyJob / companiesForCity / sampleCompanies / grantRSU / jobReachable
 * 依赖：JOBS(jobs.js)、has/shuf/rnd(core.js)、s.market(stocks.js)。
 * 加载顺序：jobs.js 与 stocks.js 之后、_assemble.js 之前。
 * ===================================================================== */

const COMPANIES = [
  // ===== 上市巨头（stockId 关联股市；只在一线/新一线） =====
  { id: "c_realty", name: "神州地产", jobType: "sales_channel", tierMax: 2, stockId: "realty", payMul: 1.25, blurb: "全国铺盘的地产龙头，售楼处永远在冲业绩，回款就是军令。" },
  { id: "c_ecom", name: "万象云购", jobType: "product_ops", tierMax: 1, stockId: "ecom", payMul: 1.2, blurb: "万物皆可送的电商巨头，大促前的园区灯火通明，到处是拉满的进度条。" },
  { id: "c_goose", name: "鹅厂控股", jobType: "bigtech", tierMax: 1, stockId: "goose", payMul: 1.3, blurb: "国民级社交与游戏帝国，工牌一亮就是大厂光环，35 岁的影子也提前到了。" },
  { id: "c_shortv", name: "抖光传媒", jobType: "media_editor", tierMax: 1, stockId: "shortv", payMul: 1.15, blurb: "短视频时代的流量印钞机，算法是上帝，热点是命令。" },
  { id: "c_battery", name: "锂想新能源", jobType: "factory_qc", tierMax: 2, stockId: "battery", payMul: 1.2, blurb: "新能源风口上的动力电池龙头，超级工厂三班倒，订单排到后年。" },
  { id: "c_ai", name: "智涌智算", jobType: "bigtech", tierMax: 1, stockId: "ai", payMul: 1.4, blurb: "押注大模型的明星公司，估值火箭般蹿升，加班也是火箭般。" },
  { id: "c_robot", name: "灵犀机器人", jobType: "product_ops", tierMax: 1, stockId: "robot", payMul: 1.25, blurb: "让机器人走进千家万户的具身智能新贵，demo 很炫，量产很难。" },
  { id: "c_fusion", name: "曦和聚能", jobType: "factory_qc", tierMax: 1, stockId: "fusion", payMul: 1.3, blurb: "追逐「人造太阳」的硬核能源公司，一群人想点亮整个时代。" },
  { id: "c_silver", name: "颐康养老", jobType: "hospital_admin", tierMax: 2, stockId: "silver", payMul: 1.05, blurb: "银发经济里的连锁养老龙头，护工紧缺，温情与现实并存。" },
  { id: "c_bci", name: "脑桥科技", jobType: "bigtech", tierMax: 1, stockId: "bci", payMul: 1.35, blurb: "把电极伸向大脑的脑机接口先锋，争议与想象同样巨大。" },
  { id: "c_space", name: "九霄航天", jobType: "state_owned", tierMax: 1, stockId: "space", payMul: 1.2, blurb: "民营航天的领头羊，每一次点火都是一次豪赌。" },

  // ===== 互联网 / 科技（非上市） =====
  { id: "c_yuntu", name: "云图科技", jobType: "product_ops", tierMax: 1, blurb: "做 SaaS 的二线大厂，福利不错，需求文档比代码还长。" },
  { id: "c_aurora", name: "极光数据", jobType: "product_ops", tierMax: 2, blurb: "靠数据中台吃饭的成长型公司，报表是这里的硬通货。" },
  { id: "c_seeklight", name: "寻光科技", jobType: "founder_staff", tierMax: 2, flagAlt: "startup_exp", blurb: "刚融到 A 轮的早期团队，工位挨着工位，期权画得很大。" },
  { id: "c_pixel", name: "像素工场", jobType: "media_editor", tierMax: 2, blurb: "做独立游戏与数字内容的小工作室，热爱能当一半工资。" },

  // ===== 金融 / 专业服务 =====
  { id: "c_changhe", name: "长河证券", jobType: "finance", tierMax: 1, blurb: "老牌券商，西装革履，加班到凌晨是投行的勋章。" },
  { id: "c_zhaoyuan", name: "招远银行", jobType: "finance", tierMax: 2, payMul: 0.85, blurb: "全国性股份制银行，拉存款的 KPI 像影子跟着你。" },
  { id: "c_taiping", name: "太平资管", jobType: "finance", tierMax: 1, payMul: 0.95, blurb: "管着别人钱袋子的资管机构，谨慎是第一美德。" },
  { id: "c_zhilve", name: "智略咨询", jobType: "consultant", tierMax: 1, blurb: "顶级战略咨询行，PPT 是刀，机场贵宾厅是第二个家。" },
  { id: "c_andao", name: "安道咨询", jobType: "consultant", tierMax: 2, payMul: 0.9, blurb: "四大出身的咨询团队，方法论一套套，落地另说。" },
  { id: "c_anxin", name: "安信财税", jobType: "smallco", tierMax: 3, blurb: "给中小企业做账报税的财务公司，月底就是渡劫。" },

  // ===== 国企 / 体制内 =====
  { id: "c_huaneng", name: "华能电力", jobType: "state_owned", tierMax: 2, blurb: "电力央企，牌子硬、流程慢，逢年过节福利让人羡慕。" },
  { id: "c_zhongtie", name: "中铁十九局", jobType: "state_owned", tierMax: 3, payMul: 0.95, blurb: "跟着工程项目天南海北跑，铁路修到哪人到哪。" },
  { id: "c_guoxin", name: "国信投资", jobType: "state_owned", tierMax: 1, payMul: 1.1, blurb: "地方国资平台，手握大项目，关系是隐形的资产。" },
  { id: "c_gov_center", name: "市政务服务中心", jobType: "civil", tierMax: 2, blurb: "一站式办事大厅，窗口后是体制内最朴素的日常。" },
  { id: "c_gov_tax", name: "区税务局", jobType: "civil", tierMax: 2, blurb: "和数字、报表、纳税人打交道，一眼望到退休的安稳。" },
  { id: "c_gov_devp", name: "县发改委", jobType: "civil", tierMax: 3, blurb: "管立项、跑规划，县城里最有「前途」的清水衙门。" },

  // ===== 教育 / 医疗 / 传媒 =====
  { id: "c_chunlei", name: "春蕾中学", jobType: "teacher", tierMax: 3, blurb: "本地知名中学，升学率是招牌，家长群是战场。" },
  { id: "c_qiming", name: "启明实验小学", jobType: "teacher", tierMax: 2, blurb: "公办名校，编制难进，孩子的笑脸是最好的回报。" },
  { id: "c_boxue", name: "博学培优", jobType: "teacher", tierMax: 2, payMul: 0.9, locked: null, blurb: "课外培训机构，双减之后风声鹤唳，转型还是离场？" },
  { id: "c_renji", name: "仁济医院", jobType: "hospital_admin", tierMax: 2, blurb: "三甲医院行政岗，在流程、医保和投诉间穿针引线。" },
  { id: "c_tongkang", name: "同康医疗", jobType: "hospital_admin", tierMax: 3, payMul: 0.92, blurb: "民营连锁医疗，扩张快，规矩还在路上。" },
  { id: "c_fengxing", name: "风行文化", jobType: "media_editor", tierMax: 2, blurb: "做杂志与新媒体的内容公司，热点要快，错别字会在凌晨追杀你。" },
  { id: "c_zilijian", name: "字里行间传媒", jobType: "media_editor", tierMax: 3, payMul: 0.9, blurb: "本地公众号矩阵，十万加是唯一的 KPI。" },
  { id: "c_xingyao", name: "星耀传媒(MCN)", jobType: "streamer", tierMax: 2, blurb: "签约网红的 MCN，红了月入百万，糊了血本无归。" },

  // ===== 销售 / 渠道 / 制造 =====
  { id: "c_guanglian", name: "广联建材", jobType: "sales_channel", tierMax: 3, blurb: "建材渠道商，跑工地、陪饭局、催回款，业绩是最硬的普通话。" },
  { id: "c_yisheng", name: "益生医药", jobType: "sales_channel", tierMax: 2, blurb: "医药代表，穿梭于医院走廊，合规红线越收越紧。" },
  { id: "c_dingsheng", name: "鼎盛汽贸", jobType: "sales_channel", tierMax: 3, payMul: 0.95, blurb: "4S 店销售，砍价、上牌、保险一条龙，提成看天吃饭。" },
  { id: "c_jinggong", name: "精工电子厂", jobType: "factory_qc", tierMax: 3, blurb: "电子代工厂，流水线旁盯细节，眼力和耐心都得在线。" },
  { id: "c_yuanda", name: "远大模具", jobType: "factory_qc", tierMax: 3, payMul: 0.95, blurb: "做精密模具的老厂，老师傅的手艺还压得住机器。" },
  { id: "c_hengli", name: "恒力纺织", jobType: "factory_qc", tierMax: 3, payMul: 0.9, blurb: "纺织车间机声轰鸣，订单旺季三班倒。" },

  // ===== 综合白领 / 本地生活 / 灵活用工（遍地都有） =====
  { id: "c_lianchuang", name: "联创科技", jobType: "smallco", tierMax: 3, blurb: "本地小公司，一个人当三个用，麻雀虽小五脏俱全。" },
  { id: "c_mingde", name: "明德文化", jobType: "smallco", tierMax: 3, payMul: 0.95, blurb: "做活动策划与广告的小团队，甲方虐我千百遍。" },
  { id: "c_xianfeng", name: "鲜丰果业", jobType: "service", tierMax: 4, blurb: "连锁水果店，起早贪黑，损耗和人情都得算明白。" },
  { id: "c_xiyue", name: "喜悦茶饮", jobType: "service", tierMax: 4, blurb: "网红奶茶店，旺季手不停、嗓子哑，店长梦从摇杯开始。" },
  { id: "c_suda", name: "速达快递", jobType: "service", tierMax: 4, payMul: 1.05, blurb: "快递驿站与配送，多劳多得，风里雨里件不能停。" },
  { id: "c_laozhang", name: "老张川菜馆", jobType: "service", tierMax: 4, payMul: 0.95, blurb: "街边川菜馆后厨/前厅，烟火气十足，辛苦钱实打实。" },
  { id: "c_chengjian", name: "城建工地", jobType: "blackwork", tierMax: 4, blurb: "市政工地，今天干今天结，没合同没保障，全凭力气。" },
  { id: "c_hongxing", name: "红星搬家", jobType: "blackwork", tierMax: 4, payMul: 1.05, blurb: "搬家队，五楼无电梯的冰箱，是腰最深的记忆。" }
];

function companyById(id) { return COMPANIES.find(c => c.id === id); }

/* ===== 岗位模板：每个 jobType(岗位原型) 下细分多个具体岗位 =====
 * 每条 {t:岗位名, pm:薪资倍率, key:面试主要考察的属性, rq:{该岗额外提高/降低的能力门槛}}。
 * 同一家公司会同时招好几个岗位，门槛/薪资/面试侧重各不同。*/
const POSITION_TEMPLATES = {
  bigtech: [
    { t: "后端工程师", pm: 1.05, key: "knowledge", rq: { knowledge: 6 } },
    { t: "前端工程师", pm: 0.98, key: "knowledge" },
    { t: "算法工程师", pm: 1.2, key: "knowledge", rq: { knowledge: 12 } },
    { t: "产品经理", pm: 1.0, key: "strategy", rq: { strategy: 8, charm: 4 } },
    { t: "测试开发", pm: 0.85, key: "knowledge", rq: { knowledge: -6 } },
    { t: "技术运营", pm: 0.78, key: "strategy", rq: { knowledge: -10 } }
  ],
  product_ops: [
    { t: "用户运营", pm: 0.95, key: "charm" }, { t: "活动策划", pm: 0.92, key: "strategy" },
    { t: "数据分析", pm: 1.05, key: "knowledge", rq: { knowledge: 8 } }, { t: "增长黑客", pm: 1.1, key: "strategy", rq: { insight: 6 } },
    { t: "内容运营", pm: 0.85, key: "insight", rq: { knowledge: -8 } }
  ],
  finance: [
    { t: "投行分析师", pm: 1.1, key: "strategy", rq: { strategy: 10, knowledge: 8 } }, { t: "行业研究员", pm: 1.0, key: "knowledge", rq: { knowledge: 12 } },
    { t: "客户经理", pm: 0.85, key: "charm", rq: { knowledge: -8, charm: 8 } }, { t: "风控合规", pm: 0.9, key: "knowledge" }, { t: "柜员/运营", pm: 0.6, key: "charm", rq: { knowledge: -16 } }
  ],
  consultant: [
    { t: "战略顾问", pm: 1.1, key: "strategy", rq: { strategy: 8 } }, { t: "实施顾问", pm: 0.92, key: "knowledge" },
    { t: "商业分析师", pm: 0.85, key: "knowledge", rq: { strategy: -6 } }, { t: "项目经理", pm: 1.05, key: "charm", rq: { charm: 8 } }
  ],
  sales_channel: [
    { t: "销售代表", pm: 0.85, key: "charm", rq: { knowledge: -6 } }, { t: "大客户经理", pm: 1.1, key: "charm", rq: { charm: 8, strategy: 6 } },
    { t: "渠道运营", pm: 0.95, key: "strategy" }, { t: "商务拓展(BD)", pm: 1.0, key: "charm", rq: { charm: 6 } }
  ],
  smallco: [
    { t: "行政专员", pm: 0.8, key: "charm", rq: { knowledge: -10 } }, { t: "市场专员", pm: 0.95, key: "charm" },
    { t: "项目助理", pm: 0.9, key: "strategy" }, { t: "综合主管", pm: 1.15, key: "strategy", rq: { strategy: 8 } }
  ],
  state_owned: [
    { t: "管培生", pm: 1.0, key: "knowledge" }, { t: "行政岗", pm: 0.85, key: "charm" },
    { t: "技术岗", pm: 1.05, key: "knowledge", rq: { knowledge: 6 } }, { t: "党群/工会", pm: 0.9, key: "charm", rq: { charm: 6 } }
  ],
  civil: [
    { t: "综合科员", pm: 1.0, key: "knowledge" }, { t: "执法岗", pm: 1.0, key: "body", rq: { body: 6 } },
    { t: "文秘岗", pm: 0.95, key: "knowledge", rq: { knowledge: 6 } }, { t: "窗口岗", pm: 0.9, key: "charm" }
  ],
  teacher: [
    { t: "语文老师", pm: 1.0, key: "knowledge" }, { t: "数学老师", pm: 1.05, key: "knowledge", rq: { knowledge: 6 } },
    { t: "班主任", pm: 1.1, key: "charm", rq: { charm: 8 } }, { t: "代课/实习老师", pm: 0.7, key: "charm", rq: { knowledge: -12 } }
  ],
  hospital_admin: [
    { t: "科室干事", pm: 1.0, key: "knowledge" }, { t: "医保结算", pm: 0.9, key: "knowledge" },
    { t: "护理岗", pm: 0.95, key: "body", rq: { body: 6 } }, { t: "院办行政", pm: 1.05, key: "strategy" }
  ],
  media_editor: [
    { t: "文字编辑", pm: 0.9, key: "knowledge" }, { t: "新媒体运营", pm: 0.95, key: "insight" },
    { t: "主编", pm: 1.2, key: "strategy", rq: { knowledge: 8 } }, { t: "短视频策划", pm: 1.0, key: "insight", rq: { insight: 6 } }
  ],
  streamer: [
    { t: "素人主播", pm: 0.7, key: "charm" }, { t: "签约达人", pm: 1.1, key: "charm", rq: { charm: 10 } },
    { t: "中控/运营", pm: 0.8, key: "strategy" }, { t: "选品招商", pm: 0.95, key: "strategy", rq: { insight: 6 } }
  ],
  factory_qc: [
    { t: "质检员", pm: 0.9, key: "knowledge" }, { t: "工艺技术员", pm: 1.05, key: "knowledge", rq: { knowledge: 6 } },
    { t: "班组长", pm: 1.0, key: "charm", rq: { body: 4 } }, { t: "普工", pm: 0.7, key: "body", rq: { knowledge: -16 } }
  ],
  service: [
    { t: "店员/营业员", pm: 0.85, key: "charm", rq: { knowledge: -10 } }, { t: "值班主管", pm: 1.05, key: "charm" },
    { t: "客服专员", pm: 0.9, key: "charm" }, { t: "配送/骑手", pm: 1.0, key: "body", rq: { body: 6, knowledge: -12 } }
  ],
  blackwork: [
    { t: "搬运/力工", pm: 1.0, key: "body", rq: { body: 8 } }, { t: "后厨杂工", pm: 0.9, key: "body" }, { t: "临时工", pm: 0.85, key: "body" }
  ],
  founder_staff: [
    { t: "早期员工", pm: 0.9, key: "knowledge" }, { t: "业务负责人", pm: 1.2, key: "strategy", rq: { strategy: 10 } }, { t: "合伙人", pm: 1.4, key: "strategy", rq: { strategy: 14, charm: 8 } }
  ],
  exec: [
    { t: "总监", pm: 0.9, key: "strategy" }, { t: "副总裁(VP)", pm: 1.15, key: "strategy", rq: { strategy: 8, network: 6 } }, { t: "总经理", pm: 1.4, key: "charm", rq: { charm: 10, network: 10 } }
  ]
};
// 生成某公司在招的具体岗位（每个 = 套了公司名+具体岗位的可应聘对象，含推荐门槛）
function companyPositions(s, c) {
  const base = (typeof JOBS !== "undefined" && JOBS.find(j => j.id === c.jobType)) || {};
  const tpls = POSITION_TEMPLATES[c.jobType] || [{ t: base.name || "员工", pm: 1, key: "knowledge" }];
  return tpls.map(tp => {
    const req = Object.assign({}, base.req || {});
    if (tp.rq) for (const k in tp.rq) req[k] = Math.max(0, (req[k] || 0) + tp.rq[k]);
    return {
      title: tp.t, key: tp.key, companyId: c.id, company: c.name, stockId: c.stockId || null,
      jobType: c.jobType, industry: base.industry, tier: base.tier, base: base.base, stress: base.stress, ladder: base.ladder,
      req: req, pay: Math.round((base.pay || 4000) * (c.payMul || 1) * (tp.pm || 1)),
      name: c.name + "·" + tp.t, _blurb: c.blurb
    };
  });
}

// 公司 → 可用的「岗位对象」：复用 JOBS 原型，套上公司名/薪资/上市标记
function companyJob(c) {
  const base = (typeof JOBS !== "undefined" && JOBS.find(j => j.id === c.jobType)) || {};
  return Object.assign({}, base, {
    name: c.name,
    companyId: c.id,
    stockId: c.stockId || null,
    industry: c.industry || base.industry,
    pay: Math.round((base.pay || 4000) * (c.payMul || 1)),
    _blurb: c.blurb || base.desc || ""
  });
}

// 岗位可达性（复刻 jobs.js ev_jobhunt 的 reach 逻辑，供按城市筛公司）
function jobReachable(s, job) {
  let lim = 1;
  for (const k in (job.req || {})) { const sv = k === "network" ? (s.network || 0) : ((s.stats && s.stats[k]) || 0); lim = Math.min(lim, sv / job.req[k]); }
  let need = 0.45;
  if ((job.tier || 0) >= 4) { need = 0.65; if (s.age < 26 && !has(s, "startup_exp") && !has(s, "bigtech")) return false; }
  if (job.id === "exec" && s.age < 30 && !has(s, "startup_done")) return false;
  return lim >= need;
}

// 当前城市可投的公司（按 city.tier 过滤 + 能力够得着 + 解锁）
function companiesForCity(s) {
  const t = (s.city && s.city.tier) || 2;
  return COMPANIES.filter(c => {
    if (c.locked && !has(s, "unlock_" + c.locked)) return false;
    if ((c.tierMax || 4) < t) return false;           // 城市层级越高(数字越小)，可选大公司越多
    return jobReachable(s, companyJob(c));
  });
}

// 每次投简历采样 n 家（随机 → 每次清单不太一样；列表太空时放宽到低门槛保底）
function sampleCompanies(s, n) {
  let pool = companiesForCity(s);
  if (pool.length < 3) {
    const fb = COMPANIES.filter(c => (c.tierMax || 4) >= ((s.city && s.city.tier) || 2) && (companyJob(c).tier || 0) <= 1);
    pool = Array.from(new Set(pool.concat(fb)));
  }
  const shuffled = (typeof shuf === "function") ? shuf(pool) : pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n || 6).sort((a, b) => companyJob(a).pay - companyJob(b).pay);
}

// 入职上市公司：发一笔 RSU(限制性股票)进持仓，从此身家与公司股价绑定（同一家公司只发一次）
function grantRSU(s, job) {
  if (!job || !job.stockId || !s.market || !s.market.prices) return 0;
  if (has(s, "rsu_" + job.stockId)) return 0;
  const px = s.market.prices[job.stockId];
  if (!px) return 0;
  flag(s, "rsu_" + job.stockId);
  const shares = 20 + Math.floor(Math.random() * 60);   // 20~80 股签字费级别的 RSU
  s.market.hold = s.market.hold || {};
  s.market.hold[job.stockId] = (s.market.hold[job.stockId] || 0) + shares;
  flag(s, "worked_listed");
  return shares;
}

if (typeof window !== "undefined") {
  window.COMPANIES = COMPANIES;
  window.companyById = companyById;
  window.companyJob = companyJob;
  window.jobReachable = jobReachable;
  window.companiesForCity = companiesForCity;
  window.sampleCompanies = sampleCompanies;
  window.grantRSU = grantRSU;
  window.companyPositions = companyPositions;
  window.POSITION_TEMPLATES = POSITION_TEMPLATES;
}
