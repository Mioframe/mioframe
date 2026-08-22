# Database virtualization direct-integration preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-direct-integration-handoff.md`, `docs/database-virtualization.md`, and `docs/database-virtualization-browser-proof.md`.

## Goal

Replace the over-generalized shared virtualization capability implementation with one direct database-owned TanStack/native-table capability gate. Do not migrate production database rendering yet.

## Confirmed current state

- `@tanstack/vue-virtual` is already installed on the selected `3.13.x` line (`^3.13.36` currently in `package.json`).
- `src/shared/ui/virtualization` currently contains a Mioframe adapter, unit tests, generic list/grid fixtures, stories, and browser proof. This entire layer is now architecturally superseded.
- `DatabaseVirtualizationCapabilityFixture.vue` currently consumes the shared adapter and uses simplified copied table styling instead of actual `MDTable` geometry.
- the current native-table browser spec does not prove a true deep horizontal target/offset;
- the current row dynamic proof covers growth but not shrink;
- production `DatabaseDataTable.vue` is still unchanged and remains out of scope.

## Required removal

Delete the complete current shared virtualization implementation/proof:

- `src/shared/ui/virtualization/useVirtualAxis.ts`
- `src/shared/ui/virtualization/index.ts`
- `src/shared/ui/virtualization/useVirtualAxis.test.ts`
- `src/shared/ui/virtualization/VirtualAxisListFixture.vue`
- `src/shared/ui/virtualization/VirtualAxisGridFixture.vue`
- `src/shared/ui/virtualization/VirtualizationCapability.stories.ts`
- `src/shared/ui/virtualization/VirtualizationCapability.browser.spec.ts`

Do not replace them with another generic wrapper or helper.

## Files to update

