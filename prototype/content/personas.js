"use strict";

// ============================================================
// NPC 性格 / 特点库
// 给社交圈里每个角色赋予鲜明性格，供引擎和事件消费。
// schema 字段：id / name / emoji / desc / quirk / good / bad
//   id    唯一短 id
//   name  4 字性格标签
//   emoji 一个贴切 emoji
//   desc  一句话性格说明
//   quirk 口头禅 / 小动作（带引号），用于对白点缀
//   good  ta 对你态度好时的行为倾向（半句）
//   bad   ta 对你态度差时的行为倾向（半句）
// 经典全局作用域，无 import；依赖项目已有全局 helper pick()。
// ============================================================

var PERSONAS = [
  {
    id: "rexin",
    name: "古道热肠",
    emoji: "🔥",
    desc: "重情义、爱帮忙，见不得朋友吃亏。",
    quirk: "“这事儿包在我身上！”",
    good: "你落难时多半会拉你一把",
    bad: "一旦觉得你不仗义，翻脸也快"
  },
  {
    id: "suanji",
    name: "精于算计",
    emoji: "🧮",
    desc: "凡事先掂量利弊，无利不起早。",
    quirk: "“这笔账得算清楚。”",
    good: "若你有用，会陪你下盘大棋",
    bad: "觉得你没价值，转头就把你筛掉"
  },
  {
    id: "daozi",
    name: "刀子嘴豆腐心",
    emoji: "🍮",
    desc: "嘴上不饶人，心里却处处替你着想。",
    quirk: "“我这是为你好，你别不识好歹。”",
    good: "嘴上嫌弃，背地里替你收拾烂摊子",
    bad: "被惹急了会连损带骂一通发泄"
  },
  {
    id: "weishi",
    name: "好为人师",
    emoji: "🎓",
    desc: "总爱指点江山，逮谁给谁上课。",
    quirk: "“年轻人，我跟你讲个道理。”",
    good: "真心实意把压箱底的经验倾囊相授",
    bad: "你不听劝就摇头叹气，懒得再管你"
  },
  {
    id: "fengshi",
    name: "见风使舵",
    emoji: "🌀",
    desc: "哪边风大往哪倒，墙头草随风摆。",
    quirk: "“识时务者为俊杰嘛。”",
    good: "你得势时凑得比谁都近",
    bad: "你一失势立马划清界限"
  },
  {
    id: "muna",
    name: "老实木讷",
    emoji: "🌲",
    desc: "话少不会来事，但踏实可靠不耍滑。",
    quirk: "（挠挠头）“我……我也不太会说。”",
    good: "答应你的事会闷头一件件做到",
    bad: "受了委屈也只会闷着，渐渐疏远你"
  },
  {
    id: "xingao",
    name: "心高气傲",
    emoji: "🦚",
    desc: "自视甚高，不太瞧得上寻常人。",
    quirk: "“就这水平，也好意思拿出来？”",
    good: "认可你的本事后会引你为知己",
    bad: "看轻你便处处端着，话里带刺"
  },
  {
    id: "baling",
    name: "八面玲珑",
    emoji: "🎭",
    desc: "人情练达，跟谁都能聊到一块儿。",
    quirk: "“好说好说，都是自己人。”",
    good: "替你牵线搭桥，左右逢源",
    bad: "笑脸照旧，暗地里早把你晾在一边"
  },
  {
    id: "fenshi",
    name: "愤世嫉俗",
    emoji: "🌧️",
    desc: "看什么都不顺眼，逢事先吐槽三分。",
    quirk: "“这世道，呵，早烂透了。”",
    good: "认你是同道，会跟你掏心窝子骂世界",
    bad: "把你也归入“俗人”，开口就是冷嘲"
  },
  {
    id: "jinjin",
    name: "斤斤计较",
    emoji: "⚖️",
    desc: "一分一毫都记得清清楚楚，吃不得亏。",
    quirk: "“上回那顿饭，还差我两块钱。”",
    good: "账算明白了便处得长久、不含糊",
    bad: "觉得吃了亏会念叨你大半年"
  },
  {
    id: "letian",
    name: "乐天派",
    emoji: "☀️",
    desc: "天塌下来都笑得出来，自带阳光。",
    quirk: "“嗨，没事没事，会好的！”",
    good: "你低落时总能把你逗乐、拉你一把",
    bad: "顶多撇撇嘴，转头照样乐呵不记仇"
  },
  {
    id: "mianleng",
    name: "面冷心热",
    emoji: "🧊",
    desc: "一张扑克脸，实则刀子下都是热汤。",
    quirk: "（面无表情）“……拿着吧，别废话。”",
    good: "嘴上不说，关键时刻默默替你扛事",
    bad: "彻底冷下来便一句话也懒得给你"
  },
  {
    id: "panlong",
    name: "攀龙附凤",
    emoji: "🐉",
    desc: "一心往上够，爱结交有头有脸的人。",
    quirk: "“哎呀，您这样的人物，我得敬一杯。”",
    good: "认定你有前途便贴上来鞍前马后",
    bad: "嫌你没背景就敷衍了事、爱搭不理"
  },
  {
    id: "wushi",
    name: "与世无争",
    emoji: "🍃",
    desc: "不抢不夺，凡事随缘，活得通透淡然。",
    quirk: "“都行都行，你们定就好。”",
    good: "从不与你争利，相处毫无压力",
    bad: "话不投机便淡淡退开，懒得纠缠"
  },
  {
    id: "zhengqiang",
    name: "争强好胜",
    emoji: "🏆",
    desc: "事事要拔头筹，输了夜里都睡不着。",
    quirk: "“咱们走着瞧，我就不信赢不了。”",
    good: "把你当队友便拼了命也要带你赢",
    bad: "视你为对手便处处要压你一头"
  },
  {
    id: "shenshen",
    name: "神神叨叨",
    emoji: "🔮",
    desc: "信风水讲运势，做事先看黄历问吉凶。",
    quirk: "“今天忌动土，这事儿得改日。”",
    good: "替你掐指一算，说你近日有贵人相助",
    bad: "认定你“八字相冲”便有意躲着你"
  },
  {
    id: "koumen",
    name: "抠门精明",
    emoji: "💰",
    desc: "花钱像割肉，但精打细算从不乱花。",
    quirk: "“能省一块是一块，没必要。”",
    good: "肯为你掏钱时，那是真把你当回事",
    bad: "占了你便宜还觉得理所当然"
  },
  {
    id: "baqua",
    name: "热心八卦",
    emoji: "📢",
    desc: "消息灵通，谁家长短都能聊上半天。",
    quirk: "“诶你别说出去啊——我跟你讲个事。”",
    good: "第一时间把有用的风声透给你",
    bad: "你的糗事转眼就传遍了大街小巷"
  },
  {
    id: "yiqi",
    name: "仗义疏财",
    emoji: "💸",
    desc: "为朋友两肋插刀，钱财看得淡如水。",
    quirk: "“钱算什么，兄弟才是一辈子的。”",
    good: "你缺钱缺人时眼都不眨就顶上",
    bad: "被辜负了义气会彻底寒心、断交"
  },
  {
    id: "jinshen",
    name: "谨小慎微",
    emoji: "🐤",
    desc: "做事步步留神，反复确认才敢动。",
    quirk: "“再想想，万一出岔子怎么办？”",
    good: "替你把风险一一查清，少踩坑",
    bad: "对你起了疑便处处设防、不敢交底"
  }
];

function makePersona(){ return pick(PERSONAS); }

/* 把 20 种性格归为 5 类行为倾向，供事件按"性格"分支（决定 NPC 怎么对你）：
   helper 热心助人 / calc 精算交易 / fairweather 见风使舵 / aloof 清高避世 / plain 中庸老实 */
var PERSONA_BUCKET = {
  rexin: "helper", yiqi: "helper", daozi: "helper", mianleng: "helper",
  suanji: "calc", koumen: "calc", jinjin: "calc",
  fengshi: "fairweather", panlong: "fairweather", baqua: "fairweather",
  xingao: "aloof", fenshi: "aloof", wushi: "aloof", weishi: "aloof", shenshen: "aloof",
  muna: "plain", letian: "plain", baling: "plain", zhengqiang: "plain", jinshen: "plain"
};
function personaBucket(p) { return p && PERSONA_BUCKET[p.id] ? PERSONA_BUCKET[p.id] : "plain"; }
