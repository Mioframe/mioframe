# Database virtualization profiling and analysis plan

Status: **research plan; baseline not yet captured**.

This document defines the controlled investigation required before `docs/database-virtualization.md` can become implementation-ready. The same working branch will contain research, the final architecture update, virtualization, any measured follow-up optimizations, and their proof.

## Purpose

Determine where large database view-switch latency occurs, establish reproducible performance evidence, prove the minimum virtualization capabilities Mioframe needs, and decide whether any optimization beyond bounded rendering is required.

Performance analysis must be reproducible from automated tests. Physical-device observations may later provide supplemental confidence, but they are not the source of truth for architecture or acceptance.

## Core measurement model

Do not reduce the defect to one end-to-end stopwatch value. The investigation has three separate proof layers:

1. **Structural scalability** — prove how mounted work grows with logical rows and columns.
2. **Responsiveness** — measure how long the browser main thread is unavailable after the real view-switch interaction.
3. **Attribution** — only when needed, identify whether time is spent in worker computation, main-thread script/reactivity, DOM work, style/layout, paint, or dynamic measurement.

Structural scalability is the strongest persistent contract because it is substantially less hardware-sensitive than wall-clock timing.

The intended final rendering invariant remains:

> For a fixed viewport and overscan policy, mounted UI work is bounded independently of the total logical row and column count.

## Principles

- Measure the current implementation before changing production rendering.
- Use deterministic generated data and record the exact data shape for every result.
- Use a real browser for layout, scrolling, resizing, long-task, paint, and responsiveness evidence.
- Keep data setup outside the measured action window.
- Measure browser time from inside the page, not from Playwright/Node command round-trip time.
- Do not run expensive tracing during ordinary timing samples.
- Do not optimize a layer until measurements show that layer is material.
- Do not promote timing numbers to CI budgets until variance is understood.
- Never hide a slow sample with retries, sleeps, timeout inflation, or sample deletion.
- Stop a pre-virtualization scale run before it creates an unsafe renderer/DOM footprint; scale-to-failure is evidence, not a reason to OOM the browser.

## Existing path under test

Current flow:

```text
real view-selection interaction
    ↓
DatabaseViewWidget / DatabaseViewLayout
    ↓
useDatabaseData
    ↓
worker filteredIdList
    ↓
filter + sort + complete ordered item IDs
    ↓
worker/main delivery
    ↓
Vue reactive update
    ↓
DatabaseDataTable
    ↓
all rows × all properties
    ↓
cell component setup / subscriptions
    ↓
DOM insertion
    ↓
style + layout + paint
```

The analysis must be able to distinguish, when relevant:

1. worker query computation;
2. worker-to-main delivery;
3. Vue/component/reactive setup;
4. DOM creation/insertion;
5. style recalculation/layout;
6. paint/composite;
7. candidate virtualizer measurement/reflow work.

## Controlled browser environment

Use the existing Playwright application path and production-equivalent built/previewed app. Current application E2E already builds and previews Vite output and runs Chromium desktop and mobile-sized projects with shared-origin OPFS isolation and non-parallel files.

For performance research runs, keep a narrower deterministic execution mode:

- Chromium only for timing and CDP attribution;
- one worker;
- retries disabled;
- Playwright trace/video/screenshots disabled during measured successful runs;
- one documented browser build, OS/container image, viewport, and command per comparison series;
- new browser context/page for each independent dataset case;
- cold first switch reported separately from warmed repeated switches.

Normal product correctness remains covered by the repository's desktop/mobile project model. A mobile viewport is a layout/interaction constraint, not a claim that desktop Chromium timing equals a physical mobile CPU.

### Optional CPU sensitivity run

A fixed Chromium CPU-throttling factor may be used as a **comparative sensitivity run** after the unthrottled baseline is captured.

Rules:

- one fixed factor for baseline and candidate;
- report throttled and unthrottled results separately;
- never tune the factor to make a threshold pass;
- do not treat throttling as a physical-device simulation.

## Deterministic large-document setup

Do not create tens of thousands of rows or hundreds of properties through UI loops.

Preferred setup direction:

1. generate a current-schema Mioframe database JSON document from deterministic test data;
2. validate the generated document through current production schema/builders before use;
3. import it through the existing document-import boundary, or use the narrowest existing repository test boundary that establishes the same valid persisted state without shipping a debug API;
4. open the imported document in a **small filtered default view**;
5. perform the action under measurement — switching to the full view — through the real user UI.

The existing JSON import feature is preferable to inventing a new production seeding API because it already accepts validated Mioframe JSON and delegates persistence to the repository service.

The fixture must include both views before the application opens the database:

- a short filtered view with approximately 20 rows, used as the initial stable state;
- a full view over the same dataset, used as the measured target.

This prevents fixture setup and initial full-table materialization from contaminating the switch measurement.

Dataset generation requirements:

- deterministic IDs/content/seed;
- explicit row count and property count;
- explicit property-type mix;
- explicit sparse/dense ratio;
- explicit relation fan-out where used;
- explicit filter and sort definitions;
- sentinel values/IDs near start, middle, and end;
- short and long content for dynamic-size cases;
- setup/import time recorded separately and excluded from responsiveness metrics.

Do not add a production debug/data-generation API solely for performance tests.

## Dataset matrix

Use staged growth. Do not jump directly to the largest logical grid on the unvirtualized implementation.

### Control

| Case | Rows | Columns | Density | Purpose |
| --- | ---: | ---: | --- | --- |
| S0 | 100 | 8 | representative | sanity/control |

### Row scale

Keep the column shape stable.

| Case | Rows | Columns | Purpose |
| --- | ---: | ---: | --- |
| R1 | 1,000 | 8 | small growth |
| R2 | 3,000 | 8 | reproduce material growth |
| R3 | 10,000 | 8 | large pre-virtualization step |
| R4 | 30,000 | 8 | required target scale |
| R5 | 100,000 | 8 | post-fix stress only unless prior evidence shows it is safe/useful |

R4 is required for the final solution. The current implementation may hit a stop condition before R4; that itself is a baseline finding.

### Column scale

Keep row count low enough to isolate horizontal growth.

| Case | Rows | Columns | Purpose |
| --- | ---: | ---: | --- |
| C1 | 100 | 10 | control |
| C2 | 100 | 50 | horizontal growth |
| C3 | 100 | 100 | large-column baseline |
| C4 | 100 | 300 | target-like high column count |
| C5 | 100 | 1,000 | post-fix stress / candidate capability |

Column content must vary in intrinsic size so fixed-width assumptions cannot accidentally pass.

### Combined logical grid

Final mandatory candidate case:

| Case | Rows | Columns | Density | Purpose |
| --- | ---: | ---: | --- | --- |
| G1 | 30,000 | 300 | sparse/default-heavy | prove bounded UI on 9,000,000 logical intersections |

Do **not** require the current unvirtualized implementation to complete G1. Before virtualization, use an increasing combined series only until the scale trend is established or a stop condition is reached. G1 becomes mandatory once bounded rendering exists.

Optional later stress case, only if useful after G1 is healthy:

- 100,000 rows × 1,000 columns, sparse logical grid.

This is not a product guarantee; it probes whether hidden O(N) or O(N×P) UI work remains.

### Dense storage cases

Rendering a sparse logical grid and storing millions of values are different concerns.

Use separate dense cases to detect worker/data-read bottlenecks without conflating them with 2D rendering:

- 30,000 rows × 8 representative stored properties;
- 3,000 rows × 100 representative stored properties.

Do not create 9,000,000 persisted values unless a later measurement establishes that CRDT/storage density is itself in scope.

### Dynamic-content case

Keep variable geometry separate from raw scale:

- variable-height string content;
- at least one relation property;
- a deep row away from the top;
- content that changes height after edit/expansion;
- columns whose measured content widths differ materially;
- a deep horizontal column.

## Pre-virtualization stop conditions

The current implementation has nested full row/property rendering, so some scale combinations can produce an unsafe DOM footprint. Research must fail safely.

Stop increasing a baseline series when any of these is observed:

- renderer crash/OOM or browser becomes unable to complete the test cleanly;
- one measured switch-associated main-thread block exceeds 5 seconds;
- rendered cell count reaches a predeclared research safety ceiling where the O(N×P) trend is already unambiguous;
- the browser cannot process the measurement sentinel or test control channel within the research timeout;
- memory growth makes the next scale step unsafe.

Record the last completed case and first failed/aborted case. Do not weaken the stop condition merely to obtain a nominal 30k/300-column baseline on an architecture already proven unbounded.

## Lightweight responsiveness harness

Ordinary samples must use a lightweight in-page harness installed before the measured interaction.

### Measurement start

Attach a one-shot capture-phase listener to the exact view-selection element immediately before the switch. The listener records `performance.now()` in the browser at the start of the real click event.

Do not use Playwright-side `Date.now()` or the duration of `locator.click()` as the primary metric; those include automation/protocol scheduling outside the page.

### Event-loop yield

At interaction start, schedule a `MessageChannel` callback (or equivalent same-purpose next-task primitive). Record how long it takes to execute.

`eventLoopYieldMs` measures how long the current click task plus its microtasks keep the main thread unavailable before the browser can process another task.

This is the primary responsiveness metric for the freeze defect.

### Frame opportunity

Also schedule `requestAnimationFrame` markers:

- time to first frame opportunity after the switch;
- optionally a second animation frame as a stable post-paint-adjacent observation point.

Do not label rAF time as exact paint completion; use it to detect whether the application permits rendering opportunities during work.

### Long tasks

Install a `PerformanceObserver` for `longtask` before the action and collect only entries whose timestamps overlap the bounded switch measurement window.

Record:

- maximum long-task duration;
- long-task count;
- total long-task duration.

Mioframe already treats >50 ms as a long task in `usePerformanceMetrics`; research should use the same browser concept rather than inventing another threshold.

### Viewport usable marker

Define a browser-observable target-view readiness condition without arbitrary sleeps. Candidate examples, finalized after the fixture shape is known:

- selected full view state reflected;
- expected first viewport row/cell exists and is actionable;
- scroll container geometry for the target view is established.

Record `switchToUsableMs` separately from `eventLoopYieldMs`.

A solution may take longer to finish background/worker preparation while still being acceptable if the main thread remains responsive and the visible viewport is usable.

## Structural measurements

For each relevant case record:

- logical rows;
- logical columns;
- mounted/rendered row count;
- mounted/rendered data-cell count;
- mounted header/property count;
- total DOM node count delta when useful;
- visible/overscan range sizes once virtualization exists.

After virtualization, permanent browser proof should establish that, for a fixed viewport and dataset geometry class:

- increasing rows by orders of magnitude does not proportionally increase mounted rows;
- increasing columns by orders of magnitude does not proportionally increase mounted columns/cells;
- combined logical grid size does not materialize the complete matrix.

Prefer this structural proof over brittle assertions on internal virtualizer methods or exact render counts.

## Attribution: CDP metrics and tracing

Use Chromium CDP only for selected diagnostic runs, not every timing sample.

Playwright supports raw CDP sessions for Chromium. Chrome exposes Performance and Tracing domains. This makes it possible to capture a narrow profile around the real interaction without adding production diagnostics.

### Low-overhead CDP metric deltas

For selected runs, collect available `Performance.getMetrics` values immediately before and after the switch window and store the full returned metric map.

Where the browser exposes them, compare deltas for script/task/layout/style-related metrics and heap/node counts. Treat metric names as diagnostic browser data, not as a stable Mioframe public contract.

### DevTools performance trace

When attribution is still unclear, start a CDP `Tracing` recording immediately before the interaction and stop it immediately after the bounded target window.

Use it to classify renderer and worker work such as:

- long renderer tasks / event dispatch;
- JavaScript execution;
- style recalculation;
- layout;
- paint/composite;
- worker-thread execution when represented in the trace.

Aggregate trace categories/events into a small result summary and retain the raw trace only as task-specific diagnostic evidence.

Do not create a permanent test that asserts Chromium trace-event names unless a later stable tooling contract is intentionally adopted.

### Playwright trace is not the performance profiler

