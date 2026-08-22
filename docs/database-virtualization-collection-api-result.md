# Database virtualization collection API result

Status: **capability proof corrected; both proof owners pass on the corrected contracts**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/database-virtualization-collection-api-preflight.md`, `docs/virtualization-library.md`, `docs/database-virtualization.md`, `docs/database-virtualization-browser-proof.md`.

This revision replaces the previous `not ready` review-findings result. Every contract flagged **NOT PROVEN**/**FAIL IMPLEMENTATION CONTRACT** there is now corrected and re-proven below; the architecture, ownership, and public API are unchanged.

## Resolved versions

| Package                               | Version       |
| ------------------------------------- | ------------- |
| `@tanstack/vue-virtual`               | 3.13.36       |
| `@tanstack/virtual-core` (transitive) | 3.17.8        |
| `@playwright/test`                    | 1.61.1        |
| Chromium (Playwright-managed)         | 149.0.7827.55 |
| Firefox (Playwright-managed)          | 151.0         |

No dependency version changed for this correction.

## Implementation correction

`useVirtualCollection.ts`'s internal `readValue()` previously treated `currentSource[index] === undefined` as the missing-index signal, which incorrectly rejected a legitimately `undefined` in-bounds source value (for example `readonly (string | undefined)[]`). It now validates `index` against `[0, currentSource.length)` independently of the value, so a valid `undefined` entry is returned normally. No public API changed.

## Test counts and outcomes

Run: `pnpm verify --only storybook-behavior --files src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts` (config `playwright.storybook.config.ts`). Run three times consecutively (plus once per owner individually) to confirm no flake.

| Project                             | Spec(s)                                                            | Tests | Outcome   |
| ----------------------------------- | ------------------------------------------------------------------ | ----- | --------- |
| `chromium`                          | `VirtualCollectionCapability.browser.spec.ts` (shared)             | 10    | 10 passed |
| `chromium`                          | `DatabaseVirtualizationCapability.browser.spec.ts` (database)      | 10    | 10 passed |
| `firefox-virtualization-capability` | `DatabaseVirtualizationCapability.browser.spec.ts` (database only) | 10    | 10 passed |

Total: **30/30 passed**, 0 failed, 0 flaky across three independent runs of the full combined command. `storybook-build` (`pnpm storybook:build`), `type-check`, `eslint`, `oxlint`, and `format` for all touched files also pass.

Two genuine test-authoring races surfaced and were fixed while stabilizing the new assertions (test defects, not app defects):

- the bounded-mounted-cells check originally read `mounted-rows`/`mounted-cols`/`mounted-cells` via three separate sequential `textContent()` calls, which could straddle a Vue re-render and observe a torn snapshot; it now reads all three atomically inside one `page.evaluate` and polls for a self-consistent (`cells === rows * cols`) snapshot before asserting on it.
- the above-viewport anchor row selector originally required _strict_ full containment inside the viewport's bounding box, which was flaky under sub-pixel layout rounding; it now classifies rows by overlap with a small epsilon.

## Shared API contract matrix (`useVirtualCollection`)

| Contract                                                                                                                                                                                                                                                                                                                                                                           | Result |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| ≥10,000 logical items, bounded mounted DOM                                                                                                                                                                                                                                                                                                                                         | PASS   |
| Visible `{ index, key, value }` matches source truth                                                                                                                                                                                                                                                                                                                               | PASS   |
| Measurement directive adds no wrapper DOM; no explicit TanStack binding in markup; no `[data-index]` leak                                                                                                                                                                                                                                                                          | PASS   |
| Mounted item grows then shrinks; **public `item.size`** (not only physical `boundingBox()`) updates both times (vertical)                                                                                                                                                                                                                                                          | PASS   |
| Dynamic growth updates **public `item.size`** (horizontal), not only `boundingBox().width`                                                                                                                                                                                                                                                                                         | PASS   |
| Stable-key reorder/index remap: returned `{ key, index, value }` reflects the new index, then a further resize increases **public geometry at the new index**, verified against both `data-item-size` and physical height                                                                                                                                                          | PASS   |
| Deep scroll produces materially large `leadingSize`; `trailingSize` is verified against `totalSize - (last.offset + last.size)`, not merely asserted non-negative                                                                                                                                                                                                                  | PASS   |
| Non-zero `surfaceOffset`: first item's public `offset` is `0` (surface-relative, not root-relative); `leadingSize` is `0`; physical position equals `surfaceOffset + item.offset - scrollTop` with no manual double-subtraction by the consumer; `totalSize` matches the offset-free baseline within tolerance; post-deep-scroll `trailingSize` still satisfies the extent formula | PASS   |
| Valid `undefined` source value at an in-bounds index: no thrown `RangeError`/page error, renders correctly, neighboring keys/values are unaffected                                                                                                                                                                                                                                 | PASS   |
| Unmount/remount has no stale geometry or page errors                                                                                                                                                                                                                                                                                                                               | PASS   |

No `useVirtualAxis` remains. `src/shared/ui/virtualization` exposes only `useVirtualCollection` (`index.ts`). The public surface matches the narrow contract from `docs/virtualization-library.md` exactly: `items`, `totalSize`, `leadingSize`, `trailingSize`, `measure`; no TanStack instance/types, no `scrollToIndex`, no `data-index`/`measureElement` exposure. The shared fixture exposes only test-only derived outputs (`data-item-size`, `data-item-offset`, `vcc-leading-size`/`vcc-trailing-size`/`vcc-total-size`) computed directly from the public `useVirtualCollection` result — no TanStack instance or private state is exposed.

## Database native-table contract matrix

| Contract                                                                                                                                                                                                                                                                                                                                                                               | Result |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Renders through actual `MDTable`; native `<table>`/`<thead>`/`<tbody>` semantics; `aria-rowcount`/`aria-colcount` complete (5001 / 300)                                                                                                                                                                                                                                                | PASS   |
| Spacer rows/cells excluded from logical accessibility semantics (`aria-hidden`, absent from role queries)                                                                                                                                                                                                                                                                              | PASS   |
| Correct logical `aria-rowindex`/`aria-colindex` for visible cells                                                                                                                                                                                                                                                                                                                      | PASS   |
| Dynamic `<tr>` height: grow **and** shrink, verified against both real `MDTable` geometry **and public row `size`** (`data-row-size`)                                                                                                                                                                                                                                                  | PASS   |
| Dynamic `<th>` width driven by mounted body-cell content (header text unchanged), verified against both physical width **and public column `size`** (`data-col-size`)                                                                                                                                                                                                                  | PASS   |
| Deep vertical offset: bounded mounted rows, top spacer materially large (>100,000px), visible `aria-rowindex` > 4900 near the end of 5,000 rows                                                                                                                                                                                                                                        | PASS   |
| Deep horizontal offset: bounded mounted columns, left spacer materially large (>10,000px), a property with index ≥ 290 mounts in header **and** body, header/body ranges agree, early properties absent                                                                                                                                                                                | PASS   |
| Column remount minimum: previously discovered public `size` is recorded, the column is scrolled out of range, **the widening body content is then removed while unmounted**, and the column remounts at/above the discovered size (verified against physical width **and** `data-col-size`); an unrelated never-widened column stays visibly narrower, ruling out native content alone | PASS   |
| Mounted logical data cells explicitly bounded (`rows.items.length * columns.items.length`, spacer cells excluded) at both initial and deep 2D ranges, verified `< 900` and `< (5,000 × 300) / 1000`                                                                                                                                                                                    | PASS   |
| Above-viewport resize anchor stability: a row within the overscan-mounted buffer but visually above the viewport is grown (verified via public `data-row-size`); a stable visible anchor row's screen position moves by less than one representative row height (28px), proving TanStack's own scroll correction — not a second algorithm — compensates                                | PASS   |

Fixture scale: 5,000 logical rows × 300 logical properties, one physical scroll root, synthetic data only. Firefox project (`firefox-virtualization-capability`) is scoped to exactly `DatabaseVirtualizationCapability.browser.spec.ts`, matching the handoff's narrow Firefox gate.

## Native-table normalization

The colgroup + phantom min-content spacer technique (a 1px-tall `<div>` sized to the collection's `leadingSize`/`trailingSize` inside an otherwise-empty spacer `<th>`) **remains necessary** — `MDTable` does not set `table-layout: fixed`, and auto-layout tables only reliably honor an empty cell's own `width` as a weak hint, not an authoritative min-content constraint. Unchanged by this correction.

### Root-ownership finding (unchanged from the previous proof)

Using `MDTable` itself as the scroll root is not viable with the native-table phantom spacer under `table-layout: auto`: the table's min-content width expands instead of producing a stable internal viewport. The accepted capability topology remains:

```text
fixed-size overflow wrapper  ← physical scroll root
          ↓
       MDTable
          ↓
 native virtual spacer/table content
