# Managed pinned application updates — architecture handoff

**Implementation readiness: ready.**

This is the canonical implementation contract for PR 169. It replaces the current UUID/sequence and multi-reference controller-state design. The existing implementation is reusable evidence, not a compatibility contract.

## Goal

Stable (`/`) and develop (`/branch/develop/`) support Automatic and Manual application updates while preserving these guarantees:

- an existing active application release changes only through candidate activation followed by durable `BOOT_OK`;
- failed candidate activation leaves the previous active release selected;
- navigation and release assets are served only from the selected immutable archive;
- controller-worker code upgrades never silently select a different application release;
- all same-channel windows observe durable state changes;
- application rollback never rolls back user data.

Manual branches keep generated Workbox behavior. PR previews remain non-PWA.

### Data compatibility

While Manual pinning or managed rollback can start an older supported release, every newer release must keep user data readable by that older release. A release must not perform an irreversible migration that makes data unreadable by a supported previous active release.

An irreversible migration requires a separate fail-closed architecture that first removes the older release from the supported pin/rollback set. It is not part of this PR.

## Non-goals

- arbitrary historical-version selection;
- forcing open sessions to update;
- reload detection or browser-specific lifecycle branches;
- persisted operation/progress state, polling, cancellation, retry counters, or backoff;
- generic RPC, release manager, cache registry, or compatibility adapter layers;
- remote archive pruning;
- user-data rollback or irreversible data migrations.

## Ownership and sources of truth

| Owner                       | Responsibility                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Publisher                   | Append-only immutable release archive, one-time legacy migration metadata, and `latest.json`                             |
| Controller worker           | Persisted update state, transitions, preparation, fetch routing, activation, rollback, local cache ownership, broadcasts |
| Service client and features | Transport outcomes, finite busy state, existing user actions                                                             |
| Entity/widget/pane          | Snapshot projection, product composition, and truthful UI copy                                                           |
| Browser                     | Controller-worker `install` / `waiting` / `activate` lifecycle                                                           |

Sources of truth:

- published release: `updates/releases/<releaseNumber>.json`;
- latest published release: `updates/latest.json`, written last;
- one-time legacy baseline: `updates/legacy-migration.json`, when present;
- application lifecycle: one validated IndexedDB controller record per managed channel;
- prepared bytes: one committed Cache Storage cache per channel/release number;
- boot success: publisher-injected watchdog plus application boot report;
- UI: the last valid worker snapshot plus feature-local transport outcome.

## Release identity and publication

A release has one identity and order value:

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

- a new managed channel with no previous deployment publishes release `1`;
- every later managed release is exactly `latest.releaseNumber + 1`;
- malformed, missing, conflicting, non-monotonic, reused, or overflowing retained metadata aborts before the first write;
- `dist/updates` and immutable path collisions with different bytes abort before the first write;
- final watchdog-injected archived index bytes are hashed before publication;
- assets, archived index, descriptor, deployment files, and any one-time migration pointer are written before `latest.json`;
- `latest.json` is the final write;
- managed remote descriptors, archived indexes, and required hashed assets are append-only and are not pruned in this PR;
- only local Cache Storage cleanup is in scope;
- serialized Pages publication succeeds, or an external conflicting push fails without reallocating or overwriting a committed release.

### First managed publication over a legacy Workbox deployment

The publisher must preserve rollback before replacing the channel root:

1. Validate the existing channel deployment, its `deployment.json`, root `index.html`, and `assets/**` tree.
2. Archive that exact pre-overwrite deployment as release `1`, including a watchdog-injected archived index and integrity metadata. It is the legacy baseline.
3. Publish the new managed build as release `2`.
4. Write immutable `updates/legacy-migration.json` pointing to baseline release `1`.
5. Write `latest.json` pointing to release `2` last.

If the pre-overwrite legacy deployment cannot be validated and archived exactly enough to serve as a rollback baseline, the first managed publication fails before any target-tree write. The publisher must not silently start the managed archive from the new build.

