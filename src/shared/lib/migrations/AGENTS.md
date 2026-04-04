# src/shared/lib/migrations

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/migrations` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `defineMigrations.ts`: migration pipeline construction.
- `defineVersion.ts`: version helpers.
- `index.ts`: public migration infrastructure API.

## Patterns

- Keep migration behavior deterministic and easy to reason about.
- Make the difference between pure transformation and in-place update explicit.
- Add a migration test whenever a new versioned path is introduced or changed.

## Anti-patterns

- Do not mix migration infrastructure with document-specific business policy.
- Do not change mutation semantics without updating tests and callers.
- Do not assume all input data already matches the latest schema.

## Constraints

- Changes here affect schema-driven loading across the codebase.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a migration test for each changed versioned path.
