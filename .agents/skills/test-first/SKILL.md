---
name: test-first
description: 'Use whenever behavioral proof is added or materially changed. A dedicated fresh test-author context derives proof from the accepted contract before implementation; the implementation context treats accepted tests as read-only and uses focused red/green proof when meaningful.'
---

# Test-first and proof-independence workflow

Follow `docs/testing/architecture.md`. This skill protects proof independence when coding agents implement behavior. It does not decide the full `TEST IMPACT`, automatic resolver scope, or a new execution lane. The dedicated test author also follows `test-authoring` plus the selected proof-type skill; those instructions own test-quality mechanics.

The central rules are:

> Tests verify the accepted contract independently of the implementation being written. They are not a second description of the same implementation.

> New or materially changed behavioral proof is authored in a fresh test-author agent/session separate from the implementation agent/session.

For Storybook-owned UI proof, use `docs/testing/storybook.md` for ownership and `docs/testing/migration-plan.md` for the currently executable Playwright location.

## Activation

Use this skill whenever a task adds or materially changes automated behavioral proof because observable behavior, a public contract, persistence/migration semantics, a transformation, a reproducible defect, or an existing proof gap changes.

No separate test-author pass is required when the accepted `TEST IMPACT` requires no new or materially changed behavioral proof, for example a behavior-preserving refactor already protected by faithful existing tests.

A focused pre-implementation red/green cycle is required when all of these are true:

1. the expected behavior is already defined by an accepted contract, scenario, defect reproduction, or authoritative dependency/platform contract;
2. `docs/testing/architecture.md` defines a faithful proof type;
3. an existing focused test target can be updated, or a new focused target can be created without broad infrastructure;
4. the pre-change implementation can demonstrate the contract gap through the owning proof.

A pre-implementation red phase is not required for behavior-preserving refactors, type-only edits, formatting, comments, renames, documentation, appearance-only changes without a meaningful behavioral failure, or proof added around behavior that is already correct. Those cases still require separate test authorship, proof independence, and failure sensitivity when tests are materially changed.

Skipping a red phase never skips required proof from `TEST IMPACT`, durable ownership maintenance, or required exact-head PR CI.

## Role separation

### Test author

Use a fresh agent/subagent/session whose task is test/proof authoring only. The test author must follow `test-authoring` and the proof-type skill selected by `TEST IMPACT`.

The test author receives:

- the accepted architecture/handoff or deterministic contract;
- the applicable `TEST IMPACT` / `PROOF INTENT`;
- relevant repository rules and proof-type skills;
- the current pre-implementation repository state and existing tests needed to understand public behavior.

Do not give the test author a proposed implementation as the source of expected behavior. Current production code may be inspected as evidence of existing behavior, but it is never the oracle by itself.

The test author may change only the proof surface required by the accepted contract:

- tests/specs;
- proof-only fixtures/stories when they are the truthful owner of deterministic setup;
- snapshots/baselines only when independently accepted by the applicable visual contract;
- durable test ownership/impact metadata required by the repository.

The test author must not implement or patch the production behavior under test merely to make the proof pass.

### Implementer

After the test-author pass is accepted, use a different agent/session for production implementation.

The implementer receives the accepted contract plus the accepted proof and must treat test expectations/assertions as read-only implementation constraints. The implementer may run the tests and inspect them to understand the contract, but must not change, weaken, delete, regenerate, or bypass them merely to obtain green verification.

If the implementer finds that an accepted test is inconsistent with the accepted contract, technically invalid, or impossible to satisfy without violating architecture, stop the production pass and return the conflict to the test owner/architect. Do not resolve the conflict by editing the test from the implementation context.

A required test correction is another test-author pass in fresh context, followed by implementation continuing against the corrected accepted proof.

This role separation is about independent reasoning, not identity. Two sessions of the same model are acceptable when they have separate contexts and responsibilities. A nominally different agent that receives and follows the implementation's expected outputs is not independent proof.

## Independent oracle

Before writing or changing an assertion, identify the source of the expected result independently from the production implementation being edited.

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

When `implementation-preflight` already recorded these fields in `TEST IMPACT`, use that record; do not create a duplicate. A deterministic workflow that does not use the generic preflight must establish the equivalent compact proof intent before the test-author pass:

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

1. Resolve `TEST IMPACT` and the truthful primary proof owner before implementation.
2. Start a fresh test-author agent/session and load `test-authoring` plus the selected proof-type skill.
3. Resolve the expected result from an independent oracle and name at least one plausible incorrect observable result the proof must reject.
4. Add/update the minimum faithful proof and any required proof-only fixture/ownership facts without implementing production behavior.
5. When a meaningful red phase is required, run the owning verifier-managed lane against the pre-change production implementation.
6. Accept red only when it demonstrates the required contract gap. A contractual assertion failure is preferred. Absence of an explicitly required public entry point may also be a valid red for a genuinely new API. Generic setup errors, unrelated type failures, missing fixtures, unrelated exceptions, timeouts, or wrong-environment failures are not valid red proof.
7. If the test unexpectedly passes before the fix, determine whether the behavior is already correct, the reproduction is wrong, or the proof is insensitive. Do not claim the intended defect is covered until this is resolved.
8. If faithful proof cannot be authored without unresolved architecture or brittle/duplicative coverage, stop and return the blocker instead of changing product code.
9. Hand the accepted proof to a different implementation agent/session.
10. Implement the minimum production change without modifying the accepted test expectations/assertions.
11. Run the same focused owning proof until it passes. A failing accepted proof is evidence against the implementation unless the test owner/architect independently revises the contract/proof.
12. Complete the remaining minimum acceptance set from `TEST IMPACT`; the initial red case does not cap final proof.
13. Review the resulting tests and production code independently under `project-review`; green execution alone does not validate the oracle.
14. Return to the top-level task. This skill does not run a separate final repository gate.

## Maintaining existing tests

An existing failing test is evidence against the changed implementation until one of these is independently established:

- the accepted contract intentionally changed;
- the test encoded behavior the project never owned;
- the test itself is technically invalid or uses an unfaithful environment.

When an implementation task requires a material change to existing behavioral proof, route that proof change through the test-author role before or separately from the implementation pass. The implementation agent must not opportunistically edit expectations while fixing production code.

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

- Using one implementation context to author both materially changed production behavior and its behavioral proof when a separate test-author context is available.
- Letting the implementation agent change accepted test expectations/assertions to make its code pass.
- Giving the test author implementation output as the oracle.
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
