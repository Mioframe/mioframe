# Managed pinned application updates — implementation preflight

**Status: ready for staged implementation.**

Authoritative architecture: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).

The existing PR implementation is reusable evidence, not a compatibility contract. The feature has not shipped; old descriptor, state, snapshot, and protocol payloads are removed rather than migrated.

## Owner map

| Owner | Files / responsibility |
| --- | --- |
| Release contract | Node publisher validators, runtime descriptor schemas, shared descriptor corpus, migration pointer |
| Publication | `scripts/pages/lib/releasePublish.mjs`, stable/develop publishers, retained archive and bridge artifacts |
| Persisted lifecycle | `src/shared/service/appUpdate/contracts.ts`, `controllerState.ts`, `stateTransitions.ts` |
| Bridge packaging/runtime | PWA build configuration, frozen `sw.js` bridge source, bridge registration replacement and tests |
| Managed worker runtime | `src/shared/service/appUpdate/**`, `src/sw.ts` or renamed managed worker entry |
| Client transport/read model | `protocol.ts`, `snapshot.ts`, `src/shared/serviceClient/appUpdate/**`, `src/entities/appUpdate/**` |
| User actions/composition | existing app-update features, `AppUpdateSettings`, `AppUpdatesPane` |
| Verification | colocated deterministic/component tests, worker wiring tests, existing app/release E2E, `managed-updates` label |

Preserve `OperationQueue`, `PreparationCoordinator`, exact-release integrity/restoration, watchdog, channel isolation, response-before-follow-up ordering, existing FSD ownership, and existing scenario owners.

Delete old identity-conflict helpers, multi-reference transitions, snapshot reconciliation, and tests that protect only the replaced model.

## Pass order

Each pass is a separate coding-agent task. Architecture is fixed between passes. Do not start the next pass until the previous pass is internally complete, repository-consistent, focused verification has passed, and architect review is complete.

No pass may intentionally leave publisher and runtime descriptor contracts incompatible for a later agent to repair.

### Pass 1 — atomic release contract, publication, and pure state

Change the complete release identity contract atomically:

- replace UUID + sequence with positive safe-integer `releaseNumber` in both Node publisher validation and runtime schemas;
- update the shared descriptor corpus and both parity owners in the same pass;
- add immutable legacy migration pointer validation;
- archive the exact pre-overwrite legacy deployment as release `1` and publish the first managed build as release `2`;
- preserve the frozen bridge artifact and write migration metadata before `latest.json`;
- replace persisted lifecycle state with active + one discriminated candidate;
- update pure transitions, snapshot/protocol release payload types, cache names, preparation identity, controller persistence, and watchdog release-number literals sufficiently to keep the repository type-safe and contract-consistent;
- remove old identity conflict helpers and old-model pure tests.

Required result:

- publisher and runtime accept exactly the same descriptor format through the shared corpus;
- no production or active-test `releaseId` / `releaseSequence` contract remains;
- exact rollback baseline, append-only archive, monotonic allocation, overflow/pre-write safety, and `latest.json`-last are proven;
- complete single-candidate pure transition matrix is proven;
- no orchestration, bridge lifecycle, or UI behavior is invented in this pass.

### Pass 2 — migration bridge and managed worker runtime

Implement the reachable two-stage controller path:

- retain legacy/future migration URL `sw.js` as the byte-stable per-channel migration bridge;
- build/register final controller as `managed-sw.js` at the same scope;
- make the normal managed app registration target `managed-sw.js`;
- implement bridge install validation, exact baseline preparation, final-side-effect state write, exact baseline navigation/assets, exact `registerSW.js` replacement, and read-only bridge probe;
- implement managed-controller probe and final install classification;
- reject active bridge/managed predecessor with absent or invalid state;
- rewrite discovery, Automatic reconciliation, mode/install orchestration, fetch routing, activation recovery, broadcasts, cleanup triggers, and watchdog handling;
- keep bridge behavior migration-only.

Automatic reconciliation must use one shared operation and two explicit triggers:

