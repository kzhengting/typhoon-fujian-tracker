# Tasks

- [x] Task 1: 新增 `forecastPopup(p)` 函数
  - 在 `pointPopup(p)` 函数（L3238）附近新增 `forecastPopup(p)`
  - 内容：「预报」橙色徽标 + `+${p.lead}h` 超前小时 + 强度名称 + `p.power`级 + 北京时间 `fmtTime24h(p.time)` + 中心 `${p.lat}°N ${p.lng}°E` + 气压 `${p.pressure} hPa` + 最大风力 `${p.speed} m/s`
  - 若 `estimateWindCircles(p)` 返回非 null，追加风圈行（7级/10级估算，与 `pointPopup` 风圈行格式一致）
  - CSS 类复用 `.pt-pop` / `.pt-pop-row` 等，徽标用内联样式

- [x] Task 2: 预测点改为可交互 + 绑定 popup + 点击展示估算风圈
  - 编辑 `renderMap()` 中 `forecastPts.slice(1).forEach` 块
  - `interactive: false` → `interactive: true`
  - `radius: 3.5` → `radius: 5`
  - 新增 `.bindPopup(forecastPopup(p), { className: "pt-popup", maxWidth: 280 })`
  - 新增 `.on("click", () => { const est = estimateWindCircles(p); if (est) showWindCircle({ ...p, estimatedWindCircles: est, windCircles: null }, ll); })`

- [x] Task 3: Puppeteer 验证
  - 加载活跃台风"白海豚"（id=3279904），确认 7 个预测点渲染为 `interactive: true`
  - 点击第一个预测点，popup 出现且含"预报"文本 + "+24h" + "915 hPa" + "62 m/s" + "7级风圈（估算）"
  - 确认 29 个观测点不受影响（零回归）

# Task Dependencies
- Task 2 依赖 Task 1（需要 `forecastPopup` 函数存在）
- Task 3 依赖 Task 1, 2 完成

# 验证结果（puppeteer-core + Edge headless, 2026-07-31）

## 白海豚（2026年第13号，活跃）
```
fcCircleCount: 7（预测点 interactive:true）
obsPointCount: 29（观测点零回归）
Popup after click:
  hasForecast: true     ← "预报"徽标
  hasLead: true         ← "+24h"
  hasPressure: true     ← "915 hPa"
  hasSpeed: true        ← "62 m/s"
  hasWindCircle: true   ← "7级风圈（估算）566/368/566/368 km"
Wind layer: 42 paths    ← 风圈多边形已绘制
```
