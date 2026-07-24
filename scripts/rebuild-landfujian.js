/**
 * rebuild-landfujian.js
 * 用修正后的 CHINA_COASTLINE 多边形重新计算 typhoon-index.json 的 landFujian 字段。
 * 利用 audit-landfall.js 的 .cache-details.json 缓存，无需重新从 NMC 抓取。
 *
 * 用法：node scripts/rebuild-landfujian.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const INDEX_JSON = path.join(ROOT, "typhoon-index.json");
const DETAIL_CACHE = path.join(__dirname, ".cache-details.json");

// ===== 修正后的 CHINA_COASTLINE（与 index.html / build-typhoon-index.js 一致）=====
const CHINA_COASTLINE = [
  [21.53, 108.05], [21.62, 108.50], [21.48, 109.10], [21.57, 109.70],
  [20.30, 109.95], [20.30, 110.55], // 雷州半岛南端（修正：原边横切半岛根部，漏判湛江登陆）
  [21.85, 111.98],
  [22.15, 113.55], [22.30, 114.17], [22.55, 114.30], [22.80, 114.70], [23.00, 115.35],
  [23.35, 116.68], [23.58, 117.05], [23.90, 117.48], [24.45, 118.07], [24.90, 118.55],
  [25.45, 119.00], [25.72, 119.55], [26.07, 119.30], [26.38, 119.85], [26.95, 120.25],
  [27.45, 120.55], [27.99, 120.70], [28.60, 121.42], [29.20, 121.65], [29.87, 121.55],
  [30.25, 121.20], [30.70, 121.15], [31.14, 121.90], [31.23, 121.47], [31.55, 121.85],
  [32.00, 121.72], [32.43, 121.42], [32.80, 121.00], [33.20, 120.80], [33.50, 120.45],
  [33.90, 120.25], [34.25, 119.85], [34.60, 119.17], [35.05, 119.38], [35.42, 119.55],
  [35.88, 120.05], [36.07, 120.38], [36.28, 120.52], [36.58, 120.80], [37.00, 121.30],
  [37.38, 121.88], [37.51, 122.12], [37.68, 122.35], [37.90, 122.00], [38.15, 121.60],
  [38.40, 121.20], [38.65, 120.80], [38.91, 120.30], [39.20, 119.60], [39.53, 119.10],
  [39.80, 118.65], [39.93, 118.25], [40.05, 117.90], [40.10, 117.50], [40.08, 117.10],
  [39.00, 118.00], [38.00, 118.50], [37.80, 119.20], [37.83, 120.75],
  [38.20, 120.70], [38.72, 121.27], [39.10, 121.55], [39.50, 121.80],
  [39.92, 121.75], [39.78, 122.20], [39.55, 122.40], [39.28, 122.80], [38.90, 123.00],
  [38.55, 122.95], [38.20, 122.60], [38.00, 122.15], [37.95, 121.85], [38.22, 121.55],
  [38.55, 121.65], [38.91, 121.61], [39.30, 121.45], [39.55, 121.05], [39.80, 120.60],
  [40.00, 124.38],
  [41.00, 124.50], [42.50, 125.00], [44.00, 126.00], [45.50, 126.50],
  [45.50, 131.00], [48.50, 134.00], [50.50, 127.00], [53.50, 123.50],
  [51.00, 119.00], [49.00, 113.00], [45.00, 108.00], [42.00, 100.00], [40.00, 94.00],
  [37.00, 88.00], [35.00, 82.00], [32.00, 79.00], [30.00, 82.00], [28.00, 85.00],
  [27.00, 92.00],
  // 二次修正：插入中越边境河口顶点 [22.50, 103.90]，原斜边把越南北部包入
  [24.00, 97.50], [22.50, 101.50], [22.50, 103.90], [21.50, 107.80]
];

function isPointOnMainland(lat, lng) {
  const poly = CHINA_COASTLINE;
  const n = poly.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearestCoastalName(lat, lng) {
  const coastal = [
    ["广西东兴", 21.53, 108.05], ["广西北海", 21.48, 109.10], ["广东湛江", 21.27, 110.35],
    ["广东茂名", 21.66, 110.92], ["广东阳江", 21.85, 111.98], ["广东珠海", 22.27, 113.57],
    ["广东深圳", 22.54, 114.06], ["广东汕尾", 22.78, 115.36], ["广东汕头", 23.35, 116.68],
    ["福建漳州", 24.36, 117.70], ["福建厦门", 24.48, 118.09], ["福建泉州", 24.87, 118.68],
    ["福建莆田", 25.43, 119.01], ["福建福州", 26.07, 119.30], ["福建宁德", 26.67, 119.55],
    ["浙江温州", 28.00, 120.70], ["浙江台州", 28.66, 121.42], ["浙江宁波", 29.87, 121.55],
    ["上海", 31.23, 121.47], ["江苏南通", 31.98, 120.89], ["江苏盐城", 33.38, 120.13],
    ["江苏连云港", 34.60, 119.17], ["山东日照", 35.42, 119.53], ["山东青岛", 36.07, 120.38],
    ["山东烟台", 37.53, 121.39], ["山东威海", 37.51, 122.12], ["天津", 38.91, 117.70],
    ["河北秦皇岛", 39.93, 119.60], ["辽宁大连", 38.91, 121.61], ["辽宁丹东", 40.00, 124.38]
  ];
  let best = null, bestD = Infinity;
  for (const [name, clat, clng] of coastal) {
    const d = haversineKm({ lat, lng }, { lat: clat, lng: clng });
    if (d < bestD) { bestD = d; best = name; }
  }
  return best || "";
}

function detectFujianLandfall(points) {
  if (!points || points.length < 2) return false;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const aIn = isPointOnMainland(a.lat, a.lng);
    const bIn = isPointOnMainland(b.lat, b.lng);
    if (!aIn && bIn) {
      const name = nearestCoastalName(b.lat, b.lng);
      if (name && name.startsWith("福建")) return true;
    }
  }
  return false;
}

// 将 .cache-details.json 中的点（已含 lat/lng）直接用于检测
function main() {
  console.log("读取 typhoon-index.json …");
  const index = JSON.parse(fs.readFileSync(INDEX_JSON, "utf8"));
  console.log("读取 .cache-details.json …");
  const details = JSON.parse(fs.readFileSync(DETAIL_CACHE, "utf8"));

  let changed = 0;
  let oldLand = 0, newLand = 0;
  for (const t of index.typhoons) {
    const oldVal = t.landFujian;
    const pts = details[t.id] || [];
    const newVal = detectFujianLandfall(pts);
    if (oldVal !== newVal) changed++;
    if (oldVal) oldLand++;
    if (newVal) newLand++;
    t.landFujian = newVal;
  }

  index.generatedAt = new Date().toISOString();
  fs.writeFileSync(INDEX_JSON, JSON.stringify(index));

  console.log(`\n重建完成：`);
  console.log(`  landFujian 变化：${oldLand} → ${newLand}（${changed} 个台风标记变更）`);
  console.log(`  typhoon-index.json 已更新`);
}

main();
