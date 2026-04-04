# src/shared/lib/subscriptions

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/subscriptions` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `subscribeClient.ts`: client-side subscription helpers.
- `subscribeService.ts`: service-side subscription contracts.
- `types.ts` and `index.ts`: public types and entry points.

## Patterns

- Make subscriptions resilient to re-creation, disposal, and deduplication.
- Treat query-key serialization as a stable public contract.
- Hide transport and service-worker details behind the public API.

## Anti-patterns

- Do not rely on implicit subscription lifecycle behavior.
- Do not change key semantics without reviewing affected callers.
- Do not lose initial values or post-mutation updates because of lifecycle drift.

## Constraints

- Changes here must be checked for subscribe/unsubscribe, dedupe, and reconnect behavior.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and focused tests or smoke checks for subscription lifecycle behavior.
