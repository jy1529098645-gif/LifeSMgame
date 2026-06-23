"use strict";
/* =====================================================================
 * content/destiny-family.js —— 命运线【儿孙满堂 family】
 * 母题：太爷爷说「打工是不可能打工的」。你信的却是另一半——
 *       事业是一时的，热腾腾的一家人才是一辈子的。你这辈子最想攒下的，
 *       不是头衔和存款，是一张坐满了人、永远留着你那副碗筷的饭桌。
 * 五幕脊柱（确定性、按阶段推进，前幕选择在后幕/清算回收）：
 *   1 序·渴望     20岁  心里种下「我想要一个属于自己的家」
 *   2 起·相守     28岁  遇到想共度一生的人，走不走进承诺
 *   3 折·夹缝     36岁  上有老下有小，事业与家庭抢时间（两层分支）
 *   4 危·聚散     46岁  一场家庭风暴：叛逆/婚变/至亲病倒（两层分支）
 *   5 巅·儿孙绕膝 60岁  晚年盘点这个家，成败读经营伏笔 + 状态
 * 记录抉择用 dstChoose(s, chId, key, note)；回收用 dstPick / has(s,"dst_pick_*")。
 * 配合已有婚育系统：has(s,"married")/has(s,"has_kid")/s.children；
 * 仅在抉择处用 if 判断后再 flag，避免与已有系统冲突。
 * ===================================================================== */
