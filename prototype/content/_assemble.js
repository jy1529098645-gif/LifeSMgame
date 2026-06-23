"use strict";
/* =====================================================================
 * content/_assemble.js —— 装配层（必须最后加载）
 * 把核心层(core.js) + 各内容模块(events-*, consumption, social) 注册进来的
 * 全局符号，统一组装成引擎使用的 window.CONTENT。
 * 新增一个内容模块时：在 index.html 里于本文件【之前】加一行 <script>，无需改这里
 * （除非你引入了全新的顶层数据类别）。
 * ===================================================================== */
window.CONTENT = {
  STAT_KEYS, STAT_NAMES, BASE_STAT, BASE_TOTAL, CLASS_NAMES,
  cohorts, creationSteps, assetTierCash, lifeStages, actions,
  windTimeline, windAt, INVEST_TRACKS, newsArticles,
  events: EVENTS, ailments, endings, titles, EVENT_MODULES, commitments, stageDecisions,
  consumption: CONSUMPTION, social: SOCIAL_ROLES, cities: CITIES, jobs: JOBS,
  countries: COUNTRIES, TIER_NAME, goals: GOALS, achievements: ACHIEVEMENTS, stocks: STOCKS, geo: CHINA_GEO, geoSvg: CHINA_SVG, personas: PERSONAS, weathers: WEATHERS,
  images: window.GAME_IMAGES,
  _util: {
    add, flag, has, pick, rnd, clampStat, classTier, byClass, shuf,
    betNode, startupNode, makeCrush, windAt,
    STARTUP_TRACKS, trackById, trackByName, tracksForEra, TRACK_NAMES,
    initSocial, socialShift, socialBoostRole, socialAvg, socialTier, socialAvgTier, socialReach, socialDecay, socialCultivate,
    npcActions, doNpcAction, socialWeekLeft, socialWeekCap, relTag,
    initWorld, tickWorld, livingCost, monthlyBill, luckBias, statEdge, bumpMomentum, windPayoff, bigWindfall,
    jobSalary, jobById, applyJob, hireJob,
    MAJORS, majorById, majorName, majorFit, majorBlocks,
    generateOpportunities, oppCardFor,
    getWeekActions, getActionPreview, canRunAction, STAGE_ACTIONS, SCENE_ACTIONS,
    pickWeeklyEvent, buildWeeklyReflection, ACTION_EVENT_BIAS,
    REVEAL, HIDDEN_NPCS, npcDef, meetPerson, personReveal, personKnown, personMet, personLabel,
    COMPANIES, companyById, companyJob, companiesForCity, sampleCompanies, grantRSU, jobReachable, companyPositions,
    countryById, cityById, citiesByCountry, citiesOf, cityPickerNode, cityFull, genName, genCNName, genPerson,
    goalById, goalProgress, goalDone, ancestorVerdict, checkMilestones,
    nextDestinyChapter, destinyReckon, destinyStatus, destinyLine, dstChoose, dstPick, destinyDoneCount,
    recordLife, loadMeta, ACHIEVEMENTS, achById, genDayWeather, seasonOf, UNLOCKS, metaUnlocked, unlockById,
    computeLegacy, applyLegacy, childEnsureList, childUpdateAges, recordChildBirth,
    goalMods, applyGoalMods, makePersona, personaBucket,
    routeOf, currentQuest, questProgress, tickQuests, isQuestDone, routeFilterActions, routeActionUnlocked, routeLockedHints,
    MINIGAMES, mgById, mgAvailable, BOARDGAMES, bgById, bgAvailable,
    TRAVEL: (typeof window !== "undefined" ? window.TRAVEL : undefined),
    pickDeathCause, pickEnding, DEATH_CAUSES, ENDINGS,
    STOCKS, stockById, stocksBySector, initStocks, tickStocks, stockValue, stockChange, stockCandles, applyNewsToMarket, sectorCatalyst, buyStock, sellStock, liquidateStocks,
    // —— 叙事动态世界升级·第一阶段 ——
    INDUSTRIES, WORLD_SIGNALS, cloneIndustries, initIndustryState, industryState, tickIndustries, applyWorldSignal, tickWorldQuarter, industryEdge, summarizeIndustry, applyNewsSignals, knownSignal, knownTrendsText, windInsight,
    INFLUENCE_KEYS, ensureInfluence, addInfluence, influenceTier, influenceTierName, addWorldImpact, applyWorldImpacts, influenceSummary, accrueInfluence,
    ensureProfile, addCredential, addExperience, addStigma, addPrivilege, addScar, profileHas, socialAccess, accessTone, byAccess, profileSummary,
    ensureFounderState, addFounderPrep, founderReadiness, founderGap, readinessVerdict, startupTriggerReason, entrepreneurialRoleOf, founderPrepFromScene, founderSummary, FOUNDER_AXIS_NAME, ensureCompanyFields, companyState,
    ensureRuntime, currentScene, addMemory, bumpThread, threadLevel, castMember, addCastMember, tickNarrativeSystems,
    // —— 大框架改造·批次1：主线阶段 / 周时间 / 场景 / 记忆 / 提醒 ——
    MAIN_STAGES, mainStageDef, ensureMainStage, mainStageTick, mainStageOf, mainStageId, mainStageTitle, recordBeat, hasBeat, mainStageSummary,
    computeWeekBudget, freeSlots, weekBudgetSummary, commuteHoursOf,
    initWeekSlots, ensureWeekSlots, actionSlotCost, weekSlotsLeft, weekSlotsFull, spendSlots,
    canAdvanceStage,
    SCENES, sceneById, sceneMeta, sceneAmbient, sceneEventTags,
    ensureNotices, notify, notifyMoney, notifyCost, drainNotices, peekNotices,
    rememberFact, recallMemories, recallOne, memoryHas, memoryCount, memoryDigest,
    WORK_SCENES: (typeof WORK_SCENES !== "undefined" ? WORK_SCENES : undefined),
    makeWorkScene: (typeof makeWorkScene !== "undefined" ? makeWorkScene : undefined),
    workSceneOf: (typeof workSceneOf !== "undefined" ? workSceneOf : undefined),
    registerMainArc: (typeof registerMainArc !== "undefined" ? registerMainArc : undefined),
    mainArcOf: (typeof mainArcOf !== "undefined" ? mainArcOf : undefined),
    pickMainArc: (typeof pickMainArc !== "undefined" ? pickMainArc : undefined),
    nextMainArcChapter: (typeof nextMainArcChapter !== "undefined" ? nextMainArcChapter : undefined),
    mainArcStatus: (typeof mainArcStatus !== "undefined" ? mainArcStatus : undefined),
    arcChoose: (typeof arcChoose !== "undefined" ? arcChoose : undefined),
    mainArcReckon: (typeof mainArcReckon !== "undefined" ? mainArcReckon : undefined),
    chapterTitle: (typeof chapterTitle !== "undefined" ? chapterTitle : undefined),
    chapterWorldSummary: (typeof chapterWorldSummary !== "undefined" ? chapterWorldSummary : undefined)
  }
};
console.log("[CONTENT] 装配完成：事件", EVENTS.length, "｜消费", CONSUMPTION.length, "｜社交", SOCIAL_ROLES.length, "｜城市", CITIES.length, "｜职位", JOBS.length);
