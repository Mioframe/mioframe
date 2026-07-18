# Material 3 component tokens

## Principle

Public shared Material components expose only exact verified official Material tokens. Internal implementation routes are explicitly private. Application-specific contracts use an application namespace.

Token ownership, final rendered-property ownership, and geometry ownership follow `component-architecture.md` and `src/shared/ui/material/components/AGENTS.md`.

## Allowed namespaces

Every custom property belongs to exactly one namespace.

### Official Material tokens

Use exact verified canonical names only:

```text
--md-ref-*
--md-sys-*
--md-comp-*
```

Their names are derived mechanically from the official token path. Do not shorten, paraphrase, omit segments, or translate a semantic Material path into a raw CSS property name.

Example:

```text
md.comp.button.filled.container.color
--md-comp-button-filled-container-color
```

Do not create a public Material token without an exact official path.

### Private Material implementation routes

Use:

```text
--md-private-<owner>-<semantic-role>
```

Private names describe Material ownership and meaning, not merely the final CSS syntax.

Examples:

```text
--md-private-button-rendered-container-shape
--md-private-button-rendered-container-color
--md-private-button-interaction-block-size
--md-private-state-pressed-state-layer-opacity
```

A private route exists only when runtime configuration, state resolution, inheritance, consumer override, cross-element routing, or foundation bridging requires indirection.

Do not create a private variable for a constant used once. Prefer a direct declaration.

Private variables remain inside their owner and are not consumer API.

### Application tokens

Use `--app-*` only for genuine Mioframe application contracts outside Material vocabulary.

Do not use `--app-*` to disguise an invented Material token or a family-private route.

## Forbidden names

Do not create an unqualified ad-hoc `--md-<component>-*` namespace.

Invalid examples:

```text
--md-button-border-radius
--md-button-height
--md-button-padding-left
--md-button-icon-gap
```

These names are invalid because they look canonical while being neither exact official `--md-comp-*` tokens nor explicit `--md-private-*` routes. They also encode raw CSS implementation properties instead of the semantic Material owner and role.

Do not introduce aliases such as `--md-button-*`, `--md-card-*`, or `--md-switch-*` for convenience.

## Canonical ownership

Every official `--md-comp-*` token has exactly one canonical declaration owner.

A dedicated token file is appropriate only when the supported surface owns exact official component tokens. A family token file is appropriate only when multiple current public components genuinely share one official family contract.

Reference and system tokens remain foundation-owned. Consumers may override public component tokens but do not own their canonical declaration.

Do not create token files for symmetry or future reuse.

## Declaration purity

Canonical token declarations are independent of active configuration and state.

Do not place in the canonical declaration owner:

- variant, size, shape, density, mode, semantic-state, or interaction-state selectors;
- pseudo-classes;
- private or app-token declarations;
- final rendering properties.

Configuration and state routing remain separate responsibilities. They do not require dedicated files when the logic is small and unambiguous.

## Values

Resolve component tokens to system tokens when the official model uses a system role:

```css
--md-comp-button-filled-container-color: var(--md-sys-color-primary);
```

Use a direct value only when the verified component specification defines it, such as a measurement or numeric opacity.

An available official component token must not be bypassed by a direct system token merely for convenience.

## Shortest applicable route

Each property uses only the stages it needs:

```text
exact official token or documented private/system/app source
→ optional configuration selection
→ optional property-specific state resolution
→ optional private rendered value
→ optional generic foundation bridge
→ correct final DOM property owner
```

Rules:

- apply a static canonical source directly when possible;
- use a configuration variable only when configuration selects different sources;
- use a state-resolved private value only when multiple state sources must be reconciled;
- add no alias only for naming convenience;
- keep private variables inside their owner;
- keep generic foundation bridges free of family names and family token selection;
- prove that the final property is applied to the correct semantic and geometric DOM owner.

A route is invalid when the expected value is computed on the wrong element. Numeric equality does not prove correct anatomy, geometry, clipping, or visible output.

## Final rendered-owner proof

For every visible property route, verify:

1. exact official meaning or explicit project-extension meaning;
2. valid custom-property namespace;
3. concrete DOM owner;
4. actual bounds of that owner when geometry is relevant;
5. final computed/rendered output;
6. state precedence, clipping, and interaction with adjacent layers.

For shape tokens, checking only a `border-radius` number is insufficient. The value must affect the actual visual container and produce the correct visible resting, pressed, selected, and disabled endpoint.

## Override contract

Supported public namespaces are:

1. `--md-ref-*` for reference values;
2. `--md-sys-*` for theme roles;
3. `--md-comp-*` for exact verified component contracts;
4. `--app-*` for explicit project extensions outside Material vocabulary.

Consumers must not depend on `--md-private-*`, internal classes, or generic foundation bridges.

## Generic foundation bridges

A state-layer, ripple, focus, elevation, or motion primitive exposes generic inputs only.

- The primitive never reads family tokens or family-private variables.
- The family maps its applicable final source into the bridge.
- The primitive owns generic rendering; the family owns source selection.
- Do not move family routing into a primitive merely to reduce repeated syntax.

## Required authoring and review inventory

For every custom-property declaration added or materially touched, classify it as:

- exact official token;
- private implementation route;
- application token;
- invalid or unnecessary alias.

Authoring must correct invalid names before reporting implementation finished.

Independent review must report a finding when:

- an invented `--md-*` name looks public or canonical;
- an official path is shortened or converted to a raw CSS-property name;
- a private route omits `private`;
- a private name describes mechanism rather than semantic ownership;
- a one-use constant is routed through an unnecessary variable;
- a declaration cannot affect the correct final rendered owner.

A visible capability routed through an invalid namespace or wrong DOM owner is not `implemented and verified`.

## Authoring workflow

For the selected implemented surface:

1. inventory exact official token paths;
2. assign one canonical owner to each path;
3. classify every touched custom property by namespace;
4. remove invalid and unnecessary aliases;
5. implement the shortest route;
6. identify the correct final DOM and geometry owner;
7. verify public overrides and final rendered output;
8. record unresolved routes honestly in the family README;
9. require independent review after changes.

Do not select a fixed CSS-file profile before understanding the component.