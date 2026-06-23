"use strict";
/* =====================================================================
 * content/events-venture.js —— 创业「经营模式」专属【氛围事件】模块
 * 玩家全职 all-in 创业、进入按周推进的经营模式期间随机触发。
 *
 * 经营模式下引擎维护 s.startup：
 *   product(产品力0~100) users(用户0~100) team(团队/士气0~100)
 *   buzz(口碑声量0~100) runway(资金跑道·剩余周数) valuation(估值·元)
 *   stage("种子"/"天使轮"/"A轮"/"B轮"/"Pre-IPO") weeksRun(已经营周数)
 *   track(赛道名) fulltime(true)
 *
 * 全部事件 module:"venture"、ambient:true，cond 至少 gate s.startup.fulltime。
 * 修改创业状态直接赋值并钳制 0~100（见 vt_clamp）；融资/烧钱改 runway/valuation；
 * 玩家个人现金用 add(s,"cash",...)。内部辅助一律 vt_ 前缀，事件 id 一律 ev_vt_ 前缀。
 *
 * 经典 <script> 全局作用域：EVENTS 已存在，直接 push；
 * 只用全局 helper（add/flag/has/pick/rnd/byClass/classTier/bumpMomentum/genName）。
 * ===================================================================== */

// —— 把某个 startup 字段加上 delta 并钳制 0~100 ——
function vt_bump(s, key, delta) {
  s.startup[key] = Math.max(0, Math.min(100, (s.startup[key] || 0) + delta));
  return s.startup[key];
}
// —— 估值倍率调整（不为负） ——
function vt_val(s, mult) {
  s.startup.valuation = Math.max(0, Math.round((s.startup.valuation || 0) * mult));
  return s.startup.valuation;
}
function vt_valAdd(s, amt) {
  s.startup.valuation = Math.max(0, Math.round((s.startup.valuation || 0) + amt));
  return s.startup.valuation;
}
// —— 跑道增减（周），不为负 ——
function vt_runway(s, weeks) {
  s.startup.runway = Math.max(0, Math.round((s.startup.runway || 0) + weeks));
  return s.startup.runway;
}
// —— 博弈成功率：谋略 + 魅力 + 个人势头加成，封顶 0.9 ——
function vt_rate(s, base, forFunding) {
  var mo = (s.world && s.world.momentum) ? s.world.momentum / 600 : 0;
  // 融资场景额外读社会通行度：投资人「听懂的是你的履历」——背景越能上桌，钱越好拿（约 ±0.18）
  var acc = (forFunding && typeof socialAccess === "function") ? (socialAccess(s, "startup_funding") - 50) / 280 : 0;
  return Math.max(0.05, Math.min(0.9, base + (s.stats.strategy || 0) / 250 + (s.stats.charm || 0) / 320 + mo + acc));
}
// —— 随机投资人/同事/对手称呼 ——
function vt_vc() { return pick(["王总", "陈总", "Peter", "老沈", "李董", "周慎", "Grace", "投资人老马", "合伙人 Ken"]); }
function vt_org() { return pick(["红衫", "蓝湖", "启明星", "高榕", "源石", "经纬同行", "深创投"]) + "资本"; }
function vt_giant() { return pick(["某大厂", "巨头 T", "巨头 A", "上市公司 B", "行业老大"]); }
// —— 估值人话格式（万/亿） ——
function vt_money(v) {
  if (v >= 1e8) return (v / 1e8).toFixed(2).replace(/\.?0+$/, "") + "亿";
  if (v >= 1e4) return Math.round(v / 1e4) + "万";
  return Math.round(v) + "元";
}
// —— 阶段晋级：种子→天使轮→A轮→B轮→Pre-IPO ——
function vt_promote(s) {
  var ladder = ["种子", "天使轮", "A轮", "B轮", "Pre-IPO"];
  var i = ladder.indexOf(s.startup.stage);
  if (i >= 0 && i < ladder.length - 1) s.startup.stage = ladder[i + 1];
  return s.startup.stage;
}
// —— 卖掉公司套现退出：玩家拿现金、清空创业态 ——
function vt_exit(s, cashOut, why) {
  add(s, "cash", Math.round(cashOut));
  flag(s, "startup_done");
  delete s.startup.fulltime;
  s.startup.runway = 0;
  bumpMomentum(s, 8);
  return why;
}

