"use strict";
/* =====================================================================
 * content/stocks.js —— 股市 / 理财系统（v1.0 新闻联动版）
 * 一个常驻的可经营资产组合：每周开盘，价格随【动态世界 + 基本面新闻】波动。
 *   · 当前隐藏风口(eraWind)命中的板块 → 跟着 windHeat 泡沫周期起飞，
 *     但热度过高(>72)会回调 —— 读新闻嗅出风口的人吃肉，最后接盘的人套牢。
 *   · 【新闻→盘面联动】手机新闻流里反复念叨的板块，会形成"催化(catalyst)"，
 *     一般到【下一周】开盘就兑现为对应涨跌；真利好持续、诱饵昙花一现、利空降温。
 *   · 【更早期的征兆】熬夜深扒能挖到下一轮风口的"苗头"新闻，对应板块提前小幅领涨，
 *     先知先觉者埋伏、后知后觉者追高。
 *   · 避险资产(黄金/债)在就业景气差时逆势上行；比特币高波动；指数 ETF 稳健随通胀缓升。
 * 持仓市值并入身价(netWorth)，因此理财好坏直接影响「财务自由」目标进度。
 * K 线为周线，长期累积（最多 MKT_CAP 周），随游戏动态生长。
 * 引擎：newState→initStocks(s)；endWeek→tickStocks(s)；refreshNews→applyNewsToMarket(s,feed)。
 * 纯逻辑，无 document/localStorage，可进 headless 模拟。
 * ===================================================================== */
const MKT_CAP = 312;            // K 线最长保留周数（≈6 年），随游戏推进不断累积
const MKT_SEED = 48;            // 开局预置的历史 K 线根数（≈11 个月走势）
const STOCKS = [
  { id: "realty", name: "神州地产", emoji: "🏢", sector: "房地产", kind: "stock", price0: 28, vol: 0.06 },
  { id: "ecom", name: "万象云购", emoji: "📦", sector: "电商", kind: "stock", price0: 42, vol: 0.07 },
  { id: "goose", name: "鹅厂控股", emoji: "🐧", sector: "移动互联网", kind: "stock", price0: 66, vol: 0.07 },
  { id: "shortv", name: "抖光传媒", emoji: "🎬", sector: "短视频直播", kind: "stock", price0: 35, vol: 0.09 },
  { id: "battery", name: "锂想新能源", emoji: "🔋", sector: "新能源", kind: "stock", price0: 52, vol: 0.09 },
  { id: "ai", name: "智涌智算", emoji: "🤖", sector: "AI大模型", kind: "stock", price0: 88, vol: 0.11 },
  { id: "robot", name: "灵犀机器人", emoji: "🦾", sector: "具身智能", kind: "stock", price0: 46, vol: 0.11 },
  { id: "fusion", name: "曦和聚能", emoji: "☀️", sector: "聚变能源", kind: "stock", price0: 40, vol: 0.12 },
  { id: "silver", name: "颐康养老", emoji: "🧓", sector: "银发经济", kind: "stock", price0: 24, vol: 0.06 },
  { id: "bci", name: "脑桥科技", emoji: "🧠", sector: "脑机接口", kind: "stock", price0: 36, vol: 0.13 },
  { id: "space", name: "九霄航天", emoji: "🚀", sector: "太空经济", kind: "stock", price0: 58, vol: 0.12 },
  { id: "index", name: "沪深300ETF", emoji: "📊", sector: null, kind: "index", price0: 38, vol: 0.03 },
  { id: "gold", name: "山河黄金", emoji: "🥇", sector: null, kind: "safe", price0: 30, vol: 0.025 },
  { id: "btc", name: "比特币", emoji: "₿", sector: "比特币", kind: "crypto", price0: 120, vol: 0.16 }
];
function stockById(id) { return STOCKS.find(x => x.id === id); }
// 板块 → 标的（用于新闻联动；一个板块目前一只标的，留作多标的扩展）
function stocksBySector(sector) { return STOCKS.filter(x => x.sector === sector); }

function initStocks(s) {
  const prices = {}, hold = {}, hist = {}, candles = {};
  for (const st of STOCKS) {
    prices[st.id] = st.price0; hold[st.id] = 0; hist[st.id] = [st.price0];
    // 给每只标的一段"历史行情"作为开局 K 线，让理财页一进来就有真实的走势可看
    candles[st.id] = seedCandles(st);
    prices[st.id] = candles[st.id][candles[st.id].length - 1].c;
    hist[st.id] = candles[st.id].map(k => k.c);
  }
  // catalysts: 板块→{dir,mag,ttl,early?,note}，由新闻推送、tickStocks 消化并衰减
  // newsLog: 最近一次"新闻→盘面"映射，供理财页展示基本面互通
  s.market = { prices, hold, hist, candles, catalysts: {}, newsLog: [], week: 0, realized: 0, invested: 0 };
}

