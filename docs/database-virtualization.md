# Database virtualization

Status: **database virtualization architecture accepted; shared library architecture accepted; secondary optimizations under profiling; production implementation preflight pending**.

This document is the architecture source of truth for large database rendering. The reusable virtualization primitive is defined separately in `docs/virtualization-library.md`. Controlled profiling and secondary-optimization analysis are defined in `docs/database-virtualization-profiling.md`.

The database virtualization direction is a decision, not one of several equal optimization hypotheses. Profiling may refine its sizing, focus/edit, proof, and implementation details, but it does not decide whether virtualization is needed. Change that baseline only if repository or measured evidence demonstrates that a confirmed assumption is false.

Secondary performance work is different: worker/query changes, batching, cell-read changes, transfer protocols, indexes, and similar optimizations are **not accepted architecture yet** and require measured evidence.

## Architecture decision status

Accepted now:

- large database rendering requires viewport-bounded rendering rather than progressive full materialization;
- database tables require virtualization on both row and column axes;
- item dimensions are dynamic and may change after mount; fixed row/column size is not a correctness contract;
- reusable virtualization geometry belongs in `src/shared/ui/virtualization` under the contract in `docs/virtualization-library.md`;
- the shared library exposes one dynamic virtual-axis primitive; the database composes two axes rather than depending on a separate generic grid abstraction;
- database row/column composition, cell rendering, column sizing policy, editing, sticky behavior, and any database measurement coordination remain owned by `entities/databaseData`;
- filtering/sorting and canonical ordered membership remain service/worker-owned initially;
- additional optimizations outside virtualization are added only when measurements show a remaining bottleneck.

Detailed shared-library decisions already accepted in `docs/virtualization-library.md` include:

- headless composable API rather than generic render components;
- provisional estimates plus authoritative dynamic measurement;
- DOM element measurement for logical items with one owning element;
- consumer-supplied item sizing for logical dimensions such as database columns whose size is aggregated from several rendered cells/header;
- one scroll element may be consumed by independent vertical and horizontal axes;
- geometry-level `scrollToIndex` is shared-owned, while focus/selection/edit policy remains consumer-owned;
- third-party engine semantics stay encapsulated behind a narrow Mioframe adapter.

Deferred within virtualization until capability/preflight evidence:

- final external engine dependency (`@tanstack/vue-virtual` is the current candidate);
- exact TypeScript/Vue signatures and invalid-input behavior;
- final progressively-discovered database column width/reset/shrink policy;
- focus/edit lifecycle when a database virtual item leaves the viewport;
- exact browser/product proof files and stable performance budgets.

Evidence-gated secondary optimizations, not accepted yet:

- changing per-cell read/subscription contracts;
- batching database value/property reads;
- worker filter/sort algorithm changes;
- worker-to-main transfer changes;
- range/paging protocols;
- indexes/caches introduced only for this performance problem;
- alternative rendering engines beyond the accepted virtualization baseline.

## Goal

Remove multi-second UI blocking when switching a database from a small filtered view to a large full view, while making rendering scale to very large logical collections.

Confirmed product requirements:

- profiling and performance analysis use reproducible automated tests, not a live-device-only procedure;
- 30,000+ database rows are a required scale baseline;
- tables may contain very many properties/columns;
- item height and width may vary with content and may change after mount;
- virtualization infrastructure must remain reusable by future large one- and two-dimensional collection presentations, including lists with different visual formats;
- correctness, interaction, editing, scrolling, filtering, and sorting must be preserved.

The primary rendering invariant is:

> Mounted UI work is bounded by viewport and overscan, not by total logical row or column count.

For a table, mounted cell cost must therefore scale approximately with `visibleRows * visibleColumns`, not `allRows * allColumns`.

## Confirmed current behavior and evidence

Current repository evidence:

