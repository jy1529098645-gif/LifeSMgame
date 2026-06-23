"use strict";
/* content/deaths.js —— 死法 + 结局称号 */

// ① 死法：自然死亡时按"你怎么活的"加权挑一个，给一句有画面感的临终旁白
var DEATH_CAUSES = [
  { id:"overwork", cause:"过劳猝死",
    cond:(s)=> s.age>=28 && (has(s,"risk_hustle")||has(s,"chase_ipo")||s.stress>55),
    weight:(s)=> (has(s,"risk_hustle")?3:1) + (has(s,"chase_ipo")?2:0) + (s.stress>65?2:0),
    recap:(s)=> "凌晨的工位上，你趴在键盘前再没抬起头。屏幕还亮着，未读消息 99+，没有一条等得到回复了。" },

  { id:"heart_attack", cause:"突发心梗",
    cond:(s)=> s.age>=40 && (s.health<55 || s.stress>50),
    weight:(s)=> 2 + (s.health<40?2:0) + (s.stress>60?1:0) + (classTier(s)>=3?1:0),
    recap:(s)=> "胸口像被一只手攥紧，你想喊，却只来得及扶住桌角。世界在你眼前慢慢褪成了白色。" },

  { id:"stroke", cause:"脑溢血",
    cond:(s)=> s.age>=45 && (s.stress>55 || s.health<50),
    weight:(s)=> 2 + (s.stress>65?2:0) + (has(s,"civil_servant")?1:0),
    recap:(s)=> "一阵剧烈的眩晕后，半边身子忽然不听使唤。你倒下时还记挂着没说完的那句话，从此没人能听见了。" },

  { id:"cancer", cause:"癌症病逝",
    cond:(s)=> s.age>=45 && s.health<70,
    weight:(s)=> 2 + (s.health<45?2:0) + ((s.ailmentIds&&s.ailmentIds.length>=2)?2:0),
    recap:(s)=> "化疗的最后一程，你瘦得只剩下眼神还亮着。病房窗外的梧桐黄了又绿，你终究没等到下一个春天。" },

  { id:"chronic_illness", cause:"久病缠身",
    cond:(s)=> s.age>=55 && (s.health<45 || (s.ailmentIds&&s.ailmentIds.length>=3)),
    weight:(s)=> 1 + ((s.ailmentIds&&s.ailmentIds.length>=3)?3:0),
    recap:(s)=> "药盒按星期排得整整齐齐，可身体还是一天天垮下去。你在病榻上熬过了无数个长夜，终于不必再熬了。" },

  { id:"car_crash", cause:"车祸身亡",
    cond:(s)=> s.age>=18,
    weight:(s)=> 1.2 + (has(s,"risk_hustle")?0.5:0),
    recap:(s)=> "只是一个再普通不过的红绿灯路口。一声刺耳的急刹和巨响之后，你的故事在这里被人猛地按下了停止键。" },

  { id:"drunk_driving", cause:"醉驾身亡",
    cond:(s)=> s.age>=20 && (s.mood<40 || has(s,"risk_hustle") || classTier(s)>=2),
    weight:(s)=> 1 + (s.mood<30?2:0),
    recap:(s)=> "酒局散场，你逞强握住了方向盘。最后印在视网膜上的，是迎面而来、刺得人睁不开眼的远光灯。" },

  { id:"extreme_sport", cause:"极限运动意外",
    cond:(s)=> s.age>=18 && s.age<=60 && (s.stats.body>=60 || classTier(s)>=3),
    weight:(s)=> 0.6 + (s.stats.body>=70?1.5:0) + (classTier(s)>=3?1:0),
    recap:(s)=> "绳索绷断的那一刻，风在耳边呼啸。你曾以为自己征服了高山与海洋，原来它们只是一直没动手。" },

  { id:"surgery_fail", cause:"手术台意外",
    cond:(s)=> s.age>=35 && s.health<60,
    weight:(s)=> 0.8 + (s.health<45?1:0),
    recap:(s)=> "麻醉让你沉入一片温柔的黑。手术灯亮着，监护仪的滴答声渐渐拉成了一条长长的、再不起伏的直线。" },

  { id:"medical_malpractice", cause:"医疗事故",
    cond:(s)=> s.age>=30,
    weight:(s)=> 0.4 + (classTier(s)<=1?0.6:0),
    recap:(s)=> "一份拿错的化验单，一支用错的药。你把性命交给了白大褂，却没等来一句像样的解释。" },

  { id:"natural_old", cause:"寿终正寝",
    cond:(s)=> s.age>=75,
    weight:(s)=> 2 + (s.health>60?2:0) + (s.network>=40?1:0),
    recap:(s)=> "儿孙绕膝的午后，你在藤椅上打了个盹，就这样睡了过去，嘴角还挂着没说完的笑。一生圆满，再无遗憾。" },

  { id:"lonely_end", cause:"孤独终老",
    cond:(s)=> s.age>=65 && s.network<20 && !has(s,"married") && !has(s,"has_kid"),
    weight:(s)=> 2 + (s.network<10?2:0) + (s.mood<40?1:0),
    recap:(s)=> "屋里的钟还在走，没人来按门铃。很多天以后，邻居才发觉那扇门一直没开过。你走得很安静，安静得像从没来过。" },

  { id:"heroic_death", cause:"见义勇为殉难",
    cond:(s)=> s.age>=16 && (s.stats.body>=45 || s.stats.charm>=50 || s.civilRank>0),
    weight:(s)=> 0.5 + (s.stats.body>=60?1:0) + (s.civilRank>0?0.5:0),
    recap:(s)=> "你冲进了所有人退后的方向。火光与水流吞没了你，却没能吞没那一声呼救之后，你毫不犹豫的脚步。" },

  { id:"revenge_killing", cause:"仇杀横祸",
    cond:(s)=> s.age>=18 && (has(s,"risk_hustle") || has(s,"jailed") || _nw(s)>=5000000),
    weight:(s)=> 0.4 + (has(s,"jailed")?2:0) + (has(s,"risk_hustle")?1:0),
    recap:(s)=> "门铃响起时，你以为是熟人。你这辈子结下的某个梁子，终于在这个晚上，带着寒光找上了门。" },

  { id:"bankrupt_collapse", cause:"破产潦倒",
    cond:(s)=> has(s,"been_bankrupt") || (_nw(s)<0 && s.mood<40),
    weight:(s)=> 1 + (has(s,"been_bankrupt")?2:0) + (s.mood<30?2:0),
    recap:(s)=> "曾经名片上印满头衔，如今讨债的电话一个接一个。你蜷在出租屋里，被一种叫'再也起不来'的东西，慢慢压垮了。" },

  { id:"starvation", cause:"贫病交加",
    cond:(s)=> has(s,"starving") || ((s._brokeMonths||0)>=3 && s.health<40),
    weight:(s)=> 3 + ((s._brokeMonths||0)>=5?4:0) + (s.health<20?4:0),
    recap:(s)=> "账单像潮水，把你能变卖的都卷走了。最后那些日子，你数着兜里的硬币算下一顿，身子一天天垮下去——原来人是真的会被穷字压死的。" },

  { id:"rich_disease", cause:"纵欲富贵病",
    cond:(s)=> classTier(s)>=3 && s.age>=45 && s.health<65,
    weight:(s)=> 1 + (classTier(s)>=4?2:0) + (s.health<50?1:0),
    recap:(s)=> "山珍海味、夜夜笙歌，账单是身体替你结的。三高、痛风、脂肪肝轮番上阵，最好的医生也救不回被你挥霍掉的本钱。" },

  { id:"immuno_collapse", cause:"重症感染并发症",
    cond:(s)=> (s.ailmentIds||[]).includes("immuno_severe") && s.health<60,
    weight:(s)=> 4 + (s.health<40?3:0),
    recap:(s)=> "最初被你当成“不会有事”的那段混乱，后来变成了病历上越来越厚的一叠纸。感染反复、免疫崩塌，病房的白光照到最后，你终于安静下来。" },

  { id:"untreated_infection", cause:"感染恶化",
    cond:(s)=> ((s.ailmentIds||[]).includes("sti_chronic") || (s.ailmentIds||[]).includes("sti_mild")) && s.health<38,
    weight:(s)=> 2 + ((s.ailmentIds||[]).includes("sti_chronic")?2:0),
    recap:(s)=> "你一次次把复查往后拖，把症状解释成小毛病。直到身体再也替你圆谎，病情失控得比想象中更快。" },

  { id:"plague", cause:"瘟疫染病",
    cond:(s)=> s.age>=10 && (s.world&&s.world.windHeat>=70 || s.health<50),
    weight:(s)=> 0.5 + ((s.world&&s.world.windHeat>=80)?2:0) + (s.health<45?1:0),
    recap:(s)=> "一场谁也没料到的疫病席卷了城市。隔离病房的玻璃后，家人的脸模糊成一团。你成了新闻里又一个冰冷的数字。" },

  { id:"earthquake", cause:"地震遇难",
    cond:(s)=> s.age>=1,
    weight:(s)=> 0.3,
    recap:(s)=> "大地毫无征兆地咆哮起来，楼在几秒钟里塌成了废墟。你被埋在黑暗中，听着自己的心跳，一下，比一下，更慢。" },

  { id:"flood", cause:"洪灾殒命",
    cond:(s)=> s.age>=1,
    weight:(s)=> 0.3 + (classTier(s)<=1?0.3:0),
    recap:(s)=> "暴雨连下了三天，浑浊的水漫过了膝盖、胸口、下巴。你拼命抓住一根漂过的木头，可洪水比你的力气更有耐心。" },

  { id:"typhoon", cause:"台风天灾",
    cond:(s)=> s.age>=1,
    weight:(s)=> 0.25,
    recap:(s)=> "狂风把广告牌撕成了利刃，把大树连根拔起。你只是想赶在风暴前回家，却没能跑过那阵席卷一切的呼啸。" },

  { id:"plane_crash", cause:"空难",
    cond:(s)=> s.age>=18 && (has(s,"overseas")||has(s,"emigrated")||classTier(s)>=2||s.network>=40),
    weight:(s)=> 0.3 + (has(s,"overseas")?1:0) + (classTier(s)>=3?0.5:0),
    recap:(s)=> "万米高空，机身突然剧烈地抖动。广播里的声音变了调，你握紧扶手，望向舷窗外那片再也飞不出去的云。" },

  { id:"shipwreck", cause:"海难",
    cond:(s)=> s.age>=16 && (has(s,"overseas")||classTier(s)>=3||s.stats.body>=55),
    weight:(s)=> 0.25 + (has(s,"overseas")?0.5:0),
    recap:(s)=> "甲板倾斜的那一刻，海是黑的，天也是黑的。你随着冰冷的浪一点点下沉，岸上的灯火，从此与你隔了一整片海。" },

  { id:"work_injury", cause:"工伤事故",
    cond:(s)=> s.age>=18 && s.age<=60 && classTier(s)<=2 && s.stats.body>=30 && s.stats.knowledge<55,
    weight:(s)=> 0.6 + (classTier(s)<=1?1.5:0),
    recap:(s)=> "工地的塔吊、车间的机床，养活了你也算计着你。一个没人按规程操作的瞬间，你倒在了为生计奔忙的岗位上。" },

  { id:"drinking_accident", cause:"酒局出事",
    cond:(s)=> s.age>=22 && (s.stats.charm>=40 || has(s,"civil_servant") || has(s,"risk_hustle")),
    weight:(s)=> 0.5 + (s.stats.charm>=60?1:0),
    recap:(s)=> "'感情深，一口闷。'第几杯你已经数不清了。这一晚的应酬没谈成什么，却悄悄夺走了你后半生所有的酒局。" },

  { id:"civil_servant_toil", cause:"积劳成疾",
    cond:(s)=> has(s,"civil_servant") && s.age>=50,
    weight:(s)=> 1.5 + (s.civilRank>=3?1:0) + (s.stress>55?1:0),
    recap:(s)=> "案头的文件永远批不完，下乡的路永远跑不尽。你把一生都耗在了岗位上，倒下时，办公桌上的茶水还冒着热气。" },

  { id:"civil_servant_retire", cause:"退休善终",
    cond:(s)=> has(s,"civil_servant") && s.age>=70 && s.health>=50,
    weight:(s)=> 2 + (s.civilRank>=2?1:0),
    recap:(s)=> "退休后的日子清闲，遛鸟、下棋、含饴弄孙。一辈子规规矩矩，临了也走得体面安详，悼词里满是'德高望重'。" },

  { id:"fame_illness", cause:"功成名就病逝",
    cond:(s)=> s.age>=65 && (classTier(s)>=3 || s.civilRank>=3 || _nw(s)>=8000000),
    weight:(s)=> 1.5 + (classTier(s)>=4?1:0),
    recap:(s)=> "病房外站满了前来探望的人，鲜花堆成了小山。你走得风光，可此刻你最想要的，不过是再多看一眼窗外的太阳。" },

  { id:"hermit_peace", cause:"隐居无疾而终",
    cond:(s)=> s.age>=70 && (s.stats.mind>=60 || s.stats.insight>=60) && s.stress<35,
    weight:(s)=> 1.5 + (s.stats.insight>=70?1.5:0),
    recap:(s)=> "山中无历日，寒尽不知年。你在草木的清香里读完最后一页书，搁下笔，像云融入天空那样，悄然散去。" },

  { id:"street_death", cause:"暴毙街头",
    cond:(s)=> classTier(s)<=0 && (s.health<45 || s.mood<35),
    weight:(s)=> 1 + (s.health<35?2:0),
    recap:(s)=> "天桥下的纸板还带着体温，路人脚步匆匆，没人停下。这座你拼了命想留下的城市，最终没给你留一张床。" },

  { id:"food_poison", cause:"食物中毒",
    cond:(s)=> s.age>=5,
    weight:(s)=> 0.3 + (classTier(s)<=1?0.4:0),
    recap:(s)=> "不过是一顿再寻常不过的饭。半夜里翻江倒海的绞痛，等送到医院时，已经晚了。命运的玩笑，有时就藏在筷子上。" },

  { id:"black_swan", cause:"黑天鹅意外",
    cond:(s)=> s.age>=10,
    weight:(s)=> 0.25,
    recap:(s)=> "高空坠物、燃气泄漏、一个谁也想不到的巧合。概率小到可以忽略，可这一次，命运偏偏点了你的名。" },

  { id:"war", cause:"战乱罹难",
    cond:(s)=> s.age>=5 && (s.world&&s.world.windHeat>=85),
    weight:(s)=> 0.4 + ((s.world&&s.world.windHeat>=90)?2:0),
    recap:(s)=> "防空警报撕裂了夜空，远处的火光照亮了奔逃的人群。你只想护住怀里的家人，可炮火从不分辨谁是无辜。" },

  { id:"depression_quiet", cause:"在疲惫中离开",
    cond:(s)=> s.age>=18 && s.mood<25 && s.stress>60,
    weight:(s)=> 0.6 + (s.mood<15?1:0),
    recap:(s)=> "你被一种说不清的疲惫淹没，太久了。某个再普通不过的清晨，你悄悄地放下了一切，没惊动任何人。愿你那边，再没有累。" }
];

