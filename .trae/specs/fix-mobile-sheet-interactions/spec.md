# 修复手机端抽屉交互 Spec

## Why

上一版 `prune-nopath-draggable-sheet` 完成的可拖拽底部抽屉在 Puppeteer headless 下验证通过，但真机/移动端视口下暴露三个阻塞性问题，导致手机端几乎不可用：
1. **抽屉 handle 点不了**：上下拉无响应，无法切换档位。
2. **无法全屏看路径**：半屏看不到路径详情，又切不到全屏；"框选路径"按钮触发后抽屉仍挡地图。
3. **无法点风圈**：风圈按钮无反应，或点了看不到效果。

根因是触摸目标过小、touch 事件 passive 吞手势、半屏 body 强制归零、框选/全屏按钮未联动收起抽屉等多处细节缺陷叠加。

## What Changes

### A. 扩大 handle 触摸区 + 修复 touch 手势
- `.ms-handle` 视觉仍为 36×4px 条，但用伪元素/padding 将可触摸区扩大到至少 44px 高（覆盖 header 顶部）
- `touchmove` 改为 `{ passive: false }`，拖动时 `e.preventDefault()` 阻止页面/抽屉 body 滚动，避免手势被吞
- touch 监听绑定到 `.ms-head`（整个 header）而非仅 `.ms-handle`，header 任意位置可拖
- 拖动阈值与吸附逻辑保留，仅在 `Math.abs(dy) > 5` 时 preventDefault

### B. 半屏 body 可见 + 可滚动
- 移除 `.snap-half .ms-body { max-height: 0; overflow: hidden }` 强制归零
- 半屏时 header 固定高度，body 占剩余空间（约 42vh）可纵向滚动，用户半屏即可看路径摘要+部分详情
- 全屏仍为 `translateY(8%)`，body 完整滚动

### C. 框选/全屏按钮联动收起抽屉
- `msFit`（框选路径）点击：先 `setSnap("hidden")`，延时 300ms 后触发 `el.fitBtn.click()`，让地图露出再框选
- `msFs`（全屏）点击：触发 `el.fsBtn.click()` 浏览器全屏 **并** `setSnap("hidden")` 收起抽屉，露出完整地图
- 抽屉隐藏后 `#mobileChip` 浮动数据条仍可见，用户可重新点开抽屉

### D. 风圈按钮可靠性
- `msWind` 点击：不再依赖 `el.mcWind.disabled` 中转判断，直接调用统一的 `toggleWindCircle()` 逻辑（若存在）；否则 `el.windBtn.click()` 后强制 `setSnap("hidden")` 让用户看到风圈
- 确保 `mcWind.disabled` 在估算风圈场景下为 false（历史台风已有估算数据，按钮不应禁用）
- `showWindCircle`（点击路径点）原有的 `setSnap("hidden")` 逻辑保留，但补一个风圈层是否真有内容的判定，避免空风圈也收起抽屉

### E. 默认半屏兜底
- 台风加载完成后，若 `wasFitMap` 未触发但当前在手机端且 `currentSnap === "hidden"`，兜底 `setSnap("half")` 一次
- 防止首次加载因 fitMap 时序问题导致抽屉一直隐藏，用户以为"点不了"

## Impact

- Affected specs: `prune-nopath-draggable-sheet`（其交付的抽屉交互回归修复）、`estimate-windcircles-and-polish`（风圈按钮在估算场景下的可用性）
- Affected code: `index.html`（`#mobileSheet` CSS、`.ms-handle`/`.ms-head` 触摸手势、`msFit`/`msFs`/`msWind` 事件绑定、`showWindCircle`、默认半屏兜底）
- 不影响：PC 端（`@media (min-width: 769px)` 仍 `display:none`）、索引数据、风圈估算逻辑

## ADDED Requirements

### Requirement: handle 触摸目标可达
手机端抽屉 header 的可触摸区 SHALL ≥ 44px 高（含 handle 视觉条 + 周围 padding/伪元素），确保手指可稳定命中。

#### Scenario: 用户点按 handle 切换档位
- **WHEN** 用户在手机端用手指点按抽屉顶部 handle 区域
- **THEN** 抽屉在 hidden→half→full→hidden 间循环切换，无卡顿、无页面滚动

#### Scenario: 用户拖动 handle 切换档位
- **WHEN** 用户在 header 任意位置上下拖动超过 30px
- **THEN** 抽屉按拖动方向吸附到相邻档位，拖动过程中页面/抽屉 body 不滚动

### Requirement: 半屏可见路径详情
半屏档 SHALL 显示 header（摘要+工具行）+ body 路径详情上半部分，body 可纵向滚动查看完整内容。

#### Scenario: 半屏查看路径
- **WHEN** 抽屉处于半屏档
- **THEN** 用户可见距离/强度摘要 + 工具行 + 路径详情上半部分，body 可滚动

### Requirement: 框选/全屏按钮收起抽屉
`msFit`/`msFs` 点击 SHALL 先收起抽屉到 hidden，再触发地图框选/浏览器全屏，避免抽屉遮挡地图。

#### Scenario: 点框选路径
- **WHEN** 用户点击 msFit 按钮
- **THEN** 抽屉收起到 hidden，300ms 后地图框选到福建+路径视角，完整可见

#### Scenario: 点全屏
- **WHEN** 用户点击 msFs 按钮
- **THEN** 抽屉收起 + 浏览器进入全屏，地图完整可见，#mobileChip 仍可点开抽屉

### Requirement: 风圈按钮可用
`msWind` 点击 SHALL 切换风圈显示，并在手机端收起抽屉让用户看到风圈层。

#### Scenario: 历史台风点风圈按钮
- **WHEN** 用户在历史台风（估算风圈）场景点击 msWind
- **THEN** 风圈层切换显示/隐藏，抽屉收起到 hidden，估算风圈虚线在地图可见

### Requirement: 默认半屏兜底
台风加载完成后，若手机端抽屉仍处于 hidden，SHALL 兜底展开到半屏，避免用户以为抽屉不可用。

#### Scenario: 首次加载抽屉未展开
- **WHEN** 台风加载完成且手机端 currentSnap === "hidden"
- **THEN** 自动 setSnap("half")，抽屉半屏可见

## MODIFIED Requirements

### Requirement: 可拖拽底部抽屉（3 档吸附）
手机端可拖拽底部抽屉 3 档吸附（hidden/half/full），手势拖动 header 任意位置切换档位，点按 handle 循环切换。半屏档 body 可见可滚动。框选/全屏/风圈按钮联动收起抽屉。触摸目标 ≥ 44px，touchmove 阻止默认滚动。

## REMOVED Requirements

### Requirement: 半屏 body 强制归零
**Reason**: `.snap-half .ms-body { max-height: 0; overflow: hidden }` 导致半屏看不到任何路径详情，与"半屏即可看路径"的用户期望冲突，且 handle 不可点时形成死锁。
**Migration**: 移除该规则，半屏 body 占剩余空间可滚动。
