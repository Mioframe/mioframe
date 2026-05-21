# Material 3 component tokens

## Principle

Material shared UI components must expose a Material-compatible component token layer before relying on local implementation variables.

Component tokens describe parts of a component and state-specific styling, such as container color, label text color, icon size, outline color, state layer opacity, container height, and container shape.

## Naming

Map Material token names to CSS custom properties mechanically:

```text
md.comp.<component>.<variant-or-style>.<element>.<property>
--md-comp-<component>-<variant-or-style>-<element>-<property>
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

When the official docs describe a component measurement or role but the exact token is missing from the cache, define the closest Material-compatible `--md-comp-*` token and document the mapping in the component policy or Storybook docs.

Do not invent local `--md-comp-*` tokens for project-specific behavior. Use a project namespace for project-specific extensions.

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
4. project namespaced tokens for project-only behavior.

Consumers should not depend on private class names or private local component variables for styling.

## Pilot requirement

The first converted component family should define this pattern end-to-end before the pattern is applied widely. Buttons are the preferred pilot because the current API already maps closely to the Material 3 button model.
