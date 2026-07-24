# Managed stable updates preflight

> Revision 4 (defect closure on the single-window trial model, second pass).
> Revision 2's architecture — one open stable window required to switch
> releases, Automatic prepares in the background and activates only on a
> later clean launch, Manual pins and reloads only the requesting window — is
> correct and is not being redesigned. Revision 3 claimed defects 1-9 and 11
> were fixed and only defect 10 (active-VFS browser proof) and half of 12
> (Workbox migration fixture) remained open. A full re-read of the current
> code against revision 3's own claims found several of those "fixed" items
> still have a real, reachable defect underneath a partial fix. This revision
> corrects the record and the remaining implementation.
>
> Rejected alternative (unchanged from revision 1, kept as a one-line record):
> a coordinated multi-window activation transaction (`activationTransaction`
> with `replacesClientId`/`resultingClientId`/restart-URL-token mapping,
> waiting for every replacement to confirm) was built first and removed. It
> introduced distributed lifecycle state — double-start races, stuck
> check/preparation, offline startup depending on `latest.json`, a
> non-monotonic publisher sequence — that a single required window makes
> unnecessary. Do not restore it.

## Architecture handoff (revision 4)

- Goal: close every defect below without adding a manager, provider,
  registry framework, or generic state-machine layer. The state shape,
  ownership split, and file boundaries stay as-is except where a defect fix
  requires a new build-time constant or a stronger identity check.
