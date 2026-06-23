"use strict";
/* =====================================================================
 * content/events-saga-trial.js —— 多幕连续剧式戏剧事件（saga）：人生大考线
 * 跨越多年、层层推进、有大结局，像一部长剧。两条 saga：
 *   1) illness  —— 重病抗争线（体检异常/确诊 → 倾家荡产治还是放弃、
 *                  卖房筹钱、众筹、亲友冷暖 → 奇迹康复 / 人财两空 /
 *                  坦然有尊严地走完）
 *   2) emigrate —— 移民异乡扎根线（动了润的念头 → 办身份、卖家当、
 *                  语言关、文化隔阂、身份焦虑 → 成功扎根 /
 *                  当国际倒爷两头跑 / 黯然回流海归）
 * 机制：flag `saga_<名>_s1/s2/s3/done` 串联，引擎优先推进 module:"saga"。
 * 复用人物名 s.sg_<名>；按前幕选择 flag 让结局分歧。
 * ⚠️重病线克制、不渲染痛苦细节，给希望也给现实；牵动 health/cash/mood/亲情。
 * 只用全局 helper：add/flag/has/pick/rnd/byClass/classTier/socialShift/
 *   socialBoostRole/bumpMomentum/genName。辅助函数前缀 trial_；id 前缀 ev_sagatrial_。
 * ===================================================================== */

// 取/生成 saga 复用人物名（懒初始化，全程复用）。
function trial_name(s, key, style) {
  if (!s[key]) s[key] = genName(style || "cn", "男");   // 本线以「他」称呼，固定男性名免错位
  return s[key];
}
// 是否有家室（用于文案分叉：家人冷暖、谁来陪你扛）。
function trial_family(s) { return has(s, "married") || has(s, "partner") || has(s, "has_kid"); }
// 现金扣减助手：按比例扣，但不超过现有现金（避免负到离谱），返回实际扣减额。
function trial_drain(s, ratio, floor) {
  var cash = s.cash || 0;
  var want = Math.round(cash * ratio);
  if (floor && want < floor) want = floor;
  if (want > cash + 500000) want = cash + 500000; // 允许适度举债，但有上限
  add(s, "cash", -want);
  return want;
}
// 把金额格式化成「X万」口径文案。
function trial_wan(n) { return (Math.round(n / 1000) / 10) + "万"; }

/* =====================================================================
 * SAGA 1 ── 重病抗争线  saga 名: illness   人物: s.sg_illness(主治医生/陪伴者)
 * gate s.age>=35，体检异常/确诊为引子
 * 第1幕 体检查出问题/确诊 → 第2幕 治疗的抉择(倾家荡产/卖房/众筹/亲友) →
 * 第3幕(结局) 奇迹康复 / 人财两空 / 坦然走完
 * 分支 flag：
 *   illness_fight(全力救治) / illness_giveup(放弃/保守) —— 第1幕态度
 *   illness_sellhouse(卖房筹钱) / illness_crowdfund(众筹) / illness_savings(自掏) —— 第2幕筹钱方式
 * ===================================================================== */

