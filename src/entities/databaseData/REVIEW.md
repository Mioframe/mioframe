# Review

Verdict: blocked by branch-wide Database virtualization E2E failures, operator visual acceptance, and exact-head CI.

## Scope reviewed

- PR #217 current Database virtualization/native-table integration.
- Settled zero-distance spacer correction at `d3c81c27805316a8ebd46e53c96137520e6d14a4`.
- Relation cold-bootstrap correction at `ca6c7b0ea640c43fb43c9fb3a474358d2dc236ba`.
- Full GitHub application E2E for that code head in workflow run `32701471162`.
- Deferred residual Chromium performance risk.

## Resolved — relation-value cold bootstrap

The previously failing `tests/e2e/databaseViewsAndQueryFlows.spec.ts` relation-filter persistence scenario passed in the full E2E run at `ca6c7b0e...`.

The accepted correction remains entity-local: a non-empty source with no virtual items renders transient `aria-hidden` bootstrap table structure, which disappears when TanStack provides real virtual items. Settled leading/trailing spacers remain positive-distance-only. No second range state or shared/public API was added.

## Blocker 1 — table surface does not reliably reach the deep range after preceding content moves

Owner: `src/entities/databaseData` table/root geometry integration unless reproduction proves the test contract invalid.

Evidence: `tests/e2e/databaseVirtualizationFlows.spec.ts` scenario `keeps real preceding Database content connected to the table-owned surface range` passes the first deep scroll while the preceding success card is mounted, then dismisses that card and proves the table surface offset moved. After returning to the top and scrolling deep again, desktop Chromium fails to reach the logical final row. The initial attempt and both retries failed in exact-head CI.

Required final state:

- when real content before the table appears/disappears and changes the table's root-relative surface offset, the existing table-owned geometry path must update without remount/recovery loops;
- a subsequent top -> deep scroll must again reach the logical final row;
- TanStack remains the only virtual-item range/measurement/cache engine;
- do not mask the failure with retries, longer timeouts, forced updates, or test-only production seams.

Verification owner: the existing application E2E scenario plus the required branch-diff verifier gate.

## Blocker 2 — interior spacer proof is not stable under the current scroll setup

Owner: `src/entities/databaseData` implementation/proof boundary; classify whether this is a product geometry defect or an invalid test precondition before changing production code.

Evidence: `tests/e2e/databaseVirtualizationFlows.spec.ts` scenario `virtualizes the real Database root across deep native-table row and property ranges` sets both root scroll offsets to half of the physical scroll range and expects an interior virtual range with both leading and trailing spacers. In exact-head CI the assertion repeatedly receives a boundary-like range instead: desktop and Mobile Chrome do not satisfy the expected two-sided row/column spacer state.

Required final state:

- the proof must establish a real logical interior row/property range before asserting two-sided spacer structure;
- if the mounted logical indices are interior but required spacers are absent, fix the production geometry/range integration;
- if `scrollHeight / 2` or `scrollWidth / 2` does not actually guarantee a logical interior range for the native-table geometry, correct the test precondition without weakening the structural contract;
- do not convert this into timing sleeps, retries, timeout inflation, or exact-pixel assumptions.

Verification owner: the existing application E2E scenario plus the required branch-diff verifier gate.

## Workflow correction

The repository verification workflow now requires coding agents to run one cumulative branch-diff gate before final PR handoff. For normal `develop` PRs:

`pnpm verify --base origin/develop --profile github-actions`

Focused checks remain implementation feedback. They do not replace this branch-wide pre-handoff gate. `pnpm verify --full` is not the ordinary PR gate because it is full-project/release scope and cannot be combined with `--base`.

## Remaining blocker — operator visual acceptance

Owner: operator/architect review of `entities/databaseData` presentation.

Required final state: inspect the real application table and confirm the pre-virtualization outer border/corner appearance is restored at ordinary top/left and representative deep/end scroll states. If a concrete visual mismatch remains, reopen the integration architecture before changing shared `MDTable` or duplicating its styling.

## Accepted follow-up risk — not required for PR #217

Residual heterogeneous-content Chromium jank remains tracked in `../../../docs/database-chrome-jank-follow-up.md` and moves to a separate PR. Number isolation is a reproducer, not an established production owner.

## Merge condition

After both branch-wide virtualization E2E blockers are resolved, the required coding-agent branch gate passes cleanly, operator visual acceptance is complete, and exact-head GitHub CI is green, review the full resulting PR again. Do not delete this `REVIEW.md` before those conditions are satisfied.
