"use strict";
/* ==================================================================
 * content/events-era.js
 * 时代大事件 / 未来基本面：按 s.year 触发，给隐藏风口、就业、物价和社会情绪加压力。
 * 只追加 EVENTS，不改 core.js。
 * ================================================================== */

function eraWorld(s) {
  if (!s.world) return null;
  return s.world;
}

function eraNudgeWorld(s, delta) {
  const w = eraWorld(s);
  if (!w) return;
  if (delta.jobMarket) w.jobMarket = Math.max(8, Math.min(96, w.jobMarket + delta.jobMarket));
  if (delta.priceIndex) w.priceIndex = Math.max(0.6, Math.min(4, w.priceIndex * (1 + delta.priceIndex)));
  if (delta.windHeat) w.windHeat = Math.max(4, Math.min(100, w.windHeat + delta.windHeat));
  if (delta.pace) w.pace = Math.max(0, Math.min(100, w.pace + delta.pace));
  if (delta.momentum) w.momentum = Math.max(-100, Math.min(100, w.momentum + delta.momentum));
}

function eraBoostStartup(s, track, progress, valuationRate) {
  if (!s.startup || has(s, "startup_done")) return "";
  if (s.startup.track !== track) return "";
  s.startup.progress = (s.startup.progress || 0) + progress;
  s.startup.valuation = Math.max(s.startup.valuation || 0, Math.round((s.startup.progress || progress) * valuationRate));
  return `你押中的「${track}」被时代推了一把，公司估值抬到 ¥${s.startup.valuation.toLocaleString()}。`;
}

function eraWindHint(s, wind) {
  if (s.eraWind === wind) {
    eraNudgeWorld(s, { windHeat: 10, momentum: 4 });
    return `新闻没有明说，但你闻得到：真正的风，正往「${wind}」那边吹。`;
  }
  eraNudgeWorld(s, { windHeat: 3, momentum: -1 });
  return `这条线索很热闹，却未必就是当年的主风口。你把它记在心里，没有急着下结论。`;
}

