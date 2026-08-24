# Verify mutation-impact correction

Status: **agent-ready follow-up; original mutation behavior correction accepted, source-of-truth correction pending**.

This document is the implementation contract for the remaining B2 correction in PR #216.

## Accepted current state

The previous mutation pass correctly established:

- canonical deleted/rename-old changed identity reaches `resolveMutationPlan(changedFiles)`;
- real Vitest-owned `.test.mjs` paths are accepted and `.test.ts` paths outside Vitest discovery are rejected;
- `vitest.config.ts` and `scripts/lib/vitestTestPaths.ts` are mutation execution-semantic owners;
- `scripts/lib/vitestTestPaths.ts` is full-unit infrastructure;
- `vitest.config.ts`, `unitRisk.ts`, and `mutationTargets.ts` consume the shared Vitest owner;
- the seven `MUTATION_TARGETS` and Stryker mutate surface are unchanged;
- `tsconfig.node.json` includes the shared owner because `vitest.config.ts` imports it.

Do not reopen those decisions in this follow-up.

## Remaining blocker

`scripts/lib/vitestTestPaths.ts` still represents the same Vitest discovery contract twice:

1. `VITEST_TEST_INCLUDE` / `VITEST_TEST_EXCLUDE` contain glob strings used by `vitest.config.ts`;
2. `isVitestOwnedTestPath()` separately hard-codes equivalent prefix/suffix/regex logic used by `unitRisk.ts` and `mutationTargets.ts`.

Those representations can drift independently. Moving them into one file is not enough: the accepted architecture requires the public glob arrays and predicate to be mechanically derived from one local rule population.

## Required final state

Keep the existing public API:

```ts
VITEST_TEST_INCLUDE;
VITEST_TEST_EXCLUDE;
isVitestOwnedTestPath(filePath);
```

Inside `scripts/lib/vitestTestPaths.ts`, introduce one narrow declarative discovery-rule population that is the only owner of the current include/exclude semantics.

The rule population must represent the current contracts semantically, not as a second copied predicate. A small closed set of local rule kinds is sufficient, for example:

```text
recursive root + suffix
root-level prefix + suffix
exact root file
recursive root exclusion
root dot-directory exclusion
```

Both surfaces must be derived from that same population:

```text
one local Vitest discovery rule population
├─ derive VITEST_TEST_INCLUDE / VITEST_TEST_EXCLUDE
└─ derive isVitestOwnedTestPath(filePath)
```

Current include semantics must remain exactly:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

Current exclude semantics must remain exactly:

```text
tests/e2e/**/*.spec.ts
node_modules/**
.*/**
```

`isVitestOwnedTestPath()` must evaluate inclusion and exclusion from those same rules; no manually duplicated include/exclude branch list may remain.

### Simpler alternative rejected

Keeping the glob arrays plus a separate hand-written predicate and relying on representative tests is insufficient: tests can remain green when a future glob is added but the predicate is not updated.

Do not solve this by adding a dependency or generic glob/discovery framework. The current contract is small and fixed enough for a narrow local rule model.

## Scope

Production change:

```text
scripts/lib/vitestTestPaths.ts
```

Read-only behavioral proof:

```text
scripts/lib/vitestTestPaths.test.ts
scripts/lib/mutationTargets.test.ts
scripts/lib/unitRisk.test.ts
scripts/verify.test.ts
```

No new test-author pass or RED phase is required. This is a behavior-preserving source-of-truth refactor and the accepted behavioral proof already covers the required outputs.

If the implementation cannot preserve the existing public behavior without changing accepted test expectations, stop and return the conflict instead of editing the tests.

## Acceptance criteria

- exactly one local declarative population owns Vitest discovery semantics;
- `VITEST_TEST_INCLUDE` is mechanically derived from that population;
- `VITEST_TEST_EXCLUDE` is mechanically derived from that population;
- `isVitestOwnedTestPath()` is mechanically derived from the same population;
- no independent prefix/suffix/regex copy of the include/exclude contract remains;
- all current include/exclude values remain unchanged;
- all existing positive/negative path classifications remain unchanged;
- public exports remain unchanged;
- `vitest.config.ts`, `unitRisk.ts`, and `mutationTargets.ts` require no behavioral change;
- no mutation, unit, Stryker, release, verifier-output, timeout, lock, CI, or package/dependency semantics change.

## Verification

Run the existing focused behavioral proof without modifying its expectations:

```bash
pnpm verify --only unit-tests --files \
  scripts/lib/vitestTestPaths.test.ts \
  scripts/lib/mutationTargets.test.ts \
  scripts/lib/unitRisk.test.ts \
  scripts/verify.test.ts

pnpm verify --only type-check
pnpm verify --only oxlint --files scripts/lib/vitestTestPaths.ts
```

Exact-head CI and semantic closure remain architect-owned.

## Forbidden

- editing release-impact/release execution code;
- changing `vitest.config.ts`, `unitRisk.ts`, `mutationTargets.ts`, `verify.ts`, Stryker config, or mutation targets for this follow-up unless the accepted contract is proven impossible and returned to the architect;
- changing accepted test expectations/assertions;
- adding a new dependency or generic glob engine/framework;
- retaining a separate imperative copy of Vitest include/exclude semantics;
- broadening or narrowing current Vitest discovery;
- changing mutation/unit ownership behavior, Stryker thresholds/mutate surface, CI topology, verifier timeout/lock/output behavior;
- direct Git/GitHub lifecycle operations from the coding context.
