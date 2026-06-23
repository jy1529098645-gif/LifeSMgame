"use strict";
/* =====================================================================
 * content/events-echo.js —— 决策后果链 / 多结局 / 疏忽代价（v1.0 深化）
 * 目标：把过去埋下的 flag 在多年后「回响」出来，让选择有长期后果；
 *       并大幅扩充【由玩家路径触发】的戏剧性结局与称号，让死亡像人生总结。
 *
 *  ① 回响事件(echo)：ambient + once，cond 读「旧 flag + 年龄/阶段闸门」，
 *     让 10 年前的背刺/贪腐/裸辞/暴富/留学/啃老 在中年晚年找上门。
 *  ② 疏忽代价：读引擎维护的 s.neglect.{fam,self} 计数，长期不顾家/不养生 → 后果。
 *  ③ 结局/称号：push 进 endings / titles（core.js 的全局数组），按 flag/path 触发。
 *
 * 经典 <script> 全局作用域：EVENTS / endings / titles 已存在，直接 push；
 * 只用全局 helper（add/flag/has/pick/rnd/byClass/classTier/socialShift…）。
 * ===================================================================== */

/* —— 小工具：第一次满足时记录「伏笔年龄」，便于做「N 年后回响」 —— */
function echo_seed(s, key) { if (s["_seed_" + key] === undefined) s["_seed_" + key] = s.age; return s["_seed_" + key]; }
function echo_years(s, key) { const a = s["_seed_" + key]; return a === undefined ? 0 : (s.age - a); }

/* =====================================================================
 * 一、决策后果链（回响事件）
 * ===================================================================== */
