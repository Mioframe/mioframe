# src/features/databaseItemSorting

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databaseItemSorting` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- The UI flow for choosing sort keys, directions, and persisted sort order for a database view.

## Patterns

- Source available properties and directions from entity or schema contracts.
- Keep UI order aligned with the persisted sorting order.
- Keep reorder behavior separate from the actual query-time sort implementation.

## Anti-patterns

- Do not compute domain sorting rules in this feature layer.
- Do not allow hidden invalid `propertyId` or `direction` values to survive in writable state.

## Constraints

- Changes here affect both the sort controls and the row order users see in a view.
- Minimum verification: run `pnpm verify --only type-check`, then change sort direction or sort order in a view, confirm the row order updates, and refresh or reopen the same view to confirm the sorting persisted. Use focused verify-managed coverage where available. Final completion still requires `pnpm verify`.
