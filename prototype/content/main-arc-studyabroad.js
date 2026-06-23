"use strict";
/* =====================================================================
 * content/main-arc-studyabroad.js —— 留学生身份焦虑线
 * 主题：离开故乡以后，人到底属于哪里。
 * 社会摩擦：学历和身份是光环，也是焦虑。
 * 关键变量：签证、汇率、国际就业、反移民情绪、中介骗局。
 * ===================================================================== */
registerMainArc("study_drift", {
  name: "留学生身份焦虑线",
  theme: "离开故乡以后，人到底属于哪里。",
  friction: "学历和身份是光环，也是焦虑。",
  weight: 2,
  worldKeys: ["fx", "visa", "global", "education"],
  industries: ["education", "ai"],
  startCond: s => ["globe", "abroad", "acad", "laureate"].includes(s.goal) || has(s, "haigui_back") || has(s, "abroad_plan") || has(s, "emigrated"),
  initCast: s => {
    addCastMember(s, "agent", { name: "马姐", role: "留学中介", trust: 30, pressure: 20 });
    addCastMember(s, "peer", { name: "Kevin", role: "同胞室友", trust: 55, ambition: 60 });
    addCastMember(s, "prof", { name: "Dr. Hale", role: "导师", trust: 45 });
    addCastMember(s, "parent", { name: "母亲", role: "家里", trust: 70, pressure: 50 });
  },
  acts: [
    { evid: "marc_study_1", minAge: 18, title: "那封 offer 和那笔中介费" },
    { evid: "marc_study_2", minAge: 21, title: "落地异乡的第一夜" },
    { evid: "marc_study_3", minAge: 24, title: "签证、汇率与一纸身份" },
    { evid: "marc_study_4", minAge: 29, title: "留下，还是回去" },
    { evid: "marc_study_5", minAge: 37, title: "你到底属于哪里" }
  ],
  reckon: s => {
    const stayed = arcChose(s, "study_stay");
    const returned = arcChose(s, "study_return");
    if (stayed) return "你留在了异乡，拿到了身份，也活成了「哪里都不完全属于」的人。故乡成了一张机票的距离，乡音成了梦里的口音。光环戴稳了，焦虑也焊死了。";
    if (returned) return "你带着海归的标签回了国。它在某些桌子上是敲门砖，在另一些桌子上是「不接地气」的注脚。你花了很多年，才把别人眼里的光环，过成自己的日子。";
    return "那场漂流没走完，你在中途停了下来。是退却，也是清醒——不是所有人都需要用一张异国文凭，来证明自己值得被爱。";
  }
});

