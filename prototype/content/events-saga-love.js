"use strict";
/* =====================================================================
 * content/events-saga-love.js —— 多幕连续剧式戏剧事件（saga）：情感虐恋线
 * 跨越多年、层层升级、最后大爆发，像电视剧。两条 saga：
 *   1) firstlove —— 初恋重逢线（年少错过 → 中年重逢 → 旧情复燃 vs 现实抉择）
 *   2) betray    —— 背叛·出轨风波线（察觉裂痕 → 证据升级 → 摊牌/隐忍/回头）
 * 机制：flag `saga_<名>_s1/s2/done` 串联，引擎优先推进 module:"saga"。
 * 复用人物名 s.sg_<名>；按前幕选择 flag 让结局分歧。
 * ⚠️尊重多元：恋爱对象性别按 s.orientation 自然处理，称谓中立用 s.sg_<名>
 *   或「ta」；性别处境平衡、不歧视；批判的是背叛本身，处理克制不低俗。
 * 只用全局 helper：add/flag/has/pick/rnd/byClass/classTier/socialShift/
 *   socialBoostRole/bumpMomentum/genName。辅助函数前缀 love_；id 前缀 ev_sagalove_。
 * ===================================================================== */

// 中立第三人称（无具体名字时兜底）。
function love_ta(s) { return "ta"; }
// 是否已婚/有伴（用于文案分叉）。
function love_attached(s) { return has(s, "married") || has(s, "partner"); }
// 伴侣称谓（中立）。
function love_spouse(s) { return s.partnerName || "你的伴侣"; }
// 取/生成 saga 复用人物名（懒初始化，全程复用）。
function love_name(s, key) {
  // 恋爱对象性别随玩家取向（异/同/双）而定，名字与之匹配；文本统一用中性「ta」，故只影响名字观感。
  if (!s[key]) { const g = (typeof crushGender === "function") ? crushGender(s) : null; s[key] = genName("cn", g); }
  return s[key];
}

/* =====================================================================
 * SAGA 1 ── 初恋重逢线  saga 名: firstlove   人物: s.sg_first
 * 第1幕(18+) 年少初恋无疾而终 → 第2幕(35+) 多年后重逢 → 第3幕(结局) 抉择代价
 * 分支 flag：firstlove_b_warm(重逢心动) / firstlove_b_cold(克制疏离)
 * ===================================================================== */

/* —— 第1幕：年少的那场错过 —— */
EVENTS.push({
  id: "ev_sagalove_first_s1", module: "saga", ambient: true, once: true,
  cond: (s) => s.age >= 18 && s.age <= 30 && !has(s, "saga_firstlove_s1"),
  title: "🌸 那年夏天的人",
  text: (s) => {
    var n = love_name(s, "sg_first");
    return "很多年以后你才明白，有些人是来教你「喜欢」这两个字怎么写的。\n\n" +
      "那年你还年轻。" + n + "是你心口最软的那块地方——一起逃过课，分过同一副耳机，在末班车上假装睡着、其实数着对方的呼吸。" +
      "可你们之间隔着太多：你拮据的家境，一句没说出口的话，还有一道横在中间、谁也跨不过去的距离。\n\n" +
      "毕业那天，" + n + "站在站台上看你，欲言又止。火车要开了。";
  },
  choices: [
    { label: "冲上去，把那句喜欢说出口", effect: (s) => {
        var n = love_name(s, "sg_first");
        flag(s, "saga_firstlove_s1"); flag(s, "firstlove_said");
        add(s, "mood", 6); add(s, "charm", 1); add(s, "insight", 1);
        return "你冲过去，气喘吁吁地说了那三个字。" + n + "红着眼笑了：「我也是……可惜，太晚了。」" +
          "现实没给你们答案——ta 要去远方，你要留下扛起家。你们约好「以后」，却都知道那个「以后」遥遥无期。\n\n" +
          "火车开动，ta 在窗外越跑越小。说出口，至少不留遗憾——可有些遗憾，是从「说出口的那一刻」才真正开始的。";
      } },
    { label: "什么都没说，看火车开走", effect: (s) => {
        var n = love_name(s, "sg_first");
        flag(s, "saga_firstlove_s1"); flag(s, "firstlove_silent");
        add(s, "mood", -4); add(s, "stress", 4); add(s, "insight", 2);
        return "你站在原地，手在口袋里攥成了拳，到底没迈出那一步。\n\n" +
          "「再见」两个字，你咽了又咽，最后只挥了挥手。" + n + "的脸隔着车窗模糊成一团光。" +
          "你告诉自己：穷小子/穷姑娘没资格谈喜欢，先活下去再说。\n\n" +
          "火车走了。这一别，是十几年。后来你无数次想，如果那天你追上去——可人生从不卖「如果」。";
      } },
    { label: "把误会留着，赌气转身先走", effect: (s) => {
        var n = love_name(s, "sg_first");
        flag(s, "saga_firstlove_s1"); flag(s, "firstlove_misunder");
        add(s, "mood", -6); add(s, "stress", 6);
        return "前一晚那场没头没尾的争吵还卡在喉咙里。你赌气，先转了身，把背影甩给 ta。\n\n" +
          "你以为还会有「下一次」可以解释、可以和好。你不知道那竟是最后一面。" +
          n + "在身后喊了你的名字，你没回头——后来你用了很多年，才学会恨那个倔强的自己。\n\n" +
          "一场误会，就这样替你们把话说死了。";
      } }
  ]
});

