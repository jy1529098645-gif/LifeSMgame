"use strict";
/* =====================================================================
 * content/destiny-tycoon.js —— 命运线【金融大鳄 tycoon】
 * 母题：「打工是不可能打工的」。不上班、不创业——你信的是一双慧眼，
 *       在股海里翻云覆雨，让钱替你打工，靠炒股把身价做到 500 万。
 * 五幕脊柱（确定性、按阶段推进，前幕选择在后幕/清算回收）：
 *   1 序·入市     19岁  第一次接触股票，立志靠眼光吃饭
 *   2 起·第一次牛市 26岁  赶上牛市赚到第一笔：落袋 / 梭哈杠杆 / 半仓
 *   3 折·股灾爆仓  33岁  股灾被割血亏：割肉离场 / 借钱抄底 / 躺平装死
 *   4 危·中年豪赌  41岁  内幕消息 + 家庭账户拉扯：all-in / 守底仓 / 对冲
 *   5 巅·封神或归零 51岁  冲击 500 万最后一搏，成败读累积市值 + 属性 + 伏笔
 * 记录抉择用 dstChoose(s, chId, key, note)；回收用 dstPick / has(s,"dst_pick_*")。
 * ===================================================================== */
(function () {

  // —— 综合「盘感实力」：决定关键判定，越高越稳 ——
  function traderEdge(s) {
    const st = s.stats || {};
    return (st.insight || 0) * 1.1 + (st.strategy || 0)
         + (st.knowledge || 0) * 0.5 + (s.reputation || 0) * 0.2;
  }
  // —— 当前持仓市值（typeof 保护，股市系统可能没加载）——
  function mktValue(s) {
    return (typeof stockValue === "function" ? stockValue(s) : 0);
  }

  registerDestiny("tycoon",
    {
      name: "金融大鳄", motif: "打工是不可能打工的",
      acts: ["序·入市", "起·牛市", "折·爆仓", "危·豪赌", "巅·封神"],
      // —— 母题清算：回收一生的命运抉择 ——
      reckon: function (s) {
        const networth = (s.cash || 0) + (s.assets || 0) + mktValue(s);
        const enshrined = mktValue(s) >= 5000000 || networth >= 5000000;
        const greedy = has(s, "dst_pick_tycoon_allin") || has(s, "dst_pick_tycoon_leverage")
                     || has(s, "dst_pick_tycoon_borrow");
        const disciplined = has(s, "dst_pick_tycoon_cashout") || has(s, "dst_pick_tycoon_cut")
                          || has(s, "dst_pick_tycoon_hedge") || has(s, "dst_pick_tycoon_half");
        if (enshrined && disciplined) {
          return "你封神了。身价过五百万——而且你是带着纪律封的神：该贪婪时贪婪，该恐惧时恐惧，"
            + "见好就收，绝不让一时的红眼断送一辈子的盘感。你从没上过一天班、没开过一家公司，"
            + "就靠一双慧眼，让钱替你打了一辈子工。太爷爷那句「打工是不可能打工的」，被你用一本对账单结结实实印证了。";
        }
        if (enshrined && greedy) {
          return "你封神了，五百万的身价是真金白银——可你自己最清楚，这里头有几成是本事，几成是命。"
            + "你一辈子在杠杆和梭哈里反复横跳，几次离爆仓只差一根阴线。你赢了，却是踩着无数个失眠的夜赢的。"
            + "「让钱替你打工」你做到了，只是那钱，也快把你这个人榨干了。";
        }
        if (enshrined) {
          return "你终究是靠炒股做到了五百万身价，登上了多数韭菜望尘莫及的位置。"
            + "不上班、不创业，纯靠盘感翻云覆雨——你这一生，本身就是一句「打工是不可能打工的」的注脚。";
        }
        if (greedy) {
          return "你曾几次离五百万只有一步之遥，可你那双手总在最高点还想再加一注。"
            + "杠杆、梭哈、抄底——大起大落之后，账户里的数字像潮水一样退了下去，终归零。"
            + "你想让钱替你打工，可股海最后教会你的是：贪婪，才是真正吞掉你的庄家。";
        }
        if (disciplined) {
          return "你没能封神，五百万的门槛你终究没迈过去。可你守着纪律走了一辈子，"
            + "落袋、止损、不上头——账户没暴富，也没爆仓。算不上大鳄，倒也做了个安稳的小富。"
            + "股海凶险，能全身而退、略有盈余，已经比绝大多数追涨杀跌的人，体面太多。";
        }
        return "你也曾梦想靠一双慧眼在股海里翻身，让钱替你打工。可这片海，到底比你想的更深、更冷。"
          + "你这辈子没能炒出五百万，那句「打工是不可能打工的」，你没能用账户证明——但你赌过、痛过，这就够了。";
      }
    },
    [

      /* ========== 第1幕 序·入市（19岁）：立志 ========== */
      {
        id: "dst_tycoon_1", at: { minAge: 19, stage: ["youth"] },
        title: "📈 第一次打开行情软件，绿肥红瘦晃了你的眼",
        text: (s) => byClass(s, {
          poor: "你揣着攒了大半年的几千块，第一次注册了证券账户。屏幕上红红绿绿的数字跳得人心跳加速。没背景、没本钱、上班一辈子也翻不了身——你盯着 K 线想：太爷爷说「打工是不可能打工的」，那这就是穷人唯一能赌的翻盘桌。要么本金清零，要么靠这双眼睛把身家翻上去。",
          mid: "同事在工位上偷偷看盘的样子，让你第一次动了心。你开了户，转进去一小笔闲钱。太爷爷那句「打工是不可能打工的」一直在你耳边——上班那点死工资熬到头也就那样。你想试试：能不能不靠老板，纯靠这双眼睛，让钱替自己生钱。",
          rich: "家里给的本金，对你来说只是个零头。可你偏不想守着家业吃利息——你要亲手在二级市场里证明自己的眼光。太爷爷说「打工是不可能打工的」，你深以为然：真正的高手不上班、不创业，只在股海里运筹。钱生钱，才是顶级的玩法。"
        }),
        choices: [
          { label: "技术流：啃透 K 线、财报、量价，靠盘感吃饭", effect: (s) => {
              add(s, "knowledge", 3); add(s, "insight", 3); add(s, "stress", 3);
              return dstChoose(s, "dst_tycoon_1", "tycoon_skill",
                "你买了一摞书，把每一根均线、每一份财报都嚼烂。你信的是：股海里活得久的，从来不是赌徒，是真懂行的人。");
            } },
          { label: "赌徒魂：满仓追热点，富贵险中求", effect: (s) => {
              add(s, "cash", 0); add(s, "stress", 6); add(s, "strategy", 1); add(s, "mood", 4);
              bumpMomentum(s, 4);
              return dstChoose(s, "dst_tycoon_1", "tycoon_gambler",
                "你管不了那么多——哪个涨停板火就追哪个。你给自己的逻辑很简单：钱要么生大钱，要么死，慢慢爬太没劲。这股冲劲，是你递给股海的第一张名片。");
            } },
          { label: "稳健派：小仓试水，先活下来再说", effect: (s) => {
              add(s, "insight", 2); add(s, "strategy", 3); add(s, "stress", -2);
              return dstChoose(s, "dst_tycoon_1", "tycoon_steady",
                "你只投了能输得起的钱，给自己定了铁律：先别想赚多少，先想着别死。你信的是笨办法——在股海里，先学会不亏，才有资格谈赚。");
            } }
        ]
      },

      /* ========== 第2幕 起·第一次牛市（26岁）：赚到第一笔 ========== */
      {
        id: "dst_tycoon_2", at: { minAge: 26 },
        title: "🐂 大牛市来了，你的账户第一次翻红到发烫",
        text: (s) => {
          const gambler = dstPick(s, "dst_tycoon_1") === "tycoon_gambler";
          return (gambler
            ? "几年瞎冲，你早练出了一身追涨的胆。这一波牛市来势汹汹，你的账户像坐了火箭。"
            : "蛰伏几年，你等到了职业生涯第一波真正的牛市。指数一路向上，你重仓的票连拉数个涨停。")
            + "账户里的浮盈翻了一倍还多，群里全是「这次不一样」「牛市才刚开始」的狂欢。第一笔像样的钱，就摆在你眼前——这一仗，怎么收？";
        },
        choices: [
          { label: "加杠杆梭哈：借钱配资，把这波牛市榨干", next: (s) => ({
              text: "你红了眼。眼看别人融资盘翻倍，你也开了两融、加了配资，把能动用的资金全压了进去。账户的数字大得不真实，你晚上躺着都在算明天能再赚多少。",
              choices: [
                { label: "杠杆拉满，赌指数还能再翻一倍", effect: (s) => {
                    const win = rnd(0.4 + traderEdge(s) / 400 + luckBias(s));
                    add(s, "stress", 12);
                    if (win) { add(s, "cash", 400000); add(s, "mood", 14); bumpMomentum(s, 14); }
                    else { add(s, "cash", -180000); add(s, "mood", -16); add(s, "stress", 10); bumpMomentum(s, -10); }
                    return dstChoose(s, "dst_tycoon_2", "tycoon_leverage",
                      win ? "你赌对了，牛市又疯了一程。杠杆把你的盈利放大了好几倍，第一桶金沉甸甸落进口袋。你尝到了让钱替你打工、还加倍打工的滋味——这味道，会让人上瘾。"
                          : "你刚加满杠杆，指数就开始跳水。一根根阴线把你的浮盈和本金一起吃掉。你慌忙平仓，账户缩了一大圈。第一课很贵：杠杆是把双刃剑，赚的时候它替你打工，亏的时候它要你的命。");
                  } },
                { label: "见势不对，赚够一倍就先撤一半杠杆", effect: (s) => {
                    add(s, "cash", 150000); add(s, "strategy", 3); add(s, "stress", 4); bumpMomentum(s, 6);
                    return dstChoose(s, "dst_tycoon_2", "tycoon_leverage",
                      "你贪，但没贪到失了智。翻倍后你悄悄撤掉一半杠杆，把利润锁进口袋。后来大盘见顶回落，那些没跑的人哭天抢地——你回头看，吓出一身冷汗。这点分寸，是牛市教你的第一课。");
                  } }
              ]
            }) },
          { label: "见好就收：分批落袋，把利润焊死", effect: (s) => {
              add(s, "cash", 120000); add(s, "insight", 3); add(s, "strategy", 3); add(s, "mood", 8);
              bumpMomentum(s, 6);
              return dstChoose(s, "dst_tycoon_2", "tycoon_cashout",
                "你顶着「太胆小」的嘲笑，分批把票卖了，把浮盈变成实打实进账户的现金。牛市最后还冲了一程，你少赚了一截，可你睡得很香——你信的是：落袋为安的钱，才是你的钱。");
            } },
          { label: "半仓稳着：留一半子弹，跟着趋势走", effect: (s) => {
              const win = rnd(0.55 + traderEdge(s) / 500);
              add(s, "cash", win ? 90000 : 50000); add(s, "strategy", 2); add(s, "insight", 2);
              bumpMomentum(s, win ? 5 : 3);
              return dstChoose(s, "dst_tycoon_2", "tycoon_half",
                win ? "你不满仓也不空仓，留着一半现金当底气，跟着趋势加减。牛市的钱你吃到了一大块，又没把自己绷到极限。进可攻退可守——这是你摸出来的舒服节奏。"
                    : "你半仓跟着走，赚是赚了，可看着满仓的人翻倍，你心里也痒。你按住了那只想梭哈的手——你提醒自己：在这片海里，活得久比赚得快重要。");
            } }
        ]
      },

      /* ========== 第3幕 折·股灾爆仓（33岁）：血亏 ========== */
      {
        id: "dst_tycoon_3", at: { minAge: 33 },
        title: "💥 三十三岁，一场股灾把你的账户砸穿了",
        text: (s) => {
          const lev = dstPick(s, "dst_tycoon_2") === "tycoon_leverage";
          return "千股跌停，连续阴线，平台一片血红。你重仓的票像断了线的风筝，盘口的卖单堆成了山，根本卖不动。"
            + (lev ? "更要命的是你还背着杠杆——强平线就在脚下，券商的电话一个接一个。" : "你眼睁睁看着几年攒下的浮盈一天天蒸发，回吐殆尽。")
            + "三十出头的你，第一次尝到什么叫『被庄家割韭菜』『爆仓』的真正滋味。这一刀下来，你怎么办？";
        },
        dynamicChoices: (s) => ([
          { label: "割肉离场：认栽止损，从此敬畏市场", effect: (s) => {
              add(s, "cash", -120000); add(s, "insight", 5); add(s, "strategy", 3);
              add(s, "mood", -10); add(s, "stress", 8); bumpMomentum(s, -4);
              return dstChoose(s, "dst_tycoon_3", "tycoon_cut",
                "你咬着牙挂了跌停价，把票全清了，认下这笔血亏。割肉那一刻像剜自己的肉——可你保住了本金的火种。这一课刻进了骨头：在股海里，活下来，永远是第一位的。");
            } },
          { label: "借钱抄底：满仓赌反弹，越跌越买", next: (s) => ({
              text: "你不信邪——「别人恐惧我贪婪」。你东拼西凑借来一笔钱，趁着暴跌往里冲，赌一个深 V 反弹。手在抖，可你告诉自己：这是抄在地板上的机会。",
              choices: [
                { label: "梭哈到底，赌这就是最低点", effect: (s) => {
                    const win = rnd(0.32 + traderEdge(s) / 420 + luckBias(s));
                    add(s, "stress", 16);
                    if (win) { add(s, "cash", 300000); add(s, "mood", 16); add(s, "insight", 3); bumpMomentum(s, 14); flag(s, "tycoon_bottomgod"); }
                    else { add(s, "cash", -260000); add(s, "mood", -20); add(s, "stress", 14); bumpMomentum(s, -14); }
                    return dstChoose(s, "dst_tycoon_3", "tycoon_borrow",
                      win ? "你赌对了——这真是地板。深 V 反弹拉上来，你不仅回了血，还倒赚一笔。圈里人喊你「抄底之神」。你心里却清楚：这把赢得太险，差一点就连本带利埋进去。"
                          : "你抄在了半山腰。下跌远没到头，借来的钱又亏进去一大块，债务压得你喘不过气。所谓抄底，抄到的是更深的刀。这一回，你是真的被市场上了一课。");
                  } },
                { label: "试探一手，留点余地不孤注一掷", effect: (s) => {
                    const win = rnd(0.45 + traderEdge(s) / 460);
                    add(s, "stress", 8);
                    if (win) { add(s, "cash", 90000); add(s, "insight", 3); bumpMomentum(s, 6); }
                    else { add(s, "cash", -70000); add(s, "mood", -8); bumpMomentum(s, -4); }
                    return dstChoose(s, "dst_tycoon_3", "tycoon_borrow",
                      win ? "你只借了小钱试探着抄，没敢梭哈。反弹来时你吃到一口肉，又因为没满仓而少了悔意。贪而有度——这是股灾给你补的课。"
                          : "你试探性抄了一笔，还是抄早了。好在没满仓，亏得不算伤筋动骨。你及时收手：刀还在落，别急着接。");
                  } }
              ]
            }) },
          { label: "躺平装死：不割不卖，捂着等解套", effect: (s) => {
              add(s, "stress", 6); add(s, "mood", -8); add(s, "strategy", 2);
              return dstChoose(s, "dst_tycoon_3", "tycoon_lieflat",
                "你把软件卸了，账户眼不见心不烦——「不卖就不算亏」。你赌的是时间：只要公司不退市，总有解套的一天。这是鸵鸟，也是一种倔强。至于要等多久，你不敢算。");
            } }
        ])
      },

      /* ========== 第4幕 危·中年豪赌（41岁）：内幕 + 家庭账户 ========== */
      {
        id: "dst_tycoon_4", at: { minAge: 41 },
        title: "🎰 四十一岁，一个『一把翻身』的消息找上门",
        text: (s) => {
          const bottomgod = has(s, "tycoon_bottomgod");
          return (bottomgod ? "当年抄底封神的名声，让你结识了不少『圈内人』。这天，一个神神秘秘的内幕消息递到你手上：某只票要有大动作，建仓窗口就这几天。"
                            : "蹉跎到中年，你急着翻身。一个号称有『大趋势 / 内幕』的机会摆在面前：据说某板块即将爆发，现在不上车就晚了。")
            + "可这一次，押的不再只是你的零花钱——是这些年攒下的家庭账户，是老婆孩子的指望。慧眼与豪赌、身家与家庭，在你心里拉扯。这是你和股海，最较劲的一刻。";
        },
        choices: [
          { label: "all-in 豪赌：把家庭账户也压上，一把翻身", next: (s) => ({
              text: "你瞒着家里，把存款、甚至一部分该留作后路的钱，全调进了证券账户。你对自己说：富贵险中求，这一把赌对了，全家就此翻身。下单那一刻，你的手心全是汗。",
              choices: [
                { label: "满仓重锤，赌这就是命运的转折点", effect: (s) => {
                    const win = rnd(0.34 + traderEdge(s) / 380 + luckBias(s));
                    add(s, "stress", 18); add(s, "health", -5);
                    if (win) { add(s, "cash", 800000); add(s, "mood", 18); add(s, "insight", 3); bumpMomentum(s, 16); flag(s, "tycoon_bigwin"); }
                    else { add(s, "cash", -500000); add(s, "mood", -24); add(s, "stress", 16); add(s, "health", -6); bumpMomentum(s, -16); flag(s, "tycoon_blowup"); }
                    return dstChoose(s, "dst_tycoon_4", "tycoon_allin",
                      win ? "消息是真的。那只票一飞冲天，你的账户翻了好几倍，一把就把这些年的亏空全补了回来，还多出一大截。你赌赢了命运——只是回头想想那个失眠的下注夜，你后背还在发凉。"
                          : "消息是个套。你接盘在最高点，主力出货后股价一泻千里。家庭账户被砸出一个大窟窿，老婆知道后那个眼神，你这辈子忘不了。这一把，你赌上了全家，输了。");
                  } },
                { label: "押大头但留一线，给全家留口饭", effect: (s) => {
                    const win = rnd(0.4 + traderEdge(s) / 420);
                    add(s, "stress", 12);
                    if (win) { add(s, "cash", 400000); add(s, "mood", 12); bumpMomentum(s, 10); flag(s, "tycoon_bigwin"); }
                    else { add(s, "cash", -240000); add(s, "mood", -14); add(s, "stress", 10); bumpMomentum(s, -8); }
                    return dstChoose(s, "dst_tycoon_4", "tycoon_allin",
                      win ? "你押了大头，但死活留了一笔不能动的家用。这把赢了，进账丰厚，全家也没断了后路。贪婪里留一分清醒——中年人的赌，得替家人留口饭。"
                          : "你赌输了，可幸亏留了那条底线，家里没到揭不开锅的地步。你看着缩水的账户苦笑：这一课的学费，亏在了没把那条内幕看穿。");
                  } }
              ]
            }) },
          { label: "守住底仓：消息不碰，只用闲钱稳稳做", effect: (s) => {
              add(s, "insight", 4); add(s, "strategy", 4); add(s, "mood", 4); add(s, "stress", -4);
              const win = rnd(0.6 + traderEdge(s) / 500);
              add(s, "cash", win ? 120000 : 60000);
              return dstChoose(s, "dst_tycoon_4", "tycoon_keepcore",
                "你摆摆手拒了那个『内幕』——你太清楚，散户听到的内幕，往往是别人出货的诱饵。你守着底仓，只用闲钱稳稳滚动。家庭账户分文未动，你睡得踏实：到了这个年纪，本金和家，才是真正的底气。");
            } },
          { label: "分散对冲：买点、对冲点，不把命押一处", effect: (s) => {
              add(s, "strategy", 5); add(s, "insight", 3); add(s, "stress", 4);
              const win = rnd(0.55 + traderEdge(s) / 460);
              add(s, "cash", win ? 100000 : 30000);
              return dstChoose(s, "dst_tycoon_4", "tycoon_hedge",
                "你没赌单边——一边小仓跟着消息试，一边买了对冲工具防着崩盘。涨了你吃一口，跌了对冲兜底。中年人的体面，是给账户也留一条退路，绝不把命押在一个点上。");
            } }
        ]
      },

      /* ========== 第5幕 巅·封神或归零（51岁）：最后一搏 ========== */
      {
        id: "dst_tycoon_5", at: { minAge: 51 },
        title: "🏔️ 五十一岁，离五百万只差最后一根阳线",
        text: (s) => {
          const nv = (s.cash || 0) + (s.assets || 0) + mktValue(s);
          if (has(s, "tycoon_blowup")) {
            return "中年那把豪赌爆仓后，你跌进谷底，又一根筋地从头再来。摸爬滚打这些年，你的身价重新爬到了五百万的门槛下。这一次，是你这辈子离封神最近、也可能是最后一次的机会。";
          }
          return "三十多年股海浮沉，你的身家滚到了五百万的门口（当前约 " + Math.round(nv / 10000) + " 万）。"
            + "一个时代级的大行情正在酝酿，跨过去，你就是真正的『金融大鳄』；踏空或踩错，半生心血可能一夜归零。这是你离封神最近的一次，也可能是最后一次。";
        },
        dynamicChoices: (s) => {
          const bigwin = has(s, "tycoon_bigwin");
          const disciplined = has(s, "dst_pick_tycoon_cashout") || has(s, "dst_pick_tycoon_cut")
                            || has(s, "dst_pick_tycoon_half") || has(s, "dst_pick_tycoon_hedge")
                            || has(s, "dst_pick_tycoon_keepcore");
          const greedy = has(s, "dst_pick_tycoon_leverage") || has(s, "dst_pick_tycoon_allin")
                       || has(s, "dst_pick_tycoon_borrow");
          return [
            { label: "凭盘感叩关：把一生的功力压上这最后一程", effect: (s) => {
                // 贪婪者更易翻车：纪律加成、贪婪减成
                let p = 0.4 + traderEdge(s) / 360 + mktValue(s) / 20000000
                      + (disciplined ? 0.1 : 0) - (greedy ? 0.08 : 0) + luckBias(s);
                const win = rnd(p);
                add(s, "stress", 14);
                if (win) {
                  add(s, "assets", bigWindfall(s, 30000000)); flag(s, "tycoon_enshrined");
                  add(s, "mood", 18); add(s, "reputation", 12); bumpMomentum(s, 18);
                  return dstChoose(s, "dst_tycoon_5", "tycoon_win",
                    "这一程行情，你踩得分毫不差。账户的数字越过五百万那条线时，你长长舒了一口气——封神了。三十多年的盘感，全凝在了这最后一手。不上班、不创业，你真的只靠一双眼睛，让钱替你打出了一片江山。");
                }
                add(s, "cash", -300000); add(s, "mood", -16); bumpMomentum(s, -10);
                return dstChoose(s, "dst_tycoon_5", "tycoon_near",
                  "就差最后一根阳线。行情在你重仓后拐了头，你眼睁睁看着账户从门槛上滑落。五百万，你离它最近的时候，伸手能碰到——可股海最不缺的，就是『差一点』的故事。");
              } },
            { label: "杠杆豪赌：加满融资，赌一把封神或归零", effect: (s) => {
                // 高赔率高风险，贪婪伏笔进一步压低胜率
                let p = 0.32 + traderEdge(s) / 420 + mktValue(s) / 24000000 - (greedy ? 0.06 : 0) + luckBias(s);
                const win = rnd(p);
                add(s, "stress", 20); add(s, "health", -6);
                if (win) {
                  add(s, "assets", bigWindfall(s, 45000000)); flag(s, "tycoon_enshrined");
                  add(s, "mood", 20); add(s, "reputation", 14); bumpMomentum(s, 20);
                  return dstChoose(s, "dst_tycoon_5", "tycoon_win",
                    "你把杠杆拉到了极限，赌上了一切。行情如你所料地疯涨，杠杆把你的身家加倍推过了五百万。你封神了——以一种最惊心动魄的方式。回头看那悬崖边的一注，你自己都觉得后怕。");
                }
                add(s, "cash", -900000); add(s, "mood", -28); add(s, "stress", 18); add(s, "health", -6);
                bumpMomentum(s, -18); flag(s, "tycoon_zeroed");
                return dstChoose(s, "dst_tycoon_5", "tycoon_zero",
                  "你赌得太满。一根你没料到的阴线击穿了强平线，券商无情砍仓，你半生的积累在几个交易日里灰飞烟灭。归零了。原来到了最后，吞掉你的从来不是市场，是你那只在最高点还想再加杠杆的手。");
              } },
            { label: "见好就收：不赌了，把身家落袋安享晚年", effect: (s) => {
                add(s, "mood", 12); add(s, "health", 6); add(s, "stress", -14); add(s, "strategy", 2);
                return dstChoose(s, "dst_tycoon_5", "tycoon_retire",
                  "你笑着清了大部分仓位，把钱换成了能安睡的资产。也许差一口气没摸到大鳄的封号，可你想明白了：在股海里全身而退、攒下一份让全家安稳的家底，已经赢过了太多最后归零的人。有些顶，不登，才是真本事。");
              } }
          ];
        }
      }

    ]);

})();
