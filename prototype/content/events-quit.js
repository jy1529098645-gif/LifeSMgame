"use strict";
/* =====================================================================
 * content/events-quit.js —— 辞职 / 脱离系统【枢纽 + 氛围】模块
 * 主题：给「上班 / 寄人篱下」的玩家一个主动「脱离」的出口。
 *   ① 枢纽事件 ev_quitx_menu：非 ambient，由引擎新增的「🚪 辞职/脱离」
 *      行动按 id 显式触发，dynamicChoices 按当前 state 动态拉起脱离选项。
 *   ② 7~9 个 ambient 氛围事件：受够老板想辞、辞后空窗焦虑、家人反对、
 *      前同事/前老板回挖、辞职创业半年回望、寄人篱下想搬出去、考公围城、
 *      中年裸辞孤注一掷。多数 gate employed / civil_servant，半数带两层对白。
 *
 * 经典 <script> 全局作用域：EVENTS 已存在，直接 push；
 * 只用全局 helper（add/flag/has/pick/rnd/byClass/classTier/shuf/
 *   socialShift/socialBoostRole）；内部辅助一律 quitx_ 前缀。
 *
 * 脱离的标准写法（在 effect 里）：
 *   辞掉普通工作    = s.job=null; delete s.flags.employed;
 *   在编辞职下海    = s.civilRank=0; delete s.flags.civil_servant; s.job=null; flag(s,"revolving_door");
 * ===================================================================== */

// —— 内部辅助：随机一个虚构同事/前同事/亲友称呼 ——
function quitx_pickName() {
  return pick(["老周", "王磊", "小林", "陈姐", "阿哲", "刘工", "赵敏", "小吴", "老张"]);
}
// —— 内部辅助：跳槽 / 脱离博弈成功率（谋略 + 魅力加成，封顶 0.9） ——
function quitx_rate(s, base) {
  return Math.min(0.9, base + s.stats.strategy / 250 + s.stats.charm / 300);
}
// —— 内部辅助：执行「辞掉普通工作」的标准副作用 ——
function quitx_leaveJob(s) {
  s.job = null;
  delete s.flags.employed;
}
// —— 内部辅助：执行「在编辞职下海」的标准副作用 ——
function quitx_leaveCivil(s) {
  s.civilRank = 0;
  delete s.flags.civil_servant;
  s.job = null;
  flag(s, "revolving_door");
}
// —— 内部辅助：重新入职一个【字段完整】的岗位 ——
// 关键：必须带 pay/stress 等数值字段，否则「上班」时 jobSalary 会算出 NaN → 现金被污染成 NaN。
function quitx_reemploy(s, name, pay, stress) {
  if (s.job && typeof s.job.pay === "number") { s.job.name = name; return s.job; } // 已有完整工作则沿用
  s.job = { id: "reemploy", name: name, industry: "综合职能", tier: 2, pay: pay, stress: stress, req: {}, base: 0.5, _raise: 0, level: 0, ladder: ["职员", "主管", "负责人"] };
  return s.job;
}

/* =====================================================================
 * ① 枢纽事件：辞职 / 脱离菜单（非 ambient，引擎按 id 触发）
 * ===================================================================== */