```

This does not add a second scroll owner and is compatible with the production architecture where `.database-view` is expected to own the physical viewport.

## Firefox real-`MDTable` dynamic row result

PASS. `<tr>` grow-and-shrink measurement, now verified against **public row `size`** in addition to physical geometry, passes in the narrow Firefox project using real `MDTable` geometry, with no fixed row heights and no second measurement engine.

## Architecture boundary confirmation

- Exactly one `useVirtualizer` per `useVirtualCollection` instance; no second element registry, independent `ResizeObserver`, measured-size cache, or custom offset/range/anchor algorithm was introduced. The above-viewport anchor proof specifically exercises TanStack's own built-in scroll correction rather than any Mioframe-owned anchoring logic.
- No arbitrary TanStack option passthrough; no TanStack instance/types exposed publicly. The corrected shared fixture exposes only test-only derived outputs computed from the public result (`item.size`, `item.offset`, `leadingSize`, `trailingSize`, `totalSize`).
- No `VirtualList`/`VirtualTable`/`VirtualGrid`, two-axis coordinator, or functional/renderless VNode-cloning component was introduced.
- No root directive or automatic scroll-parent discovery was introduced — both fixtures forward an explicit root.
- Database rows/properties consume `useVirtualCollection` only; no direct `@tanstack/vue-virtual` import remains in `src/entities/databaseData`.
- No live column-width shrink/reset was implemented; the column remount proof only reuses the already-public `size` as remount `min-width`, exactly as before.
- Production `DatabaseDataTable.vue`, `DatabaseViewLayout.vue`, `DatabaseViewWidget.vue`, `EditableInlineValue.vue`, `MDTable.vue`, and worker/service code are unchanged.

## Verdict

**Ready.** The shared `useVirtualCollection` public API and the database native-table capability both pass their corrected required contracts in Chromium; the narrow Firefox gate for dynamic `<tr>`/`<th>` measurement against real `MDTable` geometry also passes. The proof now demonstrates public virtual geometry (not only physical DOM effects) for grow/shrink, stable-key remap, non-zero `surfaceOffset`, deep leading/trailing extent, column remount, and above-viewport anchor stability; a valid `undefined` source value at an in-bounds index is proven to work; mounted data cells are explicitly bounded. No stop condition from the handoff/preflight was hit. Production migration preflight may proceed.
