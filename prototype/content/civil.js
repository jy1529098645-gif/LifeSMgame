"use strict";
/* =====================================================================
 * content/civil.js —— 体制内 / 中国商政特色（v0.8）
 * 让「考公」这条路更有可玩性：千军万马考上岸 → 在编制内沿着
 *   科员→副科→正科→副处→正处→副厅 的阶梯往上爬。
 * 晋升不只看能力，更看【关系(network)·站队(运势)·政绩(谋略/学识)·资历(年龄)】——
 * 还原中国商政的真实质感：关系、站队、接待文化、招商引资、政商旋转门、反腐落马、退居二线。
 * s.civilRank：0=未上岸；1 科员 … 6 副厅级。
 * ===================================================================== */
const RANK_NAMES = ["白身", "科员", "副科级", "正科级", "副处级", "正处级", "副厅级"];
function rankName(s) { return RANK_NAMES[s.civilRank || 0] || "白身"; }
function rankUp(s) { s.civilRank = Math.min(6, (s.civilRank || 0) + 1); bumpMomentum(s, 5); }

/* —— 考公：备考 → 笔试面试 → 上岸/落榜（可反复再战）—— */
EVENTS.push({
  id: "ev_civil_exam", module: "civil", ambient: true,
  cond: (s) => !has(s, "civil_servant") && s.age >= 22 && s.age <= 36 && (s.stageId === "youth" || s.stageId === "hustle"),
  title: "📕 要不要考公上岸",
  text: (s) => `又是一年国考季，「宇宙的尽头是编制」的说法甚嚣尘上。今年招录${s.world && s.world.jobMarket < 45 ? "缩了水，报录比却卷上了天" : "还算正常，可独木桥上照样千军万马"}。你要试试吗？`,
  choices: [
    { label: "脱产苦读，全力备考", next: (s) => civilExamNode(s, 0.18) },
    { label: "边上班边裸考，随缘", next: (s) => civilExamNode(s, -0.12) },
    { label: "体制不适合我，算了", effect: (s) => { add(s, "insight", 2); return "你合上了厚厚的行测资料。有人挤破头想进的围城，你转身走开了。"; } }
  ]
});
function civilExamNode(s, prep) {
  // 上岸概率：学识/谋略 + 备考投入 + 运势 − 报录比（景气差时更卷）
  let p = 0.12 + (s.stats.knowledge + s.stats.strategy) / 360 + prep + luckBias(s);
  if (s.world && s.world.jobMarket < 45) p -= 0.05;
  if (prep > 0) { add(s, "cash", -8000); add(s, "stress", 6); }
  p = Math.max(0.05, Math.min(0.85, p));
  return {
    text: () => "笔试、面试、政审、体检……一道道关卡。放榜那天，你的手在抖。",
    choices: [
      { label: "查成绩", effect: (s) => { if (rnd(p)) { flag(s, "civil_servant"); s.civilRank = 1; s.job = C_findCivilJob(); bumpMomentum(s, 8); add(s, "mood", 14); return "上岸了！你成了一名「科员」，端起了那只传说中的铁饭碗。亲戚们的态度肉眼可见地热络起来。"; } add(s, "mood", -8); bumpMomentum(s, -4); return "差了几名，没上。「明年再战」四个字，你已经说了不止一次。围城外的风，吹得人心慌。"; } }
    ]
  };
}
// 体制内职位（薪资稳定，权力随级别）
function C_findCivilJob() { return (typeof jobById === "function" && jobById("civil")) ? Object.assign({}, jobById("civil"), { _raise: 0 }) : { id: "civil", name: "体制内", industry: "公共部门", pay: 8200, stress: 4, flag: "civil_servant", desc: "稳定，一眼望到退休，逢年过节有福利。", _raise: 0, level: 0 }; }