EVENTS.push({
  id: "ev_quitx_menu", module: "work",
  title: "🚪 辞职 / 脱离",
  text: (s) => has(s, "employed") || has(s, "civil_servant") || has(s, "startup")
      ? "你盯着工位发了会儿呆。这份营生，是该继续耗着，还是趁早抽身？"
      : "你眼下并没有要脱身的正经工作或编制。真要折腾，也得先有个东西可辞。",
  dynamicChoices: (s) => {
    var opts = [];

    // —— 在编：裸辞下海 ——
    if (has(s, "civil_servant")) {
      opts.push({ label: "裸辞下海，编制不要了", next: (s) => ({
          text: (s) => "递辞呈那天，科里炸了锅。" + quitx_pickName() + "把你堵在走廊：「铁饭碗你说扔就扔？外头那风浪，你扛得住？」你攥着那张盖了红章的辞呈，手心全是汗。",
          choices: [
            { label: "干脆下海，把编制连根拔了", effect: (s) => {
                quitx_leaveCivil(s);
                add(s, "stress", 8); add(s, "mood", 6); add(s, "cash", -15000); add(s, "strategy", 2);
                if (rnd(quitx_rate(s, 0.28))) {
                  add(s, "cash", 60000); add(s, "network", 4); add(s, "reputation", 3);
                  return "你头也不回地走了。攒下的人脉和那点胆识，半年内就接到了第一单大活——下海第一桶金，浇灭了所有「你疯了」的耳语。编制没了，天却宽了。";
                }
                add(s, "cash", -10000); add(s, "mood", -4);
                return "你成了「旋转门」外那个回不去的人。市场远比机关凶险，前几个月颗粒无收，存款肉眼可见地往下掉。你第一次怀念那份按月到账的安稳——可门，已经在身后焊死了。";
              } },
            { label: "临门一脚，还是收手了", effect: (s) => {
                add(s, "stress", 4); add(s, "mood", -3); add(s, "insight", 2);
                return "你把辞呈又揣回了兜里。「再想想」三个字，把一腔热血浇了回去。编制还在，可那扇望向外面的窗，从此关不严了。";
              } }
          ]
        }) });
    }
    // —— 普通在职：跳槽 / 裸辞 / 辞职创业 ——
    else if (has(s, "employed")) {
      opts.push({ label: "骑驴找马，体面跳槽", effect: (s) => {
          // 不立刻离职，进入「找下家」心态
          flag(s, "job_hunting");
          add(s, "insight", 2); add(s, "strategy", 2); add(s, "stress", 3);
          return "你没声张，先把简历悄悄挂了出去，骑驴找马。白天照常打卡，晚上偷偷面试——体面的离开，是脚还没离地，下一根藤已经攥在手里。";
        } });
      opts.push({ label: "裸辞，先歇口气再说", next: (s) => ({
          text: (s) => "辞职信的光标在屏幕上闪。没了底薪，房租、花呗、爸妈的电话……一桩桩涌上来。可一想到再也不用看" + quitx_pickName() + "的脸色，你又长舒一口气。",
          choices: [
            { label: "真裸辞，先把自己捞出来", effect: (s) => {
                quitx_leaveJob(s);
                flag(s, "gap_year"); add(s, "mood", 8); add(s, "stress", -6); add(s, "cash", -6000); add(s, "health", 3);
                return "你点了「发送」。那一刻浑身轻飘飘的——没了底薪，也没了枷锁。睡到自然醒的第一个早晨，你忽然想起自己原来也是个活人。代价后头算，自由先享了再说。";
              } },
            { label: "怂了，还是继续干吧", effect: (s) => {
                add(s, "stress", 4); add(s, "mood", -3);
                return "你删掉了那封没发出去的辞职信。账单比尊严更沉，你叹口气，又把自己塞回了工位。成年人的退出，往往卡在「下个月房贷」这四个字上。";
              } }
          ]
        }) });
      opts.push({ label: "辞职创业，赌一把大的", effect: (s) => {
          quitx_leaveJob(s);
          flag(s, "risk_hustle");
          add(s, "stress", 8); add(s, "cash", -20000); add(s, "strategy", 2); add(s, "mood", 4);
          return "你把工牌往桌上一拍：「这班，老子不上了。」拿出全部积蓄租了间小办公室，赌一把大的。没了退路的人，眼里只剩前方——成王败寇，从今天起自己说了算。";
        } });
    }

    // —— 创业中：关掉摊子回去打工 ——
    if (has(s, "startup")) {
      opts.push({ label: "关掉自己的摊子，回去打工", effect: (s) => {
          delete s.flags.startup;
          flag(s, "startup_closed");
          add(s, "mood", -6); add(s, "stress", -4); add(s, "insight", 3); add(s, "cash", -10000);
          return "你给团队发了最后一条消息，谈好遣散，注销了那家撑了许久的小公司。关灯锁门那一刻，心里空了一块。回去打工不丢人——先把日子稳住，心气，留着下回再说。";
        } });
    }

    // —— 永远的兜底选项 ——
    opts.push({ label: "算了，再忍忍", cancel: true, effect: (s) => {
        add(s, "stress", 2);
        return "你把辞职的念头又咽了回去。成年人的退出，往往比想象中难开口——这点功夫，没耽误你这周的正事。";
      } });

    return opts;
  }
});

