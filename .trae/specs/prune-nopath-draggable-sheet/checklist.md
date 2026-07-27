# Checklist

## 删除无路径台风
- [x] `build-typhoon-index.js` 新增 `fjMin==null` 过滤逻辑（保留 fjMin===0）
- [x] `typhoon-index.json` 2267 → 2257
- [x] 10 个 2020 无路径台风（黄蜂/森拉克/海高斯/艾涛/艾莎尼/天鹅/沙德尔/莲花/灿鸿/鲸鱼）不再出现
- [x] `.cache-*.json` 清理 10 个陈旧 ID
- [x] 下拉框无「（无路径）」项（标签逻辑保留作兜底）

## 移除 #mcMenu 下拉菜单 + ui-collapsed 模型
- [x] `#mcMenu` 按钮 DOM 移除（rg 验证 0 结果）
- [x] `#mobileMenu` 下拉菜单 DOM 移除（rg 验证 0 结果）
- [x] `#mobileBackdrop` DOM 移除（rg 验证 0 结果）
- [x] `#mcMenu`/`#mobileMenu`/`#mobileBackdrop` CSS 移除
- [x] `openMobileMenu`/`closeMobileMenu` 函数 + 事件监听移除
- [x] `body.ui-collapsed` 不再驱动信息层显隐（JS 无切换，CSS 死规则无害保留）
- [x] `syncMobilePanel` 移除 `ui-collapsed` 逻辑

## 可拖拽底部抽屉（3 档吸附）
- [x] `#mobileSheet` 三档：snap-hidden(100%)/snap-half(50%)/snap-full(8%)
- [x] handle 拖动手势（touchstart/move/end）+ 阈值吸附（代码实现，touch 需真机验证）
- [x] 点按 handle 循环切换（half→full→hidden 已验证）
- [x] header 摘要（福州/589km/影响高峰时段）半屏可见
- [x] header 工具行（风圈/点位/框选/刷新/全屏）5 按钮存在
- [x] body 信息板块克隆（refreshSheetBody，PC early-return，手机端克隆）
- [x] 默认台风加载后抽屉半屏（wasFitMap 标志，matchMedia 门控）
- [x] 点按 `#mobileChip` 打开抽屉到半屏
- [x] 触摸目标 ≥ 36px（ms-btn min-height:36px）

## 联动清理
- [x] `syncMobilePanel` 仅保留 `invalidateSize` + `updateMobileChip`
- [x] map click 不再切换面板
- [x] `scrollCue` 改为打开抽屉全屏 + 滚动到板块
- [x] `showWindCircle` 手机端自动隐藏抽屉（setSnap("hidden")）

## 验证与回归
- [x] PC 端：信息层与地图并排，抽屉/chip/menu 不可见，路径/风圈/交互正常
- [x] PC 端：2020 年下拉框无 10 个无路径台风（14 个剩余）
- [x] 手机端 sheet：snap-half 渲染正确（translateY 50%）
- [x] 手机端：点按 handle 循环切换 half→full→hidden（hidden 属性生效）
- [x] 手机端：工具行 5 按钮存在（msWind/msObs/msFit/msRefresh/msFs）
- [x] 手机端：摘要数据填充（城市/距离/相位）
- [x] 索引 2257，无路径台风已剔除
- [ ] 手机端 touch 拖拽手势（需真机/移动端视口验证，代码已实现）
- [ ] 手机端默认半屏 + 点击路径点隐藏抽屉显示风圈（matchMedia 门控，需移动端视口验证）
