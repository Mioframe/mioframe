---
name: shared-ui-implementation
description: 'Use this skill before implementing or reviewing src/shared/ui primitives, especially any new or materially changed public shared MD* component. Enforces the shared UI/component-family stop condition, layered Material component architecture, Vue component contract, explicit DOM-critical attrs, native activation semantics, anatomy ownership, token ownership, per-property state resolution, parent/child styling boundaries, browser CSS rules, and required focused verification.'
paths:
  - 'src/shared/ui/**'
  - 'tests/e2e/visual/shared-ui/**'
---

# Shared UI implementation

Use this skill before and during implementation work on `src/shared/ui` Material-style primitives. Pair it with the `material3-guidelines` skill, which owns Material 3 documentation compliance; this skill owns implementation architecture, Vue structure, DOM ownership, and shared UI integration boundaries.

## Material component-family stop condition

If implementation creates or materially changes a public shared `MD*` component, stop treating the change as ordinary Vue UI work. Pair this skill with the Material component-family gate in `material3-guidelines`, read `docs/material-3/component-architecture.md`, and do not begin production edits without a ready Material component contract.

Do not introduce a new public shared `MD*` component as incidental support for another task. Either keep the UI local/non-public, reuse an existing shared primitive, or complete the full shared Material component-family workflow.

Consumers in `features`, `widgets`, and `pages` must compose existing shared `MD*` primitives rather than reimplementing Material-like dialog, sheet, overlay, scrim, progress, list, card, or control anatomy locally.

## Architecture impact gate

Before the first production edit, record exactly one outcome:

1. `Architecture impact: none` — a strictly local legacy-component fix preserves public API, native semantics, tokens, anatomy, supported states, per-property state resolution, and visual output outside the named defect.
2. `Architecture impact: layered-v1` — the ready handoff supplies the complete contract delta from `docs/material-3/component-architecture.md` and the exact migration or implementation files.
3. `Architecture impact: blocked` — the contract, ownership, official source, or required verification is unresolved.

The implementation agent must not choose between legacy repair and migration. That decision belongs to the architecture handoff.

For `layered-v1`, all of the following are mandatory:

- the family `README.md` is the durable accepted contract, or the first migration creates it from the ready handoff;
- a later handoff names the current family README and only the exact contract delta;
- each component has `.vue`, `.tokens.css`, `.routes.css`, `.states.css`, and `.css` files;
- an optional `<Family>.tokens.css` exists only when the ready contract assigns shared official tokens to at least two public family components;
- the Vue file loads the exact handoff-declared style layers in the required order;
- token definitions, configuration routes, state resolution, and rendering remain in their assigned layers;
- canonical tokens are declared independently of active configuration and state;
- every stateful rendered property has its own declared resolver, winner order, simultaneous outputs, final variable, and actual DOM owner;
- exact verification files and cases come from the ready handoff;
- additional token, behavior, anatomy, or context files exist only when named by the handoff.

If implementation requires a new prop, state, token owner, property resolver, helper, context, coexistence rule, or verification exception not present in the ready contract, stop and return the handoff for resolution. Do not infer a reasonable default.

## Before the first production edit

For ordinary non-Material shared primitives, define:

1. **Public contract**: props, emits, slots that change or are added.
2. **Supported states**: which states are externally controllable vs. internal.
3. **Ownership**: which component owns each anatomy and state behavior.
4. **Visual blast radius**: affected consumers and browser/visual surfaces.

For public Material component-family work, use the complete contract in `docs/material-3/component-architecture.md` instead of this abbreviated preflight.

## Declarative state composition

- Express static render conditions as small, named `computed` values. Name them by component meaning, not by template branch.
- Avoid inline boolean algebra directly in the template. Lift it into a named computed first.
- Do not introduce a central `topology` object or resolver unless the ready handoff explicitly identifies real workflow transitions, impossible intermediate states, or side effects requiring it.
- Do not replace inline complexity with a generic render plan, synthetic enum, style resolver, or broad options object. Prefer several small, independently readable computeds.
- Vue acquires declared runtime facts; CSS resolves declared visual properties. Do not compute visual token values in TypeScript.
- Do not apply one global interaction precedence to every visual property. Implement the property-specific matrix from the ready contract.

