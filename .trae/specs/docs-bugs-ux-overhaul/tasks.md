# Tasks

> 顺序执行；标 [P] 的子任务可并行。所有改动以 `index.html` 为主，行号基于当前 4208 行版本（改动后行号会漂移，以函数/选择器名为准）。

## A. 说明文档校准（README.md）
- [x] Task A1: 重写「数据来源」段：补 NMC JSONP 包裹格式说明、Open-Meteo 完整字段清单、NASA GIBS、高德卫星影像/标注叠加、typhoon-index.json（字段+加载+降级）、外链
- [x] Task A2: 重写「技术栈」段：Leaflet 1.9.4（CDN URL）、单文件架构、typhoon-index.json 依赖、scripts/build-typhoon-index.js 构建步骤与断点续跑
- [x] Task A3: 修正底图描述为二维切换（高德/Open × 亮/暗 4 组合）+ 3 叠加层 + 瓦片 URL；补充坐标系双源转换规则与距离计算未转换的局限说明
- [x] Task A4: 补全功能特性：拼音首字母搜索、测距、全屏、移动端面板收起、PC Ctrl+滚轮缩放、visibilitychange 自动刷新、登陆中国大陆检测（海岸线交叉算法）
  - [x] 子任务: 修正原文「右上角一键切换 CartoDB 暗色」表述

## B. Bug 修复（index.html，部分 scripts/）
- [x] Task B1: 修复时间 8h 偏移 — `parseTyphoonTime`(L3216/L3221) 改按北京时(UTC+8)解析（时区安全）；统一全站显示路径，消除 raw 14:00 vs parsed 22:00 矛盾
  - [x] [P] 子任务: 排查所有 `parseTyphoonTime` 调用点（L2747/2772/2773/2804/2805/2853/2860/2995/2996/3097/3098/3285/3292/3313）确认一致
- [x] Task B2: 缺失数据兜底 — `renderImpact` daily 守卫补 `.time` 长度检查(L3509)；`parsePoint`/统计栏(L3190-3193)对 moveDir/moveSpeed/pressure/speed 缺失显示「—」
  - [x] [P] 子任务: 排查 `formatNum`(L2176) 对 undefined 返回 "NaN" 的兜底
- [x] Task B3: 风圈状态恢复 — 历史切回活动台风时恢复 `windOn=true` 并重置按钮 on 态(L3167-3179)
- [x] Task B4: 影响概要动态化 — `renderImpact` 概要(L3561)按实际距离/登陆情况生成，移除硬编码占位文案
- [x] Task B5: 并发去重 — `load()` 引入单调递增 loadSeq，渲染前校验是否最新，丢弃过期响应
- [x] Task B6: 坐标系一致性 — 浏览器实测判定 NMC 坐标系（取一已知台风点对照高德底图地理位置），统一 `index.html`(safePathLL L2414 / detectLandfall L2916) 与 `scripts/build-typhoon-index.js`(L107-111) 假设，文档记录结论
- [x] Task B7: 风圈开关误禁用 — L3597-3611 原按 `active`（活动台风）判定，导致近期已消散但带风圈数据的台风（如海神 2026）风圈按钮被禁用、提示"历史档案无风圈数据"。改为按 `points.some(p=>p.windCircles)` 数据存在性判定：有数据则启用并默认显示，无数据（如桑美 2006）才禁用。E4 回归发现

## C. PC / 手机端布局修复（index.html CSS + 少量 JS）
- [x] Task C1: 统一断点 — CSS `max-width:720px`(L1470)/`min-width:769px`(L857) 与 JS `max-width:768px`(L2498/4093/4113/4122/4146/4186) 对齐为同一值
- [x] Task C2: 手机端控件布局 — `.map-side`(L1656)/`.map-zoom`(L727) 改 `position: fixed`，避免与 `.map-disclaimer`(L1682) 重叠或溢出视口
- [x] Task C3: 弹窗层级 — `.leaflet-popup-pane` z-index 提升至 .ui(z-index:3) 之上（如 1500）
- [x] Task C4: 移除 viewport `maximum-scale=1`(L5)
- [x] Task C5: 触摸目标 ≥44px — `.scope-tab`(L689 32px)、`.ty-search-clear`(L666 22px)、`.ctrl-btn`/`.base-tab`(L791/879) 手机端
- [x] Task C6: 安全区 — `#panelToggle`(L818)/`.map-side`(L1659) 使用 env(safe-area-inset-*)
- [x] Task C7: 短屏 PC — 新增 `@media (max-height:800px)` 收敛 hero/footer，保证 `.map-gap` 可见
- [x] Task C8: 免责声明 — 仅 stage 可见时常驻(L1307/L1311 z-index:500)，滚动到 .impact 时不遮挡（IntersectionObserver 或改文档流）

## D. 布局优化与代码清理（index.html + 产物）
- [x] Task D1: CSS 去重 — `.ctrl-btn`(L791)/`.base-tab`(L879) 抽公共类 `.map-pill`
- [x] Task D2: 删死代码 — `.leaflet-control-zoom` 两段 CSS(L1159/L1647，zoomControl:false L2004)
- [x] Task D3: 可访问性 — 补 `:focus-visible`(button/.link-btn/.city-tab/.ctrl-btn/.base-tab)；提升 `--ink-mute`(L17 0.38)/`--ink-dim`(L16 0.62) 对比度至 WCAG AA
- [x] Task D4: 收起态保留工具 — `body.ui-collapsed .map-side`(L865) 不再 display:none
- [x] Task D5: 低优先打磨 — `.hero-line` 行截断放宽(L1543)、`#map` touch-action 调整(L51)、超宽屏 `.impact` 加宽断点(L162)、`prefers-reduced-motion` 关闭 smooth-scroll(L43/L1709)、合并分散 `map.on("click")`(L4120/L4158)
- [x] Task D6: 删无用产物 — `verify-out.json`(0B)、`verify-result.json`(过期 #baseDark)；清理 `.gitignore` 误粘行(`document.querySelector(s)`/`{var`/`eval.txt`)

## E. 浏览器实测验证（PC + 手机端，puppeteer MCP）
- [x] Task E1: 启动本地静态服务（node serve.js），puppeteer 打开 http://localhost:8080/
- [x] Task E2: PC 视口（如 1440×900）验证 — 时间显示一致、点弹窗可读不被遮挡、短屏(≤800高)地图可见、Tab 焦点样式
- [x] Task E3: 手机视口（375×812 与 768×1024 边界）验证 — 控件不重叠/不溢出、双指/缩放可用、触摸目标达标、断点切换正常
- [x] Task E4: 回归确认 — 切历史台风再切回活动台风风圈恢复；统计栏无 NaN/undefined；快速切台风无竞态错乱
- [x] Task E5: 截图归档（PC + 手机各关键状态），确认无误后结束

# Task Dependencies
- B6（坐标系实测）依赖 E1（本地服务+浏览器）可用，可与 B1-B5 并行准备
- C 系列与 D 系列彼此独立，可并行
- E 系列（验证）依赖 A/B/C/D 全部完成
- A3 的坐标系说明依赖 B6 结论
