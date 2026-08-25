# Review

Verdict: virtualization implementation and the proportional moving-surface proof correction are accepted; merge remains blocked by exact-head CI, operator visual reinspection, and final resulting-PR review.

## Scope reviewed

- PR #217 Database virtualization/native-table integration.
- Shared deep-state `surfaceOffset` capability.
- Top-level `DatabaseViewWidget` numeric offset diagnosis.
- Relation-value local-root loading correction.
- Sticky action/header stacking correction and real-browser hit-testing proof.
- Moving-surface E2E proof correction after exact-head GitHub Actions run #4334.

## Resolved — shared deep-state contract

The shared browser capability proves `deep -> change surfaceOffset while deep -> top -> deep` on the same root/list, reaching the logical tail before and after with bounded mounted work and consistent geometry. Shared production remains unchanged.

No shared/TanStack production correction is justified.

## Resolved — top-level supplied offsets are truthful in the diagnosed lifecycle

The coding-agent diagnosis reported truthful supplied-vs-physical offsets at every required checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both first and second deep phases reached logical row `46`. Temporary diagnostics were removed.

Together with the accepted shared deep-state capability, there is no current evidence supporting another production geometry/cache/lifecycle correction. Do not add timers, observers, cache reset, remount, or shared virtualization changes for this finding.

## Resolved — moving-surface product proof setup

Exact-head run #4334 showed the old scenario exhausting the 30-second test budget after 40 sequential Add Item dialog flows. Initial attempt and retries stopped at different phases while Mobile Chrome passed, so the evidence supported a proof-design correction rather than another production geometry patch.

The scenario now uses a compact deterministic viewport and 16 additional rows:

- desktop: `640 x 360`;
- Mobile Chrome: project width `393`, height `360`;
- five real Weekly Plan rows + 16 real added Task rows = 21 data rows;
- `aria-rowcount=22` including the header;
- initial mounted range is smaller than all logical data rows;
- first deep phase reaches `22/22`;
- the real success card is dismissed through `Got it` and the physical table surface moves upward;
- moved top range remains bounded;
- second deep phase reaches `22/22`.

Only `tests/e2e/databaseVirtualizationFlows.spec.ts` changed for this correction. Production code is unchanged.

### Verification correction

The architect-authored correction contract previously required E2E `--repeat 3`. That requirement was invalid: current `.agents/skills/verification/SKILL.md` defines `--repeat` as Storybook-behavior-only and E2E rejects it before execution.

The unsupported E2E repeat is therefore not an acceptance criterion.

The coding agent reports focused moving-surface E2E clean in multiple independent executions. Its required branch-diff gate stopped on `databaseViewsAndQueryFlows.spec.ts` relation-view flakiness rather than the corrected moving-surface proof. Repository rules require stopping/reporting rather than patching an unrelated or differently owned failure.

Exact-head GitHub CI is now the authoritative published-head gate. Any retry/flaky classification of the moving-surface scenario itself would reopen this finding.

## Resolved — relation-value local-root invariant

`RelationValueFieldData` renders the loading progress indicator and `DatabaseDataTable` mutually exclusively. Explicit relation `0/0` offsets are truthful whenever the table is mounted. Owner-local proof and relevant E2E were reported green.

Owner review: `src/features/relationValueEdit/REVIEW.md`.

## Resolved — sticky body action cells covering the header

`DatabaseDataTable` keeps body action cells sticky/right at local `z-index: 0`, below the shared sticky `thead` plane (`z-index: 1`). The header action cell remains locally elevated inside the header plane.

The product E2E uses actual `document.elementFromPoint()` hit-testing after combined vertical + horizontal scrolling and proves body-right, top-right header/action intersection, and ordinary header-band ownership.

No shared `MDTable` change was required.

## Preserved ownership

- `DatabaseViewWidget` owns top-level composition/layout facts;
- `DatabaseViewLayout` forwards offsets;
- `DatabaseDataTable` owns table virtualization presentation and local sticky action integration;
- `useVirtualCollection` forwards `surfaceOffset`;
- TanStack owns range/measurement/cache/scroll correction;
- shared `MDTable` owns generic native table frame/header behavior.

The removed entity ancestor/sibling geometry-discovery path must not return.

## Remaining gates

1. exact-head GitHub CI green with no retry/flaky classification for the moving-surface proof;
2. operator reinspection of the real Database table, especially borders/corners and combined sticky header/action behavior;
3. final full resulting-PR review.

Residual heterogeneous-content Chromium jank and other non-virtualization performance causes are explicitly deferred to later PRs.

## Blockers

No current semantic implementation blocker. Merge remains gated by exact-head CI and final acceptance evidence.
