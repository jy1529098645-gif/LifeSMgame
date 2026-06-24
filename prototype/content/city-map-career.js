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

// 成都·区域表：总览只显示可点击地名标签；点击后放大到同一角度的区域图，再显示真实设施点。
// x/y 是地名标签位置；facilities 是区域放大图上的可点击设施。
const CITY_DISTRICTS = [
  { id: "campus", name: "川大望江校区", icon: "🎓", x: 18, y: 24, w: 27, h: 22, shape: "8% 24%, 18% 10%, 36% 14%, 43% 31%, 33% 46%, 14% 43%", zoomX: 18, zoomY: 24, desc: "公共教学楼、图书馆、学生食堂和毕业前的焦虑。", actions: ["campus_lecture", "campus_cram", "campus_intern", "campus_club", "campus_rest"], facilities: [
    { name: "公共教学楼", icon: "🏫", x: 24, y: 23, action: "campus_lecture" },
    { name: "图书馆", icon: "📖", x: 38, y: 34, action: "campus_cram" },
    { name: "就业指导中心", icon: "📣", x: 58, y: 42, action: "campus_intern" },
    { name: "学生食堂", icon: "🍚", x: 34, y: 64, action: "campus_club" },
    { name: "学生宿舍区", icon: "🛏️", x: 70, y: 72, action: "campus_rest" }
  ] },
  { id: "talent_market", name: "公共就业服务中心", icon: "📨", x: 50, y: 82, w: 25, h: 17, shape: "39% 76%, 54% 72%, 68% 80%, 64% 94%, 45% 95%, 36% 87%", zoomX: 50, zoomY: 84, desc: "服务大厅、招聘专区、打印店和面试等候区，求职者在这里排队碰运气。", actions: ["jobhunt", "prep_interview", "print_resume", "browse"], facilities: [
    { name: "就业服务大厅", icon: "📨", x: 34, y: 33, action: "jobhunt" },
    { name: "图文打印店", icon: "🖨️", x: 62, y: 30, action: "print_resume" },
    { name: "招聘面试等候区", icon: "🪑", x: 48, y: 54, action: "prep_interview" },
    { name: "楼下咖啡店", icon: "☕", x: 31, y: 72, action: "cheap_meal" },
    { name: "地铁站入口", icon: "🚇", x: 72, y: 76, action: "city_back" }
  ] },
  { id: "office_cbd", name: "高新区商务楼宇", icon: "🏢", x: 50, y: 43, w: 31, h: 28, shape: "38% 30%, 57% 26%, 70% 39%, 66% 60%, 49% 67%, 34% 55%, 31% 40%", zoomX: 51, zoomY: 44, desc: "玻璃幕墙、工牌、前台闸机和开不完的会。", actions: ["work", "overtime_perf", "coworker_lunch", "collect_evidence", "move_near_office"], facilities: [
    { name: "写字楼大堂", icon: "🏢", x: 31, y: 30, action: "work" },
    { name: "开放办公区", icon: "💻", x: 55, y: 34, action: "work" },
    { name: "公司会议室", icon: "📊", x: 67, y: 54, action: "overtime_perf" },
    { name: "楼下咖啡馆", icon: "☕", x: 40, y: 70, action: "coworker_lunch" },
    { name: "地铁站入口", icon: "🚇", x: 74, y: 77, action: "city_back" }
  ] },
  { id: "tech_park", name: "天府软件园", icon: "💻", x: 82, y: 20, w: 25, h: 24, shape: "70% 10%, 87% 8%, 96% 22%, 91% 39%, 74% 42%, 66% 28%", zoomX: 83, zoomY: 20, desc: "研发楼、项目会议室、园区食堂和创业孵化空间。", actions: ["work", "side_project", "validate_need", "learn_industry", "cheap_meal"], facilities: [
    { name: "软件研发楼", icon: "🏭", x: 34, y: 30, action: "work" },
    { name: "项目会议室", icon: "📋", x: 61, y: 36, action: "learn_industry" },
    { name: "创业孵化空间", icon: "☕", x: 47, y: 59, action: "validate_need" },
    { name: "园区食堂", icon: "🍱", x: 25, y: 70, action: "cheap_meal" },
    { name: "园区地铁站口", icon: "🚇", x: 75, y: 76, action: "city_back" }
  ] },
  { id: "rental", name: "城南租住片区", icon: "🏚️", x: 74, y: 57, w: 25, h: 22, shape: "65% 49%, 82% 46%, 94% 58%, 88% 74%, 70% 76%, 61% 63%", zoomX: 73, zoomY: 58, desc: "合租房、中介门店、农贸市场和楼上永远不停的装修。", actions: ["rest", "move_near_office", "cook_home", "side_project", "browse"], facilities: [
    { name: "合租公寓", icon: "🛏️", x: 33, y: 32, action: "rest" },
    { name: "房产中介门店", icon: "🔑", x: 58, y: 33, action: "move_near_office" },
    { name: "社区农贸市场", icon: "🥬", x: 33, y: 61, action: "cook_home" },
    { name: "社区便利店", icon: "🏪", x: 60, y: 62, action: "cheap_meal" },
    { name: "地铁站入口", icon: "🚇", x: 77, y: 77, action: "city_back" }
  ] },
  { id: "mall", name: "春熙路商圈", icon: "🛒", x: 20, y: 77, w: 25, h: 21, shape: "8% 68%, 25% 64%, 38% 75%, 34% 91%, 15% 94%, 5% 82%", zoomX: 20, zoomY: 77, desc: "购物中心、餐饮街区、影院和地铁口，体面生活在这里明码标价。", actions: ["cheap_meal", "treat_self", "buy_outfit", "socialize", "browse"], facilities: [
    { name: "购物中心", icon: "🛍️", x: 35, y: 31, action: "buy_outfit" },
    { name: "餐饮街区", icon: "🍲", x: 58, y: 38, action: "treat_self" },
    { name: "24小时便利店", icon: "🏪", x: 29, y: 62, action: "cheap_meal" },
    { name: "影院娱乐区", icon: "🎬", x: 61, y: 64, action: "socialize" },
    { name: "地铁站入口", icon: "🚇", x: 76, y: 78, action: "city_back" }
  ] },
  { id: "park", name: "人民公园", icon: "♟️", x: 18, y: 49, w: 25, h: 24, shape: "8% 39%, 24% 34%, 38% 44%, 35% 61%, 18% 66%, 5% 54%", zoomX: 18, zoomY: 49, desc: "公园茶馆、棋牌角、湖边步道。这里能回血，也能遇见奇怪的人。", actions: ["leisure", "exercise", "talk_to_mentor", "browse"], facilities: [
    { name: "公园茶馆", icon: "🍵", x: 32, y: 30, action: "leisure" },
    { name: "棋牌活动角", icon: "♟️", x: 58, y: 38, action: "leisure" },
    { name: "湖边步道", icon: "🌿", x: 36, y: 62, action: "exercise" },
    { name: "健身器材区", icon: "🏃", x: 63, y: 65, action: "exercise" },
    { name: "地铁站入口", icon: "🚇", x: 78, y: 78, action: "city_back" }
  ] },
  { id: "clinic", name: "华西医院片区", icon: "🏥", x: 79, y: 80, w: 25, h: 18, shape: "68% 72%, 84% 70%, 96% 80%, 91% 94%, 72% 96%, 63% 85%", zoomX: 79, zoomY: 80, desc: "门诊大厅、体检中心、门诊药房和急诊入口。身体的问题会在这里变成账单。", actions: ["health_check", "rest", "browse"], facilities: [
    { name: "门诊大厅", icon: "🏥", x: 34, y: 32, action: "health_check" },
    { name: "体检中心", icon: "🩺", x: 61, y: 35, action: "health_check" },
    { name: "门诊药房", icon: "💊", x: 34, y: 64, action: "rest" },
    { name: "急诊入口", icon: "🚑", x: 61, y: 65, action: "health_check" },
    { name: "地铁站入口", icon: "🚇", x: 78, y: 79, action: "city_back" }
  ] },
  { id: "arbitration", name: "劳动人事争议仲裁院", icon: "⚖️", x: 61, y: 28, w: 21, h: 17, shape: "52% 20%, 66% 18%, 76% 29%, 71% 41%, 55% 43%, 47% 31%", zoomX: 61, zoomY: 29, desc: "立案受理窗口、调解室、法律援助咨询台。不是爽文反击，是一场漫长拉扯。", actions: ["collect_evidence", "browse"], facilities: [
    { name: "立案受理窗口", icon: "⚖️", x: 34, y: 33, action: "collect_evidence" },
    { name: "仲裁调解室", icon: "🪑", x: 62, y: 38, action: "collect_evidence" },
    { name: "图文打印店", icon: "🖨️", x: 35, y: 65, action: "print_resume" },
    { name: "法律援助咨询台", icon: "📄", x: 62, y: 66, action: "collect_evidence" },
    { name: "地铁站入口", icon: "🚇", x: 78, y: 79, action: "city_back" }
  ] }
];
function districtById(id) { return CITY_DISTRICTS.find(d => d.id === id) || null; }
function facilityById(d, fid) { return d && d.facilities ? d.facilities.find((f, i) => (f.id || ("f" + i)) === fid) : null; }
function facilityIndex(d, f) { return d && d.facilities ? Math.max(0, d.facilities.indexOf(f)) : 0; }

