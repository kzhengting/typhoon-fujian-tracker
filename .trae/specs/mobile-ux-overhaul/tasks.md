# Tasks

- [x] Task 1: 手机端台风加载后默认进入全屏地图模式
  - [x] 1.1 在 `load()` / `render()` 台风加载完成处，按 `matchMedia("(max-width: 768px)")` 判定手机端，自动 `document.body.classList.add("ui-collapsed")` 并调用 `updateToggle()` / `syncMapMobile()` 同步地图拖拽与缩放
  - [x] 1.2 确保自动收起后 `map.invalidateSize()` 触发，地图尺寸正确
  - [x] 1.3 验证 PC 端不触发自动收起

- [x] Task 2: 新增常驻浮动数据条（compact chip）
  - [x] 2.1 在 DOM 中新增浮动数据条元素（城市、距离、态势相位、登陆状态），仅手机端显示
  - [x] 2.2 绑定数据源：复用 `renderSituation` / `renderHero` 已有的距离 / 相位 / 登陆判定结果填充
  - [x] 2.3 点击数据条或「展开」按钮 → 移除 `ui-collapsed` 展开完整信息层
  - [x] 2.4 CSS：浮动定位（顶部或底部安全区），半透明背景，不遮挡路径最新点与风圈

- [x] Task 3: 修复展开态点位可点击（pointer-events 收窄）
  - [x] 3.1 将 `#map { pointer-events: none }`（[L1830-1832](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L1830-L1832)）改为仅作用于背景 pane：展开态下 `.leaflet-tile-pane, .leaflet-overlay-pane { pointer-events: none }`
  - [x] 3.2 保留 `.leaflet-marker-pane, .leaflet-popup-pane { pointer-events: auto }`
  - [x] 3.3 验证展开态：点击路径点 / 观测点 / 台风图标 → `showWindCircle` 正常触发并自动收起
  - [x] 3.4 验证展开态：背景区域单指纵向滑动 → 页面滚动，地图不平移
  - [x] 3.5 全屏地图模式（`ui-collapsed`）下恢复 `#map` 整体 `pointer-events: auto`（现状已有，确认不破坏）

- [x] Task 4: 加载时自动适配视野（手机端 fitBounds + padding）
  - [x] 4.1 手机端台风加载后调用 `map.fitBounds(layers.track.getBounds(), { padding })`，padding 底部预留数据条高度
  - [x] 4.2 确保最新点及其风圈落在可见区域（数据条之外）
  - [x] 4.3 与 Task 1 的自动收起配合：收起 → `invalidateSize` → `fitBounds`

- [x] Task 5: 触摸目标与手势打磨
  - [x] 5.1 检查 `#panelToggle`、风圈 / 点位 / 框选 / 刷新按钮手机端尺寸 ≥44px、互不重叠
  - [x] 5.2 确认全屏地图模式双指缩放、单指拖拽正常
  - [x] 5.3 确认展开态单指纵向滑动滚动页面

- [x] Task 6: 风圈渲染正确性校验（手机端）
  - [x] 6.1 手机端加载有风圈数据的活动台风，确认最新点 7/10/12 级风圈自动绘制、位置正确、无裁剪
  - [x] 6.2 点击路径点确认该点风圈显示
  - [x] 6.3 风圈开关按钮手机端可点击，启用 / 禁用态正确（无风圈数据的历史台风禁用）
  - [x] 6.4 切换台风 / 历史台风时风圈状态正确恢复（沿用 B7 / M1 修复，回归验证）

- [x] Task 7: PC 端零回归验证
  - [x] 7.1 桌面端宽度下信息层与地图并排，无自动收起
  - [x] 7.2 桌面端地图交互（Ctrl+滚轮缩放、拖拽、点击点位）正常
  - [x] 7.3 桌面端路径与风圈显示正常

# Task Dependencies
- Task 2 依赖 Task 1（数据条在全屏地图模式下显示）
- Task 4 依赖 Task 1（收起后 `invalidateSize` 再 `fitBounds`）
- Task 3、Task 5、Task 6 可与 Task 1 / 2 并行推进，但需在 Task 1 之后回归
- Task 7 在所有任务完成后统一回归
