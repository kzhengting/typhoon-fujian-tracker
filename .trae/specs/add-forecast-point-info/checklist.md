# Checklist

## `forecastPopup` 函数
- [x] `forecastPopup(p)` 函数已新增，位于 `pointPopup` 附近（L3276-3310）
- [x] popup 标题含「预报」橙色徽标，与观测点区分
- [x] 展示超前小时（`+${p.lead}h`）
- [x] 展示北京时间（`fmtTime24h(p.time)`）
- [x] 展示强度名称 + 等级（`p.strong` + `p.power`级）
- [x] 展示中心经纬度（`${p.lat}°N ${p.lng}°E`）
- [x] 展示气压（`${p.pressure} hPa`）和最大风力（`${p.speed} m/s`）
- [x] `speed ≥ 18` 时展示估算风圈行（7级/10级，标注"估算"）
- [x] `speed < 18` 时不展示风圈行

## 预测点可交互
- [x] 预测点 `interactive: true`（可点击）
- [x] 预测点半径从 3.5 增至 5
- [x] 每个预测点绑定 `.bindPopup(forecastPopup(p))`
- [x] 点击预测点时，`speed ≥ 18` 则调用 `showWindCircle` 展示估算风圈
- [x] 估算风圈为虚线样式（与历史台风一致，由 `drawWindCircles` 统一处理）

## 零回归
- [x] 观测点（历史路径点）popup 不受影响，仍正常显示（29 个 `.obs-pt` 验证通过）
- [x] 台风标记（当前位置）popup 不受影响
- [x] 风圈开关按钮不受影响
- [x] 预测路径虚线渲染不受影响（仅圆点变为可交互）
- [x] 历史台风（无预测数据）不报错、预测图层为空（`forecastPts.length <= 1` 时跳过）

## Puppeteer 验证
- [x] 活跃台风预测点渲染为 `interactive: true` 的 circleMarker（7 个 `.fc-pt`）
- [x] 点击预测点后 popup 可见，含"预报"文本
- [x] popup 含超前小时（+24h）、气压（915 hPa）、风速（62 m/s）等信息
- [x] popup 含估算风圈行（7级风圈（估算）566/368/566/368 km）
- [x] 观测点 popup 仍正常工作（29 个 `.obs-pt` 零回归）
- [x] 点击后风圈图层绘制（42 个 SVG path 含风圈多边形）
