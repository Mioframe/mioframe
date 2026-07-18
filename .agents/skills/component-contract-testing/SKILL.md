---
name: component-contract-testing
description: 'Use for narrow Vue component tests covering public render, props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled state, invalid combinations, and non-browser wiring.'
---

# Component contract testing

Use this skill only for narrow Vue component contracts. These tests do not replace browser behavior or visual verification. Follow `docs/testing/architecture.md`; component-contract proof runs in the `unit-tests` execution lane through Vue Test Utils.

For every new or migrated public Material component, a colocated `<Component>.test.ts` contract test is mandatory in addition to Material-specific proof from `docs/material-3/component-testing.md`.

## Activation

Use for applicable:

- canonical defaults and supported public configuration;
- public props, emits, slots, and conditional rendering not dependent on layout;
- native element and explicit `href`, `type`, `disabled`, `readonly`, `tabindex`, `role`, and `aria-*` ownership;
- controlled semantic-state ownership;
- invalid public combinations and documented normalization;
- simple child or foundation wiring;
- extracted helper/composable state connected to template output;
- small structural invariants explicitly included in the public contract.

## Workflow

1. Name the stable public contract.
2. Confirm real browser semantics are not required.
3. Test the smallest representative set of configurations, states, invalid combinations, and explicit attributes.
4. Stub only direct dependencies whose public wiring is the assertion.
5. Assert public output or explicit child wiring.
6. Run focused `unit-tests`, then final verification.

See `## Forbidden` for behavior that requires a real browser or visual proof instead.

## Tooling

Use `@vue/test-utils`.

Do not hand-roll repeated `createApp`, body cleanup, ad hoc stubs, or `querySelector`-driven pseudo-e2e tests.

Prefer pure tests for reusable logic. Add a browser check only for user-visible behavior that cannot be proved at the contract layer.

## Normalization and fallback branches

When materially different input classes select different normalization or fallback branches, test each branch as its own contract.

For each applicable class, align assertions with:

- the actual returned, emitted, or rendered result;
- native semantics and accessibility output;
- the exact warning or error meaning;
- the documented public contract.

A generic warning assertion is insufficient when one input clamps to a determinate result while another is ignored, rejected, or falls back to an indeterminate mode. Do not assert only that "a warning occurred" when the warning text can misdescribe the branch that ran.

## Assertions

Prefer:

- emitted events;
- native tag and explicit attributes;
- props passed to stubbed child components;
- slot content;
- accessible text or labels in the public contract;
- exact documented warning, normalization, or fallback behavior for each materially different input class.

Avoid:

- complete rendered-tree snapshots;
- internal class lists unrelated to public or foundation wiring;
- test ids added only for unit tests;
- assertions that duplicate the implementation rather than its contract;
- generic substring warning checks that allow contradictory behavior descriptions to pass.

## Accessibility

This proof type owns native semantics, explicit ARIA ownership, accessible name, disabled/readonly semantics, and semantic-state wiring. Real focus order, keyboard operation, focus restoration, and actionability belong to browser proof.

## Commands

```bash
pnpm verify --only unit-tests --files <component-or-test-paths...>
```

## Forbidden

- focus-visible, keyboard navigation, pointer/touch, drag, or mobile gestures;
- layout, geometry, scrolling, responsive rendering, sticky/fixed positioning;
- overlay, teleport, dialog, sheet, menu, tooltip, or popover lifecycle;
- browser APIs, persistence, permissions, OPFS, or service workers;
- hover, pressed, ripple, focus-indicator, elevation, shape, motion, screenshots, or computed appearance;
- complete product flows through component stubs;
- duplicated deterministic logic already owned by `unit-testing`;
- forced visual-state assertions that claim appearance or behavior.

## Reject or rewrite when

1. A realistic user flow belongs in Playwright.
2. The test asserts visual output, computed style, layout, focus-visible, or pointer state.
3. It asserts DOM details unrelated to the accepted contract.
4. It duplicates logic already covered by a helper/composable test.
5. It relies on happy-dom for behavior it cannot simulate accurately.
6. It grows into broad pseudo-e2e coverage.
7. A new or migrated component has no named contract coverage because browser or visual tests exist.
8. Different normalization or fallback branches are collapsed into one assertion that does not prove their distinct outputs and warning meanings.
