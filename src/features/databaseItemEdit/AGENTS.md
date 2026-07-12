# src/features/databaseItemEdit

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databaseItemEdit` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Add and edit flows for database items plus the shared editing state that maps property kinds to value editors.

## Patterns

- Keep add and edit on top of one editing-state contract when the behavior is the same.
- Choose value editors from canonical property-kind information rather than ad hoc UI branching.
- Persist changes through entity or service contracts instead of direct item mutation.

## Anti-patterns

- Do not duplicate form state between add and edit paths without a strong reason.
- Do not let dialog state or value-editor mappings drift after close or reopen.

## Constraints

- Changes here affect multiple property kinds at once.
- Minimum verification: run `pnpm verify --only type-check`, then add or edit an item using the touched property kinds, save and reopen to confirm persistence, and verify the cancel path leaves stored data unchanged. Use focused verify-managed coverage where available. Final completion still requires `pnpm verify`.
