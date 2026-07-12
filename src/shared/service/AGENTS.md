# src/shared/service

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/service` and its descendants until a deeper `AGENTS.md` refines it.

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
- Keep `@shared/service` as a narrow public worker-service client contract.
- Export public service DTOs, enums, constants, and error contracts from contract-only modules, not from `use*Service` implementation files.
- Service implementations may import contract-only modules, but contract-only modules must not import service implementations.
- Do not re-export implementation barrels from `@shared/service`.

## Anti-patterns

- Do not import Vue UI components here.
- Do not duplicate domain derivations that belong in `entities`.
- Do not add wrapper services that add no contract, invariant, or normalization.
- Do not leave data-changing flows without cache or event invalidation.
- Do not make `@shared/service` expose `useFileSystemService`, `useRepositoriesService`, `useGoogleService`, or other background-side `use*Service` implementations.
- Do not make contract-only modules depend on `use*Service`, `setup*Service`, implementation barrels, provider setup, VFS setup, repository setup, or runtime side effects.

## Constraints

- Service changes often affect every caller above this layer.
- Minimum verification: run `pnpm verify --only type-check`, then run focused verify-managed tests or reproducible checks for the touched contract, including invalidation and reload behavior after a mutation.
- When changing public service exports, also run `pnpm verify --only oxlint` and confirm UI/FSD layers import only from `@shared/service`, not from `@shared/service/*` or relative `shared/service/**` paths. Final completion still requires `pnpm verify`.
