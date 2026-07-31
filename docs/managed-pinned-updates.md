# Managed pinned application updates — architecture handoff

**Implementation readiness: ready.**

This is the canonical implementation contract for PR 169. It replaces the current UUID/sequence and multi-reference state design. Existing code and tests are reusable evidence, not compatibility contracts.

## Goal

Stable (`/`) and develop (`/branch/develop/`) support Automatic and Manual application updates while preserving these guarantees:

- an existing active application release changes only through candidate activation followed by durable `BOOT_OK`;
- failed candidate activation leaves the previous active release selected;
- navigation and release assets are served only from the selected immutable archive;
- controller-worker upgrades never silently select another application release;
- all same-channel windows observe durable state changes;
- application rollback never rolls back user data.

Manual branches keep generated Workbox behavior. PR previews remain non-PWA.

### Data compatibility

While Manual pinning or managed rollback can start an older supported release, every newer release must keep user data readable by that older release. Irreversible migration requires a separate fail-closed architecture that first removes the older release from the supported pin/rollback set. It is not part of this PR.

## Non-goals

- arbitrary historical-version selection;
- forcing open sessions to update;
- reload detection or browser-specific branches;
- persisted operation/progress state, polling, cancellation, retry counters, or backoff;
- generic RPC, release manager, cache registry, or compatibility adapter layers;
- remote archive pruning;
- user-data rollback or irreversible data migrations.

## Ownership and sources of truth

| Owner                   | Responsibility                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Publisher               | Append-only immutable archive, one-time legacy migration metadata, `latest.json`                         |
| Controller worker       | Persisted state, transitions, preparation, fetch routing, activation, rollback, local caches, broadcasts |
| Service client/features | Explicit transport outcomes, finite busy state, user actions                                             |
| Entity/widget/pane      | Snapshot projection, product composition, truthful UI copy                                               |
| Browser                 | Controller-worker lifecycle and active script identity                                                   |

Sources of truth:

- published release: `updates/releases/<releaseNumber>.json`;
- latest release: `updates/latest.json`, written last;
- one-time legacy baseline: `updates/legacy-migration.json`, when present;
- lifecycle state: one validated IndexedDB record per managed channel;
- prepared bytes: one committed Cache Storage cache per channel/release number;
- controller kind: normalized `ServiceWorkerRegistration.active.scriptURL`;
- boot success: publisher-injected watchdog plus application boot report;
- UI: last valid worker snapshot plus feature-local transport outcome.

## Controller script identity

Legacy Workbox and the managed controller use different script URLs at the same registration scope:

```text
legacy:  <channelBasePath>sw.js
managed: <channelBasePath>managed-sw.js
```

The managed application registers `managed-sw.js` with the same stable/develop scope previously used by `sw.js`. The browser updates the existing same-scope registration when the registered script URL changes; the previous active worker remains available as `registration.active` until ordinary promotion replaces it.

Install classification compares fully resolved same-origin URLs exactly:

- active URL equals expected managed URL → managed controller;
- active URL equals expected legacy URL → possible supported legacy predecessor;
- any other URL → unsupported/ambiguous predecessor.

Cache contents never determine controller kind. They are inspected only after the active script URL has identified the supported legacy predecessor.

The managed worker never calls `skipWaiting()` or `clients.claim()`.

## Release identity and publication

```ts
type ReleaseNumber = number;
```

It must satisfy `Number.isSafeInteger(value) && value > 0` in publisher and runtime schemas.

```text
updates/latest.json
updates/legacy-migration.json              # only for a channel migrated from legacy Workbox
updates/releases/<releaseNumber>.json
updates/releases/<releaseNumber>/index.html
assets/<immutable hashed files>
```

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

