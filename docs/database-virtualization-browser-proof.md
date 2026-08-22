# Database virtualization browser proof

Status: **required direct-integration capability gate before production database migration**.

The previous shared-adapter proof is superseded. The browser gate now tests only Mioframe-owned database integration risks while using `@tanstack/vue-virtual` directly.

## Why this proof exists

TanStack owns generic virtualization behavior. Mioframe must prove only the parts created by its table integration:

- native table flow with partial DOM;
- virtual spacer rows/columns;
- dynamic `<tr>` / `<th>` measurement;
- deep two-axis offsets;
- current `MDTable` border/layout behavior;
- partial-DOM accessibility semantics.

Do not duplicate TanStack list/grid tests.

## Required fixture

Use one deterministic Storybook fixture under `src/entities/databaseData`.

Requirements:

- import `useVirtualizer` directly from `@tanstack/vue-virtual`;
- use real `MDTable` rather than an approximate copied table style, so Firefox proof exercises the current `border-collapse: separate`, cell borders, sticky header and row decoration risk;
- synthetic row/property data only;
- no worker, service, persistence, routing, editor, relation, or toolbar product behavior;
- sufficiently large logical size to exercise deep vertical and horizontal virtualization (target fixture: at least 5,000 rows × 300 columns);
- one physical scroll root for this capability fixture.

TanStack-required `data-index` is a private fixture/database implementation detail and may be bound directly.

## Required browser matrix

- Chromium: complete direct database capability proof.
- Firefox: same geometry/accessibility capability spec because native table row measurement is the known engine risk.

Keep the Firefox Playwright project narrowly matched to the database capability spec only.

Performance wall-clock comparison remains Chromium-controlled and belongs to later profiling.

## Required contracts

### Structural bounded rendering

For fixed viewport/overscan:

- mounted data rows remain bounded while logical rows are in the thousands;
- mounted property headers/cells remain bounded while logical columns are in the hundreds;
- no logical rows × columns cross product is materialized.

### Vertical geometry

Prove:

- top/bottom spacer rows preserve total virtual extent;
- deep scroll reaches rows near the end without mounting predecessors;
- dynamic mounted row growth updates geometry;
- the same row can shrink again and geometry/offsets update;
- resizing a mounted row above the viewport does not produce an unacceptable full-row anchor jump;
- behavior works with the real `MDTable` border/layout model in Chromium and Firefox.

Fixed-height Firefox fallback is not acceptable.

### Horizontal geometry

Prove:

- left/right spacer columns preserve horizontal extent;
- deep horizontal scroll reaches a property near the end of a large logical property set;
- visible header/body use the same property range;
- mounted body content can widen its corresponding `<th>` through native table layout;
- TanStack-measured width is reused as the remount minimum so ordinary horizontal scroll does not shrink/regrow a discovered column;
- spacer-column phantom min-content technique, if still needed, produces the correct deep offset in both engines.

Live shrink of a previously discovered column width is intentionally **not** a capability requirement. Column width may remain grow-only for the current table lifetime; a full remount may rediscover it.

### Accessibility

With partial DOM prove:

- native table semantics remain exposed;
- table logical row/column counts are complete;
- visible logical row/column indices match full-data positions, including after deep scrolling;
- virtual spacers are absent from logical accessibility semantics;
- ARIA grid conversion is unnecessary.

## Failure threshold

Native table flow is blocked only if one of the required contracts cannot be made reliable in Chromium/Firefox without substantial custom geometry machinery.

A narrow CSS/native-table normalization such as a spacer phantom box is acceptable. A second offset algorithm, per-cell measurement cache, independent ResizeObserver, or manual range engine is not.

If native flow is blocked, stop and return evidence for architecture review. Do not implement the fallback rendering model in the same task.

## Deferred to production migration

Do not clone these into the capability fixture:

- actual `.database-view` scroll-margin wiring;
- sticky action-column product behavior;
- active edit eviction/view-switch handling;
- nested relation roots;
- toolbar/after relocation;
- real filter/sort/view-switch scenarios;
- desktop/mobile product composition;
- wall-clock performance targets.

## Evidence result

Record the new direct-integration outcome in `docs/database-virtualization-direct-integration-result.md`:

- resolved TanStack/Playwright/browser versions;
- exact passing/failing contracts;
- any narrow native-table normalization retained;
- whether native-table-first remains accepted;
- unresolved blockers.

Do not carry forward the previous shared-adapter pass/fail claims as proof of this revised architecture.

## Exit criterion

Production migration preflight may start only when:

- direct database capability passes in Chromium;
- Firefox dynamic row measurement passes with real `MDTable` geometry;
- deep vertical and deep horizontal offsets are both proven;
- row grow/shrink works;
- bounded 2D DOM and logical accessibility semantics pass;
- no second Mioframe geometry engine/cache is introduced.
