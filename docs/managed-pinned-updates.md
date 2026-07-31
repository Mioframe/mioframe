# Managed pinned application updates — architecture handoff

**Implementation readiness: ready.**

This is the canonical implementation contract for PR 169. It replaces the current UUID/sequence and multi-reference controller-state design. The current implementation is reusable evidence, not a compatibility contract.

## Goal

Stable (`/`) and develop (`/branch/develop/`) support Automatic and Manual application updates while preserving these guarantees:

- an existing active application release changes only through a clean-launch candidate activation followed by durable `BOOT_OK`;
- failed candidate activation leaves the previous active release selected;
- navigation and release assets are served only from the selected immutable archive;
- controller-worker code upgrades never silently select a different application release;
- all same-channel windows observe durable state changes;
- application rollback never rolls back user data.

Manual branches keep generated Workbox behavior. PR previews remain non-PWA.

## Non-goals

- arbitrary historical-version selection;
- forcing open sessions to update;
- reload detection or browser-specific lifecycle branches;
- persisted operation/progress state, polling, cancellation, retry counters, or backoff;
- generic RPC, release manager, cache registry, or compatibility adapter layers;
- remote archive pruning;
- user-data rollback or irreversible data migrations.

## Ownership and sources of truth

| Owner | Responsibility |
| --- | --- |
| Publisher | Append-only immutable release archive and `latest.json` |
| Controller worker | Persisted update state, transitions, preparation, fetch routing, activation, rollback, local cache ownership, broadcasts |
| Feature/entity/widget/pane | Existing user actions, reactive snapshot projection, product composition, and truthful UI copy |
| Browser | Controller-worker `install` / `waiting` / `activate` lifecycle |

Sources of truth:

- published release: `updates/releases/<releaseNumber>.json`;
- latest published release: `updates/latest.json`, written last;
- application lifecycle: one validated IndexedDB controller record per managed channel;
- prepared bytes: one committed Cache Storage cache per channel/release number;
- boot success: publisher-injected watchdog plus application boot report;
- UI: worker snapshot only.

## Release identity and publication

A release has one identity and order value:

```ts
type ReleaseNumber = number;
```

It must satisfy `Number.isSafeInteger(value) && value > 0` in publisher and runtime schemas.

```text
updates/latest.json
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
```

Publication rules:

- first release is `1`; every later release is exactly `latest.releaseNumber + 1`;
- malformed, missing, conflicting, non-monotonic, reused, or overflowing retained metadata aborts before the first write;
- `dist/updates` and immutable path collisions with different bytes abort before the first write;
- final watchdog-injected archived index bytes are hashed before publication;
- assets, archived index, descriptor, and deployment files are written before `latest.json`;
- `latest.json` is the final write;
- managed remote descriptors, archived indexes, and required hashed assets are append-only and are not pruned in this PR;
- only local Cache Storage cleanup is in scope;
- serialized Pages publication succeeds, or an external conflicting push fails without reallocating or overwriting a committed release.

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

An installing managed worker must classify the installation explicitly:

- **genuine first registration:** no active worker exists for the registration and state is absent;
- **explicit legacy Workbox migration:** an active worker exists, state is absent, and the known same-channel frozen Workbox precache is positively identified, including its channel-root navigation fallback;
- **managed controller upgrade:** an active worker exists and no legacy marker is present.

Rules:

- genuine first registration and proven legacy migration fully prepare published latest, then persist the initial baseline;
- a managed upgrade with valid state preserves it unchanged;
- a managed upgrade with absent or invalid state rejects installation;
- ambiguous absence never initializes from latest;
- after successful managed activation, same-channel legacy Workbox caches are removed so they cannot later re-authorize migration;
- failed installation leaves the previous worker active.

The initial baseline is the only boot-confirmation exception. It becomes active after complete descriptor/index/asset integrity verification and durable state persistence because no previous application release exists for rollback. `BOOT_OK` is mandatory only when moving from an existing active release to a candidate.

