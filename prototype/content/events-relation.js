"use strict";
/* content/events-relation.js —— 社交圈钩子事件：低态度反噬，高态度托举。 */

function relationList(s, pred) {
  return (s.social || []).filter(pred);
}
function relationPickLow(s) {
  return pick(relationList(s, n => n.role !== "爸妈" && n.attitude <= 35));
}
function relationPickHigh(s) {
  return pick(relationList(s, n => n.attitude >= 72));
}
function relationLabel(n) {
  return n.role + "「" + n.name + "」";
}

EVENTS.push({
  id: "ev_relation_cold_circle",
  module: "relation",
  ambient: true,
  cond: (s) => relationList(s, n => n.attitude <= 25).length > 0,
  title: "🧊 被社交圈孤立",
  text: (s) => {
    const n = pick(relationList(s, x => x.attitude <= 25));
    return "深夜你在群里发了句近况，附了张窗外的灯火，配文写了删、删了写，最后只留下一句轻飘飘的“最近还行”。消息发出去，屏幕安静得像被人按了静音键。十分钟过去，一个小时过去，那行“某某正在输入”始终没有亮起。最后，只有" + relationLabel(n) + "迟迟回了个客套的笑脸表情，连一个字都欠奉。你盯着那个黄澄澄的圆脸看了很久，忽然懂了一件事——在这圈曾经一起喝过酒、称兄道弟的人眼里，你已经被悄悄折叠进了通讯录最不起眼的那一层，是那种逢年过节都懒得群发祝福的角色。";
  },
  choices: [
    {
      label: "主动破冰，请大家吃饭",
      effect: (s) => {
        const n = pick(relationList(s, x => x.attitude <= 25));
        add(s, "cash", -1200); add(s, "stress", 5);
        if (rnd(0.45 + s.stats.charm / 200)) {
          socialBoostRole(s, n.role, 12); add(s, "network", 3); add(s, "mood", 3);
          return "你硬着头皮订了个包间，一个个私聊把人请齐。饭局开头那十分钟尴尬得能听见自己心跳，你只好先认错似的敬了一圈酒，把冷掉的旧话题一点点焐热。聊着聊着，有人接了梗，有人补了句往事，气氛竟也松动起来。散场时" + n.name + "拍了拍你的肩，说了句“以后多联系，别老一个人闷着”。你知道这话有几分客套，可那只手是热的。关系没有立刻回春，但你亲手在冰面上凿开了一道缝，缝里透出一点光。";
        }
        socialBoostRole(s, n.role, -5); add(s, "mood", -6);
        return "饭是你掏钱请的，话是你硬着头皮找的，连冷场时那阵要命的尴尬，也是你一个人扛着圆回来的。席间几个人低头刷手机，礼貌地“嗯”“哦”，没人真正接你的话茬。结账时你抢着买单，对方象征性地推了一下就收了手。一顿饭吃下来，客客气气地各自散去，谁都没多留。冷板凳还是那张冷板凳，你不过是花钱买了个明白：有些热乎，是单方面焐不热的。";
      }
    },
    {
      label: "不强求，慢慢退出",
      effect: (s) => {
        socialShift(s, -3); add(s, "network", -4); add(s, "stress", -4); add(s, "insight", 2);
        return "你把那个群聊设成了免打扰，红点不再跳，世界忽然清净。你不再费劲去证明自己还算合群，不再为一句没人接的话反复揣测自己是不是说错了什么。人脉表上确实少了一截，可压在胸口那块说不清的石头，也跟着卸下去不少。你慢慢想明白：有些关系不是被谁掐断的，是你终于肯承认——它早就空了，空了很久，只是你一直舍不得撤掉那盏其实没人在等你的灯。";
      }
    }
  ]
});

