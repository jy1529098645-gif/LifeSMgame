"use strict";
/* =====================================================================
 * content/destiny-official.js —— 命运线【步步高升 official】
 * 母题：「打工是不可能打工的」——宇宙的尽头是编制。除了打工创业，
 *       还有第三条出头路：进体制，凭资历、人脉与那一点点分寸，
 *       一步一步把自己熬成「上面有人记得住名字」的那个人。
 * 五幕脊柱（确定性、按阶段推进，前幕选择在后幕/清算回收）：
 *   1 序·赶考     20岁  千军万马过独木桥，立志在体制内出人头地
 *   2 起·初入官场 27岁  刚上岸：第一次站队 / 酒桌 / 被领导赏识的考验
 *   3 折·灰色诱惑 34岁  第一次手握权力：清廉自守 / 同流合污 / 留后路
 *   4 危·巡视组   42岁  巡视进驻 / 匿名举报：壮士断腕 / 硬扛 / 找靠山
 *   5 巅·封疆     52岁  冲击正处副厅的最后关口，读资历人脉与清廉伏笔
 * 配合体制系统：s.civilRank(0→5)、has(s,"civil_servant")、rankUp(s)（if 保护）。
 * 记录抉择用 dstChoose(s, chId, key, note)；回收用 dstPick / has(s,"dst_pick_*")。
 * ===================================================================== */
