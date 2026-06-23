"use strict";
/* =====================================================================
 * content/dynamic.js —— 高级动态世界系统（v0.6）
 * 很多数值不再写死，而是随【时间 + 玩家交互 + 世界周期】实时浮动：
 *   priceIndex  物价指数（通胀）—— 逐年上涨，繁荣期更快；影响生活成本/薪资/房价
 *   jobMarket   就业景气 0-100 —— 围绕基线波动，衰退年(08/20/22…)下挫；影响求职/薪资/裁员
 *   windHeat    风口热度 0-100 —— 当前风口的泡沫周期：先冲高后回落；早进暴利、晚进接盘
 *   momentum    个人势头 -100..100 —— 顺风顺水/霉运缠身，偏置后续事件成败，自然衰减
 *   pace        社会卷度 0-100 —— 随年代缓慢上升（越来越卷），抬高工作压力
 * 引擎每周调用 tickWorld(s) 推进；各处用 livingCost(s)/luckBias(s)/bumpMomentum(s,d) 读写。
 * ===================================================================== */
/* —— 全球地理：国家 + 城市（按一/二/三线分级，花销 cost 与机会 opp 各不同） —— */
const COUNTRIES = [
  { id: "cn", name: "中国大陆", flag: "🇨🇳", region: "亚洲", style: "cn" },
  { id: "hk", name: "中国香港", flag: "🇭🇰", region: "亚洲", style: "cn" },
  { id: "sg", name: "新加坡", flag: "🇸🇬", region: "亚洲", style: "en" },
  { id: "jp", name: "日本", flag: "🇯🇵", region: "亚洲", style: "jp" },
  { id: "us", name: "美国", flag: "🇺🇸", region: "北美", style: "us" },
  { id: "uk", name: "英国", flag: "🇬🇧", region: "欧洲", style: "uk" },
  { id: "au", name: "澳大利亚", flag: "🇦🇺", region: "大洋洲", style: "au" },
  { id: "ca", name: "加拿大", flag: "🇨🇦", region: "北美", style: "ca" }
];
// city: {id,country,flag,name,tier(1/2/3),cost,opp,house,paceMod}
const CITIES = [
  // 中国
  { id: "cn_bj", country: "cn", name: "北京", tier: 1, cost: 1.55, opp: 1.75, house: 2.05, paceMod: 22 },
  { id: "cn_sh", country: "cn", name: "上海", tier: 1, cost: 1.6, opp: 1.8, house: 2.15, paceMod: 22 },
  { id: "cn_gz", country: "cn", name: "广州", tier: 1, cost: 1.28, opp: 1.45, house: 1.45, paceMod: 16 },
  { id: "cn_sz", country: "cn", name: "深圳", tier: 1, cost: 1.48, opp: 1.7, house: 1.95, paceMod: 21 },
  { id: "cn_hz", country: "cn", name: "杭州", tier: 2, cost: 1.08, opp: 1.3, house: 1.35, paceMod: 11 },
  { id: "cn_nj", country: "cn", name: "南京", tier: 2, cost: 0.98, opp: 1.18, house: 1.18, paceMod: 9 },
  { id: "cn_cd", country: "cn", name: "成都", tier: 2, cost: 0.82, opp: 1.05, house: 0.9, paceMod: 2 },
  { id: "cn_wh", country: "cn", name: "武汉", tier: 2, cost: 0.8, opp: 1.0, house: 0.85, paceMod: 4 },
  { id: "cn_xa", country: "cn", name: "西安", tier: 2, cost: 0.74, opp: 0.92, house: 0.75, paceMod: 2 },
  { id: "cn_cs", country: "cn", name: "长沙", tier: 2, cost: 0.72, opp: 0.9, house: 0.72, paceMod: 1 },
  { id: "cn_qd", country: "cn", name: "青岛", tier: 3, cost: 0.7, opp: 0.82, house: 0.72, paceMod: -1 },
  { id: "cn_ly", country: "cn", name: "洛阳", tier: 3, cost: 0.52, opp: 0.58, house: 0.45, paceMod: -8 },
  { id: "cn_gl", country: "cn", name: "桂林", tier: 3, cost: 0.5, opp: 0.52, house: 0.4, paceMod: -10 },
  { id: "cn_home", country: "cn", name: "老家县城", tier: 3, cost: 0.4, opp: 0.4, house: 0.3, paceMod: -14 },
  // 中国香港
  { id: "hk_hk", country: "hk", name: "香港", tier: 1, cost: 2.6, opp: 1.9, house: 3.0, paceMod: 24 },
  { id: "hk_kl", country: "hk", name: "九龙", tier: 2, cost: 2.25, opp: 1.65, house: 2.55, paceMod: 20 },
  { id: "hk_nt", country: "hk", name: "新界", tier: 3, cost: 1.8, opp: 1.3, house: 2.0, paceMod: 14 },
  // 新加坡
  { id: "sg_sg", country: "sg", name: "新加坡", tier: 1, cost: 2.2, opp: 1.9, house: 2.4, paceMod: 18 },
  { id: "sg_je", country: "sg", name: "裕廊", tier: 2, cost: 1.9, opp: 1.6, house: 2.0, paceMod: 14 },
  { id: "sg_wl", country: "sg", name: "兀兰", tier: 3, cost: 1.65, opp: 1.25, house: 1.65, paceMod: 8 },
  // 日本
  { id: "jp_tk", country: "jp", name: "东京", tier: 1, cost: 1.9, opp: 1.8, house: 1.8, paceMod: 18 },
  { id: "jp_os", country: "jp", name: "大阪", tier: 2, cost: 1.5, opp: 1.4, house: 1.3, paceMod: 10 },
  { id: "jp_yh", country: "jp", name: "横滨", tier: 2, cost: 1.55, opp: 1.35, house: 1.35, paceMod: 9 },
  { id: "jp_kt", country: "jp", name: "京都", tier: 2, cost: 1.4, opp: 1.2, house: 1.3, paceMod: 6 },
  { id: "jp_fk", country: "jp", name: "福冈", tier: 3, cost: 1.1, opp: 1.1, house: 0.9, paceMod: 2 },
  { id: "jp_sp", country: "jp", name: "札幌", tier: 3, cost: 1.05, opp: 0.95, house: 0.85, paceMod: -1 },
  // 美国
  { id: "us_ny", country: "us", name: "纽约", tier: 1, cost: 2.4, opp: 2.2, house: 2.6, paceMod: 24 },
  { id: "us_sf", country: "us", name: "旧金山", tier: 1, cost: 2.55, opp: 2.4, house: 2.85, paceMod: 22 },
  { id: "us_la", country: "us", name: "洛杉矶", tier: 1, cost: 2.0, opp: 1.9, house: 2.0, paceMod: 16 },
  { id: "us_se", country: "us", name: "西雅图", tier: 2, cost: 1.9, opp: 1.9, house: 1.9, paceMod: 14 },
  { id: "us_au", country: "us", name: "奥斯汀", tier: 2, cost: 1.5, opp: 1.7, house: 1.2, paceMod: 10 },
  { id: "us_bo", country: "us", name: "波士顿", tier: 2, cost: 1.85, opp: 1.75, house: 1.85, paceMod: 12 },
  { id: "us_ch", country: "us", name: "芝加哥", tier: 2, cost: 1.45, opp: 1.45, house: 1.1, paceMod: 8 },
  { id: "us_pt", country: "us", name: "匹兹堡", tier: 3, cost: 1.2, opp: 1.1, house: 0.9, paceMod: 4 },
  { id: "us_ra", country: "us", name: "罗利", tier: 3, cost: 1.1, opp: 1.25, house: 0.85, paceMod: 2 },
  // 英国
  { id: "uk_ld", country: "uk", name: "伦敦", tier: 1, cost: 2.3, opp: 2.0, house: 2.4, paceMod: 20 },
  { id: "uk_mc", country: "uk", name: "曼彻斯特", tier: 2, cost: 1.4, opp: 1.4, house: 1.2, paceMod: 8 },
  { id: "uk_ed", country: "uk", name: "爱丁堡", tier: 2, cost: 1.5, opp: 1.3, house: 1.3, paceMod: 6 },
  { id: "uk_br", country: "uk", name: "布里斯托", tier: 2, cost: 1.35, opp: 1.25, house: 1.15, paceMod: 5 },
  { id: "uk_ls", country: "uk", name: "利兹", tier: 3, cost: 1.1, opp: 1.1, house: 0.9, paceMod: 2 },
  { id: "uk_nv", country: "uk", name: "纽卡斯尔", tier: 3, cost: 1.0, opp: 0.95, house: 0.8, paceMod: -1 },
  // 澳大利亚
  { id: "au_sy", country: "au", name: "悉尼", tier: 1, cost: 2.1, opp: 1.8, house: 2.3, paceMod: 16 },
  { id: "au_mb", country: "au", name: "墨尔本", tier: 1, cost: 1.9, opp: 1.7, house: 2.0, paceMod: 14 },
  { id: "au_br", country: "au", name: "布里斯班", tier: 2, cost: 1.5, opp: 1.4, house: 1.4, paceMod: 8 },
  { id: "au_pe", country: "au", name: "珀斯", tier: 2, cost: 1.45, opp: 1.25, house: 1.25, paceMod: 5 },
  { id: "au_ad", country: "au", name: "阿德莱德", tier: 3, cost: 1.3, opp: 1.2, house: 1.1, paceMod: 4 },
  { id: "au_hb", country: "au", name: "霍巴特", tier: 3, cost: 1.15, opp: 0.9, house: 0.95, paceMod: -2 },
  // 加拿大
  { id: "ca_to", country: "ca", name: "多伦多", tier: 1, cost: 1.9, opp: 1.7, house: 2.0, paceMod: 14 },
  { id: "ca_vc", country: "ca", name: "温哥华", tier: 1, cost: 2.0, opp: 1.6, house: 2.3, paceMod: 12 },
  { id: "ca_mt", country: "ca", name: "蒙特利尔", tier: 2, cost: 1.4, opp: 1.3, house: 1.2, paceMod: 6 },
  { id: "ca_ot", country: "ca", name: "渥太华", tier: 2, cost: 1.3, opp: 1.2, house: 1.1, paceMod: 4 },
  { id: "ca_cl", country: "ca", name: "卡尔加里", tier: 3, cost: 1.2, opp: 1.25, house: 0.95, paceMod: 2 },
  { id: "ca_hf", country: "ca", name: "哈利法克斯", tier: 3, cost: 1.05, opp: 0.9, house: 0.8, paceMod: -2 }
];
const TIER_NAME = { 1: "一线", 2: "二线", 3: "三线" };
const DOMESTIC_COUNTRY_IDS = ["cn", "hk"];
CITIES.forEach(c => { const co = COUNTRIES.find(x => x.id === c.country); c.flag = co ? co.flag : ""; });
function countryById(id) { return COUNTRIES.find(c => c.id === id); }
function cityById(id) { return CITIES.find(c => c.id === id); }
function citiesByCountry(countryId) { return CITIES.filter(c => c.country === countryId); }
function citiesOf(countryId) { return citiesByCountry(countryId); }
function cityFull(c) { return `${c.flag || (countryById(c.country) || {}).flag || ""}${c.name}`; }
function cityDesc(c) { return `${cityFull(c)}｜${TIER_NAME[c.tier]}｜机会x${c.opp}｜房价x${c.house}｜生活x${c.cost}`; }
function moveCity(s, c) {
  const current = s.city || cityById("cn_cd");
  const crossBorder = current.country !== c.country;
  const abroad = !DOMESTIC_COUNTRY_IDS.includes(c.country);
  const moveCost = Math.round((crossBorder ? (abroad ? 90000 : 50000) : 30000) * (s.world ? s.world.priceIndex : 1) * Math.max(0.7, c.cost));
  if (s.cash < moveCost) return `你算了算搬迁、押金和安顿的钱（约 ¥${moveCost.toLocaleString()}），现金还撑不起这次迁徙。地图可以先合上，但念头不会消失。`;
  add(s, "cash", -moveCost); s.city = c; add(s, "mood", abroad ? 7 : 5); add(s, "network", abroad ? -14 : -8);
  if (abroad) flag(s, "emigrated");
  if (s.world) s.world.pace = Math.max(0, Math.min(100, s.world.pace + c.paceMod * 0.4));
  initSocial(s);
  return `你拖着行李落脚在「${cityFull(c)}」。新的街道、新的价格、新的口音把旧日常整块挪开；人脉要重建，生活也重新开局。`;
}
function cityPickerNode(cities, backText) {
  return {
    text: () => `城市摊在你面前。有人往机会更密的地方挤，也有人往房租更轻的地方退。你要把下一段人生放在哪里？`,
    choices: cities.map(c => ({
      label: `去${cityDesc(c)}`,
      effect: (s) => moveCity(s, c)
    })).concat([{ label: backText || "再想想", effect: () => "你把选择暂时搁下。地图还亮着，生活先照常推进。" }])
  };
}
const RECESSION_YEARS = [1998, 2008, 2009, 2015, 2020, 2022, 2023];

