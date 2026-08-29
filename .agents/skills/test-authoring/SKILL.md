---
name: test-authoring
description: 'Use in a separate test-author context when automated contract proof is added or materially changes its oracle, expectations, assertions, failure semantics, or accepted visual baseline.'
---

# Test authoring workflow

Follow `docs/testing/architecture.md`, `test-first` when a meaningful red/green cycle applies, and the proof-type skill already selected by `TEST IMPACT`.

This skill owns **proof quality and oracle independence only**. It does not choose product architecture, change proof ownership, duplicate proof-type mechanics, implement production behavior, or redefine verifier planning.

## Activation

Use a separate test-author context from the production implementation context when:

- a new automated contract proof is required; or
- an existing proof materially changes its oracle, expected behavior, assertions, failure semantics, or accepted visual baseline.

A separate test-author pass is not required for proof-only renames/moves, formatting, comment changes, mechanical ownership migration with unchanged assertions, or other changes that do not alter the proof oracle.

The proof type and owner are inputs from the accepted architecture/`TEST IMPACT`. If they are unresolved, return to architecture instead of choosing a convenient test type here.

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

Detailed unit/component/browser/E2E/visual/mutation/performance mechanics remain owned by their existing proof-type skills. Do not restate or fork those rules here.

## Red phase

When `test-first` applies, establish one focused red check before production edits.

The red result is meaningful only when it fails for the expected contract reason. Setup errors, wrong-environment failures, unrelated exceptions, timeouts, missing fixtures, or broken infrastructure do not demonstrate that the proof detects the defect.

If a faithful red phase is impossible or would require brittle/duplicative proof, mark it `not applicable` with the reason. Do not manufacture a ceremonial failure.

## Handoff to implementation

After the test-author pass:

- production behavior remains untouched by this context;
- accepted expectations/assertions/oracle data are implementation inputs, not implementation-owned acceptance criteria;
- the implementation context may change production code and proof plumbing needed to execute the accepted proof, but must not weaken or rewrite the accepted oracle merely to make the implementation pass;
- if implementation exposes a genuine contract/proof defect, route the conflict back to the test-author/architect and resolve the oracle before continuing.

## Completion

The pass is complete only when:

- every materially changed proof maps to an accepted contract/`TEST IMPACT` item;
- the oracle is independent from the production implementation;
- `Must reject` is concrete and the assertions are sensitive to it;
- the selected environment and owner remain faithful to the accepted proof type;
- meaningful red evidence exists when required, or the no-red reason is explicit;
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
