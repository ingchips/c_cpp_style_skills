# Naming, Types, and Conflicts

- Names expose purpose, units, ownership, and side effects. Query-like names must not conceal mutation; use existing domain terms rather than inventing synonyms.
- Preserve project conventions for C++ types, constants, macros, and public interfaces; `snake_case` is the fallback for files/private symbols, not a reason to rename SDK types.
- Use fixed-width integers when protocol/register/ABI width matters. Use `size_t` for object sizes and counts where appropriate, and preserve existing error-code and SDK types. Check narrowing at the boundary; do not migrate unrelated types.
- An explicit project rule/configuration wins over incidental nearby formatting. Keep untouched legacy regions stable; if both cannot be satisfied locally, explain the conflict rather than rewriting configuration.
- Missing local callers do not prove a symbol is dead: check exports, registration, conditional builds, and generated references before removing it.
