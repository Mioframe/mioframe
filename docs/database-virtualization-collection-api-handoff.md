# Database virtualization collection API final correction handoff

Status: **ready**.

## Goal

Close the last capability-proof gap without changing the accepted `useVirtualCollection` architecture, public API, native-table model, or production database code.

Production database migration remains blocked until this final correction passes review.

## Confirmed accepted state

The following are already accepted and must not be reopened in this correction:

- `useVirtualCollection` is the only Mioframe virtualization API;
- consumers do not import TanStack or bind its measurement API directly;
- no second observer/cache/range/anchor engine exists;
- valid in-bounds `undefined` source values are supported;
- grow/shrink and stable-key remap are proven through public virtual geometry;
- non-zero `surfaceOffset`, `leadingSize`, `trailingSize`, and `totalSize` are proven;
- database row/column measurement is proven through public geometry and real `MDTable` geometry;
- column remount minimum is proven after widening body content is removed;
- above-viewport resize anchor behavior is proven in Chromium and Firefox;
- the dedicated fixed-size wrapper is the accepted physical scroll root for the capability fixture;
- the phantom min-content spacer normalization remains accepted;
- the current browser corpus reports 10 shared Chromium + 10 database Chromium + 10 database Firefox tests passing.

## Remaining blocker

The current bounded-cell test does not count actual mounted logical data-cell DOM.

The fixture publishes:

```text
rows.items.length * columns.items.length
```

and the test asserts that derived value. This proves bounded virtual ranges, but not the required observable contract that the real mounted logical `<td>` set is bounded and contains no retained/duplicated cells outside those ranges.

The proof owner is `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`.

## Required correction

At both the initial range and after deep two-dimensional scrolling:

1. count actual mounted logical data-cell DOM using the real database-cell selector, excluding spacer cells;
2. read current mounted row and column counts;
3. prove the actual logical-cell DOM count is bounded by a generous viewport/overscan-derived upper bound;
4. prove it is far below the 5,000 × 300 logical cross product;
5. prove actual mounted logical-cell DOM equals the expected current row-range × column-range intersection count once both axes have settled.

The test must fail if extra logical data cells remain mounted even while the virtual row/column range outputs stay bounded.

The fixture-level derived `db-virt-mounted-cells` output is not primary proof. Remove it if it has no remaining diagnostic value, or keep it only as a secondary diagnostic; do not use it instead of counting actual DOM.

## Documentation correction

After the actual-DOM proof passes, synchronize the status of:

- `docs/virtualization-library.md`;
- `docs/database-virtualization.md`;
- `docs/database-virtualization-profiling.md`;
- `docs/database-virtualization-browser-proof.md`;
- `docs/database-virtualization-collection-api-result.md`.

Final state must be unambiguous:

- shared virtualization architecture: accepted;
- shared collection API capability: passed;
- database native-table capability: passed;
- production database migration: not yet implemented;
- product performance profiling/acceptance: still pending production migration.

Do not leave any document saying the capability is pending after the final capability result is `Ready`.

## Acceptance criteria

- actual mounted logical `<td>` elements are counted directly at initial and deep 2D ranges;
- actual logical-cell DOM count equals the settled current row × column intersection count;
- actual logical-cell DOM remains bounded and far below the full logical cross product;
- no production component changes;
- no public API changes;
- no new observer/cache/registry/range state;
- existing corrected Chromium/Firefox geometry/accessibility proofs remain green;
- capability/result/source-of-truth statuses agree.

## Forbidden

- changing the `useVirtualCollection` public API;
- reopening accepted virtualization architecture;
- exposing TanStack internals;
- introducing independent measurement/geometry state;
- changing production database rendering;
- changing worker/query/paging/index behavior;
- weakening tests with sleeps, force, broad retries, or timeout inflation.

## Readiness

Verdict: **ready for one final focused proof/documentation correction**.
