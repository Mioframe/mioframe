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

| Owner | Responsibility |
| --- | --- |
| Publisher | Append-only immutable archive, one-time legacy migration metadata, frozen bridge artifact, `latest.json` |
| Migration bridge | One-time legacy-to-managed state bootstrap and baseline serving |
| Managed controller | Persisted state, transitions, preparation, fetch routing, activation, rollback, local caches, broadcasts |
| Service client/features | Explicit transport outcomes, finite busy state, user actions |
| Entity/widget/pane | Snapshot projection, product composition, truthful UI copy |
| Browser | Controller `install` / `waiting` / `activate` lifecycle |

Sources of truth:

- published release: `updates/releases/<releaseNumber>.json`;
- latest release: `updates/latest.json`, written last;
- one-time legacy baseline: `updates/legacy-migration.json`, when present;
- lifecycle state: one validated IndexedDB record per managed channel;
- prepared bytes: one committed Cache Storage cache per channel/release number;
- controller kind: bounded read-only controller-kind probe;
- boot success: publisher-injected watchdog plus application boot report;
- UI: last valid worker snapshot plus feature-local transport outcome.

## Controller migration chain

A direct legacy `sw.js` → `managed-sw.js` migration is not sufficient. The legacy Workbox app shell can keep serving its cached `index.html` and cached `registerSW.js`, which continue registering `sw.js`; therefore no page is guaranteed to call `register('managed-sw.js')`.

Migration uses three controller kinds at one unchanged channel scope:

```text
legacy Workbox:     <channelBasePath>sw.js
migration bridge:   <channelBasePath>sw.js
managed controller: <channelBasePath>managed-sw.js
```

Lifecycle:

```text
legacy sw.js native update check
→ byte-different bridge sw.js installs and waits
→ bridge activates after legacy windows close
→ bridge serves archived legacy baseline
→ bridge serves a replacement registerSW.js that registers managed-sw.js
→ managed-sw.js installs and waits
→ managed-sw.js activates after bridge-controlled windows close
```

Rules:

- `sw.js` remains the migration bridge forever so a legacy installation opened much later still has a native update target;
- the bridge artifact is byte-stable after introduction; publication and artifact tests reject accidental drift;
- the normal managed app and the bridge replacement registration script register `managed-sw.js` with the same scope;
- the bridge and managed controller never call `skipWaiting()` or `clients.claim()`;
- the bridge is migration-only infrastructure, not a second update controller.

### Controller-kind probe

Both bridge and managed controller respond to one narrow read-only probe with:

```ts
type ControllerKindResponse = {
  schemaVersion: 1;
  kind: 'migration-bridge' | 'managed';
  channel: 'stable' | 'develop';
};
```

The probe exposes no application state and performs no mutation. Its timeout is `CONTROLLER_KIND_PROBE_TIMEOUT_MS = 5_000`.

The final managed worker accepts existing state only when the active predecessor is positively identified as:

- the migration bridge for the same channel; or
- a previous managed controller for the same channel.

No response, wrong kind/channel/version, malformed response, or unknown predecessor is fail-closed.

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
sw.js                                      # frozen migration bridge
managed-sw.js                              # final managed controller
registerSW.js                              # registers managed-sw.js in the current managed app
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
  candidateReleaseNumber: number;
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
- remote descriptors, archived indexes, and required hashed assets are append-only and are not pruned in this PR;
- only local Cache Storage cleanup is in scope;
- serialized publication succeeds, or a conflicting external push fails without reallocating or overwriting a committed release.

### First managed publication over legacy Workbox

Before replacing the channel root, the publisher must:

1. Validate the exact supported legacy deployment, including `deployment.json`, root `index.html`, expected generated `registerSW.js`, and `assets/**`.
2. Archive the pre-overwrite application as release `1`, with watchdog-injected index integrity metadata. This is the rollback baseline.
3. Publish the new managed build as release `2`.
4. Publish the frozen migration bridge as `sw.js` and the final controller as `managed-sw.js`.
5. Write immutable `updates/legacy-migration.json` mapping baseline `1` to candidate `2`.
6. Write `latest.json` pointing to release `2` last.

