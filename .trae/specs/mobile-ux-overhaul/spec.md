# 手机端交互模式优化 Spec

> change-id: `mobile-ux-overhaul`
> 目标文件：`index.html`（~4700 行，内嵌 CSS + 原生 JS + Leaflet 1.9.4）
> 范围：仅手机端（`max-width: 768px`），PC 端行为不变。

## Why
手机端当前采用「信息层展开时地图 `pointer-events: none`」的模式以允许页面纵向滚动，但这导致两个核心体验问题：

1. **路径与风圈被信息层遮挡**：默认展开态下 `.hero`/`.ui` 面板覆盖地图大半屏幕，台风当前位置与自动绘制的最新点风圈（[index.html:3084](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3084)）大多被挡住，用户「看不到路径和风圈」。
2. **点击路径点看风圈的流程断裂（鸡生蛋问题）**：`showWindCircle` 在点击路径点时自动收起面板以露出风圈（[index.html:2935-2937](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2935-L2937)），但展开态下 `#map` 为 `pointer-events: none`（[index.html:1830-1832](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L1830-L1832)），路径点 / 观测点 / 台风图标根本无法被点击，自动收起逻辑沦为死代码。用户必须先手动点「收起」进入全屏地图才能点点位——该流程非直觉且无引导。

经核实：风圈数据本身正确（最新点风圈于 render 时自动绘制于 [index.html:3084](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3084)，风圈按钮启用/禁用已于 B7 修复），问题纯属手机端**可见性与交互模式**，非数据 bug。

## What Changes
- **手机端台风加载后默认进入全屏地图模式**：自动 `ui-collapsed`，第一时间展示完整路径 + 最新点风圈，地图可交互（拖拽 / 双指缩放 / 点击点位）。
- **新增常驻浮动数据条（compact chip）**：全屏地图模式下显示城市、距离、态势相位、登陆状态等关键信息，点击展开完整信息层，保证「看到的数据」不丢失。
- **修复展开态点位可点击**：将 `#map { pointer-events: none }` 收窄为仅作用于背景瓦片 / 矢量 pane（`.leaflet-tile-pane`、`.leaflet-overlay-pane`），保留 `.leaflet-marker-pane`、`.leaflet-popup-pane` 可交互。这样展开态阅读数据时仍可点击路径点 / 观测点 / 台风图标查看风圈，且页面纵向滑动不被地图背景捕获。
- **加载时自动适配视野**：手机端台风加载后 `fitBounds` 路径范围，并预留数据条高度 padding，确保最新点及其风圈落在可见区域内。
- **触摸目标与手势打磨**：`#panelToggle`、风圈 / 点位 / 框选 / 刷新按钮在手机端 ≥44px、互不重叠；全屏地图模式双指缩放、单指拖拽正常；展开态单指纵向滑动滚动页面。
- **风圈渲染正确性校验**：确认 7/10/12 级四象限风圈多边形在手机端无裁剪、位置正确（与 PC 一致）、可随底图正常显示；风圈开关按钮在手机端可点击且启用/禁用态正确（沿用 B7 修复）。
- **PC 端零回归**：所有改动以 `@media (max-width: 768px)` 或 `matchMedia("(max-width: 768px)")` 收口，桌面端布局与交互完全不变。

## Impact
- 受影响代码：`index.html`
  - CSS：移动端媒体查询（[L1815-1840](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L1815-L1840)）、`#panelToggle`（[L924-981](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L924-L981)）、`body.ui-collapsed` 规则（[L983-989](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L983-L989)）、`#map` pointer-events（[L1830-1837](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L1830-L1837)）、新增数据条样式。
  - JS：地图初始化与触摸同步（[L2426-2433](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2426-L2433)、[L4603-4632](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L4603-L4632)）、`showWindCircle` 自动收起（[L2930-2943](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2930-L2943)）、路径绘制与最新点风圈自动绘制（[L3082-3084](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3082-L3084)）、`load()` / `render()` 加载后自动适配与默认收起、点位点击绑定（[L3009-3010](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3009-L3010)、[L3055-3078](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3055-L3078)、[L3130-3133](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3130-L3133)）。
