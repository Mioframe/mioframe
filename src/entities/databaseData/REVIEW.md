# Review

Verdict: blocked by the repeated moving-surface failure; no further Database/widget production patch is authorized before the active shared discriminator.

Active architecture discriminator:

- `docs/database-virtualization-deep-state-surface-offset-discriminator-handoff.md`
- `docs/database-virtualization-deep-state-surface-offset-discriminator-preflight.md`

## Scope reviewed

- PR #217 complete Database virtualization/native-table integration through production code head `5c1feb51102c8923fb23370de099e62e482b65d5`.
- Widget-owned explicit surface-offset correction.
- Current shared dynamic same-root capability proof.
- Exact-head GitHub CI on `dcb72917f2fcd49c58a1caa9f8f6cc7ade58bd4a`.

## Blocker — moving table surface still fails exact-head CI

Owning product proof:

`tests/e2e/databaseVirtualizationFlows.spec.ts` — `keeps real preceding Database content connected to the table-owned surface range`.

Exact-head CI again failed this scenario on desktop Chromium on the initial attempt and both retries. The first deep range succeeds. The real success card is dismissed while the root is still deep, the table surface physically moves upward, the test returns to top, and the second deep transition does not reach the final logical row. Mobile Chrome passes.

Therefore the widget-owned correction cannot yet be accepted as resolving the defect.

## Architecture discriminator required before another production patch

The existing shared capability is weaker than the failing product lifecycle: it reaches deep, returns to top, and only then changes `surfaceOffset`.

Before another Database/widget or shared production change, shared browser capability must reproduce this exact ordering on the same root/list:

1. non-zero preceding extent;
2. deep/end range;
3. change preceding extent and reactive `surfaceOffset` while still deep;
4. prove physical movement and retained root/list identity;
5. return to top and prove first logical item;
6. scroll deep again and prove logical end plus self-consistent geometry.

If the strengthened shared capability fails, stop and reconsider shared boundary/engine interaction. Do not patch Database/widget code.

If it passes, shared production remains unchanged and a subsequent architect task must diagnose the actual numeric offsets supplied by `DatabaseViewWidget` through the same product sequence. Do not combine that diagnosis with the discriminator pass.

## Current ownership state

The direction remains preferable to the removed entity discovery model:

- `DatabaseViewWidget` owns top-level composition/layout facts;
- `DatabaseViewLayout` forwards explicit offsets;
- `DatabaseDataTable` consumes them;
- `useVirtualCollection` forwards `surfaceOffset`;
- TanStack owns range/measurement/cache/scroll correction.

Do not restore the removed entity root/table `MutationObserver` or ancestor/sibling discovery as a fallback.

## Additional blocker — relationValueEdit zero invariant

Owner: [`src/features/relationValueEdit`](../../features/relationValueEdit/REVIEW.md).

`RelationValueFieldData` still passes vertical zero while a loading progress indicator may precede the table in the same local root. This remains a separate feature-owned correctness issue but is not the cause of the current top-level CI failure and is intentionally outside the discriminator task.

## Preserved contracts

Do not regress settled positive-distance spacers, transient cold bootstrap, relation persistence, logical-interior proof, native table frame, nested roots, bounded mounted work, inline editing, ARIA contracts, or deferred Chromium heterogeneous-content performance scope.

## Merge condition

Do not merge until the strengthened shared discriminator resolves ownership, the repeated top-level moving-surface product scenario is clean, the relation-value zero invariant is truthful, branch verification and exact-head CI are green, operator presentation reinspection is clean, and final resulting-PR review has no blockers.
