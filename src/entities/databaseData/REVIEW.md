# Review

Verdict: implementation/proof corrections accepted; remaining gates are operator visual reinspection, exact-head CI, and final resulting-PR review.

## Scope reviewed

- PR #217 Database virtualization/native-table integration.
- Shared deep-state `surfaceOffset` capability.
- Top-level `DatabaseViewWidget` numeric offset diagnosis.
- Relation-value local-root loading correction.
- Sticky action/header stacking correction and real-browser hit-testing proof.
- Cumulative branch verification reported by the coding agent.

## Resolved — shared deep-state contract

The shared browser capability proves `deep -> change surfaceOffset while deep -> top -> deep` on the same root/list, reaching the logical tail before and after with bounded mounted work and consistent geometry. Shared production remains unchanged.

No shared/TanStack production correction is justified.

## Resolved — top-level moving-surface production ownership not confirmed

The coding-agent diagnosis did not reproduce the historical product failure and reported truthful supplied-vs-physical offsets at every required checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both first and second deep phases reached logical row `46`. Temporary diagnostics were removed.

Together with the accepted shared deep-state capability, there is no current evidence supporting another production geometry/cache/lifecycle correction. Do not add timers, observers, cache reset, remount, or shared virtualization changes for the historical CI episode.

The historical failure remains a stability watch only: any new exact-head reproduction reopens this finding and must be reviewed from that concrete evidence.

## Resolved — relation-value local-root invariant

`RelationValueFieldData` now renders the loading progress indicator and `DatabaseDataTable` mutually exclusively. Explicit relation `0/0` offsets are truthful whenever the table is mounted. Owner-local proof and relevant E2E are reported green.

Owner review: `src/features/relationValueEdit/REVIEW.md`.

## Resolved — sticky body action cells covering the header

`DatabaseDataTable` now keeps body action cells sticky/right at local `z-index: 0`, below the shared sticky `thead` plane (`z-index: 1`). The header action cell remains locally elevated inside the header plane.

The product E2E extends the existing sticky native-table scenario with actual `document.elementFromPoint()` hit-testing after combined vertical + horizontal scrolling and proves:

- the body right-edge surface is the sticky action cell, not an ordinary value cell;
- the top-right header/action intersection belongs to the header action cell and not a body action cell;
- an ordinary header band remains above body action cells.

No shared `MDTable` change was required.

## Preserved ownership

- `DatabaseViewWidget` owns top-level composition/layout facts;
- `DatabaseViewLayout` forwards offsets;
- `DatabaseDataTable` owns table virtualization presentation and local sticky action integration;
- `useVirtualCollection` forwards `surfaceOffset`;
- TanStack owns range/measurement/cache/scroll correction;
- shared `MDTable` owns generic native table frame/header behavior.

The removed entity ancestor/sibling geometry-discovery path must not return.

## Verification evidence

Coding agent reports focused unit/E2E/relation E2E/format/ESLint/Oxlint/type-check green and cumulative:

`pnpm verify --base origin/develop`

passed in one iteration with no remaining failure.

## Remaining gates

1. operator reinspection of the real Database table, especially borders/corners and combined sticky header/action behavior;
2. exact-head GitHub CI green with no retry/flaky classification;
3. final full resulting-PR review.

Residual heterogeneous-content Chromium jank and other non-virtualization performance causes are explicitly deferred to later PRs.

## Blockers

No current semantic implementation blocker. A new exact-head moving-surface reproduction would reopen that finding.