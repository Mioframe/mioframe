# src/features/databaseItemSorting

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databaseItemSorting` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `DatabaseItemSortingListSection.vue`: the main sorting UI flow.
- `DatabaseSortingListItem.vue`: sorting-row UI.
- `PropertySortDirectionMenuItem.vue`: sort-direction selection.
- `index.ts`: public feature entry point.

## Patterns

- Keep this feature focused on interaction flow and sorting controls.
- Source available properties and directions from entity/schema layers.
- If drag-and-drop order matters, keep it aligned with persisted sorting state.

## Anti-patterns

- Do not compute table sorting logic here as domain behavior.
- Do not allow hidden `propertyId` or `direction` values.
- Do not spread writable sorting state across multiple local sources of truth.

## Constraints

- Changes here should be checked with entity sorting descriptions and database view persistence.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of the sorting flow.
