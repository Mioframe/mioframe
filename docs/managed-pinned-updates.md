# Managed pinned application updates — architecture handoff

**Implementation status: managed-update core implemented; recovery architecture ready; PR 169 is not implementation-complete until recovery and its required proof are present.**

This is the single canonical architecture contract for PR 169. Existing unshipped implementation formats are replaceable evidence, not compatibility contracts.

## Goal

Stable (`/`) and develop (`/branch/develop/`) provide Automatic and Manual managed application updates with:

- one selected active release and at most one candidate;
- immutable verified release archives;
- safe activation only after durable `BOOT_OK`;
- rollback to the previous managed release after failed activation;
- explicit worker-owned recovery when controller state is lost or the selected active release cannot be restored;
- no deletion or rollback of user data.

Manual branches keep generated Workbox behavior. PR previews remain non-PWA.

## Non-goals

- rollback to Workbox or arbitrary historical-version selection;
- silently selecting a release after controller-state loss;
- guessing the active release from remaining Cache Storage entries;
- offline state-loss recovery through a second persisted active pointer;
- forcing open sessions to update;
- irreversible user-data migration;
- persisted polling, operation IDs, progress journals, retry counters, backoff, or cancellation;
- generic RPC, release manager, cache registry, recovery manager, second worker path, or compatibility bridge;
- remote archive pruning or build reproducibility verification inside the publisher.

## Channels

| Channel | Update behavior |
| --- | --- |
| stable `/` | managed updates with its own state, archive, cache namespace, and worker scope |
| develop `/branch/develop/` | independent managed updates |
| ordinary manual branch | generated Workbox |
| PR preview | PWA disabled |

No channel may read, mutate, block, or notify another channel.

## Ownership and sources of truth

| Owner | Responsibility |
| --- | --- |
| Publisher | deterministic source identity, append-only archive, retained-tree validation, `latest.json` |
| Controller-state service | classify and persist lifecycle state; serialized final decisions |
| Controller worker | bootstrap, reconciliation, fetch, activation, rollback, recovery page, recovery commands |
| `PreparationCoordinator` | exact-release preparation deduplication and cleanup arbitration only |
| Service client/features | typed transport outcomes and ordinary settings actions |
| Recovery page | safe diagnostics and explicit recovery actions without application JavaScript |
| Browser | Service Worker lifecycle and registration replacement |

Sources of truth:

- latest publication: `updates/latest.json`, written last;
- release bytes and identity: descriptor, archived index, and immutable assets;
- lifecycle: one validated IndexedDB record per managed channel;
- prepared bytes: marker-last exact-release Cache Storage entry;
- recovery target after lost state: the exact descriptor referenced by a freshly validated `latest.json` after explicit user action;
- UI under normal operation: last valid worker snapshot plus feature-local transport outcome.

Cache presence is never lifecycle authority.

## Release identity and publication

```ts
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

type ReleaseSummary = {
  releaseNumber: number;
  appVersion: string;
  buildId: string;
  buildDate: string;
};
```

`releaseNumber` is the sole ordering identity inside one channel. Exact identity requires all four `ReleaseSummary` fields.

For managed stable/develop publication:

- `buildId` is the exact source commit SHA;
- `buildDate` is the canonical UTC committer timestamp of that commit;
- the same `buildDate` is used by Vite, descriptor generation, and `deployment.json`;
- publication remains serialized by the Pages concurrency gate.

Publication contract:

```text
validate the complete retained tree

new buildId
→ allocate latest.releaseNumber + 1, or 1 for an empty archive
→ validate and write assets, archived index, descriptor, and channel metadata
→ write latest.json last

buildId equals the unique latest descriptor
→ return the retained descriptor
→ perform zero writes

buildId exists on a non-latest descriptor or is duplicated
→ reject before writes
```

Retained descriptors, archived indexes, and every referenced immutable asset must exist as canonical regular files and match exact size and SHA-256. Conflicts, malformed paths, missing files, reused numbers, duplicate identities, overflow, or hash mismatches reject before writes. Published release content remains append-only in this PR.

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

- candidate number is strictly greater than active number;
- `deadlineAt` exists only for `activating` and is valid ISO time;
- progress and transient errors are not persisted;
- unknown fields, unsupported schemas, malformed records, and invariant violations are rejected rather than normalized;
- no second active pointer, recovery journal, operation record, or cached latest record exists.

## Normal lifecycle