The normal Playwright trace is useful for test debugging, actions, DOM snapshots, network, and failure diagnosis, but trace capture itself adds overhead and is not the source for CPU/layout attribution.

Measured performance runs therefore keep Playwright tracing off. A separate non-measured reproduction may enable it when debugging a failing scenario.

## Worker/service analysis

Do not redesign the worker API during baseline collection.

Measure the data-query side separately from UI rendering:

1. deterministic service-level scaling for filter-only, sort-only, and filter+sort where cleanly separable;
2. output ID count and ordering checksum/sentinels;
3. browser end-to-end view-switch profile to see whether worker activity is material relative to main-thread rendering;
4. if worker work is material, use selected CDP traces and/or narrowly scoped temporary research instrumentation before proposing a new contract.

Absolute Node/Vitest timing must not be treated as equivalent to browser Worker timing. Service-level tests are primarily useful for algorithmic scaling and relative comparisons.

Only consider worker indexes, batching, range protocols, or paging after evidence shows the current complete-result contract is a meaningful remaining bottleneck.

## Candidate virtualization capability research

The current external-engine candidate is `@tanstack/vue-virtual`; this is not yet a final dependency decision.

The capability experiment must prove dynamic sizing rather than fixed dimensions.

### Dynamic vertical axis

Prove:

- very large logical count with bounded DOM;
- different initial item heights;
- actual DOM measurement after mount;
- size changes after mount;
- deep scroll/navigation;
- stable viewport when an item before the viewport changes size;
- bounded overscan.

### Dynamic horizontal axis

Prove the same properties for variable widths.

### Two-axis composition

Prove with one shared scroll container:

- independent vertical and horizontal ranges;
- deep row and deep column reachable;
- mounted cells bounded by viewport area rather than logical grid area;
- column-size changes cause required visible-row remeasurement;
- row-size changes update vertical geometry;
- no hidden full-grid render for measurement;
- scroll anchoring remains acceptable during measurement correction.

Reject the candidate if Mioframe must implement a substantial custom offset tree, hidden full-content measurement, or parallel virtualizer engine around it.

## Dynamic column-sizing research

Horizontal virtualization cannot know the intrinsic width requirement of cells that have never rendered. The architecture must therefore define explicit semantics rather than pretending to reproduce native full-table auto layout.

Prototype the minimum policy:

1. unseen column starts from a provisional estimate;
2. header and rendered cells report actual requirements;
3. discovered width updates the column's ephemeral measurement state;
4. hidden rows/columns are never mounted just for sizing;
5. width changes reflow and remeasure visible rows;
6. deep horizontal/vertical scroll remains anchored;
7. repeated scrolling does not cause destructive width oscillation.

Current hypothesis: discovered widths are grow-only within a clearly defined view/session lifetime, subject to explicit min/max policy. The experiment must decide:

- whether grow-only is visually acceptable;
- reset boundary for measurements;
- whether property identity carries measurement across sort/filter changes;
- header/content min/max policy;
- behavior when content shrinks;
- behavior across viewport resize.

Do not persist widths without a separate product requirement.

## Cell reactive/subscription analysis

Source inspection already shows multiple observable reads can be created per editable cell. Do not optimize this merely because it exists.

After bounded rendering exists, measure the visible-range cost:

- mounted cells;
- scripting time to create a fresh visible range;
- scripting time while scrolling into unseen rows/columns;
- edit responsiveness;
- query/subscription counts only if a non-invasive test seam can observe them.

Decision:

- acceptable visible-range cost → keep existing read contracts;
- material visible-range cost → design the narrowest owner-correct read optimization;
- do not introduce a generic batch API solely to reduce call count.

## Repetition and statistics

For each timing comparison:

- one new context/page per dataset case;
- report the first/cold switch separately;
- perform a small fixed pilot of warmed switches to estimate variance;
- then use one fixed repetition count for baseline and candidate comparison;
- report median and worst observed sample at minimum; include percentile statistics only when sample count makes them meaningful;
- keep browser build, environment, viewport, dataset, and throttling identical;
- never discard a slow sample unless an unrelated cause is independently demonstrated and recorded.

The research result must store raw per-run values in addition to summaries.

## Result artifact