The migration pointer is immutable and retained forever. Later releases continue from the highest managed release number and never rewrite the baseline.

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
- preparation/check progress and transient errors are not persisted;
- invalid state fails closed and is never automatically repaired;
- no separate latest, approved, activation-target, or failed-release record exists.

## Install and controller-upgrade contract

An installing managed worker first reads controller state:

- valid state is preserved unchanged;
- invalid state rejects installation;
- absent state requires explicit install classification.

### Managed-controller probe

Every managed controller responds to one narrow, read-only controller-to-controller probe with its protocol version, controller kind, and channel. The probe exposes no application state and performs no mutation.

An installing worker probes `registration.active` with a bounded `MANAGED_CONTROLLER_PROBE_TIMEOUT_MS = 5_000` before authorizing any legacy migration.

Classification for absent state:

- **genuine first registration:** no active worker exists for the registration;
- **missing-state managed upgrade:** the active worker returns the valid matching managed-controller probe response;
- **proven legacy Workbox migration:** an active worker exists, no valid managed-controller response is received, the exact known same-channel frozen Workbox precache and channel-root navigation fallback are positively identified, and the immutable migration pointer plus baseline descriptor are valid;
- every other result is ambiguous and rejects installation.

A stale legacy cache is never sufficient to override a valid managed-controller probe. Required failure case:

```text
active managed worker
+ absent or invalid controller state
+ stale legacy Workbox cache
→ installation rejected
```

Probe failure plus incomplete, mismatched, or unknown legacy evidence is fail-closed. The system does not infer migration merely from an active worker or an arbitrary Workbox-looking cache.

### Initialization results

- genuine first registration fully prepares published latest and persists it as the initial active baseline;
- proven legacy migration fully prepares the archived legacy baseline as `activeRelease` and persists published latest as `candidate: available` when it is newer;
- missing-state managed upgrade rejects installation;
- failed preparation or persistence rejects installation and leaves the previous worker active.

The genuine first-registration baseline is the only case where a newly selected application release becomes active without `BOOT_OK`, because no previous application release exists for rollback.

Legacy migration is not that exception: it persists the exact pre-overwrite legacy deployment as active, so the application release does not change when the managed controller activates. The new managed release remains a normal candidate and must pass clean-launch activation and durable `BOOT_OK` before becoming active.

An active managed worker must never observe legitimate absent state. For worker-owned navigation or assets, both absent and invalid state return controlled `503`; ordinary first-page bootstrap occurs before a managed worker controls the page.

## Candidate policy and transitions

Releases are applied serially:

- `available` may be replaced by a strictly newer discovery;
- `failed` may be replaced by a strictly newer eligible discovery;
- `ready` and `activating` are pinned and never superseded;
- Manual background discovery skips `failed`; explicit Manual check may replace it with a newer release;
- Automatic may replace `failed` with a newer release but never retries the exact failed release;
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
| matching durable `BOOT_FAILED(B)` or expired activation         | active unchanged; `failed(B)`               |
| stale/wrong completion or acknowledgement                       | no-op                                       |

Every long completion re-reads state and may persist only when mode, candidate number, and phase still match its original target. Every no-op transition returns the original state object.

## Mode-change follow-up

`SET_MODE` is always a short command. It persists only the preference, posts its response, and sends one invalidation when the mode changed.

After a successful Manual → Automatic change, deferred work is attached to the same message event after the response:

| Fresh state after response | Deferred Automatic reconciliation                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `available(B)`             | prepare exact B; persist `ready(B)` only if mode/number/phase still match                                   |
| `failed(B)`                | discover a strictly newer release; never retry B; prepare the newer available candidate if one is persisted |
| no candidate               | discover now; prepare the resulting available candidate if one is persisted                                 |
| `ready` or `activating`    | no follow-up beyond the mode change                                                                         |

This reconciliation is an explicit trigger and does not depend on the once-per-worker navigation scheduler having not run yet. Discovery and preparation remain outside `OperationQueue`; each later durable transition emits its own invalidation.