/* =====================================================================
 * ② 氛围事件（ambient）
 * ===================================================================== */

/* —— 1. 受够老板，动了辞职念头（两层对白） —— */
EVENTS.push({
  id: "ev_quitx_fed_up", module: "work", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 22,
  title: "😤 又一次想把工牌摔了",
  text: (s) => { var r = quitx_pickName(); return "周一早会，" + r + "把锅又一次扣到你头上，老板顺势加码：「这点压力都扛不住，怎么进步？」散会后你盯着电脑屏幕，「辞职」两个字在脑子里反复横跳。"; },
  choices: [
    { label: "压住火，先把退路盘清楚", next: (s) => ({
        text: (s) => "你没冲动，午休躲到楼梯间，掰着指头算：存款够撑几个月？下家好不好找？房贷还差几年？算盘珠子噼啪响。",
        choices: [
          { label: "盘明白了，开始悄悄找下家", effect: (s) => {
              flag(s, "job_hunting"); add(s, "strategy", 2); add(s, "insight", 2);
              return "你算清了账：留得住情绪，留不住心。当晚就把简历更新了，骑驴找马。真正的脱离，是从一笔笔算清退路那刻开始的。";
            } },
          { label: "一算账，发现还走不了", effect: (s) => {
              add(s, "stress", 4); add(s, "mood", -3); add(s, "insight", 1);
              return "算完账你泄了气：房贷、孩子、断不起的社保。辞职的勇气，被生活的账单一项项扣了下来。你把火咽回肚里，继续打卡。";
            } }
        ]
      }) },
    { label: "忍了，谁还没受过气", effect: (s) => { add(s, "stress", 5); add(s, "mood", -4); add(s, "insight", 1); return "你深吸一口气，把那口火按了下去。受气的不止你一个，可这口气憋久了，总有一天会憋出别的病来。"; } }
  ]
});

/* —— 2. 裸辞后的空窗焦虑 / 存款见底（两层对白） —— */
EVENTS.push({
  id: "ev_quitx_gap_anxiety", module: "work", ambient: true,
  cond: (s) => has(s, "gap_year") && !has(s, "employed") && !has(s, "civil_servant"),
  title: "📉 裸辞第三个月，存款见底",
  text: (s) => "裸辞的新鲜劲早过了。日历翻到第三个月，余额数字一天比一天扎眼。前同事群里有人晒升职，你点开招聘软件，又默默退了出来——「再歇歇」和「该慌了」在心里打架。",
  choices: [
    { label: "逼自己重启，海投简历", next: (s) => ({
        text: (s) => "你把自己从被窝里揪出来，理了发、改了简历、一口气投了三十家。可隔了大半年的空窗期，成了面试官嘴边的那句「你这段时间在做什么？」",
        choices: [
          { label: "把空窗包装成「主动充电」", effect: (s) => {
              add(s, "stress", 4); add(s, "charm", 1);
              if (rnd(quitx_rate(s, 0.42))) {
                flag(s, "employed"); quitx_reemploy(s, "新东家", 9000, 7);
                add(s, "cash", 8000); add(s, "mood", 6); add(s, "strategy", 2);
                return "你把空窗说成「停下来想清楚方向、考了证、做了项目」，逻辑一套接一套。面试官信了，offer 到手。上岸那刻你才松口气——原来岸边，比想象中难爬。";
              }
              add(s, "mood", -5); add(s, "cash", -5000);
              return "你说得天花乱坠，对方却只淡淡一句「我们再看看」。一连串已读不回，存款又薄了一层。裸辞的浪漫，正被现实一点点退潮。";
            } },
          { label: "降薪降级，先上岸再说", effect: (s) => {
              flag(s, "employed"); quitx_reemploy(s, "新东家（降级）", 6000, 6);
              add(s, "cash", 3000); add(s, "mood", -2); add(s, "insight", 2);
              return "你咬牙接了个比原来低一档的岗位。钱少、面子也挂不住，但好歹重新有了打卡的地方。先活下来，再谈别的——空窗教会你的，是低头。";
            } }
        ]
      }) },
    { label: "再撑撑，等个好机会", effect: (s) => { add(s, "stress", 6); add(s, "cash", -8000); add(s, "mood", -4); return "你说服自己「好饭不怕晚」，继续宅着等机会。可机会没来，账单先来了。存款见底的滋味，比上班还熬人。"; } }
  ]
});