- Confirmed evidence (full re-read of the current code, not revision 3's
  claims about it):
  1. **Offline bootstrap still network/cache-gated on this worker's own
     build** (`sw.ts:47-56` `loadCurrentRelease`, called at `sw.ts:160` inside
     `selectNavigationRelease` and at `sw.ts:197` inside the `fetch` handler,
     in both cases _before_ `store.read()`). `loadCurrentRelease` tries
     `readCachedReleaseDescriptor(__RELEASE_ID__)` first, but that cache entry
     is only ever populated by `prepareRelease`, which only ever runs for the
     release selected as `committedRelease(state)` (`sw.ts:126-131`) — i.e.
     this worker's own build release is only cached when it is also the
     active/pinned release. A worker whose build is _not_ the committed
     release (the exact "worker B controls, release A stays pinned" case the
     task requires) never gets its own descriptor cached, so on a real
     offline restart `loadCurrentRelease` cache-misses, the network `fetch`
     throws, and the whole call throws — before `store.read()` ever runs. The
     `fetch` handler's outer `catch` (`sw.ts:223-228`) then falls through to
     plain `fetch(event.request)`, which also fails offline, instead of
     serving the persisted pinned/active release. This is the literal
     scenario required by "release A is pinned; controller worker from
     release B takes control... browser restarts offline... pinned release A
     starts successfully" and it does not currently work.
  2. **Obsolete preparation can still write over a newer canonical latest and
     can still start a trial for it** (`controller.ts`). `finishPreparation`
     (124-171) gates only on `preparation.status === 'running' &&
operationId === token` before accepting success/failure — it never
     compares `latest.release` against `state.latestRelease`. In Automatic
     mode this is masked because `finishCheck`'s own `startPreparation` call
     (256) immediately overwrites `state.preparation` with a new
     `operationId` targeting the new canonical latest, so an obsolete token
     never matches on completion. In **Manual** mode, `finishCheck` never
     calls `startPreparation` (255: `if (next.mode === 'automatic')` only), so
     a Manual `UPDATE_NOW`-triggered preparation for B that is still running
     when a check discovers C is left completely untouched. When B's
     preparation later completes, `finishPreparation`'s eligibility check
     (140-142) only checks `failedReleaseIds` and `isStrictlyNewerRelease`
     against `committedRelease(state)` — not against `state.latestRelease` —
     so it can still mark `preparation: { status: 'ready', release: B }` and,
     because the original `UPDATE_NOW` passed `activateAfterPreparation:
true`, immediately calls `beginTrial(B, initiatingClientId)`.
     `beginTrial` (107-122) checks only that `preparation.status === 'ready'`
     and its `release.releaseId` matches the target — it never compares
     against `state.latestRelease` either. The result: a real, reachable path
     where a Manual `Update now` on B, superseded by a later-discovered C,
     starts a trial for the now-obsolete B. This is exactly the forbidden
     "B must never start a trial."
  3. **`finishCheck` can call `startPreparation` with the stale raw incoming
     pointer instead of the resolved canonical latest**
     (`controller.ts:246-256`). When the incoming `latest` is stale (lower
     sequence than `reference`), the resolved `latestRelease` variable
     correctly stays at the old (higher) value and is what gets persisted as
     `next.latestRelease`. But line 256 calls `startPreparation(next, latest,
false)` using the original just-fetched `latest` value, not
     `next.latestRelease` — so a stale incoming pointer can still be handed
     to `startPreparation`, which only checks it against
     `committedRelease(state)` (173, not against `next.latestRelease`), and
     can start preparing/caching a release that is not the canonical latest.
  4. **`SET_MODE` and `CHECK_FOR_UPDATES` are not blocked during an active
     trial** (`controller.ts` `execute`, 370-379). `UPDATE_NOW` already
     special-cases `state.trial` (381-383) but the `CHECK_FOR_UPDATES` and
     `SET_MODE` cases call `startCheck`/`setMode` unconditionally. `setMode`
     (295-310) itself only conditionally skips resetting `preparation` when a
     trial exists (`preservingTrial`, 300 and 305) but still always changes
     `state.mode` and `state.pinnedRelease` (301-304) even mid-trial — i.e.
     Manual↔Automatic mode changes, and a fresh metadata check, are both
     currently accepted while `state.trial` is set. Revision 3 never
     identified or fixed this; there is no test asserting mode/check are
     rejected during a trial, and (per task description) an existing test
     currently asserts a mode mutation during trial _is_ accepted — that test
     must be replaced, not merely supplemented.
  5. **`associateTrialNavigation` rolls back on any second navigation, not
     only a repeat navigation from the claiming client**
     (`trial.ts:65-75`). Once `trial.initiatingClientId` is set, _every_
     subsequent call unconditionally calls `rollbackFailedTrialBoot(state)` —
     it never compares `navigatingClientId` against
     `trial.initiatingClientId`. `sw.ts:159-186`'s `selectNavigationRelease`
     calls `associateTrialNavigation` for **every** navigating client while a
     trial exists, including an unrelated second stable window's ordinary
     navigation. This means any other open window navigating (e.g. opening a
     new tab, or a deep link) while a trial is in progress cancels the
     claiming client's legitimate trial — the literal forbidden behavior "Any
     additional navigation during a claimed trial causes rollback, even when
     it comes from another client." Revision 3 marked this "Applied" based on
     `confirmTrialBoot`'s client check alone; it never re-checked
     `associateTrialNavigation`'s own logic.
  6. **`projectUpdateState`'s `running` branch is not target-aware**
     (`stateMachine.ts:79`): `if (state.preparation.status === 'running')
return 'preparing';` unconditionally, with no `preparationTargetsLatest`
     check (that check is only applied to the `ready`/`failed` branches, 81
     and 87). A preparation still running for an obsolete target B while
     `state.latestRelease` has already advanced to C incorrectly displays
     `'preparing'` instead of `'available'` for C.
  7. **`isValidDescriptorIdentity` in `stableRelease.mjs` (145-149) validates
     only `schemaVersion`/`releaseId`/`releaseSequence`** — not
     `appVersion`/`buildId`/`buildDate`/`indexUrl`/`files` (array present,
     each file's `url`/`byteSize`/`sha256`), not that exactly one file is the
     canonical release index, and not that the descriptor's own filename
     matches its `releaseId` at the field level beyond the outer
     `readRetainedReleaseDescriptors` filename check. A structurally invalid
     descriptor (missing files array, corrupt file records, wrong
     `indexUrl`) currently still passes retained-descriptor validation and is
     counted in sequence allocation.
  8. **The UI does not disable controls for `trialStarting`**
     (`AppUpdatesPane.vue`): the `Automatic updates` switch (147) and `Check
for updates` button (155) are disabled only on
     `isActionPending || snapshot?.capability !== 'available'`; `Update now`
     (139) only on `isActionPending`. None check
     `snapshot?.updateState === 'trialStarting'`.
  9. **The migration test still uses a hand-written non-Workbox legacy
     worker and reproduces the connection protocol manually**
     (`scripts/release/artifactServer.mjs:123-131` serves a literal two-line
     `skipWaiting`/`clients.claim()` string, not a real `injectManifest`
     build; `tests/e2e/release/managedStableUpdates.spec.ts:16-38`
     `waitForManagedController` manually posts `GET_SNAPSHOT` and listens for
     `controllerchange` itself instead of driving the real
     `setupManagedAppUpdates()` — tests 1 and the reconnect test both use it).
  10. **Scenario 11 (active-VFS blocks update) is still `test.fixme`**
      (`tests/e2e/release/managedStableUpdates.spec.ts:297`, with its
      explanatory comment at 316-323 confirming every VFS-mutating dialog in
      the app stays modal for its own duration, so no current UI action can
      create a real non-modal pending VFS operation to drive this
      end-to-end).
  - Confirmed **not** defective on re-read (revision 3's claim stands):
    `client.ts`'s permanent `controllerchange` reconnect (2), conservative
    `UPDATE_NOW` window counting via `getStableWindowClients` (3),
    `confirmTrialBoot`'s client+release match (4, the commit half — only
    `associateTrialNavigation`'s claim/rollback half was defective, see 5
    above), per-client snapshot projection via `releaseForClient` (5),
    `isReleaseAvailable`'s full cache-identity comparison (7),
    `finishCheck`'s equal-sequence rejection (8), persistence
    capability-on-write-failure (9), `readRetainedReleaseDescriptors`
    throwing instead of skipping and no blanket JSDoc disable (part of 11),
    and the persistent-profile browser-restart helper itself
    (`tests/e2e/release/persistentProfile.ts`, part of 12).
- Non-goals (unchanged): historical/downgrade UI, post-success user rollback,
  archive deletion, branch/develop/PR managed updates, Material changes,
  restoring multi-window activation.
- Boundaries: same files as revision 3, plus `vite.config.ts`/`env.d.ts`/
  `src/setupVitest.ts` (new build-time release-identity constant) and a new
  small release-only VFS-activity test seam (excluded from production) for
  the active-VFS browser proof.
- Ownership: unchanged.
- State shape: unchanged persisted shape (`schemaVersion` stays `3`). No new
  persisted field is introduced by any fix below; `RELEASE_CONTROLLER_SCHEMA_VERSION`
  does not change.
- Fixes, one per confirmed defect above:
  1. **Embedded full worker identity** (`sw.ts`, `vite.config.ts`,
     `env.d.ts`, `src/setupVitest.ts`): add `__RELEASE_SEQUENCE__` as a new
     build-time string constant alongside the existing `__RELEASE_ID__`/
     `__APP_VERSION__`/`__BUILD_ID__`/`__BUILD_DATE__`. `releaseSequence` is
     genuinely unknown at `vite build` time (it is allocated from the
     retained-release tree only during Pages publication, after the dist
     artifact is already built — confirmed by tracing
     `scripts/release/buildArtifact.mjs` → `vite build` → later, separately,
     `scripts/pages/publishStable.mjs` → `allocateReleaseSequence`). Reordering
     CI to know it before `vite build` would mean checking out the retained
     Pages tree inside the release-gate/deploy pipeline before building —
     out of proportion to a bug-fix PR and outside this task's scope of
     touching `.github/workflows/release.yml`. Instead: embed a distinctive
     placeholder string token via `vite.config.ts`'s `define`, and have
     `scripts/pages/lib/stableRelease.mjs`'s existing post-build artifact
     step (`buildStableReleasePublication`/`writeStableReleaseArtifact`/
     `applyManagedStablePublish`, which already patches `distDir`'s
     `index.html` with a literal meta-tag injection after the real identity
     is known) also literally replace that placeholder token in the built
     `dist/sw.js` with the real allocated sequence, the same way it already
     patches `index.html`. `sw.js` is not part of the hashed/verified release
     descriptor file list (only `assets/**` and the archived index are), so
     patching it post-build does not affect release-content integrity
     checks. `sw.ts` parses `Number(__RELEASE_SEQUENCE__)` and validates the
     resulting embedded identity with `releaseIdentitySchema` before ever
     trusting it as a fallback; an un-patched or non-numeric value safely
     fails validation (e.g. local/dev/non-stable-channel builds), so the
     worker degrades to the existing network/cache path rather than using a
     wrong number. `sw.ts` bootstrap order becomes: read persisted state
     (constructed with the embedded identity as its only fallback value, not
     as a gate) → select active/pinned release from that state → validate its
     final cache → serve without network access → only fetch a network
     descriptor when restoring a genuinely missing cache while online, and
     only fall back to the embedded identity when persisted state itself is
     absent/unrecoverable (first-ever install or corrupt persistence).
     `/updates/latest.json` is never fetched from bootstrap/serving, only
     from the explicit `CHECK_FOR_UPDATES` path (already true today).
  2. **Preparation bound to canonical latest, including obsolete-target
     trial-start** (`controller.ts`): `finishPreparation`'s eligibility check
     gains `(state.latestRelease === undefined ||
isSameReleaseIdentity(latest.release, state.latestRelease))` alongside
     the existing `failedReleaseIds`/`isStrictlyNewerRelease` checks, in both
     the success and the catch/failure branch (so an obsolete failure is
     recorded as `idle`, not `failed(B)`, once latest has moved on).
     `beginTrial` gains the same identity check against `state.latestRelease`
     before ever calling `createTrial`, closing the "B must never start a
     trial" gap directly at its single choke point (both the async
     `finishPreparation`-driven trial start and the immediate-cache-hit path
     in `startPreparation` route through `beginTrial`).
  3. **Preparation always uses the resolved canonical latest, not the raw
     incoming pointer** (`controller.ts:256`): change
     `startPreparation(next, latest, false)` to build from `next.latestRelease`
     (via the existing local `descriptorFor` helper) instead of the raw
     `latest` parameter, so a stale incoming check response can never reach
     `startPreparation` even though its own equal/lower-sequence handling
     already prevents it from becoming the persisted canonical latest.
  4. **Exclusive trial command handling** (`controller.ts` `execute`):
     `CHECK_FOR_UPDATES` and `SET_MODE` both return the same idempotent
     `{ status: 'accepted' }` no-op response without calling
     `startCheck`/`setMode` at all when `state.trial` is set — mirroring
     `UPDATE_NOW`'s existing trial no-op. State is provably byte-for-byte
     unchanged (no `save` call happens on that path). The existing test that
     currently asserts mode mutation succeeds during a trial is replaced with
     tests asserting state is unchanged for both commands.
  5. **Trial navigation ownership** (`trial.ts` `associateTrialNavigation`):
     add the explicit branch — unclaimed trial claims for
     `navigatingClientId`; claimed trial + `navigatingClientId ===
trial.initiatingClientId` (a repeat navigation from the claiming client
     before boot confirmation) rolls back; claimed trial +
     `navigatingClientId !== trial.initiatingClientId` (an unrelated client)
     returns `state` unchanged — no claim, no rollback.
  6. **Target-aware `running` projection** (`stateMachine.ts`):
     `projectUpdateState`'s `running` branch also calls
     `preparationTargetsLatest(state, state.preparation.release)`; when it
     does not target latest, fall through instead of returning `'preparing'`,
     so `running(B)` with latest C projects `'available'` for C exactly like
     the already-correct `ready`/`failed` branches.
  7. **Full retained-descriptor schema validation**
     (`scripts/pages/lib/stableRelease.mjs`): replace
     `isValidDescriptorIdentity` with validation of the complete descriptor
     contract — schema version, every identity field, `indexUrl`, a
     non-empty `files` array with valid `url`/`byteSize`/`sha256` per file,
     exactly one file matching the canonical release index path, and the
     descriptor's own `releaseId` matching its filename (already partially
     checked by the caller; consolidate so the validator itself is complete).
     Reuse `releaseDescriptorSchema`'s field semantics conceptually (Node
     publication code cannot import the browser-only `zod` schema module
     directly per the constraint against importing browser modules into
     publication code — a local structural check mirrors the same fields).
  8. **UI disables all three controls during `trialStarting`**
     (`AppUpdatesPane.vue`): add `snapshot?.updateState === 'trialStarting'`
     to the `Automatic updates` switch, `Check for updates`, and `Update now`
     `:disabled` expressions.
  9. **Real Workbox migration fixture + production reconnect proof**
     (`scripts/release/managedStableFixture.mjs`, `scripts/release/artifactServer.mjs`,
     `tests/e2e/release/managedStableUpdates.spec.ts`): build a real Workbox
     worker via this repository's own `branch`-channel PWA config
     (`config/plugins/pwa.ts`'s `generateSW`-style build — root scope via
     `BASE_URL=/`, real precache + `runtimeCaching`, no managed-update
     protocol at all, the same shape the stable app used before this
     feature) once as part of the release fixture pipeline, serve its real
     built bytes from `/__managed-fixture/worker/legacy` instead of the
     hand-written string, and remove `waitForManagedController` in favor of
     driving the real `setupManagedAppUpdates()`/`controllerchange` handling
     already production-proven by the "production client reconnects..."
     test, waiting only on public UI/state (the App updates pane's own
     status text) rather than reproducing the transport protocol in the
     test.
  10. **Real active-VFS browser proof** (`test.fixme` removal + a narrowly
      scoped release-only VFS-activity test seam): a new
      `startReleaseTestPendingOperation`/`finishReleaseTestPendingOperation`
      pair on `VirtualFileSystem` (token-correlated, since a raw resolver
      callback cannot cross the file-system service's worker RPC boundary),
      exposed through `useVfsActivity` and wired to
      `window.__MIOFRAME_RELEASE_TEST_VFS_ACTIVITY__` only when the new
      `__RELEASE_TEST_HOOKS__` build flag is set (set only by the release
      fixture build, never by the real stable/branch/PR pipelines) — starts
      one real pending operation observed by `useVfsActivity`/`vfsActivity`
      (the same production activity tracking `MainApp.vue` already wires to
      `setupAppUpdateRestartReadiness`), without overriding `vfsReady`
      directly, then drives `blockedByActivity` → finish the operation →
      `Update now` succeeds, through real production code end to end.
  11. **Client-specific trial-routing browser proof**
      (`tests/e2e/release/managedStableUpdates.spec.ts`): a new scenario
      opens an unrelated second client immediately after the claiming
      client's own reload navigation starts (real navigation-lifecycle
      ordering via `page.waitForURL`, not a sleep) and proves the unrelated
      client keeps receiving the committed release throughout the pending
      trial and only picks up the new release on its own next navigation
      after commit.
  12. **Worker-B/pinned-A offline browser proof**
      (`scripts/release/managedStableFixture.mjs` builds a second real
      managed worker embedding release B's own build identity, served as
      `/__managed-fixture/worker/B`;
      `tests/e2e/release/managedStableUpdates.spec.ts` adds the scenario): a
      newer controller worker whose own build differs from the persisted
      Manual pin still serves the pinned release after a real
      persistent-profile browser-process restart offline — the literal
      scenario fix 1 above requires.
