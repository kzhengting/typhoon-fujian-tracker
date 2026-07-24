# 计划：规范「影响高峰时段」栏文字表述（活动/历史台风区分）

## 摘要

用户提出两点：
1. **根据台风影响、是否历史等信息，规范「影响高峰时段」栏的文字表述** —— 即态势框（`situationBox`）的相位标签与描述文字应区分「活动台风（实时）」与「历史台风（回顾）」，避免对已停编台风仍显示"影响高峰时段/影响减弱中"等实时语气。
2. **历史影响部分增加当时的降雨、短时极大风速** —— 经核实 NMC 公开台风 API **仅有中心最大风速（2分钟平均, p[7] m/s）与中心气压**，**无极大风速(阵风)、无降雨、无登陆点标注**；用户明确「没有实际数据就不要了」，故**本项放弃，不引入 ERA5/估算值**。历史影响卡片现有的「当时强度(等级) / 中心气压」已是 NMC 可提供的全部强度字段。

本计划聚焦第 1 点。

## 背景（已完成、待提交）

工作区已有上一轮「NMC 坐标系(WGS-84) + 登陆福建海岸线检测」的未提交改动（index.html / build-typhoon-index.js / typhoon-index.json / README.md）。其中 index.html L2310 说明文字仍残留「（坐标纠偏后）」失实文案——NMC 既为 WGS-84，`detectLandfall` 不再做任何纠偏。该文案属"文字表述规范"范畴，并入本计划一并修正，最后统一提交。

---

## 一、现状分析

### 1.1 态势框结构（index.html）

- HTML：L2173-2176 `#situationBox` > `#situationPhase`（相位标签）+ `#situationText`（描述）。
- 逻辑：`renderSituation(latest, forecastPts, distance, weather)`（L3196-3280）。
- 调用点：`renderData` L3631 **对活动与历史台风均调用**（在 `if(active)` 分支之前）。

### 1.2 现有相位标签（仅适合实时活动台风）

`renderSituation` 按 `distance`（latest→城市）与 `closest`（预报最近点）计算 `phase`：
- `远海监视`（≥800km）/ `正在逼近{城市}`（<800km）/ `影响高峰临近`（<400km 或 closest<350km）
- 再按 `latestTime vs closestTime` 覆盖为 `影响高峰时段` / `影响减弱中`

### 1.3 问题：历史台风显示实时语气

历史台风 `forecastPts` 为空、`latest` 为停编末点（往往远离福建）：
- `latestTime > closestTime`（停编晚于最近经过）→ 命中 `影响减弱中`（L3241）或 `影响高峰时段`（L3237）。
- 例：巴威(2026,已停编) 末点远在北方，却显示"影响减弱中"；桑美(2006) 同理。语义错误——应回顾式表述。
- L3247-3257 还会追加"今天阵风/降水"（取自当前预报 weather），对历史台风无意义。

### 1.4 可用的历史数据（仅 NMC 真实数据）

- `info.points`：每点含 `time / lat / lng / strong / power / speed(m/s) / pressure / moveDir / moveSpeed`。
- `histImpactLevel(km)`（L4073）：`<100 严重影响 / <200 明显影响 / <350 外围影响 / 否则 影响较小`。
- 停编时间 = 末点 `latest.time`；最近经过 = 全程距 selectedCity 最小的点。

---

## 二、修改方案

### 步骤 1：`renderSituation` 增加 `active` 参数 + 历史回顾分支

**签名**：`renderSituation(latest, forecastPts, distance, weather, active, info)`
- 调用点 L3631 改为 `renderSituation(latest, forecastPts, distance, weather, active, info);`

**历史分支（`!active` 时，置于函数开头，跳过实时相位逻辑与 weather 追加）**：
```js
if (!active && info && info.points && info.points.length) {
  const pts = info.points.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  // 全程距当前选中城市最近的点
  let best = null;
  pts.forEach(p => {
    const d = haversineKm(p, selectedCity);
    if (!best || d < best.d) best = { d, p };
  });
  const lv = histImpactLevel(best ? best.d : Infinity);
  const phaseMap = { high: "曾严重影响", mid: "曾明显影响", low: best && best.d < 350 ? "曾有外围影响" : "影响较小" };
  const tone = lv.key === "high" ? "alert" : lv.key === "mid" ? "warn" : "calm";
  const bp = best ? best.p : null;
  const phase = phaseMap[lv.key] || "历史影响回顾";
  const text =
    `「${currentTyName}」已于 ${fmtPointTime(latest.time)} 停编（历史档案）。` +
    (bp
      ? `${fmtPointTime(bp.time)} 最近经过${selectedCity.name}附近，约 <strong>${formatNum(best.d)} km</strong>，` +
        `当时 <strong>${bp.strong}${bp.power && bp.power !== "—" ? " · " + bp.power + "级" : ""}</strong>` +
        (bp.pressure ? `、<strong>${bp.pressure} hPa</strong>` : "") + `。`
      : `路径数据不足，无法定位最近经过点。`) +
    `下方为福建各地市历史影响回顾（基于最佳路径推算，非实况观测）。`;
  el.situationBox.className = "situation" + (tone === "alert" ? " alert" : tone === "warn" ? "" : " calm");
  el.situationPhase.textContent = phase;
  el.situationText.innerHTML = text;
  el.nextStrip.hidden = true;
  el.nextStrip.innerHTML = "";
  return;
}
```