EVENTS.push(
  {
    id: "marc_study_1", module: "mainarc", importance: "arc", arc: "study_drift",
    title: "📖 第一幕 · 那封 offer 和那笔中介费",
    text: s => `邮箱里躺着一封 offer。${castName(s, "agent", "马姐")}在微信上催着交钱：「名额有限，名校就这两天。」家里${castName(s, "parent", "母亲")}已经在商量要不要卖掉那套老房子凑学费。`,
    choices: [
      { label: "倾家荡产也要去最好的学校", effect: s => { arcChoose(s, "study_topschool", { tension: 8, memory: { id: "study_betall", intensity: 60, text: "全家把家底押在了你这张文凭上。" } }); add(s, "cash", -Math.round(150000 * (s.world ? s.world.priceIndex : 1))); bumpThread(s, "family_expectation", 18, { actors: ["parent"] }); if (typeof addCredential === "function") addCredential(s, "overseas_degree"); return "你签了字。背后是全家的期望，沉得让你喘不过气——但你告诉自己，这是改命的机会。"; } },
      { label: "选个性价比高、能打工的学校", effect: s => { arcChoose(s, "study_pragmatic", { tension: 2 }); add(s, "cash", -Math.round(60000 * (s.world ? s.world.priceIndex : 1))); add(s, "insight", 2); if (typeof addCredential === "function") addCredential(s, "overseas_degree"); return "你没追名校光环，挑了个能边读边打工的地方。务实，不丢人。"; } },
      { label: "多留个心眼，查清这家中介", effect: s => { const scam = rnd(0.4); arcChoose(s, "study_careful", { tension: 1 }); add(s, "insight", 3); if (scam) { add(s, "mood", 4); return `你一查，${castName(s, "agent", "马姐")}的「名校直通」水分很大。你换了正规渠道——省下的不只是钱，是一个差点被坑掉的开局。`; } return "你仔细核了每一项费用和合同。中介有点不耐烦，但你心里踏实。"; } }
    ]
  },
  {
    id: "marc_study_2", module: "mainarc", importance: "arc", arc: "study_drift",
    title: "📖 第二幕 · 落地异乡的第一夜",
    text: s => `飞机落地，时差、口音、超市里看不懂的标签一起涌来。室友${castName(s, "peer", "Kevin")}比你早来半年，熟门熟路。第一夜，你躺在陌生的床上，听着窗外陌生的雨。`,
    choices: [
      { label: "逼自己冲进 local 圈子", effect: s => { arcChoose(s, "study_assimilate", { tension: 4 }); add(s, "charm", 2); add(s, "stress", 5); add(s, "insight", 2); return "你硬着头皮参加每一个 party，磕磕绊绊地讲着不熟练的语言。融入很难，但你不想只活在同胞的微信群里。"; } },
      { label: "抱团取暖，先和同胞站一起", effect: s => { bumpThread(s, "peer_bond", 12, { actors: ["peer"] }); arcChoose(s, "study_huddle", { tension: -2 }); add(s, "mood", 4); return `你和${castName(s, "peer", "Kevin")}他们组了饭搭子、租房群、互助网。乡音是异乡里最暖的东西，可有人说，这样永远学不好当地话。`; } },
      { label: "一头扎进学业，别的先不管", effect: s => { arcChoose(s, "study_grind", { tension: 3 }); add(s, "knowledge", 3); add(s, "stress", 4); return "你把孤独换成了 GPA。图书馆的闭馆音乐成了你最熟的旋律。至少成绩单不会骗你。"; } }
    ]
  },
  {
    id: "marc_study_3", module: "mainarc", importance: "turning", arc: "study_drift",
    title: "📖 第三幕 · 签证、汇率与一纸身份",
    text: s => { const fx = s.world && s.world.priceIndex > 1.5; return `毕业季撞上了坏消息：当地收紧了工签，反移民的声音越来越大；${fx ? "汇率还在涨，家里寄来的每一笔钱都缩水。" : "家里寄来的钱也快供不动了。"}${castName(s, "prof", "Dr. Hale")}愿意给你写推荐信，但留下的名额，僧多粥少。`; },
    choices: [
      { label: "拼尽全力抽工签、赌一个身份", effect: s => { const win = rnd(0.4 + (typeof statEdge === "function" ? statEdge(s, "knowledge") : 0)); arcChoose(s, "study_visa_gamble", { tension: 12, memory: { id: "study_visa", intensity: 65, text: "你把人生压在一张签证的抽签上。", tags: ["arc", "turning"] } }); add(s, "stress", 10); if (win) { flag(s, "work_visa"); if (typeof addPrivilege === "function") addPrivilege(s, "overseas_status"); return "中签了！你攥着那封信，在出租屋里哭了一场。身份的第一道门，开了一条缝。"; } add(s, "mood", -8); bumpThread(s, "identity_crisis", 20); return "没中。你站在毕业典礼的人群里，第一次清楚地意识到：这里不一定有你的位置。"; } },
      { label: "趁着海归光环还热，回国发展", effect: s => { arcChoose(s, "study_return", { tension: 6 }); flag(s, "haigui_back"); if (typeof addCredential === "function") addCredential(s, "overseas_degree"); add(s, "network", -8); s.timeline.push({ age: s.age, text: "你收拾行李回国了。海归的标签还热乎，你想趁它没凉透，换一张好牌。" }); return "你买了回国的机票。有人说你「没本事才回来」，也有人羡慕你「及时止损」。只有你自己知道是什么滋味。"; } },
      { label: "留下打黑工，先熬着等机会", effect: s => { arcChoose(s, "study_grind_stay", { tension: 10 }); if (typeof addStigma === "function") addStigma(s, "gray_suspect"); if (typeof addExperience === "function") addExperience(s, "service"); add(s, "cash", Math.round(40000 * (s.world ? s.world.priceIndex : 1))); add(s, "health", -4); bumpThread(s, "identity_crisis", 16); return "签证到期了，你没走。餐馆后厨、代购、零工……你在灰色地带里熬着，赌一个转正的明天。"; } }
    ]
  },
  {
    id: "marc_study_4", module: "mainarc", importance: "turning", arc: "study_drift",
    title: "📖 第四幕 · 留下，还是回去",
    text: s => `日子推着你走到了一个必须选边的路口。这里有你熟悉的生活和半张身份，那里有衰老的父母和回不去的童年。${castName(s, "parent", "母亲")}在电话那头欲言又止：「妈不拦你，可妈也老了。」`,
    choices: [
      { label: "扎根这里，把家也接过来", cond: s => has(s, "work_visa") || arcChose(s, "study_grind_stay"), effect: s => { arcChoose(s, "study_stay", { tension: -4, memory: { id: "study_rooted", intensity: 70, text: "你决定把异乡过成故乡。" } }); flag(s, "emigrated"); if (typeof addPrivilege === "function") addPrivilege(s, "overseas_status"); if (typeof addInfluence === "function") addInfluence(s, "circle", 5); add(s, "mood", 6); bumpThread(s, "identity_crisis", -8); return "你买了房，办了团聚签。机场接到父母那天，你忽然明白：根不在土里，在你愿意为谁停下来。"; } },
      { label: "回去陪父母，把根重新接上", effect: s => { arcChoose(s, "study_return", { tension: 4 }); flag(s, "haigui_back"); add(s, "mood", 5); bumpThread(s, "family_expectation", -10, { actors: ["parent"] }); if (typeof addInfluence === "function") addInfluence(s, "family", 8); s.timeline.push({ age: s.age, text: "你放下了那半张身份，回到了父母身边。有些东西，错过了就真的没了。" }); return "你回来了。同学聚会上有人替你可惜，可那天你陪母亲在菜市场慢慢走的样子，比任何 offer 都踏实。"; } },
      { label: "谁也不选,继续悬着", effect: s => { arcChoose(s, "study_limbo", { tension: 8 }); bumpThread(s, "identity_crisis", 12); add(s, "stress", 6); return "你把决定一推再推。两边的生活都还连着,两边也都不完整。悬着的人,最累。"; } }
    ]
  },
  {
    id: "marc_study_5", module: "mainarc", importance: "turning", arc: "study_drift",
    title: "📖 第五幕 · 你到底属于哪里",
    text: s => { const crisis = threadLevel(s, "identity_crisis"); return crisis > 40 ? `很多年过去,「你是哪里人」这个问题,你依然答不利索。乡音里混了口音,口音里又藏着乡音。但你慢慢学会了:身份不是一个标签,是你为之付出过的那些人和事。` : `这些年的漂流,终于沉淀成了你自己的答案。你不再急着证明属于哪里——你属于你走过的每一段路。`; },
    choices: [
      { label: "把经历变成桥,帮后来的人少走弯路", cond: s => (typeof influenceTier === "function" && influenceTier(s) >= 2), effect: s => { arcChoose(s, "study_bridge", { tension: -6, memory: { id: "study_legacy", intensity: 75, text: "你成了连接两岸的人。", tags: ["arc", "world"] } }); if (typeof addInfluence === "function") { addInfluence(s, "media", 8); addInfluence(s, "education", 6); } if (typeof addWorldImpact === "function") addWorldImpact(s, { industry: "education", field: "scamDensity", delta: -10, note: "你曝光留学黑中介，净化了行业" }); add(s, "reputation", 8); return "你做起了留学公益、曝光黑中介、给后来者引路。那笔当年差点被坑掉的中介费,如今救了很多人。"; } },
      { label: "安顿好自己的小日子,就够了", effect: s => { arcChoose(s, "study_settle", { tension: -8 }); add(s, "mood", 8); return "你不再追问归属。一处住得惯的房子,几个能说真话的朋友,一份养得活自己的活计——这就是你漂流多年换来的答案。"; } }
    ]
  }
);
