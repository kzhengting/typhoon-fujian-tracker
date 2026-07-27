# Tasks

- [x] Task 1: 历史台风风圈估算功能（核心）
  - [x] 1.1 在 `index.html` 新增 `estimateWindCircles(point)` 函数：当 `point.windCircles` 为 `null` 且 `point.speed` ≥ 18 m/s 时，按 `r7_max = 8 × Vmax + 70`、`r10_max = 4 × Vmax + 10`（km）估算；四象限 NE/SW 取 max、SE/NW 取 0.65 × max；返回 `{ r7, r10, r12: null, isEstimated: true }` 结构；Vmax < 18 返回 `null`
  - [x] 1.2 修改 `parsePoint`：在 `windCircles` 后新增 `estimatedWindCircles` 字段，调用 `estimateWindCircles(point)` 计算
  - [x] 1.3 修改 `drawWindCircles`：改为使用 `point.windCircles || point.estimatedWindCircles`；估算风圈使用 `dashArray: "6 4"` 虚线边框 + `fillOpacity:0.10`，观测风圈维持实线
  - [x] 1.4 修改 `showWindCircle`：判定条件改为 `!point.windCircles && !point.estimatedWindCircles`
  - [x] 1.5 修改 `pointPopup`：取 `p.windCircles || p.estimatedWindCircles`；估算风圈的行标签追加「（估算）」字样
  - [x] 1.6 修改自动显示最新点风圈的逻辑：`find((p) => p.windCircles || p.estimatedWindCircles)`
  - [x] 1.7 修改 `hasWind` 判定：改为 `points.some((p) => p.windCircles || p.estimatedWindCircles)`，历史台风风圈开关不再禁用
  - [x] 1.8 修改 peak 风圈计算：`peak.windCircles || peak.estimatedWindCircles`，生命史文本追加「（估算）」

- [x] Task 2: 台风列表空白/重复清理
  - [x] 2.1 修改 `buildTyphoonSelect`：name/enName 均空显示「未命名」；no=0 显示「热带低压」；`("fjMin" in t && t.fjMin == null)` 时追加「（无路径）」
  - [x] 2.2 新增 `dedupNamelessTyphoons` 函数（路径指纹去重，仅对 `!name && !enName` 无名条目生效），`isValidNamelessPath` 原样保留
  - [x] 2.3 重建 `typhoon-index.json`，2271 → 2267（删除 4 对重复无名台风：1975#6、1970#4、1961#16、1986#13 各保留 1 条）
  - [x] 2.4 同步清理 `.cache-details.json` / `.cache-fjmin.json` / `.cache-landfj.json` 中 4 个陈旧 ID

- [x] Task 3: 手机端下拉菜单交互（替换收起按钮）
  - [ ] 3.1 在 `#mobileChip`（[L2299-2311](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2299-L2311)）的 `.mc-actions` 新增「⋯」菜单触发按钮 `#mcMenu`，移除 `#mcExpand` 展开按钮
  - [ ] 3.2 新增底部抽屉 DOM `#mobileSheet`（默认隐藏）与下拉菜单 `#mobileMenu`（点击「⋯」展开），菜单项：查看时间线 / 生命史 / 逐小时风力 / 风圈开关 / 点位开关 / 框选路径 / 立即刷新 / 全屏
  - [ ] 3.3 移除 `#panelToggle` 按钮 DOM（[L2296](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2296)）及其 CSS（[L924-990](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L924-L990)）
  - [ ] 3.4 重构 `syncMobilePanel`（[L4798-4812](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L4798-L4812)）：移除 `panelToggle.textContent` 逻辑，保留地图拖拽/缩放/`invalidateSize`/`updateMobileChip` 同步
  - [ ] 3.5 移除 `#panelToggle` 的事件监听（[L4814-4825](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L4814-L4825)）与地图点击中的 `panelToggle` 联动（[L4867-4878](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L4867-L4878)）；改为：地图点击在手机端切换 `ui-collapsed`，无独立按钮同步
  - [ ] 3.6 移除 `scrollCue` 与 `mcExpand` 中对 `panelToggle` 的引用（[L4893-4896](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L4893-L4896)）
  - [ ] 3.7 实现「⋯」菜单点击展开下拉项，点击「查看时间线/生命史/逐小时」打开底部抽屉展示对应内容；抽屉顶部「关闭」按钮或下拉手势收起
  - [ ] 3.8 菜单中「风圈开关/点位开关/框选路径/立即刷新/全屏」直接执行对应操作（复用现有按钮逻辑），不打开抽屉
  - [ ] 3.9 调整 CSS：`#mobileChip` 隐藏 `#mcExpand`，新增 `#mcMenu` 样式；`#mobileSheet` 底部抽屉滑入动画；`#mobileMenu` 下拉菜单样式；确保触摸目标 ≥ 44px

- [ ] Task 4: 验证与回归
  - [ ] 4.1 Puppeteer 验证（PC 1280×800）：历史台风（山竹2018）点击路径点显示虚线估算风圈 + 弹窗「（估算）」标注；当年台风（巴威2026）显示实线观测风圈无标注
  - [ ] 4.2 Puppeteer 验证（PC）：台风列表无空白项，「未命名」/「热带低压」/「（无路径）」标签正确；索引从 2271 → 约 2263
  - [ ] 4.3 Puppeteer 验证（手机端 390×844）：无 `#panelToggle` 按钮；「⋯」菜单可展开；点击「查看时间线」打开底部抽屉；抽屉可关闭；默认全屏地图 + 浮动数据条
  - [ ] 4.4 Puppeteer 验证（手机端）：历史台风点击路径点显示估算风圈；风圈开关可点击（不再禁用）
  - [ ] 4.5 PC 端零回归：信息层与地图并排布局不变，路径/风圈显示正常，Ctrl+滚轮缩放/拖拽/点击点位正常

# Task Dependencies
- Task 1（风圈估算）独立，可首先并行实施
- Task 2（列表清理）独立，与 Task 1 并行
- Task 3（手机端下拉菜单）独立，与 Task 1/2 并行，但需注意 `syncMobilePanel` 与 `showWindCircle` 的交叉点（Task 1.4 修改 showWindCircle，Task 3.4 修改 syncMobilePanel，两者在手机端自动收起逻辑上有交集，建议 Task 1 先合入或同 Agent 处理）
- Task 4（验证）依赖 Task 1/2/3 全部完成