- Rejected (unchanged from revision 2/3): a persisted client-registration
  table, proactive continuous window-count broadcasting, keeping
  `activationTransaction`-shaped fields, reordering the release CI pipeline
  to pre-allocate `releaseSequence` before `vite build`.
- Shared UI blast radius: none (`AppUpdatesPane.vue` disabled-state additions
  only).
- Acceptance: task acceptance criteria verbatim; all defects above resolved
  with tests; zero regression to scenarios already passing.
- Risks: the embedded-identity placeholder-patch mechanism is new (no prior
  pattern in this repo patches a compiled JS bundle, only `index.html` text);
  mitigated by a distinctive, collision-safe sentinel token and a unit test
  asserting the patch is applied exactly once and the un-patched constant
  safely fails identity-schema validation. Real Workbox fixture build adds a
  build step to the release fixture pipeline. Active-VFS test seam must not
  become a second, divergent way to flip `vfsReady`.
- Readiness: architecture unchanged and already approved; every fix below is
  a bug fix within the current model. Blockers: none. Verdict: ready.

## Implementation preflight

- Authoring source: this handoff; full read of `contracts.ts`, `controller.ts`,
  `controller.test.ts`, `stateMachine.ts`, `stateMachine.test.ts`, `trial.ts`,
  `trial.test.ts`, `persistence.ts`, `releaseCache.ts`, `stableClients.ts`,
  `sw.ts`, `client.ts`, `publicContracts.ts`, `AppUpdatesPane.vue`,
  `scripts/pages/lib/stableRelease.mjs`, `scripts/release/artifactServer.mjs`,
  `scripts/release/managedStableFixture.mjs`, `scripts/release/buildArtifact.mjs`,
  `vite.config.ts`, `config/plugins/pwa.ts`,
  `tests/e2e/release/managedStableUpdates.spec.ts`, `tests/e2e/helpers.ts`,
  `useVfsActivity.ts`, `MainApp.vue`.
