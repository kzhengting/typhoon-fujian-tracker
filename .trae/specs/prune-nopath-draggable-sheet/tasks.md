# Tasks

- [x] Task 1: 删除 10 个无路径台风
  - [x] 1.1 修改 `scripts/build-typhoon-index.js`：新增 `fjMin==null` 丢弃逻辑（第 4 步过滤，保留 fjMin===0）
  - [x] 1.2 重建 `typhoon-index.json`，2267 → 2257
  - [x] 1.3 清理 `.cache-details.json` / `.cache-fjmin.json` / `.cache-landfj.json` 中 10 个陈旧 ID
  - [x] 1.4 验证 10 个 2020 台风不再出现（2020 年剩 14 个，无被删名字）

- [x] Task 2: 移除 #mcMenu 下拉菜单 + ui-collapsed 模型
  - [x] 2.1 移除 `#mcMenu` 按钮 DOM
  - [x] 2.2 移除 `#mobileMenu` 下拉菜单 DOM + `#mobileBackdrop`
  - [x] 2.3 移除 `#mcMenu`/`#mobileMenu`/`#mobileBackdrop` CSS
  - [x] 2.4 移除 `openMobileMenu`/`closeMobileMenu` 函数 + 事件监听
  - [x] 2.5 移除 `body.ui-collapsed` JS 切换逻辑（CSS 死规则保留无害）

- [x] Task 3: 重构 #mobileSheet 为可拖拽 3 档吸附抽屉
  - [x] 3.1 DOM：handle + header（摘要 + 工具行）+ body
  - [x] 3.2 header 工具行：5 个按钮（msWind/msObs/msFit/msRefresh/msFs）镜像现有按钮逻辑
  - [x] 3.3 body：`refreshSheetBody()` 克隆信息层板块（PC early-return，仅手机端克隆）
  - [x] 3.4 CSS：三档 `snap-hidden(100%)/snap-half(50%)/snap-full(8%)` + transition + 半屏 body overflow:hidden
  - [x] 3.5 CSS：header 摘要 + 工具行（≥36px）+ handle 样式
  - [x] 3.6 JS：touch 手势（touchstart/move/end）拖动 + 阈值吸附
  - [x] 3.7 JS：点按 handle 循环切换（hidden→half→full→hidden）— 已验证 half→full→hidden 循环
  - [x] 3.8 JS：默认台风加载后 `setSnap("half")`（wasFitMap 标志，仅首次加载）
  - [x] 3.9 JS：`#mobileChip` 点按 → `setSnap("half")`；`#mcMenu` 已移除

- [x] Task 4: syncMobilePanel 重构 + 联动清理
  - [x] 4.1 `syncMobilePanel` 简化为 `invalidateSize + updateMobileChip`
  - [x] 4.2 抽屉状态切换调用 `map.invalidateSize()`（setSnap 内）
  - [x] 4.3 map click 移除 ui-collapsed 切换，仅保留测距 + _blockPanelToggle
  - [x] 4.4 `scrollCue` 改为 `setSnap("full")` + refreshSheetBody + 滚动到 hourly 克隆
  - [x] 4.5 `showWindCircle` 手机端 `setSnap("hidden")` 替代 ui-collapsed

- [x] Task 5: 验证与回归
  - [x] 5.1 PC：信息层与地图并排，抽屉/chip/menu 不可见；路径渲染 74 层；2020 下拉框无 10 个无路径台风
  - [x] 5.2 手机端 sheet：snap-half 渲染（translateY 50%=276px）；handle 点击循环 half→full→hidden（hidden 属性生效）；摘要填充（福州/589km/影响高峰时段）
  - [x] 5.3 工具行：5 个按钮（msWind/msObs/msFit/msRefresh/msFs）均存在
  - [x] 5.4 风圈：上一版已验证巴威2026实线/山竹2018虚线估算；showWindCircle 改用 setSnap("hidden")（matchMedia 门控，代码验证正确）
  - [x] 5.5 索引 2257，无路径台风已剔除，count 与 length 一致

# Task Dependencies
- Task 1（删除无路径）独立，可与 Task 2-4 并行（不同文件）
- Task 2（移除下拉菜单）→ Task 3（重构抽屉）→ Task 4（联动清理）有顺序依赖（同在 index.html）
- Task 5（验证）依赖 Task 1-4 全部完成
