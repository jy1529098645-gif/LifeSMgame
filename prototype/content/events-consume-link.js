"use strict";
/* content/events-consume-link.js —— 「消费→玩法」联动事件
   核心理念：在「消费」页花钱买的东西不该孤立。买过车/房/宠物/高配装备，
   要在求职、创业、社交、婚恋里解锁机会、提升成败、或带来新麻烦——让钱花得有玩法回报。
   依赖既有 flag：has_car（任意车）/ has_house（房）/ has_pet（宠物）；
   配合 employed / startup / married / partner / has_kid 等剧情 flag。
   只 EVENTS.push，只用全局 helper（add/flag/has/pick/rnd/byClass/classTier/shuf/socialShift/socialBoostRole）。
   内部辅助函数前缀 buyx_，事件 id 前缀 ev_buyx_。 */

/* ---------- 内部小工具 ---------- */
function buyx_ta(s) {
  // 未婚对象昵称：优先 partnerName，否则按性别给个泛称
  return s.partnerName || (s.gender === "女" ? "他" : "她");
}
function buyx_hasPartnerUnmarried(s) {
  // 有对象但还没结婚（提亲/相亲底气类事件用）
  return has(s, "partner") && !has(s, "married");
}
function buyx_wantStartup(s) {
  // 已创业，或处于「想搞事业」的窗口（用来 gate 抵押输血类）
  return has(s, "startup") || (s.age >= 24 && s.age <= 45 && !has(s, "employed"));
}

/* ============================================================
   一、有车（has_car）
   ============================================================ */

/* 1. 跑网约车赚外快 —— 两层对白分支 */
EVENTS.push({
  id: "ev_buyx_car_ride_hailing", module: "money", ambient: true,
  cond: (s) => has(s, "has_car") && s.age >= 20 && s.age <= 60,
  title: "🚗 周末跑两单网约车",
  text: (s) => "车停在楼下也是停着。你想起隔壁老张说网约车晚高峰能跑出油钱还有富余，于是注册了司机端。第一个夜班，平台「叮」地派来一单——你深吸一口气，握紧了方向盘。",
  choices: [
    {
      label: "拼命接单，跑满一整夜",
      next: (s) => ({
        text: (s) => "凌晨两点，一位喝多的乘客上车就吐了一句：「师傅，走最近的路，别绕。」你正盘算着多接几单回本，导航却提示前方查酒驾临检。后排乘客忽然问：「师傅，要不抄条小路？我赶时间。」",
        choices: [
          {
            label: "守规矩，按导航正常走",
            effect: (s) => {
              add(s, "cash", 600); add(s, "stress", 6); add(s, "body", -1); add(s, "insight", 1);
              return "你没抄近路，老老实实排队过检。乘客嘟囔了两句，到站还是照常付了钱。一夜跑下来挣了六百多，腰酸背痛，但每一分都干净。搞钱这事，慢一点没关系，别把自己跑进沟里。";
            }
          },
          {
            label: "抄小路抢时间，多接两单",
            effect: (s) => {
              if (rnd(0.55)) {
                add(s, "cash", 1100); add(s, "stress", 9); add(s, "health", -3); add(s, "strategy", 1);
                return "你钻小巷、压点跑，一夜竟跑出一千一。回到家天都亮了，瘫在沙发上数着零钱傻笑。钱是真香，可镜子里的黑眼圈也是真的——这碗辛苦钱，吃一口就够呛。";
              }
              add(s, "cash", -800); add(s, "health", -5); add(s, "mood", -8); add(s, "reputation", -2);
              return "小路窄，一个倒车没看清剐到了路边电动车。赔钱、扯皮、误了后面的单，挣的还不够赔的。逞那点快，反把一晚白搭进去。";
            }
          }
        ]
      })
    },
    {
      label: "只顺路捎一段，不耽误正事",
      effect: (s) => {
        add(s, "cash", 220); add(s, "mood", 2); add(s, "network", 1);
        return "你只在上下班顺路时接单，权当油费补贴。挣得不多，倒认识了几个有意思的乘客，有人下车还加了你微信：「哥你聊得来，回头有活儿招呼你。」钱是小钱，人脉是真人脉。";
      }
    }
  ]
});

