"use strict";
/* content/events-social-deep.js —— 社交圈/人情世故深度事件：份子钱、攀比、分钱、担保、站队、托关系。
   只 EVENTS.push，全局 helper：add/flag/has/pick/rnd/byClass/classTier/shuf/socialShift/socialBoostRole。
   读社交圈用 (s.social||[])，每个 NPC {name,role,kind,attitude}，kind∈势利/清高/仗义/亲情/普通。 */

/* —— 模块内辅助，前缀 socx_ —— */
function socx_list(s, pred) {
  return (s.social || []).filter(pred);
}
function socx_pick(s, pred) {
  return pick(socx_list(s, pred));
}
function socx_label(n) {
  return (n.role || "熟人") + "「" + (n.name || "某人") + "」";
}
function socx_any(s) {
  return pick(s.social) || { name: "老熟人", role: "熟人", kind: "普通", attitude: 50 };
}

/* 1. 人情往来：份子钱节节高 —— cash 与 socialShift 权衡 */
EVENTS.push({
  id: "ev_socx_red_envelope",
  module: "relation",
  ambient: true,
  cond: (s) => s.age >= 24 && (s.social || []).length > 0,
  title: "🧧 份子钱节节高",
  text: (s) => {
    var n = socx_any(s);
    return socx_label(n) + "发来请柬，又是一场婚礼。这个月，已经是第三张了。你打开记账本，份子钱那一栏长得比工资还快。";
  },
  choices: [
    {
      label: "随大礼，撑面子",
      effect: (s) => {
        add(s, "cash", -1600); socialShift(s, 3); add(s, "mood", -2);
        return "你咬牙包了个体面的红包。钱包瘪了一截，面子是圆了——人情社会里，体面是要花钱买的。";
      }
    },
    {
      label: "随个心意就好",
      next: (s) => ({
        text: (s) => "你在 ATM 前犹豫：随多了肉疼，随少了怕被人背后嚼舌根。手机里还躺着另外两张没回的请柬。",
        choices: [
          {
            label: "坦然按自己的心意来",
            effect: (s) => {
              add(s, "cash", -600); add(s, "insight", 2); add(s, "mood", 1);
              return "你按自己的能力包了个数。有人或许会议论，但你忽然轻松了：活给别人看，是没有尽头的。";
            }
          },
          {
            label: "借口出差，礼到人不到",
            effect: (s) => {
              add(s, "cash", -300); socialShift(s, -2); add(s, "stress", 2);
              return "你发了条“临时出差”的客套话，转了个最低标准的红包。省下了钱，也悄悄欠下了一份说不清的疏远。";
            }
          }
        ]
      })
    }
  ]
});

/* 2. 同学会攀比 —— 炫耀 vs 低调，牵动 mood/reputation/socialShift（两层） */
EVENTS.push({
  id: "ev_socx_reunion_flaunt",
  module: "relation",
  ambient: true,
  cond: (s) => s.age >= 26 && socx_list(s, n => n.role === "同学" || n.kind === "势利").length > 0 || (s.age >= 26 && (s.social || []).length > 0),
  title: "🍷 同学会上的攀比",
  text: (s) => {
    var n = socx_pick(s, x => x.role === "同学") || socx_any(s);
    return "毕业多年的同学会，包间里推杯换盏。" + socx_label(n) + "刚换了车，正绘声绘色讲着年薪和学区房。话题转了一圈，所有人都在等你开口：“你现在混得咋样？”";
  },
  choices: [
    {
      label: "也亮亮底牌，把场子压住",
      next: (s) => ({
        text: (s) => "你清了清嗓子，准备把这些年的成绩抖出来。但你心里清楚：一旦开了这个头，今晚就是一场没有赢家的军备竞赛。",
        choices: [
          {
            label: "真实战绩，不夸张",
            effect: (s) => {
              add(s, "reputation", 4); socialShift(s, 3); add(s, "mood", 3);
              return "你不卑不亢地讲了讲自己的事，分寸拿捏得刚好。势利的几位立刻热络起来，敬酒的人多了。风光是真风光，只是你也尝到了被人重新打量的滋味。";
            }
          },
          {
            label: "添油加醋，把牛吹圆",
            effect: (s) => {
              add(s, "reputation", -5); add(s, "stress", 4); socialShift(s, -2);
              return "你把数字翻了几番，吹得满座艳羡。可这圈人精得很，散场后一句“他那点底我还不清楚”，就把你的牛皮戳破了。面子撑得越大，越怕被人验真。";
            }
          }
        ]
      })
    },
    {
      label: "笑笑带过，低调装穷",
      effect: (s) => {
        add(s, "insight", 3); add(s, "mood", 2); socialShift(s, -1);
        return "你摆摆手：“瞎混，糊口而已。”话题很快移开。势利的几位明显冷了下来，但你乐得清静——不在牌桌上，就不必下注。";
      }
    }
  ]
});

