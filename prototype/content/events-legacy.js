"use strict";
/* =====================================================================
 * content/events-legacy.js —— 前代公司的余荫与余债（升级·四期）
 * applyLegacy 把上一世的公司写进 s._companyLegacy + flag(legacy_company_listed/failed)。
 * 这里据此在新人生早年触发开局事件：上市→有资源也有公众压力；暴雷→有债也有污点。
 * 让"世界活着"跨局延续：你这一代，要替上一代的选择买单或受益。
 * ===================================================================== */
function _legacyCo(s) { return s._companyLegacy || null; }
function _coName(s) { const c = _legacyCo(s); return (c && c.name) || "家族企业"; }
function _coIndName(s) { const c = _legacyCo(s); const ind = c && c.industry; const m = (typeof INDUSTRIES !== "undefined" && ind && INDUSTRIES[ind]) ? INDUSTRIES[ind].name : null; return m || (ind || "那个行业"); }

function _woundText(s) { const w = s._familyWounds; return (w && w.length) ? w.map(function (x) { return x.label; }).join("、") : "上一代留下的心结"; }

EVENTS.push(
  {
    id: "ev_legacy_wound", module: "family", ambient: true, once: true, importance: "turning",
    cond: s => has(s, "has_family_wound") && s.age <= 24,
    title: "🩹 上一代留下的心结",
    text: s => `你比同龄人更早地懂了一些事——因为你是在「${_woundText(s)}」里长大的。那些没说出口的伤，像底色一样，悄悄染进了你看世界的方式。`,
    choices: [
      { label: "直面它，绝不让悲剧重演", effect: s => { add(s, "mind", 3); add(s, "insight", 2); if (s.threads) { for (const k in s.threads) { if (s.threads[k] && s.threads[k].inherited) s.threads[k].level = Math.max(0, s.threads[k].level - 20); } } if (typeof addMemory === "function") addMemory(s, { id: "wound_faced", intensity: 60, text: "你把上一代的伤，活成了自己的清醒。", tags: ["self"] }); return "你把那些创伤翻出来，一件件看清楚。你告诉自己：这些坑，上一代踩过了，到你这儿，绕开。带着伤长大的人，往往最懂得护着别人不受同样的伤。"; } },
      { label: "认了，它就是我的一部分", effect: s => { add(s, "insight", 3); add(s, "mood", -3); if (typeof addStigma === "function" && Math.random() < 0.4) addStigma(s, "family_debt"); return "你没去对抗，也没去美化。这就是你的来处——带着它，往前走。有些阴影甩不掉，但你可以选择不被它定义。"; } }
    ]
  },
  {
    id: "ev_legacy_listed", module: "family", ambient: true, once: true, importance: "turning",
    cond: s => has(s, "legacy_company_listed") && s.age <= 26,
    title: "🏛️ 上一代留下的那家上市公司",
    text: s => `你从小活在「${_coName(s)}」少东家的光环里。父辈把一家「${_coIndName(s)}」公司做上了市，给你留下了资源、人脉，也留下了一句句「不过是投了个好胎」的议论。董事会请你这个继承人「回来看看」。`,
    choices: [
      { label: "进董事会历练，借势更上一层", effect: s => { if (typeof addPrivilege === "function") addPrivilege(s, "family_business"); if (typeof addInfluence === "function") { addInfluence(s, "capital", 8); addInfluence(s, "circle", 6); } add(s, "network", 12); add(s, "reputation", 4); flag(s, "heir_active"); s.timeline.push({ age: s.age, text: `你接过了「${_coName(s)}」的部分股权与一个董事席位。起点比同龄人高得多，但所有人都在等着看你是不是个废物。` }); return `你坐进了那间挂着父辈照片的会议室。资源是真的，压力也是真的——从今往后，你做成什么都会被说「靠家里」，做砸什么都会被说「果然不行」。`; } },
      { label: "撇清关系，偏要白手起家证明自己", effect: s => { if (typeof addStigma === "function") {} add(s, "strategy", 3); add(s, "insight", 2); flag(s, "heir_defiant"); if (typeof addInfluence === "function") addInfluence(s, "circle", -4); return `你把股权委托给了职业经理人，自己拎包出了门。父辈不解，外人嘲讽。但你想要的，是一份没人能说「靠家里」的人生——哪怕从头再难。`; } },
      { label: "套现股份，落袋为安去享受人生", effect: s => { const got = (typeof bigWindfall === "function") ? bigWindfall(s, 1500000) : 4000000; add(s, "cash", got); add(s, "mood", 10); if (typeof addScar === "function") {} flag(s, "heir_cashout"); s.timeline.push({ age: s.age, text: `你套现了「${_coName(s)}」的股份，进账 ¥${got.toLocaleString()}。年纪轻轻财务自由，至于这家公司将来如何，与你无关了。` }); return `你签字、套现、转身。账户里多了 ¥${got.toLocaleString()}，世界很大，你想先去看看。至于「废物」还是「聪明」，让别人去吵吧。`; } }
    ]
  },
  {
    id: "ev_legacy_failed", module: "family", ambient: true, once: true, importance: "turning",
    cond: s => has(s, "legacy_company_failed") && s.age <= 26,
    title: "📉 上一代暴雷公司的尾巴",
    text: s => `「${_coName(s)}」这个名字，在你家是禁忌。父辈那家「${_coIndName(s)}」公司轰然倒下，留下债务、官司和街坊邻里的指指点点。讨债的电话，有时还会打到你这里。`,
    choices: [
      { label: "扛起来，替父还债、重建名声", effect: s => { add(s, "cash", -Math.round(80000 * (s.world ? s.world.priceIndex : 1))); add(s, "stress", 10); add(s, "reputation", 6); add(s, "mind", 2); if (typeof addExperience === "function") addExperience(s, "founder"); flag(s, "debt_avenger"); s.timeline.push({ age: s.age, text: `你没有逃。你开始一笔笔还父辈欠下的债，把「${_coName(s)}」这个名字，从骂声里一点点捞回来。` }); return `你扛下了这副不属于你的担子。债很重，路很长，但每还掉一笔，你在人前就能多挺直一寸腰板。这是你给这个姓氏的交代。`; } },
      { label: "改名换姓，彻底切割重新开始", effect: s => { if (typeof addStigma === "function") addStigma(s, "family_debt"); add(s, "network", -10); add(s, "insight", 3); flag(s, "cut_family_ties"); return `你做了法律上的切割，搬到没人认识的城市，连姓氏都很少再提。干净是干净了，可深夜里，那家公司倒下的声音，偶尔还在梦里响。`; } },
      { label: "看透了：再不碰这行，闷声攒安稳", effect: s => { add(s, "mood", 4); add(s, "insight", 2); add(s, "mind", 2); flag(s, "scarred_cautious"); if (typeof addScar === "function") addScar(s, "bankrupt"); return `父辈的教训刻进了你骨头里。你这辈子离「${_coIndName(s)}」远远的，不赌、不扩张、不画饼——别人笑你没出息，你只想要一份塌不了的安稳。`; } }
    ]
  }
);
