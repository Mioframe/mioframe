# src/shared/service/google

Inherits the rules from `src/shared/service/AGENTS.md`. Applies to `src/shared/service/google` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Google session persistence, normalized profile snapshots, and Google service access for upper layers.

## Patterns

- Keep Google auth and session lifecycle explicit: setup, refresh, invalidation, reuse, and teardown are part of the service contract.
- Assemble session display data in the service layer from the persisted session store so profile and token lifecycle stay coupled in one pipeline.
- Treat missing local session or profile data as `undefined` instead of inventing placeholder objects.
- Do not refresh or request a token only to render cached identity in UI; token refresh belongs to flows that actually call Google APIs.
- Normalize Google-specific errors before they leave the service layer.

## Anti-patterns

- Do not leak raw Google SDK details into entities or features.
- Do not mix view-specific logic with auth or session management.
- Do not leave session invalidation behavior implicit.

## Constraints

- Changes here affect login state and every Google-backed flow.
- Minimum verification: `pnpm type-check`, run focused Google service tests when the touched branch is covered, then verify cached session display plus the touched login, reuse, refresh, or invalidation flow in the app.
