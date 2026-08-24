# Review

Verdict: blocked by two branch-wide Database virtualization E2E failures, operator visual acceptance, and exact-head CI.

## Scope reviewed

- PR #217 current Database virtualization/native-table integration.
- Settled zero-distance spacer correction at `d3c81c27805316a8ebd46e53c96137520e6d14a4`.
- Relation cold-bootstrap correction at `ca6c7b0ea640c43fb43c9fb3a474358d2dc236ba`.
- Full GitHub application E2E for that code head in workflow run `32701471162`.
- Active correction contract: `../../../docs/database-virtualization-branch-e2e-correction-handoff.md`.
- Deferred residual Chromium performance risk.

## Resolved — relation-value cold bootstrap

The previously failing `tests/e2e/databaseViewsAndQueryFlows.spec.ts` relation-filter persistence scenario passed in the full E2E run at `ca6c7b0e...`.

The accepted correction remains entity-local: a non-empty source with no virtual items renders transient `aria-hidden` bootstrap table structure, which disappears when TanStack provides real virtual items. Settled leading/trailing spacers remain positive-distance-only. No second range state or shared/public API was added.

## Blocker 1 — table surface does not reliably reach the deep range after preceding content moves

Owner: `src/entities/databaseData` table/root geometry integration unless focused evidence proves a correct reactive `surfaceOffset` already reaches the shared boundary.

Problem: the existing E2E scenario `keeps real preceding Database content connected to the table-owned surface range` succeeds on the first deep scroll while the success card precedes the table. After the card is dismissed, the product DOM proves the table's root-relative surface offset changed. After returning to top and scrolling deep again, desktop Chromium fails to reach the logical final row. Initial attempt and both retries failed.

Required final state:

- real composition movement before the table updates the existing table-owned surface geometry path;
- subsequent top -> deep scrolling again reaches the logical final row;
- no remount/recovery loop, timer, second geometry state, or manual range calculation;
- TanStack remains sole virtual-item range/measurement/cache owner;
- if evidence proves `useVirtualCollection` fails despite receiving a correct reactive surface offset, stop for architecture instead of modifying shared virtualization in this correction.

Verification owner: existing application E2E plus cumulative branch verifier.

## Blocker 2 — interior spacer proof assumes physical midpoint means logical midpoint

Owner: primary proof `tests/e2e/databaseVirtualizationFlows.spec.ts`; production owner becomes `src/entities/databaseData` only if a confirmed logical interior range lacks required spacers.

Problem: scenario `virtualizes the real Database root across deep native-table row and property ranges` sets both physical scroll offsets to one-half of their ranges and assumes that means a logical interior range. Exact-head CI repeatedly observed a boundary-like mounted range instead on desktop and Mobile Chrome.

Required final state:

- use mounted `aria-rowindex` / `aria-colindex` to establish a genuine logical interior row/property range before asserting two-sided spacer structure;
- when the logical range is interior, leading and trailing row/column spacers must all exist;
- if those logical preconditions are satisfied but spacers are absent, fix the production table integration;
- no exact-pixel assumptions, sleeps, retry acceptance, or timeout inflation.

Verification owner: existing application E2E plus cumulative branch verifier.

## Required coding-agent branch gate

Focused verifier runs are for fast correction feedback. Before final handoff of code, run:

`pnpm verify --base origin/develop`

If it finds another PR-caused in-contract failure, fix it, verify that correction narrowly, then rerun the complete branch gate. Repeat until clean.

Do not force `--profile github-actions` for this local branch gate. Do not substitute `pnpm verify --full`.

## Remaining blocker — operator visual acceptance

Owner: operator/architect review of `entities/databaseData` presentation.

Required final state: inspect the real application table and confirm the pre-virtualization outer border/corner appearance is restored at ordinary top/left and representative deep/end scroll states. If a concrete visual mismatch remains, reopen the integration architecture before changing shared `MDTable` or duplicating its styling.

## Accepted follow-up risk — not required for PR #217

Residual heterogeneous-content Chromium jank remains tracked in `../../../docs/database-chrome-jank-follow-up.md` and moves to a separate PR. Number isolation is a reproducer, not an established production owner.

## Merge condition

After both branch-wide virtualization E2E blockers are resolved, `pnpm verify --base origin/develop` passes cleanly, operator visual acceptance is complete, exact-head GitHub CI is green, and the full resulting PR is reviewed again, merge readiness may be reconsidered.

Do not delete this `REVIEW.md` before those conditions are satisfied.
