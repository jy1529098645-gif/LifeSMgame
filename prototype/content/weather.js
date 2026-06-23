"use strict";
/* ==================================================================
 * content/weather.js
 * 天气系统：按「季节 + 出生地域」生成每日天气。
 * 引擎每天调用 genDayWeather(s) 取一天的天气；每周把 7 天的天气 id
 * 收进 s.weekWx（长度 7 的数组），供 events-weather.js 的气候事件读取。
 *
 * 接口约定（引擎依赖，勿改名）：
 *   WEATHERS      —— 天气表
 *   seasonOf(s)   —— 0春 1夏 2秋 3冬
 *   genDayWeather(s) —— 返回 WEATHERS 中的一项
 *
 * regions 用「出生地 tags 真实存在的短词」对齐（读 s.birthplace.origin.tags）：
 *   沿海/海洋类: 海港 渔港 码头 海岛 海滨 港城 侨乡 椰林 渔村 出海 临江
 *   南方/潮湿类: 岭南 水乡 鱼米 茶乡 雨林 热带 稻田
 *   北方/塞外类: 塞北 苦寒 冰雪 高寒 牧区 草原 关外 面食
 *   风沙/西域类: 戈壁 旱塬 荒原 丝路 绿洲 西域 黄土 风沙 缺水 沙地
 *   工矿/霾源类: 重工 煤城 煤矿 钢城 工厂 老工业 油田 钢厂
 *   高原/山地类: 高原 雪山 山区 山地 山城 河谷
 * ================================================================== */

