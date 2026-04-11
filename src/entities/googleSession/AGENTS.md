# src/entities/googleSession

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/googleSession` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useGoogleSessions.ts`: session display list and related entity state.
- `useGoogleSessionAvatar.ts`: avatar loading state and blob-URL lifecycle for session profile images.
- `setupGoogleSessions.ts`: entity-level setup wiring.
- `GoogleSessionList.vue` and `GoogleSessionListItem.vue`: small UI fragments.
- `index.ts`: public entry point.

## Patterns

- Keep Google account/session presentation on top of shared Google services.
- Treat Google session display items as entity data derived from shared service observables, not page-specific UI state.
- Keep session profile UI fragments reusable across account-related screens.
- Keep `GoogleSessionListItem` presentation-only: it may render identity, avatar, and emitted intents, but session mutation actions must stay in a feature wrapper.
- Keep Google account entity props simple: pass one session display item or other display-ready data, not service handles or mutation callbacks.
- Keep Google account entity composable inputs simple in the same way: accept small identity or display inputs such as `email` or a session display item, and keep feature-owned session actions and UI orchestration out of the composable boundary.

## Anti-patterns

- Do not couple this directory directly to screen-level account flows.
- Do not expose raw Google SDK state when the shared service already normalizes it.
- Do not duplicate session ownership rules across entities and features.
- Do not place session action menus, revoke/delete handlers, or snackbar orchestration in this entity directory.

## Constraints

- Changes here affect account displays and Google-backed session visibility.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of the touched Google account/session UI flow.