If the legacy deployment cannot be validated and archived as a usable rollback baseline, publication fails before the first target-tree write. The publisher must not silently start the managed archive from the new build.

The migration pointer and bridge bytes are immutable and retained indefinitely. Later publications update `managed-sw.js`, the managed app, and the append-only archive, but preserve `sw.js` and the migration pointer.

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

## Migration bridge contract

The bridge is discovered only because the existing legacy registration performs its normal update check for `sw.js`.

### Bridge install

The bridge requires all of the following:

- controller state is absent;
- an active predecessor exists at the same registration;
- exact known frozen legacy Workbox precache and channel-root navigation fallback are present;
- immutable migration pointer and both referenced descriptors are valid;
- baseline and candidate numbers match the pointer and `latest.json`;
- baseline release can be prepared completely.

It then durably writes:

```ts
{
  schemaVersion: 1,
  mode: 'automatic',
  activeRelease: legacyBaseline,
  candidate: { phase: 'available', release: managedCandidate }
}
```

Failure rejects bridge installation and leaves the legacy worker active.

### Bridge runtime

The bridge owns only:

- same-channel navigation, served from the exact active legacy baseline;
- baseline `assets/**`, served/restored from that exact archive;
- exact channel-root `registerSW.js`, served as a tiny embedded script that registers `managed-sw.js` at the unchanged scope;
- the read-only controller-kind probe.

It does not implement update settings, discovery, candidate preparation, activation, boot commit, rollback, or cleanup policy. Other requests remain browser network behavior.

For absent or invalid state, bridge-owned navigation/assets return controlled `503`.

## Final managed install and upgrade

The managed worker reads state and probes the active predecessor.

- no active predecessor + absent state → genuine first registration; prepare latest and persist it as initial active baseline;
- active bridge + valid matching migration state → preserve state unchanged;
- active managed controller + valid state → preserve state unchanged;
- active bridge or managed controller + absent/invalid state → reject installation;
- legacy, unknown, malformed, timed-out, or mismatched predecessor → reject installation.

The genuine first-registration baseline is the sole case where a newly selected application release becomes active without `BOOT_OK`, because no previous release exists.

Legacy migration is not that exception: release `1` remains active, while release `2` is a normal candidate requiring clean-launch activation and durable `BOOT_OK`.

An active managed worker must never observe legitimate absent state. For owned navigation/assets, absent and invalid both return controlled `503`.

## Candidate policy and transitions

- `available` may be replaced by a strictly newer discovery;
- eligible `failed` may be replaced by a strictly newer discovery;
- `ready` and `activating` are pinned and never superseded;
- Manual background discovery skips `failed`; explicit Manual check may replace it with newer;
- Automatic may replace `failed` with newer but never retries the exact failed release;
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
| stale/wrong completion or acknowledgement | no-op |

Every long completion re-reads state and persists only when mode, candidate number, and phase still match. Every pure no-op returns the original state object.

## Manual → Automatic follow-up

`SET_MODE` is a short command: persist preference, post response, then invalidate other windows when changed.

After a successful Manual → Automatic change, deferred reconciliation runs under the same message event after the response:

| Fresh state | Deferred work |
| --- | --- |
| `available(B)` | prepare exact B; persist `ready(B)` only after fresh mode/number/phase check |
| `failed(B)` | discover strictly newer; never retry B; prepare newly persisted available candidate |
| no candidate | discover now; prepare resulting available candidate |
| `ready` or `activating` | no follow-up beyond mode change |

This trigger is independent of the once-per-worker navigation scheduler. Discovery/preparation remain outside `OperationQueue`; each later durable transition emits its own invalidation. Manual mode changes start no discovery or preparation.

## Transport and event lifetime

Timeouts are separate contracts:

- UI short transport: `10_000ms` for `GET_SNAPSHOT`, `SET_MODE`, `CANCEL_SCHEDULED_UPDATE`;
- UI long transport: `LONG_REQUEST_TIMEOUT_MS = 120_000` for `CHECK_FOR_UPDATES`, `INSTALL_ON_NEXT_LAUNCH`;
- controller-kind probe and watchdog controller request/ack: `5_000ms` independently;
- activation deadline: `BOOT_CONFIRMATION_TIMEOUT_MS = 30_000`.

