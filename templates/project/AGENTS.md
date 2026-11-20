# Project Coding Constraints

- Follow explicit user requirements and applicable project rules. `.clang-format` owns layout; retain nearby legacy conventions where no rule exists. Reuse unchanged context already read.
- Brace non-empty control bodies and keep executable statements on separate lines. Use `snake_case` for new files/private symbols unless the project specifies otherwise; preserve SDK/public names and types.
- Preserve behavior, ABI, protocols, register layouts, macro semantics, include order, and generated data unless the task changes them. A formatting-only task does not refactor or rename; a review-only task does not edit.
- Verify SDK/register/timing assumptions from code or device documentation. Check execution context, DMA/cache ownership, synchronization, lifetime, and failure paths. Do not remove hardware attributes or change runtime policy to silence diagnostics.
- Comments explain intent and contracts; add no author journals or license text without project policy.
- Format/check new files in full and legacy edits by changed ranges plus necessary enclosing constructs. Inspect the final diff; narrow unrelated formatting expansion.
- Diagnose with available tools first. Apply only fixes relevant to the authorized task after reviewing their effect; no blanket `clang-tidy --fix` or `--fix-errors` pass.
- No LLVM/clangd version gate or required upgrade. For unsupported checks/options, retain usable tooling and report partial coverage; do not change global editor configuration.
- Follow [tool guidance](docs/coding-style.md) when running checks. Report actual format/build/host/hardware results and unavailable checks separately.
