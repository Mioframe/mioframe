# Review

Verdict: implementation/proof correction accepted; merge remains blocked by operator visual acceptance and exact-head CI.

## Scope reviewed

- PR #217 complete Database virtualization/native-table integration through head `0db8c3ba4c57bcee751af502109d68c85a1cf3d2`.
- Settled zero-distance spacer correction at `d3c81c27805316a8ebd46e53c96137520e6d14a4`.
- Relation cold-bootstrap correction at `ca6c7b0ea640c43fb43c9fb3a474358d2dc236ba`.
- Branch-E2E correction at `0db8c3ba4c57bcee751af502109d68c85a1cf3d2`.
- Coding-agent cumulative branch verification: `pnpm verify --base origin/develop`, passed after two complete branch-gate runs.
- Deferred residual Chromium performance risk.

## Resolved — relation-value cold bootstrap

The persisted relation-filter cold-reload scenario remains green. The accepted correction is entity-local: a non-empty source with no virtual items renders transient `aria-hidden` bootstrap table structure, which disappears when TanStack provides real virtual items. Settled leading/trailing spacers remain positive-distance-only. No second range state or shared/public API was added.

## Resolved — moving table surface finding is not reproduced as a production defect

The existing E2E scenario `keeps real preceding Database content connected to the table-owned surface range` remains unchanged. It passed both focused verification and the cumulative local branch gate after the latest correction.

No stale entity-local or shared geometry step was proven. Therefore no production geometry change is justified. Reopen this finding only if exact-head CI reproduces the same moving-surface failure again.

## Resolved — interior spacer proof now establishes logical interior state

The previous proof incorrectly assumed physical `scrollHeight / 2` and `scrollWidth / 2` implied a logical interior virtual range.

The corrected E2E now derives mounted row/property ranges from `aria-rowindex` / `aria-colindex`, establishes that both axes are strictly inside their logical boundaries, and only then requires both leading and trailing row/column spacers. The same physical-midpoint assumption was removed from the representative recursive-relation proof.

No production or shared virtualization code changed for this correction.

## Branch verification

Required coding-agent branch gate:

`pnpm verify --base origin/develop`

Result reported clean after two complete runs. Focused virtualization E2E and relation persistence E2E also passed.

A retry-pass/flaky result would not count as clean evidence; none is reported for the final local branch gate.

## Remaining blocker — operator visual acceptance

Owner: operator/architect review of `entities/databaseData` presentation.

Required final state: inspect the real application table and confirm the pre-virtualization outer border/corner appearance is restored at ordinary top/left and representative deep/end scroll states. If a concrete visual mismatch remains, reopen the integration architecture before changing shared `MDTable` or duplicating its styling.

## Remaining blocker — exact-head CI

Exact-head GitHub CI must pass on the final published PR head. If CI reproduces either previously observed virtualization failure, reopen that finding with the exact CI evidence rather than accepting local/CI divergence as flaky behavior.

## Accepted follow-up risk — not required for PR #217

Residual heterogeneous-content Chromium jank remains tracked in `../../../docs/database-chrome-jank-follow-up.md` and moves to a separate PR. Number isolation is a reproducer, not an established production owner.

## Merge condition

After operator visual acceptance is complete and exact-head GitHub CI is green, perform final merge-readiness review. No current semantic implementation blocker remains.

Do not delete this `REVIEW.md` before those conditions are satisfied.
