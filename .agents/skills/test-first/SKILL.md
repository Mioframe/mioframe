---
name: test-first
description: 'Use when observable behavior, a reproducible defect, migration, persistence semantics, or a data transformation changes and one focused check can fail against the current implementation before the fix.'
---

# Test-first workflow

Follow `docs/testing/architecture.md`. This skill runs one narrow red/green cycle at the already-defined proof type. It does not decide the full `TEST IMPACT` or create a new execution lane.

## Activation

Use only when all conditions are true:

1. observable behavior, a public contract, persistence/migration semantics, a transformation, or a reproducible defect changes;
2. `docs/testing/architecture.md` defines a faithful proof type for the expected result;
3. an existing focused test target can be updated, or a new focused target can be created without broad infrastructure;
4. the check can fail against the current implementation for the expected behavioral reason before production edits.

Skip for behavior-preserving refactors, type-only edits, formatting, comments, renames, documentation, and appearance-only changes without a meaningful pre-implementation failure.

Skipping test-first does not skip required proof from `TEST IMPACT` or final verification.

## Workflow

1. Name the changed contract and proof type.
2. Select the highest-risk applicable acceptance case.
3. Add or update one focused test before production edits.
4. Run the owning verify-managed lane and confirm the expected failure.
5. If a faithful red check cannot be produced without brittle or duplicative coverage, stop expanding and record the limitation.
6. Implement the minimum production change.
7. Rerun the same target and confirm it passes.
8. Complete the remaining minimum acceptance set from `TEST IMPACT`; the initial red test does not cap final proof.
9. Run final read-only `pnpm verify`.

## Proof routing

- Pure/domain/service/storage/CRDT/validation/migration/transformation: `unit-testing`.
- Vue public API and non-browser wiring: `component-contract-testing`.
- Reusable UI focus/keyboard/pointer/touch/layout/scroll/overlay/responsive/browser behavior: `ui-browser-behavior` with Storybook.
- Complete cross-boundary product scenario: `ui-browser-behavior` with app E2E.
- Appearance: `visual-regression-testing`; normally not a red/green target.

## Commands

```bash
pnpm verify --only unit-tests --files <paths...>
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only e2e --files <paths...>
```

Raw Vitest or Playwright commands are diagnostic exceptions, not completion gates.

## Forbidden

- Do not add a test merely because a production file changed.
- Do not force a ceremonial red phase.
- Do not use a less faithful proof type because it is easier.
- Do not broaden coverage beyond the changed contract and confirmed risk.
- Do not duplicate an existing owner at another proof type.
- Do not create a framework, DSL, fixture system, registry, or helper for one case.
- Do not stop after one passing red/green test when the accepted contract requires additional cases.