function initWorld(s) {
  s.world = { priceIndex: 1.0, jobMarket: 62, windHeat: 18, momentum: 0, pace: 28, _wk: s.eraWind };
  s.city = cityById("cn_cd");   // 默认成都（二线）
  s.job = null;                 // 当前正式工作（null=没正经工作，只能打零工）
}
function tickWorld(s) {
  // —— 延迟投资兑现：几周前下的注到期才揭晓盈亏并回款（赚钱需要时间出结果，不再点一下立刻到账）——
  if (s._pendingBets && s._pendingBets.length) {
    const due = s._pendingBets.filter(b => s.week >= b.due);
    if (due.length) {
      s._pendingBets = s._pendingBets.filter(b => s.week < b.due);
      s._weekNotes = s._weekNotes || [];
      for (const b of due) {
        add(s, "cash", b.ret);
        if (typeof bumpMomentum === "function") bumpMomentum(s, b.ret > b.bet ? 3 : -3);
        if (b.ret < b.bet * 0.5 && typeof flag === "function") flag(s, "got_scammed");
        const verb = b.ret > b.bet * 1.05 ? `滚成了 ¥${b.ret.toLocaleString()}，押对了，乐得睡不着`
          : b.ret < b.bet * 0.95 ? `缩水成 ¥${b.ret.toLocaleString()}，被市场上了一课`
          : `不温不火，回到 ¥${b.ret.toLocaleString()}，一通操作原地杵`;
        s._weekNotes.push(`📈 当初押进「${b.tk}」的 ¥${b.bet.toLocaleString()} 有结果了：${verb}。`);
        if (s.timeline) s.timeline.push({ age: s.age, text: `投在「${b.tk}」的 ¥${b.bet.toLocaleString()} ${verb}。` });
      }
    }
  }
  const w = s.world; if (!w) return;
  // 通胀（繁荣期更快），封顶 4x 防止晚年成本失控
  if (w.priceIndex < 4) w.priceIndex *= 1 + (0.022 + (w.jobMarket > 70 ? 0.008 : 0)) / 52;
  // 就业景气：向 62 回归 + 扰动；衰退年砸盘
  let target = RECESSION_YEARS.includes(s.year) ? 33 : 62;
  w.jobMarket += (target - w.jobMarket) * 0.03 + (Math.random() * 3 - 1.5);
  w.jobMarket = Math.max(8, Math.min(96, w.jobMarket));
  // 风口热度：换风口重置，泡沫先疯涨后破裂
  if (w._wk !== s.eraWind) { w._wk = s.eraWind; w.windHeat = 14; delete w.crash; }
  else {
    // 过热区(>78)有概率泡沫破裂：热度骤降 + 标记该板块崩盘（套牢晚进的接盘者）
    if (w.windHeat > 78 && !w.crash && Math.random() < 0.04) {
      w.windHeat = 20 + Math.random() * 12;
      w.crash = { sector: s.eraWind, weeks: 4 + Math.floor(Math.random() * 3), fresh: true };
    } else {
      // 未破裂：贪婪继续冲（软顶抬到 ~90，让泡沫吹得更大），过热则缓降
      w.windHeat += (w.windHeat < 90 ? 0.5 : -0.4) + (Math.random() * 0.5 - 0.25);
    }
  }
  w.windHeat = Math.max(4, Math.min(100, w.windHeat));
  // 崩盘倒计时
  if (w.crash) { w.crash.weeks -= 1; if (w.crash.weeks <= 0) delete w.crash; }
  // 卷度缓升
  w.pace = Math.max(0, Math.min(100, w.pace + 0.012));
  // 势头自然衰减
  w.momentum *= 0.992;
}
// —— 动态读数 ——
/* 每月账单明细：把笼统的「生活成本」拆成逐项账单，让玩家看清钱花在哪、被通胀一点点吃掉。
 * 各项随【物价(通胀)×城市×阶级×房车子女】浮动 → 越往后账单越重，不持续搞钱就会被拖垮。
 * 返回 { items:[{key,emoji,label,amount,note?}], total }。livingCost(s) = 账单合计（保持旧调用兼容）。*/
