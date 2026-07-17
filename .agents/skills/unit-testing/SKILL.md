---
name: unit-testing
description: 'Use for pure, domain, service, storage, CRDT, validation, migration, normalization, filtering, sorting, matching, transformation, and deterministic module-boundary tests executed through the unit-tests lane.'
---

# Unit testing workflow

Follow `docs/testing/architecture.md`. This skill creates deterministic proof in the `unit-tests` execution lane. Use `component-contract-testing` for Vue public contracts and `ui-browser-behavior` for real browser semantics.

## Activation

Use when accepted behavior can be proved without browser rendering or a complete product flow, including:

- pure helpers and algorithms;
- schemas, validation, parsing, normalization, filtering, sorting, and matching;
- state transitions, cancellation, stale-result handling, and error precedence;
- migrations and data transformations;
- service, storage, CRDT, worker, and protocol behavior at deterministic boundaries;
- module-level integration where several real modules collaborate without browser or full application orchestration.

## Workflow

1. Name the observable contract and owner.
2. Choose direct inputs, outputs, state transitions, persisted effects, or typed errors that prove it.
3. Cover only applicable happy, boundary, invalid, cancellation, conflict, stale, rollback, and failure paths.
4. Use real owned modules where practical.
5. Mock only external or nondeterministic boundaries such as time, network, browser capability, provider client, process environment, or storage adapter.
6. Keep fixtures local and minimal.
7. Run the focused `unit-tests` check, then final verification.
8. Use `mutation-testing` only when its independent activation check passes.

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

Prefer focused pure tests plus one faithful product scenario when both algorithmic detail and cross-boundary outcome matter.

## Commands

```bash
pnpm verify --only unit-tests --files <source-or-test-paths...>
```

The verifier runs changed tests directly, resolves changed snapshots to their owning tests, and may use Vitest related-test selection for changed existing production or local test-support modules imported by tests. An unresolved snapshot, deleted/renamed dependency, config/setup, global test utility, dynamic-import boundary, generated alias, or unknown relation requires full-lane fallback as defined by `docs/testing/architecture.md`.

## Forbidden

- Do not reconstruct page, feature, browser, or complete product behavior through extensive mocks.
- Do not mock an owned module merely to assert that the mock was called.
- Do not extract a helper solely to make code testable when ownership or total complexity becomes worse.
- Do not use `happy-dom` for focus, pointer, layout, scrolling, overlay, responsive, or browser-lifecycle semantics.
- Do not duplicate component-contract, Storybook behavior, app E2E, or visual proof.