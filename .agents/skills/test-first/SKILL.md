---
name: test-first
description: 'Use this skill when a task changes observable behavior, fixes a reproducible bug, changes migration logic, transforms data, changes storage semantics, or changes a user-facing UI flow, and the expected outcome can be reproduced by a focused test or smoke check.'
---

# Test-first workflow

Use this skill to make behavior changes safer without turning every task into full TDD.

## Do not use this skill

Do not use this skill for refactors, type-only edits, formatting, comments, renames, documentation, or internal cleanup with no observable behavior change.

Do not use this skill when the only way to proceed is to create a new test layer, broad speculative coverage, or fragile UI component unit tests.

## Activation check

Before production edits, decide whether all conditions are true:

1. The task changes observable behavior, fixes a reproducible bug, changes migration logic, transforms data, changes storage semantics, or changes a user-facing UI flow.
2. The expected outcome can be covered by an existing focused test target or reproducible browser smoke check.
3. The focused check can be added quickly without expanding the task scope.

If any condition is false, skip test-first and use the normal verification rules from `AGENTS.md`.

## Workflow

1. Identify the smallest existing verification target that should own the changed behavior.
2. Add or update one focused test or smoke check for that behavior before production edits.
3. Run only that target and confirm it fails for the expected reason.
4. If a focused failing check cannot be produced quickly, stop expanding coverage and state the risk in the final response.
5. Implement the minimal production change.
6. Rerun the same target and confirm it passes.
7. Run the narrowest additional verification required by `AGENTS.md`.
8. Run the final `pnpm verify` check required by `AGENTS.md` before reporting completion.

## Choosing the check

- Use focused unit tests for composables, pure helpers, schemas, migrations, services, storage helpers, CRDT write helpers, state transitions, validation, normalization, and pure transformations.
- Use Playwright/e2e or a reproducible browser smoke check for Vue component behavior that depends on real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, or Material state visuals.
- Use component unit tests only for small render or wiring contracts that do not depend on browser layout or interaction semantics.

## Targeted command patterns

Use project scripts first:

```bash
pnpm test:run <test-file-or-pattern>
pnpm e2e <test-file-or-pattern>
```

Use direct runner flags only when the project script cannot express the narrow target:

```bash
pnpm vitest run <test-file-or-pattern>
pnpm playwright test <test-file-or-pattern>
```

Keep targeted checks narrow. Do not replace the final `pnpm verify` requirement.

## Limits

- Do not create a new testing approach just to satisfy test-first.
- Do not broaden coverage beyond the behavior changed by the task.
- Do not keep a test that only documents implementation details instead of behavior.
- Do not skip final verification when the task changes code.
