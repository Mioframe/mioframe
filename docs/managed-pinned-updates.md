# Managed pinned application updates — architecture handoff

**Implementation status: complete; final merge readiness depends on the resulting-head repository gate, final complete-PR review, and operator UI/accessibility acceptance.**

This is the canonical architecture contract for PR 169. Existing unshipped implementation formats are replaceable evidence, not compatibility contracts.

## Goal

Stable (`/`) and develop (`/branch/develop/`) provide Automatic and Manual managed application updates with one selected active release and at most one candidate.

After the one-time Workbox transition:

- an application release changes only through candidate activation followed by durable `BOOT_OK`;
- failed activation keeps the previous managed release selected;
- owned navigation and assets use only the selected immutable archive;
- controller-worker upgrades do not silently change the selected application release;
- same-channel windows observe durable state changes;
- rollback never rolls back user data.

Manual branches keep generated Workbox behavior. PR previews remain non-PWA.

## Accepted initial-transition boundary

The pre-managed Workbox application has no managed rollback contract:

```text
legacy Workbox /sw.js
→ verified managed release 1 becomes the initial managed baseline
→ full rollback guarantees begin with managed release 2
```

Managed release 1 is the complete application artifact shipped by the promotion that introduces the managed worker. It is not required to be infrastructure-only and may include already-reviewed product fixes or accumulated `develop` changes present in that promotion.

This is an explicit accepted release risk, not an implicit rollback guarantee:

- a failed managed worker `install` leaves the compatible Workbox predecessor active;
- after managed release 1 activates, rollback to Workbox is unsupported;
- managed release 1 must contain no irreversible user-data migration;
- managed release 1 must pass complete product, UI/accessibility, managed-update, and release verification as one artifact;
- if release 1 cannot finish application boot, later owned top-level navigations continue reconciliation so a corrected managed release 2 remains discoverable without application JavaScript;
- rollback between managed application releases begins with release 2.

## Non-goals

- rollback to Workbox or arbitrary historical-version selection;
- forcing open sessions to update;
- browser-specific reload classification;
- persisted polling, operation IDs, progress, cancellation, retry counters, or backoff;
- generic RPC, release manager, cache registry, migration bridge, second worker path, compatibility adapter, or persistent bootstrap marker;
- build reproducibility verification inside the publisher;
- remote archive pruning;
- irreversible user-data migration.

## Ownership and sources of truth

| Owner                   | Responsibility                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Publisher               | deterministic source identity, append-only release archive, idempotent publication, `latest.json`   |
| Controller worker       | bootstrap classification, lifecycle state, reconciliation, preparation, fetch, activation, rollback |
| Service client/features | typed transport outcomes, finite busy state, user actions                                           |
| Entity/widget/pane      | snapshot projection and product composition                                                         |
| Browser                 | service-worker lifecycle and registration replacement                                               |

Sources of truth:

- latest publication: `updates/latest.json`, written last;
- release: `updates/releases/<releaseNumber>.json`, archived index, and immutable assets;
- lifecycle: one validated IndexedDB record per managed channel;
- prepared bytes: one marker-last Cache Storage cache per channel/release;
- predecessor compatibility: bounded read-only messages to `registration.active`;
- UI: last valid worker snapshot plus feature-local transport outcome.

## Release identity and publication

```ts
type ReleaseNumber = number;

type ReleaseFile = {
  path: string;
  sha256: string;
  byteSize: number;
};

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

`releaseNumber` is a positive safe integer and the sole ordering identity inside one managed channel.

A complete release identity is the four-field `ReleaseSummary`:

```ts
type ReleaseSummary = {
  releaseNumber: number;
  appVersion: string;
  buildId: string;
  buildDate: string;
};
```

Two releases are the same exact release only when all four fields match. A shared `releaseNumber` is sufficient for ordering and archive lookup, but never sufficient to prove cache, descriptor, restoration, or in-flight preparation identity.

For managed stable/develop publication:

- `buildId` is the exact source commit SHA;
- `buildDate` is the canonical UTC committer timestamp of that commit, not workflow execution time;
- the same `buildDate` is passed to Vite `__BUILD_DATE__`, descriptor generation, and `deployment.json`;
- channel publication remains serialized by the existing Pages publication concurrency gate.

Publication is channel-local and idempotent by `buildId`:

```text
validate complete retained tree

