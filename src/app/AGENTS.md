# src/app

Inherits the rules from the root `AGENTS.md`. Applies to `src/app` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- App bootstrap, router wiring, root UI shells, and global visual tokens.

## Patterns

- Keep only startup-time wiring and app-wide containers here.
- Put global overlays, snackbar hosts, and other root shells in this layer rather than scattering them across pages or widgets.
- Keep router setup and startup hooks predictable and free of feature-specific business rules.

## Anti-patterns

- Do not turn `setupApp.ts` or `MainApp.vue` into a catch-all orchestration dump.
- Do not move page-specific or widget-specific layout concerns into root components.

## Constraints

- Any new global dependency must justify its startup cost and lifetime.
- Minimum verification: `pnpm type-check`, then cold start into the default route, deep-link into the touched route, and refresh that route.