EVENTS.push(
  // —— 职场背刺/树敌的回响：当年戳破老板/开骂(job_risk)，多年后狭路相逢 ——
  { id: "ev_echo_old_enemy", module: "career", ambient: true, once: true,
    cond: (s) => has(s, "job_risk") && s.age >= 38,
    title: "🤝 仇人成了甲方",
    text: (s) => byClass(s, {
      poor: "一场关键的合作里，对面坐着的决策人，正是当年被你当众怼到下不来台的那位老领导。他端着茶，似笑非笑：「哟，是你啊。」",
      mid: "新项目的乙方评审会上，你认出了主审——当年你拍桌子骂走的那个人。如今风水轮流转，你的命脉攥在了他手里。",
      rich: "饭局上有人给你引荐「关键人物」，转过身，竟是当年和你闹翻的旧人。他眼神复杂，握手的力道意味深长。"
    }),
    choices: [
      { label: "放下身段，真诚和解", effect: (s) => { const p = 0.4 + s.stats.charm / 250 + s.network / 300; if (rnd(p)) { delete s.flags.job_risk; add(s, "network", 6); add(s, "reputation", 4); add(s, "cash", 30000); return "你主动认了当年的莽撞，敬了杯酒。对方愣了愣，最终一笑泯恩仇——成年人的体面，有时比对错更值钱。这道坎，过去了。"; } add(s, "mood", -6); add(s, "reputation", -3); return "你低了头，对方却不接茬，反而借机刁难。旧怨没解开，新仇又添一笔。有些梁子，时间也焐不热。"; } },
      { label: "针锋相对，绝不示弱", effect: (s) => { add(s, "stress", 8); if (classTier(s) >= 3 || rnd(0.4)) { add(s, "reputation", 3); return "你寸步不让，气场全开。对方掂量了一下你如今的分量，悻悻收了手。江湖地位，是打出来的。"; } add(s, "cash", -Math.round(40000 + s.cash * 0.05)); flag(s, "job_risk"); return "你嘴上不输，可对方手里有的是办法卡你。项目黄了，你为年轻时的意气，又补交了一次学费。"; } }
    ] },

  // —— 贪腐(dirty_hands)的回响：旋转门吃相难看，巡视组找上门 ——
  { id: "ev_echo_audit", module: "civil", ambient: true, once: true,
    cond: (s) => has(s, "dirty_hands") && s.age >= 50,
    title: "📋 一封举报信",
    text: () => "多年前那些「擦边」的操作，你以为早翻了篇。可一封实名举报信，附着泛黄的转账记录，被送进了专案组。深夜，你接到一个陌生号码：「配合调查一下。」",
    choices: [
      { label: "花钱平事，赌它过去", effect: (s) => { const cost = Math.round((s.cash + s.assets) * 0.3); add(s, "assets", -Math.round(s.assets * 0.3)); s.cash = Math.max(-50000, s.cash - Math.round(s.cash * 0.3)); if (rnd(0.45)) { delete s.flags.dirty_hands; add(s, "stress", 12); return `你动用了所有关系、花了将近 ¥${cost.toLocaleString()} 才把窟窿堵上。惊出一身冷汗，从此再不敢碰那条线。`; } flag(s, "jailed"); s.civilRank = 0; delete s.flags.civil_servant; add(s, "reputation", -40); return "钱花出去了，事却没平——你的「公关」反而成了新的罪证。手铐扣上的那一刻，你听见自己半生攒下的一切碎裂的声音。"; } },
      { label: "如实交代，争取宽大", effect: (s) => { flag(s, "jailed"); s.civilRank = 0; delete s.flags.civil_servant; const lost = Math.round(s.assets * 0.7); add(s, "assets", -lost); add(s, "reputation", -30); add(s, "mood", -15); return "你交代了一切。退赃、判刑、开除——高墙之内，你有的是时间，去想当年那只递过来的、看似无害的信封。"; } }
    ] },

  // —— 暴发户/中彩票(nouveau_riche/lottery)的回响：人财两空的诱惑 ——
  { id: "ev_echo_easy_money", module: "money", ambient: true, once: true,
    cond: (s) => (has(s, "nouveau_riche") || has(s, "lottery")) && (s.cash + s.assets) > 500000 && s.age >= 30,
    title: "💸 「稳赚不赔」的老同学",
    text: () => "一个许久不联系的老同学忽然热络起来，约你喝茶。三句话不离一个「内部项目」：年化 30%，保本，名额有限，「就想着拉你一把」。他西装革履，手腕上的表很亮。",
    choices: [
      { label: "重仓押进去，富贵险中求", effect: (s) => { const bet = Math.round((s.cash) * 0.5); add(s, "cash", -bet); if (rnd(0.2)) { add(s, "cash", Math.round(bet * 1.8)); return `这次你竟赌对了，项目真分了红，¥${Math.round(bet * 0.8).toLocaleString()} 落袋。但你心里清楚，这种好运，不会有第二次。`; } flag(s, "got_scammed"); add(s, "mood", -12); return `钱打过去没几个月，老同学人间蒸发，电话成了空号。所谓「内部项目」，是给你这种「有钱没根」的人量身定做的局。`; } },
      { label: "婉拒，再好的饼也不接", effect: (s) => { add(s, "insight", 3); add(s, "network", -2); return "你笑着把话题岔开。回家路上你想：钱来得太容易的人，最怕这种「专坑熟人」的局。这一次，你的清醒值钱。"; } }
    ] },

  // —— 啃老/裸辞(gap_year)的回响：父母老去，账要还 ——
  { id: "ev_echo_parents_age", module: "family", ambient: true, once: true,
    cond: (s) => s.age >= 45 && (has(s, "gap_year") || has(s, "born_poor") || has(s, "fallen")),
    title: "🏥 父母住院的缴费单",
    text: (s) => byClass(s, {
      poor: "父母年纪大了，一场病住进医院。缴费单递到你面前，数字让你手抖——这些年你过得紧巴，根本没攒下应急的钱。",
      mid: "父母的身体亮起红灯，住院、手术、护工，处处要钱。你这才发现，自己一直以为「来得及」的尽孝，账单来得比孝心还快。",
      rich: "父母病了，你包下了最好的病房和专家。钱不是问题，可守在病床前你忽然意识到，能用钱解决的，从来不是最痛的部分。"
    }),
    choices: [
      { label: "倾尽所有，全力救治", effect: (s) => { const cost = byClass(s, { poor: 30000, mid: 120000, rich: 400000 }); add(s, "cash", -cost); add(s, "mood", 4); add(s, "health", -3); flag(s, "filial"); socialShift(s, 3); return `你掏空了能掏的，守在病床前。钱哗哗地流，可看着父母还能喊出你的名字，你觉得值。「子欲养」这三个字的重量，你今天才真正掂明白。`; } },
      { label: "量力而为，留点余地", effect: (s) => { const cost = byClass(s, { poor: 8000, mid: 30000, rich: 100000 }); add(s, "cash", -cost); add(s, "mood", -8); add(s, "stress", 6); flag(s, "regret_filial"); return "你做了能做的，但心里清楚，有些治疗你没敢上——不是不想，是不敢把整个家拖垮。这份算计，会在很多个深夜啃咬你。"; } }
    ] },

  // —— 留学海归(haigui_back)的回响：身份认同与中年回望 ——
  { id: "ev_echo_haigui_midlife", module: "career", ambient: true, once: true,
    cond: (s) => has(s, "haigui_back") && s.age >= 40,
    title: "✈️ 当年若是留下",
    text: () => "同期留在海外的同学发来消息，晒着大房子和悠闲的周末。你坐在深夜加班的工位上，第一次认真地想：当年那个「回国趁热打铁」的决定，到底是对是错？",
    choices: [
      { label: "我的根在这，不后悔", effect: (s) => { add(s, "mood", 6); add(s, "reputation", 2); return "你笑了笑，关掉对话框。这片土地有你打下的局、你熟悉的人情。路是自己选的，走到现在，你认。"; } },
      { label: "动了再润出去的念头", effect: (s) => { add(s, "insight", 2); flag(s, "emigrate_lean"); add(s, "mood", -3); return "那个念头一旦冒出来就压不下去了。你开始悄悄查签证、看房价——也许人生还有一次「重新选择」的机会。"; } }
    ] },

  // —— 创业失败(startup_failed)的回响：东山再起还是认命 ——
  { id: "ev_echo_failed_founder", module: "startup", ambient: true, once: true,
    cond: (s) => has(s, "startup_failed") && !has(s, "startup") && s.age >= 35,
    title: "🔥 灰烬里的火星",
    text: () => "公司倒了几年了。一个当年的老下属找到你，说手里有个新方向，想拉你再干一票：「就信你这把老骨头。」你摩挲着杯子，心跳竟又快了起来——可上次摔的跟头，还隐隐作痛。",
    choices: [
      { label: "再赌一把，老兵不死", next: (s) => startupNode(s) },
      { label: "够了，这次我求稳", effect: (s) => { add(s, "mind", 3); add(s, "mood", 4); flag(s, "retired_founder"); return "你拍拍他的肩，谢了他的信任，但摇了头。输过一次的人才懂，能全身而退，本身就是一种本事。"; } }
    ] },

  // —— 套现/财务自由(cashed_out)的回响：钱多了之后的空 ——
  { id: "ev_echo_rich_empty", module: "money", ambient: true, once: true,
    cond: (s) => (has(s, "cashed_out") || has(s, "lottery")) && (s.cash + s.assets) > 5000000 && s.age >= 42,
    title: "🍷 财富自由之后",
    text: () => "钱够几辈子花了，可你发现自己越来越不快乐。早上醒来不知道为什么起床，朋友的热络里掺着算计，连孩子看你的眼神都有点陌生。「然后呢？」这三个字，比当年缺钱时还难回答。",
    choices: [
      { label: "做慈善/办学，找点意义", effect: (s) => { add(s, "cash", -Math.round((s.cash) * 0.2)); add(s, "mood", 14); add(s, "reputation", 12); flag(s, "philanthropist"); return "你拿出一大笔钱办了基金会、资助山区。看着那些因你而改变的人生，你心里那个空洞，第一次被填上了一点。"; } },
      { label: "纵情享乐，及时行乐", effect: (s) => { add(s, "cash", -Math.round((s.cash) * 0.15)); add(s, "mood", 6); add(s, "health", -6); add(s, "stress", 4); flag(s, "hedonist"); return "游艇、私厨、环球旅行，你把能体验的都体验了个遍。快乐是真的，可夜深人静时的空，也是真的。"; } },
      { label: "什么都不缺，反而躺平了", effect: (s) => { add(s, "mood", -4); add(s, "health", 4); flag(s, "idle_rich"); return "你慢慢什么都不想干了。没有目标的日子像一潭温水，舒服，又一眼望得到头。"; } }
    ] }
);

