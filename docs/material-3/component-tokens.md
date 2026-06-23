# Material 3 component tokens

## Principle

Material shared UI components must expose a Material-compatible component token layer before relying on local implementation variables.

Component tokens describe parts of a component and state-specific styling, such as container color, label text color, icon size, outline color, state layer opacity, container height, and container shape.

## Ownership

Define `--md-comp-*` tokens at the component definition boundary.

A component family owns its own component tokens. For example, button component tokens should be defined with the Button family rather than in unrelated consumers or screen-level CSS.

The foundation layer may provide shared reference and system tokens. It should not become a dumping ground for every component token unless a later structure cleanup intentionally extracts component token files under `src/shared/lib/md/tokens/comp/`.

Consumers may override public component tokens, but they must not define the canonical token contract for a shared Material component.

## Naming

Map Material token names to CSS custom properties mechanically. The variant or style segment is optional because some tokens apply to the component generally rather than to a specific variant.

```text
md.comp.<component>.[variant-or-style].<element>.<property>
--md-comp-<component>-[variant-or-style]-<element>-<property>
```

Examples:

```css
--md-comp-button-filled-container-color: var(--md-sys-color-primary);
--md-comp-button-filled-label-text-color: var(--md-sys-color-on-primary);
--md-comp-button-container-height: 40dp;
--md-comp-button-container-shape: var(--md-sys-shape-corner-full);
```

## Component token sources

When official Material 3 component specs list component tokens, use those names and meanings.

Define a public `--md-comp-*` token only when an exact official Material token path exists in the cache for that part/state/property. Map the name mechanically from the documented path; do not shorten, normalize, or drop any path segment (for example `md.comp.list.list-item.dragged.leading-icon.icon.color` must keep its `icon` segment as `--md-comp-list-list-item-dragged-leading-icon-icon-color`, not collapse it to `...-leading-icon-color`).

When the official docs describe a component measurement or role but no exact token path exists in the cache, do not invent an approximate or "closest compatible" public `--md-comp-*` token. Use a `--md-private-*` implementation variable resolved from existing `--md-sys-*`/`--md-comp-*` tokens, a system token directly, or an app/project token depending on ownership, and document the mapping and the missing-token gap in the component policy or Storybook docs.

Do not invent local `--md-comp-*` tokens for app-specific behavior. Use the neutral `--app-*` namespace for app-specific extensions.

## Relationship to system tokens

Component tokens should point to system tokens whenever possible.

Preferred:

```css
--md-comp-button-filled-container-color: var(--md-sys-color-primary);
```

Avoid:

```css
--md-comp-button-filled-container-color: #6750a4;
```

Hardcoded values are acceptable only when the official component spec defines a direct measurement such as `40dp`, `12dp`, or `0dp`.

## Local implementation variables

Local component variables are allowed only as private implementation details. They should not become the public styling contract when a Material component token exists or can be derived from the official docs.

If a local variable is kept for readability, it should reference the public component token rather than bypass it.

## Override contract

The supported customization surface for shared Material components is:

1. `--md-ref-*` when changing raw reference values;
2. `--md-sys-*` when changing theme roles;
3. `--md-comp-*` when changing a component part or state;
4. `--app-*` for app-specific behavior that is not part of the Material token model.

Consumers should not depend on private class names or private local component variables for styling.

## Shared primitive private contracts

A shared low-level primitive (such as `MDStateLayer`) that is reused by many component families must expose a generic `--md-private-*` contract, never a component-specific one.

- The primitive defines one private variable for the value it needs (for example `--md-private-state-layer-color`) with a safe fallback to an existing generic role (for example `var(--md-private-state-layer-color, var(--md-content-color))`).
- The primitive must not read a consumer's `--md-comp-*` or `--md-private-<component>-*` token directly. Doing so couples the primitive to one consumer and breaks reuse by every other consumer.
- A component family (List, Menu, Button, etc.) maps its own official `--md-comp-*` tokens into the primitive's generic `--md-private-*` contract by setting that variable in its own scoped CSS. The component owns the mapping; the primitive owns the contract.
- `--md-sys-*` remains for theme-role system tokens; `--md-comp-*` is reserved for documented Material component tokens confirmed via Material3 MCP (or the cache fallback) — do not invent a `--md-comp-*` name that has no official source. When no public token exists for a value (e.g. a dragged-state color with no published component token), keep it as a `--md-private-*` implementation variable resolved from existing `--md-sys-*`/`--md-comp-*` tokens instead of inventing a documented-looking public token.

## Pilot requirement

The first converted component family should define this pattern end-to-end before the pattern is applied widely. Buttons are the preferred pilot because the current API already maps closely to the Material 3 button model.
