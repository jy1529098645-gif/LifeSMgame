"use strict";
/* =====================================================================
 * content/events-saga-fortune.js —— 内容模块：多幕连续剧式戏剧事件（saga）
 * ---------------------------------------------------------------------
 * 经典 <script>，运行在全局作用域。直接向核心层已定义的全局 EVENTS 数组
 * 追加事件（EVENTS.push({...})）。复用全局 helper：
 *   add / flag / has / pick / rnd / byClass / classTier / shuf /
 *   socialShift / socialBoostRole / bumpMomentum / genName。
 *
 * saga = 跨越多年、层层升级、最后大爆发的剧情线，flag 串联，
 *   引擎会优先推进 module:"saga"。本文件写两条 saga：
 *     1) windfall —— 暴富·守不守得住线
 *     2) ruin     —— 归零·东山再起线
 * 内部辅助函数前缀 fort_；事件 id 前缀 ev_sagafort_。
 * ===================================================================== */

// —— 内部辅助：金额本地化 ——
function fort_money(n) {
  const v = Math.round(n);
  if (Math.abs(v) >= 100000000) return (v / 100000000).toFixed(2).replace(/\.00$/, "") + "亿";
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  return "¥" + v.toLocaleString();
}
// —— 内部辅助：拿/存关键人物名 ——
function fort_name(s, key) {
  if (!s["sg_" + key]) s["sg_" + key] = genName("cn", "男");   // 本线以「他」称呼，固定男性名免错位
  return s["sg_" + key];
}

/* =====================================================================
 * SAGA 一、windfall —— 暴富·守不守得住线（3 幕）
 * ===================================================================== */

// —— 第1幕：横财从天而降 ——
EVENTS.push({
  id: "ev_sagafort_windfall_s1",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => s.age >= 26 && s.age <= 60 && !has(s, "saga_windfall_s1") && !has(s, "saga_windfall_done"),
  title: "💰 天上真的掉下了馅饼",
  text: (s) => {
    const kind = (s.drift || Math.random() * 3) % 3;
    if (kind < 1) return "拆迁办的红头文件拍在你家旧屋的门框上时，你正端着一碗没吃完的面。「整体征收，按面积加产权置换。」邻居老张挤过来，声音发颤：「你家这老破小……要发了啊！」你愣在原地，半碗面凉透了都没察觉——那间漏雨的老房子，要变成一串你这辈子都没敢想的数字。";
    if (kind < 2) return "彩票站老板第三次核对那张被你攥皱的纸，手都在抖：「先生，您……您这是一等奖。」屏幕上那串红色数字像在烧你的眼睛。你扶着柜台，腿一软。门口排队的人不知发生了什么，只看见你笑着笑着，眼泪就下来了。";
    return "一封盖着公证处钢印的挂号信，把一个你几乎没印象的名字带回你的人生——那位旅居海外、终身未婚的远房舅公走了，律师函上白纸黑字写着：你是唯一的遗产继承人。一栋老洋房、几个账户、还有一柜子你看不懂的票据。";
  },
  choices: [
    { label: "稳住！先一个人静静，别声张", effect: (s) => {
        const base = byClass(s, { poor: 2800000, mid: 5000000, rich: 12000000 });
        const gain = Math.round(base * (0.85 + Math.random() * 0.6));
        add(s, "assets", gain);
        add(s, "mood", 22); add(s, "stress", 8);
        flag(s, "saga_windfall_s1");
        flag(s, "saga_windfall_cool");
        fort_name(s, "wf_relative");
        return `你把消息死死压在心里，连夜失眠数着那笔 ${fort_money(gain)} 的横财。第二天照常去上班，假装什么都没发生——你比谁都清楚，钱一旦见了光，人心就会跟着变。这份冷静，日后会救你一命。`;
      } },
    { label: "太爽了！发朋友圈、请全村吃席", effect: (s) => {
        const base = byClass(s, { poor: 2800000, mid: 5000000, rich: 12000000 });
        const gain = Math.round(base * (0.85 + Math.random() * 0.6));
        add(s, "assets", gain);
        add(s, "cash", -Math.round(gain * 0.02));
        add(s, "mood", 30); add(s, "reputation", 6); add(s, "network", 10); add(s, "stress", -4);
        socialShift(s, 8);
        flag(s, "saga_windfall_s1");
        flag(s, "saga_windfall_show");
        fort_name(s, "wf_relative");
        return `你摆了三十桌流水席，鞭炮放了半条街，朋友圈九宫格配文「努力的人运气不会太差」。一夜之间你成了方圆十里的名人，平时不来往的远亲都加上了你微信。${fort_money(gain)} 进账，风光无两——可你没注意到，有些目光，已经悄悄黏上了你的钱包。`;
      } },
    { label: "立刻找银行、律师，做资产规划", effect: (s) => {
        const base = byClass(s, { poor: 2800000, mid: 5000000, rich: 12000000 });
        const gain = Math.round(base * (0.85 + Math.random() * 0.6));
        add(s, "assets", gain);
        add(s, "cash", -20000);
        add(s, "mood", 16); add(s, "stress", 4); add(s, "insight", 4);
        flag(s, "saga_windfall_s1");
        flag(s, "saga_windfall_plan");
        fort_name(s, "wf_relative");
        return `还没等高兴劲过去，你就拎着材料挂了私行的号、约了执业律师。信托、税务、隔离账户……一套规划做下来花了两万咨询费，却把这 ${fort_money(gain)} 牢牢焊进了制度的笼子里。「富不过三代」的诅咒，你打算从第一天就拆掉。`;
      } }
  ]
});

