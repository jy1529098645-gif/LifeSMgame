"use strict";
/* ==================================================================
 * content/events-saga-rival.js —— 多幕连续剧式戏剧事件（saga）
 * 两条跨越多年的剧情线，靠 flag 串联（引擎优先推进 module:"saga"）：
 *   1) 宿敌·复仇线 nemesis：少年受辱 → 多年后宿敌成对手 → 终极对决（3 幕，3 分支结局）
 *   2) 贵人·提携线 mentor：低谷遇贵人 → 一路提携高升 → 贵人有难报恩还是自保（3 幕，多分支）
 * 复用 s.sg_<名> 让同一人物反复出现；按前幕 flag 让结局不同（埋线→回收）。
 * 全局 helper：add/flag/has/pick/rnd/genName/genCNName/bumpMomentum 等直接可用。
 * ================================================================== */

// —— saga 内部辅助：人物插槽（同一人物全程复用，性别随机但名字与代词永远一致）——
// 首次出场即随机定下性别，名字与之匹配，并把代词(他/她)存进 s[key+"_pn"]；
// 文案里凡指这个人物，统一用 rival_pn(s,key) 取代词 → 宿敌/贵人男女皆可，绝不错位。
function rival_nameOf(s, key, style, gender) {
  if (!s[key]) {
    const g = (gender === "男" || gender === "女") ? gender : (Math.random() < 0.5 ? "男" : "女");
    s[key] = (typeof genName === "function") ? genName(style || "cn", g)
           : (typeof genCNName === "function") ? genCNName(g) : "那个人";
    s[key + "_pn"] = (g === "女") ? "她" : "他";
  }
  return s[key];
}
// 取该人物的代词（他/她）；未初始化则先按名字生成，保证有值。
function rival_pn(s, key) { if (!s[key + "_pn"]) rival_nameOf(s, key, "cn"); return s[key + "_pn"]; }
// —— saga 内部辅助：综合实力评分（决定对决胜负，越高越稳）——
function rival_power(s) {
  const st = s.stats || {};
  return (st.strategy || 0) + (st.charm || 0) + (st.insight || 0)
       + (s.reputation || 0) + (s.network || 0)
       + Math.min(40, ((s.cash || 0) + (s.assets || 0)) / 500000);
}