/* 3. 合伙做生意分钱翻脸 —— 两层对话：谈判→撕破脸 or 各退一步，cash/network */
EVENTS.push({
  id: "ev_socx_split_money",
  module: "relation",
  ambient: true,
  once: true,
  cond: (s) => s.age >= 24 && socx_list(s, n => n.role !== "爸妈" && (n.kind === "势利" || n.attitude < 60)).length > 0,
  title: "💰 分钱时翻了脸",
  text: (s) => {
    var n = socx_pick(s, x => x.role !== "爸妈" && (x.kind === "势利" || x.attitude < 60)) || socx_any(s);
    return "一桩合伙小生意终于赚了钱，可到了分账这步，" + socx_label(n) + "却变了脸：“当初出力最多的是我，凭什么平分？”茶杯摔在桌上，账本摊了一地。";
  },
  choices: [
    {
      label: "坐下来，按合约和明细谈",
      next: (s) => ({
        text: (s) => "你压住火气，把当初的口头约定、各自投入的钱和时间一条条列出来。对方的脸色阴晴不定，谈判桌的空气快要凝固。",
        choices: [
          {
            label: "据理力争，一分不让",
            effect: (s) => {
              var n = socx_pick(s, x => x.role !== "爸妈") || socx_any(s);
              add(s, "stress", 8); add(s, "strategy", 2);
              if (rnd(0.5 + s.stats.strategy / 200)) {
                add(s, "cash", 9000); socialBoostRole(s, n.role, -10);
                return "你逻辑严密，把对方的歪理一条条堵死。钱你拿回了应得的份，但这段交情也算到头了——亲兄弟明算账，明完账往往就散了。";
              }
              add(s, "cash", -3000); add(s, "network", -4); socialBoostRole(s, n.role, -18);
              return "你寸步不让，对方索性掀了桌：客户关系、渠道都被他攥着，硬耗下来你反而吃了暗亏。撕破脸的代价，常常比让一步更贵。";
            }
          },
          {
            label: "各退一步，留条后路",
            effect: (s) => {
              var n = socx_pick(s, x => x.role !== "爸妈") || socx_any(s);
              add(s, "cash", 4000); add(s, "network", 3); add(s, "insight", 2); socialBoostRole(s, n.role, 4);
              return "你松口让了点利，对方也收了气。钱分得不算最优，关系却保住了。生意场上能继续合作的人，比一次的差价值钱得多。";
            }
          }
        ]
      })
    },
    {
      label: "钱不要了，断了这段合伙",
      effect: (s) => {
        var n = socx_pick(s, x => x.role !== "爸妈") || socx_any(s);
        add(s, "cash", -2000); add(s, "stress", -4); add(s, "insight", 3); socialBoostRole(s, n.role, -8);
        return "你把账本一推：“这钱你拿着，我们就到这儿。”少赚是少赚，但你买回了清净，也认清了一个不能再共事的人。";
      }
    }
  ]
});

/* 4. 贵人雪中送炭 —— 用 attitude>=72 的人，给机会/cash/network */
EVENTS.push({
  id: "ev_socx_benefactor_lift",
  module: "relation",
  ambient: true,
  cond: (s) => s.age >= 22 && socx_list(s, n => n.attitude >= 72).length > 0,
  title: "🤝 贵人搭了把手",
  text: (s) => {
    var n = socx_pick(s, x => x.attitude >= 72) || socx_any(s);
    return "你正为一道坎发愁，" + socx_label(n) + "却主动找上门：“我手上正好有个资源，本来要给别人，想想还是先问问你。”这份信任来得猝不及防。";
  },
  choices: [
    {
      label: "接住机会，把事办漂亮",
      effect: (s) => {
        var n = socx_pick(s, x => x.attitude >= 72) || socx_any(s);
        add(s, "cash", 8000); add(s, "network", 8); add(s, "reputation", 5); add(s, "mood", 5);
        socialBoostRole(s, n.role, 6);
        return "你认真把这事办成了，没让" + n.name + "失望。事后你郑重道了谢、补上人情。雪中送炭的恩情，得用靠谱来还。";
      }
    },
    {
      label: "婉拒，不想欠这份人情",
      effect: (s) => {
        var n = socx_pick(s, x => x.attitude >= 72) || socx_any(s);
        add(s, "insight", 3); add(s, "stress", -2); socialBoostRole(s, n.role, -2);
        return "你客气地推了：“太重了，我消受不起。”对方笑笑没勉强。你守住了不欠人情的原则，也错过了一程顺风车。有些门，关上就不再敲了。";
      }
    }
  ]
});

