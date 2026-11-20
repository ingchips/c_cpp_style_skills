# 嵌入式 C/C++ 编码风格

`personal-embedded-coding-style` 用于嵌入式 C/C++ 的编写、修改、重构、排版和审查，保留现有 SDK 接口、ABI、协议与硬件语义。规则按需读取，工程模板按需合并，适用于 Claude Code、Codex、Google Antigravity（`agy`）和 DeepSeek Harness，也可交给 CC Switch 管理。

默认采用四空格、函数括号换行、控制语句括号同行、`int *ptr`、新文件及私有符号 `snake_case`，列宽目标为 100。显式项目规则优先；旧文件只处理本次修改涉及的范围，不执行全仓格式迁移。LLVM/clangd 版本仅记录验证环境，不设置使用门槛。

## 说明文档

- [Skill 说明](docs/skill-guide.md)：适用范围、调用示例、规则和能力边界。
- [安装与管理](docs/installation.md)：npm、本地复制、工具路径、CC Switch 和更新恢复。
- [设计与复查](docs/design.md)：实现选择、联网来源及尚未验证的环境。
- [SKILL.md](SKILL.md)：模型实际加载的短入口。

## 快速使用

先通过 SSH 获取仓库，再从仓库根目录运行。CLI 只依赖 Node.js 标准库，不需要 Python；没有 `postinstall` 等自动部署脚本。

```sh
git clone git@github.com:ingchips/c_cpp_style_skills.git
cd c_cpp_style_skills
```

```sh
# 直接运行：路径查询和安装预览均不写入工具目录。
node scripts/install.mjs paths
node scripts/install.mjs install --target codex

# 选择目标后执行复制。
node scripts/install.mjs install --target codex --apply

# npm 本地安装 CLI，再显式选择 skill 部署目标。
npm install -g .
personal-embedded-coding-style paths

# 分别生成 npm 离线安装包和 CC Switch 导入包。
npm pack
node scripts/install.mjs package --output dist/personal-embedded-coding-style.zip
```

npm 安装的是 CLI 和资源包，**不会自动把 skill 部署到所有客户端**。若副本已由 CC Switch 管理，采用 ZIP/仓库导入方式维护；同一副本选择一种管理方式，避免多个安装器交替覆盖。当前包为 `private: true`，支持本地和 tarball 安装，未发布到 npm registry。

## 文件结构

```text
SKILL.md                 模型入口与按需路由
references/              C、C++、硬件、注释、命名和工具细则
templates/project/       工程约束、clang-format、clang-tidy 与验证记录
style_docs/              原始参考 PDF，随 Git 仓库提供
docs/                    使用者文档，不随普通固件任务自动加载
scripts/install.mjs      路径查询、复制安装、更新与 ZIP 打包
tests/                   隔离测试，不进入分发包
package.json             npm CLI 入口与分发文件清单
```

安装 skill 与采用工程模板分开。脚本不向项目根目录写入模板，也不覆盖项目已有指令或编辑器设置。需要时逐项合并 `templates/project/`；诊断先审阅，修复与格式处理分别执行。

## 验证

在源代码检出中运行；分发包不包含测试目录。

```sh
npm test
```

编码检查模板的本机验证记录见 [coding-style.md](templates/project/docs/coding-style.md)：LLVM/clangd 22.1.8、18 项诊断样例及正常 C/C++ 样例。安装测试使用临时目录；这些结果不能代替实际固件工程的误报评估、构建和硬件测试。

## 许可证与来源

本仓库原创的 skill 指令、脚本、模板和说明采用 [MIT License](LICENSE)，许可证随安装包分发。[style_docs/](style_docs/) 提供对应的原始参考 PDF，它们保留自身版权和使用条件，不因本仓库采用 MIT 而变更；文档链接见[资料来源](docs/sources.md)。PDF 随 Git 仓库提供，不进入 npm 和 ZIP 安装包，也不随普通任务自动加载。
