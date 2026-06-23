"use strict";
/* =====================================================================
 * content/destiny-academia.js —— 命运线【学术封神 acad】
 * 母题：太爷爷说「打工是不可能打工的」。你给出了第四种答案——有的人，
 *       是给文明本身打工的。板凳要坐十年冷，只为把人类的认知往前推一寸。
 * 五幕脊柱（确定性、按阶段推进，前幕选择在后幕/清算回收）：
 *   1 序·立志    18岁  为什么走这条清贫的路：求知 / 扬名 / 报国
 *   2 起·寒窗    23岁  同龄人买房买车，你还在读书——顶住，还是动摇
 *   3 折·青椒之困 34岁  学术圈的现实：死磕真学问 / 钻营拿帽子 / 心灰
 *   4 危·十字路口 42岁  冷板凳 vs 下海经商(高学历变现) vs 灌水造假走捷径
 *   5 巅·盖棺定论 58岁  一生的学术清算：诺奖/院士/泰斗/下海/翻车，尘埃落定
 * 抉择记录 dstChoose(s,chId,key,note)；回收 has(s,"dst_pick_*")/dstPick。
 * 实际奖项由 events-degree.js 的冲顶链(突破→提名→揭晓)判定，本线管「为什么、
 * 走得苦不苦、守没守住初心」的精神主轴与清算。
 * ===================================================================== */
