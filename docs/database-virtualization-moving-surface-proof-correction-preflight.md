# Database virtualization moving-surface proof correction preflight

Status: **implemented; exact-head CI pending**.

Implementation contract:

- `docs/database-virtualization-moving-surface-proof-correction-handoff.md`

## Problem

The moving-surface product E2E was the only failing exact-head CI contract in run #4334, but the failure pattern was global test-budget exhaustion rather than a confirmed production geometry mismatch.

The previous scenario spent most of its budget creating 40 rows through sequential Add Item dialogs before it executed the owned moving-surface lifecycle.

## Cause

The test setup was disproportionate to the contract.

The scenario needs enough real rows to prove a bounded virtualized range, not a large/stress dataset. Separate proofs already own large-range and scale behavior.

## Implemented final state

Only `tests/e2e/databaseVirtualizationFlows.spec.ts` changed.

For `keeps real preceding Database content connected to the table-owned surface range`:

- viewport height is established before `launchApp`;
- desktop uses `640 x 360`;
- Mobile Chrome retains its project width and uses height `360`;
- real Weekly Plan starter creation and success card remain;
- exactly 16 additional rows are added instead of 40;
- total real data rows are 21 (`aria-rowcount=22` including the header);
- the real dismiss/top/deep lifecycle and boundedness/surface assertions remain;
- both deep phases reach `22/22` in focused proof.

No production code or public API changed.

## TEST IMPACT

### Changed contract

No product contract changes.

The proof design changes so the existing product contract completes within its normal budget.

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

## Verification correction

The earlier preflight incorrectly required E2E `--repeat 3`.

Current `.agents/skills/verification/SKILL.md` defines `--repeat` as Storybook-behavior-only. E2E does not support it. The unsupported command is not an acceptance criterion.

Required verification is:

1. focused E2E through `pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts`;
2. branch-diff gate through `pnpm verify --base origin/develop`;
3. exact-head GitHub CI.

The coding agent completed the focused moving-surface proof in multiple independent executions. The local branch gate stopped on a different relation-view E2E flake, which must not be patched inside this test-only correction unless evidence shows PR causality.

## Ownership

- test setup/proof: application E2E;
- production widget/entity/shared/service ownership: unchanged.

Do not move this contract to shared fixtures or create a test-only production seam.

## Simplest viable alternative

Increasing the timeout would preserve the unnecessary 40-dialog cost and hide proof-design inefficiency. It remains rejected.

Directly seeding a replacement database would make it harder to preserve the real starter success-card lifecycle. It remains unnecessary.

Reducing public Add Item setup actions while using a compact viewport preserves the real product lifecycle with fewer concepts and lower cost.

## Stop condition

Return to architecture if the proportional moving-surface scenario itself:

- does not produce a bounded virtualized range;
- cannot reach logical tail with meaningful test budget remaining;
- reports incorrect physical surface movement;
- would require production changes, timeout expansion, project-applicability changes, or a new test-only production API.

## Forbidden

Production edits, timeout increase, `test.slow`, sleeps, recovery loops, retry acceptance, force, project applicability changes, shared/TanStack changes, architect-document edits by the coding agent, unrelated cleanup, and treating unsupported E2E `--repeat` as a required command.
