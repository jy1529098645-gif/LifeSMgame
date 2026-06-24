"use strict";
/* =====================================================================
 * content/life-opportunities.js —— 人生机会卡（职场沉浮·逆天改命方案 §11）
 * 机会不只创业：从「打工人荒诞人生」的经历里，长出多条出口——
 *   startup（创业）/ job_switch（跳槽）/ lawsuit（仲裁拿赔偿）/ side_to_main（副业转正）/
 *   hometown（返乡）/ career_change（转行）/ low_desire（躺平）。
 * 创业只是 type==="startup" 的一种。每张卡：type/title/source/cost/risk/potential/hook/apply。
 *
 * 暴露：generateLifeOpportunities(s), lifeOppApply(s, card), LIFE_OPP_TYPE_NAME
 * ===================================================================== */

const LIFE_OPP_TYPE_NAME = {
  startup: "创业", job_switch: "跳槽", lawsuit: "劳动仲裁", side_to_main: "副业转正",
  hometown: "返乡", study: "深造", career_change: "转行", low_desire: "躺平"
};

function _lo_has(s, f) { return (typeof has === "function") ? has(s, f) : !!(s.flags && s.flags[f]); }
function _lo_mem(s, tag) { return (typeof recallMemories === "function") ? recallMemories(s, { tag }).length > 0 : false; }
function _lo_pi(s) { return (s.world && s.world.priceIndex) || 1; }
function _lo_prep(s, k) { return (s.founderPrep && s.founderPrep[k]) || 0; }

// 非创业类机会规则
const LIFE_OPP_RULES = [
  { type: "job_switch", id: "switch_up", title: "跳槽涨薪",
    test: s => !!s.job && ((s.stats && s.stats.knowledge >= 50) || _lo_prep(s, "industryInsight") >= 45 || _lo_has(s, "has_work_evidence")),
    source: "攒下的行业认知 + 履历", risk: "低", potential: "★★（薪资跳一截，天花板还在）",
    cost: s => 0, hook: "骑驴找马这么久，终于有家给得起价的公司向你伸来橄榄枝。换个东家，薪资和头衔都能跳一档。" },
  { type: "job_switch", id: "switch_client", title: "跳到客户/对家公司",
    test: s => !!s.job && ((s.network || 0) >= 35 || _lo_mem(s, "favor")),
    source: "客户/人脉关系", risk: "低", potential: "★★★（带着资源过去，更受重用）",
    cost: s => 0, hook: "你伺候过的某个客户/对家，私下抛来话：「来我们这边吧，待遇好说。」带着资源跳过去，往往比内部熬更快。" },
  { type: "lawsuit", id: "arbitration", title: "走劳动仲裁，讨个说法",
    test: s => _lo_has(s, "been_laid_off") || _lo_has(s, "has_work_evidence") || (s.workChains && s.workChains.arb > 0),
    source: "被裁/逼退 + 你留的证据", risk: "中（耗时耗神）", potential: "★★（一笔赔偿 + 一口气）",
    cost: s => 0, hook: "被这么对待，咽不下这口气。你手里有证据——申请劳动仲裁，要回一笔赔偿，也给自己讨个公道。" },
  { type: "side_to_main", id: "side_turn", title: "把副业转正，自己单干",
    test: s => _lo_has(s, "side_hot") || _lo_mem(s, "validate"),
    source: "做起来的副业", risk: "中高", potential: "★★★（你的小生意，自己说了算）",
    cost: s => Math.round(50000 * _lo_pi(s)), hook: "下班捣鼓的那点副业，居然越做越有声色。要不要一狠心辞了工作，把它当正事来做？" },
  { type: "hometown", id: "return_home", title: "回老家，求个安稳",
    test: s => (s.stress > 65) || ((s.cash || 0) < 0) || _lo_has(s, "born_poor") || (s.birthplace && /县|镇|乡|农村/.test(s.birthplace.path || "")),
    source: "大城市熬不动了 / 老家的根", risk: "低", potential: "★（安稳，但天花板看得见）",
    cost: s => 0, hook: "大城市的房租、加班、孤独，一样样把你磨薄了。回老家考个编、或接家里那摊事——天花板低，但日子能喘口气。" },
  { type: "career_change", id: "switch_track", title: "转行，去做真正想做的事",
    test: s => (s.mood < 45 && s.stress > 55) || _lo_mem(s, "grudge"),
    source: "对眼下这行的厌倦", risk: "中高", potential: "★★（归零重练，但可能更快乐）",
    cost: s => Math.round(20000 * _lo_pi(s)), hook: "你越来越确定：这行不是你想干一辈子的。转行意味着履历归零、收入腰斩，但人总得为自己活一次。" },
  { type: "low_desire", id: "lie_flat", title: "躺平，及时止损",
    test: s => (s.stress > 70 && s.mood < 40) || (s.health < 45) || _lo_mem(s, "health_scar"),
    source: "被卷到怀疑人生", risk: "低", potential: "☆（不赢，但也不再输）",
    cost: s => 0, hook: "争来争去，图什么呢？你决定退出这场内卷：降低欲望、缩减开支、守住健康和心情。不赢，但及时止损，也是一种清醒。" }
];

