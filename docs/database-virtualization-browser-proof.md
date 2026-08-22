# Database virtualization browser proof

Status: **required capability gate before database production migration**.

This document separates browser-layout capability from later product integration proof.

- Capability proof answers: can the selected TanStack adapter and native-table-first DOM model satisfy required dynamic geometry in supported browsers?
- Product proof answers: does the real database preserve editing, relations, toolbar, sticky actions, filtering/sorting, and performance after migration?

Do not clone product behavior into synthetic capability fixtures merely to move the gate earlier.

## Confirmed browser risk

Current TanStack virtualized table examples dynamically measure rows but explicitly avoid their `<tr>` measurement path in Firefox because Firefox can report table border height differently. TanStack examples also commonly use semantic table tags with virtualization-compatible CSS grid/flex/positioned-row layout.

Mioframe requires dynamic row height, so a Firefox fixed-estimate fallback is not acceptable.

Native table flow remains the preferred minimum design, but production database migration is blocked until the focused capability proof below passes.

## Required browser matrix

Capability proof:

- Chromium: complete shared adapter + native-table geometry proof;
- Firefox: focused dynamic row/column measurement, virtual padding, deep scrolling, and accessibility proof.

Performance timing remains Chromium-controlled. Cross-engine capability proof protects correctness/geometry, not identical wall-clock numbers.

WebKit is not added mechanically. Add a narrow smoke only if current supported-browser policy or a demonstrated WebKit-specific risk requires it during production migration.

## Stage A — shared adapter capability

Use the actual production `src/shared/ui/virtualization/useVirtualAxis` adapter with deterministic Storybook fixtures.

Prove:

- 10,000+ logical items with bounded mounted items;
- vertical and horizontal axes;
- dynamic sizes and repeated post-mount resize;
- stable `getItemKey` behavior across index remapping;
- Mioframe measurement binding associates logical `index + element` without exposing TanStack `data-index` conventions;
- unmount/ref cleanup does not retain stale observed elements;
- deep `scrollToIndex`;
- `scrollMargin` when the virtual surface starts after other content;
- `scrollPaddingStart` / `scrollPaddingEnd` for occluded deep targets;
- acceptable scroll correction when an item before the viewport changes size;
- two axes sharing one scroll root;
- a narrow fixture where two axes use different roots.

Do not test TanStack private internals. Assert Mioframe-owned observable geometry and adapter behavior.

## Stage B — native-table capability prototype

Use a deterministic synthetic database-like Storybook fixture under the `databaseData` owner. It must use `useVirtualAxis`, semantic table tags, synthetic rows/properties, and no worker/service/database persistence.

First prove the selected model:

- native `<table>/<thead>/<tbody>/<tr>/<th>/<td>` flow;
- top/bottom spacer rows;
- left/right spacer columns;
- dynamic `<tr>` vertical measurement;
- dynamic `<th>` horizontal measurement;
- native layout from currently mounted body cells;
- shared horizontal row/header range;
- logical ARIA row/column counts and indices;
- presentation spacers absent from logical accessibility semantics.

### Row measurement

In Chromium and Firefox compare virtualizer geometry with observable rendered row geometry for:

- one-line rows;
- wrapped multi-line rows;
- rows whose visible cells have different heights;
- post-mount expansion/shrink;
- current border/pseudo-row styling equivalent to the production table risk.

Required result:

- measured size matches consumed table-flow size closely enough that virtual offsets do not drift;
- repeated resize updates total/range geometry;
- top/bottom padding stays correct;
- deep scroll does not accumulate visible offset error.

### Firefox resolution order

If Firefox native `<tr>` measurement differs:

1. determine whether table border/pseudo-element CSS is the cause and normalize it if possible without changing required appearance/semantics;
2. if necessary, use a narrow size-reading callback at the shared adapter boundary that changes only how the mounted element's real size is read while TanStack still owns observation, offsets, cache, and correction;
3. expose such a generic measurement callback only if this current capability proof requires it;
4. do not add an independent ResizeObserver, element-size cache, or manual `resizeItem` state.

