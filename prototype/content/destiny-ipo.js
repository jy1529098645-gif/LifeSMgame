"use strict";
/* =====================================================================
 * content/destiny-ipo.js —— 命运线【创业封神 ipo】
 * 母题：「打工是不可能打工的」——这辈子给人打工，纯属遭罪。你偏要自己
 *       当老板，从一无所有干到敲钟那一刻，把自己的名字刻进交易所的钟声里。
 * 注意：游戏已有「创业经营」玩法（s.startup 数值、ev_su_* 里程碑）。本线
 *       是创业者一生的【精神主轴/重大命运抉择】，聚焦情感与取舍，不复刻
 *       经营数值流程，与经营系统并存。
 * 五幕脊柱（确定性、按阶段推进，前幕选择在后幕/清算回收）：
 *   1 序·野心     19岁  立志「打工没出路，我要自己当老板」
 *   2 起·下海     27岁  辞掉铁饭碗，第一次真正下海创业
 *   3 折·归零     34岁  第一次创业失败/资金链断/被合伙人背叛（两层分支）
 *   4 危·豪赌     42岁  东山再起的大机会 vs 守小而美 vs 被收购套现（两层分支）
 *   5 巅·敲钟     52岁  冲击上市的最后一搏，成败读累积属性+前幕伏笔
 * 记录抉择用 dstChoose(s, chId, key, note)；回收用 dstPick / has(s,"dst_pick_*")。
 * ===================================================================== */