/* —— 3. 家人激烈反对裸辞（两层对白） —— */
EVENTS.push({
  id: "ev_quitx_family_object", module: "work", ambient: true,
  cond: (s) => has(s, "employed") && (has(s, "married") || s.age < 30),
  title: "🍚 饭桌上的「你疯了吗」",
  text: (s) => has(s, "married")
      ? "你试探着说出辞职的打算，伴侣的筷子停在半空：「房贷还有二十年，孩子要上学，你说不干就不干？」饭桌上的空气，一下子凝住了。"
      : "你跟爸妈提了一句想辞职，我妈当场就急了：「我们供你读书是让你瞎折腾的？好好的工作说扔就扔，街坊问起来我脸往哪搁？」",
  choices: [
    { label: "摊开讲，争取家里支持", next: (s) => ({
        text: (s) => "你没硬顶，把规划摊在桌上：手里有多少存款、下家方向是什么、最坏能撑几个月。你说：「给我半年，撑不住我立马回去上班。」",
        choices: [
          { label: "立军令状，许下兜底承诺", effect: (s) => {
              add(s, "stress", 5);
              if (rnd(quitx_rate(s, 0.4))) {
                flag(s, "family_backed"); add(s, "mood", 6); add(s, "network", 2);
                return "你把退路和底线讲得明明白白，对方沉默良久，最终点头：「那我陪你赌这一回。」有了家里这句话，你心里那块石头，落了地。";
              }
              add(s, "mood", -4);
              return "你说得诚恳，可对方就是不松口：「不是不信你，是这个家赌不起。」饭桌不欢而散。最难翻越的山，有时是自己的家人。";
            } },
          { label: "先妥协，改成骑驴找马", effect: (s) => {
              flag(s, "job_hunting"); add(s, "insight", 2); add(s, "mood", 2);
              return "你退了一步：「那我不裸辞，先骑驴找马，找好下家再走。」家里这才松口。少了几分痛快，多了几分稳妥——成家的人，退出从来不只是自己的事。";
            } }
        ]
      }) },
    { label: "瞒着先斩后奏", effect: (s) => { quitx_leaveJob(s); flag(s, "gap_year"); add(s, "stress", 7); add(s, "mood", 3); add(s, "network", -2); return "你没再争，第二天就偷偷把辞职信递了，打算先斩后奏。痛快是痛快了，可纸终究包不住火——等家里知道那天，又是一场仗。"; } }
  ]
});