var WEATHERS = [
  /* 1. 晴 ——常态好天气，全年偏多 */
  { id:"clear", name:"晴", emoji:"☀️", severe:false,
    seasonW:[4,4,5,3], regions:null,
    effect:{ mood:1, health:0, stress:0 },
    note:"风和日丽，心情都跟着敞亮。" },

  /* 2. 多云 ——最普通的过渡天 */
  { id:"cloudy", name:"多云", emoji:"⛅", severe:false,
    seasonW:[5,4,5,4], regions:null,
    effect:{ mood:0, health:0, stress:0 },
    note:"云来云去，是再寻常不过的一天。" },

  /* 3. 阴天 ——光线沉，情绪略压 */
  { id:"overcast", name:"阴天", emoji:"☁️", severe:false,
    seasonW:[3,2,4,4], regions:null,
    effect:{ mood:-1, health:0, stress:0 },
    note:"天压得低低的，连呵欠都多了几个。" },

  /* 4. 小雨 ——温柔的雨 */
  { id:"drizzle", name:"小雨", emoji:"🌦️", severe:false,
    seasonW:[5,4,4,2], regions:["水乡","岭南","鱼米","茶乡","稻田"],
    effect:{ mood:0, health:0, stress:0 },
    note:"细雨敲窗，适合发会儿呆。" },

  /* 5. 中雨 ——出门要伞 */
  { id:"rain", name:"中雨", emoji:"🌧️", severe:false,
    seasonW:[4,5,3,1], regions:["水乡","岭南","鱼米","稻田","临江"],
    effect:{ mood:-1, health:0, stress:1 },
    note:"雨势不小，鞋袜怕是要湿。" },

  /* 6. 暴雨 ——极端，易内涝 */
  { id:"rainstorm", name:"暴雨", emoji:"⛈️", severe:true,
    seasonW:[2,6,2,0], regions:["岭南","水乡","鱼米","海港","港城","临江"],
    effect:{ mood:-2, health:-1, stress:2 },
    note:"瓢泼大雨，街上转眼成了河。" },

  /* 7. 雷阵雨 ——夏日午后特产 */
  { id:"thunderstorm", name:"雷阵雨", emoji:"🌩️", severe:false,
    seasonW:[2,6,2,0], regions:null,
    effect:{ mood:-1, health:0, stress:1 },
    note:"闷雷滚过，说下就下，说停又停。" },

  /* 8. 连阴雨 ——绵绵不绝，最磨人 */
  { id:"longrain", name:"阴雨连绵", emoji:"🌧️", severe:false,
    seasonW:[4,3,5,2], regions:["岭南","水乡","鱼米","茶乡"],
    effect:{ mood:-2, health:0, stress:1 },
    note:"雨下了好些天，被子都带着潮气。" },

  /* 9. 高温酷暑 ——极端，伏天 */
  { id:"heatwave", name:"高温酷暑", emoji:"🥵", severe:true,
    seasonW:[1,6,2,0], regions:["盆地","火锅","山城","岭南","热带","稻田"],
    effect:{ mood:-1, health:-1, stress:2 },
    note:"柏油路烫得能煎蛋，空调成了续命神器。" },

  /* 10. 寒潮 ——极端，断崖式降温 */
  { id:"coldwave", name:"寒潮", emoji:"🥶", severe:true,
    seasonW:[1,0,2,6], regions:["塞北","苦寒","高寒","牧区","面食","关外"],
    effect:{ mood:-1, health:-1, stress:2 },
    note:"北风像刀子，呼出的白气还没散就冻住了。" },

  /* 11. 大雪 ——极端，银装素裹也危险 */
  { id:"snowstorm", name:"大雪", emoji:"❄️", severe:true,
    seasonW:[1,0,1,6], regions:["冰雪","塞北","苦寒","高寒","牧区","雪山"],
    effect:{ mood:0, health:-1, stress:1 },
    note:"鹅毛大雪压弯了枝，路上一脚一个深窝。" },

  /* 12. 小雪 ——初冬薄雪，浪漫 */
  { id:"lightsnow", name:"小雪", emoji:"🌨️", severe:false,
    seasonW:[1,0,2,5], regions:["冰雪","塞北","面食","高寒"],
    effect:{ mood:1, health:0, stress:0 },
    note:"零星雪花落在肩头，一抬头就化了。" },

  /* 13. 雾霾 ——极端，工矿与冬季高发 */
  { id:"smog", name:"雾霾", emoji:"🌫️", severe:true,
    seasonW:[2,1,4,5], regions:["重工","煤城","煤矿","钢城","工厂","老工业","油田"],
    effect:{ mood:-1, health:-2, stress:1 },
    note:"灰蒙蒙一片，能见度低得连对面楼都看不清。" },

  /* 14. 大风 ——常态强风 */
  { id:"gale", name:"大风", emoji:"🌬️", severe:false,
    seasonW:[5,2,4,3], regions:["塞北","荒原","海港","渔港","草原","戈壁"],
    effect:{ mood:0, health:0, stress:1 },
    note:"风大得人都要被掀着走，招牌哗啦啦响。" },

  /* 15. 台风 ——极端，沿海夏秋 */
  { id:"typhoon", name:"台风", emoji:"🌀", severe:true,
    seasonW:[0,5,4,0], regions:["海港","渔港","码头","海岛","港城","海滨","侨乡","岭南","椰林","渔村","出海"],
    effect:{ mood:-2, health:-1, stress:2 },
    note:"台风过境，整座城都被按了暂停键。" },

  /* 16. 沙尘暴 ——极端，北方西域春季 */
  { id:"sandstorm", name:"沙尘暴", emoji:"🌪️", severe:true,
    seasonW:[6,1,2,1], regions:["塞北","戈壁","旱塬","荒原","丝路","绿洲","西域","黄土","风沙","沙地"],
    effect:{ mood:-1, health:-2, stress:1 },
    note:"黄沙漫天，张嘴都是一口土，天色昏黄如末日。" },

  /* 17. 回南天 ——南方潮湿，墙地返潮 */
  { id:"humidback", name:"回南天", emoji:"💧", severe:false,
    seasonW:[6,2,1,1], regions:["岭南","水乡","海港","港城","侨乡","椰林","热带"],
    effect:{ mood:-1, health:0, stress:1 },
    note:"墙壁地板全在冒水珠，衣服晾三天还是潮的。" },

  /* 18. 秋高气爽 ——秋季最佳出游天 */
  { id:"crispautumn", name:"秋高气爽", emoji:"🍁", severe:false,
    seasonW:[0,0,6,0], regions:null,
    effect:{ mood:2, health:1, stress:-1 },
    note:"天高云淡，凉风正好，最适合出门走走。" },

  /* 19. 春暖花开 ——春季萌动的好日子 */
  { id:"springbloom", name:"春暖花开", emoji:"🌸", severe:false,
    seasonW:[6,0,0,0], regions:null,
    effect:{ mood:2, health:1, stress:-1 },
    note:"草长莺飞，连空气里都是要发生点什么的味道。" }
];

/* 季节：0春 1夏 2秋 3冬，由周序推算（52 周一年，每季 13 周） */
function seasonOf(s){ var w=((s&&s.week)||0)%52; return w<13?0:w<26?1:w<39?2:3; }

/* 生成一天的天气：按当季权重 + 玩家所在地域(读 s.birthplace.origin.tags) 加权后随机 */
function genDayWeather(s){
  var sea=seasonOf(s);
  var tags=(s&&s.birthplace&&s.birthplace.origin&&s.birthplace.origin.tags)||[];
  var pool=[];
  for(var i=0;i<WEATHERS.length;i++){
    var w=WEATHERS[i];
    var wt=(w.seasonW&&w.seasonW[sea])||0;
    if(w.regions){
      var hit=w.regions.some(function(r){return tags.indexOf(r)>=0;});
      wt = hit ? wt+2 : Math.max(0, wt-3);
    }
    for(var k=0;k<wt;k++) pool.push(w);
  }
  if(!pool.length) return WEATHERS[0];
  return pool[Math.floor(Math.random()*pool.length)];
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { WEATHERS: WEATHERS, seasonOf: seasonOf, genDayWeather: genDayWeather };
}
