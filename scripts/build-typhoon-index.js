/**
 * build-typhoon-index.js
 * 一次性构建脚本：遍历中央气象台（NMC）1949 至今各年台风列表与路径详情，
 * 计算每个台风到福建九地市的最小距离，产出轻量索引 typhoon-index.json，
 * 供前端做跨年份「模糊搜索 / 拼音首字母搜索 / 影响福建 / 登陆福建」的秒级检索。
 *
 * 用法：
 *   cd scripts && npm install && node build-typhoon-index.js
 * 说明：
 *   - 支持断点续跑：距离缓存在 scripts/.cache-fjmin.json，登陆检测缓存在 scripts/.cache-landfj.json。
 *   - 判定口径：fjMin<300km => 影响福建(fujianHit)；海岸线穿越检测（海→陆且登陆点落在福建海岸段）=> 登陆福建(landFujian)。
 *   - 坐标系：NMC 台风路径点为 WGS-84/CGCS2000（puppeteer 实测 NMC 官网用天地图底图且全程无坐标转换），
 *     CITIES 与 CHINA_COASTLINE 亦为 WGS-84，故全程无需 GCJ-02↔WGS-84 转换。
 */
const fs = require("fs");
const path = require("path");
const { pinyin } = require("pinyin-pro");

// 福建九地市坐标（与前端 index.html 的 CITIES 保持一致）
const CITIES = [
  { name: "福州", lat: 26.0745, lng: 119.2965 },
  { name: "厦门", lat: 24.4798, lng: 118.0894 },
  { name: "泉州", lat: 24.8741, lng: 118.6757 },
  { name: "漳州", lat: 24.5133, lng: 117.658 },
  { name: "莆田", lat: 25.4313, lng: 119.0078 },
  { name: "宁德", lat: 26.6653, lng: 119.5505 },
  { name: "龙岩", lat: 25.0582, lng: 117.0186 },
  { name: "南平", lat: 26.6353, lng: 118.1782 },
  { name: "三明", lat: 26.2654, lng: 117.6256 },
];

const HIT_KM = 300; // 影响福建阈值
const LAND_KM = 50; // 登陆/逼近福建阈值
const CONCURRENCY = 6; // 详情抓取并发数
const START_YEAR = 1949;
const CURRENT_YEAR = new Date().getFullYear();

// 坐标系说明：NMC（中央气象台）台风路径点为 WGS-84/CGCS2000（经 puppeteer 实测验证——
// NMC 官网默认底图为天地图 CGCS2000≈WGS-84，且 typhoon-web.js 全程无坐标转换）。
// CITIES 与 CHINA_COASTLINE 亦为 WGS-84，故距离计算与登陆检测均直接使用 NMC 原始坐标，
// 无需任何 GCJ-02↔WGS-84 转换。


const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "typhoon-index.json");
const CACHE = path.join(__dirname, ".cache-fjmin.json");
const LAND_CACHE = path.join(__dirname, ".cache-landfj.json");

const LIST_URL = (y) =>
  y === CURRENT_YEAR
    ? "https://typhoon.nmc.cn/weatherservice/typhoon/jsons/list_default"
    : `https://typhoon.nmc.cn/weatherservice/typhoon/jsons/list_${y}`;
const VIEW_URL = (id) =>
  "https://typhoon.nmc.cn/weatherservice/typhoon/jsons/view_" + id;

function stripJsonp(raw) {
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("接口返回格式异常");
  return raw.slice(s, e + 1);
}