EVENTS.push(
  {
    id: "ev_era_1998_layoff_tide",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year === 1998,
    title: "🏭 1998：下岗潮",
    text: (s) => byClass(s, {
      poor: "厂门口贴出名单，熟人的名字一排排挂在红纸上。你听见大人们压低声音谈生活费、孩子学费和明天去哪里摆摊。",
      mid: "单位不再是铁饭碗，亲戚饭桌上的话题从分房变成了下岗再就业。时代像一台旧机器，轰隆隆地拆掉很多人的安全感。",
      rich: "你家避开了最冷的风，但身边有人一夜之间从体面职工变成街边摊主。财富和身份的秩序，开始松动。"
    }),
    choices: [
      {
        label: "帮家里撑一把",
        next: () => ({
          text: () => "你把存下的钱拿出来，家里人说不用，可饭桌上的沉默已经说明了一切。你也可以借这个机会试着做点小买卖。",
          choices: [
            { label: "补贴家用，先过难关", effect: (s) => { add(s, "cash", -3000); add(s, "mind", 3); add(s, "stress", 4); eraNudgeWorld(s, { jobMarket: -12, momentum: -8 }); return "你把钱塞进家里的抽屉。数目不大，却让这个月的米面油有了着落。寒气逼人，你也更早学会了生活的重量。"; } },
            { label: "跟着亲戚练摊", effect: (s) => { add(s, "cash", 5000); add(s, "strategy", 5); add(s, "insight", 3); flag(s, "era_stall_practice"); eraNudgeWorld(s, { jobMarket: -8, windHeat: 8, momentum: 2 }); return "你在夜市支起小摊，吆喝声从生涩到顺口。你第一次明白，机会有时不在办公室里，而在满地烟火气中。"; } }
          ]
        })
      },
      { label: "记住这场冲击", effect: (s) => { add(s, "insight", 4); add(s, "mood", -3); eraNudgeWorld(s, { jobMarket: -10, priceIndex: 0.02, momentum: -5 }); return "你没有立刻做什么，只是把那些脸和叹息记了下来。后来每次听见「稳定」两个字，你都会想起这一年。"; } }
    ]
  },

  {
    id: "ev_era_2001_wto_factory",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2001 && s.year <= 2003,
    title: "🚢 加入 WTO 后的订单",
    text: () => "沿海工厂灯火通明，外贸订单像潮水一样涌来。有人南下进厂，有人倒腾货柜，有人开始说：中国会变成世界工厂。",
    choices: [
      {
        label: "南下看看机会",
        effect: (s) => {
          add(s, "cash", 12000);
          add(s, "network", 5);
          add(s, "strategy", 3);
          eraNudgeWorld(s, { jobMarket: 10, windHeat: 7, pace: 4, momentum: 3 });
          return "你挤上南下的绿皮车，车厢里全是同样睡不着的人。流水线很苦，机会也真，你的世界被港口和订单撑大了一圈。";
        }
      },
      {
        label: "留在本地观察",
        effect: (s) => {
          add(s, "insight", 3);
          eraNudgeWorld(s, { jobMarket: 5, priceIndex: 0.01 });
          return "你没有急着走，只是开始留意身边的小厂、批发市场和物流站。时代的引擎已经启动，轰鸣声迟早传到你脚下。";
        }
      },
      {
        label: "倒腾一批小商品",
        effect: (s) => {
          const gain = rnd(0.55) ? 18000 : -6000;
          add(s, "cash", gain);
          add(s, "strategy", 4);
          eraNudgeWorld(s, { windHeat: 8, momentum: gain > 0 ? 4 : -3 });
          return gain > 0 ? "你跟着批发商跑了几趟，把一批小商品卖出了好价钱。钱不算大，但你嗅到了流通里的利润。" : "你进的货压在仓库里，潮气比买家先到。第一笔生意交了学费，也让你知道热闹不等于好赚。";
        }
      }
    ]
  },

  {
    id: "ev_era_2008_financial_crisis",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year === 2008 || s.year === 2009,
    title: "📉 2008：金融海啸",
    text: () => "海外银行倒下的新闻滚动播放，工厂订单被取消，招聘会摊位冷清。所有人都在问：这场海啸会不会拍到自己身上？",
    choices: [
      {
        label: "现金为王，先活下去",
        effect: (s) => {
          add(s, "cash", -5000);
          add(s, "stress", 5);
          add(s, "insight", 3);
          eraNudgeWorld(s, { jobMarket: -18, priceIndex: 0.03, momentum: -12, windHeat: -6 });
          return "你削掉不必要的开支，把现金攥紧。别人笑你保守，可风浪里，能浮着就是本事。";
        }
      },
      {
        label: "逆势学习互联网和网店",
        next: () => ({
          text: () => "线下门店冷了，屏幕另一头却热起来。你看到一些人在网上开店、接单、发货，像在废墟边搭新路。",
          choices: [
            { label: "开个小网店试水", effect: (s) => { add(s, "cash", 16000); add(s, "knowledge", 3); add(s, "strategy", 4); flag(s, "era_ecommerce_seed"); eraNudgeWorld(s, { jobMarket: -8, windHeat: 12, momentum: 5 }); return "你拍照、上架、打包，熬到半夜等第一单。快递单贴上的那一刻，你知道「电商」不是新闻里的词，而是能摸到的钱。" + eraWindHint(s, "电商"); } },
            { label: "学网络营销和数据", effect: (s) => { add(s, "knowledge", 6); add(s, "insight", 4); eraNudgeWorld(s, { windHeat: 9, momentum: 3 }); return "你把时间砸进论坛、后台和转化率。别人只看见危机，你看见了交易从街面搬进网页的痕迹。" + eraWindHint(s, "电商"); } }
          ]
        })
      },
      {
        label: "赌刺激政策后的资产反弹",
        effect: (s) => {
          const gain = s.eraWind === "房地产" || s.eraWind === "电商" ? Math.round(30000 + s.cash * 0.15) : -Math.round(15000 + s.cash * 0.06);
          add(s, "cash", gain);
          add(s, "stress", 8);
          eraNudgeWorld(s, { jobMarket: -12, priceIndex: 0.04, windHeat: 10, momentum: gain > 0 ? 8 : -8 });
          return gain > 0 ? `你在恐慌里下了注，后来政策和流动性把水位抬起来，账户多了 ¥${gain.toLocaleString()}。胆子这东西，只有活下来才叫魄力。` : `你以为自己在抄底，结果底下还有地下室。¥${(-gain).toLocaleString()} 蒸发后，你对「危机入市」四个字有了敬畏。`;
        }
      }
    ]
  },

  {
    id: "ev_era_2013_mobile_wave",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2013 && s.year <= 2015,
    title: "📱 手机屏幕里的新大陆",
    text: () => "地铁里低头的人越来越多，打车、外卖、支付、社交都被塞进一块小屏幕。创业者们说，移动互联网才刚刚开始。",
    choices: [
      { label: "学产品和代码", effect: (s) => { add(s, "knowledge", 6); add(s, "insight", 4); add(s, "stress", 3); eraNudgeWorld(s, { jobMarket: 8, windHeat: 12, pace: 5, momentum: 4 }); return "你把自己泡进应用商店、原型图和代码里。每一个小图标背后，都像藏着一家公司。" + eraWindHint(s, "移动互联网"); } },
      { label: "加入创业公司", effect: (s) => { add(s, "cash", 20000); add(s, "network", 6); add(s, "health", -3); flag(s, "startup_exp"); eraNudgeWorld(s, { jobMarket: 6, windHeat: 10, pace: 7, momentum: 3 }); return "你坐进一家连工牌都没做好的创业公司，白板上全是增长曲线。累是真的，离风口近也是真的。" + eraBoostStartup(s, "移动互联网", 8, 5000); } },
      { label: "嫌它太虚，继续传统路线", effect: (s) => { add(s, "mood", -2); add(s, "insight", 1); eraNudgeWorld(s, { windHeat: 4 }); return "你觉得那些估值故事太轻，还是愿意相信看得见摸得着的生意。只是之后几年，手机里的世界越来越难忽视。"; } }
    ]
  },

  {
    id: "ev_era_2020_pandemic",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year === 2020,
    title: "😷 2020：口罩、健康码和居家办公",
    text: (s) => `城市忽然慢了下来，街口支起测温点，手机里多了健康码。${s.job ? "公司通知居家办公，群消息却比上班时更密。" : "零工和面试突然断档，你开始重新计算每一笔开销。"}`,
    choices: [
      {
        label: "把生活收缩到最低",
        effect: (s) => {
          add(s, "cash", -8000);
          add(s, "health", 4);
          add(s, "mood", -5);
          add(s, "stress", 8);
          eraNudgeWorld(s, { jobMarket: -22, priceIndex: 0.06, pace: -5, momentum: -14 });
          return "你取消旅行、减少聚会，把日子缩成卧室、厨房和手机屏幕。省下的不只是钱，还有一点点对不确定性的抵抗。";
        }
      },
      {
        label: "转向线上副业",
        next: () => ({
          text: () => "线下门关上，线上窗口却被推开。直播、网课、远程协作、社区团购，全都在乱中长出新枝。",
          choices: [
            { label: "做直播和短视频", effect: (s) => { add(s, "cash", 22000); add(s, "charm", 4); add(s, "stress", 6); flag(s, "era_live_seed"); eraNudgeWorld(s, { jobMarket: -10, windHeat: 14, momentum: 6 }); return "你架起补光灯，对着镜头说第一句话。尴尬是真的，流量也是真的。" + eraWindHint(s, "短视频直播"); } },
            { label: "学远程工具和自动化", effect: (s) => { add(s, "knowledge", 5); add(s, "insight", 4); eraNudgeWorld(s, { windHeat: 7, momentum: 3 }); return "你把协作文档、脚本和自动化流程摸熟。封控教会你的不只是宅家，而是工作可以被重新组织。"; } }
          ]
        })
      },
      {
        label: "逆势抄底",
        effect: (s) => {
          const gain = rnd(0.45 + s.stats.insight / 300) ? Math.round(60000 + s.cash * 0.12) : -Math.round(25000 + s.cash * 0.05);
          add(s, "cash", gain);
          add(s, "stress", 10);
          eraNudgeWorld(s, { jobMarket: -18, priceIndex: 0.04, momentum: gain > 0 ? 8 : -10 });
          return gain > 0 ? `你在恐慌最浓的时候买进，几个月后反弹给了你 ¥${gain.toLocaleString()} 的回报。手抖过，但没松。` : `你冲进市场，以为捡便宜，结果波动先把你教育了一遍。亏掉 ¥${(-gain).toLocaleString()} 后，你暂时卸载了行情软件。`;
        }
      }
    ]
  },

  {
    id: "ev_era_2022_platform_winter",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year === 2022 || s.year === 2023,
    title: "🥶 2022：平台寒冬",
    text: () => "大厂缩招、教培转向、地产暴雷的消息挤在同一块屏幕上。朋友圈里有人晒离职赔偿，有人晒上岸编制，也有人什么都不发了。",
    choices: [
      { label: "求稳，考证考编", effect: (s) => { add(s, "knowledge", 5); add(s, "stress", 5); flag(s, "era_seek_stability"); eraNudgeWorld(s, { jobMarket: -18, windHeat: -5, momentum: -8 }); return "你把热闹的行业群静音，转身去刷题。稳定未必浪漫，但在寒冬里，它像一件厚外套。"; } },
      { label: "降薪也要留在新技术边上", effect: (s) => { add(s, "cash", -15000); add(s, "knowledge", 6); add(s, "insight", 5); eraNudgeWorld(s, { jobMarket: -10, windHeat: 8, momentum: 2 }); return "你接受了短期难看，换来继续站在技术边缘的资格。风停时还愿意看天的人，才可能先看见下一阵风。"; } },
      { label: "趁低谷梳理资产负债", effect: (s) => { add(s, "strategy", 4); add(s, "stress", -3); eraNudgeWorld(s, { jobMarket: -15, priceIndex: 0.03, momentum: -4 }); return "你没有急着证明什么，而是把贷款、保险、现金流摊开重算。寒冬里最踏实的动作，是确认自己还能烧多久。"; } }
    ]
  },

  {
    id: "ev_era_2024_ai_models",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2024 && s.year <= 2028,
    title: "🧠 大模型成了新水电",
    text: () => "会议纪要、代码、客服、设计稿，全都开始接入大模型。老板们嘴上说降本增效，员工们心里默默翻译：谁会先被省掉？",
    choices: [
      {
        label: "把 AI 变成自己的外骨骼",
        effect: (s) => {
          add(s, "knowledge", 7);
          add(s, "insight", 5);
          add(s, "stress", 3);
          flag(s, "ai_native");
          eraNudgeWorld(s, { jobMarket: 4, windHeat: 14, pace: 8, momentum: 5 });
          return "你不再把 AI 当玩具，而是把它塞进每个工作流。别人交一份稿，你交一套系统。" + eraWindHint(s, "AI大模型") + eraBoostStartup(s, "AI大模型", 10, 6200);
        }
      },
      {
        label: "做行业落地的小产品",
        next: () => ({
          text: () => "通用模型人人都能聊，真正难的是把它塞进合同、病历、仓库、客服和财务流程里。你要选一个窄场景下手。",
          choices: [
            { label: "先做企业工具", effect: (s) => { add(s, "cash", -30000); add(s, "network", 7); add(s, "strategy", 5); flag(s, "era_ai_b2b"); eraNudgeWorld(s, { windHeat: 16, momentum: 6 }); return "你跑客户、看流程、改提示词，终于让一个小部门愿意试用。AI 的钱不在炫技里，在替人省下的每小时里。" + eraWindHint(s, "AI大模型"); } },
            { label: "先做个人效率工具", effect: (s) => { add(s, "cash", -12000); add(s, "charm", 3); add(s, "knowledge", 4); eraNudgeWorld(s, { windHeat: 11, momentum: 3 }); return "你做了个小工具，帮人写简历、改 PPT、拆任务。增长不算爆，但你摸到了普通人愿意为什么付费。"; } }
          ]
        })
      },
      { label: "先观望，怕泡沫", effect: (s) => { add(s, "insight", 2); eraNudgeWorld(s, { windHeat: 5, momentum: -1 }); return "你没有急着冲进去。每一次技术革命都有泡沫，但泡沫下面，也可能真有新大陆。"; } }
    ]
  },

  {
    id: "ev_era_2029_embodied_intelligence",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2029 && s.year <= 2033,
    title: "🦾 机器人开始上班",
    text: () => "仓库、工厂、医院和家庭里，机器人不再只是展示厅里的样品。它们会搬箱子、递药、擦桌子，也会把一些岗位悄悄挤薄。",
    choices: [
      { label: "转向机器人供应链", effect: (s) => { add(s, "knowledge", 6); add(s, "strategy", 5); add(s, "cash", -20000); eraNudgeWorld(s, { jobMarket: 6, windHeat: 14, pace: 6, momentum: 5 }); return "你开始研究关节、电池、传感器和运维服务。整机耀眼，零部件和场景才是长出来的根。" + eraWindHint(s, "具身智能") + eraBoostStartup(s, "具身智能", 11, 6800); } },
      { label: "守住人味服务", effect: (s) => { add(s, "charm", 5); add(s, "network", 4); eraNudgeWorld(s, { jobMarket: -4, windHeat: 7 }); return "你没有和机器拼效率，而是把精力放在人情、信任和审美上。越自动化的时代，越有人愿意为真实的人买单。"; } },
      { label: "抗拒这股替代浪潮", effect: (s) => { add(s, "mood", -5); add(s, "stress", 6); eraNudgeWorld(s, { jobMarket: -8, momentum: -4 }); return "你讨厌这些不会累的竞争者，可投诉和抱怨挡不住采购合同。时代有时很粗鲁，连解释都懒得给。"; } }
    ]
  },

  {
    id: "ev_era_2034_fusion_grid",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2034 && s.year <= 2039,
    title: "☀️ 聚变并网后的电价",
    text: () => "第一批商业聚变电站并网，电价曲线被压弯。数据中心、材料厂、海水淡化和算力公司都开始围着能源重新排队。",
    choices: [
      { label: "押能源基础设施", effect: (s) => { const gain = s.eraWind === "聚变能源" ? Math.round(120000 + s.cash * 0.18) : -Math.round(30000 + s.cash * 0.04); add(s, "cash", gain); add(s, "insight", 4); eraNudgeWorld(s, { priceIndex: -0.04, jobMarket: 6, windHeat: 16, momentum: gain > 0 ? 8 : -5 }); return gain > 0 ? `你押的不只是概念股，而是电网、材料和工业用能。风口兑现，账户多了 ¥${gain.toLocaleString()}。` + eraWindHint(s, "聚变能源") : `你买在了最会讲故事的环节，真正赚钱的却在上游和电网。¥${(-gain).toLocaleString()} 的学费，让你记住了产业链三个字。`; } },
      { label: "把项目搬到低电价场景", effect: (s) => { add(s, "cash", -50000); add(s, "strategy", 6); eraNudgeWorld(s, { priceIndex: -0.03, windHeat: 12, momentum: 5 }); return "你把算力、冷链或制造方案重新按电价核算，很多过去不成立的生意突然有了利润。" + eraBoostStartup(s, "聚变能源", 12, 7600); } },
      { label: "担心泡沫，保持现金", effect: (s) => { add(s, "stress", -3); add(s, "insight", 2); eraNudgeWorld(s, { priceIndex: -0.02, windHeat: 5 }); return "你看着聚变概念狂飙，没有追进去。能源革命是真的，资本过热也是真的，你决定先分清这两件事。"; } }
    ]
  },

  {
    id: "ev_era_2040_silver_society",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2040 && s.year <= 2046,
    title: "👵 银发社会成为基本盘",
    text: () => "城市里适老化改造、陪诊、康复、老年旅游和养老金融广告无处不在。年轻人少了，老人多了，消费结构也换了骨架。",
    choices: [
      { label: "进入养老和医疗服务", effect: (s) => { add(s, "network", 8); add(s, "reputation", 6); add(s, "strategy", 4); eraNudgeWorld(s, { jobMarket: 8, windHeat: 14, pace: 3, momentum: 5 }); return "你没有把老人当数字，而是认真研究他们的疼痛、尊严和孤独。生意因此慢慢扎实起来。" + eraWindHint(s, "银发经济") + eraBoostStartup(s, "银发经济", 10, 7000); } },
      { label: "给家里做养老安排", effect: (s) => { add(s, "cash", -60000); add(s, "mood", 5); add(s, "stress", -4); flag(s, "eldercare_plan"); eraNudgeWorld(s, { priceIndex: 0.03, windHeat: 8 }); return "你给长辈安排体检、保险和适老化改造。钱花得肉疼，但家里人的安全感一点点回来了。"; } },
      { label: "嫌它不性感，继续追新科技", effect: (s) => { add(s, "insight", 1); eraNudgeWorld(s, { windHeat: 4, momentum: -2 }); return "你觉得养老太慢、太重、太不酷。可账本不会骗人，越来越多钱正流向慢而确定的需求。"; } }
    ]
  },

  {
    id: "ev_era_2047_brain_interface",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2047 && s.year <= 2054,
    title: "🧬 脑机接口进入医保谈判",
    text: () => "脑机接口从实验室走进医院。瘫痪患者能用意念打字，认知康复和沉浸娱乐也跟着冲上热搜。兴奋和恐惧同时扩散。",
    choices: [
      {
        label: "投向医疗康复场景",
        effect: (s) => {
          add(s, "knowledge", 6);
          add(s, "reputation", 5);
          add(s, "cash", -40000);
          eraNudgeWorld(s, { jobMarket: 6, windHeat: 16, momentum: 6 });
          return "你选择最慢也最硬的医疗场景：伦理、审批、临床、康复，一关关磨。它不性感，但一旦成立，就很难被轻易替代。" + eraWindHint(s, "脑机接口") + eraBoostStartup(s, "脑机接口", 12, 8200);
        }
      },
      {
        label: "做娱乐和效率应用",
        effect: (s) => {
          add(s, "charm", 4);
          add(s, "strategy", 4);
          eraNudgeWorld(s, { windHeat: 12, pace: 5, momentum: 3 });
          return "你选择更快的消费级入口：意念游戏、专注训练、沉浸办公。用户来得快，争议也来得快。";
        }
      },
      {
        label: "坚守隐私和伦理底线",
        effect: (s) => {
          add(s, "insight", 5);
          add(s, "reputation", 4);
          eraNudgeWorld(s, { windHeat: 5, momentum: 1 });
          return "你公开反对滥采神经数据。短期少赚了一些快钱，却在行业最敏感的地方攒下了信任。";
        }
      }
    ]
  },

  {
    id: "ev_era_2055_space_economy",
    module: "era",
    ambient: true,
    once: true,
    cond: (s) => s.year >= 2055,
    title: "🛰️ 太空经济落到地上",
    text: () => "低轨卫星像新的基础设施，轨道工厂开始量产特种材料，太空旅游从富豪玩具变成中产梦想。天上的生意，终于开始影响地上的账本。",
    choices: [
      { label: "押卫星和地面服务", effect: (s) => { add(s, "cash", -80000); add(s, "knowledge", 5); add(s, "network", 8); eraNudgeWorld(s, { jobMarket: 7, windHeat: 16, pace: 4, momentum: 6 }); return "你没有幻想自己去挖小行星，而是押注通信、导航、保险、维修和地面站。太空经济最先赚钱的，往往是地上的配套。" + eraWindHint(s, "太空经济") + eraBoostStartup(s, "太空经济", 13, 9000); } },
      { label: "买一张太空旅行票", effect: (s) => { add(s, "cash", -300000); add(s, "mood", 14); add(s, "reputation", 8); socialShift(s, 5); eraNudgeWorld(s, { windHeat: 8, momentum: 2 }); return "舷窗外，地球像一枚发光的蓝色硬币。你忽然明白，人类所有争吵都发生在同一层薄薄的大气下面。"; } },
      { label: "觉得太远，回到本地生意", effect: (s) => { add(s, "strategy", 2); add(s, "stress", -2); eraNudgeWorld(s, { windHeat: 4 }); return "你承认太空很宏大，但你的账本还在地面。不是所有时代大潮都适合亲自下水，有时守住熟悉的现金流也是智慧。"; } }
    ]
  }
);
