"use strict";
/* =====================================================================
 * content/events-crash.js —— 股灾 / 泡沫破裂专属戏剧事件
 * 风口泡沫破裂时(s.world.crash 激活)触发，且会读你【实际持仓】来对症下戏：
 * 满仓踩雷→割肉还是死扛、抄底诱惑、杠杆爆仓、逃顶传说、股友群哀鸿……
 * 引擎在崩盘周优先让这些事件登场。module:"crash"。
 * ===================================================================== */
function crash_sector(s) { return (s.world && s.world.crash) ? s.world.crash.sector : null; }
// 你在崩盘板块的持仓市值
function crash_held(s) {
  const sec = crash_sector(s); if (!sec || !s.market) return 0;
  let v = 0; (typeof stocksBySector === "function" ? stocksBySector(sec) : []).forEach(function (st) { v += (s.market.hold[st.id] || 0) * (s.market.prices[st.id] || 0); });
  return Math.round(v);
}
// 一键割肉：卖光崩盘板块的持仓，返回到手现金
function crash_dump(s) {
  const sec = crash_sector(s); if (!sec || !s.market) return 0;
  let got = 0; (typeof stocksBySector === "function" ? stocksBySector(sec) : []).forEach(function (st) {
    const n = s.market.hold[st.id] || 0; if (n > 0) { got += s.market.prices[st.id] * n; s.market.hold[st.id] = 0; }
  });
  got = Math.round(got); if (got > 0) add(s, "cash", got);
  return got;
}

/* ① 满仓踩雷：你重仓的板块崩了，账户一夜腰斩 —— 割肉 / 死扛 / 借钱抄底 */
EVENTS.push({
  id: "ev_crash_trapped", module: "crash", ambient: true,
  cond: (s) => !!crash_sector(s) && crash_held(s) >= 20000,
  title: "🩸 满仓踩雷",
  text: (s) => `你重仓的「${crash_sector(s)}」一夜崩盘，账户里那串数字以肉眼可见的速度蒸发——昨天还在算什么时候财务自由，今天已经腰斩。手指悬在「卖出」上，抖个不停。`,
  choices: [
    { label: "割肉止损，认栽离场", effect: (s) => { const got = crash_dump(s); add(s, "mood", -8); add(s, "insight", 3); add(s, "stress", 4); return `你闭着眼点了「全部卖出」，到手 ¥${got.toLocaleString()}——比成本少了一大截。割肉的疼是真疼，但你保住了不再往无底洞里填的本钱。「及时止损」四个字，是用钱买来的。`; } },
    { label: "死扛到底，赌它反弹", next: (s) => ({
        text: (s) => "你把交易软件卸了，告诉自己「不卖就不算亏」。可账户的窟窿，并不会因为你不看就自动愈合。",
        choices: [
          { label: "再死扛，信仰充值", effect: (s) => { add(s, "stress", 8); if (rnd(0.3)) { add(s, "mood", 6); bumpMomentum(s, 5); return "几个月后，板块竟真触底回了一波。你解套那天长出一口气——这次是运气，不是水平，你心里清楚。"; } const lost = crash_dump(s); add(s, "mood", -12); add(s, "health", -3); return `你扛了又扛，板块却跌跌不休。等你终于受不了清仓，只剩 ¥${lost.toLocaleString()}——死扛换来的，是更深的坑。`; } },
          { label: "想通了，还是认赔卖了", effect: (s) => { const got = crash_dump(s); add(s, "insight", 2); add(s, "mood", -5); return `你想明白了：套牢的钱不是钱，只是数字；活钱才是钱。清仓拿回 ¥${got.toLocaleString()}，转身不再回头看。`; } }
        ]
      }) },
    { label: "借钱抄底，赌一把翻身", effect: (s) => { add(s, "stress", 12); flag(s, "risk_hustle"); if (rnd(0.22)) { add(s, "cash", 80000); add(s, "mood", 8); bumpMomentum(s, 8); return "你借钱杀了进去，正好抄在地板上。反弹来的时候，你不仅回了本还赚了一笔——但回想那几个不眠之夜，你后背发凉。"; } add(s, "cash", -60000); add(s, "mood", -14); add(s, "health", -4); flag(s, "got_scammed"); return "你以为抄到了底，没想到地板下面还有地下室。借来的钱也填了进去，越陷越深——「别人贪婪我恐惧」，你把它活反了。"; } }
  ]
});

/* ② 抄底诱惑：你没怎么套，手里有现金 —— 抄底赌反弹 vs 空仓观望 */
EVENTS.push({
  id: "ev_crash_bottom", module: "crash", ambient: true,
  cond: (s) => !!crash_sector(s) && crash_held(s) < 8000 && s.cash > 50000,
  title: "🎣 抄底的诱惑",
  text: (s) => `「${crash_sector(s)}」崩成了一地鸡毛，到处都在喊「黄金坑」「跌出价值了」。你手里正好有点闲钱，心痒痒——抄在别人恐惧时，是巴菲特；抄在半山腰，是接盘侠。`,
  choices: [
    { label: "杀进去赌反弹", effect: (s) => { const bet = Math.min(s.cash * 0.4, 100000); add(s, "cash", -bet); add(s, "stress", 6); if (rnd(0.35)) { add(s, "cash", Math.round(bet * 1.9)); add(s, "mood", 10); add(s, "strategy", 2); bumpMomentum(s, 6); return `你押了 ¥${Math.round(bet).toLocaleString()}。这次真抄在了脚踝上——后来板块缓过劲来，你的本金接近翻倍。市场恐慌时，机会也藏在恐慌里。`; } add(s, "cash", Math.round(bet * 0.4)); add(s, "mood", -8); return `你押了 ¥${Math.round(bet).toLocaleString()}，却抄在了半山腰。它还在跌，你这才懂：所谓「黄金坑」，下面常常还有更深的坑。`; } },
    { label: "再跌也跟我无关，空仓观望", effect: (s) => { add(s, "insight", 2); add(s, "mood", 2); return "你按住了手。看着满屏的「抄底」喊单，你想起那句老话：你看上的是它的反弹，它看上的是你的本金。这一次，你选择当个看客。"; } }
  ]
});

