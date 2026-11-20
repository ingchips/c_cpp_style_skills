# Project Coding Style Notes

## Rule ownership

| Concern | Owner |
|---|---|
| Indentation, brace placement, spacing, pointer placement | `.clang-format` |
| Missing control-body braces and selected bug diagnostics | Explicit `.clang-tidy` checks |
| Scope, naming, evidence, and model behavior | `AGENTS.md` |
| Hardware contracts, ownership, and runtime behavior | Project code/docs, review, build/tests |

## Diagnose, then correct

```sh
# New file: full layout check. Legacy edit: substitute current changed ranges.
clang-format --dry-run --Werror --style=file path/to/new_file.c
clang-format --dry-run --Werror --style=file --lines=20:45 path/to/legacy_file.c

# Use representative target compile_commands.json; no automatic fixes.
clang-tidy -p build path/to/source.c
```

Review diagnostics before applying an in-scope correction. Use a separate, selected formatting action after accepting a fix; inspect its diff. Do not run blanket `--fix`/`--fix-errors` or enable fix-all on save. Changed headers need affected translation units and an appropriate header filter; the template defaults to main-file diagnostics.

## Tool compatibility

There is no required LLVM/clangd version, matching-version rule, or upgrade gate. Use available tools; record versions only for profile validation/troubleshooting. Unsupported checks/options reduce coverage: use supported checks or a per-run compatible configuration, report omissions, and continue useful work. Do not overwrite the maintained profile or global editor settings to resolve compatibility. clangd completion/navigation must remain usable; editor diagnostics need not match standalone analysis or run every check.

No positive check globs are used, and parent checks are not inherited. Analyzer-required core checks and existing check behavior can still change across releases. Record `clang-tidy --list-checks` with tool versions when adopting/updating the profile; review differences without blocking other tool versions. Older formatters can produce temporary output for comparison when dry-run is unavailable.

## Validation provenance

- Profile validation date: 2026-11-20.
- Tools exercised: clang-format, clang-tidy, and clangd 22.1.8 on Windows. These are observations, not version requirements.
- Checks: 18 explicit entries; 31 effective checks on this toolchain, including analyzer-required core checks; see the [observed list](validated-checks.txt). All 18 selected diagnostics were triggered by isolated samples. The snapshot supports comparison, not an exact-match gate.
- Coverage: configuration parsing, two clean C/C++ samples, 18 diagnostic samples, formatter idempotence, unchanged sources after diagnosis, and two standalone clangd file checks. This does not measure interactive editor latency.
- This template has no target firmware compile database. Host samples do not establish project false-positive rates, cross-toolchain compatibility, or hardware correctness; validate those when adopting it into a real project.

Tool references: [clang-format](https://clang.llvm.org/docs/ClangFormatStyleOptions.html), [clang-tidy](https://clang.llvm.org/extra/clang-tidy/), [analyzer core dependencies](https://clang.llvm.org/docs/analyzer/checkers.html#core), [clangd diagnostics](https://clangd.llvm.org/config#clangtidy).
