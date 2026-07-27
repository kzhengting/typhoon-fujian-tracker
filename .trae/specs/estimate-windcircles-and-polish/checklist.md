# Checklist

## 历史台风风圈估算
- [x] `estimateWindCircles` 函数实现：Vmax ≥ 18 m/s 时按 `r7_max=8×Vmax+70`、`r10_max=4×Vmax+10` 估算四象限半径（NE/SW=max，SE/NW=0.65×max），Vmax < 18 返回 null
- [x] `parsePoint` 新增 `estimatedWindCircles` 字段
- [x] `drawWindCircles` 估算风圈使用虚线（`dashArray: "6 4"`），观测风圈维持实线
- [x] `showWindCircle` 判定条件包含 `estimatedWindCircles`
- [x] `pointPopup` 估算风圈标签追加「（估算）」字样
- [x] 自动显示最新点风圈、`hasWind` 判定、peak 风圈计算均兼容估算风圈
- [x] 历史台风风圈开关按钮不再禁用（有估算数据可显示）
- [x] 当年台风（2026）零回归：使用观测风圈，实线，无「估算」标注

## 台风列表空白/重复清理
- [x] `buildTyphoonSelect` 对 `name`/`enName` 均空显示「未命名」
- [x] `buildTyphoonSelect` 对 `no=0` 无名热带低压显示「热带低压」
- [x] `buildTyphoonSelect` 对 `fjMin=null` 无路径台风追加「（无路径）」标签
- [x] 下拉框无空白 `<option>` 项
- [x] `dedupNamelessTyphoons` 路径指纹去重，仅对 `!name && !enName` 无名条目生效（`isValidNamelessPath` 原样保留）
- [x] `typhoon-index.json` 删除 4 对重复无名台风（1975#6、1970#4、1961#16、1986#13 各保留 1 条）
- [x] 索引条目数 2271 → 2267
- [x] `.cache-details.json` / `.cache-fjmin.json` / `.cache-landfj.json` 同步清理 4 个陈旧 ID

## 手机端下拉菜单交互
- [x] `#panelToggle` 按钮及其 CSS 完全移除
- [x] `#mobileChip` 新增「⋯」菜单触发按钮 `#mcMenu`
- [x] `#mcExpand` 展开按钮移除（功能并入菜单）
- [x] 新增底部抽屉 `#mobileSheet` 与下拉菜单 `#mobileMenu` DOM
- [x] `syncMobilePanel` 移除 `panelToggle.textContent` 逻辑，保留地图同步
- [x] 地图点击移除 `panelToggle` 联动（不再切换 ui-collapsed，避免误触）
- [x] 「⋯」菜单点击展开下拉项
- [x] 「查看时间线/生命史/逐小时」打开底部抽屉（克隆内容，不动原 DOM）
- [x] 抽屉顶部「关闭」按钮可收起
- [x] 「风圈开关/点位开关/框选路径/立即刷新/全屏」直接执行操作
- [x] 默认态：全屏地图 + 浮动数据条，无收起按钮可见（mobileChip 两态均可见）
- [x] 触摸目标 ≥ 44px（`.mm-item { min-height: 44px }`）

## 验证与回归
- [x] PC 端历史台风（山竹2018）点击路径点显示虚线估算风圈 + 「（估算）」标注
- [x] PC 端当年台风（巴威2026）显示实线观测风圈，无标注，行为不变
- [x] PC 端台风列表无空白项，「未命名」标签正确（2018 年 34 项 0 空白 5 个「未命名」）
- [x] 索引条目数正确（2267）
- [x] 手机端无 `#panelToggle` 按钮
- [x] 手机端「⋯」菜单可展开，菜单项可点击
- [x] 手机端底部抽屉可打开（「路径时间线」标题 + 克隆内容）与关闭
- [x] 手机端历史台风风圈开关不再禁用（mcWind.disabled=false）
- [x] PC 端零回归：mobileChip/menu/sheet/backdrop 均 display:none，布局/路径/风圈/交互正常
