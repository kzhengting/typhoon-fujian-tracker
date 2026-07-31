# 预测路径点信息展示 Spec

## Why
NMC API 对每个预测路径点已返回丰富数据（预报时刻、超前小时、经纬度、气压、风速、强度等级），`parseForecastPoint()` 也已全部解析。但渲染时预测点设为 `interactive: false`（L3399）——不可点击、无 popup，用户点击预测路径上的点看不到任何信息。用户反馈"对预测路径上的点，能否有相关信息"。

## What Changes
- **预测点可交互**：`interactive: false` → `true`，半径从 3.5 略增至 5（与观测点一致，提高触摸命中率）
- **预测点 popup**：新增 `forecastPopup(p)` 函数，展示：预报标识 + 超前小时 + 时刻 + 强度 + 中心坐标 + 气压 + 最大风力
- **预测点风圈估算**：点击预测点时，若 `speed ≥ 18 m/s`，调用 `estimateWindCircles(p)` 估算风圈并绘制（虚线 + "（估算）"标注，与历史台风一致）
- **视觉区分**：预测点 popup 标题加"预报"徽标，与观测点（实况）区分

## Impact
- Affected code: `index.html` — `renderMap()` 中预测点渲染逻辑（L3390-3401）、新增 `forecastPopup()` 函数
- Affected data: `parseForecastPoint()` 产出的对象已有全部字段（`lead`/`time`/`lat`/`lng`/`pressure`/`speed`/`strong`/`power`），无需改动解析逻辑
- 不影响观测点、台风标记、风圈开关等现有功能

## NMC API 预测点数据结构（实测 view_3279904）
```
f[0] = lead（超前小时，如 12）
f[1] = time（YYYYMMDDHHMM，UTC，需 nmcTime 转北京时）
f[2] = lng（经度）
f[3] = lat（纬度）
f[4] = pressure（hPa）
f[5] = speed（m/s）
f[6] = "BABJ"（预报中心=北京）
f[7] = level（强度代码，如 "SuperTY"）
f[8] = undefined（无移向）
f[9] = undefined（无移速）
f[10] = undefined（无风圈观测——需估算）
```

## ADDED Requirements

### Requirement: 预测路径点可点击查看信息
系统 SHALL 将预测路径点渲染为可交互标记（`interactive: true`），点击后弹出 popup 展示该预报点的相关信息。

#### Scenario: 点击预测点查看预报信息
- **WHEN** 用户点击预测路径（橙色虚线）上的某个圆点
- **THEN** 弹出 popup 显示：「预报」徽标 + 超前 N 小时 + 预报时刻（北京时间）+ 强度名称 + 中心经纬度 + 气压 + 最大风力

#### Scenario: 预测点风圈估算展示
- **WHEN** 用户点击预测点，且该点 `speed ≥ 18 m/s`
- **THEN** 以该点位置为圆心绘制估算风圈（虚线 + "（估算）"标注），与历史台风风圈估算视觉一致
- **AND** popup 中展示 7 级 / 10 级风圈估算半径（NE/SE/SW/NW 四象限）

#### Scenario: 弱预测点不估算风圈
- **WHEN** 预测点 `speed < 18 m/s`（热带低压/弱热带风暴）
- **THEN** 不绘制风圈（`estimateWindCircles` 返回 null），popup 不展示风圈行

#### Scenario: 预测点与观测点视觉区分
- **WHEN** popup 弹出
- **THEN** 标题行含「预报」徽标（橙色），与观测点 popup（无徽标或「实况」标识）区分

#### Scenario: 历史台风无预测点
- **WHEN** 加载历史台风（无 `p[11].BABJ` 预测数据）
- **THEN** 预测图层为空，无预测点可点击，不影响观测点交互

## MODIFIED Requirements

### Requirement: 预测路径渲染
现有：预测路径以橙色虚线 + `interactive: false` 圆点渲染（L3379-3401），不可交互。

修改为：预测路径以橙色虚线 + `interactive: true` 圆点渲染（半径 5），每个圆点 `bindPopup(forecastPopup(p))`，点击圆点时同时调用 `showWindCircle(估算结果, 圆点坐标)` 展示估算风圈。