EVENTS.push({
  id: "ev_relation_loan_rejected",
  module: "relation",
  ambient: true,
  cond: (s) => s.age >= 22 && s.cash < 8000 && relationList(s, n => n.role !== "爸妈" && n.attitude <= 35).length > 0,
  title: "💸 借钱被拒",
  text: (s) => {
    const n = relationPickLow(s);
    return "房租的催缴短信、信用卡的账单提醒、还有一笔临时冒出来的开销，像约好了似的一起压过来，把你这个月的现金流逼到了墙角。你打开通讯录，从头划到尾，手指在每个名字上都停了一下，又划过去。最后停在" + relationLabel(n) + "那里。你删了三遍措辞，把“借”字换成“周转”，把数目压了又压，才终于按下发送。对方的“正在输入”亮了又灭、灭了又亮，足足磨了半天，像是在斟酌一份合同。然后，屏幕上跳出一行字：“不好意思啊，我最近手头也紧，实在不方便。”短短一句，客气，得体，滴水不漏，却把你那点小心翼翼的指望，干干净净地堵了回来。";
  },
  choices: [
    {
      label: "低头再求一次",
      effect: (s) => {
        const n = relationPickLow(s);
        add(s, "stress", 6);
        if (n.kind === "仗义" && rnd(0.4)) {
          add(s, "cash", 3000); add(s, "mood", 4); socialBoostRole(s, n.role, 8);
          return "你咬咬牙，把脸面先放到一边，把这阵子的难处一五一十摊开讲——不夸大，也不再遮掩。" + n.name + "那头沉默了很久，久到你以为又要被婉拒。然后转账提示亮了，三千块，附言只有一行：“别嫌少，先顶一下，缓过来再说，不急。”你盯着那行字，眼眶莫名发热。原来不是所有的“最近不方便”都等于冷漠，有的人只是需要你把真话说到他能接住的地方。";
        }
        add(s, "mood", -8); add(s, "reputation", -3); socialBoostRole(s, n.role, -10);
        return "你放下身段又解释了一遍，把日子的窘迫几乎是摊在了地上，换来的却是比上一次更长的沉默。对话框里那行“正在输入”闪了两下，终究没有变成任何一个字。后来你又补了句“方便的话哪怕一点也行”，" + n.name + "干脆不回了，消息停在那里，像一扇被轻轻关上的门。缺钱的时候最容易看清一段关系的成色，也最容易把自己仅剩的那点体面，一点点磨没在别人的已读不回里。";
      }
    },
    {
      label: "收回消息，自己周转",
      effect: (s) => {
        add(s, "cash", 2000); add(s, "stress", 8); add(s, "strategy", 2); add(s, "mood", -3);
        return "你长按那条消息，点了撤回，仿佛连刚才那一瞬间的开口求人都要一并抹掉。然后你转过身，接了两个能熬夜赶的零活，退掉几笔本舍不得退的订单，又翻出抽屉里能变现的旧物挂上二手平台。钱是一笔笔抠出来的，每一笔都来得辛苦，肩膀压得发酸。但夜里算完账躺下时，你心里反倒踏实——这一回，至少没有再把自己的尊严，摆到别人的饭桌上，由人家慢条斯理地议价。";
      }
    }
  ]
});

