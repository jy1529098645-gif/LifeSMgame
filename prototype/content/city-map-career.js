"use strict";
/* =====================================================================
 * content/city-map-career.js —— 城市俯瞰图主界面（00后职场沉浮·城市玩法方案 §3-§5）
 * 把「一排抽象按钮」改成「在成都这座城市里点区域 → 进区域做事」。
 * 区域是行动入口：求职去人才市场、上班去写字楼、压力大去公园、没钱去便利店。
 * 行动复用现有 action-resolver 的卡 + 少量区域专属 micro 行动（吃饭/体检/回家）。
 *
 * 暴露：CITY_DISTRICTS, districtById, districtActions(s,id), districtForStage(s),
 *       recommendedDistrict(s), districtForScene(s)
 * ===================================================================== */

// 成都·区域表（x/y 为俯瞰图百分比坐标）。actions = 该区域可做的行动 id（复用 C.actions）。
const CITY_DISTRICTS = [
  { id: "campus",       name: "学校/宿舍", icon: "🎓", x: 16, y: 70, desc: "宿舍、自习室、社团海报，和快毕业的焦虑。", actions: ["study", "prep_interview", "ask_senior", "parttime", "rest", "browse"] },
  { id: "talent_market",name: "招聘会/人才市场", icon: "📨", x: 40, y: 58, desc: "展板、二维码、排队投简历的人，和看不见尽头的竞争。", actions: ["jobhunt", "prep_interview", "ask_senior"] },
  { id: "office_cbd",   name: "写字楼区", icon: "🏢", x: 60, y: 40, desc: "玻璃幕墙很亮，工牌挂在胸前的人走得很快。", actions: ["work", "overtime_perf", "coworker_lunch", "collect_evidence", "learn_industry"] },
  { id: "tech_park",    name: "产业园/外包园区", icon: "💻", x: 76, y: 50, desc: "工位、外包项目、甲方需求和凌晨上线。", actions: ["work", "learn_industry", "side_project", "validate_need"] },
  { id: "rental",       name: "出租屋/城中村", icon: "🏚️", x: 28, y: 80, desc: "押一付三、隔音很差、楼下永远在装修。", actions: ["rest", "move_near_office", "side_project", "cook_home"] },
  { id: "metro",        name: "地铁/通勤", icon: "🚇", x: 50, y: 72, desc: "早高峰、迟到风险、被挤成纸片的人。", actions: ["move_near_office", "browse", "rest"] },
  { id: "mall",         name: "商圈/便利店", icon: "🛒", x: 64, y: 66, desc: "吃饭、买衣服、便利店饭团，和工资到账后的短暂错觉。", actions: ["cheap_meal", "treat_self", "buy_outfit", "socialize"] },
  { id: "park",         name: "公园/棋牌角", icon: "♟️", x: 20, y: 44, desc: "石桌上的残局，嘴毒的大爷，和看不出底细的人。", actions: ["leisure", "exercise", "talk_to_mentor"] },
  { id: "clinic",       name: "医院/社区诊所", icon: "🏥", x: 80, y: 32, desc: "排队、挂号、体检报告，和舍不得花的钱。", actions: ["health_check", "rest"] },
  { id: "phone",        name: "手机/网络", icon: "📱", x: 86, y: 72, desc: "招聘软件、朋友圈、小红书、反诈提醒和焦虑信息流。", actions: ["browse", "jobhunt", "invest", "reply_family"] },
  { id: "home",         name: "家/和父母通话", icon: "🏠", x: 14, y: 30, desc: "饭桌上的唠叨、催促与底气，电话那头渐白的头发。", actions: ["reply_family", "rest", "browse"] },
  { id: "arbitration",  name: "劳动仲裁窗口", icon: "⚖️", x: 70, y: 20, desc: "攥着证据的人、冷脸 HR 和写满条款的桌子。", actions: ["collect_evidence"] }
];
function districtById(id) { return CITY_DISTRICTS.find(d => d.id === id) || null; }

