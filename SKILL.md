---
name: personal-embedded-coding-style
license: MIT
description: Apply personal embedded C/C++ style when writing, modifying, formatting, or reviewing firmware. Respect project conventions and hardware contracts.
---

# Personal Embedded C/C++ Coding Style

Precedence: explicit user requirements > applicable project instructions/configuration > nearby legacy conventions > this baseline. Preserve behavior, API/ABI, protocols, and register layouts unless the task changes them.

## Work within scope

- Read applicable host/project instructions (`AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` as configured), formatter settings, and nearby code once. Inspect build/analyzer settings when relevant; reuse unchanged context.
- Establish ownership, failure paths, and execution context. Verify SDK/register/timing assumptions from code or device documentation; disclose missing evidence.
- Review-only: findings, no edits. Format-only: no renaming, refactoring, include reordering, or behavior changes.
- Do not add dependencies, change runtime/language policy, or remove hardware attributes/synchronization to satisfy style/diagnostics.

## Load only relevant details

Choose language from the build context, not a `.h` suffix. Add all relevant topics; never load unrelated references or repeat unchanged rules.

- C logic/interfaces: [C rules](references/c-rules.md).
- C++ logic/interfaces: [C++ rules](references/cpp-rules.md); shared C linkage also needs C header rules.
- ISR, DMA, registers, RTOS, timing: [Embedded rules](references/embedded-rules.md).
- Comment changes/review: [Comments](references/comments.md).
- Review: [Checklist](references/review-checklist.md), plus relevant language/hardware rules.
- Naming/types or convention conflicts: [Core rules](references/core-rules.md).
- Tool setup, unfamiliar check commands, or compatibility issues: [Tool checks](references/tool-checks.md). Reuse established project commands without reloading this guide.

Pure formatting skips semantic references unless a concrete concern appears.

## Baseline style

- Generate formatted code; `.clang-format` owns layout. Fallback: four spaces, no tabs; function brace next line; control brace same line; `} else` / `} catch`; `int *ptr` / `int &ref`; 100-column target.
- Brace non-empty control bodies; one executable statement per line; no compressed bodies. Preserve deliberate empty loops and macro continuations.
- New files/private symbols: `snake_case` unless local conventions differ. Preserve SDK/public names and existing types.
- Preserve include order; matching header first in new implementation files when present. Avoid reflow-only diffs in tables/macros.
- Comments explain intent/contracts; API docs belong at declarations. No author journals, banners, or added license text without project policy.

## Check and deliver

- New files: full format check. Legacy edits: changed ranges plus necessary enclosing constructs. Narrow unrelated expansion.
- Inspect the diff for changed macro tokens, branches, strings, includes, generated/protocol data, and hardware ordering. Use explained `clang-format off/on` ranges only for demonstrated layout problems.
- Run relevant available checks/build/tests; separate diagnostics from fixes. No LLVM/clangd version gate; report missing coverage and continue useful work.
- Distinguish format, compile, host, and hardware results. Findings need location, trigger, consequence, and remedy; separate defects, adopted rules, and optional advice.
