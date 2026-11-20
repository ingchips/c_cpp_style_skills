# Review Checklist

Use the entrypoint's scope/style rules and the applicable language/hardware reference. Check:

- Inputs, lengths, units, arithmetic, narrowing, and failure propagation.
- Ownership/cleanup on success, error, early exit, cancellation, and shutdown.
- Execution context and affected public, conditional, or generated interfaces.
- Whether claimed contracts/tests are supported by implementation or evidence.

Report only substantiated findings. Separate correctness defects, violations of an adopted rule, and optional advice. A missing tool result is a coverage gap, not proof of a code defect; do not edit during a review-only task.