buildId absent
→ allocate latest.releaseNumber + 1, or 1 for an empty archive
→ validate and publish the new artifact

buildId == unique latest buildId
→ return the retained latest descriptor
→ perform zero writes

buildId exists on a non-latest descriptor, or is duplicated
→ reject before writes
```

The latest-build rerun path does not rebuild an old release, compare output trees, inspect current `dist`, or copy any current artifact bytes. Publishing changed bytes requires a different source commit. Build reproducibility may be checked independently in CI, but it is not part of the publication state machine.

Additional publication rules:

- validate retained descriptors, unique `buildId` values, archived indexes, required immutable assets, and `latest.json` before allocation or writes;
- retained archived indexes must exist as regular files and match their descriptor's exact `indexByteSize` and `indexSha256`;
- every retained `descriptor.files` entry must exist at its canonical channel path as a regular file and match its exact `byteSize` and `sha256`;
- a physical immutable path referenced by multiple descriptors must satisfy every reference; conflicting retained metadata or bytes fail before writes;
- malformed, conflicting, non-monotonic, reused, overflowing, missing, truncated, or hash-mismatched retained content fails before writes;
- immutable path collisions with different bytes fail before writes for a new release;
- hash the final watchdog-injected archived index;
- write assets, archived index, descriptor, and channel deployment files before `latest.json`;
- write `latest.json` last;
- retain descriptors, archived indexes, and required hashed assets append-only in this PR.

The same source commit may exist independently in stable and develop because archives are channel-scoped.

## Persisted state

```ts
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
- persisted objects are fail-closed: obsolete or unknown persisted fields are rejected, not stripped, normalized, repaired, or migrated;
- invalid state is never repaired automatically;
- no separate latest, approved, activation-target, failed-release, or operation records exist.

## Normative lifecycle transitions

`available` and eligible `failed` may be replaced only by a strictly newer discovery. `ready` and `activating` are pinned and never superseded. Automatic never retries the exact failed release; Manual may explicitly retry it.

| Event                                | Final state                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| Newer discovery                      | `candidate = available(new)`                                |
| Automatic preparation succeeds       | matching `available → ready`                                |
| Manual Install succeeds              | matching `available/failed → ready`                         |
| Manual Cancel                        | matching `ready → available`                                |
| Qualifying clean launch              | matching `ready → activating(deadlineAt)`; active unchanged |
| Matching durable `BOOT_OK`           | candidate becomes active; candidate cleared                 |
| Matching `BOOT_FAILED` or expiration | active unchanged; candidate becomes `failed`                |
| Stale or mismatched completion       | no state change                                             |

Every long completion re-reads state and persists only when mode, complete target identity where applicable, release number, and phase still match its target. A contractual no-op returns the original state reference.

## Same-path Workbox bootstrap

Legacy and managed controllers both use `<channelBasePath>sw.js`, preserving the browser-native update path.

When state is absent and an active predecessor exists, the installing worker sends two concurrent read-only probes with one shared 5-second deadline:

```ts
type ManagedControllerProbeRequest = {
  protocolVersion: 1;
  type: 'PROBE_MANAGED_UPDATE_CONTROLLER';
};

type ManagedControllerProbeResponse = {
  protocolVersion: 1;
  kind: 'managed-update-controller';
  channel: 'stable' | 'develop';
};
```

The Workbox probe sends standard `CACHE_URLS` with `payload.urlsToCache = []`; compatible generated Workbox returns exact `true` without a cache write. It proves compatibility, not unique historical Mioframe identity. Frozen legacy artifacts prove all known pre-managed Mioframe workers satisfy it.