/* —— 晋升机会：关系 / 政绩 / 站队 / 熬资历 —— */
EVENTS.push({
  id: "ev_civil_promote", module: "civil", ambient: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 1 && (s.civilRank || 0) < 6,
  title: "📈 一个空出来的位子",
  text: (s) => `单位里一个【${RANK_NAMES[(s.civilRank || 1) + 1]}】的位子空了出来，盯着它的不止你一个。你现在是【${rankName(s)}】，论资历也轮得上了。怎么争？`,
  choices: [
    { label: "找关系运作，托人打招呼", effect: (s) => { const c = byClass(s, { poor: 30000, mid: 80000, rich: 200000 }); if (s.cash < c) { add(s, "mood", -3); return `运作是要本钱的——光是打点就得 ¥${c.toLocaleString()}，你掏不出，只能眼睁睁看着位子被人占了。`; } add(s, "cash", -c); const p = 0.45 + s.network / 200; if (rnd(p)) { rankUp(s); add(s, "network", 5); return `烟酒礼到位、话也带到了。任命下来那天，你成了【${rankName(s)}】。有人恭喜，有人眼红。`; } add(s, "reputation", -4); return "钱花了，关系也求了，位子却给了「更会来事」的人。你这才明白，水比想象的深。"; } },
    { label: "拼政绩，用实绩说话", effect: (s) => { const acc = (typeof socialAccess === "function") ? (socialAccess(s, "civil_promotion") - 50) / 250 : 0; const p = 0.3 + (s.stats.strategy + s.stats.knowledge) / 280 + luckBias(s) + acc; add(s, "stress", 8); add(s, "strategy", 1); if (rnd(p)) { rankUp(s); add(s, "reputation", 4); return `你熬了无数个通宵，把分管的工作做出了实打实的成绩。这一次，是实力让你坐上了【${rankName(s)}】。`; } add(s, "mood", -5); return "你干得最多，功劳却被一把手轻描淡写地分了出去。「年轻人要沉得住气」——你听了不下十遍。"; } },
    { label: "站队，押注一位领导", effect: (s) => { const win = rnd(0.5 + luckBias(s)); if (win) { rankUp(s); flag(s, "has_backer"); add(s, "network", 4); return `你押对了靠山。领导高升，把你一并带了上去，【${rankName(s)}】到手。一荣俱荣。`; } flag(s, "wrong_side"); add(s, "reputation", -6); add(s, "mood", -6); return "你站错了队。那位领导失势后，你跟着被边缘化，调去了清水衙门。一损俱损。"; } },
    { label: "不争，论资排辈慢慢熬", effect: (s) => { add(s, "stress", -4); add(s, "health", 3); if (s.age > 40 && rnd(0.4)) { rankUp(s); return `你与世无争，倒也落得清闲。熬到年头，组织上「平衡照顾」，给你提了【${rankName(s)}】。`; } return "你选择按部就班。位子是别人的，安稳是自己的。日子像盖了章的公文，一页页翻过去。"; } }
  ]
});

/* —— 接待文化 / 三公 —— */
EVENTS.push({
  id: "ev_civil_reception", module: "civil", ambient: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 2,
  title: "🍶 一场躲不掉的接待",
  text: () => "上级来视察 / 兄弟单位来对接，少不了一场接待。酒过三巡，话才好说，可这酒……是真要命。",
  choices: [
    { label: "舍命陪君子，喝", effect: (s) => { add(s, "network", 6); add(s, "health", -6); add(s, "stress", 4); if (rnd(0.2)) flag(s, "drink_health"); return "你一杯接一杯，把关系喝热乎了。第二天宿醉到怀疑人生，但有些事，就是在酒桌上定的。"; } },
    { label: "以茶代酒，守住底线", effect: (s) => { add(s, "reputation", 3); add(s, "network", -3); return "你笑着以茶代酒。有人赞你自律，也有人觉得你「不上道」。圈子里，这两种评价从来都并存。"; } }
  ]
});

/* —— 招商引资：政绩工程 —— */
EVENTS.push({
  id: "ev_civil_zhaoshang", module: "civil", ambient: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 3,
  title: "🏗️ 招商引资的任务",
  text: () => "上面压下来招商引资的硬指标。谈成了是政绩，是升迁的筹码；谈砸了，年终考核就难看了。",
  choices: [
    { label: "踏实谈一个靠谱项目", effect: (s) => { const p = 0.4 + s.stats.strategy / 200; if (rnd(p)) { add(s, "reputation", 6); bumpMomentum(s, 4); return "你引来一家实打实的优质企业，落地、纳税、解决就业。这政绩，含金量十足。"; } add(s, "stress", 5); return "项目谈到一半黄了，对方嫌配套不到位。指标没完成，你被一把手点名批评。"; } },
    { label: "为冲指标，先签了再说", effect: (s) => { add(s, "reputation", 4); flag(s, "image_project"); if (rnd(0.5)) { add(s, "mood", -6); return "签约仪式办得风风光光，可企业拿了优惠迟迟不开工，最后烂尾。政绩变成了「政疾」，给后人留了个烂摊子。"; } return "数字漂亮，仪式隆重，上面很满意。至于项目到底成不成……那是下一任的事了。"; } }
  ]
});

