# Managed pinned application updates — architecture handoff

**Implementation readiness: ready.**

This is the canonical architecture contract for PR 169. It replaces the current UUID/sequence and multi-reference state design. Existing implementation code and tests are reusable evidence, not compatibility contracts.

## Goal

Stable (`/`) and develop (`/branch/develop/`) provide Automatic and Manual managed application updates.

After the initial transition from legacy Workbox, the system guarantees:

- an active application release changes only through candidate activation followed by durable `BOOT_OK`;
- failed candidate activation keeps the previous active release selected;
- navigation and release assets are served only from the selected immutable archive;
- controller-worker upgrades never silently select another application release;
- all same-channel windows observe durable state changes;
- application rollback never rolls back user data.

Manual branches keep generated Workbox behavior. PR previews remain non-PWA.

## Initial Workbox transition

The existing product has no rollback contract. Therefore the one-time transition from legacy Workbox is explicitly outside managed rollback:

```text
legacy Workbox application
→ fully verified first managed release becomes the initial baseline
→ managed rollback guarantees begin with the next release
```

The previous Workbox deployment is not archived as a managed release and is not a rollback target.

The first managed release should contain the managed-update infrastructure and no unrelated irreversible product or data migration. Failure to install it leaves the existing Workbox worker active. Once it activates successfully, later application releases use the normal candidate/`BOOT_OK`/rollback lifecycle.

## Non-goals

- rollback to the pre-managed Workbox deployment;
- arbitrary historical-version selection;
- forcing open sessions to update;
- browser-specific reload detection;
- persisted operation/progress state, polling, cancellation, retry counters, or backoff;
- generic RPC, release manager, cache registry, or compatibility adapter layers;
- remote archive pruning;
- user-data rollback or irreversible data migrations.

## Data compatibility

While Manual pinning or managed rollback can start an older managed release, every newer managed release must keep user data readable by that older supported release.

An irreversible migration requires a separate fail-closed architecture that first removes the older release from the supported pin/rollback set. It is not part of this PR.

## Ownership

| Owner | Responsibility |
| --- | --- |
| Publisher | Append-only immutable managed release archive and `latest.json` |
| Controller worker | Bootstrap classification, persisted lifecycle, preparation, fetch routing, activation, rollback, local cache ownership, broadcasts |
| Service client/features | Explicit transport outcomes, finite busy state, existing user actions |
| Entity/widget/pane | Snapshot projection, product composition, truthful UI copy |
| Browser | Service-worker `install` / `waiting` / `activate` lifecycle |

Sources of truth:

- latest published release: `updates/latest.json`, written last;
- published release: `updates/releases/<releaseNumber>.json`;
- lifecycle state: one validated IndexedDB record per managed channel;
- prepared bytes: one committed Cache Storage cache per channel/release number;
- bootstrap guard: one independent per-channel managed-controller marker;
- boot success: publisher-injected watchdog plus application boot report;
- UI: last valid worker snapshot plus feature-local transport outcome.

## Release identity and publication

A release has one identity and ordering value:

```ts
type ReleaseNumber = number;
```

It must satisfy:

```ts
Number.isSafeInteger(value) && value > 0
```

Published layout:

```text
updates/latest.json
updates/releases/<releaseNumber>.json
updates/releases/<releaseNumber>/index.html
assets/<immutable hashed files>
sw.js
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
```

Publication rules:

- a channel without a managed archive starts at release `1`;
- each later release is exactly `latest.releaseNumber + 1`;
- malformed, missing, conflicting, reused, non-monotonic, or overflowing metadata aborts before the first write;
- `dist/updates` and immutable path collisions with different bytes abort before the first write;
- final watchdog-injected archived index bytes are hashed before publication;
- assets, archived index, descriptor, and deployment files are written before `latest.json`;
- `latest.json` is the final write;
- managed descriptors, archived indexes, and required hashed assets are append-only and are not pruned in this PR;
- only local Cache Storage cleanup is in scope;
- a conflicting external publication fails without reallocating or overwriting a committed release.

Node publisher validation and runtime descriptor validation must accept exactly the same format through the shared descriptor corpus.

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
- `deadlineAt` exists only for `activating` and is a valid ISO timestamp;
- progress and transient errors are not persisted;
- invalid state fails closed and is never automatically repaired;
- no separate latest, approved, activation-target, or failed-release record exists.

## Controller path and bootstrap guard

Legacy and managed workers use the same channel-scoped script path:

```text
<channelBasePath>sw.js
```

This preserves the native update path from installed Workbox registrations. The managed worker never calls `skipWaiting()` or `clients.claim()`.

