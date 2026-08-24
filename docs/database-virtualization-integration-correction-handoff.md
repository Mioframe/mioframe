# Database virtualization integration correction handoff

Status: **ready**.

## Goal

Finish PR #217 by restoring the pre-virtualization Database table boundary appearance without changing the accepted virtualization architecture.

## Confirmed evidence

- Row/property virtualization, bounded mounted work, deep correctness, native table semantics, editing, and relation roots are already accepted.
- `DatabaseDataTable` currently renders leading/trailing row and column spacer elements even when the corresponding virtual distance is `0`.
- `MDTable` derives outer corner/bottom-edge presentation from physical `first-child` / `last-child` table structure.
- Operator testing confirms broken table borders/corner radii in the current PR.

## Non-goals

- Do not investigate or fix the residual heterogeneous Chromium jank in this PR correction.
- Do not change root/surface geometry ownership, TanStack, `useVirtualCollection`, worker/query/storage, value renderers, or inline-edit architecture.
- Do not change shared `MDTable`.
- Do not add benchmark or verifier infrastructure.

## Ownership

- `entities/databaseData`: spacer representation and Database-local native-table integration.
- `shared/ui/Table`: unchanged generic table presentation.
- widgets/pages/service/worker: unchanged.

## Source of truth

`rows.leadingSize`, `rows.trailingSize`, `columns.leadingSize`, and `columns.trailingSize` are the canonical virtual distances already produced by `useVirtualCollection`.

No new state or public API is required.

## Minimum sufficient design

Render a presentation spacer only when its corresponding virtual distance is greater than zero.

That applies consistently to:

- leading/trailing `<col>` elements;
- leading/trailing header spacer `<th>` elements;
- leading/trailing row spacer `<td>` elements;
- top/bottom row spacer `<tr>` elements.

`physicalColumnCount` must count only spacer columns that are actually rendered.

When a virtual distance is zero, the real logical row/cell must again become the physical table boundary so the existing `MDTable` structural styling applies naturally.

Keep non-zero spacers unchanged as presentation-only virtual geometry.

Do not recreate the `MDTable` border/radius system with Database-specific CSS. If conditional spacer omission is insufficient, stop and report the remaining concrete mismatch instead of broadening the design.

## Acceptance

- At logical top/left, zero-distance leading spacers are absent and the first real header/data cell owns the physical boundary.
- At logical bottom/right, zero-distance trailing spacers are absent and the last real row/property/action surface owns the physical boundary.
- Non-zero spacers remain present while ranges are virtualized away from logical edges.
- Action-column, no-action relation table, vertical/horizontal deep scrolling, bounded mounted work, ARIA counts/indices, dynamic sizing, and nested relation behavior remain correct.
- No shared `MDTable` or virtualization API change.

## Required proof

Update the existing application E2E owner `tests/e2e/databaseVirtualizationFlows.spec.ts` to protect the zero/non-zero spacer boundary contract in representative top-level and relation/no-action paths while retaining existing deep-range/boundedness assertions.

The current visual runner is Storybook-only and `databaseData` has no isolated Storybook product-service fixture. Do not add product bootstrap/mocking infrastructure solely for a screenshot. Operator visual inspection of the real Database table remains the final appearance check for this correction.

Focused coding feedback:

```bash
pnpm verify --only type-check
pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts
```

## Forbidden

- shared `MDTable` changes;
- new generic border/radius abstraction;
- geometry ownership changes;
- performance attribution or Number-specific optimization;
- TanStack / `useVirtualCollection` changes;
- worker/query/storage changes;
- direct Playwright/Vite/browser commands;
- sleeps, retries-as-success, timeout inflation, or `force`.

## Implementation readiness

Decisions resolved: **yes**.  
Unresolved blockers: **none**.  
Verdict: **ready**.