async function getJSON(url, retry = 3) {
  for (let i = 0; i < retry; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return JSON.parse(stripJsonp(await res.text()));
    } catch (e) {
      if (i === retry - 1) throw e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ===== 中国大陆海岸线（简化多边形，WGS-84）— 与前端 index.html 保持一致 =====
// 从广西东兴沿大陆海岸至辽宁丹东，不含海南/台湾等岛屿
const CHINA_COASTLINE = [
  [21.53, 108.05], [21.62, 108.50], [21.48, 109.10], [21.57, 109.70], [21.85, 111.98],
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
  [39.92, 121.75], [39.78, 122.20], [39.55, 122.40], [39.28, 122.80], [38.90, 123.00],
  [38.55, 122.95], [38.20, 122.60], [38.00, 122.15], [37.95, 121.85], [38.22, 121.55],
  [38.55, 121.65], [38.91, 121.61], [39.30, 121.45], [39.55, 121.05], [39.80, 120.60],
  [40.00, 124.38],
  // 以下为西部/北部陆上边界，使多边形闭合（仅为正确判定陆海，精度要求不高）
  [42.00, 126.50], [45.50, 131.00], [48.50, 134.00], [50.50, 127.00], [53.50, 123.50],
  [51.00, 119.00], [49.00, 113.00], [45.00, 108.00], [42.00, 100.00], [40.00, 94.00],
  [37.00, 88.00], [35.00, 82.00], [32.00, 79.00], [30.00, 82.00], [28.00, 85.00],
  [27.00, 92.00], [24.00, 97.00], [22.50, 99.50], [21.50, 103.00], [21.20, 107.50]
];

// 射线投射法：判断点是否在中国大陆多边形内
function isPointOnMainland(lat, lng) {
  const poly = CHINA_COASTLINE;
  const n = poly.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// 根据经纬度查找最近的已知沿海地点名称（与前端 index.html 保持一致）
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
  return best || `${lat.toFixed(1)}°N ${lng.toFixed(1)}°E`;
}

// 中文名 -> 拼音首字母（大写），如「苏力」->「SL」、「烟花」->「YH」
function pinyinInitials(cn) {
  if (!cn) return "";
  try {
    const arr = pinyin(cn, { pattern: "first", toneType: "none", type: "array" });
    return arr.join("").toUpperCase().replace(/[^A-Z]/g, "");
  } catch (e) {
    return "";
  }
}

// 从 code 解析年份第 N 号
function parseNo(code) {
  const s = String(code || "").trim();
  if (/^\d{8}$/.test(s)) return Number(s.slice(6, 8));
  if (/^\d{4}$/.test(s)) return Number(s.slice(-2));
  if (/^\d{1,3}$/.test(s)) return Number(s);
  return null;
}

// 内存级路径详情缓存（仅本次运行有效，避免 fjMin/landFujian 重复抓取同一台风详情）
const detailsCache = {};
async function fetchDetails(id) {
  if (detailsCache[id]) return detailsCache[id];
  const d = await getJSON(VIEW_URL(id));
  const pts = (d.typhoon && d.typhoon[8]) || [];
  detailsCache[id] = pts;
  return pts;
}

async function fjMinFor(id, cache) {
  if (cache[id] !== undefined) return cache[id];
  try {
    const pts = await fetchDetails(id);
    let min = Infinity;
    for (const p of pts) {
      const lng = Number(p[4]);
      const lat = Number(p[5]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      // NMC 路径点与 CITIES 均为 WGS-84，直接算距离
      for (const c of CITIES) {
        const dkm = haversineKm({ lat, lng }, c);
        if (dkm < min) min = dkm;
      }
    }
    const v = Number.isFinite(min) ? Math.round(min) : null;
    cache[id] = v;
    return v;
  } catch (e) {
    cache[id] = null;
    return null;
  }
}

// 检测台风是否登陆福建：遍历海→陆穿越点，判定登陆点是否落在福建海岸段
// （nearestCoastalName 返回值以"福建"开头即视为登陆福建，覆盖漳州~宁德纬度范围）
// NMC 路径坐标为 WGS-84，与 WGS-84 海岸线直接比对，无需坐标转换
async function landFujianFor(id, cache) {
  if (cache[id] !== undefined) return cache[id];
  try {
    const pts = await fetchDetails(id);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const aLat = Number(a[5]), aLng = Number(a[4]);
      const bLat = Number(b[5]), bLng = Number(b[4]);
      if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) continue;
      const aIn = isPointOnMainland(aLat, aLng);
      const bIn = isPointOnMainland(bLat, bLng);
      if (!aIn && bIn) {
        const name = nearestCoastalName(bLat, bLng);
        if (name && name.startsWith("福建")) { cache[id] = true; return true; }
      }
    }
    cache[id] = false;
    return false;
  } catch (e) {
    cache[id] = false;
    return false;
  }
}

// 简单并发池
async function pool(items, worker, concurrency) {
  const ret = new Array(items.length);
  let idx = 0;
  let done = 0;
  async function run() {
    while (idx < items.length) {
      const cur = idx++;
      ret[cur] = await worker(items[cur], cur);
      done++;
      if (done % 50 === 0 || done === items.length) {
        process.stdout.write(`\r  距离计算进度 ${done}/${items.length}   `);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  process.stdout.write("\n");
  return ret;
}

async function main() {
  console.log(`抓取 NMC 台风列表 ${START_YEAR}-${CURRENT_YEAR} …`);
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
  const landCache = fs.existsSync(LAND_CACHE) ? JSON.parse(fs.readFileSync(LAND_CACHE, "utf8")) : {};

  // 1) 收集所有年份的台风清单
  const raw = [];
  for (let y = START_YEAR; y <= CURRENT_YEAR; y++) {
    let list = [];
    try {
      const o = await getJSON(LIST_URL(y));
      list = o.typhoonList || [];
    } catch (e) {
      console.warn(`\n  ${y} 年列表抓取失败：${e.message}`);
    }
    for (const t of list) {
      const id = String(t[0]);
      const enName = t[1] && t[1] !== "nameless" ? t[1] : "";
      const name = t[2] && t[2] !== "nameless" ? t[2] : "";
      raw.push({ id, year: y, no: parseNo(t[3]), name, enName, status: t[7] });
    }
    process.stdout.write(`\r  年份 ${y} 累计台风 ${raw.length}   `);
  }
  process.stdout.write("\n");
  console.log(`共 ${raw.length} 条台风记录，开始计算到福建最近距离与登陆检测 …`);

  // 2) 并发抓详情算最近距离 + 福建登陆检测（带缓存续跑）
  let sinceSave = 0;
  await pool(
    raw,
    async (item) => {
      item.fjMin = await fjMinFor(item.id, cache);
      item.landFujian = await landFujianFor(item.id, landCache);
      if (++sinceSave >= 100) {
        sinceSave = 0;
        fs.writeFileSync(CACHE, JSON.stringify(cache));
        fs.writeFileSync(LAND_CACHE, JSON.stringify(landCache));
      }
      return item;
    },
    CONCURRENCY
  );
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  fs.writeFileSync(LAND_CACHE, JSON.stringify(landCache));

  // 3) 生成索引条目
  const index = raw.map((it) => {
    const fjMin = it.fjMin;
    return {
      id: it.id,
      year: it.year,
      no: it.no,
      name: it.name,
      enName: it.enName,
      pinyin: pinyinInitials(it.name),
      fjMin: fjMin,
      fujianHit: fjMin != null && fjMin < HIT_KM,
      // 登陆福建：海岸线穿越检测（海→陆且登陆点落在福建海岸段），非距离阈值
      landFujian: !!it.landFujian,
    };
  });

  // 按年份倒序、同年按编号倒序
  index.sort((a, b) => (b.year - a.year) || ((b.no || 0) - (a.no || 0)));

  const payload = {
    generatedAt: new Date().toISOString(),
    startYear: START_YEAR,
    endYear: CURRENT_YEAR,
    hitKm: HIT_KM,
    landKm: LAND_KM,
    count: index.length,
    typhoons: index,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload));

  const named = index.filter((x) => x.name).length;
  const hit = index.filter((x) => x.fujianHit).length;
  const land = index.filter((x) => x.landFujian).length;
  console.log(`\n已生成 ${OUT}`);
  console.log(`  总计 ${index.length} 个台风（其中有中文名 ${named} 个）`);
  console.log(`  影响福建(<${HIT_KM}km) ${hit} 个 · 登陆福建(海岸线检测) ${land} 个`);
}

main().catch((e) => {
  console.error("\n构建失败：", e);
  process.exit(1);
});