- `src/entities/databaseData/DatabaseDataTable.vue` renders every `itemId` and, inside every row, every property with nested `v-for` loops;
- `src/entities/databaseData/useDatabaseData.ts` consumes the complete ordered filtered ID list from the worker-facing database service;
- filtering/sorting are owned by `src/shared/service/databaseDocument` and currently return a complete ordered ID list;
- rendered editable values establish multiple reactive reads through database property/effective/stored value composables, so full-table materialization amplifies subscription cost as well as DOM/component cost;
- `src/shared/ui/Table/MDTable.vue` is a native table presentation primitive and has no virtualization contract;
- no repository-owned generic virtualizer currently exists.

The current defect is consistent with unbounded main-thread rendering work. Profiling still has to quantify actual costs and determine whether any secondary bottleneck remains after bounded rendering.

## Non-goals

This work does not by itself:

- change database filtering, sorting, persistence, or view semantics;
- introduce pagination as product behavior;
- require fixed row heights or fixed column widths;
- recreate native `table-layout: auto` by rendering all hidden cells for measurement;
- migrate existing `MDList` consumers;
- turn `MDTable` into a generic virtual-table framework;
- introduce worker paging, indexes, batch-read protocols, or new caches without measured need;
- build a generic data-visualization framework for hypothetical layouts;
- guarantee literally unbounded document size independent of available memory/CPU.

## Affected scenarios

Required scenarios include:

- switch from a short filtered database view to a full large view;
- switch back while previous rendering work could still be active;
- vertical scrolling to deep rows;
- horizontal scrolling to deep columns;
- dynamic row height caused by content changes;
- dynamic column width caused by rendered content;
- inline editing of a currently visible row/cell;
- filter/sort correctness and ordering;
- relation-valued cells and other variable-height content;
- desktop and mobile viewport behavior.

## Boundaries and ownership

| Owner | Responsibility in this work |
| --- | --- |
| feature | No new business state. Existing user actions remain unchanged. |
| `entities/databaseData` | Database-specific integration: complete row/property identities, two-axis composition, visible cell rendering, database-specific sizing policy, sticky/action behavior, edit/focus policy, and table measurement coordination. |
| widget | Composition only. Must not own virtual ranges, sizing policy, filtering, or sorting. |
| page/pane | No change expected. |
| `shared/ui/virtualization` | Dynamic one-axis virtualization contract from `docs/virtualization-library.md`. No database, Material, selection, or business semantics. |
| `shared/ui/Table` | Preserve current presentation ownership by default. Change only if implementation preflight proves an unavoidable table-surface requirement. |
| service/worker | Preserve current canonical filter/sort result initially. Optimize only when measured compute/transfer cost remains a bottleneck after bounded rendering. |

## Source of truth

- ordered row membership: existing complete worker/service `itemIdList` unless profiling proves that contract itself must change;
- column/property membership and order: existing database property/view contract;
- stored database values: existing database document state;
- virtual ranges, measurements, scroll offsets, overscan, and discovered sizes: ephemeral presentation state only.

Virtualization must never become a second data-ordering or filtering source of truth.

## Database two-axis composition

The database consumes the generic one-axis library twice against the same scroll container:

```text
complete ordered row IDs ------> vertical virtual axis ---+
                                                        |
complete property IDs ---------> horizontal virtual axis -+--> visible cell matrix
```

Only row/column intersections selected by both virtual ranges instantiate expensive cell UI/reactive reads.

No production `useVirtualGrid` abstraction is required unless later confirmed cross-axis generic behavior cannot be owned cleanly by the database consumer.

## Row sizing

Row height is dynamic.

The rendered row is the logical vertical item and may be measured through the shared axis `measureElement` integration. It must be remeasured when content or width changes. A relation cell or wrapped value may therefore increase or decrease row height without violating the contract.

Changing a column width can reflow visible cells and therefore alter row heights; this is a normal cross-axis effect handled by browser resize measurement, not by a shared grid algorithm.

## Column sizing

