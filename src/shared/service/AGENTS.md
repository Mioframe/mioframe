# src/shared/service

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/service` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Background-side service contracts, worker wiring, cache-aware queries, mutations, and service proxy implementation.

## Patterns

- Services expose infrastructural capabilities and contracts, not screen-specific UI logic.
- Keep `*Service` modules free of DOM APIs, layout, focus, and other main-thread-only behavior.
- Browser-only user-activation adapters belong in `src/shared/serviceClient/**`, not in this tree