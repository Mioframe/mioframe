# Managed pinned application updates — architecture handoff

This is the single canonical architecture and implementation contract for managed pinned application updates. Existing unshipped implementation formats are replaceable evidence, not compatibility contracts.

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

| Channel                    | Update behavior                                                                |
| -------------------------- | ------------------------------------------------------------------------------ |
| stable `/`                 | managed updates with its own state, archive, cache namespace, and worker scope |
| develop `/branch/develop/` | independent managed updates                                                    |
| ordinary manual branch     | generated Workbox                                                              |
| PR preview                 | PWA disabled                                                                   |

No channel may read, mutate, block, or notify another channel.

## Ownership and sources of truth

| Owner                    | Responsibility                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Publisher                | deterministic source identity, append-only archive, retained-tree validation, `latest.json` |
| Controller-state service | classify and persist lifecycle state; serialized final decisions                            |
| Controller worker        | bootstrap, reconciliation, fetch, activation, rollback, recovery page, recovery commands    |
| `PreparationCoordinator` | exact-release preparation deduplication and cleanup arbitration only                        |
| Service client/features  | typed transport outcomes and ordinary settings actions                                      |
| Recovery page            | safe diagnostics and explicit recovery actions without application JavaScript               |
| Browser                  | Service Worker lifecycle and registration replacement                                       |

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

## Unsupported retained releases

A retained release can be statically classified as an unsupported compatibility target (see `scripts/pages/lib/unsupportedRetainedReleases.mjs`): it remains retained, immutable, and integrity-validated exactly like every other retained release, but is excluded from the set of releases the managed release data-compatibility proof requires a new candidate to support as a pin/rollback target.

- develop release 2 is unsupported: it was published with a broken build (wrong root-relative application/PWA URLs and a Service Worker built without runtime Sentry configuration) before the managed publication preflight and artifact-semantic validation existed to prevent it. It can never be a real active pin/rollback target.
- the classification is a static, source-controlled fact, never worker/runtime state, and never changes the release wire descriptor format;
- it does not delete the release, does not allow its release number to be reused, and does not skip its retained-tree byte/hash validation;
- every other retained release, including release 1, keeps participating in the data-compatibility proof.

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

| Event                                | Final state                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| newer discovery                      | `candidate = available(new)`                                |
| Automatic preparation succeeds       | matching `available → ready`                                |
| Manual Install succeeds              | matching `available/failed → ready`                         |
| Manual Cancel                        | matching `ready → available`                                |
| qualifying clean launch              | matching `ready → activating(deadlineAt)`; active unchanged |
| matching durable `BOOT_OK`           | candidate becomes active; candidate cleared                 |
| matching `BOOT_FAILED` or expiration | active unchanged; candidate becomes `failed`                |
| stale or mismatched completion       | no state change                                             |

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

| State   | Predecessor                                            | Result                       |
| ------- | ------------------------------------------------------ | ---------------------------- |
| valid   | any                                                    | preserve unchanged           |
| invalid | any                                                    | reject installation          |
| absent  | no active worker                                       | genuine first registration   |
| absent  | managed predecessor                                    | reject as managed-state loss |
| absent  | compatible generated Workbox                           | one-time bootstrap           |
| absent  | unknown, conflicting, malformed, or silent predecessor | reject                       |

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

| State                   | Automatic                                                          | Manual                                               |
| ----------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| no candidate            | discover; persist newer `available`; prepare to `ready`            | discover; persist newer `available`; do not prepare  |
| `available(B)`          | discover latest first; replace by newer C; prepare final candidate | discover strictly newer; otherwise keep B            |
| `failed(B)`             | discover strictly newer; never retry B                             | discover strictly newer; never retry B automatically |
| `ready` or `activating` | no-op                                                              | no-op                                                |

For any successful discovery comparison, a lower `releaseNumber` is stale, an equal number with exact full identity is idempotent, and an equal number with conflicting `appVersion`, `buildId`, or `buildDate` is an invariant failure. That conflict fails closed as `check-failed`: controller state stays unchanged, no Automatic fallback preparation runs, and the pass requests no broadcast or cache cleanup. Ordinary discovery/network failures remain distinct and may still fall back to preparing an already-known `available` candidate in Automatic mode.

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

