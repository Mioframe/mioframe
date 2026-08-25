# Database virtualization relation readiness CI diagnostic preflight

Status: **ready**.

Implementation contract:

- `docs/database-virtualization-relation-readiness-ci-diagnostic-handoff.md`

## Change scope

Test-only change in:

`tests/e2e/databaseViewsAndQueryFlows.spec.ts`

No production changes.

## Test impact

Primary proof remains the existing application E2E:

`uses default relation view inline and switches to a selected relation view`

The change must preserve the existing assertion semantics and only enrich failure output.

## Required implementation shape

- retain the latest readiness snapshot only while the initial default-view poll is failing;
- after final poll failure, emit one structured diagnostic line and rethrow the original error;
- emit nothing on success;
- do not add a new wait, timeout, retry, recovery action, or alternative assertion path.

Required snapshot fields are defined by the handoff.

## Verification

Focused:

`pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts`

Then applicable format/lint checks.

Final coding-agent gate:

`pnpm verify --base origin/develop`

## Acceptance

- diagnostic is available to exact-head GitHub CI;
- successful scenario behavior is unchanged;
- failure still fails for the original contract;
- one final readiness snapshot is visible in failure output;
- no production file changes;
- focused proof and branch gate pass.