/* =====================================================================
 * 二、疏忽的代价（读引擎维护的 s.neglect 计数）
 *  s.neglect.fam：连续多少周没做 陪家人/恋爱/社交/育儿/含饴弄孙
 *  s.neglect.self：连续多少周没做 休息/健身
 * ===================================================================== */
EVENTS.push(
  // 长期不顾家 + 有伴侣 → 感情亮红灯
  { id: "ev_neg_partner_drift", module: "love", ambient: true,
    cond: (s) => has(s, "partner") && !has(s, "neg_partner_warned") && (s.neglect && s.neglect.fam >= 150),
    title: "🌬️ 枕边人的沉默",
    text: () => "你已经记不清上一次和 ta 好好吃顿饭是什么时候了。今晚 ta 终于开口，声音很轻：「这些年，我好像一直在等一个忙完的你。可你，永远在忙。」",
    choices: [
      { label: "立刻停下，把心拉回家", effect: (s) => { flag(s, "neg_partner_warned"); s.neglect.fam = 0; add(s, "mood", 6); add(s, "cash", -Math.round(20000)); add(s, "stress", -6); return "你推掉了一周的应酬，订了张机票带 ta 去散心。冰封不是一天结的，但你愿意从今晚开始焐。关系，缓过来了一些。"; } },
      { label: "等这阵忙完再说", effect: (s) => { flag(s, "neg_partner_warned"); if (rnd(0.55)) { if (has(s, "married") && typeof familyDivorce === "function") familyDivorce(s, { civil: true, lossRate: 0.25, mood: -16, stress: 6, social: -2, text: "长期忽视之后，你们平静地结束了婚姻。" }); else { s.partnerName = null; s.flags.partner = false; add(s, "mood", -16); if (has(s, "married")) { flag(s, "divorced"); s.flags.married = false; add(s, "cash", -Math.round((s.cash) * 0.25)); } } return "「这阵」永远没有忙完的一天。某个再平常不过的早晨，ta 收拾好行李，平静地说了再见。房子空了一半，你愣在原地——原来有些人，真的会走。"; } add(s, "mood", -6); return "ta 没再说什么，只是眼里的光淡了些。日子还在过，可你们之间，像隔了一层擦不掉的雾。"; } }
    ] },
  // 长期不顾家 + 有娃 → 亲子疏离
  { id: "ev_neg_kid_distant", module: "family", ambient: true, once: true,
    cond: (s) => has(s, "has_kid") && s.age >= 45 && (s.neglect && s.neglect.fam >= 200),
    title: "📱 孩子的朋友圈把你屏蔽了",
    text: () => "你无意间发现，孩子的朋友圈对你「仅三天可见」。这些年你忙着挣钱、应酬、拼事业，回过神来，那个曾经追在你屁股后面喊「爸爸/妈妈」的小不点，已经变成一个对你客客气气、却什么都不说的陌生人。",
    choices: [
      { label: "笨拙地，试着重新走近", effect: (s) => { s.neglect.fam = 0; add(s, "mood", 2); add(s, "stress", 4); if (rnd(0.5)) { flag(s, "kid_reconciled"); add(s, "mood", 10); return "你放下身段，从一顿尴尬的饭、一次主动的道歉开始。墙不是一天拆得掉的，但孩子终于愿意，多和你说几句话了。"; } flag(s, "kid_estranged"); return "你的示好来得太晚也太生硬。孩子礼貌地敷衍着，那道隔阂，你这辈子怕是补不回来了。"; } },
      { label: "算了，给够钱就是责任", effect: (s) => { flag(s, "kid_estranged"); add(s, "mood", -6); return "你给孩子转了一大笔钱，当作弥补。ta 回了个「谢谢」，再无下文。你们成了最熟悉的陌生人。"; } }
    ] },
  // 长期不养生 → 中年体检暴雷
  { id: "ev_neg_health_scare", module: "health", ambient: true, once: true,
    cond: (s) => s.age >= 40 && (s.neglect && s.neglect.self >= 180),
    title: "🩺 体检报告上的箭头",
    text: () => "你已经好几年没正经歇过、动过了。这次单位体检，报告上一片向上的箭头，医生的脸色很严肃：「再这么熬下去，我不敢保证。」你盯着那几个加粗的指标，后背发凉。",
    choices: [
      { label: "痛定思痛，重启养生", effect: (s) => { s.neglect.self = 0; add(s, "health", 8); add(s, "stress", -10); add(s, "overdraft", -10); flag(s, "health_woke"); return "你办了健身卡、戒了夜宵、推了应酬。身体的债，你开始一点点还。亡羊补牢，总好过追悔莫及。"; } },
      { label: "忙完这阵再说，先扛着", effect: (s) => { add(s, "overdraft", 20); add(s, "health", -6); return "你把报告往抽屉里一塞，继续连轴转。「等忙完这阵」——这句话，你已经对自己说了十年。身体在沉默里，记着账。"; } }
    ] }
);

