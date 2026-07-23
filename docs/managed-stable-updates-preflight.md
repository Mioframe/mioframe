# Managed stable updates preflight

## Architecture handoff

- Goal: make `main` stable releases immutable and let a permanent root service worker select a validated release in Automatic or Manual mode.
- Evidence: stable currently uses `vite-plugin-pwa` `generateSW`; `applyStablePublish` replaces stable root content; deployment metadata already owns the full source SHA; VFS activity is exposed by `useVfsActivity`.
- Non-goals: branch/develop/PR behavior, arbitrary version selection, downgrade UI, post-success rollback, shared Material changes, historical release deletion.
- Boundaries: stable-only build, root publication, release-controller infrastructure, typed app-update layers, Settings route/pane, release/browser proof and docs. Preserve `/branch/**`, `/pr/**`, their workers, caches, publication, tombstones, and cleanup.
- Ownership: `shared/service/appUpdate` owns schemas, state machine, IndexedDB/cache/runtime/protocol/errors; `shared/serviceClient/appUpdate` owns registration, messaging, readiness and boot reporting; `entities/appUpdate` owns reactive facts; `features/appUpdate` owns actions/snackbar; `pages/AppUpdatesPane` and `widgets/SettingsSections` compose stable-only UI; `app` owns startup; `scripts/pages` owns publication.
- Source of truth/state: validated versioned controller state in a dedicated IndexedDB store; immutable descriptors and `latest.json`; full SHA is release identity and SemVer remains display metadata.
- Public entries: `@shared/service/appUpdate` contracts, `@shared/serviceClient/appUpdate` client/setup, `@entity/appUpdate` facts, `@feature/appUpdate` actions/notification, and the pane/widget barrels only.
- Minimum design: one serial controller command queue, one state record, per-release validated caches, one `MessageChannel` protocol, and one stable-only UI read model. This is smaller than a manager/provider/registry and maps directly to the required lifecycle boundaries.
- Rejected: waiting-worker selection, `skipWaiting` application activation, SemVer selection, local-settings persistence, runtime-cache metadata, forced reload, branch participation, generic provider framework.
- Shared UI blast radius: none; reuse existing AppBar, Pane, List, ListItem, Switch, Button, typography and snackbar hosts.
- Acceptance: migration/first load; factual checks; Automatic safe launch; Manual pin; complete preparation; multi-client readiness/VFS blocking; atomic trial activation; boot confirmation/rollback/failed-loop guard; offline/deep-link/foreign-path behavior; immutable/idempotent publication; collision/ordering/900 MiB guard; stable-only accessible UI.
- Risks: service-worker takeover and old-client preservation; cross-tab races/timeouts; IndexedDB migration/corruption; partial/hash-invalid downloads; boot loops; offline pin recovery; Pages retention/collision/atomic pointer; stable/branch isolation; accessible routing/actions and truthful errors.
- Verification: focused unit proof after passes 1-3, focused type-check/browser proof after passes 4-6, full release proof after pass 7, then `pnpm verify:release` and final read-only `pnpm verify`.
- Forbidden: all task-listed forbidden approaches and parallel obsolete stable update paths.
- Readiness: approved user architecture supplies all product decisions; current repository owners and platform APIs support it; no new dependency or shared component change is required. Blockers: none. Verdict: ready.

## Implementation preflight

- Authoring source: the approved architecture in the task plus the ready handoff above; current `vite-plugin-pwa` documentation confirms stable can use `injectManifest` with no Workbox injection while branch retains `generateSW`.
- Owner map/public entries: as above; infrastructure errors are normalized at `shared/service/appUpdate`, UI receives discriminated outcomes only.
- Reuse: deployment metadata SHA/build facts, `applyStablePublish`, existing build artifact/server, Vite PWA manifest/assets generation, Zod, `idb-keyval` only where its fixed database contract suffices (otherwise native IndexedDB), Cache Storage/Web Crypto, `useVfsActivity`, stack navigation, Settings components, global snackbar host.
- Minimum design comparison: channel-select the existing PWA plugin config and add one protocol/state machine. A second worker selector or UI-owned orchestration adds state and is rejected.
- Acceptance matrix: happy = migrate/check/prepare/safe activate/confirm; boundary = same SemVer/new SHA, offline cached pin, deep link, foreign channel; failure = metadata/hash/storage/capability/boot; cancellation = switch to Manual cancels eligibility; conflict = serialized commands and busy/unresponsive clients; recovery = previous release on unconfirmed trial.
- Risk matrix: unit owns validation/transitions/serialization/cache protection; release tests own artifact/publish/size/branch isolation; real browser owns worker lifecycle/multi-tab/offline/recovery; component tests own status/action/a11y/stable visibility.
- Passes: (1) schemas/state red-green; (2) artifact/publisher; (3) worker runtime; (4) client/startup; (5) entity/features; (6) UI; (7) multi-release release-smoke; (8) docs/version/obsolete cleanup/final gates.

```text
TEST IMPACT
Changed contracts: stable artifact layout and publication; stable service-worker lifecycle/state/protocol/cache routing; startup boot confirmation/readiness; app-update facts/actions; Settings route/UI; stable-vs-branch build behavior.
Risks: migration, partial content, hash collision, command race, mixed-version tabs, active writes, offline checks, boot loops, deep links, foreign-path interception, misleading UI, artifact growth.
Proof owners: sibling Vitest tests for schemas/state/runtime/client/entity/features/components/scripts; tests/e2e/release/managedStableUpdates.spec.ts for built multi-release browser behavior; existing productionArtifactSmoke.spec.ts for artifact basics.
Existing proof: config/plugins/pwa.test.ts; scripts/pages/lib/pagesFs.test.mjs; scripts/pages/publishStable.test.mjs; tests/e2e/release/productionArtifactSmoke.spec.ts; SettingsPane.test.ts; SettingsSections.test.ts.
New or changed tests: shared/service/appUpdate/*.test.ts; shared/serviceClient/appUpdate/*.test.ts; entities/appUpdate/*.test.ts; features/appUpdate/*.test.ts; pages/AppUpdatesPane/*.test.ts; Settings tests; publication/descriptor/size tests; tests/e2e/release/managedStableUpdates.spec.ts.
Repository impact metadata updates: register the new app E2E scenario against app-update production/fixture paths in scripts/lib/e2eRisk.mjs if it runs in the app lane; release-only managedStableUpdates.spec.ts remains owned by the full release lane and release command configuration, with verifier tests updated for its explicit invocation.
Task-specific measurements: complete staged Pages tree byte total including retained stable, branch and PR files must be <= 943718400 bytes before mutation/commit; hash every descriptor-required file with SHA-256.
```

- Focused verification: `pnpm verify --only unit-tests --files ...`, `pnpm verify --only type-check`, and verify-managed E2E where supported; release artifact/browser checks through `pnpm verify --full --only artifact` and `pnpm verify --full --only release-smoke`.
- Final verification: `pnpm verify:release`, then read-only `pnpm verify`.
