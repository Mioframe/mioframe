# Review

Verdict: blocked

## Scope reviewed

- PR #218 after merging `develop` commit `9dd19ed320ce227e915a824b5552af16108a5a10`, including conflict resolution, develop virtualization proof migration, verifier ownership, Playwright configuration, package/lock integration, repository verification rules, and post-merge CI evidence.

## Blockers

### B1 — Required branch-diff coding handoff proof is missing

Owner: repository verification handoff

Problem: The latest root verification rules require ordinary PR code work to complete with `pnpm verify --base origin/develop`, but the merge-resolution coding pass could not execute that command because its sandbox failed before verifier execution while opening pnpm's dependency-sync database under `/hoore/v11`. The required cumulative branch proof is therefore absent.

Evidence:

- [Current architect handoff](docs/testing/verify-redesign-current-handoff.md#b1--required-coding-agent-branch-handoff-evidence-is-missing) — records the merge-agent environment failure and that the canonical branch gate did not run.
- [Root repository rules](AGENTS.md#verification-ownership) — require `pnpm verify --base origin/develop` before final handoff of ordinary PR code work.

Basis:

- [Verification skill](.agents/skills/verification/SKILL.md#ownership) — defines the coding-agent branch handoff gate as distinct from exact-head GitHub CI and requires it for ordinary PR code work.
- [Project review skill](.agents/skills/project-review/SKILL.md#verification-during-review) — missing required proof is itself a review finding and must not be replaced by green proof of a different scope.

Risk: The complete cumulative PR diff after the large `develop` integration has not satisfied the repository's required local-profile handoff contract. Exact-head CI can still be useful evidence, but it is not the proof the new repository rule requires.

Required final state: After all post-merge code corrections are complete, a coding environment capable of running the canonical verifier executes `pnpm verify --base origin/develop` and returns a clean, non-flaky result. A sandbox failure before verifier execution does not satisfy this requirement.

Verification: Record the successful `BRANCH VERIFICATION` result from the coding agent using exactly `pnpm verify --base origin/develop` with no shell environment workaround and no retry/flaky acceptance.

## Major issues

### M1 — Dedicated Firefox virtualization proof is not guarded by the configuration contract test

Owner: root Playwright configuration

Problem: `playwright.storybook.config.ts` correctly keeps the normal owner-local behavior corpus in Chromium and additionally routes the database native-table virtualization capability through `firefox-virtualization-capability`, but `playwright.lanes.test.ts` only asserts the top-level behavior `testMatch`. It does not assert the dedicated Firefox project, its engine, or its exact database virtualization membership.

Evidence:

- [Storybook Playwright config](playwright.storybook.config.ts) — defines `firefox-virtualization-capability` with the exact database virtualization behavior spec because dynamic native-table measurement is the confirmed engine-specific risk.
- [Playwright lane contract test](playwright.lanes.test.ts) — validates target lane discovery but has no assertion over `storybookBehaviorConfig.projects` or the Firefox exception.
- [Current architect handoff](docs/testing/verify-redesign-current-handoff.md#m1--firefox-virtualization-project-lacks-a-configuration-regression-guard) — records the Firefox exception as an accepted post-merge integration requirement and the missing guard.

Basis:

- [UI browser behavior skill](.agents/skills/ui-browser-behavior/SKILL.md#supported-browser-policy) — browser/project applicability must follow confirmed engine-specific observable risk, not incidental browser-name filtering.
- [Project review skill](.agents/skills/project-review/SKILL.md#review-standard) — required proof ownership and whether automated checks actually prove the claimed contract are part of review acceptance.

Risk: A future Storybook configuration edit can silently remove or broaden the dedicated Firefox proof while the existing lane unit test remains green. Runtime CI currently executes the proof, but there is no deterministic configuration guard for the accepted engine-specific routing contract.

Required final state: The existing root Playwright configuration contract test machine-validates the dedicated Firefox project, its exact database virtualization behavior-spec membership, and Firefox engine selection while preserving the normal target-only behavior corpus. No new registry or runtime abstraction is introduced.

Verification: `pnpm verify --only unit --files playwright.storybook.config.ts playwright.lanes.test.ts` (or the equivalent focused public-unit scope selected by the verifier) passes and fails if the dedicated Firefox project/membership is removed or changed incorrectly.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