// 生成混合类型的人生机会卡（创业类复用 generateOpportunities，去掉朴素兜底）
function generateLifeOpportunities(s) {
  const cards = [];
  // ① 非创业出口
  for (const r of LIFE_OPP_RULES) {
    let ok = false; try { ok = r.test(s); } catch (e) { ok = false; }
    if (!ok) continue;
    cards.push({ id: "life_" + r.id, type: r.type, typeName: LIFE_OPP_TYPE_NAME[r.type], title: r.title,
      source: r.source, risk: r.risk, potential: r.potential, initialCost: (typeof r.cost === "function" ? r.cost(s) : (r.cost || 0)), hook: r.hook });
  }
  // ② 创业出口（来自经历的赛道机会卡）
  if (typeof generateOpportunities === "function") {
    const st = generateOpportunities(s).filter(c => c.id.indexOf("opp_fallback") !== 0).slice(0, 2);
    for (const c of st) cards.push({ id: "life_startup_" + c.trackId, type: "startup", typeName: "创业", title: `创业：${c.trackName}`,
      source: c.source, risk: c.risk, potential: c.potential, initialCost: c.initialCost, hook: c.hook, trackName: c.trackName });
  }
  return cards;
}

// 应用一张人生机会卡的结局（返回叙事文本）。创业类交还给现有 startupNode/resign 流程，这里只处理非创业出口。
function lifeOppApply(s, card) {
  if (!card) return "";
  const pi = _lo_pi(s);
  flag(s, "life_chose_" + card.type);
  if (typeof rememberFact === "function") rememberFact(s, { id: "life_choice_" + card.type, once: true, type: "opportunity", text: `人生的岔路口，你选择了「${card.title}」。`, tags: ["life_choice", card.type], intensity: 4 });
  switch (card.type) {
    case "job_switch": {
      // 跳槽：清旧岗，给一份更高薪的新工作（沿用 jobs 体系，薪资+涨幅）
      const better = (typeof JOBS !== "undefined") ? JOBS.find(j => j.tier === Math.min(5, ((s.job && s.job.tier) || 2) + 1)) || s.job : s.job;
      if (better) { s.job = Object.assign({}, better, { _raise: 0.18, level: 0 }); flag(s, "employed"); flag(s, "job_switched"); }
      add(s, "mood", 8); add(s, "stress", -4); add(s, "network", 4);
      if (typeof notify === "function") notify(s, { kind: "work", title: "跳槽成功", body: `新东家「${s.job ? s.job.name : "新公司"}」，薪资跳了一档。` });
      return `你递了辞呈，转身跳进了更好的平台。新公司「${s.job ? s.job.name : ""}」给的薪资和头衔都高了一档——这些年的隐忍和积累，到底没白费。打工人的逆袭，第一步是敢走。`;
    }
    case "lawsuit": {
      // 仲裁：直接结算一笔赔偿 + 名声/本钱
      const pay = Math.round(((s.job ? s.job.pay : 9000) || 9000) * 2 * pi);
      add(s, "cash", pay); if (s.job) { /* 仲裁通常已离职 */ }
      flag(s, "won_arbitration"); add(s, "reputation", 3); add(s, "stress", 4);
      if (typeof addFounderPrep === "function") addFounderPrep(s, "riskTolerance", 5);
      if (typeof notifyMoney === "function") notifyMoney(s, pay, "劳动仲裁赔偿到账");
      return `你把证据一份份递上仲裁庭，顶住了公司法务的拖延和恐吓。几个月后，¥${pay.toLocaleString()} 赔偿到账。钱不多，却是你用骨气换来的——这世上，规则是普通人唯一的铠甲，但你得敢穿上它。`;
    }
    case "side_to_main": {
      // 副业转正 → 起一个小公司（复用 startup 地基，规模小）
      add(s, "cash", -card.initialCost);
      flag(s, "startup"); flag(s, "ever_founded");
      s.startup = { progress: 6, valuation: 0, tracks: ["副业"], track: "副业", foundedAge: s.age, foundedWeek: s.week, fromOpp: "副业转正", small: true };
      s.job = null; delete s.flags.employed;
      add(s, "stress", 6); add(s, "mood", 6);
      return `你一咬牙，辞了工作，把那点副业当成正经事来做。没有惊天动地的故事，只有一个普通人，决定为自己的小生意全力以赴。投入 ¥${card.initialCost.toLocaleString()} 把摊子铺开——成不成，至少这回是为自己干。`;
    }
    case "hometown": {
      // 返乡：低成本低压力的安稳，给一份体制/家里的活
      s.job = { name: "老家的安稳工作", pay: Math.round(5000 * pi), industry: "公共部门", stress: 3, tier: 1, _raise: 0, level: 0, ladder: ["科员", "副科", "正科"] };
      flag(s, "employed"); flag(s, "returned_home"); flag(s, "civil_servant");
      add(s, "stress", -18); add(s, "mood", 10); add(s, "health", 6);
      s._housing = null;
      if (typeof notify === "function") notify(s, { kind: "world", title: "回到了老家", body: "天花板低了，但日子终于能喘口气。" });
      return `你退掉了大城市的出租屋，拖着行李箱回了老家。考了个编、或接了家里的小生意。父母脸上的笑藏不住，你心里却五味杂陈。大城市的星辰大海，到底没能留下你——但小城的烟火气，也是踏踏实实的人生。`;
    }
    case "career_change": {
      add(s, "cash", -card.initialCost);
      flag(s, "career_changed");
      // 履历归零：清空当前职业，降一档收入，但心情/洞察回血
      if (s.job) { s.job = Object.assign({}, s.job, { _raise: -0.2 }); }
      add(s, "mood", 10); add(s, "stress", -6); add(s, "insight", 2);
      return `你跳出了那个熟悉又厌倦的行当，从头学起一门全新的手艺。收入腰斩、被当新人，可每天醒来不再是麻木——人这一辈子，总得有一次，为热爱而活。`;
    }
    case "low_desire": {
      flag(s, "lie_flat");
      add(s, "stress", -25); add(s, "mood", 8); add(s, "health", 8);
      // 降低欲望：标记低消费，关掉「卷」的压力源
      s._lowDesire = true;
      if (typeof notify === "function") notify(s, { kind: "info", title: "你选择了躺平", body: "降低欲望、守住身心。不赢，但也不再输。" });
      return `你按下了人生的暂停键：辞了让你窒息的工作，搬进更便宜的小屋，把欲望降到最低。不再追逐别人定义的成功。有人说你认输了，可只有你自己知道——能从这场没有终点的赛跑里抽身，需要多大的清醒和勇气。`;
    }
    default:
      return `你选择了「${card.title}」，人生翻开了新的一页。`;
  }
}