Each profiling run should emit machine-readable JSON through the test result/artifact mechanism rather than only console prose.

Record at least:

```text
commit/ref
environment/browser
viewport/project
CPU throttling
case ID
rows/columns/density/property mix/filter/sort
cold or warm run

eventLoopYieldMs
firstFrameOpportunityMs
switchToUsableMs
maxLongTaskMs
longTaskCount
longTaskTotalMs
mountedRows
mountedColumns
mountedCells
available CDP metric deltas
memory/heap data when available
trace artifact reference when collected
```

A small summarizer may aggregate raw artifacts into a table for architecture review. Do not make the summarizer a generic benchmark framework.

## Candidate comparison discipline

Evaluate one material change at a time where practical:

1. current baseline;
2. bounded virtualization candidate;
3. remeasure identical cases;
4. only then profile cell subscription/read cost;
5. only then profile worker/query/transfer changes if still material.

This avoids accepting a bundle of optimizations without knowing which complexity is necessary.

## Decision tree

### A. Unbounded DOM/component materialization dominates

Implement two-axis dynamic virtualization as the minimum required fix.

### B. Virtualized visible-range setup remains expensive

Profile and reduce measured duplicate/unnecessary cell reads only.

### C. Worker filter/sort becomes the dominant 30k cost

Design a worker-owned query optimization while preserving UI virtualization. Prefer improving the existing complete-result contract before introducing range/paging protocols.

### D. Worker-to-main delivery is material

Quantify it before changing the public query contract. Any range protocol must explicitly resolve source of truth, ordering, invalidation, and cancellation.

### E. Dynamic measurement/layout becomes dominant

Simplify the sizing policy or adapter integration before adding caches/state. Fixed dimensions are not an allowed escape hatch.

Several branches can ultimately apply, but each additional optimization needs separate measured evidence.

## Initial responsiveness targets

Use these as research targets, not yet as permanent CI budgets:

- no switch-associated main-thread block above **100 ms** in the controlled acceptance environment;
- preferred individual main-thread slices at or below the browser long-task threshold of **50 ms**;
- mounted rows independent of total row count for a fixed viewport/geometry class;
- mounted columns/cells independent of total column count for a fixed viewport/geometry class.

A wall-clock metric becomes a persistent regression gate only when repeated runs show that the controlled environment provides enough signal with low enough variance. Structural bounded-rendering contracts should become persistent browser assertions regardless of whether absolute timing is promoted.

## Correctness around the performance scenario

A faster result is invalid unless the same product flow still proves:

- exact filtered membership;
- exact sorted order;
- short → full → short switching;
- no stale rows/cells from the previous view;
- deep vertical scrolling;
- deep horizontal scrolling;
- sentinel row/column correctness;
- editing a visible deep item;
- dynamic-height/width changes remain correct after remeasurement;
- scroll position remains stable enough during size correction;
- focus/edit lifecycle follows the final architecture contract.

Accessibility/focus behavior for virtualized elements must be resolved before the final implementation handoff and then proved in a real browser.

## Research exit criteria

Do not mark `docs/database-virtualization.md` ready until all are true:

- current row-scale baseline or scale-to-failure boundary is recorded;
- current column-scale baseline or scale-to-failure boundary is recorded;
- main-thread freeze is quantified with in-page responsiveness metrics;
- selected cases have enough attribution to distinguish worker vs main-thread script vs layout/paint;
- the candidate engine passes dynamic vertical, horizontal, two-axis, resize, and scroll-anchor experiments, or another design is chosen;
- full `30,000 × 300` sparse logical grid succeeds on the bounded-rendering candidate;
- dynamic column-sizing semantics are chosen;
- focus/edit lifecycle semantics are chosen;
- worker compute/delivery are classified as sufficient or assigned a measured architecture change;
- visible-range cell read/subscription cost is classified after virtualization;
- final performance budgets and environment ownership are selected;
- persistent structural proof vs task-specific timing/trace evidence is decided;
- exact test owners/paths are selected during implementation preflight;
- the architecture document is updated to remove resolved alternatives and becomes `ready`.

Until then, production architecture beyond the confirmed virtualization invariant remains intentionally open.