# src/features/databaseFilterEdit

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databaseFilterEdit` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `DatabaseQueryFilterForm.vue`: the main filter-tree editing form.
- `DatabaseFilterAddButton.vue`: add-filter entry point.
- `DatabaseUnaryFilterFormDialog.vue`: unary filter value editing flow.
- property/operator menu components.
- `types.ts`: path and helper contracts for filter editing.

## Patterns

- Model the filter tree as typed data rather than UI-only state.
- Connect property/operator/value editing through explicit contracts between entities and the feature.
- Handle empty groups, node deletion, and type changes explicitly.

## Anti-patterns

- Do not couple this feature to a widget-specific implementation detail.
- Do not mutate the filter tree directly outside patch/update APIs.
- Do not let operator type and value editor drift apart.

## Constraints

- Operator and filter-path changes must stay compatible with persisted document schema and database view flows.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of the filter editing flow.
