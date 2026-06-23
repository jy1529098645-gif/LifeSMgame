"use strict";
/* content/events-drama.js —— 成人关系 drama：夜场冲动、高端晚宴、一见钟情、仙人跳、疾病风险。
   只写暗示与后果，不写露骨描写。模块仍归 love/relation，复用现有路线调度。 */

function dramx_addAilment(s, id) {
  s.ailmentIds = s.ailmentIds || [];
  if (s.ailmentIds.indexOf(id) < 0) s.ailmentIds.push(id);
  var a = (typeof ailments !== "undefined" ? ailments : []).find(x => x.id === id);
  s.timeline.push({ age: s.age, text: "🩺 体检提示「" + (a ? a.name : id) + "」。" });
}
function dramx_riskName() {
  return pick(["林眠", "许照", "周微澜", "陈鹿", "沈屿", "顾晴", "唐野", "白芮"]);
}
function dramx_riskyContact(s, risk) {
  add(s, "mood", 6); add(s, "stress", risk > 0.55 ? 5 : 2);
  flag(s, "drama_risky_contact");
  if (has(s, "partner") || has(s, "married")) { flag(s, "cheated"); add(s, "mood", -8); add(s, "reputation", -2); socialShift(s, -2); }
  var r = Math.random();
  if (r < risk * 0.18) { dramx_addAilment(s, "immuno_severe"); add(s, "health", -24); add(s, "stress", 18); return "几周后，体检报告把你从侥幸里拽醒：事情比你想得严重得多。医生没有审判你，只说“必须立刻治疗”。那一晚的冲动，忽然有了漫长的回声。"; }
  if (r < risk * 0.45) { dramx_addAilment(s, "sti_chronic"); add(s, "health", -10); add(s, "stress", 12); return "体检报告上多了几个刺眼的指标。医生说可以控制，但要长期复查。你攥着单子，第一次明白“玩得开”和“玩得起”不是一回事。"; }
  if (r < risk * 0.85) { dramx_addAilment(s, "sti_mild"); add(s, "health", -5); add(s, "stress", 7); return "身体很快给了你一记警告。治疗不算难，但挂号、检查、等待结果的那几天，足够把人吓清醒。"; }
  add(s, "insight", 1);
  return "什么大事都没发生。可第二天醒来，你看着陌生的天花板，心里有种说不清的空。侥幸不是安全，只是这次账单没立刻寄到。";
}

EVENTS.push({
  id: "ev_drama_afterparty_one_night",
  module: "love",
  ambient: true,
  cond: (s) => s.age >= 20 && s.age <= 45 && (s.mood < 70 || s.stress > 35) && !has(s, "immuno_severe"),
  title: "🌙 派对散场后的邀约",
  text: (s) => {
    var n = dramx_riskName(s);
    return "酒吧灯光暗下来，朋友们陆续散场。你和刚认识的" + n + "站在路边等车，夜风有点凉，话题却越聊越近。ta 笑着问：“要不要换个地方再坐一会儿？”你知道，这句话后面不只是咖啡。";
  },
  choices: [
    { label: "保持边界，叫车回家", effect: (s) => {
        add(s, "mood", 2); add(s, "stress", -3); add(s, "insight", 2);
        return "你笑着摆摆手，把车门关上。车窗外的霓虹往后退，你忽然觉得自己挺清醒。成年人的自由，也包括有能力说“不”。";
      } },
    { label: "继续约会，但把话说清楚", effect: (s) => {
        add(s, "mood", 6); add(s, "charm", 1); add(s, "cash", -800);
        if (rnd(0.18)) { s.crush = dramx_riskName(s); return "你们换了个安静的地方聊天，反而没有急着越界。凌晨分别时，ta 认真地说：“下次白天见吧。”一场差点滑向冲动的夜，意外变成了新的心动。"; }
        return "你们聊到很晚，暧昧有，克制也有。没有后悔，没有戏剧性爆炸，只是钱包少了点钱，心情松了点。";
      } },
    { label: "放纵一次，管它明天", effect: (s) => dramx_riskyContact(s, 0.65) }
  ]
});