/* —— 灰色收入 / 反腐（级别越高诱惑越大）—— */
EVENTS.push({
  id: "ev_civil_corruption", module: "civil", ambient: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 4,
  title: "💼 一只「沉甸甸的购物袋」",
  text: () => "你手里握着审批权、签字权。逢年过节，办公室门口总会「不小心」落下一只装着「土特产」的袋子，掂着分量不轻。",
  choices: [
    { label: "拿了，谁还跟钱过不去", effect: (s) => { add(s, "cash", byClass(s, { poor: 200000, mid: 500000, rich: 1000000 })); flag(s, "dirty_hands"); add(s, "stress", 8); return "你收下了。账户多了一串零，可从此每一通陌生电话都让你心惊肉跳。这条路，没有回头。"; } },
    { label: "原封退回，守住底线", effect: (s) => { add(s, "reputation", 8); add(s, "mood", 4); return "你把袋子原封不动地退了回去，附上一句「公事公办」。有人说你迂，可半夜里，你睡得安稳。"; } }
  ]
});
// 落马：手脏了的人，迟早有东窗事发的一天（这是「结局」之一，写在 endings 里更合适，此处用事件兜底）
EVENTS.push({
  id: "ev_civil_shuanggui", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "dirty_hands") && (s.civilRank || 0) >= 4,
  title: "🚨 专案组找上门",
  text: () => "一个再普通不过的工作日，几个面色严肃的人走进你的办公室，亮明了身份。你手里的茶杯，「啪」地碎在地上。",
  choices: [
    { label: "如实交代，争取宽大", effect: (s) => { const lost = Math.round((s.cash + s.assets) * 0.8); add(s, "assets", -Math.round(s.assets * 0.8)); s.cash = Math.max(-50000, s.cash - Math.round(s.cash * 0.8)); s.civilRank = 0; delete s.flags.civil_servant; s.job = null; flag(s, "jailed"); add(s, "reputation", -40); add(s, "mood", -20); return `你交代了一切。退赃、判刑、开除公职——半生经营，一夜清零。高墙之内，你有的是时间反省那只袋子。`; } },
    { label: "负隅顽抗，能拖一天是一天", effect: (s) => { add(s, "stress", 20); add(s, "health", -10); flag(s, "jailed"); s.civilRank = 0; delete s.flags.civil_servant; return "你试图串供、转移财产，结果罪加一等。该来的，一样没躲过，还多搭进去几年。"; } }
  ]
});

/* —— 政商旋转门：级别够高、年纪够大，下海去企业「发挥余热」—— */
EVENTS.push({
  id: "ev_civil_revolving", module: "civil", ambient: true, once: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) >= 4 && s.age >= 48 && !has(s, "dirty_hands"),
  title: "🔄 政商旋转门",
  text: () => "一家大企业向你抛来橄榄枝：副总裁、年薪百万，要的就是你这些年攒下的人脉与门路。下海，还是站好最后一班岗？",
  choices: [
    { label: "下海，把人脉变现", effect: (s) => { delete s.flags.civil_servant; s.job = { id: "exec", name: "企业高管", pay: 60000, stress: 8, _raise: 0 }; add(s, "cash", 500000); add(s, "network", 6); flag(s, "revolving_door"); return "你脱下制服，换上西装，转身成了企业座上宾。多年的关系网，此刻都成了真金白银。"; } },
    { label: "站好最后一班岗", effect: (s) => { add(s, "reputation", 8); add(s, "mood", 4); return "你婉拒了。临退休再折腾不值当，落个清名，比什么都强。组织上记你一功。"; } }
  ]
});

/* —— 普通人/创业者：办事找关系（中国式人情社会）—— */
EVENTS.push({
  id: "ev_biz_guanxi", module: "civil", ambient: true,
  cond: (s) => !has(s, "civil_servant") && s.age >= 25 && (has(s, "startup") || has(s, "has_house") === false),
  title: "🤝 办事，得找关系",
  text: () => "一件本该按章办的事，卡在了某个环节。明里走流程遥遥无期，可只要找对人、递句话，立马就能通。",
  choices: [
    { label: "托关系、请客送礼", effect: (s) => { const c = 20000; if (s.cash < c) return "你想找关系，可一打听「意思意思」的行情，发现自己连「意思」都意思不起。"; add(s, "cash", -c); add(s, "network", 3); if (rnd(0.7)) return "一顿饭、一条烟，事儿就成了。你感慨：在这片土地上，关系有时比规则好使。"; add(s, "mood", -4); return "钱花了，关系却没找对，事还是没办成，反倒被人当了冤大头。"; } },
    { label: "就按规矩来，不信这个邪", effect: (s) => { add(s, "reputation", 2); add(s, "stress", 5); if (rnd(0.45)) return "你一趟趟跑、一份份补材料，硬是把流程走通了。是慢了点，但走得正。"; add(s, "mood", -5); return "你坚持按规矩，结果材料被反复挑刺、来回踢皮球，拖了大半年也没下文。"; } }
  ]
});
