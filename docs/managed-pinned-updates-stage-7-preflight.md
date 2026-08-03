# Managed pinned updates — Stage 7 proof preflight

**Status: ready. Production architecture changes are not expected.**

Authoring sources: [`managed-pinned-updates.md`](./managed-pinned-updates.md) and [`managed-pinned-updates-implementation-preflight.md`](./managed-pinned-updates-implementation-preflight.md).

## Scope

- Verification owns this stage; publisher, worker, client, entity, feature, widget, and page contracts remain unchanged.
- Reuse the existing managed-release fixture, product E2E helpers, current release specs, and repository verification lanes.
- Extend existing specs only. Do not add another update manager, fixture system, protocol path, or parallel E2E suite.
- The existing proof already owns publication idempotency/retained-tree rejection, Workbox migration, interrupted-install retry, reconciliation races, Manual/Automatic behavior, clean launch, rollback, exact restoration, controlled `503`, isolation, uncontrolled windows, controller upgrades, UI projection, and cross-engine lifecycle.

## Missing proof

1. `managedUpdatesMigration.spec.ts`: a valid but boot-broken first managed release must not permanently strand the channel. A later corrected release must be discovered and prepared from owned navigations while application JavaScript remains broken, then activate on the next qualifying clean launch. Rollback to Workbox remains unsupported.
2. `managedUpdatesActivationUi.spec.ts`: while release B is `activating` and `BOOT_OK` is deliberately gated, use the real product UI to write durable user data, report matching `BOOT_FAILED`, allow the real rollback broadcast to reload release A, and prove release A can read the data written by B.

The data-compatibility scenario owns compatibility evidence only; the existing lifecycle suite remains the primary rollback-mechanics owner.

## Minimum design

The simpler sufficient solution is two scenarios added to their existing owners. No production edits, new Playwright file, new browser project, persisted test hook, data migration, or generalized helper is justified. Extract a test helper only when the second real consumer makes the existing local helper unsuitable.

## Acceptance

- Broken release 1 remains the persisted managed baseline and never falls back to Workbox or live deployment bytes.
- Navigation reconciliation works without application JavaScript and prepares a strictly newer corrected release.
- The corrected release activates and commits through the existing clean-launch and watchdog paths.
- During B activation, A remains the persisted active release while B writes real application data through existing UI helpers.
- Matching `BOOT_FAILED` uses the existing worker protocol and rollback broadcast; no direct controller-state rewrite simulates rollback.
- After reload into A, the B-written document/property/item is readable through the real UI.
- Existing proof owners and source-to-spec mappings remain valid; update impact metadata only if durable ownership actually changes.

## TEST IMPACT

Changed contracts: none; two missing acceptance proofs are added.
Risks: first-managed recovery without app JS; user-data readability across an activating-candidate rollback.
Proof owners: `tests/e2e/release/managedUpdatesMigration.spec.ts`, `tests/e2e/release/managedUpdatesActivationUi.spec.ts`.
Existing proof: current unit, mutation, release, lifecycle, isolation, and cross-engine suites.
New or changed tests: extend the two existing specs; fixture/helper edits only when required by those scenarios.
Repository impact metadata updates: none expected because no spec ownership changes.
Verification: focused managed-update E2E, then `pnpm verify --full --only managed-updates`, then the single final gate `pnpm verify:release`.
