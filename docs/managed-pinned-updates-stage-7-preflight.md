# Managed pinned updates — Stage 7 proof preflight

**Status: final proof correction required. Production architecture changes are not expected.**

Authoring sources: [`managed-pinned-updates.md`](./managed-pinned-updates.md) and [`managed-pinned-updates-implementation-preflight.md`](./managed-pinned-updates-implementation-preflight.md).

## Scope

- Verification owns this stage; publisher, worker, client, entity, feature, widget, and page contracts remain unchanged.
- Reuse the existing managed-release fixture, product E2E helpers, current release specs, and repository verification lanes.
- Keep one public `managed-updates` label and sequential fail-stop execution.
- Do not add another update manager, production test hook, fixture system, protocol path, browser project, retry, or parallel E2E lane.

## Stage 7 scenarios

The two missing acceptance scenarios are implemented:

1. `managedUpdatesMigration.spec.ts` proves recovery from a boot-broken first managed release through navigation reconciliation and a later corrected release.
2. `managedUpdatesActivationUi.spec.ts` proves that the previous release reads the document, property, and item written by an activating candidate after real worker rollback.

The lifecycle and develop shared-state suites now use serial retry semantics. The temporary Automatic preparation failure now uses deterministic corruption and exact restoration of the release-specific published entry file rather than Playwright request interception.

These corrections are accepted.

## Current verification findings

The lifecycle container is now stable. The remaining failures are concentrated in the current migration/isolation container:

- `managedUpdatesCrossEngineLifecycle.spec.ts` runs only on Firefox and WebKit, shares one `BrowserContext` and one sequential release chain across two dependent tests, but does not yet declare serial semantics;
- `managedUpdatesControllerUpgrade.spec.ts` closes the last old-controller page and immediately opens another scoped page. The new page can race browser promotion of the waiting worker and become a new client that keeps the old controller alive. Waiting only for `registration.waiting == null` after that page is opened does not prove which controller code controls it;
- the Firefox/WebKit proof has a different engine and resource lifecycle from the Chromium migration corpus and should not share its long-lived container budget.

These are proof-orchestration/test-observation defects. They do not require production changes or larger container resources.

## Final verification isolation

Keep the exact eight-spec corpus, but execute it in three sequential fresh container sessions under the unchanged canonical `2 CPU / 6 GB / 1 worker` profile:

1. lifecycle group:
   - lifecycle;
   - Automatic check;
   - uncontrolled window;
   - activation UI;
2. migration/isolation Chromium group:
   - controller upgrade;
   - develop isolation;
   - Workbox migration;
3. cross-engine group:
   - cross-engine lifecycle only; its existing Playwright project selection continues to run Firefox and WebKit and exclude Chromium.

The sessions must never run in parallel. Failure or termination of an earlier group stops every later group. The aggregate passes only when all three groups pass. The public verify label and spec corpus remain unchanged.

## Final test corrections

### Cross-engine lifecycle

- Configure the shared-state describe block with `mode: 'serial'` and its existing 240-second timeout.
- A retry must replay the complete A → B → C → D → broken E sequence in a fresh worker for the failing browser project.
- Keep the existing Firefox/WebKit project ownership and browser-neutral product assertions.

### Controller-code upgrade

- Preserve the browser-native waiting-worker lifecycle; do not call `skipWaiting()` or `clients.claim()`.
- Make the test-only worker mutation expose a unique runtime revision marker and return that marker to the test.
- Start observing the byte-different service worker before calling `registration.update()`.
- After the new worker reaches `waiting`, close the last page controlled by the old worker.
- Wait, without opening another scoped page, until the observed new worker is the activated registration worker and exposes the expected revision marker.
- Only then open `pageAfterUpgrade` and continue the existing application-release assertions.

This proves actual controller-code promotion and removes the test-created client race.

## Minimum design

The minimum complete correction is:

- one third fixed aggregate group for the existing cross-engine spec;
- serial semantics for the existing cross-engine shared-state suite;
- an observable test-only controller revision and a wait for its activation before opening the next page;
- aggregate timeout derived from exactly three existing Playwright container budgets;
- no production or resource-profile changes.

## Acceptance

- All Stage 7 scenarios and explicit data assertions remain intact.
- The exact eight-spec managed-update corpus remains covered once each.
- Three fresh containers run sequentially and fail-stop.
- Chromium migration/controller proof is isolated from Firefox/WebKit proof.
- Stateful lifecycle, develop, and cross-engine retries replay their complete scenario sequences.
- Controller upgrade proves the mutated worker itself becomes active before a new page is opened.
- No page opened by the test can block waiting-worker promotion.
- Container resources, Playwright projects, workers, and retries remain unchanged.
- `pnpm verify --full --only managed-updates` passes without flaky classification.
- `pnpm verify:release` passes as the single final completion gate.

## TEST IMPACT

Changed contracts: managed-update proof orchestration and controller-upgrade observation only; production contracts remain unchanged.
Risks: cross-engine shared-state retry validity; cumulative multi-engine container lifetime; waiting-worker promotion race.
Proof owners: existing managed-update specs, managed-update aggregate runner, fixture mutation helper, and verify command-planning tests.
New or changed tests: third aggregate group composition/fail-stop proof; cross-engine serial declaration; observable controller revision and activation wait; aggregate timeout planning.
Repository impact metadata updates: none expected because spec ownership and corpus remain unchanged.
Verification: focused static/unit proof, `pnpm verify --full --only managed-updates`, then the single final gate `pnpm verify:release`.
