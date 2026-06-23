"use strict";
/* =====================================================================
 * content/memory-system.js —— 长期选择记忆·回响（大框架改造·批次1）
 * runtime-state.js 已有 addMemory(s, m)（结构化记忆 + 200 条上限）。本文件在其上
 * 补「分类记忆 + 回响读取」：后续事件能读记忆改文本/结果（doc §9）。
 *
 * memory = { id?, type, age, year, week, text, tags[], intensity, actors[], consequences? }
 * 暴露：rememberFact, recallMemories, recallOne, memoryHas, memoryCount, memoryDigest
 * 必记类别（doc §9.2）：origin/major/first_job/work_event/favor/grudge/health_scar/
 *   invest_win/invest_loss/scammed/anti_scam/romance/resign/opportunity
 * ===================================================================== */

const MEMORY_TYPES = [
  "origin", "major", "first_job", "work_event", "favor", "grudge",
  "health_scar", "invest_win", "invest_loss", "scammed", "anti_scam",
  "romance", "resign", "opportunity", "stage", "beat"
];

// 写一条记忆（包装 addMemory，附默认强度/标签；幂等可选 once）
function rememberFact(s, m) {
  if (!s || !m) return null;
  if (typeof addMemory !== "function") return null;
  // once：同 id 只记一次（重大事件只触发一次的兜底，doc §5.3）
  if (m.once && m.id && s.memories && s.memories.some(x => x.id === m.id)) return null;
  const mem = {
    id: m.id || null,
    type: m.type || "info",
    text: m.text || "",
    tags: m.tags || (m.type ? [m.type] : []),
    intensity: m.intensity != null ? m.intensity : 2,
    actors: m.actors || [],
    consequences: m.consequences || null
  };
  addMemory(s, mem);
  return mem;
}

// 回响读取：按 type / tag / actor 过滤
function recallMemories(s, filter) {
  const list = (s && s.memories) || [];
  if (!filter) return list.slice();
  return list.filter(m => {
    if (filter.type && m.type !== filter.type) return false;
    if (filter.tag && !(m.tags && m.tags.indexOf(filter.tag) >= 0)) return false;
    if (filter.actor && !(m.actors && m.actors.indexOf(filter.actor) >= 0)) return false;
    if (filter.minIntensity && (m.intensity || 0) < filter.minIntensity) return false;
    return true;
  });
}
function recallOne(s, filter) { const r = recallMemories(s, filter); return r.length ? r[r.length - 1] : null; }
function memoryHas(s, filter) { return recallMemories(s, filter).length > 0; }
function memoryCount(s, filter) { return recallMemories(s, filter).length; }

// 给「人生回顾/时间线」用的浓缩摘要：取强度最高的若干条
function memoryDigest(s, n) {
  const list = ((s && s.memories) || []).filter(m => (m.intensity || 0) >= 2 && m.text);
  list.sort((a, b) => (b.intensity || 0) - (a.intensity || 0) || (b.week || 0) - (a.week || 0));
  return list.slice(0, n || 8);
}

if (typeof window !== "undefined") window.MEMORY_TYPES = MEMORY_TYPES;
