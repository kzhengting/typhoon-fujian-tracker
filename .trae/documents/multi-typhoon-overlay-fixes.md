# 多台风叠加：边缘 Bug 修复 + 提交计划

## Context（背景）

用户请求：修改 PC 端、手机端的台风选择方案，支持多选、多台风路径叠加与研判（最多 3 个，青/橙/红独立颜色与图层，2+ 台风时信息面板切换为对比摘要表，单选零回归）。

**当前状态**：该功能在上一轮会话中已完整实现并写入工作区，但**尚未提交**。`git status` 显示：
- `index.html` 已修改未提交
- `.trae/documents/multi-typhoon-overlay.md`（设计文档）未跟踪

代码审查确认核心功能（多选状态、独立图层、参数化渲染、对比表、PC 复选框下拉、手机标签条、CSS、单选零回归集成）**均已实现**。但审查中发现 **4 个多选模式下的边缘 Bug**，会导致叠加路径被清空或开关失效。本计划修复这些 Bug，验证后提交并推送。

所有改动集中在单文件 `d:\kzht\Documents\typhoon-fujian-tracker\index.html`。

---

## 已实现部分（无需改动，仅确认）

| 模块 | 位置 | 状态 |
|---|---|---|
| 多选状态 `MAX_OVERLAY`/`OVERLAY_COLORS`/`selectedTyphoons`/`isMultiSelect`/`nextColorIdx` | L2956-2966 | ✅ |
| 图层管理 `createTyphoonLayers`/`removeTyphoonLayers`/`clearAllTyphoonLayers`/`addTyphoon`/`removeTyphoon` | L3913-3995 | ✅ |
| `renderMap` 委托给 `renderMapForTyphoon(points,latest,forecastPts,color,tyLayers,isPrimary)` | L3731-3738 | ✅ |
| 单选零回归：`renderTyphoon` 同步 `selectedTyphoons=[{primary, layerGroup: layers}]` | L5267-5284 | ✅ |
| `fitMapToAll()` 适配所有选中台风 | L3997 | ✅ |
| 面板分发 `renderPanel()` + 对比表 `renderComparisonTable()` | L4014-4109 | ✅ |
| PC 复选框下拉 `ty-multisel` + `buildMultiSelectList` + `updateMultiUI` + 事件 | L2715/L5574/L5598/L5632-5702 | ✅ |
| 手机标签条 `ty-chips` | L2751/L5612/L5687 | ✅ |
| CSS（含响应式） | L678-971, L2106-2141 | ✅ |

---

## 待修复的 4 个边缘 Bug（仅多选模式触发）

根因同源：单选代码路径被多选模式误用。统一策略：在单选专属路径前用 `isMultiSelect()` 守卫，多选走原地更新路径，复用已有 helper，不引入新抽象层。

### Bug 1（HIGH）：刷新清空叠加
- **根因**：`refreshBtn`（L5461）→ `load()` → `renderTyphoon(selectedTyphoonId)`（L5335/L5309）→ `clearAllTyphoonLayers()`（L5278）+ `selectedTyphoons=[{仅主台风}]`（L5279）。`schedule()` 自动刷新 `setInterval(load, REFRESH_MS)`（L5458）同根因。
- **修复**：
  1. 新增 `refreshAllSelected()`（插入 L3995 `removeTyphoon` 之后）：串行 `await fetchTyphoonInfo(t.id)`（复用 `loadSeq` 并发守护），**保留** 每个 `t.color`/`t.colorIdx`/`t.layerGroup`，仅 `clearLayers()` 各子 group 后用 `renderMapForTyphoon(info.points, latest, forecastPts, t.color, t.layerGroup, isPrimary)` 原地重渲染；循环前 `state.fitMap=false` 防误触单台风 fit；末尾 `syncLayerTogglesToAll(); updateMultiUI(); renderPanel();`，配 `setLive`/`refreshBtn.disabled` 状态。
  2. `refreshBtn` handler（L5461-5464）：开头 `if (isMultiSelect()) { refreshAllSelected(); schedule(); return; }`
  3. `schedule()`（L5456-5459）：`setInterval` 回调改为 `isMultiSelect() ? refreshAllSelected() : load()`

### Bug 2（MEDIUM）：底图切换陈旧重渲染
- **根因**：`applyBasemap`（L5724-5728）在 `state._renderArgs` 存在时调 `renderMap(...)` → `clearDynamicLayers()` + 把陈旧单台风重渲染进全局 `layers`。多选时各台风在独立 layerGroup，底图切换不需要重绘矢量层。
- **修复**：`applyBasemap` 的 `renderMap` 调用加守卫 `if (!isMultiSelect())`，`map.closePopup()` 保留。