/* —— 第1幕：那张体检报告 —— */
EVENTS.push({
  id: "ev_sagatrial_illness_s1", module: "saga", ambient: true, once: true,
  cond: (s) => s.age >= 35 && !has(s, "saga_illness_s1"),
  title: "🏥 报告单上的那行字",
  text: (s) => {
    var doc = trial_name(s, "sg_illness");
    return "一切都从一次再寻常不过的体检开始。\n\n" +
      "你本以为只是走个流程，签字、抽血、几句寒暄。可复查通知来的时候，电话那头的语气，比平时多了一分谨慎。\n\n" +
      "主治医生" + doc + "把片子推到灯下，指尖在某个位置停了很久，才转过身：「指标有些问题，我们需要进一步确诊。你这个年纪，不能拖。」\n\n" +
      "诊室外的走廊很白，很长。你忽然听见自己的心跳。原来「重病」这两个字落到自己头上时，是没有背景音乐的——只有一片安静，和你攥皱了的那张报告单。";
  },
  choices: [
    { label: "马上做最全的检查，要治就治到底", effect: (s) => {
        var doc = trial_name(s, "sg_illness");
        flag(s, "saga_illness_s1"); flag(s, "illness_fight");
        add(s, "stress", 14); add(s, "mood", -10); add(s, "health", -4);
        var spend = trial_drain(s, 0.05, 20000);
        return "你没有让自己有时间崩溃。当天就预约了最全的检查，挂了专家号，把能查的都查了一遍。\n\n" +
          doc + "确诊的那一刻，你反而平静下来：「告诉我最坏的情况，也告诉我，怎么打这一仗。」\n\n" +
          "光是这一轮确诊和初步用药，就花掉了" + trial_wan(spend) + "。但你心里那根弦已经绷直——既然躲不掉，就正面接住它。这场仗，你要打，而且要赢。";
      } },
    { label: "先稳住情绪，悄悄查资料、不声张", effect: (s) => {
        flag(s, "saga_illness_s1"); flag(s, "illness_fight");
        add(s, "stress", 16); add(s, "mood", -8); add(s, "insight", 2);
        var head = trial_family(s)
          ? "你不想让家人陪你一起塌方。报告单被你叠好塞进抽屉，回家照常做饭、说笑，只是夜里睡不着，对着天花板查了一宿的资料。"
          : "你一个人坐在出租屋的地板上，把所有相关的资料、病例、治疗方案翻了个遍，直到天亮。一个人扛，是你早就习惯了的姿势。";
        return head + "\n\n" +
          "你把「确诊」「分期」「五年生存率」这些冰冷的词，一个一个查清楚。恐惧没有消失，但当你开始了解敌人，手就不再那么抖了。\n\n" +
          "你对自己说：先别怕，先弄明白。等你想清楚怎么打，再决定要不要让谁陪你一起。";
      } },
    { label: "这个年纪还能撑，保守观察、不折腾", effect: (s) => {
        flag(s, "saga_illness_s1"); flag(s, "illness_giveup");
        add(s, "stress", 8); add(s, "mood", -6); add(s, "health", -6);
        return "你本能地往后退了一步。\n\n" +
          "「也许没那么严重」「治这个得花多少钱啊」「先观察观察，实在不行再说」——你给自己找了一连串理由，把那张报告单压在了日历底下。\n\n" +
          "你不是不怕，是怕得不敢动。砸钱治病的窟窿、拖垮全家的画面，比病本身更让你喘不过气。于是你选择了最省事、也最危险的那条路：先拖着。日子照过，只是那行字，始终在你心口压着。";
      } }
  ]
});