EVENTS.push({
  id: "ev_relation_relative_fallout",
  module: "relation",
  ambient: true,
  once: true,
  cond: (s) => relationList(s, n => (n.role === "亲戚群" || n.kind === "势利") && n.attitude <= 38).length > 0,
  title: "🧨 亲戚翻脸",
  text: (s) => {
    const n = pick(relationList(s, x => (x.role === "亲戚群" || x.kind === "势利") && x.attitude <= 38));
    return "家族群里本来在晒孩子的成绩单、谁家又换了车，气氛热热闹闹。轮到你时，" + relationLabel(n) + "忽然不阴不阳地接了一句：“哎，有些人吧，混得不怎么样，脾气倒是见长，说不得碰不得。”一句话出口，群里那几个一向爱看热闹的，立刻跟着“哈哈”地敲表情。紧接着旧账被翻出来——当年谁借了钱没还、谁过年没来磕头、谁混得比谁强——人情、面子、攀比，一锅乱炖地端到了你面前。屏幕那头几十双眼睛，正等着看你这道菜怎么咽下去。";
  },
  choices: [
    {
      label: "当场回怼，把账摊开",
      effect: (s) => {
        const n = pick(relationList(s, x => (x.role === "亲戚群" || x.kind === "势利") && x.attitude <= 38));
        add(s, "stress", 8); add(s, "mood", 2); add(s, "network", -6);
        socialBoostRole(s, n.role, -15); socialShift(s, -4);
        return "你深吸一口气，手指在屏幕上敲得飞快。这些年谁逢年过节伸手要过红包、谁背着人在另一个群里嚼你的舌根、谁当面热络背后冷眼，你一条条、一桩桩，连日期带细节地摆到了台面上。群里瞬间死寂，刚才还“哈哈”的那几个，一个接一个地潜了水。" + n.name + "气得发了一长串语音又删掉。这场嘴仗你赢得干净利落，痛快得心口都松了一下——可那层维系了大半辈子、薄得像窗户纸的亲戚体面，也被你亲手撕得粉碎，再也糊不回去了。";
      }
    },
    {
      label: "冷处理，只保留礼数",
      effect: (s) => {
        const n = pick(relationList(s, x => (x.role === "亲戚群" || x.kind === "势利") && x.attitude <= 38));
        add(s, "stress", -2); add(s, "network", -3); add(s, "insight", 3); socialBoostRole(s, n.role, -6);
        return "你盯着那句挑衅看了几秒，指尖悬在键盘上方，最终一个字都没回。你只是默默把那个群设成了免打扰，让它从此安静地沉在列表底部。该有的礼数你一样不少——逢年过节的祝福照发，长辈生日的红包照到，面子上挑不出半点错处。可你心里那扇曾经为他们留过缝的门，轻轻地、彻底地合上了。你慢慢懂得：当一段所谓的亲情只剩下单方面的消耗与刺痛，体面地退到三步之外，本身就是一种自救。";
      }
    }
  ]
});

EVENTS.push({
  id: "ev_relation_partner_betrayal",
  module: "relation",
  ambient: true,
  once: true,
  cond: (s) => (has(s, "startup") || has(s, "startup_done") || s.stageId === "hustle") && relationList(s, n => n.role !== "爸妈" && n.attitude <= 32).length > 0,
  title: "🗡️ 合伙人背刺",
  text: (s) => {
    const n = pick(relationList(s, x => x.role !== "爸妈" && x.attitude <= 32));
    return "一个客户在电话里随口提了句“你们那位" + n.name + "上周不是已经单独对接过了吗”，你心里咯噔一下，笑着应付完，挂了电话立刻去翻记录。越查越凉——" + relationLabel(n) + "私下截走了那个你跑了三个月的关键客户，还把你俩熬过好几个通宵、一起在白板上画出来的方案，换了个封面、改了几行字，堂而皇之地发给了别人。你坐在屏幕前，半天没动。最讽刺的是，就在不久前，你还在朋友面前拍着胸脯说，这是个能一起扛事、能交后背的兄弟。原来有些刀，是从你最信的那个方向捅过来的。";
  },
  choices: [
    {
      label: "证据留齐后摊牌",
      effect: (s) => {
        const n = pick(relationList(s, x => x.role !== "爸妈" && x.attitude <= 32));
        add(s, "stress", 12); add(s, "strategy", 3); socialBoostRole(s, n.role, -25);
        if (rnd(0.55 + s.stats.strategy / 220)) {
          add(s, "reputation", 5); add(s, "cash", 8000);
          return "你压住怒火，没有当场发作。接下来几天，你不动声色地补齐合同、固定聊天记录、把方案的原始时间戳一份份导出来，又抢在对方前面给客户打了通电话，把关系重新焐稳。摊牌那天，你把证据一页页推到" + n.name + "面前，他张了张嘴，脸涨得通红，最终一个字也辩不出来。项目被你硬生生从悬崖边抢救了回来。背刺的那一下钻心地疼，但你咬着牙做到了一件事——没让那把刀，扎进来第二回。";
        }
        add(s, "cash", -12000); add(s, "mood", -10);
        return "你留齐了证据，却到底低估了对方下手的狠和快。等你把材料整理妥当，客户那边的合同早已签到了别人名下，连解释的机会都没留给你。项目伤了元气，账上凭空裂开一道大口子，你看着那串往下掉的数字，胸口闷得喘不上气。这一课买得太贵：合作的时候光谈理想和情怀远远不够，更得在还笑着喝酒的那天，就把退出机制和最坏打算，白纸黑字地谈清楚。";
      }
    },
    {
      label: "先忍住，悄悄收权限",
      effect: (s) => {
        const n = pick(relationList(s, x => x.role !== "爸妈" && x.attitude <= 32));
        add(s, "stress", 10); add(s, "mood", -8); add(s, "insight", 2); socialBoostRole(s, n.role, -12);
        return "你没有摔门，没有质问，连脸色都没变。第二天照常一起开会、一起吃饭，你笑着递烟，心里却在飞快地盘算。接下来的日子，你一项项地把核心权限切走、把关键客户的对接人悄悄换成自己、把账目和密码一道道收回手里，每一步都做得自然得像是例行调整。等对方后知后觉想再伸手时，才发现能碰的东西已经所剩无几。你想明白了：真正的反击从来不是在饭桌上吵赢一场，而是不动声色地，让背刺你的人再也够不到你的命门。";
      }
    }
  ]
});