### Bug 3（LOW-MEDIUM）：风圈/观测开关只作用全局 `layers`
- **根因**：`windBtn`（L5476）/`obsBtn`（L5485）/`mcWind`（L5782）只 `addLayer/removeLayer(layers.wind|obs)`。多选时各 `t.layerGroup.wind|obs` 不受控；且 `createTyphoonLayers` 默认全 `addTo(map)`，新加入台风不尊重当前开关态。
- **修复**：
  1. 新增 `syncLayerTogglesToAll()`（插入 L3930 `removeTyphoonLayers` 之后）：遍历 `selectedTyphoons`，跳过 `t.layerGroup === layers`，按 `windOn`/`obsOn` 用 `map.hasLayer` 守卫同步各 `t.layerGroup.wind|obs` 挂载态。只应用当前态，不切换开关、不碰按钮 class。
  2. `windBtn`/`obsBtn`/`mcWind` handler 末尾各追加 `syncLayerTogglesToAll();`
  3. `addTyphoon`（L3976 `updateMultiUI()` 之前）追加 `syncLayerTogglesToAll();`

### Bug 4（LOW）：fitBtn 用 lastBounds 而非 fitMapToAll
- **根因**：`fitBtn`（L5466-5468）用单台风 `lastBounds`。
- **修复**：开头 `if (isMultiSelect()) { fitMapToAll(); return; }`

### 单选零回归保障
- `isMultiSelect()` = `selectedTyphoons.length >= 2`，单选时所有守卫走原路径，完全不变。
- `syncLayerTogglesToAll` 对单选（`t.layerGroup === layers`）直接跳过，等价 no-op。

---

## 改动点汇总（按行号顺序）

| 行号 | 位置 | 改动 |
|---|---|---|
| L3930 后 | `removeTyphoonLayers` 之后 | 新增 `syncLayerTogglesToAll()` |
| L3976 前 | `addTyphoon` 内 `updateMultiUI()` 之前 | 追加 `syncLayerTogglesToAll();` |
| L3995 后 | `removeTyphoon` 之后 | 新增 `refreshAllSelected()` |
| L5456-5459 | `schedule()` | `setInterval` 回调加 `isMultiSelect()` 分支 |
| L5461-5464 | `refreshBtn` handler | 开头加 `isMultiSelect()` 分支 |
| L5466-5468 | `fitBtn` handler | 开头加 `isMultiSelect()` 分支 |
| L5480 后 | `windBtn` handler | 追加 `syncLayerTogglesToAll();` |
| L5489 后 | `obsBtn` handler | 追加 `syncLayerTogglesToAll();` |
| L5724-5728 | `applyBasemap` | `renderMap` 调用加 `!isMultiSelect()` 守卫 |
| L5790 后 | `mcWind` handler | 追加 `syncLayerTogglesToAll();` |

共 10 处改动，2 个新增小函数，均为最小 diff。

---

## 验证步骤

### PC 端
1. **单选回归**：选 1 个台风 → 路径/风圈/观测/预测正常；刷新数据更新视图不丢；适配回 lastBounds；四种底图切换正常；风圈/观测按钮正常。
2. **多选叠加**：勾选 2 个再勾第 3 个（青/橙/红），三路径同图叠加，对比表出现，地市影响隐藏。
3. **Bug 1**：多选下点「立即刷新」→ 三路径保留、颜色不变、对比表数据更新，不退化为单选；状态条「刷新中…→已更新」。
4. **Bug 1 自动刷新**：等待 `REFRESH_MS`（或临时调小）触发，叠加保留。
5. **Bug 2**：多选下切换四种底图 → 叠加完整保留，无陈旧单台风重复；popup 关闭。
6. **Bug 3**：多选下点风圈/观测 → 所有台风同步隐藏/显示；浮动条风圈按钮同步；新勾第 3 个台风立即尊重当前开关态。
7. **Bug 4**：多选下点「适配」→ 框住全部 3 条路径。
8. **并发守护**：多选刷新中切换年份 → `loadSeq` 中断 `refreshAllSelected`。

### 移动端
1. 单选回归：选台风后自动滚到地图，浮动条风圈按钮可用。
2. 多选：chips 上 × 移除某台风，剩余保留颜色与对比表。
3. Bug 1/2/3/4 在移动端重复验证。
4. 多选时信息抽屉显示对比表，城市影响隐藏。

### 提交与推送
验证通过后：
- `git add index.html`（设计文档 `.trae/documents/multi-typhoon-overlay.md` 一并加入跟踪）。
- 提交信息（中文风格）：`修复多台风叠加 4 个边缘 Bug：刷新清空叠加 / 底图切换陈旧重渲染 / 风圈观测开关 / 适配边界`。
- 推送到 `origin main`（用户确认后）。

---

## Critical Files
- `d:\kzht\Documents\typhoon-fujian-tracker\index.html`（所有改动）
- `d:\kzht\Documents\typhoon-fujian-tracker\.trae\documents\multi-typhoon-overlay.md`（设计文档，一并提交）
