# src/features/databaseFilterEdit

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databaseFilterEdit` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- The typed editor for database filter trees, operator selection, and unary filter value editing.

## Patterns

- Keep the filter tree as schema-compatible data rather than UI-only transient shapes.
- Route edits through explicit patch or remove helpers so nested updates stay auditable.
- Reset incompatible filter values when the selected property or operator changes.

## Anti-patterns

- Do not couple this feature to one widget implementation detail.
- Do not mutate nested filter nodes directly or let operator and value-editor contracts drift apart.

## Constraints

- Changes here must stay compatible with persisted view filters and row matching.
- Minimum verification: run `pnpm verify --only type-check`, then add or edit the touched filter shape, save it, reopen the same view, and confirm both the rendered chips and the resulting row set still match. Use focused verify-managed coverage where available. Final completion still requires `pnpm verify`.
