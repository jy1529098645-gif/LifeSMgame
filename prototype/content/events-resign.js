"use strict";
/* =====================================================================
 * content/events-resign.js —— 离职决断主线（大框架改造·批次9，doc §2.3/§9）
 * 当玩家被自己的经历推到创业门口（resign_or_stay 阶段 / 创业准备度高），弹出
 * 「要不要离职创业」的决断：裸辞 / 拿赔偿 / 拉同事 / 借钱找投资 / 再等等。
 * 每个选项都【明码标价】（现金、赔偿、社保、股权、机会窗口），不是单按钮。
 * 选择「干」→ 链入 startupNode（机会卡来自经历）→ 创业经营事件接管。
 * ===================================================================== */

function _rsReady(s) {
  if (s.startup || has(s, "ever_founded")) return false;
  const employed = !!s.job || has(s, "employed") || has(s, "civil_servant");
  if (!employed) return false;
  const stageOK = (typeof mainStageId === "function") && mainStageId(s) === "resign_or_stay";
  const r = (typeof founderReadiness === "function") ? founderReadiness(s) : 0;
  return stageOK || r >= 72;
}
function _rsSever(s) {
  // 能不能要到一笔补偿：被裁/逼退过更容易；否则靠魅力谋略谈
  const base = (s.job ? (s.job.pay || 8000) : 8000) * ((s.world && s.world.priceIndex) || 1);
  const mult = has(s, "been_laid_off") ? 2 : (rnd(0.4 + (typeof statEdge === "function" ? statEdge(s, "charm") * 0.4 : 0)) ? 1 : 0);
  return Math.round(base * mult);
}
function _rsQuit(s) { s.job = null; delete s.flags.employed; delete s.flags.civil_servant; if (typeof recordBeat === "function") recordBeat(s, "resign_choice"); }

EVENTS.push({
  id: "ev_resign_decision", module: "career", ambient: true, importance: "turning",
  cond: s => _rsReady(s) && (s.week - (s._rsCd || -99)) >= 10 && rnd(0.5),
  title: "🚪 离职创业的十字路口",
  text: s => {
    const why = (typeof startupTriggerReason === "function") ? startupTriggerReason(s) : "一份饿不死也撑不起梦想的工作，把你逼到了这一步。";
    const r = (typeof founderReadiness === "function") ? founderReadiness(s) : 60;
    return `${why}\n\n这些年攒下的本事、人脉、被坑出来的认知，像水位一样涨到了临界（创业准备度 ${r}）。一个念头再也压不住：要不，离职，自己干？\n可离开从来不轻松——稳定的工资、社保、那点体面，和未知的九死一生，摆在天平两端。你得想清楚，怎么走出这一步。`;
  },
  choices: [
    { label: "🔥 裸辞，破釜沉舟（断收入·无赔偿·全压上）",
      enter: s => { _rsQuit(s); add(s, "stress", 8); add(s, "mood", 4); flag(s, "resign_naked"); if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 6); if (typeof rememberFact === "function") rememberFact(s, { id: "resign_naked", once: true, type: "resign", text: "裸辞创业——把后路一刀斩断，破釜沉舟。", tags: ["resign", "venture"], intensity: 4 }); },
      next: s => startupNode(s) },
    { label: "💰 逼公司给个说法，拿笔钱再走（撕破脸，换启动金）",
      enter: s => { const pay = _rsSever(s); _rsQuit(s); if (pay > 0) { add(s, "cash", pay); if (typeof notifyMoney === "function") notifyMoney(s, pay, "离职前争取到的补偿，成了启动金"); } flag(s, "resign_paid"); if (typeof rememberFact === "function") rememberFact(s, { id: "resign_paid", once: true, type: "resign", text: pay > 0 ? `离职前硬气地谈下 ¥${pay.toLocaleString()} 补偿，攒成创业本钱。` : "想拿补偿却没谈成，只能空手离场创业。", tags: ["resign", "capital"], intensity: 3 }); },
      next: s => startupNode(s) },
    { label: "🤝 拉上信得过的人一起干（分股权·共担风险·合伙人）",
      enter: s => { _rsQuit(s); flag(s, "cofounder_pact"); add(s, "mood", 6); if (typeof addFounderPrep === "function") addFounderPrep(s, "teamTrust", 8); if (typeof rememberFact === "function") rememberFact(s, { id: "resign_cofounder", once: true, type: "resign", text: "拉上一个信得过的人一起辞职创业，股权分出去一半，风险也分出去一半。", tags: ["resign", "cofounder"], intensity: 3 }); },
      next: s => startupNode(s) },
    { label: "🏦 找投资/借钱起步（账上宽裕，但背债·稀释）",
      enter: s => { _rsQuit(s); flag(s, "seeking_investment"); if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 4); if (typeof rememberFact === "function") rememberFact(s, { id: "resign_funded", once: true, type: "resign", text: "辞职创业，打算靠借钱/拉投资把摊子先铺起来。", tags: ["resign", "funding"], intensity: 3 }); },
      next: s => startupNode(s) },
    { label: "🐴 时机未到，骑驴找马，再等等",
      effect: s => { s._rsCd = s.week; add(s, "insight", 2); add(s, "stress", 3); if (typeof bumpThread === "function") bumpThread(s, "career_margin", 6); return "你最终把那口气又咽了回去。也许是怂，也许是清醒——创业是单程票，你想再攒攒底牌、看准时机。工资照拿，可那个念头，从此在心里生了根，时不时挠你一下。"; } }
  ]
});