/* 2. 开车接送相亲/约会对象 —— 两层对白分支，gate 有对象/相亲窗口 */
EVENTS.push({
  id: "ev_buyx_car_pickup_date", module: "love", ambient: true,
  cond: (s) => has(s, "has_car") && (buyx_hasPartnerUnmarried(s) || (s.age >= 22 && s.age <= 40 && !has(s, "married"))),
  title: "🚗 雨夜，开车去接ta",
  text: (s) => {
    const ta = buyx_ta(s);
    return "天突然下起暴雨，" + ta + "在地铁口发来消息：「外面好大雨，打不到车……」你看了眼车钥匙——这正是有车的底气。十分钟后，你把车停在站口，推开副驾车门：「上来，我送你。」";
  },
  choices: [
    {
      label: "贴心准备，递上热饮和暖风",
      next: (s) => ({
        text: (s) => {
          const ta = buyx_ta(s);
          return ta + "钻进车里，你早把暖风开足、杯架上还放了杯热奶茶。" + ta + "捧着杯子，眼神软了下来：「你怎么什么都想到了……」红灯前，气氛正好，" + ta + "忽然轻声问：「以后……是不是都能这样被你接送？」";
        },
        choices: [
          {
            label: "认真接话：「想接你多久都行」",
            effect: (s) => {
              add(s, "charm", 2); add(s, "mood", 6);
              socialBoostRole(s, "对象", 12); socialBoostRole(s, "恋人", 12);
              if (buyx_hasPartnerUnmarried(s)) {
                return "你看着" + buyx_ta(s) + "认真地说出口，车窗外雨声噼啪，车里却暖得让人想停在红灯前。那一刻你们都明白，这段关系又往前走了一大步。一辆车，载的从来不只是路程。";
              }
              flag(s, "partner");
              if (!s.partnerName) s.partnerName = "ta";
              return "雨夜、暖车、一句认真的承诺，把暧昧推过了那条线。下车前" + (s.partnerName || "ta") + "没松手：「那……我们在一起吧。」有车的底气，关键时候真能接住一段缘分。";
            }
          },
          {
            label: "玩笑带过，不敢接太满",
            effect: (s) => {
              add(s, "mood", 1); add(s, "insight", 1);
              return "你笑着打了个哈哈，把那句话轻轻滑了过去。" + buyx_ta(s) + "也没再追问，只是默默把奶茶喝完。氛围是好的，可有些话错过那一刻，就要再等很久。机会和绿灯一样，亮起来就那么几秒。";
            }
          }
        ]
      })
    },
    {
      label: "默默把人送到就行",
      effect: (s) => {
        add(s, "mood", 3); socialBoostRole(s, "对象", 5); socialBoostRole(s, "恋人", 5);
        return "你没多话，稳稳把" + buyx_ta(s) + "送到楼下。下车时" + buyx_ta(s) + "回头看了你一眼：「有你真好。」雨天能被人接送，本身就是一种踏实的浪漫。";
      }
    }
  ]
});

/* 3. 自驾游回血 —— 单层 */
EVENTS.push({
  id: "ev_buyx_car_roadtrip", module: "life", ambient: true,
  cond: (s) => has(s, "has_car") && (s.stress >= 45 || s.mood <= 45),
  title: "🚗 来一场说走就走的自驾",
  text: (s) => "连日的焦头烂额压得你喘不过气。某个周五傍晚，你忽然把电脑一合，抓起车钥匙——有车的人，逃离生活只需要一脚油门。导航随手设了个海边小镇，你驶上空旷的高速，把窗户摇下一半。",
  choices: [
    {
      label: "彻底放空，开到哪算哪",
      effect: (s) => {
        add(s, "cash", -1500); add(s, "stress", -16); add(s, "mood", 12); add(s, "health", 4); add(s, "insight", 2);
        return "两天一夜，你在海边发呆、在山路飙歌、在无人加油站啃面包。回程时整个人像被重启了一遍。花的那点油钱和住宿费，买回来的是把自己从泥里捞起来的力气。这趟，值。";
      }
    },
    {
      label: "穷家富路也得省着，当天来回",
      effect: (s) => {
        add(s, "cash", -300); add(s, "stress", -7); add(s, "mood", 5); add(s, "body", -2);
        return "你当天往返，到了海边只待了俩小时就掉头。省是省了，人也累了，但海风灌进胸口的那一刻，紧绷的弦总算松了半根。有车在手，至少喘口气从不用等谁。";
      }
    }
  ]
});

