"use strict";
/* ==================================================================
 * content/events-weather.js
 * 气候联动事件 —— 把每日天气织进人生。
 * 引擎每周把本周 7 天的天气 id 收进 s.weekWx（长度 7 的数组），
 * 这里的事件 module:"weather"、ambient:true，cond 读 s.weekWx 判断
 * 本周是否出现过某种天气，再据此降下与天气强相关的剧情与后果。
 *
 * 只 EVENTS.push。事件 id 前缀 ev_wx_，内部辅助函数前缀 wx_。
 * 可用全局：add / flag / has / pick / rnd / byClass / classTier /
 *           socialShift / bumpMomentum。
 * ================================================================== */

/* —— 内部辅助：本周是否出现过某天气 —— */
function wx_has(s, id){ return !!(s.weekWx && s.weekWx.indexOf(id) >= 0); }
/* —— 本周某天气出现的天数（用于「连续 / 频繁」判定） —— */
function wx_count(s, id){
  if (!s.weekWx) return 0;
  var c = 0;
  for (var i = 0; i < s.weekWx.length; i++) if (s.weekWx[i] === id) c++;
  return c;
}
/* —— 是否身处对应地域（读出生地 tags） —— */
function wx_region(s, list){
  var tags = (s && s.birthplace && s.birthplace.origin && s.birthplace.origin.tags) || [];
  for (var i = 0; i < list.length; i++) if (tags.indexOf(list[i]) >= 0) return true;
  return false;
}

