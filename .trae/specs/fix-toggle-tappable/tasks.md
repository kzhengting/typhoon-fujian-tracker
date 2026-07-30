# Tasks

- [x] Task 1: `#msToggle` CSS 块补 `pointer-events: auto`
  - 编辑 index.html L2154-2177 的 `#msToggle { ... }` 块
  - 在 `touch-action: manipulation;` 同区域加一行 `pointer-events: auto;`
  - 与 `#mobileChip`（L2064）、`#mobileSheet`（L2236）的写法对齐

- [x] Task 2: `#msToggle::before` 伪元素补 `pointer-events: auto`
  - 编辑 index.html L2180-2187 的 `#msToggle::before { ... }` 块
  - 加一行 `pointer-events: auto;`，确保 60×60 扩大触摸热区任意位置命中按钮
  - 防止伪元素吞掉触摸事件导致只有 44×44 中心区可点

- [x] Task 3: 静态回归核对
  - 确认 `#msToggle[hidden]` 规则（L2191）`display: none !important` 仍存在，hidden 时彻底隐藏
  - 确认 PC 媒体查询（L931-938）`@media (min-width: 769px) and (pointer: fine) { #msToggle { display: none !important } }` 仍存在
  - 确认 JS click 监听（L5095-5100）和 `toggleSheet` 函数（L4979+）未变动

- [x] Task 4: Puppeteer 移动端验证
  - 用 Puppeteer 模拟 iPhone 12 视口（390×844, hasTouch:true, 移动 UA）
  - 加载 index.html，断言 `#msToggle` 的 `getBoundingClientRect()` 非 0×0（按钮可见）
  - **关键断言**：调用 `page.click("#msToggle")` 后，`#mobileSheet` 不再 `hidden`，且 `.ms-body` 内有 `.ms-hint`（无台风提示）或克隆的 hero 内容
  - 验证 ▽ 文本切换为 △

- [x] Task 5: Puppeteer PC 零回归验证
  - 用 Puppeteer 默认 PC 视口（1280×800, `pointer: fine`）
  - 断言 `#msToggle` 的 `getBoundingClientRect()` 为 0×0（display:none 生效）
  - 断言 `page.click("#msToggle")` 不触发任何面板展开（无变化）

# Task Dependencies
- Task 1, 2 独立（CSS 改动，可并行）
- Task 3 依赖 Task 1, 2 完成（核对未破坏其它规则）
- Task 4, 5 依赖 Task 1-3 全部完成（验证修复 + 零回归）

# 验证结果（puppeteer-core + Edge headless, 2026-07-30）

## 移动端 (iPhone 12: 390×844, hasTouch)
```
matchMedia_mobile: true
msToggle_rect: {x:8, y:8, w:44, h:44}        ← 按钮可见，左上角
msToggle_display: "flex"
msToggle_pointerEvents: "auto"                ← ★ 核心修复
msToggle_before_pointerEvents: "auto"         ← ★ 伪元素修复
ui_pointerEvents: "none"                      ← 祖先问题确认
mobileSheet_hidden_before: true
# 点击后：
mobileSheet_hidden_after: false
mobileSheet_display_after: "flex"
msToggle_text_after: "△"
body_sheet_expanded: true
# 第二次点击后（等 400ms）：
mobileSheet_hidden: true
msToggle_text: "▽"
body_sheet_expanded: false
```

## PC 端 (1280×800, pointer:fine)
```
matchMedia_pc: true
msToggle_rect: {x:0, y:0, w:0, h:0}          ← 按钮隐藏
msToggle_display: "none"                       ← PC 媒体查询生效
msToggle_pointerEvents: "none"                 ← 无影响（display:none）
```