function _legalAct(s, a) { if (!a) return false; if (a.require) { try { return !!a.require(s); } catch (e) { return false; } } return true; }
function _actById(id) { return (typeof actions !== "undefined") ? actions.find(a => a.id === id) : null; }

// 某区域当前可做的行动（区域 actions ∩ 合法/处境）
function districtActions(s, distId) {
  const d = districtById(distId); if (!d) return [];
  const out = [];
  for (const id of d.actions) { const a = _actById(id); if (a && _legalAct(s, a)) out.push(a); }
  return out;
}

// 当前主线阶段 → 推荐去的区域（主线引导）
function recommendedDistrict(s) {
  const stg = (typeof mainStageId === "function") ? mainStageId(s) : null;
  if (stg === "college_junior") return "campus";
  if (stg === "job_search") return "talent_market";
  if (stg === "first_job" || stg === "work_grind" || stg === "opportunity_build" || stg === "resign_or_stay") {
    if (s.job && (s.job.industry === "互联网")) return "tech_park";
    return "office_cbd";
  }
  return "phone";
}
// 当前场景 → 默认落脚区域
function districtForScene(s) {
  const cs = (typeof currentScene === "function") ? currentScene(s) : { type: "life" };
  if (cs.type === "work") return (s.job && s.job.industry === "互联网") ? "tech_park" : "office_cbd";
  if (cs.type === "study") return "campus";
  if (cs.type === "family") return "home";
  return null;
}
// 进入界面时默认选中的区域：上次选的 → 场景默认 → 主线推荐
function districtForStage(s) {
  if (s._cityDistrict && districtById(s._cityDistrict)) return s._cityDistrict;
  return districtForScene(s) || recommendedDistrict(s);
}

