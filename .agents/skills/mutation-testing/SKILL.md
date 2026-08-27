---
name: mutation-testing
description: 'Use to design or run narrow mutation audits for registered high-risk deterministic logic after focused tests pass. Never use as a general coverage target or UI proof.'
---

# Mutation testing workflow

Follow `docs/testing/architecture.md`. Mutation testing audits the strength of already-passing focused deterministic tests. It is supplemental evidence, not primary proof for new behavior.

## Activation

A deliberate mutation audit is appropriate only when all conditions are true:

1. high-risk deterministic domain, service, storage, CRDT, validation, migration, normalization, filtering, sorting, matching, or transformation logic changed;
2. focused tests own that exact behavior and already pass;
3. a narrow source/test scope exists;
4. meaningful survived mutants could reveal an unprotected accepted outcome rather than framework, UI, or equivalent implementation detail.

Do not use mutation testing for ordinary UI behavior, documentation, type-only edits, mechanical refactors, or unchanged tests.

## Durable automatic ownership

The current verifier selects automatic mutation proof only from the explicit project-owned registry in `scripts/lib/mutationTargets.ts`.

Each registered target records:

- one exact high-risk production source file;
- one or more exact owning focused test files;
- a concrete risk reason.

`stryker.config.mjs` derives its mutation source inventory directly from that registry. Register a target only when durable regression protection justifies automatic cost. Updating, moving, or removing a registered source/test updates the same registry entry in the same change.

Do not infer mutation applicability from adjacency, broad prefixes, neighboring files, or agent prose. There is no legacy location-derived automatic mutation ownership path to maintain.

## Workflow

1. Run focused `unit` verification and confirm it passes.
2. Confirm the source/test pair is an existing registered target or a deliberate focused audit required by the task.
3. Select the narrowest exact source/test paths.
4. Run the mutation audit.
5. Inspect survived, no-coverage, timeout, and project-command failures.
6. Strengthen tests only when a meaningful mutant exposes a missing accepted outcome or boundary.
7. Do not change production behavior merely to kill a mutant.
8. Rerun focused tests and the same mutation scope after test changes.
9. Return to the top-level task. This skill does not run a separate final gate.

## Commands

```bash
pnpm verify --only unit --files <exact-owning-test-paths...>
pnpm verify --only mutation --files <registered-source-or-owning-test-paths...>
```

Do not bypass an empty or unrelated scope with a broad mutation glob. A broad run is diagnostic only when explicitly required by a named workspace policy.

## Results

- `Killed`: selected tests rejected the mutation.
- `Survived`: selected tests did not reject the changed behavior.
- `No coverage`: no selected test executed the mutated code.
- `Timeout` or command failure: no conclusion may be drawn until the exact visible failure is resolved or reported.

Mutation score alone is not an acceptance criterion.

For equivalent or irrelevant mutants, record why no distinct accepted behavior is missing. Do not add implementation-detail assertions or disable comments without an established project reason.

## Forbidden

- UI component behavior or Playwright-only flows;
- behavior-preserving refactors, type-only edits, formatting, comments, renames, or documentation;
- unchanged focused tests used only to raise a score;
- broad source scopes without a named workspace policy;
- automatic applicability inferred only from location or neighboring tests;
- automatic applicability dependent on `TEST IMPACT` text;
- production changes or brittle assertions made only to improve mutation score;
- replacing focused tests, type-checking, linting, browser proof, or the authoritative PR CI/repository verification gate.
