# Managed stable updates preflight

> Revision 3 (defect closure on the single-window trial model). Revision 2's
> architecture — one open stable window required to switch releases, Automatic
> prepares in the background and activates only on a later clean launch, Manual
> pins and reloads only the requesting window — is correct and is not being
> redesigned. Revision 2 merged (`ec6af476`/`7c37a4f3`/`202ac19d`) with several
> critical invariants still false or unproven; this revision closes those
> defects inside the same model.
>
> Rejected alternative (unchanged from revision 1, kept as a one-line record):
> a coordinated multi-window activation transaction (`activationTransaction`
> with `replacesClientId`/`resultingClientId`/restart-URL-token mapping,
> waiting for every replacement to confirm) was built first and removed. It
> introduced distributed lifecycle state — double-start races, stuck
> check/preparation, offline startup depending on `latest.json`, a
> non-monotonic publisher sequence — that a single required window makes
> unnecessary. Do not restore it.

## Architecture handoff (revision 3)

- Goal: close every defect below without adding a manager, provider, registry
  framework, or generic state-machine layer. The state shape, ownership split,
  and file boundaries from revision 2 stay as-is except where a defect fix
  requires a client-aware parameter or a stronger validation.
- Confirmed evidence (read in full this pass):
  - `sw.ts:34-41` `loadCurrentRelease()` always does a network
    `fetch(..., { cache: 'no-store' })` for the build release descriptor with
    no local-cache/persisted-state path first — offline cold start cannot
    succeed without a prior successful call in the same worker lifetime.
  - `client.ts` installs no permanent `controllerchange` listener; only
    `waitForController()`'s one-shot `{ once: true }` listener exists, used
    solely to resolve the first `send()` after a takeover. No reconnect,
    re-handshake, or resubscription runs after a takeover.
  - `sw.ts:370-380` (`controller.ts` `UPDATE_NOW` handler) counts
    `registeredStableWindows()` — i.e. `stableClients.ts`'s
    `getRegisteredStableWindowClients()`, the intersection of live stable
    windows with the in-memory handshake set — instead of all live stable
    windows. A second stable window that is live but has not yet completed
    `PRIVATE_BOOT_READY` after a worker restart is invisible to this count, so
    Manual `Update now` is wrongly allowed.
  - `trial.ts` `confirmTrialBoot(state, releaseId)` and its caller
    (`controller.ts`'s `PRIVATE_BOOT_READY` handler) check only
    `releaseId === trial.targetRelease.releaseId`; neither takes nor checks a
    confirming client id against `trial.initiatingClientId`.
  - `trial.ts` `selectServedRelease(state)` and every caller (`sw.ts`
    fetch/navigation handling, `controller.ts` `GET_SNAPSHOT`) take no
    `clientId`; while a trial exists every request/response — including the
    pre-reload client's — resolves to `trial.targetRelease`.
  - `stateMachine.ts` `projectAppUpdateSnapshot` calls `committedRelease(state)`
    as the one `runningRelease` for every caller; there is no per-client
    variant, so a trial client and every other client receive the same
    snapshot.
  - `stateMachine.ts` `projectUpdateState`: `preparation.status === 'failed'`
    projects `'failed'` unconditionally, and `'ready'` only checks
    `isStrictlyNewerRelease(preparation.release, runningRelease)` — neither
    compares `preparation.release`'s full identity against
    `state.latestRelease`. A failed or ready older target (B) hides a newer
    discovered target (C) instead of `'available'` for C.
  - `releaseCache.ts` `isReleaseAvailable` compares only
    `parsed.data.releaseSequence !== identity.releaseSequence` plus file
    presence; it does not compare `releaseId`/`appVersion`/`buildId`/
    `buildDate`/`indexUrl`/`schemaVersion`, so a cache whose descriptor claims
    a different identity at the same sequence is misreported available.
  - `controller.ts` `finishCheck`: `latest.release.releaseSequence >=
Math.max(running.releaseSequence, state.latestRelease?.releaseSequence ??
0)` accepts an equal sequence unconditionally, with no check that the
    incoming `releaseId`/identity matches the existing `latestRelease` at that
    sequence — an equal-sequence conflicting release is not rejected.
  - `persistence.ts` `read()`: when `current === undefined`, it initializes
    fresh state and `write(initial)`s it; on write failure it swallows the
    error (`// The initial record still serves this session even if it could
not be persisted.`) and still returns `capability: 'available'`, contrary
    to "Do not report `capability: available` when the initial state failed to
    persist."
  - `scripts/pages/lib/stableRelease.mjs` `readRetainedReleaseDescriptors`
    silently drops any file that fails `JSON.parse` or fails
    `isValidDescriptorIdentity` (comment: "skipped rather than rejected"); it
    also never checks filename-vs-`releaseId` match or duplicate release ids
    (only duplicate sequence ownership is checked). The file keeps a
    file-level `/* eslint-disable jsdoc/require-jsdoc */`/`/* eslint-enable */`
    pair around every export.
  - `tests/e2e/release/managedStableUpdates.spec.ts`: the three "offline"/
    "deep-link offline" tests and test 1 (migration) never restart a browser
    process — they call `page.close()` then `context.newPage()` inside one
    already-running browser/context, which shares the same live worker
    without a real cold start. Test 1's legacy worker
    (`artifactServer.mjs:123-131`) is a hand-written two-line string, not a
    reproduction of the repository's actual generated Workbox output, and no
    test independently exercises `controllerchange` reconnect on an
    already-open second window. Test 11 is `test.fixme`.
- Non-goals (unchanged from revision 1/2): historical/downgrade UI, post-success
  user rollback, archive deletion, branch/develop/PR managed updates, Material
  changes, restoring multi-window activation.
- Boundaries: same files as revision 2 (`shared/service/appUpdate/**`,
  `shared/serviceClient/appUpdate/**`, `entities/appUpdate`, the four
  `features/appUpdate*` composables, Settings/pane UI,
  `scripts/pages/lib/stableRelease.mjs`, the release fixture/server, and their
  tests), plus a narrowly scoped new release-only VFS-activity test fixture
  (excluded from production) for the item-10 browser proof.
- Ownership: unchanged from revision 2's Ownership bullet.
- State shape: unchanged persisted shape (`schemaVersion` stays `3`); the only
  additions are (a) `selectServedRelease`/`projectAppUpdateSnapshot` gaining a
  `clientId` parameter (pure function signature change, not a stored-shape
  change) and (b) `confirmTrialBoot` gaining a `sourceClientId` parameter.
  `RELEASE_CONTROLLER_SCHEMA_VERSION` does not change because no persisted
  field is added, renamed, or removed.
- Fixes, one per confirmed defect above:
  1. **Offline bootstrap** (`sw.ts`): `loadCurrentRelease()` first tries
     `isReleaseAvailable(currentRelease-from-embedded-id)` plus a persisted
     read; only fetches the network descriptor when neither the final cache
     nor persisted state can supply the build release identity (first online
     install). Never fetch `latest.json` from worker bootstrap/serving — only
     the explicit `CHECK_FOR_UPDATES` operation does.
  2. **Controller reconnect** (`client.ts`): replace the one-shot
     `waitForController` listener with a permanent `controllerchange`
     listener that calls one idempotent `connect()` routine (register →
     `GET_SNAPSHOT` → `PRIVATE_BOOT_READY` → resubscribe), used both at first
     setup and on every subsequent takeover.
  3. **Conservative window counting** (`controller.ts`/`stableClients.ts`):
     `UPDATE_NOW` blocking counts `getStableWindowClients()` (raw live
     stable-URL clients from `clients.matchAll`), not the registered-only
     intersection. The registered set stays reserved for
     handshake-dependent capabilities (targeted `vfsReadiness`).
  4. **Client-bound trial** (`trial.ts`/`controller.ts`/`sw.ts`):
     `selectServedRelease(state, clientId)` returns `trial.targetRelease` only
     when `clientId === trial.initiatingClientId`, else the committed release.
     `confirmTrialBoot(state, sourceClientId, releaseId)` commits only when
     both the client id and release id match; a correct release from the
     wrong client, or a wrong release from the right client, is ignored (no
     rollback side effect — only a genuine repeat navigation from the claiming
     client without confirmation triggers `rollbackFailedTrialBoot`, unchanged
     from revision 2).
  5. **Per-client snapshot** (`stateMachine.ts`/`controller.ts`/`sw.ts`):
     `projectAppUpdateSnapshot(state, capability, clientId)` sets
     `runningRelease` to `trial.targetRelease` only for the trial's client,
     else the committed release. `GET_SNAPSHOT` and `broadcastSnapshot` pass
     the requesting/target client id through.
  6. **Target-aware preparation projection** (`stateMachine.ts`): add a
     private `sameReleaseIdentity(a, b)` full-field comparison and use it so
     `projectUpdateState` treats `preparation.status === 'ready' | 'failed'`
     as describing `state.latestRelease` only when the preparation's release
     has the same identity as `latestRelease`; otherwise (latest has already
     moved to a strictly newer target) the state is `'available'` for that
     newer target, never `'ready'`/`'failed'` for the stale one.
  7. **Full cache identity** (`releaseCache.ts`): `isReleaseAvailable` compares
     every field task item 7 lists (`releaseId`, `releaseSequence`,
     `appVersion`, `buildId`, `buildDate`, `indexUrl`, `schemaVersion`) between
     the expected identity and the cached descriptor before checking files.
  8. **Equal-sequence rejection** (`controller.ts`/`releaseCache.ts`):
     `finishCheck` (and the equivalent metadata-acceptance point) treats a
     `latest.release` with the same sequence as the current `latestRelease`
     but a different full identity as invalid metadata (`invalidReleaseMetadata`
     error, `latestRelease` left untouched), not as an accepted update.
  9. **Persistence capability on write failure** (`persistence.ts`): if the
     first-time `write(initial)` throws, `read()` returns
     `capability: 'unavailable'` (state still serves the initialized release
     in-memory for this session; only the durable-capability fact changes).
  10. **Active-VFS browser proof**: remove `test.fixme` from scenario 11; add
      a narrowly scoped release-only fixture that starts one real pending VFS
      operation (see Required first step / item 10 below) and drive the
      existing `blockedByActivity` path through it for real.
  11. **Publisher strictness + docs** (`stableRelease.mjs`):
      `readRetainedReleaseDescriptors` fails publication (throws) on malformed
      JSON, invalid schema, filename/`releaseId` mismatch, or a duplicate
      `releaseId` across descriptor files, instead of skipping. Remove the
      file's blanket `jsdoc/require-jsdoc` disable/enable pair; document every
      exported function individually.
  12. **Browser fixtures** (`managedStableFixture.mjs`/`artifactServer.mjs`/
      `managedStableUpdates.spec.ts`): replace the two-line legacy-worker
      string with a real `injectManifest`-built Workbox worker fixture (built
      once via the existing build pipeline with a fixed pre-managed
      `sw.ts`-equivalent source, or retained as a committed generated
      artifact) reproducing precache + navigation fallback + `skipWaiting`/
      `clients.claim()` takeover; add a raw-Playwright
      (`chromium.launchPersistentContext`) helper that launches with a real
      temp `userDataDir`, closes the entire browser context, and relaunches a
      new browser process against the same profile, for the two offline
      scenarios (item 1/1-deep-link) and to prove Manual pin survives a real
      process restart (item 9 of Required browser/release coverage).
- Rejected (unchanged from revision 2's Rejected list, still true): a
  persisted client-registration table, proactive continuous window-count
  broadcasting, keeping `activationTransaction`-shaped fields.
- Shared UI blast radius: none.
- Acceptance: task acceptance criteria verbatim; all defects above resolved
  with tests; zero regression to scenarios 1–19 already passing.
- Risks: per-client projection/selection touching every `sw.ts`
  fetch/message call site (mechanical but wide); persistent-profile browser
  restart being genuinely slower/flakier than same-context `newPage()` (bound
  by explicit waits on `waitForExecutedRelease`, not sleeps); regenerating a
  real Workbox fixture adding a build step to the release fixture pipeline.
- Readiness: architecture unchanged and already approved; every fix below is a
  bug fix within the current model, not a new product decision. Blockers:
  none. Verdict: ready.

## Implementation preflight

- Authoring source: this handoff; full read of `contracts.ts`, `controller.ts`,
  `controller.test.ts`, `stateMachine.ts`, `stateMachine.test.ts`, `trial.ts`,
  `trial.test.ts`, `persistence.ts`, `persistence.test.ts`, `releaseCache.ts`,
  `releaseCache.test.ts`/`contracts.test.ts`, `stableClients.ts`,
  `stableClients.test.ts`, `sw.ts`, `client.ts`, `publicContracts.ts`, the four
  feature composables, `entities/appUpdate/useAppUpdate.ts`,
  `widgets/SettingsSections/appUpdateStatus.ts`,
  `pages/AppUpdatesPane/AppUpdatesPane.vue`, `scripts/pages/lib/stableRelease.mjs`,
  `scripts/release/managedStableFixture.mjs`, `scripts/release/artifactServer.mjs`,
  `tests/e2e/release/managedStableUpdates.spec.ts`, `tests/e2e/helpers.ts`,
  `playwright.release.config.ts`, `main.ts`, `MainApp.vue`.
- Owner map: unchanged from revision 2.
- Public entry points: unchanged — `@shared/serviceClient/appUpdate`,
  `@entity/appUpdate`, one composable per feature barrel. `selectServedRelease`/
  `confirmTrialBoot`/`projectAppUpdateSnapshot` remain private to
  `shared/service/appUpdate`; only their call signatures inside that module
  change.
- Reuse: every existing mechanism (command queue, staging/commit cache,
  current/LKG persistence transaction, stable-URL classification, Playwright
  fixture server) is kept; fixes are targeted corrections, not replacements.
- Minimum design vs. simpler alternative: threading `clientId` through
  `selectServedRelease`/`projectAppUpdateSnapshot`/`confirmTrialBoot` is the
  minimum change that makes trial routing and snapshots client-accurate
  without introducing a per-client state store — the trial's single
  `initiatingClientId` field (already persisted) is sufficient input.
- Passes (independent, focused verify after each):
  1. This preflight rewrite.
  2. `persistence.ts` write-failure capability fix + test.
  3. `releaseCache.ts` full cache-identity comparison + tests (same-id/
     mismatched-sequence, mismatched build metadata, wrong descriptor identity,
     partial cache, valid cache survives repeated failed preparation).
  4. `stateMachine.ts` target-aware `projectUpdateState` (`sameReleaseIdentity`
     helper) + tests (`B running→latest C→B success`, `B ready→latest C`,
     `B failed→latest C`, `B failed→latest C→Manual Update now`).
  5. `trial.ts` client-bound `selectServedRelease`/`confirmTrialBoot` +
     `stateMachine.ts` per-client `projectAppUpdateSnapshot` + tests.
  6. `controller.ts`: wire the new `clientId`-aware calls through
     `GET_SNAPSHOT`/`PRIVATE_BOOT_READY`; conservative `UPDATE_NOW` window
     counting via `getStableWindowClients()`; equal-sequence rejection in
     `finishCheck` + tests (wrong client right release, right client wrong
     release, per-client running release, equal-sequence/different-id
     invalid, unregistered live window blocks).
  7. `sw.ts`: offline bootstrap identity lookup order; pass `clientId` through
     fetch/message handling to the now-client-aware controller calls.
  8. `client.ts`: permanent `controllerchange` → idempotent `connect()`
     reconnect routine (register, `GET_SNAPSHOT`, `PRIVATE_BOOT_READY`,
     resubscribe), reused at initial setup.
  9. `scripts/pages/lib/stableRelease.mjs`: strict retained-descriptor
     validation (throw instead of skip) + remove blanket JSDoc disable +
     document every export + tests (corrupt JSON, invalid schema,
     filename/id mismatch, duplicate id, existing rollback/republish/collision
     cases kept).
  10. Real Workbox legacy-worker fixture + persistent-profile browser-restart
      helper + rewritten offline/migration/reconnect scenarios in
      `managedStableUpdates.spec.ts`.
  11. Real active-VFS release fixture; un-`fixme` scenario 11.
  12. Obsolete-code/comment sweep; final `pnpm verify:release` then read-only
      `pnpm verify`.

```text
TEST IMPACT
Changed contracts: `selectServedRelease`/`confirmTrialBoot`/
  `projectAppUpdateSnapshot` gain a `clientId` parameter (private, in-module
  callers only); cache-identity comparison in `isReleaseAvailable`; equal-
  sequence metadata acceptance in `finishCheck`; persistence capability on
  first-write failure; publisher retained-descriptor validation strictness;
  worker bootstrap identity source order; client controller-reconnect
  behavior; two Playwright fixtures (legacy worker, active-VFS release
  fixture) and one new persistent-profile browser-restart test helper.
Risks: per-client threading missed at one `sw.ts` call site silently
  reverting to global trial serving; stricter publisher validation breaking
  an existing retained-descriptor tree in CI if a legacy file does not
  conform; persistent-profile Playwright helper flakiness from real process
  start/stop timing (mitigated with explicit `waitForExecutedRelease`,
  no sleeps).
Proof owners: sibling Vitest tests for persistence/releaseCache/
  stateMachine/trial/controller/stableRelease.mjs; `sw.ts`/`client.ts` proven
  only through `tests/e2e/release/managedStableUpdates.spec.ts` (no unit
  seam replaces real worker/browser behavior); publisher scanning proven in
  `scripts/pages/lib/stableRelease.test.mjs`.
Existing proof: all files listed in the revision-2 preflight's "Existing
  proof" line, unchanged locations.
New or changed tests: persistence.test.ts (write failure → capability
  unavailable); releaseCache.test.ts (identity mismatch cases, partial cache,
  valid cache survives failed repeat preparation); stateMachine.test.ts
  (target-aware ready/failed/available reconciliation matrix);
  trial.test.ts/controller.test.ts (client-bound serve/confirm, per-client
  snapshot, conservative window counting, equal-sequence rejection);
  stableRelease.test.mjs (corrupt/invalid/mismatched/duplicate retained
  descriptors fail publication); managedStableUpdates.spec.ts (real
  persistent-profile offline cold start + deep link, real Workbox migration
  fixture, reconnect-after-takeover scenario, un-skipped active-VFS scenario).
Repository impact metadata updates: none required beyond existing release-
  spec registration — no spec path moves.
Task-specific measurements: none new beyond the existing A/B/C fixture and
  Pages size-limit check.
```

- Focused commands: `pnpm verify --only unit-tests --files <changed path>`
  after each of passes 2–9; `pnpm verify --only type-check` after passes 6–8;
  supported release-smoke focused run after passes 10–11.
- Final commands: `pnpm verify:release`, then final read-only `pnpm verify`.
  A red gate, a missing required browser scenario, or drift from this
  preflight keeps the task partial, not complete.
