"use strict";
/* =====================================================================
 * content/routes.js —— 路线引导层（v0.13 架构重做）
 * ---------------------------------------------------------------------
 * 每条人生目标(goal)一份 ROUTE，统一驱动两件让「每条线体验完全不同」的事：
 *   ① 任务引导链 quests：一串有序目标，界面常驻「📌 当前任务」横幅 + 下一步提示，
 *      完成一个推进一个，治「不知道干嘛」。任务以进度为主、年龄为辅。
 *   ② 路线化 + 渐进解锁的每周行动：行动按【路线行动池 ∩ 解锁条件】筛，每条线行动集
 *      不同，且随任务完成/年龄逐步解锁（不再一上来全开）。
 * 专属剧情仍复用已有命运线(destiny-*)；ROUTE 只管「玩家每周做什么 + 被怎么引导」。
 *
 * 每条线一个文件 route-<goal>.js，调 registerRoute(goalId, def) 注册：
 *   def = {
 *     intro: "进入这条线时的一句话定调",
 *     actions: [actionId,...],                 // 这条线的【完整行动池】(超集)
 *     unlock: { actionId: (s)=>bool, ... },    // 各行动的解锁条件(默认解锁)；通常引用 questDone/age
 *     quests: [ { id, title, hint, done(s)->bool, onDone?(s), reward? }, ... ]   // 有序引导链
 *   }
 * 全局：ROUTES / registerRoute / routeOf / currentQuest / tickQuests
 *       / routeFilterActions / isQuestDone / questProgress
 * 加载顺序：core.js 之后、各 route-<goal>.js 之前、_assemble 之前。
 * ===================================================================== */

window.ROUTES = window.ROUTES || {};
function registerRoute(goalId, def) { ROUTES[goalId] = def || {}; }
// 别名：挑战模式/变体目标没有专属路线时，回退到同路径的基础路线，让它们也有任务引导。
const ROUTE_ALIAS = {
  sc_rags: "freedom", sc_phoenix: "freedom", sc_clean: "corp", sc_ascetic: "official",
  acad_dynasty: "acad", acad_humble: "acad"
};
function routeOf(s) {
  if (!s || !s.goal) return null;
  return ROUTES[s.goal] || ROUTES[ROUTE_ALIAS[s.goal]] || null;
}

// 通用上下文行动（婚育/宠物/休息等）：不受路线行动池限制，处境满足就出现
const CONTEXT_ACTIONS = { date: 1, companion: 1, petcare: 1, parenting: 1, grandkids: 1, family: 1, leisure: 1, rest: 1, browse: 1, exercise: 1, homecare: 1, localize: 1, hobby: 1 };

/* —— 任务完成：用 flag 永久记 done（一旦达成不回退） ——
 * ★flag 按「路线的规范目标」记★：挑战模式与变体目标(sc 系列、acad 变体)别名到基础路线后，
 * 任务 flag 要和路线文件里硬编码的 isQuestDone(s,"corp",...) 对得上，所以统一用 routeGoalOf。*/
function routeGoalOf(s) {
  if (!s || !s.goal) return null;
  if (ROUTES[s.goal]) return s.goal;
  return ROUTE_ALIAS[s.goal] || null;
}
function questDoneFlag(goalId, qid) { return "quest_" + goalId + "_" + qid; }
function isQuestDone(s, goalId, qid) { return has(s, questDoneFlag(goalId || routeGoalOf(s) || s.goal, qid)); }

// 当前任务 = 路线里第一个未完成的任务（按顺序）。返回 {quest,index,total} 或 null(全完成)
function currentQuest(s) {
  const r = routeOf(s); if (!r || !r.quests || !r.quests.length) return null;
  const rg = routeGoalOf(s);
  for (let i = 0; i < r.quests.length; i++) {
    if (!isQuestDone(s, rg, r.quests[i].id)) return { quest: r.quests[i], index: i, total: r.quests.length };
  }
  return null;
}
// 已完成任务数 / 总数
function questProgress(s) {
  const r = routeOf(s); if (!r || !r.quests) return { done: 0, total: 0 };
  const rg = routeGoalOf(s);
  let d = 0; for (const q of r.quests) if (isQuestDone(s, rg, q.id)) d++;
  return { done: d, total: r.quests.length };
}

/* 引擎每周调用：按顺序检查当前任务是否达成 → 记 done + onDone 副作用 + 返回新完成的任务(播报用)。
 * 任务有序：只从「第一个未完成」开始判，达成则继续判下一个，未达成就停。*/
function tickQuests(s) {
  const r = routeOf(s); if (!r || !r.quests) return [];
  const rg = routeGoalOf(s);
  const fresh = [];
  for (const q of r.quests) {
    if (isQuestDone(s, rg, q.id)) continue;
    let ok = false; try { ok = q.done(s); } catch (e) { ok = false; }
    if (!ok) break;                                  // 必须按顺序：卡在第一个未达成的
    flag(s, questDoneFlag(rg, q.id));
    if (q.onDone) { try { q.onDone(s); } catch (e) { } }
    fresh.push(q);
  }
  return fresh;
}

/* —— 路线化 + 渐进解锁的行动筛选（引擎 renderPlay 调用，替代旧的 stage∩require 过滤）——
 * 有路线时：可做的事 = 路线行动池(已解锁) ∪ 上下文行动，再 ∩ require 处境门槛。
 * 没路线时：回退旧逻辑(本阶段行动 ∪ anyStage) ∩ require。*/
function routeActionUnlocked(s, actionId) {
  const r = routeOf(s); if (!r) return true;
  if (r.unlock && r.unlock[actionId]) { try { return !!r.unlock[actionId](s); } catch (e) { return false; } }
  return true;
}
function routeFilterActions(s, allActions, stage) {
  const r = routeOf(s);
  return allActions.filter(a => {
    const reqOK = !a.require || (function () { try { return a.require(s); } catch (e) { return false; } })();
    if (!reqOK) return false;
    if (!r || !r.actions) return stage.actions.includes(a.id) || a.anyStage;   // 无路线 → 旧逻辑
    if (r.actions.indexOf(a.id) >= 0) return routeActionUnlocked(s, a.id);     // 路线池内 → 看是否已解锁
    if (a.anyStage && CONTEXT_ACTIONS[a.id]) return true;                      // 上下文行动总放行
    return false;
  });
}
// 给「未解锁」的路线行动做提示（让玩家知道还有东西没开）：返回 [{name,emoji,why}]
function routeLockedHints(s) {
  const r = routeOf(s); if (!r || !r.actions || !r.lockHint) return [];
  const out = [];
  for (const id of r.actions) {
    if (!routeActionUnlocked(s, id) && r.lockHint[id]) out.push({ id, why: r.lockHint[id] });
  }
  return out;
}

if (typeof window !== "undefined") {
  window.registerRoute = registerRoute; window.routeOf = routeOf;
  window.currentQuest = currentQuest; window.questProgress = questProgress;
  window.tickQuests = tickQuests; window.isQuestDone = isQuestDone;
  window.routeFilterActions = routeFilterActions; window.routeActionUnlocked = routeActionUnlocked;
  window.routeLockedHints = routeLockedHints;
}
