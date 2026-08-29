---
name: test-first
description: 'Use when observable behavior, a reproducible defect, migration, persistence semantics, or a data transformation changes and one focused check can fail against the current implementation before the fix.'
---

# Test-first workflow

Follow `docs/testing/architecture.md`. This skill coordinates one narrow red/green cycle at the already-defined proof type. It does not decide the full `TEST IMPACT`, automatic resolver scope, or a new execution lane.

For Storybook-owned UI proof, use `docs/testing/storybook.md` for current ownership and `docs/testing/migration-plan.md` for executable verification state.

When a new assertion-bearing automated test/spec or accepted visual baseline is required, or an existing one materially changes its oracle, expectations, assertions, or failure semantics, author and validate that proof first in a separate test-author context using `test-authoring`. Production implementation consumes the accepted proof; it does not author its own acceptance oracle.

A separate test-author pass is not required for static verifier/check implementation, mutation-target registration, ownership/applicability metadata, proof-only renames/moves, formatting, comments, mechanical ownership migration with unchanged assertions, or other edits that do not add or alter an assertion oracle.

## Activation

Use the red/green cycle only when all conditions are true:

1. observable behavior, a public contract, persistence/migration semantics, a transformation, or a reproducible defect changes;
2. `docs/testing/architecture.md` defines a faithful proof type for the expected result;
3. an existing focused assertion-bearing proof exists, or a required new/materially changed proof has been accepted through `test-authoring`;
4. the focused proof can fail against the current implementation for the expected contract reason before production edits.

Skip the red phase for behavior-preserving refactors, type-only edits, formatting, comments, renames, documentation, appearance-only changes without a meaningful pre-implementation failure, or another case where a faithful red result cannot exist.

Skipping a red phase does not skip required proof from `TEST IMPACT`, `test-authoring` when an assertion oracle is new/materially changed, durable ownership maintenance, or required exact-head PR CI when applicable.

## Independent oracle

Before changing production code, establish the expected observable result from the `TEST IMPACT` oracle source:

- accepted architecture/product/public contract;
- reproducible defect and its required corrected behavior;
- persisted/protocol compatibility contract;
- authoritative platform/dependency contract;
- independently accepted visual appearance;
- another explicit source that does not derive the expected result from the production implementation under test.

Name at least one plausible incorrect observable result the proof must reject (`Must reject`).

Do not calculate expected values with the production helper/algorithm being tested, copy the implementation algorithm into the test, promote current implementation output to an expectation without independent justification, or program mocks so the assertion merely confirms the value injected by the test.

When an existing expectation changes, the accepted contract must have changed or the old proof must be independently shown invalid. A failing new implementation is not sufficient reason to edit an assertion or regenerate a baseline.

## Workflow

1. Name the changed contract and proof type from `TEST IMPACT`.
2. Confirm the independent oracle and `Must reject` outcome.
3. If assertion-bearing proof is new/materially changed, consume the completed `test-authoring` handoff. Required RED evidence must already have been produced by that context before production implementation begins.
4. If the proof oracle is unchanged and a red phase is required, run the existing focused owning proof before production edits and confirm the expected contract-relevant failure.
5. Treat setup errors, wrong-environment failures, unrelated exceptions, timeouts, missing fixtures, or infrastructure failures as invalid RED evidence. If a faithful red phase cannot exist, record `Red phase: not applicable — <reason>` instead of manufacturing one.
6. Implement the minimum production change. Test-author-accepted test/spec/baseline files remain read-only to the implementation context until the first GREEN result.
7. Rerun the same focused proof and confirm GREEN.
8. Complete the remaining minimum acceptance set from `TEST IMPACT`; the initial red/green proof does not cap final proof.
9. If remaining acceptance requires a new or materially changed assertion-bearing test/spec/baseline, route that proof through `test-authoring` before authoring it.
10. Return to the top-level task after focused proof. This skill does not run a separate final gate.

If implementation reveals a genuine problem in the accepted proof or contract, stop and route the conflict back to the test-author/architect. Do not resolve the conflict by letting the implementation context rewrite its own acceptance criteria.

## Proof routing

- Deterministic domain/service/storage/CRDT/validation/migration/transformation behavior: `unit-testing`.
- Vue public API and non-browser wiring: `component-contract-testing`.
- Reusable UI focus/keyboard/pointer/touch/layout/scroll/overlay/responsive/browser behavior: `ui-browser-behavior` with Storybook as `behavior`.
- Isolated browser/service/worker/runtime contracts: `ui-browser-behavior` as `browser-integration`.
- Complete cross-boundary product scenario: `ui-browser-behavior` with structural app `e2e`.
- Appearance: `visual-regression-testing`; normally not a red/green target.
- Persistent performance invariants: the existing performance proof owner selected by `docs/testing/architecture.md`; only when a pre-fix failure is meaningful.

Release-sensitive behavior uses the current public verification type that faithfully owns the contract. There is no separate public `release` type or `verify:release` test-first path.

Static checks and mutation target registration are verification mechanisms, not dedicated assertion-bearing test/spec types. They do not enter `test-authoring` merely because they are verification work; any assertion-bearing unit/browser/etc. proof for their implementation follows its own truthful proof type.

## Commands

Use the narrow verifier-managed public type selected by `TEST IMPACT`, for example:

```bash
pnpm verify --only unit --files <paths...>
pnpm verify --only behavior --files <paths...>
pnpm verify --only browser-integration --files <paths...>
pnpm verify --only e2e --files <paths...>
```

Raw Vitest or Playwright commands are diagnostic exceptions, not completion gates.

## Forbidden

- Do not add a test merely because a production file changed.
- Do not force a ceremonial red phase.
- Do not let the production implementation context invent or weaken its own acceptance oracle.
- Do not edit test-author-accepted proof before the first GREEN result.
- Do not change an existing assertion/baseline solely because the new implementation otherwise fails.
- Do not derive expected values from the implementation being tested.
- Do not use a less faithful proof type because it is easier.
- Do not broaden coverage beyond the changed contract and confirmed risk.
- Do not duplicate an existing owner at another proof type.
- Do not create a framework, DSL, fixture system, registry, or helper for one case.
- Do not create a Playwright spec outside the current owner/discovery contract.
- Do not stop after one passing red/green test when the accepted contract requires additional cases.
- Do not treat a passing focused run as proof that automatic ownership/impact resolution is complete.
