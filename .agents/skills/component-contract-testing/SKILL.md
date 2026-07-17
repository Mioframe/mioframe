---
name: component-contract-testing
description: 'Use for narrow Vue component tests covering public render, props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled state, invalid combinations, and non-browser wiring.'
---

# Component contract testing

Follow `docs/testing/architecture.md`. Component-contract proof runs in the `unit-tests` execution lane through Vue Test Utils.

For every new or migrated public Material component, a colocated `<Component>.test.ts` contract test is mandatory in addition to Material-specific proof from `docs/material-3/component-testing.md`.

## Activation

Use for applicable:

- canonical defaults and supported public configuration;
- public props, emits, slots, and conditional rendering not dependent on layout;
- native element and explicit `href`, `type`, `disabled`, `readonly`, `tabindex`, `role`, and `aria-*` ownership;
- controlled semantic-state ownership;
- invalid public combinations and documented normalization;
- simple child or foundation wiring;
- small structural invariants explicitly included in the public contract.

## Workflow

1. Name the stable public contract.
2. Confirm real browser semantics are not required.
3. Test the smallest representative set of configurations, states, invalid combinations, and explicit attributes.
4. Stub only direct dependencies whose public wiring is the assertion.
5. Assert public output or explicit child wiring.
6. Run focused `unit-tests`, then final verification.

## Assertions

Prefer emitted events, native tags and attributes, direct-child props, slots, accessible names, and documented warning/normalization output.

Avoid complete rendered-tree snapshots, incidental internal classes, test-only ids, template restatement, and broad global mock sets.

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
- duplicated pure logic already owned by `unit-testing`;
- forced visual-state assertions that claim appearance or behavior.