/* 4. 养车成本 / 酒驾诱惑 —— 两层对白分支，负向钩子 */
EVENTS.push({
  id: "ev_buyx_car_drink_drive", module: "money", ambient: true,
  cond: (s) => has(s, "has_car") && s.age >= 21,
  title: "🚗 饭局散场，谁来开这趟车",
  text: (s) => "一场重要的饭局，气氛到了，你也喝了不少。散场时同桌的客户拍着你肩膀：「老板亲自开车送我一程呗？就十分钟，代驾还得等老半天。」你看了眼停车场里自己的车，钥匙在口袋里发烫。",
  choices: [
    {
      label: "坚决叫代驾，多等也不碰方向盘",
      next: (s) => ({
        text: (s) => "你掏出手机叫了代驾：「等等，安全第一，我可不拿驾照和命开玩笑。」客户愣了一下，反倒认真点头：「就冲你这份清醒，这单我放心交给你。」代驾来的路上，他和你又聊了几句生意。",
        choices: [
          {
            label: "趁机把合作的事敲定",
            effect: (s) => {
              add(s, "cash", -60); add(s, "network", 4); add(s, "reputation", 4); add(s, "strategy", 1);
              if (rnd(0.5)) { add(s, "cash", 5000); return "代驾车上十分钟，你把项目细节理顺，客户当场拍板预付了一笔定金。一次「不逞强」的选择，换来了信任，也换来了真金白银。守规矩，有时候才是最划算的搞钱姿势。"; }
              return "你没急着谈钱，只把人妥帖送到。客户下车前说：「靠谱的人，我记住了。」生意没立刻成，但这份印象，迟早会变现。";
            }
          },
          {
            label: "只聊感情，不提生意",
            effect: (s) => {
              add(s, "cash", -60); add(s, "network", 3); add(s, "mood", 3);
              return "你只陪客户唠家常，半句不提合作。他临下车感慨：「难得遇到不功利的。」代驾费花得不冤——养车是有成本，可清醒这件事，从来不亏。";
            }
          }
        ]
      })
    },
    {
      label: "就十分钟，自己开过去",
      effect: (s) => {
        if (rnd(0.6)) {
          add(s, "cash", -20000); add(s, "mood", -20); add(s, "reputation", -15); add(s, "stress", 20); add(s, "health", -3);
          flag(s, "drunk_driving_record");
          return "刚出停车场就撞上临检。酒精测试仪一响，全完了——拘留、吊证、巨额罚款，名声一夜扫地。客户避之不及，那笔生意自然黄了。一时的「就十分钟」，赔上的是几年都补不回的窟窿。";
        }
        add(s, "mood", -4); add(s, "stress", 10); add(s, "insight", 2);
        return "你心惊胆战地把客户送到，一路上每个红灯都像在审判你。平安到家后你后怕得手心冒汗：这种侥幸，赌一次就够了，下次说什么也不能再碰。";
      }
    }
  ]
});

/* ============================================================
   二、有房（has_house）
   ============================================================ */

