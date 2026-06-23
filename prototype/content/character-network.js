"use strict";
/* =====================================================================
 * content/character-network.js —— 人物关系网与信息披露（大框架改造·批次5，doc §6）
 * 人物不直接摊牌：信息按关系逐层披露（seen→known→familiar→trusted→deep）。
 * 部分人物表里不一（隐藏身份/虚假人设）。关系网会【主动】找上你：邀饭、约棋、
 * 推机会、拉投资、介绍客户、暗示灰产。娱乐里认识的人，能在创业期发挥作用。
 *
 * 状态：s.people[id] = { id, reveal(0-5), trust, hiddenKnown }
 * ===================================================================== */

const REVEAL = { seen: 1, known: 2, familiar: 3, trusted: 4, deep: 5 };
const REVEAL_NAME = ["陌生", "见过", "知道职业", "熟悉脾性", "知根知底", "生死之交"];

// 隐藏身份花名册（≥5 个表里不一；scam=骗局入口；boon=能在创业期发挥作用）
const HIDDEN_NPCS = [
  { id: "chess_exec",   name: "老周", emoji: "♟️", publicRole: "公园棋摊的常客大爷", hiddenRole: "退休的国企副总", agenda: "想把一身人脉托付给个聪明后生", boon: "exec" },
  { id: "chess_fallen", name: "老马", emoji: "♟️", publicRole: "棋摊边沉默寡言的中年人", hiddenRole: "破产过两次的前千万老板", agenda: "想东山再起，顺便找个搭伙的", boon: "fallen" },
  { id: "park_auntie",  name: "刘姨", emoji: "🧣", publicRole: "遛弯爱聊家常的阿姨", hiddenRole: "某天使投资人的母亲", agenda: "替儿子物色靠谱的年轻人", boon: "investor" },
  { id: "banquet_fixer",name: "赵哥", emoji: "🍷", publicRole: "酒局上呼朋唤友的热心朋友", hiddenRole: "能介绍客户但要灰色回扣的掮客", agenda: "用客户换好处", boon: "clients", gray: true },
  { id: "net_guru",     name: "陈老师", emoji: "📈", publicRole: "投资群里有求必应的「老师」", hiddenRole: "杀猪盘的托儿", agenda: "把你一步步引进局", scam: true },
  { id: "biz_mentor",   name: "David", emoji: "🎤", publicRole: "朋友圈光鲜的成功创业导师", hiddenRole: "靠卖课和加盟割韭菜的培训骗子", agenda: "卖你高价课程", scam: true }
];
function npcDef(id) { return HIDDEN_NPCS.find(n => n.id === id) || null; }

function ensurePeople(s) { if (!s.people) s.people = {}; return s.people; }
// 加深与某人的关系：reveal 升级；到 trusted(4) 才揭开隐藏身份
function meetPerson(s, id, dlevel, dtrust) {
  ensurePeople(s);
  if (!npcDef(id)) return null;
  const p = s.people[id] || (s.people[id] = { id, reveal: 0, trust: 40, hiddenKnown: false });
  p.reveal = Math.max(p.reveal || 0, Math.min(5, (p.reveal || 0) + (dlevel || 1)));
  p.trust = Math.max(0, Math.min(100, (p.trust || 40) + (dtrust || 0)));
  if (p.reveal >= REVEAL.trusted && !p.hiddenKnown) p.hiddenKnown = true;   // 关系够深 → 看穿表里
  return p;
}
function personReveal(s, id) { return (s.people && s.people[id] && s.people[id].reveal) || 0; }
function personKnown(s, id) { return !!(s.people && s.people[id] && s.people[id].hiddenKnown); }
function personMet(s, id) { return personReveal(s, id) > 0; }
// 当前称呼：未揭穿只显示表层人设，揭穿后才点破隐藏身份（doc §6.1）
function personLabel(s, id) {
  const def = npcDef(id); if (!def) return "某人";
  return personKnown(s, id) ? `${def.name}（其实是${def.hiddenRole}）` : `${def.name}（${def.publicRole}）`;
}
function pickUnmetNPC(s, filter) {
  ensurePeople(s);
  const pool = HIDDEN_NPCS.filter(n => !personMet(s, n.id) && (!filter || filter(n)));
  return pool.length ? pick(pool) : null;
}
function anyPersonAt(s, minReveal, filter) {
  if (!s.people) return null;
  for (const id in s.people) { const p = s.people[id]; const def = npcDef(id); if (p.reveal >= minReveal && def && (!filter || filter(def, p))) return def; }
  return null;
}

