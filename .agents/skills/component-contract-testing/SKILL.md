---
name: component-contract-testing
description: 'Use for narrow Vue component tests covering public render, props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled state, invalid combinations, typed adapter wiring, and non-browser contracts.'
---

# Component contract testing

Follow `docs/testing/architecture.md`. Component-contract proof runs in the `unit-tests` execution lane through Vue Test Utils.

For UI owners that also have Storybook stories, follow `docs/testing/storybook.md`: stories document or prepare deterministic isolated states; component assertions remain in `*.test.ts` rather than stories.

Every new or migrated public `MD*` adapter requires a colocated `<Component>.test.ts` component-contract test. Material adapter details and additional proof requirements are defined by `src/shared/ui/material/docs/component-adapter.md` and the family architecture.

## Activation

Use for applicable:

- canonical defaults and supported public configuration;
- public props, emits, slots, and conditional rendering not dependent on layout;
- native element and explicit `href`, `type`, `disabled`, `readonly`, `tabindex`, `role`, and `aria-*` ownership;
- controlled semantic-state ownership, including accepted and rejected intent;
- invalid public combinations and documented normalization;
- simple child or foundation wiring;
- explicit custom-element property, attribute, event, slot, and documented CSS-variable mapping owned by a public adapter;
- framework typing glue derived from dependency-exported element types;
- small structural invariants explicitly included in the public contract.

## Workflow

1. Name the stable public contract and truthful UI owner.
2. Confirm real browser semantics or computed appearance are not required for each assertion.
3. Test the smallest representative set of configurations, states, invalid combinations, explicit attributes, and adapter mappings.
4. For controlled state, prove both acceptance and rejection: an emitted intent may update the controlling prop, but if the controller intentionally leaves the prop unchanged, the renderer-visible state must remain equal to that prop and must not retain an optimistic private mutation.
5. For third-party custom elements, use exact installed package types. Keep compile-time proof in type-check; unit tests exercise runtime mapping only.
6. For CSS mapping, assert only adapter-owned public-to-documented-renderer wiring visible at the Vue boundary.
7. Route geometry, rendered color, motion, focus, interaction, or other browser-owned effects to browser/visual proof.
8. Stub only direct dependencies whose public wiring is the assertion.
9. Assert public output or explicit child wiring.
10. If a Storybook story is also needed, keep it assertion-free and deterministic; do not duplicate the component contract in `play` or story code.
11. Run focused unit/type-check feedback and return to the top-level task.

## Controlled custom-element state

When the child custom element can mutate the same state that a Vue prop controls:

- inspect the exact installed renderer event lifecycle;
- prefer the architecture-selected pre-mutation intent seam when available;
- assert that the adapter does not rely on a post-mutation event to make an optimistic renderer mutation become authoritative;
- assert exactly one public intent for one attempted action;
- assert rejected intent leaves both the public prop and mapped renderer property unchanged;
- assert later accepted prop updates are what change the renderer property.

Do not treat `update:*` naming or an emitted post-change value as proof that ownership is controlled.

## Typed custom-element boundary

A framework declaration may add only integration glue that the dependency cannot express for Vue templates.

- Derive custom-element property types from the package-exported element class, aliases, or `HTMLElementTagNameMap`.
- Keep the public Vue component types Mioframe-owned, but make adapter outputs satisfy dependency types.
- Prefer `Pick`, indexed access, `InstanceType`, or another direct type relation.
- Do not duplicate dependency literal unions or manually synchronize a complete `*Props` interface.
- When the dependency exports no usable public type, document the exact gap and keep the local shim minimal with compile-time drift detection.

Runtime unit tests do not prove type ownership. Type-check must fail when an incompatible dependency change breaks the adapter boundary.

## Test-environment ownership

Keep renderer-specific compatibility setup local to the smallest test owner.

- A component test may install a minimal temporary shim required to construct its exact third-party element in the non-browser test environment.
- Preserve an existing implementation and restore changed globals/prototype members after the owning tests where practical.
- Do not add a global browser-capability or prototype polyfill to shared Vitest bootstrap for one component family.
- Promote a shim to shared setup only when multiple independent test owners require the same seam and shared ownership is explicit.
- Never present a test-environment shim as proof of real browser focus, accessibility, form association, layout, or capability behavior.

## Assertions

Prefer emitted events, native tags/attributes, direct-child props, slots, accessible names, documented warning/normalization output, and explicit custom-element mapping visible at the Vue boundary.

A custom-property declaration, alias, or resolved value does not by itself prove that the token has the claimed rendered effect. Unit proof may establish public-to-renderer wiring; browser or visual proof owns rendered behavior/appearance.

Avoid complete rendered-tree snapshots, incidental internal classes, test-only ids, template restatement, private renderer DOM, computed appearance, and broad global mock sets.

## Accessibility

This proof type owns native semantics, explicit ARIA ownership, accessible name, disabled/readonly semantics, and semantic-state wiring. Real focus order, keyboard operation, focus restoration, and actionability belong to browser proof.

## Commands

```bash
pnpm verify --only unit-tests --files <exact-component-or-test-paths...>
```

Until unit-impact migration is complete, prefer the exact owning component test path when a production source path would rely on an unconfirmed relation. After focused proof is complete, return to the owning workflow. For PR work, GitHub CI on the exact PR head is the authoritative repository gate; do not require a broad local final verification solely to complete this skill.

## Forbidden

- assertions or interaction scripts inside Storybook stories;
- Storybook `play` as a duplicate component-contract proof system;
- focus-visible, keyboard navigation, pointer/touch, drag, or mobile gestures;
- layout, geometry, scrolling, responsive rendering, sticky/fixed positioning;
- overlay, teleport, dialog, sheet, menu, tooltip, or popover browser lifecycle;
- browser APIs, persistence, permissions, OPFS, or service workers;
- hover, pressed, ripple, focus-indicator, elevation, shape, motion, screenshots, or computed appearance;
- complete product flows through component stubs;
- duplicated deterministic logic already owned by `unit-testing`;
- forced visual-state assertions that claim appearance or behavior;
- private renderer DOM or implementation details;
- reading a custom property's value and presenting that alone as proof of rendered behavior;
- avoidable handwritten mirrors of third-party element properties, exported unions, or defaults;
- global test-environment polyfills introduced solely for one component owner.
