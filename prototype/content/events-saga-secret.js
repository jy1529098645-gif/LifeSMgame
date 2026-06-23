"use strict";
/* =====================================================================
 * content/events-saga-secret.js —— 多幕连续剧（saga）：身世之谜 & 丑闻平反
 * ---------------------------------------------------------------------
 * 两条电视剧式长线，跨越多年、层层升级、最后大爆发：
 *   1) origin  —— 身世之谜：抱错/私生/被收养 → 顺藤摸瓜 → 认祖归宗 / 拒之门外 / 放下执念
 *   2) scandal —— 丑闻诬陷：贪腐/造假/桃色/经济纠纷 → 舆论发酵众叛亲离 → 沉冤得雪 / 身败名裂 / 花钱消灾
 * 机制：flag 串联 saga_<名>_s1/s2/s3，引擎(drawAmbient)对 module:"saga" 优先推进。
 * 复用人物名 s.sg_origin / s.sg_scandal；按前幕选择 flag 让结局分歧。
 * 内部辅助函数前缀 secret_；事件 id 前缀 ev_sagasecret_。
 * ===================================================================== */

/* ---------------------------------------------------------------------
 * 辅助：把一笔随时代物价缩放的「遗产/赔款」折算成当年购买力金额
 * ------------------------------------------------------------------- */
function secret_scaled(s, base) {
  const pi = (s.world && s.world.priceIndex) ? s.world.priceIndex : 1;
  return Math.round(base * pi);
}
// 确保某条 saga 的人物名只生成一次并复用
function secret_who(s, key, style) {
  if (!s[key]) s[key] = genName(style || "cn", "男");   // 本线以「他」称呼，固定男性名免错位
  return s[key];
}
// 按身份选丑闻类型（贴合职业/阶层），返回类型 id
function secret_scandalKind(s) {
  if (has(s, "civil_servant") && (s.civilRank || 0) >= 1) return "graft";   // 体制内 → 贪腐疑云
  if (has(s, "startup") || classTier(s) >= 3) return "fraud";              // 创业者/新贵 → 财务造假
  if ((s.stats && s.stats.knowledge >= 55) || has(s, "phd")) return "academic"; // 高学识 → 学术造假
  return "affair";                                                        // 其余 → 桃色/私德构陷
}

/* =====================================================================
 *  SAGA 一、身世之谜（origin）—— 3 幕
 *  s1 一封旧信 / 一次验血，撕开身世；s2 顺藤摸瓜，认门或被拒的前奏；
 *  s3 大结局：认祖归宗暴富 / 被豪门扫地出门 / 放下执念珍惜养育之恩
 * ===================================================================== */

/* —— 第 1 幕：身世起疑（once / ambient / saga） —— */
EVENTS.push({
  id: "ev_sagasecret_origin_s1",
  module: "saga", ambient: true, once: true,
  cond: (s) => s.age >= 22 && s.age <= 50 && !has(s, "saga_origin_s1") && !has(s, "saga_origin_done"),
  title: "🧬 一份对不上的血型",
  text: (s) => {
    // 三选一的「身世真相」由 rnd 决定，落到 flag，后续幕据此分流
    const r = Math.random();
    if (r < 0.34) s.flags.origin_truth_swap = true;        // 抱错
    else if (r < 0.67) s.flags.origin_truth_love = true;   // 私生
    else s.flags.origin_truth_adopt = true;                // 被收养
    secret_who(s, "sg_origin", "cn");
    if (has(s, "origin_truth_swap"))
      return "父亲住院，全家验血配型。报告出来那天，医生把你单独叫进办公室，压低声音：「你的血型……和你父母对不上。从遗传学讲，他们不可能是你的亲生父母。」走廊的灯忽明忽暗，你听见自己的心跳。";
    if (has(s, "origin_truth_love"))
      return "整理母亲遗物时，一个上了锁的铁盒滑出柜底。撬开，里面是一沓泛黄的信，落款都是一个陌生男人。最上面那封写着：「孩子是我们的，可这辈子，我只能远远看着他长大。」你的手开始发抖。";
    return "母亲临终前攥着你的手，气若游丝：「有件事……瞒了你三十年。你不是我亲生的……当年是从福利院……」话没说完，监护仪拉成了长音。一句话，把你前半生的根基掀了个底朝天。";
  },
  choices: [
    { label: "我必须查清自己到底是谁", effect: (s) => {
        flag(s, "saga_origin_s1"); flag(s, "origin_dig");
        add(s, "stress", 12); add(s, "mood", -8); add(s, "insight", 3);
        return "你决定撕开这个口子。从今往后，你白天是别人眼里那个你，夜里却是个翻找旧档案、四处打听的侦探。真相像深井，越往下越凉。";
      } },
    { label: "养育之恩大过天，我不想再追究", effect: (s) => {
        flag(s, "saga_origin_s1"); flag(s, "origin_letgo");
        add(s, "mood", 4); add(s, "stress", -4); add(s, "reputation", 3);
        return "你把那份报告、那盒旧信，连同心里的惊涛，一起锁进了抽屉。「养我的，就是我爸我妈。」你这样对自己说。可有些念头，按得下一时，按不下一世。";
      } }
  ]
});