The controller maintains an independent per-channel marker indicating that managed bootstrap has completed. The marker is not update lifecycle state and contains no release selection. It exists only to prevent an absent controller record from being mistaken for a first Workbox transition after managed operation has already begun.

Install ordering for a new baseline is:

```text
prepare and verify exact latest release
→ persist controller state
→ persist managed-controller marker
→ allow install to complete
```

When valid controller state exists but the marker is missing, a managed install may repair the marker before succeeding. A present marker with absent controller state is always fail-closed.

## Install classification

The installing worker first reads validated controller state and the managed-controller marker.

### Existing valid state

- preserve state unchanged;
- ensure the marker exists;
- complete as an ordinary managed controller upgrade.

### Invalid state

- reject installation;
- never initialize from `latest`.

### Absent state with marker present

- reject installation as managed-state loss;
- legacy caches must not authorize recovery.

### Absent state with no marker

Only two bootstrap cases are allowed:

1. **Genuine first registration:** no active worker exists for the registration.
2. **Supported legacy Workbox transition:** an active worker exists and the exact known same-channel Workbox precache, channel-root navigation fallback, deployment identity, and expected legacy registration shell are positively validated.

Every unknown, incomplete, mismatched, or ambiguous predecessor rejects installation.

Both allowed bootstrap cases fully prepare and verify published latest, then persist it as the initial `activeRelease` in Automatic mode. This initial baseline is the sole exception to `BOOT_OK`, because no managed rollback target exists yet.

Legacy Workbox caches are removed after managed activation as tracked housekeeping. Their presence never overrides a managed-controller marker or valid/invalid controller state.

## Runtime fail-closed behavior

An active managed worker must never observe legitimate absent state.

For worker-owned navigation or release assets:

| State | Result |
| --- | --- |
| absent or invalid | controlled `503`; no live deployment fallback |
| valid | serve the exact selected managed release |

## Candidate policy and transitions

Releases are applied serially:

- `available` may be replaced by a strictly newer discovery;
- eligible `failed` may be replaced by a strictly newer discovery;
- `ready` and `activating` are pinned and never superseded;
- Manual background discovery skips `failed`; explicit Manual check may replace it with a newer release;
- Automatic may replace `failed` with a newer release but never retries the exact failed release;
- Manual may explicitly retry the exact failed release.

| State / event | Result |
| --- | --- |
| no candidate + newer discovery | `available(new)` |
| `available(B)` + newer C | `available(C)` |
| eligible `failed(B)` + newer C | `available(C)` |
| `SET_MODE` | change mode only |
| Automatic `available(B)` + fresh successful preparation | `ready(B)` |
| Manual `available(B)` or `failed(B)` + fresh successful install | `ready(B)` |
| Manual `ready(B)` + cancel | `available(B)` |
| `ready(B)` + qualifying clean launch | `activating(B, deadline)`; active unchanged |
| matching durable `BOOT_OK(B)` | active becomes B; candidate cleared |
| matching durable `BOOT_FAILED(B)` or expiration | active unchanged; `failed(B)` |
| stale or wrong completion/acknowledgement | no-op |

Every long completion re-reads state and persists only when mode, candidate number, and phase still match. Every pure no-op returns the original state object.

## Automatic reconciliation

One worker-owned reconciliation operation uses these rules:

| Fresh Automatic state | Deferred work |
| --- | --- |
| `available(B)` | prepare exact B; persist `ready(B)` only after fresh mode/number/phase check |
| `failed(B)` | discover strictly newer; never retry B; prepare a newly persisted available candidate |
| no candidate | discover now; prepare a resulting available candidate |
| `ready` or `activating` | no work |

It is triggered:

- after a successful Manual → Automatic `SET_MODE`, after the response;
- once per worker instance by the first eligible owned navigation, under that fetch event's `waitUntil`, without delaying its response.

Discovery and preparation remain outside `OperationQueue`. Stale completion is a no-op and may only schedule best-effort cleanup of an unowned prepared cache.

## Transport and event lifetime

Timeouts are separate contracts:

- UI short transport: `10_000ms` for `GET_SNAPSHOT`, `SET_MODE`, and `CANCEL_SCHEDULED_UPDATE`;
- UI long transport: `120_000ms` for `CHECK_FOR_UPDATES` and `INSTALL_ON_NEXT_LAUNCH`;
- watchdog controller request/ack: `5_000ms`;
- activation deadline: `30_000ms`.

```ts
type AppUpdateClientResult<T> =
  | { status: 'success'; value: T }
  | { status: 'timeout' }
  | { status: 'unavailable' };
```

- timeout clears feature-local busy state but preserves the last valid snapshot and capability;
- timeout does not cancel worker work owned by `event.waitUntil`;
- late durable completion is surfaced through normal invalidation and snapshot refresh;
- no operation IDs, polling, or persisted operation state are added.

