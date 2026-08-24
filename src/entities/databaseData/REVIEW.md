# Review

Verdict: blocked by the repeated top-level moving-surface failure; shared virtualization is cleared and the current owner candidate is the widget offset producer.

Active diagnosis:

- `docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md`
- `docs/database-virtualization-widget-surface-offset-diagnosis-preflight.md`

## Scope reviewed

- PR #217 Database virtualization/native-table integration.
- Widget-owned explicit surface-offset correction.
- Strengthened shared deep-state `surfaceOffset` capability at `e52d6c7bf2397a62c6669078043f874025a0fdc0`.
- Exact-head product CI failure on `dcb72917f2fcd49c58a1caa9f8f6cc7ade58bd4a`.

## Resolved — shared deep-state discriminator

Shared browser proof now reproduces the exact lifecycle:

`deep -> change surfaceOffset while still deep -> top -> deep`.

The same root/list survive, the physical pre-surface extent changes approximately 240px -> 96px, both deep phases reach logical tail `9999`, top recovery reaches item `0`, mounted work remains bounded, and public/physical geometry remains consistent. Shared production is unchanged.

Therefore no shared/TanStack production correction is justified.

## Blocker — top-level supplied offset lifecycle is unverified

Owning product proof remains:

`tests/e2e/databaseVirtualizationFlows.spec.ts` — `keeps real preceding Database content connected to the table-owned surface range`.

`DatabaseViewWidget` currently derives its supplied offsets from two `useElementBounding` states plus current root scroll position and forces bounding refresh from `onMounted` / `onUpdated`.

The next pass must compare the numeric value supplied by the widget with the actual DOM-derived root-to-layout offset at the product checkpoints: initial top, first deep, after success-card dismiss while still deep, returned top, and second deep attempt.

Do not select a production correction before that evidence exists.

If supplied and physical values diverge, widget geometry production/lifecycle is confirmed as root cause. If they remain truthful while the product still fails, stop and reconsider architecture before changing production.

## Current ownership direction

Keep the intended boundary unless diagnosis disproves it:

- `DatabaseViewWidget` owns top-level composition/layout facts;
- `DatabaseViewLayout` forwards offsets;
- `DatabaseDataTable` consumes them;
- `useVirtualCollection` forwards `surfaceOffset`;
- TanStack owns range/measurement/cache/scroll correction.

Do not restore entity root/table `MutationObserver` or ancestor/sibling discovery as fallback.

## Additional blocker — relationValueEdit zero invariant

Owner: [`src/features/relationValueEdit`](../../features/relationValueEdit/REVIEW.md).

`RelationValueFieldData` still passes vertical zero while a loading progress indicator may precede the table in the same local root. This remains separate and is deferred until the top-level diagnosis resolves the primary blocker.

## Preserved contracts

Do not regress settled positive-distance spacers, transient cold bootstrap, relation persistence, logical-interior proof, native table frame, nested roots, bounded mounted work, inline editing, ARIA contracts, or deferred heterogeneous-content Chromium performance scope.

## Merge condition

Do not merge until the top-level numeric offset diagnosis leads to a verified correction, the relation-value zero invariant is truthful, branch verification and exact-head CI are green, operator presentation reinspection is clean, and final resulting-PR review has no blockers.
