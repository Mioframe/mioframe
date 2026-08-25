# Review

Verdict: production implementation corrections accepted; merge is blocked by one moving-surface E2E proof-design correction, operator visual reinspection, exact-head CI, and final resulting-PR review.

Active correction contract:

- `docs/database-virtualization-moving-surface-proof-correction-handoff.md`
- `docs/database-virtualization-moving-surface-proof-correction-preflight.md`

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

The scenario creates the real five-row Weekly Plan starter example and then performs **40 sequential full UI Add Item dialog flows** before the geometry proof. The proof therefore couples moving-surface correctness to expensive repetitive setup that is owned elsewhere.

This remains classified as a proof-design blocker, not evidence for another production geometry correction.

### Required correction

Follow the active proof-correction handoff exactly:

- set the scenario viewport before `launchApp`;
- desktop uses `640 x 360`;
- Mobile Chrome preserves its project width and uses height `360`;
- keep the five real starter rows;
- add exactly `16` additional Task rows through the existing public Add Item flow;
- retain the real success card and `Got it` dismissal;
- retain initial/moved top-range boundedness;
- retain both deep logical-tail assertions against `aria-rowcount`;
- retain physical surface movement proof;
- do not change production code, timeout, retries, project applicability, or geometry ownership.

The resulting 21-row dataset is setup for this moving-surface contract only. Large-dataset stress remains owned by separate Database virtualization proofs.

If 21 rows at the compact viewport do not produce a bounded virtualized range in either project, stop and report mounted/logical counts rather than silently changing the dataset or applicability.

If the proportional proof reaches its owned geometry/range assertions with meaningful budget remaining but still fails logical-tail correctness, reopen production architecture from that concrete evidence.

## Resolved — relation-value local-root invariant

`RelationValueFieldData` renders the loading progress indicator and `DatabaseDataTable` mutually exclusively. Explicit relation `0/0` offsets are truthful whenever the table is mounted. Owner-local proof and relevant E2E are reported green.

Owner review: `src/features/relationValueEdit/REVIEW.md`.

## Resolved — sticky body action cells covering the header

`DatabaseDataTable` keeps body action cells sticky/right at local `z-index: 0`, below the shared sticky `thead` plane (`z-index: 1`). The header action cell remains locally elevated inside the header plane.

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
2. coding-agent focused proof + repeat stability + `pnpm verify --base origin/develop` pass cleanly;
3. operator reinspection of the real Database table, especially borders/corners and combined sticky header/action behavior;
4. exact-head GitHub CI green with no retry/flaky classification;
5. final full resulting-PR review.

Residual heterogeneous-content Chromium jank and other non-virtualization performance causes are explicitly deferred to later PRs.

## Blockers

- moving-surface product proof is not currently stable within the repository's normal per-test budget.