EVENTS.push({
  id: "ev_drama_elite_banquet_love",
  module: "love",
  ambient: true,
  cond: (s) => s.age >= 24 && s.age <= 58 && (classTier(s) >= 3 || s.reputation >= 35 || s.network >= 65),
  title: "🥂 高端晚宴的一见钟情",
  text: (s) => {
    var n = dramx_riskName(s);
    var tone = (typeof byAccess === "function") ? byAccess(s, "elite_circle", { high: "这种场子你来去自如，名流见你都点头致意。", mid: "你勉强融进了这个场子，递名片的手有点紧。", low: "你站在这个圈子里，浑身不自在，生怕露怯。" }) : "";
    return "慈善晚宴上，灯光、香槟和名片都恰到好处。" + tone + "你在露台透气时遇见" + n + "。ta 不聊房车，不聊融资，只问你：“你最怕自己变成什么样的人？”那一瞬间，你竟有点失神。";
  },
  choices: [
    { label: "认真靠近，相信这次是真的", effect: (s) => {
        if (rnd(0.28 + s.stats.charm / 300)) {
          flag(s, "partner"); s.partnerName = dramx_riskName(s); add(s, "mood", 14); add(s, "charm", 2); socialShift(s, 3);
          return "你们没有急着交换资源，而是认真交换了秘密。几周后，ta 真的进入了你的生活。高端局里也会有真心，只是它往往穿得太像套路。";
        }
        flag(s, "drama_elite_lured"); add(s, "cash", -60000); add(s, "stress", 16); add(s, "insight", 3);
        return "你越陷越深，直到对方开始提“朋友的基金”“临时周转”“家族项目”。钱转出去后，热络迅速降温。你这才发现，心动可能是真的，剧本也是真的。";
      } },
    { label: "先查背景，再决定要不要动心", effect: (s) => {
        add(s, "cash", -5000); add(s, "strategy", 3); add(s, "insight", 3);
        if (rnd(0.55 + s.stats.strategy / 260)) {
          add(s, "reputation", 3);
          return "你托人打听了一圈，发现对方确实干净，只是圈子复杂。你没有立刻扑上去，反而赢得了对方尊重。越是闪亮的场合，越要慢一点。";
        }
        add(s, "mood", -4);
        return "你查到几段说不清的旧账和几张过于精致的合影。没有实锤，但直觉已经够用了。你礼貌退场，把那点心动留在露台的风里。";
      } },
    { label: "当作高端消遣，别谈真心", effect: (s) => {
        add(s, "mood", 5); add(s, "cash", -12000); add(s, "reputation", -2);
        return "你把它当成一场成年人游戏。香槟很好，夜景很好，彼此也都没有追问明天。只是回家后，你发现真正空下来的不是日程，是心里某个地方。";
      } }
  ]
});

EVENTS.push({
  id: "ev_drama_honeytrap",
  module: "relation",
  ambient: true,
  once: true,
  cond: (s) => s.age >= 24 && (classTier(s) >= 3 || s.reputation >= 45 || (s.startup && s.startup.valuation > 500000)),
  title: "📸 仙人跳",
  text: (s) => "一个暧昧邀约之后，局面突然变了。陌生人堵在门口，手机里晃着几张角度暧昧的照片：“老板，大家都是体面人，花点钱消灾。”"
    + ((typeof byAccess === "function") ? byAccess(s, "elite_nightlife", { high: "可你混迹这种场合多年，进门时就留了个心眼——录音笔一直开着，对方的套路你门儿清。", mid: "你脑子嗡的一声。体面，原来也是可以被勒索的资产。", low: "你完全没料到这一出，腿都软了——这种局，你从没见识过。" }) : "你脑子嗡的一声。体面，原来也是可以被勒索的资产。"),
  choices: [
    { label: "一眼识破，反将一军", cond: (s) => (typeof accessTone === "function" && accessTone(s, "elite_nightlife") === "high"), effect: (s) => {
        add(s, "strategy", 2); add(s, "reputation", 3); add(s, "stress", 4);
        return "你不慌不忙地掏出全程录音，又报了相熟的人。对方脸色煞白——他们挑错了对象。见过的世面，这一刻成了你的护身符：体面人也会做局，但做局的人最怕遇到更老练的体面人。";
      } },
    { label: "花钱封口，先保名声", effect: (s) => {
        var cost = byClass(s, { poor: 12000, mid: 50000, rich: 300000 });
        add(s, "cash", -cost); add(s, "stress", 18); add(s, "mood", -12); flag(s, "blackmailed");
        return "你把钱转了过去，对方笑着删了几张照片。你知道他们未必真的删干净，但今晚至少过去了。花钱买来的安静，听起来像耳鸣。";
      } },
    { label: "报警并留证据，硬刚", effect: (s) => {
        add(s, "stress", 12); add(s, "strategy", 3);
        if (rnd(0.5 + s.stats.strategy / 260)) { add(s, "reputation", 4); return "你强迫自己冷静下来，录音、截图、定位，一套做完再报警。对方没想到你不吃这一套，灰溜溜散了。体面不是不出事，是出事时还有胆量把灯打开。"; }
        add(s, "reputation", -10); add(s, "mood", -10);
        return "你报了警，但消息还是漏了出去。朋友圈里没人明说，眼神却都变了。你没有被勒索成功，却被流言判了缓刑。";
      } },
    { label: "找关系私了，反向施压", effect: (s) => {
        add(s, "network", -8); add(s, "cash", -30000); add(s, "reputation", -4); add(s, "strategy", 2);
        return "你托人把对方的底翻了出来。事情压下去了，人情也花出去了。你赢得不算光彩，但至少把主动权抢回来一点。";
      } }
  ]
});

