# src/entities/databaseView

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/databaseView` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Database view read state, selected-view and effective-view access, and small reusable view-selection UI.

## Patterns

- Keep view config serializable and schema-driven.
- Expose selected-view state and view lists through stable entity contracts.
- Keep view-selection UI reusable across screens rather than coupling it to one page layout.

## Anti-patterns

- Do not move sorting, filtering, or property-edit orchestration into this entity layer.
- Do not mutate view objects directly or encode one page's layout assumptions as general behavior.

## Constraints

- View contract changes affect selection, layout, and persistence behavior.
- Minimum verification: `pnpm type-check`, then switch between the touched views, confirm the active chip and layout update correctly, and refresh or reopen the document to confirm selection persistence.