function _legalAct(s, a) { if (!a) return false; if (a.require) { try { return !!a.require(s); } catch (e) { return false; } } return true; }
function _actById(id) { return (typeof actions !== "undefined") ? actions.find(a => a.id === id) : null; }
const AI_REGION_ASSETS = new Set([
  "campus",
  "talent_market",
  "office_cbd",
  "tech_park",
  "rental",
  "mall",
  "park",
  "clinic",
  "arbitration"
]);
const AI_FACILITY_ASSETS = new Set([
  "campus:f0",
  "campus:f1",
  "campus:f2",
  "campus:f3",
  "campus:f4",
  "talent_market:f0",
  "talent_market:f1",
  "talent_market:f2",
  "talent_market:f3",
  "talent_market:f4",
  "office_cbd:f0",
  "office_cbd:f1",
  "office_cbd:f2",
  "office_cbd:f3",
  "office_cbd:f4",
  "tech_park:f0",
  "tech_park:f1",
  "tech_park:f2",
  "tech_park:f3",
  "tech_park:f4",
  "rental:f0",
  "rental:f1",
  "rental:f2",
  "rental:f3",
  "rental:f4",
  "mall:f0",
  "mall:f1",
  "mall:f2",
  "mall:f3",
  "mall:f4",
  "park:f0",
  "park:f1",
  "park:f2",
  "park:f3",
  "park:f4",
  "clinic:f0",
  "clinic:f1",
  "clinic:f2",
  "clinic:f3",
  "clinic:f4",
  "arbitration:f0",
  "arbitration:f1",
  "arbitration:f2",
  "arbitration:f3",
  "arbitration:f4"
]);