/* ===== 区域专属 micro 行动（城市生活：吃饭/体检/置装/回家/做饭）。多为日常消费，slotCost 多为 0。 ===== */
function _cpi(s) { return (s.world && s.world.priceIndex) || 1; }
function _cityCostMul(s) { return s.city ? (s.city.cost || 1) : 1; }
if (typeof actions !== "undefined") {
  actions.push(
    { id: "cheap_meal", name: "便利店随便吃点", emoji: "🍙", hours: 1, slotCost: 0, anyStage: true,
      desc: "饭团、关东煮、打折便当。不是不想吃好，是余额不同意。", preview: "💸约¥15-25　🙂压力-1（省钱但将就）",
      resolve: s => { const c = Math.round((15 + Math.random() * 10) * _cpi(s) * _cityCostMul(s)); add(s, "cash", -c); add(s, "stress", -1); return `你在便利店解决了一餐，花了 ¥${c}。微波炉「叮」的一声，是这一天为数不多的、确定的小确幸。`; } },
    { id: "treat_self", name: "犒劳自己搓一顿", emoji: "🍲", hours: 3, slotCost: 0, anyStage: true,
      desc: "发了工资/熬过难关，约上三两好友或独自下个馆子，对自己好一点。", preview: "💸约¥80-200　🙂心情+　😣压力-",
      resolve: s => { const c = Math.round((80 + Math.random() * 120) * _cpi(s) * _cityCostMul(s)); add(s, "cash", -c); add(s, "mood", 5); add(s, "stress", -5); add(s, "health", 1); return `你难得地对自己大方了一回，花 ¥${c} 搓了一顿好的。热气腾腾的食物下肚，连日的疲惫好像也消解了一些。日子再难，也得让自己尝点甜。`; } },
    { id: "buy_outfit", name: "置办身行头", emoji: "👔", hours: 3, slotCost: 0, anyStage: true,
      desc: "面试要穿得体、上班不能太寒酸——一身像样的行头，是成年人的入场券。", preview: "💸约¥150-500　🤝面试/职场形象↑",
      resolve: s => { const c = Math.round((150 + Math.random() * 350) * _cpi(s) * _cityCostMul(s)); add(s, "cash", -c); add(s, "charm", 0.6); flag(s, "decent_outfit"); return `你咬牙添了身像样的衣服，花了 ¥${c}。镜子里的人精神了不少。「人靠衣装」，在这座以貌取人的城市里，体面也是一种成本。`; } },
    { id: "cook_home", name: "自己做饭", emoji: "🍳", hours: 4, slotCost: 0, anyStage: true,
      desc: "买菜、洗切、下厨。省钱又养胃，就是下班后实在没力气。", preview: "💸约¥25-45/天　❤️健康+　💰比外卖省",
      resolve: s => { const c = Math.round((25 + Math.random() * 20) * _cpi(s) * _cityCostMul(s)); add(s, "cash", -c); add(s, "health", 2); add(s, "mood", 1); return `你给自己做了顿饭，花了 ¥${c} 的菜钱。比点外卖省，也比外卖暖。灶台前的烟火气，让这间冷清的出租屋，难得有了点「家」的样子。`; } },
    { id: "health_check", name: "去医院检查", emoji: "🩺", hours: 6, slotCost: 1, anyStage: true,
      desc: "身体总报警，去做个检查求个安心——尽管挂号排队和那串数字都让人肉疼。", preview: "💸约¥300-800　❤️排查暗伤/慢病，早发现早安心",
      resolve: s => { const c = Math.round((300 + Math.random() * 500) * _cpi(s) * _cityCostMul(s)); add(s, "cash", -c); if (typeof notifyCost === "function") notifyCost(s, c, "做了全套检查"); if (s.health < 55 || (s._overtimeStreak || 0) >= 3) { if (s.healthChain && s.healthChain.stage === 1) s.healthChain.stage = 2; add(s, "health", 3); add(s, "mood", 2); if (typeof rememberFact === "function") rememberFact(s, { type: "health_scar", text: "去医院做了检查，查出长期熬夜留下的小毛病。", tags: ["health"], intensity: 2 }); return `检查花了 ¥${c}。报告出来，医生皱着眉指了指几项指标：「亚健康，再这么熬要出事。」幸好来得及——身体这台机器，得趁早保养。`; } add(s, "mood", 3); return `检查花了 ¥${c}。万幸，大问题没有，医生只叮嘱注意作息。钱花得肉疼，但买个安心，值。`; } },
    { id: "reply_family", name: "和父母通个电话", emoji: "📞", hours: 2, slotCost: 0, anyStage: true,
      desc: "报个平安、听几句唠叨与催促。家是软肋，也是铠甲。", preview: "🙂心情±　家庭压力变化（看你怎么聊）",
      resolve: s => { if (rnd(0.5)) { add(s, "mood", 4); add(s, "stress", -3); if (typeof bumpThread === "function") bumpThread(s, "family_pressure", -4); return "电话那头絮絮叨叨地问你吃没吃好、钱够不够。你嘴上嫌烦，挂了却鼻子一酸。无论在外面多狼狈，这头永远有人惦记你。"; } add(s, "stress", 3); if (typeof bumpThread === "function") bumpThread(s, "family_pressure", 6, { status: "open" }); return "电话又绕到了「工作找好没」「隔壁谁谁上岸了」「该考虑稳定了」。你和爸妈各说各的，谁也说服不了谁。爱和压力，本就是一枚硬币的两面。"; } }
  );
}

/* ===== 前端：成都俯瞰图 SVG 背景（环路 + 锦江 + 楼群 + 绿地）。viewBox 0 0 100 100，
 *       preserveAspectRatio=none 拉伸铺满，坐标与区域按钮的 x%/y% 对齐。 ===== */
