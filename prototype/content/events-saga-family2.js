"use strict";
/* =====================================================================
 * content/events-saga-family2.js —— 多幕连续剧式戏剧事件（saga）：亲情两线
 * 跨越多年、层层推进、有大结局，像电视剧。两条 saga：
 *   1) child  —— 子女的一生线（升学岔路 → 青年抉择 → 成龙/平凡/心碎）
 *   2) parent —— 父母养老送终线（身体亮红灯 → 照顾与分摊 → 送终/遗憾/反目）
 * 机制：flag `saga_<名>_s1/s2/s3/done` 串联，引擎优先推进 module:"saga"。
 * 复用人物名 s.sg_<名>；按前幕选择 flag 让结局分歧。
 * 可读状态：has(s,"has_kid") / s.kidEdu(早年鸡娃投入,可能未定义) / classTier(s)。
 * 只用全局 helper：add/flag/has/pick/rnd/byClass/classTier/socialShift/
 *   socialBoostRole/bumpMomentum/genName。辅助函数前缀 fam2_；id 前缀 ev_sagafam2_。
 * 情感强、有反转、克制不煽情；第二人称、有对白、有画面感。
 * ===================================================================== */

// 取/生成 saga 复用人物名（懒初始化，全程复用同一名字）。
function fam2_name(s, key) {
  if (!s[key]) s[key] = genName("cn");
  return s[key];
}
// 早年鸡娃投入（可能未定义），归一为 0~3 档：0 放养 / 1 普通 / 2 上心 / 3 砸锅卖铁鸡娃。
function fam2_edu(s) {
  var e = +s.kidEdu || 0;
  if (e <= 0) return 0;
  if (e < 50000) return 1;
  if (e < 300000) return 2;
  return 3;
}
// 家境分层快捷读取。
function fam2_rich(s) { return classTier(s) >= 3; }
function fam2_poor(s) { return classTier(s) <= 0; }

/* =====================================================================
 * SAGA 1 ── 子女的一生线  saga 名: child   人物: s.sg_child(孩子名)
 * 第1幕(孩子升学,需 has_kid) 普高/职高/天赋异禀/叛逆的岔路口
 *   → 第2幕(青年期) 考公/创业/啃老/远嫁/出国，受 kidEdu 与家境影响
 *   → 第3幕(结局) 成龙成凤光宗耀祖 / 平凡安稳常回家 / 啃老断绝白发心碎
 * 分支 flag：
 *   第1幕 child_road_xueba(学霸冲名校) / child_road_zhigao(读职高一技之长)
 *          / child_road_tianfu(天赋异禀走偏门) / child_road_panni(叛逆失管教)
 *   第2幕 child_up(向上,考公/名企/出国深造) / child_flat(平稳,小城安家)
 *          / child_down(啃老/失联苗头)
 * ===================================================================== */

