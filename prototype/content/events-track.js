"use strict";
/* =====================================================================
 * content/events-track.js —— 赛道专属叙事（v0.14）
 * 根据你押的创业赛道(s.startup.tracks)，动态触发该赛道独有的剧情，文案直接取自
 * tracks.js 每个赛道的 boom(押对/做成) / bust(押错/泡沫破灭) 故事 → 30 个赛道各有各的戏：
 *   ① 乘风而起：你押的某个赛道正撞在隐藏风口上 → 用它的 boom 叙事 + 抉择(梭哈/落袋)
 *   ② 泡沫警钟：你手里有「泡沫」赛道，外面正吹得震天响 → 用它的 bust 叙事 + 抉择(追高/抽身)
 *   ③ 赛道转型：押错了风口，要不要 pivot 到当下真正的风口
 * 依赖：trackByName(tracks.js)、has/flag/add/rnd/pick(core.js)。
 * ===================================================================== */

// 取玩家当前创业押的赛道名数组
function _suTracks(s) { return (s.startup && s.startup.tracks && s.startup.tracks.length) ? s.startup.tracks : (s.startup && s.startup.track ? [s.startup.track] : []); }
function _trk(name) { return (typeof trackByName === "function") ? trackByName(name) : null; }

EVENTS.push(
  /* ① 乘风而起：你押的赛道里有一个正是当年风口 */
  {
    id: "ev_track_riding", module: "startup", ambient: true,
    cond: (s) => s.startup && !has(s, "startup_done") && _suTracks(s).indexOf(s.eraWind) >= 0 && (s.age - (s.startup.foundedAge || s.age)) >= 1,
    title: "🌊 风，正吹在你这条船上",
    text: (s) => { const t = _trk(s.eraWind); return (t && t.boom) ? t.boom + "\n\n站在风口上，连空气都是甜的。可风总会停——这泼天的富贵，你打算怎么接？" : `你押的「${s.eraWind}」正撞在风口上，订单和热钱一起涌来。这泼天的富贵，你打算怎么接？`; },
    dynamicChoices: (s) => [
      { label: "梭哈！趁势把规模铺到最大", effect: (s) => { if (s.startup) { s.startup.progress += 8; s.startup.valuation = Math.round((s.startup.valuation || 0) * 1.35); } add(s, "stress", 10); add(s, "health", -4); flag(s, "su_users"); bumpMomentum(s, 8); return "你把油门踩到底，招人、烧钱、抢市场，估值一周翻一截。要么封神，要么粉身碎骨——你选了前者押注。"; } },
      { label: "见好就收，先落一笔安全垫", effect: (s) => { const cash = Math.round(200000 + (s.startup ? (s.startup.valuation || 0) * 0.05 : 0)); add(s, "cash", Math.min(cash, 3000000)); add(s, "mood", 6); add(s, "insight", 2); return `你套出一笔现金落袋为安，给自己也给团队留了条后路。风口上的人都嫌你保守——可你见过太多飞得最高的，摔得最惨。`; } },
      { label: "拿这股势头去融一轮大的", effect: (s) => { const p = 0.42 + statEdge(s, "charm") * 0.4 + statEdge(s, "strategy") * 0.3 + luckBias(s); if (rnd(p)) { flag(s, "su_series_a"); flag(s, "su_funded"); if (s.startup) s.startup.valuation = Math.round((s.startup.valuation || 0) * 1.5); add(s, "network", 6); add(s, "mood", 8); return "你拿着风口的故事见了一圈投资人，TS 雪片般飞来。一轮融资落定，账上厚了，腰杆也硬了。"; } add(s, "stress", 8); add(s, "mood", -5); return "你讲了一圈，投资人频频点头，却迟迟不掏钱。风口虽好，可他们见过的「下一个风口」太多了。"; } }
    ]
  },

  /* ② 泡沫警钟：你手里有「泡沫」赛道，外面正吹得震天响 */
  {
    id: "ev_track_bubble", module: "startup", ambient: true,
    cond: (s) => s.startup && !has(s, "startup_done") && _suTracks(s).some(n => { const t = _trk(n); return t && t.kind === "bubble"; }),
    title: "🫧 风口正盛，可你心里有点发虚",
    text: (s) => { const n = _suTracks(s).find(x => { const t = _trk(x); return t && t.kind === "bubble"; }); const t = _trk(n); return `「${n}」正是眼下最烫手的风口，资本疯抢、同行疯涌、媒体疯吹。${t && t.bust ? "可夜深人静时，你隐隐闻到一丝不对的味道——" + t.bust : "可你隐隐觉得，这热度有点不真实。"}\n\n是趁泡沫还在继续追高，还是趁早抽身？` ; },
    dynamicChoices: (s) => [
      { label: "all in 追高，富贵险中求", effect: (s) => { if (s.startup) { s.startup.progress += 6; s.startup.valuation = Math.round((s.startup.valuation || 0) * 1.4); } add(s, "stress", 12); flag(s, "risk_hustle"); bumpMomentum(s, 5); return "你把怀疑摁了下去，跟着热钱一起往里冲。泡沫里的钱，看着是真金白银——只要你不是最后一个接棒的。"; } },
      { label: "趁热度还在，赶紧套现离场", effect: (s) => { const cash = Math.round(150000 + (s.startup ? (s.startup.valuation || 0) * 0.06 : 0)); add(s, "cash", Math.min(cash, 2500000)); flag(s, "cashed_out"); if (s.startup) { flag(s, "startup_done"); } add(s, "insight", 4); add(s, "mood", 4); return `你在掌声最响的时候转身离场，把股份高位接给了下一个信徒。事后回看——你躲过了一地鸡毛。`; } },
      { label: "转型：把团队拉去做更扎实的方向", effect: (s) => { if (s.startup) { s.startup.valuation = Math.round((s.startup.valuation || 0) * 0.6); s.startup.progress = Math.max(5, (s.startup.progress || 0) * 0.7); s.startup.tracks = [s.eraWind]; s.startup.track = s.eraWind; } add(s, "strategy", 4); add(s, "stress", 8); return `你顶着团队的不解，把船头扭向了更靠谱的方向。估值腰斩、进度回退，但你赌的是「活得久」，而不是「飞得高一阵子」。`; } }
    ]
  },

  /* ③ 赛道转型：一个都没押中风口，要不要 pivot */
  {
    id: "ev_track_pivot2", module: "startup", ambient: true,
    cond: (s) => s.startup && !has(s, "startup_done") && _suTracks(s).indexOf(s.eraWind) < 0 && (s.age - (s.startup.foundedAge || s.age)) >= 2 && (s.startup.valuation || 0) < 800000,
    title: "🧭 你押的方向，好像不是那阵风",
    text: (s) => `做了两年，公司不温不火。你刷着新闻才慢慢回过味来——真正的风口，吹的是「${s.eraWind}」，而你押的「${_suTracks(s).join("、")}」，市场始终没真正认。横在你面前的，是转型还是死磕？`,
    choices: [
      { label: `掉头转型，追上「${"风口"}」（估值回退但有奔头）`, effect: (s) => { if (s.startup) { s.startup.tracks = [s.eraWind]; s.startup.track = s.eraWind; s.startup.valuation = Math.round((s.startup.valuation || 0) * 0.7); s.startup.progress = Math.max(5, (s.startup.progress || 0) * 0.75); } add(s, "strategy", 3); add(s, "stress", 9); add(s, "insight", 2); return `你忍痛把项目推倒重来，扭向真正的风口。沉没成本咽进肚子里——船难掉头，可错的方向上，跑得越久亏得越多。`; } },
      { label: "死磕原赛道，相信自己的判断", effect: (s) => { add(s, "stress", 6); add(s, "mind", 1); if (rnd(0.18 + statEdge(s, "insight") * 0.3)) { flag(s, "su_revenue"); add(s, "mood", 5); return "你不信邪，继续打磨。冷门赛道里，你竟也熬出了一小撮死忠用户和正向现金流——小而美，未必输给追风的人。"; } return "你选择相信自己。可市场不讲情面，再热的心也焐不热一个没风的赛道。日子，依旧一天天紧巴着过。"; } },
      { label: "认赔，把公司关了止损", effect: (s) => { const back = Math.round((s.startup ? (s.startup.valuation || 0) : 0) * 0.04); add(s, "cash", Math.min(back, 200000)); if (s.startup) { s.startup = null; delete s.flags.startup; delete s.flags.chase_ipo; flag(s, "startup_failed"); } add(s, "mood", -8); add(s, "insight", 5); add(s, "health", 3); return "你体面地关掉了公司，遣散了团队，把剩下的边角料变卖。承认失败那一刻很痛，但及时止损，本身就是一种本事。"; } }
    ]
  }
);
