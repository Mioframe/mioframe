---
name: test-first
description: 'Use whenever behavioral proof is added or materially changed. Derive the test oracle independently from the implementation, require failure sensitivity, and use a focused red/green cycle when the current implementation can fail meaningfully before the fix.'
---

# Test-first and proof-independence workflow

Follow `docs/testing/architecture.md`. This skill protects test quality when a coding agent writes or changes both production code and proof. It does not decide the full `TEST IMPACT`, automatic resolver scope, or a new execution lane.

The central rule is:

> Tests verify the accepted contract independently of the implementation being written. They are not a second description of the same implementation.

For Storybook-owned UI proof, use `docs/testing/storybook.md` for ownership and `docs/testing/migration-plan.md` for the currently executable Playwright location.

## Activation

Use this skill whenever a task adds or materially changes automated behavioral proof because observable behavior, a public contract, persistence/migration semantics, a transformation, a reproducible defect, or an existing proof gap changes.

A focused pre-implementation red/green cycle is required when all of these are true:

1. the expected behavior is already defined by an accepted contract, scenario, defect reproduction, or authoritative dependency/platform contract;
2. `docs/testing/architecture.md` defines a faithful proof type;
3. an existing focused test target can be updated, or a new focused target can be created without broad infrastructure;
4. the check can fail against the current implementation for the expected behavioral reason before production edits.

A pre-implementation red phase is not required for behavior-preserving refactors, type-only edits, formatting, comments, renames, documentation, appearance-only changes without a meaningful behavioral failure, or proof added around behavior that is already correct. Those cases still require the proof-independence and failure-sensitivity rules below when tests are changed.

Skipping a red phase never skips required proof from `TEST IMPACT`, durable ownership maintenance, or required exact-head PR CI.

## Independent oracle

Before writing or changing the assertion, identify the source of the expected result independently from the production implementation being edited.

Valid oracle sources include:

- an accepted architecture/product/public contract;
- an explicit user scenario or acceptance criterion;
- a reproducible pre-existing defect and its required corrected outcome;
- a persisted-data, protocol, migration, compatibility, or error contract;
- an authoritative platform/dependency contract when Mioframe owns the adaptation;
- an already-accepted stable behavior whose regression is being protected.

Current production output is evidence of implementation behavior, not an oracle by itself.

Do not derive the expected result from:

- the same production function/helper/algorithm under test;
- a copied or lightly rewritten version of the implementation algorithm;
- private implementation structure that is not part of the accepted contract;
- a mock programmed to return the same value the assertion expects unless that mock represents a real external boundary contract;
- a newly observed snapshot/output merely because the changed implementation produced it.

When the contract itself is unresolved, stop and return to the owning architecture/product decision instead of inventing a test expectation.

## Proof intent

When `implementation-preflight` already recorded these fields in `TEST IMPACT`, use that record; do not create a duplicate. A deterministic workflow that does not use the generic preflight must establish the equivalent compact proof intent before production edits for a behavior-changing task, or before finalizing a tests-only proof change:

```text
PROOF INTENT
- Contract/scenario: <observable requirement>
- Oracle source: <independent contract/evidence>
- Primary proof owner: <unit/component/browser/e2e/visual/release>
- Must reject: <one plausible incorrect observable result>
- Red phase: required | not applicable — <reason>
```

`Must reject` is a sensitivity check, not a request for exhaustive negative testing. If no plausible incorrect outcome can be named that the assertions would reject, the proof is probably tautological, proxy-only, or too weak.

## Workflow

