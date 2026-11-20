# C Rules

- Keep headers self-contained, with unique include guards. Obtain cross-file declarations from their owning header; keep private functions/data `static`.
- For shared C/C++ headers, include dependencies outside an `__cplusplus`-guarded `extern "C"` block around C declarations. Do not wrap arbitrary included headers in it.
- Use `f(void)` for no-argument declarations on pre-C23 targets; honor the actual language standard.
- Keep variables in the smallest practical scope and initialize near first use.
- Make sizes, units, bounds, and signedness explicit before allocation, indexing, conversion, or register access.
- Check fallible operations and choose an explicit propagation, recovery, or justified-ignore path.
- Use focused `goto` cleanup in C when it makes ownership and reverse-order release clearer; do not use it to obscure normal flow.
- Parenthesize macro parameters and wrap multi-statement macros in `do { ... } while (0)` according to the project formatter's brace policy.
- Preserve required `volatile`, packing, alignment, and linker attributes at hardware boundaries.
- Avoid hidden evaluation-order assumptions, unsafe arithmetic, implicit narrowing, and unchecked pointer arithmetic.
