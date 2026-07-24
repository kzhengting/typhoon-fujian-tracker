# GitHub 仓库授权联通与同步设置 计划

## 概述 (Summary)

用户希望让自己的 GitHub 仓库能够「授权联通、后续修改可同步」。

经过探查，**仓库其实已经联通**：`origin` 已指向 `https://github.com/kzhengting/typhoon-fujian-tracker`，`main` 分支与 `origin/main` 同步、工作区干净，且 `gh` CLI 已登录账号 `kzhengting`（token 含 `repo` 作用域，具备推送权限）。

真正缺失的是两块配置：
1. **Git 没有配置 GitHub 的凭证助手** → `git push` 会失败或要求输入密码（GitHub 自 2021 年起已禁用密码认证）。
2. **没有设置全局提交身份（user.name / user.email）** → 新提交会因缺少作者信息被 Git 拒绝。

本计划通过 `gh auth setup-git` 把 `gh` 已有的 token 接入 Git 凭证助手，并补齐提交身份，即可让后续 `git push` / `git pull` 顺畅同步。

---

## 当前状态分析 (Current State Analysis)

| 项目 | 状态 | 说明 |
|------|------|------|
| 远程仓库 | ✅ 已配置 | `origin = https://github.com/kzhengting/typhoon-fujian-tracker` |
| 当前分支 | ✅ main | 与 `origin/main` 同步，工作区干净 |
| `gh` CLI | ✅ v2.96.0 已登录 | 账号 `kzhengting`，token 作用域 `gist, read:org, repo, workflow`，HTTPS 协议，token 存于 keyring |
| Git 凭证助手 (GitHub) | ❌ 未配置 | 全局仅 `credential.https://gitee.com.provider=generic`，GitHub 无任何 helper |
| 全局提交身份 | ❌ 未设置 | 全局 config 只有 `safe.directory=*` 和 gitee 凭证，无 `user.name`/`user.email` |
| 现有提交身份 | 参考 | 历史提交均用 `kzhengting <kzhengting@users.noreply.github.com>` |
| GitHub 账号 ID | 272457412 | profile 的 name/email 均为空 |
| SSH 密钥 | 无 | `.ssh` 目录仅有空 `config` 文件；本方案不依赖 SSH |

**结论**：采用 **HTTPS + gh 凭证助手** 方案，复用 `gh` 已有的 token，零额外认证成本，无需生成 SSH 密钥。

---

## 实施步骤 (Proposed Changes)

### 步骤 1：把 `gh` 的 token 接入 Git 凭证助手

命令：
```bash
gh auth setup-git
```

**作用**：向全局 `.gitconfig` 写入 GitHub 主机的凭证助手配置，使 Git 在与 `github.com` 通信时调用 `gh auth git-credential` 来提供 token，从而 `git push` / `git pull` / `git fetch` 不再要求密码。

写入后等价于：
```ini
[credential "https://github.com"]
    helper = !gh auth git-credential
[credential "https://gist.github.com"]
    helper = !gh auth git-credential
```

**为什么**：这是「授权联通」的核心一步——把已经登录的 `gh` 凭证桥接给 Git。比手动管理 Personal Access Token（PAT）更安全、token 自动刷新、无需明文存储。

### 步骤 2：设置全局提交身份

命令：
```bash
git config --global user.name "kzhengting"
git config --global user.email "kzhengting@users.noreply.github.com"
```

**作用**：让新提交拥有正确的作者信息（与历史提交一致）。

**为什么用 noreply 邮箱**：
- 与仓库现有提交保持一致（历史均为 `kzhengting@users.noreply.github.com`）；
- GitHub 官方推荐的隐私保护邮箱，不暴露真实邮箱；
- 提交仍能正确关联到 GitHub 账号（账号已开启 noreply 关联）。

> 注：用户若想改用真实邮箱，随时可 `git config --global user.email "你的邮箱"` 覆盖，可逆。

### 步骤 3：验证凭证与身份配置

只读验证命令（不改任何远程内容）：
```bash
# 1) 确认凭证助手已写入
git config --global --get credential.https://github.com.helper
# 期望输出: !gh auth git-credential

# 2) 确认提交身份已写入
git config --global user.name
git config --global user.email

# 3) 读取远程引用（验证凭证可用，read-only）
git ls-remote --heads origin

# 4) 凭证填充测试（不联网，确认 Git 能从 gh 拿到 token）
printf "protocol=https\nhost=github.com\n\n" | git credential fill
# 期望输出含 username/password 字段（password 即 token）
```

### 步骤 4：（可选）实推验证

如需 100% 确认推送链路，可创建一个空提交推送（**会写入历史，建议跳过，除非用户同意**）：
```bash
# 仅在用户明确同意时执行；否则步骤 3 的验证已足够
git commit --allow-empty -m "chore: verify push auth"
git push
# 成功后可 git reset --hard HEAD~1 && git push -f  撤回（略繁琐，故默认不做）
```

默认采用：步骤 3 验证通过即视为完成，告知用户「下次 `git push` 将直接成功、无需密码」。

---

## 后续同步工作流 (Sync Workflow Reference)

配置完成后，日常同步只需标准 Git 命令：

```bash
# 拉取远程更新
git pull

# 提交本地修改
git add <文件>
git commit -m "feat: 你的修改说明"

# 推送到 GitHub（main 已跟踪 origin/main，直接 push 即可）
git push
```

**Token 过期/失效时**：重新登录即可，凭证助手自动生效：
```bash
gh auth login
```

**查看认证状态**：
```bash
gh auth status
```

---

## 假设与决策 (Assumptions & Decisions)

1. **认证方式选 HTTPS + gh token，不选 SSH**：`gh` 已通过 HTTPS 登录且有 `repo` 权限，复用即可；SSH 需额外生成密钥并上传公钥，无必要。
2. **配置作用域选全局（`--global`）**：用户只有这一个项目且在单机操作；全局配置对所有仓库生效，避免每个仓库重复设置。若希望仅对本仓库生效，将 `--global` 改为 `--local` 即可。
3. **邮箱用 GitHub noreply 格式**：与现有提交一致且保护隐私，可随时覆盖。
4. **不做破坏性实推验证**：默认只用只读命令验证；是否创建空提交推送由用户决定。

---

## 验证步骤清单 (Verification Checklist)

- [ ] `git config --global --get credential.https://github.com.helper` 输出 `!gh auth git-credential`
- [ ] `git config --global user.name` 输出 `kzhengting`
- [ ] `git config --global user.email` 输出 `kzhengting@users.noreply.github.com`
- [ ] `git ls-remote --heads origin` 成功列出 `refs/heads/main`（凭证工作）
- [ ] `printf "protocol=https\nhost=github.com\n\n" | git credential fill` 返回含 token 的凭证
- [ ] （后续）任意一次 `git push` 直接成功、无需输入密码
