# Managed pinned application updates — implementation preflight

**Status: ready for staged implementation.**

Authoritative architecture: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).

The existing PR implementation is reusable evidence, not a compatibility contract. The feature has not shipped; old descriptor, state, snapshot, and protocol payloads are removed rather than migrated.

## Owner map

| Owner                    | Files / responsibility                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Publication              | `scripts/pages/lib/releaseDescriptor.mjs`, `releasePublish.mjs`, stable/develop publisher entry points               |
| Persisted lifecycle      | `src/shared/service/appUpdate/contracts.ts`, `controllerState.ts`, `stateTransitions.ts`                             |
| Worker runtime           | `src/shared/service/appUpdate/**`, `src/sw.ts`                                                                       |
| Client/UI read model     | `protocol.ts`, `snapshot.ts`, `src/shared/serviceClient/appUpdate/**`, `src/entities/appUpdate/**`                   |
| User actions/composition | existing app-update features, `AppUpdateSettings`, `AppUpdatesPane`                                                  |
| Verification             | colocated deterministic/component tests, `src/sw*.test.ts`, existing app/release E2E, `managed-updates` verify label |

Preserve `OperationQueue`, `PreparationCoordinator`, exact-release integrity/restoration, watchdog, channel isolation, response-before-follow-up wiring, existing FSD ownership, and existing scenario owners.

Delete old identity-conflict helpers, multi-reference transitions, snapshot reconciliation, and tests that protect only the replaced model.

## Pass order

Each pass is a separate coding-agent task. Architecture is fixed between passes. Do not start the next pass until the previous pass has focused verification and architect review.

### Pass 1 — publication identity

Replace UUID + sequence with positive safe-integer `releaseNumber` in publisher schemas, retained-tree validation, layout, corpus, fixtures, and publisher tests.

Required result: append-only remote archive, exact monotonic allocation, overflow/pre-write failure safety, `latest.json` last.

### Pass 2 — runtime contracts and pure state

Replace runtime descriptor/state/snapshot/protocol contracts and pure transitions with active + one candidate. Adapt cache names, preparation, controller-state persistence, and first-install baseline types.

Required result: no old production fields or aliases; complete transition matrix protected by deterministic tests.

### Pass 3 — install classification, orchestration, fetch, and transport

Implement explicit first-registration / proven legacy migration / managed-upgrade classification; fail closed for runtime absent/invalid; add the finite two-minute long-request transport timeout; rewrite discovery, mode/install orchestration, fetch routing, activation recovery, broadcasts, and cleanup triggers.

Required result: long work remains outside the queue, stale completions are no-ops, current recovery navigation is excluded from rollback reload, and non-release fetches never enter managed handling.

### Pass 4 — client, entity, features, and UI

Project one candidate through the client/entity/UI while preserving feature entry points and FSD ownership.

Required result: truthful candidate-phase status/actions, finite busy behavior, Manual-only available notification, widget-local connectivity.

### Pass 5 — complete scenario proof

Rewrite existing managed-update fixtures and release/browser specs in place. Remove obsolete old-model scenarios; do not create parallel v2 suites.

Required result: first install, proven legacy migration, managed upgrade with missing-state rejection, Automatic, Manual, activation, rollback, retry, restoration, isolation, uncontrolled windows, and cross-engine lifecycle all pass.

## TEST IMPACT

**Changed contracts:** publication identity/layout; install classification; persisted state/transitions; protocol/snapshot; client transport timeout; worker orchestration/fetch ownership; local cache protection; UI candidate projection.

**Primary proof owners:**

- publisher/runtime/state/protocol/cache/client deterministic tests;
- `src/sw.test.ts` and `src/sw.rollbackOrdering.test.ts` for real wiring;
- app-update entity/feature/widget component tests;
- `tests/e2e/appUpdatesNavigation.spec.ts`;
- existing `tests/e2e/release/managedUpdates*.spec.ts` and managed-release fixtures;
- watchdog parity and descriptor corpus tests.

**Required new proof:**

- safe-integer allocation and overflow rejection before writes;
- append-only remote archive;
- genuine first registration versus proven legacy migration versus missing-state managed upgrade;
- initial baseline exception;
- runtime absent/invalid owned-request `503`;
- complete single-candidate transitions and supersession policy;
- two-minute long-request timeout clears busy while late broadcast refreshes state;
- stale mode/number/phase completion matrix;
- early non-release pass-through without state/cache access;
- expired-navigation rollback exclusion;
- active + candidate + in-flight cache protection.

**Impact metadata:** keep current spec paths where possible. Update `scripts/verify.mjs`, `scripts/lib/e2eRisk.mjs`, or another registry only when a spec path or durable ownership relation actually changes. Keep one mutation owner: rewritten `stateTransitions.ts`.

Task-specific measurements: none.

## Verification

After each pass, run the smallest repository-managed focused verification for its changed contracts and report the exact result.

After Pass 5:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

GitHub CI or raw underlying test commands do not replace the final gate.

## Readiness

Owners, compatibility, pass boundaries, proof ownership, and verification are resolved.

Unresolved blockers: none.

Verdict: **ready for Pass 1 task only**.