/* —— 第 2 幕：顺藤摸瓜（saga，需 s1，年龄/年限升级） —— */
EVENTS.push({
  id: "ev_sagasecret_origin_s2",
  module: "saga", ambient: true,
  cond: (s) => has(s, "saga_origin_s1") && !has(s, "saga_origin_s2") && !has(s, "saga_origin_done") && s.age >= 26,
  title: "🔍 顺藤摸瓜，竟摸到一扇朱门",
  text: (s) => {
    const w = secret_who(s, "sg_origin", "cn");
    const head = has(s, "origin_letgo")
      ? "你本想就此翻篇，可命运偏不让你安生——一个自称【" + w + "】的律师找上门，说受人之托，已经找了你很多年。"
      : "几年明察暗访，线索终于在一个叫【" + w + "】的中间人那里串成了线。对方约你见面，开门见山。";
    if (has(s, "origin_truth_swap"))
      return head + "「当年医院产房一场乌龙，两个婴儿抱错了。你真正的家，是本地赫赫有名的【沈氏家族】——做实业的那个沈家。而那个被抱去你家、顶了你位置的人，这些年一直当着沈家的少爷。」一句话，两个家庭的命运在你眼前轰然交错。";
    if (has(s, "origin_truth_love"))
      return head + "「你的生父，是早年下海、如今坐拥一家上市公司的【沈董】。当年他与你母亲有缘无分，对外从不敢认你。如今他病重，膝下那几个争产的子女，没一个让他省心。他想见你一面——在遗嘱落定之前。」";
    return head + "「你的亲生父母当年并非狠心，而是遭了一场灭顶的变故，逼不得已把你送走。如今家道复兴，老人风烛残年，唯一的心愿就是找回当年那个孩子。他们姓沈，在城里也算有头有脸。」";
  },
  choices: [
    { label: "认！哪怕只为讨个说法", effect: (s) => {
        flag(s, "saga_origin_s2"); flag(s, "origin_claim");
        add(s, "stress", 10); add(s, "mood", 6); add(s, "network", 6);
        return "你点了头。从这一刻起，你被卷进一个完全陌生的世界——豪门的客厅金碧辉煌，笑脸背后却是算计与提防。你是回家的游子，还是分蛋糕的外人？没人替你说清。";
      } },
    { label: "先验明正身，律师、亲子鉴定一样不少", effect: (s) => {
        flag(s, "saga_origin_s2"); flag(s, "origin_cautious");
        add(s, "strategy", 3); add(s, "insight", 2); add(s, "stress", 6);
        return "你没被「豪门」二字冲昏头。请律师、做鉴定、查工商档案——你要的是铁证，不是一场可能人财两空的认亲秀。对方眼里，闪过一丝不易察觉的忌惮。";
      } },
    { label: "养育之情才是真的，我不去", effect: (s) => {
        flag(s, "saga_origin_s2"); flag(s, "origin_refuse");
        add(s, "mood", 5); add(s, "reputation", 4); add(s, "stress", -3);
        return "你谢绝了。「我已经有家了。」你转身回到那个不富裕却踏实的屋檐下，给养你长大的人添了碗饭。有些根，不在血里，在饭桌上。";
      } }
  ]
});

