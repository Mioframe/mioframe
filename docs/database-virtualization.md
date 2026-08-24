# Database virtualization

Status: **shared virtualization architecture accepted; PR #217 implementation blocked by two Database virtualization application-E2E failures plus operator visual acceptance**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

Current contracts:

- completed native-table integration correction: `docs/database-virtualization-integration-correction-handoff.md`;
- completed relation cold-bootstrap correction: `docs/database-virtualization-relation-bootstrap-correction-handoff.md`;
- active branch-E2E correction: `docs/database-virtualization-branch-e2e-correction-handoff.md`;
- implementation preflight: `docs/database-virtualization-branch-e2e-correction-preflight.md`;
- active review: `src/entities/databaseData/REVIEW.md`;
- deferred residual performance work: `docs/database-chrome-jank-follow-up.md`.

## PR #217 accepted architecture

- `@tanstack/vue-virtual` is the sole virtual-item range/measurement/cache engine.
- `useVirtualCollection` is the shared one-axis virtualization boundary.
- Database uses independent row/property virtual collections and native `<table>` rendering.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- Existing inline-edit, relation-root, accessibility, dynamic-sizing, sticky-surface, and value ownership remains unchanged.
- Structural boundedness and deep correctness remain required, including 30,000 × 300 without materializing 9,000,000 logical intersections.

## Database table integration

`entities/databaseData` owns native-table virtualization presentation and the root-to-table-surface geometry required by that presentation. `shared/ui/Table` remains generic.

Settled boundary invariant:

> Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

Cold-bootstrap invariant:

> A non-empty logical collection with no mounted virtual items may render only transient `aria-hidden` bootstrap table structure. That structure disappears as soon as TanStack supplies real virtual items and never becomes a second range/measurement owner.

Current implementation preserves both contracts. The previously failing persisted relation-filter cold-reload scenario passed in branch-wide E2E after the bootstrap correction.

## Active correction — table surface movement and interior proof

Exact-head branch-wide E2E still exposes two blockers.

### Moving surface

When real composition content before the table appears/disappears, the table's root-relative collection-surface offset changes. The existing entity-owned observation/derivation path must propagate that movement so later top/deep scrolling reaches the same correct logical ranges without remounts, timers, forced updates, or a second geometry engine.

The current evidence proves the end-to-end contract is unreliable after the surface moves, but does not yet prove whether the stale step is entity-local observation or the shared boundary. The active correction may change only the entity-local `DatabaseDataTable` geometry/update path when focused evidence selects it. If a correct reactive `surfaceOffset` reaches the shared boundary and TanStack still fails to react, stop for a new architecture decision before changing `useVirtualCollection`.

### Interior spacer proof

Physical `scrollHeight / 2` and `scrollWidth / 2` are not contracts for a logical interior virtual range.

Application E2E must first establish, from mounted `aria-rowindex` / `aria-colindex`, that both row and property ranges are strictly interior. Only then may it assert that both leading and trailing spacers exist.

If a confirmed logical interior range lacks required spacers, that is a production integration defect. Otherwise the correction belongs only to the test precondition, not production behavior.

## Verification workflow

During implementation use focused verifier runs for fast feedback. Before coding handoff, the cumulative PR branch gate is mandatory:

`pnpm verify --base origin/develop`

If it exposes another PR-caused in-contract failure, fix it, verify that correction narrowly, then rerun the complete branch gate. Repeat until clean. Do not force the local `github-actions` profile; the local verifier profile is the intended agent environment.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank is intentionally **deferred to a separate PR** and is not a #217 merge blocker.

Retained evidence and the next String-vs-Number/data-density discriminator are recorded in `docs/database-chrome-jank-follow-up.md`.

Do not add Number-specific, worker/query/storage, Material, or speculative shared-virtualization performance changes to #217.

## Merge criteria

PR #217 may merge when:

1. both active branch-E2E blockers are resolved without retry/flaky classification;
2. coding-agent `pnpm verify --base origin/develop` passes cleanly;
3. operator inspection confirms the Database table border/corner appearance is restored at representative start/end states;
4. exact-head GitHub CI is green;
5. full resulting PR review finds no remaining blocker.

Residual Chromium heterogeneous-table jank remains an explicitly accepted tracked follow-up risk.

## Forbidden before merge

- shared `MDTable` changes without a newly established shared defect;
- Database-specific duplicate border/radius framework;
- shared `useVirtualCollection`/TanStack changes without evidence selecting that owner and a new architecture decision;
- second geometry/range/measurement state;
- Number/value/query or worker/query/storage performance optimization;
- new verifier/benchmark/visual infrastructure solely for this correction;
- exact-pixel interior-range assumptions;
- timeout inflation, sleeps, force, retry-as-success, remount recovery, or unrelated cleanup.
