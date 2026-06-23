"use strict";
/* =====================================================================
 * content/events-workplace-chains.js —— 职场沉浮事件链（大框架改造·批次4，doc §5/§13）
 * 四条多节点链 + 一批职场荒诞单点事件，每类尽量【回流创业】（doc §13.2）：
 *   背锅链 → 合规/证据意识；抢功链 → 股权/合伙人警惕；
 *   离职补偿链 → 创业启动资金；劳动仲裁链 → 信用/人脉/本钱。
 * 后果写入结构化记忆，供日后机会卡与回响读取。
 * ===================================================================== */

function _wc(s) { if (!s.workChains) s.workChains = { blame: 0, credit: 0, sever: 0, arb: 0 }; return s.workChains; }
function _emp(s) { return has(s, "employed") && !!s.job && !(s.startup && s.startup.fulltime); }
function _wcCd(s, id, weeks) { return (s.week - (s._wcCd && s._wcCd[id] || -999)) >= (weeks || 8); }
function _wcStamp(s, id) { if (!s._wcCd) s._wcCd = {}; s._wcCd[id] = s.week; }
function _pi(s) { return (s.world && s.world.priceIndex) || 1; }

EVENTS.push(
  /* ===================== 一、背锅链 ===================== */
  {
    id: "ev_wc_blame", module: "career", ambient: true, importance: "turning",
    cond: s => _emp(s) && _wc(s).blame === 0 && (s.week - (s._jobSinceWk || 0)) >= 10 && _wcCd(s, "blame", 12) && rnd(0.32),
    title: "🕳️ 这锅，要你背",
    text: s => `项目出了纰漏，复盘会上所有人都不说话。最后主管把目光转向你：「这块当时是你跟进的吧？」——你分明记得，关键决定是他拍的板。空气凝固了，一口黑锅正稳稳朝你扣下来。`,
    choices: [
      { label: "忍下来，息事宁人", effect: s => { _wc(s).blame = 1; _wcStamp(s, "blame"); add(s, "mood", -8); add(s, "stress", 6); if (s.job) s.job._raise = Math.max(-0.3, (s.job._raise || 0) - 0.05); if (typeof recordBeat === "function") recordBeat(s, "first_conflict"); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "替主管背了一口黑锅，咽下了。", tags: ["grudge", "backlash"], intensity: 2 }); return "你低头认了。会议室的空气重新流动起来，仿佛什么都没发生。可那口窝囊气堵在胸口，从此你看这家公司的眼神，变了。"; } },
      { label: "反击：调出聊天记录、邮件留痕", effect: s => { _wc(s).blame = 2; _wcStamp(s, "blame"); const ok = rnd(0.5 + statEdge(s, "strategy") * 0.4); if (typeof recordBeat === "function") recordBeat(s, "first_conflict"); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 4); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "被甩锅时靠留痕的证据自证清白——从此你做事必留证据。", tags: ["backlash", "evidence"], intensity: 3 }); if (ok) { add(s, "reputation", 4); add(s, "mood", 3); return "你不慌不忙调出当时的邮件和会议纪要，时间、决策人清清楚楚。主管的脸一阵青白。锅没扣成，但你也算和他撕破了脸——职场没有白打的仗。这一课你记牢了：凡事留痕。"; } add(s, "network", -5); return "你据理力争，证据也确实在你这边。锅是甩回去了，可主管从此把你划进了「不好管」的那一类。清白保住了，前程蒙了灰。但「凡事留痕」这条铁律，你刻进了骨头里。"; } },
      { label: "甩回去：当场点名是谁拍的板", effect: s => { _wc(s).blame = 3; _wcStamp(s, "blame"); add(s, "stress", 8); add(s, "network", -8); if (typeof bumpThread === "function") bumpThread(s, "career_margin", 18, { status: "open" }); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "当众把锅甩回给主管，痛快，但结了梁子。", tags: ["backlash", "grudge"], intensity: 2 }); return "你当众把话挑明：「这个决定是您拍的板，我有记录。」满座哗然。痛快是真痛快，可你也彻底站到了主管的对立面。接下来的日子，穿小鞋是少不了的了。"; } }
    ]
  },
  {
    id: "ev_wc_blame_fallout", module: "career", ambient: true, once: true, importance: "turning",
    cond: s => _emp(s) && _wc(s).blame >= 1 && _wcCd(s, "blame", 14) && rnd(0.3),
    title: "🪤 背锅之后",
    text: s => `那次背锅的余波还在。${_wc(s).blame === 1 ? "你忍气吞声换来的不是太平——主管尝到甜头，又开始把脏活累活往你身上推。" : "你撕破脸之后，被有意无意地边缘化，好项目再也轮不到你。"}你站在窗边，第一次认真地想：这样的地方，还值得待吗？`,
    choices: [
      { label: "攒着证据和经验，骑驴找马", effect: s => { add(s, "insight", 2); if (typeof addFounderPrep === "function") { addFounderPrep(s, "industryInsight", 5); addFounderPrep(s, "riskTolerance", 4); } if (typeof recordBeat === "function") recordBeat(s, "industry_insight"); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "在背锅的窝囊里看清了行业门道，悄悄准备出走。", tags: ["backlash", "founder_seed"], intensity: 2 }); return "你不再内耗，转而把这家公司当成免费的商学院：流程怎么走、客户在哪、利润藏在哪个环节，你全记在心里。背锅的屈辱，正在慢慢发酵成另一种东西——一个出走的念头。"; } },
      { label: "继续忍，工资还得照拿", effect: s => { add(s, "mood", -5); add(s, "stress", 5); if (typeof bumpThread === "function") bumpThread(s, "career_margin", 12); return "你说服自己：忍忍吧，房贷、生活、那点可怜的安稳……成年人哪有不委屈的。你把头埋进工位，继续做那个最好使唤的人。"; } }
    ]
  },

  /* ===================== 二、抢功链 ===================== */
  {
    id: "ev_wc_credit", module: "career", ambient: true, importance: "turning",
    cond: s => _emp(s) && _wc(s).credit === 0 && (s.week - (s._jobSinceWk || 0)) >= 8 && _wcCd(s, "credit", 12) && rnd(0.3),
    title: "🎭 你的功劳，长在了别人头上",
    text: s => `那个平时对你嘘寒问暖的同事，在老板面前把你熬了三个通宵的方案讲得头头是道——只字不提你。老板当场表扬了「他」。你坐在角落，手心攥出了汗。原来最热心的人，背后下手最狠。`,
    choices: [
      { label: "忍气吞声，和气生财", effect: s => { _wc(s).credit = 1; _wcStamp(s, "credit"); add(s, "mood", -7); if (typeof recordBeat === "function") recordBeat(s, "first_conflict"); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "功劳被「热心同事」抢走，忍了。", tags: ["grudge", "credit"], intensity: 2 }); return "你笑着鼓了掌，指甲掐进掌心。这口气咽下去，你算是认清了一件事：在利益面前，同事的笑脸最不值钱。"; } },
      { label: "找老板对峙，亮出过程记录", effect: s => { _wc(s).credit = 2; _wcStamp(s, "credit"); const ok = rnd(0.55 + statEdge(s, "strategy") * 0.3); if (typeof addFounderPrep === "function") addFounderPrep(s, "teamTrust", 4); if (ok) { add(s, "reputation", 5); add(s, "mood", 2); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "被抢功后用过程记录扳回，老板心里有了数。", tags: ["credit", "evidence"], intensity: 2 }); return "你拿出版本记录和原始文档，时间戳不会撒谎。老板没多说，但心里有了杆秤。那个同事讪讪地走开了。你赢了这一局——也更明白，本事得攥在自己手里，连功劳都要上锁。"; } add(s, "network", -4); return "你去争了，老板打了个哈哈和稀泥：「都是团队的功劳嘛。」不痛不痒。你忽然懂了：在别人的盘子里，你永远只是「团队」，没有名字。"; } },
      { label: "记下，从此核心的东西只攥自己手里", effect: s => { _wc(s).credit = 3; _wcStamp(s, "credit"); if (typeof addFounderPrep === "function") { addFounderPrep(s, "teamTrust", 6); addFounderPrep(s, "riskTolerance", 3); } if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "被抢功后悟出：核心资产与人，必须自己攥住。这是你日后对合伙人格外警惕的根。", tags: ["credit", "founder_seed"], intensity: 3 }); return "你什么都没说，只是默默把核心的东西收进了自己手里。这件事在你心里埋了根——将来若有一天自己当老板，股权怎么分、核心怎么握、人怎么防，你都想得格外清楚。被坑过的人，才懂得设防。"; } }
    ]
  },

  /* ===================== 三、离职补偿链 ===================== */
  {
    id: "ev_wc_sever", module: "career", ambient: true, importance: "turning",
    cond: s => _emp(s) && _wc(s).sever === 0 && (s.world && s.world.jobMarket < 42) && (s.week - (s._jobSinceWk || 0)) >= 16 && _wcCd(s, "sever", 16) && rnd(0.34),
    title: "📦 变相逼退",
    text: s => `寒气传到了你头上。公司没明着裁你，而是把你调去一个边缘岗、断了项目、停了权限——逼你「自己知难而退」。HR 约你谈话，皮笑肉不笑地递来一纸协议：「N 嘛……公司今年困难，给你 N 怎么样？大家好聚好散。」`,
    choices: [
      { label: "算了，拿了钱赶紧走", effect: s => { _wc(s).sever = 9; _wcStamp(s, "sever"); const pay = Math.round((s.job.pay || 8000) * 1 * _pi(s)); add(s, "cash", pay); s.job = null; delete s.flags.employed; flag(s, "been_laid_off"); if (typeof notifyMoney === "function") notifyMoney(s, pay, "拿了 N 的补偿，离场"); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: `被变相逼退，拿了 N（¥${pay.toLocaleString()}）走人。`, tags: ["layoff", "sever"], intensity: 2 }); return "你签了字，拿了那笔不多不少的钱。抱着纸箱走出写字楼时，阳光有点刺眼。憋屈，但你不想再耗——时间也是钱。"; } },
      { label: "谈判：至少 N+1，否则免谈", effect: s => { _wc(s).sever = 1; _wcStamp(s, "sever"); const ok = rnd(0.45 + statEdge(s, "charm") * 0.3 + statEdge(s, "strategy") * 0.2); if (ok) { const pay = Math.round((s.job.pay || 8000) * 2 * _pi(s)); add(s, "cash", pay); s.job = null; delete s.flags.employed; flag(s, "been_laid_off"); _wc(s).sever = 9; if (typeof notifyMoney === "function") notifyMoney(s, pay, "谈成 N+1 补偿"); if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 4); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: `硬气谈成 N+1（¥${pay.toLocaleString()}），这笔钱成了创业的第一桶启动金。`, tags: ["layoff", "sever", "founder_seed"], intensity: 3 }); return `你不软不硬地顶住了：「按法律来，N+1，少一分我就走劳动仲裁。」HR 掂量了一下，松了口。你多拿了一截，¥${pay.toLocaleString()} 落袋——这笔钱，你心里已经给它派了用场。`; } add(s, "stress", 6); return "HR 油盐不进：「就这条件，你考虑考虑，不然走流程对谁都不好看。」谈崩了。要钱，看来只剩下一条更硬的路。"; } },
      { label: "收集证据，准备劳动仲裁", effect: s => { _wc(s).sever = 2; _wc(s).arb = 1; _wcStamp(s, "sever"); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 3); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "被逼退后没忍，开始收集考勤/合同/调岗证据，准备仲裁。", tags: ["layoff", "arbitration"], intensity: 2 }); return "你没签。回到工位，你冷静地把考勤记录、劳动合同、那封莫名其妙的调岗通知，一份份截图、打印、归档。他们想体面地踢走你，那就别怪你不体面地讨个说法。"; } }
    ]
  },

  /* ===================== 四、劳动仲裁链 ===================== */
  {
    id: "ev_wc_arb_file", module: "career", ambient: true, importance: "turning",
    cond: s => _wc(s).arb === 1 && _wcCd(s, "sever", 3) && rnd(0.7),
    title: "⚖️ 申请劳动仲裁",
    text: s => `你把材料递到了劳动仲裁委。流程比想象中漫长：立案、排期、开庭，前后要耗上几个月。公司请了法务来拖，电话里还夹枪带棒地劝你「别把事情闹大，对你以后找工作没好处」。要不要继续？`,
    choices: [
      { label: "硬刚到底，开庭！", effect: s => { _wc(s).arb = 2; _wcStamp(s, "sever"); add(s, "stress", 8); add(s, "mood", -3); if (typeof recordBeat === "function") recordBeat(s, "industry_insight"); return "你顶住了。请了半天假去开庭，对方法务和你逐条扯皮。耗时、耗神、耗心气，但你站在那里，第一次觉得自己不是任人拿捏的螺丝钉。判决，还要再等。"; } },
      { label: "公司服软，私下和解", effect: s => { const pay = Math.round((s.job ? (s.job.pay || 8000) : 8000) * 1.8 * _pi(s)); add(s, "cash", pay); if (s.job) { s.job = null; delete s.flags.employed; } flag(s, "been_laid_off"); _wc(s).arb = 9; _wcStamp(s, "sever"); if (typeof notifyMoney === "function") notifyMoney(s, pay, "仲裁施压下，公司私了"); if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 5); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: `仲裁的压力下公司私了 ¥${pay.toLocaleString()}，也让你尝到「规则能保护人」的甜头。`, tags: ["arbitration", "founder_seed"], intensity: 3 }); return `没等开庭，公司就坐不住了——闹上仲裁对它的名声没好处。法务私下找你谈，赔了一笔不算少的钱了事。¥${pay.toLocaleString()} 到账。你赢了，也认清了一件事：规则是弱者唯一的武器，但你得敢用。`; } }
    ]
  },
  {
    id: "ev_wc_arb_result", module: "career", ambient: true, once: true, importance: "turning",
    cond: s => _wc(s).arb === 2 && _wcCd(s, "sever", 6) && rnd(0.8),
    title: "⚖️ 仲裁结果下来了",
    text: s => `几个月的拉锯，终于到了头。仲裁庭支持了你的主要诉求——违法解除，公司须按 2N 赔偿。`,
    choices: [
      { label: "拿钱，翻篇，开始下一段人生", effect: s => { const pay = Math.round((s.job ? (s.job.pay || 8000) : 9000) * 2.2 * _pi(s)); add(s, "cash", pay); if (s.job) { s.job = null; delete s.flags.employed; } flag(s, "been_laid_off"); _wc(s).arb = 9; if (typeof notifyMoney === "function") notifyMoney(s, pay, "仲裁胜诉，2N 赔偿到账"); add(s, "reputation", 3); if (typeof addFounderPrep === "function") { addFounderPrep(s, "riskTolerance", 6); addFounderPrep(s, "industryInsight", 4); } if (typeof rememberFact === "function") rememberFact(s, { id: "won_arbitration", once: true, type: "work_event", text: `打赢了劳动仲裁，2N 赔偿 ¥${pay.toLocaleString()} 到账——这笔「被欺负换来的钱」，成了你创业的底气与本钱。`, tags: ["arbitration", "founder_seed", "capital"], intensity: 4 }); return `¥${pay.toLocaleString()} 赔偿款到账。这钱不多，却烫手——它是你用几个月的煎熬和一身反骨换来的。你忽然不那么怕了：大不了重头再来。揣着这笔钱和这份不服输，你开始想，要不，自己干？`; } }
    ]
  },

  /* ===================== 五、职场荒诞单点（doc §13.1） ===================== */
  {
    id: "ev_wc_probation_cut", module: "career", ambient: true, once: true, importance: "normal",
    cond: s => _emp(s) && (s.week - (s._jobSinceWk || 0)) >= 8 && (s.week - (s._jobSinceWk || 0)) <= 16 && (s.world && s.world.jobMarket < 48) && _wcCd(s, "probation", 99) && rnd(0.18),
    title: "🗑️ 试用期最后一天，被优化",
    text: s => `试用期的最后一天，你正准备转正庆祝，HR 却把你叫了过去：「经过评估，你不太适合这个岗位……」连「N」都省了——试用期辞退，公司的成本最低。你成了财报上一个被优雅抹去的数字。`,
    choices: [
      { label: "据理力争，要个说法", effect: s => { _wcStamp(s, "probation"); s.job = null; delete s.flags.employed; flag(s, "been_laid_off"); add(s, "mood", -6); add(s, "insight", 2); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "试用期最后一天被优化，连补偿都没有。", tags: ["layoff", "probation"], intensity: 2 }); return "你争了，HR 拿出一堆「客观评估」搪塞你。试用期辞退的成本本就极低，法律给你的空间也有限。你最终空着手离开——这一课很贵：合同和试用期条款，下次得看仔细。"; } },
      { label: "认了，但记下这家公司的吃相", effect: s => { _wcStamp(s, "probation"); s.job = null; delete s.flags.employed; flag(s, "been_laid_off"); add(s, "mood", -4); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 3); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "被试用期优化后，记住了「用人即弃」的吃相——日后自己带团队绝不这样。", tags: ["layoff", "founder_seed"], intensity: 2 }); return "你没闹，收拾东西走人。但这家公司「用完即弃」的吃相，你记了一辈子。将来若自己当了老板，你告诉自己：别做这种人。"; } }
    ]
  },
  {
    id: "ev_wc_teambuild", module: "career", ambient: true, importance: "normal",
    cond: s => _emp(s) && _wcCd(s, "teambuild", 40) && rnd(0.16),
    title: "🏕️ 周末团建，强制参加",
    text: s => `周五下班前，群里弹出通知：「本周六全员团建，培养凝聚力，无特殊情况不得请假。」你本来计划好的周末，连同那点可怜的休息，就这么被「自愿」了。`,
    choices: [
      { label: "去吧，胳膊拧不过大腿", effect: s => { _wcStamp(s, "teambuild"); add(s, "stress", 4); add(s, "mood", -3); add(s, "network", 2); return "你顶着黑眼圈去做了一天的游戏、喊了一天的口号。美其名曰放松，实则比上班还累。唯一的收获，是和几个同样被坑的同事，在角落里达成了某种「天涯沦落人」的默契。"; } },
      { label: "硬刚：周末是我的，恕不奉陪", effect: s => { _wcStamp(s, "teambuild"); add(s, "mood", 3); add(s, "network", -3); if (s.job) s.job._raise = Math.max(-0.3, (s.job._raise || 0) - 0.02); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "拒绝了强制团建，守住了周末，也守住了底线。", tags: ["boundary"], intensity: 1 }); return "你回了句「周末有事，去不了」，然后顶住了主管意味深长的眼神。守住了自己的时间，也在「不合群」的名单上添了一笔。值不值，你自己心里有数。"; } }
    ]
  },
  {
    id: "ev_wc_nopay", module: "career", ambient: true, once: true, importance: "turning",
    cond: s => _emp(s) && (s.world && s.world.jobMarket < 38) && _wcCd(s, "nopay", 99) && rnd(0.2),
    title: "💸 公司发不出工资，要求「共渡难关」",
    text: s => `老板召集全员开会，声情并茂地讲述行业的寒冬与公司的不易，最后图穷匕见：「这个月工资……先缓发，等公司挺过去，大家都是功臣！希望各位和公司共渡难关。」`,
    choices: [
      { label: "共渡难关，再信他一次", effect: s => { _wcStamp(s, "nopay"); s._wagesOwed = (s._wagesOwed || 0) + Math.round((s.job.pay || 8000) * _pi(s)); add(s, "stress", 5); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "公司欠薪，被「共渡难关」的画饼留住了。", tags: ["nopay"], intensity: 2 }); return "你选择了相信。毕竟找工作也难，万一公司真挺过来了呢？你一边安慰自己，一边盯着迟迟不到账的工资，第一次对「现金流」这三个字有了切肤的恐惧——原来一家公司，是会这样悄无声息地烂掉的。"; } },
      { label: "立刻准备走人，欠薪也要追", effect: s => { _wcStamp(s, "nopay"); add(s, "insight", 2); if (typeof addFounderPrep === "function") { addFounderPrep(s, "riskTolerance", 3); addFounderPrep(s, "industryInsight", 3); } if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "公司欠薪当天就清醒了：现金流断了的船，赶紧跳。这份对现金流的警觉，日后救过自己创业的命。", tags: ["nopay", "founder_seed"], intensity: 3 }); return "「共渡难关」四个字，你听过太多次了。会一散你就开始更新简历、咨询欠薪追讨。沉船之前，老鼠最先知道。这份对现金流断裂的本能警觉，后来成了你自己当老板时最值钱的一课。"; } }
    ]
  },
  {
    id: "ev_wc_bonus_coupon", module: "career", ambient: true, once: true, importance: "normal",
    cond: s => _emp(s) && (((s.week % 52) + 52) % 52 >= 47) && _wcCd(s, "bonus", 99) && rnd(0.3),
    title: "🎟️ 年终奖，变成了优惠券",
    text: s => `年会上，老板满面红光地宣布今年的「特别福利」：每人一份「价值不菲」的大礼包——拆开一看，是公司自家产品的优惠券、一桶油，外加一句「明年一起冲」的口头鼓励。说好的年终奖，就这么蒸发了。`,
    choices: [
      { label: "笑一笑，心里凉一截", effect: s => { _wcStamp(s, "bonus"); add(s, "mood", -5); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "年终奖变成了优惠券和一桶油。", tags: ["bonus", "grudge"], intensity: 2 }); return "你跟着鼓了掌，把那桶油拎回了家。回去的路上你算了算这一年的加班时长，再看看手里的优惠券，忽然笑出了声——那种又荒诞又心酸的笑。"; } }
    ]
  },
  {
    id: "ev_wc_hr_custom", module: "career", ambient: true, once: true, importance: "normal",
    cond: s => _emp(s) && _wcCd(s, "hrcustom", 99) && rnd(0.16),
    title: "🤷 「这是行业惯例」",
    text: s => `你拿着合同去问 HR：加班费呢？为什么试用期社保按最低基数交？HR 推了推眼镜，吐出那句万能挡箭牌：「这是行业惯例啦，大家都这样的，你看哪家不是这样？」`,
    choices: [
      { label: "记下每一条「惯例」", effect: s => { _wcStamp(s, "hrcustom"); add(s, "insight", 2); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 3); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "把 HR 口中的「行业惯例」一条条记下——这些坑，将来都是合规与产品的机会。", tags: ["hr", "founder_seed"], intensity: 2 }); return "你没争，只是默默把这些「惯例」记进了备忘录。每一条不合理的潜规则背后，都是一群敢怒不敢言的打工人。你隐约觉得，这里面藏着机会——给打工人撑腰的事，总有人要做。"; } }
    ]
  },
  {
    id: "ev_wc_equity_pie", module: "career", ambient: true, once: true, importance: "turning",
    cond: s => _emp(s) && (s.job && (s.job.industry === "创业" || s.job.industry === "互联网")) && _wcCd(s, "pie", 99) && rnd(0.22),
    title: "🥧 老板请你吃「期权」",
    text: s => `老板把你叫进办公室，神秘兮兮地关上门：「小伙子我看好你。现在工资我先压一压，给你一笔期权——等公司上市，这些就是几套房！跟着我，亏待不了你。」画的饼又大又圆，香气扑鼻。`,
    choices: [
      { label: "信了，赌一把大的", effect: s => { _wcStamp(s, "pie"); if (s.job) s.job._raise = Math.max(-0.3, (s.job._raise || 0) - 0.06); flag(s, "took_equity_pie"); add(s, "stress", 3); if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 4); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "被老板用期权画饼，降薪赌上市。", tags: ["equity", "pie"], intensity: 2 }); return "你心一横，接了这张饼。工资降了，你安慰自己这是「投资未来」。从此你盯财报、盯融资进度比老板还紧——也第一次站在了「老板」的视角去看一家公司怎么活、怎么死。"; } },
      { label: "看穿了：期权不如现钱实在", effect: s => { _wcStamp(s, "pie"); add(s, "insight", 2); if (typeof addFounderPrep === "function") { addFounderPrep(s, "teamTrust", 3); addFounderPrep(s, "industryInsight", 3); } if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "看穿了期权画饼，悟到股权与信任的水有多深——日后自己分股权时格外清醒。", tags: ["equity", "founder_seed"], intensity: 2 }); return "你笑着应付过去，心里门儿清：90% 的期权最后都是废纸，能不能兑现全看老板的良心和公司的命。这堂关于「股权画饼」的课，你免费学到了——将来自己发期权时，你不想做这样的人。"; } }
    ]
  }
);
