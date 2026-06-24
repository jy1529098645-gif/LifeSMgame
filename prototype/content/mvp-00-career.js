"use strict";
/*
 * MVP 00s career line pruning layer.
 *
 * The old prototype grew into a full life simulator with many eras, goals and
 * ambient systems. For the current build we keep only the 00s workplace route:
 * junior/senior year -> job hunt -> first job -> workplace pressure -> first
 * life split. This file runs after legacy content files and before _assemble.js,
 * so it can remove modules from runtime without breaking their source files.
 */
(function () {
  window.MVP_00_CAREER = true;

  const replaceWith = (arr, next) => {
    if (!Array.isArray(arr)) return;
    arr.splice(0, arr.length, ...next);
  };

  const keepIds = (arr, ids) => {
    if (!Array.isArray(arr)) return [];
    const set = new Set(ids);
    return arr.filter(x => x && set.has(x.id));
  };

  const removeByIdPrefix = (arr, prefixes) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(x => {
      const id = (x && x.id) || "";
      return !prefixes.some(p => id.indexOf(p) === 0);
    });
  };

  const removeByModule = (arr, modules) => {
    if (!Array.isArray(arr)) return [];
    const set = new Set(modules);
    return arr.filter(x => !set.has(x && x.module));
  };

  // 1) Only 00s start. Keep the object shape, remove all legacy-era choices.
  if (typeof cohorts !== "undefined" && Array.isArray(cohorts)) replaceWith(cohorts, keepIds(cohorts, ["00"]));

  // 2) Only the first route goal for now. Other goals can return after the
  // workplace loop has a stable 40-60 week arc.
  if (typeof GOALS !== "undefined" && Array.isArray(GOALS)) {
    replaceWith(GOALS, keepIds(GOALS, ["corp"]));
    if (GOALS[0]) {
      GOALS[0].name = "00后职场沉浮";
      GOALS[0].path = "职场";
      GOALS[0].target = "熬过求职、试用期和第一次职场分流";
      GOALS[0].desc = "从大三焦虑、海投被拒、试用期规训、通勤房租和公司荒诞里，摸出一条自己的活路。";
      GOALS[0].progress = (s) => {
        // s.mainStage 现为对象，用 mainStageId 读当前阶段（兼容新阶段机）
        const stg = (typeof mainStageId === "function") ? mainStageId(s)
          : (s.mainStage && s.mainStage.id) || s.mainStage;
        const stageScore = (stg === "resign_or_stay" || stg === "startup_survival") ? 85
          : stg === "opportunity_build" ? 70 : stg === "work_grind" ? 60 : stg === "first_job" ? 45 : stg === "job_search" ? 25 : 10;
        const jobScore = s.job ? 20 : 0;
        const cashScore = Math.min(15, Math.max(0, Math.round(((s.cash || 0) - 5000) / 5000)));
        return Math.min(100, stageScore + jobScore + cashScore);
      };
      GOALS[0].done = (s) => !!(s.flags && (s.flags.life_path_chosen || s.flags.first_career_split || s.flags.workplace_year_done || s.flags.first_layoff_survived));
    }
  }

  // 3) Hide actions that pull the player into unrelated systems.
  if (typeof actions !== "undefined" && Array.isArray(actions)) {
    const blockedActions = new Set([
      "startup", "invest", "abroad", "travel", "parenting", "family",
      "grandkids", "hobby", "date", "relocate"
    ]);
    replaceWith(actions, actions.filter(a => a && !blockedActions.has(a.id)));
  }

  // 4) Prune the ambient pool. Keep workplace/job/commute/fraud/health/social
  // pieces that support the 00s career line; remove broad life, family, love,
  // globe, study-abroad, stock, founder and saga noise.
  if (typeof EVENTS !== "undefined" && Array.isArray(EVENTS)) {
    replaceWith(EVENTS, removeByModule(EVENTS, [
      "startup", "venture", "family", "love", "degree", "civil",
      "money", "history", "weather", "travel", "study", "official"
    ]));

    replaceWith(EVENTS, removeByIdPrefix(EVENTS, [
      "dst_", "ev_study_", "ev_degree_", "ev_family_", "ev_love_",
      "ev_venture_", "ev_founder_", "ev_saga_", "ev_wind_bet",
      "ev_choice_buy_house", "ev_choice_retire", "ev_choice_long_holiday",
      "ev_choice_party", "ev_choice_lifestyle", "ev_choice_windfall",
      "mainarc_", "arc_", "ev_stock_", "ev_travel_", "ev_abroad_"
    ]));

    // Broad absurd events are fun later, but during the first route they should
    // only appear if routed by concrete behavior. Keep their source files, take
    // them out of ambient by default.
    EVENTS.forEach(e => {
      if (!e || !e.id) return;
      const looseAbsurd =
        e.module === "absurd" ||
        e.id.indexOf("ev_absurd_") === 0 ||
        e.id.indexOf("ev_sudden_") === 0;
      if (looseAbsurd) e.ambient = false;
    });
  }

  // 5) Consumption is not the current focus. Keep rent/health/study/basic
  // expenses and remove cars/luxury/travel-heavy clutter from the shop.
  if (typeof CONSUMPTION !== "undefined" && Array.isArray(CONSUMPTION)) {
    const keepCats = new Set([
      "健康养生", "学习提升", "心理", "租赁共享", "订阅服务",
      "数码", "体验", "陪伴"
    ]);
    replaceWith(CONSUMPTION, CONSUMPTION.filter(x => {
      const cat = x && x.cat;
      return keepCats.has(cat) || /租|房|体检|医疗|课程|证书|电脑|手机/.test((x && (x.name || "")) || "");
    }));
  }

  // 6) Stock system remains loaded as a utility dependency, but the MVP route
  // should not push players into it.
  if (typeof newsArticles !== "undefined" && Array.isArray(newsArticles)) {
    replaceWith(newsArticles, newsArticles.filter(n => {
      const txt = ((n && n.title) || "") + ((n && n.text) || "");
      return !/股市|炒股|上市|RSU|金融大鳄|太空旅游/.test(txt);
    }));
  }

  // 7) Rewrite the legacy goal pick side effect. The old "打工封顶" note makes
  // the route feel like an executive fantasy; this MVP should start from rent,
  // commuting, internship anxiety and probation pressure.
  if (typeof GOAL_MODS !== "undefined" && GOAL_MODS.corp) {
    GOAL_MODS.corp.note = "【00后职场沉浮】你从大三开始面对毕业、找工作、房租、通勤和试用期。目标不是立刻封顶，而是先在城市里活下来，攒出第一段履历和人脉。";
    GOAL_MODS.corp.onPick = (s) => {
      if (typeof flag === "function") flag(s, "goal_career_00");
      if (typeof add === "function") {
        add(s, "stress", 4);
        add(s, "cash", -800);
      }
    };
  }

  console.log("[MVP] 00s career line pruning applied", {
    cohorts: typeof cohorts !== "undefined" && cohorts.length,
    goals: typeof GOALS !== "undefined" && GOALS.length,
    actions: typeof actions !== "undefined" && actions.length,
    events: typeof EVENTS !== "undefined" && EVENTS.length
  });
})();
