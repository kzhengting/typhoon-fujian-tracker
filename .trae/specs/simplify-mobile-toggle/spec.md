# 简化手机端为下箭头双态模型 Spec

## Why

上一版 3 档吸附抽屉（hidden/half/full）+ 工具行 5 按钮的交互模型在真机上仍显复杂：handle 触摸目标小、3 档吸附手感模糊、工具行按钮冗余。用户要求回到更简单的"下箭头收起/展开 + 全屏"模型——点底部小箭头展开信息面板看生命周期/地市影响，点全屏或地图空白收起面板看路径风圈。

## What Changes

### A. 移除 3 档抽屉 + 工具行
- 移除 `#mobileSheet` 的 `snap-hidden/snap-half/snap-full` 三档 CSS + `setSnap()`/`SNAP_ORDER`/`currentSnap` JS
- 移除 `#msHandle`（视觉条）、`#msHead`（summary + tools）、`#ms-tools`（风圈/点位/框选/刷新/全屏 5 按钮）
- 移除 touch 拖动手势（touchstart/move/end）与 `isInHeader`/`isBtn` 判定
- 移除 `refreshSheetBody()` 的复杂克隆逻辑（简化）

### B. 新增左上角双态箭头（▽展开/△收起）
- 新增 `#msToggle` 按钮：**左上角浮动**（`top: calc(env(safe-area-inset-top)+8px); left: max(8px, env(safe-area-inset-left))`），44×44px 触摸区（::before 扩到 60×60）
- **台风加载后常驻左上角**（与 mobileChip 一起显隐，由 `updateMobileChip` 统一控制）：▽ 收起态点按展开，△ 展开态点按收起
- 放左上角避开 iPhone Home Indicator 与华为底部导航手势（底部正中真机不可控）
- 无台风时 `hidden` 隐藏（`#msToggle[hidden] { display:none !important }` 确保 display:flex 不覆盖）
- 台风加载后 `body.ty-active` 触发 brand-mark `padding-left: 52px` 让出空间
- 点 mobileChip 数据区也可展开 `#mobileSheet`（translateY 0，92dvh，body 可滚动）
- 面板内容：clone hero 板块（cityTabs 地市切换 + distance 距离 + heroLine 描述 + situationBox 态势 + lifeBlock 生命周期 + hourly 逐小时）
- 展开时 `#msBody` padding-top: 56px，为左上角 toggle 让出空间

### C. mobileChip 保留 + 新增全屏按钮
- 保留 `#mobileChip`（顶部浮动数据条：城市·距离·相位 + 风圈开关 `#mcWind`）
- 新增 `#mcFs` 全屏按钮（在 mc-actions 内，风圈开关旁）
- 全屏按钮：触发浏览器全屏 + 收起信息面板

### D. 信息面板内容
- 展开后 clone hero 源板块到 `#msBody`（含 cityTabs 地市切换 + 距离/态势/生命周期/逐小时）
- 地市 tabs 在面板内可点击切换监测城市，与 PC 端 cityTabs 联动
- 面板顶部显示当前台风摘要（城市·距离·相位，复用 mobileChip 数据）

## Impact

- Affected specs: `fix-mobile-sheet-interactions`（其 3 档抽屉+工具行模型被替换）、`prune-nopath-draggable-sheet`（snap 模型移除）
- Affected code: `index.html`（`#mobileSheet` DOM 简化、CSS 重写、JS setSnap→toggleExpand、mobileChip 加全屏按钮、refreshSheetBody 简化）
- 不影响：PC 端（`@media (min-width: 769px)` 仍 display:none）、索引数据、风圈估算逻辑

## ADDED Requirements

### Requirement: 左上角双态箭头（▽展开/△收起）
手机端台风加载后 SHALL 在左上角常驻 `#msToggle` 箭头按钮：▽ 表示可展开信息面板，△ 表示可收起。位置避开 iPhone 底部 Home Indicator 与华为底部导航手势。无台风时隐藏。

#### Scenario: 收起态点 ▽ 展开
- **WHEN** 台风已加载，信息面板收起，用户点左上角 ▽
- **THEN** 面板从底部上拉到 92dvh，body 可滚动，箭头变 △

#### Scenario: 展开态点 △ 收起
- **WHEN** 信息面板展开，用户点左上角 △
- **THEN** 面板下滑收起，地图全屏可见，箭头变 ▽

#### Scenario: 点地图空白收起
- **WHEN** 信息面板展开，用户点地图空白区域
- **THEN** 面板收起，避免遮挡地图

### Requirement: mobileChip 全屏按钮
mobileChip SHALL 有全屏按钮 `#mcFs`，点击触发浏览器全屏并收起信息面板。

#### Scenario: 点全屏按钮
- **WHEN** 用户点 mobileChip 全屏按钮
- **THEN** 浏览器进入全屏，信息面板收起，地图完整可见

### Requirement: 信息面板含地市切换与生命周期
展开的信息面板 SHALL 包含地市 tabs + 距离/态势 + 生命周期 + 逐小时表，地市 tabs 可切换监测城市。

#### Scenario: 面板内切地市
- **WHEN** 用户在展开的面板内点 cityTabs 切换城市
- **THEN** 距离/态势/逐小时表随城市重算，地图中心可选跟随

## MODIFIED Requirements

### Requirement: 手机端信息展示
手机端默认全屏地图（路径+风圈），底部 mobileChip（城市·距离·相位 + 风圈开关 + 全屏按钮）。点 mobileChip 展开信息面板看生命周期/地市影响/逐小时，左上角出现 △ 关闭按钮。无 3 档吸附、无工具行菜单。触摸目标 ≥ 44px。适配 iPhone（刘海/Home Indicator）与华为（状态栏/导航手势）safe-area。

## REMOVED Requirements

### Requirement: 3 档吸附抽屉
**Reason**: hidden/half/full 三档吸附 + handle 拖动手势在真机上手感模糊，工具行 5 按钮冗余，与"简化"诉求冲突。
**Migration**: 替换为底部 ▽ tab 双态（收起/展开），移除 setSnap/SNAP_ORDER/touch 手势/工具行。

### Requirement: 工具行 5 按钮
**Reason**: 风圈开关保留在 mobileChip，全屏按钮移到 mobileChip，点位/框选/刷新在手机端非必需（PC 端保留）。
**Migration**: msWind→mcWind（已有），msFs→mcFs（新增），msObs/msFit/msRefresh 移除。
