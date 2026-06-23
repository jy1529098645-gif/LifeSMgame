"use strict";
/* =====================================================================
 * content/events-degree.js —— 学位进阶链 & 学业关键节点叙事事件
 * ---------------------------------------------------------------------
 * 配合引擎的「学位进阶链」（本科→硕士→博士→学术职业）：
 *  · module:"degree" 非 ambient 的「去向抉择」事件，由引擎 graduateStudy()
 *    在毕业关键节点按 id 触发（ev_deg_ug_next / ev_deg_ms_next /
 *    ev_deg_phd_next / ev_deg_phd_delay）。深造分支置 s._pendingDegree，
 *    引擎钩子随后调用 continueStudy() 续读。
 *  · module:"study" ambient 事件：留学/读研周推进期按概率抽取（drawStudyEvent
 *    只放行 module==="study"），覆盖 #1 专业选课 / #3 奖学金·TA·RA /
 *    #4 校友·社团 / #5 语言门槛 / 导师关系——是否必触发与概率由事件性质定。
 *  · module:"degree" ambient 事件：博士毕业后的「学术职业阶梯」（博后→讲师
 *    →副教授→教授 / 海归 PI），在主循环按 acadRank 推进，多为 once。
 *
 * 关键节点事件在 s.study 已被置空后触发，读 s._degCarry / flags，勿读 s.study。
 * 全局 helper：add/flag/has/pick/rnd/byClass/classTier/socialShift/
 *   bumpMomentum/luckBias；留学字段读写用 study_g/study_add（见 events-study.js）。
 * 文案第二人称、有画面感；只输出中文。
 * ===================================================================== */

// 设定学术身份（博后/讲师/副教授/教授/海归 PI）：更新职业、收入、标记。
function acad_set(s, rank, name, pay, stress) {
  s.acadRank = rank;
  s.job = { id: "acad", name: name, pay: pay, stress: stress, _raise: 0 };
  flag(s, "employed"); flag(s, "academia_track");
}
// 当前是否在某个研究型在读阶段
function deg_isGrad(s) { return s.study && s.study.level && s.study.level !== "本科"; }
// 设定专业：s.major 决定将来学术冲顶能拿到哪个顶级奖项（诺奖各门类/图灵/菲尔兹）。
function deg_setMajor(s, m) {
  s.major = { id: m.id, name: m.name, field: m.field, honorName: m.honorName, honorEmoji: m.honorEmoji, honorFlag: m.honorFlag };
  flag(s, "major_chosen"); flag(s, "major_" + m.id);
}
// 学术冲顶取专业；未选过专业的兜底（极少数没触发选专业事件的情况）。
function deg_major(s) {
  return s.major || { id: "gen", name: "综合学科", field: "学术", honorName: "国际学界最高荣誉", honorEmoji: "🏅", honorFlag: "won_nobel" };
}
// 「下海经商/成果转化」→ 真正立起一家公司并接入创业经营子循环（s._enterVenture 由引擎钩子接管）。
// 学者创业自带技术壁垒：产品/团队起点高，赛道默认踩当前风口（估值对齐加成），给「做大」一个底子。
function deg_foundStartup(s, o) {
  o = o || {};
  s.startup = {
    progress: o.progress || 16, valuation: 0,
    track: o.track || s.eraWind || "硬科技",
    foundedAge: s.age, foundedWeek: s.week,
    product: o.product || 26, users: o.users || 10, team: o.team || 44,
    buzz: o.buzz || 16, runway: o.runway || 52, stage: "种子", weeksRun: 0
  };
  flag(s, "startup"); flag(s, "risk_hustle"); flag(s, "startup_exp"); flag(s, "edu_business"); flag(s, "phd_founder");
  if (has(s, "academia_track")) { delete s.flags.academia_track; s.acadRank = null; flag(s, "left_academia"); }
  s._enterVenture = true;   // 引擎在事件结算后调 enterVenture()，正式进入经营模式
}

