---
name: component-contract-testing
description: 'Use when adding or reviewing Vue component tests for render, props, emits, slots, native-owner, ARIA, or child-component wiring contracts. Do not use it for browser behavior or visual appearance.'
---

# Component contract testing

Use this skill only for narrow Vue component contracts. These tests do not replace browser behavior or visual verification.

For every new or migrated public Material component, a colocated `<Component>.test.ts` is mandatory under `docs/material-3/component-testing.md`.

## Allowed scope

Component contract tests may cover:

- canonical defaults;
- conditional rendering independent of layout;
- public props, emits, and slots;
- native element selection;
- explicit `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` ownership;
- invalid combinations and documented normalization;
- controlled semantic-state wiring;
- simple child or foundation wiring;
- extracted helper/composable state connected to template output;
- structural regressions that are part of the accepted contract.

## Forbidden scope

Do not use component tests for behavior requiring a real browser:

- focus-visible, keyboard navigation, or accessibility interaction behavior;
- pointer, drag, touch, or mobile gestures;
- layout, scrolling, viewport, sticky/fixed, or responsive behavior;
- teleport, overlay, dialog, sheet, menu, tooltip, or popover lifecycle;
- browser APIs, storage permissions, or service workers;
- visual appearance such as hover, pressed, ripple, focus indicator, disabled rendering, elevation, shape, or motion;
- screenshot or computed-style assertions intended to prove appearance.

Use Playwright only when the component changes or constrains browser-owned behavior. Use visual tests only for appearance.

## Tooling

Use `@vue/test-utils`.

Do not hand-roll repeated `createApp`, body cleanup, ad hoc stubs, or `querySelector`-driven pseudo-e2e tests.

Prefer pure tests for reusable logic. Add a browser check only for user-visible behavior that cannot be proved at the contract layer.

## Material component contract

Cover applicable:

- canonical defaults;
- supported public configuration;
- supported semantic states;
- native owner and explicit attributes;
- slots and fixed anatomy;
- emits and controlled-state ownership;
- invalid combinations;
- documented project extensions;
- non-browser foundation wiring.

Do not reproduce visual coverage in unit tests. The canonical Storybook story owns accepted appearance: use `StateMatrix` only when multiple distinct visual routes exist, otherwise use one bounded ordinary story.

Do not use forced visual-state providers unless the assertion is narrowly about explicit wiring to an accepted provider and does not claim appearance or behavior.

## Assertions

Prefer:

- emitted events;
- native tag and explicit attributes;
- props passed to stubbed child components;
- slot content;
- accessible text or labels in the public contract;
- documented warning or normalization behavior.

Avoid:

- complete rendered-tree snapshots;
- internal class lists unrelated to public or foundation wiring;
- test ids added only for unit tests;
- assertions that duplicate the implementation rather than its contract.

## Reject or rewrite when

1. A realistic user flow belongs in Playwright.
2. The test asserts visual output, computed style, layout, focus-visible, or pointer state.
3. It asserts DOM details unrelated to the accepted contract.
4. It duplicates logic already covered by a helper/composable test.
5. It relies on happy-dom for behavior it cannot simulate accurately.
6. It grows into broad pseudo-e2e coverage.
7. A new or migrated component has no named contract coverage because browser or visual tests exist.