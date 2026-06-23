"use strict";
/* =====================================================================
 * content/chapters.js —— 视觉小说章节增强（升级·第二阶段 / task G）
 * 主线幕事件进场时，眉头显示「核心剧本·第N幕·幕名」，并在标题下方补一行
 * 「时代摘要」：经济景气 + 行业冷热 + 这条路的社会摩擦，让玩家知道
 *   ① 自己正处在哪一章 ② 世界此刻是什么样 ③ 接下来的核心矛盾。
 * 引擎 renderEvent 在 module==="mainarc" 时读取 chapterTitle/chapterWorldSummary。
 * ===================================================================== */

function chapterTitle(s) {
  if (typeof mainArcStatus === "function") {
    const st = mainArcStatus(s);
    if (st && st.act) return `📖 ${st.name} · 第${st.act}幕：${st.title || ""}`;
  }
  return `${s.year} 年 · ${s.age} 岁`;
}
function summarizeEconomy(s) {
  const w = s.world; if (!w) return "";
  const jm = w.jobMarket != null ? w.jobMarket : 60;
  const base = jm < 40 ? "经济下行、就业收紧" : jm > 72 ? "经济繁荣、机会涌动" : "经济平稳";
  return w.crash ? base + "（泡沫刚破）" : base;
}
function chapterFriction(s) {
  const a = (typeof mainArcOf === "function") && mainArcOf(s);
  return (a && a.friction) || "";
}
// 主线张力一句话（给章节摘要点睛）
function chapterTension(s) {
  const st = (typeof mainArcStatus === "function") && mainArcStatus(s);
  if (!st) return "";
  const t = st.tension || 0;
  return t >= 70 ? "矛盾已绷到极点" : t >= 45 ? "暗流开始涌动" : "";
}
function chapterWorldSummary(s) {
  const parts = [];
  const eco = summarizeEconomy(s); if (eco) parts.push("🌍 " + eco);
  if (typeof summarizeIndustry === "function") { const ind = summarizeIndustry(s); if (ind) parts.push(ind); }
  const ten = chapterTension(s); if (ten) parts.push(ten);
  const fr = chapterFriction(s); if (fr) parts.push("⚖️ " + fr);
  return parts.join("　");
}
