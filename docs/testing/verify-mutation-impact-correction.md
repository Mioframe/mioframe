# Verify mutation-impact correction

Status: **agent-ready; independent test-author pass required before implementation**.

This document is the implementation contract for the mutation correction in PR #216.

## Problem

Two ownership defects remain:

1. `buildCommands()` passes `existingChangedFiles` to `resolveMutationPlan()`, so deleted paths and the old side of renames disappear after `changedPaths.ts` already preserved them;
2. `validateMutationRegistry()` uses a local `*.test.ts` heuristic instead of the real Vitest test-discovery contract.

A third consequence belongs to the same defect: `stryker.config.mjs` executes Vitest through `vitest.config.ts`, so changes to Vitest discovery configuration are mutation-execution semantic changes and must never silently skip mutation.

## Required final state

### Canonical changed identity

Keep `resolveMutationPlan()` identity-based. Do not add another Git/status model.

```text
getChangedFileProjection(...)
→ buildCommands(changedFiles)
→ resolveMutationPlan(changedFiles)
```

`existingChangedFiles` remains only for checks that require current filesystem files, such as format/lint.

Required behavior:

```text
deleted stryker.config.mjs
→ all registered mutation targets or invalid

rename oldPath = stryker.config.mjs
→ all registered mutation targets or invalid
```

A deleted registered source/test that still exists in the resulting registry must remain `invalid` because registry validation checks the current tree.

### One Vitest test-path owner

Create:

```text
scripts/lib/vitestTestPaths.ts
```

It owns only Vitest test-file discovery shape. It must expose the minimum shared contract used by current consumers:

```ts
VITEST_TEST_INCLUDE;
VITEST_TEST_EXCLUDE;
isVitestOwnedTestPath(filePath);
```

The include/exclude constants and predicate must come from one local rule definition, not three copied heuristics.

Current Vitest-owned test shapes are:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

Current exclusions remain:

```text
tests/e2e/**/*.spec.ts
node_modules/**
.*/**
```

Consumers:

```text
vitest.config.ts
→ use VITEST_TEST_INCLUDE / VITEST_TEST_EXCLUDE

scripts/lib/unitRisk.ts
→ use isVitestOwnedTestPath

scripts/lib/mutationTargets.ts
→ use isVitestOwnedTestPath
```

Do not import `vitest.config.ts` into planners.

### Ownership of the shared contract

`scripts/lib/vitestTestPaths.ts` is full-unit infrastructure.

Mutation semantic-change paths are exactly:

```text
stryker.config.mjs
scripts/lib/mutationTargets.ts
vitest.config.ts
scripts/lib/vitestTestPaths.ts
```

A change to any of them selects all registered mutation targets after registry validation.

Keep the seven existing `MUTATION_TARGETS` entries and Stryker `mutate` derivation unchanged.

## TEST IMPACT

### 1. Changed identity at orchestration boundary

Primary proof: `scripts/verify.test.ts`.

Oracle: canonical changed-path contract in `changedPaths.ts` and mutation acceptance in `verify-target-architecture.md`.

Must reject: deleted/renamed-away `stryker.config.mjs` becomes mutation `skip` because current-tree existence filtering erased its identity.

RED required. Construct deletion and rename through `resolveVerifyChangedPathContext()` test seams, then pass the resulting `changedFiles` into `buildCommands()`. Direct `resolveMutationPlan(['stryker.config.mjs'])` is insufficient.

### 2. Real Vitest ownership

Primary proof: `scripts/lib/vitestTestPaths.test.ts` and `scripts/lib/mutationTargets.test.ts`.

Oracle: current `vitest.config.ts` discovery contract.

Must reject:

```text
scripts/agentEnvironment.test.mjs
→ rejected as non-Vitest-owned

some/path/outside/configured/roots/example.test.ts
→ accepted only because it ends with .test.ts
```

