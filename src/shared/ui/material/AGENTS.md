# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary.

## Required workflow

- Read `docs/architecture.md`, `docs/component-adapter.md`, `docs/component-tokens.md`, `docs/roadmap.md`, and the selected family README.
- Use `material-component-adapter` for one explicitly selected official Material component.
- Use `architect-handoff` when a requirement changes cross-family ownership or renderer strategy, or cannot be assigned safely.
- If the selected component requires another official Material component, implement or complete that dependency as its own canonical `MD*` adapter before composing it.
- If the decision creates or changes a separate non-Material component under `src/shared/ui`, also apply `.agents/skills/shared-ui-implementation/SKILL.md`.

## Authority

1. Official Material 3 Expressive documentation owns the public `MD*` component model: names, concepts, options, values, states, defaults, valid combinations, compositions, behavior, visuals, and accessibility.
2. Current Mioframe consumers determine which subset is required now.
3. The exact lockfile-resolved `@m3e/web` contract determines what can be delegated to the private renderer.
4. The accepted family matrix records the selected Material subset, public Vue API, exact renderer mapping, dependencies, gaps, ownership, proof, and deferred surface.

m3e and legacy Mioframe components are implementation evidence, not public API authorities.

## Source interpretation

Inspect overview, specs, guidelines, and accessibility pages. Follow related-component placement and composition references.

- Token tables are not complete capability or validity matrices.
- Absence from one page, token family, m3e, legacy code, or tests is not proof of prohibition.
- Negative or restrictive decisions require positive official evidence.
- When official sources conflict, record `source-conflict`; do not invent a restriction.
- A composition mapping must distinguish the parent component's tokens from the dependency component's own constraints. Do not present a parent icon token as an official Loading indicator size or similar cross-family equivalence unless an official source establishes it.

## Material-first public API

A public `MD*` component exposes only the demand-scoped official Material contract, expressed idiomatically in Vue.

- Use Material terminology and semantics for public props, values, slots, events, states, defaults, and combinations.
- Do not expose raw m3e vocabulary or preserve conflicting legacy API.
- Do not add unused renderer/native surface for hypothetical completeness.
- If the public API permits two states simultaneously, define their precedence and verify the combination. Current consumers not using the combination is not evidence that it is invalid or unreachable.
- A combination may be rejected only through an explicit public/runtime contract backed by positive Material evidence.

## Official Material dependencies

An official Material component used by another `MD*` remains independently owned.

1. Identify it in the parent matrix.
2. Implement or complete its canonical demand-scoped `MD*` adapter first.
3. Give it its own official-source review, matrix, root public export, renderer typing, accessibility contract, token/presentation boundary, divergence record, tests, stories, visual proof, and operator review where applicable.
4. Make the parent compose the dependency adapter, not the raw dependency `m3e-*` element.
5. Keep the parent responsible only for composition meaning, placement, state, and public handoff.

A parent may directly import raw m3e only for its own renderer family and non-catalog renderer-internal primitives. Parents must not set dependency-private `--m3e-*` variables or type against dependency renderer classes.

## Renderer boundary and controlled workaround

Prefer documented m3e APIs. Do not access private shadow DOM, copy internals, build a parallel renderer, or spread renderer workarounds across parents.

A temporary exact-version renderer workaround is allowed only inside the canonical owning `MD*` adapter when all conditions hold:

- a selected current Material scenario requires the behavior;
- the documented m3e API is missing, broken, or observably divergent;
- the effective host-level input is confirmed from the exact lockfile-resolved implementation source;
- the workaround uses only a host property, attribute, or CSS custom property and does not access private DOM or methods;
- it remains private to the owning adapter and does not leak into its public Vue API, parents, or consumers;
- the matrix records renderer status `divergent`, decision `temporary-renderer-workaround`, long-term owner `m3e-fix`, exact version, risk, and removal trigger;
- focused tests prove the required observable result;
- every m3e version update revalidates or removes the workaround.

Such a workaround is technical debt, but not a blocker when the gate above is satisfied. It must not be used to replace renderer-owned interaction, accessibility, state, or motion systems.

## Renderer typing

- Derive Vue custom-element glue from the exported element class or `HTMLElementTagNameMap`.
- Handwritten `new () => HTMLElement` declarations are not package-derived.
- There is no exemption merely because the current adapter maps no typed renderer property.
- Keep public Material types independent and private mapper outputs constrained by exact package types.

## Accessibility and native behavior

- Put ARIA, native state, focus, and interaction semantics on the actual owner.
- Preserve normal native event propagation unless an accepted contract requires interception.
- For custom elements, attribute assertions alone do not prove accessibility. Browser proof must resolve the required role and accessible name from the actual rendered accessibility semantics.
- When a progress indicator is composed inside another interactive component, verify both the interactive owner and the progress semantics in the browser accessibility tree or record an explicit accepted alternative.

## Verification

Each selected adapter and required dependency must have proof matching its owned contract:

- package-derived type-check;
- colocated component-contract tests;
- browser tests for current native and accessibility scenarios;
- stories and visual evidence for independently owned stable presentation and geometry;
- exact-version divergence and reduced-motion assessment;
- parent-to-dependency handoff tests;
- final `pnpm verify`;
- operator visual/motion acceptance where applicable.

A parent screenshot does not replace independent visual evidence for a dependency that owns visible geometry or presentation.

Production-representable combinations such as disabled plus loading and selected plus loading must be covered when the API permits them.

## Completion truthfulness

A component remains `migrating` until its selected contract and dependencies are implemented, root-exported, verified, and accepted by the operator where required.

- Green CI is not architecture approval.
- A README or roadmap may say a scenario is covered only when an existing test or story asserts that exact scenario.
- Do not claim package-derived typing, accessibility-tree proof, root export, visual proof, or combination coverage from adjacent or indirect evidence.
- Do not mark a component `migrated`, a blocker resolved, or “no further implementation required” while required verification, operator review, source conflict, dependency work, or accepted temporary-workaround documentation remains incomplete.

## Boundary

Outside this directory, product code must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on private `--m3e-*` variables, or inspect renderer DOM.

Do not introduce Lit directly or create a generic adapter framework without a demonstrated repeated need and a separate architecture decision.
