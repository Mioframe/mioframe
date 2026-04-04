# src/entities/googleUserInfo

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/googleUserInfo` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useGoogleSessions.ts`: session list and related entity state.
- `useGoogleUserInfo.ts`: user-profile entity access.
- `setupGoogleSessions.ts`: entity-level setup wiring.
- `GoogleUserInfoList.vue` and `GoogleUserInfoListItem.vue`: small UI fragments.
- `index.ts`: public entry point.

## Patterns

- Keep Google account/session presentation on top of shared Google services.
- Treat user info and session state as entity data, not page-specific UI state.
- Keep profile UI fragments reusable across account-related screens.

## Anti-patterns

- Do not couple this directory directly to screen-level account flows.
- Do not expose raw Google SDK state when the shared service already normalizes it.
- Do not duplicate session ownership rules across entities and features.

## Constraints

- Changes here affect account displays and Google-backed session visibility.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of the touched Google account/session UI flow.