- after successful Manual → Automatic, after the response;
- once per managed worker instance from the first eligible owned navigation, under that fetch event's `waitUntil`, without delaying navigation.

For fresh Automatic state it must prepare `available`, discover newer for `failed`/none, and no-op for `ready`/`activating`. The navigation trigger is required for bridge-created `automatic + available` state and for managed worker restarts.

Required result:

- an old cache-first Workbox shell reaches the bridge through native `sw.js` update checks;
- a bridge-controlled baseline page explicitly registers `managed-sw.js` without racing the legacy registration script;
- final managed install accepts only a positively identified bridge or previous managed predecessor with valid state;
- bridge handoff candidate is prepared by first-navigation Automatic reconciliation without requiring a mode change;
- long work remains outside the queue, stale completions are no-ops, current recovery navigation is excluded from rollback reload, and non-release requests never enter managed handling.

### Pass 3 — client, entity, features, and UI

Introduce explicit client results: success, timeout, unavailable. Apply 10-second short UI transport and 120-second long UI transport. Timeout clears busy but preserves the last valid snapshot and capability.

Project one candidate through client/entity/UI while preserving feature entry points and FSD ownership.

Required result: truthful candidate status/actions, finite busy behavior, timeout is not capability loss, Manual-only available notification, widget-local connectivity.

### Pass 4 — complete scenario proof

Rewrite existing fixtures and release/browser specs in place. Remove obsolete old-model scenarios; do not create parallel v2 suites.

Required result: new-channel first install, native legacy → bridge discovery, archived baseline rollback, bridge → managed registration, final managed handoff, first-navigation Automatic reconciliation, managed missing-state rejection, Automatic follow-up, Manual, activation, rollback, retry, restoration, isolation, uncontrolled windows, cross-engine lifecycle, and data compatibility all have proof.

## TEST IMPACT

**Changed contracts:** publication identity/layout; shared descriptor parity; legacy baseline archive; frozen bridge artifact; service-worker migration chain; controller-kind probes; install classification; persisted state/transitions; protocol/snapshot; Automatic reconciliation triggers; client outcomes/timeouts; fetch ownership; cache protection; UI candidate projection; rollback data compatibility.

**Primary proof owners:**

- publisher/runtime/shared-corpus/state/protocol/cache deterministic tests;
- PWA packaging and bridge byte-stability tests;
- bridge and final managed worker wiring tests;
- app-update entity/feature/widget component tests;
- `tests/e2e/appUpdatesNavigation.spec.ts`;
- existing `tests/e2e/release/managedUpdates*.spec.ts` and fixtures;
- watchdog parity tests.

**Required new proof:**

- publisher/runtime descriptor parity after one atomic pass;
- safe-integer allocation and overflow rejection before writes;
- exact legacy deployment as release `1`, managed build as release `2`, migration pointer before latest;
- append-only archive, immutable migration pointer, and byte-stable retained bridge;
- legacy cached shell continues registering `sw.js`, while native update discovers the bridge;
- bridge replacement registration script registers `managed-sw.js` at the same scope;
- bridge writes active baseline plus available candidate as its final required install side effect and never activates the candidate;
- final controller positively identifies bridge/managed predecessor;
- bridge/managed predecessor plus absent or invalid state rejects installation;
- complete candidate transitions and supersession policy;
- Manual → Automatic reconciliation for available, failed, none, ready, activating;
- first-navigation reconciliation prepares bridge-created Automatic available candidate and is once-per-worker deduplicated;
- explicit timeout clears busy while preserving snapshot/capability; late broadcast refreshes;
- controller-kind and watchdog 5-second timeouts remain distinct from UI and activation deadlines;
- stale mode/number/phase completion matrix;
- early non-release pass-through without state/cache access;
- expired-navigation rollback exclusion;
- active + candidate + in-flight cache protection;
- previous supported active can read data after rollback.

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

Owners, atomic contract boundary, bridge lifecycle, Automatic triggers, pass boundaries, proof ownership, and verification are resolved.

Unresolved blockers: none.

Verdict: **ready for Pass 1 task only**.
