# Review

Verdict: blocked by a reproducible relation-value cold-render regression, operator visual acceptance, and exact-head CI.

## Scope reviewed

- PR #217 current Database virtualization/native-table integration.
- Zero-distance spacer correction at `d3c81c27805316a8ebd46e53c96137520e6d14a4`.
- Exact-head GitHub E2E at `63a984a85c8f3a4c3b75eea9be122ea64691c963`.
- Deferred residual Chromium performance risk.

## Blocker — non-empty nested relation table may fail to bootstrap after cold reload

Owner: `src/entities/databaseData` unless focused reproduction disproves this ownership.

Problem: exact-head GitHub CI fails `tests/e2e/databaseViewsAndQueryFlows.spec.ts` in `applies string, boolean, and relation filters and persists them after reload`. The same assertion fails on the initial attempt and both retries: after reload the relation filter still filters rows correctly, but the saved related value text is not rendered in the Filters Sheet. The same scenario passed on earlier PR head `1c1a3789ef66cc950eba543566502aec8567f3ec` before the zero-distance spacer correction.

Current evidence points to a lifecycle-state collapse in `DatabaseDataTable`: spacer presence is derived only from `leadingSize/trailingSize > 0`, while `useVirtualCollection` also reports zero leading/trailing sizes when a non-empty source has not yet produced its first mounted range. In a nested auto-sized relation root this may leave the native table without enough initial structure to establish the first range. This is the leading hypothesis, not a proven root cause.

Required final state:

- a non-empty Database table must bootstrap its first virtual range in top-level and nested auto-sized roots, including cold reload of saved relation-filter values;
- after the range resolves, zero-distance leading/trailing spacer DOM must remain absent at logical boundaries so the restored native-table border/radius contract is preserved;
- no persistent second range state, timeout/retry recovery, shared `MDTable` change, or second virtualization engine;
- if focused reproduction disproves the DatabaseDataTable bootstrap hypothesis and requires a different owner or public/shared contract, stop and return to architecture instead of broadening the correction.

Verification:

- the existing relation-filter persistence E2E passes without retry/flaky classification;
- existing Database virtualization start/interior/end spacer-boundary and nested-root proofs remain green;
- focused type-check remains green.

## Remaining blocker — operator visual acceptance

Owner: operator/architect review of `entities/databaseData` presentation.

Required final state: inspect the real application table and confirm the pre-virtualization outer border/corner appearance is restored at ordinary top/left and representative deep/end scroll states. If a concrete visual mismatch remains, reopen the integration architecture before changing shared `MDTable` or duplicating its styling.

## Accepted follow-up risk — not required for PR #217

Residual heterogeneous-content Chromium jank remains tracked in `../../../docs/database-chrome-jank-follow-up.md` and moves to a separate PR. Number isolation is a reproducer, not an established production owner.

## Merge condition

After the cold-render regression is fixed, operator visual acceptance is complete, and exact-head GitHub CI is green, review the full resulting PR again. Do not delete this `REVIEW.md` before those conditions are satisfied.
