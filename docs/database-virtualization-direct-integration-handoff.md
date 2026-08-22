# Database virtualization direct-integration handoff

Status: **ready**.

## Goal

Simplify the virtualization architecture before production migration: remove the unneeded shared Mioframe wrapper and prove the native-table database model using `@tanstack/vue-virtual` directly in `entities/databaseData`.

## Confirmed evidence

- Database is the only confirmed production virtualization consumer.
- The implemented `useVirtualAxis` mostly mirrors TanStack and adds another API/validation/fixture layer.
- Repository architecture requires the simplest current solution and rejects speculative reuse.
- `entities/databaseData` owns entity-scale table rendering; entity source already imports external packages directly, so direct vendor use does not violate internal FSD direction.
- Existing capability proof did not fully prove deep horizontal offsets and used table geometry that did not match real `MDTable` styling.

## Non-goals

- no production `DatabaseDataTable` migration yet;
- no worker/query/subscription/paging/index work;
- no generic virtualization abstraction;
- no editor/relation/toolbar product fixture;
- no rendering fallback implementation in this task.

## Ownership

| Layer | Decision |
| --- | --- |
| entity | `databaseData` owns direct TanStack setup and the native-table capability fixture/spec. |
| shared | no virtualization wrapper/API; `MDTable` remains styling only. |
| widget | production scroll root/edit/relation/toolbar wiring deferred to production migration. |
| service/worker | unchanged. |

## Source of truth

Logical rows/properties remain consumer-owned. TanStack owns virtual ranges, estimates, measured geometry, ResizeObserver behavior, stable-key measurement cache, and scroll correction. No parallel Mioframe geometry state is allowed.

## Public API

None. TanStack APIs and `data-index` are private implementation details inside `databaseData`.

## Minimum sufficient design

- keep `@tanstack/vue-virtual` as the dependency;
- delete `src/shared/ui/virtualization` and all generic adapter/list/grid proof;
- use two direct `useVirtualizer` instances in the database capability fixture;
- use actual `MDTable` in that fixture so Chromium/Firefox exercise production-relevant table border/layout geometry;
- use one shared fixture scroll root;
- keep the already proven phantom min-content spacer technique if needed;
- keep column width progressive/grow-only for one table lifetime by using TanStack's cached measured width as remount minimum;
- require row growth and shrink to remeasure correctly;
- run Chromium plus a Firefox project matched only to the database capability spec.

## Acceptance

- no `src/shared/ui/virtualization` remains;
- no generic virtualization public contract/tests remain;
- logical fixture scale is at least 5,000 rows × 300 columns with bounded mounted rows/columns/cells;
- deep vertical and deep horizontal offsets are both proven;
- dynamic row grow and shrink work;
- body content can grow a measured column and its width remains stable after horizontal unmount/remount;
- real `MDTable` semantics/border model works in Chromium and Firefox;
- logical ARIA counts/indices remain correct after deep scrolling;
- no second geometry/observer/cache algorithm is introduced.

## Risks

- High: native table horizontal spacer geometry at deep offsets.
- High: Firefox `<tr>` measurement with actual `MDTable` styles.
- Medium: dynamic row shrink and scroll correction.
- Medium: partial-DOM accessibility after deep scroll.

## Required proof

Primary proof: `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts` against its colocated Storybook fixture.

Firefox runs the same spec through one narrowly scoped Playwright project. No generic list/grid proof, unit wrapper proof, screenshots, or application E2E in this correction task.

## Forbidden

- new shared wrapper/helper around TanStack;
- independent ResizeObserver, offset/range tree, measurement cache, or manual scroll-anchor algorithm;
- live column-width reset protocol;
- hidden full-data measurement;
- production database migration;
- sleeps, `force`, broad retries, timeout inflation;
- choosing/implementing a fallback DOM architecture if the native-table gate fails.

## Readiness

Architecture decisions and proof ownership are resolved.

Unresolved blockers: **none for this correction task**.

Verdict: **ready**.