EVENTS.push(

  /* =================================================================
   * 【SAGA 一】宿敌·复仇线 nemesis
   * ================================================================= */

  // —— 第1幕（开端）：少年时当众被羞辱、被夺走重要的东西 ——
  { id: "ev_sagarival_nemesis_s1", module: "saga", ambient: true, once: true,
    cond: (s) => s.age >= 16 && s.age <= 22 && !has(s, "saga_nemesis_s1"),
    title: "🔥 那年夏天，ta当众踩碎了你",
    text: (s) => {
      const n = rival_nameOf(s, "sg_nemesis", "cn"), p = rival_pn(s, "sg_nemesis");
      return `高中最后一个夏天。${n} 是年级里最风光的人——成绩、家境、连你偷偷喜欢的那个人，都站在${p}那边。`
        + `这天全班都在，${p}把你递出去的情书高高举起，一字一句念了出来，笑声像耳光一样落下来。`
        + `更狠的是，那个保送名额，本来八成是你的，最后被${p}用一通你说不清的关系拿走了。你攥紧拳头，指甲掐进掌心。`;
    },
    choices: [
      { label: "把屈辱咽下，记在心里：总有一天", effect: (s) => {
          const n = rival_nameOf(s, "sg_nemesis", "cn");
          flag(s, "saga_nemesis_s1"); flag(s, "nemesis_path_revenge");
          add(s, "stress", 10); add(s, "mood", -8); add(s, "strategy", 3); add(s, "insight", 2);
          return `你一句话没说，转身走出教室。那天起，「${n}」三个字成了你心口的一根刺。`
            + `你把所有的不甘都换成了狠劲——这笔账，迟早要当面算清。`;
        } },
      { label: "当场掀桌，跟ta打了一架", effect: (s) => {
          const n = rival_nameOf(s, "sg_nemesis", "cn"), p = rival_pn(s, "sg_nemesis");
          flag(s, "saga_nemesis_s1"); flag(s, "nemesis_path_hot");
          add(s, "health", -6); add(s, "reputation", -4); add(s, "body", 2); add(s, "stress", 6);
          return `你冲上去把${p}按在桌上，两个人扭打成一团，最后双双被请进了教导处。`
            + `你鼻青脸肿，${p}光鲜地被家长接走。${n} 临走撂下一句：「就你？这辈子也别想压过我。」你记住了这句话。`;
        } },
      { label: "笑着祝贺ta，把刀藏进袖子", effect: (s) => {
          const n = rival_nameOf(s, "sg_nemesis", "cn"), p = rival_pn(s, "sg_nemesis");
          flag(s, "saga_nemesis_s1"); flag(s, "nemesis_path_cold");
          add(s, "charm", 2); add(s, "strategy", 4); add(s, "stress", 6); add(s, "mood", -4);
          return `你走过去，伸出手，笑容得体地恭喜了 ${n}。${p}愣了一下，握住你的手。`
            + `没人看出你笑容下的东西。你学会的第一课是：真正的恨，要安静地长大。`;
        } }
    ] },

  // —— 第2幕（升级）：多年后宿敌发达，成了压你一头的对手/上司 ——
  { id: "ev_sagarival_nemesis_s2", module: "saga", ambient: true, once: true,
    cond: (s) => has(s, "saga_nemesis_s1") && !has(s, "saga_nemesis_s2") && s.age >= 30,
    title: "🌪️ 多年以后，ta又站在了你头顶",
    text: (s) => {
      const n = rival_nameOf(s, "sg_nemesis", "cn"), p = rival_pn(s, "sg_nemesis");
      return `命运总爱开这种玩笑。一场行业峰会上，聚光灯亮起，台上意气风发的人，正是 ${n}。`
        + `这些年${p}扶摇直上，如今成了你绕不开的存在——同一个赛道的头号对手，或者，正握着你饭碗的那个人。`
        + `散场时${p}端着酒杯踱到你面前，似笑非笑：「还记得那个夏天吗？这么多年了，你怎么还在原地？」`;
    },
    choices: [
      { label: "正面硬刚：「走着瞧，这次不一样」", effect: (s) => {
          const n = rival_nameOf(s, "sg_nemesis", "cn"), p = rival_pn(s, "sg_nemesis");
          flag(s, "saga_nemesis_s2"); flag(s, "nemesis_open_war");
          add(s, "stress", 12); add(s, "reputation", 4); add(s, "strategy", 3); add(s, "mood", -3);
          return `你直视${p}的眼睛，一字一句：「这次，我不会再让了。」周围的人都听见了。`
            + `战书已下。从这一晚起，你和 ${n} 之间，再无回头路——后来的人都说，那是一场注定要分出生死的较量。`;
        } },
      { label: "隐忍蛰伏：暗中布局，等ta露破绽", effect: (s) => {
          const n = rival_nameOf(s, "sg_nemesis", "cn"), p = rival_pn(s, "sg_nemesis");
          flag(s, "saga_nemesis_s2"); flag(s, "nemesis_ambush");
          add(s, "insight", 4); add(s, "strategy", 4); add(s, "network", 4); add(s, "stress", 8);
          return `你端起酒杯，轻轻碰了一下${p}的：「过奖。」滴水不漏。`
            + `回去后你彻夜未眠，开始一笔一笔地查${p}的底——${p}越是张扬，破绽就越多。猎人，从不让猎物听见脚步声。`;
        } },
      { label: "心生退意：「也许我该放下了」", effect: (s) => {
          const n = rival_nameOf(s, "sg_nemesis", "cn");
          flag(s, "saga_nemesis_s2"); flag(s, "nemesis_weary");
          add(s, "mood", -6); add(s, "health", 3); add(s, "stress", -4); add(s, "insight", 3);
          return `你忽然觉得累。半生执念，到头来不过是别人的一句调侃。`
            + `你没接话，转身离开了会场。可深夜回到家，那根扎了十几年的刺，依旧隐隐作痛——你真的放得下吗？`;
        } }
    ] },

  // —— 第3幕（高潮结局）：终极对决，多分支大结局 ——
  { id: "ev_sagarival_nemesis_s3", module: "saga", ambient: true,
    cond: (s) => has(s, "saga_nemesis_s2") && !has(s, "saga_nemesis_done") && s.age >= 35,
    title: "⚔️ 终极对决：这一战，定生死",
    text: (s) => {
      const n = rival_nameOf(s, "sg_nemesis", "cn");
      return `多年的明争暗斗，终于走到了图穷匕见的一刻。`
        + `一桩足以颠覆行业格局的关键项目摆在台面上，你和 ${n} 各押全部身家，对赌、抢标、舆论战，胜者通吃，败者出局。`
        + `谈判桌、董事会、媒体头条，处处是战场。少年时那个攥紧的拳头，等了半生，终于等到这一刻。`;
    },
    choices: [
      { label: "正面碾压：调动全部积累，正大光明赢回来", effect: (s) => {
          const n = rival_nameOf(s, "sg_nemesis", "cn"), p = rival_pn(s, "sg_nemesis");
          flag(s, "saga_nemesis_done");
          const win = rival_power(s) > 90 || rnd(0.5);
          if (win) {
            add(s, "cash", 3000000); add(s, "reputation", 25); add(s, "network", 12);
            add(s, "mood", 30); add(s, "stress", -10); flag(s, "nemesis_triumph");
            bumpMomentum(s, 14);
            return `你拿出半生积累的人脉、判断与口碑，一招一式，堂堂正正。当结果公布，全场哗然——${n} 输了，输得心服口服。`
              + `${p}走过来，沉默良久，终于伸出手：「这次，是我不如你。」你握住它，眼眶发热。那个夏天的少年，今天，终于赢了。`;
          }
          add(s, "cash", -1200000); add(s, "reputation", -12); add(s, "mood", -25); add(s, "stress", 22);
          flag(s, "nemesis_defeat"); flag(s, "fallen"); bumpMomentum(s, -12);
          return `你倾尽所有，却还是差了一口气。${n} 棋高一着，当众宣布胜利，回头看了你一眼，那眼神和十几年前一模一样。`
            + `你站在散场的废墟里，半生执念，终成泡影。`;
        } },
      { label: "阴招翻盘：动用早就攥在手里的把柄，鱼死网破", effect: (s) => {
          const n = rival_nameOf(s, "sg_nemesis", "cn"), p = rival_pn(s, "sg_nemesis");
          flag(s, "saga_nemesis_done");
          // 埋线回收：第2幕选过「暗中布局」的人，把柄更硬，成功率更高
          const armed = has(s, "nemesis_ambush");
          if (armed && (s.stats.insight + s.stats.strategy > 40 || rnd(0.7))) {
            add(s, "cash", 2000000); add(s, "reputation", -8); add(s, "mood", 14); add(s, "stress", 10);
            flag(s, "nemesis_triumph"); flag(s, "got_dirty");
            return `你把这些年一点点攒下的证据，在最关键的时刻甩了出来。${n} 的帝国一夜倾塌，${p}被推上风口浪尖，再无翻身之力。`
              + `你赢了，赢得彻底。只是夜深人静时，你分不清镜子里的自己，和当年那个羞辱你的人，究竟差在哪里。`;
          }
          add(s, "cash", -800000); add(s, "reputation", -22); add(s, "mood", -18); add(s, "stress", 20);
          flag(s, "nemesis_defeat"); flag(s, "got_dirty"); bumpMomentum(s, -10);
          return `你赌上一切打出这张牌，却没料到 ${n} 早有防备，反手一记反咬。证据被指为伪造，舆论调转枪口对准你。`
            + `你不仅输了对决，还把多年清誉一并赔了进去——这一次，你输得最难看。`;
        } },
      { label: "一笑泯恩仇：放下半生执念，主动握手言和", effect: (s) => {
          const n = rival_nameOf(s, "sg_nemesis", "cn"), p = rival_pn(s, "sg_nemesis");
          flag(s, "saga_nemesis_done"); flag(s, "nemesis_reconcile");
          add(s, "mood", 22); add(s, "stress", -20); add(s, "health", 8);
          add(s, "insight", 6); add(s, "reputation", 6);
          // 厌战的人放下，更显释然；强硬派放下，更显格局
          const extra = has(s, "nemesis_weary") ? "你早就累了，这一放，整个人都轻了。"
                      : "压了半生的那口气，今天你自己松开了手。";
          return `决战前夜，你约 ${n} 喝了一杯。你说：「那个夏天，我恨了你很多年。可如今想想，逼着我变强的，也是你。」`
            + `${p}怔住，半晌，举杯与你相碰。两个斗了半生的人，最后选择握手，把项目做成了合作。${extra}`
            + `你忽然明白：放下宿敌，其实是放过了自己。`;
        } }
    ] },

  /* =================================================================
   * 【SAGA 二】贵人·提携线 mentor
   * ================================================================= */

  // —— 第1幕（开端）：人生低谷，神秘贵人拉你一把 ——
  { id: "ev_sagarival_mentor_s1", module: "saga", ambient: true, once: true,
    cond: (s) => s.age >= 24 && !has(s, "saga_mentor_s1") && (s.mood < 40 || s.cash < 20000),
    title: "🌧️ 最难的那年，有人递来一把伞",
    text: (s) => {
      const n = rival_nameOf(s, "sg_mentor", "cn"), p = rival_pn(s, "sg_mentor");
      return `这是你最狼狈的一段日子——钱包见底，前路茫茫，连最亲近的人都开始躲着你。`
        + `一场行业沙龙的角落里，你被人无视地缩在椅子上。一位头发花白、气场沉稳的前辈 ${n} 走过来，递给你一杯热茶：`
        + `「年轻人，眼睛里还有光，别这么早把自己放弃了。」${p}没多问，只留下一张名片：「明天来我办公室坐坐。」`;
    },
    choices: [
      { label: "第二天准时赴约，抓住这根稻草", effect: (s) => {
          const n = rival_nameOf(s, "sg_mentor", "cn"), p = rival_pn(s, "sg_mentor");
          flag(s, "saga_mentor_s1"); flag(s, "mentor_accepted");
          add(s, "mood", 10); add(s, "network", 6); add(s, "knowledge", 3); add(s, "stress", -6);
          return `你攥着那张名片整夜没睡。第二天你穿上唯一一件像样的衬衫，准时出现在${p}门口。`
            + `${n} 上下打量你，点点头：「坐。我看人，很少看走眼。」从这天起，你的人生悄悄换了轨道——多年后你才知道，那杯茶，值一座金山。`;
        } },
      { label: "心存戒备，先打听他的来历", effect: (s) => {
          const n = rival_nameOf(s, "sg_mentor", "cn");
          flag(s, "saga_mentor_s1"); flag(s, "mentor_cautious");
          add(s, "insight", 3); add(s, "strategy", 2); add(s, "network", 3); add(s, "mood", 4);
          return `你没急着去。先托人查了 ${n} 的底——业内德高望重，从不收徒，偏偏看上了你。`
            + `确认没有圈套后，你才登门。${n} 笑你谨慎：「好，做事的人就该这样。」你心里那点戒备，慢慢化成了敬意。`;
        } }
    ] },

  // —— 第2幕（升级）：贵人不断点拨给机会，你逐步高升 ——
  { id: "ev_sagarival_mentor_s2", module: "saga", ambient: true, once: true,
    cond: (s) => has(s, "saga_mentor_s1") && !has(s, "saga_mentor_s2") && s.age >= 30,
    title: "🚀 ta把梯子，一节一节递到你脚下",
    text: (s) => {
      const n = rival_nameOf(s, "sg_mentor", "cn"), p = rival_pn(s, "sg_mentor");
      return `这些年，${n} 像一盏灯。关键的局，${p}带你入场；要命的坑，${p}一句话点醒你；你够不着的资源，${p}一通电话就替你打通。`
        + `你从那个缩在角落的年轻人，一步步走到了台前。如今你已小有名气，而所有人都知道，你背后站着 ${n}。`
        + `这天${p}拍拍你肩膀，眼里有种说不清的疲惫：「我老了。往后的路，得你自己走了。记住——做人，要对得起良心。」`;
    },
    choices: [
      { label: "立誓铭记师恩：「您的恩情，我记一辈子」", effect: (s) => {
          const n = rival_nameOf(s, "sg_mentor", "cn"), p = rival_pn(s, "sg_mentor");
          flag(s, "saga_mentor_s2"); flag(s, "mentor_loyal");
          add(s, "mood", 8); add(s, "reputation", 6); add(s, "network", 6); add(s, "charm", 2);
          return `你郑重地向 ${n} 深深鞠了一躬：「没有您，就没有今天的我。这份恩，我一辈子都还不完。」`
            + `${p}眼眶有些湿，摆摆手让你别多说。可你没注意到，${p}眉宇间那抹疲惫，比从前更深了几分——后来你才懂，那是风雨欲来的影子。`;
        } },
      { label: "趁势壮大自己：把人脉与资源尽数收入囊中", effect: (s) => {
          const n = rival_nameOf(s, "sg_mentor", "cn");
          flag(s, "saga_mentor_s2"); flag(s, "mentor_ambitious");
          add(s, "cash", 400000); add(s, "network", 10); add(s, "strategy", 4); add(s, "stress", 6);
          return `你借着 ${n} 铺好的路，把能抓的机会、能握的人脉，全都收进了自己手里。短短几年，你已自成一方势力。`
            + `${n} 看着你，欣慰里掺了一丝复杂：「翅膀硬了，好啊。」你忙着往上飞，没去细想这句话的分量——直到风波临头那天。`;
        } }
    ] },

  // —— 第3幕（高潮结局）：贵人有难，报恩还是自保，多分支 ——
  { id: "ev_sagarival_mentor_s3", module: "saga", ambient: true,
    cond: (s) => has(s, "saga_mentor_s2") && !has(s, "saga_mentor_done") && s.age >= 38,
    title: "⚖️ 贵人落难，报恩还是自保？",
    text: (s) => {
      const n = rival_nameOf(s, "sg_mentor", "cn"), p = rival_pn(s, "sg_mentor");
      return `晴天霹雳。${n} 晚年卷入一场惊天风波——有人翻出旧账，把${p}推上了被告席，舆论汹汹，墙倒众人推。`
        + `当年受过${p}恩惠的人，一夜之间散得干干净净。深夜，${p}的家人找到你，声音发抖：「只剩你了……能不能拉${p}一把？」`
        + `你太清楚这意味着什么：替${p}出头，可能把自己半生基业一并搭进去；袖手旁观，前程保住了，可那杯热茶的恩，你这辈子还得起吗？`;
    },
    choices: [
      { label: "倾力报恩：砸钱、动用人脉，拼了命也要救ta", effect: (s) => {
          const n = rival_nameOf(s, "sg_mentor", "cn"), p = rival_pn(s, "sg_mentor");
          flag(s, "saga_mentor_done"); flag(s, "mentor_repaid");
          // 埋线回收：第2幕「立誓铭记」的人，人脉更愿替你出力，胜算更高
          const loyal = has(s, "mentor_loyal");
          add(s, "cash", -1500000); add(s, "stress", 18);
          if (loyal || rival_power(s) > 95 || rnd(0.45)) {
            add(s, "reputation", 30); add(s, "mood", 20); add(s, "network", 10); add(s, "insight", 5);
            bumpMomentum(s, 10); flag(s, "mentor_saved");
            return `你变卖资产、四处奔走，把这些年攒下的情面一次性押上。绝境之中，你硬是替 ${n} 翻了案。`
              + `老人握着你的手老泪纵横：「我这辈子，没看错你。」你元气大伤，却换来满城传颂的「义」字。有些东西，比钱贵得多。`;
          }
          add(s, "reputation", 10); add(s, "mood", -10); add(s, "health", -8); add(s, "stress", 10);
          flag(s, "fallen");
          return `你拼尽全力，倾家荡产，却终究没能挡住大势。${n} 还是倒下了，临终前只反复念叨着对不起你。`
            + `你赔上了半生基业，没能救回${p}，却守住了自己的良心——这条路，你走得倾家荡产，也走得问心无愧。`;
        } },
      { label: "理智自保：撇清关系，保住自己半生的前程", effect: (s) => {
          const n = rival_nameOf(s, "sg_mentor", "cn");
          flag(s, "saga_mentor_done"); flag(s, "mentor_abandoned");
          add(s, "cash", 200000); add(s, "reputation", -16); add(s, "mood", -22); add(s, "stress", 14);
          add(s, "insight", 4);
          return `你想了整整一夜，最终选择了沉默。你对外撇清了与 ${n} 的一切关联，前程稳稳保住了。`
            + `${n} 在风波里独自沉没，至死没有怪你一句。可此后每个深夜，那杯热茶的暖意都会回来烫你一下——你赢了世界，输了自己。`;
        } },
      { label: "折中斡旋：暗中相助，既留情义又护住自身", effect: (s) => {
          const n = rival_nameOf(s, "sg_mentor", "cn"), p = rival_pn(s, "sg_mentor");
          flag(s, "saga_mentor_done"); flag(s, "mentor_quiet_help");
          // 埋线回收：「心存戒备」起家的人最擅长这种不留痕迹的操作
          const shrewd = has(s, "mentor_cautious") || has(s, "mentor_ambitious");
          add(s, "stress", 12); add(s, "insight", 5); add(s, "strategy", 4);
          if (shrewd && (s.stats.strategy + s.stats.insight > 45 || rnd(0.6))) {
            add(s, "cash", -400000); add(s, "reputation", 8); add(s, "mood", 8); add(s, "network", 6);
            flag(s, "mentor_saved");
            return `你不露声色，私下里请律师、递关系、堵舆论，手法干净得没人查得到你。风波渐渐平息，${n} 保住了晚节。`
              + `老人心知肚明是谁出的手，却谁也没说。你既守住了情义，又护住了自己——这份分寸，正是${p}当年教你的。`;
          }
          add(s, "cash", -300000); add(s, "reputation", -6); add(s, "mood", -8);
          return `你想两头兼顾，暗中使了些力，却终究火候不够。${n} 没能保全，你的小动作也走漏了风声，落得里外不是人。`
            + `你这才明白，有些抉择没有中间地带——想都要，往往两手空空。`;
        } }
    ] }

);
