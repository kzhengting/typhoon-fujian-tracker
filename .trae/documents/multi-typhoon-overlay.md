# 多台风路径叠加对比方案

## Summary

将当前单选台风改为最多 3 个台风多选叠加，PC 端用复选框下拉、手机端用搜索+彩色标签。选中 2+ 台风时，信息面板自动切换为对比摘要表（登陆点、登陆风力、级别），隐藏地市影响信息。每条路径分配独立颜色，地图上叠加渲染。

## Current State Analysis

### 单选架构关键点
- **状态**：`selectedTyphoonId`（单字符串，[L2589](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2589)）；`state.info`（单台风数据，[L2792](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2792)）
- **PC 选择器**：`<select id="tySelect">`（[L2369](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2369)），change 事件 → `load()` → `renderTyphoon(id)` → `clearDynamicLayers()` 全清 → `renderMap()` 重画
- **手机搜索**：`<input id="tySearch">`（[L2378](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2378)），输入 → `applyFilter()` → `buildTyphoonSelectFromIndex()` 填充 `#tySelect`，仍走单选
- **图层**：全局单例 `layers` 对象（[L2763](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2763)），含 track/obs/forecast/wind/markers/link，`clearDynamicLayers()`（[L3074](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3074)）全清
- **颜色**：路径固定 `#7fd4c8`（[L3369](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3369)），无色盘
- **详情面板**：`renderData()`（[L3985](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3985)）渲染 hero（距离/态势/生命统计/事件/逐小时），全部围绕单个台风
- **手机面板**：`refreshSheetBody()`（[L5063](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L5063)）克隆 hero 内容到 mobileSheet
- **登陆检测**：`detectLandfall(points)`（[L3763](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3763)）返回 `{landed, time, lat, lng, point}`；`nearestCoastalName(lat,lng)`（[L3779](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3779)）返回最近沿海地名

### 改造难点
1. `clearDynamicLayers()` 全清 → 需改为按台风 ID 增删图层
2. `renderData()` 绑定单台风 DOM → 需分支：1 台风走原逻辑，2+ 台风走对比表
3. `renderMap()` 硬编码颜色 → 需传入 color 参数
4. PC `<select>` 不支持多选 → 需自建复选框下拉组件
5. `load()` / `renderTyphoon()` 为单选设计 → 需增量渲染（不清空已有台风）

## Proposed Changes

### 1. 多选状态管理（[L2589 附近](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2589)）

新增状态结构，保留 `selectedTyphoonId` 兼容单选逻辑：

```javascript
// 多选叠加：最多 3 个台风
const MAX_OVERLAY = 3;
const OVERLAY_COLORS = ["#7fd4c8", "#f5a623", "#e84a5f"]; // 青、橙、红
const OVERLAY_NAMES = ["青", "橙", "红"];
// selectedTyphoons: Array<{ id, color, colorIdx, info, layerGroup }>
let selectedTyphoons = [];
```

- `selectedTyphoonId` 保留，始终指向 `selectedTyphoons[0]?.id`（第一个选中台风），兼容现有 `load()` / `buildTyphoonSelect` 逻辑
- 新增 `getSelectedIds()` → 返回 `selectedTyphoons.map(t => t.id)`
- 新增 `isMultiSelect()` → `selectedTyphoons.length >= 2`

### 2. 颜色分配

```javascript
function nextColorIdx() {
  const used = selectedTyphoons.map(t => t.colorIdx);
  for (let i = 0; i < MAX_OVERLAY; i++) if (!used.includes(i)) return i;
  return 0;
}
```

### 3. 按台风图层管理（[L2763 附近](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2763)）

保留全局 `layers`（markers/link 仍共享），新增按台风图层组：

```javascript
// 为每个台风创建独立 layerGroup
function createTyphoonLayer(id) {
  const g = L.layerGroup().addTo(map);
  return g;
}
function removeTyphoonLayer(id) {
  const t = selectedTyphoons.find(x => x.id === id);
  if (t && t.layerGroup) { t.layerGroup.clearLayers(); map.removeLayer(t.layerGroup); }
}
```

`clearDynamicLayers()` 改为只清共享图层（markers/link），不清台风专属图层。台风图层由 `addTyphoon` / `removeTyphoon` 管理。

### 4. `renderMapForTyphoon(info, color, layerGroup)`（从 [L3344 `renderMap`](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L3344) 拆分）

将现有 `renderMap` 重构为接受 color + layerGroup 参数的版本：
- 路径线 `color` → 传入的 color
- 透明命中线 `color` → 传入的 color
- 观测点圆点 `fillColor` → 传入的 color
- 预测虚线 `color` → 传入的 color（浅化 30%）
- 所有 `.addTo(layers.track)` → `.addTo(layerGroup)`
- 城市标记 + 城市连线仅对第一个台风（`selectedTyphoons[0]`）渲染，仍用 `layers.markers` / `layers.link`

