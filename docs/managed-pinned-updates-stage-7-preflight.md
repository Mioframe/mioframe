# Managed pinned updates — Stage 7 proof preflight

**Status: correction required before final verification. Production architecture changes are not expected.**

Authoring sources: [`managed-pinned-updates.md`](./managed-pinned-updates.md) and [`managed-pinned-updates-implementation-preflight.md`](./managed-pinned-updates-implementation-preflight.md).

## Scope

- Verification owns this stage; publisher, worker, client, entity, feature, widget, and page contracts remain unchanged.
- Reuse the existing managed-release fixture, product E2E helpers, current release specs, and repository verification lanes.
- Extend existing specs only. Do not add another update manager, fixture system, protocol path, or parallel E2E suite.
- The existing proof already owns publication idempotency/retained-tree rejection, Workbox migration, interrupted-install retry, reconciliation races, Manual/Automatic behavior, clean launch, rollback, exact restoration, controlled `503`, isolation, uncontrolled windows, controller upgrades, UI projection, and cross-engine lifecycle.

## Missing proof

1. `managedUpdatesMigration.spec.ts`: a valid but boot-broken first managed release must not permanently strand the channel. A later corrected release must be discovered and prepared from owned navigations while application JavaScript remains broken, then activate on the next qualifying clean launch. Rollback to Workbox remains unsupported.
2. `managedUpdatesActivationUi.spec.ts`: while release B is `activating` and `BOOT_OK` is deliberately gated, use the real product UI to write durable user data, report matching `BOOT_FAILED`, allow the real rollback broadcast to reload release A, and prove release A can read the data written by B.

The scenarios are now implemented and pass repeatedly. The data-compatibility proof still requires an explicit post-rollback assertion for the created property, in addition to the document and item.

## Verification stability correction

Six consecutive complete single-container managed-update runs kept both new scenarios green while a rotating subset of existing release specs failed under the canonical `2 CPU / 6 GB / 1 worker` profile. Because the required Stage 7 scenarios increased the owning lane's total workload, those failures cannot be classified as unrelated merely from the changed-file list.

Keep the canonical resource profile and existing Playwright retries. Preserve the public `managed-updates` verify label and exact final commands, but execute its unchanged spec corpus in two sequential fresh container sessions:

1. lifecycle group: lifecycle, Automatic check, uncontrolled-window, and activation-UI specs;
2. migration/isolation group: develop, migration, controller-upgrade, and cross-engine specs.

The sessions must never run in parallel. A failure in the first session stops the second. The aggregate `managed-updates` result passes only when both sessions pass. Do not increase resources, skip tests, narrow projects, or add retries to hide failures.

## Minimum design

The minimum complete correction is the explicit property assertion plus one small release-proof runner that owns the two fixed sequential groups. Reuse `e2eReleaseContainer.mjs` for each group and keep `verify.mjs` as the aggregate command owner. Do not add a second fixture system, generalized test scheduler, or new Playwright project.

## Acceptance

- Broken release 1 remains the persisted managed baseline and never falls back to Workbox or live deployment bytes.
- Navigation reconciliation works without application JavaScript and prepares a strictly newer corrected release.
- The corrected release activates and commits through the existing clean-launch and watchdog paths.
- During B activation, A remains the persisted active release while B writes real application data through existing UI helpers.
- Matching `BOOT_FAILED` uses the existing worker protocol and rollback broadcast; no direct controller-state rewrite simulates rollback.
- After reload into A, the B-written document, property, and item are each asserted through the real UI.
- The full managed-update corpus passes through two sequential fresh containers under the unchanged canonical profile.
- `pnpm verify --full --only managed-updates` remains the public focused proof command.
- `pnpm verify:release` remains the single final completion gate.

## TEST IMPACT

Changed contracts: managed-update proof orchestration only; production contracts remain unchanged.
Risks: first-managed recovery without app JS; user-data readability across rollback; cumulative release-suite container pressure.
Proof owners: the two existing Stage 7 specs plus the managed-update aggregate runner and verify command-planning tests.
Existing proof: current unit, mutation, release, lifecycle, isolation, and cross-engine suites.
New or changed tests: explicit property assertion; aggregate runner group/ordering/failure-stop tests; verify command and timeout planning tests.
Repository impact metadata updates: none expected because no spec ownership changes.
Verification: focused tooling/unit proof, `pnpm verify --full --only managed-updates`, then the single final gate `pnpm verify:release`.
