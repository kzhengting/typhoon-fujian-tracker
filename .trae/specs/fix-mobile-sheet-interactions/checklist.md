# Checklist

## handle 触摸区 + touch 手势
- [x] `#mobileSheet` 显式 `pointer-events: auto`（修复 `.ui` 祖先 none 导致点击穿透）
- [x] `.ms-head` 设 `touch-action: none`，允许 touchmove preventDefault
- [x] `.ms-handle` 加 `position: relative`（视觉条保留 36×4px）
- [x] `.ms-head` 新增 `id="msHead"`（DOM 标识）
- [x] touch/click 监听绑到 `#mobileSheet`（覆盖 handle+head 兄弟节点），`isInHeader` 判定仅 header 区域响应
- [x] `touchmove` 为 `{ passive: false }`，`Math.abs(dy) > 5` 时 `e.preventDefault()`
- [x] `touchstart`/`touchend` 保持 `{ passive: true }`
- [x] click 兜底循环切换保留
- [x] 按钮点击不触发拖动（isBtn 判定 `.ms-btn`）

## 半屏 body 可见可滚动
- [x] 移除 `.snap-half .ms-body { max-height: 0; overflow: hidden }` 规则
- [x] 半屏 body 走默认 `overflow-y: auto`，占 header 下方剩余空间
- [x] 半屏可见摘要 + 工具行 + 路径详情上半部分（bodyHeight 686px，7 个克隆子元素）

## 框选/全屏按钮联动
- [x] `msFit` 点击：`setSnap("hidden")` → 300ms 后 `el.fitBtn.click()`
- [x] `msFs` 点击：`el.fsBtn.click()` + `setSnap("hidden")`
- [x] 抽屉收起后 `#mobileChip` 仍可见可点开

## 风圈按钮可靠性
- [x] `msWind` 点击直接调用 `el.windBtn.click()`，不依赖 `el.mcWind.disabled`
- [x] `msWind` 开启风圈后（windOn===true）`setSnap("hidden")` 让风圈可见
- [x] `msWind` 关闭风圈时保持抽屉（windOn===false 不收起）
- [x] `showWindCircle` 已有空风圈判定（无 windCircles 且无 estimatedWindCircles 时 return）

## 默认半屏兜底
- [x] 台风加载后手机端 `wasFitMap || currentSnap === "hidden"` 时兜底 `setSnap("half")`
- [x] 不依赖 wasFitMap 时序（加载后 currentSnap="half" 验证通过）

## 验证与回归
- [x] Puppeteer 移动端视口（390×844）：handle 点击循环 hidden→half→full→hidden
- [x] Puppeteer 移动端视口：半屏 body 可滚动（686px 高，overflow:auto）
- [x] Puppeteer 移动端视口：msFit 收起抽屉 + 框选路径
- [x] Puppeteer 移动端视口：msFs 收起抽屉 + 浏览器全屏
- [x] Puppeteer 移动端视口：msWind 开启风圈收起抽屉、关闭风圈保持抽屉
- [x] Puppeteer 移动端视口：默认半屏兜底生效
- [x] PC 端零回归：1280×800 视口 mobileChip/mobileSheet display:none，hero/tySelect/windBtn/fitBtn/map 正常，86 个地图图层
