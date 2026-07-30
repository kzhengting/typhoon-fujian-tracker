# Checklist

## `#msToggle` 可接收指针事件
- [x] `#msToggle` CSS 块（L2154-2177）含 `pointer-events: auto;` 显式声明
- [x] `#msToggle::before` 伪元素（L2180-2187）含 `pointer-events: auto;`
- [x] 写法与 `#mobileChip`（L2064）、`#mobileSheet`（L2236）、`.map-zoom`（L817）、`.map-side`（L860）一致

## 修复正确性
- [x] Puppeteer 模拟移动端：`#msToggle` 渲染为 44×44 非 0 元素（rect {x:8, y:8, w:44, h:44}）
- [x] Puppeteer 模拟移动端：`page.click("#msToggle")` 触发 `#mobileSheet` 展开（hidden=false, display=flex）
- [x] Puppeteer 模拟移动端：点击后按钮文本从 ▽ 切换为 △
- [x] Puppeteer 模拟移动端：再点击 △ 后面板收起（hidden=true, text=▽, body.sheet-expanded=false）
- [x] Puppeteer 模拟移动端：`#msToggle` computed `pointer-events` 为 `auto`（核心修复证据）
- [x] Puppeteer 模拟移动端：`#msToggle::before` computed `pointer-events` 为 `auto`
- [x] Puppeteer 模拟移动端：`.ui` 祖先 computed `pointer-events` 仍为 `none`（根因确认）

## hidden 与 PC 零回归
- [x] `#msToggle[hidden] { display: none !important }`（L2191）规则保留
- [x] PC 媒体查询 `@media (min-width: 769px) and (pointer: fine)`（L931）保留
- [x] Puppeteer 模拟 PC：`#msToggle` 的 `getBoundingClientRect()` 为 0×0
- [x] Puppeteer 模拟 PC：`#msToggle` computed `display` 为 `none`
- [x] PC 端 `.ui > header` / `city-tabs` / `hero .ty-row` / `footer .toolbar-actions` 等仍可点击（`pointer-events: auto` 规则未受影响）

## JS 未变动
- [x] L5095-5100 的 `msToggle.addEventListener("click", ...)` 未改动
- [x] L4979 的 `toggleSheet(expand)` 函数未改动
- [x] L3607-3632 的 `updateMobileChip()` 中 `mt.hidden = false` 仍存在