function cityMapSVG(s) {
  // 楼群：在写字楼/产业园/商圈一带铺密一点，城中村矮一点
  const bld = [];
  const cluster = (cx, cy, n, maxH, hue) => {
    for (let i = 0; i < n; i++) {
      const a = (i * 2.39996) % (Math.PI * 2);           // 黄金角散布（确定性，无随机）
      const r = 3 + (i % 4) * 1.7;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.6;
      const w = 1.6 + (i % 3) * 0.7, h = 2 + ((i * 7) % maxH);
      bld.push(`<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="0.3" fill="${hue}" opacity="${(0.5 + (i % 3) * 0.16).toFixed(2)}"/>`);
    }
  };
  cluster(60, 42, 16, 11, "#3a4a6e");   // 写字楼 CBD：高楼
  cluster(76, 50, 13, 9, "#34506b");    // 产业园
  cluster(64, 66, 10, 5, "#3d3f56");    // 商圈
  cluster(16, 70, 9, 4, "#3a3a48");     // 学校
  cluster(28, 80, 11, 3, "#34343f");    // 城中村：矮密
  cluster(14, 30, 6, 4, "#3a3a48");     // 家
  const buildings = bld.join("");
  // 主线推荐区域：在其脚下打一束高亮光圈
  const rec = recommendedDistrict(s); const rd = districtById(rec);
  const recGlow = rd ? `<circle cx="${rd.x}" cy="${rd.y}" r="11" fill="url(#cmGlow)"/>` : "";
  return `<svg class="cm-svg" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="cmGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#f0a73c" stop-opacity="0.5"/><stop offset="100%" stop-color="#f0a73c" stop-opacity="0"/></radialGradient>
      <linearGradient id="cmRiver" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2a5a8a"/><stop offset="100%" stop-color="#1e4368"/></linearGradient>
    </defs>
    <rect width="100" height="100" fill="#11131c"/>
    <!-- 成都环路：二环 / 三环 -->
    <rect x="9" y="9" width="82" height="82" rx="40" fill="none" stroke="#2c3550" stroke-width="1.6"/>
    <rect x="24" y="24" width="52" height="52" rx="26" fill="none" stroke="#2c3550" stroke-width="1.3"/>
    <!-- 放射主干道 -->
    <g stroke="#222a40" stroke-width="0.8"><line x1="50" y1="2" x2="50" y2="98"/><line x1="2" y1="50" x2="98" y2="50"/><line x1="16" y1="16" x2="84" y2="84"/><line x1="84" y1="16" x2="16" y2="84"/></g>
    <!-- 锦江 -->
    <path d="M -4 26 C 26 38, 34 58, 58 62 S 96 86, 108 78" fill="none" stroke="url(#cmRiver)" stroke-width="3.4" stroke-linecap="round" opacity="0.85"/>
    <!-- 公园绿地 -->
    <ellipse cx="20" cy="45" rx="9" ry="6" fill="#2c4a32" opacity="0.7"/>
    <circle cx="18" cy="44" r="1.4" fill="#3a6b46"/><circle cx="23" cy="46" r="1.6" fill="#3a6b46"/><circle cx="21" cy="42" r="1.2" fill="#3a6b46"/>
    ${recGlow}
    ${buildings}
  </svg>`;
}

// 区域状态信号：hot=有正在进行的故事/人物，afford=该区域的花钱行动是否还掏得起
function districtSignal(s, distId) {
  const visited = !!(s._cityVisited && s._cityVisited[distId]);
  let hot = false;
  if (distId === "arbitration") hot = !!(s.workChains && s.workChains.arb > 0 && s.workChains.arb < 9);
  else if (distId === "clinic") hot = !!(s.healthChain && s.healthChain.stage > 0) || (s.health || 100) < 45;
  else if (distId === "phone") hot = !!(s.fraud && s.fraud.stage > 0 && s.fraud.stage < 9) || ((s.cash || 0) < 8000 && !s.job);
  else if (distId === "park") hot = !!(s.people && (s.people.chess_exec || s.people.chess_fallen));
  else if (distId === "metro" || distId === "rental") hot = !!(s.commute && s.commute.far);
  else if (distId === "office_cbd" || distId === "tech_park") hot = !!(s.workChains && (s.workChains.blame || s.workChains.credit || s.workChains.sever));
  else if (distId === "home") hot = (typeof threadLevel === "function" && threadLevel(s, "family_pressure") >= 30);
  const broke = (s.cash || 0) < 100;   // 连便利店都吃不起
  return { visited, hot, broke };
}

if (typeof window !== "undefined") window.CITY_DISTRICTS = CITY_DISTRICTS;
