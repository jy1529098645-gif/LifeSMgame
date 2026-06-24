"use strict";

const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "assets", "img", "city");
fs.mkdirSync(outDir, { recursive: true });

const districts = [
  { id: "campus", name: "川大望江校园", theme: "campus", palette: ["#dfe4d4", "#a9b88c", "#607948"], facilities: ["教学楼", "自习室", "校招宣讲厅", "食堂", "宿舍区"] },
  { id: "talent_market", name: "人才服务中心", theme: "civic", palette: ["#dfe3e5", "#b9b5a5", "#6c7480"], facilities: ["招聘大厅", "简历打印店", "面试等候区", "楼下咖啡", "地铁站"] },
  { id: "office_cbd", name: "高新区写字楼", theme: "cbd", palette: ["#dce5e8", "#b9c6cf", "#5d7184"], facilities: ["公司大堂", "开放工位", "会议室", "楼下咖啡", "地铁站"] },
  { id: "tech_park", name: "天府软件园", theme: "parkbiz", palette: ["#d9e3df", "#a8c0ba", "#4f7c80"], facilities: ["外包楼", "项目会议室", "创业咖啡", "园区食堂", "地铁站"] },
  { id: "rental", name: "城南租住区", theme: "dense", palette: ["#ded8cc", "#b7926b", "#775a45"], facilities: ["出租屋", "中介门店", "菜市场", "小卖部", "地铁站"] },
  { id: "mall", name: "春熙路商圈", theme: "mall", palette: ["#e3ded6", "#c5a07d", "#7c7f8d"], facilities: ["商场", "餐饮街", "便利店", "酒吧/影院", "地铁站"] },
  { id: "park", name: "人民公园", theme: "green", palette: ["#dce5cc", "#91b574", "#496b4e"], facilities: ["茶馆", "棋牌角", "湖边步道", "健身器材", "地铁站"] },
  { id: "clinic", name: "华西医院片区", theme: "hospital", palette: ["#e1e7e7", "#c7d2d4", "#70848b"], facilities: ["门诊楼", "体检中心", "药房", "急诊入口", "地铁站"] },
  { id: "arbitration", name: "法律服务中心", theme: "civic", palette: ["#dfe1dc", "#b8b2a0", "#6c675d"], facilities: ["仲裁窗口", "调解室", "打印店", "法律咨询台", "地铁站"] }
];

const facilityPoints = [
  [360, 250],
  [610, 245],
  [780, 390],
  [470, 500],
  [955, 535]
];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;" }[c]));
const n = v => Number(v).toFixed(1).replace(/\.0$/, "");

function building(x, y, w, d, h, color, roof = "#eef2ee") {
  const top = `${n(x)},${n(y - h)} ${n(x + w)},${n(y - h - d * .38)} ${n(x + w + d)},${n(y - h)} ${n(x + d)},${n(y - h + d * .38)}`;
  const left = `${n(x)},${n(y - h)} ${n(x + d)},${n(y - h + d * .38)} ${n(x + d)},${n(y + d * .38)} ${n(x)},${n(y)}`;
  const right = `${n(x + d)},${n(y - h + d * .38)} ${n(x + w + d)},${n(y - h)} ${n(x + w + d)},${n(y)} ${n(x + d)},${n(y + d * .38)}`;
  return `<g class="b"><polygon points="${left}" fill="${color}" opacity=".88"/><polygon points="${right}" fill="#8f9ba0" opacity=".72"/><polygon points="${top}" fill="${roof}"/><path d="M${n(x + 8)} ${n(y - h + 10)}h${n(Math.max(12, w - 16))}" stroke="#fff" stroke-opacity=".45"/></g>`;
}

