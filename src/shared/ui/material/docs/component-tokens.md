# Material component tokens

This document defines the public Mioframe component-token contract during and after migration to m3e-backed Vue adapters.

## Ownership

Mioframe retains ownership of the accepted consumer-facing namespaces:

1. `--md-ref-*` — reference values;
2. `--md-sys-*` — system and theme roles;
3. `--md-comp-*` — exact accepted component contracts;
4. `--app-*` — explicit Mioframe extensions outside Material vocabulary.

`@m3e/web` renderer variables such as `--m3e-*` are private implementation details. Consumers must not set or read them.

The existing Mioframe theme remains the global owner. Component migration does not make `m3e-theme` a second theme source.

Legacy component directories remain the declaration owners of their accepted public tokens until their focused migration transfers that ownership.

## Public token naming

Map a verified official Material component path mechanically without shortening or removing segments:

```text
md.comp.<component>.[variant-or-style].<part>.<property>
--md-comp-<component>-[variant-or-style]-<part>-<property>
```

Do not create a public component token without an exact verified official path or an already accepted repository contract.

When an official component path is unavailable:

- do not invent an approximate `--md-comp-*` token;
- use a documented private or system source when internal;
- use `--app-*` only for a current project extension;
- record the unsupported or deviated contract in the family README.

## Canonical declarations

Every public `--md-comp-*` token has one canonical declaration owner.

- Reference and system tokens remain theme/foundation-owned.
- Before migration, the legacy component owns the accepted defaults used by its current consumers.
- During migration, the family README records which accepted tokens transfer to the adapter.
- After migration, the canonical adapter family owns the component tokens used by its supported surface.
- Consumers may override public component tokens but do not own their defaults.
- Do not create token files for symmetry, hypothetical reuse, or a complete unused Material surface.

Canonical declarations remain independent of active configuration and state. Keep selectors, pseudo-classes, private aliases, and final DOM properties out of the declaration owner unless the existing accepted contract explicitly requires otherwise.

Resolve component tokens to system tokens when the official model uses a system role:

```css
--md-comp-button-filled-container-color: var(--md-sys-color-primary);
```

Use a direct value only when the verified component contract defines that measurement, opacity, or other literal.

## Adapter mapping

An m3e-backed component maps public Mioframe tokens to documented renderer variables privately:

```text
public --md-comp-* or --md-sys-* source
  → optional component-local state/configuration resolution
  → documented private --m3e-* input
  → renderer-owned DOM
```

Rules:

- map only variables required by the supported target surface;
- keep mappings inside `src/shared/ui/material/components/<family>` unless two unrelated adapters prove the same genuinely shared mechanism;
- do not expose `--m3e-*` through public documentation, barrels, props, or consumer examples;
- do not read renderer defaults back as application state;
- do not target private shadow DOM or undocumented renderer CSS to compensate for a missing public variable;
- do not copy all m3e defaults into Mioframe merely to create a parallel theme;
- keep renderer viability `blocked-upstream` and implementation ownership `legacy` when required theming cannot be achieved through documented public renderer APIs.

## Private variables

Create a Mioframe-private variable only when the current property route requires one for state, configuration, or a project-owned generic primitive.

Suggested forms:

```text
--md-private-<component>-<configuration>-<part>-<property>
--md-private-<component>-<state>-<part>-<property>
--md-private-<component>-rendered-<part>-<property>
```

Private variable names are not consumer contracts. Keep them within the owning implementation and remove obsolete routes during migration.

## Generic primitives

A project-owned generic state-layer, ripple, focus, elevation, or motion primitive accepts only generic inputs.

- The primitive does not read family token names.
- The component owns source selection and maps the final value into the primitive.
- Do not retain or add a parallel generic primitive when the selected m3e renderer already owns the behavior correctly and the wrapper does not use it.
- Legacy primitives remain valid for components with implementation ownership `legacy` until those components migrate.

## Family contract

Each migration family README records for the explicit target:

- public tokens preserved or introduced;
- exact official source paths where applicable;
- defaults and current/canonical declaration owner;
- private mapping to documented m3e variables;
- unsupported theming surface;
- confirmed m3e deviations;
- consumer migration impact and required visual proof.

The adapter must preserve an accepted public token unless an explicit breaking API decision removes it. A renderer variable with a similar name is not automatically an equivalent contract.

## Verification

Verify contracts owned by Mioframe:

- accepted public overrides affect the intended rendered property;
- component-local mapping selects the correct documented renderer variable;
- configuration and state routing do not leak private variables;
- no `--m3e-*` usage exists outside `src/shared/ui/material`;
- visual regression covers stable token-sensitive surfaces where the risk is material;
- production build includes only required renderer entry points.

Do not test m3e internal CSS implementation or claim Material conformance from token names alone.