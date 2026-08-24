# Database virtualization

Status: **shared virtualization architecture accepted; Database table integration remains blocked by unresolved Chromium value-path responsiveness and visual-boundary regressions**.

This is the architecture source of truth for large Database rendering in PR #217.

Related current contracts:

- shared virtualization API: `src/shared/ui/virtualization/README.md`;
- active review findings: `src/entities/databaseData/REVIEW.md`;
- raw product measurements: `docs/database-virtualization-production-results.md`;
- completed sparse all-string diagnostic: `docs/database-virtualization-performance-attribution-handoff.md`, `docs/database-virtualization-performance-attribution-preflight.md`;
- completed heterogeneous attribution: `docs/database-virtualization-heterogeneous-attribution-handoff.md`, `docs/database-virtualization-heterogeneous-attribution-preflight.md`.

## Goal

Scale Database rendering to at least 30,000 rows and hundreds of properties, including 30,000 × 300 = 9,000,000 logical row/property intersections, while preserving exact filter/sort/view behavior, editing, relations, native table semantics, accessibility, stable appearance, and responsive desktop/mobile use.

Primary structural invariant:

> For fixed viewport and overscan, mounted expensive rows, properties, and cells are bounded independently of total logical dataset size.

Bounded DOM is necessary but not sufficient. Real heterogeneous databases must also remain responsive while switching views and scrolling.

## Accepted architecture

- `@tanstack/vue-virtual` is the only virtual-item range/measurement/cache engine.
- `useVirtualCollection` remains the Mioframe shared virtualization boundary.
- Database uses independent row and property virtual collections over canonical complete sources.
- Native `<table>` flow remains the renderer.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- No UI-side paging/source reconstruction, worker redesign, generic virtual grid/table, second geometry engine, independent size maps, or virtual-item registry is justified by current evidence.

Accepted ownership outside the unresolved performance discriminator remains unchanged: `entities/databaseData` owns Database table rendering/integration; Database value/property owners render their domain content; widgets compose nested relation/value behavior; `shared/ui/Table` remains generic presentation.

## Native table virtualization

`DatabaseDataTable` renders physical spacer DOM around the mounted logical range:

```text
<table>
  <colgroup> leading spacer | mounted properties | trailing spacer | action </colgroup>
  <thead>     leading spacer | mounted headers    | trailing spacer | action </thead>
  <tbody>     top spacer | mounted logical rows × mounted properties | bottom spacer </tbody>
</table>
```

The action column remains outside horizontal property virtualization. Spacer DOM is presentation-only and excluded from logical accessibility semantics.

### Visual boundary

The current spacer structure conflicts with `MDTable` structural first/last-child border and radius rules. The corrected Database table must preserve the pre-PR visible outer border/corner appearance at logical boundaries in initial and scrolled states.

This adaptation belongs to `entities/databaseData` unless a separate shared-UI review proves a generic `MDTable` defect. Do not make shared `MDTable` Database-virtualization-aware merely to repair this consumer.

## Performance evidence — current interpretation

### Structural scalability

Accepted:

- all measured S0/G1 runs retain bounded mounted rows / property headers / expensive outer cells;
- G1 does not materialize the 9,000,000 logical row/property intersections;
- deep logical row/property/value correctness passes.

### Canonical all-string control

The verifier-managed all-string diagnostic on production-equivalent head `1c1a3789ef66cc950eba543566502aec8567f3ec` is fast:

- S0 usable: 269.8 / 281.1 / 283.8 ms; median 281.1 ms;
- G1 usable: 323.5 / 321.5 / 305.9 ms; median 321.5 ms;
- zero Long Tasks in all six samples;
- mounted work remains 12 / 8 / 96;
- deep correctness passes.

This is canonical verifier-owned evidence for the sparse all-string rectangular fixture.

A previous non-verifier current-geometry run reported 1.6–2.5 s usable times and 291–429 ms Long Tasks. Because the canonical verifier run on the same production implementation does not reproduce that behavior, the earlier result remains environment/protocol warning evidence rather than proof of a general runtime regression.

### Heterogeneous Chromium attribution

The completed verifier-managed heterogeneous diagnostic reproduces the real performance class.

Scalar-mix switch samples:

- 719.5 ms, no Long Tasks;
- 385.6 ms, no Long Tasks;
- 928.9 ms, no Long Tasks.

Number-isolation switch samples:

- 631.3 ms with 3 Long Tasks, maximum 241 ms, total 520 ms;
- 635.5 ms with 3 Long Tasks, maximum 244 ms, total 523 ms.

Vertical wheel scrolling:

- scalar mix produced 168 ms and 183 ms Long Tasks in two of three samples;
- Number isolation produced a 210 ms Long Task in one of two samples.

Horizontal wheel scrolling produced no Long Tasks in the reported samples. Mounted outer work remained bounded and deep correctness passed.

This establishes **Number isolation as a reproducible fixture path**, but not `databaseNumber` as the production root-cause owner.

`NumberValueInline` and `StringValueInline` are both simple span/text renderers. Effective-value/property query infrastructure is also shared. The current diagnostic report does not establish that the String and Number probes used identical stored-value density and positions. Therefore property type, data density/shape, shared query/subscription work, and layout/measurement interaction remain unresolved discriminators.

