# 修复手机端 4 个交互 Bug Spec

## Why
Map-First 改造后，用户在手机端反馈 4 个问题：左上角 ▽ 找不到、全屏按钮无效、选台风后不会自动进入地图视图、搜索框叉叉始终可见但无功能。这些是 CSS `display` 覆盖 `[hidden]` 属性、iPhone 不支持 `requestFullscreen()`、缺少自动滚动、以及缺少 `[hidden]` 守卫规则导致的。

## What Changes
- **Bug 1 — ▽ 不可见**：`updateMobileChip()` 代码已正确（台风加载后 `mt.hidden = false`），但用户可能看到缓存旧版。增加防御性措施：确保 `#msToggle` 的 `[hidden]` 规则在移动端 `display:flex` 之前生效，且 `updateMobileChip` 在 `renderData` 后始终被调用。
- **Bug 2 — 全屏按钮无效**：`#fsBtn`（全屏）位于 `.map-side` 底部右侧浮动控件组，在移动端始终可见。但 iPhone Safari 不支持 `document.documentElement.requestFullscreen()`，点击静默失败。**移除 `#fsBtn` 在移动端的显示**（与已移除的 `#mcFs` 同理）。
- **Bug 3 — 选台风后不自动进入地图**：Map-First 隐藏了 hero 详情块，但 header + city-tabs + ty-row + ty-search 仍占顶部约 210px。用户选完台风后仍看到选择条而非地图。**在 `renderTyphoon()` 完成后自动滚动到 `.map-gap`**，让地图成为首屏主视图。
- **Bug 4 — 搜索叉叉始终可见**：`.ty-search-clear { display: flex }` 覆盖了 `[hidden]` 属性，导致"×"按钮在搜索框为空时也显示。点击它清空空输入，无可见效果。**新增 `.ty-search-clear[hidden] { display: none !important }`**。

## Impact
- Affected code: `index.html`（CSS 在 `@media max-width:768px` 内，JS 在 `renderTyphoon()` L4560-4572）
- PC 端零回归：所有 CSS 改动在移动端媒体查询内，`#fsBtn` 在 PC 端正常显示

## ADDED Requirements

### Requirement: 选台风后自动滚动到地图
手机端用户选择台风后，页面 SHALL 自动平滑滚动到 `.map-gap` 区域，使地图成为首屏主视图。滚动仅在 `renderTyphoon()`（用户主动选择台风）时触发，不在 `onCityChange()`（切城市）或 `load()`（刷新）时触发。

#### Scenario: 用户从下拉框选台风
- **WHEN** 手机端用户从年份下拉框选择一个台风
- **THEN** 台风数据加载完成后，页面平滑滚动到 `.map-gap`，地图占满视口，header/city-tabs/hero 滚出顶部

#### Scenario: 切城市不触发滚动
- **WHEN** 用户切换城市 tab
- **THEN** 数据更新但不触发自动滚动，保持当前视图位置

### Requirement: 搜索清空按钮仅在有输入时显示
`.ty-search-clear`（×）按钮 SHALL 仅在搜索框有文本时显示。搜索框为空时 SHALL 隐藏。

#### Scenario: 搜索框为空
- **WHEN** 搜索框无文本
- **THEN** × 按钮隐藏（`display: none`），不可见不可点

#### Scenario: 搜索框有文本
- **WHEN** 用户在搜索框输入文本
- **THEN** × 按钮显示，点击后清空搜索框并隐藏自身

## MODIFIED Requirements

### Requirement: 移动端全屏按钮
移动端 SHALL 隐藏 `#fsBtn`（全屏）按钮。iPhone Safari 不支持 `requestFullscreen()`，Android Chrome 地址栏自动隐藏，全屏按钮在手机端无实际价值。PC 端 `#fsBtn` 保持不变。

### Requirement: ▽/△ 双态箭头可见性
`#msToggle` SHALL 在台风加载后常驻左上角（▽ 收起态 / △ 展开态）。`#msToggle[hidden]` 的 `display: none !important` 规则 SHALL 在 `display: flex` 之前生效，确保无台风时真正隐藏。