/* 5. 有房提亲，丈母娘点头 —— 两层对白分支，gate 有对象未婚 */
EVENTS.push({
  id: "ev_buyx_house_proposal", module: "love", ambient: true,
  cond: (s) => has(s, "has_house") && buyx_hasPartnerUnmarried(s) && s.age >= 23,
  title: "🏠 带着房本去见家长",
  text: (s) => {
    const ta = buyx_ta(s);
    return "和" + ta + "感情稳定，到了见家长谈婚论嫁的关口。" + (s.gender === "女" ? "婆婆" : "丈母娘") + "开门见山：「房子的事，你们打算怎么办？」你不慌不忙——这正是名下那套房派上用场的时候。你把房本轻轻放上茶几。";
  },
  choices: [
    {
      label: "坦诚相告：房子已备好，给ta一个家",
      next: (s) => ({
        text: (s) => {
          const elder = s.gender === "女" ? "婆婆" : "丈母娘";
          return elder + "拿起房本看了又看，神色明显缓和：「有套房，日子就有个落脚的地方。」可话锋一转又问：「房本上……写谁的名字？」饭桌一下安静了，" + buyx_ta(s) + "也偷偷看向你。";
        },
        choices: [
          {
            label: "大方加上ta的名字",
            effect: (s) => {
              add(s, "cash", -2000); add(s, "charm", 1); add(s, "mood", 6); add(s, "reputation", 3);
              socialBoostRole(s, "对象", 15); socialBoostRole(s, "恋人", 15);
              socialBoostRole(s, "丈母娘", 18); socialBoostRole(s, "婆婆", 18);
              if (rnd(0.85)) {
                if (typeof familyMarry === "function") familyMarry(s); else flag(s, "married");
                return "你说「成家了房子就是两个人的」，当场答应加名。长辈眉开眼笑，亲事就这么定了。一套房，给的不只是遮风挡雨，更是诚意。喜事将近，你心里踏实。";
              }
              return "你答应加名，长辈很满意，只说再选个好日子办事。这份大方，把婚事推到了门口。有房有诚意，丈母娘那关，过了。";
            }
          },
          {
            label: "委婉守住底线：婚后再议",
            effect: (s) => {
              add(s, "strategy", 1); add(s, "stress", 6);
              socialBoostRole(s, "丈母娘", -4); socialBoostRole(s, "婆婆", -4);
              if (rnd(0.6)) {
                socialBoostRole(s, "对象", 4);
                return "你诚恳解释「先把日子过起来，名字的事不急」。长辈脸色有点僵，但" + buyx_ta(s) + "帮你说了话，事情暂时压了下来。有房是硬底气，可分寸拿捏不好，也容易添堵。";
              }
              add(s, "mood", -8); socialBoostRole(s, "对象", -6);
              return "你这一守，长辈当场就沉了脸：「连个名字都舍不得，诚意在哪？」" + buyx_ta(s) + "夹在中间为难。房子是有了，可这顿饭，吃得人人不痛快。";
            }
          }
        ]
      })
    },
    {
      label: "不卑不亢：房是基础，人才是根本",
      effect: (s) => {
        add(s, "charm", 2); add(s, "reputation", 2); add(s, "mood", 4);
        socialBoostRole(s, "丈母娘", 8); socialBoostRole(s, "婆婆", 8); socialBoostRole(s, "对象", 6);
        return "你没炫房，只说「房子我备着了，但我更想让" + buyx_ta(s) + "嫁的是我这个人」。长辈听完点了头：「这话在理。」有房垫底，再加这份清醒，婚事的天平稳稳偏向了你。";
      }
    }
  ]
});

/* 6. 房产抵押给创业输血 —— 两层对白分支，高风险，gate 想创业 */
EVENTS.push({
  id: "ev_buyx_house_mortgage_startup", module: "money", ambient: true,
  cond: (s) => has(s, "has_house") && buyx_wantStartup(s) && s.cash < 50000 && s.age >= 24,
  title: "🏠 把房子抵押了，给项目续命",
  text: (s) => "项目正卡在最缺钱的节骨眼上，账上快见底了。银行客户经理告诉你：名下这套房可以做抵押经营贷，能批出一大笔。你盯着那份合同——这是有房的人才有的弹药，可一旦项目崩了，连家都得搭进去。",
  choices: [
    {
      label: "押上！搏一个翻盘",
      next: (s) => ({
        text: (s) => "钱到账那天，你看着账户里多出的几十万，手是抖的。合伙人兴奋地说：「有这笔钱，咱们能把那条新产线开起来！」可你心里清楚，这是用自己睡觉的地方在赌明天。要不要全砸进去？",
        choices: [
          {
            label: "全力押注新方向，All in",
            effect: (s) => {
              add(s, "cash", 400000); add(s, "stress", 22);
              const p = 0.4 + (s.stats.strategy + s.stats.insight) / 320;
              if (rnd(p)) {
                add(s, "cash", 600000); add(s, "reputation", 8); add(s, "strategy", 2); flag(s, "startup");
                return "这一押，押对了。新产线打开了局面，订单接踵而至，你不仅还清了抵押贷，还赚出了第一桶真金。房子赎回来那天，你站在自家阳台上，长出一口气——赌赢了，也吓出一身冷汗。";
              }
              add(s, "cash", -500000); add(s, "cash", -100000); add(s, "mood", -22); add(s, "stress", 25); add(s, "reputation", -8);
              return "市场没给你机会，钱烧光了，项目黄了。抵押贷的窟窿压顶，房子面临被收的风险。你坐在空荡荡的办公室里，第一次尝到「连退路都赌没了」的滋味。搞钱有命，杠杆这把刀，伤起人来不眨眼。";
            }
          },
          {
            label: "留一半现金垫底，稳着来",
            effect: (s) => {
              add(s, "cash", 200000); add(s, "stress", 12); add(s, "strategy", 2);
              const p = 0.5 + s.stats.strategy / 300;
              if (rnd(p)) {
                add(s, "cash", 220000); add(s, "reputation", 4); flag(s, "startup");
                return "你只投了一半，给自己留了条命。项目稳步回暖，现金流没断过。虽没暴富，但还得起贷、守得住房。该激进时激进，该兜底时兜底——活下来的，往往是会算账的那个。";
              }
              add(s, "cash", -120000); add(s, "cash", -20000); add(s, "mood", -10); add(s, "stress", 10);
              return "项目还是没起来，但因为你留了底牌，损失没到伤筋动骨。慢慢把贷还上，房子保住了。输得起，才能再有下一局。";
            }
          }
        ]
      })
    },
    {
      label: "不抵押，砸锅卖铁也守住房子",
      effect: (s) => {
        add(s, "stress", 8); add(s, "insight", 2); add(s, "mood", -3);
        return "你撕了合同：「房子是底线，不能赌。」项目因此放缓，错过了一些机会，但你睡得着觉。家在，人就还有重来一次的本钱。有些杠杆，加上去就再也下不来。";
      }
    }
  ]
});