/* ============================================================
 * 1. 融资路演见投资人（分阶段 gate；成功跑道大涨+估值升+稀释；被拒打击士气）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_pitch", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.startup.runway < 30,
  title: "🚀 路演见投资人",
  text: (s) => "约到了" + vt_org() + "的" + vt_vc() + "。会议室冷气开得很足，你把熬了三个通宵的 BP 投上幕布。"
    + ((typeof byAccess === "function") ? byAccess(s, "startup_funding", { high: "对方还没完全听懂你的产品，却已经听懂了你的履历——气氛一开始就是松的。", mid: "对方愿意继续聊，但每一个数字都要你解释三遍。", low: "你讲了二十分钟业务，对方却先问了一句：「你之前在哪家公司做过？」" }) + " " : "")
    + "「" + s.startup.track + "这个故事，怎么证明你能跑出来？」对面眼神平静，手指敲着桌面。你深吸一口气。",
  choices: [
    {
      label: "讲增长飞轮，把数据拉满（赌一把）",
      next: (s) => ({
        text: (s) => "你把用户曲线和留存讲得天花乱坠。" + vt_vc() + "终于抬眼：「下周给你 Term Sheet。」——还是「再看看，保持联系」？",
        choices: [
          {
            label: "敲定 Term Sheet，签！",
            effect: (s) => {
              var _wi = ((s.startup.tracks || [s.startup.track]).indexOf(s.eraWind) >= 0 && typeof windInsight === "function") ? windInsight(s) : 0;   // 押对风口又看懂趋势 → 投资人更买账
              if (rnd(vt_rate(s, s.startup.product / 200 + s.startup.users / 250 + 0.25 + _wi, true))) {
                var raise = 12 + Math.floor((s.startup.product + s.startup.users) / 8);
                vt_runway(s, raise); vt_val(s, 1.8); vt_bump(s, "team", 10); vt_bump(s, "buzz", 8);
                vt_promote(s); bumpMomentum(s, 6); add(s, "mood", 10);
                return "钱到账！跑道续上 " + raise + " 周，估值跳到 " + vt_money(s.startup.valuation) + "，轮次推进到「" + s.startup.stage
                  + "」。代价是又稀释了一截股权——但活下去最重要。团队士气大振。";
              }
              vt_bump(s, "team", -8); add(s, "stress", 12); add(s, "mood", -10); bumpMomentum(s, -4);
              return "尽调阶段，对方扒出你拼了命也填不平的数据窟窿，临门一脚撤了。消息传开，团队人心浮动。";
            }
          },
          {
            label: "对方要对赌，咬牙接（高估值高压力）",
            effect: (s) => {
              vt_runway(s, 20); vt_val(s, 2.4); flag(s, "vt_vam"); add(s, "stress", 16); vt_bump(s, "team", 4);
              return "你签下对赌：三年内做不到约定营收，就得加倍回购股份。估值冲到 " + vt_money(s.startup.valuation)
                + "，跑道续 20 周。账面光鲜，可那纸协议从此压在你胸口。";
            }
          }
        ]
      })
    },
    {
      label: "实在人模式，只讲产品和现金流",
      effect: (s) => {
        if (rnd(vt_rate(s, s.startup.product / 180 + 0.15))) {
          vt_runway(s, 8); vt_valAdd(s, 3000000); vt_bump(s, "buzz", 3);
          return vt_vc() + "点头：「不画饼，难得。」给了你一笔小钱过桥，跑道续 8 周，估值小涨。慢是慢，但踏实。";
        }
        add(s, "mood", -8); vt_bump(s, "team", -5); bumpMomentum(s, -3);
        return "「故事性不够，我们 pass。」你被婉拒，走出大楼时天已经黑了。回去还得跟团队装作没事。";
      }
    }
  ]
});

/* ============================================================
 * 2. 竞品价格战 / 巨头下场抄袭
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_pricewar", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.startup.users > 20,
  title: "🚀 巨头下场了",
  text: (s) => vt_giant() + "上线了几乎一模一样的功能，还直接免费——明摆着要把你这条" + s.startup.track + "赛道烧干。"
    + "运营群里炸了锅：「老大，跟不跟？」",
  choices: [
    {
      label: "正面应战，补贴打价格战",
      next: (s) => ({
        text: (s) => "你决定烧钱守住用户。财务把数字摆你面前：照这个补贴速度，跑道要折掉一大块。真打？",
        choices: [
          {
            label: "All in 补贴，守住基本盘",
            effect: (s) => {
              vt_runway(s, -6); add(s, "stress", 12);
              if (rnd(vt_rate(s, 0.4))) { vt_bump(s, "users", 6); vt_bump(s, "buzz", 8); return "你顶住了！补贴换来口碑，老用户没走，新用户还涨了点。跑道烧掉 6 周，但阵地守住了。"; }
              vt_bump(s, "users", -14); vt_bump(s, "team", -8); bumpMomentum(s, -5);
              return "钱花了，用户还是被巨头的免费抢走一大批。烧掉 6 周跑道，团队开始怀疑这仗到底该不该打。";
            }
          },
          {
            label: "撑不住，悄悄收缩",
            effect: (s) => { vt_bump(s, "users", -8); vt_bump(s, "buzz", -5); add(s, "mood", -6); return "你没敢硬碰，默默缩减投放。用户慢慢流失，但起码没把家底烧光。"; }
          }
        ]
      })
    },
    {
      label: "差异化，往巨头看不上的细分钻",
      effect: (s) => {
        if (rnd(vt_rate(s, s.startup.product / 160 + 0.2))) {
          vt_bump(s, "product", 8); vt_bump(s, "buzz", 6); vt_bump(s, "users", -4); bumpMomentum(s, 4);
          return "你掉头扎进巨头懒得做的硬骨头细分场景。短期掉了点用户，但产品壁垒和口碑都更扎实了。船小好掉头。";
        }
        vt_bump(s, "users", -10); vt_bump(s, "buzz", -4);
        return "细分没那么好做，老用户嫌你跑偏，新场景又没跑通。两头不讨好，用户继续被吸走。";
      }
    }
  ]
});

/* ============================================================
 * 3. 核心合伙人/技术大牛闹离职、团队内讧
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_cofounder", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime,
  title: "🚀 合伙人要走",
  text: (s) => { var n = genName(); return "技术合伙人" + n + "把离职信拍你桌上：「方向我不认同，期权也看不到头。我撑不下去了。」"
    + "他手里攥着半个核心系统的代码，这一走，team 直接塌一块。"; },
  choices: [
    {
      label: "深谈到凌晨，掏心窝挽留",
      next: (s) => ({
        text: (s) => "你们在楼下大排档喝到两点。他红着眼：「你要是真信这事能成，给我个理由。」给他什么？",
        choices: [
          {
            label: "追加期权 + 给联合创始人名分",
            effect: (s) => {
              if (rnd(vt_rate(s, 0.55))) { vt_bump(s, "team", 14); vt_bump(s, "product", 4); vt_val(s, 0.97); add(s, "mood", 6); return "他留下了，眼里又有光。团队稳住，产品迭代不断档——代价是又分出去一块股权，估值略稀释。"; }
              vt_bump(s, "team", -10); bumpMomentum(s, -4); return "你给了筹码，他还是走了。「不是钱的事。」团队看在眼里，更慌了。";
            }
          },
          {
            label: "只谈情怀，谈当年合伙的梦",
            effect: (s) => {
              if (rnd(vt_rate(s, 0.3))) { vt_bump(s, "team", 8); add(s, "mood", 4); return "情怀这次真管用，他被你说动留下了。但你心里清楚，下次未必。"; }
              vt_bump(s, "team", -12); add(s, "stress", 8); return "情怀喂不饱人。他第二天就办了交接，技术骨干跟着走了俩。团队元气大伤。";
            }
          }
        ]
      })
    },
    {
      label: "好聚好散，放手让他走",
      effect: (s) => { vt_bump(s, "team", -8); vt_bump(s, "product", -5); add(s, "stress", 6); return "你签了离职。少一个内耗的人，团队反而清爽了点——可技术断层的窟窿，得你自己熬夜去填。"; }
    }
  ]
});

/* ============================================================
 * 4. 数据造假/刷单的诱惑（道德抉择）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_fakedata", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.startup.users < 60,
  title: "🚀 刷单的诱惑",
  text: (s) => "增长黑客凑过来压低声音：「下轮要看数据吧？我认识刷量的，一周给你把日活翻三倍，投资人那边好看。神不知鬼不觉。」"
    + "屏幕上真实的留存曲线疲软得让你心慌。",
  choices: [
    {
      label: "刷！先把这轮融资拿下再说",
      effect: (s) => {
        vt_bump(s, "users", 12); vt_bump(s, "buzz", 8); vt_val(s, 1.5); flag(s, "vt_faked"); add(s, "stress", 10);
        if (rnd(0.4)) {
          vt_bump(s, "users", -28); vt_bump(s, "buzz", -30); vt_val(s, 0.35); vt_bump(s, "team", -15); add(s, "reputation", -20); bumpMomentum(s, -10);
          return "数据是好看了，估值也冲了上去。可一个较真的尽调机构抓出了刷量痕迹——东窗事发，估值腰斩再腰斩，投资人连夜撤资，口碑崩盘。你赌输了。";
        }
        return "假数据糊弄过了这轮，估值漂亮地冲了上去。投资人鼓掌的那一刻，你后背全是冷汗——这颗雷，迟早要响。";
      }
    },
    {
      label: "不干，数据可以难看，账不能脏",
      effect: (s) => { add(s, "reputation", 6); add(s, "insight", 2); vt_bump(s, "team", 4); add(s, "mood", 4); return "你把人轰了出去。这轮数据是难看，融资也更难谈——可夜里能睡着。团队里几个老人悄悄给你竖了大拇指。"; }
    }
  ]
});

/* ============================================================
 * 5. 产品爆款出圈 / 上了热搜
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_viral", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.startup.product > 40,
  title: "🚀 上热搜了",
  text: (s) => "凌晨三点，运营把你从床上摇醒：「老大！咱们上热搜了！#" + s.startup.track + "神器# 阅读破亿，服务器要被挤爆了！」"
    + "用户像潮水一样涌进来——这是泼天的流量，也是要命的考验。",
  choices: [
    {
      label: "连夜扩容硬扛，把流量全接住",
      next: (s) => ({
        text: (s) => "你拍板加服务器、全员通宵值守。能不能扛住这波，就看团队这口气了。",
        choices: [
          {
            label: "全员上，扛住这泼天富贵",
            effect: (s) => {
              if (rnd(vt_rate(s, s.startup.team / 150 + 0.25))) {
                vt_bump(s, "users", 22); vt_bump(s, "buzz", 20); vt_val(s, 1.7); vt_bump(s, "team", -6); add(s, "stress", 12); bumpMomentum(s, 8);
                return "扛住了！用户和口碑暴涨，估值跟着跳到 " + vt_money(s.startup.valuation) + "。团队累瘫，但所有人都知道——这一夜，公司不一样了。";
              }
              vt_bump(s, "users", 6); vt_bump(s, "buzz", -12); vt_bump(s, "team", -12); add(s, "stress", 14);
              return "服务器还是崩了俩小时，差评铺天盖地：「这破软件根本打不开」。流量来得快走得也快，团队累垮还挨骂，口碑反而受损。";
            }
          },
          {
            label: "限流保稳，宁可慢也别崩",
            effect: (s) => { vt_bump(s, "users", 10); vt_bump(s, "buzz", 6); vt_bump(s, "product", 4); return "你果断限流排队，体验稳住了。涨得没那么炸，但来的都是真用户，产品口碑反而立住了。"; }
          }
        ]
      })
    },
    {
      label: "趁热打铁开发布会、追加投放",
      effect: (s) => {
        vt_runway(s, -4); vt_bump(s, "buzz", 14);
        if (rnd(vt_rate(s, 0.5))) { vt_bump(s, "users", 16); vt_val(s, 1.4); return "你把热度榨到极致，开了场刷屏发布会，用户和估值再上一个台阶。代价是烧了 4 周跑道。"; }
        vt_bump(s, "users", 4); add(s, "stress", 8); return "钱砸下去，热度却来得快散得快。烧了 4 周跑道，只换来一点点留存。出圈这事，强求不来。";
      }
    }
  ]
});

/* ============================================================
 * 6. 资金链告急（gate runway < 8）：借钱/裁员/砍业务/对赌求生
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_cashcrisis", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.startup.runway < 8,
  title: "🚀 账上只剩几周了",
  text: (s) => "财务把工资表推到你面前，声音发抖：「老板，照这个烧法，账上的钱只够再撑 " + Math.max(1, s.startup.runway) + " 周……」"
    + "窗外车水马龙，办公室里却静得能听见空调声。今晚必须做决定。",
  choices: [
    {
      label: "裁员断臂，先活下去",
      effect: (s) => { vt_runway(s, 6); vt_bump(s, "team", -16); vt_bump(s, "product", -4); add(s, "stress", 14); add(s, "mood", -10); return "你亲手发了名单。送走并肩战斗的兄弟，办公室空了一半。跑道续了 6 周，可那种愧疚，比缺钱更难受。"; }
    },
    {
      label: "刷爆自己信用卡 + 找亲友借钱垫着",
      effect: (s) => {
        add(s, "cash", -120000); flag(s, "has_loan"); vt_runway(s, 5); add(s, "stress", 16); vt_bump(s, "team", 4);
        return "你押上个人身家垫工资，团队没散。可这下公司的命和你的命，彻底绑死在一根绳上了。";
      }
    },
    {
      label: "砍掉所有副线，只保命脉业务",
      effect: (s) => { vt_runway(s, 4); vt_bump(s, "users", -6); vt_bump(s, "product", 4); add(s, "insight", 2); return "你砍掉了一切「看起来很美」的副业，只留最赚钱的那条线。聚焦之后，烧钱慢了，方向也清晰了。"; }
    },
    {
      label: "城下之盟，接屈辱对赌融资",
      effect: (s) => {
        if (rnd(vt_rate(s, 0.5))) { vt_runway(s, 14); vt_val(s, 0.6); flag(s, "vt_vam"); add(s, "stress", 14); return "投资人趁火打劫，压了你一半估值，还塞了对赌条款。你认了——续命 14 周，先别死再说。"; }
        vt_bump(s, "team", -10); add(s, "mood", -12); bumpMomentum(s, -6); return "你低声下气谈了半个月，对方最后还是没出手。账上的数字，一周比一周触目惊心。";
      }
    }
  ]
});

/* ============================================================
 * 7. 大客户大单 / 战略合作（被绑架定制）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_bigclient", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.startup.product > 30,
  title: "🚀 一张救命大单",
  text: (s) => "一家大集团抛来橄榄枝：「我们要采购你们的方案，年框金额够你们活两年。但——得按我们的需求深度定制。」"
    + "财务的眼睛都亮了，技术合伙人却皱起眉：「接了，咱就成了他家的外包。」",
  choices: [
    {
      label: "接！先活下来再谈理想",
      next: (s) => ({
        text: (s) => "签约前，对方又加码：「要派我们的人进你们团队驻场，节奏我们说了算。」忍还是不忍？",
        choices: [
          {
            label: "全盘答应，抱紧金主大腿",
            effect: (s) => { vt_runway(s, 24); vt_valAdd(s, 8000000); vt_bump(s, "users", 8); vt_bump(s, "product", -8); vt_bump(s, "team", -6); flag(s, "vt_captive"); add(s, "stress", 8); return "钱真香，跑道一口气续了 24 周，估值也涨了。可团队一半人力都被这一个客户绑死，产品路线图基本作废。你成了高级外包。"; }
          },
          {
            label: "守住底线，标准化合作不定制",
            effect: (s) => {
              if (rnd(vt_rate(s, s.startup.product / 160 + 0.2))) { vt_runway(s, 14); vt_valAdd(s, 4000000); vt_bump(s, "product", 4); return "你硬气地只卖标准版，对方居然也认了。既拿了钱，又没被绑架，产品还更通用了。漂亮。"; }
              add(s, "mood", -6); return "对方觉得你不够「有诚意」，单子黄了。技术合伙人拍了拍你肩：「没接也好，没把魂卖了。」";
            }
          }
        ]
      })
    },
    {
      label: "不接，专心做自己的标准产品",
      effect: (s) => { vt_bump(s, "product", 6); add(s, "insight", 2); vt_runway(s, -2); return "你婉拒了大单。团队继续打磨通用产品，慢是慢，但你想做的是产品，不是某家公司的工具人。"; }
    }
  ]
});

/* ============================================================
 * 8. 收购 offer 来了（gate 估值规模；卖了套现退出）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_acquire", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && (s.startup.valuation || 0) > 30000000,
  title: "🚀 收购要约",
  text: (s) => vt_giant() + "的战投部发来要约：「我们想全资收购，价格好谈。你套现走人，或者带团队加入，都行。」"
    + "桌上那份意向书写着一个让你心跳加速的数字。卖，还是不卖？",
  choices: [
    {
      label: "卖了！见好就收，落袋为安",
      next: (s) => ({
        text: (s) => { var cash = Math.round((s.startup.valuation || 0) * (0.25 + Math.random() * 0.1));
          return "对方报价对应你个人能套现约 " + vt_money(cash) + "。签字笔就在手边——这是你创业以来离财富自由最近的一刻。最后确认？"; },
        choices: [
          {
            label: "签！这辈子值了",
            effect: (s) => { var cash = Math.round((s.startup.valuation || 0) * 0.28); return vt_exit(s, cash, "你签了。公司并入" + vt_giant() + "，你个人套现约 " + vt_money(cash) + "落袋。走出大楼那刻百感交集——这是终点，也是另一种胜利。从此你是自由人。"); }
          },
          {
            label: "再想想，万一它能成独角兽呢",
            effect: (s) => { vt_bump(s, "team", -4); add(s, "stress", 6); return "你把笔放下了。也许是贪心，也许是不甘。机会窗口关上，前路凶吉未卜——这一夜你没睡着。"; }
          }
        ]
      })
    },
    {
      label: "不卖，我要做成行业第一",
      effect: (s) => { vt_bump(s, "team", 8); vt_bump(s, "buzz", 6); add(s, "mood", 6); bumpMomentum(s, 4); return "你当场拒绝。消息传回团队，反而士气大涨：「老板有种！」野心的代价是继续在刀尖上跳舞——但你眼里只有更大的局。"; }
    }
  ]
});

/* ============================================================
 * 9. pivot 转型（赛道不行，掉头 vs 死磕）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_pivot", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.startup.users < 35 && s.startup.weeksRun > 8,
  title: "🚀 这条路走不通了",
  text: (s) => "复盘会上数据冰冷：" + s.startup.track + "这个方向，用户怎么拉都不涨，市场可能根本不存在。"
    + "有人小声说出了那个谁都不敢提的词——「要不，我们 pivot 吧？」",
  choices: [
    {
      label: "掉头转型，赌一个新方向",
      next: (s) => ({
        text: (s) => "转型意味着前面的积累大半作废，团队也要跟着折腾。但留在原地，就是温水煮青蛙。真转？",
        choices: [
          {
            label: "All in 新方向，破釜沉舟",
            effect: (s) => {
              s.startup.track = pick(["AI 工具", "出海电商", "企业服务", "银发健康", "情绪消费", "硬件智能"]);
              vt_bump(s, "product", -12); vt_bump(s, "users", -8);
              if (rnd(vt_rate(s, 0.45))) { vt_bump(s, "users", 22); vt_bump(s, "buzz", 12); vt_bump(s, "team", 8); vt_val(s, 1.5); bumpMomentum(s, 7); return "转型转对了！新赛道「" + s.startup.track + "」一上线就有起色，用户回暖、估值反弹。死过一回，反而活得更明白。"; }
              vt_bump(s, "team", -10); add(s, "stress", 14); bumpMomentum(s, -6); return "你赌上一切转向「" + s.startup.track + "」，可新方向同样没那么好走。家底折了大半，团队疲惫不堪。这一掉头，凶多吉少。";
            }
          },
          {
            label: "小步快跑，先做个验证版本",
            effect: (s) => { vt_bump(s, "product", -4); add(s, "insight", 2); if (rnd(vt_rate(s, 0.55))) { vt_bump(s, "users", 8); vt_bump(s, "buzz", 4); s.startup.track = "微调后的" + s.startup.track; return "你没大改，只做了个小验证版试水。数据居然有反馈，方向被你修正过来了。稳。"; } return "验证版本反响平平，你又回到原点——但起码没把家底赔进去。"; }
          }
        ]
      })
    },
    {
      label: "死磕到底，再给原方向一次机会",
      effect: (s) => { vt_bump(s, "team", -4); vt_runway(s, -3); if (rnd(vt_rate(s, 0.3))) { vt_bump(s, "users", 10); vt_bump(s, "product", 6); bumpMomentum(s, 4); return "你选择相信最初的判断，又熬了几周——市场居然慢慢被你教育出来了。守得云开。"; } vt_bump(s, "users", -6); add(s, "mood", -8); return "你死磕原方向，用户却纹丝不动。又烧了几周跑道，团队的眼神越来越疲惫。固执的代价不小。"; }
    }
  ]
});

/* ============================================================
 * 10. 招到关键人才 / 挖角战
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_talent", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime,
  title: "🚀 一个大牛想加入",
  text: (s) => { var n = genName(); return "猎头牵线，" + vt_giant() + "的技术大牛" + n + "对你的事业有点动心，但人家现在年薪百万、期权满手。"
    + "「我可以来，」他直说，「但你得让我相信，这家小破公司值得我跳。」"; },
  choices: [
    {
      label: "开高薪 + 大把期权，砸钱挖",
      effect: (s) => {
        vt_runway(s, -4); vt_val(s, 0.96);
        if (rnd(vt_rate(s, 0.6))) { vt_bump(s, "product", 12); vt_bump(s, "team", 8); vt_bump(s, "buzz", 4); return "他来了！第一周就把卡了你们两个月的架构难题解了。产品力肉眼可见地往上窜——这钱花得值。"; }
        add(s, "mood", -4); return "你开了诚意满满的条件，他临了还是被大厂用反 offer 留住了。竹篮打水，跑道还白烧了几周。";
      }
    },
    {
      label: "用愿景和事业打动他",
      next: (s) => ({
        text: (s) => "你拉他喝酒，讲赛道、讲未来、讲你为什么非干这事不可。他听得入神：「说说看，三年后我们会是什么样？」",
        choices: [
          {
            label: "给他画一张真实又热血的大饼",
            effect: (s) => { if (rnd(vt_rate(s, s.startup.buzz / 160 + 0.35))) { vt_bump(s, "product", 10); vt_bump(s, "team", 10); add(s, "mood", 6); return "他被你点燃了：「干了！钱少点没关系，我要的是这个。」核心战力到位，团队气场都不一样了。"; } return "他被打动，却没被说服：「理想很好，但我有房贷。」人没挖到，你却更确信自己讲的是真心话。"; }
          },
          {
            label: "实在没钱，先请他当顾问试试",
            effect: (s) => { vt_bump(s, "product", 5); vt_bump(s, "team", 3); return "他答应先做兼职顾问。虽不是全职，但关键时刻能搭把手，产品也少走了不少弯路。"; }
          }
        ]
      })
    }
  ]
});

/* ============================================================
 * 11. 公关危机 / 用户投诉上纲上线
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_pr", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.startup.buzz > 20,
  title: "🚀 上了热搜（但是负面）",
  text: (s) => "一条用户投诉被大 V 转发引爆：「#" + s.startup.track + "公司吃相难看#」冲上热搜，评论区已经开始上纲上线。"
    + "公关小姑娘脸都白了：「老板，回应稿你看一下，越快越好！」",
  choices: [
    {
      label: "第一时间真诚道歉 + 整改",
      effect: (s) => {
        if (rnd(vt_rate(s, 0.6))) { vt_bump(s, "buzz", 6); add(s, "reputation", 6); vt_bump(s, "users", -3); return "你放下身段，凌晨发了封诚恳的道歉信，连夜整改并补偿用户。舆论慢慢转向：「至少这家敢认错。」危机变成了口碑加分。"; }
        vt_bump(s, "buzz", -8); vt_bump(s, "users", -6); add(s, "stress", 8); return "道歉信措辞被骂「太官方」，反而火上浇油。这波你接得不漂亮，掉粉掉口碑。";
      }
    },
    {
      label: "强硬公关 + 发律师函压下去",
      effect: (s) => { vt_runway(s, -2); if (rnd(0.4)) { vt_bump(s, "buzz", -16); add(s, "reputation", -14); vt_bump(s, "users", -12); bumpMomentum(s, -6); return "律师函一发，网友更炸了：「店大欺客实锤！」舆情彻底失控，用户和口碑双崩。这步棋走死了。"; } vt_bump(s, "buzz", -4); return "你强势压下了苗头，热度散了，但「这家公司不好惹」的印象也留下了。算是惨胜。"; }
    },
    {
      label: "冷处理，不回应等它过去",
      effect: (s) => { vt_bump(s, "buzz", -6); vt_bump(s, "users", -4); return "你赌它三天就被新瓜盖过去。结果有人记仇有人遗忘，热度确实慢慢淡了，但隐隐留了道疤。"; }
    }
  ]
});

/* ============================================================
 * 12. 投资人对赌协议 / 董事会夺权（gate 已签对赌 或 估值较大）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_board", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && (has(s, "vt_vam") || (s.startup.valuation || 0) > 50000000),
  title: "🚀 董事会摊牌",
  text: (s) => "董事会上，投资人代表" + vt_vc() + "脸色铁青：「业绩没达对赌，我们对管理层失去信心。建议引入职业经理人，你退居技术岗。」"
    + "几张曾经笑脸相迎的脸，此刻都成了债主。这是你一手带大的公司。",
  choices: [
    {
      label: "据理力争，绑定团队保住控制权",
      next: (s) => ({
        text: (s) => "你需要团队和小股东站你这边。但临阵，得拿出点东西让大家信你还能赢。亮什么牌？",
        choices: [
          {
            label: "立军令状：限期翻盘，赌上自己股权",
            effect: (s) => { if (rnd(vt_rate(s, s.startup.team / 150 + 0.3))) { vt_bump(s, "team", 12); flag(s, "vt_keptpower"); add(s, "stress", 12); bumpMomentum(s, 5); return "你押上个人股权立下军令状，团队被你这股狠劲镇住，董事会勉强再给你一次机会。控制权保住了——但只剩最后一搏。"; } vt_bump(s, "team", -8); add(s, "mood", -10); return "你慷慨陈词，可数据不撒谎，小股东也倒戈了。表决通过，你被架空成了名义上的创始人。"; }
          },
          {
            label: "拉外部白衣骑士进来制衡",
            effect: (s) => { if (rnd(vt_rate(s, 0.45))) { vt_valAdd(s, 6000000); vt_runway(s, 8); flag(s, "vt_keptpower"); return "你火速引入一家新机构当白衣骑士，稀释了原投资人的话语权。控制权暂时稳住，跑道也续了一截。险棋走活了。"; } add(s, "stress", 10); return "白衣骑士被你原本的投资人提前堵了路，没谈成。你在董事会愈发孤立。"; }
          }
        ]
      })
    },
    {
      label: "认了，退居二线换公司活路",
      effect: (s) => { vt_bump(s, "team", -6); vt_runway(s, 6); add(s, "mood", -8); flag(s, "vt_steppeddown"); return "你妥协了，让职业经理人接管。公司也许能活，但它从此不再完全属于你。会议室散场时，你最后看了一眼自己名字的工牌。"; }
    }
  ]
});

/* ============================================================
 * 13. 员工讨薪 / 期权画饼兑现（gate runway 偏紧 或 team 偏低）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_payday", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && (s.startup.team < 50 || s.startup.runway < 12),
  title: "🚀 员工堵门讨薪",
  text: (s) => "几个老员工站在你办公室门口，为首的攥着工资条：「老板，这个月薪水又缓发，期权我们等了三年，到底什么时候能兑现？再这样，大家真要散了。」"
    + "办公室里所有人都竖着耳朵。",
  choices: [
    {
      label: "掏个人积蓄先把工资补齐",
      effect: (s) => { add(s, "cash", -80000); vt_runway(s, -1); vt_bump(s, "team", 12); add(s, "mood", 4); return "你二话不说转账补齐了工资。员工愣住了：「老板自己贴钱……」人心一下子收了回来，但你的家底又薄了一层。"; }
    },
    {
      label: "开诚布公：把账本摊给大家看",
      next: (s) => ({
        text: (s) => "你把公司真实的财务状况、融资进度、期权方案全盘托出。说完，会议室一片沉默。他们会信你吗？",
        choices: [
          {
            label: "请大家再陪我赌一把",
            effect: (s) => { if (rnd(vt_rate(s, s.startup.buzz / 150 + 0.3))) { vt_bump(s, "team", 10); add(s, "reputation", 4); return "你的坦诚换来了信任：「行，老板，再信你一回。」核心团队没散，反而更拧成一股绳。"; } vt_bump(s, "team", -10); return "坦诚没能换来留下。「我们也要吃饭啊老板。」几个老人当周就递了辞呈，团队伤筋动骨。"; }
          },
          {
            label: "用期权加码 + 兑现承诺安抚",
            effect: (s) => { vt_val(s, 0.95); vt_bump(s, "team", 8); return "你追加了期权、白纸黑字写明兑现节点。股权又稀释一点，但人留住了，画的饼总算落了点实。"; }
          }
        ]
      })
    },
    {
      label: "硬气表态：嫌少的可以走",
      effect: (s) => { vt_bump(s, "team", -14); vt_bump(s, "product", -4); add(s, "reputation", -6); bumpMomentum(s, -4); return "你撂了狠话。当场是镇住了，可那天之后，陆续有人安静地交了离职信。寒了的心，不好捂热。"; }
    }
  ]
});

/* ============================================================
 * 14. 上市辅导 / 冲刺 IPO（gate 估值高 + stage 后期；flag chase_ipo）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_ipo", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && (s.startup.stage === "B轮" || s.startup.stage === "Pre-IPO") && (s.startup.valuation || 0) > 200000000,
  title: "🚀 冲刺 IPO",
  text: (s) => "保荐机构把厚厚一摞辅导材料拍在桌上：「按你们现在的体量，可以冲上市了。敲钟那天，你就是别人故事里的传奇。」"
    + "估值 " + vt_money(s.startup.valuation) + "的公司站在临门一脚——但 IPO 这条路，每一步都是放大镜下的审视。",
  choices: [
    {
      label: "All in 冲刺 IPO，去敲那口钟",
      next: (s) => ({
        text: (s) => "上市辅导意味着财务全面合规、业绩持续达标、团队全力以赴。这是终点线前最残酷的一段。准备好了吗？",
        choices: [
          {
            label: "把公司和命都押上，冲！",
            effect: (s) => {
              flag(s, "chase_ipo"); add(s, "stress", 16); vt_bump(s, "team", -6);
              var penalty = has(s, "vt_faked") ? 0.25 : 0;
              if (rnd(vt_rate(s, s.startup.product / 200 + s.startup.users / 250 + 0.3 - penalty))) {
                vt_val(s, 2.2); vt_promote(s); vt_bump(s, "buzz", 18); bumpMomentum(s, 12); add(s, "reputation", 16);
                var pi = s.world ? s.world.priceIndex : 1;
                var cash = bigWindfall(s, 30000000 + (s.startup.valuation || 0) / pi * 0.12);
                add(s, "cash", cash);
                return "敲钟那天，全场掌声雷动。你站在交易所大屏前，眼眶发热——公司市值 " + vt_money(s.startup.valuation) + "，你个人身价随之兑现一大笔。从一个 idea 到这里，你做到了。";
              }
              vt_val(s, 0.6); vt_bump(s, "team", -10); add(s, "mood", -14); bumpMomentum(s, -8);
              return has(s, "vt_faked")
                ? "上市审核翻出了当年那笔刷量旧账，IPO 被紧急叫停，估值暴跌，舆论哗然。出来混，总是要还的。"
                : "临门一脚却撞上市场寒冬，发行价一压再压，最终撤回申请。功亏一篑，团队士气跌到谷底。";
            }
          },
          {
            label: "再夯实一年基本面，稳一点上",
            effect: (s) => { vt_bump(s, "product", 6); vt_bump(s, "users", 5); vt_runway(s, -6); add(s, "insight", 2); return "你没急着冲，又花了一年把财务和业绩夯到无懈可击。烧了些跑道，但上市的底气足了许多。"; }
          }
        ]
      })
    },
    {
      label: "不上市，闷声做现金牛公司",
      effect: (s) => { vt_bump(s, "team", 4); add(s, "mood", 6); add(s, "insight", 2); return "你婉拒了保荐人。「不上市也能活得很好。」你想做一家不被股价绑架、自己说了算的公司。这也是一种清醒。"; }
    }
  ]
});

/* ============================================================
 * 15. 创始人健康透支 / 在 ICU 醒来（health 暴跌，要命还是要事业）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_health", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && (s.stress > 60 || (s.health || 100) < 55 || s.startup.weeksRun > 20),
  title: "🚀 在 ICU 醒来",
  text: (s) => "连续第几个通宵你已经数不清了。眼前一黑，再睁眼时是惨白的天花板和心电监护的滴答声——你晕倒在工位，被送进了 ICU。"
    + "医生神色凝重：「再这么熬，下次推进来的就是太平间。你这身体，得在命和事业之间选一个了。」",
  choices: [
    {
      label: "命要紧，强制自己放慢、放权",
      effect: (s) => { add(s, "health", 14); add(s, "stress", -20); add(s, "mood", 6); vt_bump(s, "product", -4); vt_bump(s, "team", 6); return "你第一次把方向盘交出去，给自己放了长假。公司推进慢了半拍，但你学会了带团队而不是当唯一引擎。身体一点点缓了过来。"; }
    },
    {
      label: "拔了针头就往公司冲（不要命了）",
      next: (s) => ({
        text: (s) => "护士拦不住你。你瞒着家人偷偷出院，可身体已经亮了红灯——这一冲，是搏命。值吗？",
        choices: [
          {
            label: "拼了，公司不能没有我",
            effect: (s) => {
              add(s, "health", -18); add(s, "stress", 14);
              if (rnd(vt_rate(s, 0.45))) { vt_bump(s, "product", 8); vt_bump(s, "users", 8); vt_bump(s, "buzz", 6); bumpMomentum(s, 4); return "你硬扛着把那个关键节点抢了下来，公司挺过了危机。代价是健康又被掏空一大块——这条命，你押在牌桌上了。"; }
              add(s, "health", -12); vt_bump(s, "team", -8); add(s, "mood", -12); bumpMomentum(s, -6); return "你拖着病体硬撑，结果决策频频失误，身体也彻底垮了。员工看着憔悴的你，士气反而更低。两头皆输。";
            }
          },
          {
            label: "折中：远程遥控，人留在病房",
            effect: (s) => { add(s, "health", -4); add(s, "stress", 6); vt_bump(s, "product", 3); return "你在病床上挂着吊瓶开视频会。身体勉强能扛，公司也没失速——可这种活法，到底能撑多久，你自己也不敢想。"; }
          }
        ]
      })
    }
  ]
});

/* ============================================================
 * 16. 行业寒冬 / 资本退潮（读 s.world.jobMarket / windHeat）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_winter", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.world && (s.world.jobMarket < 45 || s.world.windHeat < 25),
  title: "🚀 资本寒冬来了",
  text: (s) => "一夜之间，朋友圈全是「某某公司倒闭」「某基金停止出手」。你约的几个投资人不约而同地「再观望观望」。"
    + "寒气是真的，肉眼可见地，整条" + s.startup.track + "赛道的钱，都在退潮。",
  choices: [
    {
      label: "广积粮缓称王，砍开支熬过冬天",
      effect: (s) => { vt_runway(s, 8); vt_bump(s, "team", -6); vt_bump(s, "users", -3); add(s, "insight", 2); return "你果断进入「过冬模式」：砍营销、缓扩张、死守现金流。增长慢下来了，但跑道续了 8 周——活过冬天的人，才有资格谈春天。"; }
    },
    {
      label: "逆势抄底，趁低价挖人抢市场",
      next: (s) => ({
        text: (s) => "别人都在收缩，你却想反向操作——大厂裁的人正便宜，对手撑不住正空出市场。但这要烧钱。赌冬天的尽头是春天？",
        choices: [
          {
            label: "逆周期扩张，赌一把大的",
            effect: (s) => {
              vt_runway(s, -6); add(s, "stress", 12);
              if (rnd(vt_rate(s, 0.4))) { vt_bump(s, "users", 16); vt_bump(s, "product", 10); vt_bump(s, "buzz", 8); bumpMomentum(s, 8); return "你低价抄底人才、吃下对手让出的市场。等寒冬一过，你已经甩开同行一个身位。逆势者的胆识赌赢了。"; }
              vt_runway(s, -4); vt_bump(s, "team", -8); add(s, "mood", -10); bumpMomentum(s, -6); return "冬天比想象的更长。你烧掉跑道扩张，春天却迟迟不来，账面雪上加霜。逆势这一把，赌得太满了。";
            }
          },
          {
            label: "只小幅抄底核心岗位",
            effect: (s) => { vt_runway(s, -2); if (rnd(vt_rate(s, 0.55))) { vt_bump(s, "product", 6); vt_bump(s, "team", 4); return "你只精准抄底了一两个核心人才，性价比拉满。寒冬里悄悄补强，不声不响地变壮。"; } return "抄底的人没磨合好，短期没见效，但也没伤元气。稳扎稳打。"; }
          }
        ]
      })
    },
    {
      label: "趁还卖得动，找人接盘退出",
      effect: (s) => {
        if ((s.startup.valuation || 0) > 10000000 && rnd(vt_rate(s, 0.4))) {
          var cash = Math.round((s.startup.valuation || 0) * 0.18);
          return vt_exit(s, cash, "你看清了形势，赶在寒冬深处找到接盘方，半卖半送地退出，套现约 " + vt_money(cash) + "。不算体面，但全身而退，已经赢过太多没下牌桌的人。");
        }
        add(s, "mood", -8); vt_bump(s, "team", -4); return "你想出手，可寒冬里没人接盘，谈了一圈无功而返。看来这场仗，只能咬牙自己打下去。";
      }
    }
  ]
});

/* ============================================================
 * 17. 老用户/早期投资人回访——里程碑慰藉（中性调剂，按当前状态分支）
 * ============================================================ */
