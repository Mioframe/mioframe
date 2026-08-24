# Database virtualization branch E2E correction handoff

Status: **ready for implementation**.

## Problem

PR #217 still has two reproducible application-E2E failures after the relation cold-bootstrap correction. The failures are inside the accepted Database virtualization integration and must be resolved before operator visual acceptance / merge review.

Exact evidence comes from GitHub verify run `32701471162` for code head `ca6c7b0ea640c43fb43c9fb3a474358d2dc236ba`:

1. `tests/e2e/databaseVirtualizationFlows.spec.ts` — `keeps real preceding Database content connected to the table-owned surface range`:
   - the first top -> deep scroll succeeds while the Example-created card precedes the table;
   - the card is dismissed and the test proves the physical table surface offset moved;
   - after returning to top, the second deep scroll does not reliably reach the logical final row on desktop Chromium;
   - initial attempt + both retries failed.

2. `tests/e2e/databaseVirtualizationFlows.spec.ts` — `virtualizes the real Database root across deep native-table row and property ranges`:
   - the test sets `scrollTop = scrollHeight / 2` and `scrollLeft = scrollWidth / 2` and assumes that means a logical interior range;
   - exact-head CI repeatedly observed a boundary-like mounted range instead of two-sided row/column spacers;
   - the failure occurred on desktop Chromium and Mobile Chrome.

The previous relation-filter cold-bootstrap regression is resolved in the same full E2E run and must remain resolved.

## Goal

Restore deterministic Database virtualization behavior/proof without reopening the accepted architecture:

- table surface movement inside the same physical scroll root must be reflected by the existing table-owned surface geometry so later deep scrolling reaches the correct logical range;
- interior spacer proof must establish a _logical_ interior mounted range before asserting two-sided spacer structure;
- settled logical boundaries still omit zero-distance spacer DOM;
- transient non-empty/no-range bootstrap remains presentation-only and disappears after TanStack mounts real items;
- bounded mounted work, relation roots, editing, sticky behavior, ARIA, and dynamic sizing remain intact.

## Non-goals

- residual heterogeneous-content Chromium performance attribution;
- Number/String/value optimizations;
- worker/query/storage changes;
- shared `MDTable` redesign;
- a new virtualization/range/measurement engine;
- new verifier infrastructure;
- exact-pixel test contracts.

## Architecture decision and ownership

### B1 — moving table surface

Owner remains `src/entities/databaseData/DatabaseDataTable.vue` **unless focused evidence proves the existing shared virtualization boundary cannot consume a correct reactive surface offset**.

The current design is still accepted:

- the physical `scrollRoot` is explicit;
- the native Database table is the collection surface;
- `DatabaseDataTable` owns root-to-surface offset observation/derivation;
- `useVirtualCollection` consumes the reactive `surfaceOffset`;
- TanStack remains the sole owner of virtual range, item measurements, measured-size cache, and scroll correction.

Implementation may correct the existing entity-local observation/update path only if focused evidence shows it is stale or incomplete after real composition movement.

Do not add a second geometry state, stored range state, timer-driven recovery, remount loop, or manual virtualizer range calculation.

If the failure is caused by `useVirtualCollection` not reacting correctly to an already-correct reactive `surfaceOffset`, STOP and report that shared-boundary evidence for a new architecture decision instead of changing shared code in this pass.

### B2 — logical interior proof

`scrollHeight / 2` and `scrollWidth / 2` are not product contracts and are not sufficient proof that the mounted logical range is interior.

The application E2E must use observable product DOM facts to establish the precondition before asserting two-sided spacers:

- mounted row indices are strictly away from both logical row boundaries;
- mounted property column indices are strictly away from both logical property boundaries.

Only after those logical conditions are true may the test assert leading + trailing spacer structure.

The test may choose/adjust a physical scroll position to reach an interior range, but must not assert an exact pixel, sleep for settlement, or weaken the spacer contract.

If a confirmed logical interior mounted range lacks the corresponding leading/trailing spacers, that is a production integration defect owned by `DatabaseDataTable`, not a test problem.

## Source of truth

- logical Database rows/properties remain the source collection;
- mounted logical identity comes from existing `aria-rowindex` / `aria-colindex` product DOM;
- virtual geometry comes only from `useVirtualCollection` / TanStack;
- no test-only production seam is authorized.

## Acceptance criteria

1. The moving-surface scenario passes without retry/flaky classification and reaches the logical final row before and after the preceding success card is removed.
2. The test proves the surface actually moved and does not rely on remount/forced recovery.
3. The deep native-table scenario establishes a genuine logical interior row + property range before asserting two-sided spacers.
4. When that logical interior is established, both leading and trailing row/column spacers are present.
5. Logical start/end still omit zero-distance spacers.
6. Relation cold-bootstrap persistence remains green.
7. Existing nested relation, bounded mounted work, dynamic sizing, sticky, editing, and ARIA proofs remain green.
8. No shared/public API change is introduced.
9. Final coding handoff includes a clean cumulative branch verifier run:

   `pnpm verify --base origin/develop`

## Verification workflow

During correction, use focused verifier commands for fast feedback, especially the owning application E2E file and type-check when production code changes.

After each focused correction is green, run the complete cumulative branch gate:

`pnpm verify --base origin/develop`

If that branch gate finds another PR-caused failure, fix it when it remains within the accepted PR architecture/ownership, use focused verifier feedback for the correction, then rerun the complete branch gate. Repeat until clean.

If branch verification exposes an unrelated base failure or a failure requiring material architecture/ownership expansion, stop and report exact evidence rather than broadening the implementation.

A retry-pass/flaky result is not clean verification.

## Forbidden

- raw Git commands or historical worktree/checkouts/bisect orchestration;
- direct Playwright/Vite/browser commands outside verifier;
- `--profile github-actions` for the local branch handoff gate;
- `pnpm verify --full` as the PR branch gate;
- sleeps, timeout inflation, retries-as-success, `force`;
- exact-pixel assertions as a substitute for logical range proof;
- forced remount/update recovery;
- new independent geometry/range/measurement state;
- shared `MDTable`, `useVirtualCollection`, TanStack, worker/query/storage changes without stopping for architecture;
- unrelated cleanup;
- editing architect-owned `REVIEW.md`, architecture/handoff documents, or PR metadata.