/* ③ 股友群哀鸿遍野：社交向，群里一片绿 */
EVENTS.push({
  id: "ev_crash_group", module: "crash", ambient: true,
  cond: (s) => !!crash_sector(s) && s.age >= 22,
  title: "💬 股友群里一片绿",
  text: (s) => `泡沫破裂这几天，你的炒股群从「财富自由倒计时」秒变「ICU 抢救室」：有人晒腰斩截图，有人发「再也不碰股票」的血书，还有人默默退了群。`,
  choices: [
    { label: "发个表情包活跃气氛", effect: (s) => { add(s, "mood", 3); socialShift(s, -1); return "你甩了个「绿色心情」的表情包，群里哀嚎中夹了几声苦笑。患难见真情——亏钱的时候，能一起自嘲的群友，也是种慰藉。"; } },
    { label: "默默退群，眼不见心不烦", effect: (s) => { add(s, "stress", -4); add(s, "insight", 2); return "你点了「退出群聊」。少看点喊单和哀嚎，心反而静了。投资这事，到头来是自己跟自己的修行，跟谁聊都没用。"; } }
  ]
});

/* ④ 杠杆爆仓：用了杠杆/借钱炒股的人，崩盘时被强平 */
EVENTS.push({
  id: "ev_crash_margincall", module: "crash", ambient: true,
  cond: (s) => !!crash_sector(s) && crash_held(s) >= 15000 && (has(s, "risk_hustle") || has(s, "has_loan")),
  title: "📉 杠杆爆仓",
  text: (s) => "崩盘第三天，券商的强平短信冰冷地弹了出来：你加了杠杆的仓位，已被自动平掉。屏幕上鲜红的「已强制平仓」，比亏损本身更让人手脚发凉。",
  choices: [
    { label: "认了，杠杆是把双刃剑", effect: (s) => { const loss = Math.min(s.cash > 0 ? s.cash * 0.5 : 0, 120000) + 30000; add(s, "cash", -Math.round(loss)); add(s, "mood", -16); add(s, "stress", 14); add(s, "health", -4); add(s, "insight", 4); flag(s, "been_bankrupt"); return `连本带利亏掉一大笔，你瘫在椅子上半天没动。杠杆能让你飞快，也能让你飞快归零——这一课的学费，够贵的。`; } }
  ]
});

/* ⑤ 逃顶传说：崩盘前清仓 / 本就没仓的人 —— 凡尔赛一把 */
EVENTS.push({
  id: "ev_crash_dodged", module: "crash", ambient: true,
  cond: (s) => !!crash_sector(s) && crash_held(s) < 1000 && (has(s, "wind_hint") || s.stats.insight >= 55),
  title: "🍀 我又躲过一劫",
  text: (s) => `「${crash_sector(s)}」崩盘的消息刷屏时，你淡定地喝着茶——你前阵子看新闻觉得太热了，早早落袋为安。如今满城套牢，你毫发无伤，甚至还有点小得意。`,
  choices: [
    { label: "低调，闷声发财", effect: (s) => { add(s, "mood", 8); add(s, "insight", 2); add(s, "reputation", 1); return "你没在群里炫耀，只是默默把这次的经验记下：泡沫最响的时候，往往就是该走的时候。逃顶一时爽，但你知道，运气也占了一半。"; } },
    { label: "朋友圈含蓄地秀一下", effect: (s) => { add(s, "mood", 5); socialShift(s, 4); return "你发了条「果然还是落袋为安香」的朋友圈，配图是一杯茶。点赞里有羡慕，也有几个套牢的老同学，默默把你屏蔽了。"; } }
  ]
});

/* ⑥ 专家变嘴炮：当初喊单的专家集体失声 */
EVENTS.push({
  id: "ev_crash_expert", module: "crash", ambient: true, once: true,
  cond: (s) => !!crash_sector(s),
  title: "🎤 专家集体失声",
  text: (s) => `泡沫吹得最大时，电视和短视频里那些「闭眼买、稳赚不赔」的专家，如今集体玩起了消失。有人删了视频，有人改口「我早说过有风险」，脸皮厚度叹为观止。`,
  choices: [
    { label: "记住这张脸，再不信嘴炮", effect: (s) => { add(s, "insight", 3); add(s, "strategy", 1); return "你截了图存好。这世上喊单的人千千万，赚了是他英明，亏了是你贪婪——独立判断，才是穿越牛熊唯一靠得住的东西。"; } }
  ]
});