/* —— 第2幕：钱从哪来，谁陪你扛 —— */
EVENTS.push({
  id: "ev_sagatrial_illness_s2", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_illness_s1") && !has(s, "saga_illness_s2") && s.age >= 35,
  title: "💸 一场和命、和钱的拉锯",
  text: (s) => {
    var doc = trial_name(s, "sg_illness");
    var head = has(s, "illness_giveup")
      ? "拖到后来，身体先撑不住了。一次半夜的剧烈不适，把你送进了急诊。" + doc + "看着新的片子，叹了口气：「再拖下去，真的来不及了。」由不得你了——这一仗，避无可避。"
      : "正式的治疗方案摆在了你面前。" + doc + "说得很坦诚：「有希望，但这是一场持久战。手术、化疗、靶向药、进口的、自费的……每一步，都是钱。」";
    var num = byClass(s, ["几十万", "几十万", "上百万", "数百万", "几百万对你不算什么，难的是另一些东西"]);
    return head + "\n\n" +
      "你这才真正掂量出这场病的分量：不是疼不疼的问题，是整个家撑不撑得住的问题。预估下来，要" + num + "。\n\n" +
      (trial_family(s)
        ? "家里的气氛变了。有人红着眼说「砸锅卖铁也治」，也有亲戚在饭桌上欲言又止，话里话外是「这钱填进去，万一……」。人情冷暖，在病房门口看得最清。"
        : "你环顾四周，才发现自己能依靠的，原来这么少。没有谁理所应当替你扛，这笔钱，得你自己想办法。") +
      "\n\n钱，到底从哪儿来？";
  },
  choices: [
    { label: "卖房卖车，倾家荡产也要治", effect: (s) => {
        flag(s, "saga_illness_s2"); flag(s, "illness_sellhouse");
        add(s, "stress", 16); add(s, "mood", -6); add(s, "health", 4); add(s, "insight", 2);
        var spend = trial_drain(s, 0.7, 200000);
        if (has(s, "house") || has(s, "has_house")) { s.flags["house"] = false; s.flags["has_house"] = false; }
        socialShift(s, 1);
        return "你做了最决绝的决定：卖。\n\n" +
          "房子挂了出去，车过了户，半生攒下的家底一笔笔变成了治疗费。签字的手很稳，心里却像被掏空了一块。\n\n" +
          "这一仗你押上了" + trial_wan(spend) + "和几乎全部的身家。" +
          (trial_family(s) ? "家人没拦你，反而把仅有的积蓄也凑了上来：「人没了，房子留着给谁住？」那一刻你忽然明白，有些东西比房子金贵得多。" : "你对自己说：活着，才有重来的本钱。房子没了可以再挣，命只有一条。") +
          "\n\n钱在燃烧，可你也在为了活下去，拼尽全力地烧。";
      } },
    { label: "发起网络众筹，向陌生人求一线生机", effect: (s) => {
        flag(s, "saga_illness_s2"); flag(s, "illness_crowdfund");
        add(s, "stress", 12); add(s, "mood", -2); add(s, "insight", 3);
        var raise = byClass(s, [180000, 150000, 90000, 40000, 20000]);
        add(s, "cash", raise);
        add(s, "reputation", -2);
        return "你犹豫了很久，还是把链接转了出去。\n\n" +
          "写求助文案的那个晚上，你删了又改——既要把病情说清楚，又怕显得太惨、太像在乞讨。把自己的脆弱摊给全世界看，比生病更难。\n\n" +
          "捐款一点点涨上来，有同学、同事，也有素不相识的陌生人留下一句「加油，一定会好的」。最终筹到了" + trial_wan(raise) + "。\n\n" +
          "也有冷言冷语：「房子不卖先来要钱？」你红着眼笑了笑，没辩解。人间确实有凉薄，可那一笔笔小小的善意，也实实在在把你往岸上拉了一把。";
      } },
    { label: "动用全部积蓄，自己扛、不连累别人", effect: (s) => {
        flag(s, "saga_illness_s2"); flag(s, "illness_savings");
        add(s, "stress", 14); add(s, "mood", -8); add(s, "health", 2);
        var spend = trial_drain(s, 0.55, 100000);
        return "你不想欠任何人,也不想把谁拖下水。\n\n" +
          "存款、理财、甚至给孩子留的那点教育金，你一笔笔取了出来，码成治疗费。账户的数字飞快地往下掉，每一次扣款，都像在身上割一刀。\n\n" +
          "这一程，你花掉了" + trial_wan(spend) + "，几乎掏空了自己。\n\n" +
          (trial_family(s) ? "你瞒着家里很多事，只说「钱够用」。深夜对着账单，你一个人把苦咽了下去——你想护住的，从来不只是自己的命，还有这个家的安稳。" : "没有人知道你账户里还剩多少，也没有人替你心疼。但你宁可这样——靠自己，至少摔下去的时候，不会拽倒别人。");
      } }
  ]
});

