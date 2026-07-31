# Managed pinned application updates — architecture handoff

**Implementation readiness: ready.**

This is the canonical architecture contract for PR 169. Existing implementation code and tests are reusable evidence, not compatibility contracts.

## Goal

Stable (`/`) and develop (`/branch/develop/`) provide Automatic and Manual managed application updates with one active release and at most one candidate.

After the initial transition from legacy Workbox, the system guarantees:

- an active release changes only through candidate activation followed by durable `BOOT_OK`;
- failed activation keeps the previous managed release selected;
- owned navigation and release assets use only the selected immutable archive;
- controller upgrades never silently select another release;
- same-channel windows observe durable state changes;
- application rollback never rolls back user data.

Manual branches keep generated Workbox behavior. PR previews remain non-PWA.

## Accepted initial-transition boundary

The existing Workbox application has no managed rollback contract. The one-time transition is therefore an explicit exception:

```text
legacy Workbox /sw.js
→ verified managed release 1 becomes the initial managed baseline
→ full rollback guarantees begin with managed release 2
```

Release 1 must contain the update infrastructure without unrelated product changes or irreversible data changes. It is published and verified as a dedicated transition release.

A failed `install` leaves the legacy worker active. After release 1 activates, there is no rollback to Workbox. Emergency recovery is a corrected later managed release: the first owned navigation triggers Automatic reconciliation in the worker even when application JavaScript cannot finish booting.

## Non-goals

- rollback to the pre-managed Workbox deployment;
- arbitrary historical-version selection;
- forcing open sessions to update;
- browser-specific reload detection;
- persisted operation/progress state, polling, cancellation, retry counters, or backoff;
- generic RPC, release manager, cache registry, compatibility adapter, or migration bridge;
- remote archive pruning;
- irreversible user-data migration.

## Ownership and sources of truth

| Owner                   | Responsibility                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Publisher               | Append-only release archive and `latest.json`                                                         |
| Controller worker       | Bootstrap classification, state, preparation, fetch routing, activation, rollback, caches, broadcasts |
| Service client/features | Explicit transport outcomes, finite busy state, user actions                                          |
| Entity/widget/pane      | Snapshot projection and product composition                                                           |
| Browser                 | Service-worker `install` / `waiting` / `activate` lifecycle                                           |

Sources of truth:

- latest publication: `updates/latest.json`, written last;
- release: `updates/releases/<releaseNumber>.json` plus archived index and immutable assets;
- lifecycle: one validated IndexedDB controller record per managed channel;
- prepared bytes: one marker-last Cache Storage cache per channel/release;
- predecessor kind: bounded read-only message probes to `registration.active`;
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

Legacy and managed controllers both use the channel-scoped `<channelBasePath>sw.js`. This is required so installed Workbox registrations discover the managed worker through the browser's native update check.

The installing worker reads controller state and, only when state is absent and an active predecessor exists, runs two concurrent bounded read-only probes with a shared 5-second deadline:

```ts
type ManagedControllerProbeResponse = {
  protocolVersion: 1;
  kind: 'managed-update-controller';
  channel: 'stable' | 'develop';
};
```

- **Managed probe:** the Mioframe controller responds with the exact shape above.
- **Legacy Workbox probe:** send Workbox's standard `CACHE_URLS` message with `payload.urlsToCache = []`; the frozen supported generated Workbox router must respond with exactly `true`. The empty list performs no cache mutation.

The supported legacy family is every stable/develop worker produced by the exact frozen pre-managed `generateSW` configuration, regardless of application build revision. Repository artifact tests must prove the positive Workbox probe and the expected channel-scoped precache/navigation/registration-shell structure.

Install classification:

| Controller state | Active predecessor evidence                                   | Result                                                   |
| ---------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| valid            | any                                                           | preserve state unchanged; ordinary managed retry/upgrade |
| invalid          | any                                                           | reject installation                                      |
| absent           | no active worker                                              | genuine first registration                               |
| absent           | valid managed probe                                           | reject as managed-state loss                             |
| absent           | valid Workbox probe plus exact supported structural evidence  | supported one-time Workbox bootstrap                     |
| absent           | timeout, conflict, malformed, unknown, or incomplete evidence | reject installation                                      |

Stale caches alone never authorize bootstrap; positive evidence must come from the active predecessor. The managed controller must not implement or answer the Workbox `CACHE_URLS` probe.

Allowed bootstrap performs:

```text
fetch and validate latest descriptor
→ fully prepare exact release cache
→ persist initial Automatic controller state
→ perform no further fallible required work
→ allow install to complete
```

If state persistence succeeds but the worker install is interrupted, a later install sees valid state and safely preserves it. No separate persistent bootstrap marker is required.

The managed worker never calls `skipWaiting()` or `clients.claim()`.

