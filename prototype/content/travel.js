"use strict";
/* =====================================================================
 * content/travel.js —— 旅游子系统（v1.0）
 * 旧版「旅游」点一下就回血。新版：选目的地(国家+城市) → 选天数 → 进入【旅途】专属界面，
 * 一天天玩：每天自己挑「今天怎么过」(看景/美食/夜生活/漫步)，触发见闻、艳遇、机遇、小插曲。
 * 有时间限制（选几天就几天）；最大好处是【心情爆棚】，还会涨见识、消解压力，偶尔撞上机遇。
 * 仅用全局 helper：add/flag/has/rnd/pick。读写 s（及临时的 s.trip）。
 * ===================================================================== */

// 行程时长选项：天数 + 每日开销倍率（住越久越摊薄一点）+ 一句卖点
var TRIP_PLANS = [
  { days: 3, name: "周末快闪", costMul: 1.0, blurb: "三天两夜，逃离一下" },
  { days: 7, name: "深度游", costMul: 0.92, blurb: "一周，玩得透一点" },
  { days: 15, name: "长途旅居", costMul: 0.82, blurb: "半个月，把自己彻底放空" }
];

// 每天可选的「今天怎么过」
var TRAVEL_ACTS = [
  { id: "sight", emoji: "🏞️", label: "逛景点 · 看风景" },
  { id: "food", emoji: "🍜", label: "扫街 · 尝当地美食" },
  { id: "night", emoji: "🌃", label: "泡夜生活 · 酒吧/夜市" },
  { id: "wander", emoji: "🚶", label: "随性漫步 · City Walk" }
];

// 每天预估开销（用于行程总价）：国外贵、城市花销越高越贵
function tripDayCost(s, city) {
  var abroad = city && city.country && city.country !== "cn" && city.country !== "hk";
  var base = abroad ? 3200 : 1100;
  return Math.round(base * (city ? Math.max(0.6, city.cost || 1) : 1) * (s.world ? s.world.priceIndex : 1));
}
function tripTotalCost(s, city, plan) { return Math.round(tripDayCost(s, city) * plan.days * plan.costMul); }

