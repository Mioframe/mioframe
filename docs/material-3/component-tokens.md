# Material 3 component tokens

## Principle

Material shared UI components must expose a Material-compatible component-token layer before relying on private implementation variables.

Component tokens describe parts of a component and state-specific styling, such as container color, label text color, icon size, outline color, state-layer opacity, container height, and container shape.

For migrated components, token ownership and routing follow [Component architecture](./component-architecture.md).

## Ownership

Define canonical `--md-comp-*` tokens at the owning component definition boundary.

A migrated component owns its canonical declarations in:

```text
<Component>.tokens.css
```

The foundation layer owns reference and system tokens only. It must not become a catalog for component-family tokens.

Do not move canonical component-token declarations into a global `src/shared/lib/md/tokens/comp` directory. Reports, allowlists, or generated documentation may be derived from family-owned CSS, but runtime ownership remains with the component.

Consumers may override public component tokens, but they must not define the canonical token contract for a shared Material component.

## Naming

Map Material token names to CSS custom properties mechanically. Do not shorten, normalize, or remove path segments.

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

When official Material 3 component specs list component tokens, use those exact names and meanings.

Define a public `--md-comp-*` token only when an exact official Material token path exists in the verified MCP/cache snapshot for that part, state, and property.

For example, `md.comp.list.list-item.dragged.leading-icon.icon.color` maps to:

```text
--md-comp-list-list-item-dragged-leading-icon-icon-color
```

It must not be collapsed to a shorter local name.

When official docs describe a measurement or role but no exact token path exists, do not invent an approximate public token. Use a family-private route resolved from existing `--md-sys-*`, confirmed `--md-comp-*`, or `--app-*` values according to ownership, and record the missing-token gap in the component contract and registry.

Do not invent local `--md-comp-*` tokens for Mioframe-specific behavior. Use `--app-*` for a public project extension or a family-private variable for an internal extension route.

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

Hardcoded values are acceptable only when the verified component spec defines a direct value such as `40dp`, `12dp`, `0dp`, or a numeric opacity.

Using only `--md-sys-*` inside a shared Material component is not a complete component-token contract when official component-token paths exist for the touched parts, states, or measurements.

Direct `--md-sys-*` use inside migrated component routing is acceptable only for:

- a value with no exact official component-token path;
- a true foundation-level role;
- a documented missing-token fallback named in the component contract.

## Layered token pipeline

Every stateful rendered property follows this path:

```text
official md.comp token
→ family-owned --md-comp-* token
→ configuration route bank
→ current semantic bank
→ rendered family-private value
→ optional generic foundation bridge
→ actual DOM property owner
```

The architecture handoff may omit a private stage only when the property does not vary across that stage and the omission is explicit in the rendered-property route table.

A component must not bypass an available official token with a direct system-token value.

## Private variable classes

Migrated components use only these family-private classes.

Configuration route bank:

```text
--md-private-<component>-<semantic>-<interaction>-<part>-<property>
```

Current semantic bank:

```text
--md-private-<component>-current-<interaction>-<part>-<property>
```

Rendered value:

```text
--md-private-<component>-rendered-<part>-<property>
```

Do not introduce an additional alias layer without a new ready architecture decision.

Private variables must not become the public styling contract when an official component token exists. They must remain inside the owning family.

## Override contract

The supported customization surface for shared Material components is:

1. `--md-ref-*` when changing raw reference values;
2. `--md-sys-*` when changing theme roles;
3. `--md-comp-*` when changing an official component part or state;
4. `--app-*` for a public project-specific extension outside Material vocabulary.

Consumers must not depend on private classes, route variables, rendered variables, or generic foundation bridges.

## Shared primitive private contracts

A low-level primitive reused by several component families must expose a generic private contract, never a component-specific one.

- The primitive defines one generic private variable for each value it needs, with a safe generic fallback where appropriate.
- The primitive must not read a consumer's `--md-comp-*` or `--md-private-<component>-*` variable directly.
- The consuming family maps its rendered family value into the primitive's generic private contract in `<Component>.states.css`.
- The component owns the mapping; the primitive owns only the generic contract and rendering.
- Do not move family routing into a shared primitive to remove duplication.

## Migration pilots

`MDButton` is the first `layered-v1` architecture pilot. `MDSwitch` is the independent second pilot used to verify semantic-state, disabled-state, gesture, and anatomy ownership without Button-specific assumptions.

Do not generalize validator rules or library-wide abstractions from `MDButton` alone.
