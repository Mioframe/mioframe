---
name: mutation-testing
description: 'Use explicitly after changed focused tests pass for high-risk pure, domain, service, storage, CRDT, validation, migration, filtering, sorting, matching, or transformation logic. Never use as an automatic general gate or UI coverage target.'
---

# Mutation testing workflow

Follow `docs/testing/architecture.md`. Mutation testing audits whether already-passing focused tests reject incorrect high-risk logic. It is expensive, narrow, and explicit. It is not a behavior layer, a coverage target, or a default requirement for files that happen to have sibling tests.

## Do not use this skill

Do not use mutation testing for:

- UI component behavior or Playwright/e2e-only flows;
- refactors or internal cleanup with no observable change;
- type-only edits, formatting, comments, renames, or documentation;
- code without changed focused tests for the relevant behavior;
- broad source areas that cannot be selected narrowly.

Do not run a full mutation suite by default.

## Activation check

Use this workflow only when all conditions are true:

1. The task changes high-risk pure, domain, service, storage, CRDT, validation, migration, normalization, filtering, sorting, matching, or transformation logic.
2. Focused unit or integration tests were added or changed for that exact behavior.
3. Those focused tests already pass.
4. A narrow mutation scope can be selected from the changed source files or their sibling tests.
5. A survived mutant would provide useful evidence about a missing behavioral assertion rather than framework, UI, or equivalent implementation detail.

If any condition is false, mutation testing does not apply. Use normal owner-specific proof and final verification.

## Workflow

1. Run the focused tests through verify and confirm they pass.
2. Select the narrowest changed source or sibling test paths that identify the intended mutation scope.
3. Run the focused mutation audit.
4. Inspect survived, no-coverage, timeout, and runner-failure results before editing tests.
5. Strengthen a test only when a meaningful survived mutant exposes a missing behavior assertion.
6. Keep the assertion at the existing owning test layer and focused on an accepted outcome or boundary.
7. Do not change production behavior only to kill a mutant.
8. Treat equivalent or irrelevant mutants as findings, not as reasons for brittle tests.
9. Rerun the focused normal tests after test changes.
10. Rerun the same narrow mutation scope when the test was strengthened.
11. Run final read-only `pnpm verify` before reporting completion.

## Commands

Focused normal tests:

```bash
pnpm verify --only unit-tests --files <changed-source-or-test-paths...>
```

Explicit narrow mutation audit:

```bash
pnpm verify --only mutation --files <changed-source-or-test-paths...>
```

The verify runner may derive source candidates from selected files. If the resulting scope is empty or includes unrelated files, correct the explicit file selection or report that mutation testing does not apply. Do not bypass an empty scope with an arbitrary broader Stryker glob.

A standalone full mutation command is allowed only when explicitly requested or when a named high-risk merge requires a mode the verify runner cannot express. Treat it as additional diagnostic evidence, not as a replacement for focused tests or final verification.

## Reading results

- `Killed`: the selected tests rejected the mutation.
- `Survived`: the selected tests did not reject the changed behavior.
- `No coverage`: no selected test executed the mutated code.
- `Timeout` or runner failure: investigate execution before drawing conclusions.

A mutation score alone is not an acceptance criterion.

## Meaningful survived mutants

For each meaningful survived mutant:

1. Name the accepted behavior that should have failed.
2. Add or tighten the smallest assertion at the owning layer.
3. Prefer boundaries and outcomes such as empty versus non-empty, valid versus invalid, cancellation versus failure, error precedence, inclusion versus exclusion, direction, fallback, or persistence result.
4. Rerun the focused normal test.
5. Rerun the same mutation scope.

If mutants cluster in a large UI component, do not add brittle component tests. Extract pure logic only when it has a coherent owner and the extraction decreases total complexity; otherwise mutation testing does not apply to that behavior.

## Equivalent or irrelevant mutants

- Do not add brittle implementation-detail assertions.
- Record why the mutant does not represent a distinct accepted behavior.
- Use disable comments only when explicitly requested or when an established nearby project convention applies.
- Narrow the scope when unrelated files appear; do not broaden production changes to satisfy a mis-scoped report.

## Limits

- Do not infer mutation applicability merely from file location or the existence of a sibling test.
- Do not run mutation automatically for ordinary tasks or as part of a general score target.
- Do not use mutation as a replacement for focused tests, type checking, linting, browser checks, or final verification.
- Do not broaden scope to unrelated files.
- Do not test implementation details or change production behavior to kill mutants.
