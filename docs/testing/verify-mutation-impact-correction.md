# Verify mutation-impact correction

Status: **architecture resolved; implementation pending after full PR review finding**.

This document owns the mutation correction discovered during the PR #216 semantic review. `docs/testing/verify-target-architecture.md` remains the wider verifier target and `docs/testing/architecture.md` remains canonical testing policy.

## Goal

Preserve the existing explicit high-risk mutation registry while fixing two ownership failures:

1. mutation planning must receive canonical changed-path identity for deleted and renamed paths instead of only current-tree files;
2. mutation registry validation must use the real Vitest-owned test contract instead of a local `.test.ts` suffix heuristic.

Do not redesign mutation testing, add adjacency inference, or introduce a generic planner/test-discovery framework.

## Retained mutation architecture

Keep the accepted model:

```text
changed registered source
or changed registered owning test
→ focused mutation of the exact registered source

mutation registry / mutation execution config change
→ all registered targets or invalid

unregistered change
→ skip

invalid registry
→ invalid
```

`MUTATION_TARGETS` remains the single explicit high-risk target registry consumed by verifier planning and `stryker.config.mjs`. Stryker continues to derive `mutate` from this registry and may keep `vitest.related: true`.

## Finding A — canonical changed identity is filtered away before mutation planning

`scripts/lib/changedPaths.ts` already owns Git status and its flat projection preserves the identities mutation planning needs:

- deleted path remains present;
- rename projects both `oldPath` and `newPath`.

Mutation planning itself does not need to distinguish `added` from `modified` or inspect Git history. Its decisions are identity-based: an exact registry/config path, registered source, or registered owning test either appears in the changed identity set or does not.

The defect is therefore orchestration, not the mutation resolver API. `buildCommands()` currently computes:

```text
existingChangedFiles = changedFiles.filter(fileExists)
```

and passes `existingChangedFiles` to `resolveMutationPlan()`. This drops deleted paths and the old side of a rename after `changedPaths.ts` already preserved them.

### Architecture decision

Keep `resolveMutationPlan(changedFiles: readonly string[])` identity-based.

Pass the canonical flat `changedFiles` projection directly to the mutation planner:

```text
getChangedFileProjection(scope)
→ buildCommands(changedFiles)
→ resolveMutationPlan(changedFiles)
```

`existingChangedFiles` remains valid only for owners that require a current filesystem file, such as focused format/lint input lists. It must not gate mutation ownership.

This is simpler than adding a second status-aware mutation API because no current mutation decision depends on the status value once canonical old/new identity has been preserved.

### Required status behavior

At the real orchestration boundary:

- deleted `stryker.config.mjs` → all registered mutation targets or invalid, never skip;
- rename old side `stryker.config.mjs` → all registered mutation targets or invalid, never skip;
- deleted registered source/test that remains in the resulting registry → registry validation invalid because the configured owner no longer exists;
- source/test rename accompanied by a valid registry update → the changed registry itself selects all registered targets, while the resulting registry validates current-tree ownership.

Do not reconstruct Git status in `mutationTargets.ts`.

## Finding B — mutation registry has a false Vitest ownership heuristic

Current `validateMutationRegistry()` treats any path ending in `.test.ts` as Vitest-owned. That diverges from the real repository configuration.

The current Vitest include contract contains:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

and excludes Playwright `tests/e2e/**/*.spec.ts`.

A real example is `scripts/agentEnvironment.test.mjs`, which is Vitest-owned but the current mutation validator would reject. Conversely, an arbitrary existing `.test.ts` outside the configured roots can be accepted by the current validator even though Vitest will not discover it.

`unitRisk.ts` already contains an independently implemented copy of this same test-path contract. Adding a corrected second copy to `mutationTargets.ts` would retain two mutable sources of truth and repeat the drift that caused this finding.

## Architecture decision — one narrow Vitest test-path owner

Introduce one small tool-owned module:

```text
scripts/lib/vitestTestPaths.ts
```

It owns only the repository's Vitest **test file path/discovery shape**, not unit impact, test execution, or dependency resolution.

The module should expose the minimum shared contract needed by current consumers, conceptually:

```ts
export const VITEST_TEST_INCLUDE: readonly string[];
export function isVitestOwnedTestPath(filePath: string): boolean;
```

The include globs and predicate must derive from one local rule definition so they cannot drift independently.

Consumers:

```text
vitest.config.ts
→ uses VITEST_TEST_INCLUDE for test.include

scripts/lib/unitRisk.ts
→ uses isVitestOwnedTestPath instead of its private duplicate test-shape logic

scripts/lib/mutationTargets.ts
→ uses isVitestOwnedTestPath for registry validation
```

