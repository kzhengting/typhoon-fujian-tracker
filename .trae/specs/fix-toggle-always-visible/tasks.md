# Tasks

- [x] Task 1: `updateMobileChip()` 解绑 ▽ 与 hasTyphoon
  - L3602-3603：`mt.hidden = false`（移动端始终可见），不依赖 hasTyphoon
  - `mobileChip.hidden` 保留 `!hasTyphoon`（无数据时不显示底部数据条）
  - 同时移除 HTML 中 `#msToggle` 的 `hidden` 属性（L2417），CSS 即时显示不等 JS

- [x] Task 2: `refreshSheetBody()` 无台风时显示提示
  - L4982-4988：检测 `hasTyphoon=false` 时插入 `.ms-hint` "请先在顶部选择台风"，return
  - `hasTyphoon=true` 时正常克隆（现有逻辑不变）

- [x] Task 3: 新增 ▽ 脉冲动画 CSS
  - L2191-2198：`@keyframes msPulse` + `body.ty-active #msToggle { animation: msPulse 1.5s ease-in-out 3 }`
  - 脉冲效果：box-shadow 从 `rgba(0,0,0,0.4)` 变到 `rgba(127,212,200,0.6)` 再回来

- [x] Task 4: 新增 `.ms-hint` 样式
  - L2200-2206：`.ms-hint { padding: 2rem 1rem; text-align: center; color: var(--ink-dim); font-size: 0.9rem }`

- [x] Task 5: 横屏适配——`@media (min-width: 769px)` 加 `pointer: fine`
  - L931：`@media (min-width: 769px) and (pointer: fine)` — 触屏设备横屏不匹配此规则

- [x] Task 6: 补充 `@media (pointer: coarse)` 移动元素显示规则
  - L1773：`@media (max-width: 768px), (pointer: coarse)` — 触屏设备任何视口宽度都应用移动 CSS
  - 所有 JS `matchMedia("(max-width: 768px)")` 调用统一改为 `matchMedia("(max-width: 768px), (pointer: coarse)")`（5 处）

# Task Dependencies
- Task 1, 2 独立（JS 改动）
- Task 3, 4 独立（CSS 新增）
- Task 5, 6 有依赖（6 依赖 5 的媒体查询变更）
