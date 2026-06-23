"use strict";
/* =====================================================================
 * content/social-actions.js —— 和「某个具体的人」面对面互动（v1.0）
 * 旧版社交圈只能「看」，看不能「做」。本模块给每个具名 NPC 加上一套可主动发起的互动：
 *   💬寒暄叙旧 / 🎁请客送礼 / 🧠请教取经 / 🤝求人办事 / 👥求引荐 / 💰开口借钱 / 🚀邀约合伙
 * 每个动作的结果由【交情 attitude × 亲密 tier × 性格 persona × 身份 role × 你当下的处境】共同决定，
 * 且尽量给「实际价值」：现金、商机线索(got_lead)、风口直觉(wind_hint)、副业苗头/合伙人、
 * 升职内推、技能成长、人脉扩张。求人办事会【消耗交情】，逼你平时多经营、关键时才动用。
 * 每周「走动」次数有限(socialWeekLeft)——人情得花在刀刃上。
 * 仅用全局 helper：add/flag/has/rnd/pick/personaBucket/genName。读写 s。
 * ===================================================================== */

// —— 每周「走动」预算（按 s.week 懒重置）——
function socialWeekLeft(s) {
  if (s._socWeek !== s.week) { s._socWeek = s.week; s._socUsed = 0; }
  var cap = 3 + (s.reputation >= 60 ? 1 : 0) + (s.network >= 80 ? 1 : 0); // 名气/人脉越广，愿意见你的人越多
  return Math.max(0, cap - (s._socUsed || 0));
}
function socialWeekCap(s) { return 3 + (s.reputation >= 60 ? 1 : 0) + (s.network >= 80 ? 1 : 0); }
function _socialSpend(s) {
  if (s._socWeek !== s.week) { s._socWeek = s.week; s._socUsed = 0; }
  s._socUsed = (s._socUsed || 0) + 1;
}

function _pb(n) { return (typeof personaBucket === "function" && n.persona) ? personaBucket(n.persona) : "plain"; }
function _pqname(n) { return (n.persona && n.persona.name) || ""; }
function _quirk(n) { return (n.persona && n.persona.quirk) ? "ta 嘬了口茶：" + n.persona.quirk + " " : ""; }
function _bump(n, d) { n.attitude = Math.max(0, Math.min(100, (n.attitude || 0) + d)); }

// 身份归类：求人办事时按身份给不同的好处
function _roleClass(n) {
  var r = n.role || "";
  if (/领导|老板|经理|主管|甲方/.test(r)) return "boss";
  if (/客户|同行|店主|饭局/.test(r)) return "biz";
  if (/爸妈|父母|兄弟|姐妹|亲/.test(r)) return "family";
  if (/同事|室友|同学|搭子|发小|挚友|球友|牌友|校友/.test(r)) return "peer";
  return "loose";
}

// —— 关系标签：按【重要性】给每个人一个一眼能认的身份标签，rank 越大越重要（也用于排序）——
// 合伙人 > 至亲 > 挚友 > 贵人 > 上司 > 好友 > 同侪 > 朋友 > 生意往来 > 熟人 > 点头之交
function relTag(s, n) {
  var att = n.attitude || 0, tier = n.tier || 3, role = n.role || "";
  var pb = _pb(n), pn = _pqname(n);
  if (n._cofounder || (s.startup && s.startup.cofounder && s.startup.cofounder.name === n.name))
    return { label: "合伙人", emoji: "🤝", rank: 100, cls: "partner" };
  if (n.kind === "亲情" || /爸妈|父母|兄弟|姐妹/.test(role))
    return { label: "至亲", emoji: "👪", rank: 92, cls: "kin" };
  if (tier === 1)
    return { label: "挚友", emoji: "💗", rank: 86, cls: "bff" };
  var influential = /领导|老板|经理|主管|客户|甲方/.test(role) || /八面玲珑|攀龙附凤/.test(pn);
  if (influential && att >= 70)
    return { label: "贵人", emoji: "⭐", rank: 78, cls: "vip" };
  if (/领导|老板|经理|主管/.test(role))
    return { label: "上司", emoji: "👔", rank: 68, cls: "boss" };
  if (tier === 2 && att >= 66)
    return { label: "好友", emoji: "🤜", rank: 60, cls: "good" };
  if (/同事|室友|同学|校友|搭子/.test(role))
    return { label: "同侪", emoji: "💼", rank: 52, cls: "peer" };
  if (tier === 2)
    return { label: "朋友", emoji: "🙂", rank: 46, cls: "friend" };
  if (/客户|同行|店主|甲方/.test(role))
    return { label: "生意往来", emoji: "💰", rank: 40, cls: "biz" };
  if (att >= 45)
    return { label: "熟人", emoji: "👋", rank: 28, cls: "acq" };
  return { label: "点头之交", emoji: "🌐", rank: 20, cls: "loose" };
}