EVENTS.push(
  // —— 棋摊偶遇：娱乐里埋下伏笔（seen）——
  {
    id: "ev_cn_chess_meet", module: "relation", ambient: true, importance: "normal",
    cond: s => s.age >= 20 && pickUnmetNPC(s, n => n.id.indexOf("chess") === 0 || n.id === "park_auntie") && (s.week - (s._cnMeetWk || -99)) >= 10 && rnd(0.22),
    title: "🪑 棋摊边的陌生人",
    text: s => { const n = pickUnmetNPC(s, x => x.id.indexOf("chess") === 0 || x.id === "park_auntie") || HIDDEN_NPCS[0]; s._cnPick = n.id; return `公园的石桌旁，${n.publicRole}招呼你来一盘。看不出什么来头，棋路却老辣得很。一来二去，你们聊起了天——他没多说自己的事，只笑眯眯地看着你落子。`; },
    choices: [
      { label: "多聊几句，留个联系方式", effect: s => { const id = s._cnPick || "chess_exec"; meetPerson(s, id, 2, 10); s._cnMeetWk = s.week; add(s, "network", 2); add(s, "mood", 3); if (typeof recordBeat === "function") recordBeat(s, "first_network"); if (typeof rememberFact === "function") rememberFact(s, { type: "favor", text: `在棋摊认识了${npcDef(id) ? npcDef(id).name : "一位棋友"}，看不出深浅。`, tags: ["network", id], intensity: 1, actors: [id] }); return `你们加了微信。临走他拍拍你肩：「后生可畏，常来。」你没太当回事——却不知道，这一面之缘，日后会牵出别的故事。`; } },
      { label: "下完这盘就走", effect: s => { const id = s._cnPick || "chess_exec"; meetPerson(s, id, 1, 2); s._cnMeetWk = s.week; return "你赢了输了都没太在意，起身道别。萍水相逢，谁知道这棋摊大爷是什么来路。"; } }
    ]
  },
  // —— 关系加深：揭开隐藏身份（familiar→trusted）——
  {
    id: "ev_cn_reveal", module: "relation", ambient: true, importance: "turning",
    cond: s => anyPersonAt(s, REVEAL.known, (def, p) => !p.hiddenKnown && !def.scam && p.reveal >= 2) && (s.week - (s._cnRevealWk || -99)) >= 8 && rnd(0.3),
    title: "🎭 原来你是这样的人",
    text: s => { const def = anyPersonAt(s, REVEAL.known, (d, p) => !p.hiddenKnown && !d.scam && p.reveal >= 2) || HIDDEN_NPCS[0]; s._cnReveal = def.id; return `走得久了，${def.name}才慢慢露了底。一次喝茶，他云淡风轻地提起往事，你才惊觉：这个看似${def.publicRole}的人，竟然是${def.hiddenRole}。「人嘛，到了岁数，光环都是累赘。」他笑笑。`; },
    choices: [
      { label: "肃然起敬，真心结交", effect: s => { const id = s._cnReveal || "chess_exec"; meetPerson(s, id, 2, 15); s._cnRevealWk = s.week; add(s, "network", 4); add(s, "insight", 2); const def = npcDef(id); if (typeof rememberFact === "function") rememberFact(s, { id: "reveal_" + id, once: true, type: "favor", text: `看穿了${def.name}的真实身份——${def.hiddenRole}。这层关系，将来或许用得上。`, tags: ["network", id, "hidden"], intensity: 3, actors: [id] }); return `你没有谄媚，也没有疏远，只是更真心地待他。他看在眼里。有些门，不是钱能敲开的，是这样一盘盘棋、一次次真诚换来的。`; } },
      { label: "客气几句，保持距离", effect: s => { const id = s._cnReveal || "chess_exec"; if (s.people && s.people[id]) s.people[id].hiddenKnown = true; s._cnRevealWk = s.week; return "你点点头，心里记下了他的来头，却没往深里走。人脉是把双刃剑，深交浅交，你有自己的分寸。"; } }
    ]
  },
  // —— 主动邀请①：约你吃饭 ——
  {
    id: "ev_cn_invite_dinner", module: "relation", ambient: true, importance: "normal",
    cond: s => anyPersonAt(s, REVEAL.familiar, (def, p) => !def.scam && p.trust >= 55) && (s.week - (s._cnInviteWk || -99)) >= 9 && rnd(0.26),
    title: "🍲 「来家里吃个饭」",
    text: s => { const def = anyPersonAt(s, REVEAL.familiar, (d, p) => !d.scam && p.trust >= 55) || HIDDEN_NPCS[0]; s._cnInvite = def.id; return `${personLabel(s, def.id)}主动给你来了电话：「周末有空没？来家里吃个便饭，我让你嫂子做几个菜。」——人情往来，是关系网真正开始流动的信号。`; },
    choices: [
      { label: "提点东西，登门拜访", effect: s => { const id = s._cnInvite || "chess_exec"; meetPerson(s, id, 1, 12); s._cnInviteWk = s.week; add(s, "cash", -Math.round(400 * ((s.world && s.world.priceIndex) || 1))); add(s, "network", 5); add(s, "mood", 4); if (typeof rememberFact === "function") rememberFact(s, { type: "favor", text: `去${npcDef(id).name}家吃了顿饭，关系更近了一层。`, tags: ["network", id], intensity: 2, actors: [id] }); return "一顿家常饭，几杯小酒，话越说越透。临走时他塞给你一袋自家腌的菜，也塞给你一句：「以后有难处，言语一声。」这句话的分量，你掂得出来。"; } },
      { label: "婉拒，怕欠人情", effect: s => { const id = s._cnInvite || "chess_exec"; if (s.people && s.people[id]) s.people[id].trust = Math.max(0, s.people[id].trust - 5); s._cnInviteWk = s.week; return "你找了个由头推了。人情是债，你还不想这么早背上。只是电话那头的沉默，让你心里有点过意不去。"; } }
    ]
  },
  // —— 主动邀请②：约你下棋叙旧 ——
  {
    id: "ev_cn_invite_chess", module: "relation", ambient: true, importance: "normal",
    cond: s => anyPersonAt(s, REVEAL.known, (def) => def.id.indexOf("chess") === 0) && (s.week - (s._cnChessWk || -99)) >= 7 && rnd(0.24),
    title: "♟️ 「老地方，杀一盘？」",
    text: s => { const def = anyPersonAt(s, REVEAL.known, d => d.id.indexOf("chess") === 0) || HIDDEN_NPCS[0]; s._cnChess = def.id; return `${personLabel(s, def.id)}又来约你：「老地方，杀一盘？」你知道，醉翁之意未必在棋。`; },
    choices: [
      { label: "欣然赴约，输赢随缘", effect: s => { const id = s._cnChess || "chess_exec"; meetPerson(s, id, 1, 8); s._cnChessWk = s.week; add(s, "stress", -6); add(s, "mood", 4); add(s, "network", 2); const lose = rnd(0.5); if (lose && rnd(0.3)) { if (s.people && s.people[id]) s.people[id].trust += 6; return "你这盘下得不算好，几次差点翻盘又收手。老爷子却来了兴致：「你小子是不是让着我？」——他误以为你在让棋，反倒高看了你一眼。输赢之外，人心才是真正的棋盘。"; } return "棋逢对手，杀得难解难分。一下午就在落子声里过去了，烦恼也被这方寸棋盘吸走大半。这样的交情，最是难得。"; } },
      { label: "最近太忙，改天吧", effect: s => { const id = s._cnChess || "chess_exec"; s._cnChessWk = s.week; if (s.people && s.people[id]) s.people[id].trust = Math.max(0, s.people[id].trust - 3); return "你婉拒了。忙是真忙，可挂了电话，你心里那点「以后再说」的亏欠，又添了一笔。"; } }
    ]
  },
  // —— 主动邀请③：给你递机会（推荐/拉投资）——
  {
    id: "ev_cn_invite_opportunity", module: "relation", ambient: true, importance: "turning",
    cond: s => anyPersonAt(s, REVEAL.trusted, (def, p) => def.boon && p.trust >= 62) && (s.week - (s._cnOppWk || -99)) >= 10 && rnd(0.24),
    title: "💡 「我给你引荐个人」",
    text: s => { const def = anyPersonAt(s, REVEAL.trusted, (d, p) => d.boon && p.trust >= 62) || HIDDEN_NPCS[0]; s._cnOpp = def.id; const what = def.boon === "investor" ? "「我儿子是做投资的，我跟他提过你，他想见见你。」" : def.boon === "exec" ? "「老伙计们攒了个局，传统厂子想找懂数字化的年轻人，我推了你。」" : def.boon === "fallen" ? "「我手上还有点供应链的旧关系，你要是想干点什么，咱俩搭伙。」" : "「有几个客户我介绍给你——当然，事成之后你懂规矩。」"; return `${personLabel(s, def.id)}压低声音，递来一个机会：${what}这扇门，是你这些年的真心换来的。`; },
    choices: [
      { label: "郑重接下这份人情", effect: s => { const id = s._cnOpp || "chess_exec"; const def = npcDef(id); meetPerson(s, id, 1, 8); s._cnOppWk = s.week; flag(s, "cn_boon_" + (def.boon || "x")); flag(s, "got_lead"); if (typeof addFounderPrep === "function") { if (def.boon === "exec") addFounderPrep(s, "industryInsight", 8); else if (def.boon === "fallen") { addFounderPrep(s, "salesChannel", 6); addFounderPrep(s, "teamTrust", 5); } else if (def.boon === "investor") addFounderPrep(s, "riskTolerance", 6); else if (def.boon === "clients") addFounderPrep(s, "salesChannel", 9); } if (typeof rememberFact === "function") rememberFact(s, { id: "boon_" + id, once: true, type: "opportunity", text: `${def.name}给你引荐了一条创业的门路（${def.hiddenRole}的分量）。${def.gray ? "只是这份人情，带着灰色的尾巴。" : ""}`, tags: ["opportunity", id, "founder_seed"], intensity: 4, actors: [id] }); return def.gray ? "你接了。客户是真客户，回扣也是真回扣。这条路能走，但鞋里进了沙——你得想清楚，自己愿意走多远。" : "你郑重道谢，接下了这份引荐。多年的棋局、饭局、真心，此刻终于结成了一颗果子。原来最好的人脉，从来不是攒来的，是处出来的。"; } },
      { label: "心领了，但这次先不碰", effect: s => { s._cnOppWk = s.week; return "你婉言谢绝。也许是时机未到，也许是你还没准备好接住这份分量。机会的门虚掩着，你选择先按兵不动。"; } }
    ]
  },
  // —— 创业期回响：娱乐里认识的贵人，真的帮上了忙（doc §6.6 验收：≥2 娱乐角色影响创业）——
  {
    id: "ev_cn_boon_payoff", module: "venture", ambient: true, importance: "turning",
    cond: s => (s.startup && !has(s, "startup_done")) && anyPersonAt(s, REVEAL.trusted, def => def.boon && def.boon !== "investor") && (s.week - (s._cnPayWk || -99)) >= 12 && rnd(0.3),
    title: "🤝 棋友送来的及时雨",
    text: s => { const def = anyPersonAt(s, REVEAL.trusted, d => d.boon && d.boon !== "investor") || HIDDEN_NPCS[0]; s._cnPay = def.id; const what = def.boon === "exec" ? "他把你引荐给了一家老厂的负责人——你的第一个像样的大客户" : def.boon === "fallen" ? "他动用残存的供应链人脉，帮你压下了一大笔成本" : "他介绍来了一批种子客户"; return `公司正难的时候，${personLabel(s, def.id)}出手了：${what}。当年棋摊上的萍水相逢，此刻成了雪中送炭。`; },
    choices: [
      { label: "感激不尽，全力接住", effect: s => { const id = s._cnPay || "chess_exec"; const def = npcDef(id); s._cnPayWk = s.week; const su = s.startup; if (su) { su.progress = (su.progress || 0) + 4; if (def.boon === "exec" || def.boon === "clients") flag(s, "su_revenue"); su.valuation = Math.round((su.progress || 1) * 1000 * (1 + (s.reputation || 0) / 100)); } add(s, "cash", Math.round(20000 * ((s.world && s.world.priceIndex) || 1))); add(s, "mood", 6); if (typeof addFounderPrep === "function") addFounderPrep(s, "salesChannel", 8); if (typeof rememberFact === "function") rememberFact(s, { id: "payoff_" + id, once: true, type: "favor", text: `创业最难时，${def.name}（${def.hiddenRole}）拉了你一把——人情债，你记一辈子。`, tags: ["venture", id], intensity: 4, actors: [id] }); return "你紧紧握住这根救命稻草，把每一个客户都伺候到位。公司缓过一口气来。你忽然懂了：商业的底层，从来都是人。"; } }
    ]
  }
);
