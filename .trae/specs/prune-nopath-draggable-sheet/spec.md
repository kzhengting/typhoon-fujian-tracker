# 删除无路径台风 + 移动端可拖拽底部抽屉 Spec

## Why

上一版 `estimate-windcircles-and-polish` 完成后，索引中仍残留 10 个无路径台风（全是 2020 年具名台风，NMC 数据缺失，`fjMin=null`，点击无法展示任何路径），对用户无价值。同时移动端「⋯」下拉菜单交互虽可用但需多次点按，用户希望改为更直觉的**可拖拽底部抽屉**（类 Google 地图，3 档吸附，手势优先）。

## What Changes

### A. 删除 10 个无路径台风
- `scripts/build-typhoon-index.js` 新增过滤：丢弃 `fjMin==null` 的条目（路径点为空，无法在地图展示）
- 重建 `typhoon-index.json`：2267 → 2257（删 10 个 2020 具名无路径台风：黄蜂/森拉克/海高斯/艾涛/艾莎尼/天鹅/沙德尔/莲花/灿鸿/鲸鱼）
- `buildTyphoonSelect` 的「（无路径）」标签逻辑保留（防御性兜底，未来若 NMC 补数据可自动恢复）
- 同步清理 `.cache-*.json` 中 10 个陈旧 ID

### B. 移动端可拖拽底部抽屉（3 档吸附，替换 ⋯ 下拉菜单）
- **移除** 上一版的 `#mcMenu`「⋯」按钮 + `#mobileMenu` 下拉菜单（`#mobileSheet` 保留并重构为可拖拽抽屉）
- **重构** `#mobileSheet` 为 3 档吸附抽屉：
  - **隐藏**（`translateY(100%)`）：全屏地图 + `#mobileChip` 浮动数据条
  - **半屏**（`translateY(50%)`）：抽屉顶部显示摘要（城市/距离/相位/登陆）+ 工具行（风圈/点位/框选/刷新/全屏）
  - **全屏**（`translateY(8%)`）：完整信息层内容，可纵向滚动
- **手势**：拖动抽屉顶部 handle 在 3 档间吸附；点按 handle 循环切换（隐藏→半屏→全屏→隐藏）
- **默认态**：台风加载后默认**半屏**（摘要立即可见，地图仍可见），而非全屏地图
- **工具行**：从抽屉 header 半屏即可触达（风圈/点位/框选/刷新/全屏），不再需要下拉菜单
- **`#mobileChip`** 简化：保留城市/距离/相位数据 + mcWind 风圈开关；移除 `#mcMenu` 按钮；点按数据条打开抽屉到半屏
- **`ui-collapsed` 模型退役**：不再用 body class 切换信息层显隐，改由抽屉 translateY 状态驱动；`syncMobilePanel` 简化为只同步地图拖拽/缩放/invalidateSize
- **BREAKING**（仅手机端）：移除 `#mcMenu`/`#mobileMenu` + `ui-collapsed` 双态模型，改为抽屉 translateY 三态模型；PC 端不受影响

## Impact
- Affected specs: `estimate-windcircles-and-polish`（B 移除其 `#mcMenu`/`#mobileMenu` 下拉菜单，重构 `#mobileSheet`）、`mobile-ux-overhaul`（B 退役 `ui-collapsed` 模型）
- Affected code: `index.html`（`#mobileChip`/`#mobileSheet`/`#mobileMenu`/`#mcMenu` DOM+CSS+JS、`syncMobilePanel`、抽屉手势）、`scripts/build-typhoon-index.js`（`fjMin==null` 过滤）、`typhoon-index.json`（2267→2257）
- 数据：`typhoon-index.json` 2267 → 2257

## ADDED Requirements

### Requirement: 无路径台风过滤
构建索引时 SHALL 丢弃 `fjMin==null` 的条目（无有效路径点，无法在地图展示）。

#### Scenario: 重建索引时剔除无路径台风
- **WHEN** `build-typhoon-index.js` 运行
- **THEN** 10 个 2020 无路径台风（黄蜂/森拉克等）被剔除，索引 2267 → 2257

### Requirement: 可拖拽底部抽屉（3 档吸附）
手机端 SHALL 用可拖拽底部抽屉作为信息层主交互，3 档吸附（隐藏/半屏/全屏），手势拖动 handle 切换档位，点按 handle 循环切换。

#### Scenario: 拖动抽屉在档位间吸附
- **WHEN** 用户在半屏状态向下拖动 handle 超过阈值后松手
- **THEN** 抽屉吸附到隐藏档（全屏地图 + 浮动数据条）

#### Scenario: 默认半屏摘要
- **WHEN** 手机端加载台风完成
- **THEN** 抽屉默认处于半屏档，顶部摘要（城市/距离/相位）+ 工具行立即可见，地图仍可见

#### Scenario: 工具行半屏可触达
- **WHEN** 抽屉处于半屏档
- **THEN** 风圈/点位/框选/刷新/全屏按钮可见可点，无需展开全屏或打开菜单

## MODIFIED Requirements

### Requirement: 手机端信息层交互
手机端信息层由「⋯下拉菜单 + ui-collapsed 双态」改为「可拖拽底部抽屉 3 档吸附」单模型。`#mobileChip` 点按打开抽屉到半屏；`#mcMenu`/`#mobileMenu` 移除。

## REMOVED Requirements

### Requirement: #mcMenu 下拉菜单
**Reason**: 用户选择可拖拽抽屉替代下拉菜单，工具行直接放入抽屉 header。
**Migration**: `#mcMenu`/`#mobileMenu` DOM/CSS/JS 移除；`openMobileMenu`/`closeMobileMenu` 函数移除；工具按钮迁移到抽屉 header 工具行。

### Requirement: ui-collapsed 双态切换模型
**Reason**: 抽屉 translateY 三态模型替代 body class 双态。
**Migration**: `body.ui-collapsed` 不再用于驱动信息层显隐；`syncMobilePanel` 移除 `ui-collapsed` 相关逻辑，改为同步抽屉状态 + 地图拖拽/缩放；地图点击不再切换面板。
