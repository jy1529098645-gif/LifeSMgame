"use strict";
/* =====================================================================
 * content/destiny-freedom.js —— 命运线【财务自由 freedom】
 * 母题：「打工是不可能打工的」。你这辈子认准一条道——靠搞钱、靠投资、
 *       靠副业滚雪球，把身价滚到花不完，再不为五斗米向谁低头。
 * 五幕脊柱（确定性、按阶段推进，前幕选择在后幕/清算回收）：
 *   1 序·觉醒     19岁  穷/中/富三种出身，立下「偏要挣到花不完的钱」的志
 *   2 起·第一桶金 26岁  第一次真正搞到钱：靠眼光 / 靠胆子 / 稳妥
 *   3 折·一次大亏 33岁  暴跌/被割/踩雷狠狠教育：认栽离场 or 加倍下注（两层分支）
 *   4 危·中年allin 41岁  翻倍或归零的大机会 + 家庭拉扯：赌 / 守 / 骑墙（两层分支）
 *   5 巅·临门一搏 51岁  离财务自由最后一步，读累积身价/属性 + 前幕伏笔回收
 * 记录抉择用 dstChoose(s, chId, key, note)；回收用 dstPick / has(s,"dst_pick_*")。
 * ===================================================================== */
(function () {

  // —— 综合「搞钱实力」：决定关键判定，越高越稳 ——
  function moneyPower(s) {
    const st = s.stats || {};
    return (st.strategy || 0) + (st.insight || 0) * 1.1 + (st.knowledge || 0) * 0.7
         + (st.charm || 0) * 0.4 + (s.network || 0) * 0.6 + (s.reputation || 0) * 0.3;
  }
  // —— 当前身价（现金 + 资产）——
  function netWorth(s) {
    return (s.cash || 0) + (s.assets || 0);
  }

  registerDestiny("freedom",
    {
      name: "财务自由", motif: "打工是不可能打工的",
      acts: ["序·觉醒", "起·第一桶金", "折·一次大亏", "危·中年抉择", "巅·临门一搏"],
      // —— 母题清算：回收一生的命运抉择 ——
      reckon: function (s) {
        const free = netWorth(s) >= 10000000;       // 身价 ≥ 1000 万 = 真·财务自由
        const close = netWorth(s) >= 4000000;       // 没封顶但也算半只脚迈进去
        const gambler = has(s, "dst_pick_freedom_double") || has(s, "dst_pick_freedom_allin");
        const sober = has(s, "dst_pick_freedom_quit_loss") || has(s, "dst_pick_freedom_hold");
        const eyeman = has(s, "dst_pick_freedom_eye") || has(s, "dst_pick_freedom_win");
        if (free && eyeman) {
          return "你这辈子没替谁打过一天心甘情愿的工，全凭一双看风口的眼睛和一手滚雪球的耐心，把身价滚过了千万。"
            + "「打工是不可能打工的」——你不光说到了，还做到了：钱替你打工，你只管喝茶看盘。自由，是你用半生赌出来的，也是算出来的。";
        }
        if (free && gambler) {
          return "你财务自由了，可这一路你比谁都清楚——你不是稳稳赚到的，是几次把全部身家拍在桌上，赌赢了。"
            + "夜深翻看账户那串零，你偶尔会后怕：再差一点点运气，你这会儿连给人打工的资格都没了。但赢家不必复盘，对吧。";
        }
        if (free) {
          return "你终究是滚到了花不完的钱，再不必为五斗米向谁折腰。老祖宗那句「打工是不可能打工的」，被你结结实实兑了现。";
        }
        if (close && sober) {
          return "你没摸到那一千万的门槛，可你也再没回头去打工。该认栽时认栽，该收手时收手——你守住了本金，也守住了自己的体面。"
            + "财务半自由，不算输。至少你这辈子的钱，大半是替你自己挣的。";
        }
        if (close) {
          return "你离财务自由就差临门一脚，几次大赌让你既尝过云端的滋味，也摔过得鼻青脸肿。"
            + "钱没滚够，可你那股「就是不肯打工」的倔，倒是一直没散。";
        }
        return "你喊了一辈子「打工是不可能打工的」，可风口没踩准，雪球没滚大，几次想搏命又被市场教做人。"
          + "到头来，那串花不完的零，终究只在你梦里出现过——但你试过，不肯认命这件事，本身也算活过一回。";
      }
    },
    [

      /* ========== 第1幕 序·觉醒（19岁）：立志 ========== */
      {
        id: "dst_freedom_1", at: { minAge: 19, stage: ["youth"] },
        title: "🐷 十九岁，你对着钱包许下一个野心",
        text: (s) => byClass(s, {
          poor: "你又一次在结账时偷偷把购物车里的东西放回去。母亲为几十块钱跟摊主磨了半天嘴皮，你站在旁边，脸热得发烫。那一刻你下了狠心：「打工是不可能打工的」——给别人卖一辈子命，到头还是被几十块钱卡住喉咙。我偏要挣到花不完的钱，再不为这点钱低一次头。",
          mid: "家里不算穷，可父母一辈子的口头禅是「找份稳定工作」。你看着他们为房贷算到深夜，忽然觉得这种「稳定」更像一个走不出去的笼子。「打工是不可能打工的」——你心里憋着一句话：稳定挣不来自由，我偏要靠搞钱、靠投资，把雪球滚起来，活成不用看别人脸色的样子。",
          rich: "家里给你铺好了路：进个体面单位，按部就班，安稳一生。可你偏不甘心做个守家业、领死工资的人。「打工是不可能打工的」——你想证明的恰恰是：钱不是用来守的，是用来生钱的。我要靠自己的眼光，挣出一份比家底更大的身价。"
        }),
        choices: [
          { label: "眼光派:钻研规律,赌的是看得比别人远", effect: (s) => {
              add(s, "insight", 4); add(s, "knowledge", 2); add(s, "stress", 3);
              return dstChoose(s, "dst_freedom_1", "freedom_eye",
                "你信的是认知变现：风口来之前先看懂它。你开始啃财报、追趋势、研究一切能生钱的门道——你赌的是，钱会奖励看得最远的那双眼睛。");
            } },
          { label: "胆识派:别人怕的时候我敢上,赌的是魄力", effect: (s) => {
              add(s, "strategy", 2); add(s, "charm", 3); add(s, "stress", 5); bumpMomentum(s, 4);
              return dstChoose(s, "dst_freedom_1", "freedom_guts",
                "你信的是「撑死胆大的，饿死胆小的」。机会面前，犹豫一秒就是错过。你给自己立的规矩只有一条：别人都不敢的时候，正是你下注的时候。");
            } },
          { label: "复利派:不求暴富,只求让钱慢慢滚成山", effect: (s) => {
              add(s, "knowledge", 3); add(s, "insight", 2); add(s, "stress", -2);
              return dstChoose(s, "dst_freedom_1", "freedom_slow",
                "你信的是时间的力量：不赌大的，只把每一分钱都派去打工，让复利替你滚雪球。慢，但你笃定——只要不下牌桌，雪球迟早滚成山。");
            } }
        ]
      },

      /* ========== 第2幕 起·第一桶金（26岁）：第一次搞到钱 ========== */
      {
        id: "dst_freedom_2", at: { minAge: 26 },
        title: "💰 二十六岁，一个能让你尝到甜头的风口",
        text: (s) => {
          const eye = dstPick(s, "dst_freedom_1") === "freedom_eye";
          return (eye
            ? "钻研了几年，你比身边任何人都先嗅到了味道：一个还没被大众发现的风口，正悄悄起势。"
            : "攒了几年，机会第一次真切地砸到你面前：一个所有人都在议论、看起来遍地是钱的风口。")
            + "可你手里本钱不多，输不起。这第一桶金，到底怎么淘？";
        },
        choices: [
          { label: "杠杆上车:借钱加杠杆,把这一把放到最大", next: (s) => ({
              text: "你东拼西凑，甚至刷了信用卡、借了网贷，把能动用的钱全压了上去，还加了杠杆。账户数字一夜之间翻了几倍——可你也清楚，这把要是反过来，你会输得连内裤都不剩。",
              choices: [
                { label: "见好就收,赚一笔立刻落袋", effect: (s) => {
                    const gain = 200000 + Math.round(moneyPower(s) * 6000);
                    add(s, "cash", gain); add(s, "strategy", 3); add(s, "mood", 8); bumpMomentum(s, 8);
                    return dstChoose(s, "dst_freedom_2", "freedom_guts_money",
                      "你在最高点附近果断清仓，第一桶金落袋为安。事后回看，你出货后没几天行情就崩了——这一把，你不光赚了钱，还赚了一身「拿得起放得下」的胆色。");
                  } },
                { label: "贪一口,加仓再赌它继续涨", effect: (s) => {
                    const win = rnd(0.42 + luckBias(s) + moneyPower(s) / 600);
                    if (win) { const g = 500000 + Math.round(moneyPower(s) * 9000); add(s, "cash", g); add(s, "mood", 12); bumpMomentum(s, 12); }
                    else { add(s, "cash", -80000); add(s, "mood", -14); add(s, "stress", 12); bumpMomentum(s, -8); }
                    return dstChoose(s, "dst_freedom_2", "freedom_guts_money",
                      win ? "你赌它再涨一程，它还真涨了。你赚得盆满钵满，第一桶金直接翻了倍。这一战让你彻底信了那句话：撑死胆大的。"
                          : "你贪了那最后一口，行情却在你加仓后掉头向下。第一桶金没捞着，反倒赔进去一截本金。市场给你上的第一课：贪字头上一把刀。");
                  } }
              ]
            }) },
          { label: "靠眼光稳吃:只投自己看懂的,赚认知内的钱", effect: (s) => {
              const win = rnd(0.5 + moneyPower(s) / 380 + luckBias(s));
              add(s, "insight", 3); add(s, "knowledge", 2);
              if (win) { const g = 180000 + Math.round(moneyPower(s) * 5000); add(s, "cash", g); add(s, "reputation", 3); bumpMomentum(s, 7); }
              else { add(s, "cash", 40000); add(s, "mood", -3); bumpMomentum(s, 2); }
              return dstChoose(s, "dst_freedom_2", "freedom_eye",
                win ? "你没碰自己看不懂的，只把钱押在研究透了的标的上。慢热，但稳——第一桶金扎扎实实落了袋，赚得清清楚楚，睡得安安稳稳。"
                    : "你谨慎地只赚认知内的钱，这一把没踩中大行情，但也没亏。你不急：本金还在，眼光还在，下一个风口还会来。");
            } },
          { label: "搞副业:不碰投机,用一门手艺慢慢攒", effect: (s) => {
              add(s, "knowledge", 3); add(s, "network", 4); add(s, "cash", 90000); add(s, "stress", 5);
              return dstChoose(s, "dst_freedom_2", "freedom_side",
                "你没去追那阵风，而是把下班后的每一分钟都变成了钱：接单、带货、做小生意。攒得慢，可每一分都是干干净净、风刮不走的。这是你给自己挖的第一口井。");
            } }
        ]
      },

      /* ========== 第3幕 折·一次大亏（33岁）：被市场狠狠教育 ========== */
      {
        id: "dst_freedom_3", at: { minAge: 33 },
        title: "📉 三十三岁，你被市场狠狠上了一课",
        text: (s) => {
          const guts = dstPick(s, "dst_freedom_2") === "freedom_guts_money";
          return "几年顺风顺水，你把胆子越搏越大，仓位越押越重。"
            + (guts ? "这次你又一次满仓加杠杆冲了进去——" : "这次你重仓压在了一个被吹上天的项目上——")
            + "然后，黑天鹅来了。一夜之间暴跌、平台暴雷、你被狠狠地割了一刀。账户里大半身家蒸发，电话被催债的、看戏的、劝退的塞满。三十三岁，你第一次摔得这么惨。";
        },
        dynamicChoices: (s) => ([
          { label: "认栽离场:割肉止损,保住剩下的本金", next: (s) => ({
              text: "你颤抖着手把剩下的仓位全砍了，把能保住的钱攥回手里。割肉的那一刀，疼得你整夜没睡。但你逼自己接受现实：留得青山在，不怕没柴烧。",
              choices: [
                { label: "痛定思痛,从此只赚看得懂的慢钱", effect: (s) => {
                    add(s, "cash", -Math.round(netWorth(s) * 0.3)); add(s, "insight", 5); add(s, "knowledge", 4);
                    add(s, "mood", -10); add(s, "stress", 8); add(s, "strategy", 3);
                    return dstChoose(s, "dst_freedom_3", "freedom_quit_loss",
                      "这一跤摔醒了你。你把那套「赌一把」的逻辑彻底扔了，重新捡起复利和耐心。亏掉的钱是学费，换来的认知，往后会一点点替你赚回来。");
                  } },
                { label: "上岸喘口气,先找份活养着自己", effect: (s) => {
                    add(s, "cash", -Math.round(netWorth(s) * 0.25)); add(s, "mood", -6); add(s, "health", 3); add(s, "stress", -4);
                    return dstChoose(s, "dst_freedom_3", "freedom_quit_loss",
                      "你暂时认了怂，去打了份工先回血——可你心里那句「打工是不可能打工的」一天都没忘。这只是中场休息，不是认输。等缓过来，你还要回到牌桌上。");
                  } }
              ]
            }) },
          { label: "加倍下注:不信邪,借钱抄底搏回本", next: (s) => ({
              text: "你不甘心就这么认输。你抵押了房子、借遍了能借的人，把筹码一次性押在了「它一定会反弹」上。这是一场要么翻身、要么彻底出局的豪赌——你赌的是自己的眼光，也是自己的命。",
              choices: [
                { label: "孤注一掷,梭哈抄在最底", effect: (s) => {
                    const win = rnd(0.34 + moneyPower(s) / 500 + luckBias(s));
                    add(s, "stress", 16); add(s, "health", -6);
                    if (win) { const g = Math.round(netWorth(s) * 0.9) + 600000; add(s, "cash", g); add(s, "mood", 16); add(s, "reputation", 6); bumpMomentum(s, 14); flag(s, "freedom_phoenix"); }
                    else { add(s, "cash", -Math.round(netWorth(s) * 0.8)); add(s, "assets", -Math.round((s.assets || 0) * 0.7)); add(s, "mood", -20); bumpMomentum(s, -14); flag(s, "freedom_burned"); }
                    return dstChoose(s, "dst_freedom_3", "freedom_double",
                      win ? "你赌赢了。行情真的在你抄底后绝地反弹，你不光回了本，还狠狠赚了一笔。死里逃生的人，眼神都不一样了——你更敢了，也更狠了。"
                          : "你赌输了。这一把把你打回了原形，房子没了，欠下一身债。你坐在空荡荡的屋里，第一次真切地怀疑：自己是不是从一开始就错了。");
                  } },
                { label: "稳一手,只用余钱小赌一搏", effect: (s) => {
                    const win = rnd(0.45 + moneyPower(s) / 420);
                    add(s, "stress", 8);
                    if (win) { add(s, "cash", 200000); add(s, "mood", 8); bumpMomentum(s, 6); }
                    else { add(s, "cash", -120000); add(s, "mood", -8); }
                    return dstChoose(s, "dst_freedom_3", "freedom_double",
                      win ? "你没把命搭进去，只拿能输得起的钱补了一仓。小赚一笔，刚好够你喘口气。你学会了在不甘心和不送命之间，找那条窄窄的活路。"
                          : "你留了余地，这一仗还是没翻过来，但至少没把自己赔光。你苦笑：搏了，输了，可命还在，牌桌也还在。");
                  } }
              ]
            }) },
          { label: "躺平接受:不补不割,装死等它自己回来", effect: (s) => {
              add(s, "stress", 10); add(s, "mood", -8); add(s, "health", -3);
              return dstChoose(s, "dst_freedom_3", "freedom_freeze",
                "你既不肯割肉认输，又没胆再补仓，索性把账户一锁，眼不见为净。你管这叫「长期持有」，其实你自己清楚，那不过是不敢面对的另一种说法。");
            } }
        ])
      },

      /* ========== 第4幕 危·中年all-in（41岁）：翻倍或归零 + 家庭拉扯 ========== */
      {
        id: "dst_freedom_4", at: { minAge: 41 },
        title: "🎲 四十一岁，一个让你身家翻倍或归零的机会",
        text: (s) => {
          const phoenix = has(s, "freedom_phoenix");
          const burned = has(s, "freedom_burned");
          return (phoenix ? "经历过死里逃生，你的嗅觉比谁都灵——这次,一个能让身家直接翻倍的超级机会摆在你面前,机不可失。"
                : burned ? "上次大亏的疮疤还没好,可命运偏在这时又递来一个能让你彻底翻身、身家翻倍的机会。"
                : "蛰伏多年,一个千载难逢的机会出现了:看准了,身家翻倍;看走眼,可能一夜归零。")
            + "可你已不是一个人了——爱人劝你别再赌,孩子要上学,父母要养老,家里需要的是一个稳的你。这一刻,你和那句「打工是不可能打工的」,较着最狠的劲。";
        },
        choices: [
          { label: "All-in:押上全部身家,赌这一把翻身", next: (s) => ({
              text: "你跟家人大吵了一架，最终还是瞒着把房本、存款、能动的一切都押了上去。深夜你盯着天花板,既兴奋又恐惧——这一把,赌的是全家的下半辈子。",
              choices: [
                { label: "豪赌到底,梭哈了就不回头", effect: (s) => {
                    let p = 0.36 + moneyPower(s) / 460 + luckBias(s) + (has(s, "freedom_phoenix") ? 0.06 : 0);
                    const win = rnd(p);
                    add(s, "stress", 18); add(s, "health", -8); add(s, "mood", -6);
                    if (win) { const g = Math.round(netWorth(s) * 1.4) + 1500000; add(s, "cash", g); add(s, "mood", 18); add(s, "reputation", 10); bumpMomentum(s, 18); flag(s, "freedom_doubled"); }
                    else { add(s, "cash", -Math.round((s.cash || 0) * 0.95)); add(s, "assets", -Math.round((s.assets || 0) * 0.9)); add(s, "mood", -24); add(s, "health", -6); bumpMomentum(s, -18); flag(s, "freedom_wiped"); }
                    return dstChoose(s, "dst_freedom_4", "freedom_allin",
                      win ? "你赌赢了。身家翻倍,你站到了离财务自由只剩一步的地方。家人不再说什么——赢家面前,没人记得当初的争吵。你比谁都清楚,这一把,值。"
                          : "你赌输了。身家几乎归零,房子没了,家里的天塌了一半。爱人红着眼睛收拾行李,孩子怯生生地看你。你终于尝到,搞钱这条路最黑的那一截。");
                  } },
                { label: "留条命,押大头但给家里留笔后路", effect: (s) => {
                    const win = rnd(0.43 + moneyPower(s) / 440 + luckBias(s));
                    add(s, "stress", 12);
                    if (win) { const g = Math.round(netWorth(s) * 0.8) + 600000; add(s, "cash", g); add(s, "mood", 12); bumpMomentum(s, 12); flag(s, "freedom_doubled"); }
                    else { add(s, "cash", -Math.round((s.cash || 0) * 0.6)); add(s, "mood", -12); add(s, "stress", 6); }
                    return dstChoose(s, "dst_freedom_4", "freedom_allin",
                      win ? "你赌得凶,却给家里留了张底牌。这一把赚翻了,后路还原封不动——你这才明白,真正的高手赌的不是命,是赔率。"
                          : "这一把没成,可你留的那笔后路救了全家。亏归亏,日子还能过。中年人的勇,是带着保险绳往下跳。");
                  } }
              ]
            }) },
          { label: "守住:这次不赌了,把钱换成稳稳的安稳", next: (s) => ({
              text: "你第一次在巨大的诱惑面前,选择了家人那张写满担忧的脸。你把钱从高风险的局里抽出来,换成房子、存款、孩子的教育金——你告诉自己,有些东西比那串零更重要。",
              choices: [
                { label: "彻底求稳,把钱锁进最保险的地方", effect: (s) => {
                    add(s, "cash", 80000); add(s, "mood", 10); add(s, "health", 6); add(s, "stress", -10); add(s, "network", 3);
                    return dstChoose(s, "dst_freedom_4", "freedom_hold",
                      "你把钱安顿得稳稳当当,虽然再难暴富,但全家睡得踏实。深夜抱着孩子,你忽然觉得,所谓自由,也许不只是账户上的数字。");
                  } },
                { label: "稳中求进,只拿小钱继续慢慢滚雪球", effect: (s) => {
                    add(s, "cash", 60000); add(s, "insight", 3); add(s, "knowledge", 2); add(s, "stress", -4);
                    return dstChoose(s, "dst_freedom_4", "freedom_hold",
                      "你守住了大盘,只留一小笔钱继续在场内滚。不冒进,也不收手——你赌的是时间,而你这辈子,最不缺的就是耐心。");
                  } }
              ]
            }) },
          { label: "骑墙:押一半赌一半,两头都不放手", effect: (s) => {
              const win = rnd(0.45 + moneyPower(s) / 480 + luckBias(s));
              add(s, "strategy", 3); add(s, "stress", 8);
              if (win) { add(s, "cash", 500000); add(s, "mood", 8); bumpMomentum(s, 8); }
              else { add(s, "cash", -300000); add(s, "mood", -8); }
              return dstChoose(s, "dst_freedom_4", "freedom_hedge",
                win ? "你押一半留一半,既没辜负机会,也没辜负家人。赌中的那一半让你小赚一笔,守住的那一半让你心里有底。两头骑墙,这回骑对了。"
                    : "你两头下注,结果赌的那半亏了,守的那半也没增值多少。不上不下,既没爽到,也没稳到——骑墙的代价,是哪头的好处都只占了一半。");
            } }
        ]
      },

      /* ========== 第5幕 巅·临门一搏（51岁）：最后一步 ========== */
      {
        id: "dst_freedom_5", at: { minAge: 51 },
        title: "🏔️ 五十一岁，离财务自由只剩最后一步",
        text: (s) => {
          const wiped = has(s, "freedom_wiped");
          const doubled = has(s, "freedom_doubled");
          if (wiped) {
            return "那次归零后,你跌进了谷底,又咬牙一点点爬了回来。如今头发白了,身价还没回到当年的高点。可命运像是要给你最后一次机会——一个能让你一举封顶、彻底翻身的局,出现在你面前。这一搏,是你和那句老话最后的恩怨。";
          }
          if (doubled) {
            return "翻倍那一仗后,你的身家已经摸到了财务自由的门槛边。如今,只差临门一脚——一个能把你正式送过千万线、从此再不必为钱操心的机会,摆在了你面前。半生的牌,就剩这最后一手了。";
          }
          return "搞了三十多年,你离「身价过千万、从此财务自由」的那道线,只剩最后一步之遥。机会还在,可你也老了,赌不动太多次了。这是你这辈子,离自由最近的一次,也可能是最后一次。";
        },
        dynamicChoices: (s) => {
          const phoenix = has(s, "freedom_phoenix") || has(s, "freedom_doubled");
          const eyeman = has(s, "dst_pick_freedom_eye") || has(s, "dst_pick_freedom_quit_loss");
          const richEnough = netWorth(s) >= 3000000;
          return [
            { label: "凭眼光封顶:把一生的认知押在最后这一注", effect: (s) => {
                let p = 0.4 + moneyPower(s) / 360 + (eyeman ? 0.1 : 0) + (richEnough ? 0.08 : 0) + luckBias(s);
                const win = rnd(p);
                add(s, "stress", 12);
                if (win) {
                  const need = Math.max(0, 10000000 - netWorth(s));
                  add(s, "cash", need); add(s, "assets", bigWindfall(s, 22000000)); flag(s, "freedom_free"); add(s, "mood", 20); add(s, "reputation", 12); bumpMomentum(s, 18);
                  return dstChoose(s, "dst_freedom_5", "freedom_win",
                    "你看准了,也等到了。最后这一注稳稳落地,身价正式越过千万线。你坐在阳台上看夕阳,这辈子第一次,钱再也不能逼你做任何不想做的事。自由,你终于拿到手了。");
                }
                add(s, "cash", -Math.round((s.cash || 0) * 0.3)); add(s, "mood", -16); bumpMomentum(s, -8);
                return dstChoose(s, "dst_freedom_5", "freedom_near",
                  "最后一搏,你惜败了。差的那一点,不是眼光,是运气——市场总在最关键的时候,跟你开一个最大的玩笑。你离自由就差一步,可这一步,你这辈子怕是迈不过去了。");
              } },
            { label: "搏命再赌一把:身家全压,要么封神要么归零", effect: (s) => {
                let p = 0.32 + moneyPower(s) / 480 + (phoenix ? 0.1 : 0) + luckBias(s);
                if (has(s, "dst_pick_freedom_allin") || has(s, "dst_pick_freedom_double")) p += 0.06;
                const win = rnd(p);
                add(s, "stress", 16); add(s, "health", -8);
                if (win) {
                  const need = Math.max(0, 10000000 - netWorth(s));
                  add(s, "cash", need); add(s, "assets", bigWindfall(s, 40000000)); flag(s, "freedom_free"); add(s, "mood", 22); add(s, "reputation", 10); bumpMomentum(s, 20);
                  return dstChoose(s, "dst_freedom_5", "freedom_win",
                    "你又一次把全部身家拍上了桌,而命运,最后一次站在了你这边。账户那串零长得让你眼眶发热——你赌了一辈子,终于在收官这一把,赌成了自由身。");
                }
                add(s, "cash", -Math.round((s.cash || 0) * 0.85)); add(s, "assets", -Math.round((s.assets || 0) * 0.8)); add(s, "mood", -22); bumpMomentum(s, -16);
                return dstChoose(s, "dst_freedom_5", "freedom_near",
                  "最后一把,你还是没忍住又梭了。这一次,命运没再给你奇迹。归零的那一刻,你反而笑了——折腾一辈子,到头来,你输给的还是那两个字:运气。");
              } },
            { label: "见好就收:不赌了,守着现有的安度晚年", effect: (s) => {
                add(s, "mood", 12); add(s, "health", 8); add(s, "stress", -14); add(s, "reputation", 4);
                return dstChoose(s, "dst_freedom_5", "freedom_retire",
                  "你笑着退出了这场角逐。没摸到那一千万又怎样——你这辈子从没替谁卖过命,手里的钱够花,身子还硬朗。不被钱牵着鼻子走,本身就是一种自由。");
              } }
          ];
        }
      }

    ]);

})();
