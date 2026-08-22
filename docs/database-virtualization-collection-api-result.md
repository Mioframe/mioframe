# Database virtualization collection API result

Status: **not ready; architecture and public API accepted, capability stability proof blocked by known intermittent browser failures**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/database-virtualization-collection-api-preflight.md`, `src/shared/ui/virtualization/README.md`, `docs/database-virtualization.md`, `docs/database-virtualization-browser-proof.md`.

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

A clean focused run reported:

| Project                             | Spec(s)                                                     | Tests | Outcome   |
| ----------------------------------- | ----------------------------------------------------------- | ----: | --------- |
| `chromium`                          | shared `VirtualCollectionCapability.browser.spec.ts`        |    10 | 10 passed |
| `chromium`                          | database `DatabaseVirtualizationCapability.browser.spec.ts` |    10 | 10 passed |
| `firefox-virtualization-capability` | database spec only                                          |    10 | 10 passed |

The same current implementation also produced an earlier failed focused run in which the required non-zero-`surfaceOffset` shared geometry proof and the database above-viewport anchor proof failed intermittently before a later clean rerun.

Repository policy does not accept a later clean run as proof that a known intermittent failure is green. These failures therefore remain an active stability blocker until their test-authoring/runtime cause is corrected and the required proof is deterministic.

Type-check for the `vItem` rename passed. The rename itself is accepted and is not implicated by the two geometry failures.

## Contracts accepted by review

The following behavior/architecture findings remain accepted:

| Contract                                                                                                | Review status |
| ------------------------------------------------------------------------------------------------------- | ------------- |
| Public directive property is `vItem`; no `measure` compatibility alias                                 | ACCEPTED      |
| Valid in-bounds `undefined` source value                                                                | ACCEPTED      |
| Vertical grow/shrink updates public `item.size`                                                         | ACCEPTED      |
| Horizontal growth updates public `item.size`                                                            | ACCEPTED      |
| Stable-key remap followed by resize updates public geometry at the new index                            | ACCEPTED      |
| Non-zero `surfaceOffset` contract and collection-relative geometry                                      | ACCEPTED BEHAVIOR; STABILITY PROOF BLOCKED |
| Deep `leadingSize`/`trailingSize`/`totalSize` relationship                                              | ACCEPTED      |
| Real `MDTable` row grow/shrink with public row size in Chromium/Firefox                                 | ACCEPTED      |
| Body-driven native column growth with public column size                                                | ACCEPTED      |
| Column remount minimum after widening content is removed while unmounted                                | ACCEPTED      |
| Deep vertical/horizontal logical geometry                                                               | ACCEPTED      |
| Above-viewport row resize anchor behavior                                                               | ACCEPTED BEHAVIOR; STABILITY PROOF BLOCKED |
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

The obsolete `db-virt-mounted-cells` derived output was removed from `DatabaseVirtualizationCapabilityFixture.vue`.

## Active stability blocker

Two required capability tests are currently known to be intermittent:

1. `VirtualCollectionCapability.browser.spec.ts` — the non-zero `surfaceOffset` geometry scenario can fail a scroll/geometry tolerance assertion before passing on a later rerun.
2. `DatabaseVirtualizationCapability.browser.spec.ts` — the above-viewport resize anchor scenario can fail before passing on a later rerun.

The current tests sample live browser geometry after conditions that are not sufficient to prove the complete geometry snapshot has settled. The correction must make these proofs deterministic without sleeps, force, broad retries, timeout inflation, weakened tolerances, or private TanStack state.

A clean exact-head CI run is still required after the stability correction, but CI passing once does not by itself erase a known intermittent proof failure.

## Documentation status

Current state:

- shared virtualization architecture/public API: accepted;
- `vItem` rename: accepted;
- shared/database capability behavior: implemented and manually demonstrated;
- capability stability proof: blocked by the two known intermittent browser tests above;
- production database migration: not started and remains blocked on deterministic capability proof;
- product performance profiling/acceptance: pending production migration.

## Final verdict

**Not ready.**

No architecture redesign is required. Correct the two browser-proof stability defects, then rerun the focused capability proof and exact-head CI. Production database migration preflight remains blocked until the required browser proof is deterministic.