EVENTS.push({
  id: "ev_relation_mentor_help",
  module: "relation",
  ambient: true,
  cond: (s) => relationList(s, n => n.attitude >= 82).length > 0,
  title: "🌟 贵人相助",
  text: (s) => {
    const n = pick(relationList(s, x => x.attitude >= 82));
    return "饭局快散场时，你不过是随口叹了句，最近有个坎卡得难受，话说出口就准备揭过去。没想到" + relationLabel(n) + "放下了筷子，认认真真地追问起来——细节、卡点、你试过哪些路子，一桩桩听得仔细。听完，对方沉吟片刻，说：“这事我心里有个人，回头我帮你问问，你先别急。”说得轻描淡写，却让你心里一热。你忽然意识到，真正分量够的关系，从不需要你低声下气地张口去求；到了节骨眼上，它会自己先把手伸过来。";
  },
  choices: [
    {
      label: "真诚接住，也记得回馈",
      effect: (s) => {
        const n = pick(relationList(s, x => x.attitude >= 82));
        add(s, "network", 10); add(s, "reputation", 6); add(s, "strategy", 3); add(s, "mood", 6);
        socialBoostRole(s, n.role, 6);
        return "没过几天，" + n.name + "果然替你牵上了那根关键的线，三言两语就把你卡了许久的死结解开了。你没有把这份好意当成理所当然——事成之后专门登门道了谢，记着对方爱喝的那口茶，逢年过节也实实在在地把人情补了回去。一来一往之间，这段关系反倒比从前更稳、更暖了。贵人本就可遇不可求，遇上了，更要懂得用真心去接、用分寸去还。";
      }
    },
    {
      label: "急着变现，把人情用满",
      effect: (s) => {
        const n = pick(relationList(s, x => x.attitude >= 82));
        add(s, "cash", 12000); add(s, "reputation", -3); socialBoostRole(s, n.role, -14);
        return "你像是抓住了根救命稻草，顺着这条线一刻没歇地往下扒，没几天就实打实捞到了一笔不小的好处。可你吃相太急了点——还没等热乎劲过去，又追着问下一回能不能再帮个忙。" + n.name + "嘴上仍旧答应着，也确实又帮了你，但那语气里的热度，肉眼可见地凉了几分。你这才后知后觉地反应过来：人情是细水长流的交情，不是一次性刷到底就作废的提款机，刷得太狠，卡是会被悄悄注销的。";
      }
    }
  ]
});

