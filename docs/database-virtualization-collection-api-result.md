# Database virtualization collection API result

Status: **not ready; one final mounted-cell DOM proof gap remains**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/database-virtualization-collection-api-preflight.md`, `docs/virtualization-library.md`, `docs/database-virtualization.md`, `docs/database-virtualization-browser-proof.md`.

## Architecture status

The architecture, ownership, and public API are accepted and are not reopened by this result.

Accepted:

- `@tanstack/vue-virtual` remains the engine;
- `useVirtualCollection` is the only Mioframe virtualization API;
- public surface remains `items`, `totalSize`, `leadingSize`, `trailingSize`, `measure`;
- no TanStack instance/types are exposed;
- no second observer/cache/range/anchor engine exists;
- database capability consumes only the shared API and uses actual `MDTable`;
- production database rendering is still unchanged.

## Resolved versions

| Package | Version |
| --- | --- |
| `@tanstack/vue-virtual` | 3.13.36 |
| `@tanstack/virtual-core` (transitive) | 3.17.8 |
| `@playwright/test` | 1.61.1 |
| Chromium (Playwright-managed) | 149.0.7827.55 |
| Firefox (Playwright-managed) | 151.0 |

## Existing corrected evidence

The latest completed browser run before this final review reported:

| Project | Spec(s) | Tests | Outcome |
| --- | --- | ---: | --- |
| `chromium` | shared `VirtualCollectionCapability.browser.spec.ts` | 10 | 10 passed |
| `chromium` | database `DatabaseVirtualizationCapability.browser.spec.ts` | 10 | 10 passed |
| `firefox-virtualization-capability` | database spec only | 10 | 10 passed |

Total reported result: **30/30 passed**. Type-check, Storybook build, ESLint, Oxlint, and format were also reported green for the correction diff.

Those green results do not close the final proof gap described below.

## Contracts accepted by review

The following previous findings are closed:

| Contract | Review status |
| --- | --- |
| Valid in-bounds `undefined` source value | ACCEPTED |
| Vertical grow/shrink updates public `item.size` | ACCEPTED |
| Horizontal growth updates public `item.size` | ACCEPTED |
| Stable-key remap followed by resize updates public geometry at the new index | ACCEPTED |
| Non-zero `surfaceOffset` keeps public geometry collection-relative | ACCEPTED |
| Deep `leadingSize`/`trailingSize`/`totalSize` relationship | ACCEPTED |
| Real `MDTable` row grow/shrink with public row size in Chromium/Firefox | ACCEPTED |
| Body-driven native column growth with public column size | ACCEPTED |
| Column remount minimum after widening content is removed while unmounted | ACCEPTED |
| Deep vertical/horizontal logical geometry | ACCEPTED |
| Above-viewport row resize anchor stability | ACCEPTED |
| Native table accessibility semantics | ACCEPTED |
| Dedicated fixed-size wrapper as physical capability scroll root | ACCEPTED |
| Phantom min-content spacer normalization | ACCEPTED |

## Remaining blocker: mounted logical data-cell DOM

The current database fixture publishes:

```text
rows.items.length * columns.items.length
```

as `db-virt-mounted-cells`, and the bounded-cell test asserts that derived value.

This proves that the virtual row and column ranges are bounded. It does **not** directly prove that the actual mounted logical `<td>` DOM contains only those intersections and does not retain or duplicate logical cells outside the current ranges.

The durable contract in `docs/database-virtualization-browser-proof.md` requires direct observable mounted-cell DOM evidence.

### Required final proof

At both initial and deep two-dimensional ranges:

- count real logical database-cell DOM using `[data-testid^="db-virt-cell-"]` or an equivalent exact selector;
- exclude spacer cells;
- prove actual mounted logical-cell count equals the settled mounted row-range × column-range intersection count;
- prove actual count stays within the generous viewport/overscan bound;
- prove actual count remains far below the 5,000 × 300 logical cross product.

The derived `db-virt-mounted-cells` output may remain diagnostic but cannot be the primary proof.

## Documentation status

While this final proof is pending, the following existing source-of-truth status statements are intentionally still correct:

- shared API implementation/browser proof: pending final capability closure;
- native-table capability: pending final capability closure;
- production database migration: not started;
- product performance profiling/acceptance: pending production migration.

After the actual-DOM proof passes, all status documents must be updated in the same correction so no document continues to say capability `pending` while this result says `Ready`.

## Final verdict

**Not ready.**

No architecture redesign is required. Production migration preflight is blocked only on the direct mounted logical-cell DOM proof and final status synchronization.