(function () {

  // —— 综合「仕途资本」：决定关键判定，越高越稳 ——
  function officialPower(s) {
    const st = s.stats || {};
    return (st.strategy || 0) + (st.charm || 0) * 0.9 + (st.insight || 0) * 0.7
         + (s.reputation || 0) * 0.5 + (s.network || 0) * 1.0
         + ((s.civilRank || 0) * 16);
  }

  // —— 安全推进职级（仅在已上岸时） ——
  function tryRankUp(s) {
    if (typeof rankUp === "function" && has(s, "civil_servant")) rankUp(s);
  }

  registerDestiny("official",
    {
      name: "步步高升", motif: "打工是不可能打工的",
      acts: ["序·赶考", "起·初入官场", "折·灰色诱惑", "危·巡视组", "巅·封疆"],
      // —— 母题清算：回收一生的命运抉择 ——
      reckon: function (s) {
        const capped = (s.civilRank || 0) >= 4;                 // 正处及以上
        const climbed = capped || (s.civilRank || 0) >= 3;      // 副处算半登顶
        const clean = has(s, "dst_pick_official_clean") || has(s, "dst_pick_official_clean2");
        const dirty = has(s, "dst_pick_official_dirty") || has(s, "dst_pick_official_hedge");
        const retired = has(s, "dst_pick_official_retire") || has(s, "dst_pick_official_quit");
        if (capped && clean) {
          return "你一路走来，酒陪了、班加了、骨头啃了，可那条线你从没越过。如今坐到正处的位子上回望，"
            + "案头清清白白，身后没有把柄。「打工是不可能打工的」——你没去打工，也没去创业，"
            + "你走的是第三条路：进了编制，还把腰杆挺得笔直地登了顶。出头，也能出得干干净净。";
        }
        if (climbed && dirty) {
          return "你确实爬上去了，副处、正处的台阶你都踩上了。只是那些年收下的、答应过的、捂住的，"
            + "你自己心里有本账。夜深人静批文件时，你偶尔会停笔——这顶乌纱帽，到底有几分是熬出来的，"
            + "几分是换来的。老祖宗那句话你赢了，可你也活成了当年赶考时最看不起的那种人。";
        }
        if (climbed) {
          return "你终究是在体制里熬出了头，做到了多数同期一辈子够不着的级别。"
            + "宇宙的尽头是编制——这话在你这儿，不算戏言。";
        }
        if (retired) {
          return "你没冲到最高那一级，却在该收手时干净利落地收了手。激流勇退，全身而退，"
            + "比起那些倒在最后一关的人，你把后半辈子过成了自己的。"
            + "出头未必非要登顶——平安落地，本身就是一种本事。";
        }
        return "你也曾在赶考的夜里立过志，想在体制里出人头地。可那一级一级的台阶，"
          + "到底比你想的更窄更陡。「打工是不可能打工的」——这第三条路你走了一生，"
          + "没能走到尽头，但你确实，认认真真地走过。";
      }
    },
    [

      /* ========== 第1幕 序·赶考（20岁）：立志 ========== */
      {
        id: "dst_official_1", at: { minAge: 20, stage: ["youth"] },
        title: "📚 千军万马的独木桥，你站上了起跑线",
        text: (s) => byClass(s, {
          poor: "出租屋的台灯熬到后半夜，桌上《行测》《申论》摞得比你高考时还厚。家里没背景、没本钱，太爷爷那句「打工是不可能打工的」在耳边打转——你认死了一条理：考上了，就是改命；进了编制，就是给全家挣回一口气。这张卷子，你输不起。",
          mid: "图书馆占座、刷题群打卡、报班花光了第一份工资。爸妈说「考个公多稳当」，你心里却不只是图个稳——太爷爷总念叨「打工是不可能打工的」，你想要的是另一种出头：在体制这条赛道上，凭本事一级一级往上走，走到别人仰望的位置。",
          rich: "家里本能托关系给你寻个轻省去处，你却偏要自己下场考。「打工是不可能打工的」这话你听了一辈子，你想证明的是：哪怕不靠家里，光凭一身真本事考进去、熬上来，我也能在体制里站到高处——这趟镀金，得是真金。"
        }),
        choices: [
          { label: "一鸣惊人:目标直指好单位,非热门岗不报", effect: (s) => {
              add(s, "strategy", 3); add(s, "stress", 6); add(s, "reputation", 2);
              return dstChoose(s, "dst_official_1", "official_ambitious",
                "你把志愿填得野心勃勃：要进就进有前途的好单位，要考就考竞争最狠的岗。起点，决定你将来能爬多高。");
            } },
          { label: "求稳上岸:先有编制再图发展,哪个稳报哪个", effect: (s) => {
              add(s, "insight", 3); add(s, "strategy", 2); add(s, "stress", -2);
              return dstChoose(s, "dst_official_1", "official_steady",
                "你想得明白：先上岸，再说别的。哪个岗位竞争小、能稳稳考进去，你就报哪个。进了门，才有往上走的资格。");
            } },
          { label: "苦读硬考:不抱侥幸,就拿一身真本事砸进去", effect: (s) => {
              add(s, "insight", 4); add(s, "reputation", 2); add(s, "stress", 3);
              return dstChoose(s, "dst_official_1", "official_grind",
                "你信的是笨办法：别人刷一套题你刷三套，别人背一遍你背十遍。没有捷径，你就把分数堆到没人能比，让那张录取通知，是凭真才实学换来的。");
            } }
        ]
      },

      /* ========== 第2幕 起·初入官场（27岁）：站队/酒桌/赏识 ========== */
      {
        id: "dst_official_2", at: { minAge: 27 },
        title: "🍶 上岸了，可真正的考试现在才开始",
        text: (s) => {
          const ambitious = dstPick(s, "dst_official_1") === "official_ambitious";
          return (ambitious
            ? "你如愿进了好单位，可越是好地方，水越深。"
            : "新单位报到，茶水间的客气底下，藏着你一时看不懂的暗流。")
            + "科里隐隐分着两派，老科长和副职面和心不和；眼看年底有个借调机会，谁能上去，全看上头怎么点头。第一次饭局，酒杯递到你面前——这第一步，怎么迈？";
        },
        choices: [
          { label: "押宝站队:认准一位领导,把姿态摆明", next: (s) => ({
              text: "你看准了科里最有前途的那位领导，主动往他那边靠：他交代的活你抢着干，他的饭局你场场到，他随口一句话你记一整本。慢慢地，他开始把你当「自己人」。",
              choices: [
                { label: "一条道走到黑,彻底绑定他的派系", effect: (s) => {
                    add(s, "network", 10); add(s, "reputation", -2); add(s, "charm", 2); bumpMomentum(s, 8);
                    tryRankUp(s);
                    return dstChoose(s, "dst_official_2", "official_faction",
                      "你成了他班底里的铁杆。借调名额他点了你，往上走的快车道朝你敞开。代价是：你这条船一旦认定，就再难回头——他沉，你也沉。");
                  } },
                { label: "靠是靠,但留一手,不把所有筹码押死", effect: (s) => {
                    add(s, "network", 6); add(s, "strategy", 3); add(s, "insight", 2); bumpMomentum(s, 5);
                    tryRankUp(s);
                    return dstChoose(s, "dst_official_2", "official_faction",
                      "你靠了过去，又没把另一边的关系彻底断掉。领导赏识你，对家也挑不出你的错。这点分寸，是你在官场学到的第一课：站队，但别站死。");
                  } }
              ]
            }) },
          { label: "靠业务:不站队,把材料和活干到无人能替", effect: (s) => {
              const win = rnd(0.5 + officialPower(s) / 320 + luckBias(s));
              add(s, "insight", 3); add(s, "reputation", win ? 7 : 3); add(s, "stress", 4);
              if (win) { bumpMomentum(s, 8); tryRankUp(s); }
              else bumpMomentum(s, 3);
              return dstChoose(s, "dst_official_2", "official_byskill",
                win ? "你不掺和派系，只把手里的材料、数据、活计干到滴水不漏。一份漂亮的报告递到一把手案头，「这小同志能写也能干」——这句话，比陪十场酒都管用。"
                    : "你埋头干活，无奈领导的眼睛先落在了会来事的人身上。你有点不甘，但你认这个理：本事在身上，机会迟早绕回来。");
            } },
          { label: "明哲保身:谁也不得罪,滴酒不沾守本分", effect: (s) => {
              add(s, "insight", 3); add(s, "mood", 2); add(s, "stress", -3); add(s, "network", -2);
              return dstChoose(s, "dst_official_2", "official_neutral",
                "饭局上你以「身体抱恙」推了酒，两派的事你一概装不懂。你图个清静、不蹚浑水——可你也清楚，不站队的人，往往是最先被两边都遗忘的那个。");
            } }
        ]
      },

      /* ========== 第3幕 折·灰色诱惑（34岁）：第一次手握权力 ========== */
      {
        id: "dst_official_3", at: { minAge: 34 },
        title: "💰 三十四岁，第一次，你手里有了「能办事」的权",
        text: (s) => {
          const faction = dstPick(s, "dst_official_2") === "official_faction";
          return "你终于熬到一个有实权的位子：一支笔签下去，能决定不少人的事。第一个来「表示表示」的，是个老熟人，话说得滴水不漏，礼也送得让人挑不出错。"
            + (faction ? "你那位领导也悄悄递了话:「年轻人,该懂事的时候要懂事。」" : "")
            + "权力的甜头第一次贴到嘴边——这道坎，怎么过？";
        },
        dynamicChoices: (s) => ([
          { label: "清廉自守:东西原样退回,把规矩立死", next: (s) => ({
              text: "你把礼一分不少地退了回去，话说得客气却没有余地。对方讪讪走了，圈子里很快传开：这人「不上道」。有人敬你，也有人开始有意无意地把你晾在一边。",
              choices: [
                { label: "认了:宁可慢点升,也不留这种把柄", effect: (s) => {
                    add(s, "reputation", 8); add(s, "mood", 4); add(s, "stress", 4); add(s, "network", -4);
                    return dstChoose(s, "dst_official_3", "official_clean",
                      "你给自己定了死规矩:这条线，一步都不越。升得慢就慢点，至少这顶帽子戴得安稳，半夜不会被敲门。清白，是你留给自己的退路。");
                  } },
                { label: "退礼但不得罪人,用规矩里的人情周旋", effect: (s) => {
                    add(s, "reputation", 6); add(s, "charm", 2); add(s, "strategy", 3); add(s, "network", 2);
                    return dstChoose(s, "dst_official_3", "official_clean",
                      "你退了礼，却把人情用别的、合规的方式还了回去:帮着指条明路、引荐个正经渠道。既守住了底线，又没把人逼到对立面。干净，但不傻。");
                  } }
              ]
            }) },
          { label: "同流合污:笑纳了,从此学着「办事」", next: (s) => ({
              text: "你收下了那份「心意」。事，你照规矩办得漂漂亮亮，没人能说出错。可从这一笔起，你算是入了局——后面来的人越来越多，递过来的东西也越来越重。",
              choices: [
                { label: "收得隐蔽,层层包装,只走信得过的人", effect: (s) => {
                    add(s, "cash", 80000); add(s, "network", 8); add(s, "strategy", 3); add(s, "stress", 8);
                    flag(s, "official_has_dirt"); bumpMomentum(s, 6); tryRankUp(s);
                    return dstChoose(s, "dst_official_3", "official_dirty",
                      "你学精了:东西只过最信得过的中间人，账面干干净净。日子宽裕了，路子也活了——只是从今往后，你的口袋里多了一样东西，叫做「软肋」。");
                  } },
                { label: "来者不拒,胃口越来越大", effect: (s) => {
                    add(s, "cash", 180000); add(s, "network", 6); add(s, "stress", 14); add(s, "reputation", -4);
                    flag(s, "official_has_dirt"); flag(s, "official_greedy"); bumpMomentum(s, 4); tryRankUp(s);
                    return dstChoose(s, "dst_official_3", "official_dirty",
                      "尝过甜头，胆子就一点点大了起来。来的你几乎都接，数目越来越扎眼。你升得是快了，可那个雪球，也越滚越大——大到你自己都有点不敢回头看。");
                  } }
              ]
            }) },
          { label: "留后路:自己不沾,却替别人捏着把柄", effect: (s) => {
              add(s, "strategy", 5); add(s, "insight", 3); add(s, "stress", 6); add(s, "network", 4);
              flag(s, "official_holds_cards");
              return dstChoose(s, "dst_official_3", "official_hedge",
                "你自己一分不收，却把别人怎么收的、收了谁的，悄悄记了个明白。你赌的是:真到了要命的那天，这些底牌，能换你一条活路。聪明，但这本账，迟早是双刃的。");
            } }
        ])
      },

      /* ========== 第4幕 危·巡视组（42岁）：进驻/举报/站错队 ========== */
      {
        id: "dst_official_4", at: { minAge: 42 },
        title: "🔍 四十二岁，巡视组进驻了，有人递了你的名字",
        text: (s) => {
          const dirty = has(s, "official_has_dirt");
          const faction = dstPick(s, "dst_official_2") === "official_faction";
          return "上级巡视组进驻，封闭办公、逐人谈话，整栋楼的气氛绷得能拧出水。一封匿名举报信，点了你的名。"
            + (dirty ? "你心里咯噔一下——这些年那些「往来」，最怕的就是这一天。" : "你自问没什么硬伤，可这种事，从来不是清白就能高枕无忧的。")
            + (faction ? "更糟的是,你当年押的那位领导,如今正是风暴中心。" : "")
            + "这一关，是你仕途上最凶险的一道。怎么应对？";
        },
        choices: [
          { label: "壮士断腕:主动说清,该切割的切割干净", next: (s) => ({
              text: "你没有等他们来找你。你主动把能交代的都交代清楚，把该撇清的关系一刀两断——包括当年那条曾经最稳的船。有人骂你不仗义，可你知道，这种时候，干净比什么都重要。",
              choices: [
                { label: "全盘配合,把自己摘得一干二净", effect: (s) => {
                    const dirty = has(s, "official_has_dirt");
                    const win = rnd((dirty ? 0.45 : 0.75) + officialPower(s) / 500 + luckBias(s));
                    add(s, "stress", 12); add(s, "network", -10);
                    if (win) { add(s, "reputation", 8); add(s, "mood", 4); bumpMomentum(s, 8); }
                    else { add(s, "reputation", -6); add(s, "mood", -12); bumpMomentum(s, -10); }
                    return dstChoose(s, "dst_official_4", "official_cut",
                      win ? "你切得果断、说得清楚，巡视组那边查无实据，反倒觉得你「态度端正、立场坚定」。这一劫，你险险闯了过去，还赚回一句正面评价。"
                          : "你切割得太急，反而落了个「自己心里有鬼」的口实。虽没被一锤定音，但那行记录，从此压在你的档案里，像块去不掉的阴影。");
                  } },
                { label: "切割之余,顺势把脏水泼向对家", effect: (s) => {
                    add(s, "strategy", 4); add(s, "network", -6); add(s, "reputation", -3); add(s, "stress", 10);
                    flag(s, "official_burned_bridge"); bumpMomentum(s, 4);
                    return dstChoose(s, "dst_official_4", "official_cut",
                      "你不光摘清自己，还把火引向了对家。你保住了眼前，可这一手太狠——经此一役，整个圈子都记住了:这人,关键时刻是会反咬的。往后,没人敢真把你当自己人。");
                  } }
              ]
            }) },
          { label: "硬扛:咬死没问题,绝不松一句口", effect: (s) => {
              const dirty = has(s, "official_has_dirt");
              const cards = has(s, "official_holds_cards");
              let p = (dirty ? 0.35 : 0.7) + officialPower(s) / 480 + (cards ? 0.1 : 0) + luckBias(s);
              const win = rnd(p);
              add(s, "stress", 16); add(s, "health", -4);
              if (win) { add(s, "reputation", 6); bumpMomentum(s, 6); }
              else {
                add(s, "reputation", -12); add(s, "mood", -16); bumpMomentum(s, -14);
                if (s.civilRank && s.civilRank > 0) s.civilRank -= 1;     // 站错/扛不住,降级
              }
              return dstChoose(s, "dst_official_4", "official_standfirm",
                win ? "你一口咬定清清白白,问什么答什么,滴水不漏。查到最后,他们也没能拿你怎么样。这一仗你硬扛了下来,在某些人眼里,你这份「沉得住气」反倒成了本事。"
                    : "你硬扛到底,可纸里包不住火。一纸处分下来,你被挪了位子、降了使用。多年攒下的台阶,一夜回退。原来在这道关口,硬,不一定扛得住。");
            } },
          { label: "找靠山:连夜上下打点,求人按住此事", effect: (s) => {
              const win = rnd(0.4 + (s.network || 0) / 110 + officialPower(s) / 520);
              add(s, "network", -16); add(s, "cash", -50000); add(s, "stress", 12);
              if (win) { add(s, "mood", 6); bumpMomentum(s, 4); flag(s, "official_owes_favor"); }
              else { add(s, "reputation", -8); add(s, "mood", -10); bumpMomentum(s, -8); }
              return dstChoose(s, "dst_official_4", "official_patron",
                win ? "你把半辈子的人情和家底一次性押了上去,几通电话、几顿深夜的茶,事情终于被「按」了下去。你松了口气——可你也清楚,这份人情,迟早是要连本带利还的。"
                    : "你四处求人,可这次,平时熟络的几扇门都没给你开。靠山没找着,反倒把底牌露了出去。你这才明白:真到了要命的时候,能靠的,从来只有自己。");
            } }
        ]
      },

      /* ========== 第5幕 巅·封疆（52岁）：冲击正处/副厅 ========== */
      {
        id: "dst_official_5", at: { minAge: 52 },
        title: "🏛️ 五十二岁，通往正处的最后一道窄门",
        text: (s) => {
          const clean = has(s, "dst_pick_official_clean");
          const dirty = has(s, "official_has_dirt");
          if (dirty) {
            return "三十年熬到这一步,正处(乃至副厅)的位子,终于在你面前露出一条缝。可你比谁都清楚,你身后那些没清干净的旧账,在这个级别,任何一桩翻出来都是灭顶之灾。这是离顶最近的一次,也可能是最危险的一次。";
          }
          return "三十年风风雨雨,通往正处、副厅的那道窄门,终于在你面前露出一条缝。竞争者个个资历深厚、来头不小。"
            + (clean ? "你这一路虽走得清苦,可档案干净得能照见人——这一回,清白成了你最硬的底牌。" : "")
            + "这是你这辈子,离「步步高升」的尽头最近的一次。";
        },
        dynamicChoices: (s) => {
          const clean = has(s, "dst_pick_official_clean") || has(s, "dst_pick_official_clean2");
          const dirty = has(s, "official_has_dirt");
          const cards = has(s, "official_holds_cards");
          return [
            { label: "凭资历政绩叩关:把一生的考核摆上台面", effect: (s) => {
                let p = 0.4 + officialPower(s) / 360 + (clean ? 0.12 : 0) - (dirty ? 0.1 : 0) + luckBias(s);
                const win = rnd(p);
                add(s, "stress", 12);
                if (win) {
                  tryRankUp(s);
                  if (typeof rankUp === "function" && has(s, "civil_servant")) tryRankUp(s); // 冲刺连推
                  flag(s, "official_capped"); add(s, "reputation", 14); add(s, "mood", 16); bumpMomentum(s, 16);
                  return dstChoose(s, "dst_official_5", "official_win",
                    "组织谈话的门在你身后合上时,你的新任命已经定了。正处——你真的熬到了。「打工是不可能打工的」,你没去打工,也没去创业,你在体制这条路上,一级一级,亲手登上了顶。");
                }
                add(s, "mood", -14); add(s, "reputation", 2); bumpMomentum(s, -8);
                return dstChoose(s, "dst_official_5", "official_near",
                  "最后一轮考察,你惜败给了一个资历相仿却「上面更有人」的对手。窄门在你眼前关上。你离封顶只差半级——这半级,隔着你一辈子都没攀上的那层关系。");
              } },
            { label: "动用毕生人脉:把所有关系一次性押上", effect: (s) => {
                let p = 0.38 + (s.network || 0) / 110 + officialPower(s) / 500;
                if (has(s, "dst_pick_official_faction")) p += 0.1;
                if (cards) p += 0.08;            // 手里有把柄,关键时刻好说话
                if (dirty) p -= 0.06;
                const win = rnd(p);
                add(s, "network", -22); add(s, "stress", 10);
                if (win) {
                  tryRankUp(s);
                  flag(s, "official_capped"); add(s, "mood", 12); bumpMomentum(s, 12);
                  return dstChoose(s, "dst_official_5", "official_win",
                    "你把攒了半辈子的人脉一次性兑了现,几个关键的人在关键的会上替你说了关键的话。你坐上了那个位子——只是夜里你也会问自己:这把椅子,几分是熬出来的,几分是换来的。");
                }
                add(s, "mood", -10); bumpMomentum(s, -6);
                return dstChoose(s, "dst_official_5", "official_near",
                  "人脉用尽,临门一脚还是差了那么一点。你输了,还欠下一身还不清的人情。原来到了这个级别,光有关系,也托不起最后那一级台阶。");
              } },
            { label: "激流勇退:不争了,趁清白体面地退场", effect: (s) => {
                add(s, "mood", 12); add(s, "health", 8); add(s, "reputation", 6); add(s, "stress", -14);
                flag(s, "official_retired_clean");
                return dstChoose(s, "dst_official_5", "official_retire",
                  "你笑着把名字从竞争名单上划掉,选了个清闲岗位等退休。爬到这儿,已经远远超过当年那个挑灯赶考的年轻人。有些顶,够不着不丢人——能在风浪里全身而退、平安落地,本身就是一种登顶。");
              } }
          ];
        }
      }

    ]);

})();
