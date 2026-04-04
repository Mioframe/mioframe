# src/entities/databaseProperty

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/databaseProperty` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useDatabaseProperties.ts` and `useDatabaseProperty.ts`: entity APIs for property data.
- `DatabasePropertyList.vue`, `DatabasePropertyListItem.vue`, `DatabasePropertyBlock.vue`, `DatabasePropertySpan.vue`, `DatabasePropertyMenuItem.vue`: property-oriented UI fragments.
- `index.ts`: public entry point.

## Patterns

- Use canonical property kinds and schema definitions.
- Keep entity UI small and reusable across features and widgets.
- Route property reads and writes through the composables in this directory.

## Anti-patterns

- Do not hardcode property kinds or property behavior in UI fragments.
- Do not mix create/edit dialog orchestration into the entity layer.
- Do not duplicate property metadata across multiple sources of truth.

## Constraints

- Property model changes must be checked through schema, entity API, create/edit, value rendering, filter, and sort flows.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a smoke check of the affected property render/edit flow.
