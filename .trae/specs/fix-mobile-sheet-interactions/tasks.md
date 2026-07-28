# Tasks

- [x] Task 1: 扩大 handle 触摸区 + 修复 touch 手势
  - [x] 1.1 CSS：`.ms-handle` 加 `position: relative`；`.ms-head` 加 `touch-action: none`
  - [x] 1.2 DOM：`.ms-head` 新增 `id="msHead"` 供 JS 绑定
  - [x] 1.3 JS：touch/click 监听绑到 `#mobileSheet`（覆盖 handle+head 兄弟节点），仅 `.ms-handle`/`.ms-head` 区域响应（isInHeader 判定）
  - [x] 1.4 JS：`touchmove` 改为 `{ passive: false }`，当 `Math.abs(dy) > 5` 时 `e.preventDefault()` 阻止页面/抽屉 body 滚动
  - [x] 1.5 JS：`touchstart`/`touchend` 保持 `{ passive: true }`；click 兜底保留；按钮点击不触发拖动（isBtn 判定）
  - [x] 1.6 CSS：`#mobileSheet` 显式加 `pointer-events: auto`（修复 `.ui` 祖先 `pointer-events:none` 导致抽屉及子元素点击穿透）

- [x] Task 2: 半屏 body 可见 + 可滚动
  - [x] 2.1 CSS：移除 `.snap-half .ms-body { overflow: hidden; max-height: 0 }` 规则
  - [x] 2.2 CSS：`.snap-half .ms-body` 走默认 `overflow-y: auto`，占 header 下方剩余空间
  - [x] 2.3 验证：半屏可见摘要 + 工具行 + 路径详情上半部分，body 可滚动

- [x] Task 3: 框选/全屏按钮联动收起抽屉
  - [x] 3.1 JS：`msFit` 点击改为 `setSnap("hidden")` → `setTimeout(() => el.fitBtn.click(), 300)`
  - [x] 3.2 JS：`msFs` 点击改为 `el.fsBtn.click()` + `setSnap("hidden")`（浏览器全屏 + 收起抽屉）
  - [x] 3.3 验证：点框选后抽屉收起、地图框选完整可见；点全屏后抽屉收起、浏览器全屏

- [x] Task 4: 风圈按钮可靠性
  - [x] 4.1 JS：`msWind` 点击逻辑简化为直接调用 `el.windBtn.click()`，不再依赖 `el.mcWind.disabled` 中转
  - [x] 4.2 JS：`msWind` 点击后若风圈开启（layers.wind 有内容），`setSnap("hidden")` 收起抽屉让用户看到风圈
  - [x] 4.3 JS：`showWindCircle` 已有空风圈判定（`if (!point || (!point.windCircles && !point.estimatedWindCircles)) return`），无需改动
  - [x] 4.4 验证：历史台风点 msWind 切换虚线估算风圈；当年台风点 msWind 切换实线观测风圈

- [x] Task 5: 默认半屏兜底
  - [x] 5.1 JS：台风加载完成后，手机端 `wasFitMap || currentSnap === "hidden"` 时 `setSnap("half")`
  - [x] 5.2 验证：首次加载台风后抽屉半屏可见，不依赖 wasFitMap 时序

- [x] Task 6: 真机/移动端视口验证
  - [x] 6.1 Puppeteer 移动端视口（390×844）：handle 点击循环 half→full→hidden→half ✅
  - [x] 6.2 半屏 body 可滚动（686px 高，7 个克隆子元素，overflow:auto）✅
  - [x] 6.3 msFit 点击 setSnap("hidden") + 300ms 后 fitBtn.click() ✅
  - [x] 6.4 msFs 点击 el.fsBtn.click() + setSnap("hidden") ✅
  - [x] 6.5 msWind 开启风圈（windOn:false→true）后 setSnap("hidden") ✅；关闭风圈保持抽屉 ✅
  - [x] 6.6 默认半屏兜底：加载后 currentSnap="half" ✅
  - [x] 6.7 PC 端零回归：1280×800 视口 mobileChip/mobileSheet display:none，hero/tySelect/windBtn/fitBtn/map 正常，86 个地图图层 ✅

# Task Dependencies

- Task 1（handle 触摸）是核心，Task 2-5 依赖其可点性才能验证
- Task 2（半屏 body）独立 CSS 改动，可与 Task 1 并行
- Task 3（框选/全屏）依赖 Task 1（按钮要能点）
- Task 4（风圈）独立逻辑改动，可与 Task 3 并行
- Task 5（默认半屏兜底）依赖 Task 1-2
- Task 6（验证）依赖 Task 1-5 全部完成
