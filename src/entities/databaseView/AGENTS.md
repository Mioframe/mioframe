# src/entities/databaseView

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/databaseView` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useDatabaseViews.ts`: all views for a document.
- `useDatabaseView.ts`: one selected view and its mutations.
- `DatabaseViewChipsList.vue`: entity-level view selection UI.
- `index.ts`: public entry point.

## Patterns

- Keep view config serializable and schema-driven.
- Return stable loading, error, and mutation hooks from entity APIs.
- Keep view-related UI small and reusable rather than feature-specific.

## Anti-patterns

- Do not mix sorting, filtering, or property editing flows into this entity layer.
- Do not mutate view objects directly.
- Do not encode one page's layout assumptions as general view behavior.

## Constraints

- View structure changes affect selection, layout, sorting, and filtering flows.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a smoke check of the affected view selection/layout behavior.
