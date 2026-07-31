# Managed pinned application updates — implementation preflight

**Status: ready for staged implementation.**

Authoritative architecture: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).

The existing PR implementation is reusable evidence, not a compatibility contract. The feature has not shipped; old descriptor, state, snapshot, and protocol payloads are removed rather than migrated.

## Owner map

| Owner                       | Files / responsibility                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Publication                 | `scripts/pages/lib/releaseDescriptor.mjs`, `releasePublish.mjs`, stable/develop publisher entry points               |
| Persisted lifecycle         | `src/shared/service/appUpdate/contracts.ts`, `controllerState.ts`, `stateTransitions.ts`                             |
| Worker runtime              | `src/shared/service/appUpdate/**`, `src/sw.ts`                                                                       |
| Client transport/read model | `protocol.ts`, `snapshot.ts`, `src/shared/serviceClient/appUpdate/**`, `src/entities/appUpdate/**`                   |
| User actions/composition    | existing app-update features, `AppUpdateSettings`, `AppUpdatesPane`                                                  |
| Verification                | colocated deterministic/component tests, `src/sw*.test.ts`, existing app/release E2E, `managed-updates` verify label |

Preserve `OperationQueue`, `PreparationCoordinator`, exact-release integrity/restoration, watchdog, channel isolation, response-before-follow-up wiring, existing FSD ownership, and existing scenario owners.

Delete old identity-conflict helpers, multi-reference transitions, snapshot reconciliation, and tests that protect only the replaced model.

## Pass order

Each pass is a separate coding-agent task. Architecture is fixed between passes. Do not start the next pass until the previous pass has focused verification and architect review.

### Pass 1 — publication identity and legacy baseline

Replace UUID + sequence with positive safe-integer `releaseNumber` in publisher schemas, retained-tree validation, layout, corpus, fixtures, and publisher tests.

For the first managed publication over a legacy deployment, archive the exact pre-overwrite channel deployment as release `1`, publish the new managed build as release `2`, write immutable `legacy-migration.json`, and keep `latest.json` last. A new channel without a legacy deployment starts at release `1` without migration metadata.

Required result: exact rollback baseline for legacy migration, append-only remote archive, monotonic allocation, overflow/pre-write failure safety, and `latest.json` last.

### Pass 2 — runtime contracts and pure state

Replace runtime descriptor/state/snapshot/protocol contracts and pure transitions with active + one candidate. Adapt cache names, preparation, controller-state persistence, migration-pointer schemas, and first-registration/legacy-baseline types.

Required result: no old production fields or aliases; complete transition matrix protected by deterministic tests.

### Pass 3 — install classification, orchestration, fetch, and watchdog

Implement the narrow managed-controller probe and explicit first-registration / proven legacy migration / managed-upgrade classification. Legacy migration persists the archived baseline as active and latest as available candidate. Managed active plus missing state rejects even when stale legacy caches remain.

Rewrite discovery, Manual → Automatic reconciliation, mode/install orchestration, fetch routing, activation recovery, broadcasts, cleanup triggers, and watchdog release-number payloads/timeouts.

Required result: long work remains outside the queue, stale completions are no-ops, Automatic receives an explicit deferred trigger, current recovery navigation is excluded from rollback reload, and non-release fetches never enter managed handling.

### Pass 4 — client, entity, features, and UI

Introduce explicit client transport outcomes: success, timeout, and unavailable. Apply 10-second short UI timeout and 120-second long UI timeout. A timeout clears busy state but preserves the last valid snapshot and capability.

Project one candidate through the client/entity/UI while preserving feature entry points and FSD ownership.

Required result: truthful candidate-phase status/actions, finite busy behavior, timeout is not capability loss, Manual-only available notification, widget-local connectivity.

### Pass 5 — complete scenario proof

Rewrite existing managed-update fixtures and release/browser specs in place. Remove obsolete old-model scenarios; do not create parallel v2 suites.

Required result: new-channel first install, archived legacy migration rollback, managed active plus stale legacy cache rejection, missing-state managed upgrade rejection, Automatic follow-up, Manual, activation, rollback, retry, restoration, isolation, uncontrolled windows, cross-engine lifecycle, and data-compatibility boundary all have the required proof.

## TEST IMPACT

**Changed contracts:** publication identity/layout; one-time legacy baseline archive; managed-controller probe and install classification; persisted state/transitions; protocol/snapshot; Automatic mode reconciliation; client transport outcomes/timeouts; worker fetch ownership; local cache protection; UI candidate projection; rollback data compatibility.

**Primary proof owners:**

- publisher/runtime/state/protocol/cache/probe/client deterministic tests;
- `src/sw.test.ts` and `src/sw.rollbackOrdering.test.ts` for real wiring;
- app-update entity/feature/widget component tests;
- `tests/e2e/appUpdatesNavigation.spec.ts`;
- existing `tests/e2e/release/managedUpdates*.spec.ts` and managed-release fixtures;
- watchdog parity and descriptor corpus tests.

**Required new proof:**

- safe-integer allocation and overflow rejection before writes;
- exact legacy deployment archived as release `1`, new build as release `2`, migration pointer written before latest;
- append-only remote archive and immutable migration pointer;
- genuine first registration versus proven legacy migration versus managed upgrade;
- managed active + absent/invalid state + stale legacy cache rejects installation;
- legacy baseline remains active and new managed release requires `BOOT_OK`;
- complete single-candidate transitions and supersession policy;
- Manual → Automatic follow-up for available, failed, no candidate, ready, and activating;
- explicit timeout result clears busy while preserving snapshot/capability; late broadcast refreshes state;
- watchdog 5-second request timeout remains distinct from UI and activation deadlines;
- stale mode/number/phase completion matrix;
- early non-release pass-through without state/cache access;
- expired-navigation rollback exclusion;
- active + candidate + in-flight cache protection;
- previous supported active release remains able to read data after rollback.

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
