# Verify redesign — post-merge correction agent task

## Read first

Read these current repository sources in order before editing:

1. `AGENTS.md`
2. `.agents/skills/unit-testing/SKILL.md`
3. `.agents/skills/verification/SKILL.md`
4. `.agents/skills/ui-browser-behavior/SKILL.md`
5. `docs/testing/architecture.md`
6. `docs/testing/migration-plan.md`
7. `docs/testing/verify-redesign-current-handoff.md`
8. `REVIEW.md`
9. `playwright.storybook.config.ts`
10. `playwright.lanes.test.ts`

This is a narrow deterministic post-merge correction. The runtime architecture is already accepted. Do not redesign verification or Storybook execution.

## Problem and cause

Current `playwright.storybook.config.ts` is correct after integrating `develop`:

- the normal owner-local `*.behavior.spec.ts` corpus runs in the `chromium` project;
- the database native-table virtualization capability additionally runs in the dedicated `firefox-virtualization-capability` project because dynamic native-table measurement is a confirmed engine-specific risk;
- the Firefox project targets exactly `src/entities/databaseData/DatabaseVirtualizationCapability.behavior.spec.ts`.

However, `playwright.lanes.test.ts` currently guards only the top-level Storybook behavior discovery. It does not machine-guard the dedicated Firefox project, Firefox engine selection, or exact virtualization-spec membership. A future config change could therefore remove or broaden that engine-specific proof while the deterministic lane contract test remains green.

Separately, the previous merge-resolution coding pass could not execute the newly mandatory cumulative branch handoff gate because its sandbox failed inside pnpm before verifier execution. The final coding handoff must therefore produce a clean `pnpm verify --base origin/develop` result from the current environment after this correction.

## Expected final state

### 1. Guard the existing Storybook project topology in `playwright.lanes.test.ts`

Add the smallest deterministic assertions needed to prove the accepted current configuration:

- the normal `chromium` Storybook project remains present and inherits the top-level owner-local behavior `testMatch` rather than narrowing itself to the virtualization exception;
- the dedicated project named exactly `firefox-virtualization-capability` remains present;
- that Firefox project selects exactly:
  - `src/entities/databaseData/DatabaseVirtualizationCapability.behavior.spec.ts`;
- that project resolves to the Firefox browser engine from the Playwright device configuration;
- the dedicated Firefox project does not become a broad Firefox run of the complete behavior corpus.

Use the existing imported `storybookBehaviorConfig` as the source of truth. Keep the assertions local to the existing root Playwright configuration contract test.

Do not duplicate the virtualization spec path into a new production/config registry or helper solely for this test. The runtime config remains the implementation source; the unit test verifies its observable configuration contract.

### 2. Preserve the current runtime configuration

`playwright.storybook.config.ts` is already correct and must remain unchanged unless current repository evidence proves an actual runtime defect. Merely making the test easier is not a reason to edit the runtime config.

Preserve:

- top-level `testMatch: ['src/**/*.behavior.spec.ts', '.storybook/**/*.behavior.spec.ts']`;
- `chromium` as the normal behavior project;
- the dedicated Firefox virtualization project and its current narrow membership;
- current retries/fail-on-flaky/workers/webServer behavior;
- target-only `*.behavior.spec.ts` discovery;
- removal of ordinary `*.browser.spec.ts` compatibility.

### 3. Complete the mandatory branch handoff gate

After the focused unit correction is green, run exactly:

```bash
pnpm verify --base origin/develop
```

Use the normal local verifier profile. Do not add shell-level environment prefixes or substitute `--full` / GitHub Actions profile.

If the branch gate reports a PR-caused failure that is clearly inside the already accepted architecture and ownership, fix the smallest truthful cause, run the smallest relevant focused verifier feedback, then rerun the complete branch gate.

If the branch gate failure is unrelated to this PR, still fails before verifier execution because of the environment, or would require material architecture/ownership expansion, stop and report `blocked` with the exact evidence. Do not patch around it.

## Ownership

- Root Playwright configuration contract proof: `playwright.lanes.test.ts`.
- Runtime Storybook Playwright topology: `playwright.storybook.config.ts` — read-only for this correction unless direct evidence proves it is wrong.
- Branch handoff verification: canonical `pnpm verify --base origin/develop` owned by the repository verification workflow.
- Architect-owned review/handoff/PR state remains outside the coding agent scope.

