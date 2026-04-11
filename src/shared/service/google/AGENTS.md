# src/shared/service/google

Inherits the rules from `src/shared/service/AGENTS.md`. Applies to `src/shared/service/google` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `googleSessionStore.ts`: session storage and session state management.
- `googleSessionProfile.ts`: embedded Google profile snapshot contract.
- `useGoogleService.ts`: access to Google-related service APIs, including the derived session display list.
- `index.ts`: public entry point.

## Patterns

- Keep Google auth and session behavior behind explicit service contracts.
- Treat token/session lifecycle as a first-class concern: setup, refresh, invalidation, and teardown.
- Expose Google account/profile state for UI as derived session observables, not as per-email UI-triggered token lookups.
- Verify third-party helper semantics before using them in token reuse, scope comparison, or session invalidation branches. Record the exact signature and argument order when the helper name is ambiguous.
- Keep Google stores focused on persistence primitives and shared base observables. Assemble the session display list in the Google service directly from the session store so the dependency of profile data on token lifecycle stays explicit in one pipeline.
- In Google store modules, name zod schemas and exported types directly after the stored contract, such as `zodGoogleSessionStore`, `GoogleSessionStore`, or `GoogleSessionProfile`. Avoid intermediate aliases like `Store` or generic `zodStore` names that hide what the contract actually represents.
- For Google session and profile data, keep "no local data yet" as `undefined`. Do not substitute empty records or placeholder objects in reactive flows just to simplify callers.
- Treat Google sessions as the source of truth. Persisted profile snapshots belong to the session record and should be created or refreshed only from successful fresh-token flows.
- Do not refresh or request a Google token only to render cached session identity in UI. Token refresh belongs only to flows that actually call Google APIs.
- Normalize Google-specific errors before they reach upper layers.

## Anti-patterns

- Do not leak raw Google SDK details into entities or features when the service can hide them.
- Do not mix view-specific logic with auth/session state management.
- Do not leave session invalidation behavior implicit.

## Constraints

- Changes here affect login state, session availability, and any Google-backed flow.
- External imports should go through `index.ts`.
- Scope and token reuse checks that depend on third-party helpers need a focused test covering both the reuse and refresh branches.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected Google session flow.