// —— 列出当前能对 n 发起的互动（dis=灰掉但可见，why=原因）——
function npcActions(s, n) {
  var att = n.attitude || 0, tier = n.tier || 3, pb = _pb(n), rc = _roleClass(n);
  var acts = [];
  acts.push({ id: "chat", emoji: "💬", label: "寒暄叙旧", hint: "维系感情，偶尔能套出点风声" });
  var giftCost = Math.round((tier === 1 ? 200 : tier === 2 ? 600 : 1000) * (s.world && s.world.priceIndex ? s.world.priceIndex : 1));
  acts.push({ id: "gift", emoji: "🎁", label: "请客送礼", cost: giftCost, dis: s.cash < giftCost, why: "兜里这点钱，请不动", hint: "破财买脸熟，势利者尤吃这套" });
  if (pb === "aloof" || rc === "boss" || /老同学|挚友|室友|大学/.test(n.role || "") || att >= 50) {
    acts.push({ id: "advice", emoji: "🧠", label: "请教取经", hint: "取人之长，实打实涨本事" });
  }
  acts.push({ id: "favor", emoji: "🤝", label: "求人办事", need: 52, dis: att < 52, why: "交情不到，张不开嘴", hint: "动用人情换机会，会折交情" });
  if (tier <= 2 || pb === "fairweather" || /八面玲珑|热心八卦|攀龙附凤/.test(_pqname(n))) {
    acts.push({ id: "intro", emoji: "👥", label: "求引荐", need: 50, dis: att < 50, why: "还没熟到能托人牵线", hint: "扩人脉，常能添个新相识" });
  }
  acts.push({ id: "borrow", emoji: "💰", label: "开口借钱", need: 60, dis: att < 60, why: "这点交情，借钱张不了口", hint: "应急周转，但极耗交情" });
  if (has(s, "startup") && s.startup && !s.startup.cofounder && !has(s, "startup_done")) {
    acts.push({ id: "partner", emoji: "🚀", label: "邀 ta 合伙", need: 62, dis: att < 62, why: "合伙是过命的交情，还差得远", hint: "拉 ta 做联合创始人，加速项目" });
  } else if (has(s, "side_hot") && !has(s, "startup")) {
    acts.push({ id: "partner", emoji: "🚀", label: "约 ta 一起搞", need: 58, dis: att < 58, why: "还没铁到能搭伙", hint: "把副业拉成正经事业" });
  }
  return acts;
}

