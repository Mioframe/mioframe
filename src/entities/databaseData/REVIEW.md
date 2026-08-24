# Review

Verdict: Database implementation/proof accepted; merge remains blocked by shared `MDTable` presentation correction.

## Scope reviewed

- PR #217 complete Database virtualization/native-table integration through code head `0db8c3ba4c57bcee751af502109d68c85a1cf3d2`.
- Settled zero-distance spacer correction at `d3c81c27805316a8ebd46e53c96137520e6d14a4`.
- Relation cold-bootstrap correction at `ca6c7b0ea640c43fb43c9fb3a474358d2dc236ba`.
- Branch-E2E correction at `0db8c3ba4c57bcee751af502109d68c85a1cf3d2`.
- Coding-agent cumulative branch verification: `pnpm verify --base origin/develop`, passed after two complete branch-gate runs.
- Exact-head GitHub CI on `aad0ecee9204aa8b87f6df6a6ad0df846aab0189`: green.
- Operator visual inspection: outer table corner rounding still incorrect.
- Deferred residual Chromium performance risk.

## Resolved — relation-value cold bootstrap

The persisted relation-filter cold-reload scenario remains green. The accepted correction is entity-local: a non-empty source with no virtual items renders transient `aria-hidden` bootstrap table structure, which disappears when TanStack supplies real virtual items. Settled leading/trailing spacers remain positive-distance-only. No second range state or shared/public API was added.

## Resolved — moving table surface finding is not reproduced as a production defect

The existing E2E scenario `keeps real preceding Database content connected to the table-owned surface range` remains unchanged. It passed focused verification, the cumulative local branch gate, and exact-head CI after the latest proof correction.

No stale Database/shared virtualization geometry step is established. No production geometry change is justified.

## Resolved — interior spacer proof establishes logical interior state

The proof no longer assumes a physical scroll midpoint is a logical virtual midpoint. It derives mounted row/property ranges from `aria-rowindex` / `aria-colindex`, proves both axes are strictly interior, and only then requires both leading and trailing row/column spacers. The same invalid midpoint assumption was removed from the representative recursive-relation proof.

No production or shared virtualization code changed for this correction.

## Blocker — shared MDTable outer frame fails operator visual acceptance

Owner: [`src/shared/ui/Table`](../../shared/ui/Table/REVIEW.md).

The Database consumer no longer owns the unresolved visual root cause. `DatabaseDataTable` does not draw the outer frame or corner radii; its local presentation only removes border/padding from virtual spacers and owns sticky action behavior. The remaining broken rounded outline is now tracked at the shared component that actually owns those styles.

Database requirements during the shared correction:

- do not reintroduce zero-distance settled spacers;
- preserve transient cold-bootstrap structure;
- preserve bounded/deep virtualization and ARIA contracts;
- preserve sticky action/header behavior;
- do not add Database-specific duplicate border/radius CSS.

## Accepted follow-up risk — not required for PR #217

Residual heterogeneous-content Chromium jank remains tracked in `../../../docs/database-chrome-jank-follow-up.md` and moves to a separate PR. Number isolation is a reproducer, not an established production owner.

## Merge condition

After the shared `MDTable` review blocker is corrected, operator visual acceptance is clean, the coding-agent branch gate passes, and exact-head GitHub CI is green on the final head, perform final full PR merge-readiness review.

Do not delete this `REVIEW.md` before those conditions are satisfied.
