---
name: shared-ui-implementation
description: 'Use this skill when implementing or reviewing shared UI / Material primitives (src/shared/ui) to keep Vue component composition, DOM-critical attrs, browser CSS, and parent/child styling boundaries consistent with the project contract.'
---

# Shared UI implementation

Use this skill before and during implementation work on `src/shared/ui` Material-style primitives, especially component-family work such as `MDList` / `MDListItem` / `MDListSelectionItem`. Pair it with the `material3-guidelines` skill, which owns Material 3 doc compliance; this skill owns Vue implementation structure and shared UI integration boundaries.

## Material component-family stop condition

If implementation creates or materially changes a public shared `MD*` component, stop treating the change as ordinary Vue UI work. Pair this skill with the Material component-family gate in `material3-guidelines`, and do not report completion until the public contract, token map, Storybook surface, registry status, and focused browser/visual verification are addressed or explicitly documented as incomplete.

Do not introduce a new public shared `MD*` component as incidental support for another task. Either keep the UI local/non-public, reuse an existing shared primitive, or complete the full shared Material component-family workflow for the new component.

## Before the first production edit

Define, in a few lines:

1. **Public contract**: props, emits, slots that change or are added.
2. **Supported states**: which states are externally controllable (props) vs. purely internal (computed/CSS classes).
3. **Ownership**: which component owns which anatomy/state styling; what the parent may only signal (e.g. via context) vs. apply directly.
4. **Visual blast radius**: which existing consumers and Storybook/visual snapshots are affected.

## Declarative state composition

- Express static render conditions as small, named `computed` values. Name them by component meaning, not by template branch: `isInList`, `isAction`, `isLinkAction`, `isButtonAction`, `isSelectionListItem`, `usesRootActionSurface`, `usesPrimaryActionSurface`, `allowsTrailingAction`, `isDisabledLinkAction` are good examples from `MDListItem`.
- Avoid inline boolean algebra directly in the template (`v-if="!inList && mode === 'single-action' && href && disabled"`). Lift it into a named computed first.
- Do not introduce a central `topology` object or resolver that maps inputs to a combined state descriptor, unless the component has real workflow transitions, impossible intermediate states, or side effects that genuinely need a state machine. Most list/item/button rendering decisions are static per-render conditions, not workflows.
- Do not replace inline complexity with a larger hidden abstraction (a generic "render plan" object, a big switch over a synthetic enum, etc.). Prefer several small, independently readable computeds over one combined object.

## DOM-critical attrs

- Keep `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` as explicit individual template bindings (`:href="..."`, `:disabled="..."`), even when the logic behind each is non-trivial.
- Object `v-bind` (`v-bind="someAttrsObject"`) is acceptable only for controlled fallthrough-attrs forwarding — splitting consumer-provided attrs between a root wrapper and an internal action surface, for example. It must never be the only place a component-owned DOM-critical attr is set.
- When a component renders different tags conditionally (`<component :is="...">`), keep each DOM-critical attr binding visible at the template call site so a reviewer can see the exact attribute contract without reading the script.

## Native semantics over synthetic events

- Use native element activation: native buttons handle Enter/Space, native links handle Enter and navigation. Do not call `dispatchEvent(new MouseEvent(...))` or otherwise synthesize activation to patch over a missing native behavior.
- If a desired keyboard behavior is not the platform default (e.g. "Space should also activate this link"), treat that as a deviation from native semantics, not a default to silently add — confirm against Material/APG guidance and the existing required test contract before adding it. The default expectation for `MDListItem` is that links activate via Enter/click only.

## Parent/child styling boundaries

- A parent shared UI component (e.g. `MDList`) must not use `:deep()` to style a child component's internal classes (e.g. `MDListItem`'s `__primary-action`/`__body`, or `MDListSelectionItem`'s `__body`). Internal anatomy is owned and styled by the child.
- When the parent needs to communicate a fact that affects the child's own internal shape (e.g. "this list is segmented"), pass that fact down through existing `provide`/`inject` list context (or a prop) and let the child apply its own classes and CSS rules, including position-based rules like `:first-child`/`:last-child` that match the child's own root within its siblings — these do not require `:deep()` since they style the component's own root, not another component's internals.
- Internal CSS classes (`md-state_*`, `md-list-item__*`) are implementation details, not a public API. Consumers outside the owning component must not target them with `:deep()` or copy them into product code.

## Browser-specific CSS

- Shared UI runtime CSS (component `.css` files and Vue `<style>` blocks under `src/shared/ui`) must use standard CSS properties that have a non-prefixed form. Do not author a vendor-prefixed declaration (`-webkit-*`, `-moz-*`, etc.) for any property that has a standard equivalent — including `-webkit-line-clamp`, `-webkit-box-orient`, and `display: -webkit-box` used for text clamping. There is no "narrow compatibility exception" for this: a property having a standard form is reason enough to require the standard form in source, regardless of what a particular pinned test engine renders.
- Prefixes and fallback transforms for properties that need them in supported browsers are the build pipeline's responsibility (PostCSS / `postcss-preset-env` / browserslist), not the component's. If the build pipeline does not generate a needed prefix, that is a tooling gap — fix or verify the pipeline, or find a standard-CSS fallback; do not hardcode the prefix in component source to route around it.
- If a standard property does not render the required layout in the project's pinned visual-test engine, do not delete the layout/clamping behavior and do not add a hardcoded prefix. Replace it with a browser-neutral fallback built from properties every target browser already supports (e.g. `max-height` computed from `line-height * line count` plus `overflow: hidden`, instead of box-layout line-clamp). Preserving the existing line-count/overflow contract is mandatory; only the implementation technique changes.
- The one narrow exception is a genuinely non-standardized vendor-only API with no standard CSS equivalent at all (e.g. `-webkit-tap-highlight-color`, which controls a WebKit-only tap-feedback affordance that has no standard property). That is not a prefix for a standard property and is a different case from a one-off hack around a property that does have a standard form — do not use it as precedent for handwritten clamping or layout prefixes.

## Public API and legacy props

- Wrapper components must call the current shared UI API (e.g. `mode`, `containerTag`) directly, or expose a domain-intent prop that the wrapper itself owns (e.g. `isOpenable` for a file-system entry row), never a removed shared component prop kept as a compatibility alias (e.g. a wrapper-level `is` / `isButton` mirroring a removed `MDListItem` prop).
- Migrate all in-repository consumers and tests in the same change when a wrapper prop is renamed or removed — do not keep a parallel deprecated prop "for now".

## Verification

- Run focused unit/component-contract tests for the touched shared UI files.
- For interaction, focus, keyboard, pointer, or Material visual-state changes, also run or update the relevant Playwright/e2e or visual-regression spec — unit tests alone do not prove rendered/browser behavior.
- After removing `:deep()` or moving styling ownership, visually re-check segmented/first-last shape, dragged-state elevation, and any other previously `:deep()`-applied visual contract.
