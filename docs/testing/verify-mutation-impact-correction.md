# Verify mutation-impact correction

Status: **implementation landed; architect re-review blocked on one remaining source-of-truth defect**.

This document owns the mutation correction discovered during PR #216 review.

## Accepted final architecture

### Canonical changed identity

Mutation planning stays identity-based:

```text
getChangedFileProjection(...)
→ buildCommands(changedFiles)
→ resolveMutationPlan(changedFiles)
```

`existingChangedFiles` is only for checks that require current-tree files, such as format/lint. Deleted paths and rename old-side identities must reach mutation planning.

### Shared Vitest test-path owner

One narrow module owns Vitest test-file discovery shape:

```text
scripts/lib/vitestTestPaths.ts
```

Public contract:

```ts
VITEST_TEST_INCLUDE;
VITEST_TEST_EXCLUDE;
isVitestOwnedTestPath(filePath);
```

Current include shapes:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

Current exclusions:

```text
tests/e2e/**/*.spec.ts
node_modules/**
.*/**
```

Consumers:

```text
vitest.config.ts
→ VITEST_TEST_INCLUDE / VITEST_TEST_EXCLUDE

scripts/lib/unitRisk.ts
scripts/lib/mutationTargets.ts
→ isVitestOwnedTestPath
```

The include/exclude exports and predicate must be mechanically derived from **one local rule population**. Merely placing independent glob arrays and an independently hard-coded predicate in the same file is not sufficient: the representations can still drift when Vitest discovery changes.

Do not import `vitest.config.ts` into planners and do not introduce a generic test-discovery framework.

### Ownership of the shared contract

`scripts/lib/vitestTestPaths.ts` is full-unit infrastructure.

Mutation execution-semantic paths are:

```text
stryker.config.mjs
scripts/lib/mutationTargets.ts
vitest.config.ts
scripts/lib/vitestTestPaths.ts
```

A change to any of them selects all registered mutation targets after registry validation.

The seven existing `MUTATION_TARGETS` entries and Stryker `mutate` derivation remain unchanged.

## Architect re-review

Accepted on the current implementation:

- `buildCommands()` passes canonical `changedFiles` directly to `resolveMutationPlan()`;
- deletion and rename-old-side `stryker.config.mjs` are covered at the orchestration boundary;
- mutation registry validation accepts real Vitest-owned `.test.mjs` and rejects `.test.ts` outside configured roots;
- `vitest.config.ts` consumes shared include/exclude exports;
- `unitRisk.ts` and `mutationTargets.ts` consume the shared predicate;
- `vitest.config.ts` and `scripts/lib/vitestTestPaths.ts` are mutation semantic-change owners;
- `scripts/lib/vitestTestPaths.ts` is full-unit infrastructure;
- seven mutation targets and Stryker mutate surface are unchanged;
- `tsconfig.node.json` includes the new module because `vitest.config.ts` imports it through the Node TypeScript project.

### Remaining blocker

Current `scripts/lib/vitestTestPaths.ts` still defines the same discovery contract twice:

1. `VITEST_TEST_INCLUDE` / `VITEST_TEST_EXCLUDE` glob arrays;
2. separate imperative prefix/suffix/regex branches in `isVitestOwnedTestPath()`.

The tests assert the arrays and representative predicate outcomes independently, so green tests do not establish that a future discovery-rule edit cannot update one representation without the other.

Required final state: one explicit local rule population must drive both exported glob lists and `isVitestOwnedTestPath()`. Keep this local and narrow. Do not add a general glob engine, generic registry, or cross-lane abstraction solely for this correction.

The simplest acceptable shape is a small declarative local rule population from which the existing public exports and predicate are derived. Exact implementation spelling is not prescribed.

## Proof and correction scope

This remaining correction is behavior-preserving. Existing tests already own the current observable include/exclude and path-classification contract, so a new RED phase is not required.

Expected production scope:

```text
scripts/lib/vitestTestPaths.ts
```

`scripts/lib/vitestTestPaths.test.ts` should remain behaviorally unchanged unless an independent test-author review finds a real proof defect. Do not modify `unitRisk.ts`, `mutationTargets.ts`, `verify.ts`, `vitest.config.ts`, Stryker configuration, release code, or CI topology unless new repository evidence proves the narrow refactor cannot satisfy the accepted architecture.

## Acceptance criteria

- one local rule population mechanically owns both Vitest glob exports and path classification;
- all current include/exclude values remain unchanged;
- all current positive/negative path behavior remains unchanged;
- canonical mutation changed-identity handling remains unchanged;
- mutation semantic-change ownership remains unchanged;
- full-unit ownership remains unchanged;
- seven mutation targets and Stryker mutate surface remain unchanged;
- no generic test-discovery framework or new speculative infrastructure is introduced.

## Focused verification

Use only the smallest useful feedback for this local refactor, for example:

```bash
pnpm verify --only unit-tests --files scripts/lib/vitestTestPaths.ts scripts/lib/vitestTestPaths.test.ts
pnpm verify --only type-check
pnpm verify --only oxlint --files scripts/lib/vitestTestPaths.ts
```

Exact-head CI and PR-wide review remain architect-owned.

## Forbidden

- independent duplicated glob and predicate ownership inside `vitestTestPaths.ts`;
- changing the current Vitest discovery contract;
- changing mutation target population or Stryker semantics;
- changing unit impact semantics;
- another Git/status model;
- generic test registry/discovery framework;
- release-impact/release-execution changes in this correction;
- CI topology, timeout, threshold, lock, or verifier-output changes.
