# ▽ 按钮重构：从"打开信息面板"改为"收起顶部 UI / 全屏地图"

## Summary

用户反馈两个问题：
1. ▽ 三角形图标太大，要小一点
2. ▽ 的作用错了——当前点击拉下黑色信息面板显示"请先在顶部选择台风"，用户期望它是**隐藏顶部选台风对话框、显示地图全景**的开关

重构后：▽ = 收起/展开顶部 UI（header + city-tabs + ty-row + ty-search）的开关，收起后露出全屏地图。信息面板（台风寿命周期等详情）改由底部 `#mobileChip` 数据条点击打开，与 ▽ 解耦。

## Current State Analysis

### 当前 ▽ 行为（错误）
- `#msToggle` click → `toggleSheet(!sheetExpanded)` (L5100-5103) → 打开 `#mobileSheet` 黑色面板
- 无台风时面板显示"请先在顶部选择台风"提示（L5014-5021）
- `#mobileChip` 底部数据条 click → 也打开同一个信息面板（L5091-5094）
- `body.ui-collapsed` CSS 已存在（L940-957）但从未被切换，标记为"死代码"

### 当前移动端可见的顶部 UI
- `header`（brand-mark "福建台风追踪" + live-pill）
- `.city-tabs`（城市切换标签）
- `.hero` 内的 `.ty-row`（年份+台风选择器）+ `.ty-search`（搜索框+筛选按钮）
- hero 详情块（distance/situation 等）已被 Map-First CSS 隐藏（L1789-1797）

### 关键架构
- `#map`：`position: fixed; inset: 0; z-index: 0`（L52-58）——全屏地图在底层
- `.stage`：`z-index: 3`（L100）——覆盖在地图上，内含 `.ui` grid 布局
- `.ui`：`pointer-events: none`（L113），子元素按需 `auto`
- 移动端 `.stage`：`height: auto; min-height: 100vh`（L1782-1785）
- 固定定位元素（`#msToggle`/`#mobileChip`/`#mobileSheet`/`.map-zoom`/`.map-side`）不参与 grid 布局

## Proposed Changes

### 1. ▽ 图标缩小
**文件**: `index.html` L2171
- `font-size: 22px` → `font-size: 16px`
- 按钮保持 `44×44`（触摸目标不变，只缩小学形字符）
- `body.ty-active .brand-mark { padding-left: 52px }` 不变（按钮右边缘仍在 52px 处）

### 2. ▽ 点击行为改为切换 `ui-collapsed`
**文件**: `index.html` L5098-5104

将 `#msToggle` 的 click 监听从 `toggleSheet(!sheetExpanded)` 改为新函数 `toggleTopUI()`：

```javascript
// ▽ 切换顶部 UI（选台风对话框）的显隐，收起后露出全屏地图
function toggleTopUI() {
  const collapsed = document.body.classList.toggle("ui-collapsed");
  const toggle = document.getElementById("msToggle");
  if (toggle) {
    toggle.textContent = collapsed ? "△" : "▽";
    toggle.setAttribute("aria-label", collapsed ? "展开顶部选择栏" : "收起顶部选择栏");
  }
  if (typeof map !== "undefined") {
    setTimeout(() => map.invalidateSize(), 50);
  }
}

const msToggle = document.getElementById("msToggle");
if (msToggle) {
  msToggle.addEventListener("click", toggleTopUI);
}
```

- 收起时：`body.ui-collapsed` 添加，▽ → △，隐藏顶部 UI
- 展开时：`body.ui-collapsed` 移除，△ → ▽，恢复顶部 UI
- `map.invalidateSize()` 延迟 50ms 调用，等 CSS 过渡后让地图适应新可见区域

### 3. 确保 `body.ui-collapsed` 在移动端正确工作
**文件**: `index.html` — 在 `@media (max-width: 768px), (pointer: coarse)` 块内补充

现有 L940-957 的 `body.ui-collapsed` 规则（全局，非媒体查询内）已经隐藏：
- `.hero, header, .city-tabs, footer, .map-disclaimer { display: none }`
- `.stage { min-height: 0; height: 0; overflow: visible }`

移动端 `.stage` 有 `min-height: 100vh`（L1785），但 `body.ui-collapsed .stage`（特异性 0,2,1）高于 `.stage`（0,0,1），所以 `min-height: 0` 会覆盖。**无需额外 CSS**——现有规则在移动端也生效。

验证：收起后 `.stage` 高度归零，`.ui` 内 header/city-tabs/hero 被 `display:none`，固定定位的 `#msToggle`(△)/`#mobileChip`/`.map-zoom`/`.map-side` 仍可见，底层 `#map` 全屏露出。

### 4. 信息面板与 ▽ 解耦
**文件**: `index.html`

- `#mobileChip` click → `toggleSheet(true)` 保持不变（L5091-5094）——底部数据条仍是打开信息面板的唯一入口
- `refreshSheetBody()` 的"请先在顶部选择台风"提示保留（L5014-5021）作为安全网，但因 `#mobileChip` 无台风时 `hidden`，实际不会触发
- 地图点击收起信息面板逻辑（L5109-5111）保持不变——仅当 `sheetExpanded` 时点地图收起面板，不影响 `ui-collapsed` 状态

### 5. 脉冲动画调整
**文件**: `index.html` L2207-2209

`body.ty-active #msToggle` 脉冲动画保留——台风加载后引导用户注意 ▽ 按钮，提示"可点击收起顶部 UI 看全屏地图"。

## Assumptions & Decisions

1. **▽ 只管收起/展开顶部 UI，不管信息面板**——信息面板由 `#mobileChip` 底部数据条点击打开。用户看完全屏地图后想看台风详情，点底部数据条即可。
2. **收起时隐藏所有顶部 UI**（header + city-tabs + hero），不只隐藏 ty-row/ty-search——"全景地图"应该是完全干净的视图，只剩 △ 按钮 + 地图 + 底部数据条。
3. **按钮尺寸不变（44×44），只缩小学形字号**——保持触摸目标 ≥44px 符合 Apple HIG。
4. **无台风时 ▽ 仍可用**——收起顶部 UI 看空地图全景，再点 △ 恢复选择栏。此时 `#mobileChip` 隐藏（无数据），界面只有地图 + △。
5. **不删除 `#mobileSheet` 信息面板**——它仍有价值（台风寿命周期/逐小时/统计），只是改由 mobileChip 触发。

## Verification Steps

1. **移动端（Puppeteer iPhone 12 模拟）**：
   - 加载页面，▽ 按钮可见，字号 16px（比之前 22px 小）
   - 点击 ▽ → `body.ui-collapsed` 添加，顶部 UI（header/city-tabs/hero）`display:none`，地图全屏可见，按钮变 △
   - 点击 △ → `body.ui-collapsed` 移除，顶部 UI 恢复，按钮变 ▽
   - `#mobileSheet` 信息面板不出现（▽ 不再触发它）
   - 选台风后点 `#mobileChip` → 信息面板打开（旧功能不回归）

2. **PC 端零回归**：
   - `#msToggle` 在 PC 端 `display:none`（`@media (min-width:769px) and (pointer:fine)`），不受影响
   - `body.ui-collapsed` CSS 在 PC 端也存在但不会被切换（▽ 不可见）

3. **推送 + GitHub Pages 重建**：
   - commit + push 到 origin/main
   - 确认 GitHub Pages build status = built
   - 用户在 iPhone Safari 强制刷新验证
