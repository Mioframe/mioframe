# Database virtualization moving-surface proof correction preflight

Status: **ready**.

Implementation contract:

- `docs/database-virtualization-moving-surface-proof-correction-handoff.md`

## Problem

The moving-surface product E2E is the only failing exact-head CI contract in run #4334, but the failure pattern is global test-budget exhaustion rather than a confirmed production geometry mismatch.

The current scenario spends most of its budget creating 40 rows through sequential Add Item dialogs before it executes the owned moving-surface lifecycle.

## Cause

The test setup is disproportionate to the contract.

The scenario needs enough real rows to prove a bounded virtualized range, not a large/stress dataset. Separate proofs already own large-range and scale behavior.

## Expected final state

Only `tests/e2e/databaseVirtualizationFlows.spec.ts` changes.

For `keeps real preceding Database content connected to the table-owned surface range`:

- establish compact deterministic viewport height before `launchApp`;
- desktop uses `640 x 360`;
- Mobile Chrome retains its project width and uses height `360`;
- keep real Weekly Plan starter creation and success card;
- add exactly 16 additional rows instead of 40;
- retain the real dismiss/top/deep lifecycle and all boundedness/surface assertions;
- derive setup-size arithmetic from the new explicit row-count constant or observable `rowCount`.

No production code or public API changes.

## TEST IMPACT

### Changed contract

No product contract changes.

The proof design changes so the existing product contract completes reliably within its normal budget.

### Primary proof owner

`tests/e2e/databaseVirtualizationFlows.spec.ts`

Scenario:

`keeps real preceding Database content connected to the table-owned surface range`

### Browser risks

- real layout and scroll range;
- browser scroll anchoring/clamping after preceding content disappears;
- desktop/mobile viewport geometry;
- virtualized mounted-range boundedness.

### Required proof

The same application E2E remains primary because the contract crosses starter-example creation, widget composition, real success-card dismissal, native table layout, scroll-root geometry, and virtualization.

No Storybook/component/unit replacement is faithful for this complete scenario.

### Stability

Required focused repeat:

`pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts --repeat 3`

A retry/flaky classification is failure.

## Ownership

- test setup/proof: application E2E;
- production widget/entity/shared/service ownership: unchanged.

Do not move this contract to shared fixtures or create a test-only production seam.

## Simplest viable alternative

Increasing the timeout would preserve the unnecessary 40-dialog cost and hide proof-design inefficiency. It is rejected.

Directly seeding a replacement database would make it harder to preserve the real starter success-card lifecycle. It is unnecessary.

Reducing the number of public Add Item setup actions while using a compact viewport preserves the real product lifecycle with fewer concepts and lower cost.

## Verification plan

1. focused E2E once;
2. focused E2E `--repeat 3`;
3. applicable format/lint if the test file changed structurally;
4. final `pnpm verify --base origin/develop`.

One focused `--profile github-actions` E2E run is allowed only if useful for validating the CI-specific pressure after normal focused proof; do not use that profile for the final branch gate.

## Stop condition

Stop and return to architecture if:

- 21 total real data rows do not produce a bounded virtualized range in either project;
- the proportional test reaches its owned geometry/range assertions with meaningful budget remaining but still cannot reach logical tail;
- satisfying the proof would require production changes, timeout expansion, project-applicability changes, or a new test-only production API.

## Forbidden

Production edits, timeout increase, `test.slow`, sleeps, recovery loops, retry acceptance, force, project applicability changes, shared/TanStack changes, architect-document edits by the coding agent, and unrelated cleanup.