### 5. PC 复选框下拉组件（替换 [L2369 `<select id="tySelect">`](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2369)）

将 `<select id="tySelect">` 替换为自定义复选框下拉：

**DOM 结构**：
```html
<div class="ty-multisel" id="tyMultiSel">
  <div class="ty-ms-trigger" id="tyMsTrigger">
    <span class="ty-ms-placeholder">选择台风…</span>
    <!-- 选中的彩色标签动态插入 -->
    <span class="ty-ms-count"></span>
    <span class="ty-ms-arrow">▾</span>
  </div>
  <div class="ty-ms-panel" id="tyMsPanel" hidden>
    <!-- 搜索框（可选，缩小范围） -->
    <input class="ty-ms-filter" placeholder="筛选…" />
    <div class="ty-ms-list" id="tyMsList">
      <!-- 每行：<label><input type="checkbox"> 台风名</label> -->
    </div>
    <div class="ty-ms-footer">
      <button id="tyMsClear">清除全部</button>
      <span class="ty-ms-limit">最多 3 个</span>
    </div>
  </div>
</div>
```

**交互逻辑**：
- 点击 trigger → 展开 panel
- 勾选台风 → `addTyphoon(id)` → 渲染路径 + 更新标签
- 取消勾选 → `removeTyphoon(id)` → 移除路径 + 更新标签
- 已选 3 个时，未勾选项 disabled
- 选中标签显示对应颜色圆点 + 台风名 + ×
- 点标签 × → 取消选择
- 点外部 → 收起 panel

### 6. 手机端多选适配（[L2371 `.ty-search`](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L2371) 附近）

在搜索框下方新增已选台风标签条：

```html
<div class="ty-chips" id="tyChips" hidden>
  <!-- 彩色标签：<span class="ty-chip" style="--c:color">台风名 ×</span> -->
</div>
```

- 搜索结果列表中每行增加复选框（或点击切换选中/取消）
- 点击搜索结果项：若未选且 <3 → 加入；若已选 → 移除
- 标签条实时显示已选台风，点 × 移除
- 超过 3 个时提示"最多叠加 3 个"

### 7. `addTyphoon(id)` / `removeTyphoon(id)` 核心函数

```javascript
async function addTyphoon(id) {
  if (selectedTyphoons.find(t => t.id === id)) return; // 已存在
  if (selectedTyphoons.length >= MAX_OVERLAY) { showToast("最多叠加 " + MAX_OVERLAY + " 个台风"); return; }
  const colorIdx = nextColorIdx();
  const info = await fetchTyphoonInfo(id);  // 复用 [L3009]
  const layerGroup = L.layerGroup().addTo(map);
  selectedTyphoons.push({ id, color: OVERLAY_COLORS[colorIdx], colorIdx, info, layerGroup });
  selectedTyphoonId = selectedTyphoons[0].id;
  // 渲染路径
  const latest = info.points[info.points.length - 1];
  const forecastPts = pickChinaForecast(latest);
  renderMapForTyphoon(info.points, latest, forecastPts, OVERLAY_COLORS[colorIdx], layerGroup, selectedTyphoons.length === 1);
  if (state.fitMap) { fitMapToAll(); state.fitMap = false; }
  updateMultiUI();
  renderPanel();
}

function removeTyphoon(id) {
  const idx = selectedTyphoons.findIndex(t => t.id === id);
  if (idx < 0) return;
  removeTyphoonLayer(id);
  selectedTyphoons.splice(idx, 1);
  selectedTyphoonId = selectedTyphoons[0]?.id || null;
  updateMultiUI();
  renderPanel();
  if (selectedTyphoons.length === 0) { /* 显示提示 */ }
}
```

### 8. `fitMapToAll()` — 适配所有选中台风的路径范围

```javascript
function fitMapToAll() {
  const allLatLngs = [];
  selectedTyphoons.forEach(t => {
    (t.info.points || []).forEach(p => {
      const ll = safePathLL(p.lat, p.lng);
      if (ll) allLatLngs.push(ll);
    });
  });
  if (allLatLngs.length) map.fitBounds(L.latLngBounds(allLatLngs).padBounds(0.15));
}
```

### 9. 对比摘要表（`renderPanel()` 分支逻辑）

新增 `renderPanel()` 统一调度信息面板渲染：

```javascript
function renderPanel() {
  if (selectedTyphoons.length === 0) {
    // 显示"请选择台风"提示
    showEmptyHint();
  } else if (selectedTyphoons.length === 1) {
    // 单选：走原有 renderData 逻辑（距离/态势/生命周期/逐小时）
    renderData(selectedTyphoons[0].info, /* weather */ null);
  } else {
    // 多选：渲染对比摘要表，隐藏地市影响
    renderComparisonTable();
  }
  if (window.matchMedia("(max-width: 768px), (pointer: coarse)").matches) refreshSheetBody();
}
```