/* —— 第1幕：升学的岔路口 —— */
EVENTS.push({
  id: "ev_sagafam2_child_s1", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "has_kid") && !has(s, "saga_child_s1") && s.age >= 38 && s.age <= 58,
  title: "🎒 孩子站在人生第一个岔路口",
  text: (s) => {
    var n = fam2_name(s, "sg_child");
    var e = fam2_edu(s);
    var head = e >= 2
      ? "这些年你在" + n + "身上没少砸钱——补习班、特长班、学区房，能给的你都给了。"
      : (e === 1
          ? "你没本事给" + n + "铺多金贵的路，能管的作业你管了，能省的报班费你也咬牙报了。"
          : "你忙生计的这些年，" + n + "几乎是自己长大的。你心里始终有一块愧疚，没顾上 ta。");
    return head + "\n\n" +
      "如今 ta 中考成绩出来了，分数卡在一个不上不下的位置。班主任把你单独叫去办公室，话说得委婉：" +
      "「" + n + "这孩子……其实挺机灵，就是没用在正地方。」\n\n" +
      "饭桌上，" + n + "扒拉着碗，忽然抬头：「爸/妈，我以后到底该走哪条路？」" +
      "那双眼睛和你年轻时一模一样，迷茫，又倔强。你忽然意识到，你的一个决定，可能改写 ta 的一生。";
  },
  choices: [
    { label: "拼一把：逼 ta 冲重点高中、考名校", effect: (s) => {
        var n = fam2_name(s, "sg_child");
        flag(s, "saga_child_s1"); flag(s, "child_road_xueba");
        add(s, "cash", fam2_rich(s) ? 0 : -40000); add(s, "stress", 8); add(s, "mood", 2);
        return "你拍了板：「只要你肯学，砸锅卖铁我也供你读书。」\n\n" +
          "从那天起，家里电视关了，你陪 ta 熬到深夜，错题本攒了一摞又一摞。" +
          n + "也争气，咬着牙挤进了重点高中的尖子班。\n\n" +
          "只是 ta 笑得越来越少了。有次你半夜起来，看见 ta 趴在台灯下睡着，作业本上洇开一片泪痕。" +
          "你心疼得发紧，却还是把那句「不读也行」咽了回去——你太怕，怕 ta 走你的老路。";
      } },
    { label: "务实点：让 ta 读职高，学门手艺傍身", effect: (s) => {
        var n = fam2_name(s, "sg_child");
        flag(s, "saga_child_s1"); flag(s, "child_road_zhigao");
        add(s, "mood", 3); add(s, "insight", 2); add(s, "stress", -2);
        return "你想了很久，对 ta 说：「读书不是唯一的路。学门真本事，走到哪都饿不死。」\n\n" +
          "亲戚里有人嚼舌根，说你「不重视孩子前途」。你没理会。" +
          n + "去了职高，学的是 ta 真感兴趣的东西，眼里慢慢有了光，回家话也多了。\n\n" +
          "有天 ta 给你修好了坏了半年的电饭锅，献宝似的：「看，我学的有用吧？」" +
          "你嘴上没夸，转身却红了眼眶——这条路冷门，但 ta 走得踏实。";
      } },
    { label: "ta 天赋异禀：放手让 ta 走那条偏门的路", effect: (s) => {
        var n = fam2_name(s, "sg_child");
        flag(s, "saga_child_s1"); flag(s, "child_road_tianfu");
        add(s, "cash", -60000); add(s, "mood", 4); add(s, "charm", 1); add(s, "stress", 6);
        return n + "在某件事上，是真有天分——" + pick(["画画", "打球", "唱歌", "写代码", "下棋", "跳舞"]) +
          "，老师都说「这孩子是块料，可惜读书耽误了」。\n\n" +
          "走这条路是赌博：要砸钱、要碰运气，十个里九个半途而废。你和爱人吵了几架，最后还是赌了。\n\n" +
          "「这是你自己选的路，再苦也别回头哭。」你把家底掏出来一部分，送 ta 去拜师/集训。" +
          "看着 ta 拖着行李头也不回地走，你既骄傲又揪心——你押上的，是 ta 的青春，也是你后半辈子的安稳。";
      } },
    { label: "ta 已经叛逆失控：先管住这颗野心", effect: (s) => {
        var n = fam2_name(s, "sg_child");
        flag(s, "saga_child_s1"); flag(s, "child_road_panni");
        add(s, "stress", 14); add(s, "mood", -8); add(s, "reputation", -2);
        return n + "早不是那个乖孩子了。逃课、夜不归宿、染了头发，跟一群你看不顺眼的人混在一起。" +
          "你说一句，ta 顶十句：「我的事不用你管！」\n\n" +
          "那晚你气急了，扬手要打，却在半空停住——ta 比你高了，眼神里全是陌生的敌意。手落下来的瞬间，你心凉了半截。\n\n" +
          "「你根本不懂我。」ta 摔门而出。你站在空荡的客厅里，第一次怀疑：这些年，是不是哪里就错了？" +
          "管，管不住；不管，又怕 ta 滑下去。为人父母最深的无力，莫过于此。";
      } }
  ]
});