| Event | Final state |
| --- | --- |
| newer discovery | `candidate = available(new)` |
| Automatic preparation succeeds | matching `available → ready` |
| Manual Install succeeds | matching `available/failed → ready` |
| Manual Cancel | matching `ready → available` |
| qualifying clean launch | matching `ready → activating(deadlineAt)`; active unchanged |
| matching durable `BOOT_OK` | candidate becomes active; candidate cleared |
| matching `BOOT_FAILED` or expiration | active unchanged; candidate becomes `failed` |
| stale or mismatched completion | no state change |

`available` and eligible `failed` may be replaced only by a strictly newer discovery. `ready` and `activating` are pinned and never superseded. Automatic never retries the exact failed release; Manual may explicitly retry it.

Every long completion re-reads fresh state and persists only when mode, phase, release number, and complete target identity still match.

## Initial Workbox transition

Legacy and managed controllers both use `<channelBasePath>sw.js`.

```text
legacy Workbox /sw.js
→ verified managed release 1 becomes the initial managed baseline
→ full rollback guarantees begin with managed release 2
```

Install classification:

| State | Predecessor | Result |
| --- | --- | --- |
| valid | any | preserve unchanged |
| invalid | any | reject installation |
| absent | no active worker | genuine first registration |
| absent | managed predecessor | reject as managed-state loss |
| absent | compatible generated Workbox | one-time bootstrap |
| absent | unknown, conflicting, malformed, or silent predecessor | reject |

Allowed bootstrap fully validates and prepares exact latest before writing initial Automatic state. A failed install leaves compatible Workbox active. After release 1 activates, rollback to Workbox is unsupported.

Release 1 and every later state-loss recovery baseline:

- must contain no irreversible user-data migration;
- has no older trusted managed rollback target;
- may recover from a runtime-defective baseline only by discovering and activating a corrected newer managed release;
- continues navigation-triggered reconciliation even when application JavaScript cannot finish boot.

The worker never calls `skipWaiting()` or `clients.claim()`.

## Preparation coordination

`PreparationCoordinator` owns only exact-release preparation deduplication and cleanup arbitration.

```ts
type InFlightPreparation = {
  expectedRelease: ReleaseSummary;
  promise: Promise<ReleaseDescriptor>;
};
```

Join policy:

```text
no in-flight entry for releaseNumber
→ create with complete expected summary

same releaseNumber and exact summary match
→ join

same releaseNumber with any differing summary field
→ reject fail-closed
```

A caller-provided or fetched descriptor must match the complete expected summary before preparation. Bootstrap and state-loss recovery may begin from a validated latest pointer because no trusted prior summary exists.

## Reconciliation

Reconciliation is triggered by:

- every owned same-channel top-level navigation under its fetch event lifetime, without delaying the document response;
- explicit Check for updates;
- every successful mode change after its response.

Only one worker-local shared attempt exists at a time. Navigation and Check join without requesting another pass. A mode change during an attempt requests one fresh-state rerun; another mode change during that rerun may request one further pass.

Each attempt owns declarative effects:

```ts
type ReconciliationEffects = {
  broadcastStateChanged: boolean;
  cleanupReleaseCache: boolean;
};
```

Effects:

- are merged by logical OR across reruns;
- belong only to the attempt that produced them;
- survive a successful earlier pass followed by a failed rerun;
- execute exactly once by the attempt owner after its response boundary;
- never leak into a later independent attempt.

Mode behavior per fresh pass:

| State | Automatic | Manual |
| --- | --- | --- |
| no candidate | discover; persist newer `available`; prepare to `ready` | discover; persist newer `available`; do not prepare |
| `available(B)` | discover latest first; replace by newer C; prepare final candidate | discover strictly newer; otherwise keep B |
| `failed(B)` | discover strictly newer; never retry B | discover strictly newer; never retry B automatically |
| `ready` or `activating` | no-op | no-op |

Network, hashing, preparation, and cleanup remain outside `OperationQueue`.

## Fetch ownership and exact restoration

The worker owns exactly:

- same-channel top-level requests where `request.mode === 'navigate' && request.destination === 'document'`;
- same-channel `<channelBasePath>assets/**`.

All other requests pass through normal browser networking.

Owned requests never use live deployment bytes. They either:

- serve the exact selected immutable release;
- restore that exact release from its archive and retry once;
- return controlled `404` for an owned asset not listed by the selected descriptor;
- show a recovery page for a recoverable top-level failure;
- return controlled `503` for an asset or non-recoverable owned failure.

