"use strict";
/* =====================================================================
 * content/boardgames.js —— 真·可玩棋类小游戏（v1.0）
 * 不是选项对话，而是真正的棋盘：玩家点击落子、AI 应对、判定胜负。
 * 纯自包含 vanilla JS 逻辑（无外部依赖），引擎 renderBoardGame 负责画棋盘+交互。
 *
 * 每个棋种导出统一接口（引擎调用）：
 *   size                棋盘线数（格点 size×size）
 *   newBoard()          返回一维棋盘数组（0空 / 1玩家 / 2AI）
 *   legal(b,x,y)        该点能否落子
 *   place(b,x,y,who)    落子（直接改 b）
 *   winFrom(b,x,y,who)  以该子判定是否成五（true/false）—— 五子棋用
 *   full(b)             是否下满（和棋）
 *   aiMove(b)           返回 {x,y} AI 的一手（找不到返回 null）
 *   statKey             这盘吃哪个属性（影响 AI 强度：你越强，AI 越收敛）
 *   reward(s,outcome)   outcome: "win"|"lose"|"draw" → 返回结果文案
 * ===================================================================== */

/* ============================ 五子棋 (Gomoku) ============================ */
var GOMOKU = (function () {
  var N = 15;
  function idx(x, y) { return y * N + x; }
  function inb(x, y) { return x >= 0 && x < N && y >= 0 && y < N; }
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  function newBoard() { var b = []; for (var i = 0; i < N * N; i++) b.push(0); return b; }
  function legal(b, x, y) { return inb(x, y) && b[idx(x, y)] === 0; }
  function place(b, x, y, w) { b[idx(x, y)] = w; }
  function full(b) { for (var i = 0; i < b.length; i++) if (b[i] === 0) return false; return true; }
  function winFrom(b, x, y, w) {
    for (var d = 0; d < 4; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1], cnt = 1, i;
      for (i = 1; i < 5; i++) { var nx = x + dx * i, ny = y + dy * i; if (inb(nx, ny) && b[idx(nx, ny)] === w) cnt++; else break; }
      for (i = 1; i < 5; i++) { var px = x - dx * i, py = y - dy * i; if (inb(px, py) && b[idx(px, py)] === w) cnt++; else break; }
      if (cnt >= 5) return true;
    }
    return false;
  }
  // 评估「在 (x,y) 落 w 子」的价值（进攻 / 防守通用）：四个方向的连子+活眼记分
  function scoreAt(b, x, y, w) {
    var total = 0;
    for (var d = 0; d < 4; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1];
      var cnt = 1, open = 0, i, nx, ny;
      // 正向
      for (i = 1; i < 5; i++) { nx = x + dx * i; ny = y + dy * i; if (inb(nx, ny) && b[idx(nx, ny)] === w) cnt++; else break; }
      if (inb(nx, ny) && b[idx(nx, ny)] === 0) open++;
      // 反向
      for (i = 1; i < 5; i++) { nx = x - dx * i; ny = y - dy * i; if (inb(nx, ny) && b[idx(nx, ny)] === w) cnt++; else break; }
      if (inb(nx, ny) && b[idx(nx, ny)] === 0) open++;
      total += lineVal(cnt, open);
    }
    return total;
  }
  function lineVal(cnt, open) {
    if (cnt >= 5) return 1000000;
    if (cnt === 4) return open >= 2 ? 100000 : (open === 1 ? 12000 : 0);
    if (cnt === 3) return open >= 2 ? 8000 : (open === 1 ? 800 : 0);
    if (cnt === 2) return open >= 2 ? 600 : (open === 1 ? 80 : 0);
    if (cnt === 1) return open >= 2 ? 40 : (open === 1 ? 8 : 0);
    return 0;
  }
  function aiMove(b) {
    // 第一手/空棋盘：走天元附近
    var any = false; for (var i = 0; i < b.length; i++) if (b[i] !== 0) { any = true; break; }
    if (!any) return { x: 7, y: 7 };
    // 只考虑已有棋子周围 2 格内的空点（剪枝）
    var cand = {}, list = [];
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      if (b[idx(x, y)] === 0) continue;
      for (var ddy = -2; ddy <= 2; ddy++) for (var ddx = -2; ddx <= 2; ddx++) {
        var nx = x + ddx, ny = y + ddy; if (inb(nx, ny) && b[idx(nx, ny)] === 0) { var k = idx(nx, ny); if (!cand[k]) { cand[k] = 1; list.push([nx, ny]); } }
      }
    }
    var best = null, bestV = -1;
    for (var c = 0; c < list.length; c++) {
      var cx = list[c][0], cy = list[c][1];
      // 进攻分(自己=2) + 防守分(挡玩家=1)；防守略低于进攻，AI 会优先成杀、其次拦截
      var off = scoreAt(b, cx, cy, 2);
      var def = scoreAt(b, cx, cy, 1) * 0.9;
      var v = Math.max(off, def) + Math.min(off, def) * 0.1 + Math.random() * 5;
      if (v > bestV) { bestV = v; best = { x: cx, y: cy }; }
    }
    return best;
  }
  return {
    id: "gomoku", name: "五子棋", emoji: "⚫", kind: "board", boardType: "gomoku", size: N, statKey: "mind",
    opponent: "棋摊张大爷", where: "小区花园的石桌旁，张大爷的五子棋摊逮谁杀谁。", cond: function (s) { return s.age >= 16; },
    intro: "「后生仔，敢不敢来一盘五子棋？连成五子就算赢。」张大爷把黑子推给你——你先手。",
    newBoard: newBoard, legal: legal, place: place, winFrom: winFrom, full: full, aiMove: aiMove,
    onWin: function (s, i) { add(s, "mood", 7); add(s, "mind", 1); add(s, "strategy", 1); if (typeof socialBoostRole === "function") socialBoostRole(s, "邻居", 6); return "你五子连珠，张大爷一拍大腿：「这后生有点东西！」从此你成了棋摊的常客，多了个忘年交。"; },
    onLose: function (s) { add(s, "mood", 2); add(s, "mind", 1); add(s, "stress", -5); return "你被老爷子杀得片甲不留，他乐呵呵地复盘：「输棋不输阵，明天再来！」一下午就这么消磨过去，输也输得开心。"; },
    onDraw: function (s) { add(s, "mood", 4); add(s, "mind", 1); return "棋盘下满，握手言和。张大爷意犹未尽：「棋逢对手，再战！」"; }
  };
})();

