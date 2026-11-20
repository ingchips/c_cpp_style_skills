# Embedded Rules

Review these rules when code touches hardware, RTOS, timing, or memory boundaries.

- Identify execution context: thread/task, ISR, deferred callback, boot stage, or reset path.
- Keep ISR work bounded and non-blocking. Avoid unnecessary call depth, allocation, logging, and unbounded loops in interrupt context.
- Define ownership and lifetime for DMA buffers, ring buffers, descriptors, callbacks, and shared state. Check cache, alignment, and memory barriers where relevant.
- Treat register access according to the device contract. Preserve required `volatile`, read-modify-write behavior, reset values, reserved bits, and access width.
- Make critical-section boundaries explicit and short. Check lock ordering, interrupt masking, reentrancy, and shutdown behavior.
- Validate lengths, indexes, units, timeout semantics, overflow, and conversions before touching hardware or external input.
- Keep platform/SDK boundaries isolated. Do not invent a substitute initialization sequence when the project requires a specific SDK entry point.
- Distinguish compile validation, host tests, target tests, and hardware-in-the-loop tests. Report which layer actually ran.