| Managed probe                                                    | Workbox probe     | Result                         |
| ---------------------------------------------------------------- | ----------------- | ------------------------------ |
| valid managed response                                           | missing or silent | managed predecessor            |
| silent by deadline                                               | exact `true`      | compatible Workbox predecessor |
| valid managed response                                           | exact `true`      | conflict; reject               |
| malformed response from either probe                             | any               | reject                         |
| no managed success and Workbox missing, timed out, or non-`true` | any               | reject                         |

Install classification:

| State   | Predecessor                                 | Result                                     |
| ------- | ------------------------------------------- | ------------------------------------------ |
| valid   | any                                         | preserve unchanged; ordinary retry/upgrade |
| invalid | any                                         | reject                                     |
| absent  | no active worker                            | genuine first registration                 |
| absent  | managed predecessor                         | reject as managed-state loss               |
| absent  | compatible Workbox                          | supported one-time bootstrap               |
| absent  | unknown/conflicting/malformed/nonresponsive | reject                                     |

Stale caches never authorize bootstrap. The managed controller never answers Workbox `CACHE_URLS`.

Allowed bootstrap:

```text
fetch and validate latest
→ fetch and validate its exact descriptor
→ fully prepare exact release cache
→ persist initial Automatic state
→ perform no further required fallible work
→ complete install
```

If install is interrupted after state persistence, the next install preserves that valid state. No persistent bootstrap marker is required. The managed worker never calls `skipWaiting()` or `clients.claim()`.

## Preparation coordination and exact identity

`PreparationCoordinator` owns only worker-local preparation deduplication and arbitration with cleanup. It does not own discovery, state transitions, retries, or lifecycle policy.

Each in-flight preparation entry contains both:

```ts
type InFlightPreparation = {
  expectedRelease: ReleaseSummary;
  promise: Promise<ReleaseDescriptor>;
};
```

Normative join policy:

```text
no in-flight entry for releaseNumber
→ create entry with complete expected ReleaseSummary

same releaseNumber + complete summary matches
→ join existing promise

same releaseNumber + any summary field differs
→ reject fail-closed
→ do not join, replace, or mutate the existing attempt
```

A caller-provided validated descriptor may be reused only when `toReleaseSummary(descriptor)` exactly matches the target summary on `releaseNumber`, `appVersion`, `buildId`, and `buildDate`. A descriptor matching only by number is rejected or ignored and refetched according to the caller contract; it is never prepared as the target.

A fetched restoration descriptor must match the complete persisted target summary before any cache preparation. Bootstrap is the only flow that begins from a bare latest pointer, because no prior complete summary exists yet; after validating that descriptor, its own complete summary becomes the target.

The coordinator may key lookup by release number because channel publication forbids legitimate number reuse, but it must retain the complete expected summary inside each entry and detect same-number identity conflicts explicitly.

## Managed compatibility baseline

The pure-contract stage establishes the release-1 descriptor, state, protocol, snapshot, and watchdog contracts. Existing unshipped PR formats are removed, not preserved or migrated.

Compatibility obligations begin with the first published managed release. Every later `sw.js` must remain compatible with every application release that can still appear as active or candidate in valid state, including:

- persisted-state meaning;
- application/worker messages and acknowledgements;
- watchdog requests and rollback broadcasts;
- snapshot fields;
- cache and archive lookup.

Contracts may evolve only additively while older releases remain supported. An incompatible change requires a separate fail-closed migration that first removes incompatible releases from the supported pin/rollback set.

## Reconciliation

Reconciliation is triggered by:

- every owned same-channel top-level navigation under that fetch event's `waitUntil`, without delaying its response;
- explicit Check for updates;
- every successful mode change, after the response.

The reconciliation module owns only two worker-local guards:

```ts
let inFlightPromise: Promise<Snapshot> | undefined;
let rerunRequested = false;
```

Normative trigger behavior:

```text
trigger while idle
→ create the shared promise
→ run one pass from fresh state

navigation while in flight
→ join only

explicit Check while in flight
→ join only and receive the final snapshot

successful mode change while in flight
→ set rerunRequested = true
→ join the shared promise

pass completes
→ if rerunRequested, clear the flag and run one fresh-state pass
→ otherwise resolve and clear the promise
```

A later mode change during the rerun may set the same boolean again. The promise settles only after a pass completes without a pending mode-change rerun. Navigation and Check never request an additional pass merely because they were concurrent.

This is local deduplication, not a scheduler, manager, or persisted operation state. Every triggering event attaches the shared promise to its own lifetime.

This guarantees:

- Manual discovery in flight → switch to Automatic → a fresh pass prepares the newest eligible candidate without another navigation;
- Automatic preparation in flight → switch to Manual → downloaded bytes may finish, but stale mode checks prevent automatic `ready`; the fresh pass follows Manual semantics.

Mode behavior per fresh pass:

| State                   | Automatic                                                            | Manual                                               |
| ----------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| no candidate            | discover; persist newer `available`; prepare to `ready`              | discover; persist newer `available`; do not prepare  |
| `available(B)`          | discover latest first; replace with newer C; prepare final candidate | discover strictly newer; otherwise keep B            |
| `failed(B)`             | discover strictly newer; never retry B; prepare newer result         | discover strictly newer; never retry B automatically |
| `ready` or `activating` | no-op                                                                | no-op                                                |

For Automatic `available(B)`, failed discovery retains B, does not advance `lastSuccessfulCheckAt`, and may prepare B as an offline or metadata-failure fallback.

Network, hashing, discovery, preparation, and cleanup stay outside `OperationQueue`. `PreparationCoordinator` remains limited to preparation deduplication and cleanup arbitration.

## Fetch ownership and fail-closed responses

`sw.js` owns exactly:

- same-channel top-level document navigation;
- same-channel `<channelBasePath>assets/**`.

The mechanical top-level navigation predicate is:

```ts
request.mode === 'navigate' && request.destination === 'document';
```

Navigation requests whose destination is `iframe`, `frame`, `embed`, `object`, or any other non-`document` destination are not owned. They remain ordinary browser network behavior. Foreign channels, PR previews, cross-origin requests, `updates/**`, manifests, PWA icons outside `assets/**`, APIs, fonts outside `assets/**`, and all other requests are also not owned and must return from the fetch listener without `respondWith()`.

For every owned request, the promise passed to `respondWith()` must always resolve to a `Response`. It must never reject because of an unexpected controller-state, IndexedDB, Cache Storage, marker parsing, cache enumeration, cache read, restoration, or post-restoration validation exception.

The outer owned-request boundary is:

```text
normal owned result
→ return archived index, cached asset, controlled 404, or controlled 503

any unexpected state/storage/cache/restoration exception
→ resolve to the stable controlled 503 response
→ never reject respondWith
→ never fetch the live deployment
```

Expected owned-request behavior:

| Condition                                                     | Result                 |
| ------------------------------------------------------------- | ---------------------- |
| state absent or invalid                                       | controlled `503`       |
| exact selected cache available                                | serve selected archive |
| selected descriptor does not list requested owned asset       | controlled `404`       |
| cache absent, incomplete, malformed, or exact summary differs | restore exact release  |
| restoration or revalidation fails                             | controlled `503`       |
| infrastructure exception at any owned boundary                | controlled `503`       |

Missing or corrupt selected caches restore only the exact immutable release. No owned path may substitute another release or current deployment bytes.

Stage 3 serves `activeRelease` only. Candidate phases are ignored for fetch selection until Stage 5 explicitly adds activating-candidate serving.

## Clean launch, boot success, and activation

A ready candidate starts activation on an owned same-channel top-level document navigation only when no other same-channel window is open.

