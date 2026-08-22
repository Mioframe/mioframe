# Database virtualization profiling and analysis plan

Status: **research plan; virtualization, TanStack engine, and native-table-first integration are fixed; baseline not yet captured; secondary optimizations unresolved**.

`docs/virtualization-library.md` owns the generic axis contract. `docs/database-virtualization.md` owns database rendering architecture. This document owns controlled evidence.

Profiling has four jobs:

1. quantify the current defect and scaling curve;
2. prove the selected Mioframe/TanStack adapter behavior;
3. prove the selected native-table database integration;
4. determine whether any optimization beyond bounded rendering is justified.

Profiling does **not** decide whether to virtualize, which engine to use, or whether to invent a different rendering architecture unless a focused capability proof demonstrates that the accepted native-table integration is impossible.

## Core evidence model

Keep three proof classes separate.

### Structural scalability

Prove mounted work does not scale with total logical collection size after virtualization.

Primary invariant:

> For fixed viewport and overscan, mounted expensive UI is bounded independently of total logical rows and columns.

### Responsiveness

Measure how long the real view-switch interaction prevents the main thread from processing another task/frame.

### Attribution

Only when needed, identify whether remaining cost is in:

- worker query computation;
- worker→main delivery;
- Vue/reactive/component setup;
- DOM insertion;
- style/layout;
- paint/composite;
- virtualization measurement/reflow.

Structural proof is the strongest persistent regression contract because it is substantially less hardware-sensitive than wall-clock timing.

## Principles

- measure current implementation before production rendering changes;
- use deterministic data and record its exact shape;
- use a real browser for geometry, scrolling, ResizeObserver, accessibility, and responsiveness evidence;
- keep fixture generation/import outside the measured action window;
- measure interaction time from inside the page;
- keep expensive CDP tracing out of ordinary timing samples;
- never hide slow samples with retries, sleeps, timeout inflation, or selective deletion;
- stop pre-virtualization scale growth before an already-proven unbounded renderer OOMs;
- optimize only a measured remaining bottleneck after virtualization.

## Controlled browser environment

Use the existing production-equivalent Vite build/preview Playwright path.

Performance research runs:

- Chromium;
- one worker;
- retries disabled;
- Playwright trace/video/screenshots disabled for successful measured samples;
- fixed documented browser build, OS/container, viewport, and command for a comparison series;
- fresh context/page per independent dataset case;
- cold first switch reported separately from warmed repeated switches.

Normal product correctness still follows repository desktop/mobile applicability. A mobile-sized viewport is a controlled layout constraint, not a physical mobile CPU simulation.

Optional CPU throttling may be used only as a secondary comparative sensitivity run with the same factor for baseline/candidate and separate reporting.

## Deterministic large-document setup

Do not create tens of thousands of rows through UI loops.

Preferred setup:

1. deterministically generate a current-schema Mioframe database JSON document;
2. validate through current production schema/builders;
3. import through the existing document-import boundary, or the narrowest equivalent valid persisted-state test boundary;
4. open the document in a short filtered view;
5. perform the measured short→full view switch through real UI.

Fixture contains before open:

- short filtered view: about 20 rows;
- full view over the same dataset.

Record per case:

- deterministic seed/IDs/content;
- rows/columns;
- property types;
- sparse/dense ratio;
- relation fan-out where used;
- filter/sort definitions;
- beginning/middle/end sentinels;
- variable-size content shape.

Setup/import time is excluded from switch responsiveness metrics.

Do not add a production debug/seeding API solely for profiling.

## Dataset matrix

### Control

| Case | Rows | Columns | Density | Purpose |
| --- | ---: | ---: | --- | --- |
| S0 | 100 | 8 | representative | sanity/control |

### Row scale

| Case | Rows | Columns | Purpose |
| --- | ---: | ---: | --- |
| R1 | 1,000 | 8 | small growth |
| R2 | 3,000 | 8 | material growth |
| R3 | 10,000 | 8 | large pre-virtualization step |
| R4 | 30,000 | 8 | required final baseline |
| R5 | 100,000 | 8 | post-fix stress only if useful |

R4 is mandatory for final solution. Current implementation may hit a safety stop before it; that is valid evidence.

### Column scale

| Case | Rows | Columns | Purpose |
| --- | ---: | ---: | --- |
| C1 | 100 | 10 | control |
| C2 | 100 | 50 | horizontal growth |
| C3 | 100 | 100 | large-column baseline |
| C4 | 100 | 300 | target-like columns |
| C5 | 100 | 1,000 | post-fix stress |

Include varying headers and body content widths.

### Combined logical grid

| Case | Rows | Columns | Density | Purpose |
| --- | ---: | ---: | --- | --- |
| G1 | 30,000 | 300 | sparse/default-heavy | prove bounded rendering for 9,000,000 logical intersections |

Do not require unvirtualized implementation to complete G1. G1 is mandatory once bounded rendering exists.

Optional later stress only when useful:

- 100,000 × 1,000 sparse logical grid.

### Dense data cases

Keep logical-grid rendering separate from persisted-value density:

- 30,000 × 8 representative stored values;
- 3,000 × 100 representative stored values.