EVENTS.push({
  id: "ev_vt_milestone", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && s.startup.weeksRun > 6,
  title: "🚀 深夜复盘",
  text: (s) => {
    var good = s.startup.users + s.startup.product + s.startup.buzz > 180;
    return "又一个深夜，办公室只剩你和一盏台灯。你翻着这 " + (s.startup.weeksRun || 0) + " 周的复盘，"
      + (good ? "数据一路向上，恍惚间觉得离梦想从没这么近过。" : "数字却怎么看都揪心，你第一次认真问自己：当初 all-in，到底值不值。");
  },
  choices: [
    {
      label: "给团队写一封凌晨的全员信",
      effect: (s) => { vt_bump(s, "team", 8); add(s, "mood", 4); return "你敲下一封情真意切的全员信，按下发送。第二天，群里满屏的「老板加油」「一起干」。带队伍，靠的从来不只是钱。"; }
    },
    {
      label: "约早期投资人喝杯酒，聊聊心里话",
      next: (s) => ({
        text: (s) => "当年第一个信你的" + vt_vc() + "应了约。几杯下肚，他问：「说实话，现在的你，还是当初那个敢赌的人吗？」",
        choices: [
          {
            label: "「我比当初更想赢。」",
            effect: (s) => { vt_bump(s, "buzz", 4); add(s, "insight", 2); bumpMomentum(s, 3); return "他笑了，拍拍你的肩：「这股劲还在就好。」临走又给你引荐了两个潜在客户。火还没灭，路就还在。"; }
          },
          {
            label: "「累，但还没到放弃的时候。」",
            effect: (s) => { add(s, "stress", -8); add(s, "mood", 6); vt_bump(s, "team", 3); return "他没劝你硬撑，只说：「悠着点，公司是马拉松。」这句体己话，比任何融资都让你松了口气。"; }
          }
        ]
      })
    }
  ]
});

