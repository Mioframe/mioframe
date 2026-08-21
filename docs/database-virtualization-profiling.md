# Database virtualization profiling and analysis plan

Status: **research plan; baseline not yet captured**.

This document defines the controlled investigation required before `docs/database-virtualization.md` can become implementation-ready.

## Purpose

Determine where large database view-switch cost actually occurs, prove the minimum virtualization capabilities Mioframe needs, and decide whether any optimization beyond bounded rendering is required.

The investigation must be reproducible from tests. Live-device measurements may be informative later, but they are not the source of truth for this architecture decision.

## Principles

- Measure the current implementation before changing production rendering.
- Use deterministic generated data and record the exact scale/content shape for every result.
- Separate row scale, column scale, combined scale, dynamic sizing, worker computation, and UI rendering instead of treating one total duration as the answer.
- Prefer structural invariants over absolute timing when they directly prove scalability.
- Use a real browser for layout, scrolling, resizing, long-task, and responsiveness evidence.
- Keep profiling instrumentation test-owned unless a durable product diagnostic requirement is independently established.
- Do not optimize a layer until measurements show that layer remains material after the minimum bounded-rendering design.

## Existing path under test

Current flow to profile:

```text
view selection
    ↓
DatabaseViewWidget / DatabaseViewLayout
    ↓
useDatabaseData
    ↓
worker filteredIdList
    ↓
filter + sort + ordered item IDs
    ↓
main-thread reactive update
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

The investigation must distinguish at least:

1. worker query computation;
2. worker-to-main result delivery;
3. Vue/component/reactive setup;
4. DOM creation/insertion;
5. style/layout/paint;
6. dynamic measurement cost in the candidate virtualized path.

## Controlled environment

Use the existing application browser-test infrastructure and a production-equivalent built/previewed app path where possible. The exact command, browser build, OS/container image, viewport sizes, worker count, and whether CPU throttling is used must be recorded with results before any absolute budget is promoted to a persistent regression gate.

Required baseline browser coverage for the investigation:

- Chromium desktop viewport;
- Chromium mobile-sized viewport using the repository's existing application E2E project/applicability model.

Do not infer mobile-device performance from viewport size alone. The mobile viewport is used here to reproduce layout/interaction constraints under controlled execution, not as a substitute for a physical-device benchmark.

If CPU throttling is used to increase sensitivity, use one fixed documented factor for comparison runs and report unthrottled results separately. Do not tune the factor to make a candidate pass.

## Deterministic dataset builder

Large setup must not create tens of thousands of rows through user UI actions.

Use the lowest existing test boundary capable of establishing a valid database document/state while preserving production schema and migration invariants. The product action under test — switching views — must still be performed through the real UI.

Dataset generation requirements:

- deterministic stable seed/IDs/content;
- no current-time/random-content dependency unless seeded;
- explicit row count, property count, property types, density, relation fan-out, filter, and sorting recorded per profile;
- sentinel values at beginning, middle, and end so ordering/deep scrolling can be validated;
- sparse/default-valued cases separated from dense stored-value cases;
- setup time measured separately and excluded from the view-switch responsiveness metric.

Do not add a production debug/data-generation API solely for tests.

## Dataset matrix

The exact final numbers may be adjusted only when the first run shows that setup itself dominates or a case cannot isolate its intended dimension. Record any adjustment and reason.

### Control

| Case | Rows | Columns | Density | Purpose |
| --- | ---: | ---: | --- | --- |
| S0 | 100 | 8 | representative | sanity/control |

### Row-scale series

Keep column shape stable while increasing row count.

| Case | Rows | Columns | Purpose |
| --- | ---: | ---: | --- |
| R1 | 300 | 8 | small baseline |
| R2 | 3,000 | 8 | medium growth |
| R3 | 30,000 | 8 | required product baseline |
| R4 | 100,000 | 8 | optional stress case; not a product guarantee |

R3 must include variable-height representative content in selected rows without making every row artificially expensive.

### Column-scale series

Keep row count low enough to isolate horizontal scale.

| Case | Rows | Columns | Purpose |
| --- | ---: | ---: | --- |
| C1 | 100 | 10 | small baseline |
| C2 | 100 | 100 | medium growth |
| C3 | 100 | 1,000 | high-column stress |

Column width requirements must vary. Include short and long headers/content so fixed-size assumptions cannot accidentally pass.

### Combined logical-grid case

| Case | Rows | Columns | Density | Purpose |
| --- | ---: | ---: | --- | --- |
| G1 | 30,000 | 300 | sparse/default-heavy | prove UI behavior on a very large logical grid without conflating it with 9 million persisted cell values |

G1 represents 9,000,000 logical row/column intersections. It is intentionally not fully dense because dense storage/CRDT scalability is a separate concern from rendering the logical grid.

### Dense data cases

Use smaller dense datasets to identify whether effective/stored-value reads and worker data traversal become independent bottlenecks.

Candidate cases:

- 30,000 rows × 8 properties with representative stored values;
- 3,000 rows × 100 properties with representative stored values.

Do not add a denser/larger case unless the prior result shows it answers a concrete unresolved question.

### Relation/dynamic-content case

Keep this separate from the base scale matrix.

Include:

- at least one relation property;
- rows with materially different rendered heights;
- content that changes height after an edit or expansion path currently supported by the product;
- a deep row so resize/scroll-anchor behavior is tested away from the top of the collection.

The goal is to test dynamic geometry, not maximize relation fan-out.

## Baseline measurements on current implementation

Capture before production rendering changes.

### Structural measurements

For each scale case record:

- logical row count;
- logical property count;
- rendered `<tr>` count;
- rendered data-cell count;
- relevant Vue/component count if obtainable without invasive production instrumentation;
- active database value/property query/subscription counts only if a test seam can measure them without shipping diagnostic state.

The current implementation is expected to show rendered work growing with total rows and columns. The measurement should demonstrate that behavior rather than merely assert it from source inspection.

### Responsiveness measurements

Use browser-owned timing APIs from the test harness:

- `PerformanceObserver` `longtask` entries during the switch window;
- maximum switch-associated long-task duration;
- count and total duration of long tasks;
- elapsed time from the real switch action until the browser can run a sentinel callback/frame;
- elapsed time until the target view is observably usable.

The switch measurement window must be explicitly bounded so unrelated startup/background tasks are not attributed to the action.

Do not use arbitrary sleeps to define completion.

### Browser trace attribution

When total timing is insufficient to identify the layer, collect a Chromium/Playwright trace or equivalent controlled browser profile for selected cases, especially R3, C3, and G1.

Use the trace to distinguish:

- scripting/component setup;
- DOM work;
- style recalculation;
- layout;
- paint/composite;
- idle/wait time.

Trace collection is diagnostic evidence; it should not automatically become a permanent CI artifact.

## Worker/service measurements

Measure filtering/sorting separately from browser rendering so worker cost is not hidden inside UI timing.

For representative row datasets record:

- `queryIdList`/equivalent service computation duration;
- filter-only, sort-only, and filter+sort cases if the current API allows clean isolation;
- output ID count;
- effect of property defaults and representative property types where relevant.

Then measure end-to-end worker query round-trip in the browser/application boundary for R3 to estimate serialization/proxy/delivery overhead relative to pure computation.

Do not redesign the worker API during baseline collection.

## Candidate virtualization capability experiment

Before accepting an external engine and shared adapter, prove only the capabilities required by the architecture.

The current candidate is `@tanstack/vue-virtual`. The experiment must run in the Vue/browser environment used by Mioframe and must not depend on fixed sizes.

### 1D dynamic axis proof

Demonstrate:

- large item count without full DOM materialization;
- different initial item sizes;
- post-mount size change observed through actual DOM measurement;
- deep `scrollToIndex`/equivalent navigation;
- stable scroll position when an item before the viewport changes measured size;
- bounded overscan.

### Horizontal dynamic axis proof

Demonstrate the same properties with variable widths and horizontal scrolling.

### Two-axis composition proof

Demonstrate one shared scroll container with independent vertical and horizontal virtual ranges:

- deep row and deep column reachable;
- mounted cell count bounded to viewport-area scale;
- row height changes after column-width/content changes are remeasured correctly;
- no requirement to render the complete grid for measurement.

This is a capability experiment, not the final database UI implementation.

### Adapter decision rule

Accept a shared Mioframe adapter only when the experiment shows that a thin API can expose the required dynamic-axis capabilities without duplicating the external engine.

Reject or reconsider the candidate if Mioframe must implement substantial custom offset trees, measurement scheduling, scroll correction, or hidden full-content measurement around it.

## Column-sizing experiment

Horizontal virtualization cannot know intrinsic width requirements of cells that have never rendered. This must be treated as an explicit presentation decision, not hidden by a heuristic.

Prototype and compare the minimum candidate behavior:

1. unseen column uses provisional estimate;
2. mounted header/cells report actual width requirement;
3. current width updates from discovered requirements;
4. hidden rows/columns are not rendered only for sizing;
5. width changes trigger required visible-row remeasurement;
6. deep horizontal/vertical scroll remains stable.

Current architecture hypothesis: progressively discovered intrinsic width, likely grow-only within a view/session to prevent repeated width oscillation.

The experiment must answer:

- whether grow-only sizing is visually stable enough;
- whether/when widths should be allowed to shrink after data/view changes;
- whether measurement should be keyed per property across sorting/filtering changes;
- what resets measurement state: document, view, property schema change, viewport class, or another confirmed boundary;
- whether headers or cell content establish a minimum/max width policy.

Do not persist column widths unless a separate product requirement is established.

## Cell reactive-cost analysis

Source inspection indicates repeated reactive reads can occur inside one editable cell. Do not optimize this before bounded rendering is measured.

After the virtualization prototype, record for the same viewport:

- mounted cell count;
- value/property query/subscription count if measurable;
- scripting time during initial visible-range creation;
- scripting time while scrolling into a fresh range;
- edit responsiveness.

Decision:

- if visible-range cost is acceptable, leave read contracts unchanged;
- if visible-range setup remains a material bottleneck, identify the narrowest owner-correct read optimization and update the architecture before implementation tasking.

Do not introduce a generic batch API merely to reduce call count without measured evidence.

## Decision tree after measurements

### A. Current main-thread DOM/component materialization dominates

Proceed with two-axis dynamic virtualization as the minimum implementation.

### B. Virtualized visible-range setup remains expensive

Profile cell reactive/read fan-out and reduce only the measured duplicate/unnecessary work.

### C. Worker filter/sort dominates at 30,000 rows

Design a worker-owned query optimization separately while preserving UI virtualization. Prefer improving the existing complete-result contract before introducing paging/range protocols.

### D. Worker-to-main transfer dominates

Quantify the transfer threshold first. Only then consider a range/query protocol or another contract change; update source-of-truth and cancellation semantics before coding.

### E. Dynamic measurement/layout dominates

Simplify the table sizing policy or adapter usage before adding more caching/state. Do not hide measurement cost with fixed dimensions that violate product requirements.

Several branches may apply, but each additional optimization must have its own measured evidence.

## Result recording template

Record each meaningful run in this document or a follow-up findings section with:

```text
commit/ref:
environment:
browser:
viewport/project:
cpu throttling:
dataset case:
rows:
columns:
density/property mix/filter/sort:
runs:

worker compute:
worker round-trip:
switch-to-sentinel:
switch-to-usable:
max long task:
long-task count/total:
rendered rows:
rendered columns/cells:
layout/style/paint notes:
memory (if available):
trace/artifact reference:

conclusion:
next decision unlocked:
```

Do not record a conclusion without enough run metadata to reproduce it.

## Repetition and comparison

For timing comparisons:

- separate first/cold run from warmed repeated switches;
- run enough repetitions to expose variance before treating a difference as material;
- report median and worst observed value at minimum;
- keep browser build/environment/dataset identical between baseline and candidate comparisons;
- do not discard slow runs without an independently identified unrelated cause.

The exact repetition count is chosen after the first pilot based on observed variance. Do not hard-code an arbitrary large repetition count into permanent CI before stability is known.

## Initial budgets and promotion criteria

Architecture target to validate:

- no switch-associated main-thread task above **100 ms** in the controlled acceptance environment;
- preferred main-thread work slices at or below **50 ms**;
- mounted row count independent of total row count for fixed viewport/overscan;
- mounted column/cell count independent of total column count for fixed viewport/overscan.

The 50 ms threshold is also the browser long-task threshold already used by Mioframe's performance metrics implementation.

A timing metric becomes a persistent automated regression gate only if:

1. the owning scenario/contract is durable;
2. the environment is controlled enough that the budget is stable;
3. repeated baseline/candidate runs show useful signal above normal variance;
4. the budget is not merely an implementation detail;
5. the test fails closed without retries/sleeps/time inflation.

Structural bounded-rendering contracts should become persistent browser assertions because they directly protect the chosen scalability architecture and are much less hardware-sensitive.

## Required correctness checks around the performance scenario

Performance improvement is invalid unless the same scenario still proves:

- exact filtered membership;
- exact sorted order;
- switch to full view and back;
- deep vertical scrolling;
- deep horizontal scrolling when many properties exist;
- sentinel rows/columns reached correctly;
- editing a visible deep item and observing the correct value;
- dynamic-height content remains visible/correct after resize;
- no stale cells from the previous view after fast view switching.

Accessibility/focus expectations for elements leaving the virtual range must be defined before the final implementation handoff and then proved at the lowest faithful browser layer.

## Research exit criteria

Do not mark `docs/database-virtualization.md` ready until all are true:

- current 30,000-row baseline is captured and decomposed;
- high-column and combined logical-grid baselines are captured;
- the candidate engine passes dynamic vertical, horizontal, two-axis, resize, and scroll-anchor capability experiments, or another engine/design is selected with equivalent evidence;
- final dynamic column-sizing semantics are chosen;
- final focus/edit lifecycle semantics are chosen;
- worker compute and transfer are classified as sufficient or assigned a measured architecture change;
- cell read/subscription cost is classified after bounded rendering;
- performance budgets are finalized with environment/ownership;
- persistent vs task-specific performance proof is decided;
- exact product E2E/reusable-browser/deterministic proof owners are selected in implementation preflight;
- architecture document is updated to remove resolved alternatives and its readiness verdict becomes `ready`.

Until then, production implementation remains blocked by design.