- controlled and uncontrolled same-channel windows block activation;
- the evaluated navigation is not counted as another window;
- after all same-channel windows close, the next safe application start is a qualifying clean launch;
- reloading the sole remaining window may qualify when the browser exposes sufficient navigation identities, but identical reload classification is not a cross-engine requirement;
- reload and close/reopen are equivalent user-level restart actions; Mioframe does not add browser-specific reload classification;
- concurrent navigations serialize the short state transition, producing one `activating` transition;
- foreign channels and PR previews neither block nor receive broadcasts.

`BOOT_OK` means:

```text
root application mounted
→ initial router navigation completed
→ first Vue render completed
→ BOOT_OK
```

Before this point the candidate remains uncommitted and the watchdog/deadline may roll it back.

Protected local releases are active, candidate when present, and in-flight preparations. Cleanup is best effort and event-lifetime tracked.

## Transport

- short UI requests: 10 seconds;
- Check/Install requests: 120 seconds;
- predecessor probes and watchdog acknowledgements: 5 seconds independently;
- activation deadline: 30 seconds.

```ts
type AppUpdateClientResult<T> =
  | { status: 'success'; value: T }
  | { status: 'timeout' }
  | { status: 'unavailable' };
```

Timeout clears feature-local busy state but preserves the last snapshot and capability. It does not cancel worker work.

Required ordering:

```text
persist result
→ post response
→ start deferred work
→ await it in the originating event.waitUntil
```

## Data compatibility

While an older managed release remains a supported Manual pin or rollback target, every newer release must keep user data readable by it. Irreversible migration requires a separate fail-closed architecture.

## Acceptance and proof

Required proof includes:

- safe release allocation, retained-tree validation, append-only archive, and `latest.json` last;
- canonical source commit timestamp in all managed build metadata;
- latest repeated `buildId` is a zero-write no-op without output reconstruction;
- repeated non-latest or duplicate retained `buildId` rejects before writes;
- exact Workbox probe matrix and interrupted-install retry;
- full-summary reusable-descriptor validation and same-number in-flight conflict rejection;
- exact top-level document ownership, including iframe/non-document navigation pass-through;
- every owned fetch promise resolves to a `Response`, including storage/cache exception paths;
- delayed release-1 recovery;
- complete lifecycle transition table;
- latest-first Automatic and Manual discovery without preparation;
- navigation and Check join without rerun; mode changes request a fresh-state rerun;
- both in-flight mode-change scenarios;
- controller compatibility with pinned releases;
- clean-launch window rules, `BOOT_OK`, rollback, exact restoration, isolation, uncontrolled windows, and cross-engine lifecycle;
- previous supported managed releases can read newer data after rollback.

Final verification:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

## Forbidden

- bridge, second worker path, persistent bootstrap marker, or rollback to Workbox;
- old UUID/multi-reference state or preservation of unshipped formats;
- more than one candidate;
- full-output reconstruction or byte comparison for latest-build publication reruns;
- generic reconciliation manager or expanding `PreparationCoordinator` into discovery;
- joining same-number preparation when complete release summaries differ;
- accepting a reusable or fetched restoration descriptor by release number alone;
- rerun requests from navigation or explicit Check;
- once-per-worker reconciliation suppression;
- Manual background preparation;
- non-idempotent publication of the same source commit;
- workflow-attempt identity as managed `buildId`;
- nondeterministic managed `buildDate`;
- long work under `OperationQueue`;
- superseding `ready` or `activating`;
- intercepting non-document navigation such as iframe/frame/embed/object;
- rejected `respondWith()` promises for owned requests;
- live-deployment fallback for owned requests;
- persisted operation state, polling, retry counters, or backoff;
- generic manager/registry/RPC abstractions;
- remote archive pruning, browser-specific reload logic, irreversible user-data migration, or shared Material/global-style changes.

## Implementation readiness

The runtime architecture and implementation are stabilized. The PR remains draft until final resulting-head verification, complete-PR review, and operator UI/accessibility acceptance are complete.

Unresolved architecture blockers: none.

Verdict: **implementation complete; merge readiness is evaluated separately from architecture completeness.**
