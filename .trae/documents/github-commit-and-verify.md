# 提交 GitHub 并核对更新完整性

## 摘要

将本次会话完成的三大功能（历史台风风圈估算、删除无路径台风、移动端可拖拽抽屉）及审计修正提交到 GitHub `origin/main`，并在提交前核对所有改动是否全部到位。

## 当前状态分析

### 已验证到位的功能（Phase 1 探索结论）

| 功能 | 验证位置 | 状态 |
|---|---|---|
| 风圈估算 `estimateWindCircles` | index.html:2879 | ✅ |
| 估算风圈虚线样式 `wind-ring-est` | index.html:3155 | ✅ |
| 无路径台风过滤 `fjMin != null` | build-typhoon-index.js | ✅ |
| 索引条目数 2257 | typhoon-index.json | ✅（确认 count:2257） |
| 可拖拽抽屉 `mobileSheet` + snap 三档 | index.html:928, 2112-2209, 2359 | ✅ |
| `setSnap` 函数 | index.html:4944 | ✅ |
| 触摸手势 touchstart/move/end | index.html:5006-5022 | ✅ |
| 旧的 `panelToggle`/`mcMenu`/`mobileMenu`/`mobileBackdrop` | 已移除（仅余 `_blockPanelToggle` 标志位，无害） | ✅ |

### Git 工作区现状

**已修改文件（7 个，需提交）：**
- `README.md`（行尾规范化，LF→CRLF）
- `index.html`（风圈估算 + 抽屉重构，主改动）
- `scripts/audit-landfall.js`
- `scripts/build-typhoon-index.js`（无路径过滤）
- `scripts/landfall-audit-report.json`
- `scripts/landfall-audit-report.md`
- `typhoon-index.json`（2267→2257）

**新增规范文档（需提交）：**
- `.trae/specs/estimate-windcircles-and-polish/`（spec/tasks/checklist）
- `.trae/specs/prune-nopath-draggable-sheet/`（spec/tasks/checklist）

**应排除的临时/备份文件（不提交）：**
- `scripts/.cache-details.json.bak`（备份）
- `typhoon-index.json.bak`（备份）
- `scripts/_check_wc_fields.js`（一次性诊断）
- `scripts/_clean_index.js`（一次性清理）
- `scripts/_diagnose_garbage.js`（一次性诊断）
- `scripts/_fix_cache.js`（一次性修复）
- `scripts/_garbage-ids.json`（一次性数据）
- `scripts/_test_nmc.js`（一次性测试）
- `scripts/_timecheck.js`（一次性测试）

注：`scripts/.cache-*.json` 已被 `scripts/.gitignore` 忽略；`scripts/_serve.js` 已被跟踪。

### 远程仓库

- `origin`: https://github.com/kzhengting/typhoon-fujian-tracker
- 当前分支：`main`（与 `origin/main` 同步，无本地领先提交）
- 最近提交：`ae5f6b2 修正登陆检测多边形并完成全量审计`

## 提交计划

### Step 1: 更新 `.gitignore` 排除临时文件

在根 `.gitignore` 追加规则，避免诊断脚本和备份文件被误提交：

```
# 一次性诊断/修复脚本（下划线前缀）
scripts/_*.js
scripts/_*.json

# 备份文件
*.bak
```

### Step 2: 暂存真实改动（按文件名精确添加，不用 `git add .`）

```bash
git add .gitignore
git add README.md index.html typhoon-index.json
git add scripts/audit-landfall.js scripts/build-typhoon-index.js
git add scripts/landfall-audit-report.json scripts/landfall-audit-report.md
git add .trae/specs/estimate-windcircles-and-polish/
git add .trae/specs/prune-nopath-draggable-sheet/
```

### Step 3: 核对暂存区

```bash
git status           # 确认 9 项 staged，无 .bak/_*.js 误入
git diff --cached --stat
```

### Step 4: 提交

提交信息（涵盖三大功能 + 审计修正，遵循仓库现有中文提交风格）：

```
历史台风风圈估算、清理无路径台风、移动端可拖拽抽屉

- 历史台风风圈：NMC 对 2026 年前台风不返回 p[10] 风圈数据，
  新增 estimateWindCircles 按 r7=8×Vmax+70、r10=4×Vmax+10 估算，
  虚线渲染 + wind-ring-est 类 + 「（估算）」弹窗标注；当年台风
  零回归，仍用观测实线风圈
- 台风列表清理：剔除 10 个 fjMin=null 无路径台风（2020 黄蜂/
  森拉克/海高斯等），索引 2267→2257；台风列表空白/未命名/无路径
  标签规范化
- 移动端交互：移除 #panelToggle 收起按钮与 #mcMenu 下拉菜单，
  重构 #mobileSheet 为可拖拽 3 档吸附抽屉（隐藏/半屏/全屏），
  handle 触摸手势 + 点击循环切换，工具行镜像 5 个 PC 按钮
- 审计修正：渤海/西部邻国/东北朝鲜半岛/雷州半岛多边形边界修正，
  nmcTime 10 位时间格式补转北京时
```

### Step 5: 推送到远程

```bash
git push origin main
```

### Step 6: 核对更新到位

```bash
git log --oneline -3          # 确认新提交在顶
git status                    # 确认 working tree clean，无未推送提交
git diff origin/main..HEAD    # 应为空（已同步）
```

并再次验证关键产物：
- 索引条目数 = 2257
- index.html 含 `estimateWindCircles` 与 `mobileSheet`/`setSnap`
- 无 `panelToggle`/`mcMenu` 残留 DOM

## 假设与决策

1. **不提交诊断脚本**：`_*.js`/`_*.json` 是排查 NMC 幻影 ID、风圈字段、时间格式的一次性工具，已沉淀为 `project_memory.md` 经验，无需进仓库。
2. **不提交 `.bak` 文件**：纯本地回滚保险，不入版本库。
3. **提交规范文档**：`.trae/specs/` 下两套 spec/tasks/checklist 是本次工作的设计依据，与仓库现有 `.trae/specs/` 目录惯例一致（已跟踪 `docs-bugs-ux-overhaul`、`mobile-ux-overhaul`），予以提交。
4. **README 行尾变更保留**：虽以 LF→CRLF 为主，但属于 git 自动规范化，不单独拆分。
5. **不使用 `git add .`**：避免误纳入临时文件，按文件名精确添加。
6. **不 amend、不 force push**：创建新提交，遵循 Git 安全协议。

## 验证步骤

- [ ] `git status` 显示 9 项 staged（7 修改 + 2 新规范目录 + .gitignore）
- [ ] 提交成功，`git log` 顶部出现新 commit
- [ ] `git push` 成功，`git diff origin/main..HEAD` 为空
- [ ] 远程 GitHub 仓库可见新提交
- [ ] 索引 2257、estimateWindCircles、mobileSheet/setSnap 在提交后版本中可检出到
