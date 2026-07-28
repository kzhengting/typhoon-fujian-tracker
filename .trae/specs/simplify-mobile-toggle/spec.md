# 简化手机端为下箭头双态模型 Spec

## Why

上一版 3 档吸附抽屉（hidden/half/full）+ 工具行 5 按钮的交互模型在真机上仍显复杂：handle 触摸目标小、3 档吸附手感模糊、工具行按钮冗余。用户要求回到更简单的"下箭头收起/展开 + 全屏"模型——点底部小箭头展开信息面板看生命周期/地市影响，点全屏或地图空白收起面板看路径风圈。

## What Changes

### A. 移除 3 档抽屉 + 工具行
- 移除 `#mobileSheet` 的 `snap-hidden/snap-half/snap-full` 三档 CSS + `setSnap()`/`SNAP_ORDER`/`currentSnap` JS
- 移除 `#msHandle`（视觉条）、`#msHead`（summary + tools）、`#ms-tools`（风圈/点位/框选/刷新/全屏 5 按钮）
- 移除 touch 拖动手势（touchstart/move/end）与 `isInHeader`/`isBtn` 判定
- 移除 `refreshSheetBody()` 的复杂克隆逻辑（简化）

### B. 新增底部下箭头 tab（双态切换）
- 新增 `#msToggle` 按钮：底部正中浮动，下箭头 ▽ 图标，48×32px 触摸区
- 点 tab 展开 `#mobileSheet`（translateY 0，92vh，body 可滚动），图标变上箭头 △
- 再点 tab 或点地图空白 → 收起（translateY 100%），图标变 ▽
- 面板内容：clone hero 板块（cityTabs 地市切换 + distance 距离 + heroLine 描述 + situationBox 态势 + lifeBlock 生命周期 + hourly 逐小时）

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

### Requirement: 底部下箭头 tab 双态切换
手机端底部正中 SHALL 有一个下箭头 tab（`#msToggle`），点按在收起/展开两态间切换。

#### Scenario: 收起态点 tab 展开
- **WHEN** 信息面板收起，用户点底部 ▽ tab
- **THEN** 面板从底部上拉到 92vh，body 可滚动，tab 图标变 △

#### Scenario: 展开态点 tab 收起
- **WHEN** 信息面板展开，用户点顶部 △ tab
- **THEN** 面板下滑收起，地图全屏可见，tab 图标变 ▽

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
手机端默认全屏地图（路径+风圈），底部浮动 ▽ tab 与顶部 mobileChip（城市·距离·相位 + 风圈开关 + 全屏按钮）。点 ▽ tab 展开信息面板看生命周期/地市影响/逐小时。无 3 档吸附、无工具行菜单。触摸目标 ≥ 44px。

## REMOVED Requirements

### Requirement: 3 档吸附抽屉
**Reason**: hidden/half/full 三档吸附 + handle 拖动手势在真机上手感模糊，工具行 5 按钮冗余，与"简化"诉求冲突。
**Migration**: 替换为底部 ▽ tab 双态（收起/展开），移除 setSnap/SNAP_ORDER/touch 手势/工具行。

### Requirement: 工具行 5 按钮
**Reason**: 风圈开关保留在 mobileChip，全屏按钮移到 mobileChip，点位/框选/刷新在手机端非必需（PC 端保留）。
**Migration**: msWind→mcWind（已有），msFs→mcFs（新增），msObs/msFit/msRefresh 移除。
