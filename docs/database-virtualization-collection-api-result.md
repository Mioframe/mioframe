# Database virtualization collection API result

Status: **Ready**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/database-virtualization-collection-api-preflight.md`, `docs/database-virtualization-stability-handoff.md`, `docs/database-virtualization-stability-preflight.md`, `src/shared/ui/virtualization/README.md`, `docs/database-virtualization.md`, `docs/database-virtualization-browser-proof.md`.

## Architecture status

The architecture, ownership, and public API are accepted.

Accepted:

- `@tanstack/vue-virtual` remains the engine;
- `useVirtualCollection` is the only Mioframe virtualization API;
- public surface is `items`, `totalSize`, `leadingSize`, `trailingSize`, `vItem`;
- no `measure` compatibility alias exists;
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

## Capability contracts

| Contract                                                                                                | Status   |
| ------------------------------------------------------------------------------------------------------- | -------- |
| Public directive property is `vItem`; no compatibility alias                                            | ACCEPTED |
| Valid in-bounds `undefined` source value                                                                | ACCEPTED |
| Vertical grow/shrink updates public `item.size`                                                         | ACCEPTED |
| Horizontal growth updates public `item.size`                                                            | ACCEPTED |
| Stable-key remap followed by resize updates public geometry at the new index                            | ACCEPTED |
| Non-zero `surfaceOffset` keeps public geometry collection-relative                                      | ACCEPTED |
| Deep `leadingSize`/`trailingSize`/`totalSize` relationship                                              | ACCEPTED |
| Real `MDTable` row grow/shrink with public row size in Chromium/Firefox                                 | ACCEPTED |
| Body-driven native column growth with public column size                                                | ACCEPTED |
| Column remount minimum after widening content is removed while unmounted                                | ACCEPTED |
| Deep vertical/horizontal logical geometry                                                               | ACCEPTED |
| Above-viewport row resize anchor stability                                                              | ACCEPTED |
| Native table accessibility semantics                                                                    | ACCEPTED |
| Dedicated fixed-size wrapper as physical capability scroll root                                         | ACCEPTED |
| Phantom min-content spacer normalization                                                                | ACCEPTED |
| Actual mounted logical-cell DOM equals settled row × column intersection, at initial and deep 2D ranges | ACCEPTED |

## Mounted-cell DOM proof

`DatabaseVirtualizationCapability.browser.spec.ts` directly counts rendered logical database `<td>` elements with `[data-testid^="db-virt-cell-"]` in the same browser-side snapshot as mounted row/column counts.

At initial and deep 2D ranges it proves:

- actual logical-cell DOM equals the settled mounted row × column intersection;
- mounted rows and columns each remain below 30;
- actual mounted logical cells remain below 900;
- mounted work stays far below the 5,000 × 300 logical cross product.

The old derived `rows.items.length * columns.items.length` diagnostic output was removed.

## Stability correction

Two required geometry proofs were previously known intermittent. They are now corrected as test-authoring races rather than runtime defects.

### Shared non-zero `surfaceOffset`

Deep public geometry and physical scroll extent are read in one synchronous browser-side snapshot and accepted only when the complete invariant is valid and stable across consecutive observations.

### Database above-viewport anchor

The baseline now waits for stable actual `scrollTop`, row identities, and anchor geometry. It does not require the actual settled scroll position to equal the raw requested pixel value because TanStack may legitimately adjust it after real measurements replace estimates.

After row growth, the proof waits for public row-size growth plus stable final anchor geometry before comparing anchor movement.

No tolerance widening, sleep, fixed-frame wait, timeout inflation, retry acceptance, fixture protocol, public API change, or runtime change was introduced.

## Verification evidence

The task-specific stability diagnostic was:

```bash
pnpm verify --only storybook-behavior --files \
  src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts \
  --repeat 10
```

Reported result: **300/300 test executions passed with no retries or flaky classification** across the applicable Chromium and Firefox projects.

Focused type-check also passed.

Exact-head GitHub CI remains the architect-owned automatic merge gate.

## Documentation status

- shared virtualization architecture/public API: accepted;
- shared browser capability: passed;
- database native-table capability: passed;
- capability stability gate: passed;
- production database migration: not started, ready for architecture/preflight;
- product performance profiling/acceptance: pending production migration.

## Final verdict

**Ready.**

The virtualization capability/foundation stage is complete. Production database migration is the next separate stage and is not implemented by this PR.