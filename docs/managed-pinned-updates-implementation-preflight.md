# Managed pinned application updates — implementation preflight

**Status: ready for staged implementation.**

Authoritative architecture: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).

The existing PR implementation is reusable evidence, not a compatibility contract. The feature has not shipped; old descriptor, state, snapshot, and protocol payloads are removed rather than migrated.

## Owner map

| Owner | Files / responsibility |
| --- | --- |
| Publication | `scripts/pages/lib/releaseDescriptor.mjs`, `releasePublish.mjs`, stable/develop publishers |
| PWA registration identity | `config/plugins/pwa.ts`, app registration/bootstrap wiring |
| Persisted lifecycle | `src/shared/service/appUpdate/contracts.ts`, `controllerState.ts`, `stateTransitions.ts` |
| Worker runtime | `src/shared/service/appUpdate/**`, `src/sw.ts` |
| Client transport/read model | `protocol.ts`, `snapshot.ts`, `src/shared/serviceClient/appUpdate/**`, `src/entities/appUpdate/**` |
| User actions/composition | existing app-update features, `AppUpdateSettings`, `AppUpdatesPane` |
| Verification | colocated deterministic/component tests, `src/sw*.test.ts`, existing app/release E2E, `managed-updates` label |

Preserve `OperationQueue`, `PreparationCoordinator`, exact-release integrity/restoration, watchdog, channel isolation, response-before-follow-up wiring, existing FSD ownership, and existing scenario owners.

Delete old identity-conflict helpers, multi-reference transitions, snapshot reconciliation, and tests that protect only the replaced model.

## Pass order

Each pass is a separate coding-agent task. Architecture is fixed between passes. Do not start the next pass until the previous pass has focused verification and architect review.

### Pass 1 — publication identity and legacy baseline

Replace UUID + sequence with positive safe-integer `releaseNumber` in publisher schemas, retained-tree validation, layout, corpus, fixtures, and publisher tests.

For the first managed publication over legacy, archive the exact pre-overwrite deployment as release `1`, publish the managed build as release `2`, write immutable `legacy-migration.json`, and keep `latest.json` last. A new channel without a prior deployment starts at release `1` without migration metadata.

Required result: exact rollback baseline, append-only remote archive, monotonic allocation, overflow/pre-write failure safety, `latest.json` last.

### Pass 2 — runtime contracts and pure state

Replace runtime descriptor/state/snapshot/protocol contracts and pure transitions with active + one candidate. Adapt cache names, preparation, controller persistence, migration-pointer schemas, and baseline types.

Required result: no old production fields or aliases; complete transition matrix protected by deterministic tests.

### Pass 3 — script identity, install, orchestration, fetch, and watchdog

Change managed stable/develop registration from legacy `sw.js` to `managed-sw.js` while keeping the same scope. Classify the active predecessor by exact normalized `registration.active.scriptURL`; inspect frozen legacy cache/navigation evidence only after the active URL matches legacy `sw.js`.

Implement first-registration / proven legacy migration / managed-upgrade behavior. Legacy migration persists archived baseline active and latest available. Managed active plus missing state rejects even with stale legacy caches.

Rewrite discovery, Manual → Automatic reconciliation, mode/install orchestration, fetch routing, activation recovery, broadcasts, cleanup triggers, watchdog release-number payloads, and the distinct 5-second watchdog request timeout.

Required result: unambiguous controller identity, long work outside the queue, stale completions as no-ops, explicit Automatic trigger, recovery-navigation exclusion, early non-release pass-through.

### Pass 4 — client, entity, features, and UI

Introduce explicit client results: success, timeout, unavailable. Apply 10-second short UI transport and 120-second long UI transport. Timeout clears busy but preserves last snapshot/capability.

Project one candidate through client/entity/UI while preserving feature entry points and FSD ownership.

Required result: truthful candidate status/actions, finite busy behavior, timeout is not capability loss, Manual-only available notification, widget-local connectivity.

### Pass 5 — complete scenario proof

Rewrite existing fixtures and release/browser specs in place. Remove obsolete old-model scenarios; do not create parallel v2 suites.

Required result: new-channel first install, distinct-script legacy migration with rollback baseline, managed active plus stale legacy cache rejection, missing-state managed upgrade rejection, Automatic follow-up, Manual, activation, rollback, retry, restoration, isolation, uncontrolled windows, cross-engine lifecycle, and data compatibility all have proof.

## TEST IMPACT

**Changed contracts:** publication identity/layout; legacy baseline archive; service-worker filename/registration identity; install classification; state/transitions; protocol/snapshot; Automatic reconciliation; client outcomes/timeouts; fetch ownership; cache protection; UI candidate projection; rollback data compatibility.

**Primary proof owners:**

- publisher/runtime/state/protocol/cache/script-identity/client deterministic tests;
- `config/plugins/pwa.test.ts` and registration/bootstrap tests;
- `src/sw.test.ts` and `src/sw.rollbackOrdering.test.ts`;
- app-update entity/feature/widget component tests;
- `tests/e2e/appUpdatesNavigation.spec.ts`;
- existing `tests/e2e/release/managedUpdates*.spec.ts` and fixtures;
- watchdog parity and descriptor corpus tests.

**Required new proof:**

- safe-integer allocation and overflow rejection before writes;
- exact legacy deployment as release `1`, managed build as release `2`, migration pointer before latest;
- append-only archive and immutable migration pointer;
- same-scope registration changes from legacy `sw.js` to managed `managed-sw.js`;
- exact active script URL distinguishes first registration, legacy migration, managed upgrade, and unknown predecessor;
- active managed + absent/invalid + stale legacy cache rejects installation;
- legacy baseline stays active and managed release requires `BOOT_OK`;
- complete candidate transitions and supersession policy;
- Manual → Automatic follow-up for available, failed, none, ready, activating;
- explicit timeout clears busy while preserving snapshot/capability; late broadcast refreshes;
- watchdog 5-second request timeout distinct from UI and activation deadlines;
- stale mode/number/phase completion matrix;
- early non-release pass-through without state/cache access;
- expired-navigation rollback exclusion;
- active + candidate + in-flight cache protection;
- previous supported active can read data after rollback.

**Impact metadata:** keep current spec paths where possible. Update `scripts/verify.mjs`, `scripts/lib/e2eRisk.mjs`, or another registry only when a spec path or durable ownership relation changes. Keep one mutation owner: rewritten `stateTransitions.ts`.

Task-specific measurements: none.

## Verification

After each pass, run the smallest repository-managed focused verification for changed contracts and report the exact result.

After Pass 5:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

GitHub CI or raw underlying commands do not replace the final gate.

## Readiness

Owners, compatibility, pass boundaries, proof ownership, and verification are resolved.

Unresolved blockers: none.

Verdict: **ready for Pass 1 task only**.
