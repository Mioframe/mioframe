# Managed stable updates preflight

> Revision 2 (single-window trial). Revision 1 (below the rule) built a distributed
> multi-client activation transaction. It shipped with repeated lifecycle defects
> (activation depending on `replacesClientId`/`resultingClientId`/restart-URL tokens,
> double-start races, stuck check/preparation, offline startup depending on
> `latest.json`, UI re-deriving service-owned eligibility, non-monotonic publisher
> sequence). This revision replaces that model; it is not a patch on top of it.

## Architecture handoff (revision 2)

- Goal: release switching for the stable app requires exactly one open stable
  application window. Automatic mode checks/prepares in the background and never
  reloads an open window; it activates only on a later clean launch. Manual mode
  pins indefinitely and reloads only the requesting window on `Update now`.
- Confirmed evidence (this branch, `ec6af476`/`7c37a4f3`): `ReleaseControllerState`
  has 19 fields incl. `activationTransaction` (`expectedOldClientIds`, `replacements`,
  `confirmedReplacementClientIds`, `acceptsSingleLaunch`); `sw.ts` maps
  `replacesClientId`/`resultingClientId` and a `__mioframe_restart_transaction`/
  `__mioframe_restart_client` URL-token fallback; `client.ts` imports
  `ControllerResponse` from `controller.ts` (boundary leak); `entities/appUpdate`,
  `widgets/SettingsSections/appUpdateStatus.ts`, and `AppUpdatesPane.vue` each
  independently compare `releaseSequence`; `scripts/pages/lib/stableRelease.mjs`
  allocates sequence only from `updates/latest.json`, not from scanning retained
  descriptors, so a rolled-back pointer can collide with a retained higher sequence;
  `stableClients.ts` excludes `/external/` in production only to support the E2E
  fixture's foreign-window case.
- Non-goals (unchanged from revision 1): historical/downgrade UI, post-success user
  rollback, archive deletion, branch/develop/PR managed updates, Material changes.
- Boundaries: change only `shared/service/appUpdate/**`, `shared/serviceClient/appUpdate/**`,
  `entities/appUpdate`, the four `features/appUpdate*` composables, Settings/pane UI,
  `scripts/pages/lib/stableRelease.mjs`, the release fixture/server, and their tests.
  Preserve branch/develop/PR build, Workbox, routing, and unrelated publication behavior.
- Ownership (unchanged split, revised internals): `shared/service/appUpdate` privately
  owns protocol, controller state/transitions, persistence/LKG, cache staging/commit/
  cleanup, stable-client classification+registration, single trial lifecycle, boot
  recovery. `shared/serviceClient/appUpdate` publicly owns the UI-safe client;
  privately owns registration, transport, running-release read, local VFS-readiness
  report, reload, boot confirmation. `entities/appUpdate` exposes only the projected
  snapshot and its `hasUpdate`/`isReady` reactive reads — it must not re-derive
  `releaseSequence` comparisons (that fact now lives in `AppUpdateSnapshot.updateState`,
  computed once in `stateMachine.ts`). Four features own check/apply/mode/notify
  actions. `scripts/pages` owns sequence allocation, collision checks, publication.
- State shape (persisted, `schemaVersion: 3`): discriminated `check`/`preparation`
  status records (each carries its own `operationId`/`release` when running, so a
  running/ready/failed state always names its target — no parallel
  `checkOperationId`/`preparedRelease`/`activationRequested` fields), a single
  optional `trial: { targetRelease, previousRelease, startedAt, expiresAt,
initiatingClientId? }`, `failedReleaseIds: string[]`, `latestRelease?`. No
  `activationTransaction`, no client-id mapping, no `activationState` enum.
  `RELEASE_DESCRIPTOR_SCHEMA_VERSION` (wire format written by the publisher, stays
  `2`, unrelated to controller internals) is split from `RELEASE_CONTROLLER_SCHEMA_VERSION`
  (persisted controller shape, bumped to `3`) — today both reuse one constant, which
  is a latent coupling bug once the controller schema changes independently of the
  wire format.
