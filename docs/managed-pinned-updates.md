# Managed pinned application updates — architecture handoff

**Implementation readiness: ready.**

This document is the canonical implementation contract for managed application-release updates. It replaces the previous multi-reference controller-state design in PR 169. Implementation must rewrite the affected core against this handoff rather than patch the replaced state model.

The general Pages publication and release process remains documented in [`docs/release.md`](./release.md).

## Goal

Provide reliable offline-capable application updates for the stable (`/`) and develop (`/branch/develop/`) PWA channels:

- Automatic mode discovers and prepares newer immutable releases;
- Manual mode lets the user defer an available release indefinitely;
- an approved release starts only on a clean launch after all same-channel windows close;
- a release becomes active only after confirmed application boot;
- failed activation returns to the previous active release;
- a selected release is restored only from its exact immutable archive;
- controller-worker upgrades never silently change the selected application release.

## Confirmed current behavior and reason for rewrite

PR 169 already proves the required browser lifecycle, immutable archive, integrity, channel isolation, boot watchdog, protocol, restoration, rollback, and UI scenarios. Those mechanisms remain valid.

The replaced controller state stores one future release through four independent optional references (`latestRelease`, `approvedRelease`, `activation.targetRelease`, and `failedActivationRelease`) and identifies every release with both UUID and sequence. Repeated review found defects caused by synchronizing those representations, command phases, fetch ownership, and follow-up broadcasts.

The repository requires an architecture reset after repeated correction rounds continue to expose state-shape and ownership defects. This handoff reduces the persisted model before any further implementation correction.

The feature has not been published to stable or develop. The replacement may keep descriptor, controller-state, and private-protocol schema version `1`; no migration from the superseded PR-internal shapes is required.

## Non-goals

- forcing an already-open session to update;
- detecting or classifying reloads;
- allowing arbitrary historical release selection;
- keeping separate “latest”, “approved”, “activating”, and “failed” release records;
- superseding a release already ready or activating;
- persisted preparation progress, operation status, IDs, cancellation, polling, retry counters, or backoff;
- generic RPC, message bus, protocol negotiation, or compatibility adapter registries;
- browser-specific lifecycle branches;
- user-data rollback;
- irreversible user-data migrations or speculative read-only compatibility infrastructure;
- managed pinning for manual branch deployments or PR previews.

## Affected user scenarios

1. Fresh installation online and failed first installation.
2. Existing installation with Automatic mode.
3. Existing installation with Manual mode and indefinite deferral.
4. Explicit check for updates.
5. Manual install on next launch, cancellation, activation failure, and retry.
6. Mode changes while discovery or preparation is in flight.
7. Multiple same-channel windows issuing concurrent commands.
8. A newer release appearing while another release is available, ready, activating, or failed.
9. Missing, incomplete, corrupt, or evicted release cache.
10. Invalid or absent persisted controller state.
11. Controller-worker code upgrade.
12. Stable/develop isolation on one origin.
13. Concurrent or failed Pages publication.
14. Offline launch and exact-release restoration failure.
15. Boot acknowledgement, timeout, commit, rollback, and reload ordering.

## Boundaries

### Changes

- release identity and publication paths;
- persisted controller-state shape and pure transitions;
- UI snapshot shape and entity derivation;
- Automatic and Manual command orchestration;
- fetch-routing entry conditions;
- cache-cleanup ownership;
- tests and impact metadata that encode the replaced state model.

### Preserved mechanisms

- custom managed service worker for stable and develop;
- browser-owned service-worker script lifecycle with no `skipWaiting()` or `clients.claim()`;
- immutable archived index and immutable hashed assets;
- final archived-index SHA-256 and byte-size verification;
- descriptor-marker-last cache commit;
- exact-release preparation and restoration;
- `OperationQueue` for short state transactions;
- `PreparationCoordinator` for in-flight preparation deduplication and cleanup arbitration;
- clean-launch window counting across controlled and uncontrolled clients;
- boot watchdog and acknowledged `BOOT_OK` / `BOOT_FAILED` protocol;
- response-before-follow-up ordering;
- runtime-parsed private protocol v1 and stable failure envelope;
- stable/develop storage, cache, path, client, and broadcast isolation;
- legacy Workbox migration;
- existing FSD feature, entity, widget, and pane boundaries.

