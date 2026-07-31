# Managed pinned application updates — implementation preflight

**Status: ready for staged implementation.**

Authoritative architecture: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).

Existing code and tests are reusable evidence, not compatibility contracts. The feature has not shipped; old descriptor, state, snapshot, protocol, and watchdog formats are removed rather than migrated.

## Owner map

| Owner | Responsibility |
| --- | --- |
| Release contract/publication | Node publisher validator, runtime schema, shared corpus, deterministic build inputs, retained archive, idempotent publish, `latest.json` |
| Pure lifecycle | `contracts.ts`, `controllerState.ts`, `stateTransitions.ts`, snapshot/protocol release payloads |
| Worker runtime | PWA config, `src/sw.ts`, predecessor probes, reconciliation, preparation, fetch, activation |
| Client/UI | service client, entity projection, existing features, settings/widget/pane |
| Verification | colocated tests, real worker wiring, existing managed-update E2E and verify metadata |

Reuse `OperationQueue`, `PreparationCoordinator`, exact-release restoration, marker-last release caches, watchdog, channel isolation, response-before-follow-up ordering, and existing FSD owners.

Minimum design: one `/sw.js`, one active plus optional candidate, no bridge, persistent bootstrap marker, scheduler, or generic manager. Reconciliation owns one module-local promise and one rerun boolean. `PreparationCoordinator` remains preparation/cleanup-only.

## Pass order

### Pass 1 — atomic release contract, deterministic publication, and pure state

- replace UUID plus sequence with positive safe-integer `releaseNumber` in publisher and runtime together;
- establish the release-1 descriptor/state/protocol/snapshot/watchdog baseline and remove unshipped old formats;
- set managed `buildId` to the exact source commit SHA;
- derive one canonical UTC commit timestamp and pass it as managed `buildDate` to Vite `__BUILD_DATE__`, descriptor generation, and `deployment.json`;
- implement channel-local `buildId` idempotency before release-number allocation:
  - unseen `buildId` allocates next release;
  - same unique latest `buildId` plus exact channel-owned publication bytes is a zero-write no-op;
  - same latest `buildId` plus any differing byte/field rejects before writes;
  - repeated non-latest or duplicate retained `buildId` rejects before writes;
- update shared descriptor corpus, archive layout, cache identity, watchdog literals, state/snapshot/protocol types, and pure transitions atomically;
- keep `latest.json` as the final write and leave publisher/runtime parity, type checking, and focused unit verification green.

### Pass 2 — same-path bootstrap and worker runtime

- keep stable/develop managed worker at `/sw.js`;
- implement the exact concurrent managed/Workbox 5-second probe matrix;
- preserve valid state, reject invalid state, reject active-managed plus absent state, and support interrupted-install retry;
- trigger reconciliation on every owned top-level navigation, explicit Check, and successful mode changes after the response;
- implement one module-local shared promise plus one `rerunRequested` boolean:
  - a trigger during a pass joins the promise and requests a fresh-state rerun;
  - the promise resolves only after a pass completes with no pending rerun;
  - explicit Check receives the final snapshot;
- prove Manual discovery in flight followed by Automatic reaches newest `ready` without another navigation;
- prove Automatic preparation in flight followed by Manual cannot persist automatic `ready`;
- keep network/discovery outside `OperationQueue` and `PreparationCoordinator` limited to preparation/cleanup;
- implement Manual discovery without preparation and latest-first Automatic behavior with known-candidate fallback after failed discovery;
- implement clean-launch activation, fetch routing, restoration, broadcasts, watchdog handling, and cleanup;
- do not add a bridge, marker, manager, polling, persisted operation state, or once-per-worker latch.

### Pass 3 — client, entity, features, and UI

- add explicit `success | timeout | unavailable` outcomes;
- apply 10-second short and 120-second long UI deadlines;
- preserve the last valid snapshot and capability on timeout;
- project one candidate and preserve existing feature entry points/FSD ownership;
- show Manual `available` notifications from worker-owned discovery.

### Pass 4 — complete scenario proof

Rewrite existing fixtures/specs in place and prove publication reruns, Workbox bootstrap, interrupted install retry, delayed release-1 recovery, latest-first Automatic, reconciliation reruns, Manual discovery, controller compatibility from release 1 onward, clean launch, first managed rollback, restoration, isolation, uncontrolled windows, and cross-engine lifecycle.

Do not begin the next pass before focused repository verification and architect review of the previous pass.

## TEST IMPACT

**Changed contracts:** release identity/layout; deterministic build inputs; source-commit publication idempotency; release-1 compatibility baseline; descriptor parity; persisted lifecycle; predecessor compatibility; reconciliation rerun ownership; latest-first Automatic; Manual discovery; controller backward compatibility; clean-launch activation; `BOOT_OK`; client outcomes; UI candidate projection; rollback data compatibility.

**Primary proof owners:**

- publisher/runtime/shared-corpus/state/protocol/cache deterministic tests;
- stable/develop workflow and managed build-input tests;
- frozen Workbox artifact and probe tests;
- real `src/sw.ts` install/fetch/reconciliation/activation tests;
- boot-watchdog parity and app-bootstrap tests;
- app-update client/entity/feature/widget component tests;
- `tests/e2e/appUpdatesNavigation.spec.ts`;
- existing `tests/e2e/release/managedUpdates*.spec.ts` and fixtures.

**Required proof:**

- publisher/runtime descriptor parity, safe allocation, overflow/pre-write rejection, append-only archive, and `latest.json` last;
- stable/develop managed workflows pass the same commit SHA and canonical commit timestamp to build, metadata, and publisher;
- two identical publications of the latest commit produce one release and the second performs zero writes;
- the same latest commit with changed build/index/assets/controller/deployment bytes rejects before writes;
- a repeated non-latest commit and duplicate retained build identity reject before writes;
- a new commit with identical application bytes may allocate a new release;
- unshipped formats are absent and release 1 defines the managed compatibility baseline;
- complete single-candidate transition matrix;
- exact Workbox probe outcomes and managed-state-loss rejection;
- interrupted bootstrap retries without selecting another release;
- failed release-1 discovery repeats on later navigation;
- Automatic `available(B)` selects newer C before preparation; failed discovery may prepare B without advancing `lastSuccessfulCheckAt`;
- one shared promise and rerun boolean converge to fresh mode/state after concurrent triggers;
- Manual → Automatic during discovery reaches newest `ready` without an additional trigger;
- Automatic → Manual during preparation does not persist automatic `ready`;
- Manual discovery persists `available` without preparation;
- controller upgrades serve every still-supported published app/watchdog/protocol/state contract;
- controlled/uncontrolled same-channel windows, sole-window reload, concurrent activation, channel isolation, and `BOOT_OK` boundary are proven;
- release 2 proves commit, failed-boot rollback, and exact restoration;
- timeout clears busy without losing snapshot/capability;
- stale completion, fetch pass-through, cache protection, and data compatibility are covered.

Update `scripts/verify.mjs`, `scripts/lib/e2eRisk.mjs`, or other impact metadata only when durable source/spec ownership changes. Keep one mutation owner: rewritten `stateTransitions.ts`.

## Verification

After each pass, run the smallest repository-managed focused verification for every changed owner and report exact results. Pass 1 must include Node/runtime descriptor parity, publisher idempotency, managed workflow/build-input tests, type checking, and pure lifecycle tests.

After Pass 4:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

GitHub CI or raw underlying commands do not replace the final gate.

Unresolved blockers: none.

Verdict: **ready for Pass 1 task only**.
