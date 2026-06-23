"use strict";
/* =====================================================================
 * content/scene-manager.js —— 场景化玩法（大框架改造·批次1 骨架）
 * 场景不是背景文本：它决定可做行动、可遇角色、可触发事件、可进事件链（doc §4）。
 * 已有 runtime-state.js 的 currentScene(s) 负责「当前在哪类场景」；本文件提供
 * 场景【注册表】（美术资产字段 + 氛围文 + 事件标签 + 人物池），并把两者合一。
 *
 * 暴露：SCENES, sceneById, sceneMeta(s), sceneAmbient(s), sceneEventTags(s)
 * ===================================================================== */

// 一期场景表（doc §4.2）。artKey 预留美术资产位，一期可占位（doc §4.3）。
// 场景 = 玩法容器：actions 决定在此地能做什么（doc §6.2，getWeekActions 读 sceneMeta.actions）
const SCENES = {
  school:    { id: "school",    name: "学校",       artKey: "scene_school",    ambient: "梧桐道、自习室、社团招新海报。这里的时间还很便宜。", eventTags: ["study", "campus", "youth"], peoplePool: ["classmate", "professor", "senior"], actions: ["study", "parttime", "prep_interview", "ask_senior", "leisure"] },
  dorm:      { id: "dorm",      name: "宿舍",       artKey: "scene_dorm",      ambient: "上铺的呼噜、泡面味、永远不够用的插座。", eventTags: ["life", "campus"], peoplePool: ["roommate"], actions: ["study", "rest", "browse"] },
  office:    { id: "office",    name: "公司",       artKey: "scene_office",    ambient: "工位、隔间、永远开着的会议室和闪烁的钉钉红点。", eventTags: ["work", "career", "absurd"], peoplePool: ["boss", "colleague", "hr"], actions: ["work", "overtime_perf", "coworker_lunch", "collect_evidence", "learn_industry"] },
  commute:   { id: "commute",   name: "通勤路上",   artKey: "scene_commute",   ambient: "挤成相片的地铁、误点的公交、被汗水黏住的衬衫。", eventTags: ["work", "life"], peoplePool: ["stranger"], actions: ["move_near_office", "rest", "browse"] },
  rental:    { id: "rental",    name: "出租屋",     artKey: "scene_rental",    ambient: "隔音差的合租、押一付三的合同、楼下永远在装修。", eventTags: ["life", "housing"], peoplePool: ["roommate", "landlord"], actions: ["rest", "move_near_office", "side_project"] },
  park:      { id: "park",      name: "公园/棋牌点", artKey: "scene_park",     ambient: "石桌上的残局、遛鸟的大爷、看不出底细的对手。", eventTags: ["leisure", "boardgame", "network"], peoplePool: ["chess_player", "retiree"], actions: ["leisure", "exercise", "talk_to_mentor"] },
  hospital:  { id: "hospital",  name: "医院",       artKey: "scene_hospital",  ambient: "排队三小时、问诊三分钟、缴费窗口前的长队。", eventTags: ["health", "crisis"], peoplePool: ["doctor", "patient"], actions: ["rest"] },
  banquet:   { id: "banquet",   name: "饭局/聚会",  artKey: "scene_banquet",   ambient: "转盘、敬酒、推不掉的人情和压低声音的「机会」。", eventTags: ["network", "social", "absurd"], peoplePool: ["boss", "investor", "fixer"], actions: ["socialize", "talk_to_mentor"] },
  netgroup:  { id: "netgroup",  name: "网络社区/投资群", artKey: "scene_netgroup", ambient: "晒收益截图的群、热心的「老师」、来路不明的内幕。", eventTags: ["invest", "fraud", "world"], peoplePool: ["guru", "scammer"], actions: ["invest", "browse", "side_project"] },
  arbitration:{ id: "arbitration", name: "劳动仲裁现场", artKey: "scene_arbitration", ambient: "走廊里攥着证据的人、冷脸的 HR、写满条款的桌子。", eventTags: ["career", "crisis"], peoplePool: ["hr", "lawyer"], actions: ["collect_evidence"] },
  startup_office:{ id: "startup_office", name: "创业办公室", artKey: "scene_startup", ambient: "二手工位、白板上的箭头、烧得见底的跑道和不肯睡的合伙人。", eventTags: ["venture", "startup", "crisis"], peoplePool: ["cofounder", "investor", "client"], actions: ["venture", "startup", "validate_need", "calculate_runway"] },
  home:      { id: "home",      name: "家",         artKey: "scene_home",      ambient: "饭桌上的沉默与唠叨、孩子的作业、父母渐白的头发。", eventTags: ["family", "love"], peoplePool: ["spouse", "parent", "kid"], actions: ["rest", "date", "browse"] },
  daily:     { id: "daily",     name: "日常",       artKey: "scene_daily",     ambient: "平平无奇的一周，生活在等你做点什么。", eventTags: ["life"], peoplePool: ["stranger"], actions: ["browse", "rest", "leisure", "exercise"] }
};

function sceneById(id) { return SCENES[id] || null; }

// 把 runtime-state 的 currentScene（当前在哪类场景）映射到注册表里的具体场景
function _resolveSceneKey(s) {
  const cs = (typeof currentScene === "function") ? currentScene(s) : { type: "life" };
  switch (cs.type) {
    case "study":  return (s.study && s.study.active) ? "school" : "school";
    case "venture":return "startup_office";
    case "travel": return "daily";
    case "work":   return "office";
    case "family": return "home";
    default:       return "daily";
  }
}

function sceneMeta(s) {
  const key = _resolveSceneKey(s);
  const def = sceneById(key) || SCENES.daily;
  return Object.assign({ key }, def);
}
function sceneAmbient(s) { const m = sceneMeta(s); return m ? m.ambient : ""; }
function sceneEventTags(s) { const m = sceneMeta(s); return (m && m.eventTags) || []; }

if (typeof window !== "undefined") window.SCENES = SCENES;
