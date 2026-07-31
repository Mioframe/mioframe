# Managed pinned application updates — implementation preflight

**Status: ready for staged implementation.**

Authoritative architecture: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).

Existing code and tests are reusable evidence, not compatibility contracts. The feature has not shipped; old descriptor, state, snapshot, protocol, and watchdog formats are removed rather than migrated.

The seven stages below are sequential review checkpoints inside one draft PR. They are not independently mergeable product increments. Each stage must leave all changed owners, repository type checking, and its focused verification green before the next stage begins.

## Owner map

| Owner | Responsibility |
| --- | --- |
| Release publication | deterministic source identity, Node descriptor validation, archive, idempotent publish, `latest.json` |
| Pure controller contracts | runtime descriptor validation, state, protocol, snapshot, watchdog literals, transitions |
| Bootstrap and serving | same-path migration, initial state, active-release fetch, exact restoration |
| Discovery and preparation | Manual/Automatic reconciliation, latest-first policy, in-flight joining, preparation coordination |
| Activation and rollback | clean launch, activation deadline, `BOOT_OK`, failure rollback, broadcasts, cleanup |
| Client and UI | transport outcomes, entity projection, features, settings, notifications |
| Verification | colocated tests, real worker wiring, release E2E, verify metadata |

Reuse `OperationQueue`, `PreparationCoordinator`, marker-last release caches, exact-release restoration, watchdog, channel isolation, response-before-follow-up ordering, and existing FSD owners.

Minimum design: one `/sw.js`, one active plus optional candidate, one IndexedDB state record, no bridge, persistent bootstrap marker, scheduler, registry, or generic manager.

## Stage order

### Stage 1 — deterministic publication and release identity

**Final artifact:** a publisher that can safely allocate and publish immutable managed releases without creating a second release for a workflow rerun of the same source commit.

- use positive safe-integer `releaseNumber` in the Node publication contract and archive layout;
- set `buildId` to the exact source commit SHA;
- derive the canonical UTC committer timestamp once and pass it as managed `buildDate` to Vite `__BUILD_DATE__`, descriptor generation, and `deployment.json`;
- validate the complete retained tree and unique retained `buildId` values before allocation or writes;
- implement the minimal channel-local rule:
  - absent `buildId` → allocate and publish;
  - unique latest `buildId` → return retained descriptor and perform zero writes;
  - non-latest or duplicate retained `buildId` → reject before writes;
- do not reconstruct or compare a previous release output on the no-op path;
- preserve immutable collision checks for new releases and `latest.json` as the final write;
- keep worker/runtime behavior unchanged in this stage except for compile-only adaptations strictly required by the Node contract.

### Stage 2 — pure controller contracts and state

**Final artifact:** one explicit release-1 runtime contract with a complete deterministic transition matrix and publisher/runtime descriptor parity.

- establish runtime descriptor validation matching the Stage 1 Node descriptor corpus;
- replace the unshipped UUID/multi-reference lifecycle with one active release and one discriminated candidate;
- establish protocol, snapshot, watchdog literals, cache identity, and release summaries for the release-1 baseline;
- implement the complete pure transition table for discovery, preparation, Manual Install/Cancel/retry, clean-launch activation, `BOOT_OK`, failure/expiration, and stale completion;
- remove old unshipped formats instead of preserving or migrating them;
- keep one mutation owner: `stateTransitions.ts`.

### Stage 3 — bootstrap and active-release serving

**Final artifact:** a managed `/sw.js` can safely replace compatible Workbox, initialize release 1, and serve or restore only the selected active release.

- keep stable/develop at the same channel-scoped `/sw.js`;
- implement the exact concurrent managed/Workbox probe outcome matrix;
- preserve valid state, reject invalid state, reject active-managed plus absent state, and allow only genuine first registration or compatible Workbox bootstrap;
- fully prepare release 1 before persisting initial Automatic state;
- prove interrupted install after state persistence retries safely without a marker;
- implement active-release navigation/assets fetch ownership and exact immutable restoration;
- return controlled `503` for owned requests with absent/invalid state or unavailable exact release;
- do not implement discovery, candidate preparation, activation, or rollback in this stage beyond compile-safe boundaries.

### Stage 4 — discovery and preparation

**Final artifact:** Manual and Automatic modes produce the correct `available` or `ready` candidate without redundant network passes or new orchestration abstractions.