EVENTS.push(

  /* ============================================================
   * 一、去向抉择（关键节点，由 graduateStudy 按 id 触发，非 ambient）
   * ============================================================ */

  /* 本科毕业 → 申硕深造 / 回国就业 / 留下闯荡 ---------------------- */
  {
    id: "ev_deg_ug_next", module: "degree",
    title: "🎓 本科毕业：下一步，往哪走？",
    text: (s) => {
      const c = s._degCarry || {};
      return "拨穗、合影、散伙饭——四年像被按了快进键，倏地就到了头。\n\n" +
        (c.passed
          ? "室友有人已经攥着研究生 offer，有人买好了回国的机票，还有人在投这边的工作签。轮到你站在岔路口：是再往学术深处走一程，读个硕士把含金量叠上去；还是趁着这股「应届」的热乎劲儿，赶紧下场挣钱？"
          : "你的成绩单不太好看，毕业证是低空飞过抢来的。深造这条路，分数这关就先把你挡在了外面。摆在眼前的，是怎么先把自己安顿下来——回去，还是留下？") +
        "\n\n出租屋的灯熬到很晚，这道题没有标准答案，只关乎你想要怎样的人生。";
    },
    dynamicChoices: (s) => {
      const c = s._degCarry || {};
      const arr = [];
      if (c.passed) arr.push({
        label: "🎓 申请读硕，往学术深处再走一程",
        effect: (s) => {
          add(s, "knowledge", 2); add(s, "cash", -30000);
          s._pendingDegree = "硕士";
          return "你把 GPA、推荐信、文书一样样备齐，海投了一圈。等待的日子里，每封带学校 logo 的邮件都让你心跳漏一拍。\n\n" +
            "终于，一封 Offer 落定。你给爸妈打电话报喜，那头沉默了两秒，说「读吧，家里供得起」——你知道那是咬着牙说的。背上书包，你又一次走进校门，这次的身份，是研究生。";
        }
      });
      arr.push({
        label: "🛬 海归回国，趁热打铁",
        effect: (s) => {
          add(s, "network", 10); add(s, "strategy", 6); add(s, "reputation", c.passed ? 6 : 2);
          flag(s, "haigui_back");
          return "你拖着行李箱落地祖国，潮湿的空气里全是熟悉的味道。" +
            (c.passed ? "海归的光环还在，几场面试下来，机会的门一扇扇向你打开。" : "光环褪了大半，可你认了——文凭是块敲门砖，路还得靠自己一步步走。") +
            "\n\n亲戚饭桌上的追问、招聘会上对「海归」忽高忽低的眼光，你都一一接住。这片土地是你的根，你打算在这儿，重新扎下去。";
        }
      });
      arr.push({
        label: "✈️ 留下闯荡，搏一张身份",
        effect: (s) => {
          flag(s, "overseas"); add(s, "cash", c.passed ? 60000 : 10000); add(s, "mood", -4); add(s, "health", -2); add(s, "stress", 6);
          study_add(s, "homesick", 0);
          return "你决定留下。投简历、办工签、在陌生的城市里继续漂——收入是更高了，孤独也更深了。\n\n" +
            "逢年过节，朋友圈里的故乡总让你愣神。深夜下班的地铁上，你偶尔会问自己值不值；可第二天太阳照常升起，你又系好鞋带，继续往前。这条路是你自己选的，再难也得走出个样子。";
        }
      });
      return arr;
    }
  },

  /* 硕士毕业 → 读博 / 就业 ---------------------------------------- */
  {
    id: "ev_deg_ms_next", module: "degree",
    title: "📘 硕士毕业：读博，还是上岸？",
    text: (s) => {
      const c = s._degCarry || {};
      return (c.passed
        ? "硕士论文答辩通过那天，导师问了你一句：「想不想接着读博？」\n\n这句话你想了很久。读博，意味着再赌四五年青春去换一顶博士帽，前路是窄门，是清贫，是不确定的延毕；可它也通向那个你曾偷偷向往过的身份——做研究的人，把名字印在论文上的人。\n\n另一边，同届的同学已经西装革履地进了大厂、考了选调、签了券商，月薪是你这几年补助的好几倍。"
        : "硕士读得磕磕绊绊，课题烂了尾，你拿着一纸结业灰溜溜地离场。读博？导师早没再提过这茬。\n\n眼下要紧的，是赶紧找份工作，把这几年的窟窿先填上。") +
        "\n\n窗外天色渐暗，你得给自己一个答案了。";
    },
    dynamicChoices: (s) => {
      const c = s._degCarry || {};
      const arr = [];
      if (c.passed) arr.push({
        label: "🔬 读博，把研究做到底",
        effect: (s) => {
          add(s, "knowledge", 2); add(s, "insight", 1);
          s._pendingDegree = "博士";
          return "你点了头。导师很高兴，给你留了组里最好的课题。\n\n" +
            "签下博士入学那一刻，你既兴奋又发怵——你听过太多关于「博士」的传说：发不出论文的焦虑、和导师的拉扯、延毕的阴影。但你想试试，想知道自己能不能在某个极小的领域里，真的「往前推一寸」。读博这条窄路，你走定了。";
        }
      });
      arr.push({
        label: "💼 就业上岸，把学历变现",
        effect: (s) => {
          add(s, "network", 6); add(s, "strategy", 4); add(s, "cash", 40000); flag(s, "haigui_back");
          if (!has(s, "edu_top")) flag(s, "edu_master");
          return "你把读博的念头收进抽屉，转身扎进秋招。\n\n" +
            "硕士学历是块不错的敲门砖，几轮面试下来，你拿到了像样的 offer。入职那天，看着工位上崭新的工牌，你长舒一口气：是时候靠自己的本事挣钱，把这些年家里的付出，一点点还回去了。" +
            (c.passed ? "" : "");
        }
      });
      return arr;
    }
  },

  /* 博士毕业 → 学术职业(博后) / 业界高薪 / 海归回国 ---------------- */
  {
    id: "ev_deg_phd_next", module: "degree",
    title: "🔬 博士毕业：进学术圈，还是下海？",
    text: (s) => {
      const c = s._degCarry || {};
      return (c.passed
        ? "答辩通过，博士帽到手。你成了家里、甚至整个村/小区里的第一个博士。\n\n可帽子戴上的那一刻，新的迷茫也跟着来了：是顺着这条路往下走——做博后、争教职、熬「非升即走」，赌一个未来的教授头衔？还是带着这身硬核本事下海，去业界拿一份让博士同学都眼红的高薪？又或者，回国，赶上人才引进的好时候？"
        : "读博这一仗，终究没能全胜——你拿着个结业/硕士学位收的场。学术圈的门，算是替你关上了。\n\n好在这些年的训练不是白练的，业界依然认你这身硬功夫。") +
        "\n\n你摩挲着那本烫金的证书，得替往后的人生，挑一条路了。";
    },
    dynamicChoices: (s) => {
      const c = s._degCarry || {};
      const arr = [];
      if (c.passed) arr.push({
        label: "🎓 留学术圈，从博后熬起",
        effect: (s) => {
          acad_set(s, "博后", "高校博士后", 11000, 7);
          add(s, "reputation", 4); add(s, "knowledge", 2);
          return "你递交了博后申请，进了一个不错的课题组。\n\n" +
            "博后是个尴尬的身份——不算学生，也还不是老师，拿着一份刚够体面的薪水，做着最累的活，盼着两三年后能争到一个教职。同期的同学有人已经买房买车，你的「事业」却才刚刚起步。但你认这条路：你想要的不是钱能直接买到的东西，是讲台、是实验室、是把自己的名字刻进某个学科里的可能。";
        }
      });
      arr.push({
        label: "💰 下海进业界，把本事变现",
        effect: (s) => {
          add(s, "cash", 120000); add(s, "strategy", 5); add(s, "network", 5); flag(s, "bigtech"); flag(s, "phd_industry");
          s.job = { id: "rdlead", name: "企业研发专家", pay: 42000, stress: 9, _raise: 0 }; flag(s, "employed");
          return "你把简历投向业界，博士的招牌加上扎实的硬功夫，让你在谈判桌上腰杆很硬。\n\n" +
            "一家公司开出了让你心动的价码——研发岗、带组、期权，年薪是博后的好几倍。入职那天你对自己说：学术的清贫与浪漫，不是不向往，但先让家人过上好日子，也是一种了不起的成就。你把博士论文塞进书架最高一层，转身一头扎进了产业的浪里。";
        }
      });
      if (has(s, "overseas") || c.passed) arr.push({
        label: "🛬 海归回国，赶人才引进的红利",
        effect: (s) => {
          flag(s, "haigui_back");
          if (c.passed) { acad_set(s, "讲师", "海归高校讲师", 16000, 8); add(s, "reputation", 8); add(s, "network", 8); flag(s, "haigui_pi_seed"); }
          else { s.job = { id: "rd", name: "研究院研究员", pay: 24000, stress: 8, _raise: 0 }; flag(s, "employed"); add(s, "network", 6); }
          return "你赶上了国内「抢人才」的好时候。一封封人才引进的邀请函飞来：安家费、启动经费、副教授起步的待遇——这在几年前是不敢想的。\n\n" +
            "你拖着几大箱书和数据落地祖国。空气熟悉，方言亲切，连食堂的味道都对味。" +
            (c.passed ? "学校给你配了实验室、批了名额，你站在崭新的工位前，第一次觉得：那些清贫的读博岁月，终于要开花结果了。" : "研究院的牌子很硬，你这身本事总算有了用武之地。") +
            "海归这步棋，你赌对了天时。";
        }
      });
      return arr;
    }
  },

  /* 博士延毕（关键节点，graduateStudy 在论文不达标时触发）-------- */
  {
    id: "ev_deg_phd_delay", module: "degree",
    title: "⏳ 延毕：毕业线，又往后挪了一年",
    text: (s) => "本该答辩的季节，你的论文却还差着关键的一篇。导师摊开手：「数据不够硬，强行送审只会被毙，再磨一年吧。」\n\n" +
      "「再磨一年」——这四个字像块湿棉被，闷得人喘不过气。看着同届的人一个个戴上博士帽、办了入职，你独自留在空荡荡的实验室里，听着仪器嗡嗡作响。家里的电话越来越难接，亲戚那句「怎么还没毕业」像针一样扎人。\n\n" +
      "可路已经走到这儿，退一步就是肄业，多年血本无归。你只能咬牙，把日历又往后翻了一年。",
    choices: [
      { label: "调整心态，把最后这篇论文死磕出来", effect: (s) => {
          add(s, "stress", 8); add(s, "mood", -6); add(s, "insight", 3); study_add(s, "advisor", 4);
          return "你给自己重新排了时间表，不再跟同届较劲，只跟手里的数据较劲。\n\n" +
            "延毕的这一年，你反而沉得下心了。没有了「准时毕业」的执念，论文一点点磨出了模样。你忽然明白：博士这场修行，磨的从来不只是学问，更是一个人跟自己的耐心和体面相处的本事。";
        } },
      { label: "边写边焦虑，靠咖啡和深夜硬扛", effect: (s) => {
          add(s, "stress", 12); add(s, "health", -6); add(s, "mood", -8); study_add(s, "papers", 3);
          return "你不敢停。咖啡当水喝，凌晨三点的实验室成了常态，头发一把把地掉。\n\n" +
            "论文是在往前挪，可你的身体和情绪也在悄悄垮。镜子里的人眼神发直，你有点认不出自己。延毕这年，你像一根绷到极限的弦，只盼着答辩那天快点来——别在终点线前，先断在自己手里。";
        } }
    ]
  },

  /* ============================================================
   * 二、#1 专业 / 选课（module:"study"，本科期 ambient 抽取）
   * ============================================================ */

  /* 选专业：定方向，也定了将来学术封顶能摘哪顶桂冠（near-certain 触发一次）-- */
  {
    id: "ev_study_major", module: "study", ambient: true, once: true,
    cond: (s) => s.study && s.study.level === "本科" && study_g(s, "weeksDone") >= 3 && !has(s, "major_chosen"),
    title: "📑 选专业：你要把一生押给哪门学问？",
    text: (s) => "大一的通识课上完，到了定专业的时候。这一笔，不只写进往后十年的简历——若你真在学术路上走到头，它还决定了你白发苍苍时，可能站上哪一座领奖台。\n\n" +
      "选课手册摊在桌上，每个专业名字背后，都是一种截然不同的人生，和一顶遥不可及、却并非不可能的桂冠。笔尖悬在表格上方，你深吸一口气。",
    choices: [
      { label: "🔭 物理与天文 —— 仰望星空，叩问宇宙", effect: (s) => {
          deg_setMajor(s, { id: "phys", name: "物理与天文", field: "物理学", honorName: "诺贝尔物理学奖", honorEmoji: "🏅", honorFlag: "won_nobel" });
          add(s, "knowledge", 4); add(s, "insight", 3); add(s, "strategy", 1); add(s, "stress", 3);
          return "你选了物理。从经典力学到量子场论，每一道公式背后，都是人类试图读懂宇宙的笨拙又倔强的努力。\n\n这条路冷清、烧脑、出成果慢，可你被那种「触摸世界底层规律」的震撼击中了。若干年后，那座叫「诺贝尔物理学奖」的山峰，从此模模糊糊地立在了你人生的地平线上。";
        } },
      { label: "⚗️ 化学与材料 —— 在分子尺度上造物", effect: (s) => {
          deg_setMajor(s, { id: "chem", name: "化学与材料", field: "化学", honorName: "诺贝尔化学奖", honorEmoji: "🏅", honorFlag: "won_nobel" });
          add(s, "knowledge", 4); add(s, "insight", 2); add(s, "body", 2); add(s, "stress", 3);
          return "你扎进了化学的世界。烧杯、反应釜、没完没了的实验记录——你要在原子和分子的尺度上，亲手「造」出新的物质。\n\n这是门又脏又累、却足以改变世界的学问。从新药到新材料，每一项突破都可能造福亿万人。「诺贝尔化学奖」这五个字，被你悄悄记进了心底。";
        } },
      { label: "🧬 生物与医学 —— 解开生命的密码", effect: (s) => {
          deg_setMajor(s, { id: "bio", name: "生物与医学", field: "生命科学", honorName: "诺贝尔生理学或医学奖", honorEmoji: "🏅", honorFlag: "won_nobel" });
          add(s, "knowledge", 4); add(s, "insight", 3); add(s, "charm", 1); add(s, "stress", 3);
          return "你选了生命科学。基因、细胞、神经、免疫——你想搞懂「生命」这台最精密的机器，到底是怎么运转的。\n\n这条路要熬最长的实验、坐最冷的板凳，但它直通人类最深的渴望：战胜疾病、延续生命。「诺贝尔生理学或医学奖」，成了你心里那盏遥远的灯。";
        } },
      { label: "💻 计算机与人工智能 —— 教机器思考", effect: (s) => {
          deg_setMajor(s, { id: "cs", name: "计算机与人工智能", field: "计算机科学", honorName: "图灵奖", honorEmoji: "💻", honorFlag: "won_turing" });
          add(s, "knowledge", 4); add(s, "strategy", 3); add(s, "insight", 1); add(s, "stress", 3);
          return "你一头扎进了计算机。算法、系统、人工智能——你想弄明白，怎么让一堆沉默的硅片，学会「思考」。\n\n这是这个时代最锋利的学问，既能让你下海拿天价年薪，也能让你在学术上一鸣惊人。计算机科学的最高荣誉「图灵奖」，从此成了你暗暗较劲的目标。";
        } },
      { label: "📐 数学 —— 在最纯粹的抽象里求真", effect: (s) => {
          deg_setMajor(s, { id: "math", name: "数学", field: "数学", honorName: "菲尔兹奖", honorEmoji: "📐", honorFlag: "won_fields" });
          add(s, "knowledge", 4); add(s, "mind", 3); add(s, "insight", 2); add(s, "stress", 4);
          return "你选了数学——那门别人避之不及、你却甘之如饴的「天书」。\n\n这里没有实验、没有应用的喧嚣，只有最纯粹的逻辑与抽象之美。它孤独、艰深，淘汰率惊人，但若你真有天赋又肯死磕，那枚只颁给四十岁以下天才的「菲尔兹奖」，并非全无可能。你为这个念头，心跳加速。";
        } },
      { label: "💹 经济与社会科学 —— 读懂人与世界的运行", effect: (s) => {
          deg_setMajor(s, { id: "econ", name: "经济与社会科学", field: "经济学", honorName: "诺贝尔经济学奖", honorEmoji: "🏅", honorFlag: "won_nobel" });
          add(s, "knowledge", 3); add(s, "strategy", 3); add(s, "charm", 2); add(s, "stress", 2);
          return "你选了经济学。供需、博弈、增长与危机——你想看懂这个由无数人的选择编织出来的、既理性又疯狂的世界。\n\n这门学问既能让你在金融市场里长袖善舞，也能让你在书斋里推演影响国计民生的理论。「诺贝尔经济学奖」，成了你案头那本笔记扉页上，悄悄写下的远方。";
        } }
    ]
  },

  /* 选课：神课捞分 vs 硬课含金量（反复触发，概率事件）------------ */
  {
    id: "ev_study_courseload", module: "study", ambient: true,
    cond: (s) => s.study && s.study.level === "本科" && study_g(s, "weeksDone") >= 10,
    title: "🗂️ 选课季：捞分，还是硬刚？",
    text: (s) => "新学期选课系统开放，秒杀大战一触即发。\n\n" +
      "一边是传说中的「神课」——给分高、点名少、期末划重点，专为绩点保驾护航；另一边是出了名的「硬课」——大牛教授、内容扎实、挂科率感人，但学到的东西是真本事。鼠标悬在「确认选课」上，你掂量着：是要好看的成绩单，还是要压箱底的真功夫？",
    choices: [
      { label: "抢神课，先把绩点稳住", effect: (s) => {
          study_add(s, "gpa", 5); study_add(s, "credits", 2); add(s, "stress", -3); add(s, "knowledge", -1);
          return "你手速飞快，抢到了那门人人都夸的「水课」。\n\n" +
            "一学期下来轻松惬意，期末划的重点几乎就是原题，绩点漂漂亮亮。只是合上课本时你心里清楚：这门课你其实没学到什么，那张好看的成绩单，含的水分，自己最明白。";
        } },
      { label: "硬刚大牛的课，赌真本事", effect: (s) => study_roll(s,
          0.5 + (study_g(s, "gpa") - 55) / 200 + (s.stats ? (s.stats.knowledge || 0) / 300 : 0),
          "你咬牙选了那门挂科率吓人的硬课，开学就被难度按在地上。",
          (s) => { study_add(s, "gpa", 4); study_add(s, "credits", 2); add(s, "knowledge", 5); add(s, "insight", 3); add(s, "stress", 6);
            return "熬夜啃文献、追着教授问问题，期末你竟拿了个体面的分数。\n\n这门课实打实地把你的脑子撑大了一圈。你忽然懂了什么叫「难而正确」——那些让你痛苦的东西，往往才真正喂养了你。"; },
          (s) => { study_add(s, "gpa", -7); study_add(s, "credits", 1); add(s, "knowledge", 4); add(s, "stress", 9); add(s, "mood", -6);
            return "课是真学到东西了，可期末还是没扛住，分数难看得让你不敢看绩点。\n\n你有点懊恼，又有点不服：知识确实进了脑子，只是这代价，压在 GPA 上沉甸甸的。「难而正确」的事，原来也是要付学费的。"; }) }
    ]
  },

  /* 想选的高阶课有前置没修，被卡（概率事件）--------------------- */
  {
    id: "ev_study_prereq", module: "study", ambient: true, once: true,
    cond: (s) => s.study && s.study.level === "本科" && study_g(s, "weeksDone") >= 26,
    title: "🔒 前置课没修，高阶课进不去",
    text: (s) => "你看上了一门含金量极高的高阶专业课——选它的人,简历都亮一截。可点「选课」时，系统冷冰冰弹出一行红字：「未满足先修要求」。\n\n" +
      "原来这门课要先修两门基础课你跳过了。补，就得回头啃枯燥的入门内容，还可能拖慢进度；不补，这门「镀金课」就只能眼睁睁看着别人上。",
    choices: [
      { label: "回头补先修课，按规矩一步步来", effect: (s) => {
          study_add(s, "credits", 2); add(s, "knowledge", 3); add(s, "insight", 2); add(s, "stress", 3);
          return "你认了，老老实实回去补那两门基础课。\n\n过程是有点枯燥，可补着补着你发现，之前不少似懂非懂的地方，根子原来都在这儿。等你终于够格选上那门高阶课时，底子也扎实了。有些台阶，绕不过去，那就一级一级踏稳了上。";
        } },
      { label: "找教授软磨硬泡，求个破格旁听", effect: (s) => study_roll(s,
          0.45 + study_g(s, "social") / 250 + (s.stats ? (s.stats.charm || 0) / 280 : 0),
          "你抱着试试看的心态，发邮件、堵办公室，跟教授讲自己有多想上这门课。",
          (s) => { add(s, "charm", 2); add(s, "knowledge", 3); study_add(s, "social", 3); add(s, "network", 2);
            return "教授被你的诚意打动，破例让你旁听，还说「跟不上别怪我」。\n\n你拼了命补落下的基础，居然真跟了下来。这事让你悟到：规则之外，有时候多走两步、多张一次嘴，路就宽了一分。"; },
          (s) => { add(s, "mood", -4); add(s, "stress", 3);
            return "教授很客气，但也很坚持：「先修是为你好，基础没打牢，上了也是受罪。」\n\n你碰了个软钉子，只能把这门课往后挪。有点失落，但也没辙——有些门槛立在那儿，自有它的道理。"; }) }
    ]
  },

  /* ============================================================
   * 三、#3 奖学金 / TA / RA（module:"study" ambient）
   * ============================================================ */

  /* 奖学金榜（学期末，gpa 高才触发，roll 决定中没中）------------ */
  {
    id: "ev_study_scholarship", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "gpa") >= 66 && study_g(s, "weeksDone") >= 24,
    title: "🏆 奖学金评选：榜单要出了",
    text: (s) => "学期成绩尘埃落定，系里的奖学金评选名单就要公示。\n\n" +
      "你这学期绩点不错，辅导员还特意提了一句「你有戏」。奖学金不只是几千上万块的真金白银，更是一行能写进简历、让爸妈在饭桌上挺直腰板的荣誉。你刷新着学院官网，手心有点冒汗。",
    choices: [
      { label: "刷新榜单，看自己中没中", effect: (s) => study_roll(s,
          0.4 + (study_g(s, "gpa") - 66) / 80,
          "页面加载的那几秒，长得像一个世纪。名单跳了出来，你的手指顺着往下划……",
          (s) => { const m = Math.round(8000 + (study_g(s, "gpa") - 66) * 300); add(s, "cash", m); add(s, "reputation", 4); add(s, "mood", 10); study_add(s, "social", 2); flag(s, "got_scholarship");
            return `——你的名字赫然在列！￥${m.toLocaleString()} 的奖学金到账，你第一时间给家里打了电话，那头的高兴藏都藏不住。\n\n这笔钱不光缓了生活费的紧，更是一句沉甸甸的肯定：这些埋头苦读的日子，有人看见了，也值了。`; },
          (s) => { add(s, "mood", -6); add(s, "stress", 3); add(s, "insight", 2);
            return "名单划到底，没有你。差了那么几名，擦肩而过。\n\n失落是真失落，你盯着屏幕坐了好一会儿。但转念一想，差距就在那一点点，下学期再咬咬牙、提一提，未必够不着。你把这口气，咽成了下一程的劲儿。"; }) }
    ]
  },

  /* 教授请你当 TA / 助教（gpa 够 + 中期，收入+履历+挤时间）------ */
  {
    id: "ev_study_ta", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "gpa") >= 62 && study_g(s, "weeksDone") >= 30,
    title: "🧑‍🏫 教授抛来橄榄枝：来当助教吧",
    text: (s) => "一门你考得不错的课，任课教授下课叫住了你：「下学期来给我当 TA 怎么样？带带讨论课、改改作业。」\n\n" +
      "TA 是份让人眼热的差事：有补助、能近距离跟教授混脸熟、简历上金光闪闪，读研申请时还是实打实的加分项。可它也实打实地吃时间——备课、答疑、批改，桩桩件件，都得从你本就紧巴的日程里挤。",
    choices: [
      { label: "接下来，钱和履历一起赚", effect: (s) => {
          const m = Math.round(4000 + study_g(s, "lang") * 30); add(s, "cash", m); add(s, "reputation", 5); add(s, "network", 4); add(s, "charm", 2); study_add(s, "lang", 3); add(s, "stress", 6); flag(s, "was_ta");
          return `你点了头。从此每周多了一摊事：站在讲台前给学弟学妹答疑，红笔改到手酸。\n\n累是真累，可收获也实打实——￥${m.toLocaleString()} 的补助、和教授越来越熟的关系、还有「当过 TA」这块招牌。站在讲台上的那种微妙的成就感，更是钱买不来的。这步棋，你走得值。`;
        } },
      { label: "婉拒，先顾好自己的学业", effect: (s) => {
          add(s, "insight", 2); study_add(s, "gpa", 3); add(s, "mood", 2);
          return "你客气地谢绝了：「老师，我怕分身乏术，耽误了课。」\n\n教授笑笑说「理解」。你把省下的时间还给了自己的功课和喘息，绩点稳稳的，人也没那么累。机会固然好，但量力而行、守好本分，也是一种清醒。";
        } }
    ]
  },

  /* 进实验室做 RA / 科研助理（gate，给 research_exp → 助读博）--- */
  {
    id: "ev_study_ra", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "gpa") >= 64 && study_g(s, "weeksDone") >= 40 && !has(s, "research_exp"),
    title: "🔬 实验室招科研助理：要不要进组？",
    text: (s) => "系里一位做研究的教授在招本科科研助理（RA）。名额不多，挑的都是绩点拔尖的。\n\n" +
      "进组意味着提前摸到「做研究」是什么滋味：跑数据、读文献、跟着师兄师姐打下手。它未必赚钱，甚至要倒搭时间，但若你将来想读研读博，这段经历就是简历上最硬的一块敲门砖——一封实验室 PI 的推荐信，分量抵得过十句空话。",
    choices: [
      { label: "进组，提前体验科研", effect: (s) => {
          add(s, "knowledge", 5); add(s, "insight", 4); add(s, "network", 3); add(s, "stress", 4); flag(s, "research_exp");
          return "你递了申请，面谈时教授问了几个问题，末了点头：「下周来组会吧。」\n\n实验室的日子和上课全然不同：很多事没有标准答案，失败是家常便饭。你第一次体会到，把一个未知的东西「往前推一点点」是什么感觉——既磨人，又上瘾。这段经历，悄悄替你将来的路，开了一扇门。";
        } },
      { label: "不进，科研太磨人，先享受大学", effect: (s) => {
          add(s, "mood", 4); study_add(s, "social", 4); add(s, "charm", 1);
          return "你想了想，还是没进——大学就这几年，你不想全耗在实验室里。\n\n你把时间留给了社团、朋友和该有的青春。没有对错，只是选择不同。有人在实验室里寻未来，有人在烟火气里过当下，你选了后者，并不后悔。";
        } }
    ]
  },

  /* ============================================================
   * 四、#4 校友 / 社团（module:"study" ambient）
   * ============================================================ */

  /* 校友饭局 / 内推网络（给 alumni_network → 日后求职加成）------ */
  {
    id: "ev_study_alumni", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "social") >= 38 && study_g(s, "weeksDone") >= 30,
    title: "🍷 校友饭局：递出去的那张脸",
    text: (s) => "学院组织了一场校友返校交流，来的多是毕业多年、在各行各业站稳脚跟的学长学姐。\n\n" +
      "饭局上觥筹交错，有人是大厂总监，有人自己开了公司。辅导员悄悄跟你说：「多认识认识，这些都是资源，将来内推、找工作，一句话的事。」可你性子里有点怵这种场合——主动递名片、硬聊，对你来说并不轻松。",
    choices: [
      { label: "豁出去，主动结交几位学长", effect: (s) => {
          add(s, "network", 7); add(s, "charm", 3); study_add(s, "social", 5); add(s, "stress", 3); flag(s, "alumni_network");
          return "你深吸一口气，端着杯子凑了过去，硬着头皮做自我介绍。\n\n出乎意料，学长学姐们都挺乐意提携后辈，加了微信、留了话「有事找我」。这顿饭你吃得不算自在，却织出了一张往后能真正派上用场的网。你算是懂了：人脉这东西，是在一次次脸皮发烫里攒出来的。";
        } },
      { label: "安静吃饭，这种场合实在不适应", effect: (s) => {
          add(s, "mood", 2); add(s, "insight", 1);
          return "你找了个角落安静吃饭，礼貌地笑、礼貌地听，没怎么主动搭话。\n\n散场时你有点懊恼自己的放不开，又有点释然——不是每个人都得靠饭局攒人脉。你信自己日后能用实力说话。只是路过那些热络的身影时，心里还是闪过一丝「要是再勇敢点就好了」。";
        } }
    ]
  },

  /* 当上社团负责人（领导力 / charm / strategy）----------------- */
  {
    id: "ev_study_club_lead", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "social") >= 44 && study_g(s, "weeksDone") >= 20,
    title: "🎭 社团换届：要不要挑大梁？",
    text: (s) => "你混了一年多的社团要换届了，几个伙伴一致起哄推你当社长：「就你最靠谱，扛把子非你莫属！」\n\n" +
      "当社长听着风光，实则是个操心的活：拉赞助、办活动、协调一群个性各异的人、还要替整个社团的成败兜底。它能逼出你身上的组织力和领导力，可也要从学业里硬抠出大把精力。",
    choices: [
      { label: "接下这摊子，锻炼锻炼自己", effect: (s) => {
          add(s, "charm", 4); add(s, "strategy", 4); add(s, "network", 4); study_add(s, "social", 6); add(s, "stress", 6); study_add(s, "gpa", -2); flag(s, "club_leader");
          return "你接过了社长的担子。一年下来，你拉过赞助、救过冷场的活动、调解过闹掰的成员，焦头烂额是常态。\n\n但等卸任那天回头看，你整个人都不一样了：敢拍板、能扛事、会带人。这些课堂上学不到的本事，是这摊「麻烦事」实打实喂给你的。这顶帽子，戴得值。";
        } },
      { label: "婉拒，安心当个普通成员", effect: (s) => {
          add(s, "mood", 3); study_add(s, "gpa", 2); add(s, "insight", 1);
          return "你笑着摆手：「我还是当好我的螺丝钉吧。」\n\n社团的活动你照常参加，只是不必再为它操碎心。省下的精力你还给了学业和生活，过得轻松自在。出风头的位置留给爱出风头的人，你享受自己这份不被绑架的清闲。";
        } }
    ]
  },

  /* ============================================================
   * 五、#5 语言门槛（module:"study" ambient）
   * ============================================================ */

  /* 语言不过关，被现实教做人（lang 低才触发）------------------- */
  {
    id: "ev_study_lang_wall", module: "study", ambient: true,
    cond: (s) => s.study && study_g(s, "lang") < 46 && study_g(s, "weeksDone") >= 8,
    title: "🗣️ 语言这道坎，绊了你一跤",
    text: (s) => "今天又是被语言狠狠上了一课的一天。\n\n" +
      "课上教授的玩笑全班都笑了，只有你一脸茫然；小组讨论里你憋了半天，话到嘴边却组织不成句，眼睁睁看话题从身边飘走；去银行/移民局办事，对方语速一快，你额头直冒汗，最后只能尴尬地请人家「再说一遍」。那种「明明不笨却开不了口」的憋屈，像团棉花堵在胸口。",
    choices: [
      { label: "下死功夫练，把这关硬啃下来", effect: (s) => {
          study_add(s, "lang", 8); study_add(s, "social", 3); add(s, "stress", 5); add(s, "charm", 1);
          return "你咽不下这口气。从此手机调成外语、追剧不开字幕、逼自己每天找人唠几句，脸皮厚到底。\n\n过程笨拙又难堪，磕磕绊绊、被纠正、被听不懂。可几个月下来，你惊觉自己居然能跟上课堂的玩笑了，办事也不再哆嗦。语言这堵墙，是被你用一次次尴尬，一点点凿穿的。";
        } },
      { label: "缩进华人圈，待在舒适区", effect: (s) => {
          add(s, "mood", 4); study_add(s, "homesick", -4); study_add(s, "lang", -1); study_add(s, "social", -3); add(s, "insight", 1);
          return "你索性躲进了华人圈：一起吃饭、一起上课、一起吐槽，舒服又安心，思乡的劲儿都淡了些。\n\n只是日子久了你也察觉，自己的语言原地踏步，和当地的圈子隔着一层看不见的膜。舒适区是真舒适，可那扇通往更大世界的门，也在悄悄对你关上。这笔账，迟早是要还的。";
        } }
    ]
  },

  /* 语言考试刷分（gate 选课/移民/读研，roll）-------------------- */
  {
    id: "ev_study_lang_cert", module: "study", ambient: true, once: true,
    cond: (s) => s.study && study_g(s, "lang") >= 34 && study_g(s, "weeksDone") >= 16,
    title: "📋 语言考试：这张成绩单，处处要用",
    text: (s) => "你报了名,准备啃下那场绕不开的语言标准化考试。\n\n" +
      "这张成绩单是张万能通行证：选某些高阶课要它、申研究生要它、将来办身份移民也要它。差一点点分，可能就被心仪的项目拒之门外。报名费不便宜，考位还紧张，你给自己定了个不低的目标分。",
    choices: [
      { label: "脱产猛冲一个月，全力刷高分", effect: (s) => study_roll(s,
          0.4 + (study_g(s, "lang") - 34) / 90,
          "你停掉了大部分杂事，刷真题、背模板、掐着秒表练口语，把自己逼成了一台做题机器。",
          (s) => { study_add(s, "lang", 7); add(s, "reputation", 2); add(s, "mood", 8); flag(s, "lang_certified");
            return "出分那天，你颤着手点开邮件——高过目标分！\n\n这张漂亮的成绩单，瞬间替你打开了好几道门：高阶课能选了、申研的硬指标够了、连办身份都少了块绊脚石。一个月的脱产苦熬，换来的是往后好几年的通行无阻。"; },
          (s) => { study_add(s, "lang", 3); add(s, "mood", -5); add(s, "stress", 5); add(s, "cash", -2000);
            return "分数出来,卡在目标线下面一点点,差强人意。\n\n你有点泄气,这意味着可能得再报一次、再交一次不菲的报名费。语言这东西骗不了人,实力没到,技巧补不满那最后的缺口。你把成绩单收好,盘算着什么时候再战一场。"; }) },
      { label: "裸考碰运气，省下时间干别的", effect: (s) => study_roll(s,
          0.2 + (study_g(s, "lang") - 34) / 120,
          "你没怎么准备就进了考场，全凭这些年攒下的底子硬上。",
          (s) => { study_add(s, "lang", 2); add(s, "mood", 6); flag(s, "lang_certified"); add(s, "insight", 1);
            return "万万没想到，竟然压线过了！\n\n你乐得直拍大腿——省下的备考时间还干了别的事，这波属实是「躺赢」。当然你心里也清楚，这点运气不是次次都有，底子还是得继续攒。"; },
          (s) => { add(s, "mood", -4); add(s, "cash", -1500);
            return "裸考的下场不出意外——分数惨不忍睹。\n\n白瞎了一次报名费，你摸摸鼻子认栽。有些试，真没有捷径，该下的功夫一分都省不得。下次，还是老老实实复习吧。"; }) }
    ]
  },

  /* ============================================================
   * 六、导师关系（module:"study"，研究型阶段 ambient）
   * ============================================================ */

  {
    id: "ev_deg_advisor", module: "study", ambient: true,
    cond: (s) => deg_isGrad(s) && study_g(s, "weeksDone") >= 12,
    title: "🧑‍🏫 导师这关，是读研最大的玄学",
    text: (s) => {
      const a = study_g(s, "advisor");
      return (a >= 60
        ? "你的导师是个负责又护犊子的人。这周组会后,ta留你单独聊了聊,既点拨了课题,也关心了你的状态。"
        : a >= 35
          ? "你和导师的关系不咸不淡。这周ta转手给你压了一摊杂活——报销、接待、帮ta带的项目打下手,跟你自己的课题半点不沾边。"
          : "导师最近对你明显不满,组会上当众把你的进展批得一文不值。你夹在「老板」的权威和自己的委屈之间,憋得难受。") +
        "\n\n读研这些年你算是看透了：选对导师,是玄学里的玄学。同一栋楼里,有人被当亲学生栽培,有人被当廉价劳力压榨,全看抽签的运气和相处的本事。";
    },
    dynamicChoices: (s) => {
      const a = study_g(s, "advisor");
      if (a < 35) return [
        { label: "放低姿态,主动沟通修复关系", effect: (s) => { study_add(s, "advisor", 12); add(s, "stress", 4); add(s, "insight", 2);
            return "你压下委屈,主动约导师谈了次心,摆事实、认问题、也表态度。\n\n气氛一点点缓和。你想明白了:在导师手里攥着毕业大权的现实下,硬刚是下策。把关系捋顺、把活干漂亮,才是聪明人的活法。这门「向上管理」的功课,书本里可没教。"; } },
        { label: "硬刚到底,我的尊严不容践踏", effect: (s) => { study_add(s, "advisor", -8); study_add(s, "advisorAnger", 1); add(s, "mood", -4); add(s, "stress", 6); add(s, "reputation", 1);
            return "你没忍,当场把憋了很久的话顶了回去。一时是痛快了,可空气也彻底僵了。\n\n你知道这一顶,往后的日子怕是更难。可有些底线你不想退——比起毕业,你更怕把自己活成一个连话都不敢说的影子。代价多大,只能往后再扛。"; } }
      ];
      if (a < 60) return [
        { label: "杂活照接,先把关系处好", effect: (s) => { study_add(s, "advisor", 8); add(s, "stress", 5); study_add(s, "papers", -1); add(s, "network", 2);
            return "你二话不说接下了那堆杂活,任劳任怨。\n\n自己的课题是耽误了点,但导师对你的态度肉眼可见地热络起来。你心里盘算得清楚:在毕业这件大事上,导师的一句话顶过你熬十个通宵。眼前吃点亏,是为了往后的路顺一点。"; } },
        { label: "婉拒杂活,守住自己的课题时间", effect: (s) => { study_add(s, "advisor", -4); study_add(s, "papers", 3); add(s, "knowledge", 2); add(s, "stress", 2);
            return "你委婉地推掉了一部分杂活,把时间死死守在自己的课题上。\n\n导师脸色有点不好看,但你的论文确实往前挪了。你赌的是:最终能让你毕业的,是实打实的成果,而不是替老板跑腿的苦劳。这个险,你愿意冒。"; } }
      ];
      return [
        { label: "珍惜这份师生缘,好好干", effect: (s) => { study_add(s, "advisor", 6); study_add(s, "papers", 2); add(s, "mood", 6); add(s, "knowledge", 2);
            return "有个好导师,是读研路上最大的幸运。你把这份信任化成动力,课题推得格外起劲。\n\n你也暗暗记下ta治学和待人的样子——将来若有机会站上讲台,你想成为ta那样的人。这段师生情,是你这几年最珍贵的收获之一。"; } }
      ];
    }
  },

  /* ============================================================
   * 七、学术职业阶梯（module:"degree" ambient，主循环按 acadRank 推进）
   * ============================================================ */

  /* 博后漂 → 争教职（rank=博后）-------------------------------- */
  {
    id: "ev_deg_postdoc", module: "degree", ambient: true, once: true,
    cond: (s) => has(s, "academia_track") && s.acadRank === "博后" && !has(s, "startup"),
    title: "🧳 博后漂:合同到期,教职在哪",
    text: (s) => "博后合同的尾巴一天天逼近,你的心也一天天悬起来。\n\n" +
      "这两三年你拼了命发论文、攒成果,就为了搏一个梦寐以求的教职。可高校的「青椒」坑位少得可怜,投出去的求职信石沉大海是常态。同期博后里,有人转去了第二站、第三站继续漂,有人心灰意冷转了行。你站在三十好几的年纪上,第一次认真掂量:这条窄路,还走得下去吗?",
    choices: [
      { label: "赌一把,猛攻一个高校教职", effect: (s) => study_roll(s,
          0.42 + (s.reputation || 0) / 300 + (s.stats ? (s.stats.knowledge || 0) / 360 : 0),
          "你把全部筹码押了上去:整理成果、海投教职、一场接一场地试讲面试,赌这一把能上岸。",
          (s) => { acad_set(s, "讲师", "高校讲师", 15000, 8); add(s, "reputation", 8); add(s, "mood", 12); add(s, "network", 4); flag(s, "got_faculty");
            return "录用通知邮件弹出来的那一刻,你盯着屏幕,眼眶一下子热了。\n\n你成了一名高校讲师——有了自己的工位、自己的课、自己的学生。薪水依旧清贫,头上还悬着「非升即走」的考核,可你到底是踏进了那扇曾以为遥不可及的门。多年漂泊,终于落了地。"; },
          (s) => { add(s, "mood", -10); add(s, "stress", 8); add(s, "cash", 30000); flag(s, "postdoc_drift");
            return "一圈面试下来,还是没有一所学校肯给你那个坑。\n\n你只能再签一站博后,继续漂。三十多岁,无房无车、户口悬空,看着同龄人安居乐业,那种不甘和疲惫,半夜里压得人喘不过气。学术的窄门,这一次没为你打开。你不知道,还要再敲多少回。"; }) },
      { label: "认清现实,转身去业界/转行", effect: (s) => {
          delete s.flags.academia_track; s.acadRank = null; s.job = { id: "rd", name: "企业研究员", pay: 30000, stress: 8, _raise: 0 }; flag(s, "employed"); flag(s, "left_academia"); add(s, "cash", 80000); add(s, "mood", 4); add(s, "strategy", 3);
          return "你想通了,把学术理想轻轻放下,投了几份业界的研发岗。\n\n博士的底子加上博后的训练,业界很买账,薪水一下翻了好几番。入职那天你心里五味杂陈:有遗憾,也有释然。象牙塔的灯你曾仰望了那么久,可生活要紧,家人要紧。换条路走,未必不是另一种成全。";
        } }
    ]
  },

  /* 非升即走:讲师的生死大考(rank=讲师)----------------------- */
  {
    id: "ev_deg_tenure", module: "degree", ambient: true, once: true,
    cond: (s) => has(s, "academia_track") && s.acadRank === "讲师",
    title: "⚖️ 非升即走:六年大考,一锤定音",
    text: (s) => "入职时签的那纸「非升即走」合同,到了兑现的时候。\n\n" +
      "六年聘期里,你像陀螺一样连轴转:申基金、发论文、带学生、上够课时——只为攒够评副教授的硬指标。考核委员会的结论只有两种:升,你从此端稳这碗饭;走,你这些年的拼杀清零,得卷铺盖另谋出路。这是高校青年教师最残酷也最现实的一关,没有中间地带。",
    choices: [
      { label: "背水一战,冲刺最后的考核指标", effect: (s) => study_roll(s,
          0.45 + (s.reputation || 0) / 260 + (s.stats ? (s.stats.knowledge || 0) / 320 : 0) + (has(s, "got_scholarship") ? 0.05 : 0),
          "最后一年,你把自己逼到了极限:基金本子改了十几稿,论文连轴投,身体亮起红灯也顾不上。成败,在此一举。",
          (s) => { acad_set(s, "副教授", "副教授", 23000, 7); add(s, "reputation", 12); add(s, "mood", 14); add(s, "network", 5); flag(s, "got_tenure");
            return "评审结果公示:通过!你升任副教授,拿到了那张梦寐以求的「长聘」门票。\n\n那一刻,六年的提心吊胆轰然落地。你终于不必再为下一份合同惶惶不安,可以沉下心,做点自己真正想做的研究。这碗饭,你总算端稳了。眼泪是笑着流下来的。"; },
          (s) => { delete s.flags.academia_track; s.acadRank = null; s.job = { id: "rd2", name: "企业技术专家", pay: 32000, stress: 8, _raise: 0 }; flag(s, "employed"); flag(s, "tenure_failed"); add(s, "mood", -16); add(s, "stress", 12); add(s, "cash", 60000);
            return "「未通过」三个字,把你六年的拼杀,轻飘飘地清了零。\n\n你收拾办公室那天,走廊空荡荡的。多年心血付诸东流,四十岁的人了,得重新找工作。好在业界还认你的本事,你转身进了企业。只是每次路过大学校门,心里那块地方,还是会隐隐作痛。非升即走,你终究没能升上去。"; }) }
    ]
  },

  /* 评正教授(rank=副教授)------------------------------------- */
  {
    id: "ev_deg_professor", module: "degree", ambient: true, once: true,
    cond: (s) => has(s, "academia_track") && s.acadRank === "副教授" && s.age >= 42,
    title: "🎓 评正教授:学者生涯的封顶之战",
    text: (s) => "副教授当了些年头,你的学术声望也攒到了一个台阶。系里有人开始劝你:「该冲一冲正教授了。」\n\n" +
      "正教授,是大多数学者一生追逐的顶点——它意味着学术地位、话语权、招博士生的资格,和一份体面得多的待遇。可名额金贵,竞争者个个是硬茬,还得有拿得出手的代表作和圈内的认可。这一战,是你学者生涯的封顶之战。",
    choices: [
      { label: "全力冲刺,争这顶学者的桂冠", effect: (s) => study_roll(s,
          0.5 + (s.reputation || 0) / 220 + (s.stats ? (s.stats.knowledge || 0) / 300 : 0),
          "你拿出压箱底的代表作,跑学术会议、攒同行评议、申报材料厚厚一摞。最后的冲刺,你全力以赴。",
          (s) => { acad_set(s, "教授", "教授 · 博导", 40000, 6); add(s, "reputation", 16); add(s, "mood", 16); add(s, "network", 8); flag(s, "full_professor");
            return "聘任公示那天,「教授」两个字落在你名字前面,沉甸甸的。\n\n你成了博导,有了自己的课题组、自己的学生、自己的一方天地。从当年那个连语言关都过得费劲的留学生,到如今的一方学者——这条路你走了半辈子,每一步都算数。站在讲台上,你忽然很想跟年轻的自己说一句:你看,我们真的走到了。"; },
          (s) => { add(s, "mood", -8); add(s, "stress", 6); add(s, "insight", 3); add(s, "reputation", 2);
            return "这一回,差了口气,没评上。\n\n竞争太激烈,你的代表作还差着点分量。失落是有的,但你已不像年轻时那样患得患失。副教授也好,做学问的初心没变,学生还在,研究还在。桂冠没戴上,可你早不是为了那顶帽子才走这条路的。明年,再战一回。"; }) }
    ]
  },

  /* 海归人才计划:回国当 PI 建实验室(海外学术线的高光出口)------ */
  {
    id: "ev_deg_haigui_pi", module: "degree", ambient: true, once: true,
    cond: (s) => has(s, "academia_track") && has(s, "overseas") && (s.acadRank === "博后" || s.acadRank === "讲师") && s.age >= 32 && s.age <= 45,
    title: "🛫 国家人才计划:回国建实验室?",
    text: (s) => "一封来自国内顶尖高校的邀请,躺进了你的邮箱。\n\n" +
      "国家在大力「抢人才」:给海外青年学者开出诱人的条件——副教授甚至教授起步、百万级安家费、千万级科研启动经费,还有独立组建实验室、自己当 PI(课题负责人)的机会。这在你漂泊的海外学术圈里,是想都不敢想的待遇。\n\n" +
      "可回国也意味着割舍:熟悉的科研环境、攒下的人脉、孩子的教育、还有那份「再拼几年说不定能留下」的执念。机会千载难逢,代价同样真实。",
    choices: [
      { label: "回!带着本事回国,自立门户", effect: (s) => {
          delete s.flags.overseas; acad_set(s, "教授", "海归特聘教授 · PI", 45000, 7); flag(s, "haigui_back"); flag(s, "haigui_pi"); add(s, "cash", 1500000); add(s, "reputation", 18); add(s, "network", 10); add(s, "mood", 14);
          return "你接下了邀请,带着几大箱书和数据回了国。\n\n学校兑现了承诺:崭新的实验室、充足的经费、自己说了算的课题组。你从给别人打下手的博后/讲师,一跃成了独当一面的 PI,招兵买马、定研究方向。安家费让父母终于住进了好房子,你也总算能离他们近一点。多年漂泊,这一步落子,赌的是时代的风口,你赌赢了。";
        } },
      { label: "留下,舍不得这边的科研环境", effect: (s) => {
          add(s, "mood", -4); add(s, "insight", 3); add(s, "stress", 4); add(s, "cash", 50000);
          return "你反复权衡,最终还是婉拒了。这边的科研生态、积累的合作、还有那点没甘心的执念,让你迈不开回去的腿。\n\n你继续在异乡的学术圈里拼,日子清苦却也踏实。只是每当国内传来昔日同窗「回国当了PI、要风得风」的消息,你心里总会闪过一丝复杂——那条没选的路,究竟通向哪里,你永远不会知道了。";
        } }
    ]
  },

  /* ============================================================
   * 八、学术冲顶叙事线（深耕学术者的高光出口：突破→提名→揭晓）
   *    拿什么奖由 s.major 决定（诺奖各门类 / 图灵奖 / 菲尔兹奖）。
   *    module:"degree"，引擎给 academia_track 脊柱优先级，确保推进。
   * ============================================================ */

  /* ① 重大突破：多年深耕，做出可能改写领域的成果 ----------------- */
  {
    id: "ev_acad_breakthrough", module: "degree", ambient: true, once: true,
    cond: (s) => has(s, "academia_track") && !has(s, "left_academia") && !has(s, "acad_breakthrough") &&
      (s.acadRank === "教授" || s.acadRank === "副教授" || has(s, "full_professor") || has(s, "haigui_pi")) &&
      (s.stats && s.stats.knowledge >= 58),
    title: (s) => `💡 ${deg_major(s).field}领域：一道照进黑暗的光`,
    text: (s) => {
      const m = deg_major(s);
      return `在${m.field}这片你深耕了半辈子的土地上，那个困扰了整个领域多年的难题，今晚忽然在你脑中裂开了一道缝。\n\n` +
        "你盯着草稿纸上那行刚推出来的结果，手在抖。这些年坐穿的冷板凳、被拒过的稿、熬白的头发，仿佛都是为了通向此刻。你反复验算、彻夜难眠——如果它是对的，这将不只是一篇论文，而是一块能写进教科书的基石。\n\n" +
        "可越是重大的成果，越要经得起千夫所指。发，还是再压一压、求万无一失？";
    },
    choices: [
      { label: "顶住压力，把成果完整发出去", effect: (s) => {
          add(s, "reputation", 12); add(s, "knowledge", 5); add(s, "insight", 4); add(s, "stress", 8); add(s, "mood", 10); flag(s, "acad_breakthrough");
          s.timeline.push({ age: s.age, text: `在${deg_major(s).field}领域做出里程碑式的突破，一举奠定学界地位。` });
          return "你把论文投向了领域顶刊。几个月的同行评审煎熬之后，它发表了——并迅速引爆了整个学界。\n\n" +
            "同行的引用、邀约的报告、媒体的采访纷至沓来。你的名字，第一次和「奠基性工作」这样的词连在一起。你知道，自己刚刚把人类对世界的认知，往前推了实实在在的一寸。这一寸，足以让后来者站在你的肩膀上。";
        } },
      { label: "稳一手，反复验证再公布", effect: (s) => {
          add(s, "insight", 5); add(s, "knowledge", 4); add(s, "reputation", 8); add(s, "stress", 4); flag(s, "acad_breakthrough");
          s.timeline.push({ age: s.age, text: `经多年反复验证，发表了${deg_major(s).field}领域一项扎实的奠基性成果。` });
          return "你没有急着抢首发。又花了一两年，把每一个可能的漏洞都堵死、每一组数据都重做了一遍。\n\n" +
            "等成果终于公布时，它扎实得像一块磐石，没有人能挑出毛病。学界给了它最高的评价：「教科书级的严谨」。慢，但稳——你用时间，为这项突破镀上了不容置疑的分量。";
        } }
    ]
  },

  /* ② 国际提名：你的名字进入了那个奖的候选名单 ------------------- */
  {
    id: "ev_acad_nomination", module: "degree", ambient: true, once: true,
    cond: (s) => has(s, "acad_breakthrough") && !has(s, "acad_nominated") && (s.reputation || 0) >= 52 && (s.stats && s.stats.knowledge >= 60),
    title: (s) => `📜 风声：你进了「${deg_major(s).honorName}」的候选名单`,
    text: (s) => {
      const m = deg_major(s);
      return `一个寻常的清晨，越洋电话、加密邮件、圈内挚友的暗示——几条消息不约而同地指向同一件不可思议的事：你的工作，被提名了「${m.honorName}」。\n\n` +
        `${m.honorName}，那是你少年时在图书馆仰望的名字，是无数比你聪明、比你努力的人穷尽一生都够不到的高度。如今它居然和你连在了一起。你坐在办公室里，窗外人来人往，没人知道此刻你心里掀起了怎样的惊涛骇浪。\n\n` +
        "提名不等于获奖，强手如林。但光是「候选」二字，已是对你半生跋涉，最郑重的一次回礼。";
    },
    choices: [
      { label: "稳住心神，把手头的研究继续做好", effect: (s) => {
          add(s, "reputation", 8); add(s, "insight", 3); add(s, "mood", 8); flag(s, "acad_nominated");
          s.timeline.push({ age: s.age, text: `学术成果获「${deg_major(s).honorName}」提名，跻身世界顶尖学者之列。` });
          return "你没有让这份悬而未决的荣誉乱了节奏。第二天你照常走进实验室/书房，像过去几十年那样，做手头该做的事。\n\n" +
            "你告诉自己：得不得奖，都改变不了你做研究的初心。可夜深人静时，那个念头还是会不受控制地冒出来——万一呢？万一真的是我呢？你笑着摇摇头，把它按下去，又一次。";
        } }
    ]
  },

  /* ③ 揭晓时刻：拿什么奖看专业，获奖 / 陪跑由实力+运气定 --------- */
  {
    id: "ev_acad_laureate", module: "degree", ambient: true, once: true,
    cond: (s) => has(s, "acad_nominated") && !has(s, "acad_decided") && s.age >= 48,
    title: (s) => `🎖️ 揭晓之日：${deg_major(s).honorName}`,
    text: (s) => {
      const m = deg_major(s);
      return `公布的日子到了。按惯例，得奖者会在结果向全世界宣布前的一两个小时，接到那通来自评审委员会的电话。\n\n` +
        `这天，你哪儿也没去，守在电话旁，假装若无其事地读着文献，眼睛却一遍遍瞟向那部沉默的座机。时间一分一秒地爬。${m.honorName}今年花落谁家，此刻或许已成定局，只差一通铃声，把命运递到你手里——或者，与你擦肩。\n\n` +
        "你的手心全是汗。这一刻，你等了一辈子。";
    },
    choices: [
      { label: "深吸一口气，等那通电话", effect: (s) => {
          const m = deg_major(s); flag(s, "acad_decided");
          const p = 0.4 + ((s.reputation || 0) - 52) / 120 + (s.stats ? (s.stats.knowledge - 60) / 160 : 0) + (typeof luckBias === "function" ? luckBias(s) : 0);
          if (rnd(Math.max(0.2, Math.min(0.85, p)))) {
            flag(s, "laureate"); flag(s, m.honorFlag);
            add(s, "reputation", 30); add(s, "mood", 30); add(s, "network", 12); add(s, "cash", 800000); add(s, "insight", 5);
            s.timeline.push({ age: s.age, text: `荣获${m.honorName}！站上了${m.field}领域的世界之巅，名字从此写进人类的知识史。` });
            return `电话响了。\n\n你几乎是屏着呼吸接起来的。听筒那头，一个庄重的声音用你听了一辈子的学术语言，缓缓念出了一段话——核心只有一句：恭喜你，获得了今年的${m.honorName}。\n\n` +
              `那一瞬间，世界安静了。几十年的画面排山倒海地涌来：第一次在课堂上被这门学问击中的少年、读博时差点放弃的深夜、被拒稿后红着眼重写的清晨……原来都通向这里。\n\n` +
              `你放下电话，走到窗前，泪流满面。从今往后，你的名字前面，会永远跟着一个词——${m.honorName}得主。这是一个学者所能抵达的、最遥远的远方。`;
          }
          flag(s, "acad_alsoran");
          add(s, "reputation", 12); add(s, "mood", -6); add(s, "insight", 4);
          s.timeline.push({ age: s.age, text: `${m.honorName}最终擦肩而过，但已是公认的世界级学者、一代宗师。` });
          return `电话，始终没有为你而响。\n\n奖项颁给了另一位同样卓越的同行。你怔怔地坐了很久，心里那点不甘，骗不了自己。可慢慢地，一种更宽阔的平静漫了上来——\n\n` +
            `你这辈子，做出过照亮整个${m.field}领域的工作，培养了一批批接棒的学生，把人类的认知向前推过实实在在的一程。一个奖项，定义不了这一切。能走到「候选」这一步，已是亿里挑一。你擦干那点湿润，对自己说：够了，这一生，值了。`;
        } }
    ]
  },

  /* ④ 院士：扎根国内的学者，问鼎本土学界之巅（与诺奖线并行）----- */
  {
    id: "ev_acad_academician", module: "degree", ambient: true, once: true,
    cond: (s) => has(s, "academia_track") && !has(s, "academician") &&
      (s.acadRank === "教授" || has(s, "full_professor") || has(s, "haigui_pi")) &&
      (has(s, "haigui_back") || has(s, "haigui_pi") || !has(s, "overseas")) &&
      (s.reputation || 0) >= 50 && s.age >= 50,
    title: "🏛️ 院士增选：本土学界的最高殿堂",
    text: (s) => "两年一度的院士增选，名单里出现了你的名字作为候选。\n\n" +
      "「院士」——这是国内一个学者所能获得的最高学术荣誉，是无数白发先生穷其一生争取的认可。它意味着你的学术成就，得到了整个国家科学共同体的盖章。多年扎根本土、带学生、做研究、为国家解过真问题，这份分量，沉甸甸地压在评审委员们的案头。",
    choices: [
      { label: "坦然面对评选，听凭学界公论", effect: (s) => study_roll(s,
          0.5 + ((s.reputation || 0) - 50) / 110 + (s.stats ? (s.stats.knowledge - 60) / 150 : 0),
          "材料报上去，几轮评审、答辩、公示，每一关都如履薄冰。你能做的，只有等学界给出公论。",
          (s) => { flag(s, "academician"); add(s, "reputation", 22); add(s, "mood", 20); add(s, "network", 10); add(s, "cash", 200000);
            s.timeline.push({ age: s.age, text: "当选院士，登上了本土学界的最高殿堂。" });
            return "增选名单公布那天，你的名字赫然在列——你当选了院士。\n\n从此你是国家科学殿堂里有名有姓的一员，是后辈仰望的「先生」。多年默默耕耘，国家以最高的学术荣誉，向你郑重致意。你抚摸着那枚徽章，想起年轻时的自己，眼眶发热：这条路，没有白走。"; },
          (s) => { add(s, "reputation", 6); add(s, "mood", -5); add(s, "insight", 3);
            return "这一届，你没能当选。竞争太激烈，名额太金贵，差了那么一线。\n\n失落难免，但你早已不是为头衔做学问的年纪。学生还在、课题还在、那些被你解决过的真问题还在造福着人们。院士与否，你都是你。你拍拍身上的尘，转身又走回了那间亮着灯的实验室。"; }) }
    ]
    },

  /* ============================================================
   * 九、高学历 × 商业机会（module:"degree"，主循环 ambient）
   *    高学历不只是学术资本，也是叩开商业大门的金字招牌——
   *    成果转化、被资本追逐、名校光环助融资。gate 高学历，非学术专属。
   * ============================================================ */

  /* ① 科技成果转化：你的本事被资本看中，要不要下场创业 */
  {
    id: "ev_edu_biz_transfer", module: "degree", ambient: true, once: true,
    cond: (s) => !s.study && !has(s, "startup") && s.age >= 27 && s.age <= 52 &&
      (has(s, "edu_phd") || has(s, "edu_top") || has(s, "edu_master") || has(s, "abroad_honors")),
    title: "🧪 有人盯上了你脑子里的东西",
    text: (s) => {
      const f = s.major ? s.major.field : "你深耕的专业";
      return `一个西装革履的投资人，辗转找到了你。他看中的不是你的人，是你脑子里那套${f}的硬功夫。\n\n` +
        "「现在市场上最缺的就是真懂技术的人，」他把一份计划书推到你面前，「你的专长能落地成产品，我出钱、出团队，你出脑子和名头——做成了，身价翻几十倍。」\n\n" +
        "灯火通明的咖啡馆里，你第一次真切地意识到：原来自己这身『不挣钱』的学问，在另一个世界里，是抢手的硬通货。";
    },
    choices: [
      { label: "下场创业，把学问做成产品（进经营模式）", effect: (s) => {
          add(s, "cash", 150000); add(s, "network", 6); add(s, "strategy", 4); add(s, "stress", 8); flag(s, "bigtech");
          deg_foundStartup(s, { track: s.eraWind, product: 32, buzz: 18, team: 46, runway: 56, progress: 18 });
          return "你接下了这摊事，以技术入股的方式成了联合创始人，正式 all-in。\n\n从象牙塔到商海，落差不小：你要学着看报表、谈客户、管团队。但把自己的研究亲手变成千万人在用的产品，那种成就感，和发论文是两种不同的痛快——从今天起，公司能做多大，全看你自己。";
        } },
      { label: "只授权专利/技术，安心收钱不操心", effect: (s) => {
          const m = Math.round(200000 + (s.stats ? s.stats.knowledge * 2000 : 0)); add(s, "cash", m); add(s, "insight", 2); flag(s, "edu_business");
          return `你不想被创业的琐事缠身，只把技术/专利授权出去，坐收一笔可观的转让费和分成——到手 ¥${m.toLocaleString()}。\n\n你依旧做你的学问，只是账户里多了一串零。原来知识真的能直接变现，而且不必出卖你最珍视的那份清静。这是属于聪明人的双赢。`;
        } },
      { label: "婉拒——我的心思只在学问上", effect: (s) => {
          add(s, "insight", 3); add(s, "mood", 2);
          return "你礼貌地推辞了。商海再诱人，也不是你想要的活法。\n\n投资人遗憾地收起计划书，临走撂下一句「想通了随时找我」。你笑笑，转身回到书桌前。有人天生为名利而生，而你，只想安安静静地，把那个困扰你多年的问题想明白。";
        } }
    ]
  },

  /* ② 金融/咨询高薪挖角：高学历被资本市场争抢 */
  {
    id: "ev_edu_biz_headhunt", module: "degree", ambient: true, once: true,
    cond: (s) => !s.study && s.age >= 25 && s.age <= 45 && !has(s, "startup") &&
      (has(s, "edu_top") || has(s, "edu_phd") || has(s, "haigui_back") || has(s, "abroad_honors")),
    title: "📞 猎头：投行/咨询想用高薪挖你",
    text: (s) => "一个顶级猎头打来电话，开口就是让你心跳加速的数字。\n\n" +
      "「头部投行/咨询/大厂战略部门，正在抢像你这样背景的人，」对方语气笃定，「高学历、名校、海外经历——你这块招牌，在我们这行就是硬通货。年薪我可以帮你谈到一个你现在想都不敢想的数。」\n\n" +
      "你看了看自己眼下不算宽裕的收入，又看了看手头正做的事，一时有点恍惚。",
    choices: [
      { label: "跳过去，先让自己挣得体面", effect: (s) => {
          if (has(s, "academia_track")) { delete s.flags.academia_track; s.acadRank = null; flag(s, "left_academia"); }
          s.job = { id: "finance", name: "投行/咨询 高级岗", pay: 45000, stress: 11, _raise: 0 }; flag(s, "employed"); flag(s, "edu_business");
          add(s, "cash", 100000); add(s, "network", 7); add(s, "strategy", 4); add(s, "mood", 6);
          return "你接下了 offer，西装一穿，扎进了高强度、高回报的金融/咨询圈。\n\n收入翻了好几番，出入是写字楼顶层和五星酒店。代价是没日没夜的加班和飞来飞去的疲惫。但你不后悔——你这身学历总算兑换成了实打实的体面生活。知识，确实能变现。";
        } },
      { label: "不动心，守着自己认定的事", effect: (s) => {
          add(s, "insight", 3); add(s, "reputation", 2);
          return "你谢绝了这份诱人的 offer。钱很香，但你心里那杆秤，分量更重的是别的东西。\n\n猎头不解地挂了电话。你回到自己的节奏里，踏实。能拒绝一个『正确答案』，本身就说明，你已经想清楚自己要什么了。";
        } }
    ]
  },

  /* ③ 校友/导师天使投资：名校人脉给你的想法投钱 */
  {
    id: "ev_edu_biz_angel", module: "degree", ambient: true, once: true,
    cond: (s) => !s.study && s.age >= 26 && s.age <= 50 &&
      (has(s, "edu_top") || has(s, "alumni_network") || has(s, "haigui_back") || has(s, "abroad_honors")),
    title: "🤝 校友饭局上，有人要给你投钱",
    text: (s) => "一场校友聚会，几杯酒下肚，你随口聊起一个琢磨了很久的想法。\n\n" +
      "席间一位事业有成的学长眼睛亮了：「这个有搞头！这样——我给你天使投资，咱们校友的项目，我信得过。」其他人也跟着起哄帮腔。你这才发现，名校这层关系网，关键时刻能直接变成启动资金和背书。",
    choices: [
      { label: "接下这笔钱，把想法落地（进经营模式）", effect: (s) => {
          add(s, "cash", 300000); add(s, "network", 8); add(s, "strategy", 3); add(s, "stress", 5); flag(s, "alumni_network");
          deg_foundStartup(s, { track: s.eraWind, product: 24, buzz: 22, team: 42, runway: 66, progress: 16 });
          return "你接下了学长的天使投资，校友圈还七手八脚帮你凑齐了第一拨人和资源，公司就这么正式开张了。\n\n你头一回真切体会到：名校的同窗之谊，不只是情怀，在商业世界里，它是实打实能撬动资源的杠杆。账上有了第一笔钱，跑道也宽，接下来——就看你能把它做到多大。";
        } },
      { label: "心领了，时机还不成熟", effect: (s) => {
          add(s, "insight", 2); add(s, "network", 3);
          return "你谢过学长的好意，说想法还没想透，不敢拿大家的钱冒险。\n\n学长赞许地点头：「靠谱，想清楚了随时找我。」你把这份人情和这条门路记在心里。机会还在，急不得——你信自己看准了再出手，会走得更稳。";
        } }
    ]
  },

  /* ④ 名校光环助融资：已在创业者，高学历让资本高看一眼 */
  {
    id: "ev_edu_biz_halo", module: "degree", ambient: true, once: true,
    cond: (s) => !s.study && has(s, "startup") && !has(s, "startup_done") &&
      (has(s, "edu_top") || has(s, "edu_phd") || has(s, "abroad_honors") || has(s, "haigui_back")),
    title: "🎓 路演现场，你的学历成了加分项",
    text: (s) => "融资路演的会议室里，投资人翻着你的 BP，目光在你的教育背景那一栏停了停。\n\n" +
      "「博士/名校/海归创业……」他点点头，语气明显软了下来，「技术型创始人，我们就喜欢这种有真东西的。」你忽然意识到，那张你曾以为『不当吃不当喝』的文凭，此刻正实实在在地，替你的估值加着分。",
    choices: [
      { label: "顺势把技术壁垒讲透，拉高估值", effect: (s) => {
          add(s, "reputation", 6); add(s, "network", 5); add(s, "strategy", 3); flag(s, "edu_business");
          if (s.startup) { s.startup.valuation = Math.round((s.startup.valuation || 100000) * 1.3); if (s.startup.buzz != null) s.startup.buzz += 6; }
          add(s, "cash", 80000);
          return "你抓住机会，把自己学术背景里那套别人抄不走的技术壁垒讲得明明白白。\n\n投资人越听越认可，估值谈判里你硬气了不少，最终拿到了更好的条件。这一刻你彻底明白：高学历在商业世界里，从来不是摆设，而是一道让对手不敢小觑、让资本愿意溢价的护城河。";
        } },
      { label: "低调些，靠产品数据说话", effect: (s) => {
          add(s, "insight", 3); add(s, "reputation", 3);
          if (s.startup && s.startup.buzz != null) s.startup.buzz += 3;
          return "你没怎么强调学历，而是把用户数据和增长曲线摆上桌。\n\n投资人对这份务实也颇有好感。你心里清楚，光环能锦上添花，但真正留得住资本的，永远是产品本身。你愿意让事实，替你说话。";
        } }
    ]
  }

);
