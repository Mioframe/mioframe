# Material token architecture

This document is the single architecture contract for CSS design tokens and token routing inside `src/shared/ui/material`.

The goal is a small directed graph that can be understood from names and file locations without a runtime registry, generator, token manager, or manually synchronized inventory.

## Core invariants

1. A token is a stable design decision with a semantic identity. A CSS custom property used only to route a selected value to one rendered property is an implementation variable, not a token.
2. Official Material tokens keep their exact official path. Do not shorten, reinterpret, or invent an `--md-*` alias.
3. Every token category has one owner and one allowed location.
4. References point from more specific tokens to more general tokens. They never point upward from reference/system roles into component or private implementation state.
5. A rendered CSS property consumes an official/project token directly or through one justified owner-local private route.
6. Custom-property chains must be as short as possible. Do not create base → state → rendered aliases when the CSS cascade can override one final private route directly.
7. Exact selectors and runtime values remain owned by code. Family documentation records semantic token surface, public overrides, private routing purpose, and known gaps—not a duplicate declaration ledger.

## Taxonomy

### Official Material tokens

Official tokens use exact Material paths converted from dot notation to CSS custom-property notation:

```text
md.ref.*            → --md-ref-*
md.sys.*            → --md-sys-*
md.comp.<family>.*  → --md-comp-<family>-*
```

Examples:

```text
md.sys.color.primary
→ --md-sys-color-primary

md.comp.button.filled.container.color
→ --md-comp-button-filled-container-color
```

These names are public override surface only when the official token exists and the family contract supports the corresponding scenario.

Do not declare an official-looking token merely for completeness. Every declared `--md-comp-*` token must route to supported rendered behavior or be removed until that behavior is implemented.

### Mioframe extension tokens

A required project extension that is not an official Material token uses the Mioframe namespace:

```text
--mio-sys-*
--mio-comp-<family>-*
```

An extension token requires a current scenario, explicit public/private status, owner, default value, compatibility decision, and proof. Do not place project extensions under `--md-ref-*`, `--md-sys-*`, or `--md-comp-*`.

### Private routing variables

Owner-local implementation variables use:

```text
--md-private-<owner>-*
```

They are not Material tokens and are never public API. Their purpose is limited to selecting or composing the final value consumed by a rendered CSS property or a narrow family-agnostic foundation bridge.

Examples:

```text
--md-private-button-container-color
--md-private-button-container-shape
--md-private-state-layer-color
```

Avoid ambiguous names such as:

```text
--md-button-border-radius
--md-button-height
--md-motion-duration
```

Such names look public but are neither exact Material tokens nor explicitly private implementation routes.

### External generic foundation contracts

A small closed set of `--md-*`-prefixed custom properties are shared, cross-boundary bridge contracts that predate this taxonomy and are not owned by any one Material family. Either direction is possible: a Material file may set a name whose default and other readers live outside Material, or a Material foundation file may declare a name that non-Material shared UI overrides:

```text
--md-content-color              declared at app root (src/shared/lib/md/index.css); read by
                                 src/shared/ui/Icon/MDSymbol.vue and consumed/overridden
                                 repository-wide
--md-container-color            declared at app root (src/shared/lib/md/index.css); consumed/
                                 overridden repository-wide
--md-symbol-size                 owned by src/shared/ui/Icon/MDSymbol.vue
--md-circular-progress-color     owned by src/shared/ui/material/components/progress-indicator/
                                 MDCircularProgressIndicator.vue
--md-focus-indicator-color        owned by src/shared/ui/material/foundation/state/
--md-focus-indicator-thickness     md-focus-indicator.css; overridden by MDSwitch, MDFab,
--md-focus-indicator-offset        MDExtendedFab, MDCard, and other non-Material shared UI
```

A Material file may set or declare one of these exact names without relocating it into a `*.tokens.css` file or renaming it to a private route: the name is not owned by the family or foundation domain that happens to touch it in Material, and must not be duplicated with a second (renamed) route only because the code now lives under `src/shared/ui/material/`. Do not invent new entries in this set. Adding a new entry requires updating this document with every real owner/consumer file across the boundary — a foundation-level decision, not a per-family one, since renaming without migrating every consumer silently breaks the override for whichever side is not updated.

## Ownership and location

Canonical token owners use this structure:

```text
src/shared/ui/material/
  foundation/
    tokens/
      reference.tokens.css
      system.tokens.css
      extensions.tokens.css   # only when a real cross-family Mioframe extension exists
  components/
    <family>/
      <family>.tokens.css
      <family implementation styles>
```

Rules:

- `reference.tokens.css` owns official `--md-ref-*` declarations.
- `system.tokens.css` owns official `--md-sys-*` declarations and theme-scoped system overrides.
- `extensions.tokens.css` owns only real cross-family `--mio-sys-*` extensions.
- `components/<family>/<family>.tokens.css` owns official `--md-comp-<family>-*` and family-local public `--mio-comp-<family>-*` declarations.
- Implementation styles own `--md-private-<owner>-*` routes and final CSS declarations.
- Token files contain token declarations and scoping selectors only. They do not own layout, state selectors, transitions, animations, or rendered-property declarations.
- One family token file is the default. Split it only when parts have independent loading, ownership, or proof—not because the file is long.

