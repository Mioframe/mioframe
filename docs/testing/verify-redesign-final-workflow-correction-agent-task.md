# Verify redesign — final workflow correction agent task

## Read first

Read in this order before editing:

1. `AGENTS.md`
2. `.agents/skills/implementation-preflight/SKILL.md`
3. `.agents/skills/verification/SKILL.md`
4. `docs/testing/architecture.md`
5. `docs/testing/migration-plan.md`
6. `docs/testing/verify-redesign-current-handoff.md`
7. `.github/workflows/REVIEW.md`
8. `.github/workflows/verify.yml`
9. `docs/release.md` — especially `What CI verifies automatically`

Run the repository implementation preflight before editing. The architecture is already resolved. If current repository evidence contradicts this task or makes the final state unsafe, stop and report `blocked`; do not redesign the verifier or workflow.

## Problem and cause

The scripts-owned verify redesign is architect-accepted through `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43` and `scripts/REVIEW.md` has been removed.

One downstream blocker remains in `.github/workflows/REVIEW.md`: the `verify` workflow does not execute the public `browser-integration` verification type, so aggregate `verification` can succeed without browser/runtime proof.

Current CI already has independent parallel lanes for application E2E and Storybook behavior/visual. The missing browser-integration lane is a workflow wiring defect, not a verifier-planning defect.

## Expected final state

For PRs into non-`main` branches and pushes to `develop`:

- `browser-integration` runs as its own verifier-managed GitHub Actions job;
- the job uses only the public verifier command `pnpm verify --verbose --only browser-integration`;
- it runs in parallel behind `autofix`, like the existing E2E and Storybook browser jobs;
- verifier-managed Playwright remains container-only through the existing verifier/runtime boundary;
- aggregate `verification` requires the browser-integration job to succeed;
- existing static/unit/mutation, E2E, behavior, visual, version, preview, autofix, profile/base, lock, logging, timeout, and flaky-failure semantics remain unchanged;
- `docs/release.md` accurately describes the resulting develop CI topology.

## Architecture decision and ownership

Owner: `.github/workflows`.

Use the simplest complete topology:

1. Add one independent job named `verification-browser-integration` to `.github/workflows/verify.yml`.
2. Model its setup and gating on the existing `verification-browser-e2e` job rather than introducing a new reusable workflow, composite action, matrix, or generic browser-job abstraction.
3. The job depends only on `autofix` and uses the same success/skipped condition as the existing implementation verification jobs.
4. Keep the existing checkout/fetch-base/pnpm/node/install pattern so the public verifier receives the same repository/base context as the other affected lanes.
5. Its proof command is exactly:

   ```bash
   pnpm verify --verbose --only browser-integration
   ```

6. Give it its own failed/cancelled `.verify/logs/` artifact, named `verify-browser-integration-logs`, with the existing 7-day retention convention.
7. Add `verification-browser-integration` to aggregate `verification.needs` and explicitly fail the aggregate when its result is not `success`, alongside the existing static/E2E/Storybook checks.
8. Keep browser-integration separate from `verification-storybook-browser`; it is a different public proof type and execution owner.
9. Update `docs/release.md` `What CI verifies automatically` so it names the independent browser-integration lane and states that aggregate `verification` requires it in addition to static, E2E, and Storybook browser proof.

Do not change accepted scripts semantics to make the workflow easier to wire.

## Scope

Expected changed files:

- `.github/workflows/verify.yml`
- `docs/release.md`

Do not edit architect-owned review/control/task artifacts:

- `.github/workflows/REVIEW.md`
- `docs/testing/verify-redesign-current-handoff.md`
- `docs/testing/migration-plan.md`
- this task file

Do not edit `scripts/**` unless you stop and report `blocked` because repository evidence proves this task cannot be completed using the accepted public command. No such scripts change is expected.

## Acceptance criteria

1. `verification-browser-integration` exists as an independent job.
2. It has `needs: [autofix]` semantics equivalent to the existing E2E/Storybook implementation lanes and remains runnable when `autofix` is `success` or `skipped`.
3. It uses `ubuntu-24.04`, a bounded timeout consistent with the existing browser verification jobs, and `contents: read` only.
4. Checkout and PR-base fetch semantics match the existing affected verification jobs, including fork/read-only behavior.
5. Dependencies are installed with the existing pnpm/Node/frozen-lockfile pattern.
6. The only verification invocation in the new lane is the public command `pnpm verify --verbose --only browser-integration`; no private verifier leaf labels and no direct Playwright invocation appear in workflow YAML.
7. Failure/cancellation uploads `.verify/logs/` as `verify-browser-integration-logs` with `if-no-files-found: ignore` and 7-day retention.
8. Aggregate `verification.needs` includes `verification-browser-integration`.
9. Aggregate `verification` reads the new job result and exits non-zero unless that result is exactly `success`.
10. Existing static/unit/mutation, E2E, Storybook behavior/visual, `release-version`, final `verify`, and `deploy-preview` dependency topology is otherwise unchanged.
11. Browser-integration is not folded into the Storybook matrix and no new generic CI abstraction is introduced.
12. `docs/release.md` accurately documents the independent browser-integration lane and updated aggregate requirement.
13. No accepted scripts/public CLI contract is changed.

## Verification

Use the smallest useful repository-managed feedback for the files you actually edit. A focused static invocation is appropriate if it provides useful formatting/config/document feedback, for example:

```bash
pnpm verify --only static --files .github/workflows/verify.yml docs/release.md
```

Do not run `pnpm verify`, `pnpm verify --full`, or manually reconstruct the whole CI matrix solely for handoff. Exact-head GitHub CI is architect-owned and is the required proof that the new browser-integration job actually participates in the workflow and aggregate gate.

Before handoff, inspect the resulting workflow diff and confirm the exact job dependency topology and public command text.

## Forbidden

- Do not edit verifier planning or `scripts/**` to solve this workflow blocker.
- Do not expose or call private labels such as `artifact`, `managed-updates-browser-integration`, or `browser-integration-local` from workflow YAML.
- Do not invoke Playwright directly or on the host; keep verifier-managed Playwright container-only.
- Do not add browser-integration to the Storybook behavior/visual matrix.
- Do not merge E2E and browser-integration into a new matrix or reusable workflow merely to remove YAML duplication.
- Do not add a new action/composite-action/helper/DSL for this one job.
- Do not change public verification type names or add a public `release` type / restore `verify:release`.
- Do not change autofix, release-version, preview deployment, version materialization, profile/base resolution, lock, timeout, logging, or flaky policy.
- Do not weaken aggregate verification to tolerate skipped/failed browser-integration.
- Do not edit `.github/workflows/REVIEW.md` or architect-owned handoff/migration/task state.

## Report

Return exactly:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed commands actually useful during implementation/diagnosis>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

CI GATE
status: architect-owned
```

Also include a short summary of the changed workflow topology and documentation, without claiming CI success.