/* —— 第2幕：多年后，ta 又站在你面前 —— */
EVENTS.push({
  id: "ev_sagalove_first_s2", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_firstlove_s1") && !has(s, "saga_firstlove_s2") && s.age >= 35,
  title: "☕ 多年以后，路口重逢",
  text: (s) => {
    var n = love_name(s, "sg_first");
    var head = love_attached(s)
      ? "你已经有了自己的家，日子被柴米油盐磨得很实。"
      : "你单身了很久，把那段年少的悸动锁进了抽屉最底层。";
    return head + "直到那个再普通不过的午后——\n\n" +
      "你在街角的咖啡店抬头，撞进一双眼睛。是" + n + "。\n\n" +
      "十几年了。ta 老了，眼角有了纹路；可你一眼就认出来，就像认出自己年轻时的心跳。" +
      "ta 也愣住，随即笑了，那个笑容和当年一模一样：「真的是你啊……我找了你好久。」\n\n" +
      "你这才知道，ta 这些年也走了很长的路：" + (rnd(0.5) ? "结过婚，又散了" : "成了家，却不算幸福") +
      "。命运兜兜转转，竟把你们又放回了同一个路口。要不要，坐下来聊聊？";
  },
  choices: [
    { label: "坐下，聊到天黑还不舍得走", effect: (s) => {
        var n = love_name(s, "sg_first");
        flag(s, "saga_firstlove_s2"); flag(s, "firstlove_b_warm");
        add(s, "mood", 8); add(s, "stress", 6); add(s, "charm", 1);
        var tail = love_attached(s)
          ? "你嘴上聊着近况，心里却清楚：这杯咖啡的温度，已经越过了「老朋友」的界。家里还有人等你回去，可此刻你竟有点不想看表。一道裂缝，在你以为牢固的生活里悄悄裂开。"
          : "你们从黄昏聊到霓虹亮起，把这些年的委屈、错过、近况全倒了出来。临别 ta 又一次存下你的号码：「这次，别再弄丢了。」你心跳得像那年的末班车。";
        return "你坐了下来。一聊就忘了时间。\n\n" + tail;
      } },
    { label: "寒暄几句，礼貌地保持距离", effect: (s) => {
        var n = love_name(s, "sg_first");
        flag(s, "saga_firstlove_s2"); flag(s, "firstlove_b_cold");
        add(s, "mood", -3); add(s, "insight", 2); add(s, "stress", 2);
        return "你笑着寒暄：「这么巧，过得还好吧？」话很热，心里却下意识退了半步。\n\n" +
          "你太清楚旧情这东西有多烫手。你问了 ta 近况，没要联系方式，喝完那杯咖啡就起身告辞。" +
          "走出门，风一吹，眼眶却有点酸——克制是对的，可对的事，为什么这么疼。";
      } },
    { label: "假装没认出，匆匆走开", effect: (s) => {
        var n = love_name(s, "sg_first");
        flag(s, "saga_firstlove_s2"); flag(s, "firstlove_b_cold");
        add(s, "mood", -5); add(s, "stress", 5);
        return "你心头一震，几乎是本能地低下头，假装在看手机，匆匆绕开了。\n\n" +
          "你怕的不是 ta，是自己——怕一旦对上眼，那个藏了十几年的少年/少女就会破壳而出，掀翻你好不容易安顿下来的人生。\n\n" +
          "你逃出咖啡店，背后仿佛有道目光追了很久。这一面，你假装从没发生过。";
      } }
  ]
});

