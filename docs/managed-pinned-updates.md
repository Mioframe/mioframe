# Managed pinned application updates — architecture handoff

**Implementation readiness: ready.**

This is the canonical architecture contract for PR 169. Existing implementation code and tests are reusable evidence, not compatibility contracts.

## Goal

Stable (`/`) and develop (`/branch/develop/`) provide Automatic and Manual managed application updates with one active release and at most one candidate.

After the initial transition from legacy Workbox, the system guarantees:

- an active application release changes only through candidate activation followed by durable `BOOT_OK`;
- failed activation keeps the previous managed release selected;
- owned navigation and release assets use only the selected immutable archive;
- controller-worker upgrades do not silently change the selected application release;
- same-channel windows observe durable state changes;
- application rollback never rolls back user data.

Manual branches keep generated Workbox behavior. PR previews remain non-PWA.

## Accepted initial-transition boundary

The pre-managed Workbox application has no managed rollback contract. The one-time transition is therefore an explicit exception:

```text
legacy Workbox /sw.js
→ verified managed release 1 becomes the initial managed baseline
→ full rollback guarantees begin with managed release 2
```

Release 1 is a dedicated transition release. It contains the managed-update infrastructure without unrelated product changes or irreversible data changes.

A failed managed `install` leaves the legacy Workbox worker active. After release 1 activates, rollback to Workbox is not supported. If release 1 cannot finish application boot, every later owned top-level navigation re-runs reconciliation; once a corrected release is published, the worker can discover and prepare it without relying on application JavaScript.

## Non-goals

- rollback to the pre-managed Workbox deployment;
- arbitrary historical-version selection;
- forcing open sessions to update;
- browser-specific reload detection;
- persisted polling, operation IDs, progress state, cancellation, retry counters, or backoff;
- generic RPC, release manager, cache registry, compatibility adapter, migration bridge, or second worker path;
- remote archive pruning;
- irreversible user-data migration.

## Ownership and sources of truth

| Owner                   | Responsibility                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Publisher               | Append-only release archive and `latest.json`                                                     |
| Controller worker       | Bootstrap classification, state, reconciliation, preparation, fetch, activation, rollback, caches |
| Service client/features | Explicit transport outcomes, finite busy state, user actions                                      |
| Entity/widget/pane      | Snapshot projection and product composition                                                       |
| Browser                 | Service-worker `install` / `waiting` / `activate` lifecycle and registration replacement          |

Sources of truth:

- latest publication: `updates/latest.json`, written last;
- release: `updates/releases/<releaseNumber>.json`, archived index, and immutable assets;
- lifecycle: one validated IndexedDB controller record per managed channel;
- prepared bytes: one marker-last Cache Storage cache per channel/release;
- predecessor compatibility: bounded read-only messages to `registration.active`;
- UI: last valid worker snapshot plus feature-local transport outcome.

## Release contract

```ts
type ReleaseNumber = number;
```

Every publisher and runtime value must satisfy `Number.isSafeInteger(value) && value > 0`.

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
- every later release is exactly `latest.releaseNumber + 1`;
- malformed, conflicting, reused, non-monotonic, or overflowing retained metadata fails before the first write;
- immutable path collisions with different bytes fail before the first write;
- the final watchdog-injected archived index is hashed;
- assets, archived index, descriptor, and deployment files precede `latest.json`;
- `latest.json` is the final write;
- descriptors, archived indexes, and required hashed assets are append-only in this PR;
- Node and runtime validators accept exactly the same descriptor corpus.

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

- candidate number is greater than active number;
- `deadlineAt` exists only for `activating` and is valid ISO time;
- progress and transient errors are not persisted;
- invalid state is never repaired automatically;
- there are no separate latest, approved, activation-target, or failed-release records.

## Same-path bootstrap classification

Legacy and managed controllers both use `<channelBasePath>sw.js`. This preserves the browser-native update path for installed Workbox registrations.

When controller state is absent and an active predecessor exists, the installing worker runs two concurrent read-only probes with a shared 5-second deadline:

```ts
type ManagedControllerProbeResponse = {
  protocolVersion: 1;
  kind: 'managed-update-controller';
  channel: 'stable' | 'develop';
};
```

- **Managed probe:** a Mioframe managed controller returns the exact response above.
- **Compatible Workbox probe:** send Workbox's standard `CACHE_URLS` message with `payload.urlsToCache = []`; a compatible generated Workbox router returns exactly `true`, and the empty list performs no cache write.