/* —— 第 3 幕：大结局（saga，需 s2，多分支大爆发） —— */
EVENTS.push({
  id: "ev_sagasecret_origin_s3",
  module: "saga", ambient: true,
  cond: (s) => has(s, "saga_origin_s2") && !has(s, "saga_origin_done") && s.age >= 30,
  title: "👑 朱门之内，认与不认的终局",
  text: (s) => {
    const w = s.sg_origin || "那位中间人";
    if (has(s, "origin_refuse"))
      return "多年后，【" + w + "】再次登门，这次带来的是一纸遗嘱和一个消息：沈家老人走了，临终仍念着你的名字，留了一份你的那一份。认，还是不认，最后这一道门，要你亲手推开。";
    if (has(s, "origin_claim"))
      return "认亲宴上推杯换盏，可没过多久，沈家几个「兄弟姐妹」就联手发难：质疑你的血缘、翻你的旧账、放风说你是来骗家产的「野种」。一场针对你的围猎，悄然成局。生死攸关的鉴定结果，明天出。";
    return "你手握亲子鉴定与当年的档案铁证，站在沈氏家族的中堂。老爷子老泪纵横要认你，几个子女却如临大敌。真相已经摆上桌——接下来怎么收场，握在你手里。";
  },
  dynamicChoices: (s) => {
    const opts = [];
    const w = s.sg_origin || "对方";
    // 分支 A：认祖归宗 / 继承遗产暴富（更看重谨慎取证或主动认亲）
    opts.push({ label: "亮出铁证，堂堂正正认祖归宗", effect: (s) => {
        flag(s, "saga_origin_done"); flag(s, "origin_inherited");
        // 谨慎取证的人拿得更稳更多
        const big = has(s, "origin_cautious") ? 12000000 : 7000000;
        const gain = secret_scaled(s, big);
        add(s, "assets", gain); add(s, "reputation", 18); add(s, "network", 14);
        add(s, "mood", 16); bumpMomentum(s, 10);
        try { socialShift(s, 8); } catch (e) {}
        return "DNA 报告与泛黄的档案，把所有质疑钉死在桌上。沈家老爷子当众认下你这个孩子，分给你应得的一份家业——折合 ¥" + gain.toLocaleString() + "。一夜之间，你从无名之辈，成了豪门正主。当年那些冷眼，如今都换成了堆笑。命运，在这一刻给你递了一副好牌。";
      } });
    // 分支 B：被豪门拒之门外 / 身心俱损（主动认亲却无强证，最易翻车）
    opts.push({ label: "凭一腔真心去认，赌他们良心未泯", effect: (s) => {
        flag(s, "saga_origin_done"); flag(s, "origin_rejected");
        const win = has(s, "origin_cautious") ? rnd(0.55) : rnd(0.25);
        if (win) {
          const gain = secret_scaled(s, 4000000);
          add(s, "assets", gain); add(s, "mood", 8); add(s, "reputation", 8); bumpMomentum(s, 4);
          return "几番拉锯，老爷子力排众议，认了你，也分了你一份（折合 ¥" + gain.toLocaleString() + "）。可那几张冷脸提醒你：这扇朱门，从来没真正为你敞开过。钱进了账，心却凉了半截。";
        }
        add(s, "mood", -18); add(s, "stress", 16); add(s, "reputation", -8); bumpMomentum(s, -8);
        add(s, "health", -4);
        return "你掏出全部真心，换来的是一句「查无实据，恕不接待」和保安客气的「请」。豪门把门一关，律师函随后就到，反咬你蓄意攀附、败坏门风。你站在冰冷的台阶上，半生的身世执念，碎了一地。原来血缘，敌不过算计。";
      } });
    // 分支 C：放下执念，珍惜养育之恩（拒认/放手者的圆满）
    opts.push({ label: "把那份家产捐了，回家守着养我的人", effect: (s) => {
        flag(s, "saga_origin_done"); flag(s, "origin_atpeace");
        add(s, "mood", 14); add(s, "reputation", 16); add(s, "stress", -10);
        add(s, "insight", 4); add(s, "network", 4);
        try { socialShift(s, 3); } catch (e) {}
        return "你婉拒了那份足以改写人生的家产，只取了【" + w + "】转交的一封家书，将其余尽数捐给了当年的福利院。回到家，你给养父母端茶捶背。「我这一生最大的福气，是被你们养大。」血缘是天定的偶然，恩情是后来的修行。你睡了多年来最踏实的一觉。";
      } });
    return opts;
  },
  choices: []
});

/* =====================================================================
 *  SAGA 二、丑闻·诬陷与平反（scandal）—— 4 幕
 *  s1 一封举报信/一段录音，丑闻引爆；s2 舆论发酵众叛亲离；
 *  s3 至暗时刻，抓到反转的命门；s4 大结局：沉冤得雪 / 身败名裂 / 花钱消灾
 * ===================================================================== */

