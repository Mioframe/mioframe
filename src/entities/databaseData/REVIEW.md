# Review

Verdict: blocked by the top-level moving-surface correctness investigation, one relation-value offset invariant, and a confirmed sticky action/header stacking defect.

Active completion contract:

- `docs/database-virtualization-completion-pass-handoff.md`
- `docs/database-virtualization-completion-pass-preflight.md`

Supporting top-level diagnosis:

- `docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md`
- `docs/database-virtualization-widget-surface-offset-diagnosis-preflight.md`

## PR scope decision

PR #217 must finish Database virtualization itself: bounded rendering, deep-range correctness, root/surface geometry, nested roots, native-table integration, sticky surfaces, accessibility, and presentation regressions introduced or exposed by the virtualization migration.

Do not expand this PR into remaining causes of freezes/jank once virtualization correctness is complete. Heterogeneous-content / Chromium-specific residual performance investigation remains owned by `docs/database-chrome-jank-follow-up.md` and later PRs.

## Resolved — shared deep-state discriminator

Shared browser proof reproduces `deep -> change surfaceOffset while deep -> top -> deep` on the same root/list. Both deep phases reach the logical tail, top recovers item `0`, mounted work remains bounded, and geometry remains consistent. Shared production is unchanged.

No shared/TanStack production correction is justified by current evidence.

## Blocker — top-level supplied offset lifecycle is not yet understood

Owning product proof remains `tests/e2e/databaseVirtualizationFlows.spec.ts` → `keeps real preceding Database content connected to the table-owned surface range`.

A previous exact-head CI run failed this scenario 3/3 on desktop Chromium, while a later run passed without a production correction. The known instability therefore remains unresolved.

The completion pass must compare the numeric value supplied by `DatabaseViewWidget` with the actual DOM-derived root-to-layout offset at initial top, first deep, success-card dismiss while still deep, returned top, and second deep attempt.

Do not select a production correction before that evidence exists. If supplied and physical values diverge, widget geometry production/lifecycle owns the next architecture correction. If they remain truthful through a reproduced failure, architecture must be reconsidered before changing production.

## Blocker — body action cells can cover the sticky header

Operator inspection confirms that a sticky body action cell can render over the fixed header while scrolling.

Current stacking model:

- shared `MDTable` owns sticky `thead` with `z-index: 1`;
- `DatabaseDataTable .db-data-table__actions` gives every action cell `position: sticky; right: 0; z-index: 2`;
- the action header cell gets `z-index: 3`, but remains inside the `thead` stacking context and cannot make the rest of the header outrank body action cells.

Owner: `DatabaseDataTable` integration.

Required final state:

- body action cells remain above ordinary body cells horizontally;
- body action cells remain below the shared sticky-header plane;
- the top-right action header remains above sibling header cells inside the header plane.

Use the minimum local z-index correction. Do not change `MDTable` unless real-browser proof shows the local consumer stacking model cannot satisfy these requirements.

Required product proof must cover simultaneous vertical + horizontal scrolling and actual browser hit-testing/stacking, not only computed z-index values.

## Additional blocker — relationValueEdit zero invariant

Owner: [`src/features/relationValueEdit`](../../features/relationValueEdit/REVIEW.md).

The feature correction is now ready: loading-without-properties renders only the progress indicator; the table mounts only in the complementary state, making explicit `0/0` offsets truthful whenever it exists.

## Current ownership direction

- `DatabaseViewWidget` owns top-level composition/layout facts;
- `DatabaseViewLayout` forwards offsets;
- `DatabaseDataTable` owns virtualization presentation and local sticky action integration;
- `useVirtualCollection` forwards `surfaceOffset`;
- TanStack owns range/measurement/cache/scroll correction;
- shared `MDTable` owns generic native table frame/header behavior.

Do not restore entity root/table `MutationObserver` or ancestor/sibling discovery as fallback.

## Preserved contracts

Do not regress positive-distance spacers, transient cold bootstrap, relation persistence, logical-interior proof, native table frame, nested roots, bounded mounted work, inline editing, ARIA contracts, sticky positions, or deferred heterogeneous-content Chromium performance scope.

## Merge condition

Do not merge until:

1. top-level numeric offset investigation resolves the known moving-surface correctness risk;
2. relation-value offset invariant is truthful;
3. body action cells never cover the sticky header and the top-right sticky intersection remains correct;
4. virtualization browser/product proof and cumulative branch verification are clean;
5. exact-head CI is green;
6. operator presentation reinspection is clean;
7. final resulting-PR review has no blockers.