/* —— 第2幕：青年期的人生选择 —— */
EVENTS.push({
  id: "ev_sagafam2_child_s2", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_child_s1") && !has(s, "saga_child_s2") && s.age >= 48,
  title: "🛤️ 孩子长大了，要替自己的人生做主",
  text: (s) => {
    var n = fam2_name(s, "sg_child");
    var lead;
    if (has(s, "child_road_xueba")) lead = n + "没辜负那些熬白的夜，一路读了上来，如今大学也快毕业了。";
    else if (has(s, "child_road_zhigao")) lead = n + "在职高学的手艺派上了用场，进了厂/工作室，成了同龄人里最早能自己挣钱的那个。";
    else if (has(s, "child_road_tianfu")) lead = "这些年" + n + "在那条偏门的路上摸爬滚打，有过高光，也摔过跟头，路还没走出名堂。";
    else lead = "叛逆的那阵风总算刮过去了，" + n + "没学坏，但也没什么一技之长，整个人有点找不到方向。";
    var money = fam2_rich(s)
      ? "你家底厚，ta 比同龄人多了不少底气和退路。"
      : (fam2_poor(s) ? "你这个家拮据，ta 没什么可挥霍的本钱，每一步都得算计着走。" : "你家不算富，但也供得起 ta 体面地起步。");
    return lead + money + "\n\n" +
      "一个深夜，" + n + "认真地坐到你对面：「爸/妈，我想好了，我要——」\n\n" +
      "ta 说出口的，是 ta 自己的人生方向。而你这个做父母的，能给的只剩下一句话的分量：是托一把，是拦一下，还是松开手。";
  },
  choices: [
    { label: "支持 ta 拼前途：考公 / 进名企 / 出国深造", effect: (s) => {
        var n = fam2_name(s, "sg_child");
        flag(s, "saga_child_s2"); flag(s, "child_up");
        var e = fam2_edu(s);
        // 早年鸡娃投入 + 家境 越高，越容易真的走通这条向上的路。
        var ok = fam2_rich(s) || e >= 2 || (classTier(s) >= 2 && rnd(0.6)) || rnd(0.35);
        if (ok) {
          add(s, "mood", 10); add(s, "reputation", 8); add(s, "cash", fam2_rich(s) ? 0 : -50000);
          socialShift(s, 2);
          flag(s, "child_up_real");
          return "你倾尽所有托了 ta 一把。" +
            (fam2_rich(s) ? "钱不是问题，你动用了人脉，替 ta 铺平了最难走的几步。" : "为了凑那笔钱，你拿出了养老的积蓄，甚至偷偷又接了份活。") +
            "\n\n" + n + "争气，一路过关斩将" + pick(["上了岸考进体制", "拿到大厂的offer", "申到国外的名校", "进了让人眼红的好单位"]) +
            "。报喜那天电话里 ta 的声音都在抖，你嘴上说「应该的」，挂了电话却一个人乐了半宿。\n\n" +
            "你赌对了。ta 的翅膀，是你一根羽毛一根羽毛替 ta 攒齐的。";
        }
        add(s, "mood", -4); add(s, "stress", 8); add(s, "cash", fam2_rich(s) ? 0 : -50000);
        flag(s, "child_up_fail");
        return "你咬牙掏了钱，让 ta 去搏一个更高的台阶。\n\n" +
          n + "考了一年又一年/投了无数简历/在异国苦熬，可这条路太挤了。" +
          "你看着 ta 一次次落榜、被拒、深夜里强撑着说「再试一次」，心疼得说不出话。\n\n" +
          "钱花了，时间也耗着。你开始怀疑当初的鼓励是不是一种残忍——可你不敢说，怕一句泄气的话，就压垮了 ta 仅剩的那点劲。";
      } },
    { label: "劝 ta 求稳：回老家，找份安稳工作安家", effect: (s) => {
        var n = fam2_name(s, "sg_child");
        flag(s, "saga_child_s2"); flag(s, "child_flat");
        add(s, "mood", 5); add(s, "stress", -4); add(s, "insight", 2);
        return "你劝 ta：「外面再好，不如离家近。安安稳稳的，比什么都强。」\n\n" +
          n + "听了你的话，回了你们所在的城市/老家，找了份不算耀眼但旱涝保收的工作，" +
          "处了对象，张罗着结婚买房。日子不轰轰烈烈，却踏踏实实。\n\n" +
          "周末 ta 常回来吃饭，给你带爱吃的卤味，陪你看你爱看的电视。" +
          "有时你看着 ta 帮你拧开拧不动的瓶盖，恍惚觉得，平凡，原来是这世上最难得的福气。";
      } },
    { label: "ta 想躺平/啃老：你心软，由 ta 去了", effect: (s) => {
        var n = fam2_name(s, "sg_child");
        flag(s, "saga_child_s2"); flag(s, "child_down");
        add(s, "mood", -6); add(s, "stress", 10); add(s, "cash", -30000);
        return n + "试了几次工作都不如意，索性窝回了家：「现在工作多难找你又不是不知道，让我歇歇。」\n\n" +
          "你嘴上骂着「这么大人了不害臊」，手却还是默默把饭做好、把零花钱塞过去。" +
          "你舍不得逼 ta，你怕 ta 在外面受的委屈，比在家啃老更伤人。\n\n" +
          "可日子一天天过去，ta 起得越来越晚，话越来越少，活成了你最不愿看到的样子。" +
          "你心里清楚：这口饭你喂得越久，ta 自己站起来的腿，就越软。";
      } }
  ]
});