// —— 第2幕：闻风而来 / 飘了 ——
EVENTS.push({
  id: "ev_sagafort_windfall_s2",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_windfall_s1") && !has(s, "saga_windfall_s2") && !has(s, "saga_windfall_done") && s.age >= 28,
  title: "🦈 钱的味道，引来了所有人",
  text: (s) => {
    const rel = fort_name(s, "wf_relative");
    return `暴富的消息终究藏不住。先是多年不联系的${rel}哭着登门借钱治病，接着是同学群里突然热络的「好项目」，再然后，一个西装革履、自称做「区块链量化私募」的陌生人，递来一张烫金名片，张口就是「年化 30%，保本」。手机一天响一百遍。你忽然分不清，谁是冲你来的，谁是冲钱来的。`;
  },
  choices: [
    { label: "谁的钱都不借，谁的项目都不投", effect: (s) => {
        add(s, "mood", -10); add(s, "reputation", -10); add(s, "network", -12); add(s, "stress", 10);
        socialShift(s, -10);
        flag(s, "saga_windfall_s2");
        flag(s, "saga_windfall_guard");
        const rel = fort_name(s, "wf_relative");
        return `你把心一横，对所有伸来的手说了「不」。${rel}摔门而去，背后骂你「有钱了就六亲不认」；老同学拉黑了你；那个私募经理冷笑着说你「不懂行、活该穷一辈子」。你成了亲戚口中的「铁公鸡」，孤独，却守住了本金——多年后你才知道，那个「保本私募」三个月后就爆雷跑路了。`;
      } },
    { label: "亲戚的借、项目的投，来者不拒", effect: (s) => {
        const out = Math.round((s.assets || 0) * (0.35 + Math.random() * 0.25));
        add(s, "assets", -out);
        add(s, "mood", 8); add(s, "reputation", 12); add(s, "network", 18); add(s, "stress", 14);
        socialShift(s, 6);
        flag(s, "saga_windfall_s2");
        flag(s, "saga_windfall_loose");
        const rel = fort_name(s, "wf_relative");
        return `你做了「大方人」。给${rel}打了医药费，给同学的项目注了资，还把一大笔钱交给那位私募经理「钱生钱」。前后 ${fort_money(out)} 流水般出去，换来一片「仗义」的赞誉，朋友圈点赞如潮。你飘飘然地觉得，自己天生就是当老板的料——殊不知，有人正等着你这句话。`;
      } },
    { label: "投，但只投自己看得懂的，且立字据", effect: (s) => {
        const out = Math.round((s.assets || 0) * 0.18);
        add(s, "assets", -out);
        add(s, "mood", 4); add(s, "reputation", 6); add(s, "network", 8); add(s, "stress", 6); add(s, "strategy", 4);
        flag(s, "saga_windfall_s2");
        flag(s, "saga_windfall_smart");
        return `你不当圣人也不当冤大头。亲戚的钱，借可以，借条按手印；项目，只投自己跑过、看得懂的实体；那个「保本量化」被你一句「保本的写进合同敢吗」当场问退。你拿出 ${fort_money(out)} 试水，留足了安全垫。聪明钱，从来都是又稳又狠。`;
      } }
  ]
});

