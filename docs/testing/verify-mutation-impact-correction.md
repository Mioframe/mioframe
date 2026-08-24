# Verify mutation-impact correction

Status: **agent-ready final B2 follow-up; declarative ownership accepted, one rule-semantic mismatch remains**.

This document is the implementation contract for the remaining B2 correction in PR #216.

## Accepted current state

The mutation correction has already established and must preserve:

- canonical deleted/rename-old changed identity reaches `resolveMutationPlan(changedFiles)`;
- real Vitest-owned `.test.mjs` paths are accepted and `.test.ts` paths outside Vitest discovery are rejected;
- `vitest.config.ts` and `scripts/lib/vitestTestPaths.ts` are mutation execution-semantic owners;
- `scripts/lib/vitestTestPaths.ts` is full-unit infrastructure;
- `vitest.config.ts`, `unitRisk.ts`, and `mutationTargets.ts` consume the shared Vitest owner;
- the seven `MUTATION_TARGETS` and Stryker mutate surface are unchanged;
- `tsconfig.node.json` includes the shared owner because `vitest.config.ts` imports it;
- one declarative `VITEST_INCLUDE_RULES` / `VITEST_EXCLUDE_RULES` population now drives both exported globs and planner predicate behavior.

Do not reopen those decisions.

## Remaining blocker

The declarative structure is correct, but one rule kind does not implement the same semantics it renders.

Current `rootPrefixSuffix` behavior:

```text
rule data
prefix = "playwright."
suffix = ".test.ts"

ruleToGlob
→ playwright.*.test.ts

ruleMatches
→ wildcard middle must be non-empty and slash-free
```

The rendered glob uses `*`, whose wildcard semantics are zero-or-more non-separator characters. Therefore the glob accepts a zero-length middle such as:

```text
playwright..test.ts
```

while the current `ruleMatches()` rejects it because of `middle.length > 0`.

This leaves config-facing discovery and planner-facing ownership semantically different despite sharing the same rule data.

## Required final state

Keep the existing public API and declarative rule population.

```ts
VITEST_TEST_INCLUDE;
VITEST_TEST_EXCLUDE;
isVitestOwnedTestPath(filePath);
```

Every `DiscoveryRule` kind must have matching semantics equivalent to the glob syntax produced by `ruleToGlob()`.

For `rootPrefixSuffix` specifically:

- zero-length wildcard content must be allowed because the generated glob uses `*`;
- `/` must remain forbidden because a single `*` does not cross path separators;
- `VITEST_TEST_INCLUDE` must remain exactly `playwright.*.test.ts` for this rule;
- do not replace the rule with a second special-case predicate or change the glob contract merely to preserve the previous non-empty implementation detail.

The source of truth remains:

```text
one local discovery rule population
├─ ruleToGlob(rule)
└─ ruleMatches(rule, path)
```

with the two derivations semantically equivalent for every supported rule kind.

## Scope

Production:

```text
scripts/lib/vitestTestPaths.ts
```

Proof:

```text
scripts/lib/vitestTestPaths.test.ts
```

Other existing mutation/unit/verifier tests remain regression proof and should not require expectation changes.

Because the remaining defect is observable behavior at a wildcard boundary, add the smallest test-first regression proof before production implementation:

```text
isVitestOwnedTestPath('playwright..test.ts') === true
```

Oracle: the exported include glob `playwright.*.test.ts` and standard `*` zero-or-more, non-separator semantics.

The RED must fail specifically because current `ruleMatches(rootPrefixSuffix)` requires `middle.length > 0`.

## Acceptance criteria

- `VITEST_INCLUDE_RULES` / `VITEST_EXCLUDE_RULES` remain the single declarative population;
- exported include/exclude glob values and order remain unchanged;
- `rootPrefixSuffix` matcher semantics equal the `*` glob it renders;
- `playwright..test.ts` is classified consistently with `playwright.*.test.ts`;
- slash-containing middle content remains rejected;
- all existing positive/negative path classifications remain unchanged except the previously inconsistent zero-length wildcard boundary;
- no independent discovery special case is introduced;
- no changes to `vitest.config.ts`, `unitRisk.ts`, `mutationTargets.ts`, `verify.ts`, Stryker config, mutation targets, release planning, CI, timeouts, locks, or verifier output.

## Verification

First demonstrate focused RED, then GREEN:

```bash
pnpm verify --only unit-tests --files scripts/lib/vitestTestPaths.test.ts
```

Then run the existing B2 regression scope:

```bash
pnpm verify --only unit-tests --files \
  scripts/lib/vitestTestPaths.test.ts \
  scripts/lib/mutationTargets.test.ts \
  scripts/lib/unitRisk.test.ts \
  scripts/verify.test.ts

pnpm verify --only type-check
pnpm verify --only oxlint --files scripts/lib/vitestTestPaths.ts scripts/lib/vitestTestPaths.test.ts
```

Exact-head CI and B2 semantic closure remain architect-owned.

## Forbidden

- release-impact/release-execution work;
- changing exported Vitest glob strings or order;
- changing `vitest.config.ts`, `unitRisk.ts`, `mutationTargets.ts`, `verify.ts`, Stryker config, or mutation targets;
- adding a dependency or generic glob engine/framework;
- reintroducing an independent matcher/special-case copy of discovery semantics;
- weakening or deleting existing B2 regression proof;
- direct Git/GitHub lifecycle operations from the coding context.