## Candidate transitions

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
| clean launch with `ready`                             | `activating`, active unchanged               |
| matching durable `BOOT_OK`                            | candidate becomes active; candidate cleared  |
| matching `BOOT_FAILED` or expiration                  | active unchanged; candidate becomes `failed` |
| stale or mismatched completion                        | no-op                                        |

Every long completion re-reads state and may persist only when mode, release number, and phase still match its target.

## Automatic reconciliation

One worker-owned operation applies these rules:

| Fresh Automatic state   | Work                                                   |
| ----------------------- | ------------------------------------------------------ |
| `available(B)`          | prepare exact B, then conditionally persist `ready(B)` |
| `failed(B)`             | discover strictly newer; never retry B                 |
| no candidate            | discover and prepare a resulting available candidate   |
| `ready` or `activating` | no-op                                                  |

It runs:

- after a successful Manual → Automatic change, after the response;
- once per worker instance from the first eligible owned navigation under that fetch event's `waitUntil`, without delaying navigation.

This second trigger also provides recovery when release 1 cannot finish application boot.

## Orchestration, transport, and broadcasts

Only two worker-local orchestration mechanisms remain:

- `OperationQueue` for short read/decide/persist transactions;
- `PreparationCoordinator` for preparation deduplication and cleanup arbitration.

Network, hashing, discovery, preparation, and cleanup never run under the queue.

Timeouts:

- UI short requests: 10 seconds;
- UI long `CHECK_FOR_UPDATES` and `INSTALL_ON_NEXT_LAUNCH`: 120 seconds;
- predecessor probes and watchdog acknowledgements: 5 seconds independently;
- activation deadline: 30 seconds.

```ts
type AppUpdateClientResult<T> =
  | { status: 'success'; value: T }
  | { status: 'timeout' }
  | { status: 'unavailable' };
```

Timeout clears feature-local busy state but preserves the last valid snapshot and capability. It does not cancel worker work. Late durable completion is surfaced through normal invalidation and snapshot refresh.

Required ordering:

```text
persist result
→ post response
→ start deferred work
→ await it inside the originating event.waitUntil
```

Foreground durable changes send one post-response invalidation. Later background durable transitions send their own. No-op and failed persistence send none.

## Fetch and cache ownership

`sw.js` calls `respondWith()` only for:

- same-origin, same-channel top-level navigation;
- same-origin `<channelBasePath>assets/**`.

Every other request remains browser network behavior. For owned requests, absent or invalid state returns controlled `503`; valid state serves the exact selected release. The candidate is selected only while `activating`; otherwise active is selected. Missing or corrupt selected caches restore only from the exact immutable archive or return `503`.

Protected local release numbers are active, candidate when present, and coordinator in-flight preparations. Cleanup is best effort and event-lifetime tracked. Legacy Workbox caches are removed after managed activation and by later startup maintenance, but they never determine managed lifecycle state.

## Data compatibility

While an older managed release remains a supported Manual pin or rollback target, every newer managed release must keep user data readable by it. Irreversible migration requires a separate fail-closed architecture and is outside this PR.

## Acceptance and required proof

Required scenarios:

- new registration creates verified release 1 baseline;
- every supported frozen-config Workbox installation positively identifies itself and migrates at the same `/sw.js`;
- unknown or ambiguous predecessors fail closed;
- active managed predecessor plus absent state fails closed even if stale legacy caches exist;
- interrupted bootstrap retries from valid state without selecting a new release;
- bootstrap failure leaves Workbox active;
- release 1 contains no unrelated product/data migration;
- first later managed release proves candidate activation, `BOOT_OK`, failure rollback, and exact restoration;
- Automatic/Manual, timeout, stale completion, isolation, uncontrolled-window, and cross-engine close-all/reopen scenarios pass;
- previous supported managed release can read data after rollback.

Proof owners include deterministic publisher/runtime/state/protocol/cache/probe tests, real `sw.js` wiring tests, client/entity/component tests, and existing managed-update release E2E rewritten in place.

Final verification:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

## Forbidden

- migration bridge, second worker path, or rollback to Workbox;
- persistent bootstrap marker;
- UUID plus sequence or old multi-reference state;
- bootstrap based only on absent state or stale caches;
- managed controller answering the Workbox identity probe;
- long work under `OperationQueue`;
- superseding `ready` or `activating`;
- live-deployment fallback for owned requests;
- unbounded client waits or timeout-as-capability-loss;
- persisted operation IDs, polling, retry counters, or backoff;
- generic manager/registry/RPC abstractions;
- remote archive pruning;
- browser-specific reload logic;
- irreversible user-data migration;
- shared Material or global-style changes.

## Implementation readiness

Product boundary, legacy support family, positive predecessor identification, crash-safe retry, state, ownership, failure behavior, proof, and verification are resolved.

Unresolved blockers: none.

Verdict: **ready**.