Only allowlisted categories and safe metadata are shown. Raw state, raw exception messages, stack traces, tokens, local paths, user documents, and sensitive URLs are forbidden. Fixed Mioframe-owned technical identifiers are permitted when they cannot contain user data or secrets; for example, the literal protocol resource name `latest.json` is privacy-safe.

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

## TEST IMPACT

- Contract/scenario: release descriptor / latest-pointer / canonical-path wire contract — one canonical schema in `src/shared/service/appUpdate/releaseWireContract.ts` (`zodReleaseDescriptor`, `zodLatestReleasePointer`, `isCanonicalReleasePath`), imported directly by the runtime (`contracts.ts`) and by the Node publisher (`scripts/pages/lib/releaseDescriptor.mjs`, `scripts/pages/lib/retainedReleaseTree.mjs`). No duplicate validation remains: the publisher's local `latest.json` shape check is gone, and the fixture corpus that drove this matrix lives once, at `releaseWireContract.testUtils.ts`.
  - Primary proof owner: `releaseWireContract.test.ts` — the sole test running the complete matrix (canonical paths, positive release numbers, descriptor validity, duplicate paths, hashes, sizes, metadata, latest pointer).
  - Additional proof: `scripts/pages/lib/retainedReleaseTree.test.mjs` (retained-tree structural rules built on top of the canonical schema).
  - Existing proof: `scripts/pages/lib/releaseArtifact.test.mjs`, `contracts.test.ts` (both consume shared fixtures for narrower contracts; they must not repeat the canonical descriptor-validation matrix).
  - New/updated proof: `releaseWireContract.testUtils.ts` (moved from `scripts/pages/lib/releaseDescriptorCorpus.mjs`, now deleted); `releaseWireContract.test.ts` gained the `zodLatestReleasePointer` cases; `scripts/pages/lib/releaseDescriptor.test.mjs` narrowed to publisher-owned behavior only (`buildReleaseDescriptor` success/failure).
  - Risk or platform matrix: Node-only (publisher) and Vitest-only (runtime schema); no browser risk.
  - Persistent impact metadata: none — schema values and publisher output are unchanged, only proof ownership moved.
