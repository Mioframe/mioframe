# src/shared/service

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/service` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Background-side service implementations, worker wiring, cache-aware queries, mutations, service proxy implementation, and service public contracts.

## Patterns

- Services expose infrastructural capabilities and contracts, not screen-specific UI logic.
- Keep `*