/* —— 第3幕（结局）：旧情复燃的诱惑 vs 现实的代价 —— */
EVENTS.push({
  id: "ev_sagalove_first_s3", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_firstlove_s2") && !has(s, "saga_firstlove_done"),
  title: "💔 旧情：续，还是放",
  text: (s) => {
    var n = love_name(s, "sg_first");
    if (has(s, "firstlove_b_cold")) {
      return "那次重逢后，你以为关上了门。可" + n + "还是辗转找到了你，递来一封信、一通电话，或只是一句：「我想见你一面，就一面。」\n\n" +
        "你心里那扇门，原来从没真正锁死。这一次，要不要给彼此、给那个十几年前的少年/少女，一个真正的交代？";
    }
    return "你们越走越近。深夜的消息一条接一条，约见的借口越找越多。" + n +
      "终于在某个雨夜停在你面前，眼里是孤注一掷的光：「我们……重来一次，好不好？这次别再放手。」\n\n" +
      (love_attached(s)
        ? "你脑子里却闪过家里的灯、" + love_spouse(s) + "的脸" + (has(s, "has_kid") ? "、还有孩子睡着的样子" : "") + "。一边是失而复得的旧爱，一边是亲手建起的家。这道选择题，没有不疼的答案。"
        : "这些年你以为自己早就放下了，此刻才知道，那团火只是被埋着，从没熄过。可重来真的还来得及吗，还是你们爱的，其实只是回不去的那个夏天？");
  },
  choices: [
    { label: "重续前缘，不顾一切奔向 ta", effect: (s) => {
        var n = love_name(s, "sg_first");
        flag(s, "saga_firstlove_done"); flag(s, "firstlove_reunite");
        if (love_attached(s)) {
          add(s, "mood", 4); add(s, "stress", 18); add(s, "reputation", -14);
          socialShift(s, -3);
          flag(s, "marriage_crisis");
          return "你选择了" + n + "。这意味着，亲手拆掉现在这个家。\n\n" +
            "你向" + love_spouse(s) + "坦白，那一夜没有人睡。流言、亲友的侧目、内心反复的拉扯……代价比你想的更重。" +
            "可当你和" + n + "十指相扣，又觉得这一次终于没有再错过。\n\n" +
            "没有人能评判你的心动，但你要替这份「重来」付出余生去偿还——爱与愧疚，从此长在了一起。";
        }
        add(s, "mood", 14); add(s, "charm", 1); add(s, "network", 2);
        socialShift(s, 2);
        if (!has(s, "partner")) { flag(s, "partner"); s.partnerName = n; }
        return "你不再犹豫，奔向了" + n + "。\n\n" +
          "兜兜转转十几年，你们终于把当年没接上的话说完、没走完的路走完。" +
          "有人说初恋是回不去的，可你们偏要用余生证明：有些人，值得你等过半生再相认。\n\n" +
          "这一次，你紧紧握住，再没松开。";
      } },
    { label: "发乎情，止乎礼，各自珍重", effect: (s) => {
        var n = love_name(s, "sg_first");
        flag(s, "saga_firstlove_done"); flag(s, "firstlove_restrain");
        add(s, "mood", -2); add(s, "insight", 4); add(s, "stress", -4); add(s, "reputation", 4);
        var tail = love_attached(s)
          ? "你对" + n + "说：「如果早十年遇见现在的我，就好了。可现在，我有要守的人。」ta 红着眼点头：「我懂。能再见你一面，我已经偷到了。」你守住了家，也守住了那份干净的喜欢。"
          : "你对" + n + "说：「我们爱的，也许是那个夏天，不是现在的彼此。」ta 沉默了很久，笑了：「你还是这么清醒，这么让人舍不得。」你们没有越界，把那段感情还回了青春里。";
        return "你深吸一口气，把伸出去的手，轻轻收了回来。\n\n" + tail + "\n\n" +
          "成年人的体面，是明知动心，仍选择不伤害任何人。这份克制，会疼很久，但你睡得着。";
      } },
    { label: "看清物是人非，一别两宽", effect: (s) => {
        var n = love_name(s, "sg_first");
        flag(s, "saga_firstlove_done"); flag(s, "firstlove_letgo");
        add(s, "mood", 2); add(s, "insight", 5); add(s, "stress", -6);
        return "真正坐下来长谈后，你忽然释然了。\n\n" +
          "眼前的" + n + "和记忆里那个人，早已是两个人。你们都被生活改了模样、磨了棱角，连说话的语气都陌生了。" +
          "你这才明白，你怀念的从来不是 ta，是那个敢喜欢、敢做梦的自己。\n\n" +
          "你们好好告了别。「祝你幸福」这四个字，这一次你说得心甘情愿。一别两宽，各生欢喜——那场夏天，终于可以落幕了。";
      } }
  ]
});

