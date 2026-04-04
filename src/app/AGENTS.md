# src/app

Inherits the rules from the root `AGENTS.md`. Applies to `src/app` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `MainApp.vue`: root composition and global containers.
- `router.ts`: app-level routing setup.
- `setupApp.ts`: bootstrap and startup wiring.
- `setupSentry.ts`: error reporting integration.
- `styles/`: global tokens, reset, and base styles.

## Patterns

- Keep only app-level wiring and bootstrap concerns here.
- Put global overlays, snackbar containers, and other root UI shells in `MainApp.vue`.
- Keep router and startup code predictable and free of feature-specific business logic.
- Keep global visual tokens here rather than scattering them across features or entities.

## Anti-patterns

- Do not move CRUD, document logic, or feature-specific state into `src/app`.
- Do not turn `setupApp.ts` into a generic orchestration dump.
- Do not import deep implementation files when a public module API already exists.
- Do not place page- or widget-specific layout concerns in root components.

## Constraints

- Any new global dependency must justify its startup cost and ownership.
- Routing and bootstrap changes must be checked against the main navigation and deep-link flows.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected app-level flow.
