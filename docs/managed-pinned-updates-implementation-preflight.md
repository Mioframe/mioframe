# Managed pinned application updates — implementation preflight

**Status: ready for staged implementation.**

Authoritative architecture: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).

The existing PR implementation is reusable evidence, not a compatibility contract. The feature has not shipped; old descriptor, state, snapshot, and protocol payloads are removed rather than migrated.

## Owner map

| Owner                       | Files / responsibility                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Release contract            | Node publisher validator, runtime descriptor schema, shared descriptor corpus                                   |
| Publication                 | `scripts/pages/lib/releasePublish.mjs`, stable/develop publishers, retained managed archive                     |
| Persisted lifecycle         | `src/shared/service/appUpdate/contracts.ts`, `controllerState.ts`, `stateTransitions.ts`                        |
| Worker runtime              | PWA configuration, `src/sw.ts`, `src/shared/service/appUpdate/**`                                               |
| Client transport/read model | `protocol.ts`, `snapshot.ts`, `src/shared/serviceClient/appUpdate/**`, `src/entities/appUpdate/**`              |
| User actions/composition    | existing app-update features, `AppUpdateSettings`, `AppUpdatesPane`                                             |
| Verification                | colocated deterministic/component tests, worker wiring tests, existing app/release E2E, `managed-updates` label |

Preserve `OperationQueue`, `PreparationCoordinator`, exact-release integrity/restoration, watchdog, channel isolation, response-before-follow-up ordering, existing FSD ownership, and existing scenario owners.

Delete old identity-conflict helpers, multi-reference transitions, snapshot reconciliation, and tests that protect only the replaced model.

## Pass order

Each pass is a separate coding-agent task. Architecture is fixed between passes. Do not start the next pass until the previous pass is repository-consistent, focused verification has passed, and architect review is complete.

No pass may intentionally leave publisher and runtime descriptor contracts incompatible for a later agent to repair.

### Pass 1 — atomic release contract, publication, and pure state

Change the complete release/state contract atomically:

- replace UUID + sequence with positive safe-integer `releaseNumber` in Node publisher and runtime validation;
- update the shared descriptor corpus and both parity owners in the same pass;
- rewrite retained-tree validation and publication layout without legacy baseline/migration metadata;
- start a new managed archive at release `1` and keep `latest.json` last;
- replace persisted lifecycle with active + one discriminated candidate;
- update pure transitions, snapshot/protocol release payload types, cache names, preparation identity, controller persistence, and watchdog release-number literals sufficiently to keep the repository type-safe and contract-consistent;
- remove old identity-conflict helpers and old-model pure tests.

Required result:

- publisher and runtime accept exactly the same descriptor format;
- no production or active-test `releaseId` / `releaseSequence` contract remains;
- append-only archive, monotonic allocation, overflow/pre-write safety, and `latest.json`-last are proven;
- complete single-candidate pure transition matrix is proven;
- no worker orchestration or UI behavior is invented in this pass.

### Pass 2 — same-path bootstrap and managed worker runtime

Keep the existing channel-scoped `/sw.js` path so legacy Workbox registrations discover the managed worker through native update checks.

Implement:

- the independent per-channel managed-controller marker;
- install ordering: exact preparation → controller state → marker → install success;
- valid-state marker repair without changing release selection;
- fail-closed marker + absent-state behavior;
- genuine first registration bootstrap;
- supported legacy Workbox bootstrap from exact known precache, deployment, navigation fallback, and registration-shell evidence;
- explicit exclusion of rollback to the pre-managed Workbox deployment;
- tracked post-activation removal of legacy caches;
- discovery, Automatic reconciliation, mode/install orchestration, fetch routing, activation recovery, broadcasts, cleanup triggers, and watchdog handling.

Automatic reconciliation must use one operation and two triggers:

- after successful Manual → Automatic, after the response;
- once per worker instance from the first eligible owned navigation under that fetch event's `waitUntil`, without delaying navigation.

Required result:

- installed Workbox PWA reaches the managed worker at the same `/sw.js`;
- bootstrap failure leaves Workbox active;
- successful bootstrap selects verified latest as initial managed baseline without claiming rollback to Workbox;
- marker prevents later absent state from being treated as a first bootstrap;
- valid state remains authoritative when marker repair is needed;
- long work remains outside the queue;
- stale completions are no-ops;
- current recovery navigation is excluded from rollback reload;
- non-release requests never enter managed handling.

### Pass 3 — client, entity, features, and UI

Introduce explicit client results: success, timeout, unavailable.

Apply:

- 10-second short UI transport timeout;
- 120-second long UI transport timeout;
- timeout clears busy state but preserves the last valid snapshot and capability.

Project one candidate through client/entity/UI while preserving feature entry points and FSD ownership.

Required result: truthful candidate status/actions, finite busy behavior, timeout is not capability loss, Manual-only available notification, widget-local connectivity.

### Pass 4 — complete scenario proof

Rewrite existing fixtures and release/browser specs in place. Remove obsolete old-model and bridge scenarios; do not create parallel v2 suites.

Required result: new registration, native Workbox-to-managed same-path bootstrap, bootstrap failure, marker fail-closed behavior, marker repair, first later managed candidate, Automatic/Manual flows, activation, rollback, retry, restoration, isolation, uncontrolled windows, cross-engine lifecycle, and data compatibility all have proof.

## TEST IMPACT

**Changed contracts:** publication identity/layout; shared descriptor parity; initial Workbox bootstrap boundary; managed-controller marker; persisted state/transitions; protocol/snapshot; Automatic reconciliation; client outcomes/timeouts; fetch ownership; cache protection; UI candidate projection; rollback data compatibility.

**Primary proof owners:**

- publisher/runtime/shared-corpus/state/protocol/cache deterministic tests;
- PWA configuration and managed marker tests;
- real `src/sw.ts` wiring tests;
- app-update entity/feature/widget component tests;
- `tests/e2e/appUpdatesNavigation.spec.ts`;
- existing `tests/e2e/release/managedUpdates*.spec.ts` and fixtures;
- watchdog parity tests.

**Required new proof:**

- publisher/runtime descriptor parity after one atomic pass;
- safe-integer allocation and overflow rejection before writes;
- new managed archive starts at release `1` without a legacy descriptor or migration pointer;
- append-only remote archive;
- legacy registration discovers byte-different managed `/sw.js` through native update;
- genuine first registration versus exact supported Workbox bootstrap versus ambiguous predecessor;
- install succeeds only after exact release preparation, state persistence, and marker persistence;
- marker present + absent state rejects bootstrap even when legacy caches remain;
- valid state + missing marker repairs marker without changing release selection;
- bootstrap failure leaves legacy worker active;
- successful bootstrap makes latest the initial managed baseline and does not claim Workbox rollback;
- the next managed release receives normal candidate activation and rollback proof;
- complete candidate transitions and supersession policy;
- Manual → Automatic reconciliation for available, failed, none, ready, and activating;
- first-navigation reconciliation is once-per-worker deduplicated;
- explicit timeout clears busy while preserving snapshot/capability; late broadcast refreshes;
- watchdog timeout remains distinct from UI and activation deadlines;
- stale mode/number/phase completion matrix;
- early non-release pass-through without state/cache access;
- expired-navigation rollback exclusion;
- active + candidate + in-flight cache protection;
- previous supported managed active can read data after rollback.

**Impact metadata:** keep current spec paths where possible. Update `scripts/verify.mjs`, `scripts/lib/e2eRisk.mjs`, or another registry only when a spec path or durable ownership relation changes. Keep one mutation owner: rewritten `stateTransitions.ts`.

Task-specific measurements: none.

## Verification

After each pass, run the smallest repository-managed focused verification for changed contracts and report the exact result.

Pass 1 must include all affected Node and runtime parity/type/unit owners in one successful focused verification. A green publisher-only suite is insufficient.

After Pass 4:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

GitHub CI or raw underlying commands do not replace the final gate.

## Readiness

Owners, atomic contract boundary, same-path bootstrap, marker ownership, managed rollback boundary, pass boundaries, proof ownership, and verification are resolved.

Unresolved blockers: none.

Verdict: **ready for Pass 1 task only**.