// —— 第3幕（结局）：守住 / 归零 / 半守半失 ——
EVENTS.push({
  id: "ev_sagafort_windfall_s3",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_windfall_s2") && !has(s, "saga_windfall_done") && s.age >= 31,
  title: "🎬 大结局：这泼天的富贵，你接住了吗",
  text: (s) => "几年浮沉，尘埃落定。当年那笔从天而降的横财，有人靠它修成了豪门，有人把它败成了笑话。命运把账本推到你面前——是时候算总账了。",
  choices: [
    { label: "复盘这些年，决定最后一搏", effect: (s) => {
        flag(s, "saga_windfall_done");
        const guard = has(s, "saga_windfall_guard") || has(s, "saga_windfall_cool") || has(s, "saga_windfall_plan");
        const smart = has(s, "saga_windfall_smart");
        const loose = has(s, "saga_windfall_loose") || has(s, "saga_windfall_show");

        // 守得稳的人：成豪门
        if ((guard || smart) && !loose && rnd(0.75)) {
          const boom = Math.round((s.assets || 0) * (0.8 + Math.random() * 0.9)) + 3000000;
          add(s, "assets", boom);
          add(s, "mood", 26); add(s, "reputation", 18); add(s, "network", 16); add(s, "stress", -10);
          add(s, "strategy", 6); add(s, "insight", 5);
          socialShift(s, 14); bumpMomentum(s, 12);
          return `你把守住的本金压进了一处早就看好的核心资产，又赶上一轮上行。账户像滚雪球一样膨胀，资产再翻一番，净增 ${fort_money(boom)}。当年笑你「铁公鸡」的人，如今排队求你带飞。从横财到家业，你完成了最难的一跳——守得住，才配叫真的富。`;
        }

        // 飘了乱投资的人：被掏空挥霍归零
        if (loose && rnd(0.7)) {
          const wipe = Math.round((s.assets || 0) * (0.9 + Math.random() * 0.1));
          add(s, "assets", -wipe);
          add(s, "cash", -Math.round((s.cash || 0) * 0.6));
          add(s, "mood", -30); add(s, "reputation", -20); add(s, "network", -25); add(s, "stress", 26);
          add(s, "health", -10);
          socialShift(s, -20); bumpMomentum(s, -14);
          flag(s, "saga_windfall_busted");
          const rel = fort_name(s, "wf_relative");
          return `保本私募卷款跑路，公安立案却追不回钱；借出去的款全成了肉包子打狗，${rel}早换了号码；自己折腾的「大生意」血本无归。短短几年，${fort_money(wipe)} 灰飞烟灭，你又回到了起点，甚至更糟——还背上了债。流水席上的笑脸，一张都找不到了。这场富贵，像一场你睡过头的梦。`;
        }

        // 半守半失：看前面怎么选
        const mid = Math.round((s.assets || 0) * (0.3 + Math.random() * 0.3));
        if (rnd(0.5)) {
          add(s, "assets", mid); add(s, "mood", 10); add(s, "reputation", 6); add(s, "stress", 4);
          bumpMomentum(s, 4);
          return `有赚有亏，有得有失。投出去的钱一半打了水漂，一半意外开了花，七拐八绕，你净赚了 ${fort_money(mid)}。算不上豪门，但比横财来之前阔气得多。你学会了一件事：钱来得太容易，反而最难守——你勉强及格了。`;
        }
        add(s, "assets", -mid); add(s, "mood", -12); add(s, "stress", 12); add(s, "network", -8);
        bumpMomentum(s, -4);
        return `也曾风光，也曾踩坑。几番折腾下来，那笔横财缩水了 ${fort_money(mid)}，剩下的还够你过得体面，但当年那种「改命」的气势，早被消磨得七七八八。你守住了一半，也亏掉了一半——人生的运气，原来是有定额的。`;
      } },
    { label: "金盆洗手，把钱变成最安稳的样子", effect: (s) => {
        flag(s, "saga_windfall_done");
        const safe = has(s, "saga_windfall_loose") || has(s, "saga_windfall_show");
        if (safe) {
          // 已经飘过的人，及时收手只能止损
          const left = Math.round((s.assets || 0) * 0.35);
          add(s, "assets", -Math.round((s.assets || 0) * 0.4));
          add(s, "mood", -8); add(s, "stress", 6); add(s, "insight", 4);
          return `你后知后觉地踩了刹车，把剩下能收回的钱全换成了存款和自住房。账面虽然又缩了一截，但好歹保住了 ${fort_money(left)} 左右的底子。你苦笑着想：要是一开始就这么清醒，何至于交这么贵的学费。亡羊补牢，犹未晚也。`;
        }
        add(s, "mood", 14); add(s, "stress", -14); add(s, "health", 6); add(s, "insight", 5);
        bumpMomentum(s, 6);
        return `你拒绝了所有「钱生钱」的诱惑，把横财换成核心地段的房、稳健的债券和给孩子留的教育金，然后回归平静生活。没有暴富神话的高潮，却也再没有暴雷归零的惊吓。你用一生的安稳，赢下了这场考试——这泼天富贵，你稳稳接住了。`;
      } }
  ]
});

