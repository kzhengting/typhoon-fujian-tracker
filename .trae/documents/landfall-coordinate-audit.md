# 台风登陆坐标全量审计与 bug 修复

## 摘要
巴威（BAVI）登陆时间之前出错，是 `nmcTime` 把 NMC 的 UTC 时间字段当成北京时间直接输出（全局慢 8h）所致，已修复。本任务由此「举一反三」：**对全部 2537 个台风的登陆坐标做全量自动扫描 + 知名样本核对**，确认登陆坐标管线无同类隐藏 bug，并仅修复扫描确认的真实 bug（不提升精度、不插值、不加密多边形）。

## 现状分析（Phase 1 探索结论）

### A. 巴威时间 bug 根因（已修复，非坐标问题）
- `parsePoint` 设 `time: nmcTime(p[1])`（[index.html:2813](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2813)）。NMC 的 `p[1]`（如 `202607111700`）是 **UTC 时刻**，旧 `nmcTime` 原样按字面输出为北京时间 → 全局慢 8h（巴威登陆显示 17:00，实际 01:00）。
- 已修复：`nmcTime` 改为 `Date.UTC(...)+8h` 转北京时（[index.html:2619-2627](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2619-L2627)）。
- **坐标无同类 bug**：NMC 路径点、`CITIES`、`CHINA_COASTLINE` 均为 WGS-84，全程不做 GCJ-02↔WGS-84 转换（[build-typhoon-index.js:38-41](file:///d:/kzht/Documents/typhoon-fujian-tracker/scripts/build-typhoon-index.js#L38-L41)、[index.html:3552](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3552)）。不存在「坐标系误用」类 bug。

### B. 登陆坐标管线（前端）
- `detectLandfall(points)`（[index.html:3548-3561](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3548-L3561)）：遍历相邻路径点对，找首个 `海→陆` 切换，返回 `{landed, time:b.time, lat:b.lat, lng:b.lng, point:b}`。**登陆坐标 = 首个陆上采样点 `b`**（真实 NMC 路径点，坐标本身准确）。
- `isPointOnMainland`（[index.html:3530-3544](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3530-L3544)）：射线投射法对 `CHINA_COASTLINE` 多边形判定。
- `nearestCoastalName`（[index.html:3564-3583](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3564-L3583)）：30 个沿海城市中取最近，作为登陆地点名。
- 生命周期时间轴展示：`landfall.time` + `nearestCoastalName(landfall.lat,landfall.lng)`（[index.html:3708-3716](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3708-L3716)）。
- `typhoon-index.json` 仅存 `landFujian: boolean`，**不存登陆坐标/时间**（[build-typhoon-index.js:300-314](file:///d:/kzht/Documents/typhoon-fujian-tracker/scripts/build-typhoon-index.js#L300-L314)）。

### C. 已知精度限制（本次不修，符合用户「仅修复 bug」决策）
1. 登陆点=首个陆上采样点 `b`，真实穿越点在 `a→b` 之间（3-6h 采样，可能偏内陆 0-50km）。
2. `CHINA_COASTLINE` 约 90 顶点的简化多边形。
3. `nearestCoastalName` 取 30 城最近，地点名为近似。
4. 仅报首次登陆。

### D. 疑似真实 bug（待全量扫描确认）
- **渤海「假陆地」**：多边形边 `[40.08,117.10]→[39.92,121.75]`（[index.html:3517-3518](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3517-L3518)）横切渤海湾顶，把渤海海域包进「大陆」多边形 → 进入渤海的台风可能被误判「已登陆」或登陆点/时间错位。
- **雷州半岛/北部湾**：多边形西端从 `[21.53,108.05]` 起，雷州半岛南端（~20°N,110°E）可能在多边形外 → 登陆雷州的台风可能漏判或错位。
- **build 与前端重复副本**：`CHINA_COASTLINE`/`isPointOnMainland`/`nearestCoastalName`/登陆检测在 `build-typhoon-index.js` 与 `index.html` 各有一份，任何多边形修正必须两边同步。

## 改动方案

### 步骤 1：新增审计脚本 `scripts/audit-landfall.js`（只读审计，不改检测逻辑）
- 复用 `build-typhoon-index.js` 的 NMC 抓取 + `stripJsonp` + `.cache-fjmin.json`/`.cache-landfj.json` 续跑缓存（避免重复抓 2537 详情）。
- **复制**（非 import）前端的 `detectLandfall`/`detectFujianLandfall`/`isPointOnMainland`/`nearestCoastalName`/`CHINA_COASTLINE` 到脚本内——保证审计用的逻辑与 app 实际运行的一致（前端单文件零依赖，不抽共享模块）。
- 对全量台风跑 `detectLandfall`，对每个 landed 台风记录：`id/name/year、landfall.lat/lng/time、nearestCoastalName、a(海点).lat/lng、a→b 距离`。
- 输出 `scripts/landfall-audit-report.json`（结构化）+ `scripts/landfall-audit-report.md`（可读）。
- **异常标记规则**：
  - `jumpKm = haversineKm(a,b) > 100` → 采样跳跃，登陆坐标不确定，待核。
  - `inlandKm`（`b` 到最近 30 沿海城市距离）> 80 → 疑似深入内陆/多边形误判。
  - `bohaiFalseLand`：`b` 落在 lat∈[37,41]、lng∈[117.5,122.5] 且 `a` 也在该区 → 疑似渤海假陆地误判。
  - `fujianMismatch`：`typhoon-index.json` 的 `landFujian` 与脚本重算的 `detectFujianLandfall` 不一致。
  - `multiLandfall`：路径中出现 ≥2 次 `海→陆` 切换（仅提示，不改行为）。
- 脚本末尾打印汇总：总台风数、检出登陆数、各异常类目计数、异常清单前 N 条。

### 步骤 2：知名样本核对（~30 个）
对以下台风逐一比对 app 检测结果（登陆坐标/时间/地点）与权威记录（NMC 官网存档 + CMA 热带气旋最佳路径 + 官方登陆通报）：
巴威2026、桑美2006、莫兰蒂2016、杜苏芮2023、海棠2005、麦莎2005、菲特2013、灿鸿2015、玛莉亚2018、利奇马2019、黑格比2008/2020、威马逊2014、彩虹2015、山竹2018、海葵2023、烟花2021、尼伯特2016、天鸽2017、莎莉嘉2016、海马2016、天秤2012、布拉万2012、艾云尼2018、韦帕2019、森拉克2020、狮子山2021、圆规2021、暹芭2022、梅花2022、苏拉2023。
- 输出 `scripts/landfall-sample-check.md`：表格列出每个台风的 `app 登陆点/时间/地点` vs `权威记录` vs `是否一致`。
- 重点核对其中有渤海/北部湾/雷州路径的个例。

### 步骤 3：仅修复确认的 bug（同步 build + 前端两处）
- **若扫描确认渤海假陆地误判**：修正 `CHINA_COASTLINE` 渤海段——沿真实海岸线（蓬莱→砣矶岛→辽东南岸旅顺/大连）闭合，不再横切湾顶。同步改 [build-typhoon-index.js:91-113](file:///d:/kzht/Documents/typhoon-fujian-tracker/scripts/build-typhoon-index.js#L91-L113) 与 [index.html:3505-3527](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3505-L3527)。
- **若扫描确认雷州/北部湾误判**：补全雷州半岛西海岸顶点。同步两处。
- **其他扫描发现的多边形错误边**：仅修正导致误判的边，不做全量加密。
- **不做**：插值真实穿越点、`detectLandfall` 算法重写、多边形全量加密、多登陆汇报（均属精度提升，本次不做）。
- `nearestCoastalName` 城市表如发现明显缺口（某段海岸无代表城市导致地点名系统性偏）且影响核对结论，可补 1-2 个城市（属 bug 修正非加密）。

### 步骤 4：重建索引 + 复验
- 改完多边形后 `cd scripts && node build-typhoon-index.js` 重建 `typhoon-index.json`（刷新 `landFujian` 计数，原 161）。
- 重跑 `audit-landfall.js`，确认步骤 1 标记的异常已消除或可解释。
- 复核 BAVI 仍为「浙江温州 07-12 01:00」；样本 30 台风结果稳定。

## 假设与决策
- 范围：全量扫描（2537）+ 样本核对（~30）。用户确认。
- 精度：仅修复 bug，不提升精度（不插值、不加密）。用户确认。
- 审计脚本**复制**前端逻辑，保持前端单文件零依赖；不抽共享模块。
- 权威基准：NMC 官网存档 + CMA best track + 官方登陆通报（样本核对用）。
- 多边形修正同步 `build-typhoon-index.js` 与 `index.html` 两份副本。
- 审计脚本与报告产物加入 `scripts/.gitignore` 已忽略的缓存模式；报告 `.md`/`.json` 视体积决定是否纳入版本控制（默认保留 `.md` 供审查）。

## 验证步骤
1. `node scripts/audit-landfall.js` 成功跑完全量，生成 `landfall-audit-report.json`/`.md`，异常清单可读。
2. `landfall-sample-check.md` 中 30 台风核对表完成，不一致项有结论。
3. 渤海/雷州等确认 bug 修正后，重跑审计异常数下降；`landFujian` 计数变化合理（与原 161 相比差异可解释）。
4. Puppeteer 验证：BAVI 登陆仍为「浙江温州 07-12 01:00」；抽 2-3 个样本台风生命周期时间轴登陆事件显示正确；PC/手机端布局无回归（`index.html` 仅改 `CHINA_COASTLINE` 数组，不影响 UI）。
5. `git diff` 仅涉及 `index.html`（CHINA_COASTLINE）、`scripts/build-typhoon-index.js`（CHINA_COASTLINE）、`typhoon-index.json`（重建）、新增 `scripts/audit-landfall.js` 与报告文件。

## 不在范围内
- 巴威时间 bug（已修复，本任务仅做背景说明）。
- 登陆坐标精度提升（插值/加密/多登陆）——用户明确不做。
- 前端 UI/交互改动（手机端优化已完成，本任务仅可能动 `CHINA_COASTLINE` 数组）。
