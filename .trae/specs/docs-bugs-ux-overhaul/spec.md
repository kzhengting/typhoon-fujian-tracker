# 文档校准 · Bug 修复 · PC/手机端布局优化 Spec

> change-id: `docs-bugs-ux-overhaul`
> 目标文件：`index.html`（实际 4208 行）、`README.md`、`scripts/build-typhoon-index.js`，及清理无用产物。
> 覆盖范围：用户确认「全部覆盖修复，并删旧的、没有用的代码行」，且「PC 端和手机端都要监测验证、并修复」。

## Why

本项目是一个面向福建的单文件台风追踪页面（`index.html`，4208 行，内嵌 CSS + 原生 JS + Leaflet）。经三轮审计发现：说明文档与实际代码脱节（漏写 `typhoon-index.json`、拼音搜索、4 种底图组合、构建脚本等，且个别描述不准）；存在一个影响全站的 **8 小时时间偏移 bug**（`parseTyphoonTime` 把北京时当 UTC 解析）；手机端断点 CSS/JS 不一致、地图控件互相重叠与溢出视口、弹窗被信息卡遮挡、禁止用户缩放等问题；以及一批缺失数据兜底、CSS 死代码与可访问性缺陷。需一次性校准文档、修复 bug、优化 PC/手机端布局，并清理无用代码与产物。

## What Changes

### A. 说明文档（技术路线 + 数据源）— `README.md`
- 补写 `typhoon-index.json`（2535 条跨年索引）的存在、字段、加载方式（`fetch(..., {cache:"force-cache"})`）与降级策略。
- 补写 `scripts/build-typhoon-index.js` 构建脚本（NMC 抓取 → haversine 最近距离 → 拼音首字母 → 索引输出，含断点续跑）。
- 补写实际功能：拼音首字母搜索、高德卫星影像叠加层、测距工具、全屏切换、移动端面板收起、PC 端 Ctrl+滚轮缩放、标签页可见时自动刷新（`visibilitychange`）、登陆中国大陆检测（海岸线多边形交叉算法）。
- 修正底图描述：「右上角一键切换 CartoDB 暗色」→ 实际为二维切换（底图 高德/Open × 变体 亮/暗，共 4 种组合），并列出 3 个叠加层（NASA GIBS、高德卫星影像、高德卫星标注）。
- 补充 NMC 接口响应为 **JSONP 包裹格式**（需 `stripJsonp` 提取 `{...}`），Open-Meteo 请求的完整字段清单。
- 修正坐标系说明：说明 NMC 路径坐标被当作 GCJ-02、城市坐标为 WGS-84、按底图双向转换（`safeCityLL`/`safePathLL`）；**明确距离计算（haversine）未做坐标转换**，影响可忽略（百米级），并在文档中标注此局限。
- 更新技术栈行数与依赖清单（仅 Leaflet 1.9.4 一个外部库；CDN URL）。

### B. Bug 修复 — `index.html`（部分 `scripts/build-typhoon-index.js`）
- **时间 8h 偏移（H1）**：`parseTyphoonTime`（line 3216/3221）改按北京时（UTC+8）解析，统一全站时间显示路径，消除「原始串 14:00 vs 解析串 22:00」的自相矛盾。
- **缺失数据兜底（M3/M5）**：`renderImpact` daily 守卫补 `.time` 长度检查（line 3509）；`parsePoint`/统计栏对 `moveDir/moveSpeed/pressure/speed` 缺失显示「—」而非 `undefined/NaN`（line 3190-3193）。
- **风圈状态恢复（M1）**：从历史台风切回活动台风时恢复 `windOn=true` 并重置按钮态（line 3167-3179）。
- **影响概要动态化（M2）**：`renderImpact` 概要（line 3561）按实际距离/登陆情况生成，移除硬编码占位文案。
- **并发去重（M4）**：`load()` 引入单调递增序号，丢弃过期响应，消除「下拉选 A 显示 B」竞态。
- **坐标系一致性（M6）**：浏览器实测判定 NMC 坐标系（GCJ-02 vs WGS-84），统一前端与构建脚本假设，并在文档记录结论。