## DOM-critical attrs

- Keep `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` as explicit individual template bindings, even when the logic behind each is non-trivial.
- Object `v-bind` is acceptable only for controlled fallthrough-attrs forwarding. It must never be the only place a component-owned DOM-critical attr is set.
- When a component renders different tags conditionally, keep each DOM-critical attr binding visible at the template call site.

## Native semantics over synthetic events

- Use native element activation: native buttons handle Enter/Space, native links handle Enter and navigation. Do not synthesize activation to patch over missing native behavior.
- If desired keyboard behavior is not the platform default, treat it as a deviation. Confirm it against Material/APG guidance and include it in the ready contract before implementation.

## Parent/child and family ownership

- A parent shared UI component must not use `:deep()` to style a child component's internal classes. Internal anatomy is owned and styled by the child.
- When a parent needs to communicate a fact affecting child anatomy, use a handoff-approved prop or family context and let the child apply its own classes and CSS.
- Internal CSS classes and family-private variables are implementation details. Consumers outside the owning family must not target or read them.
- A family-shared anatomy file is allowed only when the ready handoff names at least two public components that own the same anatomy contract.
- A family token file is allowed only for exact official token paths consumed by at least two public family components. The handoff must name every token, root, and loading component.
- Do not move a component-specific token into a family file merely because another component uses the same value.

## Generic foundation boundaries

- Generic state-layer, ripple, focus-indicator, elevation, and motion primitives may read only generic private contracts.
- A generic primitive must not read a family-specific `--md-comp-*` or `--md-private-<family>-*` variable.
- The consuming family maps its rendered value into the generic private bridge inside its own state layer.
- Do not move family token routing into a foundation primitive to reduce duplication.

## Browser-specific CSS

- Shared UI runtime CSS must use standard CSS properties that have a non-prefixed form. Do not author vendor-prefixed declarations for properties with a standard equivalent.
- Prefixes and fallback transforms are the build pipeline's responsibility. If the build pipeline does not generate a needed prefix, fix or verify the pipeline or use a browser-neutral fallback.
- If a standard property does not render the required layout in the pinned visual-test engine, preserve the behavior with browser-neutral supported properties; do not delete the contract or add a hardcoded prefix.
- A genuinely vendor-only API with no standard equivalent is a separate, narrow case and must not be used as precedent for handwritten compatibility prefixes.

## Typography tokens

- Use the `MD_TYPESCALE` constants and `.md-typescale-*` classes from `shared/lib/md` for typography-only Material text.
- Do not hand-write type-scale declarations in component CSS unless the change is to the type-scale utility contract itself.

## Public API and legacy props

- Wrapper components must call the current shared UI API directly or expose a domain-intent prop owned by the wrapper. Never retain a removed shared-component prop as a wrapper compatibility alias.
- Migrate all in-repository consumers and tests in the same change when a wrapper prop is renamed or removed. Do not keep a parallel deprecated prop unless the ready handoff explicitly requires compatibility.

## Verification

- Run focused unit/component-contract tests for the touched shared UI files.
- For interaction, focus, keyboard, pointer, Material state, property ownership, or visual changes, run the exact browser and visual verification named by the handoff.
- Assert stateful visual properties on their actual DOM owners, not only on a parent from which values happen to inherit.
- Test every reachable property-matrix row, its winner selection, and declared simultaneous outputs.
- Verify that canonical token files contain no configuration or state selectors.
- After moving styling ownership, visually re-check affected family geometry and every consumer named in the blast-radius inventory.
- Do not report a `layered-v1` migration complete while the family README, implementation, registry, or required architecture validation disagree.
