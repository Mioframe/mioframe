# Database virtualization collection API final correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/virtualization-library.md`, `docs/database-virtualization.md`, and `docs/database-virtualization-browser-proof.md`.

## Goal

Close the final capability proof gap: assert bounded **actual mounted logical data-cell DOM**, then synchronize all capability status documents.

Do not change architecture, public API, production database rendering, or already accepted geometry behavior.

## Confirmed current state

Already implemented and accepted:

- minimal shared `useVirtualCollection` API;
- direct consumer-owned DOM with per-instance measurement directive;
- valid in-bounds `undefined` source values;
- public-geometry grow/shrink and stable-key remap proof;
- non-zero `surfaceOffset` and collection-relative extents;
- real `MDTable` row/column dynamic measurement in Chromium and Firefox;
- deep vertical/horizontal geometry;
- column remount minimum after widening content is removed;
- above-viewport anchor correction;
- native accessibility semantics;
- bounded virtual row and column ranges.

Current browser result reports 30/30 passing tests, but the mounted-cell contract is still not faithfully proven because `db-virt-mounted-cells` is a computed `rows.items.length * columns.items.length` output rather than an actual DOM count.

## Files to update

Required implementation/proof:

- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`

Optional cleanup only if useful:

- `src/entities/databaseData/DatabaseVirtualizationCapabilityFixture.vue`

Required documentation:

- `docs/database-virtualization-collection-api-result.md`
- `docs/virtualization-library.md`
- `docs/database-virtualization.md`
- `docs/database-virtualization-profiling.md`
- `docs/database-virtualization-browser-proof.md`

Do not modify shared virtualization implementation unless the actual-DOM proof reveals a real defect. If it does, stop and report evidence rather than broadening scope.

## Actual mounted-cell proof

Use the real logical database-cell DOM selector:

```text
[data-testid^="db-virt-cell-"]
```

Spacer cells do not use this selector and therefore remain excluded.

At the initial range:

1. wait until mounted row and column ranges are non-empty and settled;
2. count actual matching logical `<td>` elements from the browser DOM;
3. read current mounted row and column counts;
4. assert actual logical-cell count equals `mountedRows * mountedColumns`;
5. assert row/column counts remain under their existing generous bounds;
6. assert actual logical-cell count remains under a generous viewport/overscan-derived bound and far below the 1,500,000 logical cross product.

After deep two-dimensional scrolling:

1. move both axes to a deep/end range using the existing deterministic programmatic scroll;
2. wait until row/column ranges settle;
3. count actual logical `<td>` DOM again;
4. assert it equals the settled current row × column intersection count;
5. assert the same bounded-work limits;
6. keep existing deep logical-position assertions owned by their current tests.

### Snapshot consistency

Do not reintroduce torn-snapshot races.

When comparing actual DOM cell count with mounted row/column output state, obtain one browser-side self-consistent snapshot or poll until:

```text
actualCells === mountedRows * mountedColumns
```

Then assert the bounds on that settled snapshot.

Do not use arbitrary sleeps.

## Fixture diagnostic output

`db-virt-mounted-cells` is not valid primary evidence because it is derived from the same row/column range values under test.

Preferred minimum solution: remove the output if no other proof uses it.

If retained for diagnostics, the browser proof must still count actual logical `<td>` DOM independently and must not use the derived output to claim bounded mounted DOM.

## Documentation final state

Only after the corrected actual-DOM proof passes:

### `docs/database-virtualization-collection-api-result.md`

Record the final actual test count and change the bounded-cell row to state that real mounted logical `<td>` DOM was counted directly at initial and deep ranges. Final verdict may be `Ready` only when this passes.

### `docs/virtualization-library.md`

Status must say architecture and implementation/browser proof are accepted/passed. Production database migration remains a separate next stage.

### `docs/database-virtualization.md`

Status/readiness must say native-table capability passed and architecture is ready for production database migration planning/implementation. Do not claim production migration itself is complete.

### `docs/database-virtualization-profiling.md`

Status must say capability passed; product profiling/performance acceptance remains pending production migration.

### `docs/database-virtualization-browser-proof.md`

Status must say capability gate passed only after the actual-DOM correction. Keep the durable evidence rule that mounted data-cell proof means direct DOM count, not a derived range product.

## TEST IMPACT

Primary proof owner:

- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts` in Chromium and the narrow Firefox project.

The same database spec runs in both required engines, so the actual mounted-cell assertion should remain engine-independent.

No new shared browser test, unit test, or product E2E is required for this correction.

## Verification

Run at minimum:

```bash
pnpm verify --only type-check --files \
  src/entities/databaseData/DatabaseVirtualizationCapabilityFixture.vue \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts

pnpm verify --only storybook-behavior --files \
  src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts
```

Run applicable storybook-build/static, format, ESLint/Oxlint checks for touched files.

Run final `pnpm verify` if focused verification does not cover the complete correction diff.

Use actual final verifier output for test counts in the result document.

## Forbidden

- public API changes;
- TanStack private-state assertions;
- derived `rows * columns` output used as primary mounted-DOM proof;
- independent observers/caches/registries/range algorithms;
- production database migration;
- worker/query/paging/index changes;
- sleeps, force, broad retries, recovery loops, or timeout inflation.

## Stop condition

If actual DOM contains retained/duplicated logical data cells outside the current row × column intersection, record `not ready` and return the browser evidence for architecture review. Do not hide the discrepancy by changing the expected count.