/* 7. 出租收租 —— 被动现金，单层 */
EVENTS.push({
  id: "ev_buyx_house_rent_income", module: "money", ambient: true,
  cond: (s) => has(s, "has_house") && s.age >= 22,
  title: "🏠 把空房子租出去",
  text: (s) => "名下的房子空着也是空着。你挂上租房平台，没两天就来了看房的租客。一对小情侣很满意，当场就想签约：「房东，能签长租吗？我们想稳定住下来。」每月的租金，等于躺着多一份现金流。",
  choices: [
    {
      label: "签长租，图个省心稳定",
      effect: (s) => {
        add(s, "cash", 18000); add(s, "mood", 2); add(s, "insight", 1);
        return "你签了一年长租，租金一次性付了大半年。从此每月不用动弹，账户都会准点多出一笔。这就是有房的甜头——资产自己会下蛋。被动收入虽不惊人，攒起来却最让人安心。";
      }
    },
    {
      label: "短租试水，赌个更高租金",
      effect: (s) => {
        if (rnd(0.55)) {
          add(s, "cash", 26000); add(s, "strategy", 1); add(s, "stress", 4);
          return "你搞起了短租，装修拍照、上架平台，旺季时一晚顶人家长租好几天。忙是忙了点，进账却更可观。会经营的房东，把一套房盘出了两份钱。";
        }
        add(s, "cash", 4000); add(s, "stress", 8); add(s, "mood", -4);
        return "短租遇上淡季，房子空了大半月，还得自己打扫维护，算下来还不如老老实实长租。折腾一圈才懂：被动收入也不是天上掉的，得有人接得住这份麻烦。";
      }
    }
  ]
});