(function () {

  // 综合「学术境界」：越高越接近封神（供清算/旁白参考）
  function acadStanding(s) {
    let v = (s.stats ? (s.stats.knowledge || 0) + (s.stats.insight || 0) * 0.6 : 0) + (s.reputation || 0) * 0.7;
    v += ({ "博后": 10, "讲师": 25, "副教授": 45, "教授": 70 }[s.acadRank]) || 0;
    if (has(s, "laureate")) v += 100; if (has(s, "academician")) v += 70;
    if (has(s, "phd_done")) v += 20;
    return Math.round(v);
  }

  registerDestiny("acad",
    {
      name: "学术封神", motif: "有的人，是给文明本身打工的",
      acts: ["序·立志", "起·寒窗", "折·青椒之困", "危·十字路口", "巅·盖棺定论"],
      reckon: function (s) {
        const pure = has(s, "dst_pick_acad_pure");
        const biz = has(s, "dst_pick_acad_business");
        const fraud = has(s, "dst_pick_acad_fraud");
        const busted = has(s, "acad_fraud_busted");
        const top = has(s, "laureate");
        const yuanshi = has(s, "academician");
        const prof = s.acadRank === "教授" || has(s, "full_professor");
        if (busted) {
          return "你曾以为灌水和造假是条捷径，直到东窗事发的那天，半生声名一夜崩塌。"
            + "太爷爷那句「打工是不可能打工的」，你本想用学问去回答，却把答卷写成了一个警示——学术这行，输什么都不能输了诚实。";
        }
        if (top) {
          return "你站上了人类知识的最高领奖台。" + (pure ? "一路坐穿冷板凳、不曾向名利低头，" : "")
            + "从此你的名字，和这门学问一起，被刻进了文明的年轮。太爷爷的话在你身上彻底失效了——你不是给谁打工，你是给整个人类的未来，添了一块基石。";
        }
        if (yuanshi) {
          return "你当选了院士，登上了本土学界的最高殿堂，桃李满天下，为国解过真问题。"
            + "你用一生证明：有一种出头，不靠金山银山，而靠把名字写进一个国家的科学史。";
        }
        if (biz) {
          return "半道上，你把研究变成了产品、把学问换成了真金白银，下海经商，过上了同行艳羡的好日子。"
            + "封神的初心，终究是轻轻放下了。你偶尔深夜翻起当年的论文，会怔一下——但你不后悔，让家人过好，也是一种了不起的成全。";
        }
        if (prof) {
          return "你做到了教授，带过一届届学生，桃李成蹊。没能摘下那顶最耀眼的桂冠，可你早已不为头衔做学问。"
            + "一辈子守在讲台和书桌之间，清贫，却也清白、清醒。这条路，你走得问心无愧。";
        }
        return "你曾立志要在学问上封神，可这条路比你想的更窄、更冷。终点没能抵达，但你真心实意地，为人类的认知努力推过那么一程。"
          + "太爷爷的话你没能漂亮地反驳，可你试过了，朝着星辰的方向——这就够了。";
      }
    },
    [

      /* ===== 第1幕 序·立志（18岁）：为什么走这条清贫的路 ===== */
      {
        id: "dst_acad_1", at: { minAge: 18, stage: ["youth"] },
        title: "📖 你在旧书堆里，许下了一个清贫的愿",
        text: (s) => byClass(s, {
          poor: "家里供你念书已是倾尽所有。亲戚劝你早点打工挣钱，可你抱着从旧书摊淘来的几本砖头书，心里有团火怎么也压不灭——你想读下去，一直读下去，读到能搞懂这世界到底是怎么运转的那天。太爷爷说「打工是不可能打工的」，你却动了另一个念头：有没有一种活法，是为知识本身而活？",
          mid: "填志愿那晚，全家围着你劝『选个好就业的』。你却盯着那个冷门又烧脑的方向出神。你知道这条路清贫、漫长、九成人半途而废，可你心里那团想『搞懂点什么』的火，比对房子车子的渴望更烫。",
          rich: "家里能给你铺好任何一条捷径，你偏偏选了最不挣钱的那条——做学问。长辈不解：『家底厚成这样，何苦去坐冷板凳？』你笑而不答。你想要的，是钱买不来的东西：在某个领域，留下真正属于自己的、哪怕一寸的推进。"
        }),
        choices: [
          { label: "为纯粹的求知欲——只想搞懂这个世界", effect: (s) => {
              add(s, "insight", 3); add(s, "knowledge", 2); add(s, "mood", 4);
              return dstChoose(s, "dst_acad_1", "acad_curious", "你为『搞懂』而读书，不为别的。这份纯粹，会是你日后熬过所有冷板凳的底气。"); } },
          { label: "为扬名立万——把名字刻进教科书", effect: (s) => {
              add(s, "strategy", 2); add(s, "reputation", 3); add(s, "stress", 2);
              return dstChoose(s, "dst_acad_1", "acad_fame", "你想要的是不朽的声名。野心不是坏事，它会推着你往高处走——只要别在半路，把它走歪。"); } },
          { label: "为科技报国——把学问做在祖国的土地上", effect: (s) => {
              add(s, "knowledge", 2); add(s, "insight", 2); add(s, "reputation", 2); flag(s, "acad_patriot");
              return dstChoose(s, "dst_acad_1", "acad_country", "你把个人的志向，系在了更大的命题上。这份初心，日后会在你面对『去留』时，沉沉地拽你一把。"); } }
        ]
      },

      /* ===== 第2幕 起·寒窗（23岁）：世俗压力下的坚持 ===== */
      {
        id: "dst_acad_2", at: { minAge: 23 },
        cond: (s) => has(s, "abroad_done") || has(s, "edu_bachelor") || has(s, "academia_track") || has(s, "phd_done") || (s.study && s.study.active),
        title: "🍜 同学群里晒房晒车，你还在啃文献",
        text: (s) => "大学同学群最近很热闹：有人晒了新房钥匙，有人提了车，有人朋友圈官宣升职加薪。\n\n" +
          "而你，还在为下个月的补助够不够交房租发愁，桌上摞着读不完的文献。深夜实验室/自习室的灯下，那个声音又冒出来：同样起跑，凭什么人家已经上岸，你却还在『投资未来』这张永远看不到头的支票上，一笔笔搭进青春？",
        choices: [
          { label: "顶住——我认准的路，慢也认了", effect: (s) => {
              add(s, "insight", 3); add(s, "knowledge", 3); add(s, "stress", 4);
              return dstChoose(s, "dst_acad_2", "acad_persist", "你把那点动摇咽了回去。慢就慢，穷就穷，认准的事，你愿意用十年去等一个结果。"); } },
          { label: "一边兼职一边读，先把生活稳住", effect: (s) => {
              add(s, "cash", 30000); add(s, "strategy", 2); add(s, "knowledge", 1); add(s, "health", -2);
              return dstChoose(s, "dst_acad_2", "acad_grind", "你给学问之外又加了副担子，靠兼职喂饱肚子。累是真累，但你没让现实，逼自己放弃热爱。"); } },
          { label: "动摇了——是不是该听劝，去挣钱", effect: (s) => {
              add(s, "mood", -4); add(s, "insight", 2);
              return dstChoose(s, "dst_acad_2", "acad_waver", "你第一次认真怀疑自己的选择。这点裂缝你暂时按住了，但它会在将来某个十字路口，重新裂开。"); } }
        ]
      },

      /* ===== 第3幕 折·青椒之困（34岁）：学术圈的现实 ===== */
      {
        id: "dst_acad_3", at: { minAge: 34 },
        cond: (s) => has(s, "academia_track") || has(s, "phd_done") || !!s.acadRank,
        title: "🧗 青椒之困：理想撞上了学术圈的现实",
        text: (s) => "熬成了博士/青年教师，你才看清这行真实的样子。\n\n" +
          "真正坐下来做学问的时间少得可怜，大把精力耗在申基金、填表格、抢『帽子』、陪笑脸上。有人靠灌水论文一年发十几篇、头衔一串串地拿；你死磕的那个难题，三年还没磨出一篇。导师劝你『现实点』，可你当年立的那个志，还在胸口隐隐发烫。",
        choices: [
          { label: "死磕真学问——慢，但要做就做真的", effect: (s) => {
              add(s, "knowledge", 4); add(s, "insight", 4); add(s, "stress", 6); add(s, "reputation", 2);
              return dstChoose(s, "dst_acad_3", "acad_real", "你拒绝灌水，认准一个硬骨头啃下去。短期吃亏，可真正能传世的东西，从来急不出来。"); } },
          { label: "学会钻营——先把帽子和资源抢到手", effect: (s) => {
              add(s, "reputation", 6); add(s, "network", 6); add(s, "strategy", 3); add(s, "mood", -3);
              return dstChoose(s, "dst_acad_3", "acad_climb", "你放下清高，学会了跑关系、抢资源、包装成果。头衔来得快了，只是夜深时，你有点认不出镜子里的自己。"); } },
          { label: "心灰意冷——开始怀疑这一切值不值", effect: (s) => {
              add(s, "mood", -6); add(s, "stress", 5); add(s, "insight", 3);
              return dstChoose(s, "dst_acad_3", "acad_jaded", "你累了，理想被现实磨得只剩个轮廓。你还没走，但去意，已经悄悄在心里生根。"); } }
        ]
      },

      /* ===== 第4幕 危·十字路口（42岁）：冷板凳 / 下海 / 走捷径 ===== */
      {
        id: "dst_acad_4", at: { minAge: 42 },
        cond: (s) => has(s, "academia_track") || !!s.acadRank || has(s, "phd_done"),
        title: "🛤️ 四十出头，三条路摆在你面前",
        text: (s) => "人到中年，学术生涯走到了最关键的岔路口，三股力量同时拉扯着你：\n\n" +
          "一头是那张你坐了半辈子的冷板凳，清贫、寂寞，却干净；一头是窗外汹涌的财富——你这身硬学历和真本事，市场上正抢着要，下海或把成果变现，立刻就是几十倍的收入；还有一条人人心知肚明的暗道：灌水、挂名、甚至动点手脚，名利唾手可得，只要……别被抓到。",
        choices: [
          { label: "守住冷板凳，把真学问做到底", effect: (s) => {
              add(s, "insight", 5); add(s, "knowledge", 4); add(s, "reputation", 4); add(s, "mood", 4);
              flag(s, "acad_pure");
              return dstChoose(s, "dst_acad_4", "acad_pure", "你婉拒了所有诱惑，转身走回那间亮着灯的实验室。这一关守住了，你离『封神』，反而更近了。"); } },
          { label: "下海经商——把学问做成公司（进经营模式）", effect: (s) => {
              add(s, "cash", 400000); add(s, "network", 8); add(s, "strategy", 5); add(s, "mood", 6); flag(s, "bigtech");
              deg_foundStartup(s, { track: s.eraWind, product: 34, buzz: 22, team: 50, runway: 60, progress: 22 });
              return dstChoose(s, "dst_acad_4", "acad_business",
                "你把多年的研究打包成产品，拉来投资、办起公司，正式下海全职经营。高学历是块金字招牌，资本对你格外青睐。\n\n『学术封神』那个梦，你亲手合上了——但另一扇门轰然打开：这家公司能做到多大，从今往后，全凭你自己的本事去搏。"); } },
          { label: "走捷径——灌水、挂名，先把名利拿到手", effect: (s) => {
              add(s, "reputation", 10); add(s, "cash", 120000); add(s, "network", 5); add(s, "stress", 6);
              flag(s, "acad_fraud"); flag(s, "dirty_hands");
              return dstChoose(s, "dst_acad_4", "acad_fraud",
                "你说服自己『大家都这么干』，开始灌水、买挂名、把数据修得好看。头衔和经费滚滚而来，风光无两。可你心里清楚，脚下埋着一颗雷，不知哪天会响。"); } }
        ]
      },

      /* ===== 第5幕 巅·盖棺定论（58岁）：一生学术的尘埃落定 ===== */
      {
        id: "dst_acad_5", at: { minAge: 58 },
        cond: (s) => has(s, "academia_track") || !!s.acadRank || has(s, "laureate") || has(s, "academician") || has(s, "left_academia"),
        title: "🕯️ 盖棺定论：你这一生的学问，值几何",
        text: (s) => {
          const fraud = has(s, "dst_pick_acad_fraud") && !has(s, "acad_fraud_busted");
          if (fraud) return "晚年本该功成名就，可那颗埋了多年的雷，终于在一场举报里被引爆——你早年灌水造假的旧账，被人翻了出来。\n\n" +
            "调查、撤稿、舆论哗然。你坐在书房里，看着墙上那些曾经引以为傲的奖状，第一次觉得它们如此刺眼。捷径的账，终究是要还的，连本带利。";
          if (has(s, "laureate") || has(s, "academician"))
            return "白发苍苍的你，站在荣誉的最高处回望这一生：那个在旧书堆里许愿的少年，那些买不起房却舍不得放下书的夜晚，那道磨了你半辈子的难题……\n\n原来都通向了今天。你做到了——把名字，刻进了人类的知识里。";
          if (has(s, "left_academia"))
            return "你早已离开学术圈，在商海里闯出了一片天。功成名就的酒桌上，偶尔有人提起你『当年也是做研究的』，你笑笑，端起酒杯，眼底掠过一丝只有自己懂的复杂。\n\n那条没走完的路，成了你心里一个永远温柔的遗憾。";
          return "你做了一辈子学问，没能摘下最耀眼的那顶桂冠，但讲台下坐满了你教过的学生，书架上立着你写下的著作。\n\n回望来路，清贫，却清白。你对得起当年那个许愿的自己。";
        },
        dynamicChoices: (s) => {
          const fraud = has(s, "dst_pick_acad_fraud") && !has(s, "acad_fraud_busted");
          if (fraud) return [
            { label: "认栽——这是我自己种下的因", effect: (s) => {
                flag(s, "acad_fraud_busted"); add(s, "reputation", -40); add(s, "mood", -20); add(s, "stress", 12);
                return "你没有狡辩。撤稿、辞职、向公众致歉——你认下了这一切。半生声名付诸东流，可你忽然觉得，卸下那个一直提心吊胆的自己，竟有种迟来的轻松。诚实的代价很贵，但你总算，把它补交了。"; } },
            { label: "动用关系压下去，死不认账", effect: (s) => {
                add(s, "reputation", -20); add(s, "stress", 16); add(s, "mood", -10); flag(s, "acad_fraud_busted");
                return "你调动了所有人脉去捂这件事。风波暂时压下了一些，可『学术不端』的标签，已经牢牢焊在了你名字上。往后余生，你活在一种没人点破、却人人皆知的尴尬里。这或许，比身败名裂更难熬。"; } }
          ];
          return [
            { label: "合上书，安然看自己这一生", effect: (s) => {
                add(s, "mood", 12); add(s, "insight", 4);
                if (has(s, "laureate") || has(s, "academician")) add(s, "reputation", 8);
                return "你轻轻合上手边那本读了一辈子的书。窗外天光正好。\n\n这一生图的是什么，此刻你心里清清楚楚——不是房子车子，不是头衔虚名，而是真真切切地，为这个世界多照亮了那么一小块从前的黑暗。够了，这一生，值了。"; } }
          ];
        }
      }
    ]
  );

  /* ===================================================================
   * 学术线专属【开局捏人剧本】：学术世家 / 寒门苦读
   * 复用目标选择页（无新界面）：两张走「学术封神」命运线的开局剧本，
   * 别名到 acad 命运脊柱（共享 5 幕），但开局家底/属性/底色截然不同。
   * =================================================================== */
  var _acadGoal = (typeof GOALS !== "undefined") && GOALS.find(function (g) { return g.id === "acad"; });
  if (_acadGoal && typeof GOAL_MODS !== "undefined") {
    GOALS.push(
      {
        id: "acad_dynasty", name: "学术世家", emoji: "📜", path: "学术",
        target: "承一门家学，登顶学界（诺奖 / 图灵 / 菲尔兹 / 院士）",
        desc: "【开局剧本】书香门第，父辈是名教授。你含着学术的金汤匙长大——家学、人脉、视野样样不缺，可那道父辈的光环，也是你一生要翻越的山。",
        progress: _acadGoal.progress, done: _acadGoal.done
      },
      {
        id: "acad_humble", name: "寒门苦读", emoji: "🪔", path: "学术",
        target: "寒门贵子，靠一身苦读登顶学界",
        desc: "【开局剧本】家徒四壁，父母砸锅卖铁供你读书。没有任何缓冲，唯有一盏孤灯、一身倔强，和『读书改变命运』那个朴素到滚烫的信念。",
        progress: _acadGoal.progress, done: _acadGoal.done
      }
    );
    GOAL_MODS.acad_dynasty = {
      bias: ["degree", "study"], biasP: 0.5, cashMul: 1.0,
      note: "【学术世家】家学渊源、人脉现成，开局智识与底子都厚——但你得证明，自己不只是『某某教授的孩子』。",
      onPick: function (s) {
        flag(s, "goal_acad"); flag(s, "can_abroad"); flag(s, "acad_legacy");
        s.cash = Math.max(s.cash || 0, 300000); s.assets = Math.max(s.assets || 0, 200000);
        add(s, "knowledge", 5); add(s, "insight", 3); add(s, "network", 6); add(s, "mind", 1);
      }
    };
    GOAL_MODS.acad_humble = {
      bias: ["degree", "study"], biasP: 0.5, cashMul: 1.0,
      note: "【寒门苦读】开局一贫如洗，求学的每一分钱都得自己挣。但苦难磨出的那股韧劲与悟性，是温室里长不出来的。",
      onPick: function (s) {
        flag(s, "goal_acad"); flag(s, "can_abroad"); flag(s, "born_poor"); flag(s, "acad_humble");
        s.cash = Math.min(s.cash || 0, 2000); s.assets = 0;
        add(s, "insight", 5); add(s, "knowledge", 4); add(s, "strategy", 2); add(s, "body", -2); add(s, "stress", 4); add(s, "mood", -2);
      }
    };
    // 别名到 acad 命运脊柱：两个剧本共享同一条 5 幕主线与进度/清算
    if (window.DESTINY_LINES && window.DESTINY_LINES.acad) {
      window.DESTINY_LINES.acad_dynasty = window.DESTINY_LINES.acad;
      window.DESTINY_LINES.acad_humble = window.DESTINY_LINES.acad;
    }
    // 剧本达成成就（跨局成就墙）
    if (typeof ACHIEVEMENTS !== "undefined") {
      ACHIEVEMENTS.push(
        { id: "acad_dynasty_done", name: "青出于蓝", emoji: "📜", desc: "以『学术世家』剧本登顶学界，走出了父辈的影子。", check: function (L) { return L.goal === "acad_dynasty" && L.goalDone; } },
        { id: "acad_humble_done", name: "寒门贵子", emoji: "🪔", desc: "以『寒门苦读』剧本登顶学界，一盏孤灯照亮了命运。", check: function (L) { return L.goal === "acad_humble" && L.goalDone; } }
      );
    }
  }

})();
