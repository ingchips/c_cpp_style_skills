# Comment Rules

## Write comments for

- Why a hardware sequence, ordering, delay, barrier, or workaround is required.
- Ownership transfer, lifetime, interrupt context, synchronization, units, and valid ranges.
- Protocol or register assumptions that are not visible from names and types.
- Public API preconditions, postconditions, failure values, and side effects.

## Avoid

- Narrating obvious statements.
- Copying implementation steps into comments that will become stale.
- File version histories and author logs.
- Saying that code follows another implementation without explaining the local contract.
- Claiming a test, hardware result, or safety property that was not verified.

Use Doxygen only where the project uses it. Keep authoritative API documentation at the declaration or interface boundary; put implementation rationale next to the relevant code.
