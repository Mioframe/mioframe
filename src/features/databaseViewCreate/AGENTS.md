# src/features/databaseViewCreate

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databaseViewCreate` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `DatabaseViewCreateDialog.vue`: view creation dialog flow.
- `DatabaseViewAddForm.vue`: form for name and layout selection.
- `index.ts`: public feature entry point.

## Patterns

- Use only supported layout constants from the document schema.
- Keep defaults safe for a new view and stable across dialog reopen.
- Ensure form state behaves consistently on submit, cancel, and reopen.

## Anti-patterns

- Do not create a view with a layout unsupported by downstream UI.
- Do not hide defaults and validation rules in multiple places.
- Do not mix create and edit behavior without a clear shared abstraction.

## Constraints

- Any view config expansion must be checked in selection, sorting, filtering, and persistence flows.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of the view creation flow.
