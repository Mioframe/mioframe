# Review

Verdict: blocked by the repeated dynamic table-surface CI failure.

## Scope reviewed

- PR #217 complete Database virtualization/native-table integration through code head `2889a1d6598850a4a8886d6d1a7d95a40f8cd1da`.
- Settled zero-distance spacer correction at `d3c81c27805316a8ebd46e53c96137520e6d14a4`.
- Relation cold-bootstrap correction at `ca6c7b0ea640c43fb43c9fb3a474358d2dc236ba`.
- Branch-E2E proof correction at `0db8c3ba4c57bcee751af502109d68c85a1cf3d2`.
- Shared MDTable frame implementation at `2889a1d6598850a4a8886d6d1a7d95a40f8cd1da`.
- Coding-agent cumulative local branch verification: `pnpm verify --base origin/develop`, passed.
- Exact-head GitHub CI on `2889a1d6598850a4a8886d6d1a7d95a40f8cd1da`: application E2E failed; all other lanes passed.

## Resolved — relation-value cold bootstrap

The persisted relation-filter cold-reload scenario remains green. A non-empty source with no virtual items renders transient `aria-hidden` bootstrap table structure, which disappears when TanStack supplies real virtual items. Settled leading/trailing spacers remain positive-distance-only. No second range state exists.

## Blocker — moving table surface is a repeated production contract failure

Owning product proof:

`tests/e2e/databaseVirtualizationFlows.spec.ts` — `keeps real preceding Database content connected to the table-owned surface range`.

Exact-head CI on `2889a1d...` failed this scenario on desktop Chromium on the initial attempt and both retries. The first deep range succeeds. After the real preceding success card is dismissed, the measured table surface physically moves upward; after returning to the top, the second deep transition does not reach the final logical row. Mobile Chrome passes.

This is the same failure observed in an earlier exact-head run. It may no longer be classified as unconfirmed or flaky. The previous decision to leave the production geometry ownership unchanged is withdrawn.

### Architecture correction

The physical `.database-view` scroll root and the composition that places content before `DatabaseViewLayout` are widget-owned. Therefore the current root-to-Database-surface offset is a widget layout fact, not an entity-owned ancestor/sibling discovery concern.

Required final ownership:

- `DatabaseViewWidget` supplies current vertical/horizontal root-to-layout surface offsets;
- `DatabaseRelationValueInline` supplies the truthful local offsets for its own root (currently zero because the Database layout is the first unpadded root content);
- `DatabaseViewLayout` forwards these values;
- `DatabaseDataTable` consumes them and removes its current root/table `useElementBounding`, ancestor-root `MutationObserver`, and `onUpdated` surface-discovery path;
- `useVirtualCollection` forwards the supplied reactive `surfaceOffset`; TanStack remains the sole range/measurement/cache/scroll-correction owner.

Before the consumer correction, the shared virtualization browser capability must directly prove a same-root dynamic `surfaceOffset` change. If that proof fails with current shared production code, stop and return to architecture rather than adding a Database workaround.

Do not add per-scroll/rAF geometry measurement, another MutationObserver over the table subtree, cache reset, retry, remount, or force-update recovery.

## Resolved — interior spacer proof

The proof derives mounted row/property ranges from `aria-rowindex` / `aria-colindex`, proves a logical interior range, and only then requires both leading and trailing spacers. Physical midpoint is no longer treated as logical midpoint.

## Shared MDTable status

The previously confirmed shared frame implementation defect has been corrected at `2889a1d...`: root-owned border/radius is active and the per-row pseudo-element perimeter is removed. Static, visual, and Storybook CI lanes pass. Operator reinspection of the real Database presentation remains required before merge, but the current red CI failure is not Table-owned.

## Accepted follow-up risk — not required for PR #217

Residual heterogeneous-content Chromium jank remains tracked in `../../../docs/database-chrome-jank-follow-up.md` and belongs to a separate PR.

## Verification required after correction

- shared dynamic-surface capability browser proof;
- complete `tests/e2e/databaseVirtualizationFlows.spec.ts` focused verifier run;
- persisted relation-filter scenario if Database table production code changes;
- `pnpm verify --base origin/develop` clean;
- exact-head GitHub CI green;
- operator Database border/corner reinspection.

## Merge condition

Do not merge until the moving-surface contract is corrected, branch verification and exact-head CI are green, operator presentation reinspection is clean, and the final full PR review has no blockers.