function cityAsset(name, ext) { return "assets/img/city/" + name + "." + ext; }
function regionAsset(d) {
  return cityAsset("region-" + d.id, AI_REGION_ASSETS.has(d.id) ? "png" : "svg");
}
function facilityAsset(d, f) {
  const i = facilityIndex(d, f);
  return cityAsset("facility-" + d.id + "-f" + i, AI_FACILITY_ASSETS.has(d.id + ":f" + i) ? "png" : "svg");
}
function facilityDefaultText(s, d, f, a, ok) {
  const n = f.name || "这里";
  if (f.action === "city_back") return `你走到${n}口，扶梯下方的人流一阵一阵涌出来。站牌、闸机、外卖骑手和赶时间的上班族挤在一起。你看了眼路线，决定先回到城市总览。`;
  if ((d.id === "clinic" || n.indexOf("医院") >= 0 || n.indexOf("门诊") >= 0 || n.indexOf("体检") >= 0) && (s.health || 100) >= 78 && (s.stress || 0) < 50 && !(s.healthChain && s.healthChain.stage > 0)) {
    return `${n}里人群熙熙攘攘，挂号屏一排排滚动。你现在身体还算健康，没必要凑这个热闹。路过时一股强烈的消毒水味儿冲过来，你下意识加快脚步离开。`;
  }
  if (!ok || !a) return `你进了${n}。这里确实有人来人往，但现在没有什么与你直接相关的事。你看了一圈，记下这个地方，等真正有需要时再来。`;
  return `你进入${n}。场景里的声音、气味和人流一下子具体起来：这里不是抽象菜单，而是这座城市真实运转的一小块。你可以在这里选择「${a.name}」。`;
}

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
  return "talent_market";
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
  const _addCityAction = (a) => { if (!actions.find(x => x.id === a.id)) actions.push(a); };
  const _campus = (s) => s && s.campus && s.campus.active !== false ? s.campus : null;
  const _markCampus = (s, id) => { const cp = _campus(s); if (!cp) return null; cp._weekActs = cp._weekActs || {}; cp._weekActs[id.replace("campus_", "")] = true; return cp; };
  _addCityAction({ id: "campus_lecture", name: "去教学楼上课", emoji: "🏫", hours: 12, slotCost: 1, anyStage: true, require: s => !!_campus(s),
    desc: "点名、课堂提问、小组作业。它不刺激，但能稳住毕业底线。", preview: "绩点+ 学分底线稳住 压力小增",
    resolve: s => { const cp = _markCampus(s, "campus_lecture"); if (!cp) return { log: "教学楼今天和你没什么关系。" }; cp.gpa = Math.min(100, cp.gpa + 4); cp.readiness = Math.min(100, cp.readiness + 1); add(s, "knowledge", 0.7); add(s, "stress", 2); return { log: "你在教学楼坐满了几节课。老师讲到行业案例时顺口提了一句真实公司的坑，你记了下来。大三的课不总有用，但今天至少没白来。" }; } });
  _addCityAction({ id: "campus_cram", name: "泡自习室赶进度", emoji: "📖", hours: 14, slotCost: 1, anyStage: true, require: s => !!_campus(s),
    desc: "刷题、改作品集、补专业短板。有效，也很折磨。", preview: "绩点++ 求职准备+ 健康- 压力+",
    resolve: s => { const cp = _markCampus(s, "campus_cram"); if (!cp) return { log: "自习室里人很多，但你还没进入校园期。" }; cp.gpa = Math.min(100, cp.gpa + 6); cp.readiness = Math.min(100, cp.readiness + 4); add(s, "knowledge", 1.2); add(s, "health", -1); add(s, "stress", 4); return { log: "你在自习室坐到闭馆，电脑风扇和键盘声混成一片。绩点和作品集都往前挪了一截，腰也像被椅子重新塑形。" }; } });
  _addCityAction({ id: "campus_intern", name: "跑校招/投实习", emoji: "📣", hours: 12, slotCost: 1, anyStage: true, require: s => !!_campus(s),
    desc: "宣讲会、实习群、内推二维码。最早的职场压力，从这里开始。", preview: "求职准备++ 可能拿到实习/内推",
    resolve: s => { const cp = _markCampus(s, "campus_intern"); if (!cp) return { log: "校招宣讲厅还没到开放的时候。" }; cp.readiness = Math.min(100, cp.readiness + 9); cp.internship = (cp.internship || 0) + 1; flag(s, "campus_intern_tried"); if (typeof recordBeat === "function") recordBeat(s, "first_intern"); if (Math.random() < 0.28) { flag(s, "got_referral"); add(s, "network", 2); return { log: "你挤进校招宣讲厅，扫码、投递、听 HR 把「成长空间」说成了谜语。散场时一个学长愿意帮你内推，至少这趟没白挤。" }; } add(s, "stress", 3); return { log: "你听完一场宣讲，投了几份实习。PPT 上写着年轻人无限可能，岗位要求却写着熟练掌握一切。你把荒诞记在心里，继续投。" }; } });
  _addCityAction({ id: "campus_club", name: "食堂/社团局", emoji: "🍚", hours: 8, slotCost: 1, anyStage: true, require: s => !!_campus(s),
    desc: "和室友、同学、社团朋友吃饭聊天。关系不是面板，是一次次互动攒出来的。", preview: "校园人脉+ 心情+ 小额花费",
    resolve: s => { const cp = _markCampus(s, "campus_club"); if (!cp) return { log: "食堂照常热闹，但你现在不是这条线。" }; const c = Math.round(25 + Math.random() * 35); add(s, "cash", -c); add(s, "mood", 4); add(s, "network", 1); cp.social = Math.min(100, cp.social + 7); if (typeof recordBeat === "function" && cp.social >= 30) recordBeat(s, "first_network"); return { log: `你在食堂花 ¥${c} 吃了顿饭，听同学吐槽实习、考研和家里催促。有人随口提到一个内推群，你加了进去。关系网不是凭空显示出来的，是这样一点点蹭出来的。` }; } });
  _addCityAction({ id: "campus_rest", name: "回宿舍回血", emoji: "🛏️", hours: 8, slotCost: 1, anyStage: true, require: s => !!_campus(s),
    desc: "睡觉、打游戏、洗衣服、和室友闲聊。能回血，但躺太久会被毕业季追上。", preview: "健康+ 压力- 过度会拖慢准备",
    resolve: s => { const cp = _markCampus(s, "campus_rest"); if (!cp) return { log: "宿舍门禁刷不开，你已经离开校园生活了。" }; add(s, "health", 4); add(s, "stress", -6); add(s, "mood", 3); cp.burnout = Math.max(0, (cp.burnout || 0) - 1); return { log: "你回宿舍补了一觉，醒来时天已经暗了。室友在打游戏，楼道里有人背面试自我介绍。休息让你缓过来，但毕业季不会因此暂停。" }; } });
  _addCityAction({ id: "prep_interview", name: "准备面试", emoji: "🪞", hours: 6, slotCost: 1, anyStage: true,
    desc: "改简历、背项目、练自我介绍。不是变强很多，但至少不至于一开口就露怯。", preview: "🧠学识+　✨形象+　😣压力+",
    resolve: s => { add(s, "knowledge", 1); add(s, "charm", 0.8); add(s, "stress", 2); flag(s, "interview_prepped"); if (typeof rememberFact === "function" && rnd(0.25)) rememberFact(s, { type: "jobhunt", text: "认真准备过一次面试，终于能把自己的经历讲顺。", tags: ["jobhunt"], intensity: 1 }); return { log: "你对着镜子把自我介绍练到舌头打结，又把简历里每个项目都编成能讲三分钟的故事。成年人的体面，有时候就是提前把慌张藏好。" }; } });
  _addCityAction({ id: "print_resume", name: "打印/润色简历", emoji: "🖨️", hours: 2, slotCost: 0, anyStage: true,
    desc: "打印几份简历，顺手让店员帮你调格式。纸很薄，承载的期待很重。", preview: "💸约¥20-60　求职成功率小幅提升",
    resolve: s => { const c = Math.round((20 + Math.random() * 40) * _cpi(s) * _cityCostMul(s)); add(s, "cash", -c); flag(s, "resume_polished"); add(s, "mood", 1); return { log: `你花 ¥${c} 打印并润色了简历。A4 纸从机器里吐出来时，你突然觉得自己像一件待上架的商品。` }; } });
  _addCityAction({ id: "coworker_lunch", name: "楼下和同事吃饭", emoji: "☕", hours: 3, slotCost: 0, anyStage: true, require: s => has(s, "employed"),
    desc: "午饭是办公室情报交换所：谁被骂了、谁要离职、哪个项目要爆雷。", preview: "💸约¥40-120　🤝同事关系+　可能得到内幕",
    resolve: s => { const c = Math.round((40 + Math.random() * 80) * _cpi(s) * _cityCostMul(s)); add(s, "cash", -c); add(s, "network", 1); add(s, "stress", -1); if (rnd(0.35)) { flag(s, "heard_office_rumor"); return { log: `你花 ¥${c} 和同事吃了顿饭。对方压低声音说：「最近别接那个项目，锅很大。」这顿饭突然变得值了。` }; } return { log: `你花 ¥${c} 和同事在楼下随便吃了点。大家嘴上说随便聊聊，话题却总会拐回绩效、加班和谁又被老板点名。` }; } });
  _addCityAction({ id: "overtime_perf", name: "加班赶汇报", emoji: "📊", hours: 12, slotCost: 1, anyStage: true, require: s => has(s, "employed"),
    desc: "会议室灯亮到很晚。PPT 改了又改，结论越来越漂亮，人越来越空。", preview: "💼绩效+　❤️健康-　😣压力+",
    resolve: s => { s._overtimeStreak = (s._overtimeStreak || 0) + 1; add(s, "stress", 8); add(s, "health", -4); add(s, "reputation", 1); if (rnd(0.22)) flag(s, "boss_noticed"); return { log: `你在会议室把汇报改到凌晨。老板说「辛苦了」，然后又发来一版新要求。你的绩效也许涨了一点，黑眼圈肯定涨了很多。` }; } });
  _addCityAction({ id: "collect_evidence", name: "整理证据材料", emoji: "📄", hours: 6, slotCost: 1, anyStage: true, require: s => has(s, "employed") || (s.workChains && (s.workChains.sever || s.workChains.blame || s.workChains.arb)),
    desc: "聊天记录、打卡截图、工资流水。反击不是一句狠话，是一摞能站住脚的材料。", preview: "⚖️仲裁筹码+　😣压力+",
    resolve: s => { s.workChains = s.workChains || {}; s.workChains.evidence = Math.min(10, (s.workChains.evidence || 0) + 2); add(s, "stress", 2); add(s, "insight", 1); if (typeof rememberFact === "function") rememberFact(s, { id: "work_evidence", once: true, type: "work_event", text: "开始保存加班、沟通和绩效证据。", tags: ["work", "arbitration"], intensity: 2 }); return { log: "你把聊天记录、打卡截图和工资流水一点点归档。那一刻你明白，职场里最朴素的安全感，是证据链。" }; } });
  _addCityAction({ id: "move_near_office", name: "看离公司近的房", emoji: "🔑", hours: 6, slotCost: 1, anyStage: true,
    desc: "通勤太久会慢慢吞掉生活。近一点的房子更贵，也更像一场现实妥协。", preview: "可能降低通勤压力　💸搬家/押金成本高",
    resolve: s => { const cost = Math.round((1500 + Math.random() * 3500) * _cityCostMul(s)); add(s, "cash", -cost); s.commute = s.commute || {}; s.commute.far = false; s.commute.nearOffice = true; add(s, "stress", -5); add(s, "mood", -1); return { log: `你花了 ¥${cost} 定下一间离公司更近的小房子。房间小、租金贵，但每天少挤一小时地铁，像从生活里赎回一点自己。` }; } });
  _addCityAction({ id: "learn_industry", name: "听项目/行业消息", emoji: "📋", hours: 5, slotCost: 1, anyStage: true,
    desc: "在项目会议室和园区走廊里听风向。真正的机会，经常先以抱怨和需求的形式出现。", preview: "🧠洞察+　创业前置机会↑",
    resolve: s => { add(s, "insight", 2); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2); if (rnd(0.3)) flag(s, "got_lead"); return { log: "你听了一圈项目和甲方需求，发现大家骂得最狠的地方，往往也是市场还没人解决的地方。创业的火苗，先从别人的痛点里冒出来。" }; } });
  _addCityAction({ id: "validate_need", name: "约人聊需求", emoji: "☕", hours: 5, slotCost: 1, anyStage: true,
    desc: "在创业咖啡约潜在用户、同行或前同事，问最笨的问题：你到底愿不愿意付钱？", preview: "🚀验证需求　🤝人脉+　💸小额花费",
    resolve: s => { const c = Math.round((60 + Math.random() * 120) * _cpi(s) * _cityCostMul(s)); add(s, "cash", -c); add(s, "network", 1); add(s, "insight", 2); if (typeof addFounderPrep === "function") addFounderPrep(s, "validatedNeed", 2); if (rnd(0.25)) flag(s, "got_lead"); return { log: `你花 ¥${c} 请人喝咖啡聊需求。对方吐槽了一堆现有方案的坑，最后补了一句：「真有人能解决，我愿意付钱。」这句话比鸡血管用。` }; } });
  _addCityAction({ id: "side_project", name: "晚上做小项目", emoji: "🛠️", hours: 10, slotCost: 1, anyStage: true,
    desc: "下班后写 demo、做表格、试着接单。它可能是副业，也可能是第一次创业的种子。", preview: "💰小概率赚钱　🚀创业准备+　❤️健康-",
    resolve: s => { add(s, "health", -2); add(s, "stress", 3); if (typeof addFounderPrep === "function") addFounderPrep(s, "execution", 2); if (rnd(0.35)) { const earn = Math.round(600 + Math.random() * 2600); add(s, "cash", earn); return { log: `你熬夜做的小项目居然有人买单，收入 ¥${earn}。钱不多，但它证明了：你不只是打工机器。` }; } return { log: "你熬夜把小项目推进了一点。没有收入，没有掌声，只有凌晨两点的进度条和一杯冷掉的水。" }; } });
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
  const selected = s && s._cityDistrict ? districtById(s._cityDistrict) : null;
  if (selected) {
    const active = facilityById(selected, s._cityFacility);
    if (active) {
      const a = active.action === "city_back" ? null : _actById(active.action);
      const legal = active.action !== "city_back" && _legalAct(s, a);
      const healthyHospital = selected.id === "clinic" && (s.health || 100) >= 78 && (s.stress || 0) < 50 && !(s.healthChain && s.healthChain.stage > 0);
      const canAct = legal && !healthyHospital;
      const text = facilityDefaultText(s, selected, active, a, canAct);
      const bg = facilityAsset(selected, active);
      return `<div class="cm-facility-scene" style="background-image:linear-gradient(180deg,rgba(9,12,18,.22),rgba(9,12,18,.86)),url('${bg}')">
        <button class="btn tiny cm-back-region" id="cityRegionBack">← 返回${selected.name}</button>
        <div class="cfs-card"><div class="cfs-kicker">${selected.icon} ${selected.name}</div><h3>${active.icon || ""} ${active.name}</h3><p>${text}</p>
          <div class="cfs-actions">${canAct ? `<button class="btn primary cm-scene-action" data-id="${a.id}">${a.emoji} ${a.name}</button>` : ""}<button class="btn" id="cityOverview">返回城市图</button></div></div>
      </div>`;
    }
    const facs = (selected.facilities || []).map(f => {
      const fid = f.id || ("f" + (selected.facilities || []).indexOf(f));
      const a = f.action === "city_back" ? null : _actById(f.action);
      const ok = f.action === "city_back" || _legalAct(s, a);
      return `<button class="cm-facility${ok ? "" : " locked"}" data-fac="${fid}" style="left:${f.x}%;top:${f.y}%" title="${a ? a.desc : selected.name}">
        <span class="cf-ic">${f.icon}</span><span class="cf-name">${f.name}</span>${a ? `<small>${a.name}</small>` : `<small>返回城市图</small>`}
      </button>`;
    }).join("");
    return `<div class="cm-photo cm-photo-region" aria-hidden="true"><img src="${regionAsset(selected)}" alt=""></div>
      <div class="cm-vignette cm-vignette-detail" aria-hidden="true"></div>
      <div class="cm-detail-title"><b>${selected.icon} ${selected.name}</b><span>${selected.desc}</span></div>
      <div class="cm-facilities">${facs}</div>`;
  }
  const photoRec = recommendedDistrict(s);
  const photoRd = districtById(photoRec);
  const photoRecGlow = photoRd ? `<span class="cm-rec-glow" style="left:${photoRd.x}%;top:${photoRd.y}%"></span>` : "";
  return `<div class="cm-photo" aria-hidden="true"><img src="assets/img/city-overview-chengdu-mvp.png" alt=""></div><div class="cm-vignette" aria-hidden="true"></div>${photoRecGlow}`;
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
  else if (distId === "talent_market") hot = ((s.cash || 0) < 8000 && !s.job);
  else if (distId === "park") hot = !!(s.people && (s.people.chess_exec || s.people.chess_fallen));
  else if (distId === "rental") hot = !!(s.commute && s.commute.far);
  else if (distId === "office_cbd" || distId === "tech_park") hot = !!(s.workChains && (s.workChains.blame || s.workChains.credit || s.workChains.sever));
  else if (distId === "home") hot = (typeof threadLevel === "function" && threadLevel(s, "family_pressure") >= 30);
  const broke = (s.cash || 0) < 100;   // 连便利店都吃不起
  return { visited, hot, broke };
}

if (typeof window !== "undefined") window.CITY_DISTRICTS = CITY_DISTRICTS;
