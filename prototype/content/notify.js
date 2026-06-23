"use strict";
/* =====================================================================
 * content/notify.js —— 关键结果提醒中心（大框架改造·批次1）
 * 让玩家不会「在不知情下突然亏大钱/病重」（doc §10）。统一的结构化提醒队列，
 * 引擎每周渲染时取出展示。提醒要短，但必须让玩家理解因果。
 *
 * 暴露：ensureNotices, notify, notifyMoney, notifyCost, drainNotices, peekNotices
 * ===================================================================== */

const NOTICE_KINDS = {
  money:  { emoji: "💰", cls: "nt-money" },
  cost:   { emoji: "💸", cls: "nt-cost" },
  health: { emoji: "🏥", cls: "nt-health" },
  work:   { emoji: "💼", cls: "nt-work" },
  warn:   { emoji: "⚠️", cls: "nt-warn" },
  stage:  { emoji: "🧭", cls: "nt-stage" },
  relation:{ emoji: "🤝", cls: "nt-relation" },
  chance: { emoji: "💡", cls: "nt-chance" },
  world:  { emoji: "🌍", cls: "nt-world" },
  info:   { emoji: "ℹ️", cls: "nt-info" }
};

function ensureNotices(s) { if (!s.notices) s.notices = []; return s.notices; }

// 推入一条提醒。{ kind, title, body, amount? }；幂等去重靠调用方控制
function notify(s, n) {
  if (!s || !n) return;
  ensureNotices(s);
  const kind = NOTICE_KINDS[n.kind] ? n.kind : "info";
  const note = { kind, emoji: n.emoji || NOTICE_KINDS[kind].emoji, title: n.title || "", body: n.body || "", amount: (n.amount != null ? n.amount : null), age: s.age, week: s.week };
  s.notices.push(note);
  if (s.notices.length > 60) s.notices.splice(0, s.notices.length - 60);
  // 兜底：同时落一条周日志，确保即便 UI 还没接提醒面板也看得见
  if (s._weekNotes && s._weekNotes.length < 40) {
    s._weekNotes.push(`${note.emoji} ${note.title}${note.body ? "：" + note.body : ""}`);
  }
  return note;
}

// 股市/收入赚钱亏钱：必弹（doc §7.5 / §10.1）
function notifyMoney(s, amount, body) {
  return notify(s, { kind: amount >= 0 ? "money" : "cost", title: amount >= 0 ? `进账 ¥${Math.abs(Math.round(amount)).toLocaleString()}` : `损失 ¥${Math.abs(Math.round(amount)).toLocaleString()}`, body: body || "", amount });
}
// 高成本选择前置展示（doc §3.4 / §10.3）
function notifyCost(s, amount, body) {
  return notify(s, { kind: "cost", title: `支出 ¥${Math.abs(Math.round(amount)).toLocaleString()}`, body: body || "", amount: -Math.abs(amount) });
}

// 引擎渲染后取走（清空）；peek 只看不取
function drainNotices(s) { const n = (s && s.notices) || []; s.notices = []; return n; }
function peekNotices(s) { return (s && s.notices) || []; }

if (typeof window !== "undefined") window.NOTICE_KINDS = NOTICE_KINDS;