- `src/entities/databaseData/DatabaseVirtualizationCapabilityFixture.vue`
- `src/entities/databaseData/DatabaseVirtualizationCapability.stories.ts`
- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`
- `playwright.storybook.config.ts`
- `docs/database-virtualization-direct-integration-result.md` (new result artifact)

Keep `package.json` / `pnpm-lock.yaml` unchanged unless dependency consistency actually requires an update. `@tanstack/virtual-core` remains transitive only.

Do not change:

- `DatabaseDataTable.vue`;
- `DatabaseViewLayout.vue`;
- `DatabaseViewWidget.vue`;
- `EditableInlineValue.vue`;
- relation production components;
- service/worker code;
- `MDTable.vue` or Material components.

## Direct fixture implementation

`DatabaseVirtualizationCapabilityFixture.vue` must import `useVirtualizer` directly from `@tanstack/vue-virtual`.

Use exactly two virtualizers:

### Row virtualizer

- count from synthetic row list;
- stable synthetic row key through `getItemKey`;
- shared fixture scroll element;
- dynamic estimate;
- `measureElement` attached directly to mounted `<tr>` with the TanStack-required `data-index`;
- modest fixed overscan for deterministic structural assertions.

### Column virtualizer

- count from synthetic property list;
- stable synthetic property key through `getItemKey`;
- same fixture scroll element;
- `horizontal: true`;
- dynamic estimate;
- `measureElement` attached directly to mounted `<th>` with `data-index`;
- same visible property range used by header and every mounted row.

Do not wrap either virtualizer in a local generic axis API. Small named computed values for row/column spacers are expected and are not an abstraction.

## Native table fixture

Use actual `MDTable` as the table owner. This is required to exercise the current production-relevant native table geometry, including `border-collapse: separate`, spacing/borders, sticky header behavior, and row decoration.

Fixture defaults:

- at least 5,000 logical rows;
- at least 300 logical properties;
- viewport small enough that only a bounded subset mounts;
- synthetic text/body data only.

Use:

- top/bottom spacer rows derived from TanStack virtual geometry;
- left/right spacer columns derived from TanStack virtual geometry;
- the already discovered phantom min-content box for empty horizontal spacer cells if it remains necessary with real `MDTable`;
- presentation spacers hidden from accessibility semantics.

Do not add per-cell measurement state.

## Dynamic sizing policy

### Rows

Provide deterministic controls that let one mounted row:

1. grow substantially;
2. shrink back;
3. be remeasured both times.

Browser proof must observe real consumed row height and resulting geometry, not internal cache fields.

### Columns

Provide deterministic body-content growth for a selected visible property. Header text itself must remain unchanged so the proof demonstrates native body -> column -> `<th>` width propagation.

After the grown property scrolls out of the virtual range and returns, its width must remain at least its previously discovered width (within a small browser geometry tolerance) by using current TanStack `virtualColumn.size` as the remount minimum.

Do **not** implement live shrink/reset of a discovered column width. That behavior is explicitly deferred/not required.

## Deep 2D proof

The browser spec must separately prove both axes.

### Deep vertical

Programmatically scroll near the vertical maximum, then assert:

- mounted rows remain bounded;
- a logical row near the end is present using its logical `aria-rowindex`/test identity;
- top spacer height is materially large;
- no early-row cross product remains mounted.

### Deep horizontal

Programmatically scroll near the horizontal maximum, then assert:

- mounted columns/cells remain bounded;
- a logical property near the end (for example >= 290 in a 300-column fixture) is present in header and body;
- its `aria-colindex` matches full logical position;
- left spacer width is materially large;
- early columns are no longer mounted;
- header and body visible property ranges agree.

Do not treat merely unmounting column 0/3 as deep horizontal proof.

## Accessibility

On initial and deep-scrolled ranges prove:

- native table/row/columnheader/cell roles exist;
- `aria-rowcount` describes header + all logical rows;
- `aria-colcount` describes all logical properties for this fixture;
- visible logical `aria-rowindex`/`aria-colindex` values match full positions;
- spacer rows/cells are excluded from logical accessibility semantics.

No ARIA grid conversion.

## Firefox project

Update `playwright.storybook.config.ts` so `firefox-virtualization-capability` matches only:

`src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`

Remove the deleted shared capability spec from all project matching/constants/comments. Chromium ordinary Storybook behavior discovery remains unchanged.

## TEST IMPACT

- Direct TanStack/native-table geometry: primary owner `DatabaseVirtualizationCapability.browser.spec.ts`; Chromium + Firefox.
- Structural scalability: same spec; assert bounded observable mounted rows/columns/cells at >= 5,000 × 300 logical scale.
- Dynamic row sizing: same spec; grow + shrink.
- Dynamic column sizing: same spec; body-driven growth + unmount/remount stability; no live shrink contract.
- Deep geometry: same spec; explicit independent vertical and horizontal target/offset assertions.
- Accessibility: same spec; initial + deep logical indices and spacer exclusion.
- Generic adapter API/validation/lifecycle proof: removed because no Mioframe generic adapter remains.
- Visual/release/persistence/data safety: not applicable to this correction task.

## Result artifact

Create `docs/database-virtualization-direct-integration-result.md` recording:

- resolved TanStack, Playwright, Chromium, Firefox versions;
- exact test command/project outcome from the final run;
- pass/fail matrix for every contract above;
- whether phantom spacer normalization is still required;
- whether real `MDTable` geometry works in Firefox;
- final `ready` or `not ready` verdict.

Do not copy the old shared-adapter result or claim test counts that do not match actual Playwright output.

## Verification

Use verifier-managed checks:

```bash
pnpm verify --only type-check --files \
  src/entities/databaseData/DatabaseVirtualizationCapabilityFixture.vue \
  src/entities/databaseData/DatabaseVirtualizationCapability.stories.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts \
  playwright.storybook.config.ts

pnpm verify --only storybook-behavior --files \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts

pnpm verify --only storybook-build --files \
  src/entities/databaseData/DatabaseVirtualizationCapability.stories.ts \
  playwright.storybook.config.ts
```

Also run applicable format/lint checks and final `pnpm verify` if focused planning does not cover the complete correction diff.

No `unit-tests` virtualization lane remains after deleting the wrapper.

## Stop conditions

Stop and record `not ready` without implementing another architecture if:

- real `MDTable` dynamic `<tr>` geometry cannot be made correct in Firefox without fixed heights or a second measurement engine;
- deep horizontal spacer geometry remains wrong in either required engine;
- row shrink cannot update vertical geometry without custom offset/cache logic;
- partial native-table accessibility cannot represent deep logical positions;
- direct implementation starts growing a reusable wrapper, registry, or custom virtualizer.

Return failing evidence for architecture review.