RED required. Missing `vitestTestPaths.ts` is an acceptable new-API red for its focused test file; the mutation-registry proof must independently demonstrate the existing heuristic defect.

### 3. New shared owner is itself owned

Primary proof: `scripts/lib/unitRisk.test.ts` and `scripts/lib/mutationTargets.test.ts`.

Must reject:

```text
scripts/lib/vitestTestPaths.ts change
→ focused/skip unit instead of full unit

vitest.config.ts or scripts/lib/vitestTestPaths.ts change
→ mutation skip/focused instead of all registered targets
```

RED required where current behavior is observable before production edits.

## Pass order

### Pass 1 — fresh test-author context

May change only:

```text
scripts/lib/vitestTestPaths.test.ts   # new
scripts/lib/mutationTargets.test.ts
scripts/lib/unitRisk.test.ts
scripts/verify.test.ts
```

Requirements:

- author the proofs above from the accepted contract;
- demonstrate meaningful RED for both ownership defects;
- do not edit production code;
- do not weaken existing mutation/unit assertions.

### Pass 2 — separate implementation context

Treat accepted test expectations/assertions as read-only.

May change only:

```text
scripts/lib/vitestTestPaths.ts        # new
vitest.config.ts
scripts/lib/unitRisk.ts
scripts/lib/mutationTargets.ts
scripts/verify.ts
```

Minimum implementation:

1. add the narrow shared Vitest path owner;
2. switch `vitest.config.ts`, `unitRisk.ts`, and `mutationTargets.ts` to it;
3. pass canonical `changedFiles` to `resolveMutationPlan()`;
4. add `vitest.config.ts` and `scripts/lib/vitestTestPaths.ts` to mutation semantic-change ownership;
5. remove replaced private Vitest test-shape logic.

If an accepted test appears wrong, stop and return the conflict; do not edit it from the implementation pass.

## Acceptance criteria

- deleted `stryker.config.mjs` cannot silently skip mutation;
- rename old-side `stryker.config.mjs` cannot silently skip mutation;
- real Vitest-owned `.test.mjs` is accepted;
- `.test.ts` outside configured Vitest roots is rejected;
- `vitest.config.ts` and `scripts/lib/vitestTestPaths.ts` select all registered mutation targets;
- `scripts/lib/vitestTestPaths.ts` selects full unit;
- one shared Vitest discovery owner replaces private duplicate heuristics;
- seven mutation targets and Stryker mutate surface remain unchanged;
- existing unit related/file-as-data/scan/status semantics remain unchanged;
- no mutation timeout, thresholds, CI topology, release planning, or release execution changes.

## Focused verification

Test-author RED/implementation GREEN should use the smallest relevant verifier-managed unit scope, for example:

```bash
pnpm verify --only unit-tests --files \
  scripts/lib/vitestTestPaths.test.ts \
  scripts/lib/mutationTargets.test.ts \
  scripts/lib/unitRisk.test.ts \
  scripts/verify.test.ts
```

After implementation, also run when useful:

```bash
pnpm verify --only type-check
pnpm verify --only oxlint --files \
  scripts/lib/vitestTestPaths.ts \
  scripts/lib/mutationTargets.ts \
  scripts/lib/unitRisk.ts \
  scripts/verify.ts \
  vitest.config.ts
```

Exact-head CI and PR-wide review remain architect-owned.

## Forbidden

- editing release-impact/release execution code in this pass;
- adding a second Git/status parser or status-bearing mutation planner API;
- retaining/copying another private Vitest test-shape heuristic;
- importing full `vitest.config.ts` into planners;
- generic test registry/discovery framework;
- adjacency-based mutation ownership;
- changing the seven audited mutation targets without new independent repository evidence;
- changing Stryker thresholds, timeout, `vitest.related`, CI topology, verifier timeout/lock/output behavior;
- implementation-agent edits to accepted test expectations/assertions;
- Git/GitHub lifecycle operations from coding/test-author contexts.
