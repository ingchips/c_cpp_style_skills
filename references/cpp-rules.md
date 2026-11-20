# C++ Rules

- Confirm the project language standard and toolchain support before using a language feature.
- Preserve C linkage and ABI boundaries. Do not convert an external C interface merely for stylistic reasons.
- Prefer RAII and explicit ownership where the target runtime permits it; do not introduce exceptions, RTTI, heap allocation, or library facilities forbidden by the project.
- Keep constructors, callbacks, and destructors safe for initialization order, interrupt/task context, and shutdown.
- Avoid accidental copies, implicit conversions, dangling references, and lifetime extension assumptions.
- Use `const` when it expresses a stable contract, but do not add superficial qualifiers that obscure ownership or conflict with an established API.
- Keep templates and inline code readable; do not compress bodies to satisfy line limits.
