# 安装与管理

核实日期：**2026-11-20**。`~` 表示宿主进程的用户目录；Windows 通常为 `C:\Users\用户名`。WSL、SSH、容器和远程客户端有各自的用户目录，本地安装不自动同步到远程环境。

## 路径表

表中为 skills 根目录，实际文件再增加 `personal-embedded-coding-style/SKILL.md`。

| 对象 / target | 用户级根目录 | 项目级根目录 |
|---|---|---|
| Claude Code / `claude` | `~/.claude/skills`，脚本支持 `CLAUDE_CONFIG_DIR` 覆盖配置根目录 | `<项目>/.claude/skills` |
| Codex / `codex` | `~/.agents/skills` | `<项目>/.agents/skills` |
| Codex 兼容 / `codex-legacy` | `$CODEX_HOME/skills`，默认 `~/.codex/skills` | 不推断 |
| Antigravity / `agy` | `~/.gemini/config/skills` | `<项目>/.agents/skills` |
| Antigravity 兼容 / `agy-legacy` | `~/.gemini/antigravity/skills` | 不推断 |
| DeepSeek Harness / `deepseek` | `$DSH_HOME/skills`，默认 `~/.dsh/skills` | `<项目>/.dsh/skills` |
| 共享 / `shared` | `~/.agents/skills` | `<项目>/.agents/skills` |
| DeepSeek 共享 / `deepseek-shared` | `$DSH_AGENTS_HOME/skills`，默认 `~/.agents/skills` | `<项目>/.agents/skills` |
| CC Switch | 默认 `~/.cc-switch/skills`，可选 `~/.agents/skills` | 由所选应用决定 |

Codex 行采用当前官方发现目录；兼容行用于既有安装器和管理器布局，不能保证每种客户端都读取它。AGY 指 Google Antigravity CLI；旧全局目录是独立 IDE 的兼容入口，不是 CLI 首选。DeepSeek 路径适用于其本地 filesystem provider，自定义 composition 可以覆盖默认根目录。

