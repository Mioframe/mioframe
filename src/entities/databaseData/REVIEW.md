# Review

Verdict: implementation corrections accepted; merge is blocked by an over-budget moving-surface E2E proof, operator visual reinspection, exact-head CI, and final resulting-PR review.

## Scope reviewed

- PR #217 Database virtualization/native-table integration.
- Shared deep-state `surfaceOffset` capability.
- Top-level `DatabaseViewWidget` numeric offset diagnosis.
- Relation-value local-root loading correction.
- Sticky action/header stacking correction and real-browser hit-testing proof.
- Exact-head GitHub Actions run #4334 on `3fb69ea622edf53837587c67e9fb9b4e9e218d7a`.

## Resolved — shared deep-state contract

The shared browser capability proves `deep -> change surfaceOffset while deep -> top -> deep` on the same root/list, reaching the logical tail before and after with bounded mounted work and consistent geometry. Shared production remains unchanged.

No shared/TanStack production correction is justified.

## Resolved — top-level supplied offsets are truthful in the diagnosed lifecycle

The coding-agent diagnosis reported truthful supplied-vs-physical offsets at every required checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both first and second deep phases reached logical row `46`. Temporary diagnostics were removed.

Together with the accepted shared deep-state capability, there is no current evidence supporting another production geometry/cache/lifecycle correction. Do not add timers, observers, cache reset, remount, or shared virtualization changes for this finding.

## Blocker — moving-surface product proof exceeds its test budget

Exact-head CI run #4334 failed only application E2E. Static, visual, Storybook behavior, and release-version lanes passed.

Owning scenario:

`tests/e2e/databaseVirtualizationFlows.spec.ts` -> `keeps real preceding Database content connected to the table-owned surface range`.

Desktop Chromium exhausted the same 30-second per-test timeout on the initial attempt and both retries, but at different phases:

- initial attempt timed out while polling the second deep logical range;
- retry #1 timed out after dismiss while evaluating the root/surface;
- retry #2 timed out while polling the second deep logical range.

Mobile Chrome passed the same scenario.

The scenario currently creates the real five-row Weekly Plan starter example and then performs **40 sequential full UI add-item dialog flows** before the geometry proof. The test therefore couples the surface-offset contract to expensive repetitive product setup and can consume nearly all of the global test budget before the assertions it owns.

This is now classified as a proof-design blocker, not evidence for another production geometry correction.

### Required correction

Keep the real starter success card and the same product lifecycle, but make the proof setup proportional to the contract:

1. use an explicit compact desktop viewport for this scenario;
2. create only a small fixed number of additional rows sufficient to guarantee vertical overflow and a virtualized deep range both before and after the success card is removed;
3. retain assertions that the mounted range is bounded and that both deep phases reach `aria-rowcount`;
4. retain the real success-card dismiss and physical surface movement assertion;
5. do not raise the test timeout and do not add sleeps/retries/recovery.

Large-dataset stress does not belong in this scenario; it is already owned by separate Database virtualization proofs.

If the corrected proportional proof still reproduces the same logical-tail failure with meaningful timeout budget remaining, reopen production architecture from that evidence.

## Resolved — relation-value local-root invariant

`RelationValueFieldData` now renders the loading progress indicator and `DatabaseDataTable` mutually exclusively. Explicit relation `0/0` offsets are truthful whenever the table is mounted. Owner-local proof and relevant E2E are reported green.

Owner review: `src/features/relationValueEdit/REVIEW.md`.

## Resolved — sticky body action cells covering the header

`DatabaseDataTable` now keeps body action cells sticky/right at local `z-index: 0`, below the shared sticky `thead` plane (`z-index: 1`). The header action cell remains locally elevated inside the header plane.

The product E2E uses actual `document.elementFromPoint()` hit-testing after combined vertical + horizontal scrolling and proves body-right, top-right header/action intersection, and ordinary header-band ownership.

No shared `MDTable` change was required.

## Preserved ownership

- `DatabaseViewWidget` owns top-level composition/layout facts;
- `DatabaseViewLayout` forwards offsets;
- `DatabaseDataTable` owns table virtualization presentation and local sticky action integration;
- `useVirtualCollection` forwards `surfaceOffset`;
- TanStack owns range/measurement/cache/scroll correction;
- shared `MDTable` owns generic native table frame/header behavior.

The removed entity ancestor/sibling geometry-discovery path must not return.

## Remaining gates

1. correct the over-budget moving-surface E2E setup without weakening its product contract;
2. coding-agent `pnpm verify --base origin/develop` passes cleanly on the corrected proof;
3. operator reinspection of the real Database table, especially borders/corners and combined sticky header/action behavior;
4. exact-head GitHub CI green with no retry/flaky classification;
5. final full resulting-PR review.

Residual heterogeneous-content Chromium jank and other non-virtualization performance causes are explicitly deferred to later PRs.

## Blockers

- moving-surface product proof is not currently stable within the repository's normal per-test budget.
