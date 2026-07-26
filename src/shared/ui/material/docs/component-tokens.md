# Material component tokens

This document defines the public Mioframe token contract for m3e-backed adapters.

## Ownership

Mioframe owns these accepted consumer-facing namespaces:

1. `--md-ref-*` — reference values;
2. `--md-sys-*` — system and theme roles;
3. `--md-comp-*` — intentionally accepted component contracts;
4. `--app-*` — explicit Mioframe extensions.

`--m3e-*` variables are private renderer inputs. Consumers must not set or read them directly.

A variable name in an accepted namespace is not automatically an active public contract.

## Active public token criteria

Preserve or create a public component token only when at least one condition is true:

1. a current Mioframe consumer or theme overrides it and the override has an observable effect;
2. current Mioframe documentation intentionally promises it as supported API;
3. a current product scenario requires configurable component-level behavior that cannot be represented by existing system roles.

The following are insufficient:

- the token exists in old code;
- the name resembles an official Material token;
- m3e exposes a corresponding CSS variable;
- a test reads the declared or computed value;
- the token could be useful in the future.

Unused declaration-only and test-only tokens should be removed during migration.

## Material and m3e coverage

The adapter does not need a public `--md-comp-*` mirror for every documented m3e CSS variable.

Use the simplest route:

```text
shared theme role
  existing --md-sys-* semantics
    → m3e renderer behavior

active Mioframe component token
  accepted --md-comp-* contract
    → documented semantically equivalent --m3e-* input

unused renderer customization
  m3e default or direct system role
    → no public Mioframe token
```

Do not copy the complete Material or m3e token catalogue into Mioframe.

## Public naming

When a public component token is required, use a verified official Material path without shortening semantic segments:

```text
md.comp.<component>.[variant-or-style].<part>.<property>
--md-comp-<component>-[variant-or-style]-<part>-<property>
```

When no official component path exists:

- use an existing system role if appropriate;
- keep renderer-only routing private;
- use `--app-*` only for a current Mioframe extension;
- record a confirmed Material/m3e divergence when relevant.

## Canonical declarations

Every retained active public `--md-comp-*` token has one canonical declaration owner and a meaningful default.

- Reference and system tokens remain theme-owned.
- The adapter family owns only the active component tokens it intentionally exposes.
- Consumers may override active public tokens but do not own their defaults.
- Do not create declarations for unused m3e inputs merely to make the mapping table complete.

A mapping to an undefined public token is wrong only when that token is intentionally part of the Mioframe public API. Otherwise remove the mapping and let m3e use its documented system role or default.

## Adapter mapping

For each active token:

- compare component, variant/state, part, property, and semantic meaning;
- map to a documented semantically equivalent `--m3e-*` variable;
- exact spelling equality is not required;
- keep mapping inside the owning family;
- do not expose `--m3e-*` through props, barrels, docs, or consumer examples;
- do not use private shadow DOM or undocumented renderer variables.

Prefer direct `--md-sys-*` semantics when m3e already follows the same Material system roles.

## Legacy token classification

Classify a legacy token only as far as needed to decide preserve or remove:

- **active** — current consumer/documentation evidence and observable effect;
- **internal** — used by the old implementation but not a consumer API;
- **declaration-only/test-only** — no proven behavior or consumer contract;
- **obsolete** — no longer required by the selected adapter.

Record non-obvious removals in the family README. Do not build an exhaustive inventory when repository search already establishes that no consumer contract exists.

## Renderer-owned behavior

Low-level state-layer, ripple, elevation, focus, and motion tuning belongs to m3e when:

- Mioframe has no active public contract for the tuning input;
- m3e provides the selected behavior through its documented implementation;
- reproducing the tuning would duplicate renderer internals.

Record relevant Material/m3e differences in the family README. Implement a wrapper correction only when Mioframe currently needs the missing behavior and the correction is narrow and public-boundary safe.

## Verification

Verify only active Mioframe token contracts:

- canonical declaration exists;
- mapping targets a documented semantic m3e input;
- a representative non-default override changes the intended public result when that result is observable through a public surface;
- no `--m3e-*` usage leaks outside `src/shared/ui/material`.

Do not require:

- one test per renderer CSS variable;
- a complete token matrix;
- computed-value assertions for unused declarations;
- tests of m3e internal defaults;
- automated proof of renderer-owned animation.

Stable visual regression is appropriate only when a current public token changes a meaningful Mioframe-visible surface.
