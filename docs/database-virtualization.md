# Database virtualization

Status: **shared virtualization architecture accepted; PR #217 is blocked by a confirmed shared `MDTable` outer-frame defect**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

Current contracts:

- completed native-table integration correction: `docs/database-virtualization-integration-correction-handoff.md`;
- completed relation cold-bootstrap correction: `docs/database-virtualization-relation-bootstrap-correction-handoff.md`;
- completed branch-E2E correction: `docs/database-virtualization-branch-e2e-correction-handoff.md`;
- active shared frame correction: `docs/md-table-frame-correction-handoff.md`;
- active shared frame preflight: `docs/md-table-frame-correction-preflight.md`;
- active Database review: `src/entities/databaseData/REVIEW.md`;
- active shared table review: `src/shared/ui/Table/REVIEW.md`;
- deferred residual performance work: `docs/database-chrome-jank-follow-up.md`.

## PR #217 accepted virtualization architecture

- `@tanstack/vue-virtual` is the sole virtual-item range/measurement/cache engine.
- `useVirtualCollection` is the shared one-axis virtualization boundary.
- Database uses independent row/property virtual collections and native `<table>` rendering.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- Existing inline-edit, relation-root, accessibility, dynamic-sizing, sticky-surface, and value ownership remains unchanged.
- Structural boundedness and deep correctness remain required, including 30,000 × 300 without materializing 9,000,000 logical intersections.

## Database table integration

`entities/databaseData` owns virtualization presentation and root-to-table-surface geometry. `shared/ui/Table` owns the generic table frame and cell presentation.

Settled boundary invariant:

> Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

Cold-bootstrap invariant:

> A non-empty logical collection with no mounted virtual items may render only transient `aria-hidden` bootstrap table structure. That structure disappears as soon as TanStack supplies real virtual items and never becomes a second range/measurement owner.

Current Database implementation preserves both contracts. Persisted relation-filter cold reload, moving-surface deep scrolling, logical-interior spacer proof, bounded work, and the other virtualization E2E contracts passed the final local branch gate and exact-head CI on `aad0ecee9204aa8b87f6df6a6ad0df846aab0189`.

## Active shared presentation correction

Operator inspection on that green code head still shows incorrect outer corner rounding.

The remaining defect is owned by `src/shared/ui/Table/MDTable.vue`, not Database virtualization:

- the table root declares an outer border and then disables it with `border: 0`;
- `tbody`/`tfoot` row `::after` pseudo-elements recreate side borders per row;
- first/last section, row, pseudo-element, and corner-cell selectors independently own parts of the same rounded frame;
- `tbody:last-child tr::after` / equivalent selectors apply bottom radii to every row pseudo-element in the final section rather than representing one coherent outer boundary;
- the top-corner rules depend on `thead`/another section being the table's first DOM child, while the valid Database native structure now has `<colgroup>` before `<thead>`, so `thead:first-child` cannot match.

This is the concrete shared defect required to authorize a shared `MDTable` correction in PR #217.

Accepted correction architecture is defined in `docs/md-table-frame-correction-handoff.md`:

- keep one native `<table>` root and unchanged slot-only API;
- the table root is the sole outer-border owner;
- remove the per-row `tr::after`/pseudo-element perimeter system and CSS that exists only to support it;
- internal row dividers remain cell-owned;
- corner cells may only shape their backgrounds to the root radius; they do not become another perimeter owner;
- selectors must follow actual table rows/cells and must work with `<colgroup>` before `<thead>`;
- no Database classes, virtualizer state, or product-specific styling enters `MDTable`;
- preserve sticky header/action behavior and native table semantics;
- do not add a wrapper solely for frame clipping or scrolling.

The simpler root-border model is selected over a cell-perimeter model because it gives the outer frame one owner and requires fewer independent border rules. If browser proof shows that a root-owned frame cannot preserve the current sticky/native-table contract without a second perimeter mechanism, stop for architecture rather than introducing one implicitly.

## Verification workflow

During implementation use focused verifier runs for fast feedback. Before coding handoff, the cumulative PR branch gate is mandatory:

`pnpm verify --base origin/develop`

If it exposes another PR-caused in-contract failure, fix it, verify that correction narrowly, then rerun the complete branch gate. Repeat until clean. Do not force the local `github-actions` profile; the local verifier profile is the intended agent environment.

For the shared table correction:

- add/use the smallest truthful isolated `MDTable` Storybook fixture for a native `<colgroup> + <thead> + <tbody>` table;
- do not create owner-local `MDTable.visual.spec.ts` because that owner is not yet authorized for colocated visual ownership;
- run verifier-managed Storybook/shared visual fallback applicable to the changed files;
- keep `tests/e2e/databaseVirtualizationFlows.spec.ts` green;
- operator must recheck the real Database table at representative logical start/end and deep horizontal/vertical states.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank is intentionally **deferred to a separate PR** and is not a #217 merge blocker.

Retained evidence and the next String-vs-Number/data-density discriminator are recorded in `docs/database-chrome-jank-follow-up.md`.

Do not add Number-specific, worker/query/storage, Material, or speculative shared-virtualization performance changes to #217.

## Merge criteria

PR #217 may merge when:

1. the shared `MDTable` frame defect is corrected without Database-specific styling or virtualization changes;
2. operator inspection confirms the Database table border/corner appearance at representative start/end/deep states;
3. coding-agent `pnpm verify --base origin/develop` passes cleanly after the correction;
4. exact-head GitHub CI is green on the final head;
5. final resulting PR review finds no remaining blocker.

Residual Chromium heterogeneous-table jank remains an explicitly accepted tracked follow-up risk.

## Forbidden before merge

- Database-specific duplicate border/radius framework;
- `tr::before`/`tr::after` perimeter reconstruction;
- a second outer-frame mechanism alongside the table-root border;
- new wrapper solely for border clipping/scroll ownership;
- shared `useVirtualCollection`/TanStack changes;
- second geometry/range/measurement state;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign beyond `MDTable` frame ownership;
- timeout inflation, sleeps, force, retry-as-success, remount recovery, or unrelated cleanup.