/* ============================================================
 * 学者下海专属（gate has(s,"phd_founder")）：技术理想 vs 商业现实、
 * 学术光环背书、被资本异化、低成本招揽科研人才、技术护城河硬刚巨头。
 * 让「学者创业」这条支线在经营模式里有专属的戏剧张力。
 * ============================================================ */

/* A. 技术理想 vs 快速变现：完美主义的代价 */
EVENTS.push({
  id: "ev_vt_acad_perfect", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && has(s, "phd_founder"),
  title: "🔬 产品会上，你又想推迟上线了",
  text: (s) => "团队吵起来了。你盯着 demo 里那个还差几个百分点精度的核心模块，做学问的执念又上来了：「这种半成品怎么能拿出去见人？」\n\n"
    + "可联合创始人把财务表拍在桌上：「" + s.startup.track + "的窗口就这几个月，跑道只剩 " + s.startup.runway + " 周。再磨下去，等我们做到 99 分，对手 80 分的东西已经把市场吃干净了。」\n\n"
    + "实验室追求的是极致与严谨，商场要的是速度与时机——这道你读了半辈子书都没遇到的题，今天逼到了眼前。",
  choices: [
    { label: "再打磨打磨，技术过硬才是根本", effect: (s) => {
        vt_bump(s, "product", 12); vt_runway(s, -6); vt_bump(s, "users", -4); add(s, "stress", 6);
        if (rnd(vt_rate(s, 0.35))) { vt_bump(s, "buzz", 8); vt_valAdd(s, 4000000);
          return "你顶住压力，把产品抠到了行业难以企及的高度。上线后，懂行的人一眼看出这东西「不一样」——硬核口碑慢慢发酵，技术壁垒成了你最深的护城河。这一次，学者的偏执，赢了。"; }
        return "你把产品磨到了自己满意，可上线时窗口已经过了大半。东西是真好，但市场不等人——错过的那拨用户，再拉回来要贵上好几倍。完美主义，这次交了学费。"; } },
    { label: "先上线占坑，边跑边迭代", effect: (s) => {
        vt_bump(s, "users", 12); vt_bump(s, "buzz", 6); vt_bump(s, "product", -4); vt_runway(s, 3); add(s, "insight", 2);
        return "你咽下那口『不够完美』的别扭，让团队带着瑕疵上线了。\n\n用户真金白银的反馈像一记记耳光，也像一剂剂良药——你头一回明白，商业世界里『先活下来、被用户骂着改』，比关起门来做到 100 分更要紧。这一课，书上没有。"; } }
  ]
});

