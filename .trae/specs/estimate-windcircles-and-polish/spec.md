# 历史台风风圈估算 + 列表清理 + 手机端下拉菜单 Spec

## Why

NMC `view_<id>` 接口对 2026 年之前的台风一律不返回风圈数据（`p[10]` 为空数组），导致点击历史台风路径点无法绘制风圈，只有当年（2026）台风（如巴威）有真实风圈。同时台风列表中残留 8 条重复无名台风与若干空白项，手机端「收起/展开」按钮交互不够直观。本 spec 用参数化模型为历史台风**估算**风圈并明确标注，清理列表空白/重复，并将手机端收起按钮改为下拉菜单交互。

## What Changes

### A. 历史台风风圈估算（核心）
- 新增 `estimateWindCircles(point)`：当 `point.windCircles`（观测值）为 `null` 且 `point.speed`（Vmax）≥ 18 m/s 时，按气候学参数化公式估算 7 级 / 10 级风圈四象限半径：
  - `r7_max ≈ 8 × Vmax + 70`（km），`r10_max ≈ 4 × Vmax + 10`（km），按巴威 2026 真实观测标定
  - 四象限：东北/西南取 max，东南/西北取 0.65×max（体现典型非对称性）
  - Vmax < 18（TD/弱 TS）不估算（强度不足，误差过大）
- 渲染层 `drawWindCircles` / `showWindCircle` / `pointPopup` 改为使用 `windCircles || estimatedWindCircles`，并携带 `isEstimated` 标志：
  - **估算风圈**：虚线边框（`dashArray`）+ 弹窗标注「估算」字样
  - **观测风圈**：维持现状（实线，无标注）—— 2026 台风零回归
- 风圈开关按钮对历史台风不再禁用（有估算数据可显示）

### B. 台风列表空白/重复清理
- **删除 8 条重复无名台风**（4 对，同年同号同 fjMin，仅 id 不同）：1975#6、1970#4、1961#16、1986#13 各保留 1 条
- **下拉框空白项兜底**：`buildTyphoonSelect`（L4404-4414）对 `name` 与 `enName` 均空的条目显示「未命名」；对 `no=0` 的无名热带低压显示「热带低压」
- **无路径标记**：`fjMin=null` 的 10 条 2020 具名台风（艾涛/艾莎尼等，NMC 无路径数据）在下拉框追加「（无路径）」标签
- 同步 `build-typhoon-index.js` 的 `isValidNamelessPath` 过滤：将去重判定从「仅 no=0」扩展到「所有无名条目」，用路径指纹去重（同组保留年份匹配且单季跨度者）

### C. 手机端下拉菜单交互（替换收起按钮）
- **移除** `#panelToggle` 独立收起/展开按钮（L2296、L4814-4825）及其在地图点击中的联动（L4867-4878）
- **新增**下拉菜单入口（从浮动数据条 `#mobileChip` 的「⋯」按钮触发），菜单项：
  - 查看时间线 / 生命史 / 逐小时风力（以底部抽屉 sheet 展示对应内容）
  - 风圈开关 / 点位开关 / 框选路径 / 立即刷新 / 全屏
- 默认态保持全屏地图 + 浮动数据条；点击菜单项打开对应内容抽屉，抽屉顶部下拉或「关闭」收起，不再有独立「收起」按钮
- **BREAKING**（仅手机端）：移除 `#panelToggle` 按钮与 `ui-collapsed` 双态切换模型，改为「全屏地图 + 抽屉」模型；PC 端不受影响

## Impact
- Affected specs: `mobile-ux-overhaul`（C 修改其收起/展开模型）、`docs-bugs-ux-overhaul`
- Affected code: `index.html`（`parsePoint`/`drawWindCircles`/`showWindCircle`/`pointPopup`/`buildTyphoonSelect`/`syncMobilePanel`/`#panelToggle`/`#mobileChip`）、`scripts/build-typhoon-index.js`（`isValidNamelessPath` 去重扩展）、`typhoon-index.json`（删除 8 条重复）
- 数据：`typhoon-index.json` 2271 → 2263（删 8 重复）

## ADDED Requirements

### Requirement: 历史台风风圈估算
系统 SHALL 对缺乏观测风圈数据（`p[10]` 为空）的台风路径点，在 `speed`（Vmax）≥ 18 m/s 时按参数化模型估算 7 级 / 10 级风圈四象限半径，并以虚线样式 + 「估算」标注渲染，与真实观测风圈（实线）明确区分。

#### Scenario: 点击历史台风路径点显示估算风圈
- **WHEN** 用户查看 2026 年之前的台风，点击一个 Vmax=35 m/s 的路径点
- **THEN** 绘制虚线 7 级风圈（r7_max≈350km）与 10 级风圈（r10_max≈150km），弹窗显示「7级风圈（估算）」标注

#### Scenario: 弱台风不估算
- **WHEN** 路径点 Vmax < 18 m/s（热带低压）
- **THEN** 不绘制估算风圈（强度不足，误差过大）

#### Scenario: 当年台风零回归
- **WHEN** 查看 2026 年台风（有真实 `p[10]` 数据）
- **THEN** 使用观测风圈，实线样式，无「估算」标注，行为与现状完全一致

### Requirement: 手机端下拉菜单交互
系统 SHALL 在手机端用下拉菜单（从浮动数据条「⋯」触发）取代独立收起/展开按钮，提供信息板块（时间线/生命史/逐小时）与操作（风圈/点位/刷新/全屏）的入口，以底部抽屉展示选定内容。

#### Scenario: 手机端访问时间线
- **WHEN** 手机端用户点击「⋯」→「查看时间线」
- **THEN** 底部抽屉滑出展示时间线，无独立「收起」按钮，抽屉顶部下拉或「关闭」收起

#### Scenario: 全屏地图为默认态
- **THEN** 手机端加载台风后默认全屏地图 + 浮动数据条，无收起按钮可见

## MODIFIED Requirements

### Requirement: 台风列表渲染（buildTyphoonSelect）
`buildTyphoonSelect`（L4404-4414）生成的 `<option>` 文本 SHALL 对无名台风显示「未命名」/「热带低压」兜底（不再出现空白选项），对 `fjMin=null` 的无路径台风追加「（无路径）」标签。

### Requirement: 无名台风去重（isValidNamelessPath）
`build-typhoon-index.js` 的 `isValidNamelessPath` 过滤 SHALL 从「仅 no=0」扩展到「所有无名条目（`!name && !enName`）」，对路径指纹重复的无名条目仅保留年份匹配且单季跨度者，剔除 8 条历史重复无名台风。

## REMOVED Requirements

### Requirement: 手机端 #panelToggle 收起/展开按钮
**Reason**: 用户反馈收起按钮交互不直观，改为下拉菜单 + 底部抽屉模型。
**Migration**: `#panelToggle` DOM 节点与 `syncMobilePanel` 中的 `panelToggle.textContent` 逻辑移除；`ui-collapsed` 双态切换改为「全屏地图 + 抽屉」单态模型；地图点击不再切换面板（避免误触）。PC 端信息层并排布局不变。