Do not create millions of persisted values without evidence that CRDT/storage density belongs in scope.

### Dynamic content / relation case

Include separately:

- variable-height strings;
- at least one recursive relation value;
- deep row and deep property;
- post-mount content-height change;
- body content that can widen a currently visible column;
- representative nested relation horizontal scrolling.

Large nested-relation fan-out is not a separate target unless later evidence makes it one.

## Pre-virtualization stop conditions

Stop scaling current full-render implementation when any occurs:

- renderer crash/OOM;
- one switch-associated main-thread block exceeds 5 seconds;
- declared DOM/cell safety ceiling is reached after O(N×P) growth is unambiguous;
- measurement sentinel/control channel cannot run within research timeout;
- memory makes next step unsafe.

Record last completed and first failed/aborted cases. Do not weaken stop rules only to force a nominal scale number.

## Lightweight responsiveness harness

Install before the measured interaction.

### Start marker

Attach a one-shot capture-phase listener to the actual view selection action and record browser `performance.now()` at click dispatch.

Do not use Playwright command duration as primary timing.

### Event-loop yield

Schedule a `MessageChannel` callback at interaction start.

`eventLoopYieldMs` = elapsed time until it can execute.

This is the primary freeze metric.

### Frame opportunity

Schedule `requestAnimationFrame` markers and record first frame opportunity, optionally a second follow-up frame. Do not call rAF exact paint completion.

### Long tasks

Use `PerformanceObserver('longtask')` inside the bounded switch window.

Record:

- max duration;
- count;
- total duration.

Use the same 50 ms long-task concept already used by Mioframe metrics.

### Target usable

Define a deterministic no-sleep condition such as:

- full view selected;
- expected first visible row/cell actionable;
- target scroll/table geometry established.

Record `switchToUsableMs` separately from main-thread yield.

## Structural measurements

Record where relevant:

- logical rows/columns;
- mounted data rows;
- mounted property headers;
- mounted data cells;
- visible/overscan ranges;
- total DOM delta when useful.

Persistent proof after virtualization must show, for fixed viewport/geometry:

- orders-of-magnitude more rows do not proportionally increase mounted rows;
- more properties do not proportionally increase mounted headers/cells;
- combined logical grid does not materialize its cross product.

Assert observable DOM/product structure, not private TanStack internals.

## Chromium attribution

Use CDP only for selected diagnostic cases.

### `Performance.getMetrics`

Collect full metric maps immediately before/after selected switch windows. Treat metric names as diagnostic data, not Mioframe public contracts.

### Short `Tracing` window

When attribution is still unclear, trace only the bounded interaction and classify:

- renderer/event tasks;
- JS;
- style/layout;
- paint/composite;
- worker activity when represented.

Raw trace remains task-specific evidence.

Playwright trace is for test debugging, not CPU/layout profiling, and stays disabled during measured samples.

## Shared TanStack adapter proof

This validates `docs/virtualization-library.md` independently of database presentation.

Prove in a real browser:

- 10,000+ logical items with bounded mounted items;
- variable vertical sizes;
- variable horizontal sizes;
- repeated post-mount resize;
- deep `scrollToIndex`;
- stable correction when an earlier item resizes;
- `scrollMargin` with content before the virtual surface;
- start/end scroll padding;
- cleanup/remount and scroll-root replacement;
- two axes sharing one scroll root.

If this proof fails, correct adapter misuse first. Reopen engine selection only for a blocking incompatibility requiring substantial Mioframe virtualization machinery.

## Native-table database capability proof

This proof closes the remaining implementation gate in `docs/database-virtualization.md`.

### Vertical native-table virtualization

Prove:

- top and bottom spacer rows represent virtual extent without normal table borders/padding;
- only viewport+overscan logical rows mount;
- `<tr>` dynamic `measureElement` works with current table styles;
- relation/wrapped content can change row height after mount;
- correction remains stable when an earlier row changes height.

### Horizontal native-table virtualization

Prove:

- left/right spacer columns preserve horizontal offsets;
- only viewport+overscan property headers/cells mount;
- visible header and body use exactly the same property range;
- native table layout lets currently mounted body content influence the corresponding header width;
- horizontal `measureElement(<th>)` observes that final column width;
- the TanStack stable-key size from a prior mount can be used as the remount minimum so ordinary scrolling does not cause repeated shrink/regrow;
- responsive max constraints can intentionally cap/re-measure without corrupting offsets;
- optional presentation filler can preserve fill-to-viewport behavior without becoming a logical property.

This proof decides exact CSS mechanics, not architecture. If a specific spacer/filler CSS technique fails, try the simplest equivalent native-table technique before abandoning native markup.

### Sticky surfaces and scroll geometry

Prove:

- top-level database continues to use existing `.database-view` physical scroll root;
- `DatabaseViewLayout` observes that real root rather than the table element;
- virtual surface `scrollMargin` stays correct when content above table appears/disappears;
- sticky header works with vertical virtual padding;
- sticky action column remains reachable with horizontal virtual padding;
- deep navigation uses appropriate scroll padding so sticky surfaces do not hide targets.