Using only estimates for dynamic Firefox rows is forbidden.

### Column measurement

Prove in both required engines:

- visible body content participates in native column layout;
- corresponding visible `<th>` reflects the rendered column width;
- horizontal measurement observes width changes caused by body content;
- left/right virtual spacers preserve deep horizontal offsets;
- remount minimum based on the current measured virtual item prevents ordinary shrink/regrow oscillation;
- a responsive max constraint can intentionally reduce/re-measure width without corrupting offsets.

If native auto-layout cannot provide stable behavior, change only the database presentation model before considering per-cell geometry caches.

## Accessibility capability

For partial DOM prove with the lowest faithful real-browser accessibility surface:

- native table semantics remain present;
- full logical `aria-rowcount` / `aria-colcount` are exposed;
- visible logical rows/columns expose correct `aria-rowindex` / `aria-colindex`;
- presentation spacers/fill cells do not become logical data;
- no ARIA `grid` conversion is required.

## Native-table failure threshold

Do not abandon native table flow for cosmetic inconvenience or a narrow CSS/measurement normalization.

Treat native flow as blocked only when a required contract cannot be made reliable in Chromium and Firefox without substantial custom geometry machinery, for example:

- spacer rows cannot maintain correct deep offsets with dynamic heights;
- row size cannot be normalized to actual consumed height;
- spacer columns plus native layout cannot maintain stable measured widths;
- required accessibility semantics cannot coexist with bounded rendering.

## Fallback DOM model

If native flow is blocked, preserve the rest of the architecture and change only database presentation:

1. keep semantic table tags where possible;
2. use virtualization-compatible CSS layout for sections/rows/cells, including grid/flex/positioned rows where needed;
3. keep TanStack as the only range/measurement engine;
4. keep stable keys, explicit scroll roots, service/worker contracts, and product ownership unchanged;
5. preserve logical table accessibility metadata.

A fully custom div/ARIA-grid model is a last resort and requires a new architecture decision.

## Product integration proof after capability gate

Do not implement these in synthetic capability fixtures. They belong to the real database migration:

- actual `.database-view` top-level scroll root and table `scrollMargin` wiring;
- actual sticky header/action behavior;
- actual `EditableInlineValue` draft capture on virtual eviction and view switch;
- actual relation/nested-view axis-root wiring;
- toolbar/`after` movement out of table semantics;
- full/filtered membership and sorting;
- desktop/mobile product behavior;
- performance measurements and `30,000 × 300` bounded-rendering acceptance.

If the production integration reveals a new geometry fact that invalidates the capability architecture, stop and update architecture rather than adding workaround layers.

## Proof placement

The capability preflight fixes exact paths. Intended ownership:

- shared adapter Storybook fixture/spec: `src/shared/ui/virtualization`;
- native-table synthetic fixture/spec: `src/entities/databaseData`;
- existing Storybook behavior lane remains Chromium authoritative for ordinary reusable proof;
- a narrowly scoped Firefox project is added only for the virtualization capability specs, not for the entire Storybook suite.

Do not create a second general browser-test framework.

## Evidence recording

Record capability outcome in `docs/database-virtualization-capability-result.md` with:

- exact TanStack version installed;
- browser/version for Chromium and Firefox;
- pass/fail for each required contract;
- any narrow adapter/browser normalization introduced;
- whether native table flow is accepted or fallback DOM architecture is required;
- unresolved blockers, if any.

Do not turn this result document into a benchmark framework or copy raw traces into repository docs.

## Exit criterion

Production database migration may begin only when:

- shared adapter capability passes;
- native-table capability passes in Chromium;
- Firefox has a proven dynamic row-measurement path without fixed-size assumptions;
- no selected path requires a second Mioframe virtualization engine/cache;
- capability result records `ready`;
- database production-migration preflight is then written against the proven DOM/measurement path.

If native flow fails but the semantic-table CSS-layout fallback passes, update `docs/database-virtualization.md` to select that fallback before production migration.
