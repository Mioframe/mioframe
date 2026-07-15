# Material 3 component tokens

## Principle

Public shared Material components expose verified official component tokens before relying on private implementation variables.

Token ownership and routing follow [Component architecture](./component-architecture.md) and the accepted family README blueprint.

## Canonical ownership

Every official `--md-comp-*` token has exactly one canonical declaration owner.

The normal owner is:

```text
<Component>.tokens.css
```

Create that file only when the component owns at least one exact official token used by the supported surface. Do not create an empty token file.

A family may own:

```text
<Family>.tokens.css
```

only when the same exact official token path is consumed by at least two public components in that family. The blueprint names official paths, CSS names, applicable roots, and loading components.

When all applicable official tokens are family-owned, a component does not also need its own token file. When no exact official component token exists, record token ownership as `none` and use documented private/system/app sources according to ownership.

Equal values, similar usage, line count, or possible reuse do not justify family ownership.

Reference and system tokens remain in the foundation. Do not create a global runtime catalog for component-family tokens.

Consumers may override public component tokens but must not define the canonical contract.

## Declaration selectors

Canonical token files declare the complete supported public override surface independently of active configuration and state.

Allowed selectors are only:

- the owning component root in `<Component>.tokens.css`;
- the exact family-member root list from the family blueprint in `<Family>.tokens.css`.

Forbidden:

- variant, size, shape, width, density, or mode selectors;
- semantic or interaction state selectors;
- pseudo-classes;
- private or app token declarations;
- normal rendering properties.

Configuration selection belongs to `.routes.css`. Semantic and interaction resolution belongs to `.states.css`.

## Naming

Map official paths mechanically without shortening or removing segments:

```text
md.comp.<component>.[variant-or-style].<part>.<property>
--md-comp-<component>-[variant-or-style]-<part>-<property>
```

Example:

```text
md.comp.list.list-item.dragged.leading-icon.icon.color
--md-comp-list-list-item-dragged-leading-icon-icon-color
```

Do not create a public component token without an exact path in the verified MCP/cache snapshot.

## Values

Resolve component tokens to system tokens whenever the official model uses a system role:

```css
--md-comp-button-filled-container-color: var(--md-sys-color-primary);
```

Use a direct value only when the verified component spec defines it, such as a `dp` measurement or numeric opacity.

When an official component path is missing:

- do not invent an approximate public token;
- use a family-private route from existing component/system tokens when internal;
- use `--app-*` only for an explicit public Mioframe extension;
- record the gap in the family blueprint and registry.

## Directed pipeline

Each property uses only applicable stages:

```text
official md.comp token
→ optional canonical --md-comp-* declaration
→ optional configuration route
→ optional semantic bank
→ optional property-specific interaction resolver
→ rendered family-private value
→ optional generic foundation bridge
→ actual DOM property owner
```

The canonical stage is omitted only when no exact official component token exists for the property. An available official component token must not be bypassed by a direct system-token value.

## Private variables

Use these naming classes when their stages apply.

Configuration route:

```text
--md-private-<component>-<semantic>-<interaction>-<part>-<property>
```

Current semantic candidate:

```text
--md-private-<component>-current-<interaction>-<part>-<property>
```

Final rendered value:

```text
--md-private-<component>-rendered-<part>-<property>
```

Do not add alias levels for readability. Omit an entire stage when the blueprint states the property does not vary across it.

Private variables remain inside the owning family and never become consumer styling API.

## Override contract

Supported public namespaces are:

1. `--md-ref-*` for raw reference values;
2. `--md-sys-*` for theme roles;
3. `--md-comp-*` for verified component parts and states;
4. `--app-*` for explicit public project extensions outside Material vocabulary.

Consumers must not depend on family-private variables, internal classes, or generic foundation bridges.

## Generic foundation bridges

A shared state-layer, ripple, focus, elevation, or motion primitive exposes only generic private inputs.

- The primitive never reads family component tokens or family-private variables.
- The consuming component maps its final rendered value into the generic bridge in its state layer.
- The primitive owns generic rendering; the family owns source selection.
- Do not move family routing into a primitive to remove duplication.

## Authoring workflow

During standard component authoring, the implementation agent independently:

1. inventories exact official token paths required by supported scenarios;
2. assigns each path to one component or qualifying family owner file;
3. omits token files with no owned official paths;
4. records ownership in the family blueprint;
5. selects the smallest applicable architecture profile;
6. implements only required routes and state resolvers;
7. validates public overrides and actual DOM property owners.

Use architecture escalation only when official paths, ownership, or required project extension semantics are genuinely unresolved.

`MDButton` is the first validation pilot and `MDSwitch` is the independent second pilot. Do not generalize validator exceptions from one component alone.
