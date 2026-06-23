"use strict";
/* =====================================================================
 * content/events-founder-jobs.js —— 职场→创业前史（回归创业·批次C）
 * 让「打工」自然通向「创业」：每个事件都是一次「攒创业底牌」或「被推向创业」。
 *   被裁、被压榨、被同事拉拢、看见缝隙、冒出点子、下班试水、摸透供应链、
 *   看懂政策窗口、长期高压萌生辞职念头、攒下第一桶金。
 *   每个事件至少写入一项创业准备度 founderPrep（addFounderPrep）。
 *
 * 约定：经典脚本全局作用域，直接用全局 add/flag/has/pick/rnd/EVENTS；
 *   typeof 守卫调用 addFounderPrep/addExperience/addStigma/bumpMomentum/jobSalary。
 *   choices.label 是普通字符串（不能插值）；插值只在 text/effect 的反引号里。
 * ===================================================================== */

function _pi(s) { return (s.world && s.world.priceIndex) ? s.world.priceIndex : 1; }
function _atWork(s) { return has(s, "employed") && !!s.job && !(s.startup && s.startup.fulltime); }
function _sceneKind(s) { return (s.workScene && s.workScene.kind) || null; }

EVENTS.push(
  {
    id: "ev_fjob_layoff_push", module: "work", ambient: true, importance: "turning",
    scene: "work", entrepreneurialRole: "trigger",
    title: "📉 名单上有你的名字",
    cond: s => _atWork(s) && s.world && s.world.jobMarket < 50,
    text: s => {
      const comp = Math.round((typeof jobSalary === "function" ? jobSalary(s) : 15000) * 4 * _pi(s));
      return `HR 把你叫进小会议室，公司「优化」的名单上有你的名字。一纸 N+1 赔偿摆在面前，约 ¥${comp.toLocaleString()}。\n\n` +
        `工牌很快就要被收走。你坐在空了一半的工位上忽然想通：与其等下一个老板挑你，不如这笔钱拿来，自己当一回老板。`;
    },
    choices: [
      {
        label: "拿赔偿，自己干",
        effect: s => {
          flag(s, "been_laid_off");
          flag(s, "founder_pushed");
          const comp = Math.round((typeof jobSalary === "function" ? jobSalary(s) : 15000) * 4 * _pi(s));
          add(s, "cash", comp);
          add(s, "mood", -4);
          if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 15);
          if (typeof bumpMomentum === "function") bumpMomentum(s, 1);
          s.job = null; delete s.flags.employed;
          return `你签了字，揣着 ¥${comp.toLocaleString()} 走出大楼。被裁的那一刻反倒踏实了——退路被断，前路才看得清。这笔钱，是你创业的第一注本金。`;
        }
      },
      {
        label: "赶紧再找一份工作",
        effect: s => {
          flag(s, "been_laid_off");
          const comp = Math.round((typeof jobSalary === "function" ? jobSalary(s) : 15000) * 4 * _pi(s));
          add(s, "cash", comp);
          add(s, "stress", 8); add(s, "mood", -8);
          s.job = null; delete s.flags.employed;
          if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 3);
          return `你拿了 ¥${comp.toLocaleString()} 赔偿，连夜更新了简历。当老板太冒险——你还是更想要一份稳定的工资。投简历去了。`;
        }
      }
    ]
  },

  {
    id: "ev_fjob_client_lead", module: "work", ambient: true, importance: "scene",
    scene: "work", entrepreneurialRole: "resource",
    title: "🔍 一个没人做的缝隙",
    cond: s => _atWork(s),
    text: s => `对接客户时，对方随口抱怨：「这块需求市面上压根没人好好做。」你在心里咯噔一下——这不是抱怨，是一个被所有人忽略的缝隙。\n\n` +
      `公司不愿碰，嫌它太小；可你越想越觉得，这正是一个人能撬动的口子。`,
    choices: [
      {
        label: "记下这个缝隙",
        effect: s => {
          flag(s, "spotted_niche");
          if (typeof addFounderPrep === "function") { addFounderPrep(s, "industryInsight", 8); addFounderPrep(s, "salesChannel", 6); }
          add(s, "mood", 3);
          return `你把这个缝隙连同客户的原话，认认真真记进了备忘录。打工攒的不止工资，还有别人看不见的门道——这一条，将来也许就是你的赛道。`;
        }
      },
      {
        label: "当成普通工作处理掉",
        effect: s => {
          if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 2);
          return `你按流程把客户的需求转给了产品，然后继续手头的活。机会在眼前晃了一下，又被日常的忙碌盖了过去。`;
        }
      }
    ]
  },

  {
    id: "ev_fjob_boss_squeeze", module: "work", ambient: true, importance: "scene",
    scene: "work", entrepreneurialRole: "trigger",
    title: "🥧 老板又画了一张饼",
    cond: s => _atWork(s),
    text: s => `项目是你熬夜啃下来的，复盘会上老板却把功劳轻飘飘揽到自己名下，转头对你说：「好好干，明年给你提一提。」——这饼，他已经画了第三年。\n\n` +
      `你忽然看清了这套规则：在这里，你的本事永远是别人的业绩。`,
    choices: [
      {
        label: "忍着，先把工资拿稳",
        effect: s => {
          add(s, "stress", 8); add(s, "mood", -6);
          if (typeof addFounderPrep === "function") { addFounderPrep(s, "riskTolerance", 4); addFounderPrep(s, "moralDebt", 2); }
          return `你把不甘咽了回去，挤出一个笑：「谢谢老板栽培。」饭碗暂时是稳了，可那口气，憋成了将来出走的火种。`;
        }
      },
      {
        label: "暗下决心，攒够就走",
        effect: s => {
          flag(s, "founder_pushed");
          add(s, "mood", 2);
          if (typeof addFounderPrep === "function") { addFounderPrep(s, "riskTolerance", 10); addFounderPrep(s, "moralDebt", 3); }
          if (typeof bumpMomentum === "function") bumpMomentum(s, 1);
          return `你表面应承，心里画了条线：攒够本钱、摸清门道，就走。看清了被人画饼的规则，你才真正动了自己当老板的念头。`;
        }
      }
    ]
  },

  {
    id: "ev_fjob_colleague_partner", module: "work", ambient: true, importance: "scene",
    scene: "work", entrepreneurialRole: "resource",
    title: "🤝 同事的私下约定",
    cond: s => _atWork(s),
    text: s => `散会后，那个最靠谱的同事把你拉到楼梯间，压低声音：「你技术我跑市场，咱俩要是哪天出去单干，绝对比给人打工强。」\n\n` +
      `他眼里有光。你知道，这话他不是随便说说。`,
    choices: [
      {
        label: "击掌为约：将来一起干",
        effect: s => {
          flag(s, "cofounder_lead");
          add(s, "mood", 5);
          if (typeof addFounderPrep === "function") addFounderPrep(s, "teamTrust", 12);
          if (typeof bumpMomentum === "function") bumpMomentum(s, 1);
          return `你俩在楼梯间击了个掌。创业最难的「找个信得过的人」，你提前攒下了——往后每次加班，都像是在为同一条船练手。`;
        }
      },
      {
        label: "笑笑没接话",
        effect: s => {
          if (typeof addFounderPrep === "function") addFounderPrep(s, "teamTrust", 3);
          return `你打了个哈哈把话岔开。现在谈出去单干太早了——但这个人，你默默记在了心里。`;
        }
      }
    ]
  },

  {
    id: "ev_fjob_product_spark", module: "work", ambient: true, importance: "scene",
    scene: "work", entrepreneurialRole: "resource",
    title: "💡 一个产品点子",
    cond: s => _atWork(s),
    text: s => `做需求做到深夜，你忽然冒出一个念头：现有的东西做得太笨，如果换个思路重做一遍，体验能好十倍。\n\n` +
      `这点子在公司排不上优先级，可它在你脑子里越长越大。`,
    choices: [
      {
        label: "下班后偷偷画原型",
        effect: s => {
          flag(s, "product_idea");
          add(s, "knowledge", 1); add(s, "mood", 3);
          if (typeof addFounderPrep === "function") addFounderPrep(s, "productSense", 10);
          return `你利用下班时间把点子画成了原型图。打工教会你的，是把模糊的想法落成能跑的产品——这正是创业最值钱的一块底牌。`;
        }
      },
      {
        label: "只记在脑子里",
        effect: s => {
          if (typeof addFounderPrep === "function") addFounderPrep(s, "productSense", 4);
          return `你把点子记在了脑子里，想着「以后有空再说」。好点子不缺，缺的是动手——但至少，那点产品的直觉还在生长。`;
        }
      }
    ]
  },

  {
    id: "ev_fjob_side_hustle", module: "work", ambient: true, importance: "scene",
    scene: "work", entrepreneurialRole: "resource",
    title: "🌙 下班搞点副业",
    cond: s => _atWork(s),
    text: s => `朋友圈里有人靠副业赚得风生水起。你也动了心，打算用下班时间小本试个水——不为发财，就想验证一下：离开公司这块招牌，你到底卖不卖得动东西。`,
    choices: [
      {
        label: "认真做，先跑通一单",
        effect: s => {
          flag(s, "side_hustle");
          add(s, "stress", 5); add(s, "health", -2);
          const earn = Math.round((1500 + Math.random() * 3500) * _pi(s));
          add(s, "cash", earn);
          if (typeof addFounderPrep === "function") { addFounderPrep(s, "salesChannel", 8); addFounderPrep(s, "productSense", 5); }
          if (typeof bumpMomentum === "function") bumpMomentum(s, 1);
          return `你跑通了第一单，到手 ¥${earn.toLocaleString()}。钱不多，意义大——你第一次确认：脱了公司的壳，自己也卖得动东西。`;
        }
      },
      {
        label: "三天打鱼两天晒网",
        effect: s => {
          if (typeof addFounderPrep === "function") addFounderPrep(s, "salesChannel", 3);
          return `白天的活儿太累，副业断断续续没成气候。不过折腾这一回，你多少摸到了点「自己找客户」的门道。`;
        }
      }
    ]
  },

  {
    id: "ev_fjob_supply_insight", module: "work", ambient: true, importance: "scene",
    scene: "work", entrepreneurialRole: "resource",
    title: "🏭 摸透了这条供应链",
    cond: s => _atWork(s) && (_sceneKind(s) === "factory" || _sceneKind(s) === "cross_border"),
    text: s => `跟单、盯柜、对账、盯线——干久了，整条供应链在你脑子里成了一张活地图：哪家工厂靠谱、哪个环节能压价、哪段周期最容易卡。\n\n` +
      `这些是花钱也买不来的实战经验，公司只当它是你的本职，可你知道，这是一条能自己跑的路。`,
    choices: [
      {
        label: "把上下游关系都攒进通讯录",
        effect: s => {
          flag(s, "supply_mastery");
          if (typeof addFounderPrep === "function") { addFounderPrep(s, "industryInsight", 10); addFounderPrep(s, "productSense", 6); }
          if (typeof addExperience === "function") addExperience(s, _sceneKind(s) === "factory" ? "factory_grit" : "cross_border");
          add(s, "mood", 2);
          return `你把每个靠谱的供应商、货代、质检都存进了通讯录。这条供应链你已经摸到骨子里——哪天自己干，它就是你绕不开的护城河。`;
        }
      },
      {
        label: "干完手头的就好",
        effect: s => {
          if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 4);
          return `你把分内的单子跟完，没多留心上下游的关系。门道在手边，你却没把它当成将来的牌。`;
        }
      }
    ]
  },

  {
    id: "ev_fjob_civil_window", module: "work", ambient: true, importance: "scene",
    scene: "work", entrepreneurialRole: "resource",
    title: "📜 看懂了这扇政策窗口",
    cond: s => _atWork(s) && _sceneKind(s) === "civil",
    text: s => `经手了一轮又一轮的材料和审批，你比谁都清楚：哪条政策刚开口子、哪类项目正赶上扶持、哪个窗口期一过就再没机会。\n\n` +
      `体制内的人多半把这当例行公事，可你看出来——这扇窗背后，是一片别人还没反应过来的空地。`,
    choices: [
      {
        label: "把政策红利和窗口期记清楚",
        effect: s => {
          flag(s, "policy_window");
          if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 12);
          if (typeof addExperience === "function") addExperience(s, "civil");
          add(s, "mood", 2);
          return `你把这轮政策的红利、门槛和窗口期都吃透记牢。在懂行这件事上，你已经走到了大多数人前面——风口起时，你不会是最后一个知道的。`;
        }
      },
      {
        label: "公事公办，不多想",
        effect: s => {
          if (typeof addFounderPrep === "function") addFounderPrep(s, "industryInsight", 5);
          return `你照章办完了事，没往「这能不能做成生意」上想。政策的门道你看懂了几分，却没把它当成自己的机会。`;
        }
      }
    ]
  },

  {
    id: "ev_fjob_burnout_quit", module: "work", ambient: true, importance: "scene",
    scene: "work", entrepreneurialRole: "trigger",
    title: "🔥 撑不下去的念头",
    cond: s => _atWork(s) && (s.stress || 0) > 55,
    text: s => `连轴的高压把你榨得只剩一个空壳。深夜回家的地铁上，你盯着车窗里那张疲惫的脸，心里冒出一句话：这样给人卖命，到底是为了什么？\n\n` +
      `「辞职，自己干」——这念头第一次不再是抱怨，而像一个认真的选项。`,
    choices: [
      {
        label: "认真盘算辞职创业",
        effect: s => {
          flag(s, "founder_pushed");
          add(s, "stress", -6); add(s, "mood", 4);
          if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 10);
          if (typeof bumpMomentum === "function") bumpMomentum(s, 1);
          return `你打开备忘录，第一次认真列起了「出走计划」：要攒多少钱、补哪块短板。被高压逼出来的，不只是疲惫，还有那点孤注一掷的勇气。`;
        }
      },
      {
        label: "灌口咖啡，继续扛",
        effect: s => {
          add(s, "health", -3);
          if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 3);
          return `你灌了口咖啡，把念头压了回去。日子还得过，房贷还得还。可那根弦，已经悄悄绷紧了。`;
        }
      }
    ]
  },

  {
    id: "ev_fjob_first_capital", module: "work", ambient: true, importance: "scene",
    scene: "work", entrepreneurialRole: "resource",
    title: "💰 攒下第一桶金",
    cond: s => _atWork(s) && (s.cash || 0) > 100000 * _pi(s),
    text: s => {
      const cash = Math.round(s.cash || 0);
      return `打工这些年省吃俭用，存款数字第一次让你心头一热——账上躺着 ¥${cash.toLocaleString()}。\n\n` +
        `这笔钱足够你冒一次险了。启动资金有了，剩下的，只是敢不敢迈出那一步。`;
    },
    choices: [
      {
        label: "这就是创业的启动资金",
        effect: s => {
          flag(s, "first_capital");
          add(s, "mood", 6);
          if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 12);
          if (typeof bumpMomentum === "function") bumpMomentum(s, 1);
          const cash = Math.round(s.cash || 0);
          return `你把这 ¥${cash.toLocaleString()} 在心里单独划了一格，写上「启动资金」。创业最现实的那道门槛，你已经迈过去了一半。`;
        }
      },
      {
        label: "稳一点，先存着保命",
        effect: s => {
          if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 4);
          return `你把钱稳稳存进定期，告诉自己「再等等」。第一桶金有了，可拿它去赌一把的胆量，还差一口气。`;
        }
      }
    ]
  }
);