Column width is dynamic, but horizontal virtualization creates a fundamental limitation: exact native intrinsic width cannot depend on content that has never rendered.

The database therefore owns a column measurement coordinator. It can aggregate current requirements from the header and rendered cells for one `DatabasePropertyId`, then supply the resulting logical width to the horizontal virtual axis through the shared library's consumer-supplied item-size capability.

Current candidate semantics remain **progressively discovered intrinsic sizing**:

- unseen columns use a provisional estimate;
- headers and mounted cells contribute actual measured requirements;
- a discovered wider requirement may enlarge the current column presentation;
- hidden cells are never bulk-rendered solely to discover their width;
- session-local measurements are presentation state.

Whether width is grow-only for the lifetime of a view, when it may shrink, and what exact events reset the database-owned discovered width remain browser-experiment decisions before final implementation preflight.

## Focus and editing

The shared virtualizer owns geometry/navigation only. Database editing and focus remain in `entities/databaseData`.

Before implementation preflight, define observable behavior for:

- a focused/editing cell approaching the virtual range boundary;
- keyboard navigation to an offscreen row/column;
- overlays/editors whose anchor cell becomes virtualized out;
- view switches while an edit is active.

Do not solve these by keeping the full dataset mounted.

## Secondary optimization decision gate

Virtualization is implemented regardless of profiling outcome because the confirmed scale requirements independently rule out full DOM materialization.

After a bounded-rendering candidate exists, rerun the same profiling harness.

Only then:

1. if visible-range cell setup remains material, profile per-cell property/effective/stored reads and reduce only proven unnecessary work;
2. if worker filter/sort remains material, optimize the worker-owned query path without moving business semantics into UI;
3. if complete-ID transfer remains material, quantify it before designing a range/paging protocol;
4. if measurement/layout dominates, simplify the database sizing policy or adapter integration before adding caches/protocols;
5. if none remains material, stop optimizing.

Every secondary optimization needs its own measured cause, owner, acceptance criterion, and proof. It must not be bundled merely because it is performance-related.

## Simplest viable alternative

Vertical-only virtualization is insufficient because very large column counts are a confirmed requirement.

Progressive full rendering is insufficient because it eventually materializes the entire logical collection and violates the bounded-rendering invariant.

A generic grid abstraction is unnecessary because two shared one-axis instances plus database-owned composition satisfy the current requirements with fewer concepts.

The minimum complete rendering design is therefore dynamic virtualization in both axes using the shared one-axis primitive.

## Rejected approaches

Rejected unless new evidence changes a requirement:

- full row/column DOM materialization;
- progressive rendering that eventually mounts the complete table;
- CSS hiding or `content-visibility` as the primary scalability mechanism;
- fixed row height or fixed column width as a required contract;
- hidden offscreen rendering of all rows/cells for measurement;
- pagination solely to avoid rendering cost;
- separate custom virtualizers for table, list, and cards;
- generic production `useVirtualGrid` without confirmed generic cross-axis behavior;
- moving database logic into the shared virtualization module;
- immediate worker paging/index/batching infrastructure without profiling evidence;
- a generic visualization/layout framework covering tree, kanban, masonry, calendar, graph, or other unconfirmed scenarios.

## Shared UI blast radius

Initial virtualization introduction should:

- add isolated `src/shared/ui/virtualization` according to `docs/virtualization-library.md`;
- make database rendering its first production consumer;
- not migrate existing `MDList` consumers;
- not change `MDTable` merely to host virtualization;
- keep Material components outside the virtualization ownership boundary.

Any change to an existing shared list/table primitive requires a separate consumer/blast-radius review before implementation.

## Acceptance matrix

