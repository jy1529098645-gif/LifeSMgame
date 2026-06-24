"use strict";
/* ==================================================================
 * content/events-life.js —— 原始生命事件（从 core.js 抽出，独立模块）
 * 板块：职场career / 恋爱love / 金钱money / 婚育domestic / 创业里程碑startup
 *      / 时代era / 荒诞absurd / 人生大事件 / 阶段大抉择dec_*
 * 全局 helper（add/flag/byClass/betNode/startupNode/makeCrush/INVEST_TRACKS…）直接可用。
 * ================================================================== */
EVENTS.push(
    // —— 行动触发：职场 PUA（同事/老板的态度随阶级不同）——
    { id: "ev_work_pua", module: "career",
      title: "🫠 老板的「画饼」", text: (s) => byClass(s, {
        poor: "老板拍着你肩膀：「年轻人要能吃苦，加班是福报。咱们是兄弟，等公司上市……」你看了眼空荡荡的钱包。",
        mid: "例会上老板又开始画饼，PPT 写着「狼性文化」。同事们麻木地鼓掌，你也跟着拍了两下。",
        rich: "老板小心翼翼地征求你的意见——毕竟你名下有几套房，根本不在乎这份工资。同事们投来羡慕的目光。"
      }),
      choices: [
        { label: "当场戳破，整顿职场", next: (s) => ({
            text: () => "你「啪」地合上电脑站了起来。会议室空气瞬间凝固，几十双眼睛齐刷刷看向你，老板的笑僵在脸上。",
            choices: [
              { label: "条理清晰，有理有据", effect: (s) => { add(s, "reputation", 6); add(s, "stress", -3); if (s.stats.charm + classTier(s) * 15 > 45 || rnd(0.5)) { add(s, "mood", 4); return "你不卑不亢，逻辑严密，把老板噎得一句话也接不上。散会后好几个同事偷偷加你微信，喊你「嘴替」。"; } add(s, "cash", -2000); flag(s, "job_risk"); return "你说得句句在理，可惜职场不讲对错。打那天起，你的活越来越多，绩效却越来越低。"; } },
              { label: "情绪上头，直接开骂", effect: (s) => { add(s, "reputation", -6); add(s, "stress", 6); flag(s, "job_risk"); if (classTier(s) >= 3) { add(s, "mood", 8); return "反正你也不缺这份工资，骂得酣畅淋漓，摔门而去。同事们在群里疯狂 @ 你，封你为「打工人之光」。"; } add(s, "cash", -5000); return "你骂得痛快，代价是当场被请出公司。痛快两分钟，找工作找三个月。"; } }
            ]
          }) },
        { label: "会后私下找老板谈", next: (s) => ({
            text: () => "茶水间，你拦住老板，想心平气和地聊聊。他端着保温杯，眯眼看你：「说吧，有啥想法？」",
            choices: [
              { label: "委婉提加薪", effect: (s) => { const p = 0.25 + s.stats.charm / 200 + classTier(s) * 0.08; if (rnd(p)) { add(s, "cash", 30000); add(s, "mood", 6); return "你摆事实讲功劳，老板沉默良久，竟松口给你涨了薪。这一架，没白吵。"; } add(s, "mood", -4); return "老板打起太极：「年底再看表现嘛。」你听懂了，这是「没有」的客气说法。"; } },
              { label: "只求少加点班", effect: (s) => { add(s, "health", 6); add(s, "stress", -6); add(s, "reputation", -2); return "你争取到了准点下班的权利，代价是被默认「没上进心」，升职名单上从此再没你的名字。"; } }
            ]
          }) },
        { label: "陪笑鼓掌，明哲保身", effect: (s) => { add(s, "mood", -5); add(s, "stress", 5); return "你跟着拍了拍手，把翻涌的不满又一次咽了回去。散会后你对着屏幕发了很久的呆——镜子里那个人，越来越陌生。"; } }
      ] },
    // —— 行动触发：表白（NPC 反应随阶级/魅力不同）——
    // —— 行动触发：投资选赛道（押注隐藏风口）——
    { id: "ev_invest_choose", module: "money",
      title: (s) => { const heat = s.world ? s.world.windHeat : 40; const pool = heat >= 60 ? ["🔥 这波，追还是不追？", "📈 满屏飘红，手痒了", "🎢 高位，敢上车吗"] : ["📊 把钱投向哪里？", "💹 钱该往哪搁", "🧭 押哪条赛道？", "🪙 这一笔，下注何方"]; return pool[(s.week + Math.floor(s.cash || 0)) % pool.length]; }, text: (s) => {
        const heat = s.world ? s.world.windHeat : 40;
        const cash = Math.round(s.cash).toLocaleString();
        // 文案随行情轮换，避免每次理财都读同一句
        const cool = [
          `账上躺着 ¥${cash}。交易软件红红绿绿，论坛里人人都说自己抄到了底。钱不能光睡觉——这一把，押哪条赛道？`,
          `你又打开了那个让人心跳加速的 App。手里 ¥${cash}，消息面众说纷纭，没人替你拍板。凭你的眼光，下注哪个方向？`,
          `饭桌上、电梯里、群聊里，全是"哪个赛道要起飞"的小道消息。你掂量着兜里的 ¥${cash}，这回信谁的？`
        ];
        const hot = [
          `市场正烫手——人人都在喊"上车要趁早"，也有人冷笑"接盘侠就是你"。你攥着 ¥${cash}，是追，还是躲？`,
          `热度拉满，KOL 喊单、散户跟风，FOMO 写在每个人脸上。你的 ¥${cash}，要不要跳进这趟看不清的快车？`
        ];
        const pool = heat >= 60 ? hot : cool;
        return pool[(s.week + Math.floor(s.cash)) % pool.length];
      },
      dynamicChoices: (s) => {
        const others = shuf(INVEST_TRACKS.filter(t => t !== s.eraWind)).slice(0, 2);
        const tracks = shuf([s.eraWind, ...others]);  // 当前风口一定在内，读新闻才有用
        const opts = tracks.map(tk => ({ label: `押注「${tk}」`, next: () => betNode(tk) }));
        opts.push({ label: "算了，钱还是揣兜里踏实", cancel: true, effect: (s) => { add(s, "insight", 1); return "你盯着满屏众说纷纭的消息，最终还是关掉了交易软件。也许错过一个亿，也许躲过一次收割——谁说得准呢。"; } });
        return opts;
      },
      choices: [] },
    // —— 创业里程碑：收购要约（结局分支）——
    { id: "ev_su_exit", module: "startup", ambient: true,
      cond: (s) => s.startup && !has(s, "startup_done") && has(s, "su_users") && s.startup.valuation > 1500000,
      title: "🤝 有人想收购你的公司", text: (s) => `一家大厂找上门，开价收购你的公司（当前估值 ¥${s.startup.valuation.toLocaleString()}）。要落袋为安，还是赌一个更大的未来？`,
      choices: [
        { label: "倾向套现离场", next: (s) => ({
            text: () => "谈判桌上，对方推过来一份收购协议。白纸黑字，那串数字让你手心冒汗。",
            choices: [
              { label: "全部卖掉，落袋为安", effect: (s) => { const pi = s.world ? s.world.priceIndex : 1; const m = bigWindfall(s, 25000000 + (s.startup.valuation || 0) / pi * 0.9); add(s, "assets", m); flag(s, "startup_done"); flag(s, "cashed_out"); add(s, "mood", 12); return `你签了字。¥${m.toLocaleString()} 一次性到账，从此财富自由。庆功宴上你笑着，心里却莫名空了一块。`; } },
              { label: "卖大部分，留点股份", effect: (s) => { const pi = s.world ? s.world.priceIndex : 1; const m = bigWindfall(s, 18000000 + (s.startup.valuation || 0) / pi * 0.6); add(s, "assets", m); flag(s, "startup_done"); flag(s, "cashed_out"); add(s, "network", 6); return `你套现 ¥${m.toLocaleString()}，又保留了一小撮股份。既落了袋，又留了个念想——万一它真飞了呢？`; } }
            ]
          }) },
        { label: "倾向拒绝，赌更大的未来", next: (s) => ({
            text: () => "你把协议推了回去。对方挑眉：「年轻人，别太贪。」可你眼里，只有交易所敲钟的那个画面。",
            choices: [
              { label: "继续狂奔，冲刺 IPO", effect: (s) => { flag(s, "chase_ipo"); add(s, "stress", 14); add(s, "health", -6); return "你押上了全部。从此只剩两个结局：交易所的钟声，或者半路猝死的讣告——没有中间地带。"; } },
              { label: "找新投资人抬估值", effect: (s) => { if (s.stats.strategy + s.reputation > 70 || rnd(0.4)) { s.startup.valuation = Math.round(s.startup.valuation * 1.5); add(s, "network", 8); return "你引入了一轮新融资，估值又被抬高了一截。资本的游戏，你越玩越熟练。"; } add(s, "reputation", -6); add(s, "stress", 8); return "新投资人压价又挑刺，最终谈崩。消息传出去，老东家也撤了要约，你卡在了半空中。"; } }
            ]
          }) }
      ] },
    // —— 创业里程碑：第一批用户 / 天使轮（早期阶段，给「公司在经营」的实感）——
    { id: "ev_su_angel", module: "startup", ambient: true, once: true,
      cond: (s) => s.startup && !has(s, "startup_done") && has(s, "su_mvp") && s.startup.valuation > 300000,
      title: "🌱 天使投资人递来 TS", text: (s) => `产品悄悄跑通了闭环，口碑在小圈子里发酵。一家天使投资人闻讯找上门，递来一份 TS（投资意向书，当前估值 ¥${s.startup.valuation.toLocaleString()}）。第一笔机构的钱，要不要接？`,
      choices: [
        { label: "拿天使轮，加速扩张", effect: (s) => { add(s, "cash", 200000); add(s, "network", 6); add(s, "reputation", 4); add(s, "stress", 6); s.startup.progress += 8; flag(s, "su_funded"); return "天使轮到账，账上松了口气。代价是你从此对投资人有了交代——每个季度的数字，都得给个说法。"; } },
        { label: "不稀释，自己慢慢磨", effect: (s) => { add(s, "insight", 3); add(s, "strategy", 2); add(s, "stress", 4); return "你婉拒了融资，宁可慢一点也要握紧方向盘。船小好调头，但风浪来时，你也只有自己。"; } }
      ] },
    // —— 创业里程碑：最小可行产品（从「立项」到「真有人用」）——
    { id: "ev_su_mvp", module: "startup", ambient: true, once: true,
      cond: (s) => s.startup && !has(s, "startup_done") && !has(s, "su_mvp") && (s.startup.progress >= 12 || s.startup.valuation > 60000),
      title: "🧪 最小可行产品上线前夜", text: (s) => byClass(s, {
        poor: `办公室是合租房客厅，服务器是最便宜的云主机。你盯着那个丑得要命、但终于能跑通的版本，心里又酸又亮。当前估值 ¥${s.startup.valuation.toLocaleString()}。`,
        mid: `外包、设计、测试都被你压到最低成本。产品还很粗糙，但核心流程终于闭上了环。当前估值 ¥${s.startup.valuation.toLocaleString()}。`,
        rich: `团队熬了几个通宵，会议室里堆满咖啡杯。这个版本还称不上体面，但已经足够拿给市场试刀。当前估值 ¥${s.startup.valuation.toLocaleString()}。`
      }),
      choices: [
        { label: "先小范围内测", next: (s) => ({
            text: () => "你拉来第一批愿意忍受粗糙界面的朋友和陌生人。群里消息滴滴响，每一句反馈都像一根针，扎得你清醒。",
            choices: [
              { label: "连夜改关键问题", effect: (s) => { flag(s, "su_mvp"); add(s, "knowledge", 2); add(s, "stress", 6); s.startup.progress = (s.startup.progress || 0) + 10; s.startup.valuation = Math.max(s.startup.valuation, Math.round(s.startup.progress * 4200)); return "你把花哨功能全往后放，只修真正挡路的地方。版本号往前跳了一小格，产品第一次像个能活下去的东西。"; } },
              { label: "先记下来，保持节奏", effect: (s) => { flag(s, "su_mvp"); add(s, "strategy", 2); add(s, "stress", -2); s.startup.progress = (s.startup.progress || 0) + 5; return "你没有被反馈牵着鼻子走，而是把问题分成今天、下周和以后。慢了一点，却没有乱。"; } }
            ]
          }) },
        { label: "直接公开发布", next: (s) => ({
            text: () => "发布按钮按下去的那一刻，你突然意识到：从现在开始，市场不会再听你解释，它只看结果。",
            choices: [
              { label: "接受真实流量拷打", effect: (s) => { flag(s, "su_mvp"); add(s, "reputation", rnd(0.45) ? 8 : -4); add(s, "stress", 9); s.startup.progress = (s.startup.progress || 0) + 8; if (rnd(0.45)) { flag(s, "su_users"); add(s, "cash", 30000); return "第一天的数据摇摇晃晃，却真的有人留下来，还付了钱。你看着后台那几笔收入，第一次觉得公司不是幻觉。"; } return "流量来了，又走了。骂声不少，留存难看，但你终于拿到了真实世界的第一张考卷。"; } },
              { label: "砸钱买第一波曝光", effect: (s) => { flag(s, "su_mvp"); add(s, "cash", -50000); add(s, "reputation", 6); add(s, "stress", 8); s.startup.progress = (s.startup.progress || 0) + 6; return "广告把人群推到门口，产品负责把人留下。你花钱买到了一次亮相，也买到了一堆刺眼的数据。"; } }
            ]
          }) }
      ] },
    // —— 创业里程碑：种子用户与留存（给「第一批用户」更扎实的前因）——
    { id: "ev_su_seed_users", module: "startup", ambient: true, once: true,
      cond: (s) => s.startup && !has(s, "startup_done") && has(s, "su_mvp") && !has(s, "su_users") && s.startup.valuation > 120000,
      title: "👥 第一批种子用户", text: () => "后台出现了一批固定头像。他们每天来，有人提需求，有人写长长的吐槽，也有人悄悄把产品推荐给同事。用户不再只是数字，开始有了名字。",
      choices: [
        { label: "围着真实用户打磨", next: (s) => ({
            text: () => "你把团队拉进用户群，亲自看每一条反馈。有人嫌你们不专业，也有人说：「这个功能要是做好，我愿意付费。」",
            choices: [
              { label: "做留存，少讲故事", effect: (s) => { flag(s, "su_users"); add(s, "insight", 3); add(s, "reputation", 5); s.startup.progress = (s.startup.progress || 0) + 12; s.startup.valuation = Math.max(s.startup.valuation, Math.round(s.startup.valuation * 1.35)); return "你把增长口号按下去，先把留下来的人服务好。数据不炸裂，却越来越扎实，投资人开始听你讲完一整页留存曲线。"; } },
              { label: "做付费，验证商业化", effect: (s) => { flag(s, "su_users"); flag(s, "su_revenue"); add(s, "cash", 90000); add(s, "stress", 5); s.startup.valuation = Math.max(s.startup.valuation, Math.round(s.startup.valuation * 1.25)); return "你推出了第一档付费方案。转化率不高，但那几笔收入像钉子一样，把商业模式钉在了墙上。"; } }
            ]
          }) },
        { label: "趁热扩张拉新", effect: (s) => { flag(s, "su_users"); add(s, "cash", -70000); add(s, "network", 4); add(s, "reputation", 4); add(s, "stress", 7); s.startup.progress = (s.startup.progress || 0) + 7; return "你赶在热度还没散时冲了一波增长。新增用户很好看，留存却有点虚，像一座刚搭起来的脚手架。"; } }
      ] },
    // —— 创业里程碑：竞品压境（赛道不再只有你一个人）——
    { id: "ev_su_competitor", module: "startup", ambient: true, once: true,
      cond: (s) => s.startup && !has(s, "startup_done") && !has(s, "su_competitor_seen") && has(s, "su_users"),
      title: "⚔️ 竞品照着你的路冲了进来", text: (s) => `一夜之间，赛道里多了三个名字。有人抄你的界面，有人压你的价格，还有一家背后站着大厂。你公司的估值是 ¥${s.startup.valuation.toLocaleString()}，但护城河还没深到能让人放心。`,
      choices: [
        { label: "正面迎战", next: (s) => ({
            text: () => "团队在会议室里吵到凌晨。价格战、发布会、渠道补贴，每个方案都烧钱，也都可能换来喘息。",
            choices: [
              { label: "打价格战抢市场", effect: (s) => { flag(s, "su_competitor_seen"); add(s, "cash", -120000); add(s, "stress", 10); if (rnd(0.45 + s.stats.strategy / 200)) { add(s, "reputation", 8); s.startup.valuation = Math.round(s.startup.valuation * 1.35); return "你咬牙降价，把竞品拖进泥潭。利润难看，但市场记住了你的名字。"; } add(s, "reputation", -4); return "补贴像水一样泼出去，用户却被几家轮流薅走。你赢了声量，没赢到忠诚。"; } },
              { label: "发布关键新功能", effect: (s) => { flag(s, "su_competitor_seen"); add(s, "knowledge", 3); add(s, "stress", 8); s.startup.progress = (s.startup.progress || 0) + 10; s.startup.valuation = Math.round(s.startup.valuation * 1.25); return "你没有跟着吵，而是把最难抄的功能提前发了出来。竞品还在复刻昨天，你已经把路往前挪了一段。"; } }
            ]
          }) },
        { label: "避开锋芒，深挖细分市场", effect: (s) => { flag(s, "su_competitor_seen"); flag(s, "su_niche"); add(s, "insight", 4); add(s, "reputation", 3); s.startup.valuation = Math.round(s.startup.valuation * 1.12); return "你放弃和巨头抢聚光灯，转身去服务一群被忽视的人。市场小了，忠诚却厚了，活下来的概率也高了一截。"; } },
        { label: "试探合作或并购", effect: (s) => { flag(s, "su_competitor_seen"); add(s, "network", 6); add(s, "stress", 4); if (rnd(0.35 + s.network / 250)) { add(s, "cash", 150000); flag(s, "su_strategic_partner"); return "你没有把所有对手都当敌人。一次桌下握手换来渠道和现金，也换来董事会里更多复杂的眼神。"; } return "对方笑着喝完咖啡，转头继续挖你的客户。商业世界里，寒暄不等于善意。"; } }
      ] },
    // —— 创业里程碑：现金流拷问（公司不是只靠估值活着）——
    { id: "ev_su_cashflow", module: "startup", ambient: true, once: true,
      cond: (s) => s.startup && !has(s, "startup_done") && has(s, "su_mvp") && !has(s, "su_cashflow_tested") && (s.cash < 120000 || (has(s, "su_funded") && s.startup.valuation > 800000)),
      title: "💸 现金流只够再烧几个月", text: (s) => `财务把表推到你面前：工资、服务器、渠道费、房租，哪一项都不会因为你有梦想就少收。账上现金 ¥${Math.round(s.cash).toLocaleString()}，估值再好看，也不能拿来发工资。`,
      choices: [
        { label: "立刻收缩成本", next: (s) => ({
            text: () => "你可以砍掉市场预算，也可以动团队。每一刀都能让公司多活几周，也都会留下疤。",
            choices: [
              { label: "先砍投放和外包", effect: (s) => { flag(s, "su_cashflow_tested"); add(s, "cash", 80000); add(s, "strategy", 3); add(s, "reputation", -2); add(s, "stress", 5); return "你把所有非核心开支停掉，办公室突然安静了许多。增长慢下来，但公司至少还在呼吸。"; } },
              { label: "裁掉一部分岗位", effect: (s) => { flag(s, "su_cashflow_tested"); add(s, "cash", 180000); add(s, "stress", 12); add(s, "reputation", -8); socialShift(s, -4); return "你亲手发出裁员通知。现金流活了，群聊却沉了。创业最难受的时刻，不是缺钱，是你发现每个数字背后都是一个人。"; } }
            ]
          }) },
        { label: "逼商业化提前发生", effect: (s) => { flag(s, "su_cashflow_tested"); flag(s, "su_revenue"); add(s, "cash", 160000); add(s, "stress", 8); add(s, "insight", 3); s.startup.valuation = Math.round(s.startup.valuation * 1.15); return "你把免费功能收拢，推出企业版和年费。有人骂你变了，也有人终于掏钱。现金流第一次不只靠融资输血。"; } },
        { label: "找老股东做过桥融资", effect: (s) => { flag(s, "su_cashflow_tested"); add(s, "network", 4); add(s, "stress", 7); if (rnd(0.35 + s.reputation / 180)) { add(s, "cash", 350000); flag(s, "su_bridge"); return "老股东看完数据，叹了口气，还是给了你一笔过桥钱。不是信你讲的故事，而是信你还没输光。"; } add(s, "reputation", -5); return "老股东没有继续加码。他们说得很委婉，但意思很清楚：先证明你能自己造血。"; } }
      ] },
    // —— 创业里程碑：转型窗口（可复发：风口每隔几年就变，逼你持续判断要不要追）——
    { id: "ev_su_pivot", module: "startup", ambient: true,
      cond: (s) => s.startup && !has(s, "startup_done") && has(s, "su_mvp") && s.startup.track !== s.eraWind && (s.startup.valuation > 500000 || has(s, "su_cashflow_tested")),
      title: "🔁 赛道的风变了", text: (s) => `你原本押的是「${s.startup.track}」，可新闻、客户和投资人都在谈「${s.eraWind}」。不是努力没用，而是风向可能真的错了。现在转身，还来得及；继续硬扛，也未必没有活路。`,
      choices: [
        { label: "召开转型会", next: (s) => ({
            text: () => "白板上写满了新旧业务的利弊。转型不是换个口号，而是承认过去一部分努力要沉没。",
            choices: [
              { label: "果断切到新风口", effect: (s) => { flag(s, "su_pivoted"); flag(s, "su_mvp"); s.startup.track = s.eraWind; s.startup.progress = Math.max(12, Math.round((s.startup.progress || 0) * 0.75)); s.startup.valuation = Math.round(s.startup.valuation * 0.85); add(s, "strategy", 5); add(s, "stress", 9); bumpMomentum(s, 3); return `你承认判断有误，把公司转向「${s.eraWind}」。估值短暂回落，但方向终于重新对上了风。`; } },
              { label: "保留老业务，孵化新线", effect: (s) => { flag(s, "su_pivoted"); s.startup.track = rnd(0.55) ? s.eraWind : s.startup.track; add(s, "knowledge", 3); add(s, "cash", -90000); add(s, "stress", 7); return "你没有一刀切，而是让小团队先试新线。账更紧了，组织更复杂了，但你给未来留了一扇门。"; } }
            ]
          }) },
        { label: "不转，继续把旧路走深", effect: (s) => { flag(s, "su_pivoted"); flag(s, "su_niche"); add(s, "insight", 3); add(s, "stress", 5); s.startup.valuation = Math.round(s.startup.valuation * 1.08); return "你没有追风口，而是把旧业务扎进更深的细分需求里。它不会让所有人兴奋，但足够让一群客户离不开你。"; } }
      ] },
    // —— 创业里程碑：机构融资（从天使到正规牌桌）——
    { id: "ev_su_series_a", module: "startup", ambient: true, once: true,
      cond: (s) => s.startup && !has(s, "startup_done") && !has(s, "su_series_a") && (has(s, "su_users") || has(s, "su_revenue")) && s.startup.valuation > 900000 && (s.age - (s.startup.foundedAge || s.age)) >= 2,
      title: "🏦 机构投资人坐到桌前", text: (s) => `这一次来的不是熟人天使，而是带着模型和条款清单的机构投资人。他们喜欢你的增长，也盯着你的成本。当前估值 ¥${s.startup.valuation.toLocaleString()}。`,
      choices: [
        { label: "认真谈一轮融资", next: (s) => ({
            text: () => "条款清单一页页翻过去，估值、清算优先权、董事席位，每个词都藏着未来的重量。",
            choices: [
              { label: "接受标准条款，换速度", effect: (s) => { flag(s, "su_series_a"); add(s, "cash", 1000000); add(s, "network", 10); add(s, "reputation", 8); add(s, "stress", 8); s.startup.valuation = Math.round(s.startup.valuation * 1.9); return "你签下了这一轮。钱到账那天，团队欢呼，董事会也从此多了一双盯着报表的眼睛。"; } },
              { label: "强硬争条款，少受制约", effect: (s) => { flag(s, "su_series_a"); add(s, "cash", 700000); add(s, "strategy", 4); add(s, "stress", 10); s.startup.valuation = Math.round(s.startup.valuation * 1.55); return "你没把每个条件都吞下去，融资金额少了一截，控制权却保住更多。未来的路，至少方向盘还主要在你手里。"; } }
            ]
          }) },
        { label: "暂不融资，先把收入做实", effect: (s) => { flag(s, "su_revenue"); add(s, "insight", 3); add(s, "cash", 180000); add(s, "reputation", 3); return "你把投资人的名片收进抽屉，转身去追应收账款。估值故事可以晚点讲，活下来的钱今天就要到账。"; } }
      ] },
    // —— 创业里程碑：规模化与上市资格（让 IPO 不只来自收购后的执念）——
    { id: "ev_su_scale_finance", module: "startup", ambient: true, once: true,
      cond: (s) => s.startup && !has(s, "startup_done") && !has(s, "su_scale_ready") && (has(s, "su_series_a") || has(s, "su_revenue")) && s.startup.valuation > 1600000 && (s.age - (s.startup.foundedAge || s.age)) >= 4,
      title: "📊 增长、利润与下一轮融资", text: (s) => `公司终于站到了更大的牌桌边。投资人要增长，财务要利润，团队要确定性，而你知道三者很少同时满足。当前估值 ¥${s.startup.valuation.toLocaleString()}。`,
      choices: [
        { label: "继续融资换规模", effect: (s) => { flag(s, "su_scale_ready"); add(s, "cash", 2200000); add(s, "network", 8); add(s, "reputation", 7); add(s, "stress", 12); s.startup.valuation = Math.round(s.startup.valuation * 1.8); return "新一轮融资落定，办公室扩了，团队翻了倍，目标也被抬到更高。你离上市更近了，也离安稳更远了。"; } },
        { label: "压住扩张，做正现金流", next: (s) => ({
            text: () => "你要求每条业务线自己算账。有人觉得你保守，有人终于松了口气：公司不再只靠下一轮融资续命。",
            choices: [
              { label: "砍掉亏损业务", effect: (s) => { flag(s, "su_scale_ready"); flag(s, "su_profitable"); add(s, "cash", 500000); add(s, "strategy", 5); add(s, "reputation", 4); add(s, "stress", 6); s.startup.valuation = Math.round(s.startup.valuation * 1.35); return "你砍掉了几个热闹但亏钱的项目。增长曲线没那么性感了，现金流却第一次稳稳站住。"; } },
              { label: "保留核心人才，慢慢熬", effect: (s) => { flag(s, "su_scale_ready"); add(s, "mood", 4); add(s, "network", 3); add(s, "stress", 4); s.startup.valuation = Math.round(s.startup.valuation * 1.2); return "你没有用粗暴裁撤换利润，而是让团队一起过紧日子。慢是慢了点，可人心还在。"; } }
            ]
          }) }
      ] },
    { id: "ev_su_board_ipo", module: "startup", ambient: true, once: true,
      cond: (s) => s.startup && !has(s, "startup_done") && !has(s, "chase_ipo") && has(s, "su_scale_ready") && (s.startup.valuation > 2800000 || has(s, "su_profitable")) && (s.age - (s.startup.foundedAge || s.age)) >= 6,
      title: "🧾 董事会讨论上市路径", text: (s) => `这次不是收购方逼你做选择，而是公司自己走到了门口。财务报表、用户规模、现金流、合规清单摊满一桌，所有人都在看你：要不要正式准备上市？`,
      choices: [
        { label: "推进上市准备", next: (s) => ({
            text: () => "上市不是一次庆典，而是一场漫长体检。你要选择先补哪块短板。",
            choices: [
              { label: "先补财务和合规", effect: (s) => { flag(s, "chase_ipo"); flag(s, "su_ipo_route"); add(s, "reputation", 7); add(s, "stress", 10); add(s, "cash", -200000); return "你请来审计、法务和内控顾问，把公司翻了个底朝天。难看问题不少，但它们终于被摆到灯下。"; } },
              { label: "先稳增长和现金流", effect: (s) => { flag(s, "chase_ipo"); flag(s, "su_ipo_route"); add(s, "strategy", 4); add(s, "stress", 8); s.startup.valuation = Math.round(s.startup.valuation * 1.18); return "你把上市目标拆成一个个经营指标。钟声还远，但每个月的报表开始朝同一个方向移动。"; } }
            ]
          }) },
        { label: "暂缓，等公司更成熟", effect: (s) => { add(s, "insight", 3); add(s, "stress", -3); flag(s, "su_ipo_delayed"); return "你没有被掌声推着走。上市窗口会开也会关，但公司若没准备好，敲钟也可能变成另一种绞索。"; } }
      ] },
    // —— 创业里程碑：筹备上市（不依赖收购要约，估值/声誉达标即可自然走向 IPO）——
    { id: "ev_su_ipo_prep", module: "startup", ambient: true,
      cond: (s) => s.startup && !has(s, "startup_done") && has(s, "su_series_a") && !has(s, "cashed_out") && !has(s, "chase_ipo") && s.startup.valuation > 2500000 && (s.age - (s.startup.foundedAge || s.age)) >= 6,
      title: "📈 投行登门：要不要筹备上市", text: (s) => `公司估值站上 ¥${s.startup.valuation.toLocaleString()}，几家投行主动找上门，递来上市辅导方案。这是另一条路——不卖身，自己敲钟。`,
      choices: [
        { label: "启动上市辅导，冲刺 IPO", effect: (s) => { flag(s, "chase_ipo"); add(s, "stress", 12); add(s, "health", -4); add(s, "reputation", 6); return "你签下辅导协议，财务、法务、合规一拥而上。从这天起，目标只有一个——交易所那口钟。"; } },
        { label: "再攒攒，火候还不够", effect: (s) => { add(s, "strategy", 2); return "你按下了冲动。上市是把双刃剑，估值、增长、现金流，哪一项都还想再夯实一点。"; } }
      ] },
    // —— 环境事件：中年危机（35岁优化）——
    { id: "ev_layoff", module: "career", ambient: true,
      cond: (s) => s.stageId === "midlife" && !has(s, "startup"),
      title: "📉 35 岁，HR 找你谈话", text: (s) => byClass(s, {
        poor: "「公司要降本增效……」HR 没敢看你的眼睛。你想到下个月的房贷和孩子的学费，手心全是汗。",
        mid: "「这是 N+1 的方案。」HR 公事公办。窗外阳光正好，你却觉得天塌了一半。",
        rich: "你主动提了离职，HR 反而极力挽留。反正你早已实现财务自由，工作不过是消遣。"
      }),
      choices: [
        { label: "拿钱走人", next: (s) => ({
            text: () => "你签了离职协议，抱着纸箱走出写字楼。午后的阳光有点刺眼。接下来呢？",
            choices: [
              { label: "拿赔偿去创业", effect: (s) => { add(s, "cash", 80000); flag(s, "risk_hustle"); add(s, "strategy", 4); return "你揣着 N+1 的赔偿金，注册了自己的公司。中年再出发，背后是房贷，前面是悬崖。"; } },
              { label: "先躺平歇半年", effect: (s) => { add(s, "cash", 60000); add(s, "health", 10); add(s, "mood", 6); add(s, "stress", -15); return "你给自己放了个长假，睡到自然醒、陪孩子上学。账户在缩水，但紧绷了十年的那根弦，终于松了。"; } },
              { label: "回老家躺平", effect: (s) => { add(s, "cash", 50000); add(s, "mood", 4); add(s, "network", -8); flag(s, "hometown"); return "你卖掉大城市的幻梦，回了老家。县城的日子慢悠悠，只是夜深时，偶尔还会想起当年的意气风发。"; } }
            ]
          }) },
        { label: "低头求留", next: (s) => ({
            text: () => "你红着脸找到领导，说自己还能拼、可以降薪。对方沉吟着，似乎在掂量你这颗螺丝钉还值几个钱。",
            choices: [
              { label: "接受降薪留下", effect: (s) => { add(s, "stress", 10); add(s, "mood", -8); add(s, "cash", 15000); return "你保住了工位，代价是降薪和那点被碾碎的尊严。每天打卡，如履薄冰。"; } },
              { label: "转去边缘部门养老", effect: (s) => { add(s, "health", 5); add(s, "mood", -3); add(s, "reputation", -4); return "你被调去一个没人在意的部门，工资照发，存在感归零。温水里的青蛙知道自己在被煮，却不想跳了。"; } }
            ]
          }) },
        { label: "不忍了，仲裁维权", effect: (s) => { const p = 0.3 + s.stats.knowledge / 200 + s.stats.insight / 200; if (rnd(p)) { add(s, "cash", 60000); add(s, "reputation", 4); return "你啃透了劳动法，据理力争，最终拿到了远超预期的赔偿。公司也不敢再小看你。"; } add(s, "stress", 8); add(s, "cash", -5000); return "你耗了大半年打官司，身心俱疲，最后只多拿了一点点。维权的滋味，比想象中苦得多。"; } }
      ] },
    // —— 抽象荒诞：天降横财 ——
    { id: "ev_lottery", module: "absurd", ambient: true, once: true, cond: (s) => s.age >= 18,
      title: "🎰 彩票对中了？", text: () => "你随手买的彩票，居然对中了好几个号。心跳到了嗓子眼，手都在抖。",
      choices: [
        { label: "颤抖着去兑奖", enter: (s) => { s._lotto = rnd(0.12); }, next: (s) => s._lotto ? ({
            text: () => "工作人员核对了三遍，挤出标准的微笑：「恭喜您，中了两百万。」你脑子「嗡」的一声，一片空白。",
            choices: [
              { label: "高调发朋友圈炫耀", effect: (s) => { add(s, "cash", 2000000); add(s, "mood", 16); flag(s, "lottery"); add(s, "reputation", -4); add(s, "network", -6); return "你把中奖截图发了出去。点赞如潮，可没几天，八竿子打不着的亲戚都来「借钱」了，朋友圈成了修罗场。"; } },
              { label: "闷声发财，谁也不告诉", effect: (s) => { add(s, "cash", 2000000); add(s, "mood", 14); flag(s, "lottery"); add(s, "insight", 3); return "你悄悄把钱存好，第二天照常去上班。秘密是最好的护身符，暴富的喜悦，只在你一个人心里翻腾。"; } },
              { label: "捐一部分积点德", effect: (s) => { add(s, "cash", 1500000); add(s, "mood", 18); add(s, "reputation", 10); flag(s, "lottery"); return "你拿出一部分捐给了山区小学。看着孩子们的笑脸，你觉得这笔横财，花得格外踏实。"; } }
            ]
          }) : ({
            text: () => "工作人员对了对号，把彩票递还给你：「末等奖，五块钱。」你那颗提到嗓子眼的心，「咚」地落回了原处。",
            choices: [
              { label: "认了，买杯奶茶压压惊", effect: (s) => { add(s, "cash", -15); add(s, "mood", 2); return "空欢喜一场。你用中的五块加自己的钱买了杯奶茶，自嘲一笑：发财梦，又醒了。"; } }
            ]
          }) },
        { label: "肯定是诈骗，撕了", effect: (s) => { add(s, "insight", 1); return "你冷笑一声，把彩票揉成一团扔进垃圾桶。也许撕掉的是一个亿，也许撕掉的是一场精心设计的骗局——你永远不会知道了。"; } }
      ] },
    // —— 抽象荒诞：算命 ——
    { id: "ev_master", module: "absurd", ambient: true, cond: (s) => s.age >= 22,
      title: "🔮 街角的大师", text: (s) => byClass(s, {
        poor: "一个「大师」拦住你：「施主印堂发黑，有血光之灾，破财可消灾。」你摸了摸瘪瘪的口袋。",
        mid: "「大师」神秘一笑：「你近期有一劫，给点香火钱可保平安。」",
        rich: "「大师」一眼认出你是有钱人，张口就要五位数的「开光费」，说能保你公司上市。"
      }),
      choices: [
        { label: "破财消灾，掏钱", next: (s) => ({
            text: () => "大师捻着胡须，递过来一串「开过光」的手链，标价高得吓人：「心诚则灵啊，施主。」",
            choices: [
              { label: "随个小钱图心安", effect: (s) => { const c = byClass(s, { poor: 200, mid: 2000, rich: 20000 }); add(s, "cash", -c); add(s, "mood", 4); return `你掏了 ¥${c.toLocaleString()} 戴上手链。玄不玄学不重要，图的就是这份「我已尽力」的踏实。`; } },
              { label: "大手笔，求事业腾飞", effect: (s) => { const c = byClass(s, { poor: 5000, mid: 50000, rich: 500000 }); add(s, "cash", -c); add(s, "mood", 2); if (rnd(0.15)) { add(s, "network", 6); return `你豪掷 ¥${c.toLocaleString()}「供奉」。巧的是，那阵子你还真顺了不少——是心理作用，还是冥冥注定？`; } flag(s, "got_scammed"); return `你砸了 ¥${c.toLocaleString()} 求个心安，回头才反应过来：这「大师」第二天就换了个街角，继续忽悠下一个。`; } }
            ]
          }) },
        { label: "不信这套", next: (s) => ({
            text: () => "你摆摆手想走，大师却阴恻恻地补了一句：「不破财，怕是要破血光啊……」",
            choices: [
              { label: "礼貌走开，不予理会", effect: (s) => { add(s, "insight", 2); return "你笑笑没接话，径直走开。背后传来大师悻悻的嘀咕，被你抛在了脑后。"; } },
              { label: "当场拆穿他的话术", effect: (s) => { add(s, "insight", 3); add(s, "reputation", 2); if (rnd(0.2)) { add(s, "health", -8); return "你句句戳破他的套路，围观群众纷纷叫好。可邪门的是，当晚你真闪了腰——纯属巧合，对吧？"; } return "你不紧不慢地拆穿了他冷读术的把戏，大师脸一阵红一阵白，收摊跑路。围观的人给你鼓起了掌。"; } }
            ]
          }) }
      ] },

    // ============ MODULE: love（恋爱前因后果：先遇见 → 再追求 → 表白）============
    { id: "ev_meet", module: "love",
      title: "✨ 不期而遇",
      text: (s) => { if (!s._met) s._met = { scene: pick(MET_SCENE), c: makeCrush(s) }; const m = s._met; return `${m.scene}，你撞见了一个让你心头一动的人——${m.c.name}（${m.c.gender}）。${m.c.trait}，你的目光不由自主地多停留了几秒。`; },
      choices: [
        { label: "鼓起勇气，上前搭话", effect: (s) => { const m = s._met || { scene: pick(MET_SCENE), c: makeCrush(s) }; s._met = null; const p = 0.5 + s.stats.charm / 200; if (rnd(p)) { s.crush = m.c; add(s, "mood", 6); return `你磕磕绊绊开了口，竟意外地聊得来。临走时你要到了 ${m.c.name} 的联系方式，手机在口袋里烫得发热。`; } add(s, "mood", -3); return `你紧张得语无伦次，气氛一度凝固。${m.c.name} 礼貌地笑笑便走了，你懊恼了一整晚。`; } },
        { label: "假装看手机，悄悄观察", effect: (s) => { const m = s._met || { scene: pick(MET_SCENE), c: makeCrush(s) }; s._met = null; m.c.favor = 4; s.crush = m.c; add(s, "insight", 1); return `你没敢上前，只用余光追着 ${m.c.name} 的背影。心里那点久违的悸动，鲜活得让你有些慌。`; } },
        { label: "算了，缘分天注定", effect: (s) => { s._met = null; add(s, "mood", -1); return "你按下那点心动，转身离开。人海茫茫，或许本就该擦肩而过。"; } }
      ] },
    { id: "ev_pursue", module: "love",
      title: "💞 追求进行时",
      text: (s) => { const c = s.crush; return `和 ${c.name} 的关系不咸不淡地维系着（好感 ${Math.round(c.favor)}/100）。${c.trait}，你越看越喜欢。这一步，怎么走？`; },
      choices: [
        { label: "精心安排一次约会", effect: (s) => { const c = s.crush; const inc = Math.max(2, 6 + Math.round(statEdge(s, "charm") * 24)); c.favor += inc; add(s, "mood", 4); add(s, "cash", -Math.round(500 + Math.random() * 1500)); return `你用心准备了一场约会，${c.name} 笑得很开心。好感 +${inc}，你们之间的空气都甜了几分。`; } },
        { label: "鼓起勇气，正式表白", next: (s) => ({
            text: (s) => `你约 ${s.crush.name} 到那家常去的咖啡馆，心跳如鼓：「有件事，我想了很久……」`,
            choices: [
              { label: "深情告白", effect: (s) => { const c = s.crush; const p = Math.min(0.94, c.favor / 115 + 0.12 + statEdge(s, "charm") * 0.55); if (rnd(p)) { flag(s, "partner"); s.partnerName = c.name; s.crush = null; add(s, "mood", 16); return `${c.name} 红着眼眶点了头。那一刻，世界只剩下彼此的呼吸。你们，在一起了。`; } const name = c.name; s.crush = null; add(s, "mood", -12); return `${name} 沉默良久，轻声说了句「对不起」。你笑着说没关系，转身时却红了眼眶。有些人，终究只是路过。`; } },
              { label: "话到嘴边，又怂了", effect: (s) => { add(s, "insight", 1); return "「……没什么，咖啡要凉了。」那句「我喜欢你」，又被你咽了回去。"; } }
            ]
          }) },
        { label: "感觉不太合适，淡了", effect: (s) => { const name = s.crush.name; s.crush = null; add(s, "mood", -2); return `你渐渐没了主动联系的冲动，和 ${name} 的聊天框停在了某天的「在吗」。无疾而终，也是常态。`; } }
      ] },

    // ============ 留学多年承诺的收尾：海归抉择 ============
    { id: "ev_haigui", module: "era",
      title: "🛬 海归抉择",
      text: () => "毕业了。留在当地搏一张身份，还是带着光环回国吃红利？站在异国的街头，你最后望了一眼这座生活了几年的城市。",
      choices: [
        { label: "回国，趁热打铁", effect: (s) => { add(s, "network", 10); add(s, "strategy", 6); add(s, "reputation", 6); flag(s, "haigui_back"); return "你拖着行李箱回到祖国。海归的光环还在，机会的大门正一扇扇向你打开。"; } },
        { label: "留下，卷一张绿卡", effect: (s) => { flag(s, "overseas"); add(s, "cash", 80000); add(s, "mood", -4); add(s, "health", -2); return "你选择留下。收入更高，孤独也更深。逢年过节，朋友圈里的故乡总让你愣神。"; } }
      ] },

    // ============ MODULE: era（2026+ 未来大事件，按 s.year 触发）============
    { id: "ev_ai_replace", module: "era", ambient: true, once: true, cond: (s) => s.year >= 2026 && s.year <= 2033 && s.stageId !== "elder",
      title: "🤖 AI 抢饭碗", text: (s) => byClass(s, {
        poor: "公司悄悄上线了一套 AI 系统，你干的那些活，它一晚上就干完了。HR 约你「聊聊」时，你后背一阵发凉。",
        mid: "AI 把整个行业搅了个天翻地覆。有人被取代，有人靠它一个顶仨。你正站在这条岔路口上。",
        rich: "满世界都在为 AI 焦虑，你却淡定地投了几家 AI 公司——时代的镰刀，你宁愿握着把手那一头。"
      }),
      choices: [
        { label: "All in 学 AI，做驾驭它的人", effect: (s) => { add(s, "knowledge", 8); add(s, "insight", 5); flag(s, "ai_native"); return "你逼自己啃下了一身 AI 本事，从被取代的恐慌，变成了用它提效的少数人。"; } },
        { label: "抵触它，守着老本行", effect: (s) => { add(s, "mood", -5); add(s, "stress", 6); return "你对 AI 充满敌意，固执地守着旧手艺。可时代的车轮，从不会为谁停下。"; } }
      ] },
    { id: "ev_robot_nanny", module: "era", ambient: true, once: true, cond: (s) => s.year >= 2029 && s.year <= 2040,
      title: "🦿 机器人进家门", text: () => "人形机器人开始走进普通家庭，做饭、打扫、带娃样样行，价格一降再降。邻居家上周刚添了一台。",
      choices: [
        { label: "咬牙买一台，解放双手", effect: (s) => { add(s, "cash", -60000); add(s, "health", 6); add(s, "mood", 6); return "家务有了机器人代劳，你头一回觉得时间是自己的。只是偶尔，会被它过于完美的微笑弄得有点发毛。"; } },
        { label: "机器人养老？我信不过", effect: (s) => { add(s, "insight", 2); return "你婉拒了这股潮流，坚持凡事自己动手。是固执，还是清醒，只有时间知道。"; } }
      ] },
    { id: "ev_birth_crisis", module: "era", ambient: true, once: true, cond: (s) => s.year >= 2027 && s.year <= 2042 && s.age >= 25 && s.age <= 45,
      title: "👶 催生大礼包", text: () => "出生率跌破历史新低，国家发下真金白银的催生补贴：生一个奖一笔，还送购房折扣。七大姑八大姨的电话也跟着多了起来。",
      choices: [
        { label: "响应号召，要个孩子", effect: (s) => { if (has(s, "partner")) { if (typeof recordChildBirth === "function") recordChildBirth(s, {}); else flag(s, "has_kid"); add(s, "cash", 50000); add(s, "mood", 8); return "在补贴和家人的双重攻势下，你迎来了新生命。账上多了一笔奖励，肩上多了一份甜蜜的重担。"; } add(s, "mood", -2); return "你倒是想响应，可你连个对象都还没有。补贴再香，也得先有人陪你一起领啊。"; } },
        { label: "不为所动，坚持自己的节奏", effect: (s) => { add(s, "insight", 2); add(s, "mood", 2); flag(s, "dink_lean"); return "你笑着把宣传册放下。生不生是自己的事，再多补贴也买不走你的人生主张。"; } }
      ] },
    { id: "ev_delay_retire", module: "era", ambient: true, once: true, cond: (s) => s.year >= 2030 && s.age >= 45 && s.age <= 62,
      title: "🧓 延迟退休落地", text: () => "延迟退休正式实施。你算了算，原本盼着的退休年龄，又往后挪了好几年——「干到老」从段子变成了现实。",
      choices: [
        { label: "认命，继续搬砖", effect: (s) => { add(s, "stress", 6); add(s, "mood", -4); return "你默默接受了现实，把退休的念想又往后压了压。还能动，就还得干。"; } },
        { label: "提前规划，搞副业养老", effect: (s) => { add(s, "strategy", 4); add(s, "cash", Math.round(s.stats.strategy * 500)); return "你早早布局，给自己攒下一条退路。与其指望体制，不如指望自己。"; } }
      ] },
    { id: "ev_fusion", module: "era", ambient: true, once: true, cond: (s) => s.year >= 2034 && s.year <= 2044,
      title: "☀️ 人造太阳点亮", text: () => "可控核聚变商用的消息刷了屏。有人说能源自由的时代来了，电费便宜到忽略不计；也有人说，这又是一轮资本的狂欢与泡沫。",
      choices: [
        { label: "信它，重仓聚变概念", effect: (s) => { const align = s.eraWind === "聚变能源"; const m = align ? Math.round(80000 + s.cash * 0.2) : -Math.round(20000 + s.cash * 0.05); add(s, "cash", m); add(s, "insight", 2); return align ? `你押对了，聚变板块一飞冲天，狠狠赚了 ¥${m.toLocaleString()}。` : `你冲了进去，却发现是高位接盘，亏掉 ¥${(-m).toLocaleString()}。`; } },
        { label: "再观望观望", effect: (s) => { add(s, "insight", 2); return "你按住了蠢蠢欲动的手。颠覆性的东西，往往先埋葬一批最早冲进去的人。"; } }
      ] },
    { id: "ev_war", module: "era", ambient: true, cond: (s) => s.year >= 2026 && s.year <= 2055,
      title: "🌍 远方的战火", text: () => "地区冲突骤然升级，新闻里满是不安的消息。物价开始波动，股市绿成一片，连小区超市的米面油都有人在囤。",
      choices: [
        { label: "囤点物资，求个安心", effect: (s) => { add(s, "cash", -8000); add(s, "mood", 3); return "你囤了满满一柜子米面粮油。用不用得上另说，乱世里，心安比什么都贵。"; } },
        { label: "危中寻机，抄底避险资产", effect: (s) => { if (s.stats.insight > 50 && rnd(0.4)) { add(s, "cash", 120000); return "你逆势布局黄金与避险资产，事后证明眼光毒辣，狠狠赚了一笔。"; } add(s, "cash", -Math.round(20000 + Math.random() * 40000)); flag(s, "got_scammed"); return "你想抄底，却抄在了半山腰。乱世里的钱，比想象中难赚得多。"; } },
        { label: "与我无关，照常生活", effect: (s) => { add(s, "mood", -2); return "你关掉新闻，继续过自己的日子。再宏大的叙事，最终都落成柴米油盐的涨与跌。"; } }
      ] },

    // ============ 每个大阶段一个「明确选择」（进入阶段时触发）============
    { id: "ev_dec_youth", module: "career",
      title: "🧭 青年的岔路口",
      text: (s) => {
        var poor = has(s, "bg_childhood_poor") || has(s, "born_poor") || has(s, "fallen") || s.cash < 5000;
        var rich = has(s, "silver_spoon") || has(s, "nouveau_riche") || s.cash >= 200000;
        // —— 直接点名「你这一身来路」，让岔路口明显是顺着前面的选择长出来的 ——
        var bits = [];
        if (has(s, "silver_spoon")) bits.push("含着金汤匙长大");
        else if (has(s, "bg_childhood_poor") || has(s, "born_poor")) bits.push("在寒门里摸爬滚打长大");
        else if (has(s, "bg_childhood_intellectual")) bits.push("在满墙书香里熏着长大");
        else if (has(s, "bg_childhood_cadre")) bits.push("在大院的人情世故里长大");
        if (has(s, "bg_teen_topper")) bits.push("做题家一路杀到这里");
        else if (has(s, "bg_teen_jock")) bits.push("在球场和赛道上挥洒过青春");
        else if (has(s, "bg_teen_social")) bits.push("当过全校都认识的孩子王");
        else if (has(s, "bg_teen_loner")) bits.push("沉在自己的世界里偷偷发光");
        if (has(s, "bg_youth_love")) bits.push("谈过一场轰轰烈烈的早恋");
        else if (has(s, "bg_youth_grind")) bits.push("把青春押给了一场场竞赛");
        else if (has(s, "bg_youth_rebel")) bits.push("在网吧和街头野过一阵");
        else if (has(s, "bg_youth_hustle_teen")) bits.push("早早尝过倒腾小生意的甜头");
        if (has(s, "fallen")) bits.push("又撞上家道中落，尝尽世态炎凉");
        else if (has(s, "nouveau_riche")) bits.push("家里又突然暴富，给了你底气");
        var recap = bits.length ? bits.join("、") + "——" : "";
        var tail = poor
          ? "如今刚成年，别人的青春像旷野，你的更像窄桥：家底薄、试错贵，接下来每一步都得算着走。"
          : rich
            ? "如今刚成年，你手里攥着别人没有的缓冲垫，路很多——可资源不是免死金牌，怎么花才是问题。"
            : "如今刚成年，世界刚把门推开一条缝。而你这一身来路，正悄悄决定着——哪些门，真的会向你打开。";
        return recap + tail;
      },
      dynamicChoices: (s) => {
        var ch = [];
        var academic = has(s, "bg_teen_topper") || has(s, "bg_teen_loner") || has(s, "bg_youth_grind") || has(s, "bg_childhood_intellectual") || s.stats.knowledge >= 42;
        var poor = has(s, "bg_childhood_poor") || has(s, "born_poor") || has(s, "fallen") || s.cash < 5000;
        var rich = has(s, "silver_spoon") || has(s, "nouveau_riche") || s.cash >= 200000;
        var cadre = has(s, "bg_childhood_cadre");
        var hustler = has(s, "bg_youth_hustle_teen") || has(s, "bg_youth_rebel") || s.stats.strategy >= 42;
        var sporty = has(s, "bg_teen_jock") || s.stats.body >= 42;
        var social = has(s, "bg_teen_social") || has(s, "bg_youth_love") || s.stats.charm >= 42;
        if (academic) ch.push({
          label: has(s, "bg_youth_grind") || has(s, "bg_teen_topper") ? "延续做题优势，冲更高学历" : "把学术当跳板，继续深造",
          effect: (s) => { add(s, "knowledge", 3); add(s, "insight", 2); add(s, "stress", 4); bumpMomentum(s, 8); flag(s, "path_grad"); return "这条路不是谁都适合，但你的底子够。你把接下来几年押给自习室、实验室和一场又一场考试。慢是慢，门槛也高，可它确实能把你送到更远的地方。"; }
        });
        if (poor || has(s, "fallen")) ch.push({
          label: has(s, "fallen") ? "先把家道中落的窟窿补上" : "先赚钱，把自己和家里撑起来",
          effect: (s) => { add(s, "cash", 12000); add(s, "strategy", 3); add(s, "stress", 4); add(s, "health", -2); bumpMomentum(s, 6); flag(s, "path_work"); flag(s, "path_survival"); return "你没有太多浪漫选择。别人还在讨论理想和远方，你先学会算房租、饭钱和家里的难处。社会这所大学很硬，但你入学得比谁都早。"; }
        });
        if (rich) ch.push({
          label: has(s, "nouveau_riche") ? "拿新钱试错，先见世面" : "利用家里资源，做一段高质量试错",
          effect: (s) => { add(s, "cash", -15000); add(s, "network", 4); add(s, "charm", 2); add(s, "insight", 2); bumpMomentum(s, 8); flag(s, "path_resource"); return "你用家里给的缓冲垫换来实习、旅行、项目和人脉。资源确实能买到见识，但买不到判断力。你开始明白：起点高不是结局好，只是犯错时摔得没那么疼。"; }
        });
        if (cadre && !poor) ch.push({
          label: "按家里建议，走选调/考公预备线",
          effect: (s) => { add(s, "knowledge", 2); add(s, "network", 3); add(s, "strategy", 2); add(s, "stress", 3); bumpMomentum(s, 6); flag(s, "path_official"); return "你从小见过饭桌上的人情世故，也知道稳定背后的门道。你开始准备选调、考公和体制内规则——这不是躺平，是另一套漫长的竞争。"; }
        });
        if (hustler) ch.push({
          label: has(s, "bg_youth_hustle_teen") ? "把小生意做大，早点下场赚钱" : "不再只读书，去社会里搏机会",
          effect: (s) => { add(s, "cash", 14000); add(s, "strategy", 3); add(s, "network", 2); add(s, "stress", 5); bumpMomentum(s, 7); flag(s, "path_hustle"); return "你对教室外面的世界更敏感。摆摊、接单、倒卖、跑业务，哪怕一开始不体面，也能让你更快摸到钱和人性的温度。只是这条路野，摔跤也疼。"; }
        });
        if (sporty && !academic) ch.push({
          label: "走体育/技能证书路线，先靠身体和手艺吃饭",
          effect: (s) => { add(s, "health", 4); add(s, "body", 2); add(s, "charm", 1); add(s, "cash", 8000); bumpMomentum(s, 5); flag(s, "path_skill"); return "你没把自己硬塞进纯学历赛道，而是顺着身体和实操能力去找出路。训练、证书、教练、技工、安保、体能类工作，都比空想更实在。"; }
        });
        if (social) ch.push({
          label: "混社团/实习/人脉，练会做人",
          effect: (s) => { add(s, "network", 4); add(s, "charm", 2); add(s, "strategy", 1); add(s, "mood", 4); bumpMomentum(s, 6); flag(s, "path_social"); return "你把青春的一部分花在人身上：社团、实习、饭局、合作和暧昧。有人笑你不够专心，可你知道，很多门不是分数敲开的，是人替你留的。"; }
        });
        if (!poor && !has(s, "fallen") && (rich || social || s.stats.charm >= 38)) ch.push({
          label: "留一段空白，认真享受青春",
          effect: (s) => { add(s, "mood", 8); add(s, "charm", 2); add(s, "health", 3); add(s, "cash", -6000); bumpMomentum(s, 4); flag(s, "path_enjoy"); return "你没有急着把每一分钟都换成履历。恋爱、旅行、社团、通宵、犯傻——这些不一定变现，却会成为你后来反复想起的光。只是空白很贵，得有人付账。"; }
        });
        if (!ch.length || (!poor && ch.length < 4)) ch.push({
          label: "稳妥一点：边找工作边继续学习",
          effect: (s) => { add(s, "cash", 8000); add(s, "knowledge", 2); add(s, "strategy", 2); add(s, "stress", 3); bumpMomentum(s, 4); flag(s, "path_balanced"); return "你没有把所有筹码压到一边。白天找工作、做兼职，晚上学习补短板。慢一点，但不至于把自己逼到没有退路。"; }
        });
        return ch.slice(0, 6);
      } },
    { id: "ev_dec_hustle", module: "career",
      title: "🧭 事业的十字路口", text: () => "二十五六，同龄人开始拉开差距。你掂量着手里的牌，决定押注哪条路？",
      choices: [
        { label: "挤进大厂，搏一个高薪", effect: (s) => { add(s, "cash", 40000); add(s, "strategy", 6); add(s, "stress", 8); flag(s, "bigtech"); return "你拿到了大厂 offer，工牌闪亮、薪水可观，代价是头发，和那部永远在震动的工作手机。"; } },
        { label: "考公进体制，求个安稳", effect: (s) => { add(s, "health", 6); add(s, "network", 6); add(s, "mood", 4); flag(s, "civil_servant"); s.civilRank = 1; return "千军万马过独木桥，你上岸了。岁月静好，一眼望到退休——是福是困，因人而异。"; } },
        { label: "自己干，立项创业", next: (s) => startupNode(s) },
        { label: "佛系躺平，够用就好", effect: (s) => { add(s, "mood", 8); add(s, "health", 4); add(s, "stress", -8); flag(s, "lie_flat"); return "你看淡了那场名为「成功」的赛跑，把日子过慢。别人笑你没出息，你却睡得格外香。"; } }
      ] },
    { id: "ev_dec_midlife", module: "career",
      title: "🧭 中年突围", text: () => "三十五岁，你站在人生下半场的入口。是求稳，还是再赌一把？",
      choices: [
        { label: "稳住主业，安稳落地", effect: (s) => { add(s, "health", 4); add(s, "stress", -4); flag(s, "steady"); return "你收起了野心，把重心放回家庭与健康。不再向上突围，而是向内扎根。"; } },
        { label: "二次创业，再搏一次", next: (s) => startupNode(s) },
        { label: "转型新赛道，逼自己学习", effect: (s) => { add(s, "knowledge", 8); add(s, "insight", 5); add(s, "stress", 6); return "你逼着中年的自己重新当学生，啃新知识、考新证书。难，但你不想就这么被淘汰。"; } }
      ] },
    { id: "ev_dec_senior", module: "oldage",
      title: "🧭 退休规划", text: () => "五十岁，退休的轮廓越来越清晰。剩下的人生，你想怎么安排？",
      choices: [
        { label: "发挥余热，带带年轻人", effect: (s) => { add(s, "reputation", 8); add(s, "mood", 4); flag(s, "was_mentor"); return "你把一身经验传给后辈，被人尊称一声「老师」。这种被需要的感觉，比钱实在。"; } },
        { label: "含饴弄孙，回归家庭", effect: (s) => { add(s, "mood", 10); add(s, "health", 4); flag(s, "family_first"); return "你推掉了应酬，把时间还给家人。粗茶淡饭、儿孙绕膝，原来这才是奢侈。"; } },
        { label: "趁还能动，周游世界", effect: (s) => { add(s, "mood", 12); add(s, "cash", -Math.round(50000 + Math.random() * 100000)); add(s, "insight", 4); return "你拖着行李箱走遍山海。钱花出去了，可那些风景和故事，谁也夺不走。"; } }
      ] },

    // ============ 人生大事件（不是结局，发生后人生继续）============
    { id: "ev_ipo", module: "startup", ambient: true, cond: (s) => has(s, "chase_ipo") && s.startup && !has(s, "startup_done") && s.startup.valuation > 4500000 && (s.age - (s.startup.foundedAge || s.age)) >= 8,
      title: "🔔 敲钟时刻", text: (s) => `多年血汗，终于走到这一天。交易所的大屏上跳动着你公司的代码，估值定格在 ¥${s.startup.valuation.toLocaleString()}。`,
      choices: [
        { label: "敲钟！这一刻属于你", effect: (s) => { const pi = s.world ? s.world.priceIndex : 1; const got = bigWindfall(s, 55000000 + (s.startup.valuation || 0) / pi * 0.8); add(s, "assets", got); flag(s, "startup_done"); add(s, "mood", 16); add(s, "reputation", 12); add(s, "stress", -10); const yi = got / pi >= 1e10 ? "——你一夜跻身富豪榜" : got / pi >= 1e9 ? "，身价以十亿计" : ""; return `钟声响起，掌声雷动。上市首日股价一路狂飙，你手里的股票市值定格在 ¥${got.toLocaleString()}${yi}。你成了别人口中的传奇——只是敲完钟的第二天，你忽然不知道，明天该为什么起床。`; } }
      ] },
    { id: "ev_emigrate", module: "money", ambient: true, cond: (s) => has(s, "cashed_out") && (s.cash + s.assets) > 3000000 && !has(s, "emigrated") && !has(s, "stay_decided"),
      title: "🛫 要不要润", text: () => "财富自由后，一个念头冒了出来：带着家人移民海外，换一种活法。机票就在购物车里，点不点结算？",
      choices: [
        { label: "润！去过想要的生活", effect: (s) => { flag(s, "emigrated"); add(s, "mood", 8); add(s, "cash", -Math.round((s.cash + s.assets) * 0.1)); add(s, "network", -15); return "你卖掉国内的大半家当，举家搬去了海外。空气是清新的，只是逢年过节，故乡的味道总在梦里。"; } },
        { label: "不润，根在这里", effect: (s) => { flag(s, "stay_decided"); add(s, "reputation", 4); return "你想了想，还是留下了。这片土地有你的根、你的人、你打下的江山。"; } }
      ] },
    { id: "ev_bankrupt", module: "money", ambient: true, cond: (s) => s.cash < -200000,
      title: "💸 资金链断了", text: () => "债主堵了门，电话被打爆。你看着账户上刺眼的负数，意识到这一关，是真的没扛过去。",
      choices: [
        { label: "申请破产重组，从头再来", effect: (s) => { const lost = Math.round(s.assets * 0.7); add(s, "assets", -lost); s.cash = 8000; if (s.startup) { flag(s, "startup_done"); } delete s.flags.chase_ipo; add(s, "mood", -18); add(s, "health", -8); add(s, "stress", 15); add(s, "insight", 5); flag(s, "been_bankrupt"); return `你签下破产重组协议，房子车子公司一夜清零，净身出户。跌到谷底那天，你反而踏实了——至少，不用再怕往下掉。`; } },
        { label: "借高利贷，赌一把翻身", effect: (s) => { if (rnd(0.2)) { add(s, "cash", 300000); add(s, "stress", 12); return "你借了笔要命的钱续命，竟奇迹般缓了过来。这一把，你赌赢了——但手心全是汗。"; } add(s, "cash", -200000); add(s, "health", -10); add(s, "stress", 18); flag(s, "been_bankrupt"); return "你越借越多，窟窿越填越大。高利贷的电话，成了你后半生最深的噩梦。"; } }
      ] },

    // ============ MODULE: domestic（恋爱之后：结婚 → 生娃）============
    { id: "ev_marry", module: "domestic", ambient: true, cond: (s) => has(s, "partner") && !has(s, "married") && !has(s, "marry_no") && s.age >= 24 && s.age <= 45,
      title: "💍 谈婚论嫁", text: (s) => byClass(s, {
        poor: `在一起这些年，${s.partnerName || "ta"} 没提过房和车，只问你：「以后的日子，想不想一起过？」可一想到彩礼、酒席、首付，你的笑就僵住了。`,
        mid: `${s.partnerName || "ta"} 把话挑明了：「我们，结婚吧？」双方父母也开始催。甜蜜背后，是一笔不小的开销和两个家庭的拉扯。`,
        rich: `求婚戒指你早就备好了。${s.partnerName || "ta"} 红着眼答应时，你想的却是——这桩婚事，门当户对，皆大欢喜。`
      }),
      choices: [
        { label: "结！搭伙过一辈子", next: (s) => ({
            text: () => "婚是结定了。可这场婚礼，办成什么样？",
            choices: [
              { label: "大操大办，风风光光", effect: (s) => { if (typeof familyMarry === "function") familyMarry(s); else flag(s, "married"); add(s, "cash", -byClass(s, { poor: 80000, mid: 200000, rich: 800000 })); add(s, "mood", 14); add(s, "network", 6); return "宾客满堂，红包收到手软（虽然填不平酒席的窟窿）。你们在众人的祝福里，许下了后半生。"; } },
              { label: "领证旅行，一切从简", effect: (s) => { if (typeof familyMarry === "function") familyMarry(s); else flag(s, "married"); add(s, "cash", -byClass(s, { poor: 8000, mid: 20000, rich: 50000 })); add(s, "mood", 10); add(s, "insight", 2); return "一张证、一次旅行，没惊动太多人。亲戚说你们寒酸，可你们知道，婚姻的重量从不在排场里。"; } }
            ]
          }) },
        { label: "再等等，事业为重", effect: (s) => { add(s, "strategy", 3); add(s, "mood", -4); if (rnd(0.35)) { s.partnerName = null; delete s.flags.partner; flag(s, "marry_no"); return "你又一次把「以后再说」挂在嘴边。这一次，ta 没有再等，转身离开了。"; } return "对方选择了继续等你。你松了口气，却也欠下了一份沉甸甸的亏欠。"; } }
      ] }
);
