# src/entities/databaseFilter

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/databaseFilter` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useDatabaseViewFilter.ts`: entity API for filter mutations.
- `FilterQuery.vue`: entity-level filter tree rendering.
- `DatabaseSimpleFilterValueChip.vue`: compact filter value UI.
- `types.ts` and `index.ts`: typed contracts and public API.

## Patterns

- Treat filters as schema-compatible data structures.
- Apply all filter-tree writes through patch/remove contracts.
- Keep entity UI aligned with filter structure rather than feature-specific editing flow.

## Anti-patterns

- Do not couple filter model ownership to a specific editor dialog.
- Do not mutate nested filter nodes directly.
- Do not duplicate operator semantics across layers.

## Constraints

- Filter shape and operator changes must stay compatible with persisted documents and feature editing flows.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a smoke check of filter rendering/editing for the touched case.