// —— 见闻池：kind 对应活动；scope: any/abroad/domestic；chance=机遇；w=权重 ——
// fx(s, trip) 施加额外效果并可返回一句追加文案；mood 为该见闻的基础心情收益。
var TRAVEL_BEATS = [
  // 🏞️ 看景
  { id: "sight_peak", kind: "sight", scope: "any", w: 3, mood: 8, text: "你爬上观景台，整座城/山海铺在脚下。风很大，人很小，烦恼忽然也变得很小。", fx: function (s) { add(s, "insight", 1); add(s, "stress", -6); } },
  { id: "sight_oldtown", kind: "sight", scope: "any", w: 3, mood: 7, text: "青石板的老街绕来绕去，每个拐角都藏着一段别人的故事。你慢慢走，慢慢看。", fx: function (s) { add(s, "insight", 1); } },
  { id: "sight_museum", kind: "sight", scope: "any", w: 2, mood: 6, text: "你在博物馆/美术馆泡了一下午，被一件几百年前的东西看得出神。见识，是这么一点点撑大的。", fx: function (s) { add(s, "knowledge", 1); add(s, "insight", 1); } },
  { id: "sight_abroad_icon", kind: "sight", scope: "abroad", w: 3, mood: 10, text: "你终于站在了那个只在屏幕里见过的地标面前。原来它真的存在，原来你真的来了。", fx: function (s) { add(s, "insight", 2); add(s, "charm", 1); } },
  { id: "sight_nature", kind: "sight", scope: "any", w: 2, mood: 9, text: "雪山/大海/草原在眼前展开，大得让人说不出话。你拍了很多照片，又觉得照片装不下。", fx: function (s) { add(s, "health", 2); add(s, "stress", -8); } },

  // 🍜 美食
  { id: "food_street", kind: "food", scope: "any", w: 3, mood: 8, text: "你一头扎进当地夜市/小吃街，从街头吃到街尾，撑到走不动路，幸福也撑得满满的。", fx: function (s) { add(s, "health", 1); add(s, "stress", -4); } },
  { id: "food_local", kind: "food", scope: "any", w: 3, mood: 7, text: "听本地人推荐，钻进一家招牌都看不懂的小馆子，端上来的味道让你当场决定明天还来。" },
  { id: "food_abroad", kind: "food", scope: "abroad", w: 3, mood: 9, text: "你磕磕绊绊点了一桌看不懂名字的菜，有的踩雷有的封神。异国的胃口冒险，本身就是旅行。", fx: function (s) { add(s, "insight", 1); } },
  { id: "food_marketcook", kind: "food", scope: "any", w: 1, mood: 7, text: "你在菜市场跟摊主比划着买了食材，回民宿自己折腾了一顿。粗糙，但热气腾腾。", fx: function (s) { add(s, "health", 2); } },

  // 🌃 夜生活
  { id: "night_bar", kind: "night", scope: "any", w: 3, mood: 9, text: "你在一家没人认识你的酒吧坐到很晚，和邻座的陌生人碰杯、聊天，谁也不问对方的来历。", fx: function (s) { add(s, "charm", 1); add(s, "stress", -6); } },
  { id: "night_market", kind: "night", scope: "any", w: 2, mood: 8, text: "夜市的霓虹和叫卖声把你裹住，你买了一堆用不上的小玩意儿，笑得像个孩子。" },
  { id: "night_live", kind: "night", scope: "any", w: 2, mood: 9, text: "你撞进一场街头演出/小型 live，跟着完全不认识的人群一起蹦、一起喊，嗓子哑了，心却轻了。", fx: function (s) { add(s, "stress", -8); } },
  { id: "night_abroad_party", kind: "night", scope: "abroad", w: 2, mood: 10, text: "异国的派对/酒馆里语言不通，但音乐和酒精是通用的。你比划着、大笑着，过了荒诞又快乐的一夜。", fx: function (s) { add(s, "charm", 2); } },

  // 🚶 漫步
  { id: "wander_aimless", kind: "wander", scope: "any", w: 3, mood: 7, text: "你没有目的地，跟着感觉拐进一条又一条小巷。迷路也不慌——反正没人等你，怎么走都是对的。", fx: function (s) { add(s, "stress", -6); add(s, "insight", 1); } },
  { id: "wander_cafe", kind: "wander", scope: "any", w: 2, mood: 7, text: "你在一家临街咖啡馆坐了一下午，看人来人往，发了很久的呆。难得地，脑子里一片空白。", fx: function (s) { add(s, "stress", -7); } },
  { id: "wander_temple", kind: "wander", scope: "any", w: 1, mood: 6, text: "你走进一座安静的寺庙/教堂，光从高窗斜下来。你不信什么，但那一刻确实静了下来。", fx: function (s) { add(s, "mind", 1); add(s, "stress", -5); } },
  { id: "wander_sunset", kind: "wander", scope: "any", w: 2, mood: 9, text: "你赶在日落前到了海边/江边，看天一点点烧红又熄灭。有些风景，挤再多时间来看都值。", fx: function (s) { add(s, "health", 1); add(s, "stress", -7); } },

  // ✨ 机遇 / 奇遇（低权重，跨 kind 随机插入；旅途最大的意外之喜）
  { id: "chance_lead", kind: "any", scope: "any", w: 1.0, chance: true, mood: 8, text: "你和邻座/同住的旅人越聊越投机，对方递来一张名片：「回头联系，说不定能合作。」旅途偶遇，埋下一条说不清的机会。", fx: function (s) { flag(s, "got_lead"); add(s, "network", 3); } },
  { id: "chance_wind", kind: "any", scope: "any", w: 1.0, chance: true, mood: 7, text: "在别处的街头，你看见了家乡还没流行起来的东西——某种生意、某种玩法。你心里咯噔一下：这阵风，迟早会吹回去。", fx: function (s) { flag(s, "wind_hint"); add(s, "insight", 2); } },
  { id: "chance_crush", kind: "any", scope: "any", w: 0.9, chance: true, mood: 12, text: "旅途总容易让人卸下防备。你和一个同样在路上的人对上了眼，临别时 ta 把联系方式写在你的车票背面：「下次……换个城市见？」", cond: function (s) { return !has(s, "married") && !has(s, "partner") && !s.crush; }, fx: function (s) { if (typeof makeCrush === "function") s.crush = makeCrush(s); add(s, "charm", 2); } },
  { id: "chance_inspire", kind: "any", scope: "any", w: 1.0, chance: true, mood: 9, text: "在路上的某个瞬间——一段对话、一片风景、一个陌生人的活法——你忽然想通了一直拧巴的事。回去之后，你想换种活法了。", fx: function (s) { add(s, "insight", 2); add(s, "mind", 1); flag(s, "travel_inspired"); } },

  // 🙃 小插曲（轻微倒霉，但不毁兴致）
  { id: "mishap_rain", kind: "any", scope: "any", w: 0.8, mood: 4, text: "计划好的行程被一场大雨/罢工/排长队搅黄了。你索性窝在民宿听了一下午雨——旅行嘛，意外也是风景。", fx: function (s) { add(s, "stress", -3); } },
  { id: "mishap_scam", kind: "any", scope: "any", w: 0.6, mood: 3, text: "你还是着了道：被宰了一笔、买到了假货，或被「热情」带进了购物店。肉疼，但也算交了见世面的学费。", fx: function (s) { add(s, "cash", -Math.round(300 + Math.random() * 1200)); add(s, "insight", 1); } }
];