Every promise passed to `respondWith()` must resolve to a `Response` and never reject.

## Clean launch and activation

A `ready` candidate starts activation only on an owned top-level navigation when no other same-channel controlled or uncontrolled window is open. The evaluated navigation is excluded from that count.

Only the navigation that performs `ready → activating` serves the candidate document. A concurrent navigation that observes an unexpired activation it did not start receives controlled `503`; it serves neither active nor candidate and does not mutate or roll back state.

During activation:

- the selected navigation and owned assets use the candidate release;
- `activeRelease` remains unchanged;
- activation deadline is 30 seconds;
- a worker-injected watchdog observes early runtime and linked-resource failures;
- `BOOT_OK` is sent after root mount, initial router navigation, and first render;
- durable `BOOT_OK` commits the candidate;
- `BOOT_FAILED`, serving failure, or expiration rolls back while leaving the previous active selected;
- direct rollback acknowledgement recovers the reporting window without depending on broadcast delivery.

## Recovery classifications

A top-level recovery page is required for these stable categories:

```text
UPDATE_STATE_ABSENT
UPDATE_STATE_INVALID
  ├─ UNSUPPORTED_SCHEMA_VERSION
  ├─ MALFORMED_RECORD
  └─ INVARIANT_VIOLATION
UPDATE_STORAGE_UNAVAILABLE
ACTIVE_RELEASE_UNAVAILABLE
  ├─ ARCHIVE_UNAVAILABLE
  ├─ INVALID_ARCHIVE_METADATA
  ├─ INTEGRITY_FAILURE
  ├─ CACHE_STORAGE_UNAVAILABLE
  └─ RESTORATION_FAILED
```

Only allowlisted categories and safe metadata are shown. Raw state, raw exception messages, stack traces, tokens, local paths, user documents, and sensitive URLs are forbidden.

`ACTIVE_RELEASE_UNAVAILABLE` is emitted only after valid state identifies exact active release A and normal exact-cache validation plus exact-archive restoration cannot make A servable.

## Recovery page

The active worker generates a self-contained accessible HTML page:

- no Vue application or external assets;
- `Content-Type: text/html`;
- `Cache-Control: no-store`;
- HTTP `503` while recovery is required;
- visible heading, status region, keyboard-operable actions, visible focus, mobile layout;
- safe diagnostic fields: problem code and detail, channel, controller database name, selected release number when known, recovery action, timestamp, and safe browser error name when available.

Required actions:

- **Retry**;
- **Install latest version**;
- **Copy diagnostic details**.

The page must state that updater recovery does not delete Mioframe user data. It must not claim that an unrelated browser-storage failure left all product data intact.

## Recovery when controller state is lost

Applies to `UPDATE_STATE_ABSENT` and `UPDATE_STATE_INVALID`.

Before explicit user action, no release is trusted and no cache is inferred.

`Install latest version`:

```text
confirm controller storage can be read
→ fetch and validate latest.json
→ fetch and validate its exact descriptor
→ fully prepare exact release outside OperationQueue
→ enter short serialized finalization
→ re-read controller state
→ valid: preserve it; another window already recovered
→ absent/invalid: write initial Automatic state with prepared latest as active and no candidate
→ storage failure: fail without selecting a release
→ post stable result
→ reload only after valid state is durably present
```

The invalid record is not deleted before successful preparation. Recovery changes only update-controller state and release caches; it never clears origin storage, OPFS, Spaces, documents, product settings, or external-storage configuration.

The page must warn:

- the previous selected version and update mode cannot be trusted;
- recovery resets update mode to Automatic;
- the installed latest becomes a new baseline without an older trusted rollback target;
- a corrected newer release remains discoverable through navigation reconciliation if this baseline cannot finish boot.

Offline state-loss recovery is unsupported because no authoritative release is known.

## Recovery when active release is known but unavailable

Applies to `ACTIVE_RELEASE_UNAVAILABLE` with valid state and exact active release A.

### Retry

An ordinary reload repeats exact-cache validation and exact restoration of A. No state changes.

### Install latest version

After explicit action:

```text
fetch and validate latest and its exact descriptor
→ compare latest with fresh valid state
```

Rules:

1. `latest` exactly matches active A:
   - fully prepare exact A;
   - do not change lifecycle state;
   - reload A after preparation succeeds.