/* —— 第3幕（结局）：奇迹康复 / 人财两空 / 坦然走完 —— */
EVENTS.push({
  id: "ev_sagatrial_illness_s3", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_illness_s2") && !has(s, "saga_illness_done"),
  title: "🌅 漫长一仗，终见分晓",
  text: (s) => {
    var doc = trial_name(s, "sg_illness");
    var lead;
    if (has(s, "illness_sellhouse")) lead = "你押上了全部身家，把治疗一程一程地熬了下来。复查的日子，成了你最怕又最盼的日子。";
    else if (has(s, "illness_crowdfund")) lead = "靠着那笔东拼西凑的善款，你撑过了最凶险的几个疗程。每一次见效，你都在心里默默谢过那些素不相识的人。";
    else lead = "你独自扛着,把每一次治疗都当成一场不能输的考试。账户见了底,人也瘦了一圈,但你还在。";
    return lead + "\n\n" +
      "今天," + doc + "拿着最新的报告走进来，神情和确诊那天截然不同。漫长的拉锯走到了尽头。\n\n" +
      "这场和命运的硬仗，到了揭晓答案的时刻。";
  },
  choices: [
    { label: "迎接结果，相信自己挺过来了", effect: (s) => {
        var doc = trial_name(s, "sg_illness");
        flag(s, "saga_illness_done");
        // 努力救治者康复概率高；放弃/拖延者更可能恶化。
        var recoverP = has(s, "illness_giveup") ? 0.35 : 0.62;
        if (has(s, "illness_sellhouse")) recoverP += 0.1; // 砸钱治到底，概率更高
        if (rnd(recoverP)) {
          // —— 奇迹康复 ——
          flag(s, "illness_recovered");
          add(s, "health", 30); add(s, "mood", 18); add(s, "stress", -20); add(s, "insight", 5);
          socialShift(s, 2);
          return doc + "把报告递给你，第一次露出了笑：「指标都正常了。这一关，你过了。」\n\n" +
            "你愣了几秒，才反应过来——你活下来了。走出医院的那个清晨，阳光晃得你睁不开眼，连呼吸都是赚的。\n\n" +
            "钱花掉了大半，可你忽然不在乎了。劫后余生让你看清了什么才是要紧的：能陪家人吃一顿热饭，能看见明年的春天，原来就是天大的福气。\n\n" +
            "你把日子重新过得很慢、很认真。这场大病像一场洗礼——它差点带走你的一切，却也让你第一次，真正学会了珍惜。";
        }
        // —— 人财两空：钱没了，病情也没能挽回，拖垮全家 ——
        flag(s, "illness_lost");
        add(s, "health", -26); add(s, "mood", -16); add(s, "stress", 18);
        add(s, "network", -10);
        var more = trial_drain(s, 0.6, 50000);
        socialShift(s, -3);
        s.causeOfDeath = "久病缠身";
        s._deathRecap = "你和这场病死磕到了最后，花光了能花的每一分钱，也用尽了全身的力气。";
        var tail = trial_family(s)
          ? "家底掏空了，家人也跟着熬垮了——为了你，他们背上了债，熬红了眼。你最怕的不是病，是连累。可他们握着你的手说：「砸进去的不冤，你是我们的人。」"
          : "账户清零，身边也空了。你一个人面对四白的病房，最难的不是疼，是那份没人分担的孤独。";
        return doc + "的沉默，比任何话都重。\n\n" +
          "这一仗，你拼尽了全力，却没能赢。病情还是一步步压了过来,又掏走了" + trial_wan(more) + "。\n\n" + tail +
          "\n\n人财两空，是这世上最沉的四个字。你想留下，却拗不过命。能做的，只剩在所剩不多的日子里，把「谢谢」和「对不起」，好好说给在乎的人听。";
      } },
    { label: "若已尽力，便坦然——有尊严地走完这一程", effect: (s) => {
        var doc = trial_name(s, "sg_illness");
        flag(s, "saga_illness_done"); flag(s, "illness_peace");
        // 主动选择安宁、不再过度治疗：健康继续下滑，但心境平和；
        // 置「久病」死因与高致死暗伤，让引擎自然、有尊严地收尾。
        add(s, "mood", 6); add(s, "stress", -24); add(s, "health", -22); add(s, "insight", 6);
        if (!s.ailmentIds) s.ailmentIds = [];
        if (s.ailmentIds.indexOf("burnout") < 0) s.ailmentIds.push("burnout"); // 高 deathMod，加速自然收尾
        s.causeOfDeath = "安详离世";
        s._deathRecap = "你没有被病打败，是你选择了体面地放手。这一生有过病痛，更有过爱，你走得很安详。";
        var tail = trial_family(s)
          ? "你把家人叫到身边，一个一个交代，又一个一个道谢。你说：「别再为我砸钱了，把日子过好，就是替我活着。」那一晚，全家哭着笑，笑着哭。"
          : "你把后事一样样安排妥当，把那间小屋收拾得干干净净。没有谁需要你交代，于是你写了一封信，留给这个待过的世界。";
        return "你和" + doc + "长谈了一次，最终做了一个清醒而艰难的决定：不再用一管管药、一台台机器，去硬抢那点时间了。\n\n" +
          "你不是放弃，是看透了。与其在痛苦里被拖着走，你想要剩下的日子有质量、有尊严——能晒晒太阳，能好好告别。\n\n" + tail +
          "\n\n人这一生，来时不由己，去时能从容，已是了不起的福气。你按自己的方式，把最后一段路，走得很安静，很有光。";
      } }
  ]
});