/* —— 4. 前同事/前老板回来挖你 —— */
EVENTS.push({
  id: "ev_quitx_headhunt_back", module: "work", ambient: true,
  cond: (s) => (has(s, "gap_year") || has(s, "risk_hustle") || has(s, "startup")) && !has(s, "civil_servant"),
  title: "📱 前老板深夜的一条微信",
  text: (s) => { var r = quitx_pickName(); return "你脱离职场（或单干）一阵子了。深夜，前老板" + r + "忽然发来微信：「兄弟最近怎么样？公司新开了条线，缺个能扛事的，待遇好谈，回来帮哥一把？」当年闹得不算愉快，可这橄榄枝来得正是时候。"; },
  choices: [
    { label: "回去可以，但要谈清条件", next: (s) => ({
        text: (s) => "你没急着答应，约了顿饭。席间你把话挑明：「回去行，但当年画的饼得落到纸上——职级、薪资、期权，白纸黑字。」对方端起酒杯笑了笑。",
        choices: [
          { label: "咬死筹码，要带头衔回去", effect: (s) => {
              add(s, "stress", 4);
              if (rnd(quitx_rate(s, 0.38))) {
                flag(s, "employed"); quitx_reemploy(s, "前东家·新线负责人", 22000, 10);
                if (has(s, "startup")) delete s.flags.startup;
                add(s, "cash", 50000); add(s, "reputation", 4); add(s, "strategy", 2);
                return "你拿当年的离开当筹码，反客为主。对方爽快应了：带新线、涨薪、给股。「杀回马枪」杀得漂亮——出走一趟，反倒抬高了自己的身价。";
              }
              add(s, "mood", -3);
              return "你要价太硬，对方脸上的笑淡了：「兄弟，我这是雪中送炭，不是请大爷。」一顿饭吃得尴尬，回去的事，黄了。";
            } },
          { label: "看在旧情，平价回去就好", effect: (s) => {
              flag(s, "employed"); quitx_reemploy(s, "前东家", 12000, 8);
              if (has(s, "startup")) delete s.flags.startup;
              add(s, "cash", 12000); add(s, "network", 3); add(s, "mood", 4);
              return "你没多计较，看在旧情上平价回了去。熟门熟路，省了磨合。绕了一圈又回到原点，可这一圈走得不亏——你比当年，更知道自己要什么。";
            } }
        ]
      }) },
    { label: "回头草不吃，婉拒了", effect: (s) => { add(s, "mood", 3); add(s, "insight", 2); return "你客气地回了句「谢谢哥惦记，我这边再闯闯」。好马不吃回头草——既然出来了，就别急着回那口熟悉的井。"; } }
  ]
});

/* —— 5. 辞职创业半年后的回望 —— */
EVENTS.push({
  id: "ev_quitx_hustle_review", module: "work", ambient: true,
  cond: (s) => (has(s, "risk_hustle") || has(s, "startup")) && s.age >= 24,
  title: "🌙 单干半年，深夜复盘",
  text: (s) => "辞职单干，转眼半年。今晚你一个人留在出租屋兼办公室，泡面的热气糊在窗上。账本摊在桌上，有起色，也有窟窿。你点了根烟（或灌了口冰水），回望当初拍桌子辞职那一刻——后悔吗？",
  choices: [
    { label: "不后悔，咬牙加码再赌一把", effect: (s) => {
        add(s, "stress", 7); add(s, "cash", -15000); add(s, "mood", 3); add(s, "strategy", 2);
        if (rnd(quitx_rate(s, 0.33))) {
          add(s, "cash", 70000); add(s, "reputation", 4); add(s, "network", 3); flag(s, "hustle_winning");
          return "你把剩下的子弹全压了上去。这一注押对了——一个大客户、一波口碑，半年的窟窿一夜填平。那个拍桌子辞职的自己，今晚值得敬一杯。";
        }
        add(s, "cash", -12000); add(s, "health", -4);
        return "你加了码，结果市场又给了一记闷棍。账上的数字红得刺眼，你盯着天花板一宿没睡。单干这条路，浪漫只在出发那天，往后全是硬扛。";
      } },
    { label: "认了，准备收摊回去打工", effect: (s) => {
        if (has(s, "startup")) delete s.flags.startup;
        delete s.flags.risk_hustle; flag(s, "startup_closed");
        add(s, "mood", -5); add(s, "insight", 3); add(s, "stress", -3);
        return "你把账本合上，决定见好就收。不是认输，是认清——有些路走过了才知道不适合自己。收摊回去打工，至少这半年没白闯，眼界和教训，都是带得走的。";
      } }
  ]
});

