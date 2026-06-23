"use strict";
/* content/consumption-cars.js —— 汽车图册（买车的品牌/车型细化）
   只向已存在的全局数组 CONSUMPTION push 具体车型；统一 kind:"汽车" 作为商城分组。
   车是贬值资产：经济车 assetRate≈0.45、豪华≈0.6、超跑/收藏≈0.7。
   买任意一辆都置 has_car（与原 consumption.js 保持一致）。
   id 一律用 car_ 前缀且唯一，绝不与原文件已用的 car_ebike/car_used/car_joint/car_lux/car_sport 重复。
   另附 1 个 4S 店砍价对话事件（EVENTS.push）。 */

CONSUMPTION.push(
  /* ===================== 五菱 · 国民代步 ===================== */
  { id: "car_wuling_hongguang", name: "五菱 宏光MINIEV", emoji: "🚗", kind: "汽车", price: 38000, assetRate: 0.45, mood: 5, social: 1,
    desc: "几万块的国民神车，买菜接娃停车都方便，省下的油钱够吃好几顿。", flag: "has_car", photo: "car_wuling_hongguang", stats: { body: 1 } },
  { id: "car_wuling_xingguang", name: "五菱 星光", emoji: "🚙", kind: "汽车", price: 95000, assetRate: 0.45, mood: 6, social: 2,
    desc: "十万内的插混家轿，空间大、油耗低，过日子的踏实选择。", flag: "has_car", photo: "car_wuling_xingguang", stats: { body: 1 } },
  { id: "car_wuling_bingo", name: "五菱 缤果", emoji: "🚗", kind: "汽车", price: 68000, assetRate: 0.45, mood: 5, social: 2,
    desc: "圆润可爱的小电车，城里通勤代步刚刚好，年轻人的第一台车。", flag: "has_car", photo: "car_wuling_bingo" },

  /* ===================== 大众 · 合资主流 ===================== */
  { id: "car_vw_lavida", name: "大众 朗逸", emoji: "🚙", kind: "汽车", price: 120000, assetRate: 0.5, mood: 6, social: 3,
    desc: "街上最常见的合资家轿，省心耐开不出错，老百姓的国民选择。", flag: "has_car", photo: "car_vw_lavida", stats: { charm: 1 } },
  { id: "car_vw_passat", name: "大众 帕萨特", emoji: "🚘", kind: "汽车", price: 220000, assetRate: 0.5, mood: 7, social: 4,
    desc: "稳重大气的B级车，商务接待、丈母娘点头都体面。", flag: "has_car", photo: "car_vw_passat", stats: { charm: 1 } },
  { id: "car_vw_tiguan", name: "大众 途观L", emoji: "🚙", kind: "汽车", price: 240000, assetRate: 0.5, mood: 7, social: 4,
    desc: "皮实的合资SUV，全家出游说走就走，后备箱装得下生活。", flag: "has_car", photo: "car_vw_tiguan", stats: { charm: 1 } },

  /* ===================== 丰田/本田 · 合资口碑 ===================== */
  { id: "car_toyota_camry", name: "丰田 凯美瑞", emoji: "🚘", kind: "汽车", price: 200000, assetRate: 0.5, mood: 7, social: 4,
    desc: "开不坏的丰田，保值省油少操心，越开越觉得真香。", flag: "has_car", photo: "car_toyota_camry", stats: { charm: 1 } },
  { id: "car_toyota_prado", name: "丰田 普拉多", emoji: "🚙", kind: "汽车", price: 580000, assetRate: 0.55, mood: 9, social: 6,
    desc: "硬派越野的活化石，进藏穿沙都不怵，去哪儿都有底气。", flag: "has_car", photo: "car_toyota_prado", stats: { body: 2, charm: 1 } },
  { id: "car_honda_accord", name: "本田 雅阁", emoji: "🚘", kind: "汽车", price: 210000, assetRate: 0.5, mood: 7, social: 4,
    desc: "运动与居家兼顾的B级车，开起来有劲，养起来省心。", flag: "has_car", photo: "car_honda_accord", stats: { charm: 1 } },
  { id: "car_honda_crv", name: "本田 CR-V", emoji: "🚙", kind: "汽车", price: 190000, assetRate: 0.5, mood: 7, social: 4,
    desc: "城市SUV标杆，空间灵活油耗低，奶爸的可靠搭子。", flag: "has_car", photo: "car_honda_crv", stats: { charm: 1 } },

  /* ===================== 比亚迪 · 国民新能源 ===================== */
  { id: "car_byd_qin", name: "比亚迪 秦PLUS", emoji: "🚗", kind: "汽车", price: 110000, assetRate: 0.45, mood: 6, social: 3,
    desc: "十万级插混家轿，一箱油跑千里，绿牌还免购置税。", flag: "has_car", photo: "car_byd_qin", stats: { insight: 1 } },
  { id: "car_byd_han", name: "比亚迪 汉", emoji: "🚘", kind: "汽车", price: 230000, assetRate: 0.5, mood: 8, social: 5,
    desc: "中国品牌的旗舰轿车，零百加速凌厉，国货之光开出去有面儿。", flag: "has_car", photo: "car_byd_han", stats: { charm: 1, insight: 1 } },
  { id: "car_byd_tang", name: "比亚迪 唐", emoji: "🚙", kind: "汽车", price: 280000, assetRate: 0.5, mood: 8, social: 5,
    desc: "七座大SUV，三代同堂出行不拥挤，性能与空间双在线。", flag: "has_car", photo: "car_byd_tang", stats: { charm: 1, insight: 1 } },
  { id: "car_byd_yangwang_u8", name: "仰望 U8", emoji: "🚙", kind: "汽车", price: 1098000, assetRate: 0.6, mood: 11, social: 8,
    desc: "能原地掉头、能水上漂的百万级硬派旗舰，国产高端的天花板。", flag: "has_car", photo: "car_byd_yangwang_u8", reputation: 2, stats: { charm: 2, body: 1 } },

  /* ===================== BBA · 豪华品牌 ===================== */
  { id: "car_benz_c", name: "奔驰 C级", emoji: "🚘", kind: "汽车", price: 330000, assetRate: 0.6, mood: 9, social: 6,
    desc: "三叉星标的入门豪华轿车，内饰精致，开出去自带体面光环。", flag: "has_car", photo: "car_benz_c", reputation: 1, stats: { charm: 2 } },
  { id: "car_benz_gle", name: "奔驰 GLE", emoji: "🚙", kind: "汽车", price: 800000, assetRate: 0.6, mood: 11, social: 7,
    desc: "豪华中大型SUV，气场十足，商务家用通吃的体面之选。", flag: "has_car", photo: "car_benz_gle", reputation: 2, stats: { charm: 2 } },
  { id: "car_bmw_3", name: "宝马 3系", emoji: "🚘", kind: "汽车", price: 350000, assetRate: 0.6, mood: 9, social: 6,
    desc: "操控之王的入门门票，红绿灯起步的快感让人上瘾。", flag: "has_car", photo: "car_bmw_3", reputation: 1, stats: { charm: 2 } },
  { id: "car_bmw_x5", name: "宝马 X5", emoji: "🚙", kind: "汽车", price: 850000, assetRate: 0.6, mood: 11, social: 8,
    desc: "豪华SUV标杆，又能装又能跑，停车场里最有存在感的那辆。", flag: "has_car", photo: "car_bmw_x5", reputation: 2, stats: { charm: 2 } },
  { id: "car_audi_a6", name: "奥迪 A6L", emoji: "🚘", kind: "汽车", price: 450000, assetRate: 0.6, mood: 9, social: 6,
    desc: "低调内敛的行政轿车，灯厂工艺加身，谈生意自带几分稳重。", flag: "has_car", photo: "car_audi_a6", reputation: 1, stats: { charm: 2 } },

  /* ===================== 别克/路虎 · MPV与硬派越野 ===================== */
  { id: "car_buick_gl8", name: "别克 GL8", emoji: "🚐", kind: "汽车", price: 380000, assetRate: 0.55, mood: 9, social: 5,
    desc: "奶爸的移动客厅，二排老板座一躺，接送客户全家都舒坦。", flag: "has_car", photo: "car_buick_gl8", stats: { charm: 1, mind: 1 } },
  { id: "car_landrover_defender", name: "路虎 卫士", emoji: "🚙", kind: "汽车", price: 800000, assetRate: 0.6, mood: 10, social: 7,
    desc: "方盒子硬派越野，城里有腔调、野外有实力，去哪儿都是焦点。", flag: "has_car", photo: "car_landrover_defender", reputation: 1, stats: { body: 2, charm: 1 } },

  /* ===================== 超跑/性能 · 梦想车库 ===================== */
  { id: "car_porsche_911", name: "保时捷 911", emoji: "🏎️", kind: "汽车", price: 1500000, assetRate: 0.65, mood: 13, social: 9,
    desc: "经典青蛙眼跑车，能下赛道也能日常代步，男人的终极梦想之一。", flag: "has_car", photo: "car_porsche_911", reputation: 2, stats: { charm: 3 } },
  { id: "car_ferrari_f8", name: "法拉利 F8", emoji: "🏎️", kind: "汽车", price: 3200000, assetRate: 0.7, mood: 14, social: 10,
    desc: "跃马红一脚油门贴背感拉满，引擎声就是身份证，路人纷纷掏手机。", flag: "has_car", photo: "car_ferrari_f8", reputation: 3, stats: { charm: 3 } },
  { id: "car_lamborghini_huracan", name: "兰博基尼 Huracán", emoji: "🏎️", kind: "汽车", price: 4500000, assetRate: 0.7, mood: 15, social: 10,
    desc: "蛮牛剪刀门一开就是全场焦点，张扬的线条把存在感拉到顶。", flag: "has_car", photo: "car_lamborghini_huracan", reputation: 3, stats: { charm: 3, insight: 1 } }
);

