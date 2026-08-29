---
name: test-authoring
description: 'Use in a separate test-author context when automated behavioral proof is added or materially changes its oracle, expectations, assertions, or accepted visual baseline.'
---

# Test authoring workflow

Follow `docs/testing/architecture.md` and the applicable proof-type skill. Use `test-first` when the accepted contract can be demonstrated with a meaningful red/green cycle.

This skill owns **proof quality and oracle independence**. It does not choose product architecture, invent proof ownership, change production behavior, or redefine verifier planning.

Use a separate test-author context from the production implementation context when:

- a new automated behavioral proof is required; or
- an existing proof materially changes expected behavior, assertions, oracle data, failure semantics, or an accepted visual baseline.

A separate test-author pass is not required for proof-only renames/moves, formatting, comment changes, mechanical ownership migration with unchanged assertions, or other changes that do not alter the proof oracle.

## Inputs

The test author starts from an accepted contract or scenario, not from the implementation it is expected to validate.

Record compactly:

```text
PROOF INTENT
- Contract/scenario:
- Oracle source:
- Primary proof owner:
- Must reject:
- Red phase: required | not applicable — <reason>
```

`Oracle source` must be independent from the production implementation under test. Valid sources include an accepted architecture/product/public contract, a reproducible defect, persisted/protocol compatibility rules, an authoritative platform/dependency contract, or independently accepted visual appearance.

`Must reject` names at least one plausible incorrect **observable** outcome that the proof must fail on.

## Universal quality gate

Before handing proof to implementation, confirm all applicable points:

1. **Contract, not code** — expected results come from the accepted oracle, not current implementation output.
2. **Failure sensitivity** — assertions reject the named `Must reject` outcome or another equally concrete contract-relevant wrong result.
3. **Faithful environment** — use the cheapest environment that actually reproduces the semantics under test.
4. **Public observation** — prefer public output, state, persisted effect, protocol result, accessible/rendered behavior, artifact behavior, or another owned observable result.
5. **Independent execution** — tests do not depend on execution order or mutable residue from another test.
6. **Controlled inputs** — own test data and control nondeterminism only where it is a real dependency of the contract.
7. **One coherent reason to fail** — avoid omnibus assertions that mix unrelated contracts.
8. **Representative coverage** — cover materially distinct required paths; do not enumerate theoretical permutations without distinct contract value.
9. **Refactor resilience** — behavior-preserving implementation rewrites should normally keep the proof green.
10. **No duplicate assurance** — do not repeat the same complete contract at several proof types merely for reassurance.

Coverage percentage, assertion count, snapshot count, mutation score, and number of scenarios are not goals by themselves.

## Oracle independence

Do not derive expected results from:

- the production helper/algorithm being tested;
- a copied implementation algorithm;
- implementation output captured and promoted to an expectation without an independent contract;
- mocks programmed so the assertion merely confirms the value injected by the test;
- private implementation state when the contract is externally observable;
- a regenerated screenshot solely because changed code produced different pixels.

When an existing expectation changes, the test-author must be able to state what independent contract changed or why the previous proof was invalid. The new implementation's observed behavior is not sufficient evidence.

## Red phase

When `test-first` applies, establish one focused red check before production edits.

The red result is meaningful only when it fails for the expected contract reason. Setup errors, wrong-environment failures, unrelated exceptions, timeouts, missing fixtures, or broken infrastructure do not demonstrate that the proof detects the defect.

If a faithful red phase is impossible or would require brittle/duplicative proof, mark it `not applicable` with the reason and continue with the minimum faithful acceptance proof. Do not manufacture a ceremonial failure.

## Proof routing

Use the proof type already selected by `TEST IMPACT` and `docs/testing/architecture.md`:

- deterministic domain/service/storage/CRDT/validation/migration/transformation behavior → `unit-testing`;
- Vue public API and deterministic component semantics → `component-contract-testing`;
- reusable real-browser focus/keyboard/pointer/touch/layout/scroll/overlay behavior → `ui-browser-behavior` as owner-local `behavior`;
- isolated browser/service/worker/runtime capability contracts → `ui-browser-behavior` as `browser-integration`;
- complete cross-boundary user goals → structural page/widget `e2e`;
- bounded accepted appearance → `visual-regression-testing` as owner-local `visual`;
- mutation sensitivity audit → `mutation-testing` after the primary deterministic proof is green;
- performance evidence → only for an accepted metric/budget with defined scenario and environment.

Release-sensitive behavior does not create a separate public verification type. Use the current public proof type that faithfully owns the contract (`static`, `browser-integration`, `e2e`, or another accepted type) and the current release architecture. Do not restore a public `release` type or `verify:release` workflow.

## Proof-specific rules

### Unit and deterministic behavior

Assert direct owned outcomes: returned values, state transitions, persisted records, protocol messages, cleanup/cancellation, or typed failures. Mock only genuine external or nondeterministic boundaries. Do not assert private branches, incidental call choreography, or copied algorithms.

### Vue component contracts

Prefer public semantics: role/name, label, visible text, public native/ARIA attributes, props/emits/slots, and explicit adapter mapping. Do not use component internals or `happy-dom` event dispatch to claim real browser focus, pointer, layout, scrolling, or lifecycle behavior.

### Browser behavior and browser integration

Use real public browser input and Playwright web-first/actionability-aware assertions. Avoid arbitrary sleeps, forced actions, retry loops, private renderer APIs, and test-order coupling. Story/fixture setup may establish preconditions but must not perform the behavior under test.

### Product E2E

Model a coherent user goal:

```text
owned starting state
→ public user action(s)
→ user-visible or durable product outcome
```

Lower-level setup may establish valid preconditions, but must not perform or short-circuit the user action/outcome being proved. Keep lower-level matrices at their truthful lower-level owner.

### Visual regression

Visual proof owns accepted stable appearance only. Stabilize deterministic rendering, capture the smallest readable owner surface, and inspect every changed baseline against an independently accepted appearance contract. Never accept a baseline by blind regeneration.

### Mutation

Mutation is a sensitivity audit, not a score target. Strengthen primary tests only when a meaningful surviving mutant represents a realistic wrong observable result that the accepted contract should reject.

### Performance

Before claiming performance proof, define the exact user-relevant metric, scenario/data size, environment, baseline or budget, and acceptable comparison method. Do not turn uncontrolled wall-clock observations into durable assertions.

## Handoff to implementation

After the test-author pass:

- production implementation is still untouched by this context;
- accepted expectations/assertions/oracle data are implementation inputs, not implementation-owned text;
- the implementation context may change production code and proof plumbing needed to execute the accepted test, but must not weaken or rewrite the accepted oracle merely to make the implementation pass;
- if implementation exposes a genuine contract/test defect, route the conflict back to the test-author/architect and resolve the oracle before continuing.

## Completion

The test-author pass is complete only when:

- every materially changed proof maps to an accepted contract/`TEST IMPACT` item;
- the oracle is independent from the production implementation;
- `Must reject` is concrete and the assertions are sensitive to it;
- the selected environment is faithful;
- the proof is deterministic and independently runnable enough for its owner;
- meaningful red evidence exists when required, or the no-red reason is explicit;
- no production behavior was implemented by the test-author merely to make proof pass.

## Forbidden

- Tests added only because a file changed or coverage is low.
- Expected values copied from current implementation output without an independent oracle.
- Production helpers/algorithms reused to calculate the expected result they are meant to prove.
- Mocks that reproduce the implementation or make assertions tautological.
- Private/internal assertions when a public observable contract exists.
- Inter-test order or mutable-state dependencies.
- E2E that performs the user action through private APIs.
- Browser proof that uses sleeps/force/recovery loops to hide actionability or lifecycle defects.
- Visual baselines accepted by blind regeneration.
- Mutation-score chasing.
- Exact performance timings without a defined representative environment/budget.
- Duplicating the same complete contract across proof types for reassurance.
- Editing production behavior in the test-author context.