### Must not be touched

- Mioframe spaces, documents, Automerge history, storage providers, or user-data schemas;
- PWA behavior for arbitrary manual branches;
- PR-preview no-PWA policy;
- generic shared UI components except normal consumer text/props already owned by the App updates widget.

## Ownership matrix

| Owner | Responsibility |
| --- | --- |
| feature | User-triggered check, mode change, install-on-next-launch, cancel, and notification actions; only feature-local busy state |
| entity | Reactive snapshot, derived update status, refresh/invalidation subscription, and stable UI-facing update facts |
| widget | App updates product block, connectivity presentation, action composition, and truthful copy |
| page/pane | Route and settings-pane composition only |
| shared | Runtime protocol schemas/client, release schemas, and upper-layer-independent helpers |
| service/worker | Publication contract, persisted controller state, state transitions, discovery, preparation, cache ownership, fetch routing, activation, commit, rollback, and broadcasts |

## Sources of truth

- **Published release:** immutable descriptor at `updates/releases/<releaseNumber>.json`.
- **Published latest pointer:** `updates/latest.json`, written last.
- **Application lifecycle:** one validated IndexedDB controller record per managed channel.
- **Prepared bytes:** one committed Cache Storage cache per channel and release number; descriptor marker is written last.
- **Controller code lifecycle:** browser service-worker lifecycle.
- **Boot success:** application boot boundary reported by the publisher-injected watchdog/application bootstrap.
- **UI state:** worker snapshot only; UI does not reconstruct lifecycle state from caches, deployment files, or build metadata.

## Release identity and publication

A release has one identity and ordering value:

```ts
type ReleaseNumber = number;
```

`releaseNumber` is a positive monotonically increasing integer scoped to one managed channel. `appVersion`, `buildId`, and `buildDate` are metadata, not identity.

Published layout:

```text
updates/latest.json
updates/releases/<releaseNumber>.json
updates/releases/<releaseNumber>/index.html
assets/<immutable hashed files>
```

Cache layout:

```text
mioframe-release-<channel>-<releaseNumber>
```

Descriptor shape:

```ts
type ReleaseDescriptor = {
  schemaVersion: 1;
  releaseNumber: number;
  appVersion: string;
  buildId: string;
  buildDate: string;
  indexSha256: string;
  indexByteSize: number;
  files: ReleaseFile[];
};
```

Publication invariants:

- first publication uses release number `1` only when no retained managed tree exists;
- an existing managed tree must have a valid `latest.json` pointing to the highest retained descriptor number;
- the next release number is exactly `latest.releaseNumber + 1`;
- a release number is never reused, including after retention cleanup;
- malformed, missing, conflicting, or non-monotonic retained metadata aborts before the first write;
- `dist/updates` is a reserved namespace and aborts before the first write;
- immutable asset path collisions with different bytes abort before the first write;
- the final watchdog-injected archived index bytes are hashed before publication;
- immutable assets, archived index, descriptor, and deployment files are written before `latest.json`;
- `latest.json` is always the final publication write;
- GitHub Pages publication remains serialized through the existing `pages-publish` concurrency group;
- an external concurrent publisher is allowed to fail on Git push/rebase conflict; it must never silently reallocate or overwrite a committed release.

No UUID generator, ID/sequence bijection, pairwise identity validation, or cache key distinct from the ordering identity remains.

## Persisted state

Persist at most two release summaries: the active release and one future candidate.