The runtime contract does not claim that this probe uniquely identifies one historical Mioframe build. It positively identifies a compatible Workbox predecessor at the expected same-origin script URL and registration scope. Frozen stable/develop legacy artifacts prove that every known pre-managed Mioframe Workbox build satisfies this compatibility contract.

Install classification:

| Controller state | Active predecessor evidence                             | Result                                                   |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| valid            | any                                                     | preserve state unchanged; ordinary managed retry/upgrade |
| invalid          | any                                                     | reject installation                                      |
| absent           | no active worker                                        | genuine first registration                               |
| absent           | valid managed probe                                     | reject as managed-state loss                             |
| absent           | no managed response + exact compatible Workbox response | supported one-time Workbox bootstrap                     |
| absent           | timeout, conflicting, malformed, or unknown response    | reject installation                                      |

Stale caches never authorize bootstrap. Positive evidence must come from the active predecessor. The managed controller must not answer the Workbox `CACHE_URLS` identity probe.

Allowed bootstrap performs:

```text
fetch and validate latest descriptor
→ fully prepare exact release cache
→ persist initial Automatic controller state
→ perform no further fallible required work
→ allow install to complete
```

If state persistence succeeds but installation is interrupted, a later install sees valid state and preserves it. No persistent bootstrap marker is required.

The managed worker never calls `skipWaiting()` or `clients.claim()`.

## Controller compatibility invariant

`sw.js` updates independently of the selected application release. Therefore every newly published controller worker must remain compatible with every application release that can still appear as active or candidate in valid controller state.

Compatibility includes:

- persisted-state schema and meaning;
- application-to-worker protocol messages and acknowledgements;
- boot watchdog requests and rollback broadcasts;
- snapshot fields consumed by supported application releases;
- cache and archived-release lookup rules.

These contracts may evolve only additively while older releases remain supported. An incompatible controller, protocol, watchdog, snapshot, or state-schema change requires a separate fail-closed migration that first removes incompatible releases from the supported pin/rollback set.

## Candidate policy

- `available` and eligible `failed` may be replaced only by a strictly newer discovery;
- `ready` and `activating` are pinned and never superseded;
- Automatic never retries the exact failed release;
- Manual may explicitly retry the exact failed release.

| Event                                                 | Result                                       |
| ----------------------------------------------------- | -------------------------------------------- |
| newer discovery with no candidate                     | `available(new)`                             |
| newer discovery over `available` or eligible `failed` | `available(new)`                             |
| Automatic prepares matching `available`               | `ready`                                      |
| Manual installs matching `available` or `failed`      | `ready`                                      |
| Manual cancels `ready`                                | `available`                                  |
| qualifying clean launch with `ready`                  | `activating`, active unchanged               |
| matching durable `BOOT_OK`                            | candidate becomes active; candidate cleared  |
| matching `BOOT_FAILED` or expiration                  | active unchanged; candidate becomes `failed` |
| stale or mismatched completion                        | no-op                                        |

Every long completion re-reads state and persists only when mode, release number, and phase still match its target.

## Reconciliation and update discovery

One worker-owned reconciliation operation is triggered:

- after a successful Manual → Automatic change, after the response;
- by every same-channel owned top-level navigation under that fetch event's `waitUntil`, without delaying the navigation response;
- by explicit Check for updates.

There is no once-per-worker lifetime latch. Concurrent triggers coalesce only while the same reconciliation operation is in flight.

Mode behavior:

| Fresh state             | Automatic                                                      | Manual                                                 |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| no candidate            | discover; persist newer as `available`; prepare it to `ready`  | discover; persist newer as `available`; do not prepare |
| `available(B)`          | prepare exact B                                                | discover strictly newer; otherwise keep B available    |
| `failed(B)`             | discover strictly newer; never retry B; prepare a newer result | discover strictly newer; never retry B automatically   |
| `ready` or `activating` | no-op                                                          | no-op                                                  |

Manual mode therefore discovers and notifies about updates automatically but never downloads/prepares them without an explicit install action. Explicit Manual retry may prepare the exact failed candidate.

Network, hashing, discovery, preparation, and cleanup remain outside `OperationQueue`. Existing coordination deduplicates only concurrent work; no persisted scheduler or polling state is added.

## Clean launch and activation

A ready candidate starts activation only on an owned same-channel top-level navigation when no other same-channel window is open.

Normative behavior:

