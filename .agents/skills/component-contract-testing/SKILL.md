---
name: component-contract-testing
description: 'Use for narrow Vue component tests covering public render, props, emits, slots, native-owner, explicit attributes, ARIA ownership, controlled state, invalid combinations, and non-browser child or foundation wiring.'
---

# Component contract testing

Follow `docs/testing/architecture.md`. This skill owns only Vue public contracts that can be proved without real browser semantics. It is not a substitute for Storybook browser behavior, app e2e, or visual regression.

For every new or migrated public Material component, a colocated `<Component>.test.ts` contract test is mandatory in addition to the Material-specific proof defined by `docs/material-3/component-testing.md`.

## Allowed scope

Component contract tests may cover applicable:

- canonical defaults and supported public configuration;
- conditional rendering that does not depend on layout;
- public props, emits, and slots;
- native element selection;
- explicit `href`, `type`, `disabled`, `readonly`, `tabindex`, `role`, and `aria-*` ownership;
- controlled semantic-state ownership;
- invalid public combinations and documented normalization;
- simple child or foundation-component wiring;
- connecting extracted composable or helper state to template output;
- small structural invariants that are part of the accepted component contract.

## Forbidden scope

Do not use component contract tests to prove:

- focus, focus-visible, keyboard navigation, or accessibility interaction behavior;
- pointer, mouse, drag, touch, or mobile gestures;
- layout, geometry, scrolling, viewport sizing, sticky or fixed positioning;
- responsive behavior;
- teleport, overlay, dialog, sheet, menu, tooltip, or popover lifecycle;
- browser APIs, OPFS, persistence, permissions, or service workers;
- hover, pressed, ripple, focus-indicator, disabled appearance, elevation, shape, or motion output;
- screenshots or computed styles intended to prove appearance;
- complete product flows through broad component stubbing.

Route reusable browser-owned behavior to `ui-browser-behavior`. Route appearance to `visual-regression-testing`. Route extracted pure decisions to focused unit tests.

## Tooling

Use `@vue/test-utils`.

Do not hand-roll repeated `createApp` mounting, global body cleanup, ad hoc inline component replicas, or `querySelector`-driven pseudo-e2e harnesses. Reuse a local helper only when it keeps the contract clearer and does not hide setup or ownership.

## Workflow

1. Name the stable public contract.
2. Confirm it does not require browser rendering or interaction semantics.
3. Test the smallest representative set of defaults, configurations, states, invalid combinations, and explicit attributes needed to prove that contract.
4. Stub only direct dependencies whose wiring is the assertion. Do not recreate upper-layer behavior.
5. Assert public output or explicit child wiring.
6. Run focused unit verification, then final verification.

## Material component contract

For a new or migrated Material component, cover all applicable accepted blueprint contracts:

- canonical defaults;
- supported public configuration;
- supported semantic states and controlled ownership;
- native owner and explicit attributes;
- slots and fixed anatomy;
- emits;
- invalid combinations and normalization;
- documented Mioframe extensions;
- non-browser foundation wiring.

Do not reproduce the visual state matrix in unit tests. Do not use forced visual-state providers except for a narrow assertion that the component passes an accepted provider contract; such a test must not claim appearance or browser behavior.

## Assertion rules

Prefer:

- emitted events;
- native tag and explicit attributes;
- props passed to a stubbed direct child;
- slot content;
- accessible text or labels when contractual;
- documented warning or normalization output.

Avoid:

- complete rendered-tree snapshots;
- internal class lists unrelated to accepted public or foundation wiring;
- test ids added only for unit tests;
- assertions that restate template implementation;
- large global mock sets that reconstruct a page or product flow.

## Reject or rewrite when

1. The test simulates a realistic user flow that belongs in Playwright.
2. It asserts layout, computed appearance, focus-visible, pointer state, or browser lifecycle.
3. It depends on DOM details not named by the accepted contract.
4. It duplicates pure logic already owned by a helper or composable test.
5. It relies on `happy-dom` for semantics it cannot model.
6. It has grown into pseudo-integration coverage through broad stubbing.
7. The same contract is already fully proved at another layer.
8. A new or migrated Material component lacks its mandatory named contract coverage.