// —— 执行一个互动，返回 { msg, bad? }。会消耗 1 次「走动」——
function doNpcAction(s, n, id) {
  if (socialWeekLeft(s) <= 0) return { msg: "这周到处走动、攒了一堆饭局，人也得歇口气。下周再张罗吧。", bad: true };
  var act = null, list = npcActions(s, n);
  for (var i = 0; i < list.length; i++) if (list[i].id === id) act = list[i];
  if (!act) return { msg: "这事儿现在做不了。", bad: true };
  if (act.dis) return { msg: act.why + "。", bad: true };
  if (act.cost && s.cash < act.cost) return { msg: "钱不凑手，办不成。", bad: true };

  var pb = _pb(n), rc = _roleClass(n), att = n.attitude || 0, nm = n.name;
  _socialSpend(s);

  // —— 💬 寒暄叙旧 ——
  if (id === "chat") {
    var up = pb === "helper" ? 4 : pb === "aloof" ? 2 : pb === "fairweather" ? (s.reputation >= 45 ? 4 : 1) : 3;
    _bump(n, up); add(s, "mood", 1);
    var gossip = /热心八卦|八面玲珑/.test(_pqname(n));
    if (rnd(gossip ? 0.6 : 0.28)) {
      add(s, "insight", 1);
      if (rnd(gossip ? 0.5 : 0.3)) { flag(s, "wind_hint"); return { msg: _quirk(n) + "「诶你别外传啊——」" + nm + "压低声音透了点行业里的风声。你心里咯噔一下：风，好像要往那边吹了。" }; }
      return { msg: nm + "和你东拉西扯，言谈间漏出几条有用的小道消息。闲聊也能闲出门道。" };
    }
    return { msg: "你和" + nm + "唠了会儿家常，没什么正事，但交情就是这么一点点焐热的。（交情 +" + up + "）" };
  }

  // —— 🎁 请客送礼 ——
  if (id === "gift") {
    add(s, "cash", -act.cost);
    var g = pb === "calc" || pb === "fairweather" ? 11 : pb === "aloof" ? 3 : 7;
    _bump(n, g);
    if (pb === "aloof") return { msg: "你破费请了" + nm + "一顿。ta 客气地收下，却淡淡道：「下不为例啊。」清高的人，不大吃这一套。（交情 +" + g + "）" };
    if (pb === "calc" || pb === "fairweather") return { msg: _quirk(n) + nm + "眉开眼笑地把礼收下，话立马热络了三分：「你这朋友，够意思！」往后好说话多了。（交情 +" + g + "）" };
    return { msg: "一顿好酒好菜下肚，" + nm + "拍着你肩膀直说「够意思」。情分，是吃出来、处出来的。（交情 +" + g + "）" };
  }

  // —— 🧠 请教取经 ——
  if (id === "advice") {
    _bump(n, 2);
    var lessonKey, lessonTxt;
    if (rc === "boss" || /精于算计|心高气傲/.test(_pqname(n))) { lessonKey = "strategy"; lessonTxt = "几句点拨，把你心里那盘乱棋理出了条线"; }
    else if (rc === "biz") { lessonKey = "insight"; lessonTxt = "ta 把这行的门道掰开揉碎讲给你听"; }
    else if (/好为人师|与世无争/.test(_pqname(n))) { lessonKey = "knowledge"; lessonTxt = "ta 难得来了兴致，把压箱底的经验倾囊相授"; }
    else { lessonKey = pick(["knowledge", "strategy", "insight"]); lessonTxt = "一席话听下来，你竟有点茅塞顿开"; }
    var gain = att >= 65 ? 2 : 1;
    add(s, lessonKey, gain);
    var SN = { knowledge: "学识", strategy: "谋略", insight: "洞察" };
    return { msg: "你虚心向" + nm + "讨教。" + lessonTxt + "。（" + SN[lessonKey] + " +" + gain + "）" };
  }

  // —— 🤝 求人办事 ——
  if (id === "favor") {
    // 见风使舵：你得势才肯帮，落魄就打哈哈
    if (pb === "fairweather" && s.reputation < 40 && s.network < 45) {
      _bump(n, -3);
      return { msg: nm + "打着哈哈把话岔开：「这事儿……最近不好办，回头啊回头。」——见你眼下没什么份量，ta 缩了。", bad: true };
    }
    var fatigue = pb === "helper" ? 5 : pb === "calc" ? 11 : 8;
    _bump(n, -fatigue);
    add(s, "network", 2);
    // 精算型要回报
    if (pb === "calc" && rnd(0.7)) { var fee = Math.round(800 + Math.random() * 2200); if (s.cash >= fee) add(s, "cash", -fee); }
    var did;
    if (rc === "boss") {
      if (s.job) { s.job._raise = (s.job._raise || 0) + 0.06; if (typeof bumpMomentum === "function") bumpMomentum(s, 4); did = nm + "在上头替你美言了几句。「好好干，机会我记着。」——升职加薪的天平，悄悄往你这边偏了一点。"; }
      else { flag(s, "got_lead"); did = nm + "手一挥：「我们这儿正缺人，你简历发我。」——一条内推的门路，递到了你手上。"; }
    } else if (rc === "biz") {
      flag(s, "got_lead"); add(s, "network", 2);
      did = nm + "压低声音：「有个单子/资源，正好适合你，回头细聊。」——一条实打实的商机，搭上了。";
    } else if (rc === "family") {
      var help = Math.round(2000 + Math.random() * 5000); add(s, "cash", help); add(s, "mood", 2);
      did = nm + "二话不说塞给你 ¥" + help.toLocaleString() + "：「家里人，跟我客气啥。」鼻子有点酸。";
    } else if (rc === "peer") {
      if (rnd(0.5)) { flag(s, "got_lead"); did = nm + "给你引了条路子：「我认识个人，这事 ta 能办，我帮你问问。」"; }
      else { add(s, "insight", 1); add(s, "network", 3); did = nm + "掏心窝子帮你出主意、递人脉，临了还叮嘱了句注意事项。"; }
    } else {
      if (rnd(0.4)) { flag(s, "wind_hint"); did = nm + "顺嘴提了句行业近况，你听者有心——风向，似乎有了眉目。"; }
      else { add(s, "network", 3); did = nm + "勉为其难帮你递了句话，能不能成，看运气。"; }
    }
    return { msg: "你硬着头皮开了口。" + did + "（欠下一份人情，交情 -" + fatigue + "）" };
  }

  // —— 👥 求引荐 ——
  if (id === "intro") {
    _bump(n, -2);
    var glow = /八面玲珑|攀龙附凤|热心八卦/.test(_pqname(n)) || pb === "fairweather";
    add(s, "network", glow ? 8 : 5);
    var added = "";
    if (rnd(glow ? 0.75 : 0.45) && typeof n === "object") {
      var newNpc = _makeIntroNpc(s, n);
      if (newNpc) { s.social = s.social || []; s.social.push(newNpc); added = "——还当场把「" + newNpc.role + newNpc.name + "」介绍进了你的圈子。"; }
    }
    if (rnd(0.25)) flag(s, "got_lead");
    return { msg: nm + "热心地替你张罗，拉了个饭局/群聊，给你搭桥牵线" + (added || "，认识了几张新面孔") + "。（人脉 +" + (glow ? 8 : 5) + "）" };
  }

  // —— 💰 开口借钱 ——
  if (id === "borrow") {
    var willing = n.kind === "仗义" || n.kind === "亲情" || pb === "helper" || /仗义疏财/.test(_pqname(n));
    var stingy = n.kind === "势利" || pb === "calc" || /抠门|斤斤计较/.test(_pqname(n));
    if (stingy && !willing) {
      _bump(n, -6);
      return { msg: nm + "支支吾吾地哭起穷来：「我最近也紧巴……」一分没借出来，这交情倒是先凉了一截。", bad: true };
    }
    var base = n.tier === 1 ? 30000 : n.tier === 2 ? 12000 : 4000;
    if (rc === "boss" || rc === "biz" || pb === "calc") base *= 1.4;
    var scale = 0.4 + 0.6 * Math.max(0, (att - 50) / 50);
    var amt = Math.round(base * scale * (0.8 + Math.random() * 0.4));
    add(s, "cash", amt);
    var cost = willing ? 12 : 18;
    _bump(n, -cost);
    flag(s, "owe_money");
    if (willing) return { msg: nm + "眼都没眨就给你转了 ¥" + amt.toLocaleString() + "：「先应急，啥时候宽裕啥时候还。」这份情，比钱重。（交情 -" + cost + "）" };
    return { msg: nm + "犹豫再三，借了你 ¥" + amt.toLocaleString() + "，还半开玩笑地提了句利息。钱到账了，但你俩之间，多了点说不清的东西。（交情 -" + cost + "）" };
  }

  // —— 🚀 邀约合伙 ——
  if (id === "partner") {
    // 与世无争 / 谨小慎微 多半婉拒
    if (/与世无争|谨小慎微/.test(_pqname(n)) && rnd(0.7)) {
      _bump(n, -4);
      return { msg: nm + "摆摆手：「我这人没那么大野心，搅不动这趟浑水，帮你参谋参谋还行。」婉拒了。", bad: true };
    }
    if (has(s, "startup") && s.startup && !s.startup.cofounder) {
      var capable = /争强好胜|精于算计|八面玲珑|心高气傲/.test(_pqname(n)) || rc === "peer" || rc === "biz";
      var skill = Math.round(42 + (att - 60) * 0.5 + (capable ? 14 : 0));
      skill = Math.max(38, Math.min(82, skill));
      s.startup.cofounder = { name: nm, skill: skill, role: n.role };
      n._cofounder = true;
      s.startup.progress = (s.startup.progress || 0) + 4;
      add(s, "stress", -4); _bump(n, -8);
      if (typeof bumpMomentum === "function") bumpMomentum(s, 3);
      return { msg: nm + "握住你的手：「干了！这条船，我跟你一起划。」——你有了联合创始人（能力 " + skill + "/100），项目推进从此有人分担。（交情 -8）" };
    }
    // 副业拉伙
    flag(s, "got_lead"); _bump(n, -5); add(s, "network", 3);
    if (!has(s, "side_hot")) flag(s, "side_hot");
    return { msg: nm + "被你说动了：「行，先小打小闹试试水，成了再说大的。」——你那点副业，似乎有了搭伙做大的苗头。（交情 -5）" };
  }

  return { msg: "（没有任何反应）", bad: true };
}