/* —— 第3幕（结局）：子女这一生，落在了哪个位置 —— */
EVENTS.push({
  id: "ev_sagafam2_child_s3", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_child_s2") && !has(s, "saga_child_done") && s.age >= 56,
  title: "🌳 多年后，回望孩子的这一生",
  text: (s) => {
    var n = fam2_name(s, "sg_child");
    var lead;
    if (has(s, "child_up_real")) lead = n + "如今已是众人口中「别人家的孩子」，事业有成，在大城市站稳了脚跟。";
    else if (has(s, "child_up_fail")) lead = n + "在那条向上的路上磕磕绊绊了许多年，到头来，没能如愿。";
    else if (has(s, "child_flat")) lead = n + "在小城里过着安稳的日子，结了婚，有了自己的小家。";
    else lead = n + "至今没能真正立起来，在家和你之间，隔着一层越来越厚的沉默。";
    return lead + "\n\n" +
      "你也老了。头发白了，腰也弯了。这一生为人父母的功过，到了该收笔的时候。\n\n" +
      "你常常一个人坐在窗边，想起 ta 小时候趴在你背上咯咯笑的样子。" +
      "那个软乎乎的小不点，怎么一转眼，就长成了今天这个让你又骄傲、又牵挂、又有点看不懂的大人？";
  },
  choices: [
    { label: "听 ta 这些年的际遇，给这段父母缘一个交代", effect: (s) => {
        var n = fam2_name(s, "sg_child");
        flag(s, "saga_child_done");
        // 成龙成凤：向上成功，或天赋路熬出名堂。
        if (has(s, "child_up_real") || (has(s, "child_road_tianfu") && rnd(0.5))) {
          flag(s, "child_end_glory");
          add(s, "mood", 16); add(s, "reputation", 12); add(s, "health", 3);
          socialShift(s, 2); socialBoostRole(s, "family", 6);
          return "ta 出息了，真的出息了。\n\n" +
            n + "把你接到大城市，住进了宽敞明亮的房子，逢年过节亲戚都来道贺，说你「教子有方」「祖坟冒青烟」。" +
            "ta 给你买的衣服你舍不得穿，挂在柜子里，时不时摸一摸。\n\n" +
            "可你最骄傲的，从来不是那些光鲜。是有一天 ta 红着眼对你说：「爸/妈，谢谢你当年没放弃我。」" +
            "那一刻，你这辈子吃过的所有苦，都有了回甜。光宗耀祖四个字，你担得起。";
        }
        // 平凡安稳：求稳，或向上失败但落地。
        if (has(s, "child_flat") || has(s, "child_up_fail")) {
          flag(s, "child_end_ordinary");
          add(s, "mood", 12); add(s, "health", 2); add(s, "stress", -6);
          socialBoostRole(s, "family", 4);
          return "ta 没大富大贵，可 ta 平安、健康，活成了一个普通而温暖的人。\n\n" +
            "周末 ta 一家来吃饭，孙辈在客厅里跑闹，厨房飘着饭菜香，你和 ta 在阳台抽根烟/剥个橘子，有一搭没一搭地聊。" +
            "ta 操心你的血压，你操心 ta 的房贷，谁也离不了谁。\n\n" +
            "年轻时你也曾盼着 ta 飞黄腾达，到老了才懂：" +
            "孩子能常回家、能好好吃饭、能在你跌倒时第一个赶到——这就是天底下最大的福分了。平平淡淡，才是真。";
        }
        // 啃老 / 断绝来往：白发人的心碎。
        flag(s, "child_end_heartbreak");
        if (has(s, "child_road_panni") && rnd(0.5)) {
          // 更重：断绝来往。
          flag(s, "child_estranged");
          add(s, "mood", -18); add(s, "health", -5); add(s, "stress", 14); add(s, "reputation", -4);
          socialShift(s, -2);
          return "你们终究还是走散了。\n\n" +
            "一次更大的争吵后，" + n + "摔门走了，从此杳无音信。电话拉黑，过年不归，连一条消息都吝啬。" +
            "你托人打听，只知道 ta 还活着，在某个城市，过得好不好，你无从得知。\n\n" +
            "白发人最深的疼，不是送黑发人，是孩子明明活着，却像死了一样，再也不肯认你。" +
            "你常常在深夜醒来，对着 ta 小时候的照片掉眼泪：「是爸/妈不好，你回来好不好？」可没有人回答。";
        }
        // 啃老到底。
        add(s, "mood", -12); add(s, "health", -3); add(s, "cash", -50000); add(s, "stress", 10);
        return n + "终究没能立起来。\n\n" +
          "三四十岁的人了，还赖在家里，靠你的退休金过活。你给一次 ta 张一次手，你不给，ta 就摆脸色。" +
          "你老了，干不动了，却还得替这个长不大的孩子操心、兜底。\n\n" +
          "亲戚背后议论，你听了只能装作没听见。夜深人静，你最怕的不是自己百年之后没人送终，" +
          "而是——你走了以后，ta 一个人，可怎么活啊。这份心，到死都放不下。";
      } }
  ]
});

