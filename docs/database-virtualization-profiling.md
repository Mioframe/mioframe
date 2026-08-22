# Database virtualization profiling and analysis plan

Status: **research plan; virtualization, TanStack, and minimal shared collection API are fixed; native-table capability pending; secondary optimizations evidence-gated**.

`docs/virtualization-library.md` owns the shared API. `docs/database-virtualization.md` owns database rendering architecture. `docs/database-virtualization-browser-proof.md` owns browser geometry capability. This document owns performance evidence.

## Goals

1. quantify the current unvirtualized freeze and scale-to-failure boundary;
2. prove structural bounded rendering after database migration to `useVirtualCollection`;
3. measure real short-filtered -> full-view responsiveness;
4. identify whether any optimization beyond bounded rendering is justified.

The capability fixture is not a timing benchmark. Generic shared proof exists only to protect the public collection/measurement contract; product performance is measured on the real database.

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

## Deterministic data

Generate valid current-schema Mioframe database documents outside the measured interaction and import through an existing valid boundary.

Each measured scenario starts in a short filtered view (~20 rows) and performs the real UI action to a full view over the same data.

Record seed, rows, columns, density, property mix, filter/sort, sentinels, and variable-size content shape.

## Dataset matrix

Required scale series:

| Case | Rows | Columns | Purpose |
| --- | ---: | ---: | --- |
| S0 | 100 | 8 | control |
| R1 | 1,000 | 8 | row growth |
| R2 | 3,000 | 8 | row growth |
| R3 | 10,000 | 8 | large row baseline |
| R4 | 30,000 | 8 | required final row target |
| C1 | 100 | 50 | column growth |
| C2 | 100 | 100 | column growth |
| C3 | 100 | 300 | required large-column target |
| G1 | 30,000 | 300 | 9,000,000 logical intersections; required post-fix |

Optional stress after the final solution is stable: 100,000 rows and/or 1,000 columns.

Include representative dense cases and one variable-height/relation case separately; do not generate millions of persisted values without evidence that CRDT density belongs in scope.

## Pre-virtualization stop conditions

Stop scaling the current renderer when any occurs:

- crash/OOM;
- one switch-associated block > 5 s;
- DOM/cell growth is clearly O(rows × columns) and the next step is unsafe;
- measurement control channel can no longer run reliably;
- memory makes the next step unsafe.

Record the last success and first failure/abort.

## Structural measurements after migration

Record:

- logical rows/columns;
- mounted data rows;
- mounted property headers;
- mounted data cells;
- visible/overscan ranges where useful as diagnostics.

Persistent assertions should protect observable mounted DOM counts, not TanStack private internals.

G1 must not materialize the logical cross product.

## Shared capability vs product performance

`src/shared/ui/virtualization` browser proof protects only:

- bounded single-axis collection rendering;
- item/value/key mapping;
- directive-backed dynamic measurement;
- leading/trailing extent correctness.

Do not attach durable wall-clock budgets to the shared primitive and do not build generic list/grid benchmark infrastructure.

Database native-table capability proves browser geometry in Chromium/Firefox. Performance acceptance uses the real product after migration.

## Product correctness around performance

The faster implementation is invalid unless it preserves:

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
- logical accessibility counts/indices.

## Secondary optimization order

After `useVirtualCollection`/native-table bounded rendering:

1. rerun identical performance cases;
2. if visible-range cell setup is material, optimize only that owner;
3. if worker filter/sort or transfer is material, design the narrowest worker/service change;
4. consider paging/indexes/caches only with measured need;
5. stop when no material bottleneck remains.

Do not add a batch API, range protocol, index, cache, or worker redesign based only on code inspection.

## Research targets

Until variance is characterized, treat these as research targets rather than permanent CI budgets:

- no switch-associated main-thread block above 100 ms;
- prefer individual slices <= 50 ms;
- mounted rows independent of total rows;
- mounted columns/cells independent of total columns.

Wall-clock budgets become persistent only if repeated controlled runs show useful stability. Structural bounded-rendering assertions remain durable.

## Result artifact

Task-specific result data should include environment/ref, case shape, cold/warm status, timing metrics, mounted row/column/cell counts, and optional diagnostic trace references.

Do not create a generic benchmark framework.

## Exit criteria

Before production migration implementation:

- shared collection API + database native-table capability from `docs/database-virtualization-browser-proof.md` passes and is reviewed.

Before final performance acceptance:

- G1 succeeds with bounded mounted work;
- real short -> full interaction meets finalized responsiveness budget;
- worker/query/transfer and visible-range cell costs are classified;
- all required product correctness scenarios pass.
