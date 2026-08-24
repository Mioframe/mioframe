---
name: unit-testing
description: 'Use for deterministic pure, domain, service, storage, CRDT, validation, migration, normalization, filtering, sorting, matching, transformation, and module-boundary tests in the unit verification type.'
---

# Unit testing workflow

Follow `docs/testing/architecture.md`. This skill creates deterministic proof in the `unit` verification type. Use `component-contract-testing` for Vue public contracts and `ui-browser-behavior` for real browser semantics.

## Activation

Use when accepted behavior can be proved without browser rendering or a complete product flow, including pure helpers, schemas, state transitions, migrations, deterministic services/storage/CRDT/worker boundaries, and multi-module deterministic outcomes.

Do not describe service, storage, or CRDT boundary tests as pure behavior when they depend on owned state or collaboration. They remain deterministic behavior in the same verification type.

## Workflow

1. Name the observable contract and owner.
2. Choose direct inputs, outputs, state transitions, persisted effects, protocol messages, or typed errors that prove it.
3. Cover only applicable happy, boundary, invalid, cancellation, conflict, stale, rollback, and failure paths.
4. Use real owned modules where practical.
5. Mock only external or nondeterministic boundaries such as time, network, browser capability, provider client, process environment, or storage adapter.
6. Keep fixtures local and minimal.
7. Add imports that truthfully connect the test to the owned source; do not add artificial imports only for resolver selection.
8. Run focused `unit` verification and return to the top-level workflow.
9. Use `mutation-testing` only for registered or explicitly audited high-risk logic.

## Assertions

Prefer direct outcomes, state before/after, persisted records, protocol messages, exact contractual errors, ordering/normalization results, and cleanup/cancellation outcomes.

Avoid private methods, incidental call order, broad non-contractual snapshots, framework lifecycle assertions, mocks that reproduce the implementation, and tests added only to increase coverage.

## Commands

```bash
pnpm verify --only unit --files <exact-owning-test-paths...>
```

Until unit-impact migration is implemented, prefer exact owning test files. A production source path is valid only when the current relation is confirmed.

After focused proof is complete, return the implementation to its owning workflow. For PR work, GitHub CI on the exact PR head is the authoritative repository gate. Do not require a broad local `pnpm verify` merely to complete this skill.

## Forbidden

- reconstructing page, feature, browser, or complete product behavior through extensive mocks;
- mocking an owned module merely to assert that the mock was called;
- extracting helpers solely for testability when ownership or total complexity becomes worse;
- using `happy-dom` for focus, pointer, layout, scrolling, overlay, responsive, or browser-lifecycle semantics;
- duplicating component-contract, Storybook behavior, application E2E, or visual proof;
- adding artificial imports or wrappers only to influence automatic test selection.
