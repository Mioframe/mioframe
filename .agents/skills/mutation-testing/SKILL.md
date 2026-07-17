---
name: mutation-testing
description: 'Use explicitly after changed focused tests pass for high-risk pure, domain, service, storage, CRDT, validation, migration, filtering, sorting, matching, or transformation logic. Never use as an automatic general gate or UI target.'
---

# Mutation testing workflow

Follow `docs/testing/architecture.md`. Mutation testing audits the strength of already-passing focused tests. It is not a proof type for new behavior, a coverage target, or an automatic requirement based on file paths.

## Activation

Use only when all conditions are true:

1. high-risk pure/domain/service/storage/CRDT/validation/migration/normalization/filtering/sorting/matching/transformation logic changed;
2. focused tests were added or changed for that exact behavior;
3. those tests already pass;
4. a narrow source scope can be selected;
5. survived mutants could reveal missing accepted behavior rather than framework, UI, or equivalent implementation detail.

If any condition is false, mark mutation `not applicable` in `TEST IMPACT`.

## Workflow

1. Run focused `unit-tests` and confirm they pass.
2. Select the narrowest changed source/test paths.
3. Run the explicit mutation audit.
4. Inspect survived, no-coverage, timeout, and runner failures.
5. Strengthen tests only when a meaningful mutant exposes a missing accepted outcome or boundary.
6. Do not change production behavior merely to kill a mutant.
7. Rerun focused tests and the same mutation scope after test changes.
8. Run final verification.

## Commands

```bash
pnpm verify --only unit-tests --files <source-or-test-paths...>
pnpm verify --only mutation --files <source-or-test-paths...>
```

Do not bypass an empty or unrelated scope with a broad Stryker glob. A full mutation run is diagnostic only when explicitly requested or required by a named high-risk merge policy.

## Results

- `Killed`: selected tests rejected the mutation.
- `Survived`: selected tests did not reject the changed behavior.
- `No coverage`: no selected test executed the mutated code.
- `Timeout` or runner failure: execution must be investigated before conclusions.

Mutation score alone is not an acceptance criterion.

For equivalent or irrelevant mutants, record why no distinct accepted behavior is missing. Do not add implementation-detail assertions or disable comments without an established project reason.

## Forbidden

- UI component behavior or Playwright-only flows;
- behavior-preserving refactors, type-only edits, formatting, comments, renames, or documentation;
- unchanged focused tests;
- broad source scopes;
- automatic applicability inferred from location or sibling tests;
- production changes or brittle assertions made only to improve mutation score;
- replacing focused tests, type-checking, linting, browser proof, or final verification.
