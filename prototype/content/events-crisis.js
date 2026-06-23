"use strict";
/* content/events-crisis.js —— 电诈、战争、制裁、航运、供应链等近年大事。
   目标：让宏观风险直接或间接打到创业、出海、支付、融资、普通生活。 */

function crx_world(s, d) {
  if (typeof eraNudgeWorld === "function") { eraNudgeWorld(s, d); return; }
  if (!s.world) return;
  if (d.jobMarket) s.world.jobMarket = Math.max(8, Math.min(96, s.world.jobMarket + d.jobMarket));
  if (d.priceIndex) s.world.priceIndex = Math.max(0.6, Math.min(4, s.world.priceIndex * (1 + d.priceIndex)));
  if (d.windHeat) s.world.windHeat = Math.max(4, Math.min(100, s.world.windHeat + d.windHeat));
  if (d.pace) s.world.pace = Math.max(0, Math.min(100, s.world.pace + d.pace));
  if (d.momentum) s.world.momentum = Math.max(-100, Math.min(100, s.world.momentum + d.momentum));
}
function crx_startupHit(s, progress, valuation, runway) {
  if (!s.startup || has(s, "startup_done")) return "";
  s.startup.progress = Math.max(0, (s.startup.progress || 0) + progress);
  s.startup.valuation = Math.max(0, Math.round((s.startup.valuation || 0) + valuation));
  if (s.startup.runway != null) s.startup.runway = Math.max(0, s.startup.runway + runway);
  return " 你的公司也被波及：进度、估值和现金跑道都跟着抖了一下。";
}
function crx_startupBoost(s, progress, valuation, runway) {
  if (!s.startup || has(s, "startup_done")) return "";
  s.startup.progress = (s.startup.progress || 0) + progress;
  s.startup.valuation = Math.max(s.startup.valuation || 0, Math.round((s.startup.valuation || 0) + valuation));
  if (s.startup.runway != null) s.startup.runway += runway;
  return " 你的公司反而吃到一点时代红利：需求、估值或跑道被推了一把。";
}
function crx_hasBiz(s) {
  return !!(s.startup && !has(s, "startup_done")) || has(s, "side_hot") || has(s, "world_mobile_founder") || has(s, "world_funded") || s.network >= 55;
}