/* —— 6. 寄人篱下，想搬出去独立（年轻+未婚+无房，两层对白） —— */
EVENTS.push({
  id: "ev_quitx_move_out", module: "work", ambient: true,
  cond: (s) => !has(s, "has_house") && s.age < 30 && !has(s, "married"),
  title: "🏠 «我想搬出去住»",
  text: (s) => "在家住着，省钱是省钱，可妈每天的「几点回来」「对象处了没」像背景音一样响个不停。今晚又因为一点小事拌了嘴，你躲进房间，第一次认真盘算：要不，搬出去，自己租房住？",
  choices: [
    { label: "下定决心，开口跟家里摊牌", next: (s) => ({
        text: (s) => "你深吸一口气走出房门：「妈，我想搬出去住，自己租房，独立点。」我妈的脸一下子拉了下来：「翅膀硬了？外头一个人，谁照顾你？钱够吗？」",
        choices: [
          { label: "态度坚决，自己扛房租", effect: (s) => {
              add(s, "cash", -8000); add(s, "stress", 4); add(s, "mood", 6); add(s, "insight", 2);
              flag(s, "lives_alone");
              if (has(s, "employed") || has(s, "civil_servant")) { add(s, "strategy", 1); }
              return "你顶住了那阵唠叨，租下一间小屋。第一晚泡面配深夜剧，孤独是真的，自由也是真的。寄人篱下的日子翻篇了——独立的第一笔学费，是房租，也是底气。";
            } },
          { label: "被劝住了，再等等吧", effect: (s) => {
              add(s, "mood", -4); add(s, "stress", 3);
              return "「等你结婚了再说」——我妈一句话又把你按了回去。你退回房间，盯着天花板。寄人篱下的好处是省钱，坏处是，你的人生总有人替你拿主意。";
            } }
        ]
      }) },
    { label: "算了，省下的房租它不香吗", effect: (s) => { add(s, "cash", 3000); add(s, "mood", -2); return "你盘算了一下房租，又默默把搬家的念头收了回去。住家里是憋屈，可省下的那笔钱，实在太香。独立这事，再攒攒底气吧。"; } }
  ]
});

/* —— 7. 考公上岸者的「围城」心态 —— */
EVENTS.push({
  id: "ev_quitx_besieged_city", module: "civil", ambient: true,
  cond: (s) => has(s, "civil_servant") && (s.civilRank || 0) <= 3 && s.age >= 25,
  title: "🏯 上岸之后的「围城」",
  text: (s) => "同学聚会，外企的发小晒着年终奖和海岛照，半开玩笑：「还是你稳，旱涝保收。」你笑着碰杯，心里却泛起一丝说不清的滋味——当年挤破头考进来的「岸」，待久了，竟也像座围城。",
  choices: [
    { label: "动了下海的念头，私下打听行情", next: (s) => ({
        text: (s) => "回去后你忍不住打听了下外面的行情，又翻了翻当年的专业。可越打听越犹豫：编制的安稳是真，市场的凶险也是真。" + quitx_pickName() + "劝你：「围城里头的人想出去，外头的人挤破头想进来，你想清楚没？」",
        choices: [
          { label: "想清楚了，攒筹码准备旋转门", effect: (s) => {
              flag(s, "eyeing_exit"); add(s, "strategy", 2); add(s, "insight", 2); add(s, "stress", 3);
              return "你没冲动辞职，但悄悄开始攒下海的筹码：人脉、技能、副业试水。围城的门没推开，可你已经把钥匙揣进了兜里——真要走那天，不至于裸奔。";
            } },
          { label: "想通了，安心守着这座城", effect: (s) => {
              add(s, "mood", 4); add(s, "stress", -3); add(s, "insight", 2);
              return "你想通了：围城内外，各有各的苦。与其这山望着那山高，不如把脚下的路走稳。安稳不是平庸，是你权衡之后，认下的活法。";
            } }
        ]
      }) },
    { label: "笑笑而已，本就没想走", effect: (s) => { add(s, "mood", 2); return "你只是一时感慨，碰完杯也就过去了。围城归围城，这份稳当，眼下你还真舍不得撒手。"; } }
  ]
});

