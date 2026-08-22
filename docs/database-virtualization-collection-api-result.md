# Database virtualization collection API result

Status: **capability implementation complete; both proof owners pass**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/database-virtualization-collection-api-preflight.md`, `docs/virtualization-library.md`, `docs/database-virtualization.md`, `docs/database-virtualization-browser-proof.md`.

## Resolved versions

| Package                               | Version       |
| ------------------------------------- | ------------- |
| `@tanstack/vue-virtual`               | 3.13.36       |
| `@tanstack/virtual-core` (transitive) | 3.17.8        |
| `@playwright/test`                    | 1.61.1        |
| Chromium (Playwright-managed)         | 149.0.7827.55 |
| Firefox (Playwright-managed)          | 151.0         |

## Test counts and outcomes

Run: `pnpm verify --only storybook-behavior --files src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts` (config `playwright.storybook.config.ts`).

| Project                             | Spec(s)                                                            | Tests | Outcome  |
| ----------------------------------- | ------------------------------------------------------------------ | ----- | -------- |
| `chromium`                          | `VirtualCollectionCapability.browser.spec.ts` (shared)             | 8     | 8 passed |
| `chromium`                          | `DatabaseVirtualizationCapability.browser.spec.ts` (database)      | 8     | 8 passed |
| `firefox-virtualization-capability` | `DatabaseVirtualizationCapability.browser.spec.ts` (database only) | 8     | 8 passed |

Total: **24/24 passed**, 0 failed. `storybook-build` (`pnpm storybook:build`) and `type-check` for all touched files also pass.

## Shared API contract matrix (`useVirtualCollection`)

| Contract                                                                                                  | Result |
| --------------------------------------------------------------------------------------------------------- | ------ |
| ≥10,000 logical items, bounded mounted DOM                                                                | PASS   |
| Visible `{ index, key, value }` matches source truth                                                      | PASS   |
| Measurement directive adds no wrapper DOM; no explicit TanStack binding in markup; no `[data-index]` leak | PASS   |
| Mounted item grows then shrinks; geometry updates both times (vertical)                                   | PASS   |
| Dynamic growth updates geometry (horizontal)                                                              | PASS   |
| Stable-key reorder/index remap, then a further resize follows the item's new current index                | PASS   |
| Deep scroll produces materially large `leadingSize` and correct visible logical identity                  | PASS   |
| Unmount/remount has no stale geometry or page errors                                                      | PASS   |

No `useVirtualAxis` remains. `src/shared/ui/virtualization` exposes only `useVirtualCollection` (`index.ts`). The public surface matches the narrow contract from `docs/virtualization-library.md` exactly: `items`, `totalSize`, `leadingSize`, `trailingSize`, `measure`; no TanStack instance/types, no `scrollToIndex`, no `data-index`/`measureElement` exposure.

## Database native-table contract matrix

| Contract                                                                                                                                                                                                | Result |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Renders through actual `MDTable`; native `<table>`/`<thead>`/`<tbody>` semantics; `aria-rowcount`/`aria-colcount` complete (5001 / 300)                                                                 | PASS   |
| Spacer rows/cells excluded from logical accessibility semantics (`aria-hidden`, absent from role queries)                                                                                               | PASS   |
| Correct logical `aria-rowindex`/`aria-colindex` for visible cells                                                                                                                                       | PASS   |
| Dynamic `<tr>` height: grow **and** shrink, real `MDTable` geometry                                                                                                                                     | PASS   |
| Dynamic `<th>` width driven by mounted body-cell content (header text unchanged)                                                                                                                        | PASS   |
| Deep vertical offset: bounded mounted rows, top spacer materially large (>100,000px), visible `aria-rowindex` > 4900 near the end of 5,000 rows                                                         | PASS   |
| Deep horizontal offset: bounded mounted columns, left spacer materially large (>10,000px), a property with index ≥ 290 mounts in header **and** body, header/body ranges agree, early properties absent | PASS   |
| Column remount-stability: `size` used as remount `min-width`, no shrink/regrow across ordinary horizontal scroll                                                                                        | PASS   |

Fixture scale: 5,000 logical rows × 300 logical properties, one physical scroll root, synthetic data only. Firefox project (`firefox-virtualization-capability`) is scoped to exactly `DatabaseVirtualizationCapability.browser.spec.ts`, matching the handoff's narrow Firefox gate.

## Native-table normalization

The colgroup + phantom min-content spacer technique (a 1px-tall `<div>` sized to the collection's `leadingSize`/`trailingSize` inside an otherwise-empty spacer `<th>`) **remains necessary** — `MDTable` does not set `table-layout: fixed`, and auto-layout tables only reliably honor an empty cell's own `width` as a weak hint, not an authoritative min-content constraint.

### Root-ownership correction found during proof

The initial implementation made `MDTable`'s own root element (which carries `overflow: auto` in its own scoped CSS) the `useVirtualCollection` scroll root, matching the API's "one physical scroll root" requirement literally. This broke virtualization in the real browser (not observable in a jsdom/Vue Test Utils mount, which never triggers layout): an auto-layout (`table-layout: auto`) table cannot be narrower than its own min-content width, and the trailing phantom spacer's min-content requirement (representing the full un-rendered extent — tens of thousands of pixels at this scale) forced the table to grow past any explicit CSS width instead of overflowing internally. The table never actually scrolled; instead it inflated to near its full logical size, and `ResizeObserver`-reported viewport dimensions grew to match, causing TanStack to treat most of the 300 columns as "visible" and attempt to measure/mount them — hanging real browser test runs at the very first render (all 8 database tests timed out at ~30s each before the fix; the isolated shared-composable spec, which uses ordinary `<div>`/`<li>` markup with no table min-content behavior, passed cleanly throughout, confirming `useVirtualCollection` itself was correct).

The fix restores a dedicated wrapper `<div>` (fixed size, `overflow: auto`) as the actual scroll root, with `MDTable` mounted inside it unconstrained — the wrapper's box is a real, content-independent constraint (divs do not have the table min-content quirk), so it is the element that truly scrolls; `MDTable` is free to grow to its intrinsic (huge, spacer-driven) size and overflow the wrapper, exactly as the removed `useVirtualAxis`-based fixture did with a raw `<table>`. This keeps "one physical scroll root" as a _behavioral_ invariant (exactly one element's scroll position drives both axes) without requiring the scrollable element to literally be `<table>` itself.

## Firefox real-`MDTable` dynamic row result

PASS. `<tr>` grow-and-shrink measurement (contract above) passes in the narrow Firefox project using the real `MDTable` geometry, with no fixed row heights and no second measurement engine.

## Architecture boundary confirmation

- Exactly one `useVirtualizer` per `useVirtualCollection` instance; no second element registry, independent `ResizeObserver`, measured-size cache, or custom offset/range/anchor algorithm was introduced.
- No arbitrary TanStack option passthrough; no TanStack instance/types exposed publicly.
- No `VirtualList`/`VirtualTable`/`VirtualGrid`, two-axis coordinator, or functional/renderless VNode-cloning component was introduced.
- No root directive or automatic scroll-parent discovery was introduced — both fixtures forward an explicit root.
- Database rows/properties consume `useVirtualCollection` only; no direct `@tanstack/vue-virtual` import remains in `src/entities/databaseData`.
- Production `DatabaseDataTable.vue`, `DatabaseViewLayout.vue`, `DatabaseViewWidget.vue`, `EditableInlineValue.vue`, `MDTable.vue`, and worker/service code are unchanged.

## Verdict

**Ready.** The shared `useVirtualCollection` public API and the database native-table capability both pass their required contracts in Chromium; the narrow Firefox gate for dynamic `<tr>`/`<th>` measurement against real `MDTable` geometry also passes. No stop condition from the handoff/preflight was hit. Production migration preflight may proceed.