/* —— 第 1 幕：丑闻引爆（once / ambient / saga） —— */
EVENTS.push({
  id: "ev_sagasecret_scandal_s1",
  module: "saga", ambient: true, once: true,
  cond: (s) => s.age >= 26 && s.age <= 58 && !has(s, "saga_scandal_s1") && !has(s, "saga_scandal_done"),
  title: "📰 一封举报信，把你架上了火",
  text: (s) => {
    const kind = secret_scandalKind(s);
    s.flags["scandal_" + kind] = true;          // 记下丑闻类型，后续幕据此分流
    secret_who(s, "sg_scandal", "cn");
    if (kind === "graft")
      return "一封实名举报信被捅上了网：附着几张你和某老板的合影、一笔说不清的转账，标题刺眼——「某干部疑似收受巨额好处」。你看着那笔其实是误转又退回的款子，百口莫辩。一夜之间，电话被打爆。";
    if (kind === "fraud")
      return "一篇做空报告精准砸向你的公司：「财务造假、虚增营收、实控人套现跑路在即」。配图是被断章取义的内部邮件。开盘即崩，投资人电话一个接一个，措辞从关切到逼问，只用了半天。";
    if (kind === "academic")
      return "一个匿名账号逐页扒你的论文，红框圈出所谓「图片重复」「数据造假」，#某某学术不端# 冲上热搜。同行群里的沉默比指责更可怕。你深知那是被恶意拼接的旧图，可解释的声音淹没在唾沫里。";
    return "几张被恶意剪辑的暧昧照片、一段掐头去尾的录音，配上「德不配位、私生活混乱」的爆料，在朋友圈疯传。你和对方清清白白，可大众要的从不是真相，是热闹。流言像潮水，瞬间没顶。";
  },
  choices: [
    { label: "我清白，我要硬刚到底，自证清白", effect: (s) => {
        flag(s, "saga_scandal_s1"); flag(s, "scandal_fight");
        add(s, "stress", 14); add(s, "reputation", -10); add(s, "strategy", 2);
        return "你连夜发声明、报警、起诉造谣者，誓要把泼到身上的脏水一瓢瓢舀干净。这是一条最难走的路——清者自清四个字，往往要拿命去换。";
      } },
    { label: "先冷处理，避避风头", effect: (s) => {
        flag(s, "saga_scandal_s1"); flag(s, "scandal_lowkey");
        add(s, "stress", 8); add(s, "reputation", -16); add(s, "mood", -8);
        return "你选择沉默，关掉评论，躲进风暴眼。可沉默在围观者眼里，约等于默认。没有你的声音，故事就由别人来编——而他们编得很难听。";
      } }
  ]
});

/* —— 第 2 幕：舆论发酵·众叛亲离（saga，需 s1） —— */
EVENTS.push({
  id: "ev_sagasecret_scandal_s2",
  module: "saga", ambient: true,
  cond: (s) => has(s, "saga_scandal_s1") && !has(s, "saga_scandal_s2") && !has(s, "saga_scandal_done") && s.age >= 27,
  title: "🌪️ 树倒猢狲散，墙倒众人推",
  text: (s) => {
    const w = secret_who(s, "sg_scandal", "cn");
    return "丑闻发酵到第二轮：曾经称兄道弟的【" + w + "】第一个跳出来「划清界限」，把你卖了个干净；合作方连夜撤资，单位贴出「停职配合调查」的通知；连家里人都被骚扰到不敢出门。最痛的不是敌人的刀，是身边人转身时那一句「我早觉得他不对劲」。你站在原地，四面楚歌。";
  },
  choices: [
    { label: "砸锅卖铁请顶级律师，死磕取证", effect: (s) => {
        flag(s, "saga_scandal_s2"); flag(s, "scandal_lawup");
        const fee = secret_scaled(s, 200000);
        add(s, "cash", -Math.min(s.cash > 0 ? s.cash : 0, fee));
        add(s, "stress", 12); add(s, "strategy", 3); add(s, "insight", 2);
        return "你押上积蓄，请来打硬仗的律师团，一帧帧抠监控、一笔笔倒查流水。钱像水一样花出去，但你赌的是：只要证据在，迟早能翻盘。";
      } },
    { label: "暗中查是谁在背后捅刀", effect: (s) => {
        flag(s, "saga_scandal_s2"); flag(s, "scandal_trace");
        add(s, "insight", 4); add(s, "strategy", 2); add(s, "stress", 10);
        return "你不再急着辩白，而是冷下来顺线倒查——谁最先发的料？谁从你的倒下里获利最大？顺着这两个问题摸下去，一张精心编织的网，渐渐露出了线头。";
      } },
    { label: "撑不住了，托人花钱私下了结", effect: (s) => {
        flag(s, "saga_scandal_s2"); flag(s, "scandal_settle_lean");
        add(s, "mood", -10); add(s, "stress", -4); add(s, "reputation", -6);
        return "你身心俱疲，动了「破财消灾」的念头，托中间人去谈。对方狮子大开口，话里话外都是拿捏。你知道这是饮鸩止渴，可你太累了，只想让这一切快点结束。";
      } }
  ]
});