/* =====================================================================
 * SAGA 二、ruin —— 归零·东山再起线（4 幕）
 * ===================================================================== */

// —— 第1幕：灾难倾家荡产 ——
EVENTS.push({
  id: "ev_sagafort_ruin_s1",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => s.age >= 28 && s.age <= 62 && (s.cash || 0) + (s.assets || 0) > 200000 && !has(s, "saga_ruin_s1") && !has(s, "saga_ruin_done"),
  title: "💥 一夜之间，天塌了",
  text: (s) => {
    const kind = (s.drift || Math.random() * 2) % 2;
    const partner = fort_name(s, "ruin_culprit");
    if (kind < 1) return `多年的老友${partner}红着眼眶找上门，说就差一笔过桥贷款公司就能上市，求你做个担保「走个形式，签个字而已」。念着十几年的交情，你签了。三个月后，催收的电话打爆了你的手机——${partner}人去楼空，几百万的债，连本带息，全压在了为ta担保的你头上。`;
    return `你和${partner}一起打拼多年的公司，账上突然空了。财务、公章、客户资料、连同${partner}本人，一夜之间全部消失。供应商堵在门口，员工围着你要工资，银行抽贷的函像雪片一样飞来。你翻遍每一个账户，才惊觉自己被最信任的合伙人，掏了个底朝天。`;
  },
  choices: [
    { label: "扛！变卖一切，先把窟窿堵上", effect: (s) => {
        const debt = byClass(s, { poor: 600000, mid: 2500000, rich: 8000000 });
        const had = (s.cash || 0) + (s.assets || 0);
        add(s, "cash", -(s.cash || 0));
        add(s, "assets", -(s.assets || 0));
        add(s, "overdraft", byClass(s, { poor: 24, mid: 38, rich: 52 }));
        add(s, "mood", -32); add(s, "stress", 30); add(s, "health", -14); add(s, "reputation", -8);
        flag(s, "saga_ruin_s1");
        flag(s, "saga_ruin_honor");
        return `你卖了房、卖了车、退了保险，掏空了每一个能掏的口袋，把 ${fort_money(debt)} 的窟窿往里填。一辈子的积蓄,清零；多出来的债，记在你头上。妻子/丈夫红着眼帮你打包搬家，孩子还不懂为什么要离开学校。你站在空荡的旧屋里，第一次尝到什么叫「一夜回到解放前」。但你挺直了腰：欠的，我认。`;
      } },
    { label: "拖！能拖一天是一天，先躲风头", effect: (s) => {
        const debt = byClass(s, { poor: 600000, mid: 2500000, rich: 8000000 });
        add(s, "assets", -Math.round((s.assets || 0) * 0.5));
        add(s, "overdraft", byClass(s, { poor: 30, mid: 48, rich: 62 }));
        add(s, "mood", -24); add(s, "stress", 26); add(s, "health", -8); add(s, "reputation", -16);
        socialShift(s, -10);
        flag(s, "saga_ruin_s1");
        flag(s, "saga_ruin_dodge");
        return `你不甘心就这么交出半生家当，开始和催收周旋——换号码、关定位、半夜搬家。日子是拖住了，可债务利滚利越来越大，你被列进了失信名单，高铁飞机都坐不了。 ${fort_money(debt)} 像座山压着，你睡觉都睁着一只眼。这场仗，才刚刚开始，你就已经满身是泥。`;
      } },
    { label: "拼！绝不认栽，报警、打官司讨说法", effect: (s) => {
        const debt = byClass(s, { poor: 600000, mid: 2500000, rich: 8000000 });
        add(s, "cash", -Math.round((s.cash || 0) * 0.8));
        add(s, "assets", -Math.round((s.assets || 0) * 0.7));
        add(s, "overdraft", byClass(s, { poor: 26, mid: 42, rich: 56 }));
        add(s, "mood", -22); add(s, "stress", 24); add(s, "health", -10); add(s, "strategy", 4);
        flag(s, "saga_ruin_s1");
        flag(s, "saga_ruin_fight");
        const partner = fort_name(s, "ruin_culprit");
        return `你连夜报了案，请了最好的律师，誓要把${partner}揪出来。可法律的齿轮转得太慢，对方早把财产转移得干干净净。律师费、诉讼费像无底洞，你边打官司边被债主追，两线作战，几乎被拖垮。 ${fort_money(debt)} 的损失能不能追回还是未知，但你认定一件事：宁可站着输，绝不跪着活。`;
      } }
  ]
});