type LegacyMigrationPointer = {
  schemaVersion: 1;
  baselineReleaseNumber: number;
};
```

### Ordinary managed publication

- a new channel with no previous deployment publishes release `1`;
- every later release is exactly `latest.releaseNumber + 1`;
- malformed, missing, conflicting, non-monotonic, reused, or overflowing retained metadata aborts before the first write;
- `dist/updates` and immutable path collisions with different bytes abort before the first write;
- watchdog-injected archived index bytes are hashed before publication;
- assets, archived index, descriptor, deployment files, and any one-time migration pointer precede `latest.json`;
- `latest.json` is the final write;
- managed remote descriptors, archived indexes, and required hashed assets are append-only and are not pruned in this PR;
- only local Cache Storage cleanup is in scope;
- serialized publication succeeds, or a conflicting external push fails without reallocating or overwriting a committed release.

### First managed publication over legacy Workbox

Before replacing the channel root, the publisher must:

1. Validate the existing channel `deployment.json`, root `index.html`, and `assets/**` tree.
2. Archive that exact pre-overwrite deployment as release `1`, including watchdog-injected index integrity metadata. This is the rollback baseline.
3. Publish the new managed build as release `2`.
4. Write immutable `updates/legacy-migration.json` pointing to release `1`.
5. Write `latest.json` pointing to release `2` last.

If the existing deployment cannot be validated and archived as a usable rollback baseline, publication fails before the first target-tree write. The publisher must not silently start the managed archive from the new build.

The migration pointer is immutable and retained forever. Later publications continue from the highest release number.

## Persisted state

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

Invariants:

- candidate number is strictly greater than active number;
- `deadlineAt` exists only for `activating` and is valid ISO time;
- progress and transient errors are not persisted;
- invalid state fails closed and is never automatically repaired;
- no separate latest, approved, activation-target, or failed-release record exists.

## Install and controller-upgrade contract

An installing managed worker first reads state:

- valid state is preserved unchanged;
- invalid state rejects installation;
- absent state requires explicit classification.

For absent state:

- no active worker → genuine first registration;
- active script URL is managed → missing-state managed upgrade; reject;
- active script URL is legacy → require exact known same-channel frozen Workbox precache, channel-root navigation fallback, valid immutable migration pointer, and valid baseline/latest descriptors;
- any other or mismatched evidence → reject.

Required failure case:

```text
active managed worker
+ absent or invalid state
+ stale legacy Workbox cache
→ installation rejected from active script identity
```

Legacy cache deletion is housekeeping only and never authorizes migration.

Initialization results:

- genuine first registration fully prepares published latest and persists it as initial active baseline;
- proven legacy migration fully prepares archived legacy baseline as `activeRelease` and persists newer published latest as `candidate: available`;
- missing-state managed upgrade or ambiguous predecessor rejects installation;
- failed preparation/persistence rejects installation and leaves the previous worker active.

The genuine first-registration baseline is the sole case where a newly selected application release becomes active without `BOOT_OK`, because no previous release exists.

Legacy migration is not that exception: the exact pre-overwrite legacy deployment remains active in managed state. The new managed build is a normal candidate and must pass clean-launch activation and durable `BOOT_OK`.

An active managed worker must never observe legitimate absent state. For owned navigation/assets, absent and invalid both return controlled `503`.

## Candidate policy and transitions

- `available` may be replaced by a strictly newer discovery;
- eligible `failed` may be replaced by a strictly newer discovery;
- `ready` and `activating` are pinned and never superseded;
- Manual background discovery skips `failed`; explicit Manual check may replace it with newer;
- Automatic may replace `failed` with newer but never retries the exact failed release;
- Manual may explicitly retry the exact failed release.

| State / event                                                   | Result                                      |
| --------------------------------------------------------------- | ------------------------------------------- |
| no candidate + newer discovery                                  | `available(new)`                            |
| `available(B)` + newer C                                        | `available(C)`                              |
| eligible `failed(B)` + newer C                                  | `available(C)`                              |
| `SET_MODE`                                                      | change mode only                            |
| Automatic `available(B)` + fresh successful preparation         | `ready(B)`                                  |
| Manual `available(B)` or `failed(B)` + fresh successful install | `ready(B)`                                  |
| Manual `ready(B)` + cancel                                      | `available(B)`                              |
| `ready(B)` + qualifying clean launch                            | `activating(B, deadline)`; active unchanged |
| matching durable `BOOT_OK(B)`                                   | active becomes B; candidate cleared         |
| matching durable `BOOT_FAILED(B)` or expiration                 | active unchanged; `failed(B)`               |
| stale/wrong completion or acknowledgement                       | no-op                                       |

Every long completion re-reads state and persists only when mode, candidate number, and phase still match. Every pure no-op returns the original state object.

## Manual → Automatic follow-up

`SET_MODE` is a short command: persist preference, post response, then invalidate other windows when changed.

After a successful Manual → Automatic change, deferred reconciliation runs under the same message event after the response:

| Fresh state             | Deferred work                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `available(B)`          | prepare exact B; persist `ready(B)` only after fresh mode/number/phase check        |
| `failed(B)`             | discover strictly newer; never retry B; prepare newly persisted available candidate |
| no candidate            | discover now; prepare resulting available candidate                                 |
| `ready` or `activating` | no follow-up beyond mode change                                                     |

This trigger is independent of the once-per-worker navigation scheduler. Discovery/preparation remain outside `OperationQueue`; each later durable transition emits its own invalidation. Manual mode changes start no discovery or preparation.

## Transport and event lifetime

Timeouts are separate contracts:

- UI short transport: `10_000ms` for `GET_SNAPSHOT`, `SET_MODE`, `CANCEL_SCHEDULED_UPDATE`;
- UI long transport: `LONG_REQUEST_TIMEOUT_MS = 120_000` for `CHECK_FOR_UPDATES`, `INSTALL_ON_NEXT_LAUNCH`;
- watchdog controller request/ack: `BOOT_ACK_TIMEOUT_MS = 5_000`;
- activation deadline: `BOOT_CONFIRMATION_TIMEOUT_MS = 30_000`.

```ts
type AppUpdateClientResult<T> =
  | { status: 'success'; value: T }
  | { status: 'timeout' }
  | { status: 'unavailable' };
```

- timeout clears feature-local busy state but preserves the last valid snapshot and capability;
- timeout may produce a feature-local action failure, but must not replace the entity snapshot with unavailable;
- unavailable is reserved for no controller/capability or invalid/stable failure response;
- client timeout does not cancel worker work already owned by `event.waitUntil`;
- late durable completion is surfaced by normal invalidation and snapshot refresh;
- no operation IDs, polling, or persisted operation state are added.

`CHECK_FOR_UPDATES` responds after discovery; Automatic preparation is deferred after the response. Manual install waits for exact-candidate preparation because success means `ready`.

Only two worker-local orchestration mechanisms remain:

- `OperationQueue` for short read/decide/persist transactions;
- `PreparationCoordinator` for preparation deduplication and cleanup arbitration.

Long network, hashing, discovery, preparation, and cleanup work never run under the queue.

Mandatory ordering:

```text
persist result
→ post response
→ invoke deferred work
→ await it inside originating event.waitUntil
```

Every foreground durable change sends exactly one post-response invalidation. Each later background durable transition sends its own. No-op and failed persistence send none. Rollback acknowledgement precedes rollback broadcast.

## Fetch routing and activation

`src/sw.ts` decides ownership before state/cache access and calls `respondWith()` only for:

- same-origin, same-channel top-level navigation;
- same-origin `<channelBasePath>assets/**`.

Cross-origin requests, `updates/**`, manifest, icons, APIs, fonts, and every other path remain browser network behavior.

| State             | Owned request result               |
| ----------------- | ---------------------------------- |
| absent or invalid | controlled `503`; no live fallback |
| valid             | serve exact selected release       |

Selected release is candidate only while `activating`; otherwise active. Missing/corrupt selected cache restores only that exact archive or returns `503`.

Portable activation:

```text
close every Mioframe window
→ reopen Mioframe
→ ready candidate starts activation
```

No reload classification. Expired activation persists `failed`, serves unchanged active release to the current navigation, and broadcasts rollback only to other same-channel windows; current navigation client IDs are excluded.

## Local cache ownership

Protected local numbers are exactly active, candidate when present, and coordinator in-flight preparations.

Cleanup runs only when ownership may shrink: startup maintenance, candidate replacement, successful `BOOT_OK`, or stale preparation completion. Mode and same-candidate phase changes need no cleanup. Cleanup is best effort and event-lifetime tracked; no durable cleanup queue exists.

## UI snapshot

```ts
type AppUpdateSnapshot = {
  mode: 'automatic' | 'manual';
  activeRelease: ReleaseSummary;
  candidate?: UpdateCandidate;
  lastSuccessfulCheckAt?: string;
  error?: 'check-failed' | 'install-failed';
};
```

Entity status directly projects `candidate.phase`. Existing actions remain Check, mode change, Install on next launch, Retry, and Cancel. Update notification is Manual `available` only, deduplicated by release number. Connectivity remains widget-local. Timeout preserves the snapshot.

## Acceptance matrix

| Scenario                                            | Required result                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| New-channel first registration                      | verified latest becomes initial baseline                                                       |
| First managed publication over legacy               | pre-overwrite deployment archived as release 1; managed build published as release 2 candidate |
| Proven legacy migration                             | legacy baseline active; latest candidate requires `BOOT_OK`                                    |
| Managed active + missing state + stale legacy cache | managed script URL identifies upgrade; installation rejected                                   |
| Unknown active script URL + absent state            | installation rejected                                                                          |
| Managed upgrade + valid state                       | state preserved                                                                                |
| Active runtime + absent/invalid                     | owned navigation/assets return `503`                                                           |
| Manual → Automatic + available                      | response first, then exact candidate preparation                                               |
| Manual → Automatic + failed/none                    | response first, then discovery; exact failed candidate not retried                             |
| Long-request timeout                                | busy clears; snapshot/capability remain; late broadcast may refresh                            |
| Manual deferral                                     | active and remote archive remain available indefinitely                                        |
| Ready/activating B, C published                     | B remains selected                                                                             |
| Candidate boot succeeds                             | durable commit before invalidation/cleanup                                                     |
| Candidate boot fails/expires                        | previous active remains; candidate failed                                                      |
| Missing selected cache                              | exact restoration or `503`                                                                     |
| Stable/develop                                      | no cross-channel state/cache/client/broadcast leakage                                          |
| Rollback data compatibility                         | previous supported active can read data written by newer supported release                     |

## Required proof

- deterministic publisher, schema, transition, orchestration, cache, script-identity, protocol, watchdog, and client-transport tests;
- real `src/sw.ts` wiring tests for fetch ownership and response/follow-up ordering;
- component/entity tests for candidate actions, timeout outcome, snapshot preservation, and busy reset;
- existing release E2E rewritten for distinct script URLs, first install, archived legacy migration, managed active plus stale cache, missing-state rejection, Automatic follow-up, Manual, activation, rollback, restoration, isolation, uncontrolled windows, and cross-engine lifecycle;
- publisher tests for legacy-baseline integrity, append-only archive, and pre-write safety.

Final gate:

```text
pnpm verify:release
```

## Forbidden

- old multi-reference fields/aliases;
- UUID plus sequence;
- same script URL for legacy and managed controllers;
- making the new managed build active during legacy migration;
- authorizing migration before exact active legacy script identity;
- treating arbitrary absent state as first install;
- leaving Automatic idle after Manual → Automatic in available/failed/no-candidate state;
- treating timeout as capability loss or clearing last snapshot;
- remote archive pruning;
- unbounded client waits;
- persisted operation/progress state, IDs, polling, or backoff;
- generic manager/registry/RPC abstractions;
- long work under `OperationQueue`;
- superseding `ready` or `activating`;
- live fallback for owned requests;
- browser-specific reload logic;
- user-data rollback or irreversible migration without separate architecture;
- shared Material/global-style changes.

## Implementation readiness

Legacy rollback, controller identification, Automatic follow-up, transport outcomes, timeout boundaries, data compatibility, state, ownership, failure behavior, proof, and verification are resolved.

Unresolved blockers: none.

Verdict: **ready**.