// 生成一段开局前的历史 K 线（OHLC），围绕 price0 做几何随机游走
function seedCandles(st, n) {
  n = n || MKT_SEED;
  const out = []; let p = st.price0 * (0.72 + Math.random() * 0.2);
  for (let i = 0; i < n; i++) {
    const o = p;
    const drift = st.vol * st.vol / 6 + (st.kind === "safe" ? 0.0005 : 0.0012);
    const noise = (Math.random() * 2 - 1) * st.vol;
    let c = o * (1 + drift + noise);
    c = Math.max(st.price0 * 0.05, c);
    out.push(makeCandle(o, c, st.vol));
    p = c;
  }
  return out;
}

// 由开盘价 o、收盘价 c 与波动率合成一根带上下影线的 K 线
function makeCandle(o, c, vol) {
  const hi0 = Math.max(o, c), lo0 = Math.min(o, c);
  const wick = (Math.abs(o - c) * 0.6 + (o + c) / 2 * vol * 0.5);
  const h = hi0 + Math.random() * wick;
  const l = Math.max(0.01, lo0 - Math.random() * wick);
  return { o: o, h: h, l: l, c: c };
}

// 每周开盘：按动态世界 + 新闻催化推进每只标的的价格
function tickStocks(s) {
  if (!s.market) return;
  const w = s.world || {};
  const cats = s.market.catalysts || (s.market.catalysts = {});
  for (const st of STOCKS) {
    let p = s.market.prices[st.id];
    const hot = st.sector && st.sector === s.eraWind;             // 命中当前风口板块
    const cat = st.sector ? cats[st.sector] : null;              // 该板块的新闻催化（上一周新闻形成）
    let vol = hot ? st.vol * 1.5 : st.vol;
    if (cat) vol *= 1 + Math.min(0.5, cat.mag * 8);              // 有催化时波动放大（消息面活跃）
    // 抵消「波动拖累」(均匀噪声方差=vol²/3，几何负偏=vol²/6)，再叠加温和真实回报
    let drift = vol * vol / 6 + (st.kind === "safe" ? 0.0005 : 0.0012);
    if (hot) {
      const heat = (w.windHeat != null ? w.windHeat : 20);
      drift += 0.005 + heat / 100 * 0.008;                        // 风口期强劲上行
      if (heat > 72) drift -= (heat - 72) / 100 * 0.06;           // 过热回调（接盘风险）
    }
    if (st.kind === "safe" && (w.jobMarket != null ? w.jobMarket : 60) < 42) drift += 0.0025; // 衰退避险
    // 泡沫破裂：该板块连续数周崩盘，late 进场者被深埋；避险资产逆势小涨
    if (w.crash) {
      if (st.sector === w.crash.sector) { drift -= 0.11; vol *= 1.6; }
      else if (st.kind === "safe") drift += 0.004;
    }
    drift += (w.momentum || 0) / 100 * 0.0008 * (st.kind === "crypto" ? 2 : 1);
    // 新闻催化兑现：上一周新闻里反复念叨的板块，本周开盘做出对应涨跌
    if (cat) drift += cat.dir * cat.mag;
    const noise = (Math.random() * 2 - 1) * vol;
    let np = p * (1 + drift + noise);
    np = Math.max(st.price0 * 0.05, Math.min(st.price0 * 120, np)); // 防归零 + 防爆涨（封顶 120×，杜绝"亿元一股"）
    s.market.prices[st.id] = np;
    const h = s.market.hist[st.id]; h.push(np); if (h.length > MKT_CAP) h.shift();
    // 同步记录这一周的 K 线（开=上周收，收=本周价，按波动率合成上下影线）
    if (!s.market.candles) s.market.candles = {};
    const cd = s.market.candles[st.id] || (s.market.candles[st.id] = []);
    cd.push(makeCandle(p, np, vol)); if (cd.length > MKT_CAP) cd.shift();
  }
  // 催化衰减：兑现后逐周减弱、到期清除（保证"消息驱动一两周脉冲"而非永久加成）
  for (const k in cats) { const c = cats[k]; c.ttl -= 1; c.mag *= 0.55; if (c.ttl <= 0 || c.mag < 0.0015) delete cats[k]; }
  s.market.week = (s.market.week || 0) + 1;
}

/* ============== 新闻 ↔ 盘面 联动 ==============
 * 给某板块推一个催化（下一次 tickStocks 兑现）。同向叠加、反向覆盖。 */
