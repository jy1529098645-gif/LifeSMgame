"use strict";
/* =====================================================================
 * content/destiny.js —— 命运主线框架（v0.10 主线脊柱）
 * ---------------------------------------------------------------------
 * 解决「没有主线、全是重复填充」：给每条人生目标配一条【确定性的命运线】。
 *
 * 设计：
 *   - 每条目标线 = 5 幕「脊柱事件」(序·立志 → 起·崭露 → 折·转折 → 危·抉择 → 巅·一搏)，
 *     外加死亡时的「母题清算」(reckon)。
 *   - 脊柱事件 module:"destiny"、**ambient:false** → 永不进随机池，只由调度器按
 *     【人生阶段 + 年龄 + 前一幕已完成】确定性地强制弹出，保证有头有尾、顺序不乱。
 *   - 前一幕的选择被记进 s.dstLog（埋线），后续幕 + 母题清算据此分叉/回收（回收）。
 *   - saga / 氛围事件退回去当「花絮」，命运线才是贯穿一生的主轴。
 *
 * 写法（每条线一个文件 destiny-<goal>.js，调 registerDestiny，互不冲突）：
 *   registerDestiny("corp", { name, motif, acts:["序","起",...], reckon(s)->str }, [
 *     { id:"dst_corp_1", at:{ minAge:20, stage:["youth"] }, after:null,
 *       title, text(s), choices:[...] | dynamicChoices(s) },   // 与普通 event 同构
 *     ...
 *   ]);
 *   选项 effect 里调 dstChoose(s,"dst_corp_1","key","回顾用短语") 记录抉择（供后续回收）。
 *
 * 全局：DESTINY_LINES / registerDestiny / destinyLine / nextDestinyChapter
 *       / dstChoose / dstPick / destinyReckon / destinyStatus
 * 依赖：has/flag/add/pick/rnd（core.js 全局）、goalProgress/stageOf 由引擎读。
 * 加载顺序：本文件最先，其后各 destiny-<goal>.js，再 _assemble.js。
 * ===================================================================== */

window.DESTINY_LINES = window.DESTINY_LINES || {};
// 复用 core.js 已声明的全局 EVENTS（const EVENTS = events）——脊柱事件也 push 进去
// 注意：绝不可在此重复 var/let/const EVENTS，否则与 core.js 全局声明冲突报 SyntaxError。

/* 注册一条命运线：meta={name,motif,acts[],reckon(s)}，chapters[] 为脊柱事件 */
function registerDestiny(goalId, meta, chapters) {
  meta = meta || {};
  chapters = chapters || [];
  // 标注幕序、强制非随机，并 push 进事件总表
  chapters.forEach((ch, i) => {
    ch.module = "destiny";
    ch.ambient = false;                 // 关键：永不进随机池
    ch.dstGoal = goalId;
    ch.dstIdx = i;                       // 第几幕（0 起）
    ch.at = ch.at || {};
    EVENTS.push(ch);
  });
  DESTINY_LINES[goalId] = { id: goalId, meta: meta, chapters: chapters };
}

// 挑战模式/变体目标没有专属命运线时，回退到同路径的基础命运线（让挑战局也有 5 幕剧情）
var DESTINY_ALIAS = { sc_rags: "freedom", sc_phoenix: "freedom", sc_clean: "corp", sc_ascetic: "official" };
function destinyLine(s) {
  if (!s || !s.goal) return null;
  return DESTINY_LINES[s.goal] || DESTINY_LINES[DESTINY_ALIAS[s.goal]] || null;
}

/* 某一幕是否「到点」可触发：前一幕已完成 + 年龄达标 + 阶段匹配 + 自定义 cond */
function _chapterDue(s, line, ch) {
  if (has(s, "dstdone_" + ch.id)) return false;                 // 已演过
  const at = ch.at || {};
  // 顺序锁：必须前面所有幕都已完成（保证不乱序、有头有尾）
  for (let i = 0; i < ch.dstIdx; i++) {
    if (!has(s, "dstdone_" + line.chapters[i].id)) return false;
  }
  if (at.minAge && s.age < at.minAge) return false;
  if (at.maxAge && s.age > at.maxAge) return false;
  if (at.stage && at.stage.length && s.stageId && at.stage.indexOf(s.stageId) < 0) {
    // 阶段不匹配时：若已超过该幕设定的年龄上限窗口，则放宽（避免错过导致主线卡死）
    if (!(at.minAge && s.age >= at.minAge)) return false;
  }
  if (at.cond) { try { if (!at.cond(s)) return false; } catch (e) { return false; } }
  if (ch.cond) { try { if (!ch.cond(s)) return false; } catch (e) { return false; } }
  return true;
}

/* 调度器：返回当前应强制弹出的下一幕脊柱事件 id（无则 null）。引擎在 renderPlay 调用 */
function nextDestinyChapter(s) {
  const line = destinyLine(s);
  if (!line) return null;
  for (const ch of line.chapters) {
    if (_chapterDue(s, line, ch)) return ch.id;
  }
  return null;
}

/* 记录一幕的抉择（埋线）：key 供后续幕/清算分叉判断，note 进人生回顾 */
function dstChoose(s, chId, key, note) {
  s.dstLog = s.dstLog || [];
  s.dstLog.push({ ch: chId, key: key, age: s.age });
  if (key) flag(s, "dst_pick_" + key);                          // 便于 has(s,"dst_pick_xxx") 回收
  return note || "";
}
/* 读某一幕当时选了什么 key（回收用） */
function dstPick(s, chId) {
  const r = (s.dstLog || []).filter(x => x.ch === chId);
  return r.length ? r[r.length - 1].key : null;
}
/* 这条线一共完成了几幕 */
function destinyDoneCount(s) {
  const line = destinyLine(s); if (!line) return 0;
  return line.chapters.filter(ch => has(s, "dstdone_" + ch.id)).length;
}

/* 死亡时的母题清算：优先用该线 reckon(s)，回收一生的命运抉择 */
function destinyReckon(s) {
  const line = destinyLine(s);
  if (!line || !line.meta || typeof line.meta.reckon !== "function") return "";
  try { return line.meta.reckon(s) || ""; } catch (e) { return ""; }
}

/* 仪表盘用：当前命运线进度 {name, act, idx, total, motif} */
function destinyStatus(s) {
  const line = destinyLine(s); if (!line) return null;
  const total = line.chapters.length;
  const done = destinyDoneCount(s);
  const acts = (line.meta && line.meta.acts) || [];
  // 「当前/下一幕」名：已完成 done 幕，则正在第 done+1 幕（封顶 total）
  const cur = Math.min(done, total - 1);
  return {
    name: line.meta.name || "",
    motif: line.meta.motif || "",
    act: acts[cur] || "",
    idx: done, total: total,
    finished: done >= total
  };
}

// 暴露到 window，供 _test/headless 直接引用
if (typeof window !== "undefined") {
  window.registerDestiny = registerDestiny;
  window.destinyLine = destinyLine;
  window.nextDestinyChapter = nextDestinyChapter;
  window.dstChoose = dstChoose;
  window.dstPick = dstPick;
  window.destinyReckon = destinyReckon;
  window.destinyStatus = destinyStatus;
  window.destinyDoneCount = destinyDoneCount;
}
