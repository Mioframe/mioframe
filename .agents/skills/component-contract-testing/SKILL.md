---
name: component-contract-testing
description: 'Use when adding or reviewing Vue component tests for render, props, emits, slots, native-owner, ARIA, or child-component wiring contracts. Do not use it for browser behavior or visual appearance.'
---

# Component contract testing

Use this skill only for narrow Vue component contract tests. These tests are not a replacement for browser behavior or visual verification.

For new or migrated public Material components, a colocated `<Component>.test.ts` contract test is mandatory as part of `docs/material-3/component-testing.md`.

## Allowed scope

Component contract tests may cover:

- canonical defaults;
- conditional rendering that does not depend on layout;
- public props, emits, and slots contracts;
- native element selection;
- explicit `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` ownership;
- invalid public combinations and documented normalization;
- controlled semantic-state wiring;
- simple child/foundation-component wiring;
- connecting extracted composable or helper state to template output;
- small structural regressions where the assertion is about the component contract, not browser rendering.

## Forbidden scope

Do not use component contract tests for behavior that needs a real browser:

- focus, focus-visible, keyboard navigation, or accessibility interaction behavior;
- pointer, mouse, drag, touch, or mobile gestures;
- layout, scrolling, viewport sizing, sticky or fixed positioning;
- responsive behavior;
- teleport, overlay, dialog, sheet, menu, tooltip, or popover behavior;
- browser APIs, OPFS, persistence, storage permissions, or service workers;
- Material visual states such as hover, pressed, ripple, focus indicator, disabled appearance, elevation, shape, or motion;
- screenshot or computed-style assertions intended to prove appearance.

Use Playwright Storybook behavior tests or visual tests at the owning layer.

## Tooling rule

Use `@vue/test-utils` as the approved component contract test tool.

Do not hand-roll mounting with repeated `createApp`, manual `document.body` cleanup, ad hoc inline stubs, and `querySelector`-driven pseudo-e2e assertions.

Prefer extracting reusable pure behavior into a composable or helper and testing it with Vitest. Add a Playwright check for user-visible browser behavior.

## Material component contract

For a new or migrated Material component, cover all applicable blueprint contracts:

- canonical defaults;
- supported public configuration;
- supported semantic states;
- native owner and explicit attributes;
- slots and fixed anatomy;
- emits and controlled-state ownership;
- invalid combinations;
- documented project extensions;
- non-browser foundation wiring.

Do not reproduce the state matrix in unit tests. The canonical Storybook `StateMatrix` and its Playwright screenshot own visual-state coverage.

Do not use forced visual-state providers in component contract tests unless the assertion is narrowly about explicit wiring to an accepted provider and does not claim appearance or behavior.

## Assertion rule

Prefer assertions against stable contracts:

- emitted events;
- native tag and explicit attributes;
- props passed to stubbed child components;
- slot content;
- accessible text or labels when they are part of the user-visible contract;
- documented warning/normalization behavior when invalid combinations are accepted by the blueprint.

Avoid:

- complete rendered-tree snapshots;
- internal class lists unrelated to public or foundation wiring;
- test ids added only to make unit testing possible;
- assertions that duplicate component implementation rather than its contract.

## Review checklist

Reject or rewrite the test when:

1. It simulates a realistic user flow that belongs in Playwright.
2. It asserts visual output, computed style, layout, focus-visible, or pointer state.
3. It asserts DOM details unrelated to the accepted component contract.
4. It duplicates business logic assertions already covered by a composable/helper test.
5. It relies on happy-dom for behavior it cannot accurately simulate.
6. It grows into broad pseudo-e2e coverage.
7. A new or migrated Material component has no named contract coverage because browser or visual tests exist.
