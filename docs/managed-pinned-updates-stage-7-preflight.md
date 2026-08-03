# Managed pinned updates — Stage 7 proof preflight

**Status: final proof correction required. Production architecture changes are not expected.**

Authoring sources: [`managed-pinned-updates.md`](./managed-pinned-updates.md) and [`managed-pinned-updates-implementation-preflight.md`](./managed-pinned-updates-implementation-preflight.md).

## Scope

- Verification owns this stage; publisher, worker, client, entity, feature, widget, and page contracts remain unchanged.
- Reuse the existing managed-release fixture, product E2E helpers, current release specs, and repository verification lanes.
- Extend existing specs only. Do not add another update manager, fixture system, protocol path, or parallel E2E suite.
- The existing proof already owns publication idempotency/retained-tree rejection, Workbox migration, interrupted-install retry, reconciliation races, Manual/Automatic behavior, clean launch, rollback, exact restoration, controlled `503`, isolation, uncontrolled windows, controller upgrades, UI projection, and cross-engine lifecycle.

## Stage 7 scenarios

1. `managedUpdatesMigration.spec.ts`: a valid but boot-broken first managed release must not permanently strand the channel. A later corrected release must be discovered and prepared from owned navigations while application JavaScript remains broken, then activate on the next qualifying clean launch. Rollback to Workbox remains unsupported.
2. `managedUpdatesActivationUi.spec.ts`: while release B is `activating` and `BOOT_OK` is deliberately gated, use the real product UI to write durable user data, report matching `BOOT_FAILED`, allow the real rollback broadcast to reload release A, and prove release A can read the document, property, and item written by B.

Both scenarios and the explicit post-rollback property assertion are implemented.

## Verification isolation

The unchanged eight-spec corpus now runs as two sequential fresh container sessions under the canonical `2 CPU / 6 GB / 1 worker` profile:

1. lifecycle group: lifecycle, Automatic check, uncontrolled-window, and activation-UI specs;
2. migration/isolation group: develop, migration, controller-upgrade, and cross-engine specs.

The sessions never run in parallel. A failure in the first session stops the second. The aggregate `managed-updates` result passes only when both sessions pass. Resources, projects, retries, and the public verify label remain unchanged.

## Remaining proof defect

The lifecycle and develop specs intentionally share one `BrowserContext` and persisted controller state across ordered tests. They are stateful scenario sequences, not independent tests. Their describe blocks therefore must use Playwright serial semantics so a retry reruns the complete sequence in a fresh worker instead of retrying one dependent test against only `beforeAll` state.

The final lifecycle test currently injects a temporary preparation failure through `BrowserContext.route()` and a service-worker request abort. That interception is not the contract under test and introduces a network-abort race. Replace it with deterministic mutation of the test-only published artifact bytes: save the selected unique asset, write invalid bytes before the first Check, prove the hash/size validation failure leaves the candidate `available`, restore the exact bytes, then prove the later Check prepares the same release to `ready`.

Apply the same serial declaration to the develop shared-state suite so its retries also preserve the scenario contract. Do not add retries, sleeps, resources, test hooks in production, or another runner split.

## Minimum design

The minimum complete correction is:

- serial retry semantics for the two existing shared-state describe blocks;
- deterministic test-artifact corruption/restoration for the temporary Automatic preparation failure;
- no production changes and no further verification infrastructure.

## Acceptance

- Broken release 1 remains the persisted managed baseline and never falls back to Workbox or live deployment bytes.
- Navigation reconciliation works without application JavaScript and prepares a strictly newer corrected release.
- The corrected release activates and commits through the existing clean-launch and watchdog paths.
- During B activation, A remains the persisted active release while B writes real application data through existing UI helpers.
- Matching `BOOT_FAILED` uses the existing worker protocol and rollback broadcast; no direct controller-state rewrite simulates rollback.
- After reload into A, the B-written document, property, and item are each asserted through the real UI.
- The full managed-update corpus passes through two sequential fresh containers under the unchanged canonical profile.
- Stateful suite retries replay the complete lifecycle/isolation sequence.
- The temporary preparation failure is deterministic and exercises real fetch/byte-size/hash validation without Playwright request interception.
- `pnpm verify --full --only managed-updates` remains the public focused proof command.
- `pnpm verify:release` remains the single final completion gate.

## TEST IMPACT

Changed contracts: managed-update proof orchestration and retry semantics only; production contracts remain unchanged.
Risks: first-managed recovery without app JS; user-data readability across rollback; cumulative release-suite pressure; invalid retries of shared-state suites; non-deterministic network-abort injection.
Proof owners: the existing Stage 7 specs, lifecycle/develop stateful suites, aggregate runner, and verify command-planning tests.
Existing proof: current unit, mutation, release, lifecycle, isolation, and cross-engine suites.
New or changed tests: serial suite declarations; deterministic temporary artifact corruption/restoration; existing aggregate runner tests.
Repository impact metadata updates: none expected because no spec ownership changes.
Verification: focused static proof, `pnpm verify --full --only managed-updates`, then the single final gate `pnpm verify:release`.
