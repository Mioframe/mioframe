# src/shared/lib/migrations

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/migrations` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Shared helpers for versioned migration pipelines and schema-version bookkeeping.

## Patterns

- Keep migration behavior deterministic and easy to reason about.
- Make pure transformation versus in-place update semantics explicit.
- Add or update a migration test whenever a versioned path changes.

## Anti-patterns

- Do not mix migration infrastructure with document-specific business policy.
- Do not assume all inputs already match the latest schema version.

## Constraints

- Changes here affect versioned loading across the codebase.
- Minimum verification: run `pnpm verify --only type-check`, then verify each touched path with old-version input, already-latest input, and once-only upgrade behavior through focused verify-managed tests. Final completion still requires `pnpm verify`.