```ts
type ReleaseSummary = {
  releaseNumber: number;
  appVersion: string;
  buildId: string;
  buildDate: string;
};

type UpdateCandidate =
  | { phase: 'available'; release: ReleaseSummary }
  | { phase: 'ready'; release: ReleaseSummary }
  | { phase: 'activating'; release: ReleaseSummary; deadlineAt: string }
  | { phase: 'failed'; release: ReleaseSummary };

type UpdateControllerState = {
  schemaVersion: 1;
  mode: 'automatic' | 'manual';
  activeRelease: ReleaseSummary;
  candidate?: UpdateCandidate;
  lastSuccessfulCheckAt?: string;
};
```

Persisted invariants:

- `candidate.release.releaseNumber > activeRelease.releaseNumber`;
- `deadlineAt` exists only for `phase: 'activating'` and is a valid ISO timestamp;
- only one candidate phase can exist because it is a discriminated union;
- preparation/check progress and transient errors are not persisted;
- invalid persisted state fails closed and is never automatically reset.

The final implementation must not retain separate persisted fields equivalent to `latestRelease`, `approvedRelease`, `activation`, or `failedActivationRelease`.

## Candidate replacement policy

The controller applies releases serially.

- `available` may be replaced by a strictly newer discovered release;
- `failed` may be replaced by a strictly newer discovered release when discovery is allowed;
- `ready` and `activating` are pinned and cannot be superseded;
- equal or older discoveries never change the candidate;
- after `BOOT_OK`, the candidate is cleared and a later check may discover the next release;
- after Manual cancellation, `ready` returns to `available` for the same release; a later check may then replace it with a newer release.

Intentional product consequence:

```text
B is ready
C is published
→ B remains the next release
→ C is considered only after B commits or the user cancels B
```

This deterministic sequencing is preferred over storing both a selected target and a newer latest release.

Manual activation failure preserves exact retry of the failed release. Background discovery is skipped for `failed` while mode is Manual. An explicit user check may discover a strictly newer release and replace the failed candidate. In Automatic mode, scheduled or explicit discovery may replace a failed candidate with a newer release; Automatic never retries the exact failed release.

## State transitions

| Current state | Event | Result |
| --- | --- | --- |
| state absent | successful worker install preparation | active = published latest; mode = Automatic; no candidate |
| no candidate | newer discovery | candidate = `available(new)` |
| `available(B)` | newer discovery C | candidate = `available(C)` |
| `failed(B)` | allowed newer discovery C | candidate = `available(C)` |
| `ready` or `activating` | scheduled/explicit discovery | discovery is skipped; state unchanged |
| any state | `SET_MODE` | mode changes in one short transaction; candidate phase is unchanged |
| Automatic + `available(B)` | background preparation succeeds and state is still same Automatic candidate | candidate = `ready(B)` |
| Automatic + `available(B)` | preparation fails or completion is stale | candidate remains `available(B)` |
| Manual + `available(B)` | install succeeds and state is still same Manual candidate | candidate = `ready(B)` |
| Manual + `failed(B)` | retry succeeds and state is still same Manual candidate | candidate = `ready(B)` |
| Manual + `ready(B)` | cancel | candidate = `available(B)` |
| `ready(B)` | qualifying clean launch | candidate = `activating(B, deadline)`; active unchanged |
| `activating(B)` | durable `BOOT_OK(B)` | active = B; candidate removed |
| `activating(B)` | durable `BOOT_FAILED(B)` or expired activation recovery | active unchanged; candidate = `failed(B)` |
| any state | stale/wrong release acknowledgement | no-op |

No transition accepts an independent activation target. Activation always consumes the current `ready` candidate.

## Command orchestration

### Short commands

These are short request/response commands with the bounded client transport timeout:

- `GET_SNAPSHOT`;
- `SET_MODE`;
- `CANCEL_SCHEDULED_UPDATE`;
- `BOOT_OK`;
- `BOOT_FAILED`;
- `GET_ACTIVATION_STATUS`.

`SET_MODE` only persists the user preference and responds. It never waits for discovery, download, hashing, or cache writes.

When switching to Automatic leaves an `available` candidate, the worker may start Automatic preparation only after posting the mode-change response. The preparation remains owned by the same message event through deferred `runLifetimeWork()`.