- 受影响能力：手机端地图交互、路径与风圈可见性、信息层展开 / 收起、点位点击查看风圈。
- 不受影响：PC 端全部交互；数据接口与时间逻辑（已修复）。

## ADDED Requirements

### Requirement: 手机端默认全屏地图模式
台风加载完成后，手机端 SHALL 自动进入全屏地图模式（`body.ui-collapsed`），完整展示路径与最新点风圈，地图可拖拽、可双指缩放、可点击点位。

#### Scenario: 手机端首次加载台风
- **WHEN** 用户在手机端（`max-width: 768px`）选择并加载一个台风
- **THEN** 页面自动收起信息层进入全屏地图模式
- **AND** 路径完整可见，最新点风圈自动绘制并可见
- **AND** 地图可单指拖拽、双指缩放
- **AND** 顶部 / 底部常驻数据条显示关键信息

#### Scenario: PC 端不受影响
- **WHEN** 桌面端（`min-width: 769px`）加载台风
- **THEN** 不触发自动收起，信息层与地图并排显示，行为与现状一致

### Requirement: 常驻浮动数据条
手机端全屏地图模式 SHALL 显示一个常驻浮动数据条，展示城市、距离、态势相位、登陆状态等关键信息，点击可展开完整信息层。

#### Scenario: 全屏地图模式查看关键数据
- **WHEN** 手机端处于全屏地图模式
- **THEN** 浮动数据条常驻可见，不遮挡路径最新点与风圈
- **AND** 点击数据条或「展开」按钮恢复完整信息层

#### Scenario: 数据条不遮挡风圈
- **WHEN** 地图自动适配路径范围
- **THEN** `fitBounds` 预留数据条所占高度的 padding
- **AND** 最新点及其风圈落在数据条之外的可见区域

## MODIFIED Requirements

### Requirement: 展开态点位可点击（修复鸡生蛋流程）
手机端信息层展开态下，路径点、观测点、台风图标 SHALL 仍可被点击以查看该点风圈；背景瓦片与矢量线不捕获触摸，保证页面可纵向滚动。

#### Scenario: 展开态点击路径点
- **WHEN** 手机端信息层展开，用户点击路径上的观测点
- **THEN** 调用 `showWindCircle` 显示该点风圈
- **AND** 自动收起信息层以全屏展示风圈
- **AND** 路径线、背景瓦片的单指纵向滑动仍滚动页面（不拖动地图）

#### Scenario: 展开态页面滚动
- **WHEN** 手机端信息层展开，用户在地图背景区域单指纵向滑动
- **THEN** 页面正常滚动到下方影响 / 逐小时区域
- **AND** 地图不发生平移

### Requirement: 手机端地图触摸手势
手机端全屏地图模式 SHALL 支持单指拖拽平移、双指缩放；展开态 SHALL 禁用地图平移 / 缩放以让位页面滚动。

#### Scenario: 全屏地图手势
- **WHEN** 手机端全屏地图模式
- **THEN** `map.dragging.enable()` 且 `map.touchZoom.enable()`
- **AND** 单指拖拽平移地图，双指捏合缩放

#### Scenario: 展开态不拦截滚动
- **WHEN** 手机端信息层展开
- **THEN** `map.dragging.disable()` 且 `map.touchZoom.disable()`
- **AND** 仅 marker / popup pane 可交互

### Requirement: 风圈渲染正确性
手机端 7/10/12 级四象限风圈 SHALL 与 PC 端渲染一致，无裁剪、位置正确、可见。

#### Scenario: 手机端风圈显示
- **WHEN** 手机端加载有风圈数据的台风
- **THEN** 最新点风圈自动绘制并可见
- **AND** 点击任意路径点显示该点风圈
- **AND** 风圈开关按钮可点击，启用 / 禁用态正确

## REMOVED Requirements
（无）