/* —— 第 3 幕：至暗时刻·抓住命门（saga，需 s2，升级反转铺垫） —— */
EVENTS.push({
  id: "ev_sagasecret_scandal_s3",
  module: "saga", ambient: true,
  cond: (s) => has(s, "saga_scandal_s2") && !has(s, "saga_scandal_s3") && !has(s, "saga_scandal_done") && s.age >= 28,
  title: "🗝️ 风暴中心，一线生机",
  text: (s) => {
    const w = s.sg_scandal || "那个内鬼";
    if (has(s, "scandal_trace") || has(s, "scandal_lawup"))
      return "苦熬数月，铁证终于浮出水面：原来从头到尾，都是【" + w + "】一手策划的构陷——为了抢你的位子/吞你的公司/盖住他自己的烂账。你手里攥着能把他钉死的关键证据，对方却放出话来：私了，给钱，此事一笔勾销；不然，鱼死网破。";
    return "拖到山穷水尽，一个意想不到的人递来了转机：当年的旁观者良心不安，偷偷给了你一段能自证清白的原始录像。可它来路敏感，用不用、怎么用，是一步险棋。同时，对方也嗅到风声，开始疯狂销毁证据、收买证人。";
  },
  choices: [
    { label: "证据递交检方/媒体，公开一战定生死", effect: (s) => {
        flag(s, "saga_scandal_s3"); flag(s, "scandal_goaludit");
        add(s, "stress", 14); add(s, "strategy", 2); add(s, "reputation", 4);
        return "你决定不私了，把所有证据一次性摊到阳光下——交检方、给媒体、开发布会。要么彻底翻案、一战封神，要么连最后的退路都断掉。你深吸一口气，按下了发送键。";
      } },
    { label: "拿证据跟对方谈，逼他公开道歉+赔偿", effect: (s) => {
        flag(s, "saga_scandal_s3"); flag(s, "scandal_leverage");
        add(s, "strategy", 4); add(s, "insight", 2); add(s, "stress", 6);
        return "你没急着鱼死网破，而是握着把柄反将一军：要么公开澄清、赔偿、道歉，要么这些证据明天就上头条。攻守之势，悄然逆转。谈判桌上，轮到对方冒汗了。";
      } },
    { label: "实在耗不起，接受对方的私了条件", effect: (s) => {
        flag(s, "saga_scandal_s3"); flag(s, "scandal_settle_done");
        add(s, "mood", -6); add(s, "stress", -8); add(s, "reputation", -4);
        return "你权衡再三，签了那份「双方互不追究」的协议。钱赔出去，名声却只擦回来一半。世人记住的，永远是当初那个最劲爆的版本。你买的是清静，不是清白。";
      } }
  ]
});

