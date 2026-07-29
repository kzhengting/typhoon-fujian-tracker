# Tasks

- [x] Task 1: 隐藏移动端 `#fsBtn` 全屏按钮
  - 在 `@media (max-width: 768px)` 内新增 `#fsBtn { display: none !important; }`
  - `#fsBtn` 位于 `.map-side > .map-ctrl > .ctrl-group`（L2416），iPhone 上 `requestFullscreen()` 静默失败
  - PC 端 `#fsBtn` 不受影响（规则在移动端媒体查询内）

- [x] Task 2: 修复 `.ty-search-clear` 叉叉始终可见
  - 在基础 CSS（L724-740 附近）新增 `.ty-search-clear[hidden] { display: none !important; }`
  - 根因：`.ty-search-clear { display: flex }` 覆盖了 UA 的 `[hidden] { display: none }`
  - 修复后：搜索框为空时 × 隐藏，有文本时 × 显示

- [x] Task 3: 选台风后自动滚动到地图
  - 在 `renderTyphoon()` 函数（L4570-4589）的 `renderData(info, weather)` 之后，新增移动端自动滚动逻辑
  - 条件：`window.matchMedia("(max-width: 768px)").matches`
  - 动作：`setTimeout(() => document.querySelector(".map-gap")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300)`
  - 300ms 延迟等待地图渲染完成
  - 不在 `onCityChange()` 或 `load()` 中添加（仅用户主动选台风时触发）

- [x] Task 4: 验证 `#msToggle` 可见性（防御性检查）
  - 确认 `#msToggle[hidden] { display: none !important }` 规则存在于移动端 CSS（L2182）
  - 确认 `updateMobileChip()` 在 `renderData` 后被调用（L3985）
  - 确认 `state.info` 在 `renderTyphoon` 中被设置（L4579）
  - 规则已存在，无需补充

# Task Dependencies
- Task 1, 2, 4 可并行（独立 CSS 规则）
- Task 3 独立（JS 改动）
