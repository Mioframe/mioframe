# src/entities/databaseData

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/databaseData` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useDatabaseData.ts`: entity API for item queries and mutations.
- `DatabaseDataTable.vue`: entity-level table renderer.
- `types.ts` and `index.ts`: typed contracts and public API.

## Patterns

- Respect view, filter, and sort context when it changes the visible item set.
- Route CRUD through service/document contracts instead of local shortcuts.
- Keep table rendering entity-oriented and free of feature-level mutation flows.

## Anti-patterns

- Do not fetch data outside the entity composable when the entity contract already exists.
- Do not mix table rendering with dialog or mutation orchestration.
- Do not let item-list state drift from active view state.

## Constraints

- Query contract changes must be checked against create, update, and remove behavior inside the active database view.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a smoke check of create/update/remove item behavior in the touched view.