Only two worker-local orchestration mechanisms remain:

- `OperationQueue` for short read/decide/persist transactions;
- `PreparationCoordinator` for preparation deduplication and cleanup arbitration.

Long network, hashing, discovery, preparation, and cleanup work never run under the queue.

Mandatory ordering:

```text
persist result
→ post response
→ invoke deferred work
→ await it inside the originating event.waitUntil
```

Every foreground durable change sends exactly one post-response invalidation. Each later background durable transition sends its own. No-op and failed persistence send none. Rollback acknowledgement precedes rollback broadcast.

## Fetch routing and activation

`sw.js` decides ownership before state/cache access and calls `respondWith()` only for:

- same-origin, same-channel top-level navigation;
- same-origin `<channelBasePath>assets/**`.

Cross-origin requests, `updates/**`, manifest, icons, APIs, fonts, registration scripts, and every other path remain ordinary browser network behavior.

Selected release is candidate only while `activating`; otherwise it is active. Missing or corrupt selected cache restores only that exact immutable archive or returns controlled `503`.

Portable activation:

```text
close every Mioframe window
→ reopen Mioframe
→ ready candidate starts activation
```

The worker does not classify reloads. Expired activation persists `failed`, serves the unchanged active release to the current navigation, and broadcasts rollback only to other same-channel windows; current navigation client IDs are excluded.

## Local cache ownership

Protected local release numbers are exactly:

- active release;
- candidate release, when present;
- coordinator in-flight preparations.

Cleanup runs only when ownership may shrink: startup maintenance, candidate replacement, successful `BOOT_OK`, or stale preparation completion. Mode and same-candidate phase changes require no cleanup. Cleanup is best effort and event-lifetime tracked; no durable cleanup queue exists.

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

| Scenario | Required result |
| --- | --- |
| New registration | verified latest becomes initial managed baseline |
| Supported legacy Workbox transition | verified latest becomes initial managed baseline; no rollback to Workbox |
| Bootstrap failure | old Workbox worker remains active |
| Managed marker + absent state | installation rejected |
| Valid managed state + missing marker | marker repaired; state preserved |
| Managed upgrade + invalid state | installation rejected |
| Active runtime + absent/invalid state | owned navigation/assets return `503` |
| First later managed release | normal candidate activation and rollback guarantees apply |
| Manual → Automatic + available | response first, then exact candidate preparation |
| Manual → Automatic + failed/none | response first, then discovery; exact failed candidate not retried |
| Long-request timeout | busy clears; snapshot/capability remain; late broadcast may refresh |
| Ready/activating B, C published | B remains selected |
| Candidate boot succeeds | durable commit before invalidation and cleanup |
| Candidate boot fails/expires | previous managed active remains; candidate becomes failed |
| Missing selected cache | exact restoration or `503`, never live deployment |
| Stable/develop | state, caches, clients, and broadcasts never cross channels |
| Rollback data compatibility | previous supported managed active can read data written by newer supported release |

## Required proof

- publisher/runtime descriptor parity, safe allocation, append-only archive, and pre-write failure safety;
- deterministic state, orchestration, cache, protocol, watchdog, marker, and transport tests;
- real `sw.js` wiring tests for bootstrap classification, fetch ownership, and response/follow-up ordering;
- component/entity tests for candidate actions, timeout outcome, snapshot preservation, and busy reset;
- existing release E2E rewritten for native Workbox-to-managed update at the same `sw.js`, bootstrap success/failure, marker fail-closed behavior, Automatic, Manual, activation, rollback, restoration, isolation, uncontrolled windows, and cross-engine lifecycle.

Final gate:

```text
pnpm verify:release
```

## Forbidden

- migration bridge or a second managed worker script path;
- rollback to the pre-managed Workbox deployment;
- old multi-reference fields or aliases;
- UUID plus sequence identity;
- treating arbitrary absent state as first install;
- allowing legacy caches to override a managed marker or controller-state result;
- leaving Automatic idle after Manual → Automatic;
- treating timeout as capability loss or clearing the last snapshot;
- remote archive pruning;
- unbounded client waits;
- persisted operation/progress state, IDs, polling, or backoff;
- generic manager/registry/RPC abstractions;
- long work under `OperationQueue`;
- superseding `ready` or `activating`;
- live-deployment fallback for owned requests;
- browser-specific reload logic;
- user-data rollback or irreversible migration without separate architecture;
- shared Material or global-style changes.

## Implementation readiness

Initial Workbox transition semantics, managed rollback boundary, release identity, bootstrap guard, state, Automatic triggers, transport outcomes, ownership, failure behavior, proof, and verification are resolved.

Unresolved blockers: none.

Verdict: **ready**.