EVENTS.push({
  id: "ev_drama_old_flame",
  module: "love",
  ambient: true,
  cond: (s) => s.age >= 30 && (has(s, "married") || has(s, "partner")) && (s.stress > 35 || s.mood < 62),
  title: "🔥 旧爱深夜来信",
  text: (s) => {
    var ta = s.partnerName || "身边人";
    return "深夜，一个久违的头像亮起：“最近还好吗？”你盯着屏幕很久。那是曾经差点走到一起的人。客厅里，" + ta + "已经睡了，手机的光照得你像个正在犯错的人。";
  },
  choices: [
    { label: "删掉对话，把手机扣下", effect: (s) => {
        add(s, "stress", -4); add(s, "mood", 3); add(s, "insight", 2);
        return "你没有回复。不是因为毫无波澜，而是因为你知道波澜会把人带到哪里。第二天醒来，一切照旧，但你心里多了一点对自己的尊重。";
      } },
    { label: "只聊近况，守住边界", effect: (s) => {
        add(s, "mood", 2); add(s, "stress", 2);
        if (rnd(0.25)) { add(s, "stress", 8); return "你以为只是寒暄，对方却越聊越暧昧。你及时停住，但心里已经被搅乱。所谓边界，最难的是在刚开始模糊时就承认它正在模糊。"; }
        return "你们聊了几句近况，礼貌收尾。旧情像一只隔着玻璃的蝴蝶，漂亮，但不必放进屋里。";
      } },
    { label: "赴约见一面", effect: (s) => {
        var out = dramx_riskyContact(s, 0.38);
        add(s, "reputation", -4); socialShift(s, -2);
        if (has(s, "married") && rnd(0.38)) {
          if (typeof familyDivorce === "function") familyDivorce(s, { civil: false, lossRate: 0.30, mood: -18, stress: 18, social: -3, text: "旧爱风波暴露后，你们的婚姻走到尽头。" });
          else { flag(s, "divorced"); delete s.flags.married; delete s.flags.partner; add(s, "mood", -18); add(s, "stress", 18); }
          return out + " 事情最终还是露了馅。争吵、沉默、分居，接着是离婚。你以为只是见一面，现实却按整段人生结了账。";
        }
        return out;
      } }
  ]
});

EVENTS.push({
  id: "ev_drama_health_report",
  module: "health",
  ambient: true,
  cond: (s) => has(s, "drama_risky_contact") && s.age >= 20 && !has(s, "drama_health_checked"),
  title: "🧪 不敢打开的体检报告",
  text: (s) => "手机弹出体检报告已出的通知。你点开又退出，退出又点开。过去那几次混乱的夜晚忽然排队站到你面前。报告不是审判书，但它会诚实地告诉你，身体有没有替你记账。",
  choices: [
    { label: "立刻复查，认真治疗", effect: (s) => {
        flag(s, "drama_health_checked"); add(s, "cash", -12000); add(s, "stress", -10); add(s, "health", 8); add(s, "insight", 3);
        if (s.ailmentIds && s.ailmentIds.indexOf("sti_mild") >= 0 && rnd(0.65)) s.ailmentIds = s.ailmentIds.filter(x => x !== "sti_mild");
        return "你挂号、复查、按医嘱治疗。过程尴尬、花钱、折腾，但至少把失控的事重新拉回了可控。成年人最该补的一课，是对自己负责。";
      } },
    { label: "拖一拖，别自己吓自己", effect: (s) => {
        flag(s, "drama_health_checked"); add(s, "stress", 8); add(s, "health", -8);
        if (rnd(0.28)) { dramx_addAilment(s, "sti_chronic"); return "你把报告压了几个月，症状却没有自己消失。再去医院时，医生皱眉问：“怎么现在才来？”拖延没有让问题消失，只是让它变贵。"; }
        return "你拖了很久，最后发现只是虚惊一场。侥幸让你松了口气，也让你有点后怕。下一次，最好别再靠运气。";
      } },
    { label: "装作没看见", effect: (s) => {
        flag(s, "drama_health_checked"); add(s, "mood", -4); add(s, "health", -14); add(s, "stress", 12);
        if (rnd(0.18)) dramx_addAilment(s, "immuno_severe");
        else if (rnd(0.4)) dramx_addAilment(s, "sti_chronic");
        return "你把通知划掉，继续生活。可身体不会因为你不看报告就停止变化。有些账，越晚打开，利息越高。";
      } }
  ]
});