### Long commands

These do not use the short client timeout:

- `CHECK_FOR_UPDATES`;
- `INSTALL_ON_NEXT_LAUNCH`.

`CHECK_FOR_UPDATES` owns discovery only. It returns the resulting snapshot after the discovery transaction. In Automatic mode, preparation of the resulting `available` candidate runs after the response as worker-owned follow-up work and broadcasts completion separately.

`INSTALL_ON_NEXT_LAUNCH` is Manual-only and waits for exact-candidate preparation because success means the user action produced `ready`. A failed attempt leaves `available` or `failed` unchanged and returns an ephemeral `install-failed` error.

### Background discovery

The existing once-per-worker-lifetime navigation scheduler remains.

- skip while candidate is `ready` or `activating`;
- skip while candidate is `failed` in Manual mode, preserving explicit retry;
- otherwise discover the published latest release;
- in Automatic mode, prepare the resulting/current `available` candidate;
- failures do not change active or candidate state and are retried on a later eligible trigger.

### Stale completion rule

Every long operation performs network/cache work outside the state queue, then re-reads state in a short transaction. It may persist only when mode, candidate release number, and candidate phase still match the operation’s original target.

A stale completion may leave a valid unowned cache, but must not change state. Cleanup handles the unowned cache as best effort.

## Concurrency and event lifetime

Only two orchestration mechanisms remain:

- `OperationQueue`: serializes short read/decide/persist transactions;
- `PreparationCoordinator`: deduplicates preparation by release number and arbitrates preparation with cache cleanup.

Long network, hashing, cache population, discovery, and cleanup never run under `OperationQueue`.

A worker message result remains:

```ts
type WorkerMessageResult<Response> = {
  response: Response;
  runLifetimeWork?: () => Promise<void>;
};
```

Ordering is mandatory:

```text
persist command result
→ return handler result
→ post response
→ invoke runLifetimeWork
→ await it inside the original event.waitUntil
```

Broadcast ownership:

- every foreground command that durably changes snapshot state schedules exactly one same-channel invalidation after its response;
- a background durable state change schedules one same-channel invalidation after persistence;
- a no-op schedules no invalidation;
- `BOOT_FAILED` posts its acknowledgement before rollback broadcast can reload windows;
- follow-up failure never changes an already durable response.

Preparation completion may produce a second durable state change and therefore a second later invalidation; it is a separate background transition, not part of the original mode/discovery response.

## Fetch routing

The fetch listener decides ownership before reading controller state or opening a release cache.

The worker calls `respondWith()` only for:

- same-origin, same-channel top-level navigation;
- same-origin paths under `<channelBasePath>assets/**`.

Everything else is ordinary browser network behavior and does not enter managed release serving:

- cross-origin requests;
- `updates/**` descriptor/index fetches;
- manifest;
- PWA icons;
- APIs;
- fonts;
- any path outside `assets/**`.

Managed navigation and asset behavior:

| Persisted state | Result |
| --- | --- |
| absent | ordinary network bootstrap |
| invalid | controlled `503`, without live-deployment fallback |
| valid | serve the selected exact release |

Selected release:

- `candidate.release` only while phase is `activating`;
- otherwise `activeRelease`.

A missing or incomplete selected cache is restored only from that release’s immutable descriptor and archive. Restoration failure returns controlled `503`; it never serves another release or the live deployment.

## Cache ownership and cleanup

One committed cache exists per channel/release number. Descriptor marker remains the commit marker written after index and every listed asset pass integrity validation.

Protected release numbers are exactly:

- `activeRelease.releaseNumber`;
- `candidate.release.releaseNumber`, when a candidate exists;
- release numbers currently held by `PreparationCoordinator`.

Cleanup is required only when ownership may shrink:

- controller-worker activation/startup maintenance;
- candidate replacement by a newer release;
- successful `BOOT_OK` replacing active and clearing candidate;
- completion of a stale preparation that may have produced an unowned cache.

