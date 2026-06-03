# src/shared/service

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/service` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Background-side service contracts, worker wiring, cache-aware queries, mutations, and service proxy implementation.

## Patterns

- Services expose infrastructural capabilities and contracts, not screen-specific UI logic.
- Keep `*Service` modules free of DOM APIs, layout, focus, and other main-thread-only behavior.
- Browser-only user-activation adapters belong in `src/shared/serviceClient/**`, not in this tree.
- Treat a direct `*Service` import as service-layer membership unless the module crosses the boundary through an approved proxy client.
- Keep query and mutation contracts deterministic about parameters, invalidation, and missing-data behavior.
- Normalize errors and other side effects here so upper layers see a stable contract.
- Build parameterized observable queries in the service layer itself instead of leaking store internals upward.
- For document and CRDT services, route nested writes through `put`, `patch`, or change helpers before reaching for whole-object replacement.

## Anti-patterns

- Do not import Vue UI components here.
- Do not duplicate domain derivations that belong in `entities`.
- Do not add wrapper services that add no contract, invariant, or normalization.
- Do not leave data-changing flows without cache or event invalidation.

## Constraints

- Service changes often affect every caller above this layer.
- Minimum verification: `pnpm type-check`, then focused tests or reproducible checks for the touched contract, including invalidation and reload behavior after a mutation.
