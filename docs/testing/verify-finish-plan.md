# Verify modernization finish plan

Status: **PR #216 is blocked by one verifier execution-contract finding: the `artifact` release check has an outer timeout shorter than its owning Playwright container deadline**.

This document owns verifier-modernization packaging and final integration order. It does not redefine lane semantics owned by the architecture documents.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — implemented agent-facing output;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact ownership correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed single-owner application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — closed release-impact selection/consumer ownership correction;
- `docs/testing/verify-modernization.md` — implementation/selection status;
- `scripts/REVIEW.md` — active PR-level review findings;
- `.agents/skills/verification/SKILL.md`, `project-review`, `architect-handoff`, `implementation-preflight`, `test-first`, and `test-authoring` — workflow/proof rules.

Architecture/status documents are architect-owned. Coding/test-author contexts must not edit them unless explicitly assigned.

## Branch / PR

```text
branch: refactor/verify-modernization-finish
PR: #216
current reviewed head: bdd2131c8a6bd40db1a34e1ce8e0cc4c9d45884a
base: develop
```

Re-check the exact PR head and current `develop` before merge.

## Closed implementation scope

The following remain closed and must not be reopened without new evidence:

- Pass A — bounded agent-facing output;
- Pass B — repository metadata classification;
- Pass C — unit impact / exact Vitest discovery / real `vitest related` ownership;
- single-owner application-E2E discovery architecture and collision-safe collector proof;
- Pass D — explicit mutation ownership;
- Pass E — release-impact **selection and consumer mapping**;
- Pass F — parallel CI topology and independent `release-version` gate;
- final stale-comment cleanup.

## Active blocker — artifact outer timeout

The release-impact `artifact` command is:

```text
pnpm e2e:release --label artifact tests/e2e/release/productionArtifactSmoke.spec.ts
→ scripts/e2eReleaseContainer.mjs
→ runPlaywrightInContainer(...)
```

The shared Playwright container uses the canonical timeout from `config/tooling.json`:

```text
verification.playwrightContainer.timeoutSeconds = 900
```

`scripts/verify.ts` already defines the outer Playwright timeout contract as:

```text
container timeout + PLAYWRIGHT_COMMAND_OVERHEAD_MS
= 15 minutes + 2 minutes
= 17 minutes
```

That derived timeout is used by `e2e`, `storybook-behavior`, `visual`, and `release-smoke`, but `artifact` is incorrectly fixed at 8 minutes. The verifier can therefore terminate a valid artifact Playwright run before the owning container reaches its own bounded deadline.

This is an execution-contract bug, not a release-impact ownership redesign.

### Required final state

- `COMMAND_TIMEOUT_MS_BY_LABEL.artifact` uses `PLAYWRIGHT_COMMAND_TIMEOUT_MS`;
- timeout tests classify `artifact` as Playwright-container-backed, not as an unrelated fixed-limit command;
- every Playwright-backed label remains strictly above the canonical 900-second container deadline;
- the existing `verification-release` timeout-envelope proof is recalculated from the corrected command map;
- `.github/workflows/verify.yml` remains at 120 minutes unless the corrected envelope proves it insufficient.

With the current constants, the corrected verifier-owned worst-case release-impact envelope is:

```text
build          10m
artifact       17m
release-smoke  17m
managed-updates 68m
-------------------
total         112m
setup allowance 5m
required      117m
```

The current 120-minute GitHub job deadline remains sufficient, so no workflow change is currently required.

## Proof discipline

This is a behavioral timeout-contract correction. Use a fresh test-author context before production changes.

Meaningful RED:

```text
artifact is included in the Playwright-backed timeout population
→ expected derived 17-minute timeout
→ current production returns fixed 8-minute timeout
```

The implementation context then changes only the minimum production timeout assignment needed to satisfy the accepted proof.

Do not manufacture additional release ownership or CI topology changes.

## Remaining order

```text
1. fresh test-author correction for artifact timeout classification
2. minimal scripts/verify.ts implementation correction
3. focused verifier unit proof + type-check if useful
4. architect reviews the exact correction and recalculated 120-minute envelope
5. remove resolved scripts/REVIEW.md
6. refresh verify-modernization.md / PR description to closed state
7. require exact-head verification-release + aggregate verify CI
8. if autofix changes head, review the new exact head and its CI
9. record actual CI critical path / merge latency
10. merge-readiness verdict
11. squash merge only after the exact-head automatic gate is healthy
```

## PR / version policy

PR #216 remains an ordinary internal verification/tooling refactor into `develop` with release intent:

```text
version:patch
```

Same-repository CI owns materialization of the exact `package.json` PATCH version.

## Exact-head rule

The exact PR head is authoritative. Any new review/correction/autofix commit invalidates earlier CI as a merge gate.

## Stop rule

After this blocker is closed, final semantic review remains clean, and exact-head CI succeeds, stop verifier infrastructure modernization. Further jobs, sharding, cross-job artifacts, generic dependency graphs, task runners, universal registries, or speculative optimization require a separate measured need and architecture decision.