/* 8. 学区房让孩子受益 —— 两层对白分支，gate has_kid */
EVENTS.push({
  id: "ev_buyx_house_school_district", module: "family", ambient: true,
  cond: (s) => has(s, "has_house") && has(s, "has_kid") && s.age >= 28,
  title: "🏠 凭这套房，孩子进了好学校",
  text: (s) => "片区招生开始，因为名下这套房,孩子顺顺当当划进了重点学区。开学第一天送孩子进校门，你看着崭新的教学楼，心里那点为买房咬过的牙，忽然就值了。可没几天，班主任发来消息：「家长，方便聊聊孩子的情况吗？」",
  choices: [
    {
      label: "重视教育，积极配合老师",
      next: (s) => ({
        text: (s) => "老师说孩子底子不错，但好学校竞争激烈，建议你多上点心。你这才发现，学区房只是张门票，进了门，拼的还是后头的功夫。是给孩子加码，还是顺其自然？",
        choices: [
          {
            label: "请家教、报班，全力托举",
            effect: (s) => {
              add(s, "cash", -30000); add(s, "stress", 8); add(s, "mind", 1);
              if (rnd(0.6)) {
                add(s, "mood", 6); flag(s, "kid_excellent"); add(s, "reputation", 3);
                return "一学期下来，孩子在好环境加你的投入下名列前茅，老师当众表扬。学区房打底、资源加码，孩子真的被托了起来。这笔教育的钱，砸得你心甘情愿。";
              }
              add(s, "mood", -3);
              return "你卯足了劲投入，孩子却被压得有点喘不过气，成绩起伏不定。好学校好资源也救不了揠苗助长。你开始反省：使劲的方向，也许比力气更重要。";
            }
          },
          {
            label: "不鸡娃，给孩子松快的童年",
            effect: (s) => {
              add(s, "mood", 5); add(s, "insight", 2); add(s, "stress", -4);
              return "你谢过老师，决定不给孩子加压：「好环境已经给到了，剩下的让他自己长。」孩子在重点学校里轻松又快乐，反倒愿意主动学。有房保了底，你才有这份从容。";
            }
          }
        ]
      })
    },
    {
      label: "顺其自然，环境到了就好",
      effect: (s) => {
        add(s, "mood", 3); add(s, "insight", 1);
        return "你相信环境的力量，没多干预。重点学校的氛围熏着，孩子的眼界和习惯都悄悄变好。当年掏空积蓄买的房，如今成了孩子起跑线上最实的一块垫脚石。";
      }
    }
  ]
});

/* ============================================================
   三、趁手的家伙事（高配电脑/相机等装备）
   叙述上以「你添置过高配装备」为前提，gate 在 startup||employed
   ============================================================ */

/* 9. 好工具提升接单/创业效率 —— 两层对白分支 */
EVENTS.push({
  id: "ev_buyx_gear_freelance", module: "money", ambient: true,
  cond: (s) => (has(s, "startup") || has(s, "employed")) && s.age >= 20 && s.age <= 55,
  title: "💻 趁手的家伙事，接了个大活",
  text: (s) => "你早先咬牙添置的那台高配电脑（外加趁手的相机/外设），这回派上了大用场。一个甲方找上门：「活儿急、要求高，能接吗？」普通设备根本扛不住这渲染量，可你的家伙事，刚好够格。",
  choices: [
    {
      label: "凭装备硬实力，接下高要求订单",
      next: (s) => ({
        text: (s) => "你报了个不低的价，甲方爽快应了——好设备给了你底气。可干到一半，甲方临时加需求：「能不能再快两天交？预算我可以加。」你的机器跑得动，但人得熬。接不接这单加码？",
        choices: [
          {
            label: "通宵赶工，吃下加码预算",
            effect: (s) => {
              add(s, "cash", 22000); add(s, "knowledge", 2); add(s, "strategy", 1); add(s, "health", -5); add(s, "stress", 12);
              return "你靠着强悍的设备连轴渲染、批量出图，硬是提前交了稿。甲方惊叹效率，预算加得痛快，还说「以后长期合作」。好工具不光省时间，更是接得住大单的门槛。这笔投资，回本了。";
            }
          },
          {
            label: "守住交期，不接超出能力的加码",
            effect: (s) => {
              add(s, "cash", 14000); add(s, "reputation", 4); add(s, "strategy", 2); add(s, "stress", 4);
              return "你婉拒了赶工：「按原定交期保质保量，更稳妥。」甲方虽有点遗憾，却更信你的专业。设备给了你接单的底气，分寸给了你长久的口碑。钱稳稳到手，关系也没透支。";
            }
          }
        ]
      })
    },
    {
      label: "用好设备先练手，提升手艺",
      effect: (s) => {
        add(s, "knowledge", 2); add(s, "mind", 1); add(s, "cash", 3000);
        return "你没急着接大活，先用这套家伙事啃了几个高难度的小项目，把手艺磨利。等真正的大单来时，你已经又快又稳。好工具配上练出来的本事，才是真正能持续搞钱的底盘。";
      }
    }
  ]
});

/* ============================================================
   四、奢侈品/豪车撑场面（gate classTier>=2）
   ============================================================ */