/* =====================================================================
 * SAGA 2 ── 父母养老送终线  saga 名: parent   人物: s.sg_parent(手足名)
 * 第1幕(s.age>=40) 父母身体亮红灯：久病/摔倒/确诊
 *   → 第2幕 谁来照顾、养老院vs亲自伺候、医药费、手足分摊的矛盾
 *   → 第3幕(结局) 床前尽孝送终无憾 / 子欲养而亲不待 / 为钱反目众叛亲离
 * 分支 flag：
 *   第1幕 parent_diag_sick(久病缠身) / parent_diag_fall(意外摔倒)
 *          / parent_diag_terminal(确诊重病)
 *   第2幕 parent_care_self(亲自伺候,孝) / parent_care_home(送养老院,愧)
 *          / parent_care_split(与手足分摊,生隙) / parent_care_money(为钱算计)
 * ===================================================================== */

/* —— 第1幕：父母的身体，亮起了红灯 —— */
EVENTS.push({
  id: "ev_sagafam2_parent_s1", module: "saga", ambient: true, once: true,
  cond: (s) => s.age >= 40 && s.age <= 64 && !has(s, "saga_parent_s1"),
  title: "📞 那通深夜的电话",
  text: (s) => {
    var sib = fam2_name(s, "sg_parent");
    // 病情类型由 rnd 决定。
    if (!has(s, "parent_diag_set")) {
      flag(s, "parent_diag_set");
      var r = Math.random();
      if (r < 0.34) flag(s, "parent_diag_sick");
      else if (r < 0.67) flag(s, "parent_diag_fall");
      else flag(s, "parent_diag_terminal");
    }
    var body;
    if (has(s, "parent_diag_sick")) {
      body = "电话那头，是你年迈父母里的一位，声音虚弱：「没事，就是老毛病，又有点犯了……」\n\n" +
        "你赶回去，才发现「老毛病」三个字底下，藏着多少 ta 不想让你担心的强撑。" +
        "高血压、糖尿病、心脏不好，一身的慢性病像缠人的藤，把那个曾经背得动你的人，一点点拖瘦、拖弯。";
    } else if (has(s, "parent_diag_fall")) {
      body = "是手足" + sib + "打来的，语气慌得变了调：「爸/妈在家摔了一跤，髋骨折了，正在医院！」\n\n" +
        "你扔下手里的一切往医院冲。病床上，那个一辈子要强的老人，此刻只能躺着，连翻身都要人扶。" +
        "ta 拉着你的手，第一句却是：「别耽误你工作……我没事。」你别过头，不让 ta 看见你红了的眼。";
    } else {
      body = "你被叫去医院谈话。医生把片子推到你面前，声音压得很低：「家属要做好心理准备。」\n\n" +
        "那两个字像锤子砸在你心口。你不敢相信，前阵子还张罗着给你包饺子的人，体检单上怎么就写上了那个谁都怕的诊断。\n\n" +
        "你回到病房，努力扯出一个笑：「没事，小毛病，养养就好。」可你父母看你的眼神，分明什么都懂了。";
    }
    return body + "\n\n人到中年，最怕半夜电话响。那一刻你忽然意识到：" +
      "曾经为你遮风挡雨的人，老了，该轮到你来撑伞了。可这把伞，你撑得起吗？";
  },
  choices: [
    { label: "二话不说，先把父母的病稳住", effect: (s) => {
        flag(s, "saga_parent_s1"); flag(s, "parent_start_active");
        add(s, "stress", 10); add(s, "mood", -6);
        var cost = fam2_rich(s) ? 30000 : (fam2_poor(s) ? 8000 : 50000);
        add(s, "cash", -cost);
        return "你跑前跑后，挂号、缴费、签字、守夜，把能找的关系都找了，能用的药都用上。\n\n" +
          "那几天你睡在医院的陪护椅上，腰酸背痛，却一刻不敢合眼。" +
          "你看着监护仪上跳动的数字，第一次那么具体地害怕「失去」这两个字。\n\n" +
          "病情暂时稳住了。可你心里清楚，这只是漫长拉锯的开始——养老送终这条路，才刚刚迈出第一步。";
      } },
    { label: "心里发慌，却不知从何下手", effect: (s) => {
        flag(s, "saga_parent_s1"); flag(s, "parent_start_panic");
        add(s, "stress", 14); add(s, "mood", -8); add(s, "insight", 1);
        return "你慌了。你这才发现，自己竟从没认真想过「父母会老、会病、会走」这件事。\n\n" +
          "挂哪个科、用不用进ICU、要不要做手术、钱够不够……一连串问题砸下来，你手足无措，半天说不出一句有用的话。\n\n" +
          "你看着病床上的父母，又看看一筹莫展的自己，忽然羞愧得无地自容：" +
          "ta 把你拉扯大时，是不是也曾这样手忙脚乱过？如今，轮到你了，你却还像个长不大的孩子。";
      } }
  ]
});