- Owner map: unchanged.
- Public entry points: unchanged.
- Reuse: every existing mechanism (command queue, staging/commit cache,
  current/LKG persistence transaction, stable-URL classification, Playwright
  fixture server, the `index.html` post-build text-patch pattern) is kept;
  fixes are targeted corrections, not replacements.
- Minimum design vs. simpler alternative: a placeholder-token post-build
  patch for `releaseSequence` (reusing the existing `index.html` patch
  pattern) is the minimum change that gets a build-verified-correct sequence
  into the worker without reordering the release CI pipeline or adding a
  second build pass.
- Passes (independent, focused verify after each):
  1. This preflight rewrite.
  2. `vite.config.ts`/`env.d.ts`/`src/setupVitest.ts`: add `__RELEASE_SEQUENCE__`
     placeholder constant.
  3. `stableRelease.mjs`: patch `dist/sw.js`'s placeholder with the real
     sequence in `writeStableReleaseArtifact`/`applyManagedStablePublish`;
     full descriptor schema validation; tests.
  4. `sw.ts`: embedded-identity construction + validation + bootstrap
     reordering (persisted-state-first); tests via existing sibling
     coverage plus new offline scenarios.
  5. `controller.ts`: obsolete-preparation/trial-start guard, stale-pointer
     `startPreparation` argument fix, exclusive trial command handling; tests.
  6. `trial.ts`: `associateTrialNavigation` claiming-vs-unrelated-client fix;
     tests.
  7. `stateMachine.ts`: target-aware `running` projection; tests.
  8. `AppUpdatesPane.vue`: `trialStarting` disables all three controls;
     component test.
  9. Real Workbox legacy-worker fixture + migration/reconnect scenario
     rewrite removing `waitForManagedController`.
  10. `__RELEASE_TEST_HOOKS__` build flag + `VirtualFileSystem` release-test
      pending-operation pair + `useVfsActivity`/`MainApp.vue` wiring; real
      active-VFS release-only test seam; un-`fixme` scenario 11.
  11. Client-specific trial-routing browser scenario; worker-B/pinned-A
      persistent-profile offline browser scenario (second real managed
      worker build in `managedStableFixture.mjs`).
  12. Obsolete-code/comment sweep; final `pnpm verify:release` then read-only
      `pnpm verify`.