### Editing lifecycle

Prove current cell-local edit owner can deterministically:

1. capture draft;
2. commit/close on relevant scroll or view switch;
3. do so before virtual DOM eviction of the anchor cell;
4. preserve Escape cancellation semantics.

If event/update ordering cannot guarantee this, record the failure and lift only active edit-session state to the nearest truthful database presentation owner. Do not add generic virtualizer pinning first.

### Accessibility

With partial DOM and spacer rows/cells prove:

- native table semantics remain exposed;
- spacer/fill elements are absent from meaningful accessibility structure;
- `aria-rowcount` reflects header + logical rows;
- visible logical rows expose correct `aria-rowindex`;
- `aria-colcount` reflects logical properties plus action column when present;
- visible property/action cells expose correct logical `aria-colindex`;
- removal of current list/listitem overrides does not regress required interactions.

### Nested relation topology

Prove representative recursive relation rendering with:

- inherited parent vertical scroll root;
- current relation-local horizontal scroll surface when horizontal overflow exists;
- independent axis margins relative to their roots;
- parent row remeasurement when nested relation content changes;
- no interference between parent and nested virtual ranges.

Exact ref/provide/prop plumbing is implementation-preflight detail.

## Worker/service analysis

Do not redesign worker API during baseline.

Measure when material:

1. deterministic filter-only/sort-only/filter+sort scaling where separable;
2. output count/order checksums/sentinels;
3. browser switch profile for actual contribution;
4. narrow research instrumentation/CDP only if needed.

Node/Vitest timing is for algorithmic scaling, not a replacement for browser Worker timing.

Only consider indexes, batching, paging, or range protocols after evidence shows the current complete-result contract is a material remaining bottleneck.

## Cell reactive/subscription analysis

Known repeated cell reads are not sufficient reason to change architecture.

After bounded rendering, measure:

- mounted cells;
- script cost mounting a fresh range;
- script cost scrolling into unseen ranges;
- edit responsiveness;
- subscription/query counts only through a non-invasive test seam if useful.

Decision:

- acceptable → keep current read contracts;
- material → design the narrowest owner-correct optimization;
- no generic batch API without evidence.

## Repetition and statistics

For timing comparisons:

- fresh context/page per independent case;
- cold switch separate;
- small pilot to estimate variance;
- same fixed repetition count baseline vs candidate;
- median and worst at minimum;
- identical browser/environment/viewport/dataset/throttling;
- raw samples retained;
- no unexplained sample deletion.

## Result artifact

Emit machine-readable JSON containing at least:

```text
commit/ref
environment/browser
viewport/project
CPU throttling
case ID
rows/columns/density/property mix/filter/sort
cold/warm

eventLoopYieldMs
firstFrameOpportunityMs
switchToUsableMs
maxLongTaskMs
longTaskCount
longTaskTotalMs
mountedRows
mountedColumns
mountedCells
available CDP deltas
memory/heap when available
trace artifact reference when collected
```

A small task-specific summarizer may aggregate results. Do not build a generic benchmark framework.

## Comparison order

1. current unvirtualized baseline;
2. accepted TanStack/native-table bounded virtualization;
3. rerun identical cases;
4. analyze visible-range cell cost only if still material;
5. analyze worker/query/transfer only if still material;
6. stop when no material bottleneck remains.

## Research targets

Until variance is characterized, treat as research targets rather than permanent CI budgets:

- no switch-associated main-thread block above **100 ms**;
- preferred individual slices at or below **50 ms**;
- mounted rows independent of total rows for fixed viewport/geometry;
- mounted columns/cells independent of total columns for fixed viewport/geometry.

Wall-clock metrics become persistent gates only after repeated controlled runs show useful signal and acceptable variance. Structural bounded-rendering assertions should remain permanent regardless.

## Final correctness around performance

A faster solution is invalid unless it still proves:

- exact filter membership;
- exact sort order;
- short→full→short switching;
- no stale old-view cells;
- deep vertical/horizontal scrolling;
- sentinel row/property correctness;
- inline editing without silent draft loss;
- dynamic row/column measurement correctness;
- sticky actions/header behavior;
- representative recursive relation behavior;
- logical accessibility counts/indices.

## Exit criteria

### Before production implementation preflight closes

- safe current row/column scale baseline or scale-to-failure boundary recorded;
- main-thread freeze quantified;
- shared TanStack adapter proof passes;
- native-table vertical/horizontal measurement proof passes;
- scroll-margin/sticky proof passes;
- edit lifecycle proof passes or the narrow fallback owner is selected;
- accessibility proof passes;
- representative nested relation topology passes;
- exact production/test files are selected.

### Before final performance acceptance

- G1 (`30,000 × 300`) succeeds with bounded mounted work;
- structural invariants are persistent browser assertions;
- worker compute/delivery is classified acceptable or receives a separately justified architecture change;
- visible-range cell cost is classified;
- timing budgets are finalized only where stable.

Virtualization, TanStack, and native-table-first ownership are not reopened by ordinary timing results. Only a demonstrated capability incompatibility can reopen the relevant integration decision; all other findings feed evidence-gated secondary optimization.
