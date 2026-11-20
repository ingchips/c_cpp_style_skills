# 设计与复查

## 进一步优化

本轮继续减少默认读取：工具细则只在采用工具、遇到陌生命令或兼容性问题时加载，日常检查复用工程已有命令；项目指令改为宿主实际使用的入口，避免跨工具时只识别 `AGENTS.md`。安装说明和研究材料放在使用者文档中，不进入模型日常参考路由。

模型入口保留最小 frontmatter，没有加入宿主专用工具授权、全局 hooks 或自动执行命令。规则由模型理解，格式交给 formatter，可检测的问题交给显式 analyzer 配置；减少重复文字的同时保留硬件语义和验证边界。

## 同类方案与实现选择

| 方案 | 安装方式 | 本仓库采用的做法 |
|---|---|---|
| Agent Skills | 目录中包含 `SKILL.md` 和资源 | 保持一份通用 skill 包 |
| Codex installer | 从仓库中的 skill 目录安装 | 本地复制或使用 `ingchips/c_cpp_style_skills` 仓库 |
| Vercel skills | 按宿主与作用域安装，链接或复制 | 提供现成命令，不复制其整套包管理逻辑 |
| CC Switch | 管理主副本、应用开关和分发 | 使用 ZIP/仓库导入，不模拟数据库登记 |
| npm | 安装 CLI 与资源包 | 无生命周期自动部署，使用显式 install 子命令 |

资料来源：[格式标准](https://agentskills.io/specification)、[Codex](https://learn.chatgpt.com/docs/build-skills)、[Vercel](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)、[CC Switch](https://github.com/farion1231/cc-switch#readme)。

安装逻辑统一为 Node.js 标准库实现，npm 用户无需额外安装 Python。路径查询、预览、复制、更新和 ZIP 打包共用一份文件清单；ZIP 使用标准存储条目，不依赖外部压缩程序。npm 包和 ZIP 都保留参考文件、模板与 CLI，排除 Git、测试、缓存和构建产物。

## 路径与写入边界

Codex 默认采用 `.agents/skills`，把 `.codex/skills` 单列为兼容 target；AGY 与 Gemini CLI 分开；DeepSeek 支持原生及共享根目录和对应环境变量。项目安装要求给出已存在的项目目录；自定义 provider 或管理器覆盖通过显式路径处理，不因某个旧目录存在就推断客户端在使用它。

每次只安装一个选定目标，默认输出计划，`--apply` 才写入。更新先准备新副本，再将旧目录备份到扫描根目录外；发布失败时尝试恢复。脚本拒绝覆盖链接、源目录与目标互相包含的布局，以及 CC Switch 管理目录；不执行全局配置修改、自动卸载或批量清理。

## 版本与验证

LLVM/clangd 版本只记录验证环境，不参与安装判断。显式列表减少通配符造成的检查扩张；分析器核心依赖和已有检查行为仍可能变化，观察清单供比较，不能成为版本或集合完全一致的使用门槛。clangd 保留编辑器自身的诊断延迟、补全与导航策略。

安装测试使用临时目录，覆盖路径映射、环境变量、预览无写入、复制与备份、链接拒绝、目录重叠、失败恢复和分发内容；npm 本地包也通过隔离前缀安装验证。测试不向真实工具目录部署，不修改 CC Switch 应用开关。

实际固件工程误报率、其他 LLVM 版本、各 GUI 的实时加载、CC Switch UI 导入及交互延迟仍需对应环境验证。联网核实的是官方说明及上游实现，路径一致不代表所有客户端版本均已运行通过。Git 远程仓库为 [ingchips/c_cpp_style_skills](https://github.com/ingchips/c_cpp_style_skills)，通过 SSH 推送；未向 npm registry 发布，包保留 `private: true`。

## 联网核实来源

核实日期为 2026-11-20。上游分支文档会变化，采用时以宿主实际设置为准。

- [Claude Code skills](https://code.claude.com/docs/en/skills) 与[项目指令](https://code.claude.com/docs/en/memory)
- [OpenAI Build skills](https://learn.chatgpt.com/docs/build-skills)
- [Antigravity skills](https://antigravity.google/docs/skills)
- [Vercel 宿主路径](https://github.com/vercel-labs/skills/blob/main/src/agents.ts)
- [DeepSeek filesystem provider](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/README.md) 与 [home 解析](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/home-paths/README.md)
- [CC Switch skill 存储与分发](https://github.com/farion1231/cc-switch/blob/main/src-tauri/src/services/skill.rs) 与 [DeepSeek 根目录覆盖](https://github.com/farion1231/cc-switch/blob/main/src-tauri/src/dsh_config.rs)

Git 仓库仅包含这个 skill，旁边的 PDF、配电图和无关脚本不纳入分发。
