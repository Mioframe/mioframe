# Review

Verdict: implementation accepted; operator reinspection remains pending for the PR #217 Database consumer.

## Scope reviewed

- `MDTable.vue` native-table border, radius, sticky-header and cell-divider correction at `2889a1d6598850a4a8886d6d1a7d95a40f8cd1da`.
- New isolated `MDTable.stories.ts` fixture with `<colgroup> + <thead> + <tbody>`.
- Database virtualization consumer blast radius.
- Exact-head CI lanes for the correction.

## Resolved — competing outer-frame ownership

The previous shared defect is removed:

- the native `<table>` root owns one active outer border and radius;
- the root border is no longer cancelled by `border: 0`;
- all per-row `tr::after` perimeter reconstruction is removed;
- top-corner shaping targets the actual first header row and no longer depends on `thead:first-child`, so `<colgroup>` before `<thead>` is valid;
- bottom shaping targets only the final row of the final `tbody`/`tfoot`;
- internal dividers remain cell-owned;
- sticky header offset is derived from the same table border width, not a separate frame mechanism.

No Database-specific selectors, wrapper, public API expansion, or second perimeter model were introduced.

## Verification evidence

Coding-agent focused verification reported:

- Database virtualization E2E: 18/18 across Chromium and Mobile Chrome, no retries;
- shared visual fallback: 87/87, no baseline changes;
- Storybook build, format, ESLint and type-check: passed;
- `pnpm verify --base origin/develop`: passed.

Exact-head CI on `2889a1d...`:

- static: passed;
- visual: passed;
- Storybook behavior: passed;
- application E2E: failed only in the repeated Database moving-surface virtualization scenario.

That CI failure is owned by Database/root-to-surface geometry, not the shared Table frame.

## Remaining acceptance

Operator must reinspect the real Database table after the complete PR correction, including representative top/bottom/right/deep states and sticky surfaces. A concrete remaining frame defect reopens this review; absence of exact-head CI green by itself does not reopen Table ownership.

## Blockers

None in the current `MDTable` implementation.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Database virtualization geometry correction;
- shared virtualization changes;
- broader shared-UI visual-test migration.
