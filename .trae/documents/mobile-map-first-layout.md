# 移动端 Map-First 交互改造

## Context

**问题**：当前手机端 `.ui` 网格 `grid-template-rows: auto auto auto 1fr auto auto`（header / city-tabs / hero / map-gap / footer / scroll-cue），hero 详情块（distance/heroLine/situationBox 等，约 220px）和 footer（stats + toolbar，约 180px）占据大量视口，导致 `1fr` map-gap 被压缩到很小，用户选完台风后看到的是 hero 表单而非地图。必须手动下滑才能看到路径。且 hero 详情在"页面流 + mobileSheet 克隆"双份重复。

**目标**：选完台风后默认看地图（路径 + 风圈），点左上角 ▽ 展开信息面板看详情。原生 App 体感，无重复。

**方案**：Map-First 布局——移动端隐藏 hero 详情块 + footer + scroll-cue（仅保留 ty-row + ty-search + errorBanner），`1fr` map-gap 撑满视口。隐藏的内容由 `refreshSheetBody()` 克隆进 mobileSheet，通过 ▽ 展开。

## 改动清单（单文件 index.html）

### 1. CSS：隐藏 hero 详情 + footer + scroll-cue（@media max-width:768px 内）

在 `.stage` 规则后（约 L1778）新增：

```css
/* Map-first：hero 详情块只保留在抽屉，页面流仅留选择条 */
.hero .ty-ident,
.hero .hero-label,
.hero .distance,
.hero .hero-line,
.hero .situation,
.hero .next-strip,
.hero .meta-row { display: none; }

/* footer 统计/工具栏 + scroll-cue 收进抽屉，让 map-gap 占满视口 */
.ui > footer,
.ui > .scroll-cue { display: none; }
```

保留：`.ty-row`（yearSel + tySelect）、`.ty-search`（搜索 + 筛选）、`#errorBanner`。

### 2. CSS：抽屉内克隆块排版（@media max-width:768px 内）

```css
#mobileSheet .ms-body .stats {
  margin: 0.6rem 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(8, 24, 34, 0.55);
}
#mobileSheet .ms-body .toolbar-actions { margin: 0.6rem 0 0.2rem; }
```

### 3. JS：`refreshSheetBody()` 扩充克隆内容（L4928-4971）

**A. hero picks 增加 `.ty-ident`**：
```js
const picks = [".ty-ident", ".distance", "#heroLine", "#situationBox", "#nextStrip", "#metaRow"];
```

**B. hero 克隆后、lifeBlock/hourly 前，插入 footer 的 stats + toolbar-actions 克隆**：

```js
// 统计四宫格（强度/气压/风速/移向）——纯展示，去 id 防重复
const stats = document.querySelector("footer .stats");
if (stats) {
  const sClone = stats.cloneNode(true);
  sClone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  body.appendChild(sClone);
}
// 工具栏按钮（风圈/点位/刷新/框选）——克隆后按 id 回绑原按钮
const footerActions = document.querySelector("footer .toolbar-actions");
if (footerActions) {
  const faClone = footerActions.cloneNode(true);
  faClone.querySelectorAll("button").forEach((btn) => {
    const orig = btn.id ? document.getElementById(btn.id) : null;
    btn.removeAttribute("id");
    if (!orig) return;
    btn.addEventListener("click", () => {
      orig.click();
      if (orig.id === "fitBtn" || orig.id === "refreshBtn") {
        setTimeout(() => toggleSheet(false), 120); // 框选/刷新 → 收起看地图
      } else {
        setTimeout(() => refreshSheetBody(), 120); // 风圈/点位 → 刷新 .on 态
      }
    });
  });
  const ua = faClone.querySelector("#updatedAt");
  if (ua) ua.removeAttribute("id");
  body.appendChild(faClone);
}
```

克隆顺序：cityTabs → ty-ident → distance → heroLine → situationBox → nextStrip → metaRow → **stats** → **toolbar-actions** → lifeBlock → hourly。

### 4. JS：`renderMap()` fitBounds 移动端预留边距（L3370-3373）

```js
const fitOpts = isMob
  ? { paddingTopLeft: [20, 230], paddingBottomRight: [20, 150], animate: true, duration: 0.8 }
  : { animate: true, duration: 0.8 };
```

- 顶部 230px ≈ header(60) + city-tabs(40) + 紧凑 hero(110) + 安全区(20)
- 底部 150px ≈ mobileChip(60) + 安全区 + 呼吸空间

## 不改动的部分

- `renderTyphoon()` / `load()`：无需自动滚动，map-first 后地图本就在首屏
- `updateMobileChip()` / `toggleSheet()` / `syncMobilePanel()`：与新布局兼容
- `.impact` section（#hourly / #lifeBlock）：保留在页面流，是详情落地页，与抽屉克隆职责不同
- PC 端：所有 CSS 在 `@media max-width:768px`，JS 用 `matchMedia` / `isMob` 守卫，`@media min-width:769px` 仍隐藏 mobile 元素

## 交互流程

1. **选台风**：顶部 ty-row(yearSel + tySelect) 或 ty-search → 选完 → 地图首屏可见路径+风圈
2. **看详情**：点左上角 ▽ 或点底部 mobileChip → mobileSheet 展开 → cityTabs/ty-ident/distance/situation/stats/toolbar/life/hourly
3. **切地市**：抽屉内 cityTabs 点击（已重绑 L4941-4946）
4. **风圈/点位**：抽屉内 toolbar 克隆按钮，或 mobileChip 的 mcWind
5. **框选/刷新**：抽屉内按钮 → 收起抽屉看地图
6. **看长表**：页面下滑到 .impact section（hourly + lifeBlock 完整版）

## 验证

- Puppeteer 移动端（390×844）：hero 详情/footer/scroll-cue 隐藏，map-gap 占满视口
- 抽屉展开：stats + toolbar 克隆存在，按钮点击回绑原按钮（orig.click）
- fitBounds：路径落在选择条下方、mobileChip 上方可见区
- PC（1280×800）：hero/footer/scroll-cue 正常显示，mobileChip/sheet/toggle 隐藏
- 真机：iPhone（刘海/Home Indicator）、华为窄屏（375 宽）、横屏
