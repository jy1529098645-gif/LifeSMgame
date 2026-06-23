"use strict";
/* =====================================================================
 * content/events-persona.js —— 「性格驱动剧情」对白事件（模块）
 * ---------------------------------------------------------------------
 * 目标：同一件事，遇到不同性格的 NPC，对白与结果截然不同。
 * 机制：先从社交圈里挑一个有 persona 的 NPC（psn_pick），再用全局
 *       personaBucket(npc.persona) 把性格归为 5 类行为倾向分支：
 *   helper      热心助人/重情义 —— 雪中送炭、够意思
 *   calc        精算交易       —— 帮也要算清账、要利息好处
 *   fairweather 见风使舵       —— 你风光时热络、落魄时跑得快、爱传话
 *   aloof       清高避世/爱说教 —— 清高、泼冷水或长篇说教，偶尔默默相助
 *   plain       中庸老实       —— 随大流、帮力所能及
 * 一致性：cond 通过后用 s._psnPick 缓存同一个 NPC，让 text 与 dynamicChoices
 *        针对同一个人（s._psnPick 仅临时缓存，无副作用）。
 * 全局 helper（add/flag/has/pick/classTier/socialBoostRole/personaBucket）直接可用。
 * ===================================================================== */

// 从社交圈里随机挑一个有 persona 的 NPC
function psn_pick(s) { return pick((s.social || []).filter(n => n.persona)); }
// 取本事件已缓存的 NPC（无则现挑一个，保证不报错）
function psn_cur(s) { return s._psnPick || (s._psnPick = psn_pick(s)) || psn_pick(s); }
// 你眼下是否「混得风光」（见风使舵者据此变脸）
function psn_rich(s) { return (s.cash || 0) > 60000 || classTier(s) >= 2; }