/* 10. 行头镇住客户，谈成大单 —— 两层对白分支 */
EVENTS.push({
  id: "ev_buyx_luxury_close_deal", module: "money", ambient: true,
  cond: (s) => classTier(s) >= 2 && (has(s, "startup") || has(s, "employed")) && s.age >= 26,
  title: "💼 高端饭局，行头就是谈判筹码",
  text: (s) => "一场决定大单走向的商务饭局。你换上了那身价格不菲的行头，手腕上的表、脚下的鞋，无声地替你说了话。落座时，对方那位见惯世面的老板上下打量你一眼，眼神里多了几分郑重：「看来，是位讲究人。」",
  choices: [
    {
      label: "以势压场，主动报高价",
      next: (s) => ({
        text: (s) => "酒过三巡，谈到价钱。你不动声色地报了个高价，气场全开。对方眯着眼笑了笑：「价是不便宜……不过和你这样的人合作，我放心。」他举起杯，「但你得给我个非你不可的理由。」",
        choices: [
          {
            label: "用实力+排面双管齐下",
            effect: (s) => {
              const p = 0.45 + (s.stats.charm + s.network / 4) / 200;
              add(s, "stress", 6);
              if (rnd(p)) {
                add(s, "cash", 300000); add(s, "network", 6); add(s, "reputation", 6); add(s, "charm", 1);
                return "你把案例和底气一并端上桌，排面只是敲门砖，真本事才是临门一脚。对方当场拍板，大单落定，一笔三十万的合作签了字。撑场面的钱没白花——它替你赢得了开口报高价的资格。";
              }
              add(s, "mood", -6); add(s, "reputation", -2);
              return "排面唬住了第一眼，可一深聊，对方发现你只是「行头硬、内里虚」，淡淡收了笑：「再考虑考虑吧。」单子黄了。撑场面能开门，守不住门——光鲜的壳，包不住空心的果。";
            }
          },
          {
            label: "适度让利，换长期绑定",
            effect: (s) => {
              add(s, "cash", 120000); add(s, "network", 8); add(s, "reputation", 4); add(s, "strategy", 2);
              return "你主动让了几个点，把一锤子买卖谈成了长期合作。对方很受用：「痛快人。」眼前的钱少赚些，绑定的却是源源不断的活。排面开了局，格局做大了盘。";
            }
          }
        ]
      })
    },
    {
      label: "低调谦逊，不靠行头唬人",
      effect: (s) => {
        add(s, "reputation", 5); add(s, "network", 3); add(s, "insight", 2); add(s, "cash", 80000);
        return "你穿得体面，谈起来却务实谦逊，把功劳归给团队。对方反而更欣赏：「不张扬，靠谱。」单子稳稳谈成。行头是加分项，但真正成交的，永远是让人放心的那个你。";
      }
    }
  ]
});

/* 11. 露富被盯上 —— 负向钩子，单层，gate 富裕 */
EVENTS.push({
  id: "ev_buyx_luxury_targeted", module: "life", ambient: true,
  cond: (s) => classTier(s) >= 2 && s.age >= 25,
  title: "💎 朋友圈一张照，招来不速之客",
  text: (s) => "你顺手在朋友圈晒了张新入手的奢侈品配豪车的照片，点赞如潮。可没几天，麻烦也跟着来了——好几个许久不联系的「熟人」忽然热络起来，开口不是借钱就是拉投资；甚至有陌生号码精准报出你的名字。露富的代价，悄悄递了账单。",
  choices: [
    {
      label: "断舍离：删动态，低调做人",
      effect: (s) => {
        add(s, "insight", 2); add(s, "stress", -4); add(s, "reputation", 1);
        socialShift(s, -2);
        return "你默默删了照片，把那些伸手的「熟人」一一回绝。势利的脸色不好看，但你乐得清静。闷声发财才是真本事——财不外露，麻烦自然绕道走。";
      }
    },
    {
      label: "享受被追捧，来者不拒",
      effect: (s) => {
        if (rnd(0.55)) {
          add(s, "cash", -50000); add(s, "mood", -10); add(s, "reputation", -4); add(s, "stress", 12);
          socialShift(s, 3);
          return "你享受着众星捧月，碍于面子借了钱、搭了「人情投资」。结果借出去的多半打了水漂，所谓投资也是个坑。露富招来的热闹，多半是冲着你钱包来的。这堂学费，交得肉疼。";
        }
        add(s, "network", 4); add(s, "stress", 6); add(s, "charm", 1);
        return "你在追捧里左右逢源，倒也结识了两个真有资源的人。但你心里清楚，这趟浑水深得很，稍不留神就要被人当肥羊宰。风光是风光，背后全是算计。";
      }
    }
  ]
});