### C. PC / 手机端布局修复 — `index.html`（CSS + 少量 JS）
- **统一断点（#1）**：CSS `max-width:720px` / `min-width:769px` 与 JS `max-width:768px` 对齐为同一值。
- **手机端控件（#2/#3/#4）**：`.map-side`/`.map-zoom` 改 `position: fixed` 并避免与 `.map-disclaimer` 互相重叠或溢出视口。
- **弹窗层级（#5）**：`.leaflet-popup-pane` z-index 提升至 `.ui`（z-index:3）之上，避免被 `.hero` 遮挡。
- **允许缩放（#6）**：移除 viewport `maximum-scale=1`（line 5）。
- **触摸目标（#7）**：手机端可点击元素 `min-height` ≥ 44px（`.scope-tab` 32px、`.ty-search-clear` 22px 等）。
- **安全区（#9/#10）**：`#panelToggle`、`.map-side` 使用 `env(safe-area-inset-*)`。
- **短屏 PC（#14）**：新增 `@media (max-height: …)` 断点，保证地图区域可见。
- **免责声明（#11）**：滚动到 `.impact` 时不遮挡内容（仅 stage 可见时常驻，或改回文档流）。

### D. 布局优化与代码清理 — `index.html` + 产物
- **CSS 去重（#18）**：`.ctrl-btn`（line 791）与 `.base-tab`（line 879）抽公共类。
- **删死代码（#22）**：删除 `.leaflet-control-zoom` 两段 CSS（line 1159、1647，因 `zoomControl:false` 永不生效）。
- **可访问性（#19/#20）**：补 `:focus-visible` 焦点样式；提升 `--ink-mute`(0.38)/`--ink-dim`(0.62) 对比度至 WCAG AA。
- **收起态保留工具（#24）**：`body.ui-collapsed .map-side` 不再 `display:none`，全屏下仍可切底图/测距。
- **低优先打磨（#12/#13/#16/#23/#25）**：`.hero-line` 行截断放宽、`#map` touch-action 调整、超宽屏 `.impact` 加宽断点、`prefers-reduced-motion` 关闭 smooth-scroll、合并分散的 `map.on("click")` 监听。
- **删无用产物**：删除 `verify-out.json`（0 字节）、`verify-result.json`（引用已废弃 `#baseDark` 的过期 Playwright 输出）；清理 `.gitignore` 中误粘的非模式行（`document.querySelector(s)` / `{var` / `eval.txt`）。

### E. 浏览器实测验证（PC + 手机端）
- 用 puppeteer MCP 分别以 PC 视口与手机视口打开本地页面，截图验证：时间显示一致、控件不重叠、弹窗可见、缩放可用、断点切换正常。

## Impact
- 受影响代码：`index.html`（文档/Bug/布局/优化均在此）、`README.md`（整段重写数据源与技术栈）、`scripts/build-typhoon-index.js`（坐标系对齐）、`.gitignore`（清理）、删除 `verify-out.json`/`verify-result.json`。
- 用户可见变化：所有时间显示回退 8h 至正确北京时；手机端控件不再重叠/溢出；可双指缩放页面；切换台风风圈正常；历史/活动台风统计栏不再出现 `NaN/undefined`。
- 无外部接口契约变更（非 BREAKING）；坐标系统一可能微调路径偏移（百米级），属修正而非破坏。

## ADDED Requirements

### Requirement: 准确完整的说明文档
系统 SHALL 在 `README.md` 中准确、完整地描述技术路线与数据源，且与代码实际行为一致。

#### Scenario: 技术栈与依赖
- **WHEN** 读者查看 README「技术栈」
- **THEN** 列出唯一外部库 Leaflet 1.9.4（含 CDN URL）、单文件架构、`typhoon-index.json` 依赖与 `scripts/build-typhoon-index.js` 构建步骤