/* 5. 被小人背后捅刀 —— attitude<35，散布谣言伤 reputation（两层） */
EVENTS.push({
  id: "ev_socx_backstab_rumor",
  module: "relation",
  ambient: true,
  cond: (s) => s.age >= 22 && socx_list(s, n => n.role !== "爸妈" && n.attitude < 35).length > 0,
  title: "🗡️ 背后被人捅了刀",
  text: (s) => {
    var n = socx_pick(s, x => x.role !== "爸妈" && x.attitude < 35) || socx_any(s);
    return "好几个朋友隐晦地提醒你：" + socx_label(n) + "正在外头四处说你的坏话，从人品到能力，编得有鼻子有眼。你这才明白，最近那些莫名的冷脸是从哪来的。";
  },
  choices: [
    {
      label: "正面对质，逼他收口",
      next: (s) => ({
        text: (s) => "你找上门去。对方却一脸无辜：“我哪说过这话？你别听人挑拨。”反咬一口的本事，他比你熟练多了。",
        choices: [
          {
            label: "拿出证据，当众揭穿",
            effect: (s) => {
              var n = socx_pick(s, x => x.role !== "爸妈" && x.attitude < 35) || socx_any(s);
              add(s, "stress", 7); add(s, "strategy", 2);
              if (rnd(0.5)) {
                add(s, "reputation", 4); socialBoostRole(s, n.role, -15);
                return "你把聊天记录甩了出来，他当场哑火。清者自清这次靠的是证据，不是运气。围观的人心里那杆秤，悄悄偏回了你这边。";
              }
              add(s, "reputation", -4); add(s, "network", -3); socialBoostRole(s, n.role, -10);
              return "你越解释越像辩解，对方反倒占了委屈的便宜。和烂人纠缠，最后弄得满身泥的常常是认真的那个。";
            }
          },
          {
            label: "不屑争辩，用事实打脸",
            effect: (s) => {
              add(s, "reputation", 3); add(s, "insight", 3); add(s, "mood", -2);
              return "你懒得对质，转身把手上的事一件件做漂亮。谣言传一阵子，事实却立得住。时间久了，嚼舌根的人自己没了听众。";
            }
          }
        ]
      })
    },
    {
      label: "默默记下，断了往来",
      effect: (s) => {
        var n = socx_pick(s, x => x.role !== "爸妈" && x.attitude < 35) || socx_any(s);
        add(s, "reputation", -2); add(s, "stress", 3); add(s, "insight", 2); socialBoostRole(s, n.role, -6);
        return "你没声张，只是把这个人从生活里悄悄划掉。短期里谣言还在飘，但你省下了纠缠的力气。有些人不值得你回头多看一眼。";
      }
    }
  ]
});

/* 6. 帮人担保被连累 —— 高风险，可能 cash 大损 + flag（两层） */
EVENTS.push({
  id: "ev_socx_guarantee_trap",
  module: "relation",
  ambient: true,
  once: true,
  cond: (s) => s.age >= 25 && socx_list(s, n => n.role !== "爸妈").length > 0,
  title: "✍️ 帮人担保这件事",
  text: (s) => {
    var n = socx_pick(s, x => x.role !== "爸妈") || socx_any(s);
    return socx_label(n) + "急匆匆找来，说生意周转差一笔钱，银行要个担保人：“就走个形式，你签个字，绝不会连累你。”笔已经递到你手上。";
  },
  choices: [
    {
      label: "讲交情，签了这个字",
      next: (s) => ({
        text: (s) => "你抹不开面子，签了。几个月后，对方的生意没撑住，电话开始打不通。催款的人，转头找上了你这个担保人。",
        choices: [
          {
            label: "认了，替他把窟窿堵上",
            effect: (s) => {
              add(s, "cash", -18000); add(s, "overdraft", 1); add(s, "stress", 14); add(s, "mood", -10);
              flag(s, "socx_guarantee_burned");
              return "你东拼西凑替他还了债，自己背上了不该背的窟窿。这一课很贵：担保不是走形式，是把别人的风险扛到自己肩上。";
            }
          },
          {
            label: "撕破脸，拉他一起扛",
            effect: (s) => {
              var n = socx_pick(s, x => x.role !== "爸妈") || socx_any(s);
              add(s, "cash", -9000); add(s, "stress", 12); add(s, "network", -5);
              flag(s, "socx_guarantee_burned"); socialBoostRole(s, n.role, -20);
              return "你把他堵在家里，逼他变卖东西分担。钱少赔了点，交情彻底没了。患难见人心——可惜这人，是难来了就躲的那种。";
            }
          }
        ]
      })
    },
    {
      label: "婉拒，只借点小钱救急",
      effect: (s) => {
        var n = socx_pick(s, x => x.role !== "爸妈") || socx_any(s);
        add(s, "cash", -2000); add(s, "insight", 3); socialBoostRole(s, n.role, -3);
        return "你把笔推回去：“担保我真不敢签，这点钱你先拿去周转。”对方脸上挂不住，但你守住了底线。借出去的能承受，签下去的赔不起。";
      }
    }
  ]
});