(function () {

  // —— 综合「经营家的底气」：决定关键判定，越高越稳 ——
  // 亲和与共情（charm/insight）、身体本钱（health）、心境（mood）共同托底
  function familyWarmth(s) {
    const st = s.stats || {};
    return (st.charm || 0) + (st.insight || 0) * 0.8
         + (s.health || 0) * 0.4 + (s.mood || 0) * 0.3
         + (has(s, "dst_pick_family_homefirst") ? 18 : 0)
         + (has(s, "dst_pick_family_balance") ? 12 : 0);
  }

  registerDestiny("family",
    {
      name: "儿孙满堂", motif: "打工是不可能打工的",
      acts: ["序·渴望", "起·相守", "折·夹缝", "危·聚散", "巅·儿孙绕膝"],
      // —— 母题清算：回收一生「经营这个家」的抉择 ——
      reckon: function (s) {
        const hasKid = has(s, "has_kid") || ((s.children || []).length > 0);
        const old = s.age >= 60;
        const warm = (s.mood || 0) >= 50 || (s.health || 0) >= 60;
        const nourished = has(s, "dst_pick_family_homefirst") || has(s, "dst_pick_family_balance")
                       || has(s, "dst_pick_family_hold") || has(s, "dst_pick_family_mend");
        const neglected = has(s, "dst_pick_family_career") || has(s, "dst_pick_family_letgo");
        // 圆满：有娃 + 晚年还暖 + 一生用心经营
        if (hasKid && old && warm && nourished) {
          return "晚年的饭桌总是坐得满满当当，孩子的孩子爬上你的膝头，喊你的那一声，比任何头衔都金贵。"
            + "太爷爷那句「打工是不可能打工的」，你大半辈子都没顾上去较真——你忙着把一家人焐热，"
            + "如今回头看，事业果然是一时的，可这屋子里的烟火气、这满堂的儿孙，是你用一辈子换来的一辈子。";
        }
        // 子欲养而亲不待：有娃，却晚景凄凉 / 没用心
        if (hasKid && neglected) {
          return "你也算儿女绕膝，可那些年你把心思全押在了外头，错过的饭桌、缺席的生日，都成了拔不掉的刺。"
            + "如今孩子们各有各的忙，回来得越来越少。你这才懂太爷爷那半句话之外的意思——"
            + "家不是放在那儿就会热的，是要日日去焐的。你焐晚了。";
        }
        // 为事业失了家的孤独
        if (!hasKid && neglected) {
          return "你这辈子把劲都使在了事业上，等想起要一个家时，身边已没了等你回家的人。"
            + "夜深时偌大的房子静得发慌。你赢过很多东西，唯独没赢下太爷爷那句话之外、你年轻时真正想要的那个——"
            + "一张坐满了人的饭桌。";
        }
        // 一个人的晚年（无娃但坦然 / 或选择了别样的家）
        if (!hasKid && old) {
          return "你没能凑齐世人眼里「儿孙满堂」的圆满，可你这一生爱过、守护过、被人惦记过。"
            + "或许是丁克的相依，或许是领养来的牵挂，或许是兄弟姐妹与老友撑起的另一种「家」——"
            + "家从来不止一种长法。这一程，你没辜负把你放在心上的人，也就够了。";
        }
        // 故事未走完便落幕
        return "你心里一直种着那个「热腾腾的一家人」的念想，只是日子太快，还没来得及把它焐成晚年的模样。"
          + "你试过去爱、去守一个家——这份心意，本身就重过千金。";
      }
    },
    [

      /* ========== 第1幕 序·渴望（20岁）：种下念头 ========== */
      {
        id: "dst_family_1", at: { minAge: 20, stage: ["youth"] },
        title: "🏠 二十岁的夜里，你忽然想要一个家",
        text: (s) => byClass(s, {
          poor: "出租屋的灯泡昏黄，泡面的热气糊在窗上。你刷到别人一家三口的视频，鼻子忽然有点酸。太爷爷那句「打工是不可能打工的」你听腻了——你想的是另一件事：等有一天，我也能有一张坐满人的饭桌，热气腾腾，再不必一个人吃饭。可你又怕：自己这点本事，给得了谁好生活？",
          mid: "家里又在催了，电话那头絮絮叨叨。挂了电话你却没烦，反而对着空荡荡的房间发起呆。你不在乎太爷爷说的什么打工出不出头——你心里真正想要的，是一个属于自己的家：有人等你回来，有孩子的吵闹，有一桌永远留着你那副碗筷的晚饭。",
          rich: "家境优渥，从不缺人凑趣，可热闹散去总是格外冷清。你看着父母面和心不和的样子，反倒更渴望一个真正暖的家。太爷爷那句话于你早不是问题——你怕的是另一样：将来牵手的那个人，到底图的是你，还是你身后的这些。"
        }),
        choices: [
          { label: "义无反顾：早早就把「成家」放进人生第一位", effect: (s) => {
              add(s, "charm", 2); add(s, "mood", 4); add(s, "insight", 2);
              return dstChoose(s, "dst_family_1", "family_yearn",
                "你给自己定了调：旁人追名逐利，你认准的是一个家。这份渴望像颗种子，从此埋进了你往后所有的选择里。");
            } },
          { label: "先立业后成家：得有底气，才敢谈给人幸福", effect: (s) => {
              add(s, "strategy", 3); add(s, "knowledge", 2); add(s, "stress", 3);
              return dstChoose(s, "dst_family_1", "family_ready",
                "你把渴望按下了一头：空有一腔热血给不了人安稳。你想先攒够底气，再去敲那扇家的门——只盼别等得太久。");
            } },
          { label: "怕给不了好生活：把这念头悄悄藏了起来", effect: (s) => {
              add(s, "insight", 3); add(s, "mood", -2); add(s, "stress", 2);
              return dstChoose(s, "dst_family_1", "family_fear",
                "你不是不想，是不敢想。怕自己撑不起、怕辜负、怕真心被辜负。那个家的念头，被你小心折好，压在了心底最深处。");
            } }
        ]
      },

      /* ========== 第2幕 起·相守（28岁）：走进承诺 ========== */
      {
        id: "dst_family_2", at: { minAge: 28 },
        title: "💞 你遇到了那个想共度一生的人",
        text: (s) => {
          const fear = dstPick(s, "dst_family_1") === "family_fear";
          const already = has(s, "married");
          return (already
            ? "你们早已牵了手，可「要不要把这份关系焐成一辈子、要不要真正组建一个家」，这道题今天才正式摆上桌。"
            : "兜兜转转，你终于遇到一个让你想停下来的人——晨昏作息、柴米油盐，你第一次觉得「过一辈子」不是吓人的词。")
            + (fear ? "只是当年你把那个念头藏得太深，临到门前，心里那点「怕」又翻了上来。" : "")
            + "走进承诺，还是退回安全的距离？这一步，你怎么迈？";
        },
        choices: [
          { label: "义无反顾：认定了就携手走进婚姻", next: (s) => ({
              text: "你没给自己留退路，认认真真地把心交了出去。领证那天阳光很好，对方的手有点抖，你忽然觉得，往后所有的难，好像都有人一起扛了。",
              choices: [
                { label: "倾尽所有，办一场郑重的承诺，从此是一家人", effect: (s) => {
                    if (!has(s, "married")) flag(s, "married");
                    add(s, "mood", 12); add(s, "charm", 3); add(s, "stress", 4); bumpMomentum(s, 8);
                    return dstChoose(s, "dst_family_2", "family_commit",
                      "你把心也把日子，都郑重地交付了出去。从此世上多了一个「我们」——你那张梦里的饭桌，终于摆上了第一副多出来的碗筷。");
                  } },
                { label: "简简单单成家，把日子的底气留着慢慢攒", effect: (s) => {
                    if (!has(s, "married")) flag(s, "married");
                    add(s, "mood", 9); add(s, "cash", 0); add(s, "insight", 2); bumpMomentum(s, 6);
                    return dstChoose(s, "dst_family_2", "family_commit",
                      "没有铺张，只有两个人对着一桌家常菜碰了下杯。家不是排场堆出来的——你信的是细水长流，往后的暖，一天一天慢慢添。");
                  } }
              ]
            }) },
          { label: "慎重考验：感情要紧，可也得看清能不能托付一生", effect: (s) => {
              add(s, "insight", 4); add(s, "strategy", 2); add(s, "stress", 3);
              const ok = rnd(0.55 + familyWarmth(s) / 600 + luckBias(s));
              if (ok && !has(s, "married")) flag(s, "married");
              add(s, "mood", ok ? 8 : -4);
              return dstChoose(s, "dst_family_2", "family_test",
                ok ? "你没冲动，给彼此都留了看清对方的时间。磨过几场争执、扛过几次现实，你才点头——这一次，你认的不是一时心动，是经得起日子的人。"
                   : "你太想看清，反把对方看远了。考验来考验去，那个人累了，转身走了。你站在原地才懂：有些感情，经不起反复的称量。");
            } },
          { label: "害怕受伤：临到门前还是退回了安全的距离", effect: (s) => {
              add(s, "insight", 3); add(s, "mood", -6); add(s, "stress", 4);
              return dstChoose(s, "dst_family_2", "family_retreat",
                "你在最后一刻松了手。怕付出、怕辜负、怕哪天又只剩自己——你把那个人推开，缩回了一个人的安稳里。门关上的那声轻响，你记了很久。");
            } }
        ]
      },

      /* ========== 第3幕 折·夹缝（36岁）：中年的时间争夺战（两层分支） ========== */
      {
        id: "dst_family_3", at: { minAge: 36 },
        title: "⏳ 三十六岁，你被夹在了所有人中间",
        text: (s) => {
          const committed = dstPick(s, "dst_family_2") === "family_commit" || has(s, "married");
          const hasKid = has(s, "has_kid") || ((s.children || []).length > 0);
          return (committed
            ? "上有渐渐老去、开始需要陪的父母，"
            : "操心着自己迟迟没安顿下来的终身大事，又被父母的衰老追着跑，")
            + (hasKid ? "下有正缠人、要接送要辅导的孩子，" : "身边人催着要孩子、自己也犹豫着要不要孩子，")
            + "中间还有抢着你每一分钟的事业。夫妻间的磨合也到了七年之痒的关口。你只有一双手、一天二十四小时，到底先抓住哪一头？";
        },
        choices: [
          { label: "以家为重：事业让一步，先把家里的人焐热", next: (s) => ({
              text: "你做了在外人看来「不上进」的决定：推掉了能升职的外派，把更多时间留给了饭桌和病床前。同事不解，你却踏实——你认准了，人这一辈子，陪伴比头衔金贵。",
              choices: [
                { label: "亲力亲为，再忙也守住每天的晚饭和睡前那一刻", effect: (s) => {
                    add(s, "mood", 10); add(s, "charm", 3); add(s, "health", -3); bumpMomentum(s, 4); flag(s, "family_tender");
                    return dstChoose(s, "dst_family_3", "family_homefirst",
                      "你把「家」过成了一种日复一日的坚持：晚饭的灯总为人留着，父母的药记得清清楚楚，孩子的心事你听得见。这些年你升得慢，可家里的暖，是你一手焐出来的。");
                  } },
                { label: "和伴侣分工，把这个家当成两个人的事业一起经营", effect: (s) => {
                    add(s, "mood", 8); add(s, "insight", 3); add(s, "charm", 2); bumpMomentum(s, 5); flag(s, "family_tender");
                    return dstChoose(s, "dst_family_3", "family_homefirst",
                      "你和伴侣坐下来认真盘过这个家：谁管老、谁管小、谁的事业该让谁的。把家当成共同的事业来经营，磕磕绊绊里，你们成了真正的搭档。");
                  } }
              ]
            }) },
          { label: "拼事业：现在不冲就晚了，家人迟早会理解", next: (s) => ({
              text: "你说服自己：趁着年富力强，正是该往上冲的时候，等熬出头了，再好好补偿家里。于是你常常缺席——孩子的家长会、父母的体检、伴侣的纪念日，一次次被工作挤掉。",
              choices: [
                { label: "全力冲刺，告诉自己「等忙过这阵」就回归家庭", effect: (s) => {
                    add(s, "strategy", 4); add(s, "reputation", 6); add(s, "mood", -6); add(s, "stress", 10); add(s, "charm", -2);
                    return dstChoose(s, "dst_family_3", "family_career",
                      "你赢了几场漂亮的硬仗，事业肉眼可见地往上走。代价是家里那张饭桌越来越冷——「等我忙过这阵」成了你最常说、也最常食言的一句话。");
                  } },
                { label: "想补救却力不从心，钱给得越来越多，人回得越来越少", effect: (s) => {
                    add(s, "cash", 50000); add(s, "mood", -8); add(s, "stress", 8); add(s, "charm", -2);
                    return dstChoose(s, "dst_family_3", "family_career",
                      "你用更多的钱去填缺席的位子：给孩子报最好的班，给父母请最好的护工。可没人买账。你心里隐隐知道，有些东西，钱补不回来。");
                  } }
              ]
            }) },
          { label: "想办法平衡：哪头都不舍，咬牙两头兼顾", effect: (s) => {
              add(s, "insight", 4); add(s, "strategy", 3); add(s, "stress", 12); add(s, "health", -4);
              return dstChoose(s, "dst_family_3", "family_balance",
                "你不肯在家和事业之间二选一，于是把自己劈成了两半。白天连轴转，晚上回家还要陪。累，是真的累——但你舍不得任何一头凉下去。");
            } }
        ]
      },

      /* ========== 第4幕 危·聚散（46岁）：一场家庭风暴（两层分支） ========== */
      {
        id: "dst_family_4", at: { minAge: 46 },
        title: "🌪️ 四十六岁，这个家迎来一场风暴",
        text: (s) => {
          const cold = dstPick(s, "dst_family_3") === "family_career";
          const hasKid = has(s, "has_kid") || ((s.children || []).length > 0);
          return (hasKid
            ? "长大的孩子和你大吵一架，摔门而去，说要去远方再不回这个「冷冰冰的家」。"
            : "一直陪着你的伴侣终于摊牌，说这些年活得像合租，提了「要不要继续」。")
            + "几乎同时，至亲的一场重病压了下来。"
            + (cold ? "你这才惊觉，那些年只顾在外头打拼，家里的裂缝早已悄悄裂到了今天——欠下的，终究要还。" : "你慌了——你最怕的「聚散离合」，到底还是找上了门。")
            + "这场风暴，你怎么接？";
        },
        dynamicChoices: (s) => {
          const cold = dstPick(s, "dst_family_3") === "family_career";
          return [
            { label: "倾力维系：放下一切，也要把这个家拉回来", next: (s) => ({
                text: "你推了手头所有的事，守在病床前、追到孩子的城市、坐到伴侣对面。你低下从不肯低的头，说出多年没说出口的「对不起」和「我需要你」。",
                choices: [
                  { label: "把话彻底说开，一点点把人心重新焐回来", effect: (s) => {
                      let p = 0.5 + familyWarmth(s) / 500 + luckBias(s) - (cold ? 0.15 : 0);
                      const win = rnd(p);
                      add(s, "stress", 12); add(s, "health", -4);
                      add(s, "mood", win ? 14 : -8);
                      if (win) { bumpMomentum(s, 10); flag(s, "family_healed"); }
                      else bumpMomentum(s, -6);
                      return dstChoose(s, "dst_family_4", "family_hold",
                        win ? "你把多年憋着的话全倒了出来，也第一次真正听懂了对方的委屈。风暴过后，这个家没散，反而比从前更结实——原来裂缝里，也能长出新的根。"
                            : (cold ? "你拼了命去补，可有些缺席太久，凉透的心一时焐不热。人没全留住，但你总算迈出了那一步——剩下的，交给时间。"
                                    : "你竭尽全力，结果却不尽如人意。有些聚散自有它的时辰，你能做的，是问心无愧地拉过那一把。"));
                    } },
                  { label: "用行动代替言语，日复一日守在他们身边", effect: (s) => {
                      let p = 0.46 + familyWarmth(s) / 520 - (cold ? 0.12 : 0);
                      const win = rnd(p);
                      add(s, "stress", 10); add(s, "health", -5); add(s, "charm", 2);
                      add(s, "mood", win ? 12 : -6);
                      if (win) { bumpMomentum(s, 8); flag(s, "family_healed"); }
                      return dstChoose(s, "dst_family_4", "family_hold",
                        win ? "你不善言辞，就用一日三餐、一趟趟奔波去说。家人慢慢看见了你的笨拙和真心，心也一点点软了回来——爱有时候不必说，做就够了。"
                            : "你默默守着，盼着用时间换回温度。结果未尽人意，可那些守候的日夜，家人终会有一天懂得。");
                    } }
                ]
              }) },
            { label: "放手：尊重各自的人生，强求来的不是家", effect: (s) => {
                add(s, "insight", 4); add(s, "mood", -6); add(s, "stress", 6); add(s, "health", -3);
                return dstChoose(s, "dst_family_4", "family_letgo",
                  "你松了手。你告诉自己，孩子有孩子的天地，缘分尽了不必硬留——可夜里你也分不清，这份「成全」里有多少是豁达，又有多少是累了、怕了、不想再争了。");
              } },
            { label: "各退一步：不撕裂也不强求，给彼此留口喘气的余地", effect: (s) => {
                add(s, "insight", 3); add(s, "strategy", 3); add(s, "mood", 2); add(s, "stress", 5);
                return dstChoose(s, "dst_family_4", "family_mend",
                  "你没把话说绝，也没硬拽着不放。你给孩子、给伴侣、也给自己都留了余地：先各自冷静，门一直开着。修补一个家，有时候要的不是用力，是耐心。");
              } }
          ];
        }
      },

      /* ========== 第5幕 巅·儿孙绕膝（60岁）：晚年盘点 ========== */
      {
        id: "dst_family_5", at: { minAge: 60 },
        title: "🍵 六十岁，你坐在自家的饭桌前盘点这一生",
        text: (s) => {
          const hasKid = has(s, "has_kid") || ((s.children || []).length > 0);
          const nourished = has(s, "family_tender") || has(s, "family_healed")
                         || has(s, "dst_pick_family_balance");
          if (hasKid && nourished) {
            return "饭菜的香气漫满屋子，桌边围着大大小小好几口人。你这一生没追上太爷爷嘴里的「出头」，却把一个家焐得热气腾腾。如今坐在主位，你想给这一生，画个怎样的句点？";
          }
          if (hasKid) {
            return "孩子们都大了，逢年过节才回来一趟，屋子大多时候空着。你曾以为有了娃就有了晚年的热闹，如今才知道，热闹也是要日日攒的。剩下的日子，你打算怎么过？";
          }
          return "你没能凑齐世人眼里的「儿孙满堂」。屋子很静，静得能听见自己的心跳。回望这一生关于「家」的种种，到了这把年纪，你想怎样收尾？";
        },
        dynamicChoices: (s) => {
          const hasKid = has(s, "has_kid") || ((s.children || []).length > 0);
          const nourished = has(s, "family_tender") || has(s, "family_healed")
                         || has(s, "dst_pick_family_balance")
                         || has(s, "dst_pick_family_hold") || has(s, "dst_pick_family_mend");
          const cold = has(s, "dst_pick_family_career") || has(s, "dst_pick_family_letgo");
          return [
            { label: "尽享天伦：把余生都交给这满堂的烟火气", effect: (s) => {
                let p = 0.4 + familyWarmth(s) / 360 + (nourished ? 0.2 : 0) + (hasKid ? 0.12 : -0.2) - (cold ? 0.12 : 0) + luckBias(s);
                const win = rnd(p);
                add(s, "stress", -10);
                if (win) {
                  add(s, "mood", 18); add(s, "health", 6); bumpMomentum(s, 14); flag(s, "family_fulfilled");
                  return dstChoose(s, "dst_family_5", "family_round",
                    "你含饴弄孙，看着儿孙们在屋里跑进跑出，忽然就红了眼眶。事业是一时的，你早就放下了——这满堂的热闹，这一声声「外公/外婆」「爷爷/奶奶」，才是你用一辈子换来的圆满。");
                }
                add(s, "mood", 6); add(s, "health", 3); bumpMomentum(s, 4);
                return dstChoose(s, "dst_family_5", "family_warm_lite",
                  "团圆没有想象中那样满，可只要还有人记得回来、还有一桌饭等着开，就够了。你学会了知足——家这东西，不必十全十美，暖着就好。");
              } },
            { label: "倾囊托举：把攒下的一切都留给孩子和下一辈", effect: (s) => {
                add(s, "cash", 0); add(s, "mood", hasKid ? 10 : -4); add(s, "insight", 2); add(s, "stress", -6);
                if (hasKid) { bumpMomentum(s, 6); flag(s, "family_legacy"); }
                return dstChoose(s, "dst_family_5", "family_pass",
                  hasKid
                    ? "你把房子、积蓄、一身的经验,一样样交到下一辈手里,只盼他们的路能比你好走。看着他们成家立业,你觉得自己这棵老树,总算把根扎进了更深的土里。"
                    : "你没有子嗣可托,便把心血捐了出去、留给了真正需要的人。血脉之外,你也算给这世上,留下了一点暖。");
              } },
            { label: "坦然独处：是聚是散都认了，把晚年活成自己的样子", effect: (s) => {
                add(s, "mood", 8); add(s, "health", 4); add(s, "insight", 4); add(s, "stress", -12);
                return dstChoose(s, "dst_family_5", "family_solo",
                  "你不再执念于「圆满」二字。儿孙也好、清静也罢，都是命里的安排。你侍弄花草、会会老友，把一个人的晚年也过得有滋有味——家在心里，人就不算孤单。");
              } }
          ];
        }
      }

    ]);

})();
