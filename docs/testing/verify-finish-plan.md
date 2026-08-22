# Verify modernization finish plan

Status: **all known implementation/review findings are closed; PR #216 exact-head CI remains the merge gate**.

This document owns verifier-modernization packaging and final integration state. It does not redefine lane semantics owned by the architecture documents.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — implemented agent-facing output;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact ownership correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed single-owner application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — closed release-impact selection/consumer ownership correction;
- `docs/testing/verify-modernization.md` — final implementation/selection status;
- `.agents/skills/verification/SKILL.md`, `project-review`, `architect-handoff`, `implementation-preflight`, `test-first`, and `test-authoring` — workflow/proof rules.

Architecture/status documents are architect-owned. Coding/test-author contexts must not edit them unless explicitly assigned.

## Branch / PR

```text
branch: refactor/verify-modernization-finish
PR: #216
base: develop
release intent: version:patch
```

Re-check the exact PR head and current `develop` before merge.

## Closed implementation scope

The following are closed and must not be reopened without new repository evidence:

- Pass A — bounded agent-facing output;
- Pass B — repository metadata classification;
- Pass C — unit impact / exact Vitest discovery / real `vitest related` ownership;
- single-owner application-E2E discovery architecture and collision-safe collector proof;
- Pass D — explicit mutation ownership;
- Pass E — release-impact selection, consumer mapping, and faithful execution timeout contracts;
- Pass F — parallel CI topology and independent `release-version` gate;
- final source/comment cleanup.

## Artifact timeout correction

The PR-level review found that `artifact` executes through the same bounded Playwright-container path as `release-smoke`:

```text
pnpm e2e:release --label artifact ...
→ scripts/e2eReleaseContainer.mjs
→ runPlaywrightInContainer(...)
```

The canonical container deadline is 900 seconds. `scripts/verify.ts` owns the outer Playwright command deadline through `resolvePlaywrightCommandTimeoutMs()`:

```text
900 seconds + 2 minutes orchestration allowance
= 17 minutes
```

The correction is implemented and architect-reviewed:

- `COMMAND_TIMEOUT_MS_BY_LABEL.artifact` now uses the existing derived Playwright timeout;
- `scripts/verify.test.ts` classifies `artifact` with the Playwright-backed labels rather than the unrelated fixed-limit commands;
- the proof requires every single-session Playwright-backed outer timeout to equal the derived contract and stay strictly above the canonical container deadline;
- no artifact-specific timeout constant, resolver, configuration, release mapping, runner, or workflow path was added.

The resulting verifier-owned worst-case release-impact envelope remains:

```text
build             10m
artifact          17m
release-smoke     17m
managed-updates   68m
---------------------
total            112m
setup allowance    5m
required          117m
```

The existing `verification-release` GitHub job timeout remains 120 minutes, and the existing dynamic envelope proof verifies that it is strictly greater than the computed requirement. No workflow timeout or topology change is needed.

## Final semantic review

After the artifact timeout correction, the known PR-level finding is closed.

Current semantic findings:

```text
blockers: 0
major issues: 0
minor issues: 0
accepted risks: 0
```

A temporary review artifact must not remain in the mergeable PR diff after the finding is closed.

## Remaining order

```text
1. remove the resolved temporary scripts/REVIEW.md
2. refresh PR review wording to the closed state
3. require exact-head PR CI
4. if any automation changes the head, review that new exact head and require its CI
5. confirm the branch is not behind current develop
6. record the actual CI result / critical path if useful
7. give the merge-readiness verdict
8. squash merge only after the exact-head automatic gate is healthy
```

## PR / version policy

PR #216 is an ordinary internal verification/tooling refactor into `develop` with release intent:

```text
version:patch
```

Same-repository CI owns materialization of the exact `package.json` PATCH version.

## Exact-head rule

The exact PR head is authoritative. Any review/status cleanup or autofix commit invalidates earlier CI as a merge gate; only CI associated with the resulting final head counts.

## Stop rule

After exact-head CI is healthy and merge-readiness is established, stop verifier infrastructure modernization. Further jobs, sharding, cross-job artifacts, generic dependency graphs, task runners, universal registries, or speculative optimization require a separate measured need and architecture decision.
