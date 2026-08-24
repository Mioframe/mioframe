# MDTable outer-frame correction handoff

Status: ready for implementation.

## Goal

Restore a simple, reliable rounded outer frame for `MDTable` and unblock PR #217 operator visual acceptance without adding Database-specific border/radius styling.

The correction must preserve normal native-table semantics, sticky header/action consumers, and Database virtualization structure.

## Confirmed defect

The shared owner is `src/shared/ui/Table/MDTable.vue`.

Current `MDTable` has several competing mechanisms for one outer frame:

- the table root declares `border: var(--md-table-border)` and later overrides it with `border: 0`;
- `tbody`/`tfoot` row side borders are recreated on every `tr::after` pseudo-element;
- bottom radii are assigned across the last section, every row pseudo-element in that section, the last row, and first/last cells;
- top radii depend on the visual table section also being the table element's first DOM child.

PR #217 adds a valid native `<colgroup>` before `<thead>`. Therefore `thead:first-child` is false even when the header is the first visual row. The existing top-corner selector cannot represent that native table structure.

Operator inspection confirms that the real Database table still renders incorrect rounded corners after Database spacer corrections. Database-specific CSS does not own the outer frame or corner radii.

## Ownership

Primary production owner:

- `src/shared/ui/Table/MDTable.vue`

Consumer proof owner:

- `tests/e2e/databaseVirtualizationFlows.spec.ts`

Manual isolated inspection owner:

- a colocated `src/shared/ui/Table/MDTable.stories.ts` story if no truthful existing story already covers the required structure.

Active finding:

- `src/shared/ui/Table/REVIEW.md`

Do not move border/radius responsibility into `DatabaseDataTable`, widget/page CSS, or virtualization.

## Architecture decision

`MDTable` keeps one native `<table>` root and its public slot-only API remains unchanged.

The table root is the sole owner of the outer border. Internal row dividers remain cell-owned.

Remove the row pseudo-element frame system entirely. `tr::before`/`tr::after` must not be used to recreate table side borders or corners.

Corner-cell radius styling may remain only to shape cell backgrounds to the root's rounded outline. It is not a second outer-border owner.

The final selector model must follow native table structure rather than incidental child position:

- a `<colgroup>` before `<thead>` must not prevent top corners from rendering;
- the real first header row/corner cells receive top background radii when a header exists;
- the final real row of the final rendered table section receives bottom background radii and does not render an extra internal bottom divider over the root border;
- ordinary interior rows keep only their internal divider;
- no rule may depend on Database spacer class names.

Keep `border-collapse: separate` and zero border spacing unless browser proof establishes they are incompatible with the required native frame. Do not introduce a wrapper merely to own clipping or borders.

## Simplest viable design

Use the root `<table>` border and radius as the one outer frame, with cell `border-bottom` as the internal row-divider mechanism and only the minimum corner-cell/background-radius selectors required for first/last visible table rows.

This is preferred over a cell-perimeter or pseudo-element frame because the root already owns the table box and requires fewer independent border owners.

If browser proof shows the root border cannot satisfy sticky/native-table behavior without a second perimeter system, stop and report the evidence. Do not silently introduce another frame mechanism.

## Required preserved behavior

- native `<table>`, `<colgroup>`, `<thead>`, `<tbody>`, and optional `<tfoot>` semantics;
- sticky `thead` behavior;
- Database sticky action column behavior;
- Database leading/trailing row and column spacers;
- Database transient bootstrap structure;
- zero-distance settled spacer omission;
- bounded mounted virtualization work;
- existing color/token ownership;
- existing padding, typography, header/background colors, and row separators except where the old outer-frame emulation itself must be removed.

## Proof strategy

### Isolated shared UI

If `MDTable` has no suitable story, add one colocated story under `src/shared/ui/Table/MDTable.stories.ts` using only native deterministic markup.

The representative fixture must include:

- `<colgroup>` before `<thead>`;
- multiple header cells;
- multiple body rows and columns;
- enough visible background contrast to inspect all four outer corners and row separators.

Do not import product stores, workers, routing, persistence, Database components, or product bootstrap into the story.

`MDTable` is not an owner currently authorized for colocated visual Playwright proof. Do not create `src/shared/ui/Table/*.visual.spec.ts` or migrate visual-test infrastructure in this correction. The Storybook story is the manual isolated workbench; existing verifier visual fallback and the real Database operator inspection remain the executable visual gates.

### Product consumer

Keep `tests/e2e/databaseVirtualizationFlows.spec.ts` green. Do not add screenshot assertions to application behavior E2E.

The operator will re-inspect the real Database table after implementation.

## Non-goals

- Database virtualization geometry or range changes;
- `useVirtualCollection` or TanStack changes;
- Database spacer/bootstrapping redesign;
- sticky action redesign;
- Material library migration;
- generic table API expansion;
- wrapper/scroll-container redesign;
- deferred heterogeneous Chromium performance work;
- broad Storybook/visual ownership migration.

## Acceptance criteria

- `MDTable` has exactly one outer-border owner: the table root.
- no row pseudo-element draws outer side borders or corners;
- no root border declaration is later cancelled by `border: 0`;
- `<colgroup> + <thead>` renders correct top-left/top-right corner structure;
- final row renders correct bottom-left/bottom-right corner structure;
- internal row dividers remain visually/structurally distinct from the root border;
- Database requires no border/radius override;
- sticky header/action behavior remains correct;
- Database virtualization E2E remains green;
- final `pnpm verify --base origin/develop` passes cleanly;
- operator inspection of the real Database table shows correct rounded corners.

## Forbidden

- Database-specific selectors inside `MDTable`;
- border/radius rules added to `DatabaseDataTable` to compensate for shared styling;
- `tr::before`/`tr::after` perimeter reconstruction;
- a second outer-frame mechanism alongside the root border;
- a wrapper added only to carry border/radius/overflow;
- `!important`;
- exact pixel-position assumptions in product E2E;
- screenshot assertions in application behavior E2E;
- colocated `MDTable.visual.spec.ts` before migration authorization;
- verifier/Storybook infrastructure changes;
- virtualization/shared-range changes;
- unrelated cleanup.