// 引荐时凭空给社交圈添一个新相识（轻量构造，复用全局 genName/makePersona）
function _makeIntroNpc(s, via) {
  var role = pick(["朋友的朋友", "新结识的", "饭局新相识", "引荐人", "圈里新人"]);
  var nm = (typeof genName === "function") ? genName("cn") : pick(["小赵", "阿杰", "林姐", "老郑", "Mia"]);
  var persona = (typeof makePersona === "function") ? makePersona() : null;
  var kind = pick(["普通", "普通", "势利", "仗义", "清高"]);
  return {
    name: nm, role: role, kind: kind, tier: 3,
    attitude: 44 + Math.floor(Math.random() * 12),
    persona: persona,
    homeCity: (via && via.homeCity) || (s.city && s.city.name) || "同城",
    residence: "同城", meetable: true, _intro: true
  };
}

if (typeof window !== "undefined") {
  window.SOCIAL_ACTIONS_READY = true;
  // —— 自注入样式：互动相关类名收敛在本文件，避免与 style.css 的并发改动冲突 ——
  var _SA_CSS = ""
    + ".npc{cursor:pointer;transition:border-color .15s,box-shadow .15s}"
    + ".npc:hover{border-color:var(--amber)}"
    + ".npc.sel{border-color:var(--amber);box-shadow:0 0 0 1px var(--amber) inset}"
    + ".npc-tap{font-size:11px;color:var(--dim);margin-top:7px;opacity:.85}"
    + ".npc-panel{margin-top:10px;border-top:1px dashed var(--line);padding-top:10px}"
    + ".npc-panel-h{font-size:12px;color:var(--amber2);margin-bottom:8px}"
    + ".npc-panel-h b{color:var(--amber)}"
    + ".npc-result{font-size:13px;line-height:1.65;background:rgba(240,167,60,.08);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:8px;padding:8px 11px;margin-bottom:9px;color:var(--txt)}"
    + ".npc-result.bad{border-left-color:var(--red);background:rgba(255,107,107,.07)}"
    + ".npc-actbtns{display:flex;flex-wrap:wrap;gap:7px}"
    + ".npc-act-btn{cursor:pointer;background:var(--panel2);border:1px solid var(--line);color:var(--txt);border-radius:9px;padding:7px 11px;font-size:13px;font-family:inherit;text-align:left;line-height:1.2;transition:border-color .15s,transform .1s}"
    + ".npc-act-btn:hover{border-color:var(--amber);transform:translateY(-1px)}"
    + ".npc-act-btn small{color:var(--amber);font-size:11px}"
    + ".npc-act-btn.off{opacity:.42;cursor:not-allowed}"
    + ".npc-act-btn.off:hover{border-color:var(--line);transform:none}"
    + ".na-hint{display:block;font-size:10px;color:var(--dim);margin-top:3px;font-weight:400}"
    + ".rel-tag{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;padding:1px 8px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);color:var(--txt);white-space:nowrap}"
    + ".rel-tag.partner{color:#3a2400;background:linear-gradient(180deg,var(--amber2),var(--amber));border-color:transparent}"
    + ".rel-tag.kin{color:#ff9ec4;border-color:rgba(255,126,176,.5);background:rgba(255,126,176,.12)}"
    + ".rel-tag.bff{color:#ff9ec4;border-color:rgba(255,126,176,.45);background:rgba(255,126,176,.1)}"
    + ".rel-tag.vip{color:var(--amber2);border-color:rgba(240,167,60,.6);background:rgba(240,167,60,.14)}"
    + ".rel-tag.boss{color:#cbb2ff;border-color:rgba(169,139,255,.5);background:rgba(169,139,255,.12)}"
    + ".rel-tag.good{color:#86efac;border-color:rgba(95,211,139,.5);background:rgba(95,211,139,.12)}"
    + ".rel-tag.peer{color:#93c5fd;border-color:rgba(91,140,255,.45);background:rgba(91,140,255,.1)}"
    + ".rel-tag.friend{color:#9fe1c0;border-color:rgba(95,211,139,.35);background:rgba(95,211,139,.08)}"
    + ".rel-tag.biz{color:var(--amber2);border-color:rgba(240,167,60,.4);background:rgba(240,167,60,.08)}"
    + ".rel-tag.acq{color:var(--dim)}"
    + ".rel-tag.loose{color:var(--dim);opacity:.85}"
    + ".npc-top{flex-wrap:wrap;gap:4px 8px}";
  try {
    var _st = document.createElement("style");
    _st.id = "social-actions-css";
    _st.textContent = _SA_CSS;
    (document.head || document.documentElement).appendChild(_st);
  } catch (e) { /* 非浏览器环境忽略 */ }
}