Phase changes for the same candidate, mode-only changes, Manual cancellation (`ready` → `available`), and activation failure (`activating` → `failed`) do not shrink ownership and do not require cleanup.

Cleanup remains best effort and event-lifetime tracked where an event owns it. No durable cleanup queue, retry database, timer, or cache registry is added.

## Private protocol and public entry points

Private protocol version remains `1`; every request, response, acknowledgement, failure envelope, and broadcast carries `protocolVersion: 1` and is runtime parsed.

Requests remain:

```text
GET_SNAPSHOT
CHECK_FOR_UPDATES
SET_MODE
INSTALL_ON_NEXT_LAUNCH
CANCEL_SCHEDULED_UPDATE
BOOT_OK
BOOT_FAILED
GET_ACTIVATION_STATUS
```

UI snapshot becomes a direct projection:

```ts
type AppUpdateSnapshot = {
  mode: 'automatic' | 'manual';
  activeRelease: ReleaseSummary;
  candidate?: UpdateCandidate;
  lastSuccessfulCheckAt?: string;
  error?: 'check-failed' | 'install-failed';
};
```

Unexpected worker-handler failure remains the stable envelope:

```ts
{ protocolVersion: 1; error: 'unavailable' }
```

UI entity derives status from `candidate.phase` rather than reconciling separate release fields.

## UI behavior

- no candidate + no successful check: **Not checked yet**;
- no candidate + successful check: **Up to date**;
- `available`: **Update available**;
- `ready`: **Update ready**;
- `activating`: **Activating update**;
- `failed`: **Update failed**;
- ephemeral check/install failures use existing failure presentation without changing the persisted candidate phase;
- activation phase has priority over ephemeral errors;
- Manual `available`: **Install on next launch**;
- Manual `failed`: **Retry update**;
- Manual `ready`: **Cancel scheduled update**;
- Check action is disabled while candidate is `ready` or `activating` because discovery is intentionally serialized behind the selected release;
- ordinary update-available Snackbar is shown only for Manual `available`, deduplicated per release number, and suppressed for `ready`, `activating`, and `failed`;
- online/offline presentation remains widget-local and reactive.

No shared UI primitive changes are required.

## Boot commit and rollback

The portable activation contract remains:

```text
close every Mioframe window
→ reopen Mioframe
→ ready candidate starts activation
```

The worker does not detect reloads and does not promise or forbid activation on a sole-window reload. Cross-browser proof uses close-all-and-reopen.

Starting activation does not change `activeRelease`. The application reports `BOOT_OK` only after initial router readiness, root app mount, and first Vue render.

On durable `BOOT_OK`, active becomes the candidate and candidate is cleared.

On durable `BOOT_FAILED` or expired activation recovery, active remains unchanged and candidate becomes `failed`. The worker posts acknowledgement before rollback broadcast. Persistence failure produces no reload loop.

Application rollback never rolls back user data.

## Data compatibility contract

Manual mode may keep an application release available or ready indefinitely. Every release published while this feature is active must preserve backward-readable user data for all still-supported pinned releases.

An irreversible data migration is forbidden until a separate architecture defines and verifies data-format compatibility, unsupported-old-client detection, fail-closed behavior, migration, and recovery independently from application-release rollback.

## Minimum sufficient design

Complexity budget for the final implementation:

- one release identity field: `releaseNumber`;
- at most two persisted release summaries: active and candidate;
- one discriminated candidate lifecycle;
- no persisted preparation/check operation state;
- exactly two worker-local orchestration mechanisms: queue and preparation coordinator;
- one UI snapshot candidate, not separate latest/scheduled/activating/failed fields;
- one fetch ownership decision before state/cache access;
- no supersession while ready or activating.

Unavoidable complexity and justification:

- immutable archive and integrity verification: offline exact-release restoration;
- short state queue: concurrent windows and worker events;
- preparation coordinator: deduplicate expensive fetch/hash/cache writes and prevent cleanup races;
- boot watchdog and activation deadline: automatic rollback when a new application cannot boot;
- protocol runtime validation: pinned application and controller code can have different lifetimes;
- channel isolation: stable and develop share one origin.

## Rejected approaches

- Continue patching the multi-reference state model: repeated review proved the shape creates invalid combinations and duplicated identity checks.
- Keep UUID plus sequence: two fields add a bijection invariant without a current consumer requiring independent opaque identity.
- Persist both selected target and newer latest release: enables immediate supersession but recreates multi-release state and ambiguous user actions.
- Supersede `ready` or `activating`: violates exact selected-target intent and complicates rollback/cache ownership.
- Persist `preparing`: browser termination makes durable operation progress misleading; retries are naturally idempotent.
- Make `SET_MODE automatic` a long command: couples preference persistence to download and recreates stale-response races.
- Hold long work under the queue: blocks navigation, boot acknowledgement, and other windows.
- Generic operation tokens or request generations: exact fresh-state validation is sufficient.
- Network fallback for invalid state or unavailable selected release: silently breaks pinning.
- Browser-specific reload detection: not portable and not required by the close-all-and-reopen contract.

## Shared UI blast radius

None. Only App updates entity/feature/widget/pane consumers and their tests change. Shared Material components and global styling must remain unchanged.

## Acceptance matrix

| Scenario | Required observable result |
| --- | --- |
| Fresh install succeeds | latest immutable release is fully prepared before initial state is committed |
| Fresh install fails | new controller installation fails; no partial managed state becomes active |
| Manual discovery | newest eligible release becomes `available`; no preparation starts |
| Manual indefinite deferral | active release continues serving; newer discoveries replace only `available` |
| Manual install | exact candidate is prepared and becomes `ready` |
| Manual cancel | same candidate returns to `available`; active is unchanged |
| Manual activation failure | previous active remains; exact candidate becomes `failed`; Retry is available |
| Manual explicit check after failure | a newer release may replace failed candidate; equal/older release preserves retry |
| Automatic discovery | newest eligible candidate becomes available, then ready after background preparation |
| Automatic preparation failure | mode remains Automatic; candidate remains available; later eligible trigger retries |
| Mode changes during preparation | final completion changes phase only if fresh mode/candidate/phase still match |
| Ready B and C published | B remains ready; C is not stored until B commits or is cancelled |
| Activating B and C published | B remains activation target; C is not stored |
| Automatic failed B and C published | eligible discovery replaces B with available C; exact B is not retried automatically |
| Multiple windows | later durable user mode choice wins; stale completions are no-ops |
| Invalid state navigation/assets | controlled `503`; no live-deployment fetch |
| Invalid state non-release request | ordinary network behavior |
| Missing selected cache | restore exact selected release or return `503` |
| Controller upgrade | active and candidate state are preserved unchanged |
| BOOT_OK | acknowledgement follows durable commit; UI readers refresh; obsolete cache cleanup is tracked |
| BOOT_FAILED | acknowledgement follows durable rollback; rollback broadcast starts after acknowledgement |
| Stable/develop | state, caches, clients, discovery, and broadcasts never cross channel boundaries |
| Concurrent publication | serialized publish succeeds or conflicting publisher fails; committed release is never overwritten |

## Risk matrix

| Risk | Mitigation / proof owner |
| --- | --- |
| Invalid persisted state bypasses pinning | schema boundary plus navigation/asset release tests |
| Stale long completion overwrites user intent | fresh queue transaction checks exact mode, phase, and release number |
| Candidate supersession becomes ambiguous | no supersession in ready/activating; one candidate only |
| Release number reuse | publisher retained-tree validation and serialized/fail-on-conflict publication tests |
| Incomplete/corrupt cache treated as ready | integrity verification and descriptor-marker-last tests |
| Cleanup deletes selected/in-flight release | protected-number set and coordinator arbitration tests |
| Response lost before rollback reload | real service-worker response-before-follow-up wiring test |
| Worker terminated during background work | originating event `waitUntil`; idempotent retry on later eligible trigger |
| Protocol drift between pinned app and controller | protocol v1 runtime parsing and additive compatibility tests |
| Cross-channel mutation | path/origin/database/cache/client isolation unit and release E2E proof |
| Browser clean-launch differences | Chromium, Firefox, and WebKit close-all-and-reopen scenarios |
| Older app writes incompatible user data | backward-readable data contract; irreversible migration forbidden |

