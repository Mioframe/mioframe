# src/entities/databaseFilter

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/databaseFilter` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Persisted database-view filter state and reusable filter tree or chip rendering.

## Patterns

- Treat filters as schema-compatible persisted structures.
- Apply tree writes through patch or remove contracts instead of ad hoc nested mutation.
- Keep rendered filter UI aligned with the stored filter structure rather than one editor implementation.

## Anti-patterns

- Do not couple filter ownership to a specific dialog.
- Do not duplicate operator semantics across layers.

## Constraints

- Filter contract changes affect both persistence and row matching.
- Minimum verification: `pnpm type-check`, then save a touched filter, reopen the same view, and confirm the rendered filter structure still matches the resulting row set.
