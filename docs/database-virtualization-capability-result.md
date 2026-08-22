# Database virtualization capability result

Status: **capability gate passed; native-table-first model accepted; ready for production-migration preflight.**

This records the outcome of the capability implementation defined by
`docs/database-virtualization-capability-handoff.md` and
`docs/database-virtualization-capability-preflight.md`, verified per
`docs/database-virtualization-browser-proof.md`.

## Resolved versions

| Component                             | Resolved version                                                        |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `@tanstack/vue-virtual`               | `3.13.36` (`^3.13.36` in `package.json`; on the required `3.13.x` line) |
| `@tanstack/virtual-core` (transitive) | `3.17.8`                                                                |
| Playwright                            | `1.61.1`                                                                |
| Chromium (via Playwright)             | `149.0.7827.55`                                                         |
| Firefox (via Playwright)              | `151.0`                                                                 |

`@tanstack/vue-virtual` and its lockfile entry were already present in the working tree at task
start, one patch ahead of the `^3.13.35` line named in the preflight; `3.13.36` is the current
stable patch on that same line and required no change.

## Capability contracts

All contracts below were proven with real Playwright browser execution against the actual
shared `useVirtualAxis` adapter (`src/shared/ui/virtualization/useVirtualAxis.ts`) and the two
capability Storybook specs, in both the ordinary Chromium Storybook-behavior project and the
narrow `firefox-virtualization-capability` Playwright project added to
`playwright.storybook.config.ts` (scoped exactly to the two capability specs). Final run: 40/40
tests passed in each project (80 total).

### Shared adapter capability (`src/shared/ui/virtualization/VirtualizationCapability.browser.spec.ts`)

| Contract                                                   | Result                                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 10,000+ logical items, bounded mounted DOM                 | **pass**                                                                                                          |
| Dynamic vertical measurement + repeated post-mount resize  | **pass**                                                                                                          |
| Dynamic horizontal measurement                             | **pass**                                                                                                          |
| No TanStack `data-index` attribute exposed to consumers    | **pass**                                                                                                          |
| Stable-key measurement association after index remapping   | **pass**                                                                                                          |
| `scrollMargin` (content before the virtual surface)        | **pass**                                                                                                          |
| `scrollPaddingStart` clears deep `scrollToIndex` targets   | **pass**                                                                                                          |
| `scrollPaddingEnd` clears deep `scrollToIndex` targets     | **pass**                                                                                                          |
| Deep `scrollToIndex` without mounting predecessors         | **pass**                                                                                                          |
| Acceptable anchor stability after an above-viewport resize | **pass** (bounded well under one item's own height; not claimed pixel-exact — see Adapter/fixture normalizations) |
| Cleanup on unmount / correct behavior after remount        | **pass**                                                                                                          |
| Two axes sharing one scroll root                           | **pass**                                                                                                          |
| Two axes using different scroll roots                      | **pass**                                                                                                          |

### Native-table capability (`src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`)

| Contract                                                                         | Result                                                            |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Semantic `<table>/<thead>/<tbody>/<tr>/<th>/<td>`                                | **pass**                                                          |
| Top/bottom virtual spacer rows                                                   | **pass**                                                          |
| Left/right virtual spacer columns                                                | **pass**                                                          |
| Dynamic `<tr>` vertical measurement                                              | **pass**                                                          |
| Dynamic `<th>` horizontal measurement                                            | **pass**                                                          |
| Body content affects current native column layout                                | **pass**                                                          |
| Correct deep vertical and horizontal offsets, bounded mounted DOM                | **pass**                                                          |
| No destructive measured-width shrink/regrow on ordinary scroll (remount minimum) | **pass**                                                          |
| Logical `aria-rowcount`/`aria-colcount`/`aria-rowindex`/`aria-colindex`          | **pass**                                                          |
| Spacer/fill DOM excluded from logical accessibility semantics                    | **pass**                                                          |
| Firefox dynamic row/column measurement, deep offsets, accessibility              | **pass** (same spec, `firefox-virtualization-capability` project) |

## Adapter/fixture normalizations introduced

These are narrow, capability-fixture-owned normalizations. None weaken the shared adapter
contract, add a second measurement/geometry engine, or touch production code.

- **Native-table spacer-column width under `table-layout: auto`.** An empty spacer `<th>`/`<td>`
  cell's CSS `width` (and an explicit `<colgroup><col style="width">` hint) is only a weak input
  to the browser's automatic table layout algorithm and was not reliably honored for a purely
  empty cell in either Chromium or Firefox in this fixture. The fix is the standard technique of
  giving the spacer cell a phantom zero-height content box (`<div style="width:Xpx;height:1px">`)
  so the browser's real min-content-width calculation picks up the required size. This is a
  fixture-local DOM detail, not a new geometry engine, cache, or algorithm; TanStack continues to
  own all range/offset/measurement math untouched. If the real database migration adopts the
  same native-table spacer-column technique, its own implementation should carry the same phantom
  min-content box.
- **Anchor-stability tolerance.** The capability proof asserts anchor stability after an
  above-viewport resize within a bounded pixel tolerance (well under one item's own height) rather
  than pixel-exact, matching `docs/database-virtualization.md`'s own "acceptable anchor stability"
  wording. A same-render-pass re-measurement of multiple already-mounted neighboring items (an
  inherent consequence of Vue's whole-render-function reactivity plus TanStack's own
  `shouldAdjustScrollPositionOnItemSizeChange` heuristic) can leave a small residual correction;
  this was observed empirically and is not a defect in the adapter's forwarding of TanStack's
  correction path.
- No narrow generic mounted-element size reader was required for Firefox; Firefox's default
  `<tr>`/`<th>` measurement path worked once the two normalizations above were in place. TanStack
  remains the sole owner of ResizeObserver-backed observation, the measured-size cache, ranges,
  offsets, and scroll correction, as required.

## Verdict

- Shared adapter capability: **pass** in Chromium and Firefox.
- Native-table capability: **pass** in Chromium and Firefox, including the confirmed Firefox
  dynamic table-row-measurement risk area.
- No path required a second Mioframe virtualization/measurement engine or geometry cache.
- Native-table-first rendering is **accepted**; no fallback DOM architecture is required.
- Unresolved blockers: **none**.

Production database migration may proceed to its own dedicated implementation preflight against
this proven adapter/DOM path, per `docs/database-virtualization-browser-proof.md`'s exit
criterion. Production `DatabaseDataTable` rendering remains unchanged by this task.