- controlled and uncontrolled same-channel windows both block activation;
- the navigation being evaluated is not counted as another window;
- reloading the sole remaining window counts as a new clean launch;
- concurrent navigations are serialized through the existing short-operation queue, so only one transition can create `activating`;
- stable, develop, manual branches, and PR previews are separate channels; foreign-channel clients never block or receive broadcasts.

The worker does not add browser-specific reload classification.

## Boot success

`BOOT_OK` means the minimal application launch completed, not merely that the entry module executed:

```text
root application mounted
→ initial router navigation completed
→ first Vue render completed
→ BOOT_OK
```

Failure before this point leaves the candidate uncommitted and is handled by the watchdog/activation deadline.

## Transport, ordering, fetch, and caches

Only two worker-local orchestration mechanisms remain:

- `OperationQueue` for short read/decide/persist transactions;
- `PreparationCoordinator` for preparation deduplication and cleanup arbitration.

Timeouts:

- UI short requests: 10 seconds;
- UI long Check/Install requests: 120 seconds;
- predecessor probes and watchdog acknowledgements: 5 seconds independently;
- activation deadline: 30 seconds.

```ts
type AppUpdateClientResult<T> =
  | { status: 'success'; value: T }
  | { status: 'timeout' }
  | { status: 'unavailable' };
```

Timeout clears feature-local busy state but preserves the last valid snapshot and capability. It does not cancel worker work. Late durable completion is surfaced by normal invalidation and snapshot refresh.

Required ordering:

```text
persist result
→ post response
→ start deferred work
→ await it inside the originating event.waitUntil
```

`sw.js` calls `respondWith()` only for same-channel top-level navigation and same-channel `assets/**`. Every other request remains browser network behavior. Absent or invalid state returns controlled `503` for owned requests. Missing or corrupt selected caches restore only from the exact immutable archive or return `503`.

Protected local releases are active, candidate when present, and coordinator in-flight preparations. Cleanup is best effort and event-lifetime tracked.

## Data compatibility

While an older managed release remains a supported Manual pin or rollback target, every newer managed release must keep user data readable by it. Irreversible migration requires a separate fail-closed architecture.

## Acceptance and proof

Required scenarios:

- new registration creates verified release 1 baseline;
- every frozen known Workbox artifact satisfies the compatible predecessor probe;
- unknown, conflicting, or nonresponsive predecessors fail closed;
- active managed predecessor plus absent state fails closed even with stale Workbox caches;
- interrupted bootstrap retries from valid state without selecting another release;
- release 1 checks again on every later navigation and discovers a corrected release published after an earlier unsuccessful check;
- Manual launch discovery creates `available` without preparation; Automatic discovery prepares to `ready`;
- controller upgrades remain compatible with pinned older releases and their watchdog/protocol contracts;
- clean-launch window rules and concurrent navigation serialization are proven;
- `BOOT_OK` occurs only after mount, initial routing, and first render;
- release 2 proves activation, durable `BOOT_OK`, failure rollback, and exact restoration;
- timeout, stale completion, isolation, uncontrolled-window, and cross-engine scenarios pass;
- previous supported managed release can read data after rollback.

Proof owners include deterministic publisher/runtime/state/protocol/cache/probe tests, real `sw.js` wiring tests, client/entity/component tests, and existing managed-update release E2E rewritten in place.

Final verification:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

## Forbidden

- migration bridge, second worker path, persistent bootstrap marker, or rollback to Workbox;
- UUID plus sequence or old multi-reference state;
- bootstrap from stale caches or absent state without positive predecessor evidence;
- claiming that the Workbox probe uniquely identifies a historical Mioframe build;
- once-per-worker reconciliation suppression;
- Manual background preparation;
- incompatible controller/protocol/watchdog/state changes while older releases remain supported;
- long work under `OperationQueue`;
- superseding `ready` or `activating`;
- live-deployment fallback for owned requests;
- unbounded client waits or timeout-as-capability-loss;
- persisted operation state, polling, retry counters, or backoff;
- generic manager/registry/RPC abstractions;
- remote archive pruning;
- browser-specific reload logic;
- irreversible user-data migration;
- shared Material or global-style changes.

## Implementation readiness

Product boundary, compatible legacy bootstrap, repeatable recovery, Manual discovery, clean-launch semantics, controller compatibility, boot-success boundary, state, ownership, failure behavior, proof, and verification are resolved.

Unresolved blockers: none.

Verdict: **ready**.
