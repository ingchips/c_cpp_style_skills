# Tool Checks

## Compatibility

Use installed tools; no required/matching LLVM/clangd version, upgrade, downgrade, or global editor changes. Record versions and `clang-tidy --list-checks` only when adopting/updating/troubleshooting the profile.

- Missing checks: run supported ones; report gaps without widening to wildcards.
- Unsupported options: inspect the parser error, use project settings or a minimal per-run compatible config. Preserve the maintained profile and required layout; report manual inspection if no faithful tool check is possible.
- clangd may run fewer checks than standalone clang-tidy. Preserve completion/navigation and editor latency filtering; do not force every CLI check into the editor.

The list is explicit, but analyzer-required core checks and existing check behavior can change. Record/review those differences; they are not version gates. Use `--verify-config` when supported.

## Diagnose

Prefer project commands; substitute actual paths/ranges:

```sh
git diff --check
clang-format --dry-run --Werror --style=file path/to/new_file.c
clang-format --dry-run --Werror --style=file --lines=20:45 path/to/legacy_file.c
clang-tidy -p path/to/build path/to/source.c
```

Check range expansion in the diff; do not block on untouched legacy formatting. Without dry-run support, compare temporary formatted output to source.

clang-tidy needs representative target flags, defines, includes, and standard. If compile commands are missing/incompatible, use the actual build and review; host flags do not prove target correctness. Check changed headers via affected translation units with a project-owned header filter; the template defaults to main-file diagnostics. Line filters reduce output, not analysis cost.

## Correct separately

Inspect diagnostics before applying in-scope corrections. Review-only stays read-only. `--export-fixes` can save proposals without editing source; do not run blanket `--fix`/`--fix-errors`, enable fix-all on save, or auto-enable brace insertion. Format accepted fixes separately, inspect the diff, and rerun affected checks. Protect MMIO, attributes, macros, include order, ABI, and ownership.

Report format, build, host, and hardware evidence separately; missing checks remain coverage gaps.
