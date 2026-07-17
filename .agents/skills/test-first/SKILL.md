---
name: test-first
description: 'Use when observable behavior, a reproducible defect, migration, persistence semantics, or a data transformation changes and one focused regression test can be added at the existing owning test layer before implementation.'
---

# Test-first workflow

Follow `docs/testing/architecture.md`. This skill decides whether a changed behavior needs a new focused regression test and runs the narrow red/green workflow. It does not create a new test layer or broaden coverage by default.

## Do not use this skill

Skip test-first for:

- behavior-preserving refactors;
- type-only edits, formatting, comments, renames, or documentation;
- internal cleanup with no observable contract change;
- changes for which the only possible test would be broad, speculative, duplicative, or less faithful than an existing owner.

Normal relevant coverage and final verification still apply.

## Activation check

Use test-first only when all conditions are true:

1. Observable behavior, a public contract, persistence or migration semantics, a transformation, or a reproducible defect changes.
2. The expected result has an existing faithful owner under `docs/testing/architecture.md`.
3. One focused regression test or browser smoke check can be added without expanding the task into unrelated coverage or infrastructure.

If any condition is false, skip test-first and state any material unverified risk.

## Workflow

1. Name the changed contract and its owning layer.
2. Build the smallest acceptance matrix needed for this task. Include only applicable success, boundary, failure, cancellation, stale-result, invalid-input, or data-safety cases.
3. Select the highest-risk applicable case.
4. Add or update one focused test at the owning layer before production edits.
5. Run the narrow verify-managed target and confirm it fails for the expected reason.
6. If a faithful failing check cannot be produced quickly, stop expanding coverage. Record the limitation rather than creating a brittle substitute.
7. Implement the minimum production change.
8. Rerun the same target and confirm it passes.
9. Run any additional owner-specific proof required by `docs/testing/architecture.md` and applicable skills.
10. Run final read-only `pnpm verify` before reporting completion.

## Choosing the owner

- Pure, domain, service, storage, CRDT, validation, migration, or transformation behavior: focused unit test.
- Vue public API and non-browser wiring: component contract test.
- Reusable UI focus, keyboard, pointer, touch, layout, scrolling, overlay, responsive, motion, or browser API behavior: Storybook browser test.
- Complete product scenario crossing page, feature, service, persistence, or navigation boundaries: app e2e.
- Appearance: visual regression. A screenshot does not prove behavior.

Use the relevant owning skill for detailed rules.

## Commands

Use the repository verification entry point:

```bash
pnpm verify --only unit-tests --files <paths...>
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only e2e --files <paths...>
pnpm verify --only visual --files <paths...>
```

A reproducible manual browser smoke check is acceptable only when no suitable existing automated target exists and adding one would broaden the task. Report it as manual evidence, not as an automated gate.

Raw Vitest or Playwright commands are diagnostic exceptions, not substitutes for verify-managed checks.

## Limits

- Do not add a test merely because a production file changed.
- Do not broaden coverage beyond the changed contract.
- Do not keep a test that protects implementation details rather than behavior.
- Do not duplicate an existing owner at another layer.
- Do not create a new test framework, DSL, fixture system, registry, or helper for one case.
- Do not skip required final verification.