`src/shared/lib/md/tokens.css` is a temporary legacy owner during convergence. Existing declarations may remain until a foundation correction relocates a coherent reference/system group. New canonical Material work must not add component tokens, private Web adaptations, or new token categories there.

## Dependency direction

Value selection flows from general design roles toward rendered output:

```text
literal/reference source
        ↓
--md-ref-*
        ↓
--md-sys-* / --mio-sys-*
        ↓
--md-comp-* / --mio-comp-*
        ↓
--md-private-<owner>-*
        ↓
rendered CSS longhand
```

CSS `var()` references point in the opposite direction: a private route references a component/system token, a component token references system/reference tokens, and a system token references reference/system tokens. A general token never references a more specific level.

Detailed rules:

- `--md-ref-*` may use literals or other reference tokens.
- `--md-sys-*` may use reference or system tokens.
- `--md-comp-<family>-*` may use reference/system tokens or another official token from the same family.
- `--mio-sys-*` may use official reference/system tokens or another Mioframe system extension.
- `--mio-comp-<family>-*` may use official reference/system/component tokens for that family, Mioframe system extensions, or another Mioframe token from the same family.
- Official `--md-*` tokens never depend on `--mio-*` extensions or `--md-private-*` implementation routes.
- Token files never depend on private routes.
- A private route may depend on official tokens, Mioframe extension tokens, or another private route owned by the same concern.
- Cross-family component-token references are forbidden. A real shared semantic role belongs in foundation instead.
- Circular token references are forbidden.

## Routing to rendered properties

Prefer the shortest valid route:

```css
.md-button {
  background-color: var(--md-comp-button-filled-container-color);
}
```

Use one private route when configuration or state chooses among several tokens:

```css
.md-button {
  --md-private-button-container-color: var(--md-comp-button-filled-container-color);
  background-color: var(--md-private-button-container-color);
}

.md-button:hover {
  --md-private-button-container-color: var(--md-comp-button-filled-hovered-container-color);
}
```

Do not create parallel base, hover, pressed, and rendered aliases when selectors can override the one final route. A second private hop requires an independently changing owner or a narrow foundation bridge and must be justified in the family contract.

Each rendered property has one final owner. Do not let a parent, child, state layer, and pseudo-element compete to resolve the same visual property.

## CSS syntax and typed use

CSS custom properties are untyped until substituted. Therefore token correctness is not established by declaration presence.

- Prefer explicit longhands where shorthand parsing, resets, or list alignment can hide an invalid token value.
- Token-driven `transition` and `animation` contracts use longhands (`*-property`, `*-duration`, `*-timing-function`, and other applicable longhands) so each token's expected value kind is visible.
- A token routed to a CSS property must have a compatible value kind: color, length/percentage, time, easing function, number, shadow, font, or another explicitly supported grammar.
- Overshooting easing must be evaluated against the animated property's valid domain. It is not acceptable merely because the easing syntax parses.
- Fallbacks are used only for an intentionally optional external override. They must not hide a missing required token declaration.
- Browser proof must inspect the final computed longhands for token-driven shorthands and verify that the browser did not discard or reset the route.

Do not introduce broad `@property` registration merely to imitate a type system. Register a custom property only when its animation/interpolation behavior requires registration and the browser contract is explicitly owned and tested.

## Public surface

A custom property is public only when it is:

- an exact supported official token (`--md-ref-*`, `--md-sys-*`, `--md-comp-*`); or
- an explicitly documented Mioframe extension token (`--mio-sys-*`, `--mio-comp-*`).

`--md-private-*` routes are implementation details. Consumers must not depend on them.

The family or foundation README records:

- supported public token groups;
- project extension tokens;
- intentionally unsupported official surface;
- private routing responsibilities;
- token-related compatibility obligations and known gaps.

It does not copy every declaration or selector.

## Verification

Token correctness requires three different checks:

1. **Source evidence** — exact official name, semantic meaning, supported state/configuration, and applicable platform.
2. **Static architecture guard** — `scripts/materialTokenArchitecture.test.mjs` checks naming, placement, dependency direction, unresolved references, cycles, duplicate component-token declarations, and dead component tokens.
3. **Rendered proof** — final computed property, state routing, consumer inheritance/override behavior, browser parsing, and visible result where applicable.

The static guard does not prove official semantics or visual correctness. Browser screenshots do not prove naming, ownership, or dependency direction. All three are required for a token route classified `confirmed-compliant`.

## Correction policy

Token architecture is corrected before styling or motion built on top of the invalid route.

A token correction unit owns the smallest complete graph slice:

```text
official/project token declaration
→ allowed dependencies
→ optional single private route
→ final rendered property
→ focused static and rendered proof
```

Do not preserve a broken chain for compatibility unless a current external consumer is identified and a bounded migration/removal plan exists. Do not create aliases solely to keep old internal names alive.