/* —— 第2幕：谁来照顾，钱从哪来，手足怎么分 —— */
EVENTS.push({
  id: "ev_sagafam2_parent_s2", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_parent_s1") && !has(s, "saga_parent_s2") && s.age >= 42,
  title: "🥣 一碗汤的距离，一笔账的难处",
  text: (s) => {
    var sib = fam2_name(s, "sg_parent");
    var burden = fam2_rich(s)
      ? "钱对你不是最大的难题，难的是时间和那份亲力亲为的心。"
      : (fam2_poor(s) ? "本就拮据的家，被一笔接一笔的医药费压得喘不过气，你开始算计每一分钱。" : "请护工、住院、长期吃药，每一项都是钱，你掂量着家底，眉头越皱越紧。");
    return "父母的病，从一场急症，变成了一场没有尽头的持久战。\n\n" +
      "你成了「上有老下有小」的夹心层：一边是要工作、要还房贷、要管孩子，一边是离不开人照顾的父母。" +
      burden + "\n\n" +
      "更难的是手足之间。你和" + sib + "为了「谁出钱、谁出力、谁尽孝」，第一次有了说不出口的别扭。" +
      "ta 说 ta 忙、ta 远、ta 也有难处；你说你也一样累。\n\n" +
      "电话里，父母还在念叨：「别为我吵架，我这把老骨头，不值当。」可越是这样，你心里越不是滋味。这道题，没有标准答案。";
  },
  choices: [
    { label: "亲自伺候：把父母接到身边，亲力亲为", effect: (s) => {
        var sib = fam2_name(s, "sg_parent");
        flag(s, "saga_parent_s2"); flag(s, "parent_care_self");
        add(s, "stress", 16); add(s, "mood", 4); add(s, "health", -6); add(s, "reputation", 6);
        socialBoostRole(s, "family", 5);
        return "你把父母接到了身边，亲自照顾。\n\n" +
          "喂饭、擦身、换洗、半夜起来好几趟……你瘦了，黑眼圈深了，连脾气都被磨得没了。" +
          "可每当 ta 拉着你的手说「有你在，我踏实」，你就觉得，再累也值。\n\n" +
          (has(s, "parent_diag_terminal")
            ? "你知道时间不多了，于是把每一天都过成告别。你陪 ta 晒太阳、听 ta 讲过去的事，把这辈子欠彼此的话，趁还来得及，一句句说出口。"
            : "日子很苦，但你心甘情愿。你想起小时候生病，ta 也是这样一夜一夜守着你的。如今，不过是把欠的，一点点还回去。");
      } },
    { label: "送养老院 / 请护工：愧疚，但你实在分身乏术", effect: (s) => {
        var sib = fam2_name(s, "sg_parent");
        flag(s, "saga_parent_s2"); flag(s, "parent_care_home");
        add(s, "stress", 8); add(s, "mood", -8); add(s, "insight", 2);
        var cost = fam2_rich(s) ? 80000 : (fam2_poor(s) ? 30000 : 60000);
        add(s, "cash", -cost);
        return "你实在撑不住两头跑。再三纠结后，你给父母找了家口碑不错的养老院/请了住家护工。\n\n" +
          "送 ta 进去那天，ta 没说什么，只是默默收拾着自己那点旧东西，背影佝偻。" +
          "你强忍着没回头，出了门眼泪却止不住——「不孝」两个字，像针一样扎在心上。\n\n" +
          "你告诉自己：这是当下最理性的选择，专业照顾比你笨手笨脚强。可理性安抚不了愧疚。" +
          "从此每次去探望，你都买一大堆东西，仿佛多带点什么，就能补上没能亲自陪伴的那份亏欠。";
      } },
    { label: "和手足分摊：约定出钱出力，公平为上", effect: (s) => {
        var sib = fam2_name(s, "sg_parent");
        flag(s, "saga_parent_s2"); flag(s, "parent_care_split");
        add(s, "stress", 10); add(s, "strategy", 2);
        return "你和" + sib + "坐下来，把话摊开说清楚：谁出多少钱、谁哪几个月照看、轮班怎么排。\n\n" +
          "亲兄弟明算账，本是为了走得长远。可真到执行，问题接踵而至：ta 总有忙不开的时候，承诺的钱也常常拖。" +
          "你嘴上不说，心里那杆秤却悄悄记着账。\n\n" +
          "父母夹在中间，看你们客气又生分，比看你们吵架还难受。" +
          "你忽然明白，养老这件事，最难分的从来不是钱和力，是那颗「凭什么是我多」的、谁都有的私心。";
      } },
    { label: "斤斤计较：为分摊的钱，和手足红了脸", effect: (s) => {
        var sib = fam2_name(s, "sg_parent");
        flag(s, "saga_parent_s2"); flag(s, "parent_care_money");
        add(s, "stress", 14); add(s, "mood", -6); add(s, "reputation", -4); add(s, "cash", 10000);
        socialShift(s, -2);
        return "钱，到底还是成了导火索。\n\n" +
          "你越想越不平：凭什么大头都压在你身上？你和" + sib + "为了医药费、为了将来那点房产，话越说越难听，" +
          "从「你出得少」吵到「当年爸/妈偏心谁」，陈年旧账一笔笔翻出来。\n\n" +
          "你争赢了几个回合，少出了一些钱，可挂掉电话的那一刻，心里空落落的。" +
          "病床上的父母把这一切都看在眼里，浑浊的眼睛里，是说不出的失望。那一刻，你赢了钱，却好像输了点更重要的东西。";
      } }
  ]
});

