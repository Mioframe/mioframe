# src/entities/databaseData

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/databaseData` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Active-view item queries, item write entry points, and entity-scale table rendering.

## Patterns

- Keep the visible row set aligned with active view, filter, sort, and default-value context.
- Separate read contracts and entity rendering from feature-level mutation orchestration.
- Route item writes through shared service and entity contracts rather than table-local shortcuts.

## Anti-patterns

- Do not query around the entity contract when the existing read model already fits.
- Do not mix dialog orchestration or feature-only mutation flows into table code.

## Constraints

- Changes here affect what rows appear in an active database view.
- Minimum verification: run `pnpm verify --only type-check`, then edit data in an active view and confirm refresh or reopen keeps the same row set for the touched filter, sort, and default-value semantics. Use focused verify-managed tests where available. Final completion still requires `pnpm verify`.
