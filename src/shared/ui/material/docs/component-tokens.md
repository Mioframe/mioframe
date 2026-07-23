# Material 3 component tokens

## Principle

Public shared Material components expose exact verified official component tokens before relying on private implementation variables.

Every supported token must have one clear declaration owner and a traceable official path.

## Canonical ownership

Every official `--md-comp-*` token has exactly one canonical declaration owner.

A dedicated component token file is appropriate when the component owns exact official tokens used by its supported surface. A family token file is appropriate only when multiple current public components genuinely share the same official family contract.

Do not create token files for symmetry or hypothetical reuse.

Reference and system tokens remain foundation-owned. Consumers may override public component tokens but do not own their canonical declaration.

## Naming

Map official paths mechanically without shortening or removing segments:

```text
md.comp.<component>.[variant-or-style].<part>.<property>
--md-comp-<component>-[variant-or-style]-<part>-<property>
```

Do not create a public component token without an exact verified official path.

When an official component path is unavailable:

- do not invent an approximate public token;
- use a documented private or system source when internal;
- use `--app-*` only for an explicit project extension;
- record the unsupported or deviated surface.

## Declaration purity

Canonical token declarations are independent of active configuration and state.

Do not place in the canonical declaration owner:

- variant, size, shape, density, mode, semantic-state, or interaction-state selectors;
- pseudo-classes;
- private or application token declarations;
- final rendering properties.

Configuration and state routing remain separate responsibilities. They do not require dedicated files when the logic is small and unambiguous.

## Values

Resolve component tokens to system tokens when the official model uses a system role:

```css
--md-comp-button-filled-container-color: var(--md-sys-color-primary);
```

Use a direct value only when the verified component specification defines it, such as a measurement or numeric opacity.

An available official component token must not be bypassed by a direct system token merely for convenience.

## Shortest applicable pipeline

Each property uses only the stages it needs:

```text
canonical component token or documented private/system/app source
→ optional configuration selection
→ optional property-specific state resolution
→ optional rendered private value
→ optional generic foundation bridge
→ actual DOM property owner
```

Rules:

- apply a static canonical source directly when possible;
- use a configuration variable only when configuration selects different sources;
- use a state-resolved private value only when multiple state sources must be reconciled;
- add no private alias only for naming convenience;
- keep family-private variables inside the family;
- keep generic foundation bridges free of family names and token routing.

## Private variables

Create private variables only when the current property route requires them.

Suggested forms:

```text
--md-private-<component>-<configuration>-<part>-<property>
--md-private-<component>-<state>-<part>-<property>
--md-private-<component>-rendered-<part>-<property>
```

Exact naming is less important than clear ownership, minimal stages, and no public leakage.

Use a rendered-property table only when multiple configurations or states make the source, winner, coexistence, bridge, or DOM owner non-obvious.

## Override contract

Supported public namespaces are:

1. `--md-ref-*` for reference values;
2. `--md-sys-*` for theme roles;
3. `--md-comp-*` for exact verified component contracts;
4. `--app-*` for explicit project extensions outside Material vocabulary.

Consumers must not depend on family-private variables, internal classes, or generic foundation bridges.

## Generic foundation bridges

A state-layer, ripple, focus, elevation, or motion primitive exposes generic inputs only.

- The primitive never reads family tokens or variables.
- The family maps its applicable final source into the bridge.
- The primitive owns generic rendering; the family owns source selection.
- Do not move family routing into a primitive merely to remove repeated syntax.

## Verification

For every changed public component token:

1. verify the exact official path and source snapshot;
2. confirm its canonical declaration owner;
3. confirm configuration and state precedence where applicable;
4. confirm the value reaches the actual DOM property owner;
5. verify representative consumer overrides when the token is public;
6. verify visible output when rendering changes.

Do not prescribe a fixed CSS-file profile before understanding the component.