- Contract/scenario: publisher / plain-Node import seam — Node LTS must execute `scripts/pages/lib/releaseDescriptor.mjs`'s direct import of `releaseWireContract.ts` (erasable-TypeScript syntax only) with no TypeScript loader.
  - Primary proof owner: `scripts/release/publisherWireContractImportProof.mjs`, run by the verifier as the `publisher-node-import` label (`pnpm verify --full --only publisher-node-import`) via a real `node scripts/release/publisherWireContractImportProof.mjs` child process — genuinely plain Node, not Vitest/Vite/tsx/ts-node. It exercises one representative case: importing the production publisher module (`scripts/pages/lib/releasePublish.mjs`) and, through the same module graph, building and validating one descriptor via `buildReleaseDescriptor`/`isValidReleaseDescriptor`.
  - Additional proof: none; the direct Node execution is the only proof needed for this import seam.
  - Existing proof: none — this seam previously had no real plain-Node execution proof. The prior claim that `scripts/pages/lib/releaseDescriptor.test.mjs` proved plain-Node execution was inaccurate: that file has always run under Vitest.
  - New/updated proof: `scripts/release/publisherWireContractImportProof.mjs` and the `publisher-node-import` label wiring in `scripts/verify.mjs`, `scripts/lib/verifyInvocation.mjs`, `scripts/lib/commandWeight.mjs`.
  - Risk or platform matrix: Node LTS only (matches CI's `node-version: lts/*`); no browser risk. A future `releaseWireContract.ts` construct outside Node's erasable-TypeScript-syntax support would fail this check, not silently degrade at publish time.
  - Persistent impact metadata: `publisher-node-import` added to `FULL_ONLY_LABELS`/`VERIFY_LABELS`, release-only like `release-version`/`release-config`/`build`; runs under `pnpm verify --full` and `pnpm verify:release`.
- Contract/scenario: watchdog/runtime protocol wire contract — one canonical implementation in `src/shared/service/appUpdate/workerProtocolWireContract.ts`, imported directly by `protocol.ts`, `bootConfirmation.ts`, and the Node publisher's `scripts/pages/lib/watchdogInject.mjs` (interpolated into the generated inline watchdog script). Unchanged by this correction round.
  - Primary proof owner: `scripts/pages/lib/watchdogInject.test.mjs` — genuinely executes the generated watchdog script's own runtime behavior via `new Function(buildWatchdogScript(...))()`, not merely its source text.
  - Additional proof: `protocol.test.ts` (schema-level).
  - Existing proof: both unchanged by this round.
  - New/updated proof: none.
  - Risk or platform matrix: Vitest/happy-dom execution of the generated script; no browser risk beyond what the E2E lifecycle specs already cover.
  - Persistent impact metadata: none.
- Contract/scenario: release-preparation error boundary — `DomainError`-based, classified by the local `ReleasePreparationFailureReason` string enum (`releasePreparation.ts`, values: `ARCHIVE_UNAVAILABLE`, `ARCHIVE_RESPONSE_FAILURE`, `INVALID_ARCHIVE_METADATA`, `CONFLICTING_RELEASE_IDENTITY`, `INTEGRITY_FAILURE`, `CACHE_STORAGE_UNAVAILABLE`, `RESTORATION_FAILED`); `message` stays a short project-controlled safe string with no dynamic user-controlled or external sensitive values. Fixed Mioframe-owned technical identifiers such as the literal resource name `latest.json` are permitted; raw runtime/external detail lives only in `cause`.
  - Primary proof owner: `releasePreparation.test.ts`, including the dedicated "release-preparation `DomainError` classification" group and the message-safety assertions.
  - Additional proof: `preparationCoordinator.test.ts`, `recoveryStateLoss.test.ts`, `recoveryDiagnostics.test.ts`, `recoveryPage.test.ts`, `workerFetch.test.ts` (all consume `error.code`/`problemDetail` through the enum, not raw strings, except where a test is asserting rendered recovery-page HTML text rather than a typed code).
  - Existing proof: `recoveryOrchestration.ts` classification behavior, covered by `workerMessagesRecovery.test.ts`/`recoveryStateLoss.test.ts`; unchanged result codes.
  - New/updated proof: every consumer above references `ReleasePreparationFailureReason.<MEMBER>` instead of a bare string literal or a duplicate value list.
  - Risk or platform matrix: Vitest-only; no browser or platform risk — wire-visible `problemDetail`/`code` string values are unchanged, so recovery-page rendering and diagnostics payloads are unaffected.
  - Persistent impact metadata: none — the error classifications are internal service diagnostics; recovery result codes and user-visible recovery behavior remain independently bounded.
- Contract/scenario: discovery ordering and exact identity — `releaseNumber` is the ordering key, but equal-number discovery is only idempotent when all `ReleaseSummary` fields match. A same-number metadata conflict fails closed as `check-failed`, reports one bounded identity-conflict diagnostic, leaves controller state unchanged, and does not prepare the existing Automatic candidate or request broadcast/cache-cleanup effects. Ordinary discovery/network failure remains distinct and may still use Automatic fallback preparation for an existing `available` candidate.
  - Primary proof owner: `src/shared/service/appUpdate/updateDiscovery.test.ts`, `Automatic same-number identity conflict` — covers an `available` candidate with no `prepare()`/write/effects and one diagnostic, a `failed` candidate with no preparation, and an ordinary-failure control proving fallback preparation still occurs.
  - Additional proof: `stateTransitions.test.ts` owns the pure `applyDiscovery` ordering/identity classification; `appUpdateDiagnosticEvents.test.ts` owns the bounded diagnostic payload.
  - Existing proof: the reconciliation mode matrix in `updateDiscovery.test.ts` continues to cover ordinary stale/equal/newer discovery and Automatic/Manual candidate policy.
  - New/updated proof: the conflict-specific tests replace the old expectation that an Automatic same-number identity conflict could fall through to fallback preparation.
  - Risk or platform matrix: Vitest-only; no browser/platform-specific behavior.
  - Persistent impact metadata: none — no new persisted state, public protocol field, retry mechanism, or effect owner.
- Contract/scenario: failed Service Worker installation lifecycle — condition/event based, not time based: the E2E spec observes the update attempt's installing worker reaching the browser's own terminal `redundant` state, bounded by a maximum wait, instead of a fixed sleep. Unchanged by this round.
  - Primary proof owner: `tests/e2e/release/managedUpdatesMigration.spec.ts`.
  - Additional proof: none.
  - Existing proof: unchanged by this round.
  - New/updated proof: none.
  - Risk or platform matrix: Chromium only (see browser matrix below); this lifecycle path is not part of the narrow cross-engine smoke.
  - Persistent impact metadata: none.
- Contract/scenario: unhandled Vue initial-boot errors fail managed activation — `src/main.ts` preserves, conditionally sets (only when `MANAGED_APP_UPDATE_CHANNEL` is defined), and always restores `app.config.throwUnhandledErrorInProduction` across `app.mount()` / `router.isReady()` / the first `nextTick()` / `reportAppBootOk()`, so an unhandled error anywhere in that window reaches the existing watchdog `error`/`unhandledrejection` handling instead of Vue's default production log-and-swallow behavior. Ordinary post-boot Vue production error handling, the existing broken-entry (raw JavaScript) release test, and the watchdog itself are unchanged.
  - Primary proof owner: `tests/e2e/release/managedUpdatesVueBootFailure.spec.ts` — a real production release build (never a test-only failure branch in application code), with a test-side one-shot `page.addInitScript()` fault on `window.matchMedia` (an existing synchronous dependency `MainApp.vue`'s own setup already calls via `setupPwaInstallRuntime()`), proving the failure passes through real Vue setup execution, the watchdog reports boot failure, and rollback serves the previous healthy release.
  - Additional proof: none.
  - Existing proof: `tests/e2e/release/managedUpdatesLifecycle.spec.ts`'s broken-entry (raw JavaScript throw) release test, kept unchanged — it proves the independent raw-failure-detection path.
  - New/updated proof: `src/main.ts`; `tests/e2e/release/managedUpdatesVueBootFailure.spec.ts` (new), added to `MANAGED_UPDATES_LIFECYCLE_SPECS` in `scripts/release/managedUpdatesProof.mjs`.
  - Risk or platform matrix: Chromium only (managed-updates E2E corpus); no change to ordinary (non-managed) builds' Vue error semantics.
  - Persistent impact metadata: none — no new watchdog API, protocol message, or boot-outcome owner; the existing watchdog remains the single arbiter.
- Contract/scenario: managed controller worker artifact (`src/sw.ts`, compiled to `dist/sw.js`) never embeds application release identity — `APP_BUILD_ID`/`APP_VERSION` and the `release` field passed to `registerSentryConfig()` are removed from the worker; main-thread Sentry configuration (`src/app/setupApp.ts`) is unchanged and keeps using application release identity.
  - Primary proof owner: `tests/e2e/release/managedUpdatesControllerArtifactIdentity.spec.ts` — builds two real managed-stable production artifacts differing only in `VITE_BUILD_ID`/`VITE_BUILD_DATE` and asserts `dist/sw.js` bytes are exactly identical (primary byte-equality proof, not a string-presence check).
  - Additional proof: `src/sw.test.ts` ("never passes an application release identity into worker Sentry config") — unit-level proof that `registerSentryConfig` is called with no `release` property.
  - Existing proof: `tests/e2e/release/productionArtifactSmoke.spec.ts`'s existing forbidden-substring/`skipWaiting`/`clients.claim()` artifact checks, unchanged.
  - New/updated proof: `src/sw.ts`; `src/sw.test.ts`; `tests/e2e/release/managedUpdatesControllerArtifactIdentity.spec.ts` and its `tests/e2e/release/fixtures/controllerArtifactIdentityFixture.mjs`/`.d.mts` (new), added to `MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS` in `scripts/release/managedUpdatesProof.mjs`.
  - Risk or platform matrix: Chromium only (managed-updates E2E corpus) for the artifact build/compare; Vitest-only for the unit proof; no browser behavior risk.
  - Persistent impact metadata: none — no controller release/version/hash scheme introduced; the worker keeps deriving only its own channel at runtime from `self.registration.scope`.
- Contract/scenario: channel/cache/path isolation contract centralization — one pure module, `src/shared/service/appUpdate/channelContract.ts` (zero imports, erasable-TypeScript-only, no DOM/Node/Vite dependencies), now canonically owns `buildChannelCacheNamespace`, `buildManagedCacheNamespace`, `buildBranchCacheNamePrefix`, `isForeignChannelPath`, and `buildForeignChannelDenylistPattern`. `config/plugins/pwa.ts` (Node/Vite, via an explicit `tsconfig.node.json` include entry for this one file), `releaseCache.ts`, `cleanLaunch.ts` (both browser worker runtime), and `scripts/pages/lib/tombstoneContent.mjs` (Node, direct `.ts` import) all consume it instead of maintaining manually synchronized duplicates. Channel isolation behavior itself is unchanged.
  - Primary proof owner: `src/shared/service/appUpdate/channelContract.test.ts` — the complete primitive matrix (stable/branch/managed cache namespaces, branch tombstone prefix, own-channel vs. foreign `/branch/**`/`/pr/**` path classification including non-root bases, foreign denylist pattern).
  - Additional proof: none; consumer files below test only their own composition.
  - Existing proof: `config/plugins/pwa.test.ts` (`buildWorkboxOptions`, `buildSameOriginMatcher`, `isManagedChannel`, `resolveManagedAppUpdateChannel`, `getPwaPlugins` — pwa.ts's own composition, now comparing against the imported canonical primitive rather than a local duplicate); `releaseCache.test.ts` (`buildReleaseCacheName`); `cleanLaunch.test.ts` (`isSameChannelPath`'s own origin/scope composition around the canonical foreign-path check); `scripts/pages/lib/tombstoneContent.test.mjs` (`buildTombstoneServiceWorker` embeds the canonical prefix).
  - New/updated proof: `channelContract.ts` and `channelContract.test.ts` (new); the duplicate `buildChannelCacheNamespace`/`isForeignChannelPath`/`buildForeignChannelDenylistPattern` matrix removed from `pwa.test.ts`; the duplicate `buildManagedCacheNamespace` matrix removed from `releaseCache.test.ts`; the duplicate `buildBranchCacheNamePrefix` matrix removed from `tombstoneContent.test.mjs`; `tsconfig.node.json` gained one explicit `include` entry for `channelContract.ts` (a separate composite TypeScript project boundary — `config/plugins/pwa.ts`'s `tsconfig.node.json` project does not reference the application's `tsconfig.app.json` project).
  - Risk or platform matrix: Vitest-only for the contract and its consumers' unit proof; no browser risk — channel/cache/path values themselves are unchanged, only their single source of truth.
  - Persistent impact metadata: none — no generic channel manager/registry; `config/plugins/pwa.ts` keeps sole ownership of VitePWA composition, Workbox options, manifest construction, and managed-vs-unmanaged strategy selection; `cleanLaunch.ts` keeps sole ownership of URL parsing, origin validation, and client classification.
- Contract/scenario: every other product-facing managed-updates scenario (lifecycle, activation UI, recovery page, cross-engine, uncontrolled window, automatic check, controller upgrade, develop channel) — unchanged by this round.
  - Primary proof owner: `managedUpdatesLifecycle.spec.ts`, `managedUpdatesActivationUi.spec.ts`, `managedUpdatesRecovery.spec.ts`, `managedUpdatesCrossEngineLifecycle.spec.ts`, `managedUpdatesUncontrolledWindow.spec.ts`, `managedUpdatesAutomaticCheck.spec.ts`, `managedUpdatesControllerUpgrade.spec.ts`, `managedUpdatesDevelop.spec.ts`, `managedUpdatesMigration.spec.ts`.
  - Additional proof: `workerMessages.test.ts`, `workerMessagesActivation.test.ts`, `stateTransitions.test.ts`, `workerFetch.test.ts` (controller lifecycle, activation, rollback, boot confirmation, top-level fetch ownership).
  - Existing proof: all of the above; unchanged by this round.
  - New/updated proof: none.
  - Risk or platform matrix: see browser matrix below.
  - Persistent impact metadata: none.

Browser matrix (see `docs/testing/architecture.md`): Chromium owns the complete managed-updates E2E corpus (`MANAGED_UPDATES_LIFECYCLE_SPECS` and `MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS` in `scripts/release/managedUpdatesProof.mjs`). Firefox/WebKit own only the narrow cross-engine lifecycle smoke (`managedUpdatesCrossEngineLifecycle.spec.ts`, `MANAGED_UPDATES_CROSS_ENGINE_SPECS`), run after both Chromium groups pass, in their own isolated Playwright container.

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
