"use strict";
/* =====================================================================
 * content/main-arc-coastal.js —— 沿海外贸家族线
 * 主题：家族资源既是机会，也是枷锁。
 * 社会摩擦：家族资源是捷径，也是债务。
 * 关键变量：战争、汇率、航运、关税、跨境平台政策。
 * ===================================================================== */
function _coastalBirth(s) {
  const p = (s.birthplace && s.birthplace.path) || "";
  return /广东|福建|浙江|江苏|上海|山东|沿海|温州|泉州|宁波|义乌|汕头|青岛|深圳|厦门/.test(p);
}
registerMainArc("coastal_trade", {
  name: "沿海外贸家族线",
  theme: "一家人的命运,绑在了世界贸易这条船上。",
  friction: "家族资源是捷径,也是债务。",
  weight: 3,   // 出身命中时最优先(最具体)
  worldKeys: ["shipping", "fx", "war", "platform_policy", "cross_border"],
  industries: ["cross_border", "manufacturing"],
  startCond: s => ["tycoon", "shore", "boss", "million"].includes(s.goal) || has(s, "origin_coastal") || has(s, "origin_trade") || has(s, "family_trade") || has(s, "region_coastal") || _coastalBirth(s),
  initCast: s => {
    addCastMember(s, "father", { name: "陈建国", role: "父亲", cityId: "cn_gz", industry: "manufacturing", trust: 60, pressure: 55 });
    addCastMember(s, "uncle", { name: "陈建军", role: "叔叔", industry: "cross_border", trust: 40, pressure: 45 });
    addCastMember(s, "freight", { name: "阿强", role: "货代", industry: "cross_border", trust: 45 });
    addCastMember(s, "client", { name: "Mr. Brown", role: "海外客户", industry: "cross_border", trust: 35 });
  },
  acts: [
    { evid: "marc_coastal_1", minAge: 16, title: "家里那批货款" },
    { evid: "marc_coastal_2", minAge: 22, title: "离岸的船" },
    { evid: "marc_coastal_3", minAge: 30, title: "货柜停在海上" },
    { evid: "marc_coastal_4", minAge: 38, title: "家族账本" },
    { evid: "marc_coastal_5", minAge: 48, title: "你改变了这片港口" }
  ],
  reckon: s => {
    const inherited = arcChose(s, "coastal_inherit");
    const left = arcChose(s, "coastal_leave");
    const saved = arcChose(s, "coastal_save_family");
    if (saved) return "你扛下了家族那本糊涂账,把工厂从悬崖边拉了回来。父亲老了,叔叔走了,港口的风还在吹。你成了那个被命运绑在船上、却也学会了掌舵的人。";
    if (inherited) return "你接过了家业,也接过了它的债与旧规矩。有过风光,也有过差点翻船的夜晚。家族这条船沉沉浮浮,载着你,也压着你。";
    if (left) return "你最终没有接班,挣脱了那条捆了三代人的缆绳。父亲嘴上失望,心里未必。逃离也是一种孝顺——你只是想活成自己,而不是家谱里的下一行。";
    return "外贸的潮起潮落,家族的恩怨债务,你都只是远远看着。这片港口的故事里,你选择了做一个过客。";
  }
});

