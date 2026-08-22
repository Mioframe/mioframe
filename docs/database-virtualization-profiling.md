# Database virtualization profiling and analysis plan

Status: **research plan; virtualization and `@tanstack/vue-virtual` are fixed decisions; baseline not yet captured; secondary optimizations unresolved**.

This document defines controlled performance investigation for large database rendering. `docs/database-virtualization.md` owns database rendering architecture; `docs/virtualization-library.md` owns the reusable TanStack-backed virtualization contract.

Profiling does **not** decide whether to virtualize or which engine to use. It has four jobs:

1. quantify the current defect and scale curve;
2. verify the selected Mioframe/TanStack integration under required dynamic geometry;
3. establish stable acceptance evidence for the virtualized implementation;
4. decide whether any optimization beyond bounded rendering is justified.

## Core measurement model

Do not reduce the problem to one end-to-end stopwatch value. Keep three proof layers separate:

1. **Structural scalability** — how mounted work grows as logical rows/columns grow.
2. **Responsiveness** — how long the main thread remains unavailable after the real user interaction.
3. **Attribution** — when needed, identify worker, script/reactivity, DOM, style/layout, paint, or measurement cost.

Structural bounded-rendering proof is the strongest persistent contract because it is much less hardware-sensitive than wall-clock timing.

Final rendering invariant:

> For a fixed viewport and overscan policy, mounted UI work is bounded independently of total logical row and column count.

## Principles

- measure the current implementation before production rendering changes;
- use deterministic generated data and record the exact data shape;
- use a real browser for geometry, scrolling, ResizeObserver, long-task, and responsiveness evidence;
- keep fixture creation outside the measured action window;
- measure interaction timing from inside the page, not Playwright command round-trip time;
- keep expensive tracing off ordinary timing runs;
- do not optimize a layer until measurements show it is material;
- do not promote noisy timing numbers to CI budgets before variance is known;
- never hide slow samples with retries, sleeps, timeout inflation, or selective deletion;
- stop pre-virtualization scale growth before an obviously unbounded implementation OOMs the renderer.

## Existing path under test

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
cell setup/subscriptions
    ↓