/* =====================================================================
 * 三、戏剧性结局（push 进 core.js 的全局 endings 数组）
 *  形状：{ id, title, cond(s), prob(s)（每周判定，须小）, text(s) }
 *  说明：与核心 3 条（过劳/枯竭/寿终）并存；conds 基本按 flag/path 区分，
 *        让死亡成为「玩家这一生的总结」，而非系统随机判死。
 * ===================================================================== */
endings.push(
  { id: "end_jailed", title: "🚔 高墙内的余生", cond: (s) => has(s, "jailed") && s.age >= 55, prob: (s) => 0.003,
    text: () => "铁窗外的四季换了一轮又一轮。你在劳动与悔恨里慢慢老去，最风光时攥在手里的一切，早已成了别人嘴里的谈资。" },
  { id: "end_lonely_rich", title: "🏚️ 孤独的富豪", cond: (s) => (s.cash + s.assets) > 5000000 && (has(s, "divorced") || has(s, "kid_estranged")) && s.mood < 35 && s.age >= 60, prob: (s) => 0.003,
    text: () => "偌大的房子，回声都是冷的。临走那天，账户上的数字依旧惊人，床前却没有一个人。钱买得到一切，唯独买不到此刻有人握住你的手。" },
  { id: "end_emigrant_nostalgia", title: "🛫 异乡的月亮", cond: (s) => has(s, "emigrated") && s.age >= 65, prob: (s) => 0.003,
    text: (s) => s.mood > 55 ? "你在异国的小院里安度晚年，儿孙说着你听不太懂的语言。月亮还是那个月亮，只是故乡，成了回不去的远方。" : "异乡的日子安稳却清冷。弥留之际，你含糊地念着家乡的地名，没人听得懂。" },
  { id: "end_mentor", title: "🎓 桃李满天下", cond: (s) => (has(s, "was_mentor") || has(s, "philanthropist")) && s.age >= 72, prob: (s) => 0.006,
    text: () => "你带过的学生、帮过的后辈，从天南海北赶来送你。你没留下惊人的财富，却把自己活成了很多人记忆里的一束光。" },
  { id: "end_hermit", title: "🧘 大隐于市", cond: (s) => (has(s, "lie_flat") || has(s, "hometown") || has(s, "path_enjoy")) && s.mood > 70 && s.age >= 70, prob: (s) => 0.005,
    text: () => "你这辈子没争过什么大富大贵，把日子过成了细水长流。最后，你在自家小院的藤椅上睡着了，嘴角是松的。不争，原来也是一种赢。" },
  { id: "end_filial_warm", title: "🧧 儿孙绕膝", cond: (s) => has(s, "filial") && has(s, "has_kid") && s.mood > 55 && s.age >= 75, prob: (s) => 0.007,
    text: () => "你尽过孝，也被孝顺着。一大家子围在床前，孙辈拉着你的手。你这一生没干出什么惊天动地的大事，却把「家」这个字，过得圆圆满满。" },
  { id: "end_scammed_ruin", title: "📉 韭菜的尽头", cond: (s) => has(s, "got_scammed") && (s.cash + s.assets) < 0 && s.age >= 50 && !has(s, "goal_peace") && !has(s, "goal_family"), prob: (s) => 0.003,
    text: () => "一次次「稳赚不赔」，一次次血本无归。你到死都没想明白，自己明明那么努力，怎么就成了别人镰刀下，一茬又一茬的韭菜。" },
  { id: "end_burnout_founder", title: "🔥 燃尽的创业者", cond: (s) => (has(s, "chase_ipo") || has(s, "startup") || has(s, "startup_done") || has(s, "startup_failed")) && s.health < 25 && s.stress > 70 && s.age < 55, prob: (s) => 0.004,
    text: () => "你把自己当柴火，烧出了一家公司，也烧干了自己。倒下那天，办公室的灯还亮着，未读消息停在 99+。梦想很贵，你用命付了账。" },
  { id: "end_philanthropist", title: "🕊️ 散尽千金", cond: (s) => has(s, "philanthropist") && s.mood > 60 && s.age >= 70, prob: (s) => 0.006,
    text: () => "你走的时候，名下没剩多少钱——大半都化成了别人命运里的转机。讣告很长，写满了被你照亮过的名字。有人说你傻，可你笑着闭上了眼。" }
);