/* B. 学术光环背书融资：你的头衔本身就是估值 */
EVENTS.push({
  id: "ev_vt_acad_halo", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && has(s, "phd_founder") && s.startup.runway < 28,
  title: "🎓 投资人冲着你的『头衔』来了",
  text: (s) => vt_org() + "的" + vt_vc() + "约你喝咖啡，开口却不太聊产品：「我们看中的是您本人——" + (s.major ? s.major.field : "您领域") + "的顶尖学者下场创业，这故事资本市场最买账。带上您的论文和头衔去路演，估值能再翻一倍。」\n\n"
    + "你心里清楚：这是把学术声誉当筹码押上牌桌。用，估值立竿见影；可万一公司有个闪失，赔进去的就不只是钱，还有你半生攒下的学术清誉。",
  choices: [
    { label: "高举高打，把学术光环用到极致", effect: (s) => {
        vt_val(s, 1.8); vt_runway(s, 16); vt_bump(s, "buzz", 14); flag(s, "vt_halo_bet"); add(s, "stress", 8);
        return "你带着论文和头衔站上路演台，「权威背书」四个字让估值一路飙到 " + vt_money(s.startup.valuation) + "，跑道续了 16 周。\n\n聚光灯打在身上时你有点恍惚——掌声是给学者的，还是给生意人的？你分不清，也来不及分。这步棋押的是你的名声，只能赢，不能输。"; } },
    { label: "低调，让产品自己说话", effect: (s) => {
        vt_bump(s, "product", 5); vt_valAdd(s, 2000000); vt_runway(s, 6); add(s, "reputation", 2); add(s, "insight", 2);
        return "你婉拒了「卖人设」的提议，只让数据和产品出面。融资慢了、少了，但你守住了一条线：学术的清誉，不该被绑上商业的赌桌。\n\n这份克制不挣快钱，却让你睡得踏实——有些东西,一旦标价就再也赎不回来。"; } }
  ]
});

