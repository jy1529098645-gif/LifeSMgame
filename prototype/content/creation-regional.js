"use strict";
/* =====================================================================
 * content/creation-regional.js —— 各省「专属」捏人选项（v1.0）
 * 每个省份(provinceId)都有自己独一无二的童年底色 + 青春期起步选项，
 * 取代旧的「沿海/内陆」一刀切（那套让所有沿海省、所有内陆省长一个样）。
 * 真正各地共有的（重点校/县中/技校/普通人家/暴发户…）仍走引擎的通用池。
 *
 * 每个选项：{ id, name, desc, realloc, flags? }
 *   realloc 六维【净零】重分配（+总=−总），总属性恒为 180，区别只在你点在哪。
 *   六维：body 体魄 / mind 心智 / knowledge 学识 / strategy 谋略 / charm 魅力 / insight 洞察
 *   flags 可注入特殊种子：nouveau_riche(暴富) / fallen(家道中落)
 *     / startup_seed_trade(生意苗子) / startup_seed_agri(土货生意)
 * 引擎按 draft.birthplace.provinceId 取本省选项，拼到对应步骤(childhood/youth)。
 * ===================================================================== */
var REGION_CREATION = {
  beijing: { // 京畿都 一线/核心/权贵
    childhood: [{ id: "rc_bj_yard", name: "大院耳濡目染", desc: "京畿都的大院里，进出的都是有头有脸的人。规矩、人情、谁也得罪不起，你从小看在眼里。", realloc: { insight: 9, charm: 6, strategy: 3, knowledge: -6, body: -6, mind: -6 } }],
    youth: [{ id: "rc_bj_intern", name: "托关系进大厂/部委实习", desc: "靠着饭桌上的一句话，你早早进了大厂或机关实习，见了真正的局是怎么摆的。", realloc: { strategy: 9, insight: 6, charm: 3, knowledge: -6, body: -6, mind: -6 } }]
  },
  tianjin: { // 津沽都 核心/码头/市井
    childhood: [{ id: "rc_tj_mouth", name: "码头边的贫嘴", desc: "津沽都的相声茶馆和早点摊熏出你一张利索嘴，市井人情门儿清。", realloc: { charm: 12, strategy: 3, insight: 3, knowledge: -6, body: -6, mind: -6 } }],
    youth: [{ id: "rc_tj_cargo", name: "跟船跑码头", desc: "你跟着大人押货跑港口，看懂了货物与人情怎么一趟趟流转。", realloc: { strategy: 9, body: 6, charm: 3, knowledge: -9, mind: -3, insight: -6 } }]
  },
  hebei: { // 燕赵省 重工/麦田/环都
    childhood: [{ id: "rc_he_commute", name: "环京务工家的留守", desc: "父母进京打工，你在燕赵的麦田和城里之间长大，早早学会自己扛事。", realloc: { body: 9, mind: 6, insight: 3, charm: -6, knowledge: -6, strategy: -6 } }],
    youth: [{ id: "rc_he_steelfield", name: "钢厂与麦地之间", desc: "一头是父辈的钢厂，一头是老家的麦地，你在两种活法里掂量自己的出路。", realloc: { body: 12, strategy: 3, mind: 3, knowledge: -9, charm: -6, insight: -3 } }]
  },
  shanxi: { // 并州 煤城/晋商/古城
    childhood: [{ id: "rc_sx_piaohao", name: "晋商票号的旧家风", desc: "并州老辈讲的是诚信与算盘，一笔账比天还大。你打小耳濡目染。", realloc: { strategy: 9, knowledge: 6, mind: 3, body: -6, charm: -6, insight: -6 } }],
    youth: [{ id: "rc_sx_coalcycle", name: "煤老板饭局边", desc: "你见过煤价暴涨暴跌、一夜暴富又返贫，早早懂了什么叫周期。", realloc: { insight: 9, strategy: 6, mind: 3, body: -6, charm: -6, knowledge: -6 } }]
  },
  neimeng: { // 塞北省 牧区/边陲/戈壁
    childhood: [{ id: "rc_nm_horse", name: "马背上的童年", desc: "塞北省的草场与戈壁长风里，你放牧、套马，身板和胆子都野。", realloc: { body: 12, mind: 6, knowledge: -9, charm: -6, strategy: -3 } }],
    youth: [{ id: "rc_nm_grass_mine", name: "草场与矿区之间", desc: "草场退化，矿区招工，你在祖辈的牧业和眼前的饭碗间做选择。", realloc: { body: 9, strategy: 6, insight: 3, knowledge: -6, charm: -6, mind: -6 } }]
  },
  liaoning: { // 辽东省 重工/海港/老工业
    childhood: [{ id: "rc_ln_laidoff", name: "下岗潮里的家属院", desc: "辽东老工业区，父母经历过买断工龄。你很早就懂：人生是会塌方的。", realloc: { mind: 9, insight: 6, strategy: 3, knowledge: -6, charm: -6, body: -6 } }],
    youth: [{ id: "rc_ln_port", name: "港口与老厂打零工", desc: "海港装卸、老厂临时工，你尝过用体力一分一分换钱的滋味。", realloc: { body: 9, strategy: 6, mind: 3, knowledge: -9, charm: -6, insight: -3 } }]
  },
  jilin: { // 扶余省 黑土/汽车/林海
    childhood: [{ id: "rc_jl_autokid", name: "汽车城子弟", desc: "扶余省一城人围着车厂转，你从小听着发动机的轰鸣长大。", realloc: { body: 6, knowledge: 6, strategy: 6, charm: -6, insight: -3, mind: -9 } }],
    youth: [{ id: "rc_jl_leave", name: "林场太冷，想往外走", desc: "守林场太清冷，进车厂流水线太重复，你站在车站，决定往南闯。", realloc: { body: 9, mind: 6, insight: 3, knowledge: -6, charm: -6, strategy: -6 } }]
  },
  heilongjiang: { // 龙江省 冰雪/油田/边陲
    childhood: [{ id: "rc_hlj_cold", name: "冰天雪地里耐住", desc: "龙江零下三十度的冬天，教会你的第一件事就是扛和等。", realloc: { body: 9, mind: 9, knowledge: -6, charm: -6, strategy: -6 } }],
    youth: [{ id: "rc_hlj_oilfade", name: "油田子弟的迷茫", desc: "油田风光不再，年轻人纷纷南下。你也在站台上徘徊了很久。", realloc: { mind: 9, insight: 6, body: 3, knowledge: -6, charm: -6, strategy: -6 } }]
  },
  shanghai: { // 沪海都 都会/金融/洋场
    childhood: [{ id: "rc_sh_lane", name: "弄堂与摩天楼之间", desc: "沪海都精打细算的人家，规矩、体面、账算得清。你从小懂分寸。", realloc: { insight: 9, strategy: 6, charm: 3, body: -6, mind: -6, knowledge: -6 } }],
    youth: [{ id: "rc_sh_bund", name: "陆家嘴实习生", desc: "你西装革履穿梭在金融城，第一次见识钱是怎么以钱生钱的。", realloc: { strategy: 9, knowledge: 6, charm: 3, body: -6, mind: -6, insight: -6 } }]
  },
  jiangsu: { // 江南省 鱼米/园林/工商
    childhood: [{ id: "rc_js_townfactory", name: "苏南乡镇企业门口", desc: "江南的镇上家家办厂，你在车间和园林之间穿梭着长大。", realloc: { strategy: 9, knowledge: 6, insight: 3, body: -6, charm: -6, mind: -6 } }],
    youth: [{ id: "rc_js_order", name: "外贸厂里跟单", desc: "你进了乡镇外贸厂跟单，把订单、质检、交期一点点摸熟。", realloc: { strategy: 9, charm: 6, mind: 3, body: -6, knowledge: -6, insight: -6 } }]
  },
  zhejiang: { // 吴越省 民营/电商/茶乡
    childhood: [{ id: "rc_zj_pack", name: "全家网店打包到深夜", desc: "吴越人会做生意，爸妈开网店，你从小帮着打包发货、回客户消息。", realloc: { strategy: 12, charm: 3, insight: 3, knowledge: -6, body: -6, mind: -6 }, flags: ["startup_seed_trade"] }],
    youth: [{ id: "rc_zj_wholesale", name: "小商品市场第一桶金", desc: "你跑批发市场进货、摆摊，第一次尝到利润进口袋的快感。", realloc: { strategy: 9, charm: 6, body: 3, knowledge: -6, mind: -6, insight: -6 } }]
  },
  anhui: { // 淮西省 徽商/山水/外出
    childhood: [{ id: "rc_ah_leftbehind", name: "留守儿童看家", desc: "淮西父母外出打工，你和爷奶守着老屋，小小年纪就独立。", realloc: { mind: 9, body: 6, insight: 3, charm: -6, knowledge: -6, strategy: -6 } }],
    youth: [{ id: "rc_ah_followparents", name: "投奔在外打拼的父母", desc: "你早早南下投奔父母，挤进城市的出租屋，开始讨生活。", realloc: { strategy: 9, body: 6, mind: 3, knowledge: -9, charm: -6, insight: -3 } }]
  },
  fujian: { // 闽海省 侨乡/海港/宗族
    childhood: [{ id: "rc_fj_clan", name: "宗祠与侨批", desc: "闽海大宗族、海外亲戚、敢拼会赚的家风，从小给你壮胆。", realloc: { charm: 9, strategy: 6, insight: 3, knowledge: -6, mind: -6, body: -6 } }],
    youth: [{ id: "rc_fj_overseas_kin", name: "亲戚带去做生意", desc: "你跟着侨亲跑货、下南洋，早早见了世面，也学会了赊与还。", realloc: { strategy: 9, charm: 6, knowledge: 3, body: -6, mind: -6, insight: -6 }, flags: ["startup_seed_trade"] }]
  },
  jiangxi: { // 赣阳省 红土/瓷窑/老区
    childhood: [{ id: "rc_jx_kiln", name: "瓷窑边的手艺", desc: "赣阳的红土与窑火，你从小摸泥拉坯，手上有活也有耐性。", realloc: { knowledge: 6, body: 6, insight: 6, charm: -6, strategy: -6, mind: -6 } }],
    youth: [{ id: "rc_jx_north", name: "老区青年北上", desc: "革命老区出来的实诚孩子，你背着包北上，靠的是肯吃苦。", realloc: { body: 9, mind: 6, strategy: 3, knowledge: -6, charm: -6, insight: -6 } }]
  },
  shandong: { // 齐鲁省 礼数/重工/好客
    childhood: [{ id: "rc_sd_etiquette", name: "讲究礼数的大家庭", desc: "齐鲁人长幼有序、待客周到，你从小懂规矩、重情面。", realloc: { charm: 9, mind: 6, insight: 3, knowledge: -6, strategy: -6, body: -6 } }],
    youth: [{ id: "rc_sd_exam_gov", name: "考公考编的执念", desc: "全家盼你端上铁饭碗，你一头扎进行测题海，背到深夜。", realloc: { knowledge: 9, mind: 6, strategy: 3, body: -6, charm: -6, insight: -6 } }]
  },
  taiwan: { // 瀛洲省 海岛/电子/夜市
    childhood: [{ id: "rc_tw_nightmarket", name: "夜市长大的孩子", desc: "瀛洲的摊车霓虹、人情味浓，你从小嘴甜、会招呼客人。", realloc: { charm: 12, insight: 3, strategy: 3, knowledge: -6, body: -6, mind: -6 } }],
    youth: [{ id: "rc_tw_foundry", name: "电子代工链见习", desc: "你见识过精密代工的链条，懂了工艺，也懂了分工的门道。", realloc: { knowledge: 9, strategy: 6, mind: 3, body: -6, charm: -6, insight: -6 } }]
  },
  henan: { // 中州省 中原/古都/人口大省
    childhood: [{ id: "rc_henan_crowd", name: "人多地少的内卷", desc: "中州人多资源紧，兄弟姐妹一大群，你早早学会了争，也学会了让。", realloc: { mind: 9, strategy: 6, insight: 3, charm: -6, knowledge: -6, body: -6 } }],
    youth: [{ id: "rc_henan_gaokao", name: "千万考生独木桥", desc: "高考大省的卷王，你把整个青春都押在了一张卷子上。", realloc: { knowledge: 12, mind: 6, charm: -6, body: -6, strategy: -6 } }]
  },
  hubei: { // 荆楚省 通衢/江汉/码头
    childhood: [{ id: "rc_hb_hub", name: "九省通衢的码头娃", desc: "荆楚是货运枢纽，南来北往的人和事你见得多，脑子转得快。", realloc: { strategy: 9, charm: 6, insight: 3, knowledge: -6, body: -6, mind: -6 } }],
    youth: [{ id: "rc_hb_optics", name: "光谷边的大学城", desc: "你在大学城打工、蹭讲座，第一次嗅到科技和创业的气息。", realloc: { knowledge: 9, insight: 6, strategy: 3, body: -6, charm: -6, mind: -6 } }]
  },
  hunan: { // 潇湘省 丘陵/辣味/霸蛮
    childhood: [{ id: "rc_hn_spicy", name: "吃得苦，霸得蛮", desc: "潇湘人那股不服输的辣劲，从小就刻进了你的骨头里。", realloc: { body: 9, strategy: 6, mind: 3, knowledge: -6, charm: -6, insight: -6 } }],
    youth: [{ id: "rc_hn_pioneer", name: "敢为人先去闯", desc: "你不安于现状，早早出省闯荡，认准的事九头牛都拉不回。", realloc: { strategy: 9, body: 6, charm: 3, knowledge: -6, mind: -6, insight: -6 } }]
  },
  guangdong: { // 岭南道 前沿/工厂/外贸
    childhood: [{ id: "rc_gd_factory", name: "世界工厂边长大", desc: "岭南厂房连片、外贸繁忙，你见过订单怎么养活一整座城。", realloc: { strategy: 9, charm: 6, knowledge: 3, body: -6, mind: -6, insight: -6 }, flags: ["startup_seed_trade"] }],
    youth: [{ id: "rc_gd_huaqiangbei", name: "电子市场练摊", desc: "你在电子市场倒腾手机配件，第一次玩转了供应链与现金流。", realloc: { strategy: 12, knowledge: 3, charm: 3, body: -6, mind: -6, insight: -6 } }]
  },
  guangxi: { // 八桂省 喀斯特/边境/糖蔗
    childhood: [{ id: "rc_gx_border", name: "边境与甘蔗田", desc: "八桂的喀斯特山水间，边贸和甘蔗是家里的主要生计。", realloc: { body: 9, strategy: 6, insight: 3, knowledge: -6, charm: -6, mind: -6 } }],
    youth: [{ id: "rc_gx_crossborder", name: "跟着跑边境小生意", desc: "你在边境口岸倒货，看懂了汇率和人情之间的缝隙。", realloc: { strategy: 9, charm: 6, insight: 3, knowledge: -6, body: -6, mind: -6 }, flags: ["startup_seed_trade"] }]
  },
  hainan: { // 琼州岛 海岛/椰风/自贸
    childhood: [{ id: "rc_hi_island", name: "椰风海岛慢生活", desc: "琼州岛长大，性子松弛，见惯了游客来来去去。", realloc: { charm: 9, insight: 6, mind: 3, knowledge: -6, strategy: -6, body: -6 } }],
    youth: [{ id: "rc_hi_freetrade", name: "自贸港的风口", desc: "自贸概念火起来，你在免税、旅游和地产里看见了机会的影子。", realloc: { insight: 9, strategy: 6, charm: 3, knowledge: -6, body: -6, mind: -6 } }]
  },
  xianggang: { // 香江埠 金融港/国际/摩天楼
    childhood: [{ id: "rc_hk_subdivided", name: "劏房与中环之间", desc: "香江埠的繁华与逼仄你都见过——一街之隔，是两个世界。", realloc: { insight: 9, strategy: 6, charm: 3, body: -6, mind: -6, knowledge: -6 } }],
    youth: [{ id: "rc_hk_finance", name: "中环金融城实习", desc: "你在投行实习，见过最快的钱，也见过最卷的人。", realloc: { strategy: 9, knowledge: 6, charm: 3, body: -6, mind: -6, insight: -6 } }]
  },
  chongqing: { // 巴渝都 山城/火锅/码头
    childhood: [{ id: "rc_cq_hills", name: "爬坡上坎的山城娃", desc: "巴渝的棒棒、缆车与火锅，磨出你一身韧劲和爽利。", realloc: { body: 9, charm: 6, insight: 3, knowledge: -6, mind: -6, strategy: -6 } }],
    youth: [{ id: "rc_cq_jianghu", name: "码头边的江湖气", desc: "在码头与夜市的江湖里，你学会了讲义气，也学会了讲分寸。", realloc: { charm: 9, strategy: 6, body: 3, knowledge: -6, mind: -6, insight: -6 } }]
  },
  sichuan: { // 蜀中省 天府/茶馆/麻辣
    childhood: [{ id: "rc_sc_teahouse", name: "茶馆里的闲适", desc: "蜀中的盖碗茶、龙门阵，养出你会聊天、会观察的本事。", realloc: { charm: 9, insight: 6, mind: 3, knowledge: -6, body: -6, strategy: -6 } }],
    youth: [{ id: "rc_sc_restless", name: "安逸里的不安分", desc: "别人慢悠悠摆龙门阵，你却盘算着出去搏一把。", realloc: { strategy: 9, charm: 6, insight: 3, knowledge: -6, body: -6, mind: -6 } }]
  },
  guizhou: { // 黔中省 喀斯特/山地/曾经的穷
    childhood: [{ id: "rc_gz_mountain", name: "大山深处求学难", desc: "黔中喀斯特山区，上学要翻山，你格外珍惜每一本书。", realloc: { mind: 9, body: 6, knowledge: 3, charm: -6, strategy: -6, insight: -6 } }],
    youth: [{ id: "rc_gz_bigdata", name: "大数据来了", desc: "家乡突然搞起大数据园区，你第一次觉得大山里也能长出未来。", realloc: { knowledge: 9, insight: 6, strategy: 3, body: -6, charm: -6, mind: -6 } }]
  },
  yunnan: { // 滇云省 彩云之南/多民族/茶马
    childhood: [{ id: "rc_yn_multiethnic", name: "多民族村寨", desc: "滇云多民族杂居，你从小会几种方言，见过多种活法。", realloc: { charm: 9, insight: 6, body: 3, knowledge: -6, strategy: -6, mind: -6 } }],
    youth: [{ id: "rc_yn_tea", name: "茶马古道做茶生意", desc: "你跟着马帮后人贩普洱，懂了山货怎么变成现钱。", realloc: { strategy: 9, charm: 6, body: 3, knowledge: -6, mind: -6, insight: -6 }, flags: ["startup_seed_agri"] }]
  },
  xizang: { // 卫藏省 雪域/高原/虔诚
    childhood: [{ id: "rc_xz_devout", name: "雪域高原的虔诚", desc: "卫藏的转经与长路，给了你一颗别人难有的静心。", realloc: { mind: 12, insight: 6, knowledge: -6, charm: -6, strategy: -6 } }],
    youth: [{ id: "rc_xz_faithlife", name: "在信仰与现实间", desc: "你在转山的安宁与下山谋生之间，反复徘徊。", realloc: { mind: 9, insight: 9, strategy: -6, charm: -3, body: -3, knowledge: -6 } }]
  },
  shaanxi: { // 关中省 古都/黄土/面食
    childhood: [{ id: "rc_sn_ancient", name: "古都黄土厚载", desc: "关中是十三朝古都，历史与黄土养出了你的厚重与沉稳。", realloc: { knowledge: 9, insight: 6, mind: 3, body: -6, charm: -6, strategy: -6 } }],
    youth: [{ id: "rc_sn_culture", name: "城墙根下的文创", desc: "你在古城做文创、当讲解，琢磨着把历史讲成一门生意。", realloc: { charm: 9, knowledge: 6, insight: 3, body: -6, strategy: -6, mind: -6 } }]
  },
  gansu: { // 陇右省 河西走廊/丝路/旱塬
    childhood: [{ id: "rc_gs_arid", name: "旱塬上的节俭", desc: "陇右河西干旱，一滴水、一粒粮都金贵，你从小懂得省。", realloc: { body: 9, mind: 6, strategy: 3, knowledge: -6, charm: -6, insight: -6 } }],
    youth: [{ id: "rc_gs_silkroad", name: "丝路上的倒爷", desc: "你跟着跑河西、走丝路口岸，倒腾瓜果与百货，赚的是脚力钱。", realloc: { strategy: 9, charm: 6, body: 3, knowledge: -6, mind: -6, insight: -6 }, flags: ["startup_seed_trade"] }]
  },
  qinghai: { // 青唐省 高原湖/盐湖/源头
    childhood: [{ id: "rc_qh_source", name: "江河源头的清苦", desc: "青唐高原湖畔、三江之源，地广人稀，你自小耐得住寂寞。", realloc: { body: 9, mind: 6, insight: 3, charm: -6, knowledge: -6, strategy: -6 } }],
    youth: [{ id: "rc_qh_saltlake", name: "盐湖与生态饭", desc: "盐湖资源与生态旅游兴起，你盘算着怎么沾上这波光。", realloc: { insight: 9, strategy: 6, body: 3, knowledge: -6, charm: -6, mind: -6 } }]
  },
  ningxia: { // 朔方省 塞上江南/黄河灌区/枸杞
    childhood: [{ id: "rc_nx_irrigation", name: "黄河灌区的农家", desc: "朔方塞上江南、枸杞红遍，你在灌区的农忙里长大。", realloc: { body: 9, strategy: 6, mind: 3, knowledge: -6, charm: -6, insight: -6 } }],
    youth: [{ id: "rc_nx_goji", name: "把枸杞卖上网", desc: "你给家乡枸杞拍视频、开网店，硬是把土货做成了网红。", realloc: { strategy: 9, charm: 6, insight: 3, knowledge: -6, body: -6, mind: -6 }, flags: ["startup_seed_agri"] }]
  },
  xinjiang: { // 西陲省 绿洲/瓜果/辽阔
    childhood: [{ id: "rc_xj_oasis", name: "绿洲瓜果香", desc: "西陲戈壁绿洲、瓜果飘香，辽阔的天地养出你的大气与好客。", realloc: { charm: 9, body: 6, insight: 3, knowledge: -6, mind: -6, strategy: -6 } }],
    youth: [{ id: "rc_xj_melon", name: "瓜果与口岸生意", desc: "你跟着把哈密瓜、葡萄干外销，还跑过中亚口岸。", realloc: { strategy: 9, charm: 6, body: 3, knowledge: -6, mind: -6, insight: -6 }, flags: ["startup_seed_trade"] }]
  }
};
if (typeof window !== "undefined") window.REGION_CREATION = REGION_CREATION;
