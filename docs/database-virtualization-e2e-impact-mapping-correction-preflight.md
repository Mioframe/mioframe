# Database virtualization E2E impact mapping correction preflight

Status: **ready**.

Authoring source: [`scripts/REVIEW.md`](../scripts/REVIEW.md) B1 plus the canonical application-E2E impact contract in [`docs/testing/architecture.md`](testing/architecture.md). A separate architect handoff is intentionally skipped: this is a narrow verifier-metadata correction with owner, source of truth, final state, and proof already resolved by current repository evidence.

## Goal

Make focused application-E2E selection include the existing inline relation selected-view product proof whenever one of the three sources that propagate/apply the selected relation `viewId` changes.

## Non-goals

- no production/runtime, Database, relation, virtualization, Playwright scenario, project-applicability, timeout, retry, or CI workflow change;
- no broadening of the complete `database virtualized table product behavior` scope;
- no verifier abstraction, generic mapping helper, registry redesign, or new proof file;
- no cleanup of unrelated existing E2E mappings.

## Confirmed current behavior

- `RelationValueField.vue` resolves the effective relation view and passes it as slot `viewId`;
- `RelationValueFieldData.vue` forwards that `viewId` to `DatabaseDataTable`;
- `DatabasePropertyValueField.vue` composes those two owners;
- the existing `uses default relation view inline and switches to a selected relation view` scenario in `databaseViewsAndQueryFlows.spec.ts` is the product proof that distinguishes default-view data from a differently sorted selected relation view;
- current focused mappings for those sources select item-flow and virtualization proof but omit that historical selected-view proof.

## Owner and source of truth

Owner: `scripts/lib/e2eRisk.ts`.

Source of truth remains the current explicit `E2E_SCENARIO_SCOPES` registry. No new state or public API is introduced.

## Minimum implementation design

Add one narrow explicit scenario mapping for exactly:

- `src/features/relationValueEdit/RelationValueField.vue`;
- `src/features/relationValueEdit/RelationValueFieldData.vue`;
- `src/widgets/DocumentView/Database/DatabasePropertyValueField.vue`.

That mapping selects only:

- `tests/e2e/databaseViewsAndQueryFlows.spec.ts`.

The resolver already unions and deduplicates overlapping mappings, so the resulting focused plan for each source must contain exactly:

1. `tests/e2e/databaseItemFlows.spec.ts`;
2. `tests/e2e/databaseViewsAndQueryFlows.spec.ts`;
3. `tests/e2e/databaseVirtualizationFlows.spec.ts`.

Simpler alternative considered: add `databaseViewsAndQueryFlows.spec.ts` to the existing broad virtualization mapping. Rejected because it would select the historical views/query proof for unrelated Database virtualization sources that do not own relation selected-view propagation.

## Expected files

Only:

- `scripts/lib/e2eRisk.ts`;
- `scripts/lib/e2eRisk.test.ts`.

Architect-owned `scripts/REVIEW.md`, this preflight, canonical virtualization documentation, PR metadata, production sources, and application E2E specs are read-only for the coding pass.

## Pass order

1. Add the narrow selected-relation-view scenario mapping without changing existing mappings.
2. Extend the existing `resolveAppE2EPlan full -> focused transitions (V2A)` proof so each of the three source paths resolves to the exact three-spec union above.
3. Run focused verifier-managed feedback.
4. Run the required branch-diff handoff gate against `origin/develop` and fix only PR-caused failures that remain inside this verifier-owner contract.

## TEST IMPACT

- Contract/scenario: focused application-E2E impact for inline relation selected-view propagation.
  - Primary proof owner: `scripts/lib/e2eRisk.test.ts` deterministic resolver unit proof.
  - Additional proof: none; product behavior itself is unchanged and already owned by `tests/e2e/databaseViewsAndQueryFlows.spec.ts`.
  - Existing proof: current V2A focused-plan tests plus the historical relation selected-view application E2E.
  - New/updated proof: exact focused-plan assertions for the three source owners.
  - Risk/platform matrix: verifier planning only; no browser/project applicability change.
  - Durable ownership/impact updates: one explicit `E2E_SCENARIO_SCOPES` entry in `scripts/lib/e2eRisk.ts`.

## Verification

Useful focused feedback:

```text
pnpm verify --only unit-tests --files scripts/lib/e2eRisk.ts scripts/lib/e2eRisk.test.ts
pnpm verify --only type-check
pnpm verify --only eslint --files scripts/lib/e2eRisk.ts scripts/lib/e2eRisk.test.ts
pnpm verify --only oxlint --files scripts/lib/e2eRisk.ts scripts/lib/e2eRisk.test.ts
```

Run only the focused checks materially useful during implementation; do not mechanically run all labels when one already covers the failure.

Required handoff gate:

```text
pnpm verify --base origin/develop
```

A retry/flaky result is not clean. GitHub exact-head CI remains architect-owned.

## Acceptance

- each of the three named source files resolves in focused mode to exactly the three expected specs;
- existing item-flow, virtualization, persistence, views/query, and other E2E mappings retain their current behavior;
- no unrelated source starts selecting `databaseViewsAndQueryFlows.spec.ts` because of this correction;
- no product/test scenario semantics, project applicability, timeout, retry, or runtime code changes;
- focused resolver proof and the branch-diff gate pass cleanly.

## Forbidden

- adding `databaseViewsAndQueryFlows.spec.ts` to the broad virtualization scenario entry;
- mapping the whole `src/features/relationValueEdit/` directory to views/query proof;
- changing application E2E assertions, helpers, applicability, timeouts, retries, or product code;
- adding generic mapping abstractions or another registry;
- weakening fail-closed behavior or existing resolver expectations;
- editing architect-owned review/architecture/preflight documents or PR metadata.

Verdict: **ready**.