/* =====================================================================
 * SAGA 2 ── 背叛·出轨风波线  saga 名: betray   人物: s.sg_betray(第三者)
 * 第1幕(28+,需有伴/婚) 察觉裂痕(rnd 决定"你被背叛"还是"你动了心")
 *   → 第2幕(33+) 证据/暧昧升级、家庭裂痕、孩子/财产牵扯
 *   → 第3幕(结局) 摊牌离婚 / 隐忍维持 / 浪子回头破镜重圆
 * 视角 flag：betray_victim(你被背叛) / betray_tempted(你动了心)
 * 处理克制不低俗，批判的是「背叛」本身，不羞辱任何性别。
 * ===================================================================== */

/* —— 第1幕：那道说不清的裂痕 —— */
EVENTS.push({
  id: "ev_sagalove_betray_s1", module: "saga", ambient: true, once: true,
  cond: (s) => s.age >= 28 && love_attached(s) && !has(s, "saga_betray_s1"),
  title: "🌫️ 婚姻里多了一个影子",
  text: (s) => {
    var third = love_name(s, "sg_betray");
    // 视角由 rnd 决定：被背叛 / 自己动心。
    if (!has(s, "betray_pov_set")) { flag(s, "betray_pov_set"); if (rnd(0.5)) flag(s, "betray_victim"); else flag(s, "betray_tempted"); }
    if (has(s, "betray_victim")) {
      return "日子原本平淡得像一杯温水。直到最近，你开始觉得哪里不对。\n\n" +
        love_spouse(s) + "回家越来越晚，手机总是扣在桌上，铃声一响就走到阳台去接。" +
        "ta 笑的时候眼睛里有了你不认识的光，却很少再为你点亮。\n\n" +
        "今晚，ta 又说「公司加班」，可你分明在 ta 大衣上闻到一缕陌生的香水/烟草味。一个叫「" + third + "」的名字，开始频繁出现在 ta 的口中。你心里那根弦，绷紧了。";
    }
    return "你以为自己会是那种「永远不会出轨」的人。直到" + third + "出现。\n\n" +
      "只是工作上多了些交集，可不知从哪天起，你开始期待 ta 的消息，开始在和" + love_spouse(s) +
      "的争吵后，下意识想找 ta 倾诉。ta 懂你那些没人懂的疲惫，笑起来让你想起很久没有过的心动。\n\n" +
      "今晚 ta 发来一句「在想你」，你盯着屏幕，手指悬在键盘上方，迟迟没敢回。你知道，再往前一步，就回不了头了。";
  },
  choices: [
    { label: "正视它：把话挑明 / 退后一步", next: (s) => ({
        text: (s) => {
          var third = love_name(s, "sg_betray");
          return has(s, "betray_victim")
            ? "你决定不再装睡。趁" + love_spouse(s) + "洗澡，你看着那部亮起又熄灭的手机，也看着镜子里疲惫的自己——你想知道真相，又怕知道真相。"
            : "你深吸一口气，把那句「在想你」截图删了，对自己说：不能再这样下去。可" + third + "的脸，还是在脑子里挥之不去。";
        },
        choices: [
          { label: "把怀疑/心动，先压在心底观察", effect: (s) => {
              flag(s, "saga_betray_s1"); flag(s, "betray_silent_s1");
              add(s, "stress", 10); add(s, "mood", -6);
              return has(s, "betray_victim")
                ? "你没有当场发作。你假装一切如常，开始默默留意每一个细节——晚归的时间、对不上的行程、欲言又止的沉默。\n\n隐忍的人最累。你把怀疑咽下去，胃里却像压了块石头，夜夜难眠。"
                : "你给那段心动按下了暂停，强迫自己回到家庭里。可你越克制，那根刺扎得越深。你开始失眠，开始对" + love_spouse(s) + "的关心心虚地躲闪。\n\n你还没出轨，可心，已经偏了航。";
            } },
          { label: "直接摊牌，把窗户纸捅破", effect: (s) => {
              flag(s, "saga_betray_s1"); flag(s, "betray_open_s1");
              add(s, "stress", 14); add(s, "mood", -8);
              var third = love_name(s, "sg_betray");
              return has(s, "betray_victim")
                ? "你忍不住，当晚就问了出口：「那个" + third + "，到底是谁？」\n\n" + love_spouse(s) + "脸色一变，矢口否认：「你想多了，同事而已。」越是急着撇清，你心里那点不安越是落了地。一场冷战，从这一夜开始。"
                : "你把这份心动，向" + love_spouse(s) + "坦白了一半：「最近我状态不好，可能需要点距离。」ta 没听懂，只当你累了。你松了口气，又有点说不清的失落——这份诚实，到底是为了挽回，还是为了给越界留条后路？";
            } }
        ]
      }) },
    { label: "选择视而不见，假装无事发生", effect: (s) => {
        flag(s, "saga_betray_s1"); flag(s, "betray_avoid_s1");
        add(s, "stress", 6); add(s, "mood", -4); add(s, "insight", 1);
        return has(s, "betray_victim")
          ? "你选择不去戳破。你太害怕那个答案，害怕这个家就此散掉。\n\n你对自己说「也许是我多心」，把所有蛛丝马迹都强行解释成巧合。可掩耳盗铃换不来安稳——有些裂缝，你不看，它也在扩大。"
          : "你假装那份心动不存在，照常过日子。可你既没斩断，也没坦白，只是任由它在暗处发酵。\n\n你以为「不主动」就等于「无辜」。可暧昧从来不会原地踏步，它只会越走越远。";
      } }
  ]
});