function blocks(theme, focusIndex = -1) {
  const out = [];
  const count = theme === "dense" ? 92 : theme === "green" ? 26 : theme === "cbd" ? 72 : theme === "hospital" ? 42 : 56;
  for (let i = 0; i < count; i++) {
    const col = i % 11;
    const row = Math.floor(i / 11);
    let x = 95 + col * 94 + (row % 2) * 22 + (i * 17) % 24;
    let y = 145 + row * 52 + (i * 23) % 22;
    let h = 22 + (i * 13) % 58;
    let w = 32 + (i * 7) % 30;
    let d = 18 + (i * 5) % 16;
    if (theme === "cbd") h += col > 3 && col < 8 ? 72 : 22;
    if (theme === "dense") { h = 18 + (i * 7) % 36; w = 24 + (i * 5) % 22; d = 16; }
    if (theme === "green" && i % 3 !== 0) continue;
    if (theme === "hospital") { h = 30 + (i * 9) % 38; w = 46 + (i * 3) % 36; d = 22; }
    if (theme === "campus") { h = 18 + (i * 5) % 34; w = 42 + (i * 3) % 34; }
    const distToFocus = focusIndex >= 0 ? Math.hypot(x - facilityPoints[focusIndex][0], y - facilityPoints[focusIndex][1]) : 9999;
    const color = distToFocus < 115 ? "#d5e6ed" : theme === "dense" ? "#a98669" : theme === "cbd" ? "#9fb5c2" : theme === "hospital" ? "#c7d4d7" : "#b4b9ad";
    out.push(building(x, y, w, d, h, color, distToFocus < 115 ? "#ffffff" : "#eef1ea"));
  }
  return out.join("");
}

function roads() {
  return `<g class="roads">
    <path d="M-40 575 C190 500 365 500 565 545 C775 595 1005 575 1320 455" stroke="#464d50" stroke-width="54" fill="none"/>
    <path d="M-40 575 C190 500 365 500 565 545 C775 595 1005 575 1320 455" stroke="#eef0e8" stroke-width="4" fill="none" opacity=".65"/>
    <path d="M1020 -30 C900 120 850 285 900 505 C925 610 1005 685 1115 760" stroke="#4c5356" stroke-width="36" fill="none"/>
    <path d="M130 720 C235 540 330 390 445 270 C560 150 740 85 1110 35" stroke="#454c50" stroke-width="34" fill="none"/>
    <path d="M120 365 C330 305 520 315 685 365 C815 405 915 405 1045 360" stroke="#595f62" stroke-width="18" fill="none" opacity=".92"/>
    <path d="M120 365 C330 305 520 315 685 365 C815 405 915 405 1045 360" stroke="#f5f1df" stroke-width="2" fill="none" opacity=".6"/>
  </g>`;
}

function waterAndGreen(theme) {
  const river = `<path d="M-30 125 C150 215 245 55 405 125 C535 180 675 120 805 65 C955 0 1115 45 1320 -25 L1320 0 C1110 90 970 55 820 120 C660 190 525 230 375 170 C225 115 155 265 -30 185Z" fill="#5f8fa3" opacity=".78"/>`;
  const lake = theme === "green" ? `<ellipse cx="385" cy="365" rx="190" ry="105" fill="#5d96a9" opacity=".85"/><path d="M230 365 C310 315 410 315 535 365" stroke="#dceeea" stroke-width="4" fill="none" opacity=".45"/>` : "";
  const park = `<g opacity=".88">
    <path d="M40 410 C155 345 260 350 365 420 C245 500 135 510 40 410Z" fill="#75a766"/>
    <path d="M875 125 C980 80 1130 100 1230 175 C1100 245 980 235 875 125Z" fill="#7ca56b"/>
    ${Array.from({ length: 80 }, (_, i) => `<circle cx="${60 + (i * 73) % 1120}" cy="${125 + (i * 41) % 500}" r="${2 + (i % 4)}" fill="#436b3c" opacity=".55"/>`).join("")}
  </g>`;
  return river + lake + park;
}

function railStation() {
  return `<g transform="translate(910 555)" filter="url(#softShadow)">
    <rect x="-82" y="-26" width="164" height="52" rx="8" fill="#d7d9d5"/>
    <path d="M-70 6 H70" stroke="#6c7172" stroke-width="8"/>
    <path d="M-48 -11 H48" stroke="#9aa1a2" stroke-width="4"/>
    <circle cx="-36" cy="19" r="6" fill="#44525a"/><circle cx="36" cy="19" r="6" fill="#44525a"/>
  </g>`;
}

function landmarks(d, focusIndex = -1) {
  const labels = d.facilities.map((name, i) => {
    const [x, y] = facilityPoints[i];
    const active = i === focusIndex;
    if (i === 4) return railStation() + marker(x, y, name, active);
    const core = active ? "#fff7c2" : "#f6f1de";
    const shape = `<g transform="translate(${x} ${y})" filter="url(#softShadow)">
      <ellipse cx="0" cy="28" rx="92" ry="34" fill="#263238" opacity=".16"/>
      <rect x="-54" y="-58" width="108" height="96" rx="6" fill="${core}" opacity=".98"/>
      <path d="M-54 -58 L0 -84 L54 -58 Z" fill="#d9e6ea"/>
      <path d="M-36 -30 H36 M-36 -6 H36 M-36 18 H36" stroke="#8a9aa0" stroke-width="4" opacity=".55"/>
    </g>`;
    return shape + marker(x, y, name, active);
  }).join("");
  return labels;
}

