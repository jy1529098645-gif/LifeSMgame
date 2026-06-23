"use strict";
/* ==================================================================
 * content/events-world.js
 * 时代大事件 —— 让庞大的动态世界「活」在玩家眼前。
 * 按 s.year 年代区间（可叠加 s.world 状态）gate，让时代真的「按年降临」。
 * 只追加 EVENTS。s.world.{jobMarket/priceIndex/windHeat/momentum} 只读：
 *   仅用于 gate 与叙述；后果一律用 add / flag / bumpMomentum / socialShift 落地。
 * ================================================================== */

EVENTS.push(
  /* 1. 经济腾飞 / 万元户潮 ——————————————————————————————— */
  {
    id: "ev_world_wanyuanhu",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 1984 && s.year <= 1990 && s.age >= 16,
    title: "🌍 万元户：第一批先富起来的人",
    text: (s) => byClass(s, {
      poor: "村口大喇叭天天念，谁家成了「万元户」，戴大红花上了报纸。你蹲在自家土墙根下，听见时代在远处轰隆作响，却离你的口袋很远。",
      mid: "粮票还没退场，「下海」「个体户」却已经挂在每个人嘴边。单位里有人辞职去倒腾买卖，被说成「不要前途」，可人家半年就盖了新房。",
      rich: "你家境尚可，可眼看着身边胆子大的人靠一台缝纫机、一辆三轮车就攒下别人十年的工钱。安稳，开始显得有点贵。"
    }),
    choices: [
      {
        label: "辞掉稳定，下海试一把",
        next: (s) => ({
          text: (s) => "你把这念头说出口，全家像炸了锅。父亲拍桌子：「铁饭碗是命！」可你心里那点火，已经压不住了。",
          choices: [
            { label: "倒腾紧俏商品", effect: (s) => { const gain = rnd(0.6) ? 14000 : -4000; add(s, "cash", gain); add(s, "strategy", 5); add(s, "insight", 3); flag(s, "world_xiahai"); bumpMomentum(s, gain > 0 ? 8 : -5); return gain > 0 ? `你蹬着三轮跑遍批发市场，把南方的新鲜货倒到县城。账本第一次出现了「万」这个位数，你成了别人口中那种人。` : `第一批货压在手里发了霉，你才知道「胆子大」和「会做生意」不是一回事。交了学费，但下海这条路你算是踩上了。`; } },
            { label: "开间小店面", effect: (s) => { add(s, "cash", -3000); add(s, "charm", 4); add(s, "network", 5); flag(s, "world_getihu"); bumpMomentum(s, 4); return `你支起一间小铺面，从早守到晚。利薄、活累，可每天进出的现金流，让你第一次摸到了「自己当老板」的踏实与心慌。`; } }
          ]
        })
      },
      { label: "守住单位，看别人折腾", effect: (s) => { add(s, "insight", 3); add(s, "mood", -2); bumpMomentum(s, -3); return "你选择按月领工资，过有数的日子。多年后你偶尔会想，要是当年也跟着下海……可那班车，只在那几年停过站。"; } }
    ]
  },

  /* 2. 楼市狂潮 ——————————————————————————————————————— */
  {
    id: "ev_world_property_boom",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2003 && s.year <= 2010 && s.age >= 22,
    title: "🌍 楼市：早买早赚的疯狂",
    text: (s) => "售楼处的红色横幅一栋接一栋，「日光盘」「连夜排队」上了新闻。亲戚饭桌上只有一个话题：买房。买了的人，资产一年翻一番；没买的人，眼睁睁看着首付追不上涨价。",
    choices: [
      {
        label: "上车，砸锅卖铁也要买",
        next: (s) => ({
          text: (s) => "你凑齐六个钱包的首付，签字的手在抖。售楼小姐笑得灿烂：「您这眼光，明年就回本。」窗外是一片正在拔地而起的工地。",
          choices: [
            { label: "全款拼一套", effect: (s) => { add(s, "cash", -200000); add(s, "assets", 320000); flag(s, "world_homeowner"); add(s, "stress", 4); bumpMomentum(s, 9); socialShift(s, 4); return "你把大半积蓄换成一套房。账面上的数字让人安心，亲戚看你的眼神也变了——在这个国家，房子从来不只是住的地方。"; } },
            { label: "贷款上杠杆，再买一套", effect: (s) => { add(s, "cash", -120000); add(s, "assets", 600000); flag(s, "world_homeowner"); flag(s, "world_property_leverage"); add(s, "stress", 12); bumpMomentum(s, 12); return "你背上三十年房贷，赌时代不会停。月供像悬在头顶的剑，可只要房价还在涨，你就是站在浪头上的人。"; } }
          ]
        })
      },
      {
        label: "观望，觉得这是泡沫",
        effect: (s) => {
          add(s, "insight", 3); add(s, "mood", -4); bumpMomentum(s, -6);
          flag(s, "world_property_renter");
          return s.world && s.world.priceIndex > 1.3
            ? "你判断这是泡沫，捂紧现金等崩盘。可水位一年比一年高，房价没等来下跌，物价倒先涨了一轮。等待的代价，有时比冒险更贵。"
            : "你决定再等等，没急着上车。理性是理性的，只是这一轮，时代奖励了胆大的人。你把这份遗憾收进心里，学会了下次别再只当旁观者。";
        }
      }
    ]
  },

  /* 3. 下岗潮 / 国企改制 ——————————————————————————————— */
  {
    id: "ev_world_layoff_soe",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 1996 && s.year <= 2002 && s.age >= 20,
    title: "🌍 下岗潮：铁饭碗碎了",
    text: (s) => byClass(s, {
      poor: "厂子停了大半,门口名单上的名字越来越多。买断工龄的钱攥在手里,薄得像一张过期的票据。一家人的明天,忽然没了着落。",
      mid: "「工人老大哥」的牌子还挂着,人却要被「优化」了。下岗、买断、再就业培训——这些新词,一个个砸在你和工友头上。",
      rich: "你或家人离这场寒潮稍远,可身边一夜之间从体面职工变成街边修车、卖早点的人,实在太多。秩序在松动,你看得心里发紧。"
    }),
    choices: [
      {
        label: "趁年轻转型,学门新手艺",
        next: (s) => ({
          text: (s) => "你不肯就这么沉下去。培训班、夜校、跟人学手艺——哪条路都不轻松,可总比守着空厂房等天亮强。",
          choices: [
            { label: "学开车跑运输", effect: (s) => { add(s, "cash", -5000); add(s, "body", 3); add(s, "strategy", 4); flag(s, "world_reskill"); bumpMomentum(s, 5); return "你考下驾照,凑钱盘了辆二手货车。方向盘一握,人就有了去处。跑长途很苦,但路在脚下,饭碗也就在脚下。"; } },
            { label: "盘个早点摊", effect: (s) => { add(s, "cash", -2000); add(s, "charm", 3); add(s, "network", 4); flag(s, "world_reskill"); bumpMomentum(s, 3); return "天没亮你就支起油锅,热气腾腾里一声声吆喝。从「厂里的师傅」到「摊上的老板」,身份变了,可那股不认命的劲没变。"; } }
          ]
        })
      },
      { label: "认命,守着旧日子慢慢沉", effect: (s) => { add(s, "mood", -8); add(s, "stress", 6); add(s, "insight", 2); bumpMomentum(s, -10); return "你没等来转机,也没去找转机。日子一天天过,人一天天闷。时代翻篇的时候,有些人被留在了上一页——你尝过那种被甩下的滋味。"; } }
    ]
  },

  /* 4. 互联网泡沫破裂 ————————————————————————————————— */
  {
    id: "ev_world_dotcom_bust",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2000 && s.year <= 2002 && s.age >= 18,
    title: "🌍 互联网泡沫:神话一夜蒸发",
    text: (s) => "前两年还满天飞的「.com」「眼球经济」「烧钱换流量」,转眼成了笑话。网站一家家关停,曾经意气风发的创业者,开始投简历找一份「踏实工作」。",
    choices: [
      { label: "趁低谷,反而钻进技术里", effect: (s) => { add(s, "knowledge", 6); add(s, "insight", 5); add(s, "stress", 3); flag(s, "world_tech_seed"); bumpMomentum(s, 4); return "别人逃离的时候,你蹲下来读代码、学网络。你隐约觉得:死掉的是泡沫,不是互联网。能在冬天扎根的种子,才赶得上下一个春天。"; } },
      { label: "幸好没冲进去,庆幸保守", effect: (s) => { add(s, "mood", 3); add(s, "insight", 2); bumpMomentum(s, -1); return "你为自己当初的犹豫松了口气——那些纸上富贵,如今一文不值。只是你也隐隐知道,躲过这一劫,不等于看懂了下一程。"; } },
      { label: "抄底买了一堆「便宜」概念", effect: (s) => { const gain = rnd(0.4 + s.stats.insight / 300) ? 22000 : -16000; add(s, "cash", gain); add(s, "stress", 7); bumpMomentum(s, gain > 0 ? 6 : -8); return gain > 0 ? `你赌真正的公司会在废墟里活下来,几年后它们果然长成参天大树,给了你 ¥${gain.toLocaleString()} 的回报。` : `你以为是抄底,结果它们一家家退市清盘。¥${(-gain).toLocaleString()} 教会你:便宜的东西,可能根本没有底。`; } }
    ]
  },

  /* 5. 全球金融危机 (gate 2008± + jobMarket 低) ——————————— */
  {
    id: "ev_world_gfc_2008",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2008 && s.year <= 2010 && s.age >= 18,
    title: "🌍 2008:海啸拍到了你这",
    text: (s) => {
      const cold = s.world && s.world.jobMarket < 40;
      return "华尔街的银行轰然倒塌,新闻滚动播放着「百年一遇」。出口工厂订单被取消,招聘会冷清得吓人。" +
        (cold ? "你能从空气里闻到那股寒意——身边已经有人被裁,有人减薪,没人敢乱花钱。" : "海外的风暴正越过海面,朝你所在的地方压过来。");
    },
    choices: [
      {
        label: "现金为王,缩到最小活下去",
        effect: (s) => { add(s, "cash", -3000); add(s, "stress", 6); add(s, "insight", 4); flag(s, "world_gfc_survive"); bumpMomentum(s, -8); return "你砍掉一切不必要的开销,把现金死死攥住。别人笑你胆小,可大浪里能浮着,本身就是一种本事。"; }
      },
      {
        label: "趁恐慌,逆势布局资产",
        next: (s) => ({
          text: (s) => "满世界都在抛售,价格跌到没人敢看。你心跳得厉害:这到底是悬崖,还是黄金坑?手里那点钱,押还是不押?",
          choices: [
            { label: "重仓抄底", effect: (s) => { const win = rnd(0.5 + s.stats.insight / 250); const g = win ? Math.round(50000 + s.cash * 0.12) : -Math.round(30000 + s.cash * 0.06); add(s, "cash", g); add(s, "stress", 11); bumpMomentum(s, win ? 12 : -12); return win ? `你在血流成河时买进。两年后政策放水、市场回暖,账户多了 ¥${g.toLocaleString()}。手抖过,但你没松。` : `你以为踩到了底,底下还有十八层地狱。¥${(-g).toLocaleString()} 蒸发后,你对「危机入市」四个字有了敬畏。`; } },
            { label: "小试一笔,留好退路", effect: (s) => { const g = rnd(0.55) ? 18000 : -6000; add(s, "cash", g); add(s, "strategy", 4); bumpMomentum(s, g > 0 ? 5 : -3); return g > 0 ? `你只押了能承受亏掉的那部分,反弹来时稳稳赚了 ¥${g.toLocaleString()}。不贪,反而走得远。` : `小亏 ¥${(-g).toLocaleString()},但你睡得着觉。这一仗你保住了本金,也保住了下一次出手的资格。`; } }
          ]
        })
      },
      { label: "抓住稳定的活,先有口饭吃", effect: (s) => { add(s, "knowledge", 3); add(s, "stress", 4); flag(s, "world_seek_stable"); bumpMomentum(s, -4); return "你放下身段,接住任何一份能发工资的活。在就业冰封的年头,有事做、有钱进,就是最实在的安全感。"; } }
    ]
  },

  /* 6. 移动互联网爆发 ————————————————————————————————— */
  {
    id: "ev_world_mobile_internet",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2012 && s.year <= 2016 && s.age >= 18,
    title: "🌍 移动互联网:屏幕里的新大陆",
    text: (s) => "一夜之间,打车、外卖、支付、社交全塞进了一块小屏幕。地铁里全是低头的人。投资人追着创业者跑,「APP」成了最值钱的两个字母。",
    choices: [
      {
        label: "冲进风口,加入创业大军",
        next: (s) => ({
          text: (s) => "你递了辞呈,挤进一家连工牌都没印好的小公司。白板上画满了增长曲线,空气里全是「改变世界」的味道。累,但你离风口很近。",
          choices: [
            { label: "做技术合伙人", effect: (s) => { add(s, "knowledge", 6); add(s, "network", 6); add(s, "health", -4); flag(s, "world_mobile_founder"); bumpMomentum(s, 8); return "你熬夜写代码、改产品,看着用户曲线第一次往上翘。不管这家公司能不能活下来,你都成了真正趟过这条河的人。"; } },
            { label: "做地推与增长", effect: (s) => { add(s, "charm", 5); add(s, "strategy", 5); add(s, "stress", 5); flag(s, "world_mobile_founder"); bumpMomentum(s, 7); return "你带着补贴券扫遍街头巷尾,把一个个用户拉进来。烧钱换增长的年代,你站在最前线,见过它最疯狂也最真实的样子。"; } }
          ]
        })
      },
      { label: "学产品和数据,稳稳上车", effect: (s) => { add(s, "knowledge", 5); add(s, "insight", 4); flag(s, "world_mobile_skill"); bumpMomentum(s, 4); return "你没辞职去冒险,但把每个夜晚砸进了原型图和转化率。等大厂开出高薪抢人时,你的简历正好踩在了风口上。"; } },
      { label: "嫌估值太虚,继续走老路", effect: (s) => { add(s, "insight", 1); add(s, "mood", -2); bumpMomentum(s, -3); return "你觉得那些故事太轻飘,守着看得见摸得着的生意。只是往后几年,手机里的世界越来越大,大到再难假装它不存在。"; } }
    ]
  },

  /* 7. 全民牛市 → 股灾 (联动 windHeat) —————————————————— */
  {
    id: "ev_world_stock_mania",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2014 && s.year <= 2016 && s.age >= 20,
    title: "🌍 全民牛市:贪婪与踩踏",
    text: (s) => {
      const hot = s.world && s.world.windHeat > 50;
      return "菜场大妈都在聊涨停,理发师给你推荐股票,「闭眼买都赚」成了口头禅。" +
        (hot ? "风口热得发烫,人人都觉得自己是股神。" : "指数一路狂奔,空气里全是发财的味道。") +
        "你心里那点贪,被点着了。";
    },
    choices: [
      {
        label: "满仓杀入,加杠杆配资",
        next: (s) => ({
          text: (s) => "账户一天天飘红,你换了手机、请了客,盘算着再借点钱放大收益。然后某一天,大盘开始往下砸,千股跌停,卖都卖不出去。",
          choices: [
            { label: "死扛,赌它反弹", effect: (s) => { const g = -Math.round(40000 + s.cash * 0.1); add(s, "cash", g); add(s, "stress", 14); add(s, "health", -4); bumpMomentum(s, -14); return `你不信会一直跌,越套越深。等回过神,配资被强平,本金加借的钱一起灰飞烟灭,亏掉 ¥${(-g).toLocaleString()}。贪婪的尽头,是踩踏。`; } },
            { label: "割肉离场,保住残命", effect: (s) => { const g = -Math.round(18000 + s.cash * 0.04); add(s, "cash", g); add(s, "insight", 5); add(s, "stress", 6); bumpMomentum(s, -6); return `你忍痛斩仓,亏了 ¥${(-g).toLocaleString()} 出局。看着后面接连的跌停,你后怕地发现:在股灾里,能跑掉就是赢。`; } }
          ]
        })
      },
      { label: "见好就收,赚一点就跑", effect: (s) => { const win = rnd(0.55); const g = win ? Math.round(25000) : Math.round(8000); add(s, "cash", g); add(s, "strategy", 4); add(s, "insight", 3); bumpMomentum(s, 6); return `你在亢奋里保持了清醒,赚了 ¥${g.toLocaleString()} 就落袋为安。后来股灾来临,你站在岸上看别人落水,庆幸自己没被贪心拖下去。`; } },
      { label: "全程没碰,觉得这太疯", effect: (s) => { add(s, "insight", 2); add(s, "mood", -1); bumpMomentum(s, -1); return "你看着身边人暴富又暴亏,自己一股没买。错过了那波纸面财富,也躲过了那场踩踏——这一次,无聊救了你。"; } }
    ]
  },

  /* 8. 双创 / 资本狂热 ————————————————————————————————— */
  {
    id: "ev_world_mass_startup",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2015 && s.year <= 2018 && s.age >= 20,
    title: "🌍 大众创业:资本追着你烧钱",
    text: (s) => "「双创」的口号刷满了墙,孵化器、咖啡馆里坐满了拿着BP的年轻人。投资人的钱多到发愁,一个PPT就能融到几百万。只要敢讲故事,就有人敢给钱。",
    choices: [
      {
        label: "拿一笔融资,大干一场",
        next: (s) => ({
          text: (s) => "你也凑了个项目,居然真有投资人愿意投。钱打进账户的那一刻,你既兴奋又心虚——这笔钱,是助燃剂,也是催命符。",
          choices: [
            { label: "猛烧钱抢市场", effect: (s) => { add(s, "cash", 200000); add(s, "stress", 12); add(s, "health", -5); flag(s, "world_funded"); bumpMomentum(s, 6); return "你拿着投资人的钱补贴、招人、打广告,数字涨得飞快。可烧钱换来的规模,经不起断奶——你开始明白,这是一场和时间赛跑的豪赌。"; } },
            { label: "省着花,先跑通模型", effect: (s) => { add(s, "cash", 120000); add(s, "strategy", 6); add(s, "insight", 4); flag(s, "world_funded"); bumpMomentum(s, 5); return "你忍住了乱花钱的冲动,先把单位经济模型跑正。等资本退潮、同行一个个倒下时,你这艘小船反而还浮着。"; } }
          ]
        })
      },
      { label: "给热钱项目打工,见见世面", effect: (s) => { add(s, "network", 6); add(s, "knowledge", 4); add(s, "cash", 30000); flag(s, "world_startup_exp"); bumpMomentum(s, 3); return "你没自己创业,而是进了家拿了大钱的明星公司。期权画的饼很大,你边干边看,把资本游戏的玩法看了个透。"; } },
      { label: "冷眼旁观这场击鼓传花", effect: (s) => { add(s, "insight", 4); bumpMomentum(s, -2); return "你觉得很多项目根本没有商业逻辑,只是在比谁讲故事更狠。你按住了心动,后来潮水退去,果然一地鸡毛。"; } }
    ]
  },

  /* 9. 行业地震:教培 / 地产 / 平台 政策大转向 ——————————— */
  {
    id: "ev_world_industry_quake",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2021 && s.year <= 2023 && s.age >= 20,
    title: "🌍 行业地震:政策一纸,天翻地覆",
    text: (s) => byClass(s, {
      poor: "教培「双减」、地产暴雷、平台反垄断,一夜之间几个曾经最赚钱的行业集体熄火。你认识的人里,有的丢了工作,有的拿不到工资,焦虑像潮水漫上来。",
      mid: "你或身边人,正好端着其中一个行业的饭碗。前一天还在加班冲业绩,第二天政策落地,整条赛道直接被按下暂停键。",
      rich: "你看着重仓的行业市值一日蒸发,合同作废,团队解散。这才知道:在这片土地上,最大的风险从来不在财报里。"
    }),
    choices: [
      {
        label: "壮士断腕,立刻转行",
        next: (s) => ({
          text: (s) => "你不肯在沉船上等。可三十多岁从头再来,谈何容易——技能、人脉、心气,都要重新攒。你盯着招聘网站,手指悬在「投递」上。",
          choices: [
            { label: "转去更稳的体制内方向", effect: (s) => { add(s, "knowledge", 5); add(s, "stress", 6); flag(s, "world_quake_stable"); bumpMomentum(s, -4); return "你把行业群静音,转身去刷题、考证、求一个「旱涝保收」。稳定未必热血,但在地震带上,它是最厚的那件防护服。"; } },
            { label: "迁去政策鼓励的新赛道", effect: (s) => { add(s, "cash", -10000); add(s, "knowledge", 6); add(s, "insight", 5); flag(s, "world_quake_pivot"); bumpMomentum(s, 3); return "你研究文件、看风向,把自己挪到被鼓励的方向上。背靠政策的风,虽然要重新学,但至少这回是顺着时代走。"; } }
          ]
        })
      },
      { label: "硬扛,赌行业还会回来", effect: (s) => { add(s, "stress", 10); add(s, "mood", -6); add(s, "cash", -8000); bumpMomentum(s, -8); return "你舍不得多年的积累,选择留在原地等回暖。可有些政策转向,是结构性的——你等来的不是春天,是更冷的冬天。"; } },
      { label: "把资产负债表重算一遍", effect: (s) => { add(s, "strategy", 5); add(s, "stress", -2); add(s, "insight", 3); bumpMomentum(s, -2); return "你没急着证明什么,而是把贷款、现金流、退路一项项摊开重算。在大转向面前,先确认自己还能撑多久,才是清醒。"; } }
    ]
  },

  /* 10. 疫情冲击 ————————————————————————————————————— */
  {
    id: "ev_world_pandemic",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2020 && s.year <= 2022 && s.age >= 16,
    title: "🌍 疫情:城市忽然按下暂停",
    text: (s) => (s.flags && s.flags.employed
      ? "封控通知一来,公司转居家办公,群消息比上班还密。可门店关、订单停、现金流断,谁都不知道这要持续多久。"
      : "街道空了,商铺卷帘门一家家拉下。面试和零工突然全断档,你坐在出租屋里,一笔笔重新算每个月还能撑多久。"),
    choices: [
      {
        label: "把生活收缩到最低,熬",
        effect: (s) => { add(s, "cash", -5000); add(s, "health", 3); add(s, "mood", -6); add(s, "stress", 9); flag(s, "world_pandemic_survive"); bumpMomentum(s, -10); return "你取消一切计划,把日子缩进卧室、厨房和手机屏幕。省下的不只是钱,还有一点点对不确定性的抵抗力。漫长,但你撑过来了。"; }
      },
      {
        label: "转向线上,乱中找生机",
        next: (s) => ({
          text: (s) => "线下的门一扇扇关上,线上的窗却被推开。直播、社区团购、远程办公、网课——废墟边上,新的枝桠正疯长。",
          choices: [
            { label: "做直播带货", effect: (s) => { const g = rnd(0.5) ? 26000 : 4000; add(s, "cash", g); add(s, "charm", 5); add(s, "stress", 7); flag(s, "world_live_seed"); bumpMomentum(s, g > 10000 ? 8 : 2); return `你架起补光灯,对着镜头喊出第一声「家人们」。尴尬是真的,流量也是真的,这个月多进账 ¥${g.toLocaleString()}。停摆把你逼成了另一个人。`; } },
            { label: "做社区团购团长", effect: (s) => { add(s, "cash", 12000); add(s, "network", 7); add(s, "charm", 3); flag(s, "world_community_buy"); bumpMomentum(s, 5); return "你拉起小区群,统货、分拣、送货上门。封在家里的邻居都靠你买菜,你第一次发现:危机里,谁能解决最基本的需求,谁就有饭吃。"; } }
          ]
        })
      },
      { label: "做志愿者,守住一点人味", effect: (s) => { add(s, "reputation", 6); add(s, "network", 4); add(s, "health", -3); add(s, "mood", 3); socialShift(s, 3); bumpMomentum(s, 1); return "你穿上防护服去当志愿者,搬物资、测核酸、安抚老人。钱没多赚,可在停摆的城市里,你成了别人黑暗中的一点光。"; } }
    ]
  },

  /* 11. 通胀飙升 / 物价飞涨 (gate priceIndex 高) —————————— */
  {
    id: "ev_world_inflation",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.age >= 22 && s.world && s.world.priceIndex >= 1.45,
    title: "🌍 物价飞涨:钱越来越不经花",
    text: (s) => {
      const pi = (s.world && s.world.priceIndex) ? s.world.priceIndex : 1.5;
      return `菜价、房租、油价像商量好了一起往上窜。同样一张钞票,买到的东西肉眼可见地变少。${pi >= 2 ? "物价指数已经翻了一倍多,工资条上的数字成了笑话。" : "你掰着手指算账,才发现「攒钱」这件事正在变得越来越难。"}`;
    },
    choices: [
      {
        label: "把现金换成抗通胀的资产",
        next: (s) => ({
          text: (s) => "你不想看着积蓄被一点点稀释。可往哪儿放才安全?黄金、房子、还是别的什么?每条路都有人赚、有人套牢。",
          choices: [
            { label: "囤实物与硬资产", effect: (s) => { add(s, "cash", -50000); add(s, "assets", 55000); add(s, "strategy", 3); flag(s, "world_inflation_hedge"); bumpMomentum(s, 4); return "你把一部分现金换成保值的硬资产。涨跌还看运气,但至少它不像钞票那样,在你睡觉时悄悄缩水。"; } },
            { label: "投自己,提升赚钱能力", effect: (s) => { add(s, "cash", -20000); add(s, "knowledge", 6); add(s, "insight", 4); bumpMomentum(s, 5); return "你算明白了:对抗通胀最硬的资产,是自己能涨价的本事。你把钱砸进学习和技能,让自己成为那种「物价涨,我也涨」的人。"; } }
          ]
        })
      },
      { label: "勒紧裤腰带,精打细算过", effect: (s) => { add(s, "cash", -3000); add(s, "stress", 7); add(s, "mood", -4); bumpMomentum(s, -5); return "你开始比价、囤货、薅羊毛,把每一分钱掰成两半花。日子过得紧巴,可在物价的洪流里,会省钱本身就是一种生存技能。"; } },
      { label: "无力对抗,随它去", effect: (s) => { add(s, "mood", -5); add(s, "insight", 1); bumpMomentum(s, -6); return "你看着账户购买力一点点蒸发,却不知能做什么,只好麻木地接受。时代的通胀里,普通人的无力感,有时比账单更沉。"; } }
    ]
  },

  /* 12. AI 革命抢饭碗 (按职业/技能差异化冲击) —————————— */
  {
    id: "ev_world_ai_revolution",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2024 && s.year <= 2030 && s.age >= 18,
    title: "🌍 AI 革命:谁会先被省掉?",
    text: (s) => {
      const skilled = s.stats && (s.stats.knowledge + s.stats.insight) >= 60;
      return "纪要、代码、文案、设计、客服,全都开始接入大模型。老板嘴上说「降本增效」,员工心里默默翻译成一句:谁会先被省掉?" +
        (skilled ? "你手里有些真功夫,这场变革对你,既是威胁,也可能是放大器。" : "你心里有点慌——你做的那些活,AI 好像也能做,而且更快更便宜。");
    },
    choices: [
      {
        label: "把 AI 变成自己的外骨骼",
        next: (s) => ({
          text: (s) => "你决定不当被替代的人,而当驾驭它的人。可怎么把这工具真正塞进自己的活里,让一个人干出一个团队的产出?",
          choices: [
            { label: "用 AI 重做整个工作流", effect: (s) => { add(s, "knowledge", 7); add(s, "insight", 5); add(s, "stress", 3); flag(s, "world_ai_native"); bumpMomentum(s, 9); return "你把大模型嵌进每一个环节。别人交一份稿,你交一套系统。当同行还在担心被取代,你已经成了那个「带着 AI 顶三个人」的稀缺货。"; } },
            { label: "用 AI 单干一门小生意", effect: (s) => { add(s, "cash", -8000); add(s, "strategy", 6); add(s, "charm", 3); flag(s, "world_ai_solo"); bumpMomentum(s, 7); return "你靠几个 AI 工具,一个人撑起了过去要一个小团队的活:接单、生产、交付全自动化。一人公司的时代,你提前上了车。"; } }
          ]
        })
      },
      { label: "硬扛,坚持自己原来那套", effect: (s) => { const skilled = s.stats && (s.stats.knowledge + s.stats.insight) >= 70; if (skilled) { add(s, "reputation", 4); add(s, "insight", 2); bumpMomentum(s, 0); return "你功底够硬,暂时还能靠经验和判断力守住位置。但你也清楚,这道护城河,正在被一年比一年快的浪头慢慢填平。"; } add(s, "mood", -6); add(s, "stress", 8); bumpMomentum(s, -10); return "你拒绝改变,守着老办法干。可效率的差距摆在那里,领导的目光越来越冷。被时代抛下的恐惧,第一次离你这么近。"; } },
      { label: "转去 AI 难替代的人味赛道", effect: (s) => { add(s, "charm", 5); add(s, "network", 5); add(s, "insight", 3); flag(s, "world_human_touch"); bumpMomentum(s, 4); return "你不和机器拼算力,转身去做那些需要信任、情感和临场judgment的活。越自动化的时代,越有人愿意为「真实的人」付钱。"; } }
    ]
  },

  /* 13. 人口老龄化 / 延迟退休 ——————————————————————— */
  {
    id: "ev_world_aging_retire",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2030 && s.year <= 2040 && s.age >= 35,
    title: "🌍 延迟退休:终点线又往后挪了",
    text: (s) => "新闻里,「渐进式延迟退休」「养老金缺口」「人口负增长」轮番登场。你掐指一算,自己能领退休金的那天,比父辈晚了好几年。年轻人越来越少,要养的老人越来越多。",
    choices: [
      {
        label: "趁早给晚年做硬规划",
        next: (s) => ({
          text: (s) => "你不想把老年交给运气。养老金靠不住的预感,逼你现在就动手。可钱要怎么安排,才能稳稳撑到几十年后?",
          choices: [
            { label: "配置长期养老资产", effect: (s) => { add(s, "cash", -40000); add(s, "assets", 42000); add(s, "strategy", 4); flag(s, "world_retire_plan"); bumpMomentum(s, 3); return "你拿出一部分钱,专门锁进长期养老的篮子里,不再轻易动。当延迟退休一次次加码时,你比同龄人多了一份底气。"; } },
            { label: "练一门能干到老的本事", effect: (s) => { add(s, "knowledge", 5); add(s, "charm", 4); add(s, "health", 2); flag(s, "world_lifelong_skill"); bumpMomentum(s, 4); return "你明白:既然要干到更老,不如趁早练一门越老越值钱的手艺。经验、口碑、专业——这些东西,机器抢不走,年龄也带不走。"; } }
          ]
        })
      },
      { label: "保养好身体,准备长期作战", effect: (s) => { add(s, "cash", -10000); add(s, "health", 8); add(s, "stress", -3); flag(s, "world_health_invest"); bumpMomentum(s, 2); return "退休既然推迟,身体就是要用更久的本钱。你开始认真运动、体检、戒掉熬夜。能健康地多干几年,本身就是省下一大笔养老钱。"; } },
      { label: "无奈接受,该咋过咋过", effect: (s) => { add(s, "mood", -4); add(s, "insight", 2); bumpMomentum(s, -3); return "你叹口气,觉得这事轮不到你做主。退休线往后挪,你只能跟着往后熬。大势如此,个人的盘算渺小得像一粒尘。"; } }
    ]
  },

  /* 14. 产业转移 / 制造业外迁 ——————————————————————— */
  {
    id: "ev_world_industry_relocation",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2018 && s.year <= 2028 && s.age >= 22,
    title: "🌍 制造业外迁:工厂往南往外搬",
    text: (s) => byClass(s, {
      poor: "你所在城市的那些大厂,订单一批批转去了东南亚。招工的横幅撤了,出租屋空了一半,街上的人少了。养活一座城的产业,正在悄悄搬走。",
      mid: "「成本太高」「订单外流」成了茶余饭后的叹息。你或身边人的工作,正系在一条随时可能迁走的产业链上,心里没了底。",
      rich: "你看着供应链版图重画,有人把工厂搬去越南、墨西哥,有人押注高端制造留下来。一场围绕「钱往哪流」的大迁徙,正在脚下发生。"
    }),
    choices: [
      {
        label: "顺势升级,往产业链上游走",
        next: (s) => ({
          text: (s) => "低端的活留不住,你想往上爬一截——做别人搬不走的那部分。可技术、研发、品牌,哪一样都得啃硬骨头。",
          choices: [
            { label: "钻研技术与自动化", effect: (s) => { add(s, "cash", -15000); add(s, "knowledge", 6); add(s, "strategy", 4); flag(s, "world_upgrade"); bumpMomentum(s, 5); return "你把功夫下在自动化、精密制造这些搬不走的环节上。低端产能外流是挡不住的,但更高的那段价值链,你想牢牢攥在手里。"; } },
            { label: "做配套服务与品牌", effect: (s) => { add(s, "charm", 4); add(s, "network", 6); add(s, "strategy", 3); flag(s, "world_upgrade"); bumpMomentum(s, 4); return "你绕开和廉价产能拼价格,转去做设计、品牌、售后这些黏性更强的环节。工厂会迁走,但客户的信任迁不走。"; } }
          ]
        })
      },
      { label: "干脆跟着产业出海闯一闯", effect: (s) => { add(s, "cash", -20000); add(s, "network", 7); add(s, "insight", 5); add(s, "stress", 6); flag(s, "world_go_global"); bumpMomentum(s, 6); return "你索性跟着产业链出海,去新兴市场建厂、找机会。语言不通、水土不服,可哪里有便宜的生产要素,哪里就有新的财富洼地。"; } },
      { label: "留在原地,等产业回流", effect: (s) => { add(s, "mood", -5); add(s, "stress", 5); add(s, "insight", 2); bumpMomentum(s, -7); return "你不愿背井离乡,选择留下来等转机。可外迁是成本算出来的结果,不是一句口号能逆转的。你守着空荡荡的厂区,心里越来越凉。"; } }
    ]
  },

  /* 15. 技术性失业大潮 / 机器人替代 ——————————————————— */
  {
    id: "ev_world_robot_displacement",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2031 && s.year <= 2040 && s.age >= 22,
    title: "🌍 机器替人:饭碗被一个个端走",
    text: (s) => {
      const cold = s.world && s.world.jobMarket < 45;
      return "仓库里机器人搬箱子,餐厅里机械臂炒菜,客服全换成了AI。一个个曾经养活无数人的岗位,被「降本增效」四个字悄悄抹去。" +
        (cold ? "就业市场肉眼可见地冷,失业的人排起了长队,「技术性失业」从论文里走进了现实。" : "失业的浪潮还没拍到所有人,但你已经听见了它逼近的声音。");
    },
    choices: [
      {
        label: "抢在被替代前,转去监管机器的人",
        next: (s) => ({
          text: (s) => "你想通了:与其被机器淘汰,不如去当那个管机器的人。可这条路要么懂技术,要么懂运营,你得赶紧补课。",
          choices: [
            { label: "学运维与系统管理", effect: (s) => { add(s, "cash", -12000); add(s, "knowledge", 6); add(s, "strategy", 4); flag(s, "world_robot_overseer"); bumpMomentum(s, 6); return "你转去做机器人的运维、调度和异常处理。机器替掉了一百个工人,却造出了几个「管机器的人」的新岗位——你抢到了其中一个。"; } },
            { label: "学人机协作的新工种", effect: (s) => { add(s, "cash", -8000); add(s, "knowledge", 5); add(s, "charm", 3); flag(s, "world_robot_overseer"); bumpMomentum(s, 5); return "你学的是怎么和机器搭班子干活,让人做判断、机器做执行。在替代的浪潮里,你把自己挪到了浪打不到的那块新陆地上。"; } }
          ]
        })
      },
      { label: "转向机器最难替代的人际工作", effect: (s) => { add(s, "charm", 6); add(s, "network", 5); add(s, "insight", 3); flag(s, "world_human_job"); bumpMomentum(s, 4); return "你转去做养老陪护、教育、谈判、创意这些靠人心的活。机器算得过人,却暖不过人——你赌的就是这一点温度。"; } },
      { label: "被浪潮卷中,失业在家", effect: (s) => { add(s, "cash", -6000); add(s, "mood", -8); add(s, "stress", 10); add(s, "health", -3); flag(s, "world_displaced"); bumpMomentum(s, -12); return "你没赶上转身,岗位说没就没。投出去的简历石沉大海,你第一次真切体会到:当机器比你便宜又不知疲倦时,个人的努力轻得像一张纸。"; } }
    ]
  },

  /* 16. 时代红利窗口 (踩中 vs 错过的全民焦虑) ——————— */
  {
    id: "ev_world_dividend_window",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.age >= 20 && s.world && s.world.windHeat >= 55,
    title: "🌍 风口正盛:踩中,还是错过?",
    text: (s) => {
      const hot = (s.world && s.world.windHeat) || 60;
      return `又一个时代红利的窗口被推开:满世界都在谈某个新风口,有人辞职all in,有人焦虑到失眠。${hot >= 75 ? "热度高得发烫,「再不上车就晚了」的声音震耳欲聋。" : "机会就在眼前,可你分不清,这是真风口,还是又一轮泡沫。"}你站在窗口边,进还是退?`;
    },
    choices: [
      {
        label: "All in,赌上身家踩这一波",
        next: (s) => ({
          text: (s) => "你决定不当那个事后捶胸顿足的人。可all in意味着把退路也压上——赌对了一步登天,赌错了从头再来。最后那一下,你怎么押?",
          choices: [
            { label: "顺着真信号重仓", effect: (s) => { const align = s.eraWind && (s.flags && (s.flags.world_ai_native || s.flags.world_mobile_founder)); const win = rnd(0.45 + s.stats.insight / 250 + (align ? 0.15 : 0)); const g = win ? Math.round(80000 + s.cash * 0.2) : -Math.round(40000 + s.cash * 0.08); add(s, "cash", g); add(s, "stress", 12); bumpMomentum(s, win ? 15 : -14); return win ? `你押对了那阵真正的风,身家翻着跟头往上涨,落袋 ¥${g.toLocaleString()}。多年后回看,人这辈子,能踩中的大风口就那么几次。` : `你以为踩中了风口,其实风早过去了,你接住的是退潮后的沙子。¥${(-g).toLocaleString()} 教会你:看见热闹,不等于看懂趋势。`; } },
            { label: "押个声势最大的热门概念", effect: (s) => { const win = rnd(0.35); const g = win ? Math.round(50000) : -Math.round(35000 + s.cash * 0.05); add(s, "cash", g); add(s, "stress", 13); bumpMomentum(s, win ? 10 : -12); return win ? `运气站在你这边,跟着声浪最大的概念也赚了 ¥${g.toLocaleString()}。但你心里清楚,这更像中奖,而不是看懂。` : `最响的锣鼓,往往散场最快。你追着喧嚣进场,亏掉 ¥${(-g).toLocaleString()} 才明白:风口的入场券,卖给最后一个相信故事的人。`; } }
          ]
        })
      },
      { label: "小仓位试水,留好退路", effect: (s) => { const g = rnd(0.5) ? 22000 : -6000; add(s, "cash", g); add(s, "strategy", 5); add(s, "insight", 4); bumpMomentum(s, g > 0 ? 6 : -2); return g > 0 ? `你只押了能输得起的那部分,踩中时赚了 ¥${g.toLocaleString()},踩空也伤不了筋骨。不赌身家的人,反而能玩更多回合。` : `小亏 ¥${(-g).toLocaleString()},但你既试了水,又没翻船。在风口面前留三分清醒,是普通人最稀缺的本事。`; } },
      { label: "按兵不动,克制FOMO", effect: (s) => { add(s, "insight", 4); add(s, "mood", -3); bumpMomentum(s, -2); return "你看着身边人一个个上车,焦虑得睡不着,却还是按住了手。也许会错过,也许躲过一劫——这一次,你选择和「错过的焦虑」共处。时代的窗口很多,守住自己的人,才走得到最后。"; } }
    ]
  }
);