/* —— 人生分岔：职场沉浮到一定程度，命运摊开多条出口（方案 §12.2「逆天改命」）。
 * 创业、跳槽、仲裁、副业转正、返乡、躺平——你这段荒诞人生，长出不同的出口。 —— */
function _lifeStageOK(s) {
  const stg = (typeof mainStageId === "function") ? mainStageId(s) : null;
  return stg === "work_grind" || stg === "opportunity_build" || stg === "resign_or_stay";
}
function _lifeBurnout(s) { return (s.stress > 68 && s.mood < 45) || _lo_has(s, "been_laid_off") || (typeof founderReadiness === "function" && founderReadiness(s) >= 45); }
// 取一组「多样」的出口：最多 3 个非创业 + 最多 2 个创业，保证「创业不是唯一」也「创业可见」
function _diverseLifeCards(s) {
  const all = generateLifeOpportunities(s);
  const non = []; const seenType = {};
  for (const c of all) { if (c.type === "startup") continue; if (seenType[c.type]) continue; seenType[c.type] = 1; non.push(c); if (non.length >= 3) break; }
  const su = all.filter(c => c.type === "startup").slice(0, 2);
  return non.concat(su);
}

if (typeof EVENTS !== "undefined") EVENTS.push({
  id: "ev_life_crossroads", module: "career", ambient: true, importance: "turning",
  cond: s => !_lo_has(s, "life_path_chosen") && !(s.startup) && _lifeStageOK(s) && _lifeBurnout(s) &&
    generateLifeOpportunities(s).length >= 2 && (s.week - (s._lifeCrossWk || -99)) >= 16 && rnd(0.4),
  title: "🌗 人生的岔路口",
  text: s => {
    const cards = _diverseLifeCards(s);
    s._lifeCards = cards; s._lifeCrossWk = s.week;
    return `打工的这些年，把你磨出了茧，也磨出了不甘。某个失眠的深夜，你盯着天花板，第一次认真盘点：这条路，还要不要这么走下去？\n\n你这段荒诞的人生，竟也悄悄长出了好几条出口——它们不是凭空的选项，是你一周周熬出来、踩出来、攒出来的。该往哪走，这一次，你自己说了算。`;
  },
  dynamicChoices: s => {
    const cards = (s._lifeCards && s._lifeCards.length) ? s._lifeCards : _diverseLifeCards(s);
    const choices = cards.map(card => {
      const costTxt = card.initialCost > 0 ? `　💸约¥${card.initialCost.toLocaleString()}` : "";
      const label = `${card.type === "startup" ? "🚀" : card.type === "job_switch" ? "💼" : card.type === "lawsuit" ? "⚖️" : card.type === "side_to_main" ? "🧪" : card.type === "hometown" ? "🏡" : card.type === "study" ? "🎓" : card.type === "career_change" ? "🔄" : "🛋️"} ${card.title}　<span style="opacity:.75">[${card.typeName}]</span>\n　来源：${card.source}${costTxt}　风险：${card.risk}　${card.potential}`;
      if (card.type === "startup") {
        return { label, enter: s2 => { flag(s2, "life_path_chosen"); flag(s2, "resign_naked"); if (s2.job) { s2.job = null; delete s2.flags.employed; } if (typeof recordBeat === "function") recordBeat(s2, "resign_choice"); s2._lifeCards = null; }, next: s2 => (typeof startupNode === "function" ? startupNode(s2) : { text: () => "（创业流程缺失）", choices: [] }) };
      }
      return { label, effect: s2 => { flag(s2, "life_path_chosen"); if (typeof recordBeat === "function") recordBeat(s2, "resign_choice"); const txt = lifeOppApply(s2, card); s2._lifeCards = null; return txt; } };
    });
    choices.push({ label: "🐴 还没想好，再熬一阵、再攒攒底牌", effect: s2 => { s2._lifeCards = null; add(s2, "insight", 1); add(s2, "stress", 2); return "你把这些念头又按了回去。也许是时机未到，也许是底气还不够。但岔路口已经在那儿了——你知道，迟早要走出那一步。"; } });
    return choices;
  }
});

if (typeof window !== "undefined") { window.LIFE_OPP_RULES = LIFE_OPP_RULES; window.LIFE_OPP_TYPE_NAME = LIFE_OPP_TYPE_NAME; }
