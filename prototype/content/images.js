"use strict";
/* =====================================================================
 * content/images.js —— 视觉图片层（v0.1）
 * 参考《留学模拟器》的图片化呈现：主界面整屏氛围实景、选择卡内嵌城市/年代照、
 * 事件插画、结局大图。本层只提供【图源 + 带渐变兜底的样式助手】，
 * 由 engine.js 在各 render 处取用。所有图均为可热链的 Unsplash 实景图，
 * 用 CSS background-image 渲染——即便加载失败也只露出深色渐变，绝不出现破图。
 *
 * 换成自己的美术：把下面 _IDS 的值改成本地 assets 路径（或自家 CDN）即可，
 * styleBg() 会自动套上同样的暗调渐变叠层，保证文字可读。
 * ===================================================================== */
(function () {
  // 取图：已下载到本地 assets/img/<id>.jpg（离线可用）。w 参数保留以兼容旧调用，本地图自适应缩放。
  const _U = (id /*, w */) => "assets/img/" + id + ".jpg";

  // —— 图源表（key → Unsplash 照片 id）。均已实测可加载。——
  const _IDS = {
    title:   "1480714378408-67cf0d13bc1b", // 城市夜景航拍：开场大图

    // 人生阶段 → 主界面氛围背景（呼应留学模拟器的"宿舍/写字楼"整屏场景）
    youth:   "1493809842364-78817add7ffb", // 窗边温馨一隅：刚入社会
    hustle:  "1531297484001-80022131f5a1", // 深夜的笔记本：打拼期
    midlife: "1497366216548-37526070297c", // 写字楼内景：中年顶梁柱
    senior:  "1470770841072-f978cf4d019e", // 山湖远景：盘点这一生
    elder:   "1502920917128-1aa500764cbd", // 安静居室：夕阳晚年

    // 出生年代卡
    era_70:  "1444723121867-7a241cacace9", // 暮色都市
    era_80:  "1449824913935-59a10b8d2000", // 城市天际线
    era_90:  "1505761671935-60b3a7427bad", // 街景
    era_00:  "1518684079-3c830dcef090",    // 浦东夜景
    era_10:  "1542051841857-5f90071e7989", // 霓虹夜街

    // 事件插画（按 module 归类）
    ev_career:   "1486406146926-c627a92ad1ab", // 职场/会议
    ev_work:     "1497366216548-37526070297c", // 办公室
    ev_love:     "1519501025264-65ba15a82390", // 餐桌/约会
    ev_money:    "1460925895917-afdab827c52f", // 财经/图表
    ev_domestic: "1502920917128-1aa500764cbd", // 居家/家庭
    ev_health:   "1470770841072-f978cf4d019e", // 自然/养生
    ev_startup:  "1454165804606-c3d57bc86b40", // 白板/创业
    ev_extra:    "1516541196182-6bdb0516ed27", // 生活杂记
    ev_sudden:   "1486325212027-8081e485255e", // 突发/人物
    ev_default:  "1449824913935-59a10b8d2000",

    // 商城（按类别，找不到就用默认）
    shop_default: "1556745757-8d76bdb6984b", // 都市消费
    shop_car:     "1556745757-8d76bdb6984b",
    shop_home:    "1502920917128-1aa500764cbd",
    shop_luxury:  "1556761175-b413da4baf72",
    shop_travel:  "1470770841072-f978cf4d019e",

    // 各功能页氛围大图（呼应留学模拟器：每屏一张实景）
    create:   "1470116945706-e6bf5d5a53ca", // 新生儿小手：投胎/捏人
    goalpick: "1604428803896-c1e5151d4128", // 雪山晨光：立志/人生目标
    social:   "1519671282429-b44660ead0a7", // 朋友聚餐：社交圈
    market:   "1611974789855-9c2a0a7236a3", // K线行情：理财炒股
    map:      "1543797414-a0c3ad076f7c",    // 舷窗云海：搬家/旅行
    phone:    "1545612700-748b9ff50b3f",    // 霓虹都市夜：手机资讯

    // 结局
    dead:    "1444723121867-7a241cacace9"
  };

  // 暗调渐变叠层：从上到下压暗，保证叠在图上的文字清晰可读
  const _SCRIM_TOP    = "linear-gradient(180deg, rgba(12,12,15,.30) 0%, rgba(12,12,15,.75) 70%, rgba(12,12,15,.96) 100%)";
  const _SCRIM_CARD   = "linear-gradient(180deg, rgba(12,12,15,.10) 0%, rgba(12,12,15,.55) 60%, rgba(12,12,15,.92) 100%)";
  const _SCRIM_EVENT  = "linear-gradient(180deg, rgba(22,22,28,.20) 0%, rgba(22,22,28,.78) 100%)";

  function url(key, w) { const id = _IDS[key]; return id ? _U(id, w || 900) : ""; }

  // 返回可直接塞进 style 属性的 background 值（已含暗调叠层）；图缺失则返回空串
  function styleBg(key, w, scrim) {
    const u = url(key, w);
    if (!u) return "";
    const sc = scrim === "card" ? _SCRIM_CARD : scrim === "event" ? _SCRIM_EVENT : _SCRIM_TOP;
    return "background-image:" + sc + ",url('" + u + "');background-size:cover;background-position:center;";
  }

  // 阶段 → 背景 key（带兜底）
  function stageKey(stageId) {
    return _IDS[stageId] ? stageId : "youth";
  }
  // 事件 module → 插画 key（带兜底）
  function eventKey(mod) {
    return _IDS["ev_" + mod] ? "ev_" + mod : "ev_default";
  }
  // 商城 kind → 图 key（带兜底）
  function shopKey(kind) {
    return _IDS["shop_" + kind] ? "shop_" + kind : "shop_default";
  }

  window.GAME_IMAGES = { url, styleBg, stageKey, eventKey, shopKey, _IDS };

  // —— 自注入样式：所有图片相关的类名都收敛在本文件，避免与 style.css 的并发改动冲突 ——
  const CSS = `
    .scene-hero{height:128px;border-radius:16px;margin-bottom:14px;display:flex;align-items:flex-end;
      padding:12px 16px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--line)}
    .scene-cap{color:#fff;font-weight:700;font-size:14px;letter-spacing:.5px;text-shadow:0 2px 8px rgba(0,0,0,.8)}
    .bg-photo{height:92px;margin:-18px -18px 12px;border-radius:16px 16px 0 0;box-shadow:inset 0 -30px 40px -20px rgba(12,12,15,.9)}
    .ev-photo{height:148px;margin:-26px -26px 18px;border-radius:18px 18px 0 0}
    .ev-photo .ev-photo-tag{display:inline-block;margin:auto 0 10px 14px;align-self:flex-end;
      font-size:11px;letter-spacing:2px;color:var(--amber2);text-shadow:0 2px 8px rgba(0,0,0,.9)}
    .ev-photo{display:flex}
    .shop-photo{width:52px;height:52px;border-radius:10px;flex:none;box-shadow:inset 0 0 0 1px var(--line)}
    .dead-hero{height:170px;border-radius:16px;margin:0 auto 18px;max-width:560px;
      display:flex;align-items:flex-end;padding:14px 18px;box-shadow:inset 0 0 0 1px var(--line)}
  `;
  const st = document.createElement("style");
  st.id = "game-images-css";
  st.textContent = CSS;
  (document.head || document.documentElement).appendChild(st);
})();
