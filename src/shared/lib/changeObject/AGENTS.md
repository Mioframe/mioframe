# src/shared/lib/changeObject

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/changeObject` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Generic deep put and deep patch helpers for JSON-like objects used by higher-level mutation code.

## Patterns

- Keep deep put and deep patch semantics distinct.
- Make deletion behavior explicit instead of relying on incidental conventions.
- Keep nested object and array behavior predictable and easy to test.

## Anti-patterns

- Do not use these helpers as a substitute for document-specific mutation APIs when a higher-level contract already exists.
- Do not blur the difference between skipping a key and deleting a key.

## Constraints

- Algorithm changes here affect many callers at once.
- Minimum verification: `pnpm type-check`, then run focused checks for nested objects, arrays, and deletion markers in the touched deep-update path.