Manual mode changes never start discovery or preparation. Stale reconciliation completion is a no-op and may only schedule best-effort cleanup of an unowned prepared cache.

## Command, transport, and event lifetime

Timeouts are separate contracts:

- UI short-command transport timeout: `10_000ms` for `GET_SNAPSHOT`, `SET_MODE`, and `CANCEL_SCHEDULED_UPDATE`;
- UI long-command transport timeout: `LONG_REQUEST_TIMEOUT_MS = 120_000` for `CHECK_FOR_UPDATES` and `INSTALL_ON_NEXT_LAUNCH`;
- watchdog `BOOT_OK` / `BOOT_FAILED` acknowledgement and activation-status request timeout: `BOOT_ACK_TIMEOUT_MS = 5_000`;
- activation boot-confirmation deadline: `BOOT_CONFIRMATION_TIMEOUT_MS = 30_000`.

The service-client transport result is explicit:

```ts
type AppUpdateClientResult<T> =
  | { status: 'success'; value: T }
  | { status: 'timeout' }
  | { status: 'unavailable' };
```

- `timeout` ends feature-local busy state but preserves the last valid snapshot and capability state;
- timeout may produce a feature-local action failure, but must not replace the entity snapshot with unavailable state;
- `unavailable` is reserved for no controller/capability or an invalid/stable failure response;
- a worker operation already owned by `event.waitUntil` is not cancelled by client timeout;
- a later durable result is surfaced through the normal invalidation broadcast and snapshot refresh;
- no operation ID, polling, or persisted operation state is added.

`CHECK_FOR_UPDATES` owns discovery and responds after its discovery transition. Automatic preparation runs after the response as deferred worker work. Manual install waits for exact-candidate preparation because success means the candidate became `ready`.

Only two worker-local orchestration mechanisms remain:

- `OperationQueue` for short read/decide/persist transactions;
- `PreparationCoordinator` for preparation deduplication and cleanup arbitration.

Long network, hashing, preparation, discovery, and cleanup work never run under the queue.

Mandatory ordering:

```text
persist result
→ post response
→ invoke deferred lifetime work
→ await it inside the originating event.waitUntil
```

Every foreground durable change sends exactly one post-response invalidation. Each later background durable transition sends its own invalidation. No-op and failed persistence send none. Rollback acknowledgement is posted before rollback broadcast begins.

## Fetch routing and activation

`src/sw.ts` decides ownership before reading state or opening caches. It calls `respondWith()` only for:

- same-origin, same-channel top-level navigation;
- same-origin paths under `<channelBasePath>assets/**`.

Cross-origin requests, `updates/**`, manifest, icons, APIs, fonts, and every other path remain ordinary browser network behavior.

For owned requests:

| State             | Result                                        |
| ----------------- | --------------------------------------------- |
| absent or invalid | controlled `503`; no live-deployment fallback |
| valid             | serve the selected exact release              |

Selected release is the candidate only while `activating`; otherwise it is active. Missing or corrupt selected cache is restored only from its exact immutable archive, or returns `503`.

Portable activation contract:

```text
close every Mioframe window
→ reopen Mioframe
→ ready candidate starts activation
```

The worker does not classify reloads. Expired activation recovery persists `failed`, serves the unchanged active release to the current navigation, and broadcasts rollback only to other same-channel windows; current navigation client IDs are excluded.

## Local cache ownership

Protected local cache numbers are exactly:

- active release;
- candidate release, when present;
- coordinator in-flight preparations.

Cleanup runs only when ownership may shrink: startup maintenance, candidate replacement, successful `BOOT_OK`, or stale preparation completion. Mode changes and phase changes for the same candidate do not require cleanup. Cleanup is best effort and event-lifetime tracked; no durable cleanup queue exists.

Legacy caches are not an ownership source. Their deletion is housekeeping only; migration authorization depends on the active-worker probe plus exact legacy evidence, never cleanup success.

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

