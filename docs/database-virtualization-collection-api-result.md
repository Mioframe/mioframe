# Database virtualization collection API result

Status: **Ready**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/database-virtualization-collection-api-preflight.md`, `docs/virtualization-library.md`, `docs/database-virtualization.md`, `docs/database-virtualization-browser-proof.md`.

## Architecture status

The architecture, ownership, and public API are accepted and are not reopened by this result.

Accepted:

- `@tanstack/vue-virtual` remains the engine;
- `useVirtualCollection` is the only Mioframe virtualization API;
- public surface remains `items`, `totalSize`, `leadingSize`, `trailingSize`, `vItem`;
- no TanStack instance/types are exposed;
- no second observer/cache/range/anchor engine exists;
- database capability consumes only the shared API and uses actual `MDTable`;
- production database rendering is still unchanged.

## Resolved versions

| Package                               | Version       |
| ------------------------------------- | ------------- |
| `@tanstack/vue-virtual`               | 3.13.36       |
| `@tanstack/virtual-core` (transitive) | 3.17.8        |
| `@playwright/test`                    | 1.61.1        |
| Chromium (Playwright-managed)         | 149.0.7827.55 |
| Firefox (Playwright-managed)          | 151.0         |

## Existing corrected evidence

The final verifier run for this correction reported:

| Project                             | Spec(s)                                                     | Tests | Outcome   |
| ----------------------------------- | ----------------------------------------------------------- | ----: | --------- |
| `chromium`                          | shared `VirtualCollectionCapability.browser.spec.ts`        |    10 | 10 passed |
| `chromium`                          | database `DatabaseVirtualizationCapability.browser.spec.ts` |    10 | 10 passed |
| `firefox-virtualization-capability` | database spec only                                          |    10 | 10 passed |

Total reported result: **30/30 passed**, with no flaky/retried outcomes in the final run. Type-check, Storybook build (`storybook-build`), ESLint, Oxlint, and format were also reported green for this correction diff.

These results close the final proof gap described below.

## Contracts accepted by review

The following previous findings are closed:

| Contract                                                                                                | Review status |
| ------------------------------------------------------------------------------------------------------- | ------------- |
| Valid in-bounds `undefined` source value                                                                | ACCEPTED      |
| Vertical grow/shrink updates public `item.size`                                                         | ACCEPTED      |
| Horizontal growth updates public `item.size`                                                            | ACCEPTED      |
| Stable-key remap followed by resize updates public geometry at the new index                            | ACCEPTED      |
| Non-zero `surfaceOffset` keeps public geometry collection-relative                                      | ACCEPTED      |
| Deep `leadingSize`/`trailingSize`/`totalSize` relationship                                              | ACCEPTED      |
| Real `MDTable` row grow/shrink with public row size in Chromium/Firefox                                 | ACCEPTED      |
| Body-driven native column growth with public column size                                                | ACCEPTED      |
| Column remount minimum after widening content is removed while unmounted                                | ACCEPTED      |
| Deep vertical/horizontal logical geometry                                                               | ACCEPTED      |
| Above-viewport row resize anchor stability                                                              | ACCEPTED      |
| Native table accessibility semantics                                                                    | ACCEPTED      |
| Dedicated fixed-size wrapper as physical capability scroll root                                         | ACCEPTED      |
| Phantom min-content spacer normalization                                                                | ACCEPTED      |
| Actual mounted logical-cell DOM equals settled row × column intersection, at initial and deep 2D ranges | ACCEPTED      |

## Resolved blocker: mounted logical data-cell DOM

The database fixture previously published:

```text
rows.items.length * columns.items.length
```

as `db-virt-mounted-cells`, and the bounded-cell test asserted that derived value. This proved only that the virtual row and column ranges were bounded, not that the actual mounted logical `<td>` DOM contained only those intersections without retaining or duplicating cells outside the current ranges.

### Final proof performed

`src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts` now counts real logical database-cell DOM directly with `document.querySelectorAll('[data-testid^="db-virt-cell-"]').length` inside one browser-side `page.evaluate`, alongside the existing mounted row/column range readouts, so all three values are read from one self-consistent snapshot. Spacer `<td>` elements carry no `db-virt-cell-`-prefixed `data-testid` and are excluded by construction.

Both the initial state and the state after deep 2D scrolling (`scrollTop`/`scrollLeft` driven to `Number.MAX_SAFE_INTEGER`) are read by polling until the snapshot is self-consistent (`cells === rows * cols` and both ranges non-empty), then asserted:

- actual mounted logical-cell DOM count equals the settled mounted row-range × column-range intersection count, at both initial and deep 2D ranges;
- mounted rows and mounted columns each stay below 30;
- actual mounted logical-cell DOM count stays below the generous bound of 900;
- actual mounted logical-cell DOM count stays far below the 5,000 × 300 (1,500,000) logical cross product, at both ranges.

The obsolete `db-virt-mounted-cells` derived output was removed from `DatabaseVirtualizationCapabilityFixture.vue`; it had no remaining diagnostic value once the test counts actual DOM directly.

No discrepancy between actual mounted logical-cell DOM and the settled row × column intersection was observed at either range in the final verifier run.

## Documentation status

All source-of-truth status statements below are updated in this same correction so no document continues to say the capability is `pending` while this result says `Ready`:

- shared API implementation/browser proof: passed;
- native-table capability: passed;
- production database migration: not started, ready to begin planning;
- product performance profiling/acceptance: pending production migration (unchanged — this remains a separate, later stage).

## Final verdict

**Ready.**

No architecture redesign was required. Production migration preflight may proceed; production database migration implementation itself remains a separate, not-yet-started stage.