DOM + style + layout + paint
```

When relevant, attribution must distinguish:

- worker query computation;
- worker-to-main delivery;
- Vue/component/reactive setup;
- DOM creation/insertion;
- style/layout;
- paint/composite;
- TanStack-backed measurement/reflow after virtualization.

## Controlled environment

Use the existing Playwright application path and production-equivalent built/previewed app.

For performance research runs:

- Chromium only for timing/CDP attribution;
- one worker;
- retries disabled;
- Playwright trace/video/screenshots disabled during successful measured samples;
- one documented browser build, OS/container image, viewport, and command per comparison series;
- fresh context/page for independent dataset cases;
- cold first switch reported separately from warmed repeated switches.

Normal product correctness still follows the repository desktop/mobile applicability model. A mobile-sized viewport is a controlled layout/interaction constraint, not a physical-mobile CPU benchmark.

A fixed CPU-throttling factor may be used only as a secondary comparative sensitivity run, with throttled and unthrottled results reported separately.

## Deterministic large-document setup

Do not create tens of thousands of rows or hundreds of properties through UI loops.

Preferred setup:

1. deterministically generate a current-schema Mioframe database JSON document;
2. validate it through current production schema/builders;
3. import it through the existing document-import boundary, or use the narrowest existing repository test setup with equivalent valid persisted state;
4. open the database in a short filtered default view;
5. perform only the measured action — switching to the full view — through the real user UI.

The fixture contains both views before opening:

- short filtered view: approximately 20 rows;
- full view: same dataset without the restrictive filter.

Dataset metadata recorded per case:

- deterministic seed/IDs/content;
- rows/columns;
- property types;
- sparse/dense ratio;
- relation fan-out where applicable;
- filter/sort definitions;
- sentinels near beginning/middle/end;
- variable-size content shape.

Setup/import time is recorded separately and excluded from responsiveness metrics.

Do not add a production debug/seeding API solely for performance tests.

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

R4 is mandatory for the final solution. The current implementation may hit a safety stop before it; that is a valid baseline result.

### Column scale

| Case | Rows | Columns | Purpose |
| --- | ---: | ---: | --- |
| C1 | 100 | 10 | control |
| C2 | 100 | 50 | horizontal growth |
| C3 | 100 | 100 | large-column baseline |
| C4 | 100 | 300 | target-like column count |
| C5 | 100 | 1,000 | post-fix stress/integration proof |

Column content must vary in width so fixed-size assumptions cannot accidentally pass.

### Combined logical grid

| Case | Rows | Columns | Density | Purpose |
| --- | ---: | ---: | --- | --- |
| G1 | 30,000 | 300 | sparse/default-heavy | prove bounded rendering for 9,000,000 logical intersections |

Do not require the current unvirtualized implementation to complete G1. G1 is mandatory once bounded rendering exists.

Optional later stress only if G1 is healthy and the result answers a real question:

- 100,000 × 1,000 sparse logical grid.

### Dense storage cases

Keep storage/data traversal separate from logical-grid rendering:

- 30,000 × 8 representative stored properties;
- 3,000 × 100 representative stored properties.

Do not create millions of persisted values unless later evidence puts CRDT/storage density in scope.

### Dynamic-content case

Include separately:

- variable-height strings;
- at least one relation property;
- deep row and deep column;
- post-mount height change through supported edit/expansion behavior;
- columns with materially different measured width requirements.

## Pre-virtualization stop conditions

Stop increasing a baseline series when any of these occurs:

- renderer crash/OOM;
- one switch-associated main-thread block exceeds 5 seconds;
- a predeclared DOM/cell safety ceiling is reached after the O(N×P) trend is already clear;
- the browser cannot process the measurement sentinel/control channel within the research timeout;
- memory growth makes the next scale step unsafe.

Record the last completed and first failed/aborted cases. Do not weaken the stop condition merely to force a nominal 30k/300-column baseline through an already-proven unbounded renderer.

## Lightweight responsiveness harness

Install the harness before the measured interaction.

### Measurement start

Attach a one-shot capture-phase listener to the actual view-selection element and record `performance.now()` at real click dispatch.

Do not use Playwright-side timestamps or `locator.click()` duration as the primary metric.

### Event-loop yield

At interaction start, schedule a `MessageChannel` callback or equivalent next-task primitive.

`eventLoopYieldMs` = elapsed time until that callback runs.

This is the primary freeze metric because it directly measures how long the click task plus microtasks prevent the browser from processing another task.

### Frame opportunity

Schedule `requestAnimationFrame` markers and record:

- first frame opportunity after the switch;
- optionally a second frame marker for a stable follow-up observation.

Do not label rAF as exact paint completion.

### Long tasks

Use `PerformanceObserver('longtask')` and collect only entries overlapping the bounded measurement window.

Record:

- max long-task duration;
- count;
- total duration.

Use the same 50 ms browser long-task concept already used by Mioframe performance metrics.

### Target view usable

Define a deterministic browser-visible completion condition without sleeps, for example:

- full view selected;
- expected first visible row/cell exists and is actionable;
- target scroll-container geometry exists.

Record `switchToUsableMs` separately from `eventLoopYieldMs`.

## Structural measurements

Record where relevant:

- logical rows/columns;
- mounted rows;
- mounted data cells;
- mounted headers/columns;
- visible/overscan range sizes after virtualization;
- total DOM node delta when useful.

Permanent browser proof after virtualization should establish that, for a fixed viewport/geometry class:

- row count can grow by orders of magnitude without proportional mounted-row growth;
- column count can grow by orders of magnitude without proportional mounted-column/cell growth;
- combined logical grid size does not materialize the full matrix.

Prefer observable DOM bounds over assertions on private TanStack internals.

## Attribution with Chromium CDP

Use CDP only for selected diagnostic runs.

### Low-overhead metric deltas

Collect available `Performance.getMetrics` immediately before/after selected switch windows and store the full metric map. Treat metric names as diagnostic browser data, not a stable Mioframe contract.

### Short DevTools trace

When attribution remains unclear, record a narrow CDP `Tracing` window around the real switch.

Use it to classify:

- renderer/event-dispatch tasks;
- JavaScript execution;
- style recalculation;
- layout;
- paint/composite;
- worker activity when represented.

Raw trace is task-specific diagnostic evidence, not a permanent test contract.

### Playwright trace

Playwright trace is useful for test debugging, not CPU/layout profiling. Keep it disabled during measured performance samples because tracing itself adds overhead.

## Worker/service analysis

Do not redesign the worker API during baseline collection.

Measure separately when needed:

1. deterministic service scaling for filter-only, sort-only, and filter+sort where cleanly separable;
2. output count/order checksums/sentinels;
3. browser switch profile to see whether worker time is material;
4. narrow temporary research instrumentation or CDP attribution only if needed.

Node/Vitest timing is useful for algorithmic scaling, not as a substitute for real browser Worker timing.

Only consider worker indexes, batching, paging, or range protocols after evidence shows the current complete-result contract is a material bottleneck.

## Selected TanStack integration proof

`@tanstack/vue-virtual` is already selected by `docs/virtualization-library.md`.

This proof validates the Mioframe adapter and required browser behavior; it does not compare alternative libraries.

### Vertical dynamic axis

Prove:

- 10,000+ logical items with bounded DOM;
- different initial heights;
- DOM measurement after mount;
- repeated post-mount resize;
- deep `scrollToIndex`;
- stable viewport when an item before the viewport changes size;
- bounded overscan.

### Horizontal dynamic axis

Prove the equivalent contract for variable widths.

### Consumer-supplied size path

Prove Mioframe `setItemSize` correctly maps to TanStack `resizeItem` and updates horizontal geometry without creating a competing measurement source.

### Two-axis composition

With one shared scroll container prove:

- independent vertical/horizontal ranges;
- deep row and deep column reachable;
- mounted cells bounded by viewport area;
- column-size changes reflow/remeasure visible rows;
- row-size changes update vertical geometry;
- no hidden full-grid measurement render;
- acceptable anchoring during size correction.

### Failure handling

If a proof fails:

1. verify whether Mioframe used the supported TanStack contract correctly;
2. correct adapter misuse first;
3. contain a narrow engine limitation at the adapter boundary when that does not introduce a second virtualization algorithm;
4. reopen the dependency decision only if required behavior would otherwise force Mioframe to own substantial general-purpose virtualization machinery.

## Dynamic column-sizing research

Horizontal virtualization cannot know exact intrinsic requirements from never-rendered cells. Database semantics must therefore be explicit.

Prototype:

1. unseen column starts from provisional estimate;
2. header/rendered cells report current requirements;
3. database-owned discovered width updates ephemeral column state;
4. hidden rows/columns are never mounted only for sizing;
5. width changes reflow and remeasure visible rows;
6. deep scrolling remains anchored;
7. repeated scrolling does not cause destructive width oscillation.

Decide before database implementation preflight:

- grow-only vs shrink behavior within a view/session;
- reset boundary;
- whether property identity retains discovered width across filter/sort changes;
- min/max policy;
- content-shrink behavior;
- viewport-resize behavior.

Do not persist widths without a separate product requirement.

## Cell reactive/subscription analysis

Multiple observable reads per editable cell are known from source inspection. Do not optimize them merely because they exist.

After bounded rendering exists, measure:

- mounted cells;
- scripting cost when a fresh visible range mounts;
- scripting cost scrolling into unseen ranges;
- edit responsiveness;
- subscription/query counts only through a non-invasive test seam if useful.

Decision:

- acceptable visible-range cost → keep current read contracts;
- material cost → design the narrowest owner-correct optimization;
- no generic batch API without measured need.

## Repetition and statistics

For timing comparisons:

- fresh context/page per independent dataset case;
- cold switch reported separately;
- small fixed warm-up/pilot to estimate variance;
- one fixed repetition count for baseline/candidate comparison;
- median and worst sample at minimum;
- identical browser/environment/viewport/dataset/throttling between comparisons;
- raw samples retained;
- no sample deletion without an independently demonstrated unrelated cause.

## Result artifact

Emit machine-readable result JSON containing at least:

```text
commit/ref
environment/browser
viewport/project
CPU throttling
case ID
rows/columns/density/property mix/filter/sort
cold or warm

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