/* C. 被资本异化：求真的本能撞上灌概念、修数据的潜规则 */
EVENTS.push({
  id: "ev_vt_acad_coopt", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && has(s, "phd_founder") && s.startup.weeksRun >= 8,
  title: "📊 董事会让你把数据『修得好看点』",
  text: (s) => "季度董事会上,几个投资人轮番施压:增长不够性感,下轮就难讲故事。有人话里有话:「" + vt_giant() + "当年也是先把数据『做』漂亮,再用融资补上的。关键指标,适当『调整』一下口径嘛。」\n\n"
    + "会议室里所有人都看着你。你做了一辈子学问,最深的本能就是——数据不能造假。可现在,这条刻进骨子里的底线,正被一屋子人当成『不懂变通』。",
  choices: [
    { label: "守住底线:数据这东西,我一个字都不改", effect: (s) => {
        vt_bump(s, "buzz", -6); vt_runway(s, -4); add(s, "reputation", 6); add(s, "mood", 4); flag(s, "vt_clean_founder");
        if (rnd(vt_rate(s, 0.4))) { vt_bump(s, "users", 8); vt_valAdd(s, 5000000);
          return "你当场回绝:「我可以把增长做上去,但我不会把数字编出来。」\n\n几个投资人脸色很难看,有人甚至放话要减持。可半年后,正是这份『不掺水』的真实,让一家真正懂行的机构重金押你——他们说,这年头肯说真话的创始人,比增长率更稀缺。"; }
        return "你顶住了所有压力,一个数据都没动。代价不小:这轮融资黄了,有投资人撤了,跑道又紧了几分。\n\n但走出会议室那一刻,你长舒一口气。公司可以再想办法,可一旦在数据上撒了第一个谎,你就再也不是那个你尊敬的自己了。"; } },
    { label: "睁只眼闭只眼,先把这轮融资拿下", effect: (s) => {
        vt_val(s, 1.6); vt_runway(s, 14); flag(s, "dirty_hands"); flag(s, "vt_cooked_books"); add(s, "stress", 12); add(s, "mood", -8);
        return "你沉默着没有反对,默许了团队把数据『优化』了口径。融资顺利拿下,估值冲到 " + vt_money(s.startup.valuation) + "。\n\n可签字那一刻,你感到一阵从未有过的恶心。那个曾经为一个小数点较真到凌晨的学者,今天亲手把求真的底线,踩在了脚下。这道口子一开,往后就再难合上了。"; } }
  ]
});