function pickDeathCause(s){
  var pool=DEATH_CAUSES.filter(function(d){ try{return !d.cond||d.cond(s);}catch(e){return false;} });
  if(!pool.length) return { cause:"寿终正寝", recap:"你在睡梦中平静地走了，像一盏燃尽的灯，悄无声息。" };
  var tot=0, ws=pool.map(function(d){ var w=1; try{ w=Math.max(0.1, d.weight?d.weight(s):1);}catch(e){w=1;} tot+=w; return w; });
  var r=Math.random()*tot, acc=0;
  for(var i=0;i<pool.length;i++){ acc+=ws[i]; if(r<=acc){ var d=pool[i]; var rc=""; try{rc=d.recap(s);}catch(e){rc="";} return {cause:d.cause, recap:rc}; } }
  var last=pool[pool.length-1]; return {cause:last.cause, recap:last.recap(s)};
}

// ② 结局称号：顺序【具体→通用】，pickEnding 取第一个 cond 命中（最后一个兜底必为 true）
function _tlv(s, id) { return (typeof threadLevel === "function") ? threadLevel(s, id) : ((s.threads && s.threads[id] && s.threads[id].level) || 0); }
function _maxFeudLv(s) { if (!s.threads) return 0; var m = 0; for (var k in s.threads) { if (/feud|rift|betray/.test(k) && s.threads[k]) m = Math.max(m, s.threads[k].level || 0); } return m; }
var ENDINGS = [
  // —— 学术巅峰（人类知识之巅，凌驾于财富之上）——
  { id:"nobel_laureate", name:"🏅 诺贝尔奖得主", cond:(s)=> has(s,"won_nobel") },
  { id:"turing_laureate", name:"💻 图灵奖得主", cond:(s)=> has(s,"won_turing") },
  { id:"fields_laureate", name:"📐 菲尔兹奖得主", cond:(s)=> has(s,"won_fields") },
  { id:"academician", name:"🏛️ 院士 · 国之栋梁", cond:(s)=> has(s,"academician") },
  { id:"acad_master", name:"📚 学界泰斗", cond:(s)=> has(s,"acad_breakthrough") || has(s,"acad_nominated") },

  // —— 财富顶层 ——
  { id:"tianlong", name:"🐉 天龙人", cond:(s)=> _nw(s)>=20000000 },
  { id:"super_rich", name:"💎 富甲一方", cond:(s)=> _nw(s)>=8000000 },

  // —— 事业线巅峰 ——
  { id:"ipo_legend", name:"🚀 上市传奇", cond:(s)=> has(s,"chase_ipo") && _nw(s)>=5000000 },
  { id:"ipo_fail", name:"💥 倒在敲钟前", cond:(s)=> has(s,"chase_ipo") },
  { id:"industry_legend", name:"🏆 行业传奇", cond:(s)=> has(s,"startup_done") && _nw(s)>=3000000 && s.stats.strategy>=70 },
  { id:"startup_founder", name:"🧱 白手起家", cond:(s)=> has(s,"startup") && _nw(s)>=2000000 && classTier(s)<=2 },
  { id:"startup_fail", name:"🪦 出师未捷", cond:(s)=> has(s,"startup_done") && _nw(s)<0 },
  { id:"work_emperor", name:"👔 打工皇帝", cond:(s)=> _nw(s)>=3000000 && !has(s,"startup") && !has(s,"civil_servant") },

  // —— 体制线 ——
  { id:"top_official", name:"🎖️ 封疆大吏", cond:(s)=> has(s,"civil_servant") && s.civilRank>=4 },
  { id:"servant_people", name:"📜 人民公仆", cond:(s)=> has(s,"civil_servant") && s.civilRank>=2 },
  { id:"iron_rice", name:"🍚 端稳铁饭碗", cond:(s)=> has(s,"civil_servant") },
  { id:"prisoner", name:"⛓️ 阶下囚", cond:(s)=> has(s,"jailed") },

  // —— 学术线（学位进阶链：博士→教授/海归 PI；以及没走通的博后漂/肄业）——
  { id:"haigui_pi", name:"🔬 海归领军学者", cond:(s)=> has(s,"haigui_pi") },
  { id:"grand_scholar", name:"📚 一代宗师", cond:(s)=> has(s,"full_professor") && s.stats.knowledge>=70 },
  { id:"full_professor", name:"🎓 桃李满门的教授", cond:(s)=> has(s,"full_professor") },
  { id:"tenured_prof", name:"🏛️ 长聘副教授", cond:(s)=> has(s,"got_tenure") || s.acadRank==="副教授" },
  { id:"young_faculty", name:"🧑‍🏫 讲台上的青椒", cond:(s)=> has(s,"got_faculty") || s.acadRank==="讲师" },
  { id:"postdoc_drifter", name:"🧳 漂泊的博士后", cond:(s)=> has(s,"postdoc_drift") || s.acadRank==="博后" },
  { id:"tenure_loser", name:"📕 非升即走的局外人", cond:(s)=> has(s,"tenure_failed") },
  { id:"phd_industry", name:"💼 下海的博士", cond:(s)=> has(s,"phd_industry") || (has(s,"edu_phd") && has(s,"left_academia")) },
  { id:"doctor_phd", name:"🎓 寒窗博士", cond:(s)=> has(s,"phd_done") },
  { id:"acad_dropout", name:"📉 肄业的遗憾", cond:(s)=> has(s,"acad_washout") },

  // —— 持续矛盾收场（threads 累到高位 → 命运被它定义；优先于「草根逆袭/温情/通用」等较轻结局，但让位于诺奖/上市/封疆等重大成就）——
  { id:"marriage_broken", name:"💔 貌合神离的晚年", cond:(s)=> _tlv(s,"marriage_crack")>=60 && s.age>=45 },
  { id:"consumed_feud", name:"🗡️ 被恩怨吞没的人", cond:(s)=> _tlv(s,"underworld_feud")>=50 || _tlv(s,"peer_war")>=55 || _maxFeudLv(s)>=58 },
  { id:"haunted_guilt", name:"🪞 良心难安的一生", cond:(s)=> _tlv(s,"founder_guilt")>=58 },
  { id:"rootless_soul", name:"🌫️ 一生漂泊无根", cond:(s)=> _tlv(s,"identity_crisis")>=55 && s.age>=50 },

  // —— 草根逆袭 / 时代 ——
  { id:"grassroots", name:"🌱 草根逆袭", cond:(s)=> classTier(s)>=2 && (s.flags&&s.flags.startClass!==undefined? s.flags.startClass<=1 : true) && _nw(s)>=1000000 },
  { id:"tide_rider", name:"🌊 时代弄潮儿", cond:(s)=> has(s,"risk_hustle") && _nw(s)>=1500000 },
  { id:"wind_winner", name:"🪁 风口赢家", cond:(s)=> (s.world&&s.world.windHeat>=60) && _nw(s)>=1000000 },
  { id:"era_buyer", name:"🏚️ 时代接盘侠", cond:(s)=> has(s,"has_house") && _nw(s)<200000 && classTier(s)<=1 },
  { id:"laid_off", name:"📉 下岗洪流里的人", cond:(s)=> (s.world&&s.world.jobMarket<35) && !s.job && classTier(s)<=1 },

  // —— 地域命运 ——
  { id:"overseas_wanderer", name:"✈️ 海外游子", cond:(s)=> has(s,"emigrated") || has(s,"overseas") },
  { id:"return_root", name:"🍂 落叶归根", cond:(s)=> s.age>=70 && s.network>=30 && has(s,"has_house") },

  // —— 早逝线 ——
  { id:"young_gambler", name:"🎲 英年早逝的赌徒", cond:(s)=> s.age<45 && has(s,"risk_hustle") },
  { id:"young_death", name:"🥀 英年早逝", cond:(s)=> s.age<45 },

  // —— 人生态度 ——
  { id:"hermit", name:"🍃 山中隐者", cond:(s)=> (s.stats.insight>=65||s.stats.mind>=70) && s.stress<35 && s.network<25 && _tlv(s,"identity_crisis")<55 },
  { id:"prodigal_return", name:"🔁 浪子回头", cond:(s)=> has(s,"jailed")? false : (has(s,"been_bankrupt") && _nw(s)>=300000) },
  { id:"lonely_rich", name:"🥂 孤独的富豪", cond:(s)=> _nw(s)>=2000000 && s.network<20 && !has(s,"married") },
  { id:"full_house", name:"👨‍👩‍👧‍👦 儿孙满堂", cond:(s)=> has(s,"has_kid") && has(s,"married") && s.network>=30 && _tlv(s,"marriage_crack")<55 },
  { id:"peace_years", name:"🏡 岁月静好", cond:(s)=> has(s,"married") && has(s,"has_house") && s.mood>=55 && s.health>=50 && _tlv(s,"marriage_crack")<55 && _tlv(s,"identity_crisis")<55 },
  { id:"middle_class", name:"☕ 安稳中产", cond:(s)=> classTier(s)>=2 && has(s,"has_house") && _tlv(s,"identity_crisis")<55 },
  { id:"warm_simple", name:"🌤️ 知足常乐", cond:(s)=> s.mood>=60 && s.health>=50 && _tlv(s,"marriage_crack")<55 && _tlv(s,"founder_guilt")<55 && _tlv(s,"identity_crisis")<55 },

  // —— 底层 / 落魄 ——
  { id:"broke", name:"🕳️ 一贫如洗", cond:(s)=> _nw(s)<0 },
  { id:"poor_struggle", name:"🍜 挣扎在温饱线", cond:(s)=> classTier(s)<=0 },
  { id:"working_drone", name:"🐂 老黄牛一头", cond:(s)=> s.job && classTier(s)<=1 && s.stress>50 },
  { id:"lonely_old", name:"🕯️ 孤独终老", cond:(s)=> s.age>=60 && s.network<15 && !has(s,"married") },

  // —— 通用兜底链 ——
  { id:"small_rich", name:"🪙 小有积蓄", cond:(s)=> _nw(s)>=500000 },
  { id:"plain_busy", name:"🚶 庸碌一生", cond:(s)=> s.age>=60 },
  { id:"ordinary", name:"😶 平凡的一生", cond:(s)=> true }
];