An active managed worker must never observe legitimate absent state. For worker-owned navigation or assets, both absent and invalid state return controlled `503`; ordinary first-page bootstrap occurs before a managed worker controls the page.

## Candidate policy and transitions

Releases are applied serially:

- `available` may be replaced by a strictly newer discovery;
- `failed` may be replaced by a strictly newer eligible discovery;
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
| matching durable `BOOT_FAILED(B)` or expired activation | active unchanged; `failed(B)` |
| stale/wrong completion or acknowledgement | no-op |

Every long completion re-reads state and may persist only when mode, candidate number, and phase still match its original target. Every no-op returns the original state object.

## Command and event-lifetime contract

Short requests use the existing 10-second transport timeout:

- `GET_SNAPSHOT`;
- `SET_MODE`;
- `CANCEL_SCHEDULED_UPDATE`;
- `BOOT_OK`;
- `BOOT_FAILED`;
- `GET_ACTIVATION_STATUS`.

`SET_MODE` persists only the preference and never waits for network, hashing, or cache writes.

`CHECK_FOR_UPDATES` and `INSTALL_ON_NEXT_LAUNCH` use a distinct finite `LONG_REQUEST_TIMEOUT_MS = 120_000`. This is only a UI transport deadline:

- timeout settles the client promise and clears feature-local busy state;
- it does not cancel worker work already owned by `event.waitUntil`;
- a later durable result is surfaced through the ordinary state-change broadcast and snapshot refresh;
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

| State | Result |
| --- | --- |
| absent or invalid | controlled `503`; no live-deployment fallback |
| valid | serve the selected exact release |

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

## Acceptance matrix

| Scenario | Required result |
| --- | --- |
| First registration | verified latest becomes initial baseline before worker install succeeds |
| Proven legacy migration | verified latest becomes baseline; old worker remains active until normal promotion |
| Managed upgrade + valid state | state preserved unchanged |
| Managed upgrade + absent/invalid state | installation rejected |
| Active runtime + absent/invalid state | owned navigation/assets return `503` |
| Manual deferral | active continues indefinitely; remote archive remains available |
| Automatic preparation failure | Automatic and `available` remain; later eligible trigger retries |
| Mode change during preparation | stale completion cannot overwrite current mode/candidate |
| Ready/activating B, C published | B remains selected; C is considered later |
| Candidate boot succeeds | durable commit before invalidation and cleanup |
| Candidate boot fails/expires | previous active remains; candidate becomes failed |
| Client long-request timeout | UI stops waiting; worker may finish and broadcast later |
| Missing selected cache | exact restoration or `503`, never live deployment |
| Stable/develop | state, caches, clients, and broadcasts never cross channels |

## Required proof and verification

Primary proof owners:

- deterministic publisher, schema, transition, orchestration, cache, protocol, and client-timeout tests;
- real `src/sw.ts` wiring tests for fetch ownership and response/follow-up ordering;
- component/entity tests for candidate-phase actions and busy reset after timeout;
- existing managed-update release E2E for first install, explicit legacy migration, managed upgrade with missing-state rejection, Automatic, Manual, activation, rollback, restoration, isolation, uncontrolled windows, and cross-engine close-all-and-reopen;
- publisher artifact tests proving append-only remote archives and pre-write failure safety.

Final gate:

```text
pnpm verify:release
```

## Forbidden

- old multi-reference fields or aliases;
- UUID plus sequence identity;
- treating arbitrary absent state as first install;
- remote archive pruning;
- unbounded client waits;
- persisted operation/progress state, IDs, polling, or backoff;
- generic manager/registry/RPC abstractions;
- long work under `OperationQueue`;
- superseding `ready` or `activating`;
- live-deployment fallback for owned requests;
- browser-specific reload logic;
- user-data rollback;
- shared Material/global-style changes.

## Implementation readiness

All product behavior, state, install classification, initial-baseline exception, transport deadlines, remote retention, ownership, failure behavior, proof, and verification decisions are resolved.

Unresolved blockers: none.

Verdict: **ready**.