/* —— 第 4 幕：大结局（saga，需 s3，多分支大爆发） —— */
EVENTS.push({
  id: "ev_sagasecret_scandal_s4",
  module: "saga", ambient: true,
  cond: (s) => has(s, "saga_scandal_s3") && !has(s, "saga_scandal_done") && s.age >= 29,
  title: "⚖️ 尘埃落定，是封神还是身败",
  text: (s) => {
    const w = s.sg_scandal || "对方";
    if (has(s, "scandal_settle_done"))
      return "私了的协议早已签字画押，可纸包不住火。当年的真相，在某个深夜被另一个人捅了出来——这一次，连你自己都没料到，剧情还有续集。【" + w + "】的结局，与你的清白，竟在此刻一同揭晓。";
    return "庭审/发布会现场座无虚席，镜头闪成一片白光。你站在风暴的正中央，手里是足以定乾坤的证据，对面是【" + w + "】发青的脸。多年的隐忍、众叛亲离的委屈，全压在接下来这几分钟里。";
  },
  dynamicChoices: (s) => {
    const opts = [];
    const w = s.sg_scandal || "对方";
    // 分支 A：沉冤得雪 / 一战封神（公开对决 + 有过取证者命中率高）
    opts.push({ label: "当众完整还原真相，请法律给个公道", effect: (s) => {
        flag(s, "saga_scandal_done"); flag(s, "scandal_cleared");
        const solid = has(s, "scandal_lawup") || has(s, "scandal_trace") || has(s, "scandal_goaludit");
        if (solid || rnd(0.5)) {
          const comp = secret_scaled(s, 1500000);
          add(s, "reputation", 30); add(s, "mood", 20); add(s, "network", 12);
          add(s, "cash", comp); bumpMomentum(s, 12); add(s, "stress", -18);
          try { socialShift(s, 6); } catch (e) {}
          return "证据链环环相扣，无可辩驳。【" + w + "】当庭崩溃认罪，反诬反被反坐。你沉冤得雪，名誉法院判决恢复，名誉赔偿 ¥" + comp.toLocaleString() + "落袋。一夜之间，舆论彻底倒戈——人人都说「早知道他是被冤枉的」。这一战，你不仅洗清了自己，更杀出了一身传奇。曾经看你跌倒的人，如今排队来道歉。";
        }
        add(s, "reputation", -14); add(s, "mood", -16); add(s, "stress", 16); bumpMomentum(s, -8);
        return "证据虽真，却被对方雄厚的律师团搅成「证据来源不合法」「真伪存疑」，关键一环功亏一篑。你赢了道理，输了判决。清白没能盖棺定论，污点却像疤一样留下了。有些冤屈，连法律都无力一次抹平。";
      } });
    // 分支 B：百口莫辩 / 身败名裂（低调躲风头 + 没取证者最易翻车）
    opts.push({ label: "豁出去拼死一搏，赌大众站在我这边", effect: (s) => {
        flag(s, "saga_scandal_done"); flag(s, "scandal_ruined");
        const weak = has(s, "scandal_lowkey") && !(has(s, "scandal_lawup") || has(s, "scandal_trace"));
        if (weak || rnd(0.55)) {
          add(s, "reputation", -34); add(s, "mood", -22); add(s, "stress", 20);
          add(s, "network", -16); add(s, "health", -6); bumpMomentum(s, -14);
          if (has(s, "civil_servant")) { s.civilRank = 0; delete s.flags.civil_servant; s.job = null; }
          try { socialShift(s, -8); } catch (e) {}
          return "你赌大众会听你解释，可情绪上头的舆论从不讲证据。你越辩，黑料被翻得越多，断章取义的新「实锤」满天飞。最终你彻底社死——职位没了、圈子散了、亲友避之不及。哪怕多年后真相大白，没人再愿意回头看一眼。一个人最深的孤独，是被全世界判了刑。";
        }
        const comp = secret_scaled(s, 400000);
        add(s, "reputation", 8); add(s, "mood", 4); add(s, "cash", comp); bumpMomentum(s, 3);
        flag(s, "scandal_cleared");
        return "几乎要输的局，被你一段动情又有据的陈词硬生生扳了回来。风向勉强转正，拿到 ¥" + comp.toLocaleString() + "的象征性赔偿。算不上封神，但好歹把名字从泥里捞了回来。劫后余生，你只觉得后怕。";
      } });
    // 分支 C：花钱消灾 / 元气大伤（息事宁人，破财保平安）
    opts.push({ label: "够了，掏钱平息一切，只求安生", effect: (s) => {
        flag(s, "saga_scandal_done"); flag(s, "scandal_paidoff");
        const cost = secret_scaled(s, 800000);
        add(s, "cash", -Math.min(s.cash > 0 ? s.cash : 0, cost));
        add(s, "assets", -secret_scaled(s, 200000));
        add(s, "reputation", -6); add(s, "mood", 2); add(s, "stress", -14);
        return "你不想再耗下去了。一笔不菲的「封口费」与和解金（伤筋动骨近 ¥" + cost.toLocaleString() + "）撒出去，舆论这才慢慢退潮。事是平了，可元气大伤，心里那根刺也永远拔不干净。你终于明白：被泼一身脏水，哪怕擦干净，衣服上也再回不到从前的颜色。从此你做人，多了一分谨慎，也多了一分薄凉。";
      } });
    return opts;
  },
  choices: []
});
