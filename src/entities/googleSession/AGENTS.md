# src/entities/googleSession

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/googleSession` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Entity read models and small reusable UI for Google sessions, including avatar loading and cleanup.

## Patterns

- Derive Google session display state from shared Google services rather than from raw SDK objects.
- Keep avatar blob-URL lifecycle local to this entity layer and clean it up explicitly.
- Keep list items presentation-focused: render identity, status, and emitted intents, while mutation flows stay in features.

## Anti-patterns

- Do not couple this directory to screen-specific login or recovery flows.
- Do not place revoke, delete, or snackbar orchestration in the entity layer.

## Constraints

- Changes here affect account lists and cached session presentation.
- Minimum verification: run `pnpm verify --only type-check`, run focused verify-managed Google session avatar or entity tests when the contract changed, then verify the affected account list still renders cached identity and the touched avatar surface correctly. Final completion still requires `pnpm verify`.
