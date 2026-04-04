# src/shared/lib/changeObject

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/changeObject` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `deepPatchJsonObject.ts`: deep patch behavior.
- `deepPutJsonObject.ts`: path-based deep write behavior.
- `isUnknownRecord.ts`: supporting record guard.
- `index.ts`: public entry point.

## Patterns

- Keep deep patch and deep put semantics distinct.
- Make deletion behavior explicit rather than relying on accidental conventions.
- Keep algorithms predictable for nested objects and arrays.

## Anti-patterns

- Do not use these helpers as a substitute for CRDT or document-specific mutation APIs.
- Do not change deletion semantics without tests and caller review.
- Do not blur the difference between skipping a key and deleting a key.

## Constraints

- Algorithm changes require checks for nested objects, arrays, and marker-based deletion.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and focused tests for the touched deep-update semantics.