function monthlyBill(s) {
  const P = s.world ? s.world.priceIndex : 1;     // 通胀指数（随年代上行，账单逐年变贵）
  const C = s.city ? s.city.cost : 1;             // 城市生活成本系数
  const H = s.city ? (s.city.house || 1) : 1;     // 城市房价/房租系数
  const T = classTier(s);                         // 阶级（消费升级）
  const age = s.age || 18;
  const kids = (s.children && s.children.length) ? s.children.length : (has(s, "has_kid") ? 1 : 0);
  const items = [];
  const push = (key, emoji, label, amount, note) => { if (amount > 0) items.push({ key, emoji, label, amount: Math.round(amount), note }); };

  const wk = ((s.week % 52) + 52) % 52;            // 用于季节性项（过年红包）
  // 🍚 一日三餐：人人都要吃，随年龄/通胀缓升
  push("food", "🍚", "一日三餐", (820 + age * 12) * P);
  // 🏠 居住：有房=只付物业水电暖；无房=房租（随城市房价系数与通胀涨）
  if (has(s, "has_house")) push("home", "🏠", "物业·取暖", 480 * P * C, "好在房子是自己的");
  else if (s._housing === "near_office") push("rent", "🏠", "房租·公司旁", 1000 * H * P * 1.6, "离公司近，省下的通勤时间都贴进了房租");   // ★批次3：搬近公司→房租明显上涨
  else push("rent", "🏠", "房租", 1000 * H * P, "房东又在群里发消息了");
  // 💡 水电燃气
  push("util", "💡", "水电燃气", 190 * P * C);
  // 📱 通讯·订阅：话费、宽带、视频会员、云盘……每月被自动扣的一小笔
  push("comm", "📱", "通讯·会员订阅", (95 + T * 45) * P, "总有几个 App 在偷偷续费");
  // 🚇 出行：有车=油费保养停车；无车=通勤
  if (has(s, "has_car")) push("car", "🚗", "油费·养车", 760 * P, "车是吞金兽");
  else push("commute", "🚇", "通勤交通", 230 * P * C);
  // 🛡️ 保险：社保医保之外的商业险，越有家底越舍得保（穷人几乎不保）
  push("insure", "🛡️", "保险", (60 + T * 130 + (kids > 0 ? 80 : 0)) * P);
  // 💊 医疗·健康：日常买药、体检、看牙……年纪越大越贵
  push("health", "💊", "医疗·健康", (110 + Math.max(0, age - 22) * 7) * P, age >= 50 ? "上了年纪，零件开始要保养" : "");
  // 👶 子女：有娃就是碎钞机（奶粉/学费/兴趣班），鸡娃更贵
  if (kids > 0) push("kids", "👶", kids > 1 ? `${kids} 个孩子的开销` : "孩子的开销", kids * 1050 * P * (1 + T * 0.2));
  // 🍻 人情社交：随人脉与阶级水涨船高
  push("social", "🍻", "人情社交", (220 + (s.network || 0) * 3 + T * 280) * P);
  // 🧧 过年红包·节礼：年底前后那个月，份子钱与孝敬一起到账
  if (wk >= 47 || wk <= 3) push("redpkt", "🧧", "过年红包·节礼", (450 + (s.network || 0) * 5 + T * 380) * P, "一年到头，这个月最烧钱");
  // ✨ 品质生活：越有钱花得越多（消费升级，吃掉储蓄）——随阶级与年龄一起涨
  if (T > 0) push("life", "✨", "品质生活", T * (780 + age * 18) * P, T >= 3 ? "由俭入奢易，由奢入俭难" : "");
  // 🏦 月供：创业贷款未变现前持续还（随物价上浮）
  if (has(s, "has_loan") && !has(s, "startup_done")) push("loan", "🏦", "创业贷款月供", 10000 * P, "银行的电话准时响起");

  const total = items.reduce((a, b) => a + b.amount, 0);
  return { items, total };
}
function livingCost(s) { return monthlyBill(s).total; }
// 某一维度对「成事概率/收益」的加成：35 为中庸(0)，越高越顺(最高约 +0.55)，越低越背(最低约 -0.3)。
// 让六维真正左右人生走向：高的那一维，相关的事就明显更顺；低的那一维，处处吃瘪。
function statEdge(s, key) { var v = (s.stats && s.stats[key] != null) ? s.stats[key] : 35; return Math.max(-0.3, Math.min(0.55, (v - 35) / 110)); }
// 综合运气 = 时代势头 + 你的【洞察】：看得准的人，事情就是更顺、更少踩坑。
function luckBias(s) { return (s.world ? s.world.momentum / 260 : 0) + statEdge(s, "insight") * 0.45; }   // 约 -0.5 .. +0.62
function bumpMomentum(s, d) { if (s.world) s.world.momentum = Math.max(-100, Math.min(100, s.world.momentum + d)); }
// 重大成功的「肥尾兑现」：高风险路（上市/套现/封神）成功时一次性变现，结果不再是固定小数，
// 而是以 realBase（开局购买力口径）为中枢、带长尾的随机额——绝大多数千万~亿，少数十亿，
// 极少数百亿，凤毛麟角能到千亿。让人生上限真正打开（呼应「上市公司创始人理应身价惊人」），
// 又保持「越往上越罕见」。返回名义金额（已乘当年物价）。
function bigWindfall(s, realBase) {
  var pi = (s.world && s.world.priceIndex) ? s.world.priceIndex : 1;
  var mult = 0.7 + Math.random() * 1.5;                       // 常态 0.7~2.2×
  var r = Math.random();
  if (r < 0.0015) mult *= 250 + Math.random() * 950;          // ~0.15% 千亿级独角兽
  else if (r < 0.02) mult *= 18 + Math.random() * 42;         // ~1.85% 百亿级
  else if (r < 0.10) mult *= 4 + Math.random() * 8;           // ~8% 十亿级
  return Math.round(Math.max(0, realBase) * mult * pi);
}
// 风口收益倍率：押中风口时，越早(热度低)倍率越高，泡沫顶端(热度高)反而接盘
function windPayoff(s, aligned) {
  if (!aligned) return 0.5;   // 押错赛道：明显吃亏，逼你读新闻/转型
  const h = s.world ? s.world.windHeat : 40;
  return h < 35 ? 1.9 : h < 60 ? 1.5 : h < 80 ? 1.0 : 0.55;   // 早鸟红利 → 顶端接盘
}

