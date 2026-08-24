# MDTable outer-frame correction preflight

Authoring source: `docs/md-table-frame-correction-handoff.md`.

Status: ready for implementation.

## Goal / non-goals

Replace the current overlapping `MDTable` outer-frame CSS with one native-table frame owner while preserving existing table semantics, sticky consumers, and Database virtualization behavior.

Do not change Database virtualization, shared virtualizer APIs, product state, persistence/query behavior, Material infrastructure, or Storybook/visual runner architecture.

## Confirmed implementation facts

Current `src/shared/ui/Table/MDTable.vue`:

- is a single native `<table class="md-table">` root with slot content;
- declares `border: var(--md-table-border)` and then overrides it with `border: 0`;
- uses `border-collapse: separate` and `border-spacing: 0`;
- gives cells `border-bottom: var(--md-table-border)`;
- draws side borders for every `tbody`/`tfoot` row through absolutely positioned `tr::after`;
- distributes bottom radii over section, row pseudo-element, row, and corner cells;
- derives top radii through `thead/tbody/tfoot &:first-child`.

Current `DatabaseDataTable` validly renders `<colgroup>` before `<thead>`, so the header section is not the table's first DOM child. This makes the current top-corner structural assumption invalid.

Database-specific CSS does not draw the outer frame/radius.

## Public contract

No public API change.

Keep:

```vue
<MDTable>
  <slot />
</MDTable>
```

No new props, emits, wrapper, slots, or CSS API are required.

## Ownership

Production:

- `src/shared/ui/Table/MDTable.vue`

Optional isolated workbench fixture:

- `src/shared/ui/Table/MDTable.stories.ts`

Product proof:

- `tests/e2e/databaseVirtualizationFlows.spec.ts`

Review state is architect-owned:

- `src/shared/ui/Table/REVIEW.md`
- `src/entities/databaseData/REVIEW.md`

Do not edit review or architecture/handoff/preflight documents.

## Minimum implementation design

1. Make the `<table>` root the only owner of the outer border and outer radius.
2. Delete `tbody/tfoot tr::after` border reconstruction and CSS that exists only to support it.
3. Keep internal horizontal row separation on cells.
4. Remove the internal bottom divider from the actual final row so it does not duplicate the root bottom border.
5. Keep only the smallest cell-radius rules needed to shape corner-cell backgrounds to the root outline.
6. Top-corner selectors must target the actual header row/cells directly and must work when `<colgroup>` precedes `<thead>`.
7. Bottom-corner selectors must target the actual final rendered row of the final table section without styling every row in that section.
8. Preserve sticky header and sticky action-cell behavior.

Do not introduce a cell-perimeter system for left/right outer borders unless browser evidence proves the root border cannot satisfy the accepted contract. If that happens, stop for architecture instead of creating a second frame path.

## Expected files

Required:

- `src/shared/ui/Table/MDTable.vue`

Likely, if no truthful isolated fixture already exists:

- `src/shared/ui/Table/MDTable.stories.ts`

Proof changes only if needed:

- `tests/e2e/databaseVirtualizationFlows.spec.ts` only for behavior-preserving assertions required by a real changed contract; do not add visual assertions or rewrite virtualization proof merely because shared CSS changed.

No other production file is expected.

## Storybook fixture

If added, use a simple deterministic story, for example `Shared/Table/MDTable`, containing native markup with:

- `<colgroup>`;
- `<thead>` with multiple `<th>` cells;
- `<tbody>` with at least three rows and multiple `<td>` cells.

The story exists for isolated manual visual inspection and Storybook build validity. It does not become product behavior proof.

Do not add an owner-local `*.visual.spec.ts`; current migration rules do not authorize `MDTable` for colocated visual ownership.

## TEST IMPACT

### Shared presentation contract

Contract:

- one coherent rounded outer table frame with normal cell dividers;
- `<colgroup>` does not break top-corner rendering;
- final row owns no duplicate bottom divider;
- sticky table content remains compatible with the frame.

Proof:

- isolated Storybook workbench fixture/manual inspection;
- verifier-selected shared UI/Storybook/visual fallback applicable to changed files;
- operator inspection of the real Database table.

### Database consumer contract

Contract:

- virtualization structure, logical boundaries, sticky action cell, deep scrolling, and bounded work remain unchanged.

Primary proof:

- `tests/e2e/databaseVirtualizationFlows.spec.ts`.

Do not add screenshot assertions to that application E2E.

## Implementation sequence

1. Inspect `MDTable.vue` and confirm every current selector that participates in outer frame/radius drawing.
2. Remove the pseudo-element perimeter and obsolete dependent declarations.
3. Implement the one-root-frame CSS with minimum corner/background rules.
4. Add the isolated story if missing.
5. Run focused format/lint/type-check as applicable.
6. Run focused Storybook build/visual fallback selected by the verifier for the shared UI/story change as applicable.
7. Run focused Database virtualization E2E.
8. If any focused failure is caused by the correction, fix it within `src/shared/ui/Table` if the shared contract owns it. Do not compensate in Database CSS.
9. Run the cumulative branch gate:

   `pnpm verify --base origin/develop`

10. For any PR-caused in-contract failure found by the branch gate, fix it, use focused verification for fast feedback, then rerun the complete branch gate until clean.

If a failure requires changing Database virtualization, shared virtualizer APIs, adding another perimeter mechanism, or changing Storybook/verifier infrastructure, stop and report evidence.

## Verification examples

Use verifier-managed commands only, for example:

- `pnpm verify --only format --files src/shared/ui/Table/MDTable.vue src/shared/ui/Table/MDTable.stories.ts`
- `pnpm verify --only eslint --files src/shared/ui/Table/MDTable.vue src/shared/ui/Table/MDTable.stories.ts`
- `pnpm verify --only type-check`
- `pnpm verify --only storybook-build --files src/shared/ui/Table/MDTable.vue src/shared/ui/Table/MDTable.stories.ts`
- `pnpm verify --only visual --files src/shared/ui/Table/MDTable.vue src/shared/ui/Table/MDTable.stories.ts`
- `pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts`
- `pnpm verify --base origin/develop`

Use only commands actually supported/selected by the verifier. Do not invoke Playwright, Storybook/Vite, or browsers directly.

## Acceptance criteria

- root table border is active and is the only outer-border owner;
- no `tr::after`/`tr::before` frame CSS remains;
- no duplicate/conflicting outer-border declaration remains;
- top corners work with `<colgroup>` before `<thead>`;
- bottom corners belong only to the final row/corner cells;
- internal row dividers remain correct;
- existing sticky behavior remains intact;
- no Database-specific frame override is introduced;
- focused Database virtualization E2E passes;
- final `pnpm verify --base origin/develop` passes cleanly;
- operator can visually confirm correct real Database corners after handoff.

## Forbidden

- changing `DatabaseDataTable.vue` solely for border/radius compensation;
- Database class selectors inside `MDTable`;
- `tr::before`/`tr::after` perimeter drawing;
- a wrapper for border/radius ownership;
- multiple outer-frame mechanisms;
- `!important`;
- public `MDTable` API expansion;
- shared virtualization/TanStack changes;
- screenshot assertions in application E2E;
- owner-local `MDTable.visual.spec.ts` before migration authorization;
- direct Playwright/Vite/browser commands;
- `--profile github-actions` on the local branch gate;
- `pnpm verify --full` as the PR handoff gate;
- retries/sleeps/timeout inflation;
- unrelated cleanup;
- editing architect-owned review/docs/PR metadata.