## Required test proof

Changed contracts:

- release-number publication and retained-tree validation;
- single-candidate persisted schema and transition matrix;
- candidate replacement and serialized-release policy;
- short mode command plus deferred Automatic preparation;
- stale completion behavior across multiple windows;
- direct snapshot/entity projection;
- early fetch routing and invalid/absent behavior;
- protected-cache ownership and reduced cleanup triggers;
- protocol payload shape changes within unpublished v1.

Primary proof:

- deterministic unit tests for publisher, descriptor schemas, state schema, every transition, orchestration races, cache ownership, preparation, protocol, snapshot, and entity derivation;
- component-contract tests for App updates actions, labels, disabled states, connectivity, and candidate-phase presentation;
- real `src/sw.ts` wiring tests for fetch ownership and response/follow-up ordering;
- release/product browser tests for fresh install, Automatic, Manual, cancellation, clean launch, activation UI, commit, rollback, retry, controller upgrade, cache restoration, legacy migration, channel isolation, uncontrolled windows, and cross-engine lifecycle;
- release publication tests for stable/develop, reserved namespace, monotonic allocation, corrupted retained metadata, concurrent conflict behavior, archived-index integrity, and artifact assembly;
- mutation protection for the high-risk pure transition matrix if the existing persistent mutation registry covers the replaced transition owner.

No new visual regression proof is required unless the rewrite changes accepted layout or appearance beyond copy/status visibility. No performance claim or benchmark infrastructure is introduced.

Exact test paths, persistent impact metadata changes, and focused measurements are resolved by implementation preflight before code edits.

## Required verification

During implementation, use focused verify-managed checks selected by preflight, including the `managed-updates` label.

Final completion gate for the complete rewritten PR:

```text
pnpm verify:release
```

Focused, standalone, or GitHub checks supplement but do not replace the final release gate.

## Forbidden

- preserving old persisted multi-reference fields for compatibility;
- adding an equivalent second latest/pending/scheduled release field under another name;
- UUID plus sequence dual identity;
- migrating PR-internal schema shapes that were never deployed;
- persisted operation/preparation/check progress;
- operation IDs, generations, epochs, polling, retries, or backoff state;
- generic RPC, message bus, release manager, cache registry, or lifecycle manager;
- long network/cache work inside `OperationQueue`;
- `SET_MODE` waiting for preparation;
- superseding `ready` or `activating` candidate;
- network fallback for invalid state or unavailable selected release;
- worker interception of manifest, icons, APIs, fonts, `updates/**`, or cross-origin requests;
- browser detection or reload classification;
- user-data rollback;
- weakening or quarantining lifecycle tests;
- changing verification timeouts/resources to make the rewrite pass.

## Implementation readiness

- Required product behavior: resolved.
- Release identity and publication allocation: resolved.
- Persisted source of truth and state shape: resolved.
- Candidate supersession and failed-release behavior: resolved.
- Multi-window ordering and long-operation ownership: resolved.
- Fetch routing and invalid-state behavior: resolved.
- Cache ownership and cleanup triggers: resolved.
- UI snapshot and action semantics: resolved.
- Protocol boundary: resolved.
- Browser activation contract: resolved.
- Data-safety boundary: resolved.
- Agent dependencies: current repository, applicable rules/skills, this handoff, and existing tests are available.
- GitHub/PR ownership: remains with the architect; coding agent changes repository code and runs local verification only.
- Unresolved blockers: none.
- Verdict: **ready**.
