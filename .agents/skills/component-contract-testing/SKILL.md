---
name: component-contract-testing
description: 'Use this skill when adding or reviewing Vue component unit tests for small render, props, emits, slots, or child-component wiring contracts. Do not use it for browser behavior; use Playwright or a browser smoke check instead.'
---

# Component contract testing

Use this skill only for narrow Vue component contract tests. These tests are not a replacement for browser verification.

## Allowed scope

Component contract tests may cover:

- conditional rendering that does not depend on layout;
- props, emits, and slots contracts;
- simple child-component wiring;
- connecting extracted composable or helper state to template output;
- small render regressions where the assertion is about component structure, not browser behavior.

## Forbidden scope

Do not use component unit tests for behavior that needs a real browser:

- focus, keyboard navigation, or accessibility interaction semantics;
- pointer, mouse, drag, touch, or mobile gestures;
- layout, scrolling, viewport sizing, sticky or fixed positioning;
- responsive behavior;
- teleport, overlay, dialog, sheet, menu, tooltip, or popover behavior;
- browser APIs, OPFS, persistence, storage permissions, or service workers;
- Material visual states such as hover, pressed, ripple, focus ring, or disabled visuals.

Use Playwright/e2e or a reproducible browser smoke check for those cases.

## Tooling rule

Do not hand-roll component mounting with repeated `createApp`, manual `document.body` cleanup, ad hoc inline stubs, and `querySelector`-driven assertions.

Use `@vue/test-utils` as the approved component contract test tool. Keep tests small and contract-focused.

Prefer extracting reusable behavior into a composable or pure helper and testing it with Vitest. Add a Playwright check for user-visible browser behavior.

## Assertion rule

Prefer assertions against stable contracts:

- emitted events;
- props passed to stubbed child components;
- slot content;
- accessible text or labels when they are part of the user-visible contract.

Avoid adding `data-testid` only to make a unit test possible. Add a test id only when there is no stable user-visible or component-level contract to assert.

## Review checklist

Reject or rewrite the test when:

1. It simulates a realistic user flow that belongs in Playwright.
2. It asserts DOM details unrelated to the component contract.
3. It duplicates business logic assertions already covered by a composable/helper test.
4. It relies on happy-dom for behaviors it cannot accurately simulate, such as layout or visibility.
5. It grows into broad pseudo-e2e coverage.
