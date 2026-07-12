# src/shared/lib/subscriptions

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/subscriptions` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Client and service subscription transport plus the stable query-key contract shared between them.

## Patterns

- Make subscriptions resilient to recreate, dispose, dedupe, and reconnect cycles.
- Treat query-key serialization as a public contract.
- Include initial delivery and post-mutation updates in the observable contract rather than leaving them to caller timing.

## Anti-patterns

- Do not rely on implicit lifecycle behavior.
- Do not change key semantics without reviewing every affected caller.
- Do not lose initial values or update delivery because of lifecycle drift.

## Constraints

- Subscription changes affect client and service code at once.
- Minimum verification: run `pnpm verify --only type-check`, then verify subscribe, initial value, update, unsubscribe, resubscribe, and dedupe behavior for the touched key shape through focused verify-managed tests. Final completion still requires `pnpm verify`.