/* —— 第2幕：裂痕升级，孩子与财产被卷了进来 —— */
EVENTS.push({
  id: "ev_sagalove_betray_s2", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_betray_s1") && !has(s, "saga_betray_s2") && s.age >= 33,
  title: "🔥 纸，终究包不住火",
  text: (s) => {
    var third = love_name(s, "sg_betray");
    var kidline = has(s, "has_kid")
      ? "更让你揪心的是孩子——ta 似乎也察觉了家里的低气压，变得沉默、爱躲房间，成绩一落千丈。"
      : "你们之间的冷，已经冻到了每一顿无话的晚饭。";
    if (has(s, "betray_victim")) {
      return "纸终究包不住火。\n\n" +
        "一条没来得及删的消息、一笔对不上的转账、一张落在车里的票根——证据像潮水，把你最后的侥幸冲垮了。" +
        love_spouse(s) + "和" + third + "的关系，远比你以为的更深。\n\n" + kidline + "\n\n" +
        "你们大吵了一架。ta 跪下来求你别冲动：「孩子还小」「房子车子怎么分」「再给我一次机会」。" +
        "愤怒、屈辱、不甘、还有一丝舍不得，在你胸口搅成一团。这个家，已经站在了悬崖边。";
    }
    return "你终究没刹住车。\n\n" +
      "和" + third + "的关系越过了那条线。短暂的甜蜜过后，是更大的恐慌——你开始撒更多的谎，活得像个间谍。\n\n" +
      "直到某天，" + love_spouse(s) + "红着眼把手机摔在你面前：「我们之间，到底还有没有必要演下去？」\n\n" + kidline + "\n\n" +
      "ta 没有大吵，只是异常平静地问你：「房子、存款、孩子，你打算怎么办？」那一刻你才惊觉，背叛的代价，是要拿整个家来结算的。";
  },
  choices: [
    { label: "撕破脸，开始清算这段关系", effect: (s) => {
        flag(s, "saga_betray_s2"); flag(s, "betray_escalate");
        add(s, "stress", 16); add(s, "mood", -10); add(s, "reputation", -6);
        socialShift(s, -2);
        return "你不想再演了。该算的账，一笔一笔摆上台面：感情、对错、房子、存款" +
          (has(s, "has_kid") ? "、还有孩子跟谁" : "") + "。\n\n" +
          "话越说越重，门越摔越响。亲友被惊动，两边开始站队。这个曾经温暖的家，第一次有了「分」这个字的轮廓。\n\n" +
          "你知道接下来无论怎么选，都得有人流血。";
      } },
    { label: "为了孩子/这个家，强忍着维持", effect: (s) => {
        flag(s, "saga_betray_s2"); flag(s, "betray_endure");
        add(s, "stress", 12); add(s, "mood", -8); add(s, "health", -4);
        return "你把所有委屈往肚子里咽。\n\n" +
          (has(s, "has_kid")
            ? "「至少等孩子大一点。」你用这句话说服自己，把破碎的婚姻重新粘好——尽管裂痕还在那里，一碰就疼。"
            : "「都这把年纪了，重新来过太难。」你这样劝自己，把脸上的笑容重新挂好。") +
          "\n\n你们维持着外人眼里的「和睦」，关起门来却是两座孤岛。这种活法不疼，是因为它早把人磨木了。";
      } },
    { label: "给出最后通牒：断了 ta，否则散", effect: (s) => {
        flag(s, "saga_betray_s2"); flag(s, "betray_ultimatum");
        add(s, "stress", 10); add(s, "strategy", 1); add(s, "insight", 2);
        var third = love_name(s, "sg_betray");
        return has(s, "betray_victim")
          ? "你压着怒火，给了最后一道底线：「立刻和" + third + "断干净，把一切交代清楚。给你一次机会，只有一次。」\n\nta 怔住，眼里翻涌着愧疚与挣扎。球，被你踢回了 ta 脚下——接下来怎么走，要看 ta 是不是真的想回头。"
          : "你做了一个迟来的决定：彻底斩断和" + third + "的纠缠。你对" + love_spouse(s) + "说：「给我一次弥补的机会，剩下的我用余生证明。」\n\nta 冷冷看着你，没答应，也没拒绝。你知道，信任一旦碎过，要重新拼起来，难如登天。";
      } }
  ]
});

