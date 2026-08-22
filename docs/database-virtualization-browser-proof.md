# Database virtualization browser capability proof

Status: **required pre-implementation capability gate**.

This document complements `docs/virtualization-library.md`, `docs/database-virtualization.md`, and `docs/database-virtualization-profiling.md`.

It exists because controlled performance timing and browser-layout correctness have different ownership:

- performance comparison uses one controlled Chromium environment;
- virtualization correctness must also cover browser-specific native-table measurement behavior that can invalidate the selected DOM integration even when Chromium is fast.

## Confirmed external risk

Current TanStack Table virtualization examples use dynamic row measurement but explicitly avoid their `<tr>` measurement path in Firefox because Firefox can report table border height differently. TanStack's examples also commonly use semantic table tags with CSS grid/flex/positioned-row layout for virtualized dynamic rows.

Mioframe cannot copy the Firefox workaround of falling back to a fixed estimate because dynamic row height is a confirmed correctness requirement.

Therefore native-table flow remains the preferred minimum design, but it is accepted for production only after this proof.

## Browser matrix

Required capability proof:

- Chromium: complete native-table integration proof and performance/reference geometry;
- Firefox: focused dynamic row/column measurement, virtual padding, scrolling, sticky, and accessibility compatibility proof.

WebKit may be added as a narrow compatibility smoke when implementation preflight confirms that current product/browser policy requires the same database path there. Do not expand permanent cross-engine CI mechanically when a task-specific proof is sufficient.

The performance budget itself is not compared across engines. Cross-engine proof protects correctness/geometry, not identical wall-clock numbers.

## Preferred DOM model under proof

First prove the architecture selected in `docs/database-virtualization.md`:

- native `<table>/<thead>/<tbody>/<tr>/<th>/<td>` flow;
- top/bottom spacer rows;
- left/right spacer columns;
- dynamic `<tr>` measurement for vertical axis;
- dynamic `<th>` measurement for horizontal axis;
- native table layout of currently mounted cells;
- sticky header/action integration;
- logical ARIA count/index metadata;
- current top-level database scroll surface.

Do not start from absolute rows or CSS-grid table layout merely because TanStack examples use them. Mioframe should first retain the simpler current native-flow model if browsers prove it correct.

## Row measurement proof

For Chromium and Firefox, compare the virtualizer's measured logical row size against observable rendered row geometry for rows containing:

- one-line values;
- wrapped multi-line values;
- cells with different heights;
- relation content;
- post-mount expansion/edit changes;
- current table borders/pseudo-row decoration.

Required result:

- measured size corresponds to the space the row actually consumes in table flow;
- repeated resize updates geometry;
- top/bottom virtual padding remains consistent;
- deep scroll does not accumulate visible offset drift.

### If Firefox differs

Resolve in this order:

1. confirm whether Mioframe table border/pseudo-element CSS is the cause and can be normalized without changing product appearance/semantics;
2. test a narrow database-specific row-size measurement callback that returns the actual consumed block size while still letting TanStack own offsets/ranges/ResizeObserver scheduling;
3. expose a generic optional `measureSize(element, ResizeObserverEntry?)` hook through `useVirtualAxis` only if current browser proof requires it;
4. do not expose TanStack instances/types or generic manual `resizeItem` state merely for the workaround.

A narrow measurement callback is acceptable because it changes only how one mounted item's actual size is read. It must not become a second virtualization algorithm or measurement cache.

Using only a fixed estimate in Firefox is **not acceptable** for content whose height can change.

## Column measurement proof

For both required engines prove that:

- current mounted body content participates in native column layout;
- the corresponding visible `<th>` reflects the final mounted-column width;
- horizontal `measureElement(<th>)` observes changes caused by body content;
- left/right virtual spacer columns keep correct horizontal offsets;
- remount minimum from the stable-key measured size prevents ordinary shrink/regrow oscillation;
- viewport max constraints can intentionally remeasure smaller without corrupting virtual offsets.

If a browser cannot provide this behavior with native auto table layout plus virtual spacers, change the database DOM/layout model before adding per-cell size caches.

## Scroll-root and margin proof

For root database:

- `.database-view` remains the actual two-axis scroll owner;
- table `scrollMargin` matches its current offset inside that owner;
- changing content above the table updates margin correctly;
- sticky header/action scroll padding keeps deep targets visible.

For representative nested relation:

- vertical axis uses the inherited containing database root;
- horizontal axis uses the current relation-local overflow surface when applicable;
- each virtual surface uses the correct margin relative to its own axis root;
- parent row height remeasures after nested layout changes.

No `closest()`/computed-style scroll-parent discovery is allowed as the architecture contract.

## Accessibility proof

For partial DOM in Chromium and Firefox inspect the browser accessibility tree or the lowest faithful browser accessibility surface and prove:

- native table semantics remain present;
- virtual spacer/fill rows/cells do not appear as logical data;
- full logical row/column counts are exposed;
- visible logical row/column indices match their positions in the full dataset;
- action column is represented consistently when present;
- removing current `role="list"`/`role="listitem"` overrides does not remove required interactive cell semantics.

Do not add ARIA `grid` or spreadsheet keyboard behavior to make the test pass.

## Edit/unmount proof

In each engine needed for browser correctness:

1. start inline edit;
2. change draft;
3. scroll far enough that the cell would leave the virtual range;
4. prove draft is captured and commit/close occurs before virtual eviction;
5. repeat for view switch;
6. prove Escape remains cancel.

If event ordering is not deterministic, lift only the active edit session state to the nearest truthful database presentation owner. Do not add generic virtualizer pinning first.

## Native-table failure threshold

Do **not** abandon native table flow for cosmetic inconvenience or a narrow CSS fix.

Treat it as blocked only when focused proof shows a required contract cannot be made reliable in supported browsers without introducing substantial custom geometry/measurement logic.

Examples of blocking evidence:

- spacer-row flow cannot maintain correct deep offsets with dynamic heights;
- browser row measurements cannot be normalized to actual consumed height;
- horizontal native layout plus spacer columns cannot maintain stable measured property widths;
- sticky/accessibility behavior cannot be made correct without destroying bounded rendering.

## Fallback rendering model

If native table flow is blocked, preserve the rest of the architecture and change only database presentation.

Fallback order:

1. keep semantic table tags where possible;
2. use virtualization-compatible CSS layout for table sections/rows/cells (grid/flex/positioned rows) while TanStack still owns virtual ranges and measurements;
3. preserve logical table accessibility counts/indices;
4. keep shared `useVirtualAxis`, stable keys, scroll roots, edit ownership, and service/worker contracts unchanged.

A fully custom div-grid/ARIA-grid rendering model is a last resort and requires a new architecture decision because it expands accessibility/keyboard ownership.

## Evidence recording

For every failed/passing browser case record:

- browser and exact version;
- commit/ref;
- viewport;
- DOM/layout variant;
- relevant row/column content shape;
- expected vs measured size/offset;
- deep-scroll result;
- screenshot/trace only when diagnostically useful;
- conclusion and architecture consequence.

Do not convert browser-specific geometry findings into generic performance budgets.

## Exit criterion

Database virtualization may enter production implementation only when:

- shared TanStack adapter proof passes;
- native-table database proof passes in Chromium;
- Firefox dynamic table measurement has a proven correct path without fixed-size assumptions;
- no selected path requires a second Mioframe virtualization engine;
- the implementation-preflight document records the exact browser proof owner/files.

If native table fails but the semantic-table CSS-layout fallback passes, implementation may proceed with that fallback after `docs/database-virtualization.md` is updated to make it the selected database DOM model.