- trigger reconciliation from owned top-level navigation, explicit Check, and successful mode changes;
- own exactly one module-local `inFlightPromise` and one `rerunRequested` boolean;
- navigation and explicit Check join an in-flight operation without requesting another pass;
- a mode change during an in-flight pass joins and requests one fresh-state rerun;
- explicit Check receives the final shared snapshot;
- implement Manual discovery without background preparation;
- implement latest-first Automatic behavior, including replacing stale `available(B)` with newer C before preparation;
- when latest discovery fails, allow fallback preparation of known B without advancing `lastSuccessfulCheckAt`;
- keep network/discovery outside `OperationQueue` and keep `PreparationCoordinator` limited to preparation deduplication and cleanup arbitration;
- prove both mode-change races without another navigation.

### Stage 5 — activation and rollback

**Final artifact:** a prepared candidate activates only on a qualifying clean launch and either commits after verified boot or returns to the previous release.

- implement controlled and uncontrolled same-channel window checks;
- treat reload of the sole remaining window as a new clean launch without browser-specific classification;
- serialize only the short `ready → activating` transition through `OperationQueue`;
- serve the activating candidate while preserving the previous active release in state;
- emit `BOOT_OK` only after root mount, initial routing, and first render;
- implement activation deadline, matching `BOOT_FAILED`, expiration, stale acknowledgement handling, and exact rollback;
- preserve response-before-follow-up ordering, broadcasts, protected-release cleanup, and controller compatibility obligations.

### Stage 6 — client, entity, features, and UI

**Final artifact:** existing product entry points expose the managed lifecycle without duplicating worker state or losing capability on transport timeout.

- add explicit `success | timeout | unavailable` outcomes;
- apply 10-second short and 120-second Check/Install deadlines;
- preserve the last valid snapshot and capability on timeout;
- project one candidate through the existing entity owner;
- preserve feature actions and FSD dependency direction;
- show Manual `available` notifications and settings state without adding polling or local lifecycle truth.

### Stage 7 — complete scenario proof

**Final artifact:** the full PR is proven across publisher, worker, client, UI, and browser lifecycle and is eligible for final architecture review.

- rewrite existing fixtures/specs in place rather than creating parallel legacy suites;
- prove publication rerun no-op, retained-tree rejection, Workbox bootstrap, interrupted install retry, delayed release-1 recovery, latest-first Automatic, mode-change races, Manual discovery, clean launch, first managed rollback, restoration, isolation, uncontrolled windows, and cross-engine lifecycle;
- prove controller and user-data compatibility for every still-supported published release;
- update verify impact metadata only where durable source/spec ownership changed;
- run final managed-update and release gates.

Do not begin the next stage before focused repository-managed verification and architect review of the current stage.

## TEST IMPACT

**Stage 1:** Node publisher/archive tests, stable/develop workflow inputs, deterministic metadata, latest rerun zero-write proof, non-latest/duplicate rejection, new-release collision and latest-last ordering.

**Stage 2:** shared descriptor corpus parity, state/schema/protocol/snapshot/watchdog contract tests, complete pure transition matrix and mutation coverage.

**Stage 3:** frozen Workbox artifact probes, install classification, initial-state crash consistency, active fetch pass-through/ownership, exact restoration and controlled `503`.

**Stage 4:** reconciliation unit/wiring tests, join-only navigation/Check behavior, mode-change-only rerun, latest-first replacement, failed-discovery fallback, Manual discovery, coordinator integration.

**Stage 5:** clean-launch client enumeration, concurrent activation, watchdog boundary, commit/rollback/expiration/stale acknowledgement, broadcasts and protected cleanup.

**Stage 6:** app-update client, entity, feature, widget, settings, notifications, finite busy state and timeout preservation.

**Stage 7:** `tests/e2e/appUpdatesNavigation.spec.ts`, existing `tests/e2e/release/managedUpdates*.spec.ts`, cross-engine lifecycle, isolation, data compatibility, final verification.

## Verification

After every stage, run the smallest repository-managed focused verification for every changed owner and report exact results. Type checking must remain green after every stage.

After Stage 7:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

GitHub CI or raw underlying commands do not replace the final release gate.

## Forbidden

- asking the coding agent to redesign ownership or choose unresolved alternatives;
- merging or marking the PR ready before Stage 7 and complete review;
- full-output reconstruction or byte comparison for a repeated latest `buildId`;
- rerun requests from concurrent navigation or explicit Check;
- bridge, second worker path, persistent bootstrap marker, polling, retry scheduler, operation journal, release registry, or generic manager;
- moving discovery into `PreparationCoordinator` or long work into `OperationQueue`;
- more than one candidate or superseding `ready`/`activating`;
- preserving unshipped old formats;
- `skipWaiting()`, `clients.claim()`, live-deployment fallback for owned requests, browser-specific reload logic, irreversible data migration, or shared Material/global-style changes.

Unresolved blockers: none.

Verdict: **ready for Stage 1 task only**.
