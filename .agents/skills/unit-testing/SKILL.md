---
name: unit-testing
description: 'Use for deterministic pure, domain, service, storage, CRDT, validation, migration, normalization, filtering, sorting, matching, transformation, and module-boundary tests in the unit-tests lane.'
---

# Unit testing workflow

Follow `docs/testing/architecture.md`. This skill creates deterministic proof in the `unit-tests` lane. Use `component-contract-testing` for Vue public contracts and `ui-browser-behavior` for real browser semantics.

## Activation

Use when accepted behavior can be proved without browser rendering or a complete product flow, including:

- pure helpers and algorithms;
- schemas, validation, parsing, normalization, filtering, sorting, and matching;
- state transitions, cancellation, stale-result handling, and error precedence;
- migrations and data transformations;
- service, storage, CRDT, worker, and protocol behavior at deterministic boundaries;
- module-level integration where several real modules collaborate without browser or full application orchestration.

Do not describe service, storage, or CRDT boundary tests as pure behavior when they depend on owned state or collaboration. They remain deterministic behavior in the same execution lane.

## Workflow

1. Name the observable contract and owner.
2. Choose direct inputs, outputs, state transitions, persisted effects, protocol messages, or typed errors that prove it.
3. Cover only applicable happy, boundary, invalid, cancellation, conflict, stale, rollback, and failure paths.
4. Use real owned modules where practical.
5. Mock only external or nondeterministic boundaries such as time, network, browser capability, provider client, process environment, or storage adapter.
6. Keep fixtures local and minimal.
7. Add imports that truthfully connect the test to the owned source; do not add artificial imports only for resolver selection.
8. Run focused `unit-tests` and return to the top-level task. This skill does not run a separate final gate.
9. Use `mutation-testing` only for registered or explicitly audited high-risk logic.

## Assertions

Prefer:

- direct return values and typed outcomes;
- state before/after an operation;
- persisted records or protocol messages owned by the tested boundary;
- exact error type/code and precedence when contractual;
- inclusion/exclusion, ordering, normalization, and fallback results;
- cleanup and cancellation outcomes.

Avoid:

- internal call order or call counts unless the boundary contract requires them;
- private methods and implementation branches;
- broad snapshots of objects whose fields are not contractual;
- mocks that reproduce the implementation;
- framework lifecycle assertions;
- tests added only to increase coverage or mutation score.

## Module-level integration

A deterministic multi-module test remains in the `unit-tests` lane when it uses real collaborating modules and proves a boundary result without reconstructing the application.

Do not call a test “integration” to justify:

- mounting a page through many component stubs;
- rebuilding worker/service orchestration through global mocks;
- simulating browser APIs in `happy-dom`;
- duplicating a product E2E scenario.

Prefer focused deterministic tests plus one faithful product scenario when both internal decision detail and cross-boundary outcome matter.

## Commands

```bash
pnpm verify --only unit-tests --files <exact-owning-test-paths...>
```

Until unit-impact migration is implemented, prefer exact owning test files. A production source path is valid only when the current relation is confirmed; do not assume the target related-test resolver already exists.

The top-level task later runs one final read-only project verification.

## Forbidden

- reconstructing page, feature, browser, or complete product behavior through extensive mocks;
- mocking an owned module merely to assert that the mock was called;
- extracting a helper solely to make code testable when ownership or total complexity becomes worse;
- using `happy-dom` for focus, pointer, layout, scrolling, overlay, responsive, or browser-lifecycle semantics;
- duplicating component-contract, Storybook behavior, application E2E, or visual proof;
- adding artificial imports or wrappers only to influence automatic test selection.
