# Managed pinned updates — Stage 7 proof preflight

**Status: Stage 7 implementation and browser-proof architecture are complete. Code-level post-review findings are resolved. Merge readiness now depends on current-head repository verification and operator UI/accessibility acceptance.**

Authoring sources: [`managed-pinned-updates.md`](./managed-pinned-updates.md) and [`managed-pinned-updates-implementation-preflight.md`](./managed-pinned-updates-implementation-preflight.md).

## Scope

- Verification owns this stage; publisher, worker, client, entity, feature, widget, and page contracts remain unchanged unless a complete-PR review finds a violation of an earlier accepted contract.
- Reuse the existing managed-release fixture, product E2E helpers, current release specs, and repository verification lanes.
- Keep one public `managed-updates` label and sequential fail-stop execution.
- Do not add another update manager, production test hook, fixture system, protocol path, browser project, retry, or parallel E2E lane.

## Accepted proof structure

1. `managedUpdatesMigration.spec.ts` proves recovery from a boot-broken first managed release through navigation reconciliation and a later corrected release.
2. `managedUpdatesActivationUi.spec.ts` proves that the previous release reads the document, property, and item written by an activating candidate after real worker rollback.
3. Lifecycle, develop, and cross-engine shared-state suites use serial retry semantics, so a retry replays the complete dependent sequence.
4. Temporary Automatic preparation failure uses deterministic corruption and exact restoration of the release-specific published entry file rather than Playwright request interception.
5. Controller-code upgrade observes the byte-mutated worker before update, closes the old client, proves that exact worker becomes active, and only then opens the next scoped page.
6. The exact eight-spec corpus runs in three sequential fresh containers: Chromium lifecycle, Chromium migration/isolation, and Firefox/WebKit cross-engine.
7. Mode-change-dependent scenarios use explicit protocol synchronization barriers before publishing a release whose discovery must belong to a later trigger.
8. Release Playwright keeps two diagnostic CI retries but enables `failOnFlakyTests`, so a retry-pass cannot make the managed-update or final release gate green.

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

## Resolved complete-PR findings

The final implementation includes focused proof for all findings discovered during complete-PR review:

- retained archived indexes and assets are validated by exact byte size and SHA-256 before allocation, no-op publication, or writes;
- Automatic and Manual preparation completion uses the complete `ReleaseSummary` identity;
- only a confirmed same-channel managed controller exposes update capability;
- transient capability-probe transport failures are not permanently cached;
- Automatic preparation failure is classified without persisted error state;
- owned asset serving avoids complete cache enumeration for every asset request;
- owned navigation failures, including thrown Cache Storage failures for an activating target, resolve through controlled rollback/503 paths;
- concurrent Manual install completion for one exact target is idempotent;
- rollback recovery uses direct durable acknowledgements for the reporting window and best-effort broadcast for other windows;
- one failing client broadcast cannot prevent delivery to remaining same-channel clients;
- the watchdog remains armed when activation status is false, allowing direct `BOOT_OK`/`BOOT_FAILED` classification of active versus stale windows;
- synchronous watchdog transport failures cannot latch reporting or escape as unhandled rejections;
- manual deployment of the literal `develop` branch supplies the same canonical managed build identity as automatic develop deployment.

These corrections remain localized. They add no manager, persisted operation state, polling, retry scheduler, browser-specific lifecycle branch, or second worker path.

## Initial managed baseline decision

The first managed release is the complete application state shipped by the promotion that introduces the managed worker. It is not required to be an infrastructure-only release and may include already-reviewed product fixes present in the same resulting PR or accumulated `develop` state.

This is an explicit release-risk decision:

- the legacy Workbox application has no managed rollback contract;
- after managed release 1 activates, rollback to Workbox is unsupported;
- full rollback guarantees begin with managed release 2;
- managed release 1 must contain no irreversible user-data migration and must pass complete product, UI/accessibility, managed-update, and release verification as one artifact;
- if managed release 1 itself is defective after activation, recovery is publication of a corrected managed release 2 through navigation reconciliation, not rollback to the legacy Workbox deployment.

## Final verification state

The coding correction was reported as passing, on one unchanged workspace and without flaky classification:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

Documentation changes after that proof create a new repository head. The final merge decision therefore still requires the ordinary GitHub workflow on the resulting documentation head. Any later production-code change invalidates the previous local proof and requires both commands again.

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
- Temporary capability failures can recover on a later command without background retry.
- Owned activation-target serving exceptions use exact guarded rollback.
- Direct rollback acknowledgement recovers the reporting window without requiring broadcast delivery.
- A retry is diagnostic evidence and causes the release run to fail as flaky.
- `pnpm verify --full --only managed-updates` passes without flaky classification after any production-code change.
- `pnpm verify:release` passes as the final completion gate.
- The final GitHub workflow is green on the exact merge head.
- Operator UI/accessibility acceptance is recorded before stable release.

## TEST IMPACT

Changed contracts: managed-update proof orchestration, controller-upgrade observation, portable cross-engine safe-start behavior, synchronization of deferred reconciliation, strict release flaky gating, retained archive integrity, complete preparation identity, managed-controller capability, request-path cache validation, rollback acknowledgements, watchdog recovery, concurrent Manual completion, and manual develop publication identity.

Risks: first managed baseline cannot roll back to Workbox; publishing over an unrecoverable retained release; approving a conflicting candidate; losing rollback notification to one window; stale-window mixed-release execution; long hangs under legacy controller control; invalid stateful retries; cumulative multi-engine container lifetime; waiting-worker promotion race.

Proof owners: publisher tests, state-transition and worker orchestration tests, service-client/entity/widget tests, watchdog tests, release workflow validation, existing managed-update release specs, managed-update aggregate runner, release Playwright configuration, fixture mutation helper, and verify/config tests.
