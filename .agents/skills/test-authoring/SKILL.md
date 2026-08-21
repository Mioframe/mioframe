---
name: test-authoring
description: 'Use in the dedicated test-author agent/session to turn accepted TEST IMPACT into the minimum faithful proof. Applies proof-type quality rules so tests protect observable contracts rather than implementation details, coverage numbers, or the implementation agent output.'
---

# Test authoring workflow

Follow `docs/testing/architecture.md` and `test-first`.

This skill owns **test-author quality**, not proof selection or production implementation:

- architecture / `TEST IMPACT` decides what contract needs proof and the truthful primary proof owner;
- `test-first` owns independent test-author context, oracle independence, and meaningful red/green when applicable;
- this skill owns how the dedicated test author turns that accepted contract into useful, maintainable proof;
- proof-type skills own Mioframe-specific mechanics and placement;
- `verification` owns focused execution mechanics and exact-head CI remains architect-owned.

The goal is not more tests. The goal is the smallest proof that would reject a realistic wrong implementation while remaining stable under behavior-preserving refactoring.

## Universal quality gate

Before accepting any new or materially changed behavioral proof, confirm all applicable points:

1. **Contract, not code** — the assertion derives from the accepted observable contract/oracle, not from the implementation being written.
2. **Failure sensitivity** — the test rejects the `Must reject` outcome from `TEST IMPACT` or another equally concrete contract-relevant wrong result.
3. **Faithful environment** — use the cheapest environment that actually reproduces the semantics under test; do not simulate browser behavior in a non-browser environment.
4. **Public observation** — assert public output, state, persisted effect, protocol result, accessible/rendered behavior, release artifact behavior, or another owned observable outcome rather than private structure.
5. **Independent execution** — a test must not require another test to run first or leave mutable state that makes later tests pass/fail.
6. **Controlled inputs** — own test data and nondeterminism. Control time, randomness, network/provider boundaries, and mutable persistence only where they are real dependencies of the contract.
7. **One coherent reason to fail** — keep one test/scenario focused enough that a failure identifies the broken contract. Split unrelated behaviors instead of building omnibus tests.
8. **Representative coverage** — cover materially distinct happy, boundary, invalid, failure, cancellation, compatibility, platform, or state paths required by current risk; do not enumerate theoretical permutations without distinct contract value.
9. **Refactor resilience** — if internals change while observable behavior remains correct, the test should normally continue to pass.
10. **No duplicate assurance** — do not repeat the same complete contract at unit, component, browser, E2E, visual, and release levels. Add another proof type only for a distinct integration/risk boundary.

Coverage percentage, assertion count, snapshot count, mutation score, or number of scenarios are never goals by themselves.

## Deterministic behavior / unit proof

Use `unit-testing`.

Write these tests around direct domain/service/storage/CRDT/module contracts:

- arrange explicit inputs and owned pre-state;
- execute the real owned unit/module boundary;
- assert outputs, transitions, persisted records, protocol messages, cleanup/cancellation, or typed failures;
- prefer real fast/reliable owned dependencies;
- mock only genuine external or nondeterministic boundaries, and restore mocks/fake time/state after each test;
- include boundary and failure cases when they are materially distinct from the happy path;
- keep fixtures minimal enough that expected outcomes are obvious from the contract.

Do not:

- mock the unit under test;
- mock every internal dependency and then assert call choreography;
- assert private methods, internal branches, incidental call order, or framework lifecycle;
- copy the production algorithm into the expected-value calculation;
- add tests only to raise line/branch coverage.

A useful unit test should survive a behavior-preserving rewrite of the implementation.

## Vue component contract proof

Use `component-contract-testing`.

For rendered/public DOM semantics, prefer selectors and assertions that correspond to public semantics:

1. role + accessible name;
2. label / visible text / other user-perceivable semantic attribute;
3. explicit public native/ARIA attribute;
4. test id only when no stable public semantic selector exists.

Direct Vue-level assertions remain valid when the contract itself is a Vue public API seam such as props, emits, slots, controlled state, or explicit adapter mapping. They must not be used to claim browser-owned behavior.

Do not:

- select by incidental CSS class or private DOM nesting when a public semantic locator exists;
- assert component instances, private child state, lifecycle, or renderer internals;
- use broad rendered-tree snapshots as a substitute for explicit public assertions;
- treat `happy-dom` event dispatch as proof of real focus, keyboard, pointer, layout, scrolling, overlay, or browser lifecycle behavior.

## Reusable browser behavior

Use `ui-browser-behavior` with the Storybook-owned lane.

Test as a user or browser would interact with the reusable UI:

- start from a deterministic isolated story/fixture state;
- use real public keyboard, pointer, touch, focus, scrolling, viewport, or browser-capability input;
- locate elements primarily by role, accessible name, label, or stable user-facing contract rather than DOM structure/CSS;
- use Playwright web-first/actionability-aware assertions for asynchronously rendered outcomes;
- assert the exact public observable result, not an internal proxy;
- keep every test independently runnable with its own state;
- let the story establish preconditions only; the spec performs the behavior under test.

Do not use arbitrary sleeps, forced actions, manual polling when a web-first assertion expresses the contract, test-order dependencies, screenshots as behavioral assertions, or private component/renderer APIs.

## Product E2E scenarios

Use `ui-browser-behavior` with application `e2e`.

An application E2E spec represents a coherent **user goal**, not an implementation walkthrough.

Required shape:

```text
owned starting state
→ user-observable/public action(s)
→ user-visible or durable product outcome
```

Rules:

- perform the action being tested through the same public UI/browser surface available to the user whenever that action is part of the user scenario;
- lower-level setup APIs may create valid preconditions, but must not perform or short-circuit the user action/outcome under test;
- prefer role/name/label/user-facing locators and Playwright web-first assertions;
- isolate each scenario's browser/persistence/test data so execution order does not matter;
- control third-party/network/provider responses when Mioframe does not own their behavior; test Mioframe's handling of that boundary, not the third party itself;
- assert the final user-visible or durable product result, including persistence/reload outcome when that is part of the scenario;
- keep the scenario at the smallest product boundary that actually needs E2E. Do not repeat lower-level algorithm/state matrices already faithfully owned by unit/component/browser proof.

Forbidden E2E shortcuts include invoking private handlers/component methods, mutating implementation state to perform the action under test, brittle CSS/XPath traversal when a public locator exists, test-order coupling, recovery loops, arbitrary sleeps, and assertions on internal implementation state instead of the user/product outcome.

## Visual regression

Use `visual-regression-testing`.

Visual proof owns accepted **stable appearance only**.

- render one deterministic canonical state;
- keep browser/runtime/OS/font conditions equivalent to the environment that owns the accepted baseline;
- wait for fonts, icons, assets, async fixture readiness, and stable rendering;
- settle or disable animation only to reach the accepted stable state; never claim that this proves motion behavior;
- capture the smallest readable surface that owns the visual contract;
- mask/stabilize genuinely nondeterministic content rather than accepting random pixel noise;
- inspect every changed baseline against the accepted visual contract before accepting it.

Never regenerate or update a baseline merely because the new implementation produced different pixels. A changed baseline is a proposed contract change until independently accepted.

Do not add screenshots for invisible/non-stable implementation details, exhaustive renderer states, interaction semantics, accessibility behavior, or numeric geometry that should be asserted by a more faithful proof.

## Release behavior

Release proof exists only for behavior that can differ in the **built/deployable artifact** from development/runtime-source proof.

- build the production artifact through the repository-owned release path first;
- test the artifact that would be served/deployed, not the Vite dev server or source modules as a proxy;
- use deterministic release/build inputs where the release contract requires identity/reproducibility;
- assert externally observable artifact contracts: bootstrap, base/routing, manifest/PWA assets, worker/controller/update lifecycle, persisted compatibility, first/returning-user behavior, publication/import seams, or other accepted release invariants;
- preserve real browser/lifecycle boundaries when the release defect can only exist there;
- do not duplicate ordinary product E2E inside release proof unless the production artifact boundary materially changes the risk.

A source import test can own a specific Node/module compatibility seam, but it cannot substitute for browser/artifact behavior that only exists after build.

## Mutation testing

Use `mutation-testing` only after the primary deterministic proof is green.

Mutation is a **test-sensitivity audit**, not a coverage target:

- mutate only registered/audited high-risk production logic, never test files;
- inspect each survived/no-coverage mutant in terms of the accepted observable contract;
- strengthen tests when a meaningful surviving mutant represents a realistic wrong outcome that should have been rejected;
- do not add implementation-detail assertions merely to increase mutation score;
- do not change production behavior solely to kill an equivalent or irrelevant mutant;
- mutation score is a summary signal, not an acceptance objective by itself.

## Accessibility proof

Accessibility is not one substitute test category; it is distributed across faithful owners:

- component contract: semantic HTML/native role, accessible name, ARIA ownership, disabled/readonly semantics;
- browser/E2E: actual focus order, keyboard operation, focus restoration, actionability, overlay containment, and capability behavior;
- visual: appearance only, never accessibility conformance;
- automated axe/scan results: supplemental detection of automatable issues only.

An automated accessibility scan can catch useful violations but cannot establish overall accessibility or replace keyboard/focus/user-observable proof for owned scenarios.

## Performance evidence

Add performance proof only for an accepted performance claim or durable budget.

Before measurement define:

- exact user-relevant metric;
- scenario/data size;
- device/browser/runtime conditions;
- baseline or numeric budget;
- acceptable variance and comparison method when measurement is noisy.

Use representative data and the lowest faithful environment. Prefer durable budgets/thresholds for stable requirements rather than brittle exact timings. Do not claim an optimization from one uncontrolled run, a different machine/environment, or an unrelated proxy metric.

Performance evidence does not replace correctness proof, and correctness tests should not carry arbitrary timing assertions unless timing itself is the accepted contract.

## Test-author completion

The test-author pass is complete only when:

- every changed proof maps to an accepted contract/`TEST IMPACT` item;
- the independent oracle and `Must reject` outcome remain intact;
- the chosen proof environment is faithful;
- required tests are deterministic/isolated enough to run independently;
- no test exists solely for coverage, score, snapshot count, or implementation mirroring;
- meaningful red proof is demonstrated when `test-first` requires it, or the accepted reason for no red phase is recorded;
- no production behavior was implemented by the test-author merely to make proof pass.

Hand the accepted proof to the separate implementation context. If the implementation later disputes the proof, route the conflict back through a fresh test-author/architect decision rather than letting implementation rewrite its own acceptance criteria.

## Forbidden

- Tests added only because a file changed or a coverage number is low.
- Tests whose expected result is copied from current implementation output without an independent oracle.
- Private/internal assertions when a public observable contract exists.
- Mocks that reproduce the implementation or make the assertion tautological.
- Inter-test ordering/state dependencies.
- E2E that performs the user action through private/internal APIs.
- Browser tests using sleeps/force/retry loops to hide actionability or lifecycle defects.
- Visual baselines accepted by blind regeneration.
- Accessibility scans presented as complete accessibility proof.
- Mutation-score chasing.
- Exact performance timings without a defined representative environment/budget.
- Duplicating the same complete contract across proof types for reassurance.