/* ===================== 4S 店砍价 · 对话事件 ===================== */
EVENTS.push({
  id: "car_dealer_haggle", module: "money", ambient: true,
  cond: (s) => !has(s, "has_car") && s.cash >= 120000 && s.age >= 22,
  title: "🚗 4S 店里的拉锯",
  text: (s) => "销售给你递上一杯水，笑容标准：“哥/姐，这款真的没多少利润了，您今天定，我去给您申请个礼包？”",
  choices: [
    { label: "板着脸硬砍价：“隔壁店便宜两万”",
      effect: (s) => {
        const ok = rnd(0.3 + (s.stats.charm + s.stats.strategy) / 400);
        if (ok) {
          const save = pick([8000, 12000, 15000, 20000]);
          add(s, "cash", save);
          add(s, "mood", 4);
          flag(s, "car_haggle_win");
          return "你不动声色一句“不行我就走了”，销售脸色一变赶紧去找经理，最终给你抹掉了 " + save + " 元，相当于白赚一笔。";
        }
        add(s, "mood", -2);
        return "销售三言两语把你绕进“这价全国统一”的话术里，你硬是没占到便宜，还被夸“哥您真懂行”。";
      } },
    { label: "不在乎那点钱，加装潢图省心",
      effect: (s) => {
        add(s, "cash", -8000);
        add(s, "mood", 3);
        socialShift(s, 1);
        return "你大手一挥加了贴膜、脚垫和镀晶，多花了八千。销售喜笑颜开，办手续的速度肉眼可见地快了起来。";
      } },
    { label: "再考虑考虑，今天不定",
      effect: (s) => {
        add(s, "mind", 1);
        return "你婉拒了销售的“最后优惠”，回家冷静比价。冲动是魔鬼，多看两家总没错。";
      } }
  ]
});