```text
TEST IMPACT
Changed contracts: new `__RELEASE_SEQUENCE__` and `__RELEASE_TEST_HOOKS__`
  build-time constants (private, worker/publication-script and
  release-test-seam only, respectively); `finishPreparation`/`beginTrial`
  eligibility gains a `state.latestRelease` identity check;
  `startPreparation` call site in `finishCheck` uses the resolved canonical
  latest; `CHECK_FOR_UPDATES`/`SET_MODE` reject during an active trial;
  `associateTrialNavigation` gains a claiming-client comparison;
  `projectUpdateState`'s `running` branch becomes target-aware; retained
  descriptor validation covers the complete schema; `AppUpdatesPane.vue`
  disables on `trialStarting`; `VirtualFileSystem` gains a
  release-test-only `startReleaseTestPendingOperation`/
  `finishReleaseTestPendingOperation` pair, surfaced through
  `useFileSystemService`/`useVfsActivity`/`MainApp.vue` only when
  `__RELEASE_TEST_HOOKS__` is set; one real Workbox-built (branch-channel
  `generateSW`) legacy-worker fixture replacing a hand-written string; a
  second real managed-worker build embedding release B's own identity for
  the offline worker-B/pinned-A scenario.
Risks: placeholder-patch mechanism applied to the wrong file or wrong
  occurrence count silently leaving a broken embedded identity in
  production (mitigated by a dedicated unit test on the patch function
  itself, and by `releaseIdentitySchema` validation at the `sw.ts` call
  site refusing to trust a malformed embedded value); stricter descriptor
  validation rejecting an existing retained-descriptor tree in CI if a
  legacy file does not conform; VFS-activity test seam accidentally
  becoming reachable outside release builds (mitigated by gating its
  presence at both the service and entity layers behind
  `__RELEASE_TEST_HOOKS__`, never overriding `vfsReady` itself); the
  client-specific trial-routing scenario ordering the unrelated client's
  navigation after the claiming client's own reload via real navigation
  events (`page.waitForURL`), not a sleep, to stay deterministic; two
  additional real `vite build` invocations in the release fixture pipeline
  (legacy worker, worker B) increasing fixture build time.
Proof owners: sibling Vitest tests for controller/stateMachine/trial/
  stableRelease.mjs/VirtualFileSystem/useFileSystemService; `sw.ts`/
  `MainApp.vue`'s release-test wiring proven only through
  `tests/e2e/release/managedStableUpdates.spec.ts` (no unit seam replaces
  real worker/browser behavior); `AppUpdatesPane.vue` proven through its
  existing component test file.
Existing proof: all files listed in revision 3's preflight's boundaries,
  unchanged locations.
New or changed tests: `controller.test.ts` (obsolete-B-preparation-success/
  failure with latest advanced to C never writes ready/failed(B) or starts
  a trial; stale-B-check-with-canonical-C never calls startPreparation(B);
  Automatic retains/starts C after obsolete B; Manual reports C available;
  CHECK_FOR_UPDATES/SET_MODE no-op with byte-identical state during a
  trial, replacing the prior test that accepted mode mutation during
  trial); `trial.test.ts` (claimed-client repeat navigation rolls back;
  unrelated-client navigation during a trial leaves state unchanged; the
  unrelated client keeps receiving the committed release and cannot
  confirm the trial; the claimed client can still confirm after an
  unrelated navigation); `stateMachine.test.ts` (`running(B)` with latest
  C projects `'available'`); `stableRelease.test.mjs` (full descriptor
  schema rejects each malformed field individually; sw.js placeholder patch
  applied exactly once, un-patched constant fails identity validation);
  `AppUpdatesPane.test.ts` (all three controls disabled when
  `updateState === 'trialStarting'`); `managedStableUpdates.spec.ts`
  (real persistent-profile offline restart under a worker whose own build
  is not the committed release; real Workbox-built migration fixture;
  un-skipped active-VFS scenario; client-specific trial-routing browser
  scenario).
Repository impact metadata updates: none required beyond existing release-
  spec registration — no spec path moves.
Task-specific measurements: none new beyond the existing A/B/C fixture and
  Pages size-limit check.
```

- Focused commands: `pnpm verify --only unit-tests --files <changed path>`
  after each of passes 2–8; `pnpm verify --only type-check` after passes
  4–8; supported release-smoke focused run after passes 9–10.
- Final commands: `pnpm verify:release`, then final read-only `pnpm verify`.
  A red gate, a missing required browser scenario, or drift from this
  preflight keeps the task partial, not complete.
