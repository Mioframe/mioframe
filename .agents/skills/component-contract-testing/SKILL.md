---
name: component-contract-testing
description: 'Use for narrow Vue component tests covering public render, props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled state, invalid combinations, and non-browser wiring.'
---

# Component contract testing

Follow `docs/testing/architecture.md`. Component-contract proof runs in the `unit-tests` execution lane through Vue Test Utils.

Every new or migrated public `MD*` adapter requires a colocated `<Component>.test.ts` component-contract test. Material adapter details and additional proof requirements are defined by `src/shared/ui/material/docs/component-adapter.md`.

## Activation

Use for applicable:

- canonical defaults and supported public configuration;
- public props, emits, slots, and conditional rendering not dependent on layout;
- native element and explicit `href`, `type`, `disabled`, `readonly`, `tabindex`, `role`, and `aria-*` ownership;
- controlled semantic-state ownership;
- invalid public combinations and documented normalization;
- simple child or foundation wiring;
- explicit custom-element property, attribute, event, slot, and documented CSS-variable mapping owned by a public adapter;
- small structural invariants explicitly included in the public contract.

## Workflow

1. Name the stable public contract.
2. Confirm real browser semantics or computed rendered appearance are not required for each assertion.
3. Test the smallest representative set of configurations, states, invalid combinations, explicit attributes, and adapter mappings.
4. For CSS mapping, assert only the adapter-owned public-to-documented-renderer wiring available at the Vue boundary.
5. Route proof that an override changes geometry, color, motion, focus, or another rendered effect to real browser behavior or visual proof.
6. Stub only direct dependencies whose public wiring is the assertion.
7. Assert public output or explicit child wiring.
8. Run focused `unit-tests`, then final verification.

## Assertions

Prefer emitted events, native tags and attributes, direct-child props, slots, accessible names, documented warning/normalization output, and explicit custom-element mapping visible at the Vue boundary.

A custom-property declaration, alias, or resolved value does not by itself prove that the token is an active public contract. Unit proof may establish that the adapter maps a retained public token to a documented renderer input; browser proof must establish any claimed rendered effect.

Avoid complete rendered-tree snapshots, incidental internal classes, test-only ids, template restatement, private renderer DOM, computed appearance, and broad global mock sets.

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
- forced visual-state assertions that claim appearance or behavior;
- private m3e shadow DOM, Lit internals, or renderer implementation details;
- reading a custom property's value and presenting that alone as proof of a public token contract or observable renderer behavior.