// —— 第2幕：谷底求生，众人嘴脸 ——
EVENTS.push({
  id: "ev_sagafort_ruin_s2",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_ruin_s1") && !has(s, "saga_ruin_s2") && !has(s, "saga_ruin_done") && s.age >= 29,
  title: "🕳️ 跌到谷底，才看清人心",
  text: (s) => {
    const friend = fort_name(s, "ruin_friend");
    return `落难之后，世界换了张脸。曾经称兄道弟的酒肉朋友躲着你走，亲戚聚会没人再叫你，连孩子在学校都被指指点点。唯一还接你电话的，是当年最不起眼的旧同事${friend}。深夜的出租屋里，你盯着天花板，一个声音在心里反复响起：要不……找个没人认识的地方，把债一甩，重新开始？`;
  },
  choices: [
    { label: "去！送外卖、摆地摊，弯下腰从头来", effect: (s) => {
        add(s, "cash", 40000);
        add(s, "mood", 6); add(s, "stress", -6); add(s, "health", -6); add(s, "body", 4); add(s, "reputation", 8);
        add(s, "overdraft", -Math.round((s.overdraft || 0) * 0.15));
        flag(s, "saga_ruin_s2");
        flag(s, "saga_ruin_grind");
        return `你把面子摘下来揣进兜里，白天送外卖，晚上摆地摊，凌晨去批发市场进货。手磨出了茧，腰累得直不起来，可每还上一笔债，心里就踏实一分。有人认出你冷嘲热讽，你只是低头继续干。谷底没有更低了，往哪走都是向上——你开始一寸一寸往回爬。`;
      } },
    { label: "撑：联系债主，谈分期、求宽限", effect: (s) => {
        add(s, "mood", -4); add(s, "stress", -10); add(s, "strategy", 4); add(s, "charm", 3);
        add(s, "overdraft", -Math.round((s.overdraft || 0) * 0.1));
        flag(s, "saga_ruin_s2");
        flag(s, "saga_ruin_nego");
        return `你没躲，反而主动约债主吃饭，掏心掏肺地谈分期、谈减免、谈一个让大家都能活的方案。出乎意料，大多数人吃硬不吃软，倒吃你这套坦诚——「你这人，还算有担当。」压力松了一截，债务重组成了一张能喘气的时间表。会做人，有时比会赚钱更值钱。`;
      } },
    { label: "逃：换个城市改名换姓，债不还了", effect: (s) => {
        add(s, "cash", 20000);
        add(s, "mood", -10); add(s, "stress", 8); add(s, "reputation", -24); add(s, "network", -20);
        add(s, "overdraft", -Math.round((s.overdraft || 0) * 0.3));
        socialShift(s, -16);
        flag(s, "saga_ruin_s2");
        flag(s, "saga_ruin_run");
        return `你买了张单程票，去了一座谁都不认识你的城市，用现金、不留痕迹。债务像甩掉了一半，可你也甩掉了过去的整个自己——不敢用真名，不敢回老家，逢年过节连个能打的电话都没有。逃得过债主，逃不过半夜惊醒时，那个问自己「值不值」的声音。`;
      } }
  ]
});

