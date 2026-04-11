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
- Use the `*Service` suffix for worker-side or background-side infrastructure only.
- Keep `*Service` modules free of DOM APIs, focus/layout concerns, and other main-thread-only browser behavior.
- Verify third-party collection, equality, merge, path, and cache helper semantics from official docs or source before using them to gate service behavior, cache reuse, dedupe, or invalidation.
- Treat direct `*Service` imports as transitive service-layer membership. If a module depends on a `*Service` contract without going through an approved proxy client boundary, keep that module in the service layer and apply the same service-layer constraints to it.
- Prefer `setup*` for service wiring and `use*` for service access. Use `create*` only when each call intentionally creates a new service instance owned by the caller.
- Normalize errors and side effects so upper layers can rely on stable service behavior.
- Query and mutation contracts should be deterministic and explicit about invalidation.
- Worker and service setup should document lifecycle and cleanup semantics.
- For main-thread to worker subscriptions, expose parameterized streams as `defineObservableQuery(...)` contracts in the service and consume them in upper layers with `useObservableQuery(...)`.
- Use `fromObservable(...)` only for service fields that are already stable observable sources and do not need query parameters.
- Build parameterized service streams in the service module itself. Do not add store-level `get*Source` helpers when the same result can be expressed as a local `...$` observable plus `defineObservableQuery(...)`.
- Use `defineCacheObservable(...)` deliberately. Keep it when a query should expose one shared stream instance per argument set or when matching an existing service pattern matters; skip it when it adds indirection without improving stream semantics.
- Represent missing service data explicitly as `undefined` or another real contract value. Do not hide absence with fallback empty objects, arrays, or records in reactive store and service pipelines unless the contract itself intentionally guarantees that concrete empty value.
- Name service-layer schemas and types directly after the domain contract they describe. Prefer names such as `zodGoogleSessionStore` and `GoogleStoredSession` over generic aliases like `zodStore`, `Store`, `Schema`, or local type passthroughs that only rename the same contract.
- For document and CRDT services, route nested object writes through the service's `put`, `patch`, or change helpers before reaching for ad hoc whole-object replacement.
- Inside Automerge-backed service change callbacks, mutate existing nested document objects in place and avoid reassigning live CRDT objects back into the document.

## Anti-patterns

- Do not import Vue UI components here.
- Do not duplicate domain derivations that belong in `entities`.
- Do not add wrapper services that add no contract, invariant, or normalization.
- Do not leave data-changing flows without cache or event invalidation.
- Do not name a main-thread UI helper or DOM-bound adapter with the `*Service` suffix.
- Do not let direct `*Service` imports leak into UI-side modules. Cross the UI/background boundary through `useMainServiceClient` or another approved worker-client proxy instead.
- Do not assign an existing Automerge nested object proxy as the next value of a document field.

## Constraints

- Service changes often affect every caller above this layer.
- Contract changes must preserve or intentionally revise loading, error, and mutation semantics.
- Use `index.ts` as the external entry point when present.
- If a service branch depends on verified third-party semantics, cover that branch with a focused test instead of relying on the helper name as documentation.
- Minimum verification: `pnpm type-check` and focused unit/integration smoke checks for the touched service contract.
