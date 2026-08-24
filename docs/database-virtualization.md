# Database virtualization

Status: **shared virtualization architecture accepted; PR #217 implementation is complete pending operator visual acceptance and exact-head CI**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

Current contracts:

- completed integration correction: `docs/database-virtualization-integration-correction-handoff.md`;
- completed implementation preflight: `docs/database-virtualization-integration-correction-preflight.md`;
- active review: `src/entities/databaseData/REVIEW.md`;
- deferred residual performance work: `docs/database-chrome-jank-follow-up.md`.

## PR #217 accepted architecture

- `@tanstack/vue-virtual` is the sole virtual-item range/measurement/cache engine.
- `useVirtualCollection` is the shared one-axis virtualization boundary.
- Database uses independent row/property virtual collections and native `<table>` rendering.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- Existing inline-edit, relation-root, accessibility, dynamic-sizing, sticky-surface, and value ownership remains unchanged.
- Structural boundedness and deep correctness are accepted, including 30,000 × 300 without materializing 9,000,000 logical intersections.

## Database table integration

`entities/databaseData` owns virtual spacer representation. `shared/ui/Table` remains generic.

Boundary invariant:

> Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

Implemented in `DatabaseDataTable` using only `rows.leadingSize`, `rows.trailingSize`, `columns.leadingSize`, and `columns.trailingSize`:

- zero-distance spacer `<col>`, `<th>`, `<td>`, and `<tr>` elements are omitted;
- `physicalColumnCount` counts only rendered spacer columns;
- non-zero spacers remain presentation-only geometry;
- no Database-specific border/radius system and no shared `MDTable` change was added.

Application E2E protects logical start, interior range, and logical end for top-level and relation/no-action paths while retaining boundedness, deep scrolling, ARIA, dynamic sizing, sticky, relation, and editing proof.

The final visible border/corner result still requires operator inspection on the real application table. If appearance remains wrong, revisit this integration decision before adding another styling system.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank is intentionally **deferred to a separate PR** and is not a #217 merge blocker.

Retained evidence and the next String-vs-Number/data-density discriminator are recorded in `docs/database-chrome-jank-follow-up.md`.

Do not add Number-specific, geometry, worker/query/storage, Material, or shared-virtualization performance changes to #217.

## Merge criteria

PR #217 may merge when:

1. operator inspection confirms the Database table border/corner appearance is restored at representative start/end states;
2. exact-head GitHub CI is green.

Residual Chromium heterogeneous-table jank remains an explicitly accepted tracked follow-up risk, not resolved behavior.

## Forbidden before merge

- shared `MDTable` changes without a newly established shared defect;
- Database-specific duplicate border/radius framework;
- geometry/TanStack/`useVirtualCollection` changes;
- Number/value/query or worker/query/storage performance optimization;
- new verifier/benchmark/visual infrastructure solely for this correction;
- timeout inflation, sleeps, force, retry-as-success, or unrelated cleanup.
