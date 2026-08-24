# Database virtualization integration correction handoff

Status: **implemented; awaiting operator visual acceptance**.

## Goal

Finish PR #217 by restoring the pre-virtualization Database table boundary appearance without changing the accepted virtualization architecture.

## Implemented design

`DatabaseDataTable` now renders a presentation spacer only when its corresponding virtual distance is greater than zero.

This applies consistently to:

- leading/trailing `<col>` elements;
- leading/trailing header spacer `<th>` elements;
- leading/trailing row spacer `<td>` elements;
- top/bottom row spacer `<tr>` elements.

`physicalColumnCount` counts only rendered spacer columns.

The only source facts remain `rows.leadingSize`, `rows.trailingSize`, `columns.leadingSize`, and `columns.trailingSize`. Non-zero spacers remain presentation-only virtualization geometry. No shared `MDTable`, virtualization API, geometry ownership, worker/query/storage, or performance path changed.

## Proof completed

`tests/e2e/databaseVirtualizationFlows.spec.ts` now proves representative top-level and relation/no-action paths at:

- logical start: zero-distance leading spacers absent;
- interior range: non-zero leading/trailing spacers present;
- logical end: zero-distance trailing spacers absent.

Existing boundedness, deep correctness, relation, sticky, dynamic-sizing, and ARIA product proof remains in the same scenario owner.

Focused implementation feedback passed:

```bash
pnpm verify --only type-check
pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts
```

## Remaining acceptance

Automated structural proof does not establish final pixels. The operator must inspect the real application table and confirm that borders/corner radii are restored in ordinary top/left and representative deep/end states.

If appearance is still wrong, reopen this architecture before adding Database-specific border/radius CSS or changing shared `MDTable`.

Residual heterogeneous Chromium jank is intentionally outside this correction and remains tracked in `docs/database-chrome-jank-follow-up.md`.