/* D. 低成本招揽科研人才:把师门变成研发护城河 */
EVENTS.push({
  id: "ev_vt_acad_talent", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && has(s, "phd_founder") && s.startup.team < 70,
  title: "🧑‍🔬 师弟师妹问你:招人吗?",
  text: (s) => "几个还在读博、苦于出路的师弟师妹找上门:「师兄/师姐,你们公司缺人不?跟着你干,总比在实验室给老板当廉价劳力强。」\n\n"
    + "你心头一动:这些人是最懂你那套技术的人,招进来,研发实力立刻上一个台阶——这是别的创业公司花钱都买不来的护城河。可你也清楚,把人从学术路上『挖』下海,万一公司没成,等于断了人家的前程。",
  choices: [
    { label: "组建『师门天团』,技术碾压对手", effect: (s) => {
        vt_bump(s, "team", 16); vt_bump(s, "product", 10); add(s, "stress", 4); flag(s, "vt_lab_team");
        return "你把信得过的师门班底拉进了公司。一群最懂行的人凑到一起,研发效率高得吓人,几个对手憋了半年的功能,你们一个月就啃下来了。\n\n这支『师门天团』成了公司最硬的底牌——有些壁垒,是用钱堆不出来、只能靠人攒出来的。"; } },
    { label: "只点拨方向,不忍心断人后路", effect: (s) => {
        add(s, "reputation", 4); add(s, "mood", 4); vt_bump(s, "team", 3); add(s, "network", 3);
        return "你没急着挖人,反倒劝他们:「读博的路再难也走完,下海的坑我替你们先趟。」\n\n你只在技术上点拨了他们几句。这份替后辈着想的厚道,在圈里悄悄传开,反而让更多人愿意在关键时刻拉你一把。有些人情,比眼前的人力更值钱。"; } }
  ]
});

