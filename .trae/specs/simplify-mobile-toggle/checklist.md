# Checklist

## 移除 3 档抽屉 + 工具行
- [x] `#msHandle`、`#msHead`（含 ms-summary + ms-tools 5 按钮）DOM 移除
- [x] `snap-hidden/snap-half/snap-full` CSS 规则移除
- [x] `.ms-handle/.ms-head/.ms-tools/.ms-btn/.dragging` CSS 移除
- [x] `setSnap()/SNAP_ORDER/currentSnap` JS 移除
- [x] touch 手势（touchstart/move/end）+ `isInHeader/isBtn` JS 移除
- [x] `msFit/msFs/msObs/msRefresh/msWind` 事件绑定移除

## 底部下箭头 tab 双态
- [x] `#msToggle` 按钮 DOM 新增（底部正中，▽ 图标）
- [x] `#msToggle` 触摸区 ≥ 44px（padding 扩展）
- [x] `#mobileSheet` 双态 CSS：默认 translateY(100%)，`.expanded` translateY(0)
- [x] `#msToggle` click 切换 `.expanded` + 图标 ▽/△ + `map.invalidateSize()`
- [x] 地图 click 收起面板（expanded 时）
- [x] 默认收起（不自动展开）

## mobileChip 全屏按钮
- [x] `#mcFs` 全屏按钮 DOM 新增（mc-actions 内，风圈旁）
- [x] `#mcFs` 样式与 `#mcWind` 一致
- [x] `#mcFs` click → `el.fsBtn.click()` + 收起面板

## 信息面板内容
- [x] `refreshSheetBody()` 展开 clone hero 源到 `#msBody`
- [x] clone 含 cityTabs/distance/heroLine/situationBox/lifeBlock/hourly
- [x] clone 后 cityTabs 点击可切换监测城市
- [x] 面板顶部摘要可见（城市·距离·相位）

## 验证与回归
- [x] Puppeteer 移动端（390×844）：▽ tab 点按展开/收起，图标 ▽/△ 切换
- [x] 移动端：展开面板可见 cityTabs + lifeBlock + hourly（8 子元素）
- [x] 移动端：面板内地市 tabs 可切换城市
- [x] 移动端：点地图空白收起面板
- [x] 移动端：mcWind 风圈开关正常切换
- [x] 移动端：mcFs 全屏按钮收起面板 + 浏览器全屏
- [x] 移动端：默认收起，地图全屏 + 路径 + 风圈可见
- [x] PC 端零回归：mobileSheet display:none；msToggle/mobileChip hidden=true；hero/cityTabs/map 正常