/* =====================================================================
 * SAGA 2 ── 移民异乡扎根线  saga 名: emigrate   人物: s.sg_emigrate(异乡的牵线人/伙伴)
 * gate has(can_emigrate) || has(overseas) || classTier>=2
 * 第1幕 动了润的念头 → 第2幕 办身份、卖家当、语言关、文化隔阂、身份焦虑 →
 * 第3幕(结局) 成功扎根(emigrated) / 国际倒爷两头跑 / 黯然回流海归
 * 分支 flag：
 *   emig_allin(铁了心要走) / emig_hedge(留后路、试试水) —— 第1幕决心
 *   emig_struggle(语言/文化吃尽苦头) / emig_adapt(咬牙融入) —— 第2幕处境
 * ===================================================================== */

/* —— 第1幕：那个「走」的念头 —— */
EVENTS.push({
  id: "ev_sagatrial_emigrate_s1", module: "saga", ambient: true, once: true,
  cond: (s) => (has(s, "can_emigrate") || has(s, "overseas") || classTier(s) >= 2) && !has(s, "saga_emigrate_s1"),
  title: "✈️ 要不要，把根拔起来",
  text: (s) => {
    var who = trial_name(s, "sg_emigrate", "en");
    var head = has(s, "overseas")
      ? "你已经在海外漂了一阵子，租来的房子住了几年，却始终没敢说一句「我是这里人」。最近，一个念头越来越清晰：要不,就真的留下来,把户口、把后半生,都迁过来?"
      : "夜深人静的时候，那个念头总会冒出来：换个活法，去远方重新开始。\n\n社交平台上全是「润学」攻略，身边也总有人晒出登机牌。你算了算自己的家底和年纪，第一次认真地把「移民」两个字，摆到了桌面上。";
    return head + "\n\n" +
      "在海外的老友" + who + "给你发来消息：「这边空气好、节奏慢，孩子上学也松快。机会窗口就这几年，你要来，趁早。」\n\n" +
      "可你抬头看看窗外熟悉的街灯、楼下那家吃了二十年的早餐铺，心里又被狠狠拽了一下。走，是奔向新生；走，也是把半辈子的根，连泥带土地刨起来。这一步，迈还是不迈？";
  },
  choices: [
    { label: "铁了心：卖掉一切，举家奔赴新生活", effect: (s) => {
        flag(s, "saga_emigrate_s1"); flag(s, "emig_allin");
        add(s, "mood", 8); add(s, "stress", 12); add(s, "insight", 2);
        add(s, "network", -6);
        return "你不想再骑墙了。一旦下定决心，你反而踏实下来。\n\n" +
          "你开始一件件处理：辞了职、退了租、列出要卖的家当清单。把一段已经活顺了的人生主动按下停止键，需要的不是冲动，是孤注一掷的勇气。\n\n" +
          (trial_family(s) ? "你说服了家人，也说服了自己：「为了下一代，赌这一把。」" : "没有人需要你商量，这反倒让你走得干脆。") +
          "\n\n你对着空荡荡开始打包的家，深吸一口气。前路未知，但你已经把脸朝向了远方。";
      } },
    { label: "稳一点：留条后路，先去试试水", effect: (s) => {
        flag(s, "saga_emigrate_s1"); flag(s, "emig_hedge");
        add(s, "mood", 4); add(s, "stress", 8); add(s, "strategy", 2); add(s, "insight", 2);
        return "你天生不是头脑一热的人。\n\n" +
          "你决定给自己留条退路：国内的房子先不卖,工作请长假或挂着,先办个签证过去住上一阵,看看到底合不合得来。\n\n" +
          "「成了就扎根，不成就回来，损失不大。」你这样盘算，像是在做一笔风险可控的投资。可你也隐隐知道——脚踏两条船的人，往往两边都靠不了岸。但至少现在，你不必把所有筹码一次押光。\n\n" +
          "你订了一张单程到期可改的机票，把心，悬在了太平洋上空。";
      } },
    { label: "想想还是算了，故土难离", effect: (s) => {
        // 没下定决心：不开启 saga，留待日后再触发（不 flag saga_emigrate_s1）。
        add(s, "mood", 2); add(s, "insight", 2); add(s, "stress", -2);
        return "你把攻略一页页翻完，最后还是把手机扣在了桌上。\n\n" +
          "「人挪活，树挪死」的另一半，是「金窝银窝不如自己的狗窝」。语言不通、人生地不熟、爸妈在这边……一想到这些，那点冲动就凉了下来。\n\n" +
          "也许是时机未到，也许是根扎得太深。你对自己说：先把眼前的日子过好。远方那扇门，你没关死，只是今天，你选择留在熟悉的灯火里。";
      } }
  ]
});