/* E. 技术护城河 vs 巨头:被抄袭,但你有别人抄不走的东西 */
EVENTS.push({
  id: "ev_vt_acad_moat", module: "venture", ambient: true,
  cond: (s) => s.startup && s.startup.fulltime && has(s, "phd_founder") && s.startup.weeksRun >= 12,
  title: "🏰 巨头抄了你的产品,但抄不走你的脑子",
  text: (s) => vt_giant() + "上线了一款和你们几乎一模一样的产品,流量、补贴砸得铺天盖地。团队人心惶惶。\n\n"
    + "但你比谁都清楚一件事:他们抄得走界面和功能,抄不走你压箱底的核心算法/专利——那是你十几年学术积累熬出来的东西,有壁垒,也有法律护城河。这一仗,未必没得打。",
  choices: [
    { label: "亮出专利,跟巨头正面硬刚", effect: (s) => {
        if (rnd(vt_rate(s, s.startup.product / 200 + 0.35))) {
          vt_bump(s, "buzz", 16); vt_val(s, 1.7); vt_bump(s, "team", 8); bumpMomentum(s, 8); flag(s, "vt_won_giant");
          return "你拿起法律武器,把核心专利甩了出去,同时对外硬气表态:技术的事,真刀真枪比一比。\n\n舆论站到了『小而硬核』这一边,巨头的抄袭吃了官司、灰头土脸地撤了。这一战封神——估值跳到 " + vt_money(s.startup.valuation) + ",你证明了:在真正的技术壁垒面前,钱多也不一定好使。"; }
        vt_bump(s, "users", -10); vt_runway(s, -6); add(s, "stress", 14); add(s, "mood", -8);
        return "你跟巨头打起了消耗战,可对方钱多人多,补贴战烧得你跑道飞快见底,用户也被抢走一批。\n\n硬刚的代价比想象中惨烈。你守住了技术尊严,却差点把公司拖垮——这个江湖,光有真本事还不够,你还得学会怎么活下去。"; } },
    { label: "顺势把公司高价卖给巨头,套现", effect: (s) => {
        var cashout = Math.max(2000000, Math.round((s.startup.valuation || 0) * 0.4));
        add(s, "cash", cashout); flag(s, "startup_done"); flag(s, "vt_acquired"); s.startup.fulltime = false;
        add(s, "reputation", 6); add(s, "mood", 10);
        return "你想通了:与其两败俱伤,不如体面退场。你带着核心技术和团队,把公司高价卖给了" + vt_giant() + ",落袋 ¥" + cashout.toLocaleString() + "。\n\n"
          + "从学者到被巨头收购的创始人,你完成了一次漂亮的『学术变现』。口袋鼓了,人也轻松了——接下来是继续闯,还是回归你心心念念的实验室,都由你了。"; } }
  ]
});