#### Scenario: 数据源完整
- **WHEN** 读者查看「数据来源」
- **THEN** 覆盖 NMC（list_default/list_{年}/view_{id}，JSONP 包裹格式）、Open-Meteo（字段清单 + timezone=Asia/Shanghai）、NASA GIBS、高德卫星叠加、typhoon-index.json、外链（Zoom.earth/Windy）

#### Scenario: 底图与坐标系
- **WHEN** 读者查看底图说明
- **THEN** 描述 4 种底图组合 + 3 叠加层 + 瓦片 URL，并说明 WGS-84/GCJ-02 双源按底图转换规则、距离计算未转换的局限

#### Scenario: 功能补全与纠错
- **WHEN** 读者查看功能特性
- **THEN** 含拼音搜索、测距、全屏、移动端收起、Ctrl+滚轮、visibility 刷新、登陆大陆检测；「一键切换」描述已改为二维切换

### Requirement: 时间显示准确且一致
系统 SHALL 将 NMC 时间解析为北京时（UTC+8），且全站所有显示路径使用同一解析结果。

#### Scenario: 同一时刻各处一致
- **WHEN** 台风某观测点为北京时 14:00
- **THEN** metaRow、heroLine、点弹窗、逐小时表、生命周期时间线、历史影响卡均显示 14:00，不出现 22:00

#### Scenario: 跨时区稳健
- **WHEN** 浏览器处于非北京时区
- **THEN** NMC 时间仍按北京时正确显示（不依赖浏览器本地时区）

### Requirement: 缺失数据安全兜底
系统 SHALL 在数据缺失或为空时优雅降级，不崩溃、不显示 `NaN`/`undefined`。

#### Scenario: daily.time 为空数组
- **WHEN** Open-Meteo 返回 `daily` 存在但 `daily.time=[]`
- **THEN** `renderImpact` 不抛 TypeError，显示降级提示而非半渲染崩溃

#### Scenario: 历史路径字段缺失
- **WHEN** 历史最佳路径缺移向/移速/气压/风速
- **THEN** 统计栏与卡片相应位置显示「—」，不显示 `undefined / NaN km/h` 或 `NaNhPa`

#### Scenario: API 失败
- **WHEN** NMC 或 Open-Meteo 请求失败
- **THEN** 显示明确降级 UI，不阻塞其它已成功部分

### Requirement: 风圈状态正确恢复
系统 SHALL 在从历史台风切回活动台风时恢复风圈图层与按钮态。

#### Scenario: 历史切回活动
- **WHEN** 用户先选择历史台风（风圈被禁用关闭）再切回当前活动台风
- **THEN** 风圈图层自动恢复显示、按钮恢复 `on` 态，无需手动点按

### Requirement: 影响概要动态生成
`renderImpact` 概要 SHALL 基于实际距离与登陆情况生成，不含硬编码占位文案。

#### Scenario: 远海台风
- **WHEN** 台风距所选城市 >1000km
- **THEN** 概要不出现「中心已到沿海附近」「大概率不会被台风中心直接登陆」等与事实矛盾的固定文案

### Requirement: 数据加载并发安全
`load()` SHALL 用单调递增序号守卫，丢弃过期响应，避免竞态覆盖。

#### Scenario: 快速切换台风
- **WHEN** 用户在旧 `load()` 进行中切换台风/城市
- **THEN** 仅最新请求的响应渲染到 UI，旧响应被丢弃，下拉选择与地图显示一致

### Requirement: 坐标系一致性
系统 SHALL 实测确认 NMC 坐标系，并使前端与 `build-typhoon-index.js` 假设一致；结论写入文档。

#### Scenario: 前端与构建脚本一致
- **WHEN** 判定 NMC 为 GCJ-02 或 WGS-84
- **THEN** `index.html` 与 `scripts/build-typhoon-index.js` 采用同一假设，README 记录该结论

### Requirement: 统一响应式断点
CSS 与 JS SHALL 使用同一移动端断点，消除 721–768px 灰色地带。