function pushCatalyst(s, sector, dir, mag, ttl, meta) {
  if (!s.market || !sector) return;
  if (!stocksBySector(sector).length) return;                     // 没有对应标的的板块（如"下海经商"）忽略
  const cats = s.market.catalysts || (s.market.catalysts = {});
  const c = cats[sector];
  if (c && c.dir === dir) { c.mag = Math.min(c.mag + mag, 0.02); c.ttl = Math.max(c.ttl, ttl); if (meta) Object.assign(c, meta); }
  else cats[sector] = Object.assign({ dir: dir, mag: mag, ttl: ttl }, meta || {});
}
// 扫描一屏新闻 feed，转化为下一周的盘面催化，并记录"新闻→盘面"映射供展示。
// feed 文章字段：{wind?, signal, early?, bear?, headline, source}
function applyNewsToMarket(s, feed) {
  if (!s.market || !feed || !feed.length) return;
  const eraWind = s.eraWind;
  const heat = (s.world && s.world.windHeat != null) ? s.world.windHeat : 30;
  const log = [];
  for (const a of feed) {
    if (a.bear) {                                                 // 利空：给当前最热板块泼冷水（顶端降温）
      if (eraWind && stocksBySector(eraWind).length) {
        pushCatalyst(s, eraWind, -1, 0.02, 2);
        log.push({ sector: eraWind, dir: -1, headline: a.headline, source: a.source });
      }
      continue;
    }
    if (!a.wind || !stocksBySector(a.wind).length) continue;
    if (a.early) {                                                // 早期征兆：苗头板块提前小幅领涨
      pushCatalyst(s, a.wind, 1, 0.013, 3, { early: true });
      log.push({ sector: a.wind, dir: 1, early: true, headline: a.headline, source: a.source });
    } else if (a.signal && a.wind === eraWind) {                  // 真实利好：风口板块上行（过热则钝化）
      const mag = heat > 80 ? 0.006 : heat > 60 ? 0.011 : 0.017;
      pushCatalyst(s, a.wind, 1, mag, 3);
      log.push({ sector: a.wind, dir: 1, headline: a.headline, source: a.source });
    } else {                                                      // 诱饵板块：短促拉一下随即熄火（head-fake）
      pushCatalyst(s, a.wind, 1, 0.013, 1, { decoy: true });
      log.push({ sector: a.wind, dir: 1, decoy: true, headline: a.headline, source: a.source });
    }
  }
  if (log.length) s.market.newsLog = log.slice(0, 6);
}
// 读取某板块当前催化状态（理财页给标的打标签用）
function sectorCatalyst(s, sector) {
  if (!s.market || !s.market.catalysts || !sector) return null;
  return s.market.catalysts[sector] || null;
}

function stockValue(s) {
  if (!s.market) return 0;
  let v = 0; for (const st of STOCKS) v += (s.market.hold[st.id] || 0) * (s.market.prices[st.id] || 0);
  return Math.round(v);
}
// 取某只标的的 K 线序列；老存档没有 candles 时，从收盘价 hist 重建一份
function stockCandles(s, id) {
  if (!s.market) return [];
  const cd = s.market.candles && s.market.candles[id];
  if (cd && cd.length) return cd;
  const h = (s.market.hist && s.market.hist[id]) || [];
  const st = stockById(id), vol = st ? st.vol : 0.06; const out = [];
  for (let i = 1; i < h.length; i++) out.push(makeCandle(h[i - 1], h[i], vol));
  return out;
}
// 某只标的较上周涨跌幅（%）
function stockChange(s, id) {
  const h = s.market && s.market.hist[id]; if (!h || h.length < 2) return 0;
  return (h[h.length - 1] / h[h.length - 2] - 1) * 100;
}
function buyStock(s, id, shares) {
  if (!s.market || shares <= 0) return false;
  const price = s.market.prices[id]; const cost = price * shares;
  if (s.cash < cost) return false;
  s.cash -= cost; s.market.hold[id] += shares; s.market.invested += cost;
  return true;
}
function sellStock(s, id, shares) {
  if (!s.market) return false;
  const have = s.market.hold[id] || 0; shares = Math.min(shares, have);
  if (shares <= 0) return false;
  const price = s.market.prices[id]; const proceeds = price * shares;
  s.cash += proceeds; s.market.hold[id] -= shares;
  return true;
}
// 一键全部清仓（变现），返回总额
function liquidateStocks(s) {
  if (!s.market) return 0;
  let total = 0;
  for (const st of STOCKS) { const n = s.market.hold[st.id] || 0; if (n > 0) { total += s.market.prices[st.id] * n; s.market.hold[st.id] = 0; } }
  s.cash += total; return Math.round(total);
}