EVENTS.push(
  {
    id: "marc_coastal_1", module: "mainarc", importance: "arc", arc: "coastal_trade",
    title: "📖 第一幕 · 家里那批货款",
    text: s => `你很小就知道,家里的钱是从海那头一笔笔汇回来的。这年,${castName(s, "father", "陈建国")}的工厂被海外客户拖了一大笔货款,饭桌上的气压低到能拧出水。${castName(s, "uncle", "陈建军")}叔叔劝父亲「再赊一批料赌一把」。`,
    choices: [
      { label: "懂事地说:我以后接家里的厂", effect: s => { arcChoose(s, "coastal_promise", { tension: 8, memory: { id: "coastal_vow", intensity: 55, text: "你很小就把家族的担子认下了。" } }); bumpThread(s, "family_business", 18, { actors: ["father"] }); add(s, "mood", 3); return "父亲愣了一下,别过脸去。那句承诺像一根缆绳,从此把你和这片港口拴在了一起。"; } },
      { label: "暗暗发誓:我才不要被这破厂困住", effect: s => { arcChoose(s, "coastal_resent", { tension: 6, memory: { id: "coastal_escape_seed", intensity: 50, text: "货款的阴影,在你心里种下了逃离的念头。" } }); add(s, "insight", 2); return "你看着父亲为钱发愁的样子,心里只有一个念头:长大了,一定要离这片让人喘不过气的海远远的。"; } },
      { label: "缠着货代问东问西", effect: s => { arcChoose(s, "coastal_learn", { tension: 2 }); add(s, "knowledge", 2); add(s, "insight", 2); bumpThread(s, "freight_tie", 8, { actors: ["freight"] }); return `你蹲在仓库门口,听${castName(s, "freight", "阿强")}讲报关、汇率、哪个国家的客户最爱赖账。这些江湖学问,书本里没有。`; } }
    ]
  },
  {
    id: "marc_coastal_2", module: "mainarc", importance: "turning", arc: "coastal_trade",
    title: "📖 第二幕 · 离岸的船",
    text: s => `你长大了,站在了人生的岔口:是回家接过${castName(s, "father", "陈建国")}的厂,还是登上那条「离岸的船」,去外面闯一闯?父亲没明说,但他看你的眼神里全是期待。`,
    choices: [
      { label: "回家接班,把厂扛起来", effect: s => { arcChoose(s, "coastal_inherit", { tension: 10, memory: { id: "coastal_takeover", intensity: 70, text: "你接过了家族工厂的钥匙。", tags: ["arc", "turning"] } }); flag(s, "family_trade"); flag(s, "startup_exp"); if (typeof addExperience === "function") { addExperience(s, "founder"); addExperience(s, "cross_border"); } if (typeof addPrivilege === "function") addPrivilege(s, "family_business"); add(s, "cash", Math.round(80000 * (s.world ? s.world.priceIndex : 1))); bumpThread(s, "family_business", 15); s.timeline.push({ age: s.age, text: "你回到了家乡,从父亲手里接过了工厂。资源是现成的,债和旧规矩也是。" }); return "你回来了。父亲拍着你的肩,什么也没说。机器轰鸣依旧,只是掌舵的人,换成了你。"; } },
      { label: "登船远行,先证明自己", effect: s => { arcChoose(s, "coastal_leave", { tension: 8 }); add(s, "network", -6); add(s, "insight", 3); bumpThread(s, "family_business", -8, { actors: ["father"] }); add(s, "mood", 4); s.timeline.push({ age: s.age, text: "你没有接班,而是去了外面闯。父亲的失望和你的倔强,隔着一整片海。" }); return "你拖着行李离开了港口。身后是父亲沉默的背影,身前是没人兜底的世界。你想活成自己,哪怕摔得很惨。"; } },
      { label: "脚踏两条船:外面干、家里也帮", effect: s => { arcChoose(s, "coastal_both", { tension: 6 }); add(s, "stress", 5); bumpThread(s, "family_business", 6); if (typeof addExperience === "function") addExperience(s, "cross_border"); return "你想两全:在外面打拼,又时不时回来给家里搭把手。鱼和熊掌,你都想要——代价是哪样都做不到极致。"; } }
    ]
  },
  {
    id: "marc_coastal_3", module: "mainarc", importance: "turning", arc: "coastal_trade",
    title: "📖 第三幕 · 货柜停在海上",
    cond: s => arcChose(s, "coastal_inherit") || arcChose(s, "coastal_both") || arcChose(s, "coastal_leave"),
    text: s => { const risk = (typeof industryState === "function" && industryState(s, "cross_border")) || {}; const war = risk.supplyRisk > 50; return `世界出事了。${war ? "局部冲突推高了航运险,运费翻倍," : "一场风波让航运骤然紧张,"}汇率剧烈波动,你的一整批货柜停在了海上,客户${castName(s, "client", "Mr. Brown")}却在压价。这一关,可能要命。`; },
    choices: [
      { label: "抵押一切,硬扛过这道坎", effect: s => { arcChoose(s, "coastal_allin3", { tension: 14, memory: { id: "coastal_storm", intensity: 70, text: "你押上全部身家,硬扛航运危机。", tags: ["arc", "turning"] } }); add(s, "cash", -Math.round((s.cash || 0) * 0.5)); flag(s, "has_loan"); add(s, "stress", 12); const win = rnd(0.45 + (typeof luckBias === "function" ? luckBias(s) : 0)); if (win) { const got = (typeof bigWindfall === "function") ? bigWindfall(s, 500000) : 1500000; add(s, "cash", got); delete s.flags.has_loan; if (typeof addInfluence === "function") addInfluence(s, "industry", 6); return `潮水退去,你还站着。积压的货高价出手,回款 ¥${got.toLocaleString()}。这一仗,你在圈子里有了名号。`; } if (typeof addStigma === "function") addStigma(s, "bad_credit"); bumpThread(s, "family_debt", 25, { status: "open" }); add(s, "mood", -10); return "船没等到好天气。货砸在手里,贷款压顶,家里第一次出现了「债」这个字。"; } },
      { label: "壮士断腕,低价清货保现金流", effect: s => { arcChoose(s, "coastal_cutloss", { tension: 6 }); add(s, "cash", Math.round((s.cash || 0) * 0.2)); add(s, "insight", 2); add(s, "reputation", -2); return "你含泪把货低价清了。亏是亏了,但现金流断不了——做外贸的都懂,活着比面子重要。"; } },
      { label: "找货代走偏门,赌一把", cond: s => threadLevel(s, "freight_tie") > 0 || arcChose(s, "coastal_learn"), effect: s => { const f = castName(s, "freight", "阿强"); arcChoose(s, "coastal_grayship", { tension: 12 }); if (rnd(0.5)) { add(s, "cash", Math.round(300000 * (s.world ? s.world.priceIndex : 1))); if (typeof addStigma === "function") addStigma(s, "gray_suspect"); return `${f}帮你走了条「灰色」通道,货出去了,钱也回来了。只是从此,有些把柄攥在了别人手里。`; } if (typeof addStigma === "function") addStigma(s, "lawsuit"); bumpThread(s, "family_debt", 18); return `偏门翻了车。货被扣,还惹上了麻烦。${f}也躲着不接电话了。`; } }
    ]
  },
  {
    id: "marc_coastal_4", module: "mainarc", importance: "turning", arc: "coastal_trade",
    title: "📖 第四幕 · 家族账本",
    cond: s => arcChose(s, "coastal_inherit") || arcChose(s, "coastal_both"),
    text: s => `你终于翻开了家族那本糊涂账。${castName(s, "uncle", "陈建军")}叔叔这些年的账目对不上,有一大笔钱不知去向。父亲${castName(s, "father", "陈建国")}念着兄弟情,只想「家丑不外扬」。账本摊在桌上,亲情和钱,第一次面对面。`,
    choices: [
      { label: "认账止损,把家族从泥潭里拉出来", effect: s => { arcChoose(s, "coastal_save_family", { tension: -6, memory: { id: "coastal_reckoning", intensity: 75, text: "你扛下了家族的烂账,守住了厂。", tags: ["arc"] } }); add(s, "cash", -Math.round((s.cash || 0) * 0.3)); if (typeof addInfluence === "function") addInfluence(s, "family", 12); add(s, "reputation", 5); bumpThread(s, "family_debt", -20); bumpThread(s, "uncle_rift", 15, { actors: ["uncle"] }); return "你替叔叔填了窟窿,也跟他翻了脸。父亲叹气,母亲抹泪。家保住了,但那张饭桌,从此少了一个人。"; } },
      { label: "撕破脸,清算到底", effect: s => { arcChoose(s, "coastal_clean_house", { tension: 14, memory: { id: "coastal_purge", intensity: 70, text: "你掀了家族的桌子,清算到底。" } }); bumpThread(s, "uncle_rift", 30, { actors: ["uncle"], status: "war" }); if (typeof addInfluence === "function") addInfluence(s, "industry", 5); add(s, "reputation", 3); add(s, "mood", -6); return "你把账查到了底,叔叔净身出户。厂干净了,可父亲再没正眼看过你——他说你「六亲不认」。"; } },
      { label: "装糊涂,维持表面的太平", effect: s => { arcChoose(s, "coastal_cover", { tension: 8 }); bumpThread(s, "family_debt", 12); add(s, "mood", 2); return "你合上了账本,假装什么都没看见。家还是那个家,只是那个窟窿,迟早有一天会塌。"; } }
    ]
  },
  {
    id: "marc_coastal_5", module: "mainarc", importance: "turning", arc: "coastal_trade",
    title: "📖 第五幕 · 你改变了这片港口",
    cond: s => arcChose(s, "coastal_inherit") || arcChose(s, "coastal_both"),
    text: s => `几十年过去,你从那个蹲在仓库门口的孩子,成了这片港口绕不开的名字。${castName(s, "father", "陈建国")}的厂在你手里或大或小,但贸易的风,你早已读得懂。`,
    choices: [
      { label: "(影响力够)牵头建产业带,带活一方", cond: s => (typeof influenceTier === "function" && influenceTier(s) >= 3), effect: s => { arcChoose(s, "coastal_industrybelt", { tension: -8, memory: { id: "coastal_legacy", intensity: 85, text: "你把一个家族的生意,做成了一方港口的产业。", tags: ["arc", "world"] } }); if (typeof addInfluence === "function") { addInfluence(s, "city", 12); addInfluence(s, "industry", 12); } if (typeof addWorldImpact === "function") { addWorldImpact(s, { industry: "cross_border", field: "heat", delta: 14, note: "你牵头的产业带带火了本地跨境贸易" }); addWorldImpact(s, { industry: "manufacturing", field: "supplyRisk", delta: -10, note: "你整合的供应链更稳了" }); } const got = (typeof bigWindfall === "function") ? bigWindfall(s, 3000000) : 9000000; add(s, "cash", got); add(s, "reputation", 10); s.timeline.push({ age: s.age, text: `你牵头建起了产业带,带活了一整片港口的就业。身价 ¥${got.toLocaleString()},名字被刻进了本地商会的墙上。` }); return "你把当年那个差点翻船的家族小厂,做成了带动一方的产业带。港口因你而不同——可树大招风,盯着你这块肉的人,也多了。"; } },
      { label: "守成传家,把船稳稳交给下一代", effect: s => { arcChoose(s, "coastal_handover", { tension: -10 }); if (typeof addInfluence === "function") addInfluence(s, "family", 8); add(s, "mood", 8); const got = (typeof bigWindfall === "function") ? bigWindfall(s, 800000) : 2000000; add(s, "cash", got); s.timeline.push({ age: s.age, text: `你没有去赌更大的盘子,而是把厂稳稳地经营好,留给下一代。家底 ¥${got.toLocaleString()},算不上惊天动地,却踏实。` }); return "你选择了守成。这片港口的潮水还会起落,但你这条船,总算稳稳地传了下去。"; } }
    ]
  }
);