## Expected implementation scope

Expected tracked code change:

- `playwright.lanes.test.ts`

Do not edit other files merely for cleanup or consistency.

Additional implementation files may be touched only if the mandatory branch gate exposes a concrete PR-caused failure that is safely resolvable inside the already accepted architecture. If that happens, keep the correction minimal and explain it in the final report.

## TEST IMPACT

### Contract: normal Storybook behavior remains Chromium-owned while the audited native-table virtualization capability additionally runs in Firefox

- Primary proof owner: `playwright.lanes.test.ts` in the `unit` verification type.
- Existing proof: current top-level Storybook behavior `testMatch` assertion and actual Playwright behavior CI execution.
- New/updated proof: deterministic assertions over `storybookBehaviorConfig.projects` covering Chromium inheritance, dedicated Firefox project name, exact virtualization-spec membership, and Firefox engine selection.
- Browser risk: Firefox is retained only for the confirmed database native-table measurement risk; do not widen Firefox execution to unrelated behavior specs.
- Durable ownership update: none; this is proof of the already accepted runtime topology, not a new registry or architecture rule.

### Contract: cumulative coding-agent handoff for the integrated PR

- Primary proof owner: `pnpm verify --base origin/develop`.
- Existing proof: absent after the merge pass because pnpm failed before verifier execution in the previous sandbox.
- New proof: one clean, non-flaky branch gate on the completed correction.
- Durable ownership update: none; root `AGENTS.md` and the verification skill already own this rule.

## Acceptance criteria

1. `playwright.lanes.test.ts` fails if `firefox-virtualization-capability` is removed.
2. It fails if that project stops using the Firefox engine.
3. It fails if the Firefox project no longer targets exactly `src/entities/databaseData/DatabaseVirtualizationCapability.behavior.spec.ts`.
4. It protects the normal Chromium behavior project from being narrowed to the Firefox-only exception.
5. Existing target-only Storybook behavior discovery remains unchanged.
6. `playwright.storybook.config.ts` remains unchanged unless a real runtime defect is proven.
7. No new registry, helper abstraction, public verification type, suffix, runner, or compatibility path is introduced.
8. Focused unit verification passes.
9. `pnpm verify --base origin/develop` completes cleanly with no retry/flaky acceptance.
10. No architect-owned review/documentation/workflow file is edited.

## Verification

Use focused feedback first:

```bash
pnpm verify --only unit --files playwright.storybook.config.ts playwright.lanes.test.ts
```

Then run the required cumulative handoff gate:

```bash
pnpm verify --base origin/develop
```

Do not run `pnpm verify --full` for this task.

## Forbidden

- changing `playwright.storybook.config.ts` merely to make the test easier;
- broadening Firefox to the complete behavior corpus;
- removing the dedicated Firefox virtualization proof;
- restoring `*.browser.spec.ts` discovery or `tests/e2e/storybook/**` ordinary behavior ownership;
- adding another project/spec registry, generic browser matrix abstraction, planner, DSL, or metadata layer;
- changing verifier planners, public verification taxonomy, mutation targets, E2E ownership, browser-integration ownership, or CI topology without new branch-gate evidence that proves a concrete in-contract defect;
- changing retries, timeouts, workers, flaky policy, container execution, locks, status/resume, or profile/base semantics;
- weakening assertions, adding sleeps/retry recovery, or accepting flaky/retry-pass proof;
- editing `REVIEW.md`;
- editing `docs/testing/verify-redesign-current-handoff.md`;
- editing `docs/testing/migration-plan.md`;
- editing this task file;
- editing `.github/workflows/verify.yml`;
- editing architect-owned architecture/review documents;
- manually bumping `package.json` version.

## Final report

Return exactly:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed commands actually useful during implementation/diagnosis>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

BRANCH VERIFICATION
command: pnpm verify --base origin/develop | skipped
status: passed | failed | skipped
reason if failed/skipped: none | <exact reason>

CI GATE
status: architect-owned
```

`complete` is valid only when the code correction is complete and the mandatory branch handoff gate is clean. If the environment prevents the branch gate from reaching verifier execution, report `blocked`, not `complete`.