EVENTS.push(

  /* 1. 向人开口借钱 / 周转 ------------------------------------------------ */
  {
    id: "ev_psn_borrow", module: "relation", ambient: true,
    cond: (s) => s.age >= 20 && (s.social || []).some(n => n.persona),
    title: "💸 手头紧，向人开口",
    text: (s) => { s._psnPick = psn_pick(s); var n = s._psnPick; if (!n) return "你想找人周转，却发现通讯录里竟没一个能开口的。";
      return "这个月窟窿太大，你犹豫再三，还是点开了" + n.role + "「" + n.name + "」的对话框。ta 是个" + n.persona.name + "的人——" + n.persona.quirk; },
    dynamicChoices: (s) => {
      var n = psn_cur(s);
      return [
        { label: "硬着头皮，开口借两万周转", effect: (s) => { var b = personaBucket(n.persona);
            if (b === "helper") { add(s, "cash", 20000); socialBoostRole(s, n.role, 6); return n.name + "二话不说就把钱转了过来：" + n.persona.quirk + "“先拿去用，不急着还。”讲义气的人，关键时候真能救命。"; }
            if (b === "calc") { add(s, "cash", 20000); add(s, "stress", 3); socialBoostRole(s, n.role, 1); return n.name + "借是借了，可白纸黑字写了借条、约好了利息：" + n.persona.quirk + "亲兄弟也得明算账——情面归情面，账归账。"; }
            if (b === "fairweather") { if (psn_rich(s)) { add(s, "cash", 20000); socialBoostRole(s, n.role, 3); return n.name + "见你最近混得不差，爽快地借了，还顺势套了套近乎，话里话外想沾点光。"; } add(s, "mood", -4); socialBoostRole(s, n.role, -3); return n.name + "打着哈哈跟你装穷，左一句右一句地哭起了自己的难处。" + n.persona.quirk + "——你听懂了，这是不想借。"; }
            if (b === "aloof") { add(s, "cash", 10000); add(s, "insight", 2); return n.name + "先把你数落了一通，说你不会过日子、活该缺钱，末了却还是默默塞来一万：" + n.persona.quirk; }
            add(s, "cash", 8000); socialBoostRole(s, n.role, 2); return n.name + "挠挠头，把手头不多的余钱匀了点给你，能帮的就这些了。"; } },
        { label: "话到嘴边又咽了回去", effect: (s) => { add(s, "stress", 2); return "你删掉打了一半的字，决定再扛一扛。开口借钱这件事，比想象中难太多了。"; } }
      ];
    }
  },

  /* 2. 升职 / 发财，分享喜讯 ---------------------------------------------- */
  {
    id: "ev_psn_goodnews", module: "relation", ambient: true,
    cond: (s) => s.age >= 22 && (s.social || []).some(n => n.persona),
    title: "🎉 有了好消息，想分享",
    text: (s) => { s._psnPick = psn_pick(s); var n = s._psnPick; if (!n) return "你想跟人分享喜讯，却一时不知道发给谁。";
      return "你升了职（也可能是发了笔小财），喜悦憋不住，第一个想到了" + n.role + "「" + n.name + "」。ta 一向" + n.persona.desc; },
    dynamicChoices: (s) => {
      var n = psn_cur(s);
      return [
        { label: "把喜讯一五一十告诉 ta", effect: (s) => { var b = personaBucket(n.persona);
            if (b === "helper") { add(s, "mood", 6); socialBoostRole(s, n.role, 4); return n.name + "比你还高兴，连说要给你庆功：" + n.persona.quirk + "“走，今晚我请，必须好好喝一顿！”这份真心实意，最是难得。"; }
            if (b === "calc") { add(s, "insight", 1); return n.name + "笑着道喜，话锋一转就盘算开了：“升了职是不是该换辆车？要不要顺手帮我牵个线？”每句祝福背后，都连着一笔账。"; }
            if (b === "fairweather") { add(s, "network", 4); socialBoostRole(s, n.role, 5); return n.name + "一听你起来了，态度热络得不行，朋友圈第一个点赞，还张罗着要拉你进个“高端局”。" + n.persona.quirk; }
            if (b === "aloof") { add(s, "mood", -3); add(s, "insight", 2); return n.name + "淡淡地“哦”了一声，顺手泼来一盆冷水：" + n.persona.quirk + "“别得意太早，爬得高摔得也疼。”——扫兴，却也不无道理。"; }
            add(s, "mood", 3); socialBoostRole(s, n.role, 2); return n.name + "实实在在替你高兴，憨憨地说了句“那挺好的，恭喜啊”，没什么花样，却很暖。"; } },
        { label: "算了，闷声发大财", effect: (s) => { add(s, "insight", 1); return "你想起“财不外露”的老话，把到嘴边的炫耀又收了回去。有些喜悦，自己知道就够了。"; } }
      ];
    }
  },

  /* 3. 失业 / 落难，看谁伸手 ---------------------------------------------- */
  {
    id: "ev_psn_downfall", module: "relation", ambient: true,
    cond: (s) => s.age >= 22 && !has(s, "employed") && !has(s, "startup") && (s.social || []).some(n => n.persona),
    title: "🌧️ 落难时，看人心",
    text: (s) => { s._psnPick = psn_pick(s); var n = s._psnPick; if (!n) return "失意的日子，你窝在出租屋里，谁也不想见。";
      return "你丢了工作，手头也紧，整个人灰头土脸。这天" + n.role + "「" + n.name + "」恰好知道了你的处境。ta 是个" + n.persona.name + "的人。"; },
    dynamicChoices: (s) => {
      var n = psn_cur(s);
      return [
        { label: "看 ta 会作何反应", next: (s) => { var b = personaBucket(n.persona);
            if (b === "helper") return {
              text: () => n.name + "二话不说赶了过来，进门先塞给你一个鼓囊囊的信封：" + n.persona.quirk,
              choices: [
                { label: "推辞不过，收下这份情", effect: (s) => { add(s, "cash", 8000); add(s, "mood", 8); socialBoostRole(s, n.role, 8); return "“拿着！谁还没个难处。”" + n.name + "拍着你肩膀。雪中送炭的这点暖，你记一辈子。"; } },
                { label: "钱不收，只接受 ta 的陪伴", effect: (s) => { add(s, "mood", 6); socialBoostRole(s, n.role, 6); return n.name + "陪你喝了顿大酒，把你骂醒又把你扶起。钱没要，可这份情比钱重。"; } }
              ] };
            if (b === "fairweather") return {
              text: () => n.name + "听说你落了难，回消息明显冷淡了，约 ta 见面也总推三阻四。" + n.persona.quirk,
              choices: [
                { label: "再试探一次，约 ta 吃饭", effect: (s) => { add(s, "mood", -5); socialBoostRole(s, n.role, -6); return n.name + "找了个借口爽约，朋友圈却照样和那些“有头有脸”的人热络。树倒猢狲散，你算是看明白了。"; } },
                { label: "心里有数，默默拉黑", effect: (s) => { add(s, "insight", 2); add(s, "stress", -2); return "你不再自讨没趣，悄悄把 ta 折叠了。落难时谁真谁假，一眼就清。"; } }
              ] };
            if (b === "aloof") return {
              text: () => n.name + "没什么安慰的话，劈头先是一通说教，嫌你当初不听劝。" + n.persona.quirk,
              choices: [
                { label: "耐着性子听 ta 讲完", effect: (s) => { add(s, "insight", 3); add(s, "mood", -2); return "唠叨了半天，临走 ta 却塞给你一张写满门路的纸条：“别谢，自己争气。”面冷心热，说的就是这种人。"; } },
                { label: "听不下去，转身就走", effect: (s) => { add(s, "stress", 3); socialBoostRole(s, n.role, -3); return "你受不了这股居高临下的劲，甩门而去。ta 在身后摇头叹气，从此懒得再管你。"; } }
              ] };
            if (b === "calc") return {
              text: () => n.name + "倒是来看你了，只是话里话外在掂量：帮你这一把，将来能不能有回报。" + n.persona.quirk,
              choices: [
                { label: "答应日后必有回报", effect: (s) => { add(s, "cash", 5000); add(s, "stress", 2); return n.name + "见你识相，借了点周转钱给你，还顺手把条件谈得明明白白。帮是帮了，可你心里不是滋味。"; } },
                { label: "不愿欠人情，婉拒", effect: (s) => { add(s, "mood", -2); return "你听出了那股算计味，笑着回绝。ta 也不勉强，转身就走——这世道，本就如此。"; } }
              ] };
            return {
              text: () => n.name + "嘴笨，不知道怎么安慰你，只是默默来陪着，帮你跑前跑后投简历。" + n.persona.quirk,
              choices: [
                { label: "谢谢这份笨拙的好", effect: (s) => { add(s, "mood", 5); socialBoostRole(s, n.role, 4); return n.name + "话不多，事却做得实在。这种老实人的好，平时不显，落难时才知道金贵。"; } }
              ] };
          } }
      ];
    }
  },

  /* 4. 拉 ta 合伙 / 搭伙做事 ---------------------------------------------- */
  {
    id: "ev_psn_partner", module: "relation", ambient: true,
    cond: (s) => s.age >= 23 && (s.social || []).some(n => n.persona),
    title: "🤝 想拉 ta 一起干",
    text: (s) => { s._psnPick = psn_pick(s); var n = s._psnPick; if (!n) return "你想找个搭档一起做事，却没个合适的人选。";
      return "你手上有个想法，缺个搭档。盘算一圈，你想到了" + n.role + "「" + n.name + "」——ta 一向" + n.persona.desc; },
    dynamicChoices: (s) => {
      var n = psn_cur(s);
      return [
        { label: "约 ta 出来，谈谈合伙", effect: (s) => { var b = personaBucket(n.persona);
            if (b === "helper") { add(s, "network", 5); add(s, "mood", 4); socialBoostRole(s, n.role, 5); return n.name + "听完一拍大腿就答应了：" + n.persona.quirk + "钱啊力啊都先不计较，先把事干起来再说。有这样的搭档，你心里踏实。"; }
            if (b === "calc") { add(s, "strategy", 2); add(s, "stress", 2); return n.name + "感兴趣是感兴趣，但先要把股权、分红、退出条款一条条抠清楚：" + n.persona.quirk + "丑话说在前头，倒也省了日后扯皮。"; }
            if (b === "fairweather") { add(s, "stress", 3); socialBoostRole(s, n.role, -1); return n.name + "嘴上答应得痛快，可你心里清楚：这人顺风时凑得最近，一旦项目不顺，跑得也最快。靠 ta，悬。"; }
            if (b === "aloof") { add(s, "insight", 2); add(s, "mood", -2); return n.name + "摆摆手，对你的计划挑了一堆毛病：" + n.persona.quirk + "“成不了。”——话难听，可有几条还真戳中了要害。"; }
            add(s, "network", 3); socialBoostRole(s, n.role, 3); return n.name + "老实巴交地说自己本事不大，但只要你信得过，让干啥就干啥，绝不偷奸耍滑。"; } },
        { label: "再想想，先不急着拉人", effect: (s) => { add(s, "strategy", 1); return "合伙是结仇的开始，你决定把想法再打磨打磨，不急着找人入伙。"; } }
      ];
    }
  },

  /* 5. 求 ta 帮忙托关系办事 ---------------------------------------------- */
  {
    id: "ev_psn_favor", module: "relation", ambient: true,
    cond: (s) => s.age >= 22 && (s.social || []).some(n => n.persona),
    title: "🛎️ 求人办事",
    text: (s) => { s._psnPick = psn_pick(s); var n = s._psnPick; if (!n) return "有件事卡了壳，你却找不到能帮上忙的人。";
      return "有件事得托关系才办得动。你想到了" + n.role + "「" + n.name + "」，ta 是个" + n.persona.name + "的人，不知道使不使得上劲。"; },
    dynamicChoices: (s) => {
      var n = psn_cur(s);
      return [
        { label: "登门求 ta 帮忙牵个线", next: (s) => { var b = personaBucket(n.persona);
            if (b === "fairweather") return {
              text: () => n.name + "最擅长的就是张罗人情，拍胸脯说包在 ta 身上。" + n.persona.quirk,
              choices: [
                { label: "递上礼，托 ta 周旋", effect: (s) => { add(s, "cash", -2000); add(s, "network", 5); flag(s, "got_lead"); return n.name + "八面玲珑，几通电话、几顿饭局，事儿还真办成了。这种人办事，就是利索。"; } },
                { label: "只口头拜托，不送礼", effect: (s) => { add(s, "mood", -2); return n.name + "笑脸照旧，却把你的事不咸不淡地搁置了。没好处的忙，ta 可不会真上心。"; } }
              ] };
            if (b === "helper") return {
              text: () => n.name + "听说你有难处，立马放下手里的事：" + n.persona.quirk,
              choices: [
                { label: "感激地把事托付给 ta", effect: (s) => { add(s, "network", 4); add(s, "mood", 4); socialBoostRole(s, n.role, 5); return n.name + "跑前跑后，搭人情、贴脸面，硬是替你把事办妥了，事后还不让你破费。这份仗义，得记着。"; } }
              ] };
            if (b === "plain") return {
              text: () => n.name + "为难地搓着手，这种弯弯绕绕的事，实在不是 ta 的强项。" + n.persona.quirk,
              choices: [
                { label: "理解，请 ta 尽力试试", effect: (s) => { if (rnd(0.35)) { add(s, "network", 2); return n.name + "笨拙却认真地帮你问了一圈，竟也歪打正着搭上了线。老实人，运气有时不差。"; } add(s, "stress", 2); return n.name + "实心实意跑了几趟，却没使上劲，反倒自己愧疚了半天。这种事，确实难为 ta 了。"; } }
              ] };
            if (b === "calc") return {
              text: () => n.name + "门路是有，可帮你之前，先要把“回报”谈明白。" + n.persona.quirk,
              choices: [
                { label: "答应给 ta 好处", effect: (s) => { add(s, "cash", -3000); add(s, "network", 3); flag(s, "got_lead"); return "谈妥了价码，" + n.name + "果然办事得力。一分钱一分情，明码标价，倒也干脆。"; } },
                { label: "不愿交换，自己想办法", effect: (s) => { add(s, "stress", 2); return "你不想欠这种人情债，谢绝了。求人不如求己，路还得自己蹚。"; } }
              ] };
            return {
              text: () => n.name + "不屑于走后门这套，先把你教训了一顿：" + n.persona.quirk,
              choices: [
                { label: "听 ta 唠叨完正路", effect: (s) => { add(s, "insight", 2); return n.name + "讲了一通“凡事走正道”的大道理，临了倒也指了条光明正大的路子，虽慢些，却踏实。"; } }
              ] };
          } }
      ];
    }
  },

  /* 6. 隐私 / 糗事被知道了 ------------------------------------------------ */
  {
    id: "ev_psn_secret", module: "relation", ambient: true,
    cond: (s) => s.age >= 20 && (s.social || []).some(n => n.persona),
    title: "🙈 糗事被人撞见了",
    text: (s) => { s._psnPick = psn_pick(s); var n = s._psnPick; if (!n) return "你的一桩糗事，幸好还没人知道。";
      return "你一件难堪的糗事，偏偏被" + n.role + "「" + n.name + "」撞了个正着。ta 这人——" + n.persona.desc + "你心里直打鼓。"; },
    dynamicChoices: (s) => {
      var n = psn_cur(s);
      return [
        { label: "硬着头皮，求 ta 别声张", effect: (s) => { var b = personaBucket(n.persona);
            if (b === "fairweather") { add(s, "reputation", -6); add(s, "mood", -6); socialBoostRole(s, n.role, -2); return "你前脚刚走，" + n.name + "后脚就压低声音四处开讲：" + n.persona.quirk + "没两天，你的糗事就传遍了大街小巷，脸都丢尽了。"; }
            if (b === "plain") { add(s, "mood", 3); socialBoostRole(s, n.role, 3); return n.name + "连连点头：" + n.persona.quirk + "“放心，我嘴严，烂在肚子里。”这种谨小慎微的老实人，守口如瓶，最让人安心。"; }
            if (b === "helper") { add(s, "mood", 4); socialBoostRole(s, n.role, 4); return n.name + "不光替你保密，还反过来安慰你：“多大点事，谁没出过糗。”" + n.persona.quirk + "你悬着的心，落了地。"; }
            if (b === "aloof") { add(s, "insight", 1); return n.name + "瞥了你一眼，淡淡道：“这种小事我懒得到处嚼舌根。”" + n.persona.quirk + "清高归清高，倒也确实不屑于八卦。"; }
            add(s, "cash", -1000); socialBoostRole(s, n.role, 1); return n.name + "嘿嘿一笑，不点破也不打包票。你只好请 ta 搓了一顿，换个心安。"; } }
      ];
    }
  },

  /* 7. 聚餐谁买单 / AA ---------------------------------------------------- */
  {
    id: "ev_psn_treat", module: "relation", ambient: true,
    cond: (s) => s.age >= 20 && (s.social || []).some(n => n.persona),
    title: "🍲 聚餐，谁买单？",
    text: (s) => { s._psnPick = psn_pick(s); var n = s._psnPick; if (!n) return "你一个人吃着外卖，挺没意思。";
      return "你和" + n.role + "「" + n.name + "」一桌人吃了顿饭，酒足饭饱，到了结账的环节。ta 是个" + n.persona.name + "的人。"; },
    dynamicChoices: (s) => {
      var n = psn_cur(s);
      return [
        { label: "看 ta 怎么处理这顿饭钱", effect: (s) => { var b = personaBucket(n.persona);
            if (b === "helper") { add(s, "cash", 600); add(s, "mood", 4); socialBoostRole(s, n.role, 4); return n.name + "抢着把单买了，谁拦都不让：" + n.persona.quirk + "“跟我还客气什么！”仗义疏财的人，钱看得淡，情看得重。"; }
            if (b === "calc") { add(s, "cash", -300); add(s, "mood", -3); return "结账时" + n.name + "掏出计算器，硬是把每个人点的菜算到了小数点后：" + n.persona.quirk + "连你多喝的那瓶饮料都没漏算。"; }
            if (b === "fairweather") { if (psn_rich(s)) { add(s, "cash", -800); return n.name + "热情地张罗，却很自然地把单递到了你这个“有钱人”面前，顺势又敬了你一杯。"; } add(s, "cash", -400); return n.name + "眼神一扫，麻溜地提议 AA，自己那份算得清清楚楚，绝不多掏一分。"; }
            if (b === "aloof") { add(s, "cash", -400); add(s, "insight", 1); return n.name + "对这种推来让去的场面很不耐烦，直接拍板 AA：“谁吃谁付，最干净。”" + n.persona.quirk; }
            add(s, "cash", -400); socialBoostRole(s, n.role, 1); return n.name + "老实地提议大家平摊，自己先把那份钱递了过来，不占人便宜，也不愿吃亏。"; } }
      ];
    }
  },

  /* 8. 求人生建议 / 指点 -------------------------------------------------- */
  {
    id: "ev_psn_advice", module: "relation", ambient: true,
    cond: (s) => s.age >= 21 && (s.social || []).some(n => n.persona),
    title: "🧭 迷茫时，求个指点",
    text: (s) => { s._psnPick = psn_pick(s); var n = s._psnPick; if (!n) return "人生的十字路口，你独自纠结，没人可问。";
      return "人生卡在了岔路口，你想找个人讨个主意，便约了" + n.role + "「" + n.name + "」。ta 一向" + n.persona.desc; },
    dynamicChoices: (s) => {
      var n = psn_cur(s);
      return [
        { label: "把心里的纠结倒给 ta 听", next: (s) => { var b = personaBucket(n.persona);
            if (b === "aloof") return {
              text: () => n.name + "一听有人讨教，立马来了精神，从天南聊到地北，一套接一套的大道理。" + n.persona.quirk,
              choices: [
                { label: "耐心听完这场“讲座”", effect: (s) => { add(s, "insight", 3); add(s, "stress", 2); return "整整两个钟头，" + n.name + "引经据典讲个不停。废话不少，可掏心窝子细想，竟也有那么几句点醒了你。"; } },
                { label: "实在听累了，找借口溜", effect: (s) => { add(s, "insight", 1); socialBoostRole(s, n.role, -2); return "你撑不住这长篇大论，中途开溜。ta 意犹未尽，背后摇头：“现在的年轻人啊，就是听不进劝。”"; } }
              ] };
            if (b === "helper") return {
              text: () => n.name + "认认真真听你讲完，没急着评判，先递来一杯热茶。" + n.persona.quirk,
              choices: [
                { label: "听 ta 掏心窝子的建议", effect: (s) => { add(s, "insight", 2); add(s, "mood", 4); socialBoostRole(s, n.role, 3); return n.name + "结合自己摔过的跟头，给你掰开揉碎地分析。句句为你着想，听完你心里亮堂了不少。"; } }
              ] };
            if (b === "calc") return {
              text: () => n.name + "听完，三两句就帮你把利弊摆成了一笔账。" + n.persona.quirk,
              choices: [
                { label: "顺着这笔账往下盘", effect: (s) => { add(s, "strategy", 2); add(s, "insight", 1); return n.name + "冷静得很，成本收益算得明明白白。少了点温度，却也帮你看清了最现实的那条路。"; } }
              ] };
            if (b === "fairweather") return {
              text: () => n.name + "顺着你的话头一通附和，你想听什么 ta 就说什么。" + n.persona.quirk,
              choices: [
                { label: "听完才发现没什么干货", effect: (s) => { add(s, "mood", -2); return "ta 满嘴“你说得对”“肯定行”，听着舒服，回头一品全是空话。这种顺风建议，信不得。"; } }
              ] };
            return {
              text: () => n.name + "不爱讲大道理，只淡淡说了句：“想清楚自己要什么，剩下的别太较劲。”" + n.persona.quirk,
              choices: [
                { label: "品味这句点到为止", effect: (s) => { add(s, "insight", 2); add(s, "mood", 3); return "与世无争的人，话不多却通透。一句点到即止，反倒比千言万语更让你放下了执念。"; } }
              ] };
          } }
      ];
    }
  },

  /* 9. 危难关头托付大事 -------------------------------------------------- */
  {
    id: "ev_psn_entrust", module: "relation", ambient: true,
    cond: (s) => s.age >= 24 && (s.social || []).some(n => n.persona),
    title: "🔑 把大事托付给谁",
    text: (s) => { s._psnPick = psn_pick(s); var n = s._psnPick; if (!n) return "天大的事压下来，你却找不到一个能托付的人。";
      return "你摊上了件天大的事——要么借住、要么帮看孩子、要么求 ta 做担保。环顾一圈，你把目光落在了" + n.role + "「" + n.name + "」身上。ta 是个" + n.persona.name + "的人。"; },
    dynamicChoices: (s) => {
      var n = psn_cur(s);
      return [
        { label: "郑重地把大事托付给 ta", next: (s) => { var b = personaBucket(n.persona);
            if (b === "helper") return {
              text: () => n.name + "听完事情的分量，神色一肃，重重点头：" + n.persona.quirk,
              choices: [
                { label: "把后背交给 ta", effect: (s) => { add(s, "mood", 8); add(s, "stress", -6); socialBoostRole(s, n.role, 8); return n.name + "一口应下，往后的日子里果然替你把事扛得稳稳的。患难见真情，这样的人，值得托付一生。"; } }
              ] };
            if (b === "plain") return {
              text: () => n.name + "搓着手，反复确认了好几遍细节，生怕办砸了辜负你。" + n.persona.quirk,
              choices: [
                { label: "信 ta 这份踏实", effect: (s) => { add(s, "mood", 5); add(s, "stress", -4); socialBoostRole(s, n.role, 5); return n.name + "嘴上没什么漂亮话，却把你托付的事一件件做得妥妥帖帖。老实人靠得住，从不让你失望。"; } }
              ] };
            if (b === "calc") return {
              text: () => n.name + "沉吟半晌，先把风险和自己的“付出”掂量了一番。" + n.persona.quirk,
              choices: [
                { label: "承诺日后必有重谢", effect: (s) => { add(s, "stress", -2); add(s, "cash", -2000); return "谈妥了条件，" + n.name + "才肯接下。事是办了，可这份托付里掺了算计，总让你心里隔着一层。"; } },
                { label: "对方算计太多，作罢", effect: (s) => { add(s, "stress", 4); return "你听出 ta 在反复权衡，临时改了主意。这种大事，托给一个先算账的人，你不放心。"; } }
              ] };
            if (b === "fairweather") return {
              text: () => n.name + "满口答应得比谁都响，可你心里直犯嘀咕。" + n.persona.quirk,
              choices: [
                { label: "赌一把，把事交给 ta", effect: (s) => { if (psn_rich(s)) { add(s, "stress", -2); return "看在你眼下还风光的份上，" + n.name + "倒也尽心办了。只是你清楚，这份尽心是有“保质期”的。"; } add(s, "mood", -6); add(s, "stress", 6); socialBoostRole(s, n.role, -5); return "果不其然，事到临头" + n.name + "撂了挑子，找了一堆借口溜之大吉，差点把你坑惨。见风使舵的人，大事托不得。"; } },
                { label: "悬崖勒马，另寻他人", effect: (s) => { add(s, "insight", 2); return "你及时收住，没把身家性命押在一个墙头草身上。这份清醒，往后你会庆幸。"; } }
              ] };
            return {
              text: () => n.name + "皱着眉，先把你劈头数落一通，嫌你尽惹麻烦。" + n.persona.quirk,
              choices: [
                { label: "低头认错，再求 ta", effect: (s) => { add(s, "insight", 2); add(s, "stress", -3); socialBoostRole(s, n.role, 4); return "骂归骂，" + n.name + "末了还是阴着脸把事接了下来，办得比谁都尽心。面冷心热，刀子嘴底下藏着热汤。"; } }
              ] };
          } }
      ];
    }
  },

  /* 10. 闹了别扭，能不能和好 --------------------------------------------- */
  {
    id: "ev_psn_makeup", module: "relation", ambient: true,
    cond: (s) => s.age >= 21 && (s.social || []).some(n => n.persona && n.attitude < 45),
    title: "🩹 闹了别扭，想和好",
    text: (s) => { s._psnPick = pick((s.social || []).filter(n => n.persona && n.attitude < 45)) || psn_pick(s); var n = s._psnPick; if (!n) return "你和谁都没红过脸，倒也清净。";
      return "前阵子你和" + n.role + "「" + n.name + "」闹得有点僵，冷战了好些天。想想还是觉得可惜，你打算主动递个台阶。ta 是个" + n.persona.name + "的人。"; },
    dynamicChoices: (s) => {
      var n = s._psnPick || psn_pick(s);
      return [
        { label: "放下面子，主动找 ta 和好", effect: (s) => { var b = personaBucket(n.persona);
            if (b === "helper") { add(s, "mood", 6); socialBoostRole(s, n.role, 12); return "你刚一开口，" + n.name + "就摆摆手把话截住：" + n.persona.quirk + "“都过去了，提它干嘛！”重情义的人，从不在小事上记仇。"; }
            if (b === "calc") { add(s, "mood", 1); socialBoostRole(s, n.role, 5); return n.name + "嘴上说着没事，心里那本账却记得清楚。和是和了，但你得拿出点实在的诚意，关系才慢慢回温。"; }
            if (b === "fairweather") { if (psn_rich(s)) { socialBoostRole(s, n.role, 10); return "见你如今还吃得开，" + n.name + "顺势就坡下驴，热络得仿佛从没闹过别扭。" + n.persona.quirk; } add(s, "mood", -3); socialBoostRole(s, n.role, 1); return n.name + "爱搭不理，敷衍了两句就没了下文。你落魄时，连和好都得看人脸色。"; }
            if (b === "aloof") { add(s, "insight", 2); socialBoostRole(s, n.role, 6); return n.name + "端着架子先教训你几句“早干嘛去了”，可话锋一转，气也就消了大半。" + n.persona.quirk; }
            add(s, "mood", 4); socialBoostRole(s, n.role, 8); return n.name + "本就没真生气，见你主动来找，憨憨一笑，俩人又跟从前一样了。"; } },
        { label: "还是拉不下脸，再等等", effect: (s) => { add(s, "stress", 2); return "话到嘴边又收了回去。这台阶，你暂时还递不出口。"; } }
      ];
    }
  }

);
