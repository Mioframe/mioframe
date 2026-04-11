# src/shared/lib/typeGuards

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/typeGuards` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Small reusable runtime predicates whose behavior also drives TypeScript narrowing.

## Patterns

- Keep each guard focused on one predicate and one narrowing contract.
- Keep runtime behavior aligned with the TypeScript narrowing callers expect.
- When a guard mirrors a schema-level contract, keep it aligned with the nearby validation helper.

## Anti-patterns

- Do not add universal "validate everything" guards.
- Do not change runtime semantics without checking the resulting narrowing behavior.
- Do not duplicate equivalent guards under different names without a clear reason.

## Constraints

- Guard changes affect both runtime behavior and compile-time inference.
- Minimum verification: `pnpm type-check`, then run focused runtime and narrowing checks for the touched guard.
