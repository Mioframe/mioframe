# src/shared/lib/typeGuards

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/typeGuards` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- guards for primitives and collections such as `isArray`, `isInteger`, `isObjectLike`, `hasValue`, `hasOwnKey`.
- guards for platform-specific objects such as filesystem handles.
- `index.ts`: public entry point.

## Patterns

- Each guard should narrow types predictably and without side effects.
- Prefer small composable guards over broad "do everything" predicates.
- When a guard mirrors a schema-level contract, keep it aligned with validation helpers.

## Anti-patterns

- Do not add magic universal guards that try to validate everything.
- Do not change runtime behavior without checking TypeScript narrowing expectations.
- Do not duplicate equivalent guards under multiple names without a clear reason.

## Constraints

- Guard changes must be checked for both runtime behavior and TypeScript inference.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and focused checks for the touched narrowing behavior.
