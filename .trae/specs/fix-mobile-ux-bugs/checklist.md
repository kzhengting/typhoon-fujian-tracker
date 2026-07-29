# Checklist

## Bug 1: ▽ 可见性
- [x] `#msToggle[hidden] { display: none !important }` 规则存在于 `@media (max-width: 768px)` 内（L2182）
- [x] `updateMobileChip()` 在 `renderData` 后被调用（L3985）
- [x] 台风加载后 `#msToggle.hidden = false`，`display` 为 `flex`
- [x] 无台风时 `#msToggle.hidden = true`，`display` 为 `none`

## Bug 2: 全屏按钮隐藏
- [x] `@media (max-width: 768px)` 内有 `#fsBtn { display: none !important; }`（L1798）
- [x] 移动端 `.map-side` 中 `#fsBtn` 不可见（`display: none`）
- [x] PC 端 `#fsBtn` 仍可见（`display: block`）

## Bug 3: 选台风后自动滚动
- [x] `renderTyphoon()` 在 `renderData` 后有移动端 `scrollIntoView(".map-gap")` 逻辑（L4582-4588）
- [x] 滚动仅在 `renderTyphoon` 中，不在 `onCityChange` / `load` 中
- [x] 滚动有 300ms 延迟（等地图渲染）
- [x] `onCityChange()` 切城市不触发滚动

## Bug 4: 搜索叉叉
- [x] `.ty-search-clear[hidden] { display: none !important }` 规则存在（L748）
- [x] 搜索框为空时 × 不可见（`display: none`）
- [x] 搜索框有文本时 × 可见（`display: flex`）
- [x] 点击 × 后清空搜索框并隐藏自身

## PC 零回归
- [x] PC 端 `#fsBtn` 可见（`display: block`）
- [x] PC 端 `.ty-search-clear` 行为不变（空→none，有文本→flex）
- [x] PC 端无自动滚动（`matchMedia` 守卫，800px 不匹配）