// 路线优先：你「图什么」决定结局先按哪条线认领，避免家庭/躺平/打工/体制线被财富结局误伤。
// 例：一个家庭目标的富人，应得「儿孙满堂」而非「天龙人」；纯体制高官应得「封疆大吏」而非「天龙人」。
var GOAL_ENDING_PREF = {
  "躺平": ["hermit", "peace_years", "warm_simple", "middle_class"],
  "家庭": ["full_house", "peace_years", "warm_simple", "return_root"],
  "打工": ["work_emperor", "middle_class", "working_drone"],
  "体制": ["top_official", "servant_people", "iron_rice"]
};
function endingById(id){ for(var i=0;i<ENDINGS.length;i++) if(ENDINGS[i].id===id) return ENDINGS[i]; return null; }
function pickEnding(s){
  // 1) 牢狱/早逝等「强结局」不被路线覆盖——它们就是这一生最重的注脚
  if (has(s,"jailed")) return endingById("prisoner").name;
  if (s.age < 45 && has(s,"risk_hustle")) return endingById("young_gambler").name;
  // 2) 路线优先：按你追求的人生路线，先认领对应主题结局（条件满足时）
  var g = (typeof goalById === "function" && s.goal) ? goalById(s.goal) : null;
  var pref = g && GOAL_ENDING_PREF[g.path];
  if (pref) for (var k=0;k<pref.length;k++){ var e=endingById(pref[k]); if(e){ try{ if(e.cond(s)) return e.name; }catch(x){} } }
  // 3) 回退：按既有「具体→通用」顺序扫描
  for(var i=0;i<ENDINGS.length;i++){ try{ if(ENDINGS[i].cond(s)) return ENDINGS[i].name; }catch(e){} }
  return ENDINGS[ENDINGS.length-1].name;
}