Operator Firefox testing on the same laptop remains useful comparison evidence, but the current app-E2E verifier has no Firefox project; adding one opportunistically is not part of this attribution.

## Root/surface geometry — candidate only

The current `DatabaseDataTable` derives root-to-table surface offsets and refreshes root/table bounds from its own update lifecycle. This remains a plausible hot-path amplifier because the component also updates as virtual ranges change.

However, the canonical fast all-string verifier run uses the same implementation. Current evidence therefore does **not** justify declaring the geometry lifecycle the root cause or restoring historical numeric-offset ownership.

Required rule:

> Do not change root/surface ownership until narrow attribution shows that geometry refresh contributes materially to the failing path.

If attribution later proves it significant, choose the smallest correction that keeps surface offsets truthful without coupling expensive layout reads to ordinary virtual-range updates. No generic geometry manager/provider or second virtual-item measurement system is justified now.

## Next performance discriminator

Before any production performance correction, distinguish the Number reproducer from fixture/value-density effects.

The next evidence must compare String and Number under an identical controlled shape:

- same logical rows/columns;
- same persisted-value density and exact populated cell positions;
- same Short/Full views and filter shape;
- same viewport and verifier-managed desktop Chromium environment;
- same switch and vertical-wheel protocol;
- same mounted-work and deep-correctness assertions.

If equal-density Number remains materially worse while String stays clean, attribute the next layer below the fixture type. If both behave similarly, treat data density/shared query/layout work rather than Number-specific rendering as the leading owner direction.

Stop once the narrowest production owner can be selected. Do not broaden to the full matrix or implement speculative worker/query/storage, geometry, virtualization, or Material changes.

## Dynamic sizing and nested content

Rows and mounted property headers continue to be measured through the shared `vItem`; TanStack owns measured size and scroll correction.

Production wrapping, progressive widths, sticky header/action surfaces, nested relation roots, recursive relation previews, and inline editing remain required behavior.

A bounded outer cell count does not prove nested relation content is cheap; relation cells may compose additional nested Database UI. Relation-specific profiling is required only if the current narrower scalar/value-path attribution fails to explain the defect.

## Accessibility

Preserve native table semantics and logical row/property indices; spacer DOM remains hidden from logical semantics; do not introduce an ARIA-grid keyboard model.

## Proof ownership

Application E2E remains the owner of complete product scenarios in `tests/e2e/databaseVirtualizationFlows.spec.ts`.

Task-specific performance attribution may use temporary nested E2E diagnostics, but execution must go through `pnpm verify` surfaces. No direct Playwright/Vite/browser orchestration and no coding-agent historical checkout/worktree/bisect workflow.

The visual border/radius contract requires separate bounded visual-regression proof at the executable owner/location allowed by the current testing migration plan. Screenshots prove stable appearance only; they do not prove scrolling performance.

## Required scenarios before acceptance

1. Sparse all-string S0/G1 remains fast and bounded.
2. The Number reproducer is attributed to the actual production layer and corrected without regressing the control.
3. Short -> Full has no material perceptible freeze in the failing Chrome case.
4. Sustained vertical scrolling has no material repeated jank in that case.
5. Horizontal scrolling remains responsive.
6. Mounted outer work remains bounded and deep correctness passes.
7. Nested relation/dynamic sizing/sticky/editing/accessibility behavior remains correct.
8. Table borders and corner radii match the established pre-virtualization appearance in initial and representative scrolled/end states.

## Forbidden

- treating `databaseNumber` as root cause solely because Number isolation reproduces;
- selecting geometry, TanStack, worker/query/storage, or Material as root cause before the narrow discriminator identifies that owner;
- replacing TanStack or adding a second range/size/cache engine without evidence;
- paging/index/cache redesign before the actual failing layer is identified;
- generic geometry manager/provider or automatic root discovery;
- changing shared `MDTable` merely to understand Database spacer conventions;
- spacer DOM owning visible borders/radii;
- adding a Firefox app-E2E project as an incidental diagnostic workaround;
- test-only production seams;
- timeout inflation, sleeps, force, retry-as-success, or weakened performance criteria;
- direct Playwright/Vite/browser execution for required proof;
- coding-agent historical checkout/worktree/bisect orchestration;
- unrelated cleanup.

## Readiness

Shared virtualization: **accepted**.

Bounded mounted-DOM invariant: **accepted**.

Sparse all-string responsiveness: **accepted in verifier-owned Chrome evidence**.

Heterogeneous Chromium defect: **reproduced**.

Number isolation: **accepted as reproducing fixture path; production owner unresolved**.

Root/surface geometry ownership: **candidate only; not selected for correction**.

Database table visual compatibility: **blocked; borders/corner radii regressed under spacer DOM**.

Inline-edit/error/accessibility ownership: **accepted**.

Merge readiness: **blocked; attribute the Number reproducer to the actual production owner, correct it, restore table visual boundaries, then obtain focused switch/scroll/visual proof and green exact-head GitHub CI**.