/* 7. 家长群里的人情站队 —— gate has(s,"has_kid") */
EVENTS.push({
  id: "ev_socx_parent_group",
  module: "relation",
  ambient: true,
  cond: (s) => s.age >= 28 && has(s, "has_kid") && (s.social || []).length > 0,
  title: "📱 家长群里的站队",
  text: (s) => {
    var n = socx_pick(s, x => x.kind === "势利") || socx_any(s);
    return "孩子班级的家长群突然炸了：有家长不满老师的安排，呼吁联名抗议。" + socx_label(n) + "@了你：“这事关系到孩子，你也表个态吧？”一排排接龙正在刷屏。";
  },
  choices: [
    {
      label: "顺着群里，跟着附和",
      effect: (s) => {
        add(s, "network", 3); socialShift(s, 2); add(s, "stress", 3);
        return "你跟着接了龙，显得很合群。可事后想想，自己根本没弄清前因后果，就被一股情绪推着站了队。家长群里的人情，最容易让人头脑发热。";
      }
    },
    {
      label: "私下问清楚再说",
      next: (s) => ({
        text: (s) => "你没急着表态，私下找了几位家长和老师把情况摸了一遍。结果发现事情远没群里说的那么夸张，纯属一场误会被放大了。",
        choices: [
          {
            label: "群里说句公道话",
            effect: (s) => {
              add(s, "reputation", 5); add(s, "insight", 3); add(s, "network", 2);
              return "你把了解到的情况心平气和地讲出来，给群里降了温。有人觉得你扫兴，更多人却记住了你的靠谱。能在群情激愤时说真话的人，难得。";
            }
          },
          {
            label: "默默退出这场闹剧",
            effect: (s) => {
              add(s, "insight", 2); add(s, "stress", -3); socialShift(s, -1);
              return "你没掺和，只把群设成免打扰，自己私下跟老师沟通孩子的事。少了几分热闹，也少了一肚子无谓的气。";
            }
          }
        ]
      })
    }
  ]
});

/* 8. 酒局攒局托关系办事 —— charm 考验，network/cash */
EVENTS.push({
  id: "ev_socx_banquet_favor",
  module: "relation",
  ambient: true,
  cond: (s) => s.age >= 25 && (s.social || []).length >= 2,
  title: "🍻 攒个局，托人办事",
  text: (s) => {
    var n = socx_pick(s, x => x.attitude >= 55) || socx_any(s);
    return "有件事卡在流程上，正经走不动，得托关系。你想起" + socx_label(n) + "认识能拍板的人，于是张罗起一个饭局，把该请的人都请上。";
  },
  choices: [
    {
      label: "酒桌上把事敞开求",
      next: (s) => ({
        text: (s) => "三巡酒过，气氛正热。你斟酌着开口，把要办的事递了出去。满桌人都在看那位能拍板的，会不会接你这个话。",
        choices: [
          {
            label: "敬酒到位，话说得漂亮",
            effect: (s) => {
              add(s, "cash", -2500); add(s, "stress", 5);
              if (rnd(0.45 + s.stats.charm / 200)) {
                add(s, "network", 7); add(s, "reputation", 3); add(s, "mood", 3);
                return "你敬酒有度、话说得熨帖，对方一句“这事包在我身上”落了地。局没白攒——人情社会里，事常常是在桌上办成的。";
              }
              add(s, "mood", -4); add(s, "network", -2);
              return "你敬了一圈又一圈，对方却始终打太极：“再看看，再研究研究。”钱花了，酒喝了，事还悬着。托关系这条路，并非次次走得通。";
            }
          },
          {
            label: "灌酒硬攀，逼对方表态",
            effect: (s) => {
              add(s, "cash", -2500); add(s, "health", -4); add(s, "stress", 6); socialShift(s, -2);
              return "你拼了命地劝酒，想把对方喝高了好松口。结果话说得太满，反倒让人警觉。逼出来的承诺，第二天醒了酒就不算数了。";
            }
          }
        ]
      })
    },
    {
      label: "不攒局了，走正规流程",
      effect: (s) => {
        add(s, "stress", 4); add(s, "knowledge", 2); add(s, "insight", 2);
        return "你决定不托人情，老老实实排队走流程。慢是慢了点，但不欠人情、不留把柄。有些路绕远一点，反而走得踏实。";
      }
    }
  ]
});

