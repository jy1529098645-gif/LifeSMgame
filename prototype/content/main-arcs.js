"use strict";
/* =====================================================================
 * content/main-arcs.js —— 核心主线剧本系统（升级·第一阶段）
 * destiny-* 是「目标命运线」（绑定人生目标：IPO/体制/财富自由…）。
 * main-arc-* 是「出身/时代核心剧本」（由开局地区/家庭/求学/早期选择决定）。
 * 一局可同时有：s.goal（目标）+ s.mainArc（核心剧本）+ destiny（目标5幕）+ mainArc（剧本5幕）。
 *
 * 调度优先级（renderPlay）：死亡 > 子场景 > pendingDecision > 【mainArc 当前幕】>
 *                          destiny 当前幕 > route quest > 场景事件 > ambient。
 * 主线事件 module="mainarc"、非 ambient，由 nextMainArcChapter(s) 确定性强制触发。
 * ===================================================================== */

const MAIN_ARCS = {};
function registerMainArc(id, def) {
  MAIN_ARCS[id] = Object.assign({ id: id, tension: 35, weight: 1 }, def);
  return MAIN_ARCS[id];
}
function mainArcOf(s) { return (s.mainArc && MAIN_ARCS[s.mainArc.id]) || null; }

/* —— 开局挑一条核心剧本：按 startCond 命中 + 权重，命中多条取权重高者 —— */
function pickMainArc(s) {
  if (s.mainArc) return s.mainArc;           // 幂等：已选则不再选
  let best = null, bestScore = -1;
  for (const id in MAIN_ARCS) {
    const a = MAIN_ARCS[id];
    let ok = false; try { ok = !a.startCond || a.startCond(s); } catch (e) { ok = false; }
    if (!ok) continue;
    const score = (a.weight || 1) + Math.random();   // 权重 + 抖动，避免总是同一条
    if (score > bestScore) { bestScore = score; best = a; }
  }
  if (!best) return null;                     // 没有匹配的剧本：这局没有核心主线（仍有 destiny/route）
  s.mainArc = { id: best.id, act: 0, chapter: 0, tension: best.tension || 35, finished: false };
  if (best.initCast) { try { best.initCast(s); } catch (e) {} }
  if (typeof addMemory === "function") addMemory(s, { id: "arc_begin_" + best.id, type: "arc_begin", arc: best.id, intensity: 30, text: "命运的底色已定：" + best.theme, tags: ["arc", "origin"] });
  return s.mainArc;
}

/* —— 当前应推进的主线幕：返回事件 id（供 renderPlay 强制触发），否则 null —— */
function nextMainArcChapter(s) {
  const arc = mainArcOf(s); if (!arc || !arc.acts) return null;
  for (let i = 0; i < arc.acts.length; i++) {
    const act = arc.acts[i];
    const evid = act.evid || (arc.id + "_act" + (i + 1));
    if (has(s, "arcdone_" + evid)) continue;          // 这一幕已演过
    if (i > 0) {                                       // 必须前一幕已完成
      const prev = arc.acts[i - 1];
      const prevId = prev.evid || (arc.id + "_act" + i);
      if (!has(s, "arcdone_" + prevId)) return null;
    }
    if (s.age < (act.minAge || 0)) return null;        // 年龄未到，等
    if (act.cond) { let ok = false; try { ok = act.cond(s); } catch (e) { ok = false; } if (!ok) return null; }
    s.mainArc.act = i; s.mainArc.chapter = i;
    return evid;
  }
  if (!s.mainArc.finished) s.mainArc.finished = true;  // 全部演完
  return null;
}

/* —— 主线选择记录 + 张力推进（事件 effect 内调用）—— */
function arcChoose(s, key, data) {
  s.arcLog = s.arcLog || [];
  s.arcLog.push(Object.assign({ age: s.age, year: s.year, arc: s.mainArc && s.mainArc.id, key: key }, data || {}));
  if (s.mainArc && data && data.tension != null) s.mainArc.tension = Math.max(0, Math.min(100, (s.mainArc.tension || 35) + data.tension));
  if (data && data.memory && typeof addMemory === "function") addMemory(s, Object.assign({ arc: s.mainArc && s.mainArc.id, tags: ["arc"] }, data.memory));
}
function arcChose(s, key) { return (s.arcLog || []).some(x => x.key === key); }   // 早年选择的后期回收用

/* —— 仪表盘/章节状态 —— */
function mainArcStatus(s) {
  const arc = mainArcOf(s); if (!arc) return null;
  const i = (s.mainArc.act || 0);
  const act = arc.acts && arc.acts[i];
  return { name: arc.name, theme: arc.theme, act: i + 1, total: (arc.acts || []).length,
    title: act ? act.title : "", tension: s.mainArc.tension || 0, finished: !!s.mainArc.finished, friction: arc.friction };
}

/* —— 结局回收：这一生主线选择的结算文本 —— */
function mainArcReckon(s) {
  const arc = mainArcOf(s); if (!arc || !arc.reckon) return "";
  try { return arc.reckon(s) || ""; } catch (e) { return ""; }
}

/* —— 给主线事件用的小工具：固定角色名取用 —— */
function castName(s, id, fallback) {
  const c = s.cast && s.cast[id];
  return (c && c.name) || fallback || "那个人";
}