- Minimum design: one serialized mutation queue (kept), tokened check/preparation
  operations (kept, now naming their target directly instead of via parallel
  optional fields), one staging cache per attempt (kept), **one** private trial
  record with no replacement map, one in-memory (non-persisted) registered-stable-
  client set rebuilt by the existing per-mount `PRIVATE_BOOT_READY` handshake, one
  projected snapshot exposing a single canonical `updateState`. Removing the
  replacement map and multi-client wait removes the confirmation-count logic,
  the idempotent-navigation-mapping logic, and the restart-token compatibility path
  entirely — this is the majority of revision 1's complexity and its defect surface.
- Boot confirmation (no mapping): a trial names only its `targetRelease` and
  (optionally, for observability) `initiatingClientId`. Only one navigation is ever
  served the trial target while a trial is active — release selection already
  restricts `releaseForClient` to serve `trial.targetRelease` to navigations during
  an active trial, and a trial is only created when exactly one/zero stable windows
  are open — so `PRIVATE_BOOT_READY{releaseId}` commits whenever `releaseId ===
trial.targetRelease.releaseId`, regardless of which client id reports it. No
  `replacesClientId`/`resultingClientId` read, no restart URL token.
- Stable window registration: URL classification (`isStableAppUrl`, same prefixes
  minus `/external/`, which is fixture-only and never a real production channel)
  is necessary but not sufficient. Windows additionally self-register with the
  worker via the existing `PRIVATE_BOOT_READY` message once Vue has mounted and
  the router is ready; the worker keeps an in-memory `Set` of registered client
  ids for this service-worker lifetime. "Registered stable windows" = live
  `clients.matchAll` stable-URL window clients ∩ that set (stale ids drop out
  naturally once `matchAll` stops returning them). After an SW restart the set is
  empty again and repopulates as each open window's next `PRIVATE_BOOT_READY`/
  `GET_SNAPSHOT`/`CHECK_FOR_UPDATES` message arrives (all already sent from
  `setupManagedAppUpdates()` on every page load, and from the existing
  online/visibilitychange listeners) — no persisted registry, no new polling
  protocol. This set is used for stable-window counting and Manual-update blocking
  only; it is not used to wait for or confirm multiple windows.
- Automatic clean launch: unchanged detection primitive — a navigation is a clean
  launch when `getStableWindowClients()` (live, controlled, stable-URL) minus the
  navigating client itself is empty. This is already a real browser-client check,
  not a client-ID string comparison; kept as-is, now feeding a single-window trial
  creation instead of the removed multi-window one.
- Manual `Update now` blocking: computed synchronously in the controller at
  command time — reject with `blocked{code:'blockedByOtherWindows'}` if more than
  one registered stable window exists (excluding the requesting one only when it
  is itself the sole other window — i.e. count of registered windows other than
  the requester must be zero); reject with `blocked{code:'blockedByActivity'}` if
  the requesting client's local VFS-readiness callback reports busy (same
  `setupAppUpdateRestartReadiness` mechanism as today, now queried from exactly
  one client instead of broadcast-polled across all clients, since only the
  requester's activity is ever relevant under the one-window precondition).
  These are transient action-result facts (`AppUpdateActionResult.blocked.code`),
  not persisted background `updateState` — blocking is re-evaluated fresh on each
  attempt, so there is nothing to reconcile if the blocking condition changes
  between attempts (this narrows the illustrative task union: `updateState` covers
  only background check/preparation/trial progress: `notChecked | checking |
upToDate | available | preparing | ready | failed | trialStarting`; the two
  blocked codes live on the action result, matching how `restartBusy`/
  `restartUnresponsive` already work today, only renamed to match the new
  vocabulary and no longer requiring a broadcast poll).
- Persisted recovery (unchanged behavior, smaller state to recover): absent state
  initializes Automatic on the served release; unsupported newer schema stays
  untouched, capability unavailable; malformed current recovers from LKG; no
  recoverable record keeps serving the running release with capability unavailable
  and never checks/prepares/activates. Startup reconciliation additionally: a
  `check`/`preparation` whose `startedAt` is older than a fixed staleness bound and
  still `running` resets to `failed`/`idle` (preserving `lastSuccessAt`); a stale
  `preparation.running` whose target's final cache is actually complete converts to
  `ready` instead of restarting; an expired `trial` rolls back exactly once and
  marks its target failed.