/* =====================================================================
 * 四、称号（push 进 core.js 的全局 titles 数组，死亡结算时取首个 cond 命中）
 *  注意：titles 末项是「平凡的一生 cond:()=>true」兜底，push 进去的会排在它【前面】被优先匹配吗？
 *  —— 引擎用 titles.find(cond)，数组顺序即优先级。push 追加在末尾(兜底之后)不会被选中。
 *  因此这里用 unshift 插到最前，保证更具体的称号优先于兜底。
 * ===================================================================== */
titles.unshift(
  { name: "🚔 阶下囚", cond: (s) => has(s, "jailed") },
  { name: "🕯️ 孤独终老", cond: (s) => (has(s, "divorced") || has(s, "kid_estranged")) && (s.cash + s.assets) > 2000000 },
  { name: "🌾 归园田居", cond: (s) => has(s, "hometown") && s.mood > 60 },
  { name: "🎓 一代宗师", cond: (s) => has(s, "was_mentor") || has(s, "philanthropist") },
  { name: "🧧 大善人", cond: (s) => has(s, "philanthropist") },
  { name: "🔥 燃尽的赌徒", cond: (s) => (has(s, "chase_ipo") || has(s, "startup_failed")) && s.health < 30 },
  { name: "🛫 异乡客", cond: (s) => has(s, "emigrated") },
  { name: "💔 孤家寡人", cond: (s) => has(s, "divorced") && !has(s, "has_kid") }
);