This is a justified shared low-level contract because the same real Vitest discovery rule already has multiple current consumers. It is deliberately narrower than a generic test registry or proof taxonomy.

Do not import the full `vitest.config.ts` into planners; that would couple impact planning to Vite/Vue config initialization instead of sharing the small stable path contract.

## Ownership of the shared Vitest contract

The new shared path owner changes verification semantics itself and therefore must not become an unowned helper.

### Unit

`scripts/lib/vitestTestPaths.ts` is global Vitest discovery infrastructure. A change to it must select **full unit** just like `vitest.config.ts`.

`unitRisk.ts` must keep the existing exact/direct/related/file-as-data/scan/status behavior unchanged apart from replacing its duplicate test-path predicate with the shared owner.

### Mutation

Mutation execution uses `stryker.config.mjs` with:

```text
testRunner: vitest
vitest.configFile: vitest.config.ts
vitest.related: true
```

Therefore the mutation execution semantic-change set must include:

```text
stryker.config.mjs
scripts/lib/mutationTargets.ts
vitest.config.ts
scripts/lib/vitestTestPaths.ts
```

A change to any of these selects all registered mutation targets after registry validation, never silent skip.

Do not broaden this into every unit-test helper/config file. These four paths are confirmed mutation registry/execution owners.

## Independent proof

Use a fresh dedicated test-author context before production edits.

Primary proof owners:

```text
scripts/lib/mutationTargets.test.ts
scripts/verify.test.ts
```

If the shared Vitest path owner needs direct proof, add the smallest focused unit proof for that module rather than duplicating the same cases in every consumer test.

### Required RED / failure sensitivity

Meaningful pre-fix failures must cover both defects.

At `buildCommands → resolveMutationPlan` integration:

```text
deleted stryker.config.mjs
→ mutation run for all registered sources (or invalid), not skip

rename with oldPath = stryker.config.mjs
→ same
```

Use `resolveVerifyChangedPathContext()`'s existing test seams / canonical projection to construct the deletion/rename scope. Do not prove only `resolveMutationPlan(['stryker.config.mjs'])`; that already passes and misses the orchestration defect.

Vitest ownership:

```text
scripts/agentEnvironment.test.mjs
→ accepted as Vitest-owned when used as a registry owner test

an existing/synthetic *.test.ts outside the real Vitest include roots
→ rejected as non-Vitest-owned
```

Also prove:

```text
vitest.config.ts
scripts/lib/vitestTestPaths.ts
→ mutation full/all registered targets
```

The real existing `MUTATION_TARGETS` registry must remain valid and unchanged unless independent repository evidence shows one of its seven current owners is wrong.

## Minimum implementation scope

Expected production/config owners:

```text
scripts/verify.ts
scripts/lib/mutationTargets.ts
scripts/lib/unitRisk.ts
scripts/lib/vitestTestPaths.ts
vitest.config.ts
```

Expected focused proof owners:

```text
scripts/verify.test.ts
scripts/lib/mutationTargets.test.ts
plus one narrow shared-path-contract test only if needed
```

The correction must not change the seven audited mutation targets, Stryker thresholds/concurrency/mutator settings, mutation timeout, CI topology, or unit dependency-selection architecture.

## Forbidden

Do not:

- add a second Git/status parser;
- add status fields to mutation planning when canonical flat identity is sufficient;
- keep or add a local suffix-only Vitest ownership heuristic;
- copy the Vitest include rules separately into unitRisk and mutationTargets;
- infer mutation targets from source/test adjacency;
- broaden mutation execution changes to arbitrary `scripts/**`, `config/**`, or all test files;
- add a generic test registry, dependency graph, or cross-lane planner abstraction;
- weaken registry existence/uniqueness/reason validation;
- change the seven current mutation target entries merely to make tests pass.

## Acceptance criteria

The mutation correction is complete only when:

1. canonical deleted and rename-old path identity reaches mutation planning without current-tree filtering;
2. deletion/rename of `stryker.config.mjs` cannot silently skip mutation at the `buildCommands` integration boundary;
3. mutation registry validation and Vitest config share one test-path contract;
4. real `.test.mjs` Vitest owners are accepted;
5. `.test.ts` outside real Vitest discovery is rejected;
6. `vitest.config.ts` and the shared Vitest test-path owner select all registered mutation targets as execution-semantic changes;
7. the shared Vitest test-path owner selects full unit as global unit discovery infrastructure;
8. existing unit-impact behavior remains otherwise unchanged;
9. the seven audited mutation targets and Stryker mutate surface remain unchanged and in agreement;
10. no adjacency inference, generic registry/graph, broad directory fallback, or second Git/status owner is introduced;
11. architect re-reviews the full mutation boundary after implementation, including orchestration and the actual Vitest config contract.
