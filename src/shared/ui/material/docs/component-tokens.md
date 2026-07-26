# Material component tokens

This document defines the public Mioframe component-token contract during and after migration to m3e-backed Vue adapters.

## Ownership

Mioframe retains ownership of the accepted consumer-facing namespaces:

1. `--md-ref-*` — reference values;
2. `--md-sys-*` — system and theme roles;
3. `--md-comp-*` — accepted component contracts;
4. `--app-*` — explicit Mioframe extensions outside Material vocabulary.

`@m3e/web` renderer variables such as `--m3e-*` are private implementation details. Consumers must not set or read them.

The existing Mioframe theme remains the global owner. Component migration does not make `m3e-theme` a second theme source.

A declaration in an accepted namespace is not by itself proof that the token is an active public contract. Legacy component directories remain the declaration owners of their tokens until focused migration classifies and transfers only the active supported surface.

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

## Legacy token classification

Before preserving, removing, or declaring a renderer blocker for a legacy token, classify the token using repository evidence:

- **declared** — a default custom property exists;
- **internally consumed** — production implementation reads it into a rendered property or behavior;
- **behaviorally effective** — changing it changes an observable rendered property or interaction behavior;
- **externally consumed** — an in-repository consumer, theme, story, or documented integration overrides it;
- **publicly documented** — current Mioframe documentation or examples promise it as supported API;
- **test-only** — tests only read the declaration or resolved value without proving an effect;
- **obsolete** — it has no confirmed consumer-facing effect or retained contract.

A token is part of the active migration contract only when evidence shows at least one of the following:

1. a consumer or theme overrides it and the override has a proven observable effect;
2. current public documentation intentionally promises it and the implementation provides that effect;
3. the component uses it for an observable behavior that the family contract explicitly retains as public configuration.

The following are insufficient by themselves:

- the token is declared;
- the token follows an official Material name;
- a test reads its computed custom-property value;
- the legacy implementation contains an alias chain for it;
- an equivalent internal renderer parameter exists.

Removing an obsolete or declaration-only token during atomic migration is cleanup, not automatically a breaking API change. Record the evidence and decision in the family README. An externally consumed or intentionally documented effective token requires an explicit compatibility decision.

## Canonical declarations

Every retained active public `--md-comp-*` token has one canonical declaration owner and one meaningful default source.

- Reference and system tokens remain theme/foundation-owned.
- Before migration, the legacy component owns the defaults used by its active current contract.
- During migration, the family README records which tokens transfer, which map directly to system roles, and which obsolete declarations are removed.
- Before deleting the legacy owner, transfer canonical declarations for all retained active tokens into the adapter family.
- After migration, the canonical adapter family owns the component tokens used by its supported surface.
- Consumers may override public component tokens but do not own their defaults.
- Do not create token files for symmetry, hypothetical reuse, or a complete unused Material surface.

A renderer mapping such as:

```css
--m3e-filled-button-container-color: var(--md-comp-button-filled-container-color);
```

is incomplete when no canonical owner declares `--md-comp-button-filled-container-color`. Successful renderer fallback to its own default does not satisfy Mioframe public token ownership.

Canonical declarations remain independent of active configuration and state. Keep selectors, pseudo-classes, private aliases, and final DOM properties out of the declaration owner unless the accepted contract explicitly requires otherwise.

Resolve component tokens to system tokens when the official model uses a system role:

```css
--md-comp-button-filled-container-color: var(--md-sys-color-primary);
```

Use a direct value only when the verified component contract defines that measurement, opacity, or other literal.

## Adapter mapping

m3e CSS variables intentionally follow Material component semantics. Treat a documented semantically equivalent renderer variable as the normal adapter target even when its spelling is not identical to the official Material path.

Use the simplest valid route:

```text
shared Material system role
  --md-sys-* → renderer consumes the same role

component contract
  canonical public --md-comp-* declaration
    → documented semantically equivalent --m3e-<component>-* input

renderer-owned behavior without retained public tuning
  renderer default/public behavior → renderer-owned DOM and motion
```

For component mapping, compare component, configuration or state, part, property, and meaning. Do not require character-for-character name equality when the documented semantics are equivalent.

Rules:

- map only variables required by the supported target surface;
- prefer direct `--md-sys-*` consumption when m3e documents the same Material system-token semantics;
- map active `--md-comp-*` contracts mechanically to documented semantically equivalent `--m3e-*` inputs;
- audit declaration ownership and renderer mapping as separate requirements;
- keep component mappings inside `src/shared/ui/material/components/<family>` unless two unrelated adapters prove the same genuinely shared mechanism;
- do not expose `--m3e-*` through public documentation, barrels, props, or consumer examples;
- do not read renderer defaults back as application state;
- do not target private shadow DOM or undocumented renderer CSS to compensate for a missing public variable;
- do not copy all m3e defaults into Mioframe merely to create a parallel theme.

## Renderer-owned behavior and blockers

A missing low-level renderer tuning input is not a blocker when:

- no active Mioframe consumer contract requires that input;
- the legacy declaration has no proven observable effect;
- m3e provides the required observable Material behavior through its documented public component;
- preserving the old internal mechanism would duplicate renderer-owned state, focus, ripple, elevation, or motion.

Record such a difference as renderer-owned behavior, an unsupported optional tuning surface, or obsolete legacy surface. Do not recreate it in the adapter.

Keep renderer viability `blocked-upstream` only when an active required theming contract cannot be delivered through documented public renderer APIs and its loss would cause a confirmed consumer, accessibility, native, or observable UI regression.

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

Each migration family README records the supported token surface in a compact evidence table:

| Material meaning | Mioframe token | Canonical default owner | Documented m3e input or renderer owner | Legacy evidence  | Consumer evidence | Decision |
| ---------------- | -------------- | ----------------------- | -------------------------------------- | ---------------- | ----------------- | -------- |
| retained role    | public token   | adapter family          | semantic mapping                       | effective        | used or promised  | preserve |
| unused tuning    | legacy token   | removed                 | renderer-owned behavior                | declaration-only | none              | remove   |

Also record:

- exact official source paths where applicable;
- defaults and current/canonical declaration owner;
- unsupported theming surface;
- confirmed m3e deviations;
- consumer migration impact and required proof.

A renderer variable with a different name is acceptable when its documented semantics are equivalent. A legacy declaration is not automatically preserved merely because its name is official.

## Verification

Verify contracts owned by Mioframe:

- every retained active token has exactly one canonical declaration after legacy removal;
- the canonical declaration resolves to the intended system role or literal default;
- component-local mapping selects the documented semantically equivalent renderer variable;
- an intentional non-default public override changes the intended rendered property or observable behavior;
- configuration and state routing do not leak private variables;
- no `--m3e-*` usage exists outside `src/shared/ui/material`;
- visual regression covers stable token-sensitive surfaces where the risk is material;
- the production build includes only required renderer entry points.

Reading a custom property's declared or resolved value without proving its effect does not establish an active public contract. For renderer-owned motion, verify public press/release, interruption, final state, and reduced-motion behavior where required; do not assert private spring coefficients, Lit styles, or shadow-DOM implementation.

Do not claim Material conformance from token names alone.
