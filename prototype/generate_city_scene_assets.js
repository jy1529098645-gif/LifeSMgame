"use strict";

const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "assets", "img", "city");
fs.mkdirSync(outDir, { recursive: true });

const districts = [
  { id: "campus", name: "川大望江校园", emoji: "🎓", palette: ["#335c67", "#9e6b35", "#1f3f4a"], facilities: [["校门","🏫"],["自习室","📖"],["校招宣讲厅","📣"],["食堂","🍚"],["地铁站","🚇"]] },
  { id: "talent_market", name: "人才服务中心", emoji: "📨", palette: ["#32465f", "#b48545", "#203248"], facilities: [["招聘大厅","📨"],["简历打印店","🖨️"],["面试等候区","🪑"],["楼下咖啡","☕"],["地铁站","🚇"]] },
  { id: "office_cbd", name: "高新区写字楼", emoji: "🏢", palette: ["#26394d", "#8aa4bd", "#182432"], facilities: [["公司大堂","🏢"],["开放工位","💻"],["会议室","📊"],["楼下咖啡","☕"],["地铁站","🚇"]] },
  { id: "tech_park", name: "天府软件园", emoji: "💻", palette: ["#213f4f", "#68a2a8", "#172d3a"], facilities: [["外包楼","🏭"],["项目会议室","📋"],["创业咖啡","☕"],["园区食堂","🍱"],["地铁站","🚇"]] },
  { id: "rental", name: "城南租住区", emoji: "🏚️", palette: ["#4a3b35", "#b37b4b", "#2c2523"], facilities: [["出租屋","🛏️"],["中介门店","🔑"],["菜市场","🥬"],["小卖部","🏪"],["地铁站","🚇"]] },
  { id: "mall", name: "春熙路商圈", emoji: "🛒", palette: ["#3e2f5b", "#c27a57", "#20172d"], facilities: [["商场","🛍️"],["餐饮街","🍲"],["便利店","🏪"],["酒吧/影院","🎬"],["地铁站","🚇"]] },
  { id: "park", name: "人民公园", emoji: "♟️", palette: ["#2f5b45", "#b88b52", "#183225"], facilities: [["茶馆","🍵"],["棋牌角","♟️"],["湖边步道","🌿"],["健身器材","🏃"],["地铁站","🚇"]] },
  { id: "clinic", name: "华西医院片区", emoji: "🏥", palette: ["#49636d", "#d8e5e8", "#20343d"], facilities: [["门诊楼","🏥"],["体检中心","🩺"],["药房","💊"],["急诊入口","🚑"],["地铁站","🚇"]] },
  { id: "arbitration", name: "法律服务中心", emoji: "⚖️", palette: ["#3f4650", "#c0a66c", "#252a31"], facilities: [["仲裁窗口","⚖️"],["调解室","🪑"],["打印店","🖨️"],["法律咨询台","📄"],["地铁站","🚇"]] }
];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;" }[c]));

function districtSvg(d) {
  const [a, b, c] = d.palette;
  const labels = d.facilities.map((f, i) => {
    const x = [270, 560, 430, 285, 620][i];
    const y = [230, 250, 390, 540, 560][i];
    return `<g transform="translate(${x} ${y})"><circle r="34" fill="${b}" opacity=".92"/><text y="8" text-anchor="middle" font-size="34">${esc(f[1])}</text><text y="56" text-anchor="middle" font-size="22" fill="#f8ead0" font-weight="700">${esc(f[0])}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
<defs><linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${c}"/></linearGradient><pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="skewX(-24)"><path d="M80 0H0v80" fill="none" stroke="#ffffff" stroke-opacity=".08"/></pattern><filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000" flood-opacity=".35"/></filter></defs>
<rect width="1280" height="720" fill="url(#sky)"/><rect width="1280" height="720" fill="url(#grid)"/><path d="M100 520 C310 405 480 390 670 465 C850 535 1040 500 1190 390" fill="none" stroke="#86c7d9" stroke-opacity=".5" stroke-width="18"/>
<g filter="url(#shadow)"><polygon points="180,565 420,445 705,545 455,675" fill="#2a3138"/><polygon points="500,355 800,235 1100,365 780,525" fill="#313943"/><polygon points="265,285 505,190 735,278 480,390" fill="#38424c"/></g>
${Array.from({length:28}, (_, i) => { const x = 120 + (i * 83) % 1040, y = 150 + (i * 47) % 390, h = 42 + (i * 19) % 120; return `<rect x="${x}" y="${y - h}" width="42" height="${h}" fill="#d6e0e8" opacity="${.28 + (i % 4) * .08}"/>`; }).join("")}
<text x="70" y="90" font-size="46" fill="#fff2cf" font-weight="800">${esc(d.emoji)} ${esc(d.name)}</text><text x="72" y="128" font-size="22" fill="#d8e2ef">区域放大图 · 同一城市俯瞰角度</text>${labels}</svg>`;
}

function facilitySvg(d, f) {
  const [a, b, c] = d.palette;
  const kind = f[0];
  const interior = kind.includes("地铁") ? "M150 500 H1130 L1040 620 H230 Z" : kind.includes("湖") || kind.includes("步道") ? "M120 500 C350 390 560 560 760 420 S1080 430 1160 520 L1160 650 L120 650 Z" : "M130 520 L360 330 H920 L1150 520 V650 H130 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${c}"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity=".38"/></filter></defs>
<rect width="1280" height="720" fill="url(#bg)"/><circle cx="1030" cy="110" r="220" fill="${b}" opacity=".18"/><path d="${interior}" fill="#edf3f4" opacity=".16" filter="url(#shadow)"/><path d="M140 590 H1140" stroke="#fff" stroke-opacity=".2" stroke-width="6"/>
${Array.from({length:9}, (_, i) => `<circle cx="${210 + i * 105}" cy="${555 - (i % 3) * 28}" r="${18 + (i % 2) * 8}" fill="#f5dcc0" opacity=".36"/>`).join("")}
<g transform="translate(90 96)"><text font-size="42" fill="#fff2cf" font-weight="800">${esc(f[1])} ${esc(kind)}</text><text y="42" font-size="22" fill="#d8e2ef">${esc(d.name)} · 设施场景图</text></g>
<g transform="translate(850 240)" opacity=".95"><rect x="0" y="0" width="290" height="180" rx="18" fill="#111923" opacity=".72"/><text x="145" y="78" text-anchor="middle" font-size="58">${esc(f[1])}</text><text x="145" y="128" text-anchor="middle" font-size="26" fill="#f8ead0" font-weight="700">${esc(kind)}</text></g></svg>`;
}

for (const d of districts) {
  fs.writeFileSync(path.join(outDir, `region-${d.id}.svg`), districtSvg(d), "utf8");
  d.facilities.forEach((f, i) => fs.writeFileSync(path.join(outDir, `facility-${d.id}-f${i}.svg`), facilitySvg(d, f), "utf8"));
}

console.log(`Generated ${districts.length} region maps and ${districts.reduce((n, d) => n + d.facilities.length, 0)} facility scenes in ${outDir}`);
