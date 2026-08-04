# Managed pinned updates — Stage 7 proof preflight

**Status: Stage 7 scenario architecture is accepted, but final proof is blocked by post-review publisher, state-transition, capability, fetch-path, and watchdog corrections.**

Authoring sources: [`managed-pinned-updates.md`](./managed-pinned-updates.md) and [`managed-pinned-updates-implementation-preflight.md`](./managed-pinned-updates-implementation-preflight.md).

## Scope

- Verification owns this stage; publisher, worker, client, entity, feature, widget, and page contracts remain unchanged unless a complete-PR review finds a violation of an earlier accepted contract.
- Reuse the existing managed-release fixture, product E2E helpers, current release specs, and repository verification lanes.
- Keep one public `managed-updates` label and sequential fail-stop execution.
- Do not add another update manager, production test hook, fixture system, protocol path, browser project, retry, or parallel E2E lane.

## Completed Stage 7 scenarios

1. `managedUpdatesMigration.spec.ts` proves recovery from a boot-broken first managed release through navigation reconciliation and a later corrected release.
2. `managedUpdatesActivationUi.spec.ts` proves that the previous release reads the document, property, and item written by an activating candidate after real worker rollback.
3. Lifecycle, develop, and cross-engine shared-state suites use serial retry semantics, so a retry replays the complete dependent sequence.
4. Temporary Automatic preparation failure uses deterministic corruption and exact restoration of the release-specific published entry file rather than Playwright request interception.
5. Controller-code upgrade observes the byte-mutated worker before update, closes the old client, proves that exact worker becomes active, and only then opens the next scoped page.
6. The exact eight-spec corpus runs in three sequential fresh containers: Chromium lifecycle, Chromium migration/isolation, and Firefox/WebKit cross-engine.
7. Mode-change-dependent scenarios use explicit protocol synchronization barriers before publishing a release whose discovery must belong to a later trigger.
8. Release Playwright keeps two diagnostic CI retries but enables `failOnFlakyTests`, so a retry-pass cannot make the managed-update or final release gate green.

These Stage 7 proof-ownership corrections remain accepted.

## Portable clean-launch contract

The user contract is the next safe application start after every same-channel window closes.

- Another controlled or uncontrolled same-channel window blocks activation.
- Closing all same-channel windows and opening the application again qualifies on Chromium, Firefox, and WebKit.
- A sole-window reload may also qualify where the browser exposes sufficient navigation identities, but identical reload classification is not a cross-engine requirement.
- Reload and close/reopen are equivalent user-level restart actions; production code must not add browser-specific reload classification.

The cross-engine proof therefore requires the portable close-all-windows → next-safe-start path. It does not require every browser engine to classify a same-window reload identically.

## Verification isolation

The exact eight-spec corpus executes in three sequential fresh container sessions under the unchanged canonical `2 CPU / 6 GB / 1 worker` profile:

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
   - cross-engine lifecycle only; Playwright project selection runs Firefox and WebKit and excludes Chromium.

The sessions never run in parallel. Failure or termination of an earlier group stops every later group. The aggregate passes only when all three groups pass. The public verify label and spec corpus remain unchanged.

## Post-review blockers before final proof

Complete-PR review found earlier-stage contract violations that invalidate current-head final verification until corrected:

1. retained publication validation proves descriptor structure and archive presence but does not verify the actual archived index and retained asset bytes against descriptor sizes and SHA-256 values;
2. Automatic and Manual long-running preparation completion validates only `releaseNumber`, not the complete `ReleaseSummary` identity required by the canonical contract;
3. the application client treats any controlling service worker as managed-update capability, so legacy Workbox and unmanaged branch controllers remain interactive until long request timeouts;
4. Automatic preparation failure is swallowed instead of being returned as a classified reconciliation result;
5. the owned asset fetch path enumerates the complete release cache before every asset response, creating avoidable repeated full-cache scans;
6. the injected watchdog transport does not fail closed on synchronous `MessageChannel` or `postMessage` errors.

These findings do not require a new manager, persisted operation state, browser-specific lifecycle logic, or a redesign of the one-active/one-candidate state model. They require localized contract corrections and regression proof.

## Current final verification state

Strict release flaky gating is implemented and has focused configuration proof. Final verification must not run until the post-review blockers are corrected and the branch is synchronized with current `develop`.

Then, on one resulting head:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

Both commands must pass without flaky classification. A retry may collect diagnostics, but any flaky classification fails the gate.

## Acceptance

- All Stage 7 scenarios and explicit data assertions remain intact.
- The exact eight-spec managed-update corpus remains covered once each.
- Three fresh containers run sequentially and fail-stop.
- Chromium migration/controller proof is isolated from Firefox/WebKit proof.
- Stateful lifecycle, develop, and cross-engine retries replay their complete scenario sequences.
- Controller upgrade proves the mutated worker itself becomes active before a new page is opened.
- The portable next-safe-start contract passes on Chromium, Firefox, and WebKit.
- Container resources, Playwright projects, workers, and retry counts remain unchanged.
- Retained release bytes are verified before allocation or any publication write.
- Long preparation completion requires the complete target identity.
- Only a confirmed same-channel managed controller exposes update capability.
- Automatic preparation failure is classified without persisted error state.
- Owned asset serving performs no complete cache enumeration per asset request.
- Watchdog transport failures cannot latch boot reporting or escape as unhandled rejections.
- A retry is diagnostic evidence and causes the release run to fail as flaky.
- `pnpm verify --full --only managed-updates` passes without flaky classification.
- `pnpm verify:release` passes as the single final completion gate.

## TEST IMPACT

Changed contracts: managed-update proof orchestration, controller-upgrade observation, portable cross-engine safe-start behavior, synchronization of deferred reconciliation in tests, strict release flaky gating, retained archive integrity, complete preparation identity, managed-controller capability, request-path cache validation, and watchdog transport failure handling.
Risks: publishing over an unrecoverable retained release; approving a same-number conflicting candidate; long hangs under Workbox control; silent Automatic preparation failure; quadratic startup cache work; latched watchdog failure reporting; invalid stateful retries; cumulative multi-engine container lifetime; waiting-worker promotion race.
Proof owners: publisher tests, state-transition and worker orchestration tests, service-client/entity/widget tests, existing managed-update release specs, managed-update aggregate runner, release Playwright configuration, fixture mutation helper, and verify/config tests.
Repository impact metadata must be re-evaluated after the correction because existing files gain scenarios but the release spec file corpus should remain unchanged.
Verification: focused static/unit proof, targeted owning browser proof, `pnpm verify --full --only managed-updates`, then the single final gate `pnpm verify:release`.