#### Scenario: 平板/大屏手机宽度
- **WHEN** 视口宽度在 721–768px 之间
- **THEN** 布局与 JS 交互判定一致，地图可正常拖拽/缩放，不出现「桌面布局但地图禁用」

### Requirement: 手机端控件布局正确
手机端地图控件 SHALL 互不重叠、不被免责声明遮挡、且始终在视口内可见。

#### Scenario: 控件可见且不重叠
- **WHEN** 手机端展开态查看地图
- **THEN** `.map-side` 与 `.map-zoom` 不互相重叠、不与 `.map-disclaimer` 重叠，且不需向下滚动即可触达

### Requirement: Leaflet 弹窗不被遮挡
观测点/台风点弹窗 SHALL 渲染在 `.ui`/`.hero` 信息层之上。

#### Scenario: 弹窗位于信息卡区域
- **WHEN** 弹窗位置与 `.hero` 卡片重叠
- **THEN** 弹窗完整可读，不被半透明背景或模糊遮挡

### Requirement: 允许用户缩放
viewport SHALL NOT 禁止用户缩放页面。

#### Scenario: 双指缩放
- **WHEN** 用户在手机端双指缩放
- **THEN** 页面可被放大，不受 `maximum-scale=1` 限制

### Requirement: 触摸目标可达
手机端可交互元素 SHALL 满足 ≥44px 触摸目标。

#### Scenario: 小按钮
- **WHEN** 用户在手机端点击 `.scope-tab`/`.ty-search-clear` 等
- **THEN** 触摸目标高度 ≥44px，可准确点中

### Requirement: 安全区适配
固定定位控件 SHALL 尊重刘海屏/手势条安全区。

#### Scenario: 刘海屏手机
- **WHEN** 在 iPhone X+ 等设备上
- **THEN** `#panelToggle`、`.map-side` 不被刘海/状态栏/home indicator 遮挡

### Requirement: 短屏 PC 地图可见
在短屏幕桌面端，地图区域 SHALL 保持可见。

#### Scenario: 笔记本短屏
- **WHEN** 桌面视口高度 ≤800px
- **THEN** hero/footer 收敛，`.map-gap` 不被压缩至 0，地图可见

### Requirement: 免责声明不遮挡滚动内容
免责声明 SHALL 不在用户浏览 `.impact` 详细内容时遮挡表格/时间线。

#### Scenario: 滚动到详情区
- **WHEN** 用户向下滚动到逐小时表/生命周期
- **THEN** 免责声明不悬浮遮挡内容底部的滚动条或时间线

### Requirement: 布局优化与代码清理
系统 SHALL 去除重复/死代码、提升可访问性，并删除无用产物。

#### Scenario: CSS 去重与死代码
- **WHEN** 审查 CSS
- **THEN** `.ctrl-btn`/`.base-tab` 复用公共类；`.leaflet-control-zoom` 死代码已删；`!important` 滥用减少

#### Scenario: 可访问性
- **WHEN** 键盘 Tab 或低视力用户使用
- **THEN** 按钮有 `:focus-visible` 焦点样式；`--ink-mute`/`--ink-dim` 文字对比度达 WCAG AA

#### Scenario: 收起态保留工具
- **WHEN** 手机端收起面板查看风圈
- **THEN** `.map-side` 仍可见可用（可切底图/测距）

#### Scenario: 无用产物清理
- **WHEN** 检查仓库根
- **THEN** `verify-out.json`、`verify-result.json` 已删；`.gitignore` 无误粘的非模式行

### Requirement: PC 与手机端浏览器实测验证
修复后 SHALL 用 puppeteer 在 PC 与手机视口下实测验证关键修复点。

#### Scenario: PC 视口验证
- **WHEN** 以桌面视口打开页面
- **THEN** 时间显示正确、弹窗可读、短屏地图可见、焦点样式存在

#### Scenario: 手机视口验证
- **WHEN** 以手机视口（含 721–768px 与 ≤720px）打开页面
- **THEN** 控件不重叠/不溢出、可双指缩放、触摸目标达标、断点切换正常
