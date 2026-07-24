# Managed stable updates — final architecture

## Goal / non-goals

Goal: one persistent stable release-controller service worker serving immutable, versioned
application releases, with Automatic (background-prepare, activate on a later clean launch) and
Manual (pin, `Update now` reloads only the requesting window) update modes.

Non-goals: coordinated multi-window activation, a generic state-machine/manager/provider
framework, retry loops or timeout increases to mask lifecycle races, and pretending a
local/branch/PR build is a published stable release.

**Rejected alternative** (kept as a one-line record): a coordinated multi-window activation
transaction (`activationTransaction` with `replacesClientId`/`resultingClientId`/restart-token
mapping, waiting for every window to confirm) was built first and removed. It introduced
distributed lifecycle state — double-start races, stuck check/preparation, offline startup
depending on `latest.json`, a non-monotonic publisher sequence — that a single required open
window makes unnecessary. Do not restore it.

## Confirmed user scenarios

1. Automatic mode discovers and downloads a newer release in the background without disrupting
   the current session, and activates it only on a later clean launch with no other stable window
   open.
2. Manual mode pins the running release across restarts; `Update now` reloads only the requesting
   window into the new release once exactly one stable window is open and idle.
3. A trial boots the new release; a genuine boot confirmation commits it, a failed/expired boot
   rolls back exactly once and marks the target failed (no retry loop).
4. An unrelated stable window never observes, confirms, blocks, or rolls back another window's
   trial — it keeps serving the previously committed release until its own next navigation.