EVENTS.push(
  /* 1. 暴雨内涝 —— 被困 / 堵路 ———————————————————————————— */
  {
    id: "ev_wx_rainstorm_flood",
    module: "weather",
    ambient: true,
    cond: (s) => wx_has(s, "rainstorm") && s.age >= 12,
    title: "⛈️ 暴雨：城市看海",
    text: (s) => "一场暴雨砸下来，排水管哗哗倒灌，没过脚踝的水漫上人行道。地铁口拉起了警戒线，路上的车排成一条不动的长龙。",
    choices: [
      {
        label: "蹚水回家",
        next: (s) => ({
          text: (s) => "你卷起裤腿一脚踩进浑水，水里漂着鞋、垃圾和说不清的东西。半路一辆车飞驰而过，把你浇成了落汤鸡。",
          choices: [
            { label: "硬着头皮往前蹚", effect: (s) => { add(s, "health", -2); add(s, "stress", 3); add(s, "mood", -2); if (rnd(0.3)) { add(s, "cash", -300); return "你深一脚浅一脚蹚回了家，手机却进了水，黑屏再没亮起来。又是一笔意外开销。"; } return "你浑身湿透地到了家，热水澡冲掉一身寒气，却冲不掉那股狼狈。"; } },
            { label: "找高处避一避", effect: (s) => { add(s, "stress", 1); add(s, "insight", 1); return "你退到台阶高处，看着水位一点点退去。雨中的城市像被按了静音，你忽然有种奇异的平静。"; } }
          ]
        })
      },
      { label: "原地等雨停，叫个外卖", effect: (s) => { add(s, "cash", -60); add(s, "mood", 1); add(s, "stress", -1); return "你躲进便利店要了碗热面，看雨从瓢泼变成淅沥。有些时候，等一等比硬闯聪明。"; } }
    ]
  },

  /* 2. 暴雨黑天鹅 —— 被困电梯 / 危险 ——————————————————————— */
  {
    id: "ev_wx_rainstorm_trapped",
    module: "weather",
    ambient: true,
    cond: (s) => wx_count(s, "rainstorm") >= 2 && s.age >= 16,
    title: "🌊 暴雨：被困",
    text: (s) => "连日暴雨，地下车库进水，小区一度停电。你恰好被困在了半路——前不着村后不着店，水还在涨。",
    choices: [
      { label: "报警求助，等待救援", effect: (s) => { add(s, "stress", 4); if (rnd(0.85)) { add(s, "network", 1); add(s, "mood", -1); return "救援的橡皮艇把你接了出来，浑身发抖却保住了平安。你记下了那几个穿橙衣的人。"; } add(s, "health", -3); return "等待的几个小时格外漫长，等被救出来时你已经冻得发烧。这场雨，你记一辈子。"; } },
      { label: "自己想办法脱困", effect: (s) => { if (rnd(0.55)) { add(s, "body", 1); add(s, "insight", 1); add(s, "stress", 2); return "你冷静找到一条地势高的小路绕了出去，回头看那片汪洋，后怕得腿软。"; } add(s, "health", -4); add(s, "stress", 5); add(s, "mood", -3); return "你高估了水势，一脚踏空被急流冲倒，呛了好几口水才扒住栏杆。命是捡回来了，教训也深了。"; } }
    ]
  },

  /* 3. 台风停工停课 —— 窗户加固 ———————————————————————— */
  {
    id: "ev_wx_typhoon_landfall",
    module: "weather",
    ambient: true,
    cond: (s) => wx_has(s, "typhoon") && s.age >= 6,
    title: "🌀 台风登陆",
    text: (s) => wx_region(s, ["海港","渔港","码头","海岛","港城","海滨","侨乡","椰林","渔村","出海"])
      ? "气象台挂出红色预警，台风正面扑向你所在的海滨城市。超市的水和泡面被抢空，单位、学校全停了。"
      : "台风外围掠过，狂风裹着横雨抽打着窗户。停工停课的通知发下来，整座城都猫在了家里。",
    choices: [
      {
        label: "加固门窗，囤好物资",
        next: (s) => ({
          text: (s) => "你用胶带在玻璃上贴出米字格，搬来沙袋堵住门缝，又囤了几天的水和吃食。风在外面嚎得像有人在哭。",
          choices: [
            { label: "守着家平安过境", effect: (s) => { add(s, "stress", 2); add(s, "insight", 1); add(s, "mood", -1); return "台风过境一夜，天亮时满地断枝残叶，你家却安然无恙。准备充分的踏实，此刻最值钱。"; } },
            { label: "趁停工补个觉、看场电影", effect: (s) => { add(s, "mood", 2); add(s, "stress", -2); return "外面天翻地覆，你裹着被子刷完一整部剧。这种被天气强制按下的暂停键，竟有点奢侈的快乐。"; } }
          ]
        })
      },
      { label: "不信邪，照样出门", effect: (s) => { if (rnd(0.4)) { add(s, "health", -4); add(s, "stress", 4); add(s, "mood", -3); return "你刚出门就被一块飞来的招牌擦伤，狂风差点把你掀翻。你灰头土脸地逃回家，再不敢小看台风。"; } add(s, "stress", 2); add(s, "insight", -1); return "你顶着风雨办完了事，万幸没出意外。回头想想，刚才但凡有块东西砸下来……"; } }
    ]
  },

  /* 4. 高温酷暑 —— 中暑 / 电费爆表 / 空调续命 ———————————————— */
  {
    id: "ev_wx_heatwave",
    module: "weather",
    ambient: true,
    cond: (s) => wx_count(s, "heatwave") >= 2 && s.age >= 8,
    title: "🥵 高温：空调续命",
    text: (s) => byClass(s, {
      poor: "连着多日四十度高温，柏油路烫得能煎蛋。舍不得开空调的你，守着一台老风扇，汗一层接一层地往下淌。",
      mid: "热浪一波接一波，地铁口的热风扑面而来。家里空调从早开到晚，你已经预感到这个月的电费要破纪录。",
      rich: "外头四十度，你窝在恒温的房间里，唯一的烦恼是要不要为车库再添一台备用空调。高温把世界明明白白分成了两半。"
    }),
    choices: [
      { label: "空调续命，电费认了", effect: (s) => { var fee = 200 + classTier(s) * 120; add(s, "cash", -fee); add(s, "mood", 1); add(s, "stress", -1); return "你把空调调到最舒服的温度，凉意裹住全身。月底账单确实肉疼，但这条命是空调给的，值。"; } },
      { label: "硬扛，能省一点是一点", effect: (s) => { if (rnd(0.4)) { add(s, "health", -3); add(s, "stress", 3); add(s, "mood", -2); return "省是省下了，可你中午顶着日头出门，眼前一黑差点中暑。被路人扶进便利店灌了瓶藿香正气水，才缓过来。"; } add(s, "cash", 60); add(s, "body", 1); return "你靠一条凉席、几个西瓜和无数瓶冰水熬了过去。省下的电费不多，但你硬是没向高温低头。"; } }
    ]
  },

  /* 5. 雾霾 —— 健康受损 / 口罩抢购 ——————————————————————— */
  {
    id: "ev_wx_smog",
    module: "weather",
    ambient: true,
    cond: (s) => wx_count(s, "smog") >= 2 && s.age >= 6,
    title: "🌫️ 雾霾锁城",
    text: (s) => "灰黄的雾霾连着好几天罩住城市，太阳成了一个模糊的光斑。空气里有股呛人的味道，朋友圈全是爆表的 AQI 截图。",
    choices: [
      {
        label: "戴口罩 + 买空气净化器",
        next: (s) => ({
          text: (s) => "你抢在涨价前囤了一盒 N95，又咬牙下单了台净化器。屏幕上的数字慢慢从红变绿，你才敢深呼吸。",
          choices: [
            { label: "认真防护，少出门", effect: (s) => { add(s, "cash", -800); add(s, "health", 1); add(s, "stress", -1); return "净化器嗡嗡转着，屋里像个清新的孤岛。钱花得不算少，但呼吸顺畅这件事，没法将就。"; } },
            { label: "顺手做点防霾生意", effect: (s) => { if (rnd(0.45)) { add(s, "cash", 1500); add(s, "strategy", 1); add(s, "network", 1); return "你发现口罩和净化器一货难求，转手倒腾了一批，竟小赚了一笔。时代的灰落在别人头上是病，落在你手里成了机会。"; } add(s, "cash", -400); return "你想趁机囤货倒卖，结果雾霾两天就散了，一批口罩砸在手里。投机也是要看天的。"; } }
          ]
        })
      },
      { label: "不当回事，照常生活", effect: (s) => { add(s, "health", -3); add(s, "mood", -1); if (rnd(0.4)) { add(s, "health", -2); add(s, "cash", -200); return "几天霾吸下来，你嗓子发痒、咳个不停，最后还是去医院开了药。省下的口罩钱，全交给了诊室。"; } return "你照常进出，只是常觉得胸口闷、嗓子干。这些看不见的伤，要很久以后才算账。"; } }
    ]
  },

  /* 6. 大雪 —— 赏雪 / 路滑摔伤 / 暖气 —————————————————————— */
  {
    id: "ev_wx_snowstorm",
    module: "weather",
    ambient: true,
    cond: (s) => wx_has(s, "snowstorm") && s.age >= 5,
    title: "❄️ 大雪封城",
    text: (s) => "一夜大雪，世界白得晃眼。屋檐挂起冰棱，马路被踩成了滑溜溜的镜面，孩子们的笑声在雪地里炸开。",
    choices: [
      {
        label: "出门赏雪 / 打雪仗",
        next: (s) => ({
          text: (s) => "你踩着咯吱作响的雪走进这片白茫茫，呵气成霜。要不要再疯一点？",
          choices: [
            { label: "尽情撒欢堆雪人", effect: (s) => { add(s, "mood", 3); add(s, "stress", -2); add(s, "body", 1); return "你滚出个歪歪扭扭的雪人，笑得像个孩子。冷是真冷，可这份纯粹的快乐，一年也没几回。"; } },
            { label: "走太急，脚下一滑", effect: (s) => { if (rnd(0.5)) { add(s, "health", -3); add(s, "stress", 2); add(s, "mood", -1); return "你在镜面似的路上重重摔了一跤，尾椎钻心地疼，好几天坐都坐不稳。雪景虽美，路还是得慢慢走。"; } add(s, "mood", 1); add(s, "body", 1); return "千钧一发你稳住了身形，惊出一身冷汗反倒笑出了声。下次，得穿防滑的鞋。"; } }
          ]
        })
      },
      { label: "猫在家，开足暖气", effect: (s) => { var fee = 100 + classTier(s) * 80; add(s, "cash", -fee); add(s, "mood", 1); add(s, "stress", -1); return wx_region(s, ["冰雪","塞北","苦寒","高寒"]) ? "屋里暖气烘得人犯困，窗上结着冰花。北方的冬天，屋外冰天雪地、屋内温暖如春，是种割裂的幸福。" : "你裹紧被子、开足取暖器看雪。南方没有暖气的冬天，全靠这点电费撑着体面。"; } }
    ]
  },

  /* 7. 寒潮 —— 取暖 / 感冒 ————————————————————————————— */
  {
    id: "ev_wx_coldwave",
    module: "weather",
    ambient: true,
    cond: (s) => wx_has(s, "coldwave") && s.age >= 4,
    title: "🥶 寒潮来袭",
    text: (s) => "一股强寒潮断崖式降温，一夜之间气温跌了十几度。北风灌进每条缝隙，路上的人都缩着脖子小跑。",
    choices: [
      { label: "添衣保暖，姜茶热水伺候", effect: (s) => { add(s, "cash", -120); add(s, "health", 1); add(s, "mood", 1); return "你翻出最厚的羽绒服，灌下一杯热姜茶。把自己裹成球，寒潮再凶也奈何不了你。"; } },
      { label: "要风度不要温度", effect: (s) => { if (rnd(0.6)) { add(s, "health", -3); add(s, "stress", 2); add(s, "cash", -150); return "单薄的你扛不住断崖降温，第二天就发烧流涕，请假吃药躺了好几天。风度的代价，是一盒感冒药。"; } add(s, "charm", 1); add(s, "body", 1); return "你硬是穿得体面挺了过去，没病没灾。底子好，是真能任性。"; } }
    ]
  },

  /* 8. 回南天 —— 发霉 / 除湿 —————————————————————————— */
  {
    id: "ev_wx_humidback",
    module: "weather",
    ambient: true,
    cond: (s) => wx_has(s, "humidback") && s.age >= 10 && wx_region(s, ["岭南","水乡","海港","港城","侨乡","椰林","热带"]),
    title: "💧 回南天：墙壁流泪",
    text: (s) => "回南天来了，墙壁地板全在冒水珠，镜子糊成一片，晾了三天的衣服还是潮的。柜子角落，已经隐隐有了霉斑。",
    choices: [
      { label: "买除湿机 + 抽湿盒大作战", effect: (s) => { add(s, "cash", -600); add(s, "mood", 1); add(s, "stress", -1); return "除湿机一天能抽出大半桶水，你看着水箱满了又倒，竟有种奇异的解压感。屋里总算干爽了些。"; } },
      { label: "听天由命，等天放晴", effect: (s) => { add(s, "mood", -2); add(s, "stress", 1); if (rnd(0.5)) { add(s, "cash", -300); add(s, "health", -1); return "你懒得管，结果衣柜里几件衣服、墙角的皮鞋全长了霉，扔了一批。潮气这东西，不治它就治你。"; } return "你硬扛到了天晴，屋里那股霉味散了好几天才走。南方的春天，是要交「潮湿税」的。"; } }
    ]
  },

  /* 9. 沙尘暴 —————————————————————————————————————— */
  {
    id: "ev_wx_sandstorm",
    module: "weather",
    ambient: true,
    cond: (s) => wx_has(s, "sandstorm") && s.age >= 6,
    title: "🌪️ 沙尘暴：天昏地暗",
    text: (s) => "黄沙铺天盖地卷来，天色昏黄如末日，太阳成了一轮诡异的红。张嘴就是一口土，对面的楼都成了模糊的影子。",
    choices: [
      { label: "紧闭门窗，戴好口罩面巾", effect: (s) => { add(s, "stress", 1); add(s, "insight", 1); return "你把门窗封得严严实实，蒙上面巾才敢出门取个快递。风过之后，窗台积了厚厚一层沙，扫都扫不尽。"; } },
      { label: "顶着沙出门办事", effect: (s) => { add(s, "health", -3); add(s, "mood", -2); add(s, "stress", 2); if (rnd(0.4)) { add(s, "health", -1); return "你在漫天黄沙里跌跌撞撞，眼睛被迷得直流泪，回来嗓子里全是沙砾的涩。这种天，真不该逞强。"; } return "你裹紧衣领冲进沙尘，事是办成了，可灌了满身满脸的土，洗了三遍才干净。"; } }
    ]
  },

  /* 10. 连阴雨 —— 情绪低落 ———————————————————————————— */
  {
    id: "ev_wx_longrain_blue",
    module: "weather",
    ambient: true,
    cond: (s) => wx_count(s, "longrain") >= 2 && s.age >= 12,
    title: "🌧️ 连阴雨：心也潮了",
    text: (s) => "雨连下了好些天，天总是灰蒙蒙的，被子带着挥不去的潮气。不知怎么，整个人也跟着提不起劲，做什么都懒洋洋的。",
    choices: [
      { label: "顺着情绪，给自己放个空", effect: (s) => { add(s, "mood", 1); add(s, "stress", -2); return "你点上暖灯，泡杯热茶，听着雨声读了本闲书。坏天气也能是个借口——名正言顺地，什么都不做。"; } },
      { label: "强迫自己动起来", effect: (s) => { if (rnd(0.6)) { add(s, "mood", 2); add(s, "body", 1); add(s, "stress", -1); return "你冒雨去健身房出了身汗，回来时阴郁竟散了大半。原来对付坏天气最好的办法，是不被它牵着走。"; } add(s, "stress", 2); add(s, "mood", -1); return "你逼自己出门，结果淋了雨、办砸了事，回来更丧了。有些日子，硬撑不如认了。"; } }
    ]
  },

  /* 11. 秋高气爽 —— 出游 / 约会 —————————————————————————— */
  {
    id: "ev_wx_crispautumn",
    module: "weather",
    ambient: true,
    cond: (s) => wx_has(s, "crispautumn") && s.age >= 10,
    title: "🍁 秋高气爽：正是出门时",
    text: (s) => "天高云淡，凉风不燥不冷，正是一年里最舒服的几天。窗外的银杏黄得正好，你怎么也坐不住了。",
    choices: [
      {
        label: "约人出游 / 爬山看红叶",
        next: (s) => ({
          text: (s) => "你招呼上三五好友（或那个让你心动的人），背上包就出发。山路上红叶铺地，阳光暖得刚刚好。",
          choices: [
            { label: "尽兴而归", effect: (s) => { add(s, "mood", 3); add(s, "stress", -3); add(s, "network", 2); add(s, "body", 1); return "一天走下来腿是酸的，心却是满的。好天气、好风景、好人，凑齐了就是一段会被反复想起的日子。"; } },
            { label: "顺势表白 / 加深感情", effect: (s) => { if (rnd(0.55)) { add(s, "mood", 4); add(s, "charm", 1); socialShift(s, 3); return "红叶纷飞里你说出了藏了很久的话，对方笑着点了头。有些话，就得挑这样的好天气说。"; } add(s, "mood", -2); add(s, "stress", 1); return "你鼓起勇气开了口，对方却愣住了，气氛一时尴尬。再好的天气，也兜不住没说对的话。"; } }
          ]
        })
      },
      { label: "在家窝着，浪费了好天", effect: (s) => { add(s, "mood", -1); add(s, "insight", 1); return "你刷着手机过完了这难得的一天，傍晚才想起没出门。这么好的秋天，竟就这样溜走了，有点可惜。"; } }
    ]
  },

  /* 12. 春暖花开 —— 心动 / 踏青 ——————————————————————————— */
  {
    id: "ev_wx_springbloom",
    module: "weather",
    ambient: true,
    cond: (s) => wx_has(s, "springbloom") && s.age >= 12,
    title: "🌸 春暖花开：万物萌动",
    text: (s) => "草长莺飞，柳枝抽芽，空气里都是要发生点什么的味道。阳光晒在身上暖洋洋的，连心跳都好像快了半拍。",
    choices: [
      {
        label: "踏青去，赴一场春天的约",
        next: (s) => ({
          text: (s) => "你换上轻便的衣裳走进春色里，花瓣随风落了一肩。前方的小路上，似乎也有别人正向你走来。",
          choices: [
            { label: "随心放空，享受当下", effect: (s) => { add(s, "mood", 3); add(s, "stress", -2); add(s, "charm", 1); return "你在花树下坐了整个下午，什么也没想。这样的春日不必有意义，舒展本身就够了。"; } },
            { label: "心动了，主动认识新朋友", effect: (s) => { if (rnd(0.5)) { add(s, "network", 2); add(s, "charm", 1); add(s, "mood", 2); socialShift(s, 2); return "你鼓起勇气搭了句话，竟聊得意外投缘，加了联系方式。春天的心动，有时真能开花结果。"; } add(s, "mood", 1); add(s, "insight", 1); return "你试着搭话却没接上，对方礼貌地走开了。没关系，春天里的那点悸动，本身就值得。"; } }
          ]
        })
      },
      { label: "春困缠身，只想睡觉", effect: (s) => { add(s, "mood", 1); add(s, "stress", -1); add(s, "body", -1); return "好天气也敌不过春困，你窝在沙发上昏睡了大半天。醒来日头已斜，懒洋洋的，倒也舒服。"; } }
    ]
  },

  /* 13. 雷击 —— 极端黑天鹅 ——————————————————————————————— */
  {
    id: "ev_wx_lightning_strike",
    module: "weather",
    ambient: true,
    cond: (s) => (wx_has(s, "thunderstorm") || wx_count(s, "rainstorm") >= 2) && s.age >= 14 && rnd(0.5),
    title: "⚡ 雷暴：惊魂一刻",
    text: (s) => "雷暴大作，一道惨白的闪电劈下，紧接着是震耳欲聋的炸雷——就在离你不远的地方。空气里弥漫起一股焦糊味。",
    choices: [
      { label: "赶紧避雷，远离窗户和大树", effect: (s) => { add(s, "stress", 2); add(s, "insight", 1); return "你想起常识，立刻躲进室内、拔了电器插头。雷声一阵紧过一阵，你庆幸自己没在树下逞强。"; } },
      { label: "围观这场天威", effect: (s) => { if (rnd(0.2)) { add(s, "health", -5); add(s, "stress", 5); add(s, "mood", -3); add(s, "cash", -500); return "你站在窗边看闪电，一记落雷击中了楼外的变压器，火花四溅、全楼跳闸，你的电器被冲坏了好几样。隔着玻璃都觉得后背发麻。"; } add(s, "mood", 1); add(s, "insight", 1); return "你看着闪电把夜空撕成碎片，惊心动魄。大自然偶尔露出的獠牙，让人敬畏。"; } }
    ]
  },

  /* 14. 大风 —— 招牌坠物 / 风里赶路 ————————————————————————— */
  {
    id: "ev_wx_gale",
    module: "weather",
    ambient: true,
    cond: (s) => wx_has(s, "gale") && s.age >= 8,
    title: "🌬️ 大风：寸步难行",
    text: (s) => "狂风大作，招牌哗啦啦响，路边的树被吹得东倒西歪。逆风走一步退半步，连呼吸都被风灌得发噎。",
    choices: [
      { label: "护好头脸，绕开高楼和广告牌", effect: (s) => { add(s, "stress", 1); add(s, "insight", 1); return "你绕远走了安全的路。身后传来一声闷响——一块招牌被吹落砸在了地上，正是你刚才若直走会经过的地方。"; } },
      { label: "顶风硬闯抄近道", effect: (s) => { if (rnd(0.35)) { add(s, "health", -2); add(s, "stress", 3); add(s, "mood", -2); return "你抄近道穿过楼群，被风卷起的杂物擦伤了胳膊，帽子也飞得没了影。近道省的那几分钟，赔得不值。"; } add(s, "body", 1); return "你顶着风一路硬闯，头发被吹成鸡窝，倒也平安到了。风里赶路的狼狈，过后回想竟有点好笑。"; } }
    ]
  }
);
