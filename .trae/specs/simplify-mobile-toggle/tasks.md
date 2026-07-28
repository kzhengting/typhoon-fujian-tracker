# Tasks

- [x] Task 1: 移除 3 档抽屉 + 工具行 DOM/CSS/JS
  - [x] 1.1 DOM：移除 `#msHandle`、`#msHead`（含 ms-summary + ms-tools 5 按钮）；`#mobileSheet` 仅保留 `#msBody`
  - [x] 1.2 CSS：移除 `snap-hidden/snap-half/snap-full` 三档规则、`.ms-handle/.ms-head/.ms-tools/.ms-btn` 样式、`.dragging` 规则
  - [x] 1.3 JS：移除 `setSnap()`/`SNAP_ORDER`/`currentSnap`、touch 手势（touchstart/move/end）、`isInHeader/isBtn` 判定、click 循环切换
  - [x] 1.4 JS：移除 `msFit/msFs/msObs/msRefresh/msWind` 事件绑定（mcWind 保留，mcFs 新增）

- [x] Task 2: 新增底部下箭头 tab + 双态切换
  - [x] 2.1 DOM：新增 `#msToggle` 按钮（底部正中浮动，▽ 图标，48×32px），放在 `#mobileSheet` 外作为兄弟
  - [x] 2.2 CSS：`#msToggle` 固定底部正中（bottom: 8px, z-index: 1301），触摸区 ≥ 44px（padding 扩展）
  - [x] 2.3 CSS：`#mobileSheet` 改为双态——默认 `transform: translateY(100%)`，`.expanded` 类 `transform: translateY(0)`，height 92vh
  - [x] 2.4 JS：`#msToggle` click 切换 `.expanded` 类 + 图标 ▽/△ + `map.invalidateSize()`
  - [x] 2.5 JS：地图 click 收起面板（expanded 时）
  - [x] 2.6 JS：台风加载后默认收起（不自动展开），保留 mobileChip 数据条

- [x] Task 3: mobileChip 新增全屏按钮
  - [x] 3.1 DOM：`#mobileChip .mc-actions` 内新增 `#mcFs` 全屏按钮（风圈开关旁）
  - [x] 3.2 CSS：`#mcFs` 样式与 `#mcWind` 一致
  - [x] 3.3 JS：`#mcFs` click → `el.fsBtn.click()` + 收起面板（若展开）

- [x] Task 4: 信息面板内容简化
  - [x] 4.1 JS：`refreshSheetBody()` 简化——展开时 clone hero 源（含 cityTabs/distance/heroLine/situationBox/lifeBlock/hourly）到 `#msBody`
  - [x] 4.2 JS：clone 后重新绑定 cityTabs 点击事件（切换监测城市）
  - [x] 4.3 JS：面板顶部摘要复用 mobileChip 数据（城市·距离·相位），或直接 clone hero-label
  - [x] 4.4 验证：展开面板可见地市 tabs + 生命周期 + 逐小时，地市可切换

- [x] Task 5: 验证与回归
  - [x] 5.1 Puppeteer 移动端（390×844）：▽ tab 点按展开/收起，图标切换 ▽/△
  - [x] 5.2 移动端：展开面板可见 cityTabs + lifeBlock + hourly（body 8 子元素验证通过）
  - [x] 5.3 移动端：点地图空白收起面板
  - [x] 5.4 移动端：mcWind 风圈开关正常；mcFs 全屏按钮收起面板 + 浏览器全屏
  - [x] 5.5 移动端：默认收起，地图全屏 + 路径 + 风圈可见
  - [x] 5.6 PC 端零回归：mobileSheet display:none；msToggle/mobileChip hidden=true；hero/tySelect/windBtn/fitBtn/fsBtn 可见

# Task Dependencies

- Task 1（移除旧模型）是基础，Task 2-4 依赖其完成
- Task 2（tab 双态）与 Task 3（全屏按钮）可并行（不同 DOM 区域）
- Task 4（面板内容）依赖 Task 2（面板展开后才能填充）
- Task 5（验证）依赖 Task 1-4 全部完成
