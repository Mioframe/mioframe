---
name: mutation-testing
description: 'Use to design or run narrow mutation audits for registered high-risk deterministic logic after focused tests pass. Never use as a general coverage target or UI proof.'
---

# Mutation testing workflow

Follow `docs/testing/architecture.md`. Mutation testing audits the strength of already-passing focused deterministic tests. It is supplemental evidence, not the primary proof for new behavior.

## Activation

A deliberate mutation audit is appropriate only when all conditions are true:

1. high-risk deterministic domain, service, storage, CRDT, validation, migration, normalization, filtering, sorting, matching, or transformation logic changed;
2. focused tests own that exact behavior and already pass;
3. a narrow source/test scope exists;
4. meaningful survived mutants could reveal an unprotected accepted outcome rather than framework, UI, or equivalent implementation detail.

Do not use mutation testing for ordinary UI behavior, documentation, type-only edits, mechanical refactors, or unchanged tests.

## Durable automatic ownership

The target `verify` architecture automatically selects mutation only from persistent registered targets.

A target records:

- a unique name;
- exact high-risk source files;
- exact owning focused test files;
- a concrete risk reason.

Register a target only when repeated merge protection justifies automatic cost. Updating, moving, renaming, or deleting registered source/tests updates the target in the same change.

Do not use broad prefixes initially. Do not infer semantic applicability from sibling files or agent prose.

Until the persistent registry is implemented and validated, current final verification may still run legacy sibling-derived mutation scope. Treat that as a migration constraint, not as the target policy.

## Workflow

1. Run focused `unit-tests` and confirm they pass.
2. Confirm the source/test pair is an existing registered target or a deliberate focused audit required by the task.
3. Select the narrowest exact source/test paths.
4. Run the mutation audit.
5. Inspect survived, no-coverage, timeout, and runner failures.
6. Strengthen tests only when a meaningful mutant exposes a missing accepted outcome or boundary.
7. Do not change production behavior merely to kill a mutant.
8. Rerun focused tests and the same mutation scope after test changes.
9. Run final verification.

## Commands

```bash
pnpm verify --only unit-tests --files <source-or-test-paths...>
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

Do not bypass an empty or unrelated scope with a broad Stryker glob. A full mutation run is diagnostic only when explicitly requested or required by a named repository policy.

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
- unchanged focused tests used only to raise a score;
- broad source scopes without a named repository policy;
- automatic applicability inferred only from location or sibling tests;
- automatic applicability dependent on `TEST IMPACT` text;
- production changes or brittle assertions made only to improve mutation score;
- replacing focused tests, type-checking, linting, browser proof, or final verification.
