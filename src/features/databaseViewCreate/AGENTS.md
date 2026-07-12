# src/features/databaseViewCreate

Inherits the rules from `src/features/AGENTS.md`. Applies to `src/features/databaseViewCreate` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- The flow for creating a database view and choosing its initial layout or defaults.

## Patterns

- Source available layouts from canonical schema or constants rather than local duplicates.
- Keep initial defaults owned in one place so create, reopen, and reset behavior stay aligned.
- Reset the draft predictably after cancel or successful submit.

## Anti-patterns

- Do not create views with layouts unsupported by the rest of the database UI.
- Do not scatter layout defaults or validation rules across multiple components.

## Constraints

- Changes here must stay compatible with view selection, sorting, filtering, and persistence flows.
- Minimum verification: run `pnpm verify --only type-check`, then create a view using the touched defaults, switch to it, and refresh or reopen the document to confirm the selected layout persisted. Use focused verify-managed coverage where available. Final completion still requires `pnpm verify`.