A small summarizer may aggregate results for architecture review. Do not turn it into a general benchmark framework.

## Comparison order

Evaluate complexity incrementally:

1. current unvirtualized baseline;
2. selected TanStack-backed bounded virtualization;
3. rerun identical cases;
4. only then analyze cell read/subscription cost if still material;
5. only then analyze worker/query/transfer changes if still material.

This order prevents unrelated performance work from being bundled into the required virtualization change.

## Secondary optimization decision tree

### A. Virtualized visible-range setup is still expensive

Profile and reduce only proven duplicate/unnecessary cell work.

### B. Worker filter/sort dominates 30k behavior

Design a worker-owned query optimization while preserving virtualization and current data ownership.

### C. Worker-to-main delivery is material

Quantify before changing the query contract. Any range protocol must explicitly resolve ordering, invalidation, source of truth, and cancellation.

### D. Dynamic measurement/layout dominates

Simplify database sizing/integration before adding caches or new state. Fixed dimensions are not an allowed escape hatch.

### E. No material bottleneck remains

Stop optimizing.

## Research targets

Until variance is characterized, use as research targets rather than permanent CI budgets:

- no switch-associated main-thread block above **100 ms**;
- preferred individual main-thread slices at or below **50 ms**;
- mounted rows independent of total row count for a fixed viewport/geometry class;
- mounted columns/cells independent of total column count for a fixed viewport/geometry class.