/* ============================ 中国象棋 (Xiangqi) ============================
 * 9 列 × 10 行。玩家执红(在下方)，AI 执黑(在上方)。点选己方子→点目标格走子。
 * 完整规则：马蹩腿 / 象塞眼·不过河 / 炮翻山打 / 仕将守九宫 / 兵过河 / 将帅不照面 /
 *   走子后不能让自己被将（自杀着非法）。胜负：对方被将死或无着可走。
 * AI：带 α-β 剪枝的 negamax（深度2~3）+ 子力/位置评估。
 * 棋子编码：'r?'=红(玩家) 'b?'=黑(AI)；类型 K帅将 A仕士 E相象 H马 R车 C炮 P兵卒。
 * ===================================================================== */
var XIANGQI = (function () {
  var W = 9, H = 10;
  function ix(x, y) { return y * W + x; }
  function inb(x, y) { return x >= 0 && x < W && y >= 0 && y < H; }
  var VAL = { K: 100000, R: 900, C: 450, H: 400, E: 200, A: 200, P: 100 };
  var CH = { rK: "帅", rA: "仕", rE: "相", rH: "马", rR: "车", rC: "炮", rP: "兵", bK: "将", bA: "士", bE: "象", bH: "马", bR: "车", bC: "炮", bP: "卒" };
  function side(code) { return !code ? 0 : (code[0] === "r" ? 1 : 2); }
  function newBoard() {
    var b = new Array(W * H).fill("");
    var back = ["R", "H", "E", "A", "K", "A", "E", "H", "R"];
    for (var x = 0; x < 9; x++) { b[ix(x, 0)] = "b" + back[x]; b[ix(x, 9)] = "r" + back[x]; }
    b[ix(1, 2)] = "bC"; b[ix(7, 2)] = "bC"; b[ix(1, 7)] = "rC"; b[ix(7, 7)] = "rC";
    for (var i = 0; i < 5; i++) { b[ix(i * 2, 3)] = "bP"; b[ix(i * 2, 6)] = "rP"; }
    return b;
  }
  function inPalace(sd, x, y) { if (x < 3 || x > 5) return false; return sd === 1 ? (y >= 7 && y <= 9) : (y >= 0 && y <= 2); }
  function ownSide(sd, y) { return sd === 1 ? (y >= 5) : (y <= 4); }   // 未过河
  // 某子的伪合法目标（不含自杀判定）
  function pseudo(b, x, y) {
    var code = b[ix(x, y)]; if (!code) return [];
    var sd = side(code), t = code[1], out = [];
    function add2(tx, ty) { if (!inb(tx, ty)) return; var dst = b[ix(tx, ty)]; if (!dst || side(dst) !== sd) out.push([tx, ty]); }
    var i, nx, ny, blocked;
    if (t === "K") {
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function (d) { var tx = x + d[0], ty = y + d[1]; if (inPalace(sd, tx, ty)) add2(tx, ty); });
    } else if (t === "A") {
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) { var tx = x + d[0], ty = y + d[1]; if (inPalace(sd, tx, ty)) add2(tx, ty); });
    } else if (t === "E") {
      [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(function (d) { var tx = x + d[0], ty = y + d[1]; if (!inb(tx, ty)) return; if (!ownSide(sd, ty)) return; if (b[ix(x + d[0] / 2, y + d[1] / 2)]) return; add2(tx, ty); });
    } else if (t === "H") {
      [[1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1], [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0]].forEach(function (d) { var tx = x + d[0], ty = y + d[1]; if (!inb(tx, ty)) return; if (b[ix(x + d[2], y + d[3])]) return; add2(tx, ty); });
    } else if (t === "R") {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { nx = x + d[0]; ny = y + d[1]; while (inb(nx, ny)) { if (!b[ix(nx, ny)]) out.push([nx, ny]); else { if (side(b[ix(nx, ny)]) !== sd) out.push([nx, ny]); break; } nx += d[0]; ny += d[1]; } });
    } else if (t === "C") {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { nx = x + d[0]; ny = y + d[1]; blocked = false; while (inb(nx, ny)) { var dst = b[ix(nx, ny)]; if (!blocked) { if (!dst) out.push([nx, ny]); else blocked = true; } else { if (dst) { if (side(dst) !== sd) out.push([nx, ny]); break; } } nx += d[0]; ny += d[1]; } });
    } else if (t === "P") {
      var fwd = sd === 1 ? -1 : 1; add2(x, y + fwd);
      var crossed = sd === 1 ? (y <= 4) : (y >= 5);
      if (crossed) { add2(x + 1, y); add2(x - 1, y); }
    }
    return out;
  }
  function findKing(b, sd) { var k = sd === 1 ? "rK" : "bK"; for (var i = 0; i < b.length; i++) if (b[i] === k) return [i % W, Math.floor(i / W)]; return null; }
  function generalsFacing(b) {
    var r = findKing(b, 1), bk = findKing(b, 2); if (!r || !bk) return false; if (r[0] !== bk[0]) return false;
    var x = r[0], y0 = Math.min(r[1], bk[1]) + 1, y1 = Math.max(r[1], bk[1]);
    for (var y = y0; y < y1; y++) if (b[ix(x, y)]) return false;
    return true;
  }
  function attacked(b, x, y, bySide) {
    for (var i = 0; i < b.length; i++) { if (side(b[i]) !== bySide) continue; var px = i % W, py = Math.floor(i / W); var mv = pseudo(b, px, py); for (var j = 0; j < mv.length; j++) if (mv[j][0] === x && mv[j][1] === y) return true; }
    return false;
  }
  function inCheck(b, sd) { var k = findKing(b, sd); if (!k) return true; return attacked(b, k[0], k[1], sd === 1 ? 2 : 1) || generalsFacing(b); }
  function doMove(b, fx, fy, tx, ty) { var nb = b.slice(); nb[ix(tx, ty)] = nb[ix(fx, fy)]; nb[ix(fx, fy)] = ""; return nb; }
  function legalMoves(b, x, y) { var sd = side(b[ix(x, y)]); if (!sd) return []; return pseudo(b, x, y).filter(function (m) { var nb = doMove(b, x, y, m[0], m[1]); return !inCheck(nb, sd); }); }
  function legalAll(b, sd) { var out = []; for (var i = 0; i < b.length; i++) { if (side(b[i]) !== sd) continue; var px = i % W, py = Math.floor(i / W); var mv = legalMoves(b, px, py); for (var j = 0; j < mv.length; j++) out.push([px, py, mv[j][0], mv[j][1]]); } return out; }
  function evalBoard(b, sd) {
    var sc = 0;
    for (var i = 0; i < b.length; i++) { var c = b[i]; if (!c) continue; var v = VAL[c[1]] || 0; var y = Math.floor(i / W); if (c[1] === "P") v += (side(c) === 1 ? (6 - y) : (y - 3)) * 8; sc += (side(c) === sd ? v : -v); }
    return sc;
  }
  function negamax(b, depth, sd, alpha, beta) {
    if (depth === 0) return evalBoard(b, sd);
    var moves = legalAll(b, sd); if (!moves.length) return -200000 + (3 - depth);   // 无着可走 = 输
    // 吃子优先排序，提升剪枝
    moves.sort(function (m1, m2) { return (VAL[(b[ix(m2[2], m2[3])] || " ")[1]] || 0) - (VAL[(b[ix(m1[2], m1[3])] || " ")[1]] || 0); });
    var best = -1e9;
    for (var i = 0; i < moves.length; i++) {
      var nb = doMove(b, moves[i][0], moves[i][1], moves[i][2], moves[i][3]);
      var v = -negamax(nb, depth - 1, sd === 1 ? 2 : 1, -beta, -alpha);
      if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break;
    }
    return best;
  }
  function aiMove(b) {
    var moves = legalAll(b, 2); if (!moves.length) return null;
    moves.sort(function (m1, m2) { return (VAL[(b[ix(m2[2], m2[3])] || " ")[1]] || 0) - (VAL[(b[ix(m1[2], m1[3])] || " ")[1]] || 0); });
    var best = null, bestV = -1e9, alpha = -1e9, beta = 1e9;
    for (var i = 0; i < moves.length; i++) {
      var nb = doMove(b, moves[i][0], moves[i][1], moves[i][2], moves[i][3]);
      var v = -negamax(nb, 2, 1, -beta, -alpha) + Math.random() * 6;   // 深度2(AI+玩家应) + 微扰避免千篇一律
      if (v > bestV) { bestV = v; best = moves[i]; }
      if (v > alpha) alpha = v;
    }
    return best ? { fx: best[0], fy: best[1], tx: best[2], ty: best[3] } : null;
  }
  return {
    id: "xiangqi", name: "中国象棋", emoji: "♟️", kind: "board", mode: "move", boardType: "xiangqi",
    size: W, width: W, height: H, statKey: "strategy", opponent: "公园棋摊·赵老爷子",
    where: "公园凉亭里，赵老爷子的象棋摊围满了观棋的人，落子声铿锵。", cond: function (s) { return s.age >= 16; },
    intro: "「来一盘？」赵老爷子摆好了棋，让你执红先行。观棋的大爷们都凑了过来。",
    newBoard: newBoard, ownerAt: function (b, x, y) { return side(b[ix(x, y)]); }, pieceChar: function (code) { return CH[code] || ""; },
    legalMoves: legalMoves, move: function (b, fx, fy, tx, ty) { var cap = b[ix(tx, ty)]; b[ix(tx, ty)] = b[ix(fx, fy)]; b[ix(fx, fy)] = ""; return cap; },
    winner: function (b) { if (!findKing(b, 2)) return 1; if (!findKing(b, 1)) return 2; if (!legalAll(b, 1).length) return 2; if (!legalAll(b, 2).length) return 1; return null; },
    aiMove: aiMove,
    onWin: function (s) { add(s, "mood", 9); add(s, "strategy", 2); add(s, "mind", 1); if (typeof socialBoostRole === "function") socialBoostRole(s, "邻居", 8); return "你将死了赵老爷子！围观的大爷们一片惊叹。老爷子捋着胡子哈哈大笑：「后生，你赢得漂亮！」从此你在棋摊上有了名号。"; },
    onLose: function (s) { add(s, "mood", 3); add(s, "strategy", 1); add(s, "stress", -5); return "你被老爷子杀得丢盔弃甲。他一边收棋一边点拨你两手，你听得连连点头——输一盘棋，长一寸功。"; },
    onDraw: function (s) { add(s, "mood", 4); add(s, "strategy", 1); return "一盘僵局，谁也奈何不了谁，握手言和。老爷子意犹未尽：「有点意思，再来！」"; }
  };
})();

