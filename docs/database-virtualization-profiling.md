# Database virtualization profiling and analysis plan

Status: **research plan ready; virtualization capability and production migration architecture/preflight are accepted; real product profiling follows production implementation in PR #217; secondary optimizations remain evidence-gated**.

`src/shared/ui/virtualization/README.md` owns the shared API. `docs/database-virtualization.md` owns database rendering architecture. `docs/database-virtualization-production-handoff.md` and `docs/database-virtualization-production-preflight.md` own the active production migration contract. `docs/database-virtualization-browser-proof.md` owns browser geometry capability. This document owns performance evidence.

The complete production migration, profiling, any evidence-gated follow-up performance work, and final acceptance remain in PR #217 (`fix/database-large-data-performance`).

## Goals

1. record the pre-fix scale/freeze evidence where it can be gathered safely;
2. prove structural bounded rendering after production Database migration to `useVirtualCollection`;
3. measure real short-filtered -> full-view responsiveness;
4. identify whether any optimization beyond bounded rendering is justified.

The capability fixture is not a timing benchmark. Generic shared proof protects the public collection/measurement contract; product performance is measured on the real database.

## Core evidence

### Structural scalability

For fixed viewport and overscan:

> Mounted expensive rows, columns, and cells remain bounded independently of total logical rows/columns.

This is the durable performance invariant.

### Responsiveness

Measure the real view-switch interaction with in-page browser timing:

- `eventLoopYieldMs` via `MessageChannel`;
- first frame opportunity via `requestAnimationFrame`;
- `switchToUsableMs`;
- long-task max/count/total.

Do not use Playwright command duration as the primary timing.

### Attribution

Only if cost remains material after virtualization, classify:

- worker query/filter/sort;
- worker -> main transfer;
- Vue/component setup;
- DOM insertion;
- style/layout;
- paint/composite;
- virtualization measurement/reflow.

## Controlled environment

Use production-like Vite build/preview with Chromium, one worker, retries off for timing samples, fresh contexts, fixed viewport/environment, and trace/video/screenshots disabled for successful timing samples.

CPU throttling is optional comparative evidence only and must use the same factor for baseline/candidate.

Record enough environment identity to reproduce the comparison: tested ref/head, browser version, viewport, platform, warm/cold state, and dataset seed.

## Deterministic data

Generate valid current-schema Mioframe database documents outside the measured interaction and import through an existing valid boundary.

Each measured responsiveness scenario starts in a short filtered view (~20 rows) and performs the real UI action to a full view over the same data.

Record seed, rows, columns, density, property mix, filter/sort, sentinels, and variable-size content shape.

Do not generate millions of persisted values merely to realize 9M logical intersections. The required G1 stress is about logical row/property intersection scalability; persisted CRDT density is a separate concern unless measurements identify it as the bottleneck.

## Dataset matrix

| Case |   Rows | Columns | Purpose                                            |
| ---- | -----: | ------: | -------------------------------------------------- |
| S0   |    100 |       8 | control                                            |
| R1   |  1,000 |       8 | row growth                                         |
| R2   |  3,000 |       8 | row growth                                         |
| R3   | 10,000 |       8 | large row baseline                                 |
| R4   | 30,000 |       8 | required final row target                          |
| C1   |    100 |      50 | column growth                                      |
| C2   |    100 |     100 | column growth                                      |
| C3   |    100 |     300 | required large-column target                       |
| G1   | 30,000 |     300 | 9,000,000 logical intersections; required post-fix |

Optional stress after the final solution is stable: 100,000 rows and/or 1,000 columns.

Include one representative variable-height/relation case separately from the rectangular matrix.

## Pre-fix evidence and stop conditions

The known user defect is the short filtered -> full large Database switch freezing the UI for seconds. Pre-fix measurements are useful for comparison but must not become a prerequisite that risks an unsafe full cross-product render.

If reproducing the current renderer at increasing sizes, stop when any occurs:

- crash/OOM;
- one switch-associated block > 5 s;
- DOM/cell growth is clearly O(rows × columns) and the next step is unsafe;
- measurement control channel can no longer run reliably;
- memory makes the next step unsafe.

Record the last success and first failure/abort. Do not require a pre-fix G1 render.

## Structural measurements after migration

For every applicable matrix case record:

- logical rows/columns;
- mounted logical data rows;
- mounted property headers;
- mounted expensive logical data cells;
- viewport dimensions;
- selected overscan values;
- visible/overscan ranges only when useful as diagnostics.

Persistent assertions protect observable mounted DOM counts, not TanStack private internals.

