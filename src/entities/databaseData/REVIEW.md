# Review

Verdict: blocked by the top-level moving-surface correctness investigation, one relation-value offset invariant, and a confirmed sticky action/header stacking defect.

Active diagnosis:

- `docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md`
- `docs/database-virtualization-widget-surface-offset-diagnosis-preflight.md`

## PR scope decision

PR #217 must finish Database virtualization itself: bounded rendering, deep-range correctness, root/surface geometry, nested roots, native-table integration, sticky surfaces, accessibility, and presentation regressions introduced or exposed by the virtualization migration.

Do **not** expand this PR into the remaining causes of user-visible freezes/jank once virtualization correctness is complete. Heterogeneous-content / Chromium-specific residual performance investigation remains owned by `docs/database-chrome-jank-follow-up.md` and must be handled in later PRs.

## Scope reviewed

- PR #217 Database virtualization/native-table integration.
- Widget-owned explicit surface-offset correction.
- Strengthened shared deep-state `surfaceOffset` capability at `e52d6c7bf2397a62c6669078043f874025a0fdc0`.
- Exact-head product CI history for the moving-surface scenario.
- Current `DatabaseDataTable` sticky action-column integration with shared `MDTable` sticky header.

## Resolved — shared deep-state discriminator

Shared browser proof reproduces the exact lifecycle:

`deep -> change surfaceOffset while still deep -> top -> deep`.

The same root/list survive, the physical pre-surface extent changes approximately 240px -> 96px, both deep phases reach logical tail `9999`, top recovery reaches item `0`, mounted work remains bounded, and public/physical geometry remains consistent. Shared production is unchanged.

Therefore no shared/TanStack production correction is justified by current evidence.

## Blocker — top-level supplied offset lifecycle is not yet understood

Owning product proof remains:

`tests/e2e/databaseVirtualizationFlows.spec.ts` — `keeps real preceding Database content connected to the table-owned surface range`.

`DatabaseViewWidget` derives its supplied offsets from two `useElementBounding` states plus current root scroll position and forces bounding refresh from `onMounted` / `onUpdated`.

The diagnosis must compare the numeric value supplied by the widget with the actual DOM-derived root-to-layout offset at: initial top, first deep, success-card dismiss while still deep, returned top, and second deep attempt.

Do not select a production correction before that evidence exists. If supplied and physical values diverge, widget geometry production/lifecycle owns the correction. If they remain truthful while a failure reproduces, stop and reconsider architecture before changing production.

The latest architect-head CI may pass, but the previously repeated 3/3 desktop Chromium failure was not corrected by production code. A single later pass does not erase the known instability.

## Blocker — body action cells can cover the sticky header

Operator inspection confirms that a sticky body action cell can render over the fixed header while scrolling.

Current stacking model:

- shared `MDTable` owns sticky `thead` with `z-index: 1`;
- `DatabaseDataTable .db-data-table__actions` gives every action cell `position: sticky; right: 0; z-index: 2`;
- the action header cell is assigned `z-index: 3`, but it remains inside the `thead` stacking context and cannot make the rest of the header outrank body action cells.

Therefore the body action layer is incorrectly above the shared header plane.

Owner: `DatabaseDataTable` integration.

Minimum correction: keep body sticky action cells below the shared sticky-header stacking plane while preserving their horizontal overlay over ordinary body cells; keep the header action intersection above sibling header cells inside the header plane. Do not change shared `MDTable` merely to compensate for the consumer's body z-index unless browser proof shows the local stacking model cannot satisfy both requirements.

Required browser/product proof must cover vertical + horizontal scrolling together, including the top-right header/action intersection.

## Additional blocker — relationValueEdit zero invariant

Owner: [`src/features/relationValueEdit`](../../features/relationValueEdit/REVIEW.md).

`RelationValueFieldData` still passes vertical zero while a loading progress indicator may precede the table in the same local root. This remains separate and should be corrected as part of completing virtualization correctness, without restoring entity ancestor/sibling geometry discovery.

## Current ownership direction

Keep the intended boundary unless diagnosis disproves it:

- `DatabaseViewWidget` owns top-level composition/layout facts;
- `DatabaseViewLayout` forwards offsets;
- `DatabaseDataTable` owns table virtualization presentation and local sticky action integration;
- `useVirtualCollection` forwards `surfaceOffset`;
- TanStack owns range/measurement/cache/scroll correction;
- shared `MDTable` owns generic native table frame/header behavior.

Do not restore entity root/table `MutationObserver` or ancestor/sibling discovery as fallback.

## Preserved contracts

Do not regress settled positive-distance spacers, transient cold bootstrap, relation persistence, logical-interior proof, native table frame, nested roots, bounded mounted work, inline editing, ARIA contracts, sticky header/action behavior, or deferred heterogeneous-content Chromium performance scope.

## Merge condition

Do not merge until:

1. top-level numeric offset investigation resolves the known moving-surface correctness risk;
2. relation-value offset invariant is truthful;
3. body action cells never cover the sticky header and the top-right sticky intersection remains correct;
4. virtualization browser/product proof and cumulative branch verification are clean;
5. exact-head CI is green;
6. operator presentation reinspection is clean;
7. final resulting-PR review has no blockers.