/* —— 第2幕：异乡的下马威 —— */
EVENTS.push({
  id: "ev_sagatrial_emigrate_s2", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_emigrate_s1") && !has(s, "saga_emigrate_s2"),
  title: "🌍 落地之后，处处是关卡",
  text: (s) => {
    var who = trial_name(s, "sg_emigrate", "en");
    var spend = byClass(s, [120000, 120000, 300000, 500000, 800000]);
    if (!has(s, "overseas")) flag(s, "overseas"); // 已经踏上异乡的土地
    add(s, "cash", -spend);
    add(s, "stress", 10);
    var head = has(s, "emig_allin")
      ? "你真的来了。卖家当的钱、办身份的中介费、第一笔房租押金……" + trial_wan(spend) + "像流水一样花了出去。站在异国的机场，你拖着两个大箱子，箱子里装着一整个搬不走的故乡。"
      : "你拎着试水的行李落了地。租房、保险、各种你听都没听过的手续，七七八八也花掉了" + trial_wan(spend) + "。" + who + "来接你，一路上你贪婪地看着窗外，又有点恍惚。";
    return head + "\n\n" +
      "新鲜劲只持续了几天，下马威就接踵而至。\n\n" +
      "去办身份，材料被打回来三次，移民官公事公办的脸让你手心冒汗；去超市买菜，听不懂收银员的玩笑，只能尴尬地陪笑；想找份对口的工作，对方礼貌地说「你的资历我们这边不认」。\n\n" +
      "夜里你站在陌生的阳台上，远处是看不懂的霓虹。语言、身份、文化，像三堵墙，把你和这片土地隔开。你第一次尝到「异乡人」三个字的重量——它不疼，但无处不在。";
  },
  choices: [
    { label: "豁出去：从头学语言、拼命往里融", effect: (s) => {
        flag(s, "saga_emigrate_s2"); flag(s, "emig_adapt");
        add(s, "stress", 14); add(s, "mood", -4); add(s, "knowledge", 3); add(s, "charm", 2); add(s, "insight", 3);
        socialShift(s, 1);
        return "你决定不当那个躲在同胞圈里、永远长不大的「巨婴移民」。\n\n" +
          "你报了语言班，舌头打着结也要开口；你硬着头皮参加邻居的聚会，记下每一个名字；你放下身段，从一份不那么体面的工作做起。被纠正发音、被善意地笑、被无意地忽略——你都咽下去，第二天接着上。\n\n" +
          "融入是一场没有捷径的苦修。你像一棵被移栽的树，先得在陌生的土里，一根一根重新长出须根。疼，但你能感觉到，自己正在往下扎。";
      } },
    { label: "守住自己的圈子，能过就行", effect: (s) => {
        flag(s, "saga_emigrate_s2"); flag(s, "emig_struggle");
        add(s, "stress", 12); add(s, "mood", -8); add(s, "insight", 2);
        add(s, "network", -4);
        return "墙太高了，你累了，也就不再硬撞。\n\n" +
          "你缩回了华人超市、同乡微信群、家乡口味的餐馆构成的小世界里。在这里你重新做回了那个能说会道的自己——只是出了这个圈，你依旧是个听不懂笑话、看不懂表格的「外人」。\n\n" +
          "日子是能过，可那种悬浮感始终散不去：身在异乡，根在故土，你像活在两个世界中间的一道缝里。逢年过节，朋友圈里的国内热闹得不像话，你对着时差，一个人吃一顿没什么味道的年夜饭。乡愁这东西，原来是会在最普通的夜里，突然把你淹没的。";
      } },
    { label: "顶着身份焦虑，咬牙先把饭碗端稳", effect: (s) => {
        flag(s, "saga_emigrate_s2"); flag(s, "emig_struggle");
        add(s, "stress", 16); add(s, "mood", -6); add(s, "strategy", 2); add(s, "body", -2);
        var earn = byClass(s, [60000, 60000, 90000, 120000, 150000]);
        add(s, "cash", earn);
        return "身份还没着落，焦虑像影子一样跟着你，但你顾不上矫情——先得活下去。\n\n" +
          "你抓住了一份能糊口的工作，起早贪黑，把时差和疲惫都熬成了麻木。语言不够好，你就用勤快补；人脉是零，你就一单一单慢慢攒。这一程，总算挣回了" + trial_wan(earn) + "，让钱包没那么吓人了。\n\n" +
          "可身份这块石头始终压在心口：续签、排期、政策一变就前功尽弃。你像在流沙上盖房子，使着十二分的力气，却不知道哪天会被打回原形。这种悬而未决的飘，是移民最磨人的暗刑。";
      } }
  ]
});