要点：
- 相位标签由影响等级驱动（`曾严重影响/曾明显影响/曾有外围影响/影响较小`），呼应"根据台风影响"。
- 全程回顾式语气、过去时；不再追加"今天阵风/降水"。
- 复用 `histImpactLevel` 与 `fmtPointTime`，仅用 NMC 真实字段（距离/时刻/强度/气压）。
- 直接 `return`，跳过下方实时相位逻辑与 weather 追加。

**活动分支**：保留现有 L3209-3257 实时逻辑不变（已按 distance 分级，属"根据台风影响"规范）。仅在 weather 追加前补一道 `if (active && weather ...)` 守卫（原代码即在此路径，历史分支已 return，无需改动）。

### 步骤 2：修正 L2310 失实文案「（坐标纠偏后）」

L2310 `...海岸线交叉检测算法推导（坐标纠偏后），非官方登陆记录...` → 删去「（坐标纠偏后）」四字（NMC=WGS-84，detectLandfall 不做纠偏）。一处字符串替换。

### 步骤 3：验证（puppeteer + 本地 serve.js:8080）

1. 加载历史台风**桑美(2006, id 2955398)**：态势框应显示「曾严重影响」+ 回顾式文案（2006年8月10日 最近经过宁德附近约74km，超强台风·16级、915hPa），无"今天阵风/降水"。
2. 加载**巴威(2026, id 3257931, 已停编)**：态势框显示「曾有外围影响」（fjMin≈230km，按选中城市最近点定级），回顾式语气，不再显示"影响减弱中"。
3. 加载一个**活动台风**（若当前有 status=start）：态势框相位标签与文案保持原实时逻辑（远海监视/影响高峰临近/影响高峰时段/影响减弱中），回归无回归。
4. 切换选中城市，态势框最近经过距离/时刻随之重算。
5. 截图归档。

### 步骤 4：提交并推送（含上一轮坐标/登陆改动）

```bash
git add index.html scripts/build-typhoon-index.js typhoon-index.json README.md \
        .trae/documents/typhoon-coord-landfall-verify.md scripts/.cache-landfj.json
git commit -m "feat: 历史台风态势框改回顾式表述 + NMC坐标采信WGS-84并海岸线检测判定登陆福建"
git push
```

### 步骤 5：停止后台 serve.js（8080）

提交推送后用 `StopCommand` 停止后台服务。

---

## 三、假设与决策

1. **降雨/极大风速不引入**：NMC 公开 API 无此数据；用户拒绝 ERA5/估算。历史卡片保持现有「当时强度/中心气压」。
2. **历史判定**：以 `active`（status==="start"）为准；当年已停编台风（如巴威）也走回顾分支——语义正确。
3. **影响分级**：复用 `histImpactLevel` 的 100/200/350km 阈值，相位标签与之对齐。
4. **最近经过点**：按"全程距 selectedCity 最小的路径点"取（与 renderHistoricalImpact 各市卡口径一致）。
5. **活动台风文案不改**：现有实时相位已按 distance 分级、属规范范围；仅补历史分支。
6. **L2310 文案**：删「（坐标纠偏后）」，归入"规范文字表述"。
7. **提交合并**：上一轮坐标/登陆改动与本轮文案改动同工作区，一并提交。

## 四、影响范围

| 文件 | 改动 |
|------|------|
| `index.html` | `renderSituation` 增参 `active,info` + 历史回顾分支（~25 行）；L3631 调用点增参；L2310 删「（坐标纠偏后）」 |
| 其余文件 | 无（上一轮改动已就绪，仅随提交） |

仅前端单文件改动 + 一处文案，不涉及数据源/构建脚本/索引重建。