| Contract | Required outcome |
| --- | --- |
| Large rows | 30,000+ logical rows do not cause full row DOM/component materialization. |
| Large columns | Large logical property counts do not cause full column/cell materialization. |
| Combined scale | Mounted cells remain bounded by visible row/column ranges plus overscan. |
| Dynamic sizes | Correct rendering does not rely on fixed height/width; post-mount size changes are supported. |
| Responsiveness | Switching to the large view does not create a multi-second main-thread block and input/navigation remain responsive. |
| Correctness | Full/filtered views retain exact membership and ordering from existing filter/sort semantics. |
| Scrolling | Deep vertical and horizontal targets are reachable and stable. |
| Editing | Visible values remain editable without stale writes or lost focus caused by ordinary virtualization updates. |
| View switching | Old virtual/measurement state does not leak into a newly selected view. |
| Reuse boundary | Generic virtualization contains no database, Material, filter/sort, selection, or product-specific contract. |

## Performance contract under investigation

Primary metrics:

- maximum main-thread task duration caused by large-view switching;
- event-loop/frame acknowledgement after the switch action;
- mounted row/column/cell counts relative to viewport and overscan;
- worker query compute latency;
- worker-to-main result latency/transfer cost;
- layout/style/paint cost after result delivery.

Initial responsiveness budget to validate in the controlled harness:

- no switch-caused main-thread task over **100 ms**;
- target individual main-thread work slices at or below the browser long-task threshold of **50 ms**;
- structural bounded-rendering assertions are preferred over wall-clock-only assertions wherever possible.

These numbers are not yet a persistent CI budget. Profiling determines whether they are stable and representative enough to become automated regression gates.

## Required test proof

`docs/testing/architecture.md` remains canonical.

Before database implementation preflight, resolve proof ownership for:

- shared reusable browser behavior from `docs/virtualization-library.md`;
- centralized application E2E for the complete database view-switch/edit/deep-scroll scenario;
- deterministic service/query tests only when a measured secondary optimization changes those contracts;
- task-specific controlled performance measurements for the current implementation and the bounded-rendering candidate;
- persistent performance regression checks only for budgets shown to be stable and worth maintaining.

`happy-dom` cannot prove geometry, scrolling, measurement, or responsiveness. Lower-level setup may create a valid large database state, but the view-switch action under product E2E must use the real UI.

## Required verification

Before production database virtualization begins:

1. complete the focused shared-library candidate-engine capability proof;
2. run implementation preflight for `src/shared/ui/virtualization` and database integration with exact files/specs;
3. capture enough current baseline data to compare the bounded-rendering implementation and detect secondary bottlenecks;
4. resolve database column-sizing and focus/edit semantics required for coding;
5. keep all secondary optimization branches evidence-gated.

Do not require worker/query redesign to begin virtualization unless measurements reveal a dependency that makes the accepted rendering architecture impossible.

## Forbidden

- make virtualization conditional on whether profiling reproduces a large freeze;
- modify product filter/sort semantics to make rendering cheaper;
- require fixed item dimensions;
- render hidden complete datasets for measurement;
- move database measurement/edit/focus rules into shared virtualization;
- expose the selected third-party virtualizer directly to entities/widgets;
- add worker batching/index/paging/read APIs without measured evidence;
- add permanent production diagnostics solely for one-off profiling;
- weaken tests with sleeps/retries/time inflation;
- ask implementation work to choose among unresolved secondary optimizations.

## Implementation readiness

### Shared virtualization library

Architecture: **accepted** in `docs/virtualization-library.md`.

Next gate: focused engine capability proof and implementation preflight.

### Database virtualization

Architecture direction and ownership: **accepted**.

Remaining implementation-preflight decisions:

- final column discovery/reset/shrink semantics;
- final focus/edit lifecycle;
- exact DOM/table layout integration;
- exact proof/spec paths;
- confirmed shared engine adapter signatures.

### Secondary optimizations

Status: **not architected; evidence-gated**.

Profiling must first show a material remaining bottleneck after bounded rendering or a baseline bottleneck that independently requires change.

Overall verdict: **virtualization architecture is accepted; production coding waits for the focused capability/preflight decisions above, while all non-virtualization optimizations remain unresolved by design**.
