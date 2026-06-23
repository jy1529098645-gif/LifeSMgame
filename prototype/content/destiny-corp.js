"use strict";
/* =====================================================================
 * content/destiny-corp.js —— 命运线【打工封顶 corp】
 * 母题：太爷爷说「打工是不可能打工的」。你偏不信——要用一身本事，把
 *       『工』字写出花来，打老祖宗的脸：打工，也能出头。
 * 五幕脊柱（确定性、按阶段推进，前幕选择在后幕/清算回收）：
 *   1 序·入场     19岁  第一份工，你立下「偏要打工打出头」的志
 *   2 起·崭露     26岁  第一个出头机会：抢功/让功/靠本事
 *   3 折·三十的墙 33岁  空降领导压你：硬刚业务 / 攀附站队 / 暗中较劲
 *   4 危·中年优化 41岁  被列入优化名单 + 创业诱惑：守住打工初心 or 动摇
 *   5 巅·叩关高管 51岁  最后一搏冲 C 级，成败读累积属性 + 前幕伏笔
 * 记录抉择用 dstChoose(s, chId, key, note)；回收用 dstPick / has(s,"dst_pick_*")。
 * ===================================================================== */
(function () {

  // —— 综合「职场实力」：决定关键判定，越高越稳 ——
  function corpPower(s) {
    const st = s.stats || {};
    return (st.strategy || 0) + (st.charm || 0) + (st.knowledge || 0) * 0.6
         + (s.reputation || 0) * 0.5 + (s.network || 0) * 0.8
         + (s.job ? (s.job.level || 0) * 14 : 0);
  }

  registerDestiny("corp",
    {
      name: "打工封顶", motif: "打工是不可能打工的",
      acts: ["序·入场", "起·崭露", "折·三十的墙", "危·中年优化", "巅·叩关高管"],
      // —— 母题清算：回收一生的命运抉择 ——
      reckon: function (s) {
        const exec = !!(s.job && (s.job.id === "exec" || s.job.level >= 3));
        const top = (typeof jobSalary === "function" ? jobSalary(s) : 0) >= 100000;
        const climbed = exec || top;
        const honest = has(s, "dst_pick_corp_byskill") || has(s, "dst_pick_corp_hardline");
        const climber = has(s, "dst_pick_corp_faction") || has(s, "dst_pick_corp_steal");
        const stayed = has(s, "dst_pick_corp_stay");
        if (climbed && honest) {
          return "你没靠裙带、没踩着谁，就凭一身真本事，把『工』字写出了花，坐到了别人仰望的位子。"
            + "太爷爷那句「打工是不可能打工的」，被你结结实实打了脸——打工，也能出头，还能出得堂堂正正。";
        }
        if (climbed && climber) {
          return "你确实爬上去了，只是这一路的酒局、站队和那些说不出口的妥协，你自己最清楚。"
            + "你赢了老祖宗那句话，可夜深人静时，你偶尔会问自己：这算不算，也把自己活成了当年看不惯的样子。";
        }
        if (climbed) {
          return "你终究是打工打出了头，做到了多数人做不到的位置。老祖宗的断言，在你这儿不作数。";
        }
        if (stayed) {
          return "你守着「打工也要打出头」的倔强走了一辈子，没登上顶，却也没把自己交出去。"
            + "老祖宗的话你没能反驳，可你用一生证明了：把本分的事做到极致，本身就是一种体面。";
        }
        return "你也曾想用打工打老祖宗的脸，可职场的天花板，到底比你想的更硬。"
          + "那句「打工是不可能打工的」，你这辈子没能推翻——但你试过，这就够了。";
      }
    },
    [

      /* ========== 第1幕 序·入场（19岁）：立志 ========== */
      {
        id: "dst_corp_1", at: { minAge: 19, stage: ["youth"] },
        title: "💼 第一天上班，你在工位上立了个志",
        text: (s) => byClass(s, {
          poor: "你挤了一个半小时地铁，站到工位前，工牌还是热的。周围人敲键盘的声音像雨点。你想起太爷爷那句「打工是不可能打工的」——可你偏不信邪：没背景、没本钱，那就拿命去拼，看打工到底能不能打出个头来。",
          mid: "新人入职第一天。HR 念着规章，你盯着那张工牌上自己的名字发呆。太爷爷总说「打工是不可能打工的」。你心里却憋着一股劲：凭什么？我偏要用本事，把这条最多人走的路，走出花来。",
          rich: "家里本可以给你安排得更轻松，你却偏要自己投简历、自己来报到。太爷爷那句「打工是不可能打工的」在你耳边回响。你想证明的恰恰是：哪怕从打工干起，我也能凭本事登顶——不靠家里。"
        }),
        choices: [
          { label: "锋芒毕露：第一个项目就要露脸", effect: (s) => {
              add(s, "reputation", 4); add(s, "stress", 6); add(s, "charm", 2);
              return dstChoose(s, "dst_corp_1", "corp_sharp",
                "你给自己定了调：要么不出手，出手就要让所有人记住你的名字。锋芒，是你递出的第一张名片。");
            } },
          { label: "扮猪吃虎：先蛰伏，攒实力再发力", effect: (s) => {
              add(s, "insight", 3); add(s, "strategy", 3);
              return dstChoose(s, "dst_corp_1", "corp_lurk",
                "你决定先把头埋下去。看清楚谁说了算、坑在哪儿、肉在哪儿——等羽翼丰满，再一鸣惊人。");
            } },
          { label: "老实肯干：把分内事做到极致", effect: (s) => {
              add(s, "knowledge", 3); add(s, "reputation", 2); add(s, "stress", -2);
              return dstChoose(s, "dst_corp_1", "corp_solid",
                "你信的是笨办法：别人下班你还在啃业务，别人糊弄你较真。本事是攒出来的，路是一步一步踩实的。");
            } }
        ]
      },

      /* ========== 第2幕 起·崭露（26岁）：第一个出头机会 ========== */
      {
        id: "dst_corp_2", at: { minAge: 26 },
        title: "✨ 一个能让你被老板记住的机会",
        text: (s) => {
          const lurk = dstPick(s, "dst_corp_1") === "corp_lurk";
          return (lurk
            ? "蛰伏几年，你早把这块业务摸得门儿清。机会来了：一个烫手却抢眼的项目，没人敢接。"
            : "熬了几年，第一个真正的机会摆到面前：一个能直达老板视线的硬项目。")
            + "你和同组的搭档一起扛了下来，眼看就要出成果——可论功行赏时，话语权未必在你手里。这一仗，怎么打？";
        },
        choices: [
          { label: "抢功上位：把关键汇报牢牢攥在自己手上", next: (s) => ({
              text: "你连夜把汇报材料重做了一遍，封面只留你的名字。汇报会上，你侃侃而谈，光环全打在你身上——搭档坐在台下，脸色一点点沉下去。",
              choices: [
                { label: "一不做二不休，顺势把搭档边缘化", effect: (s) => {
                    add(s, "reputation", 6); add(s, "network", -8); add(s, "charm", 2); bumpMomentum(s, 8);
                    if (s.job) s.job._raise = (s.job._raise || 0) + 0.18;
                    return dstChoose(s, "dst_corp_2", "corp_steal",
                      "你一战成名，老板记住了你，升迁的快车道朝你敞开。代价是：那个搭档从此见你绕道，圈子里也开始有了关于你的另一种说法。");
                  } },
                { label: "见好就收，私下补偿搭档一个人情", effect: (s) => {
                    add(s, "reputation", 4); add(s, "network", 2); add(s, "strategy", 2); bumpMomentum(s, 5);
                    if (s.job) s.job._raise = (s.job._raise || 0) + 0.12;
                    return dstChoose(s, "dst_corp_2", "corp_steal",
                      "风头你占了，事后又给搭档补了台。功劳吃到嘴，关系也没彻底撕破——这点分寸，是你在职场学到的第一课。");
                  } }
              ]
            }) },
          { label: "靠真本事:把成果做到无可挑剔，让结果说话", effect: (s) => {
              const win = rnd(0.5 + corpPower(s) / 400 + luckBias(s));
              add(s, "knowledge", 3); add(s, "reputation", win ? 7 : 3); add(s, "network", 4);
              if (win && s.job) s.job._raise = (s.job._raise || 0) + 0.16;
              bumpMomentum(s, win ? 8 : 3);
              return dstChoose(s, "dst_corp_2", "corp_byskill",
                win ? "你不争不抢，只把活干到极致。成果硬得没人能挑刺，老板那句「这小子有点东西」，比抢来的功劳金贵十倍。"
                    : "你把活干得漂亮，可惜汇报会上风头被人盖了过去。你有点不甘，但你信：本事在身上，机会还会再来。");
            } },
          { label: "让功保和气:把功劳让给能提携你的人", effect: (s) => {
              add(s, "network", 9); add(s, "reputation", 2); add(s, "strategy", 2);
              return dstChoose(s, "dst_corp_2", "corp_yield",
                "你把最亮的那份功劳，轻轻推给了上头那位。他记住了你的「懂事」。眼前你没出风头，可你押的是更长的局——朝里有人好做官。");
            } }
        ]
      },

      /* ========== 第3幕 折·三十的墙（33岁）：空降领导 ========== */
      {
        id: "dst_corp_3", at: { minAge: 33 },
        title: "🧱 三十三岁，头顶空降了一座山",
        text: (s) => {
          const steal = dstPick(s, "dst_corp_2") === "corp_steal";
          return "本该轮到你升的位子，空降了一个关系户。他不懂业务，却处处对你指手画脚，还隐隐要把你的功劳和团队收编。"
            + (steal ? "更要命的是，当年被你抢过功的人，如今就在他身边吹风。" : "")
            + "三十岁出头的你，第一次撞上职场那堵又厚又硬的墙。怎么破？";
        },
        dynamicChoices: (s) => ([
          { label: "硬刚业务：用实打实的成绩让他无话可说", effect: (s) => {
              const win = rnd(0.42 + corpPower(s) / 420);
              add(s, "stress", 12); add(s, "knowledge", 4); add(s, "reputation", win ? 8 : -2);
              if (win) { if (s.job) s.job._raise = (s.job._raise || 0) + 0.2; bumpMomentum(s, 10); }
              else { add(s, "mood", -8); bumpMomentum(s, -6); }
              return dstChoose(s, "dst_corp_3", "corp_hardline",
                win ? "你把业务数据甩到会上，一项项碾过去。空降领导被你逼得节节后退，连他的后台都开始重新掂量你的分量。硬，但你赢得堂堂正正。"
                    : "你硬刚了，可惜胳膊拧不过大腿。一纸调令，你被晾到了边缘岗位。你咬碎了牙——但那股不服输的劲，还在。");
            } },
          { label: "攀附站队：放下身段，主动靠过去", effect: (s) => {
              add(s, "network", 10); add(s, "reputation", -3); add(s, "mood", -4); add(s, "charm", 2);
              if (s.job) s.job._raise = (s.job._raise || 0) + 0.15; bumpMomentum(s, 6);
              return dstChoose(s, "dst_corp_3", "corp_faction",
                "你递了烟、陪了酒、把姿态放到最低。他很受用，把你划进了自己人。升迁的路重新通了——只是你照镜子时，认出了一点当年自己最看不起的影子。");
            } },
          { label: "暗中较劲：表面恭顺，私下攒筹码等他翻车", effect: (s) => {
              add(s, "strategy", 5); add(s, "insight", 3); add(s, "stress", 6);
              return dstChoose(s, "dst_corp_3", "corp_bide",
                "你笑脸相迎，背地里把他的纰漏一桩桩记下，把人脉一点点续上。你不急——你赌的是：这种人，迟早自己把自己绊倒。");
            } }
        ])
      },

      /* ========== 第4幕 危·中年优化（41岁）：优化 + 创业诱惑 ========== */
      {
        id: "dst_corp_4", at: { minAge: 41 },
        title: "🪓 四十一岁，名单上有你的名字",
        text: (s) => {
          const bide = dstPick(s, "dst_corp_3") === "corp_bide";
          return (bide ? "你蛰伏多年等的那天到了——那个空降领导果然翻了车。可公司这轮优化的名单上，居然也有你。"
                       : "公司一轮「组织优化」砸下来，HR 约你喝咖啡。四十出头、薪水不低、上面还有一层够不到的天花板——你正是被优化的「标准画像」。")
            + "屋漏偏逢，一个老同事来拉你合伙创业，说外面遍地是黄金。守住打工这条路，还是就此调头？这是你和老祖宗那句话，最较劲的一刻。";
        },
        choices: [
          { label: "守住初心:绝不认命,我偏要在打工这条路上封顶", next: (s) => ({
              text: "你婉拒了创业的邀约，转头把全部筹码押回职场：你要证明的就是「打工能出头」，半途改道算什么本事。你主动请缨去啃最硬的骨头业务，向管理层立下军令状。",
              choices: [
                { label: "立军令状:接最难的盘子,赌一把管理层的信任", effect: (s) => {
                    const win = rnd(0.45 + corpPower(s) / 380 + luckBias(s));
                    add(s, "stress", 14); add(s, "health", -5);
                    if (win) { if (s.job) s.job._raise = (s.job._raise || 0) + 0.28; add(s, "reputation", 10); bumpMomentum(s, 12); flag(s, "corp_warlord"); }
                    else { add(s, "mood", -10); add(s, "reputation", -4); bumpMomentum(s, -8); }
                    return dstChoose(s, "dst_corp_4", "corp_stay",
                      win ? "你把那摊烂账盘活了。管理层对你刮目相看，优化名单上你的名字被划掉，还多了一行「重点培养」。你用结果，把「打工没前途」四个字摁在了地上。"
                          : "你拼尽全力，盘子还是没救活。这一仗你输了，却赢得了一身敢打硬仗的名声——上头记下了你这股不要命的劲。");
                  } },
                { label: "稳一手:接个有把握的活,先把饭碗焊死", effect: (s) => {
                    add(s, "reputation", 4); add(s, "stress", 4); if (s.job) s.job._raise = (s.job._raise || 0) + 0.12;
                    return dstChoose(s, "dst_corp_4", "corp_stay",
                      "你没逞英雄，挑了个十拿九稳的活漂亮地交了差。优化名单上划掉了你的名字。爬得慢点没关系，路还长，命还在。");
                  } }
              ]
            }) },
          { label: "动摇:接受补偿,跟老同事下海闯一把", effect: (s) => {
              add(s, "cash", 120000); flag(s, "corp_defected");
              add(s, "mood", 4); add(s, "stress", 8); bumpMomentum(s, 4);
              return dstChoose(s, "dst_corp_4", "corp_quit",
                "你签了那纸协议，拿了 N+1，转身跟老同事扎进了创业的浑水。打工封顶的念想，你暂时放下了——有些路，不撞南墙不死心。");
            } },
          { label: "骑驴找马:不撕破脸,边干边骑墙观望", effect: (s) => {
              add(s, "strategy", 3); add(s, "network", 5); add(s, "stress", 6);
              return dstChoose(s, "dst_corp_4", "corp_hedge",
                "你哪边都没把话说死。一边稳着饭碗，一边偷偷投简历、攒人脉。中年人的体面，是给自己多留一条退路。");
            } }
        ]
      },

      /* ========== 第5幕 巅·叩关高管（51岁）：最后一搏 ========== */
      {
        id: "dst_corp_5", at: { minAge: 51 },
        title: "👔 五十一岁，最后一道窄门",
        text: (s) => {
          if (has(s, "corp_defected")) {
            return "下海这些年，跌跌撞撞。如今一家老东家级别的大公司向你抛来高管 offer——绕了一大圈，你又站回了打工的赛道，只是这次，是冲着最高那张椅子来的。";
          }
          return "熬了三十多年，那扇通往核心管理层（C 级 / 合伙人）的窄门，终于在你面前露出一条缝。竞争者个个来头不小。这是你这辈子，离「打工封顶」最近的一次，也可能是最后一次。";
        },
        dynamicChoices: (s) => {
          const warlord = has(s, "corp_warlord");
          const honest = has(s, "dst_pick_corp_byskill") || has(s, "dst_pick_corp_hardline");
          return [
            { label: "凭硬实力叩关:把一生的战绩摆上台面", effect: (s) => {
                let p = 0.3 + corpPower(s) / 360 + (warlord ? 0.12 : 0) + (honest ? 0.06 : 0) + luckBias(s);
                const win = rnd(Math.min(0.9, p));
                add(s, "stress", 12);
                if (win) {
                  if (s.job) { s.job.id = "exec"; s.job.level = Math.max(3, s.job.level || 0); s.job._raise = (s.job._raise || 0) + 0.6; }
                  flag(s, "corp_capped"); add(s, "reputation", 14); add(s, "mood", 16); bumpMomentum(s, 16);
                  return dstChoose(s, "dst_corp_5", "corp_win",
                    "董事会的门在你身后合上时，你成了里面的人。打工封顶——你真的做到了。太爷爷那句话，你用三十年，亲手推翻了。");
                }
                add(s, "mood", -14); add(s, "reputation", 2); bumpMomentum(s, -8);
                return dstChoose(s, "dst_corp_5", "corp_near",
                  "最后一轮，你惜败给了一个更有「背景」的对手。窄门在你眼前关上。你离封顶只差一步——这一步，隔着你一辈子都没能拥有的东西。");
              } },
            { label: "动用毕生人脉:把所有人情一次性押上", effect: (s) => {
                let p = 0.3 + (s.network || 0) / 120 + corpPower(s) / 500;
                if (has(s, "dst_pick_corp_faction")) p += 0.1;
                const win = rnd(Math.min(0.9, p));
                add(s, "network", -20); add(s, "stress", 8);
                if (win) {
                  if (s.job) { s.job.id = "exec"; s.job.level = Math.max(3, s.job.level || 0); s.job._raise = (s.job._raise || 0) + 0.5; }
                  flag(s, "corp_capped"); add(s, "mood", 12); bumpMomentum(s, 12);
                  return dstChoose(s, "dst_corp_5", "corp_win",
                    "你把攒了半辈子的人情一次性兑了现。关键的几票，倒向了你。你坐上了那个位子——只是你心里清楚，这把椅子有几分是本事，几分是人情。");
                }
                add(s, "mood", -10); bumpMomentum(s, -6);
                return dstChoose(s, "dst_corp_5", "corp_near",
                  "人情用尽，票数还是差了那么几张。你输了，还欠下一身还不清的人情债。原来到了这个层级，光有人脉也不够。");
              } },
            { label: "急流勇退:不争了,体面地交棒退场", effect: (s) => {
                add(s, "mood", 10); add(s, "health", 6); add(s, "reputation", 6); add(s, "stress", -12);
                return dstChoose(s, "dst_corp_5", "corp_retire",
                  "你笑着退出了这场角逐。爬到这儿，已经超过当年那个挤地铁的新人太多。有些顶，登不上不丢人——把自己活成体面的样子，也是一种封顶。");
              } }
          ];
        }
      }

    ]);

})();