/* —— 第3幕（结局）：摊牌离婚 / 隐忍维持 / 破镜重圆 —— */
EVENTS.push({
  id: "ev_sagalove_betray_s3", module: "saga", ambient: true, once: true,
  cond: (s) => has(s, "saga_betray_s2") && !has(s, "saga_betray_done"),
  title: "⚖️ 这段婚姻的最终判决",
  text: (s) => {
    var third = love_name(s, "sg_betray");
    var lead;
    if (has(s, "betray_escalate")) lead = "清算到了最后一步，律师函、调解室、亲友的劝与吵，把你们逼到了非选不可的关口。";
    else if (has(s, "betray_endure")) lead = "强撑的「和睦」终究撑到了极限。某个再寻常不过的深夜，你忽然问自己：这样的日子，还要骗自己过多久？";
    else lead = "最后通牒之后，命运给了你们一段沉默的缓冲期。如今，是时候给这段关系一个真正的答案了。";
    return lead + "\n\n" +
      (has(s, "betray_victim")
        ? "面对" + love_spouse(s) + "（和那个叫" + third + "的影子），你必须替自己、" + (has(s, "has_kid") ? "替孩子、" : "") + "替往后的人生，做一个决定。"
        : "面对被你伤过的" + love_spouse(s) + "，和那段越了界的过往，你必须为自己造的因，亲手了结这段果。");
  },
  choices: [
    { label: "摊牌离婚，分割财产，各奔东西", effect: (s) => {
        flag(s, "saga_betray_done"); flag(s, "betray_divorce");
        var lossRate = has(s, "betray_victim") ? 0.35 : 0.55;
        if (typeof familyDivorce === "function") familyDivorce(s, { civil: false, lossRate: lossRate, mood: -6, stress: 8, social: -3, text: "背叛风波走到最后，你们摊牌离婚并分割财产。" });
        else {
          if (has(s, "married")) { flag(s, "divorced"); s.flags["married"] = false; }
          if (has(s, "partner")) s.flags["partner"] = false;
          add(s, "mood", -6); add(s, "stress", 8);
          add(s, "cash", -Math.round((s.cash || 0) * lossRate));
          socialShift(s, -3);
        }
        add(s, "reputation", -4);
        var tail = has(s, "betray_victim")
          ? "调解书上签字那天，你的手很稳。" + (has(s, "has_kid") ? "为了孩子，你争到了一个体面的安排；" : "") + "你分到了该属于你的那一份，转身把过去留在身后。\n\n被辜负不是你的错。你哭过、恨过，最终选择体面地离开——余生很长，你要留给值得的人。"
          : "净身出户的代价，是这段背叛最公道的注脚。" + (has(s, "has_kid") ? "孩子选择留在受伤的那一方，探视权写进了协议里，每次见面你都不敢直视那双眼睛。" : "") + "\n\n你失去了家、失去了财产、也失去了别人的信任。这堂代价高昂的课，你用了半个家当来买——往后，但愿你真的懂了。";
        return "你选择了结束。" + tail;
      } },
    { label: "隐忍维持，从此貌合神离", effect: (s) => {
        flag(s, "saga_betray_done"); flag(s, "betray_coldwar");
        add(s, "mood", -8); add(s, "stress", 6); add(s, "health", -4); add(s, "insight", 2);
        return "你们没有离。\n\n" +
          (has(s, "has_kid") ? "为了孩子的那声「爸/妈」，" : "为了那点世俗的体面，") +
          "你们默契地把这桩事盖了起来，对外依旧是「模范夫妻」。可关起门来，是分了床的房间、对不上的眼神、客客气气的「吃了吗」。\n\n" +
          "婚还在，爱早没了。这种貌合神离的体面，像一件不合身的衣服——别人看着光鲜，只有自己知道哪里勒得慌。日子还得过，只是再也没了热气。";
      } },
    { label: "真心悔过/给一次机会，破镜重圆", effect: (s) => {
        flag(s, "saga_betray_done"); flag(s, "betray_reconcile");
        add(s, "mood", 6); add(s, "stress", -4); add(s, "charm", 1); add(s, "reputation", 2);
        var tail = has(s, "betray_victim")
          ? "ta 断了那段关系，把手机、行程、心事，一样样重新向你敞开。你没那么快原谅，但你愿意陪 ta 一起，把碎掉的信任，一片一片重新拼回去。" + (has(s, "has_kid") ? "孩子重新有了一个完整的家，笑声慢慢回到了饭桌上。" : "")
          : "你彻底斩断了和" + love_name(s, "sg_betray") + "的纠缠，用足够长的时间、足够多的笨拙的真心，去赎自己犯下的错。" + love_spouse(s) + "给了你一次机会，也立下了规矩。" + (has(s, "has_kid") ? "你格外珍惜每一次接孩子放学的傍晚。" : "");
        return "在反复的撕扯与挣扎之后，你们都选择了「再试一次」。\n\n" + tail + "\n\n" +
          "破镜重圆从不是回到从前，而是带着伤痕，重新学会信任。这条路更难走，但只要两个人都肯，裂痕也能长成彼此最懂的纹路。";
      } }
  ]
});