/* ============================================================
   五、宠物（has_pet）
   ============================================================ */

/* 12. 遛狗社交 / 宠物疗愈 / 看病花钱 —— 两层对白分支 */
EVENTS.push({
  id: "ev_buyx_pet_walk_social", module: "life", ambient: true,
  cond: (s) => has(s, "has_pet") && s.age >= 18,
  title: "🐶 遛弯时，它替你认识了个人",
  text: (s) => "傍晚带着毛孩子下楼遛弯，它欢实地冲向另一只狗。两条狗玩到一块儿，你也顺势和对面的主人攀谈起来。对方笑着说：「你家这只真亲人。」一来二去，话越聊越投机——养宠物的人之间，总有种天然的熟络。",
  choices: [
    {
      label: "趁机多聊，看能不能结个善缘",
      next: (s) => ({
        text: (s) => "聊着聊着才发现，对方竟和你的行当沾点边。临走时" + (s.gender === "女" ? "对方" : "对方") + "递来微信：「狗子们都处熟了，咱也常约。」你心里一动——这随手的一段缘，说不定能接出点别的来。要不要再往深处走一步？",
        choices: [
          {
            label: "主动约下次，把关系做实",
            effect: (s) => {
              add(s, "network", 5); add(s, "mood", 5); add(s, "charm", 1);
              if (rnd(0.5)) {
                add(s, "cash", 6000);
                return "几次「遛狗局」下来，你和对方成了能搭把手的朋友，后来还真促成了一笔小合作。谁能想到，一条狗给你牵来的，不只是陪伴，还有实打实的人脉和机会。";
              }
              return "你们成了固定的遛狗搭子，时不时互通有无。人脉这东西，有时就是从一句「你家狗真乖」开始攒起来的。养宠的钱，意外换回了一段暖人的关系。";
            }
          },
          {
            label: "点到为止，只当寻常邻里",
            effect: (s) => {
              add(s, "mood", 3); add(s, "network", 1);
              return "你客气地收了微信，没多深聊。狗子们玩得尽兴，你也乐得轻松。不是每段缘都要变现，有时陪着毛孩子散散步，本身就够治愈了。";
            }
          }
        ]
      })
    },
    {
      label: "它最近没精神，先带去医院看看",
      effect: (s) => {
        if (rnd(0.6)) {
          add(s, "cash", -3000); add(s, "stress", 6); add(s, "mood", -4);
          return "毛孩子蔫了好几天，一查是肠胃炎，挂水加药花了三千多。你心疼钱更心疼它，守着它直到精神头回来。养宠就是这样——它给你疗愈，你给它兜底，这份花销，认了。";
        }
        add(s, "cash", -12000); add(s, "stress", 12); add(s, "mood", -10); add(s, "health", -2);
        return "情况比想的严重，住院、手术、复查，一万多砸进去。看着它术后虚弱的样子，你彻夜守着。钱包瘪了，可它摇尾巴的那一刻，你又觉得值。陪伴从不是免费的，但它从不让你后悔。";
      }
    }
  ]
});

/* 13. 宠物纯疗愈（额外正向小事件）—— 单层 */
EVENTS.push({
  id: "ev_buyx_pet_heal", module: "life", ambient: true,
  cond: (s) => has(s, "has_pet") && (s.mood <= 50 || s.stress >= 50),
  title: "🐱 加班到崩溃，它窝进了你怀里",
  text: (s) => "又是被工作和压力碾过的一天，你拖着空壳一样的身子回到家，往沙发上一瘫。毛孩子悄悄踱过来，跳上你的腿，蹭了蹭你的手心，发出满足的呼噜声。那一刻，紧绷了一天的神经，忽然就软了下来。",
  choices: [
    {
      label: "抱着它，什么都不想",
      effect: (s) => {
        add(s, "stress", -12); add(s, "mood", 10); add(s, "health", 2);
        return "你抱着它在沙发上发了好一会儿呆，世界的喧嚣都被隔在了门外。再难的日子，回家有个小家伙等你、暖你，就好像没那么扛不住了。这份陪伴，是钱买来的，却比钱金贵。";
      }
    }
  ]
});
