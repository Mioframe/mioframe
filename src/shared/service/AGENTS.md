# src/shared/service

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/service` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `databaseDocument/`: database document service contracts.
- `directories/`: path and directory services.
- `document/`: document-level service wiring.
- `fileSystem/`: filesystem service wiring.
- `google/`: Google session and integration services.
- `repositories/`: repository-level service contracts.
- `serviceWorker.ts`, `setupMainService.ts`, `useService.ts`: main service setup and access.

## Patterns

- Services should expose infrastructural capabilities and contracts, not screen-level UI logic.
- Normalize errors and side effects so upper layers can rely on stable service behavior.
- Query and mutation contracts should be deterministic and explicit about invalidation.
- Worker and service setup should document lifecycle and cleanup semantics.

## Anti-patterns

- Do not import Vue UI components here.
- Do not duplicate domain derivations that belong in `entities`.
- Do not add wrapper services that add no contract, invariant, or normalization.
- Do not leave data-changing flows without cache or event invalidation.

## Constraints

- Service changes often affect every caller above this layer.
- Contract changes must preserve or intentionally revise loading, error, and mutation semantics.
- Use `index.ts` as the external entry point when present.
- Minimum verification: `pnpm type-check` and focused unit/integration smoke checks for the touched service contract.