2. `latest.releaseNumber > active.releaseNumber`:
   - fully prepare exact latest B;
   - in a short serialized finalization, re-read state;
   - preserve state and request reclassification if active or a pinned `ready/activating` candidate changed concurrently;
   - otherwise set or replace only an absent/`available`/`failed` candidate with `ready(B)` when B is not older than that candidate;
   - preserve `activeRelease`, mode, and all unrelated state;
   - reload into the ordinary clean-launch activation flow;
   - B becomes active only after durable `BOOT_OK`.

3. `latest.releaseNumber < active.releaseNumber`, or the same number has conflicting metadata:
   - reject recovery;
   - never downgrade or replace A.

A pre-existing `ready` or `activating` candidate is never superseded by recovery. The page reloads and lets ordinary lifecycle logic reclassify the situation.

If candidate B fails activation and exact A remains unavailable, the recovery page is shown again. This is expected: valid-state recovery must not bypass the existing rollback contract.

## Recovery protocol and timeout

One private same-channel command is sufficient:

```ts
type RecoverInstallLatestRequest = {
  protocolVersion: 1;
  type: 'RECOVER_INSTALL_LATEST';
};
```

The command uses stable result codes and existing same-channel and protocol-version validation. It is unavailable to foreign-channel clients.

Long-operation semantics:

- client timeout: 120 seconds;
- timeout clears page-local busy state but does not cancel worker work;
- the user may retry;
- repeated requests may join the same exact preparation through `PreparationCoordinator`;
- every finalization re-reads fresh state and is idempotent;
- no polling, persisted retry state, or cancellation protocol is added.

`Retry` is an ordinary navigation reload. Copying diagnostics is page-local.

## Recovery result categories

At minimum:

- success;
- state changed concurrently; reload and reclassify;
- controller storage unavailable;
- network or latest metadata unavailable;
- invalid latest metadata;
- latest older than active;
- conflicting release identity;
- release integrity or preparation failure;
- controller-state persistence failure.

No raw exception text is returned to the page.

## Data compatibility

While an older managed release remains a supported pin or rollback target, every newer release must keep user data readable by it. Irreversible migration requires a separate architecture and cannot be included in an ordinary managed release.

## Acceptance and proof

Required proof includes:

- publication allocation, retained-tree integrity, append-only archive, and `latest.json` last;
- canonical source identity and idempotent latest-build rerun;
- exact Workbox probe matrix and interrupted-install retry;
- full-summary preparation identity and same-number conflict rejection;
- lifecycle transition table and Automatic/Manual behavior;
- attempt-local reconciliation effects and response-before-effects ordering;
- exact top-level ownership and every owned fetch resolving to a `Response`;
- exact-cache restoration without live deployment fallback;
- clean-launch ownership, concurrent navigation blocking, boot confirmation, rollback, and cross-engine behavior;
- recovery page for absent, invalid, unreadable state, and unavailable active release;
- safe diagnostic allowlist and accessibility behavior;
- explicit state-loss baseline recovery without product-data deletion;
- exact-active Retry;
- newer-latest recovery through `ready` candidate and ordinary `BOOT_OK` activation;
- no downgrade, conflicting identity rejection, and pinned-candidate preservation;
- recovery timeout and repeated-request idempotence;
- browser proof that product storage remains readable after recovery;
- previous supported managed releases can read newer user data after rollback.

Final unchanged workspace verification:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

The exact final head also requires the ordinary GitHub workflow and operator UI/accessibility acceptance.

## Forbidden

- automatic or silent recovery;
- selecting a release by cache enumeration;
- writing recovery state before complete exact-release preparation;
- replacing valid active state directly with newer latest;
- bypassing candidate activation or `BOOT_OK` when valid state exists;
- downgrading active release;
- superseding a `ready` or `activating` candidate;
- deleting invalid state before successful finalization;
- clearing origin data or any product data;
- exposing raw state or raw exceptions;
- network, hashing, or Cache Storage work inside `OperationQueue`;
- second active pointer, recovery journal, scheduler, manager, registry, generic RPC, polling, retry counters, or backoff;
- more than one candidate;
- long work under `OperationQueue`;
- live-deployment fallback for owned requests;
- rollback to Workbox;
- browser-specific reload logic;
- irreversible user-data migration.

## Implementation readiness

Required product and architecture decisions are resolved.

Unresolved architecture blockers: none.

Verdict: **ready for implementation; PR 169 is not implementation-complete until the recovery flow and its required proof are present.**
