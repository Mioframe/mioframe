# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary.

## Required workflow

- Read `docs/architecture.md`, `docs/component-adapter.md`, `docs/component-tokens.md`, `docs/roadmap.md`, and the selected family README.
- Use `material-component-adapter` for one explicitly selected Material component.
- Use `architect-handoff` when a requirement changes cross-family ownership, renderer strategy, or cannot be assigned safely to the Vue adapter or m3e.
- If the selected component requires another official Material component, implement or complete that dependency as its own canonical `MD*` adapter before composing it.
- If the decision creates or changes a separate non-Material component under `src/shared/ui`, also apply `.agents/skills/shared-ui-implementation/SKILL.md`.
- Keep Material policy inside this library.

## Authority

1. Official Material 3 Expressive documentation owns the public `MD*` component model: component names, concepts, options, values, states, defaults, valid combinations, composition patterns, behavior, visuals, and accessibility.
2. Current Mioframe consumers determine which subset of that Material contract is required now.
3. The exact lockfile-resolved `@m3e/web` public contract determines which parts of the selected Material subset can be delegated to the private renderer.
4. The accepted family contract matrix records the selected Material subset, public Vue API, m3e mapping, missing behavior, ownership, deferred surface, dependencies, and source gaps.

m3e and legacy Mioframe components are implementation evidence, not public API authorities.

## Source interpretation

Inspect the selected component's overview, specs, guidelines, and accessibility pages. Follow official references to related Material components when a requirement composes another primitive.

- Explicit official prose, normative tables, captions, and diagrams may positively establish a capability or combination.
- Token tables describe token coverage and values; they are not a complete validity matrix.
- Absence from one page, one token family, m3e, legacy code, or tests is not proof that a capability is unsupported.
- A missing token row must never be used to prohibit a combination that official overview or guidelines positively show.
- Prior Mioframe documentation must be corrected when official Material evidence contradicts it.

Before marking a combination invalid or a requirement `not-material`, require explicit positive evidence for that conclusion. Acceptable evidence is an official prohibition, a complete normative configuration matrix, or consistent unambiguous guidance across all relevant official pages.

When official sources conflict, record `source-conflict`, preserve existing supported behavior, and stop only the affected API decision. Do not invent a restriction.

## Material-first public API

A public `MD*` component must expose only Material concepts selected from official documentation, including documented cross-component compositions.

- Use Material terminology and semantics for public names, options, values, defaults, states, and invalid combinations.
- Adapt those concepts idiomatically to Vue through props, emits, slots, `v-model`, refs, and required native HTML integration without changing their meaning.
- Do not expose raw m3e vocabulary merely because the renderer supports it.
- Do not preserve a legacy Mioframe prop, state, extension, or naming choice unless it maps to the selected Material contract.
- Do not add public behavior that has no Material source without a separate architecture decision.
- Do not expose optional native or renderer surface for hypothetical completeness.

The implementation is demand-driven, not exhaustive. Implement only the Material surface required by current consumers plus the minimum adjacent surface needed for a coherent, forward-compatible API. Mark the rest `deferred`.

## Official Material dependencies

An official Material component used by another `MD*` component remains an independently owned Material component. It must not be reduced to a raw private renderer element embedded in the parent adapter.

When a selected component needs another official Material catalog component:

1. identify the dependency explicitly in the parent matrix;
2. create or complete the dependency's canonical Vue `MD*` adapter first;
3. give the dependency its own official-source review, demand-scoped Material–m3e–Vue matrix, public export, exact renderer typing, accessibility contract, token mapping, divergence record, tests, stories, visual proof, and operator review where applicable;
4. make the parent compose the dependency adapter, not the dependency's raw `m3e-*` element;
5. keep the parent responsible only for composition semantics, placement, state handoff, and any parent-specific public convenience API.

The dependency adapter remains demand-driven. It implements only the official Material subset required by its current direct consumers and parent compositions plus the minimum coherent adjacent surface. This rule does not require implementing the complete Material component catalog.