5. A selected release (Automatic active, Manual pinned, or a client's own trial target) whose
   local cache is lost is restored from its immutable archive when online; when it cannot be
   restored, the app fails closed to a controlled unavailable response, never a substituted
   release.
6. Migration from a previously deployed generated Workbox worker to this managed worker completes
   without unregistering, without clearing storage, and without any test helper reproducing the
   private update protocol.

## Ownership

- **Publication** (`scripts/pages/lib/stableRelease.mjs`): sequence allocation, immutable
  artifact/descriptor construction, worker rendering, and `latest.json` publication.
- **Controller** (`src/shared/service/appUpdate/controller.ts`): every persisted state
  transition — check, preparation, trial creation (Manual and Automatic), commit, rollback, mode
  change, reconciliation, cache cleanup.
- **Service worker** (`sw.ts`): request interception and delegation only. It never creates a
  trial or mutates controller state directly; navigation routes through
  `controller.handleNavigation()`.
- **Release cache** (`releaseCache.ts`): staging, commit-marker validation, immutable serving,
  cache cleanup.
- **Service client** (`src/shared/serviceClient/appUpdate/client.ts`): reconnect, local VFS
  readiness, boot confirmation.
- **Entity** (`useAppUpdate.ts`): read-only public snapshot facts only.
- **Feature modules**: one user action each (check, apply, mode change, notify).

## Release identity

```ts
type ReleaseIdentity = {
  releaseId: string; // full 40-character publication SHA
  releaseSequence: number; // publisher-allocated, forward-only
  appVersion: string;
  buildId: string; // releaseId.slice(0, 7) — never derived independently
  buildDate: string;
};
```

`releaseId` is resolved once per build (`vite.config.ts`); `buildId` is always
`releaseId.slice(0, 7)` of that same resolved value, so the worker's embedded identity
(`__RELEASE_ID__`/`__BUILD_ID__`), `deployment.json`, and the published descriptor can never embed
different `buildId`/`buildDate`/`appVersion` for the same `releaseId`. `isSameReleaseIdentity`
compares every field, not `releaseId` alone (a corrupt or spoofed record must not pass on id
alone, even though a valid `releaseId` is a content SHA). Sequence is used only for forward
ordering (`isStrictlyNewerRelease`); release id alone is sufficient only for genuinely
content-addressed membership (`failedReleaseIds`).

## Persisted state

`ReleaseControllerState` (IndexedDB, current + last-known-good): `mode`, `activeRelease`,
`pinnedRelease?`, `latestRelease?`, `trial?`, `failedReleaseIds`, `check`, `preparation`,
`errorCode?`. `committedRelease(state)` is the Manual pin or Automatic active release, independent
of any in-flight trial. `releaseForClient(state, clientId)` is the trial target only for the
client that claimed it (`trial.initiatingClientId`); every other client sees the committed
release. `trial.requestingClientId` is a separate, ephemeral field naming only the sole Manual
requester before its own reload claims the trial as `initiatingClientId` — used only to report
`trialStarting` to that one window, never for request routing.

## Publication transaction (`applyManagedStablePublish`)

Order: read/validate `deployment.json` → scan/validate every retained descriptor → allocate the
sequence → build descriptor/index bytes and render the worker's release-sequence placeholder, all
in memory → validate immutable collisions and the projected Pages size using the rendered worker
bytes → write archived files/descriptor → write the root deployment (rendered worker bytes) →
write `latest.json` last. A failed or retried publication changes nothing (including
`latest.json`) and never mutates the input `dist` (`renderWorkerReleaseSequence` reads but never
writes `dist/sw.js`).

`renderWorkerReleaseSequence` is strict: the placeholder must appear exactly once to render; an
already-rendered worker is accepted only when it already contains exactly the expected sequence
and no placeholder; every other shape (multiple placeholders, a different embedded sequence,
placeholder alongside a rendered value, or neither present) is a publication error.

## Cache lifecycle

`prepareRelease` stages, hash-verifies, and promotes files, writing the descriptor **last** as the
commit marker. `getReleaseResponse` never returns a file until it has read, schema-validated, and
identity-matched that commit marker — a missing, malformed, mismatched, or partially-promoted
final cache serves nothing. `cleanupReleaseCaches` runs after every durable controller save
(centralized in `save()`), protecting the active/pinned release, the current preparation target,
and the trial's target and previous release; everything else is removed. Selected-release
restoration (Automatic active, Manual pinned, or a client's own trial target) re-fetches from the
immutable archive when the local cache is missing; a plain root-network fallback is used only when
no valid managed state or locally selected release exists at all (a genuinely unmanaged first
install).

## Automatic and Manual transitions

Both paths share one trial-entry invariant (`createTrial`, invoked only by the controller): no
current trial, `preparation.status === 'ready'`, complete preparation identity equals complete
`latestRelease` identity, target strictly newer than committed, target not in
`failedReleaseIds`, target cache fully available. Automatic clean-launch trials are claimed
immediately by the navigating client (`initiatingClientId` set at creation); Manual trials start
unclaimed and are claimed only by the requesting window's own reload
(`associateTrialNavigation`). Reconciliation (`reconcile()`) recovers a stale running preparation
as `ready` only when it still targets the canonical latest, is strictly newer than committed, is
not failed, and its cache is fully available — otherwise `idle`; a canonical latest that has
already advanced past a stale preparation is never silently activated.

## Single-window trial isolation

Entering a trial resets any running check to `idle` and any running preparation for a different
target to `idle`, so a background operation's later completion naturally no-ops (its token no
longer matches a `running` status). `finishCheck`/`finishPreparation` additionally return without
saving whenever `state.trial` is set. `UPDATE_NOW` fails closed: it requires the live stable
window set to contain exactly the requesting client and no other, then requires VFS readiness to
respond `ready: true` explicitly (missing registration, timeout, or a malformed response are all
not-ready).

## Failure recovery

- Expired or failed-boot trial: rolled back exactly once (`rollbackFailedTrialBoot`), target
  added to `failedReleaseIds`, never retried automatically.
- Trial target cache lost: `sw.ts`'s fetch handler restores from the archive; if that fails, rolls
  the trial back once through `controller.rollbackTrialTarget()` and serves the previous
  committed release.
- Corrupt/unsupported persistence: `persistence.ts` falls back to a fresh in-memory state with
  `capability: 'unavailable'` rather than blocking navigation.
- Publisher/runtime validation are proven to accept and reject the same descriptors via a shared
  corpus (`scripts/pages/lib/releaseDescriptorCorpus.mjs`), run against both
  `isValidReleaseDescriptor` (publisher) and `releaseDescriptorSchema` +
  `isSemanticallyValidReleaseDescriptor` (runtime).

## Release-test composition

No release-test method exists on the generic `VirtualFileSystem`, the file-system service's
production return type, `useVfsActivity`, or any entity API. The VFS browser proof and the
client-specific trial proof are both release-fixture-only composition, gated by
`__RELEASE_TEST_HOOKS__` and reachable only via dynamic import so the code is dead-code-eliminated
from every real stable/branch/PR build (proven by an artifact test asserting the compiled worker
and main entry bundle contain none of the release-test hook strings):

- **VFS activity**: a separate worker RPC service (`releaseTestFileSystemWorkerService.ts`,
  registered only when the flag is set) mounts a delayed-write provider
  (`releaseTestDelayedWriteProvider.ts`) into the same singleton VFS the production service uses,
  and starts one genuine `vfs.writeFile` mutation observed through the existing production
  activity tracker — never a VFS-specific test method.
- **Boot confirmation**: a gate in `client.ts`, armed only when
  `window.__MIOFRAME_RELEASE_TEST_ARM_BOOT_CONFIRMATION_GATE__` is pre-set via Playwright's
  `addInitScript` before the specific navigation under test, delays the real
  `PRIVATE_BOOT_READY` send. It never sends a synthetic confirmation and never mutates controller
  state; every other navigation loads with the gate already resolved.
- **Migration fixture**: the complete previous stable Workbox artifact tree (compiled worker,
  precached `index.html`, hashed assets, manifest) is preserved and served in full while legacy
  worker mode is selected (`managedStableFixture.mjs`, `artifactServer.mjs`), not just a
  substituted `sw.js` over the new artifact's bytes.

## TEST IMPACT

```text
Changed contracts: ReleaseIdentity resolution (build/publisher/worker), worker-sequence
  rendering, controller trial ownership and isolation, cache commit-marker serving, selected-
  release restoration, Manual readiness, snapshot publication ordering and per-client
  `trialStarting`, publisher/runtime descriptor validation parity, VFS release-test seam,
  legacy migration fixture completeness.
Risks: identity mismatch between worker/descriptor; obsolete preparation/trial activation;
  background operations mutating an active trial; partial cache served as valid; root-network
  substitution of a different release; open-window fail-open readiness; out-of-order snapshot
  delivery; publisher accepting a descriptor runtime would reject; release-test code reachable
  in production output; migration exercising approximated rather than real legacy content.
Proof owners: unit-tests (controller/trial/stateMachine/releaseCache/contracts/stableRelease),
  e2e (tests/e2e/release/managedStableUpdates.spec.ts,
  tests/e2e/release/productionArtifactSmoke.spec.ts).
Existing proof: controller.test.ts, trial.test.ts, stateMachine.test.ts, releaseCache.test.ts,
  contracts.test.ts, stableRelease.test.mjs, artifactServer.test.mjs, buildArtifact.test.mjs.
New or changed tests: reconciliation-against-canonical-latest cases, controller-owned
  navigation/Automatic-trial-entry cases, trial-isolation-from-background-completion cases,
  rollbackTrialTarget cases, final-cache commit-marker cases, worker-sequence strict-rendering
  cases (multiple/missing/mismatched placeholder, no-input-mutation, failed-publish retry),
  publisher/runtime validation-parity corpus, legacy-artifact-tree routing cases, artifact
  absence-of-release-test-strings check, deterministic client-specific trial e2e scenario.
Repository impact metadata updates: none required beyond existing release-spec registration —
  no spec path moved, and `tests/e2e/release/productionArtifactSmoke.spec.ts`/
  `managedStableUpdates.spec.ts` keep their existing owning mapping.
Task-specific measurements: none (no performance/optimization claim in this task).
```

## Final acceptance and verification

- `pnpm verify:release` (full release gate, including the browser scenarios above) then read-only
  `pnpm verify` must both pass before this feature is reported complete.
- No required scenario may be `skip`, `fixme`, or conditional.
- Focused verification during implementation uses `pnpm verify --only <label> --files <paths>`.