1. Name the changed contract and truthful primary proof owner.
2. Resolve the expected result from an independent oracle before adapting assertions to production code.
3. Name at least one plausible incorrect observable result the proof must reject.
4. Select the highest-risk applicable acceptance case.
5. When a meaningful red phase is required, add or update one focused test before production edits.
6. Maintain required durable ownership facts for any new/moved Playwright spec: use local ownership only when current discovery supports it; otherwise preserve the current truthful transitional/explicit relation.
7. Run the owning verifier-managed lane and confirm the red check fails for the expected contractual assertion. Setup errors, missing fixtures, type failures, unrelated exceptions, timeouts, or wrong-environment failures are not valid red proof.
8. If the test unexpectedly passes before the fix, determine whether the behavior is already correct, the reproduction is wrong, or the test is insensitive. Do not proceed by declaring the intended defect covered.
9. If a faithful red check cannot be produced without brittle or duplicative coverage, stop expanding and record why the red phase is not useful; required final proof still follows `TEST IMPACT`.
10. Implement the minimum production change.
11. Rerun the same focused target and confirm it passes without weakening the oracle or assertion.
12. Complete the remaining minimum acceptance set from `TEST IMPACT`; the initial red test does not cap final proof.
13. Re-read the changed tests as if the production implementation were untrusted. Confirm the assertions still derive from the contract and reject the named plausible wrong result.
14. Return to the top-level task after focused proof. This skill does not run a separate final repository gate.

## Maintaining existing tests

An existing failing test is evidence against the changed implementation until one of these is independently established:

- the accepted contract intentionally changed;
- the test encoded behavior the project never owned;
- the test itself is technically invalid or uses an unfaithful environment.

Do not change an expected value, loosen an assertion, delete a scenario, regenerate a baseline, add a retry, or broaden a mock merely because the new production implementation otherwise fails.

When the accepted contract changes, update the test from the new contract and scenario, not by copying the implementation's newly observed output.

When a test becomes obsolete because its owned contract is removed or replaced, remove it together with stale ownership/impact metadata. Do not retain ceremonial tests that no longer protect a current contract.

## Failure sensitivity

Prefer assertions that would fail for a realistic implementation mistake relevant to the changed contract, for example:

- wrong boundary value or ordering;
- stale state retained after cancellation/replacement;
- accepted versus rejected controlled-state drift;
- missing persistence/rollback/cleanup effect;
- wrong public event/message/error;
- user action reaching the wrong owner;
- release artifact missing the changed runtime invariant.

Do not add artificial branches or production hooks merely to make a test fail. For explicitly registered high-risk deterministic logic, `mutation-testing` may provide stronger sensitivity evidence; do not require ad-hoc mutation for every test.

## Proof routing

- Deterministic domain/service/storage/CRDT/validation/migration/transformation behavior: `unit-testing`.
- Vue public API and non-browser wiring: `component-contract-testing`.
- Reusable UI focus/keyboard/pointer/touch/layout/scroll/overlay/responsive/browser behavior: `ui-browser-behavior` with Storybook.
- Complete cross-boundary product scenario: `ui-browser-behavior` with app E2E.
- Appearance: `visual-regression-testing`; normally not a red/green target, and baseline changes require independent acceptance rather than copying new output blindly.
- Release artifact/runtime behavior: the existing release proof owner selected by the release-impact architecture.

## Commands

```bash
pnpm verify --only unit-tests --files <paths...>
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only e2e --files <paths...>
```

Use the owning verifier-managed label for other proof types. Raw Vitest or Playwright commands are diagnostic exceptions, not completion gates.

## Forbidden

- Adding a test merely because a production file changed.
- Treating the implementation's current output as the expected result without an independent contract.
- Computing expected values through the same implementation or a copied implementation algorithm.
- Programming fixtures/mocks so the assertion can only confirm what the test itself injected, unless that is the actual boundary contract under test.
- Weakening or deleting existing proof solely to make changed production code pass.
- Updating snapshots/baselines solely because the implementation changed.
- Forcing a ceremonial red phase that fails for setup/environment reasons rather than the contract.
- Using a less faithful proof type because it is easier.
- Broadening coverage beyond the changed contract and confirmed risk.
- Duplicating an existing owner at another proof type.
- Creating a framework, DSL, fixture system, registry, or helper for one case.
- Creating test-only production APIs or architectural boundary violations solely for testability.
- Creating a colocated Playwright spec before the owning lane can discover it.
- Stopping after one passing red/green test when the accepted contract requires additional cases.
- Treating a passing focused run as proof that automatic ownership/impact resolution or the implementation itself is semantically correct.