/* 创业生存期·开场提示：刚下海时给一记「现金流就是命」的当头棒（doc §2.3 startup_survival）。 */
EVENTS.push({
  id: "ev_resign_firstweek", module: "venture", ambient: true, once: true, importance: "normal",
  cond: s => s.startup && !has(s, "startup_done") && has(s, "ever_founded") && (s.week - (s.startup.foundedWeek || 0)) >= 1 && (s.week - (s.startup.foundedWeek || 0)) <= 6 && rnd(0.6),
  title: "🚀 下海第一课：现金流就是命",
  text: s => `辞职信递出去的爽快，没撑过第一个月。账上的数字开始往下走，房租、社保（现在得自己全额交了）、第一个员工的工资……你这才真切地懂了：当老板，不是不用上班，是 365 天都在上班，还得给所有人发工资。${s.startup.fromOpp ? `\n好在你押的方向（来自「${s.startup.fromOpp}」）是你看得懂的——这是你最大的底气。` : ""}`,
  choices: [
    { label: "勒紧裤腰带，先做出 MVP 跑通", effect: s => { const su = s.startup; if (su) su.progress = (su.progress || 0) + 2; if (typeof recordBeat === "function") recordBeat(s, "mvp"); add(s, "stress", 5); if (typeof addFounderPrep === "function") addFounderPrep(s, "productSense", 4); if (typeof rememberFact === "function") rememberFact(s, { type: "opportunity", text: "下海第一课：把每一分钱掰成两半花，先做出能跑通的 MVP。", tags: ["venture", "mvp"], intensity: 2 }); return "你把办公室换成了城中村的民房，给自己开最低的工资，一头扎进产品里。第一版粗糙的 MVP 跑通那天，你和合伙人就着泡面碰了下杯——万里长征,第一步。"; } },
    { label: "顾不上产品，先满世界找第一个客户", effect: s => { const su = s.startup; if (su) su.progress = (su.progress || 0) + 1; if (typeof recordBeat === "function") recordBeat(s, "first_customer"); add(s, "network", 3); if (typeof addFounderPrep === "function") addFounderPrep(s, "salesChannel", 5); return "你厚着脸皮把通讯录里的人挨个约了一遍，陪笑、请客、被拒绝。终于有个老熟人愿意「先试试」。第一个客户的分量，比你想象的重得多——它证明这事儿,也许真能成。"; } }
  ]
});