Entity status is a direct projection of `candidate.phase`. Existing user actions remain Check, mode change, Install on next launch, Retry update, and Cancel scheduled update. Update-available notification is Manual `available` only and is deduplicated by release number. Connectivity remains widget-local.

A timeout preserves this snapshot. Feature-local busy/error state changes must not erase a previously valid snapshot or mark the controller unsupported.

## Acceptance matrix

| Scenario                                            | Required result                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| New-channel first registration                      | verified latest becomes initial baseline before worker install succeeds                           |
| First managed publication over legacy               | exact pre-overwrite deployment archived as baseline 1; new build published as candidate release 2 |
| Proven legacy migration                             | archived legacy baseline becomes active; latest remains candidate and requires `BOOT_OK`          |
| Managed active + missing state + stale legacy cache | managed probe identifies upgrade; installation rejected                                           |
| Unknown/ambiguous active worker + absent state      | installation rejected                                                                             |
| Managed upgrade + valid state                       | state preserved unchanged                                                                         |
| Managed upgrade + absent/invalid state              | installation rejected                                                                             |
| Active runtime + absent/invalid state               | owned navigation/assets return `503`                                                              |
| Manual → Automatic with available                   | response first, then exact candidate preparation                                                  |
| Manual → Automatic with failed/no candidate         | response first, then discovery; exact failed candidate is not retried                             |
| Long-request timeout                                | busy clears; last snapshot/capability remain; late broadcast may refresh                          |
| Manual deferral                                     | active continues indefinitely; remote archive remains available                                   |
| Automatic preparation failure                       | Automatic and `available` remain; later eligible trigger retries                                  |
| Mode change during preparation                      | stale completion cannot overwrite current mode/candidate                                          |
| Ready/activating B, C published                     | B remains selected; C is considered later                                                         |
| Candidate boot succeeds                             | durable commit before invalidation and cleanup                                                    |
| Candidate boot fails/expires                        | previous active remains; candidate becomes failed                                                 |
| Missing selected cache                              | exact restoration or `503`, never live deployment                                                 |
| Stable/develop                                      | state, caches, clients, and broadcasts never cross channels                                       |
| Rollback data compatibility                         | previous active can still read data written by the newer supported release                        |

## Required proof and verification

Primary proof owners:

- deterministic publisher, schema, transition, orchestration, cache, protocol, probe, and client-transport tests;
- real `src/sw.ts` wiring tests for fetch ownership and response/follow-up ordering;
- component/entity tests for candidate-phase actions, timeout outcome, snapshot preservation, and busy reset;
- existing managed-update release E2E for first install, archived legacy migration, managed active plus stale legacy cache, missing-state rejection, Automatic follow-up, Manual, activation, rollback, restoration, isolation, uncontrolled windows, and cross-engine close-all-and-reopen;
- publisher artifact tests proving legacy-baseline archive integrity, append-only remote archives, and pre-write failure safety.

Final gate:

```text
pnpm verify:release
```

## Forbidden

- old multi-reference fields or aliases;
- UUID plus sequence identity;
- making the new managed build the active baseline during legacy migration;
- authorizing migration from cache evidence without first probing the active worker;
- treating arbitrary absent state as first install;
- leaving Automatic idle after a Manual → Automatic change in available/failed/no-candidate state;
- treating timeout as capability loss or clearing the last valid snapshot;
- remote archive pruning;
- unbounded client waits;
- persisted operation/progress state, IDs, polling, or backoff;
- generic manager/registry/RPC abstractions;
- long work under `OperationQueue`;
- superseding `ready` or `activating`;
- live-deployment fallback for owned requests;
- browser-specific reload logic;
- user-data rollback or irreversible migration without separate architecture;
- shared Material/global-style changes.

## Implementation readiness

Release migration, active-worker identification, Automatic mode follow-up, transport outcomes, timeout boundaries, data compatibility, state, ownership, failure behavior, proof, and verification decisions are resolved.

Unresolved blockers: none.

Verdict: **ready**.
