"use strict";
/* =====================================================================
 * content/names.js —— 庞大姓名库（随机生成中外人名）
 * 中文：姓取自百家姓，名 1-2 字（偶尔 3 字）随机组合。
 * 外国：按国家风格（英美/日本/韩国/法国/德国/印度…）生成对应名字。
 * 用法（全局）：genName("cn") / genName("us") / genName(cityCountryId)。social.js 调用。
 * ===================================================================== */
const SURNAMES = ("赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛伍余米贝姚孟顾尹江钟侯邓杜傅曾程董袁邵毛江史陆黎贺龚段雷汤万熊").split("");
const GIVEN1 = ("伟刚勇毅俊峰强军平保东文辉力明永健世广志义兴良海山仁波宁贵福生龙元全国胜学祥才发武新利清飞彬富顺信子杰涛昌成康星光天达安岩中茂进林有坚和彪博诚先敬震振壮会思群豪心邦承乐绍功松善厚庆磊民友裕河哲江超浩亮政谦亨奇固之轮翰朗伯宏言若鸣朋斌梁栋维启克伦翔旭鹏泽晨辰士以建家致树炎德行时泰盛雄琛钧冠策腾楠榕风航弘").split("");
const GIVENF = ("芳娜秀娟英华慧巧美娣丽红娥玲芬芳燕彩春菊兰凤洁梅琳素云莲真环雪荣爱妹霞香月莺媛艳瑞凡佳嘉琼勤珍贞莉桂娣叶璧璐娅琦晶妍茜秋珊莎锦黛青倩婷姣婉娴瑾颖露瑶怡婵雁蓓纨仪荷丹蓉眉君琴蕊薇菁梦岚苑婕馨瑗琰韵融园艺咏卿聪澜纯毓悦昭冰爽琬茗羽希宁欣飘育滢馥筠柔竹霭凝晓欢霄枫芸菲寒伊亚宜可姬舒影荔枝丽阳娟").split("");
const EN_FIRST = ["James", "Michael", "David", "John", "Robert", "Daniel", "Kevin", "Chris", "Ethan", "Liam", "Noah", "Lucas", "Mary", "Jennifer", "Linda", "Emma", "Olivia", "Sophia", "Emily", "Sarah", "Anna", "Grace", "Chloe", "Mia"];
const EN_LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Clark", "Lewis", "Walker"];
const JP_NAMES = ["田中翔太", "佐藤美咲", "铃木健一", "高桥由美", "渡边大辅", "山本樱", "中村凉", "小林直树", "加藤遥", "吉田蓝"];
const KR_NAMES = ["金敏俊", "李秀贤", "朴智慧", "崔民浩", "郑秀晶", "姜东元", "尹智妍", "林允儿", "韩佳人", "孙艺珍"];
const FR_NAMES = ["Louis Martin", "Hugo Bernard", "Léa Dubois", "Camille Petit", "Jules Moreau", "Manon Laurent", "Théo Garnier"];
const DE_NAMES = ["Lukas Müller", "Felix Schmidt", "Hannah Weber", "Lena Fischer", "Jonas Wagner", "Mia Becker"];
const IN_NAMES = ["Arjun Sharma", "Priya Patel", "Rahul Gupta", "Ananya Singh", "Vikram Rao", "Neha Verma"];

// gender: "男"→男性用字，"女"→女性用字，留空/其它→随机混合（保持旧行为）。
// 让需要固定性别的角色（宿敌「他」、心动对象按取向…）取到与代词一致的名字，杜绝「名女称他」。
function genCNName(gender) {
  const sur = pick(SURNAMES);
  const male = gender === "男", female = gender === "女";
  const givenPool = () => male ? GIVEN1 : female ? GIVENF : (Math.random() < 0.5 ? GIVEN1 : GIVENF);
  const r = Math.random();
  let given;
  if (r < 0.45) given = pick(givenPool());                            // 单字名
  else given = pick(male ? GIVEN1 : givenPool()) + pick(givenPool());  // 双字名
  return sur + given;
}
// style: 国家 id（us/uk/au/ca→英文名；jp→日本；kr→韩国；fr/de/in…；其它/cn→中文）；gender 可选透传中文名
function genName(style, gender) {
  switch (style) {
    case "us": case "uk": case "au": case "ca": case "sg": case "en": {
      const f = pick(EN_FIRST); return Math.random() < 0.5 ? `${f} ${pick(EN_LAST)}` : f;
    }
    case "jp": return pick(JP_NAMES);
    case "kr": return pick(KR_NAMES);
    case "fr": return pick(FR_NAMES);
    case "de": return pick(DE_NAMES);
    case "in": return pick(IN_NAMES);
    default: return genCNName(gender);
  }
}
// 人物「插槽」：首次生成即定下 名字+性别+代词，供文本反复引用、全程一致，便于适配更多情况。
// 返回 {name, gender, pn}（pn=他/她）。
function genPerson(style, gender) {
  const g = (gender === "男" || gender === "女") ? gender : (Math.random() < 0.5 ? "男" : "女");
  const name = genName(style || "cn", g);
  return { name: name, gender: g, pn: g === "女" ? "她" : "他" };
}