/* =====================================================================
 * 五、圈层联动事件（让「亲疏有别」真正影响玩法）
 *  借助 social.js 的 socialTier(s,tier)：核心圈托底、外围圈势利。
 * ===================================================================== */
EVENTS.push(
  // 核心圈雪中送炭：跌到谷底时，至亲挚友（tier1）拉你一把——越亲的越不离不弃
  { id: "ev_core_rescue", module: "relation", ambient: true,
    cond: (s) => (s.cash < -20000 || (has(s, "been_bankrupt") && s.cash < 30000)) && socialTier(s, 1).length > 0,
    title: "🤲 谷底里伸来的一只手",
    text: (s) => { const n = pick(socialTier(s, 1)); s._rescuer = n.role + "「" + n.name + "」"; return `你落魄到几乎开不了口的时候，${s._rescuer} 主动找上门：「我这还有点，先拿去周转，啥时候有了啥时候还，别跟我提利息。」那一刻，你眼眶发热——患难时谁真谁假，看得一清二楚。`; },
    choices: [
      { label: "含泪接受，记下这份恩", effect: (s) => { add(s, "cash", 80000); add(s, "mood", 12); add(s, "stress", -8); flag(s, "owe_core"); socialBoostRole(s, (s._rescuer || "").replace(/「.*」/, "") || "发小", 6); return "你收下了这笔救命钱，把这份情记进了心里。钱能再挣，可这种时候肯掏钱的人，一辈子也遇不到几个。"; } },
      { label: "硬撑着婉拒，不想拖累人", effect: (s) => { add(s, "mood", -4); add(s, "stress", 6); add(s, "reputation", 2); return "你笑着摆手说「我还行」，把难处咽了回去。对方塞了张卡在你兜里就走了。有些好意，推得开手，推不开心。"; } }
    ] },

  // 外围圈攀附：你风光时（小康以上），一堆点头之交（tier3）忽然热络起来
  { id: "ev_outer_swarm", module: "relation", ambient: true, once: true,
    cond: (s) => classTier(s) >= 3 && socialTier(s, 3).length >= 6,
    title: "📈 风光时，认识的人忽然变多了",
    text: () => "你刚有点起色，微信就热闹起来：八百年不联系的「老同学」「老同事」纷纷冒头，朋友圈点赞如潮，饭局邀约排到了下个月。有人真心道贺，更多人，话锋一转就到了「能不能帮个忙」。",
    choices: [
      { label: "来者不拒，广结善缘", effect: (s) => { add(s, "network", 8); add(s, "cash", -Math.round(30000 + Math.random() * 50000)); socialShift(s, 5); if (rnd(0.4)) { flag(s, "got_lead"); return "你来者不拒地应酬、随份子、搭桥牵线。钱花了不少，人脉是真的厚了——其中或许就藏着下一个机会。"; } return "你忙着维系这张突然变大的网，钱包瘪了一圈。热闹是热闹，可你心里清楚，这些热乎劲是冲着什么来的。"; } },
      { label: "看清势利，只留真心的", effect: (s) => { add(s, "insight", 3); add(s, "reputation", 2); if (s.socialOuter) s.socialOuter.attitude = Math.max(0, s.socialOuter.attitude - 6); return "你礼貌地保持着距离，把时间留给真正在乎的人。外围那片热闹凉了些，但你乐得清静——锦上添花的人，从不缺，缺的是雪中送炭的。"; } }
    ] },

  // 中年同学会：阶级落差下，外围/中间圈的攀比与疏离
  { id: "ev_reunion_class", module: "relation", ambient: true, once: true,
    cond: (s) => s.age >= 35 && s.age <= 58,
    title: "🍻 二十年同学会",
    text: (s) => byClass(s, {
      poor: "毕业二十年的同学会，你犹豫再三还是去了。停车场里一排好车，席间聊的是房子、学区和理财。你攥着自己那杯酒，话越来越少——混得好不好，一开口就藏不住。",
      mid: "同学会上推杯换盏。有人混成了老板，有人还在打工，当年成绩垫底的那个如今谈笑风生。一桌人，二十年，活成了一张参差不齐的成绩单。",
      rich: "同学会上你成了被围着敬酒的那个。当年看不起你的人，如今笑得格外热情。你举着杯，心里五味杂陈——这场面，年轻时做梦都想，真到了又觉得没什么意思。"
    }),
    choices: [
      { label: "真诚叙旧，不攀比", effect: (s) => { add(s, "mood", 5); add(s, "network", 3); socialBoostRole(s, "老同学", 5); return "你避开那些较劲的话题，只和聊得来的老友追忆当年。散场时几个真朋友约了下次再聚。攀比留给别人，你只想要那点旧情。"; } },
      { label: "暗暗较劲，争口气", effect: (s) => { add(s, "stress", 6); if (classTier(s) >= 2) { add(s, "reputation", 4); socialShift(s, 4); return "你不动声色地亮了亮底牌，享受了一把被高看的滋味。回家路上却有点空——你忽然不确定，自己拼这一口气，到底是为了谁。"; } add(s, "mood", -8); add(s, "cash", -Math.round(5000 + Math.random() * 8000)); return "你为了面子抢着买单、把日子往好里吹。强撑的体面，回家对着账单时，碎了一地。"; } }
    ] }
);