function marker(x, y, name, active) {
  return `<g transform="translate(${x} ${y - 94})" class="marker">
    <path d="M0 -22 C24 -22 40 -7 40 13 C40 43 0 64 0 64 C0 64 -40 43 -40 13 C-40 -7 -24 -22 0 -22Z" fill="${active ? "#ffd66b" : "#f4ead1"}" stroke="#5a533f" stroke-width="3"/>
    <circle cx="0" cy="12" r="13" fill="${active ? "#fff7cf" : "#b8c9d0"}"/>
    <text x="0" y="92" text-anchor="middle" font-size="${active ? 25 : 21}" font-weight="800" fill="#2f312d" paint-order="stroke" stroke="#fff5da" stroke-width="5">${esc(name)}</text>
  </g>`;
}

function clouds() {
  return `<g opacity=".42" filter="url(#blur)">
    <ellipse cx="80" cy="40" rx="130" ry="42" fill="#fff"/>
    <ellipse cx="1230" cy="62" rx="145" ry="46" fill="#fff"/>
    <ellipse cx="1160" cy="695" rx="170" ry="50" fill="#fff"/>
    <ellipse cx="35" cy="680" rx="140" ry="44" fill="#fff"/>
  </g>`;
}

function defs(d) {
  const [ground, mid, deep] = d.palette;
  return `<defs>
    <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${ground}"/><stop offset=".58" stop-color="#d3d6cb"/><stop offset="1" stop-color="${mid}"/></linearGradient>
    <filter id="softShadow"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#1a2327" flood-opacity=".28"/></filter>
    <filter id="blur"><feGaussianBlur stdDeviation="13"/></filter>
    <radialGradient id="sun" cx="12%" cy="5%" r="75%"><stop stop-color="#fff6d6" stop-opacity=".68"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity=".04"/><stop offset="1" stop-color="${deep}" stop-opacity=".18"/></linearGradient>
  </defs>`;
}

function mapSvg(d, focusIndex = -1, facilityName = "") {
  const focus = focusIndex >= 0 ? `<circle cx="${facilityPoints[focusIndex][0]}" cy="${facilityPoints[focusIndex][1]}" r="142" fill="#ffd66b" opacity=".18"/><circle cx="${facilityPoints[focusIndex][0]}" cy="${facilityPoints[focusIndex][1]}" r="88" fill="none" stroke="#ffe08a" stroke-width="7" opacity=".9"/>` : "";
  const title = facilityName || d.name;
  const sub = facilityName ? `${d.name} · 设施放大图` : "区域放大图 · 与城市总览同一俯瞰角度";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
${defs(d)}
<rect width="1280" height="720" fill="url(#ground)"/>
<rect width="1280" height="720" fill="url(#sun)"/>
${waterAndGreen(d.theme)}
${roads()}
<g filter="url(#softShadow)">${blocks(d.theme, focusIndex)}</g>
${focus}
${landmarks(d, focusIndex)}
<g>
  <rect x="44" y="38" width="${facilityName ? 430 : 450}" height="86" rx="12" fill="#fff8e7" opacity=".86"/>
  <text x="68" y="82" font-size="34" fill="#263238" font-weight="800">${esc(title)}</text>
  <text x="70" y="110" font-size="18" fill="#627073">${esc(sub)}</text>
</g>
${clouds()}
<rect width="1280" height="720" fill="url(#v)"/>
</svg>`;
}

for (const d of districts) {
  fs.writeFileSync(path.join(outDir, `region-${d.id}.svg`), mapSvg(d), "utf8");
  d.facilities.forEach((name, i) => {
    fs.writeFileSync(path.join(outDir, `facility-${d.id}-f${i}.svg`), mapSvg(d, i, name), "utf8");
  });
}

console.log(`Generated ${districts.length} region maps and ${districts.reduce((sum, d) => sum + d.facilities.length, 0)} facility scenes in ${outDir}`);