EVENTS.push({
  id: "ev_relation_intro_chance",
  module: "relation",
  ambient: true,
  cond: (s) => relationList(s, n => n.role !== "爸妈" && n.attitude >= 72).length > 0,
  title: "🔗 被介绍机会",
  text: (s) => {
    const n = pick(relationList(s, x => x.role !== "爸妈" && x.attitude >= 72));
    return relationLabel(n) + "忽然给你转来一张名片的截图，后面跟着一段语音：“这个机会我觉得挺适合你，对方那边我已经替你打过招呼、铺过话了，你直接联系就行。”你捏着手机，心里既兴奋又沉甸甸的。你太清楚这种引荐的分量了——别人肯把自己的脸和信用押上来替你开门，不是因为你有多了不起，而是赌你不会让他在牵线人那头丢人，赌你上场之后不会砸了他的招牌。这一份信任，比机会本身还重。";
  },
  choices: [
    {
      label: "认真准备，漂亮接住",
      effect: (s) => {
        const n = pick(relationList(s, x => x.role !== "爸妈" && x.attitude >= 72));
        add(s, "network", 8); add(s, "cash", 6000); add(s, "reputation", 5); add(s, "knowledge", 2);
        socialBoostRole(s, n.role, 5);
        return "你把这次会面当成一场硬仗来打：提前扒了对方的背景、行业的近况，连可能被问到的刁钻问题都一条条写下来想好对策。见面那天，从切入的问题、落地的方案到合作的边界，你都讲得有理有据、收放有度，没有一句虚的。对方听得连连点头，主动约了下一次细谈。事后" + n.name + "发来消息，说“你给我长脸了”，言语间藏不住的得意。你愈发确信：在成年人的世界里，靠谱二字，是流通性最强、面值最高的社交货币。";
      }
    },
    {
      label: "随缘去聊，能成就成",
      effect: (s) => {
        const n = pick(relationList(s, x => x.role !== "爸妈" && x.attitude >= 72));
        if (rnd(0.35)) { add(s, "cash", 3000); add(s, "network", 3); return "你没怎么准备，赤手空拳就去了，全凭一张嘴临场接话。好在那天状态在线，几句玩笑、几个恰到好处的观点，竟也聊出了点火花，对方临走时说“以后有合适的再叫上你”。机会不算大，但那扇门好歹没在你面前合上。这一回，运气难得地站在了你这边——只是这种好运，不是回回都来。"; }
        add(s, "reputation", -4); socialBoostRole(s, n.role, -6);
        return "你想着“先去聊聊看，能成就成”，没怎么上心地就赴了约。结果一坐下来就露了怯：对方随口抛出几个本该是基本功的问题，你却在关键处支支吾吾、答非所问，额头开始冒汗。气氛一点点冷下去，对方礼貌地提前结束了谈话，连客套都透着敷衍。你低头退出来时，瞥见" + n.name + "在群里的脸色也有些挂不住。别人辛辛苦苦替你架好的那把梯子，你没扶稳就一脚踩空，摔下来的不只是机会，还有人家替你担着的那份脸面。";
      }
    }
  ]
});

EVENTS.push({
  id: "ev_relation_warm_group",
  module: "relation",
  ambient: true,
  cond: (s) => relationList(s, n => n.attitude >= 65).length >= 3,
  title: "🔥 抱团取暖",
  text: (s) => "这阵子大环境冷，大家嘴上不说，日子过得都紧巴巴。可那个老群今晚却难得地热闹起来：有人甩出一份压价攻略，教大家怎么把房租和宽带砍下来；有人默默转了几条还在招人的内推链接，附一句“都是靠谱的，砸我名头去试”；还有人罕见地卸下了体面，说自己其实也快撑不住了，最近常常半夜醒着。一条条消息刷过去，没人再晒车晒娃晒风光。你忽然有点动容——原来成年人的社交不全是暗暗较劲的攀比，到了难的时候，也可以是一群人手挽着手，互相往上托一把。",
  choices: [
    {
      label: "也贡献资源，把圈子盘活",
      effect: (s) => {
        add(s, "network", 9); add(s, "reputation", 5); add(s, "mood", 7); add(s, "stress", -6);
        socialShift(s, 5);
        return "你没藏着掖着，把手里压箱底的东西一股脑端了出来——靠谱的供应商渠道、踩过坑总结的避雷清单、几个还在悄悄招人的关系。消息发出去，群里很快热络起来。过两天有人私信你，说凭那条内推真约到了面试；又有人说照你的清单退了个坑货，省下一大笔冤枉钱，连发了好几个抱拳。你给出去的是经验，收回来的是一整片真心实意的善意——这一回，你也被这份彼此照应，稳稳地接住了。";
      }
    },
    {
      label: "潜水围观，只接收不输出",
      effect: (s) => {
        add(s, "knowledge", 2); add(s, "stress", -3); socialShift(s, -1);
        return "你把大家发的链接、攻略、清单一条条仔细收藏进了文件夹，看得认真，却始终没在群里冒一个泡。该拿的信息你一点没落下，可对话框里你的头像，依旧是那个最沉默的灰影。热闹是别人的，温度也是别人之间传递的，你只是隔着屏幕悄悄取暖。你心里清楚：抱团这件事，伸手烤别人生的火当然舒服，可若总不肯添一根柴，慢慢地，也就没人记得火堆边还坐着你了。";
      }
    }
  ]
});