**对比表结构**（`renderComparisonTable()`）：

```html
<div class="ty-compare">
  <h3>台风对比研判</h3>
  <table class="compare-table">
    <thead>
      <tr><th></th><th>台风</th><th>登陆点</th><th>登陆风力</th><th>登陆级别</th><th>峰值强度</th></tr>
    </thead>
    <tbody>
      <!-- 每行一个台风 -->
      <tr>
        <td><span class="color-dot" style="background:COLOR"></span></td>
        <td>台风名（编号）</td>
        <td>福建莆田 / 未登陆</td>
        <td>35 m/s</td>
        <td>台风 12级</td>
        <td>超强台风 17级</td>
      </tr>
    </tbody>
  </table>
</div>
```

- 登陆信息：复用 `detectLandfall(points)` + `nearestCoastalName(lat,lng)`
- 登陆风力/级别：`landfall.point.speed` / `landfall.point.strong` / `landfall.point.power`
- 峰值强度：遍历 points 找 `speed` 最大点
- 未登陆时显示"未登陆"
- **隐藏**：cityTabs、distance、situation、heroLine、lifeStats、hourly、metaRow

### 10. `refreshSheetBody()` 适配（[L5063](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L5063)）

- 单选时：走原有克隆逻辑
- 多选时：克隆对比表到 mobileSheet，不克隆 cityTabs/distance/situation
- 无台风时：显示"请选择台风"

### 11. `load()` / `buildTyphoonSelect` 适配（[L4678](file:///d:/kzht/Documents/typhoon-fujian-tracker/index.html#L4678)）

- `load()` 获取列表后，填充复选框下拉列表（`buildMultiSelectList()`）
- 保留 `selectedTyphoonId` 作为第一个选中台风
- 初始化时默认选第一个台风（单选模式）
- 年份切换：清空所有已选台风，重新填充列表

### 12. CSS 样式

- `.ty-multisel`：替代 `.ty-row .ty-select`，宽度一致
- `.ty-ms-trigger`：外观同原 select（深色背景、圆角），内部 flex 排列标签
- `.ty-ms-panel`：absolute 定位下拉面板，max-height 350px 滚动
- `.ty-ms-list label`：hover 高亮，checkbox + 台风名
- `.ty-chip`：彩色小标签，圆点 + 名称 + ×
- `.ty-chips`：手机端标签条，flex-wrap
- `.compare-table`：紧凑表格，每行颜色标 + 数据
- `.color-dot`：12px 圆点

## Assumptions & Decisions

1. **保留 `selectedTyphoonId`**：不破坏现有单选逻辑，`selectedTyphoonId = selectedTyphoons[0]?.id`
2. **天气数据**：多选时不获取天气（`renderData` 的 weather 参数传 null），单选时保持原有天气获取
3. **风圈**：多选时仍渲染每个台风当前位置的风圈（各自颜色），但可能拥挤——如果体验差可改为仅最后一个台风显示风圈
4. **预测路径**：多选时每个台风都显示预测路径（各自颜色虚线），帮助研判走势
5. **自动刷新**：多选时仍支持自动刷新，但只刷新活跃台风（`isActive`）的路径
6. **搜索模式兼容**：跨年搜索选中台风后，加入多选列表，不清空已有选择
7. **PC `<select>` 完全替换**：不复用 `<select>` 元素，自建 div 组件以支持复选框 + 彩色标签
8. **手机端搜索列表**：改为可切换选中/取消的列表项，而非选一次就跳走

## Verification Steps

1. **PC 单选回归**：默认选 1 个台风，验证路径/风圈/详情面板与改动前一致
2. **PC 多选叠加**：勾选 2-3 个台风，验证 3 条路径不同颜色叠加，对比表正确显示
3. **PC 取消选择**：取消其中一个，验证对应路径消失，对比表更新
4. **PC 上限**：选满 3 个后，第 4 个 disabled/提示
5. **手机搜索多选**：搜索 → 点选 → 加入标签条 → 再搜索 → 点选第二个 → 路径叠加
6. **手机标签移除**：点标签 × → 路径消失
7. **对比表内容**：验证登陆点/风力/级别与 `detectLandfall` 结果一致
8. **地市隐藏**：多选时 cityTabs/distance/situation 自动隐藏
9. **地图自适应**：选 2 个台风后 `fitMapToAll` 缩放到包含两条路径
10. **年份切换**：切换年份后清空已选，重新填充列表
11. **PC 零回归**：所有原有功能（风圈开关、观测点开关、刷新、测距、底图切换）正常
12. **手机零回归**：▽/△ 切换、面板展开收起、自动滚动到地图等功能正常
