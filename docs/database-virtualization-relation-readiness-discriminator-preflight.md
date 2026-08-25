# Database virtualization relation readiness discriminator preflight

Status: **ready**.

Implementation contract:

- `docs/database-virtualization-relation-readiness-discriminator-handoff.md`

## Expected outcome

No production correction is selected in this pass.

The task must return one readiness classification from observable DOM state at the initial default relation-view failure.

## Primary proof owner

`tests/e2e/databaseViewsAndQueryFlows.spec.ts`

Scenario:

`uses default relation view inline and switches to a selected relation view`

## Allowed diagnostic surface

Temporary changes only in the owning E2E or existing E2E helpers.

All temporary changes must be removed before handoff.

## Commands

Normal profile first:

`pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts`

If not reproduced:

`pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts --profile github-actions`

Do not run a branch gate when the task ends with no tracked implementation changes.

## Stop condition

Once a reproduced failure has one unambiguous classification, stop and return evidence to the architect. Do not implement the inferred fix.
