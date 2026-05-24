---
name: mutation-testing
description: 'Use this skill after focused unit/integration tests pass for high-risk pure logic, schemas, migrations, storage helpers, CRDT write helpers, validation, normalization, filtering, sorting, matching, service logic, or data transformations. Do not use it for UI component behavior, Playwright/e2e-only flows, refactors, type-only edits, formatting, comments, renames, or documentation.'
---

# Mutation testing workflow

Use this skill to check whether focused unit or integration tests are strong enough to catch incorrect implementations.

Mutation testing is an expensive quality check. Use it narrowly and only after the relevant normal tests pass.

## Do not use this skill

Do not use this skill for UI component behavior, Playwright/e2e-only flows, refactors, type-only edits, formatting, comments, renames, documentation, or internal cleanup with no observable behavior change.

Do not use this skill before the focused unit or integration tests for the touched behavior pass.

Do not use a full mutation run by default.

## Activation check

Use this workflow only when all conditions are true:

1. The task changes high-risk pure logic, schemas, migrations, storage helpers, CRDT write helpers, validation, normalization, filtering, sorting, matching, service logic, or data transformations.
2. Focused unit or integration tests were added or changed for that behavior.
3. The focused tests already pass.
4. A narrow mutation scope can be selected for the changed source files or glob.

If any condition is false, skip mutation testing and use the normal verification rules from `AGENTS.md`.

## Workflow

1. Run the focused unit or integration tests first and confirm they pass.
2. Select the narrowest changed source file or glob for mutation testing.
3. Run Stryker against that narrow scope.
4. Inspect survived mutants before editing more code.
5. Strengthen tests only when a survived mutant exposes a missing behavior assertion.
6. Treat equivalent or irrelevant mutants as analysis findings, not as a reason to add brittle tests.
7. Do not change production behavior only to kill a mutant.
8. Rerun the focused tests after test changes.
9. Rerun the same narrow mutation scope when the test was strengthened.
10. Run the final `pnpm verify` check required by `AGENTS.md` before reporting completion.

## Commands

Check that Stryker can run without active mutations:

```bash
pnpm exec stryker run --dryRunOnly
```

Preferred narrow run:

```bash
pnpm exec stryker run -m "<changed-source-file-or-glob>"
```

Examples:

```bash
pnpm exec stryker run -m "src/shared/lib/**/*.ts"
pnpm exec stryker run -m "src/entities/databaseData/**/*.ts"
```

Full mutation run is allowed only when explicitly requested or before a high-risk merge:

```bash
pnpm test:mutate
```

## Reading results

- `Killed` means the tests caught the mutation.
- `Survived` means the tests did not catch the changed behavior.
- `No coverage` means no relevant test executed the mutated code.
- `Timeout` or runner failures need investigation before drawing conclusions.

## Handling survived mutants

For each meaningful survived mutant:

1. Identify the behavior that should have failed.
2. Add or tighten the smallest relevant assertion.
3. Keep the assertion behavior-focused, not implementation-focused.
4. Rerun the focused test.
5. Rerun the same narrow mutation scope.

Useful mutation fixes usually assert boundaries, branches, and user-visible outcomes that should already matter: empty vs non-empty input, valid vs invalid input, cancellation vs failure, error precedence, filtering inclusion/exclusion, sorting direction, and fallback behavior.

If survived mutants cluster in a large UI component, do not add brittle component tests against implementation details. First extract the pure derivation or decision logic into a helper/composable owned by the correct layer, then cover that extracted logic with focused tests.

If the mutation report points at unrelated files, reduce the mutation scope or revert unrelated changes. Do not broaden production changes to satisfy a mutation report that was scoped too widely.

For equivalent or irrelevant mutants:

- Do not add brittle tests.
- State why the mutant is equivalent or irrelevant in the final response.
- Use Stryker disable comments only when explicitly requested or when the project already uses them nearby.

## Limits

- Do not use mutation testing as a replacement for focused tests, type-checking, linting, e2e checks, or final `pnpm verify`.
- Do not broaden mutation scope to unrelated files to improve the score.
- Do not chase mutation score by testing implementation details.
- Do not run full mutation testing automatically during small tasks.