/* —— 第3幕（结局）：送终，是这段父母缘的最后一课 —— */
EVENTS.push({
  id: "ev_sagafam2_parent_s3", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_parent_s2") && !has(s, "saga_parent_done") && s.age >= 45,
  title: "🕯️ 送别：人生最重的那一课",
  text: (s) => {
    var sib = fam2_name(s, "sg_parent");
    var lead;
    if (has(s, "parent_care_self")) lead = "你亲手照顾父母的这些日子，长得熬人，又短得让你害怕。终于，那个你最不愿面对的时刻，还是来了。";
    else if (has(s, "parent_care_home")) lead = "养老院/护工那边的一通电话，让你心头一紧。你放下手里的活就往那边赶，路上一遍遍祈祷，别是你想的那样。";
    else if (has(s, "parent_care_money")) lead = "为钱的那些争吵还没平息，父母的身体却已经熬到了尽头。命运没给你回头的时间。";
    else lead = "和手足轮班照顾的日子里，父母的灯油，一点点耗到了将尽。";
    return lead + "\n\n" +
      (has(s, "parent_diag_terminal")
        ? "ta 走得并不算突然，可再多的心理准备，也接不住「永别」二字真正落下来的重量。"
        : "病情急转直下。医生摇了摇头，把选择权，沉甸甸地交回到你手里。") + "\n\n" +
      "弥留之际，父母的手在被子里轻轻动了动，像是在找你。这一刻，过往所有的对错、得失、争吵，都轻得像一缕烟。" +
      "你俯下身，把耳朵凑近 ta 干裂的嘴唇——ta 想对你说最后一句话。";
  },
  choices: [
    { label: "握紧 ta 的手，送 ta 最后一程", effect: (s) => {
        var sib = fam2_name(s, "sg_parent");
        flag(s, "saga_parent_done");
        // 床前尽孝、送终无憾：亲自伺候，或分摊但尽了心。
        if (has(s, "parent_care_self") || (has(s, "parent_care_split") && rnd(0.5))) {
          flag(s, "parent_end_peace");
          add(s, "mood", 8); add(s, "stress", -8); add(s, "reputation", 8); add(s, "insight", 4);
          socialBoostRole(s, "family", 6);
          return "你守在床前，握着那只渐渐变凉的手，一直没松开。\n\n" +
            "ta 用尽最后一点力气，对你笑了笑：「这辈子……有你这个孩子，我知足了。」说完，安详地合上了眼。\n\n" +
            "你哭得像个孩子，可哭过之后，心里是一种沉甸甸的踏实。" +
            "你陪 ta 走完了最后一段路，该说的话都说了，该尽的孝都尽了。\n\n" +
            "「子欲养，亲尚在。」这八个字，你做到了。往后每年清明，你站在墓前，可以坦坦荡荡地说一句：爸/妈，我没让你失望。";
        }
        // 子欲养而亲不待：送养老院/没能多陪，留下遗憾。
        if (has(s, "parent_care_home")) {
          flag(s, "parent_end_regret");
          add(s, "mood", -12); add(s, "stress", 6); add(s, "insight", 5); add(s, "health", -2);
          return "你拼了命往回赶，还是晚了一步。\n\n" +
            "你冲进病房时，一切都已经安静下来。护工说，ta 走前一直念着你的名字，问「孩子怎么还没来」。\n\n" +
            "那一刻，你天塌了。你想起这些年因为「忙」错过的每一通电话、每一顿没回去吃的年夜饭，" +
            "想起送 ta 进养老院时那个佝偻的背影……「子欲养而亲不待」，这句话你以前只当是诗，如今才知道有多疼。\n\n" +
            "余生很长，可有些遗憾，再也没有机会弥补了。你能做的，只剩下抱着那份悔，好好替 ta 活下去。";
        }
        // 为钱反目、众叛亲离：算计到底。
        flag(s, "parent_end_broken");
        add(s, "mood", -16); add(s, "stress", 12); add(s, "reputation", -10); add(s, "health", -3);
        socialShift(s, -3); socialBoostRole(s, "family", -8);
        return "葬礼办得很冷清。\n\n" +
          "为了那点遗产和早年的旧账，你和" + sib + "彻底撕破了脸，连灵堂前都没能站到一处。" +
          "亲戚们冷眼旁观，背后戳着你们的脊梁骨。\n\n" +
          "你分到了想要的钱，可你站在父母的遗像前，怎么也哭不出来，只剩满心的空与凉。" +
          "ta 这一生最放心不下的，就是怕你们手足不和——而你，亲手让 ta 的担心，在 ta 闭眼之后变成了真。\n\n" +
          "众叛亲离的滋味，要用往后所有孤独的年节，一遍遍去尝。这堂课，你交的学费，是一个家。";
      } }
  ]
});