A wall-clock number becomes a persistent regression gate only when repeated controlled runs show useful signal and acceptable variance.

Structural bounded-rendering contracts should become persistent browser assertions regardless of whether absolute timing is promoted.

## Correctness around the performance scenario

A faster implementation is invalid unless the product flow still proves:

- exact filtered membership;
- exact sorted order;
- short → full → short switching;
- no stale rows/cells from the previous view;
- deep vertical/horizontal scrolling;
- sentinel row/column correctness;
- editing a deep visible item;
- dynamic size changes remain correct after remeasurement;
- acceptable scroll stability during size correction;
- final focus/edit lifecycle contract.

## Research exit criteria

Before database virtualization implementation preflight is complete:

- row-scale baseline or safe scale-to-failure boundary recorded;
- column-scale baseline or safe scale-to-failure boundary recorded;
- main-thread freeze quantified with in-page responsiveness metrics;
- enough attribution exists to distinguish material worker vs main-thread/layout cost;
- selected TanStack integration passes vertical, horizontal, consumer-size, two-axis, resize, and anchoring proof;
- dynamic column-sizing semantics are chosen;
- focus/edit lifecycle semantics are chosen;
- exact shared/database test owners and paths are selected.

Before final performance acceptance:

- G1 (`30,000 × 300`) succeeds with bounded rendering;
- structural mounted-work invariants are proven;
- worker compute/delivery is classified as acceptable or assigned a separately measured architecture change;
- visible-range cell cost is classified after virtualization;
- final performance budgets and persistent-vs-task-specific proof are decided.

Virtualization and TanStack engine selection are not reopened by ordinary profiling results. Only demonstrated incompatibility with the required virtualization contract can reopen the engine decision; all other findings affect database policy or evidence-gated secondary optimization.