/* ============================ 围棋 9 路 (Go) ============================
 * 真·围棋：提子、禁自杀、简易打劫、数子(子+空)判胜负(白贴 3.5 目)。玩家执黑先行。
 * AI 为启发式（能提子/逃吃/扩气/抢实地），约入门水平——但是真在下棋，不是走过场。
 * ===================================================================== */
var WEIQI = (function () {
  var N = 9, KOMI = 3.5;
  function ix(x, y) { return y * N + x; }
  function inb(x, y) { return x >= 0 && x < N && y >= 0 && y < N; }
  function newBoard() { return new Array(N * N).fill(0); }
  function neigh(x, y) { var r = []; if (x > 0) r.push([x - 1, y]); if (x < N - 1) r.push([x + 1, y]); if (y > 0) r.push([x, y - 1]); if (y < N - 1) r.push([x, y + 1]); return r; }
  function group(b, x, y) {
    var col = b[ix(x, y)]; if (!col) return null;
    var seen = {}, st = [[x, y]], stones = [], libs = {};
    while (st.length) { var p = st.pop(), k = ix(p[0], p[1]); if (seen[k]) continue; seen[k] = 1; stones.push(p);
      neigh(p[0], p[1]).forEach(function (q) { var c = b[ix(q[0], q[1])]; if (c === 0) libs[ix(q[0], q[1])] = 1; else if (c === col && !seen[ix(q[0], q[1])]) st.push(q); }); }
    return { stones: stones, libs: Object.keys(libs).length, col: col };
  }
  // 纯函数尝试落子：返回 {ok, nb, captured, ko}
  function tryPlace(b, x, y, who, koPt) {
    if (!inb(x, y) || b[ix(x, y)] !== 0) return { ok: false };
    if (koPt != null && ix(x, y) === koPt) return { ok: false };
    var nb = b.slice(); nb[ix(x, y)] = who; var opp = 3 - who; var capStones = [];
    neigh(x, y).forEach(function (q) { if (nb[ix(q[0], q[1])] === opp) { var g = group(nb, q[0], q[1]); if (g && g.libs === 0) g.stones.forEach(function (p) { if (nb[ix(p[0], p[1])] === opp) { nb[ix(p[0], p[1])] = 0; capStones.push(p); } }); } });
    var self = group(nb, x, y);
    if (self.libs === 0 && capStones.length === 0) return { ok: false };   // 禁自杀
    // 简易打劫：恰好提一子且自身成单子单气 → 对方下一手禁回提该点
    var ko = (capStones.length === 1 && self.stones.length === 1 && self.libs === 1) ? ix(capStones[0][0], capStones[0][1]) : null;
    return { ok: true, nb: nb, captured: capStones.length, ko: ko };
  }
  function legalMovesAll(b, who, koPt) { var out = []; for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { if (b[ix(x, y)] !== 0) continue; var r = tryPlace(b, x, y, who, koPt); if (r.ok) out.push({ x: x, y: y, captured: r.captured, ko: r.ko }); } return out; }
  function aiPlace(b, koPt) {
    var moves = legalMovesAll(b, 2, koPt); if (!moves.length) return { pass: true };
    var best = null, bestV = -1e9;
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i], v = 0;
      v += m.captured * 120;                                  // 能提子优先
      var r = tryPlace(b, m.x, m.y, 2, koPt); var self = group(r.nb, m.x, m.y);
      v += Math.min(self.libs, 5) * 6;                        // 自身气越多越安全
      if (self.libs === 1) v -= 40;                           // 别自投罗网（自己只剩一气）
      // 救自己被打吃的子（邻接己方一气群）
      neigh(m.x, m.y).forEach(function (q) { if (b[ix(q[0], q[1])] === 2) { var g = group(b, q[0], q[1]); if (g && g.libs === 1) v += 50; } });
      // 紧对方的气（邻接对方群，使其更危险）
      neigh(m.x, m.y).forEach(function (q) { if (b[ix(q[0], q[1])] === 1) { var g = group(b, q[0], q[1]); if (g && g.libs <= 2) v += (3 - g.libs) * 30; } });
      // 偏好靠近已有棋子/星位，避免一盘散沙
      var cd = Math.abs(m.x - 4) + Math.abs(m.y - 4); v += (8 - cd) * 1.2;
      v += Math.random() * 8;
      if (v > bestV) { bestV = v; best = m; }
    }
    // 残局收束：若全盘多数已定且最佳着价值很低，则停手(pass)交给数子
    var filled = b.filter(function (c) { return c !== 0; }).length;
    if (filled > N * N * 0.7 && bestV < 6) return { pass: true };
    return best ? { x: best.x, y: best.y } : { pass: true };
  }
  // 数子：子 + 单色围空；白贴 3.5 目
  function score(b) {
    var bs = 0, ws = 0, i;
    for (i = 0; i < b.length; i++) { if (b[i] === 1) bs++; else if (b[i] === 2) ws++; }
    var seen = {};
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      if (b[ix(x, y)] !== 0 || seen[ix(x, y)]) continue;
      var st = [[x, y]], region = [], border = {};
      while (st.length) { var p = st.pop(), k = ix(p[0], p[1]); if (seen[k]) continue; seen[k] = 1; region.push(p);
        neigh(p[0], p[1]).forEach(function (q) { var c = b[ix(q[0], q[1])]; if (c === 0) { if (!seen[ix(q[0], q[1])]) st.push(q); } else border[c] = 1; }); }
      if (border[1] && !border[2]) bs += region.length; else if (border[2] && !border[1]) ws += region.length;
    }
    return { b: bs, w: ws + KOMI };
  }
  return {
    id: "weiqi", name: "围棋（9 路）", emoji: "⚪", kind: "board", mode: "go", boardType: "go",
    size: N, width: N, height: N, statKey: "mind", komi: KOMI, opponent: "茶馆·李教授",
    where: "老茶馆二楼，李教授守着一副云子棋盘，落子声里全是定力。", cond: function (s) { return s.age >= 18; },
    intro: "「围棋见心性。」李教授把黑子推给你——你先行。9 路小棋盘，子多+围空多者胜（白贴 3.75）。两家连续停手即终局数子。",
    newBoard: newBoard, tryPlace: tryPlace, aiPlace: aiPlace, score: score, group: group,
    onWin: function (s) { add(s, "mood", 8); add(s, "mind", 2); add(s, "insight", 1); return "终局数子，你竟赢了李教授半子！老先生推枰，长叹一声又欣然一笑：「后生可畏，可畏。」"; },
    onLose: function (s) { add(s, "mind", 2); add(s, "stress", -8); return "你被屠了大龙，输了不少目。可一盘棋下来，那份心静，比输赢金贵。李教授慢悠悠复盘，你听得入神。"; },
    onDraw: function (s) { add(s, "mood", 4); add(s, "mind", 1); return "数子下来不分伯仲，平局收场。李教授抚掌：「难得，难得。」"; }
  };
})();

var BOARDGAMES = [GOMOKU, XIANGQI, WEIQI];
function bgById(id) { for (var i = 0; i < BOARDGAMES.length; i++) if (BOARDGAMES[i].id === id) return BOARDGAMES[i]; return null; }
function bgAvailable(s) { return BOARDGAMES.filter(function (g) { try { return !g.cond || g.cond(s); } catch (e) { return false; } }); }
