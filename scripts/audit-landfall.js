/**
 * audit-landfall.js
 * 登陆坐标全量审计脚本（只读，不改检测逻辑）。
 *
 * 对全量台风跑前端的 detectLandfall / detectFujianLandfall，标记异常：
 *   - jumpKm: 相邻路径点 a→b 距离 >100km（采样跳跃，登陆坐标不确定）
 *   - inlandKm: 登陆点 b 到最近沿海城市 >80km（疑似深入内陆/多边形误判）
 *   - bohaiFalseLand: 登陆点落在渤海区域 lat∈[37,41] lng∈[117.5,122.5] 且 a 也在该区
 *   - fujianMismatch: typhoon-index.json 的 landFujian 与重算结果不一致
 *   - multiLandfall: 路径中出现 ≥2 次 海→陆 切换
 *
 * 用法：cd scripts && node audit-landfall.js
 * 产物：scripts/landfall-audit-report.json + scripts/landfall-audit-report.md
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const INDEX_JSON = path.join(ROOT, "typhoon-index.json");
const DETAIL_CACHE = path.join(__dirname, ".cache-details.json");
const REPORT_JSON = path.join(__dirname, "landfall-audit-report.json");
const REPORT_MD = path.join(__dirname, "landfall-audit-report.md");

const CONCURRENCY = 6;
const VIEW_URL = (id) => "https://typhoon.nmc.cn/weatherservice/typhoon/jsons/view_" + id;

// ===== 以下函数从前端 index.html 复制（保证审计逻辑与 app 一致）=====

// NMC p[1] 为 UTC，转北京时(UTC+8)
function nmcTime(str) {
    let m = String(str || "").match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/); // 12位 YYYYMMDDHHMM
    if (m) {
        const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + 8 * 3600 * 1000);
        const p = (n) => String(n).padStart(2, "0");
        return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00`;
    }
    // 老数据 10 位格式 YYYYMMDDHH（2010-2014 年部分台风，无分钟），同样为 UTC，转北京时
    m = String(str || "").match(/^(\d{4})(\d{2})(\d{2})(\d{2})$/);
    if (m) {
        const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], 0) + 8 * 3600 * 1000);
        const p = (n) => String(n).padStart(2, "0");
        return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:00:00`;
    }
    return String(str || "");
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

// 中国大陆海岸线（简化多边形，WGS-84）— 与 index.html / build-typhoon-index.js 一致
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
    // 渤海湾南岸 → 渤海海峡 → 辽东半岛西海岸（修正：原横切渤海湾顶，改为沿真实海岸线）
    [39.00, 118.00], [38.00, 118.50], [37.80, 119.20], [37.83, 120.75],
    [38.20, 120.70], [38.72, 121.27], [39.10, 121.55], [39.50, 121.80],
    [39.92, 121.75], [39.78, 122.20], [39.55, 122.40], [39.28, 122.80], [38.90, 123.00],
    [38.55, 122.95], [38.20, 122.60], [38.00, 122.15], [37.95, 121.85], [38.22, 121.55],
    [38.55, 121.65], [38.91, 121.61], [39.30, 121.45], [39.55, 121.05], [39.80, 120.60],
    [40.00, 124.38],
    // 修正：收紧到中朝边境，不包含朝鲜半岛
    [41.00, 124.50], [42.50, 125.00], [44.00, 126.00], [45.50, 126.50],
    [45.50, 131.00], [48.50, 134.00], [50.50, 127.00], [53.50, 123.50],
    [51.00, 119.00], [49.00, 113.00], [45.00, 108.00], [42.00, 100.00], [40.00, 94.00],
    [37.00, 88.00], [35.00, 82.00], [32.00, 79.00], [30.00, 82.00], [28.00, 85.00],
    [27.00, 92.00],
    // 修正：收紧到中缅/中老/中越边境，不包含缅甸/老挝/越南
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

function detectLandfall(points) {
    if (!points || points.length < 2) return { landed: false, time: null, lat: null, lng: null, point: null, idx: -1 };
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        const aIn = isPointOnMainland(a.lat, a.lng);
        const bIn = isPointOnMainland(b.lat, b.lng);
        if (!aIn && bIn) {
            return { landed: true, time: b.time, lat: b.lat, lng: b.lng, point: b, idx: i + 1 };
        }
    }
    return { landed: false, time: null, lat: null, lng: null, point: null, idx: -1 };
}

// 统计所有海→陆穿越次数（用于 multiLandfall 检测）
function countLandfalls(points) {
    if (!points || points.length < 2) return 0;
    let count = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        if (!isPointOnMainland(a.lat, a.lng) && isPointOnMainland(b.lat, b.lng)) count++;
    }
    return count;
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
    return { name: best || `${lat.toFixed(1)}°N ${lng.toFixed(1)}°E`, dist: bestD };
}

function detectFujianLandfall(points) {
    if (!points || points.length < 2) return false;
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        const aIn = isPointOnMainland(a.lat, a.lng);
        const bIn = isPointOnMainland(b.lat, b.lng);
        if (!aIn && bIn) {
            const { name } = nearestCoastalName(b.lat, b.lng);
            if (name && name.startsWith("福建")) return true;
        }
    }
    return false;
}

// ===== NMC 抓取（带持久化详情缓存）=====

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

// 将 NMC 原始路径点转为 detectLandfall 需要的格式
function parsePoints(rawPts) {
    return (rawPts || []).map((p) => ({
        time: nmcTime(p[1]),
        lat: Number(p[5]),
        lng: Number(p[4]),
        strong: p[3] || "",
        power: p[3] || "",
        pressure: p[6] != null ? Number(p[6]) : null,
        speed: p[7] != null ? Number(p[7]) : null,
    })).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

// 详情缓存（持久化，支持续跑）
const detailCache = fs.existsSync(DETAIL_CACHE)
    ? JSON.parse(fs.readFileSync(DETAIL_CACHE, "utf8"))
    : {};

async function fetchPoints(id) {
    if (detailCache[id]) return detailCache[id];
    const d = await getJSON(VIEW_URL(id));
    const rawPts = (d.typhoon && d.typhoon[8]) || [];
    const pts = parsePoints(rawPts);
    detailCache[id] = pts;
    return pts;
}

// 简单并发池
async function pool(items, worker, concurrency) {
    const ret = new Array(items.length);
    let idx = 0, done = 0;
    async function run() {
        while (idx < items.length) {
            const cur = idx++;
            ret[cur] = await worker(items[cur], cur);
            done++;
            if (done % 50 === 0 || done === items.length) {
                process.stdout.write(`\r  审计进度 ${done}/${items.length}   `);
                // 定期保存缓存
                if (done % 200 === 0) {
                    fs.writeFileSync(DETAIL_CACHE, JSON.stringify(detailCache));
                }
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
    process.stdout.write("\n");
    return ret;
}

// ===== 主审计逻辑 =====

function inBohai(lat, lng) {
    return lat >= 37 && lat <= 41 && lng >= 117.5 && lng <= 122.5;
}

async function main() {
    console.log("读取 typhoon-index.json …");
    const index = JSON.parse(fs.readFileSync(INDEX_JSON, "utf8"));
    const typhoons = index.typhoons;
    console.log(`共 ${typhoons.length} 个台风，开始全量审计 …`);

    const results = [];
    let sinceSave = 0;

    await pool(
        typhoons,
        async (t) => {
            let pts = [];
            let fetchError = null;
            try {
                pts = await fetchPoints(t.id);
            } catch (e) {
                fetchError = e.message;
            }

            const r = {
                id: t.id,
                name: t.name || "",
                enName: t.enName || "",
                year: t.year,
                no: t.no,
                indexLandFujian: t.landFujian,
                recalcLandFujian: false,
                landed: false,
                landfall: null,
                anomalies: [],
                fetchError,
            };

            if (fetchError || pts.length < 2) {
                r.anomalies.push(fetchError ? `fetchError: ${fetchError}` : `points<2 (${pts.length})`);
                results.push(r);
                return r;
            }

            // 重算登陆福建
            r.recalcLandFujian = detectFujianLandfall(pts);

            // 登陆中国大陆检测
            const lf = detectLandfall(pts);
            r.landed = lf.landed;
            if (lf.landed) {
                const coastal = nearestCoastalName(lf.lat, lf.lng);
                const a = pts[lf.idx - 1], b = pts[lf.idx];
                const jumpKm = haversineKm(a, b);
                r.landfall = {
                    time: lf.time,
                    lat: lf.lat,
                    lng: lf.lng,
                    strong: b.strong,
                    pressure: b.pressure,
                    speed: b.speed,
                    coastalName: coastal.name,
                    coastalDist: Math.round(coastal.dist),
                    aLat: a.lat, aLng: a.lng,
                    jumpKm: Math.round(jumpKm),
                    idx: lf.idx,
                };

                // 异常标记
                if (jumpKm > 100) r.anomalies.push("jumpKm");
                if (coastal.dist > 80) r.anomalies.push("inlandKm");
                if (inBohai(b.lat, b.lng) && inBohai(a.lat, a.lng)) r.anomalies.push("bohaiFalseLand");
            }

            // fujianMismatch
            if (t.landFujian !== r.recalcLandFujian) r.anomalies.push("fujianMismatch");

            // multiLandfall
            const lc = countLandfalls(pts);
            if (lc >= 2) r.anomalies.push("multiLandfall");

            results.push(r);

            if (++sinceSave >= 100) {
                sinceSave = 0;
                fs.writeFileSync(DETAIL_CACHE, JSON.stringify(detailCache));
            }
            return r;
        },
        CONCURRENCY
    );

    fs.writeFileSync(DETAIL_CACHE, JSON.stringify(detailCache));

    // ===== 汇总统计 =====
    const landed = results.filter((r) => r.landed);
    const anomalous = results.filter((r) => r.anomalies.length > 0);
    const byType = {};
    for (const r of anomalous) {
        for (const a of r.anomalies) {
            byType[a] = (byType[a] || 0) + 1;
        }
    }

    const summary = {
        total: results.length,
        landed: landed.length,
        anomalous: anomalous.length,
        byAnomalyType: byType,
        fujianMismatchCount: results.filter((r) => r.anomalies.includes("fujianMismatch")).length,
        bohaiFalseLandCount: results.filter((r) => r.anomalies.includes("bohaiFalseLand")).length,
    };

    // ===== 输出 JSON 报告 =====
    const report = {
        generatedAt: new Date().toISOString(),
        summary,
        anomalies: anomalous.map((r) => ({
            id: r.id, name: r.name, enName: r.enName, year: r.year, no: r.no,
            anomalies: r.anomalies,
            landed: r.landed,
            landfall: r.landfall,
            indexLandFujian: r.indexLandFujian,
            recalcLandFujian: r.recalcLandFujian,
            fetchError: r.fetchError,
        })),
        allLanded: landed.map((r) => ({
            id: r.id, name: r.name, year: r.year,
            time: r.landfall?.time, lat: r.landfall?.lat, lng: r.landfall?.lng,
            coastalName: r.landfall?.coastalName, coastalDist: r.landfall?.coastalDist,
            jumpKm: r.landfall?.jumpKm, anomalies: r.anomalies,
        })),
    };
    fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

    // ===== 输出 Markdown 报告 =====
    let md = `# 登陆坐标审计报告\n\n`;
    md += `生成时间：${report.generatedAt}\n\n`;
    md += `## 汇总\n\n`;
    md += `| 指标 | 数值 |\n|------|------|\n`;
    md += `| 总台风数 | ${summary.total} |\n`;
    md += `| 检出登陆中国大陆 | ${summary.landed} |\n`;
    md += `| 有异常的台风 | ${summary.anomalous} |\n\n`;
    md += `### 异常类型分布\n\n`;
    md += `| 异常类型 | 数量 |\n|----------|------|\n`;
    for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
        md += `| ${k} | ${v} |\n`;
    }
    md += `\n## 异常清单（前 50 条）\n\n`;
    md += `| 年份 | 名称 | 异常 | 登陆点 | 登陆时间 | coastalDist | jumpKm |\n`;
    md += `|------|------|------|--------|----------|------------|--------|\n`;
    for (const r of report.anomalies.slice(0, 50)) {
        const lf = r.landfall;
        md += `| ${r.year} | ${r.name || r.enName || r.id} | ${r.anomalies.join(",")} | ${lf ? `${lf.coastalName}(${lf.lat.toFixed(1)},${lf.lng.toFixed(1)})` : "—"} | ${lf ? lf.time : "—"} | ${lf ? lf.coastalDist + "km" : "—"} | ${lf ? lf.jumpKm + "km" : "—"} |\n`;
    }
    md += `\n## 渤海假陆地疑似清单\n\n`;
    const bohai = report.anomalies.filter((r) => r.anomalies.includes("bohaiFalseLand"));
    if (bohai.length === 0) {
        md += `无\n`;
    } else {
        md += `| 年份 | 名称 | 登陆点 | 登陆时间 | a点 | b点 |\n|------|------|--------|----------|------|------|\n`;
        for (const r of bohai) {
            const lf = r.landfall;
            md += `| ${r.year} | ${r.name || r.enName} | ${lf?.coastalName} | ${lf?.time} | (${lf?.aLat?.toFixed(1)},${lf?.aLng?.toFixed(1)}) | (${lf?.lat?.toFixed(1)},${lf?.lng?.toFixed(1)}) |\n`;
        }
    }
    md += `\n## fujianMismatch 清单\n\n`;
    const mismatch = report.anomalies.filter((r) => r.anomalies.includes("fujianMismatch"));
    if (mismatch.length === 0) {
        md += `无\n`;
    } else {
        md += `| 年份 | 名称 | index.landFujian | 重算landFujian |\n|------|------|-----------------|----------------|\n`;
        for (const r of mismatch.slice(0, 50)) {
            md += `| ${r.year} | ${r.name || r.enName || r.id} | ${r.indexLandFujian} | ${r.recalcLandFujian} |\n`;
        }
        if (mismatch.length > 50) md += `\n... 共 ${mismatch.length} 条，仅显示前 50\n`;
    }
    fs.writeFileSync(REPORT_MD, md);

    console.log(`\n审计完成：`);
    console.log(`  总计 ${summary.total} 个台风`);
    console.log(`  检出登陆中国大陆 ${summary.landed} 个`);
    console.log(`  有异常 ${summary.anomalous} 个`);
    console.log(`  异常类型：${JSON.stringify(byType)}`);
    console.log(`\n报告已生成：`);
    console.log(`  ${REPORT_JSON}`);
    console.log(`  ${REPORT_MD}`);
}

main().catch((e) => {
    console.error("\n审计失败：", e);
    process.exit(1);
});