EVENTS.push({
  id: "ev_relation_crisis_rescue",
  module: "relation",
  ambient: true,
  once: true,
  cond: (s) => (s.cash < 5000 || s.stress > 72 || s.mood < 35) && relationList(s, n => (n.kind === "仗义" || n.kind === "亲情" || n.attitude >= 78) && n.attitude >= 70).length > 0,
  title: "🛟 危机时有人拉你",
  text: (s) => {
    const n = pick(relationList(s, x => (x.kind === "仗义" || x.kind === "亲情" || x.attitude >= 78) && x.attitude >= 70));
    return "那几天你像一根被拧到极限的弦，账上的数字、压在心口的事、夜里翻来覆去睡不着的烦，全堆在一起，你只是咬着牙不让自己塌下来。你没跟任何人说过，连朋友圈都装得风平浪静。可偏偏在你最撑不住的那个深夜，" + relationLabel(n) + "的消息跳了出来，像是隔着屏幕都能闻到你的疲惫：“我看你这阵子状态不对，别一个人硬扛了，到底出什么事了？跟我说说。”就这么短短一句，你盯着那行字，眼眶一下子就热了，那根绷得太久的弦，差点当场就断给对方看。";
  },
  choices: [
    {
      label: "坦白求助，让对方搭把手",
      effect: (s) => {
        const n = pick(relationList(s, x => (x.kind === "仗义" || x.kind === "亲情" || x.attitude >= 78) && x.attitude >= 70));
        add(s, "cash", n.kind === "亲情" ? 12000 : 7000); add(s, "stress", -16); add(s, "mood", 12); add(s, "network", 4);
        socialBoostRole(s, n.role, 8);
        return "你哆嗦着手指，第一次把那些羞于启齿的狼狈，原原本本地打了出来——欠了多少、卡在哪里、撑得有多累。发送出去的那一刻，你做好了被同情、被说教、甚至被看轻的准备。可" + n.name + "一句多余的评判都没有，只是冷静地陪你把那笔乱账一项项拆开，帮你联系能搭上的资源，最后还二话不说转来一笔救急的钱，附言写着“先解燃眉之急，剩下的慢慢来”。那一夜你哭了很久，是松了口气的那种。你终于明白：真正的关系，从不怕你卸下铠甲、露出最难看的那一面。";
      }
    },
    {
      label: "说没事，继续自己扛",
      effect: (s) => {
        const n = pick(relationList(s, x => (x.kind === "仗义" || x.kind === "亲情" || x.attitude >= 78) && x.attitude >= 70));
        add(s, "stress", 6); add(s, "mood", -6); add(s, "insight", 2); socialBoostRole(s, n.role, -3);
        return "求助的话已经到了嘴边，你却还是习惯性地把它咽了回去，手指飞快地敲下三个字：“没事，还好。”加了个轻松的表情，仿佛这样就能把那身狼狈遮严实。" + n.name + "没有戳穿你，也没有再追问，只回了一句“嗯，那你照顾好自己，需要的时候随时开口，别跟我客气”。对话框安静下来，你松了口气，却又说不清地空落落。有些门明明为你敞着，灯也亮着，你却宁愿一个人站在门外的寒风里，硬撑着，把那点可怜的逞强当成最后的体面。";
      }
    }
  ]
});