EVENTS.push(
  {
    id: "ev_crisis_telefraud_family",
    module: "relation",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2016 && s.age >= 20,
    title: "📞 电诈电话打到家里",
    text: (s) => "深夜，手机在桌上震得发慌。是家里的号码。你刚接起，那头的声音就抖着塌下来：“你……你是不是出事了？刚才有人打电话，说你被抓了，要立刻打钱保人，不然就来不及了。”你脑子嗡的一声白成一片。\n那个陌生人不是瞎蒙——他报得出你的全名、你念过的学校、你现在供职的公司，甚至知道你上个月才搬了城市。每一条都精确得像有人翻过你的抽屉。你这才明白，数据泄露和那套滴水不漏的话术脚本，从来就贴着普通人的脸生长。\n电话那头，家里人的呼吸越来越急。骗子要的，从头到尾只有一样：让他们在你来得及反应之前，先按下转账。",
    choices: [
      {
        label: "立刻视频确认，教家人反诈",
        effect: (s) => {
          add(s, "stress", 4); add(s, "insight", 4); add(s, "network", 2); socialBoostRole(s, "爸妈", 8);
          crx_world(s, { pace: 2, momentum: -2 });
          return "你立刻切了视频拨过去。镜头里你好端端地坐着，朝家里人笑，让他们看清你毫发无伤。那头绷了一晚的脸终于垮下来，眼泪和后怕一起涌出来。\n你没急着挂，陪他们把反诈 App、可疑来电拦截、转账限额一项项设好，一遍遍演练“凡是让你转钱的电话都先挂掉再打给我”。钱一分没少。但你第一次脊背发凉地意识到——技术越进步，坏人就越能伪装成你最亲近的人。";
        }
      },
      {
        label: "嫌麻烦，只说别信陌生电话",
        effect: (s) => {
          add(s, "stress", 8); add(s, "mood", -6);
          if (rnd(0.45)) { const loss = byClass(s, { poor: 12000, mid: 50000, rich: 200000 }); add(s, "cash", -loss); socialBoostRole(s, "爸妈", -8); return "你“嗯嗯啊啊”地敷衍了几句，撂下一句“别信陌生电话”就想睡。可那头的轰炸没停——一个接一个的电话，假警察、假律师、假“担保人”，轮番把恐惧灌进去。家里人终究没扛住，颤着手把钱转了出去。\n等你反应过来时，账早已被层层拆分、跑得无影无踪。报案、冻结、追回，每一步都比想象中难。¥" + loss.toLocaleString() + " 像从生活里被硬生生撕下来的一块肉，连血带肉，再也接不回去。"; }
          return "你“嗯嗯”了两声就挂了，心想不就一个骚扰电话。这次确实没出事。可躺下后你越想越不安，盯着天花板睡不着：防诈骗靠一句轻飘飘的“别信”，就跟创业靠一句“加油”一样虚——真到刀架到脖子上那一刻，谁还记得这句空话。";
        }
      },
      {
        label: "顺藤摸瓜，研究黑灰产链条",
        effect: (s) => {
          add(s, "knowledge", 4); add(s, "insight", 5); add(s, "strategy", 3); add(s, "stress", 6); flag(s, "knows_fraud_chain");
          return "你没把这通电话当晦气甩开，反而较上了劲。你顺着那个号码往下扒：话术模板、引流社群、洗钱跑分的接口、藏在境外的窝点、批量拨号的自动化脚本……一条产业链在你眼前缓缓展开，分工细得像一家正经公司。\n每往深处看一层，胃里就翻一层。可恶心之外，还有一种冷静的清醒在生长——你第一次真正读懂了，为什么“信任”“支付”“身份验证”这几个词，在这个时代值那么多钱。";
        }
      }
    ]
  },

  {
    id: "ev_crisis_fake_investor",
    module: "relation",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2018 && s.age >= 22 && crx_hasBiz(s),
    title: "🪤 假投资人和假客户",
    text: (s) => "一个自称“产业基金合伙人”的人，绕过好几层关系，精准地找到了你。名片烫金，PPT 精致，朋友圈里全是与名人合影、签约剪彩的现场。他开口便是资源、牌照、海外渠道，每个词都恰好砸在你最缺、最痒的地方。\n他说基金愿意领投你，还能顺手帮你引来一个大客户——条件只有一个：前期得先打一笔“尽调费”兼“诚意保证金”，走个流程，公对公，正规得很。\n他笑得和气，语速不急不缓，把每个疑问都接得滴水不漏。可正因为太顺、太巧、太对你的胃口，你心底有根弦绷了起来：这味儿，不太对。",
    choices: [
      {
        label: "查穿透、验资质、看合同",
        effect: (s) => {
          add(s, "cash", -3000); add(s, "strategy", 5); add(s, "insight", 4);
          if (rnd(0.72 + s.stats.strategy / 300)) {
            add(s, "reputation", 4); flag(s, "anti_fraud_due_diligence");
            return "你压住那股“快签快投”的冲动，把他晾了三天。这三天里你查工商、查股权穿透、查涉诉记录，把他口中那些“辉煌项目”一个个翻出来对，又拐着弯问了几个真在圈里的人。\n答案很快浮出水面：空壳层层嵌套，所谓基金根本投不出钱，那笔“保证金”才是他唯一的真实目的。你客气地回绝，对方便不再纠缠，转头去找下一个着急的人。你没拿到融资，却保住了现金和公司的控制权。创业者最贵的能力之一，就是一眼认出那些“长得像钱”的坑。";
          }
          add(s, "stress", 7);
          return "你查得很细，却没能挖出致命的硬伤——他的资料经得起表面盘问，疑点却也始终散不开。你没敢急着付那笔钱，把项目先压在抽屉里。\n机会也许是真的，雷也许是真的，两种可能像两团雾互相缠着，谁也压不倒谁。成年人很多时候没有标准答案，只能在分不清黑白的灰区里，故意走得慢一点。";
        }
      },
      {
        label: "太缺钱了，先打保证金",
        effect: (s) => {
          const loss = byClass(s, { poor: 18000, mid: 80000, rich: 400000 });
          add(s, "cash", -loss); add(s, "stress", 18); add(s, "mood", -14); add(s, "reputation", -5);
          crx_startupHit(s, -6, -loss * 0.8, -4); flag(s, "been_scammed");
          return "账上的钱快见底，团队等着发薪，你说服自己“富贵险中求”，咬牙把保证金转了出去。\n钱刚到账，他的热情就像被人拧了开关——回复越来越慢，电话开始占线，“合伙人”出差去了，“风控”还在审。两周后，人、公司、官网，连同那套金光闪闪的资料，一起从世界上蒸发。你亏掉 ¥" + loss.toLocaleString() + "，还要在复盘会上，被团队一句句追问：为什么连最基本的尽调都没做。创业路上，最像救命钱的那笔东西，有时偏偏就是捅向你的刀。";
        }
      },
      {
        label: "反向钓鱼，把局做成案例",
        effect: (s) => {
          add(s, "network", 5); add(s, "reputation", 6); add(s, "strategy", 4); add(s, "stress", 8);
          if (s.startup && (s.startup.track === "AI" || s.startup.track === "企业服务")) return "你不拆穿，反而顺着往下钓。你一边假装上钩拖时间，一边把他的每句话术、每份伪造文件、每个收款账户都截图存档，攒成一份活生生的风控样本。\n后来，这套真实骗局直接被你做进了产品 demo——欺诈是怎么织网的，破绽藏在哪一步，演示得淋漓尽致。客户看完连连点头，那种“这公司真的懂风险”的共鸣，比任何夸张的路演都管用。" + crx_startupBoost(s, 5, 60000, 2);
          return "你不拆穿，反而顺着往下钓，把他的话术、文件、收款套路一点点套出来，攒成完整的一手证据。事后你把整套骗局写成一篇公开避坑帖，从开场白拆到收网，毫不留情。\n帖子意外被一大批创业者转发——你没赚到他口袋里的一分钱，却换来了一波实打实的信誉。";
        }
      }
    ]
  },

  {
    id: "ev_crisis_payment_freeze",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2021 && s.age >= 20 && (crx_hasBiz(s) || s.cash > 100000),
    title: "🧊 支付风控：账户被冻结",
    text: (s) => "反诈的网越收越紧。某个寻常的工作日，你刷新后台，本该到账的一笔收款赫然挂着“异常”二字——账户被临时冻结，钱卡在半空，进退不得。\n你打客服，对面来回就那一句机械的“请耐心等待审核”。你解释这是正经货款，对方只重复同样的话。你脑子里飞快算着这周要付的房租、工资、供应商尾款，每一笔都正等着这笔钱解冻。\n你比谁都清楚，这套系统是为了拦住骗子、保护更多人。可当那只冰冷的手恰好按在你的现金流上时，它就从抽象的“公共安全”，变成了一种实实在在、喘不上气的窒息。",
    choices: [
      {
        label: "补材料、走合规流程",
        effect: (s) => {
          add(s, "cash", -5000); add(s, "stress", 8); add(s, "knowledge", 3); add(s, "reputation", 2); flag(s, "compliance_minded");
          return "你压下火气，决定不抄近路。合同、发票、银行流水、客户的情况说明……你一份份翻出来、扫描、整理、提交，跟审核员一来一回地补证。\n时间一天天熬过去，钱终于解冻。这一遭把你磨得够呛，却也把一个道理钉进了脑子里：往后每一笔业务，都要顺手留下完整的证据链。等生意真做大了你才会懂，合规从来不是门面装饰，而是供血的血管——平时看不见，断了就要命。";
        }
      },
      {
        label: "找灰色通道快速解冻",
        effect: (s) => {
          add(s, "cash", -20000); add(s, "stress", 12); add(s, "reputation", -6); flag(s, "grey_payment_route");
          if (rnd(0.35)) { add(s, "cash", -60000); add(s, "stress", 18); return "急火攻心，你顺着群里的小道消息找上一个号称“有内部关系、当天解冻”的人。对方报价、催你打“疏通费”，话术熟练得像背过稿。钱一转，他就消失了。\n解冻没等来，你反倒先被狠狠割了一刀。你这才后知后觉地明白：黑灰产最爱守着的，正是像你这种被逼到墙角、急着解决问题的人。"; }
          return "你绕开正规审核，托人走了条“内部通道”，塞了笔钱，账户当天就活了过来。效率高得吓人。\n可松一口气的同时，你心里那根弦反而更紧了：这条路一旦走顺手，就会忍不住再走第二次。合规上的窟窿越补越大，今天图省事开的口子，迟早有一天会漏成淹没自己的海。";
        }
      },
      {
        label: "改造收款和风控系统",
        effect: (s) => {
          add(s, "cash", -30000); add(s, "knowledge", 5); add(s, "strategy", 5); add(s, "stress", 5); flag(s, "payment_risk_control");
          return "这一冻，把你冻醒了。你索性停下来，把整条收款链路推倒重排：客户实名、合同归档、发票闭环、每一笔回款的资金路径，全部理清、留痕、可追溯。\n眼下确实是自找麻烦——多花钱、多耗人、多走流程。但你越改越笃定，这是长期的救命工程。改到一半你忽然意识到：支付与风控本身，根本不是成本，而是这个时代里一门又硬又大的生意。";
        }
      }
    ]
  },

  {
    id: "ev_crisis_ukraine_supply_chain",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2022 && s.year <= 2025 && s.age >= 18,
    title: "🪖 战争冲击：能源、粮食与供应链",
    text: (s) => "远方的战争闯进每一条新闻推送：炮火、难民、被切断的管道。起初你只是默默划过去，直到那场战争开始顺着账单爬进你的生活。\n能源价格一夜跳涨，粮食和化肥忽然紧张，汇率剧烈摆动，航运排期被打乱，原材料报价一天一变。供应商的邮件一封接一封地来，每封都在涨价、每封都在拖期。炮火离你隔着几个时区，账单却就压在桌上，红字刺眼。\n创业者真正怕的，从来不是某一条坏消息。而是某天早上你打开报表，发现所有成本——电、油、料、汇、运——竟然在同一时刻，一起变成了坏消息。",
    choices: [
      {
        label: "重做成本模型，保现金流",
        effect: (s) => {
          add(s, "strategy", 5); add(s, "insight", 4); add(s, "stress", 7); add(s, "cash", -8000);
          crx_world(s, { priceIndex: 0.05, jobMarket: -4, momentum: -7 });
          return "你把团队关在会议室里，对着表格重算了好几个通宵——能源、物流、原料、汇率，每一项都按最坏情况重新压一遍。算到最后，你狠下心砍掉了那些看着热闹、实则不赚钱的低毛利业务。\n增长曲线被削得难看，投资人那边不好交代。可现金流活了下来，你能确定下个月还发得出工资。战争给创业者上的第一课，就是这么冷：永远别让乐观，悄悄写进你的成本表。";
        }
      },
      {
        label: "囤货赌涨价",
        effect: (s) => {
          const win = rnd(0.42 + s.stats.strategy / 300);
          const g = win ? Math.round(50000 + Math.random() * 80000) : -Math.round(40000 + Math.random() * 90000);
          add(s, "cash", g); add(s, "stress", 12); add(s, "strategy", 2);
          crx_world(s, { priceIndex: 0.08, momentum: win ? 4 : -8 });
          return win ? "你赌一把大的，掏空一部分现金，提前锁了一大批关键物料囤进仓库。接下来的日子，你天天盯着行情，心跟着价格曲线上下抽。\n价格果然如你所料一路涨上去，囤的货摇身变成了别人抢不到的筹码，账上凭空多出 ¥" + g.toLocaleString() + "。你松了口气，却没敢得意：这一笔多半不是你经营得多好，而是恰好踩中了动荡的节拍——下一次，节拍未必还认你。" : "你赌一把大的，掏空一部分现金，提前囤了一大批料，就等涨价收割。可这一回，行情偏不按你的剧本走——价格迟迟不动，先动的是仓储费、利息和占着的资金。\n货压在仓库里一天天发沉，把你的现金流死死拖住，最后亏掉 ¥" + (-g).toLocaleString() + "。宏观判断错一次，那座堆满货的仓库，会替你把这笔账记上很久很久。";
        }
      },
      {
        label: "转向国产替代/本地供应商",
        effect: (s) => {
          add(s, "knowledge", 4); add(s, "network", 5); add(s, "cash", -20000); flag(s, "local_supply_chain");
          crx_world(s, { windHeat: 5, momentum: 2 });
          if (s.startup && (s.startup.track === "机器人" || s.startup.track === "AI" || s.startup.track === "企业服务")) return "你决定动一次大手术：把卡脖子的关键环节，一项项从那条横跨大洋的海外链条里拆下来，改用本地供应商。你跑工厂、谈样品、压测良率，一遍遍验证它们扛不扛得住。\n替代件的成本未必最低，磨合也耗人。但当远方港口再度拥堵、海外报价再度跳涨时，你的供应链稳得像换了根脊梁——这份“随时找得到货”的踏实，本身就是产品力的一部分。" + crx_startupBoost(s, 4, 80000, 1);
          return "你把那张供应商名单从头到尾重新洗了一遍，挨个换上离得近、联系得上、随时找得到人的本地合作方。哪怕单价贵上一截，你也认了。\n你不愿再让自己的生死，系在远方的炮火和一座堵死的港口上。在这样的年月里，你慢慢咂摸出一个道理：稳定本身，就是一种实打实的利润。";
        }
      }
    ]
  },

  {
    id: "ev_crisis_export_sanctions",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2019 && s.age >= 22 && (crx_hasBiz(s) || s.stats.knowledge >= 45),
    title: "🧱 制裁与出口管制：一张清单改变生意",
    text: (s) => "新闻里又添了新的实体清单、出口管制、技术限制。一串国家和公司的名字，被写进一份你够不着的文件里。\n你过去一直觉得，那是巨头与大国之间的博弈，跟你这种小生意隔着十万八千里。直到客户的电话一个接一个打来，问的全是要命的具体问题：你那批芯片，还能按期到货吗？用的那套云服务，到期还续得上吗？产品里嵌着的海外 SDK，哪天会不会突然就断了？\n你这才惊觉，那张远在天边的清单，正一行一行地，重写着你合同上的每一个条款。",
    choices: [
      {
        label: "做国产替代和备选方案",
        effect: (s) => {
          add(s, "knowledge", 6); add(s, "strategy", 5); add(s, "cash", -25000); flag(s, "sanction_backup_plan");
          crx_world(s, { windHeat: 8, jobMarket: 2, momentum: 1 });
          if (s.startup) return "你决定趁早动刀。底层依赖一项项排查、一项项替换，找替代方案、做技术备案、跑压力测试——整个过程痛苦得像把骨头拆开重装，团队骂声连天，进度也被拖慢。\n可当别家因为某个被卡的环节集体停摆时，你的系统稳稳地转着。客户看在眼里，反而把更重的单子押给了你——在一个随时可能被拔电源的时代，“你这儿断不了”就是最硬的信任。" + crx_startupBoost(s, 6, 120000, 1);
          return "你逼着自己养成一个习惯：给每一个关键服务，都悄悄备好一套 B 计划。哪天主路被掐断，你还能立刻切到备用线上。\n这件事在从前，顶多叫“谨慎过头”。可在如今这种说断就断的世道里，它有了个更冷硬的名字——生存能力。";
        }
      },
      {
        label: "继续用便宜成熟的海外方案",
        effect: (s) => {
          add(s, "cash", 10000); add(s, "stress", 8); add(s, "insight", -1);
          if (rnd(0.45)) { add(s, "cash", -70000); add(s, "reputation", -8); crx_startupHit(s, -5, -100000, -3); return "你算了笔短账：海外方案又便宜又成熟，换掉它纯属自找麻烦，于是按兵不动。账面上确实省了一阵。\n直到某天清晨，你被告警短信惊醒——那个被你当成空气一样依赖的服务，毫无预兆地涨价、停供。你连夜改代码、连夜赔客户、连夜找替代，狼狈得像在火场里抢东西。这一夜你终于看清：所谓“成熟方案”，照样会被地缘政治一把拔掉电源，而它偏偏选在你毫无防备时动手。"; }
          return "你赌它不会出事，继续用着那套便宜又顺手的海外方案。这一回，确实风平浪静，省下的钱实实在在落进了账上。\n可不知从哪天起，你心里扎进了一根细刺，时不时隐隐发疼：万一哪天，它说不让用就不让用了——到那时，你还有退路吗？";
        }
      },
      {
        label: "转去不敏感的垂直场景",
        effect: (s) => {
          add(s, "strategy", 4); add(s, "network", 3); add(s, "reputation", 2); crx_world(s, { momentum: 2 });
          return "你想清楚了：不去硬碰那条最敏感、最容易被点名的技术线。你把队伍掉头，扎进医疗、仓储、财务、制造现场这些更落地、更不起眼的具体场景里，一个个把活干扎实。\n有人说你不够硬气。可你心里明白，主动避开风暴中心，从来不等于没有野心——它只是意味着，你打算先把命留住，再去谈那些更大的事。";
        }
      }
    ]
  },

  {
    id: "ev_crisis_redsea_shipping",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2023 && s.year <= 2026 && s.age >= 20 && (crx_hasBiz(s) || has(s, "traveled") || has(s, "overseas")),
    title: "🚢 红海航线紧张：货在海上绕远路",
    text: (s) => "中东的冲突顺着海岸线外溢，红海航线的警报一天比一天响。船公司纷纷绕开那段水域，宁可多绕半个非洲——运费应声翻番，交期一拖再拖，你订的那批货，此刻正漂在某段被迫拉长的航线上。\n你的客户不关心什么地缘政治、什么海峡封锁，他们只在群里反复戳出同一句话：货，到底什么时候到？\n你盯着世界地图上那条被红圈标出的航线，第一次真切地感到：地图上一根细细的线出了事，就能精准地变成你合同里白纸黑字的违约风险。",
    choices: [
      {
        label: "和客户坦白，重谈交期",
        effect: (s) => {
          add(s, "stress", 7); add(s, "reputation", 3); add(s, "strategy", 3); crx_world(s, { priceIndex: 0.03, momentum: -3 });
          return "你没有像同行那样硬着头皮甩出一句“马上就到、放心”。你把航线为什么改道、运费涨了多少、手头有哪几种替代方案，连同最坏的时间表，一五一十地摊到客户面前。\n对方当然不痛快，黑着脸，但最终接受了这个事实。挂了电话你才慢慢体会到：把坏消息讲早一点，往往比把好消息讲假一点，更能换来真正的信用。";
        }
      },
      {
        label: "改走空运/铁路，保交付",
        effect: (s) => {
          const cost = byClass(s, { poor: 12000, mid: 60000, rich: 260000 });
          add(s, "cash", -cost); add(s, "reputation", 7); add(s, "network", 4); crx_world(s, { priceIndex: 0.02, momentum: 1 });
          if (s.startup) return "你盯着那张贵得离谱的空运报价单，手指悬了半天，最后还是咬牙点了确认。海运改空运、铁路连夜调度，交付的死线总算保住了。\n货按时落地，客户那头长舒一口气；可你这边的现金流，疼得像被人攥着直抽。利润这一单是别想了，但你心里清楚，这笔钱买的不是货，是“说到做到”四个字。" + crx_startupHit(s, 0, -cost * 0.4, -2);
          return "你盯着贵出一截的空运、铁路报价，咬牙签了字。一笔 ¥" + cost.toLocaleString() + " 砸下去，换回的是货物准点送达客户手里。\n利润是没了，信用还稳稳攥在手心。做生意很多时候就是这副样子——先把命保住，再谈往后怎么赚钱。";
        }
      },
      {
        label: "赌客户不会追责，继续拖",
        effect: (s) => {
          add(s, "stress", 10); add(s, "reputation", -8); add(s, "network", -4);
          if (rnd(0.35)) { const fine = byClass(s, { poor: 8000, mid: 50000, rich: 180000 }); add(s, "cash", -fine); return "你赌客户念在多年交情、不至于翻脸，于是一拖再拖，含糊其辞。可这一回你赌输了——对方动了真格，违约金的函件和满屏的差评几乎同时砸下来。\n¥" + fine.toLocaleString() + " 飞了，你也终于学会这一课：在这个一环扣一环的全球化时代，侥幸从来不是免费的，它本身就是一笔随时会被追讨的成本。"; }
          return "你赌客户不会较真，硬是把这次延误拖了过去。对方果然没有深究，风波看似就这么过去了。\n可那个合同群里，原本热络的寒暄忽然安静了下来，沉默得让人发毛。你心知肚明：这份信任，已经悄悄被磨薄了一层，而薄掉的那层，往后未必补得回来。";
        }
      }
    ]
  },

  {
    id: "ev_crisis_remote_war_order",
    module: "world",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2022 && s.age >= 22 && s.network >= 40,
    title: "🛰️ 战争带来的陌生订单",
    text: (s) => "一个素未谋面的海外客户，通过加密渠道找上了你。开口便是大单：急需数据标注、无人设备零件、通信软件、安防系统，或是一套物流调度工具。\n预算高得反常，工期催得发烫，对方却对“这些东西最终用在哪里”讳莫如深——问到具体场景，他便巧妙地绕开，只反复强调“尽快交付，价钱好谈”。\n你心里很清楚：一场远方的战争，让某些需求在一夜之间疯涨，也让“正当生意”与“危险红线”之间的那道边界，变得模糊而滚烫。这笔钱赚得，还是赚不得？答案就藏在他不肯说出口的那部分里。",
    choices: [
      {
        label: "做合规筛查，拒绝灰色用途",
        effect: (s) => {
          add(s, "reputation", 5); add(s, "strategy", 4); add(s, "cash", -6000); flag(s, "war_order_screened");
          return "你没有被那串诱人的数字冲昏头。你按规矩走完全套尽调：查最终用途、查客户底细、查出口管制和制裁清单，把每一处“说不清楚”都当成红灯。最后，那些含糊不清的部分，你一笔不留地全部回绝。\n这单钱是少赚了一大截。可那天夜里你睡得格外踏实。你越来越确信——时代越是混乱，就越要清楚地知道，哪些钱，碰都不能碰。";
        }
      },
      {
        label: "接，合同写得模糊一点",
        effect: (s) => {
          const gain = byClass(s, { poor: 50000, mid: 180000, rich: 600000 });
          add(s, "cash", gain); add(s, "stress", 16); add(s, "reputation", -8); flag(s, "grey_war_order");
          if (rnd(0.3)) { add(s, "cash", -gain * 0.7); add(s, "network", -10); return "你说服自己“不问用途就不算共谋”，把合同条款写得含糊其辞，接下了这单。钱到账快得惊人，你还没来得及高兴，麻烦就追着钱一起涌了进来。\n支付通道突遭审查，款项被冻；客户在某个节点彻底失联，留下一堆烂尾；平台风控接连预警，把你的账户层层标红。你赚到的那一笔，被一口口吐了回去，所剩无几。灰色订单那点诱人的高毛利里，原来早就埋好了你当初没敢去看的雷。"; }
          return "你说服自己“不问，就当不知道”，把合同写得滴水不漏又一片模糊，悄悄接了下来。¥" + gain.toLocaleString() + " 进了账，可你一句都不敢对外提起这个项目，连团队群里都只字未露。\n它就像一块被你锁进抽屉最深处的金子——在黑暗里闪着光，烫得你每次想起来，手心都隐隐发疼。";
        }
      },
      {
        label: "把需求转成民用产品方向",
        effect: (s) => {
          add(s, "knowledge", 5); add(s, "insight", 4); add(s, "cash", -15000);
          if (s.startup) return "危险的订单你不接，可订单背后暴露出的真实需求，你看得明明白白。你把其中最核心的能力——智能调度、应急响应、数据备份——剥离出那层敏感外壳，重新打磨成一套清清白白的民用方案。\n同样的技术，换了一身正大光明的衣裳，反而打开了一片更宽、更长久的市场。" + crx_startupBoost(s, 5, 90000, 1);
          return "你婉拒了那笔危险的钱，却没有放过它无意中暴露出的需求。你把那些战时场景一项项拆解、翻译成民用版本：应急通信、灾害物流、供应链备份——每一个，都是和平年代里同样真实的痛点。\n危险的钱坚决不碰；可危险照出来的需求，值得你冷静地、认真地研究下去。";
        }
      }
    ]
  }
);
