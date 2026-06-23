"use strict";
/* =====================================================================
 * content/main-arc-hometown.js —— 县城返乡创业线
 * 主题：逃离之后再回来，是失败，还是另一种胜利。
 * 社会摩擦：城市履历回到县城会变成光环，也会被人情一点点吞掉。
 * 关键变量：乡村振兴、文旅风口、直播带货、银发经济。
 * ===================================================================== */
registerMainArc("hometown_return", {
  name: "县城返乡创业线",
  theme: "逃离之后再回来，是失败，还是另一种胜利。",
  friction: "城市履历回到县城会变成光环，也会被人情一点点吞掉。",
  weight: 2,
  worldKeys: ["rural", "tourism", "livestream", "silver"],
  industries: ["food", "silver", "content"],
  startCond: s => s.goal === "peace",
  initCast: s => {
    addCastMember(s, "father", { name: "父亲", role: "父亲", industry: "food", trust: 60, pressure: 50 });
    addCastMember(s, "buddy", { name: "二柱", role: "发小合伙人", industry: "food", trust: 65, pressure: 30 });
    addCastMember(s, "official", { name: "镇长", role: "镇领导", industry: "silver", trust: 35, pressure: 55 });
    addCastMember(s, "love", { name: "晓梅", role: "返乡伴侣", industry: "content", trust: 55, pressure: 25 });
  },
  acts: [
    { evid: "marc_hometown_1", minAge: 24, title: "大城市待不下去了" },
    { evid: "marc_hometown_2", minAge: 30, title: "回到那个小县城" },
    { evid: "marc_hometown_3", minAge: 36, title: "人情与生意的纠缠" },
    { evid: "marc_hometown_4", minAge: 42, title: "直播带货与文旅风口" },
    { evid: "marc_hometown_5", minAge: 50, title: "把根扎回故土" }
  ],
  reckon: s => {
    const rooted = arcChose(s, "home_root");
    const region = arcChose(s, "home_region_industry");
    const fledAgain = arcChose(s, "home_flee_again");
    const failedSoft = arcChose(s, "home_bust_soft");
    if (region) return "你把一个县城的特产做成了产业，带活了一方人。逢年过节满桌都是来敬酒的乡亲，可你也成了那张关系网的中心——再没有谁敢跟你说真话。衣锦还乡是真的，回不去当年那个能在城市里隐姓埋名的自己，也是真的。";
    if (rooted) return "店开起来了，根也扎下了。你早晨陪父亲喝茶，晚上和晓梅在江边散步。生意不算大，人情债却也压不垮——你终于学会了在这张网里，给自己留一条缝隙呼吸。";
    if (fledAgain) return "你还是走了。县城像一件穿小了的旧衣，你套不回去。可这一次离开，你心里清楚：不是逃，是知道了自己属于哪里。故乡成了你回得去的远方。";
    if (failedSoft) return "创业那摊子最终黄了，欠下的人情比欠下的钱还难还。但你陪父亲走完了最后那几年，和晓梅守着一间小铺，日子慢得能听见时间走路。账面上你输了，心里那本账，你不亏。";
    return "你在城市与县城之间来回了大半生，哪边都没有彻底属于。也许人这一辈子，本就没有一个叫「家」的标准答案。";
  }
});

