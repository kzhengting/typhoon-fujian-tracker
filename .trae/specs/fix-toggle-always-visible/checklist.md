# Checklist

## ▽ 始终可见
- [x] `updateMobileChip()` 中 `mt.hidden = false`（不再依赖 hasTyphoon）
- [x] `mobileChip.hidden` 仍为 `!hasTyphoon`（无台风时底部数据条隐藏）
- [x] HTML 中 `#msToggle` 移除 `hidden` 属性（CSS 即时显示）
- [x] 页面初次加载（无台风）时 ▽ 可见（`display: flex`, 44px）
- [x] 台风加载后 ▽ 仍可见（`hidden: false`）

## 无台风时面板提示
- [x] `refreshSheetBody()` 在 `hasTyphoon=false` 时显示"请先在顶部选择台风"
- [x] 提示块有 `.ms-hint` 样式（居中、灰色文字）
- [x] `hasTyphoon=true` 时正常克隆（现有逻辑不变）

## 脉冲动画
- [x] `@keyframes msPulse` 定义存在（box-shadow 高亮）
- [x] `body.ty-active #msToggle` 应用动画，播放 3 次后停止
- [x] 脉冲效果为 box-shadow 高亮（rgba(127,212,200,0.6)）

## 横屏适配
- [x] `@media (min-width: 769px)` 改为 `@media (min-width: 769px) and (pointer: fine)`
- [x] `@media (max-width: 768px)` 改为 `@media (max-width: 768px), (pointer: coarse)`
- [x] 所有 JS `matchMedia` 调用统一为 `(max-width: 768px), (pointer: coarse)`（5 处）
- [x] 触屏设备（pointer: coarse）在任何视口宽度都应用移动 CSS

## PC 零回归
- [x] PC（pointer: fine, width ≥ 769px）匹配 `@media (min-width: 769px) and (pointer: fine)`
- [x] PC 端 `#msToggle` display 为 none（rect 0×0）
- [x] PC 端 `#mobileChip`/`#mobileSheet` display 为 none
