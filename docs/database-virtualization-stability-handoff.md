# Database virtualization capability stability correction handoff

Status: **completed**.

## Goal

Close the two known intermittent Storybook browser proofs without changing the accepted virtualization architecture, `useVirtualCollection` public API, runtime behavior, native-table model, or production database code.

The corrected contracts were:

1. shared non-zero `surfaceOffset` deep-scroll geometry;
2. database above-viewport row-resize anchor stability.

## Accepted state

The correction did not reopen or change:

- `@tanstack/vue-virtual` as the sole range/measurement/cache engine;
- `useVirtualCollection` as the only Mioframe virtualization API;
- public result surface `items`, `totalSize`, `leadingSize`, `trailingSize`, `vItem`;
- the per-instance `vItem` directive contract;
- native `MDTable` row/column virtualization architecture;
- production database runtime code.

## Final correction

### Shared `surfaceOffset`

The deep-scroll proof now reads `leadingSize`, `totalSize`, `trailingSize`, the current tail item geometry, and viewport `scrollHeight` in one synchronous browser-side snapshot. It accepts the state only after the complete public/DOM invariant is valid and stable across consecutive observations.

The existing geometry and structural tolerances were retained.

### Database anchor

The anchor proof now captures the actual `scrollTop`, above-viewport candidate, visible anchor identity, anchor position, and row geometry from one browser-side snapshot. The baseline is accepted only after the actual corrected scroll position and chosen geometry are stable across consecutive observations.

The raw requested `scrollTop` is deliberately not used as the settled target: TanStack may legitimately correct scroll position after real row measurements differ from the estimate.

After row growth, the proof waits for the target row's public size increase and stable post-resize anchor geometry before asserting final anchor movement with the existing one-row-height tolerance.

## Verification result

Risk-specific stability diagnostic:

```bash
pnpm verify --only storybook-behavior --files \
  src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts \
  --repeat 10
```

Reported result: **300/300 test executions passed with no retries or flaky classification** across the applicable Chromium and Firefox projects.

No sleep, fixed-frame wait, timeout inflation, tolerance widening, private TanStack inspection, fixture protocol, or runtime change was introduced.

## Result

Stability correction: **accepted**.

See `docs/database-virtualization-collection-api-result.md` for the final capability result. Exact-head GitHub CI remains the architect-owned merge gate.