```ts
type AppUpdateClientResult<T> =
  | { status: 'success'; value: T }
  | { status: 'timeout' }
  | { status: 'unavailable' };
```

- timeout clears feature-local busy state but preserves the last valid snapshot and capability;
- timeout may produce a feature-local action failure, but must not replace the entity snapshot with unavailable;
- unavailable is reserved for no managed controller/capability or invalid/stable failure response;
- client timeout does not cancel worker work already owned by `event.waitUntil`;
- late durable completion is surfaced by normal invalidation and snapshot refresh;
- no operation IDs, polling, or persisted operation state are added.

`CHECK_FOR_UPDATES` responds after discovery; Automatic preparation is deferred after the response. Manual install waits for exact-candidate preparation because success means `ready`.

Only two managed-controller orchestration mechanisms remain:

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

## Managed fetch routing and activation

`managed-sw.js` decides ownership before state/cache access and calls `respondWith()` only for:

- same-origin, same-channel top-level navigation;
- same-origin `<channelBasePath>assets/**`.

Cross-origin requests, `updates/**`, manifest, icons, APIs, fonts, registration scripts, and every other path remain browser network behavior.

| State | Owned request result |
| --- | --- |
| absent or invalid | controlled `503`; no live fallback |
| valid | serve exact selected release |

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

Legacy Workbox caches and bridge artifacts are not lifecycle ownership sources. Bridge authorization depends on exact frozen legacy evidence during bridge install; final managed authorization depends on a positive bridge/managed probe.

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
| New-channel first registration | managed-sw.js verified latest becomes initial baseline |
| Legacy user opens after first managed publish | native sw.js update discovers bridge without new app-shell registration code |
| Bridge install | exact archived legacy release becomes active; managed release remains available candidate |
| Bridge-controlled launch | replacement registerSW.js explicitly registers managed-sw.js at same scope |
| Final managed install over bridge | positive bridge probe plus valid state; state preserved |
| Managed active + missing/invalid state + stale legacy cache | managed probe identifies upgrade; installation rejected |
| Unknown or nonresponsive predecessor | installation rejected |
| Active runtime + absent/invalid | owned navigation/assets return `503` |
| Manual → Automatic + available | response first, then exact candidate preparation |
| Manual → Automatic + failed/none | response first, then discovery; exact failed candidate not retried |
| Long-request timeout | busy clears; snapshot/capability remain; late broadcast may refresh |
| Manual deferral | active and remote archive remain available indefinitely |
| Ready/activating B, C published | B remains selected |
| Candidate boot succeeds | durable commit before invalidation/cleanup |
| Candidate boot fails/expires | previous active remains; candidate failed |
| Missing selected cache | exact restoration or `503` |
| Stable/develop | no cross-channel state/cache/client/broadcast leakage |
| Rollback data compatibility | previous supported active can read data written by newer supported release |

## Required proof

- deterministic publisher, descriptor parity, state transition, cache, bridge, controller-kind probe, orchestration, protocol, watchdog, and client-transport tests;
- real bridge and `managed-sw.js` wiring tests;
- component/entity tests for candidate actions, timeout outcome, snapshot preservation, and busy reset;
- existing release E2E rewritten for native legacy → bridge discovery, bridge baseline serving, bridge → managed registration, managed missing-state rejection, Automatic follow-up, Manual, activation, rollback, restoration, isolation, uncontrolled windows, and cross-engine lifecycle;
- publisher tests for legacy-baseline integrity, frozen bridge bytes, append-only archive, and pre-write safety.

Final gate:

```text
pnpm verify:release
```

## Forbidden

- old multi-reference fields/aliases;
- UUID plus sequence;
- direct legacy sw.js → managed-sw.js migration without bridge;
- removing or repurposing the retained sw.js bridge;
- making the new managed build active during legacy migration;
- accepting state without a positive bridge/managed predecessor probe;
- treating arbitrary absent state as first install;
- implementing normal update behavior in the bridge;
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

Migration reachability, rollback baseline, controller identification, Automatic follow-up, transport outcomes, timeout boundaries, data compatibility, state, ownership, failure behavior, proof, and verification are resolved.

Unresolved blockers: none.

Verdict: **ready**.
