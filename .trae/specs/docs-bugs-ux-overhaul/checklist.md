# Checklist

> 验证时逐项检查并勾选；任一失败则在 tasks.md 新增修复任务并重验。

## A. 说明文档
- [x] README「数据来源」含 NMC（含 JSONP 格式）、Open-Meteo（字段清单）、NASA GIBS、高德卫星叠加、typhoon-index.json、外链
- [x] README「技术栈」含 Leaflet 1.9.4 CDN、单文件架构、typhoon-index.json 依赖、build-typhoon-index.js 构建步骤
- [x] README 底图描述为二维切换（4 组合）+ 3 叠加层 + 瓦片 URL，且「一键切换」措辞已修正
- [x] README 含坐标系双源转换规则与距离计算未转换的局限说明
- [x] README 含拼音搜索、测距、全屏、移动端收起、Ctrl+滚轮、visibility 刷新、登陆大陆检测等功能

## B. Bug 修复
- [x] 同一台风点在 metaRow/heroLine/弹窗/逐小时表/生命周期/历史影响显示同一时刻（无 14:00 vs 22:00 矛盾）
- [x] 非北京时区浏览器下 NMC 时间仍显示正确北京时
- [x] `daily.time=[]` 时 renderImpact 不崩溃，显示降级提示
- [x] 历史路径缺失字段时统计栏/卡片显示「—」，无 `NaN`/`undefined`
- [x] 历史台风切回活动台风后风圈自动恢复显示、按钮恢复 on 态
- [x] 远海台风(>1000km)概要不出现「中心已到沿海附近」等矛盾固定文案
- [x] 快速切换台风/城市时 UI 始终与最新选择一致（无旧响应覆盖）
- [x] NMC 坐标系已实测判定，前端与 build-typhoon-index.js 假设一致，结论记入 README
- [x] 近期已消散台风（如海神 2026，带风圈数据）风圈按钮可启用；旧档案（如桑美 2006，无数据）才禁用（B7，E4 回归发现并修复）

## C. PC / 手机端布局
- [x] 视口 721–768px 下 CSS 布局与 JS 交互判定一致，地图可拖拽/缩放
- [x] 手机端 `.map-side`/`.map-zoom`/`.map-disclaimer` 互不重叠且在视口内可见
- [x] 弹窗位于 .hero 区域时完整可读、不被遮挡
- [x] viewport 已移除 `maximum-scale=1`，手机端可双指缩放页面
- [x] 手机端可点击元素触摸目标 ≥44px
- [x] 刘海屏/手势条设备上 `#panelToggle`/`.map-side` 不被遮挡（安全区生效）
- [x] 桌面短屏(≤800px 高)地图区域可见
- [x] 滚动到 .impact 详情区时免责声明不遮挡表格/时间线

## D. 布局优化与代码清理
- [x] `.ctrl-btn`/`.base-tab` 复用公共类，无重复样式块
- [x] `.leaflet-control-zoom` 死代码 CSS 已删除
- [x] 按钮/链接有 `:focus-visible` 焦点样式
- [x] `--ink-mute`/`--ink-dim` 文字对比度达 WCAG AA（≥4.5:1 正常文字 / ≥3:1 大文字）
- [x] 收起态(`body.ui-collapsed`)下 `.map-side` 仍可见可用
- [x] 低优先打磨项已处理（hero-line 截断、touch-action、超宽屏、smooth-scroll、click 监听合并）
- [x] `verify-out.json`、`verify-result.json` 已删除
- [x] `.gitignore` 无误粘的非模式行

## E. 浏览器实测验证
- [x] PC 视口截图：时间一致、弹窗可读、短屏地图可见、焦点样式存在
- [x] 手机视口(375×812)截图：控件不重叠/不溢出、缩放可用、触摸目标达标
- [x] 边界视口(768×1024)截图：断点切换正常
- [x] 切历史→活动台风：风圈恢复（桑美禁用→海神启用，windOn=true）
- [x] 统计栏无 NaN/undefined；快速切台风无竞态错乱（5 连切后 UI 与末次选择一致）