/* —— 8. 中年裸辞的孤注一掷 —— */
EVENTS.push({
  id: "ev_quitx_midlife_allin", module: "work", ambient: true,
  cond: (s) => has(s, "employed") && s.age >= 38 && s.age <= 50,
  title: "🎲 四十岁，最后一搏",
  text: (s) => "公司新一轮优化的名单还没出，可换汤不换药的活、一眼望到头的职级，让你喘不过气。镜子里多了白头发，你忽然冒出个念头：与其等着被优化，不如趁还有口气，裸辞出去，搏最后一把。",
  choices: [
    { label: "破釜沉舟，把积蓄全押上", next: (s) => ({
        text: (s) => "你没跟谁商量，递了辞呈，把大半积蓄取了出来，准备做点自己一直想做的事。家里炸了锅，朋友直摇头：「都这岁数了，输了可没第二次机会。」可你心意已决。",
        choices: [
          { label: "拼老本行，靠经验吃饭", effect: (s) => {
              quitx_leaveJob(s); flag(s, "midlife_allin");
              add(s, "stress", 8); add(s, "cash", -25000); add(s, "mood", 5);
              if (rnd(quitx_rate(s, 0.35) + s.stats.insight / 300)) {
                add(s, "cash", 90000); add(s, "reputation", 5); add(s, "network", 4);
                return "你押上了二十年攒下的人脉和手艺。中年人最值钱的不是冲劲，是火候——半年内你接住了老客户的大单，这一搏，搏出了第二春。";
              }
              add(s, "cash", -20000); add(s, "health", -6);
              return "你赌上了老本，可市场早不是你熟悉的样子。积蓄一天天薄，白头发一根根添。四十岁的孤注一掷，输不起，偏偏又输了大半。";
            } },
          { label: "跨行重来，从零学起", effect: (s) => {
              quitx_leaveJob(s); flag(s, "midlife_allin");
              add(s, "stress", 9); add(s, "cash", -20000); add(s, "knowledge", 2); add(s, "health", -4);
              return "你一咬牙转去了个全新的行当，从零学起。年轻人三天学会的，你要熬一周。可每攻下一关，那种久违的「我还能学」的踏实，比工资更让你睡得安稳。结局未卜，路是自己选的。";
            } }
        ]
      }) },
    { label: "忍住，等N+1更划算", effect: (s) => { add(s, "stress", 5); add(s, "strategy", 2); add(s, "insight", 2); return "你按住了冲动：与其裸辞净身出户，不如熬着等优化，好歹拿笔 N+1。中年人的体面退出，是连情绪都要算进性价比里。"; } }
  ]
});

/* —— 9. 辞职念头被一次「小确幸」按住（轻量收束） —— */
EVENTS.push({
  id: "ev_quitx_small_relief", module: "work", ambient: true,
  cond: (s) => has(s, "employed") && !has(s, "job_hunting"),
  title: "☕ 差点就辞了的那天",
  text: (s) => { var r = quitx_pickName(); return "你辞职信都打好了草稿。临到点提交，" + r + "忽然端来杯咖啡：「昨天那活多亏你，老板私下夸你了。」紧接着工资条到账，比预期多了一笔。辞职的手，停在了半空。"; },
  choices: [
    { label: "得，再干一阵看看", effect: (s) => { add(s, "mood", 4); add(s, "stress", -2); return "你把辞职信删了。一杯咖啡、一句夸奖、一笔意外的钱，就把蓄了半月的辞意冲淡了。打工人的去留，有时就系在这么点微不足道的暖意上。"; } },
    { label: "暖归暖，去意已决", effect: (s) => { flag(s, "job_hunting"); add(s, "strategy", 1); add(s, "insight", 2); return "你领了情，也没动摇：一时的暖，留不住一颗已经凉透的心。该走还是要走，只是这一回，你打算走得更体面些。"; } }
  ]
});
