---
name: test-authoring
description: 'Use in a separate test-author context when an assertion-bearing automated test/spec is added or materially changes its oracle, expectations, assertions, or failure semantics, or when an intentional visual-baseline change needs independent acceptance.'
---

# Test authoring workflow

Follow `docs/testing/architecture.md` and the applicable proof-type skill when one exists. `TEST IMPACT` already selects the proof type and owner.

This skill owns **proof oracle quality, failure sensitivity, and independent proof acceptance**. For new or materially changed non-visual assertion-bearing proof it also owns pre-implementation RED evidence when a meaningful red phase exists. It does not choose product architecture, change proof ownership, duplicate proof-type mechanics, implement production behavior, or redefine verifier planning.

## Activation

Use a separate test-author context from the production implementation context when:

- a new assertion-bearing automated test/spec is required;
- an existing test/spec materially changes its oracle, expected behavior, assertions, or failure semantics; or
- an intentional visual change requires a new or changed accepted baseline.

A separate test-author pass is not required for static verifier/check implementation, mutation-target registration, ownership/applicability metadata, proof-only renames/moves, formatting, comments, mechanical ownership migration with unchanged assertions, or other changes that do not add or alter an assertion oracle or accepted visual result.

The proof type and owner are inputs from the accepted architecture/`TEST IMPACT`. Test authorship is an execution-context boundary, not a new proof owner or verification type. If type or owner is unresolved, return to architecture instead of choosing a convenient test type here.

## PROOF INTENT

Record compactly before authoring or materially changing the proof:

```text
PROOF INTENT
- Contract/scenario:
- Oracle source:
- Primary proof owner:
- Must reject:
- Red phase: required | not applicable — <reason>
```

`Oracle source` must be independent from the production implementation under test. Valid sources include an accepted architecture/product/public contract, a reproducible defect with required corrected behavior, persisted/protocol compatibility rules, an authoritative platform/dependency contract, or independently accepted visual appearance.

`Must reject` names at least one plausible incorrect **observable** outcome that the proof must fail on.

## Independent oracle

Expected results must come from the accepted oracle, not from the code being implemented.

Do not derive expectations from:

- the production helper/algorithm being tested;
- a copied implementation algorithm;
- implementation output captured and promoted to an expectation without independent justification;
- mocks/fixtures programmed so the assertion merely confirms the value injected by the test;
- private implementation state when the required contract is externally observable;
- a regenerated screenshot solely because changed code produced different pixels.

When an existing expectation changes, state what independent contract changed or why the previous proof was invalid. The new implementation's observed behavior is not sufficient evidence.

## Proof quality gate

Before handoff, confirm all applicable points:

1. **Failure sensitivity** — assertions reject `Must reject` or another equally concrete contract-relevant wrong result.
2. **Faithful environment** — the selected proof environment can actually reproduce the semantics being claimed.
3. **Public observation** — assertions observe the owned contract rather than a private proxy that could remain correct while the required result is wrong.
4. **Independent execution** — proof does not depend on test order or mutable residue from another test.
5. **Controlled inputs** — test data and real nondeterministic boundaries are controlled enough for deterministic evidence.
6. **Refactor resilience** — a behavior-preserving implementation rewrite should normally keep the proof green.
7. **No duplicate assurance** — another proof type is added only for a distinct contract/risk boundary, not reassurance.

Coverage percentage, assertion count, snapshot count, mutation score, or number of scenarios are not goals by themselves.

Detailed unit/component/browser/E2E/visual/mutation mechanics remain owned by their existing applicable proof-type skills and `docs/testing/architecture.md`. Persistent performance proof follows the architecture contract even though there is currently no separate performance-testing skill; do not invent one here.

## Red phase

When `TEST IMPACT` marks a meaningful red phase as required for new/materially changed non-visual assertion-bearing proof, the test-author context owns that RED evidence before production implementation begins.

Run the smallest faithful verifier-managed proof selected by the owning proof-type workflow. The red result is meaningful only when it fails for the expected contract reason. Setup errors, wrong-environment failures, unrelated exceptions, timeouts, missing fixtures, or broken infrastructure do not demonstrate that the proof detects the defect.

If a faithful red phase is impossible or would require brittle/duplicative proof, mark it `not applicable` with the reason and return that correction to the preflight/test-first decision. Do not manufacture a ceremonial failure.

For an intentional visual change, a new accepted baseline often cannot exist before the new rendering exists. In that case RED is normally `not applicable`: before implementation, establish the visible contract and visual-spec intent; after implementation, return in a fresh test-author/visual pass to create and inspect the baseline under `visual-regression-testing`.

## Handoff to implementation

For new/materially changed non-visual assertion-bearing proof:

- production behavior remains untouched by the test-author context;
- accepted test/spec files and their oracle/expectations/assertions are read-only to the production implementation context until the first GREEN result;
- the implementation context changes production code only to satisfy the accepted contract, then reruns the same focused proof;
- if the accepted proof cannot execute or a genuine contract/proof defect is discovered, route the conflict back to the test-author/architect instead of editing proof in the implementation context.

For intentional visual-baseline changes:

- the pre-implementation handoff freezes the visible contract and visual-spec intent, not pixels that do not yet exist;
- production implementation may change rendering but must not create, regenerate, or approve the expected baseline;
- after rendering exists, baseline creation/acceptance is performed in a fresh test-author context following `visual-regression-testing`, then verifier-managed visual proof must be green.

Any additional new or materially changed assertion-bearing proof required later by `TEST IMPACT` returns through `test-authoring` before it is authored or accepted.

## Completion

The pass is complete only when:

- every new/materially changed proof maps to an accepted contract/`TEST IMPACT` item;
- the oracle is independent from the production implementation;
- `Must reject` is concrete and the assertions are sensitive to it;
- the selected environment and owner remain faithful to the accepted proof type;
- meaningful RED evidence exists when required, or the no-red reason is explicit;
- intentional visual baseline changes are independently inspected/accepted after rendering exists rather than approved by the production implementation context;
- no production behavior was implemented by the test-author merely to make proof pass.

## Forbidden

- Tests added only because a file changed or coverage is low.
- Expectations copied from current implementation output without an independent oracle.
- Production helpers/algorithms reused to calculate the expected result they are meant to prove.
- Tautological mocks/fixtures or private proxies used as substitutes for the owned observable result.
- Existing assertions/baselines weakened or regenerated solely because the new implementation otherwise fails.
- Test-order or mutable-state coupling used as part of the oracle.
- Duplicating the same complete contract across proof types for reassurance.
- Editing production behavior in the test-author context.
- Letting the production implementation context edit accepted non-visual proof before the first GREEN result.
- Letting the production implementation context create or approve an intentional visual baseline change.