A parent adapter may directly import raw m3e only for its own renderer family and for renderer-internal primitives that are not separate official Material catalog components. It must not directly render a raw m3e element representing another official Material component with its own public Material contract.

If the required dependency adapter is missing, source-conflicted, renderer-blocked, or not verified, the parent remains `migrating` or `blocked`. The parent cannot be marked complete by hiding the unresolved dependency inside its implementation.

## Documented cross-component composition

A Material pattern remains Material when its source is owned by another official component page. For example, Loading indicator and Progress indicator guidance may define how an indicator is placed inside a Button.

Before classifying a requirement `not-material`:

1. inspect the selected component pages;
2. search related official component pages and placement/composition guidance;
3. record the exact cross-component source and dependency in the matrix.

Represent a documented composition through the smallest suitable Material-owned public API on the parent, but implement each official component participant through its canonical `MD*` adapter. A parent prop such as loading may be valid composition API; it must delegate rendering, accessibility, tokens, geometry, motion, and m3e integration to `MDLoadingIndicator` rather than embedding `m3e-loading-indicator` directly.

Do not create a non-MD wrapper only because the selected component page lacks a framework-specific prop.

## Required contract matrix

Before production implementation, the family README must contain a source-backed matrix with one row per relevant Material capability:

| Material contract and exact source | Required now and evidence | Public Vue API | m3e exact-version support | Implementation owner | Decision and verification |
| ---------------------------------- | ------------------------- | -------------- | ------------------------- | -------------------- | ------------------------- |

The matrix must cover public props, values, defaults, slots, events, native mappings, selected tokens, states, cross-component compositions, and official Material component dependencies.

For every dependency row, name the canonical `MD*` adapter, its status, its public contract used by the parent, and the verification required before the parent can complete.

For every negative or restrictive decision, record the positive official evidence establishing the restriction. “Not documented” and “no token route” are not sufficient.

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
- `blocked`;
- `source-conflict`.

No public API, production mapping, raw renderer dependency, or cross-component composition is accepted without a corresponding matrix row.

## Implementation ownership

Use m3e as much as possible for the selected Material contract.

- **Vue adapter** owns Material-to-Vue naming, typed mapping, slots, event normalization, controlled state, required native web integration, and narrow light-DOM composition.
- **Dependency `MD*` adapter** owns the complete Mioframe boundary for its official Material component, including its own renderer import, accessibility, tokens, geometry normalization, motion assessment, and public Vue API.
- **m3e** owns internal rendering, private DOM, geometry, state layer, ripple, focus treatment, elevation, motion, and private accessibility behavior inside the corresponding adapter.
- A missing Material capability may be implemented in the owning adapter only when it can be added explicitly through documented m3e APIs or Mioframe-owned light DOM without recreating renderer internals.
- A gap inside renderer-owned behavior requires an m3e fix or an explicit blocker; do not build a parallel renderer in Vue.

## Non-Material requirements

Only a requirement with no official selected-component or related-component source may be classified non-Material.

Resolve a true non-Material requirement as one of:

1. composition in a feature, widget, or consumer around the `MD*` component;
2. a separate shared component without the `MD` prefix;
3. an exceptional documented extension of the `MD*` API approved by an architecture decision.

The default is composition or a separate non-MD component. Existing legacy extensions remain provisional until this decision is made; compatibility alone does not make them Material API.

A separate non-MD component must satisfy `shared-ui-implementation`: one meaningful root, native and ARIA semantics on the actual owner, no duplicated child state/color matrices, colocated stories under its own non-Material category, focused consumer review, and final verification.

## Boundary

Only code under `src/shared/ui/material` may import `@m3e/web`, render `m3e-*`, use renderer types, or map documented `--m3e-*` variables.

