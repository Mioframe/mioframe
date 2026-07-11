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
2. Build a minimal acceptance matrix before writing the test. Include only states relevant to the task.
3. Add or update one focused test or smoke check for the highest-risk matrix item before production edits.
4. Run only that target and confirm it fails for the expected reason.
5. If a focused failing check cannot be produced quickly, stop expanding coverage and state the risk in the final response.
6. Implement the minimal production change.
7. Rerun the same target and confirm it passes.
8. Run the narrowest additional verification required by `AGENTS.md`.
9. Run the final `pnpm verify` check required by `AGENTS.md` before reporting completion.

## Acceptance matrix guidance

Include only states that are relevant to the task, but consider:

- unavailable or disabled integrations;
- missing browser APIs or unsupported runtime;
- async pending, cancellation, stale completion, and repeated toggles;
- invalid, malformed, or hostile input;
- cache invalidation after create, update, delete, or failed lookup;
- data-safety-sensitive values in diagnostics, URLs, names, ids, and content;
- accessibility structure and heading hierarchy for rendered UI.

The first focused test should target the highest-risk applicable matrix item, not just the happy path.

## Choosing the check

- Use focused unit tests for composables, pure helpers, schemas, migrations, services, storage helpers, CRDT write helpers, state transitions, validation, normalization, and pure transformations.
- Use Playwright/e2e or a reproducible browser smoke check for Vue component behavior that depends on real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, or Material state visuals.
- Use component unit tests only for small render or wiring contracts that do not depend on browser layout or interaction semantics.

## Targeted command patterns

Use the repository verification entry point whenever it can express the target:

```bash
pnpm verify --only unit-tests --files <test-or-source-paths...>
pnpm verify --only e2e --files <spec-paths...>
pnpm verify --only storybook-behavior --files <spec-or-source-paths...>
```

A reproducible manual browser smoke check is acceptable when no focused automated target exists and adding one would broaden the task.

Do not invoke Vitest or Playwright directly as a verification substitute. Raw runner commands are allowed only for narrow diagnostics after a verify-managed check fails, or when the verify runner cannot express the required mode. Report them as diagnostic commands and return to verify-managed checks before completion.

Keep targeted checks narrow. Do not replace the final `pnpm verify` requirement.

## Limits

- Do not create a new testing approach just to satisfy test-first.
- Do not broaden coverage beyond the behavior changed by the task.
- Do not keep a test that only documents implementation details instead of behavior.
- Do not skip final verification when the task changes code.