// —— 第3幕：转机的岔路口 ——
EVENTS.push({
  id: "ev_sagafort_ruin_s3",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_ruin_s2") && !has(s, "saga_ruin_s3") && !has(s, "saga_ruin_done") && s.age >= 31,
  title: "🌗 转机，悄悄敲了门",
  text: (s) => {
    const friend = fort_name(s, "ruin_friend");
    return `咬牙挺过最难的那几年后，转机以最不起眼的样子出现了：${friend}带来一个小生意的机会，本钱不多，但路子是对的。同时，一个老主顾看中了你这些年攒下的口碑，想和你长期合作。机会就在眼前，可你手里几乎一无所有——是搏一把，还是稳着来，又或者，你早已没了那股气？`;
  },
  choices: [
    { label: "押上全部身家，干一票大的", effect: (s) => {
        add(s, "mood", 8); add(s, "stress", 16); add(s, "strategy", 5);
        flag(s, "saga_ruin_s3");
        flag(s, "saga_ruin_allin");
        return "你把这些年从牙缝里抠出来的本钱、能借的人情、最后一点信用额度，全押了上去。没有退路，反而让你眼神发亮。签下合同那天你手在抖，不是因为怕，是因为太久没有这种「赌徒」的兴奋——成王败寇，就看这一把。";
      } },
    { label: "稳扎稳打，从小做起、滚动发展", effect: (s) => {
        add(s, "cash", 30000);
        add(s, "mood", 6); add(s, "stress", -6); add(s, "knowledge", 4); add(s, "insight", 4);
        flag(s, "saga_ruin_s3");
        flag(s, "saga_ruin_steady");
        return "经历过一夜归零，你再不敢把鸡蛋放一个篮子。你接下机会，却只投自己能承受的那部分，一单一单做，一分一分攒，绝不冒进。慢是慢了点，可每一步都踩得实。你告诉自己：这次，要的是活得久，不是死得壮烈。";
      } },
    { label: "算了吧……我已经爬不动了", effect: (s) => {
        add(s, "mood", -14); add(s, "stress", 6); add(s, "health", -6);
        flag(s, "saga_ruin_s3");
        flag(s, "saga_ruin_giveup");
        return "机会摆在面前，你却第一次感到，那个敢闯敢拼的自己，好像在那场灾难里就死掉了。你婉拒了，理由说得很体面，心里却清楚：你怕了。被坑过一次的人，最难的不是没钱，是再也不敢相信「会变好」。你缩回了壳里。";
      } }
  ]
});