function _tripAbroad(city) { return !!(city && city.country && city.country !== "cn" && city.country !== "hk"); }

// 抽一条今天的见闻：按所选活动(actId)匹配 kind，加上跨 kind 的机遇/插曲，按权重&条件&去重抽取。
function drawTravelBeat(s, trip, actId) {
  var abroad = trip && trip.abroad;
  var seen = (trip && trip._seen) || {};
  var pool = TRAVEL_BEATS.filter(function (b) {
    if (b.kind !== "any" && b.kind !== actId) return false;
    if (b.scope === "abroad" && !abroad) return false;
    if (b.scope === "domestic" && abroad) return false;
    if (b.cond) { try { if (!b.cond(s)) return false; } catch (e) { return false; } }
    if (seen[b.id] && !b.chance) return false;   // 普通见闻一趟不重复；机遇可重复但权重低
    return true;
  });
  if (!pool.length) pool = TRAVEL_BEATS.filter(function (b) { return b.kind === "any" || b.kind === actId; });
  var total = pool.reduce(function (a, b) { return a + (b.w || 1); }, 0);
  var r = Math.random() * total, chosen = pool[pool.length - 1];
  for (var i = 0; i < pool.length; i++) { r -= (pool[i].w || 1); if (r <= 0) { chosen = pool[i]; break; } }
  return chosen;
}

// —— 留学目的地：选国家 → 选具体院校。tier=声望(1普通/2不错/3名校)；costMul=学费/生活费倍率；
//    名校毕业回报高(声誉/学识/起手 GPA)，但更烧钱、更卷。lang=该国语言难度对融入的初始影响。
var STUDY_DESTS = [
  { country: "us", flag: "🇺🇸", name: "美国", langHard: 0, schools: [
    { name: "北境州立大学", tier: 2, costMul: 1.55, blurb: "公立大校，性价比尚可，球赛派对样样不缺" },
    { name: "硅谷理工学院", tier: 3, costMul: 2.0, blurb: "工程强校，紧挨科技公司，实习机会扎堆" },
    { name: "常春藤·凯尔顿", tier: 3, costMul: 2.4, blurb: "藤校光环，烧钱也烧脑，履历镀一层金" } ] },
  { country: "uk", flag: "🇬🇧", name: "英国", langHard: 0, schools: [
    { name: "北方红砖大学", tier: 2, costMul: 1.4, blurb: "老牌红砖，一年制硕士，快进快出" },
    { name: "雾都学院", tier: 3, costMul: 1.9, blurb: "G5 级名校，光是名字就能在简历上发光" } ] },
  { country: "au", flag: "🇦🇺", name: "澳大利亚", langHard: 0, schools: [
    { name: "南十字大学", tier: 2, costMul: 1.35, blurb: "阳光海滩 + 移民友好，留下来不算难" },
    { name: "海港理工", tier: 2, costMul: 1.3, blurb: "实用导向，打工度假两不误" } ] },
  { country: "ca", flag: "🇨🇦", name: "加拿大", langHard: 0, schools: [
    { name: "枫叶大学", tier: 2, costMul: 1.3, blurb: "环境宜居、移民路径清晰，性价比之选" },
    { name: "北境学院", tier: 2, costMul: 1.15, blurb: "学院路线便宜务实，主打一个落地" } ] },
  { country: "jp", flag: "🇯🇵", name: "日本", langHard: 6, schools: [
    { name: "东瀛大学", tier: 3, costMul: 1.2, blurb: "亚洲顶尖，性价比高，语言关是道坎" },
    { name: "樱花工业大学", tier: 2, costMul: 0.95, blurb: "工科扎实，离动漫和便利店都很近" } ] },
  { country: "sg", flag: "🇸🇬", name: "新加坡", langHard: 0, schools: [
    { name: "狮城国立大学", tier: 3, costMul: 1.35, blurb: "亚洲第一梯队，离家近、英文授课、卷出新高度" },
    { name: "南洋理工", tier: 3, costMul: 1.3, blurb: "理工强校，花园校园，转码圣地" } ] }
];

if (typeof window !== "undefined") {
  window.TRAVEL = { TRIP_PLANS: TRIP_PLANS, TRAVEL_ACTS: TRAVEL_ACTS, TRAVEL_BEATS: TRAVEL_BEATS, drawTravelBeat: drawTravelBeat, tripDayCost: tripDayCost, tripTotalCost: tripTotalCost };
  window.STUDY_DESTS = STUDY_DESTS;
}