G1 must not materialize the logical cross product in Vue/component instances or DOM.

The durable claim is not that mounted counts are one exact constant across all viewports/content; it is that for fixed viewport, content policy, and overscan, expensive mounted work does not grow with total logical rows/columns.

## Responsiveness sample protocol

The measured action is the real product short filtered view -> full large view switch.

For each selected responsiveness case:

1. load the deterministic document before timing;
2. settle in the short filtered view;
3. install in-page timing observation before the user action;
4. perform the real view-selection action;
5. record event-loop yield, first frame opportunity, usable-state completion, and Long Tasks;
6. verify correct full-view sentinels and bounded mounted DOM in the same run;
7. repeat enough controlled samples to characterize variance without using retries to turn failures into passes.

Record individual samples or at minimum count, median, worst/max, and enough distribution information to distinguish a stable result from an outlier.

## Shared capability vs product performance

The accepted shared/browser capability already proves:

- bounded single-axis collection rendering;
- item/value/key mapping;
- directive-backed dynamic measurement;
- non-zero surface-offset and leading/trailing geometry;
- deterministic native-table row/column geometry in Chromium/Firefox;
- bounded actual mounted database-cell DOM in the capability fixture.

The risk-specific stability diagnostic reported **300/300 executions passed** with no retries or flaky classification after correcting the two geometry proof races.

Do not attach durable wall-clock budgets to the shared primitive and do not build generic list/grid benchmark infrastructure.

Performance acceptance uses the real product after migration.

## Product correctness around performance

A faster implementation is invalid unless it preserves:

- exact filter membership and sort order;
- short -> full -> short switching;
- no stale old-view cells;
- deep vertical and horizontal scrolling;
- sentinel row/property correctness;
- inline edit without silent draft loss;
- dynamic row sizing;
- progressive column sizing without ordinary shrink/regrow oscillation;
- sticky header/action behavior;
- representative nested relation behavior;
- logical accessibility counts/indices;
- mobile and desktop product behavior required by existing applicability metadata.

These behaviors are owned by product proof from `docs/database-virtualization-production-preflight.md`; timing samples do not replace correctness E2E.

## Secondary optimization gate

After production bounded rendering:

1. rerun the same performance cases;
2. if visible-range cell setup is material, optimize only that owner;
3. if worker filter/sort or transfer is material, design the narrowest worker/service change;
4. consider paging/indexes/caches only with measured need;
5. stop when no material bottleneck remains.

Do not add a batch API, range protocol, index, cache, worker redesign, or subscription framework based only on code inspection.

Any secondary production optimization that changes ownership, service/worker API, state shape, or persistence requires a narrow architecture update before coding, but remains within PR #217.

## Research targets

Until variance is characterized, treat these as research targets rather than permanent CI budgets:

- no switch-associated main-thread block above 100 ms;
- prefer individual slices <= 50 ms;
- mounted rows independent of total rows for fixed viewport/overscan;
- mounted columns and expensive cells independent of total columns for fixed viewport/overscan.

If the structural invariant passes but a timing target misses, attribute the remaining work before changing architecture.

Wall-clock budgets become persistent only if repeated controlled runs show useful stability. Structural bounded-rendering assertions remain durable regardless.

## Result artifact

Final task-specific result data must include:

- tested branch/head and environment;
- case shape and deterministic seed;
- cold/warm status;
- mounted row/header/cell counts;
- event-loop yield;
- first frame opportunity;
- switch-to-usable;
- Long Task count/max/total;
- correctness result for the measured switch;
- any attributable remaining bottleneck;
- optional diagnostic trace reference when needed.

A compact Markdown table/result document in this PR is sufficient. Do not create a generic benchmark framework.

## Exit criteria

Before production implementation:

- shared collection API + database native-table capability accepted and deterministic — **satisfied**;
- production migration architecture/handoff resolves ownership, roots, edit lifecycle, relations, toolbar/after, and product proof — **satisfied**;
- implementation preflight resolves pass order and TEST IMPACT — **satisfied**.

Before final performance acceptance:

- production migration and product correctness proof are complete;
- G1 succeeds with bounded mounted work;
- real short -> full interaction has controlled timing evidence against the research targets;
- any missed target is attributed before additional optimization;
- worker/query/transfer and visible-range cell costs are classified when material;
- all required product correctness scenarios pass.

Before PR #217 merge recommendation:

- final architecture/semantic review accepts the complete implementation and evidence;
- any measurement-justified follow-up fixes are included and reviewed;
- exact-head GitHub CI is green with no accepted flaky classification.