来源：[Claude](https://code.claude.com/docs/en/skills)、[Codex](https://learn.chatgpt.com/docs/build-skills)、[Antigravity](https://antigravity.google/docs/skills)、[DeepSeek provider](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/README.md)、[DeepSeek home](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/home-paths/README.md)。辅助脚本的 Claude 环境变量处理也与 [Vercel 路径实现](https://github.com/vercel-labs/skills/blob/main/src/agents.ts) 对齐。

CC Switch 当前将 Codex 应用副本默认分发到 `~/.codex/skills`，并支持应用目录覆盖。`paths` 展示候选默认值，不读取管理器数据库；实际主副本和应用副本以 UI 设置为准。[CC Switch 路径实现](https://github.com/farion1231/cc-switch/blob/main/src-tauri/src/services/skill.rs)

## npm 安装

从本仓库根目录执行；也可先克隆仓库再切换到该目录。npm 安装 CLI 和资源包，skill 部署需另行选择目标，没有安装后自动写入客户端目录的生命周期脚本。

```sh
npm install -g .
personal-embedded-coding-style paths
personal-embedded-coding-style install --target codex
personal-embedded-coding-style install --target codex --apply
```

离线分发使用 npm tarball：

```sh
npm pack
npm install -g ./personal-embedded-coding-style-0.1.0.tgz
personal-embedded-coding-style install --target claude --apply
```

npm 的目录/tarball 安装与 `pack` 行为见 [npm install](https://docs.npmjs.com/cli/v11/commands/npm-install/) 和 [npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack/)。

也可用 `npm exec --package=. -- personal-embedded-coding-style paths` 临时执行本地包。CLI 仅依赖 Node.js 标准库，版本需求见 `package.json`，不依赖 Python，也不限制 LLVM/clangd。当前包标记 `private: true`，支持以上本地安装和打包；尚未发布到 npm registry，不能把 `npm install -g personal-embedded-coding-style` 当作已经可用的公开命令。

## 不安装 npm 包，直接运行

```sh
node scripts/install.mjs paths
node scripts/install.mjs paths --project C:/work/firmware

# 默认预览，不创建目标目录。
node scripts/install.mjs install --target claude
node scripts/install.mjs install --target codex
node scripts/install.mjs install --target agy
node scripts/install.mjs install --target deepseek

# 项目目录必须已存在。
node scripts/install.mjs install --target codex --scope project --project C:/work/firmware --apply

# 自定义 skills 根目录；脚本会追加 skill 名称。
node scripts/install.mjs install --skills-dir C:/agent-config/skills --apply
```

`codex`、`shared` 和默认 `deepseek-shared` 指向同一用户目录，只选一种即可。脚本不复制工程模板到项目根目录，不修改全局指令和编辑器配置；`--home-dir` 只用于路径预览和测试，不会让客户端改用该用户目录。

## 现有 skill 安装器

Vercel `skills` CLI 可从本地目录或 Git 仓库按宿主和作用域安装，并选择复制方式。从本仓库目录执行以下命令；`npx` 会下载运行第三方 CLI。[命令参考](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)

```sh
npx skills add . --list
npx skills add . --skill personal-embedded-coding-style -a claude-code codex antigravity-cli -g --copy
```

DeepSeek 使用上表对应目录，不假定所有第三方 CLI 版本都内置其 target。Codex 也可用 `$skill-installer` 安装真实 GitHub skill 目录；本仓库未配置远程地址，发布后再补充实际链接。

## CC Switch 导入

```sh
node scripts/install.mjs package --output dist/personal-embedded-coding-style.zip
```

在 CC Switch 的 Skills 页面找到 ZIP 导入入口，选择文件，再勾选需要启用的应用。已有同名副本时使用管理器的更新/替换流程，并核对应用开关。ZIP 只有一层 skill 目录，包含参考文件、模板和 CLI，不含 `.git`、测试、缓存和构建产物。发布到 Git 托管后，也可将真实仓库地址和 `main` 分支加入管理器。[CC Switch 说明](https://github.com/farion1231/cc-switch#readme)

主副本默认在 `~/.cc-switch/skills`，也可配置成 `~/.agents/skills`；管理器再按应用分发链接或副本。单纯向管理主目录复制文件不等于登记完成，本脚本因此拒绝写入 `.cc-switch` 目录。已有 CC Switch 副本通过管理器维护，不与本地脚本交替覆盖。

AGY 要选择 **Antigravity CLI**，不能用 Gemini CLI 的开关代替。Gemini CLI 的 `~/.gemini/skills` 与 AGY 目录不同，独立应用接入见 [CC Switch AGY 说明](https://github.com/farion1231/cc-switch/blob/main/docs/release-notes/v4.0.18-en.md)。本轮不修改管理器数据库或真实应用开关。

## 更新、恢复和移除

本地复制不自动追随源码。更新时先准备完整副本，再备份旧目录并换入新目录；失败时尝试恢复原目录。备份保存在 skills 根目录外的 `skill-install-backups/`，具体路径会输出。

```sh
personal-embedded-coding-style install --target codex --update
personal-embedded-coding-style install --target codex --update --apply
```

脚本拒绝覆盖符号链接或 Windows junction，也不覆盖其他 skill。需要恢复时，在停止相关写入后另存当前副本，再将输出的备份目录移回原目标。CC Switch 和 Vercel 管理的副本分别使用其更新、停用和移除入口；手工副本只处理确认属于本 skill 的目录，不删除整个 skills 根目录。卸载 npm CLI 不会自动删除已部署的 skill。

## 确认生效

在宿主技能列表中核对名称与路径，避免多嵌套一层目录或重复安装。Claude Code 可用 `/personal-embedded-coding-style`，Codex 可用 `$personal-embedded-coding-style`。未出现时核对用户、作用域、工作目录和应用开关，再使用客户端的刷新功能或重开会话。

DeepSeek 自定义 composition 需要 skill registry、filesystem provider 和模型访问层；文件存在不能证明组件已启用。确认加载不需要升级 LLVM 或 clangd，工具版本只影响检查覆盖。
