# ▽ 按钮始终可见 + 脉冲提示 Spec

## Why
用户多次反馈手机端找不到左上角 ▽ 按钮。根因有二：(1) ▽ 的显隐绑定在 `hasTyphoon` 上——`updateMobileChip()` 中 `mt.hidden = chip.hidden = !hasTyphoon`，未加载台风或台风数据无 path 时 ▽ 被隐藏，用户根本看不到它；(2) 横屏时手机视口 > 768px（如 iPhone 12 横屏 844px），`@media (min-width: 769px)` 将移动端元素全部 `display:none`，▽ 消失。

## What Changes
- **▽ 始终可见**：`updateMobileChip()` 中将 `mt.hidden` 解绑 `hasTyphoon`，移动端始终 `mt.hidden = false`。仅 `mobileChip`（底部数据条）保留 `hasTyphoon` 依赖。PC 端由 `@media (min-width: 769px)` CSS 隐藏，不受影响。
- **无台风时面板提示**：`refreshSheetBody()` 在 `hasTyphoon=false` 时显示"请先在顶部选择台风"提示，不克隆空数据块。
- **脉冲动画**：台风首次加载后 `body.ty-active` 触发 ▽ 脉冲 3 次（1.5s 间隔），吸引用户注意。
- **横屏适配**：将 `@media (min-width: 769px)` 的移动元素隐藏规则改为 `@media (min-width: 769px) and (pointer: fine)`，使触屏设备横屏（视口 > 768px 但 pointer=coarse）仍显示移动 UI。

## Impact
- Affected code: `index.html` — `updateMobileChip()` (L3579-3603)、`refreshSheetBody()` (L4990+)、CSS `@media (min-width: 769px)` (L930)、CSS `#msToggle` (L2151)
- PC 零回归：桌面端 `pointer: fine`，仍匹配 `@media (min-width: 769px) and (pointer: fine)`，移动元素隐藏

## MODIFIED Requirements

### Requirement: ▽/△ 双态箭头始终可见
`#msToggle` SHALL 在移动端始终可见（`hidden=false`），不依赖台风加载状态。无台风时点击 ▽ 展开面板显示"请先在顶部选择台风"提示。PC 端通过 CSS `display:none` 隐藏。

#### Scenario: 页面初次加载（无台风）
- **WHEN** 手机端页面初次加载，无台风数据
- **THEN** 左上角 ▽ 可见，底部 mobileChip 隐藏（无数据可展示）

#### Scenario: 点击 ▽ 但无台风
- **WHEN** 无台风时用户点击 ▽
- **THEN** 面板展开，显示"请先在顶部选择台风"提示，不显示空数据块

#### Scenario: 台风加载后脉冲提示
- **WHEN** 台风数据加载完成，`body.ty-active` 被添加
- **THEN** ▽ 脉冲闪烁 3 次（box-shadow 高亮），引导用户注意

#### Scenario: 横屏使用
- **WHEN** 手机横屏（视口 > 768px，pointer=coarse）
- **THEN** 移动 UI 仍可见（▽ + mobileChip + mobileSheet），不切换到 PC 布局