/* =====================================================================
 * 六、关系经营的回报：维系得好的关系会托举你（好关系→更多机会与剧情）
 * ===================================================================== */
EVENTS.push(
  // 贵人提携：核心/中间圈里有态度很高的人 → 主动给你引荐机会/资源
  { id: "ev_benefactor", module: "relation", ambient: true,
    cond: (s) => socialTier(s, 1).concat(socialTier(s, 2)).filter(n => n.attitude >= 80).length > 0 && s.age >= 24,
    title: "🌟 贵人相助",
    text: (s) => { const n = pick(socialTier(s, 1).concat(socialTier(s, 2)).filter(x => x.attitude >= 80)); s._benefactor = n; return `${n.role}「${n.name}」一直记着你的好。这天 ta 主动找上门：「有个机会，我第一个想到的就是你。」——平时关系经营到位，关键时刻才有人愿意拉你一把。`; },
    dynamicChoices: (s) => {
      const n = s._benefactor || pick(socialTier(s, 1).concat(socialTier(s, 2)));
      const opts = [];
      opts.push({ label: "接住机会，全力以赴", effect: (s) => { add(s, "network", 6); add(s, "reputation", 5); if (s.startup && !has(s, "startup_done")) { s.startup.progress += 12; s.startup.valuation = Math.round(s.startup.valuation * 1.12); return `${n ? n.name : "贵人"}把一条关键的资源/客户接到了你手上。公司往前跳了一大步——人脉，有时比能力更值钱。`; } if (s.job) { s.job._raise = (s.job._raise || 0) + 0.12; add(s, "cash", 30000); return `${n ? n.name : "贵人"}替你引荐，你换了个更好的位置/项目，薪水涨了一截。`; } add(s, "cash", 40000); add(s, "insight", 2); return `${n ? n.name : "贵人"}给你指了条明路，还塞了笔启动的钱。你记下了这份情。`; } });
      opts.push({ label: "心领了，但靠自己", effect: (s) => { add(s, "reputation", 3); add(s, "insight", 2); if (n) socialBoostRole(s, n.role, 4); return "你谢过好意，没有伸手。对方反而更高看你一眼——不占人便宜的人，路才走得长。"; } });
      return opts;
    },
    choices: [] }
);