// —— 第4幕（结局）：王者归来 / 潦倒 / 归隐 ——
EVENTS.push({
  id: "ev_sagafort_ruin_s4",
  module: "saga",
  ambient: true,
  once: true,
  cond: (s) => has(s, "saga_ruin_s3") && !has(s, "saga_ruin_done") && s.age >= 34,
  title: "🎬 大结局：从废墟里，你站起来了吗",
  text: (s) => "又是好几年。当年那场把你打到尘埃里的灾难，如今成了别人口中的传奇，或是笑谈。命运再一次把账本推到你面前——这一回，你是赢家，还是输家？",
  choices: [
    { label: "面对结局，做最后的了断", effect: (s) => {
        flag(s, "saga_ruin_done");
        const up = has(s, "saga_ruin_grind") || has(s, "saga_ruin_nego");
        const honor = has(s, "saga_ruin_honor") || has(s, "saga_ruin_fight");
        const giveup = has(s, "saga_ruin_giveup");
        const allin = has(s, "saga_ruin_allin");
        const run = has(s, "saga_ruin_run");

        // 王者归来：努力 + 没躺平 + 体面担过 → 成功
        if (up && !giveup && (honor || allin) && rnd(allin ? 0.65 : 0.75)) {
          const fortune = byClass(s, { poor: 4000000, mid: 9000000, rich: 22000000 });
          const boom = Math.round(fortune * (0.8 + Math.random() * 0.8));
          add(s, "overdraft", -(s.overdraft || 0));
          add(s, "assets", boom);
          add(s, "mood", 32); add(s, "reputation", 26); add(s, "network", 24); add(s, "stress", -16);
          add(s, "strategy", 8); add(s, "insight", 6); add(s, "health", 4);
          socialShift(s, 20); bumpMomentum(s, 16);
          const friend = fort_name(s, "ruin_friend");
          return `你赌对了，也熬到了。那个小生意被你做成了行业里数得上号的牌子，债，一笔不少地全还清了，连当年帮过你的${friend}都成了你的合伙人。如今再有人提起那场灾难，都说你是「打不死的」。净赚 ${fort_money(boom)}，比跌倒前更高。废墟之上，王者归来——这才是最痛快的复仇。`;
        }

        // 一蹶不振：躺平 / 逃跑 / allin 失败 → 潦倒
        if (giveup || run || (allin && rnd(0.6))) {
          add(s, "cash", -Math.round((s.cash || 0) * 0.5));
          add(s, "mood", -20); add(s, "stress", 14); add(s, "health", -12); add(s, "reputation", -10); add(s, "network", -12);
          socialShift(s, -12); bumpMomentum(s, -8);
          flag(s, "saga_ruin_down");
          return `时间没有奖励你。要么是那股劲儿再也没回来，要么是孤注一掷又输得精光，要么是逃避换来一辈子的提心吊胆。你活成了亲戚口中「那个当年破产、再没起来」的反面教材，靠打零工和低保过着将就的日子。有些人跌一跤就再没站起来——很遗憾，这次是你。`;
        }

        // 看破红尘归隐：稳着来 / 谈判 → 不大富，但通透
        const calm = byClass(s, { poor: 500000, mid: 1500000, rich: 4000000 });
        add(s, "overdraft", -(s.overdraft || 0));
        add(s, "cash", Math.round(calm * 0.4));
        add(s, "mood", 22); add(s, "stress", -22); add(s, "health", 10); add(s, "insight", 8); add(s, "mind", 5);
        bumpMomentum(s, 4);
        return `你把债慢慢还清，没有翻身成富豪，却也再不必为钱发愁。经历过云端跌进泥里，你忽然看淡了那些争抢——回了趟老家，盘下个小院，种菜养花，做点能糊口的小营生。 ${fort_money(calm)} 的家底不算多，可你睡得着、笑得出。大起大落之后，你终于活明白了：平安喜乐，才是真正的东山再起。`;
      } }
  ]
});