/* 9. 还人情债 —— 当年受过的恩，如今对方开口 */
EVENTS.push({
  id: "ev_socx_repay_favor",
  module: "relation",
  ambient: true,
  cond: (s) => s.age >= 26 && socx_list(s, n => n.kind === "仗义" || n.kind === "亲情").length > 0,
  title: "🪢 该还人情债了",
  text: (s) => {
    var n = socx_pick(s, x => x.kind === "仗义" || x.kind === "亲情") || socx_any(s);
    return "当年落难时，" + socx_label(n) + "实打实帮过你。如今对方第一次开口求你办件并不轻松的事。电话那头小心翼翼：“为难的话就算了。”";
  },
  choices: [
    {
      label: "二话不说，全力去办",
      effect: (s) => {
        var n = socx_pick(s, x => x.kind === "仗义" || x.kind === "亲情") || socx_any(s);
        add(s, "cash", -4000); add(s, "stress", 6); add(s, "network", 4); add(s, "mood", 4);
        socialBoostRole(s, n.role, 12);
        return "你放下手头的事，把这忙帮到底。花了钱也费了劲，但你睡得踏实——欠的人情终于还上了。这世上，知恩图报四个字最压秤。";
      }
    },
    {
      label: "为难，能帮多少帮多少",
      effect: (s) => {
        var n = socx_pick(s, x => x.kind === "仗义" || x.kind === "亲情") || socx_any(s);
        add(s, "stress", 4); add(s, "insight", 2); socialBoostRole(s, n.role, 2);
        return "你确实分身乏术，只帮上了一部分，剩下的实在使不上劲。对方说“理解”，你心里却堵着——人情这东西，还了一半，欠的那半更扎心。";
      }
    }
  ]
});

/* 10. 清高的旧友，看不惯你这套人情世故 */
EVENTS.push({
  id: "ev_socx_aloof_friend",
  module: "relation",
  ambient: true,
  cond: (s) => s.age >= 24 && socx_list(s, n => n.kind === "清高").length > 0,
  title: "🍃 清高旧友的冷言",
  text: (s) => {
    var n = socx_pick(s, x => x.kind === "清高") || socx_any(s);
    return socx_label(n) + "约你喝茶，聊着聊着话锋一转：“你现在满嘴都是资源、人脉、变现，跟以前那个人不太像了。”一句话，把你这些年的圆滑轻轻戳破。";
  },
  choices: [
    {
      label: "认下来，自嘲一句",
      effect: (s) => {
        var n = socx_pick(s, x => x.kind === "清高") || socx_any(s);
        add(s, "insight", 3); add(s, "mood", 1); socialBoostRole(s, n.role, 5);
        return "你笑着摊手：“被生活磨的，俗了。”不辩解，反倒让对方松了脸。清高的人未必看不起你，他们只是怕你忘了来时的样子。";
      }
    },
    {
      label: "反驳，世故才是成熟",
      next: (s) => ({
        text: (s) => "你不服：“你那套清高，能当饭吃吗？”茶桌上的空气一下冷了。对方放下杯子，认真看着你。",
        choices: [
          {
            label: "继续争，要争个对错",
            effect: (s) => {
              var n = socx_pick(s, x => x.kind === "清高") || socx_any(s);
              add(s, "stress", 5); add(s, "network", -2); socialBoostRole(s, n.role, -10);
              return "你们各执一词，谁也没说服谁，最后不欢而散。两种活法本就没有标准答案，非要分高下，只会把朋友吵成路人。";
            }
          },
          {
            label: "收住，敬他一杯",
            effect: (s) => {
              var n = socx_pick(s, x => x.kind === "清高") || socx_any(s);
              add(s, "insight", 3); add(s, "mood", 2); socialBoostRole(s, n.role, 4);
              return "你话到嘴边咽了回去，举杯：“你守你的干净，我趟我的浑水，都不容易。”对方愣了愣，碰了杯。能容下不同活法的，才是真朋友。";
            }
          }
        ]
      })
    }
  ]
});
