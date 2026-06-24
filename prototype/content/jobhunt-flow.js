"use strict";
/* =====================================================================
 * content/jobhunt-flow.js —— 00 后求职多步流程 + 求职荒诞（00后职场沉浮MVP §6）
 * 求职不再一次点击就拿 offer：应届新人前几次海投基本石沉大海/已读不回/被 AI 筛，
 * 攒够投递与运气才进面。专业对口的应届岗 + 求职焦虑的荒诞事件（免费方案/群面被
 * 985 降维/面试问奇怪问题/同学晒 offer/父母催考公/假 HR 培训贷）。
 *
 * 状态：s.jobhunt = { applications, rejections, ghosted, interviews }
 * ===================================================================== */

function ensureJobhunt(s) { if (!s.jobhunt) s.jobhunt = { applications: 0, rejections: 0, ghosted: 0, interviews: 0 }; return s.jobhunt; }

/* —— 专业对口的应届岗位池（薪资符合 2020 年代普通城市应届，doc §12）。挂到 JOBS，
 *    带 majors 标记，求职时优先呈现给对口专业的新人。 —— */
const NEW_GRAD_JOBS = [
  // 计算机/软件
  { id: "ng_frontend", name: "前端开发(应届)", industry: "互联网", tier: 2, pay: 7000, stress: 8, req: { knowledge: 40 }, base: 0.4, newgrad: true, majors: ["cs"], ladder: ["初级前端", "前端工程师", "高级前端"], desc: "切图、调样式、改不完的兼容性 bug，996 起步。" },
  { id: "ng_backend", name: "后端开发(应届)", industry: "互联网", tier: 2, pay: 7500, stress: 9, req: { knowledge: 44 }, base: 0.36, newgrad: true, majors: ["cs"], ladder: ["初级后端", "后端工程师", "架构师"], desc: "增删改查、接口联调、线上事故半夜被叫起来。" },
  { id: "ng_test", name: "软件测试(应届)", industry: "互联网", tier: 1, pay: 5500, stress: 6, req: { knowledge: 32 }, base: 0.5, newgrad: true, majors: ["cs"], ladder: ["测试", "测开", "质量负责人"], desc: "点点点、写用例、背锅侠预备役，门槛相对低。" },
  { id: "ng_outsource", name: "外包开发(应届)", industry: "互联网", tier: 1, pay: 6000, stress: 9, req: { knowledge: 36 }, base: 0.55, newgrad: true, majors: ["cs", "mech"], ladder: ["外包", "外包组长", "转正?"], desc: "甲方爸爸压榨、项目赶、进不了正式员工食堂，但能快速攒经验。" },
  { id: "ng_datalabel", name: "数据标注/AI训练师", industry: "互联网", tier: 0, pay: 4200, stress: 5, req: {}, base: 0.7, newgrad: true, majors: ["cs", "art", "edu"], ladder: ["标注员", "质检", "项目管理"], desc: "给 AI 喂数据，框图、打标、纠错，机械而枯燥。" },
  // 传媒/设计
  { id: "ng_newmedia", name: "新媒体运营(应届)", industry: "传媒内容", tier: 1, pay: 5000, stress: 7, req: { charm: 30 }, base: 0.55, newgrad: true, majors: ["art", "edu", "biz"], ladder: ["运营专员", "主管", "负责人"], desc: "写推文、追热点、做选题、KPI 是阅读量，周末也得盯数据。" },
  { id: "ng_editor", name: "短视频剪辑(应届)", industry: "传媒内容", tier: 1, pay: 5500, stress: 8, req: { insight: 28 }, base: 0.5, newgrad: true, majors: ["art"], ladder: ["剪辑", "导演", "内容负责人"], desc: "通宵剪片、改到甲方满意为止、爆款全靠玄学。" },
  { id: "ng_design", name: "平面设计(应届)", industry: "传媒内容", tier: 1, pay: 5200, stress: 6, req: { insight: 30 }, base: 0.5, newgrad: true, majors: ["art"], ladder: ["设计师", "主设", "设计总监"], desc: "「五彩斑斓的黑」「logo 再大一点」，甲方的审美是道送命题。" },
  // 工商管理
  { id: "ng_marketing", name: "市场专员(应届)", industry: "销售商务", tier: 1, pay: 5000, stress: 7, req: { charm: 32 }, base: 0.5, newgrad: true, majors: ["biz"], ladder: ["专员", "经理", "总监"], desc: "做活动、写方案、对接资源，杂活全包。" },
  { id: "ng_sales_mt", name: "销售管培生(应届)", industry: "销售商务", tier: 1, pay: 4500, stress: 9, req: { charm: 34 }, base: 0.55, newgrad: true, majors: ["biz"], ladder: ["管培", "销售", "区域经理"], desc: "底薪低、看业绩、陪酒跑客户，能扛的能赚，扛不住的走人。" },
  { id: "ng_ecom", name: "电商运营(应届)", industry: "互联网", tier: 1, pay: 5500, stress: 8, req: { strategy: 30 }, base: 0.5, newgrad: true, majors: ["biz", "art"], ladder: ["运营", "主管", "操盘手"], desc: "上架、改详情、盯直通车、大促通宵，数据就是一切。" },
  { id: "ng_admin", name: "行政/人事(应届)", industry: "综合职能", tier: 1, pay: 4800, stress: 4, req: { charm: 26 }, base: 0.6, newgrad: true, majors: ["biz", "edu"], ladder: ["专员", "主管", "HRD"], desc: "订水订饭、考勤报销、组织团建，稳定但天花板低。" },
  // 师范/文科
  { id: "ng_tutor", name: "教培老师(应届)", industry: "教育", tier: 1, pay: 6000, stress: 8, req: { knowledge: 38 }, base: 0.5, newgrad: true, majors: ["edu"], ladder: ["助教", "老师", "教研"], desc: "晚上周末上课、续报压力、双减阴影下饭碗悬。" },
  { id: "ng_copywriter", name: "文案编辑(应届)", industry: "传媒内容", tier: 1, pay: 5000, stress: 6, req: { knowledge: 36 }, base: 0.52, newgrad: true, majors: ["edu", "art"], ladder: ["编辑", "主编", "主笔"], desc: "改标题、洗稿、追热点，错别字会在深夜追杀你。" },
  // 土木/机械
  { id: "ng_civil_doc", name: "工地资料员(应届)", industry: "先进制造", tier: 1, pay: 5000, stress: 6, req: { knowledge: 30 }, base: 0.55, newgrad: true, majors: ["mech"], ladder: ["资料员", "技术员", "项目工程师"], desc: "驻工地、整资料、跟验收，风吹日晒离市区远。" },
  { id: "ng_mfg_mt", name: "制造业管培生(应届)", industry: "先进制造", tier: 1, pay: 5500, stress: 6, req: { knowledge: 36, body: 30 }, base: 0.5, newgrad: true, majors: ["mech"], ladder: ["管培", "工程师", "主管"], desc: "下车间轮岗、倒班、离一线很近，成长扎实但枯燥。" },
  { id: "ng_qc", name: "质检员(应届)", industry: "先进制造", tier: 1, pay: 4800, stress: 5, req: { body: 28 }, base: 0.6, newgrad: true, majors: ["mech"], ladder: ["质检", "班组长", "品质主管"], desc: "盯细节、写报告、和产线扯皮，眼力和耐心都得在线。" }
];
if (typeof JOBS !== "undefined") { for (const j of NEW_GRAD_JOBS) if (!JOBS.find(x => x.id === j.id)) JOBS.push(j); }

