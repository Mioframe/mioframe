# Database virtualization dynamic surface-offset correction preflight

Authoring source: `docs/database-virtualization-dynamic-surface-offset-correction-handoff.md`.

## Goal

Replace entity-owned ancestor/sibling surface discovery with explicit widget-owned root-to-surface geometry, while preserving the existing shared `surfaceOffset` API and TanStack ownership.

## Non-goals

No MDTable work, no range/cache abstraction, no scroll-time geometry polling, no deferred Chromium value-performance work.

## Confirmed current behavior

- Exact-head CI `2889a1d...` fails the moving-surface scenario 3/3 on desktop Chromium.
- Current `DatabaseDataTable` owns `useElementBounding(scrollRoot/table)`, root `MutationObserver`, and `onUpdated()` geometry refresh.
- TanStack core already recomputes measurement starts when `scrollMargin` changes; Vue adapter reactively forwards option changes.

## Owners / entry points

- `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`: top-level root/composition owner and dynamic offset producer.
- `src/widgets/DocumentView/Database/DatabaseRelationValueInline.vue`: nested root owner; supplies its truthful local offset.
- `src/widgets/DocumentView/Database/DatabaseViewLayout.vue`: forwarding boundary.
- `src/entities/databaseData/DatabaseDataTable.vue`: explicit offset consumer.
- `src/shared/ui/virtualization/useVirtualCollection.ts`: unchanged unless the new shared capability proof fails.

## Minimum implementation design

Preferred design:

- top-level widget maintains current `{ vertical, horizontal }` root-to-layout surface values from its own root and rendered Database layout;
- refresh from the widget's post-render lifecycle when its preceding composition changes, plus normal bounding/resize observation needed for viewport/layout changes;
- do not measure on every root scroll;
- nested relation root supplies zero on both axes while its layout remains the root's first unpadded content;
- pass offsets through `DatabaseViewLayout` into `DatabaseDataTable`;
- delete entity ancestor `useElementBounding` / `MutationObserver` / `onUpdated` surface discovery.

Simpler rejected alternative: another timing callback in `DatabaseDataTable`; it preserves the wrong owner and recurring failure path.

## Expected files

Production:

- `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`
- `src/widgets/DocumentView/Database/DatabaseViewLayout.vue`
- `src/widgets/DocumentView/Database/DatabaseRelationValueInline.vue`
- `src/entities/databaseData/DatabaseDataTable.vue`

Proof:

- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`
- related capability fixture/story only if required to drive a reactive offset change through the existing public API
- `tests/e2e/databaseVirtualizationFlows.spec.ts` only if a narrow assertion/fixture change is required; do not weaken the moving-surface contract

Architect-owned, do not edit:

- `src/entities/databaseData/REVIEW.md`
- `src/shared/ui/virtualization/REVIEW.md`
- `src/shared/ui/Table/REVIEW.md`
- architecture/handoff/preflight docs
- PR metadata

## Pass order

1. Add/extend shared capability proof for same-root dynamic `surfaceOffset` change. Run focused Storybook/browser verification.
2. If that proof fails with the current shared implementation, STOP and report exact evidence; do not proceed with the selected consumer-only production correction.
3. Implement widget-owned offset production and forwarding; remove entity ancestor/sibling observation.
4. Run focused moving-surface Database E2E, then complete virtualization E2E.
5. Rerun relation-filter persistence if Database table production code changed.
6. Run focused type-check/lint/format as selected by verifier.
7. Run `pnpm verify --base origin/develop` until clean, using focused verifier reruns after each discovered PR-caused correction.

## TEST IMPACT

- Contract/scenario: reactive same-root shared `surfaceOffset` change
  - Primary proof owner: `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`
  - Additional proof: Database product E2E
  - Existing proof: static non-zero surface offset only
  - New/updated proof: move the collection surface offset after initial mount and prove top/deep surface-relative geometry
  - Risk/platform matrix: Chromium browser behavior; no performance benchmark claim
  - Durable ownership/impact updates: shared virtualization README/review architect-owned

- Contract/scenario: top-level Database preceding composition removed
  - Primary proof owner: `tests/e2e/databaseVirtualizationFlows.spec.ts`
  - Additional proof: Mobile Chrome existing project selection
  - Existing proof: moving-surface scenario at line ~579
  - New/updated proof: preserve its physical-offset and second deep-range requirements; change only if needed to expose a more truthful observable invariant
  - Risk/platform matrix: desktop Chromium primary, Mobile Chrome regression
  - Durable ownership/impact updates: Database review architect-owned

## Required removal

Remove entity-owned root/table bounding cache, ancestor root MutationObserver, and `onUpdated(updateSurfaceBounds)` if the selected ownership correction is implemented. Do not leave a compatibility path.

## Verification

Focused examples:

`pnpm verify --only storybook-behavior --files src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`

`pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts`

`pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts`

`pnpm verify --only type-check`

Final mandatory gate:

`pnpm verify --base origin/develop`

No `--profile github-actions` for the local handoff gate.
