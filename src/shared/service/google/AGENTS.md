# src/shared/service/google

Inherits the rules from `src/shared/service/AGENTS.md`. Applies to `src/shared/service/google` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `googleSessionStore.ts`: session storage and session state management.
- `setupGoogleSessionService.ts`: Google session service setup.
- `useGoogleService.ts`: access to Google-related service APIs.
- `index.ts`: public entry point.

## Patterns

- Keep Google auth and session behavior behind explicit service contracts.
- Treat token/session lifecycle as a first-class concern: setup, refresh, invalidation, and teardown.
- Normalize Google-specific errors before they reach upper layers.

## Anti-patterns

- Do not leak raw Google SDK details into entities or features when the service can hide them.
- Do not mix view-specific logic with auth/session state management.
- Do not leave session invalidation behavior implicit.

## Constraints

- Changes here affect login state, session availability, and any Google-backed flow.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected Google session flow.