- Offline bootstrap: worker boot no longer needs `latest.json`. `loadCurrentRelease()`
  keeps using the build-embedded `/updates/releases/${__RELEASE_ID__}.json` (already
  independent of `latest.json`); `activate` and navigation serving only ever read
  `activeRelease`/`pinnedRelease` from persisted state and the Cache Storage final
  cache — neither depends on network. `latest.json` is fetched only by the explicit
  `CHECK_FOR_UPDATES` background operation.
- Publisher sequence (bugfix, not a redesign): `applyManagedStablePublish` currently
  reads only `updates/latest.json` for the previous sequence. Fix: scan every
  `updates/releases/*.json` descriptor in `workDir`, validate each, take the max
  `releaseSequence` found; if a descriptor with the same `releaseId` already exists,
  reuse its sequence (idempotent republish); otherwise allocate `max + 1`; reject if
  a different `releaseId` already owns that sequence or a descriptor/archive path
  collides with different bytes (existing `assertIdenticalOrMissing`, kept). This
  makes sequence monotonic across retained releases even if `latest.json` is later
  rolled back to an older pointer.
- Rejected (revision 2, additive to revision 1's rejected list): a persisted
  registered-stable-client table in IndexedDB (in-memory + handshake is sufficient
  and avoids another persistence/recovery surface); proactive continuous
  window-count broadcasting to compute `blockedByOtherWindows` ahead of a click
  (synchronous check-at-click matches existing UI pattern and is simpler); keeping
  `activationTransaction`-shaped fields "just in case" a future multi-window need
  reappears (YAGNI — the product decision in this task is final: single window only).
- Shared UI blast radius: none.
- Acceptance: see task acceptance criteria verbatim (not restated here); all must
  hold with zero multi-window transaction code remaining in the diff.
- Risks: SW-restart timing between the in-memory registration set emptying and a
  window's next message (bounded by existing per-mount/online/visibility hooks, not
  a new timer); trial expiry/rollback loop safety (one-shot, same guard as revision
  1's `rollbackExpiredActivation`, ported); offline pin restoration from archive;
  publisher scan performance on a large retained-release tree (bounded by existing
  Pages size limit, already walked elsewhere in the same module).
- Readiness: architecture decisions above are fixed by the task instructions
  (user-approved, verbatim in this conversation); no open product question remains.
  Blockers: none. Verdict: ready.

## Implementation preflight

- Authoring source: this handoff, task instructions, and the confirmed current
  implementation read in full (`contracts.ts`, `controller.ts`,
  `activationTransaction.ts`, `sw.ts`, `persistence.ts`, `releaseCache.ts`,
  `stateMachine.ts`, `stableClients.ts`, `publicContracts.ts`, `client.ts`,
  `commandQueue.ts`, the four feature composables, `entities/appUpdate`,
  `AppUpdatesPane.vue`, `appUpdateStatus.ts`, `stableRelease.mjs`,
  `managedStableFixture.mjs`, `artifactServer.mjs`,
  `tests/e2e/release/managedStableUpdates.spec.ts`).
- Owner map: unchanged from the handoff's Ownership bullet; worker/controller is
  runtime + recovery owner, publisher script is sequence/collision owner, pane/
  widget are presentation owners, `tests/e2e/release/*` is real-browser proof owner.
- Public entry points: `@shared/serviceClient/appUpdate` barrel (client + setup +
  public DTOs only), `@entity/appUpdate` (`useAppUpdate`), one composable per
  feature barrel. No change to which modules are public; `client.ts` stops
  importing `ControllerResponse` from `controller.ts` (defines its own private
  response type or imports it from a contract-only module, per
  `src/shared/service/AGENTS.md`).
- Reuse: `createCommandQueue`, `releaseCache.ts` (unchanged, cache/staging design
  already satisfies the required invariants), `persistence.ts`'s current/LKG
  transaction pattern (unchanged mechanism, smaller schema), `stableClients.ts`'s
  URL classification (kept, `/external/` prefix removed), `assertIdenticalOrMissing`
  in the publisher (kept), Playwright fixture server/config (kept, fixture data and
  a couple of scenarios revised).
- Minimum design vs. simpler alternative: a single boolean "update available" flag
  with no discriminated check/preparation record would be smaller but cannot
  represent "preparing vs. failed vs. ready for which target" without ad hoc extra
  fields — the discriminated-union state above is the minimum that keeps every
  running/ready/failed record self-naming its target, per the task's explicit
  requirement.
- Passes (independent domains, verify focused proof after each):
  1. Update this preflight (this pass).
  2. `contracts.ts` + `publicContracts.ts` rewrite (schema v3, discriminated
     check/preparation, `trial`, split descriptor/controller schema versions,
     new `AppUpdatePublicErrorCode`/`updateState` values).
  3. `stateMachine.ts` rewrite (initial state, migration v2→v3, `updateState`
     projector) + `stateMachine.test.ts`.
  4. `stableClients.ts` (drop `/external/`, add registration-set factory) +
     `stableClients.test.ts`.
  5. `controller.ts` rewrite (check/preparation/trial transitions, Update-now
     blocking, boot confirmation, startup reconciliation of stale
     check/preparation/trial) + `controller.test.ts` (replaces
     `activationTransaction.test.ts`, which is deleted).
  6. `persistence.ts` (schema-version constant only; store mechanics unchanged) +
     `persistence.test.ts` update.
  7. `sw.ts` rewrite (drop replacement mapping/URL token; registration handshake;
     clean-launch trial creation; single-window reload message).
  8. `client.ts` (own `ControllerResponse`-equivalent private type; drop restart
     URL-token handling; keep local VFS-readiness report, now answering one
     targeted query instead of a broadcast poll).
  9. `entities/appUpdate`, `widgets/SettingsSections/appUpdateStatus.ts`,
     `pages/AppUpdatesPane/AppUpdatesPane.vue` — consume `snapshot.updateState`
     instead of re-deriving `releaseSequence` comparisons in three places.
  10. `scripts/pages/lib/stableRelease.mjs` publisher-sequence fix +
      `stableRelease.test.mjs` new cases (rollback, republish-after-rollback,
      idempotent republish, duplicate-sequence collision).
  11. `managedStableFixture.mjs`/`artifactServer.mjs` fixture updates (drop
      `/external/` fixture path; keep A/B/C) + `managedStableUpdates.spec.ts`
      rewrite (replace scenario 10 with the single-window blocking scenario;
      replace scenario 13's `/external/` case with `/pr/`+`/branch/` only, already
      covered paths).
  12. Obsolete-code removal sweep + TSDoc audit on every touched public export.
  13. Focused verify per pass above; `pnpm verify:release`; final read-only
      `pnpm verify`.

```text
TEST IMPACT
Changed contracts: persisted controller schema (v2→v3) and its migration; worker
  command protocol version; public snapshot `updateState`/error-code vocabulary;
  stable-client registration; single-trial lifecycle and boot confirmation;
  publisher releaseSequence allocation; client/controller boundary type ownership.
Risks: stale-schema/migration mishandling losing a Manual pin; trial never
  clearing (reload/expiry loop); registration set undercount blocking Update Now
  incorrectly after SW restart; sequence collision or downgrade after a latest.json
  rollback; UI regressing "Checking for updates" feedback during a check.
Proof owners: sibling Vitest tests for contracts/stateMachine/stableClients/
  controller/persistence/releaseCache(unchanged)/client/entity/features/pane/
  widget; tests/e2e/release/managedStableUpdates.spec.ts + its fixture for real
  worker lifecycle; scripts/pages/lib/stableRelease.test.mjs for publisher.
Existing proof: contracts.test.ts, stateMachine.test.ts, stableClients.test.ts,
  persistence.test.ts, releaseCache.test.ts, commandQueue.test.ts,
  features/appUpdate*/*.test.ts, AppUpdatesPane.test.ts, SettingsSections.test.ts,
  SettingsPane.test.ts, scripts/pages/lib/stableRelease.test.mjs,
  scripts/release/artifactServer.test.mjs, scripts/release/buildArtifact.test.mjs,
  tests/e2e/release/managedStableUpdates.spec.ts, productionArtifactSmoke.spec.ts.
New or changed tests: contracts.test.ts (v3 shapes); stateMachine.test.ts
  (migration v2 record is NOT supported — only same-schema recovery is required
  going forward per this rewrite, confirm with an explicit "unsupported prior
  schema" case rather than silently upgrading revision-1 state); controller.test.ts
  (replaces activationTransaction.test.ts: single-trial exclusivity, mode-change
  during trial, repeated Update-now during trial, failed-trial cleanup+non-retry,
  newer-target-after-failed-older-target, stale check/preparation reconciliation,
  B-ready-then-C-latest reconciliation); stableClients.test.ts (registration set,
  no `/external/`); persistence.test.ts (unsupported schema, malformed+LKG
  unaffected by shape change); stableRelease.test.mjs (rollback scan, republish
  after rollback, idempotent republish, duplicate-sequence collision);
  managedStableUpdates.spec.ts (scenario 10 replaced with single-window Manual
  blocking + succeeds after the other window closes; scenario 13's `/external/`
  case dropped, branch/pr retained; all other scenario numbers keep their intent).
Repository impact metadata updates: none required beyond existing release-spec
  registration — no spec is added/moved/renamed, only rewritten in place.
Task-specific measurements: none new; existing A(seq1,1.0.0)/B(seq2,1.0.0)/
  C(seq3,1.1.0) fixture and the existing Pages size-limit check are reused for the
  publisher-sequence tests.
```

- Focused commands: `pnpm verify --only unit-tests --files <changed path>` after
  each of passes 2–10; `pnpm verify --only type-check` after passes 7–9.
- Final commands: `pnpm verify:release`, then final read-only `pnpm verify`. A red
  gate, a missing required browser scenario, or drift from this preflight keeps the
  task partial, not complete.

---

## Revision 1 (superseded — kept for record only, do not implement)

<details>
<summary>Original architecture handoff and implementation preflight for the multi-client activation-transaction design this revision replaces.</summary>

### Architecture handoff

- Goal: keep a persistent stable-only release-controller worker as the sole owner of immutable stable release selection, preparation, coordinated activation, recovery, and durable Automatic or Manual mode while exposing only factual UI-safe state.
- Confirmed evidence: this branch already selects stable content in a root `injectManifest` worker and publishes immutable archives, but `ReleaseControllerState`, commands, boot fields, cache candidates, and worker-client IDs cross public barrels; `CHECK` awaits preparation; preparation writes directly to the committed cache and deletes it on failure; invalid persistence resets to Automatic; activation compares old IDs with `resultingClientId`; and release E2E does not serve multiple releases.
- Non-goals: arbitrary historical selection or downgrade UI, post-success user rollback, historical archive deletion, branch/develop/PR managed updates, shared Material changes, or compatibility for the unmerged leaking API.
- Boundaries: change only stable artifact identity/publication, private release-controller infrastructure, private client transport/handshake, app-update FSD layers, stable-only Settings UI, release fixture/proof, and their impact metadata. Preserve branch/develop/PR build, Workbox, publication, cleanup, and routing behavior.
- Ownership: `shared/service/appUpdate` privately owns protocol, controller state/transitions, migrations/LKG persistence, cache staging/commit/cleanup, client filtering, activation transactions, boot recovery, and normalized errors; `shared/serviceClient/appUpdate` publicly owns the UI-safe client and privately owns registration, transport, running-release handshake, readiness, reload, boot confirmation, and snapshot broadcasts; `entities/appUpdate` owns read-only snapshot facts; separate features own check, mode change, apply, and Manual notification actions; pane/widget own copy and composition; `app` owns post-mount/router-ready setup; `scripts/pages` owns sequence allocation, archive collision, validation, size guard, and latest publication.
- Source of truth/state: a validated versioned controller record plus transactionally maintained last-known-good record in dedicated IndexedDB; immutable release descriptors and archives; publisher-allocated `releaseSequence` is the only ordering fact; SHA remains identity and SemVer/build metadata remain descriptive.
- Private/public split: `ReleaseControllerState`, persistence records, activation transaction, candidates, failed releases, cache names, client IDs, commands/messages, schemas/factories, and state-machine helpers remain private under `shared/service/appUpdate`. Public contracts are `AppReleaseInfo`, `AppUpdateSnapshot`, `AppUpdatePublicErrorCode`, `AppUpdateMode`, and an `AppUpdateClient` exposing only `getSnapshot`, `checkForUpdates`, `setMode`, `updateNow`, and `subscribeToSnapshot`.
- Minimum design: one serialized controller mutation queue, tokened check/preparation operations, one staging cache per attempt promoted only after complete validation, one persisted activation transaction with old-to-replacement mapping, one canonical stable-client predicate, and one projected public snapshot. Fewer concepts cannot meet stale-result, cache-safety, recovery, and multi-tab commit requirements; generic managers/providers/registries remain unnecessary.
- Multi-client activation: readiness covers only controlled stable app windows; persist transaction before reload; associate the old client to `resultingClientId` during navigation, preferring `replacesClientId` where the engine implements it and otherwise using a controller-issued transaction-scoped restart token validated against the persisted expected-client set; serve the trial to every expected replacement; commit only when every mapped replacement confirms the matching release; duplicate navigation/confirmation is idempotent; expiry rolls back once and marks the target failed. Automatic launch with no old stable clients creates a single-launch transaction on the next stable navigation. Chromium exposes but does not currently populate `replacesClientId`, so the private compatibility token is required for real-browser proof and is removed from the address bar after the private boot handshake.
- Persisted recovery: absent state initializes the currently served stable release in Automatic; supported schema migrates explicitly; unsupported newer schema remains untouched and yields unavailable capability; malformed current state restores validated LKG; no recoverable record keeps the served release running with unavailable capability and never selects latest; writes update current and LKG atomically so a Manual pin cannot silently disappear.
- Rejected: waiting-worker or `skipWaiting` release selection, UI-supplied running IDs or boot commands, timeout-bound downloads, direct final-cache writes, SemVer/SHA/date ordering, old-ID/new-ID comparison, first-boot commit, arbitrary navigation rollback, foreign-channel coordination, and parallel compatibility APIs.
- Shared UI blast radius: none; existing Material components are composed without modification.
- Acceptance: all task acceptance criteria, including forward-only same-SemVer releases, factual background states, active/pinned cache safety, stable-only coordination, all-client boot commit, one-shot rollback, offline pin restoration, truthful UI, narrow documented exports, immutable/idempotent publication, and no unrelated diff.
- Risks: worker migration/takeover, long async work and stale completion, partial/colliding content, IndexedDB corruption/unsupported schemas, cross-tab replacement identity, expiry/reload loops, offline archive recovery, foreign path interception, Pages retention/size, and UI action/state races.
- Required verification: deterministic unit tests own schemas, ordering, validation, transitions, staging, cleanup, persistence, filtering, projection, action contracts, and UI matrices; built-artifact Playwright release smoke owns worker migration and real multi-release/multi-window/restart/offline/recovery behavior; publication tests own allocation/collision/idempotency/size; final gates are `pnpm verify:release` followed by read-only `pnpm verify`.
- Forbidden: all task-listed forbidden approaches, public internal helpers, obsolete duplicate paths, blanket JSDoc disables, and changes to `scripts/agentEnvironment.test.mjs`.
- Readiness: the user-approved architecture resolves product and ownership decisions; inspected repository owners support the passes below; no shared component or new dependency is required. Blockers: none. Verdict: ready.

### Implementation preflight

- Authoring source: the approved task architecture and ready handoff above; repository evidence in the current branch, `docs/testing/architecture.md`, existing release scripts, worker/client code, and release Playwright configuration.
- Owner map: publisher allocates order and publishes only validated archives; controller owns lifecycle/data/recovery; service client owns browser transport/private handshake; entity owns read-only facts; four narrow features own distinct intents; pane/widget own presentation; app owns startup sequencing; release-smoke owns built browser lifecycle proof.
- Public entry points: `@shared/serviceClient/appUpdate` exports documented DTOs/client/setup only; `@entity/appUpdate` exports read-only snapshot facts; each feature barrel exports one documented action composable; pane/widget consume those barrels. `@shared/service` and `shared/service/appUpdate/index.ts` export no controller implementation, protocol, persistence, cache, or state-machine symbols.
- Reuse: deployment metadata, stable `injectManifest` build, Pages staging/publish functions, Zod, native IndexedDB/Cache Storage/Web Crypto, VFS readiness, existing Settings/pane/navigation/snackbar composition, release artifact server, and Playwright persistent contexts. Replace rather than parallel the branch-introduced controller path.
- Release ordering/validation: `releaseSequence` is present and equal across identity, latest pointer, descriptor, persisted facts, and snapshot DTO. Publication reads and validates current latest; new SHA gets `previous + 1`; identical republish preserves sequence; any descriptor/archive collision fails. Candidate eligibility is strictly `latest.sequence > running.sequence`. Metadata validation checks supported schemas, complete identity equality, canonical descriptor/index URLs, exactly one index, unique same-origin allowed absolute file paths without traversal/query/fragment/foreign channel aliases, and every byte length/hash before confirming latest.
- Cache/persistence: preparation fetches into unique staging, validates everything, then commits a new immutable final cache without touching any valid cache; failure removes staging only. Cleanup protects active, pin, previous, prepared, failed-boot recovery, and in-flight transaction releases. Current/LKG persistence is one transaction; recovery never silently changes Manual mode.
- Background observation: commands acknowledge after durable operation-start state; serialized tokened background work publishes snapshots on start/completion; stale check/preparation completions cannot override newer operations or mode changes; the transport timeout detects controller absence only.
- Passes: (1) update this preflight; (2) private/public contracts; (3) sequence publisher and metadata validation; (4) staging and persistence; (5) background controller/projection; (6) stable filtering and activation transaction; (7) private handshake; (8) entity/four features; (9) Settings/pane; (10) multi-release fixture/scenarios; (11) obsolete/unrelated removal and export/TSDoc audit; (12) focused, release, and final verification. Run focused verify-managed proof after passes 3, 4, 6, 9, and 10.
- Simpler alternative: a single awaited check/download and navigation boolean is smaller but fails the explicit timeout, stale-result, cache-safety, and multi-tab transaction requirements; the design above is the minimum complete lifecycle model.

```text
TEST IMPACT
Changed contracts: stable identity/order and publication; latest/descriptor/file validation; controller persistence/cache/background/activation/recovery; stable client routing and private handshake; public snapshot/client API; FSD action ownership; Settings factual status and pane matrix; built stable worker migration and multi-release lifecycle.
Risks: sequence collision or downgrade; metadata alias/traversal; partial cache damage; lost Manual pin; stale async completion; branch/PR participation; incomplete multi-tab commit; boot/reload loop; offline pin loss; misleading UI; release archive growth.
Proof owners: sibling Vitest tests for publisher, validation, ordering, state transitions, cache adapter, persistence adapter, filtering, activation mapping, projection, client, entity, features, and components; tests/e2e/release/managedStableUpdates.spec.ts plus its deterministic fixture for real built-worker lifecycle; productionArtifactSmoke.spec.ts for stable artifact basics.
Existing proof: scripts/pages/lib/stableRelease.test.mjs; scripts/pages/lib/pagesFs.test.mjs; config/plugins/pwa.test.ts; scripts/release/buildArtifact.test.mjs; SettingsPane.test.ts; SettingsSections.test.ts; AppUpdatesPane.test.ts; tests/e2e/release/productionArtifactSmoke.spec.ts.
New or changed tests: contracts.test.ts (complete relationships/forward order/projection); stableRelease.test.mjs (sequence allocation, idempotency, collision, size/pointer ordering); releaseCache.test.ts (staging commit/failure/repeat/protected cleanup); persistence.test.ts (absent, prior migration, unsupported, malformed+LKG, write failure/manual pin); controller.test.ts (background transitions, dedupe, stale tokens, equal/stale latest); stableClients.test.ts; activationTransaction.test.ts; service-client tests for ack/subscription/private boot; separate feature tests; SettingsSections.test.ts compact status; AppUpdatesPane.test.ts factual mode/status matrix; managedStableUpdates.spec.ts covering required scenarios 1-20 against releases A/B/C.
Repository impact metadata updates: register the changed release spec and fixture in the release source-to-check mapping and release command configuration; update verifier tests for exact managed-stable release-smoke selection; update app E2E registry only if any scenario is moved into the app lane. Spec paths are never source prefixes.
Task-specific measurements: projected complete Pages staging tree including retained stable/branch/PR content <= 943718400 bytes before publication; SHA-256 and byte count for every descriptor file; deterministic A(seq1,1.0.0), B(seq2,1.0.0), C(seq3,1.1.0) fixture.
```

- Focused commands: use `pnpm verify --only unit-tests --files <pass paths>`, `pnpm verify --only type-check`, and supported `pnpm verify --full --only artifact` / `pnpm verify --full --only release-smoke`; inspect `pnpm verify:status` before expensive runs.
- Final commands: `pnpm verify:release`, then final read-only `pnpm verify`. Any missing required browser scenario, stale impact mapping, red gate, or divergence from this preflight keeps the task partial.

</details>