Inside that boundary, raw m3e usage is still component-owned: each official Material renderer belongs inside the corresponding canonical `MD*` adapter. One `MD*` adapter must not bypass another adapter by rendering its official component's raw `m3e-*` element directly.

Do not leak renderer details, access private shadow DOM, use undocumented APIs, copy internals, duplicate renderer interaction systems, or create a generic adapter framework.

Preserve normal native event propagation unless an accepted contract explicitly requires interception. Put `aria-*`, native state, focus, and interaction semantics on the actual interactive owner. Avoid an extra wrapper when the canonical root can own the required semantics. Prefer inherited `currentColor` or another public presentation route over duplicating renderer variant/state color logic.

## Renderer typing

- Public Vue types are derived from the selected Material contract.
- Renderer properties and values are derived from exact family entry-point exports.
- Every Material-to-m3e mapping must type-check against the package-exported renderer type.
- Vue ambient declarations contain package-derived framework glue only.
- Do not publish m3e types or maintain handwritten renderer mirrors.
- Each dependency adapter owns its renderer declaration; a parent must type against the dependency's public Vue API rather than the dependency renderer type.

## Tokens

- Public `--md-ref-*`, `--md-sys-*`, and selected `--md-comp-*` names must follow verified Material token paths.
- Expose only the Material token subset required now; mark the rest deferred.
- A documented `--m3e-*` variable does not automatically become a public token.
- Composed components communicate through public Material tokens, props, slots, or inherited presentation owned by the dependency adapter; parents must not set the dependency's private `--m3e-*` inputs.
- Composed indicators and icons must follow official placement/contrast guidance and inherit the rendered label or icon color when Material specifies that relationship.
- Non-Material customization uses `--app-*` only after the same extension decision required for non-Material component API.
- Do not build a parallel component theme.

## Divergences and blockers

Compare m3e with official Material only for the selected and deferred-nearby surface recorded in the matrix.

- A non-required divergence is recorded for possible m3e work and does not expand the wrapper.
- A required divergence is assigned to `wrapper-correction` or `m3e-fix` according to ownership.
- `blocked` requires a selected Material requirement, a concrete observable gap, and no safe implementation path in either owner.
- Different internal implementation is not a divergence when the Material-observable result is equivalent.
- Incomplete official token coverage is a source gap, not an m3e divergence and not a reason to remove a positively documented capability.
- A dependency divergence belongs to the dependency adapter and must not be hidden or worked around independently by each parent.

## Motion verification

For renderer-owned motion:

- inspect the exact installed implementation source;
- confirm the adapter does not disable, replace, or duplicate it;
- require operator manual testing for visual quality and timing;
- do not use `:active`, screenshots, or private DOM tests as proof of internal animation.

## Verification and completion

Verification is risk-based and proves the selected public Material Vue contract, Material-to-m3e mappings, dependency-adapter contracts, documented compositions, wrapper-owned additions, consumer migration, and final repository health.

Tests must cover positively evidenced valid and invalid combinations, normal click bubbling, the actual ARIA/native owner, dependency handoff, and production-used combinations such as disabled plus loading.

A migration completes when:

- the source-backed contract matrix is accepted;
- the public Vue API is a demand-driven subset of official Material with no unresolved accidental extensions;
- every public capability has an official selected-component source, related-component composition source, or approved extension;
- every restrictive decision passes the source-evidence gate;
- selected Material capabilities are implemented by the correct owner;
- every required official Material dependency has a canonical accepted `MD*` adapter and the parent composes it through that public boundary;
- m3e divergences, source gaps, and deferred surface are recorded by the owning adapter;
- one canonical Vue owner remains for every Material component and consumers are migrated;
- package-derived renderer typing is used inside each owning adapter;
- relevant verification passes;
- operator accepts the visual and renderer-owned motion result.

A skill invocation must complete all repository-local work inside this bounded scope. `partial` is valid only when an explicit extension decision, unresolved official source conflict, required dependency adapter, m3e change, operator acceptance, or genuine external blocker remains.