EVENTS.push(
  {
    id: "marc_hometown_1", module: "mainarc", importance: "arc", arc: "hometown_return",
    title: "📖 第一幕 · 大城市待不下去了",
    text: s => `合租屋的隔断墙又薄又冷，加班到深夜回来，泡面的热气糊在结霜的窗上。手机里${castName(s, "father", "父亲")}的语音躺了三天没点开——你知道里面无非又是「身体咋样」「啥时候回来」。这座城市给过你光，但从没真正给过你一张床。`,
    choices: [
      { label: "再咬牙撑一撑，城市总有出头那天", effect: s => { arcChoose(s, "home_stay_city", { tension: 6, memory: { id: "home_grind_city", intensity: 45, text: "你不甘心就这么灰溜溜地回去。" } }); add(s, "stress", 8); add(s, "health", -3); return "你把那条语音又划了回去，关掉屏幕。「再撑一年」，这句话你已经对自己说了第五年。"; } },
      { label: "动了回县城的念头，先打听打听老家行情", effect: s => { arcChoose(s, "home_scout", { tension: 4, memory: { id: "home_thinking", intensity: 40, text: "你开始认真盘算：回去，到底是不是认输。" } }); add(s, "insight", 2); if (typeof addExperience === "function") addExperience(s, "bigtech"); return "你在群里问发小老家现在啥光景。二柱秒回：「回来啊！你在大城市混过，回来就是人才！」这句话，意外地戳中了你。"; } },
      { label: "给父亲回个电话，听听他怎么说", effect: s => { const f = castName(s, "father", "父亲"); bumpThread(s, "family_bond", 10, { actors: ["father"] }); arcChoose(s, "home_call_dad", { tension: -2 }); add(s, "mood", 5); return `${f}在电话那头沉默了很久，才慢慢说：「在外面累了，家里有口饭。」他没催你，可正是这份不催，让你眼眶热了。`; } }
    ]
  },
  {
    id: "marc_hometown_2", module: "mainarc", importance: "turning", arc: "hometown_return",
    title: "📖 第二幕 · 回到那个小县城",
    text: s => `大巴拐进熟悉的县道，路边的招牌还是那几家。你拖着行李箱站在镇口，发小${castName(s, "buddy", "二柱")}老远就喊：「大城市回来的能人！」一句话，半条街的人都回头看你。在这里，你那段城市履历不是简历上的一行字，是会发光的招牌。`,
    choices: [
      { label: "用城市那套打法，开个像样的店", effect: s => { const b = castName(s, "buddy", "二柱"); arcChoose(s, "home_open_shop", { tension: 10, memory: { id: "home_first_shop", intensity: 60, text: "你把城市里学的本事，第一次用在了故乡的土地上。", tags: ["arc", "turning"] } }); if (typeof addExperience === "function") addExperience(s, "founder"); flag(s, "home_business"); add(s, "stress", 6); add(s, "mood", 6); bumpThread(s, "buddy_pact", 16, { actors: ["buddy"], status: "open" }); const cost = Math.round(80000 * (s.world ? s.world.priceIndex : 1)); add(s, "cash", -cost); s.timeline.push({ age: s.age, text: `你回县城开了第一家店，和${b}合伙。城里人看你是退守，县城人看你是衣锦还乡。` }); return `你和${b}盘下镇上最好的铺面。装修、选品、做活动，你那套打法在县城像降维打击——开业头天，挤满了来看「能人」的乡亲。`; } },
      { label: "先进体制内/镇上谋个稳定差事", effect: s => { const o = castName(s, "official", "镇长"); arcChoose(s, "home_in_system", { tension: 2, memory: { id: "home_system", intensity: 40, text: "你选了一条稳的路，把锋芒收了起来。" } }); bumpThread(s, "official_tie", 12, { actors: ["official"] }); add(s, "mood", 3); add(s, "stress", -2); if (typeof addInfluence === "function" && typeof influenceTier === "function") addInfluence(s, "city", 4); return `${o}很欣赏你的履历，给你安排了个体面位置。喝茶、看报、应酬，日子稳得像一潭水——稳到你偶尔会怀念城市里那种被逼着往前跑的劲。`; } },
      { label: "暂不创业，先陪陪父亲、缓口气", effect: s => { const f = castName(s, "father", "父亲"); arcChoose(s, "home_rest", { tension: -4, memory: { id: "home_breathe", intensity: 35, text: "回家的头一年，你只想好好喘口气。" } }); bumpThread(s, "family_bond", 14, { actors: ["father"] }); add(s, "mood", 8); add(s, "health", 4); return `你陪${f}下棋、赶集、修老屋的漏雨。这些年你跑得太快，第一次发现，原来「什么都不干」也需要勇气。`; } }
    ]
  },
  {
    id: "marc_hometown_3", module: "mainarc", importance: "arc", arc: "hometown_return",
    title: "📖 第三幕 · 人情与生意的纠缠",
    text: s => `生意刚有点起色，麻烦也跟着来了。三舅家的小子要进店「随便干干」，远房表姐张口就要赊账，连${castName(s, "official", "镇长")}都暗示你「关照关照」镇里的供货商。${castName(s, "buddy", "二柱")}劝你：「乡里乡亲的，抹不开面子。」可你算过账——再这么下去，店就被人情吃空了。`,
    choices: [
      { label: "拉下脸来立规矩，亲戚熟人一视同仁", effect: s => { arcChoose(s, "home_rules", { tension: 12, memory: { id: "home_set_rules", intensity: 55, text: "你顶着「忘本」的骂名，给店立下了铁规矩。" } }); add(s, "reputation", 4); add(s, "stress", 7); add(s, "mood", -3); if (typeof addInfluence === "function" && typeof influenceTier === "function") addInfluence(s, "city", -3); return "你把赊账本一笔勾销，明码标价、亲兄弟明算账。背后有人说你「在外面待几年就变了」，可账面，第一次干净了。"; } },
      { label: "睁只眼闭只眼，人情先于规矩", effect: s => { const cost = Math.round(40000 * (s.world ? s.world.priceIndex : 1)); add(s, "cash", -cost); arcChoose(s, "home_owe_favor", { tension: 8, memory: { id: "home_favor_pit", intensity: 60, text: "你用真金白银，喂养着这张人情网。", tags: ["arc", "favor"] } }); bumpThread(s, "favor_debt", 20, { actors: ["buddy", "official"] }); add(s, "mood", 2); if (typeof addInfluence === "function" && typeof influenceTier === "function") addInfluence(s, "city", 5); return `你认了这笔糊涂账。亲戚高兴了，${castName(s, "official", "镇长")}也记你的好——你在镇上越来越「吃得开」，可那张网，也一寸寸缠紧了你的手脚。`; } },
      { label: "把人情变成生意：让亲戚入股一起干", cond: s => has(s, "home_business"), effect: s => { arcChoose(s, "home_clan_partner", { tension: 10, memory: { id: "home_clan_in", intensity: 50, text: "你试着把人情债，改写成股权和责任。" } }); bumpThread(s, "favor_debt", 10, { actors: ["buddy"] }); add(s, "insight", 2); add(s, "reputation", 2); if (typeof addInfluence === "function" && typeof influenceTier === "function") addInfluence(s, "city", 3); return "你拉着几个沾亲带故的入了股——要钱没有，出力可以。绑上利益，那些「随便干干」的人，第一次开始真把店当自己的。这一招，城里没人教过你。"; } }
    ]
  },
  {
    id: "marc_hometown_4", module: "mainarc", importance: "turning", arc: "hometown_return",
    title: "📖 第四幕 · 直播带货与文旅风口",
    text: s => {
      const live = (typeof industryState === "function") ? industryState(s, "content") : null;
      const silver = (typeof industryState === "function") ? industryState(s, "silver") : null;
      const hot = (live && live.heat != null) ? live.heat : (silver && silver.heat != null ? silver.heat : 50);
      const wind = hot >= 60 ? "风正大，村口的网红民宿一床难求，县里到处在喊「文旅兴县」。" : "风没那么大，可总有人在试，刷到半夜的助农直播里，也有同乡的脸。";
      return `${castName(s, "love", "晓梅")}举着手机冲进店里：「咱们的土特产，能上直播！」她说县里在推文旅，城里来的游客越来越多。${wind}你那点城市攒下的运营嗅觉，又痒了起来。`;
    },
    choices: [
      { label: "All in 直播+文旅，赌一把这阵风", effect: s => {
          const live = (typeof industryState === "function") ? industryState(s, "content") : null;
          const silver = (typeof industryState === "function") ? industryState(s, "silver") : null;
          const heat = Math.max((live && live.heat) || 0, (silver && silver.heat) || 0) || 50;
          const luck = (typeof luckBias === "function") ? luckBias(s) : 0;
          const win = rnd(0.35 + heat / 200 + luck);
          arcChoose(s, "home_ride_wind", { tension: 14, memory: { id: "home_wind_bet", intensity: 70, text: "你把身家压在了直播和文旅这阵风上。", tags: ["arc", "turning"] } });
          const cost = Math.round(150000 * (s.world ? s.world.priceIndex : 1)); add(s, "cash", -cost);
          bumpThread(s, "love_bond", 12, { actors: ["love"] });
          if (win) {
            const got = (typeof bigWindfall === "function") ? bigWindfall(s, 600000) : Math.round(1200000 * (s.world ? s.world.priceIndex : 1));
            add(s, "cash", got); flag(s, "home_wind_hit");
            if (typeof addInfluence === "function") addInfluence(s, "media", 6);
            if (typeof addExperience === "function") addExperience(s, "founder");
            s.timeline.push({ age: s.age, text: `你押中了文旅与直播的风口，土特产卖到了全国，到账 ¥${got.toLocaleString()}。` });
            return `${castName(s, "love", "晓梅")}的镜头里，你家的腊味、山货卖断了货，民宿排到了下个季度。这阵风，你接住了——到账 ¥${got.toLocaleString()}。县城第一次因为你，被外面的人记住了名字。`;
          }
          add(s, "stress", 10); arcChoose(s, "home_wind_miss", { tension: 6 });
          s.timeline.push({ age: s.age, text: "你重金压上的直播与文旅，没等来风口，反而成了别人退潮后的接盘者。" });
          return "货囤了一仓库，直播间却冷冷清清——你慢了半拍，风从你头顶吹过去了。¥" + cost.toLocaleString() + " 打了水漂，二柱看你的眼神，第一次有了犹豫。";
        } },
      { label: "稳着来：直播只做引流，根还是守着实体店", effect: s => { arcChoose(s, "home_steady_live", { tension: 4, memory: { id: "home_steady", intensity: 45, text: "你没赌风口，只把它当一个慢慢用的工具。" } }); add(s, "mood", 4); bumpThread(s, "love_bond", 10, { actors: ["love"] }); if (typeof addInfluence === "function") addInfluence(s, "city", 3); const got = Math.round(60000 * (s.world ? s.world.priceIndex : 1)); add(s, "cash", got); return `你让${castName(s, "love", "晓梅")}慢慢做账号，不冲量、不囤货。风口起落与你无关，店还是那家店，多了一条细水长流的进账 ¥${got.toLocaleString()}。`; } },
      { label: "不蹭风口，把品质和口碑做扎实", effect: s => { arcChoose(s, "home_craft", { tension: 2, memory: { id: "home_craft", intensity: 40, text: "你信的是手艺和回头客，不是热搜。" } }); add(s, "reputation", 6); add(s, "mood", 3); if (typeof addInfluence === "function") addInfluence(s, "city", 2); return "别人追着风口跑，你蹲在作坊里盯火候。风停了，跟风的店一家家关门，你的招牌却被老主顾一传十、十传百地立了起来。"; } }
    ]
  },
  {
    id: "marc_hometown_5", module: "mainarc", importance: "turning", arc: "hometown_return",
    title: "📖 第五幕 · 把根扎回故土",
    text: s => {
      const hit = has(s, "home_wind_hit");
      const f = castName(s, "father", "父亲");
      return hit
        ? `这些年，你的名字成了县里招商引资的一张名片。${castName(s, "official", "镇长")}三天两头来店里坐，年轻人排队想跟你干。可夜深人静时你也明白：你越是成了这片土地的中心，就越难抽身——${f}老了，走得很慢，而你，已经快记不清城市里那张床的样子。`
        : `折腾了大半辈子，到了该做个了断的年纪。${f}的身体一天不如一天，晓梅问你：「咱们，到底是留下，还是回城里？」镇口那条路，往里是故乡，往外是来路。`;
    },
    choices: [
      { label: "把根彻底扎下：守着店、守着家、守着这片土", effect: s => { const f = castName(s, "father", "父亲"); arcChoose(s, "home_root", { tension: -8, memory: { id: "home_rooted", intensity: 70, text: "你终于不再问「该不该回来」——这里就是你的根。", tags: ["arc", "turning"] } }); flag(s, "home_done"); bumpThread(s, "family_bond", 18, { actors: ["father", "love"] }); add(s, "mood", 10); add(s, "health", 3); s.timeline.push({ age: s.age, text: "你决定把根扎回故土，不再来回奔波。" }); return `你不走了。早上陪${f}喝头道茶，傍晚和晓梅在江边遛弯。那个曾经拼命想逃离的县城，成了你唯一想守住的地方。`; } },
      { label: "（影响力够）带动一方就业，把它做成县域产业", cond: s => (typeof influenceTier === "function" && influenceTier(s) >= 3), effect: s => {
          arcChoose(s, "home_region_industry", { tension: 16, memory: { id: "home_region", intensity: 85, text: "你不再只是开一家店，你在重塑一个县城的命运。", tags: ["arc", "world"] } });
          flag(s, "home_done"); flag(s, "home_root");
          const useSilver = arcChose(s, "home_in_system") || ((typeof industryState === "function") && industryState(s, "silver") && industryState(s, "silver").heat >= (industryState(s, "food") ? industryState(s, "food").heat : 0));
          const ind = useSilver ? "silver" : "food";
          if (typeof addWorldImpact === "function") addWorldImpact(s, { industry: ind, field: "regional", delta: 14, note: "你把一个县城的" + (ind === "silver" ? "银发康养" : "特产") + "做成了产业带" });
          if (typeof addInfluence === "function") { addInfluence(s, "city", 12); addInfluence(s, "policy", 6); }
          add(s, "reputation", 10);
          const got = (typeof bigWindfall === "function") ? bigWindfall(s, 1500000) : Math.round(4000000 * (s.world ? s.world.priceIndex : 1));
          add(s, "cash", got);
          s.timeline.push({ age: s.age, text: `你把家乡的${ind === "silver" ? "康养" : "特产"}做成了带动一方就业的县域产业，身价 ¥${got.toLocaleString()}。` });
          return `合作社、加工厂、电商仓，一条产业链从你这间小店里长了出来，养活了大半个镇的人。表彰大会上掌声雷动，可你站在台上忽然懂了——立规矩的人，第一个被规矩和这张人情网框住的，正是自己。`;
        } },
      { label: "把店交出去，自己还是回了城", effect: s => { const b = castName(s, "buddy", "二柱"); arcChoose(s, "home_flee_again", { tension: 10, memory: { id: "home_flee", intensity: 65, text: "你发现自己终究套不回这件穿小了的旧衣。", tags: ["arc", "turning"] } }); flag(s, "home_done"); bumpThread(s, "buddy_pact", -8, { actors: ["buddy"] }); add(s, "mood", -2); s.timeline.push({ age: s.age, text: `你把县城的生意交给了${b}，自己又回了城市。` }); return `你把店和那张人情网，一并交给了${b}。再次站上开往城市的大巴，你没回头——这一次走，你心里清楚得很：故乡，是用来回望的，不是用来困住的。`; } }
    ]
  }
);
