# Material component tokens

This document defines token ownership for Material-first Vue adapters backed privately by m3e.

## Namespaces

Mioframe owns:

1. `--md-ref-*` — official Material reference values;
2. `--md-sys-*` — official Material system and theme roles;
3. `--md-comp-*` — the demand-driven selected subset of official Material component tokens;
4. `--app-*` — explicitly approved non-Material application extensions.

`--m3e-*` variables are private renderer inputs. Consumers must not use them directly.

## Material-first selection

A public `--md-comp-*` token must satisfy both conditions:

1. its name and semantics are verified against an official Material component-token path;
2. it is required now by a current consumer, theme, selected component scenario, or intentional public library contract.

Current need selects an official token; it does not invent a new Material token contract.

If no official Material token exists, choose one explicit outcome:

- use an existing `--md-sys-*` role;
- keep renderer-only configuration private;
- use `--app-*` after an approved non-Material extension decision;
- assign a confirmed renderer gap to m3e;
- leave the customization unsupported.

## Demand-driven coverage

Do not copy the full Material or m3e token catalogue.

For each relevant token, record it in the family Material–m3e–Vue matrix as:

- `implement-now` — selected official token required now;
- `defer` — official token not required now;
- `not-material` — legacy or product customization without an official token source.

A documented m3e CSS variable does not automatically require a public Mioframe alias.

## Mapping

```text
selected official Material token
  → public --md-comp-* name
  → documented semantically equivalent --m3e-* input
```

For each selected token:

- preserve the official component, variant/state, part, and property semantics;
- keep one canonical declaration owner and meaningful default;
- map only to documented public m3e inputs;
- exact spelling equality is not required, semantic equivalence is;
- verify that the chosen CSS value representation is accepted by every selected current consumer grammar; equal numeric meaning does not make forms such as a unitless number and a percentage interchangeable in every CSS function or property;
- prefer one canonical foundation representation when it preserves the official meaning and works for all selected current consumers;
- when no shared representation is compatible, keep the conversion private to the owning adapter and treat it as a documented renderer mapping or exact-version workaround rather than changing unrelated public semantics;
- keep mappings inside the owning family;
- do not expose m3e names through props, exports, docs, or consumer examples.

Prefer direct `--md-sys-*` behavior when m3e already consumes the correct Material system roles with a compatible CSS value grammar.

## Legacy tokens

Classify legacy tokens only as far as required for migration:

- `selected-material` — verified official token required now;
- `deferred-material` — verified official token not required now;
- `internal` — old implementation detail, not public API;
- `not-material` — project extension requiring a separate decision;
- `obsolete` — no valid destination.

Do not preserve a token merely because it exists in old code, resembles Material naming, has a corresponding m3e variable, or is referenced only by tests.

## Renderer-owned behavior

Low-level state-layer, ripple, focus, elevation, geometry, and motion configuration belongs to m3e unless a selected official Material token is intentionally exposed by the public component contract.

A missing selected Material customization in renderer-owned behavior requires an m3e fix or explicit blocker. Do not reproduce private renderer systems in Vue merely to support a token.

## Verification

Verify only selected public Material tokens:

- exact official source and semantic path are recorded;
- canonical declaration and default exist;
- mapping targets a documented semantic m3e input;
- the token representation is valid for every selected current CSS consumer;
- a representative non-default override changes the intended public result when observable;
- rendered browser proof is required when the value grammar affects visible behavior; declaration presence or a computed token string alone is insufficient;
- no `--m3e-*` usage leaks outside `src/shared/ui/material`.

Do not require one test per renderer variable, a complete token matrix, computed-value assertions for unused declarations, tests of m3e defaults, or automated proof of renderer-owned animation.
