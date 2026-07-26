# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary.

## Required workflow

- Read `docs/architecture.md`, `docs/component-adapter.md`, `docs/component-tokens.md`, `docs/roadmap.md`, and the selected family README.
- Use `material-component-adapter` for one explicitly selected Material component.
- Use `architect-handoff` when a requirement is outside official Material, changes cross-family ownership, changes renderer strategy, or cannot be assigned safely to the Vue adapter or m3e.
- Keep Material policy inside this library.

## Authority

1. Official Material 3 Expressive documentation owns the public `MD*` component model: component names, concepts, options, values, states, defaults, valid combinations, behavior, visuals, and accessibility.
2. Current Mioframe consumers determine which subset of that Material contract is required now.
3. The exact lockfile-resolved `@m3e/web` public contract determines which parts of the selected Material subset can be delegated to the private renderer.
4. The accepted family contract matrix records the selected Material subset, public Vue API, m3e mapping, missing behavior, ownership, and deferred surface.

m3e and legacy Mioframe components are implementation evidence, not public API authorities.

## Material-first public API

A public `MD*` component must expose only Material concepts selected from official documentation.

- Use Material terminology and semantics for public names, options, values, defaults, states, and invalid combinations.
- Adapt those concepts idiomatically to Vue through props, emits, slots, `v-model`, refs, and native HTML integration without changing their meaning.
- Do not expose raw m3e vocabulary merely because the renderer supports it.
- Do not preserve a legacy Mioframe prop, state, extension, or naming choice unless it maps to the selected Material contract.
- Do not add public behavior that has no Material source without a separate architecture decision.

The implementation is demand-driven, not exhaustive. Implement only the Material surface required by current consumers plus the minimum adjacent surface needed for a coherent, forward-compatible API. Mark the rest `deferred`.

## Required contract matrix

Before production implementation, the family README must contain a source-backed matrix with one row per relevant Material capability:

| Material contract and source | Required now and evidence | Public Vue API | m3e exact-version support | Implementation owner | Decision and verification |
| ---------------------------- | ------------------------- | -------------- | ------------------------- | -------------------- | ------------------------- |

Allowed renderer statuses:

- `direct` — m3e implements the selected Material contract through documented public API;
- `partial` — m3e provides a base and the remaining Material behavior has an explicit owner;
- `missing` — m3e does not provide the selected Material capability;
- `divergent` — m3e provides observably different behavior;
- `not-applicable` — no renderer mapping is needed.

Allowed decisions:

- `implement-now`;
- `defer`;
- `wrapper-correction`;
- `m3e-fix`;
- `blocked`.

No public API or production mapping is accepted without a corresponding matrix row.

## Implementation ownership

Use m3e as much as possible for the selected Material contract.

- **Vue adapter** owns Material-to-Vue naming, typed mapping, slots, event normalization, controlled state, native web integration, and narrow light-DOM composition.
- **m3e** owns internal rendering, private DOM, geometry, state layer, ripple, focus treatment, elevation, motion, and private accessibility behavior.
- A missing Material capability may be implemented in the wrapper only when it can be added explicitly through documented m3e APIs or Mioframe-owned light DOM without recreating renderer internals.
- A gap inside renderer-owned behavior requires an m3e fix or an explicit blocker; do not build a parallel renderer in Vue.

## Non-Material requirements

A requirement with no official Material contract must not be added silently to an `MD*` component.

Resolve it separately as one of:

1. composition in a feature, widget, or consumer around the `MD*` component;
2. a separate shared component without the `MD` prefix;
3. an exceptional documented extension of the `MD*` API approved by an architecture decision.

The default is composition or a separate non-MD component. Existing legacy extensions remain provisional until this decision is made; compatibility alone does not make them Material API.

## Boundary

Only code under `src/shared/ui/material` may import `@m3e/web`, render `m3e-*`, use renderer types, or map documented `--m3e-*` variables.

Do not leak renderer details, access private shadow DOM, use undocumented APIs, copy internals, duplicate renderer interaction systems, or create a generic adapter framework.

## Renderer typing

- Public Vue types are derived from the selected Material contract.
- Renderer properties and values are derived from exact family entry-point exports.
- Every Material-to-m3e mapping must type-check against the package-exported renderer type.
- Vue ambient declarations contain package-derived framework glue only.
- Do not publish m3e types or maintain handwritten renderer mirrors.

## Tokens

- Public `--md-ref-*`, `--md-sys-*`, and selected `--md-comp-*` names must follow verified Material token paths.
- Expose only the Material token subset required now; mark the rest deferred.
- A documented `--m3e-*` variable does not automatically become a public token.
- Non-Material customization uses `--app-*` only after the same extension decision required for non-Material component API.
- Do not build a parallel component theme.

## Divergences and blockers

Compare m3e with official Material only for the selected and deferred-nearby surface recorded in the matrix.

- A non-required divergence is recorded for possible m3e work and does not expand the wrapper.
- A required divergence is assigned to `wrapper-correction` or `m3e-fix` according to ownership.
- `blocked` requires a selected Material requirement, a concrete observable gap, and no safe implementation path in either owner.
- Different internal implementation is not a divergence when the Material-observable result is equivalent.

## Motion verification

For renderer-owned motion:

- inspect the exact installed implementation source;
- confirm the adapter does not disable, replace, or duplicate it;
- require operator manual testing for visual quality and timing;
- do not use `:active`, screenshots, or private DOM tests as proof of internal animation.

## Verification and completion

Verification is risk-based and proves the selected public Material Vue contract, Material-to-m3e mappings, wrapper-owned additions, consumer migration, and final repository health.

A migration completes when:

- the source-backed contract matrix is accepted;
- the public Vue API is a demand-driven subset of official Material with no unresolved accidental extensions;
- selected Material capabilities are implemented by the correct owner;
- m3e divergences and deferred surface are recorded;
- one canonical Vue owner remains and consumers are migrated;
- package-derived renderer typing is used;
- relevant verification passes;
- operator accepts the visual and renderer-owned motion result.

A skill invocation must complete all repository-local work inside this bounded scope. `partial` is valid only when an explicit extension decision, m3e change, operator acceptance, or genuine external blocker remains.