/* —— 第3幕（结局）：扎根 / 国际倒爷 / 黯然回流 —— */
EVENTS.push({
  id: "ev_sagatrial_emigrate_s3", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_emigrate_s2") && !has(s, "saga_emigrate_done"),
  title: "🪴 几年以后，根扎在了哪里",
  text: (s) => {
    var who = trial_name(s, "sg_emigrate", "en");
    var lead = has(s, "emig_adapt")
      ? "几年下来，你的语言能接住玩笑了，邻居会喊你的名字，身份的事也终于有了眉目。那棵被移栽的树，须根总算抓住了新的土。"
      : "几年过去，你还卡在那道缝里。日子在过，心却始终没能落地。每一次填表写下「现居地址」，你都恍惚——这里，到底算不算家？";
    return lead + "\n\n" +
      who + "约你喝了次咖啡，问了那个你躲了很久的问题：「想好了吗，往后……你的根，到底要扎在哪儿？」\n\n" +
      "故乡和异乡，在你心里来回拉锯了无数遍。是时候，给这段漂泊一个答案了。";
  },
  choices: [
    { label: "扎下去：这里就是新的家，落叶生根", effect: (s) => {
        var who = trial_name(s, "sg_emigrate", "en");
        flag(s, "saga_emigrate_done"); flag(s, "emig_rooted");
        flag(s, "emigrated"); flag(s, "overseas");
        // 融入者顺理成章；挣扎者也可强行扎根，但代价更大
        if (has(s, "emig_adapt")) { add(s, "mood", 16); add(s, "stress", -16); add(s, "network", 8); add(s, "charm", 2); }
        else { add(s, "mood", 8); add(s, "stress", -8); add(s, "network", 4); }
        add(s, "insight", 4);
        socialShift(s, 2);
        return "你拿到了那张盼了很久的身份纸。签字的那一刻，你忽然没有想象中那么激动，只是长长地、长长地舒了一口气。\n\n" +
          "你成了这片土地上的「新移民」。会做几道地道的本地菜，也守着家乡的年味；说着带口音的外语，也教孩子认方块字。你不再纠结自己是哪里人——你哪里人都是,又哪里人都不全是。\n\n" +
          "故乡成了回不去、却也忘不掉的远方;异乡成了脚下踏实、慢慢长出感情的现在。落叶生根从不是忘本,而是带着来处,坦然地活在新的土壤里。\n\n" +
          "这条路你走得磕磕绊绊，但回头看，你为自己、为家人，挣来了一个想要的人生。";
      } },
    { label: "两头跑：当个「国际倒爷」，哪边好往哪走", effect: (s) => {
        flag(s, "saga_emigrate_done"); flag(s, "emig_nomad");
        flag(s, "overseas"); // 海外有据点，但不彻底扎根
        add(s, "mood", 4); add(s, "stress", 10); add(s, "strategy", 3); add(s, "network", 6); add(s, "insight", 3);
        var earn = byClass(s, [80000, 80000, 200000, 500000, 1200000]);
        add(s, "cash", earn);
        add(s, "body", -3);
        return "你想通了：何必非要二选一？\n\n" +
          "你既没彻底扎根，也没真的回去，而是把两边都变成了据点——这边的身份、那边的资源，倒来倒去，居然让你摸出了门道。带货、做中介、牵线搭桥，靠着「两头通吃」，你这一程进账" + trial_wan(earn) + "。\n\n" +
          "机场成了你的第二个家，时差成了家常便饭。朋友半开玩笑叫你「国际倒爷」，你也乐得自嘲。\n\n" +
          "代价是,你哪边都没能真正地「待着」。身体在飞机上耗着,心在两片土地之间荡着,问起「家在哪」,你总要愣一下。但你认了——有人要的是安稳的根,你要的是流动的自由,这何尝不是一种活法。";
      } },
    { label: "回流：故土难离，当个「海归」重新开始", effect: (s) => {
        flag(s, "saga_emigrate_done"); flag(s, "emig_return");
        s.flags["overseas"] = false; s.flags["emigrated"] = false;
        add(s, "mood", 6); add(s, "stress", -10); add(s, "insight", 4); add(s, "charm", 1);
        // 折腾一场，元气有损，但回到熟悉的网络里
        add(s, "network", 6);
        var loss = byClass(s, [40000, 40000, 100000, 200000, 400000]);
        add(s, "cash", -loss);
        socialShift(s, 1);
        return "你终究还是订了回程的机票。\n\n" +
          "不是输了，是你想明白了：那道语言的墙、文化的缝、夜里没人懂的乡愁，比你能扛的更重。你不想用余生去拼命融进一个始终把你当客人的地方。\n\n" +
          "来回折腾，前前后后亏掉了" + trial_wan(loss) + "，也搭进去好几年光阴。落地那天，熟悉的味道、听得懂的乡音、楼下那家还在的早餐铺，让你眼眶一热——原来这就是「回家」的感觉。\n\n" +
          "顶着「海归」的名头，你重新出发。这一趟没有白走:你见过更大的世界,也终于确认了自己的根在哪里。带着这份清醒，重新开始，一点都不晚。";
      } }
  ]
});