// 给某专业推荐的应届岗（求职界面/海投优先用）
function newGradJobsFor(major) {
  const pool = NEW_GRAD_JOBS.filter(j => !j.majors || !major || j.majors.indexOf(major) >= 0);
  return pool.length ? pool : NEW_GRAD_JOBS;
}

/* —— 求职荒诞事件（gated 求职阶段，由 jobhunt 行动 hook 路由）。module:"work" 不被 MVP 裁掉。 —— */
function _jhStage(s) { const st = (typeof mainStageId === "function") ? mainStageId(s) : null; return st === "college_junior" || st === "job_search"; }
function _jhActive(s) { return !s.job && !has(s, "ever_employed"); }

EVENTS.push(
  {
    id: "ev_jh_ghosted", module: "work", ambient: true, importance: "normal",
    cond: s => _jhStage(s) && _jhActive(s) && ensureJobhunt(s).applications >= 2 && (s.week - (s._jhCd || -99)) >= 2 && rnd(0.5),
    title: "📵 已读不回",
    text: s => `你盯着招聘软件，那家投了三天的公司，对话框里「对方已读」四个字像针一样扎人。没有拒信，没有理由，就这么没了下文。你又刷新了一遍邮箱——「您的简历已进入人才库」，翻译过来就是：再也不会有消息了。`,
    choices: [
      { label: "麻了，继续投下一家", effect: s => { ensureJobhunt(s).ghosted++; add(s, "stress", 4); add(s, "mood", -4); if (typeof rememberFact === "function" && rnd(0.3)) rememberFact(s, { type: "work_event", text: "海投石沉大海，已读不回成了家常便饭。", tags: ["jobhunt"], intensity: 1 }); return "你深吸一口气，把这点失落咽下去，继续往下刷。海投一百家，能回三家就谢天谢地了——这就是应届的常态。"; } }
    ]
  },
  {
    id: "ev_jh_ai_filter", module: "work", ambient: true, once: true, importance: "normal",
    cond: s => _jhStage(s) && _jhActive(s) && ensureJobhunt(s).applications >= 4 && rnd(0.45),
    title: "🤖 简历被 AI 筛掉了",
    text: s => `你心仪的那个岗位，秒拒。后来才听说，大厂的简历第一关根本不是人看，是 AI：关键词不够、学校不在白名单、应届没实习……机器零点几秒就把你刷了。你精心写的自我评价，可能根本没有人类读过一个字。`,
    choices: [
      { label: "研究怎么过机筛，简历堆关键词", effect: s => { ensureJobhunt(s).rejections++; add(s, "insight", 1); add(s, "knowledge", 0.4); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 1); return "你学着把 JD 里的关键词一个个塞进简历，像在和一台冰冷的机器博弈。荒诞，但你别无选择——这年头，连被人拒绝都成了奢侈。"; } },
      { label: "认了，转头投门槛低一点的", effect: s => { ensureJobhunt(s).rejections++; add(s, "mood", -3); return "你默默把目标放低了一档。够不着的就别硬够了——先上岸，再图别的。"; } }
    ]
  },
  {
    id: "ev_jh_free_plan", module: "work", ambient: true, importance: "turning",
    cond: s => _jhStage(s) && _jhActive(s) && (s.major === "art" || s.major === "biz" || s.major === "cs") && ensureJobhunt(s).applications >= 3 && (s.week - (s._jhFreeCd || -99)) >= 8 && rnd(0.35),
    title: "🎁 「先做个方案看看实力」",
    text: s => `一家公司面试聊得不错，HR 最后「轻描淡写」地提了个要求：「你先花三天做个完整方案/demo 给我们看看，通过了就发 offer。」你熬了三个通宵，掏心掏肺地交了上去——然后，HR 消失了。再后来，你在对方的公众号/产品里，看到了你那份方案的影子。`,
    choices: [
      { label: "忍了，就当攒作品集", effect: s => { s._jhFreeCd = s.week; ensureJobhunt(s).ghosted++; add(s, "stress", 6); add(s, "mood", -6); add(s, "insight", 1); if (typeof rememberFact === "function") rememberFact(s, { type: "work_event", text: "求职时被白嫖了一份免费方案，作品被对方拿去用了。", tags: ["jobhunt", "grudge"], intensity: 2 }); return "你气得睡不着，但又能怎样？维权成本太高，证据也难固定。你把这份方案放进作品集，安慰自己：至少练了手。被白嫖的滋味，你记一辈子。"; } },
      { label: "发帖曝光这家公司", effect: s => { s._jhFreeCd = s.week; add(s, "stress", 3); add(s, "network", 2); if (rnd(0.5)) { flag(s, "got_referral"); return "你把经历发到了求职社区，没想到底下一片共鸣——好多人都被这家白嫖过。有个同样受害的网友私信你：「这家黑名单，咱们抱团取暖。」你交到了第一个「战友」。"; } return "你发了帖，骂了个痛快，也提醒了后来人。改变不了什么，但至少没让这事悄无声息地过去。"; } }
    ]
  },
  {
    id: "ev_jh_group_interview", module: "work", ambient: true, once: true, importance: "normal",
    cond: s => _jhStage(s) && _jhActive(s) && ensureJobhunt(s).applications >= 3 && rnd(0.4),
    title: "🗣️ 群面被 985 降维打击",
    text: s => `好不容易进了一场群面，八个人一组「无领导小组讨论」。你刚想发言，对面那个 985 的同学已经条理清晰地抢过了 leader 的角色，引经据典、控场自如。你憋了半天，只插上两句无关痛痒的话。面试官的目光，从头到尾没在你身上停留超过三秒。`,
    choices: [
      { label: "复盘话术，下次抢着发言", effect: s => { ensureJobhunt(s).rejections++; add(s, "charm", 0.6); add(s, "strategy", 0.4); add(s, "stress", 3); return "回去你把群面的套路研究了个遍：怎么抢 timer、怎么当 leader、怎么「总结陈词」。这套表演你看不上，但想上岸，就得先学会演。"; } },
      { label: "怀疑这种筛选方式的意义", effect: s => { ensureJobhunt(s).rejections++; add(s, "insight", 1); add(s, "mood", -3); return "你越想越觉得荒诞：一场二十分钟的表演，凭什么定义一个人能不能干活？可规则就是规则，你不玩，有的是人玩。"; } }
    ]
  },
  {
    id: "ev_jh_weird_question", module: "work", ambient: true, importance: "normal",
    cond: s => _jhStage(s) && _jhActive(s) && ensureJobhunt(s).interviews >= 1 && (s.week - (s._jhWqCd || -99)) >= 4 && rnd(0.4),
    title: "❓ 面试官问了个奇怪的问题",
    text: s => `面试进行到一半，面试官忽然抛来一个问题：「${pick(["你为什么没有实习经历？", "你能接受 996 吗？我们这是奋斗者文化。", "你结婚了吗？三年内有生育计划吗？", "井盖为什么是圆的？", "如果让你给故宫定价，你会怎么定？", "你最大的缺点是什么？（说太追求完美会扣分）"])}」你愣了一下，大脑飞速运转——这到底是在考能力，还是在挖坑？`,
    choices: [
      { label: "稳住，圆滑地接住", effect: s => { s._jhWqCd = s.week; add(s, "charm", 0.5); add(s, "strategy", 0.3); return "你斟酌着词句，把这个刁钻的问题接得不卑不亢。面试官不置可否地点点头。你不知道答得好不好，只知道这场面试像一场没有标准答案的博弈。"; } },
      { label: "据实回答，不想演", effect: s => { s._jhWqCd = s.week; add(s, "mood", 1); if (rnd(0.4)) { ensureJobhunt(s).rejections++; return "你实话实说，面试官的表情微妙地变了。后来你收到了拒信——也许是真话太刺耳。但你不后悔，有些底线比一份 offer 重要。"; } return "你坦诚作答，意外地，面试官露出了一点真实的笑意：「难得有人不背模板。」这一刻，你觉得自己被当成了人，而不是一份简历。"; } }
    ]
  },
  {
    id: "ev_jh_classmate_offer", module: "work", ambient: true, importance: "normal",
    cond: s => _jhStage(s) && _jhActive(s) && (s.week - (s._jhClsCd || -99)) >= 6 && rnd(0.35),
    title: "📱 同学在朋友圈晒 offer",
    text: s => `深夜刷朋友圈，又看到一个同学晒出了大厂 offer，配文「感谢自己一直没放弃」，下面一片点赞。而你的对话框里，还躺着今天第五封拒信。同样的起点，怎么就分出了高下？那种被同龄人甩在身后的焦虑，像潮水一样涌上来。`,
    choices: [
      { label: "被刺激，连夜刷题投简历", effect: s => { s._jhClsCd = s.week; add(s, "knowledge", 0.6); add(s, "stress", 6); add(s, "health", -2); ensureJobhunt(s).applications++; return "你合上朋友圈，点开刷题网站和招聘软件，一直熬到天亮。焦虑是把双刃剑——它能把你逼疯，也能逼你往前。今晚，你选择往前。"; } },
      { label: "默默卸载朋友圈", effect: s => { s._jhClsCd = s.week; add(s, "stress", -4); add(s, "mood", 3); return "你删掉了那个让你心慌的 App。每个人有自己的时区——你这样告诉自己。眼不见，心或许能静一点，专注走好自己的路。"; } },
      { label: "私聊问经验，放下面子", effect: s => { s._jhClsCd = s.week; add(s, "network", 2); if (rnd(0.4)) flag(s, "got_referral"); return "你咽下那点别扭，认真私聊请教。对方比想象中热心，甚至说「我们组还在招，简历发我」。原来放下面子求助，本身就是一种本事。"; } }
    ]
  },
  {
    id: "ev_jh_parents_gongwu", module: "work", ambient: true, importance: "normal",
    cond: s => _jhStage(s) && _jhActive(s) && ensureJobhunt(s).rejections >= 2 && (s.week - (s._jhPaCd || -99)) >= 8 && rnd(0.35),
    title: "📞 爸妈又催考公了",
    text: s => `老妈的电话准时响起：「工作找得咋样了？妈跟你说，别在大城市瞎折腾了，回来考个公务员/编制多好，旱涝保收，又体面。隔壁王阿姨家闺女都上岸了……」你握着手机，那头是关心，也是压力，你一时不知道该怎么回。`,
    choices: [
      { label: "嘴上答应，先稳住爸妈", effect: s => { s._jhPaCd = s.week; add(s, "stress", 4); if (typeof bumpThread === "function") bumpThread(s, "family_pressure", 12, { status: "open" }); return "你「嗯嗯啊啊」地应付过去，挂了电话却更烦了。考公还是闯荡，这道题压在你心上。父母的期待是爱，也是一座你迟早要面对的山。"; } },
      { label: "认真考虑考公这条路", effect: s => { s._jhPaCd = s.week; flag(s, "considering_gongwu"); add(s, "knowledge", 0.4); add(s, "mood", 2); if (typeof rememberFact === "function") rememberFact(s, { type: "opportunity", text: "在求职受挫与父母催促下，动了考公上岸的念头。", tags: ["gongwu", "family"], intensity: 2 }); return "你第一次认真地想：稳定，真的不好吗？你下载了公考资料。也许这不是认输，而是另一种清醒的选择——人各有志，安稳也是一种活法。"; } },
      { label: "顶回去：我想自己拼一把", effect: s => { s._jhPaCd = s.week; add(s, "mood", -3); add(s, "strategy", 0.5); if (typeof bumpThread === "function") bumpThread(s, "family_pressure", 18, { status: "open" }); return "你忍不住和老妈呛了几句：「我想趁年轻闯闯，不行吗？」电话两头都沉默了。你知道你伤了他们的心，可你也实在不甘心，还没试过就回去过那种一眼望到头的日子。"; } }
    ]
  },
  {
    id: "ev_jh_fake_hr", module: "world", ambient: true, once: true, importance: "turning",
    cond: s => _jhStage(s) && _jhActive(s) && ensureJobhunt(s).applications >= 6 && (s.cash || 0) < 20000 && rnd(0.3),
    title: "🪤 「恭喜录用，先交押金」",
    text: s => `海投这么久，终于有家「公司」热情地发来 offer，薪资高得诱人。入职前，HR 发来消息：「岗位需要先培训，培训费 6800，可以分期『培训贷』；或者交 2000 设备押金，转正退还。」走投无路的你，差点就信了——直到那串话里的破绽，让你后背一凉。`,
    choices: [
      { label: "查公司资质 + 报警/反诈", effect: s => { add(s, "insight", 3); flag(s, "dodged_trainscam"); if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2); if (typeof rememberFact === "function") rememberFact(s, { id: "dodged_trainscam", once: true, type: "anti_scam", text: "识破了假 HR 的「培训贷」骗局，没上当。", tags: ["anti_scam", "jobhunt"], intensity: 3 }); return "你上天眼查一搜，这家「公司」要么查无此名，要么一堆涉诉。所谓 offer，是裹着糖衣的培训贷陷阱——专挑你这种急着上岸的应届下手。你截图报了警。求职这条路上，连希望都可能是钩子。"; } },
      { label: "急着上岸，先交了押金", effect: s => { const lost = Math.round(2000 + Math.random() * 4800); add(s, "cash", -lost); add(s, "mood", -12); add(s, "stress", 8); if (typeof notify === "function") notify(s, { kind: "warn", title: "求职被骗", body: `交了 ¥${lost.toLocaleString()}「押金/培训费」，对方失联。` }); if (typeof rememberFact === "function") rememberFact(s, { type: "scammed", text: `求职心切，被假 HR 骗走 ¥${lost.toLocaleString()} 押金/培训费。`, tags: ["scammed", "jobhunt"], intensity: 3 }); return `太想要这份工作了，你交了 ¥${lost.toLocaleString()}。然后——「HR」失联，「公司」地址是个空壳。你站在原地，又气又恨又羞愧。原来走投无路的时候，人最容易被收割。这一课，很贵。`; } }
    ]
  }
);

if (typeof window !== "undefined") { window.NEW_GRAD_JOBS = NEW_GRAD_JOBS; }