(function () {

  // —— 综合「创业者实力」：决定关键判定，越高越稳 ——
  function founderPower(s) {
    const st = s.stats || {};
    let p = (st.strategy || 0) + (st.charm || 0) * 0.8 + (st.insight || 0) * 0.7
          + (st.knowledge || 0) * 0.4
          + (s.reputation || 0) * 0.6 + (s.network || 0) * 0.9;
    // 经营系统若存在，估值与进度加成（可读但不假设一定存在）
    if (s.startup) {
      p += Math.min(40, (s.startup.valuation || 0) / 1e8 * 6);
      p += Math.min(20, (s.startup.progress || 0) * 0.2);
    }
    return p;
  }

  // —— 是否真的把公司带上了市（命运线自留标记，也兼容经营系统） ——
  function rangZhong(s) {
    return has(s, "ipo_bell_rung")
        || (has(s, "startup_done") && !has(s, "startup_failed"));
  }

  registerDestiny("ipo",
    {
      name: "创业封神", motif: "打工是不可能打工的",
      acts: ["序·野心", "起·下海", "折·归零", "危·豪赌", "巅·敲钟"],
      // —— 母题清算：回收一生的命运抉择 ——
      reckon: function (s) {
        const rung = rangZhong(s);
        // 回收伏笔：是否一路死磕、是否曾被背叛后选择再战、是否守住/卖掉
        const diehard = has(s, "dst_pick_ipo_allin") || has(s, "dst_pick_ipo_again")
                      || has(s, "dst_pick_ipo_bigbet");
        const cashedOut = has(s, "dst_pick_ipo_acquired") || has(s, "dst_pick_ipo_cashout");
        const smallBeauty = has(s, "dst_pick_ipo_smallbiz") || has(s, "dst_pick_ipo_keep");
        const wentBack = has(s, "dst_pick_ipo_backtowork");

        if (rung && diehard) {
          return "敲钟那天，闪光灯亮成一片白。你站在那面金色的锣前，想起十九岁那个发誓「绝不给人打工」的自己。"
            + "你摔过、被坑过、归过零，可你一次都没回头。「打工是不可能打工的」——这句年轻时的狂话，被你用一生兑现成了交易所里那一声钟响。封神，名副其实。";
        }
        if (rung) {
          return "你到底把公司带上了市。钟声响起的那一刻，所有的对赌、稀释、不眠之夜都有了交代。"
            + "你没靠谁、没认命，从零做成了一家上市公司的老板——「打工是不可能打工的」，你这辈子，说到做到。";
        }
        if (cashedOut) {
          return "你没等到亲手敲钟，却也在一次漂亮的收购里全身而退，套现走人，财务自由。"
            + "有人说你功亏一篑，可你清楚：你从没给人打过工，公司是你一手做大的，价钱是你谈成的。封神差一步，称王绰绰有余。";
        }
        if (smallBeauty) {
          return "你没上成市，却把一家小而美的公司守了一辈子，养活了一群跟着你的人。"
            + "你始终是自己的老板，没向那句「打工是不可能打工的」低过头。钟你没敲成，可这条命是你自己的——这就够了。";
        }
        if (wentBack) {
          return "兜兜转转，你最终还是回去给人打了工。年轻时那句「打工是不可能打工的」，成了你心里一道没愈合的疤。"
            + "你试过，赌过，输过——只是命运的钟，终究没为你敲响。但凡夜深，你仍会想：要是当年再撑一口气，会不会就不一样了。";
        }
        return "你这辈子都在跟「自己当老板」这四个字死磕，钟没敲成，神也没封成。"
          + "可你从没真正认命——「打工是不可能打工的」，你拿大半生去证它，输是输了，却也轰轰烈烈活过一回。";
      }
    },
    [

      /* ========== 第1幕 序·野心（19岁）：立志 ========== */
      {
        id: "dst_ipo_1", at: { minAge: 19, stage: ["youth"] },
        title: "🔥 十九岁，你给自己立了个反骨的志",
        text: (s) => byClass(s, {
          poor: "宿舍熄了灯，你还盯着天花板。家里供你读到这儿已经掏空了，亲戚都劝你赶紧找个稳定工作。可你越想越憋屈：给人打一辈子工，能翻什么身？「打工是不可能打工的」——这话别人当笑话，你当成了命。没本钱没背景，那就拿这条命去赌，赌出一家自己的公司来。",
          mid: "毕业季，同学都在投简历挤大厂。你看着那一排排「稳定、五险一金、双休」，只觉得喘不上气。凭什么我的人生要被框进别人的格子里？「打工是不可能打工的」——你心里这股劲压不住：我要自己当老板，做一家从我手里长出来的公司。",
          rich: "家里的产业、铺好的位子，伸手就能接。可你偏不。被人议论一句「靠家里的」，比打你一巴掌还难受。「打工是不可能打工的」——给自家打工也是打工。你要的是从零开始，做一家姓你名字的公司，让所有人闭嘴：我，不靠任何人，也能封神。"
        }),
        choices: [
          { label: "孤注一掷:从现在起,所有时间都砸进创业准备", effect: (s) => {
              add(s, "strategy", 3); add(s, "stress", 6); add(s, "insight", 2);
              return dstChoose(s, "dst_ipo_1", "ipo_obsess",
                "你给自己断了后路：从今天起，泡论坛、啃商业书、混创业圈，别人谈恋爱打游戏的时间，你全砸进了那个还没影的公司里。野心一旦点着，就再也熄不灭。");
            } },
          { label: "先攒本事:进个好平台偷师,看清门道再下水", effect: (s) => {
              add(s, "knowledge", 3); add(s, "strategy", 2); add(s, "network", 3);
              return dstChoose(s, "dst_ipo_1", "ipo_learn",
                "你想得更冷静：空有一腔热血会死得很惨。你决定先进个能学到真东西的地方，把行业的水深水浅、人脉资源摸透——磨刀，从来不误砍柴。");
            } },
          { label: "广结善缘:先把人脉圈搭起来,英雄不能单干", effect: (s) => {
              add(s, "charm", 3); add(s, "network", 5); add(s, "reputation", 2);
              return dstChoose(s, "dst_ipo_1", "ipo_connect",
                "你信的是「事在人为，人在圈里」。你开始拼命认识人——师兄、投资人、技术大牛。创业不是一个人的事，你要先把未来能拉上船的人，一个个记在心里。");
            } }
        ]
      },

      /* ========== 第2幕 起·下海（27岁）：第一次真正创业 ========== */
      {
        id: "dst_ipo_2", at: { minAge: 27 },
        title: "🌊 二十七岁，你站在了下海的岸边",
        text: (s) => {
          const learn = dstPick(s, "dst_ipo_1") === "ipo_learn";
          return (learn
            ? "几年平台历练，你把行业的脉门摸得透透的，手里攒了点钱、几个靠谱的人和一个憋了很久的点子。"
            : "你折腾了几年，机会终于成型：一个你坚信能成的方向，一笔将将够启动的本钱。")
            + "可眼下你有一份旱涝保收的稳定工作，家里人千叮万嘱「别瞎折腾」。下海这一步迈出去，就再没有铁饭碗兜底了。你怎么跳？";
        },
        choices: [
          { label: "义无反顾:辞职、All in,断了所有退路", next: (s) => ({
              text: "你递了辞呈，把存款、公积金甚至信用卡额度全划进了公司账户。父母在电话那头沉默了很久。可你站在租来的简陋办公室里，第一次觉得：这地方，每一寸都是我的。",
              choices: [
                { label: "梭哈到底:连房子都抵押了,赌它一个未来", effect: (s) => {
                    add(s, "cash", -50000); add(s, "stress", 14); add(s, "strategy", 3); bumpMomentum(s, 10);
                    flag(s, "ipo_no_retreat");
                    return dstChoose(s, "dst_ipo_2", "ipo_allin",
                      "你把唯一的房子也抵了，账上多了一笔救命钱，心里却悬了一座山。退路？你亲手烧光了。从这一刻起，你只有一个选择——赢。");
                  } },
                { label: "留一线:辞职可以,但给自己留半年生活费", effect: (s) => {
                    add(s, "stress", 8); add(s, "insight", 2); bumpMomentum(s, 6);
                    return dstChoose(s, "dst_ipo_2", "ipo_allin",
                      "你辞了职，全力扑进去，但悄悄留了半年口粮——不是怕死，是想活得久一点、撑到看见曙光那天。义无反顾，也得有点活下去的智慧。");
                  } }
              ]
            }) },
          { label: "稳妥下海:不辞职,先副业试水,跑通了再说", effect: (s) => {
              add(s, "stress", 6); add(s, "knowledge", 3); add(s, "strategy", 2);
              return dstChoose(s, "dst_ipo_2", "ipo_sidehustle",
                "你没敢一下把绳子剪断：白天上班，晚上和周末扑在自己的项目上。两头烧的日子累得脱形，可你告诉自己——先把模式跑通，再谈轰轰烈烈。");
            } },
          { label: "拉人合伙:找几个信得过的人,凑成一个班子", effect: (s) => {
              add(s, "network", 8); add(s, "charm", 3); add(s, "reputation", 2);
              flag(s, "ipo_has_partner");
              return dstChoose(s, "dst_ipo_2", "ipo_partner",
                "你拉来了两个老伙计，技术、运营、谈钱各管一摊，分了股、喝了酒、立了誓。创业路上有人并肩，胆气壮了一倍——只是你那时还不知道，最深的伤往往来自最近的人。");
            } }
        ]
      },

      /* ========== 第3幕 折·第一次归零（34岁）：失败/资金链断/被背叛 ========== */
      {
        id: "dst_ipo_3", at: { minAge: 34 },
        title: "💔 三十四岁，一切归零的那个清晨",
        text: (s) => {
          const partner = dstPick(s, "dst_ipo_2") === "ipo_partner" || has(s, "ipo_has_partner");
          const allin = has(s, "ipo_no_retreat");
          return (partner
            ? "崩盘来得猝不及防：你最信任的合伙人,带着核心团队和那笔关键的客户资源,在背后另起了炉灶。等你发现时,公司已被掏空了一半。"
            : "崩盘来得猝不及防:谈了大半年的那轮融资,在签字前夜黄了。资金链「啪」地一声断在你手里,账上的钱发不出下个月的工资。")
            + (allin ? "而你早已没有退路——房子抵了,存款空了,这一摔,是真的摔到了底。" : "")
            + "三十四岁，第一次创业，归零。你蹲在空荡荡的办公室里，要做这辈子最难的一个决定。";
        },
        choices: [
          { label: "擦干血再来:认账、还债,然后从头再干一次", next: (s) => ({
              text: "你没有躲债，一笔笔列清楚，签了还款计划。送走最后一个员工那天，你在楼下站了很久，然后掏出本子，开始写下一家公司的第一行字。",
              choices: [
                { label: "复盘到骨子里:把这次的死因一条条钉死,绝不再犯", effect: (s) => {
                    add(s, "insight", 5); add(s, "strategy", 4); add(s, "stress", 8); add(s, "reputation", 3);
                    bumpMomentum(s, 8);
                    return dstChoose(s, "dst_ipo_3", "ipo_again",
                      "你把这场失败拆成了一本厚厚的复盘笔记——哪里看错了人、哪里赌错了节奏。血没白流。再出发的你，眼里多了一层别人没有的冷静。");
                  } },
                { label: "带着仇气再战:就是要做给那些看我笑话的人看", effect: (s) => {
                    add(s, "strategy", 3); add(s, "stress", 12); add(s, "mood", -6); add(s, "reputation", 2);
                    bumpMomentum(s, 6);
                    return dstChoose(s, "dst_ipo_3", "ipo_again",
                      "你把所有的羞辱、嘲笑、背叛，熬成了一股黑色的燃料。你不是要证明给世界看，你是要证明给那几张脸看。带着仇气的人最可怕——也最容易再摔一次。");
                  } }
              ]
            }) },
          { label: "认清现实:暂时回去打工,养家、回血、再等机会", next: (s) => ({
              text: "你低下了高昂了大半辈子的头，投了简历。面试官问你「为什么从创业回来」，你笑了笑没多说。坐回格子间的第一天，你盯着工牌，心里那句「打工是不可能打工的」，第一次显得那么讽刺。",
              choices: [
                { label: "蛰伏:把这当成中场休息,边打工边攒下一次的本钱", effect: (s) => {
                    add(s, "cash", 30000); add(s, "knowledge", 3); add(s, "stress", -4); add(s, "mood", -4);
                    return dstChoose(s, "dst_ipo_3", "ipo_backtowork",
                      "你告诉自己：这不是认输，是回血。你一边领着工资还债、攒钱，一边盯着行业的下一个风口。蛰伏，是为了下一次跳得更高——至少你这么催眠自己。");
                  } },
                { label: "心死:也许我本就不是当老板的料,认了吧", effect: (s) => {
                    add(s, "mood", -10); add(s, "stress", -8); add(s, "health", 4);
                    flag(s, "ipo_gave_up_once");
                    return dstChoose(s, "dst_ipo_3", "ipo_backtowork",
                      "夜里你想了很多。也许有些人天生就该当老板，而你不是。你把那本商业计划书锁进了抽屉最底层。日子,好像也没那么难熬了——只是心里有块地方，从此空着。");
                  } }
              ]
            }) }
        ]
      },

      /* ========== 第4幕 危·中年豪赌（42岁）：东山再起 vs 小而美 vs 套现 ========== */
      {
        id: "dst_ipo_4", at: { minAge: 42 },
        title: "🎲 四十二岁，命运又把骰子推到你面前",
        text: (s) => {
          const back = dstPick(s, "dst_ipo_3") === "ipo_backtowork";
          const again = dstPick(s, "dst_ipo_3") === "ipo_again";
          return (back
            ? "蛰伏了这些年，一个久违的风口突然砸到你脚下：老搭档带着一个性感的赛道找上门，资本正热，窗口期只有这一次。给人打工的日子，你一天都没真正甘心过。"
            : (again
              ? "二次创业你做得有声有色，公司活下来了，还小有名气。这天，三件事同时砸到你头上,逼你做一个中年人最撕扯的选择。"
              : "你的公司熬过了死亡线,做到了小有规模。可正当口,机会与诱惑一起涌来。"))
            + "孩子要上学,父母在变老,家里人希望你「别再折腾,稳一点」。可摆在面前的,是离封神最近的一次豪赌。你赌不赌？";
        },
        choices: [
          { label: "东山再起:倾尽所有冲那个最大的赛道,赌命一搏", next: (s) => ({
              text: "你说服了家里——或者说，你没能说服，但你还是签了那份融资协议。对赌条款写得像悬在头顶的刀：三年内做到目标，否则净身出户。你把中年人最后的体面，全押了上去。",
              choices: [
                { label: "签下对赌:把自己逼到绝境,要么封神要么出局", effect: (s) => {
                    const win = rnd(0.42 + founderPower(s) / 420 + luckBias(s));
                    add(s, "stress", 16); add(s, "health", -6);
                    if (win) { add(s, "reputation", 12); add(s, "network", 6); bumpMomentum(s, 14); flag(s, "ipo_rocket"); }
                    else { add(s, "mood", -12); add(s, "cash", -40000); bumpMomentum(s, -8); }
                    return dstChoose(s, "dst_ipo_4", "ipo_bigbet",
                      win ? "对赌的压力把你和团队逼出了人生最猛的一轮冲刺。数据一路向上,资本开始排队找你。距离敲钟,你第一次看见了真切的影子。"
                          : "对赌像绞索越收越紧。你拼到油尽灯枯,数字还是差了一截。你没出局,但元气大伤——这一赌,赌掉了大半条命。");
                  } },
                { label: "拉一线投资人入局:用人情和股份换最后的弹药", effect: (s) => {
                    let p = 0.4 + (s.network || 0) / 130 + founderPower(s) / 500;
                    const win = rnd(p);
                    add(s, "network", -10); add(s, "stress", 12);
                    if (win) { add(s, "reputation", 8); bumpMomentum(s, 10); flag(s, "ipo_rocket"); }
                    else { add(s, "mood", -8); bumpMomentum(s, -6); }
                    return dstChoose(s, "dst_ipo_4", "ipo_bigbet",
                      win ? "你把攒了半辈子的人脉押上桌,几个关键的投资人信了你这个人。弹药到位,公司像上了发条一样狂奔。封神的门,推开了一条缝。"
                          : "钱是拉来了,可股份也稀释得七零八落。你忽然发现:这家以你名字开头的公司,你说了算的部分,越来越少。");
                  } }
              ]
            }) },
          { label: "守住小而美:不上市了,把现在这摊稳稳当当做一辈子", effect: (s) => {
              add(s, "mood", 8); add(s, "health", 5); add(s, "stress", -10); add(s, "cash", 20000);
              return dstChoose(s, "dst_ipo_4", "ipo_smallbiz",
                "你做了个让所有人意外的决定:停止扩张。你守着这家不大不小的公司,养着一群跟你多年的兄弟,准点回家陪家人吃饭。封神的梦,你轻轻折好放进了抽屉——你说,我已经是自己的老板了,够了。");
            } },
          { label: "被大厂收购:套现走人,落袋为安,这辈子值了", next: (s) => ({
              text: "一家行业巨头开出了让你心跳加速的价码,要把你的公司连人带货一起收编。会议室里,律师在念那一长串数字。你想起十九岁那个一无所有的自己——这一笔,够你下半辈子衣食无忧。",
              choices: [
                { label: "干净退出:拿钱走人,从此财务自由、归隐山林", effect: (s) => {
                    add(s, "cash", 3000000); add(s, "mood", 14); add(s, "stress", -16); add(s, "health", 6);
                    flag(s, "ipo_cashed_out");
                    return dstChoose(s, "dst_ipo_4", "ipo_cashout",
                      "你签了字,把公司交了出去,账上多了一串这辈子没见过的数字。没敲成钟,但你从一无所有干到了财务自由。封神差一步,你却也再不必为五斗米折腰——这就是你要的『不打工』。");
                  } },
                { label: "带队加盟:套现一半,留下来博更大的盘子", effect: (s) => {
                    add(s, "cash", 1500000); add(s, "network", 8); add(s, "stress", 6); add(s, "reputation", 6);
                    flag(s, "ipo_inside_giant");
                    return dstChoose(s, "dst_ipo_4", "ipo_acquired",
                      "你拿了一半的钱,带着团队进了巨头的盘子,换一个更大的舞台。有人说你这是变相打工,你笑而不语——你心里清楚,你是带着自己的城池入的伙,等的是下一次单飞封神。");
                  } }
              ]
            }) }
        ]
      },

      /* ========== 第5幕 巅·敲钟时刻（52岁）：最后一搏 ========== */
      {
        id: "dst_ipo_5", at: { minAge: 52 },
        title: "🔔 五十二岁，钟，就在你面前",
        text: (s) => {
          if (has(s, "ipo_cashed_out")) {
            return "归隐的日子过了几年,你心里那点不甘始终没散。你拿出全部身家,重新出山,做一家全新的公司——这一次,你只为一件事:亲手把它送上市,补上当年没敲成的那记钟。";
          }
          if (has(s, "ipo_inside_giant")) {
            return "在巨头的盘子里养精蓄锐多年,你终于带着团队和资源单飞。绕了一大圈,你又站回了创业的起跑线,只是这次,终点线后面挂着的,是交易所那面金色的锣。";
          }
          return "三十多年,摔过、归过零、赌过命。如今你的公司站在了上市的门槛前,招股书已经递了上去。路演、问询、最后一轮博弈……这是你这辈子离敲钟最近的一次,也极可能是最后一次。";
        },
        dynamicChoices: (s) => {
          const rocket = has(s, "ipo_rocket");
          const diehard = has(s, "dst_pick_ipo_allin") || has(s, "dst_pick_ipo_again");
          const gaveUp = has(s, "ipo_gave_up_once");
          return [
            { label: "全力冲刺IPO:把一生战绩摆上路演的台面,赌它敲钟", effect: (s) => {
                let p = 0.3 + founderPower(s) / 360 + (rocket ? 0.12 : 0)
                      + (diehard ? 0.07 : 0) - (gaveUp ? 0.05 : 0) + luckBias(s);
                const win = rnd(Math.min(0.9, p));
                add(s, "stress", 14); add(s, "health", -4);
                if (win) {
                  flag(s, "ipo_bell_rung"); add(s, "reputation", 18); add(s, "mood", 20);
                  add(s, "assets", bigWindfall(s, 55000000)); bumpMomentum(s, 18);
                  return dstChoose(s, "dst_ipo_5", "ipo_bell",
                    "锣声砸下来的那一刻,你的眼睛是热的。屏幕上跳动的代码是你公司的名字,大厅里所有人在为你鼓掌。从十九岁那句狂话,到此刻的钟声,你用了一生——封神,你做到了。");
                }
                add(s, "mood", -16); add(s, "reputation", 4); bumpMomentum(s, -10);
                return dstChoose(s, "dst_ipo_5", "ipo_nearbell",
                  "最后一道问询没能过关,或是市场窗口在你递表的瞬间关上了。上市搁浅。你离那面锣只有一步之遥——这一步,你这辈子,终究没能跨过去。");
              } },
            { label: "接受战略融资:不上市了,引巨头注资,稳稳做行业头部", effect: (s) => {
                add(s, "cash", 2000000); add(s, "reputation", 8); add(s, "network", 6);
                add(s, "mood", 8); add(s, "stress", -8);
                flag(s, "ipo_strategic_stay");
                return dstChoose(s, "dst_ipo_5", "ipo_keep",
                  "你没去敲那记钟,而是引了一笔战略投资,把公司做成了细分领域里谁都绕不开的头部。你始终是它的老板,只是不再追求那声钟响——你说,做实了,比敲响了更让你踏实。");
              } },
            { label: "急流勇退:把公司交给团队,自己功成身退、含笑收场", effect: (s) => {
                add(s, "mood", 12); add(s, "health", 8); add(s, "reputation", 6); add(s, "stress", -14);
                return dstChoose(s, "dst_ipo_5", "ipo_retire",
                  "你把帅印交给了一手带出来的接班人,自己退到了幕后。敲不敲钟,你忽然不那么执着了——从一无所有到坐拥一家公司,你这辈子从没给人打过工。这,已经是属于你的封神。");
              } }
          ];
        }
      }

    ]);

})();