/* —— 换城市事件（由「换个城市」行动触发） —— */
EVENTS.push({
  id: "ev_relocate", module: "life",
  title: "🧳 换个城市生活",
  text: (s) => {
    const c = s.city || cityById("cn_cd");
    return `你现在在「${cityFull(c)}」（${TIER_NAME[c.tier]}，生活成本x${c.cost}，机会x${c.opp}，房价x${c.house}）。换座城市，是逃离，也是重启。先定方向：留在国内，还是出国？`;
  },
  dynamicChoices: (s) => {
    const current = s.city || cityById("cn_cd");
    const domesticCountries = COUNTRIES.filter(co => DOMESTIC_COUNTRY_IDS.includes(co.id));
    const abroadCountries = COUNTRIES.filter(co => !DOMESTIC_COUNTRY_IDS.includes(co.id));
    const countryNode = (countries, scope) => ({
      text: () => scope === "domestic"
        ? "国内换城不只是从一个坐标挪到另一个坐标，也是在重新选择节奏、圈层和房价压力。先选地方。"
        : "出国意味着语言、签证、人脉和现金流一起重排。先选国家，再选落脚城市。",
      choices: countries.map(co => ({
        label: `${co.flag} ${co.name}`,
        next: () => cityPickerNode(citiesByCountry(co.id).filter(c => c.id !== current.id), "先不去这里")
      })).concat([{ label: "返回", effect: () => "你把地图缩小了一点，决定先不急着落子。" }])
    });
    return [
      { label: "先在国内换个城市", next: () => countryNode(domesticCountries, "domestic") },
      { label: "出国重新开始", next: () => countryNode(abroadCountries, "abroad") },
      { label: "算了，故土难离", effect: (s) => { add(s, "mood", 1); return "你对着地图看了很久，终究没舍得走。留下，也是一种选择。"; } }
    ];
  },
  choices: []
});
