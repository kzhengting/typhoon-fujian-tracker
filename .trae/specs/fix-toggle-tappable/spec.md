# ▽ 按钮可点击修复（pointer-events 继承漏洞）Spec

## Why
用户反馈"手机没有找到 ▽"。前一轮 `fix-toggle-always-visible` 已让 `#msToggle` 始终 `display:flex` 且 `hidden=false`，按钮在 DOM 与视口里**确实渲染出来**（44×44、左上角、z-index 1301）。

但根因是另一条：`#msToggle` 是 `.ui`（`pointer-events: none`，index.html:113）的直接子元素，`pointer-events` 是**继承属性**。其它兄弟移动元素（`#mobileChip` L2064、`#mobileSheet` L2236、`.map-zoom` L817、`.map-side` L860）都**显式**写了 `pointer-events: auto` 覆盖继承，唯独 `#msToggle` 的 CSS 块（L2154-2177）漏写。

结果：按钮画在屏幕上，但触摸/点击事件被祖先的 `none` 吞掉，穿透到下方的地图或 brand-mark，click 监听（L5097）永远不触发。用户反复点没反应，自然得出"找不到 ▽"的结论——**不是分辨率问题，也不是适配问题**，是单纯的 pointer-events 继承漏洞。

## What Changes
- **`#msToggle` CSS 显式 `pointer-events: auto`**：在 L2154 的 `#msToggle { ... }` 块内补一条 `pointer-events: auto;`，覆盖从 `.ui` 继承的 `none`。与 `#mobileChip`/`#mobileSheet`/`.map-zoom`/`.map-side` 的写法对齐，消除不一致。
- **`#msToggle::before` 伪元素同步**：L2180 的扩大触摸区伪元素也补 `pointer-events: auto`，确保 60×60 触摸热区任意位置都能命中按钮（不只是 44×44 实心区域）。
- **同步检查 `#msToggle[hidden]` 优先级**：现有 `display: none !important`（L2191）已能压制 `display:flex`，hidden 时仍彻底隐藏，新加的 `pointer-events: auto` 不影响这条规则（display:none 的元素本来就不接收事件）。
- **PC 零回归**：PC 端命中 `@media (min-width: 769px) and (pointer: fine)` 的 `display: none !important`（L935），新规则在 PC 上无效果。

## Impact
- Affected code: `index.html` — `#msToggle` CSS 块（L2154-2177）+ `#msToggle::before`（L2180-2187）
- Affected specs: `fix-toggle-always-visible`（前置 spec，解决了可见性但未解决可点性，本次补齐）
- 不动 JS：click 监听（L5097）和 `toggleSheet` 函数（L4979）已存在且正确，只是此前被 pointer-events 拦截无法触发

## MODIFIED Requirements

### Requirement: `#msToggle` 可接收指针事件
`#msToggle` SHALL 显式声明 `pointer-events: auto`，覆盖从 `.ui` 祖先继承的 `pointer-events: none`。其 `::before` 扩大触摸区伪元素 SHALL 同步声明 `pointer-events: auto`，确保 60×60 热区任意位置命中。

#### Scenario: 无台风时点击 ▽
- **WHEN** 移动端页面初次加载，无台风数据，用户点击左上角 ▽
- **THEN** click 监听触发，`toggleSheet(true)` 执行，面板展开并显示"请先在顶部选择台风"提示（`refreshSheetBody` 已有逻辑）

#### Scenario: 台风加载后点击 ▽
- **WHEN** 台风数据已加载（`body.ty-active`），面板处于收起态，用户点击 ▽
- **THEN** click 监听触发，面板展开，`refreshSheetBody` 克隆 hero 内容（cityTabs/距离/态势/生命周期/逐小时）

#### Scenario: 面板展开时点击 △ 收起
- **WHEN** 面板已展开，按钮文本变为 △，用户点击 △
- **THEN** click 监听触发，`toggleSheet(false)` 执行，面板收起，按钮文本变回 ▽

#### Scenario: 触摸热区扩大
- **WHEN** 用户点击 ▽ 按钮实体 44×44 之外的 8px padding 环（即 `::before` 伪元素覆盖区）
- **THEN** 事件仍命中 `#msToggle`，触发面板切换（伪元素 `pointer-events: auto` + 默认冒泡到按钮）

#### Scenario: PC 端不受影响
- **WHEN** PC 端（pointer: fine, width ≥ 769px）访问页面
- **THEN** `#msToggle` 仍 `display: none !important`（PC 媒体查询 L935），新加的 `pointer-events: auto` 无效果（display:none 元素不接收事件）

#### Scenario: hidden 状态仍彻底隐藏
- **WHEN** `#msToggle` 被设为 `hidden`（理论上不会发生，因 `mt.hidden = false` 常驻；但作为防御）
- **THEN** `#msToggle[hidden] { display: none !important }`（L2191）优先生效，按钮不可见